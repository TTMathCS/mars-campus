"""Floor plans Rev G: draws every plan from the room program (room_program.py) and writes the plan pages.
  python3 palace/tools/draw_plans.py
Writes palace/plans/: the SVG plans (svg/), one page per sheet, per Crown part and per L1 sector, the pairs and the
index of every code, and rooms.json; and short summaries in palace/docs/plans/. Rev G was approved by Jim on 2 Oct 2026,
with the Orb of Rev F (48 m across, five rooms on each floor between two lanes).
Geometry: the Pentagon's rings and sectors as in chapter 03 (160 m sides, an atrium of 35 m sides, rings 14 m deep with
4 m streets, avenues 5 m wide); the Crown's ring as in the render scenes (rooms between radii 128.5 and 135 m, the
Glide between 125 and 128.5 m)."""
import html, json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import room_program as P

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "palace", "plans"); SVG = os.path.join(OUT, "svg"); DOCS = os.path.join(REPO, "palace", "docs", "plans")
D = math.pi / 180
T36, C36, S36 = math.tan(36 * D), math.cos(36 * D), math.sin(36 * D)
R = 160 / (2 * S36); AP = R * C36; RA = 35 / (2 * S36); APA = RA * C36; RING = (AP - APA - 16) / 5; AVE = 5.0
R_IN, R_GL, R_OUT, R_SHELL0, R_SHELL1 = 125.0, 128.5, 135.0, 122.0, 138.0
ORB_R, ORB_SHELL, ORB_HALL, LANE = 24.0, 2.0, 12.0, 2.4      # the Orb: its radius, its shell, the Gate's round space, a lane
E = html.escape
KIND = {  # fill, label
    "living": ("#E9D8BC", "Living"), "sleep": ("#D5E0EC", "Sleeping"), "food": ("#F0D9A6", "Dining and kitchens"),
    "culture": ("#DCE7CF", "Library, music, art"), "wellness": ("#CFE8E4", "Baths and sport"), "guest": ("#E3D9EE", "Guests"),
    "work": ("#E8DDD3", "Work and making"), "service": ("#E3E1DC", "Stores and services"), "garden": ("#C9E0B5", "Gardens"),
    "tech": ("#D9DDE1", "Machines"), "move": ("#F1E7DA", "Arrival and transit"),
}
FONT = "Helvetica, Arial, sans-serif"


# ------------------------------------------------------------------------------------------------ geometry
def ring_v(r):
    k = "ABCDE".index(r); a0 = APA + k * (RING + 4); return a0, a0 + RING


def half(v): return v * T36 - (AVE / 2) / C36


def sector_c(k): return 126 + 72 * (k - 1)


def world(k, u, v):
    c = sector_c(k) * D; return (v * math.sin(c) + u * math.cos(c), v * math.cos(c) - u * math.sin(c))


def room_local(rm):
    """the room's outline in its sector's frame: u along the ring (clockwise), v outwards"""
    at = rm["at"]; r, k = at[0], at[1]
    u0 = at[2] if len(at) > 2 else None; u1 = at[3] if len(at) > 3 else None
    f0 = at[4] if len(at) > 4 else 0.0; f1 = at[5] if len(at) > 5 else 1.0
    if rm.get("rings"): va, vb = ring_v(rm["rings"][0])[0], ring_v(rm["rings"][1])[1]
    else: va, vb = ring_v(r)
    v0, v1 = va + (vb - va) * f0, va + (vb - va) * f1
    lo = lambda v: -half(v) if u0 is None else max(-half(v), u0)
    hi = lambda v: half(v) if u1 is None else min(half(v), u1)
    return k, [(lo(v0), v0), (hi(v0), v0), (hi(v1), v1), (lo(v1), v1)]


def area(pts):
    return abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2


def crown_area(b0, b1, r0=R_GL, r1=R_OUT): return (((b1 - b0) % 360) or 360) * D / 2 * (r1 * r1 - r0 * r0)


def bearing_pt(b, r): return (r * math.sin(b * D), r * math.cos(b * D))


def orb_floor_r(fl): return math.sqrt((ORB_R - ORB_SHELL) ** 2 - (fl - 72.0) ** 2)     # the inside of the shell at a floor


def orb_rooms_r(fl): return ORB_HALL + LANE, orb_floor_r(fl) - LANE                      # the rooms, between the lanes


def orb_gap(r): return LANE / r / D                                                     # a passage, in degrees at radius r


def orb_room_area(fl):
    r0, r1 = orb_rooms_r(fl); return (72.0 - orb_gap((r0 + r1) / 2)) * D / 2 * (r1 * r1 - r0 * r0)


# ------------------------------------------------------------------------------------------------ svg helpers
class Svg:
    def __init__(self, w, h, title):
        self.w, self.h = w, h; self.o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" font-family="%s">' % (w, h, w, h, FONT),
                                          '<title>%s</title>' % E(title), '<rect width="%d" height="%d" fill="#F7F5F0"/>' % (w, h)]

    def add(self, s): self.o.append(s)

    def poly(self, pts, fill, stroke="#33302C", sw=1.0, dash=None, op=1.0):
        d = " ".join("%.1f,%.1f" % p for p in pts)
        self.add('<polygon points="%s" fill="%s" fill-opacity="%.2f" stroke="%s" stroke-width="%.2f"%s/>' % (d, fill, op, stroke, sw, ' stroke-dasharray="%s"' % dash if dash else ""))

    def text(self, x, y, s, size=11, weight=400, fill="#1C2124", anchor="middle", rot=0.0, italic=False):
        tr = ' transform="rotate(%.1f %.1f %.1f)"' % (rot, x, y) if rot else ""
        self.add('<text x="%.1f" y="%.1f" font-size="%.1f" font-weight="%d"%s fill="%s" text-anchor="%s" dominant-baseline="middle"%s>%s</text>' %
                 (x, y, size, weight, ' font-style="italic"' if italic else "", fill, anchor, tr, E(s)))

    def save(self, name):
        self.o.append("</svg>"); open(os.path.join(SVG, name), "w").write("\n".join(self.o)); return "svg/" + name


