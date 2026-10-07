"""The Crown walk (palace/walk/): a stretch of the ring baked for the browser, the way game engines light a level.
Cycles bakes, for every surface, its colour (sharp: about 1.25 cm a pixel) and the light falling on it (smooth: the
sun through the slots, the coves, the lamps, every bounce; denoised): the browser multiplies the two and tone-maps
them with AgX, the curve of the pictures, so the rooms look as they do in the photographs while one walks. Leaves,
the ceiling's oak slats and the lamp shades carry all their light in their vertices. What changes as one moves is left
to the browser: the reflections in the floor, the glass and the metal, the Orb, the Glide.
  bvenv/bin/python blend/walk_bake.py <rooms> <out dir> [spp=48] [texel=0.0125] [chunk=6] [stage=all|uv|bake|map] [b0:b1]
  bvenv/bin/python blend/walk_bake.py far <out dir>       (the whole ring baked in parts: far.glb, band.glb, sky.jpg)
(b0:b1 bakes only the chunks between those bearings, the rest of the rooms still lighting them: a test). The whole
ring is baked a part at a time (36 degrees of rooms in one scene), then walk_merge.py joins the parts.
rooms: Crown rooms in ring order from crown_rooms.ROOMS, e.g. salon,wellness. Writes into <out>:
  c<NNNN>.glb    a chunk of the ring, <chunk> degrees from bearing NNN.N: geometry and its colour texture
  c<NNNN>_l.jpg  the light on it, sRGB-encoded light / EMAX (half the colour texture's size)
  far.glb        the Stone Garden 41 m down, the rest of the ring, the Orb
  band.glb       (the whole ring) the ring all round as one white band, shown where the rooms are not loaded
  sky.jpg        the sky and the plain all round (equirectangular, the sun in it)
  floor.png      where one can walk: a map of the floor by bearing (across) and radius (down)
  walk.json      what is where, for walk.js
Then node walk_pack.mjs <out dir> <site data dir> makes them small. One afternoon for the whole ring: the sun at
bearing SUN_AZ, SUN_EL above the horizon."""
import bpy, bmesh, json, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, crown, crown_rooms, plants
from crown import P, R_IN, R_OUT, R_GL, D, WT
plants.DETAIL = float(os.environ.get("WALK_DETAIL", "0.25"))     # lighter plants for the browser: fewer, plainer leaves
crown.DOORS_OPEN = True                                          # the doors onto the Glide stand open, to walk through
plants.MAX_LEAVES = int(os.environ.get("WALK_MAX_LEAVES", "30000"))   # no tree of millions of triangles for the browser

SUN_AZ, SUN_EL, SUN_STRENGTH = 195.0, 32.0, 6.0
EXPOSURE = 1.0                  # as the Crown's stills: the browser's tone-mapping exposure is 2 ** EXPOSURE
EMAX = 4.0                      # the light maps hold light / EMAX (a white wall in full Mars sun: about 2)
VMAX = 4.0                      # vertex colours hold light / VMAX, in 16 bits
FAR = ("plain", "stone garden", "orb", "ring outside")
VERTEX = ("leaf", "leaves", "flowers", "dirt", "petal", "oak slats", "shade", "bulb", "flame", "bark")   # many small or
# thin pieces, or ones that glow through: their light baked into their vertices (the ceilings' slats: a vertex every
# quarter of a degree, 0.57 m apart; the trees' trunks and branches, too thin for a texture)
GLASS = ("glass", "water")
METAL = ("bronze", "brass", "titanium", "steel", "stainless", "chrome", "metal", "iron", "gold", "silver", "copper")


def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)


def bearing(v): return math.degrees(math.atan2(v.x, v.y)) % 360.0


START = 0.0                                  # the stretch's first bearing; bearings past north count on from 360


def ub(v):
    """a point's bearing, counted on from the stretch's start (so a stretch can run past north, or right round)"""
    b = bearing(v); return b if b >= START - 1e-6 else b + 360.0


def corners(o):
    """the corners of the object's box, from its vertices (an object's bound_box is stale until the scene updates)"""
    me = o.data; n = len(me.vertices)
    if n == 0: return [o.matrix_world.translation.copy()]
    co = [0.0] * (3 * n); me.vertices.foreach_get("co", co)
    lo = Vector((min(co[0::3]), min(co[1::3]), min(co[2::3]))); hi = Vector((max(co[0::3]), max(co[1::3]), max(co[2::3])))
    return [o.matrix_world @ Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]


def centre(o):
    bb = corners(o); return sum(bb, Vector()) / len(bb)


