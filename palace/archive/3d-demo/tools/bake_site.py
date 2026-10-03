"""Bake the demo's local terrain into a top-down map image for the Mars Atlas.
Renders the debug build of demo 2 from straight above in 2 km blocks (a very long lens, so it is
almost orthographic), with no haze, sky, buildings or vignette, and a map-style sun from the
north-west. Writes palace/design/atlas/site-terrain.jpg covering x -6..34 km, z -6..6 km (10 m/px)."""
import asyncio, os, subprocess, time, base64, io, sys
from playwright.async_api import async_playwright
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", "..", "..", ".."))
THREE = os.path.join(REPO, "palace", "tools", "three.min.js")
X0, X1, Z0, Z1, BLK, PX = -6000, 34000, -6000, 6000, 2000, 800
OUTM = 10.0   # metres per output pixel
SETUP = """(function(){ var e = __crown.ev;
  e("UI.st.started = true; UI.st.playing = false; ['shot','data','bar','radar'].forEach(function(id){ var el = document.getElementById(id); if (el) el.hidden = true; }); document.getElementById('start').hidden = true; 1");
  e("PORT.grp.visible = false; CROWN.grp.visible = false; POD.g.visible = false; SKYMESH.visible = false; U.uShadowOn.value = 0; U.uHazeDen.value = 0; TERRAIN.ag.value = 0; 1");
  e("scene.traverse(function(o){ if ((o.isPoints || o.isLineSegments || (o.isMesh && o.geometry && o.geometry.isInstancedBufferGeometry)) && TERRAIN.levels.indexOf(o) < 0) o.visible = false; }); scene.children.forEach(function(o){ if (o !== SKYMESH && TERRAIN.levels.indexOf(o) < 0 && o.type === 'Group') o.visible = false; }); 1");
  e("POST.u.uVig.value = 0; POST.u.uGrain.value = 0; POST.u.uBloom.value = 0; POST.u.uExp.value = 1.55; POST.u.uFlash.value = 0; POST.u.uTint.value.set(1,1,1); U.uStorm.value = 0; setSun(38, 315); MAT.winCol.value.set(0,0,0); 1");
  e("camera.fov = 0.5; camera.aspect = 1; camera.near = 1000; camera.far = 400000; camera.updateProjectionMatrix(); 1");
  return 1; })()"""
def block_js(cx, cz):
    h = BLK / 2 / __import__('math').tan(0.25 * 3.14159265 / 180)   # height so the block fills the view
    return """(function(){ var e = __crown.ev; e("camera.position.set(%f, %f, %f); camera.up.set(0, 0, -1); camera.lookAt(%f, 0, %f); camera.updateMatrixWorld(); U.uCam.value.copy(camera.position); TERRAIN.update(camera.position); U.uTime.value = 0; POST.render(0, false); 1"); return e("renderer.domElement.toDataURL('image/png')"); })()""" % (cx, h, cz, cx, cz)
async def main():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8783"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await (await b.new_context(viewport={"width": PX, "height": PX}, device_scale_factor=1)).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            three = open(THREE, encoding="utf-8").read()
            await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            await pg.goto("http://localhost:8783/palace/archive/3d-demo/palace-debug.html")
            await pg.wait_for_function("window.__crownReady === true", timeout=300000)
            await pg.evaluate(SETUP)
            W = int((X1 - X0) / OUTM); H = int((Z1 - Z0) / OUTM)
            out = Image.new("RGB", (W, H))
            nb = 0; t0 = time.time()
            TEST = os.environ.get("BAKE_TEST")
            ZS = range(Z0 + BLK // 2, Z1, BLK); XS = range(X0 + BLK // 2, X1, BLK)
            if TEST: ZS = [-1000, 1000]; XS = [-1000, 1000, 13000]
            for zc in ZS:
                for xc in XS:
                    url = await pg.evaluate(block_js(xc, zc))
                    im = Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB")
                    s = int(BLK / OUTM)
                    im = im.resize((s, s), Image.LANCZOS)
                    out.paste(im, (int((xc - BLK / 2 - X0) / OUTM), int((zc - BLK / 2 - Z0) / OUTM)))
                    nb += 1
                    if nb % 10 == 0: print("blocks", nb, round(time.time() - t0), "s", flush=True)
            dst = os.path.join(REPO, "palace", "design", "atlas", "site-terrain.jpg")
            if TEST: dst = os.path.join(os.environ.get("TMPDIR", "/tmp"), "site-test.jpg")
            out.save(dst, "JPEG", quality=86, optimize=True, progressive=True)
            print("wrote", dst, out.size, os.path.getsize(dst) // 1024, "KB")
            await b.close()
    finally:
        srv.kill()
asyncio.run(main())
