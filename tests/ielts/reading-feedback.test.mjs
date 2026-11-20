import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {withReadingFeedback} from '../../workers/ielts/reading-feedback.mjs';
test('Reading presentation uses the shared concise feedback and preserves its verified scoring and timer',()=>{
 const html=withReadingFeedback(readFileSync(new URL('./reading-page.fixture.html',import.meta.url),'utf8'));
 assert.match(html,/id="diagnosticTarget"/);assert.match(html,/function compactFeedback/);assert.match(html,/compactFeedback\(\{skill:"Reading",track,score:scored/);assert.doesNotMatch(html,/const ranges=track|Your recommended areas for improvement|What your answers show/);
 assert.match(html,/await fetch\("\/api\/ielts\/reading\/submit"/);assert.match(html,/timeoutSubmitTried/);assert.match(html,/ieltsIdentityScript/);
 for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});

test('Reading feedback still runs when the bundler wraps functions in __name, and shows only the WhatsApp number',()=>{
 const old='<div id="telwCall" hidden><p><strong>Thank you for your interest.</strong> Please call TELW The English Workshop on <a href="tel:+919211392003"><strong>9211392003</strong></a> and ask about IELTS Reading classes.</p></div><script>"use strict";let attemptId="";const x=err=>err.message+" You can still call TELW on 9211392003.";</script>';
 const page=withReadingFeedback(readFileSync(new URL('./reading-page.fixture.html',import.meta.url),'utf8').replace('<section id="result"',old+'<section id="result"'));
 assert.doesNotMatch(page,/9211392003|Please call TELW/);assert.match(page,/wa\.me\/919717116831/);
 const script=[...page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function compactFeedback'));
 const start=script.indexOf('var __name'),end=script.indexOf(';"use strict";let attemptId');
 assert.ok(start>=0&&end>start);
 const ctx={};vm.createContext(ctx);vm.runInContext(script.slice(start,end)+';this.out=compactFeedback({skill:"Reading",track:"academic",score:{correct:22,answered:40,types:[]}});',ctx);
 assert.match(ctx.out,/Band/);
 // The deploy bundler wraps inner functions in __name(...); the shim must make that harmless.
 const ctx2={};vm.createContext(ctx2);vm.runInContext('var __name=globalThis.__name||(f=>f);function f(){const g=/* @__PURE__ */ __name(x=>x+1,"g");return g(1)};this.out=f();',ctx2);assert.equal(ctx2.out,2);
});
