// C1A Unit 6: make the pre-answer comprehension rule explicit and usable.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)!==6)return;
const rule='Listen for the relationship in the conversation before you choose. A reason often follows because, as or since. A condition often starts with if, provided that or on condition that. A consequence or result may be signalled by so, therefore, hence, as a result or which means. First identify which relationship the speakers are expressing; then choose the answer supported by what they actually say.';
U.notes=U.notes||{};
for(const q of (U.checks||[]))U.notes[q.id]=rule;
})();
