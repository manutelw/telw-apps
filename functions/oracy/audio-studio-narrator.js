const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
function cookie(header,name){const m=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
export async function onRequestPost(context){
 const token=cookie(context.request.headers.get('cookie')||'','clarion_admin_session');
 if(!token)return new Response('Administrator sign-in required',{status:403});
 const check=await fetch(ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list',{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
 if(!check.ok)return new Response('Administrator verification failed',{status:503});
 const raw=await check.json(),result=Array.isArray(raw)?raw[0]:raw;
 if(result?.ok!==true)return new Response('Administrator access required',{status:403});
 const body=await context.request.json().catch(()=>({}));
 const input=String(body.text||'').trim();
 if(!/^Unit [1-9][0-9]{0,2}, Key Point [1-9][0-9]{0,2}, Listening for Exercise [1-9][0-9]{0,2}\.$/.test(input))return new Response('Invalid reference',{status:400});
 const key=context.env.OPENAI_API_KEY;
 if(!key)return new Response('OPENAI_API_KEY is not configured for Pages Functions',{status:503});
 const audio=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts',voice:'fable',input,response_format:'mp3',instructions:'Read this training reference as a warm, poised, sophisticated London English narrator. Natural pace, clear diction, and no extra words.'})});
 if(!audio.ok)return new Response('Narration failed',{status:502});
 return new Response(audio.body,{headers:{'content-type':'audio/mpeg','cache-control':'no-store'}});
}
export async function onRequestGet(){return new Response('Method not allowed',{status:405})}