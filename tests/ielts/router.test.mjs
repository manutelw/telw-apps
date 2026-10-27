import {test} from 'node:test';
import assert from 'node:assert/strict';
import router from '../../worker-host-router.js';
import {fixture,withMail,login} from './support.mjs';
const base='https://manuvikraman.com';
test('legacy Reading endpoints cannot bypass stored attempts',async()=>{
 for(const route of ['score','enquire','feedback-email']) {
  const r=await router.fetch(new Request(base+'/api/ielts-reading/'+route,{method:'POST',body:'{}'}),{});assert.equal(r.status,410);
 }
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
