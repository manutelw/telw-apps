// ORACY Unit 1 direct audio controls. Audio-only layer: no lesson/scoring/access changes.
(function(){
  const EDGE='/oracy/session';
  const UNIT_NO=1;
  const PASSAGE_STYLE='Sound natural, lively and warm. Use clear learner-friendly pacing, expressive sentence stress, natural rises and falls, and genuine conversational enthusiasm. In dialogue, react to the other speaker. Do not sound formal or robotic.';
  const TEACHER_STYLE='Speak as a warm, cheerful female English teacher. Keep it short, clear and encouraging. Use gentle lively intonation. Never sound formal or robotic.';
  const PRON_STYLE='Speak clearly and naturally for an English pronunciation exercise. Give the target word or phrase only. Use a crisp contrast between /w/ and /v/. Do not add explanations.';
  const pron={q11:'visit',q12:'weekend',q13:'west. vest.',q14:'We visit every weekend.'};
  const cache=new Map();
  let ctx=null,current=[];

  function getCtx(){
    if(ctx)return ctx;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)throw new Error('Audio is not supported in this browser.');
    ctx=new Ctx();return ctx;
  }
  async function unlock(){const c=getCtx();if(c.state!=='running')await c.resume();return c;}
  function stop(){for(const s of current){try{s.stop();}catch{}}current=[];}
  async function tts(text,voice,instructions,key){
    const ck=key||`${voice}|${instructions}|${text}`;
    if(cache.has(ck))return cache.get(ck);
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice,instructions,unit_no:UNIT_NO,passage_id:key||''})});
    if(!res.ok){let d='';try{d=(await res.text()).slice(0,220)}catch{}throw new Error(`Audio failed (HTTP ${res.status})${d?': '+d:''}`);}
    const buf=await (await unlock()).decodeAudioData(await (await res.blob()).arrayBuffer());
    cache.set(ck,buf);return buf;
  }
  async function playBuffers(buffers,gap=.08){
    const c=await unlock();stop();
    let when=c.currentTime+.03;const srcs=[];
    await new Promise(resolve=>{
      if(!buffers.length){resolve();return;}
      buffers.forEach((b,i)=>{const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);srcs.push(s);s.start(when);when+=b.duration+gap;if(i===buffers.length-1)s.onended=resolve;});
      current=srcs;
    });
    current=[];
  }
  function passageSegments(button){
    const id=button.dataset.id;
    try{if(typeof passages!=='undefined'&&passages[id])return passages[id];}catch{}
    const box=button.parentElement;const p=box?.querySelector('.passage');if(!p)return [];
    if(id==='kp1')return [...p.querySelectorAll('p')].map((el,i)=>{const raw=el.textContent.trim();const pos=raw.indexOf(':');return {voice:i%2?'cedar':'marin',text:pos>=0?raw.slice(pos+1).trim():raw};});
    return [{voice:id==='kp2'?'cedar':'marin',text:p.textContent.trim()}];
  }
  async function handlePassage(button){
    const old=button.textContent;const note=button.parentElement?.querySelector('.audio-note');
    try{
      await unlock();button.disabled=true;button.textContent='Preparing audio…';if(note)note.textContent='';
      const id=button.dataset.id;const segs=passageSegments(button);
      const buffers=await Promise.all(segs.map((s,i)=>tts(s.text,s.voice||'marin',PASSAGE_STYLE,`b1-u1-${id}-${i}-${s.voice||'marin'}-expanded-v4`)));
      button.textContent=id==='kp1'?'Playing conversation…':'Playing passage…';
      await playBuffers(buffers,id==='kp1'?.08:.03);if(note)note.textContent='Ready.';
    }catch(e){if(note)note.textContent=e?.message||'Audio could not be played.';}
    finally{button.disabled=false;button.textContent=old;}
  }
  function questionText(button){
    const box=button.closest('.oral-long-answer,.activity');
    const bold=box?.querySelector('p b');
    return bold?.textContent?.trim()||box?.querySelector('p')?.textContent?.trim()||'';
  }
  async function handleHearQuestion(button){
    const old=button.textContent;
    try{await unlock();button.disabled=true;button.textContent='Preparing…';const text=questionText(button);const box=button.closest('[data-oral-id]');const id=box?.dataset.oralId||'question';const b=await tts(text,'marin',TEACHER_STYLE,`b1a-u1-oral-${id}-question`);button.textContent='Playing…';await playBuffers([b],.02);}catch(e){const box=button.closest('.oral-long-answer,.activity');const s=box?.querySelector('.oral-status,.audio-note');if(s)s.textContent=e?.message||'Audio could not be played.';}finally{button.disabled=false;button.textContent=old;}
  }
  async function handlePron(button){
    const old=button.textContent;
    try{await unlock();button.disabled=true;button.textContent='Preparing…';const box=button.closest('.activity');const check=box?.querySelector('.check[data-question]');const id=check?.dataset.question||'';const text=pron[id];if(!text)throw new Error('Pronunciation audio is not available.');const b=await tts(text,'marin',PRON_STYLE,`b1a-u1-oral-${id}-target`);button.textContent='Playing…';await playBuffers([b],.02);}catch(e){const out=button.closest('.activity')?.querySelector('.answer');if(out){out.className='answer bad';out.textContent=e?.message||'Audio could not be played.';}}finally{button.disabled=false;button.textContent=old;}
  }

  // Resume Web Audio on real gestures, but do not alter native media APIs or non-audio controls.
  document.addEventListener('pointerdown',e=>{if(e.target.closest('.audio,.hear-oral-question,.hear-pron-target,.oracy-hear-feedback'))unlock().catch(()=>{});},{capture:true,passive:true});
  document.addEventListener('click',e=>{
    const b=e.target.closest('.audio,.hear-oral-question,.hear-pron-target');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(b.classList.contains('audio'))handlePassage(b);
    else if(b.classList.contains('hear-pron-target'))handlePron(b);
    else handleHearQuestion(b);
  },true);
})();
