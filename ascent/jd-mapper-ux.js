(function(){
  'use strict';
  const DRAFT_KEY='ascent_jd_mapper_browser_draft_v1';
  const DRAFT_TTL=6*60*60*1000;
  let restoring=false,saveTimer=null;

  function now(){return Date.now();}
  function readDraft(){
    try{
      const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(!d||!d.savedAt||now()-d.savedAt>DRAFT_TTL){localStorage.removeItem(DRAFT_KEY);return null;}
      return d;
    }catch(e){localStorage.removeItem(DRAFT_KEY);return null;}
  }
  function mappingEdits(){
    return [...document.querySelectorAll('.req')].map(card=>({
      requirement_id:card.dataset.id,
      rating:card.querySelector('input[type="radio"]:checked')?.value||'',
      cv_evidence:card.querySelector('.evidence')?.value||''
    }));
  }
  function questionsSnapshot(){
    if(!window.currentCase&&typeof currentCase==='undefined')return [];
    try{return (currentCase?.generated_questions||[]).map(q=>({...q}));}catch(e){return [];}
  }
  function hasWork(){
    const jd=document.getElementById('jdText')?.value.trim()||'';
    const cv=document.getElementById('cvText')?.value.trim()||'';
    return !!(jd||cv||document.querySelector('.req'));
  }
  function saveDraft(){
    if(restoring||!hasWork())return;
    let caseSnapshot=null;
    try{caseSnapshot=currentCase?JSON.parse(JSON.stringify(currentCase)):null;}catch(e){}
    const d={savedAt:now(),jd:document.getElementById('jdText')?.value||'',cv:document.getElementById('cvText')?.value||'',caseSnapshot,mappings:mappingEdits(),questions:questionsSnapshot()};
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch(e){console.warn('JD Mapper browser draft could not be saved.',e);}
  }
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,180);}
  function clearDraft(){localStorage.removeItem(DRAFT_KEY);}
  function applyEdits(edits){
    const by=new Map((edits||[]).map(m=>[String(m.requirement_id),m]));
    document.querySelectorAll('.req').forEach(card=>{
      const m=by.get(String(card.dataset.id));if(!m)return;
      const radio=card.querySelector(`input[type="radio"][value="${m.rating}"]`);
      if(radio){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}
      const ta=card.querySelector('.evidence');if(ta&&m.rating!=='N'){ta.disabled=false;ta.value=m.cv_evidence||'';}
    });
    if(typeof updateSummary==='function')updateSummary();
  }
  function restoreDraft(){
    const d=readDraft();if(!d)return;
    restoring=true;
    const jd=document.getElementById('jdText'),cv=document.getElementById('cvText');if(jd)jd.value=d.jd||'';if(cv)cv.value=d.cv||'';
    try{
      if(d.caseSnapshot&&typeof renderRequirements==='function'){
        renderRequirements(d.caseSnapshot);applyEdits(d.mappings);
        if(d.questions?.length&&typeof renderQuestions==='function')renderQuestions(d.questions);
      }
    }catch(e){console.warn('JD Mapper draft restore was partial.',e);}
    restoring=false;
    const status=document.getElementById('extractStatus');if(status&&hasWork()){status.className='status success';status.textContent='Your working draft was restored from this browser. Browser recovery expires after 6 hours.';}
  }
  function addDraftControls(){
    const extract=document.getElementById('extractBtn');if(!extract)return;
    const wrap=extract.parentElement;
    const clear=document.createElement('button');clear.type='button';clear.className='btn';clear.style.marginLeft='8px';clear.textContent='Start Over / Clear Draft';
    clear.addEventListener('click',()=>{if(!confirm('Clear the JD, CV and browser recovery draft and start over?'))return;clearDraft();location.reload();});wrap.appendChild(clear);
    const note=document.createElement('div');note.className='hint';note.style.marginTop='10px';note.innerHTML='<strong>Browser recovery:</strong> this device remembers your working draft for up to 6 hours. It is not a permanent ASCENT record. Use Clear Draft on a shared computer.';wrap.appendChild(note);
    const warning=document.querySelector('.hero .status.error');if(warning)warning.innerHTML='<strong>Your working draft is protected for 6 hours.</strong> This browser keeps a temporary recovery copy of your pasted JD, CV and current mapping edits. ASCENT still does not keep them as a permanent learner record. The server-side working case is removed after speaking practice is created or automatically within 6 hours. <strong>Download the PDF if you want a permanent copy.</strong>';
  }
  function installRestoreButtons(c){
    const originals=new Map((c?.mappings||[]).map(m=>[String(m.requirement_id),m]));
    document.querySelectorAll('.req').forEach(card=>{
      const m=originals.get(String(card.dataset.id));if(!m||!['S','T','N'].includes(m.rating))return;
      card.dataset.ascentSuggestion=m.rating;card.dataset.ascentEvidence=m.cv_evidence||'';
      let btn=card.querySelector('.restore-ascent-suggestion');
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='btn restore-ascent-suggestion';btn.style.marginTop='9px';btn.textContent='Restore ASCENT suggestion';const grid=card.querySelector('.map-grid');grid?.after(btn);}
      const refresh=()=>{const current=card.querySelector('input[type="radio"]:checked')?.value||'';btn.hidden=current===m.rating;};
      btn.addEventListener('click',()=>{const radio=card.querySelector(`input[type="radio"][value="${m.rating}"]`);if(!radio)return;radio.checked=true;const ta=card.querySelector('.evidence');if(ta){ta.disabled=m.rating==='N';ta.value=m.rating==='N'?'':(m.cv_evidence||'');}radio.dispatchEvent(new Event('change',{bubbles:true}));refresh();scheduleSave();});
      card.querySelectorAll('input[type="radio"]').forEach(r=>r.addEventListener('change',refresh));refresh();
    });
  }

  if(typeof renderRequirements==='function'){
    const originalRender=renderRequirements;
    renderRequirements=function(c){originalRender(c);installRestoreButtons(c);scheduleSave();};
  }
  if(typeof renderQuestions==='function'){
    const originalQuestions=renderQuestions;
    renderQuestions=function(qs){originalQuestions(qs);scheduleSave();};
  }
  if(typeof call==='function'){
    const originalCall=call;
    call=async function(action,extra={}){const result=await originalCall(action,extra);if(action==='CREATE_PRACTICE')clearDraft();return result;};
  }

  addDraftControls();
  document.addEventListener('input',e=>{if(e.target.matches('#jdText,#cvText,.evidence'))scheduleSave();});
  document.addEventListener('change',e=>{if(e.target.matches('.req input[type="radio"]'))scheduleSave();});
  document.getElementById('logout')?.addEventListener('click',clearDraft,{capture:true});
  window.addEventListener('beforeunload',e=>{if(!hasWork()||!readDraft())return;e.preventDefault();e.returnValue='';});
  restoreDraft();
})();