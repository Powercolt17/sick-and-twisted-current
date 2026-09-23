// Cache immutable paint at its exact device-pixel transform. There is no
// resolution reduction or extra scaling when the cached surface is presented.
export function createStaticRaster({x=0,y=0,width,height,paint}){
 let canvas=null,context=null,key=null,left=0,top=0;
 return {draw(ctx,cacheable=true){
  if(!cacheable||!ctx.getTransform){paint(ctx);return;}
  const m=ctx.getTransform();
  if(m.b!==0||m.c!==0||m.a<=0||m.d<=0){paint(ctx);return;}
  const next=[m.a,m.d,m.e,m.f,ctx.imageSmoothingEnabled,ctx.imageSmoothingQuality].join(':');
  if(next!==key){
   left=Math.floor(x*m.a+m.e);top=Math.floor(y*m.d+m.f);
   const w=Math.ceil((x+width)*m.a+m.e)-left,h=Math.ceil((y+height)*m.d+m.f)-top;
   if(!canvas){canvas=document.createElement('canvas');context=canvas.getContext('2d');}
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   else{context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,w,h);}
   context.setTransform(m.a,0,0,m.d,m.e-left,m.f-top);
   context.imageSmoothingEnabled=ctx.imageSmoothingEnabled;context.imageSmoothingQuality=ctx.imageSmoothingQuality;
   paint(context);key=next;
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(canvas,left,top);ctx.restore();
 },clear(){key=null;}};
}
