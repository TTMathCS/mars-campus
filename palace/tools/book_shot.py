"""Screenshots of the design book pages (palace/design/*.html) for checking.
usage: python3 palace/tools/book_shot.py site,crown [light|dark|all] [phone]
For each page writes to palace/tools/out/: book_<page>_<mode>_top.png (first screen), one PNG per
section (book_<page>_<mode>_s<N>.png, 1280 px wide) and, with "phone", a full-page shot at 400 px wide.
Reports script errors, missing images and horizontal overflow of the page. Web fonts are swapped for
local stand-ins, so text in the shots runs a little wider than on the live page."""
import asyncio, sys, os, subprocess, time, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
FONTCSS = """
@font-face{font-family:'Saira Condensed';font-weight:400 700;src:local('DejaVu Sans Condensed');}
@font-face{font-family:'Barlow';font-weight:400 600;src:local('Liberation Sans');}
@font-face{font-family:'IBM Plex Mono';font-weight:400 600;src:local('DejaVu Sans Mono');}
"""
PAGES = (sys.argv[1] if len(sys.argv) > 1 else "index").split(",")
WHICH = sys.argv[2] if len(sys.argv) > 2 else "light"
PHONE = len(sys.argv) > 3 and sys.argv[3] == "phone"
PORT = 8784
TILES = os.environ.get("TILES", "fake")   # fake: cut test tiles from img/mars-map.jpg, outlined; none: tiles fail, the real base map shows alone
MAP = None
def fake_tile(z, y, x):
    global MAP
    if MAP is None: MAP = Image.open(os.path.join(REPO, "palace", "design", "img", "mars-map.jpg")).convert("RGB")
    span = 180 / 2 ** z; lonE = (-180 + x * span) % 360; latN = 90 - y * span; kx = MAP.width / 360; ky = MAP.height / 180
    im = MAP.crop((int(lonE * kx), int((90 - latN) * ky), int((lonE + span) * kx), int((90 - latN + span) * ky))).resize((512, 512))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 511, 511], outline=(255, 255, 0), width=2); d.text((8, 8), "%d/%d/%d" % (z, y, x), fill=(255, 255, 0))
    b = io.BytesIO(); im.save(b, "JPEG", quality=80); return b.getvalue()
async def run():
    srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for page in PAGES:
                url = "http://localhost:%d/palace/design/%s" % (PORT, "" if page == "index" else page + ".html")
                for mode in (["light", "dark"] if WHICH == "all" else [WHICH]):
                    sizes = [(1280, 900, "d")] + ([(400, 860, "m")] if PHONE else [])
                    for (w, h, tag) in sizes:
                        ctx = await b.new_context(viewport={"width": w, "height": h}, color_scheme=mode)
                        pg = await ctx.new_page(); errs = []; missing = []
                        pg.on("pageerror", lambda e: errs.append(str(e)))
                        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
                        pg.on("response", lambda r: missing.append(r.url.split("/palace/")[-1]) if r.status >= 400 else None)
                        pg.on("requestfailed", lambda r: missing.append("failed: " + r.url[-60:]) if "arcgis" not in r.url and "fonts" not in r.url else None)
                        await pg.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body=FONTCSS, content_type="text/css"))
                        await pg.route("https://fonts.gstatic.com/**", lambda r: r.abort())
                        async def tile(route):
                            if TILES == "none": await route.abort(); return
                            q = route.request.url.split("/"); z, y, x = int(q[-3]), int(q[-2]), int(q[-1])
                            await route.fulfill(body=fake_tile(z, y, x), content_type="image/jpeg")
                        await pg.route("https://astro.arcgis.com/**", tile)
                        await pg.goto(url, wait_until="load")
                        await pg.evaluate("Array.from(document.images).forEach(function(i){ i.loading = 'eager'; })")
                        await pg.wait_for_timeout(700)
                        sw = await pg.evaluate("document.documentElement.scrollWidth")
                        print(page, mode, tag, "errors:", errs or "none", "| missing:", missing or "none", "| page width", sw, "of", w)
                        if tag == "d":
                            await pg.screenshot(path=f"{OUT}/book_{page}_{mode}_top.png", clip={"x": 0, "y": 0, "width": w, "height": h})
                            await pg.add_style_tag(content=".bar{position:static !important}")
                            hero = await pg.query_selector("figure.hero")
                            if hero: await hero.screenshot(path=f"{OUT}/book_{page}_{mode}_hero.png")
                            secs = await pg.query_selector_all("section.part")
                            for i, el in enumerate(secs):
                                await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(120)
                                await el.screenshot(path=f"{OUT}/book_{page}_{mode}_s{i + 1}.png")
                        else:
                            await pg.screenshot(path=f"{OUT}/book_{page}_{mode}_phone.png", full_page=True)
                        await ctx.close()
            await b.close()
    finally:
        srv.kill()
asyncio.run(run())
