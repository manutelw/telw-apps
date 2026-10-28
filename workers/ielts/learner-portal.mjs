// Public TELW Reading entry backed by the same private IELTS service as the
// trainer dashboard. Bank selection, ownership, scoring and cooldown stay there.
const ORIGIN='https://manuvikraman.com';
const SERVICE='https://telw-ielts-preview-worker.manutelw.workers.dev';
const PAGE='/ielts/reading/';
const PREFIX='/api/ielts/learner/';
const COOKIE='__Secure-telw_ielts_learner';
const UPSTREAM_COOKIE='__Secure-telw_ielts';
const headers={'cache-control':'private, no-store, max-age=0','referrer-policy':'same-origin','x-content-type-options':'nosniff','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow, noarchive'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
async function readBody(request,max){
 if(Number(request.headers.get('content-length'))>max)throw Object.assign(Error('Request too large.'),{status:413});
 const reader=request.body?.getReader();if(!reader)throw Object.assign(Error('Request body required.'),{status:400});
 let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Object.assign(Error('Request too large.'),{status:413});}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}return bytes;
}
function learnerCookie(request){
 const found=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
 if(found.length>1)throw Object.assign(Error('Please verify your email again.'),{status:401});
 const value=found[0]?.slice(COOKIE.length+1)||'';
 return /^[a-f0-9]{64}$/.test(value)?UPSTREAM_COOKIE+'='+value:'';
}
function definition(action){
 if(['auth/request-code','auth/verify-code','auth/logout'].includes(action))return ['POST','/api/ielts/'+action,4096];
 if(action==='auth/session')return ['GET','/api/ielts/auth/session',0];
 if(['reading/start','reading/save','reading/submit','reading/feedback-email','reading/enquire'].includes(action))return ['POST','/api/ielts/'+action,16384];
 return null;
}
export async function handleLearnerPortal(request,env={}){
 const url=new URL(request.url);
 const page=['/ielts/reading','/ielts/reading/','/ielts/reading/index.html'].includes(url.pathname);
 const legacy=url.pathname.startsWith('/api/ielts-reading/');
 const api=url.pathname.startsWith(PREFIX);
 if(!page&&!api&&!legacy)return null;
 if(page&&url.origin==='https://www.manuvikraman.com'&&['GET','HEAD'].includes(request.method))return new Response(null,{status:308,headers:{...headers,location:ORIGIN+PAGE+url.search}});
 if(url.origin!==ORIGIN)return new Response('Not found',{status:404,headers});
 if(legacy)return json({error:'Please reload the Reading page to use the verified diagnostic.'},410);
 const action=api?url.pathname.slice(PREFIX.length):'';
 const route=page?['GET',PAGE,0]:definition(action);
 if(!route)return json({error:'Not found'},404);
 if(request.method!==route[0]&&!(page&&request.method==='HEAD'))return new Response('Method not allowed',{status:405,headers:{...headers,allow:page?'GET, HEAD':route[0]}});
 if(page&&url.pathname!==PAGE)return new Response(null,{status:308,headers:{...headers,location:PAGE}});
 if(request.method==='POST'&&request.headers.get('origin')!==ORIGIN)return json({error:'Please use the TELW website.'},403);
 try{
  if(!env.IELTS_ADMIN_SERVICE?.fetch)throw Error('Service unavailable');
  const upstreamHeaders=new Headers();
  if(api){const cookie=learnerCookie(request);if(cookie)upstreamHeaders.set('cookie',cookie);}
  const ip=request.headers.get('cf-connecting-ip');if(ip)upstreamHeaders.set('cf-connecting-ip',ip);
  let body;
  if(request.method==='POST'){
   const type=request.headers.get('content-type');if(type)upstreamHeaders.set('content-type',type);
   upstreamHeaders.set('origin',SERVICE);
   if(action!=='auth/logout')body=await readBody(request,route[2]);
  }
  const upstream=await env.IELTS_ADMIN_SERVICE.fetch(new Request(new URL(route[1],SERVICE),{method:page?'GET':request.method,headers:upstreamHeaders,body,redirect:'manual',signal:AbortSignal.timeout(20000)}));
  // No service URL or private admin response may be used as a learner redirect.
  if(upstream.status>=300&&upstream.status<400)return json({error:'The Reading service is temporarily unavailable.'},502);
  const out=new Headers(headers);const type=upstream.headers.get('content-type');if(type)out.set('content-type',type);
  const cookies=upstream.headers.getSetCookie?.()||[upstream.headers.get('set-cookie')].filter(Boolean);
  for(const value of cookies)if(value.startsWith(UPSTREAM_COOKIE+'='))out.append('set-cookie',value.replace(UPSTREAM_COOKIE+'=',COOKIE+'='));
  let content=await upstream.text();
  if(page&&upstream.ok){
   if(!content.includes('id="identitySend"')||!content.includes('/api/ielts/reading/start'))throw Error('Unexpected learner page');
   content=content.replaceAll('href="/api/ielts/reading/admin"','href="/ielts/admin/"')
    .replaceAll('/api/ielts/auth/',PREFIX+'auth/').replaceAll('/api/ielts/reading/',PREFIX+'reading/');
  }
  return new Response(request.method==='HEAD'?null:content,{status:upstream.status,headers:out});
 }catch(error){return json({error:error.status?error.message:'The Reading service is temporarily unavailable. Please try again later.'},error.status||503);}
}
