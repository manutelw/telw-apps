// TELW team area (manuvikraman.com/team/) and its controls in the trainer admin.
// - /team/...            : staff pages. Cloudflare Access ("TELW Team" application) sits in front;
//                          this module also checks the Access token itself and fails closed.
// - /api/team/          : Manu's controls (people, logins, pages). Uses the existing IELTS admin sign-in.
// - /api/team/admin/...  : JSON endpoints for those controls.
// Page text lives in the TEAM_DB D1 database, never in this public repository.
// Secrets (set in the Cloudflare dashboard): CF_API_TOKEN, CF_ACCOUNT_ID.

const ORIGIN = 'https://manuvikraman.com';
const TRAINER = 'manutelw@gmail.com';
const ACCESS_NAME = 'TELW Team';
const ADMIN_PAGE = '/api/team/'; // under /api so the admin sign-in cookie (Path=/api) reaches it
const OLD_ADMIN = ['/ielts/admin/team', '/ielts/admin/team/'];
const API = '/api/team/admin/';
const SERVICE = 'https://telw-ielts-preview-worker.manutelw.workers.dev';
const ADMIN_COOKIE = '__Secure-telw_ielts_admin';
const UPSTREAM_COOKIE = '__Secure-telw_ielts';
const CF = 'https://api.cloudflare.com/client/v4';

const privateHeaders = {
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...privateHeaders, 'content-type': 'application/json; charset=utf-8' } });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fail = (message, status) => Object.assign(Error(message), { status });
const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;

function html(content, nonce) {
  const csp = `default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; ${nonce ? `script-src 'nonce-${nonce}'; connect-src 'self'; ` : ''}form-action 'self'; base-uri 'none'; frame-ancestors 'none'`;
  return new Response(content, { headers: { ...privateHeaders, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': csp } });
}

// ---------- Cloudflare API ----------
async function cf(env, path, init = {}) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) throw fail('Team access is not set up yet.', 503);
  const r = await fetch(`${CF}/accounts/${env.CF_ACCOUNT_ID}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  let data = null;
  try { data = await r.json(); } catch { /* ignore */ }
  if (!r.ok || !data?.success) {
    const msg = data?.errors?.[0]?.message || `Cloudflare error ${r.status}`;
    throw fail(`Cloudflare said: ${msg}`, 502);
  }
  return data.result;
}

let cache = { at: 0, app: null, policy: null, authDomain: null, keys: null };
async function accessSetup(env, fresh = false) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) throw fail('Team access is not set up yet.', 503);
  if (!fresh && cache.app && Date.now() - cache.at < 10 * 60 * 1000) return cache;
  const [apps, policies, org] = await Promise.all([
    cf(env, '/access/apps?per_page=100'),
    cf(env, '/access/policies?per_page=100'),
    cf(env, '/access/organizations'),
  ]);
  const app = (apps || []).find(a => a.name === ACCESS_NAME);
  const policy = (policies || []).find(p => p.name === ACCESS_NAME);
  if (!app) throw fail(`No Access application named "${ACCESS_NAME}" was found in Cloudflare.`, 503);
  if (!policy) throw fail(`No Access policy named "${ACCESS_NAME}" was found in Cloudflare.`, 503);
  if (!org?.auth_domain) throw fail('Cloudflare Zero Trust team name is missing.', 503);
  cache = { at: Date.now(), app, policy, authDomain: org.auth_domain, keys: cache.keys };
  return cache;
}

// ---------- Access token check (fails closed) ----------
const b64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
async function accessKeys(authDomain, refresh) {
  if (!refresh && cache.keys && Date.now() - cache.keys.at < 60 * 60 * 1000) return cache.keys.list;
  const r = await fetch(`https://${authDomain}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw fail('Could not check your sign-in.', 503);
  const list = (await r.json()).keys || [];
  cache.keys = { at: Date.now(), list };
  return list;
}
async function verifyAccess(request, env) {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const setup = await accessSetup(env);
  let header, payload;
  try {
    header = JSON.parse(new TextDecoder().decode(b64url(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(b64url(parts[1])));
  } catch { return null; }
  if (header.alg !== 'RS256' || !header.kid) return null;
  let jwk = (await accessKeys(setup.authDomain, false)).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await accessKeys(setup.authDomain, true)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== `https://${setup.authDomain}`) return null;
  if (!aud.includes(setup.app.aud)) return null;
  if (typeof payload.exp !== 'number' || payload.exp < now - 60) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null;
  if (typeof payload.email !== 'string' || !payload.email) return null;
  return payload.email.toLowerCase();
}

// ---------- Trainer admin session (existing IELTS admin sign-in) ----------
async function trainerSignedIn(request, env) {
  const values = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).filter(x => x.startsWith(ADMIN_COOKIE + '='));
  if (values.length !== 1) return false;
  const value = values[0].slice(ADMIN_COOKIE.length + 1);
  if (!/^[a-f0-9]{64}$/.test(value) || !env.IELTS_ADMIN_SERVICE?.fetch) return false;
  try {
    const r = await env.IELTS_ADMIN_SERVICE.fetch(new Request(new URL('/api/ielts/auth/session', SERVICE), {
      headers: { cookie: `${UPSTREAM_COOKIE}=${value}` }, redirect: 'manual', signal: AbortSignal.timeout(10000),
    }));
    if (!r.ok) return false;
    const d = await r.json();
    return typeof d?.email === 'string' && d.email.trim().toLowerCase() === TRAINER;
  } catch { return false; }
}

// ---------- Pages (D1) ----------
async function ensureTable(env) {
  if (!env.TEAM_DB) throw fail('Team pages database is not connected.', 503);
  await env.TEAM_DB.prepare('CREATE TABLE IF NOT EXISTS team_pages (slug TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 100, updated_at TEXT NOT NULL)').run();
}
async function listPages(env) {
  await ensureTable(env);
  const { results } = await env.TEAM_DB.prepare('SELECT slug, title, sort, updated_at FROM team_pages ORDER BY sort, title').all();
  return results || [];
}
async function getPage(env, slug) {
  await ensureTable(env);
  return env.TEAM_DB.prepare('SELECT slug, title, body, sort, updated_at FROM team_pages WHERE slug = ?').bind(slug).first();
}

// Small, safe markdown: headings, paragraphs, bullet and numbered lists, tables, **bold**, links.
function inline(t) {
  let s = esc(t);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (m, a, b) => `<a href="${b}" rel="noopener">${a}</a>`);
  return s;
}
export function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let out = '', i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { const n = Math.min(m[1].length + 1, 4); out += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r));
      if (!body.length) continue;
      out += '<div class="tbl"><table><thead><tr>' + cells(body[0]).map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      out += body.slice(1).map(r => '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('');
      out += '</tbody></table></div>';
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      out += '<ul>';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { out += `<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`; i++; }
      out += '</ul>'; continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      out += '<ol>';
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { out += `<li>${inline(lines[i].replace(/^\s*\d+[.)]\s+/, ''))}</li>`; i++; }
      out += '</ol>'; continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*\||\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) { para.push(lines[i]); i++; }
    out += `<p>${inline(para.join(' '))}</p>`;
  }
  return out;
}

