"""Where each room is: the plan sheet of its level with the room shaded, cropped round its part of the house.
  python plan_maps.py [test]   -> palace/design/img/plan/<id>.jpg"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont
REPO = "/home/user/mars-campus/palace"; OUT = os.path.join(REPO, "design/img/plan")
L1 = dict(sheet="a301-pentagon-L1", c=(856.0, 640.5), s=4.04)          # pixels of the portal column, pixels a metre
CR = dict(sheet="a201-crown-main-floor", c=(850.5, 640.3), s=2.92)
HW0, HW1, DEP, APA = 14.4, 24.5, 13.9, 24.09
def half_w(y): return HW0 + (HW1 - HW0) * y / DEP
def l1_pt(sector, x, y):
    """a point in a room's frame on L1 (x along its glass, y from the glass outwards) in sheet pixels; sector 1 is
    Jim's residence (its rooms face south-east on the sheet), then clockwise: 2 club, 3 baths, 4 library, 5 guests"""
    a = math.radians(36 + 72 * (sector - 1)); n = (math.cos(a), math.sin(a)); t = (math.cos(a + math.pi / 2), math.sin(a + math.pi / 2))
    d = APA + y; return (L1["c"][0] + L1["s"] * (d * n[0] + x * t[0]), L1["c"][1] + L1["s"] * (d * n[1] + x * t[1]))
def cr_pt(r, b):
    return (CR["c"][0] + CR["s"] * r * math.sin(math.radians(b)), CR["c"][1] - CR["s"] * r * math.cos(math.radians(b)))
def ring_poly(r0, r1, b0, b1):
    n = max(2, int((b1 - b0) * 2)); bs = [b0 + (b1 - b0) * i / n for i in range(n + 1)]
    return [cr_pt(r1, b) for b in bs] + [cr_pt(r0, b) for b in reversed(bs)]
def trap(sector, x0, x1, y0, y1, follow=True):
    """a room in ring A or B: x0..x1 along it, y0..y1 out from the glass; the ends follow the sector's sides"""
    def cx(x, y): return max(-half_w(y), min(half_w(y), x)) if follow else x
    return [l1_pt(sector, cx(x0, y0), y0), l1_pt(sector, cx(x1, y0), y0), l1_pt(sector, cx(x1, y1), y1), l1_pt(sector, cx(x0, y1), y1)]
def draw(sheet, polys, out, focus, label=None, size=(1000, 700)):
    im = Image.open(os.path.join(REPO, "docs/img/plans/%s.png" % sheet)).convert("RGB")
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for p in polys: d.polygon(p, fill=(232, 98, 40, 105), outline=(200, 70, 20, 255), width=4)
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    fx, fy = focus; w, h = size; x0 = int(max(0, min(im.width - w, fx - w / 2))); y0 = int(max(0, min(im.height - h, fy - h / 2)))
    im.crop((x0, y0, x0 + w, y0 + h)).save(out, "JPEG", quality=88); print("wrote", out)
def centroid(polys):
    pts = [p for poly in polys for p in poly]; return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
SUITE = (-15.65, 15.65, 18.12, 31.92)
L1_ROOMS = {
    "family": [trap(1, -8.0, 8.0, 0.0, DEP)], "music": [trap(1, -30, -8.0, 0.0, DEP)], "dining": [trap(1, 8.0, 30, 0.0, DEP)],
    "residence": [trap(1, -30, 30, 0.0, DEP), trap(1, SUITE[0], SUITE[1], SUITE[2], SUITE[3], False)],
    "suite": [trap(1, SUITE[0], SUITE[1], SUITE[2], SUITE[3], False)],
    "atrium": [trap(2, -30, 30, 0.0, DEP), trap(3, -30, 30, 0.0, DEP), trap(4, -30, 30, 0.0, DEP), trap(5, -30, 30, 0.0, DEP)],
    "library": [trap(4, -30, 30, 0.0, DEP)], "baths": [trap(3, -30, 30, 0.0, DEP)], "cinema": [trap(2, -30, 30, 0.0, DEP)], "guests": [trap(5, -30, 30, 0.0, DEP)],
}
CR_ROOMS = {   # bearings from the Crown page (palace/crown/index.html); the rooms lie between the Glide and the outer wall
    "arrival": [ring_poly(128.5, 135, 72, 108)], "suite_up": [ring_poly(128.5, 135, 108, 144)], "salon": [ring_poly(128.5, 135, 144, 180)],
    "wellness": [ring_poly(128.5, 135, 180, 216)], "dining_up": [ring_poly(128.5, 135, 216, 252)], "sunset": [ring_poly(128.5, 135, 252, 288)],
    "library_up": [ring_poly(128.5, 135, 288, 324)], "studio": [ring_poly(128.5, 135, 324, 360)], "observatory": [ring_poly(128.5, 135, 0, 36)], "garden_room": [ring_poly(128.5, 135, 36, 72)],
}
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, polys in L1_ROOMS.items(): draw(L1["sheet"], polys, os.path.join(OUT, "l1-%s.jpg" % k), centroid(polys) if k != "atrium" else L1["c"], size=(1000, 700) if k != "atrium" else (1300, 1100))
    for k, polys in CR_ROOMS.items(): draw(CR["sheet"], polys, os.path.join(OUT, "crown-%s.jpg" % k), centroid(polys))
