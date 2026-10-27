// Offline approval gate. Produces PRIVATE SQL only; does not contact D1 or deploy.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateVersion} from './ielts-reading-bank-validator.mjs';
export const REVIEW_CHECKS=['allAnswersChecked','notGivenChecked','ambiguityChecked','levelAndComparabilityChecked'];
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
export function buildImport(raw,review,now=Math.floor(Date.now()/1000)) {
 const draft=JSON.parse(raw),validation=validateVersion(draft);
 if(!validation.ok)throw Error(validation.errors.join('; '));
 const hash=createHash('sha256').update(raw).digest('hex');
 if(review?.decision!=='approved'||review.reviewedSha256!==hash)throw Error('Review must approve these exact draft bytes.');
 if(typeof review.author!=='string'||typeof review.reviewer!=='string'||review.author.trim().length<3||review.reviewer.trim().length<3||review.author.trim().toLowerCase()===review.reviewer.trim().toLowerCase())throw Error('An independent named reviewer is required.');
 if(REVIEW_CHECKS.some(k=>review.checks?.[k]!==true))throw Error('All independent editorial checks must be confirmed.');
 if(!Number.isSafeInteger(review.approvedAt)||review.approvedAt<=0||review.approvedAt>now)throw Error('Invalid approval time.');
 const content={passages:draft.passages.map(p=>({topic:p.topic,title:p.title,paragraphs:p.paragraphs,questions:p.questions}))};
 const key={keys:draft.keys,evidence:draft.evidence,review};
 return '-- PRIVATE: contains answer keys; never publish as a static asset.\n'+
 'INSERT INTO ielts_test_versions(id,skill,track,approved_at,content_json,private_key_json,created_at) VALUES ('+
 [quote(draft.id),quote('reading'),quote(draft.track),review.approvedAt,quote(JSON.stringify(content)),quote(JSON.stringify(key)),now].join(',')+');\n';
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const [draftPath,reviewPath,outputPath]=process.argv.slice(2);
 if(!draftPath||!reviewPath||!outputPath)throw Error('Usage: node tools/ielts-reading-import-bank.mjs draft.json independent-review.json private-output.sql');
 const raw=await readFile(draftPath,'utf8'),review=JSON.parse(await readFile(reviewPath,'utf8'));
 await writeFile(outputPath,buildImport(raw,review),{flag:'wx',mode:0o600});
 console.log('Private approved import prepared. It has NOT been applied or published.');
}
