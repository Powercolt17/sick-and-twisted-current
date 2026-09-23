(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SickTwistedCrossfire=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const rand=n=>{const v=Math.sin(n*127.13+3.7)*43758.5453;return v-Math.floor(v);};
  const DEMO_GRID={x:270,y:116,cw:150,ch:145,columns:6,rows:4};
  const DEMO_CELLS=[[0,1],[1,0],[1,1],[2,1],[3,0],[3,2],[4,3],[5,2]];
  // Eight contacts, in six groups, measured from the newest 30 fps recording.
  const CONTACT_FRAMES=[17,20,20,23,26,26,29,32];
  function createSequence(cells,options={}){
    if(!Array.isArray(cells))throw new TypeError('cells must be an array');
    const grid={...DEMO_GRID,...options.grid},width=options.width??1440,height=options.height??810,speed=options.speed??1;
    if(!(Number.isFinite(width+height+speed)&&width>0&&height>0&&speed>0))throw new TypeError('Invalid dimensions or speed');
    for(const key of ['x','y','cw','ch','columns','rows'])if(!Number.isFinite(grid[key])||(['cw','ch','columns','rows'].includes(key)&&grid[key]<=0))throw new TypeError('Invalid grid');
    if(!Number.isInteger(grid.columns)||!Number.isInteger(grid.rows))throw new TypeError('Invalid grid counts');
    const unique=new Map();
    for(const cell of cells){if(!Array.isArray(cell)||cell.length!==2||!cell.every(Number.isInteger)||cell[0]<0||cell[1]<0||cell[0]>=grid.columns||cell[1]>=grid.rows)throw new TypeError('Invalid winning cell');unique.set(cell.join(':'),cell.slice());}
    const ordered=[...unique.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const shots=ordered.map(([c,r],i)=>{
      const base=ordered.length<=8?CONTACT_FRAMES[i]:17+Math.floor(i/2)*Math.max(1,Math.floor(15/Math.ceil(ordered.length/2)));
      const impact=Math.round(base/30/speed*60)/60,travel=Math.max(1,Math.round(4/speed))/60,side=i%2?-1:1;
      const jx=[-.09,-.07,.07,.12,.03,.04,-.08,.03][i%8],jy=[.02,.16,-.01,-.12,-.13,.02,-.08,0][i%8];
      const x=grid.x+(c+.5+jx)*grid.cw,y=grid.y+(r+.5+jy)*grid.ch;
      const sx=side<0?-90*width/1440:width+90*width/1440,sy=height*[.68,.34,.78,.15,.88,.19,.94,.38][i%8];
      return {id:i,c,r,side,fire:impact-travel,impact,travel,x,y,sx,sy,pan:side*.85,targetPan:clamp(x/width)*1.2-.6};
    });
    const last=shots.at(-1)?.impact??0;
    return {version:2,grid,width,height,speed,shots,cells:ordered,last,settle:last+.53/speed,duration:shots.length?last+1.50/speed:0,referenceAudio:shots.length===8&&speed===1};
  }
  function reaction(sequence,time,c,r,reduced=false){
    if(reduced||!sequence)return null;
    const shot=sequence.shots.find(s=>s.c===c&&s.r===r);if(!shot)return null;
    const age=(time-shot.impact)*sequence.speed;if(age<0||age>=.22)return null;
    const hit=Math.sin(Math.PI*clamp(age/.22))*Math.exp(-age*9),unit=sequence.grid.cw/120;
    return {dx:-shot.side*7*hit*unit,dy:3*hit*unit,scale:1-.085*hit,rotation:shot.side*.025*hit};
  }
  function camera(sequence,time,reduced=false,intensity=1){
    if(reduced)return {x:0,y:0,scale:1};let x=0,y=0,push=0;
    for(const s of sequence.shots){
      const fire=(time-s.fire)*sequence.speed;
      if(fire>=0&&fire<.12){const e=Math.exp(-fire*34)*(1-smooth((fire-.055)/.065));
        x-=s.side*9*e*Math.cos(78*fire);y-=4.5*e*Math.cos(88*fire);push=Math.max(push,e*.006);}
      const d=(time-s.impact)*sequence.speed;
      if(d>=0&&d<.22){const finish=s.impact===sequence.last?1.22:1,e=Math.exp(-d*18)*(1-smooth((d-.12)/.10))*finish;
        x-=s.side*22*e*Math.cos(102*d);y-=12*e*Math.cos(87*d+.24);push=Math.max(push,.012*e);}
    }
    // Hard directional recoil belongs to the firing window. Overscan covers
    // every translated edge; the exact resting camera returns before the amount.
    const ux=sequence.width/1212,uy=sequence.height/608;
    x=Math.max(-22,Math.min(22,x*intensity))*ux;y=Math.max(-14.5,Math.min(14.5,y*intensity))*uy;
    return {x,y,scale:1+Math.max(2*Math.abs(x)/sequence.width,2*Math.abs(y)/sequence.height)+Math.min(.016,push*intensity)};
  }
  function ragged(ctx,r,seed,n=31){ctx.beginPath();for(let j=0;j<n;j++){const a=j/n*Math.PI*2,k=r*(.48+.52*rand(seed+j));if(!j)ctx.moveTo(Math.cos(a)*k,Math.sin(a)*k);else ctx.lineTo(Math.cos(a)*k,Math.sin(a)*k);}ctx.closePath();}
  function radial(ctx,x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);for(const [p,c]of stops)g.addColorStop(p,c);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function splatter(ctx,image,index,x,y,w,h,alpha){
    if(!image)return;const frame=(index%4)*8+7,sx=frame%4*256,sy=Math.floor(frame/4)*256;
    ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(image,sx,sy,256,256,x,y,w,h);ctx.restore();
  }
  function draw(ctx,time,sequence,assets={},options={}){
    if(!sequence.shots.length||time<0||time>sequence.duration)return;
    const reduced=!!options.reducedMotion,unit=sequence.grid.cw/150,fade=1-smooth((time-sequence.duration+.23/sequence.speed)*sequence.speed/.23);
    ctx.save();ctx.globalAlpha=fade*(options.intensity??1);
    for(const s of sequence.shots){
      const age=(time-s.fire)*sequence.speed,dt=(time-s.impact)*sequence.speed,angle=Math.atan2(s.y-s.sy,s.x-s.sx),flight=(time-s.fire)/s.travel;
      // A directional muzzle jet, bright core and a short smoke kick make
      // each screen-edge gun physically present without covering the reels.
      if(!reduced&&age>=0&&age<.27){
        const edge=s.side<0?0:sequence.width,f=(edge-s.sx)/(s.x-s.sx),ey=s.sy+(s.y-s.sy)*f;
        const flash=Math.exp(-age*38)*(1-smooth((age-.045)/.045));
        ctx.save();ctx.translate(edge,ey);ctx.rotate(angle);
        if(flash>.002){
          ctx.save();ctx.globalCompositeOperation='lighter';ctx.scale(2.5,1);
          radial(ctx,5*unit,0,96*unit,[[0,`rgba(255,228,175,${.82*flash})`],[.35,`rgba(232,135,56,${.38*flash})`],[1,'rgba(190,70,20,0)']]);ctx.restore();
          ctx.globalAlpha=fade*flash;ctx.fillStyle='#f3ad54';
          for(let j=0;j<5;j++){const turn=(j-2)*.16,length=(105+rand(s.id*19+j)*100)*unit;
            ctx.save();ctx.rotate(turn);ctx.beginPath();ctx.moveTo(-7*unit,-11*unit);ctx.lineTo(length*.42,-(6+j%2*5)*unit);ctx.lineTo(length,0);ctx.lineTo(length*.36,9*unit);ctx.lineTo(-7*unit,12*unit);ctx.closePath();ctx.fill();ctx.restore();}
          ctx.fillStyle='#fff4d7';ctx.beginPath();ctx.moveTo(-10*unit,-9*unit);ctx.lineTo(34*unit,-13*unit);ctx.lineTo(101*unit,0);ctx.lineTo(31*unit,12*unit);ctx.lineTo(-10*unit,8*unit);ctx.closePath();ctx.fill();
        }
        if(age>.025){const smoke=smooth((age-.025)/.045)*(1-smooth((age-.075)/.195));ctx.globalAlpha=fade;
          for(let j=0;j<3;j++)radial(ctx,(24+age*150+j*19)*unit,(j-1)*(12+age*50)*unit,(13+age*76+j*3)*unit,[[0,`rgba(118,104,82,${smoke*.27})`],[.55,`rgba(74,66,55,${smoke*.15})`],[1,'rgba(44,38,32,0)']]);}
        ctx.restore();
      }
      if(!reduced&&flight>=0&&flight<1){
        const x=s.sx+(s.x-s.sx)*flight,y=s.sy+(s.y-s.sy)*flight;ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        const len=Math.min(320*unit,Math.hypot(x-s.sx,y-s.sy)),streak=ctx.createLinearGradient(-len,0,0,0);
        streak.addColorStop(0,'rgba(120,8,5,0)');streak.addColorStop(.45,'rgba(155,23,14,.25)');streak.addColorStop(.88,'rgba(244,111,63,.85)');streak.addColorStop(1,'#ffe8b2');
        ctx.strokeStyle=streak;ctx.lineWidth=3.6*unit;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(0,0);ctx.stroke();
        ctx.strokeStyle='#fff1d5';ctx.lineWidth=1.35*unit;ctx.beginPath();ctx.moveTo(-65*unit,0);ctx.lineTo(5*unit,0);ctx.stroke();ctx.restore();
      }
      if(dt<0)continue;
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(rand(s.id+70)*6);ctx.fillStyle='#1c1510';ragged(ctx,13*unit,90+s.id);ctx.fill();
      if(assets.impact)ctx.drawImage(assets.impact,1000,960,223,232,-24*unit,-25*unit,48*unit,50*unit);
      ctx.fillStyle='#0d0908';ragged(ctx,7*unit,140+s.id);ctx.fill();ctx.restore();
      const gx=sequence.grid.x+s.c*sequence.grid.cw,gy=sequence.grid.y+s.r*sequence.grid.ch;
      ctx.save();ctx.beginPath();ctx.rect(gx+2,gy+2,sequence.grid.cw-4,sequence.grid.ch-4);ctx.clip();
      splatter(ctx,assets.blood,s.id,gx+sequence.grid.cw*.15,gy-sequence.grid.ch*.24,sequence.grid.cw*1.00,sequence.grid.ch*.65,.79*smooth(dt/.055));
      splatter(ctx,assets.blood,s.id+1,gx-sequence.grid.cw*.14,gy+sequence.grid.ch*.70,sequence.grid.cw*.74,sequence.grid.ch*.58,.59*smooth(dt/.055));ctx.restore();
      if(reduced)continue;
      if(dt<.19){
        ctx.save();ctx.translate(s.x,s.y);ctx.globalCompositeOperation='lighter';const peak=dt<.028?1:Math.exp(-(dt-.028)*38);
        radial(ctx,0,0,(s.bounty?49:s.impact===sequence.last?128:114)*unit,[[0,`rgba(255,207,128,${peak*.88})`],[.24,`rgba(255,166,67,${peak*.56})`],[1,'rgba(255,143,30,0)']]);
        for(let j=0;j<(s.bounty?18:86);j++){
          const seed=s.id*201+j,a=rand(seed)*Math.PI*2,stretch=.4+rand(seed+300)*.9,spread=(s.bounty?.42:1)*(28+rand(seed+25)*86)*unit*(.75+dt*6),inside=spread*(.1+.65*rand(seed+800));
          ctx.globalAlpha=fade*peak*(.48+rand(seed+6)*.52);ctx.strokeStyle=j%3===0?'#fff9cb':j%3===1?'#f8bc61':'#b47a38';ctx.lineWidth=(.85+rand(seed+56)*1.8)*unit;
          ctx.beginPath();ctx.moveTo(Math.cos(a)*inside,Math.sin(a)*inside*stretch);ctx.lineTo(Math.cos(a)*spread,Math.sin(a)*spread*stretch);ctx.stroke();
        }
        ctx.globalAlpha=fade*peak*.70;if(assets.impact&&!s.bounty)ctx.drawImage(assets.impact,1000,960,223,232,-66*unit,-69*unit,132*unit,138*unit);
        ctx.globalAlpha=fade;const core=(s.bounty?.32:1)*(25+12*rand(s.id+66))*unit*(1-dt*.8);
        ctx.save();ctx.rotate(rand(s.id+60)*1.1-.55);ctx.scale(1.04,.90);
        radial(ctx,0,0,core,[[0,`rgba(255,255,247,${peak})`],[.67,`rgba(255,255,224,${peak})`],[.89,`rgba(255,232,118,${peak*.95})`],[1,'rgba(255,208,55,0)']]);
        for(let j=0;j<7;j++){const a=rand(s.id*17+j)*6.28,r=rand(j+55)*core*.55;radial(ctx,Math.cos(a)*r,Math.sin(a)*r,core*.5,[[0,`rgba(255,255,249,${peak})`],[.7,`rgba(255,255,231,${peak})`],[1,'rgba(255,243,179,0)']]);}ctx.restore();ctx.restore();
      }
      if(dt>=.05&&dt<.88){
        ctx.save();ctx.translate(s.x,s.y);
        for(let j=0;j<13;j++){
          const a=rand(s.id*67+j)*6.28,r=rand(j+86)*27*unit,x=Math.cos(a)*r+(rand(j+12)-.5)*dt*65*unit,y=Math.sin(a)*r-dt*(26+rand(j+8)*39)*unit;
          const sz=(7+rand(j+28)*16+dt*23)*unit,opacity=.31*smooth(dt/.045)*(1-smooth((dt-.17)/.71));
          radial(ctx,x,y,sz,[[0,`rgba(214,211,190,${opacity})`],[.48,`rgba(185,181,162,${opacity*.58})`],[1,'rgba(150,149,140,0)']]);
        }ctx.restore();
      }
      if(dt>=.045&&dt<.58)for(let j=0;j<26;j++){
        const seed=s.id*77+j,a=rand(seed)*6.283,v=(options.localOnly?70+rand(seed+1)*145:90+rand(seed+1)*450)*unit,x=s.x+Math.cos(a)*v*dt,y=s.y+Math.sin(a)*v*dt+260*unit*dt*dt;
        ctx.save();ctx.translate(x,y);ctx.rotate(rand(seed+5)*6+dt*14);ctx.globalAlpha=fade*(1-smooth((dt-.11)/.47));ctx.fillStyle=j%4===0?'#c89d5b':'#6e0b09';ragged(ctx,(1+rand(seed+8)*4.3)*unit,seed+50,7);ctx.fill();ctx.restore();
      }
    }
    if(options.localOnly&&assets.blood){
      // Small marks on timber nearest to actual edge winners, never across the screen.
      for(const s of sequence.shots.filter(s=>s.c===0||s.c===5||s.r===3).slice(0,4)){
        const dt=(time-s.impact)*sequence.speed;if(dt<0)continue;
        const x=s.c===0?sequence.grid.x-18:s.c===5?sequence.grid.x+sequence.grid.cw*6-8:s.x-14;
        const y=s.r===3?sequence.grid.y+sequence.grid.ch*4-10:s.y-12;
        splatter(ctx,assets.blood,s.id,x,y,34*unit,39*unit,.55*smooth(dt/.065));
      }
    }
    if(!options.localOnly&&assets.blood&&time>=sequence.shots[0].impact){
      const edge=[[.075,.20,.10,.21,0],[.15,.60,.085,.14,1],[.84,.60,.11,.21,2],[.70,.84,.065,.13,1],[.54,.89,.085,.16,0],[.89,.31,.07,.11,3]];
      for(let i=0;i<edge.length;i++){
        const [x,y,w,h,v]=edge[i],shot=sequence.shots[Math.min(sequence.shots.length-1,Math.floor(i*sequence.shots.length/edge.length))];
        const dt=(time-shot.impact)*sequence.speed;if(dt<0)continue;
        const p=smooth(dt/.055),spread=.90+.10*p;
        splatter(ctx,assets.blood,v,sequence.width*x,sequence.height*y,sequence.width*w*.67*spread,sequence.height*h*.67*spread,p*.64);
      }
    }ctx.restore();
  }
  function scheduleAudio(context,sequence,buffers,{destination=context.destination,startAt=context.currentTime+.06,muted=false}={}){
    const bus=context.createGain();bus.gain.value=muted?0:1;bus.connect(destination);const active=[];
    function play(buffer,at,pan,gain,panEnd,travel){
      if(!buffer)return;const node=context.createBufferSource(),vol=context.createGain(),p=context.createStereoPanner();node.buffer=buffer;vol.gain.value=gain;p.pan.setValueAtTime(pan,startAt+at);
      if(panEnd!==undefined){p.pan.linearRampToValueAtTime(panEnd,startAt+at+travel);node.playbackRate.value=buffer.duration/travel;}
      node.connect(vol);vol.connect(p);p.connect(bus);node.start(startAt+at);active.push(node);
    }
    if(sequence.referenceAudio&&buffers.reference){const node=context.createBufferSource();node.buffer=buffers.reference;node.connect(bus);node.start(startAt);active.push(node);}
    else{const level=.65*Math.min(1,Math.sqrt(8/Math.max(1,sequence.shots.length)));for(const s of sequence.shots){play(buffers.shot,s.fire,s.pan,.63*level);play(buffers.whizz,s.fire,s.pan,.20*level,s.targetPan,s.travel);play(buffers.impact,s.impact,s.targetPan,.55*level);}}
    let stopped=false;return {startAt,time:()=>Math.max(0,context.currentTime-startAt),mute(value){bus.gain.setTargetAtTime(value?0:1,context.currentTime,.008);},stop(){if(stopped)return;stopped=true;bus.gain.setTargetAtTime(0,context.currentTime,.008);for(const n of active){try{n.stop(context.currentTime+.045);}catch(_){}}setTimeout(()=>bus.disconnect(),80);}};
  }
  return {createSequence,draw,reaction,camera,scheduleAudio,DEMO_CELLS,DEMO_GRID,CONTACT_FRAMES};
});
