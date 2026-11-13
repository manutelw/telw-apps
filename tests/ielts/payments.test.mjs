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
  for (const file of ['0002_problem_reports.sql', '0003_replacements.sql', '0004_replacement_log.sql']) db.exec(readFileSync(new URL('../../ielts-pay/migrations/' + file, import.meta.url), 'utf8'));
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
  for (const [page, asset] of [['/ielts/pay/', '/ielts-pay/index'], ['/ielts/terms/', '/ielts-pay/terms'], ['/ielts/refund/', '/ielts-pay/refund'], ['/ielts/privacy/', '/ielts-pay/privacy'], ['/ielts/report/', '/ielts-pay/report']]) {
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
  for (const text of ['₹999', '₹799', '₹499', '₹299', '/ielts/terms/', '/ielts/refund/', '/ielts/privacy/', 'New Delhi 110016', 'manutelw@gmail.com', '+91 97171 16831', 'checkout.razorpay.com/v1/checkout.js']) assert.ok(page.includes(text), text);
  assert.deepEqual(Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, p.amount])), {communication: 99900, bundle: 79900, writing: 49900, reading: 29900, listening: 29900});
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

test('a paid Communication diagnostic is recorded as a paid order and creates no IELTS credits', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RAZORPAY_KEY_ID: KEY, RAZORPAY_KEY_SECRET: SECRET}, calls = [];
  await withFetch(razorpay(calls), () => handlePayments(post('/api/ielts/pay/order', {email: 'Learner@Example.com', product: 'communication'}), env));
  assert.equal(calls[0].amount, 99900); assert.match(calls[0].receipt, /^comm-/);
  const ok = await handlePayments(post('/api/ielts/pay/verify', {orderId: 'order_fixture1', paymentId: 'pay_fixture1', signature: await hmac(SECRET, 'order_fixture1|pay_fixture1')}), env);
  assert.equal(ok.status, 200); assert.deepEqual(await ok.json(), {ok: true, email: 'learner@example.com', product: 'communication', skills: []});
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits').get().n, 0);
  assert.deepEqual({...db.prepare('SELECT email,product,amount,status FROM ielts_pay_orders').get()}, {email: 'learner@example.com', product: 'communication', amount: 99900, status: 'paid'});
});

test('the webhook needs a valid signature and the exact order amount', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RAZORPAY_KEY_ID: KEY, RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: HOOK};
  await withFetch(razorpay(), () => handlePayments(post('/api/ielts/pay/order', {email: 'learner@example.com', product: 'reading'}), env));
  const event = amount => JSON.stringify({event: 'order.paid', payload: {payment: {entity: {id: 'pay_hook1', order_id: 'order_fixture1', amount, status: 'captured'}}}});
  assert.equal((await handlePayments(post('/api/ielts/pay/webhook', event(29900), {'x-razorpay-signature': 'b'.repeat(64)}), env)).status, 401);
  const wrong = event(100);
  assert.equal((await handlePayments(post('/api/ielts/pay/webhook', wrong, {'x-razorpay-signature': await hmac(HOOK, wrong)}), env)).status, 400);
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_credits').get().n, 0);
  const good = event(29900);
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
  assert.equal(blocked.status, 402); assert.match((await blocked.json()).error, /one step away/); assert.equal(starts, 0);
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

