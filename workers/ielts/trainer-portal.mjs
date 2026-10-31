// Same-domain TELW trainer portal. The existing isolated IELTS service keeps
// its private D1 data; no credentials or question keys are held in this module.
const ORIGIN='https://manuvikraman.com';
const SERVICE='https://telw-ielts-preview-worker.manutelw.workers.dev';
const LOGIN='/ielts/admin/';
const PREFIX='/api/ielts/trainer/';
const ADMIN=PREFIX+'admin';
const COOKIE='__Secure-telw_ielts_admin';
const UPSTREAM_COOKIE='__Secure-telw_ielts';
const TRAINER='manutelw@gmail.com';
const privateHeaders={'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow, noarchive'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...privateHeaders,'content-type':'application/json; charset=utf-8'}});
const redirect=path=>new Response(null,{status:303,headers:{...privateHeaders,location:path}});
async function readBounded(request,max){
 if(Number(request.headers.get('content-length'))>max)throw Object.assign(Error('Request too large.'),{status:413});
 const reader=request.body?.getReader();if(!reader)throw Object.assign(Error('Request body required.'),{status:400});
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Object.assign(Error('Request too large.'),{status:413});}chunks.push(value);}
 const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;
}
function sessionCookie(request){
 const values=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
 if(values.length>1)throw Object.assign(Error('Please sign in again.'),{status:401});
 const value=values[0]?.slice(COOKIE.length+1)||'';
 return /^[a-f0-9]{64}$/.test(value)?UPSTREAM_COOKIE+'='+value:'';
}
function signInPage(){
 const nonce=crypto.randomUUID().replaceAll('-','');
 const content=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IELTS admin | TELW The English Workshop</title><style>body{font:16px/1.6 Arial,sans-serif;background:#f2f6f8;color:#173547;margin:0}main{max-width:520px;margin:6vh auto;background:white;padding:2rem;border-radius:12px}label{display:block;margin:1rem 0}input[type=email],input[type=text]{box-sizing:border-box;width:100%;font:inherit;padding:.65rem;border:1px solid #8c9ba3;border-radius:5px}button{font:inherit;background:#176581;color:white;border:0;border-radius:5px;padding:.7rem 1rem;cursor:pointer}a{color:#176581}[hidden]{display:none!important}#status{min-height:1.6rem}</style></head><body><main><p>TELW THE ENGLISH WORKSHOP · PRIVATE ADMIN</p><h1>IELTS administration</h1><p>Sign in with your TELW trainer email to manage the Reading question sets. This private area is for the trainer.</p><form id="request"><label for="email">Trainer email</label><input id="email" type="email" autocomplete="email" maxlength="254" required><label><input id="consent" type="checkbox" required> I agree to use my email to verify access to the TELW IELTS admin.</label><button id="send" type="submit">Send verification code</button></form><form id="verify" hidden><label for="code">Eight-digit code</label><input id="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" maxlength="8" required><p><button id="confirm" type="submit">Verify and open admin</button></p></form><p id="status" role="status" aria-live="polite"></p><p><a href="/ielts/listening/admin/">Listening administration</a></p><p><a href="/">Back to manuvikraman.com</a></p><script nonce="${nonce}">(()=>{const el=id=>document.getElementById(id);let challenge='';async function api(action,body){const r=await fetch('${PREFIX}auth/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Please try again.');return d;}el('request').onsubmit=async e=>{e.preventDefault();el('send').disabled=true;el('status').textContent='Sending code...';try{const d=await api('request-code',{email:el('email').value,consent:el('consent').checked});challenge=d.challengeId;el('verify').hidden=false;el('code').value='';el('code').focus();el('status').textContent='Code sent. Check your inbox and spam folder. Use the newest code within 10 minutes.';}catch(error){el('status').textContent=error.message;}finally{el('send').disabled=false;}};el('verify').onsubmit=async e=>{e.preventDefault();el('confirm').disabled=true;el('status').textContent='Verifying...';try{await api('verify-code',{challengeId:challenge,code:el('code').value});location.replace('${ADMIN}');}catch(error){el('status').textContent=error.message;el('confirm').disabled=false;}};fetch('${PREFIX}auth/session').then(r=>r.ok?r.json():null).then(d=>{if(d&&d.email==='${TRAINER}')location.replace('${ADMIN}');}).catch(()=>{});})();</script></main></body></html>`;
 return new Response(content,{headers:{...privateHeaders,'content-type':'text/html; charset=utf-8','content-security-policy':`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`}});
}
export async function handleTrainerPortal(request,env={}){
 const url=new URL(request.url);
 const login=['/ielts/admin','/ielts/admin/'].includes(url.pathname);
 const old=['/ielts/reading/admin','/ielts/reading/admin/'].includes(url.pathname);
 if(!login&&!old&&!url.pathname.startsWith(PREFIX))return null;
 if(url.origin!==ORIGIN)return new Response('Not found',{status:404,headers:privateHeaders});
 if(login||old){if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{...privateHeaders,allow:'GET'}});if(old||url.pathname==='/ielts/admin')return redirect(LOGIN);return signInPage();}
 const route=url.pathname.slice(PREFIX.length);
 const routes={'auth/request-code':['POST','/api/ielts/auth/request-code'],'auth/verify-code':['POST','/api/ielts/auth/verify-code'],'auth/session':['GET','/api/ielts/auth/session'],'auth/logout':['POST','/api/ielts/auth/logout'],'admin':['GET','/api/ielts/reading/admin'],'admin/import':['POST','/api/ielts/reading/admin/import']};
 const definition=Object.hasOwn(routes,route)?routes[route]:null;if(!definition)return json({error:'Not found'},404);
 if(request.method!==definition[0])return new Response('Method not allowed',{status:405,headers:{...privateHeaders,allow:definition[0]}});
 if(request.method==='POST'&&request.headers.get('origin')!==ORIGIN)return json({error:'Please use the TELW website.'},403);
 try{
  const headers=new Headers();const cookie=sessionCookie(request);if(cookie)headers.set('cookie',cookie);
  const type=request.headers.get('content-type');if(type)headers.set('content-type',type);
  const ip=request.headers.get('cf-connecting-ip');if(ip)headers.set('cf-connecting-ip',ip);
  let body;
  if(request.method==='POST'){
   if(route!=='auth/logout')body=await readBounded(request,route==='admin/import'?1024*1024:4096);headers.set('origin',SERVICE);
   if(route==='auth/request-code'){
    if(!type?.toLowerCase().startsWith('application/json'))return json({error:'JSON required.'},415);
    let input;try{input=JSON.parse(new TextDecoder().decode(body));}catch{return json({error:'Invalid request.'},400);}
    if(typeof input?.email!=='string'||input.email.trim().toLowerCase()!==TRAINER)return json({error:'Use the TELW trainer email for this private area.'},403);
   }
  }
  const target=new URL(definition[1],SERVICE);
  if(route==='admin')for(const key of ['loaded','unchanged']){const value=url.searchParams.get(key);if(value&&/^\d{1,2}$/.test(value))target.searchParams.set(key,value);}
  if(!env.IELTS_ADMIN_SERVICE?.fetch)return json({error:'The IELTS admin connection is not configured yet.'},503);
  const response=await env.IELTS_ADMIN_SERVICE.fetch(new Request(target,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(20000)}));
  const out=new Headers(privateHeaders);
  for(const name of ['content-type','content-security-policy']){const value=response.headers.get(name);if(value)out.set(name,value);}
  const cookies=response.headers.getSetCookie?.()||[response.headers.get('set-cookie')].filter(Boolean);
  for(const value of cookies)if(value.startsWith(UPSTREAM_COOKIE+'='))out.append('set-cookie',value.replace(UPSTREAM_COOKIE+'=',COOKIE+'='));
  if(route==='auth/logout'&&response.ok){out.set('location',LOGIN);return new Response(null,{status:303,headers:out});}
  if(route.startsWith('admin')&&response.status===401)return redirect(LOGIN);
  const location=response.headers.get('location');
  if(location){const next=new URL(location,SERVICE);if(next.origin!==SERVICE||next.pathname!=='/api/ielts/reading/admin')return json({error:'Unexpected response. Please try again.'},502);out.set('location',ADMIN+next.search);return new Response(null,{status:response.status,headers:out});}
  let content=await response.text();
  if(route.startsWith('admin')&&out.get('content-type')?.startsWith('text/html')){
   content=content.replaceAll('href="/api/ielts/reading/admin','href="'+ADMIN).replaceAll('action="/api/ielts/reading/admin','action="'+ADMIN);
   content=content.replace('<nav>','<nav><a href="/ielts/listening/admin/">Listening administration</a> <a href="'+LOGIN+'">IELTS admin sign-in</a>');
   content=content.replace('</main>', '<form method="post" action="'+PREFIX+'auth/logout"><button type="submit">Sign out of IELTS admin</button></form></main>');
  }
  return new Response(content,{status:response.status,headers:out});
 }catch(error){return json({error:error.status?error.message:'The IELTS admin is temporarily unavailable. Please try again.'},error.status||503);}
}
