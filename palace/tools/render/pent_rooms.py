"""The other rooms of ring A on L1 of the Pentagon, behind the glass onto the atrium: the great library, the cinema and
the thermal pools. Each is the same trapezoid as the family room (28.8 m of glass, 13.9 m deep, 49 m along the back
wall) on another side of the atrium, and the full 8 m of L1 tall (the decision log, 1 Oct 2026). They are built in the
family room's frame (x along the glass, y into the room, z up from the floor): the atrium is the same from every side.
  bvenv/bin/python blend/pent_rooms.py <room> <cam[,cam...]|pano:stop> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, atrium, family

A = lib.ASSETS
HW0, HW1, DEP = family.HW0, family.HW1, family.DEP
HT = 7.6                     # the ceiling; the slab above it is L1's roof


def half_w(y): return HW0 + (HW1 - HW0) * y / DEP


def shell(M, floor_mat, wall_mat, sky, ceiling_mat=None, door_bay=4):
    """floor, walls, a coffered ceiling with skylights (sky: list of (x, y, sx, sy)), and 7.6 m of glass onto the
    atrium, with mullions every 3.2 m, a transom at 3.8 m, and a pair of glass doors in one bay"""
    o = []
    o.append(lib.poly_prism("floor", [(-HW0 - 0.3, -0.05), (HW0 + 0.3, -0.05), (HW1 + 0.4, DEP + 0.3), (-HW1 - 0.4, DEP + 0.3)], -0.3, 0.0, floor_mat))
    o.append(lib.box("back wall", (2 * HW1 + 1.0, 0.3, HT + 0.8), (0, DEP + 0.15, (HT + 0.8) / 2), wall_mat))
    for sgn in (-1, 1):
        d = Vector((sgn * (HW1 - HW0), DEP)).normalized(); n = Vector((d.y, -d.x)) * sgn
        p0 = Vector((sgn * HW0, -0.3)); p1 = Vector((sgn * (HW1 + 0.2), DEP + 0.3))
        o.append(lib.poly_prism("side wall", [tuple(p0), tuple(p1), tuple(p1 + n * 0.3), tuple(p0 + n * 0.3)], 0.0, HT + 0.8, wall_mat))
    ceil_pts = [(-HW0 - 0.3, -0.18), (HW0 + 0.3, -0.18), (HW1 + 0.4, DEP + 0.3), (-HW1 - 0.4, DEP + 0.3)]
    ceil = lib.poly_prism("ceiling", ceil_pts, HT, HT + 0.8, ceiling_mat or M["ceiling"]); o.append(ceil)
    cutters = bpy.data.collections.new("skylight cutters")
    for (x, y, sx, sy) in sky:
        c = lib.box("cut", (sx, sy, 2.0), (x, y, HT + 0.4), None); cutters.objects.link(c); bpy.context.scene.collection.objects.unlink(c)
        o.append(lib.box("skylight glass", (sx, sy, 0.02), (x, y, HT + 0.75), M["glass"]))
        for (bx, by, px, py) in ((sx + 0.12, 0.06, 0, -sy / 2 - 0.03), (sx + 0.12, 0.06, 0, sy / 2 + 0.03), (0.06, sy, -sx / 2 - 0.03, 0), (0.06, sy, sx / 2 + 0.03, 0)):
            o.append(lib.box("well trim", (bx, by, 0.06), (x + px, y + py, HT - 0.03), M["bronze"]))
    bo = ceil.modifiers.new("skylights", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.operand_type = "COLLECTION"; bo.collection = cutters; bo.solver = "EXACT"
    # the glass onto the atrium
    o.append(lib.box("glass sill", (2 * HW0, 0.12, 0.01), (0, 0, 0.005), M["bronze"]))
    o.append(lib.box("glass head", (2 * HW0, 0.2, 0.08), (0, 0, HT - 0.04), M["bronze"]))
    for i in range(10):
        x = -HW0 + i * 3.2 if i < 9 else HW0
        o.append(lib.box("mullion", (0.07, 0.22, HT - 0.08), (x, 0, HT / 2 - 0.04), M["bronze"]))
    o.append(lib.box("transom", (2 * HW0, 0.18, 0.08), (0, 0, 3.8), M["bronze"]))
    for i in range(9):
        x0 = -HW0 + i * 3.2
        o.append(lib.box("upper pane", (3.2 - 0.07, 0.012, HT - 3.9), (x0 + 1.6, 0.0, (3.84 + HT - 0.08) / 2), M["glass"]))
        if i == door_bay:
            for (a, b_) in ((x0 + 0.035, x0 + 1.6), (x0 + 1.6, x0 + 3.165)):
                cx = (a + b_) / 2; w = b_ - a
                o.append(lib.box("door glass", (w - 0.08, 0.012, 3.7), (cx, -0.02, 1.88), M["glass"]))
                for (sx, sz, px, pz) in ((w, 0.05, 0, 0.055), (w, 0.05, 0, 3.73), (0.04, 3.7, -w / 2 + 0.02, 1.88), (0.04, 3.7, w / 2 - 0.02, 1.88)):
                    o.append(lib.box("door frame", (sx, 0.05, sz), (cx + px, -0.02, pz), M["bronze"]))
            continue
        o.append(lib.box("pane", (3.2 - 0.07, 0.012, 3.76), (x0 + 1.6, 0.0, 1.88), M["glass"]))
    o.append(lib.box("storey band", (2 * HW0 + 6.2, 0.4, 0.8), (0, -0.25, HT + 0.4), M["travertine"]))
    return o


def downlights(M, rows, cols_dx=3.2, watts=60, z=None, avoid=()):
    """recessed downlights on a grid symmetric about x = 0, flush with the ceiling at z"""
    z = HT if z is None else z; warm = (1.0, 0.80, 0.60); lens = lib.emission("downlight lens", warm, 35.0)
    for y in rows:
        x = -cols_dx * math.floor(HW1 / cols_dx)
        while x <= HW1:
            if abs(x) < half_w(y) - 0.9 and not any(abs(x - cx) < sx / 2 + 0.6 and abs(y - cy) < sy / 2 + 0.6 for (cx, cy, sx, sy) in avoid):
                lib.cyl("downlight trim", 0.06, 0.012, (x, y, z - 0.012), M["bronze_dark"], verts=24)
                lib.cyl("downlight lens", 0.035, 0.004, (x, y, z - 0.0125), lens, verts=24)
                lib.spot_light("downlight", (x, y, z - 0.03), watts, warm, 0.02, 70, 0.6)
            x += cols_dx


# ---------------------------------------------------------------- the great library
def stack(bm, rnd, x0, x1, y_back, depth, z0, z1, pitch, decor, shelf_bm, upright_bm):
    """open shelves from z0 to z1 between x0 and x1 against a wall at y_back (facing -y), uprights about every metre,
    filled with books"""
    n = max(1, int(round((x1 - x0) / 1.0))); w = (x1 - x0) / n
    for i in range(n + 1):
        lib.bm_box(upright_bm, (0.04, depth, z1 - z0), (x0 + i * w, y_back - depth / 2, (z0 + z1) / 2))
    ns = max(1, int(round((z1 - z0) / pitch))); p = (z1 - z0) / ns
    for k in range(ns):
        z = z0 + k * p
        lib.bm_box(shelf_bm, (x1 - x0, depth, 0.03), ((x0 + x1) / 2, y_back - depth / 2, z + 0.015))
        for i in range(n):
            if rnd.random() < 0.06: continue
            furn.fill_shelf(bm, rnd, x0 + i * w + 0.03, x0 + (i + 1) * w - 0.03, y_back - 0.01, depth - 0.02, z + 0.03, p - 0.05, decor)
    lib.bm_box(shelf_bm, (x1 - x0, depth, 0.03), ((x0 + x1) / 2, y_back - depth / 2, z1 - 0.015))


def spiral_stair(name, cx, cy, r, h, M, steps=18, start=0.0):
    g = furn.empty(name, (cx, cy, 0)); o = [lib.cyl(name + " post", 0.09, h + 1.0, (0, 0, 0), M["bronze_dark"], verts=24)]
    for i in range(steps):
        a = start + i * 2 * math.pi * 0.9 / steps; z = (i + 1) * h / steps
        bm = bmesh.new(); pts = [(0.1, -0.12), (r, -0.30), (r, 0.30), (0.1, 0.12)]
        vs = [bm.verts.new((p[0], p[1], z - 0.05)) for p in pts] + [bm.verts.new((p[0], p[1], z)) for p in pts]
        for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([vs[k] for k in f])
        t = lib.mesh_obj(name + " tread", bm, M["walnut"]); t.rotation_euler = (0, 0, a); o.append(t)
        o.append(lib.cyl(name + " baluster", 0.012, 0.95, (r * math.cos(a), r * math.sin(a), z), M["brass"], verts=10))
    # the handrail: a helix of short bronze pieces
    prev = None
    for k in range(steps * 3 + 1):
        a = start + k * 2 * math.pi * 0.9 / (steps * 3); z = (k / 3.0 + 1) * h / steps + 0.95
        p = Vector((r * math.cos(a), r * math.sin(a), z))
        if prev is not None:
            d = p - prev; seg = lib.cyl(name + " rail", 0.022, d.length, tuple(prev), M["brass"], verts=10); seg.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); o.append(seg)
        prev = p
    for ob in o: ob.parent = g
    return g


def globe(name, loc, r, M):
    """a globe of the Earth on a bronze stand, tilted 23.4 degrees"""
    g = furn.empty(name, loc)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=r, location=(0, 0, 0)); s = bpy.context.active_object; s.name = name + " sphere"
    for p in s.data.polygons: p.use_smooth = True
    m, nt = lib._mat("globe earth")
    if nt is not None:
        b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.35; b.inputs["Coat Weight"].default_value = 0.6
        path = os.path.join(A, "earth4k.jpg")
        if os.path.exists(path):
            t = lib._tex(nt, path); tc = nt.nodes.new("ShaderNodeTexCoord"); nt.links.new(tc.outputs["UV"], t.inputs["Vector"])
            hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = 0.8; hs.inputs["Value"].default_value = 0.85
            nt.links.new(t.outputs["Color"], hs.inputs["Color"]); nt.links.new(hs.outputs["Color"], b.inputs["Base Color"])
    s.data.materials.append(m); s.location = (0, 0, r + 0.75); s.rotation_euler = (math.radians(23.4), 0, 0.6); s.parent = g
    bpy.ops.mesh.primitive_torus_add(major_radius=r + 0.04, minor_radius=0.012, major_segments=96, minor_segments=8, location=(0, 0, r + 0.75), rotation=(math.radians(23.4) + math.pi / 2, 0, 0))
    mer = bpy.context.active_object; mer.data.materials.append(M["brass"]); mer.parent = g
    for o in (lib.cyl(name + " stand", 0.03, r + 0.75, (0, 0, 0), M["bronze_dark"], verts=16), lib.cyl(name + " foot", 0.32, 0.04, (0, 0, 0), M["bronze_dark"], verts=48, bevel=0.01)):
        o.parent = g
    return g


LIB_SKY = [(x, y, 2.4, 2.4) for x in (-9.6, -3.2, 3.2, 9.6) for y in (4.2, 9.0)]
GZ = 3.8                     # the gallery's floor


def wall_frame(sgn):
    """the frame of a side wall's inner face: x along it, y into the wall (the room is at -y), z up, the origin at the
    end by the glass; returns the matrix and which way along the wall local x runs (+1 towards the back wall)"""
    P0 = Vector((sgn * HW0, -0.3)); P1 = Vector((sgn * (HW1 + 0.2), DEP + 0.3)); d = (P1 - P0).normalized()
    ydir = -Vector((-d.y, d.x)) * sgn; xdir = Vector((ydir.y, -ydir.x))
    Mw = Matrix(((xdir.x, ydir.x, 0, P0.x), (xdir.y, ydir.y, 0, P0.y), (0, 0, 1, 0), (0, 0, 0, 1)))
    return Mw, (1 if xdir.dot(d) > 0 else -1), math.atan2(xdir.y, xdir.x), d


def side_library(M, rnd):
    """the side walls lined with books too, two storeys, the gallery running round under the upper shelves"""
    for sgn in (-1, 1):
        Mw, k, ang, d = wall_frame(sgn)
        lx = lambda s_: k * s_                        # distance along the wall from the glass end -> local x
        a, b = sorted((lx(1.6), lx(16.2)))
        bks, shv, upr, dec = bmesh.new(), bmesh.new(), bmesh.new(), []
        stack(bks, rnd, a, b, 0.0, 0.42, 0.10, 3.40, 0.42, dec, shv, upr)
        stack(bks, rnd, a, b, 0.0, 0.42, GZ + 0.10, HT - 0.35, 0.42, dec, shv, upr)
        objs = [lib.mesh_obj("side books", bks, M["book"]), lib.mesh_obj("side shelves", shv, M["walnut"]), lib.mesh_obj("side uprights", upr, M["walnut_v"])]
        for (x, z, h) in dec: objs.append(furn.ornament("ornament", x, -0.24, z, h, random.Random(int(x * 100 + z * 10) + sgn), M["ceramics"]))
        # the gallery along the wall: its deck runs on into the corner under the back wall's gallery (a millimetre lower)
        a2, b2 = sorted((lx(1.6), lx(16.5)))
        objs.append(lib.box("side gallery deck", (b2 - a2, 1.3, 0.22), ((a2 + b2) / 2, -0.42 - 0.65, GZ - 0.111), M["walnut"], bevel=0.01))
        r0, r1 = sorted((lx(1.6), lx(14.15))); yr = -0.42 - 1.3 + 0.03
        objs.append(lib.box("side gallery rail", (r1 - r0, 0.06, 0.05), ((r0 + r1) / 2, yr, GZ + 1.05), M["brass"], bevel=0.01))
        objs.append(lib.box("side gallery kick", (r1 - r0, 0.03, 0.12), ((r0 + r1) / 2, yr - 0.01, GZ + 0.06), M["brass"]))
        x = r0
        while x <= r1 + 1e-6:
            objs.append(lib.box("side gallery post", (0.025, 0.025, 1.0), (x, yr, GZ + 0.5), M["brass"])); x += 0.24
        xe = lx(1.6)                                   # the end by the glass, closed
        objs.append(lib.box("side gallery end rail", (0.06, 1.27, 0.05), (xe, (yr - 0.42) / 2, GZ + 1.05), M["brass"], bevel=0.01))
        for yy in (-0.66, -0.9, -1.14, -1.38): objs.append(lib.box("side gallery post", (0.025, 0.025, 1.0), (xe, yy, GZ + 0.5), M["brass"]))
        objs.append(lib.box("side gallery underlight", (r1 - r0, 0.04, 0.01), ((r0 + r1) / 2, yr + 0.12, GZ - 0.226), lib.emission("gallery underlight", (1.0, 0.78, 0.55), 6.0)))
        for s_ in (4.5, 9.0, 13.5):
            objs.append(lib.box("side gallery bracket", (0.12, 1.25, 0.3), (lx(s_), -0.42 - 0.62, GZ - 0.37), M["bronze_dark"]))
        for o in objs:
            o.matrix_world = Mw @ o.matrix_world
        # lights washing the shelves, as on the back wall
        s_ = 2.5
        while s_ < 16.0:
            p = Mw @ Vector((lx(s_), -2.1, HT - 0.03)); c = lib.cyl("washer trim", 0.05, 0.012, (p.x, p.y, HT - 0.012), M["bronze_dark"], verts=24)
            sp = lib.spot_light("shelf washer", tuple(p), 50, (1.0, 0.82, 0.62), 0.03, 60, 0.7); sp.rotation_euler = (math.radians(28), 0, ang)
            p = Mw @ Vector((lx(s_), -1.6, GZ - 0.25))
            sp = lib.spot_light("shelf washer low", tuple(p), 30, (1.0, 0.82, 0.62), 0.03, 60, 0.7); sp.rotation_euler = (math.radians(35), 0, ang)
            s_ += 2.0


def library(M, rnd):
    shell(M, M["oak"], M["plaster"], LIB_SKY)
    # walnut ribs across the ceiling, between the skylights, from the glass to the back wall
    k = 0
    while 1.6 + 3.2 * k < HW1:
        for x in (-1.6 - 3.2 * k, 1.6 + 3.2 * k):
            y0 = max(0.12, (abs(x) - HW0) * DEP / (HW1 - HW0) + 0.25)
            if y0 < DEP - 0.5: lib.box("ceiling rib", (0.24, DEP - y0, 0.5), (x, (y0 + DEP) / 2, HT - 0.25), M["walnut"], bevel=0.01)
        k += 1
    books = bmesh.new(); shelves = bmesh.new(); uprights = bmesh.new(); decor = []
    yb = DEP - 0.02                                # the back wall's face
    # two storeys of shelves the whole length of the back wall, with the gallery between them
    for (x0, x1) in ((-HW1 + 0.6, -1.6), (1.6, HW1 - 0.6)):
        stack(books, rnd, x0, x1, yb, 0.42, 0.10, 3.40, 0.42, decor, shelves, uprights)
    stack(books, rnd, -HW1 + 0.6, HW1 - 0.6, yb, 0.42, GZ + 0.10, HT - 0.35, 0.42, decor, shelves, uprights)
    lib.mesh_obj("books", books, M["book"]); lib.mesh_obj("shelves", shelves, M["walnut"]); lib.mesh_obj("uprights", uprights, M["walnut_v"])
    side_library(M, rnd)
    for (x, z, h) in decor: furn.ornament("ornament", x, yb - 0.24, z, h, random.Random(int(x * 100 + z * 10)), M["ceramics"])
    # the middle of the back wall: a doorway to the street, framed in walnut
    lib.box("library door", (2.2, 0.06, 3.0), (0, yb - 0.03, 1.5), M["walnut_v"], bevel=0.004)
    for (sx, sz, px, pz) in ((2.5, 0.12, 0, 3.06), (0.12, 3.12, -1.19, 1.56), (0.12, 3.12, 1.19, 1.56)):
        lib.box("door case", (sx, 0.14, sz), (px, yb - 0.07, pz), M["walnut"], bevel=0.004)
    # the gallery: a walnut deck 1.3 m deep along the back wall, a bronze balustrade, lit from beneath
    lib.box("gallery deck", (2 * HW1 - 1.2, 1.3, 0.22), (0, DEP - 0.65 - 0.42, GZ - 0.11), M["walnut"], bevel=0.01)
    yr = DEP - 0.42 - 1.3
    SX = -4.0; so0, so1 = SX - 0.55, SX + 0.55                       # the stair, and the opening in the balustrade over it
    for (a, b) in ((-21.39, so0), (so1, 21.39)):                      # from where the side galleries meet it
        lib.box("gallery rail", (b - a, 0.06, 0.05), ((a + b) / 2, yr + 0.03, GZ + 1.05), M["brass"], bevel=0.01)
        lib.box("gallery kick", (b - a, 0.03, 0.12), ((a + b) / 2, yr + 0.02, GZ + 0.06), M["brass"])
    x = -21.3
    while x < 21.35:
        if not so0 - 0.05 < x < so1 + 0.05: lib.box("gallery post", (0.025, 0.025, 1.0), (x, yr + 0.03, GZ + 0.5), M["brass"])
        x += 0.24
    for xe in (so0, so1): lib.box("gallery newel", (0.06, 0.06, 1.1), (xe, yr + 0.03, GZ + 0.55), M["brass"], bevel=0.01)
    glow = lib.emission("gallery underlight", (1.0, 0.78, 0.55), 6.0)
    lib.box("gallery underlight", (2 * HW1 - 1.4, 0.04, 0.01), (0, yr + 0.15, GZ - 0.225), glow)
    for x in (-15.0, -7.5, 7.5, 15.0):
        lib.box("gallery bracket", (0.12, 1.25, 0.3), (x, DEP - 0.42 - 0.62, GZ - 0.37), M["bronze_dark"])
    spiral_stair("stair", SX, yr - 1.22, 1.15, GZ, M, steps=20, start=2.48)        # the last tread points at the gallery (+y)
    # rolling ladders on brass rails along the lower shelves
    lib.cyl("ladder rail", 0.014, 2 * HW1 - 3.0, (-HW1 + 1.5, yb - 0.47, 3.15), M["brass"], verts=12, rot=(0, math.pi / 2, 0))
    for lx in (-14.0, 9.5):
        lad = furn.empty("ladder", (lx, yb - 0.47, 0)); ang = math.radians(13)
        for dx in (-0.24, 0.24):
            s_ = lib.box("ladder side", (0.035, 0.06, 3.25), (dx, -0.38, 1.6), M["walnut"], bevel=0.005); s_.rotation_euler = (-ang, 0, 0); s_.parent = lad
        for i in range(10):
            z = 0.3 + i * 0.29; r_ = lib.box("ladder rung", (0.48, 0.06, 0.025), (0, -0.74 + z * math.tan(ang), z), M["brass"], bevel=0.004); r_.parent = lad
    # long reading tables down the room, brass lamps, chairs; leather chairs by the glass; the globe
    for tx in (-8.4, 0.0, 8.4):
        ty = 6.6
        lib.box("reading table", (3.6, 1.3, 0.06), (tx, ty, 0.74), M["walnut"], bevel=0.006)
        for dx in (-1.55, 1.55): lib.box("table leg", (0.08, 1.1, 0.71), (tx + dx, ty, 0.355), M["walnut"], bevel=0.004)
        for dx in (-0.9, 0.9):
            furn.table_lamp("reading lamp", (tx + dx, ty, 0.77), M, watts=28, shade_r=0.15)
            for sgn in (-1, 1): furn.dining_chair("reading chair", (tx + dx, ty + sgn * 1.0, 0.0), 0.0 if sgn > 0 else math.pi, M)
        for i in range(3):
            bx, by, rz = tx - 0.4 + i * 0.5, ty + 0.15 * (i % 2), 0.2 * (i - 1)
            lib.box("open book cover", (0.44, 0.31, 0.008), (bx, by, 0.774), M["cloth"], bevel=0.002, rot_z=rz)
            lib.box("open book pages", (0.42, 0.29, 0.016), (bx, by, 0.786), M["paper"], bevel=0.004, rot_z=rz)
    for (x, y) in ((-6.0, 2.6), (6.0, 2.6), (-13.0, 2.8), (13.0, 2.8)):
        lib.box("rug", (4.4, 3.4, 0.014), (x, y + 0.3, 0.007), M["rug"], bevel=0.006)
    ch = lib.import_glb(os.path.join(A, "SheenChair.glb"), (-6.6, 2.1, 0.0), math.radians(200), name="library chair")
    family.tint_fabric(ch, (0.36, 0.20, 0.10))
    for (x, y, r_) in ((-5.0, 2.3, 160), (6.6, 2.1, 160), (5.2, 2.4, 200), (-13.6, 2.4, 190), (-12.2, 2.2, 165), (12.4, 2.3, 200)):
        lib.instance_of(ch, (x, y, 0.0), math.radians(r_))
    for (x, y) in ((-5.8, 3.4), (5.8, 3.4), (-12.9, 3.5)):
        furn.side_table("side table", (x, y, 0.014), M, r=0.3, h=0.5)
    globe("globe", (13.6, 3.6, 0.0), 0.55, M)
    pl = lib.import_glb(os.path.join(A, "DiffuseTransmissionPlant.glb"), (-10.0, 1.0, 0.0), 0.5, 1.9, name="plant")
    lib.instance_of(pl, (10.2, 1.0, 0.0), 2.0, 2.0); lib.instance_of(pl, (-17.5, 12.2, 0.0), 1.0, 2.0)
    downlights(M, (2.0, 6.6, 11.0), avoid=LIB_SKY, watts=70)
    for x in range(-22, 23, 2):
        if abs(x) < half_w(DEP - 1.0) - 0.8:
            lib.cyl("washer trim", 0.05, 0.012, (x, DEP - 2.1, HT - 0.012), M["bronze_dark"], verts=24)
            sp = lib.spot_light("shelf washer", (x, DEP - 2.1, HT - 0.03), 50, (1.0, 0.82, 0.62), 0.03, 60, 0.7); sp.rotation_euler = (math.radians(28), 0, 0)
            sp = lib.spot_light("shelf washer low", (x, DEP - 1.6, GZ - 0.25), 30, (1.0, 0.82, 0.62), 0.03, 60, 0.7); sp.rotation_euler = (math.radians(35), 0, 0)


# ---------------------------------------------------------------- the thermal baths
def quartzite(name="quartzite", base=(0.30, 0.32, 0.29), dark=(0.19, 0.21, 0.19), course=0.15, rough=0.5, floor=False):
    """grey-green quartzite: on walls laid in thin courses (each course its own shade), on floors in long slabs; soft
    bands along the bedding, a fine dark joint"""
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    g = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(g.outputs["Position"], sep.inputs[0])
    if floor:   # slabs 1.2 m by 0.6 m, every other row shifted half a slab
        row = lib._math(nt, "FLOOR", lib._math(nt, "DIVIDE", sep.outputs[1], 0.6))
        xs = lib._math(nt, "ADD", sep.outputs[0], lib._math(nt, "MULTIPLY", lib._math(nt, "MODULO", row, 2.0), 0.6))
        col_i = lib._math(nt, "FLOOR", lib._math(nt, "DIVIDE", xs, 1.2))
        cell = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", row, 57.0), col_i)
        fx = lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", xs, 1.2)); fy = lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", sep.outputs[1], 0.6))
        jx = lib._math(nt, "LESS_THAN", lib._math(nt, "MINIMUM", fx, lib._math(nt, "SUBTRACT", 1.0, fx)), 0.0015 / 1.2)
        jy = lib._math(nt, "LESS_THAN", lib._math(nt, "MINIMUM", fy, lib._math(nt, "SUBTRACT", 1.0, fy)), 0.0015 / 0.6)
        joint = lib._math(nt, "MAXIMUM", jx, jy)
    else:
        cell = lib._math(nt, "FLOOR", lib._math(nt, "DIVIDE", sep.outputs[2], course))
        fz = lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", sep.outputs[2], course))
        joint = lib._math(nt, "LESS_THAN", lib._math(nt, "MINIMUM", fz, lib._math(nt, "SUBTRACT", 1.0, fz)), 0.002 / course)
    wn = nt.nodes.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "1D"; L.new(cell, wn.inputs["W"])
    mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.35, 0.35, 5.0) if not floor else (0.6, 2.5, 1.0); L.new(g.outputs["Position"], mp.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 1.5; n.inputs["Detail"].default_value = 9; n.inputs["Roughness"].default_value = 0.62; L.new(mp.outputs["Vector"], n.inputs["Vector"])
    t = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", wn.outputs["Value"], 0.45), lib._math(nt, "MULTIPLY", n.outputs["Fac"], 0.75))
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.35; cr.color_ramp.elements[0].color = (*base, 1); cr.color_ramp.elements[1].position = 0.95; cr.color_ramp.elements[1].color = (*dark, 1)
    L.new(lib._math(nt, "SUBTRACT", t, 0.1), cr.inputs["Fac"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", joint, 0.75), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (0.05, 0.055, 0.05, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    fine = nt.nodes.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 160; fine.inputs["Detail"].default_value = 5; L.new(g.outputs["Position"], fine.inputs["Vector"])
    bmp = nt.nodes.new("ShaderNodeBump"); bmp.inputs["Strength"].default_value = 0.25; bmp.inputs["Distance"].default_value = 0.002
    L.new(lib._math(nt, "SUBTRACT", lib._math(nt, "MULTIPLY", fine.outputs["Fac"], 0.3), joint), bmp.inputs["Height"]); L.new(bmp.outputs["Normal"], b.inputs["Normal"])
    rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = rough - 0.12; rr.inputs["To Max"].default_value = rough + 0.12; L.new(wn.outputs["Value"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    return m


def pool_water(name="pool water", tint=(0.80, 0.93, 0.90)):
    """the surface of a pool: the camera and reflections see water (with a few ripples); light passes straight through,
    so the pool's floor is lit without caustics"""
    m = lib.glass(name, tint, 0.0, 1.33); nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.25, 0.25, 0.25); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    t = lib._tex(nt, os.path.join(A, "waternormals.jpg"), "Non-Color"); L.new(mp.outputs["Vector"], t.inputs["Vector"])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.035; L.new(t.outputs["Color"], nm.inputs["Color"]); L.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def pool_rect(name, x0, x1, y0, y1, depth, M, glow, cutters, steps_at=None):
    """a pool sunk in the floor: a basin of quartzite, the water 6 cm below the floor, a line of light under the water
    along each long side, and steps down at one end"""
    cutters.append(lib.box(name + " cut", (x1 - x0, y1 - y0, 1.0), ((x0 + x1) / 2, (y0 + y1) / 2, 0.0), None))
    t = 0.25; e = 0.001
    lib.box(name + " bottom", (x1 - x0, y1 - y0, t), ((x0 + x1) / 2, (y0 + y1) / 2, -depth - t / 2), M["basin"])
    for (cx, cy, sx, sy) in (((x0 + x1) / 2, y0 - t / 2 + e, x1 - x0 + 2 * t, t), ((x0 + x1) / 2, y1 + t / 2 - e, x1 - x0 + 2 * t, t), (x0 - t / 2 + e, (y0 + y1) / 2, t, y1 - y0), (x1 + t / 2 - e, (y0 + y1) / 2, t, y1 - y0)):
        lib.box(name + " wall", (sx, sy, depth + 0.001), (cx, cy, -depth / 2 - 0.0005), M["basin"])
    lib.box(name + " water", (x1 - x0, y1 - y0, 0.002), ((x0 + x1) / 2, (y0 + y1) / 2, -0.06), M["pool water"])
    for yy in (y0 + 0.03, y1 - 0.03):
        lib.box(name + " light", (x1 - x0 - 0.6, 0.01, 0.03), ((x0 + x1) / 2, yy, -0.32), glow)
    if steps_at is not None:     # steps down along the x0 end
        n = int(depth / 0.2)
        for i in range(n):
            lib.box(name + " step", (0.32 * (n - i), y1 - y0 - 2.4, 0.2), (x0 + 0.16 * (n - i), (y0 + y1) / 2, -0.06 - 0.2 * i - 0.1 - 0.0), M["basin"])