test('manuvikraman.com/diagnostic/ is passed to the diagnostic Worker without the /diagnostic prefix', async () => {
  const {default: router} = await import('../../worker-host-router.js');
  const seen = [];
  const env = {PERF_SERVICE: {fetch: async req => { seen.push(new URL(req.url).pathname + new URL(req.url).search); return new Response('ok'); }}};
  assert.equal((await router.fetch(new Request(origin + '/diagnostic'), env)).headers.get('location'), origin + '/diagnostic/');
  assert.equal((await router.fetch(new Request('https://www.manuvikraman.com/diagnostic/?t=1'), env)).headers.get('location'), origin + '/diagnostic/?t=1');
  assert.equal(await (await router.fetch(new Request(origin + '/diagnostic/?t=abc'), env)).text(), 'ok');
  await router.fetch(new Request(origin + '/diagnostic/api/session?t=abc'), env);
  assert.deepEqual(seen, ['/?t=abc', '/api/session?t=abc']);
  assert.equal((await router.fetch(new Request(origin + '/diagnostic/'), {})).status, 503);
  assert.match(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'), /"service": "telw-performance"/);
});

test('a problem report gets a reference, is stored, and TELW is emailed the payment record for that email', async () => {
  const {db, PAY_DB} = payDb(), env = {PAY_DB, RESEND_API_KEY: 'k', TELW_FROM_EMAIL: 'TELW <a@b.co>'}, sent = [];
  db.exec(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,payment_id,created_at,paid_at) VALUES('order_x','learner@example.com','bundle',79900,'paid','pay_x',1,2)`);
  db.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at,used_at,used_ref) VALUES('c1','order_x','learner@example.com','writing',1,9999999999,5,'writing:abc')`);
  await withFetch(async (url, options) => { assert.equal(url, 'https://api.resend.com/emails'); sent.push(JSON.parse(options.body)); return new Response('{}'); }, async () => {
    assert.equal((await handlePayments(post('/api/ielts/pay/report', {email: 'learner@example.com', test: 'writing', message: 'Marking never finished.'}, {origin: 'https://evil.example'}), env)).status, 403);
    assert.equal((await handlePayments(post('/api/ielts/pay/report', {email: 'learner@example.com', test: 'speaking', message: 'Marking never finished.'}), env)).status, 400);
    assert.equal((await handlePayments(post('/api/ielts/pay/report', {email: 'learner@example.com', test: 'writing', message: 'short'}), env)).status, 400);
    const ok = await handlePayments(post('/api/ielts/pay/report', {email: 'Learner@Example.com', test: 'writing', paymentRef: 'TELW-W-ABCD1234', message: 'Marking never finished. <b>help</b>'}), env);
    assert.equal(ok.status, 200);
    const {reference} = await ok.json();
    assert.match(reference, /^TELW-[A-Z2-9]{6}$/);
    const toTelw = sent.find(m => m.to[0] === 'manutelw@gmail.com'), toLearner = sent.find(m => m.to[0] === 'learner@example.com');
    assert.match(toTelw.subject, new RegExp(reference)); assert.match(toTelw.html, /order_x/); assert.match(toTelw.html, /writing:abc/); assert.match(toTelw.html, /&lt;b&gt;help/);
    assert.match(toLearner.html, new RegExp(reference));
    assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_reports WHERE emailed_at IS NOT NULL').get().n, 1);
    for (let i = 0; i < 4; i++) await handlePayments(post('/api/ielts/pay/report', {email: 'learner@example.com', test: 'payment', message: 'Another problem here.'}), env);
    assert.equal((await handlePayments(post('/api/ielts/pay/report', {email: 'learner@example.com', test: 'payment', message: 'Another problem here.'}), env)).status, 429);
  });
});

