import sys, math, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-claude-mars-campus/6a356f79-1d9e-5546-bb97-bc079952eafa/scratchpad/lay')
from model import hq, margin, vis
C = np.array([-69.33992, -102.800659]); F = np.array([0.5579449, 0.8298780]); Rt = np.array([F[1], -F[0]])
def P(lat, s): return C + Rt * lat + F * s
def latf(s): return 10.5 - 1.5 * ((s - 55.5) / 22.5) ** 2
def hF(s): return 4.3 + 2.9 * (78 - s) / 45
D = 8.6
# terrain under the wings
for sg in [1, -1]:
    print('wing', 'right' if sg > 0 else 'left')
    for s in range(34, 80, 4):
        gs = [float(hq(*P(sg * (latf(s) + u), s))) for u in [0, 1.5, 3, 4.5, 6]]
        print('  s %2d  latf %.1f  ground front..back %s' % (s, latf(s), ' '.join('%5.2f' % g for g in gs)))
# roof points for the hidden check (floor level = a per-wing value, roof relative to it)
def wing_pts(sg, yW):
    pts = []
    for s in np.linspace(33, 78, 46):
        for t in np.linspace(0, 1, 14):
            u = t * (D + 1.2) - 1.2; lat = sg * (latf(s) + u)
            y = yW + hF(s) * max(0, 1 - t ** 1.7) ** 0.75 + 0.45 * math.sin(math.pi * t)
            g = float(hq(*P(lat, s))); k = min(1, max(0, (y - yW) / 2)); yy = y * k + g * (1 - k) if y - yW < 2 else y
            p = P(lat, s); pts.append((p[0], yy, p[1]))
    return np.array(pts)
def gate_pts(y0, crown):
    pts = []
    for lat in np.linspace(-8.0, 8.0, 33):
        x = lat / 8.0; y = y0 + 4.3 + (crown - 4.3) * (1 - x * x) ** 0.8
        for s in [77.4, 78.6]:
            p = P(lat, s); pts.append((p[0], y + 0.3, p[1]))
    return np.array(pts)
for yW in [0.2]:
    for sg in [1, -1]:
        W = wing_pts(sg, yW); m = margin(0, 0, W); i = np.argmin(m); x, y, z = W[i]
        print('wing %+d yW %.1f min margin %.2f at az %.1f d %.1f y %.2f' % (sg, yW, m.min(), (math.degrees(math.atan2(x, -z)) + 360) % 360, math.hypot(x, z), y))
for crown in [5.4, 5.8, 6.2]:
    G = gate_pts(0.1, crown); m = margin(0, 0, G); i = np.argmin(m); x, y, z = G[i]
    print('gate crown %.1f: min margin %.2f at az %.1f d %.1f y %.2f' % (crown, m.min(), (math.degrees(math.atan2(x, -z)) + 360) % 360, math.hypot(x, z), y))
# elliptical craft orbit
