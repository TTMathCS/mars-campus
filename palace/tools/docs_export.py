"""Export the design book's drawings, the floor plan sheets and a few Mars Atlas views as images, so the
Markdown docs in palace/docs/ can show them on GitHub (the HTML pages only render on the live site).
usage: python3 palace/tools/docs_export.py [book|plans|atlas|all] [chapter ...]     (default: all; book alone takes the chapters to export)
Writes palace/docs/img/book/<chapter>-<name>.png, palace/docs/archive/img/plans-rev-b/<sheet>.png (the archived Rev B sheets) and
palace/docs/img/atlas/<view>.jpg. Drawings are saved as 256-colour PNGs at 1.5 times the page size;
drawings with Mars imagery as JPEG. The NASA tiles are blocked on purpose, so map figures show the real
base map (img/mars-map.jpg). Web fonts load from Google Fonts when it can be reached.
Run it again after changing a drawing; docs/ links to the files by these names."""
import asyncio, sys, os, io, subprocess, time
from playwright.async_api import async_playwright
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
OUT = os.path.join(REPO, "palace", "docs", "img")
THREE = os.path.join(TOOLS, "three.min.js")
PORT = 8786
SCALE = 1.5
WHAT = sys.argv[1] if len(sys.argv) > 1 else "all"
ONLY = sys.argv[2:]          # e.g. book space: just that chapter's drawings, so the others stay as they are
# chapter page -> [(svg id, file name)]; the Pentagon's level plan is exported once per level
BOOK = {
    "site": [("fMars", "mars"), ("fGround", "ground"), ("fRegion", "region"), ("fCorridor", "corridor"), ("fSite", "plan"), ("fCity", "city")],
    "crown": [("fElev", "elevation"), ("fPlan", "plan"), ("fOrbIn", "orb-inside"), ("fDash", "dashboard"), ("fZoom", "zoom"), ("fField", "field"), ("fSection", "sections")],
    "pentagon": [("fSec", "section"), ("fPlan", "plan-L1"), ("fDose", "dose"), ("fDig", "dig")],
    "interiors": [("fMap", "map"), ("fSuites", "suites"), ("fArrive", "arrive"), ("fSol", "sol")],
    "power": [("fFlow", "flow"), ("fSol", "sol"), ("fTrench", "trench")],
    "transport": [("fOrbit", "orbit"), ("fPod", "pod"), ("fProfile", "profile"), ("fTunnel", "tunnel")],
    "spaceport": [("fPlan", "plan"), ("fFuel", "fuel"), ("fPit", "pit"), ("fTurn", "turn"), ("fPad", "pad")],
    "life": [("fLoop", "loops"), ("fAir", "air"), ("fWater", "water"), ("fFood", "food"), ("fDose", "dose")],
    "space": [("fLink", "link"), ("fDelay", "delay"), ("fMoons", "moons"), ("fYear", "year")],
    "phases": [("fBuild", "build"), ("fWaves", "waves"), ("fGrowth", "growth")],
}
SHEETS = [("svg-elev", "a001-crown-birdseye"), ("svg-compare", "a002-size-check"), ("svg-site", "a101-site-corridor"),
          ("svg-growth", "a102-city-growth"), ("svg-crown", "a201-crown-main-floor"), ("svg-pent", "a301-pentagon-L1"),
          ("svg-sec", "a401-section"), ("svg-port", "a501-spaceport"), ("svg-flight", "a601-flight")]
# close views (tens of km) need the real tiles to look right, so only the far views are exported
ATLAS = [("mars", "__atlas.jump('mars')", 9000), ("arcadia", "__atlas.jump('arcadia')", 9000)]

def save(png, path):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if path.endswith(".jpg"):
        im.save(path, "JPEG", quality=86, optimize=True, progressive=True)
    else:
        im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)
    print("  ", os.path.relpath(path, REPO), os.path.getsize(path) // 1024, "KB", flush=True)

async def page(ctx, url):
    pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("https://astro.arcgis.com/**", lambda r: r.abort())
    await pg.goto(url, wait_until="load")
    await pg.evaluate("document.fonts.ready.then(function () { return 1; })")
    await pg.add_style_tag(content=".bar{position:static !important}")
    await pg.wait_for_timeout(600)
    if errs: print("   script errors:", errs)
    return pg

async def shot(pg, sel, path):
    el = await pg.query_selector(sel)
    if not el: print("   missing", sel); return
    await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(150)
    has_img = await el.evaluate("e => !!e.querySelector('image')")
    if has_img and path.endswith(".png"): path = path[:-4] + ".jpg"
    save(await el.screenshot(), path)

async def run():
    srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            ctx = await b.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=SCALE, color_scheme="light")
            if WHAT in ("book", "all"):
                os.makedirs(os.path.join(OUT, "book"), exist_ok=True)
                for ch, figs in BOOK.items():
                    if ONLY and ch not in ONLY: continue
                    print(ch, flush=True)
                    pg = await page(ctx, "http://localhost:%d/palace/design/%s.html" % (PORT, ch))
                    for fid, name in figs:
                        await shot(pg, "#" + fid, os.path.join(OUT, "book", "%s-%s.png" % (ch, name)))
                    if ch == "pentagon":
                        for i in range(1, 5):
                            await pg.click("#lvb button:nth-child(%d)" % (i + 1)); await pg.wait_for_timeout(200)
                            await shot(pg, "#fPlan", os.path.join(OUT, "book", "pentagon-plan-L%d.png" % (i + 1)))
                    await pg.close()
            if WHAT in ("plans", "all"):
                PL = os.path.join(OUT, "..", "archive", "img", "plans-rev-b"); os.makedirs(PL, exist_ok=True)
                print("plans", flush=True)
                pg = await page(ctx, "http://localhost:%d/palace/archive/plans-rev-b/" % PORT)       # the Rev B sheets, archived
                for sid, name in SHEETS:
                    await shot(pg, "#" + sid, os.path.join(PL, name + ".png"))
                for lv in ["L2", "L3", "L4", "L5"]:
                    await pg.click("#lv-" + lv); await pg.wait_for_timeout(200)
                    await shot(pg, "#svg-pent", os.path.join(PL, "a301-pentagon-%s.png" % lv))
                await pg.close()
            if WHAT in ("atlas", "all"):
                os.makedirs(os.path.join(OUT, "atlas"), exist_ok=True)
                print("atlas", flush=True)
                actx = await b.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=1, color_scheme="dark")
                await actx.add_init_script("window.__atlasDebug = true;")
                pg = await actx.new_page()
                three = open(THREE, encoding="utf-8").read()
                await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
                await pg.route("https://astro.arcgis.com/**", lambda r: r.abort())
                await pg.goto("http://localhost:%d/palace/design/atlas/" % PORT, wait_until="load")
                await pg.wait_for_function("!!window.__atlas", timeout=300000); await pg.wait_for_timeout(4000)
                await pg.add_style_tag(content="#top,#card,#layersBtn,#layers,#ctl,#toast{display:none !important}")
                for name, js, wait in ATLAS:
                    await pg.evaluate(js); await pg.wait_for_timeout(wait)
                    save(await pg.screenshot(), os.path.join(OUT, "atlas", name + ".jpg"))
                await actx.close()
            await b.close()
    finally:
        srv.kill()
asyncio.run(run())
