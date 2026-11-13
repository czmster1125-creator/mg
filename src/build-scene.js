import * as T from 'three';
import {constructionFrame} from '../shared/build-presentation.js';

// Presentation has no game mutations. A wall-clock deadline also completes it
// when rendering is paused, the page is backgrounded, or the player skips.
export function createBuildScene({scene,camera,draw,getPlot,getBuilding}){
 let active=null;
 function finish(){
  if(!active)return;const a=active;active=null;clearTimeout(a.deadline);
  try{a.frame(performance.now(),true);a.land.forEach(p=>{p.position.y=0;p.scale.set(1,1,1);});a.buildings.forEach(p=>p.scale.setScalar(.48));camera.zoom=a.zoom;camera.updateProjectionMatrix();scene.remove(a.effects);a.effects.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});draw();}finally{a.resolve();}
 }
 function play(plan,onFrame=()=>{}){
  finish();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,land=plan.land.map(getPlot).filter(Boolean),buildings=plan.buildings.map(x=>getBuilding(x.index)).filter(Boolean),effects=new T.Group();scene.add(effects);
  const first=land[0]||buildings[0]?.parent,focus=new T.Vector3();scene.updateMatrixWorld(true);first?.getWorldPosition(focus);const x=focus.x,z=focus.z;
  const ring=new T.Mesh(new T.RingGeometry(.75,.82,32),new T.MeshBasicMaterial({color:0xffecc0,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.72,z);effects.add(ring);
  const sparks=[];for(let i=0;i<14;i++){const p=new T.Mesh(new T.IcosahedronGeometry(.045+(i%3)*.015,0),new T.MeshBasicMaterial({color:i%2?0xffe8a7:0xdbf9cf,transparent:true,depthWrite:false}));effects.add(p);sparks.push(p);}
  let boat=null;if(plan.delivery){boat=new T.Group();effects.add(boat);const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.85}),add=(geo,c,x,y,z)=>{const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);boat.add(m);return m;};const hull=add(new T.SphereGeometry(1,12,8),0xd5a16e,0,0,0);hull.scale.set(.32,.15,.65);const rim=add(new T.SphereGeometry(1,12,8),0xffe4a8,0,.1,0);rim.scale.set(.3,.1,.6);for(const v of [-.25,.22])add(new T.BoxGeometry(.5,.04,.13),0xba8b58,0,.15,v);add(new T.CylinderGeometry(.015,.015,.85,6),0xffe1a4,-.2,.5,-.15);add(new T.BoxGeometry(.35,.18,.025),0x4fae9c,-.04,.78,-.15);boat.rotation.y=-.45;}
  return new Promise(resolve=>{
   const a={resolve,effects,land,buildings,zoom:camera.zoom,start:performance.now()};
   a.frame=(now,force=false)=>{const f=constructionFrame(plan,force?Infinity:now-a.start,reduced);land.forEach(p=>{p.position.y=-.8*(1-f.land);p.scale.y=.18+.82*f.land;});buildings.forEach(p=>p.scale.setScalar(.48*(.08+.92*f.building)));camera.zoom=a.zoom*(1+(reduced?0:.055*Math.sin(f.progress*Math.PI)));camera.updateProjectionMatrix();ring.scale.setScalar(1+f.progress*1.8);ring.material.opacity=(1-f.progress)*.8;sparks.forEach((p,i)=>{const angle=i*Math.PI*2/sparks.length;p.position.set(x+Math.cos(angle)*(.55+f.progress*1.5),.8+Math.sin(f.progress*Math.PI)*(1+i%3*.18),z+Math.sin(angle)*(.55+f.progress*1.5));p.material.opacity=Math.sin(f.progress*Math.PI);});if(boat){boat.position.set(x+2.5-2*f.boat,.05+Math.sin(f.boat*Math.PI*3)*.035,z+3-1.3*f.boat);boat.rotation.y=-.45+f.boat*.35;}onFrame(f);};
   active=a;a.frame(a.start);draw();a.deadline=setTimeout(finish,(reduced?140:plan.duration)+30);
  });
 }
 return {play,skip:finish,tick(now){if(!active)return;active.frame(now);if(now-active.start>=2200)finish();},get active(){return !!active;}};
}
