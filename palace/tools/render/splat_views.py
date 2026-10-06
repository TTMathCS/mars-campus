"""Views of a room for training a Gaussian splat (Jim, 6 Oct 2026: "try to use gaussian splatting if possible. I heard
it is pretty good for real experience?"). A splat is a cloud of millions of soft coloured blobs fitted to many pictures
of a place; a browser draws it in real time, so a visitor can walk about the room and see it as the path tracer drew
it: the light, the shadows, the plants. This script makes what the fitting needs, from the same scene as the stills:
  - a rig of cameras round a point of the room, at three heights, each looking all round (and up, and down), every
    view path-traced like the stills but without glow or vignette, and graded with one curve for all of them;
  - their poses and lens in a nerfstudio transforms.json;
  - a cloud of points to start the splat from: where rays through the views' pixels first meet the room (glass let
    through), in the pixels' colours, and on a far sphere where they go out through the windows to the sky and plain.
Then OpenSplat (github.com/pierotofy/OpenSplat, built for the CPU; see palace/blender/splats/README.md) fits it:
  bvenv/bin/python blend/splat_views.py <room> <out dir> [w h spp exposure] [--at r,b] [--spread m] [--rig test|full]
  opensplat <out dir> -n 6000 -o <out dir>/splat.ply"""
import bpy, math, os, sys, json, time
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib


def rig(centre, spread, kind):
    """(position, yaw, pitch) for every view: yaw a compass bearing (0 = +y, 90 = +x), pitch up from level"""
    cx, cy, cz = centre
    if kind == "test":
        spots = [(cx, cy, cz + 1.6)]
        dirs = [(y, 0.0) for y in range(0, 360, 30)]
    else:
        spots = [(cx, cy, cz + 1.6)]
        spots += [(cx + spread * math.sin(a), cy + spread * math.cos(a), cz + 1.4) for a in [k * math.pi / 3 for k in range(6)]]
        spots += [(cx + spread / 2 * math.sin(a), cy + spread / 2 * math.cos(a), cz + 1.85) for a in [k * math.pi / 3 + math.pi / 6 for k in range(6)]]
        dirs = [(y, 0.0) for y in range(0, 360, 45)] + [(y, 38.0) for y in range(0, 360, 90)] + [(y + 45, -34.0) for y in range(0, 360, 90)]
    views = [(Vector(p), yaw, pitch) for p in spots for (yaw, pitch) in dirs]
    if kind != "test":                  # and from every place, one view near straight up and one near straight down
        views += [(Vector(p), 60.0 * k, 72.0) for k, p in enumerate(spots)] + [(Vector(p), 60.0 * k + 30, -70.0) for k, p in enumerate(spots)]
    return views


def look(yaw, pitch):
    d = Vector((math.sin(math.radians(yaw)) * math.cos(math.radians(pitch)), math.cos(math.radians(yaw)) * math.cos(math.radians(pitch)), math.sin(math.radians(pitch))))
    return d.to_track_quat("-Z", "Y").to_matrix().to_4x4()


def grade_curve(images, kind="pale"):
    """one grading curve for all the views (grade.py's, from their pooled brightness), so the splat sees one look"""
    import grade
    lum = np.concatenate([(a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722).ravel()[::7] for a in images])
    src = np.percentile(lum, [1, 5, 50, 95, 99.8]); dst = grade.TARGETS[kind]
    xs = [0.0] + list(src) + [1.0]; ys = [0.0] + list(dst) + [1.0]
    keep = [0] + [i for i in range(1, len(xs)) if xs[i] > xs[i - 1] + 1e-3]
    return grade.monotone_curve([xs[i] for i in keep], [ys[i] for i in keep])


def apply_curve(a, curve):
    t, c = curve; lum = a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722
    new = np.interp(lum, t, c); ratio = np.where(lum > 1e-4, new / np.maximum(lum, 1e-4), 0.0)[..., None]
    return np.clip(a * ratio, 0, 1)


def is_glass(m):
    """clear glass (the windows, the glass walls): seen through, so neither sampled nor in the way"""
    if m is None or not m.use_nodes: return False
    for n in m.node_tree.nodes:
        if n.type == "BSDF_GLASS": return True
        if n.type == "BSDF_PRINCIPLED":
            t = n.inputs.get("Transmission Weight")
            if t is not None and not t.is_linked and t.default_value > 0.9: return True
    return False


