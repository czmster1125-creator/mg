import {migrateEquipment,gearEffects,chooseRarity,gearCost} from '../shared/equipment.js';
import {XP_RULES,activityXP,captainReward} from '../shared/captain.js';
import {migrateHome} from './home-migration.js';
import {settleWeekly,weeklyProgress} from '../shared/weekly.js';
import {weeklyAction} from './weekly.js';
import {WORLD_REGIONS,regionOpen,zoneOpen} from '../shared/content.js';
import {initJourney,recordJourney} from '../shared/journey.js';
import {journeyAction} from './journey.js';
import {replayFight} from '../shared/manual-proof.js';
import {settleOrders,progressOrder} from '../shared/orders.js';
import {orderAction} from './orders.js';
import {normalize,guide,roll,adventureAction} from './adventure.js';
import {BANK_RATES,UPGRADE_COSTS,BUILD_UNLOCK,rates,bonuses,points} from '../shared/adventure.js';
import {randomUUID,randomInt} from 'node:crypto';
import {config as C} from './config.js';
import {tiles,owned,frontier} from '../shared/hex.js';
export class GameError extends Error {constructor(message){super(message);this.status=400;}}
const fail = message=>{throw new GameError(message);};
export function initialState(now=Date.now()) {return {gearVersion:2,homeVersion:2,coin:350,bait:40,supplies:8,food:0,xp:0,cargo:[],book:{},zone:0,unlocked:[0],region:0,nodes:[[0,0,0,0,0],[0,0,0,0,0]],milestones:[[],[]],base:[1,1,0,0],pending:[0,24,4,1],gear:[0,0,0],mission:0,missionProgress:0,lastSettle:now,baitFraction:0,manual:null,catchCount:0,createdAt:now};}
export function settle(s,now=Date.now()) {
 normalize(s);migrateHome(s,now,C.fish);migrateEquipment(s);s.captainClaimed??=1;s.discoveryDry||=[];while(s.discoveryDry.length<C.zones.length)s.discoveryDry.push(0);while(s.nodes.length<C.regions.length)s.nodes.push([0,0,0,0,0]);while(s.milestones.length<C.regions.length)s.milestones.push([]);if(s.expansion)while(s.expansion.length<C.regions.length)s.expansion.push([]);s.decor||=[];while(s.decor.length<C.regions.length)s.decor.push(0);initJourney(s);settleOrders(s,now);settleWeekly(s,now);
 if(!s.autoSettlement){s.coin+=s.cargo.reduce((n,f)=>n+f.price,0);s.cargo=[];s.autoSettlement=true;}
 const h=Math.min(Math.max(now-s.lastSettle,0),43200000)/3600000;
 if(s.bait<C.baitCap){const v=s.baitFraction+h*5*s.base[0];const add=Math.floor(v);s.bait=Math.min(C.baitCap,s.bait+add);s.baitFraction=s.bait>=C.baitCap?0:v-add;}else s.baitFraction=0;
 const production=rates(s,C.base,C.fish);for(let i=1;i<C.base.length;i++)s.pending[i]=Math.min(Math.max(s.pending[i],production[i]*12),s.pending[i]+h*production[i]);
 s.lastSettle=Math.max(s.lastSettle,now);
 if(s.manual&&now-s.manual.started>60000){if(s.manual.source==='encounter')finishEncounter(s,false);else s.manual=null;}
 return s;
}
function mission(s,event,n=1){const m=C.missions[s.mission];if(!m||m.event!==event)return null;s.missionProgress+=n;if(s.missionProgress<m.target)return null;for(const k of ['coin','bait','supplies','xp'])s[k]+=m[k]||0;s.mission++;s.missionProgress=0;return m.name;}
function spend(s,key,n){if(s[key]<n)fail(key==='coin'?'金币不足，去钓鱼或领取基地收益吧':key==='bait'?'鱼饵不足，稍后恢复或完成建设里程碑':'装备海岛物资不足，可从基地领取');s[key]-=n;}
function index(v,len){if(!Number.isInteger(v)||v<0||v>=len)fail('无效的选择');return v;}
function fish(s,spot,manual=false,rng=()=>randomInt(1000000)/1000000,species=null){
 const r=rng();let rarity=manual?2:chooseRarity(s,spot,r);
 let pool=C.fish.filter(f=>f.zone===s.zone&&f.rarity===rarity);if(!pool.length)pool=C.fish.filter(f=>f.zone===s.zone);let f=C.fish.find(f=>f.id===species)||pool[Math.floor(rng()*pool.length)];const unknown=C.fish.filter(f=>f.zone===s.zone&&!s.book[f.id]);if(!manual&&unknown.length&&s.discoveryDry[s.zone]>=19)f=unknown[Math.floor(rng()*unknown.length)];
 const weight=Math.round(f.min+(f.max-f.min)*Math.min(1,rng()+(spot===2?.15:0)+gearEffects(s).weightBias));
 const price=Math.floor(f.base*(weight/((f.min+f.max)/2))*(1+bonuses(s,C.fish).gold));
 const result={id:randomUUID(),species:f.id,weight,price,locked:f.rarity>=2,firstDiscovery:!s.book[f.id]};awardFish(s,[result]);return result;
}
function awardFish(s,catches){for(const result of catches){const f=C.fish.find(f=>f.id===result.species);s.coin+=result.price;s.discoveryDry[s.zone]=result.firstDiscovery?0:Math.min(19,s.discoveryDry[s.zone]+1);const b=s.book[f.id]||{count:0,best:0};b.count++;b.best=Math.max(b.best,result.weight);s.book[f.id]=b;s.pets[f.id]||={level:1};s.catchCount++;progressOrder(s,'catch');weeklyProgress(s,'catch',{zone:s.zone,rarity:f.rarity});s.xp+=XP_RULES.catch+(result.firstDiscovery?XP_RULES.discovery:0);}}
function finishEncounter(s,success){const m=s.manual;const catches=m.pendingFish;awardFish(s,catches);const bonus=success?Math.floor(catches.reduce((n,f)=>n+f.price,0)*.2):0;s.coin+=bonus;s.manual=null;return {fish:catches,bonus,guaranteed:!success,mission:mission(s,C.missions[s.mission]?.event==='sell'?'sell':'catch',catches.length),guide:guide(s,'catch')};}
function performAction(s,type,p={},now=Date.now(),rng){
 settle(s,now);rng ||= ()=>randomInt(1000000)/1000000;let result={};
 if(s.event&&['fishing','manual/start'].includes(type))fail('请先完成已保存的海上事件');
 if(s.manual&&!['manual/finish','manual/cancel','manual/engage','manual/auto'].includes(type))fail('请先完成或退出当前手动挑战');
 const week=weeklyAction(s,type,p);if(week)return week;const journey=journeyAction(s,type,p,now);if(journey)return journey;const before=s.coin;const order=orderAction(s,type,p);if(order)return order;const extra=adventureAction(s,type,p,rng);if(extra){recordJourney(s,extra);if(['attack','raid','treasure'].includes(extra.type)&&!extra.event)weeklyProgress(s,extra.type);if(['attack','treasure','raid'].includes(extra.type)&&!extra.event)progressOrder(s,'adventure');if(type==='pet/feed')progressOrder(s,'growth');return extra;}
 switch(type){
 case 'fishing':{if(![1,2,5].includes(p.bet))fail('不支持的倍率');index(p.spot,3);if(p.challenge!==undefined&&typeof p.challenge!=='boolean')fail('挑战设置无效');spend(s,'bait',p.bet);const outcome=roll(s,p.bet,rng);if(outcome.type!=='fish'){result=outcome;s.economy.casts++;if(['shield','supply'].includes(outcome.type))progressOrder(s,'adventure');break;}s.economy.casts++;
  const shadow=structuredClone(s),catches=Array.from({length:p.bet},()=>fish(shadow,p.spot,false,rng));const best=catches.reduce((a,b)=>C.fish.find(f=>f.id===b.species).rarity>C.fish.find(f=>f.id===a.species).rarity?b:a);
  if(p.challenge&&C.fish.find(f=>f.id===best.species).rarity>=2){const profile=(p.spot+(best.species==='tuna'?1:best.species==='manta'?2:0))%3;s.manual={id:randomUUID(),source:'encounter',stage:'offered',started:now,spot:p.spot,species:best.species,profile,power:0,gear:gearEffects(s).control,pendingFish:catches};result={type:'rare',session:s.manual.id,species:best.species,profile};break;}
  awardFish(s,catches);result.fish=catches;result.mission=mission(s,C.missions[s.mission]?.event==='sell'?'sell':'catch',p.bet);result.guide=guide(s,'catch');break;}
 case 'manual/engage':{const m=s.manual;if(!m||m.source!=='encounter'||m.id!==p.session)fail('稀有鱼挑战已结束');if(m.stage!=='offered')fail('挑战已开始，不能重置计时');m.stage='fight';m.started=now;result={session:m.id,species:m.species,profile:m.profile};break;}
 case 'manual/auto':{const m=s.manual;if(!m||m.source!=='encounter'||m.id!==p.session)fail('稀有鱼挑战已结束');result=finishEncounter(s,false);break;}

 case 'expand':{const r=index(p.region,C.regions.length);if(!regionOpen(s,r))fail('先完成'+C.regions[r-1].name+' 25 个建设点');const before=owned(s,r).slice();if(!frontier(s,r).some(t=>t.id===p.tile))fail('请选择与海岛相邻的未解锁地块');const cost=C.buildCosts[Math.floor(before.length/5)]*(r+1);const materialCost=before.length>=10&&((before.length+1)%5===0)?2:0;if(s.supplies<materialCost)fail('海岛物资不足，可从匠人小屋或宝藏探索获得');spend(s,'coin',cost);s.supplies-=materialCost;s.expansion ||= C.regions.map((_,i)=>owned(s,i).slice());s.expansion[r].push(p.tile);const n=s.nodes[r].findIndex(l=>l<5);s.nodes[r][n]++;const points=before.length+1;result.milestones=[];for(const m of [5,10,15,20,25])if(points>=m&&!s.milestones[r].includes(m)){s.milestones[r].push(m);s.bait+=m===25?30:10;s.supplies+=m===10?4:m===15?5:0;result.milestones.push(m);}result.mission=mission(s,'build');for(let i=2;i<C.base.length;i++)if(points>=BUILD_UNLOCK[i]&&!s.base[i]){s.base[i]=1;}result.guide=guide(s,'expand');break;}
 case 'build':fail('请点击相邻地块扩张海岛');break;
 case 'base/collect':{let total=0;const keys=C.base.map(b=>b.resource);for(let i=1;i<C.base.length;i++){const n=Math.floor(s.pending[i]);s[keys[i]]+=n;s.pending[i]-=n;total+=n;}if(!total)fail('收益正在累积，稍后再来');result.mission=mission(s,'collect');break;}
 case 'base/upgrade':{const i=index(p.index,C.base.length);if(s.base[i]>=5)fail('已达到最高等级');if(!s.base[i])fail('请先扩张海岛解锁该建筑');spend(s,'coin',UPGRADE_COSTS[s.base[i]]);s.base[i]++;break;}
 case 'gear/upgrade':{const i=index(p.index,3),cost=gearCost(s.gear[i]);if(!cost)fail('装备已满级');if(s.supplies<cost.supplies)fail('海岛物资不足，可从匠人小屋领取');spend(s,'coin',cost.coin);spend(s,'supplies',cost.supplies);s.gear[i]++;break;}
 case 'captain/claim':{const reward=captainReward(s);if(!reward.count)fail('暂无待领的船长升级补给');for(const k of ['coin','bait','food','supplies'])s[k]+=reward[k];s.captainClaimed=reward.through;result={message:'船长升级补给已到账',reward};break;}
 case 'zone':{index(p.zone,C.zones.length);if(!zoneOpen(s,p.zone))fail('先完成前一座海岛，开放'+C.regions[p.zone].name);if(!s.unlocked.includes(p.zone)){spend(s,'coin',C.zones[p.zone].cost);s.unlocked.push(p.zone);}s.zone=p.zone;if(p.zone===1)result.mission=mission(s,'zone');break;}
 case 'manual/start':{index(p.spot,3);spend(s,'bait',1);const pool=C.fish.filter(f=>f.zone===s.zone&&f.rarity===2);const species=pool[Math.floor(rng()*pool.length)].id;const profile=(p.spot+(species==='tuna'?1:species==='manta'?2:0))%3;s.manual={id:randomUUID(),started:now,spot:p.spot,species,profile,power:Number.isFinite(p.power)?Math.max(0,Math.min(100,p.power)):0,gear:gearEffects(s).control};result={session:s.manual.id,species,profile};break;}
 case 'manual/finish':{const m=s.manual;if(!m||m.id!==p.session)fail('挑战已结束，请重新开始');if(typeof p.success!=='boolean')fail('挑战结果无效');if(p.success&&now-m.started>45000)fail('挑战已超时，请重新开始');if(p.success&&now-m.started<8000)fail('挑战仍在进行');if(p.success&&!replayFight(m,p,(now-m.started)/1000))fail('收线记录未通过校验，请重新挑战');if(m.source==='encounter'){if(p.success&&m.stage!=='fight')fail('请先进入挑战');result=finishEncounter(s,p.success);break;}if(p.success){result.fish=[fish(s,m.spot,true,rng,m.species)];result.mission=mission(s,C.missions[s.mission]?.event==='sell'?'sell':'catch');result.guide=guide(s,'catch');}else{s.coin+=5;result.compensation=5;}s.manual=null;break;}
 case 'manual/cancel':{if(p.session&&s.manual&&p.session!==s.manual.id)fail('挑战编号不匹配');if(s.manual?.source==='encounter')result=finishEncounter(s,false);else s.manual=null;break;}
 default:fail('未知操作');
 }
 if(['expand','base/upgrade'].includes(type))progressOrder(s,'growth');return result;
}

export function action(s,type,p={},now=Date.now(),rng){settle(s,now);const before=s.coin,beforeXP=s.xp;const result=performAction(s,type,p,now,rng);activityXP(s,type,p,result);result.xpGain=s.xp-beforeXP;if(['pet/feed','pet/mastery','pet/train','base/upgrade','expand','island/decorate'].includes(type))weeklyProgress(s,'growth');s.economy.earned+=Math.max(0,s.coin-before);s.economy.spent+=Math.max(0,before-s.coin);return result;}
