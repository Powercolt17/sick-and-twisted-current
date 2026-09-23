/* Sick & Twisted / filmstrip win. Presentation only: no RNG, bet, or balance writes.
 * Use integer minor units. The demo soundtrack is an excerpt of the supplied
 * recording, not newly generated audio. See INTEGRATION.md for the sound swap.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SickTwistedWin = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const W = 1440, H = 810, DURATION = 6.2;
  const TIMES = Object.freeze({reelResolve:0.25, entrance:0.89, firstCard:1.04, advance:2.55, secondCard:2.86, burst:3.04, lock:3.53, hold:4.28, exit:4.68, done:6.2});
  const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const ease = x=>{x=clamp(x);return x*x*(3-2*x);};
  const out = x=>1-(1-clamp(x))**3;
  const rand = n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const hit = (t,at,decay=.09)=>t<at?0:Math.exp(-(t-at)/decay);
  const cash = cents=>{const n=BigInt(cents);return '$'+(n/100n).toLocaleString('en-US')+'.'+String(n%100n).padStart(2,'0');};
  function validateAmount(n) {if (!Number.isSafeInteger(n)||n<0) throw new TypeError('amountMinor must be a nonnegative safe integer');return n;}
  function countAt(t,total) {
    validateAmount(total);
    if(t<TIMES.entrance)return 0;
    if(t>=TIMES.lock)return total;
    let p;
    if(t<TIMES.advance)p=.045*clamp((t-TIMES.entrance)/(TIMES.advance-TIMES.entrance));
    else if(t<TIMES.burst)p=.045+.245*ease((t-TIMES.advance)/(TIMES.burst-TIMES.advance));
    else p=.29+.71*ease((t-TIMES.burst)/(TIMES.lock-TIMES.burst));
    return Math.min(Math.max(0,total-1),Math.floor(total*p));
  }
  function createRenderer({canvas,atlas,background=null,makeCanvas}) {
    const ctx=canvas.getContext('2d');
    function text(str,x,y,size,maxW,fill='#e9ddbc',outline='#17100b',width=3,font='Outlaw') {
      ctx.save();ctx.font=`${size}px ${font==='Outlaw'?'ApprovedWinOutlaw':font==='Western'?'ApprovedWinWestern':font}`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
      const measured=ctx.measureText(str).width;if(measured>maxW){ctx.translate(x,y);ctx.scale(maxW/measured,1);x=0;y=0;}
      ctx.lineJoin='round';ctx.strokeStyle=outline;ctx.lineWidth=width*2;
      if(width)ctx.strokeText(str,x,y);ctx.fillStyle=fill;ctx.fillText(str,x,y);ctx.restore();
    }
    function paperDirt(seed,x,y,w,h,opacity=.13){
      ctx.save();ctx.globalAlpha*=opacity;
      for(let i=0;i<95;i++){const n=seed+i*3;ctx.fillStyle=i%5?'#27130e':'#fff3cf';ctx.fillRect(x+rand(n)*w,y+rand(n+1)*h,.3+rand(n+2)*1.8,.8+rand(n+3)*2.7);}
      ctx.restore();
    }
    function sparks(t,at,x,y,seed=10){
      const u=t-at;if(u<0||u>1.15)return;
      ctx.save();
      for(let i=0;i<30;i++){
        const a=rand(seed+i*9)*Math.PI*2,speed=100+rand(seed+i*7)*430;
        const px=x+Math.cos(a)*speed*u,py=y+Math.sin(a)*speed*u+210*u*u;
        ctx.globalAlpha=clamp(1-u/(.35+rand(i+seed)*.8));
        ctx.strokeStyle=i%4?'#ab240f':'#f1d391';ctx.lineWidth=1+rand(i+1)*2;
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(a)*(5+speed*.018),py-Math.sin(a)*12);ctx.stroke();
      }
      ctx.restore();
    }
    function bullet(t,at,x,y,seed){
      const u=t-at;if(u<0)return;
      ctx.save();ctx.globalAlpha*=1-ease((t-4.8)/.6);
      const f=hit(t,at,.052);
      if(f>.005){let g=ctx.createRadialGradient(x,y,0,x,y,140);g.addColorStop(0,`rgba(255,246,193,${f})`);g.addColorStop(.14,`rgba(255,204,96,${f*.9})`);g.addColorStop(.43,`rgba(220,48,9,${f*.65})`);g.addColorStop(1,'rgba(142,7,0,0)');ctx.fillStyle=g;ctx.fillRect(x-140,y-140,280,280);}
      ctx.strokeStyle='#ddd0ac';ctx.lineWidth=1.4;
      for(let k=0;k<12;k++){const a=k*Math.PI/6+rand(k+seed)*.3,len=13+rand(k*3+seed)*28;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*7,y+Math.sin(a)*7);ctx.lineTo(x+Math.cos(a+.1)*len*.6,y+Math.sin(a+.1)*len*.6);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();}
      ctx.fillStyle='#080705';ctx.beginPath();for(let k=0;k<16;k++){const a=k*Math.PI/8,r=7+rand(k+seed)*5;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.restore();sparks(t,at,x,y,seed);
    }
    function filmCard(index,x,y,w,h,t,showText,total,reduced,maxMultiplier){
      const rim=28,iw=w-22,ih=h-rim*2;
      ctx.save();ctx.translate(x,y);
      ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=24;ctx.shadowOffsetY=12;
      ctx.fillStyle='#100c09';ctx.fillRect(0,0,w,h);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.fillStyle='#b99260';ctx.fillRect(10,rim-1,iw+2,ih+2);
      // The atlas is sampled directly; the generated artwork remains intact.
      ctx.save();ctx.beginPath();ctx.rect(11,rim,iw,ih);ctx.clip();
      let zoom=reduced?1:1+Math.min(.013,Math.max(0,t-(index?TIMES.secondCard:TIMES.firstCard))*.006);
      ctx.translate(11+iw/2,rim+ih*.40);ctx.scale(zoom,zoom);
      ctx.drawImage(atlas,index*atlas.width/2,0,atlas.width/2,atlas.height,-iw/2,-ih*.40,iw,ih);
      ctx.restore();
      // Sprocket holes use the dark stage behind the film, with warm gate edges.
      for(const yy of [7,h-22])for(let sx=16;sx<w-10;sx+=25){ctx.fillStyle='#a68d68';ctx.fillRect(sx-1,yy-1,13,17);ctx.fillStyle='#eee0bd';ctx.fillRect(sx,yy,11,15);}
      ctx.strokeStyle='#9f7a46';ctx.lineWidth=.8;ctx.strokeRect(8,rim-3,w-16,ih+6);
      // Restrained projected-film wear; no continuous full-screen flash.
      if(!reduced){
        const frame=Math.floor(t*18);ctx.save();ctx.globalAlpha=.11;
        for(let k=0;k<5;k++){let xx=14+rand(k*47+Math.floor(frame/11))*iw;ctx.strokeStyle=k%2?'#37190e':'#fff3dc';ctx.lineWidth=.5+rand(k+1);ctx.beginPath();ctx.moveTo(xx,rim);ctx.lineTo(xx+1, h-rim);ctx.stroke();}
        ctx.fillStyle=frame%7===0?'#100800':'#fff3cc';ctx.globalAlpha=frame%7===0?.024:.014;ctx.fillRect(11,rim,iw,ih);ctx.restore();paperDirt(frame+23,11,rim,iw,ih,.20);
      }
      if(showText){
        const amount=countAt(t,total),locked=t>=TIMES.lock;
        const kick=reduced?0:hit(t,TIMES.lock,.13)*.09+hit(t,TIMES.burst,.08)*.025;
        ctx.save();ctx.translate(w/2,h*.804);ctx.scale(1+kick,1+kick);
        let g=ctx.createLinearGradient(0,-102,0,5);g.addColorStop(0,'#eee2c0');g.addColorStop(.27,'#c8baa0');g.addColorStop(.53,'#7d7362');g.addColorStop(.56,'#b9ad92');g.addColorStop(1,'#d7c8a9');
        ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowOffsetY=5;ctx.shadowBlur=0;
        text(maxMultiplier?countAt(t,maxMultiplier).toLocaleString('en-US')+'×':cash(amount),0,0,110,w*.88,g,'#17110d',4.5);ctx.restore();
        const label=maxMultiplier?'MAX WIN':index?'SICK & TWISTED':'BLOOD MONEY';
        text(label,w/2,h*.891,index?39:43,w*.89,'#8b130e','#e8d5af',.65);
        text(maxMultiplier?cash(amount):locked?'TOTAL WIN':'WIN',w/2,h*.931,maxMultiplier?26:17,w*.8,'#42301e','#e4d2aa',0,'Western');
      }
      ctx.restore();
    }
    function draw(t,{amountMinor=11232,reducedMotion=false,transparent=false,layout=null,maxMultiplier=0}={}){
      validateAmount(amountMinor);validateAmount(maxMultiplier); t=Math.max(0,Number(t)||0);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
      if(layout){const d=canvas.width/layout.width;ctx.setTransform(d*layout.scale,0,0,d*layout.scale,d*layout.x,d*layout.y);}
      else ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      const reduced=reducedMotion;
      const impact=hit(t,TIMES.entrance,.10)*5+hit(t,TIMES.advance,.10)*6+hit(t,TIMES.burst,.075)*7+hit(t,TIMES.lock,.12)*9;
      if(!transparent){
        ctx.fillStyle='#080807';ctx.fillRect(0,0,W,H);
        if(background){ctx.save();if(!reduced)ctx.translate(Math.sin(t*91)*impact*.35,Math.cos(t*83)*impact*.25);ctx.drawImage(background,64,67,641,280,0,90,W,629);ctx.restore();}
        if(t>.20&&t<TIMES.entrance){const a=Math.sin(clamp((t-.2)/.5)*Math.PI)*.45;ctx.strokeStyle=`rgba(247,224,175,${a})`;ctx.lineWidth=4;for(let i=0;i<6;i++)ctx.strokeRect(272+i*132,176,129,127);}
      }
      const visible=clamp((t-.7)/.17)*(1-ease((t-TIMES.exit)/.28));
      const dim=reduced?visible*.72:visible*.73;
      ctx.fillStyle=`rgba(6,3,2,${dim})`;
      if(layout)ctx.fillRect(-layout.x/layout.scale,-layout.y/layout.scale,layout.width/layout.scale,layout.height/layout.scale);
      else ctx.fillRect(0,0,W,H);
      if(t>.78&&t<4.96){
        const w=516,h=728,x=407,y=40;
        let yy=y,rot=0,scale=1;
        if(reduced){yy=y;}
        else if(t<TIMES.firstCard){const p=out((t-.78)/(TIMES.firstCard-.78));yy=y-900*(1-p);rot=(1-p)*-.012;}
        else{const wiggle=Math.floor(t*18);yy=y+(rand(wiggle+17)-.5)*1.5;rot=(rand(wiggle+44)-.5)*.0013;}
        if(t>TIMES.exit){let p=ease((t-TIMES.exit)/.28);yy-=p*1000;rot-=p*.018;}
        if(!reduced){yy+=Math.sin(t*82)*impact*.32;scale+=hit(t,TIMES.lock,.1)*.014;}
        ctx.save();ctx.translate(x+w/2,yy+h/2);ctx.rotate(rot);ctx.scale(scale,scale);ctx.translate(-w/2,-h/2);
        if(!reduced&&t>=TIMES.advance&&t<TIMES.secondCard){
          const p=ease((t-TIMES.advance)/(TIMES.secondCard-TIMES.advance));
          ctx.save();ctx.beginPath();ctx.rect(-8,-60,w+16,h+120);ctx.clip();
          filmCard(0,0,-p*(h+24),w,h,t,false,amountMinor,reduced,maxMultiplier);
          filmCard(1,0,(1-p)*(h+24),w,h,t,false,amountMinor,reduced,maxMultiplier);ctx.restore();
          // Counter stays legible while the physical film advances behind it.
          text(maxMultiplier?countAt(t,maxMultiplier).toLocaleString('en-US')+'×':cash(countAt(t,amountMinor)),w/2,h*.805,108,w*.88,'#d9ccad','#17110d',4.5);
        } else filmCard(t>=TIMES.secondCard?1:0,0,0,w,h,t,true,amountMinor,reduced,maxMultiplier);
        ctx.restore();
        if(!reduced){
          const burn=hit(t,TIMES.entrance,.049)*.80+hit(t,TIMES.advance,.075)*.77+hit(t,TIMES.burst,.045)*.66;
          if(burn>.01){ctx.save();let g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(255,224,146,0)');g.addColorStop(.17,`rgba(255,246,218,${Math.min(1,burn)})`);g.addColorStop(.5,`rgba(255,252,234,${Math.min(1,burn)})`);g.addColorStop(.91,'rgba(255,214,120,0)');ctx.fillStyle=g;ctx.fillRect(x-25,yy,w+50,h);ctx.restore();}
        }
      }
      if(!reduced){bullet(t,3.04,1003,247,30);bullet(t,3.53,345,377,65);bullet(t,3.68,1059,526,93);}
      if(t>=TIMES.exit){
        const p=ease((t-TIMES.exit)/.50),cx=665+((layout?.targetX??1230)-665)*p,cy=610+((layout?.targetY??270)-610)*p;
        if(p<1){ctx.globalAlpha=1-p; text(cash(amountMinor),cx,cy,102*(1-p)+27,500*(1-p)+120,'#ede0bb','#1a100a',3);ctx.globalAlpha=1;}
        if(!transparent&&t>=5.05){ctx.fillStyle='#121211';ctx.fillRect(1160,216,155,77);text('WIN',1233,238,16,140,'#f4f0e6','#111',0,'Arial');text(cash(amountMinor),1233,267,25,145,'#eee0bb','#111',0,'Arial');}
      }
      ctx.restore();return {amountMinor:countAt(t,amountMinor),maxMultiplier,multiplier:maxMultiplier?countAt(t,maxMultiplier):null,complete:t>=DURATION,phase:t<TIMES.entrance?'resolve':t<TIMES.advance?'count':t<TIMES.lock?'escalate':t<TIMES.exit?'hold':'settle'};
    }
    return {draw,canvas};
  }
  return {createRenderer,countAt,validateAmount,TIMES,DURATION,WIDTH:W,HEIGHT:H};
});
