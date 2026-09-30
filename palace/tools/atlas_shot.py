"""Headless screenshots of the Mars Atlas (palace/design/atlas/).
usage: python3 palace/tools/atlas_shot.py '[["name", "js", waitMs], ...]' [WxH] [tiles]
tiles: "fake" (default) answers the OnMars tile requests with generated test tiles, so the tile
maths can be checked offline; "none" makes them fail, to see the simplified stand-in map.
The page exposes window.__atlas (see atlas.js) when window.__atlasDebug is set."""
import asyncio, sys, os, json, subprocess, time, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
SHOTS = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["atlas", "1", 3000]]
W, H = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "1280x720").split("x"))
MODE = sys.argv[3] if len(sys.argv) > 3 else "fake"
THREE = os.path.join(TOOLS, "three.min.js")
def fake_tile(layer, z, y, x):
    n = 2 ** z; span = 180 / n
    im = Image.new("RGB", (512, 512), ((x * 53 + z * 40) % 200 + 40, (y * 71 + z * 30) % 200 + 30, (z * 37) % 200 + 40) if layer == "MColorDEM" else (150 + (x * 13) % 60, 90 + (y * 17) % 50, 60))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 511, 511], outline=(255, 255, 255), width=3)
    d.text((20, 20), "%s z%d y%d x%d" % (layer, z, y, x), fill=(255, 255, 255))
    d.text((20, 40), "lon %.1f..%.1f" % (-180 + x * span, -180 + (x + 1) * span), fill=(255, 255, 255))
    d.text((20, 60), "lat %.1f..%.1f" % (90 - (y + 1) * span, 90 - y * span), fill=(255, 255, 255))
    b = io.BytesIO(); im.save(b, "JPEG", quality=80); return b.getvalue()
async def main():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8782"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            ctx = await b.new_context(viewport={"width": W, "height": H})
            await ctx.add_init_script("window.__atlasDebug = true;")
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            pg.on("console", lambda m: print("CON", m.type, m.text[:400]) if m.type in ("error", "warning") else None)
            three = open(THREE, encoding="utf-8").read()
            await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            async def tile(route):
                if MODE == "none": await route.abort(); return
                parts = route.request.url.split("/")
                layer = parts[parts.index("OnMars") + 1]; z, y, x = int(parts[-3]), int(parts[-2]), int(parts[-1])
                await route.fulfill(body=fake_tile(layer, z, y, x), content_type="image/jpeg", headers={"Access-Control-Allow-Origin": "*"})
            await pg.route("https://astro.arcgis.com/**", tile)
            t0 = time.time()
            await pg.goto("http://localhost:8782/palace/design/atlas/")
            await pg.wait_for_function("window.__atlas !== undefined", timeout=120000)
            print("ready", round(time.time() - t0, 1), "s")
            for name, js, wait in SHOTS:
                t1 = time.time()
                r = await pg.evaluate(js) if js else None
                if r is not None and r != 1: print("  ->", r)
                await pg.wait_for_timeout(wait)
                st = await pg.evaluate("JSON.stringify(window.__atlasState || {})")
                await pg.screenshot(path=os.path.join(OUT, name + ".png"))
                print("shot", name, round(time.time() - t1, 1), "s", st)
            await b.close()
    finally:
        srv.kill()
asyncio.run(main())
