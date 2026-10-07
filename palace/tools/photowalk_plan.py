"""The Crown photo walk (palace/photowalk/), designed before it is drawn: where the tripod stands in every room of the
Crown's main floor, so the walk can be rendered point by point (render/photowalk_render.py) and walked in the
browser like a real house's walk-through: a path-traced 360 at every point, and a click on the floor moves to the
next. Jim, 7 Oct 2026, of the free walk: "the loading is very slow, and the experience is not as good as I thought";
he chose this photo walk first, then the free walk polished.

Where the points go:
  - the room's tour stop (tour_crown.py), so the tour's 360 there is this walk's;
  - two rows along each room (ROWS: 4.5 m in from the glass onto the Glide and from the windows), a point every
    SPACING metres or a little less, the rows staggered so the points zig-zag down the room;
  - each point on free floor with CLEAR metres round it (the walk's floor map, palace/walk/data/floor.png: nothing
    in the way from 0.15 to 1.85 m up), moved up to SNAP metres to find it, or left out;
  - then the walk is made whole: where two rooms' points do not join by straight steps (at most LINK metres, on
    free floor), the shortest way between them is added: points in the openings of the partitions, in the doorways
    onto the Glide, and along the Glide.

Each point: its code (the room's code and a number round the ring: C-04.3; GL for the Glide), the scene that
renders it (render/crown_rooms.py ROOMS), where it stands (radius r and bearing b; x, y in metres, the floor at 0),
which way it looks first (a bearing), and the tour stop it is, if one. Where one can step from a point is found in
the browser from what the point's 360 sees (its depth map), so a step never goes through a wall.
  python3 palace/tools/photowalk_plan.py               write palace/photowalk/plan.json
  python3 palace/tools/photowalk_plan.py map out.png   and a map of the points over the floor map, to check"""
import heapq, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import room_program, tour_crown

WALK = os.path.join(HERE, "..", "walk", "data")
OUT = os.path.join(HERE, "..", "photowalk", "plan.json")
D = math.pi / 180
R_IN, R_GL, R_OUT = 115.0, 118.5, 135.0
RM, GLIDE = (R_GL + R_OUT) / 2, (R_IN + R_GL) / 2
ROWS = (123.0, 130.6)          # the two rows: 4.5 m in from the glass onto the Glide, 4.4 m in from the windows
SPACING = 5.6                  # at most this far apart along a row, metres; the rows are staggered by half a step
CLEAR = 0.7                    # free floor round a point, metres: no chair or table right under the tripod
SNAP = 1.6                     # how far a point may move to find free floor, metres
EYE = 1.55                     # the camera above the floor, metres (as the tour's 360s)
LINK = 9.5                     # the longest straight step between two points, metres
GLIDE_STEP = 8.0               # points along the Glide, where one is needed: this far apart

# the scenes that render the Crown (crown_rooms.py ROOMS: a room or a run of rooms each), round the ring
SCENES = [("observatory", 0.0, 36.0), ("garden", 36.0, 72.0), ("suit", 72.0, 78.0), ("hangar", 78.0, 91.44),
          ("arrival", 91.44, 108.0), ("dressing", 108.0, 116.64), ("bedroom", 116.64, 130.32), ("bath_up", 130.32, 144.0),
          ("salon", 144.0, 180.0), ("wellness", 180.0, 216.0), ("wine", 216.0, 223.2), ("dining", 223.2, 241.2),
          ("kitchen_up", 241.2, 252.0), ("day_room", 252.0, 261.0), ("sunset", 261.0, 279.0), ("gallery", 279.0, 288.0),
          ("library", 288.0, 324.0), ("studio", 324.0, 360.0)]


def scene_of(b):
    b %= 360.0
    return next((s for (s, b0, b1) in SCENES if b0 <= b < b1), SCENES[-1][0])


def xy(r, b): return (r * math.sin(b * D), r * math.cos(b * D))


def rb(x, y): return (math.hypot(x, y), math.degrees(math.atan2(x, y)) % 360.0)


