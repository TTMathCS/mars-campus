"""Furniture and things made here, to measure: the grand piano, the bookcases and their books, tables, chairs, lamps,
the rug, cushions and paintings."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
import lib


def empty(name, loc=(0, 0, 0), rot_z=0.0, parent=None):
    e = lib.link(bpy.data.objects.new(name, None)); e.location = loc; e.rotation_euler = (0, 0, rot_z)
    if parent: e.parent = parent
    return e


def parent_all(objs, p):
    for o in objs: o.parent = p
    return p


def catmull(pts, n=6):
    """a smooth curve through the points"""
    out = []
    for i in range(len(pts) - 1):
        p0 = Vector(pts[max(i - 1, 0)]); p1 = Vector(pts[i]); p2 = Vector(pts[i + 1]); p3 = Vector(pts[min(i + 2, len(pts) - 1)])
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)))
    out.append(tuple(pts[-1])); return out


def offset_poly(pts, d):
    """move each corner of a counter-clockwise outline inwards by d"""
    n = len(pts); out = []
    for i in range(n):
        a = Vector(pts[i - 1]); b = Vector(pts[i]); c = Vector(pts[(i + 1) % n])
        e1 = (b - a).normalized(); e2 = (c - b).normalized()
        n1 = Vector((-e1.y, e1.x)); n2 = Vector((-e2.y, e2.x)); nm = (n1 + n2)
        nm = nm.normalized() if nm.length > 1e-6 else n1
        s = d / max(0.3, nm.dot(n1)); out.append(tuple(b + nm * s))
    return out


def ring_prism(name, outer, inner, z0, z1, mat):
    bm = bmesh.new(); n = len(outer)
    ob = [bm.verts.new((p[0], p[1], z0)) for p in outer]; ot = [bm.verts.new((p[0], p[1], z1)) for p in outer]
    ib = [bm.verts.new((p[0], p[1], z0)) for p in inner]; it = [bm.verts.new((p[0], p[1], z1)) for p in inner]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((ob[i], ob[j], ot[j], ot[i])); bm.faces.new((it[i], it[j], ib[j], ib[i]))
        bm.faces.new((ot[i], ot[j], it[j], it[i])); bm.faces.new((ib[i], ib[j], ob[j], ob[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return lib.mesh_obj(name, bm, mat, smooth=True)


def lathe(name, prof, mat, segs=48, loc=(0, 0, 0), smooth=True):
    """turn a profile [(r, z), ...] round the z axis"""
    bm = bmesh.new(); rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs; rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
    for k in range(segs):
        r0, r1 = rings[k], rings[(k + 1) % segs]
        for i in range(len(prof) - 1):
            bm.faces.new((r0[i], r1[i], r1[i + 1], r0[i + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = lib.mesh_obj(name, bm, mat, smooth=smooth); o.location = loc; return o


# ---------------------------------------------------------------- the grand piano
def piano(loc, rot_z, M):
    """a concert grand of about 2.1 m (as a Steinway B): local origin at the front corner on the bass side, x towards
    the treble, y towards the tail; the lid open on its long stick"""
    P = empty("piano", loc, rot_z); parts = []
    bent = [(1.48, 0.45), (1.47, 0.62), (1.42, 0.78), (1.32, 0.95), (1.18, 1.13), (1.04, 1.32), (0.93, 1.52), (0.85, 1.70), (0.77, 1.86), (0.66, 1.98), (0.50, 2.07), (0.32, 2.11), (0.15, 2.10), (0.05, 2.06), (0.0, 1.98)]
    O = [(0.0, 0.0), (1.48, 0.0)] + catmull(bent, 5) + [(0.0, 1.0)]
    I = offset_poly(O, 0.045)
    parts.append(lib.poly_prism("piano case", O, 0.60, 0.80, M["lacquer"], bevel=0.006))
    parts.append(ring_prism("piano rim", O, I, 0.80, 0.985, M["lacquer"]))
    parts.append(lib.poly_prism("piano soundboard", I, 0.80, 0.81, M["spruce"]))
    plate = offset_poly(I, 0.06); plate = [p for p in plate]
    parts.append(lib.poly_prism("piano plate", plate, 0.84, 0.865, M["plate"], bevel=0.004))
    # keyboard
    bm = bmesh.new(); W = 1.24 / 52
    for i in range(52):
        x0 = 0.12 + i * W; lib.bm_box(bm, (W - 0.0012, 0.15, 0.022), (x0 + W / 2, -0.225, 0.711))
    kw = lib.mesh_obj("piano white keys", bm, M["ivory"]); lib.bevel_mod(kw, 0.0015, 2); parts.append(kw)
    bm = bmesh.new()
    for i in range(51):
        if "ABCDEFG"[i % 7] in "ACDFG":
            x = 0.12 + (i + 1) * W; lib.bm_box(bm, (0.0115, 0.095, 0.03), (x, -0.1975, 0.72))
    kb = lib.mesh_obj("piano black keys", bm, M["ebony"]); lib.bevel_mod(kb, 0.0015, 2); parts.append(kb)
    parts.append(lib.box("piano key bed", (1.24, 0.30, 0.10), (0.74, -0.15, 0.65), M["lacquer"]))
    parts.append(lib.box("piano fallboard", (1.24, 0.05, 0.085), (0.74, -0.125, 0.765), M["lacquer"], bevel=0.004))
    for x in (0.06, 1.42): parts.append(lib.box("piano cheek", (0.12, 0.32, 0.21), (x, -0.16, 0.705), M["lacquer"], bevel=0.01))
    parts.append(lib.box("piano key slip", (1.48, 0.02, 0.06), (0.74, -0.32, 0.685), M["lacquer"], bevel=0.004))
    md = lib.box("piano music desk", (0.86, 0.018, 0.30), (0, 0, 0), M["lacquer"], bevel=0.004); md.location = (0.74, 0.22, 1.13); md.rotation_euler = (math.radians(-14), 0, 0); parts.append(md)
    parts.append(lib.box("piano desk ledge", (0.86, 0.06, 0.015), (0.74, 0.19, 0.985), M["lacquer"], bevel=0.003))
    # the lid, hinged along the straight side, open at 36 degrees
    lid_pts = [p for p in O if p[1] >= 0.06]; lid_pts = [(0.0, 0.06), (1.48, 0.06)] + [p for p in lid_pts if p[1] > 0.06]
    H = empty("piano hinge", (0.0, 0.0, 0.985), 0.0); H.rotation_euler = (0, math.radians(-36), 0); parts.append(H)
    lid = lib.poly_prism("piano lid", lid_pts, 0.0, 0.022, M["lacquer"], bevel=0.005); lid.parent = H
    th = math.radians(36); top = Vector((1.18 * math.cos(th), 1.05, 0.985 + 1.18 * math.sin(th) - 0.005)); base = Vector((1.19, 1.05, 0.985))
    d = top - base; st = lib.cyl("piano stick", 0.011, d.length, base, M["lacquer"], verts=16)
    st.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); parts.append(st)
    # legs, lyre and pedals
    for x, y in ((0.07, -0.20), (1.41, -0.20), (0.32, 1.80)):
        parts.append(lib.cyl("piano leg", 0.085, 0.55, (x, y, 0.05), M["lacquer"], verts=4, r2=0.065, rot=(0, 0, math.pi / 4), smooth=False))
        parts.append(lib.cyl("piano caster", 0.032, 0.05, (x, y, 0.0), M["brass"], verts=24))
    for x in (0.68, 0.80): parts.append(lib.cyl("piano lyre post", 0.013, 0.50, (x, 0.12, 0.11), M["lacquer"], verts=16))
    parts.append(lib.box("piano lyre box", (0.36, 0.12, 0.08), (0.74, 0.12, 0.08), M["lacquer"], bevel=0.008))
    for x in (0.66, 0.74, 0.82): parts.append(lib.box("piano pedal", (0.03, 0.14, 0.012), (x, 0.01, 0.085), M["brass"], bevel=0.004))
    # the bench
    parts.append(lib.box("piano bench top", (0.78, 0.36, 0.05), (0.74, -0.80, 0.475), M["leather"], bevel=0.015))
    parts.append(lib.box("piano bench frame", (0.80, 0.38, 0.07), (0.74, -0.80, 0.415), M["lacquer"], bevel=0.006))
    for x in (0.39, 1.09):
        for y in (-0.95, -0.65): parts.append(lib.box("piano bench leg", (0.045, 0.045, 0.38), (x, y, 0.19), M["lacquer"], bevel=0.004))
    for o in parts:
        if o.parent is None: o.parent = P
    return P


# ---------------------------------------------------------------- books and bookcases
import os
SPINES = os.path.join(lib.ASSETS, "spines.png")      # the atlas of spines from make_spines.py


def uv_book(bm, verts, rnd, lying=False):
    """give one book (a box just added to bm) a spine from the atlas: its spine (the face looking at the room, -y)
    the whole cell, read top to bottom; its head and tail the page edges; its covers plain cloth from the same cell"""
    uv = bm.loops.layers.uv.verify()
    k = rnd.randrange(127); cx, cy = k % 32, k // 32
    u0, u1 = cx / 32.0, (cx + 1) / 32.0; v1 = 1.0 - cy / 4.0; v0 = v1 - 0.25
    xs = [v.co.x for v in verts]; zs = [v.co.z for v in verts]; x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs)
    for f in {f for v in verts for f in v.link_faces}:
        f.normal_update(); n = f.normal
        for l in f.loops:
            p = l.vert.co
            if n.y < -0.7:
                sx = (p.x - x0) / max(1e-6, x1 - x0); sz = (p.z - z0) / max(1e-6, z1 - z0)
                s, t = (sz, 1.0 - sx) if lying else (sx, sz)
                l[uv].uv = (u0 + (0.06 + 0.88 * s) * (u1 - u0), v0 + (0.015 + 0.97 * t) * (v1 - v0))
            elif (abs(n.z) > 0.7 and not lying) or (abs(n.x) > 0.7 and lying):
                l[uv].uv = (31.5 / 32.0, 0.125)                                 # the page edges' cell
            else:
                l[uv].uv = (u0 + 0.03 * (u1 - u0), v0 + 0.5 * (v1 - v0))     # plain cloth


def book_material():
    """one material for every book: a spine from the atlas (spines.png, gold leaf where spines_gold.png is white), or
    without the atlas, a colour per book from a palette of real cloth bindings"""
    m, nt = lib._mat("book bindings")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.55
    if os.path.exists(SPINES):
        uvn = nt.nodes.new("ShaderNodeUVMap")
        img = lib._tex(nt, SPINES); img.interpolation = "Cubic"; L.new(uvn.outputs["UV"], img.inputs["Vector"])
        gold = lib._tex(nt, SPINES.replace("spines.png", "spines_gold.png"), "Non-Color"); L.new(uvn.outputs["UV"], gold.inputs["Vector"])
        L.new(img.outputs["Color"], b.inputs["Base Color"]); L.new(gold.outputs["Color"], b.inputs["Metallic"])
        rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.62; rr.inputs["To Max"].default_value = 0.3; L.new(gold.outputs["Color"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
        tc = nt.nodes.new("ShaderNodeTexCoord"); n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 900; L.new(tc.outputs["Object"], n.inputs["Vector"])
        bmp = nt.nodes.new("ShaderNodeBump"); bmp.inputs["Strength"].default_value = 0.12; L.new(n.outputs["Fac"], bmp.inputs["Height"]); L.new(bmp.outputs["Normal"], b.inputs["Normal"])
        return m
    geo = nt.nodes.new("ShaderNodeNewGeometry"); cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.interpolation = "CONSTANT"
    pal = [(0.22, 0.035, 0.03), (0.13, 0.03, 0.035), (0.025, 0.04, 0.10), (0.035, 0.08, 0.045), (0.42, 0.28, 0.09), (0.58, 0.52, 0.40), (0.018, 0.018, 0.018),
           (0.22, 0.22, 0.21), (0.33, 0.21, 0.11), (0.70, 0.67, 0.60), (0.035, 0.13, 0.13), (0.12, 0.06, 0.035), (0.50, 0.12, 0.05), (0.62, 0.58, 0.50), (0.05, 0.05, 0.06)]
    els = cr.color_ramp.elements; els[0].position = 0.0; els[0].color = (*pal[0], 1); els[1].position = 1 / len(pal); els[1].color = (*pal[1], 1)
    for i in range(2, len(pal)): e = els.new(i / len(pal)); e.color = (*pal[i], 1)
    L.new(geo.outputs["Random Per Island"], cr.inputs["Fac"])
    hs = nt.nodes.new("ShaderNodeHueSaturation"); L.new(cr.outputs["Color"], hs.inputs["Color"])
    wn = nt.nodes.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "1D"; L.new(lib._math(nt, "MULTIPLY", geo.outputs["Random Per Island"], 91.7), wn.inputs["W"])
    L.new(lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", wn.outputs["Value"], 0.4), 0.8), hs.inputs["Value"])
    L.new(hs.outputs["Color"], b.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.35; rr.inputs["To Max"].default_value = 0.75; L.new(wn.outputs["Value"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 400; bmp = nt.nodes.new("ShaderNodeBump"); bmp.inputs["Strength"].default_value = 0.15; L.new(n.outputs["Fac"], bmp.inputs["Height"]); L.new(bmp.outputs["Normal"], b.inputs["Normal"])
    return m


def fill_shelf(bm, rnd, x0, x1, y_back, depth, z, gap, decor):
    """books standing along one shelf from x0 to x1, spines to the front (-y), now and then a pile lying down or a gap
    with an ornament in it; the shelf's front edge is at y_back - depth"""
    x = x0 + rnd.uniform(0.0, 0.05)
    while x < x1 - 0.03:
        r = rnd.random()
        if r < 0.10 and x1 - x > 0.4:                       # a gap with an ornament
            w = rnd.uniform(0.22, 0.38); decor.append((x + w / 2, z, min(gap - 0.05, rnd.uniform(0.16, 0.3)))); x += w; continue
        if r < 0.17 and x1 - x > 0.35:                      # a pile lying down
            w = rnd.uniform(0.2, 0.28); h = 0.0
            for k in range(rnd.randint(2, 5)):
                t = rnd.uniform(0.025, 0.05); bw = w - rnd.uniform(0, 0.04); d = rnd.uniform(0.15, 0.22)
                vs = lib.bm_box(bm, (bw, d, t - 0.002), (x + w / 2 + rnd.uniform(-0.01, 0.01), y_back - 0.03 - d / 2, z + h + t / 2), rot_z=rnd.uniform(-0.05, 0.05)); h += t
                uv_book(bm, vs, rnd, lying=True)
            x += w + 0.02; continue
        # a run of standing books
        for k in range(rnd.randint(6, 22)):
            t = rnd.uniform(0.018, 0.055); h = min(gap - 0.03, rnd.uniform(0.19, 0.33) if rnd.random() < 0.85 else rnd.uniform(0.33, 0.40))
            d = min(depth - 0.04, h * rnd.uniform(0.62, 0.75)); front = y_back - depth + rnd.uniform(0.015, 0.04)
            if x + t > x1: break
            vs = lib.bm_box(bm, (t - 0.0015, d, h), (x + t / 2, front + d / 2, z + h / 2)); x += t
            uv_book(bm, vs, rnd)
        if rnd.random() < 0.35 and x < x1 - 0.1:              # the last one leaning
            t = rnd.uniform(0.02, 0.04); h = min(gap - 0.04, rnd.uniform(0.2, 0.3)); a = rnd.uniform(0.15, 0.3)
            vs = lib.bm_box(bm, (t, min(depth - 0.05, 0.2), h), (0, 0, 0)); uv_book(bm, vs, rnd)
            bmesh.ops.transform(bm, matrix=Matrix.Translation((x + h * math.sin(a) / 2 + t / 2, y_back - depth / 2 - 0.02, z + h * math.cos(a) / 2 + t * math.sin(a) / 2)) @ Matrix.Rotation(-a, 4, "Y"), verts=vs)
            x += h * math.sin(a) + t + 0.01
        x += rnd.uniform(0.0, 0.08)


