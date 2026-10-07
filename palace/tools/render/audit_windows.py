"""List what hangs on or stands against the Crown's outer windows (Jim, 7 Oct 2026: "painting should not be on the
windows"): builds each room's scene and reports every object within 0.8 m of the outer wall whose height reaches
into the windows (0.6 to 2.9 m above the floor) and whose width along the wall overlaps a window that is there.
Plants, seats, rugs, lights and the wall itself are left out: things that stand in front of a window are fine, things
fixed over it are not.
  bvenv/bin/python blend/audit_windows.py [room ...]        (default: every room of crown_rooms.ROOMS)"""
import math, os, sys
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


def audit(room):
    sc, R = CR.build(room, False)
    # the windows the outer wall really has: its panes, in the middle of the wall (a window that a cross wall would cut,
    # or one behind a door, is left out of the wall, so it is not in the scene)
    wins = []
    for o in bpy.data.objects:
        if o.type != "MESH" or not o.name.startswith("window glass"): continue
        pts = [o.matrix_world @ v.co for v in o.data.vertices]
        if not pts or abs(math.hypot(pts[0].x, pts[0].y) - (R_OUT + crown.WT / 2)) > 0.2: continue
        bs = [bearing(p.x, p.y) for p in pts]; lo_, hi_ = min(bs), max(bs)
        if hi_ - lo_ > 180: bs = [b if b > 180 else b + 360 for b in bs]; lo_, hi_ = min(bs), max(bs)
        wins.append((lo_, hi_))
    hits = []
    for o in bpy.data.objects:
        if o.type != "MESH" or o.hide_render: continue
        nm = o.name.lower()
        if any(k in nm for k in SKIP): continue
        pts = [o.matrix_world @ v.co for v in o.data.vertices] if len(o.data.vertices) < 20000 else [o.matrix_world @ __import__("mathutils").Vector(c) for c in o.bound_box]
        if not pts: continue
        rs = [math.hypot(p.x, p.y) for p in pts]; zs = [p.z for p in pts]
        if max(rs) < R_OUT - 0.8 or min(rs) > R_OUT + 0.05: continue              # not against the outer wall
        if max(zs) < 0.6 or min(zs) > 2.9: continue                                  # below the sill or above the head
        bs = [bearing(p.x, p.y) for p in pts]
        lo, hi = min(bs), max(bs)
        if hi - lo > 180: bs = [b if b > 180 else b + 360 for b in bs]; lo, hi = min(bs), max(bs)
        for (a, b) in wins:
            if lo < b - 0.02 and hi > a + 0.02:
                hits.append((o.name, round(lo, 2), round(hi, 2), round(min(zs), 2), round(max(zs), 2), (round(a, 2), round(b, 2)))); break
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
