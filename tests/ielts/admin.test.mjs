import {test} from 'node:test';
import assert from 'node:assert/strict';
import router from '../../worker-host-router.js';
import preview from '../../workers/ielts/preview.mjs';
import {fixture,withMail,login} from './support.mjs';
test('question bank admin is private to verified TELW trainer and never caches answers',async()=>{
 const f=fixture(true);
 await withMail(f,async messages=>{
  const content={passages:[{title:'Private <title>',paragraphs:['Private passage'],questions:[['tf','Private statement']]}]};
  f.sqlite.prepare('INSERT INTO ielts_test_versions(id,skill,track,approved_at,content_json,private_key_json,created_at) VALUES(?,?,?,?,?,?,?)').run('test-version','reading','academic',1,JSON.stringify(content),JSON.stringify({keys:[2]}),1);
  const url='https://manuvikraman.com/api/ielts/reading/admin';
  const get=(cookie='',address=url)=>router.fetch(new Request(address,{headers:{cookie}}),f.env);
  assert.equal((await get()).status,401);
  const alias=await get('','https://manuvikraman.com/ielts/reading/admin');assert.equal(alias.status,303);assert.equal(alias.headers.get('location'),'/api/ielts/reading/admin');
  const other=await login(f,messages,'learner@example.com');assert.equal((await get(other.cookie)).status,403);
  const admin=await login(f,messages,'manutelw@gmail.com');const response=await get(admin.cookie);
  assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
  const body=await response.text();assert.match(body,/test-version/);assert.match(body,/Answer: NOT GIVEN/);assert.match(body,/Private &lt;title&gt;/);assert.doesNotMatch(body,/Private <title>/);
  assert.equal((await get(admin.cookie,'https://clarionprep.com/api/ielts/reading/admin')).status,404);
  const pv=await preview.fetch(new Request('https://telw-ielts-preview-worker.manutelw.workers.dev/api/ielts/reading/admin',{headers:{cookie:admin.cookie}}),f.env);
  assert.equal(pv.status,200);assert.match(await pv.text(),/test-version/);
 });
});
