import {REVIEW_SECONDS,PART_CHECK_SECONDS,CHECK_CUE_SECONDS,END_CUE_SECONDS} from './format.mjs';
// Remaining work follows actual audio position. Network interruptions cannot
// consume a later recording or the final answer-checking window.
export function remainingGroupSeconds(groups,state,currentTime,now,cueTime=0,cueStage='none'){
 const review=state.standardFormat?REVIEW_SECONDS:5,endCue=state.standardFormat?END_CUE_SECONDS:3;
 if(state.phase==='closing')return review+Math.max(0,endCue-cueTime);
 if(state.phase==='review')return Math.max(0,state.reviewUntil-now);
 let total=review+endCue;
 if(state.phase==='checkCue')total+=PART_CHECK_SECONDS+Math.max(0,CHECK_CUE_SECONDS-(cueStage==='check'?cueTime:0));
 if(state.phase==='checking')total+=Math.max(0,state.readyAt-now);
 for(let i=state.groupIndex;i<groups.length;i++){
  const g=groups[i];
  if(state.standardFormat&&i<groups.length-1&&g.part!==groups[i+1].part)total+=PART_CHECK_SECONDS+CHECK_CUE_SECONDS;
  if(i>state.groupIndex){total+=g.duration+g.readingSeconds+g.readCueSeconds+g.listenCueSeconds;continue;}
  if(state.phase==='listening'){total+=Math.max(0,g.duration-Math.max(state.positions[i]||0,currentTime||0));continue;}
  total+=g.duration;
  if(state.phase==='reading')total+=Math.max(0,state.readyAt-now)+Math.max(0,g.listenCueSeconds-(cueStage==='listen'?cueTime:0));
  else total+=g.readingSeconds+Math.max(0,g.readCueSeconds-(cueStage==='read'?cueTime:0))+g.listenCueSeconds;
 }
 return total;
}
