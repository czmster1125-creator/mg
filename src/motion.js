/** Frame-rate-independent steering on the water plane; radians, world units, seconds. */
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function angleDelta(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
export function stepBoat(body,target,dt){
 dt=clamp(dt,0,.1);
 const dx=target.x-body.x,dz=target.z-body.z,distance=Math.hypot(dx,dz);
 const desiredSpeed=distance<.025?0:Math.min(4.2,distance*2.8);
 body.speed+=(desiredSpeed-body.speed)*(1-Math.exp(-6*dt));
 if(distance>.025){
  const heading=Math.atan2(dx,dz),turn=angleDelta(body.heading,heading);
  body.heading+=clamp(turn,-3.8*dt,3.8*dt);
  const movement=Math.min(distance,body.speed*dt);
  body.x+=dx/distance*movement;body.z+=dz/distance*movement;
  body.bank+=(clamp(turn,-1,1)*body.speed*.035-body.bank)*(1-Math.exp(-7*dt));
 }else{body.speed*=Math.exp(-8*dt);body.bank*=Math.exp(-7*dt);}
 return distance<.14&&body.speed<.45;
}
export function waterBounds(x,z){return {x:clamp(x,-4.8,4.8),z:clamp(z,-4.2,10.8)};}
