import * as T from 'three';
import {createFishModel} from './fish-preview.js';
import {createEncounterScene} from './encounter-scene.js';
export function createAdventureScene(host,type,fish=[]){
 if(!host)return Object.assign(()=>{},{play:()=>Promise.resolve(),skip:()=>{}});
 if(type!=='aquarium')return createEncounterScene(host,type,fish);
 const scene=new T.Scene();scene.background=new T.Color(0x0f5775);const camera=new T.PerspectiveCamera(38,1,.1,80);camera.position.set(0,1,13);camera.lookAt(0,0,0);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','游动的鱼宠水族箱');scene.add(new T.HemisphereLight(0xe5ffff,0x528d74,3));const sun=new T.DirectionalLight(0xffe6bc,3);sun.position.set(-5,10,5);scene.add(sun);
 const materials=[],school=[];
 const mesh=(geometry,color,x,y,z)=>{const material=new T.MeshStandardMaterial({color,roughness:.8});materials.push(material);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);return m;};
 mesh(new T.BoxGeometry(14,.3,5),0xe5c18b,0,-2.3,0);
 for(let j=0;j<9;j++){const m=mesh(new T.ConeGeometry(.35,1.3+j%3*.25,7),j%2?0x47b39a:0x368c91,(j-4)*1.4,-1.6,-1.4);m.rotation.z=Math.sin(j)*.15;}
 fish.forEach((f,i)=>{const {model,materials:owned,tail}=createFishModel(f);materials.push(...owned);model.scale.setScalar(fish.length<4?.85:.58);scene.add(model);school.push({model,tail,i});});
 for(let i=0;i<16;i++)mesh(new T.SphereGeometry(.035,6,4),0x99dce2,Math.sin(i*3)*6,(i%5)-2,-1);
 let raf,disposed=false;const start=performance.now();function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(){if(disposed)return;const t=(performance.now()-start)/1000;school.forEach(({model,tail,i})=>{const a=t*.2+i*2.4;model.position.set(Math.sin(a)*4.7,Math.sin(a*1.4+i)*1.3,Math.cos(a)*1.2);model.rotation.y=Math.cos(a)>0?0:Math.PI;tail.rotation.y=Math.sin(t*4+i)*.3;});if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(frame);}frame();
 return ()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
