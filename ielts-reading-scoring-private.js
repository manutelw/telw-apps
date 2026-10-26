// Private scoring keys. Never expose this module through the public asset handler.
const KEYS={"academic":[1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,0,0,1,0,1,0,1,0,1,1,0,0,0,0,1,0,1,0,1,0,0,0,0],"general":[1,0,0,1,0,1,1,1,0,2,0,1,0,0,1,1,0,1,1,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0]};
export async function scoreIeltsReading(request){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 let body;try{body=await request.json()}catch{return new Response('Invalid JSON',{status:400})}
 if(!body||!Object.hasOwn(KEYS,body.track)||!body.answers||typeof body.answers!=='object'||Array.isArray(body.answers))return new Response('Invalid request',{status:400});
 const key=KEYS[body.track];let correct=0;const parts=[0,0,0,0];const types=[{label:"TRUE / FALSE / NOT GIVEN",correct:0,total:24},{label:"Multiple choice",correct:0,total:16}];
 for(let i=0;i<key.length;i++){const answer=body.answers[String(i)];if(Number.isInteger(answer)&&answer===key[i]){correct++;parts[Math.floor(i/10)]++;types[i%10<6?0:1].correct++}}
 return new Response(JSON.stringify({correct,parts,total:40,types}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'}});
}

const TELW_EMAIL='manutelw@gmail.com';
const TELW_PHONE='9211392003';
function jsonReply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'}})}
function safeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function countAnswers(track,answers){
 const key=KEYS[track],parts=[0,0,0,0],types=[{label:'TRUE / FALSE / NOT GIVEN',correct:0,total:24},{label:'Multiple choice',correct:0,total:16}];
 let correct=0,answered=0;const missed=[];
 for(let i=0;i<40;i++){const a=answers[String(i)];if(a!==undefined){answered++;if(!Number.isInteger(a)||a<0||a>2)throw Error('Invalid answer');}
 if(a===key[i]){correct++;parts[Math.floor(i/10)]++;types[i%10<6?0:1].correct++}
 else missed.push({number:i+1,passage:Math.floor(i/10)+1,type:i%10<6?'TRUE / FALSE / NOT GIVEN':'Multiple choice',answered:a!==undefined});
 }
 return {correct,answered,parts,types,missed};
}
export async function sendIeltsReadingEnquiry(request,env){
 if(request.method!=='POST')return jsonReply({ok:false,error:'POST required'},405);
 let data;try{data=await request.json()}catch{return jsonReply({ok:false,error:'Invalid request'},400)}
 if(!data||!Object.hasOwn(KEYS,data.track)||!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))return jsonReply({ok:false,error:'Invalid diagnostic data'},400);
 const name=String(data.name||'').trim(),email=String(data.email||'').trim(),mobile=String(data.mobile||'').trim();
 if(name.length<2||name.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!/^[+0-9 ()-]{8,22}$/.test(mobile)||data.consent!==true)return jsonReply({ok:false,error:'Enter your name, a valid email and mobile number, and agree to share your diagnostic with TELW.'},400);
 if(Object.keys(data.answers).length>40)return jsonReply({ok:false,error:'Invalid diagnostic answers'},400);
 let result;try{result=countAnswers(data.track,data.answers)}catch{return jsonReply({ok:false,error:'Invalid diagnostic answers'},400)}
 const apiKey=env.RESEND_API_KEY,from=env.TELW_FROM_EMAIL;
 if(!apiKey||!from)return jsonReply({ok:false,error:'TELW email delivery is not configured. Please call 9211392003.'},503);
 const reference='TELW-IELTS-'+crypto.randomUUID().slice(0,8).toUpperCase();
 const sorted=result.types.slice().sort((a,b)=>a.correct/a.total-b.correct/b.total);
 const low=result.parts.map((n,i)=>({n,passage:i+1})).filter(x=>x.n<6).map(x=>'Passage '+x.passage+' ('+x.n+'/10)');
 const priorities=sorted.map(t=>t.label+' ('+t.correct+'/'+t.total+')');
 const plan=[
 '1. Review the missed question numbers and establish the learner’s reasoning in the first session.',
 '2. Begin with '+sorted[0].label+' questions; check evidence selection and answer accuracy before introducing timed practice.',
 '3. '+(low.length?'Revisit lower-scoring passages: '+low.join(', ')+'.':'Check whether accuracy remains consistent across longer and more demanding texts.') ,
 '4. Reassess with a fresh reading set and compare question-type and passage accuracy.',
 '5. Confirm the learner’s IELTS target band, test type and deadline before fixing the number of classes.'
 ];
 const rows=result.missed.map(q=>'Q'+q.number+' (P'+q.passage+', '+q.type+', '+(q.answered?'incorrect':'unanswered')+')').join('; ');
 const content='<div style="font-family:Arial,sans-serif;line-height:1.55;color:#173047;max-width:760px"><h2>TELW IELTS Reading — Training enquiry</h2><p><strong>Reference:</strong> '+reference+'</p><p><strong>Name:</strong> '+safeHtml(name)+'<br><strong>Email:</strong> '+safeHtml(email)+'<br><strong>Mobile:</strong> '+safeHtml(mobile)+'<br><strong>Test:</strong> '+safeHtml(data.track==='academic'?'Academic':'General Training')+'<br><strong>Score:</strong> '+result.correct+'/40 ('+result.answered+' answered)</p><h3>Diagnostic evidence</h3><p><strong>Passages:</strong> '+result.parts.map((n,i)=>'P'+(i+1)+' '+n+'/10').join(' · ')+'</p><p><strong>Question types:</strong> '+result.types.map(t=>safeHtml(t.label)+' '+t.correct+'/'+t.total).join(' · ')+'</p><p><strong>Questions missed or unanswered:</strong> '+safeHtml(rows||'None')+'</p><h3>Priority areas</h3><p>'+safeHtml(priorities.join(' → '))+'</p><h3>Provisional individual training plan</h3><ol>'+plan.map(p=>'<li>'+safeHtml(p.slice(3))+'</li>').join('')+'</ol><p><em>This is an original, uncalibrated diagnostic. Scores and response patterns cannot establish an official IELTS band or the cause of individual errors. Confirm needs in the first session.</em></p><p>Candidate explicitly requested TELW training information and consented to sharing contact details and diagnostic results.</p></div>';
 let response;try{response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({from:from,to:[TELW_EMAIL],reply_to:email,subject:'IELTS Reading training enquiry — '+name+' — '+reference,html:content})})}catch{return jsonReply({ok:false,error:'Could not reach the email service. Please try again or call '+TELW_PHONE+'.'},502)}
 if(!response.ok)return jsonReply({ok:false,error:'Email could not be delivered. Please try again or call '+TELW_PHONE+'.'},502);
 return jsonReply({ok:true,reference,phone:TELW_PHONE});
}
