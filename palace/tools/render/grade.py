"""Grade a render as a photographer would, to the tones of the house's earlier pictures (hero, library, salon,
dining room): true blacks and a wide spread, instead of the lifted, low-contrast greys a scene with too much soft
fill light gives (Jim, 4 Oct 2026: "new ones are bit too bright and looks more not real").
One smooth, rising curve on all three channels maps the picture's 1st, 5th, 50th, 95th and 99.8th percentiles of
brightness to the targets of its kind; hue is kept.
  bvenv/bin/python blend/grade.py <day|night|pale> <src.jpg> <dst.jpg>
The earlier pictures measure, for brightness 0..1: 5th percentile 0.03 to 0.11, median 0.25 to 0.44, 95th 0.65 to
0.74 by day; the cinema, at night, 0.02, 0.10 and 0.28."""
import sys
import numpy as np
from PIL import Image

TARGETS = {          # brightness percentiles 1, 5, 50, 95, 99.8 -> where they should land
    "day": (0.015, 0.06, 0.31, 0.70, 0.93),
    "night": (0.008, 0.025, 0.14, 0.42, 0.85),
    "pale": (0.015, 0.07, 0.43, 0.78, 0.95),      # a room of pale walls and stone, mostly ceiling and floor in a 360
}


def monotone_curve(xs, ys, n=1024):
    """a smooth curve through the points that never falls (Fritsch-Carlson), sampled at n points over 0..1"""
    xs = np.asarray(xs, float); ys = np.asarray(ys, float); d = np.diff(ys) / np.diff(xs)
    m = np.concatenate([[d[0]], (d[:-1] + d[1:]) / 2, [d[-1]]])
    for k in range(len(d)):
        if d[k] == 0: m[k] = m[k + 1] = 0.0; continue
        a, b = m[k] / d[k], m[k + 1] / d[k]
        if a * a + b * b > 9: t = 3 / np.hypot(a, b); m[k] = t * a * d[k]; m[k + 1] = t * b * d[k]
    t = np.linspace(0, 1, n); out = np.empty(n)
    for i, x in enumerate(t):
        k = min(max(np.searchsorted(xs, x) - 1, 0), len(d) - 1); h = xs[k + 1] - xs[k]; s = (x - xs[k]) / h
        h00, h10, h01, h11 = 2 * s ** 3 - 3 * s ** 2 + 1, s ** 3 - 2 * s ** 2 + s, -2 * s ** 3 + 3 * s ** 2, s ** 3 - s ** 2
        out[i] = h00 * ys[k] + h10 * h * m[k] + h01 * ys[k + 1] + h11 * h * m[k + 1]
    return t, np.clip(out, 0, 1)


def grade(img, kind):
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    lum = a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722
    src = np.percentile(lum, [1, 5, 50, 95, 99.8]); dst = TARGETS[kind]
    xs = [0.0] + list(src) + [1.0]; ys = [0.0] + list(dst) + [1.0]
    keep = [0] + [i for i in range(1, len(xs)) if xs[i] > xs[i - 1] + 1e-3]       # drop percentiles that coincide
    xs = [xs[i] for i in keep]; ys = [ys[i] for i in keep]
    t, c = monotone_curve(xs, ys)
    new = np.interp(lum, t, c)
    ratio = np.where(lum > 1e-4, new / np.maximum(lum, 1e-4), 0.0)[..., None]      # scale the colour, keep its hue
    out = np.clip(a * ratio, 0, 1)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8)), src, dst


if __name__ == "__main__":
    kind, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    im, s, d = grade(Image.open(src), kind)
    im.save(dst, "JPEG", quality=95)
    print("graded", src, "->", dst, "percentiles", " ".join("%.2f>%.2f" % (x, y) for x, y in zip(s, d)))
