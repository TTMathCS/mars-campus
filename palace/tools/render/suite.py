"""The street behind the family room and the master suite down across it, in ring B of L1 (the family room's frame:
x along the atrium glass, y into the house, z up from L1's floor).

The street runs from y = 14.1 to 17.9, 8 m tall and lit from above. Across it the suite: a moss garden open to the
sky in the middle (x within 7 m of the middle, 8 m tall), with a still pool, stones and a maple; the bedroom on its
+x side and the bath on its -x side, each with a glass wall onto the garden; a glazed gallery along the street."""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, noise
import lib, furn, atrium, bed

S0, S1 = 14.12, 17.92        # the street
B0, B1 = 18.12, 31.92        # ring B
G = 7.0                      # half the garden's width
GY0, GY1 = 19.6, 30.6        # the garden's extent in y
HB = 4.0                     # the suite's rooms' ceiling
TOP = 8.0                    # L1's roof


def moss_material():
    m, nt = lib._mat("moss")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.95; b.inputs["Sheen Weight"].default_value = 1.0; b.inputs["Sheen Roughness"].default_value = 0.3
    b.inputs["Sheen Tint"].default_value = (0.6, 0.9, 0.4, 1)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 3; n.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.35; cr.color_ramp.elements[0].color = (0.035, 0.075, 0.012, 1); cr.color_ramp.elements[1].position = 0.7; cr.color_ramp.elements[1].color = (0.11, 0.17, 0.03, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    f = nt.nodes.new("ShaderNodeTexVoronoi"); f.inputs["Scale"].default_value = 250; L.new(tc.outputs["Object"], f.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.6; bm.inputs["Distance"].default_value = 0.003; L.new(f.outputs["Distance"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def rock_material():
    m, nt = lib._mat("rock")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.85
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 4; n.inputs["Detail"].default_value = 12; n.inputs["Roughness"].default_value = 0.65; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (0.10, 0.10, 0.095, 1); cr.color_ramp.elements[1].color = (0.30, 0.29, 0.27, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"])
    lichen = nt.nodes.new("ShaderNodeTexNoise"); lichen.inputs["Scale"].default_value = 9; L.new(tc.outputs["Object"], lichen.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", lib._math(nt, "GREATER_THAN", lichen.outputs["Fac"], 0.62), 0.7), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (0.08, 0.12, 0.03, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.5; L.new(n.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def still_water():
    """a still black pool: a mirror on dark slate"""
    return lib.principled("still water", (0.01, 0.012, 0.012), 0.015, **{"Coat Weight": 1.0, "Coat Roughness": 0.0, "Specular IOR Level": 0.6})


def boulder(name, loc, size, seed, mat):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
    for v in bm.verts:
        c = v.co; d = 1 + 0.28 * noise.noise(c * 1.3 + Vector((seed, 0, 0))) + 0.08 * noise.noise(c * 4.0 + Vector((0, seed, 0)))
        v.co = Vector((c.x * size[0] * d, c.y * size[1] * d, max(c.z, -0.35) * size[2] * d))
    o = lib.mesh_obj(name, bm, mat, smooth=True); o.location = loc; o.rotation_euler = (0, 0, seed); return o


def moss_ground(name, x0, x1, y0, y1, z0, hole, mat, seed=3):
    """undulating mounds of moss, kept flat round the pool (hole = x0, x1, y0, y1)"""
    nx, ny = int((x1 - x0) / 0.12), int((y1 - y0) / 0.12)
    bm = bmesh.new(); vs = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; y = y0 + (y1 - y0) * j / ny
            h = 0.22 * max(0.0, noise.noise(Vector((x * 0.35 + seed, y * 0.35, 0)))) + 0.05 * noise.noise(Vector((x * 1.5, y * 1.5 + seed, 0)))
            ex = min(x - x0, x1 - x, y - y0, y1 - y); h *= min(1.0, ex / 0.6)
            hx0, hx1, hy0, hy1 = hole; dx = max(hx0 - x, 0, x - hx1); dy = max(hy0 - y, 0, y - hy1); dh = math.hypot(dx, dy)
            h *= min(1.0, dh / 0.8)
            row.append(bm.verts.new((x, y, z0 + 0.05 + h)))
        vs.append(row)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    return lib.mesh_obj(name, bm, mat, smooth=True)


def maple(name, loc, seed, M, height=4.2):
    """a Japanese maple: the olive's branching, wider, with small red leaves"""
    w, lp = furn.olive_tree(name, loc, seed, M, height=height, leaves=22000)
    md = lp.modifiers[0]
    ng = bpy.data.node_groups.get("maple leaves")
    if ng is None:
        ng = md.node_group.copy(); ng.name = "maple leaves"
        leaf = atrium.leaf_object("maple leaf", 0.05, 0.042, M["maple_leaf"])
        for n in ng.nodes:
            if n.bl_idname == "GeometryNodeObjectInfo": n.inputs["Object"].default_value = leaf
    md.node_group = ng
    return w, lp


def build(M, rnd):
    o = []; P = lib.principled
    # the street: travertine underfoot, plaster walls, lit from above through a long opening
    o.append(lib.box("street floor", (60, S1 - S0 + 0.4, 0.3), (0, (S0 + S1) / 2, -0.15), M["pavers"]))
    o.append(lib.box("street roof", (60, S1 - S0 + 1.0, 0.6), (0, (S0 + S1) / 2, TOP + 0.3), M["plaster"]))
    cut = lib.box("street skylight cut", (24.0, 2.2, 2.0), (0, (S0 + S1) / 2, TOP + 0.3), None); cut.hide_render = True; cut.hide_viewport = True
    bo = o[-1].modifiers.new("open", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    # the family room's back wall seen from the street, with the other side of its two doors at x = +-2.9
    o.append(lib.box("street near wall", (60, 0.15, TOP), (0, 14.275, TOP / 2), M["street_stone"]))
    for x in (-9.0, -4.6, 4.6, 9.0):
        for y, d in ((14.36, 1), (S1 - 0.08, -1)):
            o.append(lib.box("sconce", (0.12, 0.08, 0.5), (x, y + d * 0.04, 2.3), M["bronze_dark"], bevel=0.01))
            o.append(lib.box("sconce glow", (0.1, 0.01, 0.42), (x, y + d * 0.085, 2.3), lib.emission("sconce glow", (1.0, 0.75, 0.5), 18)))
            lib.point_light("sconce light", (x, y + d * 0.2, 2.3), 25, (1.0, 0.75, 0.5), 0.05)
    o.append(lib.box("street bench", (2.4, 0.45, 0.42), (-9.0, 14.6, 0.21), M["walnut"], bevel=0.01))
    for sgn in (-1, 1):
        o.append(lib.box("family door", (1.12, 0.05, 2.96), (sgn * 2.9, 14.375, 1.48), M["walnut_v"], bevel=0.003))
        o.append(lib.box("family door pull", (0.025, 0.04, 1.0), (sgn * 2.9 + sgn * 0.45, 14.42, 1.15), M["brass"], bevel=0.006))
        for (sx, sz, px, pz) in ((1.22, 0.05, 0, 3.0), (0.05, 3.0, -0.585, 1.5), (0.05, 3.0, 0.585, 1.5)):
            o.append(lib.box("family door frame", (sx, 0.09, sz), (sgn * 2.9 + px, 14.39, pz), M["bronze_dark"]))
    for sgn in (-1, 1): o.append(lib.box("street end", (0.3, S1 - 14.35, TOP), (sgn * 30.0, (14.35 + S1) / 2, TOP / 2), M["street_stone"]))
    # the suite's front: a glazed gallery along the street, with the suite's doors in the middle
    o.append(lib.box("suite front wall", (60, 0.3, TOP), (0, B0 - 0.05, TOP / 2), M["street_stone"]))
    for sgn in (-1, 1):
        o.append(lib.box("suite door", (1.15, 0.06, 3.2), (sgn * 0.6, S1 - 0.03, 1.6), M["walnut_v"], bevel=0.003))
        o.append(lib.box("suite door pull", (0.03, 0.04, 1.2), (sgn * 0.1, S1 - 0.08, 1.3), M["brass"], bevel=0.006))
    o.append(lib.box("suite door frame", (2.6, 0.12, 0.12), (0, S1 - 0.06, 3.26), M["bronze_dark"]))
    for sgn in (-1, 1):
        o.append(lib.box("suite door frame", (0.12, 0.12, 3.32), (sgn * 1.24, S1 - 0.06, 1.66), M["bronze_dark"]))
    for x in (-6.0, 6.0):
        furn.olive_tree("street olive", (x, (S0 + S1) / 2, 0.55), rnd.randint(0, 9999), M, height=4.5, leaves=18000)
        o.append(lib.box("street planter", (1.3, 1.3, 0.55), (x, (S0 + S1) / 2, 0.275), M["travertine"], bevel=0.01))
    # the suite: floor, ceilings, the garden open to the sky
    o.append(lib.box("suite floor", (60, B1 - B0, 0.3), (0, (B0 + B1) / 2, -0.15), M["oak"]))
    roof = lib.box("suite roof", (60, B1 - B0, 0.6), (0, (B0 + B1) / 2, TOP + 0.3), M["plaster"]); o.append(roof)
    cut2 = lib.box("garden opening cut", (2 * G, GY1 - GY0, 2.0), (0, (GY0 + GY1) / 2, TOP + 0.3), None); cut2.hide_render = True; cut2.hide_viewport = True
    bo = roof.modifiers.new("open", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut2; bo.solver = "EXACT"
    for sgn in (-1, 1):
        # the rooms either side have a ceiling at HB; above them, plaster up to the roof
        o.append(lib.box("room ceiling", (13.0, B1 - B0, 0.3), (sgn * (G + 0.4 + 6.5), (B0 + B1) / 2, HB + 0.15), M["ceiling"]))
        o.append(lib.box("garden wall above", (0.3, GY1 - GY0 + 0.6, TOP - HB), (sgn * (G + 0.25), (GY0 + GY1) / 2, (HB + TOP) / 2), M["garden_stone"]))
        # the glass wall onto the garden, bronze mullions every 2 m
        o.append(lib.box("garden glass", (0.012, GY1 - GY0, HB - 0.1), (sgn * (G + 0.25), (GY0 + GY1) / 2, HB / 2), M["glass"]))
        y = GY0
        while y <= GY1 + 0.01:
            o.append(lib.box("garden mullion", (0.08, 0.06, HB), (sgn * (G + 0.25), y, HB / 2), M["bronze"])); y += (GY1 - GY0) / 5
        o.append(lib.box("room end wall", (0.3, B1 - B0, HB), (sgn * 15.65, (B0 + B1) / 2, HB / 2), M["oak_panel"]))
        o.append(lib.box("room back wall", (8.4, 0.3, HB), (sgn * 11.45, 27.75, HB / 2), M["oak_panel"]))
        o.append(lib.box("room door", (1.0, 0.06, 2.8), (sgn * 13.6, 27.57, 1.4), M["walnut_v"], bevel=0.003))
        o.append(lib.box("cove", (8.0, 0.25, 0.08), (sgn * 11.45, 27.45, HB - 0.06), lib.emission("cove glow", (1.0, 0.78, 0.55), 6)))
    o.append(lib.box("garden back wall", (2 * G + 1.0, 0.3, TOP), (0, GY1 + 0.15 + 0.6, TOP / 2), M["garden_stone"]))
    o.append(lib.box("gallery glass", (2 * G, 0.012, HB - 0.1), (0, GY0 - 0.05, HB / 2), M["glass"]))
    o.append(lib.box("suite back wall", (60, 0.3, HB), (0, B1 + 0.15, HB / 2), M["oak_panel"]))
    # the garden: moss mounds, a still pool, stones, a maple, stepping stones
    pool = (-3.4, 1.6, 24.0, 26.6)
    o.append(moss_ground("moss", -G + 0.05, G - 0.05, GY0 + 0.05, GY1 - 0.05, -0.04, pool, M["moss"]))
    o.append(lib.box("pool water", (pool[1] - pool[0], pool[3] - pool[2], 0.04), ((pool[0] + pool[1]) / 2, (pool[2] + pool[3]) / 2, 0.025), M["still_water"]))
    o.append(lib.box("pool edge", (pool[1] - pool[0] + 0.3, pool[3] - pool[2] + 0.3, 0.06), ((pool[0] + pool[1]) / 2, (pool[2] + pool[3]) / 2, 0.02), M["slate"]))
    for (sx, sy, px, py) in ((2 * G + 0.5, 0.25, 0, GY0 - 0.1), (2 * G + 0.5, 0.25, 0, GY1 + 0.1), (0.25, GY1 - GY0, -G - 0.1, (GY0 + GY1) / 2), (0.25, GY1 - GY0, G + 0.1, (GY0 + GY1) / 2)):
        o.append(lib.box("garden curb", (sx, sy, 0.12), (px, py, 0.06), M["travertine"], bevel=0.008))
    for i, (x, y, s) in enumerate(((2.6, 25.0, (0.9, 0.7, 0.55)), (3.4, 26.2, (0.5, 0.45, 0.35)), (-4.6, 27.8, (0.7, 0.6, 0.5)), (-5.2, 21.4, (0.45, 0.4, 0.3)), (4.8, 21.0, (0.6, 0.5, 0.4)), (0.6, 28.8, (0.4, 0.38, 0.3)))):
        o.append(boulder("stone", (x, y, 0.05), s, i * 1.7 + 0.3, M["rock"]))
    for i in range(7):
        t = i / 6; x = -0.2 + 0.9 * math.sin(t * 2.2); y = GY0 + 0.6 + t * 3.0
        o.append(lib.cyl("stepping stone", 0.28 + 0.05 * (i % 2), 0.06, (x, y, 0.02), M["slate"], verts=12, smooth=False, bevel=0.01))
    maple("maple", (-2.0, 28.2, 0.12), 77, M, height=4.6)
    leaf = bpy.data.objects.get("boxwood leaf") or atrium.leaf_object("boxwood leaf", 0.026, 0.013, M["boxwood"])
    for i, (x, y, r) in enumerate(((4.6, 28.8, 0.55), (5.6, 27.6, 0.4), (-5.6, 24.2, 0.5), (-6.0, 25.3, 0.35), (5.2, 23.4, 0.45), (-4.0, 20.6, 0.42), (3.6, 20.4, 0.38), (6.0, 29.9, 0.32))):
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r)
        for v in bm.verts: v.co.z = max(v.co.z, -r * 0.2)
        ball = lib.mesh_obj("box ball", bm, M["boxwood_core"], smooth=True); ball.location = (x, y, r * 0.75)
        gn = ball.modifiers.new("leaves", "NODES"); gn.node_group = atrium.hedge_nodes("box ball leaves", leaf, 5200, 40 + i)
        core = ball.copy(); core.data = ball.data; core.modifiers.clear(); lib.link(core); dm = core.modifiers.new("shrink", "DISPLACE"); dm.mid_level = 0.0; dm.strength = -0.03
    # the bedroom (+x): the bed against the outer wall, facing the garden
    bx = 15.5 - 0.32 - 1.075
    bed.bed("bed", (bx, 23.6, 0.0), math.radians(-90), M)
    for dy in (-1.55, 1.55):
        o.append(lib.box("nightstand", (0.5, 0.55, 0.5), (15.22, 23.6 + dy, 0.25), M["walnut"], bevel=0.008))
        furn.table_lamp("bedside lamp", (15.22, 23.6 + dy, 0.5), M, watts=30, shade_r=0.17)
    o.append(furn.rug("bedroom rug", (4.4, 5.0), (bx - 0.9, 23.6), M))
    o.append(lib.box("bed bench", (0.45, 1.6, 0.45), (bx - 1.6, 23.6, 0.225), M["bed_fabric"], bevel=0.03, segs=4))
    ch = lib.import_glb(os.path.join(lib.ASSETS, "SheenChair.glb"), (8.6, 21.0, 0.0), math.radians(130), name="bedroom chair")
    lib.import_glb(os.path.join(lib.ASSETS, "SpecularSilkPouf.glb"), (9.3, 20.2, 0.0), 0.4, 1.0, name="bedroom pouf")
    pl = lib.import_glb(os.path.join(lib.ASSETS, "DiffuseTransmissionPlant.glb"), (8.2, 26.9, 0.0), 0.4, 1.6, name="bedroom plant")
    p6 = furn.painting_material("painting dawn", (0.62, 0.55, 0.46), [(0.08, 0.92, 0.58, 0.92, (0.72, 0.52, 0.36)), (0.08, 0.92, 0.08, 0.52, (0.50, 0.40, 0.33))])
    furn.painting("painting", 2.4, 1.6, (15.45, 23.6, 2.55), math.radians(-90), p6, M["frame"])
    # the bath (-x): a freestanding tub facing the garden, a long stone vanity
    tub_prof = [(0.0, 0.05), (0.55, 0.05), (0.78, 0.25), (0.86, 0.55), (0.84, 0.6), (0.76, 0.6), (0.74, 0.3), (0.5, 0.18), (0.0, 0.18)]
    tub = furn.lathe("tub", tub_prof, M["tub"], 64, (-10.2, 25.2, 0.0)); tub.scale = (1.0, 0.52, 1.0); tub.rotation_euler = (0, 0, math.radians(90)); o.append(tub)
    wt = lib.cyl("tub water", 0.73, 0.02, (-10.2, 25.2, 0.45), M["bath_water"], verts=64); wt.scale = (1.0, 0.52, 1.0); wt.rotation_euler = (0, 0, math.radians(90)); o.append(wt)
    o.append(lib.box("vanity", (0.6, 3.2, 0.12), (-15.2, 23.6, 0.86), M["marble"], bevel=0.006))
    o.append(lib.box("vanity body", (0.55, 3.1, 0.5), (-15.22, 23.6, 0.55), M["walnut"], bevel=0.006))
    for dy in (-0.8, 0.8):
        o.append(lib.box("mirror", (0.02, 1.0, 1.3), (-15.48, 23.6 + dy, 1.75), P("mirror", (0.9, 0.9, 0.9), 0.02, 1.0)))
    o.append(furn.rug("bath rug", (1.0, 1.8), (-11.5, 25.2), M))
    o.append(lib.box("bath stone floor", (8.2, 9.3, 0.02), (-11.45, 23.0, 0.01), M["breast"]))
    pl2 = lib.instance_of(pl, (-8.2, 26.9, 0.0), 1.2, 1.5)
    # lights in the suite's rooms
    for sgn in (-1, 1):
        for y in (20.6, 23.6, 26.6):
            for x in (G + 2.0, G + 5.6):
                lib.spot_light("downlight", (sgn * x, y, HB - 0.02), 35, (1.0, 0.80, 0.60), 0.02, 75, 0.6)
    return o
