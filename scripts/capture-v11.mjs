import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {settle,action} from '../server/engine.js';
import {legacyState as initialState} from '../tests/legacy-state.js';
import {config as C} from '../server/config.js';
import {frontier} from '../shared/hex.js';

const folder=mkdtempSync(path.join(tmpdir(),'tidebloom-spin-')),origin='http://127.0.0.1:5175',out='docs/screenshots/focus-v11';
mkdirSync(out,{recursive:true});
const db=new DatabaseSync(path.join(folder,'tidebloom.sqlite'));db.exec('CREATE TABLE players(id TEXT PRIMARY KEY,state TEXT)');
const put=s=>{const id=randomUUID();db.prepare('INSERT INTO players VALUES(?,?)').run(id,JSON.stringify(s));return id;};
const home=initialState();settle(home);home.guide=8;home.coin=10000;home.supplies=80;home.food=40;
for(let n=0;n<5;n++)action(home,'expand',{region:0,tile:frontier(home,0)[0].id});home.base=[2,2,2,2];home.pending=[0,80,12,4];
for(const f of C.fish.slice(0,8)){home.book[f.id]={count:3,best:f.max};home.pets[f.id]={level:4};}home.equipped=['clown','blue'];home.collectionClaims=[1,3,6];const homeId=put(home);
const rare=initialState();settle(rare);rare.discoveryDry[0]=19;for(const f of C.fish.filter(f=>f.zone===0&&f.id!=='sunfish'))rare.book[f.id]={count:2,best:f.min};const rareId=put(rare);
const event=initialState();settle(event);event.guide=3;const eventId=put(event);
const plain=initialState();settle(plain);const plainId=put(plain),autoId=put(plain),cancelId=put(plain);db.close();
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5175',DATA_DIR:folder,NODE_ENV:'production'},stdio:'ignore'});
let browser;const errors=[],checks=[];
try{
 await expect.poll(async()=>{try{return(await fetch(origin+'/api/health')).ok;}catch{return false;}},{timeout:15000}).toBe(true);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const open=async(id,width=390,height=844,challenge=true)=>{const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await c.addCookies([{name:'tidebloom',value:id,url:origin,httpOnly:true,sameSite:'Strict'}]);if(!challenge)await c.addInitScript(()=>localStorage.setItem('tidebloom-rare-challenge','off'));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);await expect(p.locator('#cast')).toBeVisible();return p;};
 const shot=async(p,name)=>{await p.waitForTimeout(250);await p.screenshot({path:out+'/'+name+'.png',animations:'disabled'});};
 const state=async p=>(await(await p.request.get(origin+'/api/bootstrap')).json()).state;
 const h=await open(homeId);await shot(h,'fishing-spin');await h.locator('.nav-item[data-tab="map"]').click();await expect(h.locator('.island-building')).toHaveCount(4);await expect(h.locator('.island-expand')).toBeInViewport();await shot(h,'island-focus');await h.locator('.nav-item[data-tab="book"]').click();await expect(h.locator('.equipped-slot.filled')).toHaveCount(2);await shot(h,'aquarium-focus');checks.push('three focused pages and two equipped slots with a locked third');
 await h.setViewportSize({width:360,height:640});await h.locator('.nav-item[data-tab="fish"]').click();await expect(h.locator('#cast')).toBeInViewport();const bounds=await h.locator('#cast').boundingBox();expect(bounds.height).toBeGreaterThan(90);expect(Math.abs(bounds.width-bounds.height)).toBeLessThan(2);await shot(h,'spin-small-phone');checks.push('round spin on 360x640');await h.close();
 const r=await open(rareId);const requests=[];r.on('request',q=>{if(q.url().endsWith('/api/fishing'))requests.push(q.postDataJSON());});await r.locator('#cast').click();await expect(r.locator('[data-act="manual-auto"]')).toBeVisible({timeout:20000});await expect(r.locator('#modal-title')).toContainText('好鱼');await expect(r.locator('#bait')).toHaveText('39');expect(requests).toHaveLength(1);expect(requests[0].spot).toBe(1);await shot(r,'rare-encounter');await r.locator('[data-act="manual-auto"]').click();await expect(r.locator('.catch-details')).toContainText('黄金翻车鱼');const landed=await state(r);expect(landed.catchCount).toBe(1);expect(landed.bait).toBe(42);await shot(r,'guaranteed-catch');checks.push('spin selects rare spot, automatic challenge, one debit, guaranteed original fish');await r.close();
 const direct=await open(plainId,390,844,false);const before=await state(direct);const call=direct.waitForResponse(q=>q.url().endsWith('/api/fishing'));await direct.locator('.shoal-hit').first().click();const landedDirect=await(await call).json();await expect(direct.locator('.catch-details')).toBeVisible({timeout:10000});expect(landedDirect.state.catchCount).toBe(before.catchCount+1);expect(landedDirect.state.bait).toBe(42);checks.push('tap fish group sails and casts without pressing spin');await direct.close();
 const cancelled=await open(cancelId,390,844,false);let cancelledCasts=0;cancelled.on('request',q=>{if(q.url().endsWith('/api/fishing'))cancelledCasts++;});await cancelled.locator('#cast').click();await cancelled.locator('.nav-item[data-tab="map"]').click();await expect(cancelled.locator('#stage')).toHaveAttribute('data-view','map',{timeout:10000});expect(cancelledCasts).toBe(0);expect((await state(cancelled)).bait).toBe(40);checks.push('leaving during travel cancels before bait debit');await cancelled.close();
 const e=await open(eventId);let eventCasts=0;e.on('request',q=>{if(q.url().endsWith('/api/fishing'))eventCasts++;});await e.locator('[data-act="auto-fish"]').click();await expect(e.locator('#attack-world')).toBeVisible({timeout:20000});await expect(e.locator('[data-act="auto-fish"]')).toHaveAttribute('aria-pressed','false');await e.waitForTimeout(1300);expect(eventCasts).toBe(1);expect((await state(e)).bait).toBe(39);checks.push('auto pauses on attack, never casts behind event');await e.close();
 const a=await open(autoId,390,844,false);let autoCasts=0;a.on('request',q=>{if(q.url().endsWith('/api/fishing'))autoCasts++;});await a.locator('[data-act="auto-fish"]').click();await expect.poll(()=>autoCasts,{timeout:30000}).toBeGreaterThanOrEqual(2);await a.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await expect(a.locator('[data-act="auto-fish"]')).toHaveAttribute('aria-pressed','false');const stopped=autoCasts;await a.waitForTimeout(1500);expect(autoCasts).toBe(stopped);checks.push('auto starts next cast without reward popup; hidden tab stops loop');
 console.log(JSON.stringify({screenshots:6,errors,checks,fixture:'isolated mature island, rare-fish pity, guided event and first-cast saves; real server actions'}));if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();rmSync(folder,{recursive:true,force:true});}
