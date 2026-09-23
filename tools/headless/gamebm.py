# Test harness: the real game, every file served straight from disk (no flaky server),
# and the MP4s swapped for VP9 copies because this headless Chromium has no H.264.
import asyncio, json, os, mimetypes
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
D=os.path.abspath(os.path.join(HERE,'..','..','dist'))     # the game
V=os.path.join(HERE,'webm')+os.sep                          # VP9 copies of the MP4s (see README)
mimetypes.add_type('application/javascript','.js'); mimetypes.add_type('image/webp','.webp'); mimetypes.add_type('font/woff2','.woff2')
async def serve(route):
    u=route.request.url.split('://',1)[1].split('/',1)[1].split('?')[0].split('#')[0] or 'index.html'
    if u.endswith('.mp4') and os.path.exists(V+os.path.basename(u).replace('.mp4','.webm')):
        return await route.fulfill(path=V+os.path.basename(u).replace('.mp4','.webm'),headers={'Content-Type':'video/webm','Accept-Ranges':'bytes'})
    f=os.path.join(D,u)
    if os.path.isfile(f): return await route.fulfill(path=f,headers={'Content-Type':mimetypes.guess_type(f)[0] or 'application/octet-stream'})
    return await route.fulfill(status=404,body='')
async def open_game(p,viewport=(1323,743),dpr=1,mobile=False,query='debug=1&intro=0'):
    b=await p.chromium.launch(args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
    ctx=await b.new_context(viewport={"width":viewport[0],"height":viewport[1]},device_scale_factor=dpr,is_mobile=mobile,has_touch=mobile)
    await ctx.route("http://game.local/**",serve)
    # test-only: this headless decoder rejects valid images at random; retry before the game treats it as fatal
    await ctx.add_init_script("""(()=>{const orig=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){const self=this;return orig.call(self).catch(async e=>{for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,150*(i+1)));try{return await orig.call(self);}catch(e2){}}if(self.complete&&self.naturalWidth)return;throw e;});};})();""")
    page=await ctx.new_page(); logs=[]
    page.on("pageerror",lambda e:logs.append('ERR '+str(e)[:240])); page.on("console",lambda m:logs.append(m.type+' '+m.text[:200]) if m.type in('error','warning') else None)
    await page.goto(f"http://game.local/index.html?{query}",wait_until="load")
    await page.wait_for_function("()=>window.__sickTwisted&&document.getElementById('loading')===null",timeout=90000)
    await page.wait_for_timeout(1500)
    return b,page,logs
async def enter_bm(page,begin=True,demo=False):
    await page.evaluate("(demo)=>{window.__bm=window.__sickTwisted.startBonus(8,'DEAD',0,demo)}",demo)
    for i in range(90):
        await page.wait_for_timeout(1000)
        st=json.loads(await page.evaluate("()=>JSON.stringify({scene:window.__sickTwisted.featureScene,intro:window.__sickTwisted.bloodIntro})"))
        if st['intro'].get('canContinue'): await page.evaluate("()=>window.__sickTwisted.continueBlood()")
        if st['scene']['phase']=='feature': break
    await page.wait_for_timeout(2500)
    if begin:
        await page.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(e=>/BEGIN THE HUNT/i.test(e.textContent)&&e.offsetParent);if(b)b.click();}")
        await page.wait_for_timeout(4000)
