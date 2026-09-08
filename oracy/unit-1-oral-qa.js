// ORACY Unit 1: oral exercise feedback + three longer WH spoken-answer questions.
(function(){
  const EDGE='/oracy/session';
  const UNIT_NO=1;
  const TEACHER_STYLE='Speak as a warm, cheerful female English teacher. Keep it short, clear and encouraging. Use gentle lively intonation. Never sound formal or robotic.';
  const attempts=new Map();
  const speechCache=new Map();
  let qaRecorder=null,qaStream=null,qaChunks=[],qaButton=null;

  const longQuestions={
    q5:{
      title:'Question 5 · Speak your answer',
      question:'Why is English useful to Mira and Ravi at the fair? Give two reasons in 2–3 sentences.',
      expected:'English helps them speak to visitors and to people who have different native languages. Many signs are also in English and Hindi, so English helps people find their way around.',
      key:'A strong answer should explain at least two of these ideas: people at the fair use different native languages; English helps Mira and Ravi communicate with visitors or other people; many signs use English and Hindi.'
    },
    q10:{
      title:'Question 5 · Speak your answer',
      question:'Why is the speaker learning English, and how does she practise? Answer in 2–3 sentences.',
      expected:'She is learning English to speak to her daughter’s teachers and to travel more easily. She practises for about twenty minutes every day so that she can speak with less fear.',
      key:'A strong answer should give at least one reason for learning English and explain how she practises. The passage says she needs English for her daughter’s teachers and travel, and she practises about twenty minutes every day so that she can speak with less fear.'
    },
    q15:{
      title:'Question 5 · Speak your answer',
      question:'How do you make the /w/ and /v/ sounds differently? Explain in 2–3 sentences and give one example word for each sound.',
      expected:'For /w/, round your lips slightly; for example, work. For /v/, touch your top teeth lightly to your lower lip and use your voice; for example, visit.',
      key:'A strong answer should explain both mouth positions and give one suitable example for each sound: /w/ uses rounded lips; /v/ uses the top teeth lightly on the lower lip.'
    }
  };

  function safe(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  async function teacherAudio(text,key=''){
    const cacheKey=key||text;
    if(speechCache.has(cacheKey))return speechCache.get(cacheKey);
    const res=await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'marin',instructions:TEACHER_STYLE,unit_no:UNIT_NO,passage_id:key?`b1a-u1-oral-${key}`:''})});
    if(!res.ok)return null;
    const blob=await res.blob();const url=URL.createObjectURL(blob);speechCache.set(cacheKey,url);return url;
  }

  async function speak(text,key=''){
    try{const url=await teacherAudio(text,key);if(url)await new Audio(url).play();}catch{}
  }

  function rightAnswerText(button){
    const box=button.closest('.activity');
    const right=box?.querySelector(`input[name="${button.dataset.question}"][value="${button.dataset.answer}"]`);
    return right?.closest('label')?.textContent?.replace(/\s+/g,' ').trim()||'';
  }

  // Keep the existing learning-note feedback, but make the check response oral and reveal the answer after two wrong tries.
  document.querySelectorAll('.check').forEach(button=>{
    if(longQuestions[button.dataset.question])return;
    button.addEventListener('click',()=>{
      const box=button.closest('.activity');
      const selected=box?.querySelector(`input[name="${button.dataset.question}"]:checked`);
      if(!selected)return;
      const id=button.dataset.question;const correct=selected.value===button.dataset.answer;
      if(correct){attempts.set(id,0);speak('Correct. Well done!',`${id}-correct`);return;}
      const count=(attempts.get(id)||0)+1;attempts.set(id,count);
      if(count<2){speak('Not quite. Try again.',`${id}-retry`);return;}
      const answer=rightAnswerText(button);const out=box.querySelector('.answer');
      const note=(typeof learningNotes!=='undefined'&&learningNotes[id])?learningNotes[id]:'';
      if(out){out.className='answer bad';out.innerHTML=`<b>Not quite.</b> The right answer is <b>${safe(answer)}</b>.${note?`<div style="margin-top:6px"><b>Language note:</b> ${safe(note)}</div>`:''}`;}
      speak(`Not quite. The right answer is ${answer}.`,`${id}-answer`);attempts.set(id,0);
    });
  });

  function buildLongQuestion(id,spec){
    const old=document.querySelector(`.check[data-question="${id}"]`)?.closest('.activity');
    if(!old)return;
    old.classList.add('oral-long-answer');old.dataset.oralId=id;
    old.innerHTML=`<h3>${safe(spec.title)}</h3><p><b>${safe(spec.question)}</b></p><p>Answer aloud in 2–3 sentences.</p><button type="button" class="hear-oral-question">🔊 Hear question</button> <button type="button" class="record-oral-answer">🎤 Record answer</button><div class="oral-status" style="margin-top:8px"></div><div class="answer oral-answer"></div>`;
    old.querySelector('.hear-oral-question').addEventListener('click',()=>speak(spec.question,`${id}-question`));
    old.querySelector('.record-oral-answer').addEventListener('click',e=>toggleLongAnswer(e.currentTarget,id,spec));
  }

  async function toggleLongAnswer(button,id,spec){
    const box=button.closest('.oral-long-answer');const status=box.querySelector('.oral-status');
    if(qaRecorder&&qaButton===button){qaRecorder.stop();return;}
    if(qaRecorder){status.textContent='Finish the current recording first.';return;}
    try{
      qaStream=await navigator.mediaDevices.getUserMedia({audio:true});qaChunks=[];qaButton=button;qaRecorder=new MediaRecorder(qaStream);
      qaRecorder.ondataavailable=e=>{if(e.data.size)qaChunks.push(e.data)};
      qaRecorder.onstop=()=>checkLongAnswer(box,button,id,spec);
      qaRecorder.start();button.textContent='■ Stop & check';status.textContent='Recording…';
    }catch{status.textContent='Please allow microphone access.';}
  }

  async function checkLongAnswer(box,button,id,spec){
    const status=box.querySelector('.oral-status'),out=box.querySelector('.oral-answer');
    qaStream?.getTracks().forEach(t=>t.stop());const blob=new Blob(qaChunks,{type:qaRecorder?.mimeType||'audio/webm'});status.textContent='Checking your answer…';
    try{
      const prompt=`This is a short spoken comprehension check, not the final speaking task. Question: ${spec.question}\n${spec.key}\nScore task achievement 3 only when the answer gives the required factual content. Score 2 if it is partly right but misses an important point. Score 1 if it is wrong or off-topic. Do not require discourse markers for this comprehension check.`;
      const form=new FormData();form.append('action','evaluate');form.append('unit','TELW Level B1A Unit 1');form.append('unit_no',String(UNIT_NO));form.append('prompt',prompt);form.append('audio',blob,'answer.webm');
      const res=await fetch(EDGE,{method:'POST',body:form});if(!res.ok)throw new Error('Answer check could not be completed.');const data=await res.json();
      const score=Number(data?.rubric?.task_achievement?.score||0);const correct=score===3;
      if(correct){attempts.set(id,0);out.className='answer oral-answer ok';out.innerHTML='<b>Correct. Well done!</b>';status.textContent='Your recording was checked and discarded.';await speak('Correct. Well done!',`${id}-oral-correct`);return;}
      const count=(attempts.get(id)||0)+1;attempts.set(id,count);
      if(count<2){out.className='answer oral-answer bad';out.innerHTML='<b>Not quite. Try again.</b>';status.textContent='Try the same question once more.';await speak('Not quite. Try again.',`${id}-oral-retry`);return;}
      out.className='answer oral-answer bad';out.innerHTML=`<b>Here is a good answer:</b><div style="margin-top:6px">${safe(spec.expected)}</div>`;status.textContent='Listen to the answer, then record again if you want to practise it.';
      await speak(`Not quite. Here is a good answer. ${spec.expected}`,`${id}-oral-model`);attempts.set(id,0);
    }catch(e){status.textContent=e.message||'Answer check could not be completed.';}
    finally{qaChunks=[];qaRecorder=null;qaButton=null;button.textContent='🎤 Record answer';}
  }

  Object.entries(longQuestions).forEach(([id,spec])=>buildLongQuestion(id,spec));
})();
