export const ORDER_DEFS=[
 {id:'catch',name:'今日渔获',detail:'捕获 8 条鱼，速钓与手动均计入',target:8,reward:{coin:80,bait:8,food:2}},
 {id:'adventure',name:'海上见闻',detail:'完成 3 次攻击、偷袭、寻宝、奇遇、打捞护航、护盾或补给',target:3,reward:{coin:120,bait:6,supplies:2}},
 {id:'growth',name:'海岛日新',detail:'建设、培养、陪伴训练、栖地养护或举办灯会共 2 次',target:2,reward:{coin:90,bait:6,supplies:2}}
];
export const gameDay=now=>Math.floor((now+8*3600000)/86400000);
export function settleOrders(s,now){const day=gameDay(now);if(!s.orders||day>s.orders.day)s.orders={day,counts:{catch:0,adventure:0,growth:0},claimed:[]};}
export function progressOrder(s,key,n=1){const def=ORDER_DEFS.find(x=>x.id===key);s.orders.counts[key]=Math.min(def.target,(s.orders.counts[key]||0)+n);}
export function readyOrder(s){return ORDER_DEFS.some(d=>s.orders.counts[d.id]>=d.target&&!s.orders.claimed.includes(d.id));}
