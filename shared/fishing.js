// Shared, deterministic fight rules. Time is measured in seconds.
export const FIGHT_PROFILES = [
  {id:'steady', name:'游弋型', tip:'平稳收线，预警时准备松手', calm:3, warning:.8, surge:1, recovery:1.5, pull:19, burst:36, gain:17},
  {id:'dart', name:'冲刺型', tip:'短促冲刺频繁，抓住回气窗口', calm:1.8, warning:.7, surge:1.2, recovery:1.8, pull:18, burst:43, gain:18},
  {id:'heavy', name:'耐力型', tip:'持续拉力较强，分段收线', calm:3.3, warning:1, surge:1.6, recovery:2, pull:25, burst:38, gain:17}
];
export const FAILURE_REASONS = {
  hook:{title:'提竿晚了一步', tip:'看到「上钩了」后，1.8 秒内点击提竿。'},
  line:{title:'鱼线绷断了', tip:'张力接近红区时松开，等鱼儿回气再收线。'},
  timeout:{title:'鱼儿游远了', tip:'回气时按住收线，26 秒内将进度拉满。'}
};
export const perfectCast = power => power >= 65 && power <= 85;
export function createFight(power=0) {
  return {elapsed:0, progress:perfectCast(power)?12:0, tension:perfectCast(power)?18:25, danger:0, result:null};
}
export function fightPhase(profile,elapsed) {
  const cycle=profile.calm+profile.warning+profile.surge+profile.recovery;
  const t=elapsed%cycle;
  if(t<profile.calm)return {id:'calm',name:'平稳游动 · 按住收线'};
  if(t<profile.calm+profile.warning)return {id:'warning',name:'即将冲刺 · 准备松手'};
  if(t<profile.calm+profile.warning+profile.surge)return {id:'surge',name:'鱼在冲刺 · 松开降张力'};
  return {id:'recovery',name:'鱼儿回气 · 趁机收线'};
}
export function stepFight(fight,seconds,held,profile,gear=0) {
  let remaining=Math.max(0,Math.min(60,seconds));
  while(remaining>1e-8&&!fight.result) {
    const dt=Math.min(.02,remaining);remaining-=dt;
    const phase=fightPhase(profile,fight.elapsed).id;
    const surge=phase==='surge', recovery=phase==='recovery';
    const gain=recovery?24:surge?7:profile.gain;
    const pull=(surge?profile.burst:recovery?10:profile.pull)*(1-Math.min(5,Math.max(0,gear))*.08);
    fight.progress=Math.max(0,Math.min(100,fight.progress+(held?gain:surge?-4:0)*dt));
    fight.tension=Math.max(0,Math.min(100,fight.tension+(held?pull:surge?-22:-34)*dt));
    fight.danger=fight.tension>95?fight.danger+dt:0;
    fight.elapsed+=dt;
    if(fight.danger>=1.2)fight.result='line';
    else if(fight.progress>=100)fight.result='success';
    else if(fight.elapsed>=26)fight.result='timeout';
  }
  return fight;
}
