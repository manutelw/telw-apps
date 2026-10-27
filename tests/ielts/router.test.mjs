import {test} from 'node:test';
import assert from 'node:assert/strict';
import router from '../../worker-host-router.js';
import {fixture,withMail,login} from './support.mjs';
const base='https://manuvikraman.com';
test('Reading APIs require verified sessions on the server, including direct requests',async()=>{
 const f=fixture(); await withMail(f,async()=>{
  for(const route of ['score','enquire','feedback-email']) {
   const r=await router.fetch(new Request(base+'/api/ielts-reading/'+route,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({track:'academic',answers:{},email:'other@example.com',consent:true})}),f.env);
   assert.equal(r.status,401);
  }
 });
});
test('legacy scoring works after verification, invalid origin stays blocked',async()=>{
 const f=fixture(); await withMail(f,async messages=>{
  const {cookie}=await login(f,messages);
  for(const origin of [base,'https://evil.example']) {
   const r=await router.fetch(new Request(base+'/api/ielts-reading/score',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify({track:'academic',answers:{}})}),f.env);
   assert.equal(r.status,origin===base?200:403);
   if(r.ok) assert.equal((await r.json()).correct,0);
  }
 });
});
test('private new IELTS sources are blocked on every host',async()=>{
 for(const host of ['manuvikraman.com','clarionprep.com','other.example'])
  for(const path of ['/workers/ielts/auth.mjs','/tests/ielts/support.mjs','/migrations/ielts/0002_verified_identity.sql'])
   assert.equal((await router.fetch(new Request('https://'+host+path),{})).status,404);
});
test('existing host routing and TELW Reading asset mapping still work',async()=>{
 const calls=[];const env={ASSETS:{async fetch(request){calls.push(new URL(request.url).pathname);return new Response('existing asset');}}};
 for(const [host,path,expected] of [['manuvikraman.com','/','/telw-site/landing-page'],['manuvikraman.com','/ielts/reading/','/ielts-reading-diagnostic.html'],['clarionprep.com','/','/']]){
  const r=await router.fetch(new Request('https://'+host+path),env);assert.equal(r.status,200);assert.equal(await r.text(),'existing asset');assert.equal(calls.at(-1),expected);
 }
 const www=await router.fetch(new Request('https://www.manuvikraman.com/ielts/reading/'),env);assert.equal(www.status,308);assert.equal(www.headers.get('location'),base+'/ielts/reading/');
 assert.equal((await router.fetch(new Request('https://clarionprep.com/api/ielts/auth/session'),env)).status,404);
});
test('candidate feedback recipient cannot be changed by posting another address',async()=>{
 const f=fixture();await withMail(f,async messages=>{
  const {cookie}=await login(f,messages);
  const response=await router.fetch(new Request(base+'/api/ielts-reading/feedback-email',{method:'POST',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify({track:'academic',answers:Object.fromEntries(Array.from({length:40},(_,i)=>[String(i),0])),email:'attacker@example.com',consent:true})}),f.env);
  assert.equal(response.status,200);assert.deepEqual(messages.at(-1).to,['learner@example.com']);
  assert.doesNotMatch(messages.at(-1).html,/Private scoring keys|TRAINER_BANK|Correct answer:/);
 });
});
