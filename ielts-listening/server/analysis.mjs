import {scoreAnswers,normalise,withinLimit} from './bank.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={completion:'Note and sentence completion',choice:'Multiple choice',matching:'Matching',map:'Map labelling'};
const skills=['Follow an everyday conversation and record specific details, such as names, numbers and arrangements.','Follow one speaker giving everyday information, directions or explanations.','Follow an educational discussion, including speakers’ views, reasons and decisions.','Follow an academic talk and identify its main ideas and supporting details.'];
const practice={completion:'Read the word limit first. Predict the kind of answer needed, listen for the final detail, then check the exact word or number.',choice:'Read all options. Listen for the meaning of the whole statement and any corrections before selecting an option.',matching:'Compare the labels before listening. Note how each speaker or item differs, and match meaning rather than repeated words.',map:'Mark the starting point and direction. Follow each turn and landmark in order before choosing the label.'};
export function analyse(pub,priv,answers){
 const score=scoreAnswers(pub,priv,answers),questions=[],parts=[];
 for(let p=0;p<4;p++){
  for(let j=0;j<10;j++){
   const q=pub.parts[p].questions[j],key=priv.parts[p].key[j],answer=answers[q.id]||'',answered=!!answer.trim(),limit=withinLimit(answer,q,key),n=normalise(answer,key.normalizer);
   const correct=answered&&limit&&n!==null&&key.accepted.some(a=>normalise(a,key.normalizer)===n);
   const reason=correct?'Matches an accepted answer.':!answered?'No answer was recorded.':!limit?'The answer does not meet the word or number rule.':n===null?'The answer does not use the required number or time format.':'The answer does not match an accepted answer. The response alone does not establish why.';
   const group=pub.parts[p].groups.find(g=>q.id>=g.from&&q.id<=g.to);
   const optionText=a=>q.type==='choice'&&q.options?.[a]?a+' — '+q.options[a]:a;
   questions.push({id:q.id,part:p+1,type:q.type,prompt:q.prompt,answer:optionText(answer),accepted:key.accepted.map(optionText),correct,reason,instruction:group?.instruction||'',evidence:key.evidence});
  }
  const rows=questions.filter(q=>q.part===p+1),right=rows.filter(q=>q.correct).map(q=>q.id),missed=rows.filter(q=>!q.correct).map(q=>q.id);
  parts.push({part:p+1,title:pub.parts[p].title,skill:skills[p],correct:score.parts[p],answered:rows.filter(q=>q.answer.trim()).length,right,missed});
 }
 const priorities=score.types.filter(g=>g.correct<g.total).sort((a,b)=>(b.total-b.correct)-(a.total-a.correct)||a.correct/a.total-b.correct/b.total).slice(0,3).map(g=>({type:g.type,label:labels[g.type],correct:g.correct,total:g.total,missed:g.total-g.correct,action:practice[g.type]}));
 return {score,parts,questions,priorities};
}
export function analysisHtml(a,trainer=false,email=false){
 const s=a.score;
 let html=`<h3>Where you stand</h3><p>${s.correct}/40 correct; ${s.answered}/40 answered; ${40-s.answered} unanswered. This score describes this attempt. It is not an official IELTS band or a diagnosis of the cause of an error.</p>`;
 html+='<h3>Part-by-part feedback</h3>'+a.parts.map(p=>`<h4>Part ${p.part}: ${esc(p.title)} — ${p.correct}/10</h4><p>${esc(p.skill)}</p><p>Correct answers: ${p.right.join(', ')||'none'}. Questions to review: ${p.missed.join(', ')||'none'}.</p>`).join('');
 html+='<h3>Question-type performance</h3>'+s.types.map(g=>`<p>${esc(labels[g.type])}: ${g.correct}/${g.total} correct; ${g.answered}/${g.total} answered. This sample contains ${g.total} questions of this type.</p>`).join('');
 html+='<h3>Your practice priorities</h3>'+(s.answered===0?'<p>No answers were recorded, so listening ability and a training priority cannot be established. Complete a supported diagnostic first.</p>':a.priorities.length?'<ol>'+a.priorities.map(g=>`<li><strong>${esc(g.label)} (${g.correct}/${g.total})</strong>: ${esc(g.action)}</li>`).join('')+'</ol>':'<p>All answers were correct on this set. Confirm this performance on fresh material before deciding what training you need.</p>');
 html+='<h3>Answer-by-answer review</h3><p>Compare your answer with the accepted answer and the supporting detail below. A different answer may need trainer review; it does not by itself prove weak vocabulary, poor concentration or difficulty with an accent.</p>';
 html+=a.questions.map(q=>`<details><summary>Question ${q.id} — ${q.correct?'Correct':q.answer.trim()?'Review':'Unanswered'}</summary><p>${esc(q.prompt)}</p><p>Instruction: ${esc(q.instruction)}</p><p>Your answer: ${esc(q.answer||'No answer')}<br>Accepted answer(s): ${esc(q.accepted.join(' / '))}</p><p>${esc(q.reason)}</p><p>Supporting detail: ${esc(q.evidence)}</p></details>`).join('');
 if(trainer){html+='<h3>Proposed TELW training programme — confirm in a feedback call</h3><p>Use this as a starting plan, not a confirmed diagnosis. Ask the learner to explain selected wrong answers and check whether reading, hearing the detail, spelling or task instructions caused the difficulty. Agree the target, test date and available study time before setting a course length.</p>';
 html+=s.answered===0?'<p>First meeting: check sound, task understanding and access; then run a short supported listening task. Build the programme after that evidence is available.</p>':a.priorities.length?'<ol>'+a.priorities.map((g,i)=>`<li><strong>Practice block ${i+1}: ${esc(g.label)}</strong><p>Baseline: ${g.correct}/${g.total}; ${g.missed} missed. ${esc(g.action)}</p><p>Guided work: review two relevant errors, replay a short extract with the trainer, explain the evidence and attempt a fresh task. Independent work: two short tasks and an error log. Progress check: a fresh ten-question task with the same question type; compare accuracy and compliance with instructions, then repeat before increasing difficulty.</p></li>`).join('')+'</ol><p>Final check: complete a fresh four-part set and compare part scores, question types and unanswered items. Adjust the next practice block from that evidence.</p>':'<p>Use a fresh four-part set to confirm the result. Discuss the learner’s target and confidence before recommending paid training.</p>';
 }
 return email?html.replace(/<details>/g,'<div style="border-top:1px solid #ddd;padding:12px 0">').replace(/<\/details>/g,'</div>').replace(/<summary>/g,'<h4>').replace(/<\/summary>/g,'</h4>'):html;
}
export const completedAnalysis=row=>analyse(JSON.parse(row.public_json),JSON.parse(row.private_json),JSON.parse(row.answers_json));
