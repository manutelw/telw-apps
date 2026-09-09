const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';
const ORACY_VOICE='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-voice';

export async function onRequestPost(context){
  const ct=context.request.headers.get('content-type')||'';
  try{
    if(ct.includes('multipart/form-data')){
      const token=readCookie(context.request.headers.get('cookie')||'','oracy_session');
      if(!token)return json({error:'Learner session required'},401);
      const form=await context.request.formData();
      const unitNo=Number(form.get('unit_no')||1);
      if(!(await validate(token,unitNo)))return json({error:'Unit access required'},403);
      form.set('session_token',token);
      form.set('unit_no',String(unitNo));
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1'},body:form});
      return proxy(r);
    }

    const body=await context.request.json();
    if(['tts','realtime-token','conversation-feedback'].includes(body?.action)){
      const token=readCookie(context.request.headers.get('cookie')||'','oracy_session');
      if(!token)return json({error:'Learner session required'},401);
      const unitNo=Number(body.unit_no||1);
      if(!(await validate(token,unitNo)))return json({error:'Unit access required'},403);
      body.session_token=token;
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
