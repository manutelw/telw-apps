// Level C Units 2-30: keep every rule short, literal and learner-facing.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const fallback='Say the sentence in the way shown above, then change the details to fit the situation.';
const unit6Rule='If the situation can really happen: If + present …, will/can …. Example: If it rains, we will stay home. If you are imagining a different or unlikely situation: If + past/were …, would/could …. Example: If I had more time, I would cycle every weekend.';
const rules=(U.keyPoints||[]).map((kp,i)=>{
  if(Number(U.localUnitNo)===6&&i===0)return unit6Rule;
  const r=clean(kp?._plainRule);
  return r||fallback;
});
U.notes=U.notes||{};
for(let i=0;i<3;i++){
  const rule=rules[i]||fallback;
  for(const q of (U.checks||[]).slice(i*4,i*4+4))U.notes[q.id]=rule;
}
if(U.oral?.q5)U.oral.q5.key=rules[0]||fallback;
if(U.oral?.q10)U.oral.q10.key=rules[1]||fallback;
})();
