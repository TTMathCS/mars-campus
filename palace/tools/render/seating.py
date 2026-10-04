"""Arcadia's seating, sized to its rooms (AGENTS.md: "Furniture fits the rooms"): long low sofas along the walls, deep
sectionals and crescent sofas round a table, daybeds, big club chairs, ottomans, upholstered benches, and generous
dining and desk chairs; never small chairs. Each piece is built at its real size from soft cushions (rounded, the
tops crowned, a welt along the seams, a few creases) on a recessed plinth or bronze legs, in fabrics that read as
fabric (velvet with its sheen, boucle's loops, linen's weave, leather's grain).
Local frame of a piece: x along it, the seat faces -y, the back at +y, z up from the floor; placed by loc and rot_z.
    import seating; seating.sofa("salon sofa", loc, rot_z, length=5.6, fabric=seating.fabric("oat boucle", (0.62, 0.56, 0.48), "boucle"))"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise
import lib


# ---------------------------------------------------------------- fabrics and finishes
def _mat(name):
    m = bpy.data.materials.get(name)
    if m: return m, None
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree


def fabric(name, color, kind="velvet"):
    """upholstery: velvet (deep, a sheen that changes with the light, crushed a little), boucle (soft loops), linen (a
    slubby weave), wool, or leather (grain, a soft gloss, worn paler at the edges)"""
    m, nt = _mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord"); obj = tc.outputs["Object"]
    var = N.new("ShaderNodeTexNoise"); var.inputs["Scale"].default_value = 3.5; var.inputs["Detail"].default_value = 4.0; L.new(obj, var.inputs["Vector"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(var.outputs["Fac"], mx.inputs["Factor"])
    k = {"velvet": 0.22, "boucle": 0.10, "linen": 0.10, "wool": 0.08, "leather": 0.16}[kind]
    mx.inputs[6].default_value = (color[0] * (1 - k), color[1] * (1 - k), color[2] * (1 - k), 1); mx.inputs[7].default_value = (min(1, color[0] * (1 + k)), min(1, color[1] * (1 + k)), min(1, color[2] * (1 + k)), 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump"); L.new(bump.outputs["Normal"], b.inputs["Normal"])
    if kind == "velvet":
        b.inputs["Roughness"].default_value = 0.78; b.inputs["Sheen Weight"].default_value = 1.0; b.inputs["Sheen Roughness"].default_value = 0.32
        b.inputs["Specular IOR Level"].default_value = 0.25
        nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 60.0; nz.inputs["Detail"].default_value = 6.0; L.new(obj, nz.inputs["Vector"])
        L.new(nz.outputs["Fac"], bump.inputs["Height"]); bump.inputs["Strength"].default_value = 0.08
    elif kind in ("boucle", "wool"):
        b.inputs["Roughness"].default_value = 0.95; b.inputs["Sheen Weight"].default_value = 0.5; b.inputs["Sheen Roughness"].default_value = 0.5
        b.inputs["Specular IOR Level"].default_value = 0.2
        v = N.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 340.0 if kind == "boucle" else 700.0; v.feature = "F1"; L.new(obj, v.inputs["Vector"])
        L.new(v.outputs["Distance"], bump.inputs["Height"]); bump.inputs["Strength"].default_value = 0.55 if kind == "boucle" else 0.3; bump.invert = True
    elif kind == "linen":
        b.inputs["Roughness"].default_value = 0.88; b.inputs["Sheen Weight"].default_value = 0.25; b.inputs["Specular IOR Level"].default_value = 0.25
        w1 = N.new("ShaderNodeTexWave"); w1.wave_type = "BANDS"; w1.bands_direction = "X"; w1.inputs["Scale"].default_value = 420.0; w1.inputs["Distortion"].default_value = 2.0; L.new(obj, w1.inputs["Vector"])
        w2 = N.new("ShaderNodeTexWave"); w2.wave_type = "BANDS"; w2.bands_direction = "Y"; w2.inputs["Scale"].default_value = 420.0; w2.inputs["Distortion"].default_value = 2.0; L.new(obj, w2.inputs["Vector"])
        L.new(lib._math(nt, "MULTIPLY", w1.outputs["Fac"], w2.outputs["Fac"]), bump.inputs["Height"]); bump.inputs["Strength"].default_value = 0.25
    else:                                    # leather
        b.inputs["Roughness"].default_value = 0.42; b.inputs["Coat Weight"].default_value = 0.25; b.inputs["Coat Roughness"].default_value = 0.35
        g = N.new("ShaderNodeTexVoronoi"); g.inputs["Scale"].default_value = 520.0; L.new(obj, g.inputs["Vector"])
        L.new(g.outputs["Distance"], bump.inputs["Height"]); bump.inputs["Strength"].default_value = 0.18
        rr = N.new("ShaderNodeMapRange"); L.new(var.outputs["Fac"], rr.inputs["Value"]); rr.inputs["To Min"].default_value = 0.34; rr.inputs["To Max"].default_value = 0.52
        L.new(rr.outputs["Result"], b.inputs["Roughness"])
    return m


def stone(name, color, vein=(0.2, 0.18, 0.16), kind="travertine", polish=0.25):
    """a stone for tables: travertine (pale, with its pores and bands), marble (veined), basalt (dark, fine)"""
    m, nt = _mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = polish
    tc = N.new("ShaderNodeTexCoord"); obj = tc.outputs["Object"]
    if kind == "marble":
        w = N.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.inputs["Scale"].default_value = 2.6; w.inputs["Distortion"].default_value = 9.0; w.inputs["Detail"].default_value = 10.0
        w.inputs["Detail Scale"].default_value = 2.5; L.new(obj, w.inputs["Vector"])
        f = lib._math(nt, "POWER", lib._math(nt, "ABSOLUTE", lib._math(nt, "SUBTRACT", lib._math(nt, "MULTIPLY", w.outputs["Fac"], 2.0), 1.0)), 18.0)
    elif kind == "travertine":
        mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.0, 1.0, 9.0); L.new(obj, mp.inputs["Vector"])
        nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.0; nz.inputs["Detail"].default_value = 8.0; L.new(mp.outputs["Vector"], nz.inputs["Vector"]); f = nz.outputs["Fac"]
        pores = N.new("ShaderNodeTexVoronoi"); pores.inputs["Scale"].default_value = 90.0; L.new(obj, pores.inputs["Vector"])
        bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35; L.new(lib._math(nt, "LESS_THAN", pores.outputs["Distance"], 0.08), bump.inputs["Height"]); bump.invert = True
        L.new(bump.outputs["Normal"], b.inputs["Normal"])
    else:
        nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 40.0; nz.inputs["Detail"].default_value = 6.0; L.new(obj, nz.inputs["Vector"]); f = nz.outputs["Fac"]
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(f, mx.inputs["Factor"]); mx.inputs[6].default_value = (*color, 1); mx.inputs[7].default_value = (*vein, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def metal(name, color=(0.42, 0.30, 0.18), rough=0.32):
    m, nt = _mat(name)
    if nt is None: return m
    b = nt.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Metallic"].default_value = 1.0; b.inputs["Roughness"].default_value = rough
    return m


# ---------------------------------------------------------------- shapes
def _bend(co, R):
    """a straight piece (along x) curved round a centre R in front of it (at y = -R): its front stays the inside"""
    if not R: return co
    x, y, z = co; phi = x / R; rho = R + y
    return Vector((rho * math.sin(phi), rho * math.cos(phi) - R, z))


def soft_box(name, size, centre, mat, r=0.05, crown=0.015, bulge=0.008, crease=0.003, seed=0, tilt=0.0, bend=None, sub=2, yaw=0.0):
    """a cushion or an upholstered block: a box size (x, y, z) rounded by r at its edges, its top crowned, its sides
    a little full, a few creases; tilted back by tilt (radians, about x) and turned by yaw (about z), both about its
    own middle; its vertices in the piece's frame (bent with the piece if bend)"""
    sx, sy, sz = size; hx, hy, hz = sx / 2, sy / 2, sz / 2; r = min(r, hx * 0.9, hy * 0.9, hz * 0.9)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=r, segments=3, profile=0.5, affect="EDGES")
    cuts = max(1, min(8, int(max(sx, sy) / 0.12)))
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if e.calc_length() > 0.1], cuts=cuts, use_grid_fill=True)
    rot = Matrix.Rotation(yaw, 3, "Z") @ Matrix.Rotation(tilt, 3, "X"); c = Vector(centre); off = Vector((seed * 1.7, seed * 0.3, seed * 2.1))
    for v in bm.verts:
        p = v.co.copy(); ux, uy, uz = p.x / hx, p.y / hy, p.z / hz
        if uz > 0: p.z += crown * max(0.0, 1 - ux * ux) * max(0.0, 1 - uy * uy)
        if abs(ux) > 0.6: p.x += math.copysign(bulge, ux) * max(0.0, 1 - uy * uy) * max(0.0, 1 - uz * uz)
        if abs(uy) > 0.6: p.y += math.copysign(bulge, uy) * max(0.0, 1 - ux * ux) * max(0.0, 1 - uz * uz)
        if crease > 0:
            n = noise.noise(p * 7.0 + off); p += p.normalized() * n * crease if p.length > 1e-6 else Vector()
        v.co = _bend(c + rot @ p, bend)
    o = lib.mesh_obj(name, bm, mat, smooth=True)
    if sub: md = o.modifiers.new("sub", "SUBSURF"); md.levels = 1; md.render_levels = sub
    return o


