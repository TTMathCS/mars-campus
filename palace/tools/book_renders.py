"""Render the design book's pictures from demo 2, without the on-screen display.
usage: python3 palace/tools/book_renders.py [name,name,...]    (default: all)
Run ./build.sh debug first. Loads palace/palace-debug.html in headless Chromium (SwiftShader, so each
frame takes several seconds), sets up each view through window.__crown and saves a 1600 x 900 JPEG to
palace/design/img/<name>.jpg (or RENDER_OUT). Views are either a time in the flight video (the director's camera) or a
fixed camera. Takes about a minute to load and 20-40 s per picture."""
import asyncio, sys, os, subprocess, time, io
from playwright.async_api import async_playwright
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
IMG = os.environ.get("RENDER_OUT") or os.path.join(REPO, "palace", "design", "img"); os.makedirs(IMG, exist_ok=True)   # RENDER_OUT=dir to try views without touching the book
THREE = os.path.join(TOOLS, "three.min.js")
W, H = 1600, 900
HIDE = "['load','shot','data','radar','bar','ctl','welcome','start','end'].forEach(function(id){ var e = document.getElementById(id); if (e) e.hidden = true; }); 1"
# A fixed camera: SHOT(camera x, y, z, target x, y, z, fov, sun elevation, sun azimuth, flight time for the pod, beam 0/1, exposure)
SHOT = """function SHOT(px, py, pz, tx, ty, tz, fov, el, az, podT, beam, ex) {
  UI.st.started = true; UI.st.playing = false; UI.st.look = false; UI.st.mode = "director";
  MAIN.seek(podT); MAIN.step(0);
  setSun(el, az); CROWN.aimMirrors();
  MAT.winCol.value.set(0.9, 0.56, 0.3).multiplyScalar(0.45 + 1.35 * smooth(4.5, 1.2, el));
  CROWN.orbU.uGlowOn.value = smooth(4.5, 1.6, el); CROWN.beamU.uBeam.value = beam; U.uStorm.value = 0;
  camera.position.set(px, py, pz); camera.up.set(0, 1, 0); camera.lookAt(tx, ty, tz); camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  SHADOW.set(tx * 0.5, 50, tz * 0.5, 260);
  U.uCam.value.copy(camera.position); TERRAIN.update(camera.position); SKYMESH.position.copy(camera.position);
  SHADOW.render(); CROWN.updateOrb(true);
  POST.u.uExp.value = ex; POST.u.uFlash.value = 0;
  U.uCam.value.copy(camera.position); POST.render(U.uTime.value, false); return 1; }"""
# name: js run through __crown.ev inside the page (FLIGHT, CROWN, U, camera ... are in scope). "SHOT(" views are fixed cameras.
RENDERS = [
    ["crown-sunset", "SHOT(-507, 20, 237, 0, 58, 0, 36, 7, 262, DIRECTOR.END, 0, 1.2)"],
    ["crown-day", "SHOT(262, 64, 430, 0, 52, 0, 40, 30, 262, DIRECTOR.END, 0, 1.0)"],
    ["crown-garden", "SHOT(-40, 1.8, 66, 4, 60, -14, 74, 28, 262, DIRECTOR.END, 0, 1.05)"],
    ["crown-hangar", "__crown.at(FLIGHT.WT[46] - 1.0)"],
    ["crown-hangar2", "__crown.at(FLIGHT.WT[46] + 0.4)"],
    ["site-aerial", "SHOT(-760, 460, 980, 40, 10, -20, 36, 18, 262, DIRECTOR.END, 0, 1.0)"],
    ["port-aerial", "SHOT(28300, 420, 1500, 30600, 10, -250, 40, 18, 262, DIRECTOR.END, 0, 1.0)"],
    ["port-liftoff", "__crown.at(5.5)"],
    ["flight-west", "__crown.at(46)"],
    ["flight-dunes", "__crown.at(77)"],
    ["flight-crater", "__crown.at(FLIGHT.WT[16] + 4)"],
    ["flight-cliffs", "__crown.at(FLIGHT.WT[22] + 3)"],
    ["flight-breakout", "__crown.at(FLIGHT.WT[31] + 1.5)"],
]
async def main():
    want = sys.argv[1].split(",") if len(sys.argv) > 1 else None
    srv = subprocess.Popen(["python3", "-m", "http.server", "8785"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await (await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1)).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            three = open(THREE, encoding="utf-8").read()
            await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            t0 = time.time()
            await pg.goto("http://localhost:8785/palace/palace-debug.html")
            await pg.wait_for_function("window.__crownReady === true", timeout=400000)
            print("ready", round(time.time() - t0), "s", flush=True)
            await pg.evaluate("__crown.ev(%r)" % ("window.SHOT = " + SHOT.replace("function SHOT", "function") + "; 1"))
            for name, js in RENDERS:
                if want and name not in want: continue
                t1 = time.time()
                await pg.evaluate("__crown.ev(%r)" % HIDE)
                if js.startswith("SHOT("):
                    await pg.evaluate("__crown.ev(%r)" % js)
                    await pg.evaluate("__crown.ev(%r)" % js)   # twice: the Orb and the screens catch up
                else:
                    await pg.evaluate("__crown.ev(%r)" % js)
                    await pg.evaluate("__crown.ev(%r)" % "CROWN.updateOrb(true); 1")
                    await pg.evaluate("__crown.step(2)")
                await pg.evaluate("__crown.ev(%r)" % HIDE)
                png = await pg.screenshot(timeout=300000)
                Image.open(io.BytesIO(png)).convert("RGB").save(os.path.join(IMG, name + ".jpg"), "JPEG", quality=86, optimize=True, progressive=True)
                print("render", name, round(time.time() - t1), "s", flush=True)
            await b.close()
    finally:
        srv.kill()
asyncio.run(main())