const STYLE = `*{box-sizing:border-box}body{margin:0;font:16px/1.65 Arial,Helvetica,sans-serif;color:#1f2733;background:#f6f5f1}
header{background:#13233f;color:#fff;border-bottom:3px solid #c9953a}header .in{max-width:1080px;margin:0 auto;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
header b{font:22px Georgia,serif;letter-spacing:.06em}header small{display:block;color:#e2c37c;font-size:11px;letter-spacing:.14em;text-transform:uppercase}header a{color:#fff;font-size:14px}
main{max-width:1080px;margin:0 auto;padding:36px 22px 60px}h1{font:600 32px Georgia,serif;color:#13233f;margin:0 0 6px}h2{font:600 24px Georgia,serif;color:#13233f;margin:34px 0 10px}h3{color:#13233f}
.card{background:#fff;border:1px solid #e6e2da;border-radius:8px;padding:24px 26px;margin:18px 0}a{color:#13233f}
.list a{display:block;padding:14px 18px;border:1px solid #e6e2da;border-left:3px solid #c9953a;border-radius:6px;background:#fff;margin:10px 0;text-decoration:none;font-weight:bold}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:15px}th,td{border:1px solid #e6e2da;padding:9px 11px;text-align:left;vertical-align:top}th{background:#f3ebd9;color:#13233f}
.muted{color:#5b6472;font-size:14px}button,.btn{font:inherit;font-size:15px;background:#13233f;color:#fff;border:0;border-radius:6px;padding:9px 16px;cursor:pointer}
button.ghost{background:#fff;color:#13233f;border:1px solid #13233f}button.danger{background:#fff;color:#a12c2c;border:1px solid #a12c2c}button:disabled{opacity:.5}
input,textarea{font:inherit;width:100%;padding:9px 11px;border:1px solid #b9b4aa;border-radius:6px;background:#fff}textarea{min-height:340px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}
label{display:block;font-weight:bold;margin:12px 0 4px;font-size:14px}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.row input{flex:1;min-width:220px}
.person{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #eee}.person:last-child{border-bottom:0}
#status{min-height:24px;font-weight:bold;color:#13233f}.err{color:#a12c2c}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}.tabs button{background:#fff;color:#13233f;border:1px solid #c9953a}.tabs button[aria-selected=true]{background:#13233f;color:#fff;border-color:#13233f}[hidden]{display:none!important}`;

