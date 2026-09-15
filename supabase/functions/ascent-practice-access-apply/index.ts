import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const origins=new Set(["https://clarionprep.com","https://www.clarionprep.com"]);

function cors(req:Request){
  const o=req.headers.get("Origin")||"";
  return {
    "Access-Control-Allow-Origin":origins.has(o)?o:"https://clarionprep.com",
    "Access-Control-Allow-Headers":"content-type, apikey, authorization",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Cache-Control":"no-store",
    "Vary":"Origin"
  };
}
function J(req:Request,b:any,s=200){return new Response(JSON.stringify(b),{status:s,headers:{...cors(req),"Content-Type":"application/json"}})}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST") return J(req,{ok:false,message:"POST only"},405);
  try{
    const body=await req.json().catch(()=>({}));
    const token=String(body.session_token||"").trim();
    const feature=String(body.feature_code||"").trim().toUpperCase();
    if(!token||!["GD_BANK","PI_BANK"].includes(feature)) return J(req,{ok:false,message:"Invalid request."},400);

    const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:sess}=await db.from("ascent_sessions").select("student_uuid,expires_at").eq("session_token",token).gt("expires_at",new Date().toISOString()).maybeSingle();
    if(!sess?.student_uuid) return J(req,{ok:false,message:"Your ASCENT session has expired."},401);
    const {data:st}=await db.from("ascent_students").select("id,student_id,is_active").eq("id",sess.student_uuid).eq("is_active",true).maybeSingle();
    if(!st) return J(req,{ok:false,message:"Student account not found."},401);

    const product=feature==="PI_BANK"?"PI_PRACTICE":"GD_PRACTICE";
    const label=feature==="PI_BANK"?"PI Practice":"GD Practice";
    const paymentUrl=`https://clarionprep.com/account/?product=${product}`;

    if(["ADMIN-DEMO-INSTITUTIONAL","ADMIN-DEMO-PRIVATE"].includes(String(st.student_id||""))) {
      return J(req,{ok:true,demo:true,status:"DEMO"});
    }

    return J(req,{
      ok:true,
      payment_required:true,
      code:"PAYMENT_REQUIRED",
      product_code:product,
      payment_url:paymentUrl,
      message:`${label} is a paid ClarionPrep product. Continue to secure payment; no trainer or FIIB approval is required.`
    });
  }catch(e){
    console.error(e);
    return J(req,{ok:false,message:e instanceof Error?e.message:"Unexpected error"},500);
  }
});
