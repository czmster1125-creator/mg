import {initialState,settle,action} from '../server/engine.js';
import {frontier,owned} from '../shared/hex.js';
import {ORDER_DEFS} from '../shared/orders.js';
import {BANK_RATES,UPGRADE_COSTS} from '../shared/adventure.js';
import {config as C} from '../server/config.js';
function run(seed){let random=seed;const rng=()=>((random=(random*1664525+1013904223)>>>0)/4294967296);let now=Date.UTC(2026,10,11,2);const s=initialState(now);s.guide=8;const act=(type,p={})=>action(s,type,p,now,rng);let casts=0,spent=0,empty=0,repairs=0;const sessions=[];
 for(let session=0;session<3;session++){
  if(session)now+=3600000;settle(s,now);
  if(s.pending.slice(1).some(n=>n>=1))act('base/collect');
  for(let step=0;step<60;step++){
   if(s.bait<1){empty++;break;}spent++;casts++;act('fishing',{bet:1,spot:0});
   if(s.event?.type==='attack')act('event/attack',{id:s.event.id,target:0});
   if(s.event?.type==='raid'){const id=s.event.id;act('event/infiltrate',{id});while(s.event)act('event/steal',{id,route:0});}
   if(s.event?.type==='encounter')act('event/encounter',{id:s.event.id,choice:'leave'});
   if(s.event?.type==='treasure'){const id=s.event.id;for(let cell=0;cell<3;cell++)act('event/dig',{id,cell});}
   for(const d of ORDER_DEFS)if(s.orders.counts[d.id]>=d.target&&!s.orders.claimed.includes(d.id))act('orders/claim',{id:d.id});
   for(let i=1;i<5;i++)if(s.damage[i]&&s.coin>=20*s.base[i]){act('base/repair',{index:i});repairs++;}
   const region=Math.min(C.regions.length-1,C.regions.findIndex((_,i)=>owned(s,i).length<25)<0?C.regions.length-1:C.regions.findIndex((_,i)=>owned(s,i).length<25)),n=owned(s,region).length,cost=C.buildCosts[Math.floor(n/5)]*(region+1),materials=n>=10&&(n+1)%5===0?2:0;
   if(n<25&&s.coin>=cost&&s.materials>=materials)act('expand',{region,tile:frontier(s,region)[0].id});
   now+=12000;
  }
  sessions.push({session:session+1,casts,land:owned(s,0).length,secondIsland:owned(s,1).length,coin:s.coin,bait:s.bait,materials:s.materials,food:s.food});
 }
 return {seed,casts,spent,empty,repairs,sessions};
}
const report={buildCosts:C.buildCosts,milestoneBait:[10,10,10,10,30],model:'20 deterministic seeds; 3 sessions × up to 60 casts, 1 hour between sessions; x1, safe raids, bank attacks, expand-first, daily rewards; no pets, no bank upgrades, no advertisements',bankIncrementalPaybackHours:[1,2,3,4].map(l=>+(UPGRADE_COSTS[l]/(BANK_RATES[l+1]-BANK_RATES[l])).toFixed(2)),runs:Array.from({length:20},(_,i)=>run(i+1))};
report.summary={secondIslandAfter180:[Math.min(...report.runs.map(r=>r.sessions[2].secondIsland)),Math.max(...report.runs.map(r=>r.sessions[2].secondIsland))],firstSessionLandRange:[Math.min(...report.runs.map(r=>r.sessions[0].land)),Math.max(...report.runs.map(r=>r.sessions[0].land))],castsRange:[Math.min(...report.runs.map(r=>r.casts)),Math.max(...report.runs.map(r=>r.casts))],totalEmptySessionStops:report.runs.reduce((n,r)=>n+r.empty,0)};
console.log(JSON.stringify(report,null,2));
