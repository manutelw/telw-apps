import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handlePayments, hmac, PRODUCTS} from '../../workers/ielts/payments.mjs';
import {handleLearnerPortal} from '../../workers/ielts/learner-portal.mjs';
import {claimCredit, releaseCredit} from '../../workers/ielts/credits.mjs';

const origin = 'https://manuvikraman.com';
const KEY = 'rzp_test_fixture', SECRET = 'secret-fixture', HOOK = 'hook-fixture';

function payDb(on = true) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../ielts-pay/migrations/0001_payments.sql', import.meta.url), 'utf8'));
  if (on) db.exec(`UPDATE ielts_pay_settings SET value='on'`);
  const stmt = sql => ({args: [], bind(...args) { this.args = args; return this; }, async first() { return db.prepare(sql).get(...this.args) || null; }, async all() { return {results: db.prepare(sql).all(...this.args)}; }, async run() { return db.prepare(sql).run(...this.args); }});
  return {db, PAY_DB: {prepare: stmt, async batch(list) { for (const s of list) await s.run(); }}};
}
const post = (path, body, headers = {origin}) => new Request(origin + path, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
function withFetch(fake, run) {
  const real = globalThis.fetch; globalThis.fetch = fake;
  return Promise.resolve().then(run).finally(() => { globalThis.fetch = real; });
}
const razorpay = (calls = []) => async (url, options) => {
  assert.equal(url, 'https://api.razorpay.com/v1/orders');
  assert.equal(options.headers.authorization, 'Basic ' + btoa(KEY + ':' + SECRET));
  const body = JSON.parse(options.body); calls.push(body);
  return new Response(JSON.stringify({id: 'order_fixture' + calls.length, amount: body.amount, currency: 'INR'}), {status: 200});
};

test('price and policy pages are served from assets, with canonical redirects', async () => {
  const assets = {fetch: async req => {
    const path = new URL(req.url).pathname;
    if (path.endsWith('.html')) return new Response(null, {status: 307, headers: {location: path.slice(0, -5)}});
    return new Response('<html>' + path + '</html>', {headers: {'content-type': 'text/html'}});
  }};
  for (const [page, asset] of [['/ielts/pay/', '/ielts-pay/index'], ['/ielts/terms/', '/ielts-pay/terms'], ['/ielts/refund/', '/ielts-pay/refund'], ['/ielts/privacy/', '/ielts-pay/privacy']]) {
    const response = await handlePayments(new Request(origin + page), {ASSETS: assets});
    assert.equal(response.status, 200); assert.equal(await response.text(), `<html>${asset}</html>`); assert.equal(response.headers.get('location'), null);
  }
  assert.equal((await handlePayments(new Request(origin + '/ielts/pay'))).headers.get('location'), '/ielts/pay/');
  assert.equal((await handlePayments(new Request('https://www.manuvikraman.com/ielts/pay/'))).headers.get('location'), origin + '/ielts/pay/');
  assert.equal((await handlePayments(new Request('https://clarionprep.com/ielts/pay/'))).status, 404);
  assert.equal(await handlePayments(new Request(origin + '/ielts/reading/')), null);
  assert.equal(await handlePayments(new Request(origin + '/ielts/')), null);
});

test('the real pages show the agreed prices and the required policy links', () => {
  const page = readFileSync(new URL('../../ielts-pay/index.html', import.meta.url), 'utf8');
  for (const text of ['₹799', '₹499', '₹249', '/ielts/terms/', '/ielts/refund/', '/ielts/privacy/', '/contact/', 'New Delhi 110016', 'manutelw@gmail.com', '+91 97171 16831', 'checkout.razorpay.com/v1/checkout.js']) assert.ok(page.includes(text), text);
  assert.deepEqual(Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, p.amount])), {bundle: 79900, writing: 49900, reading: 24900, listening: 24900});
  for (const file of ['terms', 'refund', 'privacy']) assert.match(readFileSync(new URL(`../../ielts-pay/${file}.html`, import.meta.url), 'utf8'), /manutelw@gmail\.com/);
  assert.doesNotMatch(readFileSync(new URL('../../ielts-pay/refund.html', import.meta.url), 'utf8'), /TO BE INSERTED/);
});

