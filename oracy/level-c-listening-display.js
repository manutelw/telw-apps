// Level C, all four sublevels: display each listening piece in the format it actually is.
// Single-speaker formats are continuous prose; multi-speaker formats keep speaker labels.
// This file must be loaded LAST so later lesson runtimes cannot restore line-by-line labels.
(function(){
'use strict';
const U=window.ORACY_UNIT;
const local=Number(U?.localUnitNo);
if(!U||local<1||local>30||!['C1A','C1B','C2A','C2B'].includes(String(U.level)))return;

const SINGLE=new Set(['monologue','presentation','announcement','story','voice note','advertisement','speech','feature']);
const LABEL={
  'monologue':'Monologue','presentation':'Presentation','announcement':'Announcement','story':'Story',
  'voice note':'Voice note','advertisement':'Advertisement','speech':'Speech','feature':'Feature',
  'conversation':'Conversation','interview':'Interview','podcast':'Podcast','group discussion':'Group discussion'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const rx=v=>String(v||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function topicOnly(text,genre){
  let t=clean(text);
  const names=Object.values(LABEL).sort((a,b)=>b.length-a.length);
  for(const name of names){t=t.replace(new RegExp(`^${rx(name)}\\s*[—:-]\\s*`,'i'),'').trim();}
  return t;
}
function proseHtml(segs){
  const lines=segs.map(x=>clean(x?.[2])).filter(Boolean);
  if(!lines.length)return '';
  const cut=lines.length>=6?Math.ceil(lines.length/2):lines.length;
  const p1=lines.slice(0,cut).join(' '),p2=lines.slice(cut).join(' ');
  return `<p>${esc(p1)}</p>${p2?`<p>${esc(p2)}</p>`:''}`;
}
function dialogueHtml(segs){
  let last='';
  return segs.map(([speaker,,text])=>{
    const s=clean(speaker),show=s&&s!==last;last=s||last;
    return `<p>${show?`<b>${esc(s)}:</b> `:''}${esc(clean(text))}</p>`;
  }).join('');
}
function apply(){
  const sections=[...document.querySelectorAll('section.kp')];
  if(!sections.length)return false;
  sections.forEach((sec,i)=>{
    const k=U.keyPoints?.[i];if(!k)return;
    const genre=clean(k.genre).toLowerCase();
    const id=`kp${i+1}`,segs=U.passages?.[id]||[];
    const box=sec.querySelector(`[data-passage="${id}"]`);if(!box)return;
    const label=LABEL[genre]||clean(k.genre)||'Listening';
    const topic=topicOnly(k.listen,genre);
    const heading=box.previousElementSibling;
    if(heading?.tagName==='H3')heading.textContent=`Listen: ${label}${topic?` — ${topic}`:''}`;
    box.innerHTML=SINGLE.has(genre)?proseHtml(segs):dialogueHtml(segs);
    box.dataset.listeningFormat=genre;
  });
  return true;
}

let applying=false;
function safeApply(){if(applying)return;applying=true;try{apply();}finally{applying=false;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safeApply,{once:true});else safeApply();
// Some Level C speaking/listening scripts modify the lesson after initial render. Keep the display contract in force.
const observer=new MutationObserver(()=>safeApply());
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{safeApply();observer.disconnect();},2500);
})();
