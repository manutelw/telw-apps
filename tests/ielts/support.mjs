import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleAuth} from '../../workers/ielts/auth.mjs';
const base = 'https://manuvikraman.com';
export function fixture(reading = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const name of ['0001_diagnostic_state.sql','0002_verified_identity.sql'])
    sqlite.exec(readFileSync(new URL('../../migrations/ielts/'+name,import.meta.url),'utf8'));
  if(reading) sqlite.exec(readFileSync(new URL('../../migrations/ielts/0003_reading_attempts.sql',import.meta.url),'utf8'));
  const db = {
    prepare(sql) {
      const statement = {args:[], bind(...args) { this.args=args; return this; },
        async first() { return sqlite.prepare(sql).get(...this.args) ?? null; },
        async run() { const r=sqlite.prepare(sql).run(...this.args); return {success:true,meta:{changes:r.changes}}; }
      }; return statement;
    },
    async batch(statements) {
      sqlite.exec('BEGIN'); try { const results=[]; for (const s of statements) results.push(await s.run()); sqlite.exec('COMMIT'); return results; }
      catch(e) { sqlite.exec('ROLLBACK'); throw e; }
    }
  };
  const env = {IELTS_DB:db,IELTS_AUTH_SECRET:'test-only-secret-which-is-long-enough',RESEND_API_KEY:'test-not-a-real-key',TELW_FROM_EMAIL:'TELW <test@example.com>'};
  const request = (route, body, headers={}, method='POST') => new Request(base+'/api/ielts/auth/'+route, {
    method,headers:{origin:base,'content-type':'application/json','cf-connecting-ip':'192.0.2.1',...headers},
    ...(method==='POST'?{body:JSON.stringify(body)}:{})
  });
  return {sqlite,env,request};
}
export async function withMail(f, fn) {
  const original = globalThis.fetch; const messages=[];
  globalThis.fetch=async (url, options)=>{
    assert.equal(url,'https://api.resend.com/emails');
    messages.push(JSON.parse(options.body)); return new Response('{}',{status:200});
  };
  try { await fn(messages); } finally { globalThis.fetch=original; f.sqlite.close(); }
}
export async function login(f, messages, email='learner@example.com') {
  const sent=await handleAuth(f.request('request-code',{email,consent:true}),f.env);
  assert.equal(sent.status,200); const data=await sent.json();
  const code=messages.at(-1).text.match(/code is (\d{8})/)[1];
  const response=await handleAuth(f.request('verify-code',{challengeId:data.challengeId,code}),f.env);
  return {response,data,code,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
