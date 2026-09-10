// Surgical bootstrap for Level C Units 2-30. Supplies renderer speaking cards and fixes in-unit navigation only.
(function(){'use strict';
const U=window.ORACY_UNIT;if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const P=U.practice||[];
const pick=(kp,rep)=>P[kp]?.reps?.[rep]||{};
const card=(title,kp,rep,type='personal')=>{const d=pick(kp,rep);return{title,prompt:d.prompt||'Respond to the situation.',help:d.hint||'Use the target structure naturally.',opening:d.prompt||'Respond to the situation.',type,min:1,markers:['actually'],model:'Give a clear response using the target structure and one relevant detail.',own:'Keep the structure and change the situation.'}};
U.speaking={
 s1:card('First response',0,0),
 s2:card('Statement response',0,1),
 s3:card('Use it in a new context',1,0),
 s4:card('React and reformulate',1,3,'dialogue'),
 s5:card('Pressure finish',2,4)
};
setTimeout(()=>{
 const local=Number(U.localUnitNo);
 const nav=document.querySelector('.unit-nav');if(!nav)return;
 const links=nav.querySelectorAll('a');
 if(links[0])links[0].href=local===2?'./unit-31.html':`./unit-c.html?u=${local-1}`;
 if(links[1])links[1].href=local===30?'./':`./unit-c.html?u=${local+1}`;
},0);
})();
