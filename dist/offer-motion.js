// Lightweight loops on the approved offer art; no odds, prices or game state.
export function createOfferMotion(dialog){
 const targets=new Set(),visible=new WeakSet(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}sync();},{root:dialog,threshold:.05});
 function sync(){
  const running=dialog.open&&!document.hidden&&!reduced.matches;
  for(const art of targets){
   if(!art.isConnected){observer.unobserve(art);targets.delete(art);continue;}
   const inView=dialog.dataset.view==='confirm'?!!art.closest('.shop-confirm'):!!art.closest('.shop-card');
   art.dataset.motionActive=String(running&&inView&&visible.has(art));
  }
 }
 new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open','data-view']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 return {attach(art,id){
  art.classList.add('offer-motion-art');art.dataset.offerMotion=id;art.dataset.motionActive='false';
  const fx=document.createElement('span');fx.className='offer-fx';fx.setAttribute('aria-hidden','true');
  for(const type of ['glow','glint','glint','glint']){const part=document.createElement('i');part.className='offer-'+type;fx.append(part);}
  art.append(fx);targets.add(art);observer.observe(art);queueMicrotask(sync);
 }};
}
