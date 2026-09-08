const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';

export async function onRequestPost(context){
  const token=readCookie(context.request.headers.get('cookie')||'','oracy_session');
  if(token){
    await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'logout',session_token:token})}).catch(()=>{});
  }
  const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
  headers.append('set-cookie','oracy_session=; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(JSON.stringify({ok:true}),{status:200,headers});
}
function readCookie(header,name){const m=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
