const EDGE='/oracy/session';
const UNIT_NO=1;
const UNIT_LABEL='TELW Level B Unit 1A · First Connections';
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation at a professional or learning event. Keep the pace B1-friendly but not slow. Use warm, spontaneous reactions, natural sentence stress and clear UK-leaning international English. Do not sound like a textbook recording.';
const NOTES_STYLE='Read as clear learner-facing spoken notes in natural UK-leaning international English. Use a calm, warm teaching voice, natural pauses, and slightly slower pacing for clarity. Do not sound mechanical.';

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
  kp1notes:[
    {voice:'cedar',instructions:NOTES_STYLE,text:'Warm-up. How do you normally greet a new classmate, a visiting speaker, and a senior manager? Would you use exactly the same words with all three?'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'Hello. It doesn’t matter if you’re giving a president a handshake or buying a milkshake, this greeting is good for all situations, formal and informal.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'Hi. In the past, this was a more informal greeting. Now, it’s used much more generally — for example, in stores, for buying food and drink, and quite often in business. But in very formal situations, it’s better to use Hello.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'Nice to meet you. This is a very common greeting between people meeting for the first time. It’s fine for all situations, formal and informal.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'Pleased to meet you. This is a slightly more formal greeting for meeting people for the first time.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'How do you do? This is a very formal greeting for first meetings. It’s less common nowadays. People learning English often reply Fine, thanks or Very well, thanks. But you should reply with a greeting. Say How do you do?, Nice to meet you, or Pleased to meet you.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'How are you? This can be formal or informal. We use it when we see people we know or have met before. Common replies are Fine, thanks and Very well, thanks. Sometimes, this greeting is used when people meet for the first time. In this case, repeat How are you? or say Nice to meet you.'},
    {voice:'cedar',instructions:NOTES_STYLE,text:'Nice to see you. Good to see you. Great to see you. These greetings can be formal or informal. They’re normally used when you see someone you’ve met before, but haven’t seen for some time.'}
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

const greetingNotes=Array.from(document.querySelectorAll('details.activity')).find(d=>d.textContent.includes('Greeting notes'));
if(greetingNotes){
  const btn=document.createElement('button');
  btn.className='audio';btn.dataset.id='kp1notes';btn.textContent='▶ Play warm-up + greeting notes';
  const status=document.createElement('div');status.className='audio-note status';status.setAttribute('aria-live','polite');
  greetingNotes.insertAdjacentElement('beforebegin',btn);
  greetingNotes.insertAdjacentElement('beforebegin',status);
}

const audioCache=new Map();
let playToken=0;
async function getAudio(id,index,segment){
  const key=`b-u1a-${id}-${index}-${segment.voice}-v3`;
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:segment.instructions||PASSAGE_STYLE,unit_no:UNIT_NO,passage_id:key})});
  if(!res.ok){
    const err=new Error('Audio could not be loaded.');
    err.status=res.status;
    throw err;
  }
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);audioCache.set(key,url);return url;
}
function waitForAudio(){return new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed.'));});}
function speakWithDeviceVoice(segments,token){
  return new Promise((resolve,reject)=>{
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
      reject(new Error('Audio could not be played.'));return;
    }
    let i=0;
    const next=()=>{
      if(token!==playToken){window.speechSynthesis.cancel();resolve();return;}
      if(i>=segments.length){resolve();return;}
      const utterance=new SpeechSynthesisUtterance(segments[i++].text);
      utterance.lang='en-GB';utterance.rate=.9;utterance.pitch=1;
      utterance.onend=next;
      utterance.onerror=()=>reject(new Error('Audio could not be played.'));
      window.speechSynthesis.speak(utterance);
    };
    window.speechSynthesis.cancel();next();
  });
}

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
  }catch(e){
    if(id==='kp1notes'&&'speechSynthesis' in window){
      try{
        status.textContent='Playing the greeting notes…';
        await speakWithDeviceVoice(passages[id],token);
        status.textContent='Finished. Listen again if you want to notice the language.';
      }catch{
        status.textContent='Audio could not be played.';
      }
    }else{
      status.textContent=e.message||'Audio could not be played.';
    }
  }finally{btn.disabled=false;}
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
