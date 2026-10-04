"""The club, sector 2 of L1, for Cycles: the rooms behind the cinema, for evenings with guests. Built in the sector's
frame, as the other Pentagon rooms (x along the ring, clockwise; y out from the atrium's glass; z up from L1's floor).
Ring D runs from y = 54 to 68, between the streets.

The wine cellar (L1-20): all of ring D, about 1,640 m², Arcadia's one cellar, cool and steady below ground. A tasting
room under a brick vault in the middle of the ring, a table for ten under an iron chandelier; from it two aisles run
along the ring, 44 m each way, barrel-vaulted, the bottles in racks between brick ribs and oak casks in some bays. The
brick is fired from Mars soil, as the Pentagon's panels are; the floor is terracotta from the same kilns.
  bvenv/bin/python blend/club.py <room> <cam[,cam...]|pano:stop|plan:view> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, family

A = lib.ASSETS
YC = 61.0                     # the middle of ring D
TX = 6.0                      # the tasting room: x within 6 m of the middle, y from 55 to 67
TY0, TY1 = 55.0, 67.0
TR, TZ = 12.0, 6.2            # its vault: a segmental barrel across the ring, radius 12, crown 6.2 m up
AW, AS = 2.1, 2.45            # an aisle: half its width between the walls, and where its vault springs
AX1 = 50.0                    # the aisles' far ends
BAY = 3.6                     # the bays between the ribs


def t_vault(x): return TZ - (TR - math.sqrt(TR * TR - x * x))      # the tasting room's ceiling over x


# ---------------------------------------------------------------- materials
def brick_material(name="mars brick", base=(0.40, 0.21, 0.13), dark=(0.27, 0.13, 0.08), mortar=(0.50, 0.44, 0.36), scale=1.0, plane="XZ"):
    """brick fired from Mars soil: red-brown, each brick a little different, soft lime-coloured joints, rough faces.
    plane: which two object axes the courses run in ("XZ": a wall along x; "YZ": a wall along y)"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.88
    tc = N.new("ShaderNodeTexCoord"); sp = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sp.inputs[0])
    cm = N.new("ShaderNodeCombineXYZ")
    a0, a1 = {"XZ": ("X", "Z"), "YZ": ("Y", "Z"), "XY": ("X", "Y")}[plane]
    L.new(sp.outputs[a0], cm.inputs[0]); L.new(sp.outputs[a1], cm.inputs[1])
    br = N.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0 * scale; br.inputs["Mortar Size"].default_value = 0.009; br.inputs["Mortar Smooth"].default_value = 0.2
    br.inputs["Brick Width"].default_value = 0.23; br.inputs["Row Height"].default_value = 0.075; br.offset = 0.5; br.inputs["Bias"].default_value = 0.0
    L.new(cm.outputs[0], br.inputs["Vector"])
    br.inputs["Color1"].default_value = (*base, 1); br.inputs["Color2"].default_value = (*dark, 1); br.inputs["Mortar"].default_value = (*mortar, 1)
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 14.0; n.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], n.inputs["Vector"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 0.45; L.new(br.outputs["Color"], mx.inputs[6])
    v = N.new("ShaderNodeMapRange"); v.inputs["To Min"].default_value = 0.75; v.inputs["To Max"].default_value = 1.25; L.new(n.outputs["Fac"], v.inputs["Value"])
    cc = N.new("ShaderNodeCombineColor"); L.new(v.outputs["Result"], cc.inputs[0]); L.new(v.outputs["Result"], cc.inputs[1]); L.new(v.outputs["Result"], cc.inputs[2]); L.new(cc.outputs[0], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    f = N.new("ShaderNodeTexNoise"); f.inputs["Scale"].default_value = 90.0; f.inputs["Detail"].default_value = 5; L.new(tc.outputs["Object"], f.inputs["Vector"])
    h = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", br.outputs["Fac"], -1.0), lib._math(nt, "MULTIPLY", f.outputs["Fac"], 0.25))
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.6; bm.inputs["Distance"].default_value = 0.006; L.new(h, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def terracotta():
    """the floor: square terracotta tiles from the same kilns, waxed, worn a little"""
    m, nt = lib._mat("terracotta")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.45
    tc = N.new("ShaderNodeTexCoord"); br = N.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.006
    br.inputs["Brick Width"].default_value = 0.33; br.inputs["Row Height"].default_value = 0.33; br.offset = 0.0; L.new(tc.outputs["Object"], br.inputs["Vector"])
    br.inputs["Color1"].default_value = (0.42, 0.19, 0.10, 1); br.inputs["Color2"].default_value = (0.32, 0.14, 0.075, 1); br.inputs["Mortar"].default_value = (0.30, 0.26, 0.21, 1)
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 6.0; n.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], n.inputs["Vector"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 0.5; L.new(br.outputs["Color"], mx.inputs[6])
    v = N.new("ShaderNodeMapRange"); v.inputs["To Min"].default_value = 0.7; v.inputs["To Max"].default_value = 1.3; L.new(n.outputs["Fac"], v.inputs["Value"])
    cc = N.new("ShaderNodeCombineColor"); L.new(v.outputs["Result"], cc.inputs[0]); L.new(v.outputs["Result"], cc.inputs[1]); L.new(v.outputs["Result"], cc.inputs[2]); L.new(cc.outputs[0], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    rr = N.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.3; rr.inputs["To Max"].default_value = 0.7; L.new(n.outputs["Fac"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.4; bm.inputs["Distance"].default_value = 0.004; L.new(lib._math(nt, "MULTIPLY", br.outputs["Fac"], -1.0), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def bottle_glass():
    m = lib.principled("bottle glass", (0.03, 0.07, 0.035), 0.06, **{"Transmission Weight": 0.85, "IOR": 1.5})
    return m


def capsule_material():
    """the foil over each cork: dark red, black, gold, bordeaux, cream, picked at random for each bottle"""
    m, nt = lib._mat("capsule foil")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.32; b.inputs["Metallic"].default_value = 0.6
    oi = N.new("ShaderNodeObjectInfo"); cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.interpolation = "CONSTANT"; E = cr.color_ramp.elements
    E[0].position = 0.0; E[0].color = (0.25, 0.02, 0.03, 1); E[1].position = 0.85; E[1].color = (0.62, 0.48, 0.18, 1)
    for (p, c) in ((0.3, (0.02, 0.02, 0.02, 1)), (0.5, (0.12, 0.01, 0.04, 1)), (0.7, (0.55, 0.06, 0.05, 1)), (0.93, (0.75, 0.70, 0.58, 1))):
        e = E.new(p); e.color = c
    L.new(oi.outputs["Random"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Base Color"])
    return m


def stave_wood():
    """oak staves: grain along the barrel, a dark line between staves"""
    m = lib.wood("cask oak", (0.36, 0.22, 0.12), (0.20, 0.11, 0.055), 0.6, scale=1.4, coat=0.0, along="X")
    nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]; src = b.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sp.inputs[0])
    ang = lib._math(nt, "ARCTAN2", sp.outputs["Y"], sp.outputs["Z"])
    st = lib._math(nt, "FRACT", lib._math(nt, "MULTIPLY", ang, 26 / (2 * math.pi)))
    line = lib._math(nt, "LESS_THAN", st, 0.06)
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(lib._math(nt, "MULTIPLY", line, 0.8), mx.inputs["Factor"]); L.new(src, mx.inputs[6]); mx.inputs[7].default_value = (0.04, 0.025, 0.015, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def materials(M):
    P = lib.principled
    M["brick"] = brick_material("mars brick", plane="XZ")
    M["brick_y"] = brick_material("mars brick across", plane="YZ")
    M["brick_vault"] = brick_material("mars brick vault", (0.43, 0.23, 0.14), (0.30, 0.15, 0.09), (0.55, 0.49, 0.40), plane="XY")
    M["terracotta"] = terracotta()
    M["rack"] = lib.wood("rack oak", (0.30, 0.19, 0.11), (0.17, 0.10, 0.055), 0.6, scale=1.5, coat=0.0, along="Z")
    M["rack_x"] = lib.wood("rack oak across", (0.30, 0.19, 0.11), (0.17, 0.10, 0.055), 0.6, scale=1.5, coat=0.0, along="X")
    M["table_oak"] = lib.wood("table oak", (0.33, 0.21, 0.12), (0.19, 0.11, 0.06), 0.35, scale=1.2, coat=0.4, along="X")
    M["iron"] = P("black iron", (0.035, 0.033, 0.03), 0.45, 0.85)
    M["bottle"] = bottle_glass()
    M["capsule"] = capsule_material()
    M["label"] = P("label paper", (0.78, 0.74, 0.64), 0.7)
    M["cask"] = stave_wood()
    M["hoop"] = P("cask hoop", (0.05, 0.045, 0.04), 0.5, 0.8)
    M["wine"] = lib.principled("red wine", (0.20, 0.0, 0.015), 0.02, **{"Transmission Weight": 1.0, "IOR": 1.34})
    M["crystal"] = lib.glass("crystal", (0.97, 0.97, 0.97), 0.0, 1.5)
    M["candle"] = P("candle wax", (0.86, 0.82, 0.72), 0.45, **{"Subsurface Weight": 0.6, "Subsurface Radius": (0.3, 0.2, 0.1)})
    M["flame"] = lib.emission("candle flame", (1.0, 0.62, 0.25), 18.0)
    M["bulb"] = lib.emission("warm bulb", (1.0, 0.66, 0.36), 26.0)
    return M


# ---------------------------------------------------------------- the masonry
def barrel(name, x0, x1, yc, r, zs, mat, segs=40, thick=0.3):
    """a semicircular barrel vault along x from x0 to x1, over y = yc +- r, springing at zs"""
    bm = bmesh.new(); rows = []
    for x in (x0, x1):
        inner = [bm.verts.new((x, yc - r * math.cos(math.pi * i / segs), zs + r * math.sin(math.pi * i / segs))) for i in range(segs + 1)]
        outer = [bm.verts.new((x, yc - (r + thick) * math.cos(math.pi * i / segs), zs + (r + thick) * math.sin(math.pi * i / segs))) for i in range(segs + 1)]
        rows.append((inner, outer))
    (i0, o0), (i1, o1) = rows
    for i in range(segs):
        bm.faces.new((i0[i], i0[i + 1], i1[i + 1], i1[i])); bm.faces.new((o0[i], o1[i], o1[i + 1], o0[i + 1]))
    return lib.mesh_obj(name, bm, mat, smooth=True)


def tasting_vault(M):
    """the tasting room's vault: a segmental barrel across the ring, and the end walls under it"""
    bm = bmesh.new(); n = 48; rows = []
    for y in (TY0 - 0.3, TY1 + 0.3):
        rows.append([bm.verts.new((-TX + 2 * TX * i / n, y, t_vault(-TX + 2 * TX * i / n))) for i in range(n + 1)])
    for i in range(n): bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    lib.mesh_obj("tasting vault", bm, M["brick_vault"], smooth=True)
    for y, sgn in ((TY0, -1), (TY1, 1)):
        pts = [(-TX - 0.4, 0.0)] + [(-TX + 2 * TX * i / 24, t_vault(-TX + 2 * TX * i / 24)) for i in range(25)] + [(TX + 0.4, 0.0)]
        bm = bmesh.new(); vs = [bm.verts.new((x, y + sgn * 0.15, z)) for (x, z) in pts]; f = bm.faces.new(vs)
        r = bmesh.ops.extrude_face_region(bm, geom=[f]); bmesh.ops.translate(bm, vec=(0, sgn * 0.3, 0), verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); lib.mesh_obj("tasting end wall", bm, M["brick"])
    # transverse ribs following the vault across the room
    for y in (TY0 + 0.9, YC - 2.9, YC + 2.9, TY1 - 0.9):
        bm = bmesh.new(); n = 32
        for i in range(n):
            xa, xb = -TX + 2 * TX * i / n, -TX + 2 * TX * (i + 1) / n
            p = Vector((xa, y, t_vault(xa) - 0.09)); q = Vector((xb, y, t_vault(xb) - 0.09)); d = q - p; c = (p + q) / 2
            r = bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Rotation(-math.atan2(d.z, d.x), 4, "Y") @ Matrix.Diagonal((d.length + 0.01, 0.45, 0.18, 1)), verts=r["verts"])
        lib.mesh_obj("vault rib", bm, M["brick"])


def side_wall_with_arch(M, xw, sgn):
    """the tasting room's side wall at x = xw, with the arch into the aisle"""
    n = 24; pts = []
    for i in range(n + 1):
        a = math.pi * i / n; pts.append((YC - AW * math.cos(a), AS + AW * math.sin(a)))
    for (y0, y1) in ((TY0 - 0.3, YC - AW), (YC + AW, TY1 + 0.3)):
        lib.box("tasting side wall", (0.6, y1 - y0, t_vault(xw)), (xw + sgn * 0.3, (y0 + y1) / 2, t_vault(xw) / 2), M["brick_y"])
    # over the arch: the wall from the arch to the vault
    bm = bmesh.new(); top = t_vault(xw) + 0.2           # strips from the arch's curve up to the vault
    for i in range(n):
        (ya, za), (yb, zb) = pts[i], pts[i + 1]
        v = [bm.verts.new((xw, ya, za)), bm.verts.new((xw, yb, zb)), bm.verts.new((xw, yb, top)), bm.verts.new((xw, ya, top))]
        bm.faces.new(v)
    o = lib.mesh_obj("arch spandrel", bm, M["brick_y"]); so = o.modifiers.new("thick", "SOLIDIFY"); so.thickness = 0.6; so.offset = sgn
    # the arch's ring of headers
    bm = bmesh.new()
    for i in range(n):
        (ya, za), (yb, zb) = pts[i], pts[i + 1]; c = Vector((xw, (ya + yb) / 2, (za + zb) / 2)); d = Vector((0, yb - ya, zb - za))
        r = bmesh.ops.create_cube(bm, size=1.0); M_ = Matrix.Translation(c) @ Matrix.Rotation(math.atan2(d.z, d.y), 4, "X") @ Matrix.Diagonal((0.7, d.length + 0.01, 0.12, 1))
        bmesh.ops.transform(bm, matrix=M_, verts=r["verts"])
    lib.mesh_obj("arch ring", bm, M["brick_y"])


# ---------------------------------------------------------------- bottles and casks
def bottle_object(M):
    """one Bordeaux bottle lying along +y (its neck towards +y), the foil on its neck"""
    prof = [(0.0, 0.0), (0.03, 0.0), (0.035, 0.004), (0.0375, 0.02), (0.0375, 0.205), (0.034, 0.225), (0.022, 0.245), (0.0155, 0.258), (0.0145, 0.3)]
    bm = bmesh.new(); seg = 20; rings = []
    for k in range(seg):
        a = 2 * math.pi * k / seg; rings.append([bm.verts.new((r * math.cos(a), z, r * math.sin(a))) for (r, z) in prof])
    for k in range(seg):
        r0, r1 = rings[k], rings[(k + 1) % seg]
        for i in range(len(prof) - 1):
            f = bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i])); f.material_index = 1 if prof[i][1] >= 0.245 else 0
    top = bm.faces.new([rings[k][-1] for k in range(seg)]); top.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = lib.mesh_obj("bottle", bm, [M["bottle"], M["capsule"]], smooth=True); o.location = (0, 0, -500)
    return o


def instancer(name, pts, src, rot, jitter=0.0):
    """put src on every point, all turned by rot (an Euler), with a little random roll about y if jitter"""
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"); ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N = ng.nodes; L = ng.links; gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput")
    mp = N.new("GeometryNodeMeshToPoints"); L.new(gi.outputs[0], mp.inputs["Mesh"])
    oi = N.new("GeometryNodeObjectInfo"); oi.transform_space = "ORIGINAL"; oi.inputs["Object"].default_value = src
    inst = N.new("GeometryNodeInstanceOnPoints"); L.new(mp.outputs[0], inst.inputs["Points"]); L.new(oi.outputs["Geometry"], inst.inputs["Instance"])
    inst.inputs["Rotation"].default_value = rot
    L.new(inst.outputs[0], go.inputs[0])
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(p) for p in pts], [], []); ob = lib.link(bpy.data.objects.new(name, me))
    md = ob.modifiers.new("inst", "NODES"); md.node_group = ng
    return ob


def cask(name, loc, M, length=0.95, rh=0.29, rb=0.335):
    """an oak cask lying along y: staves, six iron hoops, the heads"""
    prof = []
    for i in range(17):
        t = -1 + 2 * i / 16; prof.append((rb - (rb - rh) * t * t, t * length / 2))
    bm = bmesh.new(); seg = 40; rings = []
    for k in range(seg):
        a = 2 * math.pi * k / seg; rings.append([bm.verts.new((r * math.cos(a), z, r * math.sin(a))) for (r, z) in prof])
    for k in range(seg):
        r0, r1 = rings[k], rings[(k + 1) % seg]
        for i in range(len(prof) - 1): bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i]))
    for j in (0, -1): bm.faces.new([rings[k][j] for k in range(seg)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = lib.mesh_obj(name, bm, M["cask"], smooth=True); o.location = loc
    for t in (-0.9, -0.62, -0.3, 0.3, 0.62, 0.9):
        r = rb - (rb - rh) * t * t + 0.004
        h = lib.cyl(name + " hoop", r, 0.045, (0, 0, 0), M["hoop"], verts=40, rot=(math.pi / 2, 0, 0)); h.location = (loc[0], loc[1] + t * length / 2 - 0.0225 + 0.0225, loc[2])
        h.parent = None
    return o


# ---------------------------------------------------------------- the aisles
def aisle(M, sgn, rnd, bottles):
    """one aisle from the tasting room out to x = sgn * AX1: walls, the barrel vault, ribs on pilasters every bay,
    racks of bottles in most bays, casks in some, a sconce on every pilaster"""
    x0, x1 = sgn * TX, sgn * AX1; lo, hi = min(x0, x1), max(x0, x1)
    barrel("aisle vault", lo, hi, YC, AW, AS, M["brick_vault"])
    for yw, s_ in ((YC - AW - 0.3, -1), (YC + AW + 0.3, 1)):
        lib.box("aisle wall", (hi - lo, 0.6, AS + 0.3), ((lo + hi) / 2, yw, (AS + 0.3) / 2), M["brick"])
    lib.box("aisle end wall", (0.6, 2 * AW + 1.2, AS + AW + 0.6), (x1 + sgn * 0.3, YC, (AS + AW + 0.6) / 2), M["brick_y"])
    n_bays = int((hi - lo) / BAY)
    for k in range(n_bays + 1):
        x = x0 + sgn * k * BAY
        for s_ in (-1, 1):
            lib.box("pilaster", (0.46, 0.16, AS), (x, YC + s_ * (AW - 0.08), AS / 2), M["brick_y"])
            sc = Vector((x, YC + s_ * (AW - 0.2), 2.05))
            lib.box("sconce plate", (0.1, 0.03, 0.22), (x, YC + s_ * (AW - 0.175), 2.05), M["iron"], bevel=0.005)
            lib.cyl("sconce bulb", 0.022, 0.05, (sc.x, sc.y - s_ * 0.06, sc.z + 0.03), M["bulb"], verts=12)
            lib.point_light("sconce", (sc.x, sc.y - s_ * 0.08, sc.z + 0.08), 22.0, (1.0, 0.64, 0.36), 0.02)
        bm = bmesh.new(); seg = 24                                     # the rib over the pilasters
        for i in range(seg):
            a0_, a1_ = math.pi * i / seg, math.pi * (i + 1) / seg
            p = Vector((x, YC - (AW - 0.1) * math.cos(a0_), AS + (AW - 0.1) * math.sin(a0_))); q = Vector((x, YC - (AW - 0.1) * math.cos(a1_), AS + (AW - 0.1) * math.sin(a1_)))
            d = q - p; c = (p + q) / 2; r = bmesh.ops.create_cube(bm, size=1.0)
            bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Rotation(math.atan2(d.z, d.y), 4, "X") @ Matrix.Diagonal((0.46, d.length + 0.01, 0.2, 1)), verts=r["verts"])
        lib.mesh_obj("aisle rib", bm, M["brick_y"])
        if k == n_bays: break
        xa, xb = x + sgn * 0.23, x + sgn * (BAY - 0.23); xl, xr = min(xa, xb), max(xa, xb)
        for s_ in (-1, 1):
            if (k * 2 + (s_ > 0)) % 7 == 3: casks_bay(M, xl, xr, s_, rnd)
            else: rack_bay(M, xl, xr, s_, rnd, bottles)
    # light up the vault from the top of the racks, and a glow at the far end
    for s_ in (-1, 1):
        lib.area_light("vault wash", ((lo + hi) / 2, YC + s_ * (AW - 0.5), 2.42), hi - lo - 0.5, 110 * (hi - lo) / 10, (1.0, 0.66, 0.38), rot=(math.pi + s_ * 0.6, 0, 0), size_y=0.1)


def rack_bay(M, xl, xr, s_, rnd, bottles):
    """oak racks against the wall from the floor to 2.3 m: uprights, and bottles lying neck out, 21 rows"""
    yw = YC + s_ * AW; depth = 0.42; yf = yw - s_ * depth
    for x in (xl + 0.03, (xl + xr) / 2, xr - 0.03):
        lib.box("rack upright", (0.05, depth, 2.3), (x, (yw + yf) / 2, 1.15), M["rack"])
    for z in (0.04, 2.33):
        lib.box("rack rail", (xr - xl, depth, 0.04), ((xl + xr) / 2, (yw + yf) / 2, z), M["rack_x"])
    full = rnd.random() > 0.12; bm = bmesh.new()
    for row in range(21):
        z = 0.11 + row * 0.105
        for yy in (yw - s_ * 0.05, yw - s_ * 0.33): lib.bm_box(bm, (xr - xl, 0.025, 0.02), ((xl + xr) / 2, yy, z - 0.047))
        x = xl + 0.09
        while x < xr - 0.06:
            if abs(x - (xl + xr) / 2) > 0.06 and (full or rnd.random() > 0.35):
                bottles.append(((x + rnd.gauss(0, 0.002), yw - s_ * 0.06, z), s_))
            x += 0.09
    lib.mesh_obj("rack laths", bm, M["rack_x"])


def casks_bay(M, xl, xr, s_, rnd):
    """casks on oak cradles, three below and two above"""
    yc = YC + s_ * (AW - 0.62); xm = (xl + xr) / 2
    lib.box("cradle", (xr - xl - 0.1, 0.5, 0.16), (xm, yc, 0.08), M["rack_x"])
    for i, x in enumerate((xm - 1.0, xm, xm + 1.0)):
        cask("cask", (x, yc, 0.16 + 0.335), M)
    for x in (xm - 0.5, xm + 0.5):
        cask("cask", (x, yc, 0.16 + 0.335 + math.sqrt(0.67 ** 2 - 0.5 ** 2)), M)


# ---------------------------------------------------------------- the tasting room
def wine_glass(name, loc, M, wine=0.0):
    prof = [(0.0, 0.0), (0.038, 0.0), (0.038, 0.003), (0.004, 0.006), (0.0035, 0.09), (0.02, 0.1), (0.042, 0.135), (0.045, 0.165), (0.038, 0.21), (0.036, 0.215)]
    g = furn.lathe(name, prof, M["crystal"], 32, loc)
    if wine > 0:
        furn.lathe(name + " wine", [(0.0, 0.103), (0.026, 0.11), (0.04, 0.13), (0.042, 0.103 + wine)] + [(0.0, 0.103 + wine)], M["wine"], 32, loc)
    return g


def chandelier(M, loc, r=0.9, n=12):
    """a ring of black iron on four chains, with candle bulbs round it"""
    x, y, z = loc
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.025, major_segments=64, minor_segments=8, location=(x, y, z)); t = bpy.context.active_object; t.name = "chandelier ring"; t.data.materials.append(M["iron"])
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 0.55, minor_radius=0.018, major_segments=48, minor_segments=8, location=(x, y, z + 0.35)); t = bpy.context.active_object; t.name = "chandelier ring"; t.data.materials.append(M["iron"])
    top = t_vault(x) - 0.05
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; p = Vector((x + r * math.cos(a), y + r * math.sin(a), z)); q = Vector((x, y, top - 0.6))
        d = q - p; c = lib.cyl("chandelier chain", 0.008, d.length, tuple(p), M["iron"], verts=6)
        c.rotation_euler = (0, math.atan2(math.hypot(d.x, d.y), d.z), math.atan2(d.y, d.x))
    lib.cyl("chandelier chain", 0.01, 0.6, (x, y, top - 0.6), M["iron"], verts=6)
    for k in range(n):
        a = 2 * math.pi * k / n; p = (x + r * math.cos(a), y + r * math.sin(a), z)
        lib.cyl("chandelier cup", 0.035, 0.03, (p[0], p[1], z + 0.02), M["iron"], verts=16)
        lib.cyl("chandelier candle", 0.012, 0.12, (p[0], p[1], z + 0.05), M["candle"], verts=12)
        lib.cyl("chandelier flame", 0.008, 0.03, (p[0], p[1], z + 0.17), M["bulb"], verts=8, r2=0.001)
        lib.point_light("chandelier light", (p[0], p[1], z + 0.2), 22.0, (1.0, 0.62, 0.32), 0.015)


