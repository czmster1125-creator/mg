export const COOP_GOAL=120;
export function createCooperation(db,accounts){
 db.exec('CREATE TABLE IF NOT EXISTS lighthouse_coop(id TEXT PRIMARY KEY,week INTEGER,a TEXT,b TEXT,accepted INTEGER DEFAULT 0,pa INTEGER DEFAULT 0,pb INTEGER DEFAULT 0,sa INTEGER DEFAULT 0,sb INTEGER DEFAULT 0,ca INTEGER DEFAULT 0,cb INTEGER DEFAULT 0); CREATE INDEX IF NOT EXISTS lighthouse_member_week ON lighthouse_coop(week,a,b);');
 const current=(id,week)=>db.prepare('SELECT * FROM lighthouse_coop WHERE week=? AND (a=? OR b=?)').get(week,id,id);
 const read=id=>{const row=db.prepare('SELECT state FROM players WHERE id=?').get(id);return row?JSON.parse(row.state):null;};
 const points=(s,week)=>s?.voyage?.week===week?s.voyage.points:0;
 function panel(id,s){const week=s.voyage.week,g=current(id,week);if(!g)return null;const mine=g.a===id;return {id:g.id,week,accepted:!!g.accepted,incoming:!mine,partner:accounts.find(mine?g.b:g.a)?.name||'船友',mine:mine?g.pa:g.pb,theirs:mine?g.pb:g.pa,total:g.pa+g.pb,goal:COOP_GOAL,claimed:!!(mine?g.ca:g.cb)};}
 function contribute(id,s){const g=current(id,s.voyage.week);if(!g?.accepted)return;const mine=g.a===id,source=mine?'sa':'sb',counter=mine?'pa':'pb',delta=Math.max(0,s.voyage.points-g[source]);if(delta)db.prepare(`UPDATE lighthouse_coop SET ${counter}=${counter}+?,${source}=? WHERE id=?`).run(delta,s.voyage.points,g.id);}
 function action(id,s,type,p){
  if(!type.startsWith('coop/'))return null;const week=s.voyage.week;
  if(!accounts.find(id))throw Error('请先绑定账号，与真实好友一起修复灯塔');
  if(type==='coop/invite'){
   if(current(id,week))throw Error('本周已有灯塔伙伴或待处理邀请');const target=db.prepare('SELECT player FROM accounts WHERE code=?').get(String(p.code||'').toUpperCase())?.player;
   if(!target||target===id)throw Error('请选择真实好友');if(!db.prepare('SELECT accepted FROM friends WHERE accepted=1 AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?))').get(id,target,target,id))throw Error('需要先互相接受好友邀请');
   if(current(target,week))throw Error('好友本周已有灯塔伙伴或邀请');
   const group=crypto.randomUUID();db.prepare('INSERT INTO lighthouse_coop(id,week,a,b) VALUES(?,?,?,?)').run(group,week,id,target);return {message:'灯塔邀请已准备，等待好友在任务中接受'};
  }
  const g=current(id,week);if(!g||p.id!==g.id||p.week!==week)throw Error('灯塔邀请或本周航程已更新');
  if(type==='coop/decline'){if(g.accepted)throw Error('已经结伴，本周保持同一位伙伴');db.prepare('DELETE FROM lighthouse_coop WHERE id=?').run(g.id);return {message:'邀请已取消，本周可以选择其他船友'};}
  if(type==='coop/refresh')return {message:'已同步船友的灯塔进度'};
  if(type==='coop/accept'){
   if(g.b!==id||g.accepted)throw Error('邀请不可接受或已经接受');const a=read(g.a);db.prepare('UPDATE lighthouse_coop SET accepted=1,sa=?,sb=? WHERE id=?').run(points(a,week),s.voyage.points,g.id);return {message:'已和 '+accounts.find(g.a).name+' 一起修复灯塔，从现在起记录双方航程'};
  }
  if(type==='coop/claim'){
   contribute(id,s);const fresh=current(id,week),mine=g.a===id;
   if(!fresh.accepted||fresh.pa+fresh.pb<COOP_GOAL||(mine?fresh.pa:fresh.pb)<10||(mine?fresh.ca:fresh.cb))throw Error('灯塔需合计 120 点，自己至少贡献 10 点，奖励每周一次');
   db.prepare(`UPDATE lighthouse_coop SET ${mine?'ca':'cb'}=1 WHERE id=?`).run(g.id);s.bait+=10;s.supplies+=5;s.food+=6;s.coopBadges=(s.coopBadges||0)+1;return {message:'灯塔点亮！获得 10 次钓鱼、5 物资、6 鱼宠粮与合作纪念章'};
  }
  throw Error('无效的灯塔行动');
 }
 return {panel,action,contribute};
}