def ceramic(name, color, rough=0.3):
    return lib.principled(name, color, rough, **{"Coat Weight": 0.6, "Coat Roughness": 0.08})


def ornament(name, x, y, z, h, rnd, mats):
    """a vase, a bowl or a stack of two boxes"""
    k = rnd.random()
    if k < 0.55:
        r = h * rnd.uniform(0.22, 0.32)
        prof = [(0.0, 0), (r * 0.7, 0), (r, h * 0.25), (r * 0.95, h * 0.55), (r * 0.45, h * 0.85), (r * 0.42, h), (r * 0.38, h), (r * 0.36, h * 0.9), (0.0, h * 0.9)]
        return lathe(name, prof, rnd.choice(mats), 40, (x, y, z))
    if k < 0.85:
        r = rnd.uniform(0.09, 0.14); hh = r * 0.5
        prof = [(0.0, 0), (r * 0.45, 0), (r * 0.9, hh * 0.6), (r, hh), (r * 0.95, hh), (r * 0.85, hh * 0.65), (r * 0.4, hh * 0.15), (0.0, hh * 0.15)]
        return lathe(name, prof, rnd.choice(mats), 40, (x, y, z))
    return lib.cyl(name, h * 0.18, h * 0.6, (x, y, z), rnd.choice(mats), verts=6, smooth=False)


