import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './support.mjs';
import {remainingGroupSeconds} from '../public/group-timing.mjs';

test('question groups enforce reading pauses, protect each clip and preserve full Part 4 time after interruptions',()=>fixture(async({api,install,login,db,bucket,now,advance})=>{
 const {bank}=await install();
 const rows=[[1,1,1,5,30,25],[1,2,6,10,30,25],[2,1,11,20,60,50],[3,1,21,30,60,50],[4,1,31,40,60,50]];
 for(const [part,num,from,to,duration,reading] of rows){const key='group-'+part+'-'+num;bucket.set(key,new Uint8Array(256).fill(part));db.prepare('INSERT INTO listening_groups VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bank.id,part,num,from,to,key,duration,256,'fixture',reading,'read-'+from+'-'+to+'-'+reading+'.mp3','listen-'+from+'-'+to+'.mp3',2,2);}
 const user=await login();let attempt=await(await api('start',{},user.cookie)).json();assert.equal(attempt.playback.phase,'readCue');assert.equal(attempt.groups.length,5);assert.equal(attempt.deadline-now(),86400);
 const id=attempt.attemptId;
 const act=async(action,extra={})=>api('playback',{attemptId:id,part:attempt.playback.part,group:attempt.playback.groupIndex,action,...extra},user.cookie);
 for(let i=0;i<5;i++){
  const g=attempt.groups[i];assert.equal(attempt.playback.groupIndex,i);
  assert.equal((await api('submit',{attemptId:id,answers:{},revision:0},user.cookie)).status,409);
  assert.equal((await api('audio?attempt='+id+'&group='+i,undefined,user.cookie)).status,403);
  assert.equal((await act('play')).status,409);
  attempt.playback=(await(await act('read')).json()).playback;
  assert.equal((await act('play')).status,409);
  advance(g.readingSeconds);attempt.playback=(await(await act('play')).json()).playback;
  assert.equal((await api('audio?attempt='+id+'&group='+i,undefined,user.cookie)).status,200);
  assert.equal((await api('audio?attempt='+id+'&group='+(i+1),undefined,user.cookie)).status,403);
  assert.equal((await act('end',{seconds:g.duration})).status,400);
  // More than the former whole-test allowance can pass without consuming audio.
  advance(700);
  const left=remainingGroupSeconds(attempt.groups,attempt.playback,0,now());assert.ok(left>=g.duration+8);
  assert.equal((await api('save',{attemptId:id,answers:{1:'alpha'},revision:i},user.cookie)).status,200);
  advance(g.duration);const ended=await act('end',{seconds:g.duration});assert.equal(ended.status,200);attempt.playback=(await ended.json()).playback;
  if(attempt.playback.phase==='checkCue'){assert.equal((await act('play')).status,409);advance(5);attempt.playback=(await(await act('check')).json()).playback;assert.equal((await act('next')).status,409);advance(30);attempt.playback=(await(await act('next')).json()).playback;}
 }
 assert.equal(attempt.playback.part,5);assert.equal(attempt.playback.phase,'closing');assert.equal((await api('submit',{attemptId:id,answers:{},revision:5},user.cookie)).status,409);assert.equal((await act('finishCue')).status,409);advance(7);attempt.playback=(await(await act('finishCue')).json()).playback;assert.equal(attempt.playback.phase,'review');assert.equal(remainingGroupSeconds(attempt.groups,attempt.playback,0,now()),120);
 assert.equal((await api('save',{attemptId:id,answers:{1:'alpha',2:'alpha'},revision:5},user.cookie)).status,200);assert.equal((await api('submit',{attemptId:id,answers:{},revision:6},user.cookie)).status,409);
 advance(119);assert.equal(remainingGroupSeconds(attempt.groups,attempt.playback,0,now()),1);advance(1);assert.equal(remainingGroupSeconds(attempt.groups,attempt.playback,0,now()),0);
 assert.equal((await api('save',{attemptId:id,answers:{1:'wrong'},revision:6},user.cookie)).status,409);assert.equal(db.prepare('SELECT status FROM listening_attempts WHERE id=?').get(id).status,'active');const result=await api('submit',{attemptId:id,answers:{1:'wrong'},revision:6},user.cookie);assert.equal(result.status,200);assert.equal((await result.json()).correct,2);
}));

test('remaining-work timer counts spoken cues, reading pauses, content and final review without wall-clock cutoff',()=>{
 const groups=[{duration:300,readingSeconds:30,readCueSeconds:5,listenCueSeconds:4},{duration:200,readingSeconds:20,readCueSeconds:5,listenCueSeconds:4}];
 const state={groupIndex:0,phase:'readCue',positions:[0,0]};assert.equal(remainingGroupSeconds(groups,state,0,99999),576);
 state.phase='reading';state.readyAt=100030;assert.equal(remainingGroupSeconds(groups,state,0,100010),561);
 state.phase='listening';assert.equal(remainingGroupSeconds(groups,state,100,999999),437);
 state.groupIndex=1;assert.equal(remainingGroupSeconds(groups,state,150,999999),58);
});

test('recorded technical timing relief preserves the failed result and permits a fresh attempt',()=>fixture(async({api,install,login,db,advance,now})=>{
 await install('listening-before-timing-fix');advance(61);await install('listening-after-timing-fix');
 const user=await login();const a=await(await api('start',{},user.cookie)).json();await api('submit',{attemptId:a.attemptId,answers:{1:'alpha'},revision:0},user.cookie);
 assert.equal((await api('start',{},user.cookie)).status,429);
 const original=db.prepare('SELECT score_json FROM listening_attempts WHERE id=?').get(a.attemptId).score_json;
 db.prepare('INSERT INTO listening_timing_relief VALUES(?,?,?)').run(a.attemptId,'Verified legacy timer failure',now());
 assert.equal((await api('start',{},user.cookie)).status,200);
 assert.equal(db.prepare('SELECT score_json FROM listening_attempts WHERE id=?').get(a.attemptId).score_json,original);
}));
