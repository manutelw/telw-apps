// Level C learner-facing language layer. Internal curriculum labels stay available for scoring/admin use,
// but learners see sentence shapes and communicative jobs instead of grammar terminology.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)<2||Number(U.localUnitNo)>30)return;
const S=window.ORACY_C_SPECS?.[U.localUnitNo];
if(!S)return;

function shape(raw){
  const s=String(raw||'').toLowerCase();
  if(s.includes('adverbs of degree')) return "Show how strong the idea is: fairly / very / extremely / surprisingly + adjective.";
  if(s.includes('plenty of')) return "Say there is more than enough: ‘There is plenty of …’.";
  if(s.includes('place + to-infinitive')) return "Describe a place with ‘a place to + verb’: ‘It’s a good place to relax.’";
  if(s.includes('verb + to-infinitive')) return "Use ‘want / plan / decide + to + verb’: ‘I decided to join.’";
  if(s.includes('verb + gerund')) return "Use ‘enjoy / avoid / keep + -ing’: ‘I enjoy cycling.’";
  if(s.includes('let/make')) return "Use ‘let / make + person + verb’: ‘They let me try.’ / ‘It made me think.’";
  if(s.includes('object + to-infinitive')) return "Use ‘ask / encourage + person + to + verb’: ‘She encouraged me to continue.’";
  if(s.includes('prepositions of position')||s.includes('compound prepositions')) return "Show exactly where something is: beside / opposite / beneath / alongside / in front of …";
  if(s.includes('home and interior')) return "Name the part of the home or the way the space is arranged, then add one clear detail.";
  if(s.includes('phrasal verbs')&&s.includes('food')) return "Use the cooking action exactly: chop up / stir in / heat up / serve up …";
  if(s.includes('food, ingredients')||s.includes('sequencing a recipe')) return "Give the steps in order: first … then … after that … finally …";
  if(s.includes('first and second conditionals')) return "Choose the meaning first. For a real future possibility: ‘If + present …, … will/can …’. For an imagined or less-real situation: ‘If + past/were …, … would/could …’.";
  if(s.includes('inverted were/should')) return "For a more formal imagined idea, start ‘Were I to …’ or ‘Should it happen …’.";
  if(s==='wish'||s.includes('wish')) return "Use ‘I wish …’ when you want the present situation to be different: ‘I wish the buses were more frequent.’";
  if(s.includes('should/must for assumptions')) return "Use ‘should’ for what you expect and ‘must’ for a strong conclusion: ‘The road should be quieter.’ / ‘This must be the entrance.’";
  if(s.includes('provided that')) return "Add a condition with ‘provided that …’ or ‘on condition that …’: the plan works only if that condition is met.";
  if(s.includes('gerund after prepositions')||s.includes('without + -ing')) return "After words such as before / after / without, use the -ing form: ‘without checking’, ‘after booking’.";
  if(s.includes('travel booking')||s.includes('rail travel')) return "Use the exact travel word that fits the situation, then make one complete sentence with it.";
  if(s.includes('third conditional')) return "Talk about a past situation that did not happen: ‘If … had …, … would/could/might have …’.";
  if(s.includes('would/could/should/might have')) return "Look back at the past with ‘would / could / should / might have + past form’.";
  if(s.includes("if it hadn't been for")) return "Use ‘If it hadn’t been for …’ to show the person or event that changed the result.";
  if(s.includes('whatever/whichever')||s.includes('whatever')) return "Use whatever / whichever / whoever / wherever when the exact thing, person or place does not matter.";
  if(s.includes('emphatic do/be')) return "Add stress with ‘do / does / did’ when you want to correct or emphasise: ‘I do like it.’";
  if(s.includes('get passive')) return "Use ‘get + past form’ for events that happen to someone: ‘He got caught in the rain.’";
  if(s.includes('either...or')||s.includes('neither...nor')) return "Use ‘either … or …’ for two choices; use ‘neither … nor …’ when both are negative.";
  if(s.includes('few/little')) return "Use ‘few’ with things you can count and ‘little’ with amounts you do not count one by one.";
  if(s.includes('by myself')) return "Use ‘by myself’ when you mean alone, without another person helping or joining you.";
  if(s.includes('have something done')||s.includes('unwanted have-something-done')) return "Use ‘have + thing + past form’ when another person does the job for you, or when something happens to your possession: ‘I had my glasses repaired.’";
  if(s.includes('would rather')) return "Use ‘I’d rather …’ to show preference: ‘I’d rather wait.’ / ‘I’d rather have checked first.’";
  if(s.includes('regret -ing')) return "Use ‘regret + -ing’ for something you now feel sorry about: ‘I regret buying it.’";
  if(s.includes('past perfect')) return "For an earlier past action, use ‘had + past form’: ‘I wish I had checked first.’";
  if(s.includes('if only')) return "Use ‘If only …’ for a strong wish or regret: ‘If only I had known.’";
  if(s.includes('not only...but also')) return "Link two strong points with ‘not only … but also …’.";
  if(s.includes('shape, texture')||s.includes('size adjectives')||s.includes('multiple adjective order')) return "Describe what the object looks and feels like. Put the description in a natural order: size → shape → colour → material → noun.";
  if(s.includes('compound adjectives')) return "Join two words when they work together as one description: ‘hand-painted’, ‘dark-blue’, ‘well-worn’.";
  if(s.includes('passive review')) return "Focus on the thing or place, not the doer: ‘The stepwell was restored in 2019.’";
  if(s.includes('could/managed')||s.includes('was able')) return "For a successful past action, use ‘managed to / was able to’. Use ‘could’ for a general past ability.";
  if(s.includes('quantified relative')) return "Add a part-of-the-group detail: ‘many of whom …’, ‘two of which …’.";
  if(s.includes("must have/can't have")) return "Make a strong guess about the past: ‘must have’ when you think it happened; ‘can’t have’ when you think it did not.";
  if(s.includes("needn't have")) return "Use ‘needn’t have + past form’ when someone did something but it was unnecessary.";
  if(s.includes('had better')) return "Use ‘had better + verb’ for strong practical advice: ‘You’d better check the form.’";
  if(s.includes('intend/plan')) return "State the plan directly: ‘I intend to …’ / ‘I plan to …’.";
  if(s.includes('after having')) return "Show one completed action before another: ‘After having checked the form, …’.";
  if(s.includes('future continuous')) return "Talk about something that will be in progress later: ‘This time tomorrow, we’ll be travelling.’";
  if(s.includes('future perfect simple')) return "Talk about something completed before a future time: ‘By Friday, we’ll have finished.’";
  if(s.includes('future perfect continuous')) return "Show how long something will have continued by a future time: ‘By June, I’ll have been working here for a year.’";
  if(s.includes('although/despite')||s.includes('although')) return "Show contrast: ‘Although …, …’ or ‘Despite + noun/-ing, …’. Use ‘however’ to start a contrasting sentence.";
  if(s.includes('subjunctive')) return "After phrases such as ‘It is essential that …’, use the plain verb: ‘It is essential that everyone arrive on time.’";
  if(s.includes('employment vocabulary')) return "Use the exact work word that fits the situation, then explain what it means in that context.";
  if(s.includes('phrasal verbs with put/keep/go')) return "Choose the right put / keep / go expression for the action: put up, keep away, go ahead, and so on.";
  if(s.includes('festival and tradition')||s.includes('safety precautions')) return "Use the exact festival or safety word, then say what people should do and why.";
  if(s.includes('plural review')||s.includes('irregular plurals')) return "Check whether the word means one or more than one, and use the form people actually say: data, criteria, media, and so on.";
  if(s.includes('contrasting quantifiers')) return "Choose the amount word that matches the noun and the meaning: many / much / a few / few / a little …";
  if(s.includes('a piece of')) return "For information or advice, say ‘a piece of information/advice’, not ‘an information/advice’.";
  if(s.includes('vowel sounds')) return "Choose ‘a’ or ‘an’ by the sound that follows, not just the written first letter.";
  if(s.includes('extended imperatives')) return "Give a short instruction or request naturally: ‘Hang on.’ ‘Come on.’ ‘Don’t be late.’";
  if(s.includes('question tags')) return "Add a short tag when checking agreement: ‘I’m carrying the tickets, aren’t I?’";
  if(s.includes('adverbs of frequency')) return "Place frequency words where they sound natural: ‘I’m usually early.’ / ‘I most often travel by Metro.’";
  if(s.includes('informal spoken register')) return "Use relaxed spoken expressions when the relationship is informal: ‘Hang on’, ‘No worries’, ‘Fair enough’.";
  if(s.includes('large numbers')) return "Say the number in clear chunks and keep the place values accurate.";
  if(s.includes('fractions and decimals')) return "Say fractions and decimals clearly: ‘three quarters’, ‘two point five’.";
  if(s.includes('arithmetic language')) return "Say the calculation in words: ‘multiplied by’, ‘divided by’, ‘comes to’, ‘roughly’.";
  if(s.includes('reporting passives')) return "When the source is uncertain or less important, say ‘is said to …’, ‘is believed to …’, ‘is reported to …’.";
  if(s.includes('is/was to')) return "Use ‘was to …’ for a plan or arrangement expected at that time: ‘The bridge was to reopen in May.’";
  if(s.includes('would for past habits')) return "For a repeated old habit, say ‘would + verb’: ‘We would walk home together.’";
  if(s.includes('used to vs be used')) return "Use ‘used to + verb’ for an old habit; use ‘be used to + -ing/noun’ when something feels normal now.";
  if(s.includes('remember to vs remember -ing')) return "Use ‘remember to + verb’ for something you must not forget; use ‘remember + -ing’ for a memory of the past.";
  if(s.includes('letter-writing conventions')) return "Match the opening and closing to the person you are writing to, and keep the tone warm and clear.";
  if(s.includes('personality noun/adjective')) return "Choose the describing word for a person and the matching quality word: reliable → reliability, patient → patience.";
  if(s.includes('comparatives with degree')) return "Make the comparison stronger or softer: ‘far better’, ‘slightly cheaper’, ‘considerably faster’.";
  if(s.includes('advertising superlatives')) return "Notice very strong advertising claims such as ‘best-ever’, ‘unbeatable’, ‘by far the fastest’. Ask what evidence supports them.";
  if(s.includes('advertising idioms')) return "Use the advertising expression only when its meaning fits: stand out, live up to, catch on, draw in …";
  if(s.includes('mixed conditionals')) return "Connect a past choice to a present result: ‘If we had acted earlier, we would have fewer problems now.’";
  if(s.includes('would rather have')) return "Use ‘would rather have + past form’ for the past choice you now prefer: ‘I’d rather have waited.’";
  if(s.includes('should be -ing')) return "Use ‘should be + -ing’ for what you think ought to be happening now: ‘They should be checking the data.’";
  if(s.includes('had i')) return "For a formal past ‘if’ idea, start ‘Had I known …, I would have …’.";
  if(s.includes('strong opinion')) return "State your position clearly: ‘I’m in favour of …’, ‘I object to …’, ‘I’m not convinced …’.";
  if(s.includes('spoken reported speech')) return "Report the message, not every exact word: ‘She said …’, ‘He told us …’, ‘They explained that …’.";
  if(s.includes('reported speech verbs')) return "Choose the reporting verb that shows the speaker’s action: admitted, insisted, apologised, refused, threatened …";
  if(s.includes('negative inversion')) return "For a forceful formal opening, start with ‘Never before …’, ‘At no time …’, ‘Under no circumstances …’ and put the helping verb before the person/thing: ‘Never before have we seen …’.";
  if(s.includes('political and civic')) return "Use the exact civic word—policy, taxation, public spending, constituency—and explain the issue, not just the word.";
  if(s.includes('uk/us lexical')||s.includes('spelling variants')) return "Notice which version you are using: flat/apartment, lift/elevator, colour/color. Keep one style consistent in the same piece of English.";
  if(s.includes('country/nationality')) return "Keep country, nationality and person words separate: India → Indian; Britain → British; a citizen is a person who legally belongs to a country.";
  if(s.includes('contrast of future forms')) return "Choose the future shape by meaning: decision/prediction with ‘will’; plan with ‘going to’; fixed arrangement with the present continuous; later progress with ‘will be + -ing’; completed by a time with ‘will have + past form’.";
  if(s.includes('future certainty')) return "Show how sure you are: definitely / probably / possibly / likely / unlikely.";
  if(s.includes('relationships between future')) return "Show which future event happens first: ‘When we arrive, the ship will already have left.’";
  if(s.includes('contrast of past and perfect')) return "Choose the time clearly: finished past event, earlier past event, or experience continuing up to now.";
  if(s.includes('past habits and ongoing')) return "Separate an old habit from an experience that still continues: ‘I used to …’ versus ‘I have been …’.";
  if(s.includes('introducing quotations')||s.includes('proverbs')) return "Introduce the saying naturally: ‘As the saying goes …’, ‘As someone once said …’, then explain the point in your own words.";
  if(s.includes("one/one's/oneself")) return "Use ‘one / one’s / oneself’ when speaking generally about a person: ‘One should check one’s facts.’";
  return "Say one clear sentence that fits the situation. Use the words in the hint naturally rather than naming a grammar rule.";
}

