(()=>{
  'use strict';
  const ASCENT_SESSION_KEY='ascent_trainer_session';
  const SESSION_API='/portal/trainer/ascent-session';
  const DATA_API='/portal/trainer/ascent-data';
  const LOGOUT_API='/portal/trainer/ascent-logout';

  const pick=(obj,...keys)=>{for(const k of keys){if(obj&&obj[k]!==undefined&&obj[k]!==null&&obj[k]!=='')return obj[k]}return null};
  const numberOrNull=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const objectOrEmpty=v=>{if(v&&typeof v==='object'&&!Array.isArray(v))return v;if(typeof v==='string'){try{const x=JSON.parse(v);return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){}}return{}};
  const safeSession=()=>{try{return JSON.parse(localStorage.getItem(ASCENT_SESSION_KEY)||'null')}catch(_){return null}};
  const showBridgeMessage=(text,isError=false)=>{const el=document.getElementById('loginError')||document.getElementById('recoveryMessage');if(!el)return;el.textContent=text||'';if(el.id==='loginError'&&!isError)el.textContent='';};

  function studentRows(payload){
    const report=payload.report||{},workbook=payload.workbook||{};
    const source=(Array.isArray(report.students)&&report.students.length?report.students:(Array.isArray(workbook.students)?workbook.students:[]));
    return source.map((s,i)=>{
      const id=String(pick(s,'studentUuid','student_uuid','uuid','id')||`student-${i}`);
      const code=String(pick(s,'studentId','student_id','studentCode','student_code','rollNo','roll_no')||'');
      const name=String(pick(s,'fullName','full_name','name')||code||'Unnamed student');
      const batch=String(pick(s,'batch','batchName','batch_name','batchId','batch_id')||'Unassigned');
      return {id,student_code:code,full_name:name,email:String(pick(s,'email','emailId','email_id')||''),role:'student',batch_id:batch,access_type:String(pick(s,'accessType','access_type')||''),active:pick(s,'active')!==false};
    });
  }

  function submissionRows(payload,students){
    const report=payload.report||{},workbook=payload.workbook||{};
    let source=Array.isArray(workbook.submissions)?workbook.submissions:[];
    let aggregated=false;
    if(!source.length){source=Array.isArray(report.submissions)&&report.submissions.length?report.submissions:(Array.isArray(report.results)?report.results:[]);aggregated=true;}
    const byCode=new Map(),byEmail=new Map(),byName=new Map();
    students.forEach(s=>{if(s.student_code)byCode.set(String(s.student_code).toLowerCase(),s.id);if(s.email)byEmail.set(String(s.email).toLowerCase(),s.id);if(s.full_name)byName.set(String(s.full_name).toLowerCase(),s.id)});
    return source.map((r,i)=>{
      const rawStudent=String(pick(r,'studentUuid','student_uuid','profileId','profile_id')||'');
      const code=String(pick(r,'studentId','student_id','studentCode','student_code','rollNo','roll_no')||'').toLowerCase();
      const email=String(pick(r,'email','emailId','email_id')||'').toLowerCase();
      const name=String(pick(r,'fullName','full_name','studentName','student_name','name')||'').toLowerCase();
      const studentId=rawStudent||byCode.get(code)||byEmail.get(email)||byName.get(name)||'';
      const criteria=objectOrEmpty(pick(r,'criteria','criterionScores','criterion_scores','criteriaScores','criteria_scores'));
      const rawEvaluation=objectOrEmpty(pick(r,'rawEvaluation','raw_evaluation'));
      const score=numberOrNull(pick(r,'finalScore','final_score','overallScore','overall_score','totalScore','total_score','score','latestScore','latest_score'));
      return {
        id:String(pick(r,'submissionUuid','submission_uuid','id')||`submission-${i}`),
        student_id:studentId,
        question_id:String(pick(r,'questionId','question_id','taskUuid','task_uuid')||''),
        module_type:String(pick(r,'moduleType','module_type','questionType','question_type','rubricType','rubric_type','taskType','task_type')||'Managerial Communication'),
        question:String(pick(r,'question','taskTitle','task_title','title')||'Assessment response'),
        attempt_number:Number(pick(r,'attemptNumber','attempt_number','attemptCount','attempt_count')||1),
        audio_url:String(pick(r,'audioUrl','audio_url')||''),
        transcript:String(pick(r,'transcript','responseText','response_text','studentResponse','student_response')||''),
        duration_seconds:numberOrNull(pick(r,'durationSeconds','duration_seconds')),
        overall_score:score,
        structure_clarity:numberOrNull(pick(r,'structureClarity','structure_clarity',criteria.structure_clarity)),
        content_depth_evidence:numberOrNull(pick(r,'contentDepthEvidence','content_depth_evidence',criteria.content_depth_evidence,criteria.content_depth)),
        business_thinking:numberOrNull(pick(r,'businessThinking','business_thinking',criteria.business_thinking)),
        communication_professionalism:numberOrNull(pick(r,'communicationProfessionalism','communication_professionalism',criteria.communication_professionalism,criteria.comm_professionalism)),
        composure_under_pressure:numberOrNull(pick(r,'composureUnderPressure','composure_under_pressure',criteria.composure_under_pressure,criteria.composure)),
        criteria,
        feedback:pick(r,'feedback','feedbackText','feedback_text')||{},
        lowest_criterion:String(pick(r,'lowestCriterion','lowest_criterion')||''),
        next_action:String(pick(r,'nextAction','next_action')||''),
        practice_task:String(pick(r,'practiceTask','practice_task')||''),
        communication_band:String(pick(r,'communicationBand','communication_band')||''),
        communication_reason:String(pick(r,'communicationReason','communication_reason')||''),
        cando:String(pick(r,'cando','canDo','can_do')||''),
        flag:String(pick(r,'flag')||''),
        processing_status:String(pick(r,'processingStatus','processing_status','status')||(aggregated?'completed':'completed')),
        evaluation_error:pick(r,'evaluationError','evaluation_error')||null,
        scoring_source:String(pick(r,'scoringSource','scoring_source')||''),
        trainer_review_status:String(pick(r,'trainerReviewStatus','trainer_review_status')||''),
        raw_evaluation:rawEvaluation,
        submitted_at:pick(r,'submittedAt','submitted_at','latestSubmittedAt','latest_submitted_at','completedAt','completed_at','availableAt','available_at')||null
      };
    }).filter(x=>x.student_id);
  }

  function applyPayload(payload){
    if(typeof state==='undefined'||typeof renderDashboard!=='function'||typeof setScreen!=='function')throw new Error('Trainer dashboard has not finished loading.');
    const students=studentRows(payload);
    const submissions=submissionRows(payload,students);
    const trainer=payload.trainer||{};
    state.trainer={id:trainer.trainerUuid||trainer.email||'trainer',full_name:trainer.fullName||trainer.email||'Trainer',email:trainer.email||'',role:String(trainer.role||'trainer').toLowerCase(),batch_id:null,access_type:'CENTRAL',active:true};
    state.students=students;
    state.submissions=submissions;
    state.batches={};students.forEach(s=>{state.batches[s.batch_id]=s.batch_id});
    state.summaries=[];state.filtered=[];
    renderDashboard();
  }

  async function getData(){
    const res=await fetch(DATA_API,{method:'GET',credentials:'include',cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw Object.assign(new Error(data.error||'Trainer session unavailable.'),{status:res.status});
    applyPayload(data);return data;
  }

  async function exchange(body){
    const res=await fetch(SESSION_API,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Trainer sign-in failed.');
    if(data.session?.sessionToken)localStorage.setItem(ASCENT_SESSION_KEY,JSON.stringify(data.session));
    return data;
  }

  async function resume(){
    try{return await getData()}catch(err){
      if(err?.status!==401&&err?.status!==403)return null;
      const s=safeSession();
      if(!s?.sessionToken)return null;
      try{await exchange({sessionToken:s.sessionToken});return await getData()}catch(_){return null;}
    }
  }

  function wire(){
    const loginForm=document.getElementById('loginForm');
    if(loginForm)loginForm.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const username=document.getElementById('username')?.value?.trim()||'';
      const password=document.getElementById('password')?.value||'';
      const btn=document.getElementById('loginBtn'),err=document.getElementById('loginError');
      if(err)err.textContent='';
      if(!username||!password){if(err)err.textContent='Enter your ASCENT trainer username/email and password.';return;}
      if(btn){btn.disabled=true;btn.textContent='Signing in…';}
      try{await exchange({username,password});if(typeof setScreen==='function')setScreen('loading');await getData();}
      catch(ex){if(err)err.textContent=ex?.message||'Trainer sign-in failed.';if(typeof showSignInScreen==='function')showSignInScreen();}
      finally{if(btn){btn.disabled=false;btn.textContent='Sign in →';}}
    },true);

    const forgot=document.getElementById('forgotBtn');
    if(forgot)forgot.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='/ascent/forgot-password.html?type=TRAINER';},true);

    const logout=document.getElementById('logoutBtn');
    if(logout)logout.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();await fetch(LOGOUT_API,{method:'POST',credentials:'include'}).catch(()=>{});if(typeof db!=='undefined')await db.auth.signOut().catch(()=>{});if(typeof showSignInScreen==='function')showSignInScreen('Signed out of the normal trainer portal. Your ASCENT trainer session is unchanged.');},true);

    const refresh=document.getElementById('refreshBtn');
    if(refresh)refresh.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();refresh.disabled=true;try{if(typeof setScreen==='function')setScreen('loading');await getData();if(typeof showToast==='function')showToast('Trainer records refreshed.');}catch(ex){if(typeof showSignInScreen==='function')showSignInScreen();const err=document.getElementById('loginError');if(err)err.textContent=ex?.message||'Refresh failed.';}finally{refresh.disabled=false;}},true);

    const intro=document.querySelector('#signInPanel .lead');if(intro)intro.textContent='Use your existing ASCENT trainer credentials. Manu may enter “manu”; Sandeep may enter “sandeep” or his FIIB email.';
    const note=document.querySelector('#signInPanel .security-note');if(note)note.textContent='This normal trainer portal now validates the existing ASCENT trainer session. Access is enabled for Manu Vikraman and Sandeep Kumar.';
  }

  async function init(){wire();const resumed=await resume();if(!resumed&&typeof showSignInScreen==='function')showSignInScreen();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
