import {EXTRA_FISH} from './content.js';
export const PET_SKILLS={
 clown:{role:0,name:'海湾账房',gold:.02},
 blue:{role:1,name:'破盾先锋',attack:12,salvage:2},
 sardine:{role:2,name:'寻宝向导',explore:.03,hint:true},
 butterfly:{role:0,name:'银行管家',gold:.015,bank:.015},
 parrot:{role:3,name:'静默潜游',steal:.02,cover:3},
 angel:{role:2,name:'宝藏饲育师',explore:.025,treasureFood:.1,hint:true},
 sunfish:{role:0,name:'丰收伙伴',gold:.025,food:.1},
 snapper:{role:0,name:'海上商人',gold:.015,steal:.01},
 grouper:{role:1,name:'工匠护卫',attack:10,repair:.02},
 tuna:{role:1,name:'重击猎手',attack:15},
 manta:{role:3,name:'暗潮搬运',steal:.03,cover:2},
 marlin:{role:3,name:'金库快手',steal:.04,cover:1},
 ...Object.fromEntries(EXTRA_FISH.map(f=>[f.id,f.skill]))
};
export function petEffects(id,level,mastery){const skill=PET_SKILLS[id];const out={};if(!skill)return out;for(const [k,v] of Object.entries(skill))if(!['role','name'].includes(k))out[k]=typeof v==='boolean'?v:Math.round(v*level*(mastery==='economy'?1.15:mastery==='guard'?1.1:1)*1000)/1000;if(mastery==='guard')out.cover=(out.cover||0)+3;return out;}
export function petDescription(id,level,mastery){const b=petEffects(id,level,mastery),p=n=>(n*100).toFixed(1).replace(/\.0$/,'');return [b.gold&&`鱼获／银行金币 +${p(b.gold)}%`,b.bank&&`银行额外 +${p(b.bank)}%`,b.attack&&`攻击 +${b.attack}`,b.salvage&&`破盾金币 +${b.salvage}`,b.explore&&`寻宝金币 +${p(b.explore)}%`,b.hint&&'标记宝藏大奖',b.steal&&`偷袭金币 +${p(b.steal)}%`,b.cover&&`被发现概率 −${b.cover} 个百分点`,b.repair&&`维修费用 −${p(b.repair)}%`,b.food&&`补给宠物粮 +${p(b.food)}%`,b.treasureFood&&`宝藏宠物粮 +${p(b.treasureFood)}%`].filter(Boolean).join('；');}
export function repairCost(s,index,bonus){return Math.max(1,Math.ceil(20*s.base[index]*(1-(bonus.repair||0))));}
