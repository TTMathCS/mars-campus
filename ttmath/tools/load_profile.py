"""How long the page takes to load, phase by phase, on a slow machine (Jim, 8 Oct 2026: "now the page loading is getting
slower and slower, even not finish loading on some old pc"). Loads the source page with the CPU slowed down (default 4x,
roughly an old laptop), records when the terrain is in, when the campus is built (the loading screen goes), when the
traced light is done, the JS heap at each point, and a CPU profile of the main thread from the start to the campus built;
prints the functions that took the most time.
usage: python3 ttmath/tools/load_profile.py [--cpu 4] [--no-profile] [--top 30] [--gl] [--heap] [--heap-limit MB]"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
from _page import TOOLS, write_test_page, serve, prepare, GPU_ARGS

ARGS = sys.argv[1:]
CPU = float(ARGS[ARGS.index("--cpu") + 1]) if "--cpu" in ARGS else 4.0
TOP = int(ARGS[ARGS.index("--top") + 1]) if "--top" in ARGS else 30
PROFILE = "--no-profile" not in ARGS
GL = "--gl" in ARGS
LIMIT = ARGS[ARGS.index("--heap-limit") + 1] if "--heap-limit" in ARGS else None   # MB: the JS heap an old PC's browser allows (about a quarter of its memory)
HEAP = "--heap" in ARGS     # what the live heap holds once the campus is built, by the function that allocated it
# --gl: every texture upload, buffer upload and shader link, its size and how long the call took
GL_HOOK = """(function(){ var L = window.__GLLOG = [];
  function wrap(P, name, info) { var f = P[name]; if (!f) return; P[name] = function () { var t = performance.now(), r = f.apply(this, arguments); L.push([name, info(arguments), performance.now() - t]); return r; }; }
  function src(a) { var o = a[a.length - 1]; return o && o.width !== undefined ? [o.width, o.height, (o.constructor && o.constructor.name) || '?'] : [a[3], a[4], a[8] ? a[8].constructor.name : 'null']; }
  [window.WebGLRenderingContext, window.WebGL2RenderingContext].forEach(function (C) { if (!C) return; var P = C.prototype;
    wrap(P, 'texImage2D', function (a) { var s = src(a); return { w: s[0], h: s[1], src: s[2], lvl: a[1], type: a.length > 6 ? a[a.length - 2] : a[4] }; });
    wrap(P, 'texSubImage2D', function (a) { var s = src(a); return { w: s[0], h: s[1], src: s[2], lvl: a[1] }; });
    wrap(P, 'texImage3D', function (a) { return { w: a[3], h: a[4], d: a[5] }; });
    wrap(P, 'generateMipmap', function () { return {}; });
    wrap(P, 'bufferData', function (a) { var d = a[1]; return { bytes: typeof d === 'number' ? d : (d ? d.byteLength : 0) }; });
    wrap(P, 'linkProgram', function () { return {}; });
    wrap(P, 'compileShader', function () { return {}; });
  }); })();"""
GL_SUM = """(function(){ var L = window.__GLLOG || [], by = {};
  L.forEach(function (e) { var k = e[0], b = by[k] || (by[k] = { n: 0, ms: 0, mb: 0 }); b.n++; b.ms += e[2];
    if (e[1].bytes) b.mb += e[1].bytes / 1048576; else if (e[1].w) b.mb += e[1].w * e[1].h * 4 / 1048576; });
  var tex = L.filter(function (e) { return e[0] === 'texImage2D' || e[0] === 'texSubImage2D' || e[0] === 'generateMipmap'; }).map(function (e, i) { return [e[0], e[1].w, e[1].h, e[1].src, e[1].lvl, Math.round(e[2])]; });
  tex.sort(function (a, b) { return b[5] - a[5]; });
  var buf = L.filter(function (e) { return e[0] === 'bufferData'; }).map(function (e) { return e[1].bytes; }).sort(function (a, b) { return b - a; });
  return { by: by, tex: tex.slice(0, 40), ntex: tex.length, buf: buf.slice(0, 12) }; })()"""
# when the page itself set __marsReady (the probe can only look once the page is free, after its first frames)
READY_HOOK = """(function(){ var v; Object.defineProperty(window, '__marsReady', { configurable: true, get: function () { return v; }, set: function (x) { v = x; if (x && !window.__marsReadyAt) window.__marsReadyAt = performance.now(); } }); })();"""
PROBE = """(function(){ var m = performance.memory || {}; return { heap: Math.round((m.usedJSHeapSize || 0) / 1048576), ready: !!window.__marsReady,
  bake: (function(){ try { return __mars._eval('BAKE.done ? BAKE.ms : (BAKE.worker ? -1 : -2)'); } catch (e) { return null; } })(),
  load: (document.getElementById('loading') && !document.getElementById('loading').hidden) ? (document.querySelector('#loading') ? document.querySelector('#loading').innerText.slice(0, 80) : '') : 'hidden' }; })()"""


def summarize(profile, top):
    """self time per function (name, url line) from a CDP CPU profile"""
    nodes = {n["id"]: n for n in profile["nodes"]}
    self_t = {}
    samples, deltas = profile.get("samples", []), profile.get("timeDeltas", [])
    for sid, dt in zip(samples, deltas):
        n = nodes[sid]; cf = n["callFrame"]; key = "%s:%d" % (cf["functionName"] or "(anon)", cf["lineNumber"] + 1)
        self_t[key] = self_t.get(key, 0) + dt
    tot = sum(self_t.values()) or 1
    rows = sorted(self_t.items(), key=lambda kv: -kv[1])[:top]
    return tot / 1000.0, [(k, v / 1000.0, 100.0 * v / tot) for k, v in rows]


def heap_report(hp, top):
    """live bytes by allocating function, and by the campus function above it"""
    own, chain = {}, {}
    def walk(n, path):
        cf = n["callFrame"]; key = "%s:%d" % (cf["functionName"] or "(anon)", cf["lineNumber"] + 1); p2 = path + [key]
        if n["selfSize"]:
            own[key] = own.get(key, 0) + n["selfSize"]
            c = " < ".join(p2[::-1][:4]); chain[c] = chain.get(c, 0) + n["selfSize"]
        for c in n.get("children", []): walk(c, p2)
    walk(hp["head"], [])
    tot = sum(own.values())
    print("\nlive heap after the build (sampled): %.0f MB" % (tot / 1048576))
    for k, v in sorted(own.items(), key=lambda kv: -kv[1])[:top]: print("  %7.1f MB  %s" % (v / 1048576, k))
    print("by call chain:")
    for k, v in sorted(chain.items(), key=lambda kv: -kv[1])[:top]: print("  %7.1f MB  %s" % (v / 1048576, k))


async def main():
    page = write_test_page("_test_lp.html"); srv = serve(8775)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=GPU_ARGS + ["--enable-precise-memory-info", "--js-flags=--expose-gc" + (" --max-old-space-size=" + LIMIT if LIMIT else "")])
            crashed = []
            ctx = await b.new_context(viewport={"width": 1280, "height": 720})
            pg = await ctx.new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            pg.on("crash", lambda: (crashed.append(1), print("PAGE CRASHED (out of memory?)", flush=True)))
            await prepare(pg)
            if GL: await pg.add_init_script(GL_HOOK)
            await pg.add_init_script(READY_HOOK)
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": CPU})
            if HEAP:
                await cdp.send("HeapProfiler.enable"); await cdp.send("HeapProfiler.startSampling", {"samplingInterval": 32768})
            if PROFILE:
                await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", {"interval": 1000}); await cdp.send("Profiler.start")
            t0 = time.time(); marks = []
            await pg.goto("http://localhost:8775/_test_lp.html")
            last = None
            while True:
                if crashed: break
                try: pr = await pg.evaluate(PROBE)
                except Exception as e: print("probe failed:", str(e)[:120]); break
                el = round(time.time() - t0, 1)
                state = (pr["ready"], pr["bake"] if pr["bake"] is not None and pr["bake"] >= 0 else None, pr["load"][:40])
                if state != last:
                    try: hu = await cdp.send("Runtime.getHeapUsage")
                    except Exception: hu = {}
                    marks.append((el, pr)); last = state
                    print("%6.1f s  heap %4d MB  buffers %4d MB  ready %-5s  bake %-6s  %s" % (el, pr["heap"], hu.get("backingStorageSize", 0) / 1048576, pr["ready"], pr["bake"], pr["load"][:60]), flush=True)
                if pr["ready"] and HEAP and "hp" not in locals():
                    await asyncio.sleep(2.0); await cdp.send("HeapProfiler.collectGarbage")
                    hp = (await cdp.send("HeapProfiler.getSamplingProfile"))["profile"]; await cdp.send("HeapProfiler.stopSampling")
                    heap_report(hp, TOP)
                if pr["ready"] and PROFILE and "prof" not in locals():
                    prof = (await cdp.send("Profiler.stop"))["profile"]
                if pr["ready"] and pr["bake"] is not None and pr["bake"] >= 0:
                    at = await pg.evaluate("[window.__marsReadyAt, __mars._eval('[BAKE.t0, BAKE.quickMs || 0, BAKE.ms]')]")
                    print("the page: campus built at %.1f s; the bake started %.1f s later, its quick light after %.1f s, done after %.1f s" % (at[0] / 1000, (at[1][0] - at[0]) / 1000, at[1][1] / 1000, at[1][2] / 1000))
                    break
                if el > 1500: print("gave up after 25 min"); break
                await asyncio.sleep(1.0)
            if GL:
                await asyncio.sleep(5.0); g = await pg.evaluate(GL_SUM)
                print("\nGL calls (count, ms in the call, MB):")
                for k, v in sorted(g["by"].items(), key=lambda kv: -kv[1]["ms"]): print("  %-16s %6d  %9.0f ms  %8.1f MB" % (k, v["n"], v["ms"], v["mb"]))
                print("slowest of %d texture calls (call, w, h, source, level, ms):" % g["ntex"])
                for t in g["tex"]: print("  ", t)
                print("biggest buffers (MB):", [round(b / 1048576, 1) for b in g["buf"]])
            if PROFILE and "prof" in locals():
                tot, rows = summarize(prof, TOP)
                print("\nmain thread, start to campus built: %.1f s of samples (CPU x%g)" % (tot, CPU))
                for k, s, pc in rows: print("  %7.2f s  %5.1f %%  %s" % (s, pc, k))
                json.dump(prof, open(os.path.join(TOOLS, "out", "load_profile.cpuprofile"), "w"))
            await b.close()
    finally:
        srv.kill(); os.remove(page)

if __name__ == "__main__":
    asyncio.run(main())
