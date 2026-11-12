import {createSeaStoryScene} from './sea-story-scene.js';
import {AQUARIUM_THEMES} from '../shared/research.js';
import * as T from 'three';
import {createFishModel} from './fish-preview.js';
import {createEncounterScene} from './encounter-scene.js';
export function createAdventureScene(host,type,fish=[],options={}){
 if(!host)return Object.assign(()=>{},{play:()=>Promise.resolve(),skip:()=>{}});
 if(type==='story'||type==='story-result')return createSeaStoryScene(host,type,fish);
 if(type!=='aquarium')return createEncounterScene(host,type,fish);
 const aqua=options.aquarium||{},theme=AQUARIUM_THEMES.find(t=>t.id===aqua.theme)||AQUARIUM_THEMES[0],habitats=aqua.habitats||{},nurtured=Object.values(habitats).some(h=>h.week===options.week);host.dataset.theme=theme.id;host.dataset.habitats=Object.entries(habitats).map(([id,h])=>id+':'+h.level).join(',');host.dataset.cared=Object.entries(habitats).filter(([,h])=>h.week===options.week).map(([id])=>id).join(',');const scene=new T.Scene();scene.background=new T.Color(theme.water);const camera=new T.PerspectiveCamera(38,1,.1,80);camera.position.set(0,1,13);camera.lookAt(0,0,0);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','游动的鱼宠水族箱');scene.add(new T.HemisphereLight(0xe5ffff,0x528d74,3));const sun=new T.DirectionalLight(0xffe6bc,3);sun.position.set(-5,10,5);scene.add(sun);
 const materials=[],school=[];
 const mesh=(geometry,color,x,y,z)=>{const material=new T.MeshStandardMaterial({color,roughness:.8});materials.push(material);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);return m;};
 mesh(new T.BoxGeometry(14,.3,5),theme.sand,0,-2.3,0);
 for(let j=0;j<9;j++){const m=mesh(new T.ConeGeometry(.35,1.3+j%3*.25,7),theme.plant,(j-4)*1.4,-1.6,-1.4);m.rotation.z=Math.sin(j)*.15;}
 if(habitats.meadow?.level){const lv=habitats.meadow.level;for(let j=0;j<lv*7;j++){const x=Math.sin(j*2.4)*5.8,z=Math.cos(j*2.4)*1.6;const plant=mesh(new T.ConeGeometry(.14,.6+j%3*.18,5),theme.plant,x,-1.8,z);plant.rotation.z=Math.sin(j)*.25;if(j%3===0)mesh(new T.SphereGeometry(.11,7,5),0xf4dca7,x+.2,-2,z);}}
 if(habitats.coral?.level){const lv=habitats.coral.level;for(let j=0;j<lv;j++){const x=(j-(lv-1)/2)*2.9;mesh(new T.TorusGeometry(.9,.14,8,20,Math.PI),theme.id==='ice'?0xb4dae0:0xd99bb3,x,-1.3,-1);for(const dx of [-.9,.9])mesh(new T.CylinderGeometry(.14,.2,.8,8),0xe1b3b5,x+dx,-1.7,-1);}}
 if(habitats.lantern?.level){const lv=habitats.lantern.level;const hull=mesh(new T.BoxGeometry(2.3,.45,.9),0xb79a77,3.4,-1.9,.2);hull.rotation.z=.15;for(let j=0;j<lv+1;j++){mesh(new T.CylinderGeometry(.045,.045,.85,7),0x8d9f85,2.5+j*.6,-1.45,.3);mesh(new T.SphereGeometry(.15,8,6),nurtured?0xffdf87:0xd4c28f,2.5+j*.6,-.98,.3);}}
 fish.forEach((f,i)=>{const {model,materials:owned,tail}=createFishModel(f);materials.push(...owned);model.scale.setScalar(fish.length<4?.85:.58);scene.add(model);school.push({model,tail,i});});
 for(let i=0;i<(nurtured?34:16);i++)mesh(new T.SphereGeometry(.035,6,4),0x99dce2,Math.sin(i*3)*6,(i%5)-2,-1);
 let raf,disposed=false;const start=performance.now();function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(){if(disposed)return;const t=(performance.now()-start)/1000;school.forEach(({model,tail,i})=>{const a=t*(nurtured?.23:.2)+i*2.4;model.position.set(Math.sin(a)*4.7,Math.sin(a*1.4+i)*1.3,Math.cos(a)*1.2);model.rotation.y=Math.cos(a)>0?0:Math.PI;tail.rotation.y=Math.sin(t*4+i)*.3;});if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(frame);}frame();
 return ()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
