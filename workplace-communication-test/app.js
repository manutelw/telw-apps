const TEST_SECONDS=35*60;
const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const VOICE_ENDPOINT=SUPABASE_URL+'/functions/v1/wct-listening-voice';
const answerKey={l1:'b',l2:'b',l3:'c',l4:'d',r1:'b',r2:'c',r3:'c',r4:'a'};
const plays={a1:0,a2:0};
const listeningAudio={a1:null,a2:null};
let currentListeningAudio=null;
let remaining=TEST_SECONDS, timerHandle=null, started=false, finished=false;
let recorder=null,currentChunks=[],activeRecording=null;
const recordings={one:null,two:null};
let packageBlob=null,packageName='';

const $=id=>document.getElementById(id);
const qs=(s,root=document)=>root.querySelector(s);
const qsa=(s,root=document)=>[...root.querySelectorAll(s)];

function safe(v){return String(v||'').trim();}
function attemptId(){return 'WCT-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.random().toString(36).slice(2,8).toUpperCase();}
function formatTime(s){const m=Math.floor(s/60),sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function updateTimer(){
  $('timer').textContent=formatTime(remaining);
  $('timer').classList.toggle('danger',remaining<=300);
}
function validateIdentity(){
  const name=safe($('candidateName').value), email=safe($('candidateEmail').value), id=safe($('candidateId').value), cohort=safe($('cohort').value);
  if(!name||!email||!id||!cohort){alert('Please complete all candidate details.');return false;}
  if(!/^\S+@\S+\.\S+$/.test(email)){alert('Please enter a valid email address.');return false;}
  if(!$('integrityCheck').checked){alert('Please confirm the independent-completion statement.');return false;}
  return true;
}
function startTest(){
  if(!validateIdentity())return;
  started=true;
  $('identityCard').classList.add('hidden');
  $('testForm').classList.remove('hidden');
  timerHandle=setInterval(()=>{
    if(finished)return;
    remaining--;
    updateTimer();
    if(remaining<=0){clearInterval(timerHandle);finishTest(true);}
  },1000);
  updateTimer();
  window.scrollTo({top:$('testForm').offsetTop-70,behavior:'smooth'});
}

function base64ToBlob(base64,mime){
  const raw=atob(base64),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  return new Blob([bytes],{type:mime||'audio/mpeg'});
}
async function loadListeningAudio(key){
  if(listeningAudio[key])return listeningAudio[key];
  const r=await fetch(VOICE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:key})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok||!d.audio_base64)throw new Error(d.message||'Listening audio could not be prepared.');
  const blob=base64ToBlob(d.audio_base64,d.audio_mime||'audio/mpeg');
  const url=URL.createObjectURL(blob);
  listeningAudio[key]={url,blob};
  return listeningAudio[key];
}
async function speakPassage(key){
  if(!started||finished||plays[key]>=2)return;
  const button=qs(`[data-audio="${key}"]`);
  if(!button)return;
  button.disabled=true;
  $(`${key}Status`).textContent='Preparing natural audio…';
  try{
    const prepared=await loadListeningAudio(key);
    if(currentListeningAudio){currentListeningAudio.pause();currentListeningAudio.currentTime=0;}
    const audio=new Audio(prepared.url);
    currentListeningAudio=audio;
    plays[key]++;
    const left=2-plays[key];
    $(`${key}Status`).textContent=left===0?'Playing · no plays remaining':`Playing · ${left} play${left===1?'':'s'} remaining`;
    audio.onended=()=>{
      if(currentListeningAudio===audio)currentListeningAudio=null;
      $(`${key}Status`).textContent=left===0?'No plays remaining':`${left} play${left===1?'':'s'} available`;
      button.disabled=left===0;
    };
    audio.onerror=()=>{
      if(currentListeningAudio===audio)currentListeningAudio=null;
      plays[key]=Math.max(0,plays[key]-1);
      $(`${key}Status`).textContent='Audio could not play. Please try again.';
      button.disabled=false;
    };
    await audio.play();
  }catch(err){
    $(`${key}Status`).textContent='Audio could not be prepared. Please try again.';
    button.disabled=false;
  }
}

