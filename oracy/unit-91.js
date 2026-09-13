const EDGE='/oracy/session';
const UNIT_NO=91;
const UNIT_LABEL='TELW B1A New Unit 2 · Background';
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation in clear UK-leaning international English. Keep the pace B1-friendly but natural. Use warm spontaneous reactions, natural pauses and clear sentence stress. Do not sound like a textbook recording.';
const audioCache=new Map();let playToken=0;

function safe(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));}
function normaliseAnswer(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}

function configureQ5Drill(){
  const drills=Array.from(document.querySelectorAll('.speak.drill'));
  drills.slice(8).forEach(el=>el.remove());
  const specs=[
    {answer:'go',expected:'go to college or university'},
    {answer:'have',expected:'have children'},
    {answer:'get',expected:'get placed'},
    {answer:'get',expected:'get posted'},
    {answer:'get',expected:'get married'},
    {answer:'start',expected:'start school'},
    {answer:'leave',expected:'leave school'},
    {answer:'get',expected:'get promoted'}
  ];
  drills.slice(0,8).forEach((box,i)=>{
    const spec=specs[i];
    const passage=box.querySelector('.passage p');
    if(passage)passage.textContent=passage.textContent.replace(/^Blank\b/i,'Dash');
    const record=box.querySelector('.record');
    if(record){record.dataset.answer=spec.answer;record.dataset.expected=spec.expected;}
  });
  const heading=Array.from(document.querySelectorAll('.activity h3')).find(h=>h.textContent.trim().startsWith('5 ·'));
  const activity=heading?.closest('.activity');
  if(activity){
    heading.textContent='5 · Listening + speaking exercise';
    const ps=activity.querySelectorAll('p');
    if(ps[0])ps[0].innerHTML='<b>Fill in the blanks in the following questions 1–8 using the list of verbs given below.</b> Listen to each question, then say your answer aloud.';
    if(ps[1])ps[1].innerHTML='<b>Verb list:</b> get · go · have · leave · start';
  }
}
configureQ5Drill();

function applyPlainEnglishUnit2(){
  const kps=[...document.querySelectorAll('.kp')];
  if(kps[1]){
    kps[1].querySelectorAll('.chips span').forEach(s=>{
      const t=s.textContent.trim().toLowerCase();
      if(t==='past simple')s.textContent='finished past words';
      if(t==='regular verbs')s.textContent='-ed past words';
      if(t==='irregular verbs')s.textContent='changed past words';
    });
    const notice=[...kps[1].querySelectorAll('.activity')].find(a=>(a.querySelector('h3')?.textContent||'').toLowerCase().includes('notice the language'));
    const p=notice?.querySelector('p');
    if(p)p.innerHTML='When an event is finished, use the past word: <b>worked, stayed, went, took, met, saw, bought, made, found, came</b>. Some words simply add <b>-ed</b>. Other common words change more. Listen to the whole word and learn it with the event: <b>went home, took a bus, met a friend</b>.';
  }
}
applyPlainEnglishUnit2();

