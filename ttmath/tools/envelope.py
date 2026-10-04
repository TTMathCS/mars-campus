"""How tall a building may be, anywhere round the campus, and still stay hidden from the start point (CP-1).
usage: python3 ttmath/tools/envelope.py   (then envelope_map.py draws it; needs numpy and Pillow)
Samples the page's own ground (the real NASA mesh near the start, the simulated land beyond) along rays from the
start, every 2 degrees from bearing 250 to 40 and every metre out to 360 m, and writes ttmath/tools/out/envelope.json:
for each ray the ground and the highest point still hidden behind the ground nearer the start (eye 1.7 m up)."""
import asyncio, json, os, time
from playwright.async_api import async_playwright
from _page import TOOLS, write_test_page, serve, prepare, GPU_ARGS
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
SAMPLE = """(function(){
  var out = { az: [], d: [], g: [] }, D = [];
  for (var d = 0.5; d <= 360; d += (d < 140 ? 0.5 : 1.0)) D.push(+d.toFixed(1));
  out.d = D;
  for (var az = 250; az <= 400; az += 2) {
    var a = az * Math.PI / 180, sx = Math.sin(a), sz = -Math.cos(a), row = [];
    for (var i = 0; i < D.length; i++) row.push(+groundAt(sx * D[i], sz * D[i], 0).toFixed(3));
    out.az.push(az % 360); out.g.push(row);
  }
  out.g0 = +groundAt(0, 0, 0).toFixed(3);
  return out; })()"""


async def main():
    page = write_test_page("_test_env.html"); srv = serve(8769)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 640, "height": 400})).new_page()
            await prepare(pg)
            t0 = time.time()
            await pg.goto("http://localhost:8769/_test_env.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            print("ready in", round(time.time() - t0, 1), "s")
            await pg.evaluate("__mars.lockQuality(0.3)")
            data = await pg.evaluate("__mars._eval(%s)" % json.dumps(SAMPLE))
            e = data["g0"] + 1.7
            # line of sight: a point at distance d is hidden below e + max_{t<d} (g(t) - e) * d / t
            hid = []
            for row in data["g"]:
                s, h = -1e9, []
                for d, g in zip(data["d"], row):
                    h.append(round(e + s * d - g, 2) if s > -1e8 else 0.0)
                    s = max(s, (g - e) / d)
                hid.append(h)
            data["hidden"] = hid
            data["campus"] = [[q[0], q[2]] for q in await pg.evaluate("__mars.campusSample(25)")]        # today's buildings, seen from above
            json.dump(data, open(os.path.join(OUT, "envelope.json"), "w"))
            print("rays", len(data["az"]), "samples", len(data["d"]), round(time.time() - t0, 1), "s")
            await b.close()
    finally:
        srv.kill(); os.remove(page)
asyncio.run(main())
