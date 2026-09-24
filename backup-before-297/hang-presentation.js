import {hangMotion,HANG_REVEAL} from './hang-motion.js?v=1';
import {splitHangBounty} from './hang-kernel.js?v=4';
import {drawAnnouncement} from './announce.js?v=1';
const clamp=x=>Math.max(0,Math.min(1,x)),roman=['I','II','III','IV','V','VI'];
const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const HANG_BEATS=Object.freeze({intro:3200,lock:1250,upgrade:1750,stamps:700,stampUpgrade:1600,finale:2600,temporary:1900,depart:520,retrigger:1350});
export function createHangPresentation({stage,G,reduced=false,announce=()=>{},onImpact=()=>{},onFinale=()=>{},onLantern=()=>{}}){
 let active=false,order=[],locks={},temporary=null,finale=false,event=null,pausedAt=null,pausedMs=0,start=0,closing=false,resolveClose=null,closeTimer=null;
 let impacted=false,closingAt=0,finalTotal=0,resultDone=false,bounties={},temporaryBounty=0,otherBounty=0,receipt=[],receiptCue=-1;
 const hud=stage.querySelector('#game-controls');
 const root=document.createElement('div');root.className='hang-presentation';root.hidden=true;
 root.innerHTML=`<div class="hang-toast st-announce" hidden><div class="st-announce-top"></div><div class="st-announce-main"><strong class="st-announce-lead"></strong><h3 class="st-announce-title"></h3></div><div class="st-announce-sub"></div></div>
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
 // A leading "+2", "×8" etc. becomes the gold lead of the headline, exactly like the reward's "+2 FREE SPINS".
 function setToast(top,title,detail){const m=/^([+×]\d+)\s*(.*)$/.exec(title||'');
  toast.querySelector('.st-announce-top').textContent=top;toast.querySelector('.st-announce-lead').textContent=m?m[1]:'';
  toast.querySelector('.st-announce-title').textContent=m?m[2]:title;toast.querySelector('.st-announce-sub').textContent=detail;
  toast.querySelector('.st-announce-lead').hidden=!m;toast.querySelector('.st-announce-title').hidden=!!m&&!m[2];}
 // ---- Bounty lanterns ----------------------------------------------------------------------------------------
 // The game's own approved oil lantern (the one on the base-game border post, assets/lantern/lantern.webp) and the same
 // light recipe as lantern-light.js: a breathing flame, a warm glow in the glass, warm spill on what is around it.
 // No rings, no geometric sparks: lighting one is a wick catching; paying out is the wick turned up, then guttering.
 const LAMP={src:'assets/lantern/lantern.webp',w:352,h:900,pivot:[170.6,59.8],flame:[184.9,631.3]};
 let lampArt=null,lampDark=null;
 {const i=new Image();i.decoding='async';i.onload=()=>{lampArt=i;lampDark=darkLamp(i);};i.src=LAMP.src;}
 function darkLamp(img){ // an unlit copy: same painting, cold and dark, no light in the glass
  try{const c=document.createElement('canvas');c.width=LAMP.w;c.height=LAMP.h;const g=c.getContext('2d');g.drawImage(img,0,0,LAMP.w,LAMP.h);
   g.globalCompositeOperation='source-atop';g.fillStyle='rgba(14,9,6,.58)';g.fillRect(0,0,LAMP.w,LAMP.h);
   const r=g.createRadialGradient(LAMP.flame[0],LAMP.flame[1],0,LAMP.flame[0],LAMP.flame[1],LAMP.w*.42);r.addColorStop(0,'rgba(6,4,3,.85)');r.addColorStop(1,'rgba(6,4,3,0)');g.fillStyle=r;g.fillRect(0,0,LAMP.w,LAMP.h);
   return c;}catch{return null;}
 }
 const IGNITE_START=120,IGNITE_STEP=90,IGNITE_MS=240,SNUFF_AT=HANG_REVEAL+340,SNUFF_MS=560;
 const lampFlicker=new Map(),lastLit={},litCues=new Set();   // one cue per lantern per stamps event
 function flicker(key,t){ // the post lantern's flicker: a slow random walk plus two small sines
  let f=lampFlicker.get(key);if(!f){f={v:0,t:0};lampFlicker.set(key,f);}
  if(t-f.t>.03){f.v=f.v*.86+(Math.random()-.5)*.35;f.t=t;}
  return 1+.18*f.v+.08*(Math.sin(t*11+key)*.5+Math.sin(t*23.7+key)*.3);
 }
 function drawLanterns(ctx,c,x,{shown,max,e,age,now,finale,upgraded,rest}){
  const t=clock(now)/1000,LH=G.ch*.74,k=LH/LAMP.h,LW=LAMP.w*k,from=e?Math.min(3,e.from):shown,filled=e?Math.min(3,e.filled):shown;
  const completeAt=IGNITE_START+(Math.max(0,filled-from-1))*IGNITE_STEP+IGNITE_MS;
  for(let i=0;i<3;i++){
   const hx=x+G.cw*[.22,.5,.78][i],hy=G.y-4+[0,7,0][i],key=c*3+i;
   let lit=max?1:i<shown?1:0,catching=-1;
   if(e&&!reduced&&age<(upgraded?SNUFF_AT+SNUFF_MS:Infinity)){
    if(i<from)lit=1;
    else if(i<filled){const p=clamp((age-IGNITE_START-(i-from)*IGNITE_STEP)/IGNITE_MS);lit=p;if(p>0&&p<1)catching=p;
     if(p>0){const cue=event.at+':'+c+':'+i;if(!litCues.has(cue)){litCues.add(cue);onLantern({reel:c,index:i,total:filled});}}}
    else lit=0;
    if(upgraded&&age>=SNUFF_AT&&i>=rest)lit=1-clamp((age-SNUFF_AT)/SNUFF_MS);
   }
   (lastLit[c]??=[0,0,0])[i]=lit;
   const up=upgraded&&e&&!reduced&&age>completeAt&&age<SNUFF_AT?(age<HANG_REVEAL?clamp((age-completeAt)/Math.max(1,HANG_REVEAL-completeAt)):1-clamp((age-HANG_REVEAL)/(SNUFF_AT-HANG_REVEAL))):0;
   const swing=reduced?0:.03*Math.sin(t*1.25+key*1.9)+(catching>=0?.05*Math.exp(-catching*3)*Math.sin(catching*14):0);
   const fl=reduced?1:flicker(key,t),heat=lit*(1+.35*up);
   // short iron chain from the header, painted as links rather than a line
   ctx.save();ctx.translate(hx,hy-8);ctx.rotate(swing*.6);
   for(let n=0;n<3;n++){ctx.save();ctx.translate(0,n*3.6);ctx.strokeStyle='#0d0907';ctx.lineWidth=2.2;ctx.beginPath();
    if(n%2)ctx.ellipse(0,0,.9,2.3,0,0,Math.PI*2);else ctx.ellipse(0,0,2,2.3,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(120,96,70,.45)';ctx.lineWidth=.7;ctx.stroke();ctx.restore();}
   ctx.restore();
   ctx.save();ctx.translate(hx,hy);ctx.rotate(swing);
   const lx=-LAMP.pivot[0]*k,ly=-LAMP.pivot[1]*k,fx=lx+LAMP.flame[0]*k,fy=ly+LAMP.flame[1]*k;
   // warm spill under the metal, exactly as the post lantern does it, scaled to this lamp
   if(heat>0){ctx.save();ctx.globalCompositeOperation='lighter';const r=LH*1.05*fl*(.35+.65*Math.min(1,heat));let g=ctx.createRadialGradient(fx,fy,2,fx,fy,r);
    const a=Math.min(1,heat);g.addColorStop(0,finale?`rgba(255,110,60,${.3*a})`:`rgba(255,170,70,${.3*a})`);g.addColorStop(.35,finale?`rgba(220,50,30,${.12*a})`:`rgba(255,130,40,${.12*a})`);g.addColorStop(1,'rgba(255,100,20,0)');ctx.fillStyle=g;ctx.fillRect(fx-r,fy-r,r*2,r*2);ctx.restore();}
   ctx.shadowColor='#000c';ctx.shadowBlur=LH*.05;ctx.shadowOffsetY=LH*.02;
   if(lit<1&&(lampDark||lampArt)){ctx.drawImage(lampDark||lampArt,lx,ly,LW,LH);}
   if(lit>0&&lampArt){ctx.save();ctx.globalAlpha=lit;ctx.drawImage(lampArt,lx,ly,LW,LH);ctx.restore();}
   if(!lampArt){ctx.fillStyle='#1a120c';ctx.fillRect(lx+LW*.25,ly+LH*.12,LW*.5,LH*.8);}
   ctx.shadowColor='transparent';
   // the glass glows and the flame breathes; a wick that is catching starts as a small ember
   if(heat>0){ctx.save();ctx.globalCompositeOperation='lighter';const grow=catching>=0?.25+.75*catching:1,r=LH*.2*fl*grow*(1+.25*up);
    const g=ctx.createRadialGradient(fx,fy-LH*.01,0,fx,fy,r);g.addColorStop(0,finale?`rgba(255,200,150,${.7*Math.min(1,heat)})`:`rgba(255,230,150,${.7*Math.min(1,heat)})`);g.addColorStop(.4,finale?`rgba(240,70,40,${.34*Math.min(1,heat)})`:`rgba(255,160,60,${.32*Math.min(1,heat)})`);g.addColorStop(1,'rgba(255,120,30,0)');
    ctx.fillStyle=g;ctx.fillRect(fx-r,fy-r,r*2,r*2);ctx.restore();}
   // a thin curl of smoke as a wick dies
   if(upgraded&&e&&!reduced&&age>=SNUFF_AT&&age<SNUFF_AT+1200&&i>=rest){const u=(age-SNUFF_AT)/1200;ctx.save();ctx.strokeStyle=`rgba(150,140,130,${.35*(1-u)})`;ctx.lineWidth=1.2;ctx.lineCap='round';ctx.beginPath();
    for(let s=0;s<=10;s++){const v=s/10,yy=fy-LH*.15-v*LH*.55*Math.min(1,u*2),xx=fx+Math.sin(v*5+u*6+key)*LW*.12*v;s?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.restore();}
   ctx.restore();
  }
 }
 function notify(next,now){
  start=clock(now);let top='',title='',detail='';
  if(next.type==='intro'){top='12 FREE SPINS · 3 PERMANENT OUTLAWS';title='BUILD YOUR BOUNTY';detail='WIN THROUGH AN OUTLAW TO EARN STAMPS. THREE STAMPS DOUBLE ITS MULTIPLIER.';}
  if(next.type==='lock'){top='OUTLAW CAPTURED';title=`REEL ${roman[next.reel]} LOCKED`;detail='WINS THROUGH THIS OUTLAW EARN BOUNTY STAMPS';}
  if(next.type==='upgrade'){top='BOUNTY RAISED';title=`×${next.from}`;detail='MULTIPLIER DOUBLED · LOCK HOLDS';}
  if(next.type==='stamps'){const raised=next.earned.filter(e=>e.upgrade);top=raised.length>1?'BOUNTIES RAISED':'BOUNTY COMPLETE';title=raised.length===1?`×${raised[0].fromMultiplier}`:`${raised.length} OUTLAWS UPGRADED`;detail='THREE STAMPS · MULTIPLIER DOUBLED';}
  if(next.type==='finale'){top='ALL THREE OUTLAWS CAPTURED';title='THE LAST SENTENCE';detail='DOUBLE STAMPS ARE LIVE. A FOURTH OUTLAW CAN NOW JOIN FOR ONE SPIN.';}
  if(next.type==='temporary'){top='THE FOURTH OUTLAW';title='×8 EXTRA WILD';detail='ONE SPIN ONLY · STAYS THROUGH EVERY TUMBLE';}
  if(next.type==='retrigger'){top='SENTENCE EXTENDED';title=`+${next.spins} FREE SPINS`;detail=`${next.remaining} SPINS LEFT · YOUR LOCKED OUTLAWS STAY`;}
  setToast(top,title,detail);
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
    impacted=true;if(raised.length){if(raised.length===1){toast.querySelector('.st-announce-lead').textContent=`×${raised[0].toMultiplier}`;}else{toast.querySelector('.st-announce-lead').hidden=true;const t=toast.querySelector('.st-announce-title');t.hidden=false;t.textContent=`${raised.length} BOUNTIES DOUBLED`;}toast.classList.add('struck');announce(raised.map(e=>`Reel ${roman[e.reel]} multiplier doubled to ${e.toMultiplier}`).join('. '));}
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
    // Three lanterns hang over each captured Outlaw: every stamp lights one; three lit double the multiplier.
    drawLanterns(ctx,c,x,{shown,max,e,age,now,finale,upgraded:!!e?.upgrade,rest:locks[c].stamps||0});
    if(e&&age<650&&!reduced){const p=clamp(age/650);drawAnnouncement(ctx,{x:x+G.cw/2,y:G.y+G.h*.62-p*22,width:230,lead:'+'+e.gain,headline:e.gain>1?'STAMPS':'STAMP',alpha:Math.sin(p*Math.PI)});}
    if(max&&!(e&&age<HANG_REVEAL)){ctx.save();ctx.fillStyle='#160f0bdd';ctx.fillRect(x+3,G.y+G.h+3,G.cw-6,24);ctx.strokeStyle='#d6ad63';ctx.lineWidth=.7;ctx.strokeRect(x+3,G.y+G.h+3,G.cw-6,24);ctx.restore();text(ctx,'MAX ×64',x+G.cw/2,G.y+G.h+15,14,'#ffe1a4','Georgia');}
   }
   if(temporary){const x=G.x+temporary.reel*G.cw;ctx.fillStyle='#57231bed';ctx.fillRect(x+3,G.y+G.h+3,G.cw-6,24);text(ctx,'THIS SPIN',x+G.cw/2,G.y+G.h+15,13,'#ffe3ba');ctx.strokeStyle='#c57e4b';ctx.strokeRect(x+2,G.y+2,G.cw-4,G.h-4);}
   const combined=order.reduce((n,c)=>n+(this.upgradeValue(c,now)??locks[c].mult),0)+(temporary?.mult||0);
   if(mobile&&header){text(ctx,finale?'THE LAST SENTENCE':'HANG ’EM HIGH',600,-177,finale?33:39,finale?'#edb970':'#eee2c8');text(ctx,finale?'2 STAMPS PER CONTRIBUTING WIN':`${order.length} / 3 OUTLAWS · 3 STAMPS TO DOUBLE`,600,-124,22,'#d1b482','Arial');text(ctx,combined?`×${combined} COMBINED`:'CAPTURE YOUR FIRST OUTLAW',600,-77,30,'#f4dfad');text(ctx,`${remaining} SPINS LEFT · ${usd(total)} WON`,600,-29,24,'#e7ddca','Arial');}
   // No bar under the reels on desktop: the lanterns show the stamps, the spin button shows the spins left.
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
  get lanterns(){return structuredClone(lastLit);},
  get active(){return active;},get closing(){return closing;},get state(){return {active,closing,order:[...order],locks:structuredClone(locks),temporary:temporary&&{...temporary},finale,bounties:{...bounties},temporaryBounty,otherBounty,event:event&&{...event}};}
 };
}

