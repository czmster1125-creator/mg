import * as T from 'three';
import {createHexWorld} from './hex-scene.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createWorld as createIslandWorld} from './island-scene.js';
import {stepBoat,angleDelta,waterBounds,clamp} from './motion.js';

const SPOTS=[new T.Vector3(-2.9,.05,.4),new T.Vector3(2.8,.05,-3.2),new T.Vector3(2.6,.05,5.8)];
const NAMES=['浅滩鱼群','珊瑚秘境','大鱼出没'];
export function createWorld(container,onSpot,onBuilding,onMotion=()=>{},onBaseBuilding=()=>{},onCollect=()=>{}){
 const fishingHost=document.createElement('div');fishingHost.className='world-layer';container.append(fishingHost);
 const fishing=createFishingWorld(fishingHost,onSpot,onMotion);
 let hex=null,hexHost=null,island=null,islandHost=null,current='fish',lastState=null,lastRegion=0,frozen=false;
 const api={
  select:i=>fishing.select(i),cast:(v)=>fishing.cast(v),
  approach:()=>fishing.approach(),isMoving:()=>fishing.isMoving(),feedback:v=>fishing.feedback(v),catchFish:f=>fishing.catchFish(f),
  freeze(v){frozen=v;fishing.freeze(v||current!=='fish');island?.freeze(v||current!=='base');hex?.freeze(v||current!=='map');},
  view(v){current=v;if(v==='map'&&!hex){hexHost=document.createElement('div');hexHost.className='world-layer';container.append(hexHost);hex=createHexWorld(hexHost,onBuilding,onBaseBuilding);if(lastState)hex.update(lastState,lastRegion);}if(v==='base'&&!island){islandHost=document.createElement('div');islandHost.className='world-layer';container.append(islandHost);island=createIslandWorld(islandHost,onBuilding,onBaseBuilding,onCollect);if(lastState)island.update(lastState,lastRegion);}fishingHost.hidden=v!=='fish';if(hexHost)hexHost.hidden=v!=='map';if(islandHost)islandHost.hidden=v!=='base';island?.view('base');api.freeze(frozen);},
  selectBuilding:i=>{if(current==='base')island?.select(i);},clearSelection:()=>island?.clearSelection(),collect:()=>island?.collect(),
  zone:z=>fishing.zone(z),
  update(s,r=0){lastState=s;lastRegion=r;island?.update(s,r);hex?.update(s,r);},
  reset(){current==='map'?hex?.reset():current==='base'?island?.reset():fishing.reset();},
  getInfo:()=>fishing.getInfo(),
 };
 return api;
}
function createFishingWorld(container,onSpot,onMotion){
 const scene=new T.Scene();scene.background=new T.Color('#43bfc2');
 const camera=new T.OrthographicCamera(-7,7,14,-14,.1,100);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
 container.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','竖屏钓场，点击水面移动或点击鱼群圆环选择钓点');
 scene.add(new T.HemisphereLight(0xe5fffa,0x7aa69b,2.3));const sun=new T.DirectionalLight(0xfff1cf,2.8);sun.position.set(-12,24,14);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:22,bottom:-15,near:1,far:65});sun.shadow.normalBias=.045;scene.add(sun);
 const mats=new Map();const mat=(color)=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.86}));return mats.get(color);};
 function mesh(geo,color,parent=scene,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,c,p,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z);
 const sphere=(r,c,p,x=0,y=0,z=0)=>mesh(new T.IcosahedronGeometry(r,2),c,p,x,y,z);
 const cylinder=(rt,rb,h,c,p,x=0,y=0,z=0,n=10)=>mesh(new T.CylinderGeometry(rt,rb,h,n),c,p,x,y,z);
 const water=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShaderMaterial({uniforms:{time:{value:0},coral:{value:0}},vertexShader:`varying vec2 world;void main(){vec4 pos=modelMatrix*vec4(position,1.);world=pos.xz;gl_Position=projectionMatrix*viewMatrix*pos;}`,fragmentShader:`varying vec2 world;uniform float time;uniform float coral;
 float waves(vec2 p){return sin(p.x*1.5+sin(p.y*1.8-time*.3))*sin(p.y*1.2+time*.24);}
 void main(){vec2 p=world;float shore=smoothstep(3.4,7.5,abs(p.x));float w=waves(p);vec3 deep=mix(vec3(.055,.51,.64),vec3(.09,.44,.64),coral);vec3 c=mix(deep,vec3(.32,.78,.73),shore);c+=w*.017;float caustic=pow(max(0.,sin(p.x*3.+sin(p.y*2.+time*.2))*sin(p.y*3.-time*.3)),16.);c+=caustic*(.035+shore*.13);float sparkle=pow(max(0.,sin(p.x*3.7+sin(p.y*1.7))*sin(p.y*4.3+time*.4)),40.);c+=sparkle*.14;gl_FragColor=vec4(c,1.);}` }));water.rotation.x=-Math.PI/2;water.position.y=-.3;scene.add(water);
 // Tall, uninterrupted water corridor, framed by detailed coastal edges.
 function island(x,z,rx,rz){const g=new T.Group();g.position.set(x,0,z);scene.add(g);
 for(const [scale,y,h,c] of [[1.13,-.18,.12,0x91ded0],[1,.02,.55,0xf6dda6],[.83,.56,.24,0x9ac875]]){const shape=new T.Shape();for(let i=0;i<=36;i++){const a=i/36*Math.PI*2,r=1+.08*Math.sin(a*5+x);const px=Math.cos(a)*rx*r*scale,pz=Math.sin(a)*rz*r*scale;i?shape.lineTo(px,pz):shape.moveTo(px,pz);}const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,bevelSize:.16,bevelThickness:.12,steps:1});geo.rotateX(-Math.PI/2);mesh(geo,c,g,0,y,0);}return g;}
 island(-8,-6.5,3.7,6.8);island(8,-5,3.4,5.5);island(-7.7,7,2.3,5);island(8,9,3.0,4.4);
 const palms=[];function palm(x,z,s=1){const g=new T.Group();g.position.set(x,.85,z);g.scale.setScalar(s);scene.add(g);const trunk=cylinder(.12,.24,2.9,0xad8254,g,.1,1.4,0);trunk.rotation.z=-.1;for(let j=0;j<7;j++){const leaf=new T.Group();leaf.position.set(.23,2.9,0);leaf.rotation.y=j*Math.PI*2/7;g.add(leaf);const l=mesh(new T.SphereGeometry(1,9,6),j%2?0x60a761:0x84bd6d,leaf,.75,-.2,0);l.scale.set(1.15,.1,.25);l.rotation.z=-.25;const tip=mesh(new T.ConeGeometry(.18,.8,4),0x67ad5c,leaf,1.7,-.55,0);tip.rotation.z=2.2;}for(let i=0;i<3;i++)sphere(.14,0x9e754f,g,.12+i*.14,2.73,.1);palms.push(g);}
 [[-6.2,-5,1.05],[-7,1.4,1.12],[6.4,-5.4,1],[7,-.2,.9],[-7.5,8,1],[7.7,9,1.1],[-8,-11,1.3]].forEach(a=>palm(...a));
 for(let i=0;i<28;i++){const side=i%2?-1:1,x=side*(5.9+(Math.sin(i*4)*.6)),z=-10+i*.85;const r=sphere(.5+(i%3)*.19,i%2?0xbbc8ac:0xe4d2b0,scene,x,.1,z);r.scale.set(.9,.8,1.3);r.rotation.set(.3,i,.2);if(i%2===0){sphere(.35,0x7ab370,scene,x+side*.5,.8,z);sphere(.12,0xf2b594,scene,x+side*.4,1,z+.2);}}
 // A lighthouse at the edge gives direction without stealing the fishing area.
 const light=new T.Group();light.position.set(-6.3,.8,-10);scene.add(light);cylinder(.45,.75,3.6,0xfff0d4,light,0,1.8,0,16);cylinder(.55,.6,.4,0xeb9776,light,0,1.3,0,16);cylinder(.7,.7,.15,0xf5dab0,light,0,3.7,0);cylinder(.44,.44,.7,0x8bc7bc,light,0,4,0);cylinder(0,.85,.7,0xdd7e5f,light,0,4.65,0,12);box(.3,.55,.06,0x3f9e9b,light,0,2.1,.65);
 // Small wooden dock tucked into the coast.
 for(let i=0;i<10;i++){box(.32,.14,1.4,0xcaa373,scene,-7+i*.32,.5,3.2);if(i%3===0)for(const z of [2.5,3.9])cylinder(.07,.1,1.1,0xa58053,scene,-7+i*.32,.2,z);}
 const coralGroup=new T.Group();scene.add(coralGroup);for(let i=0;i<14;i++){const x=(i%2?1:-1)*(4.7+(i%3)*.3),z=-6+i*1.1;const g=new T.Group();g.position.set(x,-.15,z);coralGroup.add(g);for(let j=0;j<3;j++){const stem=cylinder(.06,.1,.4+j*.16,i%2?0xdfa293:0xa9a6cc,g,(j-1)*.13,.2,0,6);stem.rotation.z=(j-1)*.5;sphere(.12,0xe6bc99,g,(j-1)*.22,.5+j*.1,0);}}
 // Batch the stationary coastline to keep mobile draw calls low.
 scene.updateMatrixWorld(true);const staticGroups=new Map(),staticMeshes=[];
 scene.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const group=staticGroups.get(o.material)||[];group.push(g);staticGroups.set(o.material,group);staticMeshes.push(o);}});
 for(const m of staticMeshes){m.removeFromParent();m.geometry.dispose();}
 for(const [material,geometries] of staticGroups){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;scene.add(m);}
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 // Open canoe: the captain, reel and rod stay readable at phone size.
 const boat=new T.Group();scene.add(boat);boat.scale.setScalar(1.13);
 const hull=mesh(new T.SphereGeometry(1,20,12),0xe4a25e,boat,0,.22,0);hull.scale.set(.63,.32,1.24);
 const rim=mesh(new T.SphereGeometry(1,20,12),0xffe3ad,boat,0,.34,0);rim.scale.set(.58,.19,1.15);
 const inside=mesh(new T.SphereGeometry(1,20,12),0x9a613e,boat,0,.38,0);inside.scale.set(.47,.10,1.01);
 for(const z of [-.6,.25])box(.95,.1,.25,0xe8bd83,boat,0,.47,z);
 box(.08,.12,1.7,0xd88150,boat,-.51,.38,0);box(.08,.12,1.7,0xd88150,boat,.51,.38,0);
 const captain=new T.Group();boat.add(captain);captain.position.set(0,.48,-.2);
 const torso=sphere(.27,0x379c9c,captain,0,.28,0);torso.scale.set(1,.95,.8);sphere(.23,0xf1c18a,captain,0,.68,.03);
 cylinder(.39,.39,.065,0xf4cb7c,captain,0,.86,.01,20);cylinder(.24,.28,.24,0xe7ac55,captain,0,.98,.01,16);cylinder(.245,.28,.06,0xb86f4a,captain,0,.89,.01,16);
 for(const x of [-.11,.11]){sphere(.035,0x3b4f4a,captain,x,.68,.24);sphere(.09,0xe7b685,captain,x*2.3,.38,.3);}
 const rod=new T.Group();rod.position.set(.18,.82,.25);boat.add(rod);
 function rodGeometry(bend=0){return new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(.12,.8,.4),new T.Vector3(.2,1.25-bend,1.05)]),12,.023,5,false);}
 const rodMesh=mesh(rodGeometry(),0x68513b,rod);cylinder(.06,.06,.36,0xf4ce87,rod,0,.15,.06,8);const reel=mesh(new T.TorusGeometry(.09,.025,5,12),0xe8bd65,rod,0,.15,.16);reel.rotation.x=Math.PI/2;
 const float=new T.Group();scene.add(float);sphere(.115,0xf58863,float,0,.1,0);cylinder(.075,.075,.13,0xfff8de,float,0,.22,0);cylinder(.015,.015,.2,0xfce9ab,float,0,.37,0);float.visible=false;
 const linePositions=new Float32Array(25*3);const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.BufferAttribute(linePositions,3));
 const line=new T.Line(lineGeo,new T.LineBasicMaterial({color:0xfff7e1,transparent:true,opacity:.9}));line.frustumCulled=false;line.visible=false;scene.add(line);
 function fishModel(color=0x68b7ab){const g=new T.Group();const b=sphere(.25,color,g);b.scale.set(1.6,.65,.9);const tail=mesh(new T.ConeGeometry(.18,.3,3),color,g,-.45,0,0);tail.rotation.z=Math.PI/2;const fin=mesh(new T.ConeGeometry(.12,.22,3),color,g,-.05,.17,0);sphere(.055,0xfff9e7,g,.24,.09,.15);sphere(.026,0x264e50,g,.26,.095,.19);return g;}
 const shoals=[],spotRings=[],hitButtons=[];
 SPOTS.forEach((pos,i)=>{
  const g=new T.Group();g.position.copy(pos);scene.add(g);
  const disk=new T.Mesh(new T.CircleGeometry(1.03,64),new T.MeshBasicMaterial({color:0x0c6892,transparent:true,opacity:.15,depthWrite:false}));disk.rotation.x=-Math.PI/2;g.add(disk);
  for(let j=0;j<2;j++){const ring=new T.Mesh(new T.RingGeometry(1.01+j*.15,1.035+j*.15,64),new T.MeshBasicMaterial({color:0xd3fff2,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.015+j*.01;g.add(ring);if(j===0)spotRings.push(ring);}
  for(let j=0;j<3;j++){const f=fishModel([0x3c9298,0x45849b,0x347e8b][i]);f.scale.setScalar(.58+j*.07);scene.add(f);shoals.push({model:f,spot:i,phase:j*2.1,radius:.48+j*.12});}
  const button=document.createElement('button');button.className='spot-label shoal-hit';button.setAttribute('aria-label',`${NAMES[i]}，点击前往`);button.innerHTML='<span class="shoal-pin"><svg viewBox="0 0 24 24"><path d="M4 12c4-7 10-7 14 0-4 7-10 7-14 0Zm14 0 5-5v10Z"/><circle cx="8" cy="11" r="1"/></svg></span>';button.addEventListener('click',()=>onSpot(i));container.append(button);hitButtons.push(button);
 });
 const progressPositions=new Float32Array(65*3);const progressGeo=new T.BufferGeometry();progressGeo.setAttribute('position',new T.BufferAttribute(progressPositions,3));const progressRing=new T.Line(progressGeo,new T.LineBasicMaterial({color:0xffe5a1}));progressRing.frustumCulled=false;progressRing.visible=false;scene.add(progressRing);
 const pool=[];const particleGeo=new T.SphereGeometry(.055,5,4),particleMat=new T.MeshBasicMaterial({color:0xe7fff8,transparent:true,opacity:.8});
 for(let i=0;i<60;i++){const p=new T.Mesh(particleGeo,particleMat);p.visible=false;scene.add(p);pool.push({mesh:p,life:0,v:new T.Vector3()});}
 const ripples=[];for(let i=0;i<15;i++){const r=new T.Mesh(new T.RingGeometry(.8,.83,32),new T.MeshBasicMaterial({color:0xe3fff0,transparent:true,opacity:0,depthWrite:false}));r.rotation.x=-Math.PI/2;r.visible=false;scene.add(r);ripples.push({mesh:r,life:0});}
 function ripple(x,z,scale=.3){const r=ripples.find(r=>r.life<=0);if(r){r.life=1;r.base=scale;r.mesh.visible=true;r.mesh.position.set(x,.015,z);}}
 function splash(pos,count=14){for(let i=0;i<count;i++){const p=pool.find(p=>p.life<=0);if(!p)break;p.life=.6+Math.random()*.3;p.mesh.visible=true;p.mesh.position.copy(pos);p.v.set((Math.random()-.5)*2,1+Math.random()*2,(Math.random()-.5)*2);}ripple(pos.x,pos.z,.4);}
 const targetMarker=new T.Mesh(new T.RingGeometry(.15,.21,24),new T.MeshBasicMaterial({color:0xffffdf,transparent:true,opacity:0}));targetMarker.rotation.x=-Math.PI/2;scene.add(targetMarker);
 const catchModel=fishModel(0xecb465);catchModel.visible=false;scene.add(catchModel);
 let selected=0,paused=false,casting=false,castAt=0,castPhase='idle',progress=0,tension=0,charge=0,held=false,struggle=false,zone=0;
 let body={x:-1.1,z:3.1,heading:-2.55,speed:0,bank:0};let target={x:body.x,z:body.z};let moving=false,arrivalResolvers=[],pointer=null,dragging=false;
 let frameAverage=.016,quality=renderer.getPixelRatio(),qualityFrames=0;
 let last=performance.now()/1000,lastWake=0,lastSplash=0,markerLife=0,jumpAt=-10,catchColor=0xf4c064;
 const pointerPos=new T.Vector2(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
 function toWorld(e){const rect=renderer.domElement.getBoundingClientRect();pointerPos.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointerPos,camera);return ray.ray.intersectPlane(plane,hit)?hit:null;}
 function navigateTo(x,z){if(casting)return;target=waterBounds(x,z);markerLife=1;targetMarker.position.set(target.x,.03,target.z);targetMarker.material.opacity=.8;setMoving(true);}
 function setMoving(v){if(moving===v)return;moving=v;container.dataset.moving=String(v);onMotion(v);}
 renderer.domElement.addEventListener('pointerdown',e=>{if(paused||casting)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};dragging=false;renderer.domElement.setPointerCapture(e.pointerId);});
 renderer.domElement.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||casting)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)dragging=true;if(dragging){const p=toWorld(e);if(p)navigateTo(p.x,p.z);}});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointer)return;if(!dragging&&!casting){const p=toWorld(e);if(p){let nearest=-1,d=1.5;SPOTS.forEach((s,i)=>{const n=Math.hypot(s.x-p.x,s.z-p.z);if(n<d){nearest=i;d=n;}});if(nearest>=0)onSpot(nearest);else navigateTo(p.x,p.z);}}pointer=null;dragging=false;});
 renderer.domElement.addEventListener('pointercancel',()=>{pointer=null;dragging=false;});
 function select(i){selected=i;const pos=SPOTS[i];navigateTo(pos.x+(pos.x<0?1.7:-1.7),pos.z+2.3);}
 function approach(){const p=SPOTS[selected];const near=Math.hypot(body.x-p.x,body.z-p.z);if(near<3.8&&!moving)return Promise.resolve();select(selected);return new Promise(resolve=>arrivalResolvers.push(resolve));}
 function feedback(v){castPhase=v.phase??castPhase;progress=v.progress??progress;tension=v.tension??tension;charge=v.charge??charge;held=v.held??held;struggle=v.struggle??struggle;container.dataset.phase=castPhase;}
 function cast(v){casting=v;castAt=performance.now()/1000;float.visible=line.visible=v;progressRing.visible=v;progress=0;castPhase=v?'cast':'idle';if(!v){tension=0;charge=0;held=false;struggle=false;}container.dataset.phase=castPhase;}
 function catchFish(f){catchColor=new T.Color(f?.color||'#edb755');catchModel.traverse(o=>{if(o.isMesh&&o.material.color.getHex()!==0xfff9e7&&o.material.color.getHex()!==0x264e50){o.material=mat(catchColor.getHex());}});jumpAt=performance.now()/1000;catchModel.visible=true;splash(SPOTS[selected],25);}
 const birds=[];for(let i=0;i<3;i++){const b=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.25,0,0),new T.Vector3(0,-.06,0),new T.Vector3(.25,0,0)]),new T.LineBasicMaterial({color:0xfff7dd,transparent:true,opacity:.85}));scene.add(b);birds.push(b);}
 const look=new T.Vector3(0,0,2.2),lookTarget=new T.Vector3(),rodStart=new T.Vector3(),end=new T.Vector3();
 function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const vertical=26;camera.left=-vertical*w/h/2;camera.right=vertical*w/h/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(container);resize();
 function animate(){requestAnimationFrame(animate);const now=performance.now()/1000,elapsed=Math.min(now-last,1),dt=Math.min(elapsed,.1);last=now;if(paused||document.hidden)return;
  frameAverage=frameAverage*.92+elapsed*.08;
  if(++qualityFrames>50&&frameAverage>.065&&quality>.65){quality=Math.max(.65,quality-.2);renderer.setPixelRatio(quality);resize();qualityFrames=0;container.dataset.quality=quality.toFixed(2);}
  let arrived=false;for(let remaining=elapsed;remaining>0;remaining-=.05)arrived=stepBoat(body,target,Math.min(remaining,.05));if(arrived&&moving){setMoving(false);arrivalResolvers.splice(0).forEach(resolve=>resolve());}
  if(!moving){const p=SPOTS[selected],direction=Math.atan2(p.x-body.x,p.z-body.z);body.heading+=angleDelta(body.heading,direction)*(1-Math.exp(-4*dt));}
  boat.position.set(body.x,.08+Math.sin(now*2.6)*.025,body.z);boat.rotation.set(Math.sin(now*2)*.015,body.heading,body.bank+Math.sin(now*1.7)*.012);
  rod.rotation.x=castPhase==='charge'?-.6*charge/100:casting?-.18*Math.sin(Math.min(1,(now-castAt)/.5)*Math.PI)+(held?Math.sin(now*7)*.07:0):0;
  const bend=casting&&castPhase==='reel'?.15+tension*.003:0;rod.scale.z=1+bend*.3;rod.rotation.z=held?-.08:0;
  if(body.speed>.4&&now-lastWake>.11){lastWake=now;ripple(body.x-Math.sin(body.heading)*.9,body.z-Math.cos(body.heading)*.9,.15);}
  lookTarget.set(body.x*.09,0,2.2+(casting?.35:0));look.lerp(lookTarget,1-Math.exp(-2*dt));camera.position.set(look.x,25,look.z+19);camera.lookAt(look);camera.zoom=T.MathUtils.damp(camera.zoom,casting?1.07:1,3,dt);camera.updateProjectionMatrix();
  water.material.uniforms.time.value=now;palms.forEach((p,i)=>p.rotation.z=Math.sin(now*.75+i)*.018);
  shoals.forEach(f=>{const s=SPOTS[f.spot],a=now*.45+f.phase;f.model.position.set(s.x+Math.cos(a)*f.radius,-.1,s.z+Math.sin(a)*f.radius);f.model.rotation.y=-a-Math.PI/2;f.model.scale.y=.7+Math.sin(now*5+f.phase)*.1;});
  spotRings.forEach((r,i)=>{r.material.opacity=i===selected?.85:.28;r.material.color.set(i===selected?0xfff5cc:0xb4ecdf);r.scale.setScalar(1+Math.sin(now*2+i)*.018);});
  if(casting){const elapsed=now-castAt;rodStart.copy(new T.Vector3(.2,1.25,1.05));rod.localToWorld(rodStart);end.copy(SPOTS[selected]);end.y=.08+Math.sin(now*7)*.035;const flight=clamp(elapsed/.52,0,1);float.position.lerpVectors(rodStart,end,flight);float.position.y+=Math.sin(flight*Math.PI)*2.2;
   if(elapsed>=.52&&elapsed-dt<.52)splash(end);if((castPhase==='hook'||castPhase==='reel')&&now-lastSplash>.3){lastSplash=now;splash(end,4);}
   if(castPhase==='hook'){float.position.y-=.12+Math.sin(now*18)*.1;}if(castPhase==='reel'){float.position.x+=Math.sin(now*(struggle?11:5))*(struggle?.5:.16);float.position.z+=Math.cos(now*(struggle?9:4))*(struggle?.3:.1);}line.material.color.set(tension>90?0xff745c:struggle?0xffd28a:0xfff7e1);
   for(let i=0;i<=24;i++){const a=i/24;linePositions[i*3]=T.MathUtils.lerp(rodStart.x,float.position.x,a);linePositions[i*3+1]=T.MathUtils.lerp(rodStart.y,float.position.y,a)-Math.sin(a*Math.PI)*(castPhase==='reel'?.06:.25);linePositions[i*3+2]=T.MathUtils.lerp(rodStart.z,float.position.z,a);}lineGeo.attributes.position.needsUpdate=true;
   for(let i=0;i<=64;i++){const a=i/64*Math.PI*2*(progress/100)-Math.PI/2;progressPositions[i*3]=SPOTS[selected].x+Math.cos(a)*1.23;progressPositions[i*3+1]=.1;progressPositions[i*3+2]=SPOTS[selected].z+Math.sin(a)*1.23;}progressGeo.attributes.position.needsUpdate=true;progressRing.material.color.set(tension>85?0xff9a7b:0xffe4a0);
  }
  pool.forEach(p=>{if(p.life<=0)return;p.life-=dt;p.v.y-=dt*5;p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.setScalar(Math.max(.01,p.life));if(p.life<=0)p.mesh.visible=false;});
  ripples.forEach(r=>{if(r.life<=0)return;r.life-=dt*.75;r.mesh.material.opacity=Math.max(0,r.life*.38);r.mesh.scale.setScalar(r.base+(1-r.life)*.9);if(r.life<=0)r.mesh.visible=false;});
  markerLife=Math.max(0,markerLife-dt);targetMarker.material.opacity=markerLife*.7;targetMarker.scale.setScalar(1+(1-markerLife)*2);
  const jumping=now-jumpAt;if(jumping<.85){catchModel.visible=true;const p=SPOTS[selected],t=jumping/.85;catchModel.position.set(T.MathUtils.lerp(p.x,body.x,t),.4+Math.sin(t*Math.PI)*3,T.MathUtils.lerp(p.z,body.z,t));catchModel.scale.setScalar(1.8);catchModel.rotation.set(t*2,now*3,-t*4);}else catchModel.visible=false;
  birds.forEach((b,i)=>{b.position.set(Math.sin(now*.08+i*2)*8,6+i,Math.cos(now*.08+i*2)*9-2);b.rotation.y=-now*.08-i*2;});
  const w=container.clientWidth,h=container.clientHeight;
  hitButtons.forEach((button,i)=>{const p=SPOTS[i].clone().project(camera);button.style.left=(p.x*.5+.5)*w+'px';button.style.top=(-p.y*.5+.5)*h+'px';const size=2.65/(camera.right-camera.left)*w*camera.zoom;button.style.width=button.style.height=size+'px';button.classList.toggle('selected',i===selected);button.setAttribute('aria-pressed',String(i===selected));button.hidden=casting;});
  container.dataset.boatX=body.x.toFixed(3);container.dataset.boatZ=body.z.toFixed(3);container.dataset.heading=body.heading.toFixed(3);container.dataset.selected=selected;
  renderer.render(scene,camera);
 }
 animate();
 return {select,approach,cast,feedback,catchFish,freeze(v){paused=v;},isMoving:()=>moving,zone(z){zone=z;water.material.uniforms.coral.value=Math.min(1,z);},reset(){select(selected);},getInfo:()=>renderer.info};
}
