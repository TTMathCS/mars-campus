"""Headless screenshots of the Orb (palace/orb/index.html?debug), for checking it without a GPU.
usage: python3 palace/archive/3d-demo/tools/orb_shot.py '[["name", "js", frames], ...]' [WxH]
Loads the page from a local server at the repo root, waits for window.__orbReady and the planet maps, then for each
shot runs the js, renders that many frames of 1/60 s (the debug page has no loop of its own) and saves
palace/tools/out/<name>.png. window.__orb has enter(), on(true|false), set(level) (web, mw, sol, mars, arc, home,
earth), go(level) (zoom there), view(x, y, z, yawDeg, pitchDeg), step(n), send() and ev("js").
Example: '[["mars", "__orb.enter(); __orb.on(true); __orb.set(\\"mars\\")", 30], ["gate", "__orb.send()", 300]]'
The weather service is blocked, so Earth's weather shows as not set."""
import asyncio, os, subprocess, time, sys, json
from playwright.async_api import async_playwright
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", "..", "..", ".."))
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
THREE = os.path.join(REPO, "palace", "tools", "three.min.js")
SHOTS = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["orb", "__orb.enter()", 2]]
W, H = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "960x540").split("x"))
async def main():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8789"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1); errs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await (await b.new_context(viewport={"width": W, "height": H})).new_page()
            pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
            pg.on("console", lambda m: errs.append(m.type + " " + m.text[:300]) if m.type in ("error", "warning") and "ERR_FAILED" not in m.text else None)
            if os.path.exists(THREE):
                three = open(THREE, encoding="utf-8").read()
                await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            await pg.route("https://*open-meteo.com/**", lambda r: r.abort())
            t0 = time.time(); await pg.goto("http://localhost:8789/palace/archive/3d-demo/orb/index.html?debug")
            await pg.wait_for_function("window.__orbReady === true", timeout=400000)
            await pg.wait_for_function("window.__orb.pending() === 0", timeout=120000)
            print("ready", round(time.time() - t0, 1), "s", flush=True)
            for name, js, n in SHOTS:
                t1 = time.time()
                if js: await pg.evaluate(js)
                await pg.evaluate("__orb.step(%d)" % n)
                await pg.screenshot(path=os.path.join(OUT, name + ".png"), timeout=600000)
                print("shot", name, round(time.time() - t1, 1), "s", flush=True)
            await b.close()
    finally:
        srv.kill()
    print("errors:", errs if errs else "none")
asyncio.run(main())
