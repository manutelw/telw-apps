import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './support.mjs';
test('only server-marked trainer runs may fast-forward grouped and legacy audio',()=>fixture(async f=>{
 const {admin,bank}=await f.install();
 for(const grouped of [false,true]){
  if(grouped)f.db.prepare('INSERT INTO listening_groups VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bank.id,1,1,1,10,'fixture-group',60,256,'fixture',5,'read.mp3','listen.mp3',2,2);
  for(const trainer of [false,true]){
   const user=trainer?admin:await f.login(grouped?'grouped@example.com':'legacy@example.com');
   const run=await(await f.api(trainer?'admin/start':'start',{},user.cookie)).json();
   const act=(action,extra={})=>f.api('playback',{attemptId:run.attemptId,part:1,...(grouped?{group:0}:{}),action,...extra},user.cookie);
   if(grouped)await act('read');
   f.advance(30);assert.equal((await act('play')).status,200);
   assert.equal((await act('checkpoint',{seconds:55,adminTest:true})).status,trainer?200:400);
   assert.equal((await act('end',{seconds:60})).status,trainer?200:400);
   assert.equal((await act('checkpoint',{seconds:999})).status>=400,true);
   f.db.prepare("UPDATE listening_attempts SET status='abandoned' WHERE id=?").run(run.attemptId);
  }
 }
}));
