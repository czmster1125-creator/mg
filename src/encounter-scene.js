import * as T from 'three';
import {createBaseBuilding,mergeStatic} from './town-models.js';
import './encounter.css';

const noop=()=>{};
export function createEncounterScene(host,type,options={}){
 if(!host)return Object.assign(noop,{play:()=>Promise.resolve(),skip:noop});
 const raid=type.startsWith('raid'),result=type.endsWith('result'),rival=options.rival;
 const theme=[0x3da5ae,0x568eab,0x6ca8a1,0x8c92b7][rival?.theme||0];
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,70);
 scene.background=new T.Color(raid?0x173a61:theme);camera.position.set(7.8,10,14);camera.lookAt(0,.5,0);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label',raid?'可交互的偷袭海岛：船只、搬运角色和巡逻守卫':'可交互的攻击海岛：点击建筑投掷椰果');
 scene.add(new T.HemisphereLight(raid?0xc6d9ff:0xffffff,0x517a67,2.5));const light=new T.DirectionalLight(raid?0xb3c7ff:0xffe5b5,3);light.position.set(-5,12,8);scene.add(light);
 const owned=new Set(),palette=new Map();
 function mat(c){if(!palette.has(c)){const m=new T.MeshStandardMaterial({color:c,roughness:.8});palette.set(c,m);owned.add(m);}return palette.get(c);}
 function mesh(g,c,x=0,y=0,z=0,parent=scene){const o=new T.Mesh(g,mat(c));o.position.set(x,y,z);parent.add(o);return o;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>mesh(new T.SphereGeometry(r,10,7),c,x,y,z,p);
 const cyl=(r,h,c,x,y,z,p)=>mesh(new T.CylinderGeometry(r,r,h,12),c,x,y,z,p);
 const sea=mesh(new T.PlaneGeometry(100,100),raid?0x16486d:0x288eaa,0,-.7,0);sea.rotation.x=-Math.PI/2;
 cyl(5.3,.5,0xe8cd8d,0,-.4,0);cyl(5.05,.12,raid?0x71956a:0x94bd69,0,-.1,0);
 for(let i=0;i<10;i++){const a=i*.7;ball(.22,0xb9be9b,Math.cos(a)*5.1,-.17,Math.sin(a)*5.1);}
 for(let i=0;i<7;i++)box(1.6,.11,.35,0xbb9258,0,-.06,4+i*.32);
 const targets=[],rings=[];
 for(let i=0;i<3;i++){
  const m=createBaseBuilding([3,2,4][i],1+(rival?.theme===i?1:0));mergeStatic(m);m.scale.setScalar(.7);m.position.set((i-1)*3.05,0,i===1?-.8:.3);scene.add(m);targets.push(m);
  const ring=new T.Mesh(new T.RingGeometry(.95,1.04,32),new T.MeshBasicMaterial({color:raid?0xaadbc1:0xffe4a1,transparent:true,opacity:.5,side:T.DoubleSide}));owned.add(ring.material);ring.rotation.x=-Math.PI/2;ring.position.set(m.position.x,.04,m.position.z+.9);scene.add(ring);rings.push(ring);
 }
 for(const x of [-4.2,4.2])for(const z of [-2.2,2.3]){cyl(.09,1.6,0x9e7950,x,.65,z);for(let j=0;j<4;j++){const leaf=ball(.57,0x508f60,x+Math.cos(j*Math.PI/2)*.43,1.6,z+Math.sin(j*Math.PI/2)*.43);leaf.scale.set(1,.25,1);}ball(.23,0xddba65,x,1.55,z);}
 function person(coat,hat){const g=new T.Group();scene.add(g);const torso=cyl(.19,.48,coat,0,.53,0,g),head=ball(.19,0xf3cca3,0,.97,0,g);cyl(.29,.055,hat,0,1.16,0,g);cyl(.18,.15,hat,0,1.22,0,g);ball(.027,0x2e5559,-.07,1,.17,g);ball(.027,0x2e5559,.07,1,.17,g);const arms=[-.26,.26].map(x=>{const a=new T.Group();a.position.set(x,.73,0);g.add(a);box(.1,.36,.11,coat,0,-.13,0,a);return a;});const legs=[-.1,.1].map(x=>box(.12,.32,.14,0x3d6373,x,.18,0,g));return {g,arms,legs,head,torso};}
 const player=person(0xe79066,0xffe1a2),guard=person(0x788ba0,0xd4b66b),captain=person(rival?.coat||0x6b9ca9,0xe6c9a0);
 captain.g.position.set(-3.8,0,2.25);guard.g.position.set(2.1,0,2.0);
 const boat=new T.Group();scene.add(boat);boat.position.set(.1,-.05,raid&&options.stage==='inside'?5.3:6.8);const hull=ball(.8,0xf3d798,0,0,0,boat);hull.scale.set(.66,.38,1.6);box(.8,.1,.8,0x438d91,0,.25,0,boat);box(.9,.1,.16,0xb18658,0,.33,.6,boat);player.g.position.set(0,0,raid&&options.stage==='inside'?3.5:5.5);
 const bag=box(.44,.45,.36,0xd0a568,0,.6,.35,player.g);bag.visible=raid&&(options.carried>0||result&&options.coin>0);
 const lantern=ball(.12,0xffd482,.34,.6,.1,guard.g);
 const cone=new T.Mesh(new T.ConeGeometry(.8,2.5,16,1,true),new T.MeshBasicMaterial({color:0xffd791,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));owned.add(cone.material);cone.rotation.x=-Math.PI/2;cone.position.set(0,.4,1.4);guard.g.add(cone);cone.visible=raid;
 const shield=new T.Mesh(new T.SphereGeometry(4.9,24,12),new T.MeshBasicMaterial({color:0x9ae1ee,transparent:true,opacity:.13,wireframe:true,depthWrite:false}));owned.add(shield.material);shield.scale.y=.65;shield.position.y=.3;scene.add(shield);shield.visible=!raid&&!!options.shield;
 const shock=new T.Mesh(new T.RingGeometry(.6,.68,40),new T.MeshBasicMaterial({color:0xffdf91,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));owned.add(shock.material);shock.rotation.x=-Math.PI/2;shock.visible=false;scene.add(shock);
 const projectile=ball(.19,0xa77f4b,0,1,5);projectile.visible=false;
 const particles=Array.from({length:24},(_,i)=>{const p=ball(.075,i%2?0xf6d578:0xffefbf,0,0,0);p.visible=false;return p;});
 const status=document.createElement('div');status.className='encounter-scene-status';status.setAttribute('role','status');status.textContent=raid?options.stage==='inside'?'选择岛上藏点，留意巡逻守卫':'小艇正等待夜航登岛':'选择岛上建筑，投出挑战椰果';host.append(status);
 const skip=document.createElement('button');skip.className='encounter-skip';skip.dataset.act='skip-event-animation';skip.textContent='跳过演出';skip.hidden=true;host.append(skip);
 let disposed=false,raf,animation=null,resolvePlay=null,deadline=null,selected=options.target??0;
 if(result){status.textContent=raid?options.caught?'守卫发现了你，小艇带着保住的金币归航':'小艇已安全归航，金币已入账':options.blocked?'椰果击中护盾，守护光幕消散':options.broken?'建筑被击破，奖励已入账':'椰果命中，建筑损伤已保留';if(!raid&&options.broken)targets[selected].scale.y=.4;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const started=performance.now();
 function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function finish(){clearTimeout(deadline);deadline=null;animation=null;projectile.visible=false;shock.visible=false;targets.forEach(t=>t.rotation.z=0);particles.forEach(p=>p.visible=false);skip.hidden=true;host.dataset.phase='settled';const resolve=resolvePlay;resolvePlay=null;resolve?.();}
 function apply(a,t){
  const attack=a.kind==='attack',target=targets[a.index],point=target.position;
  if(attack){
   if(t<=.6)status.textContent='抛出椰果，瞄准目标…';
   selected=a.index;player.arms[1].rotation.x=-Math.sin(Math.min(1,t/.35)*Math.PI)*1.7;
   projectile.visible=t<.72;const flight=Math.min(1,t/.65);projectile.position.set(T.MathUtils.lerp(0,point.x,flight),1.3+Math.sin(flight*Math.PI)*3.5,T.MathUtils.lerp(5.5,point.z,flight));
   if(t>.6){const k=Math.min(1,(t-.6)/.4);shock.visible=true;shock.position.set(point.x,.09,point.z);shock.scale.setScalar(.8+k*4);shock.material.color.set(a.payload.blocked?0xa3e9f1:0xffd588);shock.material.opacity=(1-k)*.85;host.dataset.phase=a.payload.blocked?'shield-impact':'building-impact';shield.visible=!!a.payload.blocked;shield.material.opacity=a.payload.blocked?(1-k)*.5:0;target.rotation.z=a.payload.blocked?0:Math.sin(t*48)*(1-k)*.17;if(a.payload.broken)target.scale.y=.7*(1-k*.45);particles.forEach((p,i)=>{p.visible=k<1;p.material.color.set(a.payload.blocked?0xb0eff6:i%2?0xf6d578:0xffefbf);const angle=i*2.4;p.position.set(point.x+Math.cos(angle)*k*2,1+Math.sin(k*Math.PI)*1.5-i%3*.09,point.z+Math.sin(angle)*k*1.4);p.scale.setScalar(1-k*.7);});captain.g.position.y=Math.sin(k*Math.PI)*.4;status.textContent=a.payload.blocked?'护盾接住了椰果！':a.payload.broken?'命中！建筑被击破':'命中！建筑损伤加深';}
  }else if(a.kind==='infiltrate'){
   host.dataset.phase='landing';boat.position.z=T.MathUtils.lerp(6.8,5.3,t);player.g.position.z=T.MathUtils.lerp(5.5,3.5,t);player.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*22+i*Math.PI)*.4);status.textContent=t<.5?'压低船帆，慢慢靠岸…':'趁守卫转身，登上木栈桥';
  }else if(a.kind==='steal'){
   const walk=t<.45?t/.45:t<.65?1:(1-t)/.35;player.g.position.set(point.x*Math.max(0,walk),0,T.MathUtils.lerp(3.5,point.z+1.6,Math.max(0,walk)));player.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*35+i*Math.PI)*.45);player.arms.forEach((arm,i)=>arm.rotation.x=t>.4?-1:Math.sin(t*25+i*Math.PI)*.35);bag.visible=t>.48&&(!a.payload.caught||(a.payload.coin||0)>0);
   host.dataset.phase=a.payload.caught?'guard-alert':t<.45?'sneaking':t<.65?'lifting':'carrying';cone.material.color.set(a.payload.caught&&t>.48?0xf47e67:0xffd791);cone.material.opacity=a.payload.caught&&t>.48?.3:.12;status.textContent=a.payload.caught?'守卫发现了！带上保住的金币撤离':t<.45?'沿着小路靠近藏点…':t<.65?'找到货箱，正在搬运…':`已藏好 ${a.payload.amount??a.payload.coin??0} 金币，等待撤离`;
  }else{
   host.dataset.phase=a.payload.caught?'escape-alert':'escaping';bag.visible=(a.payload.coin||options.carried||0)>0;player.g.position.set(0,0,T.MathUtils.lerp(3.5,7.2,t));boat.position.z=T.MathUtils.lerp(5.3,7.6,t);status.textContent=a.payload.caught?'守卫吹响哨子，小艇加速离岸':'放下船帆，带着金币平安归航';
  }
 }
 function frame(){if(disposed)return;const now=performance.now(),time=(now-started)/1000;boat.position.y=-.08+Math.sin(time*2)*.04;guard.g.position.x=1.4+Math.sin(time*.65)*1.3;guard.g.rotation.y=Math.sin(time*.45)*1.1;lantern.scale.setScalar(1+Math.sin(time*3)*.08);rings.forEach((r,i)=>{r.material.opacity=.27+Math.sin(time*2+i)*.12;r.scale.setScalar(i===selected?1.06:1);});
  if(animation){const t=Math.min(1,(now-animation.started)/animation.duration);apply(animation,t);if(!reduced){const point=targets[animation.index].position,focus=Math.sin(t*Math.PI),impact=animation.kind==='attack'&&t>.6?Math.sin((t-.6)/.4*Math.PI)*.025:0;camera.position.set(7.8-focus*.7+Math.sin(t*70)*impact,10-focus*.6,14-focus*1.2);camera.lookAt(point.x*focus*.18,.5,point.z*focus*.12);camera.zoom=1+focus*.08;camera.updateProjectionMatrix();}if(t>=1)finish();}else{camera.position.lerp(new T.Vector3(7.8,10,14),.14);camera.lookAt(0,.5,0);camera.zoom=T.MathUtils.lerp(camera.zoom,1,.14);camera.updateProjectionMatrix();captain.g.position.y=Math.sin(time*2)*.015;player.arms.forEach(a=>a.rotation.x=0);player.legs.forEach(l=>l.rotation.x=0);}
  if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(frame);
 }
 const ray=new T.Raycaster(),pointer=new T.Vector2();renderer.domElement.addEventListener('pointerup',e=>{if(animation||result||raid&&options.stage!=='inside')return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,true)[0];if(hit){let o=hit.object;while(o.parent&&!targets.includes(o))o=o.parent;const i=targets.indexOf(o);if(i>=0)options.onTarget?.(i);}});
 frame();host.dataset.phase=result?'settled':'ready';
 const dispose=()=>{if(disposed)return;disposed=true;finish();cancelAnimationFrame(raf);observer.disconnect();const geometries=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])owned.add(m);});geometries.forEach(g=>g.dispose());owned.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();status.remove();skip.remove();};
 dispose.play=(action,payload)=>{if(disposed)return Promise.resolve();finish();const kind=action.split('/')[1]==='bank'?'escape':action.split('/')[1],index=payload.target??payload.route??0;animation={kind,index,payload,started:performance.now(),duration:kind==='attack'?1400:kind==='steal'?1700:1400};skip.hidden=false;host.dataset.phase=kind==='attack'?'launch':'landing';deadline=setTimeout(()=>{if(animation)apply(animation,1);finish();},animation.duration+80);if(reduced){apply(animation,1);finish();return Promise.resolve();}return new Promise(resolve=>resolvePlay=resolve);};
 dispose.skip=()=>{if(animation)apply(animation,1);finish();};return dispose;
}
