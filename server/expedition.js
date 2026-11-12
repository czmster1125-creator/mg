import {VOYAGE_STEPS,voyageTheme,SHORE_STYLES,featureStatus,ensureOuting,newOuting,outingProgress,finishOuting} from '../shared/expedition.js';
const keys=['coin','bait','supplies','food'];
export const loopSnapshot=s=>({resources:Object.fromEntries(keys.map(k=>[k,s[k]])),event:s.event?structuredClone(s.event):null,points:s.voyage.points});
export function recordFish(s,result,f){
 const prior=s.book[f.id];result.record=!!prior&&result.weight>prior.best;result.bondGain=prior&&(prior.count%5===0)&&(s.petBond[f.id]||0)<999?1:0;
 if(result.bondGain)s.petBond[f.id]=Math.min(999,(s.petBond[f.id]||0)+1);
 if(f.rarity>=2)s.voyage.points++;
 if(result.featureVoyage)s.voyage.points+=2;
 const o=s.outing;if(o?.active){o.fish++;if(!prior)o.newFish++;o.bond+=result.bondGain;}
}
export function recordLoop(s,type,p,result,before,now){
 const o=s.outing;
 if(['fishing','manual/start'].includes(type)){
  const n=type==='fishing'?p.bet:1;s.voyage.points+=n;
  if(o?.active)o.spent+=n;
  const feature=featureStatus(s);if(feature.unlocked&&!p.feature)s.islandSkills[s.zone]=Math.min(feature.feature.cost*10,s.islandSkills[s.zone]+n);
 }
 const done=['attack','raid','treasure','encounter','shield','supply'].includes(result.type)&&!s.event&&!s.manual;
 if(done){const bet=before.event?.bet||p.bet||1;s.voyage.points+=bet*2;if(o?.active)o.events++;
  const t=s.rivalTrail;
  if(!t.claimed){if(t.step===0&&result.type==='attack'&&!result.live){t.rival=before.event?.rival||result.rival;t.step=1;}
   else if(t.step===1&&result.type==='raid'&&result.coin>0&&!result.live&&(!t.rival||result.rival?.id===t.rival.id))t.step=2;
   else if(t.step===2&&result.type==='treasure')t.step=3;}
 }
 if(o?.active){if(type==='expand')o.builds++;if(type==='orders/claim')o.orders=(o.orders||0)+1;
  for(const k of keys){const delta=s[k]-before.resources[k];if(delta>=0)o.earned[k]+=delta;else o.spentResources[k]-=delta;}
  const progress=outingProgress(o);if(progress.count>=progress.target&&!s.event&&!s.manual&&finishOuting(s,now,true))result.outingCompleted=true;
 }
 result.voyagePoints=s.voyage.points-before.points;
}
export function expeditionAction(s,type,p,now){
 if(type==='voyage/claim'){
  const d=VOYAGE_STEPS[p.index];if(p.week!==s.voyage.week)throw Error('航海主题已更新，请查看本周进度');
  if(!Number.isInteger(p.index)||!d||s.voyage.points<d.at||s.voyage.claimed.includes(p.index))throw Error('阶段未达成或奖励已领取');
  s.voyage.claimed.push(p.index);for(const[k,n]of Object.entries(d.reward))s[k]+=n;
  let style=null;if(d.style){style=voyageTheme(s).style;if(!s.shoreStyles.includes(style))s.shoreStyles.push(style);else s.food+=2;}
  return {message:d.style?'航旗已收藏，阶段奖励已到账':'航海阶段奖励已到账',style,reward:d.reward};
 }
 if(type==='outing/plan'){
  if(s.event||s.manual)throw Error('先完成已保存的海上事件或好鱼挑战');
  if(!['casts','order','expand'].includes(p.goal)||![5,10,20].includes(p.target)||typeof p.autoStop!=='boolean')throw Error('请选择有效的本轮目标');
  if(p.goal==='order'&&s.orders.claimed.length===3)throw Error('今日订单已经全领，选择次数或扩张目标吧');if(p.goal==='expand'&&s.nodes.every(row=>row.reduce((a,b)=>a+b,0)>=25))throw Error('六岛已建成，选择次数或订单目标吧');
  finishOuting(s,now);s.outingPlan={goal:p.goal,target:p.target,autoStop:p.autoStop};newOuting(s,now);return {message:'新的出海目标已准备好'};
 }
 if(type==='outing/finish'){if(s.event||s.manual)throw Error('先完成已保存的海上事件或好鱼挑战');if(!finishOuting(s,now))throw Error('本轮已经结束');return {message:'本轮收获已保存，随时可以再次出海'};}
 if(type==='trail/follow'){if(!s.rivalTrail.rival||s.rivalTrail.step!==1||s.rivalTrail.claimed)throw Error('当前没有待追踪的对手');s.rivalTrail.follow=true;return {message:'下次 NPC 攻击或偷袭将优先追踪 '+s.rivalTrail.rival.name};}
 if(type==='trail/claim'){const t=s.rivalTrail;if(p.week!==t.week||t.step!==3||t.claimed)throw Error('对手手记尚未完成或已领取');t.claimed=true;s.supplies+=4;s.food+=4;s.rivalBadges=(s.rivalBadges||0)+1;return {message:'三段冒险完成：4 物资、4 鱼宠粮与一枚挑战纪念章'};}
 if(type==='shore/festival'){
  const region=p.region;if(!Number.isInteger(region)||!featureStatus(s,region).unlocked)throw Error('本岛扩张 10 块后开放灯会');if(s.festivals[region]?.week===s.voyage.week)throw Error('本岛本周灯会已经举办');const coin=5000*(region+1),supplies=10*(region+1);if(s.coin<coin||s.supplies<supplies)throw Error('灯会资源不足');s.coin-=coin;s.supplies-=supplies;s.festivals[region]={week:s.voyage.week,count:(s.festivals[region]?.count||0)+1};return {message:'本周海岛灯会已点亮，灯会纪念永久保留'};
 }
 if(type==='shore/buy'){
  const d=SHORE_STYLES.find(d=>d.id===p.id);if(!d||d.weekly)throw Error('该航旗需通过主题航海获得');if(s.shoreStyles.includes(d.id))throw Error('已经拥有这套布置');if(s.coin<d.coin||s.supplies<d.supplies)throw Error('布置资源不足');s.coin-=d.coin;s.supplies-=d.supplies;s.shoreStyles.push(d.id);s.shoreStyle=d.id;return {message:d.name+'已布置到海岛与小艇'};
 }
 if(type==='shore/equip'){if(!s.shoreStyles.includes(p.id)||!SHORE_STYLES.some(d=>d.id===p.id))throw Error('尚未拥有这套布置');s.shoreStyle=p.id;return {message:'已更换海岛与小艇布置'};}
 return null;
}
