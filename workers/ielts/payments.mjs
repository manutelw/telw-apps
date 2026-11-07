// TELW IELTS payments on manuvikraman.com: the price and policy pages, Razorpay orders,
// payment verification and the Razorpay webhook. Paid credits go to PAY_DB, which the Reading,
// Listening and Writing apps check before a new test starts. No login is needed to pay: the
// credits belong to the email address the buyer enters, and the tests verify that address.
import {normalEmail, TRAINER_EMAIL, SKILLS, issueReplacement} from './credits.mjs';

const ORIGIN = 'https://manuvikraman.com';
const API = '/api/ielts/pay/';
const VALID_DAYS = 180;
export const PRODUCTS = {
  bundle: {name: 'Full diagnosis: Reading, Listening and Writing', amount: 79900, skills: ['reading', 'listening', 'writing']},
  writing: {name: 'Writing diagnostic', amount: 49900, skills: ['writing']},
  reading: {name: 'Reading diagnostic', amount: 29900, skills: ['reading']},
  listening: {name: 'Listening diagnostic', amount: 29900, skills: ['listening']}
};
const PAGES = new Map([
  ['/ielts/pay/', '/ielts-pay/index.html'],
  ['/ielts/terms/', '/ielts-pay/terms.html'],
  ['/ielts/refund/', '/ielts-pay/refund.html'],
  ['/ielts/privacy/', '/ielts-pay/privacy.html'],
  ['/ielts/report/', '/ielts-pay/report.html'],
  ['/ielts/pay/report.js', '/ielts-pay/report.js'],
  ['/ielts/pay/admin/', '/ielts-pay/admin.html'],
  ['/ielts/pay/admin.js', '/ielts-pay/admin.js'],
  ['/ielts/pay/pay.js', '/ielts-pay/pay.js'],
  ['/ielts/pay/policy.css', '/ielts-pay/policy.css']
]);
const SECURITY = {'referrer-policy': 'same-origin', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY'};
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {...SECURITY, 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8'}});
const fail = (message, status) => Object.assign(new Error(message), {status});
const enc = new TextEncoder();
const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

export async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}
function same(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const ready = env => Boolean(env.PAY_DB && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

async function readJson(request, max = 4096) {
  const text = await request.text();
  if (text.length > max) throw fail('Request too large.', 413);
  try { return JSON.parse(text); } catch { throw fail('Invalid request.', 400); }
}

async function servePage(request, env, assetPath) {
  const asset = new URL(request.url); asset.pathname = assetPath;
  let response = await env.ASSETS.fetch(new Request(asset.toString(), {method: request.method === 'HEAD' ? 'HEAD' : 'GET'}));
  // Static assets may canonicalise .html to an extensionless path. Keep that internal.
  if (response.status >= 300 && response.status < 400) {
    const target = new URL(response.headers.get('location') || '', asset);
    if (target.origin !== asset.origin) return new Response('Page unavailable', {status: 502});
    response = await env.ASSETS.fetch(new Request(target.toString(), {method: 'GET'}));
  }
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY)) headers.set(k, v);
  headers.set('cache-control', 'no-store, max-age=0');
  headers.delete('location');
  return new Response(request.method === 'HEAD' ? null : response.body, {status: response.ok ? 200 : response.status, headers});
}

async function createOrder(request, env, now) {
  if (request.headers.get('origin') !== ORIGIN) throw fail('Please use the TELW website.', 403);
  const body = await readJson(request);
  const email = normalEmail(body.email), product = PRODUCTS[body.product];
  if (!product) throw fail('Choose a diagnostic.', 400);
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('Enter a valid email address.', 400);
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: {authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET), 'content-type': 'application/json'},
    body: JSON.stringify({amount: product.amount, currency: 'INR', receipt: 'ielts-' + crypto.randomUUID().slice(0, 30), notes: {email, product: body.product}})
  });
  if (!response.ok) throw fail('Payment could not be started. Please try again shortly.', 502);
  const order = await response.json();
  if (typeof order.id !== 'string' || order.amount !== product.amount) throw fail('Payment could not be started. Please try again shortly.', 502);
  await env.PAY_DB.prepare(`INSERT INTO ielts_pay_orders(id,email,product,amount,created_at) VALUES(?1,?2,?3,?4,?5)`).bind(order.id, email, body.product, product.amount, now).run();
  return json({ok: true, keyId: env.RAZORPAY_KEY_ID, orderId: order.id, amount: product.amount, currency: 'INR', email, product: body.product, name: product.name});
}

