"""Publish the whole-house renders (blend/overall.py) into the design plan:
  final/house/hero.jpg          -> palace/design/img/house-hero.jpg (homepage card, design plan) and frame 0 until the turn has it
  final/house/turn<i>of24.jpg   -> palace/design/img/house/f<ii>.jpg (the explorer's frames)
  final/house/whole.jpg         -> palace/design/img/house-whole.jpg (the same view, the ground left whole)
  final/house/spots.json        -> palace/design/img/house/spots.json, with "have": the frames published so far
  python3 pub_house.py"""
import json, os, sys
from PIL import Image


def _repo():
    """the mars-campus checkout: $MARS_REPO, or the first of the usual places that has it"""
    for p in (os.environ.get("MARS_REPO"), "/home/user/mars-campus", "/home/claude/mars-campus", os.path.expanduser("~/mars-campus"), os.getcwd()):
        if p and os.path.exists(os.path.join(p, "palace", "tools", "room_program.py")): return p
    sys.exit("set MARS_REPO to the mars-campus checkout")


HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, "final", "house")
DES = os.path.join(_repo(), "palace", "design"); DST = os.path.join(DES, "img", "house")
os.makedirs(DST, exist_ok=True)


def newer(a, b): return os.path.exists(a) and (not os.path.exists(b) or os.path.getmtime(a) > os.path.getmtime(b))


hero = os.path.join(SRC, "hero.jpg")
if newer(hero, os.path.join(DES, "img", "house-hero.jpg")):
    Image.open(hero).convert("RGB").save(os.path.join(DES, "img", "house-hero.jpg"), "JPEG", quality=87, optimize=True); print("hero")
if newer(os.path.join(SRC, "whole.jpg"), os.path.join(DES, "img", "house-whole.jpg")):
    Image.open(os.path.join(SRC, "whole.jpg")).convert("RGB").save(os.path.join(DES, "img", "house-whole.jpg"), "JPEG", quality=87, optimize=True); print("whole")
have = []
for i in range(24):
    s, d = os.path.join(SRC, "turn%dof24.jpg" % i), os.path.join(DST, "f%02d.jpg" % i)
    if os.path.exists(s):
        if newer(s, d): Image.open(s).convert("RGB").save(d, "JPEG", quality=82, optimize=True); print("frame", i)
        have.append(i)
    elif i == 0 and os.path.exists(hero):
        if newer(hero, d): Image.open(hero).convert("RGB").resize((1280, 720), Image.LANCZOS).save(d, "JPEG", quality=84, optimize=True); print("frame 0 from the hero")
        have.append(0)
    elif os.path.exists(d) and not os.path.exists(s):
        os.remove(d)                 # a stand-in from testing
sp = json.load(open(os.path.join(SRC, "spots.json"))); sp["have"] = have; sp["whole"] = os.path.exists(os.path.join(DES, "img", "house-whole.jpg"))
json.dump(sp, open(os.path.join(DST, "spots.json"), "w"), separators=(",", ":"))
print("frames published:", len(have))
