export const ENCOUNTERS={
 wreck:{name:'遇见沉船遗迹',icon:'anchor',detail:'沉船里留下了可用的建设物资，也有等待救援的海洋伙伴。',coin:40,loot:{supplies:8},food:2,bait:8,relics:1},
 turtle:{name:'海龟的求救信号',icon:'fish',detail:'选择修复漂流装备，或给受困的海龟补充食物。',coin:40,loot:{supplies:8},food:2,bait:8,relics:1},
 coral:{name:'珊瑚研究站来信',icon:'fish',detail:'研究员需要珊瑚养护补给，修缮观测站也能获得材料和鱼宠粮。',coin:60,loot:{supplies:3,food:6},food:3,bait:10,relics:1},
 thermal:{name:'暖流观测浮标',icon:'anchor',detail:'火山浮标带来了稀有海岛物资。也可以投放补给，帮助暖流中的伙伴。',coin:90,loot:{supplies:10},food:4,bait:12,relics:2},
 ice:{name:'冰海救援队',icon:'anchor',detail:'冰面浮标需要修复，雪岬救援队也在募集伙伴补给。',coin:120,loot:{supplies:11},food:4,bait:14,relics:2},
 ruins:{name:'星盘遗迹的回声',icon:'gem',detail:'研究古老星盘获得修复资源，或帮助深海伙伴找到安全航线。',coin:160,loot:{supplies:16},food:5,bait:16,relics:3}
};
export const ENCOUNTER_BY_ZONE=['wreck','turtle','coral','thermal','ice','ruins'];
export const RESOURCE_NAMES={coin:'金币',bait:'鱼饵',food:'鱼宠粮',supplies:'海岛物资',relics:'纪念章'};
export const rewardText=r=>Object.entries(r).map(([k,n])=>n+' '+RESOURCE_NAMES[k]).join(' + ');