function shell(title, inner, right = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} | TELW Team</title><style>${STYLE}</style></head><body><header><div class="in"><div><b>TELW</b><small>Team area · insiders only</small></div><div>${right}</div></div></header><main>${inner}</main></body></html>`;
}

// ---------- Staff pages ----------
async function teamPages(request, env, url) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { ...privateHeaders, allow: 'GET' } });
  let email;
  try { email = await verifyAccess(request, env); } catch (e) { return html(shell('Not open yet', `<h1>The team area is not open yet</h1><p>${esc(e.status ? e.message : 'Please try again later.')}</p>`), null); }
  if (!email) return new Response('Please sign in through the TELW team login.', { status: 403, headers: { ...privateHeaders, 'content-type': 'text/plain; charset=utf-8' } });
  const signout = `<a href="/cdn-cgi/access/logout">Sign out (${esc(email)})</a>`;
  const slug = url.pathname.replace(/^\/team\/?/, '').replace(/\/$/, '');
  try {
    if (!slug) {
      const pages = await listPages(env);
      const list = pages.length ? `<div class="list">${pages.map(p => `<a href="/team/${esc(p.slug)}/">${esc(p.title)}</a>`).join('')}</div>` : '<p class="muted">No pages yet.</p>';
      return html(shell('Team area', `<h1>Team area</h1><p class="muted">For TELW team members only. Please don't share these pages outside the team.</p>${list}`, signout));
    }
    if (!SLUG.test(slug)) return new Response('Not found', { status: 404, headers: privateHeaders });
    const page = await getPage(env, slug);
    if (!page) return new Response('Not found', { status: 404, headers: privateHeaders });
    return html(shell(page.title, `<p><a href="/team/">← All team pages</a></p><div class="card">${renderMarkdown(page.body)}</div><p class="muted">Last updated ${esc(String(page.updated_at).slice(0, 10))}</p>`, signout));
  } catch (e) {
    return html(shell('Error', `<h1>Something went wrong</h1><p>${esc(e.status ? e.message : 'Please try again.')}</p>`));
  }
}

