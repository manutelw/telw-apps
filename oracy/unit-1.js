const EDGE='/oracy/session';
const UNIT_NO=1;
const player=document.getElementById('player');

const PASSAGE_STYLE='Sound natural, lively and warm. Use clear B1-friendly pacing, expressive sentence stress, natural rises and falls, and genuine conversational enthusiasm. In dialogue, react to the other speaker and make discourse markers such as hey, oh yeah, you know what, actually, right, by the way, and anyway sound spontaneous rather than read aloud. Do not sound like a formal announcement or a textbook recording. Keep articulation clear without becoming slow or robotic.';

const passages={
  kp1:[
    {speaker:'Mira',voice:'marin',text:'This fair is amazing! I can hear so many languages.'},
    {speaker:'Ravi',voice:'cedar',text:"You bet, it is. I'm guessing at least six languages are being spoken here today."},
    {speaker:'Mira',voice:'marin',text:'Oh yeah! You know what? Hindi is my native language, but then I use English with many visitors.'},
    {speaker:'Ravi',voice:'cedar',text:'Hey, me too! I guess because English is an official language in many places, almost everyone knows at least a little.'},
    {speaker:'Mira',voice:'marin',text:'And tell you what, even the majority of the signs here are in English and Hindi.'},
    {speaker:'Ravi',voice:'cedar',text:"Yeah, I noticed that. Makes it easier to get around, doesn't it? Oh—and listen, I think that's Bengali behind us."},
    {speaker:'Mira',voice:'marin',text:"You're right! And a minute ago I heard Punjabi near the music stage."},
    {speaker:'Ravi',voice:'cedar',text:'Really? Nice. I heard Tamil over by the food stalls too.'},
    {speaker:'Mira',voice:'marin',text:"See? That's what I love about places like this—you hear a bit of everything."},
    {speaker:'Ravi',voice:'cedar',text:'Exactly. And when people do not share the same native language, English often helps.'},
    {speaker:'Mira',voice:'marin',text:"True. I don't speak all these languages, but I can still start a conversation."},
    {speaker:'Ravi',voice:'cedar',text:'Same here. A few simple words can get you a long way.'},
    {speaker:'Mira',voice:'marin',text:'By the way, do you use English much at home?'},
    {speaker:'Ravi',voice:'cedar',text:'Not really. Mostly at work, when I travel, and when I watch videos online.'},
    {speaker:'Mira',voice:'marin',text:"Ah, same story here. Anyway, let's grab something to eat before the queue gets longer!"}
  ],
  kp2:[
    {speaker:'',voice:'cedar',text:"I use English for reading messages, watching videos, and speaking to people outside my family. I need English to talk to my daughter's teachers and to understand school notices. I'm also learning English to travel more easily. When I visit a new place, I want to ask for directions, order food, and have simple conversations. I practise for about twenty minutes every day so that I can speak with less fear. Sometimes I repeat short videos, and sometimes I talk to myself in English while I cook. Little by little, I'm getting more comfortable, and that makes me want to keep going."}
  ],
  kp3:[
    {speaker:'',voice:'marin',text:'Good morning! I work from home during the week, but I visit my sister every weekend. We usually watch videos, try new recipes, and walk around the market near her house. I want better English because I would like to travel more and speak to people from different parts of the world. I also want to feel comfortable when I watch English videos or read simple websites. Every week, I choose a few useful words and practise them aloud. Words like work, world, visit, video, weekend, and travel help me practise the difference between w and v. It is a small step, but I can already hear the difference more clearly.'}
  ]
};

