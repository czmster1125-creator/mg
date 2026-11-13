import {newVoyage,voyageLand} from '../shared/onboarding.js';
import {startSeaGame} from './sea-games.js';
import {shieldCapacity} from '../shared/shields.js';
import {initSeaStories} from '../shared/sea-stories.js';
import {startSeaStory} from './sea-stories.js';
import {gearEffects} from '../shared/equipment.js';
import {initRivals,refillRivals,chooseRival,finishRival,rivalScale,npcAttackPayout} from '../shared/rivals.js';
import {startShellTreasure,openShell,upgradeShellBoard} from './treasure.js';
import {SHELL_FORMAT} from '../shared/treasure.js';
import {COLLECTION_KEYS} from '../shared/content.js';
import {repairCost} from '../shared/pets.js';
import {startRaid,raidAction} from './raid.js';
import {randomUUID} from 'node:crypto';
import {config as C} from './config.js';
import {GUIDES,migrateGuide,slots,role,bonuses,points} from '../shared/adventure.js';
export function normalize(s){s.rivalVault??=1800;s.raidCount??=0;s.raidLesson??=false;s.pets||={};for(const id of Object.keys(s.book))s.pets[id]||={level:1};s.equipped||=[];const seen=new Set();s.equipped=s.equipped.filter(id=>{const r=role(id,C.fish);if(!s.pets[id]||r<0||seen.has(r))return false;seen.add(r);return true;});s.shields=Math.min(shieldCapacity(s),Math.max(0,Math.floor(s.shields||0)));upgradeShellBoard(s);s.damage||=[false,false,false,false];s.reports||=[];s.guide??=0;migrateGuide(s);s.collectionClaims||=[];s.dry??=0;s.event??=null;s.adventureCasts??=0;s.attackCount??=0;initSeaStories(s);s.opponent||={shield:1,damage:[0,0,0]};initRivals(s);}
export function guide(s,event){const g=GUIDES[s.guide];if(g&&(g.event===event||g.event==='expand5'&&event==='expand'&&s.nodes[0].reduce((a,b)=>a+b,0)>=5)){s.guide++;s.coin+=40;s.food+=4;s.bait+=4;return g.name;}return null;}
export function publicState(s){const p=structuredClone(s);if(p.event?.type==='treasure'){delete p.event.loot;delete p.event.board;}if(p.event?.type==='raid')delete p.event.rolls;if(p.event?.type==='encounter')delete p.event.roll;return p;}
export function roll(s,bet,rng){s.adventureCasts++;refillRivals(s);const g=GUIDES[s.guide];let draw=null,type,lessonType=null;if(g?.event==='catch')type='fish';else if(['attack','treasure','shield'].includes(g?.event))type=g.event;else if(s.dry>=9)type=['attack','raid','treasure'][Math.min(2,Math.floor(rng()*3))];else{const r=draw=rng();type=r<.52?'fish':r<.64?'attack':r<.74?'raid':r<.86?'treasure':r<.94?'shield':'supply';}if(!g&&points(s)>=5&&type==='fish'&&draw>=.44&&draw<.52)type='sea-game';s.dry=['attack','raid','treasure','sea-game'].includes(type)?0:s.dry+1;
 if(newVoyage(s)){
  const o=s.onboarding,n=voyageLand(s),gap=s.adventureCasts-o.lastLessonCast;
  const lesson=[['salvage',5],['treasure',6],['shield',8],['attack',9],['raid',10]].find(([k,land])=>n>=land&&!o.lessons[k]);
  if(lesson&&gap>=2){const k=lesson[0];o.lessons[k]=true;o.lastLessonCast=s.adventureCasts;
   if(k==='salvage'){const result=startSeaGame(s,'salvage',bet,rng);s.event.openingCargo=true;return result;}type=k;lessonType=k;
  }else {
   const locked=(type==='attack'&&(!o.lessons.attack||n<9))||(type==='raid'&&(!o.lessons.raid||n<10))||(type==='treasure'&&!o.lessons.treasure)||(type==='shield'&&!o.lessons.shield)||(type==='sea-game'&&!o.lessons.salvage);
   if(locked)type='fish';
  }
 }
 const storyGap=s.adventureCasts-s.seaStories.lastCast;if(!g&&points(s)>=10&&((type==='supply'&&storyGap>=8)||(['fish','supply'].includes(type)&&storyGap>=18)))return startSeaStory(s,rng,C.fish);
 if(type==='sea-game')return startSeaGame(s,draw<.48?'salvage':'escort',bet,rng);
 if(type==='raid')return startRaid(s,bet,rng,lessonType==='raid');
 if(type==='attack'){const rival=chooseRival(s);s.event={...rival,id:randomUUID(),type,bet,lesson:!!lessonType,shield:s.opponent.shield,damage:s.opponent.damage.slice(),rewardScale:rivalScale(s)};return {type,event:true};}
 if(type==='treasure')return startShellTreasure(s,bet,rng,C.fish);
 if(type==='shield'){const full=s.shields>=shieldCapacity(s);if(full)s.bait+=2;else s.shields++;return {type,full,guide:guide(s,'shield')};}
 if(type==='supply'){const food=Math.floor(2*bet*(1+bonuses(s,C.fish).food));s.food+=food;const supplies=bet*(1+gearEffects(s).crates);s.supplies+=supplies;s.bait+=2;return {type,food,supplies,bait:2};}return {type};
}
export function adventureAction(s,type,p,rng){const fail=m=>{throw new Error(m);};const b=bonuses(s,C.fish);const raid=raidAction(s,type,p,rng);if(raid)return raid;
 if(type==='guide/skip'){s.guide=GUIDES.length;return {message:'引导已跳过，可自由探索'};}
 if(type==='pet/equip'){if(!C.fish.some(f=>f.id===p.id)||!Object.hasOwn(s.pets,p.id))fail('尚未解锁这条鱼');const i=s.equipped.indexOf(p.id);if(i>=0)s.equipped.splice(i,1);else{const same=s.equipped.findIndex(id=>role(id,C.fish)===role(p.id,C.fish));if(same>=0)s.equipped.splice(same,1);if(s.equipped.length>=slots(s))fail('随行位置已满，请先撤下一只');s.equipped.push(p.id);}return {guide:guide(s,'equip')};}
 if(type==='pet/feed'){const pet=Object.hasOwn(s.pets,p.id)?s.pets[p.id]:null;if(!pet)fail('尚未解锁这条鱼');if(pet.level>=10)fail('已达到 10 级');const cost=pet.level*3;if(s.food<cost)fail('鱼宠粮不足，可领取生产或探索补给');s.food-=cost;pet.level++;return {guide:guide(s,'feed')};}
 if(type==='collection/claim'){const n=Object.keys(s.book).length;const key=p.key;let valid=false;if(typeof key==='number'&&COLLECTION_KEYS.includes(key))valid=n>=key;if(typeof key==='string'&&COLLECTION_KEYS.includes(key)){const zone=Number(key.slice(3));valid=C.fish.filter(f=>f.zone===zone).every(f=>s.book[f.id]);}if(!valid||s.collectionClaims.includes(key))fail('奖励未达成或已领取');s.collectionClaims.push(key);s.food+=typeof key==='number'?key*2:15;s.coin+=typeof key==='number'?key*20:200;return {message:'收藏奖励已到账'};}
 if(type==='base/repair'){const i=p.index;if(!Number.isInteger(i)||i<1||i>=C.base.length||!s.damage[i])fail('该建筑无需维修');const cost=repairCost(s,i,b);if(s.coin<cost)fail('维修金币不足');s.coin-=cost;s.damage[i]=false;return {message:'建筑已恢复正常生产'};}
 if(type==='defense/drill'){if(s.drillDone)fail('演习已完成');s.drillDone=true;const blocked=s.shields>0;if(blocked)s.shields--;else s.damage[1]=true;s.reports.unshift({text:blocked?'NPC 防守演习：护盾挡住攻击':'NPC 防守演习：小铺受损，产出减半',blocked});s.reports=s.reports.slice(0,10);return {message:blocked?'护盾已抵挡演习攻击':'小铺受损，可在海岛维修'};}
 if(type==='event/attack'){const e=s.event;if(!e||e.type!=='attack'||e.id!==p.id)fail('事件不存在或已完成');if(!Number.isInteger(p.target)||p.target<0||p.target>2)fail('请选择目标建筑');const blocked=e.shield>0;let broken=false;if(blocked)s.opponent.shield=0;else{s.opponent.damage[p.target]+=100+b.attack;broken=s.opponent.damage[p.target]>=[100,130,160][p.target];if(broken)s.opponent.damage[p.target]=0;}const coin=npcAttackPayout(e,blocked?25:broken?[150,95,80][p.target]:45,blocked?b.salvage:0);s.coin+=coin;if(broken&&p.target===1)s.supplies+=2*e.bet;if(broken&&p.target===2)s.food+=3*e.bet;let defense=null;if(s.guide>=GUIDES.length&&++s.attackCount%3===0){if(s.shields){s.shields--;defense='NPC 还击：护盾抵挡了攻击';}else{const targets=[1,2,3].filter(i=>s.base[i]&&!s.damage[i]);if(s.damage.filter(Boolean).length<2&&targets.length){const target=targets[Math.floor(rng()*targets.length)];s.damage[target]=true;defense='NPC 还击：'+C.base[target].name+'受损，可在海岛维修';}else defense='NPC 还击：损伤保护生效，没有新增损伤';}s.reports.unshift({text:defense});s.reports=s.reports.slice(0,10);}finishRival(s,e);s.event=null;return {rival:e.rival,targetName:e.targetName,type:'attack',target:p.target,coin,supplies:broken&&p.target===1?2*e.bet:0,food:broken&&p.target===2?3*e.bet:0,blocked,broken,defense,guide:guide(s,'attack')};}
 if(type==='event/dig'&&s.event?.format===SHELL_FORMAT){const result=openShell(s,p);if(result.type==='treasure')result.guide=guide(s,'treasure');return result;}
 if(type==='event/dig'){const e=s.event;if(!e||e.type!=='treasure'||e.id!==p.id)fail('事件不存在或已完成');if(!Number.isInteger(p.cell)||p.cell<0||p.cell>=6||e.picks.some(v=>v.cell===p.cell))fail('请选择未挖掘的位置');const reward={...e.loot[p.cell]};if(reward.coin)reward.coin=Math.floor(reward.coin*e.bet*(1+b.explore));if(reward.supplies)reward.supplies*=e.bet;if(reward.food)reward.food=Math.floor(reward.food*e.bet*(1+b.treasureFood));e.picks.push({cell:p.cell,reward});if(e.picks.length===3){const total={coin:0,supplies:0,food:0};for(const pick of e.picks)for(const k of Object.keys(total))total[k]+=pick.reward[k]||0;for(const k of Object.keys(total))s[k]+=total[k];s.event=null;return {type:'treasure',total,guide:guide(s,'treasure')};}return {type:'dig',reward};}
 return null;
}
