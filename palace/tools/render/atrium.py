"""The atrium outside the family room's glass, in the room's frame (x along the glass, y into the room, z up from
the L1 floor): the five terraces with their planters, box hedges and glass balustrades, the five bridges, the fluted
travertine column with its portals, the rooms of the other four sides behind their glass, and the roof with its lens."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise
import lib, furn

APA = 24.09            # the atrium's apothem: where the glass of the rooms stands
TER = 3.6              # how deep the terraces are
VOID = APA - TER       # the apothem of the void
COL_R = 5.0
C = Vector((0.0, -APA, 0.0))
T36 = math.tan(math.radians(36))


def side_matrix(k):
    """side k's frame: (s along the side, a out from the centre, z) -> room coordinates; side 0 is the family room's"""
    return Matrix.Translation(C) @ Matrix.Rotation(math.radians(72 * k), 4, "Z")


def S(k, s, a, z=0.0):
    p = side_matrix(k) @ Vector((s, a, z)); return (p.x, p.y, p.z)


def pavers(name="pavers"):
    """honed travertine slabs, 900 x 600, with fine joints"""
    m = lib.travertine(name, (0.64, 0.58, 0.49), (0.53, 0.46, 0.37), 0.45, 1.3)
    nt = m.node_tree; L = nt.links; b = nt.nodes["Principled BSDF"]
    bc_link = b.inputs["Base Color"].links[0]; src = bc_link.from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord"); br = nt.nodes.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.004; br.inputs["Brick Width"].default_value = 0.9; br.inputs["Row Height"].default_value = 0.6; br.inputs["Mortar Smooth"].default_value = 0.3
    br.offset = 0.5; L.new(tc.outputs["Object"], br.inputs["Vector"])
    br.inputs["Color1"].default_value = (1, 1, 1, 1); br.inputs["Color2"].default_value = (0.9, 0.9, 0.88, 1); br.inputs["Mortar"].default_value = (0.35, 0.32, 0.28, 1)
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; L.new(src, mx.inputs[6]); L.new(br.outputs["Color"], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def leaf_object(name, length, width, mat):
    """one small leaf: a cupped ellipse"""
    bm = bmesh.new(); n = 10; c = bm.verts.new((0, 0, 0.0)); ring = []
    for i in range(n):
        a = 2 * math.pi * i / n; x = math.cos(a) * length / 2; y = math.sin(a) * width / 2
        ring.append(bm.verts.new((x, y, 0.15 * width * (1 - (2 * x / length) ** 2))))
    for i in range(n): bm.faces.new((c, ring[i], ring[(i + 1) % n]))
    o = lib.mesh_obj(name, bm, mat, smooth=True); o.location = (0, 0, -500); return o


def hedge_nodes(name, leaf_obj, density, seed, depth=0.05, smin=0.7, smax=1.3):
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N = ng.nodes; L = ng.links
    gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput")
    dist = N.new("GeometryNodeDistributePointsOnFaces"); dist.distribute_method = "RANDOM"; dist.inputs["Density"].default_value = density; dist.inputs["Seed"].default_value = seed
    L.new(gi.outputs[0], dist.inputs["Mesh"])
    off = N.new("FunctionNodeRandomValue"); off.data_type = "FLOAT"; off.inputs[2].default_value = -depth * 0.7; off.inputs[3].default_value = depth * 0.25; off.inputs["Seed"].default_value = seed + 1
    vm = N.new("ShaderNodeVectorMath"); vm.operation = "SCALE"; L.new(dist.outputs["Normal"], vm.inputs[0]); L.new(off.outputs[1], vm.inputs[3])
    sp = N.new("GeometryNodeSetPosition"); L.new(dist.outputs["Points"], sp.inputs["Geometry"]); L.new(vm.outputs[0], sp.inputs["Offset"])
    oi = N.new("GeometryNodeObjectInfo"); oi.transform_space = "ORIGINAL"; oi.inputs["Object"].default_value = leaf_obj
    rr = N.new("FunctionNodeRandomValue"); rr.data_type = "FLOAT_VECTOR"; rr.inputs[0].default_value = (0, 0, 0); rr.inputs[1].default_value = (6.283, 6.283, 6.283); rr.inputs["Seed"].default_value = seed + 2
    rs = N.new("FunctionNodeRandomValue"); rs.data_type = "FLOAT"; rs.inputs[2].default_value = smin; rs.inputs[3].default_value = smax; rs.inputs["Seed"].default_value = seed + 3
    e2r = N.new("FunctionNodeEulerToRotation"); L.new(rr.outputs[0], e2r.inputs[0])
    inst = N.new("GeometryNodeInstanceOnPoints"); L.new(sp.outputs[0], inst.inputs["Points"]); L.new(oi.outputs["Geometry"], inst.inputs["Instance"]); L.new(e2r.outputs[0], inst.inputs["Rotation"]); L.new(rs.outputs[1], inst.inputs["Scale"])
    L.new(inst.outputs[0], go.inputs[0])
    return ng


def hedge(name, k, s0, s1, a0, a1, z0, z1, leaf_obj, core_mat, density, seed):
    """a clipped box hedge from s0 to s1 along side k, a0..a1 out from the centre, z0..z1: a lumpy core and leaves on it"""
    L_ = s1 - s0; nx = max(2, int(L_ / 0.12)); ny = max(2, int((a1 - a0) / 0.12)); nz = max(2, int((z1 - z0) / 0.12))
    # a grid for the top, its outline pulled down for the sides: enough vertices to make it lumpy
    bm = bmesh.new()
    r = bmesh.ops.create_grid(bm, x_segments=nx, y_segments=ny, size=0.5)
    top = r["verts"]
    bmesh.ops.scale(bm, vec=(L_, a1 - a0, 1), verts=bm.verts); bmesh.ops.translate(bm, vec=((s0 + s1) / 2, (a0 + a1) / 2, z1), verts=bm.verts)
    # sides: extrude the grid's outline down
    edges = [e for e in bm.edges if e.is_boundary]
    ex = bmesh.ops.extrude_edge_only(bm, edges=edges); nv = [v for v in ex["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, -(z1 - z0)), verts=nv)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.01], cuts=nz)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    for v in bm.verts:
        c = v.co; n = noise.noise(Vector((c.x * 2.2 + seed, c.y * 2.2, c.z * 2.2))) * 0.035 + noise.noise(Vector((c.x * 7, c.y * 7 + seed, c.z * 7))) * 0.012
        top_round = 0.0
        if c.z > z1 - 0.01:
            e = min(c.y - a0, a1 - c.y, c.x - s0, s1 - c.x); top_round = -0.05 * max(0, 1 - e / 0.12)
        c.z += top_round; c += v.normal * n if v.normal.length > 0 else Vector()
    o = lib.mesh_obj(name, bm, core_mat); o.matrix_world = side_matrix(k)
    gn = o.modifiers.new("leaves", "NODES"); gn.node_group = hedge_nodes(name + " leaves", leaf_obj, density, seed)
    core = o.copy(); core.data = o.data; core.modifiers.clear(); lib.link(core); core.name = name + " core"
    dm = core.modifiers.new("shrink", "DISPLACE"); dm.mid_level = 0.0; dm.strength = -0.04
    return o


def scatter_leaves(obj, leaf_obj, group_name, smin=0.7, smax=1.3):
    """put a leaf on every vertex of obj (a cloud of points), turned and sized at random"""
    ng = bpy.data.node_groups.get(group_name)
    if ng is None:
        ng = bpy.data.node_groups.new(group_name, "GeometryNodeTree")
        ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"); ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
        N = ng.nodes; L = ng.links; gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput")
        mp = N.new("GeometryNodeMeshToPoints"); L.new(gi.outputs[0], mp.inputs["Mesh"])
        oi = N.new("GeometryNodeObjectInfo"); oi.transform_space = "ORIGINAL"; oi.inputs["Object"].default_value = leaf_obj
        rr = N.new("FunctionNodeRandomValue"); rr.data_type = "FLOAT_VECTOR"; rr.inputs[1].default_value = (6.283, 6.283, 6.283)
        e2r = N.new("FunctionNodeEulerToRotation"); L.new(rr.outputs[0], e2r.inputs[0])
        rs = N.new("FunctionNodeRandomValue"); rs.data_type = "FLOAT"; rs.inputs[2].default_value = smin; rs.inputs[3].default_value = smax
        inst = N.new("GeometryNodeInstanceOnPoints"); L.new(mp.outputs[0], inst.inputs["Points"]); L.new(oi.outputs["Geometry"], inst.inputs["Instance"]); L.new(e2r.outputs[0], inst.inputs["Rotation"]); L.new(rs.outputs[1], inst.inputs["Scale"])
        L.new(inst.outputs[0], go.inputs[0])
    md = obj.modifiers.new("leaves", "NODES"); md.node_group = ng
    return obj


def trailing(name, k, s0, s1, a, z_top, rnd, leaf_obj, step=0.06):
    """plants trailing from a trough: strands of leaves hanging from z_top, of random lengths, swaying a little"""
    pts = []; s = s0
    while s < s1:
        L_ = rnd.uniform(0.5, 1.9) if rnd.random() < 0.8 else rnd.uniform(1.9, 2.8); n = int(L_ / 0.022); ph = rnd.uniform(0, 6.28); sw = rnd.uniform(0.02, 0.08)
        for i in range(n):
            t = i / n; z = z_top - L_ * t; ds = sw * math.sin(ph + t * 5) ; da = -0.02 - 0.06 * t + rnd.uniform(-0.03, 0.03)
            pts.append((s + ds + rnd.uniform(-0.025, 0.025), a + da, z + rnd.uniform(-0.01, 0.01)))
        s += step * rnd.uniform(0.5, 1.5)
    me = bpy.data.meshes.new(name); me.from_pydata(pts, [], []); o = lib.link(bpy.data.objects.new(name, me)); o.matrix_world = side_matrix(k)
    return scatter_leaves(o, leaf_obj, "trailing leaves")


def fluted_column(name, r, z0, z1, flutes, mat, depth=0.075):
    """a column with concave flutes separated by narrow flat fillets"""
    seg = flutes * 12; bm = bmesh.new(); bot = []; top = []
    for i in range(seg):
        a = 2 * math.pi * i / seg; ph = (i % 12) / 12.0
        d = depth * math.sin(math.pi * (ph - 0.1) / 0.8) if 0.1 <= ph <= 0.9 else 0.0
        rr = r - max(0.0, d); bot.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z0))); top.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z1)))
    for i in range(seg):
        j = (i + 1) % seg; bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = lib.mesh_obj(name, bm, mat, smooth=True)
    for p in o.data.polygons:
        if abs(p.normal.z) > 0.99: p.use_smooth = False
    return o


def far_room(k, s0, s1, z0, z1, rnd, M, lit=True):
    """a room seen through the glass of another side: wood floor, a warm wall, furniture, lamps, often sheer curtains"""
    d = 6.5; objs = []; a0 = APA + 0.15
    def B(nm, sx, sy, sz, s, a, z, mat):
        o = lib.box(nm, (sx, sy, sz), (0, 0, 0), mat); o.matrix_world = side_matrix(k) @ Matrix.Translation((s, a, z)); objs.append(o); return o
    w = s1 - s0; sc = (s0 + s1) / 2
    B("far floor", w, d, 0.1, sc, a0 + d / 2, z0 - 0.05, M["far_floor"])
    B("far ceiling", w, d, 0.1, sc, a0 + d / 2, z1 + 0.05, M["oak_slat"] if rnd.random() < 0.5 else M["plaster"])
    B("far back", w, 0.1, z1 - z0, sc, a0 + d, (z0 + z1) / 2, rnd.choice([M["far_wall"], M["far_wall2"], M["walnut_v"], M["travertine"]]))
    for s in (s0, s1): B("far side", 0.1, d, z1 - z0, s, a0 + d / 2, (z0 + z1) / 2, M["far_wall"])
    if lit:
        # soft warm light from above the middle of the room, as from a few downlights
        l = lib.area_light("far light", (0, 0, 0), w * 0.6, 240 * w / 9.6, (1.0, 0.78, 0.55), size_y=d * 0.5); l.matrix_world = side_matrix(k) @ Matrix.Translation((sc, a0 + d * 0.55, z1 - 0.05))
        objs.append(l)
    for i in range(int(w / 2.2)):
        s = s0 + 0.9 + i * 2.2 + rnd.uniform(-0.3, 0.3)
        if s > s1 - 0.9: break
        kind = rnd.random()
        if kind < 0.35: B("far sofa", 1.9, 0.85, 0.42, s, a0 + d - 1.1, z0 + 0.21, rnd.choice([M["far_fabric"], M["far_fabric2"]])); B("far sofa back", 1.9, 0.2, 0.75, s, a0 + d - 0.6, z0 + 0.375, rnd.choice([M["far_fabric"], M["far_fabric2"]]))
        elif kind < 0.6: B("far table", 1.4, 0.8, 0.05, s, a0 + d * 0.5, z0 + 0.74, M["walnut"]); B("far table leg", 0.1, 0.5, 0.72, s, a0 + d * 0.5, z0 + 0.36, M["bronze_dark"])
        elif kind < 0.75:
            B("far lamp", 0.4, 0.4, 0.35, s, a0 + d - 0.5, z0 + 1.45, M["far_glow"]); B("far lamp stem", 0.03, 0.03, 1.3, s, a0 + d - 0.5, z0 + 0.65, M["bronze_dark"])
        else: B("far shelf", 1.8, 0.4, 2.2, s, a0 + d - 0.3, z0 + 1.1, M["walnut_v"])
    if rnd.random() < 0.55:
        f = side_matrix(k) @ Matrix.Translation((0, a0 + 0.12, 0))
        x0 = s0 + 0.1; x1 = s0 + (s1 - s0) * rnd.uniform(0.3, 0.6)
        objs.append(furn.sheer_curtain("far curtain", x0, x1, z0 + 0.02, z1 - 0.05, M["sheer"], frame=f))
        if rnd.random() < 0.5: objs.append(furn.sheer_curtain("far curtain", s1 - (s1 - s0) * rnd.uniform(0.2, 0.4), s1 - 0.1, z0 + 0.02, z1 - 0.05, M["sheer"], frame=f))
    return objs


def build(M, rnd, hedges=True, far=True):
    objs = []
    # terraces, one trapezoid per side, a little below the room's floor
    for k in range(5):
        pts = [(-VOID * T36, VOID), (VOID * T36, VOID), (APA * T36, APA), (-APA * T36, APA)]
        o = lib.poly_prism("terrace", pts, -0.6, -0.02, M["pavers"]); o.matrix_world = side_matrix(k); objs.append(o)
    leaf_near = leaf_object("boxwood leaf", 0.026, 0.013, M["boxwood"]); leaf_far = leaf_object("boxwood leaf far", 0.04, 0.02, M["boxwood"])
    for k in range(5):
        sm = VOID * T36 - 0.25
        for (s0, s1) in ((-sm, -1.75), (1.75, sm)):
            # the planter (its outer face set back from the void edge by the balustrade) and its soil
            o = lib.box("planter", (s1 - s0, 0.85, 0.6), (0, 0, 0), M["travertine"], bevel=0.01); o.matrix_world = side_matrix(k) @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.47, 0.28)); objs.append(o)
            if hedges:
                h = hedge("hedge", k, s0 + 0.08, s1 - 0.08, VOID + 0.12, VOID + 0.82, 0.58, 1.02 + rnd.uniform(-0.03, 0.03), leaf_near if k == 0 else leaf_far, M["boxwood_core"], 5200 if k == 0 else 1100, rnd.randint(0, 999))
                objs.append(h)
            # the glass balustrade along the void edge, with a bronze cap
            g = lib.box("balustrade", (s1 - s0, 0.014, 1.12), (0, 0, 0), M["glass_rail"]); g.matrix_world = side_matrix(k) @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.02, 0.54)); objs.append(g)
            cp = lib.box("cap", (s1 - s0, 0.05, 0.035), (0, 0, 0), M["bronze"], bevel=0.004); cp.matrix_world = side_matrix(k) @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.02, 1.115)); objs.append(cp)
        # the bridge to the column
        a0, a1 = COL_R - 0.4, VOID + 0.02; L_ = a1 - a0
        o = lib.box("bridge", (3.2, L_, 0.6), (0, 0, 0), M["pavers"]); o.matrix_world = side_matrix(k) @ Matrix.Translation((0, (a0 + a1) / 2, -0.32)); objs.append(o)
        o = lib.box("bridge soffit", (3.0, L_, 0.25), (0, 0, 0), M["plaster"]); o.matrix_world = side_matrix(k) @ Matrix.Translation((0, (a0 + a1) / 2, -0.74)); objs.append(o)
        for s in (-1.58, 1.58):
            g = lib.box("bridge glass", (0.014, L_ - 0.6, 1.12), (0, 0, 0), M["glass_rail"]); g.matrix_world = side_matrix(k) @ Matrix.Translation((s, (a0 + a1) / 2 + 0.3, 0.54)); objs.append(g)
            cp = lib.box("bridge cap", (0.05, L_ - 0.6, 0.035), (0, 0, 0), M["bronze"], bevel=0.004); cp.matrix_world = side_matrix(k) @ Matrix.Translation((s, (a0 + a1) / 2 + 0.3, 1.115)); objs.append(cp)
        # the portal at the column end of the bridge
        fr = lib.box("portal frame", (3.0, 0.5, 4.4), (0, 0, 0), M["bronze_dark"], bevel=0.01); fr.matrix_world = side_matrix(k) @ Matrix.Translation((0, COL_R - 0.05, 2.2)); objs.append(fr)
        dr = lib.box("portal", (2.4, 0.1, 3.7), (0, 0, 0), M["portal"]); dr.matrix_world = side_matrix(k) @ Matrix.Translation((0, COL_R + 0.18, 1.85)); objs.append(dr)
    col = fluted_column("column", COL_R, -60, 14, 60, M["column"], depth=0.13); col.location = C; objs.append(col)
    ivy = leaf_object("ivy leaf", 0.05, 0.04, M["ivy"])
    for k in range(1, 5):
        tr = lib.box("trough", (28.6, 0.45, 0.42), (0, 0, 0), M["travertine"], bevel=0.008); tr.matrix_world = side_matrix(k) @ Matrix.Translation((0, APA - 0.24, 4.06)); objs.append(tr)
        objs.append(trailing("trailing", k, -14.2, 14.2, APA - 0.47, 4.28, rnd, ivy))
    for k in range(5):
        for s in (-11.0, -6.0, 6.0, 11.0):
            p = S(k, s, VOID + 2.15)
            objs.append(lib.box("tree planter", (1.1, 1.1, 0.55), (p[0], p[1], 0.255), M["travertine"], bevel=0.01, rot_z=math.radians(72 * k)))
            objs.append(lib.box("tree soil", (1.0, 1.0, 0.02), (p[0], p[1], 0.52), M["soil"], rot_z=math.radians(72 * k)))
            furn.olive_tree("olive", (p[0], p[1], 0.53), rnd.randint(0, 10000), M, height=rnd.uniform(2.8, 3.6))
    # the stair cores in the corners and the rooms of the other sides
    for k in range(5):
        for sgn in (-1, 1):
            o = lib.box("corner core", (3.1, 0.6, 8.0), (0, 0, 0), M["travertine"]); o.matrix_world = side_matrix(k) @ Matrix.Translation((sgn * 16.15, APA + 0.3, 4.0)); objs.append(o)
        if k == 0: continue
        o = lib.box("storey band", (35.0, 0.5, 0.4), (0, 0, 0), M["travertine"]); o.matrix_world = side_matrix(k) @ Matrix.Translation((0, APA + 0.25, 4.0)); objs.append(o)
        for (z0, z1) in ((0.0, 3.8), (4.2, 8.0)):
            for i in range(10):
                s = -14.4 + i * 3.2
                m_ = lib.box("mullion", (0.06, 0.16, z1 - z0), (0, 0, 0), M["bronze"]); m_.matrix_world = side_matrix(k) @ Matrix.Translation((s if i < 9 else 14.4, APA, (z0 + z1) / 2)); objs.append(m_)
            g = lib.box("far glass", (28.8, 0.012, z1 - z0), (0, 0, 0), M["glass"]); g.matrix_world = side_matrix(k) @ Matrix.Translation((0, APA, (z0 + z1) / 2)); objs.append(g)
            if far:
                for (s0, s1) in ((-14.4, -4.8), (-4.8, 4.8), (4.8, 14.4)):
                    objs += far_room(k, s0, s1, z0, z1, rnd, M, lit=rnd.random() < 0.85)
    # the roof of the atrium, with the sky lens round the column
    R_out = APA + 3.0
    pts = [(math.cos(math.radians(90 + 72 * i + 36)) * R_out / math.cos(math.radians(36)), math.sin(math.radians(90 + 72 * i + 36)) * R_out / math.cos(math.radians(36))) for i in range(5)]
    roof = lib.poly_prism("atrium roof", pts, 8.0, 9.0, M["plaster"]); roof.location = C
    cut = lib.cyl("lens cut", 17.0, 3.0, (C.x, C.y, 7.0), None, verts=128); cut.hide_render = True; cut.hide_viewport = True
    bo = roof.modifiers.new("lens", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    objs.append(roof)
    # oak slats under the roof, on black felt, running along y, stopping at the lens
    felt = lib.poly_prism("atrium felt", pts, 7.995, 7.999, M["felt"]); felt.location = C
    bo = felt.modifiers.new("lens", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"; objs.append(felt)
    bm = bmesh.new(); pitch, sw, sh = 0.075, 0.042, 0.05; lens_r = 17.05
    # the roof pentagon in its own frame: corners at 126 + 72i degrees, radius R_out / cos 36
    poly = [Vector(p) for p in pts]
    x = -R_out / math.cos(math.radians(36))
    while x <= R_out / math.cos(math.radians(36)):
        ys = []
        for i in range(5):
            a, b = poly[i], poly[(i + 1) % 5]
            if (a.x - x) * (b.x - x) <= 0 and abs(b.x - a.x) > 1e-9:
                t = (x - a.x) / (b.x - a.x); ys.append(a.y + t * (b.y - a.y))
        if len(ys) >= 2:
            y0, y1 = min(ys), max(ys); segs = [(y0, y1)]
            if abs(x) < lens_r:
                h = math.sqrt(lens_r * lens_r - x * x); segs = [(y0, -h), (h, y1)]
            for (a, b) in segs:
                if b - a > 0.05: lib.bm_box(bm, (sw, b - a, sh), (x, (a + b) / 2, 8.0 - 0.004 - sh / 2))
        x += pitch
    sl = lib.mesh_obj("atrium slats", bm, M["oak_slat"]); sl.location = C; objs.append(sl)
    circ = lambda r: [(r * math.cos(2 * math.pi * i / 128), r * math.sin(2 * math.pi * i / 128)) for i in range(128)]
    ring = furn.ring_prism("lens ring", circ(17.0), circ(16.6), 7.7, 9.2, M["bronze_dark"]); ring.location = C; objs.append(ring)
    lens = lib.cyl("sky lens", 16.8, 0.03, (C.x, C.y, 9.6), M["glass"], verts=128); objs.append(lens)
    for r_ in (6.5, 11.5):
        rr = furn.ring_prism("lens rib ring", circ(r_ + 0.12), circ(r_ - 0.12), 9.25, 9.6, M["bronze_dark"]); rr.location = C; objs.append(rr)
    for i in range(24):
        a = 2 * math.pi * i / 24; L_ = 16.8 - COL_R
        rb = lib.box("lens rib", (L_, 0.14, 0.4), (0, 0, 0), M["bronze_dark"]); rb.location = (C.x + math.cos(a) * (COL_R + L_ / 2), C.y + math.sin(a) * (COL_R + L_ / 2), 9.4); rb.rotation_euler = (0, 0, a); objs.append(rb)
    return objs


# ---------------------------------------------------------------- the levels below L1, and the sun court at the bottom
LOWER = [
    dict(name="L2", floor=-17.0, top=-1.0, kind="garden"),
    dict(name="L3", floor=-26.0, top=-18.0, kind="studio"),
    dict(name="L4", floor=-35.0, top=-27.0, kind="plant"),
]
COURT = -44.0          # the sun court, the floor of L5
L5_TOP = -36.0


def garden_room(k, z0, z1, rnd, M):
    """L2 seen through its glass: grass, olive trees and a bright sky of lamps"""
    objs = []; d = 12.0; a0 = APA + 0.2
    def B(nm, sx, sy, sz, s, a, z, mat):
        o = lib.box(nm, (sx, sy, sz), (0, 0, 0), mat); o.matrix_world = side_matrix(k) @ Matrix.Translation((s, a, z)); objs.append(o); return o
    B("garden ground", 31.0, d, 0.2, 0, a0 + d / 2, z0 - 0.1, M["grass"])
    B("garden sky", 31.0, d, 0.1, 0, a0 + d / 2, z1 - 0.05, M["lamp_sky"])
    B("garden far", 31.0, 0.2, z1 - z0, 0, a0 + d, (z0 + z1) / 2, M["lamp_sky_far"])
    for i in range(4):
        s = -12.0 + i * 8.0 + rnd.uniform(-1.5, 1.5); a = a0 + rnd.uniform(3.0, 9.0); p = S(k, s, a)
        furn.olive_tree("garden olive", (p[0], p[1], z0), rnd.randint(0, 99999), M, height=rnd.uniform(6.0, 8.5), leaves=26000)
    return objs


def hall_room(k, s0, s1, z0, z1, rnd, M, kind):
    """a working room behind the glass on L3, L4 or L5: lit, with machines or benches as dark shapes"""
    objs = []; d = 9.0; a0 = APA + 0.15
    def B(nm, sx, sy, sz, s, a, z, mat):
        o = lib.box(nm, (sx, sy, sz), (0, 0, 0), mat); o.matrix_world = side_matrix(k) @ Matrix.Translation((s, a, z)); objs.append(o); return o
    w = s1 - s0; sc = (s0 + s1) / 2
    B("hall floor", w, d, 0.1, sc, a0 + d / 2, z0 - 0.05, M["hall_floor"])
    B("hall ceiling", w, d, 0.1, sc, a0 + d / 2, z1 + 0.05, M["plaster"])
    B("hall back", w, 0.1, z1 - z0, sc, a0 + d, (z0 + z1) / 2, M["far_wall"] if kind == "studio" else M["hall_wall"])
    for s in (s0, s1): B("hall side", 0.1, d, z1 - z0, s, a0 + d / 2, (z0 + z1) / 2, M["far_wall"])
    for i in range(int(w / 2.4)):
        B("hall light", 1.6, 0.25, 0.04, s0 + (i + 0.5) * w / int(w / 2.4), a0 + d * 0.5, z1 - 0.03, M["far_glow"])
    for i in range(int(w / 3.0)):
        s = s0 + 1.5 + i * 3.0
        if s > s1 - 1.0: break
        if kind == "studio": B("bench", 2.2, 0.9, 0.9, s, a0 + d * rnd.uniform(0.3, 0.7), z0 + 0.45, M["walnut"])
        else: B("machine", 2.0, 2.0, rnd.uniform(1.6, 3.2), s, a0 + d * rnd.uniform(0.4, 0.75), z0 + 1.0, M["machine"])
    return objs


def build_lower(M, rnd):
    objs = []
    ivy = bpy.data.objects.get("ivy leaf") or leaf_object("ivy leaf", 0.05, 0.04, M["ivy"])
    leaf_far = bpy.data.objects.get("boxwood leaf far") or leaf_object("boxwood leaf far", 0.04, 0.02, M["boxwood"])
    for lv in LOWER:
        f, t = lv["floor"], lv["top"]
        for k in range(5):
            m = side_matrix(k)
            pts = [(-VOID * T36, VOID), (VOID * T36, VOID), (APA * T36, APA), (-APA * T36, APA)]
            o = lib.poly_prism("terrace", pts, f - 0.6, f - 0.02, M["pavers"]); o.matrix_world = m; objs.append(o)
            sm = VOID * T36 - 0.25
            for (s0, s1) in ((-sm, -1.75), (1.75, sm)):
                o = lib.box("planter", (s1 - s0, 0.85, 0.6), (0, 0, 0), M["travertine"], bevel=0.01); o.matrix_world = m @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.47, f + 0.28)); objs.append(o)
                objs.append(hedge("hedge", k, s0 + 0.08, s1 - 0.08, VOID + 0.12, VOID + 0.82, f + 0.58, f + 1.0, leaf_far, M["boxwood_core"], 700, rnd.randint(0, 999)))
                g = lib.box("balustrade", (s1 - s0, 0.014, 1.12), (0, 0, 0), M["glass_rail"]); g.matrix_world = m @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.02, f + 0.54)); objs.append(g)
                cp = lib.box("cap", (s1 - s0, 0.05, 0.035), (0, 0, 0), M["bronze"]); cp.matrix_world = m @ Matrix.Translation(((s0 + s1) / 2, VOID + 0.02, f + 1.115)); objs.append(cp)
                objs.append(trailing("trailing", k, s0, s1, VOID - 0.08, f - 0.1, rnd, ivy, step=0.09))
            # hedges get their leaves only where they are near enough to see
            a0, a1 = COL_R - 0.4, VOID + 0.02; L_ = a1 - a0
            o = lib.box("bridge", (3.2, L_, 0.6), (0, 0, 0), M["pavers"]); o.matrix_world = m @ Matrix.Translation((0, (a0 + a1) / 2, f - 0.32)); objs.append(o)
            o = lib.box("bridge soffit", (3.0, L_, 0.25), (0, 0, 0), M["plaster"]); o.matrix_world = m @ Matrix.Translation((0, (a0 + a1) / 2, f - 0.74)); objs.append(o)
            for s in (-1.58, 1.58):
                g = lib.box("bridge glass", (0.014, L_ - 0.6, 1.12), (0, 0, 0), M["glass_rail"]); g.matrix_world = m @ Matrix.Translation((s, (a0 + a1) / 2 + 0.3, f + 0.54)); objs.append(g)
                cp = lib.box("bridge cap", (0.05, L_ - 0.6, 0.035), (0, 0, 0), M["bronze"]); cp.matrix_world = m @ Matrix.Translation((s, (a0 + a1) / 2 + 0.3, f + 1.115)); objs.append(cp)
            fr = lib.box("portal frame", (3.0, 0.5, 4.4), (0, 0, 0), M["bronze_dark"], bevel=0.01); fr.matrix_world = m @ Matrix.Translation((0, COL_R - 0.05, f + 2.2)); objs.append(fr)
            dr = lib.box("portal", (2.4, 0.1, 3.7), (0, 0, 0), M["portal"]); dr.matrix_world = m @ Matrix.Translation((0, COL_R + 0.18, f + 1.85)); objs.append(dr)
            # the slab between this level and the one above, the corner cores, the glass and what is behind it
            # (its top stops 5 cm under the floor above: two faces at one height fight and render black)
            sl = lib.box("slab band", (35.0, 0.5, 0.95), (0, 0, 0), M["travertine"]); sl.matrix_world = m @ Matrix.Translation((0, APA + 0.25, t + 0.475)); objs.append(sl)
            for sgn in (-1, 1):
                o = lib.box("corner core", (3.1, 0.6, t - f + 1.0), (0, 0, 0), M["travertine"]); o.matrix_world = m @ Matrix.Translation((sgn * 16.15, APA + 0.3, (f + t + 1.0) / 2)); objs.append(o)
            for i in range(10):
                s = -14.4 + i * 3.2 if i < 9 else 14.4
                mu = lib.box("mullion", (0.06, 0.16, t - f), (0, 0, 0), M["bronze"]); mu.matrix_world = m @ Matrix.Translation((s, APA, (f + t) / 2)); objs.append(mu)
            nz = max(1, int(round((t - f) / 4.0)))
            for j in range(1, nz):
                tr = lib.box("transom", (28.8, 0.16, 0.06), (0, 0, 0), M["bronze"]); tr.matrix_world = m @ Matrix.Translation((0, APA, f + j * (t - f) / nz)); objs.append(tr)
            g = lib.box("far glass", (28.8, 0.012, t - f), (0, 0, 0), M["glass"]); g.matrix_world = m @ Matrix.Translation((0, APA, (f + t) / 2)); objs.append(g)
            if lv["kind"] == "garden": objs += garden_room(k, f, t, rnd, M)
            else:
                for (s0, s1) in ((-14.4, -4.8), (-4.8, 4.8), (4.8, 14.4)): objs += hall_room(k, s0, s1, f, t, rnd, M, lv["kind"])
    # L5: the halls round the sun court, and the court itself
    for k in range(5):
        m = side_matrix(k)
        sl = lib.box("slab band", (35.0, 0.5, 0.95), (0, 0, 0), M["travertine"]); sl.matrix_world = m @ Matrix.Translation((0, APA + 0.25, L5_TOP + 0.475)); objs.append(sl)
        for sgn in (-1, 1):
            o = lib.box("corner core", (3.1, 0.6, L5_TOP - COURT + 1.0), (0, 0, 0), M["travertine"]); o.matrix_world = m @ Matrix.Translation((sgn * 16.15, APA + 0.3, (COURT + L5_TOP + 1.0) / 2)); objs.append(o)
        for i in range(10):
            s = -14.4 + i * 3.2 if i < 9 else 14.4
            mu = lib.box("mullion", (0.06, 0.16, L5_TOP - COURT), (0, 0, 0), M["bronze"]); mu.matrix_world = m @ Matrix.Translation((s, APA, (COURT + L5_TOP) / 2)); objs.append(mu)
        g = lib.box("far glass", (28.8, 0.012, L5_TOP - COURT), (0, 0, 0), M["glass"]); g.matrix_world = m @ Matrix.Translation((0, APA, (COURT + L5_TOP) / 2)); objs.append(g)
        for (s0, s1) in ((-14.4, -4.8), (-4.8, 4.8), (4.8, 14.4)): objs += hall_room(k, s0, s1, COURT, L5_TOP, rnd, M, "plant")
        # the paved walk round the court in front of the halls
        pts = [(-VOID * T36, VOID), (VOID * T36, VOID), (APA * T36, APA), (-APA * T36, APA)]
        o = lib.poly_prism("court walk", pts, COURT - 0.6, COURT, M["pavers"]); o.matrix_world = m; objs.append(o)
        # a causeway from the walk over the pool to the column's portal
        a0, a1 = COL_R - 0.4, VOID; L_ = a1 - a0
        o = lib.box("causeway", (2.6, L_, 0.5), (0, 0, 0), M["pavers"]); o.matrix_world = m @ Matrix.Translation((0, (a0 + a1) / 2, COURT - 0.2)); objs.append(o)
        fr = lib.box("portal frame", (3.0, 0.5, 4.4), (0, 0, 0), M["bronze_dark"], bevel=0.01); fr.matrix_world = m @ Matrix.Translation((0, COL_R - 0.05, COURT + 2.2)); objs.append(fr)
        dr = lib.box("portal", (2.4, 0.1, 3.7), (0, 0, 0), M["portal"]); dr.matrix_world = m @ Matrix.Translation((0, COL_R + 0.18, COURT + 1.85)); objs.append(dr)
    # the court: a lawn inside the void's pentagon, a pool round the column, fruit trees on the lawn
    vp = [(math.cos(math.radians(54 + 72 * i)) * VOID / math.cos(math.radians(36)), math.sin(math.radians(54 + 72 * i)) * VOID / math.cos(math.radians(36))) for i in range(5)]
    lawn = lib.poly_prism("lawn", vp, COURT - 0.5, COURT - 0.05, M["lawn"]); lawn.location = C
    cut = lib.cyl("pool cut", 9.0, 2.0, (C.x, C.y, COURT - 1.0), None, verts=128); cut.hide_render = True; cut.hide_viewport = True
    bo = lawn.modifiers.new("pool", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"; objs.append(lawn)
    circ = lambda r, n=128: [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    rim = furn.ring_prism("pool rim", circ(9.3), circ(8.9), COURT - 0.6, COURT + 0.02, M["travertine"]); rim.location = C; objs.append(rim)
    water = furn.ring_prism("pool water", circ(8.95), circ(COL_R + 0.02), COURT - 0.5, COURT - 0.12, M["water"]); water.location = C; objs.append(water)
    basin = furn.ring_prism("pool basin", circ(8.95), circ(COL_R + 0.02), COURT - 1.4, COURT - 1.3, M["pool_tile"]); basin.location = C; objs.append(basin)
    for i in range(10):
        a = math.radians(18 + 36 * i); r = rnd.uniform(12.5, 15.5)
        p = (C.x + math.cos(a) * r, C.y + math.sin(a) * r)
        furn.olive_tree("court tree", (p[0], p[1], COURT - 0.05), rnd.randint(0, 99999), M, height=rnd.uniform(4.0, 5.5), leaves=20000)
    return objs
