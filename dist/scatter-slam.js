// Contact-only presentation; never moves or replaces the resolved symbols.
export function createScatterSlam({G,reduced=false,onImpact=()=>{}}){
 const hits=new Map();let pausedAt=null;
 function land(column,rows,now){if(reduced||!rows.length)return;for(const row of rows)hits.set(column+':'+row,{column,row,at:now});onImpact(Math.min(6,4+rows.length*.5),now);}
 function sample(column,row,now){const hit=hits.get(column+':'+row);if(!hit)return null;const t=(pausedAt??now)-hit.at;if(t<0)return null;if(t>=240){hits.delete(column+':'+row);return null;}
  // Hard compression into the floor, one tight rebound, then settle.
  const squash=t<45?.16*(1-t/45):t<120?-.045*Math.sin((t-45)/75*Math.PI):0;
  return {scaleX:1+squash*.45,scaleY:1-squash,dy:t<45?3*(1-t/45):t<150?-3*Math.sin((t-45)/105*Math.PI):0};
 }
 function draw(ctx,now){if(reduced)return;for(const hit of hits.values()){const age=(pausedAt??now)-hit.at;if(age<0||age>=240)continue;const q=age/240,x=G.x+hit.column*G.cw,y=G.y+(hit.row+1)*G.ch;
  ctx.save();ctx.globalAlpha=(1-q)**2;ctx.strokeStyle='#ffe5ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+9,y-2);ctx.lineTo(x+G.cw-9,y-2);ctx.stroke();
  for(let i=0;i<8;i++){const side=i%2?1:-1,px=x+G.cw/2+side*(20+q*(22+i*2)),py=y-3-Math.sin(q*Math.PI)*(7+i*2);ctx.fillStyle=i%3?'#ae8a58':'#ecd3a0';ctx.fillRect(px,py,2+i%2,2);}
  ctx.restore();}}
 return {land,sample,draw,clear(){hits.clear();pausedAt=null;},setPaused(paused,now){if(paused&&pausedAt===null)pausedAt=now;else if(!paused&&pausedAt!==null){for(const hit of hits.values())hit.at+=now-pausedAt;pausedAt=null;}}};
}
