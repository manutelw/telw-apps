const EDGE='/oracy/session';
const UNIT_NO=91;
const UNIT_LABEL='TELW B1A New Unit 2 · Background';
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation in clear UK-leaning international English. Keep the pace B1-friendly but natural. Use warm spontaneous reactions, natural pauses and clear sentence stress. Do not sound like a textbook recording.';
const audioCache=new Map();let playToken=0;

function safe(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));}
function segmentsFor(id){
  const p=document.querySelector(`.passage[data-audio-id="${id}"]`);
  if(!p)return[];
  return Array.from(p.querySelectorAll('p')).map((x,i)=>({voice:i%2?'cedar':'marin',text:x.textContent.replace(/\s+/g,' ').trim().replace(/^Blank\b/i,'Dash')})).filter(x=>x.text);
}
async function getAudio(id,index,segment){
  const key=`b1anew-91-${id}-${index}-${segment.voice}-redraft3`;
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
  if(!segments.length){if(status)status.textContent='No audio text found.';return;}
  try{
    btn.disabled=true;if(status)status.textContent='Preparing audio…';
    for(let i=0;i<segments.length;i++){
      if(token!==playToken)return;
      player.src=await getAudio(id,i,segments[i]);
      await player.play();await waitForAudio();
    }
    if(status)status.textContent='Finished. Now give your own response.';
  }catch{
    try{
      if(status)status.textContent='Playing with your device voice…';
      await speakWithDeviceVoice(segments,token);
      if(status)status.textContent='Finished. Now give your own response.';
    }catch{if(status)status.textContent='Audio could not be played on this device.';}
  }finally{btn.disabled=false;}
}));

let recorder=null,stream=null,chunks=[],activeBtn=null;
function recordStatus(btn){const n=btn.nextElementSibling;return n&&n.classList.contains('status')?n:btn.closest('.speak')?.querySelector('.status');}

document.querySelectorAll('.record').forEach(btn=>{
  btn.dataset.idleLabel=btn.textContent;
  btn.addEventListener('click',async()=>{
    const box=btn.closest('.speak'),status=recordStatus(btn);
    if(recorder&&activeBtn===btn){recorder.stop();return;}
    if(recorder){if(status)status.textContent='Finish the current recording first.';return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];activeBtn=btn;recorder=new MediaRecorder(stream);
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
      recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');if(status)status.textContent='Recording… ORACY does not save this recording.';
    }catch{if(status)status.textContent='Please allow microphone access.';recorder=null;activeBtn=null;}
  });
});

async function sendForFeedback(box,prompt,btn){
  const status=recordStatus(btn),feedback=box.querySelector('.feedback');
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent=btn.dataset.idleLabel||'🎤 Record';btn.classList.remove('live');if(status)status.textContent='Getting feedback… This recording is used for feedback only.';
  const mode=btn.dataset.feedback||'default';
  let feedbackRule='Give concise feedback with: specific praise, one next fix, and a stronger example using the learner\'s own idea.';
  if(mode==='praise2')feedbackRule='Be generous and confidence-building. Start with two or three specific things the learner did well. Then identify no more than two problems to correct, choosing only the two most useful. If there are fewer than two meaningful problems, do not invent more. End with a short encouraging model or next try.';
  if(mode==='drill')feedbackRule='This is a controlled listening-and-speaking check. First say whether the life-event phrase is correct or nearly correct. Give one short piece of praise. Correct no more than one issue. If correction is needed, give the exact correct chunk and one brief model sentence. Keep the feedback very short.';
  const coaching=`${prompt}\nThis is ORACY B1A New Unit 2: Background. Evaluate mainly on B1 spoken effectiveness: task completion, clarity, correct use of the unit language, connected ideas and natural delivery. ${feedbackRule}`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(UNIT_NO));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. You communicated the main idea clearly.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;if(status)status.textContent='Feedback complete. ORACY has not saved your recording.';
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';if(status)status.textContent='The recording was not saved. You can try again.';}
}

window.addEventListener('beforeunload',()=>{
  try{stream?.getTracks().forEach(t=>t.stop());window.speechSynthesis?.cancel();}catch{}
  chunks=[];recorder=null;activeBtn=null;
  for(const url of audioCache.values())try{URL.revokeObjectURL(url)}catch{}
  audioCache.clear();
});