// ---------- Admin page ----------
function adminPage() {
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const inner = `<p><a href="/ielts/admin/diagnostics/">← Admin home</a></p><h1>Team access</h1>
<p class="muted">Only the people listed here can open <a href="/team/" target="_blank" rel="noopener">manuvikraman.com/team/</a>. They sign in with a one-time code sent to their email.</p>
<div class="tabs" role="tablist"><button role="tab" data-tab="people" aria-selected="true">People</button><button role="tab" data-tab="logins" aria-selected="false">Recent logins</button><button role="tab" data-tab="pages" aria-selected="false">Team pages</button></div>
<p id="status" role="status" aria-live="polite"></p>
<section id="tab-people" class="card"><h2 style="margin-top:0">People with access</h2>
<form id="addForm" class="row"><input id="newEmail" type="email" placeholder="name@example.com" maxlength="254" required aria-label="Email to add"><button type="submit">Add</button></form>
<div id="people"><p class="muted">Loading…</p></div>
<p class="muted">Remove takes away access for new sign-ins. Log out now also ends the session they already have open.</p></section>
<section id="tab-logins" class="card" hidden><h2 style="margin-top:0">Recent logins</h2><div id="logins"><p class="muted">Loading…</p></div></section>
<section id="tab-pages" class="card" hidden><h2 style="margin-top:0">Team pages</h2>
<div id="pages"><p class="muted">Loading…</p></div><p><button id="newPage" class="ghost" type="button">New page</button></p>
<form id="pageForm" hidden><label for="pTitle">Title</label><input id="pTitle" maxlength="120" required>
<label for="pSlug">Web address</label><div class="row"><span class="muted">manuvikraman.com/team/</span><input id="pSlug" maxlength="60" pattern="[a-z0-9][a-z0-9-]*" required></div>
<label for="pSort">Order in the list (smaller comes first)</label><input id="pSort" type="number" min="0" max="9999" value="100">
<label for="pBody">Text</label><textarea id="pBody" required></textarea>
<p class="muted">Formatting: start a line with ## for a heading, - for a bullet, 1. for a numbered step. Wrap words in **double stars** for bold. Tables use | between columns.</p>
<div class="row"><button type="submit">Save page</button><button id="cancelPage" class="ghost" type="button">Cancel</button><button id="delPage" class="danger" type="button" hidden>Delete page</button></div></form></section>
<script nonce="${nonce}">(()=>{
const el=id=>document.getElementById(id),st=el('status');
const say=(t,bad)=>{st.textContent=t;st.className=bad?'err':'';};
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
async function api(path,body){const r=await fetch('${API}'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});let d={};try{d=await r.json();}catch{}if(r.status===401){location.replace('/ielts/admin/');throw Error('Please sign in again.');}if(!r.ok)throw Error(d.error||'Please try again.');return d;}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',x===b));['people','logins','pages'].forEach(t=>el('tab-'+t).hidden=t!==b.dataset.tab);if(b.dataset.tab==='logins')loadLogins();if(b.dataset.tab==='pages')loadPages();});
async function loadPeople(){try{const d=await api('people');el('people').innerHTML=d.emails.length?d.emails.map(m=>'<div class="person"><span>'+e(m)+(m==='${TRAINER}'?' <span class="muted">(you)</span>':'')+'</span><span class="row">'+(m==='${TRAINER}'?'':'<button class="ghost" data-out="'+e(m)+'">Log out now</button><button class="danger" data-rm="'+e(m)+'">Remove</button>')+'</span></div>').join(''):'<p class="muted">Nobody yet.</p>';
el('people').querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove '+b.dataset.rm+'? They will not be able to sign in again.'))return;b.disabled=true;say('Removing…');try{await api('people/remove',{email:b.dataset.rm});say('Removed '+b.dataset.rm+' and logged them out.');loadPeople();}catch(x){say(x.message,1);b.disabled=false;}});
el('people').querySelectorAll('[data-out]').forEach(b=>b.onclick=async()=>{b.disabled=true;say('Logging out…');try{await api('people/logout',{email:b.dataset.out});say(b.dataset.out+' is logged out. They can sign in again if they are still on the list.');}catch(x){say(x.message,1);}b.disabled=false;});
}catch(x){el('people').innerHTML='<p class="err">'+e(x.message)+'</p>';}}
el('addForm').onsubmit=async ev=>{ev.preventDefault();const m=el('newEmail').value.trim().toLowerCase();say('Adding…');try{await api('people/add',{email:m});el('newEmail').value='';say('Added '+m+'. They can now sign in at manuvikraman.com/team/.');loadPeople();}catch(x){say(x.message,1);}};
async function loadLogins(){el('logins').innerHTML='<p class="muted">Loading…</p>';try{const d=await api('logins');el('logins').innerHTML=d.logins.length?'<div class="tbl"><table><thead><tr><th>When (India time)</th><th>Email</th><th>Result</th><th>Country</th></tr></thead><tbody>'+d.logins.map(l=>'<tr><td>'+e(new Date(l.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}))+'</td><td>'+e(l.email)+'</td><td>'+(l.allowed?'Let in':'Blocked')+'</td><td>'+e(l.country||'')+'</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">No logins yet.</p>';}catch(x){el('logins').innerHTML='<p class="err">'+e(x.message)+'</p>';}}
let editing=null;
async function loadPages(){try{const d=await api('pages');el('pages').innerHTML=d.pages.length?d.pages.map(p=>'<div class="person"><span><b>'+e(p.title)+'</b> <span class="muted">/team/'+e(p.slug)+'/</span></span><span class="row"><a class="btn" style="text-decoration:none" target="_blank" rel="noopener" href="/team/'+e(p.slug)+'/">View</a><button class="ghost" data-edit="'+e(p.slug)+'">Edit</button></span></div>').join(''):'<p class="muted">No pages yet.</p>';
el('pages').querySelectorAll('[data-edit]').forEach(b=>b.onclick=async()=>{say('Opening…');try{const d=await api('pages/get?slug='+encodeURIComponent(b.dataset.edit));openForm(d.page);say('');}catch(x){say(x.message,1);}});}catch(x){el('pages').innerHTML='<p class="err">'+e(x.message)+'</p>';}}
function openForm(p){editing=p?p.slug:null;el('pTitle').value=p?p.title:'';el('pSlug').value=p?p.slug:'';el('pSort').value=p?p.sort:100;el('pBody').value=p?p.body:'';el('delPage').hidden=!p;el('pageForm').hidden=false;el('pTitle').focus();}
el('newPage').onclick=()=>openForm(null);el('cancelPage').onclick=()=>{el('pageForm').hidden=true;};
el('pTitle').oninput=()=>{if(!editing)el('pSlug').value=el('pTitle').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);};
el('pageForm').onsubmit=async ev=>{ev.preventDefault();say('Saving…');try{await api('pages/save',{oldSlug:editing,slug:el('pSlug').value.trim(),title:el('pTitle').value.trim(),sort:Number(el('pSort').value)||0,body:el('pBody').value});say('Saved.');el('pageForm').hidden=true;loadPages();}catch(x){say(x.message,1);}};
el('delPage').onclick=async()=>{if(!editing||!confirm('Delete this page for everyone?'))return;try{await api('pages/delete',{slug:editing});say('Deleted.');el('pageForm').hidden=true;loadPages();}catch(x){say(x.message,1);}};
loadPeople();})();</script>`;
  return html(shell('Team access', inner, '<a href="/team/" target="_blank" rel="noopener">Open team area</a>'), nonce);
}

