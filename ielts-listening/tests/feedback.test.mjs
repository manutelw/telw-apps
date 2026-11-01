import test from 'node:test';
import assert from 'node:assert/strict';
import {compactFeedback} from '../public/feedback.mjs';
test('concise feedback distinguishes skills, tracks and targets with explicitly provisional planning hours',()=>{
 const score={correct:28,answered:40,parts:[8,8,6,6],types:[{type:'completion',correct:16,total:20},{type:'choice',correct:12,total:20}]};
 const listening=compactFeedback({score,target:'7.0'});assert.match(listening,/Estimated Band 6.5/);assert.match(listening,/15–25 hours of guided training/);assert.match(listening,/20–40 hours of independent practice/);assert.match(listening,/after 5 guided hours/);assert.match(listening,/tel:\+919211392003/);assert.doesNotMatch(listening,/Question 40|Supporting detail/);
 const general=compactFeedback({skill:'Reading',track:'general',score,target:'7.0'});assert.match(general,/Estimated Band 5.5/);assert.match(general,/45–75 hours/);
 const academic=compactFeedback({skill:'Reading',track:'academic',score,target:'7.0'});assert.match(academic,/Estimated Band 6.5/);
 const noTarget=compactFeedback({score});assert.match(noTarget,/Select your target/);assert.doesNotMatch(noTarget,/15–25 hours/);
 const blank=compactFeedback({score:{correct:0,answered:0,types:[],parts:[0,0,0,0]},target:'7.0'});assert.match(blank,/Not enough evidence/);assert.doesNotMatch(blank,/Estimated Band|hours of guided training/);
 const achieved=compactFeedback({score,target:'6.0'});assert.match(achieved,/before deciding whether training is needed/);assert.doesNotMatch(achieved,/hours of guided training/);
 const hostile=compactFeedback({skill:'<script>',score,target:'<img>'});assert.doesNotMatch(hostile,/<script>|<img>/);
});

import {fixture} from './support.mjs';
test('Listening stores the chosen target and uses the same concise format for saved results and learner email',()=>fixture(async f=>{
 const {bank}=await f.install(),user=await f.login();const a=await(await f.api('start',{targetBand:'8.0'},user.cookie)).json();assert.equal(a.playback.targetBand,'8.0');
 const answers=Object.fromEntries(bank.parts.flatMap(p=>p.key).slice(0,32).map(k=>[k.id,k.accepted[0]]));const result=await(await f.api('submit',{attemptId:a.attemptId,revision:0,answers},user.cookie)).json();assert.match(result.analysisHtml,/Band 8.0/);assert.match(result.analysisHtml,/15–25 hours/);
 await f.api('feedback',{attemptId:a.attemptId,consent:true},user.cookie);assert.match(f.messages.at(-1).payload.html,/15–25 hours/);assert.doesNotMatch(f.messages.at(-1).payload.html,/Supporting detail/);
}));
