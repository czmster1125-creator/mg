import {randomUUID} from 'node:crypto';
import {SEA_GAME_FORMAT,SALVAGE_GOODS,ESCORT_TILES,escortReachable,seaGameReward} from '../shared/sea-games.js';
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function startSeaGame(s,kind,bet,rng){
 if(s.lastSeaGame===kind)kind=kind==='salvage'?'escort':'salvage';s.lastSeaGame=kind;
 s.event={id:randomUUID(),type:'sea-game',format:SEA_GAME_FORMAT,kind,zone:s.zone,bet,carried:{},...(kind==='salvage'?{goods:shuffle(SALVAGE_GOODS.map(x=>Object.fromEntries(Object.entries(x).map(([k,n])=>[k,n*bet]))),rng),picks:[]}:{tiles:Array.from({length:3},()=>shuffle(['calm','food','current'],rng)).flat(),path:[],energy:3})};
 return {type:'sea-game',event:true};
}
export function seaGameAction(s,type,p){
 if(!['event/salvage','event/escort','event/sea-return'].includes(type))return null;
 const e=s.event;if(e?.type!=='sea-game'||e.id!==p.id)throw Error('海上互动已结束或编号无效');
 let result;
 if(type==='event/salvage'){
  if(e.kind!=='salvage'||!Number.isInteger(p.cell)||p.cell<0||p.cell>=6||e.picks.includes(p.cell))throw Error('请选择尚未打捞的漂流箱');
  if(p.turn!==e.picks.length)throw Error('打捞进度已变化，请继续当前航次');
  e.picks.push(p.cell);for(const[k,n]of Object.entries(e.goods[p.cell]))e.carried[k]=(e.carried[k]||0)+n;
  if(e.picks.length<3)return {type:'sea-game-step',event:true,cell:p.cell,kind:e.kind};
 }else if(type==='event/escort'){
  if(e.kind!=='escort'||p.turn!==e.path.length||!escortReachable(e,p.cell))throw Error('请选择下一排相邻浮标，不能跨排或跳过急流');
  const tile=ESCORT_TILES[e.tiles[p.cell]];e.path.push(p.cell);e.energy-=tile.energy;for(const[k,n]of Object.entries(tile.reward))e.carried[k]=(e.carried[k]||0)+n;
  if(e.path.length<3&&e.energy>0)return {type:'sea-game-step',event:true,cell:p.cell,kind:e.kind};
 }
 const early=type==='event/sea-return',reward=seaGameReward(e,early);
 for(const[k,n]of Object.entries(reward))s[k]+=n;
 result={type:'encounter',format:SEA_GAME_FORMAT,kind:e.kind,zone:e.zone,bet:e.bet,reward,early,failed:e.kind==='escort'&&e.energy<=0,steps:e.picks?.length??e.path.length};
 s.seaGameCount=(s.seaGameCount||0)+1;s.event=null;return result;
}
