const EDGE='/oracy/session';
const unitNo=Number(document.body.dataset.unitNo||0);
const displayUnit=document.body.dataset.displayUnit||'';
const unitTitle=document.body.dataset.unitTitle||'';
const UNIT_LABEL=`TELW B1A New Unit ${displayUnit} · ${unitTitle}`;
const player=document.getElementById('player');
const PASSAGE_STYLE='Sound like a natural adult conversation in clear UK-leaning international English. Keep the pace B1-friendly but natural. Use spontaneous reactions and normal sentence stress. Do not sound like a textbook recording.';
const audioCache=new Map();let playToken=0;

const HYBRID={
91:{
 kps:[
  {input:'Listen for the order of life events and the combinations people naturally use for education, work and personal life.',listen:['<b>Naina:</b> I started school in Lucknow, left at eighteen, and went to university in Pune.','<b>Arjun:</b> What happened after university?','<b>Naina:</b> I joined a bank, got promoted after two years, and later moved to Delhi.','<b>Arjun:</b> Was moving the biggest change?','<b>Naina:</b> Professionally, yes. Personally, getting married changed my routine more.'],notice:'Notice the life-event combinations: start school, leave school, go to university, join a company, get promoted, get married, have children. Learn them as chunks, not as separate words.',clarify:'If your answer sounds like a list, connect the events with first, then, after that, later and finally. One event should lead naturally to the next.'},
  {input:'Listen for finished past actions, regular and irregular past forms, and simple sequencing.',listen:['<b>Coach:</b> Tell me about a day that changed your plans.','<b>Learner:</b> Last year I missed a train, took a bus instead, met an old friend on the bus, and reached home much later.','<b>Coach:</b> Which verbs are irregular?','<b>Learner:</b> Missed is regular, but took and met are irregular.'],notice:'Use the past simple for finished events. Watch common irregular forms such as went, took, met, saw, bought, made, found and came. For -ed endings, listen to how worked, stayed and wanted sound different.',clarify:'If you use a present form for a finished event, correct it immediately and continue. Clear past-time meaning matters more than stopping the whole answer.'},
  {input:'Listen for the difference between subject knowledge and transferable or soft skills.',listen:['<b>Manager:</b> Biology did not become part of my career, but it helped me discover what I did not want to do.','<b>Interviewer:</b> What about literature?','<b>Manager:</b> It did not teach me a job task, but it improved how I read, interpret and explain ideas.','<b>Interviewer:</b> And computers?','<b>Manager:</b> Useful, but technology changes so quickly that education also has to teach adaptable skills.'],notice:'A stronger education answer links a subject to an effect: “Literature improved my ability to explain ideas.” Soft skills can transfer across jobs: communication, problem-solving, teamwork, judgement and numeracy.',clarify:'Do not say a subject was simply useful or useless. Explain what it gave you, what it did not give you, and why that matters now.'}
 ],
 debates:['Higher education should be mainly for careers, not general development.','Students should do part-time jobs while they are in school or college.','Governments should pay most of the cost of higher education.','Soft skills are more important than specialist knowledge for long-term careers.'],
 presentations:['My life line: five stages that shaped me','A subject that influenced me more than I expected','One past experience that changed my direction','What colleges should prepare students for']
},
92:{
 kps:[
  {input:'Listen for present perfect when the experience matters but the exact time does not, and past simple when the speaker adds a finished time.',listen:['<b>Sana:</b> Have you ever tried an unusual sport?','<b>Rohit:</b> Yes, I have. I have tried scuba diving.','<b>Sana:</b> When did you do it?','<b>Rohit:</b> I did it in Goa two years ago.','<b>Sana:</b> Have you been back since then?','<b>Rohit:</b> No, I have not been back yet.'],notice:'Use present perfect for experience: Have you ever…? I have never… I have been to… Use past simple when you say when: I went there in 2024. “Been to” means went and returned; “gone to” means the person is still away.',clarify:'If you mention a finished time such as yesterday, last year or in 2025, switch to the past simple. If the time is not important, present perfect is usually the better choice.'},
  {input:'Listen for already, yet, still, so far, for and since while someone reports progress towards a goal.',listen:['<b>Priya:</b> How is your project going?','<b>Omar:</b> I have already finished the research. I have written three sections so far.','<b>Priya:</b> Have you finished the analysis yet?','<b>Omar:</b> Not yet. I still have two data sets to check.','<b>Priya:</b> How long have you worked on it?','<b>Omar:</b> For six weeks. I have worked on it since early August.'],notice:'Already = completed earlier than expected. Yet = expected but not completed, usually in questions/negatives. So far = progress up to now. Still = something remains. For = duration. Since = starting point.',clarify:'Do not force every progress word into one answer. Choose the one that matches the meaning you need, then give a concrete progress detail.'},
  {input:'Listen for language used to discuss competition across sport, business and selection.',listen:['<b>Neha:</b> Is competition always about winning a match?','<b>Vikram:</b> No. Companies compete for contracts, candidates compete for jobs, and cities compete to host events.','<b>Neha:</b> So is competition good?','<b>Vikram:</b> It can improve performance, but too much competition can make people focus only on winning.'],notice:'Useful competition language: compete with/against, competitor, competitive, beat an opponent, win a contract, candidate, contestant, winner. A strong opinion separates benefits, risks and context.',clarify:'Avoid saying “competition is good” or “competition is bad” with no conditions. Say where it helps, where it harms, and what makes it healthy.'}
 ],
 debates:['Competition brings out the best in people.','Extreme adventure is worth the risk.','Sports sponsorship benefits society as much as companies.','Personal achievement matters more than beating other people.'],
 presentations:['Three experiences I would like to have','A goal I have made progress towards','An achievement I am proud of and what it required','Why people enjoy watching competitive sport']
},
93:{
 kps:[
  {input:'Listen for how speakers classify a news story and use the vocabulary of politics, the economy, crime and natural disasters.',listen:['<b>Editor:</b> What is our lead story?','<b>Reporter:</b> Unemployment has fallen again, so I would put it under the economy.','<b>Editor:</b> And the airport security story?','<b>Reporter:</b> That is linked to possible terrorist attacks, so it is both security and crime-related news.','<b>Editor:</b> Good. Keep the headline factual, not dramatic.'],notice:'Build word families: politics/political/politician; economy/economic/economics; employ/employee/employer/unemployment; crime/criminal; steal/thief/theft; rob/robber/robbery; terror/terrorist/terrorism. Stress can move when the word changes.',clarify:'Before speaking about a story, name the category, state the main event, then add one important detail. This stops the answer becoming a collection of disconnected news words.'},
  {input:'Listen for recent-time language and the shift from present perfect to past simple when details are added.',listen:['<b>Amla:</b> What is the latest news from your side?','<b>Tarun:</b> I have just started a new job. I have been there for a little over a week.','<b>Amla:</b> How was the first week?','<b>Tarun:</b> It went well. I had an induction, met the team, and visited the plant.','<b>Amla:</b> So you have been busy lately.','<b>Tarun:</b> Very busy, but in a good way.'],notice:'Recent markers include recently, lately, just, in the last few days and during the past few weeks. Start with the current/recent situation, then use past simple for the finished details inside that period.',clarify:'If you say “I have just…” and then describe a specific finished day, move naturally to the past simple for the details.'},
  {input:'Listen for a flashbulb memory: background action in progress plus the short event that interrupted it.',listen:['<b>Interviewer:</b> Do you remember where you were when you heard the result?','<b>Leena:</b> Yes. I was travelling home on the metro when my sister called me.','<b>Interviewer:</b> What were people around you doing?','<b>Leena:</b> Most people were looking at their phones. I stood near the door and tried not to shout.','<b>Interviewer:</b> Why is the memory so clear?','<b>Leena:</b> Because the news changed what I was going to do next.'],notice:'Use past continuous for the background action and past simple for the shorter event: “I was driving when I heard the news.” Use while before a continuing action; when can introduce either a continuing or short event.',clarify:'Build the memory in four parts: where you were, what you were doing, who/what brought the news, and how you felt.'}
 ],
 debates:['News organisations focus too much on bad news.','Social media has improved the quality of news.','Ordinary people should be able to become famous through online platforms.','Privacy is more important than the public’s right to know.'],
 presentations:['A news story I have followed recently','How I decide whether a news source is trustworthy','A flashbulb memory from my own life','How online video has changed the way people get information']
},
94:{
 kps:[
  {input:'Listen for different ways of stating purpose and reason: to, in order to, for + ing, so that and because.',listen:['<b>Rhea:</b> Why do you back up your files?','<b>Manav:</b> I back them up so that I do not lose important documents.','<b>Rhea:</b> What do you use cloud storage for?','<b>Manav:</b> For storing copies online. I also use it to share large files.','<b>Rhea:</b> Why not keep everything on one laptop?','<b>Manav:</b> Because one crash could cause a serious problem.'],notice:'Purpose: to + verb / in order to + verb / for + ing / so that + clause. Reason: because + clause. Choose the structure that fits the sentence rather than using “because” for everything.',clarify:'Check what comes after your connector: “to store”, “for storing”, “so that I can store”, “because I need a copy”.'},
  {input:'Listen for IT words whose everyday meanings help explain their technical meanings.',listen:['<b>Trainer:</b> Why is it called a mouse?','<b>Learner:</b> Because the early device looked a little like a mouse.','<b>Trainer:</b> What does browse mean outside IT?','<b>Learner:</b> To look through things without choosing immediately. That idea became “browse the web”.','<b>Trainer:</b> And a search engine?','<b>Learner:</b> A system that helps you find information using keywords.'],notice:'Many IT terms are borrowed from everyday English: mouse, file, web, memory, browser, address, key, hardware. Explaining the original image or use makes the vocabulary easier to remember.',clarify:'When you explain an IT term, give the simple meaning first, then the technical use, then one example.'},
  {input:'Listen for differences between social and professional email language, and how email phrases can be spoken naturally when explaining what you would write.',listen:['<b>Aditi:</b> How would you start a professional email to someone you know?','<b>Karan:</b> I might use “Hi” if the relationship is established, or “Dear” if I need to be more formal.','<b>Aditi:</b> And if you attach a document?','<b>Karan:</b> I can say “Attached is the report” or, more formally, “Please find attached the report.”','<b>Aditi:</b> What about the end?','<b>Karan:</b> “Best regards” or “Regards” usually works.'],notice:'Useful email chunks include Good to hear from you; Thanks for letting me know; Attached is…; I just want to let you know…; Look forward to seeing/hearing from you. Register depends on relationship and purpose.',clarify:'Do not make every professional email extremely formal. Match the greeting, message and closing to the relationship and situation.'}
 ],
 debates:['People depend too much on computers.','Schools should teach digital safety as a core subject.','Online communication is making face-to-face communication weaker.','The internet has improved travel planning more than any other technology.'],
 presentations:['Why I use technology in my daily life','Five IT terms explained in simple English','How to write a clear professional email','How the internet has changed the way I plan travel']
},
95:{
 kps:[
  {input:'Listen for the stages of a journey and the vocabulary used at stations and airports.',listen:['<b>Traveller:</b> What happens after check-in?','<b>Agent:</b> Your luggage goes through a scanner and you walk through security. Then you go to passport control.','<b>Traveller:</b> Where do I wait after that?','<b>Agent:</b> In the departure lounge until your gate is announced.','<b>Traveller:</b> And for a train?','<b>Agent:</b> You normally need the correct platform or track, plus your coach and seat number.'],notice:'Travel procedures have a sequence: departures → check-in → security → passport control → departure lounge → gate/platform → boarding. Learn location words with the action that happens there.',clarify:'When explaining a procedure, use order words and one action per stage. If you forget a technical word, describe the place or action and keep speaking.'},
  {input:'Listen for frequency adverbs and how position changes depending on the verb.',listen:['<b>Researcher:</b> How do you normally travel between cities?','<b>Ajay:</b> I usually take the train. I often work during the journey, so it suits me.','<b>Researcher:</b> Do you ever fly?','<b>Ajay:</b> Occasionally, when the distance is long. I very rarely drive because traffic can be unpredictable.','<b>Researcher:</b> So your choice depends on distance and purpose.','<b>Ajay:</b> Exactly.'],notice:'Frequency scale: always; usually/normally/generally; often/frequently/regularly; sometimes/occasionally; rarely/seldom; never. With most verbs, the adverb comes before the verb: “I usually travel”.',clarify:'Do not choose a frequency word only because it sounds advanced. Make sure it matches how often the action really happens.'},
  {input:'Listen for how a traveller states a problem, explains the cause, and asks for a practical solution.',listen:['<b>Passenger:</b> I missed my train because the metro was delayed. Can I use this ticket on the next service?','<b>Clerk:</b> I am afraid this reduced-fare ticket was valid only for the earlier train.','<b>Passenger:</b> So do I need to pay the full fare? Is there any refund?','<b>Clerk:</b> There is no refund on this ticket, but I can show you the cheapest available option.','<b>Passenger:</b> Please do. I just need to get there today.'],notice:'Problem language: miss a flight/train/connection; run out of fuel; break down; get stuck in a traffic jam; get lost; be delayed/cancelled. Ticket language: valid, full fare, reduced fare, supplement, refund.',clarify:'A useful problem report has three parts: what happened, what it caused, and what you need now. Stay calm and specific.'}
 ],
 debates:['Public transport should be cheaper even if taxes have to rise.','Flying should be reduced for environmental reasons.','Online check-in has made travel much easier.','Transport officials should have more flexibility when passengers make genuine mistakes.'],
 presentations:['A journey from booking to boarding','How often I use different modes of transport and why','My worst travel problem and how I handled it','The best way to travel a medium distance']
},
96:{
 kps:[
  {input:'Listen for arrangements, offers and future time conjunctions: when, as soon as and until.',listen:['<b>Natasha:</b> Shall I ask whether you can join the training course too?','<b>Amanda:</b> Yes, please. What will you do next?','<b>Natasha:</b> I will speak to Karl when I go to the office. I will contact you as soon as I get an answer.','<b>Amanda:</b> Great. Do not book anything until I confirm the dates.','<b>Natasha:</b> Fine. I will wait for your confirmation.'],notice:'Use shall I…? for an offer. Use I’ll for a decision or promise. After when, as soon as and until, use a present form for the future event: “I’ll call when I arrive,” not “when I will arrive.”',clarify:'If you accidentally use will after a future time conjunction, correct the clause only and continue: “when I arrive”, “as soon as I get”, “until you confirm”.'},
  {input:'Listen for the difference between personal arrangements and fixed timetables.',listen:['<b>Sam:</b> What time are you meeting the client?','<b>Leena:</b> I am meeting her at 2:30. The train leaves at 11:15, so I have plenty of time.','<b>Sam:</b> When does the conference start?','<b>Leena:</b> It starts at nine tomorrow morning. We are having dinner with the organisers tonight.'],notice:'Present continuous often describes a personal arrangement: “I’m meeting her at 2:30.” Present simple often describes a fixed timetable: “The train leaves at 11:15.” Context and a future time phrase make the meaning clear.',clarify:'Ask: is this a personal arrangement made by people, or a fixed schedule that affects many people? That choice usually tells you which form to use.'},
  {input:'Listen for will as a decision made now and going to as a plan decided earlier.',listen:['<b>Ravi:</b> The printer has stopped working.','<b>Maya:</b> I’ll call IT now.','<b>Ravi:</b> Good. Are you still changing your laptop?','<b>Maya:</b> Yes. I’m going to buy a new one next month. I decided last week.','<b>Ravi:</b> And what about the presentation?','<b>Maya:</b> I’m going to finish the slides tonight. If you send me the figures, I’ll add them immediately.'],notice:'Will = decision made now, quick offer, promise. Going to = plan or decision made earlier. Strong planning also means identifying actions, missing information, responsibilities and sequence.',clarify:'Before choosing will or going to, ask yourself when the decision was made. Then explain the reason or next action so the plan sounds managerial, not just grammatical.'}
 ],
 debates:['Important decisions are better made by groups than by individuals.','Detailed planning reduces creativity.','People should plan their careers several years ahead.','A good manager should make quick decisions even with incomplete information.'],
 presentations:['My arrangements for an upcoming event or trip','A plan with when, as soon as and until','A difficult decision I made and how I made it','An action plan for an unusual objective']
}
};

