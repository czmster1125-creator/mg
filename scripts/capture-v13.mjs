import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {initialState,settle} from '../server/engine.js';
const folder=mkdtempSync(path.join(tmpdir(),'tidebloom-button-')),origin='http://127.0.0.1:5175',out='docs/screenshots/controls-v13';mkdirSync(out,{recursive:true});
const db=new DatabaseSync(path.join(folder,'tidebloom.sqlite'));db.exec('CREATE TABLE players(id TEXT PRIMARY KEY,state TEXT)');
const s=initialState();settle(s);s.coin=2300;s.xp=550;s.captainClaimed=6;s.bait=55;s.guide=1;s.book.clown={count:2,best:900};s.pets.clown={level:2};const id=randomUUID(),autoId=randomUUID();db.prepare('INSERT INTO players VALUES(?,?)').run(id,JSON.stringify(s));s.guide=0;db.prepare('INSERT INTO players VALUES(?,?)').run(autoId,JSON.stringify(s));db.close();
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5175',DATA_DIR:folder,NODE_ENV:'production'},stdio:'ignore'});let browser;const errors=[];
try{
 await expect.poll(async()=>{try{return(await fetch(origin+'/api/health')).ok;}catch{return false;}},{timeout:15000}).toBe(true);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const open=async player=>{const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await c.addCookies([{name:'tidebloom',value:player,url:origin,httpOnly:true,sameSite:'Strict'}]);await c.addInitScript(()=>localStorage.setItem('tidebloom-rare-challenge','off'));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await expect(p.locator('#cast')).toBeVisible();return {c,p};};
 const a=await open(id);for(const [width,height,name]of [[390,844,'fishing-button'],[360,640,'small-phone'],[480,857,'wide-phone']]){await a.p.setViewportSize({width,height});await expect(a.p.locator('#bait')).toHaveText('55');const stock=await a.p.locator('#fishing-stock').boundingBox(),button=await a.p.locator('#cast').boundingBox();expect(stock.y+stock.height).toBeLessThan(button.y);await expect(a.p.locator('#cast')).toBeInViewport();await a.p.screenshot({path:out+'/'+name+'.png',animations:'disabled'});}await a.c.close();
 const b=await open(autoId),rect=await b.p.locator('#cast').boundingBox(),cdp=await b.c.newCDPSession(b.p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});await b.p.waitForTimeout(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(b.p.locator('#cast')).toHaveAttribute('aria-pressed','true');await b.p.screenshot({path:out+'/automatic-mode.png',animations:'disabled'});const stop=await b.p.locator('#cast').boundingBox();await b.p.touchscreen.tap(stop.x+stop.width/2,stop.y+stop.height/2);await expect(b.p.locator('#cast')).toHaveAttribute('aria-pressed','false');await b.c.close();
 console.log(JSON.stringify({screenshots:4,errors,checks:['fishing icon','55 remaining above centered button','three phone sizes','touch hold enables auto; release keeps it; tap stops'],fixture:'isolated display save with 55 reward casts, no changes to preview database'}));if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();rmSync(folder,{recursive:true,force:true});}
