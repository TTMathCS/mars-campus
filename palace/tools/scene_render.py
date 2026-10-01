"""Render a design book picture from one of the render scenes in palace/tools/, headless (SwiftShader).
usage: python3 palace/tools/scene_render.py orb|mars ['{"key": value, ...}'] [out.jpg]
  orb   palace/tools/orb_scene.html  -> palace/design/img/orb-universe.jpg (1600 x 900): inside the Orb, the universe on
  mars  palace/tools/mars_scene.html -> palace/design/img/atlas-teaser.jpg (1200 x 760): Mars from orbit, for the Atlas
Rendered at 1.5 times the size and scaled down. The JSON keys are the view options of the scene's __scene.render().
The finished views are the defaults in each scene, so a plain "scene_render.py orb" remakes the book's picture.
Put three.js r128 at palace/tools/three.min.js (git-ignored) when the CDN can't be reached."""
import asyncio, sys, os, io, json, time, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
THREE = os.path.join(TOOLS, "three.min.js")
SCENES = {"orb": ("orb_scene.html", "orb-universe.jpg", 1600, 900), "mars": ("mars_scene.html", "atlas-teaser.jpg", 1200, 760)}
NAME = sys.argv[1] if len(sys.argv) > 1 else "orb"
PAGE, IMG, W, H = SCENES[NAME]
OPTS = json.loads(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].strip() else {}
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(REPO, "palace", "design", "img", IMG)
SS, PORT = 1.5, 8796

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Q, directory=REPO)) as s: s.serve_forever()

async def main():
    threading.Thread(target=serve, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await (await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=SS)).new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        if os.path.exists(THREE):
            three = open(THREE, encoding="utf-8").read()
            await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        t0 = time.time()
        await pg.goto("http://127.0.0.1:%d/palace/tools/%s" % (PORT, PAGE))
        await pg.wait_for_function("window.__scene && window.__scene.ready", timeout=120000)
        await pg.evaluate("o => window.__scene.render(o)", OPTS)
        await pg.wait_for_timeout(300)
        png = await pg.screenshot(timeout=600000)
        im = Image.open(io.BytesIO(png)).convert("RGB").resize((W, H), Image.LANCZOS)
        im.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
        print("wrote", OUT, round(time.time() - t0), "s", "errors:", errs or "none")
        await b.close()
asyncio.run(main())
