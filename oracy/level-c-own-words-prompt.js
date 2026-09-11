// Level C Units 1-30: replace vague retry encouragement with a concrete transfer prompt.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)<1||Number(U.localUnitNo)>30)return;
const S=window.ORACY_C_SPECS?.[U.localUnitNo]||null;
const base=window.oracyTeacherVoiceText;
if(typeof base!=='function')return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const topic=clean(S?.theme||U.title||U.keyPoints?.[0]?.listen||'the topic');
const structure=clean(U.keyPoints?.[0]?.model||U.oral?.q5?.key||'the sentence pattern from this unit').split(/(?<=[.!?])\s+/)[0];
const vocabSource=(S?.vocab?.[0]||U.keyPoints?.[0]?.chips||U.targets||[]);
const vocab=vocabSource.map(clean).filter(Boolean).slice(0,4);
const vocabText=vocab.length?vocab.join(', '):'the vocabulary from this unit';
window.oracyTeacherVoiceText=function(rubric,rule,passed,used){
 const prior=String(base(rubric,rule,passed,used)||'')
   .replace(/\s*Give it another go(?:\s*[—-]\s*I[’']d love to hear[^.]*)?\.?\s*$/i,'')
   .replace(/\s*I[’']d love to hear[^.]*\.?\s*$/i,'')
   .trim();
 return `${prior} Now, tell me about ${topic} in your own words. Use this sentence pattern: ${structure} Use vocabulary such as ${vocabText}.`;
};
})();
