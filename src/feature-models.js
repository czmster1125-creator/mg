import * as T from 'three';
import {box,cyl,ball,group,shape} from './town-models.js';
const cream=0xf5dfb1,wood=0xa57b4e,teal=0x64a99b;
export function createFeatureModel(region){
 const root=new T.Group();root.userData.feature=['telescope','crane','research','buoy','lighthouse','star-shrine'][region];
 cyl(root,.68,.16,cream,0,.08,0);
 if(region===0){for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const leg=cyl(root,.045,.8,wood,Math.cos(a)*.24,.48,Math.sin(a)*.24);leg.rotation.z=Math.sin(a)*.27;}const tube=cyl(root,.17,1.05,teal,.05,1.05,0);tube.rotation.z=-Math.PI/3;const lens=ball(root,.19,0xb7e0d2,.5,1.3,0);lens.scale.set(.25,1,1);cyl(root,.23,.12,cream,.05,.88,0);}
 if(region===1){for(let i=0;i<6;i++)box(root,1.3,.09,.18,wood,0,.2,(i-2.5)*.2);box(root,.14,1.5,.14,teal,-.45,.97,0);box(root,1.15,.14,.16,teal,0,1.65,0);cyl(root,.025,.8,wood,.48,1.18,0);box(root,.48,.34,.42,0xdbb574,.45,.64,0);for(const x of [.3,.6])box(root,.045,.36,.45,0x8b7b64,x,.65,0);}
 if(region===2){cyl(root,.55,.14,0x83c0b5,0,.22,0);for(let i=0;i<5;i++){const branch=cyl(root,.055,.7+i%2*.15,0xd999ac,(i-2)*.17,.6,0);branch.rotation.z=(i-2)*.2;}ball(root,.3,0xa8d7d0,0,1.05,0);shape(root,new T.TorusGeometry(.36,.035,6,20),cream,0,1.05,0);box(root,.5,.1,.4,wood,.48,.38,.3);}
 if(region===3){cyl(root,.55,.25,0xde9568,0,.35,0);cyl(root,.22,.95,0x7c8e8d,0,.95,0);cyl(root,.35,.14,cream,0,1.05,0);ball(root,.2,0xf1b85e,0,1.55,0);for(const x of [-.42,.42]){box(root,.12,.65,.12,0xc69b72,x,.65,0);box(root,.38,.12,.12,0xc69b72,x,.98,0);}shape(root,new T.TorusGeometry(.46,.05,6,20),0xe9c585,0,.38,0).rotation.x=Math.PI/2;}
 if(region===4){cyl(root,.35,1.6,cream,0,.95,0,.24,10);for(const y of [.55,1.05])cyl(root,.35-(y-.15)*.06,.2,0xd89980,0,y,0);cyl(root,.4,.1,cream,0,1.8,0);ball(root,.22,0xffd67b,0,2.04,0);shape(root,new T.ConeGeometry(.48,.38,10),teal,0,2.35,0);}
 if(region===5){for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(root,.065,.7,0xa39dc1,Math.cos(a)*.48,.55,Math.sin(a)*.48);}cyl(root,.55,.14,0x8e8ba9,0,.25,0);const star=shape(root,new T.OctahedronGeometry(.38),0xd2c2e8,0,1.25,0);star.userData.motion='spin';shape(root,new T.TorusGeometry(.56,.035,6,24),0xe6d5a7,0,1.25,0);}
 return root;
}
