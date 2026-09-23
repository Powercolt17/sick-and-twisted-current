import {sceneWind,gunslingerIdle} from './scene-motion.js?v=1';
// Presentation only. The caller supplies a confirmed bonus and its FULL scatter list.
// One count drives the figure, muzzle flashes, glass, audio and feature handoff.
import {GUNSLINGER,gunslingerTimeline,gunslingerPose} from './gunslinger-motion.js?v=2';
export const smooth = x => { x=Math.max(0,Math.min(1,x)); return x*x*x*(10+x*(-15+6*x)); };
export function screenTimeline(cells) {
  if(!Array.isArray(cells))throw new TypeError('Expected scatter cells');
  const seen=new Set();
  const targets=cells.map(cell=>{
    if(!Array.isArray(cell)||cell.length!==2||!cell.every(Number.isInteger))throw new TypeError('Invalid scatter cell');
    const key=cell.join(':');if(seen.has(key))throw new Error('Duplicate scatter cell');seen.add(key);return [...cell];
  });
  const motion=gunslingerTimeline(targets),{shots}=motion;
  const last=shots.at(-1)??0;
  return {...motion,breakAt:shots.length?last+.105:0,
    handoff:shots.length?motion.end:0,end:shots.length?motion.end+.46:0};
}

function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function createScreenShootout({W=1212,H=608,reduced=false,makeCanvas=()=>document.createElement('canvas'),getAmbientTime=null}={}){
  const assets={json:null,sheets:[],glass:null,failed:false,loading:null};
  let run=null,plate=null,shards=[],lightCanvas=null,glassShade=null,handFrames=null;
  const getImage=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
  async function load({figure=true}={}){
    if(assets.loading)return assets.loading;
    assets.loading=(async()=>{
      const res=await fetch('assets/screen-shootout/screen-shootout.json?v=48');
      if(!res.ok)throw new Error('Screen shootout asset unavailable');
      const j=await res.json();
      const images=figure?await Promise.all([...Array(j.sheets)].map((_,i)=>getImage(`assets/faithful-character/figure-${i}.webp`))):[];
      const glass=await getImage('assets/screen-shootout/glass.webp?v=43');
      Object.assign(assets,{json:j,sheets:images,glass});
      if(figure&&!reduced)restingHand(0); // Prepare the tiny patch cache before desktop play.
    })().catch(e=>{assets.failed=true;console.warn('Screen shootout artwork unavailable',e);});
    return assets.loading;
  }
  async function loadFigure(){
    await load({figure:false});
    if(assets.sheets.length||!assets.json)return;
    if(!assets.figureLoading)assets.figureLoading=Promise.all([...Array(assets.json.sheets)].map((_,i)=>getImage(`assets/faithful-character/figure-${i}.webp`))).then(images=>{assets.sheets=images;if(!reduced)restingHand(0);});
    await assets.figureLoading;
  }
  // Also used by the offline renderer with the identical atlas and draw code.
  function setAssets(json,sheets,glass){Object.assign(assets,{json,sheets,glass,failed:false});glassShade=null;handFrames=null;}
  function start(cells){
    run=screenTimeline(cells);plate=null;
    const spots=[[.59,.28],[.78,.63],[.39,.69],[.84,.30],[.33,.26],[.70,.79]];
    run.impacts=run.shots.map((_,i)=>{
      const pos=i===run.shots.length-1?[.54,.49]:spots[i%spots.length];
      const rand=rng(907+i*9151);
      return {x:pos[0]*W,y:pos[1]*H,angle:(rand()-.5)*1.8,
        size:(i===run.shots.length-1?565:365+rand()*40),
        flecks:Array.from({length:12},()=>{const a=rand()*Math.PI*2,v=90+rand()*410;return {vx:Math.cos(a)*v,vy:Math.sin(a)*v-95,r:1+rand()*3.2,spin:(rand()-.5)*14,life:.14+rand()*.28};})};
    });
    // Radial fracture topology: small splinters at the final penetration,
    // longer pieces toward the perimeter. No regular screen-sized tile grid.
    const rand=rng(271991),rings=[],N=23,center=[W*.54,H*.49];
    const angles=Array.from({length:N},(_,i)=>(i+(rand()-.5)*.42)*Math.PI*2/N);
    for(const radius of [0,30,78,153,270,430,680,1100]){
      rings.push(angles.map(a=>{const r=radius*(.90+rand()*.20);return [center[0]+Math.cos(a)*r,center[1]+Math.sin(a)*r];}));
    }
    shards=[];
    for(let ring=0;ring<rings.length-1;ring++)for(let i=0;i<N;i++){
      const a=rings[ring][i],b=rings[ring][(i+1)%N],c=rings[ring+1][i],d=rings[ring+1][(i+1)%N];
      for(const poly of ring===0?[[a,c,d]]:(ring+i)%2?[[a,b,c],[b,d,c]]:[[a,b,d],[a,d,c]]){
        const cx=poly.reduce((s,p)=>s+p[0],0)/3,cy=poly.reduce((s,p)=>s+p[1],0)/3;
        if(poly.every(p=>p[0]<0)||poly.every(p=>p[0]>W)||poly.every(p=>p[1]<0)||poly.every(p=>p[1]>H))continue;
        const dx=cx-W*.54,dy=cy-H*.49,dist=Math.hypot(dx,dy)||1;
        const x0=Math.min(...poly.map(p=>p[0])),y0=Math.min(...poly.map(p=>p[1])),width=Math.max(...poly.map(p=>p[0]))-x0,height=Math.max(...poly.map(p=>p[1]))-y0;
        shards.push({poly,cx,cy,x0,y0,width,height,vx:dx/dist*(180+rand()*430),vy:dy/dist*(130+rand()*270)-110,
          spin:(rand()-.5)*7,delay:dist/14000,life:.30+rand()*.34,tilt:rand()*7+2.2,glint:rand()*Math.PI*2});
      }
    }
    return run;
  }
  function frameIndex(t){
    const j=assets.json;if(!j||!run)return -1;
    const C=j.clips;
    if(C.recoil.amplitude){
      const pose=gunslingerPose(t,run);
      if(pose.kick>0)return C.recoil.start+Math.round(pose.kick*(C.recoil.count-1));
      if(pose.draw<1)return C.draw.start+Math.round(pose.draw*(C.draw.count-1));
      return C.aim.start;
    }
    const lowerAt=(run.shots.at(-1)??0)+(run.lowerDelay??.42),drawDuration=run.drawDuration??C.draw.duration;
    if(t>lowerAt)return C.draw.start+Math.round((C.draw.count-1)*(1-smooth((t-lowerAt)/(run.lowerDuration??.66))));
    if(t<drawDuration)return C.draw.start+Math.min(C.draw.count-1,Math.floor(Math.max(0,t)/drawDuration*(C.draw.count-1)));
    for(let i=run.shots.length-1;i>=0;i--){
      const age=t-run.shots[i],dur=run.recoilDuration??(i===run.shots.length-1?.28:.17);
      if(age>=0&&age<dur){
        // Keep the original peak drawing visible long enough to read at
        // 30/60 fps too: sharp 27 ms attack, brief peak, controlled recovery.
        if(run.cellRecoil){const frame=age<.027?4*smooth(age/.027):age<.044?4+2*(age-.027)/.017:6+(C.recoil.count-7)*smooth((age-.044)/(dur-.044));return C.recoil.start+Math.min(C.recoil.count-1,Math.round(frame));}
        return C.recoil.start+Math.min(C.recoil.count-1,Math.floor(age/dur*(C.recoil.count-1)));
      }
    }
    return C.aim.start;
  }
  // This exact first drawing is also the resting character. There is no
  // replacement silhouette, scale change or dissolve when a bonus begins.
  // A tiny wrist lift on the resting grip, followed by a softer second tap.
  // Unequal pauses keep the anticipation from becoming a constant bob.
  function handTension(now){
    const t=((now/1000)%12.8+12.8)%12.8;
    let lift=0;
    for(const [at,duration,strength] of [[.70,.38,1],[1.16,.30,.52],[4.65,.44,.83],[8.55,.36,.96],[8.99,.28,.46]]){
      const u=(t-at)/duration;if(u>0&&u<1)lift+=strength*Math.sin(Math.PI*u)**2;
    }
    return Math.round(lift*32)/32;
  }
  const handBox={x:13,y:170,w:61,h:81};
  function restingHand(lift){
    if(!handFrames){
      const j=assets.json,f=j.frames[j.clips.draw.start],{x,y,w,h}=handBox;
      const c=makeCanvas();c.width=w;c.height=h;const cc=c.getContext('2d');
      cc.drawImage(assets.sheets[f.sheet],f.x+x,f.y+y,w,h,0,0,w,h);
      const source=cc.getImageData(0,0,w,h).data;
      handFrames=Array.from({length:33},(_,frame)=>{
        const out=makeCanvas();out.width=w;out.height=h;const oc=out.getContext('2d'),pixels=oc.createImageData(w,h);
        const amount=frame/32*3.7;
        // Borders and holster lip stay pinned. Only the wrist/hand region
        // moves; the silhouette and ink come from the existing drawing.
        for(let row=0;row<h;row++)for(let col=0;col<w;col++){
          const envelope=Math.sin(Math.PI*col/(w-1))**4;
          const falloff=v=>Math.sin(Math.PI*Math.max(0,Math.min(1,v/(h-1))))**2;
          let sy=row;for(let n=0;n<3;n++)sy=row+amount*envelope*falloff(sy);
          const y0=Math.min(h-1,Math.floor(sy)),y1=Math.min(h-1,y0+1),a=sy-y0;
          const p0=(y0*w+col)*4,p1=(y1*w+col)*4,d=(row*w+col)*4;
          const alpha=source[p0+3]*(1-a)+source[p1+3]*a;
          for(let ch=0;ch<3;ch++)pixels.data[d+ch]=alpha?(source[p0+ch]*source[p0+3]*(1-a)+source[p1+ch]*source[p1+3]*a)/alpha:0;
          pixels.data[d+3]=alpha;
        }
        oc.putImageData(pixels,0,0);return out;
      });
    }
    return handFrames[Math.min(32,Math.round(lift*32))];
  }
  function drawClothed(ctx,k,now,animate,handLift=0,follow=0){
    const j=assets.json,f=j.frames[k],p=j.placement,im=assets.sheets[f.sheet];
    if(!animate||reduced){ctx.drawImage(im,f.x,f.y,j.width,j.height,p.x,p.y,p.width,p.height);return;}
    const x=188,y=130,h=258,w=j.width-x,t=now/1000;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.width/j.width,p.height/j.height);
    // Keep the torso, hand and boots intact; only the free outer poncho moves.
    ctx.save();
    if(handLift>0){ctx.beginPath();ctx.rect(-32,-32,j.width+64,j.height+64);ctx.rect(handBox.x,handBox.y,handBox.w,handBox.h);ctx.clip('evenodd');}
    ctx.beginPath();ctx.rect(0,0,j.width,j.height);ctx.rect(x,y,w,h);ctx.clip('evenodd');
    ctx.drawImage(im,f.x,f.y,j.width,j.height,0,0,j.width,j.height);ctx.restore();
    // Continuous row deformation: the inner seam is pinned, the hem follows
    // a slower gust with a smaller travelling ripple. No moving tile edges.
    for(let row=0;row<h;row+=2){
      const v=row/h,envelope=Math.sin(Math.PI*v),gust=.65*sceneWind(t-v*.8)+.35*Math.sin(t*3.9-v*6.2);
      const shift=envelope*(18*gust+follow*Math.sin(Math.PI*v));
      ctx.drawImage(im,f.x+x,f.y+y+row,w,2,x,y+row,w+shift,2);
    }
    if(handLift>0)ctx.drawImage(restingHand(handLift),handBox.x,handBox.y);
    ctx.restore();
  }
  function cigarette(ctx,k,now,animate){
    const j=assets.json,p=j.placement,m=j.mouths?.[k]||[113,67],t=now/1000,live=animate&&!reduced;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.width/j.width,p.height/j.height);
    const x=m[0],y=m[1],tx=x+21,ty=y-4;
    ctx.lineCap='round';ctx.lineWidth=3.7;ctx.strokeStyle='#20140e';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
    ctx.lineWidth=2.2;ctx.strokeStyle='#907354';ctx.stroke();
    ctx.lineWidth=2.4;ctx.strokeStyle='#b3aaa0';ctx.beginPath();ctx.moveTo(tx-4,ty+.7);ctx.lineTo(tx,ty);ctx.stroke();
    const ember=live?.73+.18*Math.sin(t*2.4)+.09*Math.sin(t*11.3):.82;
    const g=ctx.createRadialGradient(tx,ty,0,tx,ty,8);g.addColorStop(0,`rgba(255,145,45,${ember*.8})`);g.addColorStop(1,'rgba(255,68,12,0)');ctx.fillStyle=g;ctx.fillRect(tx-8,ty-8,16,16);
    ctx.fillStyle=`rgba(255,${Math.round(95+95*ember)},40,1)`;ctx.beginPath();ctx.arc(tx,ty,1.45,0,Math.PI*2);ctx.fill();
    if(live)for(let i=0;i<12;i++){
      const age=((t+i*.24)%2.88),u=age/2.88;
      const sx=tx+age*7+Math.sin(age*3.1+t*.6+i)*3*u,sy=ty-age*23,r=1.1+u*5.8;
      const smoke=ctx.createRadialGradient(sx,sy,0,sx,sy,r);smoke.addColorStop(0,`rgba(211,204,190,${.26*Math.sin(u*Math.PI)})`);smoke.addColorStop(1,'rgba(211,204,190,0)');ctx.fillStyle=smoke;ctx.fillRect(sx-r,sy-r,r*2,r*2);
    }
    ctx.restore();
  }
  // Tight boot contact stays on the ground while the upper body breathes.
  function contactShadow(ctx,alpha=1){
    const j=assets.json,p=j.placement;
    ctx.save();ctx.globalAlpha*=alpha;ctx.translate(p.x,p.y);ctx.scale(p.width/j.width,p.height/j.height);
    for(const [x,y,rx,ry,a] of [[129,482,114,12,.25],[53,476,43,5,.75],[192,481,42,5,.75]]){
      ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
      const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(19,12,7,${a})`);g.addColorStop(.45,`rgba(19,12,7,${a*.8})`);g.addColorStop(1,'rgba(19,12,7,0)');
      ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    ctx.restore();
  }
  function idle(ctx,now=0,animate=true){
    now=getAmbientTime?.()??now;
    const j=assets.json;if(!j||!assets.sheets.length)return false;
    const f=j.frames[j.clips.draw.start],p=j.placement,t=now/1000;
    contactShadow(ctx);ctx.save();
    if(animate&&!reduced){const feet=p.y+p.height,pose=gunslingerIdle(t);ctx.translate(p.x+p.width/2,feet);ctx.transform(1,0,pose.lean,1+pose.breath,0,0);ctx.translate(-p.x-p.width/2,-feet);}
    drawClothed(ctx,j.clips.draw.start,now,animate,animate&&!reduced?handTension(now):0);cigarette(ctx,j.clips.draw.start,now,animate);
    ctx.restore();return true;
  }
  function figure(ctx,t,alpha=1,now=0,animate=false){
    now=getAmbientTime?.()??now;
    const j=assets.json,k=frameIndex(t);if(k<0||alpha<=0)return;
    const f=j.frames[k],p=j.placement;
    const pose=gunslingerPose(t,run);
    if(t>=run.restAt+GUNSLINGER.settle){idle(ctx,now,animate);return;}
    contactShadow(ctx,alpha);ctx.save();ctx.globalAlpha=alpha;
    // The Mark shot drives weight into the planted feet; the shadow stays put.
    // Its held atlas recoil and this small torso brace share the same clock.
    if(run.recoilWeight&&!reduced&&pose.kick>0){
      const feet=p.y+p.height,brace=pose.kick*run.recoilWeight;
      ctx.translate(p.x+p.width/2,feet);ctx.transform(1,0,-.011*brace,1-.004*brace,0,0);ctx.translate(-p.x-p.width/2,-feet);
    }
    // Share the idle's planted-foot breathing and grip at both joins. It
    // tapers into articulated movement instead of replacing the character.
    if(animate&&!reduced&&pose.idle>0){const feet=p.y+p.height,s=pose.idle,rest=gunslingerIdle(now/1000);ctx.translate(p.x+p.width/2,feet);ctx.transform(1,0,rest.lean*s,1+rest.breath*s,0,0);ctx.translate(-p.x-p.width/2,-feet);}
    const lift=animate&&!reduced?handTension(now)*pose.idle:0;
    drawClothed(ctx,k,now,animate,lift,pose.cloth);
    const muzzle=j.muzzles[k],mx=p.x+muzzle[0]*p.width/j.width,my=p.y+muzzle[1]*p.height/j.height;
    // Relight only the opaque character pixels, preserving the ink texture.
    // The face and chest catch the flash; the surrounding town stays dark.
    let flash=0;
    for(const shot of run.shots){const age=t-shot;if(age>=0&&age<GUNSLINGER.flash)flash=Math.max(flash,(1-age/GUNSLINGER.flash)**1.1);}
    if(flash>0&&!reduced){
      if(!lightCanvas){lightCanvas=makeCanvas();lightCanvas.width=j.width;lightCanvas.height=j.height;}
      const lc=lightCanvas.getContext('2d');lc.clearRect(0,0,j.width,j.height);lc.globalCompositeOperation='source-over';
      // Use the deformed cloth as the lighting mask too: no frozen cape
      // briefly covering the live wind animation during a muzzle flash.
      lc.save();lc.scale(j.width/p.width,j.height/p.height);lc.translate(-p.x,-p.y);
      drawClothed(lc,k,now,animate,lift,pose.cloth);lc.restore();
      lc.globalCompositeOperation='source-atop';
      const lx=muzzle[0]+25,ly=muzzle[1]+35,glow=lc.createRadialGradient(lx,ly,4,lx,ly,165);
      glow.addColorStop(0,`rgba(255,199,113,${.48*flash})`);glow.addColorStop(.48,`rgba(255,160,73,${.24*flash})`);glow.addColorStop(1,'rgba(255,138,55,0)');
      lc.fillStyle=glow;lc.fillRect(0,0,j.width,j.height);lc.globalCompositeOperation='source-over';
      ctx.drawImage(lightCanvas,p.x,p.y,p.width,p.height);
    }
    cigarette(ctx,k,now,animate);
    run.shots.forEach((shot,i)=>{
      const age=t-shot;
      if(age>=0&&age<GUNSLINGER.flash){
        const k=1-age/GUNSLINGER.flash,last=i===run.shots.length-1,rad=(last?34:28)*(.7+.3*k);
        ctx.save();ctx.globalCompositeOperation='lighter';
        const glow=ctx.createRadialGradient(mx,my,1,mx,my,rad*1.9);glow.addColorStop(0,`rgba(255,216,134,${.72*k})`);glow.addColorStop(.35,`rgba(255,137,35,${.3*k})`);glow.addColorStop(1,'rgba(255,80,12,0)');
        ctx.fillStyle=glow;ctx.fillRect(mx-rad*2,my-rad*2,rad*4,rad*4);
        ctx.translate(mx,my);ctx.rotate(i*1.67);
        // Uneven, compact powder flame. No alternating pointed star or
        // long laser rays; the white core lasts only the first exposure.
        for(let l=0;l<3;l++){
          ctx.beginPath();
          for(let n=0;n<29;n++){
            const a=n*Math.PI*2/29,r=rad*(.18+l*.16)*(.65+.22*Math.sin(n*2.73+i+l)+.19*Math.sin(n*1.16+l*2));
            const x=Math.cos(a)*r,y=Math.sin(a)*r*(.72+.12*l);n?ctx.lineTo(x,y):ctx.moveTo(x,y);
          }
          ctx.closePath();ctx.fillStyle=`rgba(255,${186-l*27},${83-l*23},${k*(.85-l*.23)})`;ctx.fill();
        }
        ctx.beginPath();ctx.ellipse(0,0,5.5*k,4.7*k,0,0,Math.PI*2);ctx.fillStyle='#fff8e6';ctx.fill();ctx.restore();
      }
      if(age>.035&&age<.8&&!reduced){
        // Smoke was emitted at the firing position; it must not follow the
        // lowering gun back down toward the holster.
        const origin=j.muzzles[j.clips.aim.start];
        const r=5+age*17,x=p.x+origin[0]*p.width/j.width+Math.sin(age*5+i)*9,y=p.y+origin[1]*p.height/j.height-age*44;
        const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(171,166,151,${.21*(1-age/.8)})`);g.addColorStop(1,'rgba(160,150,130,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
      }
    });
    ctx.restore();
  }
  function camera(t){
    if(!run||reduced)return null;
    let kick=0,dx=0,dy=0;
    run.shots.forEach((shot,i)=>{const a=t-shot;if(a<0||a>.24)return;const e=Math.exp(-a*28),last=i===run.shots.length-1;dx+=e*(last?2.8:1.6)*Math.sin(a*110+i);dy+=e*(last?1.8:1.1)*Math.sin(a*139+.5);kick+=.003*e;});
    const back=1-smooth((t-run.handoff)/.25);
    return {s:1+(.010*smooth((t-.25)/.62)+kick)*back,dx:dx*back,dy:dy*back,cx:W*.4,cy:H*.48};
  }
  function holes(ctx,t){
    if(!run)return;
    run.impacts.forEach((hit,i)=>{
      const age=t-run.shots[i]-run.impactDelay;if(age<0)return;
      ctx.save();ctx.translate(hit.x,hit.y);ctx.rotate(hit.angle);
      const radius=hit.size*.88*smooth(age/.085);
      ctx.beginPath();ctx.arc(0,0,Math.max(2,radius),0,Math.PI*2);ctx.clip();
      if(assets.glass){
        const [ox,oy]=assets.json?.glassOrigin||[.499,.384];
        // Reuse the fracture artwork's alpha for a dark thickness layer.
        // The tiny offset separates the bevel from its shadow on pale reels.
        if(!glassShade){
          glassShade=makeCanvas();glassShade.width=assets.glass.width;glassShade.height=assets.glass.height;
          const gc=glassShade.getContext('2d');gc.drawImage(assets.glass,0,0);
          gc.globalCompositeOperation='source-in';gc.fillStyle='#090c0c';gc.fillRect(0,0,glassShade.width,glassShade.height);
        }
        ctx.globalAlpha=.92;ctx.drawImage(glassShade,-hit.size*ox+1.6,-hit.size*oy+2.0,hit.size,hit.size);
        ctx.globalAlpha=.66;ctx.drawImage(assets.glass,-hit.size*ox,-hit.size*oy,hit.size,hit.size);
        ctx.globalAlpha=1;
      }
      // A dark penetration and its lit bevel make the fracture read as a
      // surface in front of the reels, rather than a white flash over a symbol.
      const penetration=i===run.shots.length-1?11:8;
      ctx.beginPath();for(let n=0;n<13;n++){const a=n*Math.PI*2/13,r=penetration*(.83+.17*Math.sin(n*7.3+i));n?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fillStyle='rgba(3,5,5,.98)';ctx.fill();ctx.strokeStyle='rgba(231,238,226,.9)';ctx.lineWidth=1.25;ctx.stroke();ctx.restore();
      if(age<.55&&!reduced){
        for(const f of hit.flecks){if(age>f.life)continue;const x=hit.x+f.vx*age,y=hit.y+f.vy*age+340*age*age;
          ctx.save();ctx.translate(x,y);ctx.rotate(f.spin*age);ctx.globalAlpha=(1-age/f.life)*.85;ctx.fillStyle='#dce0d5';ctx.beginPath();ctx.moveTo(-f.r,-f.r*.3);ctx.lineTo(f.r*.8,-f.r);ctx.lineTo(f.r*.2,f.r*1.5);ctx.closePath();ctx.fill();ctx.restore();}
      }
    });
  }
  function capture(){
    if(plate||!run)return;
    plate=makeCanvas();plate.width=Math.round(W*1.5);plate.height=Math.round(H*1.5);
    // Transparent fracture pixels ONLY. Sampling the game here caused the
    // old opaque, duplicated reel symbols and the cardboard-screen effect.
    const c=plate.getContext('2d');c.scale(1.5,1.5);holes(c,run.breakAt);
  }
  function glass(ctx,t,source){
    if(!run||t<run.shots[0]||t>run.end)return;
    if(t<run.breakAt){holes(ctx,t);return;}
    const age=t-run.breakAt;
    if(reduced){ctx.save();ctx.globalAlpha=1-smooth(age/.2);holes(ctx,t);ctx.restore();return;}
    capture();
    if(!plate)return;
    for(const s of shards){
      const a=Math.max(0,age-s.delay),u=a/s.life;if(u>=1)continue;
      ctx.save();ctx.translate(s.cx+s.vx*a,s.cy+s.vy*a+640*a*a);ctx.rotate(s.spin*a);
      const z=1+a*.8,face=Math.cos(s.tilt*a);ctx.scale(z*Math.max(.045,Math.abs(face)),z);ctx.translate(-s.cx,-s.cy);
      ctx.beginPath();s.poly.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
      ctx.globalAlpha=1-smooth((u-.30)/.70);
      const glint=Math.pow(Math.max(0,Math.sin(a*17+s.glint)),14);
      // Broad clear pieces should not light up as giant geometric panels.
      // Concentrate readable flashes on the smaller rotating splinters.
      const surface=Math.min(1,14000/Math.max(1,s.width*s.height));
      ctx.fillStyle=`rgba(181,201,196,${(.004+.055*glint)*surface})`;ctx.fill();
      ctx.save();ctx.clip();
      const x0=Math.max(0,s.x0),y0=Math.max(0,s.y0),x1=Math.min(W,s.x0+s.width),y1=Math.min(H,s.y0+s.height);
      if(x1>x0&&y1>y0)ctx.drawImage(plate,x0*1.5,y0*1.5,(x1-x0)*1.5,(y1-y0)*1.5,x0,y0,x1-x0,y1-y0);
      ctx.restore();
      // A dark thickness edge with a narrow reflection, not a solid tile.
      ctx.strokeStyle='rgba(8,15,15,.23)';ctx.lineWidth=1.15;ctx.stroke();
      ctx.strokeStyle=`rgba(232,239,221,${.045+.62*glint*surface})`;ctx.lineWidth=.48;ctx.stroke();ctx.restore();
    }
  }
  function dim(t){return run?.shots.length ? .30*smooth(t/.18)*(1-smooth((t-run.handoff)/.28)):0;}
  function end(){run=null;plate=null;shards=[];}
  // The cell-wild coordinator supplies a faster draw/recoil clock. It shares
  // the approved character atlas, without starting glass or camera effects.
  function startCells(timeline){run={...timeline};plate=null;shards=[];return run;}
  return {assets,load,loadFigure,setAssets,start,startCells,frameIndex,idle,figure,camera,glass,dim,end,get timeline(){return run;}};
}
