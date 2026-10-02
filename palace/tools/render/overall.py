"""The whole house in one picture: the Crown floating 40 m over the Stone Garden, the Orb over its middle, and under
the ground the Pentagon's five levels round the atrium, shown by cutting away one fifth of the ground, from the middle
of one side to the middle of the next. Numbers from the design (palace/design, palace/crown/index.html,
palace/pentagon/index.html): x east, y north, z up from the plain; bearings clockwise from north.
  bvenv/bin/python blend/overall.py <job[,job...]> <out with %s> [w h spp]
Jobs: hero (the picture), turn<i>of<n> (one frame of a turntable round the house), spots (the screen positions of the
parts for every frame, as JSON)."""
import bpy, bmesh, json, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, crown

D = math.pi / 180
APA, VOID, COL_R = 24.09, 20.49, 5.0               # the atrium: the glass, the void's edge, the portal column
PA = 110.5                                          # the Pentagon's outer apothem (160 m sides)
RINGS = [(24.09, 37.99), (42.21, 56.11), (60.33, 74.23), (78.45, 92.35), (96.57, 110.47)]
LEVELS = [("L1", -24.0, -16.0, "home"), ("L2", -41.0, -25.0, "garden"), ("L3", -50.0, -42.0, "work"), ("L4", -59.0, -51.0, "plant"), ("L5", -68.0, -60.0, "transit")]
NORMALS = [54 + 72 * k for k in range(5)]          # each side's outward bearing; the corners (and the spires) at 18 + 72k
CUT = (198.0, 270.0)                                # the fifth cut away: from the middle of one side to the middle of the next
R_IN, R_OUT, UNDER = 122.0, 138.0, 40.0             # the Crown's ring, its underside
SUN = (238.0, 24.0)


def bdir(b): return Vector((math.sin(b * D), math.cos(b * D), 0.0))
def BP(r, b, z=0.0): return Vector((r * math.sin(b * D), r * math.cos(b * D), z))
def in_cut(b): b %= 360; return CUT[0] <= b <= CUT[1]


def pent_pt(a, b):
    """the point at apothem a on the corner line of bearing b (the corners are 36 degrees from the normals)"""
    return BP(a / math.cos(36 * D), b)


def side_band(name, a0, a1, z0, z1, k, mat, s0=-1.0, s1=1.0):
    """a solid band of side k between apothems a0 and a1, from z0 to z1; s0..s1 (-1..1) takes part of its width"""
    n = NORMALS[k]; t = bdir(n + 90)
    def pt(a, s):
        half = a * math.tan(36 * D); return bdir(n) * a + t * (half * s)
    pts = [pt(a0, s0), pt(a0, s1), pt(a1, s1), pt(a1, s0)]
    return lib.poly_prism(name, [(p.x, p.y) for p in pts], z0, z1, mat)


def wedge_cutter(r=400.0, z0=-120.0, z1=5.0):
    pts = [(0.0, 0.0)] + [(r * math.sin(b * D), r * math.cos(b * D)) for b in (CUT[0] + (CUT[1] - CUT[0]) * i / 8 for i in range(9))]
    c = lib.poly_prism("cut", pts[::-1], z0, z1, None); c.hide_render = True; c.hide_viewport = True
    return c


