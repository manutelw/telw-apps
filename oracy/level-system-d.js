// ORACY Level D map. Global numbering continues after Levels B and C.
window.ORACY_LEVEL_D=Object.freeze({
  order:['D1A','D1B','D2A','D2B'],
  unitRanges:Object.freeze([
    Object.freeze({level:'D1A',from:61,to:67,localFrom:1,localTo:7}),
    Object.freeze({level:'D1B',from:68,to:75,localFrom:8,localTo:15}),
    Object.freeze({level:'D2A',from:76,to:82,localFrom:16,localTo:22}),
    Object.freeze({level:'D2B',from:83,to:90,localFrom:23,localTo:30})
  ])
});
window.oracyLevelDForUnit=function(unitNo){const n=Number(unitNo||0),hit=window.ORACY_LEVEL_D.unitRanges.find(r=>n>=r.from&&n<=r.to);return hit?hit.level:''};
(function(){
 const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<61||Number(U.unitNo)>90)return;
 const level=String(U.level||window.oracyLevelDForUnit(U.unitNo)),local=Number(U.localUnitNo||U.unitNo-60);
 window.ORACY_CURRENT_TELW_LEVEL=level;
 window.oracyWarmLevelText=function(){return `This is TELW Level ${level}. Shape the meaning precisely, then use the unit language naturally and flexibly.`};
 window.oracyTeacherVoiceText=function(rubric,rule,passed,used){
   const task=typeof oracyScore==='function'?oracyScore(rubric?.task_achievement):0;
   const taskText=task>=3?'You completed the speaking task and developed the account. ':task===2?'You answered the task; now make the turning point or result more explicit. ':'Cover each required part of the speaking task. ';
   const usedText=used?.length?`You used ${used.join(' and ')} naturally. `:'';
   const targetText=passed?'The target language supported the meaning. ':`On the improved attempt, add ${rule?.min===1?'one':'two'} suitable expressions from the unit. `;
   return `You are working in ${level}, Unit ${local}. ${taskText}${usedText}${targetText}Keep the story coherent, tactful and easy to follow. Now record an improved attempt.`;
 };
})();
