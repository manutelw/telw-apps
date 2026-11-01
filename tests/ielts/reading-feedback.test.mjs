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
