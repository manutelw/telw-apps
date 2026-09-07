export async function onRequest(context) {
  const response = await context.next();
  if (!response.ok) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  const gate = `
<script data-live-mock-admin-gate="2026-09-07">
(function(){
  function validAdmin(){
    for(const key of ['ascent_admin_master_session','ascent_trainer_session']){
      try{
        const s=JSON.parse(localStorage.getItem(key)||'null');
        const expiry=new Date(s?.expiresAt||s?.expires_at||0).getTime();
        const token=s?.sessionToken||s?.session_token;
        if(token&&String(s?.role||'').toUpperCase()==='ADMIN'&&Number.isFinite(expiry)&&expiry>Date.now())return true;
      }catch(_){ }
    }
    return false;
  }
  if(!validAdmin()) location.replace('/ascent/admin-login.html');
})();
</script>`;
  html = html.replace('</head>', gate + '\n</head>');

  const headers = new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
