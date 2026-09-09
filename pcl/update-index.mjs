import fs from 'node:fs/promises';
import {units} from './units.mjs';
let html=await fs.readFile('index.html','utf8');
const u1='<tr class="live"><td class="num">1</td><td class="name">Professional Experience</td><td class="focus">Present Perfect; experience positioning, standout experience, reassurance and evidence</td><td class="mods"><a href="./module-1-1.html">1.1</a><a href="./module-1-2.html">1.2</a><a href="./module-1-3.html">1.3</a></td></tr>';
const more=Object.entries(units).map(([n,[name,focus]])=>`<tr class="live"><td class="num">${n}</td><td class="name">${name}</td><td class="focus">${focus}</td><td class="mods"><a href="./module-${n}-1.html">${n}.1</a><a href="./module-${n}-2.html">${n}.2</a><a href="./module-${n}-3.html">${n}.3</a></td></tr>`).join('');
html=html.replace(/<tbody>[\s\S]*?<\/tbody>/,`<tbody>${u1}${more}</tbody>`)
  .replace('Select an available module to begin. The remaining units will open as they are built.','Select any module to begin. All 14 units are available.')
  .replace('Green row = available now','All units available')
  .replace(/<script>if\('serviceWorker'[\s\S]*?<\/script>/,'');
await fs.writeFile('index.html',html);
console.log('Updated PCL home with 42 module links.');
