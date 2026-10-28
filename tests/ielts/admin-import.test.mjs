import {test} from 'node:test';
import assert from 'node:assert/strict';
import preview from '../../workers/ielts/preview.mjs';
import router from '../../worker-host-router.js';
import {TOPICS} from '../../tools/ielts-reading-bank-validator.mjs';
import {fixture,withMail,login} from './support.mjs';
const origin='https://telw-ielts-preview-worker.manutelw.workers.dev';
const adminPath='/api/ielts/reading/admin';
function bundle(){
 const versions=[];
 for(const track of ['academic','general'])for(let n=1;n<=5;n++)versions.push({id:`${track}-synthetic-${n}`,track,approved:false,passages:TOPICS[track].map((topic,p)=>({topic,title:`Synthetic ${track} ${n} ${p}`,paragraphs:[`Synthetic-only passage for ${track} version ${n} and part ${p}; not learner content.`,`Additional test-only text for ${track} version ${n} and part ${p}.`],questions:Array.from({length:10},(_,q)=>q<6?['tf',`Synthetic ${track} ${n} ${p} statement ${q}`]:['mc',`Synthetic ${track} ${n} ${p} question ${q}`,['Choice A','Choice B','Choice C']])})),keys:Array.from({length:40},(_,i)=>i%10<6?i%3:0),evidence:Array.from({length:40},(_,i)=>({verdict:i%10<6?['supported','contradicted','unstated'][i%3]:'option-supported',explanation:'Synthetic evidence for software testing only; not a reviewed question.'}))});
 return {format:'telw-reading-preview-v1',reviewStatus:'independent-review-pending',versions};
}
function upload(data,cookie,requestOrigin=origin,consent=true){
 const form=new FormData();form.set('collection',new File([typeof data==='string'?data:JSON.stringify(data)],'private-collection.json',{type:'application/json'}));if(consent)form.set('previewConsent','on');
 return new Request(origin+adminPath+'/import',{method:'POST',headers:{origin:requestOrigin,cookie},body:form});
}
async function setup(run){const f=fixture(true);try{await withMail(f,async messages=>{const admin=await login(f,messages,'manutelw@gmail.com');await run({...f,messages,cookie:admin.cookie});});}finally{}}
const count=f=>f.sqlite.prepare('SELECT count(*) AS n FROM ielts_test_versions').get().n;
test('preview trainer loads all ten sets atomically, inspects them and can safely repeat upload',()=>setup(async f=>{
 const data=bundle(),response=await preview.fetch(upload(data,f.cookie),f.env);assert.equal(response.status,303);assert.equal(count(f),10);
 const row=f.sqlite.prepare('SELECT * FROM ielts_test_versions LIMIT 1').get();assert.equal(JSON.parse(row.private_key_json).review.decision,'preview-testing-only');assert.equal(JSON.parse(row.private_key_json).review.independentReview,'pending');assert.ok(row.approved_at);
 const repeated=await preview.fetch(upload(data,f.cookie),f.env);assert.equal(repeated.status,303);assert.match(repeated.headers.get('location'),/loaded=0&unchanged=10/);assert.equal(count(f),10);
 const admin=await preview.fetch(new Request(origin+adminPath,{headers:{cookie:f.cookie}}),f.env);assert.equal(admin.status,200);const html=await admin.text();assert.match(html,/>400<\/strong>/);assert.equal((html.match(/<summary>Set /g)||[]).length,10);assert.match(html,/Review pending/);assert.match(admin.headers.get('content-security-policy'),/form-action 'self'/);
}));
test('preview batch loading denies unauthenticated, non-trainer and cross-origin requests; production cannot use the preview gate',()=>setup(async f=>{
 const other=await login(f,f.messages,'learner@example.com'),data=bundle();
 assert.equal((await preview.fetch(upload(data,''),f.env)).status,401);
 assert.equal((await preview.fetch(upload(data,other.cookie),f.env)).status,403);
 assert.equal((await preview.fetch(upload(data,f.cookie,'https://evil.example'),f.env)).status,403);
 const form=new FormData();form.set('collection',new File([JSON.stringify(data)],'private.json'));form.set('previewConsent','on');
 const prod=await router.fetch(new Request('https://manuvikraman.com'+adminPath+'/import',{method:'POST',headers:{origin:'https://manuvikraman.com',cookie:f.cookie},body:form}),f.env);assert.equal(prod.status,404);assert.equal(count(f),0);
}));
test('invalid collection, missing consent and repeated passages or questions write nothing',()=>setup(async f=>{
 const cases=[{bad:'format'},bundle(),bundle(),bundle(),bundle()];
 cases[1].versions.pop();cases[2].versions[1].passages[0].paragraphs=cases[2].versions[0].passages[0].paragraphs;cases[3].versions[1].passages[0].questions[0]=cases[3].versions[0].passages[0].questions[0];cases[4].versions[9].keys[0]=99;
 for(const data of cases){assert.equal((await preview.fetch(upload(data,f.cookie),f.env)).status,400);assert.equal(count(f),0);}
 assert.equal((await preview.fetch(upload(bundle(),f.cookie,origin,false),f.env)).status,400);assert.equal(count(f),0);
 assert.equal((await preview.fetch(upload('{not json',f.cookie),f.env)).status,400);assert.equal(count(f),0);
}));
test('changed content under an existing version ID is rejected without partially inserting other sets',()=>setup(async f=>{
 const data=bundle();assert.equal((await preview.fetch(upload(data,f.cookie),f.env)).status,303);
 const changed=bundle();changed.versions[0].id='academic-synthetic-new';changed.versions[1].passages[0].paragraphs[0]+=' Changed content.';
 const response=await preview.fetch(upload(changed,f.cookie),f.env);assert.equal(response.status,409);assert.equal(count(f),10);assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM ielts_test_versions WHERE id='preview-academic-synthetic-new'").get().n,0);
}));
test('oversized multipart collection fails closed',()=>setup(async f=>{
 const response=await preview.fetch(upload('x'.repeat(1024*1024+1),f.cookie),f.env);assert.equal(response.status,413);assert.equal(count(f),0);
}));
test('a transaction failure does not leave a partially imported collection',()=>setup(async f=>{
 f.sqlite.exec("CREATE TRIGGER test_reject_bank BEFORE INSERT ON ielts_test_versions WHEN NEW.id='preview-general-synthetic-5' BEGIN SELECT RAISE(ABORT,'test failure'); END;");
 const response=await preview.fetch(upload(bundle(),f.cookie),f.env);assert.equal(response.status,503);assert.equal(count(f),0);assert.doesNotMatch(await response.text(),/test failure/);
}));
