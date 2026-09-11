// Level C Units 2-30: preserve the simple learner-facing rule before later enhancement layers rewrite the Key Point model.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
for(const kp of (U.keyPoints||[])){
  kp._plainRule=String(kp.model||'').trim();
}
})();
