const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const PAID_API='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-commerce';
const PAID_COOKIE='clarion_paid_live_mock';

export async function onRequest(context) {
  const url=new URL(context.request.url);
  if(url.pathname.endsWith('/live-mock/admin-handoff')) return context.next();
  const cookieHeader=context.request.headers.get('cookie')||'';
  const adminToken=readCookie(cookieHeader,'clarion_admin_session');
  let paidToken=url.searchParams.get('clarion_token')||'',paidDevice=url.searchParams.get('clarion_device')||'';
  if(!paidToken||!paidDevice){const saved=readCookie(cookieHeader,PAID_COOKIE);if(saved){const parts=saved.split('.');paidToken=parts[0]||'';paidDevice=parts[1]||'';}}
  const paidOk=paidToken&&paidDevice?await validPaid(paidToken,paidDevice):false;
  const adminOk=adminToken?await validAdmin(adminToken):false;
  if(!paidOk&&!adminOk){return new Response(null,{status:302,headers:{location:'/subscribe/?product=LIVE_MOCK','cache-control':'no-store'}})}
  const response=await context.next();
  if(!response.ok)return response;
  const headers=new Headers(response.headers);
  if(paidOk&&url.searchParams.get('clarion_token'))headers.append('set-cookie',`${PAID_COOKIE}=${encodeURIComponent(paidToken+'.'+paidDevice)}; Path=/live-mock/; Secure; SameSite=Lax; Max-Age=2592000`);
  headers.set('cache-control','no-store, max-age=0');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function readCookie(header,name){const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return match?decodeURIComponent(match[1]):'';}
async function validPaid(token,device){try{const r=await fetch(PAID_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'CHECK',product_code:'LIVE_MOCK',entitlement_token:token,device_id:device})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}catch(_){return false}}
async function validAdmin(token){try{const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});if(!r.ok)return false;const payload=await r.json();const result=Array.isArray(payload)?payload[0]:payload;return Boolean(result&&result.ok===true)}catch(_){return false}}