function safe(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function mk(tag,cls,html){const el=document.createElement(tag);if(cls)el.className=cls;if(html!=null)el.innerHTML=html;return el}

function applyHybridScaffold(){
 const cfg=HYBRID[unitNo];if(!cfg)return;
 const hero=document.querySelector('.hero');
 if(hero){hero.insertAdjacentHTML('beforeend','<p><b>Learning path:</b> Warm-up → meaningful input/listening → notice the language → small controlled task → first easy spoken attempt → correction/clarification → increasingly difficult speaking reps → final independent performance.</p><p><b>Recording privacy:</b> ORACY does not save learner recordings. A recording is used to generate feedback and is then discarded by the page.</p>')}
 document.querySelectorAll('.kp').forEach((kp,idx)=>{
   const c=cfg.kps[idx];if(!c)return;
   const activities=[...kp.querySelectorAll(':scope > .activity')];
   const warm=activities.find(a=>/warm-up/i.test(a.querySelector('h3')?.textContent||''));
   const work=activities.find(a=>/work it out/i.test(a.querySelector('h3')?.textContent||''));
   const focus=activities.find(a=>/language focus/i.test(a.querySelector('h3')?.textContent||''));
   const firstListen=[...kp.querySelectorAll(':scope > h3')].find(h=>/^listen/i.test(h.textContent.trim()));
   const firstPassage=kp.querySelector(':scope > .passage');
   const firstAudio=kp.querySelector(':scope > .audio');
   const firstAudioNote=firstAudio?.nextElementSibling;
   if(warm?.querySelector('h3'))warm.querySelector('h3').textContent='1 · Warm-up';
   if(firstListen)firstListen.textContent='2 · Listen · Meaningful input';
   if(warm&&firstListen){const input=mk('div','activity',`<h3>Before you listen</h3><p>${c.input}</p>`);kp.insertBefore(input,firstListen)}
   const second=mk('div','activity',`<h3>Listen again · Compare and notice</h3><div class="passage" data-audio-id="hybrid-${idx+1}">${c.listen.map(x=>`<p>${x}</p>`).join('')}</div><button class="audio" data-id="hybrid-${idx+1}">▶ Play second listening</button><div class="audio-note status" aria-live="polite"></div>`);
   const anchor=firstAudioNote||firstAudio||firstPassage||firstListen;
   if(anchor)anchor.after(second);
   if(focus){focus.querySelector('h3').textContent='3 · Notice the language';focus.querySelector('p').insertAdjacentHTML('beforeend',`<br><br><b>Notice:</b> ${c.notice}`)}
   if(work)work.querySelector('h3').textContent='4 · Small controlled task';
   if(focus&&work&&focus.compareDocumentPosition(work)&Node.DOCUMENT_POSITION_PRECEDING){kp.insertBefore(focus,work)}
   const reps=[...kp.querySelectorAll(':scope > .speak')];
   if(reps[0]){
     reps[0].insertAdjacentHTML('beforebegin','<div class="activity"><h3>5 · First easy spoken attempt</h3><p>Use the model language while it is still visible. Keep this first answer short and accurate.</p></div>');
     reps[0].querySelector('.eyebrow').textContent='Rep 1 · Easy supported attempt';
     const correction=mk('div','activity',`<h3>6 · Correction / clarification</h3><p>${c.clarify}</p><p>Read your feedback from Rep 1. Fix <b>one</b> thing only, then continue.</p>`);
     reps[0].after(correction);
   }
   if(reps[1])reps[1].insertAdjacentHTML('beforebegin','<div class="activity"><h3>7 · Increase the challenge</h3><p>From here, reduce your dependence on the model. Add a reason, example, follow-up or changed condition.</p></div>');
   if(reps[4]){reps[4].querySelector('.eyebrow').textContent='Rep 5 · Final independent performance';reps[4].insertAdjacentHTML('beforebegin','<div class="activity"><h3>8 · Final independent performance</h3><p>Do not read a model. Organise the answer yourself and speak as naturally as you can.</p></div>')}
 });
 const finish=[...document.querySelectorAll('section.card')].find(s=>/finish the unit/i.test(s.querySelector('h2')?.textContent||''));
 const extra=mk('section','card',`<div class="eyebrow">Extra speaking gym</div><h2>Debate practice</h2><p>Choose a topic. Take a position, give two reasons, respond to one possible opposing view, and finish with your judgement.</p>${cfg.debates.map((t,i)=>`<div class="speak"><div class="eyebrow">Debate ${i+1}</div><p><b>${t}</b></p><button class="record" data-prompt="Debate this B1 topic: ${t} Give a clear position, two reasons, one response to an opposing view, and a short conclusion.">🎤 Record debate</button><div class="status"></div><div class="feedback"></div></div>`).join('')}<div class="eyebrow" style="margin-top:28px">Extra speaking gym</div><h2>Presentation practice</h2><p>Aim for 45–60 seconds: opening → two or three clear points → closing line.</p>${cfg.presentations.map((t,i)=>`<div class="speak"><div class="eyebrow">Presentation ${i+1}</div><p><b>${t}</b></p><button class="record" data-prompt="Give a 45 to 60 second B1 presentation on: ${t} Use a clear opening, two or three connected points, and a closing line.">🎤 Record presentation</button><div class="status"></div><div class="feedback"></div></div>`).join('')}`);
 if(finish)finish.before(extra);else document.querySelector('main')?.append(extra);
}
applyHybridScaffold();

document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.activity'),choice=box.querySelector(`input[name="${btn.dataset.question}"]:checked`),out=box.querySelector('.answer');
  if(!choice){out.textContent='Choose one answer.';out.className='answer bad';return}
  if(choice.value===btn.dataset.answer){out.textContent='Correct. Say the idea aloud once before you move on.';out.className='answer ok'}
  else{out.textContent='Try again. Go back to the listening and language-noticing step, then choose again.';out.className='answer bad'}
}));

