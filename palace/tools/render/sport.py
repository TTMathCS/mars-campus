"""Baths and sport, sector 3 of L1, for Cycles: the rooms behind the thermal baths. Built in the sector's frame, as the
other Pentagon rooms (x along the ring, clockwise; y out from the atrium's glass; z up from L1's floor). Ring B runs
from y = 18.12 to 31.92, between the street behind the thermal baths and the street behind it.

The lap pool, 50 m (L1-23): all of ring B. A pool 50 m long and four lanes wide, 2 m deep, sunk in a deck of pale
travertine; lane ropes, starting blocks at one end, backstroke flags 5 m from each end, a pace clock; a ceiling of oak
slats with three long slots of sky; a band of glass onto the street on the inner side; loungers along the outer wall.
Training and lengths every day, water sports in low gravity, swimming lessons for visiting children.
  bvenv/bin/python blend/sport.py <room> <cam[,cam...]|pano:stop|plan:view> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, family, atrium, pent_rooms

A = lib.ASSETS
T36 = math.tan(math.radians(36))
Y0, Y1, HT = 18.12, 31.92, 7.6        # ring B, and the ceiling
PX0, PX1, PY0, PY1, PD = -25.0, 25.0, 21.2, 29.6, 2.0      # the pool: 50 m by 8.4 m, 2 m deep
LANES = 4
SKY = (20.2, 25.4, 30.6)              # the slots of sky across the ceiling, along the hall


def hw(y): return 14.41 + T36 * y     # the hall's half-length at y (the avenues beyond)


def tiles_material(name="pool tiles", base=(0.60, 0.78, 0.79), grout=(0.50, 0.62, 0.62), size=0.05):
    """the basin: small square glass tiles, pale aqua under 2 m of water, each one a little different"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.15
    tc = N.new("ShaderNodeTexCoord"); sp = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sp.inputs[0])
    cm = N.new("ShaderNodeCombineXYZ"); L.new(lib._math(nt, "ADD", sp.outputs["X"], sp.outputs["Z"]), cm.inputs[0]); L.new(lib._math(nt, "ADD", sp.outputs["Y"], sp.outputs["Z"]), cm.inputs[1])
    br = N.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.0025; br.inputs["Brick Width"].default_value = size; br.inputs["Row Height"].default_value = size; br.offset = 0.0
    br.inputs["Color1"].default_value = (*base, 1); br.inputs["Color2"].default_value = (base[0] * 0.92, base[1] * 0.95, base[2] * 0.96, 1); br.inputs["Mortar"].default_value = (*grout, 1)
    L.new(cm.outputs[0], br.inputs["Vector"]); L.new(br.outputs["Color"], b.inputs["Base Color"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.25; bm.inputs["Distance"].default_value = 0.002; L.new(lib._math(nt, "MULTIPLY", br.outputs["Fac"], -1.0), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def materials(M):
    P = lib.principled
    M["deck"] = atrium.pavers("pool deck")
    M["wall_trav"] = family.cladding(lib.travertine("hall travertine", (0.84, 0.74, 0.60), (0.74, 0.62, 0.47), 0.5, 1.3), 1.2, 0.6, 0.0, 0.0)
    M["tiles"] = tiles_material()
    M["line"] = tiles_material("lane line tiles", (0.03, 0.06, 0.16), (0.05, 0.08, 0.16))
    M["pool water"] = pent_rooms.pool_water("lap pool water", (0.74, 0.92, 0.92))
    M["rope_red"] = P("lane float red", (0.55, 0.04, 0.03), 0.35)
    M["rope_blue"] = P("lane float blue", (0.02, 0.10, 0.45), 0.35)
    M["rope_white"] = P("lane float white", (0.85, 0.85, 0.83), 0.35)
    M["flag_a"] = P("flag red", (0.62, 0.05, 0.04), 0.7); M["flag_b"] = P("flag white", (0.88, 0.88, 0.86), 0.7); M["flag_c"] = P("flag blue", (0.03, 0.12, 0.5), 0.7)
    M["block"] = P("block white", (0.85, 0.85, 0.83), 0.35); M["tread"] = P("block tread", (0.04, 0.12, 0.30), 0.85)
    M["stainless"] = P("stainless", (0.62, 0.62, 0.62), 0.2, 1.0)
    M["sky_slot"] = lib.emission("sky slot", (0.98, 0.97, 0.94), 4.0)
    M["towel"] = lib.fabric("towel", (0.86, 0.85, 0.82), 0.95, 0.6, 900, 0.5)
    M["kick"] = P("kickboard", (0.95, 0.75, 0.05), 0.5)
    M["kick2"] = P("kickboard blue", (0.05, 0.25, 0.65), 0.5)
    M["street"] = lib.plaster("street wall", (0.74, 0.70, 0.64))
    return M


def float_src(name, mat):
    src = bpy.data.objects.get(name + " float")
    if src is None:
        src = lib.cyl(name + " float", 0.05, 0.085, (0, 0, 0), mat, verts=16, bevel=0.014)
        src.data.transform(Matrix.Rotation(math.pi / 2, 4, "Y") @ Matrix.Translation((0, 0, -0.0425))); src.location = (0, 0, -500)
    return src


def lane_rope(M, y, z, x0, x1, pitch=0.1):
    """a lane rope: red floats for the last 5 m at each end, runs of blue and white between, threaded on a cable"""
    import club
    runs = {"red": [], "blue": [], "white": []}; x = x0 + 0.05; k = 0
    while x < x1 - 0.04:
        c = "red" if (x < x0 + 5.0 or x > x1 - 5.0) else ("blue" if (k // 10) % 2 == 0 else "white")
        runs[c].append((x, y, z)); x += pitch; k += 1
    for c, pts in runs.items():
        if pts: club.instancer("lane floats %s %.1f" % (c, y), pts, float_src(c, M["rope_" + c]), (0.0, 0.0, 0.0))


def lap_pool(M, rnd):
    materials(M)
    # the deck round the pool, the basin, the lines on its floor, the water, the lights under it
    e = lambda y: hw(y) + 0.3
    for poly in ([(-e(Y0 - 0.2), Y0 - 0.2), (e(Y0 - 0.2), Y0 - 0.2), (e(PY0), PY0), (-e(PY0), PY0)],
                 [(-e(PY0), PY0), (PX0, PY0), (PX0, PY1), (-e(PY1), PY1)],
                 [(PX1, PY0), (e(PY0), PY0), (e(PY1), PY1), (PX1, PY1)],
                 [(-e(PY1), PY1), (e(PY1), PY1), (e(Y1 + 0.3), Y1 + 0.3), (-e(Y1 + 0.3), Y1 + 0.3)]):
        lib.poly_prism("deck", poly, -0.3, 0.0, M["deck"])
    t = 0.3; zb = -PD
    lib.box("basin floor", (PX1 - PX0 + 2 * t, PY1 - PY0 + 2 * t, t), ((PX0 + PX1) / 2, (PY0 + PY1) / 2, zb - t / 2), M["tiles"])
    for (cx, cy, sx, sy) in (((PX0 + PX1) / 2, PY0 - t / 2, PX1 - PX0 + 2 * t, t), ((PX0 + PX1) / 2, PY1 + t / 2, PX1 - PX0 + 2 * t, t), (PX0 - t / 2, (PY0 + PY1) / 2, t, PY1 - PY0), (PX1 + t / 2, (PY0 + PY1) / 2, t, PY1 - PY0)):
        lib.box("basin wall", (sx, sy, PD + 0.3), (cx, cy, -PD / 2 - 0.15), M["tiles"])
    lw = (PY1 - PY0) / LANES
    for k in range(LANES):
        yc = PY0 + lw * (k + 0.5)
        lib.box("lane line", (PX1 - PX0 - 4.0, 0.25, 0.006), ((PX0 + PX1) / 2, yc, zb + 0.003), M["line"])
        for sx in (PX0 + 2.0, PX1 - 2.0): lib.box("lane line T", (0.25, 1.0, 0.006), (sx, yc, zb + 0.003), M["line"])
        for (sx, s_) in ((PX0, 1), (PX1, -1)):
            lib.box("wall target", (0.006, 0.25, 0.5), (sx + s_ * 0.003, yc, -0.3 - 0.25 - 0.0), M["line"])
            lib.box("wall target", (0.006, 0.5, 0.25), (sx + s_ * 0.003, yc, -0.55), M["line"])
    lib.box("lap pool water", (PX1 - PX0, PY1 - PY0, 0.002), ((PX0 + PX1) / 2, (PY0 + PY1) / 2, -0.12), M["pool water"])
    glow = lib.emission("pool light", (0.95, 0.95, 0.88), 28.0)
    x = PX0 + 2.5
    while x < PX1 - 1.0:
        for (yy, s_) in ((PY0 + 0.004, 1), (PY1 - 0.004, -1)):
            lib.cyl("underwater light", 0.12, 0.02, (x, yy, -0.75), glow, verts=24, rot=(s_ * math.pi / 2, 0, 0))
        x += 5.0
    # the gutter and the edge: a stone coping round the pool
    for (cx, cy, sx, sy) in (((PX0 + PX1) / 2, PY0 - 0.2, PX1 - PX0 + 0.8, 0.4), ((PX0 + PX1) / 2, PY1 + 0.2, PX1 - PX0 + 0.8, 0.4), (PX0 - 0.2, (PY0 + PY1) / 2, 0.4, PY1 - PY0), (PX1 + 0.2, (PY0 + PY1) / 2, 0.4, PY1 - PY0)):
        lib.box("coping", (sx, sy, 0.05), (cx, cy, 0.0), M["wall_trav"], bevel=0.01)
    # lane ropes: red for the last 5 m at each end, blue and white between
    for k in range(1, LANES):
        y = PY0 + lw * k
        lane_rope(M, y, -0.12, PX0, PX1)
        for sx in (PX0, PX1): lib.cyl("rope hook", 0.02, 0.1, (sx, y, -0.2), M["stainless"], verts=12)
    # starting blocks at the PX0 end
    for k in range(LANES):
        yc = PY0 + lw * (k + 0.5); x = PX0 - 0.45
        lib.box("block base", (0.5, 0.5, 0.62), (x, yc, 0.31), M["block"], bevel=0.02)
        top = lib.box("block top", (0.72, 0.52, 0.06), (x + 0.1, yc, 0.68), M["block"], bevel=0.015); top.rotation_euler = (0, math.radians(10), 0)
        tr = lib.box("block tread", (0.6, 0.48, 0.008), (x + 0.1, yc, 0.715), M["tread"]); tr.rotation_euler = (0, math.radians(10), 0)
        lib.box("block number", (0.004, 0.18, 0.18), (x - 0.252, yc, 0.42), lib.principled("block number", (0.02, 0.05, 0.2), 0.5))
        for s_ in (-1, 1): lib.cyl("backstroke grip", 0.014, 0.3, (x + 0.38, yc + s_ * 0.18, 0.5), M["stainless"], verts=10, rot=(0, math.pi / 2, 0))
    # backstroke flags 5 m from each end, across the pool on two posts
    for fx in (PX0 + 5.0, PX1 - 5.0):
        for yy in (PY0 - 1.0, PY1 + 1.0): lib.cyl("flag post", 0.03, 2.0, (fx, yy, 0.0), M["stainless"], verts=16)
        lib.cyl("flag cord", 0.004, PY1 - PY0 + 2.0, (fx, PY0 - 1.0, 1.9), M["rope_white"], verts=6, rot=(-math.pi / 2, 0, 0))
        y = PY0 - 0.8; k = 0
        while y < PY1 + 0.8:
            bm = bmesh.new(); vs = [bm.verts.new((fx, y, 1.9)), bm.verts.new((fx, y + 0.24, 1.9)), bm.verts.new((fx, y + 0.12, 1.66))]; bm.faces.new(vs)
            lib.mesh_obj("flag", bm, (M["flag_a"], M["flag_b"], M["flag_c"])[k % 3]); y += 0.3; k += 1
    # the hall: travertine walls; the inner wall with a band of glass onto the street; the ends along the avenues
    for (y, s_) in ((Y0, -1), (Y1, 1)):
        lib.box("hall wall", (2 * hw(y) + 1.0, 0.3, HT + 0.8), (0, y + s_ * 0.15, (HT + 0.8) / 2), M["wall_trav"])
    for sgn in (-1, 1):
        d = Vector((sgn * T36, 1.0)).normalized(); n = Vector((d.y, -d.x)) * sgn
        p0 = Vector((sgn * hw(Y0 - 0.3), Y0 - 0.3)); p1 = Vector((sgn * hw(Y1 + 0.3), Y1 + 0.3))
        lib.poly_prism("end wall", [tuple(p0), tuple(p1), tuple(p1 + n * 0.3), tuple(p0 + n * 0.3)], 0.0, HT + 0.8, M["wall_trav"])
    cut = lib.box("street window cut", (40.0, 1.0, 2.4), (0, Y0, 2.15), None); cut.hide_render = True; cut.hide_viewport = True
    for o in bpy.data.objects:
        if o.name.startswith("hall wall") and abs(o.location.y - (Y0 - 0.15)) < 0.01:
            bo = o.modifiers.new("window", "BOOLEAN"); bo.object = cut; bo.operation = "DIFFERENCE"; bo.solver = "EXACT"
    for i in range(11):
        x = -20.0 + 4.0 * i; lib.box("window mullion", (0.07, 0.2, 2.4), (x, Y0 - 0.15, 2.15), M["bronze"])
    lib.box("window glass", (40.0, 0.012, 2.4), (0, Y0 - 0.15, 2.15), M["glass"])
    for z in (0.95, 3.35): lib.box("window frame", (40.1, 0.22, 0.06), (0, Y0 - 0.15, z), M["bronze"])
    # the street beyond the glass, lit from above, and ring A's back wall across it
    lib.box("street floor", (60.0, 4.0, 0.1), (0, Y0 - 2.2, -0.05), M["deck"])
    lib.box("street far wall", (60.0, 0.3, 8.0), (0, Y0 - 4.3, 4.0), M["street"])
    lib.box("street sky", (60.0, 3.8, 0.05), (0, Y0 - 2.2, 8.0), lib.emission("street sky", (0.98, 0.96, 0.92), 14.0))
    for x in range(-24, 25, 8):
        furn.olive_tree("street olive", (x + 2.0, Y0 - 3.0, 0.4), 70 + x, M, height=3.0, leaves=9000)
        lib.box("street planter", (1.0, 1.0, 0.4), (x + 2.0, Y0 - 3.0, 0.2), M["travertine"], bevel=0.01)
    # the ceiling: oak slats on black felt, three slots of sky along the hall
    edges = [Y0 - 0.3] + [v for y in SKY for v in (y - 0.6, y + 0.6)] + [Y1 + 0.3]
    edges = sorted(min(max(e, Y0 - 0.3), Y1 + 0.3) for e in edges)
    for i in range(0, len(edges) - 1, 2):
        a, b = edges[i], edges[i + 1]
        if b - a < 0.05: continue
        lib.poly_prism("ceiling", [(-hw(a) - 0.4, a), (hw(a) + 0.4, a), (hw(b) + 0.4, b), (-hw(b) - 0.4, b)], HT, HT + 0.8, M["oak_slat"])
    for y in SKY:
        if Y0 < y < Y1: lib.box("sky slot", (2 * hw(y) + 0.8, 1.2, 0.02), (0, y, HT + 0.6), M["sky_slot"])
        a = lib.area_light("sky slot light", (0, min(max(y, Y0 + 0.7), Y1 - 0.7), HT - 0.02), 2 * hw(min(y, Y1)) - 2.0, 6000, (0.98, 0.97, 0.94), size_y=1.0)
    for (y, s_) in ((Y0 + 0.35, 1), (Y1 - 0.35, -1)):              # warm light washing up over the oak ceiling from both long walls
        lib.area_light("ceiling wash", (0, y, HT - 0.6), 2 * hw(y) - 3.0, 5000, (1.0, 0.80, 0.58), rot=(math.pi - s_ * 0.5, 0, 0), size_y=0.1)
        lib.box("cove", (2 * hw(y) - 2.0, 0.12, 0.03), (0, y, HT - 0.62), lib.emission("cove glow", (1.0, 0.82, 0.62), 6.0))
    # loungers and towels along the outer wall, kickboards on a rack, a pace clock on the end wall
    for x in (-18.0, -16.6, -6.9, -5.5, 5.5, 6.9, 16.6, 18.0):
        pent_rooms.lounger("lounger", (x, Y1 - 1.25, 0.0), 0.0, M)
    for x in (-17.3, -6.2, 6.2, 17.3): lib.cyl("lounger table", 0.2, 0.42, (x, Y1 - 0.6, 0.0), M["wall_trav"], verts=48)
    rx = PX1 + 3.0
    lib.box("kick rack", (1.4, 0.4, 1.1), (rx, Y1 - 0.4, 0.55), M["stainless"], bevel=0.01)
    for k in range(9):
        lib.box("kickboard", (0.04, 0.32, 0.45), (rx - 0.6 + k * 0.15, Y1 - 0.4, 1.2), M["kick"] if k % 3 else M["kick2"], bevel=0.015)
    cx, cy, cz = PX1 + 1.7, PY0 - 0.9, 2.3
    lib.cyl("clock pole", 0.04, cz - 0.6, (cx + 0.08, cy, 0.0), M["stainless"], verts=16)
    lib.cyl("clock foot", 0.3, 0.04, (cx + 0.08, cy, 0.0), M["stainless"], verts=32)
    lib.cyl("pace clock", 0.58, 0.08, (cx, cy, cz), M["stainless"], verts=64, rot=(0, math.pi / 2, 0))
    lib.cyl("pace clock face", 0.55, 0.01, (cx - 0.005, cy, cz), M["block"], verts=64, rot=(0, math.pi / 2, 0))
    for k in range(60):
        a_ = 2 * math.pi * k / 60; big = k % 5 == 0
        t_ = lib.box("clock tick", (0.006, 0.07 if big else 0.03, 0.012 if big else 0.006), (cx - 0.008, cy + 0.47 * math.cos(a_), cz + 0.47 * math.sin(a_)), M["tread"])
        t_.rotation_euler = (a_, 0, 0)
    for (ln, a_, w_) in ((0.4, math.radians(64), 0.016), (0.3, math.radians(170), 0.022)):
        hd = lib.box("clock hand", (0.006, ln, w_), (cx - 0.012, cy + ln / 2 * math.cos(a_), cz + ln / 2 * math.sin(a_)), M["rope_red"] if ln > 0.35 else M["tread"])
        hd.rotation_euler = (a_, 0, 0)
    # downlights for the evening, and a soft fill from the glass
    for y in (Y0 + 1.4, Y1 - 1.4):
        x = -hw(y) + 3.0
        while x < hw(y) - 2.5:
            lib.spot_light("downlight", (x, y, HT - 0.05), 70, (1.0, 0.84, 0.66), 0.03, 60, 0.6); x += 4.0


ROOMS = {
    "pool": dict(build=lap_pool, cams={
        "pool": dict(loc=(PX0 - 1.4, Y1 - 0.75, 1.3), target=(PX1 - 12.0, PY0 + 0.6, 0.5), lens=20, shift=0.1),
        "pool2": dict(loc=(PX1 + 1.8, PY0 - 1.5, 1.4), target=(-10.0, Y1 - 1.0, 0.8), lens=20, shift=0.1),
    }, stops={"pool": (2.0, PY1 + 1.25, 0.0)}),
}


def build(room):
    sc = lib.reset(); M = family.materials(); rnd = random.Random(67)
    R = ROOMS[room]; R["build"](M, rnd)
    w = sc.world or bpy.data.worlds.new("world"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background"); bg.inputs["Color"].default_value = (0, 0, 0, 1); bg.inputs["Strength"].default_value = 0.0
    return sc, R


if __name__ == "__main__":
    args = sys.argv[1:]; room = args[0]; jobs = args[1].split(","); out = args[2]
    w, h, spp, ex = (int(args[3]), int(args[4]), int(args[5]), float(args[6])) if len(args) > 6 else (640, 360, 24, 0.0)
    pw, pspp = (int(args[7]), int(args[8])) if len(args) > 8 else (w * 2, spp)
    paths = {j: os.path.abspath(out.replace("%s", j.replace(":", "_"))) for j in jobs}
    os.makedirs(os.path.dirname(list(paths.values())[0]), exist_ok=True)
    todo = [j for j in jobs if not os.path.exists(paths[j])]
    if not todo: print("nothing to do", flush=True); sys.exit(0)
    t = time.time(); sc, R = build(room); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in todo:
        tmp = paths[j].replace(".jpg", ".part.jpg")
        if j.startswith("plan:"):
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=ex)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"], shift_y=c.get("shift", 0.0)); lib.photo_finish(0.3, 0.15)
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
