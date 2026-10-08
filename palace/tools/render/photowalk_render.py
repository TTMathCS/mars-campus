"""The Crown photo walk (palace/photowalk/): a path-traced 360 at every point of the plan (photowalk_plan.py) that
stands in one scene. The scene is built as its stills are (crown_rooms.py ROOMS: the same sun, the same random
draws), with the rooms on either side of it as far as NEAR degrees, so what one sees through the openings and down
the Glide is there; every pair of doors onto the Glide stands open (one walks through them). Each point is rendered
as the six faces of a cube round the camera, 1.55 m above the floor, and kept face by face: a stopped job starts
again where it was.
  bvenv/bin/python blend/photowalk_render.py <scene> <plan.json> <out dir> [face=1024] [spp=16] [id,id...]
Writes into <out dir>, for a point C-04.3 (files c04_3...):
  c04_3.webp     the six faces 3 across and 2 down: +x -x +y / -y +z -z (z up; each face as its camera saw it, the
                 side faces upright, +z and -z with +y up), graded as the scene's first point is (grade.py)
  c04_3_s.webp   the same a quarter the size: shown at once, and while moving
  c04_3_d.png    how far everything is: equirectangular 512 x 256 (+y in the middle, east to the right), in metres
                 as 0.25 * 65535 / value, the value in 16 bits (red the high byte, green the low); 0 is the sky
  (a tour stop is rendered like any other point: the 360 tour keeps its own 360s)
  grade.json     each scene's grade: its first point's brightness percentiles, so all its points are graded alike"""
import bpy, json, math, os, random, sys, time
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, crown, crown_rooms, plants
from crown import D

crown.DOORS_OPEN = True
NEAR = 6.0                     # degrees of the ring built either side of the scene's own rooms (about 13 m)
NEIGHBOUR_DETAIL = 0.6         # the rooms either side: plants a little plainer (they are seen through openings)
EXPOSURE = {"observatory": 2.0}            # as the stills (crown_rooms.py jobs); -0.2 for the rest
OVER = 16                      # pixels rendered past each edge of a face and cut off (a 32nd of the face, at least
                               # 16): the denoiser works less well at a picture's edges, which would show as seams
# the cube's faces: where each camera looks and which way is up on it (Blender's world: z up)
FACES = [((1, 0, 0), (0, 0, 1)), ((-1, 0, 0), (0, 0, 1)), ((0, 1, 0), (0, 0, 1)),
         ((0, -1, 0), (0, 0, 1)), ((0, 0, 1), (0, 1, 0)), ((0, 0, -1), (0, 1, 0))]


def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)


def bearing(v): return math.degrees(math.atan2(v.x, v.y)) % 360.0


def fname(pid): return pid.lower().replace("-", "").replace(".", "_")


def build(scene, plan):
    """the scene and its neighbours as far as NEAR degrees either side; the scene first, with its own random draws,
    so its rooms are as in its stills"""
    crown.PAD = 0.0
    order = [s[0] for s in plan["scenes"]]; span = {s[0]: (s[1], s[2]) for s in plan["scenes"]}
    i = order.index(scene); b0, b1 = span[scene]
    before, lo, k = [], b0, i
    while b0 - lo < NEAR:
        k = (k - 1) % len(order); before.insert(0, order[k]); lo -= (span[order[k]][1] - span[order[k]][0])
    after, hi, k = [], b1, i
    while hi - b1 < NEAR:
        k = (k + 1) % len(order); after.append(order[k]); hi += (span[order[k]][1] - span[order[k]][0])
    sc = lib.reset(); M = crown_rooms.materials()
    R = crown_rooms.ROOMS[scene]; night = R.get("night", False); crown_rooms.DAY["on"] = not night
    for s in [scene] + before + after:
        plants.DETAIL = 1.0 if s == scene else NEIGHBOUR_DETAIL
        crown_rooms.ROOMS[s]["build"](M, random.Random(23))
    plants.DETAIL = 1.0
    crown.outside(M, R["sun"][0], R["sun"][1], sun_strength=R.get("sun_strength", 6.0), skip=(lo, hi))
    if night: crown_rooms.night(R, M)
    # where two rooms meet both built the partition between them, and each closed the Glide at its ends: keep one
    # partition, and only the Glide's two ends. The Arrival hall's stills close their scene with a solid wall where
    # the hangar would be ("hangar end"): with the hangar built beside it, it would stand in the opening to the Door
    built = [scene] + before + after
    seen = {}
    for o in list(bpy.data.objects):
        if o.type != "MESH": continue
        if o.name.startswith("hangar end") and "hangar" in built: bpy.data.objects.remove(o); continue
        c = sum((o.matrix_world @ Vector(v) for v in o.bound_box), Vector()) / 8.0
        if o.name.startswith("glide end"):
            b = bearing(c); inside = (b - lo) % 360.0
            if 0.5 < inside < (hi - lo) - 0.5: bpy.data.objects.remove(o)
            continue
        if o.name.startswith("partition"):
            key = (round(bearing(c), 2) % 360, round(c.xy.length, 1), round(c.z, 1), round(o.dimensions.length, 2))
            if key in seen: bpy.data.objects.remove(o)
            else: seen[key] = o
    log("built %s with %s (%.1f to %.1f)" % (scene, ", ".join(before + after), lo, hi))
    return sc, R