# ---------------------------------------------------------------- the scene
def build(rooms):
    crown.PAD = 0.0                          # the stretches meet, without the half degree they overlap by in the stills
    global START
    sc = lib.reset(); M = crown_rooms.materials(); rnd = random.Random(23); spans = []
    for r in rooms:
        R = crown_rooms.ROOMS[r]; R["build"](M, rnd); spans.append(R["span"])
    for (a, b), (c, d) in zip(spans, spans[1:]): assert abs((b - c + 180) % 360 - 180) < 1e-6, "rooms must follow each other round the ring"
    b0 = spans[0][0]; b1 = b0 + sum((e - a) % 360 or 360 for (a, e) in spans); START = b0
    whole = abs(b1 - b0 - 360) < 1e-6
    crown.outside(M, SUN_AZ, SUN_EL, sun_strength=SUN_STRENGTH, skip=(b0, b1), roof=True)   # the far side up to its spires
    if whole: bpy.data.objects.remove(bpy.data.objects["ring outside"])        # all of the ring is here
    for o in list(bpy.data.objects):         # the Glide runs on from room to room, and on from part to part of the ring
        if o.name.startswith("glide end"): bpy.data.objects.remove(o)
    seen = {}                                # where two rooms meet, both built the partition between them: keep one
    for o in list(bpy.data.objects):
        if o.name.startswith("partition") and o.type == "MESH":
            c = sum((o.matrix_world @ Vector(c) for c in o.bound_box), Vector()) / 8.0
            k = (round(bearing(c), 2) % 360, round(c.xy.length, 1), round(c.z, 1), round(o.dimensions.length, 2))
            if k in seen: bpy.data.objects.remove(o)
            else: seen[k] = o
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Base Contrast"; sc.view_settings.exposure = EXPOSURE
    return sc, M, b0, b1


def lighten(max_faces=8000):
    """lighter for the browser: every leaf two triangles instead of ten (a cupped diamond of the same size), and the
    scanned models with many thousands of faces simplified (the light is baked, so the detail lost is small)"""
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name.endswith(" leaf") and o.location.z < -400:
            me = o.data; co = [v.co.copy() for v in me.vertices]
            L_ = max(c.x for c in co) - min(c.x for c in co); W_ = max(c.y for c in co) - min(c.y for c in co); cup = max(c.z for c in co)
            bm = bmesh.new(); vv = [bm.verts.new(v) for v in ((-L_ / 2, 0, 0), (0, -W_ / 2, cup), (L_ / 2, 0, 0), (0, W_ / 2, cup))]
            bm.faces.new((vv[0], vv[1], vv[2])); bm.faces.new((vv[0], vv[2], vv[3]))
            mats = list(me.materials); bm.to_mesh(me); bm.free(); me.materials.clear()
            for m in mats: me.materials.append(m)
            for p in me.polygons: p.use_smooth = True
    n = 0
    for o in bpy.data.objects:
        if o.type != "MESH" or o.hide_render or any(m.type == "NODES" for m in o.modifiers): continue
        # not the plants: a tree's thousands of separate leaves collapse into shards under a decimate, its trunk into a
        # stick (they are made light enough by plants.DETAIL)
        if any(k in o.name.lower() for k in VERTEX) or any(m and any(k in m.name.lower() for k in VERTEX) for m in o.data.materials): continue
        f = len(o.data.polygons)
        if f > max_faces and o.matrix_world != Matrix.Identity(4):
            d = o.modifiers.new("lighter", "DECIMATE"); d.ratio = max_faces / f; n += 1
    log("simplified", n, "models")


def realize():
    """every object as a plain mesh of its own: modifiers applied, instances made real, no shared meshes"""
    for ng in bpy.data.node_groups:
        if ng.bl_idname != "GeometryNodeTree": continue
        out = [n for n in ng.nodes if n.type == "GROUP_OUTPUT"][0]
        if not out.inputs[0].links or out.inputs[0].links[0].from_node.type == "REALIZE_INSTANCES": continue
        src = out.inputs[0].links[0].from_socket; ri = ng.nodes.new("GeometryNodeRealizeInstances")
        ng.links.new(src, ri.inputs[0]); ng.links.new(ri.outputs[0], out.inputs[0])
    dg = bpy.context.evaluated_depsgraph_get(); n = 0
    for o in list(bpy.data.objects):
        if o.type not in ("MESH", "CURVE", "FONT", "SURFACE") or o.hide_render: continue
        if o.type == "MESH" and not o.modifiers and o.data.users == 1: continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        if o.type != "MESH":
            no = bpy.data.objects.new(o.name, me); no.matrix_world = o.matrix_world.copy()
            for c in o.users_collection: c.objects.link(no)
            bpy.data.objects.remove(o); o = no
        else:
            o.modifiers.clear(); o.data = me
        n += 1
    for o in bpy.data.objects:                 # a mesh with no faces (the instancers' points) is nothing to bake
        if o.type == "MESH" and len(o.data.polygons) == 0: o.hide_render = True
    log("realized", n, "objects")


def emission_of(m):
    """(r, g, b) * strength if the material only glows (lib.emission), else None"""
    if not m or not m.node_tree: return None
    out = [n for n in m.node_tree.nodes if n.type == "OUTPUT_MATERIAL"]
    if not out or not out[0].inputs["Surface"].links: return None
    n = out[0].inputs["Surface"].links[0].from_node
    if n.type != "EMISSION" or n.inputs["Color"].links or n.inputs["Strength"].links: return None
    c = n.inputs["Color"].default_value; s = n.inputs["Strength"].default_value
    return [c[0] * s, c[1] * s, c[2] * s]


