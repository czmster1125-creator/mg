import * as T from 'three';
import {box,cyl,ball,group,roof} from './town-models.js';
export function addIslandLandmarks(parent,region,level=0){
 const root=group(parent,0,.64,0),moving=[];
 if(region>=2){
  if(region===2){for(let i=0;i<10;i++){const x=Math.sin(i*2.4)*4.7,z=Math.cos(i*2.4)*3;const g=group(root,x,0,z);cyl(g,.45,.3,0xe5ceab,0,-.2,0);for(let k=0;k<4;k++){const branch=cyl(g,.055,.7, i%2?0xe8a6a7:0xc693b3,(k-1.5)*.12,.3,0);branch.rotation.z=(k-1.5)*.25;}ball(g,.17,0xf0c5c7,0,.75,0);}if(level){const shell=group(root,-4.2,0,3);for(let i=0;i<7;i++){const rib=box(shell,.12,.8,.15,0xf8e4b5,(i-3)*.15,.4,0);rib.rotation.z=(i-3)*.18;}cyl(shell,.8,.15,0xcdaaa7,0,0,0);}}
  if(region===3){const volcano=group(root,-4.7,0,-3);cyl(volcano,1.4,2.3,0x69666a,0,.8,0,.55,9);cyl(volcano,.56,.08,0xe89649,0,1.98,0);for(let i=0;i<5;i++){const lava=box(volcano,.16,1.2,.05,0xe89851,(i-2)*.25,1,.55);lava.rotation.z=(i-2)*.2;}for(let i=0;i<6;i++)cyl(root,.22,.6+i%3*.25,0x5d5d68,Math.cos(i)*4.6,.2,Math.sin(i)*3);if(level){const beacon=group(root,4.6,0,2.4);cyl(beacon,.4,.5+level*.3,0x6b6566,0,.4,0);ball(beacon,.24,0xf0bf6d,0,.8+level*.25,0);}}
  if(region===4){for(let i=0;i<9;i++){const g=group(root,Math.sin(i*2.4)*4.8,0,Math.cos(i*2.4)*3);cyl(g,.06,.9,0x8a8171,0,.4,0);cyl(g,.4,.8,0x88a9ae,0,.9,0,0,6);cyl(g,.3,.6,0xd9e8e7,0,1.2,0,0,6);}if(level){const igloo=group(root,4.3,.1,3);ball(igloo,.85,0xd7e8e9,0,.35,0);box(igloo,.35,.45,.2,0x6b99af,0,.2,.8);}}
  if(region===5){for(let i=0;i<8;i++){const x=Math.cos(i*Math.PI/4)*4.7,z=Math.sin(i*Math.PI/4)*3.4;const column=group(root,x,0,z);cyl(column,.23,1.2+i%2*.3,0x9297b5,0,.65,0,.19,7);ball(column,.16,0xc8c6e8,0,1.35+i%2*.3,0);}if(level){const shrine=group(root,0,0,-3.8);cyl(shrine,.9,.18,0x9392b0,0,.1,0);for(const x of[-.5,.5])cyl(shrine,.12,1.3,0xb4b4c8,x,.7,0);box(shrine,1.5,.2,.4,0xc2bbd9,0,1.45,0);}}
  return moving;
 }
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
export function regionalFacade(parent,index,region,level){if(!region)return;if(region>=2){const colors=[0,0,0xdca0b3,0x8d7072,0xa7c8db,0xaba0c8];roof(parent,1.15,.9,1.6,colors[region],.35);cyl(parent,.08,.7,colors[region],.6,.4,.5);return;}box(parent,1.2,.13,.8,0x788c95,0,.07,.4);if(index===2){box(parent,.25,1.6,.25,0x576f79,-.6,.8,-.5);cyl(parent,.16,.35,0xb47e4a,-.6,1.7,-.5);}else if(index===1){for(const x of [-.55,.55])cyl(parent,.09,1,0xc5d5d0,x,.5,.6);}else{const awning=box(parent,1.2,.08,.6,index===3?0xe0a760:0x5095a2,0,.65,.8);awning.rotation.x=.15;box(parent,.8,.5,.3,0xc4935b,.5,.25,.9);}}
