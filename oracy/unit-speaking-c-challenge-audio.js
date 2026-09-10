(function(){
'use strict';
const U=window.ORACY_UNIT,EDGE='/oracy/session';
if(!U||Number(U.unitNo)!==31)return;
const VOICE='marin';
const STYLE='Read the coach challenge exactly as written, in clear UK English. Sound natural, engaged and encouraging, as if you are responding directly to a learner in a real conversation. Use natural connected speech and sentence stress. Do not sound brisk, flat, tired, formal or robotic. Do not add, omit or paraphrase any words.';
let ctx=null,current=null;
const cache=new Map();
const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
function audioContext(){if(ctx)return ctx;const X=window.AudioContext||window.webkitAudioContext;if(!X)throw new Error('Audio is not supported.');ctx=new X();return ctx}
async function getAudio(text){const key='c1a-u1-rep4-'+hash(text)+'-'+hash(STYLE);if(cache.has(key))return cache.get(key);const job=(async()=>{const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',unit_no:31,text,voice:VOICE,instructions:STYLE,passage_id:key})});if(!r.ok)throw new Error('Coach audio is unavailable.');const a=await(await r.blob()).arrayBuffer();return audioContext().decodeAudioData(a)})();cache.set(key,job);try{return await job}catch(e){cache.delete(key);throw e}}
async function play(btn,text,status){btn.disabled=true;try{const c=audioContext();await c.resume();if(current){try{current.stop()}catch{}}const b=await getAudio(text);const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(c.currentTime+.02);current=s;s.onended=()=>{if(current===s)current=null};if(status)status.textContent=''}catch(e){if(status)status.textContent=e.message||'Coach audio is unavailable.'}finally{btn.disabled=false}}
function install(){const reps=[...document.querySelectorAll('.c-rep[data-rep="3"]')];if(reps.length<3)return false;const preload=[];reps.forEach(rep=>{const model=rep.querySelector('.model');const line=model?.querySelector('div');if(!model||!line)return;const text=line.textContent.trim();preload.push(getAudio(text));if(rep.querySelector('.c-hear-challenge'))return;const controls=document.createElement('div');controls.style.marginTop='8px';controls.innerHTML='<button type="button" class="c-hear-challenge">🔊 Hear coach challenge</button> <span class="c-challenge-status" aria-live="polite"></span>';
model.appendChild(controls);const btn=controls.querySelector('.c-hear-challenge'),status=controls.querySelector('.c-challenge-status');btn.addEventListener('click',()=>play(btn,text,status));});Promise.allSettled(preload).catch(()=>{});return true}
let n=0;const t=setInterval(()=>{n++;if(install()||n>40)clearInterval(t)},75);
})();