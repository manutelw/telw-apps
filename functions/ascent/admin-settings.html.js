export async function onRequest(context){
  const response=await context.next();
  if(!response.ok)return response;
  let html=await response.text();
  if(!html.includes('id="oracyAdminHubCard"')){
    const card=`<a id="oracyAdminHubCard" class="app-card dialogue" href="/oracy/admin.html"><strong>ORACY</strong><span>Manage spoken-English learners, passwords and assigned units</span></a>`;
    html=html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',card+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
