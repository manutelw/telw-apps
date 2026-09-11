// Keeps every source structure in the lesson while showing it through examples rather than grammar labels.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo],R=window.ORACY_C_RULES;
if(!U||!S||!R||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const n=S.structures.length,cuts=n<=3?[1,2]:n===4?[2,3]:n===5?[2,4]:[2,4];
const groups=[S.structures.slice(0,cuts[0]),S.structures.slice(cuts[0],cuts[1]),S.structures.slice(cuts[1])];
while(groups.length<3)groups.push([]);
for(let i=0;i<3;i++){
 const G=groups[i].length?groups[i]:[S.structures[Math.min(i,n-1)]],kp=U.keyPoints[i],v=S.vocab[i]||[];
 const examples=G.map(x=>R[x]?.[2]).filter(Boolean);
 const shown=examples.length?examples:['Say one short, clear sentence that fits the situation.'];
 kp.kind='Useful language';
 kp.heading=i===0?'Notice how the idea is said':i===1?'Use the same idea in conversation':'Use the language again under pressure';
 kp.chips=[...v];
 kp.model=shown.join(' ');
 kp.teaching={
   meaning:shown.map(x=>`Use this sentence shape when it matches the meaning you want: “${x}”`),
   form:shown.map(x=>`Say it like this first, then change the details to fit your own situation: “${x}”`),
   contrast:['Do not choose a sentence because it sounds advanced. Choose the one that says the meaning you actually want.','If the situation is real, imagined, past, future or uncertain, make sure your sentence shows that difference clearly.'],
   errors:['Do not name the language rule in your answer. Say the sentence itself.','Keep the time and meaning consistent from the first part of the sentence to the second.','Use one clear sentence first. Add another detail only after the first idea is complete.']
 };
 const p=U.practice[i];if(!p)continue;
 p.reps=[
  {type:'qa',prompt:`Talk about ${S.contexts[i]}.`,hint:`Start from this model shape: “${shown[0]}” Change the details to make it yours. Use “${v[0]||''}”.`},
  {type:'sr',prompt:`Someone gives a different view about ${S.theme}.`,hint:`React naturally. Then use a sentence shaped like: “${shown[Math.min(1,shown.length-1)]}” Add “${v[1]||''}”.`},
  {type:'qa',prompt:`Give one reason or example about ${S.contexts[i]}.`,hint:`Use another model shape from above and include “${v[2]||''}”.`},
  {type:'sr',prompt:'A friend is not convinced by your first answer.',hint:'Say the idea again more clearly. Use one of the model sentence shapes above, but change the details.'},
  {type:'qa',prompt:'Give your final view in about 20 seconds.',hint:`Use two useful sentence shapes from this Key Point and include “${v[3]||''}”.`}
 ];
}
})();
