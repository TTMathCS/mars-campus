"""Quick look at the far ends of the music room and the dining room."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, family
t = time.time(); family.build(with_suite=False); print("built in %.1f s" % (time.time() - t), flush=True)
W, H, SPP = (int(a) for a in (sys.argv[1:4] if len(sys.argv) > 3 else (960, 540, 24)))
for name, loc, tgt in (("music_end", (-12.6, 6.0, 1.5), (-19.5, 12.4, 1.2)), ("bar", (11.8, 7.2, 1.5), (19.0, 12.4, 1.3))):
    lib.camera(name, loc, tgt, lens=20); lib.photo_finish(0.3, 0.15)
    t = time.time(); lib.render(os.path.abspath("prev_%s.jpg" % name), (W, H), SPP, exposure=-0.05); print("rendered", name, "%.0f s" % (time.time() - t), flush=True)
