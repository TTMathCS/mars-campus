"""The whole house in one picture, as an architect's section perspective: the Crown floating 40 m over the Stone
Garden with the Orb over its middle, and under the plain the Pentagon's five levels round the atrium, shown by taking
away everything under the ground on the near side of a vertical plane through the middle of the house. The plane
turns with the camera, so every frame of the turntable looks into the house. Numbers from the design (palace/design,
palace/crown/index.html, palace/pentagon/index.html): x east, y north, z up from the plain; bearings clockwise from
north. Sides of the Pentagon: 0 guests (54), 1 Jim's residence (126), 2 club (198), 3 baths (270), 4 library (342).
The rooms in the section are the rooms of floor plans Rev G (approved by Jim on 2 Oct 2026), read from the room program
(palace/tools/room_program.py): each room where the plan puts it, furnished for what it is. The Orb is 48 m across (Rev F).
  bvenv/bin/python blend/overall.py <job[,job...]> <out with %s> [w h spp]
Jobs: hero (the picture), whole (the same view, the ground left whole), turn<i>of<n> (frame i of a turntable of n
frames), spots (where the parts are on each picture, as JSON, for the labels you can click)."""
import bpy, bmesh, json, math, os, random, sys, time
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, crown
for _d in (os.path.dirname(os.path.abspath(__file__)), os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."),
           os.environ.get("ROOM_PROGRAM_DIR", ""), os.path.join(os.environ.get("MARS_REPO", ""), "palace", "tools"),
           "/home/user/mars-campus/palace/tools", "/home/claude/mars-campus/palace/tools", os.path.expanduser("~/mars-campus/palace/tools")):
    if os.path.exists(os.path.join(_d, "room_program.py")): sys.path.insert(0, os.path.abspath(_d)); break
import room_program as RP

D = math.pi / 180
T36 = math.tan(36 * D)
APA, VOID, COL_R = 24.09, 20.49, 5.0               # the atrium: the glass, the void's edge, the portal column
PA = 110.5                                          # the Pentagon's outer apothem
RINGS = [(24.09, 37.99), (42.21, 56.11), (60.33, 74.23), (78.45, 92.35), (96.57, 110.47)]
STREETS = [(RINGS[i][1], RINGS[i + 1][0]) for i in range(4)]
LEVELS = [("L1", -24.0, -16.0, "home"), ("L2", -41.0, -25.0, "garden"), ("L3", -50.0, -42.0, "work"), ("L4", -59.0, -51.0, "plant"), ("L5", -68.0, -60.0, "transit")]
NORMALS = [54 + 72 * k for k in range(5)]          # each side's outward bearing; the corners (and the spires) at 18 + 72k
R_IN, R_OUT, UNDER = 122.0, 138.0, 40.0             # the Crown's ring and its underside
DEEP = -320.0                                       # the bottom of the block of ground shown in section
TOP = 1.0                                           # the section takes away the ground under this height
HERO_AZ = 198.0                                     # the camera's bearing from the middle: a low part of the ring in front
SUN_OFF, SUN_EL = 70.0, 24.0                        # the sun: this far round to the camera's left, this high
CAM_D, CAM_H, CAM_LENS = 440.0, 95.0, 45
CAM_LOW, CAM_TOP = -82.0, 116.0                    # what the frame shows, in heights on the section's plane
VIEW = None; CUTTER = None                          # unit vector towards the camera; the box that takes the near side away
# what each room of floor plans Rev G gets for furniture in the section (palace/tools/room_program.py has the rooms)
ROOM_USE = {
    "L1-01": "music", "L1-02": "family", "L1-03": "dining", "L1-04": "study", "L1-05": "store", "L1-06": "bath",
    "L1-07": "moss", "L1-08": "suite", "L1-09": "wardrobe", "L1-10": "kitchen", "L1-11": "store", "L1-12": "robots",
    "L1-13": "store", "L1-14": "memory", "L1-15": "wardrobe", "L1-16": "machine",
    "L1-17": "cinema", "L1-18": "billiards", "L1-19": "ballroom", "L1-20": "wine", "L1-21": "store",
    "L1-22": "thermal", "L1-23": "pool", "L1-24": "sports", "L1-25": "sauna", "L1-26": "treatment",
    "L1-27": "library", "L1-28": "archive", "L1-29": "film", "L1-30": "stacks", "L1-31": "workshop",
    "L1-32": "lounge", "L1-41": "apartments", "L1-42": "apartments", "L1-43": "robots",
    "L3-01": "workshop", "L3-02": "foundry", "L3-03": "lab", "L3-04": "store", "L3-05": "crates", "L3-06": "foundry",
    "L3-07": "machine", "L3-08": "crates", "L3-09": "lab", "L3-10": "treatment", "L3-11": "lab", "L3-12": "machine",
    "L3-13": "store", "L3-14": "server", "L3-15": "server", "L3-16": "control", "L3-17": "air", "L3-18": "server",
    "L3-19": "control", "L3-20": "control", "L3-21": "control", "L3-22": "studio", "L3-23": "store",
    "L4-01": "power", "L4-02": "power", "L4-03": "machine", "L4-04": "machine", "L4-05": "water", "L4-06": "water",
    "L4-07": "water", "L4-08": "water", "L4-09": "air", "L4-10": "air", "L4-11": "air", "L4-12": "air",
    "L4-13": "crates", "L4-14": "crates", "L4-15": "machine", "L4-16": "machine", "L4-17": "machine",
    "L4-18": "workshop", "L4-19": "crates",
    "L5-01": "platform", "L5-02": "platform", "L5-03": "hangar", "L5-04": "cargo", "L5-05": "cargo", "L5-06": "cargo",
    "L5-07": "crates", "L5-08": "cargo", "L5-09": "vault", "L5-10": "vault", "L5-11": "vault", "L5-12": "machine",
    "L5-13": "crates", "L5-14": "machine", "L5-15": "machine", "L5-16": "hangar", "L5-17": "rovers", "L5-18": "rovers",
    "L5-19": "machine", "L5-20": "suits", "L5-21": "hangar",
}
for _c in range(33, 41): ROOM_USE["L1-%02d" % _c] = "suites"
# full-height rooms; the others have a floor between two storeys of 4 m (the plan's upper rooms, or a gallery of the room below)
TALL = ("cinema", "pool", "thermal", "library", "lounge", "moss", "ballroom", "sports", "gym", "foundry", "machine", "power", "water",
        "air", "platform", "hangar", "cargo", "rovers", "vault", "crates", "sauna")
UPPER_OF = {"music": "study", "family": "study", "dining": "study", "kitchen": "store", "bath": "wardrobe", "suite": "wardrobe",
            "billiards": "lounge", "memory": "memory", "apartments": "apartments", "suites": "suites", "treatment": "treatment"}


def sector_of(k): return 5 if k == 0 else k              # side k of the drawing is sector k of the plan, side 0 sector 5


def band_rooms(level_id, k, ri):
    """the rooms of floor plans Rev G in ring ri of side k: [(s0, s1, use, upper_use, code)] along the ring, s from -1 to 1
    across the side (as side_band takes it), and whether the room carries on into the next ring (one hall over the street)"""
    lv = next(l for l in RP.LEVELS if l["id"] == level_id); ring = "ABCDE"[ri]
    a0, a1 = RINGS[ri]; half = (a0 + a1) / 2 * T36
    def s_of(u, end): return end if u is None else max(-1.0, min(1.0, u / half))
    ground, upper, joined = [], [], False
    for r in lv["rooms"]:
        at = r["at"]
        if at[1] != sector_of(k): continue
        span = r.get("rings") or (at[0], at[0]); i0, i1 = "ABCDE".index(span[0]), "ABCDE".index(span[1])
        if not i0 <= ri <= i1: continue
        if len(at) > 4 and at[4] not in (None, 0.0): continue                   # behind another room across the ring
        s0, s1 = s_of(at[2] if len(at) > 2 else None, -1.0), s_of(at[3] if len(at) > 3 else None, 1.0)
        use = ROOM_USE.get(r["code"], "store")
        if r.get("upper"): upper.append((s0, s1, use))
        else:
            ground.append((s0, s1, use, r["code"]))
            if ri < i1: joined = True
    out = []
    for (s0, s1, use, code) in sorted(ground):
        up = next((u for (q0, q1, u) in upper if q0 < s1 - 1e-6 and q1 > s0 + 1e-6), None)
        if up is None and use not in TALL: up = UPPER_OF.get(use, use)
        out.append((s0, s1, use, up, code))
    return out, joined


SINGLE = ("cinema", "pool", "ballroom", "moss", "family", "music", "dining", "bath", "billiards", "kitchen", "sports")


def modules(use, a0, a1, s0, s1):
    """a long room is furnished in pieces about 14 m long (no walls between), so its furniture keeps its size"""
    n = 1 if use in SINGLE else max(1, int(round((s1 - s0) * (a0 + a1) / 2 * T36 / 14.0)))
    return [(s0 + (s1 - s0) * i / n, s0 + (s1 - s0) * (i + 1) / n) for i in range(n)]


def all_front(R): return all(front(R.p(u, v), 2.0) for u in (-R.w / 2, R.w / 2) for v in (-R.d / 2, R.d / 2))


