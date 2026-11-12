import {ENCOUNTERS,ENCOUNTER_BY_ZONE} from './encounters.js';
export const STORY_FORMAT='sea-story-v1';
export const STORY_ENDINGS={repair:'修复',explore:'探寻',rescue:'援助'};
// Two authored episodes per sea; endings record experiences and never mint resources.
export const SEA_STORIES=[
 {theme:'潮汐旧信',episodes:[
  {name:'搁浅的邮差船',intro:'退潮后，一艘小邮船露出船舷。潮汐小屋的旧地址还挂在桅杆上。',investigate:'船舱里藏着一只上锁的邮袋，潮水正慢慢涨回来。',rescue:'小邮差抱着最后一捆信，正在礁石上等你。',safe:'补好船舷，带回散落物资',risk:'潜入船舱，找回防水邮袋',help:'送邮差回到岸边',gather:'一起收拾海边补给',ending:'旧信又一次沿着海风，抵达有人等候的窗台。'},
  {name:'月牙礁的灯',intro:'月牙礁的航灯熄灭了。远处有一尾小鱼，反复游过同一道浪。',investigate:'旧灯座还在，只缺几枚被潮水冲散的零件。',rescue:'小鱼把你引到浅滩，那里困着几只刚孵出的海龟。',safe:'修好灯座，整理旧物资',risk:'沿礁缝寻找发光贝',help:'护送小海龟游回海里',gather:'清理浅滩，收集漂流物',ending:'航灯亮起来时，浅滩上的小小身影已经回到海里。'}]},
 {theme:'港湾来客',episodes:[
  {name:'迟到的货船',intro:'港口钟声响过，最后一艘货船还停在雾里。船长摇着一面褪色的小旗。',investigate:'货舱进了水。安全的浮箱在近处，重要货单却落进更深的船腹。',rescue:'船上的厨师正在分最后一袋口粮。',safe:'拖回浮箱，修好引航绳',risk:'进入货舱取回航海箱',help:'分享补给，带大家归港',gather:'帮忙卸货，换取物资',ending:'迟到的汽笛终于响起，码头小铺又添了一张远方的明信片。'},
  {name:'会唱歌的浮标',intro:'港外有只浮标总在夜里响起，像有人轻轻敲着一段曲子。',investigate:'浮标下挂着旧船铃，铃绳缠进了锚链。',rescue:'一群小鱼躲在缠结的绳网旁，不敢游向外海。',safe:'解开锚链，修复浮标',risk:'潜到锚底寻找旧铃盒',help:'解开渔网，放伙伴归海',gather:'收回绳网，整理可用物资',ending:'船铃终于随浪轻响，这次唱的是回家的曲子。'}]},
 {theme:'珊瑚约定',episodes:[
  {name:'褪色的珊瑚园',intro:'研究员留下的木牌歪在水里，牌后有一片失去颜色的小珊瑚。',investigate:'观测架倒进了水下，里面的生长记录还没有带出来。',rescue:'珊瑚海马正守着新生的海草，等待有人疏通水路。',safe:'扶正观测架，收回材料',risk:'沿珊瑚洞寻找记录匣',help:'疏通水路，送来养护食物',gather:'培育海草，换取养护物资',ending:'新长出的嫩芽很小，却已经让这片珊瑚园重新有了颜色。'},
  {name:'珍珠亭的约定',intro:'珍珠亭的风铃少了一颗珠子。岛上的孩子说，那是给海马准备的礼物。',investigate:'亭脚的旧箱子卡在礁洞入口，附近还能看到散落的贝片。',rescue:'海马带着几只伙伴，围在被浪推倒的海草旁。',safe:'修好亭脚，收拾贝片',risk:'深入礁洞寻找珠匣',help:'扶起海草，安顿伙伴',gather:'一起整理礁湖物资',ending:'风铃重新响起来，礼物也终于等到了它的主人。'}]},
 {theme:'暖流信号',episodes:[
  {name:'黑沙上的脚印',intro:'黑沙岸边留着一串脚印，尽头是一只被暖流冲坏的观测箱。',investigate:'温热的岩缝里，还有一只没有取回来的采样盒。',rescue:'观测员的补给船被困在浅滩，几尾小鱼正绕着船打转。',safe:'修好观测箱，整理材料',risk:'趁退潮取出采样盒',help:'分享口粮，拖船离开浅滩',gather:'帮忙收回岸边观测物资',ending:'下一次暖流到来前，黑沙岸上的信号灯已经准备好了。'},
  {name:'浮标下的微光',intro:'暖流浮标下闪过一点金色。不是熔岩，是某种小小的海中灯火。',investigate:'浮标缆绳松了，微光顺着气泡沉入一条暗沟。',rescue:'几只暖流伙伴挤在缆绳之间，需要一条安全的出口。',safe:'加固缆绳，收回漂流箱',risk:'沿气泡探寻金色匣子',help:'放出伙伴，补充食物',gather:'清理缆绳，换取修缮物资',ending:'浮标轻轻摇晃，水下的微光又开始自由地游动。'}]},
 {theme:'冰海灯火',episodes:[
  {name:'雪雾里的暖灯',intro:'雪雾深处，一盏暖灯忽明忽暗。救援队的木舟靠在结冰的浮台旁。',investigate:'浮台的工具箱还在近处，灯油箱却滑进了冰缝。',rescue:'救援队正陪着受冷的伙伴，等待新一份补给。',safe:'修好浮台，收回工具',risk:'绕过碎冰取回灯油箱',help:'送来食物，陪大家归航',gather:'整理救援站，换取物资',ending:'雪雾散开时，你身后的暖灯仍在为下一艘船指路。'},
  {name:'极光邮局',intro:'冰海里漂着一只蓝色邮筒，里面塞满了画着极光的信。',investigate:'邮筒的底座还在冰下，旁边是一条幽蓝的裂隙。',rescue:'银冠鲑鱼带着鱼群，正等待穿过浮冰的机会。',safe:'固定邮筒，收好旧箱',risk:'沿蓝色冰缝找回信盒',help:'护送鱼群穿过浮冰',gather:'搭好临时浮台，领取物资',ending:'极光经过天空时，海里的信也找到了新的航线。'}]},
 {theme:'星海回声',episodes:[
  {name:'沉睡的星桥',intro:'遗迹的星桥只剩一半，桥下的星灯鱼却还记得旧日的路。',investigate:'星桥机关松动了，深处的石匣上留着一道微光。',rescue:'星灯鱼围住一群迷路的小伙伴，像在等你读懂它们的信号。',safe:'修稳星桥，整理石片',risk:'穿过暗流探寻石匣',help:'点亮航线，护送伙伴',gather:'协助清理桥下修复物资',ending:'星桥没有回到从前，却为今天的伙伴照出了一条新路。'},
  {name:'最后一声回响',intro:'古老星盘转了一格。海面传来一声回响，像是一句没说完的告别。',investigate:'星盘底部有一只旧匣，外圈散落着可以修复的构件。',rescue:'星环蝠鲼停在遗迹前，正为更小的鱼遮挡暗流。',safe:'归位构件，修复星盘',risk:'穿过遗迹寻找回声匣',help:'引开暗流，护送鱼群',gather:'和伙伴整理遗迹物资',ending:'回响渐渐远去，星盘上留下的，是这次远航的新故事。'}]}
];
export function initSeaStories(s){s.seaStories||={visits:Array(6).fill(0),memories:[],recent:[],lastCast:s.adventureCasts||0};}
export function storyDefinition(e){return SEA_STORIES[e.zone]?.episodes[e.episode];}
export function storyChoices(e){
 const d=storyDefinition(e),c=ENCOUNTERS[ENCOUNTER_BY_ZONE[e.zone]];
 if(e.stage==='approach')return [
  {id:'investigate',name:'调查遗迹',detail:'进入后再选稳妥修复或冒险探寻',cost:{coin:c.coin},reward:null},
  {id:'help',name:'回应求援',detail:'进入后选择补给或物资，均可安全完成',cost:{food:c.food},reward:null},
  {id:'leave',name:'平安离开',detail:'不花额外资源，不记录故事结局',cost:{},reward:{bait:1}}
 ];
 if(e.path==='investigate')return [
  {id:'repair',name:d.safe,cost:{},reward:{...c.loot},ending:'repair',detail:'确定获得物资，安全完成'},
  {id:'explore',name:d.risk,cost:{},reward:Object.fromEntries(Object.entries(c.loot).map(([k,n])=>[k,Math.ceil(n*1.6)])),fallback:Object.fromEntries(Object.entries(c.loot).map(([k,n])=>[k,Math.max(1,Math.floor(n*.5))])),risk:e.risk,ending:'explore',detail:'失利仍保留部分物资，不扣已有钱包'}
 ];
 return [
  {id:'escort',name:d.help,cost:{},reward:{bait:Math.min(6,Math.ceil(c.bait/2)),relics:c.relics},ending:'rescue',detail:'护送伙伴，获得钓鱼补给与纪念章'},
  {id:'gather',name:d.gather,cost:{},reward:{supplies:Math.max(3,Math.ceil((c.loot.supplies||0)*.75)),relics:c.relics},ending:'rescue',detail:'协助整理，获得海岛物资与纪念章'}
 ];
}
