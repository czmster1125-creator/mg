import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,settle,action} from '../server/engine.js';
import {publicState} from '../server/adventure.js';
import {config as C} from '../server/config.js';
import {frontier} from '../shared/hex.js';
import {shellCounts} from '../shared/treasure.js';
const now=Date.UTC(2026,10,11,2);
const fresh=()=>{const s=initialState(now);settle(s,now);s.guide=8;return s;};
const act=(s,t,p={},rng=()=>.8)=>action(s,t,p,now,rng);
function legacy(){const s=fresh();delete s.homeVersion;delete s.supplies;s.parts=11;s.materials=7;s.base=[2,3,4,2,5];s.pending=[0,10.5,4.25,1.75,2.5];s.damage=[false,true,true,false,true];s.bait=0;return s;}
function treasure(bet=1){const s=fresh();act(s,'fishing',{spot:0,bet});return s;}

test('four island homes use four distinct resources; removed fifth home rejects actions',()=>{
 const s=fresh();assert.equal(C.base.length,4);assert.deepEqual(C.base.map(b=>b.resource),['bait','coin','supplies','food']);
 assert.throws(()=>act(s,'base/upgrade',{index:4}),/无效/);assert.throws(()=>act(s,'base/repair',{index:4}),/无需维修/);
 s.coin=10000;for(let i=0;i<5;i++)act(s,'expand',{region:0,tile:frontier(s,0)[0].id});assert.deepEqual(s.base,[1,1,1,1]);assert.equal(s.pending.length,4);
});
test('five-home save settles old rates, preserves stock, higher level and food home, refunds duplicates once',()=>{
 const s=legacy(),coin=s.coin;settle(s,now+3*3600000);
 assert.deepEqual(s.base,[2,3,4,5]);assert.deepEqual(s.damage,[false,true,false,true]);assert.equal(s.supplies,18);assert.equal(s.parts,undefined);assert.equal(s.materials,undefined);
 assert.equal(s.coin,coin+80);assert.equal(s.pending[1],118.5);assert.ok(Math.abs(s.pending[2]-17.4)<1e-9);assert.equal(s.pending[3],6.25);assert.equal(s.bait,30);
 const saved=JSON.stringify(s);settle(s,now+3*3600000);assert.equal(JSON.stringify(s),saved);
});
test('migration preserves above-cap rewards and all duplicate investment at max level',()=>{
 const s=legacy();s.base=[1,1,5,5,1];s.pending=[0,400,300,200,100];s.damage=[false,false,true,true,false];settle(s,now);
 assert.equal(s.homeMigration.refund,1760);assert.equal(s.pending[2],500);assert.equal(s.pending[3],100);assert.equal(s.damage[2],true);
});
test('old unfinished treasure and revealed rewards survive currency migration and finish normally',()=>{
 const s=legacy();s.event={id:'old-treasure',type:'treasure',bet:1,loot:[{materials:2},{parts:3},{food:2},{coin:45},{trap:true},{coin:20}],picks:[{cell:0,reward:{materials:2}},{cell:1,reward:{parts:3}}]};
 settle(s,now);assert.equal(s.event.picks.length,2);assert.deepEqual(s.event.picks[0].reward,{supplies:2});const before=s.supplies,r=act(s,'event/dig',{id:'old-treasure',cell:2});assert.equal(r.total.supplies,5);assert.equal(s.supplies,before+5);assert.equal(s.event,null);
});
test('supplies pay gear and mastery from one balance without charging twice',()=>{
 const s=fresh();s.supplies=13;s.pets.clown={level:5};act(s,'gear/upgrade',{index:0});assert.equal(s.supplies,11);act(s,'pet/mastery',{id:'clown',branch:'economy'});assert.equal(s.supplies,0);
 const coin=s.coin;assert.throws(()=>act(s,'gear/upgrade',{index:1}),/物资不足/);assert.equal(s.coin,coin);
});
test('shell board contains three of each symbol and exposes only revealed symbols',()=>{
 const s=treasure(),e=s.event,p=publicState(s).event;assert.equal(e.board.length,9);for(const n of Object.values(shellCounts(e.board.map(symbol=>({symbol})))))assert.equal(n,3);
 assert.equal(p.board,undefined);assert.equal(p.loot,undefined);assert.equal(p.picks.length,0);assert.ok(p.prizes.pearl.coin>p.prizes.crate.coin);
 const before=JSON.stringify(e);assert.throws(()=>act(s,'fishing',{spot:0,bet:1}),/先完成/);assert.equal(JSON.stringify(e),before);
});
test('third same symbol pays exactly one prize; mixed first three do not finish; reload keeps layout',()=>{
 const s=treasure(),id=s.event.id;s.event.board=['coins','crate','pearl','coins','crate','pearl','coins','crate','pearl'];const before=s.coin,bait=s.bait;
 for(let cell=0;cell<3;cell++)assert.equal(act(s,'event/dig',{id,cell}).type,'shell');assert.equal(s.coin,before);assert.equal(s.event.picks.length,3);
 const saved=JSON.parse(JSON.stringify(s));for(let cell=3;cell<6;cell++)act(saved,'event/dig',{id,cell});const r=act(saved,'event/dig',{id,cell:6});
 assert.equal(r.symbol,'coins');assert.deepEqual(r.matched,[0,3,6]);assert.equal(saved.coin,before+60);assert.equal(saved.bait,bait);assert.equal(saved.event,null);
 assert.throws(()=>act(saved,'event/dig',{id,cell:7}),/已完成/);assert.equal(saved.coin,before+60);
});
test('shell invalid and duplicate picks cannot progress or pay; all three prize routes honor bet',()=>{
 for(const symbol of ['coins','crate','pearl']){
  const s=treasure(5),e=s.event,before={coin:s.coin,supplies:s.supplies,food:s.food};
  for(const cell of [-1,9,1.5,'0'])assert.throws(()=>act(s,'event/dig',{id:e.id,cell}),/未打开/);
  assert.throws(()=>act(s,'event/dig',{id:'forged',cell:0}),/编号/);assert.equal(e.picks.length,0);
  const cells=e.board.flatMap((v,i)=>v===symbol?[i]:[]);act(s,'event/dig',{id:e.id,cell:cells[0]});assert.throws(()=>act(s,'event/dig',{id:e.id,cell:cells[0]}),/未打开/);
  act(s,'event/dig',{id:e.id,cell:cells[1]});const r=act(s,'event/dig',{id:e.id,cell:cells[2]});for(const k of Object.keys(before))assert.equal(s[k],before[k]+r.total[k]);assert.equal(r.total.coin,e.prizes[symbol].coin);
 }
});
test('all random layouts guarantee a prize in at most seven flips; advanced rewards and pet hint snapshot agree',()=>{
 for(let seed=1;seed<=100;seed++){
  let v=seed;const rng=()=>((v=(v*1664525+1013904223)>>>0)/2**32),s=fresh();s.guide=4;act(s,'fishing',{spot:0,bet:1},rng);let n=0;while(s.event){act(s,'event/dig',{id:s.event.id,cell:n++});assert.ok(n<=7);}
 }
 const s=fresh();s.guide=4;s.nodes[0]=[5,5,5,0,0];s.pets.angel={level:10};s.equipped=['angel'];act(s,'fishing',{spot:0,bet:2});assert.equal(s.event.board[s.event.hint],'pearl');assert.equal(s.event.prizes.pearl.food,12);const e=structuredClone(s.event);s.equipped=[];act(s,'event/dig',{id:e.id,cell:0});assert.deepEqual(s.event.prizes,e.prizes);
});
