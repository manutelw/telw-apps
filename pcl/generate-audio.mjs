import fs from 'node:fs/promises';
import path from 'node:path';
import {moduleIds,moduleContent} from './units.mjs';

const API='https://kjxywlvgsweagrdydbef.supabase.co/functions/v1/pcl-pilot-1';
const KEY='sb_publishable_hVL6AQ1GUGzizmiIZBWDlA_UTj5us9q';
const only=process.argv.slice(2);
const ids=only.length?moduleIds.filter(id=>only.includes(id)||only.includes(id.split('.')[0])):moduleIds;
const jobs=[];
for(const id of ids){
  const s=moduleContent(id),base=`audio/unit-${s.unit}/${id.replace('.','-')}`;
  jobs.push(
    [`${base}-learn-1.mp3`,'coach',`Language focus for ${s.title}. ${s.grammar}`],
    [`${base}-learn-2.mp3`,'coach',`Five useful workplace chunks for this task: ${s.vocabItems.join('; ')}. Use them naturally when they support your meaning.`],
    [`${base}-learn-3.mp3`,'coach','Build your answer in four stages. Direct Answer: say what. Explain: say why. Business Link: give proof, then explain so what. Judgement: decide what next. This is the managerial thinking inside TELW.'],
    [`${base}-learn-4.mp3`,'coach',`Listen for how the response is built. It answers directly, explains the reason, connects evidence to the business effect, and ends with a clear judgement. ${s.employee}`],
    [`${base}-model-manager.mp3`,'manager',s.manager],
    [`${base}-model-employee.mp3`,'employee',s.employee]
  );
}
async function create([file,role,text]){
  try{const old=await fs.readFile(file);if(old.length>1000)return `kept ${file}`}catch{}
  await fs.mkdir(path.dirname(file),{recursive:true});
  for(let attempt=1;attempt<=10;attempt++){
    try{
      const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json',apikey:KEY,Authorization:`Bearer ${KEY}`},body:JSON.stringify({action:'SPEAK',role,text})});
      const d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||`HTTP ${r.status}`);
      const bytes=Buffer.from(d.audio_base64,'base64');if(bytes.length<1000)throw Error('audio too small');
      await fs.writeFile(file,bytes);return `made ${file}`;
    }catch(e){if(attempt===10)throw e;await new Promise(r=>setTimeout(r,Math.min(20000,attempt*2500)));}
  }
}
let cursor=0,done=0;
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++];console.log(await create(job));done++;if(done%12===0)console.log(`progress ${done}/${jobs.length}`)}}
await Promise.all(Array.from({length:2},worker));
console.log(`Audio complete: ${done} clips.`);
