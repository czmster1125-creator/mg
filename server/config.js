import {EQUIPMENT} from '../shared/equipment.js';
import {HOME_BUILDINGS} from '../shared/home.js';
import {EXTRA_FISH,WORLD_REGIONS,WORLD_ZONES} from '../shared/content.js';
export const config = {
 version:'tidebloom-0.15.0', capacity:12, baitCap:50,
 fish:[
  {id:'clown',name:'小丑鱼',en:'Clownfish',rarity:0,color:'#ed8e55',base:42,min:350,max:950,zone:0},
  {id:'blue',name:'蓝倒吊',en:'Blue tang',rarity:0,color:'#4d99bd',base:48,min:500,max:1500,zone:0},
  {id:'sardine',name:'银色沙丁鱼',en:'Silver sardine',rarity:0,color:'#8abbb4',base:34,min:250,max:750,zone:0},
  {id:'butterfly',name:'珊瑚蝶鱼',en:'Butterflyfish',rarity:1,color:'#e9bc51',base:78,min:900,max:2400,zone:0},
  {id:'parrot',name:'翡翠鹦嘴鱼',en:'Parrotfish',rarity:1,color:'#53b99f',base:85,min:1100,max:3200,zone:0},
  {id:'angel',name:'皇家神仙鱼',en:'Queen angelfish',rarity:2,color:'#ac8cc4',base:165,min:1800,max:4300,zone:0},
  {id:'sunfish',name:'黄金翻车鱼',en:'Golden sunfish',rarity:3,color:'#e8ae45',base:320,min:4000,max:9000,zone:0},
  {id:'snapper',name:'红鳍笛鲷',en:'Red snapper',rarity:0,color:'#e6887b',base:65,min:850,max:2300,zone:1},
  {id:'grouper',name:'斑纹石斑',en:'Spotted grouper',rarity:1,color:'#96aa78',base:115,min:1900,max:4400,zone:1},
  {id:'tuna',name:'蓝鳍金枪鱼',en:'Bluefin tuna',rarity:2,color:'#618ec3',base:220,min:4000,max:11000,zone:1},
  {id:'manta',name:'月光蝠鲼',en:'Moonlight ray',rarity:2,color:'#a49dd2',base:265,min:5000,max:14000,zone:1},
  {id:'marlin',name:'星海旗鱼',en:'Starlight marlin',rarity:3,color:'#5bbdc0',base:460,min:9000,max:22000,zone:1},
  ...EXTRA_FISH
 ],
 rarities:['普通','优秀','稀有','史诗'],
 zones:WORLD_ZONES,
 regions:WORLD_REGIONS,
 buildCosts:[80,140,220,320,440],
 base:HOME_BUILDINGS,
 gear:EQUIPMENT,
 missions:[{name:'第一桶鱼',desc:'捕获 3 条鱼',event:'catch',target:3,coin:45,xp:30},{name:'渐入佳境',desc:'再捕获 5 条鱼',event:'catch',target:5,coin:70,xp:45},{name:'满载而归',desc:'再捕获并结算 3 条鱼',event:'sell',target:3,coin:100,bait:10},{name:'小岛的新模样',desc:'扩张 1 块海岛土地',event:'build',target:1,coin:60,xp:40},{name:'坐享海风',desc:'领取 1 次基地收益',event:'collect',target:1,supplies:2},{name:'梦想建筑师',desc:'再扩张 5 块海岛土地',event:'build',target:5,bait:20},{name:'驶向蔚蓝',desc:'前往珊瑚海岸',event:'zone',target:1,coin:200,xp:80}]
};
