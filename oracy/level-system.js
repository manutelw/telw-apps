// ORACY TELW level system. Keep this as the single level map for all units.
window.ORACY_TELW_LEVELS=Object.freeze({
  order:['B1A','B1B','B2A','B2B','C1A','C1B','C2A','C2B'],
  unitRanges:Object.freeze([
    Object.freeze({level:'B1A',from:1,to:7}),
    Object.freeze({level:'B1B',from:8,to:15}),
    Object.freeze({level:'B2A',from:16,to:22}),
    Object.freeze({level:'B2B',from:23,to:30})
  ])
});
window.oracyTelwLevelForUnit=function(unitNo){
  const n=Number(unitNo||0);
  const hit=window.ORACY_TELW_LEVELS.unitRanges.find(r=>n>=r.from&&n<=r.to);
  return hit?hit.level:'';
};
(function(){
  const match=location.pathname.match(/\/oracy\/unit-(\d+)/i);
  const unitNo=match?Number(match[1]):0;
  const level=window.oracyTelwLevelForUnit(unitNo);
  if(!level)return;
  window.ORACY_CURRENT_TELW_LEVEL=level;
  const header=document.querySelector('header small');
  if(header)header.textContent=`by TELW · LEVEL ${level}`;
  const eyebrow=document.querySelector('.hero .eyebrow');
  if(eyebrow)eyebrow.textContent=`LEVEL ${level} · UNIT ${unitNo}`;
  document.title=`ORACY · ${level} Unit ${unitNo}`;

  window.oracyWarmLevelText=function(){
    return `This is TELW Level ${level}. You are getting your message across. Now let’s make it a little fuller, smoother and more natural with the language from this unit.`;
  };
  window.oracyTeacherVoiceText=function(rubric,rule,passed,used){
    const task=typeof oracyScore==='function'?oracyScore(rubric?.task_achievement):0;
    const taskText=task>=3?'You covered the task well. ':task===2?'You answered the question; now add one small example or detail. ':'Make sure you answer each part of the question. ';
    const labelFor=m=>typeof ORACY_MARKER_LABELS!=='undefined'?(ORACY_MARKER_LABELS[m]||m):m;
    const usedText=used?.length?`I liked hearing ${used.map(labelFor).join(' and ')} in your answer. `:'';
    const markerText=passed?'Lovely — you used the new speaking language naturally. ':`You’re close. On your next recording, use ${rule?.min===1?'one':'two'} of the suggested speaking expressions naturally. `;
    return `Nice try. You’re working on TELW Level ${level}. ${taskText}${usedText}${markerText}Keep your sentences short, clear and natural. You do not need fancy English. One clear idea, one useful detail, then the next idea. Give it another go — I’d love to hear the stronger version.`;
  };
})();
