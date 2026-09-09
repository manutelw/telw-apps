import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {moduleContent} from './units.mjs';
const unit=Number(process.argv[2]);
if(!(unit>=2&&unit<=14))throw Error('Usage: node pcl/freeze-unit.mjs UNIT');
const files=[];
for(let kp=1;kp<=3;kp++){const s=moduleContent(`${unit}.${kp}`);files.push(`module-${unit}-${kp}.html`,...s.audio,...s.modelAudio)}
files.sort();
const lines=[];
for(const file of files){const b=await fs.readFile(file);lines.push(`${crypto.createHash('sha256').update(b).digest('hex')}  ${file}`)}
await fs.mkdir('pcl/frozen',{recursive:true});
await fs.writeFile(`pcl/frozen/unit-${unit}.sha256`,lines.join('\n')+'\n');
console.log(`FROZEN Unit ${unit}: ${files.length} files.`);