def welt(name, sx, sy, z, centre, mat, r=0.004, rc=0.05, tilt=0.0, bend=None):
    """the piping round a cushion's seam: a cord along a rounded rectangle sx by sy at height z"""
    pts = []; hx, hy = sx / 2 - rc, sy / 2 - rc
    for (cx, cy, a0) in ((hx, hy, 0.0), (-hx, hy, 90.0), (-hx, -hy, 180.0), (hx, -hy, 270.0)):
        for k in range(7):
            a = math.radians(a0 + 90.0 * k / 6); pts.append(Vector((cx + rc * math.cos(a), cy + rc * math.sin(a), z)))
    bm = bmesh.new(); n = len(pts); rings = []; sides = 6; rot = Matrix.Rotation(tilt, 3, "X"); c = Vector(centre)
    for i in range(n):
        p = pts[i]; t = (pts[(i + 1) % n] - pts[i - 1]).normalized(); nn = Vector((0, 0, 1)); bb = t.cross(nn)
        rings.append([bm.verts.new(_bend(c + rot @ (p + (nn * math.cos(2 * math.pi * k / sides) + bb * math.sin(2 * math.pi * k / sides)) * r), bend)) for k in range(sides)])
    for i in range(n):
        a, b2 = rings[i], rings[(i + 1) % n]
        for k in range(sides): bm.faces.new((a[k], b2[k], b2[(k + 1) % sides], a[(k + 1) % sides]))
    return lib.mesh_obj(name, bm, mat, smooth=True)


