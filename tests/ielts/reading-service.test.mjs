import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {handleReading} from '../../ielts-reading-service/workers/ielts/reading.mjs';
const here=p=>new URL(p,import.meta.url);
function d1(db){const wrap=(text,args=[])=>({bind:(...a)=>wrap(text,a),first:async()=>db.prepare(text).get(...args)??null,all:async()=>({results:db.prepare(text).all(...args)}),run:async()=>db.prepare(text).run(...args)});return {prepare:t=>wrap(t),batch:async list=>{for(const s of list)await s.run();}};}
function setup(email){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(here('../../ielts-reading-service/schema.sql'),'utf8'));
 const now=Math.floor(Date.now()/1000),token='a'.repeat(64);
 db.prepare('INSERT INTO ielts_learners VALUES(?,?,?,?,?)').run('L1','h',email,now,now);
 db.prepare('INSERT INTO ielts_sessions VALUES(?,?,?,?,NULL)').run(createHash('sha256').update(token).digest('hex'),'L1',now,now+3600);
 const passage=i=>({title:'Passage '+i,paragraphs:['Synthetic paragraph one for tests.','Synthetic paragraph two for tests.'],questions:Array.from({length:10},(_,j)=>j<6?['tf','Synthetic statement '+i+'-'+j]:['mc','Synthetic question '+i+'-'+j,['A option','B option','C option']])});
 for(const id of ['g1','g2'])db.prepare('INSERT INTO ielts_test_versions VALUES(?,?,?,?,?,?,?)').run(id,'reading','general',now-10,JSON.stringify({passages:[1,2,3,4].map(passage)}),JSON.stringify({keys:Array(40).fill(0)}),now-10);
 const sent=[];globalThis.fetch=async(url,opts)=>{sent.push(JSON.parse(opts.body));return new Response('{}');};
 const env={IELTS_DB:d1(db),IELTS_AUTH_SECRET:'x'.repeat(32),RESEND_API_KEY:'k',TELW_FROM_EMAIL:'TELW <t@example.com>'};
 const call=async(action,body)=>{const r=await handleReading(new Request('https://manuvikraman.com/api/ielts/reading/'+action,{method:'POST',headers:{origin:'https://manuvikraman.com','content-type':'application/json',cookie:'__Secure-telw_ielts='+token},body:JSON.stringify(body)}),env);return [r.status,await r.json()];};
 return {db,call,sent};
}
async function complete(call){const [s,a]=await call('start',{track:'general'});assert.equal(s,200);const [s2,r]=await call('submit',{attemptId:a.attemptId,answers:Object.fromEntries(Array.from({length:40},(_,i)=>[i,i<30?0:1]))});assert.equal(s2,200);return {a,r};}
test('the trainer can repeat Reading tests, reusing sets once all are used',async()=>{
 const {call}=setup('manutelw@gmail.com');
 for(let i=0;i<3;i++)await complete(call);
});
test('learners still wait 15 days between Reading tests',async()=>{
 const {call}=setup('learner@example.com');await complete(call);
 const [s,body]=await call('start',{track:'general'});assert.equal(s,429);assert.match(body.error,/15 days/);
});
test('the feedback email names the test type in full and includes the band level and target',async()=>{
 const {call,sent}=setup('learner@example.com');const {a}=await complete(call);
 const [s]=await call('feedback-email',{attemptId:a.attemptId,consent:true,target:'6.5'});assert.equal(s,200);
 const html=sent.at(-1).html;
 assert.match(html,/General Training · 30\/40 correct/);assert.doesNotMatch(html,/>general ·/);
 assert.match(html,/Your Reading level:/);assert.match(html,/Band 6\.5/);
});
test('the Reading service keeps an identical copy of the shared feedback text',()=>{
 const copy=readFileSync(here('../../ielts-reading-service/workers/ielts/feedback.mjs'),'utf8').split('\n').slice(2).join('\n');
 assert.equal(copy,readFileSync(here('../../ielts-listening/public/feedback.mjs'),'utf8'));
});
