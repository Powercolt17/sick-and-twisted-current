import {createBloodLivingArt} from './blood-artwork.js?v=2';

export const BLOOD_TIMING=Object.freeze({duration:8,cardAt:.58,dimAt:.58,shotAt:1.08,continueAt:2.15});
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-Math.pow(1-clamp(x),3);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const random=n=>{const x=Math.sin(n*113.9+37.8)*43758.54;return x-Math.floor(x);};
function path(ctx,points,scale=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*scale,y*scale):ctx.moveTo(x*scale,y*scale));ctx.closePath();}
function cutout(image,points,make,w=960,h=640,scale=1/1.6){const c=make(w,h),ctx=c.getContext('2d');path(ctx,points,scale);ctx.clip();ctx.drawImage(image,0,0,w,h);return c;}
const HAT=[[57,309],[204,298],[324,332],[335,267],[381,199],[392,42],[415,29],[540,84],[674,74],[781,11],[809,18],[830,117],[866,154],[880,215],[890,221],[906,278],[979,254],[1039,224],[1119,214],[1185,232],[1202,270],[1193,343],[1121,391],[1029,447],[938,473],[845,432],[757,467],[660,493],[563,507],[440,502],[338,479],[260,459],[181,484],[106,444],[62,380]];
const FACE=[[290,461],[428,472],[586,491],[739,446],[875,407],[928,440],[962,493],[947,538],[987,548],[938,568],[939,609],[904,632],[910,686],[878,766],[819,832],[739,879],[663,893],[570,876],[492,836],[436,773],[412,702],[352,653],[311,602],[295,550],[268,586],[281,517]];
export function createBloodScatterReaction({frozen,cells,G,assets,make}){
 const size=384,scale=size/1254,head=cutout(assets.scatter,FACE,make,size,size,scale),hat=cutout(assets.scatter,HAT,make,size,size,scale);
 const base=make(size,size),bc=base.getContext('2d');bc.drawImage(assets.scatter,0,0,size,size);
 // Inpaint only the moving silhouettes; the approved lettering and edges stay exact.
 for(const shape of [FACE,HAT]){bc.save();path(bc,shape,scale);bc.clip();bc.clearRect(0,0,size,size);bc.drawImage(assets.scatterPlate,0,0,size,size);bc.restore();}
 function draw(ctx,t){
  if(t>1.2)return;
  for(let i=0;i<cells.length;i++){
   const [c,r]=cells[i],x=G.x+c*G.cw,y=G.y+r*G.ch,a=t-(.04+i*.12);
   if(a<0)continue;
   const lift=ease(a/.22),settle=1-.15*smooth((a-.3)/.3),p=lift*settle;
   ctx.save();ctx.translate(x+1,y+1);ctx.scale((G.cw-2)/size,(G.ch-2)/size);
   ctx.fillStyle='#130c08';ctx.fillRect(0,0,size,size);ctx.drawImage(base,0,0);
   ctx.save();ctx.translate(size*.51,size*.69-18*p);ctx.rotate((i-1)*.025*p);ctx.scale(1+.08*p,1+.065*p);ctx.translate(-size*.51,-size*.69);ctx.drawImage(head,0,0);ctx.restore();
   const lag=ease(Math.max(0,a-.045)/.24)*settle;
   ctx.save();ctx.translate(size*.5,size*.4-22*lag);ctx.rotate(-.055*lag);ctx.scale(1+.07*lag,1+.035*lag);ctx.translate(-size*.5,-size*.4);ctx.drawImage(hat,0,0);ctx.restore();
   ctx.restore();
  }
 }
 return {draw,dispose(){for(const c of [base,head,hat])c.width=c.height=1;}};
}

