"""Load the BUILT demo 1 page (ttmath/index.html, as GitHub Pages serves it) and take one courtyard screenshot."""
import asyncio, time, os
from playwright.async_api import async_playwright
from _page import TOOLS, serve, prepare, GPU_ARGS
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
async def main():
    srv = serve(8771)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 1100, "height": 650})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            t0 = time.time(); await pg.goto("http://localhost:8771/ttmath/")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000); print("ready", round(time.time() - t0, 1))
            await pg.evaluate("__mars.lockQuality(0.7); __mars.hideUI(); document.querySelectorAll('.hud,.compass,.onboard,.toast,.pin').forEach(function(e){e.style.display='none'}); __mars.view('court')")
            await pg.wait_for_timeout(9000); await pg.screenshot(path=os.path.join(OUT, "site_court.png"), timeout=300000); print("shot", round(time.time() - t0, 1))
            await b.close()
    finally:
        srv.kill()
asyncio.run(main())
