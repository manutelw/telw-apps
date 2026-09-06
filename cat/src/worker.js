import {checkCatAccess,bearerFrom,sessionCookieFrom,setSessionCookie,clearSessionCookie} from './access.js';

const ASCENT_SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ASCENT_ADMIN_VALIDATE_RPC=ASCENT_SUPABASE_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

const FALLBACK = {
  VARC: [
    {type:"MCQ",difficulty:"easy",topic:"summary",passage:"Many firms use employee output as the main measure of productivity. Yet output alone may overlook collaboration, mentoring and learning. A workplace can therefore produce more in the short term while weakening capabilities that matter later.",prompt:"Which option best captures the central idea?",options:["Output is the only useful measure of productivity.","Higher short-term output may hide losses in other important workplace capabilities.","Mentoring always reduces productivity.","Firms should stop measuring productivity."],answer:1},
    {type:"MCQ",difficulty:"moderate",topic:"inference",passage:"A city raised parking fees in its central district to reduce congestion. Six months later, central traffic fell, but nearby residential streets reported more parked cars and slower local traffic.",prompt:"Which conclusion is best supported?",options:["The policy had no effect.","Parking fees always create congestion elsewhere.","The policy changed behaviour but also produced a spillover effect.","Residential parking should be banned."],answer:2},
    {type:"MCQ",difficulty:"difficult",topic:"critical reasoning",prompt:"Students who voluntarily attend extra tutorials score higher in exams. A researcher concludes that compulsory tutorials will raise the scores of all students. Which option most weakens the conclusion?",options:["Tutorials are held after class.","Some students dislike tutorials.","Voluntary attendees may already be more motivated than non-attendees.","Scores vary by subject."],answer:2}
  ],
  DILR: [
    {type:"MCQ",difficulty:"easy",topic:"ordering",passage:"Four managers A, B, C and D present from Monday to Thursday, once each. A is before C. B is not on Monday. D is immediately after B. C is not on Thursday.",prompt:"Who must present on Monday?",options:["A","B","C","D"],answer:0},
    {type:"MCQ",difficulty:"moderate",topic:"ordering",passage:"Four managers A, B, C and D present from Monday to Thursday, once each. A is before C. B is not on Monday. D is immediately after B. C is not on Thursday.",prompt:"On which day must D present?",options:["Monday","Tuesday","Wednesday","Thursday"],answer:3},
    {type:"TITA",difficulty:"difficult",topic:"logic",prompt:"Five tasks take 2, 3, 4, 5 and 6 minutes respectively. If exactly two tasks are selected and their total time must be 9 minutes, how many distinct pairs are possible?",answer:"2"}
  ],
  QA: [
    {type:"MCQ",difficulty:"easy",topic:"percentages",prompt:"An item is marked 25% above cost price and sold at a 10% discount on marked price. What is the profit percentage?",options:["10%","12.5%","15%","17.5%"],answer:1},
    {type:"MCQ",difficulty:"moderate",topic:"algebra",prompt:"If x + 1/x = 3, what is x³ + 1/x³?",options:["15","18","21","24"],answer:1},
    {type:"TITA",difficulty:"difficult",topic:"time-work",prompt:"A and B together finish a job in 12 days, B and C in 15 days, and C and A in 20 days. In how many days do A, B and C together finish it?",answer:"10"}
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

    if (url.pathname === "/api/session" && request.method === "POST") {
      const token=bearerFrom(request);
      const access=await checkCatAccess(token);
      if(!access.ok) return json({ok:false,reason:access.reason||'unauthorized',error:access.error},access.status||403);
      return json({ok:true,email:access.user.email,accessType:access.accessType},200,{"set-cookie":setSessionCookie(token)});
    }

    if (url.pathname === "/api/logout" && request.method === "POST") {
      const headers=new Headers({"content-type":"application/json","cache-control":"no-store"});
      headers.append("set-cookie",clearSessionCookie());
      headers.append("set-cookie",clearAdminCookie());
      return new Response(JSON.stringify({ok:true}),{status:200,headers});
    }

    if (url.pathname === "/admin-handoff" && request.method === "POST") {
      const origin=request.headers.get('origin')||'';
      if(!isClarionOrigin(origin)) return new Response('Administrator handoff is not available from this origin.',{status:403,headers:{"cache-control":"no-store"}});
      let token='';
      try{
        const form=await request.formData();
        token=String(form.get('ascent_session_token')||'').trim();
      }catch{
        return new Response('Administrator handoff could not be read.',{status:400,headers:{"cache-control":"no-store"}});
      }
      const valid=await validateAscentAdminSession(token);
      if(!valid) return new Response('Your ASCENT administrator session is not valid or has expired.',{status:403,headers:{"cache-control":"no-store"}});
      const cookie=await setAdminCookie(env);
      return new Response(null,{status:303,headers:{location:new URL('/test',request.url).toString(),"set-cookie":cookie,"cache-control":"no-store"}});
    }

    if ((url.pathname === "/" || url.pathname === "/index.html") && request.method === "GET") {
      return asset(env,request,"/login.html");
    }

    if (url.pathname === "/test" && request.method === "GET") {
      if (await hasAdminSession(request,env)) return asset(env,request,"/index.html");
      const access=await checkCatAccess(sessionCookieFrom(request));
      if(!access.ok) return Response.redirect(new URL('/',request.url),302);
      return asset(env,request,"/index.html");
    }

    if (url.pathname === "/api/new-attempt" && request.method === "POST") {
      if (!(await hasAdminSession(request,env))) {
        const access=await checkCatAccess(sessionCookieFrom(request));
        if(!access.ok) return json({error:'Unauthorized',reason:access.reason||'unauthorized'},access.status||403);
      }
      const seed = crypto.randomUUID();
      const keys = ["VARC","DILR","QA"];
      const generated = await Promise.all(keys.map(async key => {
        const bp = BLUEPRINT[key];
        try {
          const questions = await generateSection(key, bp, seed, env);
          return {name:bp.name,key,durationSec:bp.durationSec,questions};
        } catch (e) {
          console.error("CAT generation fallback", key, e?.message || e);
          return {name:bp.name,key,durationSec:bp.durationSec,questions:expandFallback(key, bp.targetCount, seed)};
        }
      }));
      return json({attemptId:crypto.randomUUID(),seed,sections:generated});
    }

    if (url.pathname === "/api/score" && request.method === "POST") {
      if (!(await hasAdminSession(request,env))) {
        const access=await checkCatAccess(sessionCookieFrom(request));
        if(!access.ok) return json({error:'Unauthorized',reason:access.reason||'unauthorized'},access.status||403);
      }
      const body = await request.json();
      return json(scorePaper(body.paper, body.state));
    }

    return env.ASSETS.fetch(request);
  }
};

