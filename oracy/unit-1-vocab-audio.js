// ORACY Unit 1 vocabulary model-conversation audio.
// Isolated from recorder/scoring logic. Uses existing ORACY TTS endpoint + persistent passage cache.
const ORACY_VOCAB_AUDIO_STYLE='Sound like a natural adult conversation between two friendly people. Keep B1-friendly pacing, clear sentence stress, warm reactions, and natural conversational rhythm. Do not sound like a textbook reading.';
const ORACY_VOCAB_AUDIO_CACHE=new Map();
let ORACY_VOCAB_AUDIO_CTX=null;
let ORACY_VOCAB_AUDIO_SOURCES=[];
function oracyVocabAudioKey(kp,vi,si){return `b1a-u1-vocab-model-v1-${kp}-${vi}-${si}`;}
function oracyVocabAudioSpeaker(line,index){const isA=/^A:/.test(line);return {voice:isA?'marin':'cedar',text:String(line||'').replace(/^[AB]:\s*/,''),speaker:isA?'A':'B',index};}
async function oracyFetchVocabAudio(kp,vi,si,line){
  const key=oracyVocabAudioKey(kp,vi,si);
  if(ORACY_VOCAB_AUDIO_CACHE.has(key))return ORACY_VOCAB_AUDIO_CACHE.get(key);
  const seg=oracyVocabAudioSpeaker(line,si);
  const promise=(async()=>{
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text:seg.text,voice:seg.voice,instructions:ORACY_VOCAB_AUDIO_STYLE,unit_no:UNIT_NO,passage_id:key})});
    if(!res.ok)throw new Error(await responseError(res,'Model audio'));
    return await res.blob();
  })();
  ORACY_VOCAB_AUDIO_CACHE.set(key,promise);
  try{return await promise;}catch(e){ORACY_VOCAB_AUDIO_CACHE.delete(key);throw e;}
}
async function oracyPrepareVocabModel(kp,vi){
  const item=ORACY_VOCAB_DRILLS?.[kp]?.items?.[vi];
  if(!item?.model?.length)return [];
  return Promise.all(item.model.map((line,si)=>oracyFetchVocabAudio(kp,vi,si,line)));
}
function oracyStopVocabModel(){ORACY_VOCAB_AUDIO_SOURCES.forEach(s=>{try{s.stop();}catch{}});ORACY_VOCAB_AUDIO_SOURCES=[];}
async function oracyPlayVocabModel(kp,vi,btn,status){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx){status.textContent='Model audio is not supported in this browser.';return;}
  if(!ORACY_VOCAB_AUDIO_CTX)ORACY_VOCAB_AUDIO_CTX=new Ctx();
  // Resume inside the click gesture so the first click remains authorised even if audio is still preparing.
  await ORACY_VOCAB_AUDIO_CTX.resume();
  oracyStopVocabModel();
  const old=btn.textContent;btn.disabled=true;btn.textContent='🔊 Preparing model audio…';status.textContent='Preparing model conversation…';
  try{
    const blobs=await oracyPrepareVocabModel(kp,vi);
    const buffers=await Promise.all(blobs.map(b=>b.arrayBuffer().then(x=>ORACY_VOCAB_AUDIO_CTX.decodeAudioData(x))));
    let when=ORACY_VOCAB_AUDIO_CTX.currentTime+.06;
    buffers.forEach((buffer,i)=>{
      const source=ORACY_VOCAB_AUDIO_CTX.createBufferSource();source.buffer=buffer;source.connect(ORACY_VOCAB_AUDIO_CTX.destination);source.start(when);ORACY_VOCAB_AUDIO_SOURCES.push(source);
      when+=buffer.duration+(i<buffers.length-1?.16:0);
    });
    status.textContent='Playing model conversation.';
    const ms=Math.max(300,(when-ORACY_VOCAB_AUDIO_CTX.currentTime)*1000);
    setTimeout(()=>{if(status.textContent==='Playing model conversation.')status.textContent='Model conversation ready to replay.';},ms);
  }catch(e){status.textContent=(e.message||'Model audio could not be prepared.')+' Try again.';}
  finally{btn.disabled=false;btn.textContent=old;}
}
function oracyAttachVocabAudio(){
  const boxes=[...document.querySelectorAll('.oracy-vocab-drill')];
  boxes.forEach(box=>{
    if(box.querySelector('.oracy-vocab-model-audio'))return;
    const kp=Number(box.dataset.kpIndex||0),vi=Number(box.dataset.vocabIndex||0);
    const model=box.querySelector('div[style*="background:#f8f6ef"]')||box.querySelector('h3')?.nextElementSibling;
    if(!model)return;
    const wrap=document.createElement('div');wrap.className='oracy-vocab-model-audio';wrap.style.marginTop='9px';
    const btn=document.createElement('button');btn.type='button';btn.className='oracy-model-listen';btn.textContent='🔊 Listen to model conversation';
    const status=document.createElement('div');status.className='oracy-model-audio-status';status.style.cssText='margin-top:5px;font-size:.9rem';status.textContent='Audio prepares automatically as this drill comes into view.';
    btn.addEventListener('click',()=>oracyPlayVocabModel(kp,vi,btn,status));wrap.append(btn,status);model.appendChild(wrap);
  });
  const observer=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const box=entry.target;const kp=Number(box.dataset.kpIndex||0),vi=Number(box.dataset.vocabIndex||0);oracyPrepareVocabModel(kp,vi).catch(()=>{});observer.unobserve(box);});},{rootMargin:'700px 0px'}):null;
  if(observer)boxes.forEach(box=>observer.observe(box));
  else boxes.slice(0,3).forEach(box=>oracyPrepareVocabModel(Number(box.dataset.kpIndex||0),Number(box.dataset.vocabIndex||0)).catch(()=>{}));
}
oracyAttachVocabAudio();
