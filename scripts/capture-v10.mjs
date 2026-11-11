import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {initialState,settle,action} from '../server/engine.js';
import {frontier} from '../shared/hex.js';

// Isolated visual fixtures: never edits the preview's or a player's database.
const folder=mkdtempSync(path.join(tmpdir(),'tidebloom-home-'));
const origin='http://127.0.0.1:5175',out='docs/screenshots/home-v10';
mkdirSync(out,{recursive:true});
const db=new DatabaseSync(path.join(folder,'tidebloom.sqlite'));
db.exec('CREATE TABLE players(id TEXT PRIMARY KEY,state TEXT)');
const put=s=>{const id=randomUUID();db.prepare('INSERT INTO players VALUES(?,?)').run(id,JSON.stringify(s));return id;};
const home=initialState();settle(home);home.guide=8;home.coin=10000;home.supplies=80;home.food=40;
for(let n=0;n<5;n++)action(home,'expand',{region:0,tile:frontier(home,0)[0].id});
home.base=[2,2,2,2];home.pending=[0,80,12,4];const homeId=put(home);
const shells=initialState();settle(shells);shells.guide=4;
action(shells,'fishing',{spot:0,bet:2},Date.now(),()=>.8);
shells.event.board=['pearl','pearl','crate','coins','pearl','coins','crate','coins','crate'];
const shellId=put(shells);
const old=initialState();delete old.homeVersion;delete old.supplies;old.base=[1,2,3,2,2];old.pending=[0,50,12,5,3];old.parts=12;old.materials=5;old.guide=8;old.nodes[0]=[5,5,0,0,0];const oldId=put(old);db.close();
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5175',DATA_DIR:folder,NODE_ENV:'production'},stdio:'ignore'});
let browser;const errors=[];
try{
 await expect.poll(async()=>{try{return(await fetch(origin+'/api/health')).ok;}catch{return false;}},{timeout:15000}).toBe(true);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const open=async(id,width=390,height=844)=>{const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await c.addCookies([{name:'tidebloom',value:id,url:origin,httpOnly:true,sameSite:'Strict'}]);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await expect(p.locator('#cast')).toBeVisible();return p;};
 const shot=async(p,name)=>{await p.waitForTimeout(300);await p.screenshot({path:out+'/'+name+'.png',animations:'disabled'});};
 const p=await open(homeId);await p.locator('.nav-item[data-tab="map"]').click();await expect(p.locator('.island-building')).toHaveCount(4);await shot(p,'four-homes');
 for(const b of await p.locator('.island-building').all())await expect(b).toBeInViewport();
 await p.locator('.island-building[data-index="2"]').click();await expect(p.locator('.home-purpose')).toContainText('扩建');await shot(p,'artisan-purpose');
 const t=await open(shellId);await t.locator('#event-resume').click();await expect(t.locator('.shell-tile')).toHaveCount(9);await shot(t,'shells-start');
 const flip=async cell=>{const response=t.waitForResponse(r=>r.url().endsWith('/api/event/dig'));await t.locator(`.shell-tile[data-index="${cell}"]`).click();return(await response).json();};
 await flip(0);await expect(t.locator('.shell-tile.opened')).toHaveCount(1);await flip(1);await expect(t.locator('.shell-tile.opened')).toHaveCount(2);await shot(t,'shells-one-away');
 await t.locator('.close-button').click();await t.reload();await t.locator('#event-resume').click();await expect(t.locator('.shell-tile.opened')).toHaveCount(2);
 await t.setViewportSize({width:360,height:640});for(const b of await t.locator('.shell-tile').all())await expect(b).toBeInViewport();expect(await t.locator('.modal-body').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);await shot(t,'shells-small-phone');
 const result=await flip(4);await expect(t.locator('.shell-victory')).toBeVisible();await expect(t.locator('.shell-match-line>span')).toHaveCount(3);expect(result.result.symbol).toBe('pearl');await shot(t,'shells-win');
 const oldPage=await open(oldId);const state=(await(await oldPage.request.get(origin+'/api/bootstrap')).json()).state;expect(state.base).toEqual([1,2,3,2]);expect(state.supplies).toBe(17);expect(state.homeMigration.refund).toBe(80);await oldPage.locator('.nav-item[data-tab="map"]').click();await oldPage.locator('.island-building[data-index="2"]').click();await expect(oldPage.locator('.town-detail')).toContainText('80 金币已到账');await shot(oldPage,'legacy-migration');
 console.log(JSON.stringify({screenshots:7,errors,fixture:'isolated five-plot town, fixed shell layout, and legacy five-home save',checks:['four homes','small-phone shells in viewport','reload preserves picks','three pearls settle','old stock and duplicate upgrade refund']}));
 if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();rmSync(folder,{recursive:true,force:true});}
