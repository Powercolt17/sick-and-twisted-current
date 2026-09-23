"""Run after build_duel.py. Add motion-compensated in-betweens only across >30 ms gaps.
The runtime displays one cell, avoiding double-exposed outlines from cross-dissolving poses.
Requires numpy, opencv-python-headless and Pillow. Rebuild before running again.
"""
from pathlib import Path
import json,cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'dist/assets/blood-duel'
meta=json.loads((OUT/'duel.json').read_text())
if meta.get('motion_interpolated'):raise SystemExit('Already interpolated; rebuild source atlases first.')
cv2.setNumThreads(2)
def tween(a,b):
    aa=a.astype(np.float32)/255;bb=b.astype(np.float32)/255
    pa=aa.copy();pb=bb.copy();pa[:,:,:3]*=pa[:,:,3:];pb[:,:,:3]*=pb[:,:,3:]
    ga=cv2.cvtColor((pa[:,:,:3]*255).astype(np.uint8),cv2.COLOR_RGB2GRAY)
    gb=cv2.cvtColor((pb[:,:,:3]*255).astype(np.uint8),cv2.COLOR_RGB2GRAY)
    dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    ab=dis.calc(ga,gb,None);ba=dis.calc(gb,ga,None)
    y,x=np.mgrid[:a.shape[0],:a.shape[1]].astype(np.float32)
    wa=cv2.remap(pa,x-ab[:,:,0]*.5,y-ab[:,:,1]*.5,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    wb=cv2.remap(pb,x-ba[:,:,0]*.5,y-ba[:,:,1]*.5,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    v=(wa+wb)*.5;v[:,:,:3]/=np.maximum(v[:,:,3:],1/255)
    return (np.clip(v,0,1)*255+.5).astype(np.uint8)
for level,o in meta['outlaws'].items():
    for name,c in o['clips'].items():
        if c.get('motion_interpolated'):continue
        src=np.array(Image.open(OUT/c['file']).convert('RGBA'));cw,ch=c['cw'],c['ch'];cells=[];times=[];scales=[]
        original=[src[i//c['cols']*ch:(i//c['cols']+1)*ch,i%c['cols']*cw:(i%c['cols']+1)*cw].copy() for i in range(c['count'])]
        for i,a in enumerate(original):
            cells.append(a);times.append(c['ts'][i]);scales.append(c['m'][i])
            if i+1<len(original) and c['ts'][i+1]-c['ts'][i]>30:
                cells.append(tween(a,original[i+1]));times.append(round((c['ts'][i]+c['ts'][i+1])/2,3));scales.append((c['m'][i]+c['m'][i+1])/2)
        cols=16;sheet=np.zeros((((len(cells)+cols-1)//cols)*ch,cols*cw,4),np.uint8)
        for i,a in enumerate(cells):sheet[i//cols*ch:(i//cols+1)*ch,i%cols*cw:(i%cols+1)*cw]=a
        Image.fromarray(sheet).save(OUT/c['file'],'WEBP',quality=86,method=4)
        c.update(count=len(cells),cols=cols,ts=times,m=scales,motion_interpolated=True)
        print(o['name'],name,len(cells),flush=True)
meta['motion_interpolated']=True
(OUT/'duel.json').write_text(json.dumps(meta))
