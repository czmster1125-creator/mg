import {chromium,expect} from '@playwright/test';import {spawn,spawnSync} from 'node:child_process';import {mkdtempSync,mkdirSync,rmSync,copyFileSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
const folder=mkdtempSync(path.join(tmpdir(),'tidebloom-v20-capture-')),origin='http://127.0.0.1:5184',shots='docs/screenshots/growth-v20',out='docs/videos/v20';mkdirSync(shots,{recursive:true});mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5184',NODE_ENV:'production',DATA_DIR:folder},stdio:'ignore'});let browser;const errors=[],names=[];
const read=async p=>(await(await p.request.get(origin+'/api/bootstrap')).json()).state;
const shot=async(p,name)=>{await p.screenshot({path:shots+'/'+name+'.png',animations:'disabled'});names.push(name);};
async function click(p,selector){await p.locator(selector).first().click();await expect(p.locator('#cast')).toBeEnabled({timeout:25000});}
async function close(p){if(await p.locator('#modal-root').isVisible())await p.locator('.close-button').click();}
async function result(p){
 for(let guard=0;guard<14;guard++){
  const s=await read(p),e=s.event;if(!e){if(await p.locator('.catch-details').isVisible()){await p.waitForTimeout(450);if(!s.onboarding.complete&&[2,3].includes(s.onboarding.casts))await shot(p,s.onboarding.casts===2?'11-blue-first-catch':'12-sardine-first-catch');}await close(p);return s;}
  if(!(await p.locator('#modal-root').isVisible()))await p.locator('#event-resume').click();
  if(e.type==='sea-game'){if(e.kind==='salvage'){const cell=Array.from({length:6},(_,i)=>i).find(i=>!e.picks.includes(i));await click(p,`[data-act="sea-salvage"][data-cell="${cell}"]`);}else await click(p,'[data-act="sea-return"]');}
  else if(e.type==='treasure'){const cell=Array.from({length:12},(_,i)=>i).find(i=>!e.picks.some(x=>x.cell===i));await click(p,`[data-act="dig"][data-index="${cell}"]`);}
  else if(e.type==='attack')await click(p,'[data-act="attack"]');
  else if(e.type==='raid'){if(e.stage==='approach')await click(p,'[data-act="infiltrate"]');else if(e.turn===0)await click(p,'[data-act="steal"]');else await click(p,'[data-act="bank-raid"]');}
  else if(e.type==='encounter'){const choice=p.locator('[data-act="encounter-choice"]:not(:disabled)').last();await choice.click();await expect(p.locator('#cast')).toBeEnabled({timeout:25000});}
  else throw Error('Unknown saved event '+e.type);
 }
 throw Error('Saved event did not finish');
}
async function cast(p){await close(p);if(await p.locator('#stage').getAttribute('data-view')!=='fish')await p.locator('.nav-item[data-tab="fish"]').click();await p.locator('#cast').tap();await expect(p.locator('#modal-root')).toBeVisible({timeout:25000});await expect(p.locator('#cast')).toBeEnabled({timeout:25000});return result(p);}
async function orders(p){await close(p);await click(p,'#orders-entry');for(let i=0;i<3;i++){const b=p.locator('[data-act="order-claim"]:not(:disabled)').first();if(!await b.count())break;await b.click();await expect(p.locator('#cast')).toBeEnabled();}await close(p);}
async function build(p,n){await close(p);if(await p.locator('#stage').getAttribute('data-view')!=='map')await p.locator('.nav-item[data-tab="map"]').click();await p.locator('.hex-expand').first().click();await p.locator('[data-act="expand-confirm"]').click();if(n===3||n===8){if(n===3)await expect(p.locator('.hex-world')).toHaveAttribute('data-build-phase','boat',{timeout:5000});await expect(p.locator('.construction-feedback')).toBeVisible();await shot(p,n===3?'09-canoe-delivery':'05-workshop-construction');}await expect(p.locator('#cast')).toBeEnabled({timeout:15000});await expect(p.locator('.hex-world')).toHaveAttribute('data-owned',String(n));}
try{
 await expect.poll(async()=>{try{return(await fetch(origin+'/api/health')).ok;}catch{return false;}},{timeout:15000}).toBe(true);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block',recordVideo:{dir:folder,size:{width:390,height:844}}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('tidebloom-rare-challenge','off'));await p.goto(origin);await expect(p.locator('.opening-skip')).toBeVisible();await p.locator('.opening-skip').click();await expect(p.locator('.voyage-opening')).toHaveCount(0);
 await build(p,1);await click(p,'[data-act="voyage-fish"]');await p.locator('#cast').tap();await expect(p.locator('.voyage-trade')).toBeVisible({timeout:25000});await expect(p.locator('#cast')).toBeEnabled();await click(p,'[data-act="onboarding-trade"]');await click(p,'[data-act="expand-confirm"]');
 for(let n=2;n<5;n++){for(let guard=0;(await read(p)).coin<80&&guard<12;guard++)await cast(p);await build(p,n+1);}
 await expect(p.locator('#modal-title')).toHaveText('这片浅礁，现在是你的家');await close(p);const core=await read(p);await shot(p,'10-first-five-lands');await orders(p);
 for(let n=5;n<=10;n++){
  let s=await read(p);console.log(JSON.stringify({stage:n,coin:s.coin,bait:s.bait}));
  if(n===6){await p.locator('[data-act="harbor-go"]').first().click();await expect(p.locator('#tank-world canvas')).toBeVisible();await expect(p.locator('.pet-card.discovered')).toHaveCount(Object.keys((await read(p)).book).length);await shot(p,'03-three-companions');}
  if(n===7){await p.locator('[data-act="harbor-go"]').first().click();await expect(p.locator('#modal-title')).toContainText('装备');await shot(p,'04-equipment-introduction');await close(p);}
  if(n===8){await p.locator('[data-act="harbor-go"]').first().click();await expect(p.locator('#modal-title')).toContainText('匠人');await shot(p,'06-eight-land-workshop');await close(p);}
  if(n===10){await p.locator('[data-act="harbor-go"]').first().click();await expect(p.locator('#modal-title')).toContainText('潮汐观测台');await shot(p,'07-ten-land-facility');await close(p);}
  const lesson={5:'salvage',6:'treasure',8:'shield',9:'attack',10:'raid'}[n];
  for(let guard=0;lesson&&!(await read(p)).onboarding.lessons[lesson]&&guard<20;guard++)await cast(p);
  s=await read(p);if(lesson&&!s.onboarding.lessons[lesson])throw Error('Missing lesson '+lesson);
  if(n===10)break;
  for(let guard=0;(await read(p)).coin<140&&guard<30;guard++){if(await p.locator('#orders-entry').count())await orders(p);if((await read(p)).coin<140)await cast(p);}
  await build(p,n+1);
 }
 await p.locator('.nav-item[data-tab="map"]').click();await expect(p.locator('.task-entry')).toBeVisible();await shot(p,'08-free-voyage');const end=await read(p);expect(end.onboarding.harbor.complete).toBe(true);expect(end.equipped).toEqual([]);const video=p.video();await c.close();const raw=path.join(folder,'growth.webm');await video.saveAs(raw);let file=out+'/growth-voyage.mp4';const encode=spawnSync('ffmpeg',['-y','-i',raw,'-c:v','libx264','-preset','fast','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart','-an',file],{stdio:'ignore'});if(encode.status!==0){file=out+'/growth-voyage.webm';copyFileSync(raw,file);}copyFileSync(file,'/workspace/tidebloom-growth-v0.20.'+file.split('.').at(-1));console.log(JSON.stringify({screenshots:names,video:file,errors,core:{casts:core.onboarding.casts,book:Object.keys(core.book),coin:core.coin,bait:core.bait},end:{land:end.nodes[0].reduce((a,b)=>a+b,0),coin:end.coin,bait:end.bait,base:end.base,lessons:end.onboarding.lessons,harbor:end.onboarding.harbor},fixture:'Fresh genuine account, no seeded progress or resources. All catches, orders, construction and lessons use actual user controls and server transactions in an isolated database.'}));if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();rmSync(folder,{recursive:true,force:true});}