def bookcase(name, cx, width, y_back, depth, height, M, rnd, books_bm, decor):
    """a built-in walnut case, cupboards below, open shelves above; books go into books_bm"""
    objs = []; t = 0.035; zc = 0.78; levels = [zc, 1.22, 1.66, 2.10, 2.54, 2.98, 3.40]
    yc = y_back - depth / 2; x0, x1 = cx - width / 2, cx + width / 2
    objs.append(lib.box(name + " back", (width, 0.02, height), (cx, y_back - 0.01, height / 2), M["walnut_v"]))
    for x in (x0 + t / 2, cx, x1 - t / 2): objs.append(lib.box(name + " side", (t, depth, height), (x, yc, height / 2), M["walnut_v"], bevel=0.002))
    for z in levels: objs.append(lib.box(name + " shelf", (width, depth, t), (cx, yc, z - t / 2), M["walnut"], bevel=0.002))
    objs.append(lib.box(name + " plinth", (width, depth - 0.04, 0.08), (cx, yc + 0.02, 0.04), M["shadow"]))
    for k in range(4):                                              # cupboard doors
        dw = (width - 2 * t) / 4; dx = x0 + t + dw * (k + 0.5)
        objs.append(lib.box(name + " door", (dw - 0.006, 0.022, zc - t - 0.09), (dx, y_back - depth - 0.011 + 0.022, 0.08 + (zc - t - 0.08) / 2), M["walnut"], bevel=0.002))
        objs.append(lib.box(name + " knob", (0.012, 0.02, 0.12), (dx + (dw / 2 - 0.05) * (1 if k % 2 == 0 else -1), y_back - depth - 0.01, zc - t - 0.18), M["brass"], bevel=0.003))
    for i, z in enumerate(levels[:-1]):
        gap = levels[i + 1] - z - t
        for bx0, bx1 in ((x0 + t, cx - t / 2), (cx + t / 2, x1 - t)):
            if rnd.random() < 0.12: continue
            fill_shelf(books_bm, rnd, bx0 + 0.01, bx1 - 0.01, y_back - 0.02, depth - 0.02, z, gap, decor)
    return objs


