// One announcement look for the whole slot, matched to the approved Blood Money "+2 FREE SPINS" reward
// (blood-promotion.css): floating type on a soft dark radial backing, no box. A tracked gold eyebrow between two
// hairlines, a Georgia headline in parchment with an optional larger gold lead (a number or amount), and a tracked
// gold subtitle. Canvas version of that CSS; the DOM announcements use the same values in their stylesheets.
export const ANNOUNCE=Object.freeze({eyebrow:'#d5ad6e',rule:'#a77b3c',headline:'#f7e1b6',lead:'#ffe1a4',sub:'#dbb979',backing:'20,10,3'});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function tracked(ctx,text,x,y,size,spacing,color,font){
 ctx.font=`700 ${size}px ${font}`;ctx.fillStyle=color;
 if('letterSpacing' in ctx){ctx.letterSpacing=`${spacing}px`;const w=ctx.measureText(text).width;ctx.fillText(text,x+spacing/2,y);ctx.letterSpacing='0px';return w;}
 ctx.fillText(text,x,y);return ctx.measureText(text).width;
}
// width: the panel width in world px (the reward uses ~606); sizes follow the reward's cqw clamps.
// anchor 'center' puts (x,y) at the middle of the block, 'bottom' at its foot. Returns the block height.
export function measureAnnouncement({width=606,eyebrow='',lead='',headline='',sub=''}={}){
 const q=width/100,eb=clamp(1.65*q,9,12),hs=clamp(8.8*q,20,64),ls=hs*1.5,ss=clamp(1.8*q,9,13);
 const main=lead||headline?Math.max(lead?ls*.95:0,headline?hs*1.1:0):0;
 return {eb,hs,ls,ss,main,height:(eyebrow?eb*1.3+7:0)+main+(sub?9+ss*1.3:0)};
}
export function drawAnnouncement(ctx,{x,y,width=606,eyebrow='',lead='',headline='',sub='',scale=1,alpha=1,anchor='center',maxWidth=width*1.15,backing=true,glow=0}={}){
 if(alpha<=0)return 0;
 const m=measureAnnouncement({width,eyebrow,lead,headline,sub}),H=m.height,top=anchor==='bottom'?y-H:y-H/2;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,top+H);ctx.scale(scale,scale);ctx.translate(-x,-(top+H));
 ctx.textAlign='left';ctx.textBaseline='alphabetic';
 // main line width first (it sizes the backing and may need to shrink)
 ctx.font=`700 ${m.ls}px Georgia,serif`;const lw=lead?ctx.measureText(lead).width:0;ctx.font=`700 ${m.hs}px Georgia,serif`;const hw=headline?ctx.measureText(headline).width:0;
 const gap=lead&&headline?width*.02:0,raw=lw+gap+hw,fit=raw>maxWidth?maxWidth/raw:1;
 if(backing){ // radial-gradient(ellipse at 50% 60%, #140a03f5 12%, #140a03da 38%, #140a0370 58%, transparent 75%) over inset -30/-20
  const bw=Math.max(raw*fit,width*.62)/2+20,bh=H/2+30,cy=top+H*.6;
  const R=bw*1.414;ctx.save();ctx.translate(x,cy);ctx.scale(1,bh/bw);const g=ctx.createRadialGradient(0,0,0,0,0,R);
  g.addColorStop(.12,`rgba(${ANNOUNCE.backing},.96)`);g.addColorStop(.38,`rgba(${ANNOUNCE.backing},.855)`);g.addColorStop(.58,`rgba(${ANNOUNCE.backing},.44)`);g.addColorStop(.75,`rgba(${ANNOUNCE.backing},0)`);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*.76,0,Math.PI*2);ctx.fill();ctx.restore();   // soft ellipse, no panel edge
 }
 ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
 let cy=top;
 if(eyebrow){ // tracked caps between two hairlines
  cy+=m.eb*1.05;ctx.font=`700 ${m.eb}px Arial,sans-serif`;
  const sp=m.eb*.3,w=('letterSpacing' in ctx)?(ctx.letterSpacing=`${sp}px`,ctx.measureText(eyebrow).width):ctx.measureText(eyebrow).width;if('letterSpacing' in ctx)ctx.letterSpacing='0px';
  tracked(ctx,eyebrow,x-w/2,cy,m.eb,sp,ANNOUNCE.eyebrow,'Arial,sans-serif');
  ctx.save();ctx.shadowColor='transparent';ctx.fillStyle=ANNOUNCE.rule;const ly=cy-m.eb*.35,rule=Math.min(42,width*.07);
  ctx.fillRect(x-w/2-12-rule,ly,rule,1);ctx.fillRect(x+w/2+12,ly,rule,1);ctx.restore();
  cy+=m.eb*.25+7;
 }
 if(lead||headline){ // baseline-aligned lead + headline, shrunk together if too wide
  const base=cy+m.main*.82;ctx.save();ctx.translate(x,base);ctx.scale(fit,fit);let lx=-raw/2;
  if(lead){ctx.font=`700 ${m.ls}px Georgia,serif`;
   if(glow>0){ctx.save();ctx.shadowColor=`rgba(255,205,120,${Math.min(1,glow)})`;ctx.shadowBlur=14+16*glow;ctx.fillStyle=ANNOUNCE.lead;ctx.fillText(lead,lx,0);ctx.restore();}
   ctx.fillStyle=ANNOUNCE.lead;ctx.fillText(lead,lx,0);lx+=lw+gap;}
  if(headline){ctx.font=`700 ${m.hs}px Georgia,serif`;ctx.fillStyle=ANNOUNCE.headline;ctx.fillText(headline,lx,0);}
  ctx.restore();cy+=m.main;
 }
 if(sub){cy+=9+m.ss*1.05;ctx.font=`700 ${m.ss}px Arial,sans-serif`;const sp=m.ss*.22;
  let w=ctx.measureText(sub).width;if('letterSpacing' in ctx){ctx.letterSpacing=`${sp}px`;w=ctx.measureText(sub).width;ctx.letterSpacing='0px';}
  tracked(ctx,sub,x-w/2,cy,m.ss,sp,ANNOUNCE.sub,'Arial,sans-serif');}
 ctx.restore();return H;
}