test('every page that shows a phone number offers WhatsApp messages only, and the report page is linked', () => {
  const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
  for (const file of ['ielts-pay/index.html', 'ielts-pay/terms.html', 'ielts-pay/refund.html', 'ielts-pay/privacy.html', 'telw-site/ielts/index.html']) {
    const html = read(file);
    assert.doesNotMatch(html, /tel:\+91/, file); assert.match(html, /wa\.me\/919717116831/, file);
  }
  assert.doesNotMatch(read('ielts-pay/terms.html'), /consumer law/);
  for (const file of ['ielts-pay/index.html', 'ielts-pay/refund.html', 'ielts-pay/terms.html', 'telw-site/ielts/index.html', 'telw-site/landing-page.html']) assert.match(read(file), /\/ielts\/report\//, file);
});

test('only the trainer can open the payments admin, and a replacement is sent once, recorded and emailed', async () => {
  const {db, PAY_DB} = payDb(), sent = [];
  const service = email => ({fetch: async req => { assert.equal(new URL(req.url).pathname, '/api/ielts/auth/session'); assert.equal(req.headers.get('cookie'), '__Secure-telw_ielts=' + 'c'.repeat(64)); return new Response(JSON.stringify({ok: true, email})); }});
  const cookie = {cookie: '__Secure-telw_ielts_learner=' + 'c'.repeat(64)};
  db.exec(`INSERT INTO ielts_pay_reports(id,email,test,message,created_at) VALUES('TELW-ABCDEF','learner@example.com','listening','The audio stopped in part 2.',1)`);
  assert.equal((await handlePayments(new Request(origin + '/api/ielts/pay/admin/overview'), {PAY_DB, IELTS_ADMIN_SERVICE: service('manutelw@gmail.com')})).status, 401);
  assert.equal((await handlePayments(new Request(origin + '/api/ielts/pay/admin/overview', {headers: cookie}), {PAY_DB, IELTS_ADMIN_SERVICE: service('someone@example.com')})).status, 403);
  const env = {PAY_DB, IELTS_ADMIN_SERVICE: service('manutelw@gmail.com'), RESEND_API_KEY: 'k', TELW_FROM_EMAIL: 'TELW <a@b.co>'};
  await withFetch(async (url, options) => { sent.push(JSON.parse(options.body)); return new Response(JSON.stringify({id: 'email-1'})); }, async () => {
    for (let i = 0; i < 2; i++) {
      const r = await handlePayments(post('/api/ielts/pay/admin/replace', {reference: 'TELW-ABCDEF', skill: 'listening'}, {origin, ...cookie}), env);
      assert.equal(r.status, 200);
    }
  });
  assert.equal(db.prepare('SELECT count(*) n FROM ielts_pay_replacements').get().n, 1, 'one replacement per report');
  const x = db.prepare('SELECT * FROM ielts_pay_replacements').get();
  assert.equal(x.email_id, 'email-1'); assert.ok(x.sent_at); assert.equal(x.skill, 'listening');
  assert.equal(sent.length, 1); assert.deepEqual(sent[0].to, ['learner@example.com']); assert.deepEqual(sent[0].bcc, ['manutelw@gmail.com']); assert.match(sent[0].subject, new RegExp(x.id));
  assert.deepEqual({...db.prepare('SELECT email,skill,used_at FROM ielts_pay_credits WHERE id=?').get(x.credit_id)}, {email: 'learner@example.com', skill: 'listening', used_at: null});
  const overview = await (await handlePayments(new Request(origin + '/api/ielts/pay/admin/overview', {headers: cookie}), env)).json();
  assert.equal(overview.reports[0].replacement, x.id); assert.equal(overview.replacements[0].id, x.id);
});

test('signed delivery receipts mark a replacement email as delivered; unsigned ones are refused', async () => {
  const {db, PAY_DB} = payDb();
  db.exec(`INSERT INTO ielts_pay_replacements(id,email,skill,reason,source,credit_id,created_at,email_id,sent_at) VALUES('TELW-R-AAAAAA','l@e.co','writing','x','s1','c1',1,'email-9',1)`);
  const secretBytes = new Uint8Array(24).fill(7), secret = 'whsec_' + btoa(String.fromCharCode(...secretBytes));
  const env = {PAY_DB, RESEND_WEBHOOK_SECRET: secret}, now = Math.floor(Date.now() / 1000), body = JSON.stringify({type: 'email.delivered', data: {email_id: 'email-9'}});
  const key = await crypto.subtle.importKey('raw', secretBytes, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`msg_1.${now}.${body}`)))));
  assert.equal((await handlePayments(post('/api/ielts/pay/email-events', body, {'svix-id': 'msg_1', 'svix-timestamp': String(now), 'svix-signature': 'v1,' + 'A'.repeat(44)}), env)).status, 401);
  assert.equal(db.prepare('SELECT delivered_at FROM ielts_pay_replacements').get().delivered_at, null);
  assert.equal((await handlePayments(post('/api/ielts/pay/email-events', body, {'svix-id': 'msg_1', 'svix-timestamp': String(now), 'svix-signature': 'v1,' + sig}), env)).status, 200);
  assert.ok(db.prepare('SELECT delivered_at FROM ielts_pay_replacements').get().delivered_at);
});
