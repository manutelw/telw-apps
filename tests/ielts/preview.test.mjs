import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import preview from '../../workers/ielts/preview.mjs';
import {fixture,withMail} from './support.mjs';
const origin='https://telw-ielts-preview-worker.manutelw.workers.dev';
test('standalone preview contains only matching reading page and blocks other hosts and paths',async()=>{
 const asset=readFileSync(new URL('../../ielts-preview-assets/index.html',import.meta.url),'utf8');
 assert.equal(asset,readFileSync(new URL('../../ielts-reading-diagnostic.html',import.meta.url),'utf8'));
 const env={ASSETS:{fetch:async()=>new Response(asset)}};
 const response=await preview.fetch(new Request(origin+'/ielts/reading/'),env);
 assert.equal(response.status,200);assert.match(await response.text(),/IELTS Reading/);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await preview.fetch(new Request(origin+'/workers/ielts/auth.mjs'),env)).status,404);
 assert.equal((await preview.fetch(new Request('https://manuvikraman.com/ielts/reading/'),env)).status,404);
});
test('preview verification accepts its exact origin, rejects cross origin, and sends a preview-specific link',async()=>{
 const f=fixture(true);await withMail(f,async messages=>{
  const body=JSON.stringify({email:'learner@example.com',consent:true});
  const req=(originHeader)=>new Request(origin+'/api/ielts/auth/request-code',{method:'POST',headers:{origin:originHeader,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body});
  assert.equal((await preview.fetch(req('https://evil.example'),f.env)).status,403);
  assert.equal((await preview.fetch(req('https://manuvikraman.com'),f.env)).status,403);
  assert.equal((await preview.fetch(req(origin),f.env)).status,200);
  assert.match(messages.at(-1).text,/telw-ielts-preview-worker\.manutelw\.workers\.dev/);
 });
});
