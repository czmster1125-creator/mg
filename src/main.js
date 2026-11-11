import {equipmentView} from './equipment-ui.js';
import {captainView} from './captain-ui.js';
import {captainTitle,captainLevel} from '../shared/captain.js';
import {shellBoard,shellWin} from './treasure-ui.js';
import {SHELL_FORMAT} from '../shared/treasure.js';
import {ENCOUNTERS,rewardText} from '../shared/encounters.js';
import {COLLECTION_KEYS,regionOpen,zoneOpen,landCount} from '../shared/content.js';
import {weeklyDefs} from '../shared/weekly.js';
import {onlineView} from './online-ui.js';
import {CHAPTERS,MASTERY,chapterReady,journeyValues} from '../shared/journey.js';
import {ORDER_DEFS,readyOrder} from '../shared/orders.js';
import {PET_SKILLS,petDescription,repairCost} from '../shared/pets.js';
import {raidView,rivalBanner} from './raid-ui.js';
import {FIGHT_PROFILES,FAILURE_REASONS,perfectCast,createFight,fightPhase,stepFight} from '../shared/fishing.js';
import {nextObjective,collectionReady} from '../shared/objectives.js';
import {GUIDES,ROLES,role,slots,rates,bonuses,UPGRADE_COSTS,BUILD_UNLOCK} from '../shared/adventure.js';
import {createAdventureScene} from './adventure-scenes.js';
import './adventure.css';
import {frontier,owned} from '../shared/hex.js';
import {createIcons, Fish, Waves, Sun, Volume2, VolumeX, Settings2, Shield, Coins, Shell, Plus, ChevronRight, ArrowUpRight, Map, House, Anchor, BookOpen, Package, Flag, Compass, Lock, LockOpen, X, Check, Sparkles, Trophy, Hammer, Store, Landmark, PawPrint, Gem, FishingRod, RotateCcw, Wind, CircleHelp, ArrowLeft, Zap, Gift, LoaderCircle} from 'lucide';
import {createWorld} from './scene.js';
import {createFishPreview} from './fish-preview.js';
import './style.css';
import './portrait.css';
import './town.css';
import './fishing.css';
import './progression.css';
import './online.css';
import './content.css';
import './focus.css';
import {BASE_STAGES} from './town-models.js';
const icons={Fish,Waves,Sun,Volume2,VolumeX,Settings2,Shield,Coins,Shell,Plus,ChevronRight,ArrowUpRight,Map,House,Anchor,BookOpen,Package,Flag,Compass,Lock,LockOpen,X,Check,Sparkles,Trophy,Hammer,Store,Landmark,PawPrint,Gem,FishingRod,RotateCcw,Wind,CircleHelp,ArrowLeft,Zap,Gift,LoaderCircle};
const $=s=>document.querySelector(s),icon=(n,c='')=>`<i data-lucide="${n}" class="${c}"></i>`;
const drawIcons=()=>createIcons({icons,attrs:{'stroke-width':1.8}});
let socialInfo={},state,C,world,spot=0,bet=1,busy=false,tab='fish',modal=null,region=0,sound=localStorage.getItem('tidebloom-sound')!=='off',manual=null,lastFocus=null,audio;
let gearFocus=0,gearPreviewSpot=0;
let travelCancelled=false,pendingPage=null,autoFishing=false,autoTimer=null,castPhase='idle',rareChallenge=localStorage.getItem('tidebloom-rare-challenge')!=='off';
let disposeFishPreview=()=>{},disposeAquarium=()=>{},stateEpoch=0;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const points=r=>state.nodes[r].reduce((a,b)=>a+b,0);
function chirp(kind='click'){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const now=audio.currentTime;[0,1,2].slice(0,kind==='win'?3:1).forEach((v)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=(kind==='win'?523:440)*[1,1.25,1.5][v];gain.gain.setValueAtTime(.045,now+v*.09);gain.gain.exponentialRampToValueAtTime(.001,now+v*.09+.18);osc.connect(gain).connect(audio.destination);osc.start(now+v*.09);osc.stop(now+v*.09+.2);});}catch{}}
function fishArt(f,locked=false){return `<svg class="fish-art ${locked?'silhouette':''}" viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="77" cy="86" rx="46" ry="5" fill="#253f3210"/><path d="M111 49L145 27Q138 50 147 73L112 58" fill="${f.color}"/><path d="M53 28Q66 6 96 25L101 36M65 68L83 85L100 66" fill="${f.color}"/><ellipse cx="76" cy="49" rx="46" ry="28" fill="${f.color}"/><path d="M58 25Q47 49 60 74M84 22Q76 49 88 76" fill="none" stroke="#fff5dc" stroke-width="9" opacity=".8"/><path d="M75 46Q96 41 88 62Q79 63 75 46" fill="#173f4b" opacity=".2"/><circle cx="44" cy="43" r="6" fill="#fff"/><circle cx="43" cy="43" r="3" fill="#243d43"/><path d="M31 54q6 5 10 0" stroke="#243d43" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;}
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('visible'),4000);}
async function request(type,p={}){stateEpoch++;const requestId=crypto.randomUUID();const body=JSON.stringify({...p,requestId});if(!navigator.onLine)throw Error('网络已断开，连接后再试');for(let attempt=0;attempt<2;attempt++){try{const r=await fetch('/api/'+type,{signal:AbortSignal.timeout(12000),method:'POST',headers:{'Content-Type':'application/json'},body});const j=await r.json();if(!r.ok){const e=new Error(j.error);e.known=true;throw e;}return j;}catch(e){if(e.known||attempt)throw e;await wait(600);}}}
async function transact(type,p={},after){if(busy)return;busy=true;setBusy();const sourceModal=modal,scene=disposeFishPreview,visual=['event/attack','event/infiltrate','event/steal','event/bank'].includes(type);try{const j=await request(type,p);state=j.state;if(j.social)socialInfo=j.social;if(visual)await scene.play?.(type,{...j.result,target:p.target,route:p.route});const abandoned=visual&&modal!==sourceModal;world.update(state,region);render();if(j.result.guide)toast('引导完成：'+j.result.guide+'，奖励已到账');else if(j.result.mission)toast(`委托「${j.result.mission}」完成，奖励已到账`);else if(j.result.xpGain)toast('船长经验 +'+j.result.xpGain);if(after&&!abandoned)await after(j.result);chirp('win');}catch(e){toast(e.message||'连接中断，请稍后重试');}finally{busy=false;setBusy();}}

function setBusy(){document.querySelectorAll('[data-mutation]').forEach(b=>b.disabled=busy||b.dataset.unavailable==='true');const cast=$('#cast');if(cast)cast.disabled=busy||!!manual;}
function initUI(){ $('#app').innerHTML=`
 <header class="app-header"><a class="brand" href="#" aria-label="潮汐小岛首页"><span class="brand-symbol">${icon('waves')}</span><span>TIDEBLOOM<small>潮汐小岛</small></span></a><div class="header-tools"><button id="orders-entry" class="orders-entry" data-act="orders" aria-label="每日订单"></button><button class="icon-button" data-act="more" aria-label="更多玩法与设置">${icon('settings-2')}</button></div></header>
 <main class="layout"><aside class="sidebar" id="sidebar" hidden></aside><section class="play-area"><div class="stage" id="stage"><div id="world"></div>
 <div class="scene-top"><div class="captain-card"><button class="captain-avatar" data-act="social" aria-label="账号与好友">${icon('anchor')}</button><button class="captain-progress" data-act="captain" aria-label="船长成长与经验"><strong><span id="captain-title">见习船长</span> <b id="player-level">Lv. 1</b></strong><div class="player-xp"><span id="player-xp"></span></div><small id="captain-xp">0/100 经验</small></button></div><div class="resources"><button class="resource" data-act="wallet" title="鱼获自动结算金币"><span class="coin-token">${icon('coins')}</span><span id="coin">350</span></button><button class="resource" data-act="base" title="基地自然恢复鱼饵"><span class="bait-token">${icon('shell')}</span><span><b id="bait">40</b><small>/50</small></span></button></div></div>
 <div class="mobile-mission" id="mobile-mission"></div>
 <button class="location" data-act="zones"><span class="location-icon">${icon('compass')}</span><span><small id="zone-en">SERENITY BAY</small><strong id="zone-name">宁静海湾</strong></span>${icon('chevron-right')}</button>
 <div class="scene-tools"><button class="tool-button" data-act="gear">${icon('fishing-rod')}<span>装备</span></button></div>
 <section id="aquarium-page" hidden></section><button id="event-resume" class="event-resume" data-act="event" hidden></button><div id="bite-callout" class="bite-callout" aria-live="polite" hidden></div><div class="sea-note"><span class="live-dot"></span><span id="sea-note">浅滩鱼群 · 轻松捕获</span></div>
 <div class="cast-controls spin-console" id="cast-controls"><div class="spin-caption"><strong id="cast-status">海风正好，出海吧</strong><span id="cast-hint">点击鱼群即开钓 · SPIN 自动找好钓点</span></div><div class="cast-row"><button class="bet-button" data-act="bet" aria-label="切换钓鱼倍率"><span>倍率</span><strong id="bet">×1</strong><small>每次鱼饵</small></button><button class="cast-button spin-button" id="cast" data-act="cast" aria-label="SPIN 自动找点钓鱼"><span class="spin-arrows">${icon('rotate-ccw')}</span><strong>SPIN</strong><small id="cast-cost">1 鱼饵 / 次</small></button><button class="auto-button" data-act="auto-fish" aria-pressed="false"><span>${icon('rotate-ccw')}</span><strong>AUTO</strong><small>连续钓鱼</small></button></div></div>
 <div class="town-heading" id="town-heading" hidden></div><div class="map-banner" id="map-banner" hidden></div><div class="base-banner" id="base-banner" hidden></div><div class="canvas-fallback" hidden id="canvas-fallback">3D 画面暂时不可用。请开启浏览器硬件加速。</div></div>
 <nav class="bottom-nav" aria-label="游戏导航">${[['map','map','海岛'],['fish','fishing-rod','钓鱼'],['book','fish','鱼缸']].map(([id,i,n])=>`<button data-act="nav" data-tab="${id}" class="nav-item ${id==='fish'?'active':''}">${icon(i)}<span>${n}</span></button>`).join('')}</nav></section></main>
 <div class="modal-backdrop" id="modal-root" hidden></div><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
 try{world=createWorld($('#world'),selectSpot,i=>openModal('build',i),moving=>{
  $('#cast-hint').textContent=moving?'驶向目标 · 可随时重新选择':'点击鱼群即开钓 · 拖动水面驾船';
  $('#stage').classList.toggle('boat-moving',moving);
 },i=>openModal('base-building',i),()=>{if(!busy)transact('base/collect',{},()=>{world.collect();toast('基地收益已收入背包');});});world.update(state);world.zone(state.zone);}catch(e){console.error(e);$('#canvas-fallback').hidden=false;world={select(){},cast(){},view(){},zone(){},update(){},reset(){},approach:()=>Promise.resolve(),feedback(){},catchFish(){}};}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAuto();if(castPhase==='sailing'){travelCancelled=true;world.cancelApproach?.();}world.freeze?.(true);}else world.freeze?.(!!modal&&!['manual','build','base-building'].includes(modal.type));});window.addEventListener('pagehide',()=>stopAuto());document.addEventListener('submit',handleSubmit);document.addEventListener('click',handleClick);document.addEventListener('keydown',handleKey);$('#modal-root').addEventListener('click',e=>{if(e.target===$('#modal-root')&&modal?.type!=='manual')closeModal();});render();setInterval(()=>{const epoch=stateEpoch;if(!busy&&!manual&&!modal&&!document.hidden)fetch('/api/bootstrap').then(r=>r.json()).then(j=>{if(!busy&&!manual&&!modal&&epoch===stateEpoch){state=j.state;if(j.social)socialInfo=j.social;world.update(state,region);render();}}).catch(()=>{});},30000);
}
function render(){
 $('#player-level').textContent='Lv. '+captainLevel(state);$('#captain-title').textContent=captainTitle(state).name;$('#captain-xp').textContent=(state.xp%100)+'/100 经验';$('#player-xp').style.width=(state.xp%100)+'%';$('#coin').textContent=fmt(state.coin);$('#bait').textContent=state.bait;$('#bet').textContent='×'+bet;if($('#cast-cost'))$('#cast-cost').textContent=`${bet} 鱼饵 / 次`;$('#zone-en').textContent=C.zones[state.zone].en;$('#zone-name').textContent=C.zones[state.zone].name;
 const m=C.missions[state.mission], progress=m?Math.min(100,state.missionProgress/m.target*100):100;
 const missionCard=`<div class="quest-top"><span class="eyebrow">${icon('flag')} 海岛委托 ${String(state.mission+1).padStart(2,'0')}</span><span class="quest-reward">${icon('gift')} ${m?.coin?m.coin+' 金币':m?.bait?m.bait+' 鱼饵':m?.supplies?'2 海岛物资':'已完成'}</span></div><h3>${m?.name||'自在的岛屿生活'}</h3><div class="quest-progress"><span>${m?.desc||'探索海域，收集全部鱼种'}</span><b>${m?state.missionProgress+'/'+m.target:'✓'}</b></div><div class="progress-track"><span style="width:${progress}%"></span></div>`;
 $('#mobile-mission').innerHTML=`<span class="mission-symbol">${icon('flag')}</span><div class="mission-copy"><strong>${m?.desc||'享受你的海岛时光'}</strong><div class="progress-track"><span style="width:${progress}%"></span></div></div><b>${m?state.missionProgress+'/'+m.target:'✓'}</b><span class="mission-gift">${icon('gift')}</span>`;
 const p=points(region);$('#sidebar').innerHTML='';
 document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));$('#cast-controls').hidden=tab!=='fish';$('#map-banner').hidden=tab!=='map';$('#stage').dataset.view=tab;$('#map-banner').innerHTML=`<div><small>YOUR ISLAND STORY · ${p} / 25</small><h2>${C.regions[region].name} · 点击相邻格子，扩张海岸</h2></div><div class="home-ledger"><span>海岛物资 <b>${state.supplies}</b></span><span>鱼宠粮 <b>${state.food}</b></span><small>待领：${Math.floor(state.pending[1])} 金币 · ${Math.floor(state.pending[2])} 物资 · ${Math.floor(state.pending[3])} 鱼宠粮</small></div><div class="island-story"><button data-act="journey">海岛故事 · 第 ${Math.min(CHAPTERS.length,state.journey.chapter+1)} 章</button><button data-act="world">六岛航线</button><button data-act="decorate" data-mutation data-unavailable="${points(region)<10}">布置地标 · Lv.${state.decor?.[region]||0}</button></div><div class="mobile-region-tabs">${C.regions.map((r,i)=>`<button data-act="region" data-index="${i}" class="${region===i?'active':''}" ${!regionOpen(state,i)?'disabled':''}>${r.name}${!regionOpen(state,i)?' · 未解锁':''}</button>`).join('')}</div><button data-act="build-next" class="primary">${icon('hammer')} 选择扩张地块</button>`;
 renderTown();renderAdventure();updateAuto();
 if(modal&&!['reward','manual','help'].includes(modal.type))renderModal();drawIcons();setBusy();
}
function renderTown(){
 const town=tab==='map';$('#town-heading').hidden=!town;$('#town-heading').innerHTML=`<button class="island-location" data-act="world"><span><small>MY ISLAND · 0${region+1}</small><strong>${C.regions[region].name}</strong></span>${icon('chevron-right')}</button><button class="story-chip" data-act="journey">${icon('book-open')} 第 ${Math.min(CHAPTERS.length,state.journey.chapter+1)} 章故事</button>`;
 $('#base-banner').hidden=tab!=='base';const ready=state.pending.slice(1).some(n=>n>=1);
 $('#base-banner').innerHTML=`<div class="base-banner-title"><span><small>YOUR ISLAND, ALWAYS GROWING</small><strong>小岛正在营业</strong></span><b>${state.base.reduce((a,b)=>a+b,0)} <small>/ ${C.base.length*5}</small></b></div><div class="base-resources">${C.base.slice(1).map((b,j)=>`<span>${icon(b.icon)}<b>${Math.floor(state.pending[j+1])}</b><small>${b.unit}</small></span>`).join('')}</div><button class="primary full" data-act="collect" data-mutation data-unavailable="${!ready}" ${ready?'':'disabled'}>${icon('gift')} ${ready?'领取全部收益':'收益积累中'}<small>最多累积 12 小时</small></button>`;
}
function stopAuto(message){autoFishing=false;clearTimeout(autoTimer);autoTimer=null;updateAuto();if(message)toast(message);}
function updateAuto(){const b=$('[data-act="auto-fish"]');if(b){b.classList.toggle('active',autoFishing);b.setAttribute('aria-pressed',String(autoFishing));b.innerHTML=`<span>${icon(autoFishing?'x':'rotate-ccw')}</span><strong>${autoFishing?'STOP':'AUTO'}</strong><small>${autoFishing?'停止连续':'连续钓鱼'}</small>`;drawIcons();}}
function selectSpot(i){if(manual||modal||tab!=='fish')return;if(busy&&castPhase!=='sailing')return;stopAuto();spot=i;world.select(i);$('#sea-note').textContent=['浅滩鱼群 · 轻松捕获','珊瑚秘境 · 稀有鱼相对权重提升','大鱼出没 · 更容易捕获大体型鱼'][i];chirp();if(!busy)cast(false);}

