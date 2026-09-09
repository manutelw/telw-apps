const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function onRequest(context){
  const url=new URL(context.request.url);
  if(url.pathname.endsWith('/pi-lab/admin-handoff'))return context.next();

  const token=readCookie(context.request.headers.get('cookie')||'','clarion_admin_session');
  if(!token||!(await validAdmin(token))){
    return new Response('Not found.',{status:404,headers:{'content-type':'text/plain; charset=UTF-8','cache-control':'no-store, max-age=0','x-robots-tag':'noindex, nofollow, noarchive'}});
  }

  const response=await context.next();
  if(!response.ok)return response;
  let body=response.body;
  const headers=new Headers(response.headers);
  if(url.pathname.endsWith('/pi-lab/admin-builder.html')){
    let html=await response.text();
    if(!html.includes('pi-lab/roster-upload.js'))html=html.replace('</body>','<script src="./roster-upload.js?v=20260907-roster2"></script>\n</body>');
    body=html;
    headers.set('content-type','text/html; charset=UTF-8');
  }
  headers.set('cache-control','no-store, max-age=0');
  headers.set('x-robots-tag','noindex, nofollow, noarchive');
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

async function validAdmin(token){
  try{
    const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch(_){return false;}
}
