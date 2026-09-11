// Removes grammar terminology from learner-facing Level C questions and audio prompts.
// Internal targets remain unchanged for evaluation and curriculum tracking.
(function(){
'use strict';
const U=window.ORACY_UNIT,S=window.ORACY_C_SPECS?.[U?.localUnitNo];
if(!U||!S||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
function cue(raw){
 const s=String(raw||'').toLowerCase();
 if(s.includes('adverbs of degree'))return 'Show how strong the idea is with words such as fairly, extremely or surprisingly.';
 if(s.includes('plenty of'))return 'Use “plenty of” when there is more than enough.';
 if(s.includes('to-infinitive')&&s.includes('place'))return 'Use “a place to + verb”, for example “a place to relax”.';
 if(s.includes('verb + to-infinitive'))return 'Use “want / plan / decide + to + verb”.';
 if(s.includes('verb + gerund'))return 'Use “enjoy / avoid / keep + -ing”.';
 if(s.includes('let/make'))return 'Use “let / make + person + verb”.';
 if(s.includes('object + to-infinitive'))return 'Use “ask / encourage + person + to + verb”.';
 if(s.includes('preposition'))return 'Use the position or movement word that shows exactly where something is or goes.';
 if(s.includes('phrasal verbs'))return 'Choose the multi-word action that fits the situation, then use it in a full sentence.';
 if(s.includes('first and second conditionals'))return 'For a real future possibility, use “If + present …, … will/can …”. For an imagined situation, use “If + past/were …, … would/could …”.';
 if(s.includes('were/should'))return 'For a formal imagined idea, start “Were I to …” or “Should it happen …”.';
 if(s.includes('wish'))return 'Use “I wish …” when you want the present situation to be different.';
 if(s.includes('should/must'))return 'Use “should” for what you expect and “must” for a strong conclusion.';
 if(s.includes('provided that'))return 'Use “provided that …” when the main idea is true only if that condition is met.';
 if(s.includes('gerund after')||s.includes('without + -ing'))return 'After before, after or without, use the -ing form: “without checking”, “after booking”.';
 if(s.includes('third conditional'))return 'For a past situation that did not happen, use “If … had …, … would/could/might have …”.';
 if(s.includes('would/could/should/might have'))return 'Look back at the past with “would / could / should / might have + past form”.';
 if(s.includes("if it hadn't been for"))return 'Use “If it hadn’t been for …” to show what changed the result.';
 if(s.includes('whatever/'))return 'Use whatever / whichever / whoever / wherever when the exact thing, person or place does not matter.';
 if(s.includes('emphatic'))return 'Use “do / does / did” when you want to correct or strongly emphasise a point.';
 if(s.includes('get passive'))return 'Use “get + past form” for something that happens to someone: “He got caught in the rain.”';
 if(s.includes('either...or'))return 'Use “either … or …” for two choices and “neither … nor …” when both are negative.';
 if(s.includes('few/little'))return 'Use “few” with countable things and “little” with amounts.';
 if(s.includes('have something done')||s.includes('unwanted have'))return 'Use “have + thing + past form” when another person does the job, or something happens to your possession.';
 if(s.includes('would rather'))return 'Use “I’d rather …” to show the choice you prefer.';
 if(s.includes('regret -ing'))return 'Use “regret + -ing” for something you now feel sorry about.';
 if(s.includes('past perfect'))return 'Use “had + past form” for an earlier past action.';
 if(s.includes('if only'))return 'Use “If only …” for a strong wish or regret.';
 if(s.includes('not only'))return 'Link two strong points with “not only … but also …”.';
 if(s.includes('shape, texture')||s.includes('size adjective')||s.includes('multiple adjective'))return 'Describe size, shape, colour or texture in a natural order.';
 if(s.includes('compound adjective'))return 'Join two words when they work as one description: hand-painted, dark-blue, well-worn.';
 if(s.includes('passive'))return 'Put the thing or event first when it matters more than naming who did it.';
 if(s.includes('managed to')||s.includes('was able'))return 'Use “managed to / was able to” when someone succeeded in doing something.';
 if(s.includes('quantified relative'))return 'Add a group detail such as “many of whom …” or “two of which …”.';
 if(s.includes('must have')||s.includes("can't have"))return 'Use “must have” for a strong past conclusion and “can’t have” when you think it did not happen.';
 if(s.includes("needn't have"))return 'Use “needn’t have + past form” when something was done but was unnecessary.';
 if(s.includes('had better'))return 'Use “You’d better + verb” for strong practical advice.';
 if(s.includes('after having'))return 'Use “After having + past form …” when one action was complete before the next.';
 if(s.includes('future continuous'))return 'Use “will be + -ing” for something that will be in progress later.';
 if(s.includes('future perfect continuous'))return 'Use “will have been + -ing” to show how long something will have continued by a future time.';
 if(s.includes('future perfect'))return 'Use “will have + past form” for something completed before a future time.';
 if(s.includes('although/despite'))return 'Show contrast with “although …”, “despite …”, “even though …” or “however …”.';
 if(s.includes('subjunctive'))return 'After “It is essential that …”, use the plain verb: “It is essential that everyone arrive on time.”';
 if(s.includes('plural'))return 'Check whether the word means one or more than one, and use the form people actually say.';
 if(s.includes('quantifier'))return 'Choose the amount word that matches the noun: many / much / a few / few / a little …';
 if(s.includes('a piece of'))return 'Say “a piece of information/advice” when you need to count one item.';
 if(s.includes('vowel'))return 'Choose “a” or “an” by the sound that follows.';
 if(s.includes('imperative'))return 'Give the instruction or request directly and naturally: “Hang on.” “Come on.” “Don’t be late.”';
 if(s.includes('question tag'))return 'Add a short checking ending when you expect agreement: “I’m carrying the tickets, aren’t I?”';
 if(s.includes('frequency'))return 'Place words such as usually, often or most often where they sound natural.';
 if(s.includes('informal spoken'))return 'Use relaxed spoken expressions when the relationship is informal.';
 if(s.includes('large numbers'))return 'Say the number in clear chunks and keep the place values accurate.';
 if(s.includes('fractions'))return 'Say fractions and decimals clearly: “three quarters”, “two point five”.';
 if(s.includes('arithmetic'))return 'Say the calculation in words: multiplied by, divided by, comes to, roughly.';
 if(s.includes('reporting passives'))return 'Use “is said to / is believed to / is reported to” when the report matters more than naming the source.';
 if(s.includes('is/was to'))return 'Use “was to …” for a plan or arrangement expected at that time.';
 if(s.includes('would for past'))return 'Use “would + verb” for a repeated old habit.';
 if(s.includes('used to vs'))return 'Use “used to + verb” for an old habit; use “be used to + -ing/noun” when something feels normal now.';
 if(s.includes('remember to'))return 'Use “remember to + verb” for something you must not forget; use “remember + -ing” for a past memory.';
 if(s.includes('letter-writing'))return 'Match the opening and closing to the person you are writing to and keep the tone clear.';
 if(s.includes('noun/adjective'))return 'Use the person word and the matching quality word accurately: reliable → reliability; patient → patience.';
 if(s.includes('comparatives'))return 'Show the size of the difference: slightly cheaper, far better, considerably faster.';
 if(s.includes('superlatives'))return 'Notice very strong claims such as “best-ever”, “unbeatable” and “by far the fastest”.';
 if(s.includes('mixed conditionals'))return 'Connect a past choice to a present result: “If we had acted earlier, we would have fewer problems now.”';
 if(s.includes('would rather have'))return 'Use “would rather have + past form” for the past choice you now prefer.';
 if(s.includes('should be -ing'))return 'Use “should be + -ing” for what you think ought to be happening now.';
 if(s.includes('had i'))return 'Start “Had I known …, I would have …” for a formal way to imagine a different past.';
 if(s.includes('reported speech'))return 'Report the message in your own sentence instead of repeating every exact word.';
 if(s.includes('reported speech verbs'))return 'Choose the word that shows what the speaker did: admitted, insisted, apologised, refused, threatened …';
 if(s.includes('negative inversion'))return 'For a forceful formal opening, start “Never before …”, “At no time …” or “Under no circumstances …”.';
 if(s.includes('uk/us'))return 'Recognise both versions, then keep one style consistent when you speak or write.';
 if(s.includes('country/nationality'))return 'Keep the country, nationality and person words separate: India → Indian; Britain → British.';
 if(s.includes('future forms'))return 'Choose the future wording by meaning: will / going to / present arrangement / will be + -ing / will have + past form.';
 if(s.includes('future certainty'))return 'Show how sure you are: definitely / probably / possibly / likely / unlikely.';
 if(s.includes('past and perfect'))return 'Make the timeline clear: finished past, earlier past, or experience continuing up to now.';
 if(s.includes('past habits'))return 'Separate an old habit from an experience that still continues.';
 if(s.includes('quotations')||s.includes('proverbs'))return 'Introduce the saying naturally, then explain the point in your own words.';
 if(s.includes("one/one's"))return 'Use “one / one’s / oneself” when speaking generally about a person.';
 return 'Use the sentence shape shown in the lesson and say one clear, complete idea.';
}

U.keyPoints.forEach((kp,i)=>{kp.kind='Useful language';});
if(Number(U.localUnitNo)!==6){
 const ids=[1,2,3,4,6,7,8,9,11,12,13,14];
 U.checks=ids.map((id,x)=>{const kp=Math.floor(x/4),st=S.structures[Math.min(kp,S.structures.length-1)]||'',c=cue(st);return {id:'q'+id,label:'Quick meaning check',prompt:`Which plan would help you speak clearly about ${S.contexts[kp]}?`,options:[c,'Say only one vocabulary word and stop.','Name the language rule instead of answering the situation.'],answer:'a',audio:false}});
 U.notes={};ids.forEach((id,x)=>{const kp=Math.floor(x/4);U.notes['q'+id]=`Choose the answer that helps you say a real sentence about ${S.contexts[kp]}.`});
}
U.pron={
 q11:`Say one clear sentence about ${S.contexts[0]}. ${cue(S.structures[0])}`,
 q12:`Say one natural reply about ${S.contexts[1]}. ${cue(S.structures[Math.min(1,S.structures.length-1)])}`,
 q13:`Use “${S.vocab?.[1]?.[0]||S.vocab?.[0]?.[0]||''}” in one natural sentence.`,
 q14:'Say one short answer first, then add one useful detail.',
 q15:'Say the idea again in a fresh situation without naming any rule.'
};
if(U.conversation){U.conversation.model=`Talk naturally about ${S.theme}. Answer the other person, add one useful detail and reuse the lesson language only where it fits.`;U.conversation.nextStep='Use the same sentence shape again in a different situation.'}
})();
