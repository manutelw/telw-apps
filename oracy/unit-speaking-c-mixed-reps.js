(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.unitNo)!==31)return;
const R=[
[
{t:'Question → Answer',p:'Tell me about a recent event or experience that affected you.',h:'exciting / excited, confusing / confused, tiring / tired'},
{t:'Statement → Response',p:'The bus journey was long, crowded and noisy.',h:'tiring → tired'},
{t:'Question → Answer',p:'How would you describe someone who explains ideas clearly and confidently?',h:'articulate / confident'},
{t:'Statement → Response',p:'The signs at the station were difficult to follow.',h:'confusing → confused'},
{t:'Question → Answer',p:'How did you feel the last time you tried something completely new?',h:'one -ing adjective + one -ed adjective'}
],
[
{t:'Question → Answer',p:'How can I improve my stamina?',h:'practise regularly'},
{t:'Statement → Response',p:'Raj’s grades are falling.',h:'watching Instagram Reels'},
{t:'Question → Answer',p:'Why does travelling become easier after you have done it several times?',h:'travel more → become more confident'},
{t:'Statement → Response',p:'The roads are getting busier as the evening goes on.',h:'leave later → journey takes longer'},
{t:'Question → Answer',p:'How can someone become more confident speaking English?',h:'speak more → worry less about mistakes'}
],
[
{t:'Question → Answer',p:'Why do you prefer travelling early in the morning?',h:'roads are quieter'},
{t:'Statement → Response',p:'Kavya carries an umbrella every afternoon in July.',h:'monsoon showers are common'},
{t:'Question → Answer',p:'Why are you taking the Metro today?',h:'parking is difficult'},
{t:'Statement → Response',p:'Arjun has chosen the earlier train.',h:'wants enough time before a family function'},
{t:'Question → Answer',p:'Why do you like shopping at your neighbourhood market?',h:'shops are nearby / people are friendly'}
]
];
function apply(){const reps=[...document.querySelectorAll('.c-rep')];if(reps.length<15)return false;reps.forEach(rep=>{const kp=Number(rep.dataset.kp),r=Number(rep.dataset.rep),d=R[kp]?.[r];if(!d)return;const eye=rep.querySelector('.eyebrow');if(eye)eye.textContent=`REP ${r+1} · ${d.t}`;const intro=[...rep.children].find(x=>x.tagName==='P');if(intro)intro.innerHTML=`<b>${d.p}</b>`;let hint=rep.querySelector('.c-rep-hint');if(!hint){hint=document.createElement('div');hint.className='c-rep-hint';hint.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #efd7a0;border-radius:10px;background:#fff8e8;line-height:1.45';const model=rep.querySelector('.model');if(model)rep.insertBefore(hint,model);else if(intro)intro.insertAdjacentElement('afterend',hint)}hint.innerHTML=`<b>Hint:</b> ${d.h}`;if(r===3){const model=rep.querySelector('.model');const line=model?.querySelector('div');if(line)line.textContent=d.p}}
);return true}
let n=0;const t=setInterval(()=>{n++;if(apply()||n>40)clearInterval(t)},75);
})();
