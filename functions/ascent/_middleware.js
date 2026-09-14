const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.endsWith('/ascent/professional-communication-trainer-preview.html')) {
    return new Response(null,{status:302,headers:{location:'https://pcl-professional-communication-lab.pages.dev/','cache-control':'no-store'}});
  }
  const isTrainerPage = url.pathname.endsWith('/ascent/trainer.html') || url.pathname.endsWith('/ascent/trainer') || url.pathname.endsWith('/ascent/trainer/');
  const isAdminSettingsPage = url.pathname.endsWith('/ascent/admin-settings.html');
  const isProtectedAdminPage =
    url.pathname.endsWith('/ascent/pcl.html') ||
    /\/ascent\/professional-communication-[^/]+\.html$/.test(url.pathname) ||
    /\/ascent\/live-mock(?:-[^/]+)?\.html$/.test(url.pathname) ||
    url.pathname.endsWith('/ascent/mock-interview.html');

  if (isProtectedAdminPage) {
    const token=readCookie(context.request.headers.get('cookie')||'','clarion_admin_session');
    if(!token || !(await validAdminToken(token))){
      return new Response(null,{status:302,headers:{location:'/ascent/admin-login.html','cache-control':'no-store'}});
    }
  }

  const response = await context.next();
  if (!response.ok || (!isTrainerPage && !isAdminSettingsPage && !isProtectedAdminPage)) return response;
  let html = await response.text();

  if (isTrainerPage) {
    const trainerButtons = `\n          <button id="ldTrainingPlanTrainerButton" class="nav-item" type="button">L&amp;D Training Plan</button>\n          <button id="normalTrainerPortalButton" class="nav-item" type="button">CLARION Trainer Portal</button>`;
    if (!html.includes('id="ldTrainingPlanTrainerButton"')) {
      html = html.replace(
        /(<button class="nav-item" type="button" data-section="leaderboard">Placement Readiness Board<\/button>)/,
        '$1' + trainerButtons
      );
    } else if (!html.includes('id="normalTrainerPortalButton"')) {
      html = html.replace('id="ldTrainingPlanTrainerButton" class="nav-item" type="button">L&amp;D Training Plan</button>','id="ldTrainingPlanTrainerButton" class="nav-item" type="button">L&amp;D Training Plan</button>\n          <button id="normalTrainerPortalButton" class="nav-item" type="button">CLARION Trainer Portal</button>');
    }

    const trainerResourceLaunch = `
<script data-trainer-resource-launch="2026-09-14.2">
(function(){
  function currentSession(){
    for(const key of ['ascent_trainer_session','ascent_admin_master_session']){
      try{
        const s=JSON.parse(localStorage.getItem(key)||'null');
        const exp=new Date(s?.expiresAt||s?.expires_at||0).getTime();
        const token=s?.sessionToken||s?.session_token;
        if(token&&Number.isFinite(exp)&&exp>Date.now())return {session:s,token};
      }catch(_){ }
    }
    return null;
  }
  function openLdPlan(){
    const found=currentSession();
    if(!found){location.href='/ascent/trainer-login.html';return;}
    const form=document.createElement('form');form.method='POST';form.action='/ascent/ld-training-plan';form.style.display='none';
    const input=document.createElement('input');input.type='hidden';input.name='ascent_session_token';input.value=found.token;form.appendChild(input);document.body.appendChild(form);form.submit();
  }
  async function openNormalTrainer(){
    const found=currentSession();
    if(!found){location.href='/ascent/trainer-login.html';return;}
    const button=document.getElementById('normalTrainerPortalButton');
    if(button){button.disabled=true;button.textContent='Opening trainer portal…';}
    try{
      const response=await fetch('/portal/trainer/ascent-session',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({sessionToken:found.token})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Trainer portal access could not be opened.');
      location.href='/portal/trainer/';
    }catch(error){
      if(button){button.disabled=false;button.textContent='CLARION Trainer Portal';}
      alert(error?.message||'Trainer portal access could not be opened.');
    }
  }
  document.getElementById('ldTrainingPlanTrainerButton')?.addEventListener('click',openLdPlan);
  document.getElementById('normalTrainerPortalButton')?.addEventListener('click',openNormalTrainer);
})();
</script>`;

    const script = `
<script data-ascent-results-task-filter="2026-09-07.2">
(function () {
  const RESULT_TASK_OPTIONS = [
    { value: "", label: "All tasks" },{ value: "PI", label: "PI" },{ value: "GD", label: "GD" },{ value: "LUM", label: "LUM" },{ value: "JD", label: "JD" },{ value: "ASCENT_TASK", label: "Ascent Task" }
  ];
  function categoryForResult(row) {
    const questionType = String(row && row.questionType || "").trim().toUpperCase();
    const rubricType = String(row && row.rubricType || "").trim().toUpperCase();
    const taskTitle = String(row && row.taskTitle || "").trim().toUpperCase();
    if (taskTitle.includes("JD INTERVIEW MAPPER") || taskTitle.startsWith("JD ") || taskTitle.includes("· JD")) return "JD";
    if (questionType === "PI" || rubricType === "PI") return "PI";
    if (questionType === "GD" || rubricType === "GD") return "GD";
    if (questionType === "LUM") return "LUM";
    if (rubricType === "MANAGERIAL_COMMUNICATION" && taskTitle.startsWith("LUM ")) return "LUM";
    return "ASCENT_TASK";
  }
  function enforceResultsTaskOptions() {
    const select = document.getElementById("resultTaskFilter"); if (!select) return;
    const current = select.value;
    const expected = RESULT_TASK_OPTIONS.map(item => item.value + "|" + item.label).join("||");
    const actual = Array.from(select.options).map(option => option.value + "|" + option.textContent).join("||");
    if (actual === expected) return;
    select.innerHTML = "";
    RESULT_TASK_OPTIONS.forEach(item => { const option=document.createElement("option"); option.value=item.value; option.textContent=item.label; select.appendChild(option); });
    select.value = RESULT_TASK_OPTIONS.some(item => item.value === current) ? current : "";
  }
  function fixPracticeLinks(){
    const pi=document.getElementById('piLabTrainerLink'); if(pi){pi.textContent='PI Practice';pi.href='./practice-access.html?feature=PI_BANK';pi.target='';pi.removeAttribute('rel');}
    const gd=document.getElementById('gdLabTrainerLink'); if(gd){gd.textContent='GD Practice';gd.href='./practice-access.html?feature=GD_BANK';gd.target='';gd.removeAttribute('rel');}
    const generic=document.getElementById('learnerAccessTrainerLink'); if(generic)generic.remove();
  }
  if (typeof window.resultFilter === "function") {
    window.resultFilter = function (rows, prefix) {
      const batch=document.getElementById(prefix+"BatchFilter")?.value||"",student=document.getElementById(prefix+"StudentFilter")?.value||"",task=document.getElementById(prefix+"TaskFilter")?.value||"",status=document.getElementById(prefix+"StatusFilter")?.value||"";
      const from=prefix==="result"?(document.getElementById("resultDateFrom")?.value||""):"",to=prefix==="result"?(document.getElementById("resultDateTo")?.value||""):"";
      return (rows||[]).filter(row=>{if(batch&&String(row.batch||"")!==batch)return false;if(student&&row.studentUuid!==student)return false;if(task){if(prefix==="result"){if(categoryForResult(row)!==task)return false;}else if(row.taskUuid!==task)return false;}if(status&&row.status!==status)return false;const dateValue=row.latestSubmittedAt||row.availableAt;if(from&&dateValue&&new Date(dateValue)<new Date(from+"T00:00:00"))return false;if(to&&dateValue&&new Date(dateValue)>new Date(to+"T23:59:59"))return false;return true;});
    };
  }
  const originalPopulateControls=typeof window.populateControls==="function"?window.populateControls:null;
  if(originalPopulateControls)window.populateControls=function(){const result=originalPopulateControls.apply(this,arguments);enforceResultsTaskOptions();return result;};
  enforceResultsTaskOptions();fixPracticeLinks();
  window.setTimeout(()=>{enforceResultsTaskOptions();fixPracticeLinks();},250);
  window.setTimeout(()=>{enforceResultsTaskOptions();fixPracticeLinks();},1000);
  const observer=new MutationObserver(()=>{enforceResultsTaskOptions();fixPracticeLinks();});observer.observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`;
    html = html.replace(/<script data-ascent-results-task-filter="[^"]+">[\s\S]*?<\/script>/, "");
    html = html.replace(/<script data-trainer-resource-launch="[^"]+">[\s\S]*?<\/script>/, "");
    html = html.replace('</body>', script + '\n' + trainerResourceLaunch + '\n</body>');
  }
  if (isAdminSettingsPage) {
    const oracyShareCard = `
        <a id="oracyShareHubCard" class="app-card dialogue" href="/oracy/admin-share.html"><strong>SHARE ORACY</strong><span>Choose units or levels, set free access for up to seven days, and email secure links</span></a>`;
    if (!html.includes('id="oracyShareHubCard"')) html = html.replace('        <a class="app-card mapper" href="./jd-interview-trainer.html"',oracyShareCard+'\n        <a class="app-card mapper" href="./jd-interview-trainer.html"');
    html = html.replace('<a class="app-card gd" href="./learner-access.html"><strong>GD Practice</strong>','<a class="app-card gd" href="./practice-access.html?feature=GD_BANK"><strong>GD Practice</strong>');
    html = html.replace('<a class="app-card pi" href="./learner-access.html"><strong>PI Practice</strong>','<a class="app-card pi" href="./practice-access.html?feature=PI_BANK"><strong>PI Practice</strong>');
    const adminPracticeCards = `\n        <a class="app-card gd" href="./practice-access.html?feature=GD_BANK"><strong>GD Practice</strong><span>Review learner applications and grant GD practice access after the 24-hour wait</span></a>\n        <a class="app-card pi" href="./practice-access.html?feature=PI_BANK"><strong>PI Practice</strong><span>Review learner applications and grant PI practice access after the 24-hour wait</span></a>`;
    if (!html.includes('<strong>GD Practice</strong>')) html = html.replace('        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',adminPracticeCards+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    const shareCards = `\n        <a class="app-card ascent" href="./share-access.html?product=CAT_SIMULATOR"><strong>CAT Access Links</strong><span>Generate CAT links with your own attempt limit and validity period</span></a>\n        <a class="app-card dialogue" href="./share-access.html?product=DIALOGUE_LAB"><strong>Dialogue Lab Access Links</strong><span>Generate Dialogue Lab links with your own launch limit and validity period</span></a>`;
    if (!html.includes('<strong>CAT Access Links</strong>')) html = html.replace('        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',shareCards+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    const wctCard = `\n        <a id="wctAdminHubCard" class="app-card cv" href="../workplace-communication-test/evaluator.html" target="_blank" rel="noopener noreferrer"><strong>Workplace Communication Test</strong><span>Open the central WCT evaluator and manage submitted workplace communication assessments</span></a>`;
    if (!html.includes('id="wctAdminHubCard"')) html = html.replace('        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',wctCard+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    html = html.replace(/\s*<a class="app-card live" href="\.\/share-access\.html\?product=LIVE_MOCK"><strong>Live Mock Access Links<\/strong><span>[\s\S]*?<\/span><\/a>/g,'');

    const secureLaunch = `
<script data-secure-admin-launch="pcl-live-mock-2026-09-07.3">
(function(){
  function adminToken(){
    for(const key of ['ascent_admin_master_session','ascent_trainer_session']){
      try{const s=JSON.parse(localStorage.getItem(key)||'null');const exp=new Date(s?.expiresAt||s?.expires_at||0).getTime();const token=s?.sessionToken||s?.session_token;if(token&&String(s?.role||'').toUpperCase()==='ADMIN'&&Number.isFinite(exp)&&exp>Date.now())return token;}catch(_){ }
    }
    return '';
  }
  function launch(action){
    const token=adminToken();
    if(!token){location.href='./admin-login.html';return;}
    const form=document.createElement('form');form.method='POST';form.action=action;form.style.display='none';
    const input=document.createElement('input');input.type='hidden';input.name='ascent_session_token';input.value=token;form.appendChild(input);document.body.appendChild(form);form.submit();
  }
  const live=document.getElementById('liveMockAppButton');
  if(live)live.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();launch('../live-mock/admin-handoff');},true);
  const pcl=document.getElementById('pclAdminAppButton');
  if(pcl)pcl.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();launch('https://pcl-professional-communication-lab.pages.dev/admin-handoff');},true);
  const pi=document.getElementById('piLabAppButton');
  if(pi)pi.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();launch('../pi-lab/admin-handoff');},true);
})();
</script>`;
    html = html.replace('</body>', secureLaunch + '\n</body>');
  }

  const headers=new Headers(response.headers);headers.set('content-type','text/html; charset=UTF-8');headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

async function validAdminToken(token){
  try{
    const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch(_){return false;}
}