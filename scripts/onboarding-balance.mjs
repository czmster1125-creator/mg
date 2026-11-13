import {initialState,settle,action} from '../server/engine.js';
import {frontier} from '../shared/hex.js';
const records=[];
for(let seed=1;seed<=1000;seed++){
 let random=seed,now=Date.UTC(2026,10,13),s=settle(initialState(now),now),steps=0;
 const rng=()=>((random=(random*1664525+1013904223)>>>0)/4294967296);
 const act=(type,p={})=>{now+=type==='fishing'?6000:1500;return action(s,type,p,now,rng);};
 act('onboarding/land');
 while(!s.onboarding.complete&&steps++<50){if(s.onboarding.trade)act('onboarding/trade');else if(s.coin>=80)act('expand',{region:0,tile:frontier(s,0)[0].id});else act('fishing',{spot:0,bet:1,challenge:true});}
 if(!s.onboarding.complete||s.event||s.manual||s.onboarding.trade||s.equipped.length||s.mission!==0)throw Error('Onboarding did not complete cleanly');
 records.push({casts:s.onboarding.casts,bait:s.bait,coin:s.coin,xp:s.xp,seconds:(now-s.createdAt)/1000});
}
const summary={model:'Fresh v0.20 characters; one-click choices, 6 seconds/cast and 1.5 seconds/other action. Simulation, not observed player data.',profiles:records.length};
for(const key of ['casts','bait','coin','xp','seconds']){const values=records.map(r=>r[key]).sort((a,b)=>a-b);summary[key]={min:values[0],median:values[500],p90:values[900],max:values.at(-1)};}
console.log(JSON.stringify(summary,null,2));
