export async function onRequest(context){
  const response=await context.next();
  if(!response.ok)return response;
  let html=await response.text();

  // A missing or expired Admin Hub browser session used to send the
  // administrator to ./, which is the learner Access Point. Keep the
  // administrator route separate and send those cases to the dedicated
  // administrator login page instead.
  html=html.replaceAll(
    'window.location.replace("./");',
    'window.location.replace("./admin-login.html");'
  );

  if(!html.includes('id="oracyAdminHubCard"')){
    const card=`<a id="oracyAdminHubCard" class="app-card dialogue" href="/oracy/admin.html"><strong>ORACY</strong><span>Manage spoken-English learners, passwords and assigned units</span></a>`;
    html=html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',card+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
  }
  if(!html.includes('id="oracyShareHubCard"')){
    const share=`<a id="oracyShareHubCard" class="app-card dialogue" href="/oracy/admin-share.html"><strong>SHARE ORACY</strong><span>Choose units or levels, set free access for up to seven days, and email secure links</span></a>`;
    html=html.replace('<a class="app-card mapper" href="./jd-interview-trainer.html"',share+'\n        <a class="app-card mapper" href="./jd-interview-trainer.html"');
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
