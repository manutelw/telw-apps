// Level C GD cadence: one substantial group discussion in every third unit (3,6,...,30), plus a GD speaking rep.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const n=Number(U.localUnitNo);
const D={
3:{kp:0,title:'Should students commit to one hobby instead of trying many?',turns:[
['A','cedar','I think students gain more from a hobby when they commit to it for a while instead of changing every few weeks.'],
['B','marin','I agree to some extent. If you stick with cycling, music or theatre, you usually improve enough to find it rewarding.'],
['C','cedar','I am not completely convinced. Trying different activities can help someone work out what they actually enjoy.'],
['D','marin','That is true, but giving up too quickly is different from exploring. Some people leave before they have really got into the activity.'],
['A','cedar','Exactly. I am not saying everyone must choose one hobby for years. I am saying a reasonable commitment matters.'],
['B','marin','And friends can encourage someone to carry on without pressuring them. That support can make a difficult beginning easier.'],
['C','cedar','Fair enough. Perhaps the better question is how long someone should try an activity before deciding it is not for them.'],
['D','marin','For me, a month or two is enough to judge the experience properly.'],
['A','cedar','So we seem to agree that exploring is useful, but persistence matters before we give up.']
],focus:['A enters with a clear position: commitment helps a hobby become rewarding.','B agrees partly and adds a reason about improvement.','D builds on C by separating exploration from giving up too quickly.','C disagrees with the idea, not the speaker, and explains why trying different activities can help.','C brings the group to a sharper question: how long should someone try?'],practice:{topic:'Should students commit to one hobby instead of trying many?',opening:'I think students should keep trying different hobbies until they find one they really enjoy.',help:'Respond as a GD participant. Agree or disagree, give one reason, and build on the point before you. Use one useful expression from this unit such as commit to, stick with, give up, get into or carry on.',model:'I partly agree, but I think we need to stick with an activity long enough to judge it properly. If we give up after one difficult session, we may never get into it.'}},
6:{kp:1,title:'Should colleges have a four-day week?',turns:[
['Aarav','cedar','I think a four-day college week could be worthwhile, provided that the timetable is planned properly. Students would have one extra day for projects, internships or independent study.'],
['Meera','marin','I agree with the idea in principle, but I am not sure it is feasible for every course. If the same number of classes were squeezed into four days, the days could become exhausting.'],
['Kabir','cedar','That is a fair point. But if colleges reduced unnecessary gaps between classes, they might not need to make the days much longer.'],
['Nisha','marin','I would push back on that slightly. Some courses need laboratories, workshops and practical sessions. You cannot always compress those without affecting learning.'],
['Aarav','cedar','True. So perhaps the question is not whether every college should have a four-day week, but whether it could work for some programmes.'],
['Meera','marin','Exactly. Were a college to introduce it, I would want to see evidence that students actually used the extra day productively.'],
['Kabir','cedar','And attendance would matter too. A four-day system could be sustainable only if students did not treat the fifth day as the beginning of a long weekend.'],
['Nisha','marin','I agree. We also need to think through the effect on teachers. If their workload simply gets compressed into four longer days, the change may solve one problem and create another.'],
['Aarav','cedar','So we seem to agree that we should not rule out a four-day week, but it should not be introduced everywhere in the same way.'],
['Meera','marin','Yes. My view would be: try it as a pilot first, measure attendance, learning and workload, and then decide whether it is worth continuing.']
],focus:['Aarav enters with a clear position and immediately adds a condition.','Meera agrees in principle before adding a concern.','Kabir builds on Meera\'s concern about longer days.','Nisha disagrees politely with the idea and gives a reason.','Aarav brings the group back to the central question and narrows it.'],practice:{topic:'Should colleges have a four-day week?',opening:'A four-day week would obviously be better because everyone would get a longer weekend.',help:'Do not simply agree or disagree. Respond to the point, add one condition or consequence, and use one Unit 6 expression such as feasible, worthwhile, provided that, think through or push back on.',model:'I would push back on that slightly. A longer weekend sounds attractive, but the plan would be worthwhile only provided that the four teaching days did not become exhausting.'}},
9:{kp:0,title:'Should friends always compromise when choosing what to watch?',turns:[
['A','cedar','When friends choose something to watch together, I think everyone should compromise rather than let one person decide every time.'],
['B','marin','I mostly agree. Whichever series we choose, someone may like it more than the others, so taking turns seems fair.'],
['C','cedar','But what if one choice is genuinely overrated and nobody except one person wants to sit through it?'],
['D','marin','Then I would not force the group to watch it. Either we choose something most people can enjoy, or we save that programme for another day.'],
['A','cedar','That makes sense. Whatever we choose, the point is to enjoy the evening together, not win an argument about taste.'],
['B','marin','Exactly. I have ended up enjoying shows I would never have picked myself because someone else suggested them.'],
['C','cedar','Fair point. I still think a gripping film is a safer group choice than a long series, though.'],
['D','marin','Can we bring this back to the main issue? Compromise does not mean pretending every choice is equally good. It means giving everyone a reasonable say.'],
['A','cedar','So our view is that friends should compromise, but nobody should be expected to sit through something they strongly dislike.']
],focus:['A gives a direct position about compromise.','B agrees and adds the idea of taking turns.','B and D build by turning the principle into a practical choice.','C disagrees through a concrete example instead of attacking anyone.','D explicitly brings the group back to what compromise actually means.'],practice:{topic:'Should friends always compromise when choosing what to watch?',opening:'If one person has chosen the last two films, they should still choose again if they have the best taste.',help:'Enter naturally, respond to the point and add your own view. Use whichever, whatever, either...or, sit through, end up or another useful expression from the unit.',model:'I would disagree with that. Whichever film we choose, everyone should have a fair say, and I would not expect the same person to decide every time.'}},
12:{kp:1,title:'Should popular heritage sites limit visitor numbers?',turns:[
['A','cedar','I think popular heritage sites should limit visitor numbers when large crowds begin to damage the place. Preservation has to come first.'],
['B','marin','I agree, especially at restored sites where narrow paths or old structures cannot handle unlimited footfall.'],
['C','cedar','I understand the concern, but strict limits can make an important historic place less accessible to ordinary visitors.'],
['D','marin','Could timed entry solve that? Visitors could still look around, but the site would not be overcrowded at any one time.'],
['A','cedar','That seems reasonable. It would also make guided walks easier and give people more time to take in the place properly.'],
['B','marin','And if tickets were released in different time slots, families could plan ahead rather than queue for hours.'],
['C','cedar','I would support that more than a simple daily cap. It protects the site without shutting people out.'],
['D','marin','Can we bring the discussion back to the aim? We want the place to remain preserved and accessible, not choose one at the expense of the other.'],
['A','cedar','Then our conclusion is that managed entry is better than uncontrolled crowds or an inflexible ban.']
],focus:['A enters with preservation as the main principle.','B agrees and adds evidence about restored sites.','D builds on C by offering timed entry as a solution.','C challenges strict limits because of accessibility.','D brings the discussion back to balancing preservation and access.'],practice:{topic:'Should popular heritage sites limit visitor numbers?',opening:'Historic places belong to everyone, so visitor numbers should never be restricted.',help:'Respond to the argument rather than the person. Add one solution. Use preserved, restored, accessible, guided walk, take in or another useful expression from the unit.',model:'I agree that historic places should remain accessible, but unlimited crowds can damage what we are trying to preserve. Timed entry would let visitors take in the site without overcrowding it.'}},
15:{kp:0,title:'Should internships be compulsory for college students?',turns:[
['A','cedar','I think every college student should complete at least one internship before graduating, because classroom learning alone does not show what work is actually like.'],
['B','marin','Although I see the benefit, making internships compulsory could be unfair if some students cannot afford unpaid work or difficult travel.'],
['C','cedar','That is important. A college policy should include a reasonable allowance or support where necessary.'],
['D','marin','I would also question whether any internship is automatically useful. Some students are given routine tasks and learn very little.'],
['A','cedar','True. The requirement should be about a meaningful experience, not simply clocking in somewhere for a few weeks.'],
['B','marin','Even if internships remain optional, colleges could help students find good placements and speak up if the role does not match what was promised.'],
['C','cedar','I would prefer that. Students could take on an internship when it fits their course and circumstances.'],
['D','marin','Can we bring this back to the word compulsory? We all seem to support internships, but not necessarily one rigid rule for everybody.'],
['A','cedar','Agreed. Strong support and a clear quality standard may be better than a blanket requirement.']
],focus:['A enters with a clear case for compulsory internships.','B agrees with the value but introduces a fairness concern.','C builds on B by proposing financial or practical support.','D challenges the assumption that every internship is useful.','D brings the group back to the exact word compulsory.'],practice:{topic:'Should internships be compulsory for college students?',opening:'Every internship is useful, so all students should be required to do one.',help:'Respond with a qualified view. Use although, despite, even if, policy, allowance, take on or speak up where it fits.',model:'Although internships can be valuable, I would not make every placement compulsory. A college should first ensure that the role is meaningful and that students can manage the cost and travel.'}},
18:{kp:2,title:'How informal should a college group chat be?',turns:[
['A','cedar','College group chats should be informal. If every message sounds like an official notice, people will stop using the group naturally.'],
['B','marin','Fair enough, but there still has to be a limit. A joke between close friends can come across badly in a large group.'],
['C','cedar','Actually, I think the purpose of the group matters most. A cricket chat can be relaxed, but a class group may need clearer language.'],
['D','marin','I agree with that. “No worries” or “hang on” is fine in casual conversation, but important instructions should not be buried in endless messages.'],
['A','cedar','You know, that is probably the real problem: not informality itself, but people messing around when others need information.'],
['B','marin','Exactly. And if someone says, “Come on, stop spamming the group, will you?”, that can still sound friendly if the relationship allows it.'],
['C','cedar','But tone is easy to misread in text. I would rather keep disagreement polite, especially when many people are involved.'],
['D','marin','Can we bring this back to a practical rule? Be relaxed when the topic is social; be clear and respectful when the message matters.'],
['A','cedar','That works for me. Informal does not have to mean careless.']
],focus:['A enters with a clear view in favour of informality.','B agrees partly, then adds a limit.','C builds by distinguishing different kinds of group chat.','C later disagrees with overly casual disagreement because tone can be misread.','D brings the group back to a simple practical rule.'],practice:{topic:'How informal should a college group chat be?',opening:'It is only a group chat, so people should be able to write anything in any style they like.',help:'React naturally and keep the tone conversational. Use fair enough, actually, hang on, no worries, come on or another expression from the unit where it sounds natural.',model:'Fair enough, it should not sound formal all the time, but I would still keep important messages clear. A casual style is fine; careless communication is not.'}},
21:{kp:1,title:'Are evening courses worth doing after a full day?',turns:[
['A','cedar','I think evening courses are worth doing, even after a long day, because adults often need a practical way to keep learning.'],
['B','marin','I agree, but it takes time to get used to studying again. Someone who used to finish work and relax may struggle at first.'],
['C','cedar','That is true. I joined an evening workshop last year, and I fell behind in the first few weeks because I underestimated the assignments.'],
['D','marin','But you caught up, didn’t you? That shows the difficulty does not mean the course is a bad idea.'],
['C','cedar','Yes, once I got used to the routine, it became much easier. I also remembered to plan my reading before the weekend.'],
['A','marin','Another advantage is meeting people who bring real experience into a seminar. That can make the discussion richer.'],
['B','cedar','I would still say the course has to be realistic. If every evening is occupied, people may not be able to keep at it.'],
['D','marin','Can we bring this back to the question of value? The course seems worthwhile when the schedule is manageable and the learner has a clear reason for doing it.'],
['A','cedar','Agreed. It is not easy, but with the right workload an evening course can be a very practical form of adult learning.']
],focus:['A enters with a positive position and gives a reason.','B agrees but adds the difficulty of returning to study.','D builds on C’s experience by drawing a conclusion from it.','B later challenges unrealistic workloads.','D brings the group back to when an evening course is actually worthwhile.'],practice:{topic:'Are evening courses worth doing after a full day?',opening:'People who work all day should not take evening courses because they will always fall behind.',help:'Agree, disagree or qualify the point and add one reason. Use used to, be used to, catch up, fall behind, keep at or another useful expression from the unit.',model:'I would not say they will always fall behind. It can take time to get used to studying after work, but people can catch up if the workload is realistic and they keep at it.'}},
24:{kp:0,title:'Should college festivals ban single-use plastic?',turns:[
['A','cedar','I am strongly in favour of banning single-use plastic at college festivals. If we had taken the issue seriously earlier, we would now have much less waste after large events.'],
['B','marin','I support the aim, but I am unconvinced that a complete ban is easy to enforce. Vendors may need affordable alternatives first.'],
['C','cedar','That is fair, but colleges can deal with that by setting the rule early and helping vendors plan.'],
['D','marin','I am opposed to a rule that sounds good but collapses on the day of the event. Had organisers tested the alternatives earlier, they might know what actually works.'],
['A','cedar','Agreed. We should be speaking out against unnecessary plastic, but the replacement system has to be practical.'],
['B','marin','And students should be involved. If people understand why the change matters, they are less likely to push vendors to give them disposable items.'],
['C','cedar','I would also stand up for a deposit system for reusable cups. That could bring about a real change in behaviour.'],
['D','marin','Can we bring this back to the decision? I think we support the ban in principle, provided the college gives vendors workable alternatives.'],
['A','cedar','Yes. The group is in favour of the ban, but not of introducing it without preparation.']
],focus:['A enters strongly in favour and links the present problem to an earlier choice.','B agrees with the aim but adds an implementation concern.','C builds on B by suggesting early planning and support.','D challenges a symbolic rule that cannot be enforced.','D brings the group back to a qualified final decision.'],practice:{topic:'Should college festivals ban single-use plastic?',opening:'A plastic ban sounds good, but it will create too many problems for vendors, so colleges should drop the idea.',help:'Take a position, respond to the concern and offer one way to deal with it. Use in favour of, opposed to, unconvinced, if we had, bring about, deal with or another expression from the unit.',model:'I am still in favour of the ban, but I agree that vendors need support. If the college had introduced workable alternatives earlier, the change would now be easier to manage.'}},
27:{kp:1,title:'Should learners aim for British English, American English, or simply clear international English?',turns:[
['A','cedar','I do not think learners need to choose British or American English as if one were correct and the other were wrong. Clear international English matters more.'],
['B','marin','I agree, although consistency helps. If I write “flat” in one sentence and “apartment” in the next, it can look careless.'],
['C','cedar','But people naturally pick up words from films, apps and colleagues. Mixing vocabulary is normal in India.'],
['D','marin','That is true. The important thing is whether the listener understands you and whether your choice fits the situation.'],
['A','cedar','Exactly. An Indian student preparing for the UK may want to pick up words such as “lift”, “queue” and “petrol”, simply because they will hear them often.'],
['B','marin','And someone working with Americans may switch to “elevator”, “line” and “gas” without changing their identity as a speaker.'],
['C','cedar','I would still teach the differences clearly. Otherwise learners may not recognise a familiar idea when it is expressed with another word.'],
['D','marin','Can we bring this back to the goal? Learners should be able to understand the main varieties and choose language that comes across clearly.'],
['A','cedar','Yes. Awareness and flexibility are more useful than trying to sound artificially British or American.']
],focus:['A enters with a clear principle: clarity matters more than choosing one national variety.','B agrees and adds the idea of consistency.','A and B build by giving UK/US examples.','C challenges the idea that mixing is a problem and explains why it happens naturally.','D brings the group back to the learner’s real communication goal.'],practice:{topic:'Should learners aim for British English, American English, or simply clear international English?',opening:'Students should choose either British or American English and never mix the two.',help:'Respond to the claim and give one example. Use flat/apartment, lift/elevator, queue/line, pick up, switch to, come across or another useful expression from the unit.',model:'I would not make that an absolute rule. Learners should know that “flat” and “apartment” mean the same thing and then choose the form that fits the people they are speaking to.'}},
30:{kp:0,title:'Are old sayings and proverbs still useful?',turns:[
['A','cedar','I think old sayings are still useful because they can sum up an idea quickly and make it memorable.'],
['B','marin','I agree, but some sayings are repeated so often that people stop thinking about whether they are actually true.'],
['C','cedar','That is a fair point. “As the saying goes” can introduce an idea neatly, but the proverb should still fit the situation.'],
['D','marin','And some old sayings reflect attitudes that people no longer accept. We should not keep them just because they are familiar.'],
['A','cedar','Absolutely. The value is in what the saying helps us get across, not in its age.'],
['B','marin','Humour matters too. A family saying can help people laugh off a small problem without pretending the problem does not exist.'],
['C','cedar','I also like it when someone explains the point afterwards: “In other words...” That stops the proverb from becoming a substitute for an argument.'],
['D','marin','Can we bring this back to the question? I think sayings remain useful when people choose them carefully and understand the message behind them.'],
['A','cedar','Agreed. The best ones give us a useful takeaway; the weak ones are just repeated out of habit.']
],focus:['A enters with a clear reason for keeping sayings.','B agrees but adds a warning about unthinking repetition.','C builds by explaining how to use a saying and then clarify it.','D disagrees with keeping every traditional saying merely because it is old.','D brings the group back to the condition that makes sayings useful.'],practice:{topic:'Are old sayings and proverbs still useful?',opening:'Proverbs are old-fashioned, so people should stop using them completely.',help:'Respond with a balanced view and one example or reason. Use as the saying goes, in other words, sum up, get across, laugh off or take away where it fits.',model:'I would not get rid of them completely. A good proverb can sum up an idea neatly, but we should still explain what we mean in our own words.'}}
};
const d=D[n];if(!d)return;
const id=`kp${d.kp+1}`;
U.passages=U.passages||{};
U.passages[id]=d.turns;
const k=U.keyPoints?.[d.kp];
if(k){
 k.listen=d.title;
 k.genre='group discussion';
 k.gdFocus={entry:d.focus[0],agreement:d.focus[1],build:d.focus[2],disagreement:d.focus[3],return:d.focus[4],structure:'Use the unit sentence shape and vocabulary only where they fit naturally. Do not force them into every turn.'};
 k.gdPractice=d.practice;
}
if(U.speaking?.s4){
 U.speaking.s4={title:'GD practice: respond and build',prompt:d.practice.topic,help:d.practice.help,opening:d.practice.opening,type:'dialogue',min:1,markers:U.speaking.s4.markers||[],model:d.practice.model,own:'Respond in your own words. React to the previous speaker first, then add one useful point of your own.'};
}
window.ORACY_LEVEL_C_GD_CADENCE=Object.freeze([3,6,9,12,15,18,21,24,27,30]);
})();
