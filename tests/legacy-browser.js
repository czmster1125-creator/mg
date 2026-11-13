import {test as base,expect} from '@playwright/test';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {legacyState} from './legacy-state.js';
const origin='http://127.0.0.1:5182';
// Seed only a new, test-owned character in the isolated regression server.
// No production route, query switch, or existing player is changed.
function seed(){const db=new DatabaseSync(resolve('.test-data/legacy-browser/tidebloom.sqlite'));const id=randomUUID();db.prepare('INSERT INTO players VALUES(?,?)').run(id,JSON.stringify(legacyState()));db.close();return {name:'tidebloom',value:id,url:origin,httpOnly:true,sameSite:'Strict'};}
export const test=base.extend({
 browser:[async({browser},use)=>{const original=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await original(options);await context.addCookies([seed()]);return context;};try{await use(browser);}finally{browser.newContext=original;}},{scope:'worker'}],
 request:async({playwright},use)=>{const cookie=seed();const request=await playwright.request.newContext({baseURL:origin,storageState:{cookies:[{...cookie,domain:'127.0.0.1',path:'/',expires:-1,secure:false,url:undefined}],origins:[]}});try{await use(request);}finally{await request.dispose();}}
});
export {expect};