// Marks an order paid and creates its credits. Safe to repeat: the browser and the webhook may both report the same payment.
export async function grant(env, orderId, paymentId, amount, now) {
  const order = await env.PAY_DB.prepare(`SELECT * FROM ielts_pay_orders WHERE id=?1`).bind(String(orderId)).first();
  if (!order) return null;
  if (amount !== undefined && amount !== order.amount) throw fail('The payment amount does not match the order.', 400);
  await env.PAY_DB.prepare(`UPDATE ielts_pay_orders SET status='paid',payment_id=?1,paid_at=?2 WHERE id=?3 AND status='created'`).bind(String(paymentId), now, order.id).run();
  const skills = PRODUCTS[order.product]?.skills || [];
  await env.PAY_DB.batch(skills.map(skill => env.PAY_DB.prepare(`INSERT OR IGNORE INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES(?1,?2,?3,?4,?5,?6)`)
    .bind(crypto.randomUUID(), order.id, order.email, skill, now, now + VALID_DAYS * 86400)));
  return {email: order.email, product: order.product, skills};
}

async function verify(request, env, now) {
  if (request.headers.get('origin') !== ORIGIN) throw fail('Please use the TELW website.', 403);
  const body = await readJson(request);
  const orderId = String(body.orderId || ''), paymentId = String(body.paymentId || ''), signature = String(body.signature || '');
  if (!/^order_\w{6,40}$/.test(orderId) || !/^pay_\w{6,40}$/.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) throw fail('Payment details are incomplete.', 400);
  if (!same(await hmac(env.RAZORPAY_KEY_SECRET, orderId + '|' + paymentId), signature)) throw fail('This payment could not be confirmed. If money was taken, contact TELW.', 400);
  const granted = await grant(env, orderId, paymentId, undefined, now);
  if (!granted) throw fail('This order was not found. If money was taken, contact TELW.', 404);
  return json({ok: true, ...granted});
}

async function webhook(request, env, now) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return json({error: 'Not configured'}, 503);
  const raw = await request.text();
  if (raw.length > 100000) return json({error: 'Too large'}, 413);
  if (!same(await hmac(env.RAZORPAY_WEBHOOK_SECRET, raw), request.headers.get('x-razorpay-signature') || '')) return json({error: 'Bad signature'}, 401);
  let event; try { event = JSON.parse(raw); } catch { return json({error: 'Invalid'}, 400); }
  const payment = event?.payload?.payment?.entity;
  if (['order.paid', 'payment.captured'].includes(event?.event) && payment?.order_id && ['captured', 'authorized'].includes(payment.status)) {
    await grant(env, payment.order_id, payment.id, payment.amount, now);
  }
  return json({ok: true});
}

