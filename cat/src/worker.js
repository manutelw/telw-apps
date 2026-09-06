const FALLBACK = {
  VARC: [
    {type:"MCQ",difficulty:"easy",topic:"summary",passage:"Many firms use employee output as the main measure of productivity. Yet output alone may overlook collaboration, mentoring and learning. A workplace can therefore produce more in the short term while weakening capabilities that matter later.",prompt:"Which option best captures the central idea?",options:["Output is the only useful measure of productivity.","Higher short-term output may hide losses in other important workplace capabilities.","Mentoring always reduces productivity.","Firms should stop measuring productivity."],answer:1},
    {type:"MCQ",difficulty:"moderate",topic:"inference",passage:"A city raised parking fees in its central district to reduce congestion. Six months later, central traffic fell, but nearby residential streets reported more parked cars and slower local traffic.",prompt:"Which conclusion is best supported?",options:["The policy had no effect.","Parking fees always create congestion elsewhere.","The policy changed behaviour but also produced a spillover effect.","Residential parking should be banned."],answer:2},
    {type:"MCQ",difficulty:"difficult",topic:"critical reasoning",prompt:"Students who voluntarily attend extra tutorials score higher in exams. A researcher concludes that compulsory tutorials will raise the scores of all students. Which option most weakens the conclusion?",options:["Tutorials are held after class.","Some students dislike tutorials.","Voluntary attendees may already be more motivated than non-attendees.","Scores vary by subject."],answer:2},
  ],
  DILR: [
    {type:"MCQ",difficulty:"easy",topic:"ordering",passage:"Four managers A, B, C and D present from Monday to Thursday, once each. A is before C. B is not on Monday. D is immediately after B. C is not on Thursday.",prompt:"Who must present on Monday?",options:["A","B","C","D"],answer:0},
    {type:"MCQ",difficulty:"moderate",topic:"ordering",passage:"Four managers A, B, C and D present from Monday to Thursday, once each. A is before C. B is not on Monday. D is immediately after B. C is not on Thursday.",prompt:"On which day must D present?",options:["Monday","Tuesday","Wednesday","Thursday"],answer:3},
    {type:"TITA",difficulty:"difficult",topic:"logic",prompt:"Five tasks take 2, 3, 4, 5 and 6 minutes respectively. If exactly two tasks are selected and their total time must be 9 minutes, how many distinct pairs are possible?",answer:"2"},
  ],
  QA: [
    {type:"MCQ",difficulty:"easy",topic:"percentages",prompt:"An item is marked 25% above cost price and sold at a 10% discount on marked price. What is the profit percentage?",options:["10%","12.5%","15%","17.5%"],answer:1},
    {type:"MCQ",difficulty:"moderate",topic:"algebra",prompt:"If x + 1/x = 3, what is x³ + 1/x³?",options:["15","18","21","24"],answer:1},
    {type:"TITA",difficulty:"difficult",topic:"time-work",prompt:"A and B together finish a job in 12 days, B and C in 15 days, and C and A in 20 days. In how many days do A, B and C together finish it?",answer:"10"},
  ]
};

const BLUEPRINT = {
  VARC: {name:"VARC", durationSec:2400, targetCount:24, mix:{easy:6,moderate:12,difficult:6}},
  DILR: {name:"DILR", durationSec:2400, targetCount:22, mix:{easy:5,moderate:11,difficult:6}},
  QA: {name:"Quantitative Ability", durationSec:2400, targetCount:22, mix:{easy:6,moderate:10,difficult:6}}
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/new-attempt" && request.method === "POST") {
      const seed = crypto.randomUUID();
      const sections = [];
      for (const key of ["VARC","DILR","QA"]) {
        const bp = BLUEPRINT[key];
        let questions;
        try {
          questions = await generateSection(key, bp, seed, env);
        } catch (e) {
          questions = expandFallback(key, bp.targetCount, seed);
        }
        sections.push({name:bp.name,key,durationSec:bp.durationSec,questions});
      }
      return json({attemptId:crypto.randomUUID(),seed,sections});
    }

    if (url.pathname === "/api/score" && request.method === "POST") {
      const body = await request.json();
      return json(scorePaper(body.paper, body.state));
    }

    return env.ASSETS.fetch(request);
  }
};

