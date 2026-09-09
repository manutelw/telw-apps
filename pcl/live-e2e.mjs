import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {moduleContent} from './units.mjs';
const API='https://kjxywlvgsweagrdydbef.supabase.co/functions/v1/pcl-pilot-1';
const KEY='sb_publishable_hVL6AQ1GUGzizmiIZBWDlA_UTj5us9q';
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
async function json(body){const r=await fetch(API,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(body)}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||`HTTP ${r.status}`);return d}
async function form(body){body.set('module',body.get('module'));const r=await fetch(API,{method:'POST',headers,body}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||`HTTP ${r.status}`);return d}
function validFeedback(d){return d?.feedback?.grammar?.score&&d?.feedback?.voice?.score&&d?.feedback?.thinking?.score&&d?.feedback?.priority}
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'pcl-e2e-'));
async function run(unit){
 const id=`${unit}.1`,s=moduleContent(id),wav=path.join(tmp,`${unit}.wav`);
 const ff=spawnSync('ffmpeg',['-loglevel','error','-y','-i',s.modelAudio[1],'-ac','1','-ar','16000',wav]);if(ff.status)throw Error(`Unit ${unit}: ffmpeg failed`);
 const bytes=await fs.readFile(wav),audio=()=>new Blob([bytes],{type:'audio/wav'}),ctx={function:'operations',role:'manager',industry:'services'};
 const comp=await json({action:'CHECK_COMPREHENSION',module:id,answers:[s.employee,s.employee,s.employee]});if(comp.items?.length!==3)throw Error(`Unit ${unit}: comprehension`);
 const start=await json({action:'START_DIALOGUE',module:id,context:ctx});if(!start.question)throw Error(`Unit ${unit}: start dialogue`);
 let history=[{role:'manager',text:start.question}],clips=[];
 for(let turn=1;turn<=3;turn++){let d;for(let attempt=1;attempt<=3;attempt++){const f=new FormData();f.set('action','DIALOGUE_NEXT');f.set('module',id);f.set('turn',String(turn));f.set('context',JSON.stringify(ctx));f.set('history',JSON.stringify(history));f.set('duration_ms','45000');f.set('audio',audio(),'turn.wav');d=await form(f);if(turn===3||d.next_question)break}clips.push(audio());history.push({role:'learner',text:d.transcript});if(turn<3){if(!d.next_question)throw Error(`Unit ${unit}: dialogue turn ${turn}`);history.push({role:'manager',text:d.next_question})}}
 const df=new FormData();df.set('action','EVALUATE_DIALOGUE');df.set('module',id);df.set('context',JSON.stringify(ctx));df.set('history',JSON.stringify(history));clips.forEach((b,i)=>{df.set(`audio_${i+1}`,b,`turn-${i+1}.wav`);df.set(`duration_${i+1}_ms`,'45000')});const de=await form(df);if(!validFeedback(de))throw Error(`Unit ${unit}: dialogue evaluation`);
 for(const task of ['mono','opinion']){const f=new FormData();f.set('action','EVALUATE_SPEAKING');f.set('module',id);f.set('task',task);f.set('duration_ms','60000');f.set('context',JSON.stringify(ctx));f.set('audio',audio(),'response.wav');if(task==='opinion')f.set('prompt','How should a manager apply this skill responsibly?');const d=await form(f);if(!validFeedback(d))throw Error(`Unit ${unit}: ${task} evaluation`)}
 console.log(`PASS live Unit ${unit}: comprehension, monologue, 3-turn dialogue, opinion, voice and Priority.`);
}
const requested=process.argv.slice(2).map(Number).filter(n=>n>=2&&n<=14),queue=requested.length?requested:Array.from({length:13},(_,i)=>i+2);
let next=0;async function worker(){while(next<queue.length){const unit=queue[next++];await run(unit)}}try{await Promise.all([worker(),worker()])}finally{await fs.rm(tmp,{recursive:true,force:true})}
console.log(`PASS: representative full learner flow for Units ${queue.join(', ')}.`);