def kind_of(m):
    n = (m.name if m else "").lower()
    if "frosted" in n: return "frosted"         # the switchable glass with its privacy layer on: milky
    if "smart glass dark" in n: return "dark"   # tinted almost black
    if any(k in n for k in GLASS): return "water" if "water" in n else "glass"
    if emission_of(m): return "glow"
    if any(k in n for k in METAL): return "metal"
    return "baked"


def split_shell(objs, cuts):
    """cut the long pieces of the ring's shell (floors, walls, ceilings, built in place) at the chunks' edges"""
    out = []
    for o in objs:
        if o.matrix_world != Matrix.Identity(4) or len(o.data.polygons) < 2: out.append(o); continue
        cb = ub(centre(o))                   # its extent round the ring, measured from its middle (it may end where the loop closes)
        rel = [((bearing(c) - cb + 180.0) % 360.0) - 180.0 for c in corners(o)]
        lo, hi = cb + min(rel), cb + max(rel)
        inside = [c for c in cuts if lo + 1e-3 < c < hi - 1e-3]
        if not inside or hi - lo > 180: out.append(o); continue
        bm = bmesh.new(); bm.from_mesh(o.data)
        for c in inside:
            r = c * D; geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
            bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 0), plane_no=(math.cos(r), -math.sin(r), 0), dist=1e-5)
        bm.to_mesh(o.data); bm.free()
        groups = {}
        for p in o.data.polygons:
            k = sum(1 for c in cuts if ub(p.center) > c); groups.setdefault(k, []).append(p.index)
        if len(groups) == 1: out.append(o); continue
        for k, faces in groups.items():
            no = o.copy(); no.data = o.data.copy(); no.name = o.name + " %d" % k
            for c in o.users_collection: c.objects.link(no)
            bm = bmesh.new(); bm.from_mesh(no.data); keep = set(faces)
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context="FACES"); bm.to_mesh(no.data); bm.free()
            out.append(no)
        bpy.data.objects.remove(o)
    return out


def chunks_of(b0, b1, step):
    n = max(1, int(round((b1 - b0) / step))); return [b0 + (b1 - b0) * i / n for i in range(n + 1)]


def assign(objs, edges):
    ch = [[] for _ in range(len(edges) - 1)]
    for o in objs:
        b = ub(centre(o)); k = min(max(sum(1 for e in edges[1:-1] if b > e), 0), len(ch) - 1); ch[k].append(o)
    return ch


# ---------------------------------------------------------------- one mesh a chunk
TEXNODES = ("ShaderNodeTexNoise", "ShaderNodeTexVoronoi", "ShaderNodeTexWave", "ShaderNodeTexBrick", "ShaderNodeTexChecker",
            "ShaderNodeTexGradient", "ShaderNodeTexMagic", "ShaderNodeTexWhiteNoise")


def keep_coords(objs):
    """each object's own texture coordinates (Object, Generated), its place and its random number, kept on its
    vertices: Blender bakes one object at a time (loading the whole scene for each), so a chunk is baked as one mesh,
    and its materials read these instead, to look as they do in the pictures"""
    import zlib
    for o in objs:
        me = o.data; n = len(me.vertices)
        if n == 0: continue
        co = [0.0] * (3 * n); me.vertices.foreach_get("co", co)
        lo = [min(co[i::3]) for i in range(3)]; sz = [max(max(co[i::3]) - lo[i], 1e-6) for i in range(3)]
        gen = [(co[k] - lo[k % 3]) / sz[k % 3] for k in range(3 * n)]
        for name, data in (("wb_obj", co), ("wb_gen", gen), ("wb_loc", list(o.matrix_world.translation) * n)):
            a = me.attributes.get(name) or me.attributes.new(name, "FLOAT_VECTOR", "POINT"); a.data.foreach_set("vector", data)
        a = me.attributes.get("wb_rand") or me.attributes.new("wb_rand", "FLOAT", "POINT")
        a.data.foreach_set("value", [(zlib.crc32(o.name.encode()) % 100003) / 100003.0] * n)


def rewrite(mats):
    """the materials read the kept coordinates (keep_coords) where they read an object's own"""
    for m in mats:
        nt = m.node_tree if m else None
        if nt is None or m.get("wb_done"): continue
        m["wb_done"] = 1; N = nt.nodes; L = nt.links
        def attr(name, out="Vector"):
            a = N.new("ShaderNodeAttribute"); a.attribute_type = "GEOMETRY"; a.attribute_name = name; return a.outputs[out]
        for n in list(N):
            if n.bl_idname == "ShaderNodeTexCoord":
                for out, an in (("Object", "wb_obj"), ("Generated", "wb_gen")):
                    for lk in list(n.outputs[out].links):
                        to = lk.to_socket; L.remove(lk); L.new(attr(an), to)
            elif n.bl_idname == "ShaderNodeObjectInfo":
                for out, an, kind in (("Random", "wb_rand", "Fac"), ("Location", "wb_loc", "Vector")):
                    for lk in list(n.outputs[out].links):
                        to = lk.to_socket; L.remove(lk); L.new(attr(an, kind), to)
            elif n.bl_idname in TEXNODES and "Vector" in n.inputs and not n.inputs["Vector"].is_linked:
                L.new(attr("wb_gen"), n.inputs["Vector"])