const learningNotes={
  q1:'At least means “not less than”. Example: We need at least ten chairs. You can use it for numbers, time, money and amounts.',
  q2:'Native language means the language you first learn naturally, usually at home. You may also hear first language or mother tongue.',
  q3:'Native can also describe a person, plant or animal that comes naturally from a place: She is a native of Jaipur. This plant is native to India.',
  q4:'Official language means a language formally used by a government or institution. Official can also mean approved or formal: an official notice, an official website.',
  q5:'Majority means more than half or most of a group. Example: The majority of people agreed. The opposite is minority.',
  q6:'Use for + -ing to talk about function or use: I use my phone for taking photos. We also say for + noun: This bag is for books.',
  q7:'Use need + noun + to + verb to show purpose: I need English to travel. Need can also be followed by a noun: I need some help.',
  q8:'So that I can explains the result or purpose you want: I practise daily so that I can speak clearly. In the past, you may hear so that I could.',
  q9:'To + verb is a very common way to show purpose: I went outside to make a call. For + -ing is more about use or function: This room is for studying.',
  q10:'After can, use the base verb: can speak, can travel, can understand. Not can speaking or can spoke.',
  q11:'/v/ begins words such as visit, very and video. The top teeth lightly touch the lower lip and the voice is switched on.',
  q12:'/w/ begins words such as weekend, work and world. Round the lips, then move quickly into the vowel.',
  q13:'For /v/, the lip-and-teeth contact is light. The same sound can come in the middle or end too: seven, travel, love.',
  q14:'For /w/, the lips start rounded. The sound also appears in words such as away, always and between.',
  q15:'Work and visit are a useful contrast: /w/ versus /v/. Try other pairs such as west–vest and wine–vine.'
};

const discourseExercises=[
  {
    id:'dm1',
    title:'Conversation exercise 1 · Strong agreement',
    question:'What do “You bet!” and “Exactly!” do in a conversation?',
    choices:[['a','They show strong agreement.'],['b','They show doubt.'],['c','They politely end the conversation.']],
    answer:'a',
    markers:['you bet','exactly'],
    labels:['You bet','Exactly'],
    note:'“You bet!” is informal and enthusiastic: it means “definitely” or “yes, certainly”. “Exactly!” says that the other person is completely right.'
  },
  {
    id:'dm2',
    title:'Conversation exercise 2 · Reacting naturally',
    question:'What do “Oh yeah!” and “Really?” usually show here?',
    choices:[['a','They give formal instructions.'],['b','They show interest, recognition or surprise.'],['c','They mean the speaker is angry.']],
    answer:'b',
    markers:['oh yeah','really'],
    labels:['Oh yeah','Really'],
    note:'“Oh yeah!” is informal and can show agreement, recognition or enthusiasm. “Really?” shows interest or surprise and often invites the other person to say more.'
  },
  {
    id:'dm3',
    title:'Conversation exercise 3 · Bringing in a thought',
    question:'What is the difference between “You know what?” and “By the way”?',
    choices:[['a','“You know what?” introduces a thought; “By the way” adds a side point or changes topic gently.'],['b','Both mean “I disagree”.'],['c','Both are used only to say goodbye.']],
    answer:'a',
    markers:['you know what','by the way'],
    labels:['You know what','By the way'],
    note:'“You know what?” gets the listener ready for a thought, idea or bit of news. “By the way” introduces something related but not central to the current topic.'
  },
  {
    id:'dm4',
    title:'Conversation exercise 4 · Linking and moving on',
    question:'What do “Same here” and “Anyway” do?',
    choices:[['a','“Same here” means the same is true for me; “Anyway” returns to the main point or moves the talk on.'],['b','Both mean “I do not understand”.'],['c','Both introduce a new person.']],
    answer:'a',
    markers:['same here','anyway'],
    labels:['Same here','Anyway'],
    note:'“Same here” is an informal way to say “the same is true for me”. “Anyway” helps you return to the main point, close a side topic or move the conversation forward.'
  }
];

const audioCache=new Map();
let playToken=0;
let audioContext=null;
let activeSources=[];

function refreshVisiblePassages(){
  document.querySelectorAll('.audio').forEach(button=>{
    const id=button.dataset.id;
    const passage=button.parentElement.querySelector('.passage');
    if(!passage||!passages[id])return;
    if(id==='kp1'){
      passage.innerHTML=passages[id].map(s=>`<p><b>${safe(s.speaker)}:</b> ${safe(s.text)}</p>`).join('');
    }else{
      passage.textContent=passages[id].map(s=>s.text).join(' ');
    }
  });
}
refreshVisiblePassages();

