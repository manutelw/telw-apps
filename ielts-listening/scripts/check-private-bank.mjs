// Run locally against the separately supplied confidential trainer bundle.
import {readFileSync} from 'node:fs';
import {validateBank,splitBank,scoreAnswers} from '../server/bank.mjs';
const path=process.argv[2];
if(!path)throw Error('Usage: node scripts/check-private-bank.mjs /absolute/private-bank.json');
const bank=JSON.parse(readFileSync(path,'utf8')),validation=validateBank(bank);
if(!validation.ok)throw Error(JSON.stringify(validation));
const split=splitBank(bank),answers=Object.fromEntries(bank.parts.flatMap(p=>p.key.map(k=>[k.id,k.accepted[0]])));
const score=scoreAnswers(split.public,split.private,answers);
if(score.correct!==40)throw Error('The canonical answer key does not score 40/40.');
if(/"(turns|key|accepted|evidence|normalizer)"/.test(JSON.stringify(split.public)))throw Error('Private material leaked into the candidate bundle.');
console.log(JSON.stringify({id:bank.id,parts:bank.parts.length,questions:40,canonicalKeyScore:score.correct,reviewStatus:bank.reviewStatus,audioValidated:false}));