function segmentsFor(id){
  const p=document.querySelector(`.passage[data-audio-id="${id}"]`);
  if(!p)return[];
  return Array.from(p.querySelectorAll('p')).map((x,i)=>({voice:i%2?'cedar':'marin',text:x.textContent.replace(/\s+/g,' ').trim()}));
}
async function getAudio(id,index,segment){
  const key=`b1anew-${unitNo}-${id}-${index}-${segment.voice}-hybrid1`;
  if(audioCache.has(key))return audioCache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:segment.text,voice:segment.voice,instructions:PASSAGE_STYLE,unit_no:unitNo,passage_id:key})});
  if(!res.ok)throw new Error('Audio could not be loaded.');
  const blob=await res.blob(),url=URL.createObjectURL(blob);audioCache.set(key,url);return url;
}
function waitForAudio(){return new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(new Error('Audio playback failed.'))})}
document.querySelectorAll('.audio').forEach(btn=>btn.addEventListener('click',async()=>{
  const id=btn.dataset.id,status=btn.nextElementSibling,token=++playToken,segments=segmentsFor(id);
  try{btn.disabled=true;status.textContent='Preparing audio…';
    for(let i=0;i<segments.length;i++){if(token!==playToken)return;player.src=await getAudio(id,i,segments[i]);await player.play();await waitForAudio()}
    status.textContent='Finished. Listen again and notice the useful language before you speak.'
  }catch(e){status.textContent=e.message||'Audio could not be played.'}finally{btn.disabled=false}
}));

