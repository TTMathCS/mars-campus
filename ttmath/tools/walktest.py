"""Walk tests for demo 1: set a start, walk legs toward wing points and print where the walker ends up.
Each test: (name, setup JS, legs [side, s, u, seconds]); seconds 0 means just long enough to get there."""
import asyncio, os
from playwright.async_api import async_playwright
from _page import write_test_page, serve, prepare, GPU_ARGS
T = [
    ("balcony -> link R -> foyer R", "__mars.palGo(9.0, 24.8, 'B')", [[1, 31.0, 2.57, 0], [1, 35.8, 3.4, 0]]),
    ("foyer R -> link R -> balcony", "__mars.wingGo(1, 35.8, 3.4)", [[1, 31.0, 2.57, 0], [1, 24.0, 0.0, 0]]),
    ("cafe -> foyer L", "__mars.wingGo(-1, 40.0, 4.3)", [[-1, 38.2, 4.2, 0], [-1, 35.5, 4.0, 0]]),
]
async def main():
    page = write_test_page("_walk_tt.html"); srv = serve(8770)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 320, "height": 200})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            await pg.goto("http://localhost:8770/_walk_tt.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            for name, setup, legs in T:
                await pg.evaluate(setup)
                out = [await pg.evaluate("JSON.stringify(__mars.wingLoc())")]
                for sg, s, u, secs in legs:
                    if not secs:
                        d = await pg.evaluate(f"(function(){{ var a = __mars._eval('wingXZ({sg},{u},{s})'), st = __mars.state(); return Math.hypot(a.x - st.px, a.z - st.pz); }})()")
                        secs = d / 2.0 + 0.3
                    await pg.evaluate(f"__mars.sim(__mars.wingBrg({sg},{s},{u}), {secs})")
                    out.append(await pg.evaluate("JSON.stringify(__mars.wingLoc())"))
                print("==", name); print("   ", " | ".join(out))
            await b.close()
    finally:
        srv.kill(); os.remove(page)
asyncio.run(main())
