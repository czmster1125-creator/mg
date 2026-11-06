import {randomUUID,randomInt} from 'node:crypto';
import {config as C} from './config.js';
export class GameError extends Error {constructor(message){super(message);this.status=400;}}
const fail = message=>{throw new GameError(message);};
export function initialState(now=Date.now()) {return {coin:350,bait:40,parts:8,materials:0,food:0,xp:0,cargo:[],book:{},zone:0,unlocked:[0],region:0,nodes:[[0,0,0,0,0],[0,0,0,0,0]],milestones:[[],[]],base:[1,1,1,1,1],pending:[0,24,3,1,1],gear:[0,0,0],mission:0,missionProgress:0,lastSettle:now,baitFraction:0,manual:null,catchCount:0,createdAt:now};}
export function settle(s,now=Date.now()) {
 const h=Math.min(Math.max(now-s.lastSettle,0),43200000)/3600000;
 if(s.bait<C.baitCap){const v=s.baitFraction+h*5*s.base[0];const add=Math.floor(v);s.bait=Math.min(C.baitCap,s.bait+add);s.baitFraction=s.bait>=C.baitCap?0:v-add;}else s.baitFraction=0;
 for(let i=1;i<5;i++)s.pending[i]=Math.min(C.base[i].rate*s.base[i]*12,s.pending[i]+h*C.base[i].rate*s.base[i]);
 s.lastSettle=Math.max(s.lastSettle,now);
 if(s.manual&&now-s.manual.started>60000)s.manual=null;
 return s;
}
function mission(s,event,n=1){const m=C.missions[s.mission];if(!m||m.event!==event)return null;s.missionProgress+=n;if(s.missionProgress<m.target)return null;for(const k of ['coin','bait','parts','xp'])s[k]+=m[k]||0;s.mission++;s.missionProgress=0;return m.name;}
function spend(s,key,n){if(s[key]<n)fail(key==='coin'?'金币不足，先出售一些鱼获吧':key==='bait'?'鱼饵不足，稍后恢复或完成建设里程碑':'装备零件不足，可从基地领取');s[key]-=n;}
function index(v,len){if(!Number.isInteger(v)||v<0||v>=len)fail('无效的选择');return v;}
function fish(s,spot,manual=false,rng=()=>randomInt(1000000)/1000000){
 const r=rng(),boost=1+s.gear[1]*.06;
 let rarity=manual?2:r<.005*boost?3:r<(.05+(spot===1?.04:0))*boost?2:r<.22?1:0;
 let pool=C.fish.filter(f=>f.zone===s.zone&&f.rarity===rarity);if(!pool.length)pool=C.fish.filter(f=>f.zone===s.zone);const f=pool[Math.floor(rng()*pool.length)];
 const weight=Math.round(f.min+(f.max-f.min)*Math.min(1,rng()+(spot===2?.15:0)));
 const price=Math.floor(f.base*(weight/((f.min+f.max)/2))*(1+s.gear[2]*.08));
 const result={id:randomUUID(),species:f.id,weight,price,locked:f.rarity>=2};s.cargo.push(result);
 const b=s.book[f.id]||{count:0,best:0};b.count++;b.best=Math.max(b.best,weight);s.book[f.id]=b;s.catchCount++;s.xp+=5;return result;
}
export function action(s,type,p={},now=Date.now(),rng){
 settle(s,now);let result={};
 if(s.manual&&!['manual/finish','manual/cancel','cargo/lock'].includes(type))fail('请先完成或退出当前手动挑战');
 switch(type){
 case 'fishing':{if(![1,2,5].includes(p.bet))fail('不支持的倍率');index(p.spot,3);if(s.cargo.length+p.bet>C.capacity)fail(`鱼舱空位不足 ${p.bet} 格，请先出售鱼获`);spend(s,'bait',p.bet);result.fish=Array.from({length:p.bet},()=>fish(s,p.spot,false,rng));result.mission=mission(s,'catch',p.bet);break;}
 case 'cargo/lock':{const f=s.cargo.find(f=>f.id===p.id);if(!f)fail('鱼获不存在');f.locked=!f.locked;break;}
 case 'cargo/sell':{const selected=s.cargo.filter(f=>!f.locked&&(p.all===true||p.ids?.includes(f.id)));if(!selected.length)fail('没有可出售的鱼获，珍稀鱼可先解锁');result.coins=selected.reduce((v,f)=>v+f.price,0);result.count=selected.length;s.coin+=result.coins;s.cargo=s.cargo.filter(f=>!selected.includes(f));result.mission=mission(s,'sell',selected.length);break;}
 case 'build':{const r=index(p.region,2),n=index(p.node,5);if(r===1&&s.nodes[0].reduce((a,b)=>a+b,0)<25)fail('先完成宁静海湾 25 个建设点');const lv=s.nodes[r][n];if(lv>=5)fail('建筑已满级');spend(s,'coin',C.buildCosts[lv]*(r+1));s.nodes[r][n]++;const points=s.nodes[r].reduce((a,b)=>a+b,0);result.milestones=[];for(const milestone of [5,10,15,20,25])if(points>=milestone&&!s.milestones[r].includes(milestone)){s.milestones[r].push(milestone);s.bait+=milestone===25?50:20;s.parts+=milestone===15?5:0;result.milestones.push(milestone);}result.mission=mission(s,'build');break;}
 case 'base/collect':{let total=0;const keys=['','coin','parts','materials','food'];for(let i=1;i<5;i++){const n=Math.floor(s.pending[i]);s[keys[i]]+=n;s.pending[i]-=n;total+=n;}if(!total)fail('收益正在累积，稍后再来');result.mission=mission(s,'collect');break;}
 case 'base/upgrade':{const i=index(p.index,5);if(s.base[i]>=5)fail('已达到最高等级');spend(s,'coin',80*s.base[i]**2);s.base[i]++;break;}
 case 'gear/upgrade':{const i=index(p.index,3);if(s.gear[i]>=5)fail('装备已满级');const cost=80*(s.gear[i]+1);if(s.parts<2*(s.gear[i]+1))fail('装备零件不足，可从基地领取');spend(s,'coin',cost);spend(s,'parts',2*(s.gear[i]+1));s.gear[i]++;break;}
 case 'zone':{index(p.zone,2);if(!s.unlocked.includes(p.zone)){spend(s,'coin',C.zones[p.zone].cost);s.unlocked.push(p.zone);}s.zone=p.zone;if(p.zone===1)result.mission=mission(s,'zone');break;}
 case 'manual/start':{if(s.cargo.length>=C.capacity)fail('鱼舱已满，请先出售');index(p.spot,3);spend(s,'bait',1);s.manual={id:randomUUID(),started:now,spot:p.spot};result.session=s.manual.id;break;}
 case 'manual/finish':{const m=s.manual;if(!m||m.id!==p.session)fail('挑战已结束，请重新开始');if(p.success&&now-m.started<8000)fail('挑战仍在进行');if(p.success){result.fish=[fish(s,m.spot,true,rng)];result.mission=mission(s,'catch');}else{s.coin+=5;result.compensation=5;}s.manual=null;break;}
 case 'manual/cancel':{s.manual=null;break;}
 default:fail('未知操作');
 }
 return result;
}
