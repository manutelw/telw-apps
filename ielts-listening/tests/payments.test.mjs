import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {fixture} from './support.mjs';

test('once charging is on, a learner needs a paid Listening credit; the trainer does not',()=>fixture(async f=>{
 await f.install();
 const pay=new DatabaseSync(':memory:');
 pay.exec(readFileSync(new URL('../../ielts-pay/migrations/0001_payments.sql',import.meta.url),'utf8'));
 pay.exec(`UPDATE ielts_pay_settings SET value='on'`);
 f.env.PAY_DB={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return pay.prepare(sql).get(...this.args)||null;},async run(){return pay.prepare(sql).run(...this.args);}};}};
 const user=await f.login();
 const blocked=await f.api('start',{},user.cookie);
 assert.equal(blocked.status,402);assert.match((await blocked.json()).error,/ielts\/pay/);
 pay.exec(`INSERT INTO ielts_pay_orders(id,email,product,amount,status,created_at) VALUES('order_a','learner@example.com','listening',24900,'paid',1)`);
 pay.exec(`INSERT INTO ielts_pay_credits(id,order_id,email,skill,created_at,expires_at) VALUES('c1','order_a','learner@example.com','listening',1,9999999999)`);
 const started=await (await f.api('start',{},user.cookie)).json();
 assert.ok(started.attemptId);assert.equal(pay.prepare('SELECT used_ref FROM ielts_pay_credits').get().used_ref,'listening:'+started.attemptId);
 const again=await (await f.api('start',{},user.cookie)).json();
 assert.equal(again.attemptId,started.attemptId,'resuming needs no second credit');
 f.advance(3700);const trainer=await f.login('manutelw@gmail.com');
 assert.equal((await f.api('start',{},trainer.cookie)).status,200);
}));
