import {HOME_BUILDINGS} from './home.js';
import {readyOrder} from './orders.js';
// Only characters created with this marker use the shipwreck opening. Missing
// markers are deliberately never inferred from a low level or an empty island.
export const newVoyage=s=>s.onboarding?.version===1;
export const coreVoyage=s=>newVoyage(s)&&!s.onboarding.complete;
export const homeUnlock=(s,i)=>newVoyage(s)?[3,5,8,5][i]:HOME_BUILDINGS[i].unlock;
export const voyageLand=s=>s.nodes[0].reduce((a,b)=>a+b,0);
export const voyageBoat=s=>!newVoyage(s)||voyageLand(s)>=3;
export function voyageGoal(s){
 if(!coreVoyage(s))return null;
 const o=s.onboarding,n=voyageLand(s),missing=Math.max(0,80-s.coin);
 if(o.intro!=='done')return {title:'海风将你带到一片浅礁',detail:'抱紧木板，先找一个可以落脚的地方。',action:'intro',step:0};
 if(o.trade)return {title:'用第一桶鱼换来新土地',detail:'留下一条小丑鱼作伙伴，另一条换取 80 金币。',action:'trade',step:2};
 if(!n)return {title:'在浅礁上，搭起第一块落脚地',detail:'应急袋里有 80 金币。点击发光的浅礁，铺设木台与土地。',action:'expand',step:1};
 if(missing)return {title:`钓鱼赚金币 · 还差 ${missing}`,detail:`下一块土地需要 80 金币。${o.casts?'鱼获会自动交易，金币够了就可以回岛扩张。':'点击鱼群或钓鱼按钮，第一桶鱼会带来一位买家。'}`,action:'fish',step:2};
 return {title:`金币够了，扩张第 ${n+1} 块土地`,detail:n===2?'再扩一块，潮汐小屋与免费小舟就会到来。':n===4?'建成五块家园，迎来码头小铺与伙伴小屋。':'回到海岛，点击与土地相邻的发光格子。',action:'expand',step:3};
}
export function assertVoyageAction(s,type,p={}){
 if(!newVoyage(s))return;
 if(coreVoyage(s)){
  if(s.onboarding.intro!=='done'&&type!=='onboarding/land')throw Error('请先完成或跳过落海开场');
  if(s.onboarding.trade&&!['onboarding/trade','onboarding/land'].includes(type))throw Error('第一桶鱼已收好，先与路过的买家完成交易');
  if(!['onboarding/land','onboarding/trade','expand','fishing','rescue/claim'].includes(type))throw Error('先建成五块家园，其他航海功能随后开放');
  if(type==='fishing'&&(!voyageLand(s)||p.bet!==1||p.feature))throw Error('先铺好第一块落脚地，新手航程每竿消耗 1 次');
 }
 if(type==='raid/start'&&voyageLand(s)<10)throw Error('扩张至 10 块土地后开放偷袭教学');
 if(type==='social/start'&&voyageLand(s)<10)throw Error('扩张至 10 块土地后开放好友冒险');
 assertHarborAction(s,type);
}

