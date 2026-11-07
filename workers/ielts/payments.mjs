// TELW IELTS payments on manuvikraman.com: the price and policy pages, Razorpay orders,
// payment verification and the Razorpay webhook. Paid credits go to PAY_DB, which the Reading,
// Listening and Writing apps check before a new test starts. No login is needed to pay: the
// credits belong to the email address the buyer enters, and the tests verify that address.
import {normalEmail} from './credits.mjs';

const ORIGIN = 'https://manuvikraman.com';
const API = '/api/ielts/pay/';
const VALID_DAYS = 180;
export const PRODUCTS = {
  bundle: {name: 'Full diagnosis: Reading, Listening and Writing', amount: 79900, skills: ['reading', 'listening', 'writing']},
  writing: {name: 'Writing diagnostic', amount: 49900, skills: ['writing']},
  reading: {name: 'Reading diagnostic', amount: 24900, skills: ['reading']},
  listening: {name: 'Listening diagnostic', amount: 24900, skills: ['listening']}
};
const PAGES = new Map([
  ['/ielts/pay/', '/ielts-pay/index.html'],
  ['/ielts/terms/', '/ielts-pay/terms.html'],
  ['/ielts/refund/', '/ielts-pay/refund.html'],
  ['/ielts/privacy/', '/ielts-pay/privacy.html'],
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
    if (!['order', 'verify', 'webhook'].includes(action)) return json({error: 'Not found'}, 404);
    if (request.method !== 'POST') return json({error: 'POST required'}, 405);
    if (!ready(env)) return json({error: 'Payments are not open yet. Please contact TELW.'}, 503);
    if (action === 'order') return await createOrder(request, env, now);
    if (action === 'verify') return await verify(request, env, now);
    return await webhook(request, env, now);
  } catch (error) {
    return json({error: error.status ? error.message : 'Payments are temporarily unavailable. Please try again shortly.'}, error.status || 503);
  }
}
