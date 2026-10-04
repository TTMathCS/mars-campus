"""The photographs on the walls of the memory rooms (L1-14): places on Earth, cut from Poly Haven's 360° HDR skies
(CC0, as copied into three.js's examples; fetch_assets.py fetches them into assets/hdr/). Each is a perspective view
from the sphere, toned like a print, some in black and white or sepia.
  bvenv/bin/python blend/make_photos.py        -> assets/photos/photo_NN.jpg (needs bpy to read the HDR files)"""
import os, sys, math
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib

HDR = os.path.join(lib.ASSETS, "hdr"); OUT = os.path.join(lib.ASSETS, "photos")
# (source, heading, pitch, horizontal field of view, width, height, tone: colour/bw/sepia, exposure)
PHOTOS = [
    ("venice_sunset_1k", 34.5, 2.0, 55, 900, 600, "colour", 1.0),       # sunset over the lagoon
    ("venice_sunset_1k", 154.0, 6.0, 40, 600, 750, "colour", 1.1),      # a red villa on the waterfront
    ("venice_sunset_1k", -127.0, 3.0, 50, 900, 600, "sepia", 1.0),      # houses and pines along the shore
    ("san_giuseppe_bridge_2k", -74.5, -8.0, 60, 900, 600, "colour", 1.0),   # a canal in Venice, boats moored
    ("san_giuseppe_bridge_2k", -28.8, 5.0, 50, 900, 600, "bw", 1.0),        # a church on its square
    ("san_giuseppe_bridge_2k", 157.5, 2.0, 45, 600, 750, "colour", 1.0),    # coloured houses by the canal
    ("blouberg_sunrise_2_1k", -145.0, 2.0, 70, 900, 600, "colour", 1.2),    # a beach at sunrise
    ("spruit_sunrise_1k", 34.5, 1.0, 60, 900, 600, "colour", 0.9),          # a misty meadow at dawn
    ("spruit_sunrise_1k", -64.0, 2.0, 45, 900, 600, "sepia", 1.0),          # trees in the meadow
    ("pedestrian_overpass_1k", 87.0, 10.0, 70, 900, 600, "bw", 1.0),        # a cable bridge
    ("venice_sunset_1k", -81.6, -10.0, 55, 900, 600, "bw", 1.0),            # the promenade, benches
    ("san_giuseppe_bridge_2k", -100.0, -4.0, 40, 600, 750, "sepia", 1.0),   # a canal, closer
]


def load(name):
    import bpy
    im = bpy.data.images.load(os.path.join(HDR, name + ".hdr")); w, h = im.size
    return np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, :3]


def view(eq, heading, pitch, hfov, W, H):
    """a perspective picture from an equirectangular sphere: looking at heading (degrees from the picture's middle)
    and pitch, hfov across"""
    h, w, _ = eq.shape; t = math.tan(math.radians(hfov) / 2)
    xs = np.linspace(-t, t, W); ys = np.linspace(t * H / W, -t * H / W, H); X, Y = np.meshgrid(xs, ys)
    d = np.stack([X, np.ones_like(X), Y], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = math.radians(pitch); cy, sy = math.cos(p), math.sin(p)
    d = np.stack([d[..., 0], d[..., 1] * cy - d[..., 2] * sy, d[..., 1] * sy + d[..., 2] * cy], -1)
    a = math.radians(heading); ca, sa = math.cos(a), math.sin(a)
    d = np.stack([d[..., 0] * ca + d[..., 1] * sa, -d[..., 0] * sa + d[..., 1] * ca, d[..., 2]], -1)
    lon = np.arctan2(d[..., 0], d[..., 1]); lat = np.arcsin(np.clip(d[..., 2], -1, 1))
    u = (0.5 + lon / (2 * math.pi)) * w - 0.5; v = (0.5 - lat / math.pi) * h - 0.5
    u0 = np.floor(u).astype(int); v0 = np.clip(np.floor(v).astype(int), 0, h - 2); fu = (u - u0)[..., None]; fv = np.clip(v - v0, 0, 1)[..., None]
    u0 %= w; u1 = (u0 + 1) % w
    return (eq[v0, u0] * (1 - fu) * (1 - fv) + eq[v0, u1] * fu * (1 - fv) + eq[v0 + 1, u0] * (1 - fu) * fv + eq[v0 + 1, u1] * fu * fv)


def tone(a, tone_, ex):
    a = a * (0.2 / max(1e-4, float(np.median(a)))) * ex
    a = (a * (2.51 * a + 0.03)) / (a * (2.43 * a + 0.59) + 0.14)          # a filmic curve, as a print has
    a = np.clip(a, 0, 1) ** (1 / 2.2)
    if tone_ != "colour":
        l = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11)[..., None]
        a = l * (np.array([1.07, 0.99, 0.84]) if tone_ == "sepia" else np.array([1.0, 1.0, 1.0]))
        a = 0.06 + 0.9 * a                                                  # an old print's grey blacks
    return np.clip(a, 0, 1)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True); cache = {}
    for i, (src, hd, pt, fov, W, H, tn, ex) in enumerate(PHOTOS):
        if src not in cache: cache[src] = load(src)
        a = tone(view(cache[src], hd, pt, fov, W, H), tn, ex)
        Image.fromarray((a * 255).astype(np.uint8)).save(os.path.join(OUT, "photo_%02d.jpg" % i), quality=90)
        print("photo_%02d.jpg" % i, src, flush=True)
