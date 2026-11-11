import {test,expect} from '@playwright/test';
test('portrait framing stays narrow on desktop and fits small phones',async({page})=>{
 await page.goto('/');await expect(page.locator('#cast')).toBeVisible();const frame=await page.locator('#app').boundingBox();expect(frame.width).toBeLessThanOrEqual(480);expect(frame.height).toBeGreaterThan(frame.width*1.6);
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:428,height:926}]){await page.setViewportSize(viewport);await expect(page.locator('#cast')).toBeInViewport();await expect(page.locator('.bottom-nav')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const ring of await page.locator('.shoal-hit').all()){const r=await ring.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(viewport.width);}}
});
test('water movement and rapid spot changes do not spend bait; final target wins',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.waitForSelector('.shoal-hit');await page.locator('canvas').first().click({position:{x:190,y:570}});await expect(page.locator('#stage')).toHaveClass(/boat-moving/);await expect(page.locator('#bait')).toHaveText('40');
 await page.locator('.shoal-hit').nth(2).click();await page.locator('.shoal-hit').nth(1).click();await expect(page.locator('.shoal-hit').nth(1)).toHaveAttribute('aria-pressed','true');await expect(page.locator('#stage')).not.toHaveClass(/boat-moving/,{timeout:12000});await expect(page.locator('#bait')).toHaveText('40');
});
test('manual fishing leaves water visible and cancelling preserves single bait deduction',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('[data-act="manual"]').click();await expect(page.locator('#modal-root')).toHaveAttribute('data-mode','manual');const box=await page.locator('.modal').boundingBox();expect(box.y).toBeGreaterThan(844*.5);expect(await page.locator('#modal-root').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await page.locator('#manual-button').focus();await page.keyboard.down('Space');await page.waitForTimeout(400);await page.keyboard.up('Space');await expect(page.locator('#bait')).toHaveText('39');await page.locator('.close-button').click();await expect(page.locator('#modal-root')).toBeHidden();await page.reload();await expect(page.locator('#bait')).toHaveText('39');
});


test('guided adventure: unified island, aquarium, saved attack and treasure, pets and shields',async({page})=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.nav-item')).toHaveText(['海岛','钓鱼','鱼缸']);await page.locator('#cast').click();await expect(page.locator('.catch-details')).toBeVisible();await page.locator('.close-button').click();await page.locator('.nav-item[data-tab="book"]').click();await expect(page.locator('#tank-world canvas')).toBeVisible();await expect(page.locator('.pet-card.discovered')).toHaveCount(1);await page.locator('.pet-card.discovered').click();await page.locator('[data-act="equip"]').click();await expect(page.locator('[data-act="equip"]')).toHaveText('撤下随行');await page.locator('.close-button').click();
 await page.locator('.nav-item[data-tab="map"]').click();await expect(page.locator('.island-building')).toHaveCount(5);await page.locator('.hex-expand').first().click();await page.locator('[data-act="expand-confirm"]').click();await expect(page.locator('.hex-world')).toHaveAttribute('data-rendered','1');await expect(page.locator('.island-building[data-index="2"]')).toContainText('Lv.1');
 await page.locator('.nav-item[data-tab="fish"]').click();await page.locator('#cast').click();await expect(page.locator('#attack-world canvas')).toBeVisible({timeout:15000});await page.locator('.close-button').click();await page.reload();await page.locator('#event-resume').click();await page.locator('[data-act="attack"]').first().click();await expect(page.locator('#modal-title')).toHaveText('护盾击破！');await page.locator('.close-button').click();
 await page.locator('#cast').click();await expect(page.locator('.dig-grid')).toBeVisible();await page.locator('[data-act="dig"]').nth(0).click();await page.locator('[data-act="dig"]').nth(1).click();await page.locator('.close-button').click();await page.reload();await page.locator('#event-resume').click();await expect(page.locator('.dig-grid .revealed')).toHaveCount(2);await page.locator('[data-act="dig"]').nth(2).click();await expect(page.locator('#modal-title')).toHaveText('宝藏满载而归');await page.locator('.close-button').click();
 await page.locator('.nav-item[data-tab="book"]').click();await page.locator('.pet-card.discovered').click();await page.locator('[data-act="feed"]').click();await expect(page.locator('.modal-header')).toContainText('Lv. 2');await page.locator('.close-button').click();await page.locator('.nav-item[data-tab="fish"]').click();await page.locator('#cast').click();await expect(page.locator('#modal-title')).toContainText('守护贝壳');await page.locator('.close-button').click();await page.locator('.nav-item[data-tab="map"]').click();await expect(page.locator('#map-banner')).toContainText('护盾 1/3');
 await page.locator('[data-act="reports"]').click();await page.locator('[data-act="drill"]').click();await expect(page.locator('.report-list')).toContainText('护盾挡住');await page.locator('.close-button').click();expect(errors).toEqual([]);
});
test('bank on island upgrades and damage can be repaired without losing land',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('.nav-item[data-tab="map"]').click();await page.locator('.island-building[data-index="1"]').click();await expect(page.locator('.town-stats')).toContainText('32.0');await expect(page.locator('.bank-return')).toContainText('4.0 小时');await page.locator('[data-act="base-upgrade"]').click();await page.locator('[data-act="reports"]').click();await page.locator('[data-act="drill"]').click();await page.locator('.close-button').click();await expect(page.locator('.island-building[data-index="1"]')).toContainText('需维修');await page.locator('.island-building[data-index="1"]').click();await page.locator('[data-act="repair"]').click();await expect(page.locator('.island-building[data-index="1"]')).toContainText('Lv.2');await expect(page.locator('.hex-world')).toHaveAttribute('data-rendered','0');
});
test('catch and collection rewards are idempotent, locked treasure payload remains hidden',async({request})=>{
 await request.get('/api/bootstrap');const id=crypto.randomUUID(),data={requestId:id,bet:1,spot:0};const first=await(await request.post('/api/fishing',{data})).json();const repeat=await(await request.post('/api/fishing',{data})).json();expect(repeat).toEqual(first);const pet=first.result.fish[0].species;await request.post('/api/pet/equip',{data:{id:pet,requestId:crypto.randomUUID()}});await request.post('/api/expand',{data:{tile:'-2,0',region:0,requestId:crypto.randomUUID()}});const attack=await(await request.post('/api/fishing',{data:{bet:1,spot:0,requestId:crypto.randomUUID()}})).json();await request.post('/api/event/attack',{data:{id:attack.state.event.id,target:0,requestId:crypto.randomUUID()}});const treasure=await(await request.post('/api/fishing',{data:{bet:1,spot:0,requestId:crypto.randomUUID()}})).json();expect(treasure.state.event.type).toBe('treasure');expect(treasure.state.event.loot).toBeUndefined();const claim={key:1,requestId:crypto.randomUUID()};const a=await(await request.post('/api/collection/claim',{data:claim})).json();const b=await(await request.post('/api/collection/claim',{data:claim})).json();expect(b).toEqual(a);expect((await request.post('/api/collection/claim',{data:{key:1,requestId:crypto.randomUUID()}})).status()).toBe(400);
});


