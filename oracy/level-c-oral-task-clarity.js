// Level C Units 2-30: make oral questions explain the learning purpose and the exact speaking task.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function learningFromExample(example){
 const e=clean(example);
 if(!e)return 'Use the sentence shape from this Key Point to express the idea clearly.';
 return `Learn to reuse this sentence shape naturally in a new situation: “${e}”`;
}
function makeOral(id,kpIndex,sentences){
 const ctx=S.contexts[kpIndex];
 const kp=U.keyPoints?.[kpIndex]||{};
 const model=clean(kp.model||'');
 const vocab=(S.vocab?.[kpIndex]||[]).slice(0,3);
 const starter=model.split(/(?<=[.!?])\s+/)[0]||model;
 const learning=learningFromExample(starter);
 const why='The aim is to make this way of saying the idea automatic in speech. You do not need to name the grammar rule.';
 const vocabLine=vocab.length?` If it fits naturally, include one of these words or phrases: ${vocab.join(', ')}.`:'';
 U.oral[id]={
   question:`Situation: ${ctx}. Say ${sentences} clear sentences. First, express one idea using the same sentence shape as the model above. Then add one specific detail, reason or example.${vocabLine}`,
   expected:`A direct response about ${ctx}, using the model sentence shape once and then adding a relevant detail.`,
   key:`What you are learning: ${learning} Why practise it: ${why}`
 };
}
makeOral('q5',0,'1–2');
makeOral('q10',1,'2–3');
})();
