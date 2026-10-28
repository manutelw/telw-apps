import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {TOPICS,validateVersion} from '../../tools/ielts-reading-bank-validator.mjs';
import {buildImport,REVIEW_CHECKS} from '../../tools/ielts-reading-import-bank.mjs';
function draft(){return {id:'academic-test-fixture',track:'academic',approved:false,passages:TOPICS.academic.map(topic=>({topic,title:topic,paragraphs:['This synthetic paragraph exists only for structural testing.','This second synthetic paragraph is not a reviewed IELTS test.'],questions:Array.from({length:10},(_,i)=>i<6?['tf','A synthetic statement for tests '+i]:['mc','A synthetic question for tests '+i,['Option A','Option B','Option C']])})),keys:Array.from({length:40},(_,i)=>i%10<6?i%3:2),evidence:Array.from({length:40},(_,i)=>({verdict:i%10<6?['supported','contradicted','unstated'][i%3]:'option-supported',explanation:'A synthetic rationale used for a unit test only.'}))};}
function review(raw){return {decision:'approved',author:'Fixture Author',reviewer:'Fixture Reviewer',reviewedSha256:createHash('sha256').update(raw).digest('hex'),approvedAt:1000,checks:Object.fromEntries(REVIEW_CHECKS.map(k=>[k,true]))};}
test('MC option C is valid and does not require an unstated verdict',()=>assert.equal(validateVersion(draft()).ok,true));
test('malformed passages, questions, evidence and keys return failures without throwing',()=>{
 for(const mutate of [x=>x.passages[0]=null,x=>x.passages[0].questions[0]=null,x=>x.keys={},x=>x.evidence[0]=null,x=>x.evidence[1].verdict='supported',x=>x.passages[0].questions[6][2]=['A',' a ','B'],x=>x.approved=true]){
  const x=draft();mutate(x);assert.equal(validateVersion(x).ok,false);
 }
});
test('approval requires independent exact-content review and all editorial checks',()=>{
 const raw=JSON.stringify(draft()),r=review(raw);assert.match(buildImport(raw,r,1001),/INSERT INTO/);
 for(const change of [{reviewer:r.author},{reviewedSha256:'wrong'},{decision:'draft'},{checks:{}},{approvedAt:999999}])assert.throws(()=>buildImport(raw,{...r,...change},1001));
 assert.throws(()=>buildImport(raw+' ',r,1001));
});
test('private import SQL executes once, separates public content and preserves review metadata',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../../migrations/ielts/0001_diagnostic_state.sql',import.meta.url),'utf8'));
 const raw=JSON.stringify(draft()),sql=buildImport(raw,review(raw),1001);db.exec(sql);const row=db.prepare('SELECT * FROM ielts_test_versions').get();
 assert.doesNotMatch(row.content_json,/keys|evidence|Fixture Reviewer/);assert.equal(JSON.parse(row.private_key_json).review.reviewer,'Fixture Reviewer');
 assert.throws(()=>db.exec(sql),/UNIQUE/);db.close();
});

test('each passage must contain at least two NOT GIVEN answers even when the total is eight',()=>{
 const x=draft();x.keys[2]=0;x.evidence[2].verdict='supported';x.keys[12]=2;x.evidence[12].verdict='unstated';
 const result=validateVersion(x);assert.equal(result.ok,false);assert.match(result.errors.join(' '),/Passage 1: requires at least two NOT GIVEN/);
});
