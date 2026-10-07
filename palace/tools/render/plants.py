"""Arcadia's plants. Each room has its own, chosen for it in palace/tools/furnishing.py: trees, palms, ferns, flowers and
succulents in all their colours (a Japanese maple's red, a ginkgo's gold, an agave's blue-grey). Each species is made
the way it grows: a trunk that forks and tapers, twigs, and real leaves set along them (a maple's lobed leaves in pairs on
long stalks, a fig's fiddles spiralling up the stem, a palm's fronds arching from the crown), each leaf with its veins,
folded along the midrib and drooping to the tip, turned to the light, a little different in colour from the next.
Units metres, Z up; a plant stands at loc, in its planter if it has one.
    import plants; plants.make("japanese maple", (x, y, 0), seed=4, height=3.2, colour="red")
DETAIL < 1 makes lighter plants (fewer, plainer leaves) for the walk, which bakes their light into their vertices."""
import bpy, math, random
import numpy as np
from mathutils import Vector, Matrix
import lib

DETAIL = 1.0
TAU = 2 * math.pi
# save_blend.py sets INSTANCE: each plant's leaves are then kept as copies (instances) of their leaf, one point per leaf
# (where it is, how it is turned, its size, its random number) and a geometry-nodes modifier that puts the leaf on each,
# the same picture as the joined mesh in a file a tenth the size. _MADE remembers, meanwhile, how place() and stack()
# made each array of leaves: id(V) -> (V, [(template, points, turn x size)])
INSTANCE = False
_MADE = {}


# ---------------------------------------------------------------- meshes from arrays
def mesh_from(name, V, F, uv=None, face_val=None, mat=None, smooth=True, loc=(0, 0, 0)):
    """a mesh object from numpy arrays: V (n, 3) vertices, F (m, 3) triangles, uv (m * 3, 2) per corner, face_val
    (m,) a number per face (the 'leafrand' attribute the leaf materials read)"""
    if INSTANCE and face_val is not None and len(F) > 2000:
        rec = _MADE.get(id(V))
        if rec is not None and rec[0] is V: return _instanced(name, rec[1], face_val, mat, smooth, loc)
    V = np.ascontiguousarray(V, np.float32); F = np.ascontiguousarray(F, np.int32); nf = len(F)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V)); me.vertices.foreach_set("co", V.ravel())
    me.loops.add(nf * 3); me.polygons.add(nf)
    me.polygons.foreach_set("loop_start", np.arange(0, nf * 3, 3, dtype=np.int32))
    me.polygons.foreach_set("vertices", F.ravel())
    me.update(calc_edges=True)
    if uv is not None:
        me.uv_layers.new(name="UVMap").data.foreach_set("uv", np.ascontiguousarray(uv, np.float32).ravel())
    if face_val is not None:
        me.attributes.new("leafrand", "FLOAT", "FACE").data.foreach_set("value", np.ascontiguousarray(face_val, np.float32))
    if smooth: me.polygons.foreach_set("use_smooth", np.ones(nf, dtype=bool))
    o = lib.link(bpy.data.objects.new(name, me)); o.location = loc
    if mat is not None:
        for m in (mat if isinstance(mat, (list, tuple)) else [mat]): me.materials.append(m)
    return o


