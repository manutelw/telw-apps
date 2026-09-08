const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';
const ORACY_VOICE='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-voice';

export async function onRequestPost(context){
  const cookie=context.request.headers.get('cookie')||'';
  const token=readCookie(cookie,'oracy_session');
  if(!token)return json({error:'Learner session required'},401);

  const ct=context.request.headers.get('content-type')||'';
  try{
    if(ct.includes('multipart/form-data')){
      const incoming=await context.request.formData();
      const unitNo=Number(incoming.get('unit_no')||1);
      if(!(await validate(token,unitNo)))return json({error:'Unit access required'},403);
      incoming.set('session_token',token);
      incoming.set('unit_no',String(unitNo));
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1'},body:incoming});
      return proxy(r);
    }

    const body=await context.request.json();
    const unitNo=Number(body.unit_no||1);
    if(!(await validate(token,unitNo)))return json({error:'Unit access required'},403);
    body.session_token=token;
    body.unit_no=unitNo;
    const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1','content-type':'application/json'},body:JSON.stringify(body)});
    return proxy(r);
  }catch(e){
    return json({error:'Voice request failed',detail:String(e&&e.message||e).slice(0,300)},500);
  }
}

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
  const type=r.headers.get('content-type');
  if(type)headers.set('content-type',type);
  const cache=r.headers.get('cache-control');
  headers.set('cache-control',cache||'no-store');
  const x=r.headers.get('x-oracy-audio');if(x)headers.set('x-oracy-audio',x);
  return new Response(r.body,{status:r.status,statusText:r.statusText,headers});
}

function json(body,status){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