def fits(text, size, room_len): return len(text) * size * 0.56 <= room_len


def label(svg, cx, cy, rot, code, name, along, across, big=False):
    """the code, and the name if it fits, in a room `along` px long and `across` px deep"""
    cs, ns = (13.5, 11.0) if big else (11.0, 9.2)
    for k in (1.0, 0.86, 0.74):
        if across >= (cs + ns) * k + 4 and fits(name, ns * k, along - 6) and fits(code, cs * k, along - 4):
            svg.text(cx, cy, code, cs * k, 700, rot=rot, anchor="middle")
            dy = (cs + ns) * k / 2 - 1; s, c = math.sin(rot * D), math.cos(rot * D)
            svg.text(cx - s * dy, cy + c * dy, name, ns * k, 400, "#3A4246", rot=rot)
            return True
    if fits(code, cs, along - 2) and across >= cs: svg.text(cx, cy, code, cs, 700, rot=rot); return True
    if fits(code, 9.0, along) and across >= 9: svg.text(cx, cy, code, 9.0, 700, rot=rot); return True
    svg.text(cx, cy, code, 8.0, 700, rot=rot + (90 if along < across else 0)); return True


def north(svg, x, y, ang=0.0, size=26):
    s, c = math.sin(ang * D), math.cos(ang * D)
    tip = (x + s * size / 2, y - c * size / 2); l = (x - c * 7 - s * size / 2, y - s * 7 + c * size / 2); r = (x + c * 7 - s * size / 2, y + s * 7 + c * size / 2)
    svg.poly([tip, r, (x, y + 0.0), l], "#1C2124", "#1C2124", 0.5)
    svg.text(tip[0] + s * 11, tip[1] - c * 11, "N", 12, 700)


