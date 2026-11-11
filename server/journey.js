import {ENCOUNTERS,rewardText} from '../shared/encounters.js';
import {regionOpen} from '../shared/content.js';
import {CHAPTERS,MASTERY,chapterReady} from '../shared/journey.js';
import {bonuses} from '../shared/adventure.js';
import {config as C} from './config.js';
export function journeyAction(s,type,p,now){
 if(type==='event/encounter'){const e=s.event;if(e?.type!=='encounter'||e.id!==p.id)throw Error('奇遇已结束');if(!['salvage','rescue','leave'].includes(p.choice))throw Error('请选择行动');const c=ENCOUNTERS[e.kind]||ENCOUNTERS.wreck;let message;if(p.choice==='salvage'){if(s.coin<c.coin)throw Error(`修复需要 ${c.coin} 金币`);s.coin-=c.coin;for(const[k,n]of Object.entries(c.loot))s[k]+=n;message='修复完成：'+rewardText(c.loot);}else if(p.choice==='rescue'){if(s.food<c.food)throw Error(`援助需要 ${c.food} 鱼宠粮`);s.food-=c.food;s.bait+=c.bait;s.relics+=c.relics;message=`援助完成：${c.bait} 鱼饵与 ${c.relics} 枚纪念章`;}else{s.bait++;message='平安返航：1 鱼饵';}s.event=null;return {type:'encounter',message};}
 if(type==='journey/claim'){const c=CHAPTERS[s.journey.chapter];if(!chapterReady(s))throw Error('章节条件尚未全部达成');for(const[k,n]of Object.entries(c.reward))s[k]+=n;s.journey.chapter++;return {message:'章节完成：'+c.name};}
 if(type==='pet/train'){if(!Object.hasOwn(s.pets,p.id))throw Error('尚未解锁这条鱼');if(s.food<2)throw Error('陪伴训练需要 2 鱼宠粮');s.food-=2;s.petBond||={};s.petBond[p.id]=(s.petBond[p.id]||0)+1;return {message:'训练完成，伙伴默契 +1；本次已计入周委托'};}
 if(type==='pet/mastery'){if(!Object.hasOwn(s.pets,p.id)||s.pets[p.id].level<5)throw Error('鱼宠达到 5 级后开放专精');if(!Object.hasOwn(MASTERY,p.branch))throw Error('请选择有效专精');if(s.mastery[p.id])throw Error('该鱼宠已选择专精');if(s.supplies<11)throw Error('专精需要 11 海岛物资');s.supplies-=11;s.mastery[p.id]=p.branch;return {message:'专精已生效：'+MASTERY[p.branch].name};}
 if(type==='island/decorate'){const i=p.region;if(!regionOpen(s,i)||s.nodes[i].reduce((a,b)=>a+b,0)<10)throw Error('该岛扩张 10 块后开放地标布置');s.decor||=[0,0];if(s.decor[i]>=3)throw Error('地标已满级');const coin=150*(s.decor[i]+1),supplies=3*(s.decor[i]+1);if(s.coin<coin||s.supplies<supplies)throw Error(`地标布置需要 ${coin} 金币与 ${supplies} 海岛物资`);s.coin-=coin;s.supplies-=supplies;s.decor[i]++;return {message:'岛屿地标已升级，装饰永久保留'};}
 if(type==='rescue/claim'){if(s.bait>=1)throw Error('仍有鱼饵，可以继续出海');if(now-s.rescueAt<6*3600000)throw Error('补给尚未到港，六小时可领取一次');s.rescueAt=now;s.bait+=5;return {message:'应急补给：5 鱼饵已送达'};}
 return null;
}
