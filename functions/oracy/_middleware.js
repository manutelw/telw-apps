const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';

export async function onRequest(context){
  const url=new URL(context.request.url);
  const path=url.pathname;

  // Public learner entry and session endpoints.
  if(path==='/oracy/'||path==='/oracy/index.html'||path==='/oracy/session'||path==='/oracy/logout'||path==='/oracy/oracy.css'){
    return noStore(await context.next());
  }

  // Administrator page: only an already authenticated ASCENT administrator may enter.
  if(path==='/oracy/admin.html'){
    const adminToken=readCookie(context.request.headers.get('cookie')||'','clarion_admin_session');
    if(!adminToken||!(await validAdmin(adminToken))){
      return redirect('/ascent/admin-login.html');
    }
    return noStore(await context.next());
  }

  // Protect every unit page and its unit-specific JS/assets. A URL alone is never enough.
  const match=path.match(/^\/oracy\/unit-(\d+)(?:\.[a-z0-9]+)?$/i);
  if(match){
    const unitNo=Number(match[1]);
    const learnerToken=readCookie(context.request.headers.get('cookie')||'','oracy_session');
    if(!learnerToken||!(await validLearnerUnit(learnerToken,unitNo))){
      return redirect('/oracy/?locked=1');
    }
    return noStore(await context.next());
  }

  return noStore(await context.next());
}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

async function validAdmin(token){
  try{
    const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch(_){return false;}
}

async function validLearnerUnit(token,unitNo){
  try{
    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'validate',session_token:token,unit_no:unitNo})});
    if(!r.ok)return false;
    const data=await r.json();
    return data&&data.ok===true;
  }catch(_){return false;}
}

function redirect(location){return new Response(null,{status:302,headers:{location,'cache-control':'no-store'}})}
function noStore(response){
  const headers=new Headers(response.headers);headers.set('cache-control','no-store, max-age=0');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
