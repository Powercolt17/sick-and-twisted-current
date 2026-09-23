 const clamp=x=>Math.max(0,Math.min(1,x));
const roman=['I','II','III','IV','V','VI'];
const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export function createHangPresentation({stage,G,reduced=false,announce=()=>{}}){
 let active=false,order=[],locks={},event=null,pausedAt=null,pausedMs=0,start=0,closing=false,resolveClose=null,closeTimer=null;
 const hud=stage.querySelector('#game-controls');
 const root=document.createElement('div');root.className='hang-presentation';root.hidden=true;
 root.innerHTML=`<div class="hang-toast" hidden><span></span><strong></strong><small></small></div>
 <div class="hang-result" hidden role="dialog" aria-modal="true" aria-labelledby="hang-result-title" aria-describedby="hang-result-details">
  <div class="hang-result-sheet"><p class="hang-eyebrow">SENTENCE SERVED</p><h2 id="hang-result-title">HANG ’EM HIGH</h2>
  <div class="hang-result-outlaws" aria-hidden="true"></div><p class="hang-total-label">TOTAL WON</p><strong class="hang-result-total"></strong>
  <p id="hang-result-details"></p><button class="hang-continue" type="button">CONTINUE</button></div></div>`;
 stage.querySelector('#scene-stack').append(root);
 const toast=root.querySelector('.hang-toast'),result=root.querySelector('.hang-result'),button=root.querySelector('button');
 const clock=now=>(pausedAt??now)-pausedMs;
 function text(ctx,value,x,y,size=17,color='#eee2c8',font='Outlaw',align='center'){
  ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);
 }
 function notify(event,now){
  const t=clock(now);start=t;
  toast.querySelector('span').textContent=event.type==='retrigger'?'SENTENCE EXTENDED':event.type==='intro'?'12 FREE SPINS':event.type==='upgrade'?'ROPE TIGHTENED':'OUTLAW CAPTURED';
  toast.querySelector('strong').textContent=event.type==='retrigger'?('+'+event.spins+' FREE SPINS'):event.type==='intro'?'LOCK THEM IN':event.type==='upgrade'?`×${event.from} → ×${event.to}`:`REEL ${roman[event.reel]} LOCKED`;
  toast.querySelector('small').textContent=event.type==='retrigger'?(event.remaining+' SPINS LEFT · LOCKED WILDS STAY'):event.type==='intro'?'CAPTURE UP TO THREE · KEEP EVERY CATCH':event.type==='upgrade'?'MULTIPLIER DOUBLED · LOCK HOLDS':`${order.length} OF 3 CAPTURED · STAYS FOR EVERY SPIN`;
  toast.dataset.event=event.type;toast.hidden=false;toast.classList.remove('arrive');void toast.offsetWidth;toast.classList.add('arrive');
  announce([toast.querySelector('span').textContent,toast.querySelector('strong').textContent,toast.querySelector('small').textContent].join('. '));
 }
 function accept(){if(!closing||button.disabled)return;button.disabled=true;result.classList.add('leaving');const done=resolveClose;resolveClose=null;closeTimer=setTimeout(()=>{result.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}done?.();},reduced?0:260);}
 button.onclick=accept;
 result.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();accept();}else if(e.key==='Tab'){e.preventDefault();button.focus();}});
 return {
  start(now){active=true;order=[];locks={};event=null;closing=false;pausedMs=0;pausedAt=document.hidden?now:null;root.hidden=false;result.hidden=true;notify({type:'intro'},now);},
  sync(hang){order=[...hang.order];locks=structuredClone(hang.locks);},
  cue(next,now){event={...next,at:clock(now)};notify(next,now);},
  tick(now){if(!pausedAt&&!toast.hidden&&clock(now)-start>1350)toast.hidden=true;},
  setPaused(value,now){if(value&&pausedAt===null)pausedAt=now;else if(!value&&pausedAt!==null){pausedMs+=now-pausedAt;pausedAt=null;}root.classList.toggle('paused',value);},
  elapsed(now){return clock(now)-start;},
  upgradeOffset(reel,now){if(reduced||event?.type!=='upgrade'||event.reel!==reel)return 0;const t=(clock(now)-event.at)/700;return t>=0&&t<1?12*Math.sin(t*Math.PI*4)*Math.exp(-t*5):0;},
  upgradeValue(reel,now){return event?.type==='upgrade'&&event.reel===reel&&clock(now)-event.at<180?event.from:null;},
  draw(ctx,now,{mobile=false,header=0,remaining=0,total=0}={}){
   if(!active||closing)return;this.tick(now);
   ctx.save();
   if(mobile&&header){
    if(toast.hidden){
    text(ctx,'HANG ’EM HIGH',600,-130,38);text(ctx,`${order.length} / 3 CAPTURED`,600,-85,30,'#d1b482','Arial');
    text(ctx,`${remaining} SPINS LEFT  ·  ${usd(total)} WON`,600,-42,29,'#e7ddca','Arial');
    }
   }else{
    text(ctx,'HANG ’EM HIGH',G.x+8,G.y+G.h+38,20,'#e5d5b8','Outlaw','left');
    text(ctx,`${remaining} SPINS LEFT`,G.x+G.w-8,G.y+G.h+38,17,'#e5d5b8','Arial','right');
   }
   for(const c of order){
    const x=G.x+c*G.cw;ctx.fillStyle='#271913';ctx.fillRect(x+3,G.y+G.h+4,G.cw-6,21);
    ctx.strokeStyle='#bba575';ctx.lineWidth=.8;ctx.strokeRect(x+3,G.y+G.h+4,G.cw-6,21);
    text(ctx,'LOCKED',x+G.cw/2,G.y+G.h+15,12,'#efdfb9','Arial');
   }
   ctx.restore();
  },
  close(total,now,completed=12){
   closing=true;toast.hidden=true;result.hidden=false;result.classList.remove('leaving');stage.setAttribute('data-hang-result','');if(hud){hud.inert=true;hud.setAttribute('aria-hidden','true');}
   const art=root.querySelector('.hang-result-outlaws');art.replaceChildren();
   for(let i=0;i<3;i++){const c=order[i],card=document.createElement('div');card.className='hang-result-outlaw'+(c===undefined?' empty':'');
    const img=document.createElement('img');img.src='assets/outlaw-hanging/outlaw-original.png';img.alt='';
    const label=document.createElement('span');label.textContent=c===undefined?'UNCAPTURED':`REEL ${roman[c]} · ×${locks[c].mult}`;card.append(img,label);art.append(card);}
   const amount=root.querySelector('.hang-result-total');amount.textContent=usd(total);
   root.querySelector('#hang-result-details').textContent=`${order.length} OF 3 OUTLAWS CAPTURED  ·  ${completed} FREE SPINS COMPLETED`;
   announce(`Hang Em High complete. Total won ${usd(total)}. ${order.length} outlaws captured.`);
   button.disabled=true;closeTimer=setTimeout(()=>{button.disabled=false;button.focus({preventScroll:true});},reduced?0:700);
   return new Promise(resolve=>resolveClose=resolve);
  },
  stop(){clearTimeout(closeTimer);active=false;event=null;order=[];locks={};root.hidden=true;result.hidden=true;toast.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}resolveClose?.();resolveClose=null;},
  get active(){return active;},get closing(){return closing;},get state(){return {active,closing,order:[...order],locks:structuredClone(locks),event:event&&{...event}};}
 };
}