def cut(obj, cutter):
    bo = obj.modifiers.new("cut", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cutter; bo.solver = "EXACT"
    return obj


# ---------------------------------------------------------------- materials
def strata_material():
    """the ground seen in section: red regolith, then packed soil, then ice-rich ground streaked white, then rock"""
    m, nt = lib._mat("strata")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.92
    g = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(g.outputs["Position"], sep.inputs[0])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 0.08; n.inputs["Detail"].default_value = 6; L.new(g.outputs["Position"], n.inputs["Vector"])
    z = lib._math(nt, "ADD", sep.outputs[2], lib._math(nt, "MULTIPLY", n.outputs["Fac"], 4.0))
    cr = nt.nodes.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.0; E[0].color = (0.13, 0.12, 0.12, 1); E[1].position = 1.0; E[1].color = (0.45, 0.20, 0.10, 1)
    for (pos, c) in ((0.35, (0.22, 0.20, 0.20)), (0.55, (0.55, 0.52, 0.50)), (0.68, (0.30, 0.20, 0.15)), (0.83, (0.36, 0.17, 0.09)), (0.95, (0.48, 0.24, 0.13))):
        e = E.new(pos); e.color = (*c, 1)
    zz = nt.nodes.new("ShaderNodeMapRange"); zz.inputs["From Min"].default_value = -95.0; zz.inputs["From Max"].default_value = 0.0; L.new(z, zz.inputs["Value"])
    L.new(zz.outputs["Result"], cr.inputs["Fac"])
    w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "Z"; w.inputs["Scale"].default_value = 0.6; w.inputs["Distortion"].default_value = 3.0; w.inputs["Detail"].default_value = 3; L.new(g.outputs["Position"], w.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; L.new(lib._math(nt, "MULTIPLY", w.outputs["Fac"], 0.25), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (0.7, 0.7, 0.7, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.6; L.new(n.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def ceramic():
    """the Crown's fired regolith: warm white, matt, a little variation and grime"""
    m, nt = lib._mat("crown ceramic")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.42; b.inputs["Coat Weight"].default_value = 0.15
    tc = nt.nodes.new("ShaderNodeTexCoord"); n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 0.05; n.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.35; cr.color_ramp.elements[0].color = (0.86, 0.84, 0.80, 1); cr.color_ramp.elements[1].position = 0.75; cr.color_ramp.elements[1].color = (0.74, 0.70, 0.64, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    return m


def materials():
    P = lib.principled
    M = {"strata": strata_material(), "plain": crown.mars_ground_material(), "ceramic": ceramic(),
         "concrete": lib.plaster("structure", (0.50, 0.48, 0.45), 0.85, 0.05), "slab_top": lib.wood("floors", (0.42, 0.30, 0.20), (0.30, 0.20, 0.12), 0.5, scale=0.2),
         "plaster": lib.plaster("rooms plaster", (0.80, 0.76, 0.70), 0.9, 0.03), "travertine": lib.travertine("travertine", (0.80, 0.73, 0.62), (0.68, 0.60, 0.48), 0.5, 0.3),
         "glass": lib.glass("glass", (0.88, 0.93, 0.92)), "mirror": P("orb mirror", (0.93, 0.93, 0.95), 0.025, 1.0), "bronze": P("bronze", (0.35, 0.26, 0.18), 0.35, 1.0),
         "slot": P("slot glass", (0.02, 0.025, 0.03), 0.05, **{"Coat Weight": 1.0}), "grass": lib.leaf("grass", (0.07, 0.14, 0.035), 0.3, 0.8),
         "leaves": lib.leaf("leaves", (0.08, 0.15, 0.04), 0.35, 0.6), "olive": lib.leaf("olive", (0.13, 0.16, 0.09), 0.3, 0.6), "bark": P("bark", (0.10, 0.08, 0.06), 0.9),
         "water": lib.glass("water", (0.60, 0.78, 0.80), 0.0, 1.33), "lakebed": P("lakebed", (0.05, 0.08, 0.08), 0.6),
         "gravel": lib.principled("gravel", (0.50, 0.46, 0.42), 0.9), "paving": lib.travertine("paving", (0.62, 0.55, 0.46), (0.50, 0.43, 0.35), 0.6, 0.15),
         "rock": P("rock", (0.12, 0.10, 0.09), 0.85), "machine": P("machine", (0.55, 0.57, 0.60), 0.35, 0.7), "dark": P("dark", (0.04, 0.04, 0.045), 0.6),
         "warm": lib.emission("room light", (1.0, 0.80, 0.58), 2.2), "cool": lib.emission("work light", (0.86, 0.92, 1.0), 2.4),
         "lampsky": lib.emission("sky of lamps", (0.82, 0.90, 1.0), 2.6), "court": lib.emission("lens light", (1.0, 0.96, 0.9), 3.0)}
    M["furn"] = [P("f1", (0.55, 0.50, 0.42), 0.8), P("f2", (0.25, 0.18, 0.12), 0.6), P("f3", (0.62, 0.60, 0.55), 0.7), P("f4", (0.30, 0.34, 0.38), 0.6), P("f5", (0.45, 0.20, 0.12), 0.8)]
    return M


# ---------------------------------------------------------------- the ground and the Stone Garden
def ground(M, cutter):
    # the soil and rock round and over the Pentagon: a disc 600 m across, with the Pentagon, the light shaft and the
    # cut fifth taken out; the plain beyond
    soil = lib.cyl("soil", 300.0, 95.0, (0, 0, -95.0), M["strata"], verts=256, smooth=False)
    soil.data.materials.append(M["plain"])
    for p in soil.data.polygons:
        if p.normal.z > 0.9: p.material_index = 1
    hole = lib.poly_prism("pentagon hole", [(pent_pt(PA + 1.5, 18 + 72 * i).x, pent_pt(PA + 1.5, 18 + 72 * i).y) for i in range(5)], -70.0, -15.0, None)
    hole.hide_render = True; hole.hide_viewport = True
    shaft = lib.cyl("shaft hole", 17.2, 20.0, (0, 0, -17.0), None, verts=128); shaft.hide_render = True; shaft.hide_viewport = True
    for c in (hole, shaft, cutter):
        bo = soil.modifiers.new("hole", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = c; bo.solver = "EXACT"
    plain = lib.cyl("plain", 9000.0, 0.1, (0, 0, -0.12), M["plain"], verts=128, smooth=False)
    pc = lib.cyl("plain hole", 299.5, 2.0, (0, 0, -1.0), None, verts=256); pc.hide_render = True; pc.hide_viewport = True
    bo = plain.modifiers.new("hole", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = pc; bo.solver = "EXACT"
    # the Stone Garden: raked gravel inside a paved pentagon a little wider than the Pentagon, seven stones, glass
    # pavilions over the portals at the five corners, the Sun Well's lens in the middle
    pav = lib.poly_prism("paving", [(pent_pt(PA + 4.0, 18 + 72 * i).x, pent_pt(PA + 4.0, 18 + 72 * i).y) for i in range(5)], 0.0, 0.12, M["paving"])
    grav = lib.poly_prism("gravel", [(pent_pt(PA - 4.0, 18 + 72 * i).x, pent_pt(PA - 4.0, 18 + 72 * i).y) for i in range(5)], 0.0, 0.16, M["gravel"])
    for o in (pav, grav): cut(o, cutter)
    rnd = random.Random(7)
    for i in range(7):
        b = rnd.uniform(0, 360); r = rnd.uniform(35, 85)
        if in_cut(b): b = (b + 90) % 360
        p = BP(r, b); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
        s = (rnd.uniform(3, 6), rnd.uniform(2.5, 5), rnd.uniform(2, 3.5))
        for v in bm.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], max(v.co.z, -0.3) * s[2]))
        o = lib.mesh_obj("stone", bm, M["rock"], smooth=True); o.location = (p.x, p.y, 0.0); o.rotation_euler = (0, 0, rnd.uniform(0, 6))
    for i in range(5):
        b = 18 + 72 * i; p = pent_pt(PA + 1.0, b)
        if in_cut(b): continue
        lib.box("pavilion glass", (7.0, 7.0, 4.0), (p.x, p.y, 2.1), M["glass"], rot_z=-b * D)
        lib.box("pavilion roof", (7.6, 7.6, 0.35), (p.x, p.y, 4.25), M["ceramic"], rot_z=-b * D)
        lib.box("pavilion floor", (7.6, 7.6, 0.2), (p.x, p.y, 0.1), M["paving"], rot_z=-b * D)
    lens = lib.cyl("sun well lens", 17.0, 0.3, (0, 0, 0.0), M["glass"], verts=128)
    furn_ring("sun well rim", 17.0, 18.4, -0.2, 0.6, M["bronze"])


def furn_ring(name, r0, r1, z0, z1, mat, n=128):
    import furn
    circ = lambda r: [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return furn.ring_prism(name, circ(r1), circ(r0), z0, z1, mat)


# ---------------------------------------------------------------- the Crown and the Orb
def roof(b):
    c = (1 + math.cos(5 * (b - 18) * D)) / 2; return 50 + 40 * c ** 6


def crown_ring(M):
    """the ring: walls of white ceramic from the underside at +40 m up to the roof, which rises to a spire over each of
    five parts; the spires narrow as they rise. Window slots run round both faces at +44 m."""
    bm = bmesh.new(); rings = []; n = 1440
    for i in range(n):
        b = 360.0 * i / n; top = roof(b); c6 = ((1 + math.cos(5 * (b - 18) * D)) / 2) ** 6
        k = 6.5 * c6                                   # how much the spire narrows at its top
        sec = [(R_IN, UNDER + 1.5), (R_IN + 1.2, UNDER), (R_OUT - 1.2, UNDER), (R_OUT, UNDER + 1.5), (R_OUT, 50.0), (R_OUT - k, top), (R_IN + k, top), (R_IN, 50.0)]
        rings.append([bm.verts.new(BP(r, b, z)) for (r, z) in sec])
    for i in range(n):
        a, c = rings[i], rings[(i + 1) % n]
        for j in range(len(a)): bm.faces.new((a[j], c[j], c[(j + 1) % len(a)], a[(j + 1) % len(a)]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ring = lib.mesh_obj("crown", bm, M["ceramic"], smooth=False)
    for p in ring.data.polygons: p.use_smooth = abs(p.normal.z) < 0.5
    # the slots: 1.2 m tall at +44 m, 5 m open and 3 m of wall, on both faces
    sl = bmesh.new()
    for (r, sgn) in ((R_OUT + 0.02, 1), (R_IN - 0.02, -1)):
        s = 0.0; per = 2 * math.pi * r
        while s < per:
            b0 = s / r / D; b1 = (s + 5.0) / r / D
            q = [BP(r, b0, 44.0), BP(r, b1, 44.0), BP(r, b1, 45.2), BP(r, b0, 45.2)]
            vs = [sl.verts.new(v) for v in q]; sl.faces.new(vs if sgn > 0 else vs[::-1]); s += 8.0
    lib.mesh_obj("slots", sl, M["slot"])
    # the Orb, a mirror 40 m across over the middle, from +52 to +92 m
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=20.0, location=(0, 0, 72.0)); o = bpy.context.active_object; o.name = "orb"
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(M["mirror"])
    return ring


# ---------------------------------------------------------------- the Pentagon
def level(M, lv, cutter, rnd):
    name, f, t, kind = lv; objs = []
    # the slab under the level (floor) and the structure round it; the outer retaining wall
    for k in range(5):
        objs.append(side_band(name + " floor", VOID, PA + 1.5, f - 1.0, f, k, M["concrete"]))
        objs.append(side_band(name + " floor finish", APA, PA, f, f + 0.06, k, M["slab_top"] if kind in ("home", "work") else M["concrete"]))
        objs.append(side_band(name + " outer wall", PA, PA + 1.5, f, t, k, M["concrete"]))
    if kind == "garden":
        garden_level(M, lv, objs, rnd)
    else:
        for k in range(5):
            # walls along the rings (both faces of every street) and across them, every 14 m or so
            for (a0, a1) in RINGS:
                for a in (a0, a1):
                    if a == RINGS[0][0]: continue
                    objs.append(side_band(name + " wall", a - 0.15, a + 0.15, f, t, k, M["plaster"]))
                half0, half1 = a0 * math.tan(36 * D), a1 * math.tan(36 * D)
                nx = max(2, int(2 * half1 / 14.0))
                for i in range(1, nx):
                    s = -1 + 2 * i / nx
                    objs.append(side_band(name + " cross wall", a0, a1, f, t, k, M["plaster"], s - 0.15 / half1, s + 0.15 / half1))
                # the room's light, a glowing ceiling, and a few things standing in it
                objs.append(side_band(name + " ceiling light", a0 + 0.3, a1 - 0.3, t - 0.08, t - 0.02, k, M["warm"] if kind == "home" else M["cool"]))
                for j in range(int((a1 - a0) * half1 / 40)):
                    s = rnd.uniform(-0.9, 0.9); a = rnd.uniform(a0 + 1.5, a1 - 1.5); n = NORMALS[k]
                    p = bdir(n) * a + bdir(n + 90) * (s * a * math.tan(36 * D))
                    if kind == "plant" and rnd.random() < 0.5:
                        o = lib.cyl(name + " tank", rnd.uniform(1.5, 2.8), rnd.uniform(3.0, 6.5), (p.x, p.y, f), M["machine"], verts=24)
                    else:
                        o = lib.box(name + " thing", (rnd.uniform(1.0, 3.0), rnd.uniform(0.8, 2.0), rnd.uniform(0.4, 1.6 if kind != "transit" else 3.0)), (p.x, p.y, f + 0.5), rnd.choice(M["furn"]), rot_z=rnd.uniform(0, 3))
                    objs.append(o)
            # the glass onto the atrium, with mullions
            objs.append(side_band(name + " glass", APA - 0.03, APA + 0.03, f, t, k, M["glass"]))
            n = NORMALS[k]; half = APA * math.tan(36 * D)
            for i in range(11):
                s = -1 + 2 * i / 10; p = bdir(n) * APA + bdir(n + 90) * (s * half)
                objs.append(lib.box(name + " mullion", (0.25, 0.3, t - f), (p.x, p.y, (f + t) / 2), M["bronze"], rot_z=-n * D))
    # the terrace's hedges along the void, a few olive trees
    for k in range(5):
        objs.append(side_band(name + " hedge", VOID + 0.15, VOID + 0.95, f, f + 1.0, k, M["leaves"], -0.85, -0.12))
        objs.append(side_band(name + " hedge", VOID + 0.15, VOID + 0.95, f, f + 1.0, k, M["leaves"], 0.12, 0.85))
        objs.append(side_band(name + " balustrade", VOID - 0.02, VOID + 0.02, f, f + 1.1, k, M["glass"]))
        n = NORMALS[k]
        for s in (-0.55, -0.3, 0.3, 0.55):
            p = bdir(n) * (VOID + 2.3) + bdir(n + 90) * (s * (VOID + 2.3) * math.tan(36 * D))
            if not in_cut(math.degrees(math.atan2(p.x, p.y))): objs.append(tree(M, (p.x, p.y, f + 0.05), 3.4, rnd, olive=True))
        # the bridge to the column
        b0 = bdir(n); q0 = b0 * COL_R; q1 = b0 * VOID; mid = (q0 + q1) / 2
        objs.append(lib.box(name + " bridge", ((q1 - q0).length, 3.2, 0.6), (mid.x, mid.y, f - 0.3), M["travertine"], rot_z=math.atan2(b0.y, b0.x)))
    for o in objs:
        if o is not None and o.type == "MESH": cut(o, cutter)
    return objs


def tree(M, loc, h, rnd, olive=False):
    tr = lib.cyl("trunk", h * 0.05, h * 0.55, loc, M["bark"], verts=10)
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    r = h * rnd.uniform(0.28, 0.36)
    for v in bm.verts: v.co = Vector((v.co.x * r * (1 + 0.2 * rnd.random()), v.co.y * r, v.co.z * r * 0.8))
    cn = lib.mesh_obj("canopy", bm, M["olive"] if olive else M["leaves"], smooth=True); cn.location = (loc[0], loc[1], loc[2] + h * 0.68)
    cn.parent = None
    return cn


def garden_level(M, lv, objs, rnd):
    """L2, 16 m tall under a sky of lamps: grass, trees, the lake, slender columns planted from foot to head"""
    name, f, t, kind = lv
    for k in range(5):
        objs.append(side_band("L2 ground", APA + 0.2, PA, f, f + 0.4, k, M["grass"]))
        objs.append(side_band("L2 sky of lamps", APA, PA, t - 0.12, t - 0.02, k, M["lampsky"]))
        objs.append(side_band("L2 glass", APA - 0.03, APA + 0.03, f, t, k, M["glass"]))
    # the lake, in the side towards the north-west
    lake = side_band("L2 lake", 50.0, 92.0, f + 0.05, f + 0.36, 4, M["water"], -0.55, 0.4); objs.append(lake)
    objs.append(side_band("L2 lake bed", 50.0, 92.0, f + 0.02, f + 0.06, 4, M["lakebed"], -0.55, 0.4))
    for i in range(170):
        b = rnd.uniform(0, 360); r = rnd.uniform(APA + 6, PA * 0.98 / math.cos(((b - 18) % 72 - 36) * D) - 4)
        p = BP(r, b)
        k = int(((b - 18) % 360) // 72); sk = (k + 1) % 5
        if 4 * 72 + 18 - 30 < (b % 360) < 4 * 72 + 18 + 30 and 55 < r < 90: continue    # keep the lake clear
        objs.append(tree(M, (p.x, p.y, f + 0.4), rnd.uniform(6.0, 11.0), rnd))
    for i in range(55):
        b = rnd.uniform(0, 360); r = rnd.uniform(35, 100); p = BP(r, b)
        objs.append(lib.cyl("L2 column", 0.6, t - f - 3.0, (p.x, p.y, f), M["concrete"], verts=16))
        objs.append(lib.cyl("L2 column head", 0.6, 3.0, (p.x, p.y, t - 3.0), M["concrete"], verts=16, r2=3.5))
        objs.append(lib.cyl("L2 column green", 0.75, t - f - 4.0, (p.x, p.y, f + 0.5), M["leaves"], verts=12))


def atrium(M, cutter, rnd):
    objs = []
    objs.append(lib.cyl("column", COL_R, 68.0 - 15.0, (0, 0, -68.0), M["travertine"], verts=96))
    # the sun court at the bottom: a lawn round a pool at the column's foot, olive trees
    court = lib.poly_prism("court lawn", [(pent_pt(VOID, 18 + 72 * i).x, pent_pt(VOID, 18 + 72 * i).y) for i in range(5)], -68.4, -68.0, M["grass"]); objs.append(court)
    objs.append(lib.cyl("court pool", 11.0, 0.1, (0, 0, -68.02), M["water"], verts=96)); objs.append(lib.cyl("court pool bed", 11.0, 0.05, (0, 0, -68.3), M["lakebed"], verts=96))
    for i in range(10):
        b = 36 * i + 18; p = BP(15.0, b)
        if not in_cut(b): objs.append(tree(M, (p.x, p.y, -68.0), 4.0, rnd, olive=True))
    # the roof of the atrium at L1's top, open round the column to the light shaft; the shaft up to the Sun Well
    rf = lib.poly_prism("atrium roof", [(pent_pt(APA + 3.0, 18 + 72 * i).x, pent_pt(APA + 3.0, 18 + 72 * i).y) for i in range(5)], -16.0, -15.0, M["concrete"]); objs.append(rf)
    hole = lib.cyl("lens hole", 17.0, 3.0, (0, 0, -17.0), None, verts=128); hole.hide_render = True; hole.hide_viewport = True
    bo = rf.modifiers.new("lens", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = hole; bo.solver = "EXACT"
    objs.append(furn_ring("shaft lining", 17.0, 17.3, -16.0, 0.0, M["plaster"]))
    objs.append(lib.cyl("sky lens", 17.0, 0.05, (0, 0, -15.5), M["glass"], verts=128))
    for o in objs: cut(o, cutter)
    # the lens's light falls straight down the shaft
    lib.area_light("lens light", (0, 0, -16.5), 30.0, 60000, (1.0, 0.95, 0.88), shape="DISK", spread=25)
    # soil over the Pentagon is the ground disc; the Pentagon's roof slab
    for k in range(5): cut(side_band("roof slab", APA, PA + 1.5, -16.0, -15.0, k, M["concrete"]), cutter)


def spots_for(cam):
    """where the parts are on the picture, as fractions of its width and height (for the labels you can click)"""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene; out = {}
    anchors = {"crown": BP(130.0, 160.0, 62.0), "orb": Vector((0, 0, 72.0)), "garden": BP(70.0, 120.0, 0.5), "pentagon": BP(60.0, 234.0, -30.0),
               "l1": BP(80.0, 234.0, -20.0), "l2": BP(80.0, 234.0, -33.0), "court": Vector((0, 0, -66.0))}
    for k, p in anchors.items():
        v = world_to_camera_view(sc, cam, p); out[k] = [round(v.x, 4), round(1 - v.y, 4), v.z > 0]
    return out


def build():
    sc = lib.reset(); M = materials(); rnd = random.Random(11)
    cutter = wedge_cutter()
    ground(M, cutter); crown_ring(M); atrium(M, cutter, rnd)
    for lv in LEVELS: level(M, lv, cutter, rnd)
    crown.mars_sky(SUN[0], SUN[1], 1.0)
    lib.sun(SUN[1], SUN[0], 4.5, angle_deg=0.4, color=(1.0, 0.88, 0.72))
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3
    return sc


def cam_at(az, dist=470.0, height=175.0, target=(0.0, 0.0, -18.0), lens=46):
    p = Vector(target) + bdir(az) * dist; p.z = height
    c = lib.camera("view", (p.x, p.y, p.z), target, lens=lens, level=False); c.data.clip_end = 20000
    return c


if __name__ == "__main__":
    jobs = sys.argv[1].split(","); out = sys.argv[2]
    w, h, spp = (int(a) for a in (sys.argv[3:6] if len(sys.argv) > 5 else (1600, 900, 96)))
    todo = [j for j in jobs if j == "spots" or not os.path.exists(out.replace("%s", j))]
    if not todo: print("nothing to do"); sys.exit(0)
    t = time.time(); build(); print("built in %.1f s" % (time.time() - t), flush=True)
    lib.photo_finish(0.2, 0.12)
    for j in todo:
        if j == "spots":
            n = 24; data = {}
            for i in range(n): data[i] = spots_for(cam_at(234.0 + 360.0 * i / n))
            data["hero"] = spots_for(cam_at(228.0))
            open(out.replace("%s", "spots").replace(".jpg", ".json"), "w").write(json.dumps(data)); print("wrote spots", flush=True); continue
        if j == "hero": cam_at(228.0)
        elif j.startswith("turn"):
            i, n = (int(x) for x in j[4:].split("of")); cam_at(234.0 + 360.0 * i / n)
        path = os.path.abspath(out.replace("%s", j)); tmp = path.replace(".jpg", ".part.jpg")
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=0.0); os.replace(tmp, path); print("rendered", j, "in %.0f s" % (time.time() - t), flush=True)
