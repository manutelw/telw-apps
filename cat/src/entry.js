import app from './worker.js';

const ASCENT_SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ASCENT_ADMIN_VALIDATE_RPC=ASCENT_SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);

    if(url.pathname==='/admin-handoff' && request.method==='POST'){
      let token='';
      try{
        const form=await request.formData();
        token=String(form.get('ascent_session_token')||'').trim();
      }catch{
        return plain('Administrator handoff could not be read.',400);
      }

      if(!token) return plain('Your ASCENT administrator session is missing.',403);
      const valid=await validateAscentAdminSession(token);
      if(!valid) return plain('Your ASCENT administrator session is not valid or has expired.',403);
      if(!env.GEMINI_API_KEY) return plain('CAT administrator access is not configured.',503);

      const cookie=await makeAdminCookie(env.GEMINI_API_KEY);
      const assetUrl=new URL('/index.html',request.url);
      const assetResponse=await env.ASSETS.fetch(new Request(assetUrl.toString(),{method:'GET'}));
      if(!assetResponse.ok) return plain('CAT Simulator could not be opened.',502);

      const headers=new Headers(assetResponse.headers);
      headers.set('cache-control','no-store');
      headers.set('content-location','/test');
      headers.append('set-cookie',cookie);
      return new Response(assetResponse.body,{status:200,headers});
    }

    return app.fetch(request,env,ctx);
  }
};

async function validateAscentAdminSession(token){
  try{
    const response=await fetch(ASCENT_ADMIN_VALIDATE_RPC,{
      method:'POST',
      headers:{
        apikey:ASCENT_SUPABASE_KEY,
        authorization:`Bearer ${ASCENT_SUPABASE_KEY}`,
        'content-type':'application/json'
      },
      body:JSON.stringify({p_session_token:token})
    });
    if(!response.ok) return false;
    const payload=await response.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result && result.ok===true);
  }catch(error){
    console.error('CAT admin handoff validation failed',error?.message||error);
    return false;
  }
}

async function makeAdminCookie(secret){
  const issued=String(Math.floor(Date.now()/1000));
  const key=await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},
    false,
    ['sign']
  );
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`cat-admin:${issued}`));
  const sig=base64Url(new Uint8Array(signed));
  return `cat_admin_session=${issued}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;
}

function base64Url(bytes){
  let binary='';
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function plain(message,status){
  return new Response(message,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
}