def surfaces(bounds):
    """every triangle the camera can see inside bounds (r0, r1, b0, b1, z0, z1 in the Crown's frame), instances
    included, glass left out: (A, B, C) corner arrays"""
    r0, r1, b0, b1, z0, z1 = bounds
    dg = bpy.context.evaluated_depsgraph_get(); tris = []; cache = {}
    for inst in dg.object_instances:
        ob = inst.object
        if ob.type != "MESH" or ob.hide_render or not getattr(ob, "visible_camera", True): continue
        key = ob.original.name
        if key not in cache:                        # each mesh converted once, however many times it is instanced
            me = ob.to_mesh()
            if me is None: cache[key] = None; continue
            me.calc_loop_triangles(); nv = len(me.vertices); nt = len(me.loop_triangles)
            if nt == 0: ob.to_mesh_clear(); cache[key] = None; continue
            co0 = np.empty(nv * 3, np.float32); me.vertices.foreach_get("co", co0)
            idx0 = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get("vertices", idx0)
            mi = np.empty(nt, np.int32); me.loop_triangles.foreach_get("material_index", mi)
            glass = np.array([is_glass(sl.material) for sl in ob.material_slots] or [False])
            keep = ~glass[np.clip(mi, 0, len(glass) - 1)]
            cache[key] = (co0.reshape(-1, 3), idx0.reshape(-1, 3)[keep]) if keep.any() else None; ob.to_mesh_clear()
        if cache[key] is None: continue
        co, idx = cache[key]
        mw = np.array(inst.matrix_world, np.float32); co = co @ mw[:3, :3].T + mw[:3, 3]
        a, b, c = co[idx[:, 0]], co[idx[:, 1]], co[idx[:, 2]]; cen = (a + b + c) / 3
        r = np.hypot(cen[:, 0], cen[:, 1]); bb = np.degrees(np.arctan2(cen[:, 0], cen[:, 1])) % 360
        db = (bb - b0) % 360; inside = (r > r0) & (r < r1) & (db < ((b1 - b0) % 360 or 360)) & (cen[:, 2] > z0) & (cen[:, 2] < z1)
        if not inside.any(): continue
        tris.append((a[inside], b[inside], c[inside]))
    return tuple(np.concatenate([t[i] for t in tris]) for i in range(3))


def occluder(A, B, C):
    """a ray-cast tree of the triangles (corners merged to save memory)"""
    from mathutils.bvhtree import BVHTree
    v = np.stack([A, B, C], 1).reshape(-1, 3); uv, inv = np.unique(np.round(v, 4), axis=0, return_inverse=True)
    return BVHTree.FromPolygons(uv.tolist(), inv.reshape(-1, 3).tolist(), all_triangles=True)


def seen_points(views, images, fx, w, h, tree, per_view, sky_r, seed=5):
    """the starting cloud: through random pixels of every view a ray goes out to the first surface it meets, and a point
    is put there in that pixel's colour; a ray that meets nothing (out through a window) ends on a far sphere, the sky
    and the plain. So every point is one a view sees, and the cloud is densest where the views look closest."""
    rng = np.random.default_rng(seed); pts = np.empty((len(views) * per_view, 3), np.float32); col = np.empty_like(pts); n = 0; sky = 0
    for mw, img in zip(views, images):
        m = np.array(mw, np.float64); o = Vector(m[:3, 3])
        u = rng.integers(0, w, per_view); v = rng.integers(0, h, per_view)
        d = np.stack([(u + 0.5 - w / 2) / fx, -(v + 0.5 - h / 2) / fx, -np.ones(per_view)], 1) @ m[:3, :3].T
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        for k in range(per_view):
            dk = Vector(d[k]); hit = tree.ray_cast(o, dk, 500.0)
            if hit[0] is None: pts[n] = o + dk * sky_r; sky += 1
            else: pts[n] = hit[0]
            col[n] = img[v[k], u[k]]; n += 1
    return pts[:n], col[:n], sky


def write_ply(path, pts, col):
    n = len(pts); rec = np.zeros(n, dtype=[("x", "<f4"), ("y", "<f4"), ("z", "<f4"), ("r", "u1"), ("g", "u1"), ("b", "u1")])
    rec["x"], rec["y"], rec["z"] = pts[:, 0], pts[:, 1], pts[:, 2]
    c = (np.clip(col, 0, 1) * 255 + 0.5).astype(np.uint8); rec["r"], rec["g"], rec["b"] = c[:, 0], c[:, 1], c[:, 2]
    head = "ply\nformat binary_little_endian 1.0\nelement vertex %d\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n" % n
    with open(path, "wb") as f: f.write(head.encode()); f.write(rec.tobytes())


