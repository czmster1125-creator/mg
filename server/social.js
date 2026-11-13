import {newVoyage} from '../shared/onboarding.js';
import {randomUUID} from 'node:crypto';
import {settle} from './engine.js';
import {bonuses,points,GUIDES} from '../shared/adventure.js';
import {config as C} from './config.js';
import {gameDay} from '../shared/orders.js';
export function createSocial(db,accounts){
 db.exec(`CREATE TABLE IF NOT EXISTS friends(sender TEXT, receiver TEXT, accepted INTEGER DEFAULT 0, PRIMARY KEY(sender,receiver));CREATE TABLE IF NOT EXISTS visits(id TEXT PRIMARY KEY, actor TEXT, target TEXT, kind TEXT, created INTEGER, amount INTEGER, closed INTEGER, retaliation INTEGER DEFAULT 0);`);
 db.exec('CREATE INDEX IF NOT EXISTS visits_target_time ON visits(target,created);CREATE INDEX IF NOT EXISTS visits_pair_time ON visits(actor,target,created);CREATE INDEX IF NOT EXISTS visits_pending ON visits(closed,created);CREATE INDEX IF NOT EXISTS friends_receiver ON friends(receiver)');
 const read=id=>{const row=db.prepare('SELECT state FROM players WHERE id=?').get(id);if(!row)return null;const s=JSON.parse(row.state);settle(s);return s;};const save=(id,s)=>db.prepare('INSERT OR REPLACE INTO players VALUES(?,?)').run(id,JSON.stringify(s));
 const profile=id=>accounts.find(id);
 const eligible=s=>s.catchCount>=3&&points(s)>=(newVoyage(s)?10:1);
 function panel(id,s){return {account:profile(id)||null,opted:!!s.pvp,eligible:eligible(s),friends:db.prepare(`SELECT a.code,a.name,f.accepted,CASE WHEN f.sender=? THEN 'sent' ELSE 'received' END direction FROM friends f JOIN accounts a ON a.player=CASE WHEN f.sender=? THEN f.receiver ELSE f.sender END WHERE f.sender=? OR f.receiver=?`).all(id,id,id,id),reports:(s.reports||[]).slice(0,20)};}
 function start(id,s,p,now=Date.now(),cost=1){
  if(!profile(id)||!s.pvp)throw Error('请先绑定账号并加入海岛互访');if(!eligible(s))throw Error('请先完成新手保护期，再参与互访');if(s.event||s.manual)throw Error('请先完成当前挑战');if(s.bait<cost)throw Error('需要 1 鱼饵');if(!['attack','raid'].includes(p.kind))throw Error('请选择攻击或偷袭');
  let target,revenge=null;
  if(p.revenge){revenge=db.prepare('SELECT * FROM visits WHERE id=? AND target=? AND closed=1 AND retaliation=0').get(p.revenge,id);if(!revenge||now-revenge.created>7*86400000)throw Error('复仇机会已使用或过期');target=revenge.actor;}
  else if(p.code){const a=db.prepare('SELECT player FROM accounts WHERE code=?').get(String(p.code).toUpperCase());target=a?.player;}
  else {const rows=db.prepare('SELECT player FROM accounts WHERE player<>? ORDER BY random() LIMIT 100').all(id);target=rows.map(x=>x.player).find(x=>{const t=read(x);return t?.pvp&&eligible(t);});}
  if(!target||target===id)throw Error('暂时没有可互访的真实海岛，可继续 NPC 冒险');const t=read(target);if(!t?.pvp||!eligible(t))throw Error('目标未加入互访或仍在新手保护中');
  if(db.prepare('SELECT id FROM visits WHERE actor=? AND target=? AND created>?').get(id,target,now-300000))throw Error('同一目标五分钟内只能互访一次');
  const dayStart=gameDay(now)*86400000-8*3600000;if(db.prepare('SELECT COUNT(*) n FROM visits WHERE target=? AND created>=?').get(target,dayStart).n>=3)throw Error('目标今日已达到受袭保护上限');
  if(p.kind==='attack'&&t.damage.filter(Boolean).length>=2&&!t.shields)throw Error('目标正在维修保护中');
  const escrow=p.kind==='raid'?Math.min(250,Math.floor(t.coin*.1)):0;if(p.kind==='raid'&&escrow<1)throw Error('目标没有可搬运金币');
  const visit=randomUUID();s.bait-=cost;if(revenge)db.prepare('UPDATE visits SET retaliation=1 WHERE id=?').run(revenge.id);
  const b=bonuses(s,C.fish);if(p.kind==='raid'){t.coin-=escrow;s.event={id:visit,type:'raid',live:true,targetName:profile(target).name,stage:'approach',bet:1,turn:0,carried:0,vault:escrow,initial:escrow,bonus:b.steal,cover:b.cover,rolls:Array.from({length:3},()=>Math.random()),log:[]};}
  else s.event={id:visit,type:'attack',live:true,targetName:profile(target).name,bet:1,shield:t.shields,damage:[0,0,0]};
  db.prepare('INSERT INTO visits(id,actor,target,kind,created,amount,closed) VALUES(?,?,?,?,?,?,0)').run(visit,id,target,p.kind,now,escrow);t.reports.unshift({text:`${profile(id).name} 正在${p.kind==='raid'?'潜入':'接近'}你的海岛`,actorName:profile(id).name});t.reports=t.reports.slice(0,20);save(target,t);return {message:'已抵达 '+profile(target).name+' 的真实海岛'};
 }
 function action(id,s,type,p){
  if(type==='social/opt'){if(!profile(id))throw Error('请先绑定账号');if(p.enabled!==true&&p.enabled!==false)throw Error('设置无效');if(p.enabled&&!eligible(s))throw Error(newVoyage(s)?'捕获三条鱼并扩张十块土地后开放互访':'捕获三条鱼并扩张一块土地后开放互访');s.pvp=p.enabled;return {message:s.pvp?'已加入互访，离线时也可能受到攻击；每日最多被访问三次':'已退出互访，已开始的事件仍会结算'};}
  if(type==='social/friend'){if(!profile(id))throw Error('请先绑定账号');const a=db.prepare('SELECT player FROM accounts WHERE code=?').get(String(p.code||'').toUpperCase());if(!a||a.player===id)throw Error('好友码不存在');const incoming=db.prepare('SELECT * FROM friends WHERE sender=? AND receiver=?').get(a.player,id);if(incoming){db.prepare('UPDATE friends SET accepted=1 WHERE sender=? AND receiver=?').run(a.player,id);return {message:'已接受好友邀请'};}if(db.prepare('SELECT COUNT(*) n FROM friends WHERE sender=? OR receiver=?').get(id,id).n>=100)throw Error('好友与待处理邀请最多 100 条');db.prepare('INSERT OR IGNORE INTO friends VALUES(?,?,0)').run(id,a.player);return {message:'好友邀请已发送，对方接受后显示为好友'};}
  if(type==='social/start')return start(id,s,p);
  return null;
 }
 function complete(id,s,type,p){const e=s.event;if(!e?.live||!['event/attack','event/bank','event/steal'].includes(type))return null;if(p.id!==e.id)throw Error('事件编号无效');const v=db.prepare('SELECT * FROM visits WHERE id=? AND actor=? AND closed=0').get(e.id,id);if(!v)throw Error('真实互访已结束');const target=read(v.target);if(!target)throw Error('目标存档不可用');
  if(e.type==='attack'){
   if(type!=='event/attack'||!Number.isInteger(p.target)||p.target<0||p.target>2)throw Error('请选择目标建筑');const idx=[1,2,3][p.target];let blocked=target.shields>0,broken=false,coin=0;if(blocked)target.shields--;else if(target.base[idx]&&!target.damage[idx]&&target.damage.filter(Boolean).length<2){target.damage[idx]=true;broken=true;coin=25;s.coin+=coin;}s.event=null;db.prepare('UPDATE visits SET closed=1 WHERE id=?').run(v.id);target.reports.unshift({text:`${profile(id).name} ${blocked?'被护盾挡住':broken?'损坏了'+C.base[idx].name:'未造成新增损伤'}`,actorName:profile(id).name,revenge:v.id});target.reports=target.reports.slice(0,20);save(v.target,target);return {type:'attack',target:p.target,coin,blocked,broken,live:true,targetName:e.targetName};
  }
  return {visit:v,target};
 }
 function finishRaid(context,result,s){if(!context||s.event)return;if(result.type!=='raid')return;const {visit,target}=context;const stolen=Math.min(visit.amount,result.coin);target.coin+=visit.amount-stolen;target.reports.unshift({text:`${profile(visit.actor).name} 偷袭带走 ${stolen} 金币，余款已退回`,actorName:profile(visit.actor).name,revenge:visit.id});target.reports=target.reports.slice(0,20);save(visit.target,target);db.prepare('UPDATE visits SET closed=1 WHERE id=?').run(visit.id);}
 function expire(now=Date.now()){const rows=db.prepare('SELECT * FROM visits WHERE closed=0 AND created<?').all(now-24*3600000);for(const v of rows){const actor=read(v.actor),target=read(v.target);if(target&&v.kind==='raid'){target.coin+=v.amount;save(v.target,target);}if(actor?.event?.id===v.id){actor.event=null;actor.reports.unshift({text:'互访超过 24 小时，未结算金币已退还目标'});save(v.actor,actor);}db.prepare('UPDATE visits SET closed=1,retaliation=1 WHERE id=?').run(v.id);}}
 function convert(id,s,bet){if(s.event?.lesson||!s.pvp||s.guide<GUIDES.length||bet!==1||!['attack','raid'].includes(s.event?.type))return;const old=s.event;s.event=null;try{start(id,s,{kind:old.type},Date.now(),0);}catch(e){s.event=old;}}
 return {panel,action,complete,finishRaid,expire,convert};
}
