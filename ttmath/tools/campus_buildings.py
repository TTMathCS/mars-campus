"""TTMath campus, phase 2: a page per new building with its floor plans and its rooms (from campus_rooms.py), and the
data the demo builds them from (ttmath/src/blocks/blk_p2data.js).
usage: python3 ttmath/tools/campus_buildings.py   (campus_plan.py draws the site plan and the overview pages)
Plans are drawn in the Math Palace's frame like the site plan: the palace and the start toward the bottom of the page,
lat to the right. Room sizes in the tables are measured from the drawn outlines (also saved to data/room_areas.json)."""
import html, json, math, os
import campus_rooms as R
HERE = os.path.dirname(os.path.abspath(__file__)); TT = os.path.dirname(HERE); OUT = os.path.join(TT, "plan")
E = html.escape
D2R = math.pi / 180
FILL = {"class": "#EBDFC6", "study": "#DDE7D0", "lab": "#D5E1E8", "compete": "#EBD7C9", "games": "#EBD7C9", "lounge": "#E8DFF0", "staff": "#E4E2DA",
        "service": "#DFDED9", "move": "#F4EFE5", "hall": "#EAD3BF", "tech": "#D8DDE2", "garden": "#D3E6C3", "sport": "#D3E5E9", "pad": "#5B6066", "outside": "#E9E5DA"}
INK, INK2, GLASS, WALL, PAPER, RED = "#24272A", "#4E575B", "#3E86B8", "#2B2926", "#FAF8F3", "#A8432A"


def area_of(pts): return abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2


def polar(r, a): return (r * math.sin(a * D2R), -r * math.cos(a * D2R))


def sector(r0, r1, a0, a1, n=None):
    """annular sector round the dome's centre in the palace frame (lat, rad); angles from straight behind the dome"""
    n = n or max(2, int(abs(a1 - a0) / 2))
    return [polar(r1, a0 + (a1 - a0) * k / n) for k in range(n + 1)] + [polar(r0, a1 - (a1 - a0) * k / n) for k in range(n + 1)]


def circle(c, r, n=60): return [(c[0] + r * math.sin(2 * math.pi * k / n), c[1] + r * math.cos(2 * math.pi * k / n)) for k in range(n)]


def box(l0, r0, l1, r1): return [(l0, r0), (l1, r0), (l1, r1), (l0, r1)]