// Problem reports. Each gets a TELW reference number, is stored, and is emailed to TELW together
// with what the payment record shows for that email address, so a claim can be checked.
const TESTS = {reading: 'Reading', listening: 'Listening', writing: 'Writing', payment: 'Payment'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const when = seconds => seconds ? new Date(seconds * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '';
export function reference() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'TELW-' + [...bytes].map(b => letters[b % letters.length]).join('');
}
async function sendEmail(env, message) {
  if (!env.RESEND_API_KEY || !env.TELW_FROM_EMAIL) return false;
  const response = await fetch('https://api.resend.com/emails', {method: 'POST', signal: AbortSignal.timeout(15000),
    headers: {authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json'}, body: JSON.stringify({from: env.TELW_FROM_EMAIL, ...message})});
  return response.ok;
}
async function report(request, env, now) {
  if (request.headers.get('origin') !== ORIGIN) throw fail('Please use the TELW website.', 403);
  if (!env.PAY_DB) throw fail('Problem reports are not available yet. Please email TELW.', 503);
  const body = await readJson(request, 6000);
  const email = normalEmail(body.email), test = String(body.test || ''), paymentRef = String(body.paymentRef || '').trim().slice(0, 60), message = String(body.message || '').trim();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('Enter the email address you used for the test.', 400);
  if (!TESTS[test]) throw fail('Choose which test the problem is about.', 400);
  if (message.length < 10 || message.length > 2000) throw fail('Describe the problem in 10 to 2,000 characters.', 400);
  const recent = await env.PAY_DB.prepare(`SELECT count(*) AS n FROM ielts_pay_reports WHERE email=?1 AND created_at>?2`).bind(email, now - 86400).first();
  if (recent.n >= 5) throw fail('You have sent several reports today. TELW will reply to those first.', 429);
  const id = reference();
  await env.PAY_DB.prepare(`INSERT INTO ielts_pay_reports(id,email,test,payment_ref,message,created_at) VALUES(?1,?2,?3,?4,?5,?6)`).bind(id, email, test, paymentRef || null, message, now).run();
  const orders = (await env.PAY_DB.prepare(`SELECT id,product,amount,status,payment_id,created_at,paid_at FROM ielts_pay_orders WHERE email=?1 ORDER BY created_at DESC LIMIT 10`).bind(email).all()).results;
  const credits = (await env.PAY_DB.prepare(`SELECT skill,order_id,expires_at,used_at,used_ref FROM ielts_pay_credits WHERE email=?1 ORDER BY created_at DESC LIMIT 30`).bind(email).all()).results;
  const rows = (list, cells) => list.length ? '<table border="1" cellpadding="4" style="border-collapse:collapse">' + list.map(r => '<tr>' + cells(r).map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>' : '<p>None.</p>';
  const html = `<h2>Problem report ${id}</h2><p><strong>Learner email:</strong> ${esc(email)}<br><strong>Test:</strong> ${TESTS[test]}<br><strong>Payment reference given:</strong> ${esc(paymentRef || 'none')}<br><strong>Received:</strong> ${when(now)}</p><p><strong>What the learner wrote:</strong></p><blockquote>${esc(message).replace(/\n/g, '<br>')}</blockquote>`
    + `<h3>Payment record for this email</h3><p>Orders (Razorpay order, product, amount in paise, status, payment, created, paid):</p>${rows(orders, r => [r.id, r.product, r.amount, r.status, r.payment_id || '', when(r.created_at), when(r.paid_at)])}`
    + `<p>Tests bought (skill, order, expires, used at, used for):</p>${rows(credits, r => [r.skill, r.order_id, when(r.expires_at), r.used_at ? when(r.used_at) : 'not used', r.used_ref || ''])}`
    + `<p>To send a replacement test for this report, open <a href="${ORIGIN}/ielts/pay/admin/?ref=${id}">the payments admin page</a>.</p>`;
  let emailed = false;
  try { emailed = await sendEmail(env, {to: [TRAINER_EMAIL], reply_to: email, subject: `IELTS problem report ${id} (${TESTS[test]})`, html}); } catch {}
  try { await sendEmail(env, {to: [email], reply_to: TRAINER_EMAIL, subject: `Your TELW reference ${id}`, html: `<p>Thank you. TELW has received your report about the ${TESTS[test]} diagnostic.</p><p>Your reference number is <strong>${id}</strong>. Please quote it in any message about this problem.</p><p>We aim to reply within 2 working days.</p><p>TELW The English Workshop</p>`}); } catch {}
  if (emailed) await env.PAY_DB.prepare(`UPDATE ielts_pay_reports SET emailed_at=?1 WHERE id=?2`).bind(now, id).run();
  return json({ok: true, reference: id});
}

// Trainer-only admin. The trainer signs in on the Reading page; that session is checked with the
// Reading service, and only manutelw@gmail.com is accepted.
const SERVICE = 'https://telw-ielts-preview-worker.manutelw.workers.dev';
async function requireTrainer(request, env) {
  const found = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).filter(x => x.startsWith('__Secure-telw_ielts_learner='));
  const token = found.length === 1 ? found[0].slice('__Secure-telw_ielts_learner='.length) : '';
  if (!/^[a-f0-9]{64}$/.test(token) || !env.IELTS_ADMIN_SERVICE?.fetch) throw fail('Verify manutelw@gmail.com on the Reading page first, then reload this page.', 401);
  const session = await env.IELTS_ADMIN_SERVICE.fetch(new Request(SERVICE + '/api/ielts/auth/session', {headers: {cookie: '__Secure-telw_ielts=' + token}, redirect: 'manual', signal: AbortSignal.timeout(15000)}));
  const email = session.ok ? normalEmail((await session.json().catch(() => ({}))).email) : '';
  if (email !== TRAINER_EMAIL) throw fail('This page is for the TELW trainer only.', 403);
}
async function admin(request, env, action, now) {
  await requireTrainer(request, env);
  if (action === 'admin/overview' && request.method === 'GET') {
    const reports = (await env.PAY_DB.prepare(`SELECT r.id,r.email,r.test,r.payment_ref,r.message,r.created_at,r.emailed_at,x.id AS replacement FROM ielts_pay_reports r LEFT JOIN ielts_pay_replacements x ON x.source='report:'||r.id ORDER BY r.created_at DESC LIMIT 100`).all()).results;
    const replacements = (await env.PAY_DB.prepare(`SELECT x.*,c.used_at,c.used_ref FROM ielts_pay_replacements x LEFT JOIN ielts_pay_credits c ON c.id=x.credit_id ORDER BY x.created_at DESC LIMIT 100`).all()).results;
    return json({ok: true, reports, replacements});
  }
  if (action === 'admin/replace' && request.method === 'POST') {
    if (request.headers.get('origin') !== ORIGIN) throw fail('Please use the TELW website.', 403);
    const body = await readJson(request), skill = String(body.skill || '');
    if (!SKILLS.includes(skill)) throw fail('Choose Reading, Listening or Writing.', 400);
    const report = await env.PAY_DB.prepare(`SELECT * FROM ielts_pay_reports WHERE id=?1`).bind(String(body.reference || '')).first();
    if (!report) throw fail('That report reference was not found.', 404);
    const replacement = await issueReplacement(env, {email: report.email, skill, reason: `Technical problem reported under ${report.id}.`, source: 'report:' + report.id, now});
    return json({ok: true, replacement});
  }
  throw fail('Not found', 404);
}

// Delivery receipts from the email service (Resend webhooks, signed in the Svix format).
async function emailEvents(request, env, now) {
  const secret = String(env.RESEND_WEBHOOK_SECRET || '');
  if (!secret.startsWith('whsec_')) return json({error: 'Not configured'}, 503);
  const raw = await request.text();
  if (raw.length > 100000) return json({error: 'Too large'}, 413);
  const id = request.headers.get('svix-id') || '', stamp = request.headers.get('svix-timestamp') || '', signatures = request.headers.get('svix-signature') || '';
  if (!id || !/^\d+$/.test(stamp) || Math.abs(now - Number(stamp)) > 300) return json({error: 'Bad signature'}, 401);
  const keyBytes = Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const expected = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${id}.${stamp}.${raw}`)))));
  if (!signatures.split(' ').some(part => same(part.split(',')[1] || '', expected))) return json({error: 'Bad signature'}, 401);
  let event; try { event = JSON.parse(raw); } catch { return json({error: 'Invalid'}, 400); }
  const emailId = String(event?.data?.email_id || '');
  if (emailId && event.type === 'email.delivered') await env.PAY_DB.prepare(`UPDATE ielts_pay_replacements SET delivered_at=coalesce(delivered_at,?1) WHERE email_id=?2`).bind(now, emailId).run();
  if (emailId && event.type === 'email.bounced') await env.PAY_DB.prepare(`UPDATE ielts_pay_replacements SET bounced_at=coalesce(bounced_at,?1) WHERE email_id=?2`).bind(now, emailId).run();
  return json({ok: true});
}

export async function handlePayments(request, env = {}) {
  const url = new URL(request.url);
  const path = url.pathname;
  const page = PAGES.has(path) || PAGES.has(path + '/');
  const api = path.startsWith(API);
  if (!page && !api) return null;
  if (url.origin === 'https://www.manuvikraman.com') return new Response(null, {status: 308, headers: {location: ORIGIN + path + url.search}});
  if (url.origin !== ORIGIN) return new Response('Not found', {status: 404});
  if (page) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
    if (!PAGES.has(path)) return new Response(null, {status: 308, headers: {location: path + '/' + url.search}});
    return servePage(request, env, PAGES.get(path));
  }
  const action = path.slice(API.length), now = Math.floor(Date.now() / 1000);
  try {
    if (action === 'config' && request.method === 'GET') return json({ready: ready(env), products: Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, {name: p.name, amount: p.amount}]))});
    if (action.startsWith('admin/')) { if (!env.PAY_DB) return json({error: 'Not configured'}, 503); return await admin(request, env, action, now); }
    if (!['order', 'verify', 'webhook', 'report', 'email-events'].includes(action)) return json({error: 'Not found'}, 404);
    if (request.method !== 'POST') return json({error: 'POST required'}, 405);
    if (action === 'report') return await report(request, env, now);
    if (action === 'email-events') return env.PAY_DB ? await emailEvents(request, env, now) : json({error: 'Not configured'}, 503);
    if (!ready(env)) return json({error: 'Payments are not open yet. Please contact TELW.'}, 503);
    if (action === 'order') return await createOrder(request, env, now);
    if (action === 'verify') return await verify(request, env, now);
    return await webhook(request, env, now);
  } catch (error) {
    return json({error: error.status ? error.message : 'Payments are temporarily unavailable. Please try again shortly.'}, error.status || 503);
  }
}
