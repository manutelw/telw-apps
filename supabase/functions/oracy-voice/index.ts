import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const CLIENT_ID = "oracy-web-v1";
const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

const ALLOWED = new Set([
  "https://manuvikraman.com",
  "https://www.manuvikraman.com",
  "https://clarionprep.com",
  "https://www.clarionprep.com"
]);

const UNIT1_CORE=['native language','official language','at least','almost','majority'];
const UNIT1_MARKERS=['you bet','exactly','oh yeah','really','you know what','by the way','same here','anyway'];
const UNIT1_MARKER_LABELS:any={
  'you bet':'You bet!','exactly':'Exactly!','oh yeah':'Oh yeah!','really':'Really?','you know what':'You know what?','by the way':'By the way','same here':'Same here','anyway':'Anyway'
};

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : "https://www.manuvikraman.com",
    "Access-Control-Allow-Headers": "content-type, x-oracy-client",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function b64(bytes: Uint8Array) { let s = ""; for (const x of bytes) s += String.fromCharCode(x); return btoa(s); }
function unb64(s: string) { const raw = atob(s); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
async function sha256(text: string) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return b64(new Uint8Array(buf)); }

async function validAdmin(token:string){
  if(!token) return false;
  try{
    const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok) return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch{return false;}
}

async function validLearnerUnit(token: string, unitNo: number) {
  if (!token || unitNo < 1) return false;
  const tokenHash = await sha256(token);
  const { data: session } = await db.from("oracy_sessions").select("learner_id,expires_at,revoked_at").eq("token_hash", tokenHash).maybeSingle();
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return false;
  const { data: learner } = await db.from("oracy_learners").select("id,is_active").eq("id", session.learner_id).maybeSingle();
  if (!learner || learner.is_active !== true) return false;
  const { data: assignment } = await db.from("oracy_unit_assignments").select("is_active").eq("learner_id", learner.id).eq("unit_no", unitNo).maybeSingle();
  return Boolean(assignment && assignment.is_active === true);
}

async function authorised(sessionToken:string,adminToken:string,unitNo:number){
  if(await validLearnerUnit(sessionToken,unitNo)) return true;
  if(await validAdmin(adminToken)) return true;
  return false;
}

async function generateTts(req: Request, text: string, voice: string, instructions: string) {
  const body:any={ model: "gpt-4o-mini-tts", voice, input: text, response_format: "mp3" };
  if(instructions) body.instructions=instructions;
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) { let detail = ""; try { detail = (await r.text()).slice(0, 500); } catch {} return { ok: false as const, response: json(req, { error: "TTS failed", detail }, 502) }; }
  return { ok: true as const, bytes: new Uint8Array(await r.arrayBuffer()) };
}

async function tts(req: Request, payload: any) {
  const text = String(payload?.text || "").trim();
  const voice = payload?.voice === "cedar" ? "cedar" : "marin";
  const instructions = String(payload?.instructions || "").trim().slice(0,700);
  const unitNo = Number(payload?.unit_no || 0);
  const sessionToken = String(payload?.session_token || "").trim();
  const adminToken = String(payload?.admin_token || "").trim();
  const passageId = String(payload?.passage_id || "").trim();
  if (!(await authorised(sessionToken,adminToken,unitNo))) return json(req, { error: "ORACY access required" }, 403);
  if (!text || text.length > 1800) return json(req, { error: "Invalid text" }, 400);

  if (passageId) {
    const { data: cached } = await db.from("oracy_audio_cache").select("audio_base64,content_type").eq("passage_id", passageId).maybeSingle();
    if (cached?.audio_base64) return new Response(unb64(cached.audio_base64), { headers: { ...cors(req), "Content-Type": cached.content_type || "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Oracy-Audio": "cache" } });
  }

  const generated = await generateTts(req, text, voice, instructions);
  if (!generated.ok) return generated.response;
  if (passageId) await db.from("oracy_audio_cache").upsert({ passage_id: passageId, audio_base64: b64(generated.bytes), content_type: "audio/mpeg", created_at: new Date().toISOString() }, { onConflict: "passage_id" });
  return new Response(generated.bytes, { headers: { ...cors(req), "Content-Type": "audio/mpeg", "Cache-Control": passageId ? "public, max-age=31536000, immutable" : "no-store", "X-Oracy-Audio": passageId ? "generated-and-cached" : "dynamic" } });
}

