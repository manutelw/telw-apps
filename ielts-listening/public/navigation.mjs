export function viewForQuestion(groups,id){
 if(!Number.isInteger(id)||id<1||id>40)throw Error('Invalid question.');
 return {part:Math.floor((id-1)/10),range:groups?.find(g=>id>=g.from&&id<=g.to)||null};
}
export function resumeAttempt(saved,email){return !!(email&&saved&&(saved.status==='completed'&&saved.result||saved.status==='active'&&saved.deadline>Date.now()/1000));}
