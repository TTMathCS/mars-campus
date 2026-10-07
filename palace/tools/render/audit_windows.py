"""List what hangs on or stands against the Crown's outer windows (Jim, 7 Oct 2026: "painting should not be on the
windows"): builds each room's scene and reports every object within 0.8 m of the outer wall whose height reaches
into the windows (0.6 to 2.9 m above the floor) and whose width along the wall overlaps a window that is there.
Plants, seats, rugs, lights and the wall itself are left out: things that stand in front of a window are fine, things
fixed over it are not.
  bvenv/bin/python blend/audit_windows.py [room ...]        (default: every room of crown_rooms.ROOMS)"""
import math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import crown_rooms as CR, crown
from crown import R_OUT, D

SKIP = ("wall", "window", "lining", "glass", "floor", "ceiling", "cove", "slat", "felt", "rug", "light", "lamp", "washer",
        "halo", "globe", "pendant", "plant", "leaf", "leaves", "trunk", "stem", "frond", "pot", "planter", "sofa", "chair",
        "daybed", "bench", "chaise", "ottoman", "bed", "crescent", "sectional", "partition", "glide", "rail post", "sun",
        "sky", "plain", "orb", "ring outside", "stone garden", "maple", "olive", "lemon", "kentia", "fig", "fern", "agave",
        "ginkgo", "barrel", "boxwood", "lavender", "orchid", "strelitzia", "paradise", "herb", "ivy", "soil", "bed wall")


def bearing(x, y): return math.degrees(math.atan2(x, y)) % 360.0


def world_points(o):
    """The object's vertices in world space, as an n x 3 array."""
    n = len(o.data.vertices)
    co = np.empty(n * 3, dtype=np.float64); o.data.vertices.foreach_get("co", co)
    m = np.array(o.matrix_world, dtype=np.float64)
    return co.reshape(n, 3) @ m[:3, :3].T + m[:3, 3]


def span(xs, ys):
    """The bearings an object covers, as (lo, hi) in degrees (hi may pass 360 when it straddles north)."""
    bs = np.degrees(np.arctan2(xs, ys)) % 360.0
    lo, hi = float(bs.min()), float(bs.max())
    if hi - lo > 180: bs = np.where(bs > 180, bs, bs + 360); lo, hi = float(bs.min()), float(bs.max())
    return lo, hi


def audit(room):
    sc, R = CR.build(room, False)
    # the windows the outer wall really has: its panes, in the middle of the wall (a window that a cross wall would cut,
    # or one behind a door, is left out of the wall, so it is not in the scene)
    wins = []
    for o in bpy.data.objects:
        if o.type != "MESH" or not o.name.startswith("window glass") or not len(o.data.vertices): continue
        p = world_points(o)
        if abs(math.hypot(p[0, 0], p[0, 1]) - (R_OUT + crown.WT / 2)) > 0.2: continue
        wins.append(span(p[:, 0], p[:, 1]))
    hits = []
    for o in bpy.data.objects:
        if o.type != "MESH" or o.hide_render or not len(o.data.vertices): continue
        nm = o.name.lower()
        if any(k in nm for k in SKIP): continue
        # a quick look at the bounding box first: a disc is convex, so if every corner lies inside R_OUT - 0.8 the
        # whole object does; and the corners' heights bound the vertices' heights
        bb = np.array([o.matrix_world @ __import__("mathutils").Vector(c) for c in o.bound_box])
        if np.hypot(bb[:, 0], bb[:, 1]).max() < R_OUT - 0.8 or bb[:, 2].max() < 0.6 or bb[:, 2].min() > 2.9: continue
        p = world_points(o)
        rs = np.hypot(p[:, 0], p[:, 1]); zs = p[:, 2]
        if rs.max() < R_OUT - 0.8 or rs.min() > R_OUT + 0.05: continue              # not against the outer wall
        if zs.max() < 0.6 or zs.min() > 2.9: continue                                  # below the sill or above the head
        lo, hi = span(p[:, 0], p[:, 1])
        for (a, b) in wins:
            if any(lo < b + k - 0.02 and hi > a + k + 0.02 for k in (-360.0, 0.0, 360.0)):
                hits.append((o.name, round(lo, 2), round(hi, 2), round(float(zs.min()), 2), round(float(zs.max()), 2), (round(a, 2), round(b, 2)))); break
    return hits


if __name__ == "__main__":
    rooms = sys.argv[1:] or [k for k in CR.ROOMS if not k.startswith("part_")]
    for room in rooms:
        try:
            hits = audit(room)
        except Exception as e:
            print("AUDIT", room, "failed:", e, flush=True); continue
        print("AUDIT", room, "clear" if not hits else "%d on the windows" % len(hits), flush=True)
        for h in hits: print("   ", h, flush=True)
    sys.stdout.flush(); os._exit(0)
