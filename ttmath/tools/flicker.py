"""Flicker check for the signs: does a sign shimmer as you walk up to it?
usage: python3 ttmath/tools/flicker.py [tag]
For each viewpoint it takes three shots: A, A again (the scene's own movement), and B after a 2 cm step toward the
sign, and saves the sign's crop of each to ttmath/tools/out/flk_<tag>_<view>_{a,a2,b}.png with the crop box in
flk_<tag>.json. Compare them with flicker_score.py (needs numpy and Pillow).
Steady shading changes a little between A and B; shimmer (specular aliasing, depth fighting) changes a lot."""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
from _page import TOOLS, write_test_page, serve, prepare, GPU_ARGS
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
TAG = sys.argv[1] if len(sys.argv) > 1 else "now"
HIDE = "document.querySelectorAll('.hud,.compass,.joy,.actbtns,.timepill,.onboard,.toast,.pin,.skylabel,.sheet').forEach(function(e){e.style.display='none'});"
# the logo wall by the path: in front of it along its normal, at d metres; the crest over the palace door: down the avenue
SETUP = """(function(){
  var V = {};
  var c = SIGNP.c, n = SIGNP.n, gR = SIGNP.gR, wc = [c.x + n.x * 0.15, gR + 0.75, c.z + n.z * 0.15];
  [24, 14, 7].forEach(function (d) { V['wall' + d] = { cam: [c.x + n.x * d, c.z + n.z * d], at: wc, box: [[-2.5, 0.05], [2.5, 1.5]], kind: 'wall' }; });
  var cy = PALY.front + vaultH(PAL.vFront) + 0.55 + 0.7, cc = palXZ(0, PAL.vFront - 0.15);
  [55, 32, 16].forEach(function (d) { var p = palXZ(0, PAL.vFront + d); V['crest' + d] = { cam: [p.x, p.z], at: [cc.x, cy, cc.z], kind: 'crest' }; });
  return V; })()"""
POSE = """(function(cx, cz, ax, ay, az, step){
  var dx = ax - cx, dz = az - cz, L = Math.hypot(dx, dz); cx += dx / L * step; cz += dz / L * step;
  __mars.go(cx, cz); var st = __mars.state(), ey = st.y + 1.7;
  __mars.look(Math.atan2(dx, -dz) * 180 / Math.PI, Math.atan2(ay - ey, L - step) * 180 / Math.PI);
  return [cx, cz]; })(%f, %f, %f, %f, %f, %f)"""
# the screen box of a sign: corners projected with the page's camera
BOX = """(function(kind){
  var pts = [];
  if (kind === 'wall') { for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { var p = SIGNP.at(i ? 2.5 : -2.5, SIGNP.T / 2); pts.push(new THREE.Vector3(p.x, SIGNP.gR + (j ? 1.5 : 0.05), p.z)); } }
  else { var y0 = PALY.front + vaultH(PAL.vFront) + 0.1, y1 = y0 + 2.2; [-3, 3].forEach(function (s) { var p = palXZ(s, PAL.vFront - 0.15); pts.push(new THREE.Vector3(p.x, y0, p.z), new THREE.Vector3(p.x, y1, p.z)); }); }
  camera.updateMatrixWorld(); var W = renderer.domElement.clientWidth, H = renderer.domElement.clientHeight, x0 = 1e9, y0b = 1e9, x1 = -1e9, y1b = -1e9;
  pts.forEach(function (v) { v.project(camera); var X = (v.x + 1) / 2 * W, Y = (1 - v.y) / 2 * H; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0b = Math.min(y0b, Y); y1b = Math.max(y1b, Y); });
  return [Math.max(0, Math.floor(x0) - 6), Math.max(0, Math.floor(y0b) - 6), Math.min(W, Math.ceil(x1) + 6), Math.min(H, Math.ceil(y1b) + 6)]; })('%s')"""


async def main():
    page = write_test_page("_test_flk.html"); srv = serve(8768)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            ctx = await b.new_context(viewport={"width": 1100, "height": 650}); pg = await ctx.new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            t0 = time.time()
            await pg.goto("http://localhost:8768/_test_flk.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            print("ready in", round(time.time() - t0, 1), "s")
            await pg.evaluate("__mars.lockQuality(0.85); __mars.hideUI();" + HIDE)
            await pg.wait_for_timeout(8000)                      # the traced light replaces the first bake
            views = await pg.evaluate("__mars._eval(%s)" % json.dumps(SETUP))
            meta = {}
            for name, v in views.items():
                for shot, step in (("a", 0.0), ("a2", 0.0), ("b", 0.02)):
                    await pg.evaluate("__mars._eval(%s)" % json.dumps(POSE % (v["cam"][0], v["cam"][1], v["at"][0], v["at"][1], v["at"][2], step)))
                    await pg.wait_for_timeout(2500)
                    if shot == "a": box = await pg.evaluate("__mars._eval(%s)" % json.dumps(BOX % v["kind"]))
                    clip = {"x": box[0], "y": box[1], "width": max(8, box[2] - box[0]), "height": max(8, box[3] - box[1])}
                    await pg.screenshot(path=os.path.join(OUT, "flk_%s_%s_%s.png" % (TAG, name, shot)), clip=clip, timeout=300000)
                meta[name] = box; print(name, box, round(time.time() - t0, 1))
            json.dump(meta, open(os.path.join(OUT, "flk_%s.json" % TAG), "w"))
            await b.close()
    finally:
        srv.kill(); os.remove(page)
asyncio.run(main())