def _piece(name, loc, rot_z, parts):
    e = bpy.data.objects.new(name, None); lib.link(e); e.location = loc; e.rotation_euler = (0, 0, rot_z)
    for p in parts: p.parent = e
    return e


def _plinth(name, sx, sy, h, mat, bend, inset=0.06):
    """the shadow gap a sofa floats on: a dark block set back under it"""
    return soft_box(name, (sx - 2 * inset, sy - 2 * inset, h), (0, 0, h / 2), mat, r=0.01, crown=0, bulge=0, crease=0, bend=bend, sub=0)


# ---------------------------------------------------------------- pieces
def sofa(name, loc, rot_z, length=4.2, depth=1.18, fabric_mat=None, base_mat=None, arms=True, pillows=None, bend=None, seed=1,
         seat_h=0.43, back_h=0.78, arm_w=0.32, arm_h=0.6, cushions=None, legs=None):
    """a long low sofa: a deck on a recessed plinth (or bronze legs), seat cushions about 1.1 m wide, loose back
    cushions leaning on a low back, wide arms, pillows; bend: curved round a centre that far in front (a crescent)"""
    rnd = random.Random(seed); F = fabric_mat or fabric("sofa oat", (0.60, 0.55, 0.48), "boucle")
    B = base_mat or lib.principled("sofa plinth", (0.02, 0.018, 0.016), 0.6)
    parts = []; L = length; D = depth; inner = L - (2 * arm_w if arms else 0.0)
    n = cushions or max(1, int(round(inner / 1.15))); cw = inner / n
    base_h = 0.10 if not legs else 0.16
    if legs:
        for x in (-L / 2 + 0.12, -L / 6, L / 6, L / 2 - 0.12):
            for y in (-D / 2 + 0.12, D / 2 - 0.12):
                parts.append(soft_box(name + " leg", (0.045, 0.045, base_h), (x, y, base_h / 2), legs, r=0.008, crown=0, bulge=0, crease=0, bend=bend, sub=0))
    else: parts.append(_plinth(name + " plinth", L, D, base_h, B, bend))
    deck_h = seat_h - 0.15 - base_h; back_t = 0.24
    parts.append(soft_box(name + " deck", (inner + 0.02, D, deck_h), (0, 0, base_h + deck_h / 2), F, r=0.04, crown=0.0, bulge=0.004, crease=0.0, bend=bend, sub=1))
    parts.append(soft_box(name + " back", (L, back_t, back_h - base_h), (0, D / 2 - back_t / 2, base_h + (back_h - base_h) / 2), F, r=0.06, crown=0.01, bend=bend, seed=seed))
    if arms:
        for s in (-1, 1):
            parts.append(soft_box(name + " arm", (arm_w, D, arm_h - base_h), (s * (L / 2 - arm_w / 2), 0, base_h + (arm_h - base_h) / 2), F, r=0.07, crown=0.012, bend=bend, seed=seed + s))
    z0 = base_h + deck_h; sd = D - back_t - 0.02
    for i in range(n):
        x = -inner / 2 + cw * (i + 0.5)
        parts.append(soft_box(name + " seat", (cw - 0.012, sd, 0.15), (x, -back_t / 2 + 0.0, z0 + 0.075), F, r=0.06, crown=0.02, seed=seed * 10 + i, bend=bend))
        parts.append(welt(name + " welt", cw - 0.03, sd - 0.02, 0.064, (x, -back_t / 2, z0 + 0.075), F, bend=bend))
        bc = (x, D / 2 - back_t - 0.11, z0 + 0.15 + 0.25)
        parts.append(soft_box(name + " back cushion", (cw - 0.02, 0.22, 0.5), bc, F, r=0.08, crown=0.02, bulge=0.012, tilt=math.radians(-12), seed=seed * 20 + i, bend=bend))
    for (x, kind) in (pillows if pillows is not None else [(-inner / 2 + 0.35, 0), (inner / 2 - 0.35, 0), (-inner / 2 + 0.75, 1)]):
        pm = F if kind == 0 else fabric("pillow linen", (0.78, 0.74, 0.66), "linen")
        p = soft_box(name + " pillow", (0.52, 0.16, 0.5), (x, D / 2 - back_t - 0.3, z0 + 0.15 + 0.24), pm, r=0.08, crown=0.04, bulge=0.03,
                     tilt=math.radians(-18 + rnd.uniform(-6, 6)), seed=seed * 30 + int(x * 10), bend=bend, yaw=rnd.uniform(-0.15, 0.15))
        parts.append(p)
    return _piece(name, loc, rot_z, parts)


