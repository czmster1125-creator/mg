import {chooseRival,finishRival} from '../shared/rivals.js';
import {randomUUID} from 'node:crypto';
import {RAID_ROUTES,raidRisk,raidAmount} from '../shared/raid.js';
import {bonuses} from '../shared/adventure.js';
import {config as C} from './config.js';
export function startRaid(s,bet,rng,lesson=false){
 const b=bonuses(s,C.fish);
 s.event={...chooseRival(s),id:randomUUID(),type:'raid',bet,lesson,stage:'approach',turn:0,carried:0,vault:s.rivalVault*bet,initial:s.rivalVault*bet,bonus:b.steal||0,cover:b.cover||0,rolls:Array.from({length:3},()=>rng()),log:[]};
 return {type:'raid',event:true};
}
export function raidAction(s,type,p,rng){
 const fail=m=>{throw Error(m);};
 if(type==='raid/start'){
  if(s.event)fail('请先完成已保存的海上事件');if(s.raidLesson)fail('潜行教学已完成，继续抛竿可遇到偷袭');if(s.bait<1)fail('需要 1 鱼饵开启潜行教学');s.bait--;return startRaid(s,1,rng,true);
 }
 if(!['event/infiltrate','event/steal','event/bank'].includes(type))return null;
 const e=s.event;if(!e||e.type!=='raid'||e.id!==p.id)fail('偷袭已结束或编号无效');
 if(type==='event/infiltrate'){if(e.stage!=='approach')fail('已经登岛');e.stage='inside';return {type:'infiltrate',rival:e.rival,targetName:e.targetName};}
 if(e.stage!=='inside')fail('请先潜入目标海岛');
 let caught=false;
 if(type==='event/steal'){
  if(!Number.isInteger(p.route)||!RAID_ROUTES[p.route]||e.turn>=3)fail('请选择有效目标');
  const amount=raidAmount(e,p.route);if(amount<=0)fail('对方金库已空，请撤离');
  caught=e.rolls[e.turn]*100<raidRisk(e,p.route);e.turn++;
  if(!caught){e.carried+=amount;e.vault-=amount;}
  e.log.push({target:RAID_ROUTES[p.route].name,amount:caught?0:amount,caught});
  if(!caught&&e.turn<3&&e.vault>0)return {type:'steal',amount,route:p.route,rival:e.rival,targetName:e.targetName};
 }
 const coin=caught?Math.floor(e.carried*.5):e.carried;
 // NPC principal and the player's reward change together; lost loot returns to the NPC.
 if(!e.live)s.rivalVault=Math.max(0,s.rivalVault-Math.ceil(coin/e.bet));s.coin+=coin;s.raidCount++;if(e.lesson)s.raidLesson=true;
 s.reports.unshift({text:`${e.live?e.targetName:'NPC'} 偷袭${caught?'被发现，保住一半赃物':'撤离成功'}：带回 ${coin} 金币，对方金库余 ${s.rivalVault}`});s.reports=s.reports.slice(0,10);
 const result={type:'raid',coin,caught,turn:e.turn,remaining:e.live?e.initial-coin:s.rivalVault,live:!!e.live,rival:e.rival,targetName:e.targetName,log:e.log};finishRival(s,e);s.event=null;return result;
}
