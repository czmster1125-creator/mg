import * as T from 'three';
/** A lightweight collectible turntable. Its renderer is explicitly disposed on close. */
export function createFishPreview(host,fish){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,30);camera.position.set(.1,.4,6.5);camera.lookAt(0,0,0);
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',`${fish.name}的旋转 3D 模型`);
 scene.add(new T.HemisphereLight(0xffffff,0x5f899b,3));const key=new T.DirectionalLight(0xffe9bf,4);key.position.set(-3,4,5);scene.add(key);const rim=new T.DirectionalLight(0xb4efff,2);rim.position.set(3,2,-4);scene.add(rim);
 const {model,materials,tail}=createFishModel(fish);scene.add(model);
 let disposed=false,raf;const started=performance.now();function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function animate(){if(disposed)return;const t=(performance.now()-started)/1000;model.rotation.y=.22+Math.sin(t*.75)*.42;model.rotation.z=Math.sin(t)*.04;model.position.y=Math.sin(t*1.3)*.07;tail.rotation.y=Math.sin(t*3)*.16;renderer.render(scene,camera);raf=requestAnimationFrame(animate);}animate();
 return ()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();model.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}

export function createFishModel(fish){
 const model=new T.Group();const materials=[];function material(color){const m=new T.MeshStandardMaterial({color,roughness:.48});materials.push(m);return m;}
 const color=material(fish.color),finMat=material(new T.Color(fish.color).multiplyScalar(1.12)),cream=material(0xffefd0),black=material(0x1f3d52),eyeWhite=material(0xfff9e9);
 function ellipsoid(x,y,z,sx,sy,sz,mat){const m=new T.Mesh(new T.SphereGeometry(1,24,16),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);model.add(m);return m;}
 const long=['tuna','marlin','sardine'].includes(fish.id)||['long','eel','horn'].includes(fish.form),round=fish.id==='sunfish'||['round','puffer'].includes(fish.form),ray=fish.id==='manta'||fish.form==='ray';const length=fish.form==='seahorse'?.38:fish.form==='eel'?1.5:long?1.18:.94,height=fish.form==='seahorse'?1:fish.form==='flat'?.75:round?.9:long?.44:.64,width=ray?.62:fish.form==='flat'?.2:.4;
 ellipsoid(0,0,0,length,height,width,color);ellipsoid(.05,-height*.38,.02,length*.83,height*.56,width*1.01,cream);
 // Broad forked tail and translucent-looking sculpted fins.
 const tail=ellipsoid(-length-.33,.08,0,.46,.63,.09,finMat);tail.rotation.z=-.25;ellipsoid(-length-.38,-.27,0,.38,.42,.09,finMat).rotation.z=.45;
 const dorsal=ellipsoid(-.18,height*.86,0,.55,.28,.07,finMat);dorsal.rotation.z=.2;
 for(const sign of [-1,1]){const fin=ellipsoid(-.05,-.06,sign*width,.40,.12,ray?.8:.23,finMat);fin.rotation.y=sign*.5;fin.rotation.z=-.35;
  ellipsoid(length*.69,height*.20,sign*width*.77,.19,.22,.10,eyeWhite);ellipsoid(length*.72,height*.20,sign*(width*.77+.075),.105,.135,.052,black);ellipsoid(length*.68,height*.27,sign*(width*.77+.12),.032,.04,.021,eyeWhite);
 }
 ellipsoid(length*.98,-.12,0,.10,.07,.13,finMat);
 if(fish.id==='clown'||fish.id==='butterfly'||fish.form==='striped'){for(const x of [-.45,.25]){const band=new T.Mesh(new T.TorusGeometry(1,.095,8,40),cream);band.rotation.y=Math.PI/2;band.position.x=x;band.scale.set(width*.94,height*.94,.85);model.add(band);}}
 if(fish.form==='puffer'){for(let i=0;i<12;i++){const a=i*Math.PI/6;ellipsoid(Math.cos(a)*.8,Math.sin(a)*.8,.12,.08,.16,.08,finMat);}}if(fish.form==='spiny'){for(let i=0;i<7;i++){const fin=ellipsoid((i-3)*.2,height+.2,0,.06,.38,.06,finMat);fin.rotation.z=(i-3)*.18;}}if(fish.form==='seahorse'){const coil=new T.Mesh(new T.TorusGeometry(.27,.09,8,20,Math.PI*1.7),finMat);coil.position.set(-.25,-.9,0);model.add(coil);}if(fish.form==='angler'){ellipsoid(.5,.8,0,.035,.5,.035,finMat);ellipsoid(.55,1.25,0,.16,.16,.16,cream);}if(fish.id==='marlin'||fish.form==='horn')ellipsoid(length+.4,.03,0,.65,.045,.045,color);
 return {model,materials,tail};
}
