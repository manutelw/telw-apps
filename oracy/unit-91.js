const EDGE='/oracy/session';
const UNIT_NO=91;
const UNIT_LABEL='TELW B1A New Unit 2 · Background';
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation in clear UK-leaning international English. Keep the pace B1-friendly but natural. Use warm spontaneous reactions, natural pauses and clear sentence stress. Do not sound like a textbook recording.';
const audioCache=new Map();let playToken=0;

function safe(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function segmentsFor(id){
  const p=document.querySelector(`.passage[data-audio-id="${id}"]`);
  if(!p)return[];
  return Array.from(p.querySelectorAll('p')).map((x,i)=>({voice:i%2?'cedar':'marin',text:x.textContent.replace(/\s+/g,' ').trim()})).filter(x=>x.text);
}
async function getAudio(id,index,segment){
  const key=`b1anew-91-${id}-${index}-${segment.voice}-redraft1`;
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:UNIT_NO,passage_id:key})});
  if(!res.ok){const e=new Error('Secure audio is unavailable.');e.status=res.status;throw e;}
  const blob=await res.blob(),url=URL.createObjectURL(blob);audioCache.set(key,url);return url;
}
function waitForAudio(){return new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed.'));});}
function speakWithDeviceVoice(segments,token){
  return new Promise((resolve,reject)=>{
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){reject(new Error('Audio could not be played.'));return;}
    let i=0;
    const next=()=>{
      if(token!==playToken){window.speechSynthesis.cancel();resolve();return;}
      if(i>=segments.length){resolve();return;}
      const u=new SpeechSynthesisUtterance(segments[i++].text);u.lang='en-GB';u.rate=.9;u.pitch=1;u.onend=next;u.onerror=()=>reject(new Error('Audio could not be played.'));window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.cancel();next();
  });
}

document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',async()=>{
  const id=btn.dataset.id,status=btn.nextElementSibling,token=++playToken,segments=segmentsFor(id);
  if(!segments.length){status.textContent='No audio text found.';return;}
  try{
    btn.disabled=true;status.textContent='Preparing audio…';
    for(let i=0;i<segments.length;i++){
      if(token!==playToken)return;
      player.src=await getAudio(id,i,segments[i]);
      await player.play();await waitForAudio();
    }
    status.textContent='Finished. Listen again if you want to notice the language.';
  }catch{
    try{
      status.textContent='Playing with your device voice…';
      await speakWithDeviceVoice(segments,token);
      status.textContent='Finished. Listen again if you want to notice the language.';
    }catch{status.textContent='Audio could not be played on this device.';}
  }finally{btn.disabled=false;}
}));

let recorder=null,stream=null,chunks=[],activeBtn=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',async()=>{
  const box=btn.closest('.speak'),status=box.querySelector('.status');
  if(recorder&&activeBtn===btn){recorder.stop();return;}
  if(recorder){status.textContent='Finish the current recording first.';return;}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];activeBtn=btn;recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
    recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording… ORACY does not save this recording.';
  }catch{status.textContent='Please allow microphone access.';recorder=null;activeBtn=null;}
}));

async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent=btn.textContent.includes('debate')?'🎤 Record debate':btn.textContent.includes('presentation')?'🎤 Record presentation':'🎤 Record';
  btn.classList.remove('live');status.textContent='Getting feedback… This recording is used for feedback only.';
  const coaching=`${prompt}\nThis is ORACY B1A New Unit 2: Background. Evaluate mainly on B1 spoken effectiveness: task completion, clarity, correct use of the unit language, connected ideas and natural delivery. Give concise feedback with: What worked; One next fix; A stronger example using the learner's own idea.`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(UNIT_NO));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. Keep the answer connected and natural.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;status.textContent='Feedback complete. ORACY has not saved your recording.';
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';status.textContent='The recording was not saved. You can try again.';}
}

window.addEventListener('beforeunload',()=>{
  try{stream?.getTracks().forEach(t=>t.stop());window.speechSynthesis?.cancel();}catch{}
  chunks=[];recorder=null;activeBtn=null;
  for(const url of audioCache.values())try{URL.revokeObjectURL(url)}catch{}
  audioCache.clear();
});