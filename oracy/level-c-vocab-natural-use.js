// Level C Units 2-30: replace meta vocabulary dialogues with context -> meaning -> natural use -> repeated speaking.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const clean=s=>String(s||'').trim();
const lc=s=>clean(s).toLowerCase();
const cap=s=>{s=clean(s);return s?s[0].toUpperCase()+s.slice(1):s};
const special={
 'commit to':ctx=>`I can commit to ${ctx} for the next month, because I have checked my schedule.`,
 'reluctant':ctx=>`I was reluctant to join ${ctx} at first, because I was not sure I could manage the time.`,
 'take up':ctx=>`I decided to take up the activity connected with ${ctx} and give it a proper try.`,
 'stick with':ctx=>`Even if it feels difficult at first, I want to stick with ${ctx} for a few weeks.`,
 'give up':ctx=>`I do not want to give up on ${ctx} just because the first attempt was difficult.`,
 'get into':ctx=>`Once I tried ${ctx} a few times, I really started to get into it.`,
 'carry on':ctx=>`The first attempt was tiring, but I decided to carry on.`,
 'persuade':ctx=>`I persuaded a friend to join me for ${ctx}.`,
 'encourage':ctx=>`I encouraged my cousin to try ${ctx} instead of giving up.`,
 'allow':ctx=>`The organiser allowed us to change our plan for ${ctx}.`,
 'make':ctx=>`The situation around ${ctx} made us think again.`,
 'teach':ctx=>`A friend taught me how to handle ${ctx} more confidently.`,
 'provided that':ctx=>`We can go ahead with ${ctx}, provided that everyone agrees to the basic rules.`,
 'on condition that':ctx=>`I would support ${ctx} on condition that the practical problems are dealt with first.`,
 'were i to':ctx=>`Were I to take part in ${ctx}, I would prepare properly before deciding.`,
 'should it happen':ctx=>`Should it happen during ${ctx}, we would deal with it calmly rather than panic.`,
 'i wish':ctx=>`I wish ${ctx} were easier to organise for everyone.`,
 'would have':ctx=>`I would have handled ${ctx} differently if I had known the full story.`,
 'could have':ctx=>`We could have avoided the problem in ${ctx} with better planning.`,
 'should have':ctx=>`We should have checked the details before ${ctx}.`,
 'might have':ctx=>`The outcome of ${ctx} might have been different if one detail had changed.`,
 "if it hadn't been for":ctx=>`If it hadn't been for one helpful person, ${ctx} could have gone badly wrong.`,
 'would rather':ctx=>`I would rather deal with ${ctx} now than leave it until later.`,
 'if only':ctx=>`If only we had planned ${ctx} earlier, we could have avoided the rush.`,
 'not only...but also':ctx=>`The plan for ${ctx} was not only practical but also easy to explain.`,
 'must have':ctx=>`Someone must have changed the plan for ${ctx}, because the details are different now.`,
 "can't have":ctx=>`They can't have checked ${ctx} properly, because an important detail is missing.`,
 "needn't have":ctx=>`We needn't have worried so much about ${ctx}; the problem was smaller than expected.`,
 'had better':ctx=>`We had better check the details of ${ctx} before we leave.`,
 'after having':ctx=>`After having checked ${ctx}, we were ready to make a decision.`,
 'although':ctx=>`Although ${ctx} was difficult, we managed it well.`,
 'despite':ctx=>`Despite the difficulty, ${ctx} went ahead as planned.`,
 'however':ctx=>`${cap(ctx)} looked simple at first. However, one important detail changed the situation.`,
 'even if':ctx=>`Even if ${ctx} becomes difficult, I would still try to finish it properly.`,
 'it is essential that':ctx=>`It is essential that everyone involved in ${ctx} knows the basic plan.`,
 'had i known':ctx=>`Had I known more about ${ctx}, I would have made a different choice.`,
 'would rather have':ctx=>`I would rather have planned ${ctx} earlier than rush at the last minute.`,
 'should be':ctx=>`The people involved in ${ctx} should be checking the details now.`,
 'if we had':ctx=>`If we had planned ${ctx} differently, the result might have changed.`,
 'we would now':ctx=>`With a better earlier decision, we would now be in a much easier position with ${ctx}.`,
 'agreed to':ctx=>`They agreed to change one part of ${ctx} after hearing the complaint.`,
 'refused to':ctx=>`One person refused to accept the first solution to ${ctx}.`,
 'accused of':ctx=>`He was accused of causing the problem during ${ctx}, but the facts were still unclear.`,
 'apologised for':ctx=>`She apologised for the confusion during ${ctx}.`,
 'insisted that':ctx=>`He insisted that the problem in ${ctx} had to be checked again.`,
 'never before':ctx=>`Never before has ${ctx} attracted so much attention.`,
 'at no time':ctx=>`At no time during ${ctx} did the organisers ignore the safety rules.`,
 'under no circumstances':ctx=>`Under no circumstances should people ignore the basic rules during ${ctx}.`,
 'not only':ctx=>`Not only did ${ctx} attract attention, it also changed people's views.`,
 'so little':ctx=>`So little was known about ${ctx} that people began asking more questions.`,
 'will':ctx=>`I think ${ctx} will go ahead as planned.`,
 'going to':ctx=>`We are going to prepare for ${ctx} well in advance.`,
 'present continuous':ctx=>`We are meeting tomorrow to organise ${ctx}.`,
 'future continuous':ctx=>`This time tomorrow, we will be working on ${ctx}.`,
 'future perfect':ctx=>`By this time tomorrow, we will have finished the main part of ${ctx}.`,
 'used to':ctx=>`We used to handle ${ctx} very differently years ago.`,
 'be used to':ctx=>`I am used to dealing with situations like ${ctx} now.`,
 'would':ctx=>`When we were younger, we would often talk about things like ${ctx}.`,
 'remember to':ctx=>`Remember to check the details before ${ctx}.`,
 'remember -ing':ctx=>`I remember talking about ${ctx} for the first time.`,
 'had been':ctx=>`We had been thinking about ${ctx} for weeks before anything changed.`,
 'have been':ctx=>`We have been talking about ${ctx} for several days.`,
 'was doing':ctx=>`I was dealing with ${ctx} when the message arrived.`,
 'had done':ctx=>`By then, we had done everything needed for ${ctx}.`,
 'as the saying goes':ctx=>`As the saying goes, a little planning goes a long way — and that certainly applies to ${ctx}.`,
 'as someone once said':ctx=>`As someone once said, good judgement matters more than quick judgement; ${ctx} is a good example.`,
 'there is an old saying':ctx=>`There is an old saying about learning from experience, and ${ctx} proves the point.`,
 'in other words':ctx=>`${cap(ctx)} needs a simpler plan. In other words, we should remove what is unnecessary.`,
 'to put it simply':ctx=>`To put it simply, ${ctx} will work only if the basic details are right.`
};
const intransitive=new Set(['set off','grow on','move in','get around','settle in','stand out','warm up','go wrong','work out','end up','catch on','go ahead','go off','head out','chill out','come on','drop by','mess around','break out','turn out','fall behind','catch up','clock in','speak up','back down','calm down','make up','grow up','settle down','come back']);
const transitiveObject=new Set(['chop up','stir in','boil down','heat up','serve up','cut down on','throw in','leave out','back up','rule out','think through','go along with','push back on','check in','hold up','get on','see off','miss out on','come across','step in','switch over','catch up on','turn down','sit through','sort out','put off','go for','change one\'s mind','live with','look like','pick out','look around','come upon','head towards','set aside','take in','fill in','hand over','hold on to','check through','follow up','look into','track down','carry out','wrap up','take on','fill in for','put up','put away','put out','put together','keep up','keep away','keep on','keep to','keep back','go through','go around','go without','log in','scroll through','filter out','cut back on','sign up','add up','round off','come to','break down','call off','go over','hand in','keep at','get in touch','hear from','look back on','keep in touch','write back','live up to','sell out','draw in','speak out against','stand up for','bring about','deal with','own up','point out','stand for','vote on','bring in','carry through','call for','pick up','fit in','switch to','spell out','look forward to','work around','plan ahead','sum up','come up with','get across','laugh off','take away']);
function verbUse(w,ctx){
 if(intransitive.has(w))return `During ${ctx}, we decided to ${w} rather than wait any longer.`;
 if(w==='run out of')return `During ${ctx}, we nearly ran out of time before the final decision.`;
 if(w==='make room for')return `For ${ctx}, we had to make room for one more person.`;
 if(w==='fill in for')return `During ${ctx}, I had to fill in for someone who could not attend.`;
 if(w==='look forward to')return `I am really looking forward to ${ctx}.`;
 if(w==='get in touch')return `I decided to get in touch with the organiser about ${ctx}.`;
 if(w==='hear from')return `I was waiting to hear from the organiser about ${ctx}.`;
 if(w==='write back')return `I promised to write back after hearing about ${ctx}.`;
 if(w==='object to')return `I object to the current plan for ${ctx} because one part seems unfair.`;
 if(w==='opposed to')return `I am opposed to the current proposal for ${ctx}.`;
 if(w==='in favour of')return `I am in favour of the proposal for ${ctx} because it seems practical.`;
 if(w==='strongly believe')return `I strongly believe ${ctx} should be handled more carefully.`;
 if(w==='is thought to')return `${cap(ctx)} is thought to have affected more people than first reported.`;
 if(w==='is said to')return `${cap(ctx)} is said to be changing quickly.`;
 if(w==='was believed to')return `${cap(ctx)} was believed to be under control at first.`;
 if(w==='was to')return `${cap(ctx)} was to begin on Monday, but the date changed.`;
 if(w==='had something stolen')return `During ${ctx}, one visitor had a bag stolen.`;
 if(transitiveObject.has(w))return `During ${ctx}, we had to ${w} the main issue before moving on.`;
 return `For ${ctx}, I decided to ${w} before making the next choice.`;
}
function adverbUse(w,ctx){
 if(['approximately','roughly'].includes(w))return `There were ${w} fifty people involved in ${ctx}.`;
 if(w==='exactly')return `That is exactly what happened during ${ctx}.`;
 if(w==='equivalent')return `The two options for ${ctx} were roughly equivalent in cost.`;
 if(w==='difference')return `The biggest difference in ${ctx} was the amount of time each option needed.`;
 if(['considerably','slightly','far','nowhere near','by far'].includes(w))return `The second option for ${ctx} was ${w} better than the first.`;
 if(['definitely','probably','possibly'].includes(w))return `${cap(ctx)} will ${w} need more planning than we first expected.`;
 if(['likely','unlikely'].includes(w))return `${cap(ctx)} is ${w} to change before the final decision.`;
 return `${cap(ctx)} was ${w} difficult at first, but the situation became clearer.`;
}
function nounUse(w,ctx){
 if(w.includes('/')){const [a,b]=w.split('/');return `During ${ctx}, a British speaker might say “${a}”, while an American speaker might say “${b}”.`;}
 return `During ${ctx}, the ${w} became an important part of the discussion.`;
}
function useSentence(w,ctx,meaning){
 const n=lc(w),m=lc(meaning);
 if(special[n])return special[n](ctx);
 if(w.includes('/'))return nounUse(w,ctx);
 if(m.startsWith('to ')||m.startsWith('be ')||m.startsWith('become ')||m.startsWith('move ')||m.startsWith('start ')||m.startsWith('continue ')||m.startsWith('reduce ')||m.startsWith('change ')||m.startsWith('find ')||m.startsWith('accept ')||m.startsWith('solve ')||m.startsWith('investigate ')||m.startsWith('perform ')||m.startsWith('finish ')||m.startsWith('publicly ')||m.startsWith('defend ')||m.startsWith('stop ')||m.startsWith('cause ')||m.startsWith('handle ')||m.startsWith('reply ')||m.startsWith('contact ')||m.startsWith('receive ')||m.startsWith('think about ')||m.startsWith('return '))return verbUse(n,ctx);
 if(n.endsWith('ly')||['far','by far','nowhere near','most often','just','actually','however','exactly','roughly','approximately','definitely','probably','possibly','likely','unlikely'].includes(n))return adverbUse(n,ctx);
 if(m.startsWith('having ')||m.startsWith('able ')||m.startsWith('not ')||m.startsWith('easy ')||m.startsWith('calm ')||m.startsWith('full ')||m.startsWith('useful ')||m.startsWith('said ')||m.startsWith('important ')||m.startsWith('connected ')||m.startsWith('pleased ')||m.startsWith('worth ')||m.startsWith('so ')||m.startsWith('very ')||m.startsWith('claimed ')||m.startsWith('higher ')||m.startsWith('against ')||m.startsWith('supporting ')||m.startsWith('certainly ')||m.startsWith('expected ')||m.startsWith('perhaps'))return `For ${ctx}, that seems ${n} to me.`;
 return nounUse(n,ctx);
}
function shortMeaning(m){m=clean(m);return m.endsWith('.')?m.slice(0,-1):m;}
for(let kp=0;kp<(U.practice||[]).length;kp++){
 const ctx=S.contexts[kp];
 for(let vi=0;vi<(U.practice[kp]?.items||[]).length;vi++){
  const it=U.practice[kp].items[vi],w=clean(it.w),m=clean(it.meaning?.correct||'');
  if(!w||!m)continue;
  const use=useSentence(w,ctx,m);
  it.lines=[
   `A: What happened with ${ctx}?`,
   `B: ${use}`,
   `A: So here, “${w}” means ${shortMeaning(m)}?`,
   `B: Exactly. That is why it works naturally in this situation.`
  ];
  it.p=[
   `Talk about ${ctx}. Use “${w}” in one complete sentence.`,
   `Someone gives a different view of ${ctx}. Respond naturally and use “${w}”.`,
   `Use “${w}” again in a different situation from your own life.`
  ];
 }
}
})();
