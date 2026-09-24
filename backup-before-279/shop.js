// The crow's offers: three enhanced spins (a cost per spin, one active at a time) and three
// feature buys (a one-time price, charged and started on the Buy press; no confirmation step). Everything player-facing
// comes from CATALOG; game.js owns credits, the active mode and what each purchase runs.
import {SPIN_COST,BUY_COST,BOUNTY_FEATURE_MULTIPLIER} from './math.js?v=23';
import {createHangOfferArt} from './hang-offer.js?v=2';
import {createHellOfferMotion} from './hell-offer.js?v=2';
import {createOfferMotion} from './offer-motion.js?v=2';
export const CATALOG={
 enhancers:[
  // Real: the configured booster (dist/math.js SPIN_COST.boost) — scatters land more often, spins cost more.
  {id:'booster',title:'BOUNTY BOOSTER',art:'assets/scatters/condemned.png',costMult:SPIN_COST.boost,ready:true,note:`${BOUNTY_FEATURE_MULTIPLIER}× the base-spin chance of triggering a bonus.`},
  // Shared calibrated costs; game.js resolves the selected outcome.
  {id:'outlaw',title:'TRICKSTER SPINS',art:'assets/shop/outlaw-spin.webp',costMult:SPIN_COST.trickster,ready:true,note:'Paying positions double each tumble.'},
  // Shared All In mode settings; mechanics are resolved by math.js.
  {id:'allin',title:'ALL IN SPINS',art:'assets/shop/all-in-spin.webp',costMult:SPIN_COST.allin,ready:true,note:'50× Win Boost. Outlaw’s Mark can turn all matching marked symbols wild.'}
 ],
 buys:[
  // One shared price and calibrated complete-round model per buy.
  {id:'dead',title:'BLOOD MONEY',art:'assets/shop/blood-money-ink.webp',priceMult:BUY_COST.dead,summary:'8 FREE SPINS',feature:'8 SPINS · +2 PER UPGRADE · 1×–4× WINS'},
  {id:'deader',title:'HANG \u2019EM HIGH',art:'assets/shop/hang-em-high-print.png',priceMult:BUY_COST.deader,summary:'12 FREE SPINS · STICKY WILDS',feature:'12 FREE SPINS · 3 STICKY OUTLAWS · BOUNTY STAMPS · FOURTH WILD CHANCE'},
  {id:'outlaws',title:'HELL TO PAY',art:'assets/shop/hell-to-pay-woodcut.png',priceMult:BUY_COST.outlaws,summary:'START WITH 3 WILD REELS',feature:'START WITH 3 FULL-REEL OUTLAW WILDS · ONE TUMBLE ROUND'}
 ]
};
export function createShop({dialog,money,getBet,changeBet,getBalance,getActive,onActivate,onPurchase,isBusy,setStatus}){
 const $=s=>dialog.querySelector(s);
 const hellMotion=createHellOfferMotion(dialog);
 const offerMotion=createOfferMotion(dialog);
 const hangIllustration=createHangOfferArt(dialog);
 let pending=null,committing=false,initialized=false;
 const cents=v=>Math.round(v*100)/100;
 const price=item=>cents(getBet()*(item.costMult??item.priceMult));
 // The approved illustrations stay intact; the feature art and trigger count
 // have independent layout so the small baked-in scatter rows never become illegible.
 const regions={booster:[385,293,139,145],outlaw:[690,289,182,159],allin:[1017,289,194,166],dead:[329,629,254,122],deader:[674,628,231,124],outlaws:[969,628,283,133]};
 function illustration(id){
  if(id==='dead'){
   const print=document.createElement('div');print.className='card-art standalone-art blood-ink';print.style.setProperty('--art-ratio','1.5');print.style.setProperty('--art-width','190px');
   const img=document.createElement('img');img.src='assets/shop/blood-money-ink.webp';img.alt='';img.draggable=false;print.append(img);offerMotion.attach(print,id);return print;
  }
  if(id==='deader'){
   return hangIllustration();
  }
  const [x,y,w,h]=regions[id],print=document.createElement('div');print.className='card-art';
  print.style.setProperty('--art-ratio',w/h);print.style.setProperty('--art-width',`${w/h*112}px`);
  const img=document.createElement('img');img.src='assets/shop/trickster-buy-menu.png';img.alt='';img.draggable=false;
  img.style.cssText=`width:${1565/w*100}%;height:${1005/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%`;
  print.append(img);
  if(id==='booster'){print.classList.add('booster-art');const crop=document.createElement('span');crop.className='scatter-window';crop.append(img);print.prepend(crop);const badge=document.createElement('strong');badge.className='scatter-boost';badge.dataset.multiplier=String(BOUNTY_FEATURE_MULTIPLIER);const number=document.createElement('span');number.className='scatter-boost-number';number.textContent=String(BOUNTY_FEATURE_MULTIPLIER);const times=document.createElement('span');times.className='scatter-boost-times';times.textContent='×';badge.append(number,times);print.append(badge);}
  if(id==='outlaws'){print.classList.add('hell-offer-art');hellMotion.attach(print);}
  else offerMotion.attach(print,id);
  return print;
 }
 function card(item,kind){
  const el=document.createElement('article');el.className='shop-card printed-card'+(item.ready===false?' soon':'')+' '+(kind==='enhancer'?{booster:'bounty-booster-card',outlaw:'double-cross-card',allin:'all-in-card'}:{dead:'blood-money-card',deader:'hang-em-card',outlaws:'hell-to-pay-card'})[item.id];el.dataset.id=item.id;el.dataset.kind=kind;
  const detail=kind==='buy'?(item.id==='deader'?'12 FREE SPINS':item.summary):item.id==='booster'?`${BOUNTY_FEATURE_MULTIPLIER}× BONUS CHANCE`:item.id==='outlaw'?'DOUBLING MULTIPLIERS':'50× WIN BOOST';
  el.style.setProperty('--offer-order',kind==='buy'?CATALOG.buys.indexOf(item)+3:CATALOG.enhancers.indexOf(item));
  el.innerHTML=`<div class="card-heading"><h4>${item.title}</h4><p class="card-detail">${detail}</p></div><div class="card-visual"><div class="art-stage" aria-hidden="true"></div></div><div class="purchase-line"><strong class="price"></strong><span class="price-unit">${kind==='buy'?item.priceMult+'× BASE BET':'PER SPIN'}</span></div><button type="button" class="${kind==='buy'?'buy':''}"></button>`;
  el.querySelector('.art-stage').append(illustration(item.id));
  if(kind==='buy'){
   const count={dead:3,deader:4,outlaws:5}[item.id],trigger=document.createElement('span');trigger.className='card-trigger';
   trigger.innerHTML=`<span class="trigger-symbol" aria-hidden="true"></span><span><b>${count}</b> SCATTERS</span>`;
   trigger.setAttribute('aria-label',`${count} scatters trigger this feature`);
   el.querySelector('.card-visual').append(trigger);
  }
  el.title=kind==='buy'?item.feature+' · '+item.priceMult+'× base bet':item.note;
  const btn=el.querySelector('button');
  if(item.ready===false){btn.disabled=true;btn.textContent='COMING SOON';btn.setAttribute('aria-disabled','true');return el;}
  btn.addEventListener('click',()=>{
   if(isBusy()){setStatus('Finish the current spin first.');return;}
   if(kind==='enhancer'){onActivate(item.id,getActive()!==item.id);refresh();}
   else buyNow(item,btn);
  });
  return el;
 }
 function render(){
  if(initialized){refresh();return;}initialized=true;
  $('#shop-modes').replaceChildren(...CATALOG.enhancers.map(i=>card(i,'enhancer')));
  $('#shop-buys').replaceChildren(...CATALOG.buys.map(i=>card(i,'buy')));
  $('#shop-bet-down').addEventListener('click',()=>{changeBet(-1);refresh();});
  $('#shop-bet-up').addEventListener('click',()=>{changeBet(1);refresh();});
  $('#close-shop').addEventListener('click',close);
  $('#confirm-cancel').addEventListener('click',()=>{const id=pending?.id;pending=null;dialog.dataset.view='grid';refresh();if(id)dialog.querySelector(`.shop-card[data-id="${id}"] button`).focus();});
  $('#confirm-buy').addEventListener('click',commit);
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  dialog.addEventListener('close',()=>{pending=null;committing=false;dialog.dataset.view='grid';});
  refresh();
 }
 function refresh(){
  const bet=getBet(),active=getActive();
  $('#shop-bet').textContent=money(bet);
  for(const el of dialog.querySelectorAll('.shop-card')){
   const kind=el.dataset.kind,item=(kind==='enhancer'?CATALOG.enhancers:CATALOG.buys).find(i=>i.id===el.dataset.id);
   el.querySelector('.price').textContent=money(price(item));
   const btn=el.querySelector('button');
   if(item.ready===false)continue;
   if(kind==='enhancer'){const on=active===item.id;el.classList.toggle('active',on);btn.textContent=on?'ACTIVATED':'ACTIVATE';el.querySelector('.price-unit').textContent=on?'PER SPIN · ACTIVE':'PER SPIN';btn.setAttribute('aria-pressed',String(on));}
   else btn.textContent='BUY FEATURE';
   btn.setAttribute('aria-label',`${kind==='enhancer'?(active===item.id?'Activated':'Activate'):'Buy'} ${item.title} · ${money(price(item))}${kind==='enhancer'?' per spin':''}`);
  }
  if(pending)fillConfirm();
 }
 // One press buys: charge, close the shop and start the feature. Short balance is reported on the card without opening anything.
 function buyNow(item,btn){
  if(committing)return;const cost=price(item),balance=getBalance();
  if(balance<cost){setStatus(`Not enough credits for ${item.title}: ${money(cost)} needed, balance ${money(balance)}.`);btn.classList.add('short');setTimeout(()=>btn.classList.remove('short'),900);return;}
  committing=true;btn.disabled=true;          // one purchase per press, no double-clicks
  const ok=onPurchase(item.id,cost);
  committing=false;btn.disabled=false;
  if(ok)close();else refresh();
 }
 function showConfirm(item){pending=item;committing=false;dialog.dataset.view='confirm';dialog.scrollTop=0;fillConfirm();$('#confirm-buy').focus();}
 function fillConfirm(){
  const item=pending,cost=price(item),balance=getBalance(),short=balance<cost;
  $('#confirm-title').textContent=item.title;$('#confirm-art').replaceChildren(illustration(item.id));$('#confirm-feature').textContent=item.feature;
  $('#confirm-price').textContent=money(cost);
  const bal=$('#confirm-balance');bal.classList.toggle('short',short);
  bal.textContent=short?`NOT ENOUGH CREDITS · BALANCE ${money(balance)}`:`BALANCE ${money(balance)} → ${money(cents(balance-cost))}`;
  $('#confirm-buy').disabled=short||committing;
 }
 function commit(){
  if(!pending||committing)return;
  const item=pending,cost=price(item);
  if(isBusy()){setStatus('Finish the current spin first.');return;}
  if(getBalance()<cost){fillConfirm();return;}
  committing=true;$('#confirm-buy').disabled=true;          // one purchase per confirmation, no double-clicks
  const ok=onPurchase(item.id,cost);
  if(ok){pending=null;close();}else{committing=false;fillConfirm();}
 }
 function open(){pending=null;committing=false;dialog.dataset.view='grid';if(!dialog.open)dialog.showModal();refresh();requestAnimationFrame(()=>{dialog.scrollTop=0;$('#close-shop').focus({preventScroll:true});});}
 function close(){if(dialog.open)dialog.close();}
 return {render,refresh,open,close};
}
