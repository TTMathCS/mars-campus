"""Publish the whole-house renders (blend/overall.py) into the design plan:
  final/house/hero.jpg          -> palace/design/img/house-hero.jpg (homepage card, design plan)
  final/house/whole.jpg         -> palace/design/img/house-whole.jpg (the same view, the ground left whole)
  final/house/turn<i>of72.jpg   -> palace/design/img/house/f<ii>.jpg (the explorer's frames, 5° apart)
  final/house/spots.json        -> palace/design/img/house/spots.json, with "have": the frames published
  python3 pub_house.py
The turntable has 72 frames (Jim, 2 Oct 2026: "the turnning is not smooth at all"). Frames go up only as an evenly
spaced set, so the turn never jumps: all 72, or else the 24 at every third frame (0, 3, … 69, the old 24 angles);
until the 24 are all rendered, the frames already published stay as they are."""
import json, os, sys
from PIL import Image


def _repo():
    """the mars-campus checkout: $MARS_REPO, or the first of the usual places that has it"""
    for p in (os.environ.get("MARS_REPO"), "/home/user/mars-campus", "/home/claude/mars-campus", os.path.expanduser("~/mars-campus"), os.getcwd()):
        if p and os.path.exists(os.path.join(p, "palace", "tools", "room_program.py")): return p
    sys.exit("set MARS_REPO to the mars-campus checkout")


N = 72
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, "..", "final", "house") if not os.path.isdir(os.path.join(HERE, "final")) else os.path.join(HERE, "final", "house")
DES = os.path.join(_repo(), "palace", "design"); DST = os.path.join(DES, "img", "house")
os.makedirs(DST, exist_ok=True)


def newer(a, b): return os.path.exists(a) and (not os.path.exists(b) or os.path.getmtime(a) > os.path.getmtime(b))


for name in ("hero", "whole"):
    s, d = os.path.join(SRC, name + ".jpg"), os.path.join(DES, "img", "house-%s.jpg" % name)
    if newer(s, d): Image.open(s).convert("RGB").save(d, "JPEG", quality=87, optimize=True); print(name)
done = [i for i in range(N) if os.path.exists(os.path.join(SRC, "turn%dof%d.jpg" % (i, N)))]
have = list(range(N)) if len(done) == N else list(range(0, N, 3)) if all(i in done for i in range(0, N, 3)) else None
spots = os.path.join(SRC, "spots.json")
if have is None or not os.path.exists(spots):
    print("frames: %d of %d rendered; the published frames stay until the 24 at every third frame are done" % (len(done), N)); sys.exit(0)
for i in have:
    s, d = os.path.join(SRC, "turn%dof%d.jpg" % (i, N)), os.path.join(DST, "f%02d.jpg" % i)
    if newer(s, d): Image.open(s).convert("RGB").save(d, "JPEG", quality=82, optimize=True); print("frame", i)
for f in os.listdir(DST):                      # frames of an older set (24 frames, 15° apart) that this set does not use
    if f.startswith("f") and f.endswith(".jpg") and int(f[1:3]) not in have: os.remove(os.path.join(DST, f)); print("removed", f)
sp = json.load(open(spots)); sp["have"] = have; sp["whole"] = os.path.exists(os.path.join(DES, "img", "house-whole.jpg"))
json.dump(sp, open(os.path.join(DST, "spots.json"), "w"), separators=(",", ":"))
print("frames published:", len(have), "of", N)
