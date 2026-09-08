(()=>{
  const SUPABASE_URL='https://kjxywlvgsweagrdydbef.supabase.co';
  const KEY='sb_publishable_hVL6AQ1GUGzizmiIZBWDlA_UTj5us9q';
  const API=SUPABASE_URL+'/functions/v1/pcl-pilot-1';
  const audioCache=new Map();
  const player=document.getElementById('player');

  function keyFor(text,role='coach'){
    return role+'|'+String(text||'').replace(/\s+/g,' ').trim();
  }

  function b64Blob(b64,mime){
    const bin=atob(b64),a=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
    return new Blob([a],{type:mime||'audio/mpeg'});
  }

  async function fetchAudio(text,role='coach'){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},body:JSON.stringify({action:'SPEAK',text,role})});
    const d=await r.json();
    if(!r.ok||!d.ok||!d.audio_base64)throw new Error(d.message||'PCL audio could not be prepared.');
    return b64Blob(d.audio_base64,d.audio_mime);
  }

  function preload(text,role='coach'){
    const k=keyFor(text,role);
    if(!audioCache.has(k))audioCache.set(k,fetchAudio(text,role));
    return audioCache.get(k);
  }

  async function playBlob(blob){
    if(!player)throw new Error('Audio player is unavailable.');
    const u=URL.createObjectURL(blob);
    player.src=u;
    player.currentTime=0;
    try{
      await player.play();
      await new Promise((resolve,reject)=>{
        player.onended=resolve;
        player.onerror=()=>reject(new Error('Audio could not play.'));
      });
    } finally {
      URL.revokeObjectURL(u);
    }
  }

  function browserSpeak(text,role='coach'){
    return new Promise((resolve,reject)=>{
      if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return reject(new Error('Audio is unavailable in this browser.'));
      const t=String(text||'').replace(/\s+/g,' ').trim();
      if(!t){resolve();return;}
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t);
      const voices=speechSynthesis.getVoices()||[];
      const english=voices.filter(v=>/^en(-|$)/i.test(v.lang||''));
      const preferred=role==='manager'?['Microsoft Ryan Online (Natural) - English (United Kingdom)','Microsoft Guy Online (Natural) - English (United States)','Google UK English Male']:role==='employee'?['Microsoft Sonia Online (Natural) - English (United Kingdom)','Microsoft Jenny Online (Natural) - English (United States)','Google UK English Female']:['Microsoft Sonia Online (Natural) - English (United Kingdom)','Microsoft Aria Online (Natural) - English (United States)','Google UK English Female'];
      const v=preferred.map(n=>english.find(x=>x.name===n)).find(Boolean)||english.find(x=>/Natural|Google/i.test(x.name))||english[0];
      if(v){u.voice=v;u.lang=v.lang||'en-GB';}else u.lang='en-GB';
      u.rate=role==='coach'?0.88:0.93;u.pitch=1;u.volume=1;u.onend=resolve;u.onerror=()=>reject(new Error('Audio could not play.'));speechSynthesis.speak(u);
    });
  }

  async function playPreloaded(text,role='coach'){
    try{
      await browserSpeak(text,role);
    }catch(e){
      const blob=await preload(text,role);
      await playBlob(blob);
    }
  }

  function modelTurns(){
    const manager=document.querySelector('.card.wide .turn.mgr')?.textContent?.replace(/^Manager:\s*/i,'').trim()||'';
    const learner=document.querySelector('.card.wide .turn.learner')?.textContent?.replace(/^Learner:\s*/i,'').trim()||'';
    return [{role:'manager',text:manager},{role:'employee',text:learner}].filter(x=>x.text);
  }

  function startPreload(){
    if('speechSynthesis' in window)speechSynthesis.getVoices();
    document.querySelectorAll('[data-speak]').forEach(b=>preload(b.dataset.speak,'coach').catch(()=>{}));
    modelTurns().forEach(t=>preload(t.text,t.role).catch(()=>{}));
  }

  function bindLessonAudio(){
    document.querySelectorAll('[data-speak]').forEach(b=>{
      b.onclick=async()=>{
        const old=b.textContent;b.disabled=true;b.textContent='Playing…';
        try{await playPreloaded(b.dataset.speak,'coach');}
        catch(e){const s=document.getElementById('learnStatus');if(s){s.textContent=e.message;s.className='status error';}}
        finally{b.disabled=false;b.textContent=old;}
      };
    });

    const model=document.getElementById('modelAudio');
    if(model){
      model.onclick=async()=>{
        const old=model.textContent;model.disabled=true;model.textContent='Playing…';
        try{for(const t of modelTurns())await playPreloaded(t.text,t.role);}
        catch(e){const s=document.getElementById('learnStatus');if(s){s.textContent=e.message;s.className='status error';}}
        finally{model.disabled=false;model.textContent=old;}
      };
    }
  }

  function init(){bindLessonAudio();startPreload();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
