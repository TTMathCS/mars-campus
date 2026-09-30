"""Headless screenshots of demo 2 (the Crown), for checking the build without a GPU.
usage: python3 palace/tools/crown_shot.py '[["name", "js to run before the shot", waitMs], ...]' [WxH]
Run ./build.sh debug first; this loads palace/palace-debug.html from a local server at the repo root.
The page exposes window.__crown (see src/99_main.js). Shots land in palace/tools/out/.
WebGL runs in SwiftShader, so each frame takes seconds; the JS should call __crown.frame() itself."""
import asyncio, sys, os, json, subprocess, time
from playwright.async_api import async_playwright
TOOLS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
SHOTS = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["view", "__crown.frame()", 100]]
W, H = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "960x540").split("x"))
THREE_LOCAL = os.path.join(TOOLS, "three.min.js")

async def main():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8781"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await (await b.new_context(viewport={"width": W, "height": H})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            pg.on("console", lambda m: print("CON", m.type, m.text[:2000]) if m.type in ("error", "warning") else None)
            if os.path.exists(THREE_LOCAL):
                three = open(THREE_LOCAL, encoding="utf-8").read()
                await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            t0 = time.time()
            await pg.goto("http://localhost:8781/palace/palace-debug.html")
            await pg.wait_for_function("window.__crownReady === true", timeout=300000)
            print("ready", round(time.time() - t0, 1), "s")
            for name, js, wait in SHOTS:
                t1 = time.time()
                r = await pg.evaluate(js) if js else None
                if r is not None: print("  ->", r)
                await pg.wait_for_timeout(wait)
                await pg.screenshot(path=os.path.join(OUT, name + ".png"), timeout=300000)
                print("shot", name, round(time.time() - t1, 1), "s")
            await b.close()
    finally:
        srv.kill()
asyncio.run(main())
