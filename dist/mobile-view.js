// View geometry only. The 1212×608 game world, outcomes and clocks never change.
export const MOBILE_VIEW={worldWidth:1212,worldHeight:608,portraitX:0,portraitWidth:1212,portraitHeader:120,railWidth:156};
export function mobileLayout({width,height,safe={},headerHeight=120}){
 const pad={left:Math.max(8,safe.left||0),right:Math.max(8,safe.right||0),top:Math.max(8,safe.top||0),bottom:Math.max(8,safe.bottom||0)};
 const availableWidth=Math.max(0,width-pad.left-pad.right),availableHeight=Math.max(0,height-pad.top-pad.bottom);
 const portrait=width<=900&&height>width,landscape=!portrait&&height<=600;
 let boardWidth,header=0,hudHeight=0,sceneWidth,sceneX=0,shellWidth,shellHeight,layout,groundHeight;
 if(portrait){
  layout='portrait';sceneWidth=1212;sceneX=0;header=headerHeight;
  // Allocate the touch controls in CSS pixels, independent of world scaling.
  // Keep the reels legible on short embedded views; allow vertical scrolling
  // instead of shrinking the entire game and its text below usable sizes.
  const controls=196,minBoard=Math.min(320,availableWidth);
  boardWidth=Math.min(640,availableWidth,Math.max(minBoard,(availableHeight-24-controls)*sceneWidth/(608+header)));
  groundHeight=controls*sceneWidth/Math.max(1,boardWidth);
  shellWidth=boardWidth;shellHeight=24+boardWidth*(608+header)/sceneWidth+controls;
 }else{
  layout=landscape?'landscape':'desktop';sceneWidth=1212;groundHeight=140;
  const top=landscape?0:24;
  boardWidth=Math.max(0,Math.min(1560,availableWidth-(landscape?208:0),(availableHeight-top)*1212/(608+groundHeight)));
  shellWidth=boardWidth+(landscape?208:0);shellHeight=top+boardWidth*(608+groundHeight)/1212;
 }

 return {layout,pad,boardWidth,shellWidth,shellHeight,sceneWidth,sceneX,header,hudHeight,groundHeight,availableHeight};
}
// Phone canvases need at most two device pixels per displayed pixel. The
// desktop branch remains identical, including high-density large displays.
export function canvasScale(displayWidth,dpr=1,coarse=false,mobile=false){return mobile?Math.max(.5,Math.min(1,displayWidth/1212*Math.min(2,dpr))):Math.max(.65,Math.min(coarse?2:2.5,displayWidth/1212*dpr));}
export function createMobileView({main,layoutElement,buttons=[],document:doc=document,window:win=window,onResize=()=>{},onStatus=()=>{}}){
 let current=null,queued=0,expanded=false,pending=false,tapLock=false,destroyed=false,scrollY=0;
 const root=doc.documentElement,probe=doc.createElement('div');probe.className='safe-area-probe';probe.setAttribute('aria-hidden','true');main.appendChild(probe);
 const listen=(target,name,fn,options)=>{target?.addEventListener?.(name,fn,options);return ()=>target?.removeEventListener?.(name,fn,options);},off=[];
 const fullscreen=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
 function updateButtons(){const active=!!fullscreen()||expanded;for(const b of buttons){b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Exit full screen view':'Enter full screen view');b.title=active?'Exit full screen view':'Full screen';if(b.id==='fullscreen')b.textContent=active?'⛶ EXIT FULLSCREEN':'⛶ FULLSCREEN';}main.classList.toggle('is-expanded',expanded);root.classList.toggle('slot-expanded',expanded);}
 function measure(){
  queued=0;tapLock=false;if(destroyed)return;
  const vv=win.visualViewport,zoomed=vv&&vv.scale>1.01;
  const width=zoomed?win.innerWidth:(vv?.width||win.innerWidth),height=zoomed?win.innerHeight:(vv?.height||win.innerHeight);
  const css=win.getComputedStyle?.(probe),safe={};for(const k of ['left','right','top','bottom'])safe[k]=parseFloat(css?.['padding'+k[0].toUpperCase()+k.slice(1)])||0;
  current=mobileLayout({width,height,safe,headerHeight:Number(main.dataset.sceneHeader)||120});main.dataset.layout=current.layout;
  main.style.setProperty('--view-height',height+'px');main.style.setProperty('--shell-width',current.shellWidth+'px');main.style.setProperty('--board-width',current.boardWidth+'px');
  main.style.setProperty('--scene-width',(1212/current.sceneWidth*100)+'%');main.style.setProperty('--scene-left',(-current.sceneX/current.sceneWidth*100)+'%');
  main.style.setProperty('--view-aspect',current.sceneWidth+'/608');
  main.style.setProperty('--ground-height',current.boardWidth*current.groundHeight/current.sceneWidth+'px');
  main.style.setProperty('--hero-height',current.header?current.boardWidth*current.header/current.sceneWidth+'px':'0px');
  updateButtons();onResize(current);
 }
 function schedule(){if(!destroyed&&!queued)queued=win.requestAnimationFrame(measure);}
 function enterExpanded(){scrollY=win.scrollY||0;expanded=true;updateButtons();schedule();onStatus('Expanded game view. Use the fullscreen button to leave.');}
 async function toggle(){
  if(pending||tapLock||destroyed)return;pending=true;tapLock=true;
  const menu=doc.querySelector?.('#features');if(menu?.open)menu.close();
  try{
   if(fullscreen()){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(exit)await exit.call(doc);}
   else if(expanded){expanded=false;updateButtons();win.scrollTo?.({top:scrollY,behavior:'instant'});}
   else{
    const request=main.requestFullscreen||main.webkitRequestFullscreen;
    if(request&&doc.fullscreenEnabled!==false){
     try{await request.call(main,{navigationUI:'hide'});if(!fullscreen())enterExpanded();}
     catch{enterExpanded();}
    }else enterExpanded();
   }
  }finally{pending=false;updateButtons();schedule();}
 }
 const change=()=>{if(fullscreen())expanded=false;updateButtons();schedule();};
 const escape=e=>{if(e.key==='Escape'&&expanded&&!doc.querySelector?.('dialog[open]')){expanded=false;updateButtons();schedule();win.scrollTo?.({top:scrollY,behavior:'instant'});}};
 for(const b of buttons)off.push(listen(b,'click',toggle));
 off.push(listen(win,'resize',schedule),listen(win,'orientationchange',schedule),listen(win,'pageshow',schedule),listen(win.visualViewport,'resize',schedule),listen(doc,'fullscreenchange',change),listen(doc,'webkitfullscreenchange',change),listen(doc,'keydown',escape));
 let observer=null;if(win.ResizeObserver){observer=new win.ResizeObserver(schedule);observer.observe(layoutElement);}
 measure();
 return {toggle,measure,get layout(){return current;},get expanded(){return expanded;},destroy(){destroyed=true;off.forEach(f=>f());observer?.disconnect();if(queued)win.cancelAnimationFrame(queued);queued=0;probe.remove();expanded=false;updateButtons();}};
}
