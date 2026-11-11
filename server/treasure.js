import {randomUUID} from 'node:crypto';
import {SHELL_FORMAT,SHELL_SYMBOLS,shellCounts,treasurePrizes} from '../shared/treasure.js';
import {bonuses,points} from '../shared/adventure.js';

export function startShellTreasure(s,bet,rng,fish){
 const b=bonuses(s,fish),advanced=points(s)>=15;
 const board=SHELL_SYMBOLS.flatMap(v=>Array(3).fill(v.id));
 for(let i=board.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[board[i],board[j]]=[board[j],board[i]];}
 const prizes=treasurePrizes(s,bet,fish);
 s.event={id:randomUUID(),type:'treasure',format:SHELL_FORMAT,bet,advanced,board,prizes,picks:[],hint:b.hint||b.explore>0?board.indexOf('pearl'):null};
 return {type:'treasure',event:true};
}

export function openShell(s,p){
 const e=s.event;
 if(e?.type!=='treasure'||e.format!==SHELL_FORMAT||e.id!==p.id)throw Error('寻珠事件已结束或编号无效');
 if(!Number.isInteger(p.cell)||p.cell<0||p.cell>=9||e.picks.some(v=>v.cell===p.cell))throw Error('请选择未打开的贝壳');
 const symbol=e.board[p.cell];e.picks.push({cell:p.cell,symbol});
 const count=shellCounts(e.picks)[symbol];
 if(count<3)return {type:'shell',cell:p.cell,symbol,count};
 const total={coin:0,supplies:0,food:0,...e.prizes[symbol]};
 for(const[k,n]of Object.entries(total))s[k]+=n;
 const result={type:'treasure',format:SHELL_FORMAT,symbol,total,matched:e.picks.filter(p=>p.symbol===symbol).map(p=>p.cell),picks:e.picks};
 s.event=null;return result;
}
