import {weekNumber} from './weekly.js';
import {landCount,regionOpen} from './content.js';
export const VOYAGE_THEMES=[
 {name:'海风寻迹',style:'sail-bay',color:'#5bb9a3'}, {name:'港湾来信',style:'sail-harbor',color:'#dfa267'},
 {name:'珊瑚之约',style:'sail-coral',color:'#e699b2'}, {name:'暖流探秘',style:'sail-ember',color:'#e79060'},
 {name:'极光航线',style:'sail-aurora',color:'#8eb8e0'}, {name:'星海回响',style:'sail-star',color:'#afa0dc'}
];
export const VOYAGE_STEPS=[
 {at:10,reward:{bait:4,supplies:2}},{at:30,reward:{food:6,supplies:3}},
 {at:60,reward:{bait:8,food:4}},{at:100,reward:{supplies:5},style:true},{at:160,reward:{bait:12,food:6}}
];
export const ISLAND_FEATURES=[
 {name:'潮汐观测台',verb:'跟随优质鱼群',cost:8,kind:'quality',detail:'本次必定遇到优秀及以上的鱼，仍按实际品质决定是否挑战。'},
 {name:'沉船打捞台',verb:'追寻沉船宝藏',cost:8,kind:'treasure',detail:'本次必定开启潮汐寻珠，匹配规则和奖励不变。'},
 {name:'珊瑚研究站',verb:'寻找陌生伙伴',cost:12,kind:'discovery',detail:'本次第一尾鱼优先寻找本海域未发现的伙伴；已全部发现则获得大体型鱼。'},
 {name:'暖流观测站',verb:'驶向大鱼暖流',cost:8,kind:'weight',detail:'本次鱼获体重至少达到该鱼种范围的 80%，不会突破上限。'},
 {name:'极光灯塔',verb:'记录极光鱼群',cost:8,kind:'voyage',detail:'本次必定遇鱼，收获后每消耗一次钓鱼额外增加 2 点主题航程。'},
 {name:'星盘神殿',verb:'追踪星辉珍品',cost:16,kind:'rare',detail:'本次必定遇到稀有鱼，保留好鱼挑战开关与原鱼保底。'}
];
export const SHORE_STYLES=[{id:'coast',name:'原色海风',color:'#5bb9a3',coin:0,supplies:0},
 {id:'garden',name:'珊瑚庆典',color:'#e699b2',coin:12000,supplies:20},
 {id:'aurora',name:'极光灯会',color:'#8eb8e0',coin:28000,supplies:40},
 {id:'golden',name:'金色远航',color:'#e2be60',coin:60000,supplies:80},
 ...VOYAGE_THEMES.map(t=>({id:t.style,name:t.name+'航旗',color:t.color,weekly:true}))];
export const styleFor=s=>SHORE_STYLES.find(x=>x.id===s.shoreStyle)||SHORE_STYLES[0];
export const voyageTheme=s=>VOYAGE_THEMES[s.voyage.theme];
export const voyageReady=s=>s.voyage&&VOYAGE_STEPS.some((x,i)=>s.voyage.points>=x.at&&!s.voyage.claimed.includes(i));
export function featureStatus(s,z=s.zone,bet=1){const feature=ISLAND_FEATURES[z],charge=s.islandSkills?.[z]||0,unlocked=!!feature&&regionOpen(s,z)&&landCount(s,z)>=10;return {feature,charge,unlocked,need:(feature?.cost||0)*bet,ready:unlocked&&charge>=feature.cost*bet};}
export function initExpedition(s,now){
 const week=weekNumber(now);if(!s.voyage||week>s.voyage.week)s.voyage={week,theme:((week%6)+6)%6,points:0,claimed:[]};
 if(!s.rivalTrail||week>s.rivalTrail.week)s.rivalTrail={week,step:0,rival:null,follow:false,claimed:false};
 s.islandSkills||=[0,0,0,0,0,0];s.festivals||=[];s.shoreStyles||=['coast'];s.shoreStyle??='coast';s.petBond||={};s.outingPlan||={goal:'casts',target:10,autoStop:true};s.outingHistory||=[];
}
export function newOuting(s,now){const unavailable=s.outingPlan.goal==='order'&&s.orders.claimed.length===3||s.outingPlan.goal==='expand'&&s.nodes.every(row=>row.reduce((a,b)=>a+b,0)>=25);s.outing={...s.outingPlan,...(unavailable?{goal:'casts'}:{}),id:String(now)+'-'+(s.outingSerial=(s.outingSerial||0)+1),started:now,active:true,completed:false,spent:0,fish:0,newFish:0,events:0,builds:0,bond:0,earned:{coin:0,supplies:0,food:0,bait:0},spentResources:{coin:0,supplies:0,food:0,bait:0}};return s.outing;}
export function ensureOuting(s,now){if(!s.outing?.active)newOuting(s,now);return s.outing;}
export function outingProgress(o){if(!o)return {count:0,target:10,label:'出海 10 次'};return o.goal==='casts'?{count:Math.min(o.spent,o.target),target:o.target,label:'消耗 '+o.target+' 次钓鱼'}:o.goal==='order'?{count:o.orders||0,target:1,label:'完成并领取一份每日订单'}:{count:o.builds,target:1,label:'扩张一块土地'};}
export function finishOuting(s,now,completed=false){const o=s.outing;if(!o?.active)return false;o.active=false;o.completed=completed;if(completed&&s.playStats)s.playStats.goals++;o.ended=now;s.outingHistory.unshift(structuredClone(o));s.outingHistory=s.outingHistory.slice(0,3);return true;}

export const festivalOn=(s,r)=>s.festivals?.[r]?.week===s.voyage.week;
