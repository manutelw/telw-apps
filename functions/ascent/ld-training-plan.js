const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const VALIDATE=SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

const sessions=[
  ['1','Think Like L&D: Diagnose Before You Design','Separate symptom, performance gap and training need. Diagnose before accepting a training request.','Role reality; symptom vs cause; five-question diagnosis; case practice; stakeholder challenge; 60-second diagnosis.','One-page performance-gap diagnosis: symptom, desired state, evidence, possible causes, next data needed.'],
  ['2','Training Needs Analysis: Turn a Vague Request into a Learning Brief','Use organisation/task/person analysis; identify whether the gap is knowledge, skill, behaviour, process, motivation or environment.','TNA frame; evidence sources; mini-TNA; write the brief; recommendation-first stakeholder pitch; peer review.','Training Needs Brief plus a 90-second recommendation.'],
  ['3','Design Learning that Changes Behaviour','Write observable learning outcomes and match method, practice and assessment to the required job behaviour.','Outcome quality; backwards design; method choice; 20-minute design sprint; check-for-learning; design defence.','20-minute learning design with outcome, input/model, practice, feedback and assessment.'],
  ['4','Facilitation & Trainer Communication','Open with purpose, explain clearly, give concise instructions, question, listen, correct and involve learners.','Hook → relevance → credibility → destination; Point → Reason → Example; instructions; micro-facilitation; difficult learner moments; feedback.','Recorded 4-minute micro-facilitation plus trainer rubric.'],
  ['5','Measure Learning and Business Impact Without Over-Claiming','Separate participation, learning, behaviour and business results; choose useful indicators; interpret evidence cautiously.','Evidence levels; baseline and target; data case; evaluation design; evidence-safe dashboard language; manager update.','Evaluation plan with baseline, measures, timing, owner and decision rule.'],
  ['6','L&D Placement Simulation: Diagnose, Design, Defend','Integrate diagnosis, design, facilitation, measurement and adaptation under interview pressure.','Case brief; individual diagnosis; intervention design; new information; revise recommendation; panel defence; behavioural PI link.','Capstone pack: diagnosis, learning brief, 20-minute design, evaluation plan and defended recommendation.']
];

const competency=[
  ['Performance diagnosis','Distinguishes a business/performance problem from a training request and asks for evidence before prescribing training.'],
  ['Training Needs Analysis','Identifies target population, current behaviour, desired behaviour, causes, constraints and evidence gaps.'],
  ['Learning design','Writes observable outcomes and chooses practice that directly matches required behaviour.'],
  ['Facilitation','Explains, questions, demonstrates, checks understanding, manages participation and keeps time.'],
  ['Stakeholder communication','Clarifies need, pushes back professionally, recommends an approach and states trade-offs.'],
  ['Measurement','Uses meaningful indicators, separates activity from outcome, and proposes a realistic evaluation plan.'],
  ['L&D data literacy','Reads simple completion, assessment and performance data without over-claiming impact.'],
  ['Adaptability','Changes a recommendation when new constraints or evidence appear.']
];

const rubric=[
  ['Problem diagnosis','Separates symptom from cause; identifies evidence needed.'],
  ['TNA quality','Defines current state, desired behaviour, population, cause and constraints.'],
  ['Learning design','Outcome, method, practice and assessment align.'],
  ['Facilitation','Clear, structured, involving, responsive and time-controlled.'],
  ['Stakeholder communication','Recommendation-first, evidence-based, professional pushback.'],
  ['Measurement','Chooses decision-useful metrics and avoids false impact claims.'],
  ['Adaptability','Revises thinking when evidence or constraints change.'],
  ['Professional communication','Clear structure, concise language, appropriate tone and next action.']
];

const remediation=[
  ['Low structured problem solving','Repeat Sessions 1–2 using two fresh business cases before any new theory.'],
  ['Low communication','Repeat recommendation and stakeholder segments in Sessions 2, 4 and 6. Require Point → Reason → Evidence/Example → Action.'],
  ['Low data interpretation','Use the Session 5 case plus two short tables/charts. Student states insight, limitation and next question.'],
  ['Low judgement/prioritisation','Force ranking of causes/interventions by impact, evidence and feasibility; student must defend first priority.'],
  ['Low adaptability','Use “new information” interruptions in Sessions 1, 2 and 6 and score whether the student genuinely revises the answer.'],
  ['Low verbal reasoning','Require 60–90 second summaries after every case: conclusion first, then two supporting reasons.']
];

