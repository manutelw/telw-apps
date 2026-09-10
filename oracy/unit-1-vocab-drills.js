// ORACY Unit 1 vocabulary drills: 5 vocabulary items per Key Point, 3 learner turns per item.
// Turn pattern: 1 = question-answer; 2 and 3 = statement-response.
const ORACY_VOCAB_DRILLS=[
 {kp:0,structure:'Key Point 1 structure: use the target vocabulary in a natural quantity or description pattern.',items:[
  {target:'native language',stress:'Stress NATIVE: NAY-tiv language.',model:['A: What is your native language?','B: Hindi is my native language. What about yours?','A: Punjabi is my native language.','B: Oh yeah? That’s interesting.'],prompts:[
   {type:'question',text:'What is your native language? Use “native language”.'},
   {type:'statement',text:'Most people around me speak Hindi as their native language.'},
   {type:'statement',text:'My closest colleague has a different native language from mine.'}
  ]},
  {target:'official language',stress:'Stress OFFICIAL: uh-FISH-uhl language.',model:['A: Which official language do you use most at work?','B: I use English most. What about you?','A: I use Hindi more often.','B: Right, that makes sense.'],prompts:[
   {type:'question',text:'Which official language do you use most often? Use “official language”.'},
   {type:'statement',text:'Public signs in my area use more than one official language.'},
   {type:'statement',text:'At work, one official language is used much more than the others.'}
  ]},
  {target:'at least',stress:'Stress LEAST: at LEAST.',model:['A: How many students completed their assignments in your class?','B: Well, I’d say at least 8 have. What about in your class?','A: Hmm. I’m going to go with at least 12.','B: Well, that’s great!'],prompts:[
   {type:'question',text:'How many business people live in your colony? Use “at least”.'},
   {type:'statement',text:'I think there are quite a few red cars in your area.'},
   {type:'statement',text:'Your city seems to have plenty of cinema halls.'}
  ]},
  {target:'almost',stress:'Stress AL- in AL-most.',model:['A: How many people arrived on time?','B: Almost everyone did. What about your group?','A: Almost all of them came on time.','B: Oh yeah, that’s good.'],prompts:[
   {type:'question',text:'How many people in your class use smartphones? Use “almost”.'},
   {type:'statement',text:'In many families, nearly everyone uses WhatsApp now.'},
   {type:'statement',text:'Most shops near me accept digital payments these days.'}
  ]},
  {target:'majority',stress:'Stress JOR: ma-JOR-i-ty.',model:['A: Which language does the majority of your class use outside lessons?','B: The majority use Hindi. What about your class?','A: The majority use a mix of Hindi and English.','B: Exactly. That happens a lot.'],prompts:[
   {type:'question',text:'What does the majority of your neighbourhood use for local travel? Use “majority”.'},
   {type:'statement',text:'In my class, tea seems more popular than coffee.'},
   {type:'statement',text:'Near me, digital payment seems more common than cash now.'}
  ]}
 ]},
 {kp:1,structure:'Key Point 2 grammar: use a purpose structure such as “I use … for -ing”, “I need … to …”, “I’m learning … to …”, or “so that I can …”.',items:[
  {target:'goal',stress:'Stress GOAL clearly as one strong syllable.',model:['A: What is your main goal with English?','B: My main goal is to speak more confidently. What about you?','A: My goal is to communicate better at work.','B: Exactly. That’s a useful goal.'],prompts:[
   {type:'question',text:'What is one English goal you have for this month? Use “goal”.'},
   {type:'statement',text:'For interviews, having one clear communication goal can make practice more focused.'},
   {type:'statement',text:'A long-term goal is easier to reach when you connect it to a real use of English.'}
  ]},
  {target:'practise',stress:'Stress PRAC-: PRAC-tise.',model:['A: How do you practise English after class?','B: I practise by speaking aloud for ten minutes. What about you?','A: I practise with short videos so that I can copy the rhythm.','B: Oh yeah, that works well.'],prompts:[
   {type:'question',text:'How do you practise English at home? Use “practise”.'},
   {type:'statement',text:'Before an interview, it helps to practise the same answer in more than one way.'},
   {type:'statement',text:'Some speaking skills only improve when you practise them regularly.'}
  ]},
  {target:'improve',stress:'Stress PROVE: im-PROVE.',model:['A: What do you most want to improve?','B: I want to improve my fluency so that I can speak without stopping. What about you?','A: I need to improve my vocabulary for work.','B: Right. That can make a big difference.'],prompts:[
   {type:'question',text:'What do you most want to improve in English? Use “improve”.'},
   {type:'statement',text:'For interviews, one communication skill usually needs more improvement than the others.'},
   {type:'statement',text:'Everyday conversation becomes easier when you improve one small habit at a time.'}
  ]},
  {target:'communicate',stress:'Stress MU: com-MU-ni-cate.',model:['A: Who do you need to communicate with in English?','B: I need English to communicate with clients. What about you?','A: I use English to communicate with people from other states.','B: Exactly. That’s where it becomes useful.'],prompts:[
   {type:'question',text:'Who do you need to communicate with in English? Use “communicate”.'},
   {type:'statement',text:'At work or college, some messages are harder to communicate clearly than others.'},
   {type:'statement',text:'It is easier to communicate confidently when you know your main point before you start.'}
  ]},
  {target:'confidence',stress:'Stress CON-: CON-fi-dence.',model:['A: What gives you confidence when you speak English?','B: Practice gives me confidence because I know what I want to say. What about you?','A: I prepare key points so that I can speak with more confidence.','B: You bet. Preparation helps.'],prompts:[
   {type:'question',text:'What gives you confidence when you speak English? Use “confidence”.'},
   {type:'statement',text:'Interview confidence often drops when people try to memorise every word.'},
   {type:'statement',text:'Small successful speaking experiences can build confidence quite quickly.'}
  ]}
 ]},
 {kp:2,structure:'Key Point 3 speech structure: use the target word in a complete, natural sentence while keeping /w/ and /v/ distinct in connected speech.',items:[
  {target:'work',stress:'Stress WORK clearly; begin with rounded /w/.',model:['A: Where do you usually work?','B: I work from home three days a week. What about you?','A: I work mainly from the office.','B: Right, that sounds busy.'],prompts:[
   {type:'question',text:'Where do you usually work? Use “work”.'},
   {type:'statement',text:'Some kinds of work are much easier to enjoy than others.'},
   {type:'statement',text:'Most people can name one thing they would like to improve at work.'}
  ]},
  {target:'world',stress:'Stress WORLD clearly; begin with rounded /w/.',model:['A: Which part of the world would you like to visit?','B: I’d like to visit Europe. What about you?','A: I want to see more of the world before I turn forty.','B: Oh yeah, that would be great.'],prompts:[
   {type:'question',text:'Which part of the world would you like to visit? Use “world”.'},
   {type:'statement',text:'Different parts of the world offer very different opportunities for work and study.'},
   {type:'statement',text:'The world is changing quickly because of technology.'}
  ]},
  {target:'visit',stress:'Stress VIS-: VIS-it; start with /v/, top teeth lightly on lower lip.',model:['A: Who do you visit most often?','B: I visit my parents every weekend. What about you?','A: I visit my sister quite often.','B: Same here. Family visits matter.'],prompts:[
   {type:'question',text:'Who do you visit most often? Use “visit”.'},
   {type:'statement',text:'There is usually one place people really want to visit in the coming year.'},
   {type:'statement',text:'Most of us have places in our own city that we rarely visit.'}
  ]},
  {target:'video',stress:'Stress VID-: VID-e-o; start with /v/.',model:['A: What kind of video do you watch most?','B: I watch short business videos. What about you?','A: I usually watch travel videos.','B: Exactly. They’re easy to learn from.'],prompts:[
   {type:'question',text:'What kind of video do you watch most? Use “video”.'},
   {type:'statement',text:'A good short video can teach something useful very quickly.'},
   {type:'statement',text:'People often recommend a video when it has explained something clearly.'}
  ]},
  {target:'travel',stress:'Stress TRAV-: TRAV-el; keep the /v/ clear in the middle.',model:['A: Where do you want to travel next?','B: I want to travel to Kerala. What about you?','A: I’d like to travel somewhere in the mountains.','B: Oh yeah, that sounds good.'],prompts:[
   {type:'question',text:'Where do you want to travel next? Use “travel”.'},
   {type:'statement',text:'Some people love travel while others find it tiring.'},
   {type:'statement',text:'Travel for work or study can be very different from travel for a holiday.'}
  ]}
 ]}
];
function oracyVocabNorm(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function oracyVocabHas(text,target){return oracyVocabNorm(text).includes(oracyVocabNorm(target));}
function oracyMarkerCount(text){const t=oracyVocabNorm(text);return ['well','hmm','oh yeah','exactly','right','same here','you bet','by the way','anyway','really'].filter(m=>t.includes(oracyVocabNorm(m))).length;}
function oracyPurposePattern(text){const t=oracyVocabNorm(text);return /\bi use\b.{0,70}\bfor\b/.test(t)||/\bi need\b.{0,70}\bto\b/.test(t)||/\bi(?:'m| am) learning\b.{0,70}\bto\b/.test(t)||/so that i can\b/.test(t);}
function oracyStructureOkay(kp,text,target){const t=oracyVocabNorm(text);if(kp===1)return oracyPurposePattern(text);if(kp===0){if(target==='at least')return /at least\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[a-z]+)/.test(t);if(target==='almost')return /almost\s+(?:all|everyone|everybody|half|\d+|[a-z]+)/.test(t);if(target==='majority')return /(?:the\s+)?majority(?:\s+of)?/.test(t);return oracyVocabHas(text,target)&&oracyVocabNorm(text).split(' ').length>=5;}return oracyVocabHas(text,target)&&oracyVocabNorm(text).split(' ').length>=5;}
function oracyTurnLabel(turn){return turn===0?'Question 1 of 3':`Statement ${turn+1} of 3`}
function oracyTurnButton(turn){return turn===0?'🎤 Answer question 1':`🎤 Respond to statement ${turn+1}`}
function oracyVocabFeedbackHtml(kp,item,transcript,turnNo){const vocabOk=oracyVocabHas(transcript,item.target);const structureOk=oracyStructureOkay(kp,transcript,item.target);const markers=oracyMarkerCount(transcript);const pronunciation=vocabOk?`The target expression was recognised in your recording. Stress focus: ${item.stress}`:`The target expression was not recognised clearly enough. Try it again. ${item.stress}`;return `<div class="oracy-vocab-feedback" style="margin-top:10px;padding:11px;border-radius:10px;background:#f7f8fb;border:1px solid #d9deea"><b>Feedback · Turn ${turnNo}</b><div style="margin-top:6px"><b>1. Target vocabulary:</b> ${vocabOk?'✓ Used correctly enough to be recognised.':'Not yet — use “'+safe(item.target)+'” in the response.'}</div><div style="margin-top:6px"><b>2. Pronunciation & stress:</b> ${safe(pronunciation)}</div><div style="margin-top:6px"><b>3. Key Point structure:</b> ${structureOk?'✓ The response fits the Key Point structure.':'Try again using the Key Point structure shown above.'}</div><div style="margin-top:6px"><b>4. Conversation markers:</b> ${markers>0?'✓ A natural marker was heard.':'Add a natural marker such as Well, Hmm, Right, Exactly, Oh yeah, By the way, or Anyway.'}</div></div>`;}
function oracyMakeVocabDrill(kp,itemIndex,item,structureText){const p=item.prompts[0];const box=document.createElement('div');box.className='activity oracy-vocab-drill speak';box.dataset.kpIndex=String(kp);box.dataset.vocabIndex=String(itemIndex);box.dataset.turn='0';box.innerHTML=`<div class="eyebrow">Vocabulary speaking drill ${itemIndex+1} of 5</div><h3>${safe(item.target)}</h3><div style="padding:11px;border-radius:10px;background:#f8f6ef;border:1px solid #e4ddc5"><b>Model conversation</b>${item.model.map(line=>`<div style="margin-top:5px">${safe(line)}</div>`).join('')}</div><p style="margin-top:10px"><b>Structure focus:</b> ${safe(structureText)}</p><p><b>Pronunciation focus:</b> ${safe(item.stress)}</p><div class="oracy-vocab-prompt" style="margin-top:10px"><b>${oracyTurnLabel(0)}</b><div style="margin-top:5px">${safe(p.text)}</div></div><button class="record oracy-vocab-record" data-prompt="Vocabulary drill. Target: ${safe(item.target)}. ${safe(p.text)}">${oracyTurnButton(0)}</button><div class="status"></div><div class="feedback"></div>`;const btn=box.querySelector('.record');if(btn)btn.addEventListener('click',()=>toggleRecording(btn));return box;}
function oracyInsertVocabDrills(){const sections=[...document.querySelectorAll('section.kp')].slice(0,3);sections.forEach((section,kp)=>{if(section.querySelector('.oracy-vocab-drills'))return;const cfg=ORACY_VOCAB_DRILLS[kp];if(!cfg)return;const wrap=document.createElement('div');wrap.className='oracy-vocab-drills';wrap.innerHTML=`<div class="eyebrow">Vocabulary in use · 5 drills · 3 turns each</div><h3>Use every vocabulary item in conversation</h3><p>Each vocabulary item is one 3-in-1 speaking drill: first answer a question, then respond naturally to two statements using the same target item.</p>`;cfg.items.forEach((item,i)=>wrap.appendChild(oracyMakeVocabDrill(kp,i,item,cfg.structure)));const vocabFive=section.querySelector('.oracy-vocab-five');if(vocabFive)vocabFive.insertAdjacentElement('afterend',wrap);else section.querySelector('h2')?.insertAdjacentElement('afterend',wrap);});}
const ORACY_ORIGINAL_SEND_FOR_FEEDBACK=sendForFeedback;
sendForFeedback=async function(box,prompt,btn){if(!box.classList.contains('oracy-vocab-drill'))return ORACY_ORIGINAL_SEND_FOR_FEEDBACK(box,prompt,btn);const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');mediaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});status.textContent='Checking your response…';try{const kp=Number(box.dataset.kpIndex||0),vi=Number(box.dataset.vocabIndex||0),turn=Number(box.dataset.turn||0);const item=ORACY_VOCAB_DRILLS[kp].items[vi],current=item.prompts[turn];const form=new FormData();form.append('action','evaluate');form.append('unit','B1 Unit 1 vocabulary drill');form.append('unit_no',String(UNIT_NO));form.append('prompt',`${current.type==='question'?'Answer the question':'Respond naturally to the statement'}. Target vocabulary: ${item.target}. ${current.text} Structure focus: ${ORACY_VOCAB_DRILLS[kp].structure}.`);form.append('audio',blob,'answer.webm');const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error(await responseError(res,'Feedback'));const data=await res.json();const transcript=String(data.transcript||'');feedback.innerHTML=oracyVocabFeedbackHtml(kp,item,transcript,turn+1);const vocabOk=oracyVocabHas(transcript,item.target),structureOk=oracyStructureOkay(kp,transcript,item.target);if(vocabOk&&structureOk&&turn<2){const next=turn+1,nextPrompt=item.prompts[next];box.dataset.turn=String(next);const q=box.querySelector('.oracy-vocab-prompt');if(q)q.innerHTML=`<b>${oracyTurnLabel(next)}</b><div style="margin-top:5px">${safe(nextPrompt.text)}</div>`;btn.dataset.prompt=`Vocabulary drill. Target: ${item.target}. ${nextPrompt.text}`;btn.textContent=oracyTurnButton(next);status.textContent=next===1?'Good. Now respond naturally to the statement using the same target vocabulary.':'Good. One more statement-response using the same target vocabulary.';}else if(vocabOk&&structureOk&&turn===2){status.textContent='Vocabulary drill complete: 1 question-answer + 2 statement-responses finished.';btn.textContent='🎤 Repeat this 3-in-1 drill';box.dataset.turn='0';const q=box.querySelector('.oracy-vocab-prompt'),first=item.prompts[0];if(q)q.innerHTML=`<b>${oracyTurnLabel(0)}</b><div style="margin-top:5px">${safe(first.text)}</div>`;btn.dataset.prompt=`Vocabulary drill. Target: ${item.target}. ${first.text}`;}else{status.textContent=current.type==='question'?'Try the same question again. Use the target vocabulary and Key Point structure.':'Respond to the same statement again. Use the target vocabulary and Key Point structure.';btn.textContent=current.type==='question'?'🎤 Try question 1 again':`🎤 Try statement ${turn+1} again`;}}catch(error){status.textContent=(error.message||'Feedback request could not be completed.')+' Your recording has been discarded.';}finally{chunks=[];recorder=null;activeButton=null;btn.classList.remove('live');}};
oracyInsertVocabDrills();
document.querySelectorAll('.oracy-speaking-gym .record').forEach(btn=>btn.addEventListener('click',()=>toggleRecording(btn)));