def select_only(objs):
    if bpy.context.object and bpy.context.object.mode != "OBJECT": bpy.ops.object.mode_set(mode="OBJECT")
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def join(objs, name):
    """the objects as one mesh object in world space"""
    first = sorted(objs, key=lambda o: (o.parent is not None, o.matrix_world != Matrix.Identity(4)))[0]
    select_only([first] + [o for o in objs if o is not first])
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name
    select_only([o])
    if o.parent is not None: bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    if o.matrix_world != Matrix.Identity(4): bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    me = o.data
    if "UVMap" in me.uv_layers: me.uv_layers["UVMap"].active_render = True
    return o


def cull_hidden(o):
    """faces no one in the ring can see: the outside of the inner and outer walls, the tops of the walls and the
    ceiling slab above the ceiling, the underside of the floor"""
    me = o.data; bm = bmesh.new(); bm.from_mesh(me); gone = []
    for f in bm.faces:
        c = f.calc_center_median(); n = f.normal; r = math.hypot(c.x, c.y); rad = Vector((c.x / r, c.y / r, 0)) if r > 1 else Vector()
        out = n.dot(rad)
        if (r > R_OUT + WT - 0.03 and out > 0.7) or (r < R_IN - WT + 0.03 and out < -0.7) or c.z > crown.ceil_at(bearing(c)) + 0.05 or (c.z < -0.12 and n.z < -0.7):
            gone.append(f)
    bmesh.ops.delete(bm, geom=gone, context="FACES"); bm.to_mesh(me); bm.free()
    return len(gone)


# ---------------------------------------------------------------- texture space
def unwrap(o, texel):
    """a UV map ("lm") on the chunk, its islands packed into one square; returns the colour texture's size in pixels
    for about `texel` metres a pixel (a multiple of 256; the light map is half as fine)"""
    me = o.data; area = sum(p.area for p in me.polygons)
    lm = me.uv_layers.get("lm") or me.uv_layers.new(name="lm")
    render = [u for u in me.uv_layers if u.active_render]; me.uv_layers.active = lm
    if render and render[0].name != "lm": render[0].active_render = True
    select_only([o])
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=0.0025, shape_method="CONVEX")
    bpy.ops.object.mode_set(mode="OBJECT")
    uv = [0.0] * (2 * len(me.loops)); me.uv_layers["lm"].data.foreach_get("uv", uv); used = 0.0
    for p in me.polygons:
        pts = [(uv[2 * i], uv[2 * i + 1]) for i in range(p.loop_start, p.loop_start + p.loop_total)]
        used += abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2
    side = math.sqrt(area / max(used, 1e-6)) / texel
    size = int(min(4096, max(512, 256 * round(side / 256))))
    log("unwrapped %s: %d faces, %.0f m2, islands fill %.0f%%, %.2f cm a pixel at %d" % (o.name, len(me.polygons), area, 100 * used, 100 * math.sqrt(area / used) / size, size))
    return size


# ---------------------------------------------------------------- baking
def bake_node(m, img):
    nt = m.node_tree
    if nt is None: m.use_nodes = True; nt = m.node_tree
    n = nt.nodes.get("walk bake") or nt.nodes.new("ShaderNodeTexImage"); n.name = "walk bake"; n.image = img
    nt.nodes.active = n


def bake(o, img, kind, spp, **kw):
    sc = bpy.context.scene; sc.cycles.samples = spp
    for m in o.data.materials:
        if m: bake_node(m, img)
    select_only([o])
    bpy.ops.object.bake(type=kind, uv_layer="lm", margin=16, margin_type="EXTEND", use_clear=True, target="IMAGE_TEXTURES", **kw)


def plain_scene(name="plain", exposure=0.0):
    """a scene to save pictures through: the Standard view (sRGB), with an exposure"""
    s = bpy.data.scenes.get(name) or bpy.data.scenes.new(name)
    s.render.engine = "CYCLES"; s.cycles.device = "CPU"; s.cycles.samples = 1
    s.view_settings.view_transform = "Standard"; s.view_settings.look = "None"; s.view_settings.exposure = exposure; s.view_settings.gamma = 1.0
    s.render.image_settings.file_format = "JPEG"; s.render.image_settings.color_mode = "RGB"
    if s.camera is None:
        cam = bpy.data.objects.new(name + " cam", bpy.data.cameras.new(name + " cam")); s.collection.objects.link(cam); s.camera = cam
    return s


def save_jpeg(img, path, quality=88, exposure=0.0):
    s = plain_scene(exposure=exposure); s.render.image_settings.quality = quality; img.save_render(path, scene=s)


