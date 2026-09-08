// ORACY Unit 1 feedback overlay: turn rubric comments into concrete practice and keep spoken teacher feedback reliable.
(function(){
  // Audio reliability layer. It only changes playback; lesson content, scoring and controls stay untouched.
  if(!window.ORACY_AUDIO){
    let ctx=null,currentSource=null;
    const nativePlay=HTMLMediaElement.prototype.play;
    function getContext(){
      if(ctx)return ctx;
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)return null;
      ctx=new Ctx();return ctx;
    }
    function unlock(){
      const c=getContext();
      if(!c)return Promise.resolve(false);
      if(c.state==='running')return Promise.resolve(true);
      return c.resume().then(()=>c.state==='running').catch(()=>false);
    }
    function stopSource(){if(currentSource){try{currentSource.stop();}catch{} currentSource=null;}}
    async function playUrl(url){
      stopSource();
      const c=getContext();
      if(!c)throw new Error('Audio is not supported in this browser.');
      await unlock();
      if(c.state!=='running')throw new Error('Tap the audio button once more to start sound.');
      const res=await fetch(url);if(!res.ok)throw new Error('Audio could not be loaded.');
      const buffer=await c.decodeAudioData(await res.arrayBuffer());
      return await new Promise((resolve,reject)=>{
        try{
          const source=c.createBufferSource();source.buffer=buffer;source.connect(c.destination);currentSource=source;
          source.onended=()=>{if(currentSource===source)currentSource=null;resolve();};source.start();
        }catch(e){reject(e);}
      });
    }
    window.ORACY_AUDIO={getContext,unlock,playUrl};

    // Prime sound at the first real learner gesture, before async TTS fetching finishes.
    const prime=()=>{
      unlock();
      try{
        if(typeof audioContext!=='undefined'){
          if(!audioContext)audioContext=getContext();
          if(audioContext?.state!=='running')audioContext?.resume?.().catch(()=>{});
        }
      }catch{}
    };
    document.addEventListener('pointerdown',prime,{capture:true,passive:true});
    document.addEventListener('touchstart',prime,{capture:true,passive:true});
    document.addEventListener('keydown',prime,{capture:true});

    // Keep native media playback when it works. If the browser blocks it after an async fetch,
    // fall back to the already-unlocked Web Audio path and still fire the normal ended event.
    HTMLMediaElement.prototype.play=function(){
      let p;
      try{p=nativePlay.call(this);}catch(e){p=Promise.reject(e);}
      if(!p||typeof p.catch!=='function')return p;
      const el=this;
      return p.catch(async err=>{
        if(!el.src)throw err;
        try{
          await playUrl(el.src);
          el.dispatchEvent(new Event('ended'));
          return;
        }catch{throw err;}
      });
    };
  }

  function score(item){const n=Number(item?.score||0);return n>=1&&n<=3?n:0;}
  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function suggestions(rubric,rule){
    const raw=Array.isArray(rubric?.suggested_vocabulary)?rubric.suggested_vocabulary:[];
    const allowed=new Set([...ORACY_CORE_VOCAB,...rule.markers]);
    const hit=raw.filter(v=>allowed.has(String(v?.item||'').toLowerCase())&&String(v?.example||'').trim()).slice(0,5);
    if(hit.length)return hit;
    return [
      {item:'at least',example:'I practise English at least once every day.'},
      {item:'native language',example:'Hindi is my native language.'},
      {item:'by the way',example:'By the way, I use English at work too.'},
      {item:'anyway',example:'Anyway, I want to keep improving my English.'}
    ];
  }
  function exAt(list,i,fallback){return String(list[i]?.example||fallback).trim();}
  function itemAt(list,i,fallback){return String(list[i]?.item||fallback).trim();}
  function markerExample(rule){return rule.type==='dialogue'?'Exactly! English really helps me when I travel.':'By the way, I use English with my students too.';}
  function practiceBlock(example,ownPrompt){return `<div style="margin-top:6px;padding:8px 10px;border-left:3px solid #d59a19;background:#fffaf0"><b>Try this first:</b> “${esc(example)}”<br><b>Then you:</b> ${esc(ownPrompt)}</div>`;}

  oracyFriendlyRubric=function(rubric,rule,usedMarkers){
    const task=score(rubric?.task_achievement),range=score(rubric?.range),accuracy=score(rubric?.accuracy),fluency=score(rubric?.fluency),coherence=score(rubric?.coherence);
    const list=suggestions(rubric,rule);
    const ex1=exAt(list,0,'I use English for talking to my students.');
    const ex2=exAt(list,1,'I practise English at least once every day.');
    const ex3=exAt(list,2,'Anyway, I want to keep improving my English.');
    const item2=itemAt(list,1,'at least');
    const marker=markerExample(rule);
    const markerNames=usedMarkers.map(m=>ORACY_MARKER_LABELS[m]).join(', ');
    const taskText=task===3?'You covered the task well. Let’s stretch it with one more vivid detail.':task===2?'You answered the question. Good. Now make the answer easier to picture.':'You have the start of an answer. Now give me one clear point and one real detail.';
    const rangeText=range===3?'You used a good mix of words. Now make one of the Unit 1 expressions truly yours.':'Your meaning is clear. Let’s add one of the new expressions instead of repeating familiar words.';
    const accuracyText=accuracy===3?'Your sentences are working well. Keep the same clean shape when you add a new idea.':'Keep the sentence short and complete. Copy the pattern once, then make your own.';
    const fluencyText=fluency===3?'Your answer moves well. Now keep two ideas flowing together without stopping between every word.':'Build the answer in little chunks: idea + detail, then the next idea.';
    const coherenceText=coherence===3?'Your ideas are easy to follow. Keep using signposts only where they sound natural.':'Give the listener a signpost before you move to the next idea.';
    return [
      `<div><b>Your level today</b><br>${esc(oracyWarmLevelText(rubric?.cefr_estimate))}</div>`,
      `<div><b>Did you answer the task? ${task||'–'}/3</b><br>${esc(taskText)}${practiceBlock(ex1,'Now add one different detail from your own life — where, when, who with, or why.')}</div>`,
      `<div><b>Your words and expressions ${range||'–'}/3</b><br>${esc(rangeText)}${practiceBlock(ex2,`Now make a new sentence of your own using “${item2}”.`)}</div>`,
      `<div><b>Your sentences ${accuracy||'–'}/3</b><br>${esc(accuracyText)}${practiceBlock('I use English for reading messages.','Now make one sentence with the same pattern: “I use English for …ing”.')}</div>`,
      `<div><b>Your flow ${fluency||'–'}/3</b><br>${esc(fluencyText)}${practiceBlock(`${ex1} ${ex3}`,'Say both sentences together. Then add a third short sentence of your own without rushing.')}</div>`,
      `<div><b>Easy to follow? ${coherence||'–'}/3</b><br>${esc(coherenceText)}${practiceBlock(marker,rule.type==='dialogue'?'Now reply with a different reaction marker and add your own idea.':'Now use “Anyway” or “By the way” once in a new sentence of your own.')}</div>`,
      `<div><b>Pronunciation</b><br>Keep practising the /w/–/v/ work in this unit. Pronunciation should be judged from audio, not guessed from a transcript.</div>`,
      markerNames?`<div><b>Nice language choice</b><br>You used: ${esc(markerNames)}.</div>`:''
    ].filter(Boolean).join('<div style="height:10px"></div>');
  };

  oracyTeacherVoiceText=function(rubric,rule,passed,used){
    const list=suggestions(rubric,rule);
    const example=exAt(list,0,'I use English for talking to my students.');
    const task=score(rubric?.task_achievement);
    const opening=task>=3?'Lovely. You covered the task well. ':task===2?'Good — you answered the question. Now let’s make it more vivid. ':'You have a good start. Let’s build it one clear step at a time. ';
    const usedText=used.length?`I liked hearing ${used.map(m=>ORACY_MARKER_LABELS[m]).join(' and ')} in your answer. `:'';
    const markerText=passed?'Your speaking marker worked naturally. ':`On the next recording, remember to use ${rule.min===1?'one':'two'} suitable speaking marker${rule.min===1?'':'s'}. `;
    return `${opening}${usedText}Here is one sentence to copy first: ${example} Say that once. Good. Now give me another sentence of your own with a similar kind of detail. ${markerText}Keep it short and natural. I’d love to hear your next version.`;
  };

  oracySpeakTeacherFeedback=async function(box,text){
    const feedback=box.querySelector('.feedback');
    if(!feedback)return;
    let replay=feedback.querySelector('.oracy-hear-feedback');
    if(!replay){
      replay=document.createElement('button');
      replay.type='button';replay.className='oracy-hear-feedback';replay.textContent='🔊 Hear teacher feedback';replay.style.marginTop='10px';feedback.appendChild(replay);
    }
    replay.disabled=true;replay.textContent='🔊 Preparing teacher feedback…';
    try{
      const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'marin',instructions:'Speak as a warm, caring female English teacher. Sound soothing, cheerful and encouraging. Use lively but gentle intonation. Give the example sentence clearly, then invite the learner to make one of their own. Never sound formal, clinical or robotic.',unit_no:UNIT_NO})});
      if(!res.ok)throw new Error('Audio unavailable');
      const blob=await res.blob();
      if(box._oracyFeedbackUrl)URL.revokeObjectURL(box._oracyFeedbackUrl);
      const url=URL.createObjectURL(blob);box._oracyFeedbackUrl=url;
      replay.disabled=false;replay.textContent='🔊 Hear teacher feedback again';
      replay.onclick=()=>new Audio(url).play().catch(()=>{});
      new Audio(url).play().catch(()=>{});
    }catch{
      replay.disabled=false;replay.textContent='🔊 Try teacher feedback audio again';
      replay.onclick=()=>oracySpeakTeacherFeedback(box,text);
    }
  };
})();
