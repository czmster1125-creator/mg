export const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const key=(q,r)=>`${q},${r}`;
export const distance=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));
export const starter=[[0,0],...directions].map(([q,r])=>key(q,r));
export const tiles=[];
for(let radius=2;radius<=3;radius++)for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++)if(distance(q,r)===radius)tiles.push({id:key(q,r),q,r});
tiles.splice(25);
export const owned=(s,region)=>s.expansion?.[region]||tiles.slice(0,s.nodes[region].reduce((a,b)=>a+b,0)).map(t=>t.id);
export function frontier(s,region){const set=new Set([...starter,...owned(s,region)]);return tiles.filter(t=>!set.has(t.id)&&directions.some(([q,r])=>set.has(key(t.q+q,t.r+r))));}
export const position=(q,r)=>[Math.sqrt(3)*(q+r/2)*1.18,r*1.77];