def pool_round(name, cx, cy, r, depth, M, glow, cutters):
    c = lib.cyl(name + " cut", r, 1.0, (cx, cy, -0.5), None, verts=128); cutters.append(c)
    circ = lambda rr: [(cx + rr * math.cos(2 * math.pi * i / 128), cy + rr * math.sin(2 * math.pi * i / 128)) for i in range(128)]
    furn.ring_prism(name + " wall", circ(r + 0.25), circ(r - 0.001), -depth, -0.0005, M["basin"])
    lib.cyl(name + " bottom", r + 0.25, 0.25, (cx, cy, -depth - 0.25), M["basin"], verts=128)
    lib.cyl(name + " bench", r, 0.45, (cx, cy, -depth), M["basin"], verts=128); lib.cyl(name + " bench cut", r - 0.5, 0.46, (cx, cy, -depth - 0.005), M["basin"], verts=128)
    lib.cyl(name + " water", r, 0.002, (cx, cy, -0.061), M["pool water"], verts=128)
    furn.ring_prism(name + " light", circ(r - 0.002), circ(r - 0.012), -0.34, -0.31, glow)


def lounger(name, loc, rot_z, M):
    """a chaise longue in walnut with a linen pad, its head raised; local -y is the foot"""
    P = furn.empty(name, loc, rot_z); parts = []
    for x in (-0.31, 0.31):
        parts.append(lib.box(name + " rail", (0.04, 1.95, 0.06), (x, 0, 0.27), M["walnut"], bevel=0.008))
        for y in (-0.85, 0.85): parts.append(lib.box(name + " leg", (0.05, 0.05, 0.27), (x, y, 0.135), M["walnut"], bevel=0.006))
    parts.append(lib.box(name + " pad", (0.66, 1.25, 0.09), (0, -0.33, 0.345), M["linen"], bevel=0.035, segs=4))
    bk = lib.box(name + " back", (0.66, 0.72, 0.09), (0, 0, 0), M["linen"], bevel=0.035, segs=4); bk.location = (0, 0.6, 0.53); bk.rotation_euler = (math.radians(38), 0, 0); parts.append(bk)
    tw = lib.box(name + " towel", (0.5, 0.36, 0.05), (0.02, -0.75, 0.415), M["towel"], bevel=0.02, segs=3); parts.append(tw)
    for o in parts: o.parent = P
    return P


