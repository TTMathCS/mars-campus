"""Publish a finished render into the tour.
  python3 pub.py pano <src.jpg> <stop id>          -> palace/tour/pano/<id>.jpg, and the stop is no longer hidden
  python3 pub.py photo <src.jpg> <name> <caption>  -> palace/tour/photos/<name>.jpg, added to TOUR_PHOTOS"""
import os, re, sys, json
from PIL import Image


def _repo():
    """the mars-campus checkout: $MARS_REPO, or the first of the usual places that has it"""
    for p in (os.environ.get("MARS_REPO"), "/home/user/mars-campus", "/home/claude/mars-campus", os.path.expanduser("~/mars-campus"), os.getcwd()):
        if p and os.path.exists(os.path.join(p, "palace", "tools", "room_program.py")): return p
    sys.exit("set MARS_REPO to the mars-campus checkout")


TOUR = os.path.join(_repo(), "palace", "tour"); STOPS = os.path.join(TOUR, "stops.js")
kind, src, name = sys.argv[1], sys.argv[2], sys.argv[3]
if kind == "pano":
    dst = os.path.join(TOUR, "pano", name + ".jpg"); Image.open(src).convert("RGB").save(dst, "JPEG", quality=86, optimize=True, progressive=True)
    s = open(STOPS).read(); lines = s.split("\n")
    for i, l in enumerate(lines):
        if l.lstrip().startswith('{ id: "%s",' % name) and " name: " in l: lines[i] = l.replace("ready: false, ", "", 1); break      # a stop, not a link to it
    s2 = "\n".join(lines)
    if s2 == s and ('id: "%s"' % name) not in s: sys.exit("no stop " + name)
    open(STOPS, "w").write(s2); print("pano", name, os.path.getsize(dst) // 1024, "KB", "(was hidden)" if s2 != s else "(already shown)")
else:
    cap = sys.argv[4]; dst = os.path.join(TOUR, "photos", name + ".jpg"); Image.open(src).convert("RGB").save(dst, "JPEG", quality=86, optimize=True, progressive=True)
    s = open(STOPS).read()
    if ('photos/%s.jpg' % name) not in s:
        i = s.rindex("\n];"); s = s[:i] + ',\n  { img: "photos/%s.jpg", caption: %s }' % (name, json.dumps(cap)) + s[i:]
        open(STOPS, "w").write(s)
    print("photo", name, os.path.getsize(dst) // 1024, "KB")
