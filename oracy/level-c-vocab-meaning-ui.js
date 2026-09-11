// Context-first vocabulary meaning check for Level C items that provide meaning metadata.
(function(){
'use strict';
const U=window.ORACY_UNIT;if(!U)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function install(){
  const drills=[...document.querySelectorAll('.c-vocab-drill')];
  if(!drills.length)return false;
  let added=0;
  for(const box of drills){
    if(box.dataset.meaningInstalled==='1')continue;
    const kp=Number(box.dataset.kp),vi=Number(box.dataset.vi),d=U.practice?.[kp]?.items?.[vi],m=d?.meaning;
    if(!m)continue;
    const record=box.querySelector('.c-record');if(record)record.disabled=true;
    const opts=[m.correct,...(m.wrong||[])];
    // Deterministic rotation prevents every correct answer appearing in the same position.
    const shift=(kp*5+vi)%3,rot=opts.slice(shift).concat(opts.slice(0,shift)),correct=rot.indexOf(m.correct);
    const panel=document.createElement('div');panel.className='model c-meaning-check';
    panel.innerHTML=`<b>Understand the word from context</b><p>${esc(m.context)}</p><p><b>What does “${esc(d.w)}” mean here?</b></p>${rot.map((x,i)=>`<label style="display:block;margin:7px 0"><input type="radio" name="meaning-${kp}-${vi}" value="${i}"> ${esc(x)}</label>`).join('')}<button type="button" class="c-meaning-button">Check meaning</button><div class="answer c-meaning-answer"></div>`;
    const model=box.querySelector('.model');box.insertBefore(panel,model||box.children[2]||null);
    panel.querySelector('.c-meaning-button').onclick=()=>{
      const picked=panel.querySelector(`input[name="meaning-${kp}-${vi}"]:checked`),out=panel.querySelector('.c-meaning-answer');
      if(!picked){out.className='answer bad c-meaning-answer';out.textContent='Choose a meaning first.';return}
      if(Number(picked.value)===correct){out.className='answer ok c-meaning-answer';out.innerHTML='<b>Correct.</b> Now listen to the conversation and use the word yourself.';if(record)record.disabled=false}
      else{out.className='answer bad c-meaning-answer';out.innerHTML='<b>Not quite.</b> Read the example again and look at what the word tells you about the situation.'}
    };
    box.dataset.meaningInstalled='1';added++;
  }
  return added>0;
}
if(!install())new MutationObserver((m,o)=>{if(install())o.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
