import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,syntheticBank,origin,base} from './support.mjs';
import {validateBank,splitBank,normalise,scoreAnswers} from '../server/bank.mjs';
test('private bank splits cleanly and scoring enforces word limits, accents, time and number formats',()=>{
 const bank=syntheticBank();assert.equal(validateBank(bank).ok,true);const parts=splitBank(bank);assert.doesNotMatch(JSON.stringify(parts.public),/accepted|evidence|turns|normalizer/);
 const answers=Object.fromEntries(bank.parts.flatMap(p=>p.key.map(k=>[k.id,k.accepted[0]])));assert.equal(scoreAnswers(parts.public,parts.private,answers).correct,40);answers[1]='alpha extra';assert.equal(scoreAnswers(parts.public,parts.private,answers).correct,39);
 assert.equal(normalise('  CAFÉ. ','text'),'cafe');assert.equal(normalise('01632 960418','digits'),'01632960418');assert.equal(normalise('09.30','time'),'09:30');assert.equal(normalise('9:61','time'),null);assert.equal(normalise('phone number','digits'),null);
});
test('invalid bank structure and unsupported answers fail validation',()=>{
 for(const mutate of [b=>b.parts.pop(),b=>b.parts[0].questions[0].id=2,b=>b.parts[1].visual='untrusted-map',b=>b.parts[0].key[0].evidence='short',b=>b.parts[0].key[0].accepted=[],b=>b.parts[1].questions[6].options={A:'same',B:'same',C:'same'}]){const b=syntheticBank();mutate(b);assert.equal(validateBank(b).ok,false);}
 const s=splitBank(syntheticBank());for(const answers of [[],{'41':'alpha'},{'1':0}])assert.throws(()=>scoreAnswers(s.public,s.private,answers));
});
test('verification uses its own hashed session and Listening-only cookie; replay and logout are enforced',()=>fixture(async f=>{
 const login=await f.login();assert.match(login.response.headers.get('set-cookie'),/^__Secure-telw_listening=/);assert.match(login.response.headers.get('set-cookie'),/Path=\/ielts\/listening; HttpOnly; Secure; SameSite=Strict/);
 assert.equal((await f.api('auth/verify-code',{challengeId:login.challenge.challengeId,code:login.code})).status,400);
 assert.equal((await f.api('auth/session',undefined,login.cookie)).status,200);const row=f.db.prepare('SELECT token_hash FROM listening_sessions').get();assert.ok(!login.cookie.includes(row.token_hash));
 assert.equal((await f.api('auth/logout',{},login.cookie)).status,200);assert.equal((await f.api('auth/session',undefined,login.cookie)).status,401);
}));
test('code guessing, expiry and missing privacy consent fail closed',()=>fixture(async f=>{
 assert.equal((await f.api('auth/request-code',{email:'learner@example.com',consent:false})).status,400);
 const sent=await f.api('auth/request-code',{email:'learner@example.com',consent:true}),challenge=await sent.json(),code=f.messages.at(-1).payload.text.match(/code is (\d{8})/)[1];
 for(let i=0;i<5;i++)assert.equal((await f.api('auth/verify-code',{challengeId:challenge.challengeId,code:code==='00000000'?'11111111':'00000000'})).status,400);
 assert.equal((await f.api('auth/verify-code',{challengeId:challenge.challengeId,code})).status,400);
 f.advance(61);const next=await f.api('auth/request-code',{email:'next@example.com',consent:true}),d=await next.json();f.advance(601);assert.equal((await f.api('auth/verify-code',{challengeId:d.challengeId,code:f.messages.at(-1).payload.text.match(/code is (\d{8})/)[1]})).status,400);
}));
test('draft banks and incomplete audio cannot start or be published',()=>fixture(async f=>{
 const user=await f.login(),admin=await f.login('manutelw@gmail.com');assert.equal((await f.api('start',{},user.cookie)).status,503);
 assert.equal((await f.api('admin/bank',syntheticBank(),admin.cookie)).status,200);assert.equal((await f.api('status')).status,200);assert.equal((await (await f.api('status')).json()).ready,false);
 assert.equal((await f.api('admin/publish',{setId:'listening-fixture-01',checks:{}},admin.cookie)).status,400);
 assert.equal((await f.api('admin/publish',{setId:'listening-fixture-01',checks:{recordingsChecked:true,answersChecked:true,wordLimitsChecked:true,mapChecked:true}},admin.cookie)).status,400);
}));
test('trainer-only bank access and separate application paths preserve Reading isolation',()=>fixture(async f=>{
 const learner=await f.login();assert.equal((await f.api('admin/sets')).status,401);assert.equal((await f.api('admin/sets',undefined,learner.cookie)).status,403);assert.equal((await f.api('admin/bank',syntheticBank(),learner.cookie)).status,403);
 for(const path of ['/ielts/reading/','/ielts/listening/private/listening-set-01.private.json','/ielts/listening/server/auth.mjs'])assert.equal((await f.worker.fetch(new Request(origin+path),f.env)).status,404);
 assert.equal((await f.worker.fetch(new Request('https://clarionprep.com/ielts/listening/'),f.env)).status,404);
 assert.equal((await f.api('start',{},learner.cookie,{origin:'https://evil.example'})).status,403);
 const tables=f.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);assert.ok(tables.every(x=>x.startsWith('listening_')));
}));
test('audio uploads are private, repeated exact uploads are safe, and publication freezes the version',()=>fixture(async f=>{
 const {admin}=await f.install();assert.equal((await (await f.api('status')).json()).ready,true);assert.equal(f.bucket.size,4);const set=f.db.prepare('SELECT * FROM listening_sets').get();const review=JSON.parse(set.review_json);assert.equal(review.reviewer,'manutelw@gmail.com');assert.equal(review.checks.recordingsChecked,true);
 assert.throws(()=>f.db.prepare("UPDATE listening_sets SET title='changed' WHERE id=?").run(set.id),/IMMUTABLE/);assert.throws(()=>f.db.prepare('UPDATE listening_audio SET duration=90 WHERE set_id=?').run(set.id),/IMMUTABLE/);
 const changed=syntheticBank();changed.parts[0].turns[0].text+=' Changed.';assert.equal((await f.api('admin/bank',changed,admin.cookie)).status,409);
}));
test('concurrent starts resume one assignment and answer saves use revisions',()=>fixture(async f=>{
 await f.install();const user=await f.login();const r=await Promise.all([f.api('start',{},user.cookie),f.api('start',{},user.cookie)]);const a=await r[0].json(),b=await r[1].json();assert.equal(a.attemptId,b.attemptId);assert.doesNotMatch(JSON.stringify(a),/"accepted"|"evidence"|"turns"|private_json/);
 assert.equal((await f.api('save',{attemptId:a.attemptId,answers:{1:'alpha'},revision:0},user.cookie)).status,200);assert.equal((await f.api('save',{attemptId:a.attemptId,answers:{2:'alpha'},revision:0},user.cookie)).status,409);
 const resumed=await (await f.api('start',{},user.cookie)).json();assert.deepEqual(resumed.answers,{1:'alpha'});assert.equal(resumed.revision,1);
}));
test('controlled playback enforces reading time, position bounds, current part and protected byte ranges',()=>fixture(async f=>{
 await f.install();const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();const body={attemptId:a.attemptId,part:1,action:'play'};
 assert.equal((await f.api('playback',body,user.cookie)).status,409);f.advance(30);assert.equal((await f.api('playback',body,user.cookie)).status,200);
 assert.equal((await f.api('playback',{...body,action:'checkpoint',seconds:50},user.cookie)).status,400);
 const audioUrl=a.audio[0].url;const range=await f.worker.fetch(new Request(origin+audioUrl,{headers:{cookie:user.cookie,range:'bytes=0-15'}}),f.env);assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,16);assert.equal(range.headers.get('content-range'),'bytes 0-15/256');
 assert.equal((await f.worker.fetch(new Request(origin+audioUrl),f.env)).status,401);f.advance(60);assert.equal((await f.api('playback',{...body,action:'end',seconds:60},user.cookie)).status,200);
 assert.equal((await f.worker.fetch(new Request(origin+audioUrl,{headers:{cookie:user.cookie}}),f.env)).status,403);
 assert.equal((await f.api('playback',{...body,action:'end',seconds:60},user.cookie)).status,409);
}));
test('all four parts, full score, private trainer email and candidate feedback work without duplicate sends',()=>fixture(async f=>{
 const {bank}=await f.install();const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();
 for(let part=1;part<=4;part++){f.advance(30);assert.equal((await f.api('playback',{attemptId:a.attemptId,part,action:'play'},user.cookie)).status,200);f.advance(60);assert.equal((await f.api('playback',{attemptId:a.attemptId,part,action:'end',seconds:60},user.cookie)).status,200);}
 const answers=Object.fromEntries(bank.parts.flatMap(p=>p.key.map(k=>[k.id,k.accepted[0]])));const result=await (await f.api('submit',{attemptId:a.attemptId,answers,revision:0,score:0},user.cookie)).json();assert.equal(result.correct,40);assert.deepEqual(result.parts,[10,10,10,10]);
 assert.equal((await f.api('feedback',{attemptId:a.attemptId,consent:false},user.cookie)).status,400);
 assert.equal((await f.api('feedback',{attemptId:a.attemptId,consent:true,email:'attacker@example.com'},user.cookie)).status,200);const n=f.messages.length;assert.equal((await f.api('feedback',{attemptId:a.attemptId,consent:true},user.cookie)).status,200);assert.equal(f.messages.length,n);
 const candidate=f.messages.at(-1).payload;assert.deepEqual(candidate.to,['learner@example.com']);assert.doesNotMatch(candidate.html,/Synthetic evidence|Accepted answers|Synthetic-only script/);
 assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:true,name:'<script>bad</script>'},user.cookie)).status,200);const trainer=f.messages.at(-1).payload;assert.deepEqual(trainer.to,['manutelw@gmail.com']);assert.match(trainer.html,/Synthetic evidence|Accepted answers/);assert.doesNotMatch(trainer.html,/<script>/);
}));
test('late answers and forged scores cannot change stored results or another learner’s attempt',()=>fixture(async f=>{
 await f.install();const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();await f.api('save',{attemptId:a.attemptId,answers:{1:'alpha'},revision:0},user.cookie);
 const other=await f.login('other@example.com');assert.equal((await f.api('submit',{attemptId:a.attemptId,answers:{},revision:0},other.cookie)).status,404);
 f.advance(a.deadline-f.now());const result=await (await f.api('submit',{attemptId:a.attemptId,answers:{1:'wrong',2:'alpha'},revision:1,score:40},user.cookie)).json();assert.equal(result.correct,1);assert.equal(result.answered,1);
 const repeat=await (await f.api('submit',{attemptId:a.attemptId,answers:{},revision:1},user.cookie)).json();assert.deepEqual(repeat,result);
 assert.throws(()=>f.db.prepare("UPDATE listening_attempts SET score_json='{}' WHERE id=?").run(a.attemptId),/IMMUTABLE/);
}));
test('Listening enforces its own 15-day boundary and assigns an unseen version afterwards',()=>fixture(async f=>{
 await f.install();f.advance(61);await f.install('listening-fixture-02');const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();await f.api('submit',{attemptId:a.attemptId,answers:{1:'alpha'},revision:0},user.cookie);
 assert.equal((await f.api('start',{},user.cookie)).status,429);f.advance(15*86400-1);const fresh=await f.login();assert.equal((await f.api('start',{},fresh.cookie)).status,429);f.advance(1);const next=await f.api('start',{},fresh.cookie);assert.equal(next.status,200);assert.notEqual((await next.json()).setId,a.setId);
}));
test('public assets contain neither scripts nor private accepted answers',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/IELTS Listening/);assert.doesNotMatch(html,/accepted|Linton|01632960418|wing patterns/);
 const map=readFileSync(new URL('../public/riverside-plan.svg',import.meta.url),'utf8');assert.doesNotMatch(map,/First-aid|Bicycle hire|Art studio|Lecture hall/);
});
test('static admin canonical redirects stay internal and cannot redirect candidates off site',()=>fixture(async f=>{
 const original=f.env.ASSETS.fetch;
 f.env.ASSETS.fetch=async req=>new URL(req.url).pathname==='/admin.html'?new Response(null,{status:308,headers:{location:'/admin'}}):new Response('Private Listening admin shell');
 const response=await f.worker.fetch(new Request(origin+'/ielts/listening/admin/'),f.env);assert.equal(response.status,200);assert.equal(await response.text(),'Private Listening admin shell');assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
 f.env.ASSETS.fetch=async()=>new Response(null,{status:302,headers:{location:'https://evil.example/admin'}});assert.equal((await f.worker.fetch(new Request(origin+'/ielts/listening/admin/'),f.env)).status,503);f.env.ASSETS.fetch=original;
}));
test('missing bindings fail closed and invalid audio ranges do not expose audio',()=>fixture(async f=>{
 assert.deepEqual(await (await f.worker.fetch(new Request(origin+base+'status'),{})).json(),{ready:false});
 assert.equal((await f.worker.fetch(new Request(origin+base+'auth/session'),{})).status,503);
 await f.install();const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();f.advance(30);await f.api('playback',{attemptId:a.attemptId,part:1,action:'play'},user.cookie);
 for(const range of ['bytes=256-','bytes=10-2','bytes=1-2,5-8'])assert.equal((await f.worker.fetch(new Request(origin+a.audio[0].url,{headers:{cookie:user.cookie,range}}),f.env)).status,416);
}));
