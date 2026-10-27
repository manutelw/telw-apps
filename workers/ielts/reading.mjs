import {getLearner,requireSameOrigin,readJson,reply,limit} from './auth.mjs';
const GAP=15*24*3600;
const fail=(message,status)=>Object.assign(new Error(message),{status});
const sql=(env,text,...args)=>env.IELTS_DB.prepare(text).bind(...args);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function answersFrom(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>40)throw fail('Invalid answers.',400);
 const answers={};for(const [k,v] of Object.entries(input)){
  if(!/^(?:[0-9]|[1-3][0-9])$/.test(k)||!Number.isInteger(v)||v<0||v>2)throw fail('Invalid answers.',400);
  answers[k]=v;
 }return answers;
}
function publicPassages(content) {
 if(!Array.isArray(content.passages)||content.passages.length!==4)throw fail('This test version is unavailable.',503);
 return content.passages.map(p=>({title:p.title,paragraphs:p.paragraphs,questions:p.questions}));
}
function score(answers,keys) {
 if(!Array.isArray(keys)||keys.length!==40||keys.some(x=>!Number.isInteger(x)||x<0||x>2))throw fail('This test version cannot be scored.',503);
 const parts=[0,0,0,0],types=[{label:'TRUE / FALSE / NOT GIVEN',correct:0,total:24},{label:'Multiple choice',correct:0,total:16}];let correct=0;
 for(let i=0;i<40;i++)if(answers[i]===keys[i]){correct++;parts[Math.floor(i/10)]++;types[i%10<6?0:1].correct++;}
 return {correct,total:40,answered:Object.keys(answers).length,parts,types};
}
async function attempt(env,learner,id) {
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw fail('Invalid attempt.',400);
 const row=await sql(env,`SELECT a.*,v.content_json,v.private_key_json FROM ielts_attempts a JOIN ielts_test_versions v ON v.id=a.version_id WHERE a.id=?1 AND a.learner_id=?2 AND a.skill='reading'`,id,learner.id).first();
 if(!row)throw fail('Attempt not found.',404);return row;
}
function activePayload(row) {
 return {ok:true,attemptId:row.id,versionId:row.version_id,track:row.track,deadline:row.deadline,
  answers:JSON.parse(row.response_json||'{}'),passages:publicPassages(JSON.parse(row.content_json))};
}
async function start(env,learner,body,now) {
 if(!['academic','general'].includes(body.track))throw fail('Choose a test type.',400);
 const latest=await sql(env,`SELECT MAX(completed_at) AS completed FROM ielts_attempts WHERE learner_id=?1 AND skill='reading'`,learner.id).first();
 if(latest?.completed && latest.completed+GAP>now)return reply({error:'You can complete one Reading diagnostic every 15 days.',eligibleAt:latest.completed+GAP},429);
 const current=await sql(env,`SELECT a.*,v.content_json FROM ielts_attempts a JOIN ielts_test_versions v ON v.id=a.version_id WHERE a.learner_id=?1 AND a.skill='reading' AND a.status='active'`,learner.id).first();
 if(current && current.deadline>now)return reply(activePayload(current));
 if(current)await sql(env,`UPDATE ielts_attempts SET status='abandoned' WHERE id=?1 AND status='active'`,current.id).run();
 const version=await sql(env,`SELECT id,content_json FROM ielts_test_versions v WHERE skill='reading' AND track=?1 AND approved_at IS NOT NULL AND approved_at<=?2 AND NOT EXISTS(SELECT 1 FROM ielts_attempts a WHERE a.version_id=v.id AND a.learner_id=?3) ORDER BY approved_at,id LIMIT 1`,body.track,now,learner.id).first();
 if(!version)throw fail('No fresh approved Reading test is available. Please contact TELW.',503);
 // A unique active-attempt index and cooldown trigger arbitrate simultaneous starts.
 publicPassages(JSON.parse(version.content_json));
 const id=crypto.randomUUID();
 try{await sql(env,`INSERT INTO ielts_attempts(id,learner_id,skill,track,version_id,started_at,deadline) VALUES(?1,?2,'reading',?3,?4,?5,?6)`,id,learner.id,body.track,version.id,now,now+3600).run();}
 catch(error){
  const winner=await sql(env,`SELECT a.*,v.content_json FROM ielts_attempts a JOIN ielts_test_versions v ON v.id=a.version_id WHERE a.learner_id=?1 AND a.skill='reading' AND a.status='active'`,learner.id).first();
  if(winner)return reply(activePayload(winner));
  if(String(error.message).includes('IELTS_READING_COOLDOWN'))throw fail('Your next Reading diagnostic is available after 15 days.',429);
  throw error;
 }
 return reply(activePayload(await attempt(env,learner,id)));
}
async function save(env,learner,body,now) {
 const row=await attempt(env,learner,body.attemptId);
 if(row.status!=='active')throw fail('This attempt has already ended.',409);
 if(now>=row.deadline)throw fail('Time has ended. Submit your saved answers.',409);
 const answers=answersFrom(body.answers);
 await sql(env,`UPDATE ielts_attempts SET response_json=?1 WHERE id=?2 AND status='active' AND deadline>?3`,JSON.stringify(answers),row.id,now).run();
 return reply({ok:true});
}
async function submit(env,learner,body,now) {
 const row=await attempt(env,learner,body.attemptId);
 if(row.status==='completed')return reply({...JSON.parse(row.score_json),ok:true,attemptId:row.id});
 if(row.status!=='active')throw fail('This attempt is no longer active.',409);
 // Late submissions can only score answers saved before the server deadline.
 const answers=now>=row.deadline?JSON.parse(row.response_json||'{}'):answersFrom(body.answers);
 const privateKey=JSON.parse(row.private_key_json||'null');
 const result=score(answers,privateKey?.keys);
 const written=await sql(env,`UPDATE ielts_attempts SET status='completed',completed_at=?1,response_json=?2,score_json=?3 WHERE id=?4 AND status='active' RETURNING id`,now,JSON.stringify(answers),JSON.stringify(result),row.id).first();
 if(!written){const winner=await attempt(env,learner,row.id);if(winner.status==='completed')return reply({...JSON.parse(winner.score_json),ok:true,attemptId:row.id});throw fail('This attempt is no longer active.',409);}
 return reply({...result,ok:true,attemptId:row.id});
}
function candidateReport(row) {
 const result=JSON.parse(row.score_json),answers=JSON.parse(row.response_json),key=JSON.parse(row.private_key_json).keys;
 const groups=[{label:'TRUE / FALSE / NOT GIVEN',total:24,answered:0,correct:0},{label:'Multiple choice',total:16,answered:0,correct:0}];
 const patterns={unstatedMarkedTrue:0,unstatedMarkedFalse:0,statedMarkedUnstated:0};
 for(let i=0;i<40;i++){
  if(!Object.hasOwn(answers,String(i)))continue;
  const group=groups[i%10<6?0:1];group.answered++;
  if(answers[i]===key[i])group.correct++;
  else if(i%10<6){
   if(key[i]===2&&answers[i]===0)patterns.unstatedMarkedTrue++;
   else if(key[i]===2&&answers[i]===1)patterns.unstatedMarkedFalse++;
   else if(key[i]!==2&&answers[i]===2)patterns.statedMarkedUnstated++;
  }
 }
 const answered=groups.reduce((n,g)=>n+g.answered,0),unanswered=40-answered;
 const ranked=groups.filter(g=>g.answered>0).sort((a,b)=>a.correct/a.answered-b.correct/b.answered);
 let focus='<p>You did not answer any questions, so we cannot identify a reading priority from this attempt.</p>';
 if(ranked.length===1||ranked.some(g=>g.answered<5)){
  focus='<p>You answered too few questions in at least one type to make a reliable comparison. Practise both types and complete more questions next time.</p>';
 } else if(ranked.length){
  const first=ranked[0];
  const tied=ranked.length===2&&ranked[0].correct*ranked[1].answered===ranked[1].correct*ranked[0].answered;
  focus=tied?'<p>Your accuracy was similar across the two question types you answered. Practise both.</p>':`<p>Your first practice priority is <strong>${escape(first.label)}</strong>: you got ${first.correct} of ${first.answered} attempted questions correct in this group. This comparison is based only on this test.</p>`;
 }
 const notes=[];
 if(patterns.unstatedMarkedTrue)notes.push(`You marked ${patterns.unstatedMarkedTrue} unstated ${patterns.unstatedMarkedTrue===1?'claim':'claims'} TRUE. Look for information that directly supports the whole claim before choosing TRUE.`);
 if(patterns.unstatedMarkedFalse)notes.push(`You marked ${patterns.unstatedMarkedFalse} unstated ${patterns.unstatedMarkedFalse===1?'claim':'claims'} FALSE. Choose FALSE only when the text contradicts the claim.`);
 if(patterns.statedMarkedUnstated)notes.push(`You marked ${patterns.statedMarkedUnstated} ${patterns.statedMarkedUnstated===1?'claim':'claims'} NOT GIVEN when the passage stated enough to judge ${patterns.statedMarkedUnstated===1?'it':'them'}. Check the relevant lines again for support or contradiction.`);
 const exercises={
  'TRUE / FALSE / NOT GIVEN':'Take a short practice passage. For each statement, underline the words that support or contradict it. If neither is present, write “not stated”. Check the answer, then explain why the other two labels do not fit.',
  'Multiple choice':'Take five practice questions. Find the relevant lines first. For each option, say why the text supports it or rules it out. Check the key and note any distractor that looked tempting.'
 };
 const ordered=ranked.length?ranked:groups;
 return `<h2>Your TELW IELTS Reading diagnostic feedback</h2><p>${escape(row.track)} · ${result.correct}/40 correct · ${answered}/40 answered</p>`+
 (unanswered?`<p>You left ${unanswered} ${unanswered===1?'question':'questions'} unanswered. These count as incorrect in the score; the accuracy comparison below uses questions you answered.</p>`:'')+
 '<h3>Your results</h3>'+groups.map(g=>`<p>${escape(g.label)}: ${g.correct} correct out of ${g.answered} answered (${g.total} questions in the test).</p>`).join('')+
 `<h3>What to work on</h3>${focus}`+notes.map(n=>`<p>${escape(n)}</p>`).join('')+
 '<h3>Practice for your next attempt</h3>'+ordered.map((g,i)=>`<p><strong>${i+1}. ${escape(g.label)}:</strong> ${escape(exercises[g.label])}</p>`).join('')+
 '<p>This original, uncalibrated diagnostic does not predict an official IELTS band. Your next completed Reading diagnostic is available 15 days after this one.</p><p>TELW The English Workshop</p>';
}
function trainerReport(row,learner,body) {
 const content=JSON.parse(row.content_json),key=JSON.parse(row.private_key_json),answers=JSON.parse(row.response_json),result=JSON.parse(row.score_json);
 const fields=['name','mobile','targetBand','testDate','studyHours'];
 return `<h2>Confidential TELW trainer evidence</h2><p>Prepare this learner’s complete TELW IELTS Reading trainer resource pack.</p><p>Verified learner: ${escape(learner.email)}<br>Attempt: ${escape(row.id)}<br>Version: ${escape(row.version_id)}<br>Score: ${result.correct}/40</p>`+
 fields.map(f=>`<p>${escape(f)}: ${escape(String(body[f]||'').slice(0,200))}</p>`).join('')+
 content.passages.map((p,i)=>`<h3>${escape(p.title)}</h3>`+p.paragraphs.map(t=>`<p>${escape(t)}</p>`).join('')+p.questions.map((q,j)=>{const n=i*10+j;return `<p><strong>${n+1}. ${escape(q[1])}</strong><br>Options: ${escape(JSON.stringify(q[0]==='tf'?['TRUE','FALSE','NOT GIVEN']:q[2]))}<br>Selected index: ${escape(answers[n]??'unanswered')}<br>Correct index: ${key.keys[n]}<br>Evidence: ${escape(key.evidence?.[n]?.explanation||'Not supplied')}</p>`;}).join('')).join('');
}
async function mail(env,learner,body,now,kind) {
 if(body.consent!==true)throw fail('Please confirm your consent to send this report.',400);
 if(!env.RESEND_API_KEY||!env.TELW_FROM_EMAIL)throw fail('Email is unavailable. Your saved result remains available.',503);
 const row=await attempt(env,learner,body.attemptId);
 if(row.status!=='completed')throw fail('Complete your diagnostic first.',409);
 const id=row.id+':'+kind;
 const trainer=kind==='trainer_report';
 const payload=JSON.stringify({from:env.TELW_FROM_EMAIL,to:[trainer?'manutelw@gmail.com':learner.email],...(trainer?{reply_to:learner.email}:{}),subject:trainer?'Confidential TELW IELTS Reading report':'Your TELW IELTS Reading diagnostic feedback',html:`<div style="font-family:Arial,sans-serif;line-height:1.6">${trainer?trainerReport(row,learner,body):candidateReport(row)}</div>`});
 await sql(env,`INSERT INTO ielts_email_delivery(id,learner_id,attempt_id,kind,sent_at,status,created_at,payload_json) VALUES(?1,?2,?3,?4,0,'pending',?5,?6) ON CONFLICT(attempt_id,kind) DO NOTHING`,id,learner.id,row.id,kind,now,payload).run();
 const delivery=await sql(env,'SELECT * FROM ielts_email_delivery WHERE id=?1',id).first();
 if(delivery.status==='sent')return reply({ok:true,reference:row.id});
 // Provider deduplication is time-limited. After 23h an uncertain send needs operator review.
 if(now-delivery.created_at>=23*3600)throw fail('Please contact TELW to check delivery before resending.',409);
 const lease=await sql(env,`UPDATE ielts_email_delivery SET status='sending',lease_until=?1 WHERE id=?2 AND status!='sent' AND lease_until<=?3 RETURNING id`,now+60,id,now).first();
 if(!lease)throw fail('Your report is being sent. Please check again shortly.',409);
 let sent=false;
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':'ielts-'+id},body:delivery.payload_json});sent=response.ok;
 }catch{/* Use the same provider idempotency key on an authorized retry. */}
 if(!sent){await sql(env,`UPDATE ielts_email_delivery SET status='pending',lease_until=0 WHERE id=?1 AND status='sending'`,id).run();throw fail('Email could not be confirmed. Please try again.',502);}
 await sql(env,`UPDATE ielts_email_delivery SET status='sent',sent_at=?1,lease_until=0 WHERE id=?2`,now,id).run();
 return reply({ok:true,reference:row.id,phone:'9211392003'});
}
export async function handleReading(request,env) {
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/ielts/reading/'))return null;
 if(url.origin!=='https://manuvikraman.com')return reply({error:'Not found'},404);
 if(request.method!=='POST')return reply({error:'POST required'},405,{allow:'POST'});
 try{
  requireSameOrigin(request);const learner=await getLearner(request,env);
  if(!learner)return reply({error:'Please verify your email.'},401);
  const now=Math.floor(Date.now()/1000),action=url.pathname.slice('/api/ielts/reading/'.length);
  if(!['start','save','submit','feedback-email','enquire'].includes(action))throw fail('Not found',404);
  await limit(env,'reading:'+action+':'+learner.id,3600,action==='save'?2000:action==='start'?60:30,now);
  const body=await readJson(request,16384);
  if(action==='start')return await start(env,learner,body,now);
  if(action==='save')return await save(env,learner,body,now);
  if(action==='submit')return await submit(env,learner,body,now);
  return await mail(env,learner,body,now,action==='enquire'?'trainer_report':'candidate_feedback');
 }catch(error){return reply({error:error.status?error.message:'The Reading service is temporarily unavailable.'},error.status||503);}
}
