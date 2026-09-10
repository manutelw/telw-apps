// Level C passage-audio binding: make TTS cache identity follow the exact visible passage text.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.unitNo)<31)return;
function hashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
for(const box of document.querySelectorAll('[data-passage]')){
  const original=box.dataset.passage;
  const segs=U.passages?.[original]||[];
  if(!segs.length)continue;
  const visible=segs.map(x=>String(x?.[2]||'')).join('\n');
  const revised=`${original}-txt-${hashText(visible)}`;
  if(!U.passages[revised])U.passages[revised]=segs;
  box.dataset.passage=revised;
  const section=box.closest('section.kp');
  const button=section?.querySelector('.audio[data-id]');
  if(button&&button.dataset.id===original)button.dataset.id=revised;
}
})();
