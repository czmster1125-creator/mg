export const RAID_ROUTES=[
 {name:'海边货栈',label:'稳妥搬运',base:45,risk:0},
 {name:'码头仓库',label:'冒险搜刮',base:95,risk:24},
 {name:'小铺金库',label:'高额潜入',base:165,risk:48}
];
export function raidRisk(event,index){return Math.max(0,Math.min(85,RAID_ROUTES[index].risk+(index?event.turn*10:0)-(event.cover||0)));}
export function raidAmount(event,index){return Math.min(event.vault,Math.floor(RAID_ROUTES[index].base*event.bet*(1+(event.bonus||0))));}
