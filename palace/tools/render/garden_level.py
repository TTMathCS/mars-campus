"""The garden level, L2 of the Pentagon, for Cycles: 16 m tall under a sky of lamps, from 17 m to 1 m below L1's floor.
Built in the frame of the ring-A rooms (pent_rooms.py): x along the atrium glass, y out from it, z up; each room is
modelled from z = 0 at L2's floor and then moved down to it, so the atrium's levels (atrium.py) fit round it.

The lake (L2-11): rings A to C of sector 3 with their streets, 3,259 m², 2.5 m deep on average: the water reserve
you can see. The glass onto the atrium at y = 0 with doors in the middle bay; a beach behind the glass and a jetty
out into the water with a rowing boat; two rows of columns carry L1 where its streets run above; the forest (L2-14)
beyond the avenue on the right, its stream falling into the lake over rocks; the farm (L2-06 to L2-08) beyond the
avenue on the left; the street to the fish farm (L2-12) behind the far bank.
  bvenv/bin/python blend/garden_level.py <room> <cam[,cam...]|pano:stop|plan:view> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix, noise
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, atrium, family, suite

A = lib.ASSETS
Z0 = -17.0                    # L2's floor in L1's frame
TOP = 16.0                    # the sky of lamps
T36 = math.tan(math.radians(36))
Y1, YW = 50.0, 54.2           # the back of ring C; the wall across the street behind it
WL = -0.35                    # the lake's surface, a step below the beach
ROWS = {16.0: (4.5, 13.5, 22.5), 34.0: (4.5, 13.5, 22.5, 31.5)}      # the columns under L1's streets: y, and x either side
JX0, JX1, JY0, JY1 = 0.8, 3.2, 3.6, 21.0      # the jetty, and its head from JY1 to JY1 + 3 across HX0..HX1
HX0, HX1 = -1.4, 5.4
DECK = 0.3


def hw(y): return 14.41 + T36 * y           # the lake's half-width at y; the avenues beyond, 6.2 m across in x


# ---------------------------------------------------------------- materials
def materials(M):
    P = lib.principled
    M["teak"] = lib.wood("weathered teak", (0.40, 0.35, 0.29), (0.27, 0.23, 0.19), 0.62, scale=1.6, coat=0.0, along="Y")
    M["teak_x"] = lib.wood("weathered teak across", (0.40, 0.35, 0.29), (0.27, 0.23, 0.19), 0.62, scale=1.6, coat=0.0, along="X")
    M["boat"] = lib.wood("boat mahogany", (0.30, 0.13, 0.055), (0.15, 0.06, 0.025), 0.22, scale=0.8, coat=0.9)
    M["boat_paint"] = P("boat paint", (0.78, 0.78, 0.75), 0.28, **{"Coat Weight": 0.6, "Coat Roughness": 0.08})
    M["reed"] = lib.leaf("reed", (0.16, 0.20, 0.065), 0.3, 0.55)
    M["reed_dry"] = lib.leaf("dry reed", (0.42, 0.34, 0.18), 0.25, 0.7)
    M["cattail"] = P("cattail", (0.16, 0.08, 0.04), 0.9)
    M["lily"] = lib.leaf("lily pad", (0.045, 0.11, 0.025), 0.25, 0.22)
    M["lily_flower"] = lib.lampshade("water lily", (0.95, 0.93, 0.88))
    M["broadleaf"] = lib.leaf("broadleaf", (0.05, 0.105, 0.028), 0.35, 0.5)
    M["broadleaf2"] = lib.leaf("broadleaf 2", (0.07, 0.12, 0.03), 0.3, 0.45)
    M["willow_leaf"] = lib.leaf("willow leaf", (0.14, 0.19, 0.055), 0.25, 0.5)
    M["trunk"] = lib.wood("trunk bark", (0.20, 0.18, 0.16), (0.09, 0.08, 0.07), 0.9, scale=4.0, coat=0.0, along="Z")
    M["rock"] = suite.rock_material("lake rock", (0.10, 0.095, 0.09), (0.34, 0.32, 0.29), lichen=True)
    M["stainless"] = P("stainless", (0.62, 0.62, 0.62), 0.22, 1.0)
    M["basalt"] = P("wet basalt", (0.055, 0.055, 0.052), 0.38)
    M["rope"] = lib.fabric("rope", (0.62, 0.55, 0.42), 0.9, 0.2, 200)
    M["rib"] = P("ceiling rib", (0.06, 0.06, 0.065), 0.5)
    M["slab"] = lib.plaster("slab soffit", (0.70, 0.70, 0.68))
    M["sky"] = sky_material()
    M["sand"] = sand_material()
    M["water_lake"] = lake_water()
    M["falls"] = falls_material()
    M["foam"] = foam_material()
    M["towel"] = lib.fabric("towel", (0.86, 0.85, 0.82), 0.95, 0.6, 900, 0.5)
    M["blue_towel"] = lib.fabric("blue towel", (0.20, 0.30, 0.42), 0.95, 0.6, 900, 0.5)
    return M


def sky_material():
    """the sky of lamps: square panels of light, a summer sky's pale blue, each panel a little different"""
    m, nt = lib._mat("sky of lamps panels")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); e = N.new("ShaderNodeEmission")
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / 2.25, 1 / 2.25, 1.0); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    fl = N.new("ShaderNodeVectorMath"); fl.operation = "FLOOR"; L.new(mp.outputs["Vector"], fl.inputs[0])
    wn = N.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "3D"; L.new(fl.outputs["Vector"], wn.inputs["Vector"])
    st = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", wn.outputs["Value"], 0.12), 2.14)
    e.inputs["Color"].default_value = (0.80, 0.88, 1.0, 1); L.new(st, e.inputs["Strength"])
    L.new(e.outputs["Emission"], N["Material Output"].inputs["Surface"])
    return m


