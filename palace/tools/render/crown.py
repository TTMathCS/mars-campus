"""The Crown's rooms for Cycles: a stretch of the ring with the numbers of the Crown page (palace/crown/index.html):
the floor at +41 m (z = 0 here), the inner wall at r = 115 m and the outer at 135 m (the ring 20 m wide inside), the
Glide (a moving walkway) along the inner wall to r = 118.25 m, windows 2.5 m tall at the eye of someone walking (0.5 to
3.0 m above the floor; 5 m open, 3 m piers, measured along the wall) through both walls, each lined in one piece of
bronze, and the ceiling at min(roof - 2.5, 61) m: 12.5 m above the floor, rising to 20 m in the halls under the five
spires. Bearings are degrees clockwise from north; P(r, b, z) is the point at radius r and bearing b, the ring's centre
at the origin. Outside: the Mars sky and plain, the Stone Garden 41 m below, the Orb over the middle."""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, noise
import lib, furn

R_IN, R_OUT, R_GL, FL, SLOT0, SLOT1 = 115.0, 135.0, 118.5, 41.0, 41.5, 44.0
Z0, Z1 = SLOT0 - FL, SLOT1 - FL            # the windows, 0.5 to 3.0 m above the floor: one looks out through them walking
WT = 0.5                                   # walls 0.5 m thick
PAD = 0.5                                  # a stretch is built half a degree past its ends (0 for the walk, where stretches meet)
ORB_R, ORB_Z = 24.0, 72.0 - FL             # the Orb, 48 m across: radius, centre height above the floor
D = math.pi / 180


def roof_top(b):
    c = (1 + math.cos(5 * (b - 18) * D)) / 2; return 56 + 34 * c ** 6


def ceil_at(b): return min(roof_top(b) - 2.5, 61.0) - FL


def P(r, b, z=0.0): return Vector((r * math.sin(b * D), r * math.cos(b * D), z))


def slot_open(r, b): return ((r * b * D) / 8.0) % 1.0 < 0.625


def steps(b0, b1, n_per_deg=4):
    n = max(1, int(math.ceil((b1 - b0) * n_per_deg))); return [b0 + (b1 - b0) * i / n for i in range(n + 1)]


def sector(name, r0, r1, b0, b1, z, mat, flip=False, zf=None):
    """a flat annular sector (a floor or a ceiling), at height z (or zf(b) for a ceiling that follows the roof)"""
    bm = bmesh.new(); bs = steps(b0, b1); prev = None
    for b in bs:
        zz = zf(b) if zf else z; cur = (bm.verts.new(P(r0, b, zz)), bm.verts.new(P(r1, b, zz)))
        if prev: bm.faces.new((prev[0], cur[0], cur[1], prev[1]) if not flip else (prev[1], cur[1], cur[0], prev[0]))
        prev = cur
    return lib.mesh_obj(name, bm, mat)


