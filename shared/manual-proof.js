import {createFight,stepFight,FIGHT_PROFILES} from './fishing.js';
export function replayFight(session,p,elapsed){
 if(!Array.isArray(p.trace)||p.trace.length>160||!Number.isFinite(p.duration)||p.duration<0||p.duration>26.2||!Number.isFinite(p.hook)||p.hook<.9||p.hook>4.5||p.hook+p.duration>elapsed+.6)return false;
 const f=createFight(session.power||0),profile=FIGHT_PROFILES[session.profile||0];let last=0,held=false;
 for(const e of p.trace){if(!Number.isFinite(e.t)||e.t<last||e.t>p.duration||typeof e.held!=='boolean')return false;stepFight(f,e.t-last,held,profile,session.gear||0);last=e.t;held=e.held;}
 stepFight(f,p.duration-last+.08,held,profile,session.gear||0);return f.result==='success';
}
