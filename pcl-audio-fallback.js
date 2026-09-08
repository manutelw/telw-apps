(()=>{
  const SUPABASE_URL='https://kjxywlvgsweagrdydbef.supabase.co';
  const KEY='sb_publishable_hVL6AQ1GUGzizmiIZBWDlA_UTj5us9q';
  const API=SUPABASE_URL+'/functions/v1/pcl-pilot-1';
  const audioCache=new Map();
  const staticAudio=new Map();
  const player=document.getElementById('player');
  const path=location.pathname;

  const STATIC_11={
    "Present Perfect Simple. Use have or has plus the past participle. We use it for experience before now when the exact finished time is not important. When we say the experience is relevant now, we mean that the past experience tells the listener something useful about you now: what you can do, what you have handled before, or what experience you bring to the present situation. For example: I’ve handled client complaints before. That matters now if the listener is deciding whether you can handle a similar situation today.":'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/330290724a1b470fb63153f34d4c0183/id=7fad46dd-7f67-4be2-82d1-08c4911a3331.wav',
    "Use the Present Perfect to introduce experience, and the Simple Past for a specific finished event. Here is the important rule: do not use the Present Perfect with a finished past time. We do not say, We have been to the college last summer. We say, We went to the college last summer. We do not say, I have completed the project last week. We say, I completed the project last week. We do not say, She has joined the company in 2024. We say, She joined the company in 2024. We do not say, We have presented the report yesterday. We say, We presented the report yesterday.":'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/330290724a1b470fb63153f34d4c0183/id=b14a5adb-940b-4be1-a868-38d51df067cf.wav',
    "Use before when you want to reassure the listener that the situation is not new to you. For example: I’ve handled this kind of situation before.":'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/330290724a1b470fb63153f34d4c0183/id=ec788921-556b-41c9-94b1-3010c10dd88e.wav',
    "Today’s useful workplace expressions are: take responsibility, coordinate, contribute, outcome, and handle pressure. Use them only when they fit naturally.":'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/330290724a1b470fb63153f34d4c0183/id=6af26a0f-456e-4d7a-a66a-51d78f0ec234.wav'
  };
  const MODEL_11=[
    'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/88bb9ee1c81b466eb2a08fdde86d3619/id=e933ccbc-f63b-4b1c-a84f-f08feeffe755.wav',
    'https://resource2.heygen.ai/text_to_speech/c28fdc1f5f76450681d4551ceee48aa0/330290724a1b470fb63153f34d4c0183/id=76affc4a-4550-4e41-b9ca-9a6aee40a4c5.wav'
  ];

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function keyFor(text,role='coach'){return role+'|'+norm(text);}
  function b64Blob(b64,mime){const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime||'audio/mpeg'});}

  async function fetchAudio(text,role='coach'){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+KEY},body:JSON.stringify({action:'SPEAK',text,role})});
    const d=await r.json();
    if(!r.ok||!d.ok||!d.audio_base64)throw new Error(d.message||'PCL audio could not be prepared.');
    return b64Blob(d.audio_base64,d.audio_mime);
  }
  function preloadGenerated(text,role='coach'){const k=keyFor(text,role);if(!audioCache.has(k))audioCache.set(k,fetchAudio(text,role));return audioCache.get(k);}
  async function playBlob(blob){if(!player)throw new Error('Audio player is unavailable.');const u=URL.createObjectURL(blob);player.src=u;player.currentTime=0;try{await player.play();await new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio could not play.'));});}finally{URL.revokeObjectURL(u);}}

  function getStatic(url){
    if(!staticAudio.has(url)){
      const a=new Audio();a.preload='auto';a.src=url;a.load();staticAudio.set(url,a);
    }
    return staticAudio.get(url);
  }
  function preloadStatic11(){
    const pre=document.createElement('link');pre.rel='preconnect';pre.href='https://resource2.heygen.ai';pre.crossOrigin='anonymous';document.head.appendChild(pre);
    Object.values(STATIC_11).forEach(getStatic);MODEL_11.forEach(getStatic);
  }
  async function playStatic(url){
    const a=getStatic(url);a.pause();a.currentTime=0;await a.play();await new Promise((resolve,reject)=>{a.onended=resolve;a.onerror=()=>reject(new Error('Audio could not play.'));});
  }

  function browserSpeak(text,role='coach'){
    return new Promise((resolve,reject)=>{
      if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return reject(new Error('Audio is unavailable in this browser.'));
      const t=norm(text);if(!t){resolve();return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);const voices=speechSynthesis.getVoices()||[];const localEnglish=voices.filter(v=>v.localService===true&&/^en(-|$)/i.test(v.lang||'')&&!/Online/i.test(v.name||''));const preferred=role==='manager'?['Microsoft George','Microsoft David Desktop','Microsoft Mark Desktop']:role==='employee'?['Microsoft Hazel','Microsoft Zira Desktop','Microsoft Susan']:['Microsoft Hazel','Microsoft Zira Desktop','Microsoft Susan'];const v=preferred.map(n=>localEnglish.find(x=>x.name===n)).find(Boolean)||localEnglish[0]||null;if(v){u.voice=v;u.lang=v.lang||'en-GB';}else{u.lang='en-GB';}u.rate=role==='coach'?0.88:0.93;u.pitch=1;u.volume=1;u.onend=resolve;u.onerror=()=>reject(new Error('Audio could not play.'));speechSynthesis.speak(u);
    });
  }
  async function playGeneratedFallback(text,role='coach'){try{await browserSpeak(text,role);}catch(e){const blob=await preloadGenerated(text,role);await playBlob(blob);}}

  function modelTurns(){const manager=document.querySelector('.card.wide .turn.mgr')?.textContent?.replace(/^Manager:\s*/i,'').trim()||'';const learner=document.querySelector('.card.wide .turn.learner')?.textContent?.replace(/^Learner:\s*/i,'').trim()||'';return [{role:'manager',text:manager},{role:'employee',text:learner}].filter(x=>x.text);}

  function startPreload(){
    if(path.endsWith('/module-1-1.html')){preloadStatic11();return;}
    if('speechSynthesis' in window)speechSynthesis.getVoices();
    document.querySelectorAll('[data-speak]').forEach(b=>preloadGenerated(b.dataset.speak,'coach').catch(()=>{}));
    modelTurns().forEach(t=>preloadGenerated(t.text,t.role).catch(()=>{}));
  }

  function bindLessonAudio(){
    document.querySelectorAll('[data-speak]').forEach(b=>{
      b.onclick=async()=>{
        const old=b.textContent;b.disabled=true;b.textContent='Playing…';
        try{
          if(path.endsWith('/module-1-1.html')&&STATIC_11[norm(b.dataset.speak)])await playStatic(STATIC_11[norm(b.dataset.speak)]);
          else await playGeneratedFallback(b.dataset.speak,'coach');
        }catch(e){const s=document.getElementById('learnStatus');if(s){s.textContent=e.message;s.className='status error';}}
        finally{b.disabled=false;b.textContent=old;}
      };
    });
    const model=document.getElementById('modelAudio');
    if(model){
      model.onclick=async()=>{
        const old=model.textContent;model.disabled=true;model.textContent='Playing…';
        try{
          if(path.endsWith('/module-1-1.html')){for(const url of MODEL_11)await playStatic(url);}
          else{for(const t of modelTurns())await playGeneratedFallback(t.text,t.role);}
        }catch(e){const s=document.getElementById('learnStatus');if(s){s.textContent=e.message;s.className='status error';}}
        finally{model.disabled=false;model.textContent=old;}
      };
    }
  }

  function init(){bindLessonAudio();startPreload();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