// ---------- Admin API ----------
function emailsFrom(policy) {
  return (policy.include || []).filter(r => r.email?.email).map(r => r.email.email.toLowerCase());
}
async function savePolicy(env, policy, emails) {
  const others = (policy.include || []).filter(r => !r.email?.email);
  const include = [...emails.map(email => ({ email: { email } })), ...others];
  const body = {};
  for (const k of ['name', 'decision', 'exclude', 'require', 'session_duration', 'approval_required', 'approval_groups', 'isolation_required', 'purpose_justification_required', 'purpose_justification_prompt', 'mfa_config']) {
    if (policy[k] !== undefined && policy[k] !== null) body[k] = policy[k];
  }
  body.include = include;
  const updated = await cf(env, `/access/policies/${policy.id}`, { method: 'PUT', body: JSON.stringify(body) });
  cache.policy = updated; cache.at = Date.now();
  return updated;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw fail('JSON required.', 415);
  const text = await request.text();
  if (text.length > 200000) throw fail('Too large.', 413);
  try { return JSON.parse(text); } catch { throw fail('Invalid request.', 400); }
}
async function adminApi(request, env, url) {
  const route = url.pathname.slice(API.length);
  const post = request.method === 'POST';
  if (post && request.headers.get('origin') !== ORIGIN) return json({ error: 'Please use the TELW website.' }, 403);
  if (!(await trainerSignedIn(request, env))) return json({ error: 'Please sign in again.' }, 401);
  try {
    if (route === 'people' && !post) {
      const s = await accessSetup(env, true);
      return json({ emails: emailsFrom(s.policy).sort() });
    }
    if (route === 'people/add' && post) {
      const email = String((await readJson(request)).email || '').trim().toLowerCase();
      if (!EMAIL.test(email)) return json({ error: 'That email address does not look right.' }, 400);
      const s = await accessSetup(env, true);
      const emails = emailsFrom(s.policy);
      if (emails.includes(email)) return json({ ok: true, already: true });
      if (emails.length >= 50) return json({ error: 'The free plan allows up to 50 people.' }, 400);
      await savePolicy(env, s.policy, [...emails, email]);
      return json({ ok: true });
    }
    if (route === 'people/remove' && post) {
      const email = String((await readJson(request)).email || '').trim().toLowerCase();
      if (email === TRAINER) return json({ error: 'You cannot remove yourself.' }, 400);
      const s = await accessSetup(env, true);
      await savePolicy(env, s.policy, emailsFrom(s.policy).filter(m => m !== email));
      await cf(env, '/access/organizations/revoke_user', { method: 'POST', body: JSON.stringify({ email }) }).catch(() => null);
      return json({ ok: true });
    }
    if (route === 'people/logout' && post) {
      const email = String((await readJson(request)).email || '').trim().toLowerCase();
      if (!EMAIL.test(email)) return json({ error: 'That email address does not look right.' }, 400);
      await cf(env, '/access/organizations/revoke_user', { method: 'POST', body: JSON.stringify({ email }) });
      return json({ ok: true });
    }
    if (route === 'logins' && !post) {
      const s = await accessSetup(env);
      const rows = await cf(env, '/access/logs/access_requests?limit=200&direction=desc');
      const logins = (rows || []).filter(r => r.app_uid === s.app.uid || r.app_uid === s.app.id || String(r.app_domain || '').includes('manuvikraman.com/team'))
        .slice(0, 50).map(r => ({ at: r.created_at, email: r.user_email, allowed: !!r.allowed, country: r.country }));
      return json({ logins });
    }
    if (route === 'pages' && !post) return json({ pages: await listPages(env) });
    if (route === 'pages/get' && !post) {
      const page = await getPage(env, String(url.searchParams.get('slug') || ''));
      return page ? json({ page }) : json({ error: 'Page not found.' }, 404);
    }
    if (route === 'pages/save' && post) {
      const b = await readJson(request);
      const slug = String(b.slug || '').trim().toLowerCase(), title = String(b.title || '').trim(), body = String(b.body || '');
      const oldSlug = b.oldSlug ? String(b.oldSlug) : null, sort = Math.max(0, Math.min(9999, Number(b.sort) || 0));
      if (!SLUG.test(slug)) return json({ error: 'Web address: use small letters, numbers and dashes only.' }, 400);
      if (!title || title.length > 120) return json({ error: 'Please add a title (up to 120 letters).' }, 400);
      if (!body.trim()) return json({ error: 'Please add some text.' }, 400);
      await ensureTable(env);
      const now = new Date().toISOString();
      if (oldSlug && oldSlug !== slug) {
        if (await getPage(env, slug)) return json({ error: 'Another page already uses that web address.' }, 400);
        await env.TEAM_DB.prepare('UPDATE team_pages SET slug = ?, title = ?, body = ?, sort = ?, updated_at = ? WHERE slug = ?').bind(slug, title, body, sort, now, oldSlug).run();
      } else if (oldSlug) {
        await env.TEAM_DB.prepare('UPDATE team_pages SET title = ?, body = ?, sort = ?, updated_at = ? WHERE slug = ?').bind(title, body, sort, now, slug).run();
      } else {
        if (await getPage(env, slug)) return json({ error: 'Another page already uses that web address.' }, 400);
        await env.TEAM_DB.prepare('INSERT INTO team_pages (slug, title, body, sort, updated_at) VALUES (?, ?, ?, ?, ?)').bind(slug, title, body, sort, now).run();
      }
      return json({ ok: true });
    }
    if (route === 'pages/delete' && post) {
      const slug = String((await readJson(request)).slug || '');
      await ensureTable(env);
      await env.TEAM_DB.prepare('DELETE FROM team_pages WHERE slug = ?').bind(slug).run();
      return json({ ok: true });
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.status ? e.message : 'Something went wrong. Please try again.' }, e.status || 500);
  }
}

