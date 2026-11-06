import test from 'node:test';
import assert from 'node:assert/strict';
import {stepBoat,angleDelta,waterBounds} from '../src/motion.js';
const boat=()=>({x:0,z:7,heading:0,speed:0,bank:0});
function travel(hz){const b=boat();let arrived=false;for(let i=0;i<hz*8;i++)arrived=stepBoat(b,{x:-3,z:-3},1/hz);return {b,arrived};}
test('boat accelerates progressively and never teleports on target change',()=>{const b=boat();stepBoat(b,{x:3,z:0},1/60);assert.ok(Math.hypot(b.x,b.z-7)<.02);assert.ok(b.speed>0&&b.speed<1);assert.ok(Math.abs(b.heading)<.07);});
test('steering arrival is stable at 30, 60 and 120 fps',()=>{const results=[30,60,120].map(travel);for(const {b,arrived} of results){assert.ok(arrived);assert.ok(Math.hypot(b.x+3,b.z+3)<.04);assert.ok(b.speed<.01);}assert.ok(Math.abs(results[0].b.x-results[2].b.x)<.03);});
test('rapidly selecting a new target arrives at the last choice',()=>{const b=boat();for(let i=0;i<30;i++)stepBoat(b,{x:-4,z:-3},1/60);for(let i=0;i<480;i++)stepBoat(b,{x:3,z:8},1/60);assert.ok(Math.hypot(b.x-3,b.z-8)<.04);});
test('heading wraps by the shortest turn, and water bounds avoid coastal geometry',()=>{assert.ok(Math.abs(angleDelta(Math.PI-.05,-Math.PI+.05)-.1)<1e-10);assert.deepEqual(waterBounds(100,-100),{x:4.8,z:-4.2});assert.deepEqual(waterBounds(-100,100),{x:-4.8,z:10.8});});
