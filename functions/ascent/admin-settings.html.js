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
  if(!html.includes('id="careerTrackFitAdminCard"')){
    const careerTrackFit=`<a id="careerTrackFitAdminCard" class="app-card dialogue" href="/career-track-fit/"><strong>Career Track Fit</strong><span>Assess second-year placement readiness and prescribe targeted development modules</span></a>`;
    html=html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',careerTrackFit+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
  }
  if(!html.includes('id="ldTrainingPlanAdminCard"')){
    const ld=`<button id="ldTrainingPlanAdminCard" class="app-card dialogue" type="button"><strong>L&amp;D Training Plan</strong><span>Trainer-only six-session placement-readiness plan for Learning &amp; Development roles</span></button>`;
    html=html.replace('<a id="careerTrackFitAdminCard"',ld+'\n        <a id="careerTrackFitAdminCard"');
  }
  if(!html.includes('id="trainerLoginAdminCard"')){
    const trainerLogin=`<a id="trainerLoginAdminCard" class="app-card ascent" href="/ascent/trainer-login.html"><strong>Trainer Login</strong><span>Open the ASCENT Trainer sign-in page for Manu, Sandeep and authorised trainers</span></a>`;
    html=html.replace('<button id="ldTrainingPlanAdminCard"',trainerLogin+'\n        <button id="ldTrainingPlanAdminCard"');
  }

  const ldLaunch=`<script data-ld-plan-admin-launch="2026-09-14.1">(function(){function token(){for(const key of ['ascent_admin_master_session','ascent_trainer_session']){try{const s=JSON.parse(localStorage.getItem(key)||'null');const exp=new Date(s?.expiresAt||s?.expires_at||0).getTime();const t=s?.sessionToken||s?.session_token;if(t&&Number.isFinite(exp)&&exp>Date.now())return t;}catch(_){}}return '';}function openPlan(){const t=token();if(!t){location.href='./admin-login.html';return;}const f=document.createElement('form');f.method='POST';f.action='./ld-training-plan';f.style.display='none';const i=document.createElement('input');i.type='hidden';i.name='ascent_session_token';i.value=t;f.appendChild(i);document.body.appendChild(f);f.submit();}const b=document.getElementById('ldTrainingPlanAdminCard');if(b)b.addEventListener('click',openPlan);})();</script>`;
  if(!html.includes('data-ld-plan-admin-launch'))html=html.replace('</body>',ldLaunch+'\n</body>');

  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}