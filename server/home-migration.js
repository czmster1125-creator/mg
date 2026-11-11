import {BANK_RATES,UPGRADE_COSTS,bonuses} from '../shared/adventure.js';

function mergeResources(reward){
 if(!reward)return;
 if('parts' in reward||'materials' in reward){reward.supplies=(reward.supplies||0)+(reward.parts||0)+(reward.materials||0);delete reward.parts;delete reward.materials;}
}

// Settle the old five-building economy first, so a long absence is never
// charged at a newly merged level. The marker makes replaying a save harmless.
export function migrateHome(s,now,fish){
 if(s.homeVersion>=2)return;
 if(s.base.length===5){
  const hours=Math.min(Math.max(now-s.lastSettle,0),43200000)/3600000;
  const b=bonuses(s,fish),oldRates=[5*s.base[0],BANK_RATES[s.base[1]]*(1+b.gold+b.bank),1.5*s.base[2],.4*s.base[3],.5*s.base[4]];
  for(let i=1;i<5;i++){
   const rate=oldRates[i]*(s.damage?.[i]?.5:1),pending=s.pending[i]||0;
   s.pending[i]=Math.min(Math.max(pending,rate*12),pending+hours*rate);
  }
  if(s.bait<50){const v=(s.baitFraction||0)+hours*oldRates[0],n=Math.floor(v);s.bait=Math.min(50,s.bait+n);s.baitFraction=s.bait>=50?0:v-n;}else s.baitFraction=0;
  const levels=[s.base[2],s.base[3]],duplicate=Math.min(...levels);
  const refund=UPGRADE_COSTS.slice(1,duplicate).reduce((a,b)=>a+b,0);
  const damaged=levels.some(Boolean)&&levels.every((lv,j)=>!lv||s.damage?.[j+2]);
  s.base=[s.base[0],s.base[1],Math.max(...levels),s.base[4]];
  s.pending=[0,s.pending[1],s.pending[2]+s.pending[3],s.pending[4]];
  s.damage=[false,!!s.damage?.[1],!!damaged,!!s.damage?.[4]];
  s.coin+=refund;s.homeMigration={refund};s.lastSettle=Math.max(s.lastSettle,now);
 }
 mergeResources(s);s.supplies??=0;
 // A treasure may be saved between picks; preserve both hidden and revealed loot.
 if(s.event?.type==='treasure'){
  s.event.loot?.forEach(mergeResources);
  s.event.picks?.forEach(p=>mergeResources(p.reward));
 }
 s.homeVersion=2;
}
