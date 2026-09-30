"""Shared helpers for the demo 1 test scripts. They test the SOURCE page (ttmath/src/page.html), served from
the repo root so the shared terrain in data/ loads. Needs Python 3 with playwright and a Chromium build.
If three.min.js (r128) can't be fetched from the CDN, put a copy at ttmath/tools/three.min.js or
palace/tools/three.min.js (both are git-ignored) and the scripts serve it locally."""
import os, subprocess, time
TOOLS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(TOOLS, "..", ".."))
SRC = os.path.join(REPO, "ttmath", "src", "page.html")
HEAD = ("<!doctype html><html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1,viewport-fit=cover'>"
        "<script>window.MARS_DATA_BASE='data/';window.MARS_LOGO_URL='ttmath/logo.png';</script>"
        "</head><body style='margin:0'>")
def write_test_page(name):
    path = os.path.join(REPO, name)
    open(path, "w", encoding="utf-8").write(HEAD + open(SRC, encoding="utf-8").read() + "</body></html>")
    return path
def serve(port):
    p = subprocess.Popen(["python3", "-m", "http.server", str(port)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return p
def local_three():
    for c in (os.path.join(TOOLS, "three.min.js"), os.path.join(REPO, "palace", "tools", "three.min.js")):
        if os.path.exists(c):
            return open(c, encoding="utf-8").read()
    return None
async def prepare(pg):
    """Route three.js to a local copy when there is one, and skip web fonts."""
    three = local_three()
    if three:
        await pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
    await pg.route("https://fonts.*/**", lambda r: r.abort())
GPU_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
