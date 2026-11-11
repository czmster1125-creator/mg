import * as T from 'three';
import {box,cyl,ball,group,roof} from './town-models.js';
export function addIslandLandmarks(parent,region,level=0){
 const root=group(parent,0,.64,0),moving=[];
 if(region===0){
  const palms=[[-4,1],[3,-2],[-2,-3],[4,2]];for(const[x,z]of palms){const g=group(root,x,0,z);cyl(g,.65,.5,0xd8c58d,0,-.35,0,.75,8);cyl(g,.10,1.5,0xaa8654,0,.75,0);for(let k=0;k<5;k++){const leaf=box(g,1,.06,.28,0x47975c,Math.sin(k*1.26)*.4,1.5,Math.cos(k*1.26)*.4);leaf.rotation.y=-k*1.26;leaf.rotation.z=.18;}moving.push({model:g,kind:'palm'});}
  const hill=group(root,-4.1,0,-2.7);cyl(hill,.9,1,0x9abf80,0,.2,0,.7,8);ball(hill,.6,0xaccd8c,0,.65,0);
  const falls=box(hill,.24,.8,.07,0x80d6df,.4,.45,.6);moving.push({model:falls,kind:'water'});
  if(level){const gazebo=group(root,0,0,-2.4);for(const x of [-.4,.4])for(const z of [-.4,.4])cyl(gazebo,.045,.9,0xf3d6a5,x,.45,z);roof(gazebo,1.2,1.2,1,0xcb8156,.4);cyl(gazebo,.8,.15,0xefcc8b,0,.05,0);if(level>1){for(let i=0;i<8;i++)ball(gazebo,.12,0xe9b66c,Math.sin(i)*.9,.2,Math.cos(i)*.9);}}
 }else{
  const quay=group(root,0,.12,5.7);box(quay,11,.18,1.4,0x9c7a56,0,0,0);for(let i=-5;i<=5;i++){box(quay,.04,.025,1.35,0x654d3c,i,.11,0);cyl(quay,.06,.65,0xb29362,i,.23,.55);}
  const boat=group(root,3,-.9,6.9);cyl(boat,.42,.3,0xdd9759,0,.12,0,.65,8);box(boat,.9,.3,.9,0xeac77e,0,.35,0);cyl(boat,.035,1.8,0x815f41,0,1,0);const sail=box(boat,.8,1,.035,0xe7f3da,.4,1.2,0);sail.rotation.y=.4;moving.push({model:boat,kind:'boat'});
  const crane=group(root,-3.5,.1,5.5);box(crane,.3,2,.3,0x3e737d,0,1,0);const beam=box(crane,2.1,.14,.18,0xd6ad5f,.6,2,0);beam.rotation.z=.1;box(crane,.035,1,.035,0x425b61,1.5,1.4,0);box(crane,.4,.35,.4,0xc59352,1.5,.7,0);
  for(let i=0;i<7;i++){const x=-4+i*1.2;box(root,.45,.5,.45,i%2?0xae7048:0xcba15b,x,.25,-2.6);}
  if(level){const tower=group(root,-4.8,0,-1.5);cyl(tower,.4,1.5+level*.4,0xe6e2ca,0,.8,0,.3,12);cyl(tower,.5,.18,0xd08151,0,1.5+level*.4,0);ball(tower,.2,0xf9df85,0,1.75+level*.4,0);}
 }
 return moving;
}
export function regionalFacade(parent,index,region,level){if(!region)return;box(parent,1.2,.13,.8,0x788c95,0,.07,.4);if(index===2){box(parent,.25,1.6,.25,0x576f79,-.6,.8,-.5);cyl(parent,.16,.35,0xb47e4a,-.6,1.7,-.5);}else if(index===1){for(const x of [-.55,.55])cyl(parent,.09,1,0xc5d5d0,x,.5,.6);}else{const awning=box(parent,1.2,.08,.6,index===3?0xe0a760:0x5095a2,0,.65,.8);awning.rotation.x=.15;box(parent,.8,.5,.3,0xc4935b,.5,.25,.9);}}
