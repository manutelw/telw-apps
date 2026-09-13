const SHARE_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-share-access';

export async function onRequestPost(context){
  try{
    const payload=await context.request.json().catch(()=>({}));
    const adminToken=readCookie(context.request.headers.get('cookie')||'','clarion_admin_session');
    if(!adminToken){
      return json({ok:false,message:'Administrator session not found. Please sign in again.'},401);
    }
    payload.ascent_session_token=adminToken;
    const r=await fetch(SHARE_ACCESS,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(payload)
    });
    const text=await r.text();
    let data;
    try{data=JSON.parse(text)}catch{data={ok:false,message:text||'Share service returned an invalid response.'}}
    return json(data,r.status);
  }catch(e){
    return json({ok:false,message:'Share service could not be reached.',detail:String(e&&e.message||e).slice(0,240)},502);
  }
}

export async function onRequestGet(){return json({ok:false,message:'Use POST.'},405)}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
