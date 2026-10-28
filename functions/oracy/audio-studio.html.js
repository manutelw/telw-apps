// Dedicated access gate for TELW Audio Studio; frozen ORACY middleware remains untouched.
const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
export async function onRequestGet(context){
  const cookie=context.request.headers.get('cookie')||'';
  const match=cookie.match(/(?:^|;\s*)clarion_admin_session=([^;]+)/);
  if(!match)return Response.redirect(new URL('/ascent/admin-login.html',context.request.url),302);
  let token='';
  try{token=decodeURIComponent(match[1]);}catch{return new Response('Invalid administrator session',{status:403});}
  try{
    const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)throw Error('Access check failed');
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    if(result?.ok!==true)return Response.redirect(new URL('/ascent/admin-login.html',context.request.url),302);
    const response=await context.next();
    const headers=new Headers(response.headers);
    headers.set('Cache-Control','private, no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }catch{return new Response('Administrator access could not be verified.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
