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

  function browserSpeak(text,role='coach'){
    return new Promise((resolve,reject)=>{
      const t=String(text||'').trim();
      if(!t){resolve();return;}
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t);
      const v=pickVoice(role);
      if(v){u.voice=v;u.lang=v.lang||'en-US';}else{u.lang='en-US';}
      u.rate=role==='coach'?0.88:0.93;
      u.pitch=1;
      u.volume=1;
      u.onend=()=>resolve();
      u.onerror=e=>reject(new Error(e?.error||'Browser audio could not play.'));
      window.speechSynthesis.speak(u);
    });
  }

  const originalSpeak=window.speak;
  if(typeof originalSpeak==='function'){
    window.speak=async function(text,role='coach'){
      try{return await originalSpeak(text,role);}catch(err){
        console.warn('PCL generated audio failed; using browser voice fallback.',err);
        return browserSpeak(text,role);
      }
    };
  }

  const originalDialogue=window.speakDialogue;
  if(typeof originalDialogue==='function'){
    window.speakDialogue=async function(turns){
      try{return await originalDialogue(turns);}catch(err){
        console.warn('PCL generated dialogue audio failed; using browser voice fallback.',err);
        for(const turn of Array.isArray(turns)?turns:[]){await browserSpeak(turn?.text,turn?.role||'coach');}
      }
    };
  }
})();