async function transcribe(audio: File) {
  const fd = new FormData(); fd.append("model", "whisper-1"); fd.append("file", audio, audio.name || "answer.webm");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` }, body: fd });
  if (!r.ok) throw new Error("Transcription failed: " + (await r.text()).slice(0, 400));
  return String((await r.json()).text || "").trim();
}

function scoreLine(label:string,item:any){
  const score=Number(item?.score||0);
  const safeScore=score>=1&&score<=3?`${score}/3`:'Not scored';
  const comment=String(item?.comment||'').trim();
  return `${label}: ${safeScore}${comment?` — ${comment}`:''}`;
}

function norm(text:string){return String(text||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9'? ]+/g,' ').replace(/\s+/g,' ').trim();}
function markerHits(text:string){
  const t=norm(text);
  return UNIT1_MARKERS.filter(m=>t.includes(norm(m)));
}
function markerExample(marker:string){
  const examples:any={
    'you bet':'You bet! I use English every day.',
    'exactly':'Exactly! English helps me when I travel.',
    'oh yeah':'Oh yeah, I also watch videos in English.',
    'really':'Really? I did not know English was used there.',
    'you know what':'You know what? I use English most with my students.',
    'by the way':'By the way, Hindi is my native language.',
    'same here':'Same here. I also switch between Hindi and English.',
    'anyway':'Anyway, I want to keep improving my English.'
  };
  return examples[marker]||`${UNIT1_MARKER_LABELS[marker]||marker} ...`;
}


async function conversation(req: Request, form: FormData) {
  const audio = form.get("audio");
  const sessionToken = String(form.get("session_token") || "");
  const adminToken = String(form.get("admin_token") || "");
  const unitNo = Number(form.get("unit_no") || 0);
  const turnNo = Number(form.get("turn_no") || 0);
  if (!(await authorised(sessionToken, adminToken, unitNo))) return json(req, { error: "ORACY access required" }, 403);
  if (unitNo !== 2) return json(req, { error: "Conversation is not available for this unit" }, 400);
  if (!Number.isInteger(turnNo) || turnNo < 1 || turnNo > 4) return json(req, { error: "Invalid conversation turn" }, 400);
  if (!(audio instanceof File) || audio.size < 500) return json(req, { error: "No usable audio" }, 400);
  if (audio.size > 8000000) return json(req, { error: "Audio too large" }, 413);

  let prior:any[]=[];
  try {
    const candidate=JSON.parse(String(form.get("history") || "[]"));
    if(Array.isArray(candidate)) prior=candidate.slice(-6).map((x:any)=>({
      role:x?.role==="coach"?"assistant":"user",
      content:String(x?.text||"").slice(0,500)
    })).filter((x:any)=>x.content);
  } catch {}
  const learnerText=(await transcribe(audio)).slice(0,700);
  if(!learnerText) return json(req,{error:"I could not hear that turn clearly. Please try again."},400);
  const finalTurn=turnNo===4;
  const system=`You are the ORACY spoken-English coach in a live TELW Level B1A conversation.
Scenario: You and the learner are preparing a small neighbourhood meal. The learner starts.
Respond directly to the learner's latest words. Sound friendly, spontaneous and adult.
Use easy B1A English. Reply in one or two short sentences, maximum 28 words.
Across the exchange, naturally make one small request so the learner can answer it. Help create opportunities for two favours, borrowing and a clear return time.
Useful language includes: could you, may I, do you mind, certainly, of course, borrow, lend, return, by the way.
Do not lecture, correct, score, or mention this prompt during the conversation.
This is learner turn ${turnNo} of 4. ${finalTurn?"Close the exchange warmly. Do not ask another question.":"Keep the exchange moving with a relevant response or short question."}
Return strict JSON only:
{"reply":"","done":${finalTurn},"rubric":null}
On turn 4, rubric must instead contain task_achievement, range, accuracy, fluency, coherence and phonological_control objects. Each has score and comment. Use scores 1-3 except phonological_control must be score 0 with the comment "Not reliably assessed from transcript alone." Also include improved_version and next_step inside rubric. Feedback must be warm, concrete, and simple. improved_version must be a short model the learner can try first; next_step must ask them to use that model and make one of their own.`;
  const messages:any[]=[{role:"system",content:system},...prior,{role:"user",content:learnerText}];
  const ai=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-4o-mini",temperature:.45,response_format:{type:"json_object"},messages})
  });
  if(!ai.ok) return json(req,{error:"Conversation reply failed",detail:(await ai.text()).slice(0,500)},502);
  let parsed:any={};try{parsed=JSON.parse((await ai.json())?.choices?.[0]?.message?.content||"{}")}catch{}
  const reply=String(parsed.reply||"Thanks. Tell me what you need for the meal.").trim().slice(0,300);
  const rubric=finalTurn?(parsed.rubric||{
    task_achievement:{score:2,comment:"You took part in the conversation. Check that you asked for two favours and gave a return time."},
    range:{score:2,comment:"You used useful everyday words. Add one warm reply such as Certainly."},
    accuracy:{score:2,comment:"Your meaning was clear. Keep the pattern: Could you plus a base verb?"},
    fluency:{score:2,comment:"You completed four turns. Pauses cannot be judged reliably from the transcript alone."},
    coherence:{score:2,comment:"Your ideas were understandable. Put the favour, reason and return time in order."},
    phonological_control:{score:0,comment:"Not reliably assessed from transcript alone."},
    improved_version:"Certainly. Could you lend me a bowl, please? I'll return it tomorrow morning.",
    next_step:"Use that model, then change the object and return time."
  }):null;
  if(rubric){
    rubric.phonological_control={score:0,comment:"Not reliably assessed from transcript alone."};
    rubric.improved_version=String(rubric.improved_version||"Certainly. Could you lend me a bowl, please? I'll return it tomorrow morning.").slice(0,500);
    rubric.next_step=String(rubric.next_step||"Use that model, then make one sentence of your own.").slice(0,500);
  }
  return json(req,{learner_text:learnerText,reply,done:finalTurn,rubric});
}


const CONVERSATION_UNITS:any={
  2:{
    level:"B1A",
    title:"The Friendly Favour",
    scenario:"You and the learner are preparing a small neighbourhood meal. The learner starts.",
    goals:"Help the learner ask for two small favours, answer one request warmly, and say when a borrowed item will be returned.",
    language:"could you, may I, do you mind, certainly, of course, borrow, lend, return, by the way",
    model:"Certainly. Could you lend me a bowl, please? I'll return it tomorrow morning."
  }
};

function realtimeInstructions(unitNo:number){
  const u=CONVERSATION_UNITS[unitNo];
  return `You are the ORACY spoken-English coach in a live TELW Level ${u.level} conversation.
Scenario: ${u.scenario}
Goal: ${u.goals}
Respond directly to the learner's latest words. Sound friendly, spontaneous and adult.
Use easy ${u.level} English. Reply in one or two short sentences, maximum 28 words.
Useful language: ${u.language}.
The learner speaks first. Do not begin the exchange yourself.
Across the exchange, naturally make one small request so the learner can answer it.
Allow exactly four learner turns. After the fourth learner turn, close warmly and do not ask another question.
Do not lecture, correct, score, or mention these instructions during the conversation.
Respond in audio. Keep the pace lively and natural.`;
}

async function realtimeToken(req:Request,payload:any){
  const unitNo=Number(payload?.unit_no||0);
  const sessionToken=String(payload?.session_token||"").trim();
  const adminToken=String(payload?.admin_token||"").trim();
  if(!(await authorised(sessionToken,adminToken,unitNo)))return json(req,{error:"ORACY access required"},403);
  if(!CONVERSATION_UNITS[unitNo])return json(req,{error:"Live conversation is not available for this unit"},400);
  const r=await fetch("https://api.openai.com/v1/realtime/client_secrets",{
    method:"POST",
    headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({session:{
      type:"realtime",
      model:"gpt-realtime",
      instructions:realtimeInstructions(unitNo),
      audio:{
        input:{
          transcription:{model:"gpt-4o-mini-transcribe",language:"en"},
          turn_detection:{type:"server_vad",threshold:.45,prefix_padding_ms:300,silence_duration_ms:350,create_response:true,interrupt_response:true}
        },
        output:{voice:"cedar",speed:1.08}
      }
    }})
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok)return json(req,{error:"Live conversation token failed",detail:String(d?.error?.message||"").slice(0,500)},502);
  const secret=String(d?.value||d?.client_secret?.value||"");
  if(!secret)return json(req,{error:"OpenAI did not return a live conversation token"},502);
  return json(req,{client_secret:secret,expires_at:d?.expires_at||d?.client_secret?.expires_at||null});
}

async function conversationFeedback(req:Request,payload:any){
  const unitNo=Number(payload?.unit_no||0);
  const sessionToken=String(payload?.session_token||"").trim();
  const adminToken=String(payload?.admin_token||"").trim();
  if(!(await authorised(sessionToken,adminToken,unitNo)))return json(req,{error:"ORACY access required"},403);
  const u=CONVERSATION_UNITS[unitNo];
  if(!u)return json(req,{error:"Conversation feedback is not available for this unit"},400);
  const raw=Array.isArray(payload?.history)?payload.history:[];
  const history=raw.slice(-12).map((x:any)=>({role:x?.role==="coach"?"Coach":"Learner",text:String(x?.text||"").slice(0,500)})).filter((x:any)=>x.text);
  const instruction=`Evaluate this short TELW Level ${u.level} spoken-English conversation.
Task: ${u.goals}
Transcript: ${history.map((x:any)=>x.role+": "+x.text).join("\n")}
Give warm, concrete, simple learner-facing feedback. Score task_achievement, range, accuracy, fluency and coherence from 1 to 3. Set phonological_control to score 0 because fine pronunciation cannot be assessed reliably from transcript alone. Include one short improved_version that the learner can try first and one next_step asking the learner to adapt it.
Return strict JSON only with keys task_achievement, range, accuracy, fluency, coherence, phonological_control, improved_version and next_step. Every scored key must contain score and comment.`;
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",temperature:.1,response_format:{type:"json_object"},messages:[{role:"user",content:instruction}]})});
  if(!r.ok)return json(req,{error:"Conversation feedback failed",detail:(await r.text()).slice(0,500)},502);
  let rubric:any={};try{rubric=JSON.parse((await r.json())?.choices?.[0]?.message?.content||"{}")}catch{}
  rubric.phonological_control={score:0,comment:"Not reliably assessed from transcript alone."};
  rubric.improved_version=String(rubric.improved_version||u.model).slice(0,500);
  rubric.next_step=String(rubric.next_step||"Use that model, then change the object and return time.").slice(0,500);
  return json(req,{rubric});
}

async function evaluate(req: Request, form: FormData) {
  const audio = form.get("audio");
  const prompt = String(form.get("prompt") || "");
  const sessionToken = String(form.get("session_token") || "");
  const adminToken = String(form.get("admin_token") || "");
  const unitNo = Number(form.get("unit_no") || 0);
  if (!(await authorised(sessionToken,adminToken,unitNo))) return json(req, { error: "ORACY access required" }, 403);
  if (!(audio instanceof File) || audio.size < 500) return json(req, { error: "No usable audio" }, 400);
  if (audio.size > 8000000) return json(req, { error: "Audio too large" }, 413);
  const transcript = await transcribe(audio);
  const usedMarkers=unitNo===1?markerHits(transcript):[];
  const markerMin=unitNo===1?(prompt.toLowerCase().includes('35 to 50')||prompt.toLowerCase().includes('35–50')?2:1):0;
  const markerPassed=usedMarkers.length>=markerMin;
  const unusedMarkers=UNIT1_MARKERS.filter(m=>!usedMarkers.includes(m));
  const markerSuggestions=unusedMarkers.slice(0,Math.max(2,markerMin-usedMarkers.length)).map(m=>({item:UNIT1_MARKER_LABELS[m],example:markerExample(m)}));

  const instruction = `You are ORACY, a warm CEFR B1 spoken-English coach for adult learners. Evaluate the learner's RESPONSE, not their personality.\n\nTask: ${prompt}\nLearner transcript: ${transcript}\n\nImportant transcription rule: Ignore obvious non-linguistic noise, coughs, throat-clearing, accidental fragments, or transcription artefacts. Do not treat them as language errors.\n\nUse this CEFR-aligned ORACY rubric, with 1-3 scores where evidence exists:\n1 = below B1 task expectation; 2 = developing B1; 3 = secure B1 for this short task.\n- task_achievement: Did the learner answer the actual prompt and develop the required points?\n- range: Is there enough everyday vocabulary and some varied sentence patterns for B1?\n- accuracy: Is common grammar controlled well enough for the message to stay clear?\n- fluency: Give only a PROVISIONAL score based on how continuously and fully the transcript develops ideas. State that pauses cannot be judged reliably from transcript alone.\n- coherence: Are ideas linked in a clear sequence with connectors/discourse markers?\n- phonological_control: DO NOT invent pronunciation evidence from transcript. Return score 0 and say it is not reliably assessed from transcript alone.\n\nUnit 1 language bank has 13 vocabulary/discourse items. Core vocabulary: native language; official language; at least; almost; majority. Discourse markers: You bet!; Exactly!; Oh yeah!; Really?; You know what?; By the way; Same here; Anyway. Useful Unit 1 patterns: I use ... for -ing; I need ... to; I am learning ... to; so that I can.\n\nFor suggested_vocabulary, return EXACTLY five useful Unit 1 items/phrases that would improve THIS response. Prioritise items the learner did not use, including discourse markers where natural. Add one short model fragment for each.\n\nGive one clear next_step. Keep comments concrete and B1-friendly. Do not give a grammar lecture.\n\nGive one improved_version that keeps the learner's meaning and naturally uses some missed Unit 1 vocabulary and discourse markers.\n\nReturn strict JSON only with this shape:\n{\n  "cefr_estimate":"A2|A2+|B1|B1+|B2",\n  "task_achievement":{"score":1,"comment":""},\n  "range":{"score":1,"comment":""},\n  "accuracy":{"score":1,"comment":""},\n  "fluency":{"score":1,"comment":""},\n  "coherence":{"score":1,"comment":""},\n  "phonological_control":{"score":0,"comment":"Not reliably assessed from transcript alone."},\n  "suggested_vocabulary":[{"item":"","example":""},{"item":"","example":""},{"item":"","example":""},{"item":"","example":""},{"item":"","example":""}],\n  "next_step":"",\n  "improved_version":""\n}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {method:"POST",headers:{"Authorization":`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},messages:[{role:"user",content:instruction}]})});
  if (!r.ok) return json(req, { error: "Evaluation failed", detail: (await r.text()).slice(0, 500) }, 502);
  const d = await r.json(); let parsed:any={}; try{parsed=JSON.parse(d?.choices?.[0]?.message?.content||"{}")}catch{}
  const vocab=Array.isArray(parsed.suggested_vocabulary)?parsed.suggested_vocabulary.slice(0,5):[];
  const vocabText=vocab.map((v:any)=>`${String(v?.item||'').trim()}${v?.example?` — ${String(v.example).trim()}`:''}`).filter(Boolean).join('\n');
  const markerText=unitNo===1?(markerPassed
    ?`Discourse-marker check: ✓ You used ${usedMarkers.map(m=>UNIT1_MARKER_LABELS[m]).join(', ')}.`
    :`Discourse-marker check: NOT YET. Use at least ${markerMin} marker${markerMin===1?'':'s'} in this recording. Try one of these:\n${markerSuggestions.map((m:any)=>`${m.item} — ${m.example}`).join('\n')}\nRecord yourself again until the marker check passes.`):'';
  const feedback=[
    markerText,
    `CEFR working estimate: ${String(parsed.cefr_estimate||'B1')}`,
    scoreLine('Task achievement',parsed.task_achievement),
    scoreLine('Range',parsed.range),
    scoreLine('Accuracy',parsed.accuracy),
    scoreLine('Fluency',parsed.fluency),
    scoreLine('Coherence',parsed.coherence),
    `Phonological control: Not scored — ${String(parsed?.phonological_control?.comment||'Not reliably assessed from transcript alone.')}`,
    vocabText?`5 Unit 1 words/phrases to try next:\n${vocabText}`:'',
    parsed.next_step?`Next step: ${String(parsed.next_step).trim()}`:''
  ].filter(Boolean).join('\n\n');
  return json(req,{transcript,feedback,improved:String(parsed.improved_version||transcript),rubric:parsed,marker_check:{required:markerMin,used:usedMarkers.map(m=>UNIT1_MARKER_LABELS[m]),passed:markerPassed,suggestions:markerSuggestions},needs_retry:unitNo===1&&!markerPassed});
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  if (req.headers.get("x-oracy-client") !== CLIENT_ID) return json(req, { error: "Not allowed" }, 403);
  if (!OPENAI_API_KEY) return json(req, { error: "Voice service not configured" }, 503);
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) { const form=await req.formData(); return String(form.get("action")||"evaluate")==="conversation" ? await conversation(req,form) : await evaluate(req,form); }
    const payload = await req.json();
    if (payload?.action === "tts") return await tts(req, payload);
    if (payload?.action === "realtime-token") return await realtimeToken(req, payload);
    if (payload?.action === "conversation-feedback") return await conversationFeedback(req, payload);
    return json(req, { error: "Unknown action" }, 400);
  } catch (e) { return json(req, { error: "Request failed", detail: String(e?.message || e).slice(0, 500) }, 500); }
});