def crescent(name, loc, rot_z, radius=2.8, length=6.4, **kw):
    """a curved sofa on an arc round a table: its front the inside of the curve"""
    kw.setdefault("arms", False)
    return sofa(name, loc, rot_z, length=length, bend=radius, **kw)


def sectional(name, loc, rot_z, lx=4.6, ly=3.4, depth=1.18, **kw):
    """an L of two sofas meeting at a corner: one along x, one along y on the left, facing in"""
    a = sofa(name + " long", (0, 0, 0), 0.0, length=lx, depth=depth, **kw)
    b = sofa(name + " return", (-lx / 2 + depth / 2, -ly / 2 + depth / 2 - 0.0, 0), math.pi / 2, length=ly - depth, depth=depth, **dict(kw, arms=True))
    return _piece(name, loc, rot_z, [a, b])


def club_chair(name, loc, rot_z, fabric_mat=None, seed=2, w=1.05, d=1.0):
    """a big low club chair, a metre square: a deep seat cushion between wide rounded arms, a high back, a loose back
    cushion and a pillow, on a recessed plinth"""
    F = fabric_mat or fabric("chair velvet", (0.20, 0.24, 0.20), "velvet"); parts = []; aw = 0.24
    parts.append(_plinth(name + " plinth", w, d, 0.08, lib.principled("sofa plinth", (0.02, 0.018, 0.016), 0.6), None))
    parts.append(soft_box(name + " base", (w - 2 * aw + 0.02, d, 0.24), (0, 0, 0.08 + 0.12), F, r=0.04, crown=0, bulge=0.004, crease=0, sub=1))
    for s_ in (-1, 1):
        parts.append(soft_box(name + " arm", (aw, d, 0.58), (s_ * (w / 2 - aw / 2), 0, 0.08 + 0.29), F, r=0.1, crown=0.015, seed=seed + s_))
    parts.append(soft_box(name + " back", (w, 0.22, 0.74), (0, d / 2 - 0.11, 0.08 + 0.37), F, r=0.1, crown=0.012, seed=seed + 5))
    parts.append(soft_box(name + " seat", (w - 2 * aw, d - 0.24, 0.15), (0, -0.11, 0.32 + 0.075), F, r=0.06, crown=0.025, seed=seed + 2))
    parts.append(soft_box(name + " back cushion", (w - 2 * aw - 0.02, 0.2, 0.42), (0, d / 2 - 0.32, 0.47 + 0.21), F, r=0.08, crown=0.02, bulge=0.012, tilt=math.radians(-12), seed=seed + 3))
    parts.append(soft_box(name + " pillow", (0.44, 0.15, 0.4), (0.0, d / 2 - 0.5, 0.47 + 0.2), fabric("pillow linen", (0.78, 0.74, 0.66), "linen"), r=0.07, crown=0.04, bulge=0.03, tilt=math.radians(-16), seed=seed + 4, yaw=0.12))
    return _piece(name, loc, rot_z, parts)