def sand_material():
    """the beach and the lake bed: dry pale sand, darker where the water wets it, then green-brown, darker and bluer
    the deeper it lies (the water's colour, done on the bed so the surface can stay clear)"""
    m, nt = lib._mat("lake sand")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.92
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    z = sep.outputs["Z"]
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 2.5; n.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n.inputs["Vector"])
    dry = N.new("ShaderNodeValToRGB"); dry.color_ramp.elements[0].color = (0.50, 0.43, 0.33, 1); dry.color_ramp.elements[1].color = (0.66, 0.59, 0.47, 1); L.new(n.outputs["Fac"], dry.inputs["Fac"])
    wet = N.new("ShaderNodeMix"); wet.data_type = "RGBA"; wet.blend_type = "MULTIPLY"; wet.inputs["Factor"].default_value = 1.0; L.new(dry.outputs["Color"], wet.inputs[6]); wet.inputs[7].default_value = (0.55, 0.52, 0.48, 1)
    fw = N.new("ShaderNodeMapRange"); fw.inputs["From Min"].default_value = WL + 0.18; fw.inputs["From Max"].default_value = WL + 0.02; L.new(z, fw.inputs["Value"])
    m1 = N.new("ShaderNodeMix"); m1.data_type = "RGBA"; L.new(fw.outputs["Result"], m1.inputs["Factor"]); L.new(dry.outputs["Color"], m1.inputs[6]); L.new(wet.outputs[2], m1.inputs[7])
    fd = N.new("ShaderNodeMapRange"); fd.inputs["From Min"].default_value = WL - 0.1; fd.inputs["From Max"].default_value = WL - 3.0; L.new(z, fd.inputs["Value"])
    fdp = lib._math(nt, "POWER", fd.outputs["Result"], 0.6)
    m2 = N.new("ShaderNodeMix"); m2.data_type = "RGBA"; L.new(fdp, m2.inputs["Factor"]); L.new(m1.outputs[2], m2.inputs[6]); m2.inputs[7].default_value = (0.012, 0.045, 0.042, 1)
    L.new(m2.outputs[2], b.inputs["Base Color"])
    rp = N.new("ShaderNodeTexWave"); rp.wave_type = "BANDS"; rp.bands_direction = "Y"; rp.inputs["Scale"].default_value = 0.9; rp.inputs["Distortion"].default_value = 6.0; rp.inputs["Detail"].default_value = 2; L.new(tc.outputs["Object"], rp.inputs["Vector"])
    f2 = N.new("ShaderNodeTexNoise"); f2.inputs["Scale"].default_value = 60; f2.inputs["Detail"].default_value = 4; L.new(tc.outputs["Object"], f2.inputs["Vector"])
    h = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", rp.outputs["Fac"], 0.5), f2.outputs["Fac"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.3; bm.inputs["Distance"].default_value = 0.01; L.new(h, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def lake_water():
    """the lake's surface: clear water with small waves from the wind fans; the camera and reflections see water,
    light passes straight through it to the bed"""
    m = lib.glass("lake water", (0.90, 0.97, 0.95), 0.0, 1.33); nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord");
    def nm_(scale, strength, rot):
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale); mp.inputs["Rotation"].default_value = (0, 0, rot); L.new(tc.outputs["Object"], mp.inputs["Vector"])
        t = lib._tex(nt, os.path.join(A, "waternormals.jpg"), "Non-Color"); L.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    t1 = nm_(0.09, 0.0, 0.0); t2 = nm_(0.031, 0.0, 0.7)
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.inputs["Factor"].default_value = 0.5; L.new(t1.outputs["Color"], mx.inputs[6]); L.new(t2.outputs["Color"], mx.inputs[7])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.16; L.new(mx.outputs[2], nm.inputs["Color"]); L.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def falls_material():
    """falling water: white streaks along the fall, clear between them"""
    m, nt = lib._mat("falling water")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.86, 0.90, 0.90, 1); b.inputs["Roughness"].default_value = 0.35
    b.inputs["Transmission Weight"].default_value = 0.4
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (14.0, 14.0, 0.8); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 3.0; n.inputs["Detail"].default_value = 6; L.new(mp.outputs["Vector"], n.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.42; cr.color_ramp.elements[1].position = 0.62; L.new(n.outputs["Fac"], cr.inputs["Fac"])
    tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader"); L.new(cr.outputs["Color"], mx.inputs["Fac"]); L.new(tr.outputs["BSDF"], mx.inputs[1]); L.new(b.outputs["BSDF"], mx.inputs[2])
    L.new(mx.outputs["Shader"], N["Material Output"].inputs["Surface"])
    return m


def foam_material():
    """white water where the fall lands, breaking up into the clear lake round it"""
    m, nt = lib._mat("foam")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.85, 0.88, 0.88, 1); b.inputs["Roughness"].default_value = 0.6
    tc = N.new("ShaderNodeTexCoord"); n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 2.2; n.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n.inputs["Vector"])
    g = N.new("ShaderNodeTexGradient"); g.gradient_type = "SPHERICAL"; L.new(tc.outputs["Object"], g.inputs["Vector"])
    f = lib._math(nt, "SUBTRACT", lib._math(nt, "MULTIPLY", g.outputs["Fac"], 1.6), lib._math(nt, "MULTIPLY", n.outputs["Fac"], 0.9))
    cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.05; cr.color_ramp.elements[1].position = 0.35; L.new(f, cr.inputs["Fac"])
    tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader"); L.new(cr.outputs["Color"], mx.inputs["Fac"]); L.new(tr.outputs["BSDF"], mx.inputs[1]); L.new(b.outputs["BSDF"], mx.inputs[2])
    L.new(mx.outputs["Shader"], N["Material Output"].inputs["Surface"])
    return m