function insertDiscourseExercises(){
  const q5=document.querySelector('.check[data-question="q5"]')?.closest('.activity');
  if(!q5)return;
  const html=`<div class="activity"><div class="eyebrow">Conversation toolbox</div><h3>Small words. Big difference.</h3><p>These expressions help English sound natural. First choose the meaning. Then use <b>both</b> expressions in new sentences of your own.</p></div>`+
    discourseExercises.map(ex=>`<div class="activity discourse" data-discourse="${ex.id}"><h3>${safe(ex.title)}</h3><p>${safe(ex.question)}</p>${ex.choices.map(c=>`<label><input type="radio" name="${ex.id}" value="${c[0]}"> ${safe(c[1])}</label>`).join('')}<p><b>Now use each expression once in a different sentence.</b></p><label>${safe(ex.labels[0])}: <input type="text" data-marker-use="0" placeholder="Write your own sentence"></label><label>${safe(ex.labels[1])}: <input type="text" data-marker-use="1" placeholder="Write your own sentence"></label><button class="marker-check" data-id="${ex.id}">Check meaning & use</button><div class="answer"></div></div>`).join('');
  q5.insertAdjacentHTML('afterend',html);
}
insertDiscourseExercises();

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity');
  const selected=box.querySelector(`input[name="${btn.dataset.question}"]:checked`);
  const out=box.querySelector('.answer');
  if(!selected){out.textContent='Choose one answer.';out.className='answer bad';return;}
  const ok=selected.value===btn.dataset.answer;
  const note=learningNotes[btn.dataset.question]||'';
  if(ok){
    out.innerHTML=`<b>Correct.</b>${note?`<div style="margin-top:6px"><b>Language note:</b> ${safe(note)}</div>`:''}`;
    out.className='answer ok';
  }else{
    out.textContent='Try again.';
    out.className='answer bad';
  }
}));

function normaliseWords(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function sentenceUsesMarker(sentence,marker){
  const s=normaliseWords(sentence);
  const m=normaliseWords(marker);
  return s.includes(m)&&s.split(' ').length>=4;
}

document.querySelectorAll('.marker-check').forEach(btn=>btn.addEventListener('click',()=>{
  const ex=discourseExercises.find(x=>x.id===btn.dataset.id);
  const box=btn.closest('.discourse');
  const out=box.querySelector('.answer');
  const selected=box.querySelector(`input[name="${ex.id}"]:checked`);
  if(!selected){out.textContent='Choose the meaning first.';out.className='answer bad';return;}
  if(selected.value!==ex.answer){out.textContent='Not quite. Try the meaning again.';out.className='answer bad';return;}
  const uses=[...box.querySelectorAll('[data-marker-use]')].map((input,i)=>sentenceUsesMarker(input.value,ex.markers[i]));
  if(!uses[0]||!uses[1]){
    const missing=[];
    if(!uses[0])missing.push(ex.labels[0]);
    if(!uses[1])missing.push(ex.labels[1]);
    out.innerHTML=`<b>The meaning is right.</b><div style="margin-top:6px">Now write a new sentence using ${safe(missing.join(' and '))}. Make it a complete sentence, not just the expression.</div><div style="margin-top:6px"><b>Meaning:</b> ${safe(ex.note)}</div>`;
    out.className='answer bad';
    return;
  }
  out.innerHTML=`<b>Good.</b> You understood the expressions and used both yourself.<div style="margin-top:6px"><b>Meaning:</b> ${safe(ex.note)}</div>`;
  out.className='answer ok';
}));

async function responseError(res,label){
  const type=res.headers.get('content-type')||'';let detail='';
  try{if(type.includes('application/json')){const data=await res.json();detail=data?.error||data?.message||'';if(data?.detail)detail+=(detail?': ':'')+data.detail;}else{detail=(await res.text()).replace(/\s+/g,' ').trim().slice(0,240);}}catch{}
  return `${label} failed (HTTP ${res.status})${detail?': '+detail:''}`;
}

function segmentKey(id,index,segment){return `b1-u1-${id}-${index}-${segment.voice}-expanded-v4`;}

async function getSegmentAudio(id,index,segment){
  const key=segmentKey(id,index,segment);
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:UNIT_NO,passage_id:key})});
  if(!res.ok)throw new Error(await responseError(res,'Audio'));
  const blob=await res.blob();
  const item={blob,url:URL.createObjectURL(blob)};
  audioCache.set(key,item);
  return item;
}

function stopScheduledAudio(){
  activeSources.forEach(source=>{try{source.stop();}catch{}});
  activeSources=[];
  player.pause();
}

