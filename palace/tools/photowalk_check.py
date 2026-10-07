"""The Crown photo walk as rendered: where one can step from each point, decided as the page decides (pw.js
neighbours(): a point within REACH metres whose eye one sees at eye height, from the point's depth map), and whether
every rendered point can be reached from the Arrival hall's. Lists the points one cannot reach, and those with one
step only, so the plan (photowalk_plan.py) can be given a point between.
  python3 palace/tools/photowalk_check.py [palace/photowalk]"""
import json, math, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "photowalk"))
REACH, EYE, START = 11.5, 1.55, "C-04.2"


def fname(pid): return pid.lower().replace("-", "").replace(".", "_")


def depth(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.int32); q = a[..., 0] * 256 + a[..., 1]
    return np.where(q > 0, 0.25 * 65535 / np.maximum(q, 1), np.inf)


def look(dm, d):
    h, w = dm.shape; lon = math.atan2(d[0], d[1]); lat = math.asin(max(-1.0, min(1.0, d[2])))
    i = int(math.floor((lon / (2 * math.pi) + 0.5) * w)) % w; j = min(h - 1, max(0, int(math.floor((0.5 - lat / math.pi) * h))))
    return dm[j, i]


def main():
    plan = json.load(open(os.path.join(ROOT, "plan.json"))); ready = set()
    for m in ("a", "b"):
        f = os.path.join(ROOT, "v", "index_%s.json" % m)
        if os.path.exists(f): ready |= set(json.load(open(f))["ready"])
    pts = {p["id"]: p for p in plan["points"] if p["id"] in ready}
    D = {k: depth(os.path.join(ROOT, "v", fname(k) + "_d.png")) for k in pts}
    steps = {k: [] for k in pts}
    for a, P in pts.items():
        for b, Q in pts.items():
            if a == b: continue
            dx, dy = Q["x"] - P["x"], Q["y"] - P["y"]; dist = math.hypot(dx, dy)
            if dist > REACH or dist < 0.3: continue
            if look(D[a], (dx / dist, dy / dist, 0.0)) >= dist - 0.4: steps[a].append(b)
    seen, todo = set(), [START if START in pts else next(iter(pts), None)]
    while todo and todo[0] is not None:
        u = todo.pop()
        if u in seen: continue
        seen.add(u); todo += steps[u]
    lone = sorted(k for k in pts if k not in seen); one = sorted(k for k in pts if len(steps[k]) <= 1)
    print("%d points rendered; %d reached from %s; steps a point: %.1f on average" % (len(pts), len(seen), START, sum(map(len, steps.values())) / max(1, len(pts))))
    if lone: print("not reached:", ", ".join(lone))
    if one: print("one step or none:", ", ".join("%s (%s)" % (k, ",".join(steps[k]) or "-") for k in one))


if __name__ == "__main__":
    main()
