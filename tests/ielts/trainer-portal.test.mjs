import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {handleTrainerPortal} from '../../workers/ielts/trainer-portal.mjs';
const base='https://manuvikraman.com',prefix='/api/ielts/trainer/',service='https://telw-ielts-preview-worker.manutelw.workers.dev',token='a'.repeat(64),cookie='__Secure-telw_ielts_admin='+token;
const req=(path,method='GET',body,headers={})=>new Request(base+path,{method,headers:{...(method==='POST'?{origin:base,'content-type':'application/json'}:{}),...headers},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
const env=fn=>({IELTS_ADMIN_SERVICE:{fetch:fn}});
test('TELW routes are isolated from ClarionPrep and existing learner routes',async()=>{
 assert.equal(await handleTrainerPortal(req('/ielts/reading/')),null);assert.equal(await handleTrainerPortal(req('/api/ielts-reading/score')),null);
 assert.equal((await handleTrainerPortal(new Request('https://clarionprep.com/ielts/admin/'))).status,404);
 assert.equal((await handleTrainerPortal(req('/api/ielts/trainer/unknown'))).status,404);
 assert.equal((await handleTrainerPortal(req('/api/ielts/trainer/__proto__'))).status,404);
 const old=await handleTrainerPortal(req('/ielts/reading/admin'));assert.equal(old.status,303);assert.equal(old.headers.get('location'),'/ielts/admin/');
});
test('trainer login page and all login requests remain on manuvikraman.com',async()=>{
 const response=await handleTrainerPortal(req('/ielts/admin/'));assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('content-security-policy'),/script-src 'nonce-/);assert.equal(response.headers.get('referrer-policy'),'same-origin');
 const html=await response.text();assert.match(html,/IELTS administration/);assert.match(html,/autocomplete="one-time-code"/);assert.doesNotMatch(html,/clarionprep\.com|workers\.dev|localStorage/);new vm.Script(html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1]);
});
test('POST requires same origin and every action enforces its method before contacting the service',async()=>{
 let called=0;const backend=env(()=>{called++;throw Error('should not run');});
 assert.equal((await handleTrainerPortal(req(prefix+'auth/request-code','POST',{email:'manutelw@gmail.com'},{origin:'https://evil.example'}),backend)).status,403);
 assert.equal((await handleTrainerPortal(req(prefix+'auth/request-code'),backend)).status,405);
 assert.equal((await handleTrainerPortal(req(prefix+'admin','POST',{}),backend)).status,405);for(const origin of ['null',''])assert.equal((await handleTrainerPortal(req(prefix+'admin/import','POST','upload',{origin}),backend)).status,403);assert.equal(called,0);
});
test('code sending accepts only the TELW trainer email and bounds input',async()=>{
 let called=0;const backend=env(()=>{called++;return new Response('{}');});
 assert.equal((await handleTrainerPortal(req(prefix+'auth/request-code','POST',{email:'learner@example.com',consent:true}),backend)).status,403);
 assert.equal((await handleTrainerPortal(req(prefix+'auth/request-code','POST','{bad'),backend)).status,400);
 assert.equal((await handleTrainerPortal(req(prefix+'auth/request-code','POST','x'.repeat(4097)),backend)).status,413);assert.equal(called,0);
});
test('only namespaced trainer session is forwarded; unrelated cookies and headers are excluded',async()=>{
 const backend=env(async request=>{
  assert.equal(request.url,service+'/api/ielts/auth/verify-code');assert.equal(request.headers.get('origin'),service);assert.equal(request.headers.get('cookie'),'__Secure-telw_ielts='+token);assert.equal(request.headers.get('cf-connecting-ip'),'192.0.2.1');assert.equal(request.headers.get('authorization'),null);assert.deepEqual(await request.json(),{challengeId:'synthetic',code:'12345678'});return new Response('{}',{headers:{'content-type':'application/json'}});
 });
 const response=await handleTrainerPortal(req(prefix+'auth/verify-code','POST',{challengeId:'synthetic',code:'12345678'},{cookie:cookie+'; clarion_admin_session=unrelated; __Secure-telw_ielts=other','cf-connecting-ip':'192.0.2.1',authorization:'unrelated'}),backend);assert.equal(response.status,200);
 const dup=await handleTrainerPortal(req(prefix+'auth/session','GET',undefined,{cookie:cookie+'; '+cookie}),backend);assert.equal(dup.status,401);
});
test('session response uses a separate secure cookie on the main site',async()=>{
 const response=await handleTrainerPortal(req(prefix+'auth/verify-code','POST',{challengeId:'synthetic',code:'12345678'}),env(async()=>new Response('{}',{headers:{'content-type':'application/json','set-cookie':'__Secure-telw_ielts='+token+'; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=43200'}})));
 const value=response.headers.get('set-cookie');assert.match(value,/^__Secure-telw_ielts_admin=/);assert.match(value,/Path=\/api; HttpOnly; Secure; SameSite=Strict/);assert.doesNotMatch(value,/Domain=/);
});
test('question dashboard and import form keep all admin navigation on the main site',async()=>{
 const html='<main><nav><a href="/ielts/reading/">Learner app</a></nav><h1>IELTS Reading admin</h1><a href="/api/ielts/reading/admin">Back</a><form action="/api/ielts/reading/admin/import" method="post">Collection</form></main>';
 const response=await handleTrainerPortal(req(prefix+'admin','GET',undefined,{cookie}),env(async request=>{assert.equal(request.url,service+'/api/ielts/reading/admin');return new Response(html,{headers:{'content-type':'text/html','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; form-action 'self'"}});}));
 const body=await response.text();assert.match(body,/action="\/api\/ielts\/trainer\/admin\/import"/);assert.match(body,/href="\/api\/ielts\/trainer\/admin"/);assert.match(body,/Sign out of IELTS admin/);assert.doesNotMatch(body,/workers\.dev|clarionprep\.com/);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('referrer-policy'),'same-origin');
 const expired=await handleTrainerPortal(req(prefix+'admin'),env(async()=>new Response('sign in',{status:401})));assert.equal(expired.status,303);assert.equal(expired.headers.get('location'),'/ielts/admin/');
 const denied=await handleTrainerPortal(req(prefix+'admin','GET',undefined,{cookie}),env(async()=>new Response('Access denied',{status:403})));assert.equal(denied.status,403);
});
test('only expected local admin redirects are accepted',async()=>{
 const ok=await handleTrainerPortal(req(prefix+'admin','GET',undefined,{cookie}),env(async()=>new Response(null,{status:303,headers:{location:'/api/ielts/reading/admin?loaded=8&unchanged=2'}})));assert.equal(ok.headers.get('location'),prefix+'admin?loaded=8&unchanged=2');
 for(const target of ['https://evil.example/steal','/api/ielts/auth/session']){const bad=await handleTrainerPortal(req(prefix+'admin','GET',undefined,{cookie}),env(async()=>new Response(null,{status:302,headers:{location:target}})));assert.equal(bad.status,502);assert.equal(bad.headers.get('location'),null);}
});
test('sign out revokes the trainer service session and clears only the admin cookie',async()=>{
 const response=await handleTrainerPortal(req(prefix+'auth/logout','POST',undefined,{cookie}),env(async request=>{assert.equal(request.url,service+'/api/ielts/auth/logout');assert.equal(request.headers.get('cookie'),'__Secure-telw_ielts='+token);return new Response('{}',{headers:{'set-cookie':'__Secure-telw_ielts=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}});}));
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/ielts/admin/');assert.match(response.headers.get('set-cookie'),/__Secure-telw_ielts_admin=;.*Max-Age=0/);
});
test('private collection uploads go only to the fixed IELTS admin endpoint',async()=>{
 const form=new FormData();form.set('collection',new File(['{"synthetic":true}'],'private.json'));form.set('previewConsent','on');
 const request=new Request(base+prefix+'admin/import',{method:'POST',headers:{origin:base,cookie},body:form});
 const response=await handleTrainerPortal(request,env(async forwarded=>{assert.equal(forwarded.url,service+'/api/ielts/reading/admin/import');const data=await forwarded.formData();assert.equal(await data.get('collection').text(),'{"synthetic":true}');return new Response(null,{status:303,headers:{location:'/api/ielts/reading/admin?loaded=8&unchanged=2'}});}));assert.equal(response.status,303);assert.equal(response.headers.get('location'),prefix+'admin?loaded=8&unchanged=2');
});
test('missing service and provider errors fail closed without exposing internal details',async()=>{
 assert.equal((await handleTrainerPortal(req(prefix+'admin'))).status,503);
 const error=await handleTrainerPortal(req(prefix+'admin'),env(async()=>{throw Error('private provider details');}));assert.equal(error.status,503);assert.doesNotMatch(await error.text(),/private provider details/);
});