def rooms():
    """the Crown's main floor, room by room round the ring (room_program.CROWN, not the spires' upper floors)"""
    return [c for c in room_program.CROWN if not c.get("up")]


class Floor:
    """the walk's floor map: across, bearing; down, radius; white where one can stand"""
    def __init__(self):
        info = json.load(open(os.path.join(WALK, "walk.json")))["floor"]
        self.b0, self.db, self.r0, self.dr = info["b0"], info["db"], info["r0"], info["dr"]
        self.free = np.asarray(Image.open(os.path.join(WALK, info["file"])).convert("L")) > 127
        self.h, self.w = self.free.shape
        blocked = (~self.free).astype(np.int32)           # a summed-area table: is a square round a cell clear?
        self.sat = np.zeros((self.h + 1, self.w + 1), np.int32); self.sat[1:, 1:] = blocked.cumsum(0).cumsum(1)

    def ij(self, r, b): return int(((b - self.b0) % 360.0) / self.db), int((r - self.r0) / self.dr)

    def ok(self, r, b):
        i, j = self.ij(r, b)
        return 0 <= j < self.h and bool(self.free[j, i % self.w])

    def clear(self, r, b, c):
        """no blocked cell within c metres (a square) of the point"""
        i, j = self.ij(r, b); ci = int(math.ceil(c / (r * self.db * D))); cj = int(math.ceil(c / self.dr))
        j0, j1, i0, i1 = j - cj, j + cj + 1, i - ci, i + ci + 1
        if j0 < 0 or j1 > self.h or i0 < 0 or i1 > self.w: return False
        return self.sat[j1, i1] - self.sat[j0, i1] - self.sat[j1, i0] + self.sat[j0, i0] == 0

    def walkable(self, p, q, step=0.05):
        """a straight line on free floor from p to q (each (x, y))"""
        n = max(1, int(math.dist(p, q) / step))
        return all(self.ok(*rb(p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n)) for k in range(n + 1))


def snap(F, r, b, box, clear=CLEAR, reach=SNAP):
    """the nearest free spot with `clear` round it, within `reach` metres, inside box (b0, b1, r0, r1)"""
    best = None
    for dr in np.arange(-reach, reach + 1e-6, 0.1):
        for dm in np.arange(-reach, reach + 1e-6, 0.1):
            d = math.hypot(dr, dm)
            if d > reach or (best and d >= best[0]): continue
            rr = r + dr; bb = b + dm / (rr * D)
            if box[0] <= bb <= box[1] and box[2] <= rr <= box[3] and F.clear(rr, bb, clear): best = (d, rr, bb)
    return best and (best[1], best[2])