function countWords(){
  const t=safe($('writing').value);
  const n=t?t.split(/\s+/).length:0;
  $('wordCount').textContent=`${n} word${n===1?'':'s'}`;
}

function selected(name){const el=qs(`input[name="${name}"]:checked`);return el?el.value:null;}
function objectiveScore(){
  let listening=0,reading=0;
  ['l1','l2','l3','l4'].forEach(k=>{if(selected(k)===answerKey[k])listening+=5;});
  ['r1','r2','r3','r4'].forEach(k=>{if(selected(k)===answerKey[k])reading+=5;});
  return {listening,reading,total:listening+reading};
}

async function ensureMic(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Microphone recording is not supported in this browser.');
  return navigator.mediaDevices.getUserMedia({audio:true});
}
async function startRecording(which){
  if(finished||activeRecording)return;
  try{
    const stream=await ensureMic();
    const mime=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm';
    recorder=new MediaRecorder(stream,{mimeType:mime});currentChunks=[];activeRecording=which;
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)currentChunks.push(e.data)};
    recorder.onstop=()=>{
      const blob=new Blob(currentChunks,{type:recorder.mimeType||'audio/webm'});
      recordings[which]=blob;
      stream.getTracks().forEach(t=>t.stop());
      const idx=which==='one'?'1':'2';
      $(`record${idx}Status`).textContent=`Recorded · ${Math.max(1,Math.round(blob.size/1024))} KB`;
      const url=URL.createObjectURL(blob);
      $(`playback${idx}`).innerHTML='';
      const audio=document.createElement('audio');audio.controls=true;audio.src=url;audio.style.marginTop='12px';audio.style.width='100%';
      $(`playback${idx}`).appendChild(audio);
      $(`record${idx}`).disabled=false;$(`stop${idx}`).disabled=true;activeRecording=null;recorder=null;
    };
    recorder.start(500);
    const idx=which==='one'?'1':'2';
    $(`record${idx}`).disabled=true;$(`stop${idx}`).disabled=false;$(`record${idx}Status`).textContent='Recording…';
  }catch(err){alert(err.message||'Unable to start microphone.');activeRecording=null;}
}
function stopRecording(which){if(recorder&&activeRecording===which&&recorder.state!=='inactive')recorder.stop();}

function collectAnswers(id){
  const score=objectiveScore();
  return {
    schema_version:'wct-v1',attempt_id:id,created_at:new Date().toISOString(),time_used_seconds:TEST_SECONDS-remaining,
    candidate:{name:safe($('candidateName').value),email:safe($('candidateEmail').value),candidate_id:safe($('candidateId').value),cohort:safe($('cohort').value)},
    integrity_confirmed:$('integrityCheck').checked,
    answers:{listening:{l1:selected('l1'),l2:selected('l2'),l3:selected('l3'),l4:selected('l4')},reading:{r1:selected('r1'),r2:selected('r2'),r3:selected('r3'),r4:selected('r4')},writing:$('writing').value},
    objective_score:score,
    manual_scores:{writing:null,speaking:null,workplace_judgement:null},
    final_score:null,workplace_readiness_band:null,provisional_cefr_indicator:null,
    recordings:{speaking:!!recordings.one,workplace_situation:!!recordings.two},
    administration_note:'Controlled pilot. Final recruiter-readiness result requires evaluator scoring of writing and both spoken responses.'
  };
}

function completenessWarnings(){
  const missing=[];
  ['l1','l2','l3','l4','r1','r2','r3','r4'].forEach(k=>{if(!selected(k))missing.push(k)});
  const words=safe($('writing').value).split(/\s+/).filter(Boolean).length;
  if(words<80)missing.push('writing response is very short');
  if(!recordings.one)missing.push('Speak to Explain recording');
  if(!recordings.two)missing.push('Workplace Situation recording');
  return missing;
}

