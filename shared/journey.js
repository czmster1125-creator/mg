import {FISH_ZONE,WORLD_REGIONS} from './content.js';
export const CHAPTERS=[
 {name:'海湾启航',detail:'建立能够自给自足的第一座小岛',goals:[['catch',12,'累计捕获 12 条鱼'],['land0',5,'海湾扩张至 5 块'],['petLevel',2,'培养任意鱼宠至 2 级']],reward:{coin:120,bait:8,food:5}},
 {name:'潮汐的秘密',detail:'用不同方式获得建设资源',goals:[['attack',2,'完成 2 次攻击'],['raid',2,'完成 2 次偷袭'],['treasure',2,'完成 2 次寻宝']],reward:{coin:180,bait:8,supplies:3}},
 {name:'港口来信',detail:'建设码头，为新的海岸作准备',goals:[['land0',15,'海湾扩张至 15 块'],['species',5,'发现 5 种鱼宠'],['bank',3,'小铺升至 3 级']],reward:{coin:240,bait:10,supplies:6}},
 {name:'繁荣渔港',detail:'进入不同地形的港口街区',goals:[['land0',25,'完成海湾扩张'],['land1',10,'渔港扩张至 10 块'],['petLevel',5,'任意鱼宠达到 5 级']],reward:{coin:320,bait:10,food:12}},
 {name:'两座岛的故事',detail:'完善长线成长，收集跨海域伙伴',goals:[['land1',25,'完成渔港扩张'],['species',9,'发现 9 种鱼宠'],['zone',1,'开放珊瑚海岸']],reward:{coin:500,bait:15,supplies:8}},
 {name:'花园航线',detail:'接到珊瑚研究员的邀请，前往花园礁湖',goals:[['land2',5,'花园扩张 5 块'],['seaSpecies2',2,'发现 2 种礁湖鱼'],['petLevel',5,'任意鱼宠 5 级']],reward:{coin:650,bait:12,food:10}},
 {name:'礁湖守望',detail:'建立珊瑚观测站，留下第一处花园地标',goals:[['land2',25,'完成花园建设'],['seaSpecies2',4,'发现 4 种礁湖鱼'],['decor2',1,'布置花园地标']],reward:{coin:800,bait:12,supplies:8}},
 {name:'黑沙来客',detail:'寻找黑沙暖流中的新伙伴',goals:[['land3',5,'熔岩岛扩张 5 块'],['seaSpecies3',2,'发现 2 种暖流鱼'],['mastery',2,'为 2 只鱼宠选择专精']],reward:{coin:950,bait:12,supplies:10}},
 {name:'地热远航',detail:'用探索所得建立火山观测所',goals:[['land3',15,'熔岩岛扩张 15 块'],['treasure',10,'累计完成 10 次寻宝'],['seaSpecies3',4,'发现 4 种暖流鱼']],reward:{coin:1100,bait:15,supplies:10}},
 {name:'火山的回声',detail:'完成黑沙海岸，准备更冷的航程',goals:[['land3',25,'完成熔岩岛建设'],['decor3',2,'熔岩岛地标 2 级'],['petLevel',7,'任意鱼宠 7 级']],reward:{coin:1250,bait:15,food:18}},
 {name:'极光来信',detail:'跟随极光进入新的捕获海域',goals:[['land4',5,'海岬扩张 5 块'],['seaSpecies4',2,'发现 2 种冰海鱼'],['species',20,'发现 20 种鱼宠']],reward:{coin:1400,bait:15,supplies:12}},
 {name:'冰海灯火',detail:'为冰海伙伴建起有暖灯的港湾',goals:[['land4',25,'完成极光海岬'],['seaSpecies4',4,'发现 4 种冰海鱼'],['decor4',2,'海岬地标 2 级']],reward:{coin:1600,bait:15,supplies:12}},
 {name:'星桥初现',detail:'把五座岛的经历带到星辉遗迹',goals:[['land5',5,'遗迹扩张 5 块'],['seaSpecies5',2,'发现 2 种深渊鱼'],['mastery',4,'培养 4 只专精鱼宠']],reward:{coin:1800,bait:18,food:20}},
 {name:'古碑的答案',detail:'收集深海鱼种并恢复星盘',goals:[['land5',15,'遗迹扩张 15 块'],['seaSpecies5',4,'发现 4 种深渊鱼'],['decor5',2,'遗迹地标 2 级']],reward:{coin:2000,bait:18,supplies:15}},
 {name:'远航纪念馆',detail:'完成六岛主线，继续参与每周航海委托',goals:[['land5',25,'完成星辉遗迹'],['species',30,'发现 30 种鱼宠'],['petLevel',10,'培养一只 10 级伙伴']],reward:{coin:2400,bait:20,food:25}}
];
export function initJourney(s){s.journey||={chapter:0,counts:{attack:0,raid:0,treasure:0}};s.mastery||={};s.relics??=0;s.rescueAt??=0;s.economy||={earned:0,spent:0,casts:0};}
export function journeyValues(s){const v={...s.journey.counts,catch:s.catchCount,species:Object.keys(s.book).length,petLevel:Math.max(0,...Object.values(s.pets).map(p=>p.level)),bank:s.base[1],zone:s.unlocked.includes(1)?1:0,mastery:Object.keys(s.mastery).length};WORLD_REGIONS.forEach((_,i)=>{v['land'+i]=s.nodes[i]?.reduce((a,b)=>a+b,0)||0;v['decor'+i]=s.decor?.[i]||0;v['seaSpecies'+i]=Object.keys(s.book).filter(id=>FISH_ZONE[id]===i).length;});return v;}
export function chapterReady(s){const c=CHAPTERS[s.journey.chapter],v=journeyValues(s);return !!c&&c.goals.every(([key,n])=>(v[key]||0)>=n);}
export function recordJourney(s,result){if(['attack','raid','treasure'].includes(result.type)&&!result.event)s.journey.counts[result.type]++;}
export const MASTERY={economy:{name:'精打细算',detail:'本宠物全部数值效果提高 15%'},guard:{name:'稳健伙伴',detail:'本宠物全部数值效果提高 10%，附加 3 点隐蔽'}};
