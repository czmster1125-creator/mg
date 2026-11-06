import {test,expect} from '@playwright/test';
test('end-to-end fishing, selling, construction, base and persistent progress',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#cast')).toBeVisible();await expect(page.locator('canvas')).toBeVisible();
 await page.locator('#cast').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText('有鱼上钩啦！')).toBeVisible();await expect(page.locator('#bait')).toHaveText('39');
 await page.getByRole('button',{name:'前往鱼舱出售'}).click();await expect(page.locator('.fish-row')).toHaveCount(1);
 const locked=page.locator('[aria-label^="解锁"]');if(await locked.count())await locked.click();await page.locator('[data-act="sell-all"]').click();await expect(page.locator('.empty-state')).toBeVisible();
 await page.locator('.close-button').click();await page.locator('.nav-item[data-tab="map"]').click();await page.locator('.build-list [data-index="0"]').click();await page.locator('[data-act="build-confirm"]').click();await expect(page.locator('#modal-root')).toBeHidden();await expect(page.locator('.build-progress strong')).toContainText('1');
 await page.locator('.nav-item[data-tab="base"]').click();await page.locator('[data-act="collect"]').click();await expect(page.locator('#toast')).toContainText('收益');await page.locator('.close-button').click();
 await page.reload();await expect(page.locator('#bait')).toHaveText('39');await page.locator('.nav-item[data-tab="map"]').click();await expect(page.locator('.build-progress strong')).toContainText('1');await page.locator('.nav-item[data-tab="book"]').click();await expect(page.locator('.collection-card.discovered')).toHaveCount(1);expect(errors).toEqual([]);
});
test('phone layout, spot selection, multiplier and empty inventory guidance',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('#cast')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.spot-label').nth(1).click();await expect(page.locator('#sea-note')).toContainText('珊瑚秘境');await page.locator('[data-act="bet"]').click();await expect(page.locator('#bet')).toHaveText('×2');await page.locator('#cast').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('#bait')).toHaveText('38');await page.locator('.close-button').click();await page.locator('.nav-item[data-tab="cargo"]').click();await expect(page.locator('.fish-row')).toHaveCount(2);await page.screenshot({path:'docs/screenshots/mobile-cargo.png'});
});
test('API idempotency and failed transaction rollback',async({request})=>{
 await request.get('/api/bootstrap');const key=crypto.randomUUID();const first=await (await request.post('/api/fishing',{data:{requestId:key,bet:2,spot:0}})).json();const duplicate=await(await request.post('/api/fishing',{data:{requestId:key,bet:2,spot:0}})).json();expect(duplicate).toEqual(first);
 const bad=await request.post('/api/build',{data:{requestId:crypto.randomUUID(),region:1,node:0}});expect(bad.status()).toBe(400);const after=await(await request.get('/api/bootstrap')).json();expect(after.state.coin).toBe(first.state.coin);expect(after.state.cargo).toHaveLength(2);expect(after.state.nodes[1][0]).toBe(0);
});
test('manual fishing supports charge, hook, alternating reel and a single rare catch',async({page})=>{
 await page.goto('/');await page.locator('[data-act="manual"]').click();const button=page.locator('#manual-button');await button.focus();await page.keyboard.down('Space');await page.waitForTimeout(700);await page.keyboard.up('Space');await expect(button).toHaveText('有鱼上钩！点击提竿',{timeout:4000});await button.focus();await page.keyboard.press('Space');await expect(button).toHaveText('按住收线 · 松开降温');
 for(let i=0;i<5;i++){if(await page.locator('#manual-button').count()===0)break;await page.keyboard.down('Space');await page.waitForTimeout(1850);await page.keyboard.up('Space');if(await page.locator('#manual-button').count()===0)break;await page.waitForTimeout(1150);}
 await expect(page.locator('.catch-details')).toBeVisible({timeout:6000});await expect(page.locator('#bait')).toHaveText('39');await page.locator('[data-act="cargo"]').filter({hasText:'前往鱼舱出售'}).click();await expect(page.locator('.fish-row')).toHaveCount(1);await expect(page.locator('[aria-label^="解锁"]')).toHaveCount(1);
});
test('full inventory blocks spending, gear and modal navigation work',async({page})=>{
 await page.goto('/');await page.waitForSelector('#cast');await page.evaluate(async()=>{for(const bet of [5,5,2])await fetch('/api/fishing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),bet,spot:0})});});await page.reload();await expect(page.locator('#bait')).toHaveText('28');await page.locator('#cast').click();await expect(page.locator('.fish-row')).toHaveCount(12);await expect(page.locator('#bait')).toHaveText('28');await page.locator('.close-button').click();await page.locator('[data-act="gear"]').click();await page.locator('[data-act="gear-upgrade"]').first().click();await expect(page.locator('.gear-grid h3').first()).toContainText('Lv. 1');await page.keyboard.press('Escape');await expect(page.locator('#modal-root')).toBeHidden();
});
