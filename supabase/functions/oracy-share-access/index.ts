import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const configuredFrom = Deno.env.get("ORACY_FROM_EMAIL") || "manu@telw.co.in";
const fromAddress = configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom;
const ORACY_FROM_EMAIL = `Manu Vikraman <${fromAddress}>`;
const PUBLIC_ORIGIN = "https://clarionprep.com";
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const ASCENT_URL = "https://vtqatrhwfvzyodiftvkc.supabase.co";
const ASCENT_KEY = "sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643";
const ASCENT_VALIDATE = ASCENT_URL + "/rest/v1/rpc/ascent_admin_trainer_entry_list";
const LEVELS: Record<string, [number, number]> = {
  B1A: [1, 7], B1B: [8, 15], B2A: [16, 22], B2B: [23, 30],
  C1A: [31, 37], C1B: [38, 45], C2A: [46, 52], C2B: [53, 60],
  D1A: [61, 67], D1B: [68, 75], D2A: [76, 82], D2B: [83, 90]
};

function headers(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "access-control-allow-origin": origin === PUBLIC_ORIGIN ? origin : PUBLIC_ORIGIN,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "cache-control": "no-store",
    "vary": "origin"
  };
}
function out(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers(req), "content-type": "application/json" } });
}
function clean(v: unknown) { return String(v ?? "").trim(); }
function emailOK(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 320; }
function html(v: unknown) { return clean(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }
function b64url(bytes: Uint8Array) { let s = ""; for (const x of bytes) s += String.fromCharCode(x); return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
function b64(bytes: Uint8Array) { let s = ""; for (const x of bytes) s += String.fromCharCode(x); return btoa(s); }
async function sha256(text: string) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return b64url(new Uint8Array(b)); }
async function passwordHash(password: string, saltB64: string) {
  const raw = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: raw, iterations: 120000 }, key, 256);
  return b64(new Uint8Array(bits));
}
async function validAdmin(token: string) {
  if (!token) return false;
  try {
    const r = await fetch(ASCENT_VALIDATE, { method: "POST", headers: { apikey: ASCENT_KEY, authorization: "Bearer " + ASCENT_KEY, "content-type": "application/json" }, body: JSON.stringify({ p_session_token: token }) });
    if (!r.ok) return false;
    const p = await r.json(); const x = Array.isArray(p) ? p[0] : p;
    return x?.ok === true;
  } catch { return false; }
}
async function requireAdmin(payload: any) {
  if (!(await validAdmin(clean(payload?.ascent_session_token)))) throw new Error("ADMIN_REQUIRED");
}
function scope(payload: any) {
  const rawSelectedUnits = Array.isArray(payload?.selected_units) ? payload.selected_units.map((x: unknown) => clean(x).toUpperCase()) : [];
  const includesUnit1A = rawSelectedUnits.includes("1A");
  const selectedUnits = rawSelectedUnits.map(Number).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 90);
  const selectedLevels = Array.isArray(payload?.selected_levels) ? payload.selected_levels.map((x: unknown) => clean(x).toUpperCase()).filter((x: string) => LEVELS[x]) : [];
  if (selectedUnits.length || selectedLevels.length || includesUnit1A) {
    const units = new Set<number>(selectedUnits);
    if (includesUnit1A) units.add(1);
    for (const level of selectedLevels) {
      const [from, to] = LEVELS[level];
      for (let n = from; n <= to; n++) units.add(n);
    }
    const sorted = [...units].sort((a, b) => a - b);
    const parts = [...selectedLevels.map((x: string) => `Level ${x}`), ...(includesUnit1A ? ["Unit 1A"] : []), ...selectedUnits.filter((n: number) => !selectedLevels.some((l: string) => n >= LEVELS[l][0] && n <= LEVELS[l][1])).map((n: number) => `Unit ${n}`)];
    const label = parts.length <= 5 ? parts.join(", ") : `${selectedLevels.length} level(s) and ${selectedUnits.length} selected unit(s)`;
    return { type: sorted.length === 1 && parts.length === 1 ? "unit" : "selection", key: selectedLevels.join(",") || rawSelectedUnits.join(","), label, units: sorted, destination: includesUnit1A && parts.length === 1 ? "/oracy/unit-1a.html" : sorted.length === 1 && parts.length === 1 ? `/oracy/unit-${sorted[0]}.html` : "/oracy/" };
  }
  const type = clean(payload?.scope_type).toLowerCase();
  const key = clean(payload?.scope_key).toUpperCase();
  if (type === "level" && LEVELS[key]) {
    const [from, to] = LEVELS[key];
    return { type, key, label: `Level ${key}`, units: Array.from({ length: to - from + 1 }, (_, i) => from + i), destination: `/oracy/?level=${key}` };
  }
  if (type === "unit" && key === "1A") return { type, key, label: "Unit 1A", units: [1], destination: "/oracy/unit-1a.html" };
  const n = Number(key);
  if (type === "unit" && Number.isInteger(n) && n >= 1 && n <= 90) return { type, key: String(n), label: `Unit ${n}`, units: [n], destination: `/oracy/unit-${n}.html` };
  return null;
}
async function sendEmail(to: string, subject: string, content: string) {
  if (!RESEND_API_KEY) return { ok: false, error: "Existing ORACY email service is not configured." };
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ from: ORACY_FROM_EMAIL, to: [to], subject, html: content }) });
  const d = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, id: clean(d.id) } : { ok: false, error: clean(d.message) || "Email could not be sent." };
}

