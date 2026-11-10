import * as T from 'three';
import {createFishModel} from './fish-preview.js';
import {createBaseBuilding,mergeStatic} from './town-models.js';
export function createAdventureScene(host,type,fish=[]){
 const scene=new T.Scene();scene.background=new T.Color(type==='aquarium'?0x0f5775:0x369fae);const camera=new T.PerspectiveCamera(38,1,.1,80);camera.position.set(type==='aquarium'?0:7,type==='aquarium'?1:9,type==='aquarium'?13:12);camera.lookAt(0,0,0);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',type==='aquarium'?'游动的鱼宠水族箱':'NPC 海岛建筑');scene.add(new T.HemisphereLight(0xe5ffff,0x528d74,3));const sun=new T.DirectionalLight(0xffe6bc,3);sun.position.set(-5,10,5);scene.add(sun);const ownedMaterials=[];const school=[];
 function mesh(g,c,x,y,z){const material=new T.MeshStandardMaterial({color:c,roughness:.8});ownedMaterials.push(material);const m=new T.Mesh(g,material);m.position.set(x,y,z);scene.add(m);return m;}
 if(type==='aquarium'){
 mesh(new T.BoxGeometry(14,.3,5),0xe5c18b,0,-2.3,0);for(let j=0;j<9;j++){const m=mesh(new T.ConeGeometry(.35,1.3+j%3*.25,7),j%2?0x47b39a:0x368c91,(j-4)*1.4,-1.6,-1.4);m.rotation.z=Math.sin(j)*.15;}
 fish.forEach((f,i)=>{const {model,materials,tail}=createFishModel(f);ownedMaterials.push(...materials);model.scale.setScalar(fish.length<4?.85:.58);scene.add(model);school.push({model,tail,i});});
 for(let i=0;i<16;i++)mesh(new T.SphereGeometry(.035,6,4),0x99dce2,Math.sin(i*3)*6,(i%5)-2,-1);
 }else{mesh(new T.CylinderGeometry(5,5.3,.5,32),0xe5d28d,0,-.6,0);mesh(new T.CylinderGeometry(4.8,4.8,.1,32),0x87bb64,0,-.3,0);for(let i=0;i<3;i++){const m=createBaseBuilding([1,2,4][i],1);mergeStatic(m);m.scale.setScalar(.8);m.position.set((i-1)*3,-.2,i===1?1:0);scene.add(m);}}
 let raf,disposed=false;const start=performance.now();function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();function frame(){if(disposed)return;const t=(performance.now()-start)/1000;school.forEach(({model,tail,i})=>{const a=t*.2+i*2.4;model.position.set(Math.sin(a)*4.7,Math.sin(a*1.4+i)*1.3,Math.cos(a)*1.2);model.rotation.y=Math.cos(a)>0?0:Math.PI;tail.rotation.y=Math.sin(t*4+i)*.3;});renderer.render(scene,camera);raf=requestAnimationFrame(frame);}frame();return ()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>o.geometry?.dispose());ownedMaterials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
