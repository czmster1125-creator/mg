export const SHELL_FORMAT='shell-match-v1';
export const SHELL_SYMBOLS=[
 {id:'coins',name:'漂流金币',icon:'coins'},
 {id:'crate',name:'海岛补给',icon:'package'},
 {id:'pearl',name:'月光珍珠',icon:'gem'}
];
export function shellCounts(picks){return Object.fromEntries(SHELL_SYMBOLS.map(s=>[s.id,picks.filter(p=>p.symbol===s.id).length]));}
export function shellRewardText(r){return [['coin','金币'],['supplies','海岛物资'],['food','鱼宠粮']].filter(([k])=>r[k]>0).map(([k,n])=>`${r[k]} ${n}`).join(' · ');}
