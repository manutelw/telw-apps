// Level C uses the approved Level B speaking architecture without modifying the frozen Level B runtime files.
// The shim loads the exact approved scripts, applies the same approved-vocabulary patch used in production Level B,
// and only widens their unit-number gate from 30 to 60 for Level C pages.
(async function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<31||Number(U.unitNo)>60)return;
const files=['unit-speaking-gym-v2.js','unit-speaking-model-natural.js','unit-speaking-model-coherent.js','unit-speaking-model-target-cued.js','unit-speaking-model-quality.js'];
for(const file of files){
  const r=await fetch('./'+file,{cache:'no-store'});if(!r.ok)throw new Error('ORACY Level C runtime could not load '+file);
  let js=await r.text();
  if(file==='unit-speaking-gym-v2.js'){
    const old=/function chooseVocab\(kp,sec\)\{[\s\S]*?return chosen\.slice\(0,5\)\}/;
    const replacement=`function approvedTargets(){return uniq((U.targets||[]).slice(0,6).map(String).filter(lexical).filter(x=>!META.has(norm(x))))}\nfunction chooseVocab(kp,sec){const base=approvedTargets();if(base.length>=5){const shift=kp%base.length;return [...base.slice(shift),...base.slice(0,shift)].slice(0,5)}const chips=originalChips(sec),pool=uniq([...base,...chips]).filter(lexical).filter(x=>!META.has(norm(x)));return pool.slice(0,5)}`;
    if(!old.test(js))throw new Error('ORACY Level C could not apply the approved vocabulary-source rule.');
    js=js.replace(old,replacement);
  }
  js=js.replace(/Number\(U\.unitNo\)>30/g,'Number(U.unitNo)>60');
  js=js.replace(/UNIT>30/g,'UNIT>60');
  Function(js+'\n//# sourceURL=oracy-level-c-'+file)();
}
})();
