"""Screenshots of the demo 1 source page.
usage: python3 ttmath/tools/shot.py desk|small|mobile '[["name", "js to run", hideUI(true/false), waitMs], ...]' [--sample]
Shots land in ttmath/tools/out/. --sample also writes campus_pts.json for hidden.py."""
import asyncio, sys, time, json, os
from playwright.async_api import async_playwright
from _page import TOOLS, write_test_page, serve, prepare, GPU_ARGS
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
MODE = sys.argv[1] if len(sys.argv) > 1 else "desk"
SHOTS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
SAMPLE = "--sample" in sys.argv
HIDE = "document.querySelectorAll('.hud,.compass,.joy,.actbtns,.timepill,.onboard,.toast,.pin,.skylabel,.sheet,.podbar').forEach(function(e){e.style.display='none'});"
async def main():
    page = write_test_page("_test_tt.html"); srv = serve(8767)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            if MODE == "desk": ctx = await b.new_context(viewport={"width": 1100, "height": 650}); q = 0.7
            elif MODE == "small": ctx = await b.new_context(viewport={"width": 800, "height": 470}); q = 0.75
            else: ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True); q = 0.8
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            pg.on("console", lambda m: print("CON", m.type, m.text[:1500]) if m.type in ("error", "warning") and "fonts" not in m.text and "ERR_FAILED" not in m.text else None)
            await prepare(pg)
            t0 = time.time()
            await pg.goto("http://localhost:8767/_test_tt.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            print("ready in", round(time.time() - t0, 1), "s", await pg.evaluate("JSON.stringify(__mars.state())"))
            if SAMPLE:
                pts = await pg.evaluate("JSON.stringify(__mars.campusSample(4))")
                open(os.path.join(TOOLS, "campus_pts.json"), "w").write(pts); print("sample points", len(json.loads(pts)))
            await pg.evaluate(f"__mars.lockQuality({q})")
            await pg.wait_for_timeout(3000)
            for shot in SHOTS:
                name, js, hide = shot[0], shot[1], shot[2]
                wait = shot[3] if len(shot) > 3 else 5000
                if hide: await pg.evaluate("__mars.hideUI();" + HIDE)
                if js: await pg.evaluate(js)
                await pg.wait_for_timeout(wait)
                await pg.screenshot(path=os.path.join(OUT, name + ".png"), timeout=300000)
                print("shot", name, await pg.evaluate("JSON.stringify(__mars.state())"), round(time.time() - t0, 1))
            await b.close()
    finally:
        srv.kill(); os.remove(page)
asyncio.run(main())