def tasting_room(M, rnd, bottles):
    tasting_vault(M)
    for sgn in (-1, 1): side_wall_with_arch(M, sgn * TX, sgn)
    # the table for ten, its chairs, glasses, a decanter, bottles, candles; the chandelier over it
    tx, ty, L_ = 0.0, YC, 4.6
    M = dict(M); M["linen"] = lib.principled("saddle leather", (0.20, 0.09, 0.04), 0.42, **{"Coat Weight": 0.25})
    lib.box("table top", (L_, 1.15, 0.07), (tx, ty, 0.745), M["table_oak"], bevel=0.01)
    for s_ in (-1, 1):
        lib.box("table leg", (0.14, 0.14, 0.71), (tx + s_ * (L_ / 2 - 0.35), ty - 0.4, 0.355), M["table_oak"], bevel=0.008)
        lib.box("table leg", (0.14, 0.14, 0.71), (tx + s_ * (L_ / 2 - 0.35), ty + 0.4, 0.355), M["table_oak"], bevel=0.008)
    lib.box("table stretcher", (L_ - 0.8, 0.08, 0.1), (tx, ty, 0.2), M["table_oak"])
    for k in range(4):
        cx = tx - L_ / 2 + 0.75 + k * (L_ - 1.5) / 3
        for s_ in (-1, 1):
            furn.dining_chair("chair", (cx, ty + s_ * 0.85, 0.0), 0.0 if s_ > 0 else math.pi, M)
            wine_glass("glass", (cx + 0.12, ty + s_ * 0.33, 0.78), M, wine=0.035 if (k + s_) % 3 else 0.0)
            wine_glass("glass", (cx - 0.08, ty + s_ * 0.36, 0.78), M)
    for s_ in (-1, 1): furn.dining_chair("chair", (tx + s_ * (L_ / 2 + 0.45), ty, 0.0), -s_ * math.pi / 2, M)
    furn.lathe("decanter", [(0.0, 0.0), (0.09, 0.0), (0.12, 0.03), (0.12, 0.06), (0.07, 0.13), (0.025, 0.2), (0.022, 0.3), (0.03, 0.31), (0.0, 0.31)], M["crystal"], 40, (tx - 0.3, ty, 0.78))
    furn.lathe("decanter wine", [(0.0, 0.004), (0.085, 0.004), (0.115, 0.032), (0.112, 0.07), (0.0, 0.07)], M["wine"], 40, (tx - 0.3, ty, 0.78))
    bo = bpy.data.objects.get("bottle")
    for (x, y) in ((tx + 0.35, ty + 0.05), (tx + 0.62, ty - 0.08), (tx - 1.4, ty + 0.05)):
        c = bo.copy(); lib.link(c); c.location = (x, y, 0.78); c.rotation_euler = (math.pi / 2, 0, 0)
    for x in (tx - 1.0, tx + 1.2):
        lib.cyl("candle", 0.03, 0.2, (x, ty, 0.78), M["candle"], verts=16)
        lib.cyl("flame", 0.009, 0.035, (x, ty, 0.99), M["flame"], verts=8, r2=0.001)
        lib.point_light("candle light", (x, ty, 1.02), 2.0, (1.0, 0.6, 0.3), 0.01)
    chandelier(M, (tx, ty, 2.55), 0.95)
    # the end walls: racks to the springing, a sommelier's counter at the door end
    for (y, s_) in ((TY1 - 0.05, 1),):
        for k in range(4):
            x0 = -TX + 0.6 + k * 2.75
            rack_end(M, x0, x0 + 2.5, y, s_, rnd, bottles)
    lib.box("counter", (3.0, 0.6, 0.92), (-3.2, TY0 + 0.35, 0.46), M["table_oak"], bevel=0.008)
    lib.box("counter top", (3.04, 0.62, 0.04), (-3.2, TY0 + 0.35, 0.94), M["marble"], bevel=0.004)
    for x in (-4.2, -3.6, -3.0):
        c = bo.copy(); lib.link(c); c.location = (x, TY0 + 0.35, 0.96); c.rotation_euler = (math.pi / 2, 0, 0)
    # the door to the street, oak, under a brick arch, open a little on warm light
    lib.box("door", (1.3, 0.08, 2.6), (2.2, TY0 + 0.05, 1.3), M["table_oak"], bevel=0.01)
    lib.box("door light", (1.2, 0.02, 2.5), (3.6, TY0 - 0.4, 1.25), lib.emission("street glow", (1.0, 0.82, 0.62), 3.0))
    # floor and light
    lib.box("cellar floor", (2 * AX1 + 2.0, 14.0, 0.1), (0.0, YC, -0.05), M["terracotta"])
    lib.box("cellar slab", (2 * AX1 + 4.0, 16.0, 0.6), (0.0, YC, 8.3), M["plaster"])
    for sgn in (-1, 1):
        lib.area_light("vault wash", (sgn * (TX - 0.6), YC, 3.2), 0.2, 260, (1.0, 0.66, 0.38), rot=(0, sgn * math.radians(150), 0), size_y=TY1 - TY0 - 1.0)
    for (x, y) in ((-TX + 0.4, TY0 + 1.2), (TX - 0.4, TY0 + 1.2), (-TX + 0.4, TY1 - 1.2), (TX - 0.4, TY1 - 1.2)):
        lib.box("sconce plate", (0.03, 0.1, 0.22), (x, y, 2.2), M["iron"], bevel=0.005)
        lib.point_light("sconce", (x - math.copysign(0.1, x), y, 2.3), 25.0, (1.0, 0.64, 0.36), 0.03)
    for x in (-4.6, -1.85, 0.9, 3.65):            # warm light grazing down the racks on the far wall
        sp = lib.spot_light("rack spot", (x + 0.62, TY1 - 1.5, 4.0), 160, (1.0, 0.70, 0.42), 0.015, 38, 0.5); sp.rotation_euler = (math.radians(30), 0, 0)


