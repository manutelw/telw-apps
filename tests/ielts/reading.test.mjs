import {test} from 'node:test';
import assert from 'node:assert/strict';
import router from '../../worker-host-router.js';
import {fixture,withMail,login} from './support.mjs';
const base='https://manuvikraman.com';
async function setup(run) {
 const f=fixture(true);const clock=Date.now;let now=Math.floor(clock()/1000);
 Date.now=()=>now*1000;
 try{await withMail(f,async messages=>{
  const identity=await login(f,messages);let cookie=identity.cookie;
  const learner=f.sqlite.prepare('SELECT id FROM ielts_learners').get().id;
  // Deliberately synthetic fixtures. These are not authored/reviewed IELTS banks.
  const content={passages:Array.from({length:4},(_,i)=>({title:'Test fixture '+i,paragraphs:['Synthetic content only.'],questions:Array.from({length:10},(_,j)=>j<6?['tf','Fixture statement '+j]:['mc','Fixture question '+j,['a','b','c']])}))};
  const keys={keys:Array.from({length:40},(_,i)=>i%3),evidence:Array.from({length:40},()=>({explanation:'Synthetic test evidence; never publish.'}))};
  function version(id,approved=true,track='academic') {f.sqlite.prepare('INSERT INTO ielts_test_versions(id,skill,track,approved_at,content_json,private_key_json,created_at) VALUES(?,?,?,?,?,?,?)').run(id,'reading',track,approved?now-10:null,JSON.stringify(content),JSON.stringify(keys),now-10);}
  const api=(action,body={},overrideCookie=cookie)=>router.fetch(new Request(base+'/api/ielts/reading/'+action,{method:'POST',headers:{origin:base,'content-type':'application/json',cookie:overrideCookie},body:JSON.stringify(body)}),f.env);
  await run({...f,api,version,learner,messages,advance:seconds=>{now+=seconds;},relogin:async()=>{const result=await login(f,messages);cookie=result.cookie;},now:()=>now});
 });}finally{Date.now=clock;}
}
test('unapproved or exhausted bank cannot start; no public answer key',()=>setup(async f=>{
 f.version('draft-only',false);assert.equal((await f.api('start',{track:'academic'})).status,503);
 f.version('approved-fixture');const r=await f.api('start',{track:'academic'});assert.equal(r.status,200);
 const body=await r.json();assert.equal(body.versionId,'approved-fixture');assert.doesNotMatch(JSON.stringify(body),/private_key|keys|evidence|Synthetic test evidence/);
}));
test('simultaneous starts resume one immutable assignment, including track changes',()=>setup(async f=>{
 f.version('version-a');f.version('version-b');
 const results=await Promise.all([f.api('start',{track:'academic'}),f.api('start',{track:'academic'})]);
 const bodies=await Promise.all(results.map(x=>x.json()));assert.equal(bodies[0].attemptId,bodies[1].attemptId);
 assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM ielts_attempts').get().n,1);
 const resumed=await (await f.api('start',{track:'general'})).json();assert.equal(resumed.attemptId,bodies[0].attemptId);assert.equal(resumed.track,'academic');
 assert.throws(()=>f.sqlite.prepare('UPDATE ielts_attempts SET version_id=? WHERE id=?').run('version-b',resumed.attemptId),/IMMUTABLE/);
 assert.throws(()=>f.sqlite.prepare("UPDATE ielts_test_versions SET content_json='{}' WHERE id='version-a'").run(),/IMMUTABLE/);
}));
test('answers persist across restart and secure scoring ignores submitted version and score',()=>setup(async f=>{
 f.version('version-a');const start=await (await f.api('start',{track:'academic'})).json();
 assert.equal((await f.api('save',{attemptId:start.attemptId,answers:{0:0,1:1}})).status,200);
 const resumed=await (await f.api('start',{track:'academic'})).json();assert.deepEqual(resumed.answers,{0:0,1:1});
 const response=await f.api('submit',{attemptId:start.attemptId,answers:{0:0,1:1,2:0},score:40,versionId:'forged'});assert.equal(response.status,200);
 const scored=await response.json();assert.equal(scored.correct,2);assert.equal(scored.answered,3);
 const again=await (await f.api('submit',{attemptId:start.attemptId,answers:{0:1}})).json();assert.deepEqual(again,scored);
 assert.equal((await f.api('save',{attemptId:start.attemptId,answers:{}})).status,409);
}));
test('15-day completion limit covers both tracks and rotates on exact eligibility boundary',()=>setup(async f=>{
 f.version('version-a');f.version('version-b');f.version('general-a',true,'general');
 const first=await (await f.api('start',{track:'academic'})).json();await f.api('submit',{attemptId:first.attemptId,answers:{0:0}});
 assert.equal((await f.api('start',{track:'general'})).status,429);
 f.advance(15*86400-1);await f.relogin();assert.equal((await f.api('start',{track:'academic'})).status,429);
 f.advance(1);const next=await f.api('start',{track:'academic'});assert.equal(next.status,200);assert.equal((await next.json()).versionId,'version-b');
}));
test('expired unfinished attempt does not consume cooldown and cannot reuse same version',()=>setup(async f=>{
 f.version('version-a');f.version('version-b');const first=await (await f.api('start',{track:'academic'})).json();
 f.advance(3601);const second=await (await f.api('start',{track:'academic'})).json();assert.equal(second.versionId,'version-b');
 assert.equal(f.sqlite.prepare('SELECT status FROM ielts_attempts WHERE id=?').get(first.attemptId).status,'abandoned');
 assert.equal((await f.api('submit',{attemptId:first.attemptId,answers:{}})).status,409);
}));
test('late answers cannot change the score after server deadline',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();
 await f.api('save',{attemptId:first.attemptId,answers:{0:0}});f.advance(3600);
 assert.equal((await f.api('save',{attemptId:first.attemptId,answers:{0:0,1:1}})).status,409);
 const score=await (await f.api('submit',{attemptId:first.attemptId,answers:{0:0,1:1}})).json();assert.equal(score.correct,1);assert.equal(score.answered,1);
}));
test('other learners and malformed answers cannot read/write an attempt',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();
 for(const answers of [{40:0},{0:-1},{0:3},{0:'1'},[],{'1.5':1}])assert.equal((await f.api('save',{attemptId:first.attemptId,answers})).status,400);
 const second=await login(f,f.messages,'other@example.com');
 assert.equal((await f.api('submit',{attemptId:first.attemptId,answers:{}},second.cookie)).status,404);
 assert.equal((await f.api('submit',{attemptId:first.attemptId,answers:{}},'')).status,401);
}));
test('feedback and confidential trainer report use stored evidence and fixed recipients; duplicate sends are suppressed',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();await f.api('submit',{attemptId:first.attemptId,answers:{0:0}});
 assert.equal((await f.api('feedback-email',{attemptId:first.attemptId,consent:false})).status,400);
 for(const action of ['feedback-email','enquire']){
  const body={attemptId:first.attemptId,consent:true,email:'attacker@example.com',answers:{},name:'<script>attack</script>'};
  const sent=await f.api(action,body);assert.equal(sent.status,200);const count=f.messages.length;
  assert.equal((await f.api(action,body)).status,200);assert.equal(f.messages.length,count);
 }
 const [candidate,trainer]=f.messages.slice(-2);assert.deepEqual(candidate.to,['learner@example.com']);assert.deepEqual(trainer.to,['manutelw@gmail.com']);
 assert.doesNotMatch(candidate.html,/Correct index|Synthetic test evidence/);assert.match(trainer.html,/Correct index|Synthetic test evidence/);assert.doesNotMatch(trainer.html,/<script>/);assert.match(trainer.html,/&lt;script&gt;/);assert.match(trainer.html,/Prepare this learner’s complete TELW IELTS Reading trainer resource pack/);
}));
test('database itself rejects cooldown bypass and changes to a completed result',()=>setup(async f=>{
 f.version('version-a');f.version('version-b');const first=await (await f.api('start',{track:'academic'})).json();await f.api('submit',{attemptId:first.attemptId,answers:{0:0}});
 assert.throws(()=>f.sqlite.prepare('INSERT INTO ielts_attempts(id,learner_id,skill,track,version_id,started_at,deadline) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),f.learner,'reading','academic','version-b',f.now(),f.now()+3600),/COOLDOWN/);
 assert.throws(()=>f.sqlite.prepare("UPDATE ielts_attempts SET score_json='{}' WHERE id=?").run(first.attemptId),/IMMUTABLE/);
}));
test('simultaneous email requests hold one send lease',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();await f.api('submit',{attemptId:first.attemptId,answers:{}});
 const before=f.messages.length;const results=await Promise.all([1,2,3].map(()=>f.api('feedback-email',{attemptId:first.attemptId,consent:true})));
 assert.ok(results.some(x=>x.status===200));assert.equal(f.messages.length,before+1);
 assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM ielts_email_delivery WHERE status='sent'").get().n,1);
}));
test('uncertain mail retries keep identical payload and idempotency key; old uncertain sends require review',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();await f.api('submit',{attemptId:first.attemptId,answers:{}});
 const original=globalThis.fetch,requests=[];let failure=true;
 globalThis.fetch=async(url,options)=>{requests.push({key:options.headers['idempotency-key'],body:options.body});return new Response('{}',{status:failure?502:200});};
 try {
  assert.equal((await f.api('enquire',{attemptId:first.attemptId,consent:true,name:'Original'})).status,502);failure=false;
  assert.equal((await f.api('enquire',{attemptId:first.attemptId,consent:true,name:'Changed'})).status,200);
  assert.deepEqual(requests[0],requests[1]);
  assert.match(requests[1].body,/Original/);assert.doesNotMatch(requests[1].body,/Changed/);
  failure=true;assert.equal((await f.api('feedback-email',{attemptId:first.attemptId,consent:true})).status,502);
  globalThis.fetch=original;f.advance(23*3600);await f.relogin();
  assert.equal((await f.api('feedback-email',{attemptId:first.attemptId,consent:true})).status,409);
 }finally{globalThis.fetch=original;}
}));
test('feedback explains actual NOT GIVEN confusions without leaking individual keys',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();
 // Fixture q3 is NOT GIVEN; q1 is TRUE. Miss both in different directions.
 await f.api('submit',{attemptId:first.attemptId,answers:{0:2,2:0,6:0}});
 assert.equal((await f.api('feedback-email',{attemptId:first.attemptId,consent:true})).status,200);
 const html=f.messages.at(-1).html;
 assert.match(html,/1 unstated claim TRUE/);assert.match(html,/1 claim NOT GIVEN/);assert.match(html,/37 questions unanswered/);
 assert.match(html,/too few questions/i);assert.doesNotMatch(html,/Correct index|Synthetic test evidence|Fixture statement/);
}));
test('empty attempt feedback avoids inventing a priority or a mistake pattern',()=>setup(async f=>{
 f.version('version-a');const first=await (await f.api('start',{track:'academic'})).json();
 await f.api('submit',{attemptId:first.attemptId,answers:{}});await f.api('feedback-email',{attemptId:first.attemptId,consent:true});
 const html=f.messages.at(-1).html;assert.match(html,/cannot identify a reading priority/);assert.doesNotMatch(html,/You marked/);
}));
