import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
const ALLOWED_ORIGINS=new Set(["https://clarionprep.com","https://www.clarionprep.com"]);
function headers(req:Request){const o=req.headers.get("origin");return{"Access-Control-Allow-Origin":o&&ALLOWED_ORIGINS.has(o)?o:"https://clarionprep.com","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store","Content-Type":"application/json"}}
function reply(req:Request,b:unknown,s=200){return new Response(JSON.stringify(b),{status:s,headers:headers(req)})}
export default {fetch:withSupabase({auth:"none"},async(req,ctx)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
 if(req.method!=="POST")return reply(req,{ok:false,message:"Use POST."},405);
 const origin=req.headers.get("origin");if(origin&&!ALLOWED_ORIGINS.has(origin))return reply(req,{ok:false,message:"This request is not allowed."},403);
 const body=await req.json().catch(()=>({})),token=String(body.session_token||"").trim(),action=String(body.action||"list");
 if(!token)return reply(req,{ok:false,message:"Administrator session required."},401);
 const {data:authData,error:authError}=await ctx.supabaseAdmin.rpc("ascent_admin_student_register",{p_session_token:token});
 const auth=Array.isArray(authData)?authData[0]:authData;if(authError||!auth||auth.ok!==true)return reply(req,{ok:false,message:"Administrator access required."},403);
 const reviewer=String(auth.email||auth.full_name||"ASCENT administrator").slice(0,200);

 if(action==="cancel"){
   const requestId=String(body.request_id||"");
   const {data,error}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests")
    .update({status:"CANCELLED",reviewed_at:new Date().toISOString(),reviewed_by:reviewer,resolution_note:"Closed by administrator; learner account retained",code_hash:"CANCELLED"})
    .eq("id",requestId).eq("status","VERIFIED_PENDING_REVIEW").select("id").maybeSingle();
   if(error||!data)return reply(req,{ok:false,message:"Pending request could not be closed."},400);
   return reply(req,{ok:true,message:"Request closed. Learner account retained."});
 }
 if(action==="delete"){
   const requestId=String(body.request_id||""),confirm=String(body.confirmation||"");
   const {data:reqRow,error:reqErr}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests").select("id,student_uuid,status").eq("id",requestId).maybeSingle();
   if(reqErr||!reqRow||reqRow.status!=="VERIFIED_PENDING_REVIEW"||!reqRow.student_uuid)return reply(req,{ok:false,message:"Verified pending request not found."},400);
   const {data:student,error:sErr}=await ctx.supabaseAdmin.from("ascent_students").select("student_id,full_name,email").eq("id",reqRow.student_uuid).maybeSingle();
   if(sErr||!student)return reply(req,{ok:false,message:"Learner account not found."},400);
   if(confirm!==String(student.student_id))return reply(req,{ok:false,message:"Confirmation did not match the learner ASCENT ID."},400);
   const ref=[student.student_id,student.full_name].filter(Boolean).join(" · ");
   const {data,error}=await ctx.supabaseAdmin.rpc("ascent_account_deletion_complete",{p_request_id:requestId,p_reviewed_by:reviewer,p_learner_reference:ref});
   if(error||!data?.ok)return reply(req,{ok:false,message:data?.message||"Deletion did not complete."},500);
   return reply(req,{ok:true,message:"Deletion completed. The audit record has been retained."});
 }

 const {data:requests,error}=await ctx.supabaseAdmin.from("ascent_account_deletion_requests")
  .select("id,student_uuid,requested_email,requested_at,verified_at,status,reviewed_at,completed_at,learner_reference,resolution_note")
  .in("status",["VERIFIED_PENDING_REVIEW","COMPLETED","CANCELLED"]).order("requested_at",{ascending:false}).limit(200);
 if(error)return reply(req,{ok:false,message:"Deletion requests could not be loaded."},500);
 const ids=[...new Set((requests||[]).map(r=>r.student_uuid).filter(Boolean))];let students:any[]=[];
 if(ids.length){const {data,error:e}=await ctx.supabaseAdmin.from("ascent_students").select("id,student_id,full_name,email,batch,requested_institution_name,registration_status,is_active,archived_at").in("id",ids);if(e)return reply(req,{ok:false,message:"Learner details could not be loaded."},500);students=data||[]}
 const byId=new Map(students.map(s=>[String(s.id),s]));
 return reply(req,{ok:true,requests:(requests||[]).map(r=>({requestId:r.id,requestedAt:r.requested_at,verifiedAt:r.verified_at,status:r.status,reviewedAt:r.reviewed_at,completedAt:r.completed_at,learnerReference:r.learner_reference,resolutionNote:r.resolution_note,learner:byId.get(String(r.student_uuid))||null}))});
})};