def scalebar(svg, x, y, px_per_m, metres=50):
    L = metres * px_per_m
    svg.add('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#1C2124" stroke-width="2"/>' % (x, y, x + L, y))
    for f in (0, 0.5, 1): svg.add('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#1C2124" stroke-width="1.4"/>' % (x + L * f, y - 5, x + L * f, y + 5))
    svg.text(x, y + 15, "0", 10, 400); svg.text(x + L / 2, y + 15, str(metres // 2), 10, 400); svg.text(x + L, y + 15, "%d m" % metres, 10, 400)


def legend(svg, x, y, kinds, cols=1, colw=180):
    for i, k in enumerate(kinds):
        cx, cy = x + (i % cols) * colw, y + (i // cols) * 18
        svg.add('<rect x="%.1f" y="%.1f" width="14" height="11" fill="%s" stroke="#33302C" stroke-width="0.8"/>' % (cx, cy - 6, KIND[k][0]))
        svg.text(cx + 20, cy, KIND[k][1], 10.5, 400, anchor="start")


# ------------------------------------------------------------------------------------------------ Pentagon plans
def level_svg(L, scale=3.3):
    W, H = 1200, 1000; cx, cy = 500 - 13 * scale, H / 2 + 18
    S = lambda p: (cx + p[0] * scale, cy - p[1] * scale)
    svg = Svg(W, H, "%s %s, Rev G" % (L["id"], L["name"]))
    outer = [S(bearing_pt(18 + 72 * i, R)) for i in range(5)]
    svg.poly(outer, "#EFEBE3", "#1C2124", 2.4)
    rooms = [r for r in L["rooms"]]
    upper = []
    for rm in rooms:
        k, loc = room_local(rm)
        pts = [S(world(k, u, v)) for (u, v) in loc]
        if rm.get("upper"): upper.append((rm, pts, loc, k)); continue
        svg.poly(pts, KIND[rm["kind"]][0], "#33302C", 0.9)
    for rm, pts, loc, k in upper: svg.poly(pts, "none", "#2A6E8E", 1.4, "5 3")
    # the atrium, its terrace and the portal column with its bridges
    atr = [S(bearing_pt(18 + 72 * i, RA)) for i in range(5)]
    svg.poly(atr, "#FBF6EA" if L["id"] != "L5" else "#DCEBC8", "#1C2124", 1.8)
    for i in range(5):
        b = 54 + 72 * i; p0 = S(bearing_pt(b, 5)); p1 = S(bearing_pt(b, APA))
        if L["id"] != "L5": svg.add('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#8A9395" stroke-width="%.1f"/>' % (p0[0], p0[1], p1[0], p1[1], 3.2 * scale / 3.9))
    svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#DFE6F3" stroke="#3B5FB0" stroke-width="1.4"/>' % (cx, cy, 5 * scale))
    svg.text(cx, cy, "PC", 10, 700, "#3B5FB0")
    svg.text(cx, cy + 15 * scale, "%s-AT" % L["id"] if L["id"] != "L5" else "L5-SC Sun court", 10.5, 700, "#5E6A70")
    # the corner cores
    for i in range(5):
        b = 18 + 72 * i; c = S(bearing_pt(b, R - 9.5)); a = -b
        s = 11 * scale / 2
        pts = [(c[0] + dx * math.cos(a * D) - dy * math.sin(a * D), c[1] + dx * math.sin(a * D) + dy * math.cos(a * D)) for dx, dy in ((-s, -s), (s, -s), (s, s), (-s, s))]
        svg.poly(pts, "#5E6A70", "#1C2124", 1.0)
        svg.text(c[0], c[1], "CC%d" % (i + 1), 8.5, 700, "#FFFFFF")
    # labels
    for rm in rooms:
        if rm.get("upper"): continue
        k, loc = room_local(rm)
        uc = (loc[0][0] + loc[1][0] + loc[2][0] + loc[3][0]) / 4; vc = (loc[0][1] + loc[2][1]) / 2
        along = ((loc[1][0] - loc[0][0]) + (loc[2][0] - loc[3][0])) / 2 * scale; across = (loc[2][1] - loc[0][1]) * scale
        x, y = S(world(k, uc, vc)); rot = sector_c(k) % 360
        rot = rot - 180 if rot > 90 and rot <= 270 else rot
        rot = rot - 360 if rot > 180 else rot
        label(svg, x, y, rot, rm["code"], rm["name"], along, across)
    for rm, pts, loc, k in upper:
        uc = (loc[0][0] + loc[1][0]) / 2; vc = loc[0][1] + 2.2; x, y = S(world(k, uc, vc)); rot = sector_c(k) % 360
        rot = rot - 180 if rot > 90 and rot <= 270 else rot
        svg.text(x, y, "%s upstairs" % rm["code"], 8.6, 700, "#2A6E8E", rot=rot)
    # sector names outside
    for k, nm in (P.SECTORS.items() if L["id"] == "L1" else []):
        x, y = S(world(k, 0, AP + 7)); rot = sector_c(k) % 360; rot = rot - 180 if 90 < rot <= 270 else rot
        svg.text(x, y, "%d · %s" % (k, nm), 14, 700, "#1C2124", rot=rot)
    if L["id"] != "L1":
        for k in range(1, 6):
            x, y = S(world(k, 0, AP + 6)); rot = sector_c(k) % 360; rot = rot - 180 if 90 < rot <= 270 else rot
            svg.text(x, y, "Sector %d" % k, 12, 700, "#5E6A70", rot=rot)
    svg.text(24, 30, "%s · %s · floor %d m" % (L["id"], L["name"], L["floor"]), 20, 700, anchor="start")
    svg.text(24, 52, "Floor plans Rev G · north up · codes on every room", 11.5, 400, "#4E575B", anchor="start")
    north(svg, W - 40, 44); scalebar(svg, 28, H - 34, scale)
    kinds = sorted({r["kind"] for r in rooms}, key=list(KIND).index)
    svg.text(1000, 120, "Key", 12, 700, anchor="start"); legend(svg, 1000, 142, kinds)
    svg.text(1000, 142 + 18 * len(kinds) + 14, "Dashed blue: on the upper storey", 10, 400, "#2A6E8E", anchor="start")
    svg.text(1000, 142 + 18 * len(kinds) + 32, "PC portal column · CC corner core", 10, 400, "#4E575B", anchor="start")
    return svg.save("%s.svg" % L["id"].lower())


def sector_svg(L, k, scale=6.2):
    """one sector unrolled: the atrium at the top, the rings below it, every room labelled"""
    W, H = 980, 662; x0, y0 = W / 2, 96
    S = lambda u, v: (x0 + u * scale, y0 + (v - APA) * scale)
    svg = Svg(W, H, "%s sector %d, Rev G" % (L["id"], k))
    rooms = [r for r in L["rooms"] if r["at"][1] == k]
    # the band outlines first (streets between)
    for r in "ABCDE":
        va, vb = ring_v(r)
        svg.poly([S(-half(va), va), S(half(va), va), S(half(vb), vb), S(-half(vb), vb)], "#EDE9E1", "#B9B2A6", 0.6)
    ups = []
    for rm in rooms:
        _, loc = room_local(rm); pts = [S(u, v) for (u, v) in loc]
        if rm.get("upper"): ups.append((rm, pts, loc)); continue
        svg.poly(pts, KIND[rm["kind"]][0], "#33302C", 1.1)
    for rm, pts, loc in ups: svg.poly(pts, "none", "#2A6E8E", 1.6, "6 4")
    for rm in rooms:
        _, loc = room_local(rm)
        uc = (loc[0][0] + loc[1][0] + loc[2][0] + loc[3][0]) / 4; vc = (loc[0][1] + loc[2][1]) / 2
        along = ((loc[1][0] - loc[0][0]) + (loc[2][0] - loc[3][0])) / 2 * scale; across = (loc[2][1] - loc[0][1]) * scale
        if rm.get("upper"):
            x, y = S(uc, loc[0][1] + 2.4); svg.text(x, y, "%s %s, upstairs" % (rm["code"], rm["name"]), 10.5, 700, "#2A6E8E"); continue
        x, y = S(uc, vc); label(svg, x, y, 0, rm["code"], rm["name"], along, across, big=True)
        if not rm.get("upper"):
            a = area(loc)
            if across > 54 and along > 70: svg.text(x, y + 25, m2(a), 9.5, 400, "#6C777C")
    # the atrium edge and the streets' names
    xa, ya = S(-half(APA), APA); xb, yb = S(half(APA), APA)
    svg.add('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#2A6E8E" stroke-width="3"/>' % (xa, ya - 2, xb, yb - 2))
    svg.text(x0, ya - 16, "Atrium · glass wall, terrace and bridge (%s-AT)" % L["id"], 11.5, 700, "#2A6E8E")
    for i, r in enumerate("ABCDE"):
        va, vb = ring_v(r); x, y = S(-half(vb) - 1, (va + vb) / 2)
        svg.text(x - 10, y, "Ring " + r, 10.5, 700, "#6C777C", anchor="end")
        if i < 4: xs, ys = S(0, vb + 2); svg.text(xs, ys, "street", 8.5, 400, "#8A9395", italic=True)
    svg.text(24, 28, "%s · sector %d · %s" % (L["id"], k, P.SECTORS[k] if L["id"] == "L1" else ""), 18, 700, anchor="start")
    svg.text(24, 47, "Drawn straight: the atrium at the top, the outer wall at the bottom; left to right is clockwise, seen from above", 10.5, 400, "#4E575B", anchor="start")
    north(svg, W - 40, 40, ang=-(sector_c(k) + 180)); scalebar(svg, 28, H - 26, scale, 20)
    return svg.save("%s-%d.svg" % (L["id"].lower(), k))


# ------------------------------------------------------------------------------------------------ Crown plans
def arc_path(b0, b1, r0, r1, S):
    n = max(2, int(abs(b1 - b0) / 1.5) + 1); pts = []
    for i in range(n + 1): pts.append(S(bearing_pt(b0 + (b1 - b0) * i / n, r1)))
    for i in range(n + 1): pts.append(S(bearing_pt(b1 - (b1 - b0) * i / n, r0)))
    return pts


def crown_svg(scale=2.95):
    W, H = 1200, 1000; cx, cy = 490, 525
    S = lambda p: (cx + p[0] * scale, cy - p[1] * scale)
    svg = Svg(W, H, "The Crown, Rev G")
    svg.poly(arc_path(0, 360, R_SHELL0, R_SHELL1, S), "#FFFFFF", "#33302C", 1.0)
    svg.poly(arc_path(0, 360, R_IN, R_GL, S), "#F1E7DA", "#8A9395", 0.6)
    for rm in P.CROWN:
        if rm.get("up"): continue
        b0, b1 = rm["at"]; svg.poly(arc_path(b0, b1, R_GL, R_OUT, S), KIND[rm["kind"]][0], "#33302C", 0.8)
    for num, nm, b0, b1, spire, comp in P.CROWN_PARTS:
        for b in (b0,):
            p0, p1 = S(bearing_pt(b, R_SHELL0 - 2)), S(bearing_pt(b, R_SHELL1 + 2))
            svg.add('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#1C2124" stroke-width="2.2"/>' % (p0[0], p0[1], p1[0], p1[1]))
        bm = (b0 + b1) / 2; x, y = S(bearing_pt(bm, R_SHELL1 + 15))
        rot = bm if bm <= 90 or bm > 270 else bm - 180; rot = rot - 360 if rot > 180 else rot
        svg.text(x, y, "%d · %s%s" % (num, nm, " ▲" if spire else ""), 12.5, 700, rot=rot)
    for rm in P.CROWN:
        if rm.get("up"): continue
        b0, b1 = rm["at"]; bm = (b0 + b1) / 2; x, y = S(bearing_pt(bm, (R_GL + R_OUT) / 2))
        rot = bm if bm <= 90 or bm > 270 else bm - 180; rot = rot - 360 if rot > 180 else rot
        along = (b1 - b0) * D * 131.75 * scale
        svg.text(x, y, rm["code"].replace("C-", ""), 8.6 if along > 22 else 7.2, 700, rot=rot)
    # the Glide, the Orb, the garden
    x, y = S(bearing_pt(225, (R_IN + R_GL) / 2 - 7)); svg.text(x, y, "C-GL the Glide", 10, 700, "#8A6A3E", rot=45)
    svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#E6EBEF" stroke="#5E6A70" stroke-width="1.2"/>' % (cx, cy, 20 * scale))
    svg.text(cx, cy - 4, "The Orb", 12, 700, "#3B4A55"); svg.text(cx, cy + 12, "O-00 to O-17", 10, 400, "#3B4A55")
    svg.text(cx, cy + 40 * scale, "G-01 Stone Garden, 40 m below", 11, 400, "#6C777C", italic=True)
    svg.text(24, 30, "The Crown · main floor, 41 m above the plain", 20, 700, anchor="start")
    svg.text(24, 52, "Floor plans Rev G · north up · numbers are room codes: 10 is C-10 · ▲ a spire, with an upper floor", 11.5, 400, "#4E575B", anchor="start")
    north(svg, W - 40, 44); scalebar(svg, 28, H - 34, scale)
    kinds = sorted({r["kind"] for r in P.CROWN}, key=list(KIND).index)
    svg.text(1000, 120, "Key", 12, 700, anchor="start"); legend(svg, 1000, 142, kinds)
    yy = 142 + 18 * len(kinds) + 16
    for line in ("Upper floors in the spires:", "C-05 Dock control (part 1)", "C-12 Sky lounge (part 3)", "C-19 Sky bar (part 5)", "C-26 Reading gallery (part 7)", "C-32 Telescope dome (part 9)"):
        svg.text(1000, yy, line, 10, 700 if line.endswith(":") else 400, "#2A6E8E", anchor="start"); yy += 16
    return svg.save("crown.svg")


def crown_part_svg(part):
    num, nm, b0, b1, spire, comp = part
    span = (b1 - b0) * D * (R_GL + R_OUT) / 2; scale = 900 / span
    W, H = 980, 290 if spire else 230; x0, yR = 40, 92 if spire else 62
    X = lambda b: x0 + (b - b0) * D * (R_GL + R_OUT) / 2 * scale
    hr, hg = (R_OUT - R_GL) * scale, (R_GL - R_IN) * scale
    svg = Svg(W, H, "Crown part %d, Rev G" % num)
    svg.text(24, 26, "C · part %d · %s (%s, bearings %d° to %d°)%s" % (num, nm, comp, b0, b1, " · a spire" if spire else ""), 17, 700, anchor="start")
    svg.add('<rect x="%.1f" y="%.1f" width="%.1f" height="5" fill="#FFFFFF" stroke="#33302C"/>' % (x0, yR - 7, 900))
    svg.text(x0, yR - 14, "outer wall, with the window slots, to the plain", 9.5, 400, "#6C777C", anchor="start")
    rooms = [r for r in P.CROWN if r["part"] == num]
    for rm in rooms:
        if rm.get("up"): continue
        a, b = rm["at"]; svg.poly([(X(a), yR), (X(b), yR), (X(b), yR + hr), (X(a), yR + hr)], KIND[rm["kind"]][0], "#33302C", 1.1)
        cxm = (X(a) + X(b)) / 2; label(svg, cxm, yR + hr / 2 - 4, 0, rm["code"], rm["name"], X(b) - X(a), hr, big=True)
        ar = crown_area(a, b); svg.text(cxm, yR + hr - 9, m2(ar), 9.5, 400, "#6C777C")
    svg.poly([(x0, yR + hr), (x0 + 900, yR + hr), (x0 + 900, yR + hr + hg), (x0, yR + hr + hg)], "#F1E7DA", "#8A9395", 0.8)
    svg.text(x0 + 450, yR + hr + hg / 2, "C-GL · the Glide, a moving walkway", 10.5, 700, "#8A6A3E")
    svg.text(x0, yR + hr + hg + 14, "inner wall, with slots onto the Orb and the Stone Garden", 9.5, 400, "#6C777C", anchor="start")
    for rm in rooms:
        if not rm.get("up"): continue
        a, b = rm["at"]; yu = 40
        svg.poly([(X(a), yu), (X(b), yu), (X(b), yu + 22), (X(a), yu + 22)], KIND[rm["kind"]][0], "#2A6E8E", 1.2, "6 4", 0.7)
        svg.text((X(a) + X(b)) / 2, yu + 11, "%s %s · upper floor, in the spire" % (rm["code"], rm["name"]), 10.5, 700, "#2A6E8E")
    scalebar(svg, x0, H - 22, scale, 10)
    return svg.save("crown-%d.svg" % num)


def orb_svg():
    W, H = 980, 480; svg = Svg(W, H, "The Orb, Rev G")
    svg.text(24, 28, "The Orb · three floors, 48 m across: five rooms between two lanes round the Wormhole Gate", 15, 700, anchor="start")
    svg.text(24, 47, "Floor plans Rev G · north up · the outer lane along the windows, the inner lane along the glass onto the Gate, a passage under each spire", 10.5, 400, "#4E575B", anchor="start")
    floors = ((64, [o for o in P.ORB if o["floor"] == 64 and o.get("slot") is not None], "+64 m · portal floor"),
              (72, [o for o in P.ORB if o["floor"] == 72 and o.get("slot") is not None], "+72 m · universe lounges"),
              (80, [o for o in P.ORB if o["floor"] == 80], "+80 m · rest rooms"))
    for j, (fl, items, title) in enumerate(floors):
        cx, cy, sc = 170 + j * 320, 262, 6.2
        S = lambda p: (cx + p[0] * sc, cy - p[1] * sc)
        rf = orb_floor_r(fl); r0, r1 = orb_rooms_r(fl); g = orb_gap((r0 + r1) / 2) / 2
        svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#E6EAEE" stroke="#33302C" stroke-width="1.3"/>' % (cx, cy, ORB_R * sc))     # the shell, cut at this floor
        svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#F4EFE6" stroke="#33302C" stroke-width="0.9"/>' % (cx, cy, rf * sc))        # the floor: lanes and passages
        for i, o in enumerate(items):
            b0 = 18 + 72 * i + g; b1 = 18 + 72 * (i + 1) - g                                       # a room between two spires
            svg.poly(arc_path(b0, b1, r0, r1, S), KIND[o["kind"]][0], "#33302C", 1.0)
            x, y = S(bearing_pt((b0 + b1) / 2, (r0 + r1) / 2)); nm = o["name"].replace(" lounge", ""); w = nm.split()
            m = (b0 + b1) / 2
            if abs(math.sin(m * D)) > 0.9:                                                           # a room due east or west: along the ring
                rot = -90 if m > 180 else 90; dx = 6 if m > 180 else -6
                svg.text(x - dx, y, o["code"], 10.5, 700, rot=rot); svg.text(x + dx, y, nm, 8.2, 400, "#3A4246", rot=rot)
            elif len(nm) > 9 and len(w) > 1 and 30 < m % 180 < 150:                                   # rooms to the east and west: two lines
                svg.text(x, y - 8, o["code"], 10.5, 700); svg.text(x, y + 4, w[0], 8.2, 400, "#3A4246"); svg.text(x, y + 13, " ".join(w[1:]), 8.2, 400, "#3A4246")
            else:
                svg.text(x, y - 3, o["code"], 10.5, 700); svg.text(x, y + 9, nm, 8.2, 400, "#3A4246")
        svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#FBFCFD" stroke="#3B7FB0" stroke-width="1.6"/>' % (cx, cy, ORB_HALL * sc))   # the glass round the Gate
        svg.add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#D7DEE8" stroke="#3B5FB0" stroke-width="1.2"%s/>' % (cx, cy, 9.0 * sc, "" if fl == 72 else ' stroke-dasharray="4 3" fill-opacity="0.45"'))
        svg.text(cx, cy - 2, "O-00 Gate", 10, 700, "#3B5FB0"); svg.text(cx, cy + 11, {64: "above", 72: "Ø 18 m", 80: "below"}[fl], 8.5, 400, "#3B5FB0")
        if fl == 72:
            p0, p1 = S(bearing_pt(180, 9.0)), S(bearing_pt(180, ORB_HALL)); svg.add('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#B98A2C"/>' % (p0[0] - 1.5 * sc, p0[1], 3 * sc, p1[1] - p0[1]))
        for rr, t in ((rf - LANE / 2, "outer lane"), (ORB_HALL + LANE / 2, "inner lane")):
            lx, ly = S(bearing_pt(234, rr)); svg.text(lx, ly + 3, t, 7.4, 600, "#6C777C")
        svg.text(cx, 84, title, 13, 700)
        svg.text(cx, cy + ORB_R * sc + 22, {64: "O-01 Foyer, under the Gate", 72: "O-12 bridge into the Gate (gold)", 80: "windows in radiation glass"}[fl], 10.2, 700,
                 {64: "#4E575B", 72: "#8A6A1E", 80: "#4E575B"}[fl])
    scalebar(svg, 24, H - 24, 6.2, 10)
    return svg.save("orb.svg")


# ------------------------------------------------------------------------------------------------ pages
ALL = []
for L in P.LEVELS:
    for rm in L["rooms"]: ALL.append(dict(rm, place=L["id"]))
for rm in P.CROWN: ALL.append(dict(rm, place="C"))
for rm in P.ORB: ALL.append(dict(rm, place="O"))
BY = {r["code"]: r for r in ALL}
TOUR = os.path.join(REPO, "palace", "tour")


def tour_ready():
    """The tour's stops that are really published: a 360° file and not marked ready: false in stops.js."""
    ok = set()
    for line in open(os.path.join(TOUR, "stops.js")).read().splitlines():
        m = re.match(r'\s*\{ id: "([a-z_0-9]+)", ', line)
        if m and "name:" in line and "ready: false" not in line and os.path.exists(os.path.join(TOUR, "pano", m.group(1) + ".jpg")): ok.add(m.group(1))
    return ok


READY = tour_ready()


def seen_link(r):
    """The marker by a room's name: its 360° in the tour if published, else its picture if there is one, else nothing."""
    s = r.get("seen")
    if not s: return ""
    if s in READY: return ' <a class="seen" href="../tour/#%s" title="See it in 360°">◉ 360°</a>' % s
    if os.path.exists(os.path.join(TOUR, "photos", s + ".jpg")): return ' <a class="seen" href="../tour/photos/%s.jpg" title="See the picture">◉ picture</a>' % s
    return ""


def page_of(code):
    r = BY.get(code)
    if not r: return "index.html"
    if r["place"] == "L1": return "l1-%d.html" % r["at"][1]
    if r["place"].startswith("L"): return "%s.html" % r["place"].lower()
    if r["place"] == "C": return "crown-%d.html" % r["part"]
    return "orb.html"


def link(code): return '<a href="%s#%s">%s</a>' % (page_of(code), code, code)


def m2(a):
    """An area as written on the drawings and in the tables alike: to the metre under 100 m², to 10 m² above."""
    return "%d m²" % round(a, -1 if a >= 100 else 0)


def size_of(r):
    if r["place"] == "C": return crown_area(*r["at"])
    if r["place"] == "O": return orb_room_area(r["floor"]) if r.get("slot") is not None else None
    if r["place"].startswith("L"): return area(room_local(r)[1])
    return None


def table(rooms, show_where=True):
    o = ['<div class="tw"><table class="rooms"><thead><tr><th>Code</th><th>Room</th><th>What it is for</th><th>Also</th><th>Size</th><th>Two of a kind</th></tr></thead><tbody>']
    for r in (BY[x["code"]] for x in rooms):
        a = size_of(r); sz = m2(a) if a else ""
        if r.get("upper") or r.get("up"): sz += " · upper floor"
        pair = link(r["pair"]) + " " + E(BY[r["pair"]]["name"]) if r.get("pair") and r["pair"] in BY else ""
        seen = seen_link(r)
        o.append('<tr id="%s"><td class="code"><span class="k" style="background:%s"></span>%s</td><td><b>%s</b>%s</td><td>%s</td><td>%s</td><td class="n">%s</td><td>%s</td></tr>' %
                 (r["code"], KIND[r["kind"]][0] if r.get("kind") else "#ddd", r["code"], E(r["name"]), seen, E(r.get("use", "")), E(r.get("also", "")), sz, pair))
    o.append("</tbody></table></div>")
    return "\n".join(o)


NAV = [("index.html", "Overview"), ("crown.html", "Crown"), ("orb.html", "Orb"), ("l1.html", "L1"), ("l2.html", "L2"), ("l3.html", "L3"),
       ("l4.html", "L4"), ("l5.html", "L5"), ("pairs.html", "Two of a kind"), ("rooms.html", "All codes")]


def page(fname, title, body, here, sub=None):
    nav = "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if h == here else "", n) for h, n in NAV)
    subnav = ('<nav class="sub">' + "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if h == fname else "", n) for h, n in sub) + "</nav>") if sub else ""
    doc = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s · Floor plans · Mars – No Way Home</title>
<meta name="robots" content="noindex">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="plans.css">
</head>
<body>
<header class="top"><div class="in"><div class="crumb"><a href="../../">Mars – No Way Home</a> · <a href="../design/">Design plan</a> · <a href="index.html">Floor plans</a></div><nav>%s</nav></div>%s</header>
<main>
%s
</main>
<footer><p>Floor plans Rev G, approved by Jim on 2 Oct 2026. Drawn by <code>palace/tools/draw_plans.py</code> from the room program in <code>palace/tools/room_program.py</code>.</p></footer>
</body>
</html>
""" % (E(title), nav, subnav, body)
    open(os.path.join(OUT, fname), "w").write(doc)


def fig(src, alt, cap):
    return '<figure class="plan"><a href="%s" title="Open the drawing full size"><img src="%s" alt="%s"></a><figcaption>%s <a href="%s">Open full size ↗</a></figcaption></figure>' % (src, src, E(alt), cap, src)


def build():
    os.makedirs(SVG, exist_ok=True); os.makedirs(DOCS, exist_ok=True)
    n_rooms = len(ALL)
    # ---- the levels
    for L in P.LEVELS:
        src = level_svg(L)
        if L["id"] == "L1":
            subs = [("l1.html", "Whole level")] + [("l1-%d.html" % k, "%d · %s" % (k, P.SECTORS[k])) for k in range(1, 6)]
            cards = "".join('<a class="card" href="l1-%d.html"><b>Sector %d · %s</b><span>%s</span></a>' %
                            (k, k, E(P.SECTORS[k]), E(", ".join("%s %s" % (r["code"], r["name"]) for r in L["rooms"] if r["at"][1] == k)[:220] + "…")) for k in range(1, 6))
            page("l1.html", "L1 Residence", '<h1>L1 · Residence <small>floor −24 m, 8 m high</small></h1><p class="lede">%s</p>%s<h2>The five sectors</h2><div class="cards">%s</div>%s' %
                 (E(L["intro"]), fig(src, "Plan of L1 with every room and its code", "<b>L1, the whole level</b>, north up. Each room carries its code; dashed blue: on the upper storey."), cards, shared_note(L["id"])), "l1.html", subs)
            for k in range(1, 6):
                ssrc = sector_svg(L, k); rooms = [r for r in L["rooms"] if r["at"][1] == k]
                page("l1-%d.html" % k, "L1 sector %d · %s" % (k, P.SECTORS[k]),
                     '<h1>L1 · sector %d · %s</h1>%s%s' % (k, E(P.SECTORS[k]), fig(ssrc, "Plan of L1 sector %d" % k, "<b>Sector %d, unrolled</b>: the atrium at the top, the outer wall at the bottom." % k), table(rooms)),
                     "l1.html", subs)
        else:
            page("%s.html" % L["id"].lower(), "%s %s" % (L["id"], L["name"]),
                 '<h1>%s · %s <small>floor %d m, %d m high</small></h1><p class="lede">%s</p>%s%s%s' %
                 (L["id"], E(L["name"]), L["floor"], L["height"], E(L["intro"]), fig(src, "Plan of %s with every room and its code" % L["id"], "<b>%s</b>, north up." % L["id"]), table(L["rooms"]), shared_note(L["id"])),
                 "%s.html" % L["id"].lower())
    # ---- the Crown
    csrc = crown_svg()
    subs = [("crown.html", "Whole ring")] + [("crown-%d.html" % p[0], "%d · %s" % (p[0], p[1])) for p in P.CROWN_PARTS]
    cards = "".join('<a class="card" href="crown-%d.html"><b>%d · %s</b><span>%s · %s</span></a>' %
                    (p[0], p[0], E(p[1]), p[5], E(", ".join("%s %s" % (r["code"], r["name"]) for r in P.CROWN if r["part"] == p[0]))) for p in P.CROWN_PARTS)
    page("crown.html", "The Crown",
         '<h1>The Crown <small>the day house, 41 m above the plain</small></h1><p class="lede">Light, views and company, for about six hours a day: the rooms are placed by the sun, so there is one for every hour of the sol. Morning in the east (breakfast, the bedroom up), midday in the south (the salon, the pool), evening in the west (dining, the sunset lounge), the north light for the library and the studio, and the night sky in the north-east.</p>%s<h2>The ten parts</h2><div class="cards">%s</div><p class="note">%s</p>' %
         (fig(csrc, "Plan of the Crown's ring with every room code", "<b>The Crown's main floor</b>, north up. The numbers are room codes (10 is C-10); ▲ marks a spire with an upper floor."), cards,
          "C-GL The Glide: the moving walkway along the garden side, 779 m round, past every room."), "crown.html", subs)
    for p in P.CROWN_PARTS:
        psrc = crown_part_svg(p); rooms = [r for r in P.CROWN if r["part"] == p[0]]
        page("crown-%d.html" % p[0], "Crown part %d · %s" % (p[0], p[1]),
             '<h1>The Crown · part %d · %s <small>%s, bearings %d° to %d°%s</small></h1>%s%s' % (p[0], E(p[1]), p[5], p[2], p[3], ", a spire" if p[4] else "",
                                                                                            fig(psrc, "Plan of Crown part %d" % p[0], "<b>Part %d, unrolled</b>: the outer wall at the top, the Glide at the bottom." % p[0]), table(rooms)),
             "crown.html", subs)
    # ---- the Orb
    osrc = orb_svg()
    page("orb.html", "The Orb", '<h1>The Orb <small>48 m across, +48 to +96 m, over the middle of the ring</small></h1><p class="lede">Three floors round the Wormhole Gate. On each, five rooms sit in the middle of the ring between two lanes: the outer lane along the windows looks out over the plain, the inner lane along the glass looks in onto the Gate, and a passage under each spire joins them. Each universe lounge opens on its own part of the universe.</p>%s%s<p class="note">Shared on every floor: %s.</p>' %
         (fig(osrc, "Plans of the Orb's three floors", "<b>The Orb's three floors</b>, each round the Gate. Floor areas: +72 m 1,070 m², +64 and +80 m 870 m² each."), table(P.ORB),
          "; ".join("<b>O-%s</b> %s: %s" % (k, E(v[0]).lower(), E(v[1])) for k, v in P.ORB_SHARED.items())), "orb.html")
    # ---- two of a kind
    seen = set(); rows = []
    for r in ALL:
        q = r.get("pair")
        if not q or q not in BY: continue
        key = tuple(sorted((r["code"], q)))
        if key in seen: continue
        seen.add(key); a, b = (r, BY[q])
        if a["place"] not in ("C", "O") and b["place"] in ("C", "O"): a, b = b, a
        rows.append('<tr><td>%s <b>%s</b><br><span>%s</span></td><td>%s <b>%s</b><br><span>%s</span></td></tr>' % (link(a["code"]), E(a["name"]), E(a.get("use", "")), link(b["code"]), E(b["name"]), E(b.get("use", ""))))
    page("pairs.html", "Two of a kind",
         '<h1>Two of a kind</h1><p class="lede">Jim, 2 Oct 2026: two of a kind is fine "as long as they could be used for multiple purpose". Each pair below has two different jobs. Most pairs follow the house\'s rule: <b>by day up in the Crown</b>, in the light and the view, for about six hours; <b>by night down in the Pentagon</b>, under 16 m of soil, where everyone sleeps.</p><div class="tw"><table class="pairs"><thead><tr><th>Up, or the first</th><th>Down, or the second</th></tr></thead><tbody>%s</tbody></table></div>' % "\n".join(rows),
         "pairs.html")
    # ---- all codes
    blocks = []
    for L in P.LEVELS: blocks.append('<h2>%s · %s</h2>%s' % (L["id"], E(L["name"]), table(L["rooms"])))
    blocks.insert(0, '<h2>The Crown</h2>%s<h2>The Orb</h2>%s' % (table(P.CROWN), table(P.ORB)))
    page("rooms.html", "All codes", '<h1>Every room and its code <small>%d rooms and areas</small></h1>%s<h2>The ground</h2><ul>%s</ul><h2>Shared areas on every Pentagon level</h2><ul>%s</ul>' %
         (n_rooms, "".join(blocks), "".join("<li><b>%s</b> %s: %s</li>" % (g["code"], E(g["name"]), E(g["use"])) for g in P.GROUND),
          "".join("<li><b>L1-%s</b> (and L2-%s … L5-%s) %s: %s</li>" % (k, k, k, E(v[0]), E(v[1])) for k, v in P.SHARED.items())), "rooms.html")
    # ---- the overview
    page("index.html", "Overview",
         """<h1>Floor plans <small>Rev G, approved by Jim on 2 October 2026</small></h1>
<p class="lede">Every room of the house: what it is for, what else it can be used for, where it is and how big, and a code to refer to it. Two of a kind only where the two have different jobs. %d rooms and areas.</p>
<div class="two"><div>
<h2>How the house is planned</h2>
<ul>
<li><b>Day up, night down.</b> The Crown is the day house: light, views and company, about six hours a day. The Pentagon is home for the evenings and the nights, under 16 m of soil, where everyone sleeps, Jim and his guests.</li>
<li><b>A room for every hour.</b> The Crown's rooms are placed by the sun: breakfast in the east, the salon and the pool in the south, dinner and the sunset in the west, the library and the studio in the north light, the stars in the north-east.</li>
<li><b>Jim's home is one sector.</b> On L1, sector 1 holds everything he uses every day, close together: music room, family room, dining room, study, bedroom, bath, kitchen.</li>
<li><b>The rest by use</b>: the club, the baths, the library and the guests on L1; gardens on L2; making and running the house on L3; life support on L4; arrivals on L5.</li>
</ul>
<h2>How the codes work</h2>
<ul>
<li><b>L1-02</b>: the Pentagon, level 1, room 02. Numbered level by level, sector by sector, from the atrium outwards.</li>
<li><b>C-10</b>: the Crown, room 10, numbered clockwise from the Arrival part; a spire's upper floor follows its part.</li>
<li><b>O-07</b>: the Orb; O-00 is the Wormhole Gate. <b>G-01</b>: the ground.</li>
<li>Shared areas have letters: <b>L1-AT</b> atrium terrace, <b>L1-PC</b> portal column, <b>L1-ST</b> streets, <b>L1-AV</b> avenues, <b>CC1</b> to <b>CC5</b> corner cores, <b>C-GL</b> the Glide, <b>O-OL</b> and <b>O-IL</b> the Orb's lanes.</li>
</ul>
</div><div>
<h2>The sheets</h2>
<div class="cards one">
<a class="card" href="crown.html"><b>The Crown</b><span>The ring and its ten parts, C-01 to C-34</span></a>
<a class="card" href="orb.html"><b>The Orb</b><span>Three floors round the Gate, rooms between two lanes: O-00 to O-17</span></a>
<a class="card" href="l1.html"><b>L1 · Residence</b><span>Jim's home, the club, the baths, the library, the guests: L1-01 to L1-43</span></a>
<a class="card" href="l2.html"><b>L2 · Garden</b><span>L2-01 to L2-21</span></a>
<a class="card" href="l3.html"><b>L3 · Studio</b><span>L3-01 to L3-23</span></a>
<a class="card" href="l4.html"><b>L4 · Life support</b><span>L4-01 to L4-19</span></a>
<a class="card" href="l5.html"><b>L5 · Transit</b><span>L5-01 to L5-21</span></a>
<a class="card" href="pairs.html"><b>Two of a kind</b><span>Each pair and its two purposes</span></a>
<a class="card" href="rooms.html"><b>All codes</b><span>Every room in one list</span></a>
</div>
<h2 id="ground">The ground</h2>
<ul>%s</ul>
</div></div>""" % (n_rooms, "".join("<li><b>%s</b> %s</li>" % (g["code"], E(g["name"])) for g in P.GROUND)),
         "index.html")
    # ---- data and docs
    json.dump([{k: v for k, v in r.items() if k in ("code", "name", "kind", "place", "part", "at", "rings", "upper", "up", "use", "also", "pair", "seen", "floor")} | {"m2": round(size_of(r) or 0)} for r in ALL],
              open(os.path.join(OUT, "rooms.json"), "w"), indent=0, ensure_ascii=False)
    docs()
    print("rooms", n_rooms, "pages", len([f for f in os.listdir(OUT) if f.endswith(".html")]), "drawings", len(os.listdir(SVG)))


def shared_note(lid):
    return '<p class="note">Shared on this level: ' + "; ".join("<b>%s-%s</b> %s" % (lid, k, E(v[0]).lower()) for k, v in P.SHARED.items()) + "; <b>CC1</b> to <b>CC5</b> the corner cores.</p>"


def docs():
    def md_table(rooms):
        o = ["| Code | Room | What it is for | Two of a kind |", "| --- | --- | --- | --- |"]
        for r in rooms: o.append("| **%s** | %s | %s | %s |" % (r["code"], r["name"], (r.get("use") or "").replace("|", "/"), r.get("pair", "")))
        return "\n".join(o)
    live = "https://ttmathcs.github.io/mars-campus/palace/plans/"
    files = [("crown.md", "The Crown", "crown.svg", P.CROWN, "crown.html"), ("orb.md", "The Orb", "orb.svg", P.ORB, "orb.html")] + \
            [("%s.md" % L["id"].lower(), "%s · %s" % (L["id"], L["name"]), "%s.svg" % L["id"].lower(), L["rooms"], "%s.html" % L["id"].lower()) for L in P.LEVELS]
    for fn, title, svgf, rooms, pg in files:
        open(os.path.join(DOCS, fn), "w").write("# Floor plans · %s\n\n[All sheets](README.md) · **[Open on the live site ↗](%s%s)**\n\n![%s](../../plans/svg/%s)\n\n%s\n" %
                                                (title, live, pg, title, svgf, md_table(rooms)))
    open(os.path.join(DOCS, "README.md"), "w").write(
        "# Floor plans\n\n**[Open on the live site ↗](%sindex.html)** · Rev G, approved by Jim on 2 Oct 2026 · drawn by `palace/tools/draw_plans.py` from `palace/tools/room_program.py`\n\n"
        "Every room has a code, a purpose, a place and a size, and two of a kind only where the two have different jobs "
        "(Jim, 2 Oct 2026). Codes: **L1-02** (Pentagon level 1, room 02), **C-10** (Crown), **O-07** (Orb), **G-01** (ground). "
        "The Orb is 48 m across, with five rooms on each floor between an outer and an inner lane (Rev F).\n\n"
        "| Sheet | |\n| --- | --- |\n%s\n\n## Taken out of Rev B\n\n%s\n\n## New\n\n%s\n" %
        (live, "\n".join("| [%s](%s) | %d rooms |" % (t, fn, len(r)) for fn, t, s, r, p in files),
         "\n".join("- **%s**: %s" % x for x in P.REMOVED), "\n".join("- **%s**: %s" % x for x in P.NEW)))


if __name__ == "__main__":
    build()
