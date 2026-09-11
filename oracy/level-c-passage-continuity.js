// Level C Units 2-30: preload and schedule all dialogue lines so pauses remain natural throughout.
(function(){
'use strict';
const U=window.ORACY_UNIT,EDGE='/oracy/session';if(!U||Number(U.localUnitNo)<2)return;
const STYLE='Sound natural, lively and warm. Use clear learner-friendly pacing, expressive sentence stress and natural pitch. In dialogue, react to the other person. Do not sound formal, flat, slow or robotic.';
let ctx=null,current=[];
const C=window.AudioContext||window.webkitAudioContext;
function audioContext(){if(!ctx)ctx=new C();return ctx}
function stop(){for(const s of current){try{s.stop()}catch{}}current=[]}
async function getBuffer(text,voice,key){const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text,voice:voice||'marin',instructions:STYLE,unit_no:U.unitNo,passage_id:key})});if(!r.ok)throw new Error(`Audio could not be prepared (HTTP ${r.status}).`);const a=await(await r.blob()).arrayBuffer();return audioContext().decodeAudioData(a.slice(0))}
async function playAll(buffers,gap=.09){const c=audioContext();if(c.state!=='running')await c.resume();stop();let when=c.currentTime+.05;await new Promise(resolve=>{buffers.forEach((b,i)=>{const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(when);when+=b.duration+gap;current.push(s);if(i===buffers.length-1)s.onended=resolve})});current=[]}
function bind(){
  const buttons=[...document.querySelectorAll('section.kp .audio[data-id]')];if(!buttons.length)return false;
  for(const old of buttons){
    if(old.dataset.continuityBound==='1')continue;
    const b=old.cloneNode(true);b.dataset.continuityBound='1';old.replaceWith(b);
    b.addEventListener('click',async()=>{
      const id=b.dataset.id,segs=U.passages?.[id]||[],note=b.parentElement.querySelector('.audio-note'),label=b.textContent;
      try{
        b.disabled=true;b.textContent='Preparing conversation…';
        if(!segs.length)throw new Error('Audio is not available.');
        const buffers=await Promise.all(segs.map((seg,i)=>getBuffer(String(seg?.[2]||''),seg?.[1]||'marin',`${U.level.toLowerCase()}-u${U.unitNo}-${id}-${i}-${seg?.[1]||'marin'}-v1`)));
        b.textContent=segs.length>1?'Playing conversation…':'Playing passage…';
        await playAll(buffers,.09);if(note)note.textContent='Ready.';
      }catch(e){if(note)note.textContent=e.message||'Audio could not be played.'}
      finally{b.disabled=false;b.textContent=label}
    });
  }
  return true;
}
if(!C)return;
if(!bind())new MutationObserver((_,o)=>{if(bind())o.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
