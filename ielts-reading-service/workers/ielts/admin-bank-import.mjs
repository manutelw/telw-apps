// Preview-only, trainer-authenticated batch loading. This module contains no
// question content or answer keys. Production imports retain the editorial gate.
import {requireSameOrigin,digest,limit} from './auth.mjs';
import {validateVersion} from '../../tools/ielts-reading-bank-validator.mjs';
export const PREVIEW_IMPORT_ORIGIN='https://telw-ielts-preview-worker.manutelw.workers.dev';
const MAX_BYTES=1024*1024;
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const canonical=value=>JSON.stringify(sort(value));
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));return value;}
async function readUpload(request){
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data;'))throw fail('Choose the private JSON collection file.',415);
 if(Number(request.headers.get('content-length'))>MAX_BYTES)throw fail('Collection file is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw fail('Choose a collection file.');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw fail('Collection file is too large.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let form;try{form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')}}).formData();}catch{throw fail('The upload could not be read.');}
 if(form.get('previewConsent')!=='on')throw fail('Confirm that this collection is for preview testing.');
 const file=form.get('collection');if(!file||typeof file.text!=='function'||!file.name?.toLowerCase().endsWith('.json'))throw fail('Choose the private JSON collection file.');
 let bundle;try{bundle=JSON.parse(await file.text());}catch{throw fail('The collection is not valid JSON.');}
 return bundle;
}
export async function importPreviewBanks(request,env,learner){
 if(env.IELTS_PREVIEW_BANK_IMPORT!==PREVIEW_IMPORT_ORIGIN)throw fail('Preview import is unavailable here.',404);
 requireSameOrigin(request);
 const now=Math.floor(Date.now()/1000);
 await limit(env,'reading-bank-import:'+learner.id,3600,10,now);
 const bundle=await readUpload(request);
 if(bundle?.format!=='telw-reading-preview-v1'||bundle.reviewStatus!=='independent-review-pending'||!Array.isArray(bundle.versions)||bundle.versions.length!==10)throw fail('Choose the complete collection: five Academic and five General Training sets.');
 const seenIds=new Set(),passageTexts=new Set(),prompts=new Set(),counts={academic:0,general:0};
 const prepared=[];
 for(const version of bundle.versions){
  let check;try{check=validateVersion(version);}catch{throw fail('A question set has an invalid format.');}
  if(!check.ok)throw fail('A question set failed validation: '+check.errors.slice(0,3).join('; '));
  if(seenIds.has(version.id))throw fail('The collection contains a repeated set ID.');seenIds.add(version.id);counts[version.track]++;
  for(const p of version.passages){const text=p.paragraphs.join('\n').trim().toLowerCase();if(passageTexts.has(text))throw fail('The collection contains a repeated passage.');passageTexts.add(text);for(const q of p.questions){const prompt=q[1].trim().toLowerCase();if(prompts.has(prompt))throw fail('The collection contains a repeated question.');prompts.add(prompt);}}
  const content={passages:version.passages.map(p=>({topic:p.topic,title:p.title,paragraphs:p.paragraphs,questions:p.questions}))};
  const review={decision:'preview-testing-only',independentReview:'pending',loadedAt:now,loadedBy:learner.email,sha256:await digest(canonical(version))};
  prepared.push({id:'preview-'+version.id,track:version.track,content,key:{keys:version.keys,evidence:version.evidence,review}});
 }
 if(counts.academic!==5||counts.general!==5)throw fail('The collection must contain five sets for each test type.');
 const existing=(await env.IELTS_DB.prepare("SELECT id,skill,track,content_json,private_key_json FROM ielts_test_versions").all()).results||[];
 const byId=new Map(existing.map(x=>[x.id,x]));const inserts=[];let unchanged=0;
 for(const v of prepared){
  const old=byId.get(v.id);
  if(old){const key=JSON.parse(old.private_key_json||'{}');if(old.skill!=='reading'||old.track!==v.track||canonical(JSON.parse(old.content_json))!==canonical(v.content)||canonical(key.keys)!==canonical(v.key.keys)||canonical(key.evidence)!==canonical(v.key.evidence))throw fail('A stored set has different content. No sets were changed. Use a new version ID.',409);unchanged++;continue;}
  inserts.push(env.IELTS_DB.prepare("INSERT INTO ielts_test_versions(id,skill,track,approved_at,content_json,private_key_json,created_at) VALUES(?1,'reading',?2,?3,?4,?5,?3)").bind(v.id,v.track,now,JSON.stringify(v.content),JSON.stringify(v.key)));
 }
 // D1 batch is transactional: either all missing versions are loaded, or none.
 if(inserts.length)await env.IELTS_DB.batch(inserts);
 return {loaded:inserts.length,unchanged};
}