test('payments stay closed until the keys and database are configured', async () => {
  const config = await (await handlePayments(new Request(origin + '/api/ielts/pay/config'), {})).json();
  assert.equal(config.ready, false);
  assert.equal((await handlePayments(post('/api/ielts/pay/order', {email: 'a@b.co', product: 'bundle'}), {})).status, 503);
});

test('an order is created at the fixed price for a valid email and product only', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RAZORPAY_KEY_ID: KEY, RAZORPAY_KEY_SECRET: SECRET}, calls = [];
  await withFetch(razorpay(calls), async () => {
    assert.equal((await handlePayments(post('/api/ielts/pay/order', {email: 'a@b.co', product: 'bundle'}, {origin: 'https://evil.example'}), env)).status, 403);
    assert.equal((await handlePayments(post('/api/ielts/pay/order', {email: 'not-an-email', product: 'bundle'}), env)).status, 400);
    assert.equal((await handlePayments(post('/api/ielts/pay/order', {email: 'a@b.co', product: 'free'}), env)).status, 400);
    const order = await (await handlePayments(post('/api/ielts/pay/order', {email: ' Learner@Example.com ', product: 'writing', amount: 1}), env)).json();
    assert.equal(order.orderId, 'order_fixture1'); assert.equal(order.amount, 49900); assert.equal(order.keyId, KEY); assert.equal(order.email, 'learner@example.com');
    assert.equal(calls[0].amount, 49900, 'the browser cannot choose the price');
  });
  assert.deepEqual({...db.prepare('SELECT email,product,amount,status FROM ielts_pay_orders').get()}, {email: 'learner@example.com', product: 'writing', amount: 49900, status: 'created'});
});

test('a verified payment creates credits once; a forged signature creates nothing', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RAZORPAY_KEY_ID: KEY, RAZORPAY_KEY_SECRET: SECRET};
  await withFetch(razorpay(), () => handlePayments(post('/api/ielts/pay/order', {email: 'learner@example.com', product: 'bundle'}), env));
  const forged = await handlePayments(post('/api/ielts/pay/verify', {orderId: 'order_fixture1', paymentId: 'pay_fixture1', signature: 'a'.repeat(64)}), env);
  assert.equal(forged.status, 400); assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits').get().n, 0);
  const signature = await hmac(SECRET, 'order_fixture1|pay_fixture1');
  for (let i = 0; i < 2; i++) {
    const ok = await handlePayments(post('/api/ielts/pay/verify', {orderId: 'order_fixture1', paymentId: 'pay_fixture1', signature}), env);
    assert.equal(ok.status, 200); assert.deepEqual((await ok.json()).skills, ['reading', 'listening', 'writing']);
  }
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits').get().n, 3);
  assert.equal(db.prepare('SELECT status FROM ielts_pay_orders').get().status, 'paid');
});

test('the webhook needs a valid signature and the exact order amount', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RAZORPAY_KEY_ID: KEY, RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: HOOK};
  await withFetch(razorpay(), () => handlePayments(post('/api/ielts/pay/order', {email: 'learner@example.com', product: 'reading'}), env));
  const event = amount => JSON.stringify({event: 'order.paid', payload: {payment: {entity: {id: 'pay_hook1', order_id: 'order_fixture1', amount, status: 'captured'}}}});
  assert.equal((await handlePayments(post('/api/ielts/pay/webhook', event(24900), {'x-razorpay-signature': 'b'.repeat(64)}), env)).status, 401);
  const wrong = event(100);
  assert.equal((await handlePayments(post('/api/ielts/pay/webhook', wrong, {'x-razorpay-signature': await hmac(HOOK, wrong)}), env)).status, 400);
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits').get().n, 0);
  const good = event(24900);
  assert.equal((await handlePayments(post('/api/ielts/pay/webhook', good, {'x-razorpay-signature': await hmac(HOOK, good)}), env)).status, 200);
  assert.deepEqual({...db.prepare('SELECT email,skill FROM ielts_pay_credits').get()}, {email: 'learner@example.com', skill: 'reading'});
});

