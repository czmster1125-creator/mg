export const GEAR_MAX=10;
export const EQUIPMENT=[
 {name:'潮汐钓竿',icon:'fishing-rod',role:'发现伙伴',effect:'幸运提高好鱼权重，操控让收线更稳'},
 {name:'贝光鱼钩',icon:'anchor',role:'收获成长',effect:'更容易钓到较大体型，鱼价按实际重量结算'},
 {name:'航海罗盘',icon:'compass',role:'海上探索',effect:'提高寻珠金币，5／10 级增加寻珠与补给物资'}
];
export function gearCost(level){return level>=GEAR_MAX?null:{coin:80*(level+1),supplies:2*(level+1)};}
export const gearStage=lv=>lv>=10?'星辉匠作':lv>=5?'海风精制':'海湾初作';
export function gearEffects(s){const [rod=0,hook=0,compass=0]=s.gear||[];return {luck:rod*.06,control:Math.min(5,rod),weightBias:hook*.025,explore:compass*.03,crates:Math.floor(compass/5)};}
export function rarityProbabilities(s,spot=0){const b=gearEffects(s).luck,w=[.78,spot===1?.13:.17,(spot===1?.085:.045)*(1+b),.005*(1+b)],sum=w.reduce((a,b)=>a+b,0);return w.map(v=>v/sum);}
export function chooseRarity(s,spot,r){const p=rarityProbabilities(s,spot);let total=0;for(let i=3;i>=0;i--){total+=p[i];if(r<total)return i;}return 0;}
export function migrateEquipment(s){
 if(s.gearVersion>=2)return;
 const [rod=0,bait=0,charm=0]=s.gear||[0,0,0],duplicate=Math.min(rod,bait),investment=n=>n*(n+1);
 const supplies=investment(duplicate)+investment(charm),coin=supplies*40;
 s.gear=[Math.max(rod,bait),charm,0];s.coin+=coin;s.supplies+=supplies;
 s.gearMigration={coin,supplies,old:[rod,bait,charm]};s.gearVersion=2;
}
