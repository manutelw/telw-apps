const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';
const ORACY_VOICE='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-voice';
const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function onRequestPost(context){
  const ct=context.request.headers.get('content-type')||'';
  try{
    if(ct.includes('multipart/form-data')){
      const cookies=context.request.headers.get('cookie')||'';
      const learnerToken=readCookie(cookies,'oracy_session');
      const adminToken=readCookie(cookies,'clarion_admin_session');
      const form=await context.request.formData();
      const unitNo=Number(form.get('unit_no')||1);
      if(learnerToken&&await validate(learnerToken,unitNo)){
        form.set('session_token',learnerToken);
      }else if(adminToken&&await validAdmin(adminToken)){
        form.set('admin_token',adminToken);
      }else{
        return json({error:'ORACY access required'},403);
      }
      form.set('unit_no',String(unitNo));
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1'},body:form});
      return proxy(r);
    }

    const body=await context.request.json();
    if(['tts','realtime-token','conversation-feedback'].includes(body?.action)){
      const cookies=context.request.headers.get('cookie')||'';
      const learnerToken=readCookie(cookies,'oracy_session');
      const adminToken=readCookie(cookies,'clarion_admin_session');
      const unitNo=Number(body.unit_no||1);
      if(learnerToken&&await validate(learnerToken,unitNo)){
        body.session_token=learnerToken;
      }else if(adminToken&&await validAdmin(adminToken)){
        body.admin_token=adminToken;
      }else{
        return json({error:'ORACY access required'},403);
      }
      body.unit_no=unitNo;
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1','content-type':'application/json'},body:JSON.stringify(body)});
      return proxy(r);
    }

    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'login',login_id:String(body.login_id||''),password:String(body.password||'')})});
    const data=await r.json().catch(()=>({ok:false,message:'Login failed.'}));
    if(!r.ok||data.ok!==true||!data.session_token)return json(data,r.status||401);
    const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
    headers.append('set-cookie',cookie('oracy_session',data.session_token,12*60*60));
    return new Response(JSON.stringify({ok:true,learner:data.learner,units:data.units||[],expires_at:data.expires_at}),{status:200,headers});
  }catch(e){return json({ok:false,message:'Request could not be completed.',detail:String(e&&e.message||e).slice(0,300)},400)}
}

export async function onRequestGet(){return json({ok:false,message:'Use the ORACY login form.'},405)}

async function validate(token,unitNo){
  try{
    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'validate',session_token:token,unit_no:unitNo})});
    if(!r.ok)return false;
    const data=await r.json();
    return Boolean(data&&data.ok===true);
  }catch{return false;}
}

async function validAdmin(token){
  try{
    const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch{return false;}
}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

async function proxy(r){
  const headers=new Headers();
  const type=r.headers.get('content-type');if(type)headers.set('content-type',type);
  headers.set('cache-control',r.headers.get('cache-control')||'no-store');
  const x=r.headers.get('x-oracy-audio');if(x)headers.set('x-oracy-audio',x);
  return new Response(r.body,{status:r.status,statusText:r.statusText,headers});
}

function cookie(name,value,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function json(body,status){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