test('credits: free while charging is off and for the trainer; otherwise one paid, unexpired credit per test', async () => {
  const off = payDb(false);
  assert.deepEqual(await claimCredit({PAY_DB: off.PAY_DB}, 'x@y.co', 'writing', 'r1', 1000), {free: true});
  assert.deepEqual(await claimCredit({}, 'x@y.co', 'writing', 'r1', 1000), {free: true});
  const {db, PAY_DB} = payDb(), env = {PAY_DB};
  assert.deepEqual(await claimCredit(env, 'ManuTELW@gmail.com', 'writing', 'r1', 1000), {free: true});
  assert.equal(await claimCredit(env, 'x@y.co', 'writing', 'r1', 1000), null);
  db.exec(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,created_at) VALUES('order_a','x@y.co','writing',49900,'paid',1)`);
  db.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES('old','order_a','x@y.co','writing',1,500),('c1','order_a','x@y.co','reading',1,99999)`);
  assert.equal(await claimCredit(env, 'x@y.co', 'writing', 'r1', 1000), null, 'expired and other-skill credits are not used');
  db.exec(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,created_at) VALUES('order_b','x@y.co','writing',49900,'paid',1)`);
  db.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES('c2','order_b','x@y.co','writing',1,99999)`);
  const claim = await claimCredit(env, ' X@Y.co', 'writing', 'r1', 1000);
  assert.deepEqual(claim, {id: 'c2'});
  assert.equal(await claimCredit(env, 'x@y.co', 'writing', 'r2', 1000), null, 'a credit is used once');
  await releaseCredit(env, claim, 'r1');
  assert.deepEqual(await claimCredit(env, 'x@y.co', 'writing', 'r3', 1000), {id: 'c2'}, 'a released credit can be used again');
});

test('the three app copies of the credit rules are identical', () => {
  const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
  const main = read('workers/ielts/credits.mjs');
  assert.equal(read('ielts-writing/server/credits.mjs'), main);
  assert.equal(read('ielts-listening/server/credits.mjs'), main);
});

test('Reading: no credit, no new test; a credit is used once and resuming is free', async () => {
  const {db, PAY_DB} = payDb();
  const service = 'https://telw-ielts-preview-worker.manutelw.workers.dev';
  let starts = 0, attempt = 'a1b2c3d4-0000-4000-8000-000000000001', startStatus = 200;
  const env = {PAY_DB, IELTS_ADMIN_SERVICE: {fetch: async req => {
    const url = new URL(req.url);
    if (url.pathname === '/api/ielts/auth/session') { assert.equal(req.headers.get('cookie'), '__Secure-telw_ielts=' + 'b'.repeat(64)); return new Response(JSON.stringify({ok: true, email: 'learner@example.com'})); }
    assert.equal(url.href, service + '/api/ielts/reading/start'); starts++;
    return new Response(startStatus === 200 ? JSON.stringify({ok: true, attemptId: attempt}) : '{"error":"15-day limit"}', {status: startStatus, headers: {'content-type': 'application/json'}});
  }}};
  const start = () => handleLearnerPortal(post('/api/ielts/learner/reading/start', {track: 'academic'}, {origin, cookie: '__Secure-telw_ielts_learner=' + 'b'.repeat(64)}), env);
  const blocked = await start();
  assert.equal(blocked.status, 402); assert.match((await blocked.json()).error, /ielts\/pay/); assert.equal(starts, 0);
  db.exec(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,created_at) VALUES('order_a','learner@example.com','reading',24900,'paid',1),('order_b','learner@example.com','reading',24900,'paid',1)`);
  db.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES('c1','order_a','learner@example.com','reading',1,9999999999)`);
  assert.equal((await start()).status, 200);
  assert.equal(db.prepare('SELECT used_ref FROM ielts_pay_credits').get().used_ref, 'reading:' + attempt);
  assert.equal((await start()).status, 200, 'resuming the paid attempt within the hour');
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits WHERE used_at IS NULL').get().n, 0);
  db.exec(`UPDATE ielts_pay_credits SET used_at=1`);
  db.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES('c2','order_b','learner@example.com','reading',1,9999999999)`);
  startStatus = 429;
  assert.equal((await start()).status, 429);
  assert.equal(db.prepare(`SELECT used_at FROM ielts_pay_credits WHERE id='c2'`).get().used_at, null, 'a refused start gives the credit back');
});

test('the production router serves payments before the other sites', () => {
  const source = readFileSync(new URL('../../worker-host-router.js', import.meta.url), 'utf8');
  assert.match(source, /import \{handlePayments\}/);
  assert.ok(source.indexOf('if(payments)return payments;') < source.indexOf('return base.fetch(request,env)'));
  assert.match(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'), /"binding": "PAY_DB"/);
});
