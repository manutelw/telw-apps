import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './support.mjs';
test('verified trainer admin runs bypass a prior learner cooldown and can repeat an exhausted set',()=>fixture(async f=>{
 const {admin}=await f.install();const normal=await (await f.api('start',{},admin.cookie)).json();
 assert.equal((await f.api('submit',{attemptId:normal.attemptId,answers:{},revision:0},admin.cookie)).status,200);
 assert.equal((await f.api('start',{},admin.cookie)).status,429);
 let previous=normal.attemptId;
 for(let i=0;i<3;i++){
  const response=await f.api('admin/start',{},admin.cookie);assert.equal(response.status,200);const run=await response.json();assert.equal(run.adminTest,true);assert.equal(run.setId,normal.setId);assert.notEqual(run.attemptId,previous);
  const resume=await (await f.api('admin/start',{},admin.cookie)).json();assert.equal(resume.attemptId,run.attemptId);
  assert.equal((await f.api('submit',{attemptId:run.attemptId,answers:{1:'alpha'},revision:0},admin.cookie)).status,200);previous=run.attemptId;
 }
 assert.equal(f.db.prepare('SELECT count(*) n FROM listening_attempts WHERE admin_test=1').get().n,3);
 assert.equal(f.db.prepare('SELECT status FROM listening_attempts WHERE id=?').get(normal.attemptId).status,'completed');
 assert.equal((await f.api('start',{},admin.cookie)).status,429);
}));
test('ordinary learners cannot use admin launch or forge the exemption, and the database enforces trainer identity',()=>fixture(async f=>{
 await f.install();const user=await f.login();assert.equal((await f.api('admin/start',{},user.cookie)).status,403);assert.equal((await f.api('admin/start',{})).status,401);
 const run=await (await f.api('start',{adminTest:true},user.cookie)).json();assert.equal(run.adminTest,false);
 assert.throws(()=>f.db.prepare('UPDATE listening_attempts SET admin_test=1 WHERE id=?').run(run.attemptId),/IMMUTABLE/);
 assert.equal((await f.api('submit',{attemptId:run.attemptId,answers:{},revision:0},user.cookie)).status,200);
 assert.equal((await f.api('start',{adminTest:true},user.cookie)).status,429);
 const row=f.db.prepare('SELECT * FROM listening_attempts WHERE id=?').get(run.attemptId);
 assert.throws(()=>f.db.prepare('INSERT INTO listening_attempts(id,learner_id,set_id,started_at,deadline,playback_json,admin_test) VALUES(?,?,?,?,?,?,1)').run(crypto.randomUUID(),row.learner_id,row.set_id,f.now(),f.now()+500,row.playback_json),/TRAINER_REQUIRED/);
}));

test('only the trainer can start a fresh test while preserving an unfinished run',()=>fixture(async f=>{
 const {admin}=await f.install();const old=await(await f.api('admin/start',{},admin.cookie)).json();await f.api('save',{attemptId:old.attemptId,answers:{1:'alpha'},revision:0},admin.cookie);
 const next=await(await f.api('admin/start',{fresh:true},admin.cookie)).json();assert.notEqual(next.attemptId,old.attemptId);const kept=f.db.prepare('SELECT status,answers_json FROM listening_attempts WHERE id=?').get(old.attemptId);assert.equal(kept.status,'abandoned');assert.equal(JSON.parse(kept.answers_json)[1],'alpha');
 const learner=await f.login();assert.equal((await f.api('admin/start',{fresh:true},learner.cookie)).status,403);
}));
