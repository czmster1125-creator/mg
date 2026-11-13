import {ENCOUNTERS} from '../shared/encounters.js';
import {settle,action} from '../server/engine.js';
import {legacyState as initialState} from '../tests/legacy-state.js';import{zoneOpen}from'../shared/content.js';import{config as C}from'../server/config.js';import{owned,frontier}from'../shared/hex.js';import{CHAPTERS,chapterReady,journeyValues}from'../shared/journey.js';import{weeklyDefs}from'../shared/weekly.js';import{ORDER_DEFS}from'../shared/orders.js';
function run(seed){let state=seed;const rng=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);const start=Date.UTC(2026,10,11,2),s=initialState(start);s.guide=8;let now=start,casts=0,stops=0;const history=[],act=(t,p={})=>action(s,t,p,now,rng);
 for(let day=0;day<30;day++){
  for(let session=0;session<2;session++){
   now=start+day*86400000+session*12*3600000;settle(s,now);if(s.pending.slice(1).some(x=>x>=1))act('base/collect');
   for(let i=0;i<45;i++){
    const region=C.regions.findIndex((_,r)=>owned(s,r).length<25),r=region<0?5:region;
    const v=journeyValues(s),goals=CHAPTERS[s.journey.chapter]?.goals||[],goal=goals.find(([key,n])=>key.startsWith('seaSpecies')&&(v[key]||0)<n),zoneGoal=goals.find(([key,n])=>key==='zone'&&(v[key]||0)<n);let zone=goal?Number(goal[0].slice(10)):zoneGoal?1:r;
    if(region<0&&!goal&&!zoneGoal){const f=C.fish.find(f=>!s.book[f.id]);if(f)zone=f.zone;}
    const reserve=zoneOpen(s,zone)&&!s.unlocked.includes(zone)?C.zones[zone].cost:0;
    if(zoneOpen(s,zone)&&s.coin>=C.zones[zone].cost&&!s.unlocked.includes(zone))act('zone',{zone});
    if(s.unlocked.includes(zone)&&s.zone!==zone)act('zone',{zone});
    if(s.bait<1){if(now-s.rescueAt>=6*3600000)act('rescue/claim');else{stops++;break;}}
    act('fishing',{spot:0,bet:1});casts++;
    const e=s.event;if(e?.type==='attack')act('event/attack',{id:e.id,target:0});if(e?.type==='raid'){act('event/infiltrate',{id:e.id});while(s.event)act('event/steal',{id:e.id,route:0});}if(e?.type==='treasure')for(let cell=0;s.event?.type==='treasure'&&cell<12;cell++)act('event/dig',{id:e.id,cell});if(e?.type==='sea-game')act('event/sea-return',{id:e.id});if(e?.type==='encounter')act('event/encounter',{id:e.id,choice:e.format?'leave':s.food>=ENCOUNTERS[e.kind].food?'rescue':'leave',stage:e.stage});
    for(const d of ORDER_DEFS)if(s.orders.counts[d.id]>=d.target&&!s.orders.claimed.includes(d.id))act('orders/claim',{id:d.id});
    for(const d of weeklyDefs(s.weekly))if(s.weekly.counts[d.id]>=d.target&&!s.weekly.claimed.includes(d.id))act('weekly/claim',{id:d.id});
    for(let k=1;k<C.base.length;k++)if(s.damage[k]&&s.coin>=20*s.base[k])act('base/repair',{index:k});
    const n=owned(s,r).length,cost=C.buildCosts[Math.floor(n/5)]*(r+1),supplies=n>=10&&(n+1)%5===0?2:0;if(region>=0&&s.coin>=cost+(s.unlocked.includes(zone)?0:reserve)&&s.supplies>=supplies)act('expand',{region:r,tile:frontier(s,r)[0].id});
    if(s.nodes[0].reduce((a,b)=>a+b,0)>=5&&s.base[1]<3&&s.coin>500)act('base/upgrade',{index:1});
    const pets=Object.keys(s.pets);const wantedLevel=goals.find(([key,n])=>key==='petLevel'&&(v[key]||0)<n);const target=wantedLevel?pets.sort((a,b)=>s.pets[b].level-s.pets[a].level)[0]:pets.find(id=>s.pets[id].level<5)||pets.find(id=>s.pets[id].level<10);if(target&&s.food>=s.pets[target].level*3)act('pet/feed',{id:target});
    const skilled=pets.find(id=>s.pets[id].level>=5&&!s.mastery[id]);if(skilled&&s.supplies>=14)act('pet/mastery',{id:skilled,branch:'economy'});
    for(let k=0;k<6;k++)if(owned(s,k).length>=10&&(s.decor[k]||0)<2&&s.coin>1500&&s.supplies>=3*((s.decor[k]||0)+1)+3)act('island/decorate',{region:k});
    while(chapterReady(s))act('journey/claim');now+=12000;
   }
  }
  if([0,6,13,29].includes(day))history.push({day:day+1,casts,land:s.nodes.map(n=>n.reduce((a,b)=>a+b,0)),species:Object.keys(s.book).length,chapters:s.journey.chapter,badges:s.weeklyBadges,bait:s.bait,coin:s.coin});
 }
 return {seed,casts,stops,history};
}
const runs=Array.from({length:12},(_,i)=>run(i+1));console.log(JSON.stringify({model:'12 fixed seeds; 30 simulated days; two sessions daily, up to 45 casts; NPC safe routes; expansion-first, chapter-aware seas; claim orders/chapters, feed and specialize pets; no purchase or ads. Not real retention data.',runs},null,2));