function segmentsFor(id){
  const p=document.querySelector(`.passage[data-audio-id="${id}"]`);
  if(!p)return[];
  return Array.from(p.querySelectorAll('p')).map((x,i)=>({voice:i%2?'cedar':'marin',text:x.textContent.replace(/\s+/g,' ').trim().replace(/^Blank\b/i,'Dash')})).filter(x=>x.text);
}
async function getAudio(id,index,segment){
  const key=`b1anew-91-${id}-${index}-${segment.voice}-redraft4`;
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
let audioContext=null,analyser=null,levelTimer=null,speechFrames=0;
function recordStatus(btn){const n=btn.nextElementSibling;return n&&n.classList.contains('status')?n:btn.closest('.speak')?.querySelector('.status');}
function startSpeechDetection(mediaStream){
  speechFrames=0;
  try{
    audioContext=new (window.AudioContext||window.webkitAudioContext)();
    const source=audioContext.createMediaStreamSource(mediaStream);
    analyser=audioContext.createAnalyser();analyser.fftSize=512;source.connect(analyser);
    const data=new Uint8Array(analyser.fftSize);
    levelTimer=setInterval(()=>{
      analyser.getByteTimeDomainData(data);
      let sum=0;for(const v of data){const x=(v-128)/128;sum+=x*x;}
      const rms=Math.sqrt(sum/data.length);
      if(rms>0.018)speechFrames++;
    },80);
  }catch{speechFrames=5;}
}
function stopSpeechDetection(){
  if(levelTimer){clearInterval(levelTimer);levelTimer=null;}
  try{audioContext?.close();}catch{}
  audioContext=null;analyser=null;
  const heard=speechFrames>=3;speechFrames=0;return heard;
}

document.querySelectorAll('.record').forEach(btn=>{
  btn.dataset.idleLabel=btn.textContent;
  btn.addEventListener('click',async()=>{
    const box=btn.closest('.speak'),status=recordStatus(btn);
    if(recorder&&activeBtn===btn){recorder.stop();return;}
    if(recorder){if(status)status.textContent='Finish the current recording first.';return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});chunks=[];activeBtn=btn;startSpeechDetection(stream);recorder=new MediaRecorder(stream);
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn,stopSpeechDetection());
      recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');if(status)status.textContent='Recording… ORACY does not save this recording.';
    }catch{if(status)status.textContent='Please allow microphone access.';recorder=null;activeBtn=null;stopSpeechDetection();}
  });
});

async function sendForFeedback(box,prompt,btn,heardSpeech){
  const status=recordStatus(btn),feedback=box.querySelector('.feedback');
  const mode=btn.dataset.feedback||'default';
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent=btn.dataset.idleLabel||'🎤 Record';btn.classList.remove('live');
  if(!heardSpeech){
    feedback.innerHTML='';
    if(status)status.textContent='No answer detected.';
    return;
  }
  if(status)status.textContent='Checking your answer… This recording is used for feedback only.';
  let feedbackRule='Give concise feedback with: specific praise, one next fix, and a stronger example using the learner\'s own idea.';
  if(mode==='praise2')feedbackRule='Be generous and confidence-building. Start with two or three specific things the learner did well. Then identify no more than two problems to correct, choosing only the two most useful. If there are fewer than two meaningful problems, do not invent more. End with a short encouraging model or next try.';
  const coaching=`${prompt}\nThis is ORACY B1A New Unit 2: Background. Evaluate mainly on B1 spoken effectiveness: task completion, clarity, correct use of the unit language, connected ideas and natural delivery. ${feedbackRule}`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(UNIT_NO));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();
    if(mode==='drill'){
      const transcript=normaliseAnswer(data.transcript);
      const answer=normaliseAnswer(btn.dataset.answer);
      const expected=normaliseAnswer(btn.dataset.expected);
      if(!transcript){feedback.innerHTML='';if(status)status.textContent='No answer detected.';return;}
      const correct=transcript===answer||transcript===expected||transcript.includes(expected);
      if(correct){
        feedback.innerHTML=`<b>Correct.</b> ${safe(btn.dataset.expected)} is the right phrase.`;
      }else{
        feedback.innerHTML=`<span style="font-size:24px;color:#b42318;font-weight:800;vertical-align:middle">✖</span> <span style="display:inline-block;margin-left:8px;padding:6px 12px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:800">${safe(btn.dataset.answer)}</span>`;
      }
      if(status)status.textContent='Answer checked. ORACY has not saved your recording.';
      return;
    }
    feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. You communicated the main idea clearly.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;if(status)status.textContent='Feedback complete. ORACY has not saved your recording.';
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';if(status)status.textContent='The recording was not saved. You can try again.';}
}

window.addEventListener('beforeunload',()=>{
  try{stream?.getTracks().forEach(t=>t.stop());window.speechSynthesis?.cancel();}catch{}
  stopSpeechDetection();chunks=[];recorder=null;activeBtn=null;
  for(const url of audioCache.values())try{URL.revokeObjectURL(url)}catch{}
  audioCache.clear();
});

import('./b1a-new-guidance.js?v=20260913a').catch(()=>{});
