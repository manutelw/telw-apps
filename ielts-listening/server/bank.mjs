export function validateBank(bank){
 const errors=[];
 if(bank?.format!=='telw-listening-set-v1'||typeof bank.id!=='string'||!/^listening-[a-z0-9-]{3,60}$/.test(bank.id))errors.push('Invalid collection format or ID.');
 if(typeof bank?.title!=='string'||!bank.title.trim()||bank.title.length>160)errors.push('A set title is required.');
 if(!Array.isArray(bank?.parts)||bank.parts.length!==4)return {ok:false,errors:[...errors,'Four parts are required.']};
 const ids=[];
 for(const [p,part] of bank.parts.entries()){
  if(part.number!==p+1||typeof part.title!=='string'||!part.title.trim())errors.push('Invalid part heading.');
  if(!Array.isArray(part.turns)||!part.turns.length||part.turns.some(t=>!t||typeof t.speaker!=='string'||typeof t.text!=='string'||t.text.trim().length<10))errors.push('Each part needs a complete private audio script.');
  if(!Array.isArray(part.questions)||part.questions.length!==10||!Array.isArray(part.key)||part.key.length!==10){errors.push('Each part needs ten questions and private answers.');continue;}
  if(!Array.isArray(part.groups)||!part.groups.length||part.groups.some(g=>!Number.isInteger(g.from)||!Number.isInteger(g.to)||g.from<p*10+1||g.to>(p+1)*10||g.to<g.from||typeof g.instruction!=='string'))errors.push('Invalid question instructions.');
  for(const [j,q] of part.questions.entries()){
   const k=part.key[j],n=p*10+j+1;ids.push(q?.id);
   if(q?.id!==n||typeof q.prompt!=='string'||q.prompt.trim().length<3)errors.push('Invalid question '+n);
   if(!['completion','choice','matching','map'].includes(q?.type))errors.push('Unsupported question type.');
   if(q?.type==='completion'){if(!Number.isInteger(q.maxWords)||q.maxWords<1||q.maxWords>3||typeof q.allowNumber!=='boolean')errors.push('Invalid word limit.');}
   else if(q?.type==='choice'){if(!q.options||Array.isArray(q.options)||Object.keys(q.options).join('')!=='ABC'||new Set(Object.values(q.options).map(String)).size!==3)errors.push('Multiple choice needs three distinct options.');}
   else if(!Array.isArray(q?.options)||q.options.join('')!=='ABCDEFGH')errors.push('Matching labels must be A–H.');
   if(k?.id!==n||!['text','digits','time','exact'].includes(k?.normalizer)||!Array.isArray(k?.accepted)||!k.accepted.length||k.accepted.length>8||k.accepted.some(x=>typeof x!=='string'||!x.trim()||x.length>100)||typeof k?.evidence!=='string'||k.evidence.length<25)errors.push('Private answer/evidence missing for question '+n);
   if(q?.type!=='completion'&&k?.accepted?.some(x=>!Object.hasOwn(q.options||{},x)&&!q.options?.includes?.(x)))errors.push('Answer outside the available options.');
  }
  if(part.questions.some(q=>q.type==='map')&&part.visual!=='riverside-plan')errors.push('A supported map is required.');
 }
 if(new Set(ids).size!==40)errors.push('Forty distinct question IDs are required.');
 return {ok:errors.length===0,errors};
}
export function splitBank(bank){
 const result=validateBank(bank);if(!result.ok)throw Error(result.errors.join(' '));
 return {public:{id:bank.id,title:bank.title,parts:bank.parts.map(({number,title,questions,groups,visual})=>({number,title,questions,groups,...(visual?{visual}:{})}))},private:{parts:bank.parts.map(({number,title,turns,key})=>({number,title,turns,key})),reviewStatus:bank.reviewStatus||'review-pending'}};
}
const clean=value=>String(value).normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/[‐‑–—]/g,'-').replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export function normalise(value,kind){
 const s=clean(value);
 if(kind==='exact')return s.toUpperCase();
 if(kind==='digits')return /^[\d\s()+.-]+$/.test(s)?s.replace(/[^\d]/g,''):null;
 if(kind==='time'){const m=s.match(/^(\d{1,2})[.:](\d{2})$/)||s.match(/^(\d{2})(\d{2})$/);if(!m||+m[1]>23||+m[2]>59)return null;return m[1].padStart(2,'0')+':'+m[2];}
 return s;
}
function withinLimit(answer,q,key){
 if(q.type!=='completion')return true;
 if(key.normalizer==='digits'||key.normalizer==='time')return q.allowNumber&&normalise(answer,key.normalizer)!==null;
 const tokens=clean(answer).split(' ').filter(Boolean);let words=0,numbers=0;
 for(const t of tokens){if(/^\d+(?:[.:]\d+)?$/.test(t))numbers++;else words++;}
 return words<=q.maxWords&&numbers<=(q.allowNumber?1:0);
}
export function scoreAnswers(pub,priv,answers){
 if(!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length>40)throw Error('Invalid answers.');
 const allowed=new Set(Array.from({length:40},(_,i)=>String(i+1)));for(const [n,v]of Object.entries(answers))if(!allowed.has(n)||typeof v!=='string'||v.length>120)throw Error('Invalid answers.');
 let correct=0,answered=0;const parts=[],types={};
 for(let p=0;p<4;p++){
  let subtotal=0;
  for(let j=0;j<10;j++){
   const q=pub.parts[p].questions[j],key=priv.parts[p].key[j],a=answers[q.id]||'';
   types[q.type]??={type:q.type,total:0,answered:0,correct:0};const group=types[q.type];group.total++;
   if(!a.trim())continue;answered++;group.answered++;
   const n=normalise(a,key.normalizer),ok=n!==null&&withinLimit(a,q,key)&&key.accepted.some(x=>normalise(x,key.normalizer)===n);
   if(ok){correct++;subtotal++;group.correct++;}
  }parts.push(subtotal);
 }
 return {correct,total:40,answered,parts,types:Object.values(types)};
}
