import {owned} from './hex.js';
import {HOME_BUILDINGS} from './home.js';
import {voyageBoat,newVoyage} from './onboarding.js';
export function constructionPlan(before,after,region=0){
 const old=new Set(owned(before,region)),land=owned(after,region).filter(id=>!old.has(id));
 const buildings=after.base.flatMap((level,index)=>level>before.base[index]?[{index,level,name:HOME_BUILDINGS[index].name,upgrade:before.base[index]>0}]:[]);
 const delivery=!voyageBoat(before)&&voyageBoat(after),first=land.length&&old.size===0&&newVoyage(before);
 if(!land.length&&!buildings.length)return null;
 return {region,land,buildings,delivery,duration:delivery?2200:buildings.length?1700:1300,title:delivery?'潮汐小屋落成，小舟抵达':buildings.length>1?'小铺开张，伙伴安家':buildings.length?buildings[0].name+(buildings[0].upgrade?'焕然一新':'落成'):first?'第一块落脚地，铺好了':'新的海岸，铺好了',detail:delivery?'阿澜送来小舟，往后的海风一起去看。':buildings.length?'小屋已经出现在海岛上，新的生活开始了。':'潮水退去，木台和绿地连接起新的家园。'};
}
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const p=clamp(x);return p*p*(3-2*p);};
export function constructionFrame(plan,elapsed,reduced=false){
 const t=clamp(elapsed/(reduced?140:plan.duration));
 return {progress:t,done:t===1,land:reduced?1:ease(t/.55),building:reduced?1:ease((t-.2)/.6),boat:reduced?1:ease((t-.32)/.68),phase:t===1?'complete':plan.delivery&&t>=.4?'boat':plan.buildings.length&&t>=.25?'build':'land'};
}
