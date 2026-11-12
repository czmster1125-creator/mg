export const RIVALS=[
 {id:'grey-sail',name:'灰帆船长莫洛',island:'雾帆小岛',color:'#658da0',coat:0x567d99,theme:0},
 {id:'shell-trader',name:'贝壳商人米娅',island:'贝光港湾',color:'#dd9b83',coat:0xd98f75,theme:1},
 {id:'sea-breeze',name:'海风船长阿洛',island:'风铃海岸',color:'#71b5a0',coat:0x53a997,theme:2},
 {id:'starlight',name:'星湾舵手露娜',island:'月灯小岛',color:'#ad99c3',coat:0x9d7fb4,theme:3}
];
export function initRivals(s){
 s.rivalCursor??=0;s.rivalId??=RIVALS[0].id;
 s.rivals??=Object.fromEntries(RIVALS.map((r,i)=>[r.id,{vault:i?1800:s.rivalVault,defense:i?{shield:1,damage:[0,0,0]}:s.opponent}]));
 const active=s.rivals[s.rivalId];if(active){active.vault=s.rivalVault;active.defense=s.opponent;}
 if(s.event&&['raid','attack'].includes(s.event.type)&&!s.event.live&&!s.event.rival){s.event.rival=RIVALS.find(r=>r.id===s.rivalId)||RIVALS[0];s.event.targetName=s.event.rival.name;}
}
export function refillRivals(s){for(const r of Object.values(s.rivals))r.vault=Math.min(1800,r.vault+10);s.rivalVault=s.rivals[s.rivalId].vault;}
export function chooseRival(s){const tracked=s.rivalTrail?.follow&&s.rivalTrail.step===1?s.rivalTrail.rival:null;const rival=RIVALS.find(r=>r.id===tracked?.id)||RIVALS[s.rivalCursor%RIVALS.length],data=s.rivals[rival.id];s.rivalId=rival.id;s.rivalVault=data.vault;s.opponent=data.defense;return {rival,targetName:rival.name};}
export function finishRival(s,e){if(e.live)return;const data=s.rivals[e.rival?.id||s.rivalId];if(data){data.vault=s.rivalVault;data.defense=s.opponent;}s.rivalCursor++;}
