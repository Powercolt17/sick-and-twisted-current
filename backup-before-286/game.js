import {playTargetScatter} from './blood-target-audio.js?v=2';
import {createBloodRewards} from './blood-rules.js?v=2';
import {createBloodPromotion} from './blood-promotion.js?v=8';
import {createBloodTargetGun,createBloodGunslinger} from './blood-gunslinger.js?v=2';
import {BLOOD_STAGE} from './blood-duel-stage.js?v=1';
import {createScatterSlam} from './scatter-slam.js?v=1';
import {createScatterDeath} from './scatter-death.js?v=5';
import {createLanternLight} from './lantern-light.js?v=1';
import {createMobileRenderBudget} from './mobile-render-budget.js?v=1';
import {createActionFeedback} from './action-feedback.js?v=3';
import {bountySources} from './bounty-timeline.js?v=109';
import {createOutlawArt,payingOutlaws,OUTLAW_NAMES,OUTLAW_HEAD} from './blood-outlaws.js?v=91art';
import {createFeatureScenes,confirmedBloodCells,confirmedHangCells,confirmedHellCells} from './feature-scenes.js?v=hang4';
import {createScatterAudio} from './scatter-audio.js?v=2';
import {createThemeMusic} from './theme-music.js?v=3';
import {createBloodBank} from './blood-bank.js?v=133';
import {createBloodDuel} from './blood-duel.js?v=8';
import {createBloodReceipt} from './blood-receipt.js?v=4';
import {createBloodBriefing} from './blood-briefing.js?v=125';
import {freshBounty,upgradeGrid} from './blood-bounty.js?v=82';
import {rollBloodOutcome,bloodModel,bloodDemoOutcome} from './blood-math.js?v=82';
import {rollHangFeature,hangDemoFeature,hangAudit} from './hang-math.js?v=4';
import {createHangPresentation} from './hang-presentation.js?v=7';
import {hellPurchaseEntry} from './hell-entry.js?v=2';
import {featurePurchaseEntry} from './feature-entry.js?v=1';
import {createGameInfo} from './game-info.js?v=130';
import {createMobileView,canvasScale} from './mobile-view.js?v=hang4';
import {createReelMotion,REEL_MOTION,NORMAL_SPIN_MOTION,FEATURE_BUY_MOTION} from './reel-motion.js?v=10';
import {createTricksterGrid,TRICKSTER_BRAND} from './trickster-grid.js?v=7';
import {createTricksterHeat} from './trickster-heat.js?v=1';
import {createScatterAnticipation,ANTICIPATION} from './scatter-anticipation.js?v=12';
import {createReelFrame} from './reel-frame.js?v=94perf';
import {createFeatureBorders} from './feature-borders.js?v=11';
import {createFeatureReveal} from './feature-reveal.js?v=4';
import {createTumbleTiles} from './tumble-tiles.js?v=112';
import {createCrossfireHost} from './crossfire-controller.js?v=14';
import {createRoundLedger} from './round-ledger.js?v=1';
import {createTumbleMotion,TUMBLE_TIME,BLAST_TUMBLE_TIME} from './tumble-motion.js?v=21';
// Trickster board heat (glow, embers, audio bed) from the live multiplier grid.
const tricksterHeat=createTricksterHeat({G:{x:267,y:157,w:660,h:396,cw:110,ch:99}});
// Beat added after a tumble's clear when an emptied cell reveals a Trickster multiplier upgrade (tumble-clock ms).
const TRICKSTER_GROW_HOLD=800,TRICKSTER_STAGGER=85,TRICKSTER_BIG_PAUSE=260;   // tumble-ms; several upgrades strike one after another; extra build before a x16+ reveal
import {createSymbolReactions} from './symbol-reactions.js?v=1';
import {createBombFX} from './bomb-fx.js?v=92audio';
import {createImpactMotion} from './impact-motion.js?v=2';
import {createScreenShootout} from './screen-shootout.js?v=116mark';
import {createWildShots,createBoxWildTile} from './wild-shots.js?v=8';
import {createPayoutPresentation} from './payout.js?v=43';
import {spinBigWin} from './spin-big-win.js?v=1';
import {createApprovedWin} from './approved-win.js?v=4';
import {createGhostTown} from './environment.js?v=floor35-scenery32b-95perf';
import {createStaticRaster} from './static-raster.js?v=1';
import * as M from './math.js?v=23';
import {createCharacter} from './character.js?v=2';
import {loadOutlawAssets,drawOutlaw,stepMotionAt,WILD_STEPS,WILD_LANDINGS,WILD_ENTRY_END} from './outlaw-motion.js?v=114';
import {createModeBackground} from './mode-background.js?v=floor35-scenery32b-118';
import {createShop} from './shop.js?v=52';
const $=s=>document.querySelector(s);
const canvas=$('#game'),displayCtx=canvas.getContext('2d',{alpha:false});
// One continuous world is rendered once, then shown above and behind the HUD.
const sceneCanvas=document.createElement('canvas'),ctx=sceneCanvas.getContext('2d',{alpha:false});
const portraitCanvas=$('#portrait-character'),portraitCtx=portraitCanvas.getContext('2d',{alpha:false});
const bloodHeaderCanvas=document.createElement('canvas'),bloodHeaderCtx=bloodHeaderCanvas.getContext('2d');
const groundCanvas=$('#ground-rail'),groundCtx=groundCanvas.getContext('2d',{alpha:false});
const REEL_COUNT=6, ROW_COUNT=4;
const SOURCE_W=1092, SOURCE_H=608;
const W=1212,H=608,G={x:267,y:157,w:660,h:396,cw:110,ch:99};
const SCENE_H=748;
const CENTER=G.x+G.w/2;
const mobileRenderBudget=createMobileRenderBudget();
let renderScale=2,phoneView=false,sceneTop=0,sceneBottom=140;
let desktopFigureLoading=null;
let symbolAtlas=null,stageHD=null,inkOverlay=null,boxedWildArt=null;
// OUTLAW WILD full-reel artwork (approved design). Multiplier text is rendered at runtime, never baked in.
let hangingWildArt=null;const wildTiles={};
let brandPanel=null;
const symbolSprites={},symbolTiles={};
const settledCells=Array.from({length:24},()=>({tile:null,raster:null}));
let cacheSettledCells=false;
const outlawArt=createOutlawArt(),outlawMotion={},defeatedOutlaws=new Map();
const bloodTile=(name,dead=false)=>outlawArt.tile(name,dead)||symbolTiles[name];
const gameTile=name=>bloodBank.active?bloodTile(name):symbolTiles[name];
// Standalone token artwork (outside the 6x2 symbol atlas, so atlas indexing is untouched).
const TOKENS={max:'assets/tokens/max.png?v=gold2',scatter:'assets/ink-refined/scatter.webp?v=pigment1'},tokenArt={};
function resizeCanvas(layout){
 const view=layout?.layout?layout:mobileView.layout;
 const wasPhone=phoneView;phoneView=view.layout!=='desktop';sceneTop=view.layout==='portrait'?view.header:0;sceneBottom=view.layout==='portrait'?view.groundHeight:140;
 const displayWidth=canvas.getBoundingClientRect?.().width||W;
 renderScale=canvasScale(displayWidth,window.devicePixelRatio||1,matchMedia('(pointer:coarse)').matches,phoneView)*(phoneView?mobileRenderBudget.quality:1);
 const width=Math.round(W*renderScale),height=Math.round(H*renderScale);
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const sh=Math.round((H+sceneTop+sceneBottom)*renderScale);
 if(sceneCanvas.width!==width||sceneCanvas.height!==sh){sceneCanvas.width=width;sceneCanvas.height=sh;}
 const gh=sh-Math.round(sceneTop*renderScale)-height;if(groundCanvas.width!==width||groundCanvas.height!==gh){groundCanvas.width=width;groundCanvas.height=gh;}
 const glass=$('#screen-glass');if(glass.width!==width||glass.height!==height){glass.width=width;glass.height=height;}
 if($('#slot-shell').dataset.layout==='portrait'){
  const pw=Math.round(view.sceneWidth*renderScale),ph=Math.round(sceneTop*renderScale);
  if(portraitCanvas.width!==pw||portraitCanvas.height!==ph){portraitCanvas.width=pw;portraitCanvas.height=ph;}
 }

 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(wasPhone&&!phoneView&&ready)ensureDesktopFigure();
}
function presentScene(includeGround=true){
 const top=Math.round(sceneTop*renderScale);
 displayCtx.drawImage(sceneCanvas,0,top,sceneCanvas.width,canvas.height,0,0,canvas.width,canvas.height);
 if(sceneTop){
  const x=mobileView.layout.sceneX*renderScale,w=mobileView.layout.sceneWidth*renderScale;
  portraitCtx.drawImage(sceneCanvas,x,0,w,top,0,0,portraitCanvas.width,portraitCanvas.height);
 }
 if(includeGround)groundCtx.drawImage(sceneCanvas,0,top+canvas.height,sceneCanvas.width,sceneCanvas.height-top-canvas.height,0,0,groundCanvas.width,groundCanvas.height);
}
function introResolution(active){
 if(active&&!phoneView){renderScale=1;canvas.width=W;canvas.height=H;sceneCanvas.width=W;sceneCanvas.height=SCENE_H;}
 else resizeCanvas();
}
function ensureDesktopFigure(){
 if(desktopFigureLoading)return desktopFigureLoading;
 desktopFigureLoading=Promise.all([loadBrandArt(),screenEffect.loadFigure(),duelShooter.load(),bloodTargetGun.load()]).then(()=>{cellShooter.setAssets(shootoutAssets.json,shootoutAssets.sheets,shootoutAssets.glass);duelShooter.setAssets(shootoutAssets.json,shootoutAssets.sheets,shootoutAssets.glass);}).catch(e=>{desktopFigureLoading=null;console.warn('Character artwork could not load',e);});
 return desktopFigureLoading;
}
function sourceCrop(img,sx,sy,sw,sh,dx,dy,dw,dh,target=ctx){
 const ix=img.width/SOURCE_W,iy=img.height/SOURCE_H;
 target.drawImage(img,sx*ix,sy*iy,sw*ix,sh*iy,dx,dy,dw,dh);
}
function drawStageSlice(img,y,height){
 sourceCrop(img,0,y,247,height,0,y,247,height);
 sourceCrop(img,247,y,600,height,247,y,720,height);
 sourceCrop(img,847,y,245,height,967,y,245,height);
}
function drawBrand(now){
 // Mobile keeps every reel effect, but never paints the foreground gunfighter.
 if(phoneView)return;
 // Keep every pixel of the character and title outside the six-reel playing area.
 ctx.save();ctx.beginPath();ctx.rect(0,0,featureScenes.state.feature==='blood'?350:240,SCENE_H);ctx.clip();
 if(brandPanel){
  const w=240,sx=brandPanel.width/932,sy=brandPanel.height/1688;
  // Transparent foreground preserves the original logo/figure crop geometry.
  if(!reelFrame.ready)ctx.drawImage(brandPanel,0,0,932*sx,378*sy,0,24,w,w*378/932);
  // One drawing and one placement for idle, draw, recoil and return.
  // Retain the original idle as an asset-failure fallback only.
  if(!dev.hideCharacter&&!payout.mounted){
   // Blood Money uses the same transform for idle, draw, recoil and muzzle coordinates.
   ctx.save();if(featureScenes.state.feature==='blood'){const h=BLOOD_STAGE.hero;ctx.translate(h.x,h.y);ctx.scale(h.scale,h.scale);}
   if(bloodTargetGun.drawFigure(ctx,bloodPromotion.age,now,environment.isMotionEnabled())){}
   else if(bloodDuel.drawFigure(ctx,now,environment.isMotionEnabled())){}
   else if(wildShots.active&&shootoutAssets.sheets.length&&wildShots.drawFigure(ctx,now,environment.isMotionEnabled())){}
   else if(!screenEffect.idle(ctx,now,environment.isMotionEnabled()))character.draw(now,8,198,243,environment.isMotionEnabled());
   ctx.restore();
  }
 }
 ctx.restore();
}
function drawBootContact(x,w,feet){
 for(const [cx,rx,ry,a] of [[.5,.43,.055,.3],[.2,.17,.018,.85],[.79,.17,.018,.85]]){
  ctx.save();ctx.translate(x+w*cx,feet-1);ctx.scale(w*rx,w*ry);
  const shade=ctx.createRadialGradient(0,0,0,0,0,1);shade.addColorStop(0,`rgba(12,7,4,${a})`);shade.addColorStop(1,'rgba(12,7,4,0)');ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
}
function prepareSymbolSprites(){
 if(!symbolAtlas)return;
 // The original extra ink is a transparent border layer, leaving the HD paper intact.
 const overlay=document.createElement('canvas');overlay.width=SOURCE_W;overlay.height=SOURCE_H;
 const oc=overlay.getContext('2d',{willReadFrequently:true});oc.drawImage(art['backdrop-wild'],0,0,SOURCE_W,SOURCE_H);
 const pixels=oc.getImageData(0,0,SOURCE_W,SOURCE_H),d=pixels.data;
 for(let y=0;y<SOURCE_H;y++)for(let x=0;x<SOURCE_W;x++){
  const k=(y*SOURCE_W+x)*4,outer=(x<247||x>847||y<79||y>553);
  const frameZone=x>80&&x<1000&&y>79&&y<581;
  const alpha=outer&&frameZone?Math.max(0,Math.min(1,(70-Math.max(d[k],d[k+1],d[k+2]))/45)):0;
  d[k]=4;d[k+1]=2;d[k+2]=3;d[k+3]=Math.round(alpha*255);
 }
 oc.putImageData(pixels,0,0);inkOverlay=overlay;
 if(stageHD)for(const name of symbols){const tile=document.createElement('canvas');tile.width=Math.round(G.cw*3);tile.height=Math.round(G.ch*3);const tc=tile.getContext('2d');tc.scale(3,3);paintSymbol(tc,name,0,0,G.cw,G.ch);symbolTiles[name]=tile;}
 if(boxedWildArt)symbolTiles[M.BOX_WILD]=createBoxWildTile(boxedWildArt);
}
function paintSymbol(target,name,x,y,w,h){
 // Ash & Bone tile art uses the same symbol IDs, order and cell geometry.
 const i=symbols.indexOf(name),aw=symbolAtlas.width/6,ah=symbolAtlas.height/2;
 target.drawImage(symbolAtlas,(i%6)*aw,Math.floor(i/6)*ah,aw,ah,x,y,w,h);
}
function drawSprite(name,x,y,w,h){
 const slam=name==='scatter'?scatterSlam.sample(Math.round((x-G.x)/G.cw),Math.round((y-G.y)/G.ch),lastTime):null;
 if(slam){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#25170e';ctx.fillRect(x,y,w,h);ctx.translate(x+w/2,y+h+slam.dy);ctx.scale(slam.scaleX,slam.scaleY);ctx.translate(-x-w/2,-y-h);}
 if(gameTile(name))ctx.drawImage(gameTile(name),x,y,w,h);
 else ctx.drawImage(art[name]||art.a,x,y,w,h);
 if(slam)ctx.restore();
}
const symbols=M.SYMBOLS;
const names=['backdrop','backdrop-wild','backdrop-bonus','top','cursor-patch',...symbols,'empty-128'];
const art={};
let ready=false,busy=false,muted=true,turbo=false,automatic=0,balance=10000,bet=1,totalWin=0,multiplier=0,bonus=false,freeSpins=0,ink=false,sequenceToken=0,boost=false;
let wilds={},reels=[],spinning={},winPopup=null,winning=[],popupStart=0,bonusAward=0,lastTime=0,raf=0,renderTimer=0;
let bonusDisplayName='',bonusLabel='DEADER',bonusScripted=false,enhancer=null,bonusMaxEligible=false;
let bloodBounty=freshBounty(),bloodRewards=createBloodRewards(),bloodSpinsPlayed=0;
let roundMeta={winBoost:1,maxEligible:false};
let roundLedger=null,roundSerial=0,awardSerial=0,roundMode='normal';
function beginRound(stake,mode='normal'){roundMode=mode;roundLedger=createRoundLedger(Math.round(stake*100),Math.round(bet*100)*M.MAX_AWARD);totalWin=0;roundSerial++;awardSerial=0;}
function creditRound(id,value){const amount=Math.round(value*100),accepted=roundLedger?roundLedger.credit(id,amount):amount;totalWin=cents(totalWin+accepted/100);balance=cents(balance+accepted/100);if(bloodBank.active||hangPresentation.active)bonusAward=cents(bonusAward+accepted/100);updateHUD();}

const bets=[.01,.02,.05,.1,.2,.5,1,2,5,10];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hangPresentation=createHangPresentation({stage:$('#stage'),G,reduced,announce:setStatus,onImpact:event=>{
 const light=event?.type==='stamps'&&!event.earned?.some(e=>e.upgrade),receipt=event?.type==='receipt';
 if(!light&&!receipt)impactMotion.kick(reduced?0:event?.type==='finale'?5:3.2);
 if(!muted){soundInit();if(!light&&!receipt)playSample('impactw',.62,.78);playSample('stamp',light?.24:receipt?.38:.58,light?1.3:receipt?1.05:1.08);}
},onFinale:()=>{if(!muted){soundInit();duckMusic(.28,2300,350);playSample('tension',.52,.76);}}});
document.addEventListener('visibilitychange',()=>hangPresentation.setPaused(document.hidden,performance.now()));
const bloodBank=createBloodBank({G,W,H,getTile:bloodTile,reduced,isPortrait:()=>$('#slot-shell')?.dataset.layout==='portrait',getVisibleWidth:()=>canvas.parentElement.getBoundingClientRect().width/canvas.getBoundingClientRect().width*W,announce:text=>{$('#blood-bounty-status').textContent=text;}});
const bloodTargetGun=createBloodTargetGun({getAssets:()=>shootoutAssets,reduced,getAmbientTime:()=>environment.motionTime});
const bloodPromotion=createBloodPromotion({stage:$('#stage'),reduced,onStart:()=>{const aim=bloodDuel.releaseAim();bloodTargetGun.start(bloodPromotion.target,aim);},onCue:cue=>{
 if(!reduced&&cue.type==='target-impact')impactMotion.kick(3);
 if(cue.type==='target-catch')setStatus(`+2 free spins. ${freeSpins} spins remaining. ${cue.multiplier}× win multiplier ${cue.increased?'revealed':'kept'}.`);
 if(muted)return;soundInit();if(!audio)return;
 if(cue.type==='target-draw'&&!bloodTargetGun.continued)playSample('draw',.22,1,false,0,0,undefined,-.55);
 if(cue.type==='target-shot')playSample('shot',.5,.98,false,0,0,undefined,-.55);
 if(cue.type==='target-impact'){
  playTargetScatter(audio,bus(),samples.scatter);
 }
 if(cue.type==='target-catch')playSample('cock',.13,.8,false,0,0,undefined,.6);
}});
document.addEventListener('visibilitychange',()=>bloodBank.setPaused(document.hidden,performance.now()));
const tumbleTiles=createTumbleTiles({getTile:(name,c,r)=>bloodBank.active?bloodTile(name,defeatedOutlaws.get(c+':'+r)===name):symbolTiles[name],getPoster:(mult,wild)=>wildSprite(mult,wild)});
const approvedWin=createApprovedWin({stage:$('#stage'),gameCanvas:canvas,winDisplay:$('#win-value'),G,worldWidth:W,isMuted:()=>muted,onSoundToggle:()=>soundToggle(),onMix:active=>approvedWinMix(active)});
let bloodEntryPending=false;
const bloodBriefing=createBloodBriefing({stage:$('#stage'),onPreview:options=>bloodBank.beginBriefing(options),onFinish:()=>bloodBank.endBriefing()});
const featureScenes=createFeatureScenes({canvas,stage:$('#stage'),isMuted:()=>muted,reduced,
 getView:()=>({x:phoneView?mobileView.layout.sceneX:0,y:-sceneTop,w:phoneView?mobileView.layout.sceneWidth:W,h:H+sceneTop+sceneBottom,mobile:phoneView}),
 onMix:active=>{if(active||!bloodEntryPending)hellMix(active);},
 onMusic:(active,key)=>{
  if(active){if(music.duck&&audio){const g=music.duck.gain,t=audio.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.035);}musicStop();}
  else if(!bloodEntryPending){void music.select(key==='blood'?'blood':key==='hang'?'hang':'main');if(musicWanted&&!muted)void musicStart();}
 }
});
const hellIntro=featureScenes.intro('hell'),hangIntro=featureScenes.intro('hang'),bloodIntro=featureScenes.intro('blood');
hellIntro.setMuteToggle(()=>soundToggle());
hangIntro.setMuteToggle(()=>soundToggle());
bloodIntro.setMuteToggle(()=>soundToggle());
// Win gunfire comes from the screen edges. Only wildShots drives the gunslinger's draw.
const crossfire=createCrossfireHost({stage:$('#stage'),width:W,height:H,grid:{...G,columns:6,rows:4},getAudio:()=>{soundInit();return audio?{context:audio,master:bus()}:null;},isMuted:()=>muted,reduced,onMix:active=>crossfireMix(active)});
const payout=createPayoutPresentation({ctx,G,reduced,largeWin:approvedWin,crossfire,onSilence:()=>payoutSoundsStop()});
const symbolReactions=createSymbolReactions();
const impactMotion=createImpactMotion({reduced});
const scatterSlam=createScatterSlam({G,reduced,onImpact:(strength,now)=>impactMotion.kick(strength,now)})
// Blood Money only: the approved execution clip on the confirmed scatter cells. Hits reuse the revolver sample and camera kick already in the game.
// Blood Money shoots him (revolver per impact); Hang 'Em High hangs him (rope tension, the cinch, the weight); Hell to Pay burns him (the tease's rope-burn, the flare, the skull stamp). All approved samples already in the mix.
const scatterDeath=createScatterDeath({G,reduced,turbo:()=>turbo,onCue:(name,index,cells,total)=>{
 const last=index===total-1,pan=Math.max(-.7,Math.min(.7,(cells.reduce((n,[c])=>n+c,0)/cells.length-2.5)/2.5*.6));
 if(!reduced&&(name==='shot'||name==='cinch'||name==='flare'||name==='skull'))impactMotion.kick(name==='cinch'||name==='flare'?6:last?6:5);
 if(muted)return;soundInit();if(!audio)return;
 if(name==='shot')playSample('shot',SAMPLE_GAIN.shot,last?.96:1,false,0,0,undefined,pan);
 else if(name==='drop')playSample('tension',SAMPLE_GAIN.tension*1.2,1.05,false,0,0,undefined,pan);
 else if(name==='cinch'){playSample('slam',SAMPLE_GAIN.slam,1,false,0,0,undefined,pan);playSample('rip',SAMPLE_GAIN.rip*.7,1.1,false,40,0,undefined,pan);}
 else if(name==='dead')playSample('tension',SAMPLE_GAIN.tension*.8,.82,false,0,0,undefined,pan);
 else if(name==='ignite')playSample('ropeBurn',.75,1,false,0,0,undefined,pan);
 else if(name==='flare')playSample('impactw',SAMPLE_GAIN.impactw,.92,false,0,0,undefined,pan);
 else if(name==='skull')playSample('stamp',SAMPLE_GAIN.stamp,.9,false,0,0,undefined,pan);
}});
document.addEventListener('visibilitychange',()=>{scatterSlam.setPaused(document.hidden,performance.now());scatterDeath.setPaused(document.hidden);});
const actionFeedback=createActionFeedback({G,reduced});
document.addEventListener('visibilitychange',()=>actionFeedback.setPaused(document.hidden,performance.now()));
window.addEventListener('pagehide',()=>actionFeedback.clear());
const bombFX=createBombFX({G,bounds:{x:G.x-62,y:G.y-40,w:G.w+124,h:Math.min(H-8,G.y+G.h+60)-(G.y-40)},reduced,getTile:name=>gameTile(name),getAudio:()=>{soundInit();return audio?{context:audio,master:bus()}:null;},isMuted:()=>muted,onKick:(strength,now)=>impactMotion.kick(strength,now)});
document.addEventListener('visibilitychange',()=>bombFX.setPaused(document.hidden,performance.now()));
window.addEventListener('pagehide',()=>bombFX.clear());
const tumble=createTumbleMotion({G,reduced,tiles:tumbleTiles});
const tricksterGrid=createTricksterGrid({G,reduced});
const modeBackground=createModeBackground({reduced,isMotionEnabled:()=>environment.isMotionEnabled()&&(!phoneView||mobileRenderBudget.motion),isMobile:()=>phoneView});
const reelFrame=createReelFrame({G});
// Bloody rope (Hang 'Em High) and fire + bone crow (Hell To Pay). Lazy: never delays the base game.
const featureBorders=createFeatureBorders({G,reduced});
const lanternLight=createLanternLight({G,reduced});void lanternLight.load();
{const kick=impactMotion.kick.bind(impactMotion);impactMotion.kick=s=>{lanternLight.nudge(Math.min(1.6,(s||4)/4));return kick(s);};}
const anticipation=createScatterAnticipation({G,reduced,onCue:anticipationCue});
document.addEventListener('visibilitychange',()=>anticipation.setPaused(document.hidden,performance.now()));
const cellShooter=createScreenShootout({W,H,reduced,getAmbientTime:()=>environment.motionTime});
// Blood Money duel: our gunslinger shoots the wanted outlaw standing in the opposite street lane (desktop and tablet).
const duelShooter=createBloodGunslinger({reduced,getAmbientTime:()=>environment.motionTime});
const bloodDuel=createBloodDuel({shooter:duelShooter,canvas,getRenderScale:()=>renderScale,reduced,turbo:()=>turbo,onCue:duelCue,onKick:s=>{if(!reduced)impactMotion.kick(s);},getBounty:()=>bloodBank.active?bloodBank.state:null});
document.addEventListener('visibilitychange',()=>bloodDuel.setPaused(document.hidden));
window.addEventListener('pagehide',()=>bloodDuel.stop());
if(location.search.includes('debug'))window.__bloodDuel=bloodDuel;
// The same voices as the wild shot: the holster draw and the shot panned to our man, the hit panned to the porch.
function duelCue(cue){if(muted)return;soundInit();if(!audio)return;
 if(cue.type==='draw')playSample('draw',.72,1.2,false,35,0,undefined,-.22);
 if(cue.type==='shot'){const v=playSample('wildShot',.86,1,false,0,0,undefined,-.22);try{const t=audio.currentTime+(cue.kill?1.5:.9);v?.g?.gain.setTargetAtTime(0,t,.12);}catch(e){}}
 if(cue.type==='fall')playSample('slam',.30,.78,false,0,0,undefined,.34);
 if(cue.type==='impact')playSample('impactw',cue.kill?.56:.4,cue.kill?.94:1,false,0,0,undefined,.34);}
const wildShots=createWildShots({G,figureEffect:cellShooter,reduced,onCue:wildShotCue,onConvert:([c,r])=>{reels[c][r]=M.BOX_WILD;}});
document.addEventListener('visibilitychange',()=>wildShots.setPaused(document.hidden,performance.now()));
document.addEventListener('visibilitychange',()=>tumble.setPaused(document.hidden,performance.now()));
document.addEventListener('visibilitychange',()=>payout.setPaused(document.hidden,performance.now()));
const environment=createGhostTown({ctx,W,H:SCENE_H,reduced});
const character=createCharacter({ctx,reduced});
function updateMotionControl(){const enabled=environment.isMotionEnabled();$('#background-motion').setAttribute('aria-pressed',String(enabled));$('#background-motion').textContent='BACKGROUND MOTION: '+(enabled?'ON':'OFF');}
updateMotionControl();
$('#background-motion').addEventListener('click',()=>{environment.setMotion(!environment.isMotionEnabled());updateMotionControl();setStatus('Background motion '+(environment.isMotionEnabled()?'enabled.':'paused.'));});
// Development only (?debug=1): window.__sickTwisted.force(grid,wild) makes the next spin land a chosen outcome
// for visual review. dev.next is never set outside debug mode, so live play always draws from math.js.
const dev={next:null};
const random=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;};
// Every symbol draw goes through dist/math.js so the game cannot drift from its calibrated RTP.
const paidMode=()=>boost?'boost':enhancer==='outlaw'?'trickster':enhancer==='allin'?'allin':'normal';
const spinMode=()=>bonus?M.freeMode(bonusLabel,bonusMaxEligible):paidMode();
const pick=()=>M.drawSymbol(spinMode());
const spinCost=()=>Math.round(bet*M.SPIN_COST[paidMode()]*100)/100;
const cents=v=>Math.round(v*100)/100;
const sleep=ms=>new Promise(r=>setTimeout(r,ms/(turbo?2:1)));
function setStatus(s){$('#status').textContent=s;}
function soundInit(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}if(audio?.state==='suspended')audio.resume().catch(()=>{});}
let audio=null;
// Sound. Approved recorded effects supply the main actions. Synthesized accents add a shaped
// transient: a filtered noise burst for the mechanical/paper edge and a low pitched thump for weight. Levels
// are set for punch and contrast, well below clipping, through one master gain. Mute is respected.
let noiseBuffer=null,master=null;
// Presentation-only variation: alternate exactly +/-4% around each effect's authored
// pitch, never around its previous playback rate. No game/outcome RNG is consumed.
// Music and the long, composed feature/MAX stings retain their original tuning.
const soundPitchSteps=new Map();
function nextSoundPitch(key){
 if(key==='max'||key.startsWith('featureStart'))return 1;
 const family=/^stop\d+$/.test(key)?'reel-stop':key;
 const first=[...family].reduce((n,c)=>n+c.charCodeAt(0),0)%2?1:-1;
 const direction=soundPitchSteps.has(family)?-soundPitchSteps.get(family):first;
 soundPitchSteps.set(family,direction);return 1+direction*.04;
}
function bus(){if(!master){master=audio.createGain();master.gain.value=muted?0:.9;const lim=audio.createDynamicsCompressor();lim.threshold.value=-4;lim.knee.value=2;lim.ratio.value=16;lim.attack.value=.002;lim.release.value=.16;master.connect(lim);lim.connect(audio.destination);}return master;}   // master + a brick-wall-ish safety limiter
// The master gate catches every voice, including scheduled poster contacts
// and ambient/sample tails which do not belong to a sequence-specific bus.
function syncMasterMute(){
 if(!master||!audio)return;const t=audio.currentTime,g=master.gain;
 g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(muted?0:.9,t+(muted?.012:.035));
}
function noise(){if(!noiseBuffer){const n=Math.round(audio.sampleRate*.3),b=audio.createBuffer(1,n,audio.sampleRate),d=b.getChannelData(0);let x=7;for(let i=0;i<n;i++){x=(x*1664525+1013904223)>>>0;d[i]=x/2147483648-1;}noiseBuffer=b;}return noiseBuffer;}
function burst(t,freq,q,dur,gain,dest){const pitch=nextSoundPitch('burst:'+freq),src=audio.createBufferSource();src.buffer=noise();const f=audio.createBiquadFilter();f.type='bandpass';f.frequency.value=freq*pitch;f.Q.value=q;const g=audio.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(dest||bus());src.start(t);src.stop(t+dur+.02);}
function thump(t,from,to,dur,gain,type='sawtooth',dest){const pitch=nextSoundPitch('thump:'+type+':'+from+':'+to),o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(from*pitch,t);o.frequency.exponentialRampToValueAtTime(to*pitch,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest||bus());o.start(t);o.stop(t+dur+.03);}
// ---- Ambience: the crow -------------------------------------------------------------------------------
// Carter's "Crow-Calls-Isolated" recording (assets/sfx/crow-calls.wav: two calls, A 0.048–0.69 s, B 1.275–1.95 s).
// Two caws every 2.5 s would be maddening, so it is scattered: one call at a time at random intervals, random
// choice of call, alternating +/-2% pitch and varied level, panned mostly towards the crow on the right of the stage,
// and every fourth or so a distant one (quieter, duller, off to the left). Runs only while sound is on and the
// tab is visible; sits low under the theme. Scatter anticipation has its own short steel cue.
const CROW={calls:[[0.048,0.65],[1.275,0.68]],gain:[.14,.24],farGain:[.06,.10],everyMs:[6000,14000],firstMs:[2500,5000]};
const ambience={timer:0,on:false,seed:0x9e3779b9};
const arand=()=>{ambience.seed=(ambience.seed*1664525+1013904223)>>>0;return ambience.seed/4294967296;};   // independent of the outcome RNG
const between=([a,b])=>a+(b-a)*arand();
function caw({gain,rate=1,pan=.5,far=false,delayMs=0,dest}){
 const b=samples.crow;if(!b||muted||!audio)return;
 const [off,len]=CROW.calls[arand()<.5?0:1];
 const src=audio.createBufferSource();src.buffer=b;src.playbackRate.value=rate*nextSoundPitch('crow');
 const g=audio.createGain();g.gain.value=gain;let node=src;
 if(far){const lp=audio.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;src.connect(lp);node=lp;}
 const p=audio.createStereoPanner?audio.createStereoPanner():null;if(p){p.pan.value=pan;node.connect(p);p.connect(g);}else node.connect(g);
 g.connect(dest||bus());src.start(audio.currentTime+delayMs/1000,off,len);return src;
}
function ambienceTick(){
 ambience.timer=0;if(!ambience.on)return;
 if(!document.hidden&&!muted&&samples.crow){const far=arand()<.28;caw(far?{gain:between(CROW.farGain),rate:.97,pan:-.2-.5*arand(),far:true}:{gain:between(CROW.gain),pan:.3+.5*arand()});}
 ambience.timer=setTimeout(ambienceTick,between(CROW.everyMs));
}
function setAmbience(on){
 ambience.on=on;clearTimeout(ambience.timer);ambience.timer=0;
 if(on)ambience.timer=setTimeout(ambienceTick,between(CROW.firstMs));
}
// ---- Theme ------------------------------------------------------------------------------------------
// Full supplied themes, matched in loudness. The sound toggle, master limiter,
// uninterrupted win playback and hidden-tab suspension apply to both tracks.
const music=createThemeMusic({getAudio:()=>audio?{context:audio,master:bus()}:null,isMuted:()=>muted});
let hellMixActive=false,ambienceBeforeHell=false,approvedMixActive=false,crossfireMixActive=false,ambienceBeforeWin=false,ambienceBeforeCrossfire=false;
function hellMix(active){
 if(active===hellMixActive)return;hellMixActive=active;
 if(active){ambienceBeforeHell=ambience.on;scatterSoundsStop({allowAttack:true});anticipationSoundStop();reelSpinStop(.02);shootoutEnd();wildShotSoundsStop();payoutSoundsStop();bloodMoneySoundsStop();setAmbience(false);}
 else if((ambienceBeforeHell||musicWanted)&&musicWanted&&!muted)setAmbience(true);
 if(music.duck&&audio){const g=music.duck.gain,t=audio.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(1,t+.025);}
}
function crossfireMix(active){
 if(active===crossfireMixActive)return;crossfireMixActive=active;
 if(active){ambienceBeforeCrossfire=ambience.on;setAmbience(false);}
 else if(ambienceBeforeCrossfire&&musicWanted&&!muted&&!approvedMixActive&&!crossfireMixActive&&!hellMixActive)setAmbience(true);
 if(music.duck&&audio){const t=audio.currentTime,g=music.duck.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(1,t+.025);}
}
function approvedWinMix(active){
 if(active===approvedMixActive)return;approvedMixActive=active;
 if(active){payoutSoundsStop();ambienceBeforeWin=ambience.on;setAmbience(false);}
 else if(ambienceBeforeWin&&musicWanted&&!muted)setAmbience(true);
 // A separate gain preserves every pre-existing music gain and scheduled fade.
 if(music.duck&&audio){const t=audio.currentTime,g=music.duck.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(1,t+.025);}
}
function musicLoad(){
 return music.load();
}
function musicStart(){
 return music.play();
}
function musicStop(){
 music.stop();
}
let musicWanted=false;   // true while sound is on and nothing else (the Reference recording) owns the speakers
async function setMusic(on){
 musicWanted=on;
 if(on&&(featureScenes.active||bloodEntryPending)){musicStop();setAmbience(false);return;}
 if(!on){musicStop();setAmbience(false);return;}
 soundInit();if(!audio)return;
 samplesLoad().then(()=>{if(musicWanted&&!muted&&!approvedMixActive&&!crossfireMixActive&&!hellMixActive)setAmbience(true);});
 await musicStart();
 if(musicWanted&&!muted)void music.load('blood');
}
document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden)audio.suspend().catch(()=>{});else audio.resume().catch(()=>{});});
// ---- Reel sounds --------------------------------------------------------------------------------------
// The spin is Carter's recording "Gerald Clark Audio – Gun Mech – Revolver Cylinder Spin" (assets/sfx/reel-spin.wav:
// trimmed, mono, 44.1 kHz, peak -2 dBFS; source kept in docs/sfx/). It is one decelerating cylinder spin, so it
// is played in three parts scheduled on the audio clock so its natural end lands exactly on the last reel stop:
// the attack (the cylinder getting up to speed), a seamless loop of the fast steady ratchet (19 clicks, cut on
// click onsets) for as long as the reels keep running, then the release (the ratchet slowing into the final
// lock clicks). Short turbo spins skip the loop and play the attack straight into the tail of the release.
// The six stop knocks (assets/sfx/reel-stop-N.wav, tools/make-reel-sfx.py) play at each reel's exact stop time.
// Fetched with the theme when sound is first enabled; until then, or on failure, the synthesized fallbacks play.
// Scatter: supplied powerful Western recording, played the frame a
// scatter column lands, panned to its reel (scatterDropSound).
// v42: the full approved .38 recording replaces the compressed-video gunshot.
// Character wild shots use the new supplied gunslinger recording, separate from win volleys.
// Draw uses the supplied pistol-from-holster recording, cut for a fast draw.
// Cock is the existing cut. All sounds obey the same master mute.
const SFX_FILES={ropeBurn:'assets/bonus-tease/rope-burn.wav',ropeFizzle:'assets/bonus-tease/rope-fizzle.wav',featureStart:'assets/sfx/feature-whistle.mp3',featureStartHang:'assets/sfx/feature-whistle.mp3',featureStartHell:'assets/sfx/feature-whistle.mp3',spin:'assets/sfx/reel-spin.wav',slam:'assets/sfx/wild-slam.wav',vault:'assets/sfx/full-column-vault.wav',crow:'assets/sfx/crow-calls.wav',click:'assets/sfx/wild-click.wav',tension:'assets/sfx/wild-tension.wav',rip:'assets/sfx/wild-rip.wav',impactw:'assets/sfx/wild-impact.wav',stamp:'assets/sfx/wild-stamp.wav',multi:'assets/sfx/trickster-multiplier.wav',scatter:'assets/sfx/scatter-impact-a.wav',scatterB:'assets/sfx/scatter-impact-b.wav',shot:'assets/sfx/revolver-shot.wav?v=42',wildShot:'assets/sfx/gunslinger-thunder.wav',draw:'assets/sfx/holster-draw.wav?v=64',cock:'assets/sfx/shootout-cock.wav',stop:[1,2,3,4,5,6].map(i=>`assets/sfx/reel-stop-${i}.wav`)};
// Seconds into reel-spin.wav. The release is the ratchet slowing (decel) spliced, inside a silent gap, straight to
// the cylinder's final lock clicks, so the slow-down and the lock both land within the reels' stop stagger.
// v26: the lock clicks are no longer appended — the hammer cocks on the stops are the gun locking now, so the
// ratchet just slows into them (lock left empty: [1.25,1.25]).
const SPIN_SEG={attackEnd:.499,loopStart:.4993,loopEnd:.7941,decel:[.7941,1.25],lock:[1.25,1.25]};
const SAMPLE_GAIN={spin:.48,stop:.72,slam:1.0,click:.5,tension:.55,rip:.75,impactw:.95,stamp:.7,scatter:.9,shot:1.0,draw:.9,cock:.9};   // shot: Carter's revolver, already processed loud — no extra boost, the limiter takes the overlap   // the slam is the loudest thing in the mix: peak −0.5 dBFS × 1.0 × master .9
const SCATTER_DROP={knock:.5,duck:{depth:.6,holdMs:120,releaseMs:480}};   // under the drop the reel's own knock plays at half and the theme dips briefly
const samples={};let samplesLoading=null,samplesFailed=false;
let gunSampleLoading=null;
function gunSoundLoad(){
 if(!gunSampleLoading)gunSampleLoading=(async()=>{
  const Decoder=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const decoder=Decoder?new Decoder(2,1,48000):(audio||=(new (window.AudioContext||window.webkitAudioContext)()));
  await Promise.all(['shot','wildShot','draw'].map(async key=>{if(samples[key])return;const response=await fetch(SFX_FILES[key]);if(!response.ok)throw new Error(key+' recording '+response.status);samples[key]=await decoder.decodeAudioData(await response.arrayBuffer());}));
 })().catch(e=>{gunSampleLoading=null;console.warn('Gun recordings unavailable; retrying on sound enable.',e);});
 return gunSampleLoading;
}
const FEATURE_SOUND_KEYS=['featureStart','featureStartHang','featureStartHell'];
let featureSampleLoading=null;
function featureSoundLoad(){
 if(FEATURE_SOUND_KEYS.every(key=>samples[key]))return Promise.resolve();
 if(!featureSampleLoading)featureSampleLoading=(async()=>{
  const Decoder=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const decoder=Decoder?new Decoder(2,1,48000):(audio||=(new (window.AudioContext||window.webkitAudioContext)()));
  const response=await fetch(SFX_FILES.featureStart);if(!response.ok)throw new Error('Feature recording '+response.status);
  const buffer=await decoder.decodeAudioData(await response.arrayBuffer());
  for(const key of FEATURE_SOUND_KEYS)samples[key]=buffer;
 })().catch(e=>{featureSampleLoading=null;console.warn('Feature recording unavailable; retrying on sound enable.',e);});
 return featureSampleLoading;
}
const BASE_SOUND_KEYS=['vault','ropeBurn','ropeFizzle','spin','scatter','scatterB','click','multi','stop0','stop1','stop2','stop3','stop4','stop5'];
let baseSampleLoading=null;
function baseSoundLoad(){
 if(!baseSampleLoading)baseSampleLoading=(async()=>{
  const Decoder=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  const decoder=Decoder?new Decoder(2,1,48000):(audio||=(new (window.AudioContext||window.webkitAudioContext)()));
  await Promise.all(BASE_SOUND_KEYS.map(async key=>{
   if(samples[key])return;const path=key.startsWith('stop')?SFX_FILES.stop[+key.slice(4)]:SFX_FILES[key];
   const response=await fetch(path);if(!response.ok)throw new Error(key+' recording '+response.status);
   samples[key]=await decoder.decodeAudioData(await response.arrayBuffer());
  }));
 })().catch(e=>{baseSampleLoading=null;console.warn('Base recordings unavailable; retrying on sound enable.',e);});
 return baseSampleLoading;
}
function samplesLoad(){
 if(samplesFailed)return Promise.resolve();
 if(!samplesLoading){const list=[['ropeBurn',SFX_FILES.ropeBurn],['ropeFizzle',SFX_FILES.ropeFizzle],...FEATURE_SOUND_KEYS.map(key=>[key,SFX_FILES[key]]),['spin',SFX_FILES.spin],['slam',SFX_FILES.slam],['vault',SFX_FILES.vault],['crow',SFX_FILES.crow],['click',SFX_FILES.click],['tension',SFX_FILES.tension],['rip',SFX_FILES.rip],['impactw',SFX_FILES.impactw],['stamp',SFX_FILES.stamp],['scatter',SFX_FILES.scatter],['scatterB',SFX_FILES.scatterB],['shot',SFX_FILES.shot],['wildShot',SFX_FILES.wildShot],['draw',SFX_FILES.draw],['cock',SFX_FILES.cock],...SFX_FILES.stop.map((p,i)=>['stop'+i,p])];
  samplesLoading=Promise.all(list.map(([k,p])=>FEATURE_SOUND_KEYS.includes(k)?featureSoundLoad():k==='shot'||k==='wildShot'||k==='draw'?gunSoundLoad():BASE_SOUND_KEYS.includes(k)?baseSoundLoad():fetch(p).then(r=>{if(!r.ok)throw new Error(p+' '+r.status);return r.arrayBuffer();}).then(d=>audio.decodeAudioData(d)).then(b=>{samples[k]=b;}))).catch(e=>{samplesFailed=true;console.warn('Reel samples unavailable, using synthesized effects:',e);});}
 return samplesLoading;
}
function playSample(key,gain=1,rate=1,loop=false,delayMs=0,offsetSec=0,dest,pan=0,pitch=null){
 const b=samples[key];if(!b)return null;
 rate*=pitch??nextSoundPitch(key);
 const src=audio.createBufferSource(),g=audio.createGain();let panner=null;src.buffer=b;src.loop=loop;src.playbackRate.value=rate;g.gain.value=gain;src.connect(g);
 if(pan&&audio.createStereoPanner){panner=audio.createStereoPanner();panner.pan.value=pan;g.connect(panner);panner.connect(dest||bus());}else g.connect(dest||bus());
 src.start(audio.currentTime+Math.max(0,delayMs)/1000,offsetSec);
 return {src,g,panner};
}
const reelAudio={spin:null};
// count: reels that will run; durationMs: time from now until the last of them stops.
function reelsStartSound(count,durationMs){
 scatterSoundsStop({allowAttack:true});
 if(muted)return;soundInit();if(!audio)return;
 if(!samples.spin){sfx('spin');return;}
 reelSpinStop(0);
 const b=samples.spin,S=SPIN_SEG,rate=(turbo?1.06:1)*nextSoundPitch('spin'),t0=audio.currentTime,D=Math.max(.25,durationMs/1000);
 const g=audio.createGain();g.gain.value=SAMPLE_GAIN.spin;g.connect(bus());
 const mk=()=>{const src=audio.createBufferSource();src.buffer=b;src.playbackRate.value=rate;src.connect(g);return src;};
 const decelLen=(S.decel[1]-S.decel[0])/rate,lockLen=(S.lock[1]-S.lock[0])/rate,att=S.attackEnd/rate,rel=decelLen+lockLen,sources=[];
 // release: the decel segment then the lock segment, back to back on the audio clock, ending exactly at t0+D
 const lock=at=>{if(lockLen>0){const k=mk();k.start(at,S.lock[0],S.lock[1]-S.lock[0]);sources.push(k);}};
 const release=(at,tail)=>{if(tail>=rel){const d=mk();d.start(at,S.decel[0],S.decel[1]-S.decel[0]);sources.push(d);lock(at+decelLen);}
  else if(tail>lockLen){const dl=tail-lockLen,d=mk();d.start(at,S.decel[1]-dl*rate,dl*rate);sources.push(d);lock(at+dl);}
  else if(lockLen>0){const k=mk();k.start(at,S.lock[1]-tail*rate);sources.push(k);}};
 if(D>=att+rel){
  const a=mk();a.start(t0,0,S.attackEnd);sources.push(a);                                              // up to speed
  const l=mk();l.loop=true;l.loopStart=S.loopStart;l.loopEnd=S.loopEnd;l.start(t0+att,S.loopStart);l.stop(t0+D-rel);sources.push(l);   // steady ratchet while reels run
  release(t0+D-rel,rel);                                                                               // slows and locks as the reels stop
 }else{
  const attLen=Math.min(att,D*.45);const a=mk();a.start(t0,0,attLen*rate);sources.push(a);             // short spin: attack, then as much of the release as fits
  release(t0+attLen,D-attLen);
 }
 reelAudio.spin={g,sources,count:Math.max(1,count),t0,end:t0+D};
}
function reelSpinStop(fade=.06){
 const sp=reelAudio.spin;if(!sp)return;reelAudio.spin=null;const t=audio.currentTime;
 sp.g.gain.cancelScheduledValues(t);sp.g.gain.setValueAtTime(Math.max(.0001,sp.g.gain.value),t);sp.g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.01,fade));
 for(const src of sp.sources){try{src.stop(t+Math.max(.01,fade)+.02);}catch{}}
}
function reelStopSound(reel,remaining,knock=1){
 if(muted)return;
 if(!samples['stop'+reel]){sfx('land');return;}
 playSample('stop'+reel,SAMPLE_GAIN.stop*knock,(turbo?1.04:1)*[1.01,.985,1.02,.99,1.015,.98][reel],false,0,0,undefined,(reel-2.5)*.15);
 const sp=reelAudio.spin;
 if(sp){const t=audio.currentTime;
  if(remaining<=0){if(t<sp.end-.03){sp.g.gain.cancelScheduledValues(t);sp.g.gain.setValueAtTime(Math.max(.0001,sp.g.gain.value),t);sp.g.gain.exponentialRampToValueAtTime(.0001,t+.08);}reelAudio.spin=null;}
  else{sp.g.gain.cancelScheduledValues(t);sp.g.gain.setValueAtTime(Math.max(.0001,sp.g.gain.value),t);sp.g.gain.exponentialRampToValueAtTime(SAMPLE_GAIN.spin*(.45+.55*remaining/sp.count),t+.05);}}   // the ratchet thins as reels lock
}
// One complete, independently pitched whip per newly landed scatter. Rapid
// contacts preserve the earlier attack and only soften its trailing ring.
const scatterAudio=createScatterAudio({
 getAudio:()=>audio?{context:audio,buffers:[samples.scatter,samples.scatterB],destination:bus()}:null,isMuted:()=>muted,
 fallback:t=>{burst(t,3400,3,.03,.2);burst(t+.004,1900,6,.4,.16);burst(t+.004,720,9,.9,.1);thump(t,140,55,.1,.08);}
});
function scatterSoundsStop(options){scatterAudio.stop(options);}
function scatterDropSound(reel,count=1){
 if(muted)return;soundInit();scatterAudio.land(reel,count);
}
// One shared natural-speed burn follows the visible rope sequence, including
// overlapping cascade lanes. New lanes never stack or restart the ignition.
let anticipationVoice=null,anticipationFizzle=null;
function anticipationSoundStop(){
 if(anticipationFizzle){try{anticipationFizzle.src.stop();}catch{}anticipationFizzle=null;}
 const voice=anticipationVoice;anticipationVoice=null;if(!voice||!audio)return;
 const t=audio.currentTime,g=voice.g.gain;
 try{g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.04);voice.src.stop(t+.045);}catch{}
}
function anticipationCue(cue){
 if(cue.type==='stop'){
  anticipationSoundStop();
  if(cue.fizzle&&!muted&&!reduced&&!document.hidden){
   soundInit();
   if(audio&&samples.ropeFizzle){
    anticipationFizzle=playSample('ropeFizzle',.85,1,false,cue.delayMs??0,0,undefined,0,1);
    if(anticipationFizzle){const voice=anticipationFizzle;voice.src.onended=()=>{voice.src.disconnect();voice.g.disconnect();if(anticipationFizzle===voice)anticipationFizzle=null;};}
   }
  }
  return;
 }
 if(cue.type==='start'){
  anticipationSoundStop();if(!muted)duckMusic(.12,cue.duration,220);return;
 }
 if(cue.type!=='reel'||anticipationVoice||muted||reduced||document.hidden)return;
 soundInit();if(!audio||!samples.ropeBurn)return;
 anticipationVoice=playSample('ropeBurn',1,1,true,0,0,undefined,0,1);
 if(anticipationVoice){
  const voice=anticipationVoice,t=audio.currentTime;
  voice.g.gain.setValueAtTime(0,t);voice.g.gain.linearRampToValueAtTime(1,t+.015);
  voice.src.onended=()=>{voice.src.disconnect();voice.g.disconnect();if(anticipationVoice===voice)anticipationVoice=null;};
 }
}