class Plan:
    """an svg sheet; frame() maps the palace frame (lat, rad) to the page, the palace toward the bottom"""
    def __init__(s, w, h, title, sub):
        s.w, s.h, s.S = w, h, 1.0; s.areas = {}
        s.o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" font-family="Helvetica, Arial, sans-serif">' % (w, h, w, h),
               '<title>%s</title>' % E(title), '<rect width="%d" height="%d" fill="%s"/>' % (w, h, PAPER)]
        s.text(24, 28, title, 16, 700, anchor="start"); s.text(24, 48, sub, 11, 400, INK2, anchor="start")
    def frame(s, x0, y0, lat0, rad0, S): s.S = S; s.P = lambda lat, rad: (x0 + (lat - lat0) * S, y0 + (rad - rad0) * S)
    def _pts(s, pts): return " ".join("%.1f,%.1f" % s.P(*p) for p in pts)
    def _dash(s, dash): return ' stroke-dasharray="%s"' % dash if dash else ""
    def poly(s, pts, fill, stroke=WALL, sw=1.3, dash=None):
        s.o.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="%.1f"%s/>' % (s._pts(pts), fill, stroke, sw, s._dash(dash)))
    def line(s, pts, stroke=WALL, sw=1.0, dash=None, cap="butt"):
        s.o.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="%s"%s/>' % (s._pts(pts), stroke, sw, cap, s._dash(dash)))
    def circ(s, c, r, fill, stroke=WALL, sw=1.2, dash=None):
        x, y = s.P(*c); s.o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" stroke-width="%.1f"%s/>' % (x, y, r * s.S, fill, stroke, sw, s._dash(dash)))
    def text(s, x, y, t, size=11, weight=400, fill=INK, anchor="middle", rot=0):
        tr = ' transform="rotate(%.1f %.1f %.1f)"' % (rot, x, y) if rot else ""
        s.o.append('<text x="%.1f" y="%.1f" font-size="%.1f" font-weight="%d" fill="%s" text-anchor="%s" dominant-baseline="middle"%s>%s</text>' % (x, y, size, weight, fill, anchor, tr, E(t)))
    def note(s, lat, rad, t, size=10, weight=400, fill=INK2, anchor="middle", rot=0): x, y = s.P(lat, rad); s.text(x, y, t, size, weight, fill, anchor, rot)
    def label(s, code, name, at, rot=0, room_w=None, size=11):
        """a room's code, and its name under it where the name fits the room's width (m)"""
        x, y = s.P(*at)
        if name and len(name) * size * 0.5 < (room_w or 99) * s.S - 6: s.text(x, y - size * 0.55, code, size, 700, rot=rot); s.text(x, y + size * 0.62, name, size * 0.82, 400, INK2, rot=rot)
        else: s.text(x, y, code, size * 0.92, 700, rot=rot)
    def room(s, code, pts, kind, name=None, at=None, rot=0, room_w=None, size=11, area=True):
        s.poly(pts, FILL[kind])
        if area: s.areas[code] = s.areas.get(code, 0) + area_of(pts)
        if at is None: at = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
        s.label(code, name, at, rot, room_w, size)
    def door(s, p, along, inward, w=1.0):
        """a door at p in a wall running along `along`: the gap, the leaf open into the room (`inward`), its swing"""
        ax, az = along; ix, iz = inward; a = (p[0] - ax * w / 2, p[1] - az * w / 2); b = (p[0] + ax * w / 2, p[1] + az * w / 2); tip = (a[0] + ix * w, a[1] + iz * w)
        s.line([a, b], PAPER, 3.4); s.line([a, tip], WALL, 0.9)
        pa, pb = s.P(*tip), s.P(*b); sweep = 1 if (ix * az - iz * ax) > 0 else 0
        s.o.append('<path d="M%.1f,%.1f A%.1f,%.1f 0 0 %d %.1f,%.1f" fill="none" stroke="%s" stroke-width="0.7"/>' % (pa[0], pa[1], w * s.S, w * s.S, sweep, pb[0], pb[1], WALL))
    def arrow(s, a, b, label=None, color=RED, size=10, at_tip=False):
        """an arrow from a to b; its label beyond the tip (at_tip) or behind the tail"""
        (x0, y0), (x1, y1) = s.P(*a), s.P(*b); L = math.hypot(x1 - x0, y1 - y0) or 1; ux, uy = (x1 - x0) / L, (y1 - y0) / L
        s.o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.8"/>' % (x0, y0, x1 - ux * 6, y1 - uy * 6, color))
        s.o.append('<polygon points="%.1f,%.1f %.1f,%.1f %.1f,%.1f" fill="%s"/>' % (x1, y1, x1 - ux * 9 - uy * 4.5, y1 - uy * 9 + ux * 4.5, x1 - ux * 9 + uy * 4.5, y1 - uy * 9 - ux * 4.5, color))
        if label:
            sx, sy = (ux, uy) if at_tip else (-ux, -uy); bx, by = (x1, y1) if at_tip else (x0, y0)
            anchor = "middle" if abs(sx) < 0.7 else ("start" if sx > 0 else "end")
            s.text(bx + sx * 8, by + sy * (12 if abs(sx) < 0.7 else 0), label, size, 700, color, anchor)
    def stair(s, p0, p1, width, n, label):
        """a straight flight drawn from p0 to p1 with n treads and an arrow toward p1 (the way the label says: up or down)"""
        dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz); ux, uz = dx / L, dz / L; vx, vz = -uz, ux; hw = width / 2
        s.poly([(p0[0] + vx * hw, p0[1] + vz * hw), (p1[0] + vx * hw, p1[1] + vz * hw), (p1[0] - vx * hw, p1[1] - vz * hw), (p0[0] - vx * hw, p0[1] - vz * hw)], "#FFFFFF", WALL, 1.0)
        for k in range(1, n):
            c = (p0[0] + dx * k / n, p0[1] + dz * k / n); s.line([(c[0] + vx * hw, c[1] + vz * hw), (c[0] - vx * hw, c[1] - vz * hw)], "#8A847C", 0.6)
        s.arrow((p0[0] + ux * 0.5, p0[1] + uz * 0.5), (p1[0] - ux * 0.5, p1[1] - uz * 0.5), None, INK)
        s.note(p0[0] - ux * 1.2, p0[1] - uz * 1.2, label, 8.5, 600, INK)
    def lift(s, c, w=2.2):
        h = w / 2; pts = box(c[0] - h, c[1] - h, c[0] + h, c[1] + h)
        s.poly(pts, "#FFFFFF", WALL, 1.0); s.line([pts[0], pts[2]], "#8A847C", 0.6); s.line([pts[1], pts[3]], "#8A847C", 0.6)
    def scalebar(s, x, y, m=10):
        S = s.S; s.o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2"/>' % (x, y, x + m * S, y, INK))
        for k in (0, m / 2, m):
            s.o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.5"/>' % (x + k * S, y - 4, x + k * S, y + 4, INK)); s.text(x + k * S, y + 14, "%g" % k + (" m" if k == m else ""), 10)
    def toward_palace(s, x, y):
        s.o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.6"/><polygon points="%.1f,%.1f %.1f,%.1f %.1f,%.1f" fill="%s"/>' % (x, y - 14, x, y + 6, INK2, x, y + 14, x - 5, y + 4, x + 5, y + 4, INK2))
        s.text(x + 9, y, "toward the palace and the start", 10, 400, INK2, "start")
    def save(s, name): s.o.append("</svg>"); open(os.path.join(OUT, name), "w").write("\n".join(s.o)); return name


