// Level C Units 2-30: make oral questions state the situation and exact speaking task plainly.
// Context cleanup here is deliberately task-only: it must never mutate source specs or passage audio.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const TASK_CONTEXT={
 'learning classical guitar in Chennai':'learning classical guitar',
 'rearranging a flat in Noida':'rearranging a flat',
 'repairing spectacles in Hyderabad':'repairing spectacles'
};
function taskContext(raw){
 const c=clean(raw);
 return TASK_CONTEXT[c]||c;
}
function makeOral(id,kpIndex,sentences){
 const ctx=taskContext(S.contexts[kpIndex]);
 const kp=U.keyPoints?.[kpIndex]||{};
 const model=clean(kp.model||'');
 const vocab=(S.vocab?.[kpIndex]||[]).slice(0,3);
 const starter=model.split(/(?<=[.!?])\s+/)[0]||model;
 const vocabLine=vocab.length?` If it fits naturally, include one of these words or phrases: ${vocab.join(', ')}.`:'';
 U.oral[id]={
   question:`Situation: ${ctx}. Say ${sentences} clear sentences. Use the sentence pattern shown above once. Then add one specific detail, reason or example.${vocabLine}`,
   expected:`A direct response about ${ctx}, using the model sentence pattern once and then adding a relevant detail.`,
   key:starter?`Use this pattern: ${starter}`:'Use the sentence pattern shown above.'
 };
}
makeOral('q5',0,'1–2');
makeOral('q10',1,'2–3');
})();
