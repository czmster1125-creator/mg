export const XP_RULES={catch:5,discovery:10,expand:15,building:10,gear:10,pet:5,attack:12,raid:12,treasure:12,encounter:8,order:10,chapter:25,weekly:20,collection:10,mastery:10,decorate:10};
export const CAPTAIN_TITLES=[{level:1,name:'见习船长'},{level:5,name:'海湾船长'},{level:10,name:'逐浪船长'},{level:20,name:'群岛领航员'},{level:35,name:'远洋领航员'},{level:50,name:'星海船长'}];
export const captainLevel=s=>1+Math.floor(s.xp/100);
export const captainTitle=s=>CAPTAIN_TITLES.filter(t=>t.level<=captainLevel(s)).at(-1);
export function captainReward(s){const through=s.captainClaimed??1,level=Math.min(50,captainLevel(s)),n=Math.max(0,level-through),milestones=Math.max(0,Math.floor(level/5)-Math.floor(through/5));return {through:level,count:n,coin:n*30,bait:n*3,food:milestones,supplies:milestones*2};}
export function activityXP(s,type,p,result){
 const simple={'expand':'expand','base/upgrade':'building','gear/upgrade':'gear','pet/feed':'pet','orders/claim':'order','journey/claim':'chapter','weekly/claim':'weekly','collection/claim':'collection','pet/mastery':'mastery','island/decorate':'decorate','event/encounter':'encounter'};
 if(type==='event/encounter'&&result.event)return 0;
 const key=simple[type]||(['attack','raid','treasure'].includes(result.type)&&!result.event?result.type:null),n=XP_RULES[key]||0;s.xp+=n;return n;
}
