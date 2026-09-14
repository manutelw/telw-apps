(function(){
  "use strict";

  const DB_NAME="ascent_recording_vault_v1";
  const STORE_NAME="recordings";
  const SESSION_KEY="ascent_student_session";
  const MAX_AGE_MS=7*24*60*60*1000;
  const params=new URLSearchParams(location.search);
  const repair=params.get("repair")||"";
  const protectedRetry=params.get("protected_retry")==="1"||sessionStorage.getItem("ascent_protected_retry")==="1";
  const frame=document.getElementById("practiceFrame");
  const practiceKicker=document.getElementById("practiceKicker");
  const practiceText=document.getElementById("practiceText");

  function status(text){
    if(practiceKicker) practiceKicker.textContent="ASCENT Coach repair";
    if(practiceText) practiceText.textContent=text;
  }

  function readSession(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}catch{return null;}
  }

  function openVault(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("Recording vault unavailable"));
    });
  }

  async function latestProtectedRecording(){
    const session=readSession();
    if(!session?.studentUuid||!window.indexedDB)return null;
    const db=await openVault();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,"readonly");
        const store=tx.objectStore(STORE_NAME);
        const index=store.index("studentUuid");
        const req=index.getAll(String(session.studentUuid));
        req.onsuccess=()=>{
          const cutoff=Date.now()-MAX_AGE_MS;
          const records=(Array.isArray(req.result)?req.result:[])
            .filter(r=>r&&r.blob instanceof Blob&&r.blob.size>0&&Number(r.createdAt||0)>=cutoff)
            .sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
          resolve(records[0]||null);
        };
        req.onerror=()=>reject(req.error||new Error("Recording lookup failed"));
      });
    }finally{db.close();}
  }

  function waitForFrame(test,timeoutMs=20000){
    return new Promise((resolve,reject)=>{
      const start=Date.now();
      const timer=setInterval(()=>{
        try{
          const doc=frame?.contentDocument;
          if(doc&&test(doc)){clearInterval(timer);resolve(doc);return;}
        }catch{}
        if(Date.now()-start>=timeoutMs){clearInterval(timer);reject(new Error("Repair verification timed out"));}
      },250);
    });
  }

  async function recoverSubmission(){
    status("ASCENT is checking this device for your protected unsent recording.");
    const record=await latestProtectedRecording().catch(()=>null);
    if(!record){
      sessionStorage.removeItem("ascent_protected_retry");
      status("No protected unsent recording was found on this device. The incident remains recorded for review; ASCENT has not created or consumed an attempt.");
      return;
    }

    status("Protected recording found. ASCENT is restoring the exact response and preparing the original submission again.");
    const doc=await waitForFrame(d=>{
      const state=d.getElementById("recordingState");
      const submit=d.getElementById("submitButton");
      return state&&/Recovered recording ready/i.test(state.textContent||"")&&submit&&!submit.disabled;
    }).catch(()=>null);

    if(!doc){
      status("ASCENT found the protected recording but could not safely restore its original question state. The recording remains protected and the incident is queued for review.");
      return;
    }

    const submit=doc.getElementById("submitButton");
    if(!submit||submit.disabled){
      status("ASCENT restored the recording but could not verify a safe submission action. The recording remains protected.");
      return;
    }

    sessionStorage.removeItem("ascent_protected_retry");
    status("Your exact protected recording has been restored. ASCENT is retrying the original submission now.");
    setTimeout(()=>submit.click(),500);
  }

  async function recoverAssignment(){
    status("ASCENT is rebuilding your visible practice state from the active assignment on your account.");
    const doc=await waitForFrame(d=>{
      const mode=d.getElementById("practiceModeSelect");
      const assigned=d.getElementById("assignedTaskSelect");
      return mode&&assigned&&Array.from(mode.options||[]).some(o=>o.value==="assigned")&&assigned.options.length>0;
    }).catch(()=>null);

    if(!doc){
      status("ASCENT could not verify an active assigned question in Practice. Nothing was changed; the protected incident remains queued for review.");
      return;
    }

    const mode=doc.getElementById("practiceModeSelect");
    const assigned=doc.getElementById("assignedTaskSelect");
    mode.value="assigned";
    mode.dispatchEvent(new Event("change",{bubbles:true}));
    if(assigned.selectedIndex<0&&assigned.options.length)assigned.selectedIndex=0;
    assigned.dispatchEvent(new Event("change",{bubbles:true}));

    const verified=await waitForFrame(d=>{
      const box=d.getElementById("selectedQuestionBox");
      const text=d.getElementById("selectedQuestionText");
      return box&&!box.hidden&&text&&String(text.textContent||"").trim().length>0;
    },5000).catch(()=>null);

    status(verified
      ? "ASCENT restored and verified your active assigned question. You can continue from the restored question below."
      : "ASCENT reopened your active assignment, but could not verify the question display. The incident remains protected for review.");
  }

  async function run(){
    if(protectedRetry){await recoverSubmission();return;}
    if(repair==="reload"){await recoverAssignment();}
  }

  if(frame){
    if(frame.contentDocument?.readyState==="complete")setTimeout(run,300);
    else frame.addEventListener("load",()=>setTimeout(run,300),{once:true});
  }
})();