let recorder=null,stream=null,chunks=[],activeBtn=null;
document.querySelectorAll('.record').forEach(btn=>btn.addEventListener('click',async()=>{
  const box=btn.closest('.speak'),status=box.querySelector('.status');
  if(recorder&&activeBtn===btn){recorder.stop();return}
  if(recorder){status.textContent='Finish the current recording first.';return}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];activeBtn=btn;recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>sendForFeedback(box,btn.dataset.prompt,btn);
    recorder.start();btn.textContent='■ Stop & get feedback';btn.classList.add('live');status.textContent='Recording… ORACY does not save this recording.'
  }catch{status.textContent='Please allow microphone access.';recorder=null;activeBtn=null}
}));
async function sendForFeedback(box,prompt,btn){
  const status=box.querySelector('.status'),feedback=box.querySelector('.feedback');
  const blob=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});
  stream?.getTracks().forEach(t=>t.stop());recorder=null;stream=null;chunks=[];activeBtn=null;
  btn.textContent='🎤 Record';btn.classList.remove('live');status.textContent='Getting feedback… The recording is used for this feedback only.';
  const coaching=`${prompt}\nThis is ORACY B1A New Unit ${displayUnit}, ${unitTitle}. Evaluate mainly on B1 spoken effectiveness: task completion, clarity, correct use of the unit language, connected ideas and natural delivery. Do not reward memorised textbook language. Give concise feedback with: What worked; One next fix; A stronger example using the learner's own idea.`;
  try{
    const form=new FormData();form.append('action','evaluate');form.append('unit',UNIT_LABEL);form.append('unit_no',String(unitNo));form.append('prompt',coaching);form.append('audio',blob,'answer.webm');
    const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Feedback could not be completed.');
    const data=await res.json();feedback.innerHTML=`<b>Coach feedback</b><div>${safe(data.feedback||'Good attempt. Keep the answer connected and natural.')}</div>${data.improved?`<div style="margin-top:8px"><b>Try:</b> ${safe(data.improved)}</div>`:''}`;status.textContent='Feedback complete. ORACY has not saved your recording.'
  }catch(e){feedback.textContent=e.message||'Feedback could not be completed.';status.textContent='The recording was not saved. You can try the rep again.'}
}

window.addEventListener('beforeunload',()=>{
  try{stream?.getTracks().forEach(t=>t.stop())}catch{}
  chunks=[];recorder=null;activeBtn=null;
  for(const url of audioCache.values())try{URL.revokeObjectURL(url)}catch{}
  audioCache.clear();
});
