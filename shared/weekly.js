import {gameDay} from './orders.js';
export const weekNumber=now=>Math.floor((gameDay(now)+3)/7);
export function weeklyDefs(w){const z=w.zone,rotation=w.rotation??w.week;return [
 {id:'catch',name:rotation%2?'珍品观测':'海域采样',detail:rotation%2?'在指定海域捕获优秀及以上鱼种':'在指定海域捕获任意鱼种',target:rotation%2?8:20,kind:'catch',rare:!!(rotation%2),zone:z,reward:{coin:400+z*120,food:8,bait:8}},
 {id:'event',name:['寻宝日志','破盾行动','潜行记录'][rotation%3],detail:['完成宝藏探索','完成攻击事件','完成偷袭事件'][rotation%3],target:4,kind:['treasure','attack','raid'][rotation%3],reward:{coin:450+z*120,materials:6,bait:8}},
 {id:'growth',name:'伙伴与家园',detail:'培养、专精、伙伴训练、建筑升级、扩张或布置地标',target:5,kind:'growth',reward:{coin:350+z*100,parts:8,food:8}}
 ];}
export function settleWeekly(s,now){const week=weekNumber(now);if(!s.weekly||week>s.weekly.week){const seas=[...s.unlocked].sort((a,b)=>a-b);s.weekly={week,zone:seas[week%seas.length],rotation:Math.floor(week/seas.length),counts:{catch:0,event:0,growth:0},claimed:[]};}s.weeklyBadges??=0;}
export function weeklyProgress(s,kind,data={}){for(const d of weeklyDefs(s.weekly))if(d.kind===kind&&(kind!=='catch'||data.zone===d.zone&&(!d.rare||data.rarity>=1)))s.weekly.counts[d.id]=Math.min(d.target,(s.weekly.counts[d.id]||0)+1);}
export const weeklyReady=s=>s.weekly&&weeklyDefs(s.weekly).some(d=>s.weekly.counts[d.id]>=d.target&&!s.weekly.claimed.includes(d.id));