# ------------------------------------------------------------------------------------------------- T-06 the Crescent
def crescent():
    C = R.CRESCENT; r0, r1, rc, A0, A1 = C["r0"], C["r1"], C["rc"], C["a0"], C["a1"]
    W = 1080; d = Plan(W, 990, "T-06 · The Crescent, the Academy: floor plans", "The palace's dome at the bottom, the garden at the top. Classrooms face the garden; the corridor runs along the dome side.")
    ST, LIFT = 3.0, (50.6, -3.6)                                           # the stair's angle; the lift (radius, angle), the same on both floors
    for fl, title, y0 in (("upper", "Upper floor · level with the palace's floor and the back terrace", 78), ("lower", "Lower floor · 4.2 m down, level with the garden's first terrace", 600)):
        d.text(24, y0, title, 13, 700, anchor="start"); d.frame(W / 2, y0 + 18, 0.0, -62.0, 8.4)
        if fl == "upper":                                                  # the dome's back, the back door, the back terrace
            d.poly(sector(17.0, 28.0, -58, 58), "#ECE9E2", "#9C968C", 1.0); d.line([polar(28.0, a) for a in range(-58, 59, 2)], "#77706A", 2.4)
            d.note(0, -20.5, "T-01 Math Palace (the dome)", 10, 400)
            d.poly(sector(28.0, r0, A0, A1), FILL["outside"], "#9C968C", 0.9)
            bd = R.GARDEN["back_door"]; d.room("T09-04", box(-bd["w"] / 2, -26.6, bd["w"] / 2, -26.6 - bd["d"]), "move", area=False)
            for sg in (-1, 1): d.note(sg * 25, -35.5, "T09-01 back terrace", 10.5, 700, INK2, rot=sg * 35)
            d.arrow((0, -31.0), (0, -45.4))
        for rm in [r for r in R.CRESCENT_ROOMS if r["floor"] == fl]:
            a0, a1 = rm["a"]; am = (a0 + a1) / 2
            if rm.get("band") == "corridor":
                for s0, s1 in ((A0, -6.0), (6.0, A1)): d.room(rm["code"], sector(r0, rc, s0, s1), "move", at=polar((r0 + rc) / 2, (s0 + s1) / 2), rot=(s0 + s1) / 2, size=9)
                continue
            hall = rm["code"] in ("T06-01", "T06-10"); ri = r0 if hall else rc
            d.room(rm["code"], sector(ri, r1, a0, a1), rm["kind"], rm.get("short") if (a1 - a0) < 10 else rm["name"], at=polar(47.5 if hall else (ri + r1) / 2, am),
                   rot=am, room_w=(10 if hall else (ri + r1) / 2 * (a1 - a0) * D2R))
            if not hall:                                                   # its door from the corridor, at the end nearer the hall
                ad = a1 - 2.2 if am < 0 else a0 + 2.2; d.door(polar(rc, ad), (math.cos(ad * D2R), math.sin(ad * D2R)), (math.sin(ad * D2R), -math.cos(ad * D2R)), 1.0)
            if rm["kind"] != "service": d.line([polar(r1, a0 + (a1 - a0) * k / 12) for k in range(13)], GLASS, 2.6)
        # the hall: the stair between the floors, the lift, open to below on the upper floor
        if fl == "upper":
            d.stair(polar(51.4, ST), polar(58.2, ST), 2.4, 22, "down"); d.poly(sector(53.4, 59.6, -5.6, 0.9), "none", "#77706A", 0.8, "4 3")
            d.note(*polar(57.4, -2.4), "open to below", 8.5, 400, INK2, rot=-2)
        else:
            d.stair(polar(58.2, ST), polar(51.4, ST), 2.4, 22, "up")
        d.lift(polar(*LIFT)); d.note(*polar(LIFT[0] + 2.0, LIFT[1]), "lift", 8, 600, INK)
        for sg in (-1, 1):                                                 # an exit at each end of the corridor
            d.arrow(polar((r0 + rc) / 2, sg * (A1 - 1.0)), polar((r0 + rc) / 2, sg * (A1 + 4.0)), "exit", "#2E7D4F", 9, at_tip=True)
        if fl == "upper":
            d.line([polar(r0, a) for a in range(int(A0), int(A1) + 1, 2)], GLASS, 2.2)      # the corridor's glass onto the terrace
            d.note(*polar(43.6, 9.0), "doors in from the terrace", 9, 700, RED, rot=9)
        else:
            d.line([polar(r0 - 0.4, a) for a in range(int(A0), int(A1) + 1, 2)], "#8A847A", 3.4)
            d.note(*polar(43.9, -20), "retaining wall", 9, 400, INK2, rot=-20)
            d.arrow(polar(59.2, 0), polar(66.5, 0), "out to the garden", RED, 9.5, at_tip=True)
    d.scalebar(24, 958, 10); d.toward_palace(W - 260, 955)
    return d.save("svg-crescent.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-07 Infinity Hall
def infinity():
    G = R.INFINITY; ha = G["half_angle"]; t = G["turn"] * D2R; ct, st = math.cos(t), math.sin(t)
    def L(x, y): return (G["lat"] + x * ct + y * st, G["rad"] + y * ct - x * st)       # local (y toward the audience) to the palace frame
    def Ld(x, y): return (x * ct + y * st, y * ct - x * st)
    def fan(q0, q1, a0, a1, n=30):
        return [L(q1 * math.sin(a * D2R), q1 * math.cos(a * D2R)) for a in [a0 + (a1 - a0) * k / n for k in range(n + 1)]] + \
               [L(q0 * math.sin(a * D2R), q0 * math.cos(a * D2R)) for a in [a1 - (a1 - a0) * k / n for k in range(n + 1)]]
    d = Plan(820, 690, "T-07 · Infinity Hall: plan", "Built into the slope: the stage at the low end (top), the rows climbing toward the palace, the foyer at the top of the rows.")
    d.frame(410, 112, G["lat"], G["rad"] - 6.0, 10.0)
    rs0, rs1 = G["r_seats"]; rf0, rf1 = G["r_foyer"]
    d.room("T07-02", fan(rs0, rs1, -ha, ha), "hall", None, at=L(0, 19.5))
    d.o.pop()                                                             # the label goes on top of the rows, below
    for k in range(G["rows"] + 1):
        q = rs0 + (rs1 - rs0) * k / G["rows"]; d.line([L(q * math.sin(a * D2R), q * math.cos(a * D2R)) for a in range(-int(ha), int(ha) + 1, 2)], "#9A8672", 0.6)
    for a in (-13.0, 13.0): d.poly(fan(rs0, rs1, a - 1.1, a + 1.1, 4), FILL["move"], "#9A8672", 0.6)
    d.note(*L(0, 18.6), "T07-02", 12, 700, INK); d.note(*L(0, 20.3), "Auditorium · 240 seats", 10, 400, INK2)
    d.room("T07-03", fan(0.6, G["r_stage"], -ha * 0.85, ha * 0.85), "hall", "Stage", at=L(0, 3.9), room_w=8)
    d.line([L(-7.2, 0.3), L(7.2, 0.3)], INK, 3.4); d.note(*L(0, -0.9), "screen 14 m", 9, 400, INK2)
    d.room("T07-04", [L(-7, -1.8), L(7, -1.8), L(7, -5.8), L(-7, -5.8)], "staff", "Green room", room_w=14)
    d.door(L(5.4, -1.8), Ld(1, 0), Ld(0, -1), 0.9)
    d.room("T07-01", fan(rf0, rf1, -ha + 9, ha - 9), "move", "Foyer", at=L(33 * math.sin(-21 * D2R), 33 * math.cos(-21 * D2R)), rot=21, room_w=10)
    for sg in (-1, 1):
        a0, a1 = (ha - 9, ha) if sg > 0 else (-ha, -ha + 9); am = (a0 + a1) / 2
        d.room("T07-06", fan(rf0, rf1, a0, a1, 6), "service", "WC", at=L(33 * math.sin(am * D2R), 33 * math.cos(am * D2R)), room_w=4.5)
    d.poly(fan(rf0 + 0.6, rf1 - 0.6, -14, 14, 10), "none", "#2A6E8E", 1.3, "5 3"); d.note(*L(0, 32.4), "T07-05", 9.5, 700, "#2A6E8E"); d.note(*L(0, 33.9), "booth above", 8.5, 400, "#2A6E8E")
    d.areas["T07-05"] = area_of(fan(rf0 + 0.6, rf1 - 0.6, -14, 14, 10))
    for a in (-13.0, 13.0): d.door(L(rf0 * math.sin(a * D2R), rf0 * math.cos(a * D2R)), Ld(math.cos(a * D2R), -math.sin(a * D2R)), Ld(-math.sin(a * D2R), -math.cos(a * D2R)), 1.6)
    d.door(L(0, rf1), Ld(1, 0), Ld(0, -1), 2.0)
    d.arrow(L(0, rf1 + 6.5), L(0, rf1 + 0.4), "in from the garden's first terrace")
    d.scalebar(24, 660, 10); d.toward_palace(560, 655)
    return d.save("svg-infinity.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-08 Garden of Primes
def greenhouse():
    G = R.GREENHOUSE; vw, vl, lw, ll = G["vault_w"], G["vault_l"], G["link_w"], G["link_l"]
    la = G["lat"] - (2 * vw + lw) / 2; lb = la + vw + lw; ra, rn = G["rad"] - vl / 2, G["rad"] + vl / 2       # ra: the far end, rn: the near end (doors)
    d = Plan(620, 680, "T-08 · Garden of Primes: plan", "Two glass vaults 12 m wide and 40 m long down the slope, the potting room between them; the doors at the near end.")
    d.frame(130, 92, la, ra, 11.0)
    A, B = box(la, ra, la + vw, rn), box(lb, ra, lb + vw, rn); tea, grotto = box(la, rn - 6, la + vw, rn), box(lb, ra, lb + vw, ra + 7)
    d.poly(A, FILL["garden"]); d.poly(B, FILL["garden"])
    d.areas.update({"T08-01": area_of(A) - area_of(tea), "T08-02": area_of(B) - area_of(grotto), "T08-03": area_of(grotto), "T08-05": area_of(tea)})
    for k in range(5):                                                     # raised beds, lettuce towers down the middle
        q = ra + 1.6 + k * 5.6
        for x in (1.2, vw - 4.2): d.poly(box(la + x, q, la + x + 3.0, q + 4.2), "#B5D29F", "#6F8F5A", 0.8)
    for k in range(4): d.circ((la + vw / 2, ra + 4.4 + k * 5.6), 0.6, "#8FB878", "#5F844C", 0.7)
    zig = [(lb + 3.0, rn), (lb + 3.0, rn - 5), (lb + 9.0, rn - 5), (lb + 9.0, rn - 12), (lb + 3.0, rn - 12), (lb + 3.0, rn - 23), (lb + 9.0, rn - 23), (lb + 9.0, ra + 7)]
    d.line(zig, "#C9B48F", 7.5, cap="round"); d.line(zig, "#EADDC2", 5.5, cap="round")
    for x, q in ((1.3, -2.6), (10.7, -2.6), (6.0, -8.5), (1.3, -15.0), (10.7, -17.0), (6.0, -19.5), (1.3, -27.0), (10.7, -28.0)): d.circ((lb + x, rn + q), 1.2, "#97C283", "#5F844C", 0.8)
    d.poly(tea, FILL["lounge"], WALL, 0.9, "4 3"); d.poly(grotto, "#A6CDB1", WALL, 0.9, "4 3")
    for k in range(3): d.circ((la + 2.6 + k * 3.4, rn - 2.4), 0.55, "#FFFFFF", WALL, 0.8)
    for k in range(5): d.circ((lb + 1.6 + k * 2.2, ra + 1.6 + (k % 2) * 2.2), 0.85, "#8C8C84", "#5E5E58", 0.7)
    d.room("T08-04", box(la + vw, G["rad"] - ll / 2, lb, G["rad"] + ll / 2), "service", None, at=(la + vw + lw / 2, G["rad"] - 3.8))
    d.note(la + vw + lw / 2, G["rad"] - 0.2, "potting", 8.5, 400, INK2, rot=-90); d.note(la + vw + lw / 2, G["rad"] + 3.8, "seed bank", 8.5, 400, INK2, rot=-90)
    for x, inw in ((la + vw, 1), (lb, -1)): d.door((x, G["rad"] + 1.8), (0, 1), (inw, 0), 1.0)
    d.note(la + vw / 2, G["rad"] - 1.5, "T08-01", 12, 700, INK); d.note(la + vw / 2, G["rad"] + 0.1, "Kitchen garden", 10, 400, INK2)
    d.note(lb + vw / 2, G["rad"] + 1.4, "T08-02", 12, 700, INK); d.note(lb + vw / 2, G["rad"] + 3.0, "Orchard vault", 10, 400, INK2)
    d.note(la + vw / 2, rn - 4.6, "T08-05 Tea corner", 9.5, 700, INK); d.note(lb + vw / 2, ra + 5.2, "T08-03 Fern grotto", 9.5, 700, INK)
    d.poly(box(la - 2, rn + 0.6, lb + vw + 2, rn + 2.8), "#E2D9C6", "#B9AE98", 0.8)
    for x in (la + vw / 2, lb + 3.0): d.door((x, rn), (1, 0), (0, -1), 1.6)
    d.note(lb + vw + 2.6, rn + 1.7, "garden path", 9, 400, INK2, "start")
    d.arrow((la + vw + lw / 2, rn + 6.5), (la + vw + lw / 2, rn + 3.1), "in from the garden")
    d.scalebar(24, 650, 10); d.toward_palace(380, 645)
    return d.save("svg-greenhouse.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-09 Fibonacci Garden
def garden():
    G = R.GARDEN; C = R.CRESCENT
    d = Plan(720, 720, "T-09 · Fibonacci Garden: plan", "From the palace's back door across the back terrace, through the Crescent and down three terraces to the observatory.")
    d.frame(360, 84, 0.0, -168.0, 3.5)
    d.poly(sector(16, 28, -60, 60), "#ECE9E2", "#9C968C", 1.0); d.note(0, -19, "T-01 Math Palace", 10, 400)
    bt = sector(28, C["r0"], C["a0"], C["a1"]); d.poly(bt, FILL["outside"], "#9C968C", 0.9); d.note(0, -37.5, "T09-01 back terrace", 10, 700, INK)
    d.poly(sector(C["r0"], C["r1"], C["a0"], C["a1"]), "#EBDFC6", WALL, 1.0); d.note(*polar(53, -33), "T-06 the Crescent", 9.5, 700, INK, rot=-33)
    bd = G["back_door"]; d.poly(box(-bd["w"] / 2, -26.6, bd["w"] / 2, -30.6), FILL["move"]); d.note(4.5, -28.6, "T09-04", 9, 700, INK, "start")
    top = [polar(C["r1"], a) for a in range(37, -38, -2)]
    prev = None
    for k, (rad_b, hw, lv) in enumerate(G["terraces"]):
        pts = top + [(-hw, rad_b), (hw, rad_b)] if k == 0 else [(-prev[1], prev[0]), (prev[1], prev[0]), (hw, rad_b), (-hw, rad_b)]
        d.poly(pts, "#DCEACB", "#6F8F5A", 1.1)
        d.note(hw - 2.0, (prev[0] if prev else -60.0) - 2.6, "terrace %d · %+.1f m" % (k + 1, lv), 9, 400, "#4E6E3A", "end")
        prev = (rad_b, hw)
    sp = G["spiral"]; phi = (1 + 5 ** 0.5) / 2; pts = []
    for k in range(160):
        th = k / 159 * sp["turns"] * 2 * math.pi; q = sp["a"] * phi ** (th / (math.pi / 2)); pts.append((sp["lat"] + q * math.cos(th) * 0.5, sp["rad"] + q * math.sin(th) * 0.5))
    d.poly(box(-2.0, -60.0, 2.0, -128.0), "#EFE7D6", "#B9AE98", 0.8)
    for rb, hw, lv in G["terraces"][:-1]: [d.line([(-2.0, rb + k * 0.6), (2.0, rb + k * 0.6)], "#9C9282", 0.7) for k in range(-3, 4)]
    d.note(-3.0, -70.0, "the axis: steps at each terrace", 8.5, 400, INK2, "end")
    d.line(pts, "#B0623F", 2.2); d.note(sp["lat"] + 3.0, sp["rad"] + 2.2, "T09-02 spiral path", 9.5, 700, "#8A4A2E", "start")
    for sc in G["sculptures"]:
        d.circ((sc["lat"], sc["rad"]), 1.4, "#B58B4C", "#5C4626", 1.0); right = sc["lat"] > 0
        d.note(sc["lat"] + (2.6 if right else -2.6), sc["rad"], sc["name"], 9, 400, "#5C4626", "start" if right else "end")
    d.note(0, -132.0, "T09-03 sculpture walk: the four sculptures", 9, 700, "#5C4626")
    pz = G["plaza"]; d.poly(box(-26, pz[0], 26, pz[1]), FILL["outside"], "#9C968C", 0.9, "4 3"); d.note(-24, pz[1] + 2.6, "plaza %+.1f m" % pz[2], 9, 400, INK2, "start")
    O = R.OBSERVATORY; d.circ((O["lat"], O["rad"]), O["r"], FILL["tech"]); d.note(O["lat"], O["rad"], "T-10", 10, 700, INK)
    d.note(-44, -108, "← T-07 Infinity Hall", 9.5, 700, INK2, "end"); d.note(44, -100, "T-08 Garden of Primes →", 9.5, 700, INK2, "start")
    d.scalebar(24, 690, 20); d.toward_palace(470, 686)
    return d.save("svg-garden.svg"), {"T09-01": area_of(bt), "T09-04": bd["w"] * bd["d"]}


# ------------------------------------------------------------------------------------------------- T-10 Observatory
def observatory():
    G = R.OBSERVATORY; r = G["r"]; c = (G["lat"], G["rad"])
    d = Plan(980, 350, "T-10 · Observatory: the four levels", "A tower 18 m across at the foot of the garden; the stair and the lift on the far side; the door faces the palace.")
    names = {0: ("T10-01", "Planet hall", "move"), 1: ("T10-02", "Classroom", "class"), 2: ("T10-03", "Control room", "tech")}
    for lv in range(4):
        cx = 140 + lv * 235; d.frame(cx, 192, c[0], c[1], 8.0)
        if lv < 3:
            code, nm, kind = names[lv]; d.room(code, circle(c, r), kind, nm, at=(c[0], c[1] + (-2.6 if lv == 1 else 2.0)), room_w=12)
        else:
            d.room("T10-05", circle(c, r), "lounge", None, at=(c[0], c[1] + 6.9)); dome = circle(c, G["dome_r"])
            d.room("T10-04", dome, "tech", None, at=(c[0], c[1] + 2.2)); d.areas["T10-05"] -= area_of(dome)
            d.circ((c[0], c[1] - 0.6), 0.9, "#FFFFFF", WALL, 0.9); d.line([(c[0] - 0.5, c[1] - G["dome_r"]), (c[0] + 0.5, c[1] - G["dome_r"])], RED, 4)
            d.note(c[0] + 2.6, c[1] - 0.6, "pier", 8, 400, INK2, "start")
        core = (c[0] - 1.0, c[1] - r + 2.4)
        d.circ(core, 1.7, "#FFFFFF", WALL, 0.9); d.line([core, (core[0] + 1.7, core[1])], "#8A847C", 0.6); d.line([core, (core[0], core[1] + 1.7)], "#8A847C", 0.6)
        d.lift((c[0] + 2.4, c[1] - r + 2.7), 1.8)
        if lv == 1:
            for k in range(4): d.line([(c[0] - 4.6 + k * 0.4, c[1] + 0.6 + k * 1.5), (c[0] + 4.6 - k * 0.4, c[1] + 0.6 + k * 1.5)], "#9A8672", 1.6)
            d.line([(c[0] - 3.0, c[1] + 7.4), (c[0] + 3.0, c[1] + 7.4)], INK, 2.6)
        if lv == 0:
            d.door((c[0], c[1] + r), (1, 0), (0, -1), 1.8); d.arrow((c[0], c[1] + r + 4.0), (c[0], c[1] + r + 0.3))
            for k, q in enumerate((0.25, 0.32, 0.45, 0.4, 1.2, 1.05, 0.75, 0.7)): d.circ((c[0] - 5.0 + k * 1.45, c[1] - 1.6), q * 0.6, "#C9A27C" if k != 3 else "#C1663C", "#7A5C3E", 0.6)
        d.text(cx, 192 - (r + 1.6) * 8 - 6, "level %d · +%.1f m" % (lv, lv * G["floor_h"]), 10, 600, INK2)
    d.scalebar(24, 322, 5); d.toward_palace(700, 320)
    return d.save("svg-observatory.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-11 Sports Dome
def sports():
    G = R.SPORTS; r = G["r"]; c = (G["lat"], G["rad"]); cl, cw = G["court"]; gd = G["gallery"][1]
    d = Plan(640, 540, "T-11 · Low-gravity Sports Dome: plan", "A dome 34 m across: the court in the middle, the climbing wall on the far side, a gallery over the entrance.")
    d.frame(290, 290, c[0], c[1], 10.0)
    d.poly(circle(c, r, 90), FILL["sport"])
    xg = c[0] + r - gd; yg = math.sqrt(r * r - (r - gd) ** 2)
    under = [(c[0] + r * math.sin(a * D2R), c[1] - r * math.cos(a * D2R)) for a in range(int(90 - math.degrees(math.atan2(yg, r - gd))), int(90 + math.degrees(math.atan2(yg, r - gd))) + 1, 2)]
    under = [(xg, c[1] - yg)] + under + [(xg, c[1] + yg)]
    d.poly(under, FILL["service"], WALL, 1.0); d.line([(xg, c[1] - 1.5), (xg + gd, c[1] - 1.5)], WALL, 1.0); d.line([(xg, c[1] + 4.5), (xg + gd - 0.6, c[1] + 4.5)], WALL, 1.0)
    seg = lambda q0, q1: sum((math.sqrt(max(0.0, r * r - q * q)) - (r - gd)) * 0.01 for q in [q0 + 0.01 * (k + 0.5) for k in range(int((q1 - q0) / 0.01))])
    d.areas.update({"T11-04": seg(-yg, -1.5), "T11-05": seg(4.5, yg)})
    d.areas["T11-03"] = area_of(under) + 1.2 * 2 * yg
    court = box(c[0] - cw / 2, c[1] - cl / 2, c[0] + cw / 2, c[1] + cl / 2); d.poly(court, "#E8C99E", "#8A6A44", 1.0); d.areas["T11-01"] = cl * cw
    d.line([(c[0] - cw / 2, c[1]), (c[0] + cw / 2, c[1])], "#8A6A44", 0.9); d.circ(c, 1.8, "none", "#8A6A44", 0.9)
    for sg in (-1, 1): d.circ((c[0], c[1] + sg * (cl / 2 - 1.6)), 0.45, "#FFFFFF", "#8A6A44", 0.9)
    d.note(c[0], c[1] - 5.6, "T11-01", 12, 700, INK); d.note(c[0], c[1] - 4.0, "Court 24 × 13 m", 10, 400, INK2)
    wall = [(c[0] - (r - 0.5) * math.cos(a * D2R), c[1] + (r - 0.5) * math.sin(a * D2R)) for a in range(-32, 33, 4)]
    d.line(wall, "#7A5C3E", 7); d.note(c[0] - r + 3.0, c[1], "T11-02 climbing wall", 9.5, 700, INK, rot=-90)
    d.line([(xg - 1.2, c[1] - yg + 0.6), (xg - 1.2, c[1] + yg - 0.6)], "#2A6E8E", 1.4, "5 3")
    gm = xg + gd / 2 - 0.5
    d.note(gm, c[1] - 6.0, "T11-04", 9.5, 700, INK); d.note(gm, c[1] - 4.6, "changing", 8.5, 400, INK2)
    d.note(gm, c[1] + 0.0, "lobby", 8.5, 400, INK2)
    d.note(gm, c[1] + 7.0, "T11-05", 9.5, 700, INK); d.note(gm, c[1] + 8.4, "store", 8.5, 400, INK2)
    d.note(c[0] + 6.0, c[1] - r - 1.4, "T11-03 fitness gallery above (dashed edge)", 9, 700, "#2A6E8E", "start")
    d.door((c[0] + r, c[1] + 0.0), (0, 1), (-1, 0), 2.0); d.arrow((c[0] + r + 5.5, c[1]), (c[0] + r + 0.3, c[1]), "in from the plaza")
    d.scalebar(24, 512, 10); d.toward_palace(330, 508)
    return d.save("svg-sports.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-12 Robotics and Rover Hangar
def hangar():
    G = R.HANGAR; w, dd, bd = G["w"], G["d"], G["bay_depth"]; l0, l1 = G["lat"] - w / 2, G["lat"] + w / 2; rf, rn = G["rad"] - dd / 2, G["rad"] + dd / 2
    d = Plan(640, 510, "T-12 · Robotics and Rover Hangar: plan", "The three rover bays open onto the test yard (right); the suit room beside them; the lab and the workshop on the garden side.")
    d.frame(92, 112, l0, rf, 13.0)
    lb = l1 - bd; c0, c1 = lb - 8.0, lb - 6.0; rs = rf + 15.0                # bays from lb; suit room and store from c1; corridor c0..c1; lab and workshop to c0
    d.poly(box(l0, rf, l1, rn), FILL["move"])
    for k in range(3):
        q0, q1 = rf + k * dd / 3, rf + (k + 1) * dd / 3; qm = (q0 + q1) / 2
        d.poly(box(lb, q0, l1, q1), FILL["tech"]); d.line([(l1, q0 + 0.6), (l1, q1 - 0.6)], RED, 4.5)
        d.poly(box(lb + 3.0, qm - 1.3, lb + 10.4, qm + 1.3), "#FFFFFF", "#6B7177", 0.8, "3 2"); d.note(lb + 6.7, qm, "rover", 8.5, 400, INK2)
        d.note(lb + 12.3, qm, "bay %d" % (k + 1), 9, 600, INK2, rot=-90)
    d.areas["T12-01"] = bd * dd; d.note(lb + 6.7, rf - 1.2, "T12-01 rover bays", 10, 700, INK)
    d.room("T12-04", box(c1, rf, lb, rs), "tech", "Suit room", room_w=6)
    d.room("T12-05", box(c1, rs, lb, rn), "service", "Store", room_w=6)
    d.room("T12-02", box(l0, rf, c0, rf + 13), "lab", "Robotics lab", room_w=12)
    d.room("T12-03", box(l0, rf + 13, c0, rn), "tech", "Workshop", room_w=12)
    d.note((c0 + c1) / 2, G["rad"] - 2, "corridor", 8.5, 400, INK2, rot=-90)
    for k in range(2): d.circ((lb - 0.35, rf + dd / 6 + k * dd / 3), 0.45, "#FFFFFF", WALL, 0.9)          # a suitport onto bays 1 and 2
    d.note(lb - 1.0, rf + 3.6, "suitports", 8, 400, INK2, rot=-90); d.door((lb, rf + 12.4), (0, 1), (-1, 0), 1.2)
    d.door(((c0 + c1) / 2, rn), (1, 0), (0, -1), 1.6); d.arrow(((c0 + c1) / 2, rn + 4.8), ((c0 + c1) / 2, rn + 0.3), "in from the greenhouse path")
    for x, q, inw in ((c0, rf + 7.0, -1), (c0, rf + 17.5, -1), (c1, rf + 9.5, 1), (c1, rf + 18.5, 1)): d.door((x, q), (0, 1), (inw, 0), 1.0)
    d.line([(l0, rf + 1), (l0, rf + 12)], GLASS, 3)
    d.note(l1 + 1.2, G["rad"], "test yard T-13 →", 10, 700, INK2, "start")
    d.scalebar(24, 482, 10); d.toward_palace(400, 478)
    return d.save("svg-hangar.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-14 Pod Port and T-15 terminal
def pods():
    T = R.TERMINAL; PP = R.PODPORT; w, dd = T["w"], T["d"]; l0, l1 = T["lat"] - w / 2, T["lat"] + w / 2; rf, rn = T["rad"] - dd / 2, T["rad"] + dd / 2
    d = Plan(760, 580, "T-14 · Pod Port and T-15 · terminal: plan", "Six pads 14 m across, pods parked on four; they taxi to the terminal's boarding collars, so nobody needs a suit.")
    d.frame(380, 76, 20.0, -228.0, 6.0)
    TW = "#6B7076"
    for q0, q1 in ((-210.5, -205.5), (-188.0, -183.0)): d.poly(box(-14, q0, 54, q1), TW, TW, 0.5); d.line([(-14, (q0 + q1) / 2), (54, (q0 + q1) / 2)], "#F2C14E", 1.3, "7 5")
    for x in (7.0, 33.0): d.poly(box(x - 2.5, -205.5, x + 2.5, -188.0), TW, TW, 0.5); d.line([(x, -205.5), (x, -188.0)], "#F2C14E", 1.3, "7 5")
    for i, (lat, rad) in enumerate(PP["pads"]):
        d.circ((lat, rad), PP["pad_r"], FILL["pad"], "#FFFFFF", 2.2); d.circ((lat, rad), PP["pad_r"] - 1.0, "none", "#F2C14E", 1.6)
        d.areas["T14-P%d" % (i + 1)] = math.pi * PP["pad_r"] ** 2
        x, y = d.P(lat, rad); d.text(x, y - 27, "T14-P%d" % (i + 1), 9.5, 700, "#FFFFFF")
        if i in PP["parked"]:
            d.poly([(lat - 1.0, rad - 3.0), (lat + 1.0, rad - 3.0), (lat + 1.3, rad + 2.6), (lat - 1.3, rad + 2.6)], "#F4F4F1", "#1D2124", 0.9)
            for sx in (-1, 1):
                for sz in (-1, 1): d.circ((lat + sx * 2.6, rad + sz * 2.0), 1.15, "none", "#E8E8E4", 1.0)
        d.circ((lat + PP["pad_r"] + 1.3, rad - PP["pad_r"] + 2.0), 0.5, "#F2C14E", "#3A3A36", 0.8)
    xs = (l0, l0 + 12, l0 + 17, l0 + 21.5, l1)
    for k, rm in enumerate(R.TERMINAL_ROOMS[:4]):
        nw = xs[k + 1] - xs[k] < 7; d.room(rm["code"], box(xs[k], rf, xs[k + 1], rn), ("lounge", "move", "tech", "staff")[k], rm["name"].split(" ")[0], rot=-90 if nw else 0, room_w=dd if nw else xs[k + 1] - xs[k], size=10)
    d.line([(l0, rf), (l0 + 12, rf)], GLASS, 3); d.line([(l0, rf), (l0, rn)], GLASS, 3)
    for gx in (l0 + 4.0, l0 + 9.0): d.poly(box(gx - 1.2, rf - 3.2, gx + 1.2, rf), FILL["move"], WALL, 1.0)
    d.areas["T15-05"] = 2 * 2.4 * 3.2; d.note(l0 - 1.0, rf - 1.6, "T15-05 boarding collars", 9, 700, INK, "end")
    for x, inw in ((xs[1], 1), (xs[2], 1), (xs[3], 1)): d.door((x, T["rad"] + 2.5), (0, 1), (inw, 0), 1.0)
    d.door((T["lat"] + 1.5, rn), (1, 0), (0, -1), 1.8); d.arrow((T["lat"] + 1.5, rn + 5.5), (T["lat"] + 1.5, rn + 0.3), "in from the campus")
    d.note(55, -208, "taxi lanes", 9, 400, "#B08A2E", "start")
    d.scalebar(24, 548, 10); d.toward_palace(520, 544)
    return d.save("svg-pods.svg"), d.areas


# ------------------------------------------------------------------------------------------------- pages
os.makedirs(OUT, exist_ok=True)


def page(fn, title, body):
    nav = "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if h == fn else "", n) for h, n in R.PLAN_NAV)
    open(os.path.join(OUT, fn), "w").write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s · TTMath campus, phase 2</title><meta name="robots" content="noindex"><link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="plan.css"></head>
<body><header><div class="in"><div class="crumb"><a href="../../">Mars – No Way Home</a> · <a href="../">TTMath on Mars</a> · <a href="index.html">TTMath campus, phase 2</a></div><nav>%s</nav></div></header>
<main>%s</main></body></html>
""" % (E(title), nav, body))


def table(rooms, areas):
    def size(c):
        a = areas.get(c)
        return ("%d m²" % (round(a / 10) * 10 if a >= 100 else round(a))) if a else ""
    rows = "".join('<tr><td class="code">%s</td><td><b>%s</b></td><td>%s%s</td><td class="n">%s</td></tr>' % (
        r["code"], E(r["name"]), E(r["use"]), (" <i>Also: %s</i>" % E(r["also"])) if r.get("also") else "", size(r["code"])) for r in rooms)
    return '<div class="tw"><table><thead><tr><th>Code</th><th>Room</th><th>What it is for</th><th>Size</th></tr></thead><tbody>%s</tbody></table></div>' % rows


def fig(src, cap): return '<figure><a href="%s"><img src="%s" alt="%s"></a><figcaption>%s</figcaption></figure>' % (src, src, E(cap), cap)


PODS_MORE = """<ul><li><b>The pads:</b> dark, with white markings, a ring of lights round each and a charging mast beside it; taxi lanes to the terminal.</li>
<li><b>The pods:</b> two-seat craft about 6 m long, a teardrop cabin in white composite with a tinted canopy, four big ducted rotors (Mars's thin air needs large blades), landing skids and navigation lights: the proportions and detail of a real aircraft, nothing toy-like.</li>
<li><b>Ready for later:</b> the pads, chargers and collars are sized for bigger pods, and two more pads fit on the plain beyond.</li></ul>"""
SPECS = [
    ("crescent.html", "T-06 · The Crescent: the Academy", "Eight classrooms named after mathematicians, a study hall, a competition room, a games room and lounge, the teachers' room and washrooms on both floors, in a crescent that wraps the back of the dome. The upper floor opens onto the palace's back terrace; the lower floor onto the garden.", crescent, R.CRESCENT_ROOMS, ""),
    ("infinity.html", "T-07 · Infinity Hall", "A lecture theatre for 240 on the west side of the garden, built into the slope like a Greek theatre.", infinity, R.INFINITY_ROOMS, ""),
    ("greenhouse.html", "T-08 · Garden of Primes", "Two glass vaults full of real plants on the east side of the garden.", greenhouse, R.GREENHOUSE_ROOMS, ""),
    ("garden.html", "T-09 · Fibonacci Garden", "The garden from the palace's new back door down the slope to the observatory.", garden, R.GARDEN_AREAS, ""),
    ("observatory.html", "T-10 · Observatory", "A tower at the foot of the garden on the palace's axis, with a telescope dome on top.", observatory, R.OBSERVATORY_ROOMS, ""),
    ("sports.html", "T-11 · Low-gravity Sports Dome", "Games in Mars gravity, a climbing wall and a fitness gallery under one dome.", sports, R.SPORTS_ROOMS, ""),
    ("hangar.html", "T-12 · Robotics and Rover Hangar", "Where the rovers live and students build robots, next to the test yard (T-13).", hangar, R.HANGAR_ROOMS, ""),
    ("pods.html", "T-14 · Pod Port and T-15 · terminal", "A parking field for flying pods with its terminal, at the far end of the campus on the plain, where nothing on the ground can be seen from the start: built now so the campus is ready for travel by air.", pods, R.PODPORT_ROOMS + R.TERMINAL_ROOMS, PODS_MORE),
]
if __name__ == "__main__":
    AREAS = {}
    for fn, title, lede, draw, rooms, more in SPECS:
        src, areas = draw(); AREAS.update(areas)
        page(fn, title, '<h1>%s</h1><p class="lede">%s</p>%s%s%s' % (E(title), E(lede), more, fig(src, "<b>%s</b>, to scale." % E(title.split(" · ")[0])), table(rooms, areas)))
    missing = [r["code"] for b in SPECS for r in b[4] if r["code"] not in AREAS and not r["code"].startswith("T09")]
    indoor = sum(a for c, a in AREAS.items() if not c.startswith(("T09", "T14")) and c not in ("T07-05", "T11-03"))
    print("building pages written:", len(SPECS), "; rooms", sum(len(s[4]) for s in SPECS), "; indoor floor area about", round(indoor), "m2; no size for", missing)
    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)
    json.dump({k: round(v, 1) for k, v in sorted(AREAS.items())}, open(os.path.join(HERE, "data", "room_areas.json"), "w"), indent=0)
    # the data the demo builds from
    keep = ("code", "name", "floor", "a", "kind", "double", "band")
    data = {"crescent": dict(R.CRESCENT, rooms=[{k: v for k, v in r.items() if k in keep} for r in R.CRESCENT_ROOMS]),
            "infinity": R.INFINITY, "greenhouse": R.GREENHOUSE, "garden": R.GARDEN, "observatory": R.OBSERVATORY, "sports": R.SPORTS, "hangar": R.HANGAR,
            "podport": R.PODPORT, "terminal": R.TERMINAL, "suncourt": R.SUNCOURT}
    js = "  /* ===================== Phase 2 data: written by ttmath/tools/campus_buildings.py from campus_rooms.py; do not edit ===================== */\n  var P2 = " + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n"
    open(os.path.join(TT, "src", "blocks", "blk_p2data.js"), "w").write(js)
    print("wrote blk_p2data.js", len(js), "bytes")
