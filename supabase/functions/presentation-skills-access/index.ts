import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set(["https://clarionprep.com","https://www.clarionprep.com"]);
const enc=new TextEncoder();
const clean=(v:any)=>String(v??"").trim();
function cors(req:Request){const o=clean(req.headers.get("origin"));return {"access-control-allow-origin":ORIGINS.has(o)?o:"https://clarionprep.com","access-control-allow-headers":"content-type","access-control-allow-methods":"POST, OPTIONS","content-type":"application/json","cache-control":"no-store","vary":"origin"}}
function out(req:Request,body:any,status=200){return new Response(JSON.stringify(body),{status,headers:cors(req)})}
function random(bytes=32){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function sha(value:string){const d=await crypto.subtle.digest("SHA-256",enc.encode(value));return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,"0")).join("")}
async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(salt),iterations:150000},key,256);return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,"0")).join("")}
function same(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function admin(token:string){if(!token)return null;const {data:s}=await db.from("ascent_trainer_sessions").select("trainer_uuid,expires_at").eq("session_token",token).maybeSingle();if(!s||new Date(s.expires_at)<=new Date())return null;const {data:t}=await db.from("ascent_trainers").select("id,role,is_active").eq("id",s.trainer_uuid).maybeSingle();return t?.is_active&&String(t.role).toUpperCase()==="ADMIN"?t:null}
async function validSession(raw:string,deviceId:string,touch=true){if(!raw||deviceId.length<20)return null;const tokenHash=await sha(raw),deviceHash=await sha(deviceId);const {data:s}=await db.from("presentation_sessions").select("token_hash,learner_id,device_hash,device_generation,expires_at,revoked_at").eq("token_hash",tokenHash).maybeSingle();if(!s||s.revoked_at||new Date(s.expires_at)<=new Date()||!same(s.device_hash,deviceHash))return null;const {data:l}=await db.from("presentation_learners").select("id,display_name,is_active,device_generation").eq("id",s.learner_id).maybeSingle();if(!l?.is_active||Number(l.device_generation)!==Number(s.device_generation))return null;if(touch)await db.from("presentation_sessions").update({last_seen_at:new Date().toISOString()}).eq("token_hash",tokenHash);return l}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return out(req,{ok:false,message:"Use POST."},405);
  try{
    const b=await req.json().catch(()=>({})),action=clean(b.action).toUpperCase();
    if(action==="LOGIN"){
      const login=clean(b.login_id).toLowerCase(),password=clean(b.password),device=clean(b.device_id);
      if(!login||password.length<6||device.length<20)return out(req,{ok:false,message:"Enter your assigned login details on this device."},400);
      const {data:l}=await db.from("presentation_learners").select("id,display_name,password_salt,password_hash,is_active,device_generation").ilike("login_id",login).maybeSingle();
      if(!l?.is_active||!same(await passwordHash(password,l.password_salt),l.password_hash))return out(req,{ok:false,message:"The login details are not valid or access is inactive."},401);
      const generation=Number(l.device_generation||0)+1;
      const {data:updated}=await db.from("presentation_learners").update({device_generation:generation,updated_at:new Date().toISOString()}).eq("id",l.id).eq("device_generation",l.device_generation).select("id").maybeSingle();
      if(!updated)return out(req,{ok:false,message:"Another sign-in happened at the same time. Please sign in again."},409);
      await db.from("presentation_sessions").update({revoked_at:new Date().toISOString()}).eq("learner_id",l.id).is("revoked_at",null);
      const raw=random(),tokenHash=await sha(raw),deviceHash=await sha(device),expires=new Date(Date.now()+30*24*60*60*1000).toISOString();
      const {error}=await db.from("presentation_sessions").insert({token_hash:tokenHash,learner_id:l.id,device_hash:deviceHash,device_generation:generation,expires_at:expires});if(error)throw error;
      return out(req,{ok:true,session_token:raw,display_name:l.display_name,expires_at:expires});
    }
    if(action==="VALIDATE"){
      const l=await validSession(clean(b.session_token),clean(b.device_id));return l?out(req,{ok:true,display_name:l.display_name}):out(req,{ok:false,message:"Access is not active on this device."},401);
    }
    if(action==="LOGOUT"){
      const h=await sha(clean(b.session_token));await db.from("presentation_sessions").update({revoked_at:new Date().toISOString()}).eq("token_hash",h);return out(req,{ok:true});
    }
    const a=await admin(clean(b.ascent_session_token));if(!a)return out(req,{ok:false,message:"Administrator session is invalid or expired."},401);
    if(action==="ADMIN_LIST"){
      const {data,error}=await db.from("presentation_learners").select("id,display_name,login_id,is_active,device_generation,created_at,updated_at").order("created_at",{ascending:false});if(error)throw error;return out(req,{ok:true,learners:data||[]});
    }
    if(action==="ADMIN_SAVE"){
      const id=clean(b.learner_id),name=clean(b.display_name).slice(0,120),login=clean(b.login_id).toLowerCase().slice(0,160),password=clean(b.password);
      if(!name||!login||(!id&&password.length<6))return out(req,{ok:false,message:"Name, login ID and a password of at least six characters are required."},400);
      const values:any={display_name:name,login_id:login,is_active:b.is_active!==false,updated_at:new Date().toISOString()};
      if(password){if(password.length<6)return out(req,{ok:false,message:"Password must contain at least six characters."},400);values.password_salt=random(16);values.password_hash=await passwordHash(password,values.password_salt)}
      let result;if(id)result=await db.from("presentation_learners").update(values).eq("id",id).select("id").single();else result=await db.from("presentation_learners").insert({...values,created_by_trainer_uuid:a.id}).select("id").single();
      if(result.error)throw result.error;return out(req,{ok:true,learner_id:result.data.id});
    }
    if(action==="ADMIN_SET_ACTIVE"){
      const id=clean(b.learner_id),active=b.is_active===true;if(!id)return out(req,{ok:false,message:"Learner is required."},400);
      const {error}=await db.from("presentation_learners").update({is_active:active,device_generation:Math.floor(Date.now()/1000),updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;
      await db.from("presentation_sessions").update({revoked_at:new Date().toISOString()}).eq("learner_id",id).is("revoked_at",null);return out(req,{ok:true});
    }
    if(action==="ADMIN_RESET_DEVICE"){
      const id=clean(b.learner_id);if(!id)return out(req,{ok:false,message:"Learner is required."},400);await db.from("presentation_sessions").update({revoked_at:new Date().toISOString()}).eq("learner_id",id).is("revoked_at",null);return out(req,{ok:true});
    }
    return out(req,{ok:false,message:"Invalid action."},400);
  }catch(e){console.error(e);return out(req,{ok:false,message:"Presentation access could not complete this request."},500)}
});