async function buildZip(data){
  if(typeof JSZip==='undefined')throw new Error('Submission packaging library did not load. Check your internet connection and try again.');
  const zip=new JSZip();
  zip.file('submission.json',JSON.stringify(data,null,2));
  const summary=[
    'ClarionPrep Workplace Communication Test',
    'Controlled Pilot · Version 1','',
    `Attempt ID: ${data.attempt_id}`,
    `Candidate: ${data.candidate.name}`,
    `Email: ${data.candidate.email}`,
    `Roll / Applicant ID: ${data.candidate.candidate_id}`,
    `Institution / Cohort / Campaign: ${data.candidate.cohort}`,'',
    `Listening: ${data.objective_score.listening}/20`,
    `Reading: ${data.objective_score.reading}/20`,
    `Objective subtotal: ${data.objective_score.total}/40`,'',
    'Writing, Speaking and Workplace Situation require evaluator scoring.',
    'Final total: pending /100','',
    'Powered by telw.co.in'
  ].join('\n');
  zip.file('candidate-summary.txt',summary);
  if(recordings.one)zip.file('speaking-explain.webm',recordings.one);
  if(recordings.two)zip.file('workplace-situation.webm',recordings.two);
  packageBlob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
  const clean=data.candidate.name.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'');
  packageName=`${data.attempt_id}_${clean||'candidate'}.zip`;
}

async function finishTest(auto=false){
  if(finished)return;
  if(activeRecording){alert('Please stop the active recording before submitting.');return;}
  const warnings=completenessWarnings();
  if(!auto&&warnings.length){
    const ok=confirm(`Some responses appear incomplete: ${warnings.join(', ')}. Submit anyway?`);
    if(!ok)return;
  }
  finished=true;clearInterval(timerHandle);
  if(currentListeningAudio){currentListeningAudio.pause();currentListeningAudio.currentTime=0;currentListeningAudio=null;}
  qsa('input,textarea,button',$('testForm')).forEach(el=>el.disabled=true);
  const id=attemptId(),data=collectAnswers(id);
  try{await buildZip(data);}catch(err){finished=false;alert(err.message);return;}
  $('testForm').classList.add('hidden');$('resultCard').classList.remove('hidden');
  const s=data.objective_score;
  $('resultSummary').innerHTML=`<p><strong>Attempt ID:</strong> ${id}</p><div class="scorebox"><div><span>Listening</span><strong>${s.listening}/20</strong></div><div><span>Reading</span><strong>${s.reading}/20</strong></div></div><p>Your current objective subtotal is <strong>${s.total}/40</strong>. Your final score and workplace-readiness band will be issued only after an evaluator scores your writing and two spoken responses.</p>${auto?'<p><strong>The 35-minute time limit expired, so the assessment was closed automatically.</strong></p>':''}`;
  window.scrollTo({top:$('resultCard').offsetTop-70,behavior:'smooth'});
}
function downloadPackage(){
  if(!packageBlob)return;
  const a=document.createElement('a');a.href=URL.createObjectURL(packageBlob);a.download=packageName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}

$('startBtn').addEventListener('click',startTest);
qsa('.audio-play').forEach(b=>b.addEventListener('click',()=>speakPassage(b.dataset.audio)));
$('writing').addEventListener('input',countWords);
$('record1').addEventListener('click',()=>startRecording('one'));
$('stop1').addEventListener('click',()=>stopRecording('one'));
$('record2').addEventListener('click',()=>startRecording('two'));
$('stop2').addEventListener('click',()=>stopRecording('two'));
$('submitBtn').addEventListener('click',()=>finishTest(false));
$('downloadBtn').addEventListener('click',downloadPackage);
window.addEventListener('beforeunload',e=>{if(started&&!finished){e.preventDefault();e.returnValue='';}});
window.addEventListener('unload',()=>{Object.values(listeningAudio).forEach(x=>{if(x&&x.url)URL.revokeObjectURL(x.url)});});
updateTimer();