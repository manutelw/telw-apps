// ORACY Unit 1: three themed speaking gyms, five reps per Key Point, five vocabulary items per Key Point.
const ORACY_MARKER_LABELS={
  'you know what':'You know what?','by the way':'By the way','anyway':'Anyway',
  'you bet':'You bet!','exactly':'Exactly!','oh yeah':'Oh yeah!','really':'Really?','same here':'Same here'
};
const ORACY_MONO_MARKERS=['you know what','by the way','anyway'];
const ORACY_DIALOGUE_MARKERS=['you bet','exactly','oh yeah','same here'];
const ORACY_KP_CONFIG=[
  {
    key:'kp1',title:'Languages around you',
    vocab:['native language','official language','at least','almost','majority'],
    vocabNote:'Use these to describe the languages you hear, use and notice around you.',
    reps:[
      ['Free answer','Languages in your world','Speak for 30–40 seconds about the languages around you. Say what you hear or use at home, work, college, your street or your town.','Speak for 30 to 40 seconds about the languages around you. Say what you hear or use at home, work, college, your street or your town.'],
      ['Compress','Same idea. Less time.','Give the same message in 20–25 seconds. Keep only the strongest details and use at least one Key Point 1 vocabulary item.','Give the same message about languages around you in 20 to 25 seconds. Keep only the strongest details and use at least one of these words: native language, official language, at least, almost, majority.'],
      ['Target language','Use the vocabulary','Answer again in 25–30 seconds. This time use at least three of the five Key Point 1 vocabulary items.','Answer again about languages around you in 25 to 30 seconds. Use at least three of these five items naturally: native language, official language, at least, almost, majority.'],
      ['React','The coach pushes back','Complete Rep 3 first. The coach will challenge something you actually said. Respond directly in 20–30 seconds.','Respond directly to the coach challenge about languages around you in 20 to 30 seconds. Do not restart your old answer.'],
      ['Pressure finish','Land the point','Final rep: about 20 seconds. Give one clear picture of the language situation around you and use at least two Key Point 1 vocabulary items.','In about 20 seconds, give one clear picture of the language situation around you. Use at least two Key Point 1 vocabulary items and finish decisively.']
    ]
  },
  {
    key:'kp2',title:'Why you use and learn English',
    vocab:['goal','practise','improve','communicate','confidence'],
    vocabNote:'These words help you talk about purpose, progress and the reason English matters to you.',
    reps:[
      ['Free answer','Why English matters to you','Speak for 30–40 seconds about what you use English for and why you are learning it.','Speak for 30 to 40 seconds about what you use English for and why you are learning it.'],
      ['Compress','Keep the purpose clear','Give the same answer in 20–25 seconds. Keep one main purpose and one useful detail.','Give the same answer about why you use and learn English in 20 to 25 seconds. Keep one main purpose and one useful detail.'],
      ['Target language','Use the purpose patterns','Answer again in 25–30 seconds. Use at least two of these patterns: “I use … for -ing”, “I need … to …”, “I’m learning … to …”, “so that I can …”. Also use at least two Key Point 2 vocabulary items.','Answer again in 25 to 30 seconds. Use at least two purpose patterns: I use ... for -ing, I need ... to, I am learning ... to, so that I can. Also use at least two of these words: goal, practise, improve, communicate, confidence.'],
      ['React','Defend the reason','Complete Rep 3 first. The coach will question one of your reasons. Respond directly in 20–30 seconds and explain why it matters.','Respond directly to the coach challenge about why English matters to you. Explain or defend your reason in 20 to 30 seconds.'],
      ['Pressure finish','Purpose in 20 seconds','Final rep: about 20 seconds. Say what you need English for, why, and what you want to improve. Use one purpose pattern and at least two Key Point 2 vocabulary items.','In about 20 seconds, say what you need English for, why, and what you want to improve. Use one purpose pattern and at least two of these words: goal, practise, improve, communicate, confidence.']
    ]
  },
  {
    key:'kp3',title:'/w/ and /v/ in real speech',
    vocab:['work','world','visit','video','travel'],
    vocabNote:'These are useful everyday words that also let you practise the /w/–/v/ contrast inside real sentences.',
    reps:[
      ['Free answer','Talk about your week','Speak for 30–40 seconds about work, people you visit, videos you watch, or places you want to travel to.','Speak for 30 to 40 seconds about work, people you visit, videos you watch, or places you want to travel to.'],
      ['Compress','Same message. Cleaner sounds.','Give the same message in 20–25 seconds. Keep your pace calm and make the /w/ and /v/ words clear.','Give the same message in 20 to 25 seconds. Keep your pace calm and make the w and v words clear.'],
      ['Target language','Use all five sound words','Answer again in 25–30 seconds and naturally use all five words: work, world, visit, video, travel.','Answer again in 25 to 30 seconds and naturally use all five words: work, world, visit, video, travel.'],
      ['React','Answer without losing clarity','Complete Rep 3 first. The coach will react to one detail you gave. Respond in 20–30 seconds while keeping the target /w/ and /v/ words clear.','Respond directly to the coach challenge in 20 to 30 seconds. Keep the target w and v words clear in connected speech.'],
      ['Pressure finish','Clear under pressure','Final rep: about 20 seconds. Give one concise message using at least three of the five target words. Keep the sounds distinct without slowing down unnaturally.','In about 20 seconds, give one concise message using at least three of these words: work, world, visit, video, travel. Keep w and v distinct without slowing down unnaturally.']
    ]
  }
];
function oracyNorm(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function oracyWords(v){return oracyNorm(v).split(' ').filter(Boolean);}
function oracyHas(text,item){return oracyNorm(text).includes(oracyNorm(item));}
function oracyPurposeCount(text){
  const t=oracyNorm(text);let n=0;
  if(/\bi use\b.{0,70}\bfor\b/.test(t))n++;
  if(/\bi need\b.{0,70}\bto\b/.test(t))n++;
  if(/\bi(?:'m| am) learning\b.{0,70}\bto\b/.test(t))n++;
  if(/so that i can\b/.test(t))n++;
  return n;
}
function oracyChallenge(kp,transcript){
  const clean=String(transcript||'').replace(/\s+/g,' ').trim();
  const short=clean.length>95?clean.slice(0,92).replace(/\s+\S*$/,'')+'…':clean;
  if(kp===0){
    if(/english/.test(oracyNorm(transcript)))return 'Coach: You mentioned English. Is it actually necessary in your daily life, or just useful sometimes?';
    return short?`Coach: You said, “${short}” What is one real example that proves this?`:'Coach: Give me one real example of when you notice or use these languages.';
  }
  if(kp===1){
    if(/travel/.test(oracyNorm(transcript)))return 'Coach: Translation apps can help when you travel. Why do you still want to speak English yourself?';
    if(/work|job|office|client|customer/.test(oracyNorm(transcript)))return 'Coach: If your colleagues understand your first language, why do you still need English at work?';
    return short?`Coach: You said, “${short}” Why is that reason important enough for you to keep practising?`:'Coach: What is the strongest reason for you to keep improving your English?';
  }
  if(/work/.test(oracyNorm(transcript)))return 'Coach: You mentioned work. Tell me one situation at work where clear English really matters.';
  if(/travel/.test(oracyNorm(transcript)))return 'Coach: You mentioned travel. What would you most like to be able to do confidently when you travel?';
  return short?`Coach: You said, “${short}” Add one more detail without losing your clear /w/ and /v/ sounds.`:'Coach: Add one more detail using a word with /w/ and a word with /v/.';
}
function oracyMakeSpeak(kpIndex,repIndex,spec){
  const box=document.createElement('div');box.className='speak';box.dataset.kpIndex=String(kpIndex);box.dataset.repIndex=String(repIndex);
  box.innerHTML=`<div class="eyebrow">Rep ${repIndex+1} · ${safe(spec[0])}</div><p><b>${safe(spec[1])}</b></p><p>${safe(spec[2])}</p>${repIndex===3?'<div class="oracy-reactive-challenge" style="margin:12px 0;padding:12px;border-radius:10px;background:#eef4ff;border:1px solid #b8caee;line-height:1.45"><b>Coach challenge</b><div style="margin-top:5px">Complete Rep 3 first. I will react to something you actually said.</div></div>':''}<button class="record" data-prompt="${safe(spec[3])}">🎤 Start Rep ${repIndex+1}</button><div class="oracy-rep-lock" style="margin:8px 0;font-size:.92rem"></div><div class="status"></div><div class="feedback"></div>`;
  return box;
}
function oracyBuildUnit(){
  const hero=document.querySelector('.hero p');if(hero)hero.innerHTML='<b>Unit design:</b> 3 Key Points · 5 vocabulary items in each · 5 speaking reps in each = <b>15 vocabulary items and 15 speaking reps.</b>';
  const sections=[...document.querySelectorAll('section.kp')].slice(0,3);
  sections.forEach((section,kpIndex)=>{
    section.querySelectorAll('.speak').forEach(x=>x.remove());
    const cfg=ORACY_KP_CONFIG[kpIndex];if(!cfg)return;
    const oldChips=section.querySelector('.chips');if(oldChips)oldChips.remove();
    const vocab=document.createElement('div');vocab.className='activity oracy-vocab-five';
    vocab.innerHTML=`<div class="eyebrow">Vocabulary · 5 items</div><h3>Five useful items for this Key Point</h3><div class="chips">${cfg.vocab.map(v=>`<span>${safe(v)}</span>`).join('')}</div><p>${safe(cfg.vocabNote)}</p>`;
    const heading=section.querySelector('h2');if(heading)heading.insertAdjacentElement('afterend',vocab);
    const gym=document.createElement('div');gym.className='oracy-speaking-gym';gym.dataset.kpIndex=String(kpIndex);
    gym.innerHTML=`<div class="eyebrow">Speaking Gym · Key Point ${kpIndex+1} · 5 reps</div><h3>${safe(cfg.title)}</h3><p>Repeat the same skill under changing constraints. Complete each rep to unlock the next one.</p>`;
    cfg.reps.forEach((spec,repIndex)=>gym.appendChild(oracyMakeSpeak(kpIndex,repIndex,spec)));
    section.appendChild(gym);
  });
}
function oracyBox(kp,rep){return document.querySelector(`.speak[data-kp-index="${kp}"][data-rep-index="${rep}"]`);}
function oracySetLock(kp,rep,locked){
  const box=oracyBox(kp,rep);if(!box)return;const btn=box.querySelector('.record');const note=box.querySelector('.oracy-rep-lock');
  if(btn)btn.disabled=locked;if(note)note.textContent=locked?`Complete Rep ${rep} successfully first.`:'Ready for this rep.';
}
function oracyPrepare(){
  oracyBuildUnit();
  for(let kp=0;kp<3;kp++){oracySetLock(kp,0,false);for(let rep=1;rep<5;rep++)oracySetLock(kp,rep,true);}
}
function oracyConstraint(kp,rep,text){
  const cfg=ORACY_KP_CONFIG[kp];const words=oracyWords(text).length;const hits=cfg.vocab.filter(v=>oracyHas(text,v));
  if(rep===0)return {passed:true,msg:'Free rep complete. Now repeat the same skill with a tighter constraint.',hits};
  if(rep===1)return {passed:words<=60&&hits.length>=1,msg:words>60?'Compress the message further.':hits.length<1?'Use at least one vocabulary item from this Key Point.':'Compression constraint passed.',hits};
  if(rep===2){
    if(kp===0)return {passed:hits.length>=3,msg:hits.length>=3?'Target-language constraint passed.':'Use at least three of the five Key Point 1 vocabulary items.',hits};
    if(kp===1){const pc=oracyPurposeCount(text);return {passed:hits.length>=2&&pc>=2,msg:pc<2?'Use at least two purpose patterns.':hits.length<2?'Use at least two Key Point 2 vocabulary items.':'Target-language constraint passed.',hits};}
    return {passed:hits.length>=5,msg:hits.length>=5?'All five sound words used.':'Use all five words: work, world, visit, video, travel.',hits};
  }
  if(rep===3)return {passed:words>=8,msg:words>=8?'Reactive rep complete.':'Respond directly with a fuller answer, not just a short phrase.',hits};
  if(kp===1){const pc=oracyPurposeCount(text);return {passed:words<=55&&hits.length>=2&&pc>=1,msg:pc<1?'Use one purpose pattern.':hits.length<2?'Use at least two Key Point 2 vocabulary items.':words>55?'Land it faster. Keep the final rep concise.':'Pressure finish passed.',hits};}
  if(kp===2)return {passed:words<=55&&hits.length>=3,msg:hits.length<3?'Use at least three target words.':words>55?'Land it faster. Keep the final rep concise.':'Pressure finish passed.',hits};
  return {passed:words<=55&&hits.length>=2,msg:hits.length<2?'Use at least two Key Point 1 vocabulary items.':words>55?'Land it faster. Keep the final rep concise.':'Pressure finish passed.',hits};
}
function oracyFriendlyRubric(rubric){
  const score=x=>{const n=Number(x?.score||0);return n>=1&&n<=3?n:'–';};
  return `<div><b>Task ${score(rubric?.task_achievement)}/3</b> · ${safe(rubric?.task_achievement?.comment||'')}</div><div><b>Range ${score(rubric?.range)}/3</b> · ${safe(rubric?.range?.comment||'')}</div><div><b>Accuracy ${score(rubric?.accuracy)}/3</b> · ${safe(rubric?.accuracy?.comment||'')}</div><div><b>Flow ${score(rubric?.fluency)}/3</b> · ${safe(rubric?.fluency?.comment||'')}</div><div><b>Coherence ${score(rubric?.coherence)}/3</b> · ${safe(rubric?.coherence?.comment||'')}</div>`;
}
async function oracySpeakFeedback(box,text){
  try{const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'marin',instructions:'Warm, encouraging adult English teacher. Clear B1-friendly pace. Short and natural.',unit_no:UNIT_NO})});if(!res.ok)return;const blob=await res.blob();const url=URL.createObjectURL(blob);new Audio(url).play().catch(()=>{});}catch{}
}
sendForFeedback=async function(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');mediaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Getting feedback…';
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error(await responseError(res,'Feedback'));const data=await res.json();const transcript=String(data.transcript||'');const rubric=data.rubric||{};
    const kp=Number(box.dataset.kpIndex||0),rep=Number(box.dataset.repIndex||0);const check=oracyConstraint(kp,rep,transcript);const cfg=ORACY_KP_CONFIG[kp];
    if(check.passed&&rep===2){const challenge=oracyChallenge(kp,transcript);const next=oracyBox(kp,3);const challengeBox=next?.querySelector('.oracy-reactive-challenge');const nextBtn=next?.querySelector('.record');if(challengeBox)challengeBox.innerHTML=`<b>Coach challenge — based on your Rep 3 answer</b><div style="margin-top:5px">${safe(challenge)}</div>`;if(nextBtn)nextBtn.dataset.prompt=`${challenge} Respond directly in 20 to 30 seconds. Do not restart your old answer.`;}
    if(check.passed&&rep<4)oracySetLock(kp,rep+1,false);
    const used=check.hits.length?check.hits.join(', '):'none yet';
    const stronger=data.improved?`<div style="margin-top:10px"><b>A stronger version could sound like this:</b><div>${safe(data.improved)}</div></div>`:'';
    feedback.innerHTML=`<b>Coach feedback · Key Point ${kp+1} · Rep ${rep+1}</b><div style="margin-top:8px;padding:10px;border-radius:9px;background:${check.passed?'#eef9f2':'#fff3e8'};border:1px solid ${check.passed?'#b9dec7':'#efc49c'}"><b>${check.passed?'✓ Rep constraint passed':'Rep constraint not met yet'}</b><div style="margin-top:4px">${safe(check.msg)}</div><div style="margin-top:4px"><b>Target vocabulary heard:</b> ${safe(used)}</div></div><div style="margin-top:12px">${oracyFriendlyRubric(rubric)}</div>${stronger}`;
    const spoken=check.passed?(rep===4?`Key Point ${kp+1} speaking gym complete. Five reps finished.`:`Good. Rep ${rep+1} is complete. Rep ${rep+2} is ready.`):`Try Rep ${rep+1} again. ${check.msg}`;
    await oracySpeakFeedback(box,spoken);status.textContent=spoken;btn.textContent=check.passed?'🎤 Record again':'🎤 Try this rep again';
  }catch(error){status.textContent=(error.message||'Feedback request could not be completed.')+' Your recording has been discarded.';}finally{chunks=[];recorder=null;activeButton=null;btn.classList.remove('live');}
};
oracyPrepare();