def denoise_light(img, path, quality=92):
    """the light map through OpenImageDenoise (the compositor's Denoise node), saved as light / EMAX, sRGB-encoded"""
    dn = plain_scene("denoise", exposure=-math.log2(EMAX))
    dn.render.resolution_x, dn.render.resolution_y = img.size; dn.render.resolution_percentage = 100
    dn.use_nodes = True; nt = dn.node_tree; nt.nodes.clear(); L = nt.links
    i = nt.nodes.new("CompositorNodeImage"); i.image = img
    d = nt.nodes.new("CompositorNodeDenoise"); d.use_hdr = True; d.prefilter = "ACCURATE"; L.new(i.outputs[0], d.inputs["Image"])
    c = nt.nodes.new("CompositorNodeComposite"); L.new(d.outputs[0], c.inputs[0])
    dn.render.use_compositing = True; dn.render.use_sequencer = False; dn.render.image_settings.quality = quality
    bpy.ops.render.render(scene=dn.name)
    bpy.data.images["Render Result"].save_render(path, scene=dn)


def bark_hue(me, raw):
    """the trunks and branches: their light from a few samples a vertex is noisy in hue, and along a trunk's long faces
    the noise shows as bands of green and purple; each vertex keeps its own brightness and takes its bark's mean colour"""
    import numpy as np
    col = np.asarray(raw, np.float64).reshape(-1, 4)
    bark = [i for i, m in enumerate(me.materials) if m and "bark" in m.name.lower()]
    if not bark or not len(me.polygons): return raw
    nP, nL = len(me.polygons), len(me.loops)
    mat = np.zeros(nP, np.int32); me.polygons.foreach_get("material_index", mat)
    tot = np.zeros(nP, np.int32); me.polygons.foreach_get("loop_total", tot)
    vix = np.zeros(nL, np.int32); me.loops.foreach_get("vertex_index", vix)
    loop_mat = np.repeat(mat, tot)
    lum = lambda c: 0.2126 * c[:, 0] + 0.7152 * c[:, 1] + 0.0722 * c[:, 2]
    for mi in bark:
        vs = np.unique(vix[loop_mat == mi])
        if not len(vs): continue
        c = col[vs, :3]; l = lum(c); mean = c.mean(axis=0); ml = max(float(lum(mean[None, :])[0]), 1e-6)
        col[vs, :3] = np.clip(mean[None, :] * (l / ml)[:, None], 0.0, 1.0)
    return col.ravel().tolist()


# ---------------------------------------------------------------- where one can walk
def floor_map(b0, b1, path, objs, cell=0.05):
    """white where one can stand, black where a wall, a table, a pool or a bed is in the way (anything 0.15 to 1.85 m
    up): rays straight down from 1.85 m through every object of the stretch, and where a ray begins inside a solid
    (a thick wall: it meets the wall's underside first) no floor either. Across: bearing (b0 to b1), down: radius
    (R_IN to R_OUT). `walk_bake.py <rooms> <out> 24 0.0125 6 map` makes only this map (and a walk.json without chunks)."""
    from mathutils.bvhtree import BVHTree
    vs, ps, wet = [], [], []
    for o in objs:
        me = o.data; mw = o.matrix_world; base = len(vs)
        vs += [mw @ v.co for v in me.vertices]
        water = [bool(m and "water" in m.name.lower()) for m in me.materials] or [False]
        for p in me.polygons:
            ps.append([base + i for i in p.vertices]); wet.append(water[min(p.material_index, len(water) - 1)])
    tree = BVHTree.FromPolygons(vs, ps, all_triangles=False)
    db = cell / 130.0 / D; w = int(math.ceil((b1 - b0) / db)); h = int(math.ceil((R_OUT - R_IN) / cell))
    px = [1.0] * (w * h * 4); down = Vector((0, 0, -1))
    def block(j, i):
        if 0 <= j < h and 0 <= i < w: k = 4 * ((h - 1 - j) * w + i); px[k] = px[k + 1] = px[k + 2] = 0.0
    for j in range(h):
        r = R_IN + (j + 0.5) * cell
        for i in range(w):
            loc, nrm, idx, dist = tree.ray_cast(P(r, b0 + (i + 0.5) * db, 1.85), down, 2.5)
            # the first face below, facing down: the ray began inside a solid (a wall thicker than a cell: it found
            # the wall's underside at the floor), so this is no floor
            ok = loc is not None and -0.2 < loc.z < 0.15 and not wet[idx] and nrm.z > -0.5
            if not ok: block(j, i)
    # thin upright things the rays slip past (a wall of glass is 1.6 cm thick, the cells 5 cm): each blocks the cells
    # its foot covers, a little widened
    n = 0
    for o in objs:
        cs = corners(o); zs = [c.z for c in cs]
        if min(zs) > 0.3 or max(zs) < 1.6 or len(o.data.vertices) > 20000: continue
        mw = o.matrix_world; vv = [mw @ v.co for v in o.data.vertices]      # its own vertices: a curved panel's box is not thin
        rs = [v.xy.length for v in vv]; bs = [ub(v) for v in vv]
        if max(bs) - min(bs) > 180 or (max(rs) - min(rs) > 0.3 and (max(bs) - min(bs)) * D * max(rs) > 0.3): continue
        lo_b, hi_b = min(bs) - 0.03 / 130.0 / D, max(bs) + 0.03 / 130.0 / D; lo_r, hi_r = min(rs) - 0.03, max(rs) + 0.03
        for j in range(max(0, int((lo_r - R_IN) / cell)), min(h, int((hi_r - R_IN) / cell) + 1)):
            for i in range(max(0, int((lo_b - b0) / db)), min(w, int((hi_b - b0) / db) + 1)): block(j, i)
        n += 1
    log("floor map: %d thin upright things blocked" % n)
    im = bpy.data.images.new("floor map", w, h); im.pixels.foreach_set(px); im.filepath_raw = path; im.file_format = "PNG"; im.save()
    log("floor map %d x %d" % (w, h))
    return dict(file=os.path.basename(path), b0=b0, db=db, r0=R_IN, dr=cell, w=w, h=h)


