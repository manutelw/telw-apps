import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,analysisHtml} from '../server/analysis.mjs';
import {splitBank} from '../server/bank.mjs';
import {syntheticBank,fixture} from './support.mjs';
test('analysis agrees with scoring, distinguishes limits and blanks, escapes evidence and proposes targeted practice',()=>{
 const bank=syntheticBank();bank.parts[0].questions[0].prompt='<img src=x onerror=bad>';
 const {public:pub,private:priv}=splitBank(bank),a=analyse(pub,priv,{1:'alpha extra',2:'alpha',17:'A',31:'sample phrase'});
 assert.equal(a.score.correct,3);assert.equal(a.questions.length,40);assert.match(a.questions[0].reason,/word or number rule/);assert.match(a.questions[2].reason,/No answer/);assert.equal(a.parts[0].correct,1);
 const html=analysisHtml(a,true,true);assert.match(html,/Proposed TELW training programme/);assert.match(html,/fresh ten-question/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|<details>|<summary>/);
 const blank=analysisHtml(analyse(pub,priv,{}),true);assert.match(blank,/cannot be established/);assert.doesNotMatch(blank,/Practice block 1/);
});
test('detailed evidence is withheld until completion and training email requires consent, respects ownership and sends once',()=>fixture(async f=>{
 await f.install();const user=await f.login(),a=await (await f.api('start',{},user.cookie)).json();assert.equal(a.result,undefined);assert.doesNotMatch(JSON.stringify(a),/Synthetic evidence/);
 assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:true},user.cookie)).status,409);
 const done=await (await f.api('submit',{attemptId:a.attemptId,revision:0,answers:{1:'alpha',2:'alpha extra'}},user.cookie)).json();assert.match(done.analysisHtml,/Question 40/);assert.match(done.analysisHtml,/word or number rule/);
 const resumed=await (await f.api('state',{attemptId:a.attemptId},user.cookie)).json();assert.equal(resumed.result.analysisHtml,done.analysisHtml);
 assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:false},user.cookie)).status,400);
 const other=await f.login('other@example.com');assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:true},other.cookie)).status,404);
 assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:true,targetBand:'7.0'},user.cookie)).status,200);const n=f.messages.length,m=f.messages.at(-1).payload;assert.deepEqual(m.to,['manutelw@gmail.com']);assert.equal(m.reply_to,'learner@example.com');assert.match(m.html,/Proposed TELW training programme/);assert.match(m.html,/7.0/);assert.doesNotMatch(m.html,/Synthetic-only script|<details>/);
 assert.equal((await f.api('enquire',{attemptId:a.attemptId,consent:true},user.cookie)).status,200);assert.equal(f.messages.length,n);
}));
