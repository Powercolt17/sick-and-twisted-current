import {createHellArtwork} from './hell-artwork.js?v=5';
import {createBloodLivingArt} from './blood-artwork.js?v=2';
// Original attached painting, animated as independent cloth and painted fire.
// The ropes and gallows retain their original drawing and fixed anchors.
export function createHangArtwork(assets,make,options){
 const liveArt=createBloodLivingArt({bloodArt:assets.hangArt,bloodClean:assets.hangClean},make,{
  contour:[[781,234],[846,248],[896,275],[962,299],[1014,323],[1086,346],[1157,359],[1193,382],[1250,408],[1191,407],[1217,432],[1159,411],[1180,454],[1115,425],[1137,471],[1067,445],[1082,492],[1009,463],[1026,517],[967,490],[983,537],[924,510],[897,468],[866,429],[845,368],[800,309]],
  anchor:488,extent:300,mesh:{x:476,y:138,w:336,h:210},
  fireRegion:(X,Y)=>(X<510||X>1070)&&Y>50&&Y<675
 });
 return createHellArtwork({...assets,liveArt},make,options);
}