# ---------------------------------------------------------------- export
def simple_material(name, kind, src=None, tex=None, vcol=False):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    m["walk"] = kind
    if tex is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = tex; nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        uv = nt.nodes.new("ShaderNodeUVMap"); uv.uv_map = "lm"; nt.links.new(uv.outputs["UV"], t.inputs["Vector"])
    if vcol:
        a = nt.nodes.new("ShaderNodeVertexColor"); a.layer_name = "bake"; nt.links.new(a.outputs["Color"], b.inputs["Base Color"])
    rough = 0.5
    if src is not None and src.node_tree:
        sb = [n for n in src.node_tree.nodes if n.type == "BSDF_PRINCIPLED"]
        if sb:
            for k in ("Roughness", "Metallic", "IOR"):
                if not sb[0].inputs[k].links: b.inputs[k].default_value = sb[0].inputs[k].default_value
            if tex is None and not vcol and not sb[0].inputs["Base Color"].links: b.inputs["Base Color"].default_value = sb[0].inputs["Base Color"].default_value
            rough = float(sb[0].inputs["Roughness"].default_value) if not sb[0].inputs["Roughness"].links else 0.5
            if "Coat Weight" in sb[0].inputs and sb[0].inputs["Coat Weight"].default_value > 0.2: rough = min(rough, float(sb[0].inputs["Coat Roughness"].default_value))
        e = emission_of(src)
        if e: m["emit"] = e
    m["rough"] = rough
    return m


def export(objs, path):
    select_only(objs)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_texcoords=True,
                              export_normals=True, export_materials="EXPORT", export_extras=True, export_yup=True,
                              export_image_format="AUTO", export_cameras=False, export_lights=False, export_animations=False,
                              export_attributes=False)


def drop_layers(me, keep_uv):
    """the UV maps and kept coordinates the browser does not need (removed by name: a removal shifts the others)"""
    for nm in [u.name for u in me.uv_layers if u.name != keep_uv]: me.uv_layers.remove(me.uv_layers[nm])
    for nm in [a.name for a in me.attributes if a.name.startswith("wb_")]: me.attributes.remove(me.attributes[nm])


def for_export(o, name, colour):
    """the chunk's materials made simple: baked faces show the colour texture (the browser adds the light map), the
    floor (flat, at 0, polished) is marked for the browser's reflections, glowing faces keep their glow; glass, water
    and metal are drawn by the browser"""
    me = o.data; old = list(me.materials)
    news = []
    for m in old:
        kd = kind_of(m)
        news.append(simple_material(name + " baked" if kd == "baked" else "%s %s" % (kd, m.name if m else "x"), kd, m, colour if kd == "baked" else None))
    rough = [float(simple_material("probe " + (m.name if m else "x"), "probe", m)["rough"]) for m in old]
    for k in [k for k in bpy.data.materials if k.name.startswith("probe ")]: bpy.data.materials.remove(k)
    idx = [0] * len(me.polygons); me.polygons.foreach_get("material_index", idx)     # clear() resets the faces' indices
    me.materials.clear(); order = {}; new_idx = []
    for p, i in zip(me.polygons, idx):
        m = news[i]
        if m["walk"] == "baked" and p.normal.z > 0.95 and -0.05 < p.center.z < 0.03 and rough[i] < 0.5:
            m = simple_material("%s floor %.2f" % (name, rough[i]), "floor", None, colour); m["rough"] = rough[i]
        if m.name not in order: order[m.name] = len(order); me.materials.append(m)
        new_idx.append(order[m.name])
    me.polygons.foreach_set("material_index", new_idx)
    drop_layers(me, keep_uv="lm")


