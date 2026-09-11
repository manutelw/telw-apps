// Contrast-first vocabulary meaning checks for Level C.
(function(){
'use strict';
const U=window.ORACY_UNIT;if(!U)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function compareBox(m){
 const terms=m.compare||[],glosses=m.compareGlosses||[];
 if(terms.length!==3||glosses.length!==3)return '';
 return `<div class="model" style="margin-top:10px"><b>Compare the three</b><br>${terms.map((t,i)=>`<div style="margin-top:5px"><b>${esc(t)}</b> — ${esc(glosses[i])}</div>`).join('')}</div>`;
}
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
    const shift=(kp*5+vi)%3,rot=opts.slice(shift).concat(opts.slice(0,shift)),correct=rot.indexOf(m.correct);
    const names=(m.compare||[]).filter(Boolean);
    const compareLine=names.length===3?`<p><b>Compare:</b> ${names.map(x=>`<span style="display:inline-block;margin-right:10px">${esc(x)}</span>`).join('')}</p>`:'';
    const panel=document.createElement('div');panel.className='model c-meaning-check';
    panel.innerHTML=`<b>Understand the word by comparing it</b>${compareLine}<p>${esc(m.context)}</p><p><b>${esc(m.question||`What does “${d.w}” mean here?`)}</b></p>${rot.map((x,i)=>`<label style="display:block;margin:7px 0"><input type="radio" name="meaning-${kp}-${vi}" value="${i}"> ${esc(x)}</label>`).join('')}<button type="button" class="c-meaning-button">Check meaning</button><div class="answer c-meaning-answer"></div>`;
    const model=box.querySelector('.model');box.insertBefore(panel,model||box.children[2]||null);
    panel.querySelector('.c-meaning-button').onclick=()=>{
      const picked=panel.querySelector(`input[name="meaning-${kp}-${vi}"]:checked`),out=panel.querySelector('.c-meaning-answer');
      if(!picked){out.className='answer bad c-meaning-answer';out.textContent='Choose the meaning that fits the target word first.';return}
      if(Number(picked.value)===correct){
        out.className='answer ok c-meaning-answer';
        out.innerHTML=`<b>Correct.</b> ${compareBox(m)}<div style="margin-top:8px"><b>Now listen to the model conversation and use “${esc(d.w)}” yourself.</b></div>`;
        if(record)record.disabled=false;
      }else{
        out.className='answer bad c-meaning-answer';
        out.innerHTML='<b>Not quite.</b> Compare the three meanings again. Ask: is this word about possibility, likelihood, value, degree, action, or something else? Then choose once more.';
      }
    };
    box.dataset.meaningInstalled='1';added++;
  }
  return added>0;
}
if(!install())new MutationObserver((m,o)=>{if(install())o.disconnect()}).observe(document.documentElement,{childList:true,subtree:true});
})();