def outputs(tmp):
    """the compositor: the picture as it is (no glow: it would stop at the faces' edges), and the depth into an
    EXR beside it"""
    sc = bpy.context.scene; sc.use_nodes = True; nt = sc.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    sc.view_layers[0].use_pass_z = True
    rl = nt.nodes.new("CompositorNodeRLayers"); comp = nt.nodes.new("CompositorNodeComposite")
    nt.links.new(rl.outputs["Image"], comp.inputs["Image"])
    fo = nt.nodes.new("CompositorNodeOutputFile"); fo.base_path = tmp
    fo.format.file_format = "OPEN_EXR"; fo.format.color_depth = "32"; fo.format.color_mode = "RGB"; fo.format.exr_codec = "ZIP"
    nt.links.new(rl.outputs["Depth"], fo.inputs[0])
    return fo


def face_camera(loc, k, size):
    F, U = Vector(FACES[k][0]), Vector(FACES[k][1]); Rt = F.cross(U)
    cam = bpy.data.objects.get("pw cam")
    if cam is None:
        c = bpy.data.cameras.new("pw cam"); c.sensor_width = 36.0; c.sensor_fit = "HORIZONTAL"; c.clip_start = 0.05; c.clip_end = 5000
        cam = bpy.data.objects.new("pw cam", c); bpy.context.scene.collection.objects.link(cam)
    cam.data.lens = 18.0 * size / (size + 2 * OVER)    # 90 degrees across the face, a little more across the render
    m = Matrix((Rt, U, -F)).transposed()          # the camera's x, y, z axes in the world: right, up, backwards
    cam.matrix_world = Matrix.Translation(Vector(loc)) @ m.to_4x4()
    bpy.context.scene.camera = cam
    return cam


def read_exr(path):
    im = bpy.data.images.load(path, check_existing=False); w, h = im.size
    a = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(a); bpy.data.images.remove(im)
    return a.reshape(h, w, 4)[::-1, :, 0]          # top row first