def _instanced(name, segs, face_val, mat, smooth, loc):
    """the leaves as instances (INSTANCE): a mesh of points, one per leaf, carrying its turn ('rot', XYZ Euler), size
    ('scale'), random number ('leafrand') and template ('tmpl'); a geometry-nodes modifier puts a copy of its template
    on each point. The templates are hidden objects of their own; the point attributes become the copies' attributes,
    which the leaf materials read (instance_materials)"""
    from mathutils import Matrix
    mats = list(mat) if isinstance(mat, (list, tuple)) else ([mat] if mat is not None else [])
    tmpls, idx, Ps, Es, Ss, Ws, Ts, off = [], {}, [], [], [], [], [], 0
    fv = np.asarray(face_val, np.float64)
    for (tmpl, P, RS) in segs:
        if id(tmpl) not in idx: idx[id(tmpl)] = len(tmpls); tmpls.append(tmpl)
        k, nF = len(P), len(tmpl[1]); s = np.cbrt(np.linalg.det(RS))
        Ps.append(P); Ss.append(s); Ws.append(fv[off:off + k * nF:nF]); Ts.append(np.full(k, idx[id(tmpl)], np.int32)); off += k * nF
        Es.append(np.array([tuple(Matrix((r / sc).tolist()).to_euler("XYZ")) for r, sc in zip(RS, s)], np.float64).reshape(-1, 3))
    P = np.concatenate(Ps); n = len(P)
    me = bpy.data.meshes.new(name); me.vertices.add(n); me.vertices.foreach_set("co", np.ascontiguousarray(P, np.float32).ravel())
    for (nm, typ, arr) in (("rot", "FLOAT_VECTOR", np.concatenate(Es)), ("scale", "FLOAT", np.concatenate(Ss)),
                           ("leafrand", "FLOAT", np.concatenate(Ws)), ("tmpl", "INT", np.concatenate(Ts))):
        a = me.attributes.new(nm, typ, "POINT")
        a.data.foreach_set("vector" if typ == "FLOAT_VECTOR" else "value", np.ascontiguousarray(arr, np.int32 if typ == "INT" else np.float32).ravel())
    for m in mats: me.materials.append(m)
    o = lib.link(bpy.data.objects.new(name, me)); o.location = loc
    tobs = []
    for i, (V, F, uv) in enumerate(tmpls):
        t = mesh_from(name + " leaf %d" % i, V, F, uv, None, mat=mats, smooth=smooth)
        t.hide_render = True; t.hide_viewport = True; tobs.append(t)
    o["leaf templates"] = [t.name for t in tobs]
    ng = bpy.data.node_groups.new(name + " leaves", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N, L = ng.nodes, ng.links; gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput"); join = N.new("GeometryNodeJoinGeometry")
    att = {}
    for (nm, typ) in (("rot", "FLOAT_VECTOR"), ("scale", "FLOAT"), ("tmpl", "INT")):
        a = N.new("GeometryNodeInputNamedAttribute"); a.data_type = typ; a.inputs["Name"].default_value = nm; att[nm] = a.outputs["Attribute"]
    for i, t in enumerate(tobs):
        oi = N.new("GeometryNodeObjectInfo"); oi.transform_space = "ORIGINAL"; oi.inputs["Object"].default_value = t; oi.inputs["As Instance"].default_value = True
        ip = N.new("GeometryNodeInstanceOnPoints")
        L.new(gi.outputs[0], ip.inputs["Points"]); L.new(oi.outputs["Geometry"], ip.inputs["Instance"])
        L.new(att["rot"], ip.inputs["Rotation"]); L.new(att["scale"], ip.inputs["Scale"])
        if len(tobs) > 1:
            cmp = N.new("FunctionNodeCompare"); cmp.data_type = "INT"; cmp.operation = "EQUAL"
            L.new(att["tmpl"], cmp.inputs[2]); cmp.inputs[3].default_value = i; L.new(cmp.outputs["Result"], ip.inputs["Selection"])
        L.new(ip.outputs["Instances"], join.inputs["Geometry"])
    L.new(join.outputs["Geometry"], go.inputs[0])
    o.modifiers.new("leaves", "NODES").node_group = ng
    return o


def instance_materials():
    """let every leaf material read its leaf's random number from an instance as well as from a mesh (INSTANCE): a
    second attribute node of the instancer's kind, added to the first (a mesh's leaves read nothing there, copies
    nothing in the first)"""
    for m in bpy.data.materials:
        if not m.use_nodes or m.get("reads instances"): continue
        nt = m.node_tree
        for at in [n for n in nt.nodes if n.type == "ATTRIBUTE" and n.attribute_name == "leafrand" and n.attribute_type == "GEOMETRY"]:
            ai = nt.nodes.new("ShaderNodeAttribute"); ai.attribute_type = "INSTANCER"; ai.attribute_name = "leafrand"
            add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
            outs = [l.to_socket for l in nt.links if l.from_socket == at.outputs["Fac"]]
            for l in [l for l in nt.links if l.from_socket == at.outputs["Fac"]]: nt.links.remove(l)
            nt.links.new(at.outputs["Fac"], add.inputs[0]); nt.links.new(ai.outputs["Fac"], add.inputs[1])
            for to in outs: nt.links.new(add.outputs[0], to)
        m["reads instances"] = 1


def stack(parts):
    """join (V, F, uv, val) pieces into one"""
    Vs, Fs, UVs, Ws, off = [], [], [], [], 0
    for (V, F, uv, w) in parts:
        if len(F) == 0: continue
        Vs.append(V); Fs.append(F + off); UVs.append(uv); Ws.append(w); off += len(V)
    if not Vs: return np.zeros((0, 3)), np.zeros((0, 3), np.int32), np.zeros((0, 2)), np.zeros(0)
    V = np.concatenate(Vs)
    if INSTANCE:
        recs = [_MADE.get(id(p[0])) for p in parts if len(p[1])]
        if all(r is not None and r[0] is p[0] for r, p in zip(recs, [p for p in parts if len(p[1])])): _MADE[id(V)] = (V, [g for r in recs for g in r[1]])
    return V, np.concatenate(Fs), np.concatenate(UVs), np.concatenate(Ws)


# ---------------------------------------------------------------- leaf shapes (templates)
# a template is (V, F, UV): the leaf from its stalk's foot at the origin along +y, its face up (+z), length 1
def _grid_blade(half_w, rows, cols, fold, droop, stalk, curl=0.0, base=0.0):
    """a blade from y = stalk to stalk + 1, half-width half_w(t) at t (0 base, 1 tip), folded along the midrib (its
    edges rise fold * width) and drooping (droop) to the tip; a flat stalk from the origin to the blade"""
    V, uv = [], []
    for i in range(rows + 1):
        t = i / rows; w = half_w(t)
        for j in range(-cols, cols + 1):
            s = j / cols; x = s * w
            z = fold * abs(x) - droop * t * t + curl * x * x
            V.append((x, stalk + t, z)); uv.append((0.5 + 0.5 * s * min(1.0, w / 0.3), base + t * (1 - base)))
    n = 2 * cols + 1; F = []
    for i in range(rows):
        for j in range(n - 1):
            a, b, c, d = i * n + j, i * n + j + 1, (i + 1) * n + j + 1, (i + 1) * n + j
            F += [(a, b, c), (a, c, d)]
    if stalk > 0:                         # the stalk: a thin strip
        k = len(V); hw = 0.012
        V += [(-hw, 0, 0), (hw, 0, 0), (hw, stalk, 0), (-hw, stalk, 0)]; uv += [(0.5, 0), (0.5, 0), (0.5, base), (0.5, base)]
        F += [(k, k + 1, k + 2), (k, k + 2, k + 3)]
    return _tmpl(V, F, uv)


def _tmpl(V, F, uv):
    V = np.array(V, np.float64); F = np.array(F, np.int32); uv = np.array(uv, np.float64)
    return V, F, uv[F].reshape(-1, 2)            # uv per corner


def _polar_blade(r_of, segs, rings, cup, droop, stalk):
    """a blade round the top of its stalk (palmate: a maple's, a ginkgo's fan), its outline r_of(a) at angle a from
    the stalk's line (0 straight on); cupped (cup) and drooping (droop)"""
    V = [(0.0, stalk, 0.0)]; uv = [(0.5, 0.5)]; Rmax = max(r_of(-math.pi + TAU * k / 720) for k in range(720))
    angs = [-math.pi + TAU * (k + 0.5) / segs for k in range(segs)]
    for g in range(1, rings + 1):
        f = g / rings
        for a in angs:
            r = r_of(a) * f; x = r * math.sin(a); y = r * math.cos(a)
            V.append((x, stalk + y, cup * f * f * r - droop * max(0.0, y) ** 2))
            uv.append((0.5 + 0.5 * x / Rmax, 0.5 + 0.5 * y / Rmax))
    F = []
    for k in range(segs):
        F.append((0, 1 + k, 1 + (k + 1) % segs))
    for g in range(rings - 1):
        o0, o1 = 1 + g * segs, 1 + (g + 1) * segs
        for k in range(segs):
            k1 = (k + 1) % segs; F += [(o0 + k, o1 + k, o1 + k1), (o0 + k, o1 + k1, o0 + k1)]
    if stalk > 0:
        k = len(V); hw = 0.012
        V += [(-hw, 0, 0), (hw, 0, 0), (hw, stalk, 0), (-hw, stalk, 0)]; uv += [(0.5, 0.5)] * 4
        F += [(k, k + 1, k + 2), (k, k + 2, k + 3)]
    return _tmpl(V, F, uv)


def _bell(a, b):
    """t^a (1 - t)^b, scaled to 1 at its top: widest at a / (a + b) of the way to the tip"""
    m = a / (a + b); top = m ** a * (1 - m) ** b
    return lambda t: (max(t, 0.0) ** a) * (max(1 - t, 0.0) ** b) / top


def blade(shape, detail=1.0):
    """the leaf shapes, length 1 (a stalk where the species has one is part of the template)"""
    d = max(0.25, detail); rows = max(3, int(round(10 * d))); cols = 2 if d > 0.6 else 1
    if shape == "lance":            # olive, bamboo, willow: narrow, pointed
        f = _bell(0.55, 0.9); return _grid_blade(lambda t: 0.085 * f(t), rows, cols, 0.25, 0.06, 0.04)
    if shape == "ellipse":          # citrus, ficus, laurel: glossy, pointed tip
        f = _bell(0.7, 0.85); return _grid_blade(lambda t: 0.24 * f(t), rows, cols, 0.18, 0.1, 0.10)
    if shape == "fiddle":           # fiddle-leaf fig: wide near the tip, a waist, wavy
        f = _bell(1.5, 0.55); return _grid_blade(lambda t: 0.36 * f(t) * (1 - 0.18 * math.exp(-((t - 0.42) / 0.13) ** 2)), rows + 2, cols + 1, 0.10, 0.12, 0.06, curl=-0.08)
    if shape == "paddle":           # bird of paradise, banana: long, blunt, parallel-sided, torn along its veins
        f = _bell(0.3, 0.32); V, F, uv = _grid_blade(lambda t: 0.19 * f(t), rows + 8, cols + 1, 0.10, 0.22, 0.0)
        n = 2 * (cols + 1) + 1; keep = []
        tears = {int((rows + 8) * q) for q in (0.3, 0.52, 0.71)}
        for k in range(len(F)):              # leave out the outer quads of a few rows: slits from the edge in
            row, col = (k // 2) // (n - 1), (k // 2) % (n - 1)
            if row in tears and (col < 1 or col >= n - 2): continue
            keep.append(k)
        return V, F[keep], uv.reshape(-1, 3, 2)[keep].reshape(-1, 2)
    if shape == "strap":            # orchid, agave, dracaena, grasses: long, narrow
        f = _bell(0.3, 0.9); return _grid_blade(lambda t: 0.11 * f(t), rows, cols, 0.35, 0.18, 0.0)
    if shape == "orchid leaf":      # broad, fleshy, rounded
        f = _bell(0.45, 0.5); return _grid_blade(lambda t: 0.19 * f(t), rows, cols, 0.30, 0.12, 0.0)
    if shape == "pinna":            # a fern's leaflet or a palm's: narrow, drooping
        f = _bell(0.4, 1.0); return _grid_blade(lambda t: 0.07 * f(t), max(3, rows // 2), 1, 0.3, 0.25, 0.0)
    if shape == "small":            # box, myrtle: tiny oval
        f = _bell(0.8, 0.8); return _grid_blade(lambda t: 0.3 * f(t), 3, 1, 0.2, 0.05, 0.0)
    if shape == "maple":            # Japanese maple: seven lobes cut deep, pointed, finely toothed
        lobes = [(0.0, 1.0), (0.78, 0.92), (-0.78, 0.92), (1.55, 0.72), (-1.55, 0.72), (2.3, 0.42), (-2.3, 0.42)]
        def r(a):
            best = 0.16
            for (c, L) in lobes:
                u = abs((a - c + math.pi) % TAU - math.pi) / 0.42
                if u < 1: best = max(best, L * (1 - u) ** 0.62 + 0.16 * (1 - u))
            return best * (1 + 0.035 * math.sin(a * 46))
        return _polar_blade(r, max(24, int(40 * d)), 2, 0.12, 0.08, 0.55)
    if shape == "ginkgo":           # a fan, notched in the middle, on a long stalk
        def r(a):
            if abs(a) > 1.15: return 0.05
            return (0.95 - 0.28 * math.exp(-(a / 0.09) ** 2)) * (0.55 + 0.45 * math.cos(a * 0.9)) * (1 + 0.02 * math.sin(a * 30))
        return _polar_blade(r, max(16, int(28 * d)), 2, 0.2, 0.05, 0.7)
    if shape == "petal5":           # a flower of five rounded petals
        def r(a): return 0.25 + 0.75 * abs(math.cos(2.5 * a)) ** 0.6
        return _polar_blade(r, max(20, int(40 * d)), 2, 0.25, 0.0, 0.0)
    if shape == "orchid":           # a moth orchid: two broad petals, three sepals, the lip
        def r(a):
            v = 0.3
            for (c, L, w) in ((0.0, 0.8, 0.45), (2.1, 0.75, 0.5), (-2.1, 0.75, 0.5), (1.15, 0.95, 0.75), (-1.15, 0.95, 0.75), (math.pi, 0.55, 0.35)):
                u = abs((a - c + math.pi) % TAU - math.pi) / w
                if u < 1: v = max(v, L * math.sqrt(1 - u * u))
            return v
        return _polar_blade(r, max(24, int(56 * d)), 2, 0.18, 0.0, 0.0)
    raise ValueError(shape)


# ---------------------------------------------------------------- putting leaves on a plant
def frame(along, up):
    """3 x 3: columns across, along, face; the face as near to up as the leaf's line lets it"""
    a = along / np.linalg.norm(along); n = up - np.dot(up, a) * a
    if np.linalg.norm(n) < 1e-6: n = np.cross(a, [1.0, 0.0, 0.0])
    n /= np.linalg.norm(n); x = np.cross(a, n)
    return np.stack([x, a, n], axis=1)


def place(tmpl, P, R, S, rnd):
    """copies of a leaf template at points P (k, 3), turned by R (k, 3, 3), sized S (k,); each with its random number"""
    V, F, uv = tmpl; k = len(P)
    if k == 0: return np.zeros((0, 3)), np.zeros((0, 3), np.int32), np.zeros((0, 2)), np.zeros(0)
    P = np.asarray(P, np.float64); R = np.asarray(R, np.float64) * np.asarray(S, np.float64)[:, None, None]
    Vall = np.einsum("kij,mj->kmi", R, V) + P[:, None, :]
    Fall = (F[None, :, :] + (np.arange(k) * len(V))[:, None, None]).reshape(-1, 3)
    UV = np.tile(uv, (k, 1)); val = np.repeat(np.array([rnd.random() for _ in range(k)]), len(F))
    out = Vall.reshape(-1, 3)
    if INSTANCE: _MADE[id(out)] = (out, [(tmpl, P, R)])
    return out, Fall, UV, val


# ---------------------------------------------------------------- branches
class Branch:
    def __init__(self, pts, rad, level):
        self.pts = pts; self.rad = rad; self.level = level

    def at(self, t):
        """the point, the direction and the radius a fraction t of the way along"""
        n = len(self.pts) - 1; x = min(n - 1e-6, max(0.0, t * n)); i = int(x); f = x - i
        p = self.pts[i] * (1 - f) + self.pts[i + 1] * f; d = self.pts[i + 1] - self.pts[i]
        return p, d / (np.linalg.norm(d) + 1e-9), self.rad[i] * (1 - f) + self.rad[i + 1] * f


def tubes(branches, min_sides=4, max_sides=12):
    """the wood: every branch a tube, its rings carried along it without twisting; uv in metres (round, along)"""
    parts = []
    for br in branches:
        P = np.array(br.pts); R = np.array(br.rad); n = len(P)
        if n < 2: continue
        sides = int(min(max_sides, max(min_sides, round(R[0] * 260)))) if DETAIL >= 0.6 else min_sides
        if R[0] < 0.004: sides = 3
        T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1)[:, None] + 1e-9
        nrm = np.cross(T[0], [0.0, 0.0, 1.0] if abs(T[0][2]) < 0.9 else [1.0, 0.0, 0.0]); nrm /= np.linalg.norm(nrm)
        N = [nrm]
        for i in range(1, n):
            v = N[-1] - np.dot(N[-1], T[i]) * T[i]; N.append(v / (np.linalg.norm(v) + 1e-9))
        N = np.array(N); B = np.cross(T, N)
        a = np.linspace(0, TAU, sides, endpoint=False); ca, sa = np.cos(a), np.sin(a)
        V = P[:, None, :] + R[:, None, None] * (ca[None, :, None] * N[:, None, :] + sa[None, :, None] * B[:, None, :])
        L = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
        F = []
        for i in range(n - 1):
            for j in range(sides):
                j1 = (j + 1) % sides; q = (i * sides + j, i * sides + j1, (i + 1) * sides + j1, (i + 1) * sides + j)
                F += [(q[0], q[1], q[2]), (q[0], q[2], q[3])]
        F = np.array(F, np.int32)
        uvv = np.stack([np.tile(a / TAU * TAU * R.mean(), n), np.repeat(L, sides)], axis=1)
        parts.append((V.reshape(-1, 3), F, uvv[F].reshape(-1, 2), np.zeros(len(F))))
    return stack(parts)


def _turn(d, angle, azimuth):
    """d turned away from itself by angle, towards azimuth round it"""
    d = d / np.linalg.norm(d); ref = np.array([0.0, 0.0, 1.0]) if abs(d[2]) < 0.95 else np.array([1.0, 0.0, 0.0])
    x = np.cross(d, ref); x /= np.linalg.norm(x); y = np.cross(d, x)
    side = math.cos(azimuth) * x + math.sin(azimuth) * y
    return math.cos(angle) * d + math.sin(angle) * side


def grow(rnd, start, d, length, radius, level, sp, out):
    """one branch and, from it, its children (sp: the species' habit). Bends with its weight and towards the light."""
    seg = max(0.035, min(0.18, length / 8)); n = max(3, int(length / seg)); pts = [np.array(start, np.float64)]
    d = np.array(d, np.float64); d /= np.linalg.norm(d)
    trop = np.array([0.0, 0.0, sp["up"][min(level, len(sp["up"]) - 1)]])
    for i in range(n):
        wob = np.array([rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1)]) * sp["wobble"]
        hor = np.array([d[0], d[1], 0.0]); flat = sp.get("flat", 0.0) * level / max(1, sp["levels"])
        d = d + wob + trop * (1.0 / n) * 3 - np.array([0, 0, d[2]]) * flat * 0.3 + hor * 0.0
        d /= np.linalg.norm(d); pts.append(pts[-1] + d * length / n)
    tip = radius * sp["taper"]; rad = list(np.linspace(radius, tip, n + 1))
    br = Branch(pts, rad, level); out.append(br)
    if level >= sp["levels"]: return
    kids = rnd.randint(*sp["kids"][min(level, len(sp["kids"]) - 1)])
    t0 = sp["start"][min(level, len(sp["start"]) - 1)]; az0 = rnd.uniform(0, TAU)
    for k in range(kids):
        t = t0 + (1 - t0) * (k + rnd.uniform(0.2, 0.9)) / kids
        p, dd, r = br.at(t)
        if sp.get("opposite") and k % 2 == 1: az = az_prev + math.pi
        else: az = az0 + k * 2.39996 + rnd.uniform(-0.3, 0.3)
        az_prev = az
        ang = math.radians(rnd.uniform(*sp["angle"]))
        nd = _turn(dd, ang, az)
        L = length * sp["ratio"] * (1.15 - 0.45 * t) * rnd.uniform(0.8, 1.15)
        grow(rnd, p, nd, L, max(0.0015, r * sp["kid_r"]), level + 1, sp, out)


# ---------------------------------------------------------------- materials
def _mat(name):
    m = bpy.data.materials.get(name)
    if m: return m, None
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree


def leaf_material(name, pal, back=None, rough=0.45, trans=0.3, veins=0.25, vein_kind="pinnate", vein_col=None, spec=0.5, var=0.12):
    """a leaf: its colour from a palette by the leaf's own random number (pal: colours from 0 to 1), its veins lighter
    (pinnate: a midrib and side veins; palmate: from the stalk into each lobe), paler underneath, light through it"""
    m, nt = _mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = spec
    at = N.new("ShaderNodeAttribute"); at.attribute_type = "GEOMETRY"; at.attribute_name = "leafrand"
    ramp = N.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements; E[0].position = 0.0; E[0].color = (*pal[0], 1); E[1].position = 1.0; E[1].color = (*pal[-1], 1)
    for i, c in enumerate(pal[1:-1]): e = E.new((i + 1) / (len(pal) - 1)); e.color = (*c, 1)
    L.new(at.outputs["Fac"], ramp.inputs["Fac"])
    hs = N.new("ShaderNodeHueSaturation"); L.new(ramp.outputs["Color"], hs.inputs["Color"])
    L.new(lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", lib._math(nt, "FRACT", lib._math(nt, "MULTIPLY", at.outputs["Fac"], 7.31)), 2 * var), 1 - var), hs.inputs["Value"])
    col = hs.outputs["Color"]
    tc = N.new("ShaderNodeUVMap"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["UV"], sep.inputs[0])
    u = lib._math(nt, "SUBTRACT", sep.outputs[0], 0.5); v = sep.outputs[1]
    if vein_kind == "pinnate":
        au = lib._math(nt, "ABSOLUTE", u)
        mid = lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MINIMUM", lib._math(nt, "DIVIDE", au, 0.012), 1.0))
        ph = lib._math(nt, "FRACT", lib._math(nt, "MULTIPLY", lib._math(nt, "SUBTRACT", v, lib._math(nt, "MULTIPLY", au, 0.9)), 11.0))
        side = lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MINIMUM", lib._math(nt, "DIVIDE", lib._math(nt, "MINIMUM", ph, lib._math(nt, "SUBTRACT", 1.0, ph)), 0.06), 1.0))
        side = lib._math(nt, "MULTIPLY", side, lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MULTIPLY", au, 1.8)))
        vein = lib._math(nt, "MAXIMUM", mid, lib._math(nt, "MULTIPLY", side, 0.55))
    else:
        dv = lib._math(nt, "SUBTRACT", v, 0.5)
        ang = lib._math(nt, "ARCTAN2", u, dv)
        rr = lib._math(nt, "SQRT", lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", u, u), lib._math(nt, "MULTIPLY", dv, dv)))
        s = lib._math(nt, "ABSOLUTE", lib._math(nt, "SINE", lib._math(nt, "MULTIPLY", ang, 4.0)))
        vein = lib._math(nt, "MULTIPLY", lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MINIMUM", lib._math(nt, "DIVIDE", s, 0.07), 1.0)),
                         lib._math(nt, "SUBTRACT", 1.0, lib._math(nt, "MINIMUM", lib._math(nt, "MULTIPLY", rr, 1.6), 1.0)))
    vc = N.new("ShaderNodeMix"); vc.data_type = "RGBA"; vc.blend_type = "MIX"
    L.new(lib._math(nt, "MULTIPLY", vein, veins), vc.inputs["Factor"]); L.new(col, vc.inputs[6])
    if vein_col is None:
        lt = N.new("ShaderNodeHueSaturation"); lt.inputs["Saturation"].default_value = 0.8; lt.inputs["Value"].default_value = 1.6; L.new(col, lt.inputs["Color"]); L.new(lt.outputs["Color"], vc.inputs[7])
    else: vc.inputs[7].default_value = (*vein_col, 1)
    col = vc.outputs[2]
    if back is not None:                   # the underside
        geo = N.new("ShaderNodeNewGeometry"); bk = N.new("ShaderNodeMix"); bk.data_type = "RGBA"
        L.new(geo.outputs["Backfacing"], bk.inputs["Factor"]); L.new(col, bk.inputs[6])
        bh = N.new("ShaderNodeMix"); bh.data_type = "RGBA"; bh.inputs["Factor"].default_value = back[1]; L.new(col, bh.inputs[6]); bh.inputs[7].default_value = (*back[0], 1)
        L.new(bh.outputs[2], bk.inputs[7]); col = bk.outputs[2]
    L.new(col, b.inputs["Base Color"])
    tl = N.new("ShaderNodeBsdfTranslucent"); L.new(col, tl.inputs["Color"])
    mx = N.new("ShaderNodeMixShader"); mx.inputs["Fac"].default_value = trans
    L.new(b.outputs["BSDF"], mx.inputs[1]); L.new(tl.outputs["BSDF"], mx.inputs[2]); L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def bark_material(name, base, dark, kind="smooth", scale=1.0):
    """bark by the branch's own coordinates (round, along, in metres): smooth with faint rings, furrowed, fibrous
    (a tree fern's trunk) or ringed (a palm's)"""
    m, nt = _mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.78
    uvn = N.new("ShaderNodeUVMap"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(uvn.outputs["UV"], sep.inputs[0])
    cmb = N.new("ShaderNodeCombineXYZ")
    sq = {"smooth": 1.0, "furrowed": 5.0, "fibrous": 9.0, "ringed": 1.0}[kind]
    L.new(lib._math(nt, "MULTIPLY", sep.outputs[0], 28.0 * scale), cmb.inputs[0]); L.new(lib._math(nt, "MULTIPLY", sep.outputs[1], 28.0 * scale / sq), cmb.inputs[1])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 1.0; nz.inputs["Detail"].default_value = 8.0; nz.inputs["Roughness"].default_value = 0.6
    L.new(cmb.outputs[0], nz.inputs["Vector"])
    h = nz.outputs["Fac"]
    if kind == "ringed":
        h = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", h, 0.4), lib._math(nt, "MULTIPLY", lib._math(nt, "POWER", lib._math(nt, "ABSOLUTE", lib._math(nt, "SINE", lib._math(nt, "MULTIPLY", sep.outputs[1], 32.0 * scale))), 6.0), 0.6))
    if kind == "furrowed":
        h = lib._math(nt, "POWER", h, 1.8)
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(h, mx.inputs["Factor"]); mx.inputs[6].default_value = (*dark, 1); mx.inputs[7].default_value = (*base, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = {"smooth": 0.25, "furrowed": 0.9, "fibrous": 0.8, "ringed": 0.5}[kind]; bp.inputs["Distance"].default_value = 0.01
    L.new(h, bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def planter_material(style):
    names = {"bronze": ("planter bronze", (0.11, 0.075, 0.05), 0.32, 1.0), "travertine": ("planter travertine", (0.72, 0.64, 0.53), 0.55, 0.0),
             "terracotta": ("planter terracotta", (0.55, 0.27, 0.15), 0.8, 0.0), "basalt": ("planter basalt", (0.06, 0.06, 0.065), 0.45, 0.0),
             "white": ("planter white", (0.80, 0.78, 0.74), 0.4, 0.0), "black": ("planter black", (0.03, 0.03, 0.032), 0.35, 0.0)}
    n, c, r, mt = names[style]
    m = bpy.data.materials.get(n)
    if m: return m
    m, nt = _mat(n); N = nt.nodes; L = nt.links; b = N["Principled BSDF"]
    b.inputs["Roughness"].default_value = r; b.inputs["Metallic"].default_value = mt
    tc = N.new("ShaderNodeTexCoord"); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 9.0; nz.inputs["Detail"].default_value = 6.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(nz.outputs["Fac"], mx.inputs["Factor"])
    mx.inputs[6].default_value = (c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, 1); mx.inputs[7].default_value = (min(1, c[0] * 1.15), min(1, c[1] * 1.15), min(1, c[2] * 1.15), 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.12; L.new(nz.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def soil_material():
    m = bpy.data.materials.get("planter soil")
    if m: return m
    m, nt = _mat("planter soil"); N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.95
    tc = N.new("ShaderNodeTexCoord"); v = N.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 60.0; L.new(tc.outputs["Object"], v.inputs["Vector"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(v.outputs["Distance"], mx.inputs["Factor"]); mx.inputs[6].default_value = (0.05, 0.035, 0.025, 1); mx.inputs[7].default_value = (0.16, 0.11, 0.07, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.6; L.new(v.outputs["Distance"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def planter(name, loc, d, h, style="bronze", square=False):
    """a planter d across and h tall, its soil 4 cm below the rim; the plant stands at loc + (0, 0, h - 0.04)"""
    x, y, z = loc; wall = max(0.02, d * 0.035); out = []
    if square:
        out.append(lib.box(name, (d, d, h), (x, y, z + h / 2), planter_material(style), bevel=0.012))
        out.append(lib.box(name + " soil", (d - 2 * wall, d - 2 * wall, 0.02), (x, y, z + h - 0.05), soil_material()))
    else:
        out.append(lib.cyl(name, d / 2, h, (x, y, z), planter_material(style), verts=96, r2=d / 2 * 0.9 if style == "terracotta" else None, bevel=0.01))
        out.append(lib.cyl(name + " soil", d / 2 - wall, 0.02, (x, y, z + h - 0.06), soil_material(), verts=64))
    return out, (x, y, z + h - 0.04)


# ---------------------------------------------------------------- species
def _leaves_on(branches, sp, rnd, tmpl, size, levels=None, per_m=None, up_bias=0.6, droop=0.3, out_bias=0.4, opposite=True,
               t0=0.15, centre=(0, 0, 0), petiole_angle=55):
    """leaves along the youngest branches: in pairs (opposite) or one by one round the twig, at per_m to the metre,
    their stalks out from the twig, their faces turned up and out to the light"""
    P, R, S = [], [], []; per_m = per_m * DETAIL ** 0.5 if per_m else 30; c = np.array(centre, np.float64)
    lv = levels if levels is not None else {sp["levels"]}
    for br in branches:
        if br.level not in lv: continue
        L = sum(np.linalg.norm(np.array(br.pts[i + 1]) - np.array(br.pts[i])) for i in range(len(br.pts) - 1))
        n = max(1, int(L * per_m)); az = rnd.uniform(0, TAU)
        for i in range(n):
            t = t0 + (1 - t0) * (i + rnd.random() * 0.6) / n
            p, d, r = br.at(t)
            for k in ((0, 1) if opposite else (0,)):
                a = az + k * math.pi + (i * (math.pi / 2) if opposite else i * 2.39996)
                stalk = _turn(d, math.radians(petiole_angle + rnd.uniform(-15, 15)), a)
                outv = p - c; outv[2] = 0; outv = outv / (np.linalg.norm(outv) + 1e-9)
                dirn = stalk + np.array([0, 0, -droop]) + outv * out_bias * 0.5; dirn /= np.linalg.norm(dirn)
                upv = np.array([0, 0, 1.0]) * up_bias + outv * out_bias + np.array([rnd.gauss(0, 0.35), rnd.gauss(0, 0.35), rnd.gauss(0, 0.2)])
                P.append(p); R.append(frame(dirn, upv)); S.append(size * rnd.uniform(0.75, 1.2))
    return place(tmpl, P, R, S, rnd)


def _tree(name, loc, rnd, sp, leaf, leaf_mat, bark, size, per_m, opposite, stems=1, lean=(5, 25), height=3.0, trunk_r=0.06,
          up_bias=0.6, droop=0.3, petiole_angle=55, extra=None):
    """a tree of sp's habit: stems from its foot, branches, leaves on the youngest"""
    branches = []; x, y, z = loc
    for s in range(stems):
        a = TAU * s / stems + rnd.uniform(-0.4, 0.4); tilt = math.radians(rnd.uniform(*lean)) if stems > 1 else math.radians(rnd.uniform(0, lean[0]))
        d = np.array([math.sin(tilt) * math.cos(a), math.sin(tilt) * math.sin(a), math.cos(tilt)])
        grow(rnd, (rnd.uniform(-0.03, 0.03) * stems, rnd.uniform(-0.03, 0.03) * stems, 0.0), d, height * sp["trunk"] * rnd.uniform(0.85, 1.1),
             trunk_r * (1.0 if stems == 1 else 0.7), 0, sp, branches)
    # the habit gives the shape; the tree is then sized to its height (the leaves stay their own size)
    top = max(max(p[2] for p in br.pts) for br in branches); k = (height - size * 0.6) / max(top, 1e-3)
    for br in branches:
        br.pts = [np.array(p) * k for p in br.pts]; br.rad = [r * k ** 0.85 for r in br.rad]
    for br in branches:                      # the trunk flares into the ground
        if br.level == 0 and len(br.rad) > 2: br.rad[0] *= 1.55; br.rad[1] *= 1.18
    spurs = []                               # short shoots along the youngest branches: leaves right through the crown
    for br in branches:
        if br.level < sp["levels"] - 1: continue
        L = sum(np.linalg.norm(np.array(br.pts[i + 1]) - np.array(br.pts[i])) for i in range(len(br.pts) - 1)); n = int(L / 0.09)
        for i in range(n):
            p, d, r = br.at(0.15 + 0.85 * (i + rnd.random()) / max(1, n)); sd = _turn(d, math.radians(rnd.uniform(35, 70)), rnd.uniform(0, TAU))
            sd[2] += 0.25; sd /= np.linalg.norm(sd); ln = rnd.uniform(0.06, 0.16)
            spurs.append(Branch([p, p + sd * ln * 0.5, p + sd * ln], [max(0.0012, r * 0.5), max(0.001, r * 0.4), 0.001], sp["levels"] + 1))
    wood = mesh_from(name + " wood", *tubes(branches + spurs, 3, 12)[:3], mat=bark, loc=loc)
    tm = blade(leaf, DETAIL)
    V, F, uv, w = _leaves_on(branches + spurs, sp, rnd, tm, size, levels={sp["levels"], sp["levels"] + 1}, per_m=per_m, opposite=opposite,
                             up_bias=up_bias, droop=droop, petiole_angle=petiole_angle)
    if extra: V, F, uv, w = stack([(V, F, uv, w)] + extra(branches))
    leaves = mesh_from(name + " leaves", V, F, uv, w, mat=leaf_mat, loc=loc)
    return [wood, leaves], branches


MAPLE = {"red": [(0.20, 0.012, 0.016), (0.32, 0.02, 0.022), (0.42, 0.035, 0.03), (0.27, 0.03, 0.05)],
         "orange": [(0.62, 0.10, 0.02), (0.78, 0.26, 0.03), (0.86, 0.42, 0.05), (0.55, 0.05, 0.03)],
         "gold": [(0.70, 0.45, 0.04), (0.82, 0.60, 0.08), (0.62, 0.52, 0.10), (0.78, 0.36, 0.04)],
         "green": [(0.10, 0.22, 0.03), (0.16, 0.30, 0.05), (0.22, 0.36, 0.06)]}


def japanese_maple(name, loc, rnd, height=3.0, colour="red", stems=3):
    """Acer palmatum: several stems leaning out from the foot, branches in layers, an umbrella of seven-lobed leaves
    6 to 9 cm across on long red stalks, in pairs"""
    sp = dict(levels=4, trunk=0.42, kids=[(3, 4), (3, 5), (3, 5), (4, 7), (3, 5)], start=[0.45, 0.25, 0.2, 0.15], angle=(32, 58),
              ratio=0.62, kid_r=0.62, taper=0.55, up=[0.15, 0.0, -0.08, -0.12, -0.15], wobble=0.07, flat=0.6, opposite=True)
    bark = bark_material("maple bark", (0.16, 0.13, 0.11), (0.055, 0.045, 0.04), "smooth")
    pal = MAPLE[colour]
    mat = leaf_material("maple leaf " + colour, pal, back=((0.5 * pal[1][0] + 0.1, 0.5 * pal[1][1] + 0.05, 0.5 * pal[1][2] + 0.04), 0.35),
                        rough=0.5, trans=0.38, veins=0.18, vein_kind="palmate")
    objs, _ = _tree(name, loc, rnd, sp, "maple", mat, bark, 0.075, 26, True, stems=stems, lean=(14, 32), height=height,
                    trunk_r=0.055 * height / 3.0, up_bias=0.9, droop=0.15, petiole_angle=60)
    return objs


def ginkgo(name, loc, rnd, height=4.0, colour="gold"):
    """Ginkgo biloba: one straight trunk, branches rising, fan-shaped leaves in tufts on short spurs, gold in autumn"""
    sp = dict(levels=3, trunk=0.35, kids=[(5, 7), (3, 5), (3, 5), (2, 3)], start=[0.15, 0.2, 0.25], angle=(35, 55), ratio=0.5, kid_r=0.55,
              taper=0.5, up=[0.6, 0.25, 0.1, 0.0], wobble=0.04, flat=0.0, opposite=False)
    bark = bark_material("ginkgo bark", (0.20, 0.17, 0.14), (0.07, 0.06, 0.05), "furrowed")
    pal = [(0.80, 0.50, 0.02), (0.90, 0.64, 0.04), (0.76, 0.56, 0.05), (0.58, 0.50, 0.06)] if colour == "gold" else [(0.20, 0.36, 0.08), (0.30, 0.44, 0.12)]
    mat = leaf_material("ginkgo leaf " + colour, pal, back=((0.7, 0.55, 0.15), 0.25), rough=0.55, trans=0.4, veins=0.15, vein_kind="palmate", var=0.08)
    objs, _ = _tree(name, loc, rnd, sp, "ginkgo", mat, bark, 0.075, 70, False, height=height, trunk_r=0.07 * height / 4.0, up_bias=0.8, droop=0.2, petiole_angle=50)
    return objs


def olive(name, loc, rnd, height=3.2, stems=2):
    """Olea europaea: a gnarled trunk splitting low, grey bark, narrow leaves silver underneath, in pairs"""
    sp = dict(levels=4, trunk=0.4, kids=[(2, 3), (3, 4), (3, 4), (4, 6), (4, 6)], start=[0.55, 0.3, 0.2, 0.1], angle=(22, 45), ratio=0.62, kid_r=0.6,
              taper=0.6, up=[0.5, 0.35, 0.15, 0.0, -0.1], wobble=0.16, flat=0.0, opposite=True)
    bark = bark_material("olive bark", (0.24, 0.23, 0.20), (0.07, 0.065, 0.06), "furrowed", 0.8)
    mat = leaf_material("olive leaf v2", [(0.18, 0.22, 0.12), (0.24, 0.28, 0.17), (0.28, 0.31, 0.20)], back=((0.55, 0.58, 0.52), 0.85), rough=0.45, trans=0.2, veins=0.12)
    objs, _ = _tree(name, loc, rnd, sp, "lance", mat, bark, 0.07, 70, True, stems=stems, lean=(10, 30), height=height,
                    trunk_r=0.09 * height / 3.2, up_bias=0.5, droop=0.25, petiole_angle=40)
    return objs


def lemon(name, loc, rnd, height=2.4, fruit=0.05):
    """a Meyer lemon: a dense rounded bush of glossy leaves, lemons among them"""
    sp = dict(levels=4, trunk=0.3, kids=[(3, 4), (3, 4), (3, 5), (3, 5), (3, 4)], start=[0.6, 0.25, 0.2, 0.1], angle=(30, 60), ratio=0.62, kid_r=0.6,
              taper=0.55, up=[0.3, 0.15, 0.05, -0.05, -0.1], wobble=0.08, flat=0.0, opposite=False)
    bark = bark_material("citrus bark", (0.17, 0.16, 0.12), (0.06, 0.055, 0.045), "smooth")
    mat = leaf_material("lemon leaf v2", [(0.04, 0.12, 0.025), (0.06, 0.16, 0.035), (0.09, 0.20, 0.04)], back=((0.25, 0.32, 0.12), 0.6), rough=0.28, trans=0.22, veins=0.18, spec=0.6)
    fruit_mat = lib.principled("lemon skin v2", (0.86, 0.64, 0.06), 0.35, **{"Coat Weight": 0.25})
    def lemons(branches):
        P, R, S = [], [], []
        for br in branches:
            if br.level == sp["levels"] and rnd.random() < fruit * 8:
                p, d, r = br.at(rnd.uniform(0.6, 1.0)); P.append(p + np.array([0, 0, -0.05])); R.append(frame(np.array([0, 0, -1.0]), np.array([1.0, 0, 0]))); S.append(rnd.uniform(0.9, 1.1))
        bm = _ellipsoid(0.034, 0.034, 0.045, 12, 8); V, F, uv, w = place(bm, P, R, S, rnd)
        return [(V, F, uv, np.full(len(F), 2.0))]
    objs, _ = _tree(name, loc, rnd, sp, "ellipse", mat, bark, 0.10, 26, False, height=height, trunk_r=0.04, up_bias=0.6, droop=0.25, petiole_angle=45, extra=lemons)
    objs[1].data.materials.append(fruit_mat)
    _assign_by_value(objs[1], 2.0, 1)
    return objs


def fiddle_leaf_fig(name, loc, rnd, height=2.6, stems=3):
    """Ficus lyrata: a few upright stems, big leathery fiddle-shaped leaves (30 to 40 cm) spiralling up them, held
    out stiffly, dark glossy green with pale veins"""
    parts = []; P, R, S = [], [], []
    wood_parts = []
    for s in range(stems):
        a = TAU * s / stems + rnd.uniform(-0.5, 0.5); tilt = math.radians(rnd.uniform(4, 14)); h = height * rnd.uniform(0.7, 1.0)
        d = np.array([math.sin(tilt) * math.cos(a), math.sin(tilt) * math.sin(a), math.cos(tilt)])
        br = []; grow(rnd, (0, 0, 0), d, h, 0.02, 0, dict(levels=0, trunk=1, kids=[(0, 0)], start=[0], angle=(0, 0), ratio=0, kid_r=0, taper=0.5,
                                                         up=[0.3], wobble=0.02), br)
        wood_parts += br
        n = int(h * 12 * DETAIL ** 0.3)
        for i in range(n):
            t = 0.25 + 0.75 * i / n; p, dd, r = br[0].at(t); az = i * 2.39996 + s
            stalk = _turn(dd, math.radians(rnd.uniform(40, 65)), az)
            outv = np.array([stalk[0], stalk[1], 0.0]); outv /= np.linalg.norm(outv) + 1e-9
            dirn = stalk + np.array([0, 0, 0.15]); upv = np.array([0, 0, 1.0]) * 0.8 + outv * 0.5 + np.array([rnd.gauss(0, 0.2), rnd.gauss(0, 0.2), 0])
            P.append(p); R.append(frame(dirn, upv)); S.append(rnd.uniform(0.36, 0.5) * (0.8 + 0.35 * t))
    tm = blade("fiddle", DETAIL)
    mat = leaf_material("fiddle leaf", [(0.03, 0.10, 0.02), (0.05, 0.14, 0.03), (0.07, 0.17, 0.035)], back=((0.20, 0.28, 0.12), 0.5),
                        rough=0.3, trans=0.15, veins=0.45, vein_col=(0.35, 0.45, 0.15), spec=0.6)
    wood = mesh_from(name + " wood", *tubes(wood_parts)[:3], mat=bark_material("fig bark", (0.36, 0.32, 0.27), (0.18, 0.15, 0.12), "smooth"), loc=loc)
    leaves = mesh_from(name + " leaves", *place(tm, P, R, S, rnd), mat=mat, loc=loc)
    return [wood, leaves]


def strelitzia(name, loc, rnd, height=3.2, stems=5):
    """Strelitzia nicolai, the white bird of paradise: grey stems from a clump, each a fan of huge paddle leaves on long
    stalks, the older ones torn along their veins"""
    P, R, S, stalks = [], [], [], []
    tm = blade("paddle", DETAIL)
    for s in range(stems):
        a = TAU * s / stems + rnd.uniform(-0.3, 0.3); h = height * rnd.uniform(0.35, 0.65)
        base = np.array([0.12 * math.cos(a), 0.12 * math.sin(a), 0.0]); fan = a + math.pi / 2 + rnd.uniform(-0.4, 0.4)
        top = base + np.array([0.05 * math.cos(a), 0.05 * math.sin(a), h * 0.45])
        stalks.append(Branch([base, top], [0.07, 0.06], 0))
        nl = rnd.randint(4, 7)
        for k in range(nl):
            f = (k + 0.5) / nl - 0.5; ang = f * 1.6 + rnd.uniform(-0.1, 0.1)
            d = np.array([math.sin(ang) * math.cos(fan), math.sin(ang) * math.sin(fan), math.cos(ang)])
            pl = h * rnd.uniform(0.55, 0.85)
            stalk_pts = [top + d * pl * q + np.array([0, 0, -0.04 * q * q]) for q in np.linspace(0, 1, 6)]
            stalks.append(Branch(stalk_pts, list(np.linspace(0.03, 0.018, 6)), 1))
            tip = stalk_pts[-1]; along = d + np.array([0, 0, -0.25 - 0.5 * abs(f)]); along /= np.linalg.norm(along)
            side = np.array([math.cos(fan), math.sin(fan), 0.0])
            upv = np.cross(along, side); upv = upv if upv[2] > 0 else -upv
            P.append(tip); R.append(frame(along, upv + side * rnd.gauss(0, 0.3))); S.append(height * rnd.uniform(0.38, 0.5))
    leaves = place(tm, P, R, S, rnd); V, F, uv, w = leaves
    V = V.copy()
    # tears: some strips of each blade twisted down a little
    mat = leaf_material("strelitzia leaf", [(0.035, 0.09, 0.035), (0.05, 0.12, 0.045), (0.07, 0.15, 0.055)], back=((0.22, 0.28, 0.20), 0.45),
                        rough=0.4, trans=0.25, veins=0.3, vein_col=(0.55, 0.60, 0.40))
    wood = mesh_from(name + " stems", *tubes(stalks)[:3], mat=bark_material("strelitzia stem", (0.26, 0.27, 0.22), (0.17, 0.18, 0.14), "smooth"), loc=loc)
    return [wood, mesh_from(name + " leaves", V, F, uv, w, mat=mat, loc=loc)]


def kentia(name, loc, rnd, height=3.0, stems=3):
    """Howea forsteriana, the kentia palm: slender ringed stems, each with a crown of arching fronds, the leaflets
    hanging from them"""
    stalks = []; parts = []; pin = blade("pinna", DETAIL)
    mat = leaf_material("kentia leaf", [(0.04, 0.12, 0.03), (0.06, 0.16, 0.04), (0.08, 0.18, 0.05)], back=((0.15, 0.22, 0.10), 0.4), rough=0.35, trans=0.3, veins=0.15)
    for s in range(stems):
        a = TAU * s / stems + rnd.uniform(-0.4, 0.4); h = height * rnd.uniform(0.35, 0.6); tilt = math.radians(rnd.uniform(4, 12))
        top = np.array([math.sin(tilt) * math.cos(a) * h, math.sin(tilt) * math.sin(a) * h, h])
        stalks.append(Branch([np.zeros(3), top * 0.5, top], [0.045, 0.04, 0.035], 0))
        nf = rnd.randint(6, 9)
        for k in range(nf):
            az = k * 2.39996 + rnd.uniform(-0.2, 0.2); rise = math.radians(rnd.uniform(25, 70)); L = height * rnd.uniform(0.45, 0.65)
            d0 = np.array([math.cos(rise) * math.cos(az), math.cos(rise) * math.sin(az), math.sin(rise)])
            pts = []; p = top.copy(); d = d0.copy()
            for q in range(12):
                pts.append(p.copy()); d = d + np.array([0, 0, -0.15]); d /= np.linalg.norm(d); p = p + d * L / 11
            br = Branch(pts, list(np.linspace(0.012, 0.003, 12)), 1); stalks.append(br)
            P, R, S = [], [], []; npin = int(28 * DETAIL ** 0.5)
            for i in range(npin):
                t = 0.15 + 0.85 * i / npin; pp, dd, _ = br.at(t)
                side = np.cross(dd, [0, 0, 1.0]); side /= np.linalg.norm(side) + 1e-9
                for sgn in (-1, 1):
                    along = dd * 0.4 + sgn * side * 0.55 + np.array([0, 0, -0.85]); along /= np.linalg.norm(along)
                    P.append(pp); R.append(frame(along, np.array([0, 0, 1.0]) + sgn * side * 0.3)); S.append(L * 0.38 * (1 - 0.6 * abs(t - 0.45)))
            parts.append(place(pin, P, R, S, rnd))
    wood = mesh_from(name + " stems", *tubes(stalks)[:3], mat=bark_material("kentia stem", (0.22, 0.24, 0.16), (0.15, 0.16, 0.11), "smooth", 1.5), loc=loc)
    return [wood, mesh_from(name + " leaves", *stack(parts), mat=mat, loc=loc)]


def tree_fern(name, loc, rnd, height=2.6):
    """Dicksonia antarctica: a thick trunk of brown fibres, a crown of long arching fronds cut twice into leaflets"""
    trunk_h = height * 0.62
    pts = [np.array([0, 0, 0.0]), np.array([0.03, 0.02, trunk_h * 0.5]), np.array([0.05, 0.0, trunk_h])]
    stalks = [Branch(pts, [0.17, 0.15, 0.14], 0)]; parts = []; pin = blade("pinna", DETAIL)
    mat = leaf_material("tree fern leaf", [(0.12, 0.26, 0.04), (0.17, 0.33, 0.06), (0.22, 0.38, 0.08)], back=((0.30, 0.35, 0.20), 0.4), rough=0.55, trans=0.35, veins=0.1)
    top = pts[-1]; nf = rnd.randint(12, 16)
    for k in range(nf):
        az = k * 2.39996; rise = math.radians(rnd.uniform(40, 68)); L = height * rnd.uniform(0.7, 0.95)
        d = np.array([math.cos(rise) * math.cos(az), math.cos(rise) * math.sin(az), math.sin(rise)]); p = top.copy(); fp = []
        for q in range(14):
            fp.append(p.copy()); d = d + np.array([0, 0, -0.14]); d /= np.linalg.norm(d); p = p + d * L / 13
        br = Branch(fp, list(np.linspace(0.01, 0.003, 14)), 1); stalks.append(br)
        P, R, S = [], [], []; n = int(22 * DETAIL ** 0.5)
        for i in range(n):
            t = 0.12 + 0.88 * i / n; pp, dd, _ = br.at(t); side = np.cross(dd, [0, 0, 1.0]); side /= np.linalg.norm(side) + 1e-9
            pl = L * 0.32 * math.sin(math.pi * (0.15 + 0.85 * t)) ** 0.8
            for sgn in (-1, 1):
                pd = dd * 0.25 + sgn * side + np.array([0, 0, -0.15]); pd /= np.linalg.norm(pd); m = int(12 * DETAIL ** 0.5) + 3
                for j in range(m):           # the leaflets of this leaflet
                    u = (j + 0.5) / m; q = pp + pd * pl * u + np.array([0, 0, -0.03 * u])
                    for s2 in (-1, 1):
                        a2 = pd * 0.5 + s2 * dd * 0.85 + np.array([0, 0, -0.25]); a2 /= np.linalg.norm(a2)
                        P.append(q); R.append(frame(a2, np.array([0, 0, 1.0]))); S.append(pl * 0.28 * (1 - 0.7 * u))
        parts.append(place(pin, P, R, S, rnd))
    wood = mesh_from(name + " trunk", *tubes(stalks)[:3], mat=bark_material("tree fern trunk", (0.20, 0.12, 0.07), (0.06, 0.035, 0.02), "fibrous", 1.4), loc=loc)
    return [wood, mesh_from(name + " leaves", *stack(parts), mat=mat, loc=loc)]


def orchid(name, loc, rnd, colour="white", spikes=2):
    """Phalaenopsis, the moth orchid: broad fleshy leaves low in the pot, arching spikes of flowers (white with a pink
    lip, or magenta)"""
    leaves = blade("orchid leaf", DETAIL); fl = blade("orchid", DETAIL); P, R, S = [], [], []
    for k in range(rnd.randint(4, 6)):
        az = k * math.pi + (k // 2) * 0.3 + rnd.uniform(-0.15, 0.15); d = np.array([math.cos(az), math.sin(az), 0.35]); d /= np.linalg.norm(d)
        P.append(np.array([0, 0, 0.02 + 0.01 * k])); R.append(frame(d, np.array([0, 0, 1.0]))); S.append(rnd.uniform(0.2, 0.28))
    lv = place(leaves, P, R, S, rnd)
    stalks, P2, R2, S2 = [], [], [], []
    for s in range(spikes):
        az = rnd.uniform(0, TAU); pts = []; p = np.array([0, 0, 0.03]); d = np.array([0.08 * math.cos(az), 0.08 * math.sin(az), 1.0])
        for q in range(16):
            pts.append(p.copy()); d = d + np.array([math.cos(az), math.sin(az), 0]) * (0.16 if q > 5 else 0.0) + np.array([0, 0, -0.07 if q > 7 else 0]); d /= np.linalg.norm(d); p = p + d * 0.045
        br = Branch(pts, list(np.linspace(0.004, 0.0025, 16)), 1); stalks.append(br)
        nfl = rnd.randint(6, 9)
        for i in range(nfl):
            t = 0.5 + 0.5 * i / nfl; pp, dd, _ = br.at(t); side = (i % 2 - 0.5) * 0.9
            facing = np.array([math.cos(az + side), math.sin(az + side), -0.15])
            P2.append(pp + np.array([0, 0, -0.035])); R2.append(frame(np.array([0, 0, 1.0]), facing)); S2.append(rnd.uniform(0.085, 0.1) * (1.05 - 0.25 * i / nfl))
    pal = {"white": [(0.86, 0.85, 0.84), (0.90, 0.88, 0.88)], "pink": [(0.80, 0.30, 0.55), (0.86, 0.42, 0.65)], "magenta": [(0.55, 0.06, 0.32), (0.66, 0.10, 0.42)]}[colour]
    fm = leaf_material("orchid flower " + colour, pal, rough=0.45, trans=0.35, veins=0.35, vein_kind="palmate", vein_col=(0.62, 0.12, 0.38))
    lm = leaf_material("orchid leaf", [(0.06, 0.16, 0.04), (0.08, 0.19, 0.05)], back=((0.20, 0.25, 0.12), 0.4), rough=0.25, trans=0.1, veins=0.1, spec=0.6)
    stem = mesh_from(name + " spikes", *tubes(stalks)[:3], mat=bark_material("orchid spike", (0.20, 0.25, 0.12), (0.12, 0.15, 0.06), "smooth"), loc=loc)
    return [stem, mesh_from(name + " leaves", *lv, mat=lm, loc=loc), mesh_from(name + " flowers", *place(fl, P2, R2, S2, rnd), mat=fm, loc=loc)]


def agave(name, loc, rnd, size=1.0, colour="blue"):
    """Agave americana: a rosette of thick, stiff, blue-grey leaves edged with teeth, ending in a spine"""
    tm = blade("strap", DETAIL); P, R, S = [], [], []; n = int(34 * max(0.5, DETAIL))
    for i in range(n):
        f = i / n; az = i * 2.39996; rise = math.radians(78 - 62 * f ** 0.8)
        d = np.array([math.cos(rise) * math.cos(az), math.cos(rise) * math.sin(az), math.sin(rise)])
        P.append(np.array([0, 0, 0.04 + 0.12 * (1 - f) * size])); R.append(frame(d, np.array([0, 0, 1.0]) - d * 0.0 + np.array([-math.cos(az), -math.sin(az), 0]) * 0.6))
        S.append(size * (0.45 + 0.55 * f ** 0.4) * rnd.uniform(0.9, 1.05))
    V, F, uv, w = place(tm, P, R, S, rnd)
    pal = {"blue": [(0.30, 0.40, 0.42), (0.36, 0.46, 0.48), (0.28, 0.38, 0.36)], "green": [(0.20, 0.30, 0.14), (0.26, 0.36, 0.18)]}[colour]
    mat = leaf_material("agave leaf " + colour, pal, back=((0.40, 0.48, 0.46), 0.3), rough=0.5, trans=0.08, veins=0.05, spec=0.4)
    return [mesh_from(name + " leaves", V, F, uv, w, mat=mat, loc=loc)]


def barrel_cactus(name, loc, rnd, r=0.28):
    """Echinocactus grusonii, the golden barrel: a ribbed green ball, rows of golden spines along its ribs"""
    ribs = 24; seg_u = 96 if DETAIL > 0.6 else 48; seg_v = 32 if DETAIL > 0.6 else 16; V, F, uv = [], [], []
    for i in range(seg_v + 1):
        th = math.pi * 0.95 * i / seg_v
        for j in range(seg_u):
            ph = TAU * j / seg_u; rr = r * (1 + 0.07 * math.cos(ribs * ph)) * (0.92 if i == 0 else 1)
            V.append((rr * math.sin(th) * math.cos(ph), rr * math.sin(th) * math.sin(ph), r * 0.85 * (1 - math.cos(th)) * 0.6 + 0.0 * th)); uv.append((j / seg_u, i / seg_v))
    for i in range(seg_v):
        for j in range(seg_u):
            j1 = (j + 1) % seg_u; a, b, c, d = i * seg_u + j, i * seg_u + j1, (i + 1) * seg_u + j1, (i + 1) * seg_u + j
            F += [(a, b, c), (a, c, d)]
    V = np.array(V); V[:, 2] = V[:, 2].max() - V[:, 2]           # the crown up
    body = _tmpl(V, F, uv)
    # spines: little tufts on the ribs
    sp = blade("pinna", 0.3); P, R, S = [], [], []
    for k in range(ribs):
        ph = TAU * k / ribs
        for i in range(2, seg_v, 2 if DETAIL > 0.6 else 4):
            th = math.pi * 0.95 * i / seg_v; rr = r * 1.07
            p = np.array([rr * math.sin(th) * math.cos(ph), rr * math.sin(th) * math.sin(ph), V[:, 2].max() - r * 0.85 * (1 - math.cos(th)) * 0.6])
            nrm = np.array([math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)])
            for q in range(5):
                d = nrm + np.array([rnd.gauss(0, 0.5), rnd.gauss(0, 0.5), rnd.gauss(0, 0.5)]); P.append(p); R.append(frame(d, np.cross(d, [0, 0, 1.0]) + 1e-3)); S.append(rnd.uniform(0.025, 0.04))
    green = lib.principled("cactus skin", (0.10, 0.22, 0.07), 0.45)
    gold = leaf_material("cactus spines", [(0.80, 0.62, 0.22), (0.88, 0.74, 0.35)], rough=0.4, trans=0.4, veins=0.0)
    Vb, Fb, uvb = body
    return [mesh_from(name + " body", Vb, Fb, uvb, None, mat=green, loc=loc), mesh_from(name + " spines", *place(sp, P, R, S, rnd), mat=gold, loc=loc)]


def lavender(name, loc, rnd, size=0.6):
    """Lavandula: a mound of narrow grey-green leaves, purple spikes on thin stems above it"""
    tm = blade("lance", DETAIL); P, R, S = [], [], []; stems = []
    for i in range(int(1100 * DETAIL)):
        u = rnd.random(); az = rnd.uniform(0, TAU); rr = size * 0.55 * math.sqrt(u); h = size * 0.45 * math.sqrt(max(0, 1 - u)) + rnd.uniform(0, 0.05)
        p = np.array([rr * math.cos(az), rr * math.sin(az), h]); d = np.array([math.cos(az) * 0.4, math.sin(az) * 0.4, 1.0])
        P.append(p); R.append(frame(d + np.array([rnd.gauss(0, 0.4), rnd.gauss(0, 0.4), 0]), np.array([math.cos(az), math.sin(az), 0.4]))); S.append(size * rnd.uniform(0.06, 0.085))
    V1 = place(tm, P, R, S, rnd)
    P2, R2, S2 = [], [], []; fl = _ellipsoid(0.006, 0.006, 0.01, 6, 4)
    for i in range(int(70 * DETAIL)):
        az = rnd.uniform(0, TAU); rr = size * 0.45 * math.sqrt(rnd.random()); base = np.array([rr * math.cos(az), rr * math.sin(az), size * 0.35])
        d = np.array([math.cos(az) * 0.25 + rnd.gauss(0, 0.1), math.sin(az) * 0.25 + rnd.gauss(0, 0.1), 1.0]); d /= np.linalg.norm(d)
        top = base + d * size * rnd.uniform(0.35, 0.5); stems.append(Branch([base, top], [0.0025, 0.002], 1))
        for j in range(14):
            t = 0.72 + 0.28 * j / 14; q = base + (top - base) * t + np.array([rnd.gauss(0, 0.004), rnd.gauss(0, 0.004), 0])
            P2.append(q); R2.append(frame(d, np.array([1.0, 0, 0]))); S2.append(rnd.uniform(0.8, 1.2))
    leaf = leaf_material("lavender leaf", [(0.16, 0.22, 0.13), (0.22, 0.27, 0.17), (0.27, 0.31, 0.21)], rough=0.6, trans=0.15, veins=0.0)
    flower = leaf_material("lavender flower", [(0.20, 0.10, 0.42), (0.28, 0.14, 0.52), (0.36, 0.22, 0.58)], rough=0.6, trans=0.2, veins=0.0)
    stem = mesh_from(name + " stems", *tubes(stems, 3, 3)[:3], mat=bark_material("lavender stem", (0.30, 0.34, 0.24), (0.2, 0.22, 0.15)), loc=loc)
    return [stem, mesh_from(name + " leaves", *V1, mat=leaf, loc=loc), mesh_from(name + " flowers", *place(fl, P2, R2, S2, rnd), mat=flower, loc=loc)]


def boxwood(name, loc, rnd, d=0.8):
    """Buxus clipped into a ball: tiny dark glossy leaves packed over its surface"""
    tm = blade("small", DETAIL); P, R, S = [], [], []; r = d / 2
    for i in range(int(6500 * d * d * DETAIL)):
        z = rnd.uniform(-0.75, 1.0); az = rnd.uniform(0, TAU); s = math.sqrt(1 - z * z)
        nrm = np.array([s * math.cos(az), s * math.sin(az), z]); p = nrm * r * rnd.uniform(0.94, 1.02) + np.array([0, 0, r])
        P.append(p); R.append(frame(np.cross(nrm, [0.3, 0.2, 1.0]) + nrm * 0.2, nrm)); S.append(rnd.uniform(0.016, 0.022))
    mat = leaf_material("box leaf", [(0.03, 0.09, 0.02), (0.05, 0.12, 0.03), (0.08, 0.15, 0.04)], rough=0.32, trans=0.15, veins=0.0, spec=0.6)
    core = lib.cyl(name + " core", r * 0.92, 0.0, (loc[0], loc[1], loc[2]), None, verts=8); bpy.data.objects.remove(core)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r * 0.93, location=(loc[0], loc[1], loc[2] + r)); c = bpy.context.active_object; c.name = name + " core"
    c.data.materials.append(lib.principled("box shade", (0.01, 0.03, 0.008), 0.8))
    return [c, mesh_from(name + " leaves", *place(tm, P, R, S, rnd), mat=mat, loc=loc)]


def _ellipsoid(a, b, c, nu, nv):
    V, F, uv = [], [], []
    for i in range(nv + 1):
        th = math.pi * i / nv
        for j in range(nu):
            ph = TAU * j / nu; V.append((a * math.sin(th) * math.cos(ph), b * math.sin(th) * math.sin(ph), c * math.cos(th))); uv.append((j / nu, i / nv))
    for i in range(nv):
        for j in range(nu):
            j1 = (j + 1) % nu; p, q, r_, s = i * nu + j, i * nu + j1, (i + 1) * nu + j1, (i + 1) * nu + j; F += [(p, q, r_), (p, r_, s)]
    return _tmpl(V, F, uv)


def _assign_by_value(o, value, index):
    """faces whose leafrand is value take material index"""
    if "leaf templates" in o:                  # instanced leaves: the template whose copies all carry value takes it
        me = o.data; n = len(me.vertices); vals = np.zeros(n, np.float32); tm = np.zeros(n, np.int32)
        me.attributes["leafrand"].data.foreach_get("value", vals); me.attributes["tmpl"].data.foreach_get("value", tm)
        hit = np.abs(vals - value) < 1e-3
        for i, tn in enumerate(o["leaf templates"]):
            sel = tm == i
            if not sel.any() or not hit[sel].all(): continue
            t = bpy.data.objects[tn]
            for m in me.materials[len(t.data.materials):]: t.data.materials.append(m)
            t.data.polygons.foreach_set("material_index", np.full(len(t.data.polygons), index, np.int32))
        vals[hit] = 0.5; me.attributes["leafrand"].data.foreach_set("value", vals)
        return
    me = o.data; vals = np.zeros(len(me.polygons), np.float32); me.attributes["leafrand"].data.foreach_get("value", vals)
    idx = np.where(np.abs(vals - value) < 1e-3, index, 0).astype(np.int32); me.polygons.foreach_set("material_index", idx)
    # lemons keep a random number of their own too
    vals[np.abs(vals - value) < 1e-3] = 0.5; me.attributes["leafrand"].data.foreach_set("value", vals)


SPECIES = {"japanese maple": japanese_maple, "ginkgo": ginkgo, "olive": olive, "lemon": lemon, "fiddle-leaf fig": fiddle_leaf_fig,
           "bird of paradise": strelitzia, "kentia palm": kentia, "tree fern": tree_fern, "orchid": orchid, "agave": agave,
           "golden barrel": barrel_cactus, "lavender": lavender, "boxwood": boxwood}


def make(kind, loc, seed=1, pot=None, **kw):
    """a plant of the kind at loc, in a planter if pot = (diameter, height, style[, square]); its objects"""
    rnd = random.Random(seed); out = []
    if pot:
        po, loc = planter(kind + " planter", loc, pot[0], pot[1], pot[2], pot[3] if len(pot) > 3 else False); out += po
    out += SPECIES[kind](kind, loc, rnd, **kw)
    return out
