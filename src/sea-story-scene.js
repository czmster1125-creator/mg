import * as T from 'three';
import {SEA_PALETTES} from './fishing-presentation.js';

export function createStoryModel(zone=0){
 const root=new T.Group(),materials=new Map();
 const material=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.72}));return materials.get(color);};
 const add=(geometry,color,x,y,z,parent=root)=>{const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);parent.add(m);return m;};
 const box=(w,h,d,c,x,y,z,p)=>add(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>add(new T.SphereGeometry(r,12,8),c,x,y,z,p);
 const cylinder=(r,h,c,x,y,z,p)=>add(new T.CylinderGeometry(r,r,h,12),c,x,y,z,p);
 const theme=SEA_PALETTES[zone],platform=new T.Group();root.add(platform);
 const sand=cylinder(3.2,.32,zone===3?0x86716b:zone===4?0xcfe4df:0xe8cf95,0,-.27,0,platform);sand.scale.z=.73;
 for(let i=0;i<7;i++)box(.28,.12,2,0xbb925f,-1.2+i*.4,.03,1.8,platform);
 const beacon=new T.Group();platform.add(beacon);beacon.position.set(-1.8,0,-.5);
 cylinder(.22,2.0,zone===5?0x9f97b9:0xe8dbad,0,.9,0,beacon);cylinder(.48,.13,0xc4a775,0,1.9,0,beacon);
 const lamp=ball(.32,0xffd589,0,2.15,0,beacon);add(new T.ConeGeometry(.6,.38,6),new T.Color(theme.accent).getHex(),0,2.5,0,beacon);
 const crate=new T.Group();platform.add(crate);crate.position.set(.9,.1,-.35);
 box(1.3,.7,.85,0xb7875b,0,.35,0,crate);for(const x of [-.45,.45])box(.1,.72,.88,0xe7c28a,x,.35,0,crate);
 const lid=new T.Group();crate.add(lid);lid.position.set(0,.72,-.42);box(1.35,.12,.92,0xe2b87e,0,0,.4,lid);
 const pearl=ball(.26,new T.Color(theme.accent).getHex(),0,.62,0,crate);
 const turtle=new T.Group();platform.add(turtle);turtle.position.set(.25,.3,1.5);
 const shell=ball(.43,0x71a684,0,0,0,turtle);shell.scale.set(1,.55,1.25);ball(.21,0xb4d79b,0,-.03,.64,turtle);
 const flippers=[];for(const sign of [-1,1])for(const z of [-.28,.25]){const fin=ball(.22,0x9cc58c,sign*.43,-.09,z,turtle);fin.scale.set(1.8,.23,.6);flippers.push(fin);}
 for(const x of [-.08,.08])ball(.025,0x2c5958,x,.02,.82,turtle);
 for(let i=0;i<8;i++){const a=i*2.4,x=Math.cos(a)*2.6,z=Math.sin(a)*1.6;
  if(zone===4){add(new T.ConeGeometry(.26,.8,5),0xe5f4ee,x,.3,z,platform);}
  else if(zone===5){cylinder(.16,.5+i%3*.2,0xa4a0b5,x,.2,z,platform);ball(.08,0xdbbef3,x,.6,z,platform);}
  else if(zone===3){const r=ball(.32,0x6c666f,x,.03,z,platform);r.scale.y=.6;box(.3,.025,.045,0xf3a76b,x,.22,z,platform);}
  else if(zone===2){const c=cylinder(.055,.5,0xd8a2bc,x,.2,z,platform);c.rotation.z=a;ball(.12,0xf2c6bb,x,.5,z,platform);}
  else{const r=ball(.28,0x9aa68b,x,.03,z,platform);r.scale.y=.6;}
 }
 return {root,crate,lid,pearl,turtle,flippers,lamp,materials:[...materials.values()]};
}

export function createSeaStoryScene(host,kind,options={}){
 const zone=options.zone||0,theme=SEA_PALETTES[zone],scene=new T.Scene();scene.background=new T.Color(theme.deep);
 const camera=new T.PerspectiveCamera(38,1,.1,50);camera.position.set(5.6,6.3,9.8);camera.lookAt(0,.6,0);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',theme.name+'的海上故事场景：航灯、漂流箱与海龟伙伴');
 scene.add(new T.HemisphereLight(0xf4fff0,0x557a81,2.6));const sun=new T.DirectionalLight(0xffe4ba,3);sun.position.set(-4,9,6);scene.add(sun);
 const model=createStoryModel(zone);scene.add(model.root);
 const rings=[];for(let i=0;i<4;i++){const m=new T.Mesh(new T.RingGeometry(3.4+i*.5,3.42+i*.5,48),new T.MeshBasicMaterial({color:theme.shallow,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=-.43;scene.add(m);rings.push(m);}
 const status=document.createElement('div');status.className='encounter-scene-status';status.textContent=kind==='story-result'?'这一段远航，已经留在手记里':options.stage==='decision'?'准备已经完成，选择接下来的航路':'有些海上的相遇，值得停一停';host.append(status);
 const skip=document.createElement('button');skip.className='encounter-skip';skip.dataset.act='skip-event-animation';skip.textContent='跳过演出';skip.hidden=true;host.append(skip);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let raf,disposed=false,animation=null,resolver=null,deadline=null;
 const finish=()=>{clearTimeout(deadline);deadline=null;animation=null;skip.hidden=true;host.dataset.phase='settled';resolver?.();resolver=null;};
 function apply(t,payload){const help=['help','escort','gather'].includes(payload.choice);host.dataset.phase=help?'helping':t<.5?'investigating':'discovery';model.lid.rotation.x=-Math.min(1,t*2)*1.2;model.pearl.position.y=.62+Math.sin(t*Math.PI)*.7;model.turtle.position.z=1.5+(help?t*1.8:0);model.lamp.scale.setScalar(1+Math.sin(t*Math.PI)*.22);status.textContent=payload.event?'补给与工具已备好，继续选择航路':payload.failed?'暗流挡住了去路，仍带回一部分物资':help?'伙伴已经安全，船上也多了一份谢礼':'箱子打开了，把这段经历带回小岛';}
 function frame(now){if(disposed)return;const time=now/1000;model.root.position.y=reduced?0:Math.sin(time*1.5)*.035;model.flippers.forEach((f,i)=>f.rotation.z=reduced?0:Math.sin(time*3+i)*.17);rings.forEach((r,i)=>r.material.opacity=.15+Math.sin(time*1.4+i)*.07);
  if(animation){const t=Math.min(1,(now-animation.at)/950);apply(t,animation.payload);if(t>=1)finish();}
  if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(frame);
 }
 const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();host.dataset.zone=zone;host.dataset.phase='ready';raf=requestAnimationFrame(frame);
 if(kind==='story-result'){model.lid.rotation.x=-1.2;model.pearl.visible=!options.failed;}
 const dispose=()=>{if(disposed)return;disposed=true;finish();cancelAnimationFrame(raf);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();status.remove();skip.remove();};
 dispose.play=(_,payload)=>{finish();if(disposed)return Promise.resolve();if(reduced){apply(1,payload);return Promise.resolve();}animation={at:performance.now(),payload};deadline=setTimeout(()=>{if(animation)apply(1,animation.payload);finish();},1030);skip.hidden=false;return new Promise(resolve=>resolver=resolve);};
 dispose.skip=()=>{if(animation)apply(1,animation.payload);finish();};return dispose;
}
