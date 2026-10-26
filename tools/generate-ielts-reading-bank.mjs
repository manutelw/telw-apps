// Offline authoring only: OPENAI_API_KEY=... node tools/generate-ielts-reading-bank.mjs general
// Generates a DRAFT file for human review. Never auto-publishes or sends answer keys to learners.
import {writeFile,mkdir} from 'node:fs/promises';
import {TOPICS,validateVersion} from './ielts-reading-bank-validator.mjs';
const track=process.argv[2];
if(!TOPICS[track])throw Error('Usage: node tools/generate-ielts-reading-bank.mjs academic|general');
if(!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY is required in the local environment');
const id=track+'-'+new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
const blueprint={id,track,topics:TOPICS[track],passages:4,questionsPerPassage:10,tfngPerPassage:6,multipleChoicePerPassage:4,minimumNotGiven:8};
const instructions=`You are an expert IELTS Reading item writer. Create one ORIGINAL, uncalibrated screening test in strict JSON. Do not copy copyrighted IELTS passages. Preserve the four fixed topics and order in the blueprint. Each passage must be original, coherent, substantial and appropriate to the track. Include exactly 10 questions per passage: 6 TRUE/FALSE/NOT GIVEN (type "tf") and 4 multiple-choice (type "mc", three distinct options). Use numeric answers: TRUE=0, FALSE=1, NOT GIVEN=2; MC is the 0-based option index. Ensure at least 2 genuinely NOT GIVEN questions per passage; the missing claim must be neither entailed nor contradicted by the passage. Make distractors plausible and avoid ambiguity. Include an explanation and verdict for every question: supported/contradicted/unstated for TFNG and option-supported for MC. Evidence is a rationale, not a fabricated quote. Return JSON object with id, track, approved:false, passages:[{topic,title,paragraphs:[strings],questions:[["tf",prompt] or ["mc",prompt,[option1,option2,option3]]]}], keys:[40 integers], evidence:[{verdict,explanation}]. Do not include any other text.`;
const res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.IELTS_GENERATOR_MODEL||'gpt-4.1',temperature:0.3,response_format:{type:'json_object'},messages:[{role:'system',content:instructions},{role:'user',content:JSON.stringify(blueprint)}]})});
if(!res.ok)throw Error('OpenAI generation failed: HTTP '+res.status+' '+(await res.text()).slice(0,400));
const body=await res.json();let draft;try{draft=JSON.parse(body.choices[0].message.content)}catch{throw Error('Model did not return valid JSON')}
draft.id=id;draft.track=track;draft.approved=false;
const verdict=validateVersion(draft);
await mkdir('ielts-reading-drafts',{recursive:true});
const path='ielts-reading-drafts/'+id+'.json';
await writeFile(path,JSON.stringify({...draft,validation:verdict},null,2)+'\n',{flag:'wx'});
console.log('Draft written:',path,'validation:',verdict.ok?'PASS':'FAIL',verdict.errors.join('; '));
if(!verdict.ok)process.exitCode=1;
// PASS only verifies structure and declared rationales. Independent editorial
// verification is required for factual support, ambiguity, level and equivalence.
