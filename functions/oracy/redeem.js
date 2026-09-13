const SHARE_API='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-share-access';

export async function onRequestGet(context){
  const url=new URL(context.request.url),token=url.searchParams.get('token')||'';
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(token))return failed('This ORACY access link is invalid.');
  try{
    const r=await fetch(SHARE_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'REDEEM',token})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok!==true||!d.session_token)return failed(d.message||'This ORACY access link is invalid, used, expired or revoked.');
    const destination=String(d.destination_path||'/oracy/');
    if(!/^\/oracy\//.test(destination))return failed('The ORACY destination is invalid.');
    const headers=new Headers({location:destination,'cache-control':'no-store, max-age=0','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow, noarchive'});
    headers.append('set-cookie','oracy_session='+encodeURIComponent(d.session_token)+'; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=43200');
    return new Response(null,{status:303,headers});
  }catch(_){return failed('ORACY access could not be opened. Please try the link again.');}
}

function failed(message){
  const safe=String(message).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return new Response('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>ORACY access</title></head><body style="font-family:Arial,sans-serif;background:#edf3f7;color:#17324f;padding:40px"><main style="max-width:620px;margin:auto;background:white;padding:28px;border-radius:16px"><h1>ORACY access</h1><p>'+safe+'</p><p><a href="/oracy/">Return to ORACY</a></p></main></body></html>',{status:410,headers:{'content-type':'text/html; charset=UTF-8','cache-control':'no-store, max-age=0','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow, noarchive'}});
}
