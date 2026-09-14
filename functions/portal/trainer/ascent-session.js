const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const LOGIN=SUPABASE_URL+'/rest/v1/rpc/ascent_trainer_login';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const ALLOWED=new Set(['manutelw@gmail.com','sandeep.kumar@fiib.edu.in']);

function json(body,status=200,extraHeaders={}){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extraHeaders}});
}
function cookie(token){
  return `clarion_normal_trainer=${encodeURIComponent(token)}; Path=/portal/trainer; Domain=.clarionprep.com; HttpOnly; Secure; SameSite=Lax`;
}
function clean(v){return String(v??'').trim();}
function normalizedEmail(v){
  const raw=clean(v).toLowerCase();
  if(raw==='manu')return 'manutelw@gmail.com';
  if(raw==='sandeep')return 'sandeep.kumar@fiib.edu.in';
  return raw;
}
async function rpc(url,body){
  const r=await fetch(url,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw new Error('Trainer authentication service is unavailable.');
  return data;
}
function first(payload){return Array.isArray(payload)?payload[0]:payload;}
function identityFrom(payload,fallbackEmail=''){
  const x=first(payload)||{};
  return {
    ok:Boolean(x.ok===true || x.session_token || x.sessionToken),
    sessionToken:clean(x.sessionToken||x.session_token),
    trainerUuid:clean(x.trainerUuid||x.trainer_uuid),
    fullName:clean(x.fullName||x.full_name||x.name),
    email:normalizedEmail(x.email||fallbackEmail),
    role:clean(x.role||'TRAINER').toUpperCase(),
    expiresAt:clean(x.expiresAt||x.expires_at)
  };
}
async function validateExisting(token){
  if(!token)return null;
  const payload=await rpc(VALIDATE,{p_session_token:token});
  const x=identityFrom(payload);
  if(!x.ok)return null;
  x.sessionToken=token;
  return x;
}

export async function onRequestPost({request}){
  try{
    const body=await request.json().catch(()=>({}));
    let identity=null;
    const existing=clean(body.sessionToken||body.session_token);
    if(existing){
      identity=await validateExisting(existing);
    }else{
      const email=normalizedEmail(body.username||body.email);
      const password=clean(body.password);
      if(!email||!password)return json({error:'Enter your trainer email/username and password.'},400);
      const payload=await rpc(LOGIN,{p_email:email,p_password:password});
      identity=identityFrom(payload,email);
      if(!identity.sessionToken||identity.ok!==true)return json({error:'Incorrect trainer email/username or password.'},401);
    }
    if(!identity||!identity.sessionToken)return json({error:'Trainer session is invalid or expired.'},401);
    if(!ALLOWED.has(normalizedEmail(identity.email)))return json({error:'This trainer portal is currently enabled only for Manu Vikraman and Sandeep Kumar.'},403);
    if(!['TRAINER','ADMIN'].includes(identity.role))return json({error:'Trainer or administrator access required.'},403);
    return json({ok:true,trainer:{fullName:identity.fullName,email:identity.email,role:identity.role,expiresAt:identity.expiresAt},session:{sessionToken:identity.sessionToken,trainerUuid:identity.trainerUuid,fullName:identity.fullName,email:identity.email,role:identity.role,expiresAt:identity.expiresAt}},200,{'set-cookie':cookie(identity.sessionToken)});
  }catch(err){
    return json({error:err?.message||'Trainer sign-in could not be completed.'},500);
  }
}

export async function onRequestGet(){return json({error:'Method not allowed.'},405);}
