import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleAuth, getLearner, digest} from '../../workers/ielts/auth.mjs';
import {fixture,withMail,login} from './support.mjs';
test('verified login, hashed storage, secure cookie, session and logout', async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const {response,cookie,code}=await login(f,messages,' Learner@Example.com ');
    assert.equal(response.status,200); assert.equal((await response.json()).email,'learner@example.com');
    assert.match(response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
    const challenge=f.sqlite.prepare('SELECT * FROM ielts_email_challenges').get();
    assert.notEqual(challenge.code_hash,code); assert.equal(challenge.attempts,1); assert.ok(challenge.consumed_at);
    const stored=f.sqlite.prepare('SELECT * FROM ielts_sessions').get();
    assert.notEqual(stored.token_hash,cookie.split('=')[1]); assert.equal(stored.token_hash,await digest(cookie.split('=')[1]));
    const request=f.request('session',null,{cookie},'GET');
    assert.equal((await getLearner(request,f.env)).email,'learner@example.com');
    assert.equal((await handleAuth(request,f.env)).status,200);
    assert.equal((await handleAuth(f.request('logout',{}, {cookie}),f.env)).status,200);
    assert.equal((await handleAuth(request,f.env)).status,401);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
  });
});
test('single-use code rejects replay and concurrent double verification', async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const {response,data,code}=await login(f,messages); assert.equal(response.status,200);
    const results=await Promise.all([1,2].map(()=>handleAuth(f.request('verify-code',{challengeId:data.challengeId,code}),f.env)));
    assert.deepEqual(results.map(x=>x.status),[400,400]);
    assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM ielts_sessions').get().n,1);
  });
});
test('five guesses exhaust challenge even when correct code supplied next',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const r=await handleAuth(f.request('request-code',{email:'a@example.com',consent:true}),f.env);
    const {challengeId}=await r.json(); const code=messages[0].text.match(/code is (\d{8})/)[1];
    for(let i=0;i<5;i++) assert.equal((await handleAuth(f.request('verify-code',{challengeId,code:code==='00000000'?'11111111':'00000000'}),f.env)).status,400);
    assert.equal((await handleAuth(f.request('verify-code',{challengeId,code}),f.env)).status,400);
    assert.equal(f.sqlite.prepare('SELECT attempts FROM ielts_email_challenges').get().attempts,5);
  });
});
test('expired code and expired session are rejected',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const {cookie}=await login(f,messages);
    f.sqlite.exec('UPDATE ielts_sessions SET expires_at=0');
    assert.equal((await handleAuth(f.request('session',null,{cookie},'GET'),f.env)).status,401);
    f.sqlite.exec('UPDATE ielts_email_challenges SET consumed_at=NULL,expires_at=0');
    const row=f.sqlite.prepare('SELECT id FROM ielts_email_challenges').get();
    assert.equal((await handleAuth(f.request('verify-code',{challengeId:row.id,code:'12345678'}),f.env)).status,400);
  });
});
test('concurrent requests cannot bypass rolling email send throttle',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const result=await Promise.all(Array.from({length:4},()=>handleAuth(f.request('request-code',{email:'a@example.com',consent:true}),f.env)));
    assert.equal(result.filter(x=>x.status===200).length,1);
    assert.equal(result.filter(x=>x.status===429).length,3); assert.equal(messages.length,1);
  });
});
test('IP send throttling applies across different addresses',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    for(let i=0;i<20;i++) assert.equal((await handleAuth(f.request('request-code',{email:`learner${i}@example.com`,consent:true}),f.env)).status,200);
    assert.equal((await handleAuth(f.request('request-code',{email:'last@example.com',consent:true}),f.env)).status,429);
    assert.equal(messages.length,20);
  });
});
test('cross-origin, missing origin, wrong method, unknown route and non-TELW host fail closed',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    for(const origin of ['https://evil.example','null','']) assert.equal((await handleAuth(f.request('request-code',{}, {origin}),f.env)).status,403);
    assert.equal((await handleAuth(f.request('request-code',null,{},'GET'),f.env)).status,405);
    assert.equal((await handleAuth(f.request('anything',{}),f.env)).status,404);
    assert.equal((await handleAuth(new Request('https://clarionprep.com/api/ielts/auth/session'),f.env)).status,404);
    assert.equal(messages.length,0);
  });
});
test('invalid email, missing consent and oversize JSON do not send mail',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    for(const email of ['bad','a@example.com\r\nBcc:other@example.com','x'.repeat(255)+'@example.com'])
      assert.equal((await handleAuth(f.request('request-code',{email,consent:true}),f.env)).status,400);
    assert.equal((await handleAuth(f.request('request-code',{email:'a@example.com',consent:false}),f.env)).status,400);
    assert.equal((await handleAuth(f.request('request-code',{email:'a@example.com',extra:'x'.repeat(5000),consent:true}),f.env)).status,413);
    assert.equal(messages.length,0);
  });
});
test('mail failure invalidates code and hides provider details',async()=>{
  const f=fixture(); const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response('secret provider detail',{status:500});
  try {
    const response=await handleAuth(f.request('request-code',{email:'a@example.com',consent:true}),f.env);
    assert.equal(response.status,502); assert.ok(f.sqlite.prepare('SELECT consumed_at FROM ielts_email_challenges').get().consumed_at);
    assert.doesNotMatch(await response.text(),/secret provider detail/);
  } finally {globalThis.fetch=original;f.sqlite.close();}
});
test('missing database/secret fails closed',async()=>{
  const f=fixture(); await withMail(f,async()=>{
    for(const env of [{},{...f.env,IELTS_AUTH_SECRET:'short'},{...f.env,IELTS_DB:null}])
      assert.equal((await handleAuth(f.request('session',null,{},'GET'),env)).status,503);
  });
});
test('forged and duplicated session cookies are rejected',async()=>{
  const f=fixture(); await withMail(f,async messages=>{
    const {cookie}=await login(f,messages);
    for(const value of ['__Secure-telw_ielts=garbage','__Secure-telw_ielts='+ 'a'.repeat(64),cookie+'; '+cookie])
      assert.equal((await handleAuth(f.request('session',null,{cookie:value},'GET'),f.env)).status,401);
  });
});
test('simultaneous correct codes create exactly one session',async()=>{
 const f=fixture();await withMail(f,async messages=>{
  const r=await handleAuth(f.request('request-code',{email:'a@example.com',consent:true}),f.env);const {challengeId}=await r.json();
  const code=messages[0].text.match(/code is (\d{8})/)[1];
  const results=await Promise.all([1,2,3].map(()=>handleAuth(f.request('verify-code',{challengeId,code}),f.env)));
  assert.equal(results.filter(x=>x.status===200).length,1);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM ielts_sessions').get().n,1);
 });
});
test('re-verification preserves learner identity across sessions',async()=>{
 const f=fixture();await withMail(f,async messages=>{
  await login(f,messages);const original=f.sqlite.prepare('SELECT id FROM ielts_learners').get().id;
  // Move the resend interval back to allow a new verification in the same test.
  f.sqlite.exec('UPDATE ielts_email_challenges SET created_at=0; UPDATE ielts_auth_limits SET hits=0 WHERE bucket_key LIKE \'email-send:%\'');
  const {response}=await login(f,messages,'LEARNER@example.com');assert.equal(response.status,200);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM ielts_learners').get().n,1);
  assert.equal(f.sqlite.prepare('SELECT id FROM ielts_learners').get().id,original);
 });
});