const questions=[
'A manager asks for communication training. What would you do before designing it?',
'How would you conduct a basic training needs analysis?',
'How do you decide whether training is the right solution?',
'Write one good learning objective for a workplace skill and explain how you would assess it.',
'How would you handle a participant who dominates the session?',
'How would you measure whether a programme worked?',
'What would you do if learners liked a programme but job performance did not improve?',
'A stakeholder rejects your recommendation. How would you respond?',
'Tell me about a time you changed your approach after receiving new evidence.',
'What L&D metric would you show a business head, and why?'
];

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>L&D Training Plan · Trainer Only</title><style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f4f7fb;color:#17324d}.top{background:#143a60;color:#fff;padding:18px 24px}.wrap{max-width:1100px;margin:0 auto;padding:24px}.hero,.card{background:#fff;border:1px solid #d9e2ec;border-radius:16px;box-shadow:0 8px 24px rgba(20,58,96,.07)}.hero{padding:26px}.tag{font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#2b6ea6}.hero h1{margin:8px 0 10px}.hero p{line-height:1.6;color:#50677e}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.card{padding:20px}.card h2,.card h3{margin-top:0}.session{margin-top:16px}.session .num{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#143a60;color:#fff;font-weight:900}.session h3{display:inline;margin-left:8px}.row{margin:10px 0;line-height:1.55}.label{font-weight:800;color:#143a60}.table{width:100%;border-collapse:collapse}.table td,.table th{border-bottom:1px solid #e7edf3;padding:10px;text-align:left;vertical-align:top}.note{background:#fff7e8;border-left:4px solid #d99100;padding:14px;border-radius:10px;line-height:1.55}.back{color:#fff;text-decoration:none;font-weight:800}.small{font-size:13px;color:#5f7285}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style></head><body><div class="top"><a class="back" href="/ascent/trainer.html">← Back to trainer portal</a></div><main class="wrap"><section class="hero"><div class="tag">Trainer-only resource</div><h1>Learning & Development — Placement Readiness Training Plan</h1><p><strong>Audience:</strong> Second-year MBA students targeting L&D roles. <strong>Format:</strong> 6 trainer-led sessions × 90 minutes + between-session practice.</p><p><strong>Outcome:</strong> Students should be able to diagnose a performance gap, design a focused learning intervention, facilitate it clearly, measure impact, and defend recommendations in an L&D interview or case discussion.</p><div class="note"><strong>Trainer rule:</strong> Treat this as placement preparation, not a theory course. Every session must end with visible evidence: diagnosis, design artefact, facilitation sample, measurement plan, or defended recommendation.</div></section><section class="card" style="margin-top:18px"><h2>Competency map</h2><table class="table">${competency.map(x=>`<tr><th>${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join('')}</table></section>${sessions.map(s=>`<section class="card session"><span class="num">${s[0]}</span><h3>${esc(s[1])}</h3><div class="row"><span class="label">Purpose:</span> ${esc(s[2])}</div><div class="row"><span class="label">90-minute flow:</span> ${esc(s[3])}</div><div class="row"><span class="label">Student evidence:</span> ${esc(s[4])}</div></section>`).join('')}<section class="card" style="margin-top:18px"><h2>Final trainer rubric</h2><p class="small">Score each area 1–5. Placement-ready: no critical area below 3 and overall profile at least 3.5/5.</p><table class="table">${rubric.map(x=>`<tr><th>${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join('')}</table></section><section class="card" style="margin-top:18px"><h2>Remediation from Career Track Fit gaps</h2><table class="table">${remediation.map(x=>`<tr><th>${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join('')}</table></section><section class="card" style="margin-top:18px"><h2>L&D placement questions</h2><ol>${questions.map(q=>`<li class="row">${esc(q)}</li>`).join('')}</ol></section><section class="card" style="margin-top:18px"><h2>Close</h2><p>The goal is not to make the student sound like an experienced L&D manager. The goal is credible entry-level judgement: diagnose before designing, connect learning to work, communicate clearly, use evidence carefully, and adapt when facts change.</p></section></main></body></html>`}

async function validate(token){
  if(!token)return false;
  try{
    const r=await fetch(VALIDATE,{method:'POST',headers:{apikey:SUPABASE_KEY,authorization:'Bearer '+SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok)return false;
    const p=await r.json();const x=Array.isArray(p)?p[0]:p;return Boolean(x&&x.ok===true);
  }catch(_){return false;}
}

export async function onRequestPost({request}){
  const form=await request.formData();
  const token=String(form.get('ascent_session_token')||'');
  if(!(await validate(token)))return new Response('Trainer or administrator access required.',{status:403,headers:{'cache-control':'no-store'}});
  return new Response(page(),{status:200,headers:{'content-type':'text/html; charset=UTF-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff'}});
}
export async function onRequestGet(){return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}})}