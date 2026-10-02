"""360° renders for the tour: equirectangular, their middle looking along +y of the family room's frame.

  bvenv/bin/python blend/pano.py <stop[,stop...]> <outdir> [width samples exposure]"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, family

EYE = 1.55
EXPOSURE = {"terrace": -0.7, "bridge": -1.0, "court": -0.6, "bedroom": 0.6, "bath": 0.5, "garden": -0.2}       # as a photographer would set it, stop by stop
STOPS = {
    "fire":    (0.8, 11.3, 0.0),
    "piano":   (-11.2, 6.2, 0.0),
    "table":   (9.4, 9.8, 0.0),
    "glass":   (2.6, 1.1, 0.0),
    "terrace": (0.0, -1.9, -0.02),
    "bridge":  (0.0, -11.0, -0.02),
    "court":   (0.0, -35.6, -44.05),
    "street":  (0.0, 16.1, 0.0),
    "garden":  (2.17, 21.6, 0.05),
    "bedroom": (10.4, 23.4, 0.0),
    "bath":    (-11.6, 23.4, 0.0),
}

if __name__ == "__main__":
    args = sys.argv[1:]
    names = args[0].split(","); out = args[1]; w = int(args[2]) if len(args) > 2 else 1024; spp = int(args[3]) if len(args) > 3 else 16; ex = float(args[4]) if len(args) > 4 else -0.05
    os.makedirs(out, exist_ok=True)
    t = time.time(); family.build(); print("built in %.1f s" % (time.time() - t), flush=True)
    for n in names:
        x, y, z = STOPS[n]
        lib.camera("pano " + n, (x, y, z + EYE), yaw_deg=0.0, pano=True)
        t = time.time(); lib.render(os.path.abspath(os.path.join(out, n + ".jpg")), (w, w // 2), spp, exposure=ex + EXPOSURE.get(n, 0.0)); print("rendered", n, "in %.1f s" % (time.time() - t), flush=True)