BATHS_SKY = (2.0, 4.8, 7.6, 10.4, 12.8)     # the light slots across the ceiling (their y)


def baths(M, rnd):
    M["quartz"] = quartzite(); M["quartz_floor"] = quartzite("quartzite floor", (0.36, 0.38, 0.35), (0.25, 0.27, 0.25), rough=0.42, floor=True)
    M["basin"] = quartzite("basin", (0.22, 0.25, 0.23), (0.14, 0.16, 0.15), rough=0.35); M["pool water"] = pool_water()
    M["towel"] = lib.fabric("towel", (0.86, 0.85, 0.82), 0.95, 0.6, 900, 0.5)
    glow = lib.emission("pool light", (0.95, 0.92, 0.80), 30.0)
    # the floor, with holes for the pools
    cutters = []
    pool_rect("warm pool", -7.5, 7.5, 3.2, 8.8, 1.35, M, glow, cutters, steps_at="x0")
    pool_round("hot pool", -14.2, 8.4, 2.3, 1.05, M, glow, cutters)
    pool_rect("cold pool", 12.2, 15.2, 7.0, 10.0, 1.6, M, glow, cutters)
    fl = lib.poly_prism("floor", [(-HW0 - 0.3, -0.05), (HW0 + 0.3, -0.05), (HW1 + 0.4, DEP + 0.3), (-HW1 - 0.4, DEP + 0.3)], -0.3, 0.0, M["quartz_floor"])
    col = bpy.data.collections.new("pool cutters")
    for c in cutters:
        col.objects.link(c); bpy.context.scene.collection.objects.unlink(c)
    bo = fl.modifiers.new("pools", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.operand_type = "COLLECTION"; bo.collection = col; bo.solver = "EXACT"
    # the walls, the glass, and a ceiling of slabs with slots of daylight between them
    shell_walls(M, M["quartz"])
    edges = [-0.18] + [v for y in BATHS_SKY for v in (y - 0.18, y + 0.18)] + [DEP + 0.3]
    for i in range(0, len(edges), 2):
        a, b = edges[i], edges[i + 1]
        lib.poly_prism("ceiling slab", [(-half_w(a) - 0.4, a), (half_w(a) + 0.4, a), (half_w(b) + 0.4, b), (-half_w(b) - 0.4, b)], HT, HT + 0.8, M["quartz"])
    for y in BATHS_SKY:
        lib.box("slot glass", (2 * half_w(y) + 0.8, 0.36, 0.02), (0, y, HT + 0.75), M["glass"])
    glass_front(M, door_bay=None)
    # a long stone bench on the back wall, towels on it, the way on to the rest of the baths
    for (a, b) in ((-12.0, -1.8), (1.8, 12.0)):
        lib.box("bench", (b - a, 0.5, 0.45), ((a + b) / 2, DEP - 0.25, 0.225), M["quartz"])
    for (x, n) in ((-9.0, 5), (-3.0, 3), (6.0, 4)):
        for k in range(n): lib.box("towel", (0.42, 0.32, 0.055), (x + rnd.uniform(-0.01, 0.01), DEP - 0.27, 0.45 + 0.03 + k * 0.056), M["towel"], bevel=0.022, rot_z=rnd.uniform(-0.04, 0.04))
    lib.box("doorway dark", (2.6, 0.05, 3.6), (0, DEP + 0.2, 1.8), lib.principled("deep", (0.02, 0.022, 0.02), 0.9))
    lib.box("doorway glow", (2.6, 0.05, 3.6), (0, DEP + 3.5, 1.8), lib.emission("far light", (0.85, 0.92, 0.95), 2.5))
    for x in (-1.3, 1.3): lib.box("doorway side", (0.05, 3.5, 3.6), (x, DEP + 1.75, 1.8), M["quartz"])
    lib.box("doorway floor", (2.6, 3.5, 0.05), (0, DEP + 1.75, -0.025), M["quartz_floor"])
    # loungers along the glass, facing the atrium
    for x in (-12.4, -11.3, -4.6, -3.5, 3.5, 4.6, 11.3, 12.4):
        lounger("lounger", (x, 1.85, 0.0), 0.0, M)
    for x in (-11.85, -4.05, 4.05, 11.85):
        lib.cyl("lounger table", 0.2, 0.42, (x, 1.3, 0.0), M["quartz"], verts=48)
    # a little light at night: warm grazers along the back wall
    for x in range(-20, 21, 3):
        if abs(x) < half_w(DEP - 1) - 0.8:
            sp = lib.spot_light("grazer", (x, DEP - 0.4, HT - 0.05), 60, (1.0, 0.82, 0.62), 0.03, 50, 0.7); sp.rotation_euler = (math.radians(12), 0, 0)


# ---------------------------------------------------------------- the cinema
def pleated(name, x0, x1, y, z0, z1, mat, pitch=0.18, depth=0.06):
    bm = bmesh.new(); n = int((x1 - x0) / (pitch / 6)); rows = []
    for zz in (z0, z1):
        rows.append([bm.verts.new((x0 + (x1 - x0) * i / n, y + depth * math.sin(2 * math.pi * (x1 - x0) * i / n / pitch), zz)) for i in range(n + 1)])
    for i in range(n): bm.faces.new((rows[0][i], rows[0][i + 1], rows[1][i + 1], rows[1][i]))
    return lib.mesh_obj(name, bm, mat, smooth=True)


def cinema_seat(name, loc, M, mat):
    """a deep reclining armchair; it faces +y, the screen"""
    P = furn.empty(name, loc); parts = []
    parts.append(lib.box(name + " base", (0.66, 0.62, 0.24), (0, 0.0, 0.12), M["felt"]))
    parts.append(lib.box(name + " seat", (0.62, 0.66, 0.2), (0, 0.04, 0.38), mat, bevel=0.06, segs=4))
    bk = lib.box(name + " back", (0.62, 0.2, 0.78), (0, 0, 0), mat, bevel=0.07, segs=4); bk.location = (0, -0.3, 0.8); bk.rotation_euler = (math.radians(14), 0, 0); parts.append(bk)
    hd = lib.box(name + " head", (0.5, 0.12, 0.22), (0, 0, 0), mat, bevel=0.05, segs=4); hd.location = (0, -0.3, 1.12); hd.rotation_euler = (math.radians(14), 0, 0); parts.append(hd)
    for o in parts: o.parent = P
    return P


def cinema(M, rnd):
    W = 8.0                                           # the auditorium: 16 m wide between walnut walls, the full 7.6 m tall
    velvet = lib.fabric("seat velvet", (0.26, 0.035, 0.04), 0.85, 0.9, 700, 0.2)
    drape = lib.fabric("drape velvet", (0.045, 0.04, 0.042), 0.9, 0.7, 500, 0.2)
    carpet = lib.fabric("carpet", (0.06, 0.05, 0.05), 0.95, 0.3, 300, 0.4)
    black = lib.fabric("masking", (0.008, 0.008, 0.008), 1.0, 0.2, 300, 0.1)
    lib.box("floor", (2 * W + 0.6, DEP + 0.6, 0.3), (0, DEP / 2, -0.15), carpet)
    lib.box("ceiling", (2 * W + 0.6, DEP + 0.6, 0.4), (0, DEP / 2, HT + 0.2), lib.principled("night ceiling", (0.010, 0.010, 0.014), 0.9))
    lib.box("back wall", (2 * W + 0.6, 0.3, HT), (0, DEP + 0.15, HT / 2), black)
    for sgn in (-1, 1):
        lib.box("side wall", (0.3, DEP + 0.6, HT), (sgn * (W + 0.15), DEP / 2, HT / 2), black)
        # walnut slats on the side walls, sconces between them
        x = sgn * (W - 0.03); y = 0.4
        bm = bmesh.new()
        while y < DEP - 0.3:
            lib.bm_box(bm, (0.06, 0.05, HT - 0.4), (x, y, HT / 2), 0.0); y += 0.12
        lib.mesh_obj("slats", bm, M["walnut"])
        for yy in (2.4, 5.4, 8.4, 11.4):
            lib.box("sconce", (0.08, 0.22, 0.5), (sgn * (W - 0.12), yy, 2.6), lib.emission("sconce glow", (1.0, 0.62, 0.32), 12.0), bevel=0.01)
            lib.point_light("sconce light", (sgn * (W - 0.35), yy, 2.6), 40, (1.0, 0.62, 0.32), 0.08)
    # the stars: fibre-optic points in the dark ceiling
    bm = bmesh.new(); star = lib.emission("star", (0.92, 0.95, 1.0), 14.0)
    for i in range(700):
        x = rnd.uniform(-W + 0.3, W - 0.3); y = rnd.uniform(0.6, DEP - 0.6); r = 0.006 + 0.01 * rnd.random() ** 2
        c = bm.verts.new((x, y, HT - 0.002)); ring = [bm.verts.new((x + r * math.cos(2 * math.pi * k / 8), y + r * math.sin(2 * math.pi * k / 8), HT - 0.002)) for k in range(8)]
        for k in range(8): bm.faces.new((c, ring[(k + 1) % 8], ring[k]))
    lib.mesh_obj("stars", bm, star)
    cove = lib.emission("cinema cove", (1.0, 0.66, 0.36), 6.0)
    for sgn in (-1, 1): lib.box("cove", (0.04, DEP - 0.8, 0.03), (sgn * (W - 0.25), DEP / 2, HT - 0.35), cove)
    # the glass onto the atrium behind drawn curtains
    glass_front(M, door_bay=None)
    pleated("curtain", -W, W, 0.45, 0.02, HT - 0.1, drape)
    lib.box("curtain track", (2 * W, 0.15, 0.08), (0, 0.45, HT - 0.06), M["bronze_dark"])
    # the screen, 12 m by 5 m, showing the Earth; black masking round it
    scr, nt = lib._mat("screen earth")
    if nt is not None:
        N = nt.nodes; N.remove(N["Principled BSDF"]); em = N.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 3.5
        t = lib._tex(nt, os.path.join(A, "screen_earth.jpg")); tc = N.new("ShaderNodeTexCoord"); nt.links.new(tc.outputs["UV"], t.inputs["Vector"]); nt.links.new(t.outputs["Color"], em.inputs["Color"])
        nt.links.new(em.outputs[0], N["Material Output"].inputs["Surface"])
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, DEP - 0.35, 3.9), rotation=(math.pi / 2, 0, 0)); sc = bpy.context.active_object
    sc.scale = (12.0, 5.06, 1.0); sc.data.materials.append(scr); sc.name = "screen"
    lib.box("masking", (13.2, 0.1, 6.2), (0, DEP - 0.25, 3.9), black)
    lib.box("stage", (13.6, 1.2, 0.5), (0, DEP - 0.75, 0.25), carpet)
    # four rows of ten, each row a step higher, aisles either side
    for r in range(4):
        y = 7.8 - 1.65 * r; z = 0.42 * r
        if r:
            y0 = y - 0.82 if r < 3 else 0.6
            lib.box("riser", (2 * W, y + 0.83 - y0, z), (0, (y0 + y + 0.83) / 2, z / 2), carpet)
            lib.box("nosing light", (2 * W - 0.4, 0.01, 0.012), (0, y + 0.835, z - 0.03), lib.emission("step light", (1.0, 0.7, 0.4), 8.0))
        for k in range(10):
            cinema_seat("seat", (-3.6 + 0.8 * k, y, z), M, velvet)
        for k in range(11):
            lib.box("armrest", (0.14, 0.7, 0.62), (-4.0 + 0.8 * k, y - 0.02, z + 0.31), velvet, bevel=0.03)
            lib.box("armrest top", (0.15, 0.66, 0.025), (-4.0 + 0.8 * k, y - 0.02, z + 0.63), M["walnut"], bevel=0.006)


