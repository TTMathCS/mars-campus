"""Run JavaScript in the demo 1 source page and print the results. Arguments are JS snippets or files.
A result that is a data:image URL is saved as ttmath/tools/out/dump_N.png. The page exposes __mars._eval(expr)
for reaching internal functions, for example: python3 ttmath/tools/evalpage.py "__mars._eval('PAL.R')" """
import asyncio, sys, os, base64
from playwright.async_api import async_playwright
from _page import TOOLS, write_test_page, serve, prepare, GPU_ARGS
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
JS = [open(a).read() if os.path.exists(a) else a for a in sys.argv[1:]]
async def main():
    page = write_test_page("_eval_tt.html"); srv = serve(8769)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 320, "height": 200})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            await pg.goto("http://localhost:8769/_eval_tt.html")
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            for n, js in enumerate(JS):
                r = await pg.evaluate(js)
                if isinstance(r, str) and r.startswith("data:image"):
                    fn = os.path.join(OUT, "dump_%d.png" % n); open(fn, "wb").write(base64.b64decode(r.split(",", 1)[1])); print("saved", fn)
                else:
                    print(r)
            await b.close()
    finally:
        srv.kill(); os.remove(page)
asyncio.run(main())
