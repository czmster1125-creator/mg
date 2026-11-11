import {normalize,guide,roll,adventureAction} from './adventure.js';
import {BANK_RATES,UPGRADE_COSTS,BUILD_UNLOCK,rates,bonuses,points} from '../shared/adventure.js';
import {randomUUID,randomInt} from 'node:crypto';
import {config as C} from './config.js';
import {tiles,owned,frontier} from '../shared/hex.js';
export class GameError extends Error {constructor(message){super(message);this.status=400;}}
const fail = message=>{throw new GameError(message);};
export function initialState(now=Date.now()) {return {coin:350,bait:40,parts:8,materials:0,food:0,xp:0,cargo:[],book:{},zone:0,unlocked:[0],region:0,nodes:[[0,0,0,0,0],[0,0,0,0,0]],milestones:[[],[]],base:[1,1,0,0,0],pending:[0,24,3,1,1],gear:[0,0,0],mission:0,missionProgress:0,lastSettle:now,baitFraction:0,manual:null,catchCount:0,createdAt:now};}
export function settle(s,now=Date.now()) {
 normalize(s);
 if(!s.autoSettlement){s.coin+=s.cargo.reduce((n,f)=>n+f.price,0);s.cargo=[];s.autoSettlement=true;}
 const h=Math.min(Math.max(now-s.lastSettle,0),43200000)/3600000;
 if(s.bait<C.baitCap){const v=s.baitFraction+h*5*s.base[0];const add=Math.floor(v);s.bait=Math.min(C.baitCap,s.bait+add);s.baitFraction=s.bait>=C.baitCap?0:v-add;}else s.baitFraction=0;
 const production=rates(s,C.base,C.fish);for(let i=1;i<5;i++)s.pending[i]=Math.min(Math.max(s.pending[i],production[i]*12),s.pending[i]+h*production[i]);
 s.lastSettle=Math.max(s.lastSettle,now);
 if(s.manual&&now-s.manual.started>60000)s.manual=null;
 return s;
}
function mission(s,event,n=1){const m=C.missions[s.mission];if(!m||m.event!==event)return null;s.missionProgress+=n;if(s.missionProgress<m.target)return null;for(const k of ['coin','bait','parts','xp'])s[k]+=m[k]||0;s.mission++;s.missionProgress=0;return m.name;}
function spend(s,key,n){if(s[key]<n)fail(key==='coin'?'金币不足，去钓鱼或领取基地收益吧':key==='bait'?'鱼饵不足，稍后恢复或完成建设里程碑':'装备零件不足，可从基地领取');s[key]-=n;}
function index(v,len){if(!Number.isInteger(v)||v<0||v>=len)fail('无效的选择');return v;}
function fish(s,spot,manual=false,rng=()=>randomInt(1000000)/1000000,species=null){
 const r=rng(),boost=1+s.gear[1]*.06;
 let rarity=manual?2:r<.005*boost?3:r<(.05+(spot===1?.04:0))*boost?2:r<.22?1:0;
 let pool=C.fish.filter(f=>f.zone===s.zone&&f.rarity===rarity);if(!pool.length)pool=C.fish.filter(f=>f.zone===s.zone);const f=C.fish.find(f=>f.id===species)||pool[Math.floor(rng()*pool.length)];
 const weight=Math.round(f.min+(f.max-f.min)*Math.min(1,rng()+(spot===2?.15:0)));
 const price=Math.floor(f.base*(weight/((f.min+f.max)/2))*(1+s.gear[2]*.08)*(1+bonuses(s,C.fish).gold));
 const result={id:randomUUID(),species:f.id,weight,price,locked:f.rarity>=2,firstDiscovery:!s.book[f.id]};s.coin+=price;
 const b=s.book[f.id]||{count:0,best:0};b.count++;b.best=Math.max(b.best,weight);s.book[f.id]=b;s.pets[f.id]||={level:1};s.catchCount++;s.xp+=5;return result;
}
export function action(s,type,p={},now=Date.now(),rng){
 settle(s,now);rng ||= ()=>randomInt(1000000)/1000000;let result={};
 if(s.event&&['fishing','manual/start'].includes(type))fail('请先完成已保存的海上事件');
 if(s.manual&&!['manual/finish','manual/cancel'].includes(type))fail('请先完成或退出当前手动挑战');
 const extra=adventureAction(s,type,p,rng);if(extra)return extra;
 switch(type){
 case 'fishing':{if(![1,2,5].includes(p.bet))fail('不支持的倍率');index(p.spot,3);spend(s,'bait',p.bet);const outcome=roll(s,p.bet,rng);if(outcome.type!=='fish'){result=outcome;break;}result.fish=Array.from({length:p.bet},()=>fish(s,p.spot,false,rng));result.mission=mission(s,C.missions[s.mission]?.event==='sell'?'sell':'catch',p.bet);result.guide=guide(s,'catch');break;}
 case 'expand':{const r=index(p.region,2);if(r===1&&s.nodes[0].reduce((a,b)=>a+b,0)<25)fail('先完成宁静海湾 25 个建设点');const before=owned(s,r).slice();if(!frontier(s,r).some(t=>t.id===p.tile))fail('请选择与海岛相邻的未解锁地块');const cost=C.buildCosts[Math.floor(before.length/5)]*(r+1);const materialCost=before.length>=10&&((before.length+1)%5===0)?2:0;if(s.materials<materialCost)fail('建材不足，可从集市或宝藏探索获得');spend(s,'coin',cost);s.materials-=materialCost;s.expansion ||= [owned(s,0).slice(),owned(s,1).slice()];s.expansion[r].push(p.tile);const n=s.nodes[r].findIndex(l=>l<5);s.nodes[r][n]++;const points=before.length+1;result.milestones=[];for(const m of [5,10,15,20,25])if(points>=m&&!s.milestones[r].includes(m)){s.milestones[r].push(m);s.bait+=m===25?50:20;s.parts+=m===15?5:0;result.milestones.push(m);}result.mission=mission(s,'build');for(let i=2;i<5;i++)if(points>=BUILD_UNLOCK[i]&&!s.base[i]){s.base[i]=1;if(i===3)s.materials+=4;}result.guide=guide(s,'expand');break;}
 case 'build':fail('请点击相邻地块扩张海岛');break;
 case 'base/collect':{let total=0;const keys=['','coin','parts','materials','food'];for(let i=1;i<5;i++){const n=Math.floor(s.pending[i]);s[keys[i]]+=n;s.pending[i]-=n;total+=n;}if(!total)fail('收益正在累积，稍后再来');result.mission=mission(s,'collect');break;}
 case 'base/upgrade':{const i=index(p.index,5);if(s.base[i]>=5)fail('已达到最高等级');if(!s.base[i])fail('请先扩张海岛解锁该建筑');spend(s,'coin',UPGRADE_COSTS[s.base[i]]);s.base[i]++;break;}
 case 'gear/upgrade':{const i=index(p.index,3);if(s.gear[i]>=5)fail('装备已满级');const cost=80*(s.gear[i]+1);if(s.parts<2*(s.gear[i]+1))fail('装备零件不足，可从基地领取');spend(s,'coin',cost);spend(s,'parts',2*(s.gear[i]+1));s.gear[i]++;break;}
 case 'zone':{index(p.zone,2);if(!s.unlocked.includes(p.zone)){spend(s,'coin',C.zones[p.zone].cost);s.unlocked.push(p.zone);}s.zone=p.zone;if(p.zone===1)result.mission=mission(s,'zone');break;}
 case 'manual/start':{index(p.spot,3);spend(s,'bait',1);const pool=C.fish.filter(f=>f.zone===s.zone&&f.rarity===2);const species=pool[Math.floor(rng()*pool.length)].id;const profile=(p.spot+(species==='tuna'?1:species==='manta'?2:0))%3;s.manual={id:randomUUID(),started:now,spot:p.spot,species,profile};result={session:s.manual.id,species,profile};break;}
 case 'manual/finish':{const m=s.manual;if(!m||m.id!==p.session)fail('挑战已结束，请重新开始');if(typeof p.success!=='boolean')fail('挑战结果无效');if(p.success&&now-m.started>45000)fail('挑战已超时，请重新开始');if(p.success&&now-m.started<8000)fail('挑战仍在进行');if(p.success){result.fish=[fish(s,m.spot,true,rng,m.species)];result.mission=mission(s,C.missions[s.mission]?.event==='sell'?'sell':'catch');result.guide=guide(s,'catch');}else{s.coin+=5;result.compensation=5;}s.manual=null;break;}
 case 'manual/cancel':{if(p.session&&s.manual&&p.session!==s.manual.id)fail('挑战编号不匹配');s.manual=null;break;}
 default:fail('未知操作');
 }
 return result;
}
