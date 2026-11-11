import {weeklyReady} from './weekly.js';
import {COLLECTION_KEYS,regionOpen,zoneOpen,landCount} from './content.js';
import {chapterReady,CHAPTERS,journeyValues} from './journey.js';
import {readyOrder} from './orders.js';
import {repairCost} from './pets.js';
import {bonuses} from './adventure.js';
import {BUILD_UNLOCK,UPGRADE_COSTS,points} from './adventure.js';

export function collectionReady(s,fish,key) {
  return typeof key==='number'?Object.keys(s.book).length>=key:typeof key==='string'&&/^sea[0-5]$/.test(key)&&fish.some(f=>f.zone===Number(key.slice(3)))&&fish.filter(f=>f.zone===Number(key.slice(3))).every(f=>s.book[f.id]);
}

// Recommendations have no separate reward ledger: they lead to existing actions.
export function nextObjective(s,c) {
  if(s.event)return {title:'完成已保存的海上事件',detail:'奖励和选择已保存，继续完成后再抛竿。',action:'event'};
  if(s.orders&&readyOrder(s))return {title:'领取今日订单奖励',detail:'今日订单已完成，领取鱼饵与建设资源。每日北京时间 00:00 更新。',action:'orders'};
  if(s.journey&&chapterReady(s))return {title:'领取海岛故事章节奖励',detail:'这一章的条件已达成，领取资源并开启下一段旅程。',action:'journey'};
  if(weeklyReady(s))return {title:'领取每周航海委托奖励',detail:'周委托已达成，领取资源与远航徽章。',action:'weekly'};
  const reward=COLLECTION_KEYS.find(k=>!s.collectionClaims.includes(k)&&collectionReady(s,c.fish,k));
  if(reward!==undefined)return {title:'领取鱼缸收藏奖励',detail:'已达成的收藏奖励可领取金币和宠物粮。',action:'book'};
  const damaged=s.damage.findIndex((v,i)=>v&&i>0);
  if(damaged>=0)return {title:'修复'+c.base[damaged].name,detail:`产出已减半。花费 ${repairCost(s,damaged,bonuses(s,c.fish))} 金币即可恢复，等级和土地不变。`,action:'building',index:damaged};
  if(Object.keys(s.pets).length&&!s.equipped.length)return {title:'带一只鱼宠出发',detail:'选择一只鱼宠随行，让它的金币、攻击或寻宝能力生效。',action:'book'};
  const chapter=CHAPTERS[s.journey?.chapter],v=s.journey?journeyValues(s):{};
  const seaGoal=chapter?.goals.find(([k,n])=>k.startsWith('seaSpecies')&&(v[k]||0)<n);
  const oldZoneGoal=chapter?.goals.find(([k,n])=>k==='zone'&&(v[k]||0)<n);
  const neededSea=seaGoal?Number(seaGoal[0].slice(10)):oldZoneGoal?1:null;
  if(neededSea!==null&&zoneOpen(s,neededSea))return {title:'前往'+c.zones[neededSea].name,detail:s.unlocked.includes(neededSea)?'本章需要这片海域的新鱼种，切换海域继续收集。':`本章需要新海域伙伴。支付 ${c.zones[neededSea].cost} 金币后永久开放。`,action:'zones'};
  const region=c.regions.findIndex((_,i)=>landCount(s,i)<25&&regionOpen(s,i));
  const count=region<0?25:landCount(s,region);
  if(count<25) {
    const milestone=[1,5,10,15,20,25].find(n=>n>count);
    const unlock=region===0?['解锁钓具工坊','解锁宠物乐园和第二个随行位','解锁集市和第三个随行位','解锁探索码头与高级宝藏','领取建设鱼饵奖励','解锁下一座海岛'][[1,5,10,15,20,25].indexOf(milestone)]:'领取建设鱼饵奖励';
    const cost=c.buildCosts[Math.floor(count/5)]*(region+1);
    const material=count>=10&&(count+1)%5===0?2:0;
    if(s.materials<material)return {title:'为功能土地收集建材',detail:`还差 ${material-s.materials} 建材。领取集市产出，或在钓鱼中遇到寻宝和补给。`,action:'building',index:3};
    if(s.coin<cost&&s.pending[1]>=1)return {title:'领取海岛金币，再扩张',detail:`下一块土地需要 ${cost} 金币，银行已有 ${Math.floor(s.pending[1])} 金币可领取。`,action:'island',region};
    if(s.coin<cost)return {title:`为扩张积攒 ${cost} 金币`,detail:`还差 ${Math.ceil(cost-s.coin)} 金币；钓鱼、寻宝和银行都能提供收益。`,action:'fish'};
    return {title:`扩张至 ${milestone} 块 · ${count}/${milestone}`,detail:`${c.regions[region].name}：${unlock}。下一块消耗 ${cost} 金币${material?'、2 建材':''}。`,action:'island',region};
  }
  const missing=c.fish.find(f=>!s.book[f.id]);
  if(missing)return {title:'发现更多鱼宠',detail:`${c.zones[missing.zone].name}还有未发现的鱼种。解锁对应海域后继续收集。`,action:'zones'};
  const building=s.base.findIndex((lv,i)=>lv>0&&lv<5&&points(s)>=BUILD_UNLOCK[i]);
  if(building>=0)return {title:'提升'+c.base[building].name,detail:`升级需要 ${UPGRADE_COSTS[s.base[building]]} 金币，查看产出变化后再决定。`,action:'building',index:building};
  if(s.weekly&&s.weekly.claimed.length<3)return {title:'完成本周航海委托',detail:'回访指定海域、完成事件并训练伙伴，收集永久远航徽章。',action:'weekly'};return {title:'培养更多伙伴的默契',detail:'本周委托已完成，可以继续收集伙伴默契，周一开启下一段航线。',action:'book'};
}
