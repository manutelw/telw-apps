const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function validAdmin(token){
  if(!token)return false;
  try{
    const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const p=await r.json();const x=Array.isArray(p)?p[0]:p;
    return Boolean(x&&x.ok===true);
  }catch{return false}
}

export function readAdminCookie(request){
  const h=request.headers.get('cookie')||'';
  const m=h.match(/(?:^|;\s*)clarion_admin_session=([^;]+)/);
  return m?decodeURIComponent(m[1]):'';
}

export function setAdminSessionCookie(token){
  return `clarion_admin_session=${encodeURIComponent(token)}; Path=/; Domain=.clarionprep.com; HttpOnly; Secure; SameSite=Lax`;
}

export function clearAdminSessionCookie(){
  return 'clarion_admin_session=; Path=/; Domain=.clarionprep.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
