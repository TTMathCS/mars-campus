"""Jim's family room (L1, sector 1 of the Pentagon) for Cycles.
Room frame: x along the glass (the atrium side, y = 0), y into the room, z up from the floor. The room is the
trapezoid of the plans: 28.8 m of glass, 49 m along the back wall 13.9 m in, a ceiling at 3.8 m.

  bvenv/bin/python blend/family.py <camera> <out.jpg> [width height samples exposure]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, atrium, suite

A = lib.ASSETS
HW0, HW1, DEP, HT, SLAB = 14.4, 24.5, 13.9, 3.8, 0.8
SUN_ELEV, SUN_AZ = 58.0, 112.0
CASES = (5.3, 9.75, 12.85)     # the centres of the bookcases along the back wall, each side
PART = 8.0                     # the walls between the family room and the music room (-x) and the dining room (+x)
SKY = [(0.0, 9.6, 2.6, 4.4), (-11.0, 4.6, 2.4, 2.4), (11.0, 6.4, 2.4, 2.4)]     # skylights: centre x, y and size


def half_w(y): return HW0 + (HW1 - HW0) * y / DEP


def materials():
    P = lib.principled
    M = {
        "oak": lib.oak_floor("oak floor", 0.19, (0.66, 0.54, 0.43), 0.55, 0.85, along="Y"),
        "plaster": lib.plaster("plaster", (0.66, 0.61, 0.54)),
        "oak_slat": lib.wood("oak slats", (0.42, 0.29, 0.17), (0.30, 0.20, 0.11), 0.55, along="Y", coat=0.0),
        "felt": lib.principled("felt", (0.025, 0.022, 0.02), 1.0),
        "ceiling": lib.plaster("ceiling plaster", (0.83, 0.81, 0.77), bump=0.03),
        "travertine": lib.travertine("travertine"),
        "breast": cladding(lib.travertine("breast travertine", (0.80, 0.73, 0.62), (0.70, 0.62, 0.50), 0.5, 1.4), 4.0 / 3, 0.95, -2.0, 0.0),
        "column": coursed(lib.travertine("column travertine", (0.64, 0.56, 0.45), (0.52, 0.44, 0.34), 0.5, 0.7), 1.2),
        "ivy": lib.leaf("ivy", (0.04, 0.085, 0.025), 0.35, 0.35),
        "pavers": atrium.pavers(),
        "walnut": lib.wood("walnut", (0.20, 0.11, 0.06), (0.085, 0.045, 0.025), 0.36),
        "walnut_v": lib.wood("walnut veneer", (0.20, 0.11, 0.06), (0.085, 0.045, 0.025), 0.4, along="Z"),
        "lacquer": P("black lacquer", (0.006, 0.006, 0.007), 0.08, **{"Coat Weight": 1.0, "Coat Roughness": 0.015}),
        "ivory": P("key ivory", (0.80, 0.77, 0.70), 0.22, **{"Coat Weight": 0.5, "Coat Roughness": 0.05}),
        "ebony": P("key ebony", (0.012, 0.012, 0.012), 0.3),
        "spruce": lib.wood("spruce", (0.62, 0.48, 0.30), (0.50, 0.36, 0.20), 0.45),
        "plate": P("piano plate", (0.80, 0.60, 0.28), 0.35, 1.0),
        "brass": P("brass", (0.86, 0.66, 0.36), 0.22, 1.0),
        "bronze": P("bronze", (0.40, 0.29, 0.19), 0.35, 1.0),
        "bronze_dark": P("dark bronze", (0.17, 0.13, 0.10), 0.4, 1.0),
        "leather": P("black leather", (0.02, 0.018, 0.016), 0.45, **{"Coat Weight": 0.2}),
        "marble": lib.marble("marble"),
        "glaze": furn.ceramic("glaze", (0.70, 0.68, 0.62), 0.25),
        "shade": lib.lampshade("linen shade"),
        "linen": lib.fabric("linen", (0.58, 0.54, 0.46), 0.9, 0.3, 500),
        "shadow": P("shadow gap", (0.02, 0.02, 0.02), 0.8),
        "rug": furn.rug_material(),
        "glass": lib.glass(),
        "glass_rail": lib.glass("rail glass", (0.86, 0.93, 0.91)),
        "boxwood": lib.leaf("boxwood", (0.075, 0.15, 0.04)),
        "boxwood_core": P("hedge core", (0.015, 0.03, 0.01), 0.8),
        "portal": P("portal glass", (0.02, 0.025, 0.03), 0.05, **{"Coat Weight": 1.0}),
        "far_floor": lib.wood("far floor", (0.35, 0.25, 0.16), (0.25, 0.17, 0.10)),
        "far_wall": lib.plaster("far wall", (0.74, 0.70, 0.64)),
        "far_wall2": lib.plaster("far wall 2", (0.52, 0.47, 0.41)),
        "far_glow": lib.emission("far glow", (1.0, 0.80, 0.58), 5.0),
        "far_fabric": lib.fabric("far fabric", (0.33, 0.31, 0.28)),
        "far_fabric2": lib.fabric("far fabric 2", (0.08, 0.12, 0.20)),
        "far_plant": lib.leaf("far plant", (0.05, 0.10, 0.03)),
        "soot": P("soot", (0.012, 0.011, 0.010), 0.95),
        "screen": P("screen", (0.003, 0.003, 0.004), 0.04, **{"Coat Weight": 0.5, "Coat Roughness": 0.02}),
        "book": furn.book_material(),
        "frame": P("frame", (0.03, 0.025, 0.02), 0.5),
        "bark": lib.wood("olive bark", (0.16, 0.13, 0.10), (0.08, 0.065, 0.05), 0.85, scale=3.0, coat=0.0, along="Z"),
        "olive_leaf": lib.leaf("olive leaf", (0.13, 0.16, 0.085), 0.3, 0.5),
        "sheer": lib.lampshade("sheer curtain", (0.80, 0.77, 0.70)),
        "soil": P("soil", (0.035, 0.025, 0.018), 0.95),
        "roof_slats": slats_material(),
        "grass": lib.leaf("garden grass", (0.06, 0.12, 0.03), 0.25, 0.8),
        "lamp_sky": lib.emission("sky of lamps", (0.80, 0.88, 1.0), 2.2),
        "lamp_sky_far": lib.emission("sky of lamps far", (0.70, 0.78, 0.86), 1.2),
        "hall_floor": lib.principled("hall floor", (0.30, 0.29, 0.27), 0.4),
        "hall_wall": lib.principled("hall wall", (0.42, 0.42, 0.41), 0.6),
        "machine": lib.principled("machine", (0.25, 0.27, 0.30), 0.35, 0.6),
        "lawn": lawn_material(),
        "water": water_material(),
        "pool_tile": lib.principled("pool tile", (0.25, 0.42, 0.42), 0.3),
        "street_wall": lib.plaster("street plaster", (0.70, 0.66, 0.60)),
        "street_stone": cladding(lib.travertine("street travertine", (0.76, 0.69, 0.58), (0.66, 0.58, 0.46), 0.5, 1.4), 1.2, 0.8, 0.0, 0.0),
        "garden_stone": cladding(lib.travertine("garden travertine", (0.72, 0.65, 0.55), (0.62, 0.54, 0.43), 0.55, 1.4), 1.2, 0.8, 0.0, 0.0),
        "oak_panel": lib.wood("pale oak", (0.52, 0.40, 0.27), (0.42, 0.31, 0.20), 0.5, along="Z", coat=0.1),
        "moss": suite.moss_material(),
        "still_water": suite.still_water(),
        "slate": lib.principled("slate", (0.05, 0.05, 0.055), 0.6),
        "rock": suite.rock_material(),
        "maple_leaf": lib.leaf("maple leaf", (0.45, 0.06, 0.02), 0.3, 0.5),
        "bed_fabric": lib.fabric("bed linen", (0.42, 0.38, 0.32), 0.9, 0.5),
        "sheet": lib.fabric("sheet", (0.76, 0.74, 0.70), 0.85, 0.3, 800, 0.1),
        "pillow": lib.fabric("pillow", (0.46, 0.40, 0.31), 0.9, 0.4),
        "duvet": lib.fabric("duvet", (0.78, 0.76, 0.72), 0.9, 0.4, 600, 0.15),
        "tub": lib.principled("stone resin", (0.80, 0.79, 0.76), 0.18, **{"Coat Weight": 0.5, "Coat Roughness": 0.05}),
        "bath_water": lib.glass("bath water", (0.9, 0.96, 0.95), 0.0, 1.33),
    }
    M["ceramics"] = [furn.ceramic("ceramic white", (0.78, 0.76, 0.72), 0.3), furn.ceramic("ceramic black", (0.02, 0.02, 0.02), 0.35), furn.ceramic("ceramic clay", (0.45, 0.22, 0.12), 0.6),
                     furn.ceramic("ceramic celadon", (0.42, 0.52, 0.45), 0.2), furn.ceramic("ceramic sand", (0.62, 0.52, 0.38), 0.7)]
    return M


def cladding(m, w, h, x0, z0):
    """stone slabs w x h on a wall facing along y, laid from (x0, z0): fine joints from the world position"""
    nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]; src = b.inputs["Base Color"].links[0].from_socket
    g = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(g.outputs["Position"], sep.inputs[0])
    def joint(v, o, size):
        f = lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", lib._math(nt, "SUBTRACT", v, o), size))
        return lib._math(nt, "LESS_THAN", lib._math(nt, "MINIMUM", f, lib._math(nt, "SUBTRACT", 1.0, f)), 0.0018 / size)
    j = lib._math(nt, "MAXIMUM", joint(sep.outputs[0], x0, w), joint(sep.outputs[2], z0, h))
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", j, 0.6), mx.inputs["Factor"]); L.new(src, mx.inputs[6]); mx.inputs[7].default_value = (0.25, 0.21, 0.17, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def coursed(m, h):
    """stone laid in courses h metres high: a fine dark joint between them"""
    nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]; src = b.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    j = lib._math(nt, "LESS_THAN", lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", sep.outputs[2], h)), 0.004 / h)
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", j, 0.7), mx.inputs["Factor"]); L.new(src, mx.inputs[6]); mx.inputs[7].default_value = (0.2, 0.17, 0.14, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def lawn_material():
    """the photo of grass from three.js's examples, at two scales mixed, so a big lawn does not repeat"""
    m, nt = lib._mat("lawn")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.9; b.inputs["Sheen Weight"].default_value = 0.5
    tc = nt.nodes.new("ShaderNodeTexCoord")
    def look(scale, rot):
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale); mp.inputs["Rotation"].default_value = (0, 0, rot); L.new(tc.outputs["Object"], mp.inputs["Vector"])
        t = lib._tex(nt, os.path.join(A, "grasslight-big.jpg")); L.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    t1 = look(0.25, 0.0); t2 = look(0.11, 1.1)
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 0.08; n.inputs["Detail"].default_value = 3; L.new(tc.outputs["Object"], n.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(n.outputs["Fac"], mx.inputs["Factor"]); L.new(t1.outputs["Color"], mx.inputs[6]); L.new(t2.outputs["Color"], mx.inputs[7])
    hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.inputs["Value"].default_value = 0.75; hs.inputs["Saturation"].default_value = 0.85; L.new(mx.outputs[2], hs.inputs["Color"])
    L.new(hs.outputs["Color"], b.inputs["Base Color"])
    return m


def water_material():
    """still water over pale tiles: clear, a few ripples from three.js's water normals"""
    m, nt = lib._mat("water")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.8, 0.95, 0.95, 1); b.inputs["Roughness"].default_value = 0.02; b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["IOR"].default_value = 1.33
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.12, 0.12, 0.12); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    t = lib._tex(nt, os.path.join(A, "waternormals.jpg"), "Non-Color"); L.new(mp.outputs["Vector"], t.inputs["Vector"])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.25; L.new(t.outputs["Color"], nm.inputs["Color"]); L.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def slats_material():
    """oak slats on black felt, as a texture: for the atrium's ceiling, seen from far away"""
    m, nt = lib._mat("roof slats")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.6
    tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "X"; w.wave_profile = "SAW"; w.inputs["Scale"].default_value = 1.0 / 0.075 / 1.0; L.new(tc.outputs["Object"], w.inputs["Vector"])
    w.inputs["Scale"].default_value = 13.3
    mask = lib._math(nt, "GREATER_THAN", w.outputs["Fac"], 0.42)
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(mask, mx.inputs["Factor"]); mx.inputs[6].default_value = (0.02, 0.018, 0.016, 1); mx.inputs[7].default_value = (0.42, 0.29, 0.17, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def ember_material():
    """charred logs: black with grey ash, and thin orange cracks glowing where the wood burns"""
    m, nt = lib._mat("embers")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.95
    tc = nt.nodes.new("ShaderNodeTexCoord")
    ash = nt.nodes.new("ShaderNodeTexNoise"); ash.inputs["Scale"].default_value = 12; ash.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], ash.inputs["Vector"])
    col = nt.nodes.new("ShaderNodeValToRGB"); col.color_ramp.elements[0].position = 0.45; col.color_ramp.elements[0].color = (0.012, 0.010, 0.009, 1); col.color_ramp.elements[1].position = 0.7; col.color_ramp.elements[1].color = (0.16, 0.15, 0.14, 1)
    L.new(ash.outputs["Fac"], col.inputs["Fac"]); L.new(col.outputs["Color"], b.inputs["Base Color"])
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.feature = "DISTANCE_TO_EDGE"; v.inputs["Scale"].default_value = 16; L.new(tc.outputs["Object"], v.inputs["Vector"])
    crack = lib._math(nt, "LESS_THAN", v.outputs["Distance"], 0.025)
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 5; L.new(tc.outputs["Object"], n.inputs["Vector"])
    glow = lib._math(nt, "MULTIPLY", crack, lib._math(nt, "MULTIPLY", lib._math(nt, "MAXIMUM", lib._math(nt, "SUBTRACT", n.outputs["Fac"], 0.42), 0.0), 40.0))
    b.inputs["Emission Color"].default_value = (1.0, 0.22, 0.03, 1); L.new(glow, b.inputs["Emission Strength"])
    return m