# ---------------------------------------------------------------- tables, chairs, lamps, rug, cushions, paintings
def side_table(name, loc, M, r=0.27, h=0.55):
    P = empty(name, loc)
    for o in (lib.cyl(name + " top", r, 0.03, (0, 0, h - 0.03), M["marble"], verts=64, bevel=0.006),
              lib.cyl(name + " stem", 0.028, h - 0.05, (0, 0, 0.02), M["bronze"], verts=24),
              lib.cyl(name + " foot", r * 0.6, 0.02, (0, 0, 0), M["bronze"], verts=48, bevel=0.004)):
        o.parent = P
    return P


def table_lamp(name, loc, M, warm=(1.0, 0.70, 0.45), watts=35, shade_r=0.21):
    """a glazed stoneware base, a brass stem and a linen drum shade with a bulb in it"""
    P = empty(name, loc); h = 0.36
    base = lathe(name + " base", [(0.0, 0), (0.07, 0), (0.12, 0.06), (0.14, 0.15), (0.12, 0.25), (0.06, 0.32), (0.035, 0.36), (0.0, 0.36)], M["glaze"], 48)
    stem = lib.cyl(name + " stem", 0.008, 0.26, (0, 0, h), M["brass"], verts=16)
    sh = lathe(name + " shade", [(shade_r, h + 0.14), (shade_r - 0.015, h + 0.42)], M["shade"], 64)
    bulb = lib.cyl(name + " bulb", 0.03, 0.06, (0, 0, h + 0.2), lib.emission("bulb", warm, 60), verts=16)
    li = lib.point_light(name + " light", (0, 0, h + 0.25), watts, warm, 0.04)
    for o in (base, stem, sh, bulb, li): o.parent = P
    return P


