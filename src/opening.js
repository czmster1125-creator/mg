import * as T from 'three';

// A short, self-contained opening. All progression and awards remain server-side.
export function showOpening(parent,onLand){
 const root=document.createElement('section');root.className='voyage-opening';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','潮汐小岛：海风带来的新开始');
 root.innerHTML='<div class="opening-canvas"></div><div class="opening-top"><span>TIDEBLOOM / 序章</span><button class="opening-skip">跳过开场</button></div><div class="opening-story" aria-live="polite"><small>海风，会带来新的开始</small><h1></h1><p></p><div class="opening-progress"><span></span></div><button class="primary opening-continue" hidden>前往浅礁</button></div>';
 parent.append(root);const host=root.querySelector('.opening-canvas'),title=root.querySelector('h1'),copy=root.querySelector('.opening-story p'),skip=root.querySelector('.opening-skip'),cont=root.querySelector('.opening-continue');
 let scene,renderer,observer,frame,stopped=false,pending=false,autoAttempted=false,last=-1;const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const chapters=[['一阵突如其来的海风','小飞机的引擎开始冒烟。你抓住应急袋，背好降落伞。'],['向着那抹蓝色，轻轻降落','海面越来越近。一块漂来的木板，接住了新的旅程。'],['还好，浅礁就在前面','木板、应急鱼竿，还有 80 金币和 20 份鱼饵。先找地方落脚。'],['从一块落脚地，开始新的家园','应急袋已收好。把眼前的浅礁，变成属于你的第一块土地。']];
 async function finish(){if(pending||stopped)return;pending=true;skip.disabled=cont.disabled=true;cont.hidden=false;cont.textContent='正在靠岸…';try{await onLand();dispose();}catch{pending=false;skip.disabled=cont.disabled=false;cont.textContent='重新连接，前往浅礁';copy.textContent='靠岸进度尚未确认，请连接网络后重试。应急袋不会重复发放。';}}
 skip.onclick=finish;cont.onclick=finish;skip.focus();
 let plane,chute,raft,smoke=[],camera;
 try{
  scene=new T.Scene();scene.background=new T.Color('#74cdd3');scene.fog=new T.Fog('#8ed6d6',22,70);
  renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','飞机故障、跳伞落海、抱住木板，漂向浅礁的 3D 开场');
  camera=new T.PerspectiveCamera(42,1,.1,100);camera.position.set(8,7,14);camera.lookAt(0,2,0);scene.add(new T.HemisphereLight(0xfffcdf,0x277b96,3));const sun=new T.DirectionalLight(0xffe6b0,3);sun.position.set(-6,12,5);scene.add(sun);
  const materials=new Map();function mesh(geo,color,parent,x=0,y=0,z=0){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.82}));const m=new T.Mesh(geo,materials.get(color));m.position.set(x,y,z);parent.add(m);return m;}
  const box=(w,h,d,c,p,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z),ball=(r,c,p,x=0,y=0,z=0)=>mesh(new T.IcosahedronGeometry(r,2),c,p,x,y,z),cyl=(r,h,c,p,x=0,y=0,z=0)=>mesh(new T.CylinderGeometry(r,r,h,10),c,p,x,y,z);
  const water=mesh(new T.PlaneGeometry(150,150),0x279eae,scene);water.rotation.x=-Math.PI/2;water.position.y=-.35;
  for(let i=0;i<34;i++){const w=box(.18+ i%4*.13,.012,.045,0x89d6d2,scene,Math.sin(i*9)*12,-.32,Math.cos(i*5)*17);w.rotation.y=i;}
  const reef=new T.Group();scene.add(reef);reef.position.set(3,-.14,-3);mesh(new T.CylinderGeometry(1.4,1.8,.35,6),0xf1d9a4,reef);mesh(new T.CylinderGeometry(.9,1.1,.12,6),0xb7ca87,reef,0,.2,0);ball(.38,0x8eb8aa,reef,-.6,.25,.1);
  for(let i=0;i<5;i++){const cloud=new T.Group();scene.add(cloud);cloud.position.set((i-2)*6,9+Math.sin(i)*2,-8);for(let j=0;j<3;j++){const b=ball(1,0xe5f4e4,cloud,(j-1)*.9,j%2*.2,0);b.scale.set(1.8,.5,.7);}}
  plane=new T.Group();scene.add(plane);const body=ball(1,0xffeac0,plane);body.scale.set(2,.55,.6);box(2.2,.12,5,0xeba361,plane);box(.8,.1,1.8,0xd17c55,plane,-1.6,.25,0);box(.6,.9,.13,0xd17c55,plane,-1.5,.5,0);box(.65,.28,.7,0x4f8c9d,plane,.5,.43,0);const prop=box(.1,1.6,.12,0x6b7471,plane,2,0,0);prop.name='prop';for(let i=0;i<6;i++)smoke.push(ball(.25+i*.06,0x97aaa5,plane,-.3-i*.5,.65+i*.11,-.6));
  chute=new T.Group();scene.add(chute);const canopy=mesh(new T.SphereGeometry(1.65,20,12,0,Math.PI*2,0,Math.PI/2),0xf7b77b,chute,0,2.5,0);canopy.scale.y=.7;for(let i=0;i<8;i++){const panel=mesh(new T.SphereGeometry(1.66,4,12,i*Math.PI/4,Math.PI/4,0,Math.PI/2),i%2?0xffe9b7:0xe88461,chute,0,2.5,0);panel.scale.y=.7;}
  for(const x of [-1,1])for(const z of [-.6,.6]){const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x,2.5,z),new T.Vector3(x*.17,.65,z*.2)]),new T.LineBasicMaterial({color:0xffefd1}));chute.add(line);}
  function person(parent,y=0){for(const x of [-.25,.25])ball(.09,0xf3c88e,parent,x,y+.35,.03);for(const x of [-.09,.09]){ball(.09,0x456b7a,parent,x,y+.06,.08);ball(.025,0x3c514c,parent,x,y+.69,.2);}cyl(.2,.38,0x479d9b,parent,0,y+.25,0);ball(.22,0xf3c88e,parent,0,y+.67,0);cyl(.33,.07,0xf1cc82,parent,0,y+.85,0);cyl(.22,.14,0xe9b16c,parent,0,y+.94,0);}
  person(chute);raft=new T.Group();scene.add(raft);for(let i=0;i<4;i++)box(.32,.15,2,0xc89863,raft,(i-1.5)*.34,0,0);for(const z of [-.6,.6])box(1.4,.04,.08,0x72583f,raft,0,.1,z);person(raft,.1);box(.35,.25,.3,0xe38e63,raft,.4,.22,-.4);
  observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(host);
 }catch{host.classList.add('opening-fallback');host.innerHTML='<div class="opening-fallback-art">✈<span>🪂</span><b>≈</b></div>';}
 function tick(now){if(stopped)return;const t=(now-start)/1000,index=t<3?0:t<6.5?1:t<10?2:3;
  if(index!==last){last=index;root.dataset.chapter=String(index);title.textContent=chapters[index][0];copy.textContent=chapters[index][1];}
  root.querySelector('.opening-progress span').style.width=Math.min(100,t/12*100)+'%';
  if(renderer){plane.visible=t<3.5;chute.visible=t>=3&&t<6.5;raft.visible=t>=6.5;plane.position.set(-.8+t*.5,5.3-t*.3,0);plane.rotation.z=-.08-t*.05;plane.getObjectByName('prop').rotation.x=t*35;smoke.forEach((p,i)=>{p.scale.setScalar(1+Math.sin(t*4+i)*.15);p.position.y=.8+i*.13+Math.sin(t+i)*.12;});chute.position.set(Math.sin(t)*.35,Math.max(.2,5-(t-3)*1.3),0);chute.rotation.z=Math.sin(t*1.4)*.08;raft.position.set(Math.min(1.2,Math.max(0,t-7)*.18),Math.sin(t*1.6)*.045,0);raft.rotation.z=Math.sin(t*1.2)*.025;renderer.render(scene,camera);}
  if(t>=12||reduced&&t>=1){cont.hidden=false;if(!autoAttempted){autoAttempted=true;finish();}}frame=requestAnimationFrame(tick);
 }
 function dispose(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);observer?.disconnect();const geos=new Set(),mats=new Set();scene?.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());renderer?.dispose();renderer?.forceContextLoss();root.remove();}
 frame=requestAnimationFrame(tick);return dispose;
}
