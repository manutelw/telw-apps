// ORACY Level C map. Level labels are internal course sequencing labels; speaking evaluation remains CEFR B-range.
window.ORACY_LEVEL_C=Object.freeze({
  order:['C1A','C1B','C2A','C2B'],
  unitRanges:Object.freeze([
    Object.freeze({level:'C1A',from:31,to:37,localFrom:1,localTo:7}),
    Object.freeze({level:'C1B',from:38,to:45,localFrom:8,localTo:15}),
    Object.freeze({level:'C2A',from:46,to:52,localFrom:16,localTo:22}),
    Object.freeze({level:'C2B',from:53,to:60,localFrom:23,localTo:30})
  ])
});
window.oracyLevelCForUnit=function(unitNo){const n=Number(unitNo||0),hit=window.ORACY_LEVEL_C.unitRanges.find(r=>n>=r.from&&n<=r.to);return hit?hit.level:''};
(function(){
 const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<31||Number(U.unitNo)>60)return;
 const level=String(U.level||window.oracyLevelCForUnit(U.unitNo)),local=Number(U.localUnitNo||U.unitNo-30);
 const S=window.ORACY_C_SPECS?.[local];
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const topic=clean(S?.theme||U.title||'the topic');
 const firstModel=clean(U.keyPoints?.[0]?.model||'');
 const structure=firstModel.split(/(?<=[.!?])\s+/)[0]||'the sentence pattern from this unit';
 const vocab=(U.keyPoints?.[0]?.chips||[]).map(clean).filter(Boolean).slice(0,4);
 const vocabText=vocab.length?vocab.join(', '):'the vocabulary from this unit';
 window.ORACY_CURRENT_TELW_LEVEL=level;
 window.oracyWarmLevelText=function(){return `This is TELW Level ${level}. Keep the meaning clear first, then make the language fuller, smoother and more natural with the expressions from this unit.`};
 window.oracyTeacherVoiceText=function(rubric,rule,passed,used){
   const task=typeof oracyScore==='function'?oracyScore(rubric?.task_achievement):0;
   const taskText=task>=3?'You covered the task well. ':task===2?'You answered the task; now add one useful detail or example. ':'Make sure you answer each part of the task. ';
   const labelFor=m=>typeof ORACY_MARKER_LABELS!=='undefined'?(ORACY_MARKER_LABELS[m]||m):m;
   const usedText=used?.length?`I heard ${used.map(labelFor).join(' and ')} used naturally. `:'';
   const markerText=passed?'Good — the speaking language fitted the response. ':`On the next recording, add ${rule?.min===1?'one':'two'} of the suggested speaking expressions naturally. `;
   return `You are working in ${level}, Unit ${local}. ${taskText}${usedText}${markerText}The evaluation standard is CEFR B-range: clear meaning, workable control of the target structure, suitable vocabulary, understandable pronunciation and a coherent response. Now, tell me about ${topic} in your own words. Use this sentence pattern: ${structure} Use vocabulary such as ${vocabText}.`;
 };
})();