def flame_material():
    """emission only, shaped like tongues of flame: noise rising, thinning out with height"""
    m, nt = lib._mat("flames")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); out = N["Material Output"]
    tc = N.new("ShaderNodeTexCoord"); cen = N.new("ShaderNodeVectorMath"); cen.operation = "SUBTRACT"; L.new(tc.outputs["Generated"], cen.inputs[0]); cen.inputs[1].default_value = (0.5, 0.5, 0.5)
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(cen.outputs[0], sep.inputs[0])
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (11.0, 1.0, 1.0); L.new(cen.outputs[0], mp.inputs["Vector"])
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 1.5; n.inputs["Detail"].default_value = 6; n.inputs["Roughness"].default_value = 0.55; n.inputs["Distortion"].default_value = 0.6; L.new(mp.outputs["Vector"], n.inputs["Vector"])
    h = lib._math(nt, "ADD", sep.outputs[2], 0.5)                                       # 0 at the bottom of the box, 1 at its top
    ydist = lib._math(nt, "ABSOLUTE", sep.outputs[1])                                    # 0 in the middle of its depth
    shape = lib._math(nt, "SUBTRACT", lib._math(nt, "SUBTRACT", n.outputs["Fac"], lib._math(nt, "MULTIPLY", h, 0.62)), lib._math(nt, "MULTIPLY", ydist, 0.9))
    f = lib._math(nt, "POWER", lib._math(nt, "MAXIMUM", lib._math(nt, "MULTIPLY", shape, 4.0), 0.0), 2.0)
    xe = lib._math(nt, "SUBTRACT", 0.5, lib._math(nt, "ABSOLUTE", sep.outputs[0])); f = lib._math(nt, "MULTIPLY", f, lib._math(nt, "MINIMUM", lib._math(nt, "MULTIPLY", xe, 12.0), 1.0))
    cr = N.new("ShaderNodeValToRGB"); els = cr.color_ramp.elements; els[0].position = 0.0; els[0].color = (0.9, 0.12, 0.01, 1); els[1].position = 1.0; els[1].color = (1.0, 0.85, 0.45, 1)
    e = els.new(0.45); e.color = (1.0, 0.42, 0.06, 1)
    L.new(lib._math(nt, "MINIMUM", f, 1.0), cr.inputs["Fac"])
    em = N.new("ShaderNodeEmission"); L.new(cr.outputs["Color"], em.inputs["Color"]); L.new(lib._math(nt, "MULTIPLY", f, 40.0), em.inputs["Strength"])
    L.new(em.outputs[0], out.inputs["Volume"])
    return m


