const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';

export async function onRequestPost(context){
  try{
    const body=await context.request.json();
    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'login',login_id:String(body.login_id||''),password:String(body.password||'')})});
    const data=await r.json().catch(()=>({ok:false,message:'Login failed.'}));
    if(!r.ok||data.ok!==true||!data.session_token){
      return json(data,r.status||401);
    }
    const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
    headers.append('set-cookie',cookie('oracy_session',data.session_token,12*60*60));
    return new Response(JSON.stringify({ok:true,learner:data.learner,units:data.units||[],expires_at:data.expires_at}),{status:200,headers});
  }catch(_){return json({ok:false,message:'Login could not be completed.'},400)}
}

export async function onRequestGet(){return json({ok:false,message:'Use the ORACY login form.'},405)}

function cookie(name,value,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function json(body,status){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