function navigate(target){stopAuto();if(manual)return;if(busy){if(castPhase==='sailing'){travelCancelled=true;pendingPage=target;world.cancelApproach?.();}return;}if(target==='base')target='map';if(target==='book'){closeModal();tab='book';world.view('book');render();return;}if(['fish','map','base'].includes(target)){closeModal();tab=target;world.view(target);world.update(state,region);render();}else openModal(target);}
function openModal(type,data){if(manual&&type!=='manual')return;if(!['reward'].includes(type))stopAuto();const inScene=['manual','build','base-building'].includes(type);world.freeze?.(!inScene);$('#app').classList.toggle('town-detail-active',['build','base-building'].includes(type));if(['build','base-building'].includes(type))world.selectBuilding?.(data);$('#modal-root').dataset.mode=type;$('#app').classList.toggle('manual-active',type==='manual');lastFocus=document.activeElement;modal={type,data};renderModal();$('#modal-root').hidden=false;$('#modal-root .close-button')?.focus();}
function modalShell(title,subtitle,body,footer='',wide=false){return `<section class="modal ${wide?'wide':''}" role="dialog" aria-modal="${['build','base-building'].includes(modal?.type)?'false':'true'}" aria-labelledby="modal-title"><div class="modal-header"><div><span class="eyebrow">${subtitle}</span><h2 id="modal-title">${title}</h2></div><button class="icon-button close-button" data-act="close" aria-label="关闭">${icon('x')}</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</section>`;}
function renderModal(){if(!modal)return;disposeFishPreview();disposeFishPreview=()=>{};const {type,data}=modal;let html='';
 if(type==='aquarium-info'){html=modalShell('伙伴与收藏','AQUARIUM JOURNAL',`<p class="pet-bonuses">${['金币 +'+Math.round(bonuses(state,C.fish).gold*100)+'%','攻击 +'+bonuses(state,C.fish).attack,'寻宝 +'+Math.round(bonuses(state,C.fish).explore*100)+'%','偷袭 +'+Math.round(bonuses(state,C.fish).steal*100)+'%'].join(' · ')}</p><p class="fineprint">每条首次发现的鱼都可以成为伙伴。选择随行后技能生效，同定位伙伴会自动替换。鱼宠粮用于培养。</p><div class="collection-list">${COLLECTION_KEYS.map(k=>{const ready=collectionReady(state,C.fish,k),claimed=state.collectionClaims.includes(k);return `<button data-act="claim-collection" data-key="${k}" data-mutation data-unavailable="${!ready||claimed}">${icon(claimed?'check':'gift')} ${typeof k==='number'?k+' 种伙伴':C.zones[Number(k.slice(3))].name}<small>${claimed?'已领取':ready?'领取奖励':'尚未达成'}</small></button>`;}).join('')}</div>`);}else if(type==='more'){html=modalShell('海边手记','玩法与偏好 · '+C.version,`<div class="play-settings"><button class="challenge-switch" data-act="challenge-toggle" role="switch" aria-checked="${rareChallenge}"><span><strong>好鱼上钩时挑战</strong><small>稀有／史诗鱼触发。关闭即自动收获。</small></span><b>${rareChallenge?'开启':'关闭'}</b></button><p>挑战不另扣鱼饵。成功额外获得 20% 鱼获金币；失败、退出或超时均保底收获原鱼。</p><div class="more-grid">${[['captain','flag','船长成长'],['world','compass','六岛航线'],['journey','book-open','海岛故事'],['orders','flag','每日订单'],['weekly','gift','每周委托'],['reports','shield','防守战报'],['raid-lesson','zap','偷袭教学'],['gear','fishing-rod','钓具装备'],['zones','map','切换海域'],['decorate','house','布置地标'],['manual','trophy','收线练习'],['sound',sound?'volume-2':'volume-x',sound?'音效开启':'音效关闭'],['help','circle-help','玩法帮助']].map(([a,i,n])=>`<button data-act="${a}">${icon(i)}<span>${n}</span></button>`).join('')}</div></div>`);}else if(type==='supply'){html=modalShell('补给船正在靠岸','应急鱼饵 · 六小时一次',`<p>没有鱼饵时可领取 5 份应急补给，也可完成订单、章节或等待潮汐小屋恢复。</p>`,`<button class="primary full" data-act="rescue" data-mutation>领取 5 鱼饵</button><button class="secondary full" data-act="orders">查看订单</button>`);}else if(type==='book'){html=modalShell('鱼缸','AQUARIUM','请从底部进入鱼缸'); }else if(type==='base-building'){
 const i=data,b=C.base[i],lv=state.base[i],cost=UPGRADE_COSTS[lv],next=lv>0&&lv<5,unavailable=!next||state.coin<cost;const actual=rates(state,C.base,C.fish)[i],copy=structuredClone(state);copy.base[i]=Math.min(5,lv+1);const nextRate=rates(copy,C.base,C.fish)[i];
 html=modalShell(b.name,`ISLAND HOME · Lv. ${lv} / 5`, `<div class="town-detail"><p class="home-purpose">${b.detail}</p>${state.homeMigration?`<p class="fineprint">家园已合并为四栋，旧物资与待领收益已保留${state.homeMigration.refund?`；重复升级补偿 ${state.homeMigration.refund} 金币已到账`:""}。</p>`:""}<div class="town-stats"><span>当前产出<strong>${actual.toFixed(1)} ${b.unit}/小时</strong></span><span>${next?'升级后':'经营状态'}<strong>${next?nextRate.toFixed(1)+' '+b.unit+'/小时':!lv?'待解锁':'已满级'}</strong></span></div>${i===1&&next?`<p class="bank-return">每小时增加 ${(nextRate-actual).toFixed(1)} 金币 · 约 ${(cost/(nextRate-actual)).toFixed(1)} 小时收回升级成本<small>按当前宠物和建筑状态计算；需及时领取，离线最多累计 12 小时。</small></p>`:''}<p>${!lv?'扩张 '+BUILD_UNLOCK[i]+' 块土地自动建成':state.damage[i]?'建筑受损，生产效率降低 50%':next?BASE_STAGES[lv]+' → '+BASE_STAGES[lv+1]:'海边家园已落成'}${i===0?' · 鱼饵自动恢复，上限 50':' · 离线收益最多存储 12 小时'}</p></div>`, `<button class="primary full" data-act="base-upgrade" data-index="${i}" data-mutation data-unavailable="${unavailable}" ${unavailable?'disabled':''}>${icon('hammer')} ${!lv?'尚未解锁':!next?'建筑已满级':state.coin<cost?'金币不足 · 还差 '+fmt(cost-state.coin):'扩建至 Lv. '+(lv+1)}${next?`<span>${icon('coins')} ${cost}</span>`:''}</button>${state.damage[i]?`<button class="secondary full" data-act="repair" data-index="${i}" data-mutation>维修 · ${repairCost(state,i,bonuses(state,C.fish))} 金币</button>`:''}`);
 }else if(type==='gear'){const view=equipmentView(state,C,gearFocus,gearPreviewSpot,icon);html=modalShell('海边装备铺','THE DOCKSIDE OUTFITTER',view.body,view.footer);
 }else if(type==='captain'){const view=captainView(state);html=modalShell('船长成长','CAPTAIN’S JOURNEY',view.body,view.footer);
 }else if(type==='zones'){
 html=modalShell('海的另一边','FIND YOUR NEXT FAVORITE PLACE',`<img class="zone-art" src="/art/tidebloom-island.png" alt="潮汐小岛海域美术"/><div class="zone-list">${C.zones.map((z,i)=>`<button data-act="zone" data-index="${i}" data-mutation data-unavailable="${!zoneOpen(state,i)}"><span class="zone-number">0${i+1}</span><span><strong>${z.name}</strong><small>${z.en} · ${C.fish.filter(f=>f.zone===i).length} 种鱼类 · 发现 ${C.fish.filter(f=>f.zone===i&&state.book[f.id]).length} 种 · 新发现保底 ${state.discoveryDry[i]}/20</small></span><b>${state.zone===i?icon('check'):state.unlocked.includes(i)?'前往':!zoneOpen(state,i)?'先完成前岛':`${icon('coins')} ${z.cost}`}</b></button>`).join('')}</div><p class="fineprint">解锁后可随时返回，切换海域不消耗鱼饵。</p>`);
 }else if(type==='build'){
 const count=owned(state,region).length,materialCost=count>=10&&(count+1)%5===0?2:0,cost=C.buildCosts[Math.floor(count/5)]*(region+1),unavailable=state.coin<cost||state.supplies<materialCost||!frontier(state,region).some(t=>t.id===data);
 html=modalShell('扩张海岛',`ISLAND EXPANSION · ${count} / 25`,`<div class="town-detail"><h3>将这片海面变成新的土地</h3><p>扩张后出现绿地与景观，并开放相邻格子。每 5 块土地获得建设奖励。</p><p class="expansion-preview">${expansionPreview(count+1,region)}</p><p>当前金币 ${fmt(state.coin)} · 本次消耗 ${cost} 金币${materialCost?` + ${materialCost} 海岛物资`:""}</p></div>`,`<button class="primary full" data-act="expand-confirm" data-tile="${data}" data-mutation data-unavailable="${unavailable}" ${unavailable?'disabled':''}>${icon('plus')} ${unavailable?'资源不足或地块不可扩张':'确认扩张'}<span>${icon('coins')} ${cost}</span></button>`);
 }else if(type==='reward'){
 const fishes=data.fish||[],f=C.fish.find(x=>x.id===fishes[0]?.species);if(!f)return;
 html=modalShell(fishes.length>1?'这一竿，满载而归！':'有鱼上钩啦！','A LITTLE MOMENT OF JOY',`<div class="catch-showcase rarity-bg-${f.rarity}"><span class="catch-rays"></span><div id="catch-model"></div><div class="catch-confetti">${Array.from({length:18},(_,i)=>`<i style="--x:${(i*37)%100}%;--r:${i*41}deg;--delay:${(i%6)*.15}s;--color:${['#f6d485','#8bd8c3','#e7a6a0','#b2b4e9'][i%4]}"></i>`).join('')}</div><span class="catch-spark s1">✦</span><span class="catch-spark s2">✧</span><span class="rarity rarity-${f.rarity}">${C.rarities[f.rarity]}${fishes.length>1?' · '+fishes.length+' 尾鱼获':''}</span></div><div class="catch-details"><h2>${f.name}${fishes.length>1?'与它的伙伴们':''}</h2><p>${f.en}</p><div class="catch-stats"><span><small>${fishes.length>1?'总重量':'鱼获重量'}</small><strong>${(fishes.reduce((n,f)=>n+f.weight,0)/1000).toFixed(2)} <em>kg</em></strong></span><span><small>获得金币</small><strong>${icon('coins')}${fishes.reduce((n,f)=>n+f.price,0)+(data.bonus||0)}</strong></span></div><p class="fineprint">金币已到账${data.xpGain?' · 经验 +'+data.xpGain:''}${data.bonus?' · 挑战额外 +'+data.bonus+' 金币':data.guaranteed?' · 保底收获':''} · ${fishes.some(f=>f.firstDiscovery)?'新鱼宠已解锁！':'鱼缸记录已更新'}</p></div>`,`<button class="primary full" data-act="close">继续钓鱼 ${icon('arrow-up-right')}</button><button class="text-button full" data-act="book">前往鱼缸</button>`);
 }else if(type==='manual'){
 html=modalShell(state.manual?.source==='encounter'?'好鱼上钩了！':'收线练习','CAPTAIN’S CHALLENGE',`<div class="manual-fish">${fishArt(C.fish.find(f=>f.id===state.manual?.species)||C.fish.find(f=>f.zone===state.zone&&f.rarity===2))}</div><div class="manual-instructions" id="manual-instructions"><h3>按住蓄力，松开抛竿</h3><p>鱼咬钩时提竿，再交替按住与松开收线。<br>让张力保持安全，收线进度达到 100%。</p></div><div id="manual-profile" class="manual-profile">${FIGHT_PROFILES[spot].name} · 成功捕获稀有鱼</div><div id="fight-status" class="fight-status" role="status">绿色区松手，精准抛竿</div><div class="manual-meters charging" id="manual-meters"><label><span id="progress-label">抛竿蓄力</span><b id="manual-progress-text">0%</b></label><div class="progress-track"><i class="cast-sweet-zone"></i><span id="manual-progress" style="width:0%"></span></div><label><span>鱼线张力</span><b id="manual-tension-text">0%</b></label><div class="tension-track"><span id="manual-tension" style="width:0%"></span><i></i></div></div><p class="fineprint">${state.manual?.source==='encounter'?'本次已扣鱼饵，挑战不再收费。成功额外获得 20% 鱼获金币；失败、退出或超时均保底收获原鱼。':'练习消耗 1 鱼饵；成功捕获珍稀鱼，失败补偿 5 金币。'}</p>`,`<button class="primary full hold-button" id="manual-button">${icon('fishing-rod')} 按住蓄力，松开抛竿</button>${state.manual?.source==='encounter'?'<button class="guaranteed-catch" data-act="manual-auto">保底收获 · 不额外扣鱼饵</button>':''}`);
 }else if(type==='manual-result'){const failure=FAILURE_REASONS[data.reason]||FAILURE_REASONS.timeout;html=modalShell(failure.title,'下一竿，再试一次',`<div class="manual-failure">${icon('fishing-rod')}<h3>${failure.tip}</h3><p>获得 ${data.compensation} 金币补偿 · 本次消耗 1 鱼饵</p></div>`,`<button class="primary full" data-act="manual">再次挑战 · 1 鱼饵</button><button class="text-button full" data-act="close">返回海面</button>`);
 }else if(['pet','event','event-result','guide','reports','orders','social','journey','world','weekly'].includes(type)){html=adventureModal(type,data);
 }else if(type==='help'){
 html=modalShell('欢迎来到潮汐小岛','A SMALL GUIDE TO A BIG ADVENTURE',`<div class="help-grid">${[['fishing-rod','01 · 抛竿钓鱼','SPIN 自动找点；点击鱼群直接开钓。×1 / ×2 / ×5 消耗对应鱼饵，每竿抽取一次鱼获或海上事件；倍率不提高稀有概率，护盾始终只加一层。'],['coins','02 · 鱼获结算','捕获后直接获得金币，首次发现的鱼永久入住鱼缸，随行后提供加成，鱼宠粮用于升级。'],['house','03 · 建造梦想','点击海岛边缘的加号扩张土地，每 5 块获得奖励，完成 25 块开放下一座岛；航线共有六座主题岛。'],['sun','04 · 海岛在成长','基地持续生产，最多存储 12 小时。潮汐小屋自然恢复鱼饵；升级装备挑战大鱼。']].map(([i,t,d])=>`<article>${icon(i)}<div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}</div><p class="fineprint">点击 / 拖动水面驾船 · 点击鱼群即开钓 · 空格抛竿 · Esc 关闭面板<br>本 Demo 使用当前服务器数据库存档，清除浏览器 Cookie 会建立新角色。手动挑战是原型校验，支持账号恢复和输入回放校验；目标平台为手机浏览器，尚未适配微信小游戏。</p>`,`<button class="primary full" data-act="close">海风正好，出发吧 ${icon('arrow-up-right')}</button>`);
 }
 const root=$('#modal-root');root.innerHTML=html;const encounter=(type==='event'&&['attack','raid'].includes(state.event?.type))||(type==='event-result'&&['attack','raid'].includes(data?.type));root.classList.toggle('encounter-mode',encounter);drawIcons();setBusy();
 const mount=(selector,kind,options)=>{const host=root.querySelector(selector);if(!host)return;try{disposeFishPreview=createAdventureScene(host,kind,options);}catch(e){console.warn('Encounter scene unavailable',e);host.innerHTML='<p class="scene-fallback">3D 画面暂不可用，仍可使用下方按钮完成事件。奖励与进度会正常保存。</p>';}};
 if(type==='reward'){const host=root.querySelector('#catch-model'),fish=C.fish.find(f=>f.id===data?.fish?.[0]?.species);if(host&&fish){try{disposeFishPreview=createFishPreview(host,fish);}catch{host.innerHTML=fishArt(fish);}}}
 if(type==='pet'){const host=root.querySelector('#pet-model'),f=C.fish.find(f=>f.id===data);if(host&&f)disposeFishPreview=createFishPreview(host,f);}
 if(type==='event'&&state.event?.type==='attack')mount('#attack-world','attack',{...state.event,onTarget:i=>root.querySelector(`[data-act="attack"][data-index="${i}"]`)?.click()});
 if(type==='event'&&state.event?.type==='raid')mount('#raid-world','raid',{...state.event,onTarget:i=>root.querySelector(`[data-act="steal"][data-index="${i}"]`)?.click()});
 if(type==='event-result'&&data?.type==='attack')mount('#impact-world','attack-result',data);
 if(type==='event-result'&&data?.type==='raid')mount('#raid-world','raid-result',data);
 if(type==='manual')setupManual();
}
async function closeModal(){if(manual?.phase==='done')return;disposeFishPreview();disposeFishPreview=()=>{};if(manual){manual.controller?.abort();clearTimeout(manual.timeout);cancelAnimationFrame(manual.raf);const started=manual.session;manual=null;world.cast(false);if(started){try{const j=await request('manual/cancel',{session:started});state=j.state;if(j.social)socialInfo=j.social;if(j.result?.fish)toast('已保底收获这次鱼获，未额外扣除鱼饵');}catch(e){toast('挑战状态待确认，刷新后可恢复');}}}modal=null;$('#app').classList.remove('manual-active','town-detail-active');world.clearSelection?.();$('#bite-callout').hidden=true;world.feedback?.({phase:'idle',tension:0,progress:0,charge:0});world.freeze?.(false);$('#modal-root').hidden=true;$('#modal-root').innerHTML='';lastFocus?.focus?.();render();}
function spinCaption(title,detail){$('#cast-status').textContent=title;$('#cast-hint').textContent=detail;}
async function autoLand(){
 const session=manual?.session||state.manual?.id;if(!session||busy)return;stopAuto();const m=manual;if(m){m.controller?.abort();clearTimeout(m.timeout);cancelAnimationFrame(m.raf);}manual=null;busy=true;setBusy();
 try{const j=await request('manual/auto',{session});state=j.state;if(j.social)socialInfo=j.social;world.cast(false);world.freeze(false);render();openModal('reward',j.result);toast('已保底收获，未额外消耗鱼饵');}catch(e){toast(e.message);}finally{busy=false;setBusy();}
}
async function cast(chooseBest=true){
 if(!navigator.onLine){stopAuto();toast('请连接网络后再出海，离线不会扣除鱼饵');return;}
 if(busy||manual)return;if(state.event){stopAuto();openModal('event');return;}
 if(state.bait<bet){stopAuto();openModal('supply');return;}
 if(chooseBest){spot=rareChallenge?1:2;world.select(spot);}
 travelCancelled=false;busy=true;castPhase='sailing';setBusy();let animation;
 $('#cast').classList.add('fishing');spinCaption('正在寻找好钓点…','到达鱼群旁即自动抛竿');
 try{
  await world.approach();if(travelCancelled)return;if(document.hidden){stopAuto();return;}
  const start=performance.now();castPhase='casting';world.cast(true);spinCaption('鱼线入水…',`${bet} 鱼饵 · 等待海里的惊喜`);chirp();
  const animate=()=>{const elapsed=performance.now()-start;world.feedback({phase:elapsed<600?'cast':elapsed<1400?'wait':'reel',progress:Math.min(100,elapsed/2100*100),held:elapsed>1400});animation=requestAnimationFrame(animate);};animation=requestAnimationFrame(animate);
  const j=await request('fishing',{spot,bet,challenge:rareChallenge});await wait(Math.max(0,2050-(performance.now()-start)));state=j.state;if(j.social)socialInfo=j.social;cancelAnimationFrame(animation);
  if(j.result.type==='rare'){stopAuto();world.cast(false);render();openModal('manual');return;}
  if(!j.result.fish){stopAuto();world.cast(false);world.update(state,region);render();openModal(state.event?'event':'event-result',j.result);return;}
  world.catchFish(C.fish.find(f=>f.id===j.result.fish[0].species));spinCaption('上鱼啦！',autoFishing?'正在收好鱼获，准备下一次出海':'金币已到账，伙伴入住鱼缸');chirp('win');await wait(650);world.cast(false);render();
  if(autoFishing){toast(`${j.result.fish.length} 尾鱼获 · +${j.result.fish.reduce((n,f)=>n+f.price,0)} 金币`);}else openModal('reward',j.result);
  if(j.result.guide)toast('引导完成：'+j.result.guide+'，奖励已到账');
 }catch(e){stopAuto();toast(e.message||'连接中断，正在确认结果');world.cast(false);}finally{
  cancelAnimationFrame(animation);castPhase='idle';busy=false;$('#cast').classList.remove('fishing');spinCaption(autoFishing?'连续出海中':'海风正好，出海吧',autoFishing?'遇到事件或好鱼挑战时自动暂停':'点击鱼群即开钓 · SPIN 自动找好钓点');setBusy();
  if(pendingPage){const next=pendingPage;pendingPage=null;navigate(next);}
  if(autoFishing&&!modal&&!state.manual&&!state.event&&tab==='fish'&&!document.hidden)autoTimer=setTimeout(()=>cast(true),950);else if(autoFishing)stopAuto();
 }
}

async function handleClick(e){const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const act=b.dataset.act,i=Number(b.dataset.index);if(act!=='manual'&&act!=='close')chirp();switch(act){
 case 'nav':navigate(b.dataset.tab);break;
 case 'cast':cast(true);break;
 case 'auto-fish':if(autoFishing){stopAuto('已停止连续钓鱼');}else if(!manual){autoFishing=true;updateAuto();if(!busy)cast(true);}break;
 case 'challenge-toggle':rareChallenge=!rareChallenge;localStorage.setItem('tidebloom-rare-challenge',rareChallenge?'on':'off');renderModal();break;
 case 'manual-auto':await autoLand();break;
 case 'bet':if(!busy&&!manual){bet=[1,2,5][([1,2,5].indexOf(bet)+1)%3];render();}break;
 case 'close':closeModal();break;
 case 'base':navigate('base');break;
 case 'wallet':toast('鱼获自动结算金币，可用于扩张海岛与升级基地');break;
 case 'book':navigate('book');break;
 case 'more':case 'gear':case 'zones':case 'help':case 'captain':if(!busy){if(act==='gear')gearPreviewSpot=spot;openModal(act);}break;
 case 'gear-focus':gearFocus=i;renderModal();break;
 case 'gear-spot':gearPreviewSpot=i;renderModal();break;
 case 'captain-claim':transact('captain/claim',{},r=>toast(r.message));break;
 case 'skip-event-animation':disposeFishPreview.skip?.();break;
 case 'install':if(installPrompt){await installPrompt.prompt();installPrompt=null;}else toast('可使用浏览器菜单添加到主屏幕；iPhone 请在 Safari 分享菜单中选择添加到主屏幕');break;
 case 'social':openModal('social');break;
 case 'pvp-opt':transact('social/opt',{enabled:b.dataset.enabled==='true'});break;
 case 'friend-accept':transact('social/friend',{code:b.dataset.code});break;
 case 'visit':transact('social/start',{code:b.dataset.code,kind:b.dataset.kind},()=>openModal('event'));break;
 case 'revenge':transact('social/start',{revenge:b.dataset.ticket,kind:'attack'},()=>openModal('event'));break;
 case 'logout':await accountAction('logout',{});break;
 case 'encounter-choice':transact('event/encounter',{id:state.event?.id,choice:b.dataset.choice},r=>{closeModal();toast(r.message);});break;
 case 'world':openModal('world');break;
 case 'weekly':openModal('weekly');break;
 case 'weekly-claim':transact('weekly/claim',{id:b.dataset.id},r=>toast(r.message));break;
 case 'sea-go':transact('zone',{zone:i},()=>{world.zone(i);closeModal();tab='fish';world.view('fish');render();});break;
 case 'go-region':if(regionOpen(state,i)){region=i;navigate('map');}break;
 case 'journey':openModal('journey');break;
 case 'chapter-claim':transact('journey/claim',{});break;
 case 'train':transact('pet/train',{id:b.dataset.id},r=>toast(r.message));break;
 case 'mastery':transact('pet/mastery',{id:b.dataset.id,branch:b.dataset.branch});break;
 case 'decorate':transact('island/decorate',{region},r=>toast(r.message));break;
 case 'rescue':transact('rescue/claim',{},r=>toast(r.message));break;
 case 'orders':openModal('orders');break;
 case 'order-claim':transact('orders/claim',{id:b.dataset.id},r=>toast(r.message));break;
 case 'tank-select':$('#aquarium-page .pet-grid').scrollIntoView({behavior:'smooth',block:'start'});break;
 case 'tank-filter':document.querySelectorAll('.tank-filters button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.pet-card.unknown').forEach(x=>x.hidden=b.dataset.filter==='owned');break;
 case 'aquarium-info':openModal('aquarium-info');break;
 case 'pet':openModal('pet',b.dataset.id);break;
 case 'feed':transact('pet/feed',{id:b.dataset.id});break;
 case 'equip':transact('pet/equip',{id:b.dataset.id});break;
 case 'claim-collection':transact('collection/claim',{key:b.dataset.key.startsWith('sea')?b.dataset.key:Number(b.dataset.key)},()=>toast('收藏奖励已到账'));break;
 case 'event':if(state.event)openModal('event');break;
 case 'attack':transact('event/attack',{id:state.event?.id,target:i},r=>openModal('event-result',r));break;
 case 'raid-lesson':transact('raid/start',{},()=>openModal('event'));break;
 case 'infiltrate':transact('event/infiltrate',{id:state.event?.id});break;
 case 'steal':transact('event/steal',{id:state.event?.id,route:i},r=>{if(r.type==='raid')openModal('event-result',r);});break;
 case 'bank-raid':transact('event/bank',{id:state.event?.id},r=>openModal('event-result',r));break;
 case 'dig':transact('event/dig',{id:state.event?.id,cell:i},r=>{if(r.type==='treasure')openModal('event-result',r);});break;
 case 'guide':openModal('guide');break;
 case 'guide-go':{const g=GUIDES[state.guide];if(g){navigate(g.target);break;}const goal=nextObjective(state,C);if(goal.action==='event')openModal('event');else if(goal.action==='building'){navigate('map');openModal('base-building',goal.index);}else if(goal.action==='island'){region=goal.region;navigate('map');}else navigate(goal.action);break;}
 case 'guide-skip':transact('guide/skip',{},()=>closeModal());break;
 case 'reports':openModal('reports');break;
 case 'drill':transact('defense/drill',{},r=>toast(r.message));break;
 case 'repair':transact('base/repair',{index:i},r=>{closeModal();toast(r.message);});break;
 case 'sound':sound=!sound;localStorage.setItem('tidebloom-sound',sound?'on':'off');render();break;

 case 'base-upgrade':transact('base/upgrade',{index:i},()=>{closeModal();toast('基地扩建完成，产出效率提高了！');});break;
 case 'gear-upgrade':transact('gear/upgrade',{index:i},()=>toast('装备升级成功，成长已生效！'));break;
 case 'collect':transact('base/collect',{},()=>{world.collect();toast('海岛收益已到账');});break;
 case 'zone':transact('zone',{zone:i},()=>{world.zone(i);closeModal();toast(`已抵达${C.zones[i].name}`);});break;
 case 'region':if(!regionOpen(state,i)){toast('先完成前一座岛的扩张');break;}region=i;world.update(state,region);render();break;
 case 'build':openModal('build',i);break;
 case 'build-next':{const next=frontier(state,region)[0];if(next)openModal('build',next.id);else toast('本区域扩张完成');break;}
 case 'expand-confirm':transact('expand',{region,tile:b.dataset.tile},r=>{closeModal();toast(r.milestones.length?'扩张里程碑完成，奖励已到账':'新土地已解锁！');});break;
 case 'manual':if(!busy){if(state.event){openModal('event');}else if(state.bait<1)toast('鱼饵不足');else {await closeModal();busy=true;setBusy();await world.approach();busy=false;setBusy();openModal('manual');}}break;
 }}
function handleKey(e){if(e.code==='Escape'&&modal){closeModal();return;}if(e.code==='Tab'&&modal){const all=[...$('#modal-root').querySelectorAll('button:not(:disabled),[tabindex="0"]')];if(!all.length)return;if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0].focus();}}if(e.code==='Space'&&tab==='fish'&&!modal&&!e.repeat&&e.target===document.body){e.preventDefault();cast();}}
function setupManual(){
 const button=$('#manual-button');
 const encountered=state.manual?.source==='encounter';
 manual={phase:encountered?'request':'charge',encountered,held:false,power:0,chargeTime:0,last:performance.now(),session:null,profile:FIGHT_PROFILES[spot],fight:createFight(),controller:new AbortController()};
 const m=manual,signal=m.controller.signal;if(encountered){m.session=state.manual.id;$('#progress-label').textContent='收线进度';}
 const hint=(title,desc)=>{$('#manual-instructions').innerHTML=`<h3>${title}</h3><p>${desc}</p>`;};
 const cleanup=()=>{clearTimeout(m.timeout);cancelAnimationFrame(m.raf);m.controller.abort();};
 const finish=async(success,reason='timeout')=>{
  if(manual!==m||m.phase==='done')return;
  m.phase='done';m.held=false;cleanup();button.disabled=true;button.textContent='正在结算…';world.feedback({phase:'done'});
  try{
   const j=await request('manual/finish',{session:m.session,success,trace:m.trace||[],hook:((m.hookAt||m.started)-m.started)/1000,duration:m.fight.elapsed});state=j.state;if(j.social)socialInfo=j.social;manual=null;
   if(j.result.fish){world.catchFish(C.fish.find(f=>f.id===j.result.fish[0].species));$('#bite-callout').textContent=j.result.guaranteed?'平安收获':'漂亮！';$('#bite-callout').hidden=false;await wait(650);world.cast(false);$('#bite-callout').hidden=true;openModal('reward',j.result);chirp('win');}
   else{world.cast(false);$('#bite-callout').hidden=true;openModal('manual-result',{reason,compensation:j.result.compensation});}
   render();
  }catch(e){manual=null;try{const recovered=await request('manual/cancel',{session:m.session});state=recovered.state;}catch{}await closeModal();toast(e.message);}
 };
 const armFight=j=>{
   state=j.state;if(j.social)socialInfo=j.social;m.session=j.result.session;m.started=performance.now();m.profile=FIGHT_PROFILES[j.result.profile];
   world.cast(true);$('#bait').textContent=state.bait;$('#manual-profile').textContent=C.fish.find(f=>f.id===j.result.species).name+' · '+m.profile.name;
   m.phase='wait';m.timeout=setTimeout(()=>{
    if(manual!==m)return;m.phase='hook';$('#bite-callout').textContent='上钩了！';$('#bite-callout').hidden=false;world.feedback({phase:'hook'});navigator.vibrate?.(35);
    button.disabled=false;button.focus({preventScroll:true});button.textContent='有鱼上钩！点击提竿';button.classList.add('hook-now');hint('就是现在！','1.8 秒内提竿。');chirp('win');
    m.timeout=setTimeout(()=>finish(false,'hook'),1800);
   },1100);
 };
 const release=async()=>{
  advance(performance.now());if(m.phase==='reel'&&m.held)m.trace.push({t:m.fight.elapsed,held:false});m.held=false;
  if(manual!==m||m.phase!=='charge'||m.power<=0)return;
  m.phase='request';button.disabled=true;button.textContent='正在抛竿…';
  const precise=perfectCast(m.power);m.fight=createFight(m.power);
  hint(precise?'精准抛竿！起始进度 +12%':'鱼漂入水了…','耐心等候，咬钩时及时提竿。');
  try{
   const j=await request('manual/start',{spot,power:m.power});
   if(manual!==m){await request('manual/cancel',{session:j.result.session});return;}
   armFight(j);
  }catch(e){if(manual===m){cleanup();manual=null;await closeModal();}toast(e.message);}
 };
 const press=()=>{
  advance(performance.now());if(manual!==m)return;
  if(m.phase==='charge')m.held=true;
  else if(m.phase==='hook'){
   clearTimeout(m.timeout);m.phase='reel';m.held=false;m.trace=[];m.hookAt=performance.now();m.last=performance.now();$('#bite-callout').hidden=true;button.classList.remove('hook-now');button.textContent='按住收线 · 松开降张力';$('#progress-label').textContent='收线进度';
   hint('稳住，和大鱼周旋！',m.profile.tip+'。红区持续 1.2 秒会断线。');
  }else if(m.phase==='reel'){m.held=true;m.trace.push({t:m.fight.elapsed,held:true});}
 };
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);press();},{signal});
 button.addEventListener('pointerup',release,{signal});
 button.addEventListener('pointercancel',()=>{if(m.phase==='reel'&&m.held)m.trace.push({t:m.fight.elapsed,held:false});m.held=false;},{signal});
 button.addEventListener('lostpointercapture',()=>{if(m.phase==='reel'&&m.held)m.trace.push({t:m.fight.elapsed,held:false});m.held=false;},{signal});
 button.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat){e.preventDefault();press();}},{signal});
 button.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();release();}},{signal});
 window.addEventListener('blur',()=>{if(m.phase==='reel'&&m.held)m.trace.push({t:m.fight.elapsed,held:false});m.held=false;},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(m.phase==='reel'&&m.held)m.trace.push({t:m.fight.elapsed,held:false});m.held=false;}},{signal});
 function advance(now){
  if(manual!==m||m.phase==='done')return;
  const dt=Math.min(60,Math.max(0,(now-m.last)/1000));m.last=now;
  if(m.phase==='charge'&&m.held){m.chargeTime+=dt;const wave=(m.chargeTime*65)%200;m.power=wave<=100?wave:200-wave;}
  if(m.phase==='reel'){
   stepFight(m.fight,dt,m.held,m.profile,state.gear[0]);
   if(m.fight.result==='success'){if(now-m.started>=8000)finish(true);}
   else if(m.fight.result)finish(false,m.fight.result);
  }
 }
 function tick(now){
  if(manual!==m)return;advance(now);if(manual!==m||m.phase==='done')return;
  const f=m.fight,p=m.phase==='charge'?m.power:f.progress,phase=fightPhase(m.profile,f.elapsed);
  world.feedback({phase:m.phase,progress:f.progress,tension:f.tension,held:m.held,charge:m.power,struggle:m.phase==='reel'&&phase.id==='surge'});
  $('#manual-progress').style.width=p+'%';$('#manual-progress-text').textContent=Math.floor(p)+'%';$('#manual-tension').style.width=f.tension+'%';$('#manual-tension').style.background=f.tension>90?'#df6555':f.tension>70?'#e5ad4e':'#5caa91';$('#manual-tension-text').textContent=Math.floor(f.tension)+'%';
  button.classList.toggle('danger',f.tension>90);const status=$('#fight-status');status.dataset.phase=m.phase==='reel'?phase.id:m.phase;
  const caption=m.phase==='reel'?f.result==='success'?'鱼儿已靠岸，准备收获':(f.danger>0?'张力过高 · 立即松手':phase.name)+' · '+Math.max(0,Math.ceil(26-f.elapsed))+'秒':m.phase==='charge'?'绿色区 65–85% 松手：起始进度 +12%':m.phase==='hook'?'现在点击提竿！':'等待咬钩';if(status.textContent!==caption)status.textContent=caption;
  $('#manual-meters').classList.toggle('charging',m.phase==='charge');
  button.dataset.phase=m.phase;button.dataset.behavior=phase.id;button.dataset.tension=Math.floor(f.tension);
  m.raf=requestAnimationFrame(tick);
 }
 m.raf=requestAnimationFrame(tick);
 if(encountered){button.disabled=true;button.textContent='好鱼上钩，准备提竿…';hint('好鱼来了！','准备提竿，或选择保底收获。');request('manual/engage',{session:m.session}).then(j=>{if(manual===m)armFight(j);}).catch(async e=>{if(manual===m){cleanup();manual=null;await closeModal();toast(e.message);}});}
}
async function boot(){try{const r=await fetch('/api/bootstrap');if(!r.ok)throw Error('存档服务连接失败');const j=await r.json();state=j.state;if(j.social)socialInfo=j.social;C=j.config;$('#app').dataset.version=C.version;const interrupted=state.manual;if(interrupted){const recovered=await request('manual/cancel',{session:interrupted.id});state=recovered.state;}initUI();if(interrupted)toast(interrupted.source==='encounter'?'已保底收获上次遇见的好鱼，未额外扣除鱼饵':'上次练习已结束，鱼饵不重复扣除');}catch(e){$('#app').innerHTML=`<div class="boot-error"><h1>海风稍候，正在靠岸。</h1><p>${navigator.onLine?'暂时无法连接游戏服务，请稍后重新连接。':'当前处于离线状态。存档保留在服务器，连接网络后继续。'}</p><button class="primary" onclick="location.reload()">重新连接</button></div>`;console.error(e);}}
boot();

function expansionPreview(count,r){
 const rewards={1:'匠人小屋自动建成',5:'伙伴小屋建成 · 第二个随行位 · 10 鱼饵',10:'物资补给抵达 · 第三个随行位 · 4 海岛物资 · 10 鱼饵',15:'探索码头出现 · 升级宝藏奖励 · 5 海岛物资 · 10 鱼饵',20:'10 鱼饵',25:'下一座海岛开放 · 30 鱼饵'};
 if(r===0&&rewards[count])return '本次扩张：'+rewards[count];
 if(count%5===0)return '本次扩张：'+(count===25?'30 鱼饵':count===15?'10 鱼饵 · 5 海岛物资':'10 鱼饵');
 return `再扩张 ${5-count%5} 块，领取下一阶段的鱼饵奖励`;
}
function islandHeadline(){const n=points(region);if(n>=25)return region<C.regions.length-1?'区域完成！下一站：'+C.regions[region+1].name:'六岛建设完成，继续收集与周委托';if(region)return `${C.regions[region].name} · 扩张至 ${Math.ceil((n+1)/5)*5} 块`;return n<1?'扩张 1 块解锁匠人小屋':n<5?'扩张 5 块解锁伙伴小屋':n<10?'扩张 10 块开放第三个随行位':n<15?'扩张 15 块解锁探索码头':'完成 25 块解锁下一地区';}
function renderAdventure(){
 const g=GUIDES[state.guide];if(!g){const goal=nextObjective(state,C);$('#mobile-mission').innerHTML=`<button data-act="guide" class="guide-strip"><span>${icon('compass')} 目标</span><strong>${goal.title}</strong>${icon('chevron-right')}</button>`;}if(g)$('#mobile-mission').innerHTML=`<button data-act="guide" class="guide-strip"><span>${icon('flag')} ${state.guide+1}/8</span><strong>${g.name}</strong>${icon('chevron-right')}</button>`;
 $('#event-resume').hidden=!state.event||tab!=='fish';$('#event-resume').innerHTML=`${icon('compass')} 继续${state.event?.type==='attack'?' NPC 攻击':state.event?.type==='raid'?'偷袭':state.event?.type==='encounter'?'海域奇遇':'宝藏探索'}`;
 if(tab==='map'){const n=points(region),nextCost=C.buildCosts[Math.floor(n/5)]*(region+1),ready=state.pending.slice(1).some(v=>v>=1);$('#map-banner').innerHTML=`<div class="island-dock"><div class="island-next"><span>下一步 · ${n}/25</span><h2>${islandHeadline()}</h2><div class="progress-track"><span style="width:${n*4}%"></span></div></div><button class="primary full island-expand" data-act="${n>=25?'world':'build-next'}">${icon(n>=25?'compass':'plus')} ${n>=25?region===C.regions.length-1?'六岛巡游':'前往下一座岛':'扩张海岸'}<small>${n>=25?'六岛航线':nextCost+' 金币'}</small></button><div class="island-dock-bottom"><button data-act="collect" data-mutation data-unavailable="${!ready}">${icon('gift')} ${ready?'领取产出':'产出积累中'}<small>${Math.floor(state.pending[1])} 金币 · ${Math.floor(state.pending[2])} 物资 · ${Math.floor(state.pending[3])} 鱼宠粮</small></button><button data-act="reports" aria-label="海岛防守战报">${icon('shield')}<span>护盾 ${state.shields}/3</span></button></div></div>`;}

 const orders=$('#orders-entry');orders.innerHTML=`${icon('gift')}${readyOrder(state)?'<i class="ready-dot"></i>':''}`;orders.classList.toggle('ready',readyOrder(state));
 const page=$('#aquarium-page');page.hidden=tab!=='book';disposeAquarium();disposeAquarium=()=>{};if(tab!=='book')return;
 const found=C.fish.filter(f=>state.book[f.id]),b=bonuses(state,C.fish);
 const upcoming=COLLECTION_KEYS.find(k=>!state.collectionClaims.includes(k)),rewardReady=upcoming!==undefined&&collectionReady(state,C.fish,upcoming);
 page.innerHTML=`<div class="aquarium-title"><div><small>OCEAN COMPANIONS</small><h2>伙伴鱼缸 <span>${found.length}/${C.fish.length}</span></h2></div><button data-act="aquarium-info" class="tank-food">${icon('paw-print')} ${state.food}<small>鱼宠粮</small></button></div><div id="tank-world"></div>${found.length?'':'<p class="tank-empty">去钓到第一条鱼，把它带回家吧。</p>'}<section class="equipped-section"><div class="section-title"><strong>一起出海</strong><button data-act="aquarium-info">查看加成 ${icon('chevron-right')}</button></div><div class="equipped-slots">${[0,1,2].map(i=>{const id=state.equipped[i],f=C.fish.find(f=>f.id===id);return `<button data-act="${id?'pet':'tank-select'}" ${id?'data-id="'+id+'"':''} class="equipped-slot ${id?'filled':''}" ${i>=slots(state)?'disabled':''}>${id?fishArt(f):icon(i>=slots(state)?'lock':'plus')}<span>${id?f.name:i>=slots(state)?i===1?'扩张 5 块解锁':'扩张 10 块解锁':'选择伙伴'}</span>${id?'<small>Lv.'+state.pets[id].level+'</small>':''}</button>`;}).join('')}</div></section>${upcoming!==undefined?`<div class="collection-rewards"><button class="collection-next" data-act="${rewardReady?'claim-collection':'aquarium-info'}" data-key="${upcoming}" ${rewardReady?'data-mutation':''}><span>${icon('gift')}<strong>${typeof upcoming==='number'?'发现 '+upcoming+' 种伙伴':C.zones[Number(upcoming.slice(3))].name+'收藏'}</strong></span><b>${rewardReady?'领取奖励':found.length+'/'+(typeof upcoming==='number'?upcoming:C.fish.filter(f=>f.zone===Number(upcoming.slice(3))).length)}</b></button></div>`:''}<div class="section-title collection-heading"><strong>海洋伙伴</strong><div class="tank-filters"><button data-act="tank-filter" data-filter="all" class="active">全部</button><button data-act="tank-filter" data-filter="owned">已发现</button></div></div><div class="pet-grid">${[...found,...C.fish.filter(f=>!state.book[f.id])].map(f=>{const pet=state.pets[f.id];return `<button class="pet-card ${pet?'discovered':'unknown'}" data-act="pet" data-id="${f.id}" ${pet?'':'disabled'}>${fishArt(f,!pet)}<strong>${pet?f.name:'尚未发现'}</strong><small>${pet?ROLES[role(f.id,C.fish)]+' · Lv. '+pet.level:C.zones[f.zone].name}</small>${pet&&state.equipped.includes(f.id)?'<b class="following-badge">随行中</b>':''}</button>`;}).join('')}</div>`;

 const tank=[...found.filter(f=>state.equipped.includes(f.id)),...found.filter(f=>!state.equipped.includes(f.id))].slice(0,8);disposeAquarium=createAdventureScene($('#tank-world'),'aquarium',tank);
}
function adventureModal(type,data){
 if(type==='world')return modalShell('群岛远航图','六岛 · 六海域 · 36 种海洋伙伴',`<div class="world-list">${C.regions.map((r,i)=>`<article data-world="${i}" class="${regionOpen(state,i)?'open':'locked'}"><small>0${i+1} · ${r.en}</small><h3>${r.name}<b>${landCount(state,i)}/25</b></h3><p>${C.zones[i].name} · ${C.fish.filter(f=>f.zone===i).length} 种鱼宠</p><p>${regionOpen(state,i)?landCount(state,i)>=25?'本岛建设完成，继续收集或前往下一站':'点击相邻地块建设本岛':`完成${C.regions[i-1].name}的 25 块扩张后开放`}</p><button class="secondary full" data-act="go-region" data-index="${i}" ${!regionOpen(state,i)?'disabled':''}>${regionOpen(state,i)?'查看海岛':'尚未抵达'}</button><button class="text-button full" data-act="sea-go" data-index="${i}" data-mutation data-unavailable="${!zoneOpen(state,i)}">${!zoneOpen(state,i)?'先完成前一座岛':state.unlocked.includes(i)?'前往本岛海域钓鱼':'开放海域 · '+C.zones[i].cost+' 金币'}</button></article>`).join('')}</div>`);
 if(type==='weekly')return modalShell('每周航海委托',`周一北京时间 00:00 更新 · 徽章 ${state.weeklyBadges}`,`<p class="fineprint">本周采样海域：${C.zones[state.weekly.zone].name}。在已开放海域间按周轮换，完成一轮航线后更换采样与事件主题；三单全领获得永久远航徽章。</p><div class="order-list">${weeklyDefs(state.weekly).map(d=>{const n=state.weekly.counts[d.id],claimed=state.weekly.claimed.includes(d.id),ready=n>=d.target&&!claimed;return `<article><h3>${d.name}<b>${n}/${d.target}</b></h3><p>${d.detail}${d.zone!==undefined?' · '+C.zones[d.zone].name:''}</p><div class="progress-track"><span style="width:${n/d.target*100}%"></span></div><small>${Object.entries(d.reward).map(([k,v])=>v+' '+({coin:'金币',bait:'鱼饵',food:'鱼宠粮',supplies:'海岛物资'}[k])).join(' · ')}</small><button class="secondary full" data-act="weekly-claim" data-id="${d.id}" data-mutation data-unavailable="${!ready}">${claimed?'已领取':ready?'领取奖励':'进行中'}</button></article>`;}).join('')}</div>`);
 if(type==='social')return onlineView(state,socialInfo,modalShell,icon,data);
 if(type==='journey'){const v=journeyValues(state),current=state.journey.chapter;return modalShell('海岛故事',`${CHAPTERS.length} 章远航故事 · 纪念章 ${state.relics} 枚`,`<div class="chapter-list">${CHAPTERS.map((c,i)=>`<article class="${i===current?'active':''}"><small>第 ${i+1} 章 ${i<current?'· 已完成':''}</small><h3>${c.name}</h3><p>${c.detail}</p>${c.goals.map(([key,n,label])=>`<p>${label}<b>${Math.min(n,v[key]||0)}/${n}</b></p>`).join('')}${i===current?`<button class="primary full" data-act="chapter-claim" data-mutation data-unavailable="${!chapterReady(state)}">${chapterReady(state)?'领取本章奖励':'继续完成章节目标'}</button>`:''}</article>`).join('')}</div>`);}

 if(type==='orders')return modalShell('今日海岛订单','每日北京时间 00:00 更新',`<div class="order-list">${ORDER_DEFS.map(d=>{const n=state.orders.counts[d.id],claimed=state.orders.claimed.includes(d.id),available=n>=d.target&&!claimed;return `<article><h3>${d.name}<b>${n}/${d.target}</b></h3><p>${d.detail}</p><div class="progress-track"><span style="width:${n/d.target*100}%"></span></div><small>${Object.entries(d.reward).map(([k,v])=>`${v} ${ {coin:'金币',bait:'鱼饵',food:'鱼宠粮',supplies:'海岛物资'}[k]}`).join(' · ')}</small><button class="secondary full" data-act="order-claim" data-id="${d.id}" data-mutation data-unavailable="${!available}">${claimed?'已领取':available?'领取奖励':'进行中 · '+n+'/'+d.target}</button></article>`;}).join('')}</div>`,`<button class="primary full" data-act="weekly">查看本周远航委托</button><button class="text-button full" data-act="close">返回冒险</button>`);

 if(type==='event'&&state.event?.type==='encounter'){const c=ENCOUNTERS[state.event.kind]||ENCOUNTERS.wreck;return modalShell(c.name,'海域专属奇遇 · 选择一种行动',`<div class="encounter-art">${icon(c.icon)}</div><p>${c.detail}</p>`,`<button class="primary full" data-act="encounter-choice" data-choice="salvage" data-mutation>${c.coin} 金币 → ${rewardText(c.loot)}</button><button class="secondary full" data-act="encounter-choice" data-choice="rescue" data-mutation>${c.food} 鱼宠粮 → ${c.bait} 鱼饵 + ${c.relics} 纪念章</button><button class="text-button full" data-act="encounter-choice" data-choice="leave" data-mutation>安全离开 · 1 鱼饵</button>`);}
 if((type==='event'&&state.event?.type==='raid')||(type==='event-result'&&data?.type==='raid'))return raidView(state,modalShell,icon,data);
 if(type==='pet'){const f=C.fish.find(f=>f.id===data),pet=state.pets[data],r=role(data,C.fish),equipped=state.equipped.includes(data),cost=pet.level*3;return modalShell(f.name,`${ROLES[r]}伙伴 · Lv. ${pet.level}/10`,`<div id="pet-model"></div><div class="pet-info"><strong>${petDescription(data,pet.level,state.mastery[data])}</strong><p>捕获 ${state.book[data].count} 次 · 最大 ${(state.book[data].best/1000).toFixed(2)} kg</p><p>技能：${PET_SKILLS[data].name}。仅随行生效，同定位自动替换。</p>${pet.level<10?`<p class="pet-next">下一级：${petDescription(data,pet.level+1,state.mastery[data])}</p>`:""}<p>鱼宠粮 ${state.food} · 全队加成有上限</p>${pet.level>=5?state.mastery[data]?`<p>专精：${MASTERY[state.mastery[data]].name}</p>`:`<div class="mastery-choice">${Object.entries(MASTERY).map(([key,m])=>`<button data-act="mastery" data-id="${data}" data-branch="${key}" data-mutation><strong>${m.name}</strong><small>${m.detail}</small><small>11 海岛物资 · 选择后固定</small></button>`).join('')}</div>`:"<p>5 级开放专精分支</p>"}</div>`,`<button class="primary full" data-act="feed" data-id="${data}" data-mutation data-unavailable="${pet.level>=10||state.food<cost}">${pet.level>=10?'已满级':'喂养升级 · '+cost+' 鱼宠粮'}</button><button class="secondary full" data-act="equip" data-id="${data}" data-mutation>${equipped?'撤下随行':'设置随行'}</button><button class="secondary full" data-act="train" data-id="${data}" data-mutation data-unavailable="${state.food<2}">陪伴训练 · 2 鱼宠粮 · 默契 ${state.petBond?.[data]||0}</button>`);}
 if(type==='guide'){const g=GUIDES[state.guide];if(!g){const goal=nextObjective(state,C);return modalShell('下一步做什么','YOUR NEXT LITTLE ADVENTURE',`<div class="guide-detail"><h3>${goal.title}</h3><p>${goal.detail}</p><p>这是成长建议，不会额外收取资源。</p></div>`,`<button class="primary full" data-act="guide-go">前往目标</button>`);}return modalShell('下一步做什么','YOUR NEXT LITTLE ADVENTURE',`<div class="guide-detail"><h3>${g?.name||'新手旅程已完成'}</h3><p>${g?.detail||'继续扩张海岛，发现更多鱼宠与海上事件。'}</p><p>每步奖励：30 金币、3 鱼饵、3 鱼宠粮</p><ol>${GUIDES.map((x,i)=>`<li class="${i<state.guide?'done':''}">${i<state.guide?'✓ ':''}${x.name}</li>`).join('')}</ol></div>`,`<button class="primary full" data-act="guide-go">前往目标</button>${g?'<button class="text-button full" data-act="guide-skip">跳过引导，自由探索</button>':''}`);}
 if(type==='reports')return modalShell('海岛防守','NPC TRAINING · 无真人损失',`<div class="defense-shields">${'🛡️'.repeat(state.shields)||'暂无护盾'} <b>${state.shields}/3</b></div><p class="fineprint">守护贝壳补充护盾。受损建筑产出减半，维修不会降低建筑等级或收回土地。潮汐小屋始终正常恢复鱼饵。</p><div class="report-list">${state.reports.map(r=>`<p>${r.text}</p>`).join('')||'<p>海岛一切平静。可以主动体验一次防守演习。</p>'}</div>`,`<button class="primary full" data-act="drill" data-mutation data-unavailable="${!!state.drillDone}">${state.drillDone?'防守演习已完成':'开始一次 NPC 防守演习'}</button>`);
 if(type==='event'){const e=state.event;if(!e)return modalShell('事件已完成','OCEAN ADVENTURE','奖励已结算。');if(e.type==='attack')return modalShell('漂流瓶里的挑战',e.live?e.targetName+' · 真实海岛':'NPC 海岛 · 选择一个目标',`${rivalBanner(e,icon)}<div id="attack-world"></div><div class="event-summary">${e.shield?'对方有 1 层护盾，本次先破盾':'护盾已破，可直接攻击建筑'} · 攻击力 ${100+bonuses(state,C.fish).attack}</div><div class="attack-targets">${['码头小铺','匠人小屋','伙伴小屋'].map((n,i)=>`<button data-act="attack" data-index="${i}" data-mutation>${icon(['landmark','hammer','gift'][i])}<strong>${n}</strong><small>${e.live?'损伤目标 · 25 金币': ['金币 150','金币 95 + 海岛物资','金币 80 + 鱼宠粮'][i]} ×${e.bet}</small><small>破坏进度 ${e.damage[i]}/${[100,130,160][i]}</small></button>`).join('')}</div><p class="fineprint">${e.live?'真人互访：护盾抵挡不发奖，命中可用建筑后获得 25 金币；最多损伤两座，不降低建筑等级。':'破盾获得 25 金币 × 倍率；未破坏时获得 45 金币 × 倍率。'}关闭后可继续。引导完成后，每 3 次攻击会触发一次 NPC 还击；最多同时损伤两座建筑。</p>`);
 if(e.format===SHELL_FORMAT)return modalShell('潮汐寻珠','TIDAL TREASURES · 三枚相遇',shellBoard(e,icon));
 return modalShell('宝藏岛的秘密','NPC EXPLORATION · 三次挖掘',`<div class="treasure-intro">${icon('compass')} ${points(0)>=15?'探索码头已解锁 · 高级宝藏':'选择藏点，发现这片岛的秘密'} <strong>${e.picks.length}/3</strong></div><div class="dig-grid">${Array.from({length:6},(_,i)=>{const pick=e.picks.find(p=>p.cell===i);return `<button data-act="dig" data-index="${i}" data-mutation data-unavailable="${!!pick}" class="${pick?'revealed':''} ${e.hint===i?'hinted':''}">${pick?pick.reward.trap?'空藏点':pick.reward.coin?'🪙 '+pick.reward.coin:pick.reward.food?'🐾 '+pick.reward.food:'🧱 '+pick.reward.supplies:'✦'}<small>${pick?'已揭晓':e.hint===i?'宠物发现线索':'藏点 '+(i+1)}</small></button>`;}).join('')}</div><p class="fineprint">三次挖掘后一起到账。空藏点不会扣除已有资源。探索宠物提高金币奖励，并指示大奖位置。</p>`);}
 if(data.type==='treasure'&&data.format===SHELL_FORMAT)return modalShell('潮汐的馈赠','TIDAL TREASURES',shellWin(data,icon),`<button class="primary full" data-act="close">收好宝藏，继续出海</button>`);
 const title=data.type==='attack'?data.blocked?'护盾击破！':data.broken?'建筑击破！':'攻击命中！':data.type==='treasure'?'宝藏满载而归':data.type==='shield'?'钓到了守护贝壳':'钓到了海上补给箱';const detail=data.type==='attack'?`获得 ${data.coin} 金币${data.supplies?' · 海岛物资 +'+data.supplies:''}${data.food?' · 鱼宠粮 +'+data.food:''}${data.broken?'，目标已击破':'，对方进度已保存'}`:data.type==='treasure'?`金币 ${data.total.coin} · 海岛物资 ${data.total.supplies} · 鱼宠粮 ${data.total.food}`:data.type==='shield'?data.full?'护盾已满，转为 2 鱼饵':`护盾 +1，当前 ${state.shields}/3`:`鱼宠粮 +${data.food} · 海岛物资 +${data.supplies} · 鱼饵 +${data.bait}`;
 return modalShell(title,'A SURPRISE FROM THE SEA',`${data.type==='attack'?rivalBanner(data,icon)+'<div id="impact-world"></div>':''}<div class="event-prize">${icon(data.type==='attack'?'zap':data.type==='treasure'?'gem':data.type==='shield'?'shell':'gift')}</div><h3 class="event-reward">${detail}</h3>${data.xpGain?`<p class="encounter-xp">船长经验 +${data.xpGain}</p>`:""}${data.guide?'<p class="fineprint">新手目标完成，额外奖励已到账。</p>':''}${data.defense?`<p class="fineprint">${data.defense}</p>`:''}`,`<button class="primary full" data-act="close">继续冒险</button>`);
}
async function accountAction(mode,params){
 if(busy)return;busy=true;setBusy();try{const r=await fetch('/api/account/'+mode,{signal:AbortSignal.timeout(12000),method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...params,requestId:crypto.randomUUID()})});const j=await r.json();if(!r.ok)throw Error(j.error);state=j.state;socialInfo=j.social;region=0;world.zone(state.zone);world.update(state,region);render();openModal('social',j.result);toast(j.result.message);}catch(e){toast(e.message);}finally{busy=false;setBusy();}
}
async function handleSubmit(e){if(e.target.id==='account-form'){e.preventDefault();const form=new FormData(e.target);await accountAction(e.submitter?.dataset.mode||'login',Object.fromEntries(form));}else if(e.target.id==='key-form'){e.preventDefault();await accountAction('key',{name:socialInfo.account.name,password:new FormData(e.target).get('password')});}else if(e.target.id==='friend-form'){e.preventDefault();transact('social/friend',{code:new FormData(e.target).get('code')});}}

let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;toast('可在船长面板选择安装到手机');});
window.addEventListener('offline',()=>{document.documentElement.dataset.offline='true';toast('网络已断开，存档在服务器；联网后继续，不会离线扣饵');});
window.addEventListener('online',()=>{delete document.documentElement.dataset.offline;if(!state){location.reload();return;}toast('已恢复网络，关闭面板后自动同步');});
if(import.meta.env.PROD&&'serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