test('manual fight can be won by reacting to fish surges and tension',async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('[data-act="manual"]').click();
 const button=page.locator('#manual-button');await button.focus();await page.keyboard.down('Space');await page.waitForTimeout(1100);await page.keyboard.up('Space');
 await expect(button).toHaveAttribute('data-phase','hook',{timeout:10000});await expect(button).toBeFocused();await page.keyboard.press('Space');await expect(button).toHaveAttribute('data-phase','reel');
 let held=false;const deadline=Date.now()+35000;
 while(Date.now()<deadline&&await button.count()){
  const status=await button.evaluate(b=>({phase:b.dataset.phase,behavior:b.dataset.behavior,tension:Number(b.dataset.tension)}));
  if(status.phase!=='reel')break;
  let next=held;if(status.behavior==='surge'||status.tension>72)next=false;else if(status.tension<40||status.behavior==='recovery')next=true;
  if(next!==held){if(next)await page.keyboard.down('Space');else await page.keyboard.up('Space');held=next;}
  await page.waitForTimeout(100);
 }
 await page.keyboard.up('Space');await expect(page.locator('.catch-details')).toContainText('皇家神仙鱼',{timeout:15000});await expect(page.locator('#bait')).toHaveText('42');expect(errors).toEqual([]);
});

test('missed hook explains failure and refreshing a new fight clears only that session',async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:360,height:640});await page.goto('/');await page.locator('[data-act="manual"]').click();
 const button=page.locator('#manual-button');await expect(page.locator('#fight-status')).toBeInViewport();await button.focus();await page.keyboard.down('Space');await page.waitForTimeout(300);await page.keyboard.up('Space');
 await expect(page.locator('#modal-title')).toHaveText('提竿晚了一步',{timeout:15000});await expect(page.locator('.manual-failure')).toContainText('5 金币补偿');await expect(page.locator('#bait')).toHaveText('39');
 await page.locator('.modal-footer [data-act="manual"]').click();await button.focus();await page.keyboard.down('Space');await page.waitForTimeout(300);await page.keyboard.up('Space');await expect(page.locator('#bait')).toHaveText('38');
 await page.reload();await expect(page.locator('#bait')).toHaveText('38');const snapshot=await(await page.request.get('/api/bootstrap')).json();expect(snapshot.state.manual).toBeNull();await page.locator('.nav-item[data-tab="map"]').click();await page.locator('.hex-expand').first().click();await page.locator('[data-act="expand-confirm"]').click();await expect(page.locator('.hex-world')).toHaveAttribute('data-rendered','1');
});

test('post-tutorial objective leads to island expansion and previews actual unlock',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('#cast')).toBeVisible();await page.request.post('/api/guide/skip',{data:{requestId:crypto.randomUUID()}});await page.reload();
 await expect(page.locator('#mobile-mission')).toContainText('扩张至 1 块');await page.locator('[data-act="guide"]').click();await expect(page.locator('.guide-detail')).toContainText('解锁钓具工坊');await page.locator('[data-act="guide-go"]').click();await expect(page.locator('#stage')).toHaveAttribute('data-view','map');await page.locator('.hex-expand').first().click();await expect(page.locator('.expansion-preview')).toContainText('钓具工坊自动建成');await page.locator('[data-act="expand-confirm"]').click();await expect(page.locator('.island-building[data-index="2"]')).toContainText('Lv.1');await expect(page.locator('#mobile-mission')).toContainText('扩张至 5 块');
});
