// Level C Units 2-30: show shared comprehension guidance once before the question set.
(function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.localUnitNo)<2)return;
function install(){
  const sections=[...document.querySelectorAll('section.kp')];
  if(!sections.length)return false;
  for(const section of sections){
    const activities=[...section.querySelectorAll(':scope > .activity')].slice(0,4);
    if(!activities.length)continue;
    const ruleBoxes=[];
    for(const a of activities){
      const box=[...a.children].find(el=>el.classList?.contains('model')&&/Rule before you answer/i.test(el.textContent||''));
      if(box)ruleBoxes.push(box);
    }
    if(!ruleBoxes.length)continue;
    const first=ruleBoxes[0];
    const ruleText=(first.textContent||'').replace(/^\s*Rule before you answer\s*/i,'').trim();
    ruleBoxes.forEach(x=>x.remove());
    if(!ruleText||section.querySelector('.c-question-standing-rule'))continue;
    const standing=document.createElement('div');
    standing.className='model c-question-standing-rule';
    standing.innerHTML=`<b>Rule before you answer</b><br>${ruleText}`;
    section.insertBefore(standing,activities[0]);
  }
  return true;
}
if(!install())new MutationObserver((_,o)=>{if(install())o.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
