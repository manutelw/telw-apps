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
    {speaker:'Ravi',voice:'cedar',text:'Right? I was just looking at that. It makes things much easier for visitors.'},
    {speaker:'Mira',voice:'marin',text:'Actually, I heard some Bengali near the entrance too.'},
    {speaker:'Ravi',voice:'cedar',text:"Really? That's interesting. I caught some Punjabi near the music stage."},
    {speaker:'Mira',voice:'marin',text:'Same here. And over by the food stalls, I think I heard Tamil as well.'},
    {speaker:'Ravi',voice:'cedar',text:'Good point. You know, English helps when people do not share the same native language.'},
    {speaker:'Mira',voice:'marin',text:"Exactly. I don't speak all these languages, but I can still start a conversation."},
    {speaker:'Ravi',voice:'cedar',text:'Me neither. Still, a few simple words can get you a long way.'},
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

const audioCache=new Map();
let playToken=0;

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

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity');
  const selected=box.querySelector(`input[name="${btn.dataset.question}"]:checked`);
  const out=box.querySelector('.answer');
  if(!selected){out.textContent='Choose one answer.';out.className='answer bad';return;}
  const ok=selected.value===btn.dataset.answer;
  out.textContent=ok?'Correct.':'Try again.';
  out.className='answer '+(ok?'ok':'bad');
}));

async function responseError(res,label){
  const type=res.headers.get('content-type')||'';let detail='';
  try{if(type.includes('application/json')){const data=await res.json();detail=data?.error||data?.message||'';if(data?.detail)detail+=(detail?': ':'')+data.detail;}else{detail=(await res.text()).replace(/\s+/g,' ').trim().slice(0,240);}}catch{}
  return `${label} failed (HTTP ${res.status})${detail?': '+detail:''}`;
}

function segmentKey(id,index,segment){return `b1-u1-${id}-${index}-${segment.voice}-expanded-v3`;}

async function getSegmentAudio(id,index,segment){
  const key=segmentKey(id,index,segment);
  if(audioCache.has(key)) return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:UNIT_NO,passage_id:key})});
  if(!res.ok) throw new Error(await responseError(res,'Audio'));
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);
  audioCache.set(key,url);
  return url;
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
  button.disabled=true;button.textContent='Preparing audio…';if(note)note.textContent='';
  try{
    const urls=await Promise.all(segments.map((segment,index)=>getSegmentAudio(id,index,segment)));
    button.textContent='Playing…';
    for(const url of urls){if(token!==playToken)break;await playUrl(url,token);}
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
