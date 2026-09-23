// Approved portrait art; the original symbol IDs and all payout math stay intact.
export const OUTLAW_NAMES=Object.freeze({bottle:'THE RUSTLER',guns:'THE GUNFIGHTER',bandit:'THE RINGLEADER'});
export const OUTLAW_FILES=Object.freeze({bottle:'rustler',guns:'gunfighter',bandit:'ringleader'});
export const OUTLAW_HEAD=Object.freeze({bottle:[.55,.37],guns:[.56,.37],bandit:[.46,.37]});
export function payingOutlaws(step){
 const target=step.blood?.target;
 if(!OUTLAW_FILES[target])return [];
 return [...new Map((step.result?.groups||[]).filter(g=>g.symbol===target&&g.exactTenths>0)
  .flatMap(g=>g.cells||[]).filter(([c,r])=>!step.wilds?.[c]&&step.grid?.[c]?.[r]===target)
  .map(p=>[p.join(':'),p.slice()])).values()];
}
export function createOutlawArt(){
 const tiles={},portraits={};let loading;
 return {
  load(){return loading??=Promise.all(Object.entries(OUTLAW_FILES).flatMap(([symbol,file])=>[false,true].map(async dead=>{
   const key=symbol+(dead?'-dead':''),im=new Image();im.src=`assets/ink-western/${file}${dead?'-dead':''}.webp`;await im.decode();portraits[key]=im;
   // Crop only the printed portrait, keeping its approved face, hat and clothing.
   const tile=document.createElement('canvas');tile.width=330;tile.height=297;const c=tile.getContext('2d');c.imageSmoothingQuality='high';
   c.drawImage(im,im.width*.02,im.height*.195,im.width*.96,im.height*.64,0,0,330,297);
   c.strokeStyle='#241910';c.lineWidth=5;c.strokeRect(1,1,328,295);tiles[key]=tile;
  })));},
  tile:(symbol,dead=false)=>tiles[symbol+(dead?'-dead':'')],
  portrait:(symbol,dead=false)=>portraits[symbol+(dead?'-dead':'')],
  get tiles(){return tiles;}
 };
}
