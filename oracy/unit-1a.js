const EDGE='/oracy/session';
const UNIT_NO=1;
const UNIT_LABEL='TELW Level B Unit 1A · First Connections';
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation at a professional or learning event. Keep the pace B1-friendly but not slow. Use warm, spontaneous reactions, natural sentence stress and clear UK-leaning international English. Do not sound like a textbook recording.';

const passages={
  kp1:[
    {voice:'marin',text:"Hi, I'm Neha. I don't think we've spoken before."},
    {voice:'cedar',text:"No, I don't think we have. I'm Arjun. Nice to meet you."},
    {voice:'marin',text:'Nice to meet you too. Are you here for the analytics workshop?'},
    {voice:'cedar',text:"Yes. I'm looking forward to it. How about you?"},
    {voice:'marin',text:"Same here. I've heard the speaker is very practical."},
    {voice:'cedar',text:"That's good to know. Is this your first session today?"},
    {voice:'marin',text:'It is. I just arrived a few minutes ago.'},
    {voice:'cedar',text:'Me too. Looks like we picked the right room.'}
  ],
  kp2:[
    {voice:'marin',text:'So, what do you do?'},
    {voice:'cedar',text:"I work in operations, but I'm studying data analytics this term."},
    {voice:'marin',text:'Interesting. Are you using it at work already?'},
    {voice:'cedar',text:"A little. Our team usually tracks delivery issues manually, but this month we're testing a new dashboard."},
    {voice:'marin',text:'That sounds useful. What are you working on personally?'},
    {voice:'cedar',text:"I'm looking at delays in one region. I normally handle vendor coordination, so the data is helping me see patterns more clearly."},
    {voice:'marin',text:"Nice. I work in marketing, and we're doing something similar with campaign data right now."},
    {voice:'cedar',text:"Really? What are you measuring?"}
  ],
  kp3:[
    {voice:'marin',text:"It's easier to talk to people when there's something around you to comment on."},
    {voice:'cedar',text:'Definitely. If I have to start from nothing, I sometimes overthink it.'},
    {voice:'marin',text:"Same here. When I'm at an event, I usually ask about the session or the speaker."},
    {voice:'cedar',text:'That works. And if the other person gives a short answer, I try one follow-up instead of changing topics immediately.'},
    {voice:'marin',text:'Exactly. You can also react first: That sounds interesting, and then ask more.'},
    {voice:'cedar',text:'True. And when you need to leave, it helps to signal it politely instead of just disappearing.'},
    {voice:'marin',text:"Yes. Something simple like, I'll let you get back to the group. Good talking to you."},
    {voice:'cedar',text:'Right. A good ending makes the whole conversation feel better.'}
  ]
};

const notes={
  q1:'A strong opener makes the first response easy. The speaker gives a name, checks the connection, then uses the shared situation as the first topic.',
  q2:'Present simple describes what is normal, regular or generally true. Present continuous is useful for something current, changing or temporary.',
  q3:'A natural first conversation is not a list of questions. React to what you hear, connect your next question to it, and signal your exit when you need to leave.'
};

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity');
  const choice=box.querySelector(`input[name="${btn.dataset.question}"]:checked`);
  const out=box.querySelector('.answer');
  if(!choice){out.textContent='Choose one answer.';out.className='answer bad';return;}
  if(choice.value===btn.dataset.answer){out.innerHTML=`<b>Correct.</b><div style="margin-top:6px">${safe(notes[btn.dataset.question]||'')}</div>`;out.className='answer ok';}
  else{out.textContent='Try again. Look at how the speakers connect one turn to the next.';out.className='answer bad';}
}));

const audioCache=new Map();
let playToken=0;
async function getAudio(id,index,segment){
  const key=`b-u1a-${id}-${index}-${segment.voice}-v1`;
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:UNIT_NO,passage_id:key})});
  if(!res.ok)throw new Error('Audio could not be loaded.');
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);audioCache.set(key,url);return url;
}
function waitForAudio(){return new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed.'));});}

document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',async()=>{
  const id=btn.dataset.id, status=btn.nextElementSibling, token=++playToken;
  try{
    btn.disabled=true;status.textContent='Preparing audio…';
    for(let i=0;i<passages[id].length;i++){
      if(token!==playToken)return;
      const url=await getAudio(id,i,passages[id][i]);
      player.src=url;await player.play();await waitForAudio();
    }
    status.textContent='Finished. Listen again if you want to notice the language.';
  }catch(e){status.textContent=e.message||'Audio could not be played.';}
  finally{btn.disabled=false;}
}));

let recorder=null,stream=null,chunks=[],activeBtn=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',async()=>{
  const box=btn.closest('.speak'),status=box.querySelector('.status');
  if(recorder&&activeBtn===btn){recorder.stop();return;}
  if(recorder){status.textContent='Finish the current recording first.';return;}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];activeBtn=btn;
    recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
    recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording… Speak naturally.';
  }catch{status.textContent='Please allow microphone access.';recorder=null;activeBtn=null;}
}));

async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());
  recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent=btn.textContent.includes('final')?'🎤 Record final performance':'🎤 Record';btn.classList.remove('live');status.textContent='Getting feedback…';
  const coaching=`${prompt}\nThis is ORACY Unit 1A First Connections. Evaluate the learner mainly on conversational effectiveness at B level: appropriacy to the situation, clarity, natural reaction to the other person, connected follow-up, and ability to keep or close the interaction. Do not reward memorised textbook language. Give concise feedback with: What worked; One next fix; A stronger example using the learner's own idea. Keep the example B1-friendly and natural.`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(UNIT_NO));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});
    if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();
    feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. Keep the interaction connected and natural.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;
    status.textContent='Recording discarded after feedback.';
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';status.textContent='You can try the rep again.';}
}

function safe(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