def daybed(name, loc, rot_z, length=2.3, width=1.1, fabric_mat=None, frame_mat=None, seed=3):
    """a daybed on a low walnut frame: a deep mattress cushion, a bolster at one end"""
    F = fabric_mat or fabric("daybed linen", (0.70, 0.66, 0.58), "linen"); W = frame_mat or lib.wood("daybed walnut", (0.20, 0.12, 0.07), (0.10, 0.06, 0.035), 0.4)
    parts = [soft_box(name + " frame", (length, width, 0.22), (0, 0, 0.11 + 0.05), W, r=0.02, crown=0, bulge=0, crease=0, sub=1)]
    for x in (-length / 2 + 0.1, length / 2 - 0.1):
        for y in (-width / 2 + 0.1, width / 2 - 0.1): parts.append(soft_box(name + " foot", (0.06, 0.06, 0.06), (x, y, 0.03), W, r=0.01, crown=0, bulge=0, crease=0, sub=0))
    parts.append(soft_box(name + " mattress", (length - 0.04, width - 0.04, 0.17), (0, 0, 0.27 + 0.085), F, r=0.07, crown=0.02, seed=seed))
    parts.append(welt(name + " welt", length - 0.08, width - 0.08, 0.075, (0, 0, 0.27 + 0.085), F))
    bl = bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.13, depth=width - 0.12, location=(0, 0, 0)); o = bpy.context.active_object
    o.name = name + " bolster"; o.rotation_euler = (math.pi / 2, 0, 0); o.location = (length / 2 - 0.2, 0, 0.44 + 0.12); o.data.materials.append(F)
    for p in o.data.polygons: p.use_smooth = True
    bv = o.modifiers.new("bevel", "BEVEL"); bv.width = 0.04; bv.segments = 4; sd = o.modifiers.new("sub", "SUBSURF"); sd.levels = 1; sd.render_levels = 2
    parts.append(o)
    return _piece(name, loc, rot_z, parts)


def ottoman(name, loc, d=1.2, h=0.42, fabric_mat=None, round_=True, seed=4):
    """a big ottoman: a drum (or a square) of upholstery, its top tufted soft"""
    F = fabric_mat or fabric("ottoman leather", (0.36, 0.22, 0.13), "leather"); parts = []
    if round_:
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=d / 2, depth=h - 0.06, location=(0, 0, 0.06 + (h - 0.06) / 2)); o = bpy.context.active_object
        o.name = name + " drum"; o.data.materials.append(F)
        for p in o.data.polygons: p.use_smooth = True
        bv = o.modifiers.new("bevel", "BEVEL"); bv.width = 0.06; bv.segments = 5; bv.limit_method = "ANGLE"
        sd = o.modifiers.new("sub", "SUBSURF"); sd.levels = 1; sd.render_levels = 2; parts.append(o)
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=d / 2 - 0.05, depth=0.06, location=(0, 0, 0.03)); pl = bpy.context.active_object
        pl.name = name + " plinth"; pl.data.materials.append(lib.principled("sofa plinth", (0.02, 0.018, 0.016), 0.6)); parts.append(pl)
    else:
        parts.append(_plinth(name + " plinth", d, d, 0.06, lib.principled("sofa plinth", (0.02, 0.018, 0.016), 0.6), None))
        parts.append(soft_box(name + " top", (d, d, h - 0.06), (0, 0, 0.06 + (h - 0.06) / 2), F, r=0.07, crown=0.02, seed=seed))
    return _piece(name, loc, 0.0, parts)


