export const CHAPTERS=[
 {name:'海湾启航',detail:'建立能够自给自足的第一座小岛',goals:[['catch',12,'累计捕获 12 条鱼'],['land0',5,'海湾扩张至 5 块'],['petLevel',2,'培养任意鱼宠至 2 级']],reward:{coin:120,bait:8,food:5}},
 {name:'潮汐的秘密',detail:'用不同方式获得建设资源',goals:[['attack',2,'完成 2 次攻击'],['raid',2,'完成 2 次偷袭'],['treasure',2,'完成 2 次寻宝']],reward:{coin:180,bait:8,materials:3}},
 {name:'港口来信',detail:'建设码头，为新的海岸作准备',goals:[['land0',15,'海湾扩张至 15 块'],['species',5,'发现 5 种鱼宠'],['bank',3,'银行升至 3 级']],reward:{coin:240,bait:10,parts:6}},
 {name:'繁荣渔港',detail:'进入不同地形的港口街区',goals:[['land0',25,'完成海湾扩张'],['land1',10,'渔港扩张至 10 块'],['petLevel',5,'任意鱼宠达到 5 级']],reward:{coin:320,bait:10,food:12}},
 {name:'两座岛的故事',detail:'完善长线成长，收集跨海域伙伴',goals:[['land1',25,'完成渔港扩张'],['species',9,'发现 9 种鱼宠'],['zone',1,'开放珊瑚海岸']],reward:{coin:500,bait:15,materials:8}}
];
export function initJourney(s){s.journey||={chapter:0,counts:{attack:0,raid:0,treasure:0}};s.mastery||={};s.relics??=0;s.rescueAt??=0;s.economy||={earned:0,spent:0,casts:0};}
export function journeyValues(s){return {...s.journey.counts,catch:s.catchCount,land0:s.nodes[0].reduce((a,b)=>a+b,0),land1:s.nodes[1].reduce((a,b)=>a+b,0),species:Object.keys(s.book).length,petLevel:Math.max(0,...Object.values(s.pets).map(p=>p.level)),bank:s.base[1],zone:s.unlocked.includes(1)?1:0};}
export function chapterReady(s){const c=CHAPTERS[s.journey.chapter],v=journeyValues(s);return !!c&&c.goals.every(([key,n])=>(v[key]||0)>=n);}
export function recordJourney(s,result){if(['attack','raid','treasure'].includes(result.type)&&!result.event)s.journey.counts[result.type]++;}
export const MASTERY={economy:{name:'精打细算',detail:'本宠物全部数值效果提高 15%'},guard:{name:'稳健伙伴',detail:'本宠物全部数值效果提高 10%，附加 3 点隐蔽'}};
