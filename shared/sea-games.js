export const SEA_GAME_FORMAT='sea-game-v1';
export const SALVAGE_GOODS=[{supplies:2},{food:2},{coin:35},{supplies:1,food:1},{coin:25,food:1},{coin:25,supplies:1}];
export const ESCORT_TILES={calm:{name:'平稳水道',icon:'anchor',detail:'+1 物资',reward:{supplies:1},energy:0},food:{name:'海草浮标',icon:'fish',detail:'+1 鱼宠粮',reward:{food:1},energy:0},current:{name:'急流水道',icon:'wind',detail:'+30 金币 · 安全 −1',reward:{coin:30},energy:1}};
export function escortReachable(e,cell){if(!Number.isInteger(cell)||cell<0||cell>=9)return false;const row=e.path.length,col=e.path.length?e.path.at(-1)%3:1;return Math.floor(cell/3)===row&&Math.abs(cell%3-col)<=1;}
export function seaGameReward(e,returnEarly=false){
 if(e.kind==='salvage')return e.picks.length?e.carried:{supplies:e.bet};
 if(returnEarly||e.energy<=0)return {bait:1,food:1};
 return {bait:3,coin:e.carried.coin||0,food:e.carried.food||0,supplies:(e.carried.supplies||0)+2};
}
