"""Screenshots of the demo 2 floor plans page (palace/plans/index.html), one PNG per sheet.
usage: python3 palace/tools/plans_snap.py [light|dark|all]
Writes to palace/tools/out/. Web fonts are swapped for local stand-ins when Google Fonts can't be reached,
so text in the shots runs a little wider than on the live page. Also reports script errors and any
horizontal overflow of the page body."""
import asyncio, sys, os
from playwright.async_api import async_playwright
TOOLS = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(TOOLS, "..", "plans", "index.html")
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
FONTCSS = """
@font-face{font-family:'Saira Condensed';font-weight:400 700;src:local('DejaVu Sans Condensed');}
@font-face{font-family:'Barlow';font-weight:400 600;src:local('Liberation Sans');}
@font-face{font-family:'IBM Plex Mono';font-weight:400 500;src:local('DejaVu Sans Mono');}
"""
SHEETS = ["a001", "a002", "a101", "a102", "a201", "a301", "a401", "a501", "a601", "decide"]
which = sys.argv[1] if len(sys.argv) > 1 else "light"
async def run():
    html = open(PAGE, encoding="utf-8").read()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for mode in (["light", "dark"] if which == "all" else [which]):
            for (w, h, tag) in [(1280, 900, "d"), (400, 860, "m")]:
                ctx = await b.new_context(viewport={"width": w, "height": h}, color_scheme=mode)
                pg = await ctx.new_page(); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
                await pg.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body=FONTCSS, content_type="text/css"))
                await pg.route("https://fonts.gstatic.com/**", lambda r: r.abort())
                await pg.set_content(html, wait_until="load"); await pg.wait_for_timeout(400)
                sw = await pg.evaluate("document.documentElement.scrollWidth")
                print(mode, tag, "errors:", errs, "| body width", sw, "of", w)
                if tag == "d":
                    await pg.screenshot(path=f"{OUT}/{mode}_top.png", clip={"x": 0, "y": 0, "width": w, "height": 900})
                    for sid in SHEETS:
                        el = await pg.query_selector("#" + sid)
                        if el: await el.screenshot(path=f"{OUT}/{mode}_{sid}.png")
                    for lv in ["L2", "L3", "L4", "L5"]:
                        await pg.click("#lv-" + lv)
                        await (await pg.query_selector("#svg-pent")).screenshot(path=f"{OUT}/{mode}_pent_{lv}.png")
                else:
                    await pg.screenshot(path=f"{OUT}/{mode}_phone_full.png", full_page=True)
                await ctx.close()
        await b.close()
asyncio.run(run())