MID = 3.9                                                       # the floor between the storeys, above the level's floor


def bdir(b): return Vector((math.sin(b * D), math.cos(b * D), 0.0))
def BP(r, b, z=0.0): return Vector((r * math.sin(b * D), r * math.cos(b * D), z))
def pent_pt(a, b): return BP(a / math.cos(36 * D), b)
def ahead(p): return 0.0 if VIEW is None else p[0] * VIEW.x + p[1] * VIEW.y
def front(p, margin=0.0): return VIEW is not None and ahead(p) > margin


def drop(o): bpy.data.objects.remove(o, do_unlink=True)


def place(o, whole=False, poche=True):
    """keep o if it lies behind the section, cut it if the section runs through it, drop it if it lies in front;
    `whole` keeps a thing the section runs through in one piece, and drops it if its middle is in front"""
    if VIEW is None or o is None: return o
    mw = o.matrix_basis; pts = [mw @ v.co for v in o.data.vertices]
    if not pts or min(p.z for p in pts) > TOP: return o
    ds = [ahead(p) for p in pts]
    if whole:
        if sum(ds) / len(ds) > 0: drop(o); return None
        return o
    if min(ds) >= -1e-4: drop(o); return None
    if max(ds) <= 1e-4: return o
    bo = o.modifiers.new("section", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = CUTTER; bo.solver = "EXACT"
    if poche: bo.material_mode = "TRANSFER"
    return o


def section_cutter(az):
    v = bdir(az); L = 30000.0; h = TOP - DEEP + 60.0
    c = lib.box("section", (2 * L, L, h), (v.x * L / 2, v.y * L / 2, TOP - h / 2), lib.principled("cut", (0.075, 0.07, 0.066), 0.9), rot_z=-az * D)
    c.hide_render = True; c.hide_viewport = True
    return c


def side_band(name, a0, a1, z0, z1, k, mat, s0=-1.0, s1=1.0):
    """a solid band of side k between apothems a0 and a1, from z0 to z1; s0..s1 (-1..1) takes part of its width"""
    n = NORMALS[k]; t = bdir(n + 90)
    def pt(a, s): return bdir(n) * a + t * (a * T36 * s)
    pts = [pt(a0, s0), pt(a0, s1), pt(a1, s1), pt(a1, s0)]
    return place(lib.poly_prism(name, [(p.x, p.y) for p in pts], z0, z1, mat))


class Kit:
    """many small things gathered into one mesh per material (thousands of objects would build and render slowly);
    a thing whose foot is on the near side of the section is left out"""
    def __init__(self, name): self.name = name; self.parts = {}
    def _bm(self, mat):
        if mat.name not in self.parts: self.parts[mat.name] = (mat, bmesh.new())
        return self.parts[mat.name][1]
    def box(self, mat, size, loc, rot=0.0):
        if not front(loc): lib.bm_box(self._bm(mat), size, loc, rot)
    def cyl(self, mat, r, h, loc, verts=12, r2=None):
        if front(loc): return
        res = bmesh.ops.create_cone(self._bm(mat), cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
        bmesh.ops.translate(self._bm(mat), vec=(loc[0], loc[1], loc[2] + h / 2), verts=res["verts"])
    def blob(self, mat, loc, radii, rnd=None, sub=2):
        if front(loc): return
        res = bmesh.ops.create_icosphere(self._bm(mat), subdivisions=sub, radius=1.0)
        for v in res["verts"]:
            j = 1.0 + (rnd.uniform(-0.14, 0.14) if rnd else 0.0)
            v.co = Vector((loc[0] + v.co.x * radii[0] * j, loc[1] + v.co.y * radii[1] * j, loc[2] + v.co.z * radii[2] * j))
    def done(self, smooth=("leaves", "olive", "rock", "pod")):
        for (mat, bm) in self.parts.values():
            lib.mesh_obj(self.name + " " + mat.name, bm, mat, smooth=mat.name in smooth)


# ---------------------------------------------------------------- materials
def strata_material():
    """the ground in section, as in the design (chapter 01, the ground at the site, from orbital radar of Arcadia
    Planitia): dust and sand about 1 m; ice-rich soil, ice between the grains, to 14 m; thick clean ice, faintly
    banded with dust, to 60 m; then old lava flows and sediments. The layers bend a little."""
    m, nt = lib._mat("strata")
    if nt is None: return m
    N, L = nt.nodes, nt.links; b = N["Principled BSDF"]
    geo = N.new("ShaderNodeNewGeometry"); pos = geo.outputs["Position"]          # world space: depth below the plain
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(pos, sep.inputs[0])
    n1 = N.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 0.011; n1.inputs["Detail"].default_value = 3; L.new(pos, n1.inputs["Vector"])
    z = lib._math(nt, "ADD", sep.outputs[2], lib._math(nt, "MULTIPLY", lib._math(nt, "SUBTRACT", n1.outputs["Fac"], 0.5), 5.0))
    zr = N.new("ShaderNodeMapRange"); zr.inputs["From Min"].default_value = -170.0; zr.inputs["From Max"].default_value = 0.0; L.new(z, zr.inputs["Value"])
    def zp(d): return (d + 170.0) / 170.0
    cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.interpolation = "LINEAR"; E = cr.color_ramp.elements
    stops = [(0.0, (0.075, 0.070, 0.066)), (zp(-112), (0.085, 0.078, 0.072)), (zp(-110), (0.20, 0.155, 0.12)), (zp(-96), (0.22, 0.17, 0.13)),
             (zp(-95), (0.30, 0.24, 0.19)), (zp(-84), (0.29, 0.23, 0.18)), (zp(-83), (0.19, 0.15, 0.12)), (zp(-72), (0.20, 0.16, 0.12)),
             (zp(-71), (0.27, 0.21, 0.16)), (zp(-61), (0.26, 0.20, 0.15)),
             (zp(-60), (0.47, 0.55, 0.62)), (zp(-45), (0.57, 0.66, 0.74)), (zp(-44.3), (0.42, 0.42, 0.42)), (zp(-43.6), (0.57, 0.66, 0.74)),
             (zp(-31), (0.60, 0.68, 0.76)), (zp(-30.4), (0.44, 0.44, 0.44)), (zp(-29.8), (0.60, 0.68, 0.76)), (zp(-14.5), (0.63, 0.71, 0.78)),
             (zp(-14), (0.36, 0.29, 0.23)), (zp(-1.2), (0.38, 0.30, 0.23)), (zp(-1.0), (0.42, 0.21, 0.10)), (1.0, (0.40, 0.19, 0.09))]
    E[0].position, E[0].color = stops[0][0], (*stops[0][1], 1); E[1].position, E[1].color = stops[-1][0], (*stops[-1][1], 1)
    for (p, c) in stops[1:-1]:
        e = E.new(p); e.color = (*c, 1)
    L.new(zr.outputs["Result"], cr.inputs["Fac"])
    def band(lo, hi):           # 1 between depths lo and hi (metres, negative down), with the bending
        return lib._math(nt, "MULTIPLY", lib._math(nt, "GREATER_THAN", z, lo), lib._math(nt, "LESS_THAN", z, hi))
    ice, soil, rock = band(-60.0, -14.0), band(-14.0, -1.0), band(-400.0, -60.0)
    # fine laminations in the rock and the soil, faint dust bands in the ice
    w = N.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "Z"; w.inputs["Scale"].default_value = 0.16; w.inputs["Distortion"].default_value = 9.0; w.inputs["Detail"].default_value = 6; w.inputs["Detail Scale"].default_value = 1.4; w.inputs["Detail Roughness"].default_value = 0.7
    L.new(pos, w.inputs["Vector"])
    nl = N.new("ShaderNodeTexNoise"); nl.inputs["Scale"].default_value = 0.05; nl.inputs["Detail"].default_value = 2; L.new(pos, nl.inputs["Vector"])
    lam = lib._math(nt, "MULTIPLY_ADD", lib._math(nt, "MULTIPLY", w.outputs["Fac"], nl.outputs["Fac"]), lib._math(nt, "SUBTRACT", 0.22, lib._math(nt, "MULTIPLY", ice, 0.14)), 0.86)
    # stones in the soil and the old sediments; grains of ice in the ice-rich soil
    vo = N.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 0.55; vo.inputs["Randomness"].default_value = 1.0; L.new(pos, vo.inputs["Vector"])
    stone = lib._math(nt, "MULTIPLY", lib._math(nt, "LESS_THAN", vo.outputs["Distance"], 0.16), lib._math(nt, "SUBTRACT", 1.0, ice))
    shade = lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MULTIPLY", stone, 0.42))
    vg = N.new("ShaderNodeTexVoronoi"); vg.inputs["Scale"].default_value = 2.6; L.new(pos, vg.inputs["Vector"])
    speck = lib._math(nt, "MULTIPLY", lib._math(nt, "LESS_THAN", vg.outputs["Distance"], 0.2), soil)
    n3 = N.new("ShaderNodeTexNoise"); n3.inputs["Scale"].default_value = 0.6; n3.inputs["Detail"].default_value = 8; L.new(pos, n3.inputs["Vector"])
    grain = lib._math(nt, "MULTIPLY_ADD", n3.outputs["Fac"], lib._math(nt, "SUBTRACT", 0.5, lib._math(nt, "MULTIPLY", ice, 0.32)), lib._math(nt, "ADD", 0.75, lib._math(nt, "MULTIPLY", ice, 0.16)))
    k = lib._math(nt, "MULTIPLY", lib._math(nt, "MULTIPLY", lam, shade), grain)
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0
    L.new(cr.outputs["Color"], mx.inputs[6]); cm = N.new("ShaderNodeCombineColor"); L.new(k, cm.inputs[0]); L.new(k, cm.inputs[1]); L.new(k, cm.inputs[2]); L.new(cm.outputs[0], mx.inputs[7])
    sp = N.new("ShaderNodeMix"); sp.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", speck, 0.7), sp.inputs["Factor"]); L.new(mx.outputs[2], sp.inputs[6]); sp.inputs[7].default_value = (0.70, 0.74, 0.76, 1)
    L.new(sp.outputs[2], b.inputs["Base Color"])
    # ice is smoother and a little glossy
    L.new(lib._math(nt, "SUBTRACT", 0.95, lib._math(nt, "MULTIPLY", ice, 0.6)), b.inputs["Roughness"])
    bh = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", n3.outputs["Fac"], lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MULTIPLY", ice, 0.7))), lib._math(nt, "MULTIPLY", stone, 0.6))
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.55; bm.inputs["Distance"].default_value = 0.3; L.new(bh, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def plain_material():
    """the plain: dust and rock in patches at every size, fading into the haze far off"""
    m, nt = lib._mat("plain")
    if nt is None: return m
    N, L = nt.nodes, nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.96
    tc = N.new("ShaderNodeTexCoord"); pos = tc.outputs["Object"]
    def noise(scale, detail=6):
        n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = detail; L.new(pos, n.inputs["Vector"]); return n.outputs["Fac"]
    f1, f2, f3, f4 = noise(0.0016, 5), noise(0.02, 6), noise(0.25, 8), noise(2.5, 6)
    fac = lib._math(nt, "ADD", lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", f1, 0.5), lib._math(nt, "MULTIPLY", f2, 0.28)), lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", f3, 0.14), lib._math(nt, "MULTIPLY", f4, 0.08)))
    cr = N.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.30; E[0].color = (0.13, 0.062, 0.034, 1); E[1].position = 0.72; E[1].color = (0.46, 0.25, 0.14, 1)
    e = E.new(0.52); e.color = (0.29, 0.145, 0.078, 1)
    L.new(fac, cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.5; bm.inputs["Distance"].default_value = 0.5
    L.new(lib._math(nt, "ADD", f3, lib._math(nt, "MULTIPLY", f4, 0.4)), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    haze(nt, b.outputs["BSDF"])
    return m


def haze(nt, shader_out, near=500.0, far=11000.0):
    """dust in the air: far things fade into the colour of the sky at the horizon"""
    N, L = nt.nodes, nt.links
    cd = N.new("ShaderNodeCameraData"); mr = N.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = near; mr.inputs["From Max"].default_value = far
    L.new(cd.outputs["View Distance"], mr.inputs["Value"])
    f = lib._math(nt, "POWER", mr.outputs["Result"], 0.7)
    em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (0.62, 0.40, 0.24, 1); em.inputs["Strength"].default_value = 1.0
    mx = N.new("ShaderNodeMixShader"); L.new(f, mx.inputs["Fac"]); L.new(shader_out, mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])


def ceramic():
    """the Crown's fired regolith: warm white, satin, laid in panels; a little darker towards the underside"""
    m, nt = lib._mat("crown ceramic")
    if nt is None: return m
    N, L = nt.nodes, nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.36; b.inputs["Coat Weight"].default_value = 0.12
    tc = N.new("ShaderNodeTexCoord"); pos = tc.outputs["Object"]; sep = N.new("ShaderNodeSeparateXYZ"); L.new(pos, sep.inputs[0])
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 0.04; n.inputs["Detail"].default_value = 6; L.new(pos, n.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.35; E[0].color = (0.84, 0.81, 0.76, 1); E[1].position = 0.70; E[1].color = (0.76, 0.72, 0.66, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"])
    # panel joints: courses 2.4 m high, panels 6 m long round the ring
    s = lib._math(nt, "MULTIPLY", lib._math(nt, "ARCTAN2", sep.outputs[0], sep.outputs[1]), 130.0)
    jh = lib._math(nt, "LESS_THAN", lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", sep.outputs[2], 2.4)), 0.022)
    jv = lib._math(nt, "LESS_THAN", lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", s, 6.0)), 0.012)
    joint = lib._math(nt, "MAXIMUM", jh, jv)
    low = N.new("ShaderNodeMapRange"); low.inputs["From Min"].default_value = 40.0; low.inputs["From Max"].default_value = 46.0; L.new(sep.outputs[2], low.inputs["Value"])
    k = lib._math(nt, "MULTIPLY", lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MULTIPLY", joint, 0.3)), lib._math(nt, "MULTIPLY_ADD", low.outputs["Result"], 0.12, 0.88))
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0
    cm = N.new("ShaderNodeCombineColor"); L.new(k, cm.inputs[0]); L.new(k, cm.inputs[1]); L.new(k, cm.inputs[2])
    L.new(cr.outputs["Color"], mx.inputs[6]); L.new(cm.outputs[0], mx.inputs[7]); L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.25; bm.inputs["Distance"].default_value = 0.05; bm.invert = True; L.new(joint, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def books():
    """rows of book spines: many muted colours"""
    m, nt = lib._mat("books")
    if nt is None: return m
    N, L = nt.nodes, nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.7
    tc = N.new("ShaderNodeTexCoord"); vo = N.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 9.0; L.new(tc.outputs["Object"], vo.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements; cr.color_ramp.interpolation = "CONSTANT"
    E[0].color = (0.35, 0.08, 0.06, 1); E[1].position = 0.85; E[1].color = (0.55, 0.48, 0.36, 1)
    for (p, c) in ((0.2, (0.10, 0.16, 0.22)), (0.4, (0.42, 0.30, 0.12)), (0.55, (0.12, 0.20, 0.12)), (0.7, (0.60, 0.56, 0.48))):
        e = E.new(p); e.color = (*c, 1)
    L.new(vo.outputs["Color"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    return m


def materials():
    P = lib.principled
    M = {"strata": strata_material(), "plain": plain_material(), "ceramic": ceramic(), "books": books(),
         "concrete": lib.plaster("structure", (0.52, 0.50, 0.47), 0.85, 0.05), "plaster": lib.plaster("rooms plaster", (0.60, 0.55, 0.49), 0.9, 0.03), "workwall": lib.plaster("work walls", (0.42, 0.43, 0.44), 0.9, 0.03),
         "oak": lib.wood("floors", (0.46, 0.33, 0.21), (0.32, 0.22, 0.13), 0.5, scale=0.2), "stonefloor": lib.travertine("stone floor", (0.72, 0.68, 0.62), (0.62, 0.58, 0.52), 0.5, 0.2),
         "workfloor": P("work floor", (0.55, 0.56, 0.57), 0.5), "darkfloor": P("dark floor", (0.20, 0.20, 0.21), 0.6),
         "travertine": lib.travertine("travertine", (0.80, 0.73, 0.62), (0.68, 0.60, 0.48), 0.5, 0.3),
         "glass": lib.glass("glass", (0.88, 0.93, 0.92)), "mirror": P("orb mirror", (0.93, 0.93, 0.95), 0.02, 1.0), "bronze": P("bronze", (0.35, 0.26, 0.18), 0.35, 1.0),
         "slot": P("slot glass", (0.02, 0.025, 0.03), 0.05, **{"Coat Weight": 1.0}), "grass": lib.leaf("grass", (0.08, 0.15, 0.04), 0.25, 0.8),
         "leaves": lib.leaf("leaves", (0.075, 0.15, 0.04), 0.35, 0.6), "olive": lib.leaf("olive", (0.13, 0.16, 0.09), 0.3, 0.6), "moss": lib.leaf("moss", (0.10, 0.17, 0.04), 0.2, 0.9),
         "bark": P("bark", (0.10, 0.08, 0.06), 0.9), "water": lib.glass("water", (0.55, 0.75, 0.78), 0.0, 1.33), "lakebed": P("lakebed", (0.05, 0.09, 0.09), 0.6),
         "pooltile": P("pool tile", (0.10, 0.30, 0.32), 0.2), "gravel": P("gravel", (0.44, 0.40, 0.36), 0.9),
         "paving": lib.travertine("paving", (0.50, 0.43, 0.35), (0.40, 0.33, 0.26), 0.6, 0.15), "rock": P("rock", (0.13, 0.085, 0.06), 0.85),
         "steel": P("steel", (0.62, 0.63, 0.65), 0.3, 1.0), "machine": P("machine", (0.50, 0.52, 0.55), 0.4, 0.6), "yellow": P("plant yellow", (0.65, 0.45, 0.08), 0.5),
         "dark": P("dark", (0.04, 0.04, 0.045), 0.6), "black": P("piano black", (0.01, 0.01, 0.012), 0.1, **{"Coat Weight": 1.0}),
         "walnut": lib.wood("walnut", (0.22, 0.13, 0.08), (0.12, 0.07, 0.04), 0.4), "linen": lib.fabric("linen", (0.80, 0.76, 0.68)),
         "white": P("white", (0.85, 0.85, 0.83), 0.4), "red": lib.fabric("red velvet", (0.36, 0.05, 0.05)), "felt": lib.fabric("green felt", (0.05, 0.24, 0.10)),
         "sofa": [lib.fabric("sofa a", (0.62, 0.58, 0.50)), lib.fabric("sofa b", (0.26, 0.30, 0.34)), lib.fabric("sofa c", (0.48, 0.30, 0.18))],
         "rug": lib.fabric("rug", (0.64, 0.58, 0.48)), "rugs": [lib.fabric("rug a", (0.64, 0.58, 0.48)), lib.fabric("rug b", (0.45, 0.16, 0.10)), lib.fabric("rug c", (0.20, 0.26, 0.36))],
         "art": [P("art a", (0.55, 0.22, 0.10), 0.6), P("art b", (0.15, 0.30, 0.45), 0.6), P("art c", (0.75, 0.62, 0.30), 0.6), P("art d", (0.20, 0.35, 0.22), 0.6)], "pot": P("pot", (0.48, 0.22, 0.12), 0.8), "crate": [P("crate a", (0.55, 0.45, 0.30), 0.8), P("crate b", (0.30, 0.38, 0.30), 0.7), P("crate c", (0.62, 0.60, 0.55), 0.6)],
         "container": [P("box a", (0.55, 0.16, 0.08), 0.6, 0.3), P("box b", (0.12, 0.24, 0.40), 0.6, 0.3), P("box c", (0.68, 0.66, 0.62), 0.6, 0.3), P("box d", (0.70, 0.50, 0.10), 0.6, 0.3)], "pod": P("pod", (0.86, 0.87, 0.88), 0.25, **{"Coat Weight": 0.6}),
         "warm": lib.emission("room light", (1.0, 0.80, 0.58), 4.0), "cool": lib.emission("work light", (0.88, 0.94, 1.0), 4.0),
         "street": lib.emission("street light", (1.0, 0.90, 0.75), 3.0), "screen": lib.emission("screen", (0.55, 0.75, 1.0), 3.0),
         "lamp": lib.emission("lamp", (1.0, 0.75, 0.45), 12.0), "bottles": lib.emission("bar shelves", (1.0, 0.62, 0.30), 4.0),
         "lampsky": lib.emission("sky of lamps", (0.80, 0.89, 1.0), 2.4)}
    return M


# ---------------------------------------------------------------- the ground and the Stone Garden
def ground(M):
    soil = lib.cyl("ground", 300.0, -DEEP, (0, 0, DEEP), M["strata"], verts=256, smooth=False)
    soil.data.materials.append(M["plain"])
    for p in soil.data.polygons:
        if p.normal.z > 0.9: p.material_index = 1
    hole = lib.poly_prism("pentagon hole", [(pent_pt(PA + 1.5, 18 + 72 * i).x, pent_pt(PA + 1.5, 18 + 72 * i).y) for i in range(5)], -70.0, -15.0, None)
    shaft = lib.cyl("shaft hole", 17.2, 20.0, (0, 0, -17.0), None, verts=128)
    for c in (hole, shaft):
        c.hide_render = True; c.hide_viewport = True
        bo = soil.modifiers.new("hole", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = c; bo.solver = "EXACT"
    place(soil, poche=False)
    plain = lib.cyl("plain", 80000.0, 0.1, (0, 0, -0.12), M["plain"], verts=192, smooth=False)
    pc = lib.cyl("plain hole", 299.5, 2.0, (0, 0, -1.0), None, verts=256); pc.hide_render = True; pc.hide_viewport = True
    bo = plain.modifiers.new("hole", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = pc; bo.solver = "EXACT"
    place(plain, poche=False)
    # far off, a few low rises in the haze
    rnd = random.Random(5)
    for i in range(9):
        b = rnd.uniform(0, 360); r = rnd.uniform(3500, 9000); p = BP(r, b)
        if front(p, -2000): continue
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
        s = (rnd.uniform(900, 2400), rnd.uniform(600, 1600), rnd.uniform(12, 45))
        for v in bm.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], max(v.co.z, 0.0) * s[2] - 2))
        o = lib.mesh_obj("rise", bm, M["plain"], smooth=True); o.location = (p.x, p.y, 0); o.rotation_euler = (0, 0, rnd.uniform(0, 3))
    # rocks on the plain
    K = Kit("plain"); rnd = random.Random(9)
    for i in range(1400):
        b = rnd.uniform(0, 360); r = 145 + rnd.expovariate(1 / 260.0); p = BP(r, b)
        s = rnd.choice((0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.3)) * (2.5 if rnd.random() < 0.06 else 1.0)
        K.blob(M["rock"], (p.x, p.y, -0.25 * s), (s * rnd.uniform(0.8, 1.4), s * rnd.uniform(0.7, 1.2), s * rnd.uniform(0.45, 0.8)), rnd, sub=1)
    K.done()
    # the Stone Garden: raked gravel inside a paved pentagon a little wider than the Pentagon, seven stones, glass
    # pavilions over the portals at the corners, the Sun Well's lens in the middle
    place(lib.poly_prism("paving", [(pent_pt(PA + 4.0, 18 + 72 * i).x, pent_pt(PA + 4.0, 18 + 72 * i).y) for i in range(5)], 0.0, 0.12, M["paving"]))
    place(lib.poly_prism("gravel", [(pent_pt(PA - 4.0, 18 + 72 * i).x, pent_pt(PA - 4.0, 18 + 72 * i).y) for i in range(5)], 0.0, 0.16, M["gravel"]))
    rnd = random.Random(7)
    for i in range(7):
        b = rnd.uniform(0, 360); r = rnd.uniform(35, 85); p = BP(r, b)
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
        s = (rnd.uniform(3, 6), rnd.uniform(2.5, 5), rnd.uniform(2, 3.5))
        for v in bm.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], max(v.co.z, -0.3) * s[2]))
        o = lib.mesh_obj("stone", bm, M["rock"], smooth=True); o.location = (p.x, p.y, 0.0); o.rotation_euler = (0, 0, rnd.uniform(0, 6))
        place(o, whole=True)
    for i in range(5):
        b = 18 + 72 * i; p = pent_pt(PA + 1.0, b)
        if front(p, -6): continue
        lib.box("pavilion glass", (7.0, 7.0, 4.0), (p.x, p.y, 2.1), M["glass"], rot_z=-b * D)
        lib.box("pavilion roof", (7.6, 7.6, 0.35), (p.x, p.y, 4.25), M["ceramic"], rot_z=-b * D)
        lib.box("pavilion floor", (7.6, 7.6, 0.2), (p.x, p.y, 0.1), M["paving"], rot_z=-b * D)
    place(lib.cyl("sun well lens", 17.0, 0.3, (0, 0, 0.0), M["glass"], verts=128))
    place(ring("sun well rim", 17.0, 18.4, -0.2, 0.6, M["bronze"]))


def ring(name, r0, r1, z0, z1, mat, n=128):
    import furn
    circ = lambda r: [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return furn.ring_prism(name, circ(r1), circ(r0), z0, z1, mat)


# ---------------------------------------------------------------- the Crown and the Orb
def roof(b):
    c = (1 + math.cos(5 * (b - 18) * D)) / 2; return 50 + 40 * c ** 6


def crown_ring(M):
    """the ring: walls of white ceramic from the underside at +40 m up to the roof, which rises to a spire over each of
    five parts; the spires narrow as they rise; window slots round both faces at +44 m. Built in 5-degree pieces: the
    pieces well on the near side cast no shadow (it would only fall across the section)"""
    n = 1440; secs = []
    for i in range(n + 1):
        b = 360.0 * i / n; top = roof(b); c6 = ((1 + math.cos(5 * (b - 18) * D)) / 2) ** 6; k = 6.5 * c6
        secs.append([BP(r, b, z) for (r, z) in [(R_IN, UNDER + 1.5), (R_IN + 1.2, UNDER), (R_OUT - 1.2, UNDER), (R_OUT, UNDER + 1.5), (R_OUT, 50.0), (R_OUT - k, top), (R_IN + k, top), (R_IN, 50.0)]])
    per = 20
    for s0 in range(0, n, per):
        bm = bmesh.new(); rows = [[bm.verts.new(v) for v in secs[i]] for i in range(s0, s0 + per + 1)]
        for a, c in zip(rows, rows[1:]):
            for j in range(8): bm.faces.new((a[j], c[j], c[(j + 1) % 8], a[(j + 1) % 8]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        o = lib.mesh_obj("crown", bm, M["ceramic"])
        for p in o.data.polygons: p.use_smooth = abs(p.normal.z) < 0.5
        if ahead(BP(130.0, 360.0 * (s0 + per / 2) / n)) > 50.0: o.visible_shadow = False
    sl = bmesh.new()
    for (r, sgn) in ((R_OUT + 0.02, 1), (R_IN - 0.02, -1)):
        s = 0.0; per_m = 2 * math.pi * r
        while s < per_m:
            b0 = s / r / D; b1 = (s + 5.0) / r / D
            q = [BP(r, b0, 44.0), BP(r, b1, 44.0), BP(r, b1, 45.2), BP(r, b0, 45.2)]
            vs = [sl.verts.new(v) for v in q]; sl.faces.new(vs if sgn > 0 else vs[::-1]); s += 8.0
    o = lib.mesh_obj("slots", sl, M["slot"]); o.visible_shadow = False
    bpy.ops.mesh.primitive_uv_sphere_add(segments=160, ring_count=80, radius=24.0, location=(0, 0, 72.0)); o = bpy.context.active_object; o.name = "orb"   # 48 m across (Rev F)
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(M["mirror"])


# ---------------------------------------------------------------- the Pentagon
class Room:
    """one room of a band: p(u, v, z) is the point u metres along the band from the room's middle, v metres across it
    (outwards positive), z above the floor"""
    def __init__(s, k, a0, a1, s0, s1, f, t):
        n = NORMALS[k]; s.ax, s.ay = bdir(n + 90), bdir(n); am = (a0 + a1) / 2; sm = (s0 + s1) / 2
        s.c = s.ay * am + s.ax * (sm * am * T36); s.w = (s1 - s0) * am * T36 * 0.82 - 0.6; s.d = a1 - a0 - 0.8
        s.f, s.t, s.rot = f + 0.06, t, -n * D
    def p(s, u, v, z=0.0):
        q = s.c + s.ax * u + s.ay * v; return (q.x, q.y, s.f + z)


def plant(K, M, loc, rnd, h=2.6):
    K.cyl(M["pot"], 0.35, 0.6, loc, 10, 0.28); K.cyl(M["bark"], 0.05, h * 0.5, (loc[0], loc[1], loc[2] + 0.5), 6)
    K.blob(M["leaves"], (loc[0], loc[1], loc[2] + h * 0.72), (h * 0.24, h * 0.24, h * 0.3), rnd, 1)


def tree(K, M, loc, h, rnd, olive=False):
    K.cyl(M["bark"], h * 0.045, h * 0.6, loc, 8, h * 0.025)
    for j in range(3):
        r = h * rnd.uniform(0.2, 0.28); o = (rnd.uniform(-0.15, 0.15) * h, rnd.uniform(-0.15, 0.15) * h, h * rnd.uniform(0.62, 0.78))
        K.blob(M["olive"] if olive else M["leaves"], (loc[0] + o[0], loc[1] + o[1], loc[2] + o[2]), (r * 1.2, r * 1.2, r), rnd, 2)


def ends(K, M, R, rnd, kind):
    """the cross walls at a room's two ends are what you see, looking into it from the section: shelves, art, boards"""
    w, d = R.w, R.d; r = R.rot
    for sg in (-1, 1):
        u = sg * (w / 2 - 0.25)
        if kind == "home":
            if rnd.random() < 0.6: K.box(M["books"], (0.4, d * 0.55, 2.5), R.p(u, rnd.uniform(-0.15, 0.15) * d, 1.25), r)
            else:
                K.box(rnd.choice(M["art"]), (0.06, rnd.uniform(1.6, 3.2), rnd.uniform(1.1, 1.8)), R.p(u, 0.0, 1.9), r)
                K.box(M["walnut"], (0.5, d * 0.4, 0.8), R.p(u - sg * 0.1, 0.0, 0.4), r)
        else:
            K.box(M["white"] if rnd.random() < 0.6 else M["screen"], (0.06, d * 0.4, 1.4), R.p(u, 0.0, 1.6), r)


def furnish(K, M, R, use, rnd):
    w, d, h = R.w, R.d, R.t - R.f; B = K.box; r = R.rot
    if use in ("family", "lounge", "music", "apartments", "suite", "suites", "library", "reading", "kitchen", "treatment", "bar", "billiards", "dining", "study", "memory"): ends(K, M, R, rnd, "home")
    elif use in ("studio", "office", "lab", "workshop", "control", "server"): ends(K, M, R, rnd, "work")
    if use in ("family", "lounge", "music", "apartments"):
        B(rnd.choice(M["rugs"]), (w * 0.55, d * 0.5, 0.02), R.p(0, 0, 0.01), r)
        B(rnd.choice(M["sofa"]), (2.8, 1.0, 0.85), R.p(0, d * 0.14, 0.43), r)
        for u in (-1.9, 1.9): B(rnd.choice(M["sofa"]), (1.0, 1.0, 0.8), R.p(u, -d * 0.02, 0.4), r)
        B(M["walnut"], (1.4, 0.8, 0.42), R.p(0, -0.1, 0.21), r)
        B(M["books"], (w * 0.6, 0.45, 2.4), R.p(0, d / 2 - 0.3, 1.2), r)
        plant(K, M, R.p(w * 0.36, d * 0.32), rnd); plant(K, M, R.p(-w * 0.36, -d * 0.3), rnd, 3.2)
        K.blob(M["lamp"], R.p(-w * 0.3, d * 0.3, 1.6), (0.25, 0.25, 0.25), None, 1)
        if use == "music": B(M["black"], (2.1, 1.5, 1.0), R.p(-w * 0.22, -d * 0.28, 0.5), r)
    elif use in ("suite", "suites", "treatment"):
        for u in ((0.0,) if w < 12 else (-w * 0.25, w * 0.25)):
            B(M["white"], (2.1, 2.2, 0.6), R.p(u, d * 0.18, 0.3), r); B(M["walnut"], (2.6, 0.15, 1.2), R.p(u, d * 0.18 + 1.15, 0.6), r)
            B(M["rug"], (3.2, 3.0, 0.02), R.p(u, d * 0.05, 0.01), r)
            B(rnd.choice(M["sofa"]), (0.9, 0.9, 0.8), R.p(u + 1.5, -d * 0.3, 0.4), r)
        if use == "suite":
            B(M["moss"], (w * 0.3, d * 0.35, 0.25), R.p(w * 0.3, -d * 0.15, 0.12), r); tree(K, M, R.p(w * 0.3, -d * 0.15, 0.2), 4.5, rnd)
        plant(K, M, R.p(-w * 0.38, -d * 0.35), rnd)
    elif use == "kitchen":
        B(M["white"], (w * 0.7, 0.7, 0.92), R.p(0, d / 2 - 0.4, 0.46), r); B(M["walnut"], (w * 0.7, 0.4, 0.9), R.p(0, d / 2 - 0.25, 2.0), r)
        B(M["stonefloor"], (4.0, 1.2, 0.92), R.p(0, 0.5, 0.46), r); B(M["walnut"], (3.2, 1.1, 0.75), R.p(0, -d * 0.3, 0.37), r)
    elif use == "dining":
        L_ = min(w * 0.6, 6.0); n = max(2, int(L_ / 0.9))
        B(M["walnut"], (L_, 1.2, 0.75), R.p(0, 0, 0.37), r)
        for i in range(n):
            for v in (-0.95, 0.95): B(M["linen"], (0.5, 0.5, 0.9), R.p(-L_ / 2 + (i + 0.5) * L_ / n, v, 0.45), r)
        K.blob(M["lamp"], R.p(0, 0, 2.3), (L_ * 0.3, 0.3, 0.1), None, 1)
        B(M["walnut"], (w * 0.3, 0.7, 1.05), R.p(w * 0.25, d / 2 - 1.0, 0.52), r); B(M["bottles"], (w * 0.3, 0.3, 1.6), R.p(w * 0.25, d / 2 - 0.3, 1.5), r)
    elif use == "study":
        B(M["books"], (w * 0.7, 0.45, 2.6), R.p(0, d / 2 - 0.3, 1.3), r)
        B(M["walnut"], (2.2, 1.0, 0.75), R.p(0, -d * 0.1, 0.37), r); B(M["screen"], (1.0, 0.05, 0.6), R.p(0, -d * 0.1 + 0.4, 1.05), r)
        B(rnd.choice(M["sofa"]), (1.0, 1.0, 0.8), R.p(w * 0.3, -d * 0.25, 0.4), r); plant(K, M, R.p(-w * 0.35, -d * 0.3), rnd)
    elif use == "bath":
        B(M["travertine"], (2.2, 1.1, 0.6), R.p(0, 0, 0.3), r); B(M["water"], (1.9, 0.8, 0.05), R.p(0, 0, 0.58), r)
        B(M["travertine"], (w * 0.5, 0.6, 0.9), R.p(0, d / 2 - 0.4, 0.45), r)
        for u in (-w * 0.35, w * 0.35): plant(K, M, R.p(u, -d * 0.3), rnd)
    elif use == "moss":
        B(M["moss"], (w * 0.85, d * 0.8, 0.2), R.p(0, 0, 0.1), r); B(M["water"], (w * 0.3, d * 0.25, 0.05), R.p(-w * 0.15, -d * 0.1, 0.21), r)
        tree(K, M, R.p(w * 0.18, d * 0.12, 0.2), 5.0, rnd)
        for i in range(5): K.blob(M["rock"], R.p(rnd.uniform(-0.4, 0.4) * w, rnd.uniform(-0.35, 0.35) * d, 0.25), (0.5, 0.4, 0.3), rnd, 1)
    elif use == "robots":
        for u in [x * 2.0 - w * 0.4 for x in range(max(1, int(w * 0.8 / 2.0) + 1))]:
            B(M["dark"], (1.2, 0.5, 1.8), R.p(u, d / 2 - 0.5, 0.9), r); K.blob(M["white"], R.p(u, d / 2 - 1.2, 0.8), (0.3, 0.3, 0.8), None, 1)
    elif use == "memory":
        for u in (-w * 0.25, 0.0, w * 0.25): B(M["walnut"], (1.1, 0.7, 0.8), R.p(u, 0, 0.4), r); B(M["glass"], (1.0, 0.6, 0.6), R.p(u, 0, 1.1), r)
        B(rnd.choice(M["rugs"]), (w * 0.5, d * 0.4, 0.02), R.p(0, -d * 0.2, 0.01), r); B(rnd.choice(M["sofa"]), (2.4, 0.9, 0.8), R.p(0, -d * 0.3, 0.4), r)
    elif use == "ballroom":
        B(M["stonefloor"], (w * 0.85, d * 0.8, 0.03), R.p(0, 0, 0.015), r)
        for u in (-w * 0.25, 0.0, w * 0.25): K.blob(M["lamp"], R.p(u, 0, h - 2.2), (0.9, 0.9, 0.7), None, 2)
        for u in (-w * 0.42, w * 0.42): B(M["walnut"], (0.6, d * 0.6, 1.0), R.p(u, 0, 0.5), r)
    elif use == "sports":
        B(M["felt"], (w * 0.8, d * 0.75, 0.03), R.p(0, 0, 0.015), r)
        B(M["rock"], (0.6, d * 0.7, h * 0.85), R.p(w / 2 - 0.6, 0, h * 0.42), r)
        for u in (-w * 0.38, w * 0.3): B(M["white"], (0.1, 1.8, 1.2), R.p(u, 0, 3.0), r)
    elif use == "server":
        for v in [x * 1.8 - d / 2 + 1.2 for x in range(int((d - 1.2) / 1.8))]:
            B(M["black"], (w * 0.8, 0.8, 2.2), R.p(0, v, 1.1), r); B(M["screen"], (w * 0.8, 0.02, 0.05), R.p(0, v - 0.41, 1.9), r)
    elif use == "suits":
        for u in [x * 1.1 - w * 0.4 for x in range(max(1, int(w * 0.8 / 1.1) + 1))]: K.blob(M["white"], R.p(u, d / 2 - 0.6, 1.0), (0.3, 0.25, 0.9), None, 1)
        B(M["walnut"], (w * 0.6, 0.5, 0.45), R.p(0, 0, 0.22), r)
    elif use in ("spa", "thermal", "pool", "sauna"):
        if use == "pool": ww, dd = w * 0.8, d * 0.6
        else: ww, dd = min(8.0, w * 0.5), d * 0.45
        B(M["pooltile"], (ww + 0.6, dd + 0.6, 0.12), R.p(0, 0, 0.0), r); B(M["water"], (ww, dd, 0.1), R.p(0, 0, 0.1), r)
        if use == "sauna": B(M["walnut"], (w * 0.6, 1.2, 0.9), R.p(0, d * 0.35, 0.45), r)
        for u in (-w * 0.35, w * 0.35): plant(K, M, R.p(u, d * 0.35), rnd)
    elif use in ("wardrobe", "wine", "archive", "film", "stacks", "store"):
        mat = M["books"] if use in ("archive", "stacks", "film") else (M["walnut"] if use != "store" else M["machine"])
        for v in [x * 1.8 - d / 2 + 1.0 for x in range(int((d - 1.0) / 1.8))]: B(mat, (w * 0.8, 0.5, 2.4 if use != "store" else 3.2), R.p(0, v, 1.2), r)
    elif use in ("library", "reading"):
        for v in (d / 2 - 0.35, d * 0.2): B(M["books"], (w * 0.75, 0.45, 3.0), R.p(0, v, 1.5), r)
        for u in (-w * 0.25, w * 0.25):
            B(M["walnut"], (2.4, 1.1, 0.75), R.p(u, -d * 0.15, 0.37), r); K.blob(M["lamp"], R.p(u, -d * 0.15, 1.0), (0.18, 0.18, 0.18), None, 1)
        plant(K, M, R.p(0, -d * 0.35), rnd, 3.0)
    elif use == "cinema":
        for i in range(5): B(M["red"], (w * 0.6, 0.9, 0.9), R.p(0, -d * 0.25 + i * 1.6, 0.45 + i * 0.35), r)
        B(M["screen"], (w * 0.7, 0.1, 3.0), R.p(0, -d / 2 + 0.3, 2.5), r)
    elif use == "billiards":
        for u in (-w * 0.25, w * 0.25): B(M["felt"], (2.8, 1.6, 0.82), R.p(u, 0, 0.41), r); K.blob(M["lamp"], R.p(u, 0, 2.4), (0.6, 0.3, 0.15), None, 1)
    elif use == "bar":
        B(M["walnut"], (w * 0.6, 0.8, 1.1), R.p(0, d * 0.1, 0.55), r); B(M["bottles"], (w * 0.6, 0.3, 1.8), R.p(0, d / 2 - 0.3, 1.8), r)
        for u in (-w * 0.25, 0.0, w * 0.25): B(M["walnut"], (1.0, 1.0, 0.75), R.p(u, -d * 0.25, 0.37), r)
    elif use == "gym":
        for i in range(4): B(M["dark"], (1.8, 0.8, 1.4), R.p(-w * 0.3 + i * w * 0.2, d * 0.15, 0.7), r)
    elif use == "foundry":
        for u in [x * 6.0 - w * 0.35 for x in range(max(1, int(w * 0.7 / 6.0) + 1))]:
            B(M["machine"], (3.0, 3.0, 3.6), R.p(u, -d * 0.1, 1.8), r); B(M["yellow"], (0.5, 0.5, 2.6), R.p(u + 1.8, -d * 0.1, 1.3), r)
        B(M["yellow"], (w * 0.9, 0.5, 0.6), R.p(0, d * 0.35, h - 1.5), r)
        B(M["steel"], (w * 0.85, 2.0, 0.9), R.p(0, d * 0.32, 0.45), r)
    elif use == "control":
        for v in (-d * 0.2, d * 0.15):
            B(M["dark"], (w * 0.6, 1.0, 0.8), R.p(0, v, 0.4), r); B(M["screen"], (w * 0.6, 0.08, 0.6), R.p(0, v + 0.45, 1.2), r)
        B(M["screen"], (0.08, d * 0.6, 1.8), R.p(w / 2 - 0.3, 0, 1.6), r); B(M["screen"], (0.08, d * 0.6, 1.8), R.p(-w / 2 + 0.3, 0, 1.6), r)
    elif use == "crates":
        for v in [x * 2.6 - d / 2 + 1.4 for x in range(int((d - 1.4) / 2.6))]:
            B(M["steel"], (w * 0.8, 1.2, 0.1), R.p(0, v, 2.2), r); B(M["steel"], (w * 0.8, 1.2, 0.1), R.p(0, v, 4.4), r)
            for z in (0.0, 2.3, 4.5):
                for u in [x * 1.6 - w * 0.36 for x in range(max(1, int(w * 0.72 / 1.6)))]:
                    if rnd.random() < 0.8: B(rnd.choice(M["crate"]), (1.3, 1.0, 1.0), R.p(u, v, z + 0.6), r)
    elif use == "cargo":
        for v in (-d * 0.2, d * 0.22):
            for u in [x * 6.6 - w * 0.36 for x in range(max(1, int(w * 0.72 / 6.6) + 1))]:
                for z in range(rnd.randint(1, 3)): B(rnd.choice(M["container"]), (6.06, 2.44, 2.59), R.p(u, v, 1.35 + z * 2.62), r)
    elif use == "rovers":
        for u in [x * 7.5 - w * 0.34 for x in range(max(1, int(w * 0.68 / 7.5) + 1))]:
            for v in (-d * 0.2, d * 0.2):
                if rnd.random() < 0.75:
                    B(M["white"], (5.0, 2.6, 2.0), R.p(u, v, 1.5), r); B(M["slot"], (2.0, 2.62, 0.7), R.p(u + 1.2, v, 2.0), r)
                    for du in (-1.8, 0.0, 1.8): B(M["dark"], (0.9, 2.9, 0.9), R.p(u + du, v, 0.45), r)
    elif use == "vault":
        for v in [x * 1.9 - d / 2 + 1.1 for x in range(int((d - 1.1) / 1.9))]: B(M["steel"], (w * 0.8, 0.7, h * 0.7), R.p(0, v, h * 0.35), r)
    elif use in ("studio", "office"):
        for v in (-d * 0.25, d * 0.1):
            for u in [x * 2.4 - w * 0.3 for x in range(max(1, int(w * 0.6 / 2.4)))]:
                B(M["white"], (1.6, 0.8, 0.75), R.p(u, v, 0.37), r); B(M["screen"], (0.9, 0.05, 0.5), R.p(u, v + 0.3, 1.0), r)
        plant(K, M, R.p(w * 0.4, d * 0.35), rnd)
    elif use in ("lab", "workshop"):
        for v in (-d * 0.2, d * 0.2): B(M["white"], (w * 0.7, 1.2, 0.95), R.p(0, v, 0.47), r)
        for u in (-w * 0.2, w * 0.15): B(M["machine"], (1.4, 1.0, 1.9), R.p(u, d * 0.4, 0.95), r)
    elif use in ("water", "air"):
        for u in [x * 5.5 - w * 0.36 for x in range(max(1, int(w * 0.72 / 5.5) + 1))]:
            for v in ((-d * 0.18, d * 0.2) if use == "water" else (0.0,)):
                rr = 2.0 if use == "water" else 1.2
                K.cyl(M["steel"], rr, h * 0.72, R.p(u, v), 24); K.blob(M["steel"], R.p(u, v, h * 0.72), (rr, rr, rr * 0.5), None, 2)
        for z in (h * 0.86, h * 0.92): B(M["steel"], (w * 0.9, 0.45, 0.45), R.p(0, d * 0.42, z), r)
        B(M["yellow"], (w * 0.9, 0.35, 0.35), R.p(0, -d * 0.42, h * 0.8), r); B(M["machine"], (w * 0.85, 1.2, 1.1), R.p(0, d * 0.42, 0.55), r)
    elif use == "power":
        for u in (-w * 0.22, w * 0.22):
            K.cyl(M["machine"], 3.2, h * 0.7, R.p(u, 0.0), 32); K.blob(M["machine"], R.p(u, 0.0, h * 0.7), (3.2, 3.2, 1.6), None, 2)
            K.cyl(M["yellow"], 3.3, 0.4, R.p(u, 0.0, h * 0.3), 32)
        B(M["steel"], (w * 0.9, 0.6, 0.6), R.p(0, d * 0.42, h * 0.85), r); B(M["dark"], (2.0, 1.4, 1.6), R.p(0, -d * 0.38, 0.8), r)
    elif use == "machine":
        for u in [x * 4.6 - w * 0.36 for x in range(max(1, int(w * 0.72 / 4.6) + 1))]:
            B(M["machine"], (3.4, 3.6, rnd.uniform(2.2, 4.2)), R.p(u, -d * 0.05, 1.6), r); B(M["yellow"], (0.4, 3.6, 0.4), R.p(u + 1.9, -d * 0.05, 3.0), r)
        B(M["steel"], (w * 0.9, 0.5, 0.5), R.p(0, d * 0.42, h * 0.8), r); B(M["darkfloor"], (w * 0.9, 1.6, 0.1), R.p(0, d * 0.38, h * 0.55), r)
    elif use in ("platform", "pods", "hangar"):
        for v in ((-d * 0.15, d * 0.25) if use != "hangar" else (0.0,)):
            B(M["steel"], (w * 0.95, 0.15, 0.15), R.p(0, v - 0.7, 0.08), r); B(M["steel"], (w * 0.95, 0.15, 0.15), R.p(0, v + 0.7, 0.08), r)
            for u in [x * 9.0 - w * 0.35 for x in range(max(1, int(w * 0.7 / 9.0) + 1))]:
                if rnd.random() < 0.7:
                    s = (7.0, 2.6, 2.4) if use != "hangar" else (12.0, 5.0, 4.0)
                    K.blob(M["pod"], R.p(u, v, s[2] / 2 + 0.25), (s[0] / 2, s[1] / 2, s[2] / 2), None, 2)
        if use == "platform": B(M["stonefloor"], (w * 0.9, 2.5, 1.1), R.p(0, d * 0.42, 0.55), r)


def level(M, lv, rnd):
    name, f, t, kind = lv; K = Kit(name)
    floor_mat = {"home": M["oak"], "work": M["workfloor"], "plant": M["concrete"], "transit": M["darkfloor"], "garden": M["concrete"]}[kind]
    for k in range(5):
        side_band(name + " slab", VOID, PA + 1.5, f - 1.0, f, k, M["concrete"])
        side_band(name + " outer wall", PA, PA + 1.5, f, t, k, M["concrete"])
    if kind == "garden":
        garden_level(M, lv, K, rnd)
    else:
        wall_mat = M["plaster"] if kind == "home" else M["workwall"]; light = M["warm"] if kind == "home" else M["cool"]
        for k in range(5):
            side_band(name + " floor", APA, PA, f, f + 0.06, k, floor_mat)
            bands = [band_rooms(name, k, ri) for ri in range(5)]
            for i, (a0, a1) in enumerate(STREETS):
                if not bands[i][1]: side_band(name + " street light", a0 + 1.2, a1 - 1.2, t - 0.1, t - 0.02, k, M["street"])
            for ri, (a0, a1) in enumerate(RINGS):
                segs, joined = bands[ri]
                if ri > 0 and not bands[ri - 1][1]: side_band(name + " wall", a0 - 0.15, a0 + 0.15, f, t, k, wall_mat)
                if not joined: side_band(name + " wall", a1 - 0.15, a1 + 0.15, f, t, k, wall_mat)
                for (s0, s1, use, up, code) in segs:
                    if s0 > -1 + 1e-6: side_band(name + " cross wall", a0, a1, f, t, k, wall_mat, s0 - 0.15 / (a1 * T36), s0 + 0.15 / (a1 * T36))
                    if up:     # a floor between the two storeys, lit underneath
                        side_band(name + " mid floor", a0 + 0.15, a1 - 0.15, f + MID, f + MID + 0.4, k, M["concrete"], s0, s1)
                        side_band(name + " mid finish", a0 + 0.15, a1 - 0.15, f + MID + 0.4, f + MID + 0.46, k, floor_mat, s0, s1)
                        side_band(name + " mid light", a0 + 0.4, a1 - 0.4, f + MID - 0.08, f + MID - 0.02, k, light, s0, s1)
                    side_band(name + " ceiling light", a0 + 0.4, a1 - 0.4, t - 0.08, t - 0.02, k, light, s0, s1)
                    for (m0, m1) in modules(use, a0, a1, s0, s1):
                        R = Room(k, a0, a1, m0, m1, f, f + MID if up else t)
                        if all_front(R): continue
                        furnish(K, M, R, use, rnd)
                        if up: furnish(K, M, Room(k, a0, a1, m0, m1, f + MID + 0.4, t), up, rnd)
            # the glass onto the atrium, with mullions
            side_band(name + " glass", APA - 0.03, APA + 0.03, f, t, k, M["glass"])
            n = NORMALS[k]
            for i in range(11):
                s = -1 + 2 * i / 10; p = bdir(n) * APA + bdir(n + 90) * (s * APA * T36)
                K.box(M["bronze"], (0.25, 0.3, t - f), (p.x, p.y, (f + t) / 2), -n * D)
    # the terraces round the void: hedges, a glass balustrade, olive trees, a bridge to the column
    for k in range(5):
        n = NORMALS[k]
        side_band(name + " hedge", VOID + 0.15, VOID + 0.95, f, f + 1.0, k, M["leaves"], -0.85, -0.12)
        side_band(name + " hedge", VOID + 0.15, VOID + 0.95, f, f + 1.0, k, M["leaves"], 0.12, 0.85)
        side_band(name + " balustrade", VOID - 0.02, VOID + 0.02, f, f + 1.1, k, M["glass"])
        for s in (-0.55, -0.3, 0.3, 0.55):
            p = bdir(n) * (VOID + 2.3) + bdir(n + 90) * (s * (VOID + 2.3) * T36)
            tree(K, M, (p.x, p.y, f + 0.05), 3.4, rnd, olive=True)
        b0 = bdir(n); q0 = b0 * COL_R; q1 = b0 * VOID; mid = (q0 + q1) / 2
        place(lib.box(name + " bridge", ((q1 - q0).length, 3.2, 0.6), (mid.x, mid.y, f - 0.3), M["travertine"], rot_z=math.atan2(b0.y, b0.x)))
    K.done()


def garden_level(M, lv, K, rnd):
    """L2, 16 m tall under a sky of lamps, as floor plans Rev G: the orchard (sector 1, side 1), the farm (2), the lake
    that is the water reserve (3), the forest (4) and the meadow with the tea house (5, side 0); slender columns
    planted from foot to head"""
    name, f, t, kind = lv
    for k in range(5):
        side_band("L2 ground", APA + 0.2, PA, f, f + 0.4, k, M["grass"])
        side_band("L2 sky of lamps", APA, PA, t - 0.12, t - 0.02, k, M["lampsky"])
        side_band("L2 glass", APA - 0.03, APA + 0.03, f, t, k, M["glass"])
    LA0, LA1, LS = APA + 4.0, RINGS[2][1], 0.78                         # L2-11 the lake: rings A to C of sector 3
    side_band("L2 lake", LA0, LA1, f + 0.05, f + 0.36, 3, M["water"], -LS, LS)
    side_band("L2 lake bed", LA0, LA1, f + 0.02, f + 0.06, 3, M["lakebed"], -LS, LS)
    def at(k, a, u): q = bdir(NORMALS[k]) * a + bdir(NORMALS[k] + 90) * u; return (q.x, q.y, f + 0.4)
    def in_lake(k, a, u): return k == 3 and LA0 - 3 < a < LA1 + 3 and abs(u) < LS * a * T36 + 3
    # sector 1, the orchard: fruit trees in rows (citrus, apples and pears, olives and figs, the vineyard, the nursery)
    for a in [APA + 7 + 6.5 * i for i in range(int((PA - APA - 11) / 6.5))]:
        uu = a * T36 - 4.0
        for u in [-uu + 6.0 * j for j in range(int(2 * uu / 6.0) + 1)]:
            tree(K, M, at(1, a, u + rnd.uniform(-0.4, 0.4)), rnd.uniform(4.0, 6.0), rnd, olive=(RINGS[2][0] < a < RINGS[2][1]))
    # sector 2, the farm: beds in rows, and the vertical farm's racks in ring B
    for a in [APA + 5 + 3.0 * i for i in range(int((PA - APA - 9) / 3.0))]:
        if RINGS[1][0] - 1 < a < RINGS[1][1] + 1: continue
        side_band("L2 crops", a, a + 1.5, f + 0.4, f + 0.85, 2, M["leaves"], -0.86, 0.86)
    for a in (RINGS[1][0] + 2.5, RINGS[1][0] + 7.0, RINGS[1][0] + 11.5):
        side_band("L2 vertical farm", a, a + 1.4, f + 0.4, f + 9.0, 2, M["leaves"], -0.8, 0.8)
    # sector 3, the lake, with willows round it; sector 4, the forest; sector 5, the meadow
    for i in range(1400):
        b = rnd.uniform(0, 360); k = int(((b - 18) % 360) // 72); n = NORMALS[k]
        if k in (1, 2): continue
        r = rnd.uniform(APA + 6, PA * 0.98 / math.cos((b - n) * D) - 4); a = r * math.cos((b - n) * D); u = r * math.sin((b - n) * D)
        if in_lake(k, a, u): continue
        keep = {3: 0.22, 4: 1.0, 0: 0.08}[k]
        if rnd.random() > keep: continue
        p = BP(r, b); tree(K, M, (p.x, p.y, f + 0.4), rnd.uniform(9.0, 13.0) if k == 4 else rnd.uniform(6.0, 9.0), rnd)
    for i in range(160):                                              # the meadow's flowers
        b = rnd.uniform(NORMALS[0] - 34, NORMALS[0] + 34); r = rnd.uniform(APA + 6, PA * 0.95); p = BP(r, b)
        K.blob(rnd.choice((M["red"], M["linen"], M["yellow"])), (p.x, p.y, f + 0.55), (1.2, 1.2, 0.18), rnd, 1)
    tp = at(0, (RINGS[2][0] + RINGS[2][1]) / 2, 0.0)                  # L2-19 the tea house
    K.box(M["walnut"], (6.0, 6.0, 2.8), (tp[0], tp[1], tp[2] + 1.4), -NORMALS[0] * D); K.box(M["dark"], (8.0, 8.0, 0.3), (tp[0], tp[1], tp[2] + 3.0), -NORMALS[0] * D)
    for i in range(110):
        b = rnd.uniform(0, 360); r = rnd.uniform(35, 100); p = BP(r, b); k = int(((b - 18) % 360) // 72)
        if in_lake(k, r * math.cos((b - NORMALS[k]) * D), r * math.sin((b - NORMALS[k]) * D)): continue
        K.cyl(M["concrete"], 0.6, t - f - 2.0, (p.x, p.y, f), 16); K.cyl(M["concrete"], 0.6, 2.0, (p.x, p.y, t - 2.0), 16, 1.5)
        K.cyl(M["leaves"], 0.78, t - f - 4.0, (p.x, p.y, f + 0.5), 12)


def atrium(M, rnd):
    lib.cyl("column", COL_R, 68.0 - 15.0, (0, 0, -68.0), M["travertine"], verts=96)
    place(lib.poly_prism("court lawn", [(pent_pt(VOID, 18 + 72 * i).x, pent_pt(VOID, 18 + 72 * i).y) for i in range(5)], -68.4, -68.0, M["grass"]))
    place(lib.cyl("court pool", 11.0, 0.1, (0, 0, -68.02), M["water"], verts=96)); place(lib.cyl("court pool bed", 11.0, 0.05, (0, 0, -68.3), M["pooltile"], verts=96))
    K = Kit("court")
    for i in range(10):
        b = 36 * i + 18; p = BP(15.0, b); tree(K, M, (p.x, p.y, -68.0), 4.0, rnd, olive=True)
    K.done()
    for k in range(5): side_band("roof slab", APA, PA + 1.5, -16.0, -15.0, k, M["concrete"])
    rf = lib.poly_prism("atrium roof", [(pent_pt(APA + 3.0, 18 + 72 * i).x, pent_pt(APA + 3.0, 18 + 72 * i).y) for i in range(5)], -16.0, -15.0, M["concrete"])
    hole = lib.cyl("lens hole", 17.0, 3.0, (0, 0, -17.0), None, verts=128); hole.hide_render = True; hole.hide_viewport = True
    bo = rf.modifiers.new("lens", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = hole; bo.solver = "EXACT"
    place(rf)
    place(ring("shaft lining", 17.0, 17.3, -16.0, 0.0, M["concrete"]))
    place(lib.cyl("sky lens", 17.0, 0.05, (0, 0, -15.5), M["glass"], verts=128))
    lib.area_light("lens light", (0, 0, -16.6), 30.0, 60000, (1.0, 0.95, 0.88), shape="DISK", spread=25)


# ---------------------------------------------------------------- the scene, the camera, the labels
def build(az, cut=True):
    global VIEW, CUTTER
    sc = lib.reset(); M = materials(); rnd = random.Random(11)
    VIEW, CUTTER = (bdir(az), section_cutter(az)) if cut else (None, None)
    ground(M); crown_ring(M)
    if cut:
        atrium(M, rnd)
        for lv in LEVELS: level(M, lv, rnd)
    sun_az = az + SUN_OFF
    crown.mars_sky(sun_az, SUN_EL, 1.0)
    for n in sc.world.node_tree.nodes:          # under the horizon, the haze's colour (no dark line past the plain's edge)
        if n.bl_idname == "ShaderNodeMix" and n.data_type == "RGBA" and tuple(round(c, 2) for c in n.inputs[7].default_value[:3]) == (0.14, 0.08, 0.05):
            n.inputs[7].default_value = (0.62, 0.40, 0.24, 1)
    lib.sun(SUN_EL, sun_az, 4.5, angle_deg=0.4, color=(1.0, 0.88, 0.72))
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 3
    return sc


def cam_at(az):
    p = bdir(az) * CAM_D; p.z = CAM_H
    shift = -(CAM_H - (CAM_LOW + CAM_TOP) / 2) / CAM_D * CAM_LENS / 36.0
    c = lib.camera("view", (p.x, p.y, p.z), (0.0, 0.0, CAM_H), lens=CAM_LENS, shift_y=shift, level=True); c.data.clip_end = 300000
    return c


def anchors(az):
    """the points the labels sit on: the Crown on its near ring, the Orb, the Stone Garden beyond the section, the Sun
    Well, the soil, each level and the sun court in the section's face"""
    right = bdir(az - 90)
    a = {"crown": BP(130.0, az + 38, 60.0), "orb": Vector((0, 0, 80.0)), "garden": BP(45.0, az + 180 - 60, 0.5), "sunwell": Vector((0, 0, 0.6)),
         "soil": right * (-70.0) + Vector((0, 0, -8.0)), "court": right * 13.0 + Vector((0, 0, -66.0)), "pentagon": right * (-64.0) + Vector((0, 0, -46.0))}
    for (name, f, t, kind) in LEVELS: a[name.lower()] = right * 64.0 + Vector((0, 0, (f + t) / 2))
    return a


def spots_for(cam, az):
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene; out = {}; bpy.context.view_layer.update()
    for k, p in anchors(az).items():
        v = world_to_camera_view(sc, cam, p); out[k] = [round(v.x, 4), round(1 - v.y, 4)]
    return out


if __name__ == "__main__":
    jobs = sys.argv[1].split(","); out = sys.argv[2]
    w, h, spp = (int(a) for a in (sys.argv[3:6] if len(sys.argv) > 5 else (1600, 900, 96)))
    todo = [j for j in jobs if j.startswith("spots") or not os.path.exists(out.replace("%s", j))]
    if not todo: print("nothing to do"); sys.exit(0)
    for j in todo:
        if j.startswith("spots"):
            lib.reset(); n = int(j[5:] or 24); data = {"hero": None, "frames": []}
            sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = 1600, 900
            data["hero"] = spots_for(cam_at(HERO_AZ), HERO_AZ)
            for i in range(n):
                az = HERO_AZ + 360.0 * i / n; data["frames"].append(spots_for(cam_at(az), az))
            open(out.replace("%s", "spots").replace(".jpg", ".json"), "w").write(json.dumps(data)); print("wrote spots", flush=True); continue
        if j in ("hero", "whole"): az = HERO_AZ
        elif j.startswith("turn"):
            i, n = (int(x) for x in j[4:].split("of")); az = HERO_AZ + 360.0 * i / n
        else: print("unknown job", j); continue
        t = time.time(); build(az, cut=(j != "whole")); print("built in %.1f s" % (time.time() - t), flush=True)
        lib.photo_finish(0.2, 0.12); cam_at(az)
        path = os.path.abspath(out.replace("%s", j)); tmp = path.replace(".jpg", ".part.jpg")
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=0.0); os.replace(tmp, path); print("rendered", j, "in %.0f s" % (time.time() - t), flush=True)