// ---------- Router ----------
export async function handleTeam(request, env = {}) {
  const url = new URL(request.url);
  const p = url.pathname;
  const isTeam = p === '/team' || p.startsWith('/team/');
  const isOld = OLD_ADMIN.includes(p);
  const isAdmin = p === '/api/team' || p === ADMIN_PAGE;
  const isApi = p.startsWith(API);
  if (!isTeam && !isAdmin && !isApi && !isOld) return null;
  if (url.hostname === 'www.manuvikraman.com') return new Response(null, { status: 308, headers: { ...privateHeaders, location: ORIGIN + p + url.search } });
  if (url.origin !== ORIGIN) return new Response('Not found', { status: 404, headers: privateHeaders });
  if (isOld) return new Response(null, { status: 303, headers: { ...privateHeaders, location: ADMIN_PAGE } });
  if (isTeam) {
    if (p === '/team') return new Response(null, { status: 308, headers: { ...privateHeaders, location: '/team/' } });
    return teamPages(request, env, url);
  }
  if (isAdmin) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { ...privateHeaders, allow: 'GET' } });
    if (p !== ADMIN_PAGE) return new Response(null, { status: 303, headers: { ...privateHeaders, location: ADMIN_PAGE } });
    if (!(await trainerSignedIn(request, env))) return new Response(null, { status: 303, headers: { ...privateHeaders, location: '/ielts/admin/' } });
    return adminPage();
  }
  return adminApi(request, env, url);
}
