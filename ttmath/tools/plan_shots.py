"""Pictures of the phase 2 plan for checking by eye: every drawing (svg-*.svg, site-plan.svg) and every page of
ttmath/plan/, at desktop and phone width, saved to ttmath/tools/out/plan_<name>[_phone].png.
usage: python3 ttmath/tools/plan_shots.py [name ...]   (names without extension; none = all)"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from _page import serve
TOOLS = os.path.dirname(os.path.abspath(__file__)); PLAN = os.path.join(os.path.dirname(TOOLS), "plan"); OUT = os.path.join(TOOLS, "out")
os.makedirs(OUT, exist_ok=True)


async def main(names):
    srv = serve(8771)                                     # serves the repository root
    files = sorted(f for f in os.listdir(PLAN) if f.endswith((".svg", ".html")))
    if names: files = [f for f in files if os.path.splitext(f)[0] in names]
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for f in files:
                url = "http://127.0.0.1:8771/ttmath/plan/" + f; n = os.path.splitext(f)[0]
                for tag, vw in (("", 1240), ("_phone", 390)) if f.endswith(".html") else (("", 1240),):
                    pg = await b.new_page(viewport={"width": vw, "height": 900})
                    await pg.goto(url, wait_until="networkidle")
                    shot = os.path.join(OUT, "plan_%s%s.png" % (n, tag))
                    if f.endswith(".svg"): await (await pg.query_selector("svg")).screenshot(path=shot, timeout=180000)   # a full-page shot of an svg document hangs
                    else: await pg.screenshot(path=shot, full_page=True, timeout=180000)
                    wide = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
                    print(f, tag or "desktop", "OVERFLOWS SIDEWAYS" if wide else "ok")
                    await pg.close()
            await b.close()
    finally:
        srv.terminate()


asyncio.run(main(sys.argv[1:]))
