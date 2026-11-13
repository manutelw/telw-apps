import {withReadingFeedback} from './reading-feedback.mjs';
import {TRAINER_EMAIL,PaymentNeeded,paymentsRequired,claimCredit,releaseCredit,attachCredit,creditFor,normalEmail} from './credits.mjs';
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
// A new Reading attempt uses one paid credit once charging is on. Resuming an attempt that is
// already paid for (an active hour-long attempt) does not need another credit.
// When a Reading test has not been paid for, the page shows a friendly note with one link to book.
const PAY_NOTE=`<style>.paynote{margin:0 0 1.4rem;padding:1.1rem 1.3rem;background:linear-gradient(135deg,#eef7fa,#fdf6e7);border:1px solid #cfe3ea;border-radius:12px;font-family:Arial,sans-serif}.paynote h3{margin:0 0 .3rem;font-size:1.2rem;color:#17374a}.paynote p{margin:0 0 .8rem;color:#33505f}.paybook{display:inline-block;padding:.65rem 1.2rem;background:#d9aa43;color:#172a42;font-weight:bold;border-radius:6px;text-decoration:none}</style><script>(()=>{const f=window.fetch;window.fetch=async(...a)=>{const r=await f(...a);try{if(r.status===402&&String(a[0]&&a[0].url||a[0]).includes('reading/start'))setTimeout(show,60);}catch{}return r;};function show(){if(document.getElementById('payNeeded'))return;const box=document.createElement('div');box.id='payNeeded';box.className='paynote';box.setAttribute('role','status');box.innerHTML='<h3>You&rsquo;re one step away from your Reading diagnostic</h3><p>Use your email when you book, then come back here to begin.</p><a class="paybook" href="/ielts/pay/?test=reading">See prices and book</a>';const said=[...document.querySelectorAll('p,div,span')].find(e=>!e.children.length&&e.textContent.includes('one step away from your Reading'));if(said){said.textContent='';said.replaceWith(box);}else(document.querySelector('main')||document.body).prepend(box);box.scrollIntoView({behavior:'smooth',block:'center'});}})();</script>`;
// The Reading page comes from the Reading Worker, which still says "free" and "enrolment opening later".
// The diagnostic is paid, and training is offered now, so that wording is corrected here.
const TRAINING_BLOCK='<hr style="border:0;border-top:1px solid #e3e9ee;margin:25px 0"><span class="pill">Training</span><h2 style="margin-top:15px">Work on your Reading with TELW</h2><p class="muted">After the diagnostic, send TELW your result to talk about training that targets your weak areas.</p><p><a class="secondary" style="display:inline-block;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold" href="https://wa.me/919717116831" rel="noopener">Message TELW on WhatsApp</a></p>';
export function paidWording(html){
 return html.replace('<span class="pill">Free initial diagnostic</span>','<span class="pill">Reading diagnostic</span>')
  .replace('>Start free diagnostic<','>Start the diagnostic<')
  .replace(/<hr style="border:0;border-top:1px solid #e3e9ee;margin:25px 0"><span class="pill">Improvement programme<\/span>[\s\S]*?Enrolment opening later<\/button>/,TRAINING_BLOCK);
}
export function withPayNote(html){html=paidWording(html);return html.includes('</body>')?html.replace('</body>',PAY_NOTE+'</body>'):html+PAY_NOTE;}
async function readingGate(env,upstreamHeaders){
 if(!env.PAY_DB||!(await paymentsRequired(env,'reading')))return null;
 const session=await env.IELTS_ADMIN_SERVICE.fetch(new Request(new URL('/api/ielts/auth/session',SERVICE),{method:'GET',headers:upstreamHeaders.has('cookie')?{cookie:upstreamHeaders.get('cookie')}:{},redirect:'manual',signal:AbortSignal.timeout(20000)}));
 if(!session.ok)return null;
 const email=normalEmail((await session.json().catch(()=>({}))).email);
 if(!email||email===TRAINER_EMAIL)return null;
 const now=Math.floor(Date.now()/1000);
 const active=await env.PAY_DB.prepare(`SELECT id FROM ielts_pay_credits WHERE email=?1 AND skill='reading' AND used_at>?2 AND used_ref NOT LIKE 'pending:%'`).bind(email,now-3600).first();
 if(active)return null;
 const ref='pending:'+crypto.randomUUID(),claim=await claimCredit(env,email,'reading',ref,now);
 if(!claim)throw new PaymentNeeded('reading',email);
 return {claim,ref};
}
async function settleReading(env,gate,ok,content){
 if(!gate?.claim?.id)return;
 let attemptId='';if(ok){try{attemptId=String(JSON.parse(content).attemptId||'');}catch{}}
 if(!attemptId||await creditFor(env,'reading:'+attemptId))return releaseCredit(env,gate.claim,gate.ref);
 await attachCredit(env,gate.claim,gate.ref,'reading:'+attemptId);
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
  const gate=action==='reading/start'?await readingGate(env,upstreamHeaders):null;
  let upstream;
  try{upstream=await env.IELTS_ADMIN_SERVICE.fetch(new Request(new URL(route[1],SERVICE),{method:page?'GET':request.method,headers:upstreamHeaders,body,redirect:'manual',signal:AbortSignal.timeout(20000)}));}
  catch(error){if(gate)await releaseCredit(env,gate.claim,gate.ref);throw error;}
  // No service URL or private admin response may be used as a learner redirect.
  if(upstream.status>=300&&upstream.status<400){if(gate)await releaseCredit(env,gate.claim,gate.ref);return json({error:'The Reading service is temporarily unavailable.'},502);}
  const out=new Headers(headers);const type=upstream.headers.get('content-type');if(type)out.set('content-type',type);
  const cookies=upstream.headers.getSetCookie?.()||[upstream.headers.get('set-cookie')].filter(Boolean);
  for(const value of cookies)if(value.startsWith(UPSTREAM_COOKIE+'='))out.append('set-cookie',value.replace(UPSTREAM_COOKIE+'=',COOKIE+'='));
  let content=await upstream.text();
  if(gate)await settleReading(env,gate,upstream.ok,content);
  if(page&&upstream.ok){
   if(!content.includes('id="identitySend"')||!content.includes('/api/ielts/reading/start'))throw Error('Unexpected learner page');
   content=withReadingFeedback(content);
   content=withPayNote(content);
   content=content.replaceAll('href="/api/ielts/reading/admin"','href="/ielts/admin/"')
    .replaceAll('/api/ielts/auth/',PREFIX+'auth/').replaceAll('/api/ielts/reading/',PREFIX+'reading/');
  }
  return new Response(request.method==='HEAD'?null:content,{status:upstream.status,headers:out});
 }catch(error){return json({error:error.status?error.message:'The Reading service is temporarily unavailable. Please try again later.'},error.status||503);}
}

