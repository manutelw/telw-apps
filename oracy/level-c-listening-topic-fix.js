// Level C Units 2-30: varied topic-led listening. Text shown and audio source use the same U.passages lines.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const V=['marin','cedar','marin','cedar'];
const cap=s=>String(s||'').replace(/^./,c=>c.toUpperCase());
const vocab=(kp,n)=>S.vocab?.[kp]?.[n]||'';
const shape=(kp)=>U.keyPoints?.[kp]?.chips?.[0]||'the unit sentence shape';

function mono(ctx,kp){return [
 ['Narrator','marin',`${cap(ctx)} sounded simple when I first heard about it, but the details made it more interesting.`],
 ['Narrator','marin',`The first thing I noticed was how people actually took part, not just what the idea looked like on paper.`],
 ['Narrator','marin',`One person called it ${vocab(kp,0)}, while another thought ${vocab(kp,1)} described it better.`],
 ['Narrator','marin',`That difference mattered because the same situation can feel very different depending on what someone needs.`],
 ['Narrator','marin',`I watched what happened next and tried to separate the useful part from the part that might cause difficulty.`],
 ['Narrator','marin',`By the end, I had a clearer view: ${ctx} works best when the people involved know what to expect and can respond to changes.`],
 ['Narrator','marin',`It is the sort of situation where one small detail can change the whole experience.`],
 ['Narrator','marin',`That is why I would look at the real outcome before deciding whether the idea is worth repeating.`]
]}
function ad(ctx,kp){return [
 ['Host','cedar',`Looking for something different this week? Try ${ctx}.`],
 ['Host','cedar',`It is designed for people who want a clear plan, useful information and enough flexibility to make their own choices.`],
 ['Host','cedar',`You can expect something ${vocab(kp,0)} rather than something rushed or confusing.`],
 ['Host','cedar',`If you are still unsure, check the timings, what is included and what you need to bring before you decide.`],
 ['Host','cedar',`Friends can join together, and first-timers do not need to pretend they already know how everything works.`],
 ['Host','cedar',`The aim is simple: make ${ctx} easy to understand and easy to take part in.`],
 ['Host','cedar',`Spaces are limited in this fictional practice announcement, so imagine you are deciding whether it suits you.`],
 ['Host','cedar',`Would you join? What would you want to know first?`]
]}
function presentation(ctx,kp){return [
 ['Speaker','marin',`Good morning. I want to look at ${ctx} and what makes it work well in practice.`],
 ['Speaker','marin',`First, there is the basic idea itself. Then there is the experience of the people who actually take part.`],
 ['Speaker','marin',`A useful example is when one part seems ${vocab(kp,0)}, but another part creates a very different reaction.`],
 ['Speaker','marin',`That tells us not to judge the whole situation from one detail.`],
 ['Speaker','marin',`Second, we need to think about what changes the outcome: timing, information, cost, convenience or the people involved.`],
 ['Speaker','marin',`Third, we should look at what someone would do next if the first plan did not work.`],
 ['Speaker','marin',`My main point is that ${ctx} becomes easier to judge when we compare the idea with the actual result.`],
 ['Speaker','marin',`I will finish with one question: what single change would improve this situation most?`]
]}
function announcement(ctx,kp){return [
 ['Announcer','cedar',`Attention please. Here is an update about ${ctx}.`],
 ['Announcer','cedar',`The main arrangement remains the same, but one practical detail has changed.`],
 ['Announcer','cedar',`Please check the new information before you travel, arrive or make a final decision.`],
 ['Announcer','cedar',`If anything seems ${vocab(kp,0)}, ask for clarification rather than guessing.`],
 ['Announcer','cedar',`People who are already on the way should follow the latest instruction and allow a little extra time.`],
 ['Announcer','cedar',`Anyone who cannot continue with the plan should use the alternative arrangement given by the organiser.`],
 ['Announcer','cedar',`Please share the update only after checking that you have understood it correctly.`],
 ['Announcer','cedar',`Thank you for your patience and cooperation.`]
]}
function interview(ctx,kp){return [
 ['Interviewer','cedar',`You have some experience of ${ctx}. What was it actually like?`],
 ['Guest','marin',`More interesting than I expected. I thought the main issue would be simple, but there were several small decisions to make.`],
 ['Interviewer','cedar',`What helped most?`],
 ['Guest','marin',`Clear information. Once I knew what was happening, the situation felt much more ${vocab(kp,0)}.`],
 ['Interviewer','cedar',`Was there anything you would change?`],
 ['Guest','marin',`Yes. I would give people the important detail earlier, because that would prevent a lot of uncertainty.`],
 ['Interviewer','cedar',`Would you do it again?`],
 ['Guest','marin',`Probably, but I would prepare differently next time and ask one or two questions before I committed to the plan.`],
 ['Interviewer','cedar',`So the experience was useful, but not perfect.`],
 ['Guest','marin',`Exactly. That is a fair summary.`]
]}
function podcast(ctx,kp){return [
 ['Host','cedar',`Today we are talking about ${ctx}. Why does this topic get such different reactions?`],
 ['Guest','marin',`Because people notice different things first. One person sees the benefit; another notices the inconvenience.`],
 ['Host','cedar',`What should we pay attention to?`],
 ['Guest','marin',`The real effect. A word like ${vocab(kp,0)} is useful only if the facts actually support it.`],
 ['Host','cedar',`Can people change their minds once they hear another view?`],
 ['Guest','marin',`Of course. A good example can be more persuasive than a strong opinion with no evidence.`],
 ['Host','cedar',`What would you ask someone who strongly disagreed with you?`],
 ['Guest','marin',`I would ask what experience led them to that view, then I would compare it with mine.`],
 ['Host','cedar',`That sounds more useful than arguing over labels.`],
 ['Guest','marin',`Much more useful. The goal is to understand the situation well enough to make a sensible judgement.`]
]}
function story(ctx,kp){return [
 ['Narrator','marin',`Last weekend, ${ctx} did not go quite as planned.`],
 ['Narrator','marin',`At first, everyone assumed the arrangement was clear, so nobody asked an extra question.`],
 ['Narrator','marin',`Then one small change created confusion, and the group had to decide what to do next.`],
 ['Narrator','marin',`One person stayed calm and suggested a ${vocab(kp,0)} solution instead of blaming anyone.`],
 ['Narrator','marin',`Another person checked the latest information and found an option the others had missed.`],
 ['Narrator','marin',`Once they compared the choices, the group agreed on a practical way forward.`],
 ['Narrator','marin',`The problem took only a few minutes to solve, but it changed how everyone thought about preparation.`],
 ['Narrator','marin',`By the end, the experience had become more useful than the original plan because everyone had learned how to respond when something changed.`]
]}
function gd(ctx,kp){return [
 ['A','cedar',`I would like to start with one point about ${ctx}. We should judge it by the effect it has on the people involved.`],
 ['B','marin',`I agree with that, and I would add that convenience matters too. A good idea can still fail if it is difficult to use.`],
 ['C','cedar',`That is fair, but I see one risk. We may be assuming that everyone has the same needs.`],
 ['A','marin',`Good point. So perhaps we should separate the people who benefit from the people who might face a problem.`],
 ['B','cedar',`Yes, and this is where ${vocab(kp,0)} becomes important. We need to decide whether that word really describes the situation.`],
 ['C','marin',`I partly agree, but I would not decide from one example. We need a broader view before we reach a conclusion.`],
 ['A','cedar',`Can I bring us back to the main question? What change would improve the situation without creating a bigger problem elsewhere?`],
 ['B','marin',`I would make the first step clearer and give people one practical alternative.`],
 ['C','cedar',`That seems workable. It keeps the benefit while reducing the main concern.`],
 ['A','marin',`So our group view is that ${ctx} can work, but only if the practical concerns are addressed clearly.`]
]}
const GENRES=[['monologue',mono],['advertisement',ad],['presentation',presentation],['announcement',announcement],['interview',interview],['podcast',podcast],['story',story],['group discussion',gd]];
function make(kp){
 const ctx=S.contexts[kp];
 // Preserve the fuller source-aligned interactive conversation for Units 16-30 KP2.
 if(kp===1&&S.listenSpeak?.turns?.length>=8){return {genre:'conversation',segs:S.listenSpeak.turns.map((t,i)=>[t[0],t[0]==='A'?'cedar':'marin',t[1]])};}
 const pick=GENRES[(Number(U.localUnitNo)*3+kp)%GENRES.length];
 return {genre:pick[0],segs:pick[1](ctx,kp)};
}
for(let i=0;i<3;i++){
 const id=`kp${i+1}`,made=make(i);U.passages[id]=made.segs;
 if(U.keyPoints?.[i]){
   U.keyPoints[i].listen=S.contexts[i];
   U.keyPoints[i].genre=made.genre;
   if(made.genre==='group discussion')U.keyPoints[i].gdFocus={
     entry:'A enters with one clear point instead of repeating the topic.',
     agreement:'B agrees briefly, then adds a fresh reason.',
     build:'A and B extend earlier ideas instead of starting a new speech each time.',
     disagreement:'C disagrees with the idea, not the person, and gives a reason.',
     return:'A brings the group back to the main question when the discussion could drift.',
     structure:`Use the unit sentence shape where it fits: ${shape(i)}. Do not force it into every turn.`
   };
 }
}
})();