export const HARBOR_STEPS=[
 {land:5,key:'orders',name:'小铺开张',detail:'查看订单补给，出海找回飞机物资。',action:'orders',icon:'flag'},
 {land:6,key:'aquarium',name:'伙伴安家',detail:'开启鱼缸与贝壳寻珠；随行和喂养可以稍后。',action:'book',icon:'fish'},
 {land:7,key:'gear',name:'学会远航',detail:'了解装备分工；长按钓鱼按钮可以自动出海。',action:'gear',icon:'fishing-rod'},
 {land:8,key:'workshop',name:'小岛有了帮手',detail:'匠人小屋开始生产物资，出海认识守护贝壳。',action:'building',index:2,icon:'hammer'},
 {land:9,key:'attack',name:'第一位海上对手',detail:'下一段冒险认识 NPC，对手护盾与建筑都能互动。',action:'fish',icon:'shield'},
 {land:10,key:'facility',name:'新的航线',detail:'潮汐观测台开放特殊出海，随后学习 NPC 偷袭。',action:'island-feature',icon:'compass'}
];
export const HARBOR_EVENTS=[['salvage',5],['treasure',6],['shield',8],['attack',9],['raid',10]];
const HARBOR_UNLOCK={orders:5,book:6,gear:7,auto:7,tasks:10,outing:10,world:10,journey:10,weekly:10,voyage:10};
export const stagedVoyage=s=>s.onboarding?.harbor?.version===1&&!s.onboarding.harbor.returning;
export const harborActive=s=>stagedVoyage(s)&&!coreVoyage(s)&&!s.onboarding.harbor.complete;
export const harborUnlocked=(s,feature)=>!stagedVoyage(s)||voyageLand(s)>=(HARBOR_UNLOCK[feature]||0);
export function initHarbor(s){
 if(!newVoyage(s))return;
 // Returning v0.19 captains retain every feature they already had access to.
 s.onboarding.harbor??={version:1,returning:true,complete:true,seen:[]};
 if(stagedVoyage(s)&&(voyageLand(s)>=11||voyageLand(s)>=10&&s.onboarding.lessons.raid&&!s.event&&!s.manual))s.onboarding.harbor.complete=true;
}
export function harborGoal(s,c){
 if(!harborActive(s))return null;
 const n=voyageLand(s),o=s.onboarding,h=o.harbor,step=HARBOR_STEPS[Math.min(5,Math.max(0,n-5))];
 if(s.event)return {title:'继续这次海上冒险',detail:'已经打开的奖励与进度会保留，完成后再出发。',action:'event',step};
 if(['orders','aquarium','gear','workshop','facility'].includes(step.key)&&!h.seen.includes(step.key)){
  if(step.key!=='orders'||readyOrder(s))return {title:step.key==='orders'?'查看第一份订单补给':step.key==='aquarium'?'给海里的伙伴安个家':step.key==='gear'?'认识装备与长按自动钓鱼':step.key==='workshop'?'看看匠人小屋带来的物资':'认识潮汐观测台的特殊出海',detail:step.detail,action:step.action,index:step.index,ack:step.key,optional:true,step};
 }
 const lesson=HARBOR_EVENTS.find(([key,land])=>n>=land&&!o.lessons[key])?.[0];
 if(lesson&&!o.lessons[lesson])return {title:{salvage:'出海，找回飞机上的物资',treasure:'出海，发现潮汐寻珠',shield:'出海，认识守护贝壳',attack:'出海，认识第一位 NPC 对手',raid:'出海，试一次 NPC 偷袭'}[lesson],detail:'首次冒险会逐步出现，两次教学之间至少相隔两竿；也可以先继续建设。',action:'fish',step};
 const cost=c.buildCosts[Math.floor(n/5)];
 if(s.coin<cost)return {title:`为第 ${n+1} 块土地攒金币 · 还差 ${Math.ceil(cost-s.coin)}`,detail:`下一块需要 ${cost} 金币。钓鱼、已完成订单和海上冒险都能带来收益。`,action:'fish',step};
 return {title:`扩张至 ${n+1} 块，迎来下一段航程`,detail:n===7?'下一块建成匠人小屋，海岛物资将持续积累。':n===9?'下一块开放潮汐观测台和完整任务手帐。':'金币已经足够，选择与海岛相邻的格子继续扩张。',action:'expand',step};
}
function assertHarborAction(s,type){
 const feature=type==='gear/upgrade'||type==='manual/start'?'gear':type.startsWith('pet/')||type.startsWith('aquarium/')||type.startsWith('habitat/')||type==='collection/claim'?'book':type==='weekly/claim'||type==='journey/claim'||type==='voyage/claim'?'tasks':null;
 if(feature&&!harborUnlocked(s,feature))throw Error(`扩张至 ${HARBOR_UNLOCK[feature]} 块土地后开放这项航海功能`);
}
