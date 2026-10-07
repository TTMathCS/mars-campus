"""Walking regression test: run before every push. Walks the routes a visitor takes, with the page's own walker, and
fails if any of them stops short: from the start over the ridge, in through the entrance airlock (its two pairs of doors
open in turn), into the Gate Hall and through it into the garden ring, into the palace, out of its back door, into the
Ring's hall, down its stair, out into the garden gallery, into a classroom, down the Gate Hall's stair, into the sunken
grove, through the pod lounge and the glass bridge to the docked pod; then boards the pod at the dock, flies it up and
lands it again (it docks again and you step out into the collar).
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
    ("in through the airlock", "__mars.palGo(0, 92)", (0, 70), 16, "o.rad < 79"),
    ("into the Gate Hall", "__mars.palGo(0, 66)", (0, 50), 8, "o.rad < 56"),
    ("through it into the garden", "__mars.palGo(0, 54)", (0, 38), 8, "o.rad < 44"),
    ("into the palace", "__mars.palGo(0, 42)", (0, 24), 12, "o.rad < 30"),
    ("out of the back door", "__mars.palGo(0, -24.6, 'B')", (0, -40), 9, "o.rad < -38"),
    ("into the Ring's hall", "__mars.palGo(0, -40)", (0, -52), 7, "o.rad < -50"),
    ("down the hall's stair", "__mars._eval('(function(){var p=crsPt(CRS.stairR0-0.3, CRS.stairA);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "stair", 10, "y < CRS.yL + 0.05"),
    ("out into the garden gallery", "__mars._eval('(function(){var p=crsPt(57.0, 0);__mars.go(p.x,p.z,CRS.yL+0.1);})()')", (0, -70), 7, "o.r > 66 && y < CRS.yL + 0.05"),
    ("into a classroom (Euclid)", "__mars._eval('(function(){var d=P2.ring.rooms.filter(function(r){return r.code===\\\"T06-02\\\";})[0].doors[0],p=crsPt(47.8, d);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "room", 6, "o.r > CRS.rc + 1.0"),
    ("down the Gate Hall's stair", "__mars._eval('(function(){var p=crsPt(CRS.gst.r0-0.3, CRS.gst.a);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "gstair", 10, "y < CRS.yL + 0.05"),
    ("into the sunken grove", "__mars._eval('(function(){var p=crsPt(47.8, 252*D2R);__mars.go(p.x,p.z,CRS.yL+0.1);})()')", "grove", 6, "o.r < 44 && y < CRS.yL + 0.05"),
    ("over the bridge to the pod", "__mars._eval('(function(){var p=crsPt(57.0, P2.pod_dock.a*D2R);__mars.go(p.x,p.z,CRS.yU+0.1);})()')", "dock", 9, "o.r > 69.5 && Math.abs(y - CRS.yU) < 0.05"),
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
                elif to == "room": brg = "__mars._eval('(function(){var d=P2.ring.rooms.filter(function(r){return r.code===\"T06-02\";})[0].doors[0],p=crsPt(47.8, d),q=crsPt(56, d);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                elif to == "gstair": brg = "__mars._eval('(function(){var p=crsPt(CRS.gst.r0-0.3, CRS.gst.a),q=crsPt(62, CRS.gst.a);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                elif to == "dock": brg = "__mars._eval('(function(){var a=P2.pod_dock.a*D2R,p=crsPt(57.0, a),q=crsPt(75, a);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                elif to == "grove": brg = "__mars._eval('(function(){var p=crsPt(47.8, 252*D2R),q=crsPt(38, 252*D2R);return Math.atan2(q.x-p.x,-(q.z-p.z))*180/Math.PI;})()')"
                else: brg = "__mars.palBrg(%f, %f)" % to
                path = await pg.evaluate("JSON.stringify(__mars.sim(%s, %f))" % (brg, secs))
                ok = await pg.evaluate("__mars._eval(%s)" % json.dumps("(function(){var o=palLoc(px,pz,{}),y=ground;return !!(%s);})()" % test))
                end = json.loads(path)[-1]
                print("%-30s %s   end lat %.1f rad %.1f y %.2f" % (name, "PASS" if ok else "FAIL", end[0], end[1], end[4]))
                failed += 0 if ok else 1
            # the pod: board it at the dock, climb, hover, land it again (it docks) and step out into the collar
            st = await pg.evaluate("(function(){__mars.pod('board');__mars.pod('keys',[' ']);__mars.pod('run',3);__mars.pod('keys',[]);var up=__mars.pod('run',3);__mars.pod('land');var down=__mars.pod('run',20);return JSON.stringify([up,down]);})()")
            up, down = json.loads(st); ok = up["flying"] and up["alt"] > 15 and not down["flying"] and down.get("docked") and abs(down["px"] - down["x"]) + abs(down["pz"] - down["z"]) < 8
            print("%-30s %s   up %.1f m, landed at %.1f %.1f%s, out at %.1f %.1f" % ("fly the pod and land it", "PASS" if ok else "FAIL", up["alt"], down["x"], down["z"], " (docked)" if down.get("docked") else "", down["px"], down["pz"]))
            failed += 0 if ok else 1
            await b.close()
    finally:
        srv.terminate()
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "_test_walk.html")) and not BUILT:
        os.remove(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "_test_walk.html"))
    print("ALL WALKS PASS" if not failed else "%d WALK(S) FAILED" % failed)
    sys.exit(1 if failed else 0)


asyncio.run(main())
