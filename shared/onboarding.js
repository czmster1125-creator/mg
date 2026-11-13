import {HOME_BUILDINGS} from './home.js';
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
}
