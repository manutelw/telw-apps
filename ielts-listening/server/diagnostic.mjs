import {getLearner,requireSameOrigin,readJson,reply,limit,digest} from './auth.mjs';
import {splitBank,scoreAnswers} from './bank.mjs';
const BASE='/ielts/listening/api/';
const GAP=15*86400;
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const sql=(env,text,...args)=>env.LISTENING_DB.prepare(text).bind(...args);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function own(env,learner,id){if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw fail('Invalid attempt.');const row=await sql(env,'SELECT a.*,s.public_json,s.private_json FROM listening_attempts a JOIN listening_sets s ON s.id=a.set_id WHERE a.id=?1 AND a.learner_id=?2',id,learner.id).first();if(!row)throw fail('Attempt not found.',404);return row;}
async function payload(env,row){const audio=(await sql(env,'SELECT part,duration FROM listening_audio WHERE set_id=?1 ORDER BY part',row.set_id).all()).results;return {ok:true,attemptId:row.id,setId:row.set_id,deadline:row.deadline,status:row.status,answers:JSON.parse(row.answers_json),revision:row.answers_revision,playback:JSON.parse(row.playback_json),test:JSON.parse(row.public_json),audio:audio.map(x=>({...x,url:BASE+'audio?attempt='+row.id+'&part='+x.part})),...(row.score_json?{result:JSON.parse(row.score_json)}:{})};}
async function start(env,learner,now){
 const last=await sql(env,"SELECT MAX(completed_at) AS ended FROM listening_attempts WHERE learner_id=?1",learner.id).first();if(last?.ended&&last.ended+GAP>now)return reply({error:'You can complete one Listening diagnostic every 15 days.',eligibleAt:last.ended+GAP},429);
 const active=await sql(env,"SELECT id,deadline FROM listening_attempts WHERE learner_id=?1 AND status='active'",learner.id).first();if(active)return reply(await payload(env,await own(env,learner,active.id)));
 const set=await sql(env,"SELECT s.id FROM listening_sets s WHERE s.published_at IS NOT NULL AND (SELECT count(*) FROM listening_audio au WHERE au.set_id=s.id)=4 AND NOT EXISTS(SELECT 1 FROM listening_attempts a WHERE a.learner_id=?1 AND a.set_id=s.id) ORDER BY RANDOM() LIMIT 1",learner.id).first();if(!set)throw fail('No fresh Listening set is available yet. Please contact TELW.',503);
 const audio=(await sql(env,'SELECT duration FROM listening_audio WHERE set_id=?1',set.id).all()).results;const seconds=Math.ceil(audio.reduce((n,a)=>n+a.duration,0));
 const id=crypto.randomUUID(),state={part:1,readyAt:now+30,playStartedAt:0,positions:[0,0,0,0],done:[false,false,false,false],reviewUntil:0};
 try{await sql(env,'INSERT INTO listening_attempts(id,learner_id,set_id,started_at,deadline,playback_json) VALUES(?1,?2,?3,?4,?5,?6)',id,learner.id,set.id,now,now+seconds+540,JSON.stringify(state)).run();}catch(error){const winner=await sql(env,"SELECT id FROM listening_attempts WHERE learner_id=?1 AND status='active'",learner.id).first();if(winner)return reply(await payload(env,await own(env,learner,winner.id)));throw error;}
 return reply(await payload(env,await own(env,learner,id)));
}
function validAnswers(row,input){try{scoreAnswers(JSON.parse(row.public_json),JSON.parse(row.private_json),input);return input;}catch{throw fail('Invalid answers.');}}
async function save(env,row,body,now){
 if(row.status!=='active'||now>=row.deadline)throw fail('This attempt has ended. Submit your saved answers.',409);
 if(!Number.isInteger(body.revision)||body.revision!==row.answers_revision)throw fail('Your answers changed in another window. Reload to resume the saved attempt.',409);
 const answers=validAnswers(row,body.answers);const changed=await sql(env,"UPDATE listening_attempts SET answers_json=?1,answers_revision=answers_revision+1 WHERE id=?2 AND status='active' AND answers_revision=?3 AND deadline>?4 RETURNING answers_revision",JSON.stringify(answers),row.id,body.revision,now).first();if(!changed)throw fail('Please reload your saved attempt.',409);return reply({ok:true,revision:changed.answers_revision});
}
async function playback(env,row,body,now){
 if(row.status!=='active'||now>=row.deadline)throw fail('This attempt has ended.',409);
 const state=JSON.parse(row.playback_json),part=state.part;if(part>4||body.part!==part)throw fail('This is not the current listening part.',409);
 const audio=await sql(env,'SELECT duration FROM listening_audio WHERE set_id=?1 AND part=?2',row.set_id,part).first();
 if(body.action==='play'){
  if(now<state.readyAt)throw fail('Use the question-reading time first.',409);
  if(!state.playStartedAt)state.playStartedAt=now;
 }else if(['checkpoint','end'].includes(body.action)){
  if(!state.playStartedAt||typeof body.seconds!=='number'||!Number.isFinite(body.seconds)||body.seconds<0||body.seconds>audio.duration+1||body.seconds>now-state.playStartedAt+2)throw fail('Invalid playback position.');
  state.positions[part-1]=Math.max(state.positions[part-1],Math.min(body.seconds,audio.duration));
  if(body.action==='end'){
   if(state.positions[part-1]<audio.duration-2||now-state.playStartedAt<audio.duration-2)throw fail('The recording has not finished.',409);
   state.done[part-1]=true;state.part++;state.playStartedAt=0;state.readyAt=now+30;if(state.part===5)state.reviewUntil=now+120;
  }
 }else throw fail('Invalid playback action.');
 const changed=await sql(env,"UPDATE listening_attempts SET playback_json=?1 WHERE id=?2 AND playback_json=?3 AND status='active' RETURNING id",JSON.stringify(state),row.id,row.playback_json).first();if(!changed)throw fail('Playback changed in another window. Reload to resume.',409);
 return reply({ok:true,playback:state});
}
async function submit(env,row,body,now){
 if(row.status==='completed')return reply({ok:true,attemptId:row.id,...JSON.parse(row.score_json)});
 if(row.status!=='active')throw fail('This attempt is no longer active.',409);
 if(now<row.deadline&&body.revision!==row.answers_revision)throw fail('Reload to submit the latest saved answers.',409);
 const answers=now>=row.deadline?JSON.parse(row.answers_json):validAnswers(row,body.answers);
 const result=scoreAnswers(JSON.parse(row.public_json),JSON.parse(row.private_json),answers);
 const updated=await sql(env,"UPDATE listening_attempts SET status='completed',completed_at=?1,answers_json=?2,score_json=?3 WHERE id=?4 AND status='active' AND answers_revision=?5 RETURNING id",now,JSON.stringify(answers),JSON.stringify(result),row.id,row.answers_revision).first();
 if(!updated){const winner=await sql(env,'SELECT score_json FROM listening_attempts WHERE id=?1',row.id).first();if(!winner?.score_json)throw fail('Your saved answers changed. Reload before submitting.',409);return reply({ok:true,attemptId:row.id,...JSON.parse(winner.score_json)});}
 return reply({ok:true,attemptId:row.id,...result});
}
async function audio(request,env,learner){
 const u=new URL(request.url),row=await own(env,learner,u.searchParams.get('attempt'));
 const part=Number(u.searchParams.get('part')),state=JSON.parse(row.playback_json);
 if(row.status!=='active'||Math.floor(Date.now()/1000)>=row.deadline||part!==state.part||!state.playStartedAt)throw fail('Audio is available only for the current active part.',403);
 const meta=await sql(env,'SELECT * FROM listening_audio WHERE set_id=?1 AND part=?2',row.set_id,part).first();if(!meta||!env.LISTENING_AUDIO)throw fail('The recording is unavailable.',503);
 return recordingResponse(request,env,meta);
}
async function recordingResponse(request,env,meta){
 let offset=0,length=meta.size,status=200;const range=request.headers.get('range');
 if(range){const m=range.match(/^bytes=(\d+)-(\d*)$/);if(!m)return new Response(null,{status:416,headers:{'content-range':'bytes */'+meta.size}});offset=Number(m[1]);const end=m[2]?Number(m[2]):meta.size-1;if(offset>=meta.size||end<offset)return new Response(null,{status:416,headers:{'content-range':'bytes */'+meta.size}});length=Math.min(end,meta.size-1)-offset+1;status=206;}
 const object=await env.LISTENING_AUDIO.get(meta.object_key,{range:{offset,length}});if(!object)throw fail('The recording is unavailable. Your saved answers are retained.',503);
 return new Response(object.body,{status,headers:{'content-type':'audio/mpeg','cache-control':'private, no-store','accept-ranges':'bytes','content-length':String(length),...(status===206?{'content-range':`bytes ${offset}-${offset+length-1}/${meta.size}`}:{})}});
}
function report(row,learner,body,trainer){
 const score=JSON.parse(row.score_json),pub=JSON.parse(row.public_json),priv=JSON.parse(row.private_json),answers=JSON.parse(row.answers_json);
 let html=`<h2>${trainer?'Confidential TELW Listening trainer report':'Your TELW Listening feedback'}</h2><p>${score.correct}/40 correct; ${score.answered}/40 answered.</p><p>${score.parts.map((x,i)=>`Part ${i+1}: ${x}/10`).join(' · ')}</p>`;
 html+=score.types.map(g=>`<p>${esc(g.type)}: ${g.correct}/${g.total} correct (${g.answered} answered).</p>`).join('');
 if(!trainer){const attempted=score.types.filter(x=>x.answered>0).sort((a,b)=>a.correct/a.answered-b.correct/b.answered);html+=attempted.length?`<p>Practise ${esc(attempted[0].type)} questions first. Review instructions, listen for corrections and check spelling and word limits.</p>`:'<p>No questions were answered, so this attempt cannot establish a listening priority.</p>';return html+'<p>This original TELW screening is not an official IELTS test or a calibrated band prediction. Your next completed Listening diagnostic is available after 15 days.</p>';}
 html+=`<p>Prepare this learner’s complete TELW IELTS Listening trainer resource pack.</p><p>Verified learner: ${esc(learner.email)}<br>Attempt: ${esc(row.id)}<br>Set: ${esc(row.set_id)}</p>`;
 for(const field of ['name','mobile','targetBand','testDate','studyHours'])html+=`<p>${field}: ${esc(String(body[field]||'').slice(0,200))}</p>`;
 for(let p=0;p<4;p++){html+=`<h3>${esc(pub.parts[p].title)}</h3>`+priv.parts[p].turns.map(t=>`<p><strong>${esc(t.speaker)}:</strong> ${esc(t.text)}</p>`).join('');for(let j=0;j<10;j++){const q=pub.parts[p].questions[j],k=priv.parts[p].key[j];html+=`<p>${q.id}. ${esc(q.prompt)}<br>Candidate: ${esc(answers[q.id]||'unanswered')}<br>Accepted answers: ${esc(k.accepted.join(' / '))}<br>Evidence: ${esc(k.evidence)}</p>`;}}
 return html;
}
async function sendReport(env,row,learner,body,now,trainer){
 if(body.consent!==true)throw fail('Confirm your consent to send this report.');if(row.status!=='completed')throw fail('Complete the diagnostic first.',409);
 if(!env.RESEND_API_KEY||!env.TELW_FROM_EMAIL)throw fail('Email is not configured. Your saved result remains available.',503);
 const kind=trainer?'trainer':'candidate',id=row.id+':'+kind,payload=JSON.stringify({from:env.TELW_FROM_EMAIL,to:[trainer?'manutelw@gmail.com':learner.email],...(trainer?{reply_to:learner.email}:{}),subject:trainer?'Confidential TELW IELTS Listening report':'Your TELW IELTS Listening feedback',html:'<div style="font-family:Arial,sans-serif;line-height:1.6">'+report(row,learner,body,trainer)+'</div>'});
 await sql(env,"INSERT INTO listening_delivery(id,attempt_id,kind,created_at,payload_json) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(attempt_id,kind) DO NOTHING",id,row.id,kind,now,payload).run();
 const delivery=await sql(env,'SELECT * FROM listening_delivery WHERE id=?1',id).first();if(delivery.status==='sent')return reply({ok:true});if(now-delivery.created_at>=23*3600)throw fail('Contact TELW to check delivery before resending.',409);
 const lease=await sql(env,"UPDATE listening_delivery SET status='sending',lease_until=?1 WHERE id=?2 AND status!='sent' AND lease_until<=?3 RETURNING id",now+60,id,now).first();if(!lease)throw fail('Your report is being sent.',409);
 let ok=false;try{const r=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':'listening-'+id},body:delivery.payload_json});ok=r.ok;}catch{}
 await sql(env,'UPDATE listening_delivery SET status=?1,lease_until=0 WHERE id=?2',ok?'sent':'pending',id).run();if(!ok)throw fail('Email delivery could not be confirmed. Please try again.',502);return reply({ok:true});
}
async function admin(request,env,learner,action,now){
 if(learner.email!=='manutelw@gmail.com')throw fail('TELW trainer access required.',403);
 if(action==='admin/sets'&&request.method==='GET'){const rows=(await sql(env,'SELECT * FROM listening_sets ORDER BY created_at,id').all()).results;for(const r of rows)r.audio=(await sql(env,'SELECT part,duration,size,sha256 FROM listening_audio WHERE set_id=?1 ORDER BY part',r.id).all()).results;return reply({ok:true,sets:rows});}
 if(action==='admin/preview-audio'&&request.method==='GET'){
  const u=new URL(request.url),id=u.searchParams.get('set'),part=Number(u.searchParams.get('part'));
  if(!/^listening-[a-z0-9-]{3,60}$/.test(id||'')||!Number.isInteger(part)||part<1||part>4)throw fail('Invalid set or part.');
  const meta=await sql(env,'SELECT * FROM listening_audio WHERE set_id=?1 AND part=?2',id,part).first();
  if(!meta||!env.LISTENING_AUDIO)throw fail('The recording is unavailable.',404);
  return recordingResponse(request,env,meta);
 }
 requireSameOrigin(request);if(request.method!=='POST')throw fail('POST required.',405);
 if(action==='admin/preview-submit'){
  const body=await readJson(request,16384);
  if(typeof body.setId!=='string'||!/^listening-[a-z0-9-]{3,60}$/.test(body.setId))throw fail('Invalid set ID.');
  const row=await sql(env,'SELECT public_json,private_json FROM listening_sets WHERE id=?1',body.setId).first();
  if(!row)throw fail('Set not found.',404);
  const answers=validAnswers(row,body.answers);
  return reply({ok:true,preview:true,...scoreAnswers(JSON.parse(row.public_json),JSON.parse(row.private_json),answers)});
 }
 if(action==='admin/bank'){
  const bundle=await readJson(request,256*1024);let split;try{split=splitBank(bundle);}catch(error){throw fail(error.message);}
  const pub=JSON.stringify(split.public),priv=JSON.stringify(split.private);const existing=await sql(env,'SELECT public_json,private_json FROM listening_sets WHERE id=?1',bundle.id).first();
  if(existing){if(existing.public_json===pub&&existing.private_json===priv)return reply({ok:true,unchanged:true});throw fail('This version ID already exists with different content. Use a new ID.',409);}
  await sql(env,'INSERT INTO listening_sets(id,title,public_json,private_json,created_at) VALUES(?1,?2,?3,?4,?5)',bundle.id,bundle.title,pub,priv,now).run();return reply({ok:true});
 }
 if(action==='admin/audio'){
  if(!env.LISTENING_AUDIO)throw fail('Private Listening audio storage is not configured.',503);
  const max=10*1024*1024;if(Number(request.headers.get('content-length'))>max)throw fail('Audio file too large.',413);
  const reader=request.body?.getReader();if(!reader)throw fail('Audio upload required.');let count=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>max){await reader.cancel();throw fail('Audio file too large.',413);}chunks.push(value);}
  const bytes=new Uint8Array(count);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  let form;try{form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();}catch{throw fail('Invalid audio upload.');}
  const id=form.get('setId'),part=Number(form.get('part')),duration=Number(form.get('duration')),file=form.get('audio');if(typeof id!=='string'||!Number.isInteger(part)||part<1||part>4||!Number.isFinite(duration)||duration<60||duration>1200||!file?.arrayBuffer)throw fail('Choose a set, part, measured duration and MP3 file.');
  const set=await sql(env,'SELECT published_at FROM listening_sets WHERE id=?1',id).first();if(!set)throw fail('Set not found.',404);if(set.published_at)throw fail('Published recordings cannot be replaced.',409);
  const raw=new Uint8Array(await file.arrayBuffer());if(raw.length<128||!((raw[0]===73&&raw[1]===68&&raw[2]===51)||(raw[0]===255&&(raw[1]&224)===224)))throw fail('The file is not an MP3 recording.');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const old=await sql(env,'SELECT sha256,duration FROM listening_audio WHERE set_id=?1 AND part=?2',id,part).first();if(old){if(old.sha256===hash&&old.duration===duration)return reply({ok:true,unchanged:true});throw fail('This part already has a recording. Use a new set version for changed audio.',409);}
  const key=id+'/part-'+part+'-'+hash+'.mp3';await env.LISTENING_AUDIO.put(key,raw,{httpMetadata:{contentType:'audio/mpeg'}});await sql(env,'INSERT INTO listening_audio(set_id,part,object_key,sha256,duration,size) VALUES(?1,?2,?3,?4,?5,?6)',id,part,key,hash,duration,raw.length).run();return reply({ok:true,sha256:hash,duration});
 }
 if(action==='admin/publish'){
  const body=await readJson(request);if(typeof body.setId!=='string'||!/^listening-[a-z0-9-]{3,60}$/.test(body.setId))throw fail('Invalid set ID.');if(['recordingsChecked','answersChecked','wordLimitsChecked','mapChecked'].some(k=>body.checks?.[k]!==true))throw fail('Complete the recording and answer review checklist first.');
  const set=await sql(env,'SELECT published_at,public_json,private_json FROM listening_sets WHERE id=?1',body.setId).first();if(!set)throw fail('Set not found.',404);if(set.published_at)return reply({ok:true,unchanged:true});
  const audio=(await sql(env,'SELECT part,duration FROM listening_audio WHERE set_id=?1 ORDER BY part',body.setId).all()).results;if(audio.length!==4||audio.reduce((n,a)=>n+a.duration,0)>2400)throw fail('Four finished recordings with valid measured durations are required.');
  for(const a of audio){const meta=await sql(env,'SELECT object_key FROM listening_audio WHERE set_id=?1 AND part=?2',body.setId,a.part).first();if(!await env.LISTENING_AUDIO?.head(meta.object_key))throw fail('A recording is missing from private audio storage.');}
  const review=JSON.stringify({reviewer:learner.email,checkedAt:now,checks:body.checks,contentSha256:await digest(set.public_json+'\n'+set.private_json)});
  await sql(env,'UPDATE listening_sets SET published_at=?1,review_json=?2 WHERE id=?3 AND published_at IS NULL',now,review,body.setId).run();return reply({ok:true});
 }
 throw fail('Not found',404);
}
export async function handleDiagnostic(request,env){
 const u=new URL(request.url);if(!u.pathname.startsWith(BASE))return null;const action=u.pathname.slice(BASE.length),now=Math.floor(Date.now()/1000);
 try{
  if(action==='status'&&request.method==='GET'){if(!env.LISTENING_DB||!env.LISTENING_AUDIO)return reply({ready:false});const set=await sql(env,"SELECT id FROM listening_sets WHERE published_at IS NOT NULL LIMIT 1").first();return reply({ready:!!set});}
  const learner=await getLearner(request,env);if(!learner)throw fail('Verify your email first.',401);
  if(action.startsWith('admin/'))return await admin(request,env,learner,action,now);
  if(action==='audio'&&request.method==='GET')return await audio(request,env,learner);
  if(request.method!=='POST')throw fail('POST required.',405);requireSameOrigin(request);
  if(!['start','state','save','playback','submit','feedback','enquire'].includes(action))throw fail('Not found',404);
  await limit(env,'listening:'+action+':'+learner.id,3600,action==='save'||action==='playback'?2000:60,now);
  const body=await readJson(request,16384);if(action==='start')return await start(env,learner,now);const row=await own(env,learner,body.attemptId);
  if(action==='state')return reply(await payload(env,row));if(action==='save')return await save(env,row,body,now);if(action==='playback')return await playback(env,row,body,now);if(action==='submit')return await submit(env,row,body,now);return await sendReport(env,row,learner,body,now,action==='enquire');
 }catch(error){return reply({error:error.status?error.message:'The Listening service is temporarily unavailable.'},error.status||503);}
}
