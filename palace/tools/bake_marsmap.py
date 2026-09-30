"""Bake the simplified Mars map that the design book's map figures show underneath the real imagery.
The map is the same procedural stand-in the Mars Atlas draws before the real NASA imagery arrives
(fallbackMaps() in palace/design/atlas/atlas.js), built from known features: the northern lowlands,
Tharsis and its volcanoes, Valles Marineris, Hellas, Argyre, Utopia, the dark albedo regions and the caps.
It shows only where the real tiles can't be reached (offline, or the tile service is down).
usage: python3 palace/tools/bake_globe.py
writes palace/design/img/mars-map.jpg (2048 x 1024, equirectangular, 0 to 360 E)"""
import os, numpy as np
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.normpath(os.path.join(TOOLS, "..", "design", "img"))
D = np.pi / 180
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def hsh(x, y): s = np.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - np.floor(s)
def vn(x, y):
    ix, iy = np.floor(x), np.floor(y); fx, fy = x - ix, y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    return lerp(lerp(hsh(ix, iy), hsh(ix + 1, iy), fx), lerp(hsh(ix, iy + 1), hsh(ix + 1, iy + 1), fx), fy)
def fbm(x, y): return vn(x, y) * 0.5 + vn(x * 2.1, y * 2.1) * 0.25 + vn(x * 4.3, y * 4.3) * 0.125 + vn(x * 8.7, y * 8.7) * 0.0625
def gd(lat, lon, la, lo, s):
    dl = lat - la; dg = ((lon - lo + 540) % 360) - 180; dg = dg * np.cos(lat * D); return np.exp(-(dl * dl + dg * dg) / (2 * s * s))
HILLS = [[18.65, 226.2, 20, 3.2], [11.9, 255.9, 14, 2.2], [1.5, 247, 11, 1.9], [-8.3, 239.9, 14, 2.1], [40.5, 250.4, 4.5, 6], [24.8, 146.9, 9, 2.6], [8.4, 69.5, 1.5, 7], [-9.3, 174.4, 3.5, 1.5]]
BASINS = [[-42.4, 70.5, -7.5, 13], [-49.7, 316, -3.5, 9], [12.9, 87, -2.5, 7], [46.7, 117.5, -1.5, 16]]
DARKS = [[9, 69, 7, 0.85], [-6, 350, 9, 0.6], [-8, 15, 9, 0.6], [-8, 40, 8, 0.55], [-20, 102, 10, 0.55], [-24, 146, 11, 0.6], [-30, 205, 10, 0.55], [-24, 322, 12, 0.45], [-27, 272, 5, 0.45], [-14, 311, 5, 0.45], [46, 330, 11, 0.75], [44, 110, 9, 0.35], [68, 150, 10, 0.3], [67, 280, 10, 0.35], [-60, 60, 12, 0.3]]
BRIGHTS = [[3, 245, 22, 0.35], [20, 8, 18, 0.4], [26, 150, 12, 0.3], [-42, 70, 12, 0.35], [30, 195, 18, 0.3], [45, 185, 14, 0.15]]
def fields(lat, lonE):
    bnd = 17 + 16 * np.cos((lonE - 12) * D) + 6 * np.sin(lonE * 3 * D)
    tb = smooth(bnd - 5, bnd + 5, lat)
    h = lerp(1.5 + 0.7 * fbm(lonE / 20, lat / 20), -4.1 + 0.5 * fbm(lonE / 30, lat / 30), tb)
    h = h + 6.5 * gd(lat, lonE, 0, 250, 20)
    for v in HILLS: h = h + v[2] * gd(lat, lonE, v[0], v[1], v[3])
    for v in BASINS: h = h + v[2] * gd(lat, lonE, v[0], v[1], v[3])
    vc = -9 - 5 * np.sin((lonE - 258) / 64 * np.pi) * 0.6 - np.where(lonE > 300, (lonE - 300) * 0.12, 0)
    vm = (lonE > 258) & (lonE < 322)
    h = h - np.where(vm, 5.5 * np.exp(-((lat - vc) / 1.1) ** 2) * smooth(258, 266, lonE) * (1 - smooth(310, 322, lonE)), 0)
    cx, cy = lonE / 4.5, (lat + 90) / 4.5; fx, fy = np.floor(cx), np.floor(cy)
    for q in (-1, 0, 1):
        for r in (-1, 0, 1):
            gx, gy = fx + q, fy + r; rr = hsh(gx, gy)
            ox, oy = gx + hsh(gx + 7, gy), gy + hsh(gx, gy + 3)
            dd = np.hypot((cx - ox) * np.cos(lat * D), cy - oy) / (0.15 + 0.5 * hsh(gx + 1, gy + 2))
            add = np.where(dd < 1, -0.9 * (1 - dd * dd), 0.35 * (1.4 - dd) / 0.4 * (dd - 1) / 0.4 * 4) * (1 - tb * 0.8)
            h = h + np.where((rr >= 0.62) & (dd < 1.4), add * 0.4, 0)
    a = 0.62 + 0.12 * (fbm(lonE / 9, lat / 9) - 0.5)
    for v in DARKS: a = a - v[3] * 0.42 * gd(lat, lonE, v[0], v[1], v[2]) * (0.7 + 0.6 * fbm(lonE / 6 + v[0], lat / 6))
    for v in BRIGHTS: a = a + v[3] * 0.3 * gd(lat, lonE, v[0], v[1], v[2])
    cap = np.where(lat > 0, smooth(78, 84, lat + 3 * (fbm(lonE / 10, 3) - 0.5)), smooth(79, 85, -lat + 5 * np.cos((lonE - 315) * D) + 3 * (fbm(lonE / 10, 7) - 0.5)))
    return h, np.clip(a, 0.15, 1) * (1 - cap) + 2 * cap
def colour(h, alb, sh):
    rgb = np.stack([lerp(92, 205, alb), lerp(62, 132, alb), lerp(48, 88, alb)], -1)
    ice = alb > 1.5; rgb[ice] = [236, 232, 226]
    return np.clip(rgb * sh[..., None], 0, 255)
def main():
    os.makedirs(IMG, exist_ok=True)
    # equirectangular map, 0..360 E, with hill shading from the north-west
    W, H = 2048, 1024
    j, i = np.mgrid[0:H, 0:W].astype(float)
    lat = 90 - (j + 0.5) / H * 180; lonE = (i + 0.5) / W * 360
    h, alb = fields(lat, lonE)
    hx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * (W / 1024); hy = (np.vstack([h[1:], h[-1:]]) - np.vstack([h[:1], h[:-1]])) * (H / 512)
    sh = np.clip(1 + (-hx * 0.8 + hy * 0.8) * 0.35, 0.55, 1.45)
    sh = np.where(alb > 1.5, 1 + (sh - 1) * 0.25, sh)
    Image.fromarray(colour(h, alb, sh).astype(np.uint8)).save(os.path.join(IMG, "mars-map.jpg"), quality=84, optimize=True, progressive=True)
    for f in ("mars-map.jpg",): print(f, os.path.getsize(os.path.join(IMG, f)) // 1024, "KB")
main()