def sky(path, b, w=4096):
    """the sky and the plain all round, as seen from the ring: the plain has no landmarks, so it can stay at infinity
    as one walks; the Orb, the Stone Garden and the rest of the ring are drawn in the browser, where they move"""
    sc = bpy.context.scene; hidden = []
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.hide_render and not o.name.startswith("plain"): o.hide_render = True; hidden.append(o)
    lib.camera("sky", tuple(P(130.0, b, 3.6)), yaw_deg=0.0, pano=True)
    sc.render.resolution_x, sc.render.resolution_y = w, w // 2; sc.cycles.samples = 16; sc.cycles.use_denoising = False
    sc.render.image_settings.file_format = "JPEG"; sc.render.image_settings.quality = 90; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    for o in hidden: o.hide_render = False
    log("sky", path)


def band():
    """the whole ring as the plain white band crown.outside draws for the rest of the ring: the walk loads only the
    rooms near one, and shows this across the garden where they are not"""
    bm = bmesh.new(); prev = None
    for b in crown.steps(0.0, 360.0, 4):
        top = crown.roof_top(b) - crown.FL
        cur = [bm.verts.new(P(R_IN - 0.6, b, -9.0)), bm.verts.new(P(R_IN - 0.6, b, top)), bm.verts.new(P(R_OUT + 0.6, b, top)), bm.verts.new(P(R_OUT + 0.6, b, -9.0))]
        if prev:
            for k in range(4): bm.faces.new((prev[k], cur[k], cur[(k + 1) % 4], prev[(k + 1) % 4]))
        prev = cur
    o = lib.mesh_obj("ring band", bm, lib.principled("white ceramic", (0.82, 0.80, 0.77), 0.35))
    o.data.materials[0] = simple_material("far white ceramic", "far", o.data.materials[0]); return o


def far_only(out):
    """for the whole ring baked in parts (each part's own far.glb holds the rest of the ring, which the whole walk
    shows as band.glb instead): the Stone Garden and the Orb, the band, the sky"""
    lib.reset(); M = crown_rooms.materials()
    crown.outside(M, SUN_AZ, SUN_EL, sun_strength=SUN_STRENGTH, roof=True)
    bpy.data.objects.remove(bpy.data.objects["ring outside"])
    sky(os.path.join(out, "sky.jpg"), 100.0)
    far = [o for o in bpy.data.objects if o.type == "MESH" and any(o.name.startswith(f) for f in FAR) and not o.name.startswith("plain")]
    for o in far:
        for i, m in enumerate(o.data.materials): o.data.materials[i] = simple_material("far " + (m.name if m else "x"), "far", m)
    export(far, os.path.join(out, "far.glb")); export([band()], os.path.join(out, "band.glb")); log("far, band and sky in", out)