def shell_walls(M, wall_mat):
    lib.box("back wall", (2 * HW1 + 1.0, 0.3, HT + 0.8), (0, DEP + 0.15, (HT + 0.8) / 2), wall_mat)
    for sgn in (-1, 1):
        d = Vector((sgn * (HW1 - HW0), DEP)).normalized(); n = Vector((d.y, -d.x)) * sgn
        p0 = Vector((sgn * HW0, -0.3)); p1 = Vector((sgn * (HW1 + 0.2), DEP + 0.3))
        lib.poly_prism("side wall", [tuple(p0), tuple(p1), tuple(p1 + n * 0.3), tuple(p0 + n * 0.3)], 0.0, HT + 0.8, wall_mat)


def glass_front(M, door_bay=4):
    lib.box("glass sill", (2 * HW0, 0.12, 0.01), (0, 0, 0.005), M["bronze"])
    lib.box("glass head", (2 * HW0, 0.2, 0.08), (0, 0, HT - 0.04), M["bronze"])
    for i in range(10):
        x = -HW0 + i * 3.2 if i < 9 else HW0
        lib.box("mullion", (0.07, 0.22, HT - 0.08), (x, 0, HT / 2 - 0.04), M["bronze"])
    lib.box("transom", (2 * HW0, 0.18, 0.08), (0, 0, 3.8), M["bronze"])
    for i in range(9):
        x0 = -HW0 + i * 3.2
        lib.box("upper pane", (3.2 - 0.07, 0.012, HT - 3.9), (x0 + 1.6, 0.0, (3.84 + HT - 0.08) / 2), M["glass"])
        lib.box("pane", (3.2 - 0.07, 0.012, 3.76), (x0 + 1.6, 0.0, 1.88), M["glass"])
    lib.box("storey band", (2 * HW0 + 6.2, 0.4, 0.8), (0, -0.25, HT + 0.4), M["travertine"])


