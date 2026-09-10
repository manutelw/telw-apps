// Level C reuses the frozen Level B live-conversation client unchanged except for its separate Level C gateway.
(async function(){
'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.unitNo)<31||Number(U.unitNo)>60)return;
const r=await fetch('./conversation-shared.js',{cache:'no-store'});if(!r.ok)throw new Error('ORACY Level C conversation client could not load.');
let js=await r.text();js=js.replace("fetch('/oracy/session'","fetch('/oracy/session-c'");
Function(js+'\n//# sourceURL=oracy-level-c-conversation-shared.js')();
})();
