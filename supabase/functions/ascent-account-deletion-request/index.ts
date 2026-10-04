import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const ALLOWED_ORIGINS = new Set([
  "https://clarionprep.com",
  "https://www.clarionprep.com",
  "https://secure-ascent-account-deletion.ascent-dialogue-lab-pages.pages.dev",\n  "https://deploy-preview-451--telw-clarion.netlify.app",
]);

function cors(req: Request) {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://clarionprep.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}
function reply(req: Request, body: unknown, status=200){return Response.json(body,{status,headers:cors(req)});}
function validEmail(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function escapeHtml(v:string){return v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
async function sha256(v:string){
  const bytes=new TextEncoder().encode(v);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function code6(){const a=new Uint32Array(1);crypto.getRandomValues(a);return String(a[0]%1000000).padStart(6,"0");}
const neutral={ok:true,code:"request_received",message:"If this email address is associated with an ASCENT account, a verification code will be sent to it."};

export default {fetch:withSupabase({auth:"none"},async(req,ctx)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return reply(req,{ok:false,code:"method_not_allowed",message:"Use a POST request."},405);
  const origin=req.headers.get("origin");
  if(origin&&!ALLOWED_ORIGINS.has(origin))return reply(req,{ok:false,code:"origin_not_allowed",message:"This request is not allowed."},403);
  const p=await req.json().catch(()=>({}));
  const action=String(p.action||"request");
  const email=String(p.email||"").trim().toLowerCase();
  if(!validEmail(email))return reply(req,{ok:false,code:"invalid_email",message:"Enter a valid email address."},400);

  const {data:students,error:studentError}=await ctx.supabaseAdmin
    .from("ascent_students").select("id,full_name,email,archived_at")
    .ilike("email",email).is("archived_at",null).limit(1);
  if(studentError){console.error("Deletion lookup failed:",studentError.message);return reply(req,{ok:false,code:"service_unavailable",message:"The request could not be processed. Please try again later."},500);}
  const student=students?.[0];

  if(action==="request"){
    if(!student)return reply(req,neutral);
    const since=new Date(Date.now()-10*60*1000).toISOString();
    const {data:recent}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests")
      .select("id").eq("student_uuid",student.id).gte("requested_at",since).limit(1);
    if(recent?.length)return reply(req,neutral);
    if(!RESEND_API_KEY)return reply(req,{ok:false,code:"email_service_unavailable",message:"Verification email is temporarily unavailable."},503);

    const code=code6(), salt=crypto.randomUUID(), hash=await sha256(salt+":"+code);
    const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
    const {data:row,error:insertError}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests").insert({
      student_uuid:student.id,requested_email:email,code_hash:salt+":"+hash,expires_at:expiresAt
    }).select("id").single();
    if(insertError||!row?.id){console.error("Deletion request insert failed:",insertError?.message);return reply(req,{ok:false,code:"request_failed",message:"The request could not be processed. Please try again later."},500);}

    const safeName=escapeHtml(String(student.full_name||"ASCENT learner"));
    const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
      Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json","User-Agent":"ASCENT-Account-Deletion/1.0",
      "Idempotency-Key":`ascent-delete-${row.id}`
    },body:JSON.stringify({
      from:"ASCENT <verify@mail.clarionprep.com>",to:[email],subject:"Verify your ASCENT account deletion request",
      text:`Hello ${student.full_name||"ASCENT learner"},\n\nYour ASCENT account deletion verification code is ${code}.\n\nThis code expires in 10 minutes. No account or data has been deleted.\n\nIf you did not request deletion, you can ignore this email.`,
      html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#172033"><h2>Verify your ASCENT deletion request</h2><p>Hello ${safeName},</p><p>Enter this six-digit code on the ASCENT deletion page:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px;margin:24px 0;background:#f3f5f8;border-radius:10px">${code}</div><p>This code expires in <strong>10 minutes</strong>.</p><p><strong>No account or data has been deleted.</strong> If you did not request this, ignore this email.</p></div>`
    })});
    if(!mail.ok){await ctx.supabaseAdmin.from("ascent_account_deletion_requests").delete().eq("id",row.id);return reply(req,{ok:false,code:"verification_email_failed",message:"The verification email could not be sent. Please try again later."},502);}
    return reply(req,neutral);
  }

  if(action==="verify"){
    if(!student)return reply(req,{ok:false,code:"verification_invalid",message:"The verification details are invalid or have expired."},400);
    const code=String(p.code||"").replace(/\D/g,"").slice(0,6);
    if(!/^\d{6}$/.test(code))return reply(req,{ok:false,code:"verification_invalid",message:"Enter the six-digit verification code."},400);
    const {data:rows}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests")
      .select("id,code_hash,expires_at,attempt_count,status").eq("student_uuid",student.id)
      .eq("status","PENDING_VERIFICATION").order("requested_at",{ascending:false}).limit(1);
    const row=rows?.[0];
    if(!row||new Date(row.expires_at).getTime()<Date.now()||row.attempt_count>=5)return reply(req,{ok:false,code:"verification_invalid",message:"The verification details are invalid or have expired."},400);
    const [salt,stored]=String(row.code_hash).split(":");
    const candidate=await sha256(salt+":"+code);
    if(candidate!==stored){
      await ctx.supabaseAdmin.from("ascent_account_deletion_requests").update({attempt_count:row.attempt_count+1}).eq("id",row.id);
      return reply(req,{ok:false,code:"verification_invalid",message:"The verification details are invalid or have expired."},400);
    }
    const {error:updateError}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests").update({
      verified_at:new Date().toISOString(),status:"VERIFIED_PENDING_REVIEW",code_hash:"VERIFIED"
    }).eq("id",row.id);
    if(updateError)return reply(req,{ok:false,code:"verification_failed",message:"Verification could not be completed. Please try again later."},500);
    return reply(req,{ok:true,code:"verified_pending_review",message:"Your email has been verified. Your deletion request is now pending manual review. No account or data has been deleted yet."});
  }

  return reply(req,{ok:false,code:"invalid_action",message:"The request could not be processed."},400);
})};