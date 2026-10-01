"""Re-render only a few regions of a finished 360 (same scene, same seed, so the noise matches) and blend them in.
  bvenv/bin/python blend/patch.py <stop> <in.jpg> <out.jpg> x0,y0,x1,y1 [x0,y0,x1,y1 ...]   (pixels of the 4096 x 2048 image)"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, lib, family, pano
from PIL import Image, ImageFilter

stop, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
boxes = [tuple(int(v) for v in a.split(",")) for a in sys.argv[4:]]
W, H, SPP = 4096, 2048, 32
t = time.time(); family.build(with_suite=False); print("built in %.1f s" % (time.time() - t), flush=True)
sc = bpy.context.scene
lib.photo_finish(glow=0.25, vignette=0.0)
x, y, z = pano.STOPS[stop]; lib.camera("pano " + stop, (x, y, z + pano.EYE), yaw_deg=0.0, pano=True)
sc.render.use_border = True; sc.render.use_crop_to_border = True
base = Image.open(src).convert("RGB")
for i, (x0, y0, x1, y1) in enumerate(boxes):
    sc.render.border_min_x, sc.render.border_max_x = x0 / W, x1 / W
    sc.render.border_min_y, sc.render.border_max_y = 1 - y1 / H, 1 - y0 / H          # Blender counts y from the bottom
    sc.render.image_settings.file_format = "PNG"
    path = os.path.abspath("blend/patch_%s_%d.png" % (stop, i))
    t = time.time(); lib.render(path, (W, H), SPP, exposure=-0.05 + pano.EXPOSURE.get(stop, 0.0)); print("patch", i, "in %.1f s" % (time.time() - t), flush=True)
    p = Image.open(path).convert("RGB"); pw, ph = p.size
    # a mask that is 1 inside and fades to 0 over the 40 px next to the patch's edges (where the denoiser saw less)
    m = Image.new("L", (pw, ph), 0); inner = Image.new("L", (pw - 120, ph - 120), 255); m.paste(inner, (60, 60)); m = m.filter(ImageFilter.GaussianBlur(14))
    for (ex, cond) in ((0, x0 == 0), (1, x1 == W), (2, y0 == 0), (3, y1 == H)):      # no fade where the patch meets the image's own edge
        if not cond: continue
        px = m.load()
        for yy in range(ph):
            for xx in range(pw):
                if ex == 0 and xx < 80: px[xx, yy] = px[80, yy]
                if ex == 1 and xx >= pw - 80: px[xx, yy] = px[pw - 81, yy]
                if ex == 2 and yy < 80: px[xx, yy] = px[xx, 80]
                if ex == 3 and yy >= ph - 80: px[xx, yy] = px[xx, ph - 81]
    base.paste(p, (x0, y0), m)
base.save(dst, "JPEG", quality=95)
print("wrote", dst, flush=True)
