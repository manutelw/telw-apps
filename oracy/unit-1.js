const EDGE='/oracy/voice';
const UNIT_NO=1;
const player=document.getElementById('player');
const passageText={kp1:'This fair is amazing. I can hear so many languages. Yes. At least six languages are being spoken here today. Hindi is my native language, but I use English with many visitors. Same here. English is an official language in many places, so almost everyone knows a little. The majority of the signs here are in English and Hindi.',kp2:'I use English for reading messages and watching videos. I need English to speak to my daughter’s teachers. I am also learning it to travel more easily. I practise for twenty minutes every day so that I can speak with less fear.',kp3:'I work from home, but I visit my sister every weekend. We watch videos together. I want better English because I would like to travel and speak to people from different parts of the world.'};

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity');
  const selected=box.querySelector(`input[name="${btn.dataset.question}"]:checked`);
  const out=box.querySelector('.answer');
  if(!selected){out.textContent='Choose one answer.';out.className='answer bad';return;}
  const ok=selected.value===btn.dataset.answer;
  out.textContent=ok?'Correct.':'Try again.';
  out.className='answer '+(ok?'ok':'bad');
}));

async function playPassage(id,button){
  const note=button.parentElement.querySelector('.audio-note');
  button.disabled=true;button.textContent='Preparing audio…';if(note)note.textContent='';
  try{
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text:passageText[id],voice:'marin',unit_no:UNIT_NO,passage_id:`b1-u1-${id}-marin-v1`})});
    if(!res.ok){
      let message='Audio is temporarily unavailable.';
      try{const data=await res.json();if(data?.error)message=data.error+(data.detail?': '+data.detail:'');}catch{}
      throw new Error(message);
    }
    const blob=await res.blob();player.src=URL.createObjectURL(blob);await player.play();
    if(note)note.textContent=res.headers.get('x-oracy-audio')==='cache'?'Ready.':'Ready.';
  }catch(error){if(note)note.textContent=error.message||'Audio is temporarily unavailable.';}
  finally{button.disabled=false;button.textContent='▶ Play passage';}
}
document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',()=>playPassage(btn.dataset.id,btn)));

let mediaStream=null,recorder=null,chunks=[],activeButton=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',()=>toggleRecording(btn)));

async function toggleRecording(btn){
  const box=btn.closest('.speak');const status=box.querySelector('.status');
  if(recorder&&activeButton===btn){recorder.stop();return;}
  if(recorder){status.textContent='Finish the current recording first.';return;}
  try{
    mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});
    chunks=[];recorder=new MediaRecorder(mediaStream);activeButton=btn;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
    recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording…';
  }catch{status.textContent='Please allow microphone access.';}
}

async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status');const feedback=box.querySelector('.feedback');
  mediaStream?.getTracks().forEach(t=>t.stop());
  const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Getting feedback…';
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});
    if(!res.ok){let message='Feedback is temporarily unavailable.';try{const data=await res.json();if(data?.error)message=data.error+(data.detail?': '+data.detail:'');}catch{}throw new Error(message);}
    const data=await res.json();feedback.innerHTML='<b>Coach feedback</b><div>'+safe(data.feedback||'Good attempt.')+'</div>'+(data.improved?'<div><b>Try:</b> '+safe(data.improved)+'</div>':'');status.textContent='Recording discarded after feedback.';
  }catch(error){status.textContent=(error.message||'Feedback is temporarily unavailable.')+' Your recording has been discarded.';}
  finally{chunks=[];recorder=null;activeButton=null;btn.textContent='🎤 Record again';btn.classList.remove('live');}
}

function safe(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