ROOMS = {
    "library": dict(build=library, cams={
        "library": dict(loc=(9.6, 1.4, 1.5), target=(-4.0, 13.9, 3.2), lens=17),
        "library2": dict(loc=(-12.0, 12.55, GZ + 1.5), target=(2.0, 2.0, 2.4), lens=18),
    }, stops={"library": (2.4, 4.4, 0.0)}),
    "baths": dict(build=baths, cams={
        "baths": dict(loc=(13.6, 12.6, 1.5), target=(-6.0, 2.0, 1.0), lens=19),
        "baths2": dict(loc=(-8.3, 2.7, 0.7), target=(6.0, 8.2, 0.6), lens=20),
    }, stops={"baths": (-3.8, 10.4, 0.0)}),
    "cinema": dict(build=cinema, cams={
        "cinema": dict(loc=(5.6, 10.6, 1.6), target=(-2.0, 2.5, 1.3), lens=18),
        "cinema2": dict(loc=(0.0, 1.0, 2.9), target=(0.0, 13.9, 3.6), lens=20),
    }, stops={"cinema": (0.0, 1.6, 1.26)}),
}


def build(room):
    sc = lib.reset(); M = family.materials(); rnd = random.Random(31)
    M["book"] = furn.book_material(); M["paper"] = lib.principled("paper", (0.84, 0.80, 0.70), 0.75); M["cloth"] = lib.fabric("book cloth", (0.25, 0.08, 0.05), 0.8, 0.2, 800)
    R = ROOMS[room]; R["build"](M, rnd)
    lite = os.environ.get("LITE") == "1"                      # previews: no hedges, no rooms across the atrium, no levels below
    atrium.build(M, random.Random(11), not lite, not lite)
    if not lite: atrium.build_lower(M, random.Random(13))
    family.lights()
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
        if j.startswith("plan:"):                  # a floor plan from above: it hides the ceilings, so it goes last
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=0.3)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        else:
            c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"]); lib.photo_finish(0.3, 0.15)
            t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
