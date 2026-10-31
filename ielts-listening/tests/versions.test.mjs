import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './support.mjs';
test('corrected versions replace future allocation while preserving old attempts and audio',()=>fixture(async({api,install,login,db,now,advance})=>{
 const {admin}=await install('listening-original-v1');
 const learner=await login();const first=await(await api('start',{},learner.cookie)).json();assert.equal(first.setId,'listening-original-v1');
 advance(61);await install('listening-corrected-v2');
 db.prepare('INSERT INTO listening_set_replacements VALUES(?,?,?)').run('listening-original-v1','listening-corrected-v2',now());
 const resumed=await(await api('start',{},learner.cookie)).json();assert.equal(resumed.attemptId,first.attemptId);
 const fresh=await login('fresh@example.com');const next=await(await api('start',{},fresh.cookie)).json();assert.equal(next.setId,'listening-corrected-v2');
 const sets=await(await api('admin/sets',undefined,admin.cookie)).json();assert.deepEqual(sets.sets.map(s=>s.id),['listening-corrected-v2']);
 assert.equal(db.prepare('SELECT count(*) AS n FROM listening_sets').get().n,2);
 assert.equal(db.prepare('SELECT count(*) AS n FROM listening_audio').get().n,8);
}));