def curved_box(name, r0, r1, b0, b1, z0, z1, mat, zf1=None):
    """a solid between radii r0 and r1, bearings b0 and b1, heights z0 and z1 (or zf1(b) for a top that follows the
    roof): walls, piers, partitions"""
    bm = bmesh.new(); bs = steps(b0, b1); rings = []
    for b in bs:
        top = zf1(b) if zf1 else z1
        rings.append([bm.verts.new(P(r0, b, z0)), bm.verts.new(P(r1, b, z0)), bm.verts.new(P(r1, b, top)), bm.verts.new(P(r0, b, top))])
    for i in range(len(rings) - 1):
        a, c = rings[i], rings[i + 1]
        for k in range(4):
            bm.faces.new((a[k], c[k], c[(k + 1) % 4], a[(k + 1) % 4]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return lib.mesh_obj(name, bm, mat)


def openings(r, b0, b1):
    """the slot openings along a wall at radius r between bearings b0 and b1, as (start, end) bearings"""
    out = []; s0, s1 = r * b0 * D, r * b1 * D
    k = math.floor(s0 / 8.0)
    while k * 8.0 < s1:
        a, b = max(s0, k * 8.0), min(s1, k * 8.0 + 5.0)
        if b > a + 0.05: out.append((a / r / D, b / r / D))
        k += 1
    return out


def wall(name, r_face, side, b0, b1, M, wall_mat, glass=True):
    """a ring wall whose room face is at radius r_face; its body runs outwards from there (side = +1, the outer wall)
    or inwards (side = -1, the inner wall). Windows go through it at eye height, each lined in one piece of bronze
    (window_lining), glazed in the middle."""
    r0, r1 = (r_face, r_face + WT) if side > 0 else (r_face - WT, r_face)
    o = [curved_box(name + " below", r0, r1, b0, b1, -0.3, Z0, wall_mat),
         curved_box(name + " above", r0, r1, b0, b1, Z1, 9.0, wall_mat, zf1=lambda b: ceil_at(b) + 0.4)]
    cur = b0; lo, hi = b0 + PAD + 0.9 / r_face / D, b1 - PAD - 0.9 / r_face / D
    # the windows keep the ring's 8 m rhythm; one that a room's end would cut through is left out (its wall solid),
    # so every window stands whole in its room, 0.9 m or more from the cross walls
    for (a, b) in [(a_, b_) for (a_, b_) in openings(r_face, b0, b1) if a_ >= lo and b_ <= hi]:
        if a > cur + 1e-4: o.append(curved_box(name + " pier", r0, r1, cur, a, Z0, Z1, wall_mat))
        o.append(window_lining("window lining", r0, r1, a, b, Z0, Z1, M["bronze"]))
        if glass:
            rg = (r0 + r1) / 2; t = LINING / r_face / D
            o.append(curved_box("window glass", rg - 0.006, rg + 0.006, a + t, b - t, Z0 + LINING, Z1 - LINING, M["glass"]))
        cur = b
    if b1 > cur + 1e-4: o.append(curved_box(name + " pier", r0, r1, cur, b1, Z0, Z1, wall_mat))
    return o


LINING, PROUD = 0.04, 0.02                 # a window's bronze lining: 4 cm thick, standing 2 cm proud of both faces


def window_lining(name, r0, r1, a, b, z0, z1, mat, t=None, proud=None):
    """the lining of a window from one face of the wall to the other: sill, head and jambs one closed piece, so its
    edges run straight and unbroken round the opening; t thick, standing proud of both faces by proud"""
    t = LINING if t is None else t; e = PROUD if proud is None else proud
    rm = (r0 + r1) / 2; da = t / rm / D
    so, si = steps(a, b), steps(a + da, b - da)                      # the same number of steps outside and in
    outer = [(s_, z0) for s_ in so] + [(s_, z1) for s_ in reversed(so)]
    inner = [(s_, z0 + t) for s_ in si] + [(s_, z1 - t) for s_ in reversed(si)]
    bm = bmesh.new(); n = len(outer)
    of = [bm.verts.new(P(r0 - e, s_, z)) for (s_, z) in outer]; ob = [bm.verts.new(P(r1 + e, s_, z)) for (s_, z) in outer]
    inf = [bm.verts.new(P(r0 - e, s_, z)) for (s_, z) in inner]; ib = [bm.verts.new(P(r1 + e, s_, z)) for (s_, z) in inner]
    for k in range(n):
        k1 = (k + 1) % n
        bm.faces.new((of[k], of[k1], inf[k1], inf[k])); bm.faces.new((ob[k], ib[k], ib[k1], ob[k1]))
        bm.faces.new((of[k], ob[k], ob[k1], of[k1])); bm.faces.new((inf[k], inf[k1], ib[k1], ib[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return lib.mesh_obj(name, bm, mat)


def mars_sky(sun_az, sun_el, strength=1.0):
    """the Mars sky: butterscotch near the horizon, darker overhead, blue round the sun at sunset; a small pale sun"""
    w = bpy.context.scene.world; nt = w.node_tree; N = nt.nodes; L = nt.links
    bg = N["Background"]; bg.inputs["Strength"].default_value = strength
    tc = N.new("ShaderNodeTexCoord"); nrm = N.new("ShaderNodeVectorMath"); nrm.operation = "NORMALIZE"; L.new(tc.outputs["Generated"], nrm.inputs[0])
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(nrm.outputs[0], sep.inputs[0])
    sd = lib.sun_dir(sun_el, sun_az)
    dot = N.new("ShaderNodeVectorMath"); dot.operation = "DOT_PRODUCT"; L.new(nrm.outputs[0], dot.inputs[0]); dot.inputs[1].default_value = tuple(sd)
    def m(op, a, b=None): return lib._math(nt, op, a, b)
    e = sep.outputs[2]
    t = N.new("ShaderNodeMapRange"); t.interpolation_type = "SMOOTHSTEP"; t.inputs["From Min"].default_value = 0.0; t.inputs["From Max"].default_value = 0.55; L.new(e, t.inputs["Value"])
    base = N.new("ShaderNodeMix"); base.data_type = "RGBA"; L.new(t.outputs["Result"], base.inputs["Factor"]); base.inputs[6].default_value = (0.62, 0.40, 0.24, 1); base.inputs[7].default_value = (0.16, 0.11, 0.09, 1)
    # the blue glow round the sun (fine dust scatters blue forwards), and the sun itself
    halo = m("EXPONENT", m("MULTIPLY", m("SUBTRACT", dot.outputs["Value"], 1.0), 9.0))
    halo2 = m("EXPONENT", m("MULTIPLY", m("SUBTRACT", dot.outputs["Value"], 1.0), 60.0))
    disc = m("GREATER_THAN", dot.outputs["Value"], math.cos(0.18 * D))
    add1 = N.new("ShaderNodeMix"); add1.data_type = "RGBA"; add1.blend_type = "ADD"; L.new(m("MULTIPLY", halo, 0.55), add1.inputs["Factor"]); L.new(base.outputs[2], add1.inputs[6]); add1.inputs[7].default_value = (0.35, 0.55, 0.95, 1)
    add2 = N.new("ShaderNodeMix"); add2.data_type = "RGBA"; add2.blend_type = "ADD"; L.new(m("MULTIPLY", halo2, 1.6), add2.inputs["Factor"]); L.new(add1.outputs[2], add2.inputs[6]); add2.inputs[7].default_value = (0.75, 0.85, 1.0, 1)
    add3 = N.new("ShaderNodeMix"); add3.data_type = "RGBA"; add3.blend_type = "ADD"; L.new(m("MULTIPLY", disc, 400.0), add3.inputs["Factor"]); L.new(add2.outputs[2], add3.inputs[6]); add3.inputs[7].default_value = (1.0, 0.97, 0.92, 1)
    # below the horizon the plain takes over; keep the sky dim there
    below = N.new("ShaderNodeMix"); below.data_type = "RGBA"; L.new(m("LESS_THAN", e, 0.0), below.inputs["Factor"]); L.new(add3.outputs[2], below.inputs[6]); below.inputs[7].default_value = (0.14, 0.08, 0.05, 1)
    L.new(below.outputs[2], bg.inputs["Color"])
    return sd


def mars_ground_material():
    m, nt = lib._mat("mars plain")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.95
    tc = N.new("ShaderNodeTexCoord")
    n1 = N.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 0.004; n1.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n1.inputs["Vector"])
    n2 = N.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 0.05; n2.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], n2.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (0.16, 0.075, 0.04, 1); cr.color_ramp.elements[1].color = (0.42, 0.22, 0.12, 1)
    L.new(lib._math(nt, "MULTIPLY_ADD", n1.outputs["Fac"], 0.7, lib._math(nt, "MULTIPLY", n2.outputs["Fac"], 0.3)), cr.inputs["Fac"])
    # haze: far ground fades into the colour of the sky at the horizon
    dist = N.new("ShaderNodeVectorMath"); dist.operation = "LENGTH"; L.new(tc.outputs["Object"], dist.inputs[0])
    hz = N.new("ShaderNodeMapRange"); hz.inputs["From Min"].default_value = 300; hz.inputs["From Max"].default_value = 6000; L.new(dist.outputs["Value"], hz.inputs["Value"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "POWER", hz.outputs["Result"], 0.6), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (0.55, 0.36, 0.22, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.4; L.new(n2.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def outside(M, sun_az, sun_el, sun_strength=6.0, orb_r=ORB_R, skip=None, roof=False):
    """the world round the ring: sky, sun, the plain 41 m down, the Stone Garden inside the ring, the Orb. roof: the
    rest of the ring up to its roof and spires (seen from the Orb), not only as high as the rooms' ceilings"""
    sd = mars_sky(sun_az, sun_el, 1.0)
    lib.sun(sun_el, sun_az, sun_strength, angle_deg=0.35, color=(1.0, 0.86, 0.68))
    g = lib.cyl("plain", 9000, 0.1, (0, 0, -FL - 0.1), mars_ground_material(), verts=96, smooth=False)
    garden = lib.cyl("stone garden", R_IN - 13.0, 0.1, (0, 0, -FL - 0.05), lib.principled("raked gravel", (0.42, 0.40, 0.37), 0.9), verts=128, smooth=False)
    orb = lib.cyl("orb", orb_r, 2 * orb_r, (0, 0, ORB_Z - orb_r), None, verts=8)
    bpy.data.objects.remove(orb)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=orb_r, location=(0, 0, ORB_Z)); o = bpy.context.active_object; o.name = "orb"
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(lib.principled("orb mirror", (0.92, 0.93, 0.95), 0.03, 1.0))
    # the rest of the ring, seen across the garden: one smooth white band (only for what the slots show)
    # (leaving out the stretch the rooms are built in, with a degree to spare)
    lo, hi = (skip[0] - 1.0, skip[1] + 1.0) if skip else (0.0, 0.0)
    bm = bmesh.new(); bs = [b for b in steps(hi, lo + 360.0, 1)] if skip else steps(0, 360, 4 if roof else 1)
    prev = None
    for b in bs:
        top = roof_top(b) - FL if roof else ceil_at(b) + 0.6
        cur = [bm.verts.new(P(R_IN - 0.6, b, -9.0)), bm.verts.new(P(R_IN - 0.6, b, top)), bm.verts.new(P(R_OUT + 0.6, b, top)), bm.verts.new(P(R_OUT + 0.6, b, -9.0))]
        if prev:
            for k in range(4): bm.faces.new((prev[k], cur[k], cur[(k + 1) % 4], prev[(k + 1) % 4]))
        prev = cur
    ringo = lib.mesh_obj("ring outside", bm, lib.principled("white ceramic", (0.82, 0.80, 0.77), 0.35))
    ringo["far"] = True
    return sd, ringo


def ring_room(b0, b1, M, floor_mat, wall_mat=None, glide=True, part_walls=True, ceiling=None):
    """the shell of a stretch of the ring from bearing b0 to b1"""
    wall_mat = wall_mat or M["regolith"]; o = []
    o.append(sector("floor", R_GL, R_OUT, b0 - PAD, b1 + PAD, 0.0, floor_mat))
    if glide:
        o.append(sector("glide", R_IN, R_GL - 0.25, b0 - PAD, b1 + PAD, 0.06, M["glide"]))
        o.append(curved_box("glide edge", R_GL - 0.25, R_GL, b0 - PAD, b1 + PAD, -0.1, 0.06, M["titanium"]))
        o.append(curved_box("glide rail", R_IN + 0.12, R_IN + 0.2, b0 - PAD, b1 + PAD, 0.92, 0.96, M["bronze"]))
        for b in steps(b0 - PAD, b1 + PAD, 0.5):
            o.append(curved_box("rail post", R_IN + 0.13, R_IN + 0.19, b - 0.012, b + 0.012, 0.06, 0.92, M["bronze"]))
    else:
        o.append(sector("floor in", R_IN, R_GL, b0 - PAD, b1 + PAD, 0.0, floor_mat))
    o.append(sector("ceiling", R_IN - 0.1, R_OUT + 0.1, b0 - PAD, b1 + PAD, 0.0, ceiling or M["ceiling"], flip=True, zf=lambda b: ceil_at(b)))
    o += wall("inner wall", R_IN, -1, b0 - PAD, b1 + PAD, M, wall_mat)
    o += wall("outer wall", R_OUT, 1, b0 - PAD, b1 + PAD, M, wall_mat)
    # the coves: a plaster ledge 0.6 m under the ceiling along both walls, with a strip of light on top washing the ceiling
    glow = lib.emission("cove glow", (1.0, 0.79, 0.56), 26.0); bs = steps(b0 - PAD, b1 + PAD)
    for (r0, r1, l0, l1) in ((R_IN, R_IN + 0.3, R_IN + 0.05, R_IN + 0.12), (R_OUT - 0.3, R_OUT, R_OUT - 0.12, R_OUT - 0.05)):
        bm = bmesh.new(); rings = []
        for b in bs:
            z = ceil_at(b) - 0.6
            rings.append([bm.verts.new(P(r0, b, z - 0.08)), bm.verts.new(P(r1, b, z - 0.08)), bm.verts.new(P(r1, b, z)), bm.verts.new(P(r0, b, z))])
        for i in range(len(rings) - 1):
            a_, c_ = rings[i], rings[i + 1]
            for k in range(4): bm.faces.new((a_[k], c_[k], c_[(k + 1) % 4], a_[(k + 1) % 4]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); o.append(lib.mesh_obj("cove", bm, wall_mat))
        bm = bmesh.new(); prev = None
        for b in bs:
            z = ceil_at(b) - 0.595; cur = (bm.verts.new(P(l0, b, z)), bm.verts.new(P(l1, b, z)))
            if prev: bm.faces.new((prev[0], cur[0], cur[1], prev[1]))
            prev = cur
        o.append(lib.mesh_obj("cove light", bm, glow))
    o = [x for x in o if x is not None]
    if part_walls:
        for b in (b0, b1):
            th = 0.3 / 130.0 / D
            o.append(curved_box("partition", R_GL + 0.05, R_OUT, b - th / 2, b + th / 2, 0, 9, wall_mat, zf1=lambda bb: ceil_at(bb) + 0.01))
    # where the model stops, close the Glide's lane too (the Glide runs on through the house, but not in this picture)
    th = 0.3 / 130.0 / D
    for b in (b0 - PAD + th, b1 + PAD - th):
        o.append(curved_box("glide end", R_IN - 0.6, R_GL + 0.06, b - th / 2, b + th / 2, -0.3, 9, wall_mat, zf1=lambda bb: ceil_at(bb) + 0.4))
    return o


def slat_ceiling(b0, b1, M, pitch=0.075, w=0.042, h=0.05, felt=True):
    """oak slats along the ring under the ceiling, on black felt, as in the family room"""
    bs = steps(b0, b1); bm = bmesh.new()
    r = R_IN + 0.35
    while r < R_OUT - 0.35:
        rings = []
        for b in bs:
            zt = ceil_at(b) - 0.004; zb = zt - h
            rings.append([bm.verts.new(P(r - w / 2, b, zb)), bm.verts.new(P(r + w / 2, b, zb)), bm.verts.new(P(r + w / 2, b, zt)), bm.verts.new(P(r - w / 2, b, zt))])
        for i in range(len(rings) - 1):
            a, c = rings[i], rings[i + 1]
            for k in range(4): bm.faces.new((a[k], c[k], c[(k + 1) % 4], a[(k + 1) % 4]))
        r += pitch
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])          # facing out (a bake shades the side a face faces)
    o = [lib.mesh_obj("slats", bm, M["oak_slat"])]
    if felt: o.append(sector("felt", R_IN, R_OUT, b0, b1, 0, M["felt"], flip=True, zf=lambda b: ceil_at(b) - 0.002))
    return o


# ---------------------------------------------------------------- glass walls, doors, cross walls with doorways
def smart_glass(state="clear"):
    """switchable glass: clear; frosted (its privacy layer on: milky, the light coming through soft); dark (tinted
    almost black against the sun, the room reflected in it)"""
    name = "smart glass " + state; m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["IOR"].default_value = 1.5; b.inputs["Transmission Weight"].default_value = 1.0
    col, rough = {"clear": ((0.95, 0.97, 0.96), 0.0), "frosted": ((0.93, 0.92, 0.90), 0.5), "dark": ((0.03, 0.035, 0.045), 0.04)}[state]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough
    if state == "frosted": b.inputs["Subsurface Weight"].default_value = 0.15
    return m


def pivot_doors(name, r, b, width, height, M, leaf_mat=None, open_deg=0.0):
    """a pair of tall pivot doors filling an opening width x height at radius r, bearing b: walnut leaves 8 cm thick
    in a bronze frame, long bronze pulls"""
    W = leaf_mat or M.get("walnut_v") or M["walnut"]; out = []; t = 0.08; half = width / 2 / r / D
    out.append(curved_box(name + " frame", r - 0.06, r + 0.06, b - half - 0.06 / r / D, b - half, 0, height + 0.06, M["bronze_dark"]))
    out.append(curved_box(name + " frame", r - 0.06, r + 0.06, b + half, b + half + 0.06 / r / D, 0, height + 0.06, M["bronze_dark"]))
    out.append(curved_box(name + " frame", r - 0.06, r + 0.06, b - half, b + half, height, height + 0.06, M["bronze_dark"]))
    gap = 0.006 / r / D
    for (a0, a1) in ((b - half + gap, b - gap), (b + gap, b + half - gap)):
        out.append(curved_box(name + " leaf", r - t / 2, r + t / 2, a0, a1, 0.01, height - 0.006, W))
    for s in (-1, 1):
        bb = b + s * 0.09 / r / D
        for (r0, r1) in ((r - t / 2 - 0.07, r - t / 2 - 0.045), (r + t / 2 + 0.045, r + t / 2 + 0.07)):
            out.append(curved_box(name + " pull", r0, r1, bb - 0.012 / r / D, bb + 0.012 / r / D, 0.9, 2.3, M["bronze"]))
    return out


def glass_wall(name, r, b0, b1, M, state="frosted", doors=(), transom=4.0, panel=2.6):
    """a wall of glass along the ring at radius r, from b0 to b1 and floor to ceiling, in bronze: fins every panel
    metres, a transom at the doors' height; below it switchable glass (state), above it clear; doors: (bearing,
    width) pairs of pivot doors set in it"""
    out = []; fw = 0.035 / r / D; ceil = lambda bb: ceil_at(bb) - 0.001
    out.append(curved_box(name + " track", r - 0.05, r + 0.05, b0, b1, 0.0, 0.05, M["bronze_dark"]))
    out.append(curved_box(name + " transom", r - 0.05, r + 0.05, b0, b1, transom, transom + 0.07, M["bronze_dark"]))
    out.append(curved_box(name + " head", r - 0.05, r + 0.05, b0, b1, 9.0, 9.0, M["bronze_dark"], zf1=ceil))
    gaps = [(bd - wd / 2 / r / D - 0.07 / r / D, bd + wd / 2 / r / D + 0.07 / r / D) for (bd, wd) in doors]
    n = max(1, int(round((b1 - b0) * D * r / panel)))
    for k in range(n + 1):
        bb = b0 + (b1 - b0) * k / n
        if any(g0 - fw < bb < g1 + fw for (g0, g1) in gaps): continue
        out.append(curved_box(name + " fin", r - 0.07, r + 0.07, bb - fw, bb + fw, 0.0, 9.0, M["bronze_dark"], zf1=ceil))
    cur = b0                                     # the lower glass, round the doors
    for (g0, g1) in sorted(gaps) + [(b1, b1)]:
        if g0 > cur: out.append(curved_box(name + " glass", r - 0.008, r + 0.008, cur, g0, 0.05, transom, smart_glass(state)))
        cur = max(cur, g1)
    out.append(curved_box(name + " upper glass", r - 0.008, r + 0.008, b0, b1, transom + 0.07, 9.0, smart_glass("clear"), zf1=ceil))
    for (bd, wd) in doors:
        out += pivot_doors(name + " door", r, bd, wd, transom - 0.0, M)
        import lights                         # a pair of alabaster pendants to either side, the doors lit from above
        for s_ in (-1, 1):
            q = P(r - 1.1, bd + s_ * (wd / 2 + 0.7) / r / D)
            out.append(lights.alabaster_pendant(name + " door pendant", (q.x, q.y), z=2.9, ceiling=ceil_at(bd), d=0.3, h=0.5, watts=80))
        q = P(r - 1.6, bd, ceil_at(bd) - 0.1); tgt = P(r, bd, 1.6)
        sp = lib.spot_light(name + " door light", tuple(q), 6000, (1.0, 0.82, 0.62), 0.05, 20, 0.6); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
    return out


def glide_lights(b0, b1, every=5.0, watts=3200):
    """light over the Glide: a line of downlights in the ceiling down the middle of its lane, every few metres"""
    r = (R_IN + R_GL) / 2; n = max(1, int((b1 - b0) * D * r / every)); out = []
    for k in range(n):
        b = b0 + (b1 - b0) * (k + 0.5) / n
        out.append(lib.spot_light("glide light", tuple(P(r, b, ceil_at(b) - 0.08)), watts, (1.0, 0.84, 0.66), 0.03, 40, 0.7))
    return out


def partition(b, M, wall_mat=None, opening=None, head=3.6, th=0.3):
    """a cross wall between two rooms at bearing b, from the Glide's edge to the outer wall, floor to ceiling; with
    an opening (r0, r1) up to head, its edges lined in bronze. Both rooms build it the same way, and the walk's bake
    keeps one"""
    wall_mat = wall_mat or M["regolith"]; t = th / 130.0 / D; out = []; up = lambda bb: ceil_at(bb) + 0.01
    if opening is None:
        return [curved_box("partition", R_GL + 0.05, R_OUT, b - t / 2, b + t / 2, 0, 9, wall_mat, zf1=up)]
    r0, r1 = opening
    out.append(curved_box("partition", R_GL + 0.05, r0, b - t / 2, b + t / 2, 0, 9, wall_mat, zf1=up))
    out.append(curved_box("partition", r1, R_OUT, b - t / 2, b + t / 2, 0, 9, wall_mat, zf1=up))
    out.append(curved_box("partition head", r0, r1, b - t / 2, b + t / 2, head, 9, wall_mat, zf1=up))
    e = 0.02 / 130.0 / D
    for (q0, q1) in ((r0, r0 + LINING), (r1 - LINING, r1)):
        out.append(curved_box("partition lining", q0, q1, b - t / 2 - e, b + t / 2 + e, 0.0, head, M["bronze"]))
    out.append(curved_box("partition lining", r0, r1, b - t / 2 - e, b + t / 2 + e, head - LINING, head, M["bronze"]))
    return out
