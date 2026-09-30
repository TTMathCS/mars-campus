"""Line-of-sight check: the campus must stay hidden behind the ridge from the start point.
Run shot.py with --sample first (it writes campus_pts.json), then: python3 ttmath/tools/hidden.py
Margins are metres of terrain between the eye and each campus point; below 0 means visible."""
import sys, os, json, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lay"))
from model import margin, vis, hq
P = np.array(json.load(open(os.path.join(HERE, "campus_pts.json"))), float)
print("points", len(P))
m = margin(0, 0, P)
order = np.argsort(m)
print("min margin from the start: %.2f  (points with margin < 0.5: %d, < 0: %d)" % (m.min(), (m < 0.5).sum(), (m < 0).sum()))
for i in order[:12]:
    x, y, z = P[i]; az = (math.degrees(math.atan2(x, -z)) + 360) % 360; d = math.hypot(x, z)
    print("  margin %.2f at az %.1f d %.1f y %.2f (ground %.2f)" % (m[i], az, d, y, float(hq(x, z))))
for dd in [2, 3, 4, 5, 6, 7, 9]:
    a = math.radians(325); f = vis(math.sin(a) * dd, -math.cos(a) * dd, P)
    print("walk %d m toward 325 -> visible %.2f" % (dd, f.mean()))
