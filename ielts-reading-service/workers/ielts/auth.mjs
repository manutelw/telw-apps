// Server-only IELTS identity. No tokens, codes, IPs or email addresses in logs.
const ORIGIN = 'https://manuvikraman.com';
const COOKIE = '__Secure-telw_ielts';
const SESSION_SECONDS = 12 * 60 * 60;
const CODE_SECONDS = 10 * 60;
const encoder = new TextEncoder();
export function reply(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...extra
  }});
}
class AuthError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
function configured(env) {
  if (!env.IELTS_DB || typeof env.IELTS_AUTH_SECRET !== 'string' || env.IELTS_AUTH_SECRET.length < 32)
    throw new AuthError('Email verification is not available yet. Please try later.', 503);
}
export function requireSameOrigin(request) {
  if (new URL(request.url).origin !== ORIGIN || request.headers.get('origin') !== ORIGIN)
    throw new AuthError('Please use the TELW website to make this request.', 403);
}
export async function readJson(request, limit = 4096) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new AuthError('JSON required.', 415);
  if (Number(request.headers.get('content-length')) > limit) throw new AuthError('Request too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError('Request body required.', 400);
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new AuthError('Request too large.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); }
  catch { throw new AuthError('Invalid JSON.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AuthError('Invalid request.', 400);
  return body;
}
function hex(bytes) { return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function digest(value) { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
async function keyed(env, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.IELTS_AUTH_SECRET), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function randomToken() { return hex(crypto.getRandomValues(new Uint8Array(32))); }
function randomCode() {
  const n = new Uint32Array(1); do { crypto.getRandomValues(n); } while (n[0] >= 4200000000);
  return String(n[0] % 100000000).padStart(8, '0');
}
function emailAddress(input) {
  if (typeof input !== 'string') throw new AuthError('Enter a valid email address.', 400);
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email))
    throw new AuthError('Enter a valid email address.', 400);
  return email;
}
// Atomic increment, including concurrent requests. Identifiers are HMACs, not raw IP/email.
export async function limit(env, key, seconds, maximum, now) {
  const bucket = Math.floor(now / seconds), expires = (bucket + 1) * seconds;
  const row = await env.IELTS_DB.prepare(`INSERT INTO ielts_auth_limits(bucket_key,hits,expires_at) VALUES(?1,1,?2)
    ON CONFLICT(bucket_key) DO UPDATE SET hits=hits+1 RETURNING hits`).bind(key+':'+bucket, expires).first();
  if (!row || row.hits > maximum) throw new AuthError('Too many requests. Please wait before trying again.', 429);
}
async function ipLimit(request, env, action, maximum, now) {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) throw new AuthError('Verification is unavailable from this connection.', 503);
  await limit(env, action+':'+await keyed(env, 'ip:'+ip), 3600, maximum, now);
}
const cookie = (token, seconds) => `${COOKIE}=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
function readToken(request) {
  const matches = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
  if (matches.length !== 1) return '';
  const token = matches[0].slice(COOKIE.length+1);
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}
export async function getLearner(request, env, now = Math.floor(Date.now()/1000)) {
  configured(env);
  const token = readToken(request); if (!token) return null;
  return env.IELTS_DB.prepare(`SELECT l.id,l.email,l.verified_at,s.expires_at FROM ielts_sessions s
    JOIN ielts_learners l ON l.id=s.learner_id WHERE s.token_hash=?1 AND s.revoked_at IS NULL
    AND s.expires_at>?2 AND l.verified_at>0`).bind(await digest(token), now).first();
}
async function requestCode(request, env, now) {
  if (!env.RESEND_API_KEY || !env.TELW_FROM_EMAIL) throw new AuthError('Email service is not available yet.', 503);
  await ipLimit(request, env, 'send', 20, now);
  const body = await readJson(request), email = emailAddress(body.email);
  if (body.consent !== true) throw new AuthError('Please accept the diagnostic privacy notice.', 400);
  const emailHash = await keyed(env, 'email:'+email);
  await limit(env, 'email-hour:'+emailHash, 3600, 5, now);
  // A rolling minimum interval; fixed minute boundaries cannot bypass it.
  const recent = await env.IELTS_DB.prepare(`SELECT id FROM ielts_email_challenges WHERE email_hash=?1 AND created_at>?2 LIMIT 1`).bind(emailHash, now-60).first();
  if (recent) throw new AuthError('Please wait one minute before requesting another code.', 429);
  const claim = await env.IELTS_DB.prepare(`INSERT INTO ielts_auth_limits(bucket_key,hits,expires_at) VALUES(?1,?2,?3)
    ON CONFLICT(bucket_key) DO UPDATE SET hits=excluded.hits,expires_at=excluded.expires_at
    WHERE ielts_auth_limits.hits<=?4 RETURNING hits`).bind('email-send:'+emailHash, now, now+3600, now-60).first();
  if (!claim) throw new AuthError('Please wait one minute before requesting another code.', 429);
  const id = crypto.randomUUID(), code = randomCode(), hash = await keyed(env, 'code:'+id+':'+code);
  await env.IELTS_DB.prepare(`INSERT INTO ielts_email_challenges(id,email_hash,email,code_hash,expires_at,created_at)
    VALUES(?1,?2,?3,?4,?5,?6)`).bind(id,emailHash,email,hash,now+CODE_SECONDS,now).run();
  let sent = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method:'POST', signal:AbortSignal.timeout(15000),
      headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':'ielts-code-'+id},
      body:JSON.stringify({from:env.TELW_FROM_EMAIL,to:[email],subject:'Your TELW IELTS verification code',
        text:`Your code is ${code}. It expires in 10 minutes and can be used once. Enter it only at ${env.IELTS_VERIFICATION_PUBLIC_ORIGIN || ORIGIN}. If you did not request this, ignore this email.\n\nTELW The English Workshop`})
    }); sent = response.ok;
  } catch { /* Never expose provider responses or secrets. */ }
  if (!sent) {
    await env.IELTS_DB.prepare('UPDATE ielts_email_challenges SET consumed_at=?1 WHERE id=?2').bind(now,id).run();
    throw new AuthError('We could not send your code. Please wait a minute and try again.', 502);
  }
  return reply({ok:true, challengeId:id, expiresIn:CODE_SECONDS});
}
async function verifyCode(request, env, now) {
  await ipLimit(request, env, 'verify', 30, now);
  const body = await readJson(request);
  if (typeof body.challengeId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.challengeId) || !/^\d{8}$/.test(body.code || ''))
    throw new AuthError('Enter the eight-digit code from your email.', 400);
  // Attempt reservation and successful consumption are both atomic; at most one caller consumes.
  const challenge = await env.IELTS_DB.prepare(`UPDATE ielts_email_challenges SET attempts=attempts+1
    WHERE id=?1 AND consumed_at IS NULL AND expires_at>?2 AND attempts<5 RETURNING id`).bind(body.challengeId,now).first();
  if (!challenge) throw new AuthError('Code is invalid or expired. Request a new code.', 400);
  const codeHash = await keyed(env, 'code:'+body.challengeId+':'+body.code);
  const consumed = await env.IELTS_DB.prepare(`UPDATE ielts_email_challenges SET consumed_at=?1
    WHERE id=?2 AND code_hash=?3 AND consumed_at IS NULL AND expires_at>?1 RETURNING email_hash,email`).bind(now,body.challengeId,codeHash).first();
  if (!consumed?.email) throw new AuthError('Code is invalid or expired. Request a new code.', 400);
  const token = randomToken(), tokenHash = await digest(token);
  await env.IELTS_DB.batch([
    env.IELTS_DB.prepare(`INSERT INTO ielts_learners(id,email_hash,email,verified_at,created_at) VALUES(?1,?2,?3,?4,?4)
      ON CONFLICT(email_hash) DO UPDATE SET verified_at=excluded.verified_at`).bind(crypto.randomUUID(),consumed.email_hash,consumed.email,now),
    env.IELTS_DB.prepare(`INSERT INTO ielts_sessions(token_hash,learner_id,created_at,expires_at)
      SELECT ?1,id,?2,?3 FROM ielts_learners WHERE email_hash=?4`).bind(tokenHash,now,now+SESSION_SECONDS,consumed.email_hash)
  ]);
  return reply({ok:true,email:consumed.email,expiresAt:now+SESSION_SECONDS},200,{'set-cookie':cookie(token,SESSION_SECONDS)});
}
export async function handleAuth(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/ielts/auth/')) return null;
  if (url.origin !== ORIGIN) return reply({error:'Not found'},404);
  const route = url.pathname.slice('/api/ielts/auth/'.length);
  if (!['request-code','verify-code','session','logout'].includes(route)) return reply({error:'Not found'},404);
  const expected = route === 'session' ? 'GET' : 'POST';
  if (request.method !== expected) return reply({error:'Method not allowed'},405,{allow:expected});
  try {
    configured(env);
    if (expected === 'POST') requireSameOrigin(request);
    const now = Math.floor(Date.now()/1000);
    if (route === 'request-code') return await requestCode(request,env,now);
    if (route === 'verify-code') return await verifyCode(request,env,now);
    if (route === 'session') {
      const learner = await getLearner(request,env,now);
      return learner ? reply({ok:true,email:learner.email,expiresAt:learner.expires_at}) : reply({ok:false},401);
    }
    const token = readToken(request);
    if (token) await env.IELTS_DB.prepare('UPDATE ielts_sessions SET revoked_at=?1 WHERE token_hash=?2').bind(now,await digest(token)).run();
    return reply({ok:true},200,{'set-cookie':cookie('',0)});
  } catch (error) {
    return reply({ok:false,error:error instanceof AuthError ? error.message : 'Verification is temporarily unavailable. Please try later.'},error instanceof AuthError ? error.status : 503);
  }
}
