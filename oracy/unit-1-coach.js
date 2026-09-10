// ORACY Unit 1 speaking-gym overlay: repeated reps, escalating constraints, reactive coach challenge and warm learner feedback.
const ORACY_CORE_VOCAB=['native language','official language','at least','almost','majority'];
const ORACY_SPEAKING_RULES=[
  {type:'monologue',min:0,markers:[],constraint:'free'},
  {type:'monologue',min:1,markers:['you know what','by the way','anyway'],constraint:'compress'},
  {type:'monologue',min:1,markers:['you know what','by the way','anyway'],constraint:'purpose'},
  {type:'dialogue',min:1,markers:['you bet','exactly','oh yeah','same here'],constraint:'react'},
  {type:'monologue',min:2,markers:['you know what','by the way','anyway'],constraint:'pressure'}
];
const ORACY_MARKER_LABELS={
  'you know what':'You know what?','by the way':'By the way','anyway':'Anyway',
  'you bet':'You bet!','exactly':'Exactly!','oh yeah':'Oh yeah!','really':'Really?','same here':'Same here'
};
function oracyNormalise(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function oracyHasMarker(transcript,marker){return oracyNormalise(transcript).includes(oracyNormalise(marker));}
function oracyWordCount(transcript){return oracyNormalise(transcript).split(' ').filter(Boolean).length;}
function oracyHasPurposePattern(transcript){
  const t=oracyNormalise(transcript);
  return /so that i can\b/.test(t)||/\bi need\b.{0,55}\bto\b/.test(t)||/\bi(?:'m| am) learning\b.{0,55}\bto\b/.test(t)||/\bi use\b.{0,55}\bfor\b/.test(t);
}
function oracyMarkerExamples(type){
  return type==='dialogue'?
    [['Exactly!','Exactly! English really helps me when I travel.'],['Oh yeah!','Oh yeah! I use English with people from different places.'],['You bet!','You bet! I want to speak more confidently.'],['Same here','Same here. I practise English a little every day.']]:
    [['You know what?','You know what? I use English almost every day.'],['By the way','By the way, Hindi is my native language.'],['Anyway','Anyway, I want to keep practising so that I can speak more confidently.']];
}
function oracyChallengeFromTranscript(transcript){
  const t=oracyNormalise(transcript);
  if(/travel|trip|airport|hotel|tour/.test(t))return 'Coach: You said English helps when you travel. But translation apps can help too. Why is speaking English still useful for you?';
  if(/work|job|office|client|customer|colleague|meeting/.test(t))return 'Coach: You said English matters at work. But if people around you understand your native language, why do you still need English?';
  if(/video|movie|film|youtube|series|watch/.test(t))return 'Coach: You said you use English for videos. Why not just use subtitles or translated versions?';
  if(/teacher|school|college|class|study|student/.test(t))return 'Coach: You said English helps with study or teachers. What happens when something important is not clear to you?';
  if(/home|family|mother|father|daughter|son|wife|husband/.test(t))return 'Coach: You said you mostly use your native language at home. So where do you really need English outside home?';
  const clean=String(transcript||'').replace(/\s+/g,' ').trim();
  const short=clean.length>95?clean.slice(0,92).replace(/\s+\S*$/,'')+'…':clean;
  return short?`Coach: You said, “${short}” Give me one real situation that proves why this matters to you.`:'Coach: Give me one real situation where English is useful to you. Why does it matter?';
}
function oracyRewriteSpeakingGym(){
  const hero=document.querySelector('.hero p');
  if(hero)hero.innerHTML='<b>Speaking Gym:</b> learn the language, then repeat the same core message five times under changing pressure. You do not finish by speaking once.';
  const tasks=[...document.querySelectorAll('.speak')];
  const specs=[
    {label:'Rep 1 · Free answer',title:'English in your world',body:'Speak naturally for 30–40 seconds. Tell us which languages are around you, where you use English, and why English matters to you.',prompt:'Rep 1 free answer: Speak naturally for 30 to 40 seconds about English in your world. Say which languages are around you, where you use English, and why English matters to you.'},
    {label:'Rep 2 · Compress',title:'Same message. Less time.',body:'Now give the same message in 20–25 seconds. Keep only the most important ideas. Use at least one natural conversation marker.',prompt:'Rep 2 compression: Give the same core answer about English in your world in 20 to 25 seconds. Keep only the most important ideas and use at least one natural discourse marker.'},
    {label:'Rep 3 · Structure constraint',title:'Make the purpose clear',body:'Answer again in 25–30 seconds. This time you must use at least one purpose pattern: “I use … for -ing”, “I need … to …”, “I’m learning … to …”, or “so that I can …”.',prompt:'Rep 3 structure constraint: Answer again in 25 to 30 seconds about English in your world. You must use at least one purpose pattern: I use ... for -ing, I need ... to, I am learning ... to, or so that I can. Also use one natural discourse marker.'},
    {label:'Rep 4 · React',title:'The coach pushes back',body:'Complete Rep 3 first. The coach will challenge something you actually said. Respond directly, do not restart your old answer, and defend or clarify your point in 20–30 seconds.',prompt:'Rep 4 reactive challenge: Respond directly to the coach challenge. Defend or clarify your point in 20 to 30 seconds and use one natural dialogue marker.'},
    {label:'Rep 5 · Pressure finish',title:'Land the answer',body:'Final rep: 20 seconds. Give your position, one useful detail, and why it matters. Use one purpose pattern and at least two natural discourse markers. No long introduction.',prompt:'Rep 5 pressure finish: In about 20 seconds, give your clearest final answer about English in your world. Give your position, one useful detail and why it matters. Use one purpose pattern and at least two natural discourse markers. No long introduction.'}
  ];
  tasks.forEach((box,index)=>{
    const spec=specs[index];if(!spec)return;
    box.dataset.repIndex=String(index);box.dataset.constraint=ORACY_SPEAKING_RULES[index].constraint;
    const eyebrow=box.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=spec.label;
    const paras=box.querySelectorAll('p');
    if(paras[0])paras[0].innerHTML=`<b>${spec.title}</b>`;
    if(paras[1])paras[1].textContent=spec.body;else{const p=document.createElement('p');p.textContent=spec.body;box.querySelector('.record')?.before(p);}
    const button=box.querySelector('.record');if(button){button.dataset.prompt=spec.prompt;button.textContent=index===0?'🎤 Start Rep 1':`🎤 Start Rep ${index+1}`;}
    if(index===3&&!box.querySelector('.oracy-reactive-challenge')){
      const challenge=document.createElement('div');challenge.className='oracy-reactive-challenge';challenge.style.cssText='margin:12px 0;padding:12px;border-radius:10px;background:#eef4ff;border:1px solid #b8caee;line-height:1.45';challenge.innerHTML='<b>Coach challenge</b><div style="margin-top:5px">Complete Rep 3 first. I will react to something you actually said.</div>';button?.before(challenge);
    }
  });
  const main=document.querySelector('main.shell');
  if(main&&tasks.length===5&&!document.querySelector('.oracy-speaking-gym')){
    const gym=document.createElement('section');
    gym.className='kp oracy-speaking-gym';
    gym.innerHTML='<div class="eyebrow">Speaking Gym · 5 reps</div><h2>One message. Five increasingly difficult versions.</h2><p>Complete the teaching sections above, then work through all five reps here. Each rep unlocks the next one.</p>';
    main.appendChild(gym);
    tasks.forEach(box=>gym.appendChild(box));
  }
}
function oracySetRepLock(index,locked,message){
  const box=[...document.querySelectorAll('.speak')][index];if(!box)return;const btn=box.querySelector('.record');if(!btn)return;
  btn.disabled=Boolean(locked);
  let note=box.querySelector('.oracy-rep-lock');
  if(!note){note=document.createElement('div');note.className='oracy-rep-lock';note.style.cssText='margin:8px 0;font-size:.92rem';btn.before(note);}
  note.textContent=locked?(message||`Complete Rep ${index} first.`):'Ready for this rep.';
}
function oracyPrepareSpeakingTasks(){
  oracyRewriteSpeakingGym();
  document.querySelectorAll('.speak').forEach((box,index)=>{
    const rule=ORACY_SPEAKING_RULES[index]||ORACY_SPEAKING_RULES[0];
    box.dataset.markerType=rule.type;box.dataset.markerMin=String(rule.min);box.dataset.markerList=rule.markers.join('|');
    const button=box.querySelector('.record');if(!button||box.querySelector('.oracy-marker-guide'))return;
    if(rule.min>0){
      const labels=rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(' · ');
      const guide=document.createElement('div');guide.className='oracy-marker-guide';guide.style.cssText='margin:12px 0 4px;padding:11px 12px;border-radius:10px;background:#fff8e8;border:1px solid #efd7a0;line-height:1.45';
      guide.innerHTML=`<b>Language constraint</b><div style="margin-top:4px">Use ${rule.min===1?'at least one':'at least two'} naturally:</div><div style="margin-top:5px"><b>${safe(labels)}</b></div>`;
      button.parentNode.insertBefore(guide,button);
    }
  });
  [1,2,3,4].forEach(i=>oracySetRepLock(i,true,`Complete Rep ${i} successfully first.`));
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
  const coherenceText=coherence===3?'Your ideas are easy to follow. Nice linking.':allowed.length?`Help your listener follow you. Put the ideas in a simple order, and use a natural signpost such as ${allowed.slice(0,2).join(' or ')} when it fits.`:'Help your listener follow you. Put the ideas in a simple order: main point, useful detail, then why it matters.';
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
  const markerText=rule.min===0?'':passed?'Lovely — you met the language constraint. ':`You’re close. On your next recording, please use ${rule.min===1?'one':'two'} of these naturally: ${rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(', ')}. `;
  return `Nice try. You’re working around ${level} today. ${taskText}${usedText}${markerText}Keep your sentences short, clear and natural. One clear idea, one useful detail, then the next idea.`;
}
async function oracySpeakTeacherFeedback(box,text){
  try{
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'marin',instructions:'Speak as a warm, caring female English teacher encouraging an adult English learner. Sound soothing, cheerful and genuinely pleased with the learner’s effort. Use lively but gentle intonation. Never sound formal, clinical or robotic.',unit_no:UNIT_NO})});
    if(!res.ok)return;const blob=await res.blob();if(box._oracyFeedbackUrl)URL.revokeObjectURL(box._oracyFeedbackUrl);const url=URL.createObjectURL(blob);box._oracyFeedbackUrl=url;
    let replay=box.querySelector('.oracy-hear-feedback');if(!replay){replay=document.createElement('button');replay.type='button';replay.className='oracy-hear-feedback';replay.textContent='🔊 Hear teacher feedback again';replay.style.marginTop='10px';box.querySelector('.feedback')?.appendChild(replay);}replay.onclick=()=>{new Audio(url).play().catch(()=>{});};new Audio(url).play().catch(()=>{});
  }catch{}
}
function oracyConstraintCheck(repIndex,transcript,markerPassed){
  const words=oracyWordCount(transcript);
  if(repIndex===0)return {passed:true,text:'Free rep complete. Now compress the same message.'};
  if(repIndex===1){const ok=markerPassed&&words<=60;return {passed:ok,text:!markerPassed?'Use one natural discourse marker.':words>60?'Good content, but this rep is about compression. Cut it to roughly 60 words or fewer.':'Compression constraint passed.'};}
  if(repIndex===2){const purpose=oracyHasPurposePattern(transcript);const ok=markerPassed&&purpose;return {passed:ok,text:!purpose?'Use at least one purpose pattern: I use … for -ing, I need … to …, I’m learning … to …, or so that I can …':!markerPassed?'Use one natural discourse marker too.':'Structure constraint passed.'};}
  if(repIndex===3)return {passed:markerPassed,text:markerPassed?'Reactive rep complete.':'Respond again and use one natural dialogue marker.'};
  if(repIndex===4){const purpose=oracyHasPurposePattern(transcript);const ok=markerPassed&&purpose&&words<=55;return {passed:ok,text:!purpose?'Use one purpose pattern in the final rep.':!markerPassed?'Use at least two natural discourse markers.':words>55?'Land it faster: keep the final rep to roughly 55 words or fewer.':'Pressure finish passed.'};}
  return {passed:markerPassed,text:''};
}
sendForFeedback=async function(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');mediaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Getting feedback…';
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error(await responseError(res,'Feedback'));const data=await res.json();const rubric=data.rubric||{};
    const rule={type:box.dataset.markerType||'monologue',min:Number(box.dataset.markerMin||0),markers:String(box.dataset.markerList||'').split('|').filter(Boolean)};const transcript=String(data.transcript||'');const used=rule.markers.filter(m=>oracyHasMarker(transcript,m));const markerPassed=used.length>=rule.min;
    const repIndex=Number(box.dataset.repIndex||0);const constraint=oracyConstraintCheck(repIndex,transcript,markerPassed);const passed=constraint.passed;
    const examples=oracyMarkerExamples(rule.type).filter(([label])=>rule.markers.some(m=>ORACY_MARKER_LABELS[m]===label)).slice(0,3);
    const markerBlock=rule.min===0?`<div style="padding:10px 11px;border-radius:9px;background:#eef9f2;border:1px solid #b9dec7"><b>✓ Rep recorded.</b><div style="margin-top:4px">This first rep is deliberately free. The next rep adds pressure.</div></div>`:markerPassed?`<div style="padding:10px 11px;border-radius:9px;background:#eef9f2;border:1px solid #b9dec7"><b>✓ Language marker passed.</b><div style="margin-top:4px">You used ${safe(used.map(m=>ORACY_MARKER_LABELS[m]).join(', '))}.</div></div>`:`<div style="padding:10px 11px;border-radius:9px;background:#fff3e8;border:1px solid #efc49c"><b>Language constraint not met yet.</b><div style="margin-top:4px">Use ${rule.min===1?'at least one':'at least two'}:</div><div style="margin-top:5px"><b>${safe(rule.markers.map(m=>ORACY_MARKER_LABELS[m]).join(' · '))}</b></div>${examples.map(([label,ex])=>`<div style="margin-top:5px"><b>${safe(label)}</b> — ${safe(ex)}</div>`).join('')}</div>`;
    const constraintBlock=`<div style="margin-top:10px;padding:10px 11px;border-radius:9px;background:${passed?'#eef9f2':'#fff3e8'};border:1px solid ${passed?'#b9dec7':'#efc49c'}"><b>${passed?'✓ Rep constraint passed':'Rep constraint not met yet'}</b><div style="margin-top:4px">${safe(constraint.text)}</div></div>`;
    const suggestions=oracyRelevantSuggestions(rubric,rule);const suggestionsHtml=suggestions.map(v=>`<div><b>${safe(v.item||'')}</b>${v.example?` — ${safe(v.example)}`:''}</div>`).join('');const model=data.improved?`<div style="margin-top:12px"><b>A stronger version could sound like this:</b><div style="margin-top:4px">${safe(data.improved)}</div></div>`:'';
    feedback.innerHTML=`<b>Coach feedback · Rep ${repIndex+1}</b><div style="height:8px"></div>${markerBlock}${constraintBlock}<div style="height:12px"></div>${oracyFriendlyRubric(rubric,rule,used)}<div style="height:12px"></div><div><b>Useful Unit 1 language for your next try</b>${suggestionsHtml}</div>${model}`;
    if(passed&&repIndex===2){
      const challenge=oracyChallengeFromTranscript(transcript);const next=[...document.querySelectorAll('.speak')][3];const challengeBox=next?.querySelector('.oracy-reactive-challenge');const nextBtn=next?.querySelector('.record');
      if(challengeBox)challengeBox.innerHTML=`<b>Coach challenge — based on your Rep 3 answer</b><div style="margin-top:5px">${safe(challenge)}</div>`;
      if(nextBtn)nextBtn.dataset.prompt=`Rep 4 reactive challenge. ${challenge} Respond directly to this challenge in 20 to 30 seconds. Do not restart your old answer. Defend or clarify your point and use one natural dialogue marker.`;
    }
    if(passed&&repIndex<4)oracySetRepLock(repIndex+1,false);
    await oracySpeakTeacherFeedback(box,oracyTeacherVoiceText(rubric,rule,passed,used));status.textContent=passed?(repIndex===4?'Speaking Gym complete. Five reps finished.':`Rep ${repIndex+1} complete. Rep ${repIndex+2} is unlocked.`):'Repeat this rep until you meet the constraint.';btn.textContent=passed?'🎤 Record again':'🎤 Try this rep again';
  }catch(error){status.textContent=(error.message||'Feedback request could not be completed.')+' Your recording has been discarded.';}finally{chunks=[];recorder=null;activeButton=null;btn.classList.remove('live');}
};
oracyPrepareSpeakingTasks();
