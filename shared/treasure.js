import {gearEffects} from './equipment.js';
import {bonuses,points} from './adventure.js';
export const SHELL_FORMAT='shell-match-v1';
export const SHELL_SYMBOLS=[
 {id:'coins',name:'漂流金币',icon:'coins'},
 {id:'crate',name:'海岛补给',icon:'package'},
 {id:'pearl',name:'月光珍珠',icon:'gem'}
];
export function shellCounts(picks){return Object.fromEntries(SHELL_SYMBOLS.map(s=>[s.id,picks.filter(p=>p.symbol===s.id).length]));}
export function shellRewardText(r){return [['coin','金币'],['supplies','海岛物资'],['food','鱼宠粮']].filter(([k])=>r[k]>0).map(([k,n])=>`${r[k]} ${n}`).join(' · ');}
export function treasurePrizes(s,bet,fish){const gear=gearEffects(s),b=bonuses(s,fish),advanced=points(s)>=15,coin=n=>Math.floor(n*bet*(1+gear.explore)*(1+b.explore));return {coins:{coin:coin(advanced?90:60),supplies:gear.crates*bet},crate:{coin:coin(advanced?125:95),supplies:(2+gear.crates)*bet},pearl:{coin:coin(advanced?170:140),supplies:gear.crates*bet,food:Math.floor(3*bet*(1+b.treasureFood))}};}
