// Level C Units 2-30: display each listening piece in the format it actually is.
// Single-speaker formats are continuous prose; multi-speaker formats keep speaker labels.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;

const SINGLE=new Set(['monologue','presentation','announcement','story','voice note','advertisement','speech','feature']);
const LABEL={
  'monologue':'Monologue',
  'presentation':'Presentation',
  'announcement':'Announcement',
  'story':'Story',
  'voice note':'Voice note',
  'advertisement':'Advertisement',
  'speech':'Speech',
  'feature':'Feature',
  'conversation':'Conversation',
  'interview':'Interview',
  'podcast':'Podcast',
  'group discussion':'Group discussion'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();

function topicWithoutGenre(text,genre){
  const t=clean(text),label=LABEL[genre]||genre;
  const re=new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*[—:-]\\s*`,'i');
  return t.replace(re,'').trim();
}

function proseHtml(segs){
  const lines=segs.map(x=>clean(x?.[2])).filter(Boolean);
  if(!lines.length)return '';
  if(lines.length<5)return `<p>${esc(lines.join(' '))}</p>`;
  const cut=Math.ceil(lines.length/2);
  return `<p>${esc(lines.slice(0,cut).join(' '))}</p><p>${esc(lines.slice(cut).join(' '))}</p>`;
}

function dialogueHtml(segs){
  return segs.map(([speaker,,text])=>`<p><b>${esc(clean(speaker))}:</b> ${esc(clean(text))}</p>`).join('');
}

function apply(){
  const sections=[...document.querySelectorAll('section.kp')];
  if(sections.length<3)return false;
  sections.forEach((sec,i)=>{
    const k=U.keyPoints?.[i];
    if(!k)return;
    const genre=clean(k.genre).toLowerCase();
    const id=`kp${i+1}`,segs=U.passages?.[id]||[];
    const box=sec.querySelector(`[data-passage="${id}"]`);
    if(!box)return;

    const label=LABEL[genre]||clean(k.genre)||'Listening';
    const topic=topicWithoutGenre(k.listen,label.toLowerCase());
    const heading=box.previousElementSibling;
    if(heading?.tagName==='H3')heading.textContent=`Listen: ${label}${topic?` — ${topic}`:''}`;

    box.innerHTML=SINGLE.has(genre)?proseHtml(segs):dialogueHtml(segs);
    box.dataset.listeningFormat=genre;
  });
  return true;
}

if(!apply())new MutationObserver((_,observer)=>{if(apply())observer.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
