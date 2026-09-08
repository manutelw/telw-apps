// ORACY Unit 1 speaking-coach overlay: task-aware discourse markers + warm learner feedback.
const ORACY_CORE_VOCAB=['native language','official language','at least','almost','majority'];
const ORACY_SPEAKING_RULES=[
  {type:'monologue',min:1,markers:['you know what','by the way','anyway']},
  {type:'monologue',min:1,markers:['you know what','by the way','anyway']},
  {type:'monologue',min:1,markers:['you know what','by the way','anyway']},
  {type:'dialogue',min:1,markers:['you bet','exactly','oh yeah','same here']},
  {type:'monologue',min:2,markers:['you know what','by the way','anyway']}
];
const ORACY_MARKER_LABELS={
  'you know what':'You know what?','by the way':'By the way','anyway':'Anyway',
  'you bet':'You bet!','exactly':'Exactly!','oh yeah':'Oh yeah!','really':'Really?','same here':'Same here'
};
function oracyNormalise(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function oracyHasMarker(transcript,marker){return oracyNormalise(transcript).includes(oracyNormalise(marker));}
function oracyMarkerExamples(type){
  return type==='dialogue'?
    [['Exactly!','Exactly! English really helps me when I travel.'],['Oh yeah!','Oh yeah! I use English with people from different places.'],['You bet!','You bet! I want to speak more confidently.'],['Same here','Same here. I practise English a little every day.']]:
    [['You know what?','You know what? I use English almost every day.'],['By the way','By the way, Hindi is my native language.'],['Anyway','Anyway, I want to keep practising so that I can speak more confidently.']];
}
function oracyPrepareSpeakingTasks(){
  document.querySelectorAll('.speak').forEach((box,index)=>{
    const rule=ORACY_SPEAKING_RULES[index]||ORACY_SPEAKING_RULES[0];
    box.dataset.markerType=rule.type;box.dataset.markerMin=String(rule.min);box.dataset.markerList=rule.markers.join('|');
    const button=box.querySelector('.record');if(!button||box.querySelector('.oracy-marker-guide'))return;
    if(index===3){
      const paras=box.querySelectorAll('p');
      if(paras[0])paras[0].innerHTML='<b>Coach: I find English really useful when I travel. Do you?</b>';
      if(paras[1])paras[1].textContent='Reply naturally, then explain why you are learning English. Use “so that I can …” too.';
      button.dataset.prompt='Reply to the coach: “I find English really useful when I travel. Do you?” Then explain why you are learning English and use so that I can.';
    }
    const labels=rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(' · ');
    const guide=document.createElement('div');guide.className='oracy-marker-guide';guide.style.cssText='margin:12px 0 4px;padding:11px 12px;border-radius:10px;background:#fff8e8;border:1px solid #efd7a0;line-height:1.45';
    guide.innerHTML=`<b>Make it sound natural.</b><div style="margin-top:4px">Try ${rule.min===1?'at least one':'at least two'} of these in your recording:</div><div style="margin-top:5px"><b>${safe(labels)}</b></div>`;
    button.parentNode.insertBefore(guide,button);
  });
}
function oracyScore(item){const n=Number(item?.score||0);return n>=1&&n<=3?n:0;}
function oracyWarmLevelText(level){
  const l=String(level||'B1');
  if(l==='A2'||l==='A2+')return `You’re working around ${l} today. You are getting your message across, which is a good base. Now let’s make the answer a little fuller, smoother and more varied.`;
  if(l==='B1'||l==='B1+')return `You’re working around ${l} today. Nice — your message is clear. Now let’s stretch it with a little more detail and some of the language from this unit.`;
  return `You’re working around ${l} today. Lovely progress. Keep the answer natural and keep using the new language rather than reaching for difficult words.`;
}
function oracyFriendlyRubric(rubric,rule,usedMarkers){
  const task=oracyScore(rubric?.task_achievement),range=oracyScore(rubric?.range),accuracy=oracyScore(rubric?.accuracy),fluency=oracyScore(rubric?.fluency),coherence=oracyScore(rubric?.coherence);
  const allowed=rule.markers.map(m=>ORACY_MARKER_LABELS[m]);
  const taskText=task===3?'You answered the task well and gave enough detail.':task===2?'You answered the question — good. On the next try, add one small example or one extra detail so I can picture what you mean.':'You have started the answer. Now make sure you cover every part of the question, one small point at a time.';
  const rangeText=range===3?'You used a nice mix of words and sentence patterns. Keep bringing the Unit 1 language into your own answers.':'Your words are clear and understandable. Now give yourself a little more variety. Try two Unit 1 expressions instead of repeating the same everyday words.';
  const accuracyText=accuracy===3?'Your sentences are well controlled for this level. Keep them simple and natural.':accuracy===2?'Most of your sentences are easy to understand. Good. On the next try, use short complete sentences and check one thing at a time rather than trying to make them complicated.':'I can understand your main idea. Let’s make the sentences smaller and cleaner: one idea, one sentence, then the next idea.';
  const fluencyText=fluency===3?'Your answer has a good sense of movement. Keep speaking in short thought-groups rather than word by word.':'You are keeping the answer moving. Next time, try this rhythm: say one idea, add one detail, then move to the next idea. Don’t rush.';
  const coherenceText=coherence===3?'Your ideas are easy to follow. Nice linking.':`Help your listener follow you. Put the ideas in a simple order, and use a natural signpost such as ${allowed.slice(0,2).join(' or ')} when it fits.`;
  const markerNames=usedMarkers.map(m=>ORACY_MARKER_LABELS[m]).join(', ');
  return [
    `<div><b>Your level today</b><br>${safe(oracyWarmLevelText(rubric?.cefr_estimate))}</div>`,
    `<div><b>Did you answer the task? ${task||'–'}/3</b><br>${safe(taskText)}</div>`,
    `<div><b>Your words and expressions ${range||'–'}/3</b><br>${safe(rangeText)}</div>`,
    `<div><b>Your sentences ${accuracy||'–'}/3</b><br>${safe(accuracyText)}</div>`,
    `<div><b>Your flow ${fluency||'–'}/3</b><br>${safe(fluencyText)}</div>`,
    `<div><b>Easy to follow? ${coherence||'–'}/3</b><br>${safe(coherenceText)}</div>`,
    `<div><b>Pronunciation</b><br>I’m not going to pretend I can score pronunciation from a transcript. Keep using the /w/–/v/ practice in this unit, and we’ll judge pronunciation only when the audio can be checked properly.</div>`,
    markerNames?`<div><b>Nice language choice</b><br>You used: ${safe(markerNames)}.</div>`:''
  ].filter(Boolean).join('<div style="height:10px"></div>');
}
function oracyRelevantSuggestions(rubric,rule){
  const suggested=Array.isArray(rubric?.suggested_vocabulary)?rubric.suggested_vocabulary:[];const allowed=new Set([...ORACY_CORE_VOCAB,...rule.markers]);
  const filtered=suggested.filter(v=>allowed.has(String(v?.item||'').toLowerCase())).slice(0,5);
  return filtered.length?filtered:[...ORACY_CORE_VOCAB,...rule.markers].slice(0,5).map(item=>({item,example:''}));
}
function oracyTeacherVoiceText(rubric,rule,passed,used){
  const level=String(rubric?.cefr_estimate||'B1');
  const task=oracyScore(rubric?.task_achievement);
  const taskText=task>=3?'You covered the task well. ':task===2?'You answered the question; now add one small example or detail. ':'Make sure you answer each part of the question. ';
  const usedText=used.length?`I liked hearing ${used.map(m=>ORACY_MARKER_LABELS[m]).join(' and ')} in your answer. `:'';
  const markerText=passed?'Lovely — you used the conversation language naturally. ':`You’re close. On your next recording, please use ${rule.min===1?'one':'two'} of these naturally: ${rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(', ')}. `;
  return `Nice try. You’re working around ${level} today. ${taskText}${usedText}${markerText}Keep your sentences short, clear and natural. You do not need fancy English. One clear idea, one useful detail, then the next idea. Give it another go — I’d love to hear the stronger version.`;
}
async function oracySpeakTeacherFeedback(box,text){
  try{
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'marin',instructions:'Speak as a warm, caring female English teacher encouraging a high-school learner. Sound soothing, cheerful, affectionate and genuinely pleased with the learner’s effort. Use lively but gentle intonation. Never sound formal, clinical or robotic.',unit_no:UNIT_NO})});
    if(!res.ok)return;const blob=await res.blob();if(box._oracyFeedbackUrl)URL.revokeObjectURL(box._oracyFeedbackUrl);const url=URL.createObjectURL(blob);box._oracyFeedbackUrl=url;
    let replay=box.querySelector('.oracy-hear-feedback');if(!replay){replay=document.createElement('button');replay.type='button';replay.className='oracy-hear-feedback';replay.textContent='🔊 Hear teacher feedback again';replay.style.marginTop='10px';box.querySelector('.feedback')?.appendChild(replay);}replay.onclick=()=>{new Audio(url).play().catch(()=>{});};new Audio(url).play().catch(()=>{});
  }catch{}
}
sendForFeedback=async function(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');mediaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Getting feedback…';
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error(await responseError(res,'Feedback'));const data=await res.json();const rubric=data.rubric||{};
    const rule={type:box.dataset.markerType||'monologue',min:Number(box.dataset.markerMin||1),markers:String(box.dataset.markerList||'').split('|').filter(Boolean)};const transcript=String(data.transcript||'');const used=rule.markers.filter(m=>oracyHasMarker(transcript,m));const passed=used.length>=rule.min;
    const examples=oracyMarkerExamples(rule.type).filter(([label])=>rule.markers.some(m=>ORACY_MARKER_LABELS[m]===label)).slice(0,3);
    const markerBlock=passed?`<div style="padding:10px 11px;border-radius:9px;background:#eef9f2;border:1px solid #b9dec7"><b>✓ Lovely — marker check passed.</b><div style="margin-top:4px">You used ${safe(used.map(m=>ORACY_MARKER_LABELS[m]).join(', '))} naturally.</div></div>`:`<div style="padding:10px 11px;border-radius:9px;background:#fff3e8;border:1px solid #efc49c"><b>Almost there — one more recording.</b><div style="margin-top:4px">This is a ${rule.type}. Use ${rule.min===1?'at least one':'at least two'} marker${rule.min===1?'':'s'} that fit this kind of speaking:</div><div style="margin-top:5px"><b>${safe(rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(' · '))}</b></div>${examples.map(([label,ex])=>`<div style="margin-top:5px"><b>${safe(label)}</b> — ${safe(ex)}</div>`).join('')}<div style="margin-top:7px"><b>Please record again until you can use the marker naturally.</b></div></div>`;
    const suggestions=oracyRelevantSuggestions(rubric,rule);const suggestionsHtml=suggestions.map(v=>`<div><b>${safe(v.item||'')}</b>${v.example?` — ${safe(v.example)}`:''}</div>`).join('');const model=data.improved?`<div style="margin-top:12px"><b>A stronger version could sound like this:</b><div style="margin-top:4px">${safe(data.improved)}</div></div>`:'';
    feedback.innerHTML=`<b>Coach feedback</b><div style="height:8px"></div>${markerBlock}<div style="height:12px"></div>${oracyFriendlyRubric(rubric,rule,used)}<div style="height:12px"></div><div><b>Useful Unit 1 language for your next try</b>${suggestionsHtml}</div>${model}`;
    await oracySpeakTeacherFeedback(box,oracyTeacherVoiceText(rubric,rule,passed,used));status.textContent=passed?'Nice work. Recording discarded after feedback.':`Try again — use ${rule.min===1?'one':'two'} suitable discourse marker${rule.min===1?'':'s'}.`;btn.textContent=passed?'🎤 Record again':'🎤 Try again with the marker';
  }catch(error){status.textContent=(error.message||'Feedback request could not be completed.')+' Your recording has been discarded.';}finally{chunks=[];recorder=null;activeButton=null;btn.classList.remove('live');}
};
oracyPrepareSpeakingTasks();