def floor_lamp(name, loc, M, warm=(1.0, 0.70, 0.45), watts=45):
    P = empty(name, loc)
    parts = [lib.cyl(name + " foot", 0.17, 0.025, (0, 0, 0), M["bronze"], verts=48, bevel=0.005), lib.cyl(name + " pole", 0.012, 1.42, (0, 0, 0.025), M["brass"], verts=16),
             lathe(name + " shade", [(0.23, 1.38), (0.21, 1.70)], M["shade"], 64), lib.cyl(name + " bulb", 0.03, 0.06, (0, 0, 1.47), lib.emission("bulb", warm, 60), verts=16),
             lib.point_light(name + " light", (0, 0, 1.52), watts, warm, 0.04)]
    for o in parts: o.parent = P
    return P


def dining_chair(name, loc, rot_z, M):
    P = empty(name, loc, rot_z); parts = []
    for x in (-0.2, 0.2):
        for y in (-0.2, 0.2): parts.append(lib.box(name + " leg", (0.035, 0.035, 0.45), (x, y, 0.225), M["walnut"], bevel=0.004))
    parts.append(lib.box(name + " seat", (0.48, 0.50, 0.09), (0, -0.01, 0.49), M["linen"], bevel=0.028, segs=4))
    b = lib.box(name + " back", (0.48, 0.075, 0.52), (0, 0, 0), M["linen"], bevel=0.028, segs=4); b.location = (0, 0.235, 0.80); b.rotation_euler = (math.radians(-7), 0, 0); parts.append(b)
    for o in parts: o.parent = P
    return P


def rug(name, size, loc, M):
    o = lib.box(name, (size[0], size[1], 0.014), (loc[0], loc[1], 0.007), M["rug"], bevel=0.006, segs=2)
    return o


