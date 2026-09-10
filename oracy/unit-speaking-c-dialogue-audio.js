// Level C vocabulary model conversations: true alternating two-voice playback.
(function(){
'use strict';
const EDGE='/oracy/session',VOICE_A='marin',VOICE_B='cedar';
const cache=new Map();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanLine(s){return String(s||'').replace(/^\s*[AB]\s*:\s*/i,'').trim()}
function speakerOf(s,i){const m=String(s||'').match(/^\s*([AB])\s*:/i);return m?m[1].toUpperCase():(i%2===0?'A':'B')}
async function getAudio(text,voice,key){const ck=key+'|'+voice+'|'+text;if(cache.has(ck))return cache.get(ck);const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',unit_no:31,text,voice})});if(!r.ok)throw new Error('Model audio is unavailable.');const blob=await r.blob(),url=URL.createObjectURL(blob);cache.set(ck,url);return url}
function playUrl(url){return new Promise((resolve,reject)=>{const a=new Audio(url);a.onended=resolve;a.onerror=()=>reject(new Error('Model audio could not be played.'));a.play().catch(reject)})}
async function playConversation(btn){const drill=btn.closest('.c-vocab-drill');if(!drill)return;const status=drill.querySelector('.c-audio-status');const rows=[...drill.querySelectorAll('.model > div')].map(x=>x.textContent.trim()).filter(Boolean);if(!rows.length)return;btn.disabled=true;if(status)status.textContent='Preparing conversation…';try{for(let i=0;i<rows.length;i++){const who=speakerOf(rows[i],i),text=cleanLine(rows[i]);if(!text)continue;if(status)status.textContent=who==='A'?'Speaker A':'Speaker B';const url=await getAudio(text,who==='A'?VOICE_A:VOICE_B,(drill.dataset.kp||'')+'-'+(drill.dataset.vi||'')+'-'+i);await playUrl(url);await sleep(120)}if(status)status.textContent=''}catch(e){if(status)status.textContent=e.message||'Model audio is unavailable.'}finally{btn.disabled=false}}
document.addEventListener('click',e=>{const btn=e.target.closest('.c-listen');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();playConversation(btn)},true);
})();
