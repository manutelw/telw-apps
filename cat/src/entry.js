import app from './worker.js';

const ASCENT_SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ASCENT_ADMIN_VALIDATE_RPC=ASCENT_SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';
const SHARE_ACCESS_API=ASCENT_SUPABASE_URL+'/functions/v1/share-access-pass';
const PAID_API='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-commerce';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);

    const paidToken=String(url.searchParams.get('clarion_token')||'').trim();
    const paidDevice=String(url.searchParams.get('clarion_device')||'').trim();
    if(paidToken&&paidDevice&&request.method==='GET'){
      if(!env.GEMINI_API_KEY)return plain('CAT paid access is not configured.',503);
      const ok=await consumePaidAccess(paidToken,paidDevice);
      if(!ok)return plain('This CAT paid access is not active on this device or this attempt has already been used.',403);
      const cookie=await makeAdminCookie(env.GEMINI_API_KEY,3600);
      const assetUrl=new URL('/index.html',request.url);
      const assetResponse=await env.ASSETS.fetch(new Request(assetUrl.toString(),{method:'GET'}));
      if(!assetResponse.ok)return plain('CAT Simulator could not be opened.',502);
      const headers=new Headers(assetResponse.headers);
      headers.set('cache-control','no-store');
      headers.set('content-location','/test');
      headers.append('set-cookie',cookie);
      return new Response(assetResponse.body,{status:200,headers});
    }

    const sharePass=String(url.searchParams.get('pass')||'').trim();
    if(sharePass && request.method==='GET'){
      if(!env.GEMINI_API_KEY) return plain('CAT shared access is not configured.',503);
      const redeemed=await redeemSharePass(sharePass);
      if(!redeemed.ok) return plain(redeemed.message||'This CAT access link is not active.',redeemed.status||403);
      const maxAge=shareCookieSeconds(redeemed.expires_at);
      if(maxAge<=0) return plain('This CAT access link has expired.',403);
      const cookie=await makeAdminCookie(env.GEMINI_API_KEY,maxAge);
      const assetUrl=new URL('/index.html',request.url);
      const assetResponse=await env.ASSETS.fetch(new Request(assetUrl.toString(),{method:'GET'}));
      if(!assetResponse.ok) return plain('CAT Simulator could not be opened.',502);
      const headers=new Headers(assetResponse.headers);
      headers.set('cache-control','no-store');
      headers.set('content-location','/test');
      headers.append('set-cookie',cookie);
      return new Response(assetResponse.body,{status:200,headers});
    }

    if(url.pathname==='/admin-handoff' && request.method==='POST'){
      let token='';
      try{const form=await request.formData();token=String(form.get('ascent_session_token')||'').trim();}catch{return plain('Administrator handoff could not be read.',400);}
      if(!token) return plain('Your ASCENT administrator session is missing.',403);
      const valid=await validateAscentAdminSession(token);
      if(!valid) return plain('Your ASCENT administrator session is not valid or has expired.',403);
      if(!env.GEMINI_API_KEY) return plain('CAT administrator access is not configured.',503);
      const cookie=await makeAdminCookie(env.GEMINI_API_KEY,3600);
      const assetUrl=new URL('/index.html',request.url);
      const assetResponse=await env.ASSETS.fetch(new Request(assetUrl.toString(),{method:'GET'}));
      if(!assetResponse.ok) return plain('CAT Simulator could not be opened.',502);
      const headers=new Headers(assetResponse.headers);
      headers.set('cache-control','no-store');headers.set('content-location','/test');headers.append('set-cookie',cookie);
      return new Response(assetResponse.body,{status:200,headers});
    }
    return app.fetch(request,env,ctx);
  }
};

async function consumePaidAccess(token,device){try{const r=await fetch(PAID_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'CONSUME',product_code:'CAT_SIMULATOR',entitlement_token:token,device_id:device,minutes:1})});const d=await r.json().catch(()=>({}));return r.ok&&d.ok===true}catch{return false}}
async function redeemSharePass(token){try{const response=await fetch(SHARE_ACCESS_API,{method:'POST',headers:{apikey:ASCENT_SUPABASE_KEY,authorization:`Bearer ${ASCENT_SUPABASE_KEY}`,'content-type':'application/json'},body:JSON.stringify({action:'REDEEM',product:'CAT_SIMULATOR',token})});const data=await response.json().catch(()=>({}));return response.ok&&data.ok===true?{ok:true,...data}:{ok:false,status:response.status,message:data.message};}catch(error){console.error('CAT share pass validation failed',error?.message||error);return {ok:false,status:503,message:'CAT shared access could not be checked.'};}}
function shareCookieSeconds(expiresAt){if(!expiresAt)return 3600;const seconds=Math.floor((new Date(expiresAt).getTime()-Date.now())/1000);return Math.max(0,Math.min(3600,seconds));}
async function validateAscentAdminSession(token){try{const response=await fetch(ASCENT_ADMIN_VALIDATE_RPC,{method:'POST',headers:{apikey:ASCENT_SUPABASE_KEY,authorization:`Bearer ${ASCENT_SUPABASE_KEY}`,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});if(!response.ok)return false;const payload=await response.json();const result=Array.isArray(payload)?payload[0]:payload;return Boolean(result&&result.ok===true);}catch(error){console.error('CAT admin handoff validation failed',error?.message||error);return false;}}
async function makeAdminCookie(secret,maxAge=3600){const issued=String(Math.floor(Date.now()/1000));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`cat-admin:${issued}`));const sig=base64Url(new Uint8Array(signed));return `cat_admin_session=${issued}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(1,Math.floor(maxAge))}`;}
function base64Url(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function plain(message,status){return new Response(message,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});}