# ---------------------------------------------------------------- the ground and the water
def softmin(ds, k=2.0): return -k * math.log(sum(math.exp(-d / k) for d in ds))


def inside(x, y):
    """how far (x, y) lies inside the lake, in metres; negative on the banks. A beach along the glass, banks along
    the avenues and the far side, a bay at the left where the lilies grow"""
    near = y - (6.6 + 0.5 * math.sin(0.31 * x + 1.0) - 2.2 * math.exp(-((x + 10.5) / 3.2) ** 2))
    far = (Y1 - 4.2 + 1.3 * math.sin(0.19 * x + 0.4) + 0.6 * math.sin(0.53 * x)) - y
    side = ((hw(y) - 3.6 - 0.9 * math.sin(0.23 * y + 0.8 * (x > 0))) - abs(x)) * math.cos(math.radians(36))
    return softmin((near, far, side))


def depth(d): return 3.6 * (1 - math.exp(-max(d, 0.0) / 5.0))


def ground_z(x, y):
    if y < 2.4 and abs(x) < 17.0: return 0.0                       # the paved walk along the glass
    d = inside(x, y)
    if d >= 0: return WL - 0.06 - depth(d)
    beach = abs(x) < 15.0 and y < 10.5
    slope = 3.6 if beach else 1.4
    t = min(1.0, -d / slope); t = t * t * (3 - 2 * t)
    z = (WL - 0.06) + (0.0 - (WL - 0.06)) * t
    if not beach:                                                    # gentle swells on the banks
        z += 0.35 * t * max(0.0, noise.noise(Vector((x * 0.09, y * 0.09, 0.5)))) + 0.12 * t * noise.noise(Vector((x * 0.3, y * 0.3, 2.0)))
    return z


def ground(M):
    """the terrain from the glass to the far wall and well out under the avenues: a heightfield on a 0.5 m grid,
    sand on the beach and under the water, grass on the banks"""
    x0, x1, y0, y1, st = -78.0, 78.0, 0.3, YW, 0.5
    nx, ny = int((x1 - x0) / st) + 1, int((y1 - y0) / st) + 1
    bm = bmesh.new(); V = []
    for j in range(ny):
        y = y0 + j * st; row = []
        for i in range(nx):
            x = x0 + i * st; row.append(bm.verts.new((x, y, ground_z(x, y))))
        V.append(row)
    for j in range(ny - 1):
        for i in range(nx - 1):
            f = bm.faces.new((V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]))
            cx, cy = x0 + (i + 0.5) * st, y0 + (j + 0.5) * st; zc = sum(v.co.z for v in f.verts) / 4
            f.material_index = 0 if (zc < WL + 0.16 or (abs(cx) < 15.0 and cy < 10.5)) else 1
    o = lib.mesh_obj("lake ground", bm, [M["sand"], M["lawn"]], smooth=True)
    lib.box("lake ground under", (160.0, YW + 2.0, 0.4), (0.0, YW / 2, -4.6), M["soil"])
    return o


def water(M):
    bm = bmesh.new(); vs = [bm.verts.new((x, y, WL)) for (x, y) in ((-70.0, 3.0), (70.0, 3.0), (70.0, Y1 + 1.0), (-70.0, Y1 + 1.0))]
    bm.faces.new(vs); return lib.mesh_obj("lake surface", bm, M["water_lake"])


# ---------------------------------------------------------------- the room: glass, columns, sky, walls
def structure(M):
    # the slab above, the sky of lamps under it, the ribs between its panels and the beams over the columns
    lib.box("slab over L2", (200.0, YW + 3.0, 0.95), (0.0, (YW + 3.0) / 2, TOP + 0.495), M["slab"])
    sky = lib.box("sky of lamps", (200.0, YW + 2.7, 0.02), (0.0, 0.3 + (YW + 2.7) / 2, TOP - 0.02), M["sky"])
    bm = bmesh.new(); x = -99.0
    while x < 99.0:
        lib.bm_box(bm, (0.09, YW + 2.7, 0.22), (x, 0.3 + (YW + 2.7) / 2, TOP - 0.14)); x += 2.25
    y = 0.6
    while y < YW + 2.0:
        lib.bm_box(bm, (198.0, 0.09, 0.22), (0.0, y, TOP - 0.14)); y += 2.25
    lib.mesh_obj("sky ribs", bm, M["rib"])
    for yb in ROWS:
        lib.box("beam", (200.0, 1.3, 1.1), (0.0, yb, TOP - 0.55), M["column"])
    lib.box("beam", (200.0, 1.0, 1.1), (0.0, 0.1, TOP - 0.55), M["column"])
    # the columns: coursed stone from the lake bed to a flared head under the beam, a dark wet plinth round the foot
    for yb, xs in ROWS.items():
        for sx in xs:
            for x in (-sx, sx):
                zb = ground_z(x, yb) - 0.3
                lib.cyl("column", 0.72, TOP - 1.1 - zb - 0.9, (x, yb, zb), M["column"], verts=48)
                furn.lathe("column head", [(0.0, 0.0), (0.72, 0.0), (0.8, 0.35), (0.98, 0.72), (1.02, 0.9), (0.0, 0.9)], M["column"], 48, (x, yb, TOP - 2.0))
                lib.cyl("column foot", 0.86, max(0.2, 0.55 - zb), (x, yb, zb), M["basalt"], verts=48, bevel=0.02)
    # the walls round the garden: the far wall across the street behind the lake, walls far out beyond the avenues,
    # and the front wall either side of the atrium's glass (the corner cores stand at its ends)
    lib.box("far wall", (200.0, 0.5, TOP), (0.0, YW + 0.25, TOP / 2), M["far_wall"])
    for sgn in (-1, 1):
        lib.box("front wall", (60.0, 0.5, TOP), (sgn * (17.7 + 30.0), -0.25, TOP / 2), M["far_wall"])
        lib.box("side wall", (0.5, YW + 1.0, TOP), (sgn * 96.0, YW / 2, TOP / 2), M["far_wall"])
    # the doors in the middle bay of the glass, and the walk along it
    for (a, b_) in ((-1.565, 0.0), (0.0, 1.565)):
        cx = (a + b_) / 2; w = b_ - a
        for (sx, sz, px, pz) in ((w, 0.05, 0, 0.025), (w, 0.05, 0, 3.7), (0.045, 3.7, -w / 2 + 0.022, 1.85), (0.045, 3.7, w / 2 - 0.022, 1.85)):
            lib.box("door frame", (sx, 0.05, sz), (cx + px, 0.04, pz), M["bronze"])
        lib.box("door pull", (0.03, 0.04, 0.9), (-0.15 if cx < 0 else 0.15, 0.09, 1.1), M["bronze"], bevel=0.008)
    lib.box("walk", (34.0, 2.2, 0.1), (0.0, 1.3, -0.05), M["pavers"])


