// Presentation only. Uses the game's existing render clock; no timers, canvases,
// outcome selection, or added delays. At most 16 short-lived accents are retained.
export function createActionFeedback({G,reduced=false}={}){
 let events=[],pausedAt=null,pausedMs=0,lastShot=-Infinity;
 const clock=now=>(pausedAt??now)-pausedMs;
 function add(type,data,now){const at=clock(now);events=events.filter(e=>at-e.at<e.duration);if(events.length>=16)events.shift();events.push({type,...data,at,duration:type==='shot'?150:type==='retrigger'?850:520});}
 function rim(ctx,x,y,w,h,alpha,width=2){ctx.strokeStyle=`rgba(229,183,91,${alpha})`;ctx.lineWidth=width;ctx.strokeRect(x+3,y+3,w-6,h-6);}
 return {
  shot(cell,now=performance.now()){const t=clock(now);if(t-lastShot<160)return;lastShot=t;add('shot',{cell:[...cell]},now);},
  land(reel,now=performance.now()){add('land',{reel},now);},
  upgrade(reel,now=performance.now()){add('upgrade',{reel},now);},
  retrigger(cells,now=performance.now()){add('retrigger',{cells:cells.map(p=>[...p])},now);},
  setPaused(value,now=performance.now()){if(value&&pausedAt===null)pausedAt=now;else if(!value&&pausedAt!==null){pausedMs+=now-pausedAt;pausedAt=null;}},
  clear(){events=[];lastShot=-Infinity;},
  get count(){return events.length;},
  draw(ctx,now=performance.now(),{width=1212,top=0,height=608}={}){
   if(!events.length)return;
   const t=clock(now);for(let i=events.length-1;i>=0;i--)if(t-events[i].at>=events[i].duration)events.splice(i,1);
   if(!events.length)return;
   ctx.save();
   // Coalesce simultaneous shots: the full-scene tint never stacks.
   if(!reduced){let shot;for(let i=events.length-1;i>=0;i--)if(events[i].type==='shot'){shot=events[i];break;}if(shot){const p=(t-shot.at)/shot.duration;if(p>=0&&p<1){const age=t-shot.at,flash=.34*(1-Math.min(1,Math.max(0,age-18)/90))**2;
    // One bright powder flash on the firing frame, then a short warm afterglow.
    // Covers the whole game scene, including portrait sky and the ground rail.
    if(flash>0){ctx.fillStyle=`rgba(255,244,220,${flash})`;ctx.fillRect(0,-top,width,height+top);}
    ctx.fillStyle=`rgba(255,184,75,${.055*(1-p)**2})`;ctx.fillRect(0,-top,width,height+top);}}}
   for(const e of events){
    const age=t-e.at,p=age/e.duration;if(p<0)continue;const fade=(1-p)**2;
    if(e.type==='shot'){
     if(reduced)continue;
     const x=G.x-24,y=G.y+G.h*.62,g=ctx.createRadialGradient(x,y,0,x,y,G.ch*1.65);
     g.addColorStop(0,`rgba(255,198,102,${.24*fade})`);g.addColorStop(1,'rgba(255,174,65,0)');
     ctx.fillStyle=g;ctx.fillRect(x-G.ch*1.65,y-G.ch*1.65,G.ch*3.3,G.ch*3.3);
    }else if(e.type==='land'||e.type==='upgrade'){
     const x=G.x+e.reel*G.cw,y=G.y;
     rim(ctx,x,y,G.cw,G.h,(reduced?.32:.65)*fade);
     if(!reduced){
      const bottom=y+G.h,g=ctx.createRadialGradient(x+G.cw/2,bottom,0,x+G.cw/2,bottom,G.cw*.66);
      g.addColorStop(0,`rgba(240,192,102,${.24*fade})`);g.addColorStop(1,'rgba(240,192,102,0)');
      ctx.fillStyle=g;ctx.fillRect(x-8,bottom-G.cw*.66,G.cw+16,G.cw*.9);
      if(e.type==='land')for(let i=0;i<8;i++){const side=i%2?-1:1,dx=side*(9+(i%4)*7+p*(22+i*3)),dy=-Math.sin(p*Math.PI)*(7+i%3*5);ctx.fillStyle=`rgba(173,139,93,${.48*fade})`;ctx.fillRect(x+G.cw/2+dx,bottom+dy,2+i%2,2);}
     }
    }else if(e.type==='retrigger'){
     for(const [c,r] of e.cells)rim(ctx,G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch,(reduced?.4:.8)*(1-p),2.5);
    }
   }
   ctx.restore();
  }
 };
}
