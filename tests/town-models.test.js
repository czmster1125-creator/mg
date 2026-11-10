import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createLandmark,createBaseBuilding,mergeStatic,disposeModel} from '../src/town-models.js';
function signature(model){model.updateMatrixWorld(true);const hash=createHash('sha256');model.traverse(o=>{if(o.isMesh){hash.update(new Uint8Array(o.geometry.attributes.position.array.buffer));hash.update(JSON.stringify(o.matrixWorld.elements));hash.update(String(o.material.color.getHex()));}});return hash.digest('hex');}
function bounds(model){return new T.Box3().setFromObject(model,true);}
test('unbuilt landmarks are low empty plots, first construction produces a full building',()=>{
 for(let region=0;region<2;region++)for(let i=0;i<5;i++){const empty=createLandmark(i,0,region),built=createLandmark(i,1,region);assert.ok(bounds(empty).max.y<.8);assert.ok(bounds(built).max.y>=1,`region ${region} plot ${i}`);assert.notEqual(signature(empty),signature(built));disposeModel(empty);disposeModel(built);}
});
test('every landmark stage changes actual geometry and remains finite',()=>{
 for(let r=0;r<2;r++)for(let i=0;i<5;i++){const stages=new Set();for(let lv=0;lv<=5;lv++){const m=createLandmark(i,lv,r);stages.add(signature(m));const b=bounds(m);for(const n of [...b.min.toArray(),...b.max.toArray()])assert.ok(Number.isFinite(n));disposeModel(m);}assert.equal(stages.size,6,`region ${r}, landmark ${i} stages must differ`);}
});
test('five production buildings have distinct forms and five visible upgrade stages each',()=>{
 const identities=new Set();for(let i=0;i<5;i++){const stages=new Set();for(let lv=1;lv<=5;lv++){const m=createBaseBuilding(i,lv);stages.add(signature(m));if(lv===1)identities.add(signature(m));assert.ok(bounds(m).max.y>2);disposeModel(m);}assert.equal(stages.size,5);}assert.equal(identities.size,5);
});
test('static batching preserves model bounds, moving machinery and raycast selection',()=>{
 const m=createBaseBuilding(2,4);const before=bounds(m);let wheels=0;m.traverse(o=>{if(o.userData.animate==='wheel')wheels++;});mergeStatic(m);const after=bounds(m);assert.ok(before.min.distanceTo(after.min)<1e-5);assert.ok(before.max.distanceTo(after.max)<1e-5);let afterWheels=0;m.traverse(o=>{if(o.userData.animate==='wheel')afterWheels++;});assert.equal(afterWheels,wheels);assert.equal(wheels,1);m.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(0,1,10),new T.Vector3(0,0,-1));assert.ok(ray.intersectObject(m,true).length>0);disposeModel(m);
});
