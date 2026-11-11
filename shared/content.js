export const WORLD_REGIONS=[
 {name:'宁静海湾',en:'Serenity Bay',theme:'bay',nodes:['海湾小屋','滨海鱼市','木制码头','守望灯塔','港口仓库']},
 {name:'繁荣渔港',en:'Prosper Harbor',theme:'harbor',nodes:['海景餐厅','修船工坊','贸易商站','码头街区','海风商铺']},
 {name:'珊瑚花园',en:'Coral Gardens',theme:'coral',nodes:['珊瑚温室','贝壳工坊','海星广场','珍珠亭','礁石观景台']},
 {name:'熔岩群岛',en:'Ember Isles',theme:'volcano',nodes:['黑沙营地','熔岩工坊','地热码头','火山观测所','玄武岩仓库']},
 {name:'极光海岬',en:'Aurora Cape',theme:'ice',nodes:['雪松小屋','冰晶工坊','暖灯码头','极光灯塔','雪地补给站']},
 {name:'星辉遗迹',en:'Starlight Ruins',theme:'ruins',nodes:['遗迹营地','古碑工坊','星桥码头','星盘神殿','远航纪念馆']}
];
export const WORLD_ZONES=[
 {name:'宁静海湾',en:'SERENITY BAY',cost:0,region:0},
 {name:'珊瑚海岸',en:'CORAL COAST',cost:950,region:1},
 {name:'花园礁湖',en:'GARDEN LAGOON',cost:1500,region:2},
 {name:'黑沙暖流',en:'EMBER CURRENT',cost:2200,region:3},
 {name:'极光冰海',en:'AURORA SEA',cost:3000,region:4},
 {name:'星辉深渊',en:'STARLIGHT DEEP',cost:4000,region:5}
];
const make=(zone,id,name,en,rarity,color,base,min,max,form,skill)=>({zone,id,name,en,rarity,color,base,min,max,form,skill});
export const EXTRA_FISH=[
 make(2,'mandarin','锦绣麒麟鱼','Mandarinfish',0,'#e79e48',105,300,1100,'striped',{role:0,name:'礁湖账房',gold:.018,bank:.008}),
 make(2,'seahorse','珊瑚海马','Coral seahorse',0,'#e9b36e',110,120,650,'seahorse',{role:2,name:'海草向导',explore:.024,treasureFood:.08,hint:true}),
 make(2,'puffer','斑点河豚','Spotted puffer',1,'#c9b46b',165,900,2600,'puffer',{role:1,name:'棘刺护卫',attack:11,repair:.012}),
 make(2,'lionfish','赤羽狮子鱼','Red lionfish',1,'#d98266',180,1100,3100,'spiny',{role:3,name:'赤羽潜踪',steal:.025,cover:2.5}),
 make(2,'napoleon','拿破仑隆头鱼','Napoleon wrasse',2,'#4eacaa',310,7000,18000,'round',{role:1,name:'礁石重锤',attack:14,salvage:1}),
 make(2,'pearlray','珍珠鳐','Pearl ray',3,'#c9b5e4',580,9000,25000,'ray',{role:2,name:'珍珠罗盘',explore:.028,treasureFood:.12,hint:true}),
 make(3,'redmullet','火纹羊鱼','Ember mullet',0,'#db784c',145,1000,2900,'striped',{role:0,name:'暖流商旅',gold:.02,steal:.008}),
 make(3,'moray','玄岩海鳗','Basalt moray',0,'#766d85',155,1800,5100,'eel',{role:3,name:'岩缝潜行',steal:.022,cover:2.8}),
 make(3,'trigger','熔金扳机鱼','Gilded triggerfish',1,'#d5a752',225,1400,3900,'flat',{role:1,name:'熔金破盾',attack:12,salvage:2.5}),
 make(3,'scorpion','赤礁鲉','Red reef scorpionfish',1,'#b76f67',240,1800,4600,'spiny',{role:1,name:'礁岩守备',attack:11,repair:.018}),
 make(3,'amberjack','烈阳鰤','Sunlit amberjack',2,'#dcad69',400,6000,18000,'long',{role:0,name:'烈阳丰收',gold:.023,food:.08}),
 make(3,'fireoarfish','焰带皇带鱼','Ember oarfish',3,'#da8072',760,12000,36000,'eel',{role:3,name:'焰带快手',steal:.035,cover:1.5}),
 make(4,'cod','霜斑鳕鱼','Frost cod',0,'#a1b5c0',190,1500,4200,'long',{role:0,name:'霜湾经营',gold:.018,bank:.012}),
 make(4,'herring','极光鲱鱼','Aurora herring',0,'#88b7ca',200,500,1900,'long',{role:2,name:'冰海领航',explore:.026,treasureFood:.07,hint:true}),
 make(4,'iceflounder','冰晶比目鱼','Ice flounder',1,'#b7c4d7',285,1800,5400,'flat',{role:3,name:'冰底潜游',steal:.02,cover:3}),
 make(4,'wolffish','雪岭狼鱼','Snowridge wolffish',1,'#8da0b1',310,3500,9000,'eel',{role:1,name:'雪岭卫士',attack:13,repair:.008}),
 make(4,'salmon','银冠鲑鱼','Silver crown salmon',2,'#da9eaf',510,5000,14000,'long',{role:0,name:'银冠补给',gold:.021,food:.12}),
 make(4,'narwhal','月牙独角鲸','Mooncrest narwhal',3,'#b4ccdf',940,20000,55000,'horn',{role:1,name:'月牙冲锋',attack:15,salvage:1.5}),
 make(5,'lantern','星灯鱼','Starlight lanternfish',0,'#6d93bd',250,400,1600,'round',{role:2,name:'星灯探路',explore:.025,treasureFood:.1,hint:true}),
 make(5,'glassfish','琉光鱼','Prism glassfish',0,'#a1c9ce',260,300,1300,'flat',{role:0,name:'琉光聚财',gold:.019,bank:.01}),
 make(5,'angler','深海鮟鱇','Deepwater angler',1,'#817ca9',375,2500,7500,'angler',{role:3,name:'暗灯诱敌',steal:.028,cover:2}),
 make(5,'coelacanth','古纹腔棘鱼','Runic coelacanth',1,'#729697',400,8000,22000,'spiny',{role:1,name:'古纹守护',attack:12,repair:.015}),
 make(5,'moonmola','月轮翻车鱼','Moonwheel mola',2,'#b8aacd',650,18000,46000,'round',{role:0,name:'月轮丰饶',gold:.024,food:.1}),
 make(5,'celestialray','星环蝠鲼','Celestial ray',3,'#9f96d2',1200,24000,65000,'ray',{role:3,name:'星环秘航',steal:.033,cover:1.8})
];
export const regionCount=s=>s.nodes.length;
export const landCount=(s,r)=>s.nodes[r]?.reduce((a,b)=>a+b,0)||0;
export const regionOpen=(s,r)=>Number.isInteger(r)&&r>=0&&r<WORLD_REGIONS.length&&(r===0||landCount(s,r-1)>=25);
export const zoneOpen=(s,z)=>z<2||regionOpen(s,WORLD_ZONES[z]?.region);
export const COLLECTION_KEYS=[1,3,6,12,18,24,30,36,...WORLD_ZONES.map((_,i)=>'sea'+i)];
export const FISH_ZONE={...Object.fromEntries(['clown','blue','sardine','butterfly','parrot','angel','sunfish'].map(id=>[id,0])),...Object.fromEntries(['snapper','grouper','tuna','manta','marlin'].map(id=>[id,1])),...Object.fromEntries(EXTRA_FISH.map(f=>[f.id,f.zone]))};
