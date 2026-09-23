// Presentation-only camera impulse. Identical trajectory at every refresh rate.
export function createImpactMotion({reduced=false}={}){
 let hit=null;
 return {
  kick(strength=1,now=performance.now()){if(!reduced)hit={strength:hit?.start===now?Math.max(hit.strength,strength):strength,start:now};},
  sample(now=performance.now()){
   if(!hit)return {x:0,y:0};
   const t=(now-hit.start)/1000;if(t<0||t>=.32)return {x:0,y:0};
   const envelope=Math.exp(-t*19)*(1-t/.32),a=hit.strength*envelope;
   return {x:Math.sin(t*73)*a*.32,y:Math.sin(t*57)*a*.65};
  },
  clear(){hit=null;}
 };
}
