import {initialState,settle,action} from '../server/engine.js';import {VOYAGE_STEPS,SHORE_STYLES,featureStatus,festivalOn} from '../shared/expedition.js';import {ORDER_DEFS} from '../shared/orders.js';import {weeklyDefs} from '../shared/weekly.js';import {config as C} from '../server/config.js';import {frontier} from '../shared/hex.js';import {writeFileSync} from 'node:fs';
const start=Date.UTC(2026,10,12,0),results=[];
for(const late of [false,true])for(const updated of [false,true])for(let seed=1;seed<=8;seed++){
 let random=seed;const rng=()=>((random=(Math.imul(random,1664525)+1013904223)>>>0)/4294967296);const s=initialState(start);settle(s,start);s.guide=8;if(late){s.nodes=C.regions.map(()=>[5,5,5,5,5]);s.base=[5,5,5,5];s.gear=[10,10,10];s.unlocked=[0,1,2,3,4,5];s.zone=5;s.coin=10000;s.supplies=100;}
 let casts=0,drySessions=0,featureUses=0,themeBait=0,appearanceSpend=0,festivalSpend=0;const daily=[];
 for(let day=0;day<14;day++){
  for(let session=0;session<2;session++){
   const time=start+day*86400000+session*43200000;settle(s,time);const act=(type,p={})=>action(s,type,p,time,rng);if(s.pending.slice(1).some(v=>v>=1))act('base/collect');
   for(let i=0;i<40;i++){
    if(s.bait<1){drySessions++;break;}const special=updated&&featureStatus(s).ready;let r=act('fishing',{spot:1,bet:1,challenge:false,...(special?{feature:true}:{})});casts++;if(special)featureUses++;
    const e=s.event;if(e?.type==='attack')act('event/attack',{id:e.id,target:casts%3});else if(e?.type==='raid'){act('event/infiltrate',{id:e.id});act('event/steal',{id:e.id,route:0});if(s.event)act('event/bank',{id:e.id});}else if(e?.type==='treasure'){for(let cell=0;cell<12&&s.event;cell++)act('event/dig',{id:e.id,cell});}else if(e?.type==='sea-game')act('event/sea-return',{id:e.id});else if(e?.type==='encounter')act('event/encounter',{id:e.id,choice:'leave',stage:e.stage});
    for(const d of ORDER_DEFS)if(s.orders.counts[d.id]>=d.target&&!s.orders.claimed.includes(d.id))act('orders/claim',{id:d.id});
    if(updated)for(let j=0;j<VOYAGE_STEPS.length;j++)if(s.voyage.points>=VOYAGE_STEPS[j].at&&!s.voyage.claimed.includes(j)){themeBait+=VOYAGE_STEPS[j].reward.bait||0;act('voyage/claim',{index:j,week:s.voyage.week});}
    if(!late){const count=s.nodes[0].reduce((a,b)=>a+b,0),cost=C.buildCosts[Math.floor(count/5)];if(count<25&&s.coin>=cost+100&&s.supplies>2)act('expand',{region:0,tile:frontier(s,0)[0].id});}
   }
   for(const d of weeklyDefs(s.weekly))if(s.weekly.counts[d.id]>=d.target&&!s.weekly.claimed.includes(d.id))act('weekly/claim',{id:d.id});
   if(updated&&late)for(const d of SHORE_STYLES)if(!d.weekly&&d.coin&&!s.shoreStyles.includes(d.id)&&s.coin>=d.coin+5000&&s.supplies>=d.supplies+10){act('shore/buy',{id:d.id});appearanceSpend+=d.coin;}
   if(updated&&late)for(let r=0;r<6;r++){const coin=5000*(r+1),supplies=10*(r+1);if(!festivalOn(s,r)&&s.coin>=coin+5000&&s.supplies>=supplies+10){act('shore/festival',{region:r});festivalSpend+=coin;}}
  }
  daily.push({day:day+1,coin:s.coin,bait:s.bait,supplies:s.supplies,food:s.food,land:s.nodes[0].reduce((a,b)=>a+b,0)});
 }
 results.push({scenario:late?'max-buildings-and-gear':'first-island',updated,seed,casts,drySessions,featureUses,themeBait,appearanceSpend,festivalSpend,paidStyles:s.shoreStyles.filter(x=>SHORE_STYLES.find(d=>d.id===x&&d.coin)).length,daily});
}
const summary=[];for(const scenario of ['first-island','max-buildings-and-gear'])for(const updated of [false,true]){const rows=results.filter(r=>r.scenario===scenario&&r.updated===updated),range=fn=>{const a=rows.map(fn);return [Math.min(...a),Math.max(...a)];};summary.push({scenario,updated,casts:range(r=>r.casts),themeBait:range(r=>r.themeBait),featureUses:range(r=>r.featureUses),appearanceSpend:range(r=>r.appearanceSpend),festivalSpend:range(r=>r.festivalSpend),day14Coins:range(r=>r.daily.at(-1).coin),day14Supplies:range(r=>r.daily.at(-1).supplies),day14Food:range(r=>r.daily.at(-1).food)});}
const report={assumptions:['8 deterministic seeds per scenario; 14 days, two logins 12 hours apart, up to 40 casts each','same level-1 recovery in first-island scenarios; late scenarios start with max buildings and gear and the final sea','immediate claim of available daily, weekly and updated voyage rewards; no chapter/collection/captain claims, no ads/payment or cooperative reward','one safe NPC raid attempt, then retreat; shell cells opened sequentially; no hidden-board knowledge','updated uses region ability whenever ready; appearance purchases and available weekly island festivals only in late scenario with a 5000-coin reserve','this checks bounded progress, reward budgets and accumulation; it is not a retention or final economy measurement'],summary,results};writeFileSync('docs/BALANCE_V015.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
