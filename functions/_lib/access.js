import { json, clean } from "./http.js";

let cachedJwks = null;
let cachedJwksAt = 0;

export function featureEnabled(env) {
  return String(env.LAB_FEATURE_ENABLED || "").toLowerCase() === "true";
}

function splitEmails(value) {
  return new Set(String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean));
}

function decodeBase64Url(value) {
  const normal = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(normal), (char) => char.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

async function jwks(env) {
  const teamDomain = clean(env.CLOUDFLARE_ACCESS_TEAM_DOMAIN).replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!teamDomain) throw new Error("CLOUDFLARE_ACCESS_TEAM_DOMAIN is missing.");
  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < 60 * 60 * 1000) return cachedJwks;
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) throw new Error(`Could not load Cloudflare Access certificates (${response.status}).`);
  cachedJwks = await response.json();
  cachedJwksAt = now;
  return cachedJwks;
}

async function verifyAccessJwt(request, env) {
  const token = clean(request.headers.get("Cf-Access-Jwt-Assertion"));
  if (!token) throw new Error("Cloudflare Access token was not received.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Cloudflare Access token is malformed.");
  const header = decodeJsonPart(parts[0]);
  const payload = decodeJsonPart(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Cloudflare Access token algorithm is not accepted.");
  const set = await jwks(env);
  const key = Array.isArray(set.keys) ? set.keys.find((item) => item.kid === header.kid) : null;
  if (!key) throw new Error("Cloudflare Access signing key was not found.");
  const cryptoKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!valid) throw new Error("Cloudflare Access token signature is invalid.");
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || Number(payload.exp) <= now) throw new Error("Cloudflare Access token has expired.");
  if (payload.nbf && Number(payload.nbf) > now + 30) throw new Error("Cloudflare Access token is not active yet.");
  const expectedAud = clean(env.CLOUDFLARE_ACCESS_AUD);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!expectedAud || !aud.includes(expectedAud)) throw new Error("Cloudflare Access audience does not match this lab.");
  const email = clean(payload.email || request.headers.get("Cf-Access-Authenticated-User-Email")).toLowerCase();
  if (!email) throw new Error("Cloudflare Access email claim is missing.");
  return { email, payload };
}

export async function requireLabAccess(context) {
  const { request, env } = context;
  if (!featureEnabled(env)) {
    return { response: json({ ok: false, code: "lab_disabled", message: "The ASCENT Dialogue Lab is currently switched off." }, 503) };
  }
  try {
    const identity = await verifyAccessJwt(request, env);
    const allowed = splitEmails(env.LAB_ALLOWED_EMAILS);
    if (!allowed.size || !allowed.has(identity.email)) {
      return { response: json({ ok: false, code: "not_approved", message: "This email is not approved for the private ASCENT test lab." }, 403) };
    }
    return identity;
  } catch (error) {
    return { response: json({ ok: false, code: "access_denied", message: error instanceof Error ? error.message : String(error) }, 401) };
  }
}

export async function requireLabAdmin(context) {
  const access = await requireLabAccess(context);
  if (access.response) return access;
  const admins = splitEmails(context.env.LAB_ADMIN_EMAILS);
  if (!admins.has(access.email)) {
    return { response: json({ ok: false, code: "admin_required", message: "Trainer lab access is restricted to approved administrators." }, 403) };
  }
  return access;
}
