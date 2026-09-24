import {HORSE_HOOFS} from './horse-gallop.js?v=2';
import {drawAnnouncement} from './announce.js?v=1';
import {drawWinCellBorders} from './win-cell-borders.js?v=1';
import {payingCells} from './crossfire-controller.js?v=14';
import {createBigWinArt,bigWinTier,bigWinProfile} from './big-win.js?v=3';
export {WIN_TIERS} from './big-win.js?v=3';
// Presentation only. Accounting deadlines remain in game.js and never depend on
// reaction assets, sound, or the duration of this sequence.
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const money=v=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
// Measured against the supplied Waylanders clip, relative to its reel grid.
// Layout only: values and ways still come from the actual resolved result.
export const PAYOUT_LAYOUT={x:.5,amountY:.535,waysY:.685,amountSize:.177,waysSize:.077,maxWidth:.84};
const amountText=value=>value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const PAYOUT_TIME={
 register:100,reaction:440,contact:300,
 ordinary:{amount:400,hold:600,settle:200},
 neutral:{amount:180,hold:460,settle:200},
 big:{amount:400,rise:240,count:1520,hold:440,settle:200},
 scatterOnly:{release:520}
};
export const HIGHLIGHT={dim:.19,stroke:1.8,inset:4,bone:'#e8dcc3',ink:'#17130f'};
const reactionTypes={a:'stamp',k:'stamp',q:'stamp',j:'stamp',ten:'stamp',cuffs:'trap',guns:'gun',bottle:'liquid',bandit:'outlaw',star:'stamp',skull:'stamp'};
export function createPayoutPresentation({ctx,G,reduced,onSilence=()=>{},makeCanvas,largeWin=null,crossfire=null}){
 let state=null;const bigArt=createBigWinArt({makeCanvas});
 const valid=([c,r])=>Number.isInteger(c)&&Number.isInteger(r)&&c>=0&&c<6&&r>=0&&r<4;
 const key=([c,r])=>c+':'+r;
 function begin(value,ways,cells,groups,speed=1,now=performance.now(),opts={}){
  onSilence();
  const wager=opts.wager>0?opts.wager:opts.bet>0?opts.bet:1;
  const stake=Number.isFinite(opts.stake)?opts.stake:wager;
  const roundReturn=Math.round((opts.roundReturn??value)*100)/100;
  const profitable=Math.round(roundReturn*100)>Math.round(stake*100),net=Math.round((roundReturn-stake)*100)/100;
  const quietReturn=!!opts.honestFeedback&&!profitable;
  const tier=opts.suppressBigWin?0:bigWinTier(value,stake>0?stake:wager,roundReturn),big=!opts.cascade&&tier>0;
  const profile=opts.bloodMoney&&opts.cascade?null:bigWinProfile(tier,{cascade:!!opts.cascade,reduced});
  const wildReels=new Set(opts.wildReels||[]);
  // Only authoritative paying groups may cause a reaction. Scatter feature
  // markers are identified separately and never treated as a paying symbol.
  const paying=new Set((groups||[]).filter(g=>g.symbol!=='scatter'&&g.value>0).flatMap(g=>(g.cells||[]).filter(valid).map(key)));
  const keys=new Set(cells.filter(valid).map(key));
  const reacts=new Map();
  for(const cell of cells.filter(valid)){
   const [c,r]=cell,k=key(cell),name=opts.grid?.[c]?.[r];
   if(paying.has(k)&&!wildReels.has(c)&&reactionTypes[name])reacts.set(k,{name,type:opts.bloodMoney&&['bottle','guns','bandit'].includes(name)?'stamp':reactionTypes[name]});
  }
  const types=[...new Set([...reacts.values()].map(x=>x.type))];
  const bountyCells=opts.bloodMoney?(opts.bountyCells||[]):[];
  // Every paying win uses the same screen-edge volley. Bounty cells additionally
  // carry the portrait hit, including legitimate sub-cent target awards.
  const shotCells=[...new Map([...payingCells(cells,groups),...bountyCells].map(p=>[key(p),p])).values()];
  const shotSequence=!quietReturn&&!opts.summaryOnly&&(value>0||bountyCells.length)?crossfire?.begin(shotCells,speed,{followThrough:!!opts.markFollowThrough,compact:!!opts.bloodMoney,bountyCells,head:opts.bountyHead,ratio:value/(opts.honestFeedback?(stake>0?stake:wager):(opts.bet||wager))}):null;
  const reactionMs=PAYOUT_TIME.reaction;
  let amountAt=value<=0?Infinity:profile?profile.amountAt:profitable?PAYOUT_TIME.ordinary.amount:PAYOUT_TIME.neutral.amount;
  let endAt=profile?profile.endAt:opts.summaryOnly?PAYOUT_TIME.ordinary.settle:opts.cascade?(profitable?900:660):value<=0?PAYOUT_TIME.scatterOnly.release:amountAt+(profitable?PAYOUT_TIME.ordinary.hold+PAYOUT_TIME.ordinary.settle:PAYOUT_TIME.neutral.hold+PAYOUT_TIME.neutral.settle);
  const presentationOffset=shotSequence?Math.max(0,shotSequence.settle*1000*speed-amountAt):0;
  amountAt+=presentationOffset;endAt=Math.max(endAt+presentationOffset,(shotSequence?.duration||0)*1000*speed);
  const cues=[];
  if(profitable&&!reduced&&!shotSequence){
   for(const type of types)cues.push({at:PAYOUT_TIME.register+PAYOUT_TIME.contact,type:'reaction',symbolType:type,gain:Math.min(.65,.85/Math.sqrt(Math.max(1,types.length)))});
   if(!profile&&!types.length)cues.push({at:amountAt,type:'finish'});
  }
  if(profile&&!reduced){
   if(profile.cascade)cues.push({at:profile.landAt,type:'hit',tier});
   else{
    cues.push({at:profile.preludeAt,type:'prelude',tier},{at:profile.landAt,type:'entrance',tier});
    for(const [i,at] of HORSE_HOOFS.entries())cues.push({at,type:'hoof',tier,hoof:i%4,approach:i/(HORSE_HOOFS.length-1)});
    cues.push({at:profile.skidAt,type:'skid',tier});
    for(let i=0;i<(profile.count?6:0);i++)cues.push({at:amountAt+140+i*(profile.count-220)/6,type:'count',tier});
    if(!profile.hardStop)cues.push({at:profile.finishAt,type:'finish',tier});
   }
  }
  if(shotSequence||big&&largeWin)cues.length=0; // The approved synchronized track owns large-win sound.
  state={value,roundReturn,quietReturn,shotSequence,presentationOffset,largeStarted:false,reactionMs,cascade:!!opts.cascade,summaryOnly:!!opts.summaryOnly,ways,keys,paying,reacts,wildReels,net,stake,profitable,big,tier,profile,bonus:!!opts.bonus,groups:groups||[],
   bloodMoney:!!opts.bloodMoney,start:now,speed,pausedAt:null,pausedMs:0,amountAt,endAt,cues:cues.sort((a,b)=>a.at-b.at),cursor:0};
  if(big&&largeWin&&!shotSequence){state.largeStarted=true;largeWin.begin(Math.round(value*100));}
  return {endAfter:endAt/speed,bigAt:big?profile.landAt/speed:0,tier,positionUpgradeAt:amountAt+120};
 }
 const elapsed=now=>state?Math.max(0,((state.pausedAt??now)-state.start-state.pausedMs)*state.speed):0;
 function setPaused(paused,now=performance.now()){
  if(!state)return;
  if(state.shotSequence)crossfire.setPaused(paused);
  if(state.largeStarted&&largeWin)largeWin.setPaused(paused);
  if(paused&&state.pausedAt===null){state.pausedAt=now;onSilence();}
  else if(!paused&&state.pausedAt!==null){state.pausedMs+=now-state.pausedAt;state.pausedAt=null;}
 }
 function advance(now=performance.now()){
  if(!state||state.pausedAt!==null)return [];
  if(state.shotSequence){crossfire.tick();if(state.big&&largeWin&&!state.largeStarted&&crossfire.complete){state.largeStarted=true;largeWin.begin(Math.round(state.value*100));}}
  const due=[],u=elapsed(now);
  while(state.cursor<state.cues.length&&state.cues[state.cursor].at<=u){const cue=state.cues[state.cursor++];if(u-cue.at<90)due.push(cue);}
  return due;
 }
 function quickStop(){
  if(!state)return false;
  state.quickStopping=true;state.cursor=state.cues.length;onSilence();
  if(state.shotSequence)crossfire.skip();
  if(state.big&&largeWin){
   if(!state.largeStarted){state.largeStarted=true;largeWin.begin(Math.round(state.value*100));}
   largeWin.skip();
  }
  return true;
 }
 function reaction(c,r,now){
  if(!state||state.shotSequence||!state.profitable||reduced)return null;
  const part=state.reacts.get(c+':'+r),u=elapsed(now)-PAYOUT_TIME.register;
  if(!part||u<=0||u>=state.reactionMs)return null;
  return {...part,progress:u/state.reactionMs,intensity:state.big?1:Math.min(1,.72+Math.max(0,state.net/state.stake)*.035)};
 }
 function outline(x,y,w,h,a,contact=0){
  const i=HIGHLIGHT.inset;ctx.save();ctx.globalAlpha=a;ctx.lineJoin='round';ctx.beginPath();ctx.roundRect(x+i,y+i,w-i*2,h-i*2,2);
  ctx.lineWidth=4;ctx.strokeStyle=HIGHLIGHT.ink;ctx.stroke();ctx.lineWidth=HIGHLIGHT.stroke+contact*2.2;ctx.strokeStyle=HIGHLIGHT.bone;ctx.stroke();ctx.restore();
 }
 function drawBoard(now){
  if(!state)return;const u=elapsed(now);
  if(state.shotSequence){crossfire.tick();drawWinCellBorders(ctx,G,crossfire.state,{reduced});crossfire.draw(ctx);return;}
  const a=ease((u-PAYOUT_TIME.register)/70)*(1-ease((u-state.endAt+200)/200));if(a<=0)return;
  const dim=(state.profitable?HIGHLIGHT.dim:.10)*a;
  const contactAt=PAYOUT_TIME.register+PAYOUT_TIME.contact;
  const contact=!reduced&&state.profitable&&u>=contactAt?Math.exp(-(u-contactAt)/55):0;
  ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();
  for(let c=0;c<6;c++){
   const x=G.x+c*G.cw;
   if(state.wildReels.has(c)){
    const lit=[0,1,2,3].some(r=>state.keys.has(c+':'+r));
    if(lit)outline(x,G.y,G.cw,G.h,a*(state.profitable?1:.6),contact);else{ctx.fillStyle=`rgba(7,6,4,${dim})`;ctx.fillRect(x,G.y,G.cw,G.h);}continue;
   }
   for(let r=0;r<4;r++){
    const y=G.y+r*G.ch;
    if(state.keys.has(c+':'+r))outline(x,y,G.cw,G.ch,a*(state.profitable?1:.6),contact);
    else{ctx.fillStyle=`rgba(7,6,4,${dim})`;ctx.fillRect(x,y,G.cw,G.ch);}
   }
  }
  ctx.restore();
 }
 function centered(text,cx,cy,size,maxWidth,fill,outline=3){
  ctx.font=`${size}px Outlaw`;const width=ctx.measureText(text).width;
  if(width>maxWidth){size*=maxWidth/width;ctx.font=`${size}px Outlaw`;}
  const metrics=ctx.measureText(text),baseline=cy+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
  ctx.lineWidth=outline*2;ctx.strokeStyle='#17120f';ctx.strokeText(text,cx,baseline);
  ctx.fillStyle=fill;ctx.fillText(text,cx,baseline);
 }
 function drawSummary(now){
  if(!state)return;const t=elapsed(now);
  // The bottom WIN readout owns the completed ordinary round's running total.
  // Do not replay the same amount in a second popup after the last tumble.
  if(state.summaryOnly&&!state.big)return;
  if(state.big&&largeWin)return; // Transparent DOM canvas over the actual live game.
  if(state.profile){if(t>=state.amountAt)bigArt.draw(ctx,G,state,t-state.presentationOffset,reduced);return;}
  const a=1-ease((t-state.endAt+200)/200);if(a<=0)return;
  if(state.value<=0){
   const feature=state.groups.find(g=>g.symbol==='scatter');if(!feature||t<PAYOUT_TIME.register)return;
   // Same announcement look as the Blood Money reward, centred on the board.
   drawAnnouncement(ctx,{x:G.x+G.w/2,y:G.y+G.h*.5,width:G.w*.92,eyebrow:`${feature.reels} SCATTERS`,headline:feature.name,sub:`${feature.count} FREE SPINS`,alpha:a*ease((t-PAYOUT_TIME.register)/80)});return;
  }
  if(t<state.amountAt)return;
  if(state.bloodMoney){
   // Same announcement look, compact on the bottom timber so the reels and wild multipliers stay clear.
   drawAnnouncement(ctx,{x:G.x+G.w/2,y:G.y+G.h+30,width:300,lead:money(state.value),headline:'WIN',sub:`${state.ways.toLocaleString('en-US')} WAYS`,alpha:a*ease((t-state.amountAt)/60)});return;
  }
  const u=t-state.amountAt,L=PAYOUT_LAYOUT,cx=G.x+G.w*L.x;
  const B=PAYOUT_TIME.big,pop=reduced||!state.profitable?1:state.big?1+.10*(1-clamp(u/B.rise))**3:1+.055*Math.exp(-u/55)*Math.sin(u/55);
  const v=state.big&&!reduced&&u<B.count?Math.min(state.value-.01,Math.floor(state.value*ease(u/B.count)*100)/100):state.value;
  // Same announcement look as the Blood Money reward: gold eyebrow, the amount as the gold lead, tracked subtitle.
  const quiet=state.quietReturn,eyebrow=state.big?'BIG WIN':quiet?'RETURN':state.summaryOnly?'ROUND RETURN':'WIN';
  const sub=quiet?(state.net===0?'BREAK EVEN':`NET −${money(Math.abs(state.net))} SO FAR`):state.summaryOnly?'':`${state.ways.toLocaleString('en-US')} TOTAL WAYS`;
  drawAnnouncement(ctx,{x:cx,y:G.y+G.h*((L.amountY+L.waysY)/2),width:G.w*(quiet?.66:.92),eyebrow,lead:amountText(v),sub,scale:pop,alpha:a*ease(u/70),maxWidth:G.w*L.maxWidth});
 }
 return {begin,advance,setPaused,quickStop,reaction,drawBoard,drawSummary,elapsed,load:()=>largeWin?largeWin.load():bigArt.load(),setAssets:bigArt.setAssets,
  finished:now=>!state||(state.big&&largeWin?state.largeStarted&&largeWin.complete:state.shotSequence?crossfire.complete&&(crossfire.skipped||elapsed(now)>=state.endAt):state.quickStopping||elapsed(now)>=state.endAt),clear({keepAudio=false}={}){if(state?.big&&largeWin)largeWin.clear();if(state?.shotSequence)crossfire.clear();state=null;if(!keepAudio)onSilence();},
  get mounted(){return !largeWin&&!!state?.big&&bigArt.mounted;},get active(){return !!state;},get big(){return !!state?.big;},get tier(){return state?.tier||0;},get profitable(){return !!state?.profitable;}};
}

