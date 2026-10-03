"""Headless screenshots of the Crown's main floor (palace/crown/index.html?debug), for checking it without a GPU.
usage: python3 palace/archive/3d-demo/tools/crown_in_shot.py '[["name", "js", frames], ...]' [WxH]
Loads the page from a local server at the repo root, waits for window.__crownInReady, then for each shot runs the js,
renders that many frames of 1/60 s (the debug page has no loop of its own) and saves palace/tools/out/<name>.png.
window.__crownIn has enter() (hides the card and opens the Door, which walks you in), at(bearing, radius, yawDeg,
pitchDeg), look(dBearing, inward, pitchDeg) (look along the ring), time("sunrise"|"noon"|"sunset"|"night"|"storm"),
step(n) and ev("js") (ME, DOOR, glideTo(b), probe(true) ... are in scope). Each frame takes a few seconds in
SwiftShader, and the light probe adds six renders every 14 m, so keep frame counts low.
Example: '[["salon", "__crownIn.enter(); __crownIn.ev(\\"ME.script = null\\"); __crownIn.at(154, 129.4); __crownIn.look(6, -1.5, -4)", 3]]'"""
import asyncio, os, subprocess, time, sys, json
from playwright.async_api import async_playwright
TOOLS = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(TOOLS, "..", "..", "..", ".."))
OUT = os.path.join(TOOLS, "out"); os.makedirs(OUT, exist_ok=True)
THREE = os.path.join(REPO, "palace", "tools", "three.min.js")
SHOTS = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["crown", "__crownIn.enter()", 2]]
W, H = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "960x540").split("x"))
async def main():
    srv = subprocess.Popen(["python3", "-m", "http.server", "8790"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1); errs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await (await b.new_context(viewport={"width": W, "height": H})).new_page()
            pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
            pg.on("console", lambda m: errs.append(m.type + " " + m.text[:300]) if m.type in ("error", "warning") and "ERR_FAILED" not in m.text and "RGB format" not in m.text else None)
            if os.path.exists(THREE):
                three = open(THREE, encoding="utf-8").read()
                await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
            await pg.route("https://fonts.*/**", lambda r: r.abort())
            t0 = time.time(); await pg.goto("http://localhost:8790/palace/archive/3d-demo/crown/index.html?debug")
            await pg.wait_for_function("window.__crownInReady === true", timeout=400000)
            print("ready", round(time.time() - t0, 1), "s", flush=True)
            for name, js, n in SHOTS:
                t1 = time.time()
                if js: await pg.evaluate(js)
                await pg.evaluate("__crownIn.step(%d)" % n)
                await pg.screenshot(path=os.path.join(OUT, name + ".png"), timeout=600000)
                print("shot", name, round(time.time() - t1, 1), "s", flush=True)
            await b.close()
    finally:
        srv.kill()
    print("errors:", errs if errs else "none")
asyncio.run(main())