# ---------------------------------------------------------------- the jetty, the boat, the raft, the beach
def jetty(M):
    bm = bmesh.new(); pitch = 0.152
    y = JY0
    while y < JY1:
        lib.bm_box(bm, (JX1 - JX0, 0.14, 0.04), ((JX0 + JX1) / 2, y + 0.07, DECK - 0.02)); y += pitch
    y = JY1
    while y < JY1 + 3.0:
        lib.bm_box(bm, (HX1 - HX0, 0.14, 0.04), ((HX0 + HX1) / 2, y + 0.07, DECK - 0.02)); y += pitch
    lib.mesh_obj("jetty deck", bm, M["teak_x"])
    for x in (JX0 + 0.08, JX1 - 0.08):
        lib.box("jetty stringer", (0.08, JY1 - JY0, 0.22), (x, (JY0 + JY1) / 2, DECK - 0.15), M["teak"])
    for x in (HX0 + 0.08, HX1 - 0.08):
        lib.box("jetty stringer", (0.08, 3.0, 0.22), (x, JY1 + 1.5, DECK - 0.15), M["teak"])
    posts = [(x, y) for y in [JY0 + 2.0 + 2.6 * k for k in range(7) if JY0 + 2.0 + 2.6 * k < JY1] for x in (JX0 + 0.1, JX1 - 0.1)]
    posts += [(x, y) for x in (HX0 + 0.1, (HX0 + HX1) / 2, HX1 - 0.1) for y in (JY1 + 0.1, JY1 + 2.9)]
    for (x, y) in posts:
        zb = ground_z(x, y) - 0.2; lib.cyl("jetty post", 0.11, DECK - 0.04 - zb, (x, y, zb), M["teak"], verts=16)
    for (x, y) in ((HX0 + 0.25, JY1 + 2.7), (HX1 - 0.25, JY1 + 2.7), (JX0 + 0.15, 17.6)):
        lib.cyl("cleat", 0.05, 0.07, (x, y, DECK), M["stainless"], verts=16, bevel=0.01)
    # a ladder down into the lake at the end: two rails up out of the water, over the edge and down onto the deck
    ly = JY1 + 3.06
    for x in (HX1 - 0.95, HX1 - 0.45):
        lib.cyl("ladder rail", 0.02, DECK + 0.85 - (WL - 1.3), (x, ly, WL - 1.3), M["stainless"], verts=12)
        lib.cyl("ladder rail", 0.02, 0.3, (x, ly, DECK + 0.85), M["stainless"], verts=12, rot=(math.pi / 2, 0, 0))
        lib.cyl("ladder rail", 0.02, 0.85, (x, ly - 0.3, DECK), M["stainless"], verts=12)
    for k in range(4):
        lib.cyl("ladder step", 0.018, 0.5, (HX1 - 0.95, ly, WL + 0.45 - 0.32 * k), M["stainless"], verts=12, rot=(0, math.pi / 2, 0))


def hull_section(u, B=1.36, L=4.3):
    """the boat's half-beam and its keel and sheer heights at u in -1 (stern) .. 1 (bow)"""
    if u >= 0: b = (B / 2) * (1 - u ** 2) ** 0.55
    else: b = (B / 2) * (1 - (abs(u) * 0.86) ** 2) ** 0.55         # a transom at the stern
    keel = -0.24 + 0.16 * max(0.0, u) ** 2.2 + 0.05 * max(0.0, -u) ** 2
    sheer = 0.34 + 0.12 * u ** 2 + 0.05 * max(0.0, u) ** 3
    return b, keel, sheer


