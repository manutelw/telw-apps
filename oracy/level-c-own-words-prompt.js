// Level C Units 2-30 only: replace vague retry encouragement with a concrete transfer prompt.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const base=window.oracyTeacherVoiceText;
if(typeof base!=='function')return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const topic=clean(S.theme||U.title||'the topic');
const structure=clean(U.keyPoints?.[0]?.model||'the sentence pattern from this unit').split(/(?<=[.!?])\s+/)[0];
const vocab=(U.keyPoints?.[0]?.chips||[]).map(clean).filter(Boolean).slice(0,4);
const vocabText=vocab.length?vocab.join(', '):'the vocabulary from this unit';
window.oracyTeacherVoiceText=function(rubric,rule,passed,used){
 const prior=String(base(rubric,rule,passed,used)||'').replace(/\s*Give it another go\.?\s*$/i,'').trim();
 return `${prior} Now, tell me about ${topic} in your own words. Use this sentence pattern: ${structure} Use vocabulary such as ${vocabText}.`;
};
})();
