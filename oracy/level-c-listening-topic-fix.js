// Level C Units 2-30: every visible listening text and its audio source come from the same topic-specific dialogue.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const voice=(n)=>n%2===0?'cedar':'marin';
const patterns=[
 ctx=>[
  `Have you thought much about ${ctx}?`,`Yes. I want to understand the situation properly before I decide what I think.`,`What seems most important at first?`,`The practical effect on the people involved. I would start there.`,`Would you act straight away?`,`Not without checking the details. A quick decision can miss something important.`,`So what would you ask first?`,`What is happening now, what could change, and who would be affected?`,`That gives us something concrete to discuss.`,`Exactly. Once those points are clear, the conversation becomes much easier to follow.`],
 ctx=>[
  `Let's talk through ${ctx}. What is your first reaction?`,`I can see why people might have different views on it.`,`What would help you judge it fairly?`,`I would separate what we know from what we are only assuming.`,`And after that?`,`I would look at one clear example rather than make a broad claim.`,`Would you expect everyone to agree?`,`No. Different people may value different things, so I would listen before responding.`,`That should keep the discussion balanced.`,`Yes, and it also makes it easier to explain why I reached my view.`],
 ctx=>[
  `I was reading about ${ctx}. It sounds simple at first, but it isn't.`,`That's often the case. The details usually matter more than the headline.`,`Which detail would you check first?`,`The one that changes the outcome most directly.`,`Would you compare different possibilities?`,`Definitely. I would compare at least two before choosing one.`,`How would you explain your choice?`,`I would state it clearly, give the main reason, and add one example.`,`And if someone challenged you?`,`I'd respond to their point first, then explain where my view is different.`],
 ctx=>[
  `Suppose we had to explain ${ctx} to someone who knew nothing about it. Where would we start?`,`With the basic situation, in plain language.`,`Then what?`,`One important detail, followed by an example that makes it easy to picture.`,`Would you include every fact?`,`No. Too many details can hide the main point.`,`So how would you keep it clear?`,`Main idea first, useful detail second, and the result or next step at the end.`,`That sounds easy to follow.`,`It is, especially when the speaker reacts to questions instead of reciting a prepared answer.`],
 ctx=>[
  `What do you make of ${ctx}?`,`I think we need to look at both the benefit and the possible difficulty.`,`Which side would you discuss first?`,`The benefit, because that explains why anyone would consider the idea.`,`And the difficulty?`,`I'd add it next, but I would keep it specific rather than make it sound bigger than it is.`,`What would make your answer convincing?`,`A real example and a clear reason.`,`Would you leave room for another view?`,`Yes. A good discussion should show that I heard the other side before giving my final position.`],
 ctx=>[
  `Imagine this comes up in a group discussion: ${ctx}. How would you enter the conversation?`,`I'd begin with one clear point rather than repeat what someone else has said.`,`How would you build on another person's idea?`,`I'd mention the part I agree with, then add a new detail.`,`What if you disagree?`,`I'd say why without making it personal.`,`And if the discussion starts going in circles?`,`I'd bring it back to the main question and suggest one practical way forward.`,`That would help the group move on.`,`Exactly. The goal is not just to speak; it is to help the conversation progress.`]
];
function makeDialogue(kp){
 const ctx=S.contexts[kp];
 if(kp===1&&S.listenSpeak?.turns?.length>=8)return S.listenSpeak.turns.map((t,i)=>[t[0],t[0]==='A'?'cedar':'marin',t[1]]);
 const lines=patterns[(Number(U.localUnitNo)+kp)%patterns.length](ctx);
 return lines.map((text,i)=>[i%2===0?'A':'B',voice(i),text]);
}
for(let i=0;i<3;i++){
 const id=`kp${i+1}`;
 const segs=makeDialogue(i);
 U.passages[id]=segs;
 if(U.keyPoints?.[i]){U.keyPoints[i].listen=S.contexts[i];U.keyPoints[i].genre='conversation';}
}
})();
