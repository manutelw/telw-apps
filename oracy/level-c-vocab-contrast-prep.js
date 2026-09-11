// Adds a contrast-based meaning question to every Level C vocabulary item in Units 2-30.
// Where a unit already has a richer context-first explanation (for example Unit 6), keep it and add the contrast layer.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo],G=window.ORACY_C_GLOSS?.[U?.localUnitNo];
if(!U||!S||!G||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const extra=window.ORACY_C_EXTRA_GLOSS||{},special=window.ORACY_C_SPECIAL_COMPARE||{};
const norm=x=>String(x||'').toLowerCase().replace(/[’']/g,"'").trim();
function glossFor(term){
 const n=norm(term);
 for(let kp=0;kp<(S.vocab||[]).length;kp++){
   for(let vi=0;vi<(S.vocab[kp]||[]).length;vi++){
     if(norm(S.vocab[kp][vi])===n)return G?.[kp]?.[vi]||'';
   }
 }
 return extra[term]||extra[n]||'';
}
function sameGroup(kp,vi){
 const group=S.vocab[kp]||[],out=[];
 for(let step=1;out.length<2&&step<group.length+2;step++){
   const idx=(vi+step)%group.length;if(idx!==vi&&!out.includes(group[idx]))out.push(group[idx]);
 }
 return out;
}
function comparisons(w,kp,vi){
 const sp=special[w]||special[norm(w)];
 const cand=Array.isArray(sp)?sp.slice(0,2):sameGroup(kp,vi);
 while(cand.length<2)cand.push(...sameGroup(kp,vi).filter(x=>!cand.includes(x)));
 return cand.slice(0,2);
}
for(let kp=0;kp<(U.practice||[]).length;kp++){
 const items=U.practice[kp]?.items||[];
 for(let vi=0;vi<items.length;vi++){
   const it=items[vi],w=it?.w;if(!w)continue;
   const targetGloss=G?.[kp]?.[vi];if(!targetGloss)continue;
   const alts=comparisons(w,kp,vi),altGloss=alts.map(glossFor);
   if(altGloss.some(x=>!x)){
     const fallback=sameGroup(kp,vi);alts.splice(0,alts.length,...fallback);altGloss.splice(0,altGloss.length,...fallback.map(glossFor));
   }
   const old=it.meaning||{};
   const oldContext=String(old.context||'').trim();
   it.meaning={
     context:oldContext||`Compare “${w}” with “${alts[0]}” and “${alts[1]}”. They may be related, but they do not mean exactly the same thing.`,
     correct:targetGloss,
     wrong:altGloss,
     compare:[w,...alts],
     compareGlosses:[targetGloss,...altGloss],
     question:`What does “${w}” mean here?`
   };
 }
}
})();
