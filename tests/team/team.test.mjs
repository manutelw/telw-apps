import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTeam, renderMarkdown} from '../../workers/team/team.mjs';

const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const realFetch = globalThis.fetch;

async function setup() {
  const {publicKey, privateKey} = await crypto.subtle.generateKey({name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'}, true, ['sign', 'verify']);
  const jwk = {...await crypto.subtle.exportKey('jwk', publicKey), kid: 'k1'};
  const sign = async (payload, kid = 'k1') => {
    const head = enc({alg: 'RS256', kid}), body = enc(payload);
    const sig = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(head + '.' + body))).toString('base64url');
    return head + '.' + body + '.' + sig;
  };
  globalThis.fetch = async url => {
    const u = String(url);
    const ok = result => new Response(JSON.stringify({success: true, result}));
    if (u.endsWith('/access/apps?per_page=100')) return ok([{name: 'TELW Team', aud: 'AUD1', uid: 'U1', id: 'U1'}]);
    if (u.endsWith('/access/policies?per_page=100')) return ok([{name: 'TELW Team', id: 'P1', decision: 'allow', include: [{email: {email: 'a@b.com'}}]}]);
    if (u.endsWith('/access/organizations')) return ok({auth_domain: 'telw.cloudflareaccess.com'});
    if (u === 'https://telw.cloudflareaccess.com/cdn-cgi/access/certs') return new Response(JSON.stringify({keys: [jwk]}));
    throw Error('unexpected fetch ' + u);
  };
  const db = {prepare: () => ({bind() { return this; }, run: async () => ({}), all: async () => ({results: [{slug: 'briefing', title: 'Briefing'}]}), first: async () => ({slug: 'briefing', title: 'Briefing', body: '## Hi\n\n<script>x</script>', sort: 1, updated_at: '2026-11-23'})})};
  return {sign, env: {CF_API_TOKEN: 't', CF_ACCOUNT_ID: 'acc', TEAM_DB: db}};
}
const now = () => Math.floor(Date.now() / 1000);
const req = (path, headers = {}) => new Request('https://manuvikraman.com' + path, {headers});

test('ignores other paths and other hosts', async () => {
  assert.equal(await handleTeam(req('/about-us/')), null);
  assert.equal((await handleTeam(new Request('https://clarionprep.com/team/'))).status, 404);
  assert.equal((await handleTeam(req('/team'))).status, 308);
});

test('team pages fail closed without a valid Access token', async () => {
  const {sign, env} = await setup();
  try {
    assert.equal((await handleTeam(req('/team/'), env)).status, 403);
    const bad = await sign({iss: 'https://telw.cloudflareaccess.com', aud: ['OTHER'], email: 'a@b.com', exp: now() + 600});
    assert.equal((await handleTeam(req('/team/', {'cf-access-jwt-assertion': bad}), env)).status, 403);
    const expired = await sign({iss: 'https://telw.cloudflareaccess.com', aud: ['AUD1'], email: 'a@b.com', exp: now() - 3600});
    assert.equal((await handleTeam(req('/team/', {'cf-access-jwt-assertion': expired}), env)).status, 403);
    const wrongIss = await sign({iss: 'https://evil.cloudflareaccess.com', aud: ['AUD1'], email: 'a@b.com', exp: now() + 600});
    assert.equal((await handleTeam(req('/team/', {'cf-access-jwt-assertion': wrongIss}), env)).status, 403);
    const good = await sign({iss: 'https://telw.cloudflareaccess.com', aud: ['AUD1'], email: 'a@b.com', exp: now() + 600});
    const tampered = good.slice(0, -4) + 'AAAA';
    assert.equal((await handleTeam(req('/team/', {'cf-access-jwt-assertion': tampered}), env)).status, 403);
    const ok = await handleTeam(req('/team/briefing/', {'cf-access-jwt-assertion': good}), env);
    assert.equal(ok.status, 200);
    const text = await ok.text();
    assert.match(text, /<h3>Hi<\/h3>/);
    assert.doesNotMatch(text, /<script>x/);
    assert.match(ok.headers.get('cache-control'), /no-store/);
  } finally { globalThis.fetch = realFetch; }
});

test('team area shows a not-open message when secrets are missing', async () => {
  const r = await handleTeam(req('/team/', {'cf-access-jwt-assertion': 'a.b.c'}), {});
  assert.equal(r.status, 200);
  assert.match(await r.text(), /not open yet/);
});

test('admin page and API require the trainer sign-in', async () => {
  const page = await handleTeam(req('/ielts/admin/team/'), {});
  assert.equal(page.status, 303);
  assert.equal(page.headers.get('location'), '/ielts/admin/');
  assert.equal((await handleTeam(req('/api/team/admin/people'), {})).status, 401);
  const post = new Request('https://manuvikraman.com/api/team/admin/people/add', {method: 'POST', headers: {origin: 'https://evil.example', 'content-type': 'application/json'}, body: '{}'});
  assert.equal((await handleTeam(post, {})).status, 403);
});

test('admin API works for the signed-in trainer', async () => {
  const {env} = await setup();
  const cookie = '__Secure-telw_ielts_admin=' + 'a'.repeat(64);
  env.IELTS_ADMIN_SERVICE = {fetch: async r => { assert.equal(r.headers.get('cookie'), '__Secure-telw_ielts=' + 'a'.repeat(64)); return new Response(JSON.stringify({email: 'manutelw@gmail.com'})); }};
  try {
    const r = await handleTeam(req('/api/team/admin/people', {cookie}), env);
    assert.equal(r.status, 200);
    assert.deepEqual((await r.json()).emails, ['a@b.com']);
    const page = await handleTeam(req('/ielts/admin/team/', {cookie}), env);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /script-src 'nonce-/);
  } finally { globalThis.fetch = realFetch; }
});

test('markdown escapes html and renders tables', () => {
  const out = renderMarkdown('| A | B |\n| --- | --- |\n| **x** | <b>y</b> |\n\n- one\n- two');
  assert.match(out, /<th>A<\/th>/);
  assert.match(out, /<strong>x<\/strong>/);
  assert.match(out, /&lt;b&gt;y/);
  assert.match(out, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.doesNotMatch(renderMarkdown('[x](javascript:alert(1))'), /href="javascript/);
});
