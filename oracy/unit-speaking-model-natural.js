// ORACY Units 2-30: natural human model conversations for vocabulary drills.
// Runs after unit-speaking-gym-v2.js. It does not alter frozen unit content.
(function(){
'use strict';
const U=window.ORACY_UNIT, EDGE='/oracy/session';
if(!U||Number(U.unitNo)<2||Number(U.unitNo)>30)return;
const UNIT=Number(U.unitNo),LEVEL=String(U.level||'');
const cache=new Map();let ctx=null,sources=[];
function norm(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim()}
function splitSentences(text){return String(text||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[]}
function passage(kp){return U.passages?.[`kp${kp+1}`]||[]}
function dialogueWindow(kp,item){
 const segs=passage(kp),target=norm(item),hit=segs.findIndex(x=>norm(x?.[2]).includes(target));
 if(hit<0)return null;
 const named=segs.filter(x=>String(x?.[0]||'').trim()).length>=Math.min(2,segs.length);
 if(named&&segs.length>=2){
   const start=Math.max(0,Math.min(hit-1,segs.length-4));
   const chunk=segs.slice(start,start+4);
   if(chunk.length>=2){
     const names=[];chunk.forEach(x=>{const n=String(x?.[0]||'').trim();if(n&&!names.includes(n))names.push(n)});
     const map=new Map();if(names[0])map.set(names[0],'A');if(names[1])map.set(names[1],'B');
     return chunk.map((x,i)=>`${map.get(String(x?.[0]||'').trim())||(i%2?'B':'A')}: ${String(x?.[2]||'').trim()}`);
   }
 }
 const all=segs.flatMap(x=>splitSentences(x?.[2]||''));
 const si=all.findIndex(x=>norm(x).includes(target));
 if(si>=0){
   const first=all[si],next=all[si+1]||all[Math.max(0,si-1)]||'';
   return [`A: So, what’s happening here?`,`B: ${first}`,`A: Right. And what happens next?`,`B: ${next||'That is the main point.'}`];
 }
 return null;
}
function noteExample(item){const n=norm(item);for(const value of Object.values(U.notes||{})){const t=String(value||'');if(!norm(t).includes(n))continue;const m=t.match(/Try:\s*[“"]([^”"]+)/i);if(m)return m[1].trim()}return ''}
function fallbackModel(item){const ex=noteExample(item)||`I’d use “${item}” in this situation.`;return [`A: How would you say that naturally?`,`B: ${ex}`,`A: Right. That sounds clear.`,`B: Exactly. That’s how I’d say it too.`]}
function linesFor(kp,item){return dialogueWindow(kp,item)||fallbackModel(item)}
function speaker(line){const a=/^A:/.test(line);return {voice:a?'marin':'cedar',text:String(line||'').replace(/^[AB]:\s*/,'')}}
function key(kp,vi,si,item){return `oracy-${LEVEL.toLowerCase()}-u${UNIT}-natural-model-${kp}-${vi}-${si}-${norm(item).replace(/\s+/g,'-')}-v2`}
async function blobFor(kp,vi,si,item,line){const k=key(kp,vi,si,item);if(cache.has(k))return cache.get(k);const s=speaker(line),p=(async()=>{const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:s.text,voice:s.voice,instructions:'Sound like two real adults having a natural, friendly conversation. Use normal reactions, natural sentence stress and B1/B2-friendly pace. Never sound like a language drill or textbook recital.',unit_no:UNIT,passage_id:k})});if(!r.ok)throw new Error(`Model audio could not be prepared (HTTP ${r.status}).`);return r.blob()})();cache.set(k,p);try{return await p}catch(e){cache.delete(k);throw e}}
async function prepare(kp,vi,item,lines){return Promise.all(lines.map((x,i)=>blobFor(kp,vi,i,item,x)))}
function audioContext(){if(ctx)return ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Audio is not supported in this browser.');ctx=new C();return ctx}
function stop(){sources.forEach(s=>{try{s.stop()}catch{}});sources=[]}
async function play(kp,vi,item,lines,btn,status){try{const c=audioContext();await c.resume();stop();btn.disabled=true;status.textContent='Preparing model conversation…';const blobs=await prepare(kp,vi,item,lines),buffers=await Promise.all(blobs.map(b=>b.arrayBuffer().then(a=>c.decodeAudioData(a))));let when=c.currentTime+.05;buffers.forEach((b,i)=>{const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(when);sources.push(s);when+=b.duration+(i<buffers.length-1?.14:0)});status.textContent='Playing model conversation.';setTimeout(()=>{if(status.textContent==='Playing model conversation.')status.textContent='Ready to replay.'},Math.max(300,(when-c.currentTime)*1000))}catch(e){status.textContent=e.message||'Model audio could not be played.'}finally{btn.disabled=false}}
function upgrade(box){if(box.dataset.naturalModel==='1')return;const kp=Number(box.dataset.kp||0),vi=Number(box.dataset.vi||0),item=box.querySelector('h3')?.textContent?.trim();if(!item)return;const model=box.querySelector('.oracy-v2-model'),oldBtn=model?.querySelector('.v2-listen'),status=model?.querySelector('.v2-audio-status');if(!model||!oldBtn||!status)return;const lines=linesFor(kp,item);[...model.children].filter(x=>x.tagName==='DIV'&&!x.classList.contains('oracy-v2-audio')).forEach(x=>x.remove());const audioWrap=model.querySelector('.oracy-v2-audio');lines.forEach(line=>{const d=document.createElement('div');d.textContent=line;model.insertBefore(d,audioWrap)});const btn=oldBtn.cloneNode(true);oldBtn.replaceWith(btn);btn.addEventListener('click',()=>play(kp,vi,item,lines,btn,status));box.dataset.naturalModel='1';box._oracyNaturalLines=lines}
function install(){const boxes=[...document.querySelectorAll('.oracy-v2-vocab-drill')];if(!boxes.length)return false;boxes.forEach(upgrade);const warm=box=>{const kp=Number(box.dataset.kp||0),vi=Number(box.dataset.vi||0),item=box.querySelector('h3')?.textContent?.trim(),lines=box._oracyNaturalLines;if(item&&lines)prepare(kp,vi,item,lines).catch(()=>{})};if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){warm(e.target);io.unobserve(e.target)}}),{rootMargin:'700px 0px'});boxes.forEach(b=>io.observe(b))}else boxes.slice(0,3).forEach(warm);return true}
if(!install()){const mo=new MutationObserver(()=>{if(install())mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true});setTimeout(install,0);setTimeout(install,500)}
})();
