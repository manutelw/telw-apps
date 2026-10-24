const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const prompts={
 answer:"You coach MBA learners (A2+ to B1) in personal interviews using TELW: Tell, Engage/Explain, Land/Link, Wrap/Win. Evaluate the ACTUAL candidate answer, not the earlier ASK TEST PROVE intent task. Focus on answering the question, relevant true evidence, clear reasoning, structure, and simple professional communication. Do not assume details or invent candidate experience. Do not demand metrics when unavailable. Distinguish hypothetical questions from experience questions. Give concise practical feedback with one high-priority next fix. Do not claim to assess audio or pronunciation.",
 followup:"You coach an MBA learner responding to an interviewer follow-up. Assess whether the response addresses the follow-up, supports reasoning with relevant evidence and is clear. Do not invent personal history. Give one specific improvement, in simple language. Do not claim to assess audio.",
 generate:"You are an interviewer. Ask ONE relevant, challenging but fair follow-up to the candidate's answer. Probe an actual choice, action, alternative, result or limitation. Do not invent facts or ask multiple questions. Respond with a single question."
};
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(request.url).origin)return json({error:'Origin not allowed'},403);
 if(!env.OPENAI_API_KEY)return json({error:'AI is not configured for this Cloudflare Worker.'},503);
 let data;try{const raw=await request.text();if(raw.length>14000)return json({error:'Request too large'},413);data=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
 if(!data||!['answer','followup','generate'].includes(data.mode)||typeof data.question!=='string'||typeof data.answer!=='string'||!data.question.trim()||!data.answer.trim()||data.question.length>1000||data.answer.length>9000)return json({error:'Please supply a question and answer.'},400);
 if(data.mode==='followup'&&(!data.followup||typeof data.followup!=='string'||data.followup.length>1500))return json({error:'Generate a follow-up first.'},400);
 const schema=data.mode==='generate'?{type:'object',additionalProperties:false,required:['followup'],properties:{followup:{type:'string'}}}:{type:'object',additionalProperties:false,required:['feedback'],properties:{feedback:{type:'string'}}};
 try{
 const res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:env.PI_PRACTICE_MODEL||'gpt-4.1-mini',temperature:0.2,response_format:{type:'json_schema',json_schema:{name:'pi_studio_'+data.mode,strict:true,schema}},messages:[{role:'system',content:prompts[data.mode]},{role:'user',content:JSON.stringify({question:data.question,answer:data.answer,followup:data.followup||'',plan:data.plan||{}})}]})});
 if(!res.ok)return json({error:'AI provider unavailable (HTTP '+res.status+').'},502);
 const result=await res.json();const choice=result.choices?.[0];if(choice?.finish_reason!=='stop')return json({error:'AI review was interrupted. Please retry.'},502);
 const parsed=JSON.parse(choice.message?.content||'null');const key=data.mode==='generate'?'followup':'feedback';if(typeof parsed?.[key]!=='string'||!parsed[key].trim())return json({error:'AI review was incomplete. Please retry.'},502);
 return json({[key]:parsed[key]});
 }catch{return json({error:'AI review failed. Please retry.'},502)}
}
