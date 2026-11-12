import {ORDER_DEFS} from '../shared/orders.js';
import {GUIDES} from '../shared/adventure.js';
import {CHAPTERS,chapterReady,journeyValues} from '../shared/journey.js';
import {weeklyDefs,weeklyReady} from '../shared/weekly.js';
import {nextObjective} from '../shared/objectives.js';

const resources={coin:'金币',bait:'次钓鱼',food:'鱼宠粮',supplies:'海岛物资'};
export const rewardLabel=reward=>Object.entries(reward).map(([key,value])=>`${value} ${resources[key]||key}`).join(' · ');
export function dailySummary(s,tab){
 const available=ORDER_DEFS.filter(d=>!s.orders.claimed.includes(d.id));
 const ready=available.filter(d=>s.orders.counts[d.id]>=d.target);
 const preferred=tab==='fish'?'catch':'growth';
 const order=ready[0]||available.find(d=>d.id===preferred)||available[0];
 return {order,ready:!!ready.length,readyCount:ready.length,claimed:s.orders.claimed.length,count:order?Math.min(order.target,s.orders.counts[order.id]||0):0};
}
export function activityView(s,c,tab,icon){
 const d=dailySummary(s,tab),labels={catch:'捕获 8 条鱼',adventure:'完成 3 次海上事件',growth:'扩张／升级／培养 2 次'};
 const tasksReady=chapterReady(s)||weeklyReady(s);
 return `<button id="orders-entry" class="daily-preview ${d.ready?'ready':''}" data-act="orders" aria-label="每日订单，${d.order?labels[d.order.id]+'，进度 '+d.count+'/'+d.order.target:'今日全部完成'}${d.ready?'，可领取奖励':''}"><span class="daily-emblem">${icon(d.ready?'gift':'flag')}</span><span class="daily-copy"><span class="daily-heading">每日订单 <small>${d.ready?d.readyCount+' 单可领奖':d.claimed+'/3 已领取'}</small></span><strong>${d.order?labels[d.order.id]:'今日订单已全部完成'} <b>${d.order?d.count+'/'+d.order.target:'✓'}</b></strong><span class="daily-reward">${d.order?rewardLabel(d.order.reward):'明日再来，继续出海发现新伙伴'}</span><span class="progress-track"><span style="width:${d.order?d.count/d.order.target*100:100}%"></span></span></span>${icon('chevron-right')}</button><button class="task-entry ${tasksReady?'ready':''}" data-act="tasks" aria-label="任务总览，主线故事、新手引导与每周委托">${icon('book-open')}<strong>任务</strong><small>${tasksReady?'可领奖':'主线 · 每周'}</small></button>`;
}
export function taskView(s,c,icon){
 const g=GUIDES[s.guide],goal=nextObjective(s,c),chapter=CHAPTERS[s.journey.chapter],v=journeyValues(s);
 const weekly=weeklyDefs(s.weekly),weekDone=weekly.filter(d=>s.weekly.counts[d.id]>=d.target).length;
 return `<div class="task-ledger"><article class="task-story"><span class="task-kicker">${icon('book-open')} 主线故事 · ${Math.min(CHAPTERS.length,s.journey.chapter+1)}/${CHAPTERS.length}</span><h3>${chapter?.name||'群岛的纪念'}</h3><p>${chapter?.detail||'六岛主线已完成，继续每周远航与伙伴培养。'}</p>${chapter?`<ul>${chapter.goals.map(([key,n,label])=>`<li class="${(v[key]||0)>=n?'done':''}"><span>${label}</span><b>${Math.min(n,v[key]||0)}/${n}</b></li>`).join('')}</ul><small>奖励：${rewardLabel(chapter.reward)}</small>`:''}<button class="primary full" data-act="journey">${chapterReady(s)?'领取主线奖励':'查看海岛故事'}</button></article><div class="task-shortcuts"><button data-act="orders">${icon('flag')}<span><strong>每日订单</strong><small>${s.orders.claimed.length}/3 已领取${dailySummary(s,'fish').ready?' · 有奖励可领':''}</small></span>${icon('chevron-right')}</button><button data-act="weekly">${icon('compass')}<span><strong>每周航海委托</strong><small>${weekDone}/3 已达成 · 周一更新${weeklyReady(s)?' · 可领奖':''}</small></span>${icon('chevron-right')}</button></div><article class="task-next"><span class="task-kicker">${icon('compass')} ${g?'新手航程 · '+(s.guide+1)+'/'+GUIDES.length:'成长建议'}</span><h3>${g?.name||goal.title}</h3><p>${g?.detail||goal.detail}</p><button class="secondary full" data-act="guide">查看${g?'引导':'目标'}</button></article></div>`;
}
export function fishingPreferences(rare,icon){return `<div class="play-settings"><button class="challenge-switch" data-act="challenge-toggle" role="switch" aria-checked="${rare}"><span><strong>好鱼上钩时挑战</strong><small>稀有／史诗鱼触发，关闭即自动收获</small></span><b>${rare?'开启':'关闭'}</b></button><p>挑战不另扣次数。成功额外获得 20% 鱼获金币；失败、退出或超时均保底收获原鱼。</p><button class="settings-row" data-act="manual">${icon('trophy')}<span><strong>收线练习</strong><small>消耗 1 次钓鱼，熟悉蓄力、提竿和收线</small></span>${icon('chevron-right')}</button></div>`;}
export function settingsView(sound,icon){return `<div class="settings-list"><button class="settings-row" data-act="sound" role="switch" aria-checked="${sound}">${icon(sound?'volume-2':'volume-x')}<span><strong>游戏声音</strong><small>${sound?'已开启':'已关闭'}</small></span><b>${sound?'开启':'关闭'}</b></button>${[['social','anchor','账号与好友','存档恢复、好友互访与复仇'],['install','plus','添加到手机','从主屏幕打开潮汐小岛'],['help','circle-help','玩法帮助','操作说明与冒险教学']].map(([a,i,title,detail])=>`<button class="settings-row" data-act="${a}">${icon(i)}<span><strong>${title}</strong><small>${detail}</small></span>${icon('chevron-right')}</button>`).join('')}</div>`;}