def render_point(p, out, tmp, fo, size, spp, ex):
    """the six faces of one point, each kept as soon as it is done"""
    global OVER
    OVER = max(16, size // 32)
    loc = (p["x"], p["y"], p["z"] + 1.55); f = fname(p["id"]); faces, depths = [], []
    sc = bpy.context.scene; sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_depth = "8"
    for k in range(6):
        png = os.path.join(tmp, "%s_f%d.png" % (f, k)); exr = os.path.join(tmp, "%s_f%d_d.exr" % (f, k))
        if not (os.path.exists(png) and os.path.exists(exr)):
            face_camera(loc, k, size); fo.file_slots[0].path = "%s_f%d_d" % (f, k)
            t = time.time(); part = png[:-4] + ".part.png"; lib.render(part, (size + 2 * OVER, size + 2 * OVER), spp, exposure=ex)
            from PIL import Image
            Image.open(part).crop((OVER, OVER, OVER + size, OVER + size)).save(png); os.remove(part)
            made = os.path.join(tmp, "%s_f%d_d%04d.exr" % (f, k, sc.frame_current))
            os.replace(made, exr)
            log("  face %d of %s in %.1f s" % (k, p["id"], time.time() - t))
        faces.append(png); depths.append(exr)
    return faces, depths


# ---------------------------------------------------------------- the cube to the web
def atlas(faces):
    from PIL import Image
    ims = [Image.open(x).convert("RGB") for x in faces]; n = ims[0].width
    A = Image.new("RGB", (3 * n, 2 * n))
    for k, im in enumerate(ims): A.paste(im, ((k % 3) * n, (k // 3) * n))
    return A


def cube_lookup(dirs, n):
    """for unit directions (..., 3): the face, and the pixel (column, row) on it, of a cube of n-pixel faces"""
    best = np.full(dirs.shape[:-1], -1e9); face = np.zeros(dirs.shape[:-1], np.int32)
    for k, (Fv, _) in enumerate(FACES):
        d = dirs @ np.array(Fv, float); m = d > best; best = np.where(m, d, best); face = np.where(m, k, face)
    Fm = np.array([f for f, _ in FACES], float)[face]; Um = np.array([u for _, u in FACES], float)[face]
    Rm = np.cross(Fm, Um); fw = np.sum(dirs * Fm, -1)
    x = np.sum(dirs * Rm, -1) / fw; y = np.sum(dirs * Um, -1) / fw          # -1..1 on the face
    col = np.clip((x + 1) / 2 * n - 0.5, 0, n - 1); row = np.clip((1 - y) / 2 * n - 0.5, 0, n - 1)
    return face, col, row, x, y


def equirect_dirs(w, h):
    """directions of an equirectangular picture's pixels: +y (north) in the middle, east (+x) to the right"""
    lon = ((np.arange(w) + 0.5) / w - 0.5) * 2 * np.pi; lat = (0.5 - (np.arange(h) + 0.5) / h) * np.pi
    lon, lat = np.meshgrid(lon, lat)
    return np.stack([np.cos(lat) * np.sin(lon), np.cos(lat) * np.cos(lon), np.sin(lat)], -1)


def depth_map(depths, w=512, h=256):
    """the depth faces (distance along each camera's axis) to an equirectangular map of distances"""
    D_ = np.stack([read_exr(x)[OVER:-OVER, OVER:-OVER] for x in depths]); n = D_.shape[1]
    face, col, row, x, y = cube_lookup(equirect_dirs(w, h), n)
    # the nearest of the few pixels round the sample, so a thin post is not missed
    out = np.full((h, w), np.inf)
    for dc in (-2, 0, 2):
        for dr in (-2, 0, 2):
            c = np.clip(np.round(col + dc).astype(int), 0, n - 1); r = np.clip(np.round(row + dr).astype(int), 0, n - 1)
            z = D_[face, r, c]
            out = np.minimum(out, z)
    dist = out * np.sqrt(1 + x * x + y * y)                     # along the ray, not the camera's axis
    q = np.where(dist > 1e5, 0, np.clip(np.round(0.25 * 65535 / np.maximum(dist, 0.25)), 1, 65535)).astype(np.uint16)
    from PIL import Image
    rgb = np.zeros((h, w, 3), np.uint8); rgb[..., 0] = q >> 8; rgb[..., 1] = q & 255
    return Image.fromarray(rgb, "RGB"), dist


def equirect(A, n, w=3072):
    """the cube as the tour's 360: equirectangular, bilinear"""
    from PIL import Image
    a = np.asarray(A, dtype=np.float32); h = w // 2
    face, col, row, _, _ = cube_lookup(equirect_dirs(w, h), n)
    c0 = np.floor(col).astype(int); r0 = np.floor(row).astype(int); fc = (col - c0)[..., None]; fr = (row - r0)[..., None]
    c1 = np.minimum(c0 + 1, n - 1); r1 = np.minimum(r0 + 1, n - 1)
    ox = (face % 3) * n; oy = (face // 3) * n
    def px(r, c): return a[oy + r, ox + c]
    v = (px(r0, c0) * (1 - fc) + px(r0, c1) * fc) * (1 - fr) + (px(r1, c0) * (1 - fc) + px(r1, c1) * fc) * fr
    return Image.fromarray(np.clip(v + 0.5, 0, 255).astype(np.uint8), "RGB")


def graded(A, scene, out, night):
    """grade.py's curve, the same for all of a scene's points: from its first point's brightness"""
    import grade
    gp = os.path.join(out, "grade.json"); G = json.load(open(gp)) if os.path.exists(gp) else {}
    a = np.asarray(A, dtype=np.float32) / 255.0
    lum = a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722
    if scene not in G:
        src = [float(x) for x in np.percentile(lum, [1, 5, 50, 95, 99.8])]
        kind = "night" if night else ("pale" if src[2] > 0.42 else "day")
        G[scene] = dict(src=src, kind=kind); json.dump(G, open(gp, "w"), indent=1)
    src, dst = G[scene]["src"], grade.TARGETS[G[scene]["kind"]]
    xs = [0.0] + list(src) + [1.0]; ys = [0.0] + list(dst) + [1.0]
    keep = [0] + [i for i in range(1, len(xs)) if xs[i] > xs[i - 1] + 1e-3]
    xs = [xs[i] for i in keep]; ys = [ys[i] for i in keep]
    t, c = grade.monotone_curve(xs, ys)
    new = np.interp(lum, t, c); ratio = np.where(lum > 1e-4, new / np.maximum(lum, 1e-4), 0.0)[..., None]
    from PIL import Image
    return Image.fromarray((np.clip(a * ratio, 0, 1) * 255 + 0.5).astype(np.uint8))


def finish(p, faces, depths, out, scene, night):
    f = fname(p["id"]); A = graded(atlas(faces), scene, out, night); n = A.width // 3
    A.save(os.path.join(out, f + ".part.webp"), "WEBP", quality=84, method=5); os.replace(os.path.join(out, f + ".part.webp"), os.path.join(out, f + ".webp"))
    A.resize((A.width // 4, A.height // 4), 1).save(os.path.join(out, f + "_s.webp"), "WEBP", quality=80, method=5)
    # (a tour stop's 360 stays the tour's own: nothing here goes into the 360 tour. Jim, 8 Oct 2026: "DON'T touch 360
    # tour for each room, which i like very much")
    dm, dist = depth_map(depths); dm.save(os.path.join(out, f + "_d.png"), optimize=True)
    log("  %s: nearest %.2f m, %.0f%% sky" % (p["id"], float(np.min(dist)), 100.0 * float(np.mean(dist > 1e5))))


def main():
    scene, plan_path, out = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
    size = int(sys.argv[4]) if len(sys.argv) > 4 else 1024; spp = int(sys.argv[5]) if len(sys.argv) > 5 else 16
    only = set(sys.argv[6].split(",")) if len(sys.argv) > 6 else None
    plan = json.load(open(plan_path)); tmp = os.path.join(out, "faces"); os.makedirs(tmp, exist_ok=True)
    pts = [p for p in plan["points"] if p["scene"] == scene and (only is None or p["id"] in only)]
    pts.sort(key=lambda p: (not p.get("stop"), p["b"], p["r"]))     # the tour's stop first: its grade is the scene's
    todo = [p for p in pts if not os.path.exists(os.path.join(out, fname(p["id"]) + "_d.png"))]
    if not todo: log("nothing to do"); return
    t = time.time(); sc, R = build(scene, plan); log("built in %.0f s" % (time.time() - t))
    sc.render.use_persistent_data = True        # the camera moves; the scene is kept between renders
    if os.environ.get("PW_BOUNCES"):            # fewer bounces (a test of speed against the look): max,diffuse,glossy,transmission
        mx, df, gl, tr = (int(x) for x in os.environ["PW_BOUNCES"].split(","))
        sc.cycles.max_bounces, sc.cycles.diffuse_bounces, sc.cycles.glossy_bounces, sc.cycles.transmission_bounces = mx, df, gl, tr
        sc.cycles.transparent_max_bounces = min(sc.cycles.transparent_max_bounces, 8)
    fo = outputs(tmp); ex = EXPOSURE.get(scene, -0.2); night = R.get("night", False)
    for p in todo:
        t = time.time(); faces, depths = render_point(p, out, tmp, fo, size, spp, ex)
        finish(p, faces, depths, out, scene, night)
        for x in faces + depths: os.remove(x)
        log("point %s done in %.0f s" % (p["id"], time.time() - t))


if __name__ == "__main__":
    main()
    sys.stdout.flush(); sys.stderr.flush()
    os._exit(0)                 # skip Blender's teardown, which can crash after big scenes
