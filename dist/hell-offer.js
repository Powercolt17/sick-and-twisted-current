// The approved painted rider stays fixed. Existing hand-painted fire sprites
// animate at the edges, behind the silhouette. Work stops outside the menu.
const CROP={x:969,y:628,w:283,h:133};
const FLAMES=[
 {x:.015,y:.13,w:.19,h:.83,phase:0},
 {x:.13,y:.03,w:.18,h:.82,phase:3.7},
 {x:.73,y:.05,w:.17,h:.87,phase:6.4},
 {x:.85,y:.12,w:.16,h:.82,phase:9.1}
];
const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});

export function createHellOfferMotion(dialog){
 const targets=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let assets,loading,raf=0,last=-Infinity;
 const visible=canvas=>canvas.isConnected&&(dialog.dataset.view==='confirm'?!!canvas.closest('.shop-confirm'):!!canvas.closest('.shop-card'));
 function draw(canvas,now){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,[base,fire]=assets;
  ctx.clearRect(0,0,W,H);ctx.drawImage(base,CROP.x,CROP.y,CROP.w,CROP.h,0,0,W,H);
  if(reduced.matches)return;
  const t=now/1000,fw=fire.width/4,fh=fire.height/3;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const f of FLAMES){
   // Blend neighbouring painted frames, avoiding sprite pops and bright flashes.
   const position=(t*6.5+f.phase)%12,index=Math.floor(position),blend=position-index;
   const level=.24+.03*Math.sin(t*1.7+f.phase);
   for(const [frame,weight] of [[index,1-blend],[(index+1)%12,blend]]){
    ctx.globalAlpha=level*weight;
    ctx.drawImage(fire,(frame%4)*fw,Math.floor(frame/4)*fh,fw,fh,f.x*W,f.y*H,f.w*W,f.h*H);
   }
  }
  ctx.restore();
 }
 function stop(){cancelAnimationFrame(raf);raf=0;last=-Infinity;dialog.dataset.hellMotion='paused';}
 function frame(now){
  if(!dialog.open||document.hidden||reduced.matches){stop();return;}
  const active=[...targets].filter(visible);
  if(!active.length){stop();return;}
  if(now-last>=1000/24){for(const canvas of active)draw(canvas,now);last=now;}
  raf=requestAnimationFrame(frame);
 }
 function sync(){
  for(const canvas of targets)if(!canvas.isConnected)targets.delete(canvas);
  stop();
  if(!dialog.open||document.hidden||![...targets].some(visible))return;
  if(!assets){
   loading??=Promise.all([loadImage('assets/shop/trickster-buy-menu.png'),loadImage('assets/hell-to-pay/ink-fire-atlas.png')])
    .then(images=>{assets=images;sync();}).catch(()=>{dialog.dataset.hellMotion='poster';});
   return;
  }
  for(const canvas of targets)if(visible(canvas)){draw(canvas,performance.now());canvas.classList.add('ready');}
  if(reduced.matches){dialog.dataset.hellMotion='reduced';return;}
  dialog.dataset.hellMotion='playing';raf=requestAnimationFrame(frame);
 }
 new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open','data-view']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 return {attach(container){
  const canvas=document.createElement('canvas');canvas.width=566;canvas.height=266;
  canvas.className='hell-offer-motion';canvas.setAttribute('aria-hidden','true');
  container.append(canvas);targets.add(canvas);queueMicrotask(sync);
 }};
}
