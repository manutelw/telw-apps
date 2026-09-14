export async function renderAccessPoint(context){
  const response=await context.next();
  if(!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;

  let html=await response.text();

  if(!html.includes('id="trainerDirectEntry"')){
    const entry=`
<div id="trainerDirectEntry" style="margin:24px 0 8px;text-align:center">
  <a href="/ascent/trainer-login.html" style="display:inline-block;min-width:220px;padding:13px 24px;border-radius:12px;background:#143a60;color:#fff;font-weight:700;text-decoration:none">Trainer Login</a>
</div>`;
    html=html.replace(/(<form\s+id="accessForm"[\s\S]*?<\/form>)/,'$1'+entry);
  }

  const fix=`
<style data-trainer-entry-visibility="2026-09-14.1">[hidden]{display:none!important}</style>
<script data-trainer-entry-flow="2026-09-14.1">
(function(){
  const trainer=document.getElementById('trainerRoleButton');
  if(trainer){
    trainer.addEventListener('click',function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href='/ascent/trainer-login.html';
    },true);
  }
})();
</script>`;
  if(!html.includes('data-trainer-entry-flow'))html=html.replace('</body>',fix+'\n</body>');

  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
