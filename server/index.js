import http from 'node:http';
import {publicState} from './adventure.js';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config} from './config.js';
import {initialState,settle,action} from './engine.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=process.env.DATA_DIR||path.join(root,'.data');mkdirSync(data,{recursive:true});
const db=new DatabaseSync(path.join(data,'tidebloom.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS transactions (player TEXT, request TEXT, type TEXT, result TEXT, PRIMARY KEY(player,request));');
const get=db.prepare('SELECT state FROM players WHERE id=?');const put=db.prepare('INSERT OR REPLACE INTO players VALUES (?,?)');
const vite=process.env.NODE_ENV==='production'?null:await (await import('vite')).createServer({root,server:{middlewareMode:true,allowedHosts:true},appType:'spa'});
const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const server=http.createServer(async(req,res)=>{
 if(req.url.startsWith('/api/')){
  try{
   if(req.url==='/api/health')return send(res,200,{ok:true,version:config.version});
   let id=req.headers.cookie?.match(/(?:^|;\s*)tidebloom=([a-f0-9-]{36})(?:;|$)/)?.[1];
   if(!id){id=randomUUID();res.setHeader('Set-Cookie',`tidebloom=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`);}
   let s=get.get(id);s=s?JSON.parse(s.state):initialState();
   if(req.method==='GET'&&req.url==='/api/bootstrap'){settle(s);put.run(id,JSON.stringify(s));return send(res,200,{state:publicState(s),config});}
   if(req.method!=='POST')return send(res,404,{error:'接口不存在'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)return send(res,413,{error:'请求过大'});}
   const p=JSON.parse(raw||'{}');if(typeof p.requestId!=='string'||p.requestId.length>100||p.requestId.length<8)return send(res,400,{error:'请求编号无效'});
   const type=req.url.slice(5);db.exec('BEGIN IMMEDIATE');
   try{const prior=db.prepare('SELECT type,result FROM transactions WHERE player=? AND request=?').get(id,p.requestId);if(prior){if(prior.type!==type)throw Error('请求编号已用于其他操作');db.exec('COMMIT');return send(res,200,JSON.parse(prior.result));}
    const latest=get.get(id);if(latest)s=JSON.parse(latest.state);
    const result=action(s,type,p);const body={state:publicState(s),result};put.run(id,JSON.stringify(s));db.prepare('INSERT INTO transactions VALUES (?,?,?,?)').run(id,p.requestId,type,JSON.stringify(body));db.exec('COMMIT');return send(res,200,body);
   }catch(e){db.exec('ROLLBACK');throw e;}
  }catch(e){return send(res,e.status||400,{error:e.message||'请求失败，请重试'});}
 }
 if(vite)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end();});
 const relative=decodeURIComponent(req.url.split('?')[0]);let f=path.resolve(root,'dist','.'+relative);if(!f.startsWith(path.join(root,'dist')+path.sep)||!existsSync(f)||relative==='/')f=path.join(root,'dist/index.html');
 try{const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(readFileSync(f));}catch{res.writeHead(404);res.end('Build with npm run build first');}
});
server.listen(Number(process.env.PORT||5173),'0.0.0.0',()=>console.log('Tidebloom listening on port '+(process.env.PORT||5173)));