async function createInvites(payload: any, req: Request) {
  await requireAdmin(payload);
  const selected = scope(payload);
  if (!selected) return out(req, { ok: false, message: "Choose a valid ORACY unit or level." }, 400);
  const parsed = (Array.isArray(payload?.emails) ? payload.emails : clean(payload?.emails).split(/[\s,;]+/)).map((x: unknown) => clean(x).toLowerCase()).filter(Boolean);
  const emails = [...new Set(parsed)];
  if (!emails.length || emails.some(x => !emailOK(x))) return out(req, { ok: false, message: "Enter valid recipient email addresses." }, 400);
  const durationDays = Number(payload?.duration_days);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 7) return out(req, { ok: false, message: "Choose an access period from 1 to 7 days." }, 400);
  const results: any[] = [];
  for (const email of emails) {
    const raw = new Uint8Array(32); crypto.getRandomValues(raw); const token = b64url(raw);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const ins = await db.from("oracy_share_invites").insert({ email, scope_type: selected.type, scope_key: selected.key, scope_label: selected.label, unit_numbers: selected.units, destination_path: selected.destination, token_hash: await sha256(token), expires_at: expiresAt.toISOString(), access_duration_days: durationDays }).select("id").single();
    if (ins.error) { results.push({ email, ok: false, error: "Invite could not be created." }); continue; }
    const link = `${PUBLIC_ORIGIN}/oracy/redeem?token=${encodeURIComponent(token)}`;
    const expiry = expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const content = `<div style="font-family:Arial,sans-serif;color:#17324f;line-height:1.6;max-width:620px"><h2>ORACY by TELW</h2><p>You have been granted free access to <strong>${html(selected.label)}</strong> for <strong>${durationDays} day${durationDays === 1 ? "" : "s"}</strong>.</p><p><a href="${link}" style="display:inline-block;background:#17324f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Open ORACY</a></p><p>This private, one-time link must be opened before <strong>${html(expiry)} IST</strong> and is intended only for <strong>${html(email)}</strong>.</p><p>Your access period begins when you open the link. It will automatically become invalid after ${durationDays} day${durationDays === 1 ? "" : "s"}. To continue using ORACY after that, you will need to purchase access.</p><p style="color:#6b7a89;font-size:13px">Sent by Manu Vikraman · ORACY by TELW</p></div>`;
    const mail = await sendEmail(email, `Your ORACY access: ${selected.label}`, content);
    await db.from("oracy_share_invites").update(mail.ok ? { status: "sent", sent_at: new Date().toISOString(), email_provider_id: mail.id } : { status: "failed", error_message: mail.error }).eq("id", ins.data.id);
    results.push({ email, ok: mail.ok, error: mail.ok ? null : mail.error });
  }
  return out(req, { ok: true, results });
}
async function listInvites(payload: any, req: Request) {
  await requireAdmin(payload);
  await db.from("oracy_share_invites").update({ status: "expired" }).in("status", ["pending", "sent"]).lt("expires_at", new Date().toISOString());
  const { data, error } = await db.from("oracy_share_invites").select("id,email,scope_type,scope_key,scope_label,unit_numbers,access_duration_days,status,expires_at,created_at,sent_at,redeemed_at,revoked_at,error_message").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return out(req, { ok: true, invites: data || [], email_configured: Boolean(RESEND_API_KEY) });
}
async function revokeInvite(payload: any, req: Request) {
  await requireAdmin(payload);
  const id = clean(payload?.invite_id);
  const { data, error } = await db.from("oracy_share_invites").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", id).in("status", ["pending", "sent"]).select("id").maybeSingle();
  if (error) throw error;
  if (!data) return out(req, { ok: false, message: "Only an unused active invite can be revoked." }, 409);
  return out(req, { ok: true });
}
async function redeem(payload: any, req: Request) {
  const token = clean(payload?.token);
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return out(req, { ok: false, message: "This access link is invalid." }, 400);
  const salt = new Uint8Array(16); crypto.getRandomValues(salt); const saltB64 = b64(salt);
  const hidden = new Uint8Array(32); crypto.getRandomValues(hidden); const password = b64url(hidden);
  const session = new Uint8Array(32); crypto.getRandomValues(session); const sessionToken = b64url(session);
  const sessionExpires = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db.rpc("oracy_redeem_share_invite", { p_token_hash: await sha256(token), p_password_salt: saltB64, p_password_hash: await passwordHash(password, saltB64), p_session_token_hash: await sha256(sessionToken), p_session_expires_at: sessionExpires });
  if (error) throw error;
  if (!data?.ok) return out(req, { ok: false, code: data?.code, message: data?.code === "EXPIRED" ? "This access link has expired." : "This access link is invalid, used, or revoked." }, 410);
  return out(req, { ok: true, session_token: sessionToken, expires_at: sessionExpires, destination_path: data.destination_path, scope_label: data.scope_label });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  if (req.method !== "POST") return out(req, { ok: false, message: "Use POST." }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== PUBLIC_ORIGIN) return out(req, { ok: false, message: "Origin not allowed." }, 403);
  try {
    const payload = await req.json().catch(() => ({}));
    switch (clean(payload?.action).toUpperCase()) {
      case "ADMIN_CREATE": return await createInvites(payload, req);
      case "ADMIN_LIST": return await listInvites(payload, req);
      case "ADMIN_REVOKE": return await revokeInvite(payload, req);
      case "REDEEM": return await redeem(payload, req);
      default: return out(req, { ok: false, message: "Unknown action." }, 400);
    }
  } catch (e) {
    if (clean(e?.message || e) === "ADMIN_REQUIRED") return out(req, { ok: false, message: "Administrator access required." }, 403);
    console.error("oracy-share-access", e);
    return out(req, { ok: false, message: "Request failed." }, 500);
  }
});
