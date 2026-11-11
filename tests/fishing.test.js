import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGHT_PROFILES,createFight,stepFight,fightPhase,perfectCast} from '../shared/fishing.js';
import {nextObjective} from '../shared/objectives.js';
import {initialState,settle,action} from '../server/engine.js';
import {config as C} from '../server/config.js';

const now=100000000;
function fresh(){const s=initialState(now);settle(s,now);s.guide=8;return s;}
function simulate(profile,mode,hz=60,gear=0){
 const f=createFight(75);let held=false;
 for(let n=0;n<hz*30&&!f.result;n++){
  if(mode==='hold')held=true;
  else if(mode==='release')held=false;
  else {const phase=fightPhase(profile,f.elapsed).id;if(phase==='surge'||f.tension>75)held=false;else if(f.tension<40||phase==='recovery')held=true;}
  stepFight(f,1/hz,held,profile,gear);
 }
 return f;
}
test('all three fights have readable warning and recovery windows',()=>{
 assert.equal(new Set(FIGHT_PROFILES.map(p=>p.calm+p.warning+p.surge+p.recovery)).size,3);
 for(const p of FIGHT_PROFILES){
  assert.equal(fightPhase(p,p.calm+.1).id,'warning');
  assert.equal(fightPhase(p,p.calm+p.warning+.1).id,'surge');
  const f=createFight();f.elapsed=p.calm+p.warning+p.surge+.1;f.tension=80;
  stepFight(f,.3,false,p);assert.ok(f.tension<80);
 }
});
test('every fight can be won by responding to tension and surge, holding blindly breaks the line',()=>{
 for(const p of FIGHT_PROFILES){assert.equal(simulate(p,'auto').result,'success');assert.equal(simulate(p,'hold').result,'line');assert.equal(simulate(p,'release').result,'timeout');}
});
test('fight timing remains stable at 30, 60 and 120 fps',()=>{
 for(const p of FIGHT_PROFILES){const runs=[30,60,120].map(hz=>simulate(p,'auto',hz));assert.ok(runs.every(f=>f.result==='success'));assert.ok(Math.max(...runs.map(f=>f.elapsed))-Math.min(...runs.map(f=>f.elapsed))<.3);}
});
test('precision window gives actual starting advantage; rod upgrade lowers tension',()=>{
 for(const power of [65,75,85]){assert.ok(perfectCast(power));assert.equal(createFight(power).progress,12);}
 for(const power of [0,64,86,100])assert.equal(createFight(power).progress,0);
 const a=createFight(),b=createFight();stepFight(a,1,true,FIGHT_PROFILES[0],0);stepFight(b,1,true,FIGHT_PROFILES[0],5);assert.ok(b.tension<a.tension);assert.equal(b.progress,a.progress);
});
test('manual session chooses fish before the fight and settlement keeps that species',()=>{
 const s=fresh();s.zone=1;const r=action(s,'manual/start',{spot:1},now,()=>.99);
 assert.equal(r.species,'manta');assert.equal(s.manual.species,r.species);assert.ok(FIGHT_PROFILES[r.profile]);
 const reward=action(s,'manual/finish',{session:r.session,success:true},now+10000,()=>0);
 assert.equal(reward.fish[0].species,r.species);assert.equal(s.bait,39);
 assert.throws(()=>action(s,'manual/finish',{session:r.session,success:true},now+11000),/已结束/);
});
test('expired or malformed success rejects; stale cancellation cannot end a newer session',()=>{
 const s=fresh();const r=action(s,'manual/start',{spot:0},now);
 assert.throws(()=>action(s,'manual/finish',{session:r.session,success:'true'},now+10000),/无效/);
 assert.throws(()=>action(s,'manual/finish',{session:r.session,success:true},now+46000),/超时/);
 action(s,'manual/cancel',{session:r.session},now+46000);
 const next=action(s,'manual/start',{spot:2},now+47000);
 assert.throws(()=>action(s,'manual/cancel',{session:r.session},now+47000),/不匹配/);
 assert.equal(s.manual.id,next.session);assert.equal(s.bait,38);
});
test('next objective prioritizes saved events, available rewards and damaged production',()=>{
 const s=fresh();s.event={type:'treasure'};assert.equal(nextObjective(s,C).action,'event');s.event=null;
 s.book.clown={count:1,best:500};settle(s,now);s.damage[1]=true;
 assert.equal(nextObjective(s,C).action,'book');s.collectionClaims=[1];assert.equal(nextObjective(s,C).index,1);
 s.damage[1]=false;assert.match(nextObjective(s,C).detail,/随行/);s.equipped=['clown'];assert.equal(nextObjective(s,C).action,'island');
});
test('expansion objectives route missing resources and never suggest a nonexistent third island',()=>{
 const s=fresh();s.coin=0;assert.match(nextObjective(s,C).title,/领取/);s.pending[1]=0;assert.equal(nextObjective(s,C).action,'fish');
 s.coin=10000;s.nodes[0]=[5,5,4,0,0];s.base[3]=1;assert.equal(nextObjective(s,C).index,3);s.materials=2;assert.equal(nextObjective(s,C).action,'island');
 s.nodes=[[5,5,5,5,5],[5,5,5,5,5]];assert.equal(nextObjective(s,C).action,'zones');
});
