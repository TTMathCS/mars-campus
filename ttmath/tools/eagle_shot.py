"""The campus from the air for the homepage's card (Jim, 8 Oct 2026: "replace ttmath on mars image with campus eagle
view best image"): ttmath/preview.jpg, which build.py also uses as the page's og:image. A free camera over the campus at
sunset, the page's own renderer at full quality, 1920 by 1080, saved as a 1280 by 720 JPEG.
usage: python3 ttmath/tools/eagle_shot.py [lat rad h look_lat look_rad look_h fov] | --finish (grade out/eagle.png again)
(the palace frame in metres: lat to the right, rad toward the start; heights over the Gate Hall's floor; fov vertical)"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from PIL import Image
from _page import TOOLS, REPO, write_test_page, serve, prepare, GPU_ARGS
CAM = [float(v) for v in sys.argv[1:8]] if len(sys.argv) >= 8 and "--finish" not in sys.argv else [-60.0, 135.0, 32.0, 0.0, 10.0, 2.0, 50.0]
HIDE = "document.querySelectorAll('.hud,.compass,.joy,.actbtns,.timepill,.onboard,.toast,.pin,.skylabel,.sheet,.podbar').forEach(function(e){e.style.display='none'});"
FCAM = """(function (lat, rad, h, llat, lrad, lh, fovv) {
  var p = palXZ(lat, rad), q = palXZ(llat, lrad), y = PALY.B + h, ly = PALY.B + lh, dx = q.x - p.x, dz = q.z - p.z;
  var yw = Math.atan2(-dx, -dz), pt = Math.atan2(ly - y, Math.hypot(dx, dz));
  updateViewer = function () { camera.position.set(p.x, y, p.z); camera.rotation.order = 'YXZ'; camera.rotation.set(pt, yw, 0); px = p.x; pz = p.z; py = y; yaw = yw; pitch = pt; };
  camera.near = Math.max(0.5, h / 60); setFov(fovv); camera.updateProjectionMatrix(); })(%s)"""


async def main():
    page = write_test_page("_test_eagle.html"); srv = serve(8774); png = os.path.join(TOOLS, "out", "eagle.png")
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 1920, "height": 1080})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            await pg.goto("http://localhost:8774/_test_eagle.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            await pg.evaluate("__mars.lockQuality(1.0)")
            await pg.evaluate("__mars.hideUI();" + HIDE)
            await pg.evaluate("__mars._eval(%s)" % json.dumps(FCAM % ",".join(repr(v) for v in CAM)))
            await pg.wait_for_timeout(60000)                                   # the traced light and the textures settle
            await pg.screenshot(path=png, timeout=900000)
            await b.close()
    finally:
        srv.kill(); os.remove(page)
    finish(png)


def finish(png):
    """levels as a photographer would set them: black at the darkest 0.3 %, white a little over the brightest 0.3 % (the
    render's dusk tops out at about 60 % grey), one curve for all three channels so the colours stay; then 1280 by 720"""
    im = Image.open(png).convert("RGB"); h = im.convert("L").histogram(); n = sum(h)
    def pct(q):
        acc = 0
        for v, c in enumerate(h):
            acc += c
            if acc >= q * n: return v
        return 255
    lo, hi = pct(0.003), pct(0.997) / 0.88
    im = im.point(lambda v: max(0, min(255, round((v - lo) * 255.0 / (hi - lo)))))
    out = os.path.join(REPO, "ttmath", "preview.jpg")
    im.resize((1280, 720), Image.LANCZOS).save(out, quality=86, optimize=True, progressive=True)
    print("wrote", out, os.path.getsize(out), "bytes; camera", CAM, "; levels", lo, round(hi))

if __name__ == "__main__":
    if "--finish" in sys.argv: finish(os.path.join(TOOLS, "out", "eagle.png"))       # grade the last render again
    else: asyncio.run(main())
