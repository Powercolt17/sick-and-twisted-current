import {hangMotion,HANG_REVEAL} from './hang-motion.js?v=1';
const clamp=x=>Math.max(0,Math.min(1,x));
const roman=['I','II','III','IV','V','VI'];
const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export function createHangPresentation({stage,G,reduced=false,announce=()=>{},onImpact=()=>{}}){
 let active=false,order=[],locks={},event=null,pausedAt=null,pausedMs=0,start=0,closing=false,resolveClose=null,closeTimer=null;
 let impacted=false,closingAt=0,finalTotal=0,resultDone=false;
 const hud=stage.querySelector('#game-controls');
 const root=document.createElement('div');root.className='hang-presentation';root.hidden=true;
 root.innerHTML=`<div class="hang-toast" hidden><span></span><strong></strong><small></small></div>
 <div class="hang-result" hidden role="dialog" aria-modal="true" aria-labelledby="hang-result-title" aria-describedby="hang-result-details">
  <div class="hang-result-sheet"><p class="hang-eyebrow">THE GALLOWS HAVE SPOKEN</p><h2 id="hang-result-title">HANG ’EM HIGH</h2>
  <div class="hang-result-outlaws" aria-hidden="true"></div><p class="hang-total-label">TOTAL WON</p><strong class="hang-result-total"></strong>
  <div class="hang-result-seal">SENTENCE SERVED</div><p id="hang-result-details"></p><button class="hang-continue" type="button">COLLECT & CONTINUE</button></div></div>`;
 stage.querySelector('#scene-stack').append(root);
 const toast=root.querySelector('.hang-toast'),result=root.querySelector('.hang-result'),button=root.querySelector('button');
 const clock=now=>(pausedAt??now)-pausedMs;
 function text(ctx,value,x,y,size=17,color='#eee2c8',font='Outlaw',align='center'){
  ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);
 }
 function notify(event,now){
  const t=clock(now);start=t;
  toast.querySelector('span').textContent=event.type==='retrigger'?'SENTENCE EXTENDED':event.type==='intro'?'12 FREE SPINS':event.type==='upgrade'?'ROPE TIGHTENED':'OUTLAW CAPTURED';
  toast.querySelector('strong').textContent=event.type==='retrigger'?('+'+event.spins+' FREE SPINS'):event.type==='intro'?'LOCK THEM IN':event.type==='upgrade'?`×${event.from}`:`REEL ${roman[event.reel]} LOCKED`;
  toast.querySelector('small').textContent=event.type==='retrigger'?(event.remaining+' SPINS LEFT · LOCKED WILDS STAY'):event.type==='intro'?'CAPTURE UP TO THREE · KEEP EVERY CATCH':event.type==='upgrade'?'MULTIPLIER DOUBLED · LOCK HOLDS':`${order.length} OF 3 CAPTURED · STAYS FOR EVERY SPIN`;
  toast.dataset.event=event.type;toast.hidden=false;toast.classList.remove('arrive','struck');void toast.offsetWidth;toast.classList.add('arrive');
  announce([toast.querySelector('span').textContent,toast.querySelector('strong').textContent,toast.querySelector('small').textContent].join('. '));
 }
 function accept(){if(!closing||button.disabled)return;button.disabled=true;result.classList.add('leaving');const done=resolveClose;resolveClose=null;closeTimer=setTimeout(()=>{result.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}done?.();},reduced?0:260);}
 button.onclick=accept;
 result.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();accept();}else if(e.key==='Tab'){e.preventDefault();button.focus();}});
 return {
  start(now){active=true;order=[];locks={};event=null;closing=false;pausedMs=0;pausedAt=document.hidden?now:null;root.hidden=false;result.hidden=true;notify({type:'intro'},now);},
  sync(hang){order=[...hang.order];locks=structuredClone(hang.locks);},
  cue(next,now){event={...next,at:clock(now)};impacted=false;notify(next,now);},
  tick(now){
   if(pausedAt!==null)return;
   const age=clock(now)-start;
   if(event&&!impacted&&age>=(reduced?0:event.type==='upgrade'?HANG_REVEAL:160)){
    impacted=true;
    if(event.type==='upgrade'){toast.querySelector('strong').textContent=`×${event.to}`;toast.classList.add('struck');announce(`Multiplier doubled. ${event.from} times to ${event.to} times.`);}
    if(event.type==='upgrade'||event.type==='lock')onImpact();
   }
   if(!toast.hidden&&age>(event?.type==='upgrade'?1750:1350))toast.hidden=true;
   if(closing&&!resultDone){
    const elapsed=clock(now)-closingAt,p=reduced?1:clamp((elapsed-400)/1500);
    root.querySelector('.hang-result-total').textContent=usd(finalTotal*(1-Math.pow(1-p,3)));
    if(p===1){resultDone=true;result.classList.add('settled');button.disabled=false;button.focus({preventScroll:true});}
   }
  },
  setPaused(value,now){if(value&&pausedAt===null)pausedAt=now;else if(!value&&pausedAt!==null){pausedMs+=now-pausedAt;pausedAt=null;}root.classList.toggle('paused',value);},
  elapsed(now){return clock(now)-start;},
  motion(reel,now){return event?.reel===reel?hangMotion(clock(now)-event.at,event.type,reduced):{};},
  upgradeValue(reel,now){return event?.type==='upgrade'&&event.reel===reel&&clock(now)-event.at<(reduced?0:HANG_REVEAL)?event.from:null;},
  draw(ctx,now,{mobile=false,header=0,remaining=0,total=0}={}){
   if(!active)return;this.tick(now);if(closing)return;
   ctx.save();
   if(event?.reel!==undefined&&!reduced){
    const age=clock(now)-event.at,m=hangMotion(age,event.type),x=G.x+event.reel*G.cw;
    if(m.impact>0){ctx.save();ctx.globalAlpha=m.impact;ctx.strokeStyle='#f3d796';ctx.lineWidth=2;ctx.shadowColor='#cb9349';ctx.shadowBlur=14;ctx.strokeRect(x+2,G.y+2,G.cw-4,G.h-4);ctx.restore();}
    const t=(age-(event.type==='upgrade'?HANG_REVEAL:160))/1000;
    if(t>0&&t<.75){ctx.save();ctx.globalAlpha=(1-t/.75)*.7;ctx.fillStyle='#bca078';
     for(let i=0;i<12;i++){const dx=Math.sin(i*2.4)*40*t,dy=18+t*t*130-(i%4)*17*t;ctx.fillRect(x+G.cw/2+dx,G.y+dy,1+i%3,2+i%2);}ctx.restore();}
   }
   if(mobile&&header){
    text(ctx,'HANG ’EM HIGH',600,-177,39);
    text(ctx,`${order.length} / 3 CAPTURED`,600,-124,27,'#d1b482','Arial');
    const combined=order.reduce((n,c)=>n+(this.upgradeValue(c,now)??locks[c].mult),0);
    text(ctx,combined?`×${combined} COMBINED`:'AWAITING CAPTURE',600,-77,34,'#f4dfad');
    text(ctx,`${remaining} SPINS LEFT  ·  ${usd(total)} WON`,600,-29,24,'#e7ddca','Arial');
   }else{
    const y=G.y+G.h+37,combined=order.reduce((n,c)=>n+(this.upgradeValue(c,now)??locks[c].mult),0);
    ctx.fillStyle='#16100de8';ctx.fillRect(G.x-7,y-11,G.w+14,31);ctx.strokeStyle='#967346';ctx.lineWidth=1;ctx.strokeRect(G.x-7,y-11,G.w+14,31);
    text(ctx,`${order.length} / 3 CAPTURED`,G.x+10,y+4,14,'#d6bd91','Arial','left');
    text(ctx,combined?`×${combined} COMBINED`:'LOCK THEM IN',G.x+G.w/2,y+4,22,'#f4dfad');
    text(ctx,`${remaining} SPINS LEFT`,G.x+G.w-10,y+4,14,'#d6bd91','Arial','right');
   }
   for(const c of order){
    const x=G.x+c*G.cw;ctx.fillStyle='#271913';ctx.fillRect(x+3,G.y+G.h+4,G.cw-6,21);
    ctx.strokeStyle='#bba575';ctx.lineWidth=.8;ctx.strokeRect(x+3,G.y+G.h+4,G.cw-6,21);
    text(ctx,'LOCKED',x+G.cw/2,G.y+G.h+15,12,'#efdfb9','Arial');
   }
   ctx.restore();
  },
  close(total,now,completed=12){
   closing=true;closingAt=clock(now);finalTotal=total;resultDone=false;toast.hidden=true;result.hidden=false;result.classList.remove('leaving','settled');stage.setAttribute('data-hang-result','');if(hud){hud.inert=true;hud.setAttribute('aria-hidden','true');}
   const art=root.querySelector('.hang-result-outlaws');art.replaceChildren();
   for(let i=0;i<3;i++){const c=order[i],card=document.createElement('div');card.className='hang-result-outlaw'+(c===undefined?' empty':'');
    const img=document.createElement('img');img.src='assets/outlaw-hanging/outlaw-original.png';img.alt='';
    const label=document.createElement('span');label.textContent=c===undefined?'UNCAPTURED':`REEL ${roman[c]} · ×${locks[c].mult}`;card.append(img,label);art.append(card);}
   const amount=root.querySelector('.hang-result-total');amount.textContent=usd(reduced?total:0);
   root.querySelector('#hang-result-details').textContent=`${order.length} OF 3 OUTLAWS CAPTURED  ·  ${completed} FREE SPINS COMPLETED`;
   announce(`Hang Em High complete. Total won ${usd(total)}. ${order.length} outlaws captured.`);
   button.disabled=true;
   return new Promise(resolve=>resolveClose=resolve);
  },
  stop(){clearTimeout(closeTimer);active=false;event=null;order=[];locks={};root.hidden=true;result.hidden=true;toast.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}resolveClose?.();resolveClose=null;},
  get active(){return active;},get closing(){return closing;},get state(){return {active,closing,order:[...order],locks:structuredClone(locks),event:event&&{...event}};}
 };
}