function whenUseful(raw){
  const s=String(raw||'').toLowerCase();
  if(s.includes('condition')||s.includes('if ')||s.includes('conditional')) return 'Use this when one situation depends on another, or when you are imagining what could happen.';
  if(s.includes('future')) return 'Use this when the timing or certainty of a future event matters.';
  if(s.includes('past')||s.includes('regret')||s.includes('remember')) return 'Use this when the listener needs to know what happened before, what used to happen, or how you now view the past.';
  if(s.includes('passive')||s.includes('reported')) return 'Use this when the event or message matters more than naming the person who did or said it.';
  if(s.includes('comparison')||s.includes('comparative')||s.includes('superlative')) return 'Use this when you are comparing two or more choices and need to show the size of the difference.';
  return 'Use this shape when it helps the listener understand your meaning more quickly.';
}

for(let i=0;i<U.keyPoints.length;i++){
  const st=S.structures[Math.min(i,S.structures.length-1)]||'';
  const cue=shape(st);
  const kp=U.keyPoints[i];
  kp.heading=i===0?'Say the idea clearly':i===1?'Use it in conversation':'Use it under pressure';
  kp.model=cue;
  kp.chips=[...(S.vocab?.[i]||[])];
  kp.teaching={
    meaning:[whenUseful(st),cue,'Focus on the meaning you want to communicate first.'],
    form:[`Try this shape: ${cue}`,'Say one short sentence first. Add the detail after it.','Use natural contractions when they sound normal in conversation.'],
    contrast:['Choose the sentence shape because it matches the situation, not because it appears in this unit.','If a simpler sentence says the meaning better, use the simpler sentence.'],
    errors:['Do not name the rule in your answer. Say the actual sentence.','Do not force a long sentence when two short ones are clearer.','Keep the time and meaning consistent from the first part of the sentence to the second.']
  };
}

