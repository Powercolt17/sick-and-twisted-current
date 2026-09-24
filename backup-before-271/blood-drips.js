// Dripping blood on a painted border. Presentation only: no timers, uses the game's motion clock.
// Emitters are drip tips found in the art offline: [x, y, run, length] in source-image pixels.
//   run=0: the tip hangs over open air, so a bead swells, lets go and falls (gravity, stretching as it goes).
//   run=1: the tip is on the wood, so a bead swells and runs down the surface, leaving a brief wet trail.
// A single pre-rendered teardrop sprite is scaled per drop, so a frame costs one drawImage per live drop.
const hash=i=>{let h=(i+1)*2654435761>>>0;h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return (h>>>0)/4294967295;};
const ease=x=>x*x*(3-2*x);
function sprite(doc){
 const c=doc.createElement('canvas');c.width=48;c.height=72;const g=c.getContext('2d');
 // Teardrop, point up: round body at the bottom, tapering to the attachment point at the top.
 g.beginPath();g.moveTo(24,2);g.bezierCurveTo(30,22,46,34,46,48);g.arc(24,48,22,0,Math.PI,false);g.bezierCurveTo(2,34,18,22,24,2);g.closePath();
 const body=g.createRadialGradient(18,44,2,24,50,26);body.addColorStop(0,'#d0141f');body.addColorStop(.55,'#8e0610');body.addColorStop(1,'#3c0206');
 g.fillStyle=body;g.fill();g.lineWidth=1.5;g.strokeStyle='rgba(20,0,2,.55)';g.stroke();
 g.fillStyle='rgba(255,210,210,.6)';g.beginPath();g.ellipse(16,42,4.5,7,-.35,0,Math.PI*2);g.fill();
 g.fillStyle='rgba(255,240,240,.85)';g.beginPath();g.arc(15,39,1.8,0,Math.PI*2);g.fill();
 return c;
}
export function dripState(i,t,emitter){
 const [,,run,len]=emitter,h=hash(i),P=2.4+h*3.2,phase=hash(i+97)*P,r0=6+hash(i+31)*4;
 const u=((t+phase)%P)/P;
 if(u<.55){const s=ease(u/.55);return {stage:'swell',offset:0,r:r0*(.3+.7*s),stretch:1+.35*s,alpha:1,trail:0};}
 if(u<.95){const s=(u-.55)/.4;
  if(run)return {stage:'run',offset:len*Math.pow(s,1.6),r:r0*(1-.3*s),stretch:1.25+.25*s,alpha:s>.8?1-(s-.8)/.2:1,trail:.5*(1-s)};
  return {stage:'fall',offset:len*s*s,r:r0*(1-.2*s),stretch:1.3+1.4*s,alpha:s>.75?1-(s-.75)/.25:1,trail:0};}
 return {stage:'rest',offset:0,r:r0*.3,stretch:1,alpha:1,trail:0};
}
export function createBloodDrips(emitters=[],{doc=globalThis.document}={}){
 let tear=null;
 return {count:emitters.length,
  // map(x,y) -> [worldX, worldY]; scale = world px per source px (horizontal).
  draw(ctx,t,map,scale,animate=true){
   if(!emitters.length||!animate)return 0;tear??=sprite(doc);let drawn=0;
   emitters.forEach((e,i)=>{
    const st=dripState(i,t,e);if(st.alpha<=0)return;
    const [x0,y0]=map(e[0],e[1]),[x,y]=map(e[0],e[1]+st.offset),w=2*st.r*scale,h=w*1.5*st.stretch;
    ctx.save();ctx.globalAlpha=st.alpha;
    if(st.trail>0){ctx.globalAlpha=st.trail;ctx.strokeStyle='#7a040c';ctx.lineWidth=Math.max(1,w*.35);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x,y-h*.4);ctx.stroke();ctx.globalAlpha=st.alpha;}
    // hanging/sliding beads keep their point on the tip; free-falling drops are drawn around their centre
    ctx.drawImage(tear,x-w/2,st.stage==='fall'?y-h*.55:y-h*.12,w,h);ctx.restore();drawn++;
   });
   return drawn;
  }};
}
