"""Scores the shots of flicker.py: for each view, how much the sign changes after a 2 cm step (B against A) beyond
what changes with no step at all (A2 against A). Numbers are the share of pixels whose brightness jumps by more than
8 % and the mean jump, in percent. Shimmer shows as a big share at a small step.
usage: python3 ttmath/tools/flicker_score.py [tag]   (needs numpy and Pillow)"""
import json, os, sys
import numpy as np
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
TAG = sys.argv[1] if len(sys.argv) > 1 else "now"
meta = json.load(open(os.path.join(OUT, "flk_%s.json" % TAG)))


def lum(p):
    a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) / 255.0
    return a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


for name in meta:
    a, a2, b = (lum(os.path.join(OUT, "flk_%s_%s_%s.png" % (TAG, name, s))) for s in ("a", "a2", "b"))
    h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1]); a, a2, b = a[:h, :w], a2[:h, :w], b[:h, :w]
    still, step = np.abs(a2 - a), np.abs(b - a)
    print("%-8s %4dx%-4d  still: %5.1f%% jumps, mean %4.2f%%   2 cm step: %5.1f%% jumps, mean %4.2f%%"
          % (name, w, h, 100 * (still > 0.08).mean(), 100 * still.mean(), 100 * (step > 0.08).mean(), 100 * step.mean()))
