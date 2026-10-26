// Private/offline validation for AI-generated IELTS Reading versions.
// Never publish answer keys in the browser bundle. Run before manual approval.
export const TOPICS = {
 academic:["The changing role of urban wetlands","How scientific collections are digitised","Urban heat mapping","Reproducing scientific findings"],
 general:["Community library membership and borrowing","Notice to staff: flexible working trial","Community bicycle loan rules","Employee training bookings"]
};
const VALID = new Set([0,1,2]);
export function validateVersion(version){
 const errors=[];
 if(!version||!["academic","general"].includes(version.track))return {ok:false,errors:["Invalid track"]};
 if(!/^[a-z0-9][a-z0-9-]{5,70}$/.test(version.id||""))errors.push("Invalid immutable version ID");
 if(!Array.isArray(version.passages)||version.passages.length!==4)errors.push("Exactly four passages required");
 if(!Array.isArray(version.keys)||version.keys.length!==40)errors.push("Exactly 40 private answers required");
 const passages=Array.isArray(version.passages)?version.passages:[];
 let ng=0;
 passages.forEach((p,i)=>{
  if(p.topic!==TOPICS[version.track][i])errors.push("Passage "+(i+1)+": topic differs from fixed blueprint");
  if(!p.title||!Array.isArray(p.paragraphs)||p.paragraphs.length<2||p.paragraphs.some(x=>typeof x!=="string"||x.trim().length<30))errors.push("Passage "+(i+1)+": insufficient text");
  if(!Array.isArray(p.questions)||p.questions.length!==10){errors.push("Passage "+(i+1)+": exactly ten questions required");return}
  p.questions.forEach((q,j)=>{
   const index=i*10+j,answer=version.keys?.[index];
   if(!Array.isArray(q)||typeof q[1]!=="string"||q[1].trim().length<12)errors.push("Question "+(index+1)+": invalid prompt");
   if(j<6){if(q[0]!=="tf")errors.push("Question "+(index+1)+": must be TFNG");if(answer===2)ng++}
   else if(q[0]!=="mc"||!Array.isArray(q[2])||q[2].length!==3||new Set(q[2]).size!==3||q[2].some(o=>typeof o!=="string"||!o.trim()))errors.push("Question "+(index+1)+": must have three distinct MC options");
   if(!VALID.has(answer))errors.push("Question "+(index+1)+": invalid private key");
  });
 });
 if(ng<8)errors.push("At least eight NOT GIVEN answers required");
 for(let i=0;i<4;i++){const subset=version.keys?.slice(i*10,i*10+6)||[];if(!subset.includes(0)||!subset.includes(1)||!subset.includes(2))errors.push("Passage "+(i+1)+": must include TRUE, FALSE and NOT GIVEN");}
 if(version.approved!==false)errors.push("New versions must start unapproved");
 if(!version.evidence||!Array.isArray(version.evidence)||version.evidence.length!==40)errors.push("40 evidence explanations required");
 else version.evidence.forEach((e,i)=>{if(!e||typeof e.explanation!=="string"||e.explanation.trim().length<25||!["supported","contradicted","unstated","option-supported"].includes(e.verdict))errors.push("Question "+(i+1)+": insufficient evidence rationale");if(version.keys?.[i]===2&&e.verdict!=="unstated")errors.push("Question "+(i+1)+": NOT GIVEN must be marked unstated");});
 return {ok:errors.length===0,errors};
}
