import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleLearnerPortal} from '../../workers/ielts/learner-portal.mjs';
const origin='https://manuvikraman.com',service='https://telw-ielts-preview-worker.manutelw.workers.dev',prefix='/api/ielts/learner/';
const token='b'.repeat(64),cookie='__Secure-telw_ielts_learner='+token;
const request=(path,method='GET',data,extra={})=>new Request(origin+path,{method,headers:{...(method==='POST'?{origin,'content-type':'application/json'}:{}),...extra},...(data===undefined?{}:{body:typeof data==='string'?data:JSON.stringify(data)})});
const env=fetch=>({IELTS_ADMIN_SERVICE:{fetch}});
const publicHTML='<html><button id="identitySend">Verify</button><a href="/api/ielts/reading/admin">Reading admin</a><script>fetch("/api/ielts/auth/session");fetch("/api/ielts/reading/start");</script></html>';
test('public Reading entry gets the verified service page and uses same-domain learner APIs',async()=>{
 const response=await handleLearnerPortal(request('/ielts/reading/'),env(async req=>{assert.equal(req.url,service+'/ielts/reading/');return new Response(publicHTML,{headers:{'content-type':'text/html'}});}));
 assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('referrer-policy'),'same-origin');
 const html=await response.text();assert.match(html,/\/api\/ielts\/learner\/auth\/session/);assert.match(html,/\/api\/ielts\/learner\/reading\/start/);assert.match(html,/href="\/ielts\/admin\/"/);assert.doesNotMatch(html,/const BANK|workers\.dev|\/api\/ielts-reading\//);
});
test('production router connects the public entry before static routing and retires fixed-bank scoring',()=>{
 const source=readFileSync(new URL('../../worker-host-router.js',import.meta.url),'utf8');
 assert.match(source,/import \{handleLearnerPortal\}/);assert.match(source,/await handleLearnerPortal\(request,env\)/);assert.ok(source.indexOf('if(learnerPortal)return learnerPortal;')<source.indexOf('return base.fetch(request,env)'));assert.doesNotMatch(source,/return scoreIeltsReading\(|import \{scoreIeltsReading/);
});
test('an unexpected old page fails closed instead of silently serving the frozen bank',async()=>{
 const response=await handleLearnerPortal(request('/ielts/reading/'),env(async()=>new Response('<script>const BANK={};</script>')));assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/BANK/);
});
test('public aliases and www retain canonical redirects and HEAD returns no body',async()=>{
 for(const path of ['/ielts/reading','/ielts/reading/index.html']){const r=await handleLearnerPortal(request(path));assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/ielts/reading/');}
 const www=await handleLearnerPortal(new Request('https://www.manuvikraman.com/ielts/reading/'));assert.equal(www.status,308);assert.equal(www.headers.get('location'),origin+'/ielts/reading/');
 const head=await handleLearnerPortal(request('/ielts/reading/','HEAD'),env(async()=>new Response(publicHTML)));assert.equal(head.status,200);assert.equal(await head.text(),'');
});
test('legacy Reading APIs no longer bypass verified attempts',async()=>{
 for(const action of ['score','feedback-email','enquire'])assert.equal((await handleLearnerPortal(request('/api/ielts-reading/'+action,'POST',{}))).status,410);
});
test('other applications and private admin endpoints are not exposed through the learner gateway',async()=>{
 assert.equal(await handleLearnerPortal(request('/ascent/')),null);assert.equal(await handleLearnerPortal(request('/ielts/admin/')),null);
 assert.equal((await handleLearnerPortal(new Request('https://clarionprep.com/ielts/reading/'))).status,404);
 for(const action of ['reading/admin','reading/admin/import','auth/__proto__','admin'])assert.equal((await handleLearnerPortal(request(prefix+action))).status,404);
});
test('wrong methods and cross-origin or null-origin writes never contact the service',async()=>{
 let calls=0;const backend=env(()=>{calls++;throw Error('Unexpected call');});
 for(const foreign of ['https://evil.example','null',''])assert.equal((await handleLearnerPortal(request(prefix+'reading/start','POST',{track:'academic'},{origin:foreign}),backend)).status,403);
 assert.equal((await handleLearnerPortal(request(prefix+'reading/start'),backend)).status,405);assert.equal((await handleLearnerPortal(request('/ielts/reading/','POST',{}),backend)).status,405);assert.equal(calls,0);
});
test('any learner may request verification; trainer-only restrictions do not apply to candidates',async()=>{
 const data={email:'candidate@example.com',consent:true};
 const response=await handleLearnerPortal(request(prefix+'auth/request-code','POST',data,{'cf-connecting-ip':'192.0.2.2'}),env(async req=>{assert.equal(req.url,service+'/api/ielts/auth/request-code');assert.equal(req.headers.get('origin'),service);assert.equal(req.headers.get('cf-connecting-ip'),'192.0.2.2');assert.deepEqual(await req.json(),data);return new Response('{"challengeId":"synthetic"}',{headers:{'content-type':'application/json'}});}));assert.equal(response.status,200);
});
test('learner session is isolated from admin and ClarionPrep cookies and duplicate learner cookies are rejected',async()=>{
 const response=await handleLearnerPortal(request(prefix+'auth/session','GET',undefined,{cookie:cookie+'; __Secure-telw_ielts_admin=admin; clarion_admin_session=other',authorization:'unrelated'}),env(async req=>{assert.equal(req.headers.get('cookie'),'__Secure-telw_ielts='+token);assert.equal(req.headers.get('authorization'),null);return new Response('{}');}));assert.equal(response.status,200);
 const duplicate=await handleLearnerPortal(request(prefix+'auth/session','GET',undefined,{cookie:cookie+'; '+cookie}),env(()=>{throw Error('Must not forward');}));assert.equal(duplicate.status,401);
});
test('new learner cookies retain secure attributes and use their own name',async()=>{
 const response=await handleLearnerPortal(request(prefix+'auth/verify-code','POST',{challengeId:'fixture',code:'12345678'}),env(async()=>new Response('{}',{headers:{'set-cookie':'__Secure-telw_ielts='+token+'; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=43200'}})));
 assert.match(response.headers.get('set-cookie'),/^__Secure-telw_ielts_learner=/);assert.match(response.headers.get('set-cookie'),/Path=\/api; HttpOnly; Secure; SameSite=Strict/);assert.doesNotMatch(response.headers.get('set-cookie'),/Domain=|__Secure-telw_ielts_admin/);
});
test('assignment, saved attempt and cooldown responses are passed through without client-side rerandomising',async()=>{
 const assignment={ok:true,attemptId:'synthetic',versionId:'preview-academic-fixture',track:'academic',deadline:123456,answers:{0:1},passages:[]};
 const backend=env(async req=>{assert.equal(req.url,service+'/api/ielts/reading/start');assert.deepEqual(await req.json(),{track:'academic'});return new Response(JSON.stringify(assignment),{headers:{'content-type':'application/json'}});});
 for(let i=0;i<2;i++){const r=await handleLearnerPortal(request(prefix+'reading/start','POST',{track:'academic'},{cookie}),backend);assert.deepEqual(await r.json(),assignment);}
 const limited=await handleLearnerPortal(request(prefix+'reading/start','POST',{track:'academic'},{cookie}),env(async()=>new Response('{"eligibleAt":999999,"error":"15-day limit"}',{status:429,headers:{'content-type':'application/json'}})));assert.equal(limited.status,429);assert.equal((await limited.json()).eligibleAt,999999);
});
test('save, submit and report actions retain fixed upstream endpoints and stored attempt references',async()=>{
 for(const action of ['save','submit','feedback-email','enquire']){
  const body={attemptId:'fixture',answers:{0:1},consent:true};const response=await handleLearnerPortal(request(prefix+'reading/'+action,'POST',body,{cookie}),env(async req=>{assert.equal(req.url,service+'/api/ielts/reading/'+action);assert.deepEqual(await req.json(),body);return new Response('{"ok":true}',{headers:{'content-type':'application/json'}});}));assert.equal(response.status,200);
 }
});
test('request limits, unavailable service and unexpected redirects fail closed',async()=>{
 const large=await handleLearnerPortal(request(prefix+'reading/save','POST','x'.repeat(16385)),env(()=>{throw Error('Not called');}));assert.equal(large.status,413);
 assert.equal((await handleLearnerPortal(request('/ielts/reading/'))).status,503);
 const redirect=await handleLearnerPortal(request(prefix+'auth/session'),env(async()=>new Response(null,{status:302,headers:{location:'https://evil.example'}})));assert.equal(redirect.status,502);assert.equal(redirect.headers.get('location'),null);
 const error=await handleLearnerPortal(request(prefix+'auth/session'),env(async()=>{throw Error('internal private details');}));assert.equal(error.status,503);assert.doesNotMatch(await error.text(),/internal private details/);
});
test('learner sign-out clears only the learner session cookie',async()=>{
 const response=await handleLearnerPortal(request(prefix+'auth/logout','POST',undefined,{cookie}),env(async req=>{assert.equal(req.url,service+'/api/ielts/auth/logout');return new Response('{"ok":true}',{headers:{'set-cookie':'__Secure-telw_ielts=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}});}));assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/^__Secure-telw_ielts_learner=;.*Max-Age=0/);
});
