import {validAdmin,readAdminCookie,setAdminSessionCookie,clearAdminSessionCookie} from './admin-browser-session.js';

const ORACY_PROJECT='https://zmopmjosykiwctrvhsmo.supabase.co';
const ASCENT_PROJECT='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const PUBLIC_AUTH=ORACY_PROJECT+'/functions/v1/clarion-public-auth';
const PUBLIC_COMMERCE=ORACY_PROJECT+'/functions/v1/clarion-public-commerce';
const DIALOGUE_ACCESS=ASCENT_PROJECT+'/functions/v1/ascent-dialogue-lab';
const GD_ACCESS=ASCENT_PROJECT+'/functions/v1/telw-gd-access';
const TARGETS={
  'public-practice':ORACY_PROJECT+'/functions/v1/clarion-public-practice',
  'public-wct':ORACY_PROJECT+'/functions/v1/clarion-public-wct',
  'public-live-mock':ORACY_PROJECT+'/functions/v1/clarion-public-live-mock'
};
const PRODUCT_PATHS={
  WCT:'/public-wct/',LIVE_MOCK:'/public-live-mock/',DIALOGUE_LAB:'/dialogue-lab/',PI_LAB:'/pi-lab/',GD_LAB:'/gd-lab/',PLACEMENT_PASS:'/pass/'
};
const LAUNCH={
  WCT:'/public-wct/',PI_PRACTICE:'/public-practice/?mode=pi',GD_PRACTICE:'/public-practice/?mode=gd',PCL:'/public-practice/?mode=pcl',LIVE_MOCK:'/public-live-mock/',DIALOGUE_LAB:'/dialogue-lab/',PI_LAB:'/pi-lab/',GD_LAB:'/gd-lab/',PLACEMENT_PASS:'/pass/'
};

export async function handleAdminGateway(request){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/admin/session-start'){
    if(request.method!=='POST')return json({ok:false},405);
    try{const body=await request.json();const token=String(body?.session_token||'').trim();if(!await validAdmin(token))return json({ok:false,message:'Administrator session is not valid.'},403);const h=new Headers({'content-type':'application/json','cache-control':'no-store'});h.append('set-cookie',setAdminSessionCookie(token));return new Response(JSON.stringify({ok:true}),{status:200,headers:h})}catch{return json({ok:false,message:'Administrator session could not be started.'},400)}
  }
  if(path==='/admin/session-status'){const token=readAdminCookie(request);return json({ok:Boolean(token&&await validAdmin(token))})}
  if(path==='/admin/session-end'){const h=new Headers({'content-type':'application/json','cache-control':'no-store'});h.append('set-cookie',clearAdminSessionCookie());return new Response(JSON.stringify({ok:true}),{status:200,headers:h})}
  if(path==='/access/public-session'&&request.method==='POST')return startPublicSession(request);
  if(path==='/access/public-entitlement'&&request.method==='POST')return startPublicEntitlement(request);
  if(path==='/access/institutional-start'&&request.method==='POST')return startInstitutionalAccess(request);
  if((path==='/oracy/admin-handoff'||path==='/presentation-skills/admin-handoff')&&request.method==='POST'){
    let token='';try{const form=await request.formData();token=String(form.get('ascent_session_token')||'').trim()}catch{}
    if(!token||!(await validAdmin(token)))return new Response('Administrator access required.',{status:403,headers:{'cache-control':'no-store'}});
    const h=new Headers({location:path.startsWith('/oracy')?'/oracy/':'/presentation-skills/admin.html','cache-control':'no-store'});h.append('set-cookie',setAdminSessionCookie(token));return new Response(null,{status:303,headers:h});
  }
  if(path.startsWith('/__admin/')){
    if(request.method!=='POST')return json({ok:false},405);const target=TARGETS[path.slice('/__admin/'.length)];if(!target)return json({ok:false},404);const token=readAdminCookie(request);if(!token||!(await validAdmin(token)))return json({ok:false,message:'Administrator session required.'},403);let body={};try{body=await request.json()}catch{}body.admin_token=token;const r=await fetch(target,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:{'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store'}})
  }
  const product=productFor(url);
  if(product){
    if(isAdminOnlyPath(path)){
      const a=readAdminCookie(request);if(a&&await validAdmin(a))return null;
      return new Response('Not found.',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'}});
    }
    const admin=readAdminCookie(request);if(admin&&await validAdmin(admin))return null;
    if(await validProductCookie(request,product))return null;
    if(await validInstitutionalCookie(request,product))return null;
    if(request.method==='GET')return lockedBootstrap(url,product);
    return json({ok:false,message:'Authorised access required.'},403);
  }
  return null;
}

