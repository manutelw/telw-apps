// Level C only: warm static TTS responses before learners reach the audio buttons.
(function(){
'use strict';
const U=window.ORACY_UNIT,EDGE='/oracy/session';
if(!U||Number(U.unitNo)<31)return;
const originalFetch=window.fetch.bind(window);
const warm=new Map();
const PASSAGE_STYLE='Sound natural, lively and warm. Use clear learner-friendly pacing, expressive sentence stress and natural pitch. In dialogue, react to the other person. Do not sound formal, flat, slow or robotic.';
const PRON_STYLE='Speak clearly and naturally for an English listening and pronunciation exercise. Give only the requested word or sentence. Make the target contrast audible without unnatural over-enunciation.';
function canonical(body){
  try{
    const d=typeof body==='string'?JSON.parse(body):body;
    if(!d||d.action!=='tts'||Number(d.unit_no)<31)return '';
    return JSON.stringify([d.text||'',d.voice||'',d.instructions||'',Number(d.unit_no),d.passage_id||'']);
  }catch{return ''}
}
function responseFrom(x){return new Response(x.bytes.slice(0),{status:x.status,statusText:x.statusText,headers:x.headers})}
async function warmOne(payload){
  const key=canonical(payload);if(!key||warm.has(key))return warm.get(key);
  const job=(async()=>{
    const r=await originalFetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('Static audio preload failed.');
    return {bytes:await r.arrayBuffer(),status:r.status,statusText:r.statusText,headers:new Headers(r.headers)};
  })();
  warm.set(key,job);try{return await job}catch(e){warm.delete(key);throw e}
}
window.fetch=function(input,init){
  try{
    const method=String(init?.method||'GET').toUpperCase();
    const url=typeof input==='string'?input:String(input?.url||'');
    if(method==='POST'&&url.includes('/oracy/session')){
      const key=canonical(init?.body);
      if(key&&warm.has(key))return warm.get(key).then(responseFrom,()=>originalFetch(input,init));
    }
  }catch{}
  return originalFetch(input,init);
};
function start(){
  const jobs=[];
  for(const box of document.querySelectorAll('[data-passage]')){
    const id=box.dataset.passage,segs=U.passages?.[id]||[];
    segs.forEach((seg,i)=>{
      const voice=seg?.[1]||'marin',text=String(seg?.[2]||'');
      if(!text)return;
      jobs.push({action:'tts',text,voice,instructions:PASSAGE_STYLE,unit_no:U.unitNo,passage_id:`${U.level.toLowerCase()}-u${U.unitNo}-${id}-${i}-${voice}-v1`});
    });
  }
  for(const [id,text] of Object.entries(U.pron||{})){
    if(!String(text||'').trim())continue;
    jobs.push({action:'tts',text,voice:'marin',instructions:PRON_STYLE,unit_no:U.unitNo,passage_id:`${U.level}-u${U.unitNo}-${id}-pron`});
  }
  let i=0,active=0;
  const limit=6;
  function pump(){
    while(active<limit&&i<jobs.length){
      active++;warmOne(jobs[i++]).catch(()=>{}).finally(()=>{active--;pump()});
    }
  }
  pump();
}
start();
})();