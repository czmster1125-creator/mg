export const SEA_PALETTES=[
 {name:'潮汐海湾',deep:'#159fae',shallow:'#66c7b9',sky:'#55bdc0',accent:'#f4db9c'},
 {name:'港湾雾光',deep:'#248da0',shallow:'#70b5af',sky:'#78aeb8',accent:'#e8bc85'},
 {name:'珊瑚花园',deep:'#368fa3',shallow:'#83c5c3',sky:'#79bdc6',accent:'#efa4c0'},
 {name:'黑沙暖流',deep:'#4c8190',shallow:'#9ab9a3',sky:'#b1aba0',accent:'#ef9d66'},
 {name:'极光冰海',deep:'#548ba9',shallow:'#a6d4d6',sky:'#8ab5cb',accent:'#d4e6f2'},
 {name:'星辉深渊',deep:'#59658f',shallow:'#8b9fbb',sky:'#7b8caf',accent:'#c5b3ef'}
];
// Before a real result arrives the animation can only cast and wait.
export function fishingBeat(elapsed,settledAt=null,reduced=false){
 if(settledAt===null)return {phase:elapsed<.55?'cast':'wait',progress:0,held:false};
 const t=Math.max(0,elapsed-settledAt),bite=reduced?.08:.3,reel=reduced?.12:.5;
 if(t<bite)return {phase:'hook',progress:0,held:false};
 return {phase:'reel',progress:Math.min(100,(t-bite)/reel*100),held:true};
}
