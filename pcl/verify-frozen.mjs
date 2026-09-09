import fs from 'node:fs/promises';
import crypto from 'node:crypto';
for(let unit=2;unit<=14;unit++){
  const manifest=await fs.readFile(`pcl/frozen/unit-${unit}.sha256`,'utf8');
  for(const line of manifest.trim().split('\n')){const [expected,file]=line.split(/  /);const actual=crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');if(actual!==expected)throw Error(`Unit ${unit} seal mismatch: ${file}`)}
}
console.log('PASS: every frozen PCL unit matches its seal manifest.');
