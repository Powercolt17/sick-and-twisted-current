#!/usr/bin/env python3
"""Blood Money duel: rebuild the outlaw sprite sheets and duel.json from the Seedance source clips.

    pip install numpy opencv-python-headless pillow      (ffmpeg must be on PATH)
    python tools/blood-duel/build_duel.py                 (all outlaws)
    python tools/blood-duel/build_duel.py gunfighter      (one outlaw)

Sources: tools/blood-duel/sources/<outlaw>-<clip>.mp4 (720x1280, 24 fps, 97 frames, flat green screen).
Output:  dist/assets/blood-duel/<outlaw>-<clip>.webp and duel.json (bump ?v= in blood-duel.js after rebuilding).

Every clip of one outlaw shares one clip space (they are start/end-frame chained), so one anchor (his boots in
hit1 frame 0) and one scale serve all three. Impact frames and wound points were measured frame by frame; if a
clip is replaced, re-measure them (first frame fresh blood bursts out, and where it bursts) and edit CONFIG.
"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np, cv2
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'tools', 'blood-duel', 'sources')
OUT = os.path.join(ROOT, 'dist', 'assets', 'blood-duel')

# Porch placement: the money-bag robber in the Blood Money film stands 277 game units tall in the doorway.
PORCH_HEIGHT = 277
STORE = 1.25                       # sheets stored a little above display size (the game renders at 2x, desktop only)
ANCHOR = (364, 1216)               # boots, bottom-centre, in clip pixels (hit1 frame 0)
# Scene grade, fitted to the robber he replaces: curve y = K*255*(x/255)^G, then a per-outlaw tint to this mean RGB.
GRADE_G, GRADE_K, ROBBER_RGB = 1.386, 1.25, np.array([71.3, 49.7, 37.1])
# The lantern beside the doorway, above-left of him, in clip pixels relative to the frame: warm lift with falloff.
LANTERN, LANTERN_K, LANTERN_R, WARM = (7, -253), .55, 600., np.array([1.0, .72, .42])

def dense_then_every_other(first, dense_until, last=96):
    return list(range(first, min(last + 1, dense_until))) + list(range(dense_until, last + 1, 2))

CONFIG = {
 'rustler': {'level':'0','standing_height':1163,'keep_props':True,'clips':{
  'hit1': {'frames':list(range(97)),'impact_frame':3,'wound':(495,280),'tail':(18,2.7)},
  'hit2': {'frames':list(range(97)),'impact_frame':2,'wound':(345,330),'tail':(18,1.9),'counter_scale_to':0.80*1163/1143,
           'scar':[(0,525,305),(12,565,320),(24,555,390),(36,543,355),(48,528,340),(64,532,312),(96,538,306)]},
  'kill': {'frames':list(range(45)),'ground_frame':32,'impact_frame':7,'wound':(365,165),'tail':(16,1.2),'fixed_scale':0.80*1163/1143,
           'strip_white_top_right_until':14,'floor_fill_after':12,
           'scar':[(0,538,306),(8,550,355),(16,541,568),(24,525,930),(32,510,1120),(44,500,1134)]},
 }},
 'gunfighter': {'level':'1','standing_height':1160,'keep_props':True,'clips':{
  'hit1': {'frames':list(range(97)),'impact_frame':21,'wound':(358,225),'tail':(35,2.2)},
  'hit2': {'frames':list(range(97)),'impact_frame':3,'wound':(373,435),'tail':(16,2.5)},
  'kill': {'frames':list(range(97)),'ground_frame':70,'impact_frame':34,'wound':(405,410),
           'time_keys':[(0,0),(20,500),(33,620),(34,662),(70,1920),(96,2130)]},
 }},
 'ringleader': {'level':'2','standing_height':1160,'keep_props':True,'clips':{
  'hit1': {'frames':list(range(97)),'impact_frame':5,'wound':(250,760),'tail':(28,2.3)},
  'hit2': {'frames':list(range(97)),'impact_frame':3,'wound':(365,375),'tail':(24,2.3)},
  'kill': {'frames':list(range(97)),'ground_frame':80,'impact_frame':2,'wound':(400,350),'strip_streak':((250,420),520,6),
           'time_keys':[(0,0),(2,83.3),(24,420),(42,1000),(58,1200),(80,1770),(96,1900)]},
 }},
}

def extract(mp4, tmp):
    subprocess.run([os.environ.get('FFMPEG_BINARY','ffmpeg'), '-v', 'error', '-y', '-i', mp4, '-vf', 'fps=24', os.path.join(tmp, 'f%03d.png')], check=True)
    return sorted(glob.glob(os.path.join(tmp, 'f*.png')))

def key(path, keep_props, spec, i):
    """Green-screen key, then remove everything painted in that is not him: smoke, haze, muzzle glow, bullet streaks."""
    im = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]; mx = np.maximum(r, b); dom = g - mx
    a = np.clip((40 - dom) / 28, 0, 1); a[(dom > 3) & (im.mean(-1) > 150)] = 0        # bright haze against the screen
    im[..., 1] = np.where(dom > 0, mx + np.minimum(dom, 4) * .2, g)                 # despill
    m = cv2.morphologyEx((a > .5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if keep_props:   # his body plus any large piece (the dropped revolver, the money sack)
        keep = np.isin(lab, [j for j in range(1, n) if st[j, cv2.CC_STAT_AREA] > 900]).astype(np.uint8)
    else:
        keep = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    body = cv2.dilate(keep, np.ones((31, 31), np.uint8)) > 0
    sat = im.max(-1) - im.min(-1)
    a[(~body) & (sat < 45)] = 0
    a[(~body) & (sat < 70) & (im.min(-1) > 150)] = 0
    if spec.get('strip_white_top_right_until') and i < spec['strip_white_top_right_until']:
        reg = np.zeros_like(a, bool); reg[:520, 430:] = True; a[reg & (sat < 40) & (im.min(-1) > 175)] = 0
    if spec.get('strip_streak') and i <= spec['strip_streak'][2]:
        (y0, y1), x0, _ = spec['strip_streak']; a[y0:y1, x0:][sat[y0:y1, x0:] < 45] = 0
    H, W = a.shape; yy, xx = np.mgrid[0:H, 0:W]
    a *= np.clip(np.minimum.reduce([xx, W - 1 - xx, H - 1 - yy]).astype(np.float32) / 14, 0, 1)   # feather the frame edge
    # Keep the first shoulder injury through the original Rustler's later takes.
    # This small costume decal follows measured sleeve anchors; it does not alter his pose.
    if spec.get('scar'):
        times, xs, ys = zip(*spec['scar']); x=np.interp(i,times,xs); y=np.interp(i,times,ys)
        rr=((xx-x)/20)**2+((yy-y)/27)**2
        edge=np.clip(1-rr,0,1)*.85*a
        grain=.82+.18*np.sin(xx*1.7+yy*.93)**2
        stain=np.stack([np.full_like(a,76),np.full_like(a,12),np.full_like(a,10)],axis=-1)*grain[...,None]
        im=im*(1-edge[...,None])+stain*edge[...,None]
    return np.dstack([im.clip(0, 255), a * 255])

def curve(x): return np.clip(GRADE_K * 255 * (x / 255) ** GRADE_G, 0, 255)

def build(name):
    cfg = CONFIG[name]; SP = PORCH_HEIGHT / cfg['standing_height']; R = SP * STORE
    o = {'name': name, 'scale': SP, 'anchor': list(ANCHOR), 'wounds': [], 'clips': {}}; tint = None
    for clip in ('hit1', 'hit2', 'kill'):
        spec = cfg['clips'][clip]; imp = spec['impact_frame']
        frames_idx = spec.get('frames') or dense_then_every_other(0, imp + (40 if clip == 'kill' else 30))
        if frames_idx[-1] != 96 and 'frames' not in spec: frames_idx.append(96)
        tail = spec.get('tail', (imp + (40 if clip == 'kill' else 30), 1.6 if clip == 'kill' else 2.2))
        def ts(i):
            if spec.get('time_keys'): return round(float(np.interp(i,*zip(*spec['time_keys']))),1)
            if not tail or i <= tail[0]: return round(i / 24 * 1000, 1)
            return round(tail[0] / 24 * 1000 + (i - tail[0]) / 24 * 1000 / tail[1], 1)
        with tempfile.TemporaryDirectory() as tmp:
            files = extract(os.path.join(SRC, f'{name}-{clip}.mp4'), tmp)
            cells = [key(files[i], cfg['keep_props'], spec, i) for i in frames_idx]
        cw, ch = int(round(720 * R)), int(round(1280 * R))
        cells = [np.array(Image.fromarray(c.astype(np.uint8)).resize((cw, ch), Image.LANCZOS)).astype(np.float32) for c in cells]
        if tint is None:   # one tint per outlaw, from his resting frame, so all his clips match
            px = cells[0][cells[0][..., 3] > 200][:, :3]; tint = ROBBER_RGB / curve(px).mean(0)
        yy, xx = np.mgrid[0:ch, 0:cw] / R
        lift = 1 + (LANTERN_K / (1 + (np.hypot(xx - LANTERN[0], yy - LANTERN[1]) / LANTERN_R) ** 2))[..., None] * WARM
        cols = 10; rows = (len(cells) + cols - 1) // cols; sheet = np.zeros((rows * ch, cols * cw, 4), np.float32)
        for k, c in enumerate(cells):
            L = lift
            if spec.get('floor_fill_after') and frames_idx[k] >= spec['floor_fill_after']:
                L = lift * (1 + .18 * np.clip((yy[..., None] - 900) / 250, 0, 1))
            rgb = np.clip(curve(c[..., :3]) * tint * L, 0, 255)
            sheet[(k // cols) * ch:(k // cols + 1) * ch, (k % cols) * cw:(k % cols + 1) * cw] = np.dstack([rgb, c[..., 3]])
        fn = f'{name}-{clip}.webp'; Image.fromarray(sheet.astype(np.uint8)).save(os.path.join(OUT, fn), 'WEBP', quality=82, method=6)
        T = [ts(i) for i in frames_idx]
        if spec.get('counter_scale_to'):      # counter the model's zoom evenly across the clip (never a visible shrink)
            m_end = spec['counter_scale_to']; M = [round(1 - (1 - m_end) * (t - T[0]) / (T[-1] - T[0]), 4) for t in T]
        else:
            M = [round(spec.get('fixed_scale', 1.0), 4)] * len(T)
        start = spec.get('start', 0)
        o['clips'][clip] = {'file': fn, 'cols': cols, 'cw': cw, 'ch': ch, 'count': len(frames_idx), 'ts': T, 'm': M, 'start': start,
                            'impact': ts(max(imp,frames_idx[start])), 'ground': ts(spec.get('ground_frame',frames_idx[-1])),
                            'dw': round(720 * SP, 2), 'dh': round(1280 * SP, 2), 'ox': round(-ANCHOR[0] * SP, 2), 'oy': round(-ANCHOR[1] * SP, 2)}
        o['wounds'].append([spec['wound'][0] - ANCHOR[0], spec['wound'][1] - ANCHOR[1]])
        print(f'{name:10s} {clip:4s} {len(frames_idx):3d} frames  {os.path.getsize(os.path.join(OUT, fn)) // 1024} KB  impact {o["clips"][clip]["impact"]:.0f} ms')
    return cfg['level'], o

if __name__ == '__main__':
    path = os.path.join(OUT, 'duel.json'); meta = json.load(open(path)) if os.path.exists(path) else {'version': 3, 'outlaws': {}}
    meta.pop('motion_interpolated', None)
    for name in (sys.argv[1:] or list(CONFIG)):
        level, o = build(name); meta['outlaws'][level] = o
    json.dump(meta, open(path, 'w')); print('wrote', path)