const BODY=[[397,209],[445,185],[502,177],[566,213],[633,265],[718,266],[777,281],[811,326],[858,362],[966,400],[1073,444],[1196,503],[1201,543],[1137,514],[1082,491],[1105,525],[1044,491],[1050,540],[1003,592],[988,558],[950,588],[941,647],[907,684],[873,640],[834,694],[765,722],[638,737],[453,742],[288,714],[204,723],[244,663],[302,650],[258,629],[310,610],[275,608],[289,564],[311,526],[275,537],[294,487],[329,463],[306,413],[330,344],[352,288]];
const HEAD=[[465,70],[493,64],[552,80],[574,31],[585,14],[650,11],[695,35],[738,37],[752,52],[750,142],[804,152],[831,145],[839,157],[817,173],[758,185],[737,229],[753,248],[734,246],[731,281],[695,279],[669,261],[618,259],[577,229],[553,203],[511,187],[492,176],[510,155],[499,151],[516,135],[500,120],[469,100]];
const ARM=[[214,139],[226,118],[245,111],[253,91],[268,87],[280,97],[278,120],[364,148],[376,141],[388,143],[406,158],[443,160],[451,174],[471,207],[500,225],[534,256],[555,301],[562,351],[546,402],[516,444],[475,468],[429,471],[385,456],[354,448],[334,435],[315,412],[305,381],[306,346],[302,317],[316,280],[341,261],[328,244],[325,217],[342,215],[286,213],[254,214],[239,205],[240,181],[225,170]];
function label(ctx,text,x,y,size,width,color='#f0deba'){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${size}px HellOutlaw`;const measured=ctx.measureText(text).width;if(measured>width)ctx.font=`${size*width/measured}px HellOutlaw`;
 ctx.lineJoin='round';ctx.lineWidth=8;ctx.strokeStyle='#170503';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
}
export function createBloodReveal(assets,make){
 const W=960,H=640,living=createBloodLivingArt({...assets,bloodArt:assets.armClean},make);
 const head=cutout(assets.bloodArt,HEAD,make),arm=cutout(assets.bloodArt,ARM,make),body=make(W,H),bc=body.getContext('2d'),out=make(W,H),oc=out.getContext('2d');
 // Aligned clean scenery avoids a second gun silhouette during the recoil.
 const base=make(W,H),baseCtx=base.getContext('2d');baseCtx.drawImage(assets.background,0,0,W,H);
 const titles=['BLOOD','MONEY'].map(text=>{const c=make(550,165),ctx=c.getContext('2d');label(ctx,text,275,82,107,530);ctx.globalCompositeOperation='destination-out';for(let i=0;i<550;i++){ctx.globalAlpha=.3;ctx.fillRect(random(i)*550,random(i+3)*165,.6+random(i+9)*2,1+random(i+7)*2);}return c;});
 let lastFrame=-1;
 function image(t){
  const f=Math.floor(t*60);if(f===lastFrame)return out;lastFrame=f;
  const shot=t-BLOOD_TIMING.shotAt,fire=shot>=0?1:0;
  // Hold the recoil briefly, then recover in a measured arc instead of vibrating.
  const recoil=shot<0?0:shot<.045?ease(shot/.045):1-smooth((shot-.045)/.36);
  const raise=1-smooth((t-.59)/.43),breath=Math.sin(t*2)*.0016;
  bc.clearRect(0,0,W,H);bc.save();path(bc,BODY,1/1.6);bc.clip();bc.drawImage(living.get(t),0,0);bc.restore();
  oc.clearRect(0,0,W,H);oc.drawImage(base,0,0);
  oc.save();oc.translate(375,438);oc.rotate(-.018*recoil+breath);oc.translate(-375+4*recoil,-438+2*recoil);oc.drawImage(body,0,0);
  oc.save();oc.translate(404,158);oc.rotate(.035*recoil-.025*raise);oc.translate(-404,-158-2*recoil);oc.drawImage(head,0,0);oc.restore();
  oc.save();oc.translate(334,192);oc.rotate(-.24*raise+.13*recoil);oc.translate(-334+8*recoil,-192+3*recoil);oc.drawImage(arm,0,0);
  if(fire&&shot<.10){const k=1-shot/.10;oc.globalAlpha=k;oc.drawImage(assets.flash,71-18*k,27-18*k,144+36*k,137+36*k);oc.globalAlpha=1;}
  if(shot>.06&&shot<1.7){const a=shot-.06;oc.globalAlpha=.34*Math.exp(-a*1.8);oc.drawImage(assets.smoke,117-a*15,59-a*30,106+a*35,122+a*35);}
  oc.restore();oc.restore();return out;
 }
 function draw(ctx,t,awardedSpins){
  if(t<BLOOD_TIMING.cardAt)return;
  const a=t-BLOOD_TIMING.cardAt,shot=t-BLOOD_TIMING.shotAt,kick=shot<0?0:Math.exp(-shot*18)*Math.sin(shot*66)*5;
  ctx.save();ctx.translate(720+kick,373-kick*.28);const s=1+.028*(1-ease(a/.55));ctx.scale(s,s);ctx.drawImage(image(t),-490,-327,980,654);
  for(let i=0;i<2;i++){const age=t-(1.20+i*.07);if(age<0)continue;const p=ease(age/.16);ctx.save();ctx.globalAlpha=p;ctx.translate(i?205:-205,191-9*(1-p));ctx.scale(1+.09*(1-p),1+.09*(1-p));ctx.drawImage(titles[i],-251,-76,502,150);ctx.restore();}
  if(t>=1.48){const q=ease((t-1.48)/.18);ctx.save();ctx.globalAlpha=q;ctx.translate(0,277);ctx.scale(1+.08*(1-q),1+.08*(1-q));label(ctx,awardedSpins===null?'BONUS ACTIVATED':`${awardedSpins} FREE SPINS`,0,0,54,830,'#f0dbad');ctx.restore();}
  if(t>=1.75){ctx.save();ctx.globalAlpha=ease((t-1.75)/.25);ctx.font='19px Outlaw,Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='#1b100a';ctx.lineWidth=3;ctx.fillStyle='#ead8b8';const text='TARGET WINS EARN STAMPS · THREE STAMPS UPGRADE';ctx.strokeText(text,0,316);ctx.fillText(text,0,316);ctx.restore();}
  ctx.restore();
 }
 return {draw,dispose(){living.dispose();for(const c of [base,head,arm,body,out,...titles])c.width=c.height=1;}};
}

// The board itself tears open; no enlarged blood bitmap covers the character.
export function createBloodFrame({make,W,H,G}){
 const cover=make(W,H),cc=cover.getContext('2d');
 function hole(ctx,p){const radius=950*ease(p),cx=G.x+G.w*.5,cy=G.y+G.ch*1.6;ctx.beginPath();for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r=radius*(.90+random(i+200)*.15),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
 function draw(ctx,{t,frozen,burn,art,layout:l,awardedSpins}){
  ctx.drawImage(frozen,0,0,W,H);ctx.fillStyle=`rgba(6,4,3,${.9*smooth((t-.4)/.65)})`;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(l.x,l.y);ctx.scale(l.scale,l.scale);art.draw(ctx,t,awardedSpins);ctx.restore();
  if(t<1.03){cc.clearRect(0,0,W,H);cc.drawImage(frozen,0,0,W,H);cc.fillStyle=`rgba(9,5,3,${.40*smooth(t/.35)})`;cc.fillRect(0,0,W,H);burn.draw(cc,t);
   if(t>=.58){cc.save();hole(cc,(t-.58)/.45);cc.globalCompositeOperation='destination-out';cc.fill();cc.restore();}
   ctx.drawImage(cover,0,0);
  }
 }
 return {draw,dispose(){cover.width=cover.height=1;}};
}
