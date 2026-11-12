import {AQUARIUM_THEMES,HABITATS,habitatCost,journalOpen,journalReady,cared} from '../shared/research.js';
import {slots,role} from '../shared/adventure.js';import {petEffects} from '../shared/pets.js';import {config as C} from './config.js';
export function suggestedPets(s,slot){const seen=new Set();return C.fish.filter(f=>s.pets[f.id]).map(f=>{const e=petEffects(f.id,s.pets[f.id].level,s.mastery[f.id]);return {id:f.id,score:slot==='home'?(e.gold||0)*100+(e.bank||0)*120+(e.repair||0)*5:(e.attack||0)*.05+(e.explore||0)*30+(e.steal||0)*30+(e.cover||0)*.1};}).sort((a,b)=>b.score-a.score).filter(x=>{const r=role(x.id,C.fish);if(seen.has(r))return false;seen.add(r);return true;}).slice(0,slots(s)).map(x=>x.id);}
export function researchAction(s,type,p,now){
 if(type==='journal/claim'){if(p.week!==s.research.week||!journalReady(s))throw Error('观察册尚未完成、已领取或本周已更新');s.research.claimed=true;s.researchBooks++;const theme=AQUARIUM_THEMES[s.research.theme];if(!s.aquarium.themes.includes(theme.id))s.aquarium.themes.push(theme.id);s.researchArchive.unshift({week:s.research.week,theme:theme.id,species:s.research.targets.map(t=>t.species)});s.researchArchive=s.researchArchive.slice(0,24);return {message:'本周观察册已收藏：'+theme.name+'鱼缸主题，观察纪念 +1'};}
 if(type==='aquarium/theme'){if(!s.aquarium.themes.includes(p.id)||!AQUARIUM_THEMES.some(t=>t.id===p.id))throw Error('尚未拥有这个鱼缸主题');s.aquarium.theme=p.id;return {message:'鱼缸主题已更换'};}
 if(['habitat/build','habitat/care'].includes(type)){const d=HABITATS.find(d=>d.id===p.id);if(!d)throw Error('请选择有效栖地');if(Object.keys(s.book).length<3)throw Error('发现 3 种鱼后可建设栖地');const h=s.aquarium.habitats[d.id]||{level:0,week:-1,memories:0};let cost;
  if(type==='habitat/build'){cost=habitatCost(d.id,h.level);if(!cost)throw Error('栖地已建至三级');}
  else{if(!h.level)throw Error('先建成这处栖地');if(p.week!==s.voyage.week||cared(s,d.id))throw Error('本周已养护或周航程已更新');cost={supplies:h.level*15,food:h.level*10};}
  if(s.supplies<cost.supplies||s.food<cost.food)throw Error('海岛物资或鱼宠粮不足');s.supplies-=cost.supplies;s.food-=cost.food;if(type==='habitat/build')h.level++;else{h.week=s.voyage.week;h.memories++;s.aquarium.memories++;s.playStats.care++;}s.aquarium.habitats[d.id]=h;return {message:type==='habitat/build'?d.name+'已建设，鱼缸景观已经变化':d.name+'本周养护完成，栖地纪念永久保留'};
 }
 if(type.startsWith('pet/preset/')){if(!['home','adventure'].includes(p.slot))throw Error('请选择经营或冒险预设');
  if(type==='pet/preset/save'){if(!s.equipped.length)throw Error('先选择至少一位随行伙伴');s.petPresets[p.slot]=s.equipped.slice();return {message:'当前随行伙伴已保存到'+(p.slot==='home'?'经营':'冒险')+'预设'};}
  const ids=type==='pet/preset/recommend'?suggestedPets(s,p.slot):type==='pet/preset/apply'?s.petPresets[p.slot]:null;
  if(!ids?.length||ids.length>slots(s)||new Set(ids).size!==ids.length||ids.some(id=>!Object.hasOwn(s.pets,id)||!C.fish.some(f=>f.id===id))||new Set(ids.map(id=>role(id,C.fish))).size!==ids.length)throw Error('预设为空或含有未开放的伙伴位置');s.equipped=ids.slice();if(type==='pet/preset/recommend')s.petPresets[p.slot]=ids.slice();return {message:(p.slot==='home'?'经营':'冒险')+'随行预设已启用，原有加成上限照常生效'};
 }
 return null;
}
