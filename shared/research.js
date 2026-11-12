import {landCount} from './content.js';
export const AQUARIUM_THEMES=[
 {id:'sand',name:'海湾沙床',water:'#0f5775',sand:'#e5c18b',plant:'#47b39a'},
 {id:'lagoon',name:'翡翠礁湖',water:'#1b6e72',sand:'#cfdeb1',plant:'#72b68a'},
 {id:'harbor',name:'暖灯港湾',water:'#335d73',sand:'#d6bc91',plant:'#d5ac6c'},
 {id:'reef',name:'珊瑚秘境',water:'#47537a',sand:'#e2c5bf',plant:'#e59eb6'},
 {id:'ember',name:'暖流黑沙',water:'#434b62',sand:'#8e817e',plant:'#dc9467'},
 {id:'ice',name:'极光冰海',water:'#396d89',sand:'#dce8df',plant:'#a6c8d7'},
 {id:'star',name:'星辉深海',water:'#333c67',sand:'#bcb3ce',plant:'#b9a2de'}
];
export const HABITATS=[{id:'meadow',name:'海草花园',supplies:15,food:8,detail:'让沙床长出摇曳海草和贝壳'},
 {id:'coral',name:'珊瑚拱门',supplies:25,food:12,detail:'建成可穿游的珊瑚门廊'},
 {id:'lantern',name:'沉船灯庭',supplies:40,food:20,detail:'点亮沉船遗迹旁的暖灯'}];
export const habitatCost=(id,level)=>{const d=HABITATS.find(d=>d.id===id);return d&&level<3?{supplies:d.supplies*2**level,food:d.food*2**level}:null;};
export const journalOpen=s=>landCount(s,0)>=10;
export const journalReady=s=>journalOpen(s)&&s.research&&!s.research.claimed&&s.research.targets.every(t=>t.count>=t.target);
export const aquariumTheme=s=>AQUARIUM_THEMES.find(t=>t.id===s.aquarium?.theme)||AQUARIUM_THEMES[0];
export const cared=(s,id)=>s.aquarium?.habitats?.[id]?.week===s.voyage.week;
export function initResearch(s,fish,now){
 s.aquarium||={theme:'sand',themes:['sand'],habitats:{},memories:0};s.petPresets||={};s.researchArchive||=[];s.researchBooks??=0;
 if(!s.research||s.voyage.week>s.research.week){const week=s.voyage.week,seas=s.unlocked.slice().sort((a,b)=>a-b),targets=Array.from({length:3},(_,i)=>{const zone=seas[((week+i)%seas.length+seas.length)%seas.length],pool=fish.filter(f=>f.zone===zone&&(i===2?f.rarity===2:f.rarity<2)),f=pool[((week+i*3)%pool.length+pool.length)%pool.length];return {species:f.id,zone,ratio:i===1?.65:0,target:i===0?2:1,count:0};});s.research={week,theme:1+((week%6)+6)%6,targets,claimed:false};}
 s.playStats||={since:now,casts:0,spent:0,events:0,rareOffered:0,manualWon:0,manualFailed:0,guaranteed:0,goals:0,care:0};
}
export function researchCatch(s,result,f){if(!journalOpen(s))return;const ratio=(result.weight-f.min)/Math.max(1,f.max-f.min);for(const t of s.research.targets)if(t.species===f.id&&ratio+1e-8>=t.ratio)t.count=Math.min(t.target,t.count+1);}
export function weekRemaining(s){const minutes=Math.max(0,Math.ceil(((s.voyage.week*7+4)*86400000-8*3600000-s.lastSettle)/60000));if(minutes<60)return minutes+' 分钟';const hours=Math.floor(minutes/60);return Math.floor(hours/24)+' 天 '+hours%24+' 小时';}