async function startPublicSession(request){
  try{const b=await request.json(),token=String(b.session_token||''),device=String(b.device_id||'');const r=await fetch(PUBLIC_AUTH,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'SESSION',session_token:token,device_id:device})});const d=await r.json().catch(()=>({}));if(!r.ok||d.ok!==true)return json({ok:false,message:'Please log in again.'},401);const h=new Headers({'content-type':'application/json','cache-control':'no-store'});h.append('set-cookie',cookie('clarion_public_session',token,30*86400,'/'));h.append('set-cookie',cookie('clarion_public_device',device,30*86400,'/'));return new Response(JSON.stringify({ok:true,user:d.user}),{status:200,headers:h})}catch{return json({ok:false,message:'Login session could not be secured.'},400)}
}
async function startPublicEntitlement(request){
  try{const b=await request.json(),product=String(b.product_code||'').toUpperCase(),token=String(b.entitlement_token||''),device=String(b.device_id||'');if(!LAUNCH[product])return json({ok:false,message:'Unknown product.'},400);if(!await validPublicAccountCookie(request))return json({ok:false,message:'Please register or log in first.'},401);const ok=await commerceCheck(product,token,device);if(!ok)return json({ok:false,message:'This product access is not valid on this device.'},403);const h=new Headers({'content-type':'application/json','cache-control':'no-store'});h.append('set-cookie',cookie('clarion_ent_'+product,token,30*86400,'/'));return new Response(JSON.stringify({ok:true,launch_url:LAUNCH[product]}),{status:200,headers:h})}catch{return json({ok:false,message:'Product access could not be secured.'},400)}
}
async function startInstitutionalAccess(request){
  try{const b=await request.json(),product=String(b.product_code||'').toUpperCase(),token=String(b.session_token||'');if(!['DIALOGUE_LAB','GD_LAB','PI_LAB'].includes(product)||!token)return json({ok:false},403);const ok=await validateInstitutional(product,token);if(!ok)return json({ok:false,message:'Institutional access is not active.'},403);const h=new Headers({'content-type':'application/json','cache-control':'no-store'});h.append('set-cookie',cookie('clarion_internal_'+product,token,12*3600,'/'));return new Response(JSON.stringify({ok:true}),{status:200,headers:h})}catch{return json({ok:false,message:'Institutional access could not be checked.'},400)}
}
async function validPublicAccountCookie(request){const token=readCookie(request,'clarion_public_session'),device=readCookie(request,'clarion_public_device');if(!token||!device)return false;try{const r=await fetch(PUBLIC_AUTH,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'SESSION',session_token:token,device_id:device})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}catch{return false}}
async function validProductCookie(request,product){const token=readCookie(request,'clarion_ent_'+product),device=readCookie(request,'clarion_public_device');return Boolean(token&&device&&await commerceCheck(product,token,device))}
async function commerceCheck(product,token,device){try{const r=await fetch(PUBLIC_COMMERCE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'CHECK',product_code:product,entitlement_token:token,device_id:device})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}catch{return false}}
async function validInstitutionalCookie(request,product){if(!['DIALOGUE_LAB','GD_LAB','PI_LAB'].includes(product))return false;const token=readCookie(request,'clarion_internal_'+product);return Boolean(token&&await validateInstitutional(product,token))}
async function validateInstitutional(product,token){try{if(product==='GD_LAB'){const r=await fetch(GD_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session_token:token})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}const r=await fetch(DIALOGUE_ACCESS,{method:'POST',headers:{'content-type':'application/json',apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY},body:JSON.stringify({action:'PROFILE',session_token:token})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}catch{return false}}
function productFor(url){const p=url.pathname;if(p.startsWith('/public-wct/'))return'WCT';if(p.startsWith('/public-live-mock/'))return'LIVE_MOCK';if(p.startsWith('/dialogue-lab/'))return'DIALOGUE_LAB';if(p.startsWith('/pi-lab/'))return'PI_LAB';if(p.startsWith('/gd-lab/'))return'GD_LAB';if(p.startsWith('/pass/'))return'PLACEMENT_PASS';if(p.startsWith('/public-practice/')){const m=(url.searchParams.get('mode')||'pi').toLowerCase();return m==='gd'?'GD_PRACTICE':m==='pcl'?'PCL':'PI_PRACTICE'}return''}
function isAdminOnlyPath(path){return /\/(admin|admin-builder)(?:[/.]|$)/i.test(path)}
function lockedBootstrap(url,product){const returnTo=url.pathname+url.search;const supportsInstitution=['DIALOGUE_LAB','GD_LAB','PI_LAB'].includes(product);const html=`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Checking access…</title><style>body{font-family:Arial,sans-serif;background:#f6f8fa;color:#17395d;display:grid;place-items:center;min-height:100vh;margin:0}.box{background:#fff;border:1px solid #dce5ec;border-radius:16px;padding:24px;max-width:440px;box-shadow:0 12px 34px rgba(23,57,93,.08)}p{color:#66798b}</style><div class="box"><strong>ClarionPrep</strong><p id="s">Checking your authorised access…</p></div><script>(async()=>{const P=${JSON.stringify(product)},RET=${JSON.stringify(returnTo)},inst=${supportsInstitution?'true':'false'};const q=new URLSearchParams(location.search),t=q.get('clarion_token')||localStorage.getItem('clarion_entitlement_'+P)||'',d=q.get('clarion_device')||localStorage.getItem('clarion_device_v1')||'';if(t&&d){try{localStorage.setItem('clarion_entitlement_'+P,t);localStorage.setItem('clarion_device_v1',d);const r=await fetch('/access/public-entitlement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({product_code:P,entitlement_token:t,device_id:d})});if(r.ok){history.replaceState(null,'',location.pathname+(P==='PI_PRACTICE'?'?mode=pi':P==='GD_PRACTICE'?'?mode=gd':P==='PCL'?'?mode=pcl':''));location.reload();return}}catch(e){}}if(inst){try{const s=JSON.parse(localStorage.getItem('ascent_student_session')||'null');if(s&&s.sessionToken){const r=await fetch('/access/institutional-start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({product_code:P,session_token:s.sessionToken})});if(r.ok){location.reload();return}}}catch(e){}}location.replace('/account/?product='+encodeURIComponent(P)+'&next='+encodeURIComponent(RET))})()</script>`;return new Response(html,{status:401,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','x-robots-tag':'noindex, nofollow, noarchive'}})}

export async function bridgeAdminHtml(request,response){
  const type=response.headers.get('content-type')||'';if(!response.ok||!type.includes('text/html'))return response;const token=readAdminCookie(request);const ok=Boolean(token&&await validAdmin(token));let html=await response.text();if(ok){for(const [slug,target] of Object.entries(TARGETS))html=html.replaceAll(target,'/__admin/'+slug)}
  const script=`<script id="clarionAdminBrowserBridge">(function(){var active=${ok?'true':'false'};function clearOld(){try{localStorage.removeItem('ascent_admin_master_session');var x=JSON.parse(localStorage.getItem('ascent_trainer_session')||'null');if(x&&String(x.role||'').toUpperCase()==='ADMIN')localStorage.removeItem('ascent_trainer_session');['PI_PRACTICE','GD_PRACTICE','PCL','WCT','LIVE_MOCK'].forEach(function(p){if(localStorage.getItem('clarion_entitlement_'+p)==='ADMIN')localStorage.removeItem('clarion_entitlement_'+p)});if(localStorage.getItem('clarion_device_v1')==='ADMIN')localStorage.removeItem('clarion_device_v1')}catch(e){}}function adminToken(){try{var a=JSON.parse(localStorage.getItem('ascent_admin_master_session')||'null');return a&&a.sessionToken?String(a.sessionToken):''}catch(e){return''}}function post(url){var t=adminToken();if(!t)return;var f=document.createElement('form');f.method='POST';f.action=url;var i=document.createElement('input');i.type='hidden';i.name='ascent_session_token';i.value=t;f.appendChild(i);document.body.appendChild(f);f.submit()}function launch(p){if(p==='CAT_SIMULATOR'){location.href='https://cat.clarionprep.com/';return}if(p==='WCT'){location.href='/public-wct/?admin=1';return}if(p==='PI_PRACTICE'){location.href='/public-practice/?mode=pi&admin=1';return}if(p==='GD_PRACTICE'){location.href='/public-practice/?mode=gd&admin=1';return}if(p==='DIALOGUE_LAB'){location.href='/dialogue-lab/';return}if(p==='PCL'){location.href='/ascent/professional-communication-module-1.html';return}if(p==='PRESENTATION'){location.href='/presentation-skills/admin.html';return}if(p==='LIVE_MOCK'){post('/live-mock/admin-handoff');return}if(p==='PI_LAB'){post('/pi-lab/admin-handoff');return}if(p==='GD_LAB'){location.href='/gd-lab/';return}if(p==='PLACEMENT_PASS'){location.href='/ascent/admin-settings.html';return}}if(active){try{localStorage.setItem('clarion_device_v1','ADMIN');['PI_PRACTICE','GD_PRACTICE','PCL','WCT','LIVE_MOCK'].forEach(function(p){localStorage.setItem('clarion_entitlement_'+p,'ADMIN')})}catch(e){}document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var u;try{u=new URL(a.href,location.origin)}catch(_){return}if(u.pathname==='/ascent-play/register.html'){e.preventDefault();location.href='/ascent-play/';return}if(u.pathname==='/account/'||u.pathname==='/subscribe/'){var p=(u.searchParams.get('product')||'').toUpperCase();if(p){e.preventDefault();launch(p)}}},true);var q=new URLSearchParams(location.search),p=(q.get('product')||'').toUpperCase();if((location.pathname==='/account/'||location.pathname==='/subscribe/')&&p)setTimeout(function(){launch(p)},0)}else{clearOld()}if(location.pathname.indexOf('/ascent/admin-login')>=0){var original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){original.call(this,k,v);if(k==='ascent_admin_master_session'){try{var s=JSON.parse(v||'null');if(s&&s.sessionToken&&String(s.role||'').toUpperCase()==='ADMIN'){var b=new Blob([JSON.stringify({session_token:s.sessionToken})],{type:'application/json'});navigator.sendBeacon('/admin/session-start',b)}}catch(e){}}};}})();</script>`;
  html=html.replace(/<head([^>]*)>/i,'<head$1>'+script);const h=new Headers(response.headers);h.set('content-type','text/html; charset=UTF-8');h.set('cache-control','no-store, max-age=0');return new Response(html,{status:response.status,statusText:response.statusText,headers:h});
}
function readCookie(request,name){const h=request.headers.get('cookie')||'';const m=h.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
function cookie(name,value,maxAge,path){return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