def bench(name, loc, rot_z, length=2.0, depth=0.55, h=0.46, fabric_mat=None, leg_mat=None, seed=5):
    """an upholstered bench on slim bronze legs (the foot of a bed, a hall)"""
    F = fabric_mat or fabric("bench velvet", (0.46, 0.38, 0.30), "velvet"); Lm = leg_mat or metal("bronze legs", (0.32, 0.22, 0.13), 0.3)
    parts = [soft_box(name + " seat", (length, depth, 0.16), (0, 0, h - 0.08), F, r=0.05, crown=0.015, seed=seed)]
    parts.append(soft_box(name + " frame", (length - 0.04, depth - 0.04, 0.05), (0, 0, h - 0.18), Lm, r=0.008, crown=0, bulge=0, crease=0, sub=0))
    for x in (-length / 2 + 0.08, length / 2 - 0.08):
        for y in (-depth / 2 + 0.06, depth / 2 - 0.06):
            parts.append(soft_box(name + " leg", (0.03, 0.03, h - 0.2), (x, y, (h - 0.2) / 2), Lm, r=0.006, crown=0, bulge=0, crease=0, sub=0))
    return _piece(name, loc, rot_z, parts)


def dining_chair(name, loc, rot_z, fabric_mat=None, wood_mat=None, seed=6):
    """a generous dining chair: 58 cm wide, an upholstered seat and a high curved back, walnut legs"""
    F = fabric_mat or fabric("dining velvet", (0.52, 0.44, 0.34), "velvet"); W = wood_mat or lib.wood("chair walnut", (0.20, 0.12, 0.07), (0.10, 0.06, 0.035), 0.4)
    parts = [soft_box(name + " seat", (0.58, 0.56, 0.1), (0, -0.02, 0.47), F, r=0.04, crown=0.02, seed=seed)]
    parts.append(soft_box(name + " back", (0.56, 0.1, 0.56), (0, 0.25, 0.8), F, r=0.045, crown=0.01, tilt=math.radians(-8), seed=seed + 1, bend=1.2))
    for (x, y) in ((-0.25, -0.24), (0.25, -0.24), (-0.25, 0.24), (0.25, 0.24)):
        lg = soft_box(name + " leg", (0.04, 0.04, 0.43), (x, y, 0.215), W, r=0.012, crown=0, bulge=0, crease=0, sub=1); parts.append(lg)
    return _piece(name, loc, rot_z, parts)


def desk_chair(name, loc, rot_z, fabric_mat=None, seed=7):
    """an executive chair: a deep leather shell with its cushions, on a bronze swivel base of five spokes"""
    F = fabric_mat or fabric("desk leather", (0.24, 0.13, 0.07), "leather"); Bz = metal("bronze base", (0.30, 0.21, 0.12), 0.28)
    parts = [soft_box(name + " seat", (0.62, 0.6, 0.12), (0, 0, 0.5), F, r=0.05, crown=0.02, seed=seed)]
    parts.append(soft_box(name + " back", (0.6, 0.12, 0.66), (0, 0.3, 0.9), F, r=0.06, crown=0.015, tilt=math.radians(-10), seed=seed + 1, bend=0.9))
    for s in (-1, 1): parts.append(soft_box(name + " arm", (0.08, 0.5, 0.22), (s * 0.33, 0.02, 0.65), F, r=0.035, crown=0.01, seed=seed + 2))
    parts.append(soft_box(name + " column", (0.06, 0.06, 0.32), (0, 0, 0.27), Bz, r=0.02, crown=0, bulge=0, crease=0, sub=1))
    for k in range(5):
        a = 2 * math.pi * k / 5
        parts.append(soft_box(name + " spoke", (0.34, 0.05, 0.035), (0.17 * math.cos(a), 0.17 * math.sin(a), 0.06), Bz, r=0.012, crown=0, bulge=0, crease=0, sub=1, yaw=a))
    return _piece(name, loc, rot_z, parts)