def main():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]; opt = {k.lstrip("-"): v for k, v in zip(sys.argv[1::1], sys.argv[2::1]) if k.startswith("--")}
    room, out = a[0], os.path.abspath(a[1])
    w, h, spp, ex = (int(a[2]), int(a[3]), int(a[4]), float(a[5])) if len(a) > 5 else (800, 450, 32, -0.2)
    kind = opt.get("rig", "full"); spread = float(opt.get("spread", 2.4)); hfov = float(opt.get("fov", 80.0))
    import crown_rooms
    from crown import P, R_IN, R_OUT, ceil_at
    R = crown_rooms.ROOMS[room]; b0, b1 = R["span"]
    if "at" in opt: r_, b_ = (float(v) for v in opt["at"].split(","))
    else: (x, y, z) = list(R["stops"].values())[0]; r_, b_ = math.hypot(x, y), math.degrees(math.atan2(x, y)) % 360
    centre = P(r_, b_, 0.0)
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    t = time.time(); crown_rooms.build(room, False); print("built in %.1f s" % (time.time() - t), flush=True)
    sc = bpy.context.scene; sc.render.use_persistent_data = True
    if sc.use_nodes: sc.node_tree.nodes.clear(); sc.use_nodes = False         # no glow, no vignette: every view the same
    cam_data = bpy.data.cameras.new("splat cam"); cam = bpy.data.objects.new("splat cam", cam_data); lib.link(cam); sc.camera = cam
    cam_data.sensor_fit = "HORIZONTAL"; cam_data.sensor_width = 36.0; cam_data.lens = 18.0 / math.tan(math.radians(hfov / 2)); cam_data.clip_start = 0.05; cam_data.clip_end = 3000
    fx = (w / 2) / math.tan(math.radians(hfov / 2))
    views = rig(centre, spread, kind); poses = []
    for i, (p, yaw, pitch) in enumerate(views):
        cam.matrix_world = Matrix.Translation(p) @ look(yaw, pitch); poses.append([list(r) for r in cam.matrix_world])
        raw = os.path.join(out, "raw", "%04d.png" % i); os.makedirs(os.path.dirname(raw), exist_ok=True)
        if os.path.exists(raw): continue
        t = time.time(); sc.render.image_settings.file_format = "PNG"; lib.render(raw[:-4] + ".part.png", (w, h), spp, exposure=ex)
        os.replace(raw[:-4] + ".part.png", raw); print("view %d of %d in %.1f s" % (i + 1, len(views), time.time() - t), flush=True)
    # one grading curve for all the views, then the training images
    from PIL import Image
    imgs = [np.asarray(Image.open(os.path.join(out, "raw", "%04d.png" % i)).convert("RGB"), np.float32) / 255 for i in range(len(views))]
    curve = grade_curve(imgs, opt.get("grade", "pale")); imgs = [apply_curve(im, curve) for im in imgs]
    frames = []
    for i, im in enumerate(imgs):
        fp = "images/%04d.jpg" % i; Image.fromarray((im * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, fp), quality=95)
        frames.append(dict(file_path=fp, transform_matrix=poses[i]))
    # the starting cloud, from what the views see
    t = time.time(); top = max(ceil_at(b) for b in np.linspace(b0, b1, 20)) + 0.5
    tree = occluder(*surfaces((R_IN - 0.6, R_OUT + 0.6, b0 - 1.0, b1 + 1.0, -2.0, top))); print("tree in %.1f s" % (time.time() - t), flush=True)
    t = time.time(); pts, col, sky = seen_points(poses, imgs, fx, w, h, tree, max(1, int(opt.get("points", 300000)) // len(poses)), float(opt.get("sky_r", 260.0)))
    print("%d points (%d on the far sphere) in %.1f s" % (len(pts), sky, time.time() - t), flush=True)
    write_ply(os.path.join(out, "points.ply"), pts, col)
    json.dump(dict(camera_model="OPENCV", w=w, h=h, fl_x=fx, fl_y=fx, cx=w / 2, cy=h / 2, k1=0, k2=0, p1=0, p2=0,
                   ply_file_path="points.ply", frames=frames, room=room, centre=[r_, b_], spread=spread, rig=kind),
              open(os.path.join(out, "transforms.json"), "w"), indent=1)
    print("views", len(frames), "points", len(pts), "->", out, flush=True)


if __name__ == "__main__":
    main()
