// Level C Units 2-30: show the GD skills debrief and a short guided practice after every GD listening.
(function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function install(){
 const sections=[...document.querySelectorAll('section.kp')];if(sections.length<3)return false;
 sections.forEach((sec,i)=>{
   const k=U.keyPoints?.[i];if(!k?.gdFocus||sec.querySelector('.gd-focus'))return;
   const box=document.createElement('div');box.className='model gd-focus';
   const p=k.gdPractice;
   box.innerHTML=`<b>What to notice in this group discussion</b><br>`+
    `<b>Entry:</b> ${esc(k.gdFocus.entry)}<br>`+
    `<b>Agreement:</b> ${esc(k.gdFocus.agreement)}<br>`+
    `<b>Build:</b> ${esc(k.gdFocus.build)}<br>`+
    `<b>Disagreement:</b> ${esc(k.gdFocus.disagreement)}<br>`+
    `<b>Bring it back:</b> ${esc(k.gdFocus.return)}<br>`+
    `<b>Unit language:</b> ${esc(k.gdFocus.structure)}`+
    (p?`<hr style="border:0;border-top:1px solid #ead8ad;margin:12px 0"><b>Now practise the GD move</b><br>`+
      `<b>Topic:</b> ${esc(p.topic)}<br>`+
      `<b>Previous speaker:</b> “${esc(p.opening)}”<br>`+
      `<b>Your job:</b> ${esc(p.help)}<br>`+
      `<b>Model shape:</b> ${esc(p.model)}<br>`+
      `<span style="display:block;margin-top:6px">You will record this again in the <b>GD practice: respond and build</b> speaking rep below.</span>`:'');
   const note=sec.querySelector('.audio-note');
   if(note)note.insertAdjacentElement('afterend',box);else sec.querySelector('.audio')?.insertAdjacentElement('afterend',box);
 });
 return true;
}
if(!install())new MutationObserver((_,o)=>{if(install())o.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
