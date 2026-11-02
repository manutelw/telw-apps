import test from 'node:test';
import assert from 'node:assert/strict';
import {viewForQuestion,resumeAttempt} from '../public/navigation.mjs';
import {remainingGroupSeconds} from '../public/group-timing.mjs';
import {fixture} from './support.mjs';
test('all forty question destinations stay in-page and select the correct part and group',()=>{
 const groups=[{part:1,from:1,to:10},{part:2,from:11,to:16},{part:2,from:17,to:20},{part:3,from:21,to:24},{part:3,from:25,to:30},{part:4,from:31,to:40}];
 for(let id=1;id<=40;id++){const v=viewForQuestion(groups,id);assert.equal(v.part,Math.floor((id-1)/10));assert.ok(id>=v.range.from&&id<=v.range.to);}
 assert.throws(()=>viewForQuestion(groups,41));assert.equal(resumeAttempt({status:'active',deadline:Date.now()/1000+100},'verified@example.com'),true);assert.equal(resumeAttempt({status:'completed',deadline:Date.now()/1000+100},'verified@example.com'),false);
});
test('standard timer counts every part-check interval once and retains the full two-minute review',()=>{
 const groups=Array.from({length:4},(_,i)=>({part:i+1,duration:360,readingSeconds:50,readCueSeconds:4,listenCueSeconds:3}));
 const state={standardFormat:true,phase:'readCue',groupIndex:0,positions:[0,0,0,0]};assert.ok(remainingGroupSeconds(groups,state,0,1)>1800);
 state.groupIndex=1;state.phase='checking';state.readyAt=31;const check=remainingGroupSeconds(groups,state,0,1);state.phase='readCue';assert.equal(check-remainingGroupSeconds(groups,state,0,1),30);
 state.phase='review';state.reviewUntil=121;assert.equal(remainingGroupSeconds(groups,state,0,1),120);
});
test('resuming and revisiting saved state never revokes the session or drops answers',()=>fixture(async f=>{
 await f.install();const user=await f.login(),a=await(await f.api('start',{},user.cookie)).json();await f.api('save',{attemptId:a.attemptId,revision:0,answers:{1:'alpha',40:'sample phrase'}},user.cookie);
 for(let i=0;i<4;i++){const state=await(await f.api('state',{attemptId:a.attemptId},user.cookie)).json();assert.equal(state.answers[1],'alpha');assert.equal(state.answers[40],'sample phrase');assert.equal((await f.api('auth/session',undefined,user.cookie)).status,200);}
 assert.equal(f.db.prepare('SELECT count(*) n FROM listening_sessions WHERE revoked_at IS NOT NULL').get().n,0);
}));
