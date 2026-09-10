const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';
const ORACY_C='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-conversation-c';
const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function onRequestPost(context){
  try{
    const body=await context.request.json();
    if(!['realtime-token','conversation-feedback'].includes(body?.action))return json({error:'Unsupported Level C conversation action'},400);
    const unitNo=Number(body.unit_no||0);if(unitNo<31||unitNo>60)return json({error:'Invalid Level C unit'},400);
    const cookies=context.request.headers.get('cookie')||'';
    const learnerToken=readCookie(cookies,'oracy_session');
    const adminToken=readCookie(cookies,'clarion_admin_session');
    if(learnerToken&&await validate(learnerToken,unitNo))body.session_token=learnerToken;
    else if(adminToken&&await validAdmin(adminToken))body.admin_token=adminToken;
    else return json({error:'ORACY access required'},403);
    body.unit_no=unitNo;
    const r=await fetch(ORACY_C,{method:'POST',headers:{'content-type':'application/json','x-oracy-client':'oracy-web-v1'},body:JSON.stringify(body)});
    return proxy(r);
  }catch(e){return json({error:'Level C conversation request failed',detail:String(e?.message||e).slice(0,250)},400)}
}
export async function onRequestGet(){return json({error:'POST required'},405)}
async function validate(token,unitNo){try{const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'validate',session_token:token,unit_no:unitNo})});if(!r.ok)return false;const d=await r.json();return Boolean(d&&d.ok===true)}catch{return false}}
async function validAdmin(token){try{const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});if(!r.ok)return false;const p=await r.json(),x=Array.isArray(p)?p[0]:p;return Boolean(x&&x.ok===true)}catch{return false}}
function readCookie(header,name){const m=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
async function proxy(r){const h=new Headers({'cache-control':'no-store'});const t=r.headers.get('content-type');if(t)h.set('content-type',t);return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
