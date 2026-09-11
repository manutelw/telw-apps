// C1A Unit 6: learner-facing pattern explanations and concrete speaking jobs. No grammar jargon in reps.
(function(){
'use strict';
const U=window.ORACY_UNIT;
if(!U||Number(U.localUnitNo)!==6)return;

const kp=U.keyPoints||[];
if(kp[0]){
  kp[0].heading='Real possibility or imagined situation?';
  kp[0].model='Choose the pattern that matches what you mean: a real future possibility, or an imagined/unlikely situation.';
  kp[0].teaching={
    meaning:[
      'Use if + present simple + will/can when you are talking about a real or quite possible future situation.',
      'Use if + past form / were + would/could when you are imagining a different situation, exploring an unlikely idea, or asking “what would happen if things were different?”',
      'The form shows how real the situation feels to you. That is why the two patterns are not interchangeable.'
    ],
    form:[
      'Real or likely: If + present simple, ... will/can + base verb. Example: “If the city tests the plan next Sunday, we will see how traffic changes.”',
      'Imagined or unlikely: If + past form / were, ... would/could + base verb. Example: “If the city were car-free every Sunday, families could walk around more safely.”',
      'You can also use should in the result when you are giving an expectation: “If the roads were closed to cars, the market should be quieter.”'
    ],
    contrast:[
      '“If the city introduces the plan, it will reduce traffic.” = I see the plan as a real future possibility.',
      '“If the city were car-free every Sunday, it would reduce traffic.” = I am imagining the situation and its result.',
      'Do not use if + present simple + will/can when the whole point is to imagine a different or unlikely situation. It makes the idea sound more real and immediate than you intend.'
    ],
    errors:[
      'Do not say “If the city would be car-free...” Use “If the city were car-free...”',
      'Keep the two parts clear: imagined situation first, result second.',
      'Choose would for a likely result in the imagined situation, could for possibility/ability, and should for an expected result.'
    ]
  };
}
if(kp[1]){
  kp[1].heading='Set a condition, imagine a different choice, or talk about a wish';
  kp[1].model='Use the exact opening that matches your meaning: provided that..., were I to..., should it happen..., I wish...';
  kp[1].teaching={
    meaning:[
      'Use “provided that” or “on condition that” when something is acceptable only if one condition is met.',
      'Use “Were I to...” when you want to imagine what you would do in a possible but not certain situation.',
      'Use “Should it happen...” for a formal way of saying “if it happens”. Use “I wish...” when reality is different from what you want.'
    ],
    form:[
      'Condition: “I would support the plan provided that buses remained frequent.”',
      'Imagined choice: “Were I to choose, I would test the plan for one month.”',
      'Possible event: “Should it happen, the council will need a clear backup plan.”',
      'Wish now: “I wish the buses were more frequent.” / “I wish we could cycle safely here.”'
    ],
    contrast:[
      '“I wish the buses were more frequent” talks about a present situation you want to be different. It does not predict the future.',
      '“If the buses become more frequent, more people will use them” talks about a real future possibility.',
      'So “I wish...” and “if + present...will...” do different jobs and should not replace each other.'
    ],
    errors:[
      'After “I wish” for a present situation, use a past form: “I wish the road were quieter.”',
      'After “provided that”, state the condition clearly; do not add an unnecessary “if”.',
      'Use “Were I to...” for an imagined choice, not for an ordinary plan that is already decided.'
    ]
  };
}
if(kp[2]){
  kp[2].heading='Show what you expect or strongly believe from the evidence';
  kp[2].model='Use should for an expected result and must for a strong conclusion from the facts you can see.';
  kp[2].teaching={
    meaning:[
      'Use should when something is expected or probably true: “The road should be quieter on Sunday.”',
      'Use must when the evidence makes you strongly believe something is true: “This must be the correct entrance; the sign matches the map.”',
      'These forms are useful when you are making a reasoned assumption, not stating a confirmed fact.'
    ],
    form:[
      'Expected result: subject + should + base verb / be. Example: “The trial should reduce noise.”',
      'Strong conclusion: subject + must + base verb / be. Example: “This must be the right route.”',
      'You can combine an imagined condition with an expectation: “If the road were closed to cars, the market should be quieter.”'
    ],
    contrast:[
      '“If the city closes the road, traffic will fall.” = a real future condition and its predicted result.',
      '“If the road were closed to cars, the market should be quieter.” = an imagined situation plus an expected result inside that imagined situation.',
      'Use the second pattern when you are exploring an idea rather than reporting a plan that is likely to happen.'
    ],
    errors:[
      'Do not use must when you only mean “maybe”. Must shows a strong conclusion.',
      'Do not use should here to mean obligation unless the sentence is actually giving advice.',
      'Make the evidence or reason clear so the assumption sounds logical.'
    ]
  };
}

const p=U.practice||[];
if(p[0])p[0].reps=[
  {type:'qa',prompt:'What would change if the city centre had no cars every Sunday?',hint:'Start with “If the city centre were car-free every Sunday, ... would/could ...” Use the word “feasible”.'},
  {type:'sr',prompt:'Some shopkeepers worry that a car-free Sunday would hurt business.',hint:'Respond with “If ... were ..., ... would/could ...” Use “unrealistic” or explain why the worry is realistic.'},
  {type:'qa',prompt:'What would make the plan worth trying for one month?',hint:'Start with “It would be worthwhile if ...” Add one practical condition.'},
  {type:'sr',prompt:'A neighbour says the plan will definitely solve every traffic problem.',hint:'React naturally. Use “controversial” and explain one reason the claim is too strong.'},
  {type:'qa',prompt:'Give your final view on the car-free Sunday idea.',hint:'Speak for about 20 seconds. Use “If ... were ..., ... would/could ...” and the word “sustainable”.'}
];
if(p[1])p[1].reps=[
  {type:'qa',prompt:'When would you support a four-day college week?',hint:'Start with “I would support it provided that ...” Add one clear condition.'},
  {type:'sr',prompt:'A friend says the college should change the timetable immediately without a trial.',hint:'Respond with “I would agree on condition that ...” Give the condition.'},
  {type:'qa',prompt:'Imagine you were choosing the timetable. What would you do?',hint:'Start with “Were I to choose, I would ...” Give one practical step.'},
  {type:'sr',prompt:'The college may announce the change suddenly next week.',hint:'Start with “Should it happen, ...” Say what students would need to do.'},
  {type:'qa',prompt:'What is one thing about the present timetable that you want to be different?',hint:'Start with “I wish ... were/could ...” Give one clear wish.'}
];
if(p[2])p[2].reps=[
  {type:'qa',prompt:'What do you expect would happen if every flat followed the water-saving rules?',hint:'Start with “If every flat followed the rules, water use should ...” Add one reason.'},
  {type:'sr',prompt:'The tank level has fallen quickly for three days and there has been no rain.',hint:'Make a strong conclusion with “must”. Example opening: “There must be ...” Then explain why.'},
  {type:'qa',prompt:'Which idea should the residents reject first?',hint:'Use “rule out” and give one reason based on evidence.'},
  {type:'sr',prompt:'A resident proposes strict fines before anyone has received a warning.',hint:'React first. Use “push back on” and explain why the idea needs more thought.'},
  {type:'qa',prompt:'Give your final recommendation for the water-saving plan.',hint:'Speak for about 20 seconds. Use one “should” expectation and either “back up” or “think through”.'}
];
})();