function trimBounds(buffer){
  const threshold=.004;
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const total=buffer.length;
  let start=0,end=total-1;
  const loudAt=i=>channels.some(ch=>Math.abs(ch[i])>threshold);
  while(start<total&&!loudAt(start))start++;
  while(end>start&&!loudAt(end))end--;
  const pad=Math.floor(buffer.sampleRate*.025);
  start=Math.max(0,start-pad);
  end=Math.min(total-1,end+pad);
  return {offset:start/buffer.sampleRate,duration:Math.max(.05,(end-start+1)/buffer.sampleRate)};
}

async function playDialogueGapless(items,token){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)throw new Error('Continuous dialogue audio is not supported in this browser.');
  if(!audioContext)audioContext=new Ctx();
  await audioContext.resume();
  stopScheduledAudio();
  const buffers=await Promise.all(items.map(async item=>audioContext.decodeAudioData(await item.blob.arrayBuffer())));
  if(token!==playToken)return;
  const sources=[];
  let when=audioContext.currentTime+.06;
  await new Promise(resolve=>{
    buffers.forEach((buffer,index)=>{
      const {offset,duration}=trimBounds(buffer);
      const source=audioContext.createBufferSource();
      source.buffer=buffer;
      source.connect(audioContext.destination);
      sources.push(source);
      source.start(when,offset,duration);
      when+=duration+.08;
      if(index===buffers.length-1)source.onended=resolve;
    });
    activeSources=sources;
    if(!buffers.length)resolve();
    setTimeout(()=>{if(token!==playToken)resolve();},100);
  });
  if(token===playToken)activeSources=[];
}

async function playUrl(url,token){
  return new Promise((resolve,reject)=>{
    if(token!==playToken){resolve();return;}
    player.pause();
    player.src=url;
    player.onended=()=>resolve();
    player.onerror=()=>reject(new Error('Audio could not be played.'));
    const p=player.play();
    if(p&&typeof p.catch==='function')p.catch(reject);
  });
}

async function playPassage(id,button){
  const note=button.parentElement.querySelector('.audio-note');
  const segments=passages[id]||[];
  const token=++playToken;
  stopScheduledAudio();
  button.disabled=true;button.textContent='Preparing audio…';if(note)note.textContent='';
  try{
    const items=await Promise.all(segments.map((segment,index)=>getSegmentAudio(id,index,segment)));
    button.textContent='Playing…';
    if(id==='kp1'){
      await playDialogueGapless(items,token);
    }else{
      for(const item of items){if(token!==playToken)break;await playUrl(item.url,token);}
    }
    if(note&&token===playToken)note.textContent='Ready.';
  }catch(error){if(note)note.textContent=error.message||'Audio request could not be completed.';}
  finally{if(token===playToken){button.disabled=false;button.textContent='▶ Play passage';}}
}
document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',()=>playPassage(btn.dataset.id,btn)));

async function warmPassages(){
  const jobs=[];
  for(const [id,segments] of Object.entries(passages))segments.forEach((segment,index)=>jobs.push(getSegmentAudio(id,index,segment).catch(()=>null)));
  await Promise.all(jobs);
}
if('requestIdleCallback' in window)requestIdleCallback(()=>warmPassages(),{timeout:1200});else setTimeout(()=>warmPassages(),500);

let mediaStream=null,recorder=null,chunks=[],activeButton=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',()=>toggleRecording(btn)));

async function toggleRecording(btn){
  const box=btn.closest('.speak');const status=box.querySelector('.status');
  if(recorder&&activeButton===btn){recorder.stop();return;}
  if(recorder){status.textContent='Finish the current recording first.';return;}
  try{mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(mediaStream);activeButton=btn;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording…';}
  catch{status.textContent='Please allow microphone access.';}
}

async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status');const feedback=box.querySelector('.feedback');mediaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Getting feedback…';
  try{const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error(await responseError(res,'Feedback'));const data=await res.json();feedback.innerHTML='<b>Coach feedback</b><div>'+safe(data.feedback||'Good attempt.')+'</div>'+(data.improved?'<div><b>Try:</b> '+safe(data.improved)+'</div>':'');status.textContent='Recording discarded after feedback.';}
  catch(error){status.textContent=(error.message||'Feedback request could not be completed.')+' Your recording has been discarded.';}
  finally{chunks=[];recorder=null;activeButton=null;btn.textContent='🎤 Record again';btn.classList.remove('live');}
}

function safe(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// Unit 1 passage-length standard: dialogue ≈15 turns; monologue/presentation ≈100–120 words.
