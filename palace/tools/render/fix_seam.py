"""Fill the black last column of 360s rendered before lib.render_pano filled it itself.
  python3 fix_seam.py <file.jpg> ... (in place; skips files whose last column is not dark)"""
import sys
from PIL import Image
def colmean(im, c):
    W, H = im.size; g = im.convert("L"); return sum(g.getpixel((c, y)) for y in range(0, H, 8)) / len(range(0, H, 8))
for f in sys.argv[1:]:
    im = Image.open(f).convert("RGB"); W, H = im.size
    last, prev = colmean(im, W - 1), colmean(im, W - 2)
    if last > 0.6 * prev: print("ok", f, round(last, 1), round(prev, 1)); continue
    im.paste(Image.blend(im.crop((W - 2, 0, W - 1, H)), im.crop((0, 0, 1, H)), 0.5), (W - 1, 0))
    im.save(f, "JPEG", quality=86 if "/palace/" in f else 93, optimize=True, progressive="/palace/" in f)
    print("fixed", f, round(last, 1), "->", round(colmean(im, W - 1), 1))
