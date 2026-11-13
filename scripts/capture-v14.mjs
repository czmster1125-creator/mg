import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {settle} from '../server/engine.js';
import {legacyState as initialState} from '../tests/legacy-state.js';
const folder=mkdtempSync(path.join(tmpdir(),'tidebloom-navigation-')),origin='http://127.0.0.1:5175',out='docs/screenshots/navigation-v14';mkdirSync(out,{recursive:true});
const db=new DatabaseSync(path.join(folder,'tidebloom.sqlite'));db.exec('CREATE TABLE players(id TEXT PRIMARY KEY,state TEXT)');
const s=initialState();settle(s);s.coin=2300;s.xp=550;s.captainClaimed=6;s.bait=55;s.guide=1;s.food=20;s.catchCount=2;s.orders.counts.catch=2;s.orders.counts.growth=1;s.book.clown={count:2,best:900};s.pets.clown={level:2};const id=randomUUID(),readyId=randomUUID(),completeId=randomUUID();
db.prepare('INSERT INTO players VALUES(?,?)').run(id,JSON.stringify(s));s.orders.counts.growth=2;db.prepare('INSERT INTO players VALUES(?,?)').run(readyId,JSON.stringify(s));s.orders.counts={catch:8,adventure:3,growth:2};s.orders.claimed=['catch','adventure','growth'];db.prepare('INSERT INTO players VALUES(?,?)').run(completeId,JSON.stringify(s));db.close();
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5175',DATA_DIR:folder,NODE_ENV:'production'},stdio:'ignore'});let browser;const errors=[];
try{
 await expect.poll(async()=>{try{return(await fetch(origin+'/api/health')).ok;}catch{return false;}},{timeout:15000}).toBe(true);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const open=async player=>{const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await c.addCookies([{name:'tidebloom',value:player,url:origin,httpOnly:true,sameSite:'Strict'}]);await c.addInitScript(()=>localStorage.setItem('tidebloom-rare-challenge','off'));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await expect(p.locator('#cast')).toBeVisible();return {c,p};};
 const a=await open(id);
 for(const [width,height,prefix]of [[390,844,'portrait'],[360,640,'small'],[480,857,'wide']]){
  await a.p.setViewportSize({width,height});
  for(const [tab,name]of [['fish','fishing'],['map','island'],['book','aquarium']]){
   await a.p.locator(`.nav-item[data-tab="${tab}"]`).click();await expect(a.p.locator('#orders-entry')).toBeInViewport();await expect(a.p.locator('#mobile-mission')).not.toContainText('设置随行');await a.p.screenshot({path:out+'/'+prefix+'-'+name+'.png',animations:'disabled'});
  }
 }
 await a.p.setViewportSize({width:390,height:844});await a.p.locator('[data-act="tasks"]').click();await a.p.screenshot({path:out+'/task-ledger.png',animations:'disabled'});await a.p.locator('.close-button').click();await a.p.locator('[data-act="more"]').click();await a.p.screenshot({path:out+'/settings.png',animations:'disabled'});await a.p.locator('.close-button').click();await a.p.locator('.nav-item[data-tab="fish"]').click();await a.p.locator('[data-act="gear"]').click();await a.p.locator('[data-act="fishing-options"]').click();await a.p.screenshot({path:out+'/fishing-preferences.png',animations:'disabled'});
 await a.c.close();for(const [player,name]of [[readyId,'order-ready'],[completeId,'orders-complete']]){const item=await open(player);await expect(item.p.locator('#orders-entry')).toContainText(name==='order-ready'?'1 单可领奖':'今日订单已全部完成');await item.p.screenshot({path:out+'/'+name+'.png',animations:'disabled'});await item.c.close();}
 console.log(JSON.stringify({screenshots:14,errors,fixture:'isolated guide-1 saves, including ready and completed orders; no changes to preview database'}));if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();rmSync(folder,{recursive:true,force:true});}