let payoutAudio=null;
function payoutBus(){if(!payoutAudio){payoutAudio=audio.createGain();payoutAudio.connect(bus());}return payoutAudio;}
function payoutSoundsFade(level){if(payoutAudio){const t=audio.currentTime,g=payoutAudio.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(level,t+.014);}}
function payoutSoundsStop(){
 const dest=payoutAudio;payoutAudio=null;if(!dest)return;
 // A short audio-clock release avoids chopping blood/impact tails at a seam.
 const t=audio.currentTime,g=dest.gain;g.cancelScheduledValues(t);
 if(typeof document!=='undefined'&&document.hidden){g.setValueAtTime(0,t);return;}
 g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.025);
}
function sfx(type,destination=null){
 if(muted)return;soundInit();if(!audio)return;const t=audio.currentTime,out=destination==='payout'?payoutBus():null;
 const puff=(...args)=>burst(...args,out),hit=(at,from,to,dur,gain,type)=>thump(at,from,to,dur,gain,type,out),sample=(key,gain)=>playSample(key,gain,1,false,0,0,out);
 switch(type){
  case 'spin': puff(t,2200,1.5,.03,.05);hit(t,150,40,.11,.06);break;                 // mechanical release: click + clunk
  case 'refill': hit(t,94,32,.13,.075);puff(t,1150,.8,.028,.055);break;
  case 'land': puff(t,1800,1.2,.024,.075);hit(t,90,34,.09,.055);break;               // reel clack: dry knock + short thud
  case 'nudge': hit(t,70,26,.22,.095);puff(t,600,.8,.06,.06);puff(t+.012,2400,2,.02,.03);break;   // poster slam: heavy thud + paper snap
  case 'win': if(!sample('stamp',.5))puff(t,3000,2.5,.018,.035);hit(t,130,60,.12,.06);break;                // amount stamp: one dry thud + tick
  case 'big': if(!sample('impactw',.65))puff(t,500,.7,.08,.07);hit(t,60,24,.24,.085);break;   // big win: two heavy strikes
  case 'tick': puff(t,2600,3,.018,.03);break;
  case 'brand': if(!sample('stamp',.6))puff(t,3000,2.5,.02,.04);hit(t,78,26,.24,.1);puff(t+.015,4800,1.4,.5,.045);puff(t+.02,1900,.9,.35,.03);break;   // branding iron: iron slam + long sizzle                                           // group emphasis: a short tick
  default: hit(t,180,30,.13,.035);
 }
}
// Trickster multiplier sting: the supplied recording (assets/sfx/trickster-multiplier.wav), one hit per upgraded cell in
// strike order, pitched UP hard with the multiplier's size and a little more with each hit in the same tumble:
// ×2 plays as recorded, ×4 a third higher, ×8 a fifth, ×16 an octave, ×32 an octave and a fourth, ×64 an octave and a
// sixth... (rate = 2^((tier-1)*.32 + hit*.06), capped at 4x). Panned to the cell's column. No synthesis.
// Heat bed: a low, filtered rumble that follows the board's heat (no pitch, no melody). Starts only on a hot board.
let heatNodes=null,heatLevel=0;
function heatBed(level){
 if(muted||document.hidden)level=0;const want=Math.max(0,level-.08)/.92;
 if(want<=0&&!heatNodes)return;soundInit();if(!audio)return;
 if(!heatNodes){const src=audio.createBufferSource();src.buffer=noise();src.loop=true;const lp=audio.createBiquadFilter();lp.type='lowpass';lp.frequency.value=110;lp.Q.value=.7;
  const lp2=audio.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=180;const g=audio.createGain();g.gain.value=0;src.connect(lp);lp.connect(lp2);lp2.connect(g);g.connect(bus());src.start();heatNodes={src,lp,g};}
 if(Math.abs(want-heatLevel)>.01){heatLevel=want;const t=audio.currentTime;heatNodes.g.gain.cancelScheduledValues(t);heatNodes.g.gain.setTargetAtTime(.11*want*want,t,.25);heatNodes.lp.frequency.setTargetAtTime(90+120*want,t,.3);}
 if(want<=0&&heatNodes){const n=heatNodes;heatNodes=null;heatLevel=0;setTimeout(()=>{try{n.src.stop();n.src.disconnect();n.g.disconnect();}catch{}},900);}
}
// Riser before a big strike: filtered noise sweeping up, no pitch.
function riserSound(ms=400){
 if(muted)return;soundInit();if(!audio)return;const t=audio.currentTime,d=ms/1000,src=audio.createBufferSource();src.buffer=noise();const f=audio.createBiquadFilter();f.type='bandpass';f.Q.value=2.2;
 f.frequency.setValueAtTime(220,t);f.frequency.exponentialRampToValueAtTime(3600,t+d);const g=audio.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+d*.9);g.gain.exponentialRampToValueAtTime(.0001,t+d+.05);
 src.connect(f);f.connect(g);g.connect(bus());src.start(t);src.stop(t+d+.1);
}
let brandCombo=0;
function brandSound(hits,staggerMs=0){
 if(muted||!hits.length)return;soundInit();if(!audio||!samples.multi)return;
 hits.forEach(({value,c},i)=>{
  const tier=Math.max(1,Math.round(Math.log2(value))),rate=Math.min(4,Math.pow(2,(tier-1)*.32+i*.06+Math.min(3,brandCombo)*.03));
  playSample('multi',.95,rate,false,i*staggerMs,0,undefined,Math.max(-.7,Math.min(.7,(c-2.5)/3.6)),1);
  if(tier>=5)playSample('impactw',.45,.9,false,i*staggerMs,0,undefined,Math.max(-.7,Math.min(.7,(c-2.5)/3.6)),1);   // ×32 and up: a heavier payoff under the hit
 });
 brandCombo++;
}
function bigWinSound(cue){
 if(muted||reduced)return;soundInit();if(!audio)return;
 const t=audio.currentTime,out=payoutBus(),tier=cue.tier||1;
 if(cue.type==='hoof'){
  const gain=[.25,.20,.29,.23][cue.hoof]*(.6+.65*(cue.approach||0)),rate=[.76,.88,.71,.82][cue.hoof];
  playSample('stop'+cue.hoof,gain,rate,false,0,0,out);
  thump(t,102,35,.085,gain*.35,'triangle',out);
 }else if(cue.type==='skid'){
  playSample('rip',.65,.82,false,0,0,out);burst(t,680,.72,.30,.22,out);
  thump(t,90,30,.22,.09,'triangle',out);
 }else if(cue.type==='prelude'){
  playSample('tension',.22,1.45,false,0,0,out);duckMusic(.30,1350,650);
 }else if(cue.type==='hit'){
  playSample('impactw',.26+tier*.07,1.02-tier*.025,false,0,0,out);
  thump(t,82,30,.19,.04+tier*.009,'triangle',out);duckMusic(.55,280,280);
 }else if(cue.type==='entrance'){
  playSample('impactw',.76+tier*.045,.82,false,0,0,out);
  playSample('stamp',.62,.92,false,0,0,out);
  thump(t,66,24,.34,.15,'triangle',out);burst(t,1200,.7,.065,.16,out);duckMusic(.24,420,650);
 }else if(cue.type==='finish'){
  playSample('stamp',.54,1,false,0,0,out);thump(t,115,43,.19,.07,'triangle',out);
 }
}
// One voice per symbol type per reaction, balanced across concurrent types.
function reactionSound(type,gain=1){
 if(muted)return;soundInit();if(!audio)return;const t=audio.currentTime,out=payoutBus();
 const puff=(...args)=>burst(...args,out),hit=(at,from,to,dur,gain,type)=>thump(at,from,to,dur,gain,type,out),sample=(key,gain,rate=1)=>playSample(key,gain,rate,false,0,0,out);
 if(type==='trap'){puff(t,4100,5,.025,.11*gain);puff(t+.003,1700,7,.11,.075*gain);hit(t,155,75,.065,.04*gain,'triangle');}
 else if(type==='gun'){if(!sample('click',.45*gain))puff(t,2800,4,.025,.10*gain);hit(t,135,70,.05,.045*gain,'triangle');}
 else if(type==='liquid'){puff(t,740,2,.10,.045*gain);puff(t+.025,1050,3,.085,.027*gain);}
 else if(type==='outlaw'){if(!sample('tension',.12*gain,1.5))puff(t,1100,1,.055,.035*gain);}
 else {if(!sample('stamp',.3*gain))puff(t,1800,2,.025,.07*gain);hit(t,110,65,.06,.03*gain,'triangle');}
}
function snapState(){return{reelCount:REEL_COUNT,rows:ROW_COUNT,ready,busy,enhancer:boost?'booster':enhancer,mode:spinMode(),currency:'USD',winBoost:roundMeta.winBoost,maxEligible:roundMeta.maxEligible,bonusMaxEligible,balance:Number(balance.toFixed(2)),bet,totalWin:Number(totalWin.toFixed(2)),multiplier,remainingSpins:freeSpins,reels:reels.map(r=>[...r]),wilds:Object.fromEntries(Object.entries(wilds).map(([k,v])=>[k,{multiplier:v.mult,kind:v.kind,locked:!!v.locked}])),hang:hangPresentation.active?hangPresentation.state:null};}
function idleGrid(){
 const grid=[['a','k','j','q'],['bandit','star','ten','guns'],['cuffs','bottle','q','a'],['k','guns','skull','j'],['ten','q','bottle','cuffs'],['star','a','guns','bottle']];
 // Opening display only: no outcome evaluation, award or change to MAX eligibility.
 // The first spin replaces this board through the existing outcome pipeline.
 const maxCells=new URLSearchParams(location.search).get('preview')==='max'?[[0,1],[2,2],[3,0],[5,3]]:[[2,1],[4,2]];
 for(const [c,r] of maxCells)grid[c][r]='max';
 return grid;
}
// Development preview only: lands token artwork on the reels with no bet, no evaluation and no credits changed.
async function previewTokens(name='max',positions=[[0,1],[2,2],[3,0],[5,3]],wildReel=null){if(!ready||busy||!symbolTiles[name])return false;const token=sequenceToken;setBusy(true);wilds={};multiplier=0;ink=false;setStatus('Development preview · token artwork.');const target=M.drawGrid('normal');for(const [c,r] of positions)target[c][r]=name;await spinReels(target);if(token!==sequenceToken)return false;if(wildReel!==null){await revealFullReelWild({reel:wildReel,mult:M.wildMultiplier(2),spawn:2},true);await sleep(400);}setBusy(false);setStatus('Development preview complete.');return true;}
function setBusy(v){busy=v;$('#spin').disabled=false;for(const id of ['normal','bomb-preview','mark-preview','blood-preview','nudge-demo','deader-demo','menu','bet-down','bet-up'])$('#'+id).disabled=v;$('#spin').hidden=false;$('#menu').hidden=false;$('#autoplay').hidden=bonus;}
function totalMultiplier(){multiplier=Object.values(wilds).reduce((a,w)=>a+w.mult,0);}
// The OUTLAW WILD slam: Carter's recording "Lukas Tvrdon – Door storeroom slam angry designed"
// (assets/sfx/wild-slam.wav, cut so the impact sits SLAM_LEAD_MS into the file). It is scheduled on the audio
// clock so the recorded impact lands on the exact contact frame (delayMs), with the theme ducked hard
// underneath it so the slam owns the moment. Falls back to the synthesized thump until the samples are loaded.
// v29: the slam is Carter's "Barney Oram – Black Powder Guns – Shotgun The Punisher" — four takes of one
// black-powder shotgun blast packed into assets/sfx/wild-slam.wav at SLAM_TAKE_LEN each, muzzle transient
// SLAM_LEAD_MS into every take. Consecutive slams rotate through the takes so no two in a row are the same file.
const SLAM_LEAD_MS=12,SLAM_TAKE_LEN=1.45,SLAM_TAKES=4;let slamTake=0,slamSeed=0x2545f491;const srand=()=>{slamSeed=(slamSeed*1664525+1013904223)>>>0;return slamSeed/4294967296;};   // presentation-only RNG
function wildSlamSound(strength=1,delayMs=0,duck=true){
 if(muted)return;soundInit();if(!audio)return;
 if(!samples.slam){sfx('nudge');return;}
 const rate=(strength>=1?1:1.06)*nextSoundPitch('slam');
 const early=Math.min(SLAM_LEAD_MS/rate,Math.max(0,delayMs));   // pitch-corrected lead-in: the transient still lands at delayMs
 const skipped=(SLAM_LEAD_MS-early*rate)/1000;
 const take=slamTake;slamTake=(slamTake+1+Math.floor(srand()*(SLAM_TAKES-1)))%SLAM_TAKES;   // never the same take twice running
 const src=playSample('slam',Math.min(1,SAMPLE_GAIN.slam*strength),rate,false,delayMs-early,take*SLAM_TAKE_LEN+skipped,undefined,0,1);
 if(src)src.src.stop(audio.currentTime+Math.max(0,delayMs-early)/1000+(SLAM_TAKE_LEN-skipped)/rate);   // one take only, even when pitched up
 if(duck)duckMusic(1-.75*Math.min(1,strength),260,700,delayMs);
}
function duckMusic(){ /* Gameplay effects never change the theme's level. */ }
function impact(strength=1,jolt=false){if(jolt)impactMotion.kick(5*strength);wildSlamSound(strength);}
function drawText(text,x,y,size,color='#fff',align='center',font='Western'){
 ctx.font=`bold ${size}px ${font},Georgia,serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineWidth=1.4;ctx.strokeStyle='#221012';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function drawCell(sym,c,r,offset=0){
 const x=G.x+c*G.cw,y=G.y+r*G.ch+offset,tile=gameTile(sym);
 if(cacheSettledCells&&offset===0&&tile&&!(sym==='scatter'&&scatterSlam.sample(c,r,lastTime))){
  const cell=settledCells[c*ROW_COUNT+r];
  if(!cell.raster)cell.raster=createStaticRaster({x,y,width:G.cw,height:G.ch,paint:target=>target.drawImage(cell.tile,x,y,G.cw,G.ch)});
  if(cell.tile!==tile){cell.tile=tile;cell.raster.clear();}
  cell.raster.draw(ctx);
 }else drawSprite(sym,x,y,G.cw,G.ch);
}
// ---- Reel motion: fall-in (v30, modelled frame by frame on the Waylander's Forge recording) --------------
// There is no spinning strip. On spin the old symbols drop out of the frame together (a gravity fall, columns
// a few ms apart), the board stands empty for a beat with the ghost town showing through, then the new symbols
// fall in from above, column by column left to right; inside a column the bottom symbol enters first and the
// rest follow a few frames behind so the stack lands almost as one, with a single short bounce. The landing
// symbols ARE the final grid, so nothing is ever substituted. All times are on the animation clock; every
// column's landing time (st.start + st.duration) is exact and is what the stop sounds and dust key to.
const FALL={dropMs:200,dropStagger:6,gapMs:60,colStagger:65,cellStagger:38,cellMs:33,bounceAmp:5.8,bounceMs:130,blur:.45};
const MOTION={dustMs:340};
const fallScale=()=>turbo?.55:1;
// A column's landing time relative to its fall start: the top cell enters last (3 staggers) and travels one row.
function fallDuration(){const k=fallScale();return Math.max((ROW_COUNT-1)*FALL.cellStagger+FALL.cellMs,ROW_COUNT*FALL.cellMs)*k;}
// One short bounce of the landed column (down, then back), damped, identical on every reel.
function settleOffset(landTime,now){
 if(!landTime||reduced)return 0;const u=now-landTime,ms=FALL.bounceMs*fallScale();
 if(u<=0||u>=ms)return 0;const q=u/ms;
 return FALL.bounceAmp*(q<.2?Math.sin(q/.2*Math.PI/2):Math.exp(-(q-.2)*6)*(1-q)/.8);
}
function reelTime(now){return spinReels.run?.pausedAt??now;}
// Dust dislodged from a stopping reel's lower edge: a few grains, one authored spray per reel, cleared each spin.
const reelDust={};
// [x offset (× reel width), drop, size, soft] — three soft puffs carry the cloud, six grains give it grit.
const DUST_SPRAY=[[-.3,.9,6,1],[.05,.7,7,1],[.34,1.1,5.5,1],[-.42,1.2,2.4,0],[-.18,1.5,1.8,0],[.12,1.3,2.2,0],[.26,.8,2.8,0],[.46,1.4,2.0,0],[-.05,1.8,1.6,0]];
function drawReelDust(now){
 if(reduced)return;
 now=reelTime(now);
 ctx.save();
 for(const c in reelDust){
  const d=now-reelDust[c];if(d<0||d>MOTION.dustMs)continue;const q=d/MOTION.dustMs,x0=G.x+c*G.cw+G.cw/2,y0=G.y+G.h-2;
  for(const [dx,sp,sz,soft] of DUST_SPRAY){
   // Dislodged outward and a little down from the lower edge, spreading as it fades.
   const e=1-(1-q)*(1-q),px=x0+dx*G.cw*(1+.45*e),py=y0+sp*12*e+3;
   ctx.globalAlpha=(1-q)*(soft?.38:.8);ctx.fillStyle=soft?'#d9cfb4':'#eae0c6';ctx.beginPath();ctx.ellipse(px,py,sz*(1+.8*e),sz*.6*(1+.5*e),0,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}
// Directional blur: each symbol tile is pre-blurred vertically at two strengths (the artwork keeps its
// proportions; only its edges soften along the direction of travel). Speed picks the mix.
const motionTiles={};
const MOTION_BLUR={short:5,long:15};   // 1x radii in px (full kernels ≈9% / 26% of a cell; per-frame travel at full speed is ≈33%)
function verticalBoxBlur(tile,radius){
 const w=tile.width,h=tile.height,out=document.createElement('canvas');out.width=w;out.height=h;
 const src=tile.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,img=new ImageData(w,h),dst=img.data,n=2*radius+1;
 for(let x=0;x<w;x++)for(let ch=0;ch<4;ch++){
  let sum=0;const at=y=>src[((Math.max(0,Math.min(h-1,y))*w+x)<<2)+ch];
  for(let y=-radius;y<=radius;y++)sum+=at(y);
  for(let y=0;y<h;y++){dst[((y*w+x)<<2)+ch]=Math.round(sum/n);sum+=at(y+radius+1)-at(y-radius);}
 }
 out.getContext('2d').putImageData(img,0,0);return out;
}
function prepareMotionTiles(){
 const s=3;   // symbol tiles are rendered at 3x
 for(const [name,tile] of Object.entries(symbolTiles))motionTiles[name]=[verticalBoxBlur(tile,MOTION_BLUR.short*s),verticalBoxBlur(tile,MOTION_BLUR.long*s)];
 for(const [name,tile] of Object.entries(outlawArt.tiles))if(!name.endsWith('-dead'))outlawMotion[name]=[verticalBoxBlur(tile,MOTION_BLUR.short*s),verticalBoxBlur(tile,MOTION_BLUR.long*s)];
}
// Draws one cell of a moving strip: the crisp tile, then the blurred tile(s) over it by speed. Always opaque.
function drawMovingCell(sym,c,r,dy,blur){
 const x=G.x+c*G.cw,y=G.y+r*G.ch+dy,m=bloodBank.active&&outlawMotion[sym]||motionTiles[sym];
 if(!m||blur<=.02){drawSprite(sym,x,y,G.cw,G.ch);return;}
 if(blur<.5){drawSprite(sym,x,y,G.cw,G.ch);ctx.globalAlpha=blur/.5;ctx.drawImage(m[0],x,y,G.cw,G.ch);ctx.globalAlpha=1;return;}
 ctx.drawImage(m[0],x,y,G.cw,G.ch);
 if(blur>.52){ctx.globalAlpha=Math.min(1,(blur-.5)/.5);ctx.drawImage(m[1],x,y,G.cw,G.ch);ctx.globalAlpha=1;}
}
function drawReel(c,now){
 const realNow=now;
 if(tumble.drawColumn(ctx,c,now,drawSprite))return;
 now=reelTime(now);
 const st=spinning[c],x0=G.x+c*G.cw;
 ctx.save();ctx.beginPath();ctx.rect(x0,G.y,G.cw,G.h);ctx.clip();
 if(st?.motion&&reduced){
  for(let r=0;r<ROW_COUNT;r++)drawCell((st.landed?st.target:st.old)[r],c,r);
 }else if(st?.motion){
  const sample=st.motion.sample(st,now),position=sample.position;
  // Draw beyond both mask edges. The final block is part of this same strip,
  // so there is no landing-time artwork replacement, even during slowdown.
  for(let i=Math.floor(-position)-1;i<=Math.ceil(ROW_COUNT-position)+1;i++)
   drawMovingCell(st.motion.symbol(st,i),c,i,position*G.ch,reduced?0:sample.blur);
 }else if(st){
  const k=fallScale();
  // 1) the old symbols drop out together: gravity, from rest, gone once they clear the frame
  const td=now-st.dropStart,dropMs=FALL.dropMs*k;
  if(td<dropMs){const q=Math.max(0,td/dropMs),off=(G.h+G.ch)*q*q,blur=reduced?0:Math.min(FALL.blur,q*1.2);for(let r=0;r<ROW_COUNT;r++)drawMovingCell(st.old[r],c,r,off,blur);}
  // 2) the new symbols fall in from above: bottom cell first, each a few frames behind the one below it
  for(let r=ROW_COUNT-1;r>=0;r--){
   const fk=st.fallScale??k,t=now-(st.start+(ROW_COUNT-1-r)*FALL.cellStagger*fk);if(t<0)continue;
   const travel=(r+1)*G.ch,ms=(r+1)*FALL.cellMs*fk,p=Math.min(1,t/ms);
   const off=-travel*(1-p*p);                                             // gravity: it accelerates into place
   drawMovingCell(st.target[r],c,r,off,p<1&&!reduced?FALL.blur:0);
  }

 }else{
  // At rest: the settled grid, plus the brief bounce right after landing.
  const b=reels[c].settled?0:settleOffset(reels[c].landTime,now);
  for(let r=0;r<ROW_COUNT;r++){
   if(bombFX.hides(c,r,realNow))continue;
   const punch=wilds[c]?null:crossfire.reaction(c,r);
   if(punch){const px=G.x+c*G.cw,py=G.y+r*G.ch+b;ctx.save();ctx.beginPath();ctx.rect(px,py,G.cw,G.ch);ctx.clip();ctx.translate(px+G.cw/2+punch.dx,py+G.ch/2+punch.dy);ctx.rotate(punch.rotation);ctx.scale(punch.scale,punch.scale);ctx.translate(-px-G.cw/2,-py-G.ch/2);}
   if(!bloodBank.drawUpgrade(ctx,c,r,G.x+c*G.cw,G.y+r*G.ch+b,G.cw,G.ch,realNow,drawSprite)){
    const name=reels[c][r],dead=bloodBank.active&&defeatedOutlaws.get(c+':'+r)===name;
    if(dead){
     const shot=crossfire.state.shots.find(s=>s.c===c&&s.r===r),age=shot?crossfire.state.time-shot.impact:1;
     const kick=reduced?0:Math.max(0,1-age/.13),x=G.x+c*G.cw,y=G.y+r*G.ch+b;
     ctx.save();ctx.beginPath();ctx.rect(x,y,G.cw,G.ch);ctx.clip();ctx.translate(x+G.cw/2,y+G.ch*.63);ctx.rotate(kick*.025);ctx.drawImage(bloodTile(name,true),-G.cw/2,-G.ch*.63+kick*2,G.cw,G.ch);ctx.restore();
    }else drawCell(name,c,r,b);
   }
   if(punch)ctx.restore();
   const reaction=payout.reaction(c,r,now);
   if(reaction&&!(bloodBank.active&&OUTLAW_NAMES[reels[c][r]]))symbolReactions.draw(ctx,reels[c][r],G.x+c*G.cw,G.y+r*G.ch+b,G.cw,G.ch,reaction);
  }
 }
 ctx.restore();
}
// The complete wild drops through four row contacts, then the outlaw swings.
const WILD_UNFURL={dimAlpha:.15};
const wildSpeed=()=>turbo?WILD_STEPS.turboRate:1;
const wildHitMs=()=>WILD_LANDINGS[3]*1000/wildSpeed();
function smoothstep(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
function wildRowCrossMs(k,rate=wildSpeed()){return WILD_LANDINGS[Math.max(0,Math.min(k,M.WILD_STEPS))]*1000/rate;}
function wildElapsed(w,now){
 if(w.motionRate===undefined)w.motionRate=wildSpeed();
 const clock=w.pausedAt??now;
 return Math.max(0,clock-w.enter-(w.pausedMs||0))*w.motionRate;
}
document.addEventListener('visibilitychange',()=>{
 const now=performance.now();
 for(const w of Object.values(wilds)){
  if(document.hidden&&w.pausedAt==null)w.pausedAt=now;
  else if(!document.hidden&&w.pausedAt!=null){w.pausedMs=(w.pausedMs||0)+now-w.pausedAt;w.pausedAt=null;}
 }
});
function wildTagValue(w,k){
 const spawn=w.spawn??(Number.isInteger(w.mult/Math.pow(2,M.WILD_STEPS))?w.mult/Math.pow(2,M.WILD_STEPS):null);
 return spawn===null?w.mult:spawn*Math.pow(2,Math.min(k,M.WILD_STEPS));
}
function wildFrame(w,now){
 const elapsed=wildElapsed(w,now),t=elapsed/1000;
 const step=w.offset?stepMotionAt(t):null,k=step?Math.max(0,step.claimed-1):M.WILD_STEPS;
 return {t,step,mode:w.offset?'steps':'idle',value:hangPresentation.upgradeValue(w.reel,now)??(reduced||w.locked&&k>=M.WILD_STEPS?w.mult:wildTagValue(w,k))};
}
function wildSprite(mult,w=null){
 const value=Math.max(1,Math.round(mult||1));
 if(!w&&wildTiles[value])return wildTiles[value];
 const art=document.createElement('canvas');art.width=G.cw*3;art.height=G.h*3;
 const ac=art.getContext('2d'),state=w?wildFrame(w,performance.now()):{t:0,mode:'idle',value};
 if(hangingWildArt)drawOutlaw(ac,hangingWildArt,state.t,state.mode,{multiplier:state.value,reduced,rect:{x:0,y:0,w:art.width,h:art.height}});
 const result={art,temporary:!!w,num:null,cx:G.cw/2,cy:G.h*.67};
 if(!w)wildTiles[value]=result;return result;
}
// The supplied vault recording starts at its attack. Every contact is equally loud;
// only pitch descends. Turbo compresses contact times, never the pitch sequence.
const WILD_DROP_PITCHES=Object.freeze([1.30,1.08,.88,.70]);
function wildDropSounds(c,delayMs=0,gain=1,rate=wildSpeed()){
 if(muted)return;soundInit();if(!audio)return;
 const pan=(c-2.5)*.18;
 for(let row=0;row<WILD_LANDINGS.length;row++){
  const delay=delayMs+wildRowCrossMs(row,rate),at=audio.currentTime+delay/1000;
  const voice=playSample('vault',2.30*gain,WILD_DROP_PITCHES[row],false,delay,0,undefined,pan,1);
  if(!voice){burst(at,180*WILD_DROP_PITCHES[row],2,.10,.5*gain);continue;}
  if(row<WILD_LANDINGS.length-1){
   // Clear the previous resonance before the next slam, keeping each attack crisp.
   const next=at+(WILD_LANDINGS[row+1]-WILD_LANDINGS[row])/rate;
   voice.g.gain.setValueAtTime(2.30*gain,at);
   voice.g.gain.setValueAtTime(2.30*gain,next-.055);
   voice.g.gain.linearRampToValueAtTime(0,next-.005);
   voice.src.stop(next);
  }
 }
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function drawWild(c,w,now){
 if(tumble.drawWild(ctx,c,now))return;
 const fade=tumble.wildAlpha(c,now);if(fade<=0||!hangingWildArt)return;
 const state=wildFrame(w,now);
 ctx.save();ctx.globalAlpha*=fade*(w.temporary?hangPresentation.wildAlpha(c,now):1);
 if(w.locked){ctx.beginPath();ctx.rect(G.x+c*G.cw,G.y,G.cw,G.h);ctx.clip();}
 drawOutlaw(ctx,hangingWildArt,state.t,state.mode,{multiplier:state.value,reduced,...(w.locked?hangPresentation.motion(c,now):{}),rect:{x:G.x+c*G.cw,y:G.y,w:G.cw,h:G.h}});
 if(state.step&&!reduced)drawWildStepImpact(c,state.step);
 ctx.restore();
}
function drawWildStepImpact(c,step){
 if(step.age<0||step.age>.14)return;
 const x=G.x+c*G.cw,y=G.y+(step.row+1)*G.ch,q=step.age/.14;
 ctx.save();ctx.globalAlpha*=step.impact;ctx.strokeStyle='#d6bb86';ctx.lineWidth=1.4;
 ctx.beginPath();ctx.moveTo(x+4,y-1);ctx.lineTo(x+G.cw-4,y-1);ctx.stroke();
 for(let i=0;i<6;i++){
  const side=i%2?-1:1,px=x+(side<0?4:G.cw-4)+side*(3+q*(8+i*2)),py=y-2-q*(9+i*2)+q*q*15;
  ctx.fillStyle=i%3?'#9b7950':'#ded0ae';ctx.fillRect(px,py,1.3+i%2,1.1);
 }
 ctx.restore();
}
function drawReelContacts(now){
 if(reduced||tumble.active)return;const clock=reelTime(now);
 for(let c=0;c<REEL_COUNT;c++){
  if((spinning[c]&&!spinning[c].landed)||!reels[c].landTime)continue;const age=clock-reels[c].landTime;
  if(age<0||age>180)continue;
  const a=Math.exp(-age/55),x=G.x+c*G.cw;
  ctx.save();ctx.strokeStyle=`rgba(204,177,139,${a*.55})`;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x+5,G.y+G.h-3);ctx.lineTo(x+G.cw-5,G.y+G.h-3);ctx.stroke();ctx.restore();
  for(let r=0;r<ROW_COUNT;r++)if(reels[c][r]==='scatter'){
   ctx.save();ctx.globalAlpha=a*.75;ctx.lineWidth=2.7;ctx.strokeStyle='#eedfc0';
   ctx.strokeRect(x+5,G.y+r*G.ch+5,G.cw-10,G.ch-10);ctx.restore();
  }
 }
}
function drawRoundReadout(){
 if(payout.active||maxSequence)return;
 if(tumble.active)return;
 if(!hangPresentation.active&&multiplier&&Object.keys(wilds).length>1){drawText('TOTAL',120,98,11,'#d8cdb4');drawText('×'+multiplier,120,119,multiplier>=100?24:28);}

}
const hudMoney=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let hudState=null;
function updateHUD(){
 const mode=paidMode(),next=[balance,totalWin,bet,mode,bonus,busy,freeSpins,automatic>0,roundMode,roundLedger?.stakeCents];
 if(hudState&&next.every((value,i)=>value===hudState[i]))return;
 hudState=next;
 const money=value=>'$'+hudMoney.format(value);
 const values={'balance-value':money(balance),'win-value':money(totalWin),'bet-label':money(bet)+(paidMode()!=='normal'?` ×${M.SPIN_COST[paidMode()]}`:'')};
 for(const [id,value] of Object.entries(values)){const el=$('#'+id);if(el.textContent!==value)el.textContent=value;}
 const enhancerReceipt=['trickster','allin'].includes(roundMode)&&!!roundLedger,net=roundLedger?.netCents||0;
 $('#return-label').textContent=enhancerReceipt?'RETURN':'WIN';
 const receipt=$('#round-net');receipt.hidden=!enhancerReceipt;
 if(enhancerReceipt){receipt.textContent=net===0?'BREAK EVEN':`NET ${net<0?'−':'+'}${money(Math.abs(net)/100)}`;receipt.setAttribute('aria-label',net===0?'Break even':`${net<0?'Net loss':'Net profit'} ${money(Math.abs(net)/100)}`);}
 const spin=$('#spin');spin.classList[bonus?'add':'remove']('has-remaining');
 const label=busy?'Speed up current spin':bonus?`${freeSpins} free spins remaining`:'Spin reels';if(spin.getAttribute('aria-label')!==label){spin.setAttribute('aria-label',label);spin.title=label;}
 const autoplay=$('#autoplay'),pressed=String(automatic>0);autoplay.hidden=bonus;if(autoplay.getAttribute('aria-pressed')!==pressed)autoplay.setAttribute('aria-pressed',pressed);
}
function queueRender(){
 clearTimeout(renderTimer);cancelAnimationFrame(raf);let fired=false;
 const next=()=>{if(fired)return;fired=true;clearTimeout(renderTimer);cancelAnimationFrame(raf);render(performance.now());};
 if(!document.hidden)raf=requestAnimationFrame(next);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready)queueRender();});
function render(now){if(document.hidden)return;const renderStarted=performance.now();
 const sceneHeader=['blood','hang'].includes(featureScenes.state.feature)?230:120;
 if($('#slot-shell').dataset.sceneHeader!==String(sceneHeader)||$('#slot-shell').dataset.sceneFeature!==(featureScenes.state.feature||'')){$('#slot-shell').dataset.sceneHeader=String(sceneHeader);$('#slot-shell').dataset.sceneFeature=featureScenes.state.feature||'';mobileView.measure();}
if(dev.pauseRendering){queueRender();return;}lastTime=now;featureScenes.tick(now);bloodDuel.update(now);modeBackground.setSuspended(featureScenes.hasBackground);featureScenes.setMotion(environment.isMotionEnabled()&&(!phoneView||mobileRenderBudget.motion));ctx.setTransform(renderScale,0,0,renderScale,0,Math.round(sceneTop*renderScale));ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(featureScenes.active&&!featureScenes.revealing){featureScenes.drawIntro(ctx);presentScene();queueRender();return;}ctx.save();ctx.fillStyle='#060203';ctx.fillRect(0,-sceneTop,W,H+sceneTop+sceneBottom);const kick=impactMotion.sample(now),impactZoom=1+Math.max(2*Math.abs(kick.x)/W,2*Math.abs(kick.y)/H);ctx.translate(W/2+kick.x,H/2+kick.y);ctx.scale(impactZoom,impactZoom);ctx.translate(-W/2,-H/2);const shotCamera=crossfire.camera();ctx.translate(W/2+shotCamera.x,H/2+shotCamera.y);ctx.scale(shotCamera.scale,shotCamera.scale);ctx.translate(-W/2,-H/2);
 const cam=shootoutCamera(now);if(cam){ctx.translate(cam.cx+cam.dx,cam.cy+cam.dy);ctx.scale(cam.s,cam.s);ctx.translate(-cam.cx,-cam.cy);}   // the shootout's push-in and shot kicks carry everything drawn below
 bloodPromotion.camera(ctx.getTransform(),renderScale,sceneTop);
 const cacheStatic=!cam&&kick.x===0&&kick.y===0&&shotCamera.scale===1&&shotCamera.x===0&&shotCamera.y===0;
 cacheSettledCells=cacheStatic&&!bloodBank.active&&!crossfire.state.active&&!tumble.active&&Object.keys(spinning).length===0;
 environment.draw(now,{occluded:featureScenes.opaqueBackground||modeBackground.opaque,emphasis:(payout.active||bloodBank.focused) ? .28 : 1,mobile:phoneView,lowPower:!mobileRenderBudget.motion,sceneX:mobileView.layout.sceneX,sceneWidth:mobileView.layout.sceneWidth,top:sceneTop,bottom:sceneBottom,scale:renderScale,cacheStatic});
 // Cover the same continuous world as the reels, portrait header and HUD floor.
 // Ending the mode layer at H exposed the base ground and cut its color grade.
 modeBackground.setMode(paidMode(),now);if(!featureScenes.opaqueBackground)modeBackground.draw(ctx,now,{x:phoneView?mobileView.layout.sceneX:0,y:-sceneTop,w:phoneView?mobileView.layout.sceneWidth:W,h:H+sceneTop+sceneBottom,mobile:phoneView});
 featureScenes.drawBackground(ctx,now);
 // Behind the reels: the ghost town itself, darkened — the hollow board the symbols drop out of and fall into.
 ctx.save();ctx.fillStyle='rgba(6,4,3,.5)';ctx.fillRect(G.x,G.y,G.w,G.h);ctx.restore();
 anticipation.drawUnderlay(ctx,now);
 // Trickster multipliers live under the tiles: seen when a cleared cell empties, and growing there when upgraded.
 tricksterGrid.drawBackground(ctx,now,{hiddenColumns:Object.keys(spinning).map(Number)});
 for(let c=0;c<REEL_COUNT;c++)drawReel(c,now);
 tricksterGrid.drawEffects(ctx,now,{hiddenColumns:Object.keys(spinning).map(Number)});
 tricksterHeat.set(tricksterGrid.snapshot(),now);tricksterHeat.draw(ctx,now);heatBed(tricksterHeat.level);
 drawReelContacts(now);scatterSlam.draw(ctx,now);scatterDeath.draw(ctx,now);
 // While a poster rips in, the other reels dim a little (preview: 38/255), easing back out once it has landed.
 {let dim=0;for(const w of Object.values(wilds)){if(!w.offset||!w.enter)continue;const t=now-w.enter;dim=Math.max(dim,smoothstep(t/130)*(1-smoothstep((t-wildHitMs()-1200)/400)));}
  if(dim>.01&&!payout.active){ctx.save();ctx.fillStyle=`rgba(6,5,4,${WILD_UNFURL.dimAlpha*dim})`;for(let c=0;c<REEL_COUNT;c++)if(!wilds[c])ctx.fillRect(G.x+c*G.cw,G.y,G.cw,G.h);ctx.restore();}}
 for(const [c,w]of Object.entries(wilds))drawWild(Number(c),w,now);
 if(shootout.active){const dim=screenEffect.dim(shootoutElapsed(now));ctx.save();ctx.fillStyle=`rgba(5,5,4,${dim})`;ctx.fillRect(0,0,W,H);ctx.restore();}
 // Wood rails sit outside the playing rectangle. Retain the original if loading fails.
 // Feature borders replace the whole cabinet (including the old crow and lantern). Missing art falls through to the original.
 featureBorders.set({mode:paidMode(),bonus,label:bonusLabel,feature:featureScenes.state.feature},environment.isMotionEnabled()&&(!phoneView||mobileRenderBudget.motion));
 const featureFrame=featureBorders.draw(ctx,{cacheStatic,time:environment.motionTime/1000,animate:environment.isMotionEnabled(),compact:phoneView});
 if(!featureFrame&&!reelFrame.border(ctx,environment.motionTime,environment.isMotionEnabled(),phoneView,cacheStatic)){
 const border=stageHD||art.backdrop;
 ctx.save();ctx.beginPath();ctx.rect(G.x-4,G.y-5,G.w+8,G.h+10);ctx.rect(G.x,G.y,G.w,G.h);ctx.clip('evenodd');
 drawStageSlice(border,0,H);
 if((ink||bonus)&&inkOverlay)drawStageSlice(inkOverlay,0,H);
 ctx.restore();
 }
 // The oil lantern hangs on the right post, over the rails and under everything that plays on the board.
 if(!featureFrame)lanternLight.draw(ctx,now);
 // The grounded figure stands in front of the cabinet's left foot.
 if(bloodBank.active)bloodPromotion.update(bloodBank.presentationTime);
 drawBrand(now);
 anticipation.draw(ctx,now);
 payout.drawBoard(now);
 wildShots.drawBoard(ctx,now,drawSprite);
 actionFeedback.draw(ctx,now,{width:W,top:sceneTop,height:H+sceneBottom});
 bombFX.advance(now);bombFX.draw(ctx,now);

 // The payout coordinator owns all reaction and amount sound cues.
 if(bloodBank.active){
  bloodBank.setReadout(freeSpins,bonusAward,bloodPromotion.shownMultiplier);if(bloodDuel.lane(phoneView))bloodDuel.drawOutlaw(ctx);else if(!bloodDuel.owns(phoneView))bloodBank.drawPoster(ctx,now);bloodDuel.drawOver(ctx);if(!phoneView)bloodTargetGun.drawOver(ctx,bloodPromotion.age,bloodPromotion.target);
  if(!tumble.active&&!bloodPromotion.active&&!bloodDuel.acting)bloodBank.drawHighlights(ctx,reels,now,[...Object.keys(spinning),...Object.keys(wilds)].map(Number));
 }else if(bloodBriefing.active||bloodEntryPending){if(bloodDuel.lane(phoneView)){bloodDuel.drawOutlaw(ctx);bloodDuel.drawOver(ctx);}else if(!bloodDuel.owns(phoneView))bloodBank.drawBriefing(ctx);
 }else{
  drawRoundReadout();
 }
 drawReelDust(now);   // over the frame foot and the HUD gradient, so the puff is actually visible
 hangPresentation.draw(ctx,now,{mobile:phoneView,header:sceneTop,remaining:freeSpins,total:bonusAward});
 updateHUD();
 payout.drawSummary(now);featureRevealStep(now);bloodBank.drawDocking(ctx,now,{board:!bloodDuel.owns(phoneView)});
 ctx.restore();
 featureScenes.drawRevealCover(ctx);
 presentScene();
 if($('#slot-shell').dataset.layout==='portrait'&&(bloodBank.active||bloodBriefing.active||bloodEntryPending)&&!bloodBank.closing){
  portraitCtx.save();portraitCtx.globalAlpha=featureScenes.foregroundAlpha;
  const bh=Math.round(230*renderScale);
  if(bloodHeaderCanvas.width!==portraitCanvas.width||bloodHeaderCanvas.height!==bh){bloodHeaderCanvas.width=portraitCanvas.width;bloodHeaderCanvas.height=bh;}
  bloodHeaderCtx.clearRect(0,0,bloodHeaderCanvas.width,bh);
  bloodBank.portraitHeader(bloodHeaderCtx,bloodHeaderCanvas.width,bh,now,canvas);
  portraitCtx.drawImage(bloodHeaderCanvas,0,portraitCanvas.height-bh);portraitCtx.restore();
 }
 drawScreenGlass(now);if(mobileRenderBudget.sample(performance.now()-renderStarted,phoneView))resizeCanvas();queueRender();
}
// MAX shares the approved filmstrip renderer, clock, sound and controls.
// The existing 2.47-second credit boundary remains independent of presentation.
const MAX_CREDIT_AT=2.47;
let maxSequence=null;
function maxElapsed(now=performance.now()){return maxSequence?((maxSequence.pausedAt??now)-maxSequence.start-maxSequence.pausedMs)/1000:0;}
function maxEnd(){if(!maxSequence)return;maxSequence=null;approvedWin.clear();}
document.addEventListener('visibilitychange',()=>{if(!maxSequence)return;const now=performance.now();if(document.hidden&&maxSequence.pausedAt===null)maxSequence.pausedAt=now;else if(!document.hidden&&maxSequence.pausedAt!==null){maxSequence.pausedMs+=now-maxSequence.pausedAt;maxSequence.pausedAt=null;}approvedWin.setPaused(document.hidden);});
async function maxWait(until,token){while(maxSequence&&token===sequenceToken&&maxElapsed()<until)await wait(25);return !!maxSequence&&token===sequenceToken;}
async function presentMax(value,cells,cell,preview=false,creditId='max:'+roundSerial){
 if(maxSequence)return;
 const token=sequenceToken;stopAutoplay();payout.clear();winning=cells;
 const displayMinor=preview?Math.round(bet*100)*M.MAX_AWARD:Math.round(totalWin*100)+Math.round(value*100);
 maxSequence={start:performance.now(),pausedMs:0,pausedAt:document.hidden?performance.now():null,preview};
 approvedWin.begin(displayMinor,{maxMultiplier:M.MAX_AWARD});
 setStatus(preview?'MAX animation preview. No credits will be awarded.':`MAX WIN · 77,777× base bet · ${money(displayMinor/100)}.`);
 try{
  if(!await maxWait(MAX_CREDIT_AT,token))return;
  if(!preview&&value>0)creditRound(creditId,value);
  while(maxSequence&&token===sequenceToken&&!approvedWin.complete)await wait(16);
 }finally{maxEnd();}
}
async function previewMax(){
 if(!ready||busy)return;
 $('#features').close();setBusy(true);
 try{await presentMax(cents(bet*M.MAX_AWARD),[[0,1],[1,1],[2,1]],[2,1],true);}
 finally{setBusy(false);setStatus('MAX preview complete. No credits changed.');}
}
$('#max-preview').addEventListener('click',previewMax);

let bombPreviewIds=null,bombPreviewIndex=0;
function nextBombPreview(){
 if(!bombPreviewIds)bombPreviewIds=M.CASCADE_DATA.flatMap((e,id)=>e.b&&e.g.length<=5&&e.s<2&&e.t>0&&e.t<1500&&e.w.every(w=>!w.length)?[id]:[]).filter(id=>!M.resolveOutcome(M.outcomeById(id)).steps[0].result.cents);
 if(!bombPreviewIds.length)throw new Error('Bomb preview unavailable');
 return M.outcomeById(bombPreviewIds[bombPreviewIndex++%bombPreviewIds.length],'normal');
}
async function previewBomb(){
 if(!ready||busy)return false;
 if(bonus){setStatus('Finish the current feature before previewing dynamite.');return false;}
 const token=sequenceToken,saved={reels,wilds,multiplier,ink,roundMeta};let completed=false;
 $('#features').close();stopAutoplay();setBusy(true);soundInit();ink=false;
 setStatus('Dynamite preview · blast, refill and win shots. No credits changed.');
 try{
  await runTumbles(nextBombPreview(),token,{preview:true});
  if(token!==sequenceToken)return false;
  await sleep(650);completed=true;return true;
 }catch(error){console.error('Bomb preview failed',error);setStatus('The bomb preview could not finish. Try again.');return false;}
 finally{
  bombFX.clear({allowTail:completed});tumble.clear();payout.clear();winning=[];impactMotion.clear();actionFeedback.clear();
  if(token===sequenceToken){({reels,wilds,multiplier,ink,roundMeta}=saved);tricksterGrid.reset(paidMode()==='trickster',token);if(roundMeta.positionMultipliers)tricksterGrid.set(roundMeta.positionMultipliers);updateHUD();setBusy(false);if(completed)setStatus('Bomb preview complete. No credits changed.');}
 }
}
$('#bomb-preview').addEventListener('click',previewBomb);
async function previewOutlawsMark(){
 if(!ready||busy)return false;
 if(bonus){setStatus('Finish the current feature before previewing Outlaw’s Mark.');return false;}
 const token=sequenceToken,saved={reels:reels.map(col=>[...col]),wilds:structuredClone(wilds),multiplier,ink,roundMeta:structuredClone(roundMeta)};let completed=false;
 $('#features').close();stopAutoplay();setBusy(true);soundInit();ink=false;
 setStatus('Outlaw’s Mark preview · one shot converts six matching symbols. No credits changed.');
 try{
  const outcome=M.withOutlawsMark(M.outcomeById(1125,'allin'),()=>0,{force:true});
  if(!outcome.outlawsMark||outcome.trigger)throw Error('Mark walkthrough unavailable');
  await runTumbles(outcome,token,{preview:true});
  if(token!==sequenceToken)return false;
  await sleep(650);completed=true;return true;
 }catch(error){console.error('Outlaw’s Mark preview failed',error);setStatus('The Outlaw’s Mark preview could not finish. Try again.');return false;}
 finally{
  wildShots.clear();wildShotSoundsStop();tumble.clear();payout.clear();winning=[];anticipation.clear();scatterSlam.clear();scatterDeath.clear();impactMotion.clear();actionFeedback.clear();
  if(token===sequenceToken){({reels,wilds,multiplier,ink,roundMeta}=saved);tricksterGrid.reset(paidMode()==='trickster',token);if(roundMeta.positionMultipliers)tricksterGrid.set(roundMeta.positionMultipliers);updateHUD();setBusy(false);$('#spin').focus({preventScroll:true});if(completed)setStatus('Outlaw’s Mark preview complete. No credits changed.');}
 }
}
$('#mark-preview').addEventListener('click',previewOutlawsMark);

$('#blood-preview').addEventListener('click',()=>{$('#features').close();startBonus(8,'DEAD',0,true);});

async function spinReels(target,hold=[],duration=1250,{featureEntry=false}={}){
 if(target.length!==REEL_COUNT||target.some(reel=>reel.length!==ROW_COUNT))throw new Error('Expected six reels of four symbols.');
 if(spinReels.run){spinReels.run.skipped=true;for(const p of spinReels.run.motion.plans)delete spinning[p.reel];}
 winPopup=null;winning=[];payout.clear();tumble.clear();anticipation.clear();scatterSlam.clear();for(const key in reelDust)delete reelDust[key];void duration;
 const now=performance.now(),token=sequenceToken,k=featureEntry?1:fallScale()*(turbo?1:1.12);
 const eligible=!reduced&&M.MODE_RULES[spinMode()]?.feature.some(p=>p>0);
 const contacts=target.map((_,c)=>now+(FALL.dropMs+FALL.gapMs+c*FALL.colStagger)*k+fallDuration());
 const motion=createReelMotion({old:reels,target,hold,start:now,scale:k,contacts,eligible,timing:featureEntry?FEATURE_BUY_MOTION:turbo?REEL_MOTION:NORMAL_SPIN_MOTION,
  filler:M.SYMBOLS.filter(s=>!['scatter','max',M.BOX_WILD,M.SUBSTITUTE].includes(s)),qualifies:n=>!!M.triggeredSpins(n)});
 const session={pausedAt:document.hidden?now:null,end:motion.end,motion,skipped:false,skip(){this.skipped=true;}};spinReels.run=session;
 for(const st of motion.plans){st.motion=motion;spinning[st.reel]=st;}
 const scatters=[];for(const c of hold)reels[c].forEach((s,r)=>{if(s==='scatter')scatters.push([c,r]);});
 const pause=()=>{
  const at=performance.now();
  if(document.hidden&&session.pausedAt===null)session.pausedAt=at;
  else if(!document.hidden&&session.pausedAt!==null){
   const shift=at-session.pausedAt;motion.shift(shift);session.end+=shift;
   for(const col of reels)if(col.landTime)col.landTime+=shift;
   for(const c in reelDust)reelDust[c]+=shift;session.pausedAt=null;
  }
 };
 document.addEventListener('visibilitychange',pause);
 reelsStartSound(motion.plans.length,Math.max(0,...motion.plans.map(p=>p.contact-now)));
 let anticipationStarted=false,fadeEnd=0;
 const startAnticipation=at=>{
  if(scatters.length<2||scatters.length>=5||motion.quickStopping)return;
  const plans=motion.plans.filter(st=>!st.landed&&st.anticipationPlanned);if(!plans.length)return;
  anticipationStarted=anticipation.begin(at,plans.map(st=>({column:st.reel,start:st.start,at:st.contact,end:st.end})),{scatters,second:scatters.at(-1)});
 };
 if(eligible&&scatters.length>=2&&!document.hidden)startAnticipation(now);
 try{
  while(token===sequenceToken&&spinReels.run===session&&!session.skipped){
   const at=performance.now();
   if(session.pausedAt===null){
    if(eligible&&scatters.length>=2&&!anticipationStarted)startAnticipation(at);
    for(const event of motion.advance(at)){
     const st=event.plan,c=st.reel;reels[c]=[...st.target];reels[c].landTime=event.at;reels[c].settled=true;reelDust[c]=event.at;
     reelStopSound(c,motion.plans.filter(p=>!p.landed).length,st.scatterCount?SCATTER_DROP.knock:1);
     if(st.scatterCount){scatterSlam.land(c,st.target.flatMap((s,r)=>s==='scatter'?[r]:[]),event.at);scatterDropSound(c,st.scatterCount);st.target.forEach((s,r)=>{if(s==='scatter')scatters.push([c,r]);});}
     anticipation.updateScatters(scatters);anticipation.land(c,event.at);
     if(scatters.length>=5){anticipation.finish(event.at,true);reelSpinStop(.08);}
     else if(event.second&&!anticipationStarted)startAnticipation(event.at);
    }
    anticipation.advance(at);
    for(const st of motion.plans)if(at>=st.end)delete spinning[st.reel];
    fadeEnd=anticipationStarted&&!motion.triggered&&!motion.quickStopping?ANTICIPATION.fadeMs:0;
    session.end=motion.end+fadeEnd;
    if(at>=session.end)break;
   }
   await wait(8);
  }
 }finally{
  document.removeEventListener('visibilitychange',pause);
  // A completion, skip or cancellation commits the same supplied board. No
  // transient strip entries can survive into a new spin or an interrupted UI.
  if(spinReels.run===session){
   anticipation.clear();
   for(const st of motion.plans){reels[st.reel]=[...st.target];reels[st.reel].settled=true;delete spinning[st.reel];}
   spinReels.run=null;reelSpinStop(.04);if(token!==sequenceToken||session.skipped)scatterSoundsStop();
  }
 }
}
// One native hanging-outlaw path for base, booster, both enhancers and all features.
async function revealFullReelWild(wild,base=false,voice={count:1,index:0}){
 if(!wild){multiplier=0;return;}
 const token=sequenceToken;
 const rate=wildSpeed(),delayMs=voice.index*55/rate;
 const live={mult:wild.mult,spawn:wild.spawn,kind:'man',reel:wild.reel,locked:!!wild.locked,temporary:!!wild.temporary,stamps:wild.stamps||0,enter:performance.now()+delayMs,offset:G.h,motionRate:rate,pausedMs:0,pausedAt:document.hidden?performance.now():null};
 wilds[wild.reel]=live;
 if(base)ink=true;totalMultiplier();wildDropSounds(wild.reel,delayMs,1/Math.sqrt(voice.count),rate);
 const until=async ms=>{while(token===sequenceToken&&wildElapsed(live,performance.now())<ms)await wait(16);};
 for(let row=0;row<4;row++){
  await until(WILD_LANDINGS[row]*1000);if(token!==sequenceToken)return;
  if(!voice.index&&!reduced)impactMotion.kick(1.8+row*.8+Math.min(1,voice.count*.15));
 }
 actionFeedback.land(wild.reel);
 await until(WILD_ENTRY_END*1000);
}
function evaluate(grid){return M.evaluate(grid,wilds,bet,multiplier,roundMeta);}
async function showWin(value,ways,cells=[],groups=[],opts={}){
 if(groups.some(g=>g.maxHit))return presentMax(value,cells,groups.find(g=>g.maxHit).maxCell,!!opts.preview,opts.creditId);
 if(value<=0&&!groups.length){payout.clear();winning=[];await sleep(180);return;}
 const token=sequenceToken;winning=cells;
 const wager=roundLedger?.stakeCents/100||spinCost(),stake=roundLedger?roundLedger.stakeCents/100:wager,speed=turbo?1.65:1;
 const creditId=opts.creditId??('award:'+roundSerial+':'+awardSerial++);
 // Preserve v53's authoritative credit boundary exactly: 120 ms for an
 // ordinary return, 1920 ms for its existing large-win tier (scaled by turbo).
 // Visual reactions, asset loading and sound have no authority over this value.
 const creditAt=!opts.cascade&&value/wager>=20?1920:120;
 const timing=payout.begin(value,ways,cells,groups,speed,performance.now(),{bet,wager,stake,bonus,turbo,honestFeedback:['trickster','allin'].includes(roundMode)&&!bonus&&!opts.preview,grid:reels,wildReels:Object.keys(wilds).map(Number),bloodMoney:bloodBank.active,...opts});
 if(opts.positionNext)tricksterGrid.animate(opts.positionNext,timing.positionUpgradeAt);
 payout.setPaused(document.hidden,performance.now());if(crossfire.state.active)queueRender();
 const scatter=groups.find(g=>g.symbol==='scatter');
 setStatus(value>0?`Return $${value.toFixed(2)} · ${ways} ways.`+(scatter?` ${scatter.reels} scatters · ${scatter.name} · ${scatter.count} free spins.`:''):scatter?`${scatter.reels} scatters · ${scatter.name} · ${scatter.count} free spins.`:'Paying bounty target · stamp earned.');
 let credited=false;
 while(token===sequenceToken&&payout.active){
  const now=performance.now();
  if(!opts.summaryOnly&&!credited&&value>0&&payout.elapsed(now)>=creditAt){credited=true;if(!opts.preview)creditRound(creditId,value);}
  for(const cue of payout.advance(now)){
   if(cue.type==='reaction')reactionSound(cue.symbolType,cue.gain);
   else if(cue.type==='prelude'||cue.type==='hoof'||cue.type==='skid')bigWinSound(cue);
   else if(cue.type==='hit'||cue.type==='entrance'){impactMotion.kick(cue.type==='hit'?1+cue.tier*.4:6+cue.tier,now);bigWinSound(cue);}
   else if(cue.type==='count')sfx('tick','payout');
   else if(cue.type==='finish'){if(cue.tier)bigWinSound(cue);else sfx('win','payout');if(timing.bigAt)impactMotion.kick(2,now);}
  }
  if(bloodBank.active&&opts.bountyTarget){const firing=crossfire.state;for(const shot of firing.shots)if(shot.bounty&&firing.time>=shot.impact)defeatedOutlaws.set(shot.c+':'+shot.r,opts.bountyTarget);}
  if(payout.finished(now)&&(opts.summaryOnly||credited||value<=0))break;
  await wait(16);
 }
 if(token===sequenceToken)tricksterGrid.finish();else tricksterGrid.cancel(token);
 payout.clear();winning=[];
}
// Every mode consumes the same resolved steps and gravity coordinator.
async function tumbleTo(next,cells,token,{blast=false}={}){
 anticipation.clear();scatterSlam.clear();let anticipationStarted=false;const incomingWilds=[];
 const removed=new Set(cells.map(p=>p.join(':'))),scatters=[];reels.forEach((col,c)=>col.forEach((s,r)=>{if(s==='scatter'&&!removed.has(c+':'+r))scatters.push([c,r]);}));
 let landedScatters=scatters.length,triggered=false;const eligible=M.MODE_RULES[spinMode()]?.feature.some(p=>p>0);
 payout.clear({keepAudio:true});winning=[];for(const k in reelDust)delete reelDust[k];const trickSpeed=turbo?1.65:1/1.12,trickAt=performance.now(),trickHits=tricksterGrid.pendingHits(cells),trickStagger=trickHits.length>1?Math.min(TRICKSTER_STAGGER,420/(trickHits.length-1)):0,trickTop=trickHits.length?Math.max(1,Math.round(Math.log2(trickHits.at(-1).to))):0,trickPause=!reduced&&trickTop>=4?TRICKSTER_BIG_PAUSE:0,trickHold=!reduced&&trickHits.length?TRICKSTER_GROW_HOLD+trickPause+(trickHits.length-1)*trickStagger:0;tumble.begin(reels,next.grid,cells,trickAt,trickSpeed,{wilds,blast,hold:trickHold,anticipation:eligible&&landedScatters>=2&&landedScatters<5,filler:M.SYMBOLS.filter(s=>!['scatter','max',M.BOX_WILD,M.SUBSTITUTE].includes(s)),booster:paidMode()==='boost'});tricksterGrid.reveal(cells,trickAt+((blast?BLAST_TUMBLE_TIME.clear:TUMBLE_TIME.clear)+trickPause)/trickSpeed,(trickHold?TRICKSTER_GROW_HOLD:0)/trickSpeed,trickStagger/trickSpeed);
 if(trickHits.length){const strikeMs=((blast?BLAST_TUMBLE_TIME.clear:TUMBLE_TIME.clear)+trickPause+(trickHold?TRICKSTER_GROW_HOLD*TRICKSTER_BRAND.hit:0))/trickSpeed;
  // anticipation: the bigger the reveal, the longer the build and the harder the hit
  if(trickPause)setTimeout(()=>{if(token===sequenceToken)riserSound(Math.min(420,strikeMs));},Math.max(0,strikeMs-Math.min(420,strikeMs)));
  setTimeout(()=>{if(token!==sequenceToken)return;if(!reduced)impactMotion.kick(Math.min(4.5,2.2+.5*(trickTop-1)));tricksterHeat.strike(.6+.25*trickTop,performance.now());brandSound(trickHits.map(h=>({value:h.to,c:h.c})),trickStagger/trickSpeed);},strikeMs);}tumble.setPaused(document.hidden,performance.now());
 try{while(token===sequenceToken){
  const at=performance.now(),window=tumble.anticipationWindow;
  if(!document.hidden&&!anticipationStarted&&window&&at>=window.start&&at<window.end){anticipationStarted=anticipation.begin(at,window.contacts,{scatters,getScatters:now=>tumble.scatterPositions(now)});}
  anticipation.advance(at);
  payoutSoundsFade(tumble.audioLevel(performance.now()));
  const cues=tumble.advance(performance.now());
  // Coalesce mechanical knocks, but preserve every fresh scatter in the batch.
  if(cues.length){const at=performance.now(),cue=cues.at(-1);for(const landed of cues){reelDust[landed.column]=at;anticipation.land(landed.column,at);landedScatters+=next.grid[landed.column].filter(s=>s==='scatter').length-scatters.filter(p=>p[0]===landed.column).length;}
   if(eligible&&!triggered&&landedScatters>=5){triggered=true;anticipation.finish(at,true);tumble.release(at);}
   reelStopSound(cue.column,0,.66);sfx('refill','payout');
   for(const scatter of cues.filter(c=>c.scatter)){const holes=cells.filter(p=>p[0]===scatter.column).length;scatterSlam.land(scatter.column,next.grid[scatter.column].flatMap((s,r)=>r<holes&&s==='scatter'?[r]:[]),scatter.at);scatterDropSound(scatter.column,scatter.scatterCount);}}
  if(tumble.finished(at))break;
  await wait(16);
 }
 if(token!==sequenceToken)return false;
 reels=next.grid.map(col=>[...col]);
 const retained={};
 for(const [c,w] of Object.entries(next.wilds)){
  const survived=wilds[c]&&(wilds[c].locked&&w.locked||wilds[c].mult===w.mult)&&!cells.some(([column])=>column===+c);
  if(survived)retained[c]=wilds[c];else incomingWilds.push({reel:+c,...w});
 }
 wilds=retained;totalMultiplier();
 }finally{anticipation.clear();tumble.clear();defeatedOutlaws.clear();payoutSoundsStop();}
 // Refill arrivals use the same entrance as first-spin arrivals in every mode.
 await Promise.all(incomingWilds.map((wild,index)=>revealFullReelWild(wild,!bonus,{count:incomingWilds.length,index})));
 return token===sequenceToken;
}
let wildShotVoices=[];
function wildShotCue(cue){
 if(cue.type==='shot')actionFeedback.shot(cue.cell);
 if(cue.type==='reveal')impactMotion.kick(4.2);
 if(cue.type==='impact')impactMotion.kick(wildShots.state?.mark||cue.index===wildShots.state?.targets.length-1?2:1.3);
 if(muted)return;soundInit();if(!audio)return;
 if(cue.type==='draw')duckMusic(.42,(wildShots.state?.end||2)*1000/(wildShots.state?.speed||1),280);
 if(cue.type==='shot')for(const v of wildShotVoices.filter(v=>v.kind==='shot')){try{const t=audio.currentTime;v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);v.g.gain.linearRampToValueAtTime(.16,t+.028);}catch{}}
 const key=cue.type==='draw'?'draw':cue.type==='reveal'?'stamp':cue.type==='impact'?(wildShots.state?.mark?'impactw':'click'):'wildShot';
 const gain=cue.type==='draw'?.72:cue.type==='reveal'?.42:cue.type==='impact'?(wildShots.state?.mark?.56:.34):.86,rate=cue.type==='draw'?1.20*(wildShots.state?.speed||1):cue.type==='reveal'?1.12:cue.type==='impact'?(wildShots.state?.mark?.94:1.15):1;
 const mark=wildShots.state?.mark,targets=wildShots.state?.targets;
 const impactReel=mark?targets.reduce((sum,p)=>sum+p[0],0)/targets.length:cue.cell?.[0];
 const pan=cue.type==='impact'||cue.type==='reveal'?(impactReel-2.5)*.18:-.22;
 const voice=playSample(key,gain,rate,false,0,0,undefined,pan);
 if(voice)wildShotVoices.push({...voice,kind:cue.type});
}
function wildShotSoundsStop(){
 const now=audio?.currentTime||0;
 for(const v of wildShotVoices){try{if(v.g){v.g.gain.cancelScheduledValues(now);v.g.gain.setValueAtTime(v.g.gain.value,now);v.g.gain.linearRampToValueAtTime(0,now+.035);}v.src.stop(now+.04);}catch{}}
 wildShotVoices=[];
}
async function wildShotRun(outcome,token){
 const conversion=outcome.outlawsMark||outcome.shotWilds;if(!conversion)return true;
 if(wildShots.active)return false; // A duplicate presentation cannot restart its clock.
 wildShotSoundsStop();
 wildShots.begin(conversion.targets,performance.now(),turbo?1.15:1,{mark:outcome.outlawsMark?.symbol});if(outcome.outlawsMark)setStatus('Outlaw’s Mark · '+conversion.targets.length+' matching symbols turn wild.');wildShots.setPaused(document.hidden,performance.now());
 const owner=wildShots.state;
 try{
  while(token===sequenceToken&&wildShots.state===owner){
   const now=performance.now();wildShots.advance(now);
   if(wildShots.finished(now)){reels=outcome.grid.map(col=>[...col]);return true;}
   await wait(8);
  }
  return false;
 }finally{if(wildShots.state===owner){wildShotSoundsStop();wildShots.clear();}}
}
async function runTumbles(outcome,token=sequenceToken,{preview=false}={}){
 brandCombo=0;tricksterGrid.reset(outcome.mode==='trickster',token);
 const resolved=M.resolveOutcome(outcome,bet,preview?undefined:roundLedger?.remainingCents);
 const runId=preview?'bomb-preview':roundSerial+':'+awardSerial++;roundMeta={mode:outcome.mode,winBoost:outcome.winBoost,maxEligible:outcome.maxEligible};
 const held=outcome.hang?Object.keys(outcome.hang.before).map(Number):[];
 wilds=Object.fromEntries(held.map(c=>{if(!wilds[c]?.locked)throw Error('A captured Hang wild was lost between spins');return [c,wilds[c]];}));totalMultiplier();
 await spinReels(outcome.outlawsMark?.preGrid||outcome.shotWilds?.preGrid||resolved.steps[0].grid,held);if(token!==sequenceToken){tricksterGrid.cancel(token);return null;}
 const posters=Object.entries(resolved.steps[0].wilds).filter(([c])=>!held.includes(+c));
 await Promise.all(posters.map(([c,w],index)=>revealFullReelWild({reel:+c,...w},!bonus,{count:posters.length,index})));if(token!==sequenceToken){tricksterGrid.cancel(token);return null;}
 if(!await wildShotRun(outcome,token)){tricksterGrid.cancel(token);return null;}
 for(let i=0;i<resolved.steps.length;i++){
  const step=resolved.steps[i],r=step.result;
  if(outcome.blood)roundMeta.winBoost=step.winBoost;
  if(outcome.hang&&step.hang){
   const event=step.hang.event;hangPresentation.sync(step.hang);
   if(event){
    if(event.type==='upgrade'){actionFeedback.upgrade(event.reel);Object.assign(wilds[event.reel],step.wilds[event.reel]);totalMultiplier();if(!muted){soundInit();playSample('tension',.52,.85);}}
    hangPresentation.cue(event,performance.now());
    while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);
    if(token!==sequenceToken)return null;
   }
   if(step.hang.finale&&!hangPresentation.state.finale){
    hangPresentation.cue({type:'finale'},performance.now());
    while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);
    if(token!==sequenceToken)return null;
   }
   if(step.hang.temporaryArrival){
    hangPresentation.cue({type:'temporary',reel:step.hang.temporary.reel},performance.now());
    while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);
    if(token!==sequenceToken)return null;
   }
  }
  defeatedOutlaws.clear();
  tricksterGrid.set(step.positionMultipliers);roundMeta.positionMultipliers=step.positionMultipliers;
  const bountyCells=outcome.blood?payingOutlaws(step):[];
  if(r.cents>0||bountyCells.length)await showWin(r.value,r.ways,r.cells,r.groups,{preview,markFollowThrough:!!outcome.outlawsMark&&i===0,cascade:!r.maxWin,creditId:runId+':'+i,roundReturn:cents((preview?0:totalWin)+r.value),positionNext:step.nextPositionMultipliers,bountyCells,bountyTarget:step.blood?.target,bountyHead:OUTLAW_HEAD[step.blood?.target]});
  if(token!==sequenceToken){tricksterGrid.cancel(token);return null;}
  if(outcome.hang&&r.cents>0){
   hangPresentation.recordWin(r.cents,r.cells,step.wilds);
   const reward=step.hang.reward;
   if(reward?.earned.length&&roundLedger?.remainingCents>0){
    // Credit at the old multiplier first. Reveal the resolved upgrade before
    // the next tumble, without dropping the already-locked Outlaw again.
    hangPresentation.reward(reward,performance.now());
    for(const [c,w] of Object.entries(reward.locks))if(wilds[c])Object.assign(wilds[c],w);
    totalMultiplier();
    while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);
    if(token!==sequenceToken)return null;
   }
  }
  if(outcome.blood&&step.blood?.stamp&&!r.maxWin&&(!roundLedger||roundLedger.remainingCents>0)){
   await presentBounty(step,token,runId+':'+i);if(token!==sequenceToken)return null;
  }
  if(r.maxWin)return resolved;
  if(step.hangRetrigger&&(!roundLedger||roundLedger.remainingCents>0)){
   freeSpins+=step.hangRetrigger.spins;$('#remaining').textContent=freeSpins;
   actionFeedback.retrigger(step.hangRetrigger.cells);
   if(!reduced)$('#remaining').animate([{transform:'scale(1)',color:'#fff'},{transform:'scale(1.16)',color:'#edca78',offset:.3},{transform:'scale(1)',color:'#fff'}],{duration:550,easing:'ease-out'});
   hangPresentation.cue({...step.hangRetrigger,remaining:freeSpins},performance.now());
   if(!muted){soundInit();playSample('scatter',.7,1);}
   while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<1350)await wait(16);
   if(token!==sequenceToken)return null;
  }
  if(i+1<resolved.steps.length){
   let completed=false;
   try{
    // Trickster: cells the bomb destroys double too; record the upgrade now so the blast tumble reveals and brands it.
    if(step.nextPositionMultipliers)tricksterGrid.set(step.nextPositionMultipliers);
    if(step.bomb){
     const now=performance.now();bombFX.begin(step.bomb,step.grid,now,turbo?1.65:1);bombFX.setPaused(document.hidden,now);queueRender();
     while(token===sequenceToken&&!bombFX.readyToRefill(performance.now())){bombFX.advance(performance.now());await wait(8);}
     if(token!==sequenceToken){tricksterGrid.cancel(token);return null;}
     bombFX.release();
    }
    if(!await tumbleTo(resolved.steps[i+1],step.clearCells,token,{blast:!!step.bomb})){tricksterGrid.cancel(token);return null;}
    // Let the final smoke wisps finish before the next resolved event starts.
    while(step.bomb&&token===sequenceToken&&bombFX.active){bombFX.advance(performance.now());await wait(8);}
    if(token!==sequenceToken){tricksterGrid.cancel(token);return null;}
    completed=true;
   }finally{bombFX.clear({allowTail:completed});}
  }
 }
 const bigWin=spinBigWin(resolved,{bet,stake:roundLedger?.stakeCents/100,
  feature:bonus||outcome.mode==='outlaws',preview});
 if(bigWin){
  await showWin(bigWin.value,0,[],[],bigWin.options);
  if(token!==sequenceToken)return null;
 }
 if(outcome.hang?.temporary){
  const reel=outcome.hang.temporary.reel;
  hangPresentation.cue({type:'depart',reel},performance.now());
  while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);
  if(token!==sequenceToken)return null;
  delete wilds[reel];hangPresentation.clearTemporary();totalMultiplier();
 }
 return {...resolved,bigWinPresented:!!bigWin};
}
async function presentBounty(step,token,id){
 const event=step.blood;
 const duel=bloodDuel.lane(phoneView)&&bloodDuel.has(step.bloodBefore.level)&&bountySources(step).length>0&&bloodDuel.hit(step.bloodBefore.stamps,step.bloodBefore.stamps===2,{continueToTarget:event.upgraded});
 if(duel){while(token===sequenceToken&&!bloodDuel.impacted)await wait(16);if(token!==sequenceToken)return;}
 if(!bloodBank.collect(event,step.bloodBefore,performance.now(),{id,sources:bountySources(step)}))return;
 if(!duel){// the revolver fires with the muzzle flash, the camera kicks as the bullet lands, the page tears at the turn
  const T=bloodBank.timings,shotToken=token,delay=ms=>reduced?0:ms;
  setTimeout(()=>{if(shotToken!==sequenceToken||muted)return;soundInit();if(audio)playSample('shot',SAMPLE_GAIN.shot*.9,1.02,false,0,0,undefined,.55);},delay(Math.max(0,T.land-bloodBank.flightMs)));
  setTimeout(()=>{if(shotToken!==sequenceToken)return;if(!reduced)impactMotion.kick(4);lanternLight?.nudge(.9);},delay(T.land));
  if(event.upgraded)setTimeout(()=>{if(shotToken!==sequenceToken||muted)return;soundInit();if(audio)playSample('rip',.32,1.08);},delay(T.turn+120));
 }
 while(token===sequenceToken){
  const now=performance.now();
  for(const cue of bloodBank.advance(now)){
   if(cue.type==='stamp'){/* the shot and the kick are timed to the flash and the landing below */}
   if(cue.type==='reveal'&&!muted){soundInit();playSample('cock',.28,.84);}
   if(cue.type==='upgrade'){
    if(!muted){soundInit();playSample('impactw',.48,.84);playSample('rip',.25,1.15);}
    const reward=bloodRewards.claim(event);
    if(reward){freeSpins+=reward.spins;roundMeta.winBoost=reward.multiplier;$('#remaining').textContent=freeSpins;bloodBank.addSpins(reward.spins);bloodBank.setReadout(freeSpins,bonusAward,bloodPromotion.shownMultiplier);bloodPromotion.show(reward,{defeated:OUTLAW_NAMES[event.target],next:OUTLAW_NAMES[event.next],remaining:freeSpins,clock:bloodBank.presentationTime});}
    const cells=[];reels.forEach((col,c)=>col.forEach((s,r)=>{if(s===event.target&&!wilds[c])cells.push([c,r]);}));
    reels=upgradeGrid(reels,event.state.level);if(!duel)bloodBank.flash(cells,now,event.target,event.next);if(duel)bloodDuel.next(event.state.level);
    setStatus('Bounty claimed. Taking aim at the multiplier target.');
   }
  }
  if(bloodBank.complete(now))break;
  await wait(16);
 }
 if(token===sequenceToken)bloodBank.finishEvent();
 while(token===sequenceToken&&bloodPromotion.active){bloodPromotion.update(bloodBank.presentationTime);await wait(16);}
 if(token===sequenceToken&&duel&&event.upgraded)bloodDuel.revealNext();
 // his reaction plays out before the next spin, so the next round always lands on the pose it starts from
 if(duel){while(token===sequenceToken&&bloodDuel.active&&!bloodDuel.settled)await wait(16);}
}
const bloodReceipt=createBloodReceipt({stage:$('#stage'),reduced,onContinue:()=>bloodBank.continueClose(performance.now())});
const bountyDialog=bloodReceipt.panel;
async function closeBloodBounty(token){
 const now=performance.now();
 if(!bloodBank.beginClose(now,Math.round(bonusAward*100),{remaining:freeSpins,pending:payout.active||tumble.active||wildShots.active||bombFX.active}))throw Error('Bounty closing attempted before feature events settled');
 bloodReceipt.show({...bloodBank.receiptSnapshot,award:bloodSpinsPlayed});
 setStatus(`Bounty closed. Blood Money total won ${money(bonusAward)}.`);
 let offered=false;
 while(token===sequenceToken&&!bloodBank.closeComplete(performance.now())){
  const at=performance.now();
  for(const cue of bloodBank.advance(at))if(cue.type==='close'&&!muted){soundInit();playSample('stamp',.88,.78);}
  if(bloodBank.closeReady(at)&&!offered){offered=true;bloodReceipt.offer();}
  bloodReceipt.update({...bloodBank.receiptSnapshot,award:bloodSpinsPlayed});
  await wait(16);
 }
 bloodReceipt.hide();
}
async function settleRound({bigWinPresented=false}={}){
 // Per-spin celebrations already ran in runTumbles. A round/feature receipt
 // must never replay them or turn several small spins into a fake big spin.
 if(totalWin>0&&!bigWinPresented)await showWin(totalWin,0,[],[],{summaryOnly:true,roundReturn:totalWin,suppressBigWin:true});
 const stake=roundLedger?.stakeCents/100||0,net=cents(totalWin-stake);
 setStatus(net===0?`Round return ${money(totalWin)} · Break even.`:`Round return ${money(totalWin)} · ${net<0?'Net loss':'Net profit'} ${money(Math.abs(net))}.`);
}
async function normalSpin(){
 if(!ready||busy||$('#game-info')?.open)return {started:false,reason:'busy'};
 const cost=spinCost(),mode=paidMode();if(balance<cost){setStatus('No demo credits remaining. Reset to play again.');return{started:false,reason:'balance'};}
 const token=sequenceToken,forced=dev.next;dev.next=null;
 const outcome=forced?.outcome??(forced?.grid?M.outcomeFromGrid(forced.grid,forced.wild?{[forced.wild.reel]:forced.wild}:{},mode,random,forced.winBoost||1,!!forced.maxEligible&&M.maxEligible(mode)):M.rollOutcome(mode));
 if(outcome.trigger?.scatters===3)void scatterDeath.preload('blood');else if(outcome.trigger?.scatters===4)void scatterDeath.preload('hang');else if(outcome.trigger?.scatters>=5)void scatterDeath.preload('hell');
 setBusy(true);beginRound(cost,mode);balance=cents(balance-cost);ink=false;setStatus('Spinning…');
 const result=await runTumbles(outcome,token);if(!result||token!==sequenceToken)return;
 const trigger=result.maxWin?null:result.trigger;
 if(trigger){
  if(trigger.scatters>=3){
   const isBlood=trigger.scatters===3,isHang=trigger.scatters===4,name=isBlood?'BLOOD MONEY':isHang?'HANG ’EM HIGH':'HELL TO PAY';
   stopAutoplay();const cells=(isBlood?confirmedBloodCells:isHang?confirmedHangCells:confirmedHellCells)(reels,trigger);
   setStatus(`${name} · ${cells.length} confirmed scatters · ${trigger.count} free spins awarded.`);
   await new Promise(requestAnimationFrame);if(token!==sequenceToken)return;
   await (isBlood?presentBlood:isHang?presentHang:presentHell)({cells,awardedSpins:trigger.count});
   if(token!==sequenceToken)return{started:true,interrupted:true};
   awardBonus(trigger.count,trigger.label,false,trigger.maxEligible,name);
   await bonusLoop(true);return{started:true,...snapState()};
  }
  stopAutoplay();const scatterCells=[];for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(reels[c][r]==='scatter')scatterCells.push([c,r]);
  await showWin(0,0,scatterCells,[{symbol:'scatter',reels:trigger.scatters,value:0,name:featureName(trigger.label),count:trigger.count,cells:scatterCells}]);
  if(token!==sequenceToken)return;
  if(shootoutRun(reels))await shootoutWait();else{standoffSounds();await sleep(STANDOFF.ms);}
  if(token!==sequenceToken)return;awardBonus(trigger.count,trigger.label,false,trigger.maxEligible);return{started:true,...snapState()};
 }
 if(!result.maxWin)await settleRound(result);if(token!==sequenceToken)return;setBusy(false);
 if(automatic>0){automatic--;if(automatic>0){await sleep(500);if(token===sequenceToken&&automatic>0)normalSpin();}else stopAutoplay();}
 return{started:true,...snapState()};
}
function stopAutoplay(){automatic=0;$('#autoplay').classList.remove('enabled');$('#autoplay').setAttribute('aria-label','Start 10 automatic demo spins');}
// ---------------------------------------------------------------------------------------------------------------
// THE STANDOFF — the second and a half between the third scatter locking and the shot that opens BLOOD MONEY.
// Scored by taking things away: the theme cuts dead, the crows stop, a desert wind and a sub drone rise, one far
// caw, two slow deliberate hammer clicks (the real cylinder recording slowed), then everything drops to dead air —
// and the shot lands in that silence (awardBonus → bloodMoneyShow). Sound only; outcomes are untouched.
const STANDOFF={ms:1660,cutMs:40,wind:{from:.05,to:1.15,gain:.10,lp:[260,1100]},drone:{to:1.2,gain:.14,hz:44},cawAt:.45,clicks:[[.78,'stop1',.72,.85],[1.16,'stop4',.78,.95]],deadAt:1.40,musicBackMs:650,musicRampMs:1100};
let musicCut=false;
function musicCutNow(){musicCut=false;}
function musicReturn(){musicCut=false;}
function standoffSounds(){
 if(muted)return;soundInit();if(!audio)return;
 musicCutNow();setAmbience(false);
 const dest=audio.createGain();dest.gain.value=1;dest.connect(bus());const t0=audio.currentTime+.005,S=STANDOFF;
 // wind: filtered noise that opens up as it rises; drone: a sub under it — both cut at the dead-air moment
 const wind=audio.createBufferSource();wind.buffer=noise();wind.loop=true;const lp=audio.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;lp.frequency.setValueAtTime(S.wind.lp[0],t0+S.wind.from);lp.frequency.exponentialRampToValueAtTime(S.wind.lp[1],t0+S.wind.to);
 const wg=audio.createGain();wg.gain.setValueAtTime(.0001,t0+S.wind.from);wg.gain.exponentialRampToValueAtTime(S.wind.gain,t0+S.wind.to);wg.gain.setValueAtTime(S.wind.gain,t0+S.deadAt);wg.gain.linearRampToValueAtTime(.0001,t0+S.deadAt+.012);
 wind.connect(lp);lp.connect(wg);wg.connect(dest);wind.start(t0+S.wind.from);wind.stop(t0+S.deadAt+.05);
 const dr=audio.createOscillator(),dr2=audio.createOscillator(),dg=audio.createGain();dr.type='sine';dr.frequency.value=S.drone.hz;dr2.type='triangle';dr2.frequency.value=S.drone.hz*2;const d2g=audio.createGain();d2g.gain.value=.3;
 dg.gain.setValueAtTime(.0001,t0+S.wind.from);dg.gain.exponentialRampToValueAtTime(S.drone.gain,t0+S.drone.to);dg.gain.setValueAtTime(S.drone.gain,t0+S.deadAt);dg.gain.linearRampToValueAtTime(.0001,t0+S.deadAt+.012);
 dr.connect(dg);dr2.connect(d2g);d2g.connect(dg);dg.connect(dest);dr.start(t0+S.wind.from);dr2.start(t0+S.wind.from);dr.stop(t0+S.deadAt+.05);dr2.stop(t0+S.deadAt+.05);
 // one far crow, off to the left
 caw({gain:.11,rate:.93,pan:-.7,far:true,delayMs:S.cawAt*1000});
 // two slow hammer clicks, dead centre, dry — the recording itself, slowed
 for(const [at,key,rate,g] of S.clicks){const r=playSample(key,g,rate,false,(t0+at-audio.currentTime)*1000,0,dest);if(!r)burst(t0+at,1600,1.2,.03,.3,dest);}
 // safety: if the sequence is interrupted before the shot, the theme still comes back
 setTimeout(()=>{if(musicCut)musicReturn(0,600);},S.ms+2500);
}
// ---------------------------------------------------------------------------------------------------------------
// THE SCREEN SHOOTOUT (v43). One confirmed scatter = one shot at the viewer.
// The existing award and reveal remain authoritative; presentation never edits the grid.
const SHOOTOUT={fadeInMs:120,fadeOutMs:460,
 sound:{wind:{from:.01,to:.23,gain:.10,lp:[260,1100]},drone:{to:.24,gain:.14,hz:44},deadAt:.33,cawAt:.025,drawAt:.035,cockAt:.285,pan:-.12,sparkGain:.11}};
const screenEffect=createScreenShootout({W,H,reduced,getAmbientTime:()=>environment.motionTime});
const shootoutAssets=screenEffect.assets;
const glassCanvas=$('#screen-glass'),glassCtx=glassCanvas.getContext('2d');
let shootout={active:false},glassPainted=false;
async function shootoutLoad(){await screenEffect.load({figure:!phoneView});if(shootoutAssets.json){cellShooter.setAssets(shootoutAssets.json,shootoutAssets.sheets,shootoutAssets.glass);duelShooter.setAssets(shootoutAssets.json,shootoutAssets.sheets,shootoutAssets.glass);}if(!phoneView)await Promise.all([duelShooter.load(),bloodTargetGun.load()]);}
function shootoutRun(target){
 const cells=[];for(let c=0;c<REEL_COUNT;c++)for(let r=0;r<ROW_COUNT;r++)if(target[c][r]==='scatter')cells.push([c,r]);
 if(cells.length<3||shootout.active||!shootoutAssets.json)return false;
 const timeline=screenEffect.start(cells),now=performance.now();
 shootout={active:true,start:now,token:sequenceToken,...timeline,handoffAt:0,pausedMs:0,pausedAt:document.hidden?now:null};
 shootoutSounds();return true;
}
function shootoutElapsed(now){return ((shootout.pausedAt??now)-shootout.start-(shootout.pausedMs||0))/1000;}
async function shootoutWait(){
 const token=shootout.token;
 try{
  while(shootout.active&&shootout.token===token&&token===sequenceToken){
   const left=shootout.handoff-shootoutElapsed(performance.now());if(left<=0)return;
   await wait(Math.min(35,left*1000));
  }
 }finally{if(token!==sequenceToken&&shootout.token===token)shootoutEnd();}
}
document.addEventListener('visibilitychange',()=>{
 if(!shootout.active)return;const now=performance.now();
 if(document.hidden&&shootout.pausedAt===null)shootout.pausedAt=now;
 else if(!document.hidden&&shootout.pausedAt!==null){shootout.pausedMs+=now-shootout.pausedAt;shootout.pausedAt=null;}
});
function shootoutHandoff(){if(shootout.active&&!shootout.handoffAt){shootout.handoffAt=performance.now();shootout.handoffElapsed=shootoutElapsed(performance.now());}}
function shootoutEnd(){if(shootout.active){const complete=shootoutElapsed(performance.now())>=shootout.handoff;shootoutSoundsStop(complete);if(!bonus&&musicCut)musicReturn(0,600);}shootout={active:false};screenEffect.end();glassCtx.clearRect(0,0,glassCanvas.width,glassCanvas.height);}
function shootoutFade(now){
 if(!shootout.active||!shootoutAssets.json)return 0;
 const t=shootoutElapsed(now),inside=Math.min(1,t*1000/SHOOTOUT.fadeInMs);
 return shootout.handoffAt?Math.min(inside,1-smoothstep((t-shootout.handoffElapsed)*1000/SHOOTOUT.fadeOutMs)):inside;
}
function shootoutCamera(now){return shootout.active?screenEffect.camera(shootoutElapsed(now)):null;}
function shootoutFrameIndex(now){return shootout.active?screenEffect.frameIndex(shootoutElapsed(now)):-1;}
function shootoutHits(now){
 if(!shootout.active)return [];const t=shootoutElapsed(now);
 return shootout.targets.flatMap((cell,i)=>t>=shootout.shots[i]+shootout.impactDelay?[{c:cell[0],r:cell[1],ms:(t-shootout.shots[i]-shootout.impactDelay)*1000,i}]:[]);
}
function drawScreenGlass(now){
 const t=shootout.active?shootoutElapsed(now):Infinity;
 if(!shootout.active||t>shootout.end){
  if(glassPainted){glassCtx.setTransform(1,0,0,1,0,0);glassCtx.clearRect(0,0,glassCanvas.width,glassCanvas.height);glassPainted=false;}
  return;
 }
 if(glassCanvas.width!==canvas.width||glassCanvas.height!==canvas.height){glassCanvas.width=canvas.width;glassCanvas.height=canvas.height;}
 glassCtx.setTransform(1,0,0,1,0,0);glassCtx.clearRect(0,0,glassCanvas.width,glassCanvas.height);
 glassCtx.setTransform(renderScale,0,0,renderScale,0,0);screenEffect.glass(glassCtx,t,canvas);glassPainted=true;
}
// Sound. One gain node per run so a mute mid-sequence can silence everything already scheduled.
const shootoutAudio={dest:null,sources:[]};
function shootoutSounds(){
 if(muted)return;soundInit();if(!audio)return;
 shootoutSoundsStop();
 musicCutNow();setAmbience(false);
 const S=SHOOTOUT.sound,dest=audio.createGain();dest.gain.value=1;dest.connect(bus());const t0=audio.currentTime+.005;shootoutAudio.dest=dest;shootoutAudio.sources=[];
 const keep=src=>{shootoutAudio.sources.push(src);return src;};
 // the standoff's wind and drone, re-timed to the draw: they rise as the hand comes up and drop dead as the hammer cocks
 const wind=keep(audio.createBufferSource());wind.buffer=noise();wind.loop=true;const lp=audio.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;lp.frequency.setValueAtTime(S.wind.lp[0],t0+S.wind.from);lp.frequency.exponentialRampToValueAtTime(S.wind.lp[1],t0+S.wind.to);
 const wg=audio.createGain();wg.gain.setValueAtTime(.0001,t0+S.wind.from);wg.gain.exponentialRampToValueAtTime(S.wind.gain,t0+S.wind.to);wg.gain.setValueAtTime(S.wind.gain,t0+S.deadAt);wg.gain.linearRampToValueAtTime(.0001,t0+S.deadAt+.012);
 wind.connect(lp);lp.connect(wg);wg.connect(dest);wind.start(t0+S.wind.from);wind.stop(t0+S.deadAt+.05);
 const dr=keep(audio.createOscillator()),dr2=keep(audio.createOscillator()),dg=audio.createGain();dr.type='sine';dr.frequency.value=S.drone.hz;dr2.type='triangle';dr2.frequency.value=S.drone.hz*2;const d2g=audio.createGain();d2g.gain.value=.3;
 dg.gain.setValueAtTime(.0001,t0+S.wind.from);dg.gain.exponentialRampToValueAtTime(S.drone.gain,t0+S.drone.to);dg.gain.setValueAtTime(S.drone.gain,t0+S.deadAt);dg.gain.linearRampToValueAtTime(.0001,t0+S.deadAt+.012);
 dr.connect(dg);dr2.connect(d2g);d2g.connect(dg);dg.connect(dest);dr.start(t0+S.wind.from);dr2.start(t0+S.wind.from);dr.stop(t0+S.deadAt+.05);dr2.stop(t0+S.deadAt+.05);
 const crow= caw({gain:.11,rate:.93,pan:-.7,far:true,delayMs:S.cawAt*1000,dest});if(crow)keep(crow);
 const at=sec=>(t0+sec-audio.currentTime)*1000;
 const panned=(key,sec,gain,pan,rate=1)=>{const r=playSample(key,gain,rate,false,at(sec),0,dest);if(r&&audio.createStereoPanner){try{r.g.disconnect();const p=audio.createStereoPanner();p.pan.value=pan;r.g.connect(p);p.connect(dest);}catch{}}if(r)keep(r.src);return r;};
 // the approved sounds, cut from the preview: the draw rustle, the two hammer cocks, and the revolver on every flash
 if(!panned('draw',S.drawAt,SAMPLE_GAIN.draw,S.pan,1.20))burst(t0+S.drawAt,900,.8,.25,.05,dest);
 if(!panned('cock',S.cockAt,SAMPLE_GAIN.cock,S.pan,1.12)){burst(t0+S.cockAt,1600,1.2,.03,.3,dest);burst(t0+S.cockAt+.07,1600,1.2,.03,.3,dest);}
 shootout.shots.forEach((sec,i)=>{
  const voice=panned('shot',sec,SAMPLE_GAIN.shot,S.pan);
  if(!voice){thump(t0+sec,90,30,.25,.6,'sawtooth',dest);burst(t0+sec,1200,.8,.12,.5,dest);}   // failure only: the sample did not load
  // Keep the crack of each approved shot intact, but make room for the next
  // one by lowering this recording's room tail on the same audio timeline.
  if(voice&&i<shootout.shots.length-1){const at=t0+shootout.shots[i+1]-.035;voice.g.gain.setValueAtTime(SAMPLE_GAIN.shot,at);voice.g.gain.linearRampToValueAtTime(.18,at+.03);}
  // close glass fracture at the impact position; no scatter damage or cell flash
  const cell=shootout.targets[i];if(cell){const p=audio.createStereoPanner?audio.createStereoPanner():null;const g=audio.createGain();g.gain.value=1;if(p){p.pan.value=(shootout.impacts[i].x/W-.5)*.8;g.connect(p);p.connect(dest);}else g.connect(dest);burst(t0+sec+shootout.impactDelay,4200,3,.02,S.sparkGain,g);burst(t0+sec+shootout.impactDelay+.006,6800,4,.035,S.sparkGain*.7,g);}
 });
 const breakAt=t0+shootout.breakAt;burst(breakAt,6400,1.1,.20,.16,dest);burst(breakAt+.09,8900,2,.27,.10,dest);
 // Music recovery belongs to handoff/teardown; no old run's timeout may
 // restore it underneath a later draw.
}
function shootoutSoundsStop(letTailsRing=false){
 const d=shootoutAudio.dest;if(!d||!audio)return;shootoutAudio.dest=null;const t=audio.currentTime;
 if(letTailsRing){shootoutAudio.sources=[];return;}   // completed shots may finish their approved tails
 d.gain.cancelScheduledValues(t);d.gain.setValueAtTime(Math.max(.0001,d.gain.value),t);d.gain.exponentialRampToValueAtTime(.0001,t+.06);
 for(const s of shootoutAudio.sources){try{s.stop(t+.08);}catch{}}shootoutAudio.sources=[];
}
// ---------------------------------------------------------------------------------------------------------------
// BLOOD MONEY — the bonus feature reveal (replaces the DEADER SPINS slab through the same flow: awardBonus() shows it,
// CONTINUE runs bonusLoop()). Illustrated layers cut from the approved comic mockup (assets/bonus/, see
// tools/make-blood-money.py) use layout.json stage coordinates. feature-reveal.js coordinates entrance poses and
// sound cues; bonus.css supplies the resting life after the entrance. Nothing here touches outcomes or credits.
const BM={dir:'assets/bonus/',entranceMs:1400,
 // flying banknotes: which cut, where it rests (stage fractions, from layout.json unless given), the burst origin
 // offset (--sx/--sy, container units) and the flight (--dur/--delay). Late notes keep settling on the held screen.
 notes:[{cut:'note1',sx:'56cqw',sy:'6cqh',bx:'-3cqw',lift:'9cqh',r0:'-140deg',delay:.40,dur:.52},
        {cut:'note3',sx:'50cqw',sy:'-36cqh',bx:'6cqw',lift:'6cqh',r0:'190deg',delay:.46,dur:.5},
        {cut:'note3',x:.76,y:.845,w:.075,flip:true,sx:'-8cqw',sy:'-28cqh',bx:'4cqw',lift:'10cqh',r0:'160deg',delay:.52,dur:.48},
        {cut:'note1',x:.585,y:.93,w:.052,rot:22,sx:'22cqw',sy:'-38cqh',bx:'-5cqw',lift:'12cqh',r0:'-260deg',delay:.6,dur:.9,late:true},
        {cut:'note3',x:.885,y:.62,w:.06,rot:-28,sx:'-14cqw',sy:'-16cqh',bx:'3cqw',lift:'8cqh',r0:'120deg',delay:.66,dur:1.0,late:true}]};
// Themed reveals share one overlay: BLOOD MONEY (DEAD, 8 spins), HANG 'EM HIGH (DEADER, 12 spins), and the
// auto-completing HELL TO PAY purchase entrance. Existing mathematical labels and awards remain unchanged.
const REVEALS={dead:{name:'BLOOD MONEY',dir:'assets/bonus/',cls:'bm-theme-dead',entranceMs:2580,notes:BM.notes},
 deader:{name:"HANG 'EM HIGH",dir:'assets/bonus-hang/',cls:'bm-theme-deader',entranceMs:2800,dust:7},
 hell:{name:'HELL TO PAY',dir:'assets/bonus-hang/',cls:'bm-theme-hell',entranceMs:2300,dust:5}};
function revealFor(label){return REVEALS[label==='DEADER'?'deader':'dead'];}
function featureName(label){return revealFor(label).name;}
const bloodMoney={layout:{},built:false,entering:false,gain:null,doneAt:0,theme:null,layers:[],startVoice:null};
const featureReveal=createFeatureReveal({reduced,onCue:featureRevealSound,onComplete:()=>bloodMoneyComplete(true),onSilence:()=>bloodMoneySoundsStop()});
document.addEventListener('visibilitychange',()=>{featureReveal.setPaused(document.hidden,performance.now());if(document.hidden)bloodMoneySoundsStop();$('#bonus-intro').classList.toggle('bm-paused',document.hidden);});
async function bloodMoneyLoad(){await Promise.all(Object.entries(REVEALS).map(([key,theme])=>revealLoad(key,theme)));bloodMoney.built=true;}
async function revealLoad(key,theme){
 const layout=await (await fetch(theme.dir+'layout.json')).json();bloodMoney.layout[key]=layout;
 const stage=$('#bonus-intro .bm-stage');let wrap=stage.querySelector('.bm-theme[data-theme="'+key+'"]');
 if(!wrap){wrap=document.createElement('div');wrap.className='bm-theme';wrap.dataset.theme=key;wrap.hidden=true;stage.appendChild(wrap);}wrap.textContent='';
 const place=(el,box)=>{el.style.left=(box.x*100)+'%';el.style.top=(box.y*100)+'%';el.style.width=(box.w*100)+'%';el.style.height=(box.h*100)+'%';};
 const imgs=[];
 for(const [name,box] of Object.entries(layout).sort((a,b)=>a[1].z-b[1].z)){
  if(name.endsWith('button')||name.startsWith('note'))continue;
  if(key==='hell'&&name==='hh-title'){
   const title=document.createElement('div');title.className='bm-layer bm-hell-title';title.dataset.layer='hell-title';title.style.zIndex=box.z;place(title,box);
   const main=layout['hh-main'];title.style.transformOrigin=`${(main.x+main.w/2-box.x)/box.w*100}% ${(main.y+main.h/2-box.y)/box.h*100}%`;
   for(const word of ['HELL','TO PAY']){const line=document.createElement('span');line.textContent=word;title.appendChild(line);}wrap.appendChild(title);continue;
  }
  const im=new Image();im.src=theme.dir+name+'.webp';im.alt='';im.draggable=false;im.className='bm-layer bm-'+name;im.dataset.layer=name;im.style.zIndex=box.z;place(im,box);
  // Title and its backing share the same stage-space pivot and animation.
  if(name==='hh-title'){const main=layout['hh-main'];im.style.transformOrigin=`${(main.x+main.w/2-box.x)/box.w*100}% ${(main.y+main.h/2-box.y)/box.h*100}%`;}
  wrap.appendChild(im);imgs.push(im);}
 (theme.notes||[]).forEach((n,i)=>{const box=layout[n.cut];const im=new Image();im.src=theme.dir+n.cut+'.webp';im.alt='';im.draggable=false;im.className='bm-layer bm-note'+(n.late?' bm-late':'');im.dataset.layer='note';im.dataset.index=i;im.style.zIndex=40+i;
  const w=n.w??box.w,h=w*(box.h/box.w);place(im,{x:n.x??box.x,y:n.y??box.y,w,h});
  for(const k of ['sx','sy','bx','lift','r0'])im.style.setProperty('--'+k,n[k]);im.style.setProperty('--dur',n.dur+'s');im.style.setProperty('--delay',n.delay+'s');
  if(n.flip||n.rot)im.style.rotate=(n.rot||0)+'deg',im.style.scale=n.flip?'-1 1':'1';   // rest pose; the flight transform composes on top
  wrap.appendChild(im);imgs.push(im);});
 for(let i=0;i<(theme.dust||0);i++){const d=document.createElement('i');d.className='bm-dust';const r=(a,b)=>a+arand()*(b-a);d.style.left=r(28,80)+'%';d.style.top=r(18,80)+'%';d.style.setProperty('--dx',r(-3,3)+'cqw');d.style.setProperty('--dy',r(-2.5,-.6)+'cqh');d.style.setProperty('--dur',r(4.5,8)+'s');d.style.setProperty('--delay',(-r(0,6))+'s');d.style.setProperty('--sz',r(1.5,3)+'px');wrap.appendChild(d);}
 await Promise.all(imgs.map(im=>im.decode().catch(()=>{})));
}
function featureRevealSound(cue){
 if(muted||reduced)return;soundInit();if(!audio)return;
 if(cue.type==='feature-start'){
  // Supplied recordings in feature order, sharing the existing voice lifetime.
  // Skip, mute, hiding and feature exit still fade and stop the active voice.
  const key={dead:'featureStart',deader:'featureStartHang',hell:'featureStartHell'}[cue.theme];
  if(!key||bloodMoney.startVoice)return;
  const voice=playSample(key,.92,1);if(!voice)return;
  bloodMoney.startVoice=voice;
  voice.src.onended=()=>{voice.g.disconnect();if(bloodMoney.startVoice===voice)bloodMoney.startVoice=null;};
  return;
 }
 if(!bloodMoney.gain){bloodMoney.gain=audio.createGain();bloodMoney.gain.gain.value=bloodMoney.startVoice?.60:1;bloodMoney.gain.connect(bus());}
 const t=audio.currentTime,dest=bloodMoney.gain;
 const sample=(key,gain,rate=1)=>playSample(key,gain,rate,false,0,0,dest);
 if(cue.type==='prelude'){sample('rip',.36,.95);return;}
 if(cue.type==='main'){sample('impactw',cue.theme==='deader'?.80:.72,.94);thump(t,74,27,.24,.11,'triangle',dest);}
 else if(cue.type==='eyes'){sample('click',.50,1.10);burst(t,2100,1.4,.045,.07,dest);}
 else if(cue.type==='side'){sample('stop5',.72,.9);thump(t,90,35,.15,.08,'triangle',dest);}
 else if(cue.type==='paper'){sample('rip',.23,1.5);}
 else if(cue.type==='title'){sample('stamp',.8,.96);sample('stop5',.48,1);thump(t,78,29,.23,.13,'triangle',dest);}
 else if(cue.type==='award'){sample('click',.48,1.12);musicReturn(0,900);}
 else if(cue.type==='max'){sample('impactw',.60,.92);thump(t,63,25,.23,.10,'triangle',dest);}
 else if(cue.type==='button'){sample('stop2',.36,1.1);}
}
function bloodMoneySoundsStop(preserveStart=false){
 if(!preserveStart&&bloodMoney.startVoice){const v=bloodMoney.startVoice;bloodMoney.startVoice=null;
  try{const t=audio.currentTime;v.g.gain.cancelScheduledValues(t);v.g.gain.setValueAtTime(v.g.gain.value,t);v.g.gain.linearRampToValueAtTime(0,t+.035);v.src.stop(t+.04);}catch{try{v.g.disconnect();}catch{}}
 }
 const gain=bloodMoney.gain;if(gain){try{gain.disconnect();}catch{}}bloodMoney.gain=null;
}
function bloodMoneyShow(count,label='DEAD'){
 const box=$('#bonus-intro');bloodMoneyClear(false);
 const key=label==='HELL'?'hell':label==='DEADER'?'deader':'dead',theme=REVEALS[key],layout=bloodMoney.layout[key];bloodMoney.theme=key;
 for(const w of box.querySelectorAll('.bm-theme'))w.hidden=w.dataset.theme!==key;
 for(const t of Object.values(REVEALS))box.classList.remove(t.cls);box.classList.add(theme.cls,'bm-directed');
 const btn=$('#continue-bonus'),bb=layout[key==='dead'?'button':'hh-button'];
 for(const [prop,n] of [['left',bb.x],['top',bb.y],['width',bb.w],['height',bb.h]])btn.style[prop]=(n*100)+'%';btn.style.zIndex=bb.z;
 btn.setAttribute('aria-label',`Continue to the ${theme.name} free spins`);
 const award=$('#feature-award'),caption=layout[key==='dead'?'caption':'hh-caption'];
 for(const [prop,n] of [['left',caption.x-.035],['top',caption.y],['width',caption.w+.07],['height',caption.h]])award.style[prop]=(n*100)+'%';
 const maxActive=key!=='hell'&&bonusMaxEligible;
 award.textContent=key==='hell'?`${count} OUTLAW WILDS`:`${count} FREE SPINS`+(maxActive?' · MAX ACTIVE':'');award.classList.toggle('max-active',maxActive);
 $('#bonus-word').textContent=key==='hell'?`${theme.name} · ${count} Outlaw Wilds`:`${theme.name} · bonus feature triggered · ${count} free spins`+(maxActive?' · MAX active':'');
 bloodMoney.layers=[...box.querySelectorAll(`.bm-theme[data-theme="${key}"] .bm-layer`)];
 for(const layer of bloodMoney.layers)if(['hh-title','hell-title'].includes(layer.dataset.layer)){layer.dataset.heldOrigin=layer.style.transformOrigin;layer.style.transformOrigin='50% 50%';}
 box.classList.remove('bm-held');box.hidden=false;box.classList.add('bm-enter');bloodMoney.entering=true;
 featureReveal.begin(key,performance.now(),maxActive);featureReveal.setPaused(document.hidden,performance.now());featureRevealStep(performance.now());
}
function featureRevealStep(now){
 if(!bloodMoney.entering)return;
 const apply=(el,p)=>{if(!el||!p)return;el.style.opacity=String(p.alpha);el.style.transform=`translate(${p.x}cqw,${p.y}cqh) rotate(${p.angle}deg) scale(${p.scale})`;};
 apply($('#bonus-intro .bm-dim'),featureReveal.pose('dim',now));
 for(const layer of bloodMoney.layers)apply(layer,featureReveal.pose(layer.dataset.layer,now,Number(layer.dataset.index||0)));
 apply($('#continue-bonus'),featureReveal.pose('button',now));
 apply($('#feature-award'),featureReveal.pose(bloodMoney.theme==='dead'?'caption':'hh-caption',now));
 featureReveal.advance(now);
}
function bloodMoneyComplete(fromClock=false){
 const box=$('#bonus-intro');if(box.hidden||!bloodMoney.entering)return;
 if(!fromClock&&featureReveal.active){featureReveal.finish();return;}
 bloodMoney.entering=false;bloodMoney.doneAt=performance.now();bloodMoneySoundsStop(fromClock);
 clearFeatureStyles();
 box.classList.remove('bm-enter');box.classList.add('bm-held');if(bloodMoney.theme!=='hell')$('#continue-bonus').focus({preventScroll:true});
 if(musicCut)musicReturn(0,850);if(!muted&&!ambience.on)setAmbience(true);
}
function clearFeatureStyles(){
 for(const layer of [...bloodMoney.layers,$('#continue-bonus'),$('#feature-award'),$('#bonus-intro .bm-dim')]){
  layer.style.opacity='';layer.style.transform='';if(layer.dataset.heldOrigin){layer.style.transformOrigin=layer.dataset.heldOrigin;delete layer.dataset.heldOrigin;}
 }
}
function bloodMoneyClear(restoreMusic=true){
 if(restoreMusic)shootoutEnd();if(restoreMusic&&musicCut)musicReturn(0,600);
 featureReveal.clear();bloodMoney.entering=false;clearFeatureStyles();bloodMoney.layers=[];
 const box=$('#bonus-intro');box.classList.remove('bm-enter','bm-held','bm-paused');
}
function continueBonus(){   // one activation completes an unfinished entrance; a separate activation continues into the spins
 if($('#bonus-intro').hidden)return;
 if(bloodMoney.entering){bloodMoneyComplete();return;}
 if(bloodMoney.theme==='hell')return;
 if(performance.now()-bloodMoney.doneAt<150)return;   // the tap that completed the entrance never continues as well
 bloodMoneySoundsStop();bonusLoop();
}
function awardBonus(count,label,scripted,maxEligible=false,presented=false){bonusDisplayName=typeof presented==='string'?presented:presented?'HELL TO PAY':featureName(label);tricksterGrid.reset();shootoutHandoff();bonusMaxEligible=maxEligible;bonus=true;ink=true;freeSpins=count;bonusLabel=label;bonusScripted=scripted;$('#remaining').textContent=count;$('#remaining').hidden=false;if(!presented)bloodMoneyShow(count,label);setStatus(`${bonusDisplayName} · ${count} free spins awarded.${maxEligible?' MAX ACTIVE.':''} Select Continue.`);}
async function holdConfirmedFeature(token){
 // The confirmed board remains visible, locked, and audible before any intro.
 // Turbo does not remove this reading beat; hidden-tab time does not consume it.
 let remaining=900,previous=performance.now();
 while(remaining>0&&token===sequenceToken){await wait(16);const now=performance.now();if(!document.hidden)remaining-=Math.min(100,now-previous);previous=now;}
 return token===sequenceToken;
}
async function presentBlood(options){
 void bloodIntro.preload();if(!phoneView)void bloodDuel.load().then(()=>{if(!phoneView&&!bloodDuel.active)bloodDuel.start(0,0);});
 const token=sequenceToken;if(!await holdConfirmedFeature(token))return false;
 // The three confirmed scatters are executed in place before the film. Skippable; cancellation keeps the confirmed feature.
 await scatterDeath.play(options.cells,{key:'blood',token,isCancelled:()=>token!==sequenceToken});if(token!==sequenceToken){scatterDeath.clear();return false;}
 bloodEntryPending=true;bloodBank.beginBriefing({awardedSpins:options.awardedSpins,boost:1});
 try{
  try{await bloodIntro.play(options);}
  catch(error){console.error('Blood Money presentation interrupted; confirmed feature retained.',error);bloodIntro.cancel();}
  if(token!==sequenceToken)return false;
  return await bloodBriefing.show({awardedSpins:options.awardedSpins,boost:1});
 }finally{
  bloodBriefing.cancel();bloodBank.endBriefing();bloodEntryPending=false;hellMix(false);scatterDeath.clear();
  void music.select(token===sequenceToken?'blood':'main');if(musicWanted&&!muted)void musicStart();
 }
}
async function presentHang(options){
 void hangIntro.preload();
 const token=sequenceToken;if(!await holdConfirmedFeature(token))return false;
 // The four confirmed scatters are hanged in place before the film. Skippable; cancellation keeps the confirmed feature.
 await scatterDeath.play(options.cells,{key:'hang',token,isCancelled:()=>token!==sequenceToken});if(token!==sequenceToken){scatterDeath.clear();return false;}
 // Presentation failure must never remove the confirmed feature award.
 try{return await hangIntro.play(options);}
 catch(error){console.error('Hang Em High presentation interrupted; confirmed feature retained.',error);hangIntro.cancel();return false;}
 finally{scatterDeath.clear();}
}
async function presentHell(options){
 void hellIntro.preload();
 const token=sequenceToken;if(!await holdConfirmedFeature(token))return false;
 // The confirmed scatters burn to the skull in place before the film. Skippable; cancellation keeps the confirmed feature.
 await scatterDeath.play(options.cells,{key:'hell',token,isCancelled:()=>token!==sequenceToken});if(token!==sequenceToken){scatterDeath.clear();return false;}
 // The presentation cannot revoke a confirmed purchase or free-spin award.
 try{return await hellIntro.play(options);}
 catch(error){console.error('Hell to Pay presentation interrupted; confirmed feature retained.',error);hellIntro.cancel();return false;}
 finally{scatterDeath.clear();}
}
async function hellToPayIntro(outcome,token){
 void hellIntro.preload();void scatterDeath.preload('hell');
 const entry=hellPurchaseEntry(outcome);
 setStatus('HELL TO PAY · five-scatter feature entry.');
 await spinReels(entry.grid,[],1250,{featureEntry:true});if(token!==sequenceToken)return false;
 await new Promise(requestAnimationFrame);if(token!==sequenceToken)return false;
 await presentHell({cells:entry.cells});return token===sequenceToken;
}
async function nudgeSequence(purchaseCost=0){
 if(!ready||busy)return{started:false,reason:'busy'};const token=sequenceToken;
 roundMeta={mode:'outlaws',winBoost:1,maxEligible:false};
 setBusy(true);stopAutoplay();beginRound(purchaseCost);bonus=false;ink=false;wilds={};multiplier=0;$('#remaining').hidden=true;$('#nudge-demo').classList.add('running');setStatus('Hell to Pay · three Outlaw Wilds.');
 try{
  const outcome=M.rollOutcome('outlaws');
  if(!await hellToPayIntro(outcome,token)||token!==sequenceToken)return;
  const result=await runTumbles(outcome,token);if(result&&!result.maxWin&&token===sequenceToken)await settleRound(result);
 }
 finally{featureScenes.leave();$('#nudge-demo').classList.remove('running');setBusy(false);}return{started:true,...snapState()};
}
async function startBonus(count=12,label='DEADER',purchaseCost=0,demonstrate=false){
 if(demonstrate&&purchaseCost)throw new Error('Walkthroughs cannot use a purchase stake');
 if(!ready||busy)return{started:false,reason:'busy'};setBusy(true);stopAutoplay();beginRound(purchaseCost);wilds={};multiplier=0;roundMeta={mode:M.freeMode(label,false),winBoost:1,maxEligible:false};setStatus(featureName(label)+' · scatter trigger.');
 void (label==='DEAD'?bloodIntro:hangIntro).preload();if(label==='DEAD'&&!phoneView)void bloodDuel.load();if(label==='DEAD')void scatterDeath.preload('blood');else if(label==='DEADER')void scatterDeath.preload('hang');
 const target=featurePurchaseEntry(label==='DEADER'?4:3).grid;
 const token=sequenceToken;await spinReels(target,[],1000,{featureEntry:true});if(token!==sequenceToken)return{started:false,reason:'interrupted'};
 if(label==='DEADER'||label==='DEAD'){
  const isBlood=label==='DEAD';
  const cells=(isBlood?confirmedBloodCells:confirmedHangCells)(target,{count,scatters:isBlood?3:4});
  await new Promise(requestAnimationFrame);if(token!==sequenceToken)return{started:false,reason:'interrupted'};
  await (isBlood?presentBlood:presentHang)({cells,awardedSpins:count});if(token!==sequenceToken)return{started:true,interrupted:true};
  awardBonus(count,label,demonstrate,false,isBlood?'BLOOD MONEY':'HANG ’EM HIGH');
  await bonusLoop(true);return{started:true,...snapState()};
 }
 const shot=shootoutRun(target);if(!shot)standoffSounds();await (shot?shootoutWait():sleep(STANDOFF.ms));if(token!==sequenceToken)return{started:false,reason:'interrupted'};
 awardBonus(count,label,false,false);return{started:true,...snapState()};
}
async function bonusLoop(presented=false){
 if($('#bonus-intro').hidden&&!presented)return;bloodMoneyClear();$('#bonus-intro').hidden=true;if(!roundLedger)beginRound(0);
 const token=sequenceToken,label=bonusDisplayName||featureName(bonusLabel);$('#deader-demo').classList.add('running');bonusAward=0;
 const blood=bonusLabel==='DEAD'&&!bonusMaxEligible,hang=bonusLabel==='DEADER'&&!bonusMaxEligible;
 let hangRun=null,hangSpin=0;
 if(blood||hang)void music.select(hang?'hang':'blood');
 try{
 if(blood){bloodBounty=freshBounty();bloodRewards=createBloodRewards();bloodSpinsPlayed=0;bloodPromotion.start();bloodModel();bloodBank.start(performance.now(),{awardedSpins:freeSpins,boost:1,docked:true});if(!phoneView)void bloodDuel.load().then(()=>{if(bloodBank.active&&!bloodDuel.active){const s=bloodBank.state;bloodDuel.start(s.level,s.stamps);}});roundMeta={mode:'free',winBoost:1,maxEligible:false};$('#slot-shell').classList.add('blood-money-active');while(token===sequenceToken&&!bloodBank.dockingComplete(performance.now()))await wait(16);}
 if(hang){hangRun=bonusScripted?hangDemoFeature():rollHangFeature();hangPresentation.start(performance.now());roundMeta={mode:'deaderfree',winBoost:1,maxEligible:false};while(token===sequenceToken&&hangPresentation.elapsed(performance.now())<hangPresentation.duration())await wait(16);}
 let capped=false;
 while(freeSpins>0&&token===sequenceToken){
  freeSpins--;if(blood)bloodSpinsPlayed++;$('#remaining').textContent=freeSpins;setStatus(`${label} · ${freeSpins} remaining`);
  const raw=blood?(bonusScripted?bloodDemoOutcome(bloodBounty,bloodSpinsPlayed):rollBloodOutcome(bloodBounty)):hang?hangRun.spins[hangSpin++]:M.rollOutcome(M.freeMode(bonusLabel,bonusMaxEligible));
  const outcome=hang?M.withShotWilds(raw,random):raw;
  const result=await runTumbles(outcome,token);if(!result||token!==sequenceToken)return;
  if(blood)bloodBounty={...result.steps.at(-1).blood.state};
  if(result.maxWin||!roundLedger.remainingCents){capped=true;freeSpins=0;break;}if(!blood)await sleep(180);
 }
 if(token!==sequenceToken)return;
 if(blood)await closeBloodBounty(token);else if(hang){await hangPresentation.close(bonusAward,performance.now(),hangSpin);}else if(!capped)await settleRound();if(token!==sequenceToken)return;
 if(hang){hangPresentation.stop();wilds={};multiplier=0;}
 bloodBank.stop();bloodDuel.stop();bloodPromotion.stop();$('#slot-shell').classList.remove('blood-money-active');$('#blood-bounty-status').textContent='';
 bonus=false;bonusDisplayName='';bonusMaxEligible=false;roundMeta={winBoost:1,maxEligible:false};freeSpins=0;$('#remaining').hidden=true;$('#deader-demo').classList.remove('running');setBusy(false);if(blood)$('#spin').focus({preventScroll:true});
 }finally{bloodPromotion.stop();featureScenes.leave();if(blood||hang)void music.select('main');}
}
function reset(){if(busy){setStatus('Finish the current sequence before resetting.');return;}bloodBriefing.cancel();featureScenes.clear();void music.select('main');bloodBank.stop();bloodDuel.stop();bloodPromotion.stop();bloodBounty=freshBounty();$('#slot-shell').classList.remove('blood-money-active');tricksterGrid.reset();anticipation.clear();scatterSlam.clear();scatterDeath.clear();impactMotion.clear();actionFeedback.clear();tumble.clear();bombFX.clear();wildShots.clear();wildShotSoundsStop();roundLedger=null;roundMode='normal';sequenceToken++;shootoutEnd();maxEnd();roundMeta={winBoost:1,maxEligible:false};bonusMaxEligible=false;payout.clear();winning=[];automatic=0;balance=10000;totalWin=0;multiplier=0;wilds={};ink=false;bonus=false;boost=false;enhancer=null;reels=idleGrid();winPopup=null;$('#remaining').hidden=true;$('#autoplay').classList.remove('enabled');setBusy(false);setStatus('Demo reset. Ready to spin.');}
function changeBet(d){if(busy)return;bet=bets[Math.max(0,Math.min(bets.length-1,bets.indexOf(bet)+d))];$('#bet-label').textContent='$'+bet.toFixed(2);}
// Extra presses control presentation only. They never enqueue another wager.
function activateSpin({repeat=false}={}){
 if(!ready||document.hidden||$('#features').open||$('#game-info').open||$('#crow-shop').open||!$('#reference-wrap').hidden)return;
 if(!busy){if(!repeat){stopAutoplay();return normalSpin();}return;}
 if(bloodBriefing.active||bloodIntro.active||hangIntro.active||hellIntro.active||hangPresentation.closing||!$('#bonus-intro').hidden||!bountyDialog.hidden)return;
 if(scatterDeath.active){scatterDeath.skip();return;}
 const now=performance.now(),session=spinReels.run;
 if(session){session.motion.quickStop(session.pausedAt??now);anticipation.clear();return;}
 if(bombFX.active)bombFX.quickStop(now);
 if(tumble.active){tumble.quickStop(now);anticipation.clear();return;}
 if(payout.active){payout.quickStop();return;}
 if(approvedWin.active)approvedWin.skip();
}
$('#spin').addEventListener('click',()=>activateSpin());$('#normal').addEventListener('click',()=>{$('#features').close();normalSpin();});$('#nudge-demo').addEventListener('click',()=>{$('#features').close();nudgeSequence();});$('#deader-demo').addEventListener('click',()=>{$('#features').close();startBonus();});$('#continue-bonus').addEventListener('click',continueBonus);$('#bonus-intro').addEventListener('pointerdown',e=>{if(e.target!==$('#continue-bonus')&&bloodMoney.entering){e.preventDefault();bloodMoneyComplete();}});$('#close-features').addEventListener('click',()=>$('#features').close());$('#features').addEventListener('click',e=>{if(e.target===$('#features'))$('#features').close();});
// The crow's offers (dist/shop.js). ACTIVATE: the Bounty Booster is the configured booster (SPIN_COST.boost);
// Trickster and All In resolve calibrated outcomes in math.js. BUY: confirmed in the sheet, checked
// against the balance, charged in demo credits, then the existing feature runs. All paid rounds and buys use the shared calibrated tumble model.
const money=v=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const PURCHASES={dead:{name:'Blood Money',run:cost=>startBonus(8,'DEAD',cost)},deader:{name:'Hang \u2019Em High',run:cost=>startBonus(12,'DEADER',cost)},outlaws:{name:'Hell to Pay',run:cost=>nudgeSequence(cost)}};
const shop=createShop({dialog:$('#crow-shop'),money,getBet:()=>bet,changeBet,getBalance:()=>balance,getActive:()=>boost?'booster':enhancer,isBusy:()=>busy,setStatus,
 onActivate:(id,on)=>{tricksterGrid.reset();boost=false;enhancer=null;if(on&&id==='booster')boost=true;else if(on&&['outlaw','allin'].includes(id))enhancer=id;setStatus(on?`${id==='outlaw'?'Trickster Spins':id==='allin'?'All In Spins':'Bounty Booster'} active · ${M.SPIN_COST[paidMode()]}× base bet per spin.`:'Base spins active.');updateHUD();},
 onPurchase:(id,cost)=>{const p=PURCHASES[id];if(!p||!ready||busy||balance<cost||cost!==cents(bet*M.BUY_COST[id]))return false;balance=cents(balance-cost);setStatus(`${p.name} bought for ${money(cost)}.`);p.run(cost);return true;}});
shop.render();
const gameInfo=createGameInfo({dialog:$('#game-info'),content:$('#info-content'),closeButton:$('#close-info'),menuDialog:$('#features'),menuButton:$('#menu'),infoButton:$('#open-info'),stage:$('#stage'),getBet:()=>bet,beforeOpen:stopAutoplay});
$('#crow').addEventListener('click',()=>{if(busy){setStatus("Finish the current spin before opening the crow's offers.");return;}$('#features').close();shop.open();});
function soundToggle(on=muted){muted=!on;hellIntro.syncMute();hangIntro.syncMute();bloodIntro.syncMute();approvedWin.syncMute();crossfire.syncMute();bombFX.syncMute();soundInit();syncMasterMute();if(muted&&audio){scatterSoundsStop();anticipationSoundStop();reelSpinStop(.05);shootoutSoundsStop();wildShotSoundsStop();payoutSoundsStop();bloodMoneySoundsStop();}$('#sound').setAttribute('aria-pressed',String(!muted));$('#sound').setAttribute('aria-label',muted?'Enable sound and theme':'Mute sound and theme');if(!hellIntro.active&&!hangIntro.active&&!bloodIntro.active)sfx('land');setMusic(!muted&&$('#reference-wrap').hidden);}
$('#sound').addEventListener('click',()=>soundToggle());
$('#turbo').addEventListener('click',()=>{turbo=!turbo;$('#turbo').setAttribute('aria-pressed',String(turbo));$('#turbo').setAttribute('aria-label',turbo?'Disable turbo speed':'Enable turbo speed');setStatus(turbo?'Turbo speed enabled.':'Normal speed enabled.');});
$('#autoplay').addEventListener('click',()=>{if(automatic){automatic=0;$('#autoplay').classList.remove('enabled');$('#autoplay').setAttribute('aria-label','Start 10 automatic demo spins');setStatus('Autoplay stopped.');}else if(!busy){automatic=10;$('#autoplay').classList.add('enabled');$('#autoplay').setAttribute('aria-label','Stop automatic spins');normalSpin();}});
$('#bet-down').addEventListener('click',()=>{changeBet(-1);shop.refresh();});$('#bet-up').addEventListener('click',()=>{changeBet(1);shop.refresh();});$('#reset').addEventListener('click',reset);
$('#reference-button').addEventListener('click',()=>{if(busy){setStatus('Finish the current sequence before opening the recording.');return;}$('#features').close();$('#reference-wrap').hidden=false;setMusic(false);$('#reference').play().catch(()=>{});});$('#close-reference').addEventListener('click',()=>{$('#reference').pause();$('#reference-wrap').hidden=true;if(!muted)setMusic(true);});
const mobileView=createMobileView({main:$('#slot-shell'),layoutElement:$('#slot-layout'),buttons:[$('#fullscreen'),$('#screen-toggle'),$('#rail-screen-toggle')],onResize:resizeCanvas,onStatus:setStatus});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!$('#intro')&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement?.tagName)&&!$('#features').open&&!$('#game-info').open&&!$('#crow-shop').open&&$('#reference-wrap').hidden){e.preventDefault();if(!$('#bonus-intro').hidden)continueBonus();else activateSpin({repeat:e.repeat});}});
async function loadHDArt(){
 const acquire=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
 [symbolAtlas,stageHD,hangingWildArt,boxedWildArt]=await Promise.all([acquire('assets/ink-refined/symbols.webp?v=pigment2'),acquire('assets/ash-bone/stage.png'),loadOutlawAssets('assets/outlaw-hanging/'),acquire('assets/ink-western/boxed-wild.webp')]);
 prepareSymbolSprites();
}
async function loadBrandArt(){
 const acquire=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
 if(!brandPanel)brandPanel=await acquire('assets/faithful-character/foreground.webp');
 if(phoneView)return;
 await character.load(brandPanel);
}
async function loadTokenArt(){
 const acquire=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
 await Promise.all(Object.entries(TOKENS).map(async([name,path])=>{tokenArt[name]=await acquire(path);}));
}
// Pre-render each token as a cell-sized tile, like the atlas symbols, so drawSprite() treats it identically.
// Approved artwork is used as-is: its own paper fills the cell, the complete coin sits centred with a margin,
// and the atlas's rough black cell border is laid over the edge so the grid stays continuous.
function prepareTokenTiles(){
 if(!symbolAtlas)return;
 const aw=symbolAtlas.width/6,ah=symbolAtlas.height/2;
 // Border ring lifted from an atlas cell by darkness, exactly the treatment the other tiles carry.
 const ring=document.createElement('canvas');ring.width=Math.round(aw);ring.height=Math.round(ah);
 const rc=ring.getContext('2d',{willReadFrequently:true});rc.drawImage(symbolAtlas,4*aw,0,aw,ah,0,0,ring.width,ring.height);
 const px=rc.getImageData(0,0,ring.width,ring.height),d=px.data,edge=9;
 for(let y=0;y<ring.height;y++)for(let x=0;x<ring.width;x++){
  const k=(y*ring.width+x)*4,onRing=x<edge||y<edge||x>=ring.width-edge||y>=ring.height-edge;
  const lum=(d[k]+d[k+1]+d[k+2])/3,alpha=onRing?Math.max(0,Math.min(1,(95-lum)/70)):0;
  d[k]=6;d[k+1]=4;d[k+2]=4;d[k+3]=Math.round(alpha*255);
 }
 rc.putImageData(px,0,0);
 for(const [name,img] of Object.entries(tokenArt)){
  const tile=document.createElement('canvas');tile.width=Math.round(G.cw*3);tile.height=Math.round(G.ch*3);const tc=tile.getContext('2d');tc.scale(3,3);
  tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality='high';
  if(name==='scatter'){
   tc.fillStyle='#180c0b';tc.fillRect(0,0,G.cw,G.ch);
   tc.drawImage(img,1,1,G.cw-2,G.ch-2);tc.drawImage(ring,0,0,G.cw,G.ch);
   symbolTiles[name]=tile;continue;
  }
  // 1. Paper: the token's own clean corner patches, one per quadrant.
  const patch=Math.round(img.width*0.135),hw=G.cw/2,hh=G.ch/2;
  tc.drawImage(img,0,0,patch,patch,0,0,hw,hh);
  tc.drawImage(img,img.width-patch,0,patch,patch,hw,0,hw,hh);
  tc.drawImage(img,0,img.height-patch,patch,patch,0,hh,hw,hh);
  tc.drawImage(img,img.width-patch,img.height-patch,patch,patch,hw,hh,hw,hh);
  // Tone-match the paper layer only to the atlas paper average (203,181,147 vs the token's 213,184,150); the coin is untouched.
  tc.save();tc.globalCompositeOperation='multiply';tc.fillStyle='rgb(243,250,250)';tc.fillRect(0,0,G.cw,G.ch);tc.restore();
  // 2. Size the visible gold rim, excluding the approved 1254px image's paper/shadow padding.
  // Measured rim: ~1144px diameter, centred at (621,596). 88% cell height is ~12.2% larger.
  // Bake sizing into this shared tile once; all existing spin/cascade/feature transforms stay intact.
  const rim={cx:621/1254,cy:596/1254,diameter:1144/1254};
  const size=Math.min(G.ch,G.cw)*0.88/rim.diameter,x=G.cw/2-size*rim.cx,y=G.ch/2-size*rim.cy;
  const coin=document.createElement('canvas');coin.width=Math.round(size*3);coin.height=Math.round(size*3);
  const cc=coin.getContext('2d');cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';
  cc.drawImage(img,0,0,coin.width,coin.height);
  // Feathered circular mask just outside the rim so the token's paper blends into the tile's paper.
  const cx=coin.width*rim.cx,cy=coin.height*rim.cy,r=coin.width*(rim.diameter/2+0.026);
  const g=cc.createRadialGradient(cx,cy,r-6,cx,cy,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');
  cc.globalCompositeOperation='destination-in';cc.fillStyle=g;cc.fillRect(0,0,coin.width,coin.height);
  tc.drawImage(coin,x,y,size,size);
  // 3. Grid border.
  tc.drawImage(ring,0,0,G.cw,G.ch);
  symbolTiles[name]=tile;
 }
}
// ---- GODLESS intro ------------------------------------------------------------------------------------
// Carter's "Blood Eclipse" brand film (assets/intro/intro.mp4 / .webm, 7.2 s, with its own sound) starts by itself
// the moment the page opens, over the game while it loads, with a touch-accessible skip control. It plays with sound wherever the
// browser allows sound to autoplay; where the browser refuses (no prior interaction with the site), it plays
// silently and the first tap or key anywhere turns the sound on invisibly. Escape skips. ?intro=0 disables it; the
// development harnesses (?debug=1) skip it unless ?intro=1 is passed.
const INTRO={waitMs:2500};
function introWanted(){const q=new URLSearchParams(location.search);if(q.get('intro')==='0')return false;if(q.get('intro')==='1')return true;return !q.has('debug');}
async function introRun(){
 const box=$('#intro'),v=$('#intro-video');
 if(!box)return;
 if(!introWanted()||!v.canPlayType||!(v.canPlayType('video/mp4')||v.canPlayType('video/webm'))){box.remove();return;}
 box.hidden=false;
 const ok=await new Promise(res=>{if(v.readyState>=3)return res(true);const t=setTimeout(()=>res(v.readyState>=1),INTRO.waitMs);v.addEventListener('canplay',()=>{clearTimeout(t);res(true);},{once:true});v.addEventListener('error',()=>{clearTimeout(t);res(false);},{once:true});});
 if(!ok){box.remove();return;}
 let unmuted=false,done=false,removeIntroEvents=()=>{};
 const gestures=['pointerdown','keydown','touchstart'];let onGesture=null;
 await new Promise(res=>{
  const finish=()=>{if(done)return;done=true;res();};
  const withSound=()=>{if(unmuted||done)return;unmuted=true;v.muted=false;};
  box.classList.add('playing');v.muted=false;
  v.play().then(()=>{unmuted=true;}).catch(()=>{v.muted=true;v.play().catch(finish);   // sound refused until the visitor interacts: play silently, the first touch anywhere turns it on
   onGesture=()=>withSound();for(const g of gestures)document.addEventListener(g,onGesture,{passive:true});});
  v.addEventListener('ended',finish);v.addEventListener('error',finish);
  const onKey=e=>{if(!box.isConnected){document.removeEventListener('keydown',onKey);return;}if(e.code==='Escape'){e.preventDefault();finish();}};
  document.addEventListener('keydown',onKey);
  const skip=$('#intro-skip');skip?.addEventListener('click',finish);
  removeIntroEvents=()=>{document.removeEventListener('keydown',onKey);skip?.removeEventListener('click',finish);v.removeEventListener('ended',finish);v.removeEventListener('error',finish);};
 });
 removeIntroEvents();
 if(onGesture)for(const g of gestures)document.removeEventListener(g,onGesture);
 try{v.pause();}catch{}
 if(!ready){box.classList.add('holding');await new Promise(r=>{const t=setInterval(()=>{if(ready){clearInterval(t);r();}},50);});}   // the film ended before the reels were ready: hold on its last frame
 box.classList.add('leaving');
 if(unmuted&&muted)soundToggle(true);   // the visitor already has sound: the reels come up with the game's sound on (the player can mute)
 setTimeout(()=>{v.pause();v.removeAttribute('src');for(const source of v.querySelectorAll('source'))source.removeAttribute('src');v.load();box.remove();if(ready)$('#spin').focus({preventScroll:true});},420);
}
async function load(){introRun();try{await Promise.all(names.map(async name=>{const im=new Image();im.src=`assets/${name}.webp`;await im.decode();art[name]=im;}));await Promise.all([document.fonts.load('bold 40px Western'),document.fonts.load('40px Outlaw'),document.fonts.load('bold 13px Offers')]);await Promise.all([outlawArt.load(),bloodBank.load(),hellIntro.load(),hangIntro.load(),bloodIntro.load(),crossfire.load(),payout.load(),gunSoundLoad(),loadHDArt(),baseSoundLoad(),loadBrandArt(),loadTokenArt(),reelFrame.load().catch(()=>{}),anticipation.load().catch(()=>{}),environment.load(),modeBackground.load(),bloodMoneyLoad(),featureSoundLoad(),shootoutLoad(),wildShots.load(),bombFX.load()]);try{if(stageHD)symbolReactions.prepare(symbolAtlas,symbols);}catch(e){console.warn('Reaction layers unavailable; original symbols preserved.',e);}try{const liquid=new Image();liquid.src='assets/reactions/liquid-engraving.png';await liquid.decode();symbolReactions.setLiquid(liquid);}catch(e){console.warn('Liquid engraving unavailable; original bottle preserved.',e);}
 symbolTiles[M.BOMB]=bombFX.tile;prepareTokenTiles();prepareMotionTiles();bloodModel();resizeCanvas();reels=idleGrid();ready=true;$('#loading').remove();setBusy(false);raf=requestAnimationFrame(render);registerTools();shootoutLoad();void featureBorders.load().catch(e=>console.warn('Feature borders unavailable; original frame kept.',e));void Promise.all([1,2,3].map(async n=>{const i=new Image();i.src=`assets/trickster/plate-${n}.webp`;try{await i.decode();return i;}catch{return null;}})).then(p=>tricksterGrid.setPlates(p));}catch(e){$('#loading').textContent='The artwork could not load. Refresh to retry.';console.error(e);}}
function registerTools(){const mc=document.modelContext;if(!mc?.registerTool)return;const controller=new AbortController();const reg=t=>{try{Promise.resolve(mc.registerTool(t,{signal:controller.signal})).catch(()=>{});}catch{}};reg({name:'read_slot_demo',description:'Read the current visible state of this visual recreation; all balances are demo credits.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>snapState()});reg({name:'play_slot_demo',description:'Play a demo spin or start a visual feature sequence. Uses demo credits only.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['spin','nudge','deader']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!input||!['spin','nudge','deader'].includes(input.mode)||Object.keys(input).some(k=>k!=='mode'))throw new Error('Choose spin, nudge or deader.');return input.mode==='nudge'?nudgeSequence():input.mode==='deader'?startBonus():normalSpin();}});window.addEventListener('pagehide',()=>controller.abort(),{once:true});}
load();
if(new URLSearchParams(location.search).has('winqa')&&new URLSearchParams(location.search).has('debug'))import('./win-qa.js?v=3').then(({installWinQA})=>installWinQA({getGame:()=>window.__sickTwisted,getAudio:()=>{soundInit();return {context:audio,master:bus()};},getMix:()=>({duck:music.duck?.gain.value??1,active:approvedMixActive,crossfire:crossfireMixActive,hell:hellMixActive,ambience:ambience.on})}));
if(location.search.includes('debug'))window.__sickTwisted={get featureScene(){return featureScenes.state;},get featureBorder(){return featureBorders.state;},get targetGun(){return bloodTargetGun.debug;},get bounty(){return {active:bloodBank.active,state:bloodBank.state,focused:bloodBank.focused,total:bonusAward,spinsPlayed:bloodSpinsPlayed,multiplier:bloodRewards.multiplier,rewardActive:bloodPromotion.active,defeated:[...defeatedOutlaws]};},pauseDebugRendering:v=>dev.pauseRendering=!!v,bloodSnapshot:()=>bloodIntro.snapshot,get bloodIntro(){return bloodIntro.state;},pauseBlood:v=>bloodIntro.setPaused(v),cancelBlood:()=>bloodIntro.cancel(),continueBlood:()=>bloodIntro.continue(),pauseHangFeature:v=>hangPresentation.setPaused(v,performance.now()),get hangIntro(){return hangIntro.state;},pauseHang:v=>hangIntro.setPaused(v),cancelHang:()=>hangIntro.cancel(),continueHang:()=>hangIntro.continue(),get hellIntro(){return hellIntro.state;},pauseHell:v=>hellIntro.setPaused(v),cancelHell:()=>hellIntro.cancel(),continueHell:()=>hellIntro.continue(),forceWildPath:id=>{dev.next={outcome:M.withShotWilds(M.outcomeById(id,'normal'),()=>.25,{count:2})};},get actionFeedback(){return {active:actionFeedback.count};},get wildShotState(){return wildShots.state?{mark:wildShots.state.mark,speed:wildShots.state.speed,shots:wildShots.state.shots,targets:wildShots.state.targets,fired:wildShots.state.fired,impacted:wildShots.state.impacted,converted:wildShots.state.converted}:null;},forceMarkPath:(id,symbol)=>{dev.next={outcome:M.withOutlawsMark(M.outcomeById(id,'allin'),()=>0,{force:true,symbol})};},forcePath:(id,mode=paidMode())=>{dev.next={outcome:M.outcomeById(id,mode)};},get ledger(){return roundLedger?{stake:roundLedger.stakeCents,returned:roundLedger.returnedCents,entries:roundLedger.entries}:null;},get bomb(){return bombFX.state;},get tumbling(){return tumble.active;},get crossfire(){return crossfire.state;},skipCrossfire:()=>crossfire.skip(),pausePresentation:v=>payout.setPaused(v,performance.now()),cancelPresentation:()=>payout.clear(),force:(grid,wild,options={})=>{dev.next={grid,...options,...(wild===undefined?{}:{wild:wild&&wild.spawn===undefined?{...wild,spawn:Number.isInteger(wild.mult/Math.pow(2,M.WILD_STEPS))?wild.mult/Math.pow(2,M.WILD_STEPS):null}:wild})};},setGrid:(grid,wild)=>{if(busy)return false;reels=grid.map(c=>[...c]);wilds=wild?{[wild.reel]:{mult:wild.mult,kind:'man',enter:0}}:{};multiplier=0;ink=false;spinning={};for(const k in reelDust)delete reelDust[k];return true;},nudge:nudgeSequence,startBonus,snapState,math:M,spin:normalSpin,continueBonus:bonusLoop,previewTokens,previewMax:()=>previewMax(),tiles:symbolTiles,wildSprite,character,geometry:G,get approvedWin(){return approvedWin.state;},get winCanvas(){return approvedWin.canvas;},get winAudio(){return approvedWin.audio;},soundToggle,get busy(){return busy;},get renderScale(){return renderScale;},get presenting(){return payout.active;},get reveal(){return {shown:!$('#bonus-intro').hidden,entering:bloodMoney.entering,built:bloodMoney.built,theme:bloodMoney.theme,layers:$('#bonus-intro .bm-theme:not([hidden])')?.children.length||0};},completeReveal:bloodMoneyComplete,get scatterAudio(){return scatterAudio.snapshot;},get samples(){return {loaded:Object.keys(samples).length,failed:samplesFailed,spinPlaying:!!reelAudio.spin,slam:!!samples.slam,vaultDuration:samples.vault?.duration||0,wildShotDuration:samples.wildShot?.duration||0,scatterDuration:samples.scatter?.duration||0,ambience:ambience.on};},cawNow:()=>caw({gain:.3,pan:.5}),set hideCharacter(v){dev.hideCharacter=!!v;},scatterDropNow:(reel=2)=>scatterDropSound(reel),scatterDeath,SCATTER_DROP,get shootout(){return {active:shootout.active,elapsed:shootout.active?shootoutElapsed(performance.now()):-1,frame:shootout.active?shootoutFrameIndex(performance.now()):-1,targets:shootout.targets||[],shots:shootout.shots||[],handoff:shootout.handoff||0,direction:'viewer',hits:shootoutHits(performance.now()).length,handoffAt:shootout.handoffAt||0,assets:{loaded:!!shootoutAssets.json,failed:shootoutAssets.failed,frames:shootoutAssets.json?shootoutAssets.json.frames.length:0}};},SHOOTOUT,shootoutLoad,get music(){return {...music.snapshot,playing:!!music.source};}};

if(new URLSearchParams(location.search).has('capture')&&new URLSearchParams(location.search).has('debug'))import('./blood-capture.js?v=2').then(({installBloodCapture})=>installBloodCapture({canvas,getGame:()=>window.__sickTwisted,getAudio:()=>{soundInit();return {context:audio,master:bus()};}}));