for(let kp=0;kp<U.practice.length;kp++){
  const st=S.structures[Math.min(kp,S.structures.length-1)]||'';
  const cue=shape(st),v=S.vocab[kp]||[];
  U.practice[kp].reps=[
    {type:'qa',prompt:`Talk about ${S.contexts[kp]}.`,hint:`Start with this shape: ${cue} Use “${v[0]||''}”.`},
    {type:'sr',prompt:`Someone gives a different view about ${S.theme}.`,hint:`React naturally first. Then use this shape: ${cue} Add “${v[1]||''}”.`},
    {type:'qa',prompt:`Give one reason or example about ${S.contexts[kp]}.`,hint:`Use “${v[2]||''}” in a complete sentence.`},
    {type:'sr',prompt:`A friend is not convinced by your first answer.`,hint:`Say the idea again in a clearer way. Use this shape: ${cue}`},
    {type:'qa',prompt:`Give your final view in about 20 seconds.`,hint:`Use “${v[3]||''}” and one useful sentence shape from this unit.`}
  ];
}

// Unit 6 already has richer unit-specific teaching/reps loaded after the generic builder.
// Keep those richer details but remove any accidental learner-facing labels if they remain.
if(Number(U.localUnitNo)===6 && window.ORACY_C_UNIT6_FRIENDLY){window.ORACY_C_UNIT6_FRIENDLY();}

if(U.oral?.q5){U.oral.q5.question=`Talk for 20–30 seconds about ${S.contexts[0]}. ${shape(S.structures[0])} Use one of these words: ${(S.vocab[0]||[]).slice(0,3).join(', ')}.`;U.oral.q5.key='Say the idea directly. Use the sentence shape in the prompt and one useful word.'}
if(U.oral?.q10){U.oral.q10.question=`Respond to this situation: ${S.contexts[1]}. ${shape(S.structures[Math.min(1,S.structures.length-1)])} Give one concrete detail.`;U.oral.q10.key='Answer the situation directly, then add one concrete detail.'}

U.aim=`Speak clearly about ${S.theme}. Listen, notice useful sentence shapes and words, then reuse them several times in new situations.`;
})();
