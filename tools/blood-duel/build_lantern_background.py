from pathlib import Path
import sys, json, subprocess

import numpy as np
import cv2
from PIL import Image, ImageDraw
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'source-art/blood-showdown/approved-background.png'
OUT=ROOT/'source-art/blood-showdown/render';OUT.mkdir(parents=True,exist_ok=True)
WORK=OUT/'review';WORK.mkdir(exist_ok=True)
W,H,FPS,SECONDS=1920,1080,30,8
base=np.asarray(Image.open(SOURCE).convert('RGB').resize((W,H),Image.Resampling.LANCZOS)).copy()
scale=W/2048
# Measured centers of the three existing lantern flames in the approved artwork.
lamps=[(109,386,7,17,66,80),(1837,403,5,12,52,70),(1648,476,3.5,9,32,46)]
regions=[];allowed=np.zeros((H,W),bool)
for i,(x,y,rx,ry,gx,gy) in enumerate(lamps):
    x,y,rx,ry,gx,gy=np.array([x,y,rx,ry,gx,gy])*scale
    x0=max(0,int(x-gx));x1=min(W,int(x+gx)+1);y0=max(0,int(y-gy));y1=min(H,int(y+gy)+1)
    yy,xx=np.mgrid[y0:y1,x0:x1];xx=xx-x;yy=yy-y
    # Compact masks are exactly zero beyond each local pool of lamplight.
    r2=(xx/gx)**2+(yy/gy)**2
    glow=np.maximum(0,1-r2)**3
    core=np.exp(-2*((xx/rx)**2+(yy/ry)**2))*np.maximum(0,1-r2)
    rgb=base[y0:y1,x0:x1].astype(np.float32)/255
    linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
    # Illuminate existing texture; no generated or moving scenery.
    light=(core[:,:,None]*np.array([.28,.13,.028])+glow[:,:,None]*linear*np.array([.38,.20,.045])).astype(np.float32)
    regions.append((x0,y0,x1,y1,linear,light,core,ry))
    allowed[y0:y1,x0:x1]|=(core+glow)>1e-7

def flicker(t,i):
    # Integer frequencies over eight seconds give an exact periodic seam.
    phase=i*2.147
    v=.46*np.sin(2*np.pi*3*t/SECONDS+phase)+.22*np.sin(2*np.pi*11*t/SECONDS+phase*.7)+.15*np.sin(2*np.pi*19*t/SECONDS+phase*1.3)+.10*np.sin(2*np.pi*31*t/SECONDS+phase*.3)+.07*np.sin(2*np.pi*43*t/SECONDS+phase*1.7)
    return .15+.72*v

def frame(t):
    result=base.copy()
    for i,(x0,y0,x1,y1,linear,light,core,ry) in enumerate(regions):
        yy,xx=np.mgrid[0:y1-y0,0:x1-x0].astype(np.float32)
        phase=2*np.pi*t/SECONDS
        sway=(1.0*np.sin(phase*13+i*1.4)+.42*np.sin(phase*23+i*.8))
        stretch=.7*np.sin(phase*17+i*2.1)
        moving=cv2.remap(linear,(xx-core*sway).astype(np.float32),(yy-core*stretch).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
        v=np.clip(moving+light*flicker(t,i),0,1)
        srgb=np.where(v<=.0031308,v*12.92,1.055*v**(1/2.4)-.055)
        result[y0:y1,x0:x1]=np.clip(srgb*255+.5,0,255).astype(np.uint8)
    return result

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
target=OUT/'Blood-Money-lanterns-alive.mp4'
cmd=[ffmpeg,'-y','-hide_banner','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
with (WORK/'encode.log').open('w') as log:
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
    outside_max=0
    for j in range(FPS*SECONDS):
        f=frame(j/FPS)
        if j%30==0:outside_max=max(outside_max,int(np.max(np.abs(f.astype(np.int16)-base)[~allowed])))
        p.stdin.write(f.tobytes())
    p.stdin.close();code=p.wait()
    if code:raise RuntimeError((WORK/'encode.log').read_text())
assert outside_max==0, outside_max
assert np.array_equal(frame(0),frame(SECONDS))
# Compare the real flame at peak and trough; magnified review only, not output artwork.
times=np.arange(FPS*SECONDS)/FPS
lo=float(times[np.argmin([flicker(t,0) for t in times])]);hi=float(times[np.argmax([flicker(t,0) for t in times])])
sheet=Image.new('RGB',(960,640),'#161616');draw=ImageDraw.Draw(sheet)
for row,(x,y,rx,ry,gx,gy) in enumerate(lamps):
    for col,t in enumerate([lo,hi]):
        f=Image.fromarray(frame(t));cx=x*scale;cy=y*scale
        crop=f.crop((int(cx-55),int(cy-50),int(cx+55),int(cy+50))).resize((220,200),Image.Resampling.NEAREST)
        sheet.paste(crop,(col*480,row*213+13));draw.text((col*480+225,row*213+24),f'Lamp {row+1} / {t:.2f}s',fill='white')
sheet.save(WORK/'light-review.jpg',quality=92)
Image.fromarray(frame(0)).save(WORK/'full-frame.jpg',quality=94)
(WORK/'report.json').write_text(json.dumps({'width':W,'height':H,'fps':FPS,'seconds':SECONDS,'frames':FPS*SECONDS,'outside_lantern_pixel_delta':outside_max,'loop_end_matches_start':True,'animated_pixels_percent':round(allowed.mean()*100,2),'output_bytes':target.stat().st_size},indent=2))
print((WORK/'report.json').read_text())
