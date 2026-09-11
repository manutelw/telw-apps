// Level C, all four sublevels: display each listening piece in the format it actually is.
// Single-speaker formats are continuous prose; multi-speaker formats keep speaker labels only when the speaker changes.
// Loaded last on every Level C unit page.
(function(){
'use strict';
const U=window.ORACY_UNIT;
const local=Number(U?.localUnitNo||Math.max(1,Number(U?.unitNo||31)-30));
if(!U||local<1||local>30)return;

const SINGLE=new Set(['monologue','presentation','announcement','story','voice note','advertisement','speech','feature']);
const MULTI=new Set(['conversation','interview','podcast','group discussion']);
const LABEL={
  'monologue':'Monologue','presentation':'Presentation','announcement':'Announcement','story':'Story',
  'voice note':'Voice note','advertisement':'Advertisement','speech':'Speech','feature':'Feature',
  'conversation':'Conversation','interview':'Interview','podcast':'Podcast','group discussion':'Group discussion'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const rx=v=>String(v||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function topicOnly(text){
  let t=clean(text);
  const names=Object.values(LABEL).sort((a,b)=>b.length-a.length);
  for(const name of names)t=t.replace(new RegExp(`^${rx(name)}\\s*[—:-]\\s*`,'i'),'').trim();
  return t;
}
function proseHtml(segs){
  const lines=segs.map(x=>clean(x?.[2])).filter(Boolean);
  if(!lines.length)return '';
  const cut=lines.length>=6?Math.ceil(lines.length/2):lines.length;
  const first=lines.slice(0,cut).join(' '),second=lines.slice(cut).join(' ');
  return `<p>${esc(first)}</p>${second?`<p>${esc(second)}</p>`:''}`;
}
function dialogueHtml(segs){
  let last='';
  return segs.map(([speaker,,text])=>{
    const s=clean(speaker),show=s&&s!==last;last=s||last;
    return `<p>${show?`<b>${esc(s)}:</b> `:''}${esc(clean(text))}</p>`;
  }).join('');
}
function inferGenre(k,segs){
  const explicit=clean(k?.genre).toLowerCase();
  if(SINGLE.has(explicit)||MULTI.has(explicit))return explicit;
  const speakers=[...new Set(segs.map(x=>clean(x?.[0])).filter(Boolean))];
  return speakers.length<=1?'monologue':'conversation';
}
function apply(){
  const sections=[...document.querySelectorAll('section.kp')];
  if(!sections.length)return false;
  sections.forEach((sec,i)=>{
    const k=U.keyPoints?.[i];if(!k)return;
    const id=`kp${i+1}`,segs=U.passages?.[id]||[];
    const box=sec.querySelector(`[data-passage="${id}"]`);if(!box)return;
    const genre=inferGenre(k,segs);
    const label=LABEL[genre]||clean(k.genre)||'Listening';
    const topic=topicOnly(k.listen);
    const heading=[...sec.querySelectorAll('h3')].find(h=>/^Listen:/i.test(clean(h.textContent)));
    if(heading)heading.textContent=`Listen: ${label}${topic?` — ${topic}`:''}`;
    box.innerHTML=SINGLE.has(genre)?proseHtml(segs):dialogueHtml(segs);
    box.dataset.listeningFormat=genre;
  });
  return true;
}

function enforce(){apply();requestAnimationFrame(apply);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforce,{once:true});else enforce();
[100,300,800,1600,3200,6000].forEach(ms=>setTimeout(apply,ms));
const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(apply,20)});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>observer.disconnect(),8000);
})();
