"""Draws ttmath/tools/data/envelope.json (from envelope.py) as a map, north up: how tall a building can be at each
spot and stay hidden from the start point, with the start, the ridge viewpoint and today's campus outlined.
usage: python3 ttmath/tools/envelope_map.py [out.png]   (needs numpy and Pillow)"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
E = json.load(open(os.path.join(HERE, "data", "envelope.json")))
dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "envelope_map.png")
AZ = np.array(E["az"], float); D = np.array(E["d"], float); HID = np.array(E["hidden"], float)
S, PX = 2.4, 1000                                  # pixels per metre; the map spans 1000 px, centred north-west of the start
CX, CZ = -150.0, -170.0                            # world point at the middle of the map (x east, z south)
img = Image.new("RGB", (PX, PX), (246, 244, 239)); dr = ImageDraw.Draw(img)


def to_px(x, z): return (PX / 2 + (x - CX) * S, PX / 2 + (z - CZ) * S)


def colour(h):
    if h < 0: return (226, 120, 104)                         # visible even at ground level
    stops = [(0, (246, 222, 170)), (4, (233, 214, 140)), (8, (182, 214, 152)), (14, (122, 186, 160)), (22, (86, 150, 170)), (34, (66, 104, 150)), (50, (48, 70, 120))]
    for (h0, c0), (h1, c1) in zip(stops, stops[1:]):
        if h <= h1:
            t = (h - h0) / (h1 - h0); return tuple(int(a + (b - a) * t) for a, b in zip(c0, c1))
    return stops[-1][1]


# the rays as wedges, sample by sample
for i, az in enumerate(AZ):
    for j in range(0, len(D) - 1, 2):
        d0, d1 = D[j], D[min(j + 2, len(D) - 1)]; h = HID[i, j]
        pts = []
        for a, d in ((az - 1, d0), (az + 1, d0), (az + 1, d1), (az - 1, d1)):
            r = math.radians(a); pts.append(to_px(math.sin(r) * d, -math.cos(r) * d))
        dr.polygon(pts, fill=colour(h))
# distance rings and bearings
for d in range(50, 400, 50):
    bb = [to_px(-d, -d), to_px(d, d)]; dr.ellipse([bb[0], bb[1]], outline=(150, 150, 150))
    p = to_px(math.sin(math.radians(300)) * d, -math.cos(math.radians(300)) * d); dr.text((p[0] + 3, p[1]), "%d m" % d, fill=(90, 90, 90))
for az in range(250, 410, 10):
    r = math.radians(az); a, b = to_px(0, 0), to_px(math.sin(r) * 360, -math.cos(r) * 360); dr.line([a, b], fill=(200, 200, 200))
    dr.text((b[0] - 10, b[1] - 10), "%d°" % (az % 360), fill=(110, 110, 110))
# today's campus: every sampled point of its buildings
def azpt(az, d): r = math.radians(az); return math.sin(r) * d, -math.cos(r) * d
for x, z in E.get("campus", []):
    p = to_px(x, z); dr.point(p, fill=(25, 25, 25))
sx, sz = azpt(313.5, 27.5); p = to_px(sx, sz); dr.rectangle([p[0] - 5, p[1] - 3, p[0] + 5, p[1] + 3], fill=(30, 30, 30))
p = to_px(0, 0); dr.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=(200, 40, 30)); dr.text((p[0] + 8, p[1] - 6), "start", fill=(160, 30, 20))
p = to_px(-5.2, -7.4); dr.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=(40, 40, 40)); dr.text((p[0] + 7, p[1] - 4), "ridge view", fill=(40, 40, 40))
# key
ky = 16
for h, lab in ((-1, "seen from the start"), (2, "hidden up to 2 m"), (6, "6 m"), (12, "12 m"), (20, "20 m"), (30, "30 m"), (45, "45 m and more")):
    dr.rectangle([16, ky, 34, ky + 14], fill=colour(h), outline=(120, 120, 120)); dr.text((40, ky + 1), lab, fill=(40, 40, 40)); ky += 20
dr.text((16, ky + 6), "North up. Black: today's campus.", fill=(40, 40, 40))
img.save(dst); print("wrote", dst)
