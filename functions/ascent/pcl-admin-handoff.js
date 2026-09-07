const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function onRequestPost(context){
  let token='';
  try{const form=await context.request.formData();token=String(form.get('ascent_session_token')||'').trim();}catch(_){ }
  if(!token||!(await valid(token)))return new Response('Administrator access required.',{status:403,headers:{'cache-control':'no-store'}});
  const headers=new Headers({location:'/ascent/pcl.html','cache-control':'no-store'});
  headers.append('set-cookie','pcl_admin_session='+encodeURIComponent(token)+'; Path=/ascent/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600');
  return new Response(null,{status:303,headers});
}
async function valid(token){
  try{const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});if(!r.ok)return false;const p=await r.json();const x=Array.isArray(p)?p[0]:p;return Boolean(x&&x.ok===true);}catch(_){return false;}
}
