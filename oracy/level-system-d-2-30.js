(function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<62||Number(U.unitNo)>90)return;
const local=Number(U.localUnitNo),level=String(U.level);
window.ORACY_CURRENT_TELW_LEVEL=level;
window.oracyWarmLevelText=function(){return `This is TELW Level ${level}. Make the reasoning precise, then use the unit language naturally and flexibly.`};
window.oracyTeacherVoiceText=function(rubric,rule,passed,used){const task=typeof oracyScore==='function'?oracyScore(rubric?.task_achievement):0,taskText=task>=3?'You completed the speaking task and developed the reasoning. ':task===2?'You answered the task; now make the evidence or judgement more explicit. ':'Cover each required part of the speaking task. ',usedText=used?.length?`You used ${used.join(' and ')} naturally. `:'',targetText=passed?'The target language supported the meaning. ':`On the improved attempt, add ${rule?.min===1?'one':'two'} suitable expressions from the unit. `;return `You are working in ${level}, Unit ${local}. ${taskText}${usedText}${targetText}Keep the response coherent, measured and easy to follow. Now record an improved attempt.`};
})();
