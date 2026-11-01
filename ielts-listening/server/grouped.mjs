import {reply} from './auth.mjs';
const sql=(env,text,...args)=>env.LISTENING_DB.prepare(text).bind(...args);
const fail=(message,status=400)=>Object.assign(Error(message),{status});
export async function groupRows(env,setId){return (await sql(env,'SELECT * FROM listening_groups WHERE set_id=?1 ORDER BY part,group_no',setId).all()).results;}
export function initialGroups(groups){return {timingVersion:2,part:1,groupIndex:0,phase:'readCue',readyAt:0,playStartedAt:0,positions:groups.map(()=>0),done:groups.map(()=>false),reviewUntil:0};}
export function publicGroups(groups,id){return groups.map((g,i)=>({part:g.part,number:g.group_no,from:g.from_q,to:g.to_q,duration:g.duration,readingSeconds:g.reading_seconds,readCueSeconds:g.read_cue_seconds,listenCueSeconds:g.listen_cue_seconds,readCue:'/ielts/listening/cues/'+g.read_cue,listenCue:'/ielts/listening/cues/'+g.listen_cue,url:'/ielts/listening/api/audio?attempt='+id+'&group='+i}));}
export async function groupedPlayback(env,row,body,now){
 if(row.status!=='active'||now>=row.deadline)throw fail('This attempt has ended.',409);
 const state=JSON.parse(row.playback_json),groups=await groupRows(env,row.set_id),index=state.groupIndex,g=groups[index];
 if(!g||body.group!==index||body.part!==g.part)throw fail('This is not the current question group.',409);
 if(body.action==='read'){
  if(state.phase==='readCue'){state.phase='reading';state.readyAt=now+g.reading_seconds;}
  else if(state.phase!=='reading')throw fail('This reading period has already ended.',409);
 }else if(body.action==='play'){
  if(state.phase==='reading'&&now>=state.readyAt){state.phase='listening';state.playStartedAt=now;}
  else if(state.phase!=='listening')throw fail('Use the question-reading time first.',409);
 }else if(['checkpoint','end'].includes(body.action)){
  if(state.phase!=='listening'||!state.playStartedAt||typeof body.seconds!=='number'||!Number.isFinite(body.seconds)||body.seconds<0||body.seconds>g.duration+1||body.seconds>now-state.playStartedAt+2)throw fail('Invalid playback position.');
  state.positions[index]=Math.max(state.positions[index],Math.min(body.seconds,g.duration));
  if(body.action==='end'){
   if(state.positions[index]<g.duration-2||now-state.playStartedAt<g.duration-2)throw fail('This recording group has not finished.',409);
   state.done[index]=true;state.groupIndex++;state.playStartedAt=0;state.readyAt=0;
   if(state.groupIndex===groups.length){state.part=5;state.phase='review';state.reviewUntil=now+120;}
   else{state.part=groups[state.groupIndex].part;state.phase='readCue';}
  }
 }else throw fail('Invalid playback action.');
 const changed=await sql(env,"UPDATE listening_attempts SET playback_json=?1 WHERE id=?2 AND playback_json=?3 AND status='active' RETURNING id",JSON.stringify(state),row.id,row.playback_json).first();
 if(!changed)throw fail('Playback changed in another window. Reload to resume.',409);
 return reply({ok:true,playback:state,serverNow:now});
}
export async function groupedAudio(request,env,row,respond){
 const state=JSON.parse(row.playback_json),index=Number(new URL(request.url).searchParams.get('group'));
 if(row.status!=='active'||Math.floor(Date.now()/1000)>=row.deadline||!Number.isInteger(index)||index!==state.groupIndex||state.phase!=='listening')throw fail('Audio is available only for the current active question group.',403);
 const groups=await groupRows(env,row.set_id),g=groups[index];if(!g)throw fail('Recording group not found.',404);
 return respond(request,env,g);
}
