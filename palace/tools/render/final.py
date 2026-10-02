"""Build the house once and render a list of jobs: stills (a camera name in family.CAMS) and 360s (pano:<stop>).
Jobs whose output already exists are skipped, so the queue can simply be started again after an interruption.
  bvenv/bin/python blend/final.py <job[,job...]> <outdir> [still_w still_h still_spp pano_w pano_spp]"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, family, pano

args = sys.argv[1:]
jobs = args[0].split(","); out = args[1]
sw, sh, sspp, pw, pspp = (int(a) for a in (args[2:7] if len(args) >= 7 else (1600, 900, 128, 4096, 32)))
os.makedirs(out, exist_ok=True)
def target(j): return os.path.abspath(os.path.join(out, ("pano_" + j[5:]) if j.startswith("pano:") else ("plan_" + j[5:]) if j.startswith("plan:") else j) + ".jpg")
todo = [j for j in jobs if not os.path.exists(target(j))]
print("to render:", todo, flush=True)
if todo:
    t = time.time(); family.build(); print("built in %.1f s" % (time.time() - t), flush=True)
for j in todo:
    t = time.time(); tmp = target(j).replace(".jpg", ".part.jpg")
    if j.startswith("plan:"):                      # a floor plan from above: it hides the ceilings, so it goes last
        import plan_render; size = plan_render.setup(j[5:]); lib.render(tmp, size, 64, exposure=0.3)
        os.replace(tmp, target(j)); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
    if j.startswith("pano:"):
        n = j[5:]; x, y, z = pano.STOPS[n]
        lib.photo_finish(glow=0.25, vignette=0.0)
        lib.camera("pano " + n, (x, y, z + pano.EYE), yaw_deg=0.0, pano=True)
        lib.render_pano(target(j), pw, pspp, exposure=-0.05 + pano.EXPOSURE.get(n, 0.0))
        print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
    else:
        c = family.CAMS[j]
        lib.photo_finish(glow=0.3, vignette=0.15)
        lib.camera(j, c["loc"], c["target"], lens=c["lens"], shift_y=c["shift_y"])
        lib.render(tmp, (sw, sh), sspp, exposure=c.get("exposure", -0.05))
    os.replace(tmp, target(j))                     # only a finished picture gets the real name
    print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
