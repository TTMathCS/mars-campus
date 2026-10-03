"""The street behind the family room and the master suite down across it, in ring B of L1 (the family room's frame:
x along the atrium glass, y into the house, z up from L1's floor).

The street runs from y = 14.1 to 17.9, 8 m tall and lit from above. Across it the suite: a moss garden open to the
sky in the middle (x within 7 m of the middle, 8 m tall) with a pond, stones, a stone lantern, a water basin and a
maple; the bedroom on its +x side and the bath on its -x side, each with a glass wall onto the garden."""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, noise
import lib, furn, atrium, bed

S0, S1 = 14.12, 17.92        # the street
B0, B1 = 18.12, 31.92        # ring B
G = 7.0                      # half the garden's width
GY0, GY1 = 19.6, 30.6        # the garden's extent in y
HB = 4.0                     # the suite's rooms' ceiling
TOP = 8.0                    # L1's roof
POND = (-1.3, 25.3, 2.5, 1.4)    # the pond: centre x, y and half-sizes


def moss_material():
    """moss: cushions of many greens, yellow-green where the light catches the tips, velvety, a fibrous bump"""
    m, nt = lib._mat("moss")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.9; b.inputs["Sheen Weight"].default_value = 1.0; b.inputs["Sheen Roughness"].default_value = 0.35
    b.inputs["Sheen Tint"].default_value = (0.75, 0.95, 0.45, 1)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 1.1; n.inputs["Detail"].default_value = 6; n.inputs["Roughness"].default_value = 0.6; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.3; E[0].color = (0.016, 0.038, 0.009, 1); E[1].position = 0.75; E[1].color = (0.10, 0.15, 0.03, 1)
    e = E.new(0.5); e.color = (0.04, 0.085, 0.016, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"])
    n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 9; n2.inputs["Detail"].default_value = 4; L.new(tc.outputs["Object"], n2.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0
    L.new(cr.outputs["Color"], mx.inputs[6])
    v = nt.nodes.new("ShaderNodeMapRange"); v.inputs["To Min"].default_value = 0.7; v.inputs["To Max"].default_value = 1.35; L.new(n2.outputs["Fac"], v.inputs["Value"])
    cmb = nt.nodes.new("ShaderNodeCombineXYZ"); L.new(v.outputs["Result"], cmb.inputs[0]); L.new(v.outputs["Result"], cmb.inputs[1]); L.new(v.outputs["Result"], cmb.inputs[2])
    L.new(cmb.outputs[0], mx.inputs[7]); L.new(mx.outputs[2], b.inputs["Base Color"])
    f = nt.nodes.new("ShaderNodeTexVoronoi"); f.inputs["Scale"].default_value = 420; L.new(tc.outputs["Object"], f.inputs["Vector"])
    c = nt.nodes.new("ShaderNodeTexNoise"); c.inputs["Scale"].default_value = 30; c.inputs["Detail"].default_value = 3; L.new(tc.outputs["Object"], c.inputs["Vector"])
    h = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", f.outputs["Distance"], 0.6), lib._math(nt, "MULTIPLY", c.outputs["Fac"], 0.8))
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.85; bm.inputs["Distance"].default_value = 0.004; L.new(h, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def rock_material(name="rock", dark=(0.10, 0.10, 0.095), light=(0.30, 0.29, 0.27), lichen=True):
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.85
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 4; n.inputs["Detail"].default_value = 12; n.inputs["Roughness"].default_value = 0.65; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (*dark, 1); cr.color_ramp.elements[1].color = (*light, 1)
    L.new(n.outputs["Fac"], cr.inputs["Fac"])
    out = cr.outputs["Color"]
    if lichen:
        li = nt.nodes.new("ShaderNodeTexNoise"); li.inputs["Scale"].default_value = 9; L.new(tc.outputs["Object"], li.inputs["Vector"])
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", lib._math(nt, "GREATER_THAN", li.outputs["Fac"], 0.6), 0.75), mx.inputs["Factor"]); L.new(out, mx.inputs[6]); mx.inputs[7].default_value = (0.07, 0.12, 0.03, 1)
        out = mx.outputs[2]
    L.new(out, b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.5; L.new(n.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def still_water():
    """the pond's surface: the camera and reflections see water; light passes through, so its dark bed shows"""
    m = lib.glass("pond water", (0.70, 0.76, 0.66), 0.0, 1.33); nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.4, 0.4, 0.4); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    t = lib._tex(nt, os.path.join(lib.ASSETS, "waternormals.jpg"), "Non-Color"); L.new(mp.outputs["Vector"], t.inputs["Vector"])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.06; L.new(t.outputs["Color"], nm.inputs["Color"]); L.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def pond_bed():
    """the pond's bed: dark silt and pebbles"""
    m, nt = lib._mat("pond bed")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.7
    tc = nt.nodes.new("ShaderNodeTexCoord"); v = nt.nodes.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 18; L.new(tc.outputs["Object"], v.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (0.012, 0.014, 0.010, 1); cr.color_ramp.elements[1].color = (0.06, 0.055, 0.045, 1)
    L.new(v.outputs["Color"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.6; L.new(lib._math(nt, "SUBTRACT", 1.0, v.outputs["Distance"]), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def gravel_material():
    m, nt = lib._mat("gravel")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.8
    tc = nt.nodes.new("ShaderNodeTexCoord"); v = nt.nodes.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 70; L.new(tc.outputs["Object"], v.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (0.42, 0.41, 0.38, 1); cr.color_ramp.elements[1].color = (0.70, 0.68, 0.63, 1)
    L.new(v.outputs["Color"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.9; bm.inputs["Distance"].default_value = 0.006
    L.new(lib._math(nt, "POWER", lib._math(nt, "SUBTRACT", 1.0, v.outputs["Distance"]), 0.5), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def boulder(name, loc, size, seed, mat):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
    for v in bm.verts:
        c = v.co; d = 1 + 0.28 * noise.noise(c * 1.3 + Vector((seed, 0, 0))) + 0.08 * noise.noise(c * 4.0 + Vector((0, seed, 0)))
        v.co = Vector((c.x * size[0] * d, c.y * size[1] * d, max(c.z, -0.35) * size[2] * d))
    o = lib.mesh_obj(name, bm, mat, smooth=True); o.location = loc; o.rotation_euler = (0, 0, seed); return o


def pond_e(x, y):
    """how far (x, y) is from the pond's middle, 1 on its edge; the edge wanders a little"""
    cx, cy, rx, ry = POND; dx, dy = (x - cx) / rx, (y - cy) / ry; a = math.atan2(dy, dx)
    return math.hypot(dx, dy) / (1.0 + 0.10 * noise.noise(Vector((math.cos(a) * 1.4, math.sin(a) * 1.4, 0.5))))


def moss_ground(name, x0, x1, y0, y1, z0, mats, seed=3):
    """undulating cushions of moss; it dips into the pond as its bed"""
    step = 0.1; nx, ny = int((x1 - x0) / step), int((y1 - y0) / step)
    bm = bmesh.new(); vs = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; y = y0 + (y1 - y0) * j / ny
            h = 0.30 * max(0.0, noise.noise(Vector((x * 0.32 + seed, y * 0.32, 0)))) + 0.06 * noise.noise(Vector((x * 1.4, y * 1.4 + seed, 0)))
            ex = min(x - x0, x1 - x, y - y0, y1 - y); h *= min(1.0, ex / 0.6)
            e = pond_e(x, y)
            if e < 1.0: h = -0.32 * min(1.0, (1.0 - e) / 0.35) - 0.03
            else: h = h * min(1.0, (e - 1.0) / 0.5) + 0.02 * (1 - min(1.0, (e - 1.0) / 0.5))
            row.append(bm.verts.new((x, y, z0 + 0.05 + h)))
        vs.append(row)
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
            c = f.calc_center_median(); f.material_index = 1 if pond_e(c.x, c.y) < 1.03 else 0
    o = lib.mesh_obj(name, bm, mats, smooth=True)
    sub = o.modifiers.new("sub", "SUBSURF"); sub.levels = 0; sub.render_levels = 2
    tex = bpy.data.textures.new("moss cushions", "CLOUDS"); tex.noise_scale = 0.07; tex.noise_depth = 2
    d = o.modifiers.new("cushions", "DISPLACE"); d.texture = tex; d.strength = 0.04; d.mid_level = 0.5; d.direction = "Z"; d.texture_coords = "GLOBAL"
    return o


def pond(M, rnd):
    cx, cy, rx, ry = POND; bm = bmesh.new(); pts = []
    for i in range(96):
        a = 2 * math.pi * i / 96; x, y = cx + rx * math.cos(a) * 1.12, cy + ry * math.sin(a) * 1.12
        pts.append(bm.verts.new((x, y, 0.035)))
    bm.faces.new(pts)
    lib.mesh_obj("pond water", bm, M["pond_water"])
    # stones round the edge, some half in the water
    for i in range(14):
        a = 2 * math.pi * (i + rnd.uniform(-0.3, 0.3)) / 14
        r = 1.0 + rnd.uniform(-0.05, 0.12); s = rnd.uniform(0.18, 0.42)
        boulder("pond stone", (cx + rx * r * math.cos(a), cy + ry * r * math.sin(a), 0.0), (s, s * rnd.uniform(0.7, 1.0), s * 0.45), i * 2.3 + 1.1, M["rock"])
    # maple leaves floating on it
    leaf = maple_leaf_object(M)
    for i in range(30):
        a = rnd.uniform(0, 2 * math.pi); r = math.sqrt(rnd.random()) * 0.92
        lf = leaf.copy(); lib.link(lf); lf.location = (cx + rx * r * math.cos(a), cy + ry * r * math.sin(a), 0.037); lf.rotation_euler = (0, 0, rnd.uniform(0, 6.3)); s = rnd.uniform(0.7, 1.2); lf.scale = (s, s, s)


def maple_leaf_object(M):
    """a five-lobed maple leaf lying flat"""
    o = bpy.data.objects.get("fallen maple leaf")
    if o: return o
    bm = bmesh.new(); c = bm.verts.new((0, 0, 0.002)); ring = []
    n = 40
    for i in range(n):
        a = 2 * math.pi * i / n; lobe = 0.55 + 0.45 * abs(math.cos(2.5 * a)) ** 0.6
        r = 0.032 * lobe * (0.75 if math.sin(a) < -0.6 else 1.0)
        ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), 0.004 * (r / 0.032) ** 2)))
    for i in range(n): bm.faces.new((c, ring[i], ring[(i + 1) % n]))
    o = lib.mesh_obj("fallen maple leaf", bm, M["maple_leaf"], smooth=True); o.location = (0, 0, -500)
    return o


def lantern(name, loc, M):
    """a stone lantern (a kasuga-doro): a hexagonal base, a post, a firebox with a soft light in it, a roof with
    curled eaves, a jewel on top"""
    P = furn.empty(name, loc); st = M["granite"]; parts = []
    parts.append(lib.cyl(name + " base", 0.30, 0.12, (0, 0, 0), st, verts=6, smooth=False, bevel=0.01))
    parts.append(furn.lathe(name + " post", [(0.0, 0.12), (0.10, 0.12), (0.085, 0.4), (0.085, 0.62), (0.10, 0.72), (0.0, 0.72)], st, 24))
    parts.append(lib.cyl(name + " platform", 0.27, 0.11, (0, 0, 0.72), st, verts=6, smooth=False, bevel=0.01))
    parts.append(lib.cyl(name + " firebox", 0.19, 0.30, (0, 0, 0.83), st, verts=6, smooth=False))
    glow = lib.emission("lantern glow", (1.0, 0.62, 0.30), 8.0)
    for k in range(6):
        a = math.radians(30 + 60 * k); w = lib.box(name + " window", (0.12, 0.01, 0.14), (0.165 * math.cos(a), 0.165 * math.sin(a), 0.98), glow); w.rotation_euler = (0, 0, a + math.pi / 2); parts.append(w)
    parts.append(lib.point_light(name + " light", (0, 0, 0.98), 6, (1.0, 0.62, 0.30), 0.05))
    parts.append(furn.lathe(name + " roof", [(0.0, 1.13), (0.46, 1.13), (0.48, 1.16), (0.40, 1.17), (0.22, 1.26), (0.08, 1.33), (0.0, 1.34)], st, 6, smooth=False))
    parts.append(furn.lathe(name + " jewel", [(0.0, 1.33), (0.06, 1.35), (0.075, 1.40), (0.05, 1.46), (0.012, 1.50), (0.0, 1.51)], st, 16))
    for o in parts: o.parent = P
    return P


def basin(name, loc, M):
    """a stone water basin (tsukubai) fed by a bamboo spout"""
    P = furn.empty(name, loc); st = M["granite"]; parts = []
    parts.append(furn.lathe(name + " stone", [(0.0, 0.0), (0.30, 0.0), (0.34, 0.12), (0.33, 0.30), (0.30, 0.34), (0.17, 0.34), (0.16, 0.26), (0.0, 0.22)], st, 40))
    parts.append(lib.cyl(name + " water", 0.165, 0.002, (0, 0, 0.30), M["pond_water"], verts=40))
    bamboo = lib.principled("bamboo", (0.42, 0.40, 0.18), 0.4, **{"Coat Weight": 0.3})
    sp = lib.cyl(name + " spout", 0.022, 0.88, (0.95, 0.0, 0.62), bamboo, verts=16, rot=(0, math.radians(-96), 0)); parts.append(sp)
    for (x, h) in ((0.6, 0.56), (0.9, 0.59)): parts.append(lib.cyl(name + " post", 0.03, h, (x, 0.0, 0.0), bamboo, verts=16))
    for o in parts: o.parent = P
    return P


def maple(name, loc, seed, M, height=4.2):
    """a Japanese maple: the olive's branching, wider, with small red leaves"""
    w, lp = furn.olive_tree(name, loc, seed, M, height=height, leaves=26000)
    md = lp.modifiers[0]
    ng = bpy.data.node_groups.get("maple leaves")
    if ng is None:
        ng = md.node_group.copy(); ng.name = "maple leaves"
        leaf = atrium.leaf_object("maple leaf", 0.05, 0.042, M["maple_leaf"])
        for n in ng.nodes:
            if n.bl_idname == "GeometryNodeObjectInfo": n.inputs["Object"].default_value = leaf
    md.node_group = ng
    return w, lp


def clump(name, loc, r, leaf, M, seed):
    """a low clump of leaves (ferns, hostas) on a small dome"""
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r)
    for v in bm.verts: v.co.z = max(v.co.z, -r * 0.1) * 0.7
    o = lib.mesh_obj(name, bm, M["boxwood_core"], smooth=True); o.location = loc
    gn = o.modifiers.new("leaves", "NODES"); gn.node_group = atrium.hedge_nodes(name + " leaves %d" % seed, leaf, 900, seed, depth=0.08, smin=0.8, smax=1.6)
    return o


def garden(M, rnd):
    moss_ground("moss", -G + 0.62, G - 0.62, GY0 + 0.62, GY1 - 0.05, -0.04, [M["moss"], M["pond_bed"]])
    pond(M, rnd)
    # a strip of grey gravel along the glass on each side and along the gallery
    for sgn in (-1, 1):
        lib.box("gravel", (0.6, GY1 - GY0, 0.08), (sgn * (G - 0.3), (GY0 + GY1) / 2, 0.0), M["gravel"])
    lib.box("gravel", (2 * G - 1.2, 0.6, 0.08), (0, GY0 + 0.3, 0.0), M["gravel"])
    for (sx, sy, px, py) in ((2 * G + 0.5, 0.25, 0, GY0 - 0.1), (2 * G + 0.5, 0.25, 0, GY1 + 0.1), (0.25, GY1 - GY0, -G - 0.1, (GY0 + GY1) / 2), (0.25, GY1 - GY0, G + 0.1, (GY0 + GY1) / 2)):
        lib.box("garden curb", (sx, sy, 0.12), (px, py, 0.06), M["travertine"], bevel=0.008)
    for i, (x, y, s) in enumerate(((2.6, 25.6, (0.9, 0.7, 0.55)), (3.3, 26.6, (0.5, 0.45, 0.35)), (-4.9, 28.2, (0.7, 0.6, 0.5)), (-5.0, 21.6, (0.45, 0.4, 0.3)), (4.7, 21.4, (0.6, 0.5, 0.4)), (0.6, 29.2, (0.4, 0.38, 0.3)))):
        boulder("stone", (x, y, 0.05), s, i * 1.7 + 0.3, M["rock"])
    # stepping stones from the gallery round the pond
    for i in range(9):
        t = i / 8; x = 1.2 + 1.6 * math.sin(t * 2.6); y = GY0 + 0.9 + t * 4.4
        boulder("stepping stone", (x, y, 0.02), (0.30 + 0.05 * (i % 2), 0.26, 0.07), i * 3.1 + 0.7, M["slate_rock"])
    w, lp = maple("maple", (-2.2, 28.4, 0.12), 77, M, height=5.2)
    w.data.materials.clear(); w.data.materials.append(lib.wood("maple bark", (0.10, 0.09, 0.08), (0.05, 0.045, 0.04), 0.85, scale=3.0, coat=0.0, along="Z"))
    leaf = maple_leaf_object(M)
    for i in range(70):        # fallen leaves under the maple
        a = rnd.uniform(0, 6.28); r = rnd.uniform(0.2, 2.6)
        x, y = -2.2 + r * math.cos(a), 28.4 + r * math.sin(a) * 0.8
        if pond_e(x, y) < 1.1 or not (-G + 0.7 < x < G - 0.7 and GY0 + 0.7 < y < GY1 - 0.1): continue
        lf = leaf.copy(); lib.link(lf); lf.location = (x, y, 0.42); lf.rotation_euler = (rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), rnd.uniform(0, 6.3))
        lf["drop"] = 1
    lantern("lantern", (4.4, 28.3, 0.08), M)
    basin("basin", (-4.3, 23.0, 0.04), M)
    bleaf = bpy.data.objects.get("boxwood leaf") or atrium.leaf_object("boxwood leaf", 0.026, 0.013, M["boxwood"])
    for i, (x, y, r) in enumerate(((5.6, 27.4, 0.42), (-5.7, 24.6, 0.48), (5.3, 23.4, 0.4), (-4.2, 20.9, 0.4), (6.0, 29.8, 0.32))):
        bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r)
        for v in bm.verts: v.co.z = max(v.co.z, -r * 0.2)
        ball = lib.mesh_obj("box ball", bm, M["boxwood_core"], smooth=True); ball.location = (x, y, r * 0.75)
        gn = ball.modifiers.new("leaves", "NODES"); gn.node_group = atrium.hedge_nodes("box ball leaves", bleaf, 5200, 40 + i)
    fern = atrium.leaf_object("fern frond", 0.30, 0.07, M["fern"])
    for i, (x, y, r) in enumerate(((3.9, 27.5, 0.32), (5.0, 28.9, 0.28), (-3.6, 22.4, 0.3), (-5.4, 27.4, 0.3), (2.0, 24.7, 0.26), (-0.3, 29.7, 0.3))):
        clump("fern", (x, y, 0.08), r, fern, M, 90 + i)


def drop_leaves():
    """settle the fallen leaves onto whatever is below them (the moss, a stone)"""
    leaves = [o for o in bpy.data.objects if o.get("drop")]
    for o in leaves: o.hide_viewport = True
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); sc = bpy.context.scene
    for o in leaves:
        hit, loc, nrm, idx, ob, mtx = sc.ray_cast(dg, Vector((o.location.x, o.location.y, 1.5)), Vector((0, 0, -1)))
        if hit: o.location.z = loc.z + 0.012
    for o in leaves: o.hide_viewport = False


def headboard_material():
    return lib.fabric("headboard", (0.36, 0.31, 0.26), 0.9, 0.5, 700, 0.3)


def bedroom(M, rnd):
    x1 = 15.5                                         # the end wall's face
    bx = x1 - 0.32 - 1.075
    # the wall behind the bed: an upholstered panel in vertical channels, the painting over it
    hb = headboard_material()
    for k in range(14):
        y = 21.45 + 0.3 * k + 0.15
        lib.box("headboard panel", (0.08, 0.29, 2.4), (x1 - 0.04, y, 1.2), hb, bevel=0.03, segs=4)
    bed.bed("bed", (bx, 23.6, 0.0), math.radians(-90), M)
    for dy in (-1.55, 1.55):
        lib.box("nightstand", (0.5, 0.55, 0.5), (x1 - 0.36, 23.6 + dy, 0.25), M["walnut"], bevel=0.008)
        furn.table_lamp("bedside lamp", (x1 - 0.36, 23.6 + dy, 0.5), M, watts=30, shade_r=0.17)
        lib.box("bedside book", (0.16, 0.22, 0.03), (x1 - 0.42, 23.6 + dy - 0.06, 0.515), M["cloth"], bevel=0.003, rot_z=0.3)
    furn.rug("bedroom rug", (4.4, 5.2), (bx - 0.9, 23.6), M)
    lib.box("bed bench", (0.45, 1.6, 0.45), (bx - 1.6, 23.6, 0.225), M["bed_fabric"], bevel=0.03, segs=4)
    p6 = furn.painting_material("painting dawn", (0.62, 0.55, 0.46), [(0.08, 0.92, 0.58, 0.92, (0.72, 0.52, 0.36)), (0.08, 0.92, 0.08, 0.52, (0.50, 0.40, 0.33))])
    furn.painting("painting", 2.2, 1.2, (x1 - 0.1, 23.6, 3.1), math.radians(-90), p6, M["frame"])
    # sheer curtains at the garden glass, drawn to either side
    f = Matrix.Translation((G + 0.42, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Z")
    furn.sheer_curtain("curtain", GY0 + 0.1, GY0 + 1.9, 0.02, HB - 0.08, M["sheer"], frame=f)
    furn.sheer_curtain("curtain", 26.0, 27.55, 0.02, HB - 0.08, M["sheer"], frame=f)
    lib.box("curtain track", (0.06, 27.6 - GY0, 0.05), (G + 0.42, (GY0 + 27.6) / 2, HB - 0.05), M["bronze_dark"])
    # a corner to sit in by the garden; a reading chair by the gallery
    ch = lib.import_glb(os.path.join(lib.ASSETS, "SheenChair.glb"), (8.9, 25.5, 0.0), math.radians(-100), name="bedroom chair")
    lib.instance_of(ch, (8.9, 26.9, 0.0), math.radians(-80), name="bedroom chair 2")
    furn.side_table("side table", (8.75, 26.2, 0.0), M, r=0.25, h=0.5)
    furn.floor_lamp("floor lamp", (9.8, 27.25, 0.0), M, watts=50)
    furn.rug("sitting rug", (2.2, 2.6), (9.0, 26.2), M)
    lib.import_glb(os.path.join(lib.ASSETS, "SpecularSilkPouf.glb"), (9.3, 20.4, 0.0), 0.4, 1.0, name="bedroom pouf")
    pl = lib.import_glb(os.path.join(lib.ASSETS, "DiffuseTransmissionPlant.glb"), (14.9, 27.1, 0.0), 0.4, 1.7, name="bedroom plant")
    # a dresser on the back wall with a round mirror
    lib.box("dresser", (2.0, 0.5, 0.8), (12.0, 27.3, 0.42), M["walnut"], bevel=0.008)
    for k in range(4): lib.box("dresser drawer line", (2.0, 0.005, 0.006), (12.0, 27.048, 0.2 + k * 0.2), M["shadow"])
    lib.cyl("dresser mirror", 0.5, 0.02, (12.0, 27.58, 1.75), lib.principled("mirror", (0.9, 0.9, 0.9), 0.02, 1.0), verts=64, rot=(math.pi / 2, 0, 0))
    lib.cyl("dresser mirror rim", 0.52, 0.015, (12.0, 27.59, 1.75), M["brass"], verts=64, rot=(math.pi / 2, 0, 0))
    furn.ornament("dresser vase", 11.4, 27.3, 0.82, 0.4, random.Random(5), M["ceramics"])
    # warm light: a cove round the ceiling, downlights, the lamps
    cove = lib.emission("cove glow", (1.0, 0.78, 0.55), 5)
    lib.box("cove", (x1 - G - 0.6, 0.04, 0.03), ((G + x1) / 2 + 0.2, 27.55, HB - 0.12), cove)
    lib.box("cove", (0.04, 27.4 - B0 - 0.4, 0.03), (x1 - 0.12, (B0 + 27.4) / 2 + 0.1, HB - 0.12), cove)
    for y in (20.6, 23.6, 26.6):
        for x in (G + 2.2, G + 5.4):
            lib.cyl("downlight trim", 0.05, 0.012, (x, y, HB - 0.012), M["bronze_dark"], verts=24)
            lib.spot_light("downlight", (x, y, HB - 0.03), 30, (1.0, 0.80, 0.60), 0.02, 75, 0.6)


def bath(M, rnd):
    x1 = -15.5
    # walls of travertine slabs, floor of the same
    lib.box("bath end wall", (0.05, 27.6 - B0, HB), (x1 + 0.03, (B0 + 27.6) / 2, HB / 2), M["oak_panel"])
    lib.box("bath back wall", (8.3, 0.05, HB), (-(G + 0.25 + 4.15), 27.57, HB / 2), M["oak_panel"])
    lib.box("bath floor", (8.2, 9.4, 0.02), (-11.45, (B0 + 27.6) / 2, 0.01), M["bath_stone"])
    # the tub by the glass, looking at the garden
    tub_prof = [(0.0, 0.05), (0.55, 0.05), (0.78, 0.25), (0.86, 0.55), (0.84, 0.6), (0.76, 0.6), (0.74, 0.3), (0.5, 0.18), (0.0, 0.18)]
    tub = furn.lathe("tub", tub_prof, M["tub"], 64, (-8.9, 24.6, 0.0)); tub.scale = (1.0, 0.52, 1.0); tub.rotation_euler = (0, 0, math.radians(90))
    wt = lib.cyl("tub water", 0.73, 0.02, (-8.9, 24.6, 0.45), M["bath_water"], verts=64); wt.scale = (1.0, 0.52, 1.0); wt.rotation_euler = (0, 0, math.radians(90))
    tap = lib.cyl("tub tap", 0.02, 1.0, (-9.55, 24.6, 0.0), M["brass"], verts=16)
    sp = lib.cyl("tub spout", 0.016, 0.3, (-9.55, 24.6, 0.98), M["brass"], verts=16, rot=(0, math.radians(90), 0))
    lib.cyl("bath stool", 0.2, 0.45, (-9.3, 23.2, 0.0), M["walnut"], verts=32, bevel=0.01)
    for k in range(3): lib.box("towel", (0.36, 0.28, 0.05), (-9.3, 23.2, 0.47 + 0.052 * k), M["towel"], bevel=0.02, rot_z=0.1 * k)
    # the wall behind the vanity in dark green marble, washed by two grazers
    lib.box("vanity wall", (0.04, 4.6, HB - 0.02), (x1 + 0.07, 23.6, HB / 2), M["verde"])
    for dy in (-1.6, 1.6):
        sp = lib.spot_light("grazer", (x1 + 0.45, 23.6 + dy, HB - 0.05), 60, (1.0, 0.82, 0.62), 0.03, 50, 0.7); sp.rotation_euler = (0, math.radians(-14), 0)
    # a long stone bench on the back wall, towels and a plant on it
    lib.box("bath bench", (4.4, 0.5, 0.45), (-10.4, 27.3, 0.225), M["bath_stone"], bevel=0.01)
    for (x, n) in ((-11.8, 4), (-11.3, 3)):
        for k in range(n): lib.box("towel", (0.4, 0.3, 0.05), (x, 27.3, 0.47 + 0.052 * k), M["towel"], bevel=0.02, rot_z=0.03 * k)
    furn.ornament("bath vase", -9.2, 27.3, 0.45, 0.5, random.Random(8), M["ceramics"])
    furn.rug("vanity rug", (0.9, 2.6), (x1 + 1.3, 23.6), M)
    # the double vanity: walnut, marble, two stone basins, brass taps, round mirrors lit from behind
    lib.box("vanity", (0.6, 3.2, 0.06), (x1 + 0.32, 23.6, 0.86), M["marble"], bevel=0.006)
    lib.box("vanity body", (0.55, 3.1, 0.42), (x1 + 0.3, 23.6, 0.62), M["walnut"], bevel=0.006)
    glow = lib.emission("mirror glow", (1.0, 0.82, 0.62), 10)
    for dy in (-0.8, 0.8):
        furn.lathe("basin", [(0.0, 0.89), (0.15, 0.89), (0.20, 0.95), (0.21, 1.03), (0.19, 1.03), (0.17, 0.97), (0.0, 0.94)], M["tub"], 48, (x1 + 0.36, 23.6 + dy, 0.0))
        lib.cyl("vanity tap", 0.012, 0.32, (x1 + 0.08, 23.6 + dy, 0.89), M["brass"], verts=12)
        lib.cyl("vanity spout", 0.01, 0.16, (x1 + 0.08, 23.6 + dy, 1.2), M["brass"], verts=12, rot=(0, math.radians(90), 0))
        lib.cyl("mirror", 0.42, 0.02, (x1 + 0.12, 23.6 + dy, 1.75), lib.principled("mirror", (0.9, 0.9, 0.9), 0.02, 1.0), verts=64, rot=(0, math.radians(90), 0))
        lib.cyl("mirror glow", 0.45, 0.01, (x1 + 0.10, 23.6 + dy, 1.75), glow, verts=64, rot=(0, math.radians(90), 0))
    # the shower in the far corner: a glass screen in a brass frame, a rain head, a slatted teak floor
    sx0, sy0 = x1 + 2.6, 25.8
    lib.box("shower glass", (0.012, 27.55 - sy0, 2.3), (sx0, (sy0 + 27.55) / 2, 1.17), M["glass"])
    for z in (0.02, 2.32): lib.box("shower frame", (0.03, 27.55 - sy0, 0.03), (sx0, (sy0 + 27.55) / 2, z), M["brass"])
    lib.box("shower frame", (0.03, 0.03, 2.3), (sx0, sy0, 1.17), M["brass"])
    lib.box("rain head", (0.36, 0.36, 0.02), ((x1 + sx0) / 2, (sy0 + 27.55) / 2, 2.6), M["brass"], bevel=0.005)
    lib.cyl("rain arm", 0.01, HB - 2.61, ((x1 + sx0) / 2, (sy0 + 27.55) / 2, 2.61), M["brass"], verts=12)
    for k in range(9): lib.box("teak slat", (2.2, 0.08, 0.025), ((x1 + sx0) / 2, sy0 + 0.25 + k * 0.17, 0.035), M["teak"], bevel=0.004)
    lib.box("towel rail", (0.03, 0.03, 1.4), (x1 + 0.06, 25.3, 0.95), M["brass"])
    for k in range(2): lib.box("hanging towel", (0.05, 0.45, 0.7), (x1 + 0.1, 25.3 + (k - 0.5) * 0.5, 1.1), M["towel"], bevel=0.02)
    lib.instance_of(bpy.data.objects["bedroom plant"], (-7.9, 26.9, 0.0), 1.2, 1.6)
    lib.instance_of(bpy.data.objects["bedroom plant"], (-14.9, 20.0, 0.0), 2.4, 1.4)
    furn.rug("bath rug", (0.9, 1.6), (-10.3, 24.6), M)
    for y in (20.6, 23.6, 26.6):
        for x in (G + 2.2, G + 5.4):
            lib.cyl("downlight trim", 0.05, 0.012, (-x, y, HB - 0.012), M["bronze_dark"], verts=24)
            lib.spot_light("downlight", (-x, y, HB - 0.03), 30, (1.0, 0.80, 0.60), 0.02, 75, 0.6)



def kitchen(M, rnd):
    """the kitchen (L1-10), on the suite's +x side beyond the bedroom, across the street from the dining room: counters
    and open shelves along the back wall, tall units at the end, an island to breakfast at, and the robot that cooks on
    its rail over the counters (Jim can cook too)"""
    x0, x1 = 15.8, 29.85; yc = (B0 + B1) / 2
    lib.box("kitchen ceiling", (x1 + 0.3 - x0, B1 - B0, 0.3), ((x0 + x1 + 0.3) / 2, yc, HB + 0.149), M["ceiling"])     # a millimetre under the bedroom's, which reaches over it
    lib.box("kitchen end wall", (0.3, B1 - B0, HB + 0.3), (x1 + 0.15, yc, (HB + 0.3) / 2), M["plaster"])
    lib.box("kitchen door", (1.1, 0.06, 2.8), (18.6, B0 + 0.2, 1.4), M["walnut_v"], bevel=0.003)
    lib.box("kitchen door pull", (0.03, 0.04, 1.0), (18.2, B0 + 0.25, 1.2), M["brass"], bevel=0.006)
    stone = M["marble"]; robot = lib.principled("robot white", (0.82, 0.82, 0.80), 0.3, **{"Coat Weight": 0.4}); joint = lib.principled("robot joint", (0.05, 0.05, 0.055), 0.4)
    # the back wall: base cabinets, a stone top, a splashback of travertine, two open shelves of crockery and jars
    cx0, cx1 = 17.0, 28.4; cw = cx1 - cx0; cm = (cx0 + cx1) / 2; yb = B1 - 0.01
    lib.box("base cabinets", (cw, 0.62, 0.86), (cm, yb - 0.31, 0.43), M["walnut"], bevel=0.004)
    for k in range(int(cw / 0.6)):
        lib.box("cabinet line", (0.004, 0.006, 0.8), (cx0 + 0.6 * (k + 1), yb - 0.625, 0.45), M["shadow"])
    lib.box("worktop", (cw + 0.04, 0.66, 0.04), (cm, yb - 0.33, 0.88), stone, bevel=0.003)
    lib.box("splashback", (cw, 0.02, 0.62), (cm, yb - 0.01, 1.21), M["travertine"])
    lib.box("hob", (0.8, 0.52, 0.006), (21.6, yb - 0.32, 0.903), lib.principled("hob glass", (0.01, 0.01, 0.012), 0.08, **{"Coat Weight": 1.0}))
    lib.box("sink", (0.75, 0.42, 0.02), (25.2, yb - 0.33, 0.895), lib.principled("sink steel", (0.6, 0.6, 0.62), 0.25, 1.0))
    lib.cyl("tap", 0.015, 0.32, (25.2, yb - 0.1, 0.9), M["brass"], verts=16)
    lib.cyl("tap spout", 0.012, 0.2, (25.2, yb - 0.1, 1.2), M["brass"], verts=16, rot=(math.radians(90), 0, 0))
    for z in (1.66, 2.12):
        lib.box("open shelf", (cw - 1.2, 0.3, 0.04), (cm - 0.6, yb - 0.16, z), M["walnut"], bevel=0.003)
        lib.box("shelf light", (cw - 1.3, 0.02, 0.008), (cm - 0.6, yb - 0.26, z - 0.024), lib.emission("shelf glow", (1.0, 0.78, 0.55), 14.0))
        x = cx0 + 0.25
        while x < cx1 - 1.5:
            furn.ornament("kitchen jar", x, yb - 0.17, z + 0.02, rnd.uniform(0.12, 0.26), rnd, M["ceramics"] if "ceramics" in M else [M["glaze"]])
            x += rnd.uniform(0.22, 0.4)
    # tall units at the end wall: the cold store's door, two ovens, a larder
    lib.box("tall units", (0.66, 4.8, 2.5), (x1 - 0.33, 27.4, 1.25), M["walnut_v"], bevel=0.004)
    for (y, z, h) in ((26.1, 1.05, 0.6), (26.1, 1.72, 0.6)):
        lib.box("oven", (0.02, 0.62, h - 0.06), (x1 - 0.665, y, z), lib.principled("oven glass", (0.015, 0.015, 0.016), 0.06, **{"Coat Weight": 1.0}))
    for y in (25.4, 27.4, 29.2): lib.box("tall line", (0.006, 0.004, 2.4), (x1 - 0.665, y, 1.25), M["shadow"])
    # the island: walnut under a thick stone top, four stools, the morning's things on it
    ix, iy = 22.4, 24.6
    lib.box("island", (3.8, 1.0, 0.86), (ix, iy, 0.43), M["walnut"], bevel=0.006)
    lib.box("island top", (4.2, 1.3, 0.06), (ix, iy - 0.08, 0.89), stone, bevel=0.004)
    for k in range(4):
        sx = ix - 1.35 + 0.9 * k; st = lib.cyl("stool seat", 0.19, 0.05, (sx, iy - 1.05, 0.66), M["walnut"], verts=40, bevel=0.01)
        lib.cyl("stool stem", 0.03, 0.66, (sx, iy - 1.05, 0.0), M["bronze_dark"], verts=16)
        lib.cyl("stool foot", 0.2, 0.015, (sx, iy - 1.05, 0.0), M["bronze_dark"], verts=40)
        lib.cyl("stool ring", 0.17, 0.012, (sx, iy - 1.05, 0.24), M["bronze_dark"], verts=40)
    lemon = lib.principled("lemon skin", (0.85, 0.62, 0.05), 0.35, **{"Coat Weight": 0.3})
    furn.lathe("fruit bowl", [(0.0, 0.0), (0.08, 0.0), (0.16, 0.05), (0.19, 0.09), (0.18, 0.09), (0.15, 0.055), (0.0, 0.02)], M["glaze"], 48, (ix - 0.8, iy, 0.92))
    for k in range(6):
        a = k * 1.05; bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.036, location=(ix - 0.8 + 0.075 * math.cos(a) * (k > 0), iy + 0.075 * math.sin(a) * (k > 0), 0.99 + 0.035 * (k == 0)))
        lm = bpy.context.active_object; lm.scale = (1, 1, 1.2); lm.data.materials.append(lemon)
        for p_ in lm.data.polygons: p_.use_smooth = True
    lib.box("bread board", (0.5, 0.32, 0.03), (ix + 0.5, iy + 0.1, 0.935), M["oak"], bevel=0.006, rot_z=0.2)
    lib.import_glb(os.path.join(lib.ASSETS, "DiffuseTransmissionTeacup.glb"), (ix + 1.2, iy - 0.35, 0.92), 0.5, 1.0, name="kitchen cup")
    for k in range(3):                       # pendants over the island
        px = ix - 1.3 + 1.3 * k
        lib.cyl("pendant shade", 0.2, 0.22, (px, iy, 2.3), M["brass"], verts=48, r2=0.06)
        lib.cyl("pendant cord", 0.004, HB - 2.52, (px, iy, 2.52), M["shadow"], verts=8)
        lib.point_light("pendant light", (px, iy, 2.28), 80, (1.0, 0.75, 0.5), 0.05)
    # the robot that cooks: a carriage on a rail under the ceiling, an arm reaching down to the hob
    lib.box("robot rail", (cw, 0.1, 0.08), (cm, yb - 0.85, HB - 0.06), M["bronze_dark"])
    cxr = 21.6; lib.box("robot carriage", (0.36, 0.3, 0.22), (cxr, yb - 0.85, HB - 0.21), robot, bevel=0.03)
    p0 = Vector((cxr, yb - 0.85, HB - 0.32)); p1 = Vector((cxr, yb - 0.75, 2.25)); p2 = Vector((cxr - 0.12, yb - 0.4, 1.32))
    for (a, b, r) in ((p0, p1, 0.07), (p1, p2, 0.055)):
        d = b - a; seg = lib.cyl("robot arm", r, d.length, tuple(a), robot, verts=32); seg.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    for (p, r) in ((p1, 0.085), (p2, 0.065)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=tuple(p)); j_ = bpy.context.active_object; j_.data.materials.append(joint)
        for p_ in j_.data.polygons: p_.use_smooth = True
    lib.cyl("robot hand", 0.04, 0.16, tuple(p2), joint, verts=24, rot=(math.radians(160), 0, 0))
    lib.cyl("pan", 0.15, 0.06, (21.6, yb - 0.32, 0.91), lib.principled("pan iron", (0.03, 0.03, 0.03), 0.4, 1.0), verts=48)
    # the everyday table for six by the street wall, under a glass globe; a big plant in the corner
    tx, ty = 25.0, 20.9
    lib.box("kitchen table", (2.6, 1.0, 0.05), (tx, ty, 0.745), M["oak"], bevel=0.006)
    for s_ in (-1, 1): lib.box("kitchen table leg", (0.1, 0.8, 0.72), (tx + s_ * 1.05, ty, 0.36), M["walnut_v"], bevel=0.006)
    for k in range(3):
        for s_ in (-1, 1): furn.dining_chair("chair", (tx - 0.85 + 0.85 * k, ty + s_ * 0.85, 0.0), 0.0 if s_ > 0 else math.pi, M)
    gl = lib.glass("globe glass", (0.97, 0.95, 0.9), 0.15)
    furn.lathe("kitchen globe", [(0.0, -0.2), (0.11, -0.17), (0.19, -0.06), (0.2, 0.0), (0.19, 0.08), (0.14, 0.15), (0.04, 0.195), (0.0, 0.2)], gl, 48, (tx, ty, 2.1))
    lib.cyl("globe bulb", 0.025, 0.05, (tx, ty, 2.075), lib.emission("bulb", (1.0, 0.72, 0.45), 70), verts=16)
    lib.cyl("globe cable", 0.002, HB - 2.3, (tx, ty, 2.3), M["shadow"], verts=8)
    lib.point_light("globe light", (tx, ty, 2.1), 60, (1.0, 0.75, 0.5), 0.07)
    lib.box("kitchen rug", (3.8, 2.8, 0.014), (tx, ty, 0.007), M["rug"], bevel=0.006, segs=2)
    pl = lib.import_glb(os.path.join(lib.ASSETS, "DiffuseTransmissionPlant.glb"), (16.6, 30.9, 0.0), 0.4, 2.0, name="kitchen plant")
    for (hx, hy) in ((19.2, B1 - 0.3), (19.6, B1 - 0.32), (27.6, B1 - 0.3)):         # herbs in pots on the worktop
        lib.instance_of(pl, (hx, hy, 0.9), hx, 0.45, name="herb pot")
    # light: downlights in the ceiling
    lens = lib.emission("downlight lens", (1.0, 0.80, 0.60), 35.0)
    for xx in (17.6, 20.8, 24.0, 27.2):
        for yy in (20.0, 23.0, 26.0, 29.6):
            lib.cyl("downlight lens", 0.035, 0.004, (xx, yy, HB - 0.003), lens, verts=24); lib.spot_light("downlight", (xx, yy, HB - 0.03), 120, (1.0, 0.80, 0.60), 0.02, 70, 0.6)


def materials(M):
    """what the suite adds to the house's materials"""
    M["moss"] = moss_material(); M["rock"] = rock_material(); M["slate_rock"] = rock_material("slate rock", (0.05, 0.05, 0.055), (0.16, 0.16, 0.17), lichen=False)
    M["granite"] = rock_material("granite", (0.30, 0.29, 0.27), (0.50, 0.49, 0.46))
    M["pond_water"] = still_water(); M["pond_bed"] = pond_bed(); M["gravel"] = gravel_material()
    M["fern"] = lib.leaf("fern", (0.06, 0.15, 0.03), 0.3, 0.5)
    M["bath_stone"] = M["breast"]; M["verde"] = lib.marble("verde marble", (0.045, 0.10, 0.075), (0.30, 0.38, 0.33), 0.15, 0.45)
    M["clay"] = lib.plaster("clay plaster", (0.46, 0.38, 0.29), bump=0.08); M["teak"] = lib.wood("teak", (0.30, 0.18, 0.09), (0.18, 0.10, 0.05), 0.5)
    M["towel"] = lib.fabric("towel", (0.86, 0.85, 0.82), 0.95, 0.6, 900, 0.5)
    M["cloth"] = lib.fabric("book cloth", (0.25, 0.08, 0.05), 0.8, 0.2, 800)


def build(M, rnd):
    materials(M)
    o = []
    # the street: travertine underfoot, plaster walls, lit from above through a long opening
    o.append(lib.box("street floor", (60, S1 - S0 + 0.4, 0.3), (0, (S0 + S1) / 2, -0.15), M["pavers"]))
    o.append(lib.box("street roof", (60, S1 - S0 + 1.0, 0.6), (0, (S0 + S1) / 2, TOP + 0.3), M["plaster"]))
    cut = lib.box("street skylight cut", (24.0, 2.2, 2.0), (0, (S0 + S1) / 2, TOP + 0.3), None); cut.hide_render = True; cut.hide_viewport = True
    bo = o[-1].modifiers.new("open", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
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
    # the suite's front: its doors in the middle
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
    # the suite's floor everywhere but under the garden, where the moss lies on soil
    for sgn in (-1, 1): o.append(lib.box("suite floor", (30 - G, B1 - B0, 0.3), (sgn * (G + (30 - G) / 2), (B0 + B1) / 2, -0.15), M["oak"]))
    o.append(lib.box("suite floor", (2 * G, GY0 - B0, 0.3), (0, (B0 + GY0) / 2, -0.15), M["oak"]))
    o.append(lib.box("suite floor", (2 * G, B1 - GY1, 0.3), (0, (GY1 + B1) / 2, -0.15), M["oak"]))
    o.append(lib.box("garden soil", (2 * G, GY1 - GY0, 0.3), (0, (GY0 + GY1) / 2, -0.75), M["pond_bed"]))
    roof = lib.box("suite roof", (60, B1 - B0, 0.6), (0, (B0 + B1) / 2, TOP + 0.3), M["plaster"]); o.append(roof)
    cut2 = lib.box("garden opening cut", (2 * G, GY1 - GY0, 2.0), (0, (GY0 + GY1) / 2, TOP + 0.3), None); cut2.hide_render = True; cut2.hide_viewport = True
    bo = roof.modifiers.new("open", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut2; bo.solver = "EXACT"
    for sgn in (-1, 1):
        o.append(lib.box("room ceiling", (13.0, B1 - B0, 0.3), (sgn * (G + 0.4 + 6.5), (B0 + B1) / 2, HB + 0.15), M["ceiling"]))
        o.append(lib.box("garden wall above", (0.3, GY1 - GY0 + 0.6, TOP - HB), (sgn * (G + 0.25), (GY0 + GY1) / 2, (HB + TOP) / 2), M["clay"]))
        o.append(lib.box("garden glass", (0.012, GY1 - GY0, HB - 0.1), (sgn * (G + 0.25), (GY0 + GY1) / 2, HB / 2), M["glass"]))
        y = GY0
        while y <= GY1 + 0.01:
            o.append(lib.box("garden mullion", (0.08, 0.06, HB), (sgn * (G + 0.25), y, HB / 2), M["bronze"])); y += (GY1 - GY0) / 5
        o.append(lib.box("room end wall", (0.3, B1 - B0, HB), (sgn * 15.65, (B0 + B1) / 2, HB / 2), M["oak_panel"]))
        o.append(lib.box("room back wall", (8.4, 0.3, HB), (sgn * 11.45, 27.75, HB / 2), M["walnut_v"] if sgn > 0 else M["oak_panel"]))
        o.append(lib.box("room door", (1.0, 0.06, 2.8), (sgn * 13.6, 27.57, 1.4), M["walnut_v"], bevel=0.003))
    o.append(lib.box("garden back wall", (2 * G + 1.0, 0.3, TOP), (0, GY1 + 0.15 + 0.6, TOP / 2), M["clay"]))
    o.append(lib.box("gallery glass", (2 * G, 0.012, HB - 0.1), (0, GY0 - 0.05, HB / 2), M["glass"]))
    o.append(lib.box("suite back wall", (60, 0.3, HB), (0, B1 + 0.15, HB / 2), M["oak_panel"]))
    garden(M, rnd); bedroom(M, rnd); bath(M, rnd); kitchen(M, rnd)
    drop_leaves()
    return o
