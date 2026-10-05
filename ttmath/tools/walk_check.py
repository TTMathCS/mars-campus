"""Walking regression test: run before every push. Walks the routes a visitor takes, with the page's own walker, and
fails if any of them stops short: from the start over the ridge, through the courtyard, into a wing, into the palace,
out of the back door onto the terrace, into the Crescent and a classroom, down its stair, out into its garden gallery, to
the Sun court; then boards the pod at the pod stop, flies it up and lands it again.
usage: python3 ttmath/tools/walk_check.py [--built]   (--built: the published ttmath/index.html, else the source page)
Exit code 1 if a walk fails."""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
from _page import write_test_page, serve, prepare, GPU_ARGS
BUILT = "--built" in sys.argv
# each walk: name, setup JS (place the walker), the point to walk toward (palace frame), seconds, and a JS test of the end state
# (o: palLoc of the end point, y: the walker's ground; the frame's names are in scope through __mars._eval)
WALKS = [
    ("start over the ridge", "__mars.go(0, 0)", (0, 90), 20, "o.rad < 92"),
    ("through the courtyard", "__mars.palGo(0, 60)", (0, 40), 6, "o.rad < 52"),
    ("into the palace", "__mars.palGo(0, 38)", (0, 24), 9, "o.rad < 30"),
    ("into the right wing (lobby)", "__mars._eval('(function(){var p=wingXZ(1,-2.5,53);__mars.go(p.x,p.z);})()')", None, 4, "(o.lat - latf(o.rad)) > 0.8", "wing1"),
    ("out of the back door", "__mars.palGo(0, -24.6, 'B')", (0, -40), 9, "o.rad < -38"),
    ("into the Crescent", "__mars.palGo(0, -40)", (0, -52), 7, "o.rad < -50"),
    ("down the Crescent's stair", "__mars._eval('(function(){var p=crsPt(CRS.stairR0-0.3, CRS.stairA);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "stair", 10, "y < CRS.yL + 0.05"),
    ("out into the garden gallery", "__mars._eval('(function(){var p=crsPt(57.0, 0);__mars.go(p.x,p.z,CRS.yL+0.1);})()')", (0, -70), 7, "o.r > 66 && y < CRS.yL + 0.05"),
    ("into a classroom (Euclid)", "__mars._eval('(function(){var d=P2.crescent.rooms.filter(function(r){return r.code===\\\"T06-02\\\";})[0].doors[0],p=crsPt(47.8, d);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "room", 6, "o.r > CRS.rc + 1.0"),
    ("to the Sun court", "__mars.palGo(22.8, 68)", (25.5, 52), 12, "o.rad < 56"),
]


async def main():
    port = 8773
    if not BUILT: write_test_page("_test_walk.html")
    srv = serve(port); failed = 0
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS)
            pg = await (await b.new_context(viewport={"width": 800, "height": 470})).new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await prepare(pg)
            t0 = time.time()
            await pg.goto("http://localhost:%d/%s" % (port, "ttmath/" if BUILT else "_test_walk.html"))
            await pg.wait_for_function("window.__marsReady===true", timeout=400000)
            print("ready in", round(time.time() - t0, 1), "s,", "built page" if BUILT else "source page")
            for w in WALKS:
                name, setup, to, secs, test = w[:5]
                await pg.evaluate(setup)
                if to == "stair": brg = "__mars._eval('(function(){var p=crsPt(CRS.stairR0-0.3, CRS.stairA),q=crsPt(62, CRS.stairA);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                elif to == "room": brg = "__mars._eval('(function(){var d=P2.crescent.rooms.filter(function(r){return r.code===\"T06-02\";})[0].doors[0],p=crsPt(47.8, d),q=crsPt(56, d);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                elif len(w) > 5 and w[5] == "wing1": brg = "__mars._eval('(function(){var p=wingXZ(1,-2.5,53),q=wingXZ(1,3,53);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                else: brg = "__mars.palBrg(%f, %f)" % to
                path = await pg.evaluate("JSON.stringify(__mars.sim(%s, %f))" % (brg, secs))
                ok = await pg.evaluate("__mars._eval(%s)" % json.dumps("(function(){var o=palLoc(px,pz,{}),y=ground;return !!(%s);})()" % test))
                end = json.loads(path)[-1]
                print("%-30s %s   end lat %.1f rad %.1f y %.2f" % (name, "PASS" if ok else "FAIL", end[0], end[1], end[4]))
                failed += 0 if ok else 1
            # the pod: board it at the pod stop, climb, hover, land it again and step out
            st = await pg.evaluate("(function(){__mars.pod('board');__mars.pod('keys',[' ']);__mars.pod('run',3);__mars.pod('keys',[]);var up=__mars.pod('run',3);__mars.pod('land');var down=__mars.pod('run',20);return JSON.stringify([up,down]);})()")
            up, down = json.loads(st); ok = up["flying"] and up["alt"] > 15 and not down["flying"] and abs(down["px"] - down["x"]) + abs(down["pz"] - down["z"]) < 8
            print("%-30s %s   up %.1f m, landed at %.1f %.1f, out at %.1f %.1f" % ("fly the pod and land it", "PASS" if ok else "FAIL", up["alt"], down["x"], down["z"], down["px"], down["pz"]))
            failed += 0 if ok else 1
            await b.close()
    finally:
        srv.terminate()
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "_test_walk.html")) and not BUILT:
        os.remove(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "_test_walk.html"))
    print("ALL WALKS PASS" if not failed else "%d WALK(S) FAILED" % failed)
    sys.exit(1 if failed else 0)


asyncio.run(main())
