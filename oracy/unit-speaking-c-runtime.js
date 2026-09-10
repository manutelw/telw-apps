// Level C uses the approved Level B speaking architecture without modifying the frozen Level B runtime files.
// The shim loads the exact approved scripts and only widens their unit-number gate from 30 to 60 for Level C pages.
(async function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<31||Number(U.unitNo)>60)return;
const files=['unit-speaking-gym-v2.js','unit-speaking-model-natural.js','unit-speaking-model-coherent.js','unit-speaking-model-target-cued.js','unit-speaking-model-quality.js'];
for(const file of files){
  const r=await fetch('./'+file,{cache:'no-store'});if(!r.ok)throw new Error('ORACY Level C runtime could not load '+file);
  let js=await r.text();
  js=js.replace(/Number\(U\.unitNo\)>30/g,'Number(U.unitNo)>60');
  js=js.replace(/UNIT>30/g,'UNIT>60');
  Function(js+'\n//# sourceURL=oracy-level-c-'+file)();
}
})();
