import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,settle,action} from '../server/engine.js';
import {proof} from './manual-helper.js';
const now=Date.UTC(2026,10,11,2);
const fresh=()=>{const s=initialState(now);settle(s,now);s.guide=8;return s;};
const act=(s,type,p={},time=now,rng=()=>.001)=>action(s,type,p,time,rng);
function encounter(bet=1){const s=fresh(),r=act(s,'fishing',{spot:1,bet,challenge:true});assert.equal(r.type,'rare');return s;}

test('ordinary fish land directly; rare toggle off lands the same reserved species with one bait cost',()=>{
 const ordinary=fresh(),r=act(ordinary,'fishing',{spot:1,bet:1,challenge:true},now,()=>.4);assert.ok(r.fish);assert.equal(ordinary.manual,null);assert.equal(ordinary.bait,39);
 const rare=fresh(),out=act(rare,'fishing',{spot:1,bet:1,challenge:false});assert.equal(out.fish[0].species,'sunfish');assert.equal(rare.manual,null);assert.equal(rare.bait,39);assert.equal(rare.catchCount,1);
});
test('rare encounter reserves exact batch, debits bet once and blocks rerolls and unrelated actions',()=>{
 const s=encounter(5);assert.equal(s.bait,35);assert.equal(s.catchCount,0);assert.equal(s.coin,350);assert.equal(s.manual.pendingFish.length,5);
 const pending=structuredClone(s.manual);for(const type of ['fishing','manual/start','zone','pet/feed'])assert.throws(()=>act(s,type,{spot:0,bet:1,zone:1}),/当前手动挑战/);assert.deepEqual(s.manual,pending);
 act(s,'manual/engage',{session:pending.id},now+3000);assert.equal(s.bait,35);assert.throws(()=>act(s,'manual/engage',{session:pending.id},now+4000),/不能重置/);
});
test('guaranteed landing survives reload, pays once, advances catch objectives and keeps the original fish',()=>{
 const s=encounter(2),copy=JSON.parse(JSON.stringify(s)),pending=copy.manual.pendingFish,id=copy.manual.id;
 const r=act(copy,'manual/auto',{session:id});assert.deepEqual(r.fish,pending);assert.equal(r.guaranteed,true);assert.equal(copy.coin,350+pending.reduce((n,f)=>n+f.price,0));assert.equal(copy.catchCount,2);assert.equal(copy.orders.counts.catch,2);assert.equal(copy.bait,38);
 assert.throws(()=>act(copy,'manual/auto',{session:id}),/已结束/);assert.equal(copy.catchCount,2);
});
test('rare challenge success requires valid replay and adds 20 percent once without reroll or bait charge',()=>{
 const s=encounter(),m=structuredClone(s.manual);act(s,'manual/engage',{session:m.id},now+2000);
 assert.throws(()=>act(s,'manual/finish',{session:m.id,success:true},now+14000),/校验/);assert.equal(s.coin,350);
 const r=act(s,'manual/finish',{session:m.id,success:true,...proof(m.profile)},now+20000);assert.deepEqual(r.fish,m.pendingFish);assert.equal(r.bonus,Math.floor(r.fish[0].price*.2));assert.equal(s.coin,350+r.fish[0].price+r.bonus);assert.equal(s.bait,39);assert.equal(s.catchCount,1);
 assert.throws(()=>act(s,'manual/finish',{session:m.id,success:true,...proof(m.profile)},now+21000),/已结束/);
});
test('miss, exit and server expiry all land the reserved fish at base value',()=>{
 for(const mode of ['failure','cancel','expiry']){const s=encounter(),m=structuredClone(s.manual);if(mode==='expiry')settle(s,now+61000);else act(s,mode==='cancel'?'manual/cancel':'manual/finish',{session:m.id,success:false},now+4000);
  assert.equal(s.manual,null);assert.equal(s.catchCount,1);assert.equal(s.coin,350+m.pendingFish[0].price);assert.equal(s.pets.sunfish.level,1);const before=s.coin;settle(s,now+62000);assert.equal(s.coin,before);
 }
});
test('forged session and challenge setting cannot spend resources or replace a reserved catch',()=>{
 const s=fresh();assert.throws(()=>act(s,'fishing',{spot:1,bet:1,challenge:'yes'}),/设置无效/);assert.equal(s.bait,40);
 const c=encounter(),m=JSON.stringify(c.manual);for(const type of ['manual/engage','manual/auto','manual/cancel'])assert.throws(()=>act(c,type,{session:'wrong'}));assert.equal(JSON.stringify(c.manual),m);assert.equal(c.coin,350);
});