async function generateSection(section, blueprint, seed, env) {
  if (!env.AI_PROVIDER_URL || !env.AI_API_KEY) throw new Error("AI not configured");

  const instruction = {
    task: "Generate original CAT-style practice questions",
    constraints: {
      no_verbatim_past_CAT_questions: true,
      section,
      count: blueprint.targetCount,
      difficulty_mix: blueprint.mix,
      seed,
      formats: section==="QA" ? ["MCQ","TITA"] : section==="DILR" ? ["MCQ","TITA"] : ["MCQ"],
      scoring: {MCQ:{correct:3,wrong:-1},TITA:{correct:3,wrong:0}},
      quality: [
        "one unambiguous keyed answer",
        "plausible distractors",
        "CAT-like reasoning demand",
        "avoid trivia",
        "avoid culturally obscure knowledge",
        "avoid dependency on current affairs",
        "include all information needed",
        "return JSON only"
      ]
    },
    schema: {
      questions: [{
        type:"MCQ or TITA",
        difficulty:"easy|moderate|difficult",
        topic:"string",
        passage:"optional string",
        prompt:"string",
        options:"array for MCQ only",
        answer:"zero-based option index for MCQ; normalized string for TITA",
        rationale:"short solution rationale"
      }]
    }
  };

  const out = await callAIProvider(instruction, env);
  const qs = Array.isArray(out?.questions) ? out.questions : [];
  const valid = qs.filter(validateQuestion);
  if (valid.length < Math.ceil(blueprint.targetCount * 0.85)) throw new Error("Insufficient valid AI questions");
  return valid.slice(0, blueprint.targetCount);
}

async function callAIProvider(instruction, env) {
  const r = await fetch(env.AI_PROVIDER_URL, {
    method:"POST",
    headers:{
      "content-type":"application/json",
      "authorization":`Bearer ${env.AI_API_KEY}`
    },
    body:JSON.stringify({
      model:env.AI_MODEL || undefined,
      input:instruction,
      response_format:"json"
    })
  });
  if(!r.ok) throw new Error(`AI provider ${r.status}`);
  const data = await r.json();
  return data.output_json || data.json || data;
}

function validateQuestion(q){
  if(!q || !["MCQ","TITA"].includes(q.type)) return false;
  if(!["easy","moderate","difficult"].includes(q.difficulty)) return false;
  if(typeof q.prompt!=="string" || q.prompt.length<8) return false;
  if(q.type==="MCQ"){
    if(!Array.isArray(q.options) || q.options.length!==4) return false;
    if(!Number.isInteger(q.answer) || q.answer<0 || q.answer>3) return false;
  } else {
    if(q.answer===undefined || q.answer===null || String(q.answer).trim()==="") return false;
  }
  return true;
}

function expandFallback(section, count, seed){
  const bank=FALLBACK[section];
  const out=[];
  let i=hash(seed)%bank.length;
  while(out.length<count){
    const q=structuredClone(bank[i%bank.length]);
    q.id=`${section}-${out.length+1}-${seed.slice(0,8)}`;
    out.push(q); i++;
  }
  return out;
}

function scorePaper(paper,state){
  let score=0, attempted=0, correct=0;
  const sectionSummary=[];
  paper.sections.forEach((sec,si)=>{
    let ss=0;
    sec.questions.forEach((q,qi)=>{
      const a=state?.[si]?.[qi]?.answer;
      const attemptedQ=!(a===null || a===undefined || a==="");
      if(!attemptedQ) return;
      attempted++;
      let ok=false;
      if(q.type==="MCQ") ok=Number(a)===Number(q.answer);
      else ok=normalize(a)===normalize(q.answer);
      if(ok){score+=3;ss+=3;correct++}
      else if(q.type==="MCQ"){score-=1;ss-=1}
    });
    sectionSummary.push({section:sec.name,score:ss});
  });
  return {score,attempted,correct,accuracy:attempted?Math.round(correct*1000/attempted)/10:0,sectionSummary};
}
function normalize(x){return String(x).trim().toLowerCase().replace(/\s+/g," ")}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h)}
function json(x){return new Response(JSON.stringify(x),{headers:{"content-type":"application/json","cache-control":"no-store"}})}