def rug_material(name="rug", base=(0.50, 0.46, 0.40), band=(0.20, 0.17, 0.14)):
    """a hand-knotted wool rug: a plain field with a narrow border, a soft pile"""
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 1.0; b.inputs["Sheen Weight"].default_value = 1.0; b.inputs["Sheen Roughness"].default_value = 0.5
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Generated"], sep.inputs[0])
    def edge(v, a, w):
        # 1 inside a band from a to a + w (in generated 0..1 units) measured from either edge
        dist = lib._math(nt, "MINIMUM", v, lib._math(nt, "SUBTRACT", 1.0, v))
        return lib._math(nt, "MULTIPLY", lib._math(nt, "GREATER_THAN", dist, a), lib._math(nt, "LESS_THAN", dist, a + w))
    bx = edge(sep.outputs[0], 0.035, 0.012); by = edge(sep.outputs[1], 0.045, 0.016)
    inx = lib._math(nt, "MULTIPLY", lib._math(nt, "GREATER_THAN", lib._math(nt, "MINIMUM", sep.outputs[0], lib._math(nt, "SUBTRACT", 1.0, sep.outputs[0])), 0.035), lib._math(nt, "GREATER_THAN", lib._math(nt, "MINIMUM", sep.outputs[1], lib._math(nt, "SUBTRACT", 1.0, sep.outputs[1])), 0.045))
    band_mask = lib._math(nt, "MINIMUM", lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", bx, lib._math(nt, "GREATER_THAN", lib._math(nt, "MINIMUM", sep.outputs[1], lib._math(nt, "SUBTRACT", 1.0, sep.outputs[1])), 0.045)), lib._math(nt, "MULTIPLY", by, lib._math(nt, "GREATER_THAN", lib._math(nt, "MINIMUM", sep.outputs[0], lib._math(nt, "SUBTRACT", 1.0, sep.outputs[0])), 0.035))), 1.0)
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 2.5; n.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], n.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", n.outputs["Fac"], 0.35), mx.inputs["Factor"]); mx.inputs[6].default_value = (*base, 1); mx.inputs[7].default_value = (base[0] * 0.82, base[1] * 0.8, base[2] * 0.78, 1)
    mb = nt.nodes.new("ShaderNodeMix"); mb.data_type = "RGBA"; L.new(band_mask, mb.inputs["Factor"]); L.new(mx.outputs[2], mb.inputs[6]); mb.inputs[7].default_value = (*band, 1)
    L.new(mb.outputs[2], b.inputs["Base Color"])
    f = nt.nodes.new("ShaderNodeTexNoise"); f.inputs["Scale"].default_value = 900; f.inputs["Detail"].default_value = 2; L.new(tc.outputs["Object"], f.inputs["Vector"])
    bmp = nt.nodes.new("ShaderNodeBump"); bmp.inputs["Strength"].default_value = 0.6; bmp.inputs["Distance"].default_value = 0.002; L.new(f.outputs["Fac"], bmp.inputs["Height"]); L.new(bmp.outputs["Normal"], b.inputs["Normal"])
    return m


