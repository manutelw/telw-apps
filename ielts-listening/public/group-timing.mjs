// Remaining assessment work, rather than an overall wall-clock deadline.
export function remainingGroupSeconds(groups,state,currentTime,now,cueTime=0,cueStage='none'){
 if(state.phase==='review')return Math.max(0,state.reviewUntil-now);
 let total=120;
 for(let i=state.groupIndex;i<groups.length;i++){
  const g=groups[i];
  if(i>state.groupIndex){total+=g.duration+g.readingSeconds+g.readCueSeconds+g.listenCueSeconds;continue;}
  if(state.phase==='listening'){total+=Math.max(0,g.duration-Math.max(state.positions[i]||0,currentTime||0));continue;}
  total+=g.duration;
  if(state.phase==='readCue')total+=g.readingSeconds+Math.max(0,g.readCueSeconds-(cueStage==='read'?cueTime:0))+g.listenCueSeconds;
  else total+=Math.max(0,state.readyAt-now)+Math.max(0,g.listenCueSeconds-(cueStage==='listen'?cueTime:0));
 }
 return total;
}
