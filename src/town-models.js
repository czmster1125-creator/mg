import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const MAP_STAGES=['待建空地','主体落成','门廊扩建','二层加盖','庭院完善','地标竣工'];
export const BASE_STAGES=['','基础营业','门前扩建','二层营业','专属设施','旗舰基地'];
export function landmarkStages(index,region=0){
 const kind=region===0?['home','market','dock','light','store'][index]:['market','workshop','bank','home','pet'][index];
 const stages={home:['主体落成','门廊扩建','二层加盖','侧翼庭院','旗帜花园'],store:['仓库落成','装卸门廊','二层仓储','侧翼仓房','港口地标'],market:['鱼摊开业','门廊货箱','二层营业','侧翼货场','市集花园'],dock:['木栈桥落成','码头棚屋','装卸吊机','码头货场','帆旗与泊船'],light:['灯塔点亮','观景围栏','塔楼附屋','滨海庭院','守望旗帜'],workshop:['工坊营业','工坊门廊','二层车间','锻造工作台','工坊花园'],bank:['银行开业','入口台阶','二层营业','侧翼金库','银行花园'],pet:['乐园开门','小屋与门廊','二层小屋','活动拱门','乐园花园']};
 return ['待建空地',...stages[kind]];
}
const materials=new Map();
export const colors={cream:0xffefbf,wood:0x92542e,trim:0xffce62,teal:0x148f84,red:0xe86f47,purple:0x885bb5,green:0x64ac47,dark:0x244f58};
export function material(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return materials.get(c);}
export function shape(parent,geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
export const box=(p,w,h,d,c,x=0,y=0,z=0)=>shape(p,new T.BoxGeometry(w,h,d),c,x,y,z);
export const ball=(p,r,c,x=0,y=0,z=0)=>shape(p,new T.IcosahedronGeometry(r,1),c,x,y,z);
export const cyl=(p,r,h,c,x=0,y=0,z=0,rt=r,n=12)=>shape(p,new T.CylinderGeometry(rt,r,h,n),c,x,y,z);
export function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
export function roof(p,w,d,y,c,h=.95){
 const profile=new T.Shape();profile.moveTo(-w/2,0);profile.lineTo(-w*.43,.12);profile.lineTo(0,h);profile.lineTo(w*.43,.12);profile.lineTo(w/2,0);profile.lineTo(w/2,-.14);profile.lineTo(-w/2,-.14);profile.closePath();
 const geo=new T.ExtrudeGeometry(profile,{depth:d,bevelEnabled:false,steps:1});geo.translate(0,0,-d/2);shape(p,geo,c,0,y,0);
 box(p,w+.1,.12,.15,colors.trim,0,y-.08,d/2+.02);box(p,.12,.12,d+.12,colors.trim,0,y+h,0);
 for(let k=1;k<4;k++){for(const s of [-1,1]){const beam=box(p,w*.24,.035,d+.03,c, s*w*k/8,y+h*(1-k/4),0);beam.rotation.z=-s*Math.atan2(h,w/2);}}
}
function window(p,x,y,z,w=.48,h=.6){box(p,w+.16,h+.15,.12,colors.trim,x,y,z);box(p,w,h,.14,0x306b79,x,y,z+.02);box(p,.05,h,.05,0xb5ecdc,x,y,z+.105);box(p,w,.05,.05,0xb5ecdc,x,y,z+.105);box(p,w+.25,.1,.25,colors.cream,x,y-h/2,z+.08);}
function door(p,x=0,y=0,z=1){box(p,.68,1.08,.17,colors.wood,x,y+.55,z);box(p,.48,.83,.2,0x367b7e,x,y+.5,z+.02);ball(p,.055,colors.trim,x+.14,y+.45,z+.14);box(p,.85,.15,.55,colors.cream,x,y+.05,z+.18);}
function flag(p,x,y,z,c=0xe9704d){cyl(p,.035,1.3,colors.trim,x,y+.65,z);box(p,.65,.4,.06,c,x+.3,y+1,z);ball(p,.08,colors.trim,x,y+1.34,z);}
function planter(p,x,z){box(p,.55,.35,.48,colors.wood,x,.2,z);ball(p,.36,0x4e9d41,x,.58,z);for(let k=0;k<3;k++)ball(p,.11,k%2?0xf8d354:0xed8493,x+(k-1)*.16,.8,z);}
function crates(p,x,z){box(p,.62,.6,.6,0xc29146,x,.3,z);for(const s of [-1,1])box(p,.08,.65,.65,colors.trim,x+s*.23,.31,z);box(p,.65,.08,.65,colors.wood,x,.32,z);}
function fence(p,x,z,w=2.8){for(let k=0;k<5;k++)box(p,.12,.55,.12,colors.cream,x-w/2+k*w/4,.28,z);box(p,w,.09,.1,colors.cream,x,.22,z);box(p,w,.09,.1,colors.cream,x,.44,z);}
function coin(p,x,y,z,s=1){const c=cyl(p,.28*s,.1*s,0xf7ba32,x,y,z);c.rotation.x=Math.PI/2;const center=cyl(p,.19*s,.12*s,0xffd86b,x,y,z+.02);center.rotation.x=Math.PI/2;box(p,.06*s,.23*s,.04,0xe4a534,x,y,z+.1);}
function sign(p,kind,y,z=1.3){box(p,1.15,.62,.16,colors.wood,0,y,z);box(p,1.02,.49,.19,colors.trim,0,y,z+.02);
 if(kind===1)coin(p,0,y,z+.18,.65);else if(kind===2){const head=box(p,.52,.18,.1,0x537c80,0,y+.08,z+.19);head.rotation.z=-.35;const h=box(p,.09,.4,.08,colors.wood,-.1,y-.06,z+.18);h.rotation.z=-.35;}else if(kind===4){ball(p,.14,0x9a5e55,0,y-.07,z+.17);for(let k=0;k<3;k++)ball(p,.07,0x9a5e55,(k-1)*.16,y+.11,z+.17);}else{const fish=ball(p,.16,0x248e99,0,y,z+.17);fish.scale.set(1.6,.7,.4);shape(p,new T.ConeGeometry(.13,.24,3),0x248e99,.31,y,z+.17).rotation.z=Math.PI/2;}}
function cottage(p,level,kind=0){
 const h=level>=3?2.35:1.45,c=[0xf9cf81,0xf4cb88,0xdca466,0xf4cf86,0xeebbc0][kind],r=[0xd96344,0xe69b35,0x168c83,0x517dba,0xc35c88][kind];
 box(p,2.45,.2,2.1,0xcda565,0,.1,0);box(p,2.15,h,1.85,c,0,h/2+.2,0);for(const x of [-1.03,1.03])box(p,.16,h,.15,colors.wood,x,h/2+.2,.94);
 door(p,-.35,.2,.99);window(p,.6,1.05,1.01,.43,.55);if(level>=3){window(p,-.55,2.05,1.01);window(p,.55,2.05,1.01);box(p,2.2,.14,1.95,colors.cream,0,1.6,0);}
 roof(p,2.7,2.35,h+.25,r);if(level>=2){box(p,2.6,.15,.9,colors.wood,0,.15,1.25);for(const x of [-1.15,1.15])cyl(p,.065,1.2,colors.cream,x,.75,1.5);box(p,2.7,.15,.85,r,0,1.35,1.33);}
 if(level>=4){const wing=group(p,1.52,0,-.2);box(wing,1.05,1.45,1.8,c,0,.9,0);roof(wing,1.35,2,1.65,r,.6);window(wing,0,.9,.94);planter(p,-1.45,1.3);fence(p,0,2,2.8);}
 if(level>=5){flag(p,-.7,h+1.2,-.3);planter(p,1.6,1.4);box(p,.46,.7,.45,colors.wood,-.7,h+.65,-.5);}
 return h+1.5;
}
function market(p,level){const h=cottage(p,level,1);for(let j=0;j<7;j++){const a=box(p,.42,.14,1.35,j%2?0xfff0c4:0xee7355,-1.26+j*.42,1.75,1.35);a.rotation.x=.12;}for(const x of [-1.35,1.35])cyl(p,.06,1.7,colors.wood,x,.85,1.9);box(p,2.3,.6,.6,colors.wood,0,.45,1.65);for(let k=0;k<9;k++)ball(p,.12,k%2?0xef9e41:0x88b847,(k%5-2)*.35,.85,1.7+Math.floor(k/5)*.2);if(level>=2)crates(p,-1.55,.2);if(level>=4)crates(p,2.1,1.35);return h;}
function lighthouse(p,level){
 const h=1.8+level*.58;const t=cyl(p,1.03,h,0xffefcf,0,h/2,0,.63,16);for(let i=1;i<=level;i+=2)cyl(p,1.03-(i*.58/h)*.4,.23,0xeb7753,0,i*.58,0,1.03-(i*.58/h)*.4,16);
 cyl(p,.95,.18,colors.wood,0,h,0);cyl(p,.62,.65,0x8bc6bf,0,h+.4,0);for(let j=0;j<6;j++){const a=j*Math.PI/3;cyl(p,.045,.75,colors.cream,Math.cos(a)*.66,h+.43,Math.sin(a)*.66);}shape(p,new T.ConeGeometry(.95,.8,8),0xe76948,0,h+1.13,0);ball(p,.12,colors.trim,0,h+1.57,0);door(p,0,0,1);if(level>=2){cyl(p,1.24,.14,colors.cream,0,h-.12,0);for(let j=0;j<10;j++){const a=j*Math.PI/5;cyl(p,.035,.42,colors.wood,Math.cos(a)*1.15,h+.12,Math.sin(a)*1.15);}}if(level>=3){const g=group(p,-1.25,0,.1);box(g,1.1,1.1,1.4,colors.cream,0,.55,0);roof(g,1.4,1.7,1.2,colors.teal,.5);}if(level>=4){fence(p,0,1.65,3.1);planter(p,-1.6,1.2);}if(level>=5)flag(p,1.2,1.5,0);return h+1.6;
}
function dock(p,level){for(let j=0;j<9+level;j++)box(p,2.7,.15,.28,0xb78042,0,.18,(j-4)*.3);for(const x of [-1.4,1.4])for(const z of [-1.2,1.1]){cyl(p,.12,1.1,colors.wood,x,.45,z);cyl(p,.17,.09,colors.trim,x,1,z);}if(level>=2){const shed=group(p,-.3,.25,-.8);box(shed,1.7,1.25,1.1,0x37a09a,0,.62,0);roof(shed,2,1.4,1.3,colors.red,.65);door(shed,0,0,.59);}if(level>=3){const crane=group(p,1,0,-.8);box(crane,.2,2.8,.2,colors.trim,0,1.4,0);box(crane,1.4,.18,.18,colors.trim,-.6,2.7,0);cyl(crane,.018,1.7,colors.wood,-1.2,1.85,0);}if(level>=4){crates(p,-.7,1);crates(p,.2,1.1);}if(level>=5){flag(p,-1.3,1,-1.1);const b=ball(p,.7,colors.cream,1.9,.2,.3);b.scale.set(.6,.4,1.8);}return level>=3?3.1:2.3;}
function headquarters(p,level){const h=cottage(p,level,0);p.children.filter(o=>o.material===material(0xd96344)).forEach(o=>o.material=material(colors.purple));
 const tower=group(p,-1.05,0,-.35);box(tower,1.25,2.6+level*.16,1.35,0xe5af5d,0,1.3+level*.08,0);roof(tower,1.6,1.7,2.7+level*.16,colors.purple,1.05);window(tower,0,2.3, .72);flag(p,-1.05,3.9+level*.16,-.35);sign(p,0,1.65);if(level>=4){const t=group(p,1.45,0,-.4);cyl(t,.5,3.4,colors.cream,0,1.7,0);shape(t,new T.ConeGeometry(.7,1.15,8),colors.purple,0,3.95,0);}return Math.max(h,5+level*.16);}
function bank(p,level){
 const h=level>=3?2.6:1.8;box(p,2.9,.25,2.55,0xb9b19a,0,.13,0);box(p,2.5,h,2.1,0xf1d49a,0,h/2+.25,0);door(p,0,.2,1.09);for(const x of [-1,-.55,.55,1]){cyl(p,.13,1.65,colors.cream,x,1.12,1.22);box(p,.35,.16,.35,colors.trim,x,.35,1.22);box(p,.35,.16,.35,colors.trim,x,1.9,1.22);}roof(p,3.1,2.65,h+.3,0x499d91,.9);coin(p,0,h+.55,1.36,1.1);if(level>=2){for(let j=0;j<3;j++)box(p,3-j*.15,.13,.3,colors.cream,0,.1+j*.12,1.5-j*.17);crates(p,-1.6,.3);}if(level>=3){window(p,-.65,2.4,1.08,.4,.45);window(p,.65,2.4,1.08,.4,.45);}if(level>=4){const vault=group(p,1.65,0,-.15);box(vault,1.05,1.45,1.7,0x9bb6b1,0,.75,0);const v=cyl(vault,.45,.14,colors.wood,0,.8,.94);v.rotation.x=Math.PI/2;coin(vault,0,.8,1.04,.7);}if(level>=5){flag(p,0,h+1.2,0);planter(p,-1.5,1.6);planter(p,1.5,1.6);}return h+2.5;
}
function workshop(p,level){const h=cottage(p,level,2);box(p,.65,2.6+level*.13,.65,0xb1714c,-.75,1.3+level*.065,-.55);cyl(p,.46,.16,colors.cream,-.75,2.6+level*.13,-.55);sign(p,2,1.45);const wheel=group(p,1.35,.9,.2);wheel.userData.animate='wheel';const tor=shape(wheel,new T.TorusGeometry(.8,.14,6,14),colors.wood);tor.rotation.y=Math.PI/2;for(let j=0;j<8;j++){const blade=box(wheel,.6,.13,1.65,0xad753c);blade.rotation.x=j*Math.PI/4;}if(level>=2)crates(p,-1.5,1);if(level>=4){box(p,1.1,.5,.7,0x5b777a,-1.5,.3,1.5);box(p,1.4,.2,.9,0x7f9691,-1.5,.65,1.5);}return h;}
function petPark(p,level){const h=cottage(p,level,4);sign(p,4,1.4);fence(p,0,2.2,3.5);for(const x of [-1.75,1.75]){const f=group(p,x,0,1.3);f.rotation.y=Math.PI/2;fence(f,0,0,1.7);}const bed=cyl(p,.48,.15,0xf3bb64,-1.55,.12,.5);if(level>=2){const g=group(p,1.6,0,.3);box(g,.85,.7,.9,0xedbc7e,0,.35,0);roof(g,1.1,1.2,.8,0xd76c9c,.55);box(g,.35,.48,.05,colors.wood,0,.25,.47);}if(level>=4){const arch=shape(p,new T.TorusGeometry(.7,.12,6,16,Math.PI),0x47a6a0,-1.6,.75,1.2);arch.rotation.z=0;}
 return h;
}
export function createLandmark(index,level,region=0){const p=new T.Group();p.userData={index,level,region,kind:'landmark'};
 if(level===0){box(p,3.1,.12,2.6,0xc9b881,0,.06,0);box(p,2.6,.03,2.1,0x86ae9a,0,.14,0);for(const x of [-1.5,1.5])for(const z of [-1.2,1.2]){box(p,.12,.55,.12,colors.wood,x,.3,z);box(p,.28,.1,.28,colors.trim,x,.6,z);}for(let j=0;j<3;j++)box(p,1.35,.1,.15,colors.cream,-.4,.2+j*.1,.3);p.userData.height=.8;
 }else{const type=region===0?['house','market','dock','light','store'][index]:['market','workshop','bank','house','pet'][index];p.userData.height=type==='market'?market(p,level):type==='dock'?dock(p,level):type==='light'?lighthouse(p,level):type==='workshop'?workshop(p,level):type==='bank'?bank(p,level):type==='pet'?petPark(p,level):cottage(p,level,type==='store'?2:0);}
 return p;
}
export function createBaseBuilding(index,level){const p=new T.Group();p.userData={index,level,kind:'base'};p.userData.height=[headquarters,bank,workshop,market,petPark][index](p,level);return p;}
// Merge static parts within one replaceable model. Moving wheels remain separate.
export function mergeStatic(root){
 root.updateMatrixWorld(true);const buckets=new Map(),inverse=new T.Matrix4().copy(root.matrixWorld).invert();
 root.traverse(o=>{if(!o.isMesh)return;let parent=o;while(parent&&parent!==root){if(parent.userData.animate)return;parent=parent.parent;}let geo=o.geometry.clone();if(geo.index){const flat=geo.toNonIndexed();geo.dispose();geo=flat;}geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));const list=buckets.get(o.material)||[];list.push({geo,source:o});buckets.set(o.material,list);});
 for(const [mat,entries]of buckets){const merged=mergeGeometries(entries.map(e=>e.geo),false);if(merged){for(const {source}of entries){source.removeFromParent();source.geometry.dispose();}const m=new T.Mesh(merged,mat);m.castShadow=m.receiveShadow=true;root.add(m);}for(const {geo}of entries)geo.dispose();}
}
export function disposeModel(root){root.traverse(o=>o.geometry?.dispose());root.removeFromParent();}
