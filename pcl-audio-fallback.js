(()=>{
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)) return;

  function pickVoice(role){
    const voices=window.speechSynthesis.getVoices()||[];
    const english=voices.filter(v=>/^en(-|$)/i.test(v.lang||''));
    if(!english.length) return null;
    const preferred=role==='manager'
      ? ['Microsoft Guy Online (Natural) - English (United States)','Microsoft Ryan Online (Natural) - English (United Kingdom)','Google UK English Male','Google US English']
      : role==='employee'
      ? ['Microsoft Sonia Online (Natural) - English (United Kingdom)','Microsoft Jenny Online (Natural) - English (United States)','Google UK English Female','Google US English']
      : ['Microsoft Sonia Online (Natural) - English (United Kingdom)','Microsoft Aria Online (Natural) - English (United States)','Google UK English Female','Google US English'];
    for(const name of preferred){const v=english.find(x=>x.name===name);if(v)return v;}
    return english.find(v=>/Natural|Google/i.test(v.name))||english[0];
  }

  function utter(text,role='coach'){
    const t=String(text||'').replace(/\s+/g,' ').trim();
    if(!t) return null;
    const u=new SpeechSynthesisUtterance(t);
    const v=pickVoice(role);
    if(v){u.voice=v;u.lang=v.lang||'en-US';}else{u.lang='en-US';}
    u.rate=role==='coach'?0.88:0.93;
    u.pitch=1;
    u.volume=1;
    return u;
  }

  function browserSpeak(text,role='coach'){
    return new Promise((resolve,reject)=>{
      const u=utter(text,role);
      if(!u){resolve();return;}
      window.speechSynthesis.cancel();
      u.onend=()=>resolve();
      u.onerror=e=>reject(new Error(e?.error||'Browser audio could not play.'));
      window.speechSynthesis.speak(u);
    });
  }

  function browserSequence(turns){
    window.speechSynthesis.cancel();
    const list=(Array.isArray(turns)?turns:[]).map(t=>utter(t?.text,t?.role||'coach')).filter(Boolean);
    if(!list.length) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      list.forEach((u,i)=>{
        if(i===list.length-1)u.onend=resolve;
        u.onerror=e=>reject(new Error(e?.error||'Browser audio could not play.'));
        window.speechSynthesis.speak(u);
      });
    });
  }

  function bindLessonAudio(){
    document.querySelectorAll('[data-speak]').forEach(b=>{
      b.onclick=()=>{
        const old=b.textContent;
        b.disabled=true;
        b.textContent='Playing…';
        browserSpeak(b.dataset.speak,'coach').catch(e=>{
          const s=document.getElementById('learnStatus');
          if(s){s.textContent=e.message;s.className='status error';}
        }).finally(()=>{b.disabled=false;b.textContent=old;});
      };
    });

    const model=document.getElementById('modelAudio');
    if(model){
      model.onclick=()=>{
        const old=model.textContent;
        model.disabled=true;
        model.textContent='Playing…';
        const manager=document.querySelector('.card.wide .turn.mgr')?.textContent?.replace(/^Manager:\s*/i,'')||'';
        const learner=document.querySelector('.card.wide .turn.learner')?.textContent?.replace(/^Learner:\s*/i,'')||'';
        browserSequence([{role:'manager',text:manager},{role:'employee',text:learner}]).catch(e=>{
          const s=document.getElementById('learnStatus');
          if(s){s.textContent=e.message;s.className='status error';}
        }).finally(()=>{model.disabled=false;model.textContent=old;});
      };
    }
  }

  // Keep generated manager audio usable elsewhere, with browser speech as fallback.
  const originalSpeak=window.speak;
  if(typeof originalSpeak==='function'){
    window.speak=async function(text,role='coach'){
      try{return await originalSpeak(text,role);}catch(err){return browserSpeak(text,role);}
    };
  }
  const originalDialogue=window.speakDialogue;
  if(typeof originalDialogue==='function'){
    window.speakDialogue=async function(turns){
      try{return await originalDialogue(turns);}catch(err){return browserSequence(turns);}
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindLessonAudio,{once:true});
  else bindLessonAudio();
})();
