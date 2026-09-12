const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const LIVE_HANDOFF=SUPABASE_URL+'/functions/v1/live-mock-admin-handoff';

export async function onRequestPost(context){
  let token='';
  try{const form=await context.request.formData();token=String(form.get('ascent_session_token')||'').trim();}catch(_){ }
  if(!token||!(await valid(token)))return new Response('Administrator access required.',{status:403,headers:{'cache-control':'no-store'}});
  let live;
  try{
    const r=await fetch(LIVE_HANDOFF,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json',origin:new URL(context.request.url).origin},body:JSON.stringify({ascent_session_token:token})});
    live=await r.json().catch(()=>null);
    if(!r.ok||!live||live.ok!==true||!live.session_token)throw new Error('LIVE_MOCK_HANDOFF_FAILED');
  }catch(_){return new Response('Live Mock administrator session could not be created.',{status:502,headers:{'cache-control':'no-store'}})}
  const session={sessionToken:live.session_token,user:live.user,expiresAt:live.expires_at};
  const safe=JSON.stringify(session).replace(/</g,'\\u003c');
  const fixed='<!doctype html><meta charset="utf-8"><title>Opening Live Mock</title><script>localStorage.setItem("live_mock_student_session",JSON.stringify('+safe+'));location.replace("/live-mock/interview.html");</script><p>Opening Live Mock…</p>';
  const headers=new Headers({'content-type':'text/html; charset=UTF-8','cache-control':'no-store'});
  headers.append('set-cookie','clarion_admin_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Lax');
  return new Response(fixed,{status:200,headers});
}
async function valid(token){
  try{const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});if(!r.ok)return false;const p=await r.json();const x=Array.isArray(p)?p[0]:p;return Boolean(x&&x.ok===true);}catch(_){return false;}
}
