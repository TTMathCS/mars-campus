"""Quick look at the master suite down (suite2.py): the bedroom, the garden, the bath."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import suite2; sys.modules["suite"] = suite2
import lib, family
W, H, SPP = (int(a) for a in (sys.argv[1:4] if len(sys.argv) > 3 else (800, 450, 16)))
names = sys.argv[4].split(",") if len(sys.argv) > 4 else ["s_bedroom", "s_garden", "s_bath", "s_garden2"]
t = time.time(); family.build(hedges=False, far=False, with_suite=True); print("built in %.1f s" % (time.time() - t), flush=True)
CAMS = {"s_bedroom": ((8.0, 20.3, 1.5), (15.0, 24.8, 1.2), 19), "s_garden": ((8.2, 21.6, 1.5), (-3.0, 27.5, 0.7), 18),
        "s_bath": ((-8.0, 20.8, 1.5), (-15.2, 25.2, 1.3), 19), "s_garden2": ((2.6, 20.3, 1.5), (-2.4, 28.4, 1.0), 18)}
for n in names:
    loc, tgt, lens = CAMS[n]; lib.camera(n, loc, tgt, lens=lens); lib.photo_finish(0.3, 0.15)
    t = time.time(); lib.render(os.path.abspath("prev_%s.jpg" % n), (W, H), SPP, exposure=0.0); print("rendered", n, "%.0f s" % (time.time() - t), flush=True)
