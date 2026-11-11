import {randomUUID,randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
function passwordHash(p,salt){return scryptSync(p,salt,32).toString('hex');}
export function createAccounts(db){
 db.exec(`CREATE TABLE IF NOT EXISTS accounts(player TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL, recovery TEXT NOT NULL, code TEXT UNIQUE NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, player TEXT NOT NULL, expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS login_limits(key TEXT PRIMARY KEY, tries INTEGER NOT NULL, until INTEGER NOT NULL);`);
 db.exec('CREATE INDEX IF NOT EXISTS sessions_owner ON sessions(player)');
 const find=id=>db.prepare('SELECT player,name,code FROM accounts WHERE player=?').get(id);
 const cookie=(res,token)=>res.setHeader('Set-Cookie',`tidebloom=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${process.env.COOKIE_SECURE==='1'?'; Secure':''}`);
 const session=(res,player)=>{const token=randomUUID();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),player,Date.now()+30*86400000);cookie(res,token);};
 function resolve(req,res){const token=req.headers.cookie?.match(/(?:^|;\s*)tidebloom=([a-f0-9-]{36})(?:;|$)/)?.[1];if(token){const s=db.prepare('SELECT player FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());if(s)return s.player;if(!find(token)&&db.prepare('SELECT id FROM players WHERE id=?').get(token))return token;}const id=randomUUID();cookie(res,id);return id;}
 function auth(type,p,id,req,res){
  if(!['account/register','account/login','account/recover','account/logout','account/key'].includes(type))return null;
  if(type==='account/logout'){const token=req.headers.cookie?.match(/tidebloom=([a-f0-9-]{36})/)?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));const guest=randomUUID();cookie(res,guest);return {player:guest,result:{message:'已退出，原账号存档保留'}};}
  const name=String(p.name||'').trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(name))throw Error('账号使用 3–20 位英文字母、数字或下划线');
  const key=digest(`${req.socket.remoteAddress}:${name}`),now=Date.now();const limit=db.prepare('SELECT * FROM login_limits WHERE key=?').get(key);if(limit&&limit.tries>=6&&limit.until>now)throw Error('尝试过于频繁，请十分钟后再试');
  const bad=()=>{const tries=limit?.until>now?limit.tries+1:1;db.prepare('INSERT OR REPLACE INTO login_limits VALUES(?,?,?)').run(key,tries,now+600000);throw Error('账号或凭据不正确');};
  if(typeof p.password!=='string'||p.password.length<10||p.password.length>128)throw Error('密码长度为 10–128 位');
  const row=db.prepare('SELECT * FROM accounts WHERE name=?').get(name);
  if(type==='account/register'){
   if(find(id)||row)throw Error('当前角色已绑定账号，或该名称不可用');const salt=randomBytes(16).toString('hex'),recovery=randomBytes(24).toString('hex'),code=randomBytes(5).toString('hex').toUpperCase();
   db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?)').run(id,name,salt,passwordHash(p.password,salt),digest(recovery),code);session(res,id);return {player:id,result:{message:'账号已绑定，存档可跨设备恢复',recovery}};
  }
  if(!row)bad();
  if(type==='account/recover'){if(typeof p.recovery!=='string'||!timingSafeEqual(Buffer.from(digest(p.recovery)),Buffer.from(row.recovery)))bad();const salt=randomBytes(16).toString('hex'),recovery=randomBytes(24).toString('hex');db.prepare('UPDATE accounts SET salt=?,password=?,recovery=? WHERE player=?').run(salt,passwordHash(p.password,salt),digest(recovery),row.player);db.prepare('DELETE FROM sessions WHERE player=?').run(row.player);session(res,row.player);return {player:row.player,result:{message:'密码已重设，请保存新的恢复密钥',recovery}};}
  if(!timingSafeEqual(Buffer.from(passwordHash(p.password,row.salt)),Buffer.from(row.password)))bad();if(type==='account/key'){if(row.player!==id)throw Error('请先登录该账号');const recovery=randomBytes(24).toString('hex');db.prepare('UPDATE accounts SET recovery=? WHERE player=?').run(digest(recovery),id);return {player:id,result:{message:'恢复密钥已轮换，请保存新密钥',recovery}};}db.prepare('DELETE FROM login_limits WHERE key=?').run(key);session(res,row.player);return {player:row.player,result:{message:'已恢复账号存档'}};
 }
 return {resolve,auth,find};
}