def rack_end(M, x0, x1, y, s_, rnd, bottles):
    """a rack against an end wall (y = const), bottles neck out towards the room"""
    depth = 0.42; yf = y - s_ * depth
    for x in (x0, (x0 + x1) / 2, x1):
        lib.box("rack upright", (0.05, depth, 3.4), (x, (y + yf) / 2, 1.7), M["rack"])
    for z in (0.04, 3.42):
        lib.box("rack rail", (x1 - x0, depth, 0.04), ((x0 + x1) / 2, (y + yf) / 2, z), M["rack_x"])
    bm = bmesh.new()
    for row in range(31):
        z = 0.11 + row * 0.105; x = x0 + 0.09
        for yy in (y - s_ * 0.05, y - s_ * 0.33): lib.bm_box(bm, (x1 - x0, 0.025, 0.02), ((x0 + x1) / 2, yy, z - 0.047))
        while x < x1 - 0.06:
            if abs(x - (x0 + x1) / 2) > 0.06 and rnd.random() > 0.08: bottles.append(((x, y - s_ * 0.06, z), s_))
            x += 0.09
    lib.mesh_obj("rack laths", bm, M["rack_x"])


def cellar(M, rnd):
    materials(M)
    bo = bottle_object(M)
    bottles = []
    tasting_room(M, rnd, bottles)
    for sgn in (-1, 1): aisle(M, sgn, rnd, bottles)
    # bottles neck out: those on the -y walls point +y, those on the +y walls point -y
    for s_, rot in ((-1, (0.0, 0.0, 0.0)), (1, (0.0, 0.0, math.pi))):
        pts = [p for (p, s) in bottles if s == s_]
        if pts: instancer("bottles %+d" % s_, pts, bo, rot)


ROOMS = {
    "cellar": dict(build=cellar, cams={
        "cellar": dict(loc=(3.7, 57.3, 1.45), target=(-3.2, 62.6, 1.5), lens=21, shift=0.08),
        "cellar2": dict(loc=(-24.0, YC - 0.4, 1.55), target=(0.0, YC + 0.2, 1.75), lens=24, shift=0.06),
    }, stops={"cellar": (2.4, 58.9, 0.0)}),
}


def build(room):
    sc = lib.reset(); M = family.materials(); rnd = random.Random(53)
    R = ROOMS[room]; R["build"](M, rnd)
    w = sc.world or bpy.data.worlds.new("world"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background"); bg.inputs["Color"].default_value = (0, 0, 0, 1); bg.inputs["Strength"].default_value = 0.0
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
        if j.startswith("plan:"):
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=ex)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"], shift_y=c.get("shift", 0.0)); lib.photo_finish(0.3, 0.15)
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
