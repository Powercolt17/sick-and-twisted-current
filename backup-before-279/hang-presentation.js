import {hangMotion,HANG_REVEAL} from './hang-motion.js?v=1';
import {splitHangBounty} from './hang-kernel.js?v=4';
const clamp=x=>Math.max(0,Math.min(1,x)),roman=['I','II','III','IV','V','VI'];
const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const HANG_BEATS=Object.freeze({intro:3200,lock:1250,upgrade:1750,stamps:700,stampUpgrade:1600,finale:2600,temporary:1900,depart:520,retrigger:1350});
export function createHangPresentation({stage,G,reduced=false,announce=()=>{},onImpact=()=>{},onFinale=()=>{}}){
 let active=false,order=[],locks={},temporary=null,finale=false,event=null,pausedAt=null,pausedMs=0,start=0,closing=false,resolveClose=null,closeTimer=null;
 let impacted=false,closingAt=0,finalTotal=0,resultDone=false,bounties={},temporaryBounty=0,otherBounty=0,receipt=[],receiptCue=-1;
 const hud=stage.querySelector('#game-controls');
 const root=document.createElement('div');root.className='hang-presentation';root.hidden=true;
 root.innerHTML=`<div class="hang-toast" hidden><span></span><strong></strong><small></small></div>
 <div class="hang-result" hidden role="dialog" aria-modal="true" aria-labelledby="hang-result-title" aria-describedby="hang-result-details">
 <div class="hang-result-sheet"><header><p class="hang-eyebrow">HANG ’EM HIGH · THE BOUNTY LEDGER</p><h2 id="hang-result-title">BOUNTIES COLLECTED</h2></header>
 <div class="hang-result-body"><div class="hang-outlaw-ledger"><div class="hang-result-outlaws"></div><p class="hang-other-wins"></p><p class="hang-receipt-note">Shared wins split equally; bounty shares are included in the total.</p></div>
 <div class="hang-result-award"><p class="hang-total-label">TOTAL REWARD</p><strong class="hang-result-total"></strong><div class="hang-result-seal">PAID IN FULL</div><p id="hang-result-details"></p></div></div>
 <button class="hang-continue" type="button">COLLECT & CONTINUE <span aria-hidden="true">→</span></button></div></div>`;
 stage.querySelector('#scene-stack').append(root);
 const toast=root.querySelector('.hang-toast'),result=root.querySelector('.hang-result'),button=root.querySelector('button');
 const clock=now=>(pausedAt??now)-pausedMs;
 const upgrades=()=>event?.type==='stamps'?event.earned.filter(e=>e.upgrade):event?.type==='upgrade'?[{reel:event.reel,fromMultiplier:event.from,toMultiplier:event.to}]:[];
 function text(ctx,value,x,y,size=17,color='#eee2c8',font='Outlaw',align='center'){ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);}
 function notify(next,now){
  start=clock(now);let top='',title='',detail='';
  if(next.type==='intro'){top='12 FREE SPINS · 3 PERMANENT OUTLAWS';title='BUILD YOUR BOUNTY';detail='WIN THROUGH AN OUTLAW TO EARN STAMPS. THREE STAMPS DOUBLE ITS MULTIPLIER.';}
  if(next.type==='lock'){top='OUTLAW CAPTURED';title=`REEL ${roman[next.reel]} LOCKED`;detail='WINS THROUGH THIS OUTLAW EARN BOUNTY STAMPS';}
  if(next.type==='upgrade'){top='BOUNTY RAISED';title=`×${next.from}`;detail='MULTIPLIER DOUBLED · LOCK HOLDS';}
  if(next.type==='stamps'){const raised=next.earned.filter(e=>e.upgrade);top=raised.length>1?'BOUNTIES RAISED':'BOUNTY COMPLETE';title=raised.length===1?`×${raised[0].fromMultiplier}`:`${raised.length} OUTLAWS UPGRADED`;detail='THREE STAMPS · MULTIPLIER DOUBLED';}
  if(next.type==='finale'){top='ALL THREE OUTLAWS CAPTURED';title='THE LAST SENTENCE';detail='DOUBLE STAMPS ARE LIVE. A FOURTH OUTLAW CAN NOW JOIN FOR ONE SPIN.';}
  if(next.type==='temporary'){top='THE FOURTH OUTLAW';title='×8 EXTRA WILD';detail='ONE SPIN ONLY · STAYS THROUGH EVERY TUMBLE';}
  if(next.type==='retrigger'){top='SENTENCE EXTENDED';title=`+${next.spins} FREE SPINS`;detail=`${next.remaining} SPINS LEFT · YOUR LOCKED OUTLAWS STAY`;}
  toast.querySelector('span').textContent=top;toast.querySelector('strong').textContent=title;toast.querySelector('small').textContent=detail;
  toast.dataset.event=next.type;toast.hidden=next.type==='depart'||next.type==='stamps'&&!next.earned.some(e=>e.upgrade);
  toast.dataset.multiple=String(next.type==='stamps'&&next.earned.filter(e=>e.upgrade).length>1);
  toast.classList.remove('arrive','struck');toast.style.animationDuration=thisDuration(next)+'ms';void toast.offsetWidth;toast.classList.add('arrive');
  if(!toast.hidden)announce([top,title,detail].join('. '));
 }
 function thisDuration(e=event){if(reduced)return 180;return e?.type==='stamps'?(e.earned.some(x=>x.upgrade)?HANG_BEATS.stampUpgrade:HANG_BEATS.stamps):HANG_BEATS[e?.type]||1350;}
 function accept(){if(!closing||button.disabled)return;button.disabled=true;result.classList.add('leaving');const done=resolveClose;resolveClose=null;closeTimer=setTimeout(()=>{result.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}done?.();},reduced?0:260);}
 button.onclick=accept;
 result.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();accept();}else if(e.key==='Tab'){e.preventDefault();button.focus();}});
 return {
  start(now){active=true;order=[];locks={};temporary=null;finale=false;closing=false;bounties={};temporaryBounty=0;otherBounty=0;pausedMs=0;pausedAt=document.hidden?now:null;event={type:'intro',at:clock(now)};impacted=false;root.hidden=false;result.hidden=true;root.classList.remove('last-sentence');notify(event,now);},
  sync(hang){order=[...hang.order];locks=structuredClone(hang.locks);temporary=hang.temporary&&{...hang.temporary};},
  clearTemporary(){temporary=null;},
  cue(next,now){event={...next,at:clock(now)};impacted=false;if(next.type==='finale'){finale=true;root.classList.add('last-sentence');onFinale();}notify(next,now);},
  reward(reward,now){locks=structuredClone(reward.locks);this.cue({type:'stamps',earned:reward.earned},now);},
  recordWin(cents,cells,wilds){const split=splitHangBounty(cents,cells,wilds);for(const [c,n]of Object.entries(split.outlaws))bounties[c]=(bounties[c]||0)+n;temporaryBounty+=split.temporary;otherBounty+=split.other;},
  duration(){return thisDuration();},
  tick(now){
   if(pausedAt!==null)return;const age=clock(now)-start,raised=upgrades();
   if(event&&!impacted&&age>=(reduced?0:raised.length?HANG_REVEAL:180)){
    impacted=true;if(raised.length){toast.querySelector('strong').textContent=raised.length===1?`×${raised[0].toMultiplier}`:`${raised.length} BOUNTIES DOUBLED`;toast.classList.add('struck');announce(raised.map(e=>`Reel ${roman[e.reel]} multiplier doubled to ${e.toMultiplier}`).join('. '));}
    if(['upgrade','lock','stamps','temporary','finale'].includes(event.type))onImpact(event);
   }
   if(!toast.hidden&&age>thisDuration())toast.hidden=true;
   if(closing&&!resultDone){
    const elapsed=clock(now)-closingAt;let collected=0;
    receipt.forEach((entry,i)=>{const p=reduced?1:clamp((elapsed-350-i*500)/480),value=Math.round(entry.cents*(1-Math.pow(1-p,3)));collected+=value;entry.node.querySelector('b').textContent=usd(value/100);entry.node.classList.toggle('collected',p===1);entry.node.style.setProperty('--collection',p);});
    const cue=Math.min(receipt.length-1,Math.floor((elapsed-830)/500));if(cue>=0&&cue>receiptCue){receiptCue=cue;onImpact({type:'receipt'});}
    const finish=350+Math.max(0,receipt.length-1)*500+520;
    root.querySelector('.hang-result-total').textContent=usd(collected/100);
    if(reduced||elapsed>=finish){resultDone=true;root.querySelector('.hang-result-total').textContent=usd(finalTotal);result.classList.add('settled');button.disabled=false;button.focus({preventScroll:true});}
   }
  },
  setPaused(value,now){if(value&&pausedAt===null)pausedAt=now;else if(!value&&pausedAt!==null){pausedMs+=now-pausedAt;pausedAt=null;}root.classList.toggle('paused',value);},
  elapsed(now){return clock(now)-start;},
  motion(reel,now){const raised=upgrades().some(e=>e.reel===reel);return raised?hangMotion(clock(now)-event.at,'upgrade',reduced):event?.reel===reel&&event?.type==='lock'?hangMotion(clock(now)-event.at,'lock',reduced):{};},
  wildAlpha(reel,now){return event?.type==='depart'&&event.reel===reel?(reduced?0:1-clamp((clock(now)-event.at)/450)):1;},
  upgradeValue(reel,now){const e=upgrades().find(x=>x.reel===reel);return e&&clock(now)-event.at<(reduced?0:HANG_REVEAL)?e.fromMultiplier:null;},
  draw(ctx,now,{mobile=false,header=0,remaining=0,total=0}={}){
   if(!active)return;this.tick(now);if(closing)return;ctx.save();const age=event?clock(now)-event.at:Infinity;
   for(const c of order){
    const raised=upgrades().some(e=>e.reel===c),e=event?.type==='stamps'?event.earned.find(e=>e.reel===c):null;
    const x=G.x+c*G.cw,pulse=reduced?0:e?Math.max(0,1-(age-180)/650):raised?hangMotion(age,'upgrade').impact:event?.type==='finale'?Math.max(0,Math.sin(age/180)*Math.exp(-age/1000)):0;
    if(pulse>0&&age>=180){ctx.save();ctx.globalAlpha=pulse*.85;ctx.strokeStyle=finale?'#d59a53':'#e6c994';ctx.lineWidth=2;ctx.shadowColor='#e5a951';ctx.shadowBlur=12;ctx.strokeRect(x+2,G.y+2,G.cw-4,G.h-4);ctx.restore();}
    const max=locks[c].mult===64,shown=e&&age<(reduced?0:HANG_REVEAL)?(age<180?e.from:Math.min(3,e.filled)):locks[c].stamps||0;
    if(e&&age<650&&!reduced){const p=clamp(age/650);ctx.save();ctx.globalAlpha=Math.sin(p*Math.PI);text(ctx,'+'+e.gain+' STAMP'+(e.gain>1?'S':''),x+G.cw/2,G.y+G.h-27-p*22,13,'#ffe4a5','Arial');ctx.restore();}
    ctx.fillStyle='#160f0bec';ctx.fillRect(x+3,G.y+G.h+3,G.cw-6,24);ctx.strokeStyle=max?'#d6ad63':'#785c35';ctx.lineWidth=.7;ctx.strokeRect(x+3,G.y+G.h+3,G.cw-6,24);
    if(max&&!(e&&age<HANG_REVEAL))text(ctx,'MAX ×64',x+G.cw/2,G.y+G.h+15,13,'#ffe0a0');
    else for(let i=0;i<3;i++){const sx=x+G.cw/2+(i-1)*23,filled=i<shown;ctx.beginPath();ctx.arc(sx,G.y+G.h+15,8,0,Math.PI*2);ctx.fillStyle=filled?'#8b3821':'#17120d';ctx.fill();ctx.strokeStyle=filled?'#e8bc79':'#826b48';ctx.stroke();text(ctx,'★',sx,G.y+G.h+15,filled?12:10,filled?'#ffe2a5':'#695839','Arial');}
   }
   if(temporary){const x=G.x+temporary.reel*G.cw;ctx.fillStyle='#57231bed';ctx.fillRect(x+3,G.y+G.h+3,G.cw-6,24);text(ctx,'THIS SPIN',x+G.cw/2,G.y+G.h+15,13,'#ffe3ba');ctx.strokeStyle='#c57e4b';ctx.strokeRect(x+2,G.y+2,G.cw-4,G.h-4);}
   const combined=order.reduce((n,c)=>n+(this.upgradeValue(c,now)??locks[c].mult),0)+(temporary?.mult||0);
   if(mobile&&header){text(ctx,finale?'THE LAST SENTENCE':'HANG ’EM HIGH',600,-177,finale?33:39,finale?'#edb970':'#eee2c8');text(ctx,finale?'2 STAMPS PER CONTRIBUTING WIN':`${order.length} / 3 OUTLAWS · 3 STAMPS TO DOUBLE`,600,-124,22,'#d1b482','Arial');text(ctx,combined?`×${combined} COMBINED`:'CAPTURE YOUR FIRST OUTLAW',600,-77,30,'#f4dfad');text(ctx,`${remaining} SPINS LEFT · ${usd(total)} WON`,600,-29,24,'#e7ddca','Arial');}
   else{const y=G.y+G.h+42;ctx.fillStyle=finale?'#341910ed':'#16100ded';ctx.fillRect(G.x-7,y-11,G.w+14,29);ctx.strokeStyle=finale?'#ce9a52':'#967346';ctx.strokeRect(G.x-7,y-11,G.w+14,29);text(ctx,finale?'LAST SENTENCE · DOUBLE STAMPS':`${order.length}/3 OUTLAWS · 3 STAMPS TO DOUBLE`,G.x+5,y+3,12,'#dfbb81','Arial','left');text(ctx,combined?`×${combined}`:'BOUNTY HUNT',G.x+G.w*.59,y+3,22,'#ffe1a3');text(ctx,`${remaining} SPINS LEFT`,G.x+G.w-5,y+3,13,'#e8d4ae','Arial','right');}
   ctx.restore();
  },
  close(total,now,completed=12){
   closing=true;closingAt=clock(now);finalTotal=total;resultDone=false;receipt=[];receiptCue=-1;toast.hidden=true;result.hidden=false;result.classList.remove('leaving','settled');stage.setAttribute('data-hang-result','');if(hud){hud.inert=true;hud.setAttribute('aria-hidden','true');}
   const art=root.querySelector('.hang-result-outlaws');art.replaceChildren();
   for(const c of order){const card=document.createElement('div');card.className='hang-result-outlaw';card.innerHTML=`<div class="hang-card-portrait"><img src="assets/outlaw-hanging/outlaw-original.png" alt="Captured Outlaw on reel ${roman[c]}"></div><span>REEL ${roman[c]} <strong>×${locks[c].mult}</strong></span><b>$0.00</b><em>BOUNTY SHARE</em>`;art.append(card);receipt.push({cents:bounties[c]||0,node:card});}
   if(temporaryBounty){const card=document.createElement('div');card.className='hang-result-outlaw temporary';card.innerHTML='<div class="hang-card-portrait"><img src="assets/outlaw-hanging/outlaw-original.png" alt="Temporary fourth Outlaw"></div><span>FOURTH OUTLAW <strong>×8</strong></span><b>$0.00</b><em>BOUNTY SHARE</em>';art.append(card);receipt.push({cents:temporaryBounty,node:card});}
   const other=root.querySelector('.hang-other-wins');other.innerHTML='<span>OTHER SPIN WINS</span><b>$0.00</b>';const accounted=receipt.reduce((n,r)=>n+r.cents,0),rest=Math.max(0,Math.round(total*100)-accounted);other.hidden=!rest;if(rest)receipt.push({cents:rest,node:other});
   root.querySelector('.hang-result-total').textContent=usd(0);root.querySelector('#hang-result-details').textContent=`${order.length} OUTLAWS CAPTURED · ${completed} FREE SPINS COMPLETED${finale?' · LAST SENTENCE REACHED':''}`;
   announce(`Bounties collected. Feature total ${usd(total)}. These amounts are already included in the total.`);button.disabled=true;return new Promise(resolve=>resolveClose=resolve);
  },
  stop(){clearTimeout(closeTimer);active=false;event=null;order=[];locks={};temporary=null;finale=false;root.classList.remove('last-sentence');root.hidden=true;result.hidden=true;toast.hidden=true;closing=false;stage.removeAttribute('data-hang-result');if(hud){hud.inert=false;hud.removeAttribute('aria-hidden');}resolveClose?.();resolveClose=null;},
  get active(){return active;},get closing(){return closing;},get state(){return {active,closing,order:[...order],locks:structuredClone(locks),temporary:temporary&&{...temporary},finale,bounties:{...bounties},temporaryBounty,otherBounty,event:event&&{...event}};}
 };
}
