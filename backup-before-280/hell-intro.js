import {drawAnnouncement} from './announce.js?v=1';
import {createHellArtwork} from './hell-artwork.js?v=5';
import {createScatterBurn,FEATURE_TIMING} from './live-scatter-burn.js?v=1';
import {scheduleFeatureAudio,createFeatureBuffers} from './feature-audio.js?v=1';
import {presentationRandom} from './feature-entry.js?v=1';
let sharedAssets;
function loadSharedAssets(){return sharedAssets??=(async()=>{
 const image=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
 const [skull,fire]=await Promise.all([image('assets/feature-live/scatter-skeleton.png'),image('assets/hell-to-pay/ink-fire-atlas.png')]);
 const font=new FontFace('HellOutlaw','url(assets/hell-to-pay/rye.ttf)');await font.load();document.fonts.add(font);return {skull,fire};
})();}

const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function confirmedHellCells(grid,trigger){
 if(!trigger||!Number.isSafeInteger(trigger.count)||trigger.count<1||trigger.scatters<5)throw Error('A confirmed five-scatter award is required');
 const cells=[];
 for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(grid[c]?.[r]==='scatter')cells.push([c,r]);
 if(cells.length<5||cells.length!==trigger.scatters)throw Error('Confirmed scatters do not match the frozen result');
 return cells;
}