def room(M, rnd):
    o = []
    floor_pts = [(-HW0 - 0.3, -0.05), (HW0 + 0.3, -0.05), (HW1 + 0.4, DEP + 0.3), (-HW1 - 0.4, DEP + 0.3)]
    o.append(lib.poly_prism("floor", floor_pts, -0.3, 0.0, M["oak"]))
    o.append(lib.box("back wall", (2 * HW1 + 1.0, 0.3, HT + SLAB), (0, DEP + 0.15, (HT + SLAB) / 2), M["plaster"]))
    for sgn in (-1, 1):
        d = Vector((sgn * (HW1 - HW0), DEP)).normalized(); n = Vector((sgn * d.y, -sgn * d.x)) if sgn > 0 else Vector((-d.y, d.x))
        n = n if (n.x * sgn) > 0 else -n
        p0 = Vector((sgn * HW0, -0.3)); p1 = Vector((sgn * (HW1 + 0.2), DEP + 0.3))
        pts = [tuple(p0), tuple(p1), tuple(p1 + n * 0.3), tuple(p0 + n * 0.3)]
        o.append(lib.poly_prism("side wall", pts, 0.0, HT + SLAB, M["plaster"]))
        # a shadow-gap skirting along the side wall
        mid = (p0 + p1) / 2; L_ = (p1 - p0).length; ang = math.atan2(p1.y - p0.y, p1.x - p0.x)
        sk = lib.box("skirting gap", (L_, 0.02, 0.06), (0, 0, 0), M["shadow"]); sk.location = (mid.x - n.x * 0.005, mid.y - n.y * 0.005, 0.03); sk.rotation_euler = (0, 0, ang); o.append(sk)
    sk = lib.box("skirting gap", (2 * HW1, 0.02, 0.06), (0, DEP - 0.005, 0.03), M["shadow"]); o.append(sk)
    # the ceiling: a slab with three deep skylights, and under it oak slats on dark felt
    ceil_pts = [(-HW0 - 0.3, -0.18), (HW0 + 0.3, -0.18), (HW1 + 0.4, DEP + 0.3), (-HW1 - 0.4, DEP + 0.3)]
    ceil = lib.poly_prism("ceiling", ceil_pts, HT, HT + SLAB, M["ceiling"]); o.append(ceil)
    felt = lib.poly_prism("felt", ceil_pts, HT - 0.004, HT - 0.001, M["felt"]); o.append(felt)
    cutters = bpy.data.collections.new("skylight cutters")
    for (x, y, sx, sy) in SKY:
        c = lib.box("cut", (sx, sy, 2.0), (x, y, HT + SLAB / 2), None); cutters.objects.link(c); bpy.context.scene.collection.objects.unlink(c)
        for (bx, by, px, py) in ((sx + 0.12, 0.06, 0, -sy / 2 - 0.03), (sx + 0.12, 0.06, 0, sy / 2 + 0.03), (0.06, sy, -sx / 2 - 0.03, 0), (0.06, sy, sx / 2 + 0.03, 0)):
            o.append(lib.box("well trim", (bx, by, 0.06), (x + px, y + py, HT - 0.075), M["oak_slat"], bevel=0.004))
        o.append(lib.box("skylight glass", (sx, sy, 0.02), (x, y, HT + SLAB - 0.05), M["glass"]))
        nb = max(1, int(round(sy / 1.1)))
        for i in range(1, nb): o.append(lib.box("glazing bar", (sx, 0.05, 0.08), (x, y - sy / 2 + i * sy / nb, HT + SLAB - 0.05), M["bronze_dark"]))
        nb = max(1, int(round(sx / 1.1)))
        for i in range(1, nb): o.append(lib.box("glazing bar", (0.05, sy, 0.08), (x - sx / 2 + i * sx / nb, y, HT + SLAB - 0.05), M["bronze_dark"]))
    for ob in (ceil, felt):
        bo = ob.modifiers.new("skylights", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.operand_type = "COLLECTION"; bo.collection = cutters; bo.solver = "EXACT"
    bm = bmesh.new(); pitch, sw, sh = 0.075, 0.042, 0.05
    x = -HW1
    while x <= HW1:
        y0 = max(0.02, (abs(x) - HW0) * DEP / (HW1 - HW0) + 0.02) if abs(x) > HW0 else 0.02
        segs = [(y0, DEP - 0.02)]
        for (cx, cy, sx, sy) in SKY:
            if abs(x - cx) < sx / 2 + 0.06 + sw / 2:
                nseg = []
                for (a, b) in segs:
                    lo, hi = cy - sy / 2 - 0.06, cy + sy / 2 + 0.06
                    if b <= lo or a >= hi: nseg.append((a, b)); continue
                    if a < lo: nseg.append((a, lo))
                    if b > hi: nseg.append((hi, b))
                segs = nseg
        for (a, b) in segs:
            if b - a > 0.05: lib.bm_box(bm, (sw, b - a, sh), (x, (a + b) / 2, HT - 0.004 - sh / 2))
        x += pitch
    o.append(lib.mesh_obj("slats", bm, M["oak_slat"]))
    # the glass wall onto the atrium: bronze sill, head and mullions every 3.2 m, the middle bay a pair of doors
    o.append(lib.box("glass sill", (2 * HW0, 0.2, 0.04), (0, 0, 0.02), M["bronze"]))
    o.append(lib.box("glass head", (2 * HW0, 0.2, 0.08), (0, 0, HT - 0.04), M["bronze"]))
    for i in range(10):
        x = -HW0 + i * 3.2 if i < 9 else HW0
        o.append(lib.box("mullion", (0.06, 0.2, HT - 0.12), (x, 0, HT / 2 - 0.02), M["bronze"]))
    for i in range(9):
        x0 = -HW0 + i * 3.2
        if i == 4:
            for (a, b_) in ((x0 + 0.03, x0 + 1.6), (x0 + 1.6, x0 + 3.17)):
                cx = (a + b_) / 2; w = b_ - a
                o.append(lib.box("door glass", (w - 0.08, 0.012, HT - 0.2), (cx, -0.02, HT / 2 - 0.02), M["glass"]))
                for (sx, sz, px, pz) in ((w, 0.05, 0, 0.065), (w, 0.05, 0, HT - 0.105), (0.04, HT - 0.12, -w / 2 + 0.02, HT / 2 - 0.02), (0.04, HT - 0.12, w / 2 - 0.02, HT / 2 - 0.02)):
                    o.append(lib.box("door frame", (sx, 0.05, sz), (cx + px, -0.02, pz), M["bronze"]))
            for sgn in (-1, 1):
                o.append(lib.box("door pull", (0.03, 0.03, 1.4), (x0 + 1.6 + sgn * 0.09, 0.05, 1.3), M["bronze"], bevel=0.008))
                o.append(lib.box("door pull", (0.03, 0.03, 1.4), (x0 + 1.6 + sgn * 0.09, -0.09, 1.3), M["bronze"], bevel=0.008))
            continue
        o.append(lib.box("pane", (3.2 - 0.06, 0.012, HT - 0.12), (x0 + 1.6, 0.0, HT / 2 - 0.02), M["glass"]))
    o.append(lib.box("storey band", (2 * HW0 + 6.2, 0.4, SLAB + 0.4), (0, -0.25, HT + SLAB / 2 + 0.2), M["travertine"]))
    # the storey above: Jim's study behind its own glass (it casts no shadow, so the skylights keep their sun)
    up = []
    for i in range(10):
        x = -HW0 + i * 3.2 if i < 9 else HW0
        up.append(lib.box("mullion", (0.06, 0.16, 7.9 - 5.0), (x, -0.2, (5.0 + 7.9) / 2), M["bronze"]))
    up.append(lib.box("upper glass", (2 * HW0, 0.012, 7.9 - 5.0), (0, -0.2, (5.0 + 7.9) / 2), M["glass"]))
    up.append(lib.box("roof band", (2 * HW0 + 6.2, 0.4, 0.15), (0, -0.25, 7.95), M["travertine"]))
    rr = random.Random(5)
    for (s0, s1) in ((-14.4, -4.8), (-4.8, 4.8), (4.8, 14.4)):
        up += atrium.far_room(0, s0, s1, 5.0, 7.9, rr, M, lit=True)
    trough = lib.box("trough", (28.6, 0.45, 0.42), (0, -0.47, 4.86), M["travertine"], bevel=0.008); up.append(trough)
    up.append(atrium.trailing("trailing", 0, -14.2, 14.2, atrium.APA - 0.7, 5.08, random.Random(6), bpy.data.objects.get("ivy leaf") or atrium.leaf_object("ivy leaf", 0.05, 0.04, M["ivy"])))
    for ob in up:
        ob.visible_shadow = False
    return o + up


def partitions(M):
    """walls at x = +-PART from the glass to the back wall, each with a cased opening in walnut"""
    o = []; t = 0.3; y0, y1, zh = 8.6, 11.4, 3.0
    for sgn in (-1, 1):
        x = sgn * PART
        for (a, b) in ((0.1, y0), (y1, DEP)):
            o.append(lib.box("partition", (t, b - a, HT), (x, (a + b) / 2, HT / 2), M["plaster"]))
        o.append(lib.box("partition head", (t, y1 - y0, HT - zh), (x, (y0 + y1) / 2, (HT + zh) / 2), M["plaster"]))
        for yy in (y0, y1):
            o.append(lib.box("casing", (t + 0.04, 0.09, zh + 0.09), (x, yy + (0.045 if yy == y0 else -0.045), zh / 2 + 0.045), M["walnut_v"], bevel=0.004))
        o.append(lib.box("casing head", (t + 0.04, y1 - y0, 0.09), (x, (y0 + y1) / 2, zh + 0.045), M["walnut"], bevel=0.004))
        o.append(lib.box("skirting gap", (0.02, DEP, 0.06), (x - sgn * (t / 2 + 0.005), DEP / 2, 0.03), M["shadow"]))
        o.append(lib.box("skirting gap", (0.02, DEP, 0.06), (x + sgn * (t / 2 + 0.005), DEP / 2, 0.03), M["shadow"]))
    return o


def back_wall(M, rnd):
    o = []; yb = DEP
    # the chimney breast in travertine, the fire in it and the screen above it
    br_y0 = DEP - 0.5
    for (x0, x1, z0, z1) in ((-2.0, 2.0, 0.0, 0.42), (-2.0, 2.0, 0.98, HT), (-2.0, -0.92, 0.42, 0.98), (0.92, 2.0, 0.42, 0.98)):
        o.append(lib.box("chimney breast", (x1 - x0, 0.5, z1 - z0), ((x0 + x1) / 2, (br_y0 + yb) / 2, (z0 + z1) / 2), M["breast"]))
    bm = bmesh.new()
    for (sx, sy, sz, px, py, pz) in ((1.84, 0.02, 0.56, 0, 0.44, 0.70), (1.84, 0.46, 0.02, 0, 0.22, 0.43), (1.84, 0.46, 0.02, 0, 0.22, 0.97), (0.02, 0.46, 0.56, -0.92, 0.22, 0.70), (0.02, 0.46, 0.56, 0.92, 0.22, 0.70)):
        lib.bm_box(bm, (sx, sy, sz), (px, br_y0 + py, pz))
    o.append(lib.mesh_obj("firebox", bm, M["soot"]))
    emb = ember_material()
    for i, (x, y, z, r, rz) in enumerate(((-0.3, 0.26, 0.49, 0.055, 0.04), (0.28, 0.24, 0.49, 0.05, -0.05), (0.0, 0.33, 0.535, 0.045, 0.1))):
        c = lib.cyl("log", r, 1.0 - 0.15 * i, (0, 0, 0), emb, verts=20, rot=(0, math.pi / 2, rz)); c.location = (x - (1.0 - 0.15 * i) / 2 * math.cos(rz), br_y0 + y, z); o.append(c)
    fl = lib.box("flames", (1.6, 0.22, 0.42), (0, br_y0 + 0.27, 0.71), flame_material()); fl.visible_shadow = False; o.append(fl)
    fire = lib.area_light("fire light", (0, br_y0 + 0.1, 0.66), 1.5, 120, (1.0, 0.52, 0.22), rot=(math.radians(-90), 0, 0), size_y=0.3); o.append(fire)
    o.append(lib.box("hearth", (4.0, 0.62, 0.06), (0, br_y0 + 0.2, 0.03), M["travertine"], bevel=0.004))
    tv = lib.box("screen", (1.90, 0.035, 1.08), (0, br_y0 - 0.02, 2.30), M["screen"], bevel=0.003); o.append(tv)
    # doors to the street beside the breast
    for sgn in (-1, 1):
        cx = sgn * 2.9
        o.append(lib.box("door", (1.12, 0.05, 2.96), (cx, yb - 0.03, 1.48), M["walnut_v"], bevel=0.003))
        for (sx, sz, px, pz) in ((1.22, 0.05, 0, 3.0), (0.05, 3.0, -0.585, 1.5), (0.05, 3.0, 0.585, 1.5)):
            o.append(lib.box("door frame", (sx, 0.09, sz), (cx + px, yb - 0.045, pz), M["bronze_dark"]))
        o.append(lib.box("door pull", (0.025, 0.04, 1.0), (cx - sgn * 0.45, yb - 0.09, 1.15), M["brass"], bevel=0.006))
    # the bookcases, three each side
    bbm = bmesh.new(); decor = []
    for sgn in (-1, 1):
        for cx in CASES:
            o += furn.bookcase("bookcase", sgn * cx, 3.0, yb, 0.42, HT, M, rnd, bbm, decor)
    o.append(lib.mesh_obj("books", bbm, M["book"]))
    for i, (x, z, h) in enumerate(decor):
        o.append(furn.ornament("ornament", x, yb - 0.24, z, h, rnd, M["ceramics"]))
    # a brass ladder on a rail, for the high shelves
    rail = lib.cyl("ladder rail", 0.012, 3.0, (0, 0, 0), M["brass"], verts=16, rot=(0, math.pi / 2, 0)); rail.location = (3.8, yb - 0.47, 3.45); o.append(rail)
    lad = furn.empty("ladder", (6.1, yb - 0.47, 0)); ang = math.radians(14)
    for x in (-0.24, 0.24):
        s = lib.box("ladder side", (0.035, 0.06, 3.55), (x, -0.43, 1.72), M["walnut"], bevel=0.005); s.rotation_euler = (-ang, 0, 0); s.parent = lad
    for i in range(10):
        z = 0.3 + i * 0.31; r_ = lib.box("ladder rung", (0.48, 0.07, 0.025), (0, -0.86 + z * math.tan(ang), z), M["brass"], bevel=0.004); r_.parent = lad
    o.append(lad)
    return o


def tint_fabric(root, rgb):
    """re-colour an imported chair: multiply its fabric's colour texture by rgb (on its own copy of the material)"""
    for ob in root.children_recursive:
        if ob.type != "MESH": continue
        for i, m in enumerate(ob.data.materials):
            if not m or "fabric" not in m.name.lower(): continue
            m2 = m.copy(); ob.data.materials[i] = m2; nt = m2.node_tree; b = [n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"][0]
            src = b.inputs["Base Color"].links[0].from_socket if b.inputs["Base Color"].links else None
            hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = 0.0
            mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; mx.inputs[7].default_value = (*rgb, 1)
            if src: nt.links.new(src, hs.inputs["Color"]); nt.links.new(hs.outputs["Color"], mx.inputs[6])
            else: mx.inputs[6].default_value = (0.8, 0.8, 0.8, 1)
            nt.links.new(mx.outputs[2], b.inputs["Base Color"])
            if "Sheen Tint" in b.inputs and not b.inputs["Sheen Tint"].links: b.inputs["Sheen Tint"].default_value = (*rgb, 1)


def furnish(M, rnd):
    o = []
    # the sitting group by the fire: the curved sofa facing it, two chairs either side, a round table
    o.append(furn.rug("rug", (4.6, 4.2), (0, 9.55), M))
    o.append(lib.cyl("coffee table", 0.58, 0.05, (0, 9.8, 0.30), M["travertine"], verts=96, bevel=0.01))
    o.append(lib.cyl("coffee table base", 0.42, 0.29, (0, 9.8, 0.014), M["travertine"], verts=96, bevel=0.006))
    sofa = lib.import_glb(os.path.join(A, "GlamVelvetSofa.glb"), (0.0, 8.25, 0.014), math.radians(180), name="sofa")
    ch = lib.import_glb(os.path.join(A, "SheenChair.glb"), (-1.8, 9.95, 0.014), math.radians(110), name="chair west")
    lib.instance_of(ch, (1.8, 9.95, 0.014), math.radians(-110), name="chair east")
    for sgn in (-1, 1):
        furn.side_table("side table", (sgn * 1.55, 7.75, 0.014), M)
        furn.table_lamp("table lamp", (sgn * 1.55, 7.75, 0.56), M, watts=90)
    vase = lib.import_glb(os.path.join(A, "GlassVaseFlowers.glb"), (0.1, 9.65, 0.354), math.radians(20), 1.6, name="flowers")
    for i, (t, w, d) in enumerate(((0.035, 0.30, 0.24), (0.03, 0.28, 0.22), (0.025, 0.26, 0.2))):
        o.append(lib.box("coffee book", (w, d, t - 0.002), (-0.2, 10.05, 0.354 + (0, 0.035, 0.065)[i] + t / 2), M["book"], bevel=0.002, rot_z=0.5 + 0.1 * i))
    lib.import_glb(os.path.join(A, "DiffuseTransmissionTeacup.glb"), (0.28, 10.1, 0.354), 0.4, 1.0, name="teacup")
    lib.import_glb(os.path.join(A, "SpecularSilkPouf.glb"), (-2.55, 11.75, 0.0), 0.3, 1.0, name="pouf")
    o.append(furn.cushion("cushion", (0.42, 0.12, 0.40), (-0.55, 8.14, 0.585), (math.radians(16), 0, math.radians(8)), lib.fabric("cushion rust", (0.36, 0.11, 0.04), 0.8, 0.6)))
    o.append(furn.cushion("cushion", (0.40, 0.12, 0.38), (0.55, 8.14, 0.58), (math.radians(16), 0, math.radians(-6)), M["linen"]))
    # a corner by the glass for chess: a small round table and two chairs in another velvet
    nook = lib.import_glb(os.path.join(A, "SheenChair.glb"), (4.45, 2.0, 0.0), math.radians(90), name="nook chair")
    tint_fabric(nook, (0.62, 0.50, 0.30))
    lib.instance_of(nook, (5.95, 2.0, 0.0), math.radians(-90), name="nook chair 2")
    furn.side_table("chess table", (5.2, 2.0, 0.0), M, r=0.42, h=0.62)
    lib.import_glb(os.path.join(A, "ABeautifulGame.glb"), (5.2, 2.0, 0.62), math.radians(5), 0.62, name="chess")
    # the piano by the glass, the curve of its case and its open lid to the room
    furn.piano((-10.7, 1.8, 0.0), math.radians(90), M)
    furn.floor_lamp("floor lamp", (-10.1, 4.6, 0.0), M, watts=90)
    sofa2 = lib.instance_of(sofa, (-12.2, 7.4, 0.0), math.radians(-12), name="music sofa")
    # the table for eight
    tx, ty = 10.4, 6.4
    o.append(lib.box("dining top", (1.15, 3.0, 0.05), (tx, ty, 0.745), M["walnut"], bevel=0.004))
    for sgn in (-1, 1): o.append(lib.box("dining base", (0.32, 0.75, 0.72), (tx, ty + sgn * 0.85, 0.36), M["travertine"], bevel=0.01))
    for sgn in (-1, 1):
        for dy in (-0.9, 0.0, 0.9): furn.dining_chair("chair", (tx + sgn * 0.82, ty + dy, 0.0), math.radians(90 if sgn < 0 else -90), M)
        furn.dining_chair("chair", (tx, ty + sgn * 1.78, 0.0), math.radians(180 if sgn < 0 else 0), M)
    lib.import_glb(os.path.join(A, "IridescentDishWithOlives.glb"), (tx, ty - 0.35, 0.77), 0.0, 0.8, name="olives")
    lib.instance_of(vase, (tx + 0.05, ty + 0.55, 0.77), 1.2, 1.5)
    # five glass globes over the table, each on its own cable
    globe = lib.glass("globe glass", (0.97, 0.95, 0.9), 0.15)
    for i in range(5):
        gy = ty - 1.2 + i * 0.6; gz = 1.62 + 0.06 * (i % 2)
        o.append(furn.lathe("globe", [(0.0, -0.16), (0.09, -0.135), (0.15, -0.05), (0.16, 0.0), (0.15, 0.06), (0.11, 0.12), (0.03, 0.155), (0.0, 0.16)], globe, 48, (tx, gy, gz)))
        o.append(lib.cyl("globe bulb", 0.022, 0.05, (tx, gy, gz - 0.02), lib.emission("bulb", (1.0, 0.72, 0.45), 60), verts=16))
        o.append(lib.cyl("globe cap", 0.035, 0.05, (tx, gy, gz + 0.15), M["brass"], verts=24))
        o.append(lib.cyl("globe cable", 0.002, HT - gz - 0.2, (tx, gy, gz + 0.2), M["shadow"], verts=8))
        o.append(lib.point_light("globe light", (tx, gy, gz), 35, (1.0, 0.75, 0.5), 0.06))
    o.append(furn.rug("dining rug", (3.4, 4.8), (tx, ty), M))
    # a sideboard on the dining room's long wall, under the painting
    sb = furn.empty("sideboard", (19.23, 7.11, 0.0), math.radians(-126))
    for part in (lib.box("sideboard body", (2.6, 0.5, 0.72), (0, 0, 0.46), M["walnut"], bevel=0.006), lib.box("sideboard top", (2.64, 0.52, 0.03), (0, 0, 0.835), M["marble"], bevel=0.004),
                 lib.box("sideboard plinth", (2.4, 0.4, 0.1), (0, 0.02, 0.05), M["bronze_dark"])):
        part.parent = sb
    for k in range(4):
        d = lib.box("sideboard door", (0.63, 0.012, 0.66), (-0.975 + k * 0.65, -0.256, 0.46), M["walnut"], bevel=0.002); d.parent = sb
    # the music room: a rug under the piano, two chairs to listen from
    o.append(furn.rug("music rug", (3.8, 3.2), (-11.8, 2.6), M))
    lc = lib.import_glb(os.path.join(A, "SheenChair.glb"), (-14.0, 4.6, 0.0), math.radians(-150), name="music chair")
    tint_fabric(lc, (0.20, 0.32, 0.26))
    lib.instance_of(lc, (-14.9, 3.4, 0.0), math.radians(-115), name="music chair 2")
    # plants
    pl = lib.import_glb(os.path.join(A, "DiffuseTransmissionPlant.glb"), (-13.3, 1.2, 0.0), 0.5, 1.7, name="plant")
    lib.instance_of(pl, (13.4, 1.2, 0.0), 2.1, 1.8); lib.instance_of(pl, (-17.6, 12.6, 0.0), 1.0, 1.9); lib.instance_of(pl, (6.9, 0.9, 0.0), 3.0, 1.4); lib.instance_of(pl, (-7.0, 0.9, 0.0), 4.0, 1.5)
    # paintings
    p1 = furn.painting_material("painting oxblood", (0.30, 0.05, 0.03), [(0.08, 0.92, 0.52, 0.92, (0.62, 0.22, 0.05)), (0.08, 0.92, 0.08, 0.46, (0.12, 0.02, 0.02))])
    p2 = furn.painting_material("painting slate", (0.12, 0.14, 0.17), [(0.08, 0.92, 0.58, 0.92, (0.55, 0.50, 0.40)), (0.08, 0.92, 0.08, 0.52, (0.05, 0.06, 0.09))])
    p3 = furn.painting_material("painting ochre", (0.50, 0.33, 0.10), [(0.1, 0.9, 0.5, 0.9, (0.70, 0.55, 0.25)), (0.1, 0.9, 0.1, 0.42, (0.30, 0.12, 0.04))])
    for sgn, mat in ((-1, p1), (1, p2)):
        p = Vector((sgn * (HW0 + HW1) / 2, DEP / 2)); n = Vector((-sgn * 0.809, 0.588)); q = p + n * 0.05
        pw, ph, pz = (2.2, 2.6, 1.85) if sgn < 0 else (1.9, 2.1, 2.1)
        furn.painting("painting", pw, ph, (q.x, q.y, pz), math.radians(-sgn * 126), mat, M["frame"])
    for sgn in (-1, 1): furn.painting("painting", 1.8, 2.2, (sgn * 18.6, DEP - 0.05, 1.75), 0.0, p3 if sgn < 0 else p2, M["frame"])
    p4 = furn.painting_material("painting dusk", (0.20, 0.10, 0.06), [(0.07, 0.93, 0.56, 0.93, (0.58, 0.36, 0.16)), (0.07, 0.93, 0.07, 0.5, (0.22, 0.05, 0.03))])
    p5 = furn.painting_material("painting moss", (0.10, 0.12, 0.08), [(0.08, 0.92, 0.55, 0.92, (0.36, 0.42, 0.22)), (0.08, 0.92, 0.08, 0.48, (0.62, 0.55, 0.38))])
    for sgn, mat in ((-1, p5), (1, p2)):
        x = sgn * (PART + 0.17); furn.painting("painting", 2.0, 2.5, (x, 4.6, 1.95), math.radians(-90 * sgn), mat, M["frame"])
        o.append(lib.box("console", (0.42, 2.4, 0.06), (x + sgn * 0.24, 4.6, 0.80), M["walnut"], bevel=0.004))
        for dy in (-1.05, 1.05): o.append(lib.box("console leg", (0.38, 0.05, 0.77), (x + sgn * 0.24, 4.6 + dy, 0.385), M["bronze_dark"], bevel=0.003))
        o.append(furn.ornament("console vase", x + sgn * 0.24, 5.2, 0.83, 0.45, random.Random(21 + sgn), M["ceramics"]))
    for sgn, mat in ((-1, p4), (1, p3)):
        x = sgn * (PART - 0.17); furn.painting("painting", 2.0, 2.5, (x, 4.6, 1.95), math.radians(90 * sgn), mat, M["frame"])
        o.append(lib.box("console", (0.42, 2.4, 0.06), (x - sgn * 0.24, 4.6, 0.80), M["walnut"], bevel=0.004))
        for dy in (-1.05, 1.05): o.append(lib.box("console leg", (0.38, 0.05, 0.77), (x - sgn * 0.24, 4.6 + dy, 0.385), M["bronze_dark"], bevel=0.003))
        o.append(furn.ornament("console vase", x - sgn * 0.24, 4.0, 0.83, 0.42, random.Random(3 + sgn), M["ceramics"]))
        o.append(furn.ornament("console bowl", x - sgn * 0.24, 5.3, 0.83, 0.2, random.Random(9 + sgn), M["ceramics"]))
    return o


def lights():
    lib.sun(SUN_ELEV, SUN_AZ, 20.0, angle_deg=2.5, color=(1.0, 0.93, 0.84))
    lib.sky_world(SUN_ELEV, SUN_AZ, 0.6)
    # the Sun Well's lens sends light straight down the shaft, so the sun court at the bottom has its noon
    lib.area_light("lens beam", (atrium.C.x, atrium.C.y, 8.4), 33.0, 14000, (1.0, 0.95, 0.88), shape="DISK", spread=22)


def room_lights(M):
    """recessed downlights in the slat ceiling, light under every shelf, grazers on the chimney breast"""
    warm = (1.0, 0.80, 0.60); lens = lib.emission("downlight lens", warm, 35.0)
    y = 1.8
    while y < DEP - 0.8:
        x = -13.2
        while x <= 13.2:
            ok = abs(x) < half_w(y) - 1.0 and not any(abs(x - cx) < sx / 2 + 0.5 and abs(y - cy) < sy / 2 + 0.5 for (cx, cy, sx, sy) in SKY)
            if ok:
                lib.cyl("downlight trim", 0.05, 0.012, (x, y, HT - 0.06), M["bronze_dark"], verts=24)
                lib.cyl("downlight lens", 0.032, 0.004, (x, y, HT - 0.0605), lens, verts=24)
                lib.spot_light("downlight", (x, y, HT - 0.07), 40, warm, 0.02, 75, 0.6)
            x += 2.4
        y += 2.7
    for sgn in (-1, 1):
        sp = lib.spot_light("grazer", (sgn * 1.2, DEP - 0.75, HT - 0.07), 70, warm, 0.02, 60, 0.5); sp.rotation_euler = (math.radians(-8), 0, 0)
    strip = lib.emission("shelf light", warm, 14.0)
    for sgn in (-1, 1):
        for cx in CASES:
            for z in (1.22, 1.66, 2.10, 2.54, 2.98, 3.40):
                for bx in (cx - 0.75, cx + 0.75):
                    lib.box("shelf strip", (1.38, 0.012, 0.004), (sgn * bx, DEP - 0.40 + 0.03, z - 0.035 - 0.003), strip)


CAMS = {
    "view":  dict(loc=(8.6, 12.5, 1.40), target=(-6.0, 0.5, 1.4), lens=19, shift_y=0.04),
    "fire":  dict(loc=(-5.0, 1.7, 1.40), target=(2.0, 13.5, 1.4), lens=21, shift_y=0.04),
    "hero":  dict(loc=(3.4, 12.4, 1.30), target=(0.0, 1.5, 1.3), lens=22, shift_y=0.04),
    "column": dict(loc=(0.0, 1.0, 1.40), target=(0.0, -10.0, 4.0), lens=24, shift_y=0.12),
    "music": dict(loc=(-9.0, 10.6, 1.38), target=(-12.5, 2.0, 1.3), lens=22, shift_y=0.0),
    "dining": dict(loc=(9.0, 11.6, 1.45), target=(11.5, 2.0, 1.2), lens=22, shift_y=0.0),
    "out":   dict(loc=(0.0, 5.0, 1.40), target=(0.0, -10.0, 1.4), lens=24, shift_y=0.05),
    "living": dict(loc=(0.45, 3.7, 1.45), target=(0.0, 13.9, 1.45), lens=24, shift_y=0.0),
    "living2": dict(loc=(-0.6, 4.6, 1.35), target=(0.15, 13.9, 1.35), lens=26, shift_y=0.02),
    "piano": dict(loc=(-3.0, 7.0, 1.45), target=(-9.5, 2.0, 1.2), lens=24, shift_y=0.0),
    "wide":  dict(loc=(13.8, 12.6, 1.45), target=(-8.0, 2.0, 1.4), lens=17, shift_y=0.05),
    "glass": dict(loc=(4.5, 3.0, 1.40), target=(-6.0, 11.0, 1.4), lens=19, shift_y=0.04),
}


def build(hedges=True, far=True, with_suite=True):
    sc = lib.reset(); rnd = random.Random(7)
    M = materials(); room(M, rnd); partitions(M); back_wall(M, rnd); furnish(M, rnd); room_lights(M); atrium.build(M, random.Random(11), hedges, far); atrium.build_lower(M, random.Random(13))
    if with_suite: suite.build(M, random.Random(17))
    lights()
    return sc


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    cam = args[0] if args else "view"; out = args[1] if len(args) > 1 else "blend/out_%s.jpg" % cam
    w, h, spp, ex = (int(args[2]), int(args[3]), int(args[4]), float(args[5])) if len(args) > 5 else (640, 360, 24, 1.0)
    t = time.time(); build(); print("built in %.1f s" % (time.time() - t))
    for name in cam.split(","):
        c = CAMS[name]; lib.camera(name, c["loc"], c["target"], lens=c["lens"], shift_y=c["shift_y"])
        t = time.time(); lib.render(os.path.abspath(out.replace("%s", name) if "%s" in out else out if "," not in cam else out.replace(".jpg", "_" + name + ".jpg")), (w, h), spp, exposure=ex); print("rendered", name, "in %.1f s" % (time.time() - t))
