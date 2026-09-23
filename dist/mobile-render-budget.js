// Respond to actual rendering work, not RAF gaps caused by hidden/throttled tabs.
// Game clocks and outcomes never depend on this presentation-only budget.
export function createMobileRenderBudget(){
 let samples=0,total=0,warmup=12,quality=1,motion=true;
 return {
  get quality(){return quality;},get motion(){return motion;},
  sample(ms,mobile){
   if(!mobile||!Number.isFinite(ms)||ms<0)return false;
   if(warmup){warmup--;return false;}
   total+=ms;samples++;
   if(samples<24)return false;
   const mean=total/samples;total=0;samples=0;
   if(mean<=20)return false;
   if(quality>.6){quality=quality>.8?.8:.6;warmup=4;return true;}
   if(mean>26&&motion){motion=false;return true;}
   return false;
  }
 };
}