def boat(M, loc, rot_z):
    """a rowing boat 4.3 m long, white outside, varnished mahogany inside, three thwarts and the oars shipped"""
    root = furn.empty("boat", loc, rot_z); L = 4.3; nu, nv = 40, 16; bm = bmesh.new(); grid = []
    for i in range(nu + 1):
        u = -1 + 2 * i / nu; b, keel, sheer = hull_section(u); row = []
        for j in range(nv + 1):
            t = -1 + 2 * j / nv; a = t * math.pi / 2
            yy = b * math.sin(a)
            zz = sheer - (sheer - keel) * (math.cos(a) ** 0.75)
            row.append(bm.verts.new((u * L / 2, yy, zz)))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    bm.faces.new([grid[0][j] for j in range(nv, -1, -1)])            # the transom, facing aft
    hull = lib.mesh_obj("boat hull", bm, [M["boat_paint"], M["boat"]], smooth=True); hull.parent = root
    so = hull.modifiers.new("plank", "SOLIDIFY"); so.thickness = 0.025; so.offset = -1.0; so.material_offset = 1; so.material_offset_rim = 1
    sub = hull.modifiers.new("smooth", "SUBSURF"); sub.levels = 1; sub.render_levels = 1
    # the gunwale, a varnished rail along the sheer, and the thwarts
    for side in (-1, 1):
        pts = []
        for i in range(nu + 1):
            u = -1 + 2 * i / nu; b, keel, sheer = hull_section(u); pts.append(Vector((u * L / 2, side * b, sheer)))
        bmr = bmesh.new()
        for i in range(nu):
            p, q = pts[i], pts[i + 1]; d = q - p; c = (p + q) / 2
            r = bmesh.ops.create_cube(bmr, size=1.0); M_ = Matrix.Translation(c) @ Matrix.Rotation(math.atan2(d.y, d.x), 4, "Z") @ Matrix.Rotation(-math.atan2(d.z, d.xy.length), 4, "Y") @ Matrix.Diagonal((d.length + 0.01, 0.05, 0.045, 1))
            bmesh.ops.transform(bmr, matrix=M_, verts=r["verts"])
        g = lib.mesh_obj("boat gunwale", bmr, M["boat"]); g.parent = root
    for u in (-0.62, 0.02, 0.5):
        b, keel, sheer = hull_section(u)
        t = lib.box("thwart", (0.24, 2 * b - 0.06, 0.035), (u * L / 2, 0, sheer - 0.17), M["boat"], bevel=0.006); t.parent = root
    fl = lib.box("floorboards", (2.6, 0.5, 0.02), (-0.1, 0, -0.14), M["boat"]); fl.parent = root
    for side in (-1, 1):            # the oars, shipped along the thwarts
        sh = lib.cyl("oar loom", 0.022, 2.35, (0, 0, 0), M["boat"], verts=12, rot=(0, math.pi / 2, 0)); sh.location = (-1.1, side * 0.3, 0.2); sh.parent = root
        bl = lib.box("oar blade", (0.55, 0.15, 0.012), (1.45, side * 0.3, 0.2), M["boat"], bevel=0.004); bl.parent = root
        lk = lib.cyl("rowlock", 0.02, 0.07, (0.25, side * (hull_section(0.12)[0] - 0.02), hull_section(0.12)[2]), M["stainless"], verts=12); lk.parent = root
    return root


def rope(M, p, q, sag):
    bm = bmesh.new(); prev = p
    for i in range(1, 13):
        t = i / 12; c = p.lerp(q, t) - Vector((0, 0, sag * 4 * t * (1 - t))); limb(bm, prev, c, 0.012, 0.012, 6); prev = c
    return lib.mesh_obj("mooring line", bm, M["rope"], smooth=True)


def raft(M, cx, cy):
    top = WL + 0.25
    bm = bmesh.new(); x = cx - 1.5
    while x < cx + 1.5:
        lib.bm_box(bm, (0.14, 3.0, 0.04), (x + 0.07, cy, top - 0.02)); x += 0.152
    lib.mesh_obj("raft deck", bm, M["teak"])
    lib.box("raft float", (2.9, 2.9, 0.5), (cx, cy, top - 0.3), M["rib"])
    for x in (cx + 0.55, cx + 1.05):
        lib.cyl("raft ladder", 0.02, 1.4, (x, cy - 1.55, top - 1.2), M["stainless"], verts=12)
        lib.cyl("raft ladder top", 0.02, 0.5, (x, cy - 1.55, top), M["stainless"], verts=12)


def beach(M, rnd):
    import pent_rooms
    for k, x in enumerate((-6.8, -5.1, -3.4)):
        pent_rooms.lounger("lounger", (x, 4.2, ground_z(x, 4.2)), math.radians(180 + rnd.uniform(-4, 4)), M)
    furn.side_table("beach table", (-4.25, 3.0, 0.0), M, r=0.24, h=0.45)
    lib.import_glb(os.path.join(A, "DiffuseTransmissionTeacup.glb"), (-4.2, 2.95, 0.455), 0.4, 1.0, name="cup")
    lib.box("folded towel", (0.42, 0.3, 0.06), (-8.2, 3.3, 0.03), M["blue_towel"], bevel=0.02)
    lib.box("folded towel", (0.42, 0.3, 0.05), (-8.15, 3.32, 0.085), M["towel"], bevel=0.02)


# ---------------------------------------------------------------- trees, reeds, lilies, rocks
def tree_bm():
    return bmesh.new()


def limb(bm, p, q, r0, r1, n=8):
    d = (q - p).normalized(); x = d.orthogonal().normalized(); y = d.cross(x); a0 = []; a1 = []
    for i in range(n):
        a = 2 * math.pi * i / n; c = x * math.cos(a) + y * math.sin(a)
        a0.append(bm.verts.new(p + c * r0)); a1.append(bm.verts.new(q + c * r1))
    for i in range(n):
        j = (i + 1) % n; bm.faces.new((a0[i], a0[j], a1[j], a1[i]))


def leaf_cloud(name, pts, loc, leaf, group, limit, rnd, smin=0.7, smax=1.3):
    rnd.shuffle(pts); me = bpy.data.meshes.new(name + " leaf points"); me.from_pydata([tuple(p) for p in pts[:limit]], [], [])
    lp = lib.link(bpy.data.objects.new(name + " leaves", me)); lp.location = loc
    atrium.scatter_leaves(lp, leaf, group, smin, smax); return lp