def main():
    a = sys.argv[1:]
    if a[0] == "far":
        out = os.path.abspath(a[1]); os.makedirs(out, exist_ok=True); far_only(out); return
    rooms = a[0].split(","); out = os.path.abspath(a[1]); os.makedirs(out, exist_ok=True)
    spp = int(a[2]) if len(a) > 2 else 48; texel = float(a[3]) if len(a) > 3 else 0.0125
    step = float(a[4]) if len(a) > 4 else 6.0; stage = a[5] if len(a) > 5 else "all"
    only = tuple(float(x) for x in a[6].split(":")) if len(a) > 6 else (-1.0, 999.0)
    t0 = time.time(); sc, M, b0, b1 = build(rooms); log("built", rooms, "%.1f to %.1f" % (b0, b1))
    sc.cycles.device = "CPU"; sc.cycles.use_denoising = False; sc.render.bake.use_selected_to_active = False
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 4
    sc.cycles.sample_clamp_indirect = 6.0
    lighten(); realize()
    objs = [o for o in bpy.data.objects if o.type == "MESH" and not o.hide_render and not any(o.name.startswith(f) for f in FAR)
            and centre(o).z > -20.0]                # not the models' sources, kept out of sight far below the floor
    vtx = [o for o in objs if any(k in o.name.lower() for k in VERTEX) or any(m and any(k in m.name.lower() for k in VERTEX) for m in o.data.materials)]
    tex = [o for o in objs if o not in vtx]
    edges = chunks_of(b0, b1, step)
    tex = split_shell(tex, edges[1:-1]); vtx = split_shell(vtx, edges[1:-1])
    for d in (os.path.dirname(os.path.dirname(os.path.abspath(__file__))), os.path.join(os.environ.get("MARS_REPO", "/home/user/mars-campus"), "palace", "tools")):
        sys.path.insert(0, d)
    import room_program
    def overlaps(a0, a1):
        a0u = a0 if a0 >= b0 - 1e-6 else a0 + 360; return a0u < b1 - 1e-6 and a0u + (a1 - a0) > b0 + 1e-6
    named = [dict(code=c["code"], name=c["name"], b0=c["at"][0], b1=c["at"][1]) for c in room_program.CROWN
             if not c.get("up") and overlaps(*c["at"])]
    info = dict(sun=dict(az=SUN_AZ, el=SUN_EL), span=[b0, b1], parts=rooms, rooms=named, exposure=EXPOSURE, emax=EMAX, vmax=VMAX,
                chunks=[], step=step, start=dict(b=b0 + 1.6, r=131.0))
    if "arrival" in rooms:                   # one comes up into the Arrival hall, the olive tree and the portal ahead
        x, y, _ = crown_rooms.ROOMS["arrival"]["stops"]["arrival"]
        info["start"] = dict(b=round(math.degrees(math.atan2(x, y)) % 360.0, 3), r=round(math.hypot(x, y), 3))
    if stage in ("all", "map"): info["floor"] = floor_map(b0, b1, os.path.join(out, "floor.png"), tex + vtx)
    if stage == "map": json.dump(info, open(os.path.join(out, "walk.json"), "w"), indent=1); return
    keep_coords(tex + vtx); rewrite({m for o in tex + vtx for m in o.data.materials if m})
    groups = assign(tex, edges); vgroups = assign(vtx, edges)
    chunks = []
    for k in range(len(groups)):
        name = "c%04d" % (int(round(edges[k] * 10)) % 3600)
        o = join(groups[k], name) if groups[k] else None
        v = join(vgroups[k], name + " leaves") if vgroups[k] else None
        chunks.append((name, o, v, edges[k], edges[k + 1]))
    log("joined into %d chunks" % len(chunks))
    for name, o, v, e0, e1 in chunks:
        if e0 < only[0] - 1e-6 or e1 > only[1] + 1e-6: continue
        if stage == "all" and os.path.exists(os.path.join(out, name + ".glb")):          # done before a restart
            info["chunks"].append(dict(file=name + ".glb", light=name + "_l.jpg", b0=e0, b1=e1)); log("have", name); continue
        log("culled %d hidden faces of %s" % (cull_hidden(o), name))
        size = unwrap(o, texel); lsize = max(256, size // 2)
        info["chunks"].append(dict(file=name + ".glb", light=name + "_l.jpg", b0=e0, b1=e1, size=size, light_size=lsize))
        if stage == "uv": continue
        cjpg = os.path.join(out, name + "_c.jpg"); ljpg = os.path.join(out, name + "_l.jpg"); t = time.time()
        col = bpy.data.images.new(name + " colour", size, size, float_buffer=True)
        bake(o, col, "DIFFUSE", 4, pass_filter={"COLOR"}); save_jpeg(col, cjpg, 88); bpy.data.images.remove(col)
        lig = bpy.data.images.new(name + " light", lsize, lsize, float_buffer=True)
        bake(o, lig, "DIFFUSE", spp, pass_filter={"DIRECT", "INDIRECT"}); denoise_light(lig, ljpg); bpy.data.images.remove(lig)
        log("baked", name, "colour %d, light %d px, in %.0f s" % (size, lsize, time.time() - t))
        parts = [o]
        if v is not None:        # leaves, slats, shades: all their light in their vertices, as light / VMAX
            me = v.data; ca = me.color_attributes.get("bake") or me.color_attributes.new("bake", "FLOAT_COLOR", "POINT")
            me.color_attributes.active_color = ca; select_only([v]); sc.cycles.samples = 8       # a leaf's few vertices: its noise reads as the leaves' own variety
            bpy.ops.object.bake(type="COMBINED", pass_filter={"DIRECT", "INDIRECT", "DIFFUSE", "TRANSMISSION", "EMIT"}, target="VERTEX_COLORS")
            raw = [0.0] * (4 * len(ca.data)); ca.data.foreach_get("color", raw)
            for i in range(len(ca.data)):
                for c in range(3): raw[4 * i + c] = min(1.0, raw[4 * i + c] / VMAX)
                raw[4 * i + 3] = 1.0
            raw = bark_hue(me, raw)
            ca.data.foreach_set("color", raw)
            vm = simple_material(name + " vertex", "vertex", None, None, vcol=True)
            me.materials.clear(); me.materials.append(vm); drop_layers(me, keep_uv=None)
            parts.append(v); log("baked the vertices of", v.name)
        if stage == "bake": continue
        for_export(o, name, bpy.data.images.load(cjpg))
        export(parts, os.path.join(out, name + ".glb")); log("exported", name)
    if stage in ("all", "export"):
        sky(os.path.join(out, "sky.jpg"), (b0 + b1) / 2)
        far = [o for o in bpy.data.objects if o.type == "MESH" and any(o.name.startswith(f) for f in FAR) and not o.name.startswith("plain")]
        for o in far:
            for i, m in enumerate(o.data.materials): o.data.materials[i] = simple_material("far " + (m.name if m else "x"), "far", m)
        export(far, os.path.join(out, "far.glb"))
        if abs(b1 - b0 - 360.0) < 1e-6: export([band()], os.path.join(out, "band.glb"))
    json.dump(info, open(os.path.join(out, "walk.json"), "w"), indent=1)
    log("done in %.0f s" % (time.time() - t0))


if __name__ == "__main__":
    main()
    sys.stdout.flush(); sys.stderr.flush(); os._exit(0)      # everything is written: skip Blender's teardown (it can crash)
