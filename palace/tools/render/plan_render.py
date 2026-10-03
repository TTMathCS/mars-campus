"""Floor plans rendered from above, as in a 3D floor plan: the house built as for the pictures, everything above
the cut (ceilings, roofs, upper floors) hidden, an orthographic camera looking straight down, light from above.
  bvenv/bin/python blend/plan_render.py <view[,view...]> <out with %s> [samples]
Views: residence, suite (family.py); library, baths, cinema (pent_rooms.py); crown parts by room name (crown_rooms.py)."""
import bpy, math, os, sys, time
from mathutils import Vector, Euler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib

VIEWS = {   # scene, centre (x, y), size across (m), size up the page (m), turn (degrees), cut height
    "residence": ("family", (0.0, 15.2), 54.0, 36.0, 0.0, 2.6),
    "suite": ("family", (0.0, 25.0), 33.0, 15.0, 0.0, 2.6),
    "library": ("pent:library", (0.0, 6.6), 52.0, 17.0, 0.0, 3.4),
    "baths": ("pent:baths", (0.0, 6.6), 52.0, 17.0, 0.0, 3.4),
    "cinema": ("pent:cinema", (0.0, 6.6), 52.0, 17.0, 0.0, 3.4),
    "guests": ("pent:guests", (0.0, 6.6), 52.0, 17.0, 0.0, 3.4),
    "o_lounges": ("orb:earth", (0.0, 0.0), 50.0, 50.0, 0.0, 72.0 - 41.0 + 2.9),      # the Orb's +72 m floor
}
CROWN_SPANS = {"c_arrival": (72.0, 108.0), "c_bedroom": (108.0, 144.0), "c_salon": (144.0, 180.0), "c_wellness": (180.0, 216.0), "c_dining": (216.0, 252.0), "c_sunset": (252.0, 288.0), "c_library": (288.0, 324.0),
               "c_studio": (324.0, 360.0), "c_observatory": (0.0, 36.0), "c_garden": (36.0, 72.0)}


def build(scene):
    if scene == "family":
        import family; family.build(); return
    if scene.startswith("pent:"):
        import pent_rooms; pent_rooms.build(scene[5:]); return
    if scene.startswith("orb:"):
        import orb; orb.build(scene[4:], False); return
    import crown_rooms; crown_rooms.build(scene[6:], False)        # plans by day, the Observatory too


def plan(cx, cy, w, h, turn, cut, px_w=1600):
    sc = bpy.context.scene; hidden = 0
    for o in sc.objects:
        if o.type not in ("MESH", "CURVE") or o.hide_render: continue
        zmin = min((o.matrix_world @ Vector(c)).z for c in o.bound_box)
        if zmin > cut or any(k in o.name.lower() for k in ("ceiling", "roof", "slats", "felt", "storey band", "skylight", "well trim", "lens", "downlight", "washer trim", "cove", "pendant", "cable", "cord", "stars", "universe")):
            o.hide_render = True; hidden += 1
    for o in sc.objects:                       # soft light from high above instead of the pictures' sun
        if o.type == "LIGHT" and o.data.type == "SUN":
            o.rotation_euler = Euler((math.radians(12), math.radians(-8), 0), "XYZ"); o.data.angle = math.radians(18); o.data.energy = min(o.data.energy, 6.0)
    c = bpy.data.cameras.new("plan"); c.type = "ORTHO"; c.ortho_scale = max(w, h * px_w / int(px_w * h / w)); c.clip_start = 0.1; c.clip_end = 500
    cam = lib.link(bpy.data.objects.new("plan", c)); cam.location = (cx, cy, 60.0); cam.rotation_euler = (0, 0, math.radians(turn)); sc.camera = cam
    sc.render.resolution_x = px_w; sc.render.resolution_y = int(px_w * h / w); c.ortho_scale = w
    print("plan: hid", hidden, "objects", flush=True)


def setup(view):
    """for a scene already built: set up the plan view called view; returns the picture's size"""
    if view in CROWN_SPANS:
        from crown import P, R_GL, R_OUT
        b0, b1 = CROWN_SPANS[view]; bm = (b0 + b1) / 2; m = P((R_GL + R_OUT) / 2 - 2.5, bm); L = (b1 - b0) * math.pi / 180 * 131.75 + 6
        plan(m.x, m.y, L, 24.0, -bm, 2.9)
    else:
        scene, (cx, cy), w, h, turn, cut = VIEWS[view]; plan(cx, cy, w, h, turn, cut)
    lib.photo_finish(0.15, 0.0)
    return (bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y)


if __name__ == "__main__":
    views = sys.argv[1].split(","); out = sys.argv[2]; spp = int(sys.argv[3]) if len(sys.argv) > 3 else 64
    todo = [v for v in views if not os.path.exists(out.replace("%s", v))]
    if not todo: print("nothing to do"); sys.exit(0)
    for v in todo:
        t = time.time()
        build("crown:" + v[2:] if v in CROWN_SPANS else VIEWS[v][0]); setup(v)
        path = os.path.abspath(out.replace("%s", v)); tmp = path.replace(".jpg", ".part.jpg")
        lib.render(tmp, (bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y), spp, exposure=0.3)
        os.replace(tmp, path); print("rendered plan", v, "in %.0f s" % (time.time() - t), flush=True)