def cushion(name, size, loc, rot, mat):
    """a plump cushion: a box rounded by subdivision, its middle swollen a little"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True)
    for v in bm.verts:
        c = v.co; s = (1 - abs(c.x) * 1.4) * (1 - abs(c.z) * 1.4); c.y *= 1 + 0.9 * max(0, s)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    o = lib.mesh_obj(name, bm, mat, smooth=True); sd = o.modifiers.new("sub", "SUBSURF"); sd.levels = 2; sd.render_levels = 3
    o.location = loc; o.rotation_euler = rot; return o


def painting_material(name, ground, fields):
    """a colour-field painting (in the way of Rothko): soft-edged rectangles of colour on a stained ground"""
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.8
    tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 6; nz.inputs["Detail"].default_value = 8; L.new(tc.outputs["Generated"], nz.inputs["Vector"])
    disp = nt.nodes.new("ShaderNodeVectorMath"); disp.operation = "MULTIPLY_ADD"; L.new(nz.outputs["Color"], disp.inputs[0]); disp.inputs[1].default_value = (0.025, 0.025, 0.025); disp.inputs[2].default_value = (-0.0125, -0.0125, -0.0125)
    add = nt.nodes.new("ShaderNodeVectorMath"); add.operation = "ADD"; L.new(tc.outputs["Generated"], add.inputs[0]); L.new(disp.outputs[0], add.inputs[1])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(add.outputs[0], sep.inputs[0]); gx, gz = sep.outputs[0], sep.outputs[2]
    cur = nt.nodes.new("ShaderNodeMix"); cur.data_type = "RGBA"; cur.inputs["Factor"].default_value = 0.0; cur.inputs[6].default_value = (*ground, 1); cur.inputs[7].default_value = (*ground, 1); out = cur.outputs[2]
    for (x0, x1, z0, z1, col) in fields:
        def ss(v, a, bb):
            r = nt.nodes.new("ShaderNodeMapRange"); r.interpolation_type = "SMOOTHSTEP"; r.inputs["From Min"].default_value = a; r.inputs["From Max"].default_value = bb; L.new(v, r.inputs["Value"]); return r.outputs["Result"]
        mask = lib._math(nt, "MULTIPLY", lib._math(nt, "MULTIPLY", ss(gx, x0, x0 + 0.03), lib._math(nt, "SUBTRACT", 1.0, ss(gx, x1 - 0.03, x1))), lib._math(nt, "MULTIPLY", ss(gz, z0, z0 + 0.03), lib._math(nt, "SUBTRACT", 1.0, ss(gz, z1 - 0.03, z1))))
        n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 3; n2.inputs["Detail"].default_value = 10; L.new(tc.outputs["Generated"], n2.inputs["Vector"])
        shade = nt.nodes.new("ShaderNodeMix"); shade.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", n2.outputs["Fac"], 0.5), shade.inputs["Factor"]); shade.inputs[6].default_value = (*col, 1); shade.inputs[7].default_value = (col[0] * 0.7, col[1] * 0.7, col[2] * 0.7, 1)
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", mask, 0.93), mx.inputs["Factor"]); L.new(out, mx.inputs[6]); L.new(shade.outputs[2], mx.inputs[7]); out = mx.outputs[2]
    L.new(out, b.inputs["Base Color"])
    w = nt.nodes.new("ShaderNodeTexNoise"); w.inputs["Scale"].default_value = 500; L.new(tc.outputs["Object"], w.inputs["Vector"])
    bmp = nt.nodes.new("ShaderNodeBump"); bmp.inputs["Strength"].default_value = 0.2; L.new(w.outputs["Fac"], bmp.inputs["Height"]); L.new(bmp.outputs["Normal"], b.inputs["Normal"])
    return m


def painting(name, w, h, loc, rot_z, mat, frame):
    P = empty(name, loc, rot_z)
    c = lib.box(name + " canvas", (w, 0.04, h), (0, 0, 0), mat); c.parent = P
    for sx, sz, px, pz in ((w + 0.04, 0.02, 0, h / 2 + 0.01), (w + 0.04, 0.02, 0, -h / 2 - 0.01), (0.02, h, w / 2 + 0.01, 0), (0.02, h, -w / 2 - 0.01, 0)):
        f = lib.box(name + " frame", (sx, 0.05, sz), (px, 0.005, pz), frame); f.parent = P
    return P


# ---------------------------------------------------------------- trees and curtains
def olive_tree(name, loc, seed, M, height=3.2, leaves=16000, kind="olive"):
    """an olive tree: a gnarled trunk that forks into branches, and narrow grey-green leaves in clouds at their ends.
    kind="lemon": the same tree with broad glossy leaves (M["lemon_leaf"]) and lemons among them"""
    rnd = random.Random(seed); bm = bmesh.new(); pts = []
    def g(mu, s): return mu + max(-2 * s, min(2 * s, rnd.gauss(0, s)))      # leaves stay near their branch: no strays in the air
    def seg(p, d, length, r0, r1):
        q = p + d * length
        n = 7; ring0 = []; ring1 = []
        z = d.normalized(); x = z.orthogonal().normalized(); y = z.cross(x)
        for i in range(n):
            a = 2 * math.pi * i / n; ca, sa = math.cos(a), math.sin(a)
            ring0.append(bm.verts.new(p + (x * ca + y * sa) * r0)); ring1.append(bm.verts.new(q + (x * ca + y * sa) * r1))
        for i in range(n):
            j = (i + 1) % n; bm.faces.new((ring0[i], ring0[j], ring1[j], ring1[i]))
        return q
    def grow(p, d, length, r, depth):
        # a branch bends a little along its length
        k = 3; cur = p
        for i in range(k):
            dd = (d + Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25), rnd.uniform(-0.1, 0.15)))).normalized()
            nr = r * (1 - 0.12 * (i + 1) / k); cur = seg(cur, dd, length / k, r, nr); r = nr; d = dd
        if depth == 0 or r < 0.008:
            for i in range(rnd.randint(170, 260)):
                pts.append(cur + Vector((g(0, 0.32), g(0, 0.32), g(0.08, 0.2))))
            return
        if depth <= 2:
            for i in range(rnd.randint(50, 90)):
                t = rnd.random(); pts.append(p.lerp(cur, t) + Vector((g(0, 0.18), g(0, 0.18), g(0.05, 0.12))))
        for i in range(rnd.randint(2, 3)):
            nd = (d + Vector((rnd.uniform(-0.9, 0.9), rnd.uniform(-0.9, 0.9), rnd.uniform(0.1, 0.6)))).normalized()
            grow(cur, nd, length * rnd.uniform(0.62, 0.8), r * rnd.uniform(0.55, 0.7), depth - 1)
    trunk_h = height * 0.38
    grow(Vector((0, 0, 0)), Vector((rnd.uniform(-0.15, 0.15), rnd.uniform(-0.15, 0.15), 1)).normalized(), trunk_h, 0.11 * height / 3.2, 5)
    wood = lib.mesh_obj(name + " wood", bm, M["bark"], smooth=True); wood.location = loc
    rnd.shuffle(pts); me = bpy.data.meshes.new(name + " leaf points"); me.from_pydata([tuple(p) for p in pts[:leaves]], [], []); lp = lib.link(bpy.data.objects.new(name + " leaves", me)); lp.location = loc
    leaf = bpy.data.objects.get(kind + " leaf")
    if leaf is None:
        import atrium
        leaf = atrium.leaf_object(kind + " leaf", 0.07, 0.016, M["olive_leaf"]) if kind == "olive" else atrium.leaf_object(kind + " leaf", 0.085, 0.04, M[kind + "_leaf"])
    if kind == "lemon":                       # a lemon at one leaf point in sixty
        fr = bpy.data.objects.get("lemon")
        if fr is None:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.034, location=(0, 0, -500)); fr = bpy.context.active_object; fr.name = "lemon"; fr.scale = (1.0, 1.0, 1.25)
            for p_ in fr.data.polygons: p_.use_smooth = True
            fr.data.materials.append(lib.principled("lemon skin", (0.85, 0.62, 0.05), 0.35, **{"Coat Weight": 0.3}))
        me2 = bpy.data.meshes.new(name + " fruit points"); me2.from_pydata([tuple(p) for p in pts[-max(12, min(len(pts), leaves) // 60):]], [], [])
        fp = lib.link(bpy.data.objects.new(name + " fruit", me2)); fp.location = loc
        import atrium; atrium.scatter_leaves(fp, fr, "lemons", 0.85, 1.15)
    ng = bpy.data.node_groups.get(kind + " leaves")
    if ng is None:
        ng = bpy.data.node_groups.new(kind + " leaves", "GeometryNodeTree")
        ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"); ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
        N = ng.nodes; L = ng.links; gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput")
        mp = N.new("GeometryNodeMeshToPoints"); L.new(gi.outputs[0], mp.inputs["Mesh"])
        oi = N.new("GeometryNodeObjectInfo"); oi.transform_space = "ORIGINAL"; oi.inputs["Object"].default_value = leaf
        rr = N.new("FunctionNodeRandomValue"); rr.data_type = "FLOAT_VECTOR"; rr.inputs[1].default_value = (6.283, 6.283, 6.283)
        e2r = N.new("FunctionNodeEulerToRotation"); L.new(rr.outputs[0], e2r.inputs[0])
        rs = N.new("FunctionNodeRandomValue"); rs.data_type = "FLOAT"; rs.inputs[2].default_value = 0.7; rs.inputs[3].default_value = 1.3
        inst = N.new("GeometryNodeInstanceOnPoints"); L.new(mp.outputs[0], inst.inputs["Points"]); L.new(oi.outputs["Geometry"], inst.inputs["Instance"]); L.new(e2r.outputs[0], inst.inputs["Rotation"]); L.new(rs.outputs[1], inst.inputs["Scale"])
        L.new(inst.outputs[0], go.inputs[0])
    md = lp.modifiers.new("leaves", "NODES"); md.node_group = ng
    return wood, lp


def sheer_curtain(name, x0, x1, z0, z1, mat, folds=None, depth=0.06, frame=None):
    """a sheer curtain hanging in folds along x, in the plane y = 0 of its frame (a Matrix), from z1 down to z0"""
    w = x1 - x0; n = max(8, int(w / 0.03)); folds = folds or max(2, int(w / 0.12))
    bm = bmesh.new(); top = []; bot = []
    for i in range(n + 1):
        x = x0 + w * i / n; y = depth / 2 * math.sin(2 * math.pi * folds * i / n)
        top.append(bm.verts.new((x, y, z1))); bot.append(bm.verts.new((x, y * 1.15, z0)))
    for i in range(n): bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
    o = lib.mesh_obj(name, bm, mat, smooth=True)
    if frame is not None: o.matrix_world = frame
    return o
