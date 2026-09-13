const EDGE='/oracy/session';
const unitNo=Number(document.body.dataset.unitNo||0);
const displayUnit=document.body.dataset.displayUnit||'';
const unitTitle=document.body.dataset.unitTitle||'';
const UNIT_LABEL=`TELW B1A New Unit ${displayUnit} · ${unitTitle}`;
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation in clear UK-leaning international English. Keep the pace B1-friendly but natural. Use spontaneous reactions and normal sentence stress. Do not sound like a textbook recording.';
const audioCache=new Map();let playToken=0;

function safe(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity'),choice=box.querySelector(`input[name="${btn.dataset.question}"]:checked`),out=box.querySelector('.answer');
  if(!choice){out.textContent='Choose one answer.';out.className='answer bad';return}
  if(choice.value===btn.dataset.answer){out.textContent='Correct. Say the idea aloud once before you move on.';out.className='answer ok'}
  else{out.textContent='Try again. Look at the language focus and the conversation above.';out.className='answer bad'}
}));

function segmentsFor(id){
  const p=document.querySelector(`.passage[data-audio-id="${id}"]`);
  if(!p)return[];
  return Array.from(p.querySelectorAll('p')).map((x,i)=>({voice:i%2?'cedar':'marin',text:x.textContent.replace(/\s+/g,' ').trim()}));
}
async function getAudio(id,index,segment){
  const key=`b1anew-${unitNo}-${id}-${index}-${segment.voice}-v1`;
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:unitNo,passage_id:key})});
  if(!res.ok)throw new Error('Audio could not be loaded.');
  const blob=await res.blob(),url=URL.createObjectURL(blob);audioCache.set(key,url);return url;
}
function waitForAudio(){return new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed.'))})}
document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',async()=>{
  const id=btn.dataset.id,status=btn.nextElementSibling,token=++playToken,segments=segmentsFor(id);
  try{btn.disabled=true;status.textContent='Preparing audio…';
    for(let i=0;i<segments.length;i++){if(token!==playToken)return;player.src=await getAudio(id,i,segments[i]);await player.play();await waitForAudio()}
    status.textContent='Finished. Listen again if you want to notice the language.'
  }catch(e){status.textContent=e.message||'Audio could not be played.'}finally{btn.disabled=false}
}));

let recorder=null,stream=null,chunks=[],activeBtn=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',async()=>{
  const box=btn.closest('.speak'),status=box.querySelector('.status');
  if(recorder&&activeBtn===btn){recorder.stop();return}
  if(recorder){status.textContent='Finish the current recording first.';return}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];activeBtn=btn;recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
    recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording… Speak naturally.'
  }catch{status.textContent='Please allow microphone access.';recorder=null;activeBtn=null}
}));
async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent='🎤 Record';btn.classList.remove('live');status.textContent='Getting feedback…';
  const coaching=`${prompt}\nThis is ORACY B1A New Unit ${displayUnit}, ${unitTitle}. Evaluate mainly on B1 spoken effectiveness: task completion, clarity, correct use of the unit language, connected ideas and natural delivery. Do not reward memorised textbook language. Give concise feedback with: What worked; One next fix; A stronger example using the learner's own idea.`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(unitNo));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. Keep the answer connected and natural.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;status.textContent='Recording discarded after feedback.'
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';status.textContent='You can try the rep again.'}
}
