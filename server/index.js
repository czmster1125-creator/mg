import http from 'node:http';
import {publicState} from './adventure.js';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config} from './config.js';
import {initialState,settle,action} from './engine.js';
import {createAccounts} from './accounts.js';
import {createSocial} from './social.js';
import {recordJourney} from '../shared/journey.js';
import {progressOrder} from '../shared/orders.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=process.env.DATA_DIR||path.join(root,'.data');mkdirSync(data,{recursive:true});
const db=new DatabaseSync(path.join(data,'tidebloom.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS transactions (player TEXT, request TEXT, type TEXT, result TEXT, PRIMARY KEY(player,request));');
const get=db.prepare('SELECT state FROM players WHERE id=?'),put=db.prepare('INSERT OR REPLACE INTO players VALUES (?,?)');
const accounts=createAccounts(db),social=createSocial(db,accounts);
const read=id=>{const row=get.get(id);return row?JSON.parse(row.state):initialState();};
const body=(id,s,result)=>({state:publicState(s),result,social:social.panel(id,s)});
const vite=process.env.NODE_ENV==='production'?null:await (await import('vite')).createServer({root,server:{middlewareMode:true,allowedHosts:true},appType:'spa'});
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
const server=http.createServer(async(req,res)=>{
 if(req.url.startsWith('/api/')){
  try{
   if(req.url==='/api/health')return send(res,200,{ok:true,version:config.version});
   const id=accounts.resolve(req,res);
   if(req.method==='GET'&&req.url==='/api/bootstrap'){
    db.exec('BEGIN IMMEDIATE');try{social.expire();const s=read(id);settle(s);put.run(id,JSON.stringify(s));const out={...body(id,s),config};db.exec('COMMIT');return send(res,200,out);}catch(e){db.exec('ROLLBACK');throw e;}
   }
   if(req.method!=='POST')return send(res,404,{error:'接口不存在'});
   if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)return send(res,403,{error:'请求来源不匹配'});}
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>32000)return send(res,413,{error:'请求过大'});}
   const p=JSON.parse(raw||'{}'),type=req.url.slice(5);if(typeof p.requestId!=='string'||p.requestId.length>100||p.requestId.length<8)return send(res,400,{error:'请求编号无效'});
   if(type.startsWith('account/')){const a=accounts.auth(type,p,id,req,res);if(!a)throw Error('账号操作不存在');const s=read(a.player);settle(s);put.run(a.player,JSON.stringify(s));return send(res,200,body(a.player,s,a.result));}
   db.exec('BEGIN IMMEDIATE');
   try{
    const prior=db.prepare('SELECT type,result FROM transactions WHERE player=? AND request=?').get(id,p.requestId);if(prior){if(prior.type!==type)throw Error('请求编号已用于其他操作');db.exec('COMMIT');return send(res,200,JSON.parse(prior.result));}
    social.expire();const s=read(id);settle(s);let result=social.action(id,s,type,p),context;
    if(!result){context=social.complete(id,s,type,p);if(context?.type==='attack'){result=context;recordJourney(s,result);progressOrder(s,'adventure');}else{result=action(s,type,p);if(type==='fishing'&&result.event)social.convert(id,s,p.bet);social.finishRaid(context,result,s);}}
    put.run(id,JSON.stringify(s));const out=body(id,s,result);db.prepare('INSERT INTO transactions VALUES (?,?,?,?)').run(id,p.requestId,type,JSON.stringify(out));db.exec('COMMIT');return send(res,200,out);
   }catch(e){db.exec('ROLLBACK');throw e;}
  }catch(e){return send(res,e.status||400,{error:e.message||'请求失败，请重试'});}
 }
 if(vite)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end();});
 try{const relative=decodeURIComponent(req.url.split('?')[0]);let f=path.resolve(root,'dist','.'+relative);if(!f.startsWith(path.join(root,'dist')+path.sep)||!existsSync(f)||relative==='/')f=path.join(root,'dist/index.html');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(readFileSync(f));}catch{res.writeHead(404);res.end('Build with npm run build first');}
});
server.listen(Number(process.env.PORT||5173),'0.0.0.0',()=>console.log('Tidebloom listening on port '+(process.env.PORT||5173)));