def broadleaf(name, loc, seed, M, height=12.0, leaves=90000, mat="broadleaf"):
    """a big broadleaf tree, as a beech or a lime: a straight trunk, limbs spreading up and out, leaves in clouds"""
    rnd = random.Random(seed); bm = bmesh.new(); pts = []
    def grow(p, d, length, r, lvl):
        cur = p
        for i in range(3):
            dd = (d + Vector((rnd.uniform(-0.16, 0.16), rnd.uniform(-0.16, 0.16), rnd.uniform(-0.04, 0.1)))).normalized()
            nr = r * (1 - 0.13 * (i + 1) / 3); q = cur + dd * length / 3; limb(bm, cur, q, r, nr, 8 if lvl > 2 else 6); cur = q; r = nr; d = dd
        if lvl == 0:
            sg = max(0.6, length * 0.7)
            for i in range(rnd.randint(380, 520)): pts.append(cur + Vector((rnd.gauss(0, sg), rnd.gauss(0, sg), rnd.gauss(0.2, sg * 0.8))))
            return
        if lvl <= 1:
            for i in range(rnd.randint(90, 150)):
                t = rnd.random(); pts.append(p.lerp(cur, t) + Vector((rnd.gauss(0, 0.55), rnd.gauss(0, 0.55), rnd.gauss(0.15, 0.4))))
        for i in range(rnd.randint(3, 4)):
            a = rnd.uniform(0, 2 * math.pi); tilt = rnd.uniform(0.25, 0.55)
            nd = (d * (1 - tilt) + Vector((math.cos(a), math.sin(a), 0.75)) * tilt).normalized()
            grow(cur, nd, length * rnd.uniform(0.62, 0.76), r * rnd.uniform(0.55, 0.68), lvl - 1)
    grow(Vector((0, 0, 0)), Vector((rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 1)).normalized(), height * 0.36, 0.02 * height, 4)
    wood = lib.mesh_obj(name + " wood", bm, M["trunk"], smooth=True); wood.location = loc
    leaf = bpy.data.objects.get(mat + " leaf") or atrium.leaf_object(mat + " leaf", 0.12, 0.07, M[mat])
    return wood, leaf_cloud(name, pts, loc, leaf, mat + " leaves", leaves, rnd)


def willow(name, loc, seed, M, strands=520):
    """a weeping willow on the bank: a short trunk, limbs arching out, and curtains of long thin leaves hanging to
    the ground and the water"""
    rnd = random.Random(seed); bm = bmesh.new(); pts = []; tips = []
    top = Vector((0.15, 0.1, 2.3)); limb(bm, Vector((0, 0, -0.2)), top, 0.36, 0.28, 10)
    for i in range(7):
        a = 2 * math.pi * i / 7 + rnd.uniform(-0.3, 0.3); d = Vector((math.cos(a) * 0.75, math.sin(a) * 0.75, 1.0)).normalized()
        p = top.copy(); r = 0.2; Ln = rnd.uniform(4.0, 5.6)
        for k in range(5):
            dd = (d + Vector((rnd.uniform(-0.2, 0.2), rnd.uniform(-0.2, 0.2), -0.22 * k))).normalized(); q = p + dd * Ln / 5
            limb(bm, p, q, r, r * 0.78, 7); p = q; r *= 0.78; tips.append(p.copy())
            if k >= 2:
                for m_ in range(2):
                    d2 = (dd + Vector((rnd.uniform(-0.8, 0.8), rnd.uniform(-0.8, 0.8), 0.1))).normalized(); q2 = p + d2 * rnd.uniform(0.8, 1.6)
                    limb(bm, p, q2, r * 0.5, r * 0.25, 5); tips.append(q2)
    for s in range(strands):
        base = rnd.choice(tips) + Vector((rnd.gauss(0, 0.7), rnd.gauss(0, 0.7), rnd.gauss(0.2, 0.35)))
        out = Vector((base.x, base.y, 0.0)); out = out.normalized() if out.length > 0.01 else Vector((1, 0, 0))
        drop = rnd.uniform(0.55, 0.97) * (base.z - 0.25); n = max(4, int(drop / 0.05))
        for k in range(n):
            t = k / (n - 1); arch = 0.55 * math.sin(min(1.0, t * 2.5) * math.pi / 2)
            pts.append(base + out * arch + Vector((rnd.gauss(0, 0.035), rnd.gauss(0, 0.035), -drop * t)))
    wood = lib.mesh_obj(name + " wood", bm, M["trunk"], smooth=True); wood.location = loc
    leaf = bpy.data.objects.get("willow leaf") or atrium.leaf_object("willow leaf", 0.12, 0.018, M["willow_leaf"])
    return wood, leaf_cloud(name, pts, loc, leaf, "willow leaves", 200000, rnd, 0.8, 1.2)


def reeds(name, spots, rnd, M):
    """clumps of reeds at the water's edge: blades from 0.5 to 1.9 m, bending, some with a cattail"""
    bm = bmesh.new(); heads = []
    for (cx, cy, rad, n) in spots:
        for i in range(n):
            px, py = cx + rnd.gauss(0, rad), cy + rnd.gauss(0, rad); z0 = ground_z(px, py) - 0.05
            hh = rnd.uniform(0.5, 1.9); w = rnd.uniform(0.007, 0.014); a = rnd.uniform(0, math.pi)
            lean = Vector((rnd.gauss(0, 0.12), rnd.gauss(0, 0.12), 0.0)); side = Vector((math.cos(a), math.sin(a), 0.0))
            prev = None
            for k in range(7):
                t = k / 6; c = Vector((px, py, z0 + hh * t)) + lean * hh * t * t; ww = w * (1 - t) + 0.0005
                pair = (bm.verts.new(c - side * ww), bm.verts.new(c + side * ww))
                if prev: bm.faces.new((prev[0], prev[1], pair[1], pair[0]))
                prev = pair
            if rnd.random() < 0.12 and hh > 1.2: heads.append(Vector((px, py, z0 + hh * 0.82)) + lean * hh * 0.67)
    o = lib.mesh_obj(name, bm, M["reed"], smooth=True)
    for h in heads: lib.cyl("cattail", 0.016, 0.2, (h.x, h.y, h.z), M["cattail"], verts=10)
    return o


