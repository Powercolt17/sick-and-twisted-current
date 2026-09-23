// Presentation randomness is independent of the already-confirmed paid result.
const SYMBOLS=['ten','j','q','k','a','bottle','cuffs','guns','bandit','star'];
export const presentationRandom=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;};
function shuffle(values,rng){const a=[...values];for(let i=a.length-1;i>0;i--){const u=rng();if(!Number.isFinite(u)||u<0||u>=1)throw Error('Invalid presentation RNG');const j=Math.floor(u*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function featurePurchaseEntry(scatterCount,rng=presentationRandom){
 if(![3,4,5].includes(scatterCount))throw Error('Feature entry requires three, four or five scatters');
 // Disjoint first two columns prevent an unpaid winning combination in this
 // entry display. They do not determine or replace any free-spin outcome.
 const palette=shuffle(SYMBOLS,rng),grid=Array.from({length:6},(_,c)=>c<2?shuffle(palette.slice(c*4,c*4+4),rng):shuffle(SYMBOLS,rng).slice(0,4));
 const columns=shuffle([0,1,2,3,4,5],rng).slice(0,scatterCount),cells=[];
 for(const c of columns){const r=Math.floor(rng()*4);grid[c][r]='scatter';cells.push([c,r]);}
 cells.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return {grid,cells};
}