def room_points(F):
    """the tour stop and two staggered rows in every room"""
    stops = {s[1]: s for s in tour_crown.STOPS}; out = []
    for room in rooms():
        b0, b1 = room["at"]; code = room["code"]; here = []
        box = (b0 + 0.6 / (RM * D), b1 - 0.6 / (RM * D), R_GL + 1.0, R_OUT - 1.0)
        st = stops.get(code)
        if st:
            s = snap(F, st[4][0], st[4][1], box, clear=0.45, reach=1.2) or st[4]
            here.append(dict(r=s[0], b=s[1], stop=st[0], key=st[3], at=st[5]))
        lo, hi = b0 + 1.0 / (RM * D), b1 - 1.0 / (RM * D)
        for n, rr in enumerate(ROWS):
            L = (hi - lo) * D * rr; cnt = max(1, int(L // SPACING) + 1); step = L / cnt
            for c in range(cnt):
                b = lo + (c + (0.25 if n == 0 else 0.75)) * step / (rr * D)
                if any(math.dist(xy(rr, b), xy(p["r"], p["b"])) < SPACING * 0.6 for p in here): continue
                s = snap(F, rr, b, box)
                if s and not any(math.dist(xy(*s), xy(p["r"], p["b"])) < SPACING * 0.5 for p in here): here.append(dict(r=s[0], b=s[1]))
        for p in here: p["room"] = code
        out += here
    return out


def openings(F, b, lo, hi, least=0.9):
    """the free stretches across the floor (radius lo to hi) on the line of bearing b, at least `least` metres wide;
    free 0.3 m either side of the line too, so a partition's thickness does not count"""
    i, _ = F.ij(lo, b); j0, j1 = int((lo - F.r0) / F.dr), int((hi - F.r0) / F.dr)
    di = int(math.ceil(0.3 / (RM * F.db * D)))
    if di <= i < F.w - di: col = F.free[j0:j1, i - di:i + di + 1].all(axis=1)
    else: col = F.free[j0:j1, i % F.w]
    out, k = [], 0
    while k < len(col):
        if col[k]:
            m = k
            while m < len(col) and col[m]: m += 1
            if (m - k) * F.dr >= least: out.append((lo + k * F.dr, lo + m * F.dr))
            k = m
        else: k += 1
    return out


def way_points(F):
    """where the walk may go between rooms: a point by every opening of a partition between two rooms, one inside
    every doorway onto the Glide, and the Glide's own points every GLIDE_STEP metres. None stands in the plane of a
    wall or a door (a camera there is inside the wall, or the round Door's iris): the opening's point is 0.7 m into
    the room after it (or before it), the doorway's 0.9 m into the room"""
    rs = rooms(); out = []
    for a, b in zip(rs, rs[1:] + rs[:1]):
        bb = a["at"][1] % 360.0
        if abs(bb - b["at"][0] % 360.0) > 1e-6: continue
        for (r0, r1) in openings(F, bb, R_GL + 0.3, R_OUT - 0.3):
            r = (r0 + r1) / 2
            for side, room in ((1, b), (-1, a)):
                b_ = bb + side * 0.7 / (r * D)
                if F.clear(r, b_, 0.35): out.append(dict(r=r, b=b_ % 360.0, room=room["code"])); break
    j = int((R_GL - F.r0) / F.dr); row = F.free[j - 3:j + 4, :].all(axis=0)
    i = 0
    while i < F.w:
        if row[i]:
            k = i
            while k < F.w and row[k]: k += 1
            if (k - i) * F.db * D * R_GL > 0.9:
                bb = F.b0 + (i + k) / 2 * F.db; rm = next((r for r in rs if r["at"][0] <= bb < r["at"][1]), None)
                if rm and F.clear(R_GL + 0.9, bb, 0.35): out.append(dict(r=R_GL + 0.9, b=bb, room=rm["code"]))
            i = k
        else: i += 1
    n = int(2 * math.pi * GLIDE // GLIDE_STEP)
    for k in range(n):
        bb = (k + 0.5) * 360.0 / n
        if F.ok(GLIDE, bb): out.append(dict(r=GLIDE, b=bb, room="GL"))
    return out


def build():
    """the rooms' points, then the shortest ways between the groups they make that straight steps do not join"""
    F = Floor(); pts = room_points(F); ways = way_points(F)
    allp = pts + ways; P = [xy(p["r"], p["b"]) for p in allp]; n0 = len(pts)
    nbr = {i: [] for i in range(len(allp))}
    for i in range(len(allp)):
        for j in range(i + 1, len(allp)):
            d = math.dist(P[i], P[j])
            if d <= LINK and F.walkable(P[i], P[j]): nbr[i].append((j, d)); nbr[j].append((i, d))
    parent = list(range(len(allp)))
    def root(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i in range(n0):
        for j, _ in nbr[i]:
            if j < n0: parent[root(i)] = root(j)
    groups0 = len({root(i) for i in range(n0)}); used = set()
    while True:
        roots = sorted({root(i) for i in range(n0)})
        if len(roots) == 1: break
        joined = False
        for g in roots:
            if root(g) != g: continue
            # the shortest way from this group to a room point of another group
            dist = {i: 0.0 for i in range(n0) if root(i) == g}; prev = {}; pq = [(0.0, i) for i in dist]; heapq.heapify(pq); hit = None
            while pq:
                d, u = heapq.heappop(pq)
                if d > dist.get(u, 1e18): continue
                if u < n0 and root(u) != g: hit = u; break
                for v, w in nbr[u]:
                    if d + w < dist.get(v, 1e18): dist[v] = d + w; prev[v] = u; heapq.heappush(pq, (d + w, v))
            if hit is None: continue
            u = hit
            while True:
                if u >= n0: used.add(u)
                parent[root(u)] = root(g)
                if u not in prev: break
                u = prev[u]
            joined = True
        if not joined: break
    groups = len({root(i) for i in range(n0)})
    return F, finish(pts + [allp[i] for i in sorted(used)]), (groups0, groups)


RETIRED = set()                # numbers of points the plan had and no longer has (never given again)


def finish(pts):
    """number the points room by room round the ring; the scene that renders each; where each looks first. A point
    already in the plan keeps its number (its pictures may be rendered); a new one takes the room's next number"""
    prev = json.load(open(OUT)) if os.path.exists(OUT) else {}
    old = prev.get("points", []); retired = set(prev.get("retired", []))
    pts.sort(key=lambda p: (p["b"] % 360.0, p["r"])); used = set()
    for p in pts:
        x, y = xy(p["r"], p["b"])
        k = next((q["id"] for q in old if abs(q["x"] - x) < 0.05 and abs(q["y"] - y) < 0.05), None)
        if k and k.split(".")[0] == p["room"] and k not in used: p["id"] = k; used.add(k)
    # a number once given is never given again: a point that has gone may have its pictures rendered already
    RETIRED.update(retired | {q["id"] for q in old} - used)
    count = {}
    for k in used | RETIRED: room, n = k.rsplit(".", 1); count[room] = max(count.get(room, 0), int(n))
    for p in pts:
        if "id" not in p:
            count[p["room"]] = count.get(p["room"], 0) + 1; p["id"] = "%s.%d" % (p["room"], count[p["room"]])
        p["scene"] = scene_of(p["b"])
        x, y = xy(p["r"], p["b"]); p["x"], p["y"], p["z"] = round(x, 3), round(y, 3), 0.0
        tx, ty = xy(*p.pop("at")) if "at" in p else xy(R_OUT, p["b"])      # first towards the windows
        p["look"] = round(math.degrees(math.atan2(tx - x, ty - y)) % 360.0, 1)
        p["r"], p["b"] = round(p["r"], 3), round(p["b"] % 360.0, 4)
    return pts


def draw(F, pts, path, scale=0.25):
    """the points over the floor map: red the tour's stops, blue the ways between rooms, orange the rest"""
    im = Image.fromarray((F.free * 255).astype(np.uint8)).convert("RGB").resize((int(F.w * scale), int(F.h * scale * 2)))
    d = ImageDraw.Draw(im); rows = set(ROWS)
    for p in pts:
        i, j = F.ij(p["r"], p["b"]); x, y = i * scale, j * scale * 2
        way = p["room"] == "GL" or p["r"] <= R_GL + 0.01 or not (R_GL + 0.9 <= p["r"] <= R_OUT - 0.9)
        c = (220, 40, 40) if p.get("stop") else ((40, 90, 220) if way else (230, 140, 0))
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=c)
    im.save(path)


def main():
    F, pts, (g0, g1) = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    names = {r["code"]: r["name"] for r in rooms()}; names["GL"] = "The Glide"
    json.dump(dict(eye=EYE, link=LINK, rooms=names, scenes=SCENES, points=pts, retired=sorted(RETIRED)), open(OUT, "w"), indent=1)
    by = {}
    for p in pts: by[p["scene"]] = by.get(p["scene"], 0) + 1
    print("%d points by scene: %s" % (len(pts), ", ".join("%s %d" % kv for kv in by.items())))
    print("groups the rooms' points make: %d; with the ways between them: %d" % (g0, g1))
    if len(sys.argv) > 2 and sys.argv[1] == "map": draw(F, pts, sys.argv[2])


if __name__ == "__main__":
    main()