function isClarionOrigin(origin){
  try{
    const u=new URL(origin);
    const host=u.hostname.toLowerCase();
    return u.protocol==='https:' && (host==='clarionprep.com' || host.endsWith('.clarionprep.com'));
  }catch{
    return false;
  }
}

async function validateAscentAdminSession(token){
  if(!token) return false;
  try{
    const r=await fetch(ASCENT_ADMIN_VALIDATE_RPC,{
      method:'POST',
      headers:{apikey:ASCENT_SUPABASE_KEY,authorization:`Bearer ${ASCENT_SUPABASE_KEY}`,'content-type':'application/json'},
      body:JSON.stringify({p_session_token:token})
    });
    if(!r.ok) return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result && result.ok===true);
  }catch(error){
    console.error('CAT admin handoff validation failed',error?.message||error);
    return false;
  }
}

async function setAdminCookie(env){
  const issued=Math.floor(Date.now()/1000);
  const sig=await adminSignature(String(issued),env);
  return `cat_admin_session=${issued}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;
}

function clearAdminCookie(){
  return 'cat_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

async function hasAdminSession(request,env){
  const cookie=request.headers.get('cookie')||'';
  const match=cookie.match(/(?:^|;\s*)cat_admin_session=([^;]+)/);
  if(!match || !env.GEMINI_API_KEY) return false;
  const value=decodeURIComponent(match[1]);
  const dot=value.indexOf('.');
  if(dot<1) return false;
  const issuedText=value.slice(0,dot);
  const supplied=value.slice(dot+1);
  const issued=Number(issuedText);
  if(!Number.isInteger(issued)) return false;
  const age=Math.floor(Date.now()/1000)-issued;
  if(age<0 || age>3600) return false;
  const expected=await adminSignature(issuedText,env);
  return timingSafeEqual(supplied,expected);
}

async function adminSignature(value,env){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.GEMINI_API_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`cat-admin:${value}`));
  return base64Url(new Uint8Array(signed));
}

function timingSafeEqual(a,b){
  if(a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

function base64Url(bytes){
  let binary='';
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function asset(env,request,path){
  const u=new URL(request.url);u.pathname=path;u.search='';
  return env.ASSETS.fetch(new Request(u.toString(),request));
}

async function generateSection(section, blueprint, seed, env) {
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) throw new Error("Gemini not configured");

  const batchCounts = splitCount(blueprint.targetCount, 2);
  const batchMixes = splitMix(blueprint.mix, batchCounts);
  const jobs = batchCounts.map((count, i) => generateBatch(section, count, batchMixes[i], `${seed}-${i+1}`, env));
  const settled = await Promise.allSettled(jobs);

  const collected = [];
  for (const result of settled) {
    if (result.status === "fulfilled") collected.push(...result.value);
    else console.error("CAT batch failed", section, result.reason?.message || result.reason);
  }

  const valid = collected.filter(validateQuestion);
  if (valid.length < Math.ceil(blueprint.targetCount * 0.75)) {
    throw new Error(`Insufficient valid Gemini questions: ${valid.length}/${blueprint.targetCount}`);
  }

  while (valid.length < blueprint.targetCount) {
    const fill = expandFallback(section, blueprint.targetCount - valid.length, `${seed}-fill-${valid.length}`);
    valid.push(...fill);
  }
  return valid.slice(0, blueprint.targetCount).map((q,i)=>({...q,id:q.id || `${section}-${i+1}-${seed.slice(0,8)}`}));
}

async function generateBatch(section, count, mix, seed, env) {
  const instruction = {
    task: "Generate original CAT-style practice questions",
    constraints: {
      no_verbatim_past_CAT_questions: true,
      section,
      count,
      difficulty_mix: mix,
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
        "do not copy or closely paraphrase past CAT questions",
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
        options:"array of exactly 4 strings for MCQ only",
        answer:"zero-based option index for MCQ; normalized string for TITA",
        rationale:"short solution rationale"
      }]
    }
  };

  const out = await callGemini(instruction, env, 25000);
  const qs = Array.isArray(out?.questions) ? out.questions : [];
  return qs.filter(validateQuestion).slice(0, count);
}

async function callGemini(instruction, env, timeoutMs=25000) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort("Gemini timeout"), timeoutMs);
  try {
    const model = encodeURIComponent(env.GEMINI_MODEL.trim());
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const r = await fetch(url, {
      method:"POST",
      signal:controller.signal,
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        contents:[{role:"user",parts:[{text:JSON.stringify(instruction)}]}],
        generationConfig:{responseMimeType:"application/json",temperature:0.8}
      })
    });
    if(!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text || "").join("") || "";
    if(!text) throw new Error("Gemini returned no content");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function splitCount(total, parts){
  const base=Math.floor(total/parts), rem=total%parts;
  return Array.from({length:parts},(_,i)=>base+(i<rem?1:0));
}

function splitMix(mix, batchCounts){
  const totals={...mix};
  const result=batchCounts.map(()=>({easy:0,moderate:0,difficult:0}));
  for(const level of ["easy","moderate","difficult"]){
    let remaining=totals[level]||0;
    for(let i=0;i<result.length;i++){
      const batchesLeft=result.length-i;
      const give=Math.floor(remaining/batchesLeft)+(remaining%batchesLeft>0?1:0);
      result[i][level]=give;
      remaining-=give;
    }
  }
  result.forEach((m,i)=>{
    let sum=m.easy+m.moderate+m.difficult;
    while(sum>batchCounts[i]){
      if(m.moderate>0)m.moderate--; else if(m.easy>0)m.easy--; else m.difficult--;
      sum--;
    }
    while(sum<batchCounts[i]){m.moderate++;sum++;}
  });
  return result;
}

function validateQuestion(q){
  if(!q || !["MCQ","TITA"].includes(q.type)) return false;
  if(!["easy","moderate","difficult"].includes(q.difficulty)) return false;
  if(typeof q.prompt!=="string" || q.prompt.length<8) return false;
  if(q.type==="MCQ"){
    if(!Array.isArray(q.options) || q.options.length!==4) return false;
    if(!Number.isInteger(q.answer) || q.answer<0 || q.answer>3) return false;
  } else if(q.answer===undefined || q.answer===null || String(q.answer).trim()==="") return false;
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
      const ok=q.type==="MCQ" ? Number(a)===Number(q.answer) : normalize(a)===normalize(q.answer);
      if(ok){score+=3;ss+=3;correct++;}
      else if(q.type==="MCQ"){score-=1;ss-=1;}
    });
    sectionSummary.push({section:sec.name,score:ss});
  });
  return {score,attempted,correct,accuracy:attempted?Math.round(correct*1000/attempted)/10:0,sectionSummary};
}

function normalize(x){return String(x).trim().toLowerCase().replace(/\s+/g," ");}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h);}
function json(x,status=200,extraHeaders={}){return new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json","cache-control":"no-store",...extraHeaders}});}