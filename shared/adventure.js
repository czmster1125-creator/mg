import {HOME_BUILDINGS} from './home.js';
import {PET_SKILLS,petEffects} from './pets.js';
export const BANK_RATES=[0,12,32,72,152,312];
export const UPGRADE_COSTS=[0,80,200,480,1000];
export const BUILD_UNLOCK=HOME_BUILDINGS.map(b=>b.unlock);
export const ROLES=['经营','攻击','探索','潜行'];
export const GUIDES=[
 {name:'捕获第一条鱼',detail:'抛竿，获得金币和第一只鱼宠',target:'fish',event:'catch'},
 {name:'扩张第一块土地',detail:'点击海岛边缘的蓝色加号',target:'map',event:'expand'},
 {name:'完成一次 NPC 攻击',detail:'下一次抛竿将钓到挑战漂流瓶',target:'fish',event:'attack'},
 {name:'完成一次宝藏探索',detail:'下一次抛竿将钓到宝藏地图',target:'fish',event:'treasure'},
 {name:'获得海岛护盾',detail:'下一次抛竿将钓到守护贝壳',target:'fish',event:'shield'},
 {name:'扩张到五块土地',detail:'解锁伙伴小屋与第二个随行位置',target:'map',event:'expand5'}
];
export function migrateGuide(s){if(s.guideVersion===2)return;const from=Math.max(0,Math.min(8,Math.floor(s.guide||0))),to=[0,1,1,2,3,4,4,5,6][from],coin=Math.max(0,to*40-from*30);s.guide=to;s.guideVersion=2;if(coin){s.coin+=coin;s.bait+=coin/10;s.food+=coin/10;}s.guideMigration={from,to,coin};}
export const points=s=>s.nodes[0].reduce((a,b)=>a+b,0);
export const slots=s=>points(s)>=10?3:points(s)>=5?2:1;
export const role=(id,fish)=>PET_SKILLS[id]?.role??fish.findIndex(f=>f.id===id)%3;
export function bonuses(s,fish){const b={gold:0,bank:0,attack:0,explore:0,steal:0,cover:0,salvage:0,repair:0,food:0,treasureFood:0,hint:false};for(const id of s.equipped||[]){const e=petEffects(id,s.pets?.[id]?.level||0,s.mastery?.[id]);for(const [k,v] of Object.entries(e))if(k==='hint')b.hint ||= v;else b[k]+=v;}for(const [k,cap] of Object.entries({gold:.3,bank:.15,attack:120,explore:.3,steal:.4,cover:30,repair:.2,food:1,treasureFood:1}))b[k]=Math.min(cap,b[k]);return b;}
export function rates(s,base,fish){const b=bonuses(s,fish);return base.map((v,i)=>{const value=i===1?BANK_RATES[s.base[i]]:v.rate*s.base[i];return value*(i===1?1+b.gold+b.bank:1)*(i&&s.damage?.[i]?.5:1);});}
