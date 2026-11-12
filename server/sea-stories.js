import {randomUUID} from 'node:crypto';
import {STORY_FORMAT,initSeaStories,storyChoices,storyDefinition} from '../shared/sea-stories.js';
import {bonuses,role} from '../shared/adventure.js';
export function startSeaStory(s,rng,fish){
 initSeaStories(s);const b=bonuses(s,fish),zone=s.zone,episode=s.seaStories.visits[zone]%2;
 const companion=fish.find(f=>s.equipped.includes(f.id)&&role(f.id,fish)===2);
 s.event={id:randomUUID(),type:'encounter',format:STORY_FORMAT,zone,episode,stage:'approach',risk:35-Math.min(15,Math.floor((b.explore||0)*100)),roll:rng(),paid:{},companion:companion?.name||null};
 s.seaStories.lastCast=s.adventureCasts;return {type:'encounter',event:true};
}
export function seaStoryAction(s,p,now){
 const e=s.event;if(e?.format!==STORY_FORMAT)return null;
 if(e.type!=='encounter'||e.id!==p.id)throw Error('故事已结束或编号无效');
 if(p.stage!==e.stage)throw Error('故事进度已变化，请查看当前选择');
 const choice=storyChoices(e).find(c=>c.id===p.choice);if(!choice)throw Error('请选择当前故事中的有效行动');
 for(const[k,n]of Object.entries(choice.cost))if(s[k]<n)throw Error(k==='coin'?'调查金币不足，也可选择援助或离开':'鱼宠粮不足，也可选择调查或离开');
 if(e.stage==='approach'&&p.choice!=='leave'){
  for(const[k,n]of Object.entries(choice.cost)){s[k]-=n;e.paid[k]=(e.paid[k]||0)+n;}
  e.path=p.choice;e.stage='decision';return {type:'story-step',event:true,message:p.choice==='help'?'伙伴已收到补给，请选择接下来的援助':'已做好调查准备，请选择稳妥修复或冒险探寻'};
 }
 const failed=p.choice==='explore'&&e.roll*100<e.risk,reward=failed?choice.fallback:choice.reward;
 for(const[k,n]of Object.entries(reward))s[k]+=n;
 const definition=storyDefinition(e),ended=p.choice!=='leave',memory=ended?`${e.zone}:${e.episode}:${choice.ending}`:null,fresh=memory&&!s.seaStories.memories.includes(memory);
 if(fresh)s.seaStories.memories.push(memory);
 if(ended){s.seaStories.visits[e.zone]++;s.seaStories.recent.unshift({zone:e.zone,episode:e.episode,ending:choice.ending,failed,at:now});s.seaStories.recent=s.seaStories.recent.slice(0,12);}
 const result={type:'encounter',format:STORY_FORMAT,storyCompleted:true,zone:e.zone,episode:e.episode,choice:p.choice,ending:choice.ending||null,failed,reward,paid:e.paid,fresh:!!fresh,companion:e.companion,name:definition.name,epilogue:ended?definition.ending:'小艇驶回熟悉的航线，这段故事留待下次相遇。',message:ended?'海上故事已记录':'已平安离开'};
 s.event=null;return result;
}
