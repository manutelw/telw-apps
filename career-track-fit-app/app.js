const app = document.getElementById('app');
const restartBtn = document.getElementById('restartBtn');
let state = {track:null, phase:'welcome', index:0, answers:{}, questions:[]};

const capLabel = {verbal:'Verbal reasoning',numerical:'Numerical reasoning',data:'Data interpretation',structured:'Structured problem solving',critical:'Critical thinking',judgement:'Judgement & prioritisation',communication:'Communication clarity',adaptability:'Learning agility'};

function reset(){state={track:null,phase:'welcome',index:0,answers:{},questions:[]};restartBtn.classList.add('hidden');renderWelcome();}
restartBtn.addEventListener('click',reset);

function renderWelcome(){
  const tpl=document.getElementById('welcomeTemplate').content.cloneNode(true);app.innerHTML='';app.appendChild(tpl);document.getElementById('beginBtn').onclick=renderTracks;
}

function renderTracks(){
 state.phase='tracks';restartBtn.classList.remove('hidden');
 app.innerHTML=`<section><div class="section-head"><div><span class="eyebrow">Step 1</span><h2>Choose the track you are targeting</h2><p>Pick the track you are preparing for now. You can restart later and test another.</p></div></div><div class="track-grid" id="trackGrid"></div></section>`;
 const grid=document.getElementById('trackGrid');
 TRACKS.forEach(t=>{const b=document.createElement('button');b.className='track';b.innerHTML=`<div class="track-title">${t.name}</div><div class="track-family">${t.family}</div>`;b.onclick=()=>startCore(t);grid.appendChild(b);});
}

function startCore(track){state.track=track;state.phase='core';state.index=0;state.answers={};state.questions=CORE_QUESTIONS.map(q=>({...q,section:'Common Core'}));renderQuestion();}
function startTrack(){state.phase='track';state.index=0;state.questions=FAMILY_MODULES[state.track.family].map((q,i)=>({...q,id:`tm${i+1}`,section:`${state.track.name} module`}));renderQuestion();}

function renderQuestion(){
 const q=state.questions[state.index], answered=state.answers[`${state.phase}:${q.id}`];
 const pct=Math.round((state.index/state.questions.length)*100);
 app.innerHTML=`<div class="progress-wrap"><div class="progress-label"><span>${q.section}</span><span>${state.index+1} of ${state.questions.length}</span></div><div class="progress"><div style="width:${pct}%"></div></div></div><section class="card question-card"><div class="question-number">${capLabel[q.cap]}</div><div class="question-text">${q.q}</div>${q.ctx?`<div class="context">${q.ctx}</div>`:''}<div class="options" id="options"></div><div class="nav-row"><button class="secondary" id="backBtn" ${state.index===0?'disabled':''}>Back</button><button class="primary" id="nextBtn" ${answered===undefined?'disabled':''}>${state.index===state.questions.length-1?(state.phase==='core'?'Continue to track module':'See my result'):'Next'}</button></div></section>`;
 const opts=document.getElementById('options');q.o.forEach((txt,i)=>{const b=document.createElement('button');b.className='option'+(answered===i?' selected':'');b.innerHTML=`<span class="option-key">${String.fromCharCode(65+i)}</span><span>${txt}</span>`;b.onclick=()=>{state.answers[`${state.phase}:${q.id}`]=i;renderQuestion();};opts.appendChild(b)});
 document.getElementById('backBtn').onclick=()=>{if(state.index>0){state.index--;renderQuestion()}};
 document.getElementById('nextBtn').onclick=()=>{if(state.index<state.questions.length-1){state.index++;renderQuestion()}else if(state.phase==='core'){startTrack()}else{renderResults()}};
}

function scoreSection(questions,phase){
 const caps={};questions.forEach(q=>{if(!caps[q.cap])caps[q.cap]={correct:0,total:0};caps[q.cap].total++;if(state.answers[`${phase}:${q.id}`]===q.a)caps[q.cap].correct++;});return caps;
}
function mergeScores(){
 const core=scoreSection(CORE_QUESTIONS,'core'); const mod=scoreSection(state.questions,'track'); const caps={};
 Object.keys(capLabel).forEach(c=>{const cc=core[c]||{correct:0,total:0}, mm=mod[c]||{correct:0,total:0}; const rawTotal=cc.total+mm.total*1.5; const rawCorrect=cc.correct+mm.correct*1.5; caps[c]=rawTotal?Math.round(rawCorrect/rawTotal*100):0;});return caps;
}
function weightedOverall(caps){let n=0,d=0;Object.entries(caps).forEach(([c,s])=>{const w=state.track.weights[c]||1;n+=s*w;d+=w;});return Math.round(n/d);}
function statusFor(s){if(s>=78)return {label:'Strong current fit',cls:'good',text:'Your current performance shows a strong base for this track. Keep sharpening the weaker areas before selection rounds.'};if(s>=62)return {label:'Promising — development needed',cls:'warn',text:'You show useful ability for this track, but a few gaps could reduce your performance in placements unless you train them deliberately.'};return {label:'Low current readiness',cls:'bad',text:'Your current score suggests important gaps for this track. Treat this as a development signal, not a permanent judgement.'};}

function renderResults(){
 const caps=mergeScores(); const overall=weightedOverall(caps); const st=statusFor(overall); const sorted=Object.entries(caps).sort((a,b)=>b[1]-a[1]); const strengths=sorted.slice(0,3), gaps=sorted.slice(-3).reverse();
 const training=gaps.map(([c,s])=>({c,s,...TRAINING[c]}));
 app.innerHTML=`<section class="card"><div class="results-hero"><div><span class="status ${st.cls}">${st.label}</span><h2>${state.track.name}</h2><p class="lead">${st.text}</p><p><strong>What this score means:</strong> a snapshot of your present performance on the abilities weighted for this track. It does not predict placement success on its own.</p></div><div class="score-ring" style="--score:${overall}"><div class="inside"><strong>${overall}</strong><span>readiness score</span></div></div></div><div class="metric-grid">${Object.entries(caps).map(([c,s])=>`<div class="metric"><div class="metric-head"><span>${capLabel[c]}</span><span>${s}</span></div><div class="bar"><div style="width:${s}%"></div></div></div>`).join('')}</div></section>
 <div class="results-grid"><section class="result-card"><h3>Your stronger signals</h3><ul>${strengths.map(([c,s])=>`<li><strong>${capLabel[c]}</strong> — ${s}/100</li>`).join('')}</ul></section><section class="result-card"><h3>Your current gaps</h3><ul>${gaps.map(([c,s])=>`<li><strong>${capLabel[c]}</strong> — ${s}/100</li>`).join('')}</ul></section><section class="result-card training"><h3>Your recommended training path</h3>${training.map((t,i)=>`<div class="training-item"><div class="training-icon">${i+1}</div><div><div class="training-title">${t.title}</div><div class="training-desc">${t.desc}</div></div><span class="training-tag">Priority ${i+1}</span></div>`).join('')}<p class="fineprint">Recommended use: complete the three priority modules, practise with role-relevant cases, then retake this diagnostic. Track-specific knowledge, company eligibility and JD requirements should be checked separately.</p></section></div><div class="nav-row"><button class="secondary" id="otherTrack">Test another track</button><button class="primary" id="printResult">Print / Save result</button></div>`;
 document.getElementById('otherTrack').onclick=renderTracks;document.getElementById('printResult').onclick=()=>window.print();window.scrollTo({top:0,behavior:'smooth'});
}
renderWelcome();
