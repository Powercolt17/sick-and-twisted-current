// The existing cigarillo treatment, tracked to each registered mouth position.
// Coordinates are in the 640px draw cell; the renderer supplies the same torso
// deformation as the character, so ember and lips remain joined during recoil.
export const BLOOD_MOUTHS=[[181.25,93.75],[181,94],[181,94],[181,94],[181,94],[182,94],[187,96],[194,96],[198,96],[200,96],[204,96],[207,96],[211,98],[211,98],[212,98],[213,98],[215,98],[214,98],[212,97],[213,98],[212,97],[211,98],[209,98],[208,98],[201,98],[200,98],[198,99],[199,99],[200,99],[198,99],[198,99],[199,99]];
export function drawBloodCigarette(ctx,{frame,point,scale,now,animate,reduced}){
 const [x,y]=BLOOD_MOUTHS[frame],a=point({x,y}),b=point({x:x+26.25,y:y-5}),s=scale,t=now/1000,live=animate&&!reduced;
 ctx.save();ctx.lineCap='round';ctx.lineWidth=3.7*s;ctx.strokeStyle='#20140e';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 ctx.lineWidth=2.2*s;ctx.strokeStyle='#907354';ctx.stroke();ctx.lineWidth=2.4*s;ctx.strokeStyle='#b3aaa0';ctx.beginPath();ctx.moveTo(b.x-(b.x-a.x)*4/21,b.y-(b.y-a.y)*4/21);ctx.lineTo(b.x,b.y);ctx.stroke();
 const ember=live?.73+.18*Math.sin(t*2.4)+.09*Math.sin(t*11.3):.82,r=8*s;
 const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,r);g.addColorStop(0,`rgba(255,145,45,${ember*.8})`);g.addColorStop(1,'rgba(255,68,12,0)');ctx.fillStyle=g;ctx.fillRect(b.x-r,b.y-r,2*r,2*r);
 ctx.fillStyle=`rgba(255,${Math.round(95+95*ember)},40,1)`;ctx.beginPath();ctx.arc(b.x,b.y,1.45*s,0,Math.PI*2);ctx.fill();
 if(live)for(let i=0;i<12;i++){const age=(t+i*.24)%2.88,u=age/2.88,sx=b.x+(age*7+Math.sin(age*3.1+t*.6+i)*3*u)*s,sy=b.y-age*23*s,rad=(1.1+u*5.8)*s;const smoke=ctx.createRadialGradient(sx,sy,0,sx,sy,rad);smoke.addColorStop(0,`rgba(211,204,190,${.26*Math.sin(u*Math.PI)})`);smoke.addColorStop(1,'rgba(211,204,190,0)');ctx.fillStyle=smoke;ctx.fillRect(sx-rad,sy-rad,2*rad,2*rad);}
 ctx.restore();
}