def lilies(M, rnd, cx, cy, n=46, spread=(3.0, 2.0)):
    bm = bmesh.new(); flowers = []
    for i in range(n):
        x, y = cx + rnd.gauss(0, spread[0]), cy + rnd.gauss(0, spread[1])
        if inside(x, y) < 0.6: continue
        r = rnd.uniform(0.12, 0.3); a0 = rnd.uniform(0, 2 * math.pi); c = bm.verts.new((x, y, WL + 0.006)); ring = []
        for k in range(17):
            a = a0 + 0.24 + k * (2 * math.pi - 0.48) / 16; ring.append(bm.verts.new((x + r * math.cos(a), y + r * math.sin(a), WL + 0.006 + 0.004 * rnd.random())))
        for k in range(16): bm.faces.new((c, ring[k], ring[k + 1]))
        if rnd.random() < 0.18: flowers.append((x + r * 0.3, y, rnd.uniform(0.06, 0.09)))
    lib.mesh_obj("lily pads", bm, M["lily"], smooth=True)
    for (x, y, s) in flowers:
        for k in range(8):
            a = k * math.pi / 4
            p = lib.box("lily petal", (s, s * 0.38, 0.006), (x + 0.5 * s * math.cos(a), y + 0.5 * s * math.sin(a), WL + 0.03), M["lily_flower"], bevel=0.002, rot_z=a)
            p.rotation_euler = (0, -0.5, a)
        lib.cyl("lily heart", 0.012, 0.02, (x, y, WL + 0.03), lib.principled("lily heart", (0.85, 0.65, 0.12), 0.6), verts=10)


def rock(name, loc, size, seed, M):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0, location=(0, 0, 0)); o = bpy.context.active_object; o.name = name
    off = Vector((seed * 1.7, seed * 0.3, seed * 2.9))
    for v in o.data.vertices:
        c = v.co.copy(); v.co = c * (1 + 0.26 * noise.noise(c * 1.4 + off) + 0.08 * noise.noise(c * 4.0 + off))
        if v.co.z < -0.4: v.co.z = -0.4 + (v.co.z + 0.4) * 0.3            # a flatter bottom, as if it sat in the bank
    for p in o.data.polygons: p.use_smooth = True
    o.scale = size; o.location = loc; o.rotation_euler = (0, 0, seed * 0.77); o.data.materials.append(M["rock"])
    return o


def falls(M, rnd):
    """where the forest's stream comes into the lake, from the right: a bank of boulders, a pool among them and a
    fall of about 1.5 m into the lake, white where it lands"""
    fy = 38.5; fx = hw(fy) - 3.2                      # the fall's lip, at the lake's right shore
    k = 0
    for (dx, dy, s) in ((0.6, -1.9, (1.2, 1.0, 1.0)), (0.4, 1.9, (1.3, 1.1, 1.2)), (1.9, -2.6, (1.4, 1.2, 1.5)), (2.0, 2.7, (1.5, 1.3, 1.6)),
                        (3.4, -1.6, (1.3, 1.2, 1.9)), (3.6, 1.8, (1.2, 1.4, 2.0)), (4.9, -2.4, (1.6, 1.3, 2.3)), (5.1, 2.4, (1.5, 1.5, 2.4)),
                        (1.0, -3.9, (1.0, 0.9, 0.8)), (1.3, 4.0, (1.1, 1.0, 0.9)), (6.4, -0.9, (1.3, 1.1, 2.4)), (6.5, 1.2, (1.2, 1.2, 2.5)),
                        (-0.5, -2.8, (0.7, 0.6, 0.5)), (-0.4, 2.9, (0.8, 0.7, 0.5)), (2.8, 0.0, (0.5, 0.45, 0.6))):
        z = ground_z(fx + dx, fy + dy)
        rock("falls rock", (fx + dx, fy + dy, max(z, WL) + s[2] * 0.35), s, 11 + k, M); k += 1
    lib.box("falls lip", (0.9, 2.2, 1.8), (fx + 0.9, fy, WL + 0.6), M["rock"], bevel=0.12)
    pool = lib.box("falls pool", (3.0, 2.6, 0.02), (fx + 2.6, fy, WL + 1.55), M["water_lake"])
    lib.box("falls pool bed", (3.0, 2.6, 0.4), (fx + 2.6, fy, WL + 1.2), M["rock"])
    # the fall: a sheet that curves out over the lip and down into the lake
    bm = bmesh.new(); rows = []
    for i in range(13):
        t = i / 12; x = fx + 1.2 - 0.9 * t ** 0.7; z = WL + 1.56 - 1.6 * t ** 1.6
        rows.append([bm.verts.new((x, fy + w, z)) for w in (-0.95, -0.3, 0.3, 0.95)])
    for i in range(12):
        for j in range(3): bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    lib.mesh_obj("falling water", bm, M["falls"], smooth=True)
    for (dx, dy, r) in ((-0.1, 0.0, 2.0), (-1.6, 0.6, 1.4), (-2.4, -0.7, 1.1)):
        f = lib.cyl("foam", r, 0.01, (fx + dx, fy + dy, WL + 0.004), M["foam"], verts=48); f.scale = (1.0, 0.8, 1.0)
    reeds("reeds by the falls", [(fx - 0.6, fy - 4.6, 0.7, 70), (fx - 0.3, fy + 4.8, 0.8, 80)], rnd, M)


