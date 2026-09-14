const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const REPORT=SUPABASE_URL+'/rest/v1/rpc/ascent_trainer_report_data';
const WORKBOOK=SUPABASE_URL+'/rest/v1/rpc/ascent_trainer_workbook_export';
const ALLOWED=new Set(['manutelw@gmail.com','sandeep.kumar@fiib.edu.in']);

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
function readCookie(request){const h=request.headers.get('cookie')||'';const m=h.match(/(?:^|;\s*)clarion_normal_trainer=([^;]+)/);return m?decodeURIComponent(m[1]):'';}
function clean(v){return String(v??'').trim();}
function first(p){return Array.isArray(p)?p[0]:p;}
async function rpc(url,body){
  const r=await fetch(url,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw new Error('Trainer data service is unavailable.');
  return data;
}
async function identity(token){
  const x=first(await rpc(VALIDATE,{p_session_token:token}))||{};
  const email=clean(x.email).toLowerCase();
  const role=clean(x.role||'TRAINER').toUpperCase();
  if(x.ok!==true||!ALLOWED.has(email)||!['TRAINER','ADMIN'].includes(role))return null;
  return {fullName:clean(x.fullName||x.full_name||x.name),email,role,trainerUuid:clean(x.trainerUuid||x.trainer_uuid)};
}
export async function onRequestGet({request}){
  try{
    const token=readCookie(request);
    if(!token)return json({error:'Trainer sign-in required.'},401);
    const trainer=await identity(token);
    if(!trainer)return json({error:'Trainer session is invalid or not authorised.'},403);
    const [report,workbook]=await Promise.all([
      rpc(REPORT,{p_session_token:token,p_batch:null,p_student_uuid:null,p_task_uuid:null,p_access_point_uuid:null}),
      rpc(WORKBOOK,{p_session_token:token})
    ]);
    if(report&&report.ok===false)return json({error:report.message||'Trainer report could not be loaded.'},403);
    if(workbook&&workbook.ok===false)return json({error:workbook.message||'Trainer workbook data could not be loaded.'},403);
    return json({ok:true,trainer,report:report||{},workbook:workbook||{}});
  }catch(err){return json({error:err?.message||'Trainer data could not be loaded.'},500);}
}
