window.ORACY_UNIT={
  unitNo:3,level:'B1A',title:'Will It Rain on Our Picnic?',
  targets:['forecast','clear up','likely','perhaps','definitely','I hope so','I hope not','if','will','might','probably','I’ll','we’ll','won’t'],
  feedbackGuidance:{
    range:'Bring one Unit 3 weather phrase into your next answer.',
    accuracy:'Keep the future pattern clean: If + present, will + base verb. Use might or probably when you are less certain.',
    fluency:'Say the weather first, pause briefly, then explain the plan.',
    coherence:'Give the forecast, the possible result, and the decision in that order.'
  },
  passages:{
    kp1:[['','marin','Good morning. Here is the forecast for Saturday. The day will begin cloudy, with a light shower likely before nine. After that, the sky should clear up. Temperatures will reach twenty-four degrees by lunchtime. Perhaps there will be another short shower near the hills, but the town park will probably stay dry. The wind will be gentle, so it should feel pleasant outdoors. If you are planning a picnic, take a small umbrella just in case. The afternoon will definitely be warmer than the morning. Will the sunshine last until evening? I hope so, but keep an eye on the clouds after five.']],
    kp2:[
      ['Maya','marin','Have you checked the forecast for Saturday?'],['Kabir','cedar','Yes. It might rain early in the morning.'],['Maya','marin','Oh no. Do you think it will clear up?'],['Kabir','cedar','Probably. The forecast says the sun will appear by eleven.'],['Maya','marin','I hope so. We need dry grass for the picnic.'],['Kabir','cedar','If the park is wet, we’ll use the covered area.'],['Maya','marin','Good idea. Should we ask everyone to bring an umbrella?'],['Kabir','cedar','Perhaps. By the way, could you bring the picnic mat?'],['Maya','marin','Certainly. If it is still raining, I’ll bring two mats.'],['Kabir','cedar','Great. I’ll pack the food in waterproof boxes.'],['Maya','marin','What will we do if the wind gets strong?'],['Kabir','cedar','We’ll move behind the café wall so that the plates stay safe.'],['Maya','marin','And if there is a storm, we won’t go to the park.'],['Kabir','cedar','Definitely not. We’ll have lunch at my flat instead.'],['Maya','marin','Perfect. Rain or sunshine, the picnic is still happening!']
    ],
    kp3:[['','marin','Attention, picnic group. We’ll meet at the east gate at eleven o’clock. I’ll bring the food, and Maya’ll bring the picnic mats. If the morning rain clears up, we’ll sit near the lake. If it doesn’t, we’ll use the covered garden beside the café. We won’t cancel unless there is a storm. Please listen to the short forms: I’ll, we’ll and won’t. They keep the announcement smooth and natural. Don’t stretch every word. Join the pronoun and will, but keep won’t clear because it changes the meaning. We’ll send one final weather message at ten. I hope we’ll see you there.']]
  },
  notes:{
    q1:'A forecast tells us what the weather is expected to be. Try: “The forecast says it will be sunny.” Now change the weather.',
    q2:'“Clear up” means become brighter or stop raining. Try: “The rain will clear up after lunch.” Now change the time.',
    q3:'“Likely” means expected or probable. Try: “A shower is likely this morning.” Now make a new forecast.',
    q4:'Use “definitely” when you feel very certain. “Perhaps” shows less certainty. Try one sentence with each.',
    q6:'In a first conditional, use present simple after if and will in the result: “If it rains, we’ll move.”',
    q7:'Use might for a real possibility: “It might rain.” Now name a different possible change.',
    q8:'Probably shows that something is likely but not certain. Try: “It will probably clear up.”',
    q9:'Use won’t for will not: “We won’t cancel.” Now say one thing you will not do.',
    q11:'You heard “I’ll”. The words I and will join into one short beat.',
    q12:'You heard “we’ll”. Keep it short and smooth: one beat, not two separate words.',
    q13:'You heard “won’t”. Keep the vowel and final sound clear because won’t changes the meaning.',
    q14:'The sentence was “We’ll wait, but we won’t cancel.” Hear the contrast between we’ll and won’t.'
  },
  oral:{
    q5:{question:'What should picnic groups take, and why?',expected:'Picnic groups should take a small umbrella because a shower is possible.',key:'A strong answer mentions a small umbrella and explains that rain or a shower is possible.'},
    q10:{question:'What are Maya and Kabir’s two backup plans if the weather is bad?',expected:'If the park is wet, they will use the covered area. If there is a storm, they will have lunch at Kabir’s flat.',key:'A strong answer includes the covered area for wet weather and Kabir’s flat if there is a storm.'}
  },
  pron:{q11:'I’ll',q12:'we’ll',q13:'won’t',q14:'We’ll wait, but we won’t cancel.',q15:'I’ll check the forecast, and we’ll decide at ten.'},
  conversation:{
    maxLearnerTurns:4,
    model:'The forecast says it might rain. If it clears up, we’ll have the picnic in the park. If it keeps raining, we’ll use the covered garden.',
    nextStep:'Use that model, then change the forecast and the backup plan.'
  },
  speaking:{
    s1:{type:'controlled',min:0,markers:[],prompt:'Repeat “It will probably clear up after lunch.” Then change the weather or time.',model:'It will probably clear up after lunch. It will probably get warmer after three.',own:'Now keep probably and change one forecast detail.'},
    s2:{type:'forecast',min:0,markers:[],prompt:'Give one short forecast using likely, perhaps, probably or definitely.',model:'A light shower is likely this morning, but it will probably clear up by noon.',own:'Now give a forecast for a day you know.'},
    s3:{type:'personal',min:1,markers:['so that','by the way'],prompt:'Explain one personal outdoor plan and what you will do if the weather changes. Use an if sentence.',model:'I’m going for a walk on Sunday. If it rains, I’ll take an umbrella so that I can keep walking.',own:'Now change the activity, weather and backup plan.'},
    s4:{type:'dialogue',min:1,markers:['i hope so','i hope not','by the way','perhaps','definitely'],prompt:'You and the coach must decide whether to hold a picnic outdoors. Discuss the forecast, choose a plan and agree on one backup plan.',model:'It might rain, but I hope not. If it clears up, we’ll use the park. By the way, perhaps we should keep the covered garden as our backup.',own:'Now discuss a different forecast and make the decision with the coach.'},
    s5:{type:'forecast',min:1,markers:['perhaps','probably','definitely','i hope so','by the way'],prompt:'Give a 45-second weather forecast and plan. Say what the weather will probably do, what people should prepare, and what will happen if conditions change.',model:'Tomorrow will begin cloudy, and a shower is likely before nine. It will probably clear up by lunchtime. If you go out early, take an umbrella. By the way, the afternoon will definitely be warmer. If the rain returns, the picnic group will use the covered garden.',own:'Now make a forecast for another day and include one if sentence.'}
  }
};
