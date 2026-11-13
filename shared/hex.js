export const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const key=(q,r)=>`${q},${r}`;
export const distance=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));
export const starter=[[0,0],...directions].map(([q,r])=>key(q,r));
export const tiles=[];
for(let radius=2;radius<=3;radius++)for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++)if(distance(q,r)===radius)tiles.push({id:key(q,r),q,r});
tiles.splice(25);
export const reefTiles=[{id:'0,0',q:0,r:0}];
for(let radius=1;radius<=3;radius++)for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++)if(distance(q,r)===radius)reefTiles.push({id:key(q,r),q,r});
reefTiles.splice(25);
export const reefStart=(s,region)=>s.onboarding?.version===1&&region===0;
export const starterFor=(s,region)=>reefStart(s,region)?[]:starter;
export const tilesFor=(s,region)=>reefStart(s,region)?reefTiles:tiles;
export const owned=(s,region)=>s.expansion?.[region]||tilesFor(s,region).slice(0,s.nodes[region].reduce((a,b)=>a+b,0)).map(t=>t.id);
export const buildingTile=(s,i,region=0)=>reefStart(s,region)?owned(s,region)[[2,0,7,4][i]]:['0,0','1,0','0,1','-1,0'][i];
export function frontier(s,region){const set=new Set([...starterFor(s,region),...owned(s,region)]);if(reefStart(s,region)&&!set.size)return [reefTiles[0]];return tilesFor(s,region).filter(t=>!set.has(t.id)&&directions.some(([q,r])=>set.has(key(t.q+q,t.r+r))));}
export const position=(q,r)=>[Math.sqrt(3)*(q+r/2)*1.18,r*1.77];