export function createHellIntro({canvas,stage,W,H,grid:G,getAudio,isMuted,onMix,onResolution=()=>{},feature={},now=()=>performance.now()}){
 const {id='hell-pay',name='Hell to Pay',title='HELL TO PAY',minScatters=5,maxScatters=24,fireGlow=true,debugKey='hell',createArtwork=createHellArtwork,timing=FEATURE_TIMING,createScatterEffect=createScatterBurn,createFrame=null,loadAudio=null,scheduleAudio=scheduleFeatureAudio,showScatterCount=true,images={art:'assets/hell-to-pay/hell-to-pay-art.png',cleanArt:'assets/hell-to-pay/hell-to-pay-clean-plate.png'}}=feature;
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const root=document.createElement('div');root.id=id+'-controls';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-label',name+' bonus introduction');
 root.style.cssText='position:absolute;inset:0;z-index:8;pointer-events:none;';
 const button=document.createElement('button');button.type='button';button.textContent='CONTINUE';button.hidden=true;
 button.style.cssText='position:absolute;margin:0;padding:0;background:transparent;border:0;color:transparent;pointer-events:auto;min-height:24px;cursor:pointer;';
 button.setAttribute('aria-label','Continue to '+name);root.append(button);stage.append(root);
 const mute=document.createElement('button');mute.type='button';mute.className='hell-mute';
 mute.style.cssText='position:absolute;right:10px;top:10px;pointer-events:auto;background:#17120ee8;color:#e5d3ae;border:1px solid #715c3c;padding:7px 10px;font:12px Arial;';
 // The game supplies the existing mute toggle, keeping a single sound setting.
 root.append(mute);
 const take=timing;
 let assets,art,burn,frame,loading,state=null,voice=null,serial=0,continues=0,cancels=0,lastResult=null;
 async function load(){
  return loading??=(async()=>{
   const extras=Promise.all(Object.entries(images).map(async([key,path])=>{const im=new Image();im.src=path;await im.decode();return [key,im];}));
   const [shared,loaded]=await Promise.all([loadSharedAssets(),extras]);assets={...shared,inkFire:shared.fire,...Object.fromEntries(loaded)};
   const output=getAudio()||{};if(output.context){createFeatureBuffers(output.context);if(loadAudio)assets.audio=await loadAudio(output.context);}
  })();
 }
 function time(){return state?Math.min(take.duration,state.offset+(state.paused?0:(now()-state.epoch)/1000)):0;}
 function stopVoice(){voice?.stop();voice=null;}
 function startVoice(){
  if(!state||state.paused||!state.context||state.context.state!=='running')return;
  voice=scheduleAudio(state.context,state.master,{offset:time(),muted:isMuted(),count:state.cells.length,cardAt:take.cardAt,buffers:assets.audio});
 }
 function syncMute(){
  mute.textContent=isMuted()?'SOUND OFF':'SOUND ON';mute.setAttribute('aria-label',isMuted()?'Enable sound during '+name:'Mute '+name);voice?.mute(isMuted());
 }

 function setPaused(paused){
  if(!state||state.paused===paused)return;
  state.offset=time();state.epoch=now();state.paused=paused;
  if(paused)stopVoice();else startVoice();
 }
 function cleanup(continued){
  if(!state)return false;const old=state;lastResult={id:old.id,continued,awardedSpins:old.awardedSpins,cells:old.cells.map(c=>[...c]),time:time()};
  state=null;root.hidden=true;button.hidden=true;stopVoice();burn?.dispose();burn=null;frame?.dispose();frame=null;art?.dispose();art=null;onResolution(false);canvas.getContext('2d').drawImage(old.frozen,0,0,canvas.width,canvas.height);old.frozen.width=old.frozen.height=1;onMix(false);
  if(continued)continues++;else cancels++;old.resolve(continued);return true;
 }
 function continueOnce(){if(!state||state.paused||time()<take.continueAt)return false;return cleanup(true);}
 button.addEventListener('click',continueOnce);
 const key=e=>{if(state&&['Space','Enter'].includes(e.code)&&e.target!==mute){e.preventDefault();e.stopImmediatePropagation();continueOnce();}};
 document.addEventListener('keydown',key,true);
 document.addEventListener('visibilitychange',()=>setPaused(document.hidden));
 window.addEventListener('pagehide',()=>cleanup(false));
 async function play({cells=[],awardedSpins=null}){
  if(state)return false;await load();if(state)return false;
  if(cells.length<minScatters||cells.length>maxScatters||new Set(cells.map(c=>c.join(':'))).size!==cells.length||cells.some(c=>c.length!==2||!c.every(Number.isInteger)||c[0]<0||c[0]>=6||c[1]<0||c[1]>=4))throw Error('Invalid confirmed scatter cells');
  if(awardedSpins!==null&&(!Number.isSafeInteger(awardedSpins)||awardedSpins<1))throw Error('Invalid confirmed spin award');
  // Snapshot only the actual game's last rendered, resolved result.
  const frozen=make(W,H);frozen.getContext('2d').drawImage(canvas,0,0,W,H);onResolution(true);
  canvas.getContext('2d').drawImage(frozen,0,0,canvas.width,canvas.height);
  const {context,master}=getAudio()||{};if(context)await context.resume().catch(()=>{});
  art=createArtwork(assets,make,{title,fireGlow});burn=createScatterEffect({frozen,cells,G,skull:assets.skull,fire:assets.fire,assets,make,seed:Math.floor(presentationRandom()*1000000)});frame=createFrame?.({make,W,H,G});onMix(true);
  return new Promise(resolve=>{
   state={id:++serial,cells:cells.map(c=>[...c]),awardedSpins,frozen,resolve,context,master,epoch:now(),offset:0,paused:document.hidden};
   root.hidden=false;button.hidden=true;button.setAttribute('aria-label',awardedSpins===null?'Continue to '+name:`Continue to ${awardedSpins} confirmed free spins`);syncMute();startVoice();
  });
 }
 function layout(){
  const cr=canvas.getBoundingClientRect(),vr=canvas.parentElement.getBoundingClientRect(),sr=stage.getBoundingClientRect();
  const visibleWorldWidth=vr.width/cr.width*W,scale=Math.min(G.w/900,(visibleWorldWidth-12)/1000),x=G.x+G.w/2-720*scale,y=H-780*scale;
  return {scale,x,y,cr,sr,vr,cropped:visibleWorldWidth<W*.9};
 }
 function draw(ctx){
  if(!state)return false;
  const t=time();canvas.dataset[debugKey+'Time']=String(t);
  ctx.save();const l=layout();
  if(frame){frame.draw(ctx,{t,frozen:state.frozen,burn,art,layout:l,awardedSpins:state.awardedSpins});}
  else{ctx.drawImage(state.frozen,0,0,W,H);
  const dim=.55*smooth(t/.7);ctx.fillStyle=`rgba(9,5,3,${dim})`;ctx.fillRect(0,0,W,H);
  burn.draw(ctx,t);
  if(showScatterCount&&t>=1.48&&t<take.cardAt){drawAnnouncement(ctx,{x:G.x+G.w/2,y:581,width:300,eyebrow:'HELL TO PAY',lead:String(state.cells.length),headline:'SCATTERS',alpha:smooth((t-1.48)/.16)});}
  if(t>=take.dimAt){ctx.fillStyle=`rgba(6,4,3,${.87*smooth((t-take.dimAt)/.3)})`;ctx.fillRect(0,0,W,H);}
  ctx.save();ctx.translate(l.x,l.y);ctx.scale(l.scale,l.scale);art.draw(ctx,t,state.awardedSpins);ctx.restore();}
  ctx.translate(l.x,l.y);ctx.scale(l.scale,l.scale);
  if(t>=take.continueAt){
   const a=smooth((t-take.continueAt)/.2);ctx.globalAlpha=a;ctx.fillStyle='#201510';ctx.fillRect(587,724,266,52);ctx.strokeStyle='#9e8155';ctx.lineWidth=1;ctx.strokeRect(587,724,266,52);ctx.font='20px Arial';ctx.fillStyle='#dfd0b0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CONTINUE',720,751);
   const k=l.cr.width/W;button.style.left=(l.cr.left-l.sr.left+(l.x+587*l.scale)*k)+'px';button.style.top=(l.cr.top-l.sr.top+(l.y+724*l.scale)*k)+'px';button.style.width=(266*l.scale*k)+'px';button.style.height=(52*l.scale*k)+'px';
   if(l.cropped){button.style.left=(l.sr.width-140)/2+'px';button.style.top=l.vr.top-l.sr.top+l.vr.height-34+'px';button.style.width='140px';button.style.height='32px';button.style.background='#201510';button.style.border='1px solid #9e8155';button.style.color='#dfd0b0';button.style.font='14px Arial';}
   else {button.style.background='transparent';button.style.border='0';button.style.color='transparent';}
   if(button.hidden){button.hidden=false;button.focus({preventScroll:true});}
  }
  ctx.restore();return true;
 }
 return {load,play,draw,syncMute,setPaused,continue:continueOnce,cancel:()=>cleanup(false),setMuteToggle:fn=>mute.onclick=fn,get snapshot(){return state?.frozen??null;},get active(){return !!state;},get state(){return {active:!!state,id:state?.id??serial,time:time(),paused:state?.paused??false,awardedSpins:state?.awardedSpins??null,cells:state?.cells??[],canContinue:!!state&&time()>=take.continueAt,pendingAudio:voice?.pending??0,muted:isMuted(),audioClock:false,clock:'live-animation',recordedMedia:false,continues,cancels,lastResult};}};
}

