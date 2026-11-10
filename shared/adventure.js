export const BANK_RATES=[0,12,32,72,152,312];
export const UPGRADE_COSTS=[0,80,200,480,1000];
export const BUILD_UNLOCK=[0,0,1,10,5];
export const ROLES=['经营','攻击','探索'];
export const GUIDES=[
 {name:'捕获第一条鱼',detail:'抛竿，获得金币和第一只鱼宠',target:'fish',event:'catch'},
 {name:'设置随行鱼宠',detail:'进入鱼缸，选择一只宠物随行',target:'book',event:'equip'},
 {name:'扩张第一块土地',detail:'点击海岛边缘的蓝色加号',target:'map',event:'expand'},
 {name:'完成一次 NPC 攻击',detail:'下一次抛竿将钓到挑战漂流瓶',target:'fish',event:'attack'},
 {name:'完成一次宝藏探索',detail:'下一次抛竿将钓到宝藏地图',target:'fish',event:'treasure'},
 {name:'培养一次鱼宠',detail:'用引导赠送的宠物粮提升等级',target:'book',event:'feed'},
 {name:'获得海岛护盾',detail:'下一次抛竿将钓到守护贝壳',target:'fish',event:'shield'},
 {name:'扩张到五块土地',detail:'解锁宠物小屋与第二个随行位置',target:'map',event:'expand5'}
];
export const points=s=>s.nodes[0].reduce((a,b)=>a+b,0);
export const slots=s=>points(s)>=10?3:points(s)>=5?2:1;
export const role=(id,fish)=>fish.findIndex(f=>f.id===id)%3;
export function bonuses(s,fish){const b={gold:0,attack:0,explore:0};for(const id of s.equipped||[]){const lv=s.pets?.[id]?.level||0;const r=role(id,fish);if(r===0)b.gold+=lv*.02;if(r===1)b.attack+=lv*12;if(r===2)b.explore+=lv*.03;}b.gold=Math.min(.3,b.gold);b.attack=Math.min(120,b.attack);b.explore=Math.min(.3,b.explore);return b;}
export function rates(s,base,fish){const b=bonuses(s,fish);return base.map((v,i)=>{const value=i===1?BANK_RATES[s.base[i]]:v.rate*s.base[i];return value*(i===1?1+b.gold:1)*(i&&s.damage?.[i]?.5:1);});}
