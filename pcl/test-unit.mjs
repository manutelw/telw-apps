import fs from 'node:fs/promises';
import {moduleContent} from './units.mjs';
const unit=Number(process.argv[2]);
if(!(unit>=2&&unit<=14))throw Error('Usage: node pcl/test-unit.mjs UNIT');
const forbidden=[/serviceWorker/i,/speechSynthesis/i,/heygen/i,/localStorage/i,/indexedDB/i,/download\s*=/i,/\/ascent\//i];
for(let kp=1;kp<=3;kp++){
  const id=`${unit}.${kp}`,s=moduleContent(id),file=`module-${unit}-${kp}.html`,html=await fs.readFile(file,'utf8');
  const must=['1 · Learn','2 · Check','3 · Monologue','4 · Dialogue','5 · Opinion','6 · Review','Direct Answer','Explain','Business Link','Judgement','Voice, suprasegmentals & pronunciation',`const MODULE="${id}"`];
  for(const x of must)if(!html.includes(x))throw Error(`${file}: missing ${x}`);
  if((html.match(/class="q"/g)||[]).length!==3)throw Error(`${file}: comprehension count is not 3`);
  if((html.match(/<div class="step(?: active)?"/g)||[]).length!==6)throw Error(`${file}: flow count is not 6`);
  if((html.match(/<div><b>[^<]+<\/b><span>Use this chunk/g)||[]).length!==5)throw Error(`${file}: vocabulary count is not 5`);
  for(const re of forbidden)if(re.test(html))throw Error(`${file}: forbidden ${re}`);
  for(const audio of [...s.audio,...s.modelAudio]){
    const b=await fs.readFile(audio);
    const framed=b[0]===0xff&&(b[1]&0xe0)===0xe0;
    if(b.length<1000||!(b.subarray(0,3).toString()==='ID3'||framed))throw Error(`${audio}: invalid MP3`);
  }
}
console.log(`PASS Unit ${unit}: flow, pedagogy, runtime contract and static audio.`);