def bank_trees(M, rnd, lite):
    """the forest beyond the avenue on the right, a row of trees behind the far bank, fruit trees on the left by the
    farm, and the willow on the near bank"""
    n = 0
    spots = []
    for y in (6.0, 13.0, 20.0, 27.0, 34.5, 42.0, 49.0):          # the forest's edge on the right, two deep
        spots.append((hw(y) + 8.5 + rnd.uniform(-1, 1), y + rnd.uniform(-1.5, 1.5), rnd.uniform(11.0, 13.0)))
        spots.append((hw(y) + 15.0 + rnd.uniform(-1.5, 1.5), y + 3.0 + rnd.uniform(-1.5, 1.5), rnd.uniform(11.5, 13.5)))
    for x in (-40.0, -31.0, -22.0, -13.0, -4.0, 5.0, 14.0, 23.0, 32.0, 41.0):     # behind the far bank, along the street, two deep
        spots.append((x + rnd.uniform(-2, 2), Y1 - 0.2 + rnd.uniform(-0.8, 0.8), rnd.uniform(11.0, 13.5)))
        spots.append((x + 4.5 + rnd.uniform(-1.5, 1.5), Y1 + 2.6 + rnd.uniform(-0.5, 0.5), rnd.uniform(12.5, 14.5)))
    for sgn in (-1, 1):                                              # beside the glass, beyond the corner cores
        for (x, y) in ((22.0, 3.2), (30.0, 3.8), (38.0, 4.5)):
            spots.append((sgn * (x + rnd.uniform(-1, 1)), y + rnd.uniform(-0.5, 0.5), rnd.uniform(10.0, 12.5)))
    for (x, y, h) in spots:
        if lite and n % 2: n += 1; continue
        broadleaf("lake tree", (x, y, ground_z(x, y)), 500 + n, M, height=h, mat="broadleaf" if n % 3 else "broadleaf2"); n += 1
    for y in (8.0, 17.0, 26.0, 35.0, 44.0):                         # the orchard's edge on the left, by the farm
        x = -(hw(y) + 7.5 + rnd.uniform(-1, 1)); furn.olive_tree("farm tree", (x, y, ground_z(x, y)), 900 + int(y), M, height=rnd.uniform(5.0, 6.5), leaves=30000)
    willow("willow", (10.5, 4.6, ground_z(10.5, 4.6)), 77, M)


def ivy_wall(M, rnd):
    """ivy over the far wall behind the trees and over the walls either side of the glass, nearly to the sky"""
    pts = []
    def cover(n, x0, x1, y, sgn):
        for i in range(n):
            x = rnd.uniform(x0, x1); top = 12.5 + 3.0 * noise.noise(Vector((x * 0.06, y * 0.1, 0.0)))
            z = top * (1 - math.sqrt(rnd.random()))            # thick at the foot, thinning upwards
            pts.append(Vector((x, y + sgn * (0.03 + abs(rnd.gauss(0, 0.07))), z)))
    cover(260000, -70.0, 70.0, YW, -1)
    for sgn in (-1, 1): cover(70000, sgn * 17.8, sgn * 50.0, 0.0, 1)
    leaf = bpy.data.objects.get("ivy leaf") or atrium.leaf_object("ivy leaf", 0.07, 0.055, M["ivy"])
    leaf_cloud("wall ivy", pts, (0, 0, 0), leaf, "ivy leaves", len(pts), rnd)


def lake(M, rnd):
    lite = os.environ.get("LITE") == "1"
    materials(M)
    ground(M); water(M); structure(M); jetty(M)
    boat(M, (JX0 - 0.86, 17.9, WL + 0.02), math.radians(90.0))
    rope(M, Vector((JX0 - 0.86, 19.95, WL + 0.5)), Vector((JX0 + 0.15, 17.6, DECK + 0.05)), 0.25)
    raft(M, -13.5, 26.0)
    beach(M, rnd)
    reeds("reeds", [(-20.0, 9.8, 1.0, 120), (-22.5, 15.0, 1.2, 140), (-31.0, 30.0, 1.4, 160), (-27.0, 44.0, 1.2, 130), (-10.0, 46.5, 1.3, 140),
                    (14.0, 46.0, 1.1, 120), (31.5, 45.0, 1.0, 100), (36.0, 26.0, 1.0, 110), (24.8, 12.6, 0.9, 90), (14.2, 7.6, 0.6, 50)], rnd, M)
    lilies(M, rnd, -10.5, 7.2, 70, (2.0, 1.2)); lilies(M, rnd, -24.0, 36.0, 50, (2.6, 2.6)); lilies(M, rnd, 20.0, 43.5, 36, (2.4, 1.4))
    falls(M, rnd)
    bank_trees(M, rnd, lite)
    if not lite: ivy_wall(M, rnd)


ROOMS = {
    "lake": dict(build=lake, cams={
        "lake": dict(loc=(-12.6, 3.4, 1.65), target=(20.0, 40.0, 1.65), lens=18, shift=0.1),
        "lake2": dict(loc=(3.4, 23.6, DECK + 1.6), target=(-3.0, 0.0, DECK + 1.6), lens=18, shift=0.12),
    }, stops={"lake": (2.0, 22.6, DECK)}),
}


def build(room):
    sc = lib.reset(); M = family.materials(); rnd = random.Random(41)
    M["book"] = furn.book_material(); M["linen"] = M.get("linen") or lib.fabric("linen", (0.58, 0.54, 0.46), 0.9, 0.3, 500)
    lite = os.environ.get("LITE") == "1"
    before = {o.name for o in bpy.data.objects}
    R = ROOMS[room]; R["build"](M, rnd)
    for o in bpy.data.objects:
        if o.name not in before and o.parent is None and o.location.z > -400: o.location.z += Z0
    atrium.build(M, random.Random(11), not lite, not lite)
    atrium.build_lower(M, random.Random(13))
    bpy.context.view_layer.update()
    for o in list(bpy.data.objects):          # the garden seen through side 0's glass on L2 is this room: take out the stand-in
        if o.name.startswith("garden ") and o.matrix_world.translation.y > 0.0: bpy.data.objects.remove(o)
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
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=ex)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, Z0 + z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        c = R["cams"][j]; lc = Vector(c["loc"]) + Vector((0, 0, Z0)); tg = Vector(c["target"]) + Vector((0, 0, Z0))
        lib.camera(j, tuple(lc), tuple(tg), lens=c["lens"], shift_y=c.get("shift", 0.0)); lib.photo_finish(0.3, 0.15)
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
