// Ambient choreography only. Never shares a clock or randomness with game math.
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const hold=(t,start,rise,stay,fall)=>ease((t-start)/rise)*(1-ease((t-start-rise-stay)/fall));
export const sceneWind=t=>.55*Math.sin(t*.71)+.3*Math.sin(t*1.39+.8)+.15*Math.sin(t*2.83+1.2);
export function crowPose(t){
 const phase=(t+1.2)%19.7;
 const look=hold(phase,2,.45,1.1,.8)-.72*hold(phase,8.4,.38,.65,.7)+.58*hold(phase,14.4,.55,1.5,.85);
 const ruffle=hold(phase,11.6,.18,.12,.62)*Math.sin((phase-11.6)*28);
 let blink=0;for(const at of [3.5,7.3,7.62,15.8])blink=Math.max(blink,hold(phase,at,.045,.035,.085));
 return {head:look*.12,breath:Math.sin(t*2.15)*.75,tail:sceneWind(t)*.023,ruffle,blink};
}
export function gunslingerIdle(t){
 // Unequal holds, a slow breath and a small transfer of weight. Boots stay put.
 const phase=t%23.1;
 const weight=hold(phase,3.2,1.4,2.1,1.8)-.65*hold(phase,13.4,1.9,2.8,1.6);
 return {lean:.0033*weight+.0015*Math.sin(t*.91),breath:.0044*Math.sin(t*1.58)+.0008*Math.sin(t*3.16+.5)};
}
