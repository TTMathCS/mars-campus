"""TTMath campus, phase 2: a page per new building with its floor plans and its rooms (from campus_rooms.py), and the
data the demo builds them from (ttmath/src/blocks/blk_p2data.js).
usage: python3 ttmath/tools/campus_buildings.py   (campus_plan.py draws the site plan and the overview pages)
Plans are drawn in the Math Palace's frame like the site plan: the palace and the start toward the bottom of the page,
lat to the right. Room sizes in the tables are measured from the drawn outlines (also saved to data/room_areas.json)."""
import html, json, math, os
import campus_rooms as R
import campus_timetable as TTB
import campus_contests as CTS
HERE = os.path.dirname(os.path.abspath(__file__)); TT = os.path.dirname(HERE); OUT = os.path.join(TT, "plan")
E = html.escape
D2R = math.pi / 180
FILL = {"class": "#EBDFC6", "study": "#DDE7D0", "lab": "#D5E1E8", "compete": "#EBD7C9", "games": "#EBD7C9", "lounge": "#E8DFF0", "staff": "#E4E2DA",
        "service": "#DFDED9", "move": "#F4EFE5", "hall": "#EAD3BF", "tech": "#D8DDE2", "garden": "#D3E6C3", "sport": "#D3E5E9", "pad": "#5B6066", "outside": "#E9E5DA"}
INK, INK2, GLASS, WALL, PAPER, RED = "#24272A", "#4E575B", "#3E86B8", "#2B2926", "#FAF8F3", "#A8432A"


def frange(a, b, st):
    out, v = [], a
    while v <= b + 1e-9: out.append(v); v += st
    return out


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
    C = R.CRESCENT; r0, r1, rc, A0, A1 = C["r0"], C["r1"], C["rc"], C["a0"], C["a1"]; ST, LIFT, ES, GL = C["stair"], C["lift"], C["estair"], R.GALLERY
    HA = 7.0                                                               # the hall's half-angle
    W = 1080; d = Plan(W, 1000, "T-06 · The Crescent, the Academy: floor plans", "The palace's dome at the bottom, the garden at the top. Classrooms face the garden; the corridor runs along the dome side.")
    def flight(ra, rb, a, n, label):                                       # a straight radial flight between radii ra and rb
        d.stair(polar(ra, a), polar(rb, a), ST["w"], n, label)
    for fl, title, y0 in (("upper", "Upper floor · level with the palace's floor and the winter garden", 78),
                          ("lower", "Lower floor · 5.6 m down, level with the garden gallery and the upper garden dome", 566)):
        d.text(24, y0, title, 13, 700, anchor="start"); d.frame(W / 2, y0 + 18, 0.0, -69.0, 8.0)
        if fl == "upper":                                                  # the dome's back, the back door, the winter garden
            d.poly(sector(17.0, 28.0, -58, 58), "#ECE9E2", "#9C968C", 1.0); d.line([polar(28.0, a) for a in range(-58, 59, 2)], "#77706A", 2.4)
            d.note(0, -20.5, "T-01 Math Palace (the dome)", 10, 400)
            d.poly(sector(28.6, r0, -R.WINTER["a"], R.WINTER["a"]), FILL["garden"], "#6F8F5A", 0.9)
            bd = R.GARDEN["back_door"]; d.room("T09-04", box(-bd["w"] / 2, -26.6, bd["w"] / 2, -26.6 - bd["d"]), "move", area=False)
            for sg in (-1, 1): d.note(sg * 25, -35.5, "T09-01 winter garden", 10.5, 700, "#4E6E3A", rot=sg * 35)
            d.note(0, -42.6, "under a glass vault", 9, 400, "#4E6E3A")
            d.arrow((0, -31.0), (0, -45.4))
        for rm in [r for r in R.CRESCENT_ROOMS if r["floor"] in (fl, "both")]:
            a0, a1 = rm["a"]; am = (a0 + a1) / 2
            if rm.get("band") == "corridor" and rm["floor"] != "both":
                for s0, s1 in ((A0 + ES["a"], -HA), (HA, A1 - ES["a"])): d.room(rm["code"], sector(r0, rc, s0, s1), "move", at=polar((r0 + rc) / 2, (s0 + s1) / 2), rot=(s0 + s1) / 2, size=9)
                continue
            if rm["floor"] == "both":                                      # an emergency stair: two flights side by side
                d.room(rm["code"], sector(r0, rc, a0, a1), "move", at=polar(rc + 1.2, am), rot=am, size=8.5, area=(fl == "upper"))
                if fl == "upper": d.areas[rm["code"]] *= 2
                e0, e1 = (a0 + 0.9, a1 - 1.9) if am < 0 else (a1 - 0.9, a0 + 1.9)
                for rr, lab in ((r0 + 0.9, "up" if fl == "lower" else "down"), (rc - 0.9, "")):
                    d.stair(polar(rr, e0 if rr < 48 else e1), polar(rr, e1 if rr < 48 else e0), 1.15, 14, lab)
                continue
            if rm.get("band") == "gallery":
                d.room(rm["code"], sector(r1, GL["r1"], -GL["a"], GL["a"]), "garden", rm["name"], at=polar((r1 + GL["r1"]) / 2, -30), rot=-30, room_w=40)
                d.line([polar(GL["r1"], a) for a in range(-int(GL["a"]), -15, 1)], "#8A847A", 3.4); d.line([polar(GL["r1"], a) for a in range(16, int(GL["a"]) + 1, 1)], "#8A847A", 3.4)
                d.note(*polar(GL["r1"] + 1.4, 34), "low stone wall, glass roof over", 8.5, 400, INK2, rot=34)
                dm = R.DOMES[0]; d.line([(dm["lat"] + dm["r"] * math.sin(t * D2R), dm["rad"] + dm["r"] * math.cos(t * D2R)) for t in range(-26, 27, 2)], "#6F8F5A", 1.4, "6 4")
                d.arrow((0, -GL["r1"] + 3.0), (0, -GL["r1"] - 2.4), None, "#4E6E3A")
                d.note(0, -GL["r1"] - 4.0, "into the upper garden dome (T09-02)", 9, 700, "#4E6E3A")
                continue
            hall = rm["code"] in ("T06-01", "T06-08"); ri = r0 if hall else rc
            d.room(rm["code"], sector(ri, r1, a0, a1), rm["kind"], rm.get("short") if (a1 - a0) < 10 else rm["name"].split(":")[0], at=polar(47.9 if hall else (ri + r1) / 2, am),
                   rot=am, room_w=(10 if hall else (ri + r1) / 2 * (a1 - a0) * D2R))
            if not hall:                                                   # its door from the corridor, at the end nearer the hall
                ad = a1 - 1.6 if am < 0 else a0 + 1.6; d.door(polar(rc, ad), (math.cos(ad * D2R), math.sin(ad * D2R)), (math.sin(ad * D2R), -math.cos(ad * D2R)), 1.0)
            if rm["kind"] != "service": d.line([polar(r1, a0 + (a1 - a0) * k / 12) for k in range(13)], GLASS, 2.6)
            if fl == "lower" and rm["kind"] != "service" and not hall:     # and a glass door onto the garden gallery
                d.door(polar(r1, am), (math.cos(am * D2R), math.sin(am * D2R)), (-math.sin(am * D2R), math.cos(am * D2R)), 1.2)
        # the hall: the stair between the floors (two flights and a landing), the lift; double height over its garden half
        la, lb = ST["landing"]
        if fl == "upper":
            flight(ST["r0"], la, ST["a"], 16, "down"); d.poly(sector(la, lb, ST["a"] - 1.6, ST["a"] + 1.6), "#FFFFFF", WALL, 1.0); flight(lb, ST["r1"], ST["a"], 16, "")
            d.poly(sector(51.0, r1 - 0.3, -HA + 0.3, HA - 0.3), "none", "#77706A", 0.8, "4 3"); d.line([polar(51.0, a / 2) for a in range(-13, 14)], GLASS, 1.6)
            d.note(*polar(58.2, -3.0), "open to below", 8.5, 400, INK2, rot=-3)
        else:
            flight(ST["r1"], lb, ST["a"], 16, "up"); d.poly(sector(la, lb, ST["a"] - 1.6, ST["a"] + 1.6), "#FFFFFF", WALL, 1.0); flight(la, ST["r0"], ST["a"], 16, "")
        d.lift(polar(*LIFT)); d.note(*polar(LIFT[0] - 1.9, LIFT[1]), "lift", 8, 600, INK)
        if fl == "upper":
            d.line([polar(r0, a) for a in range(int(A0), int(A1) + 1, 2)], GLASS, 2.2)      # the corridor's glass onto the winter garden
            d.note(*polar(44.4, 12.0), "doors in from the winter garden", 9, 700, RED, rot=12)
        else:
            d.line([polar(r0 - 0.4, a) for a in range(int(A0), int(A1) + 1, 2)], "#8A847A", 3.4)
            d.note(*polar(44.6, -20), "retaining wall", 9, 400, INK2, rot=-20)
    d.scalebar(24, 968, 10); d.toward_palace(W - 260, 965)
    return d.save("svg-crescent.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-06 the Ring
RING_FILL = {"seminar": "class", "library": "study", "reading": "study", "gate": "hall", "physics": "lab", "maker": "lab", "astro": "lab", "plant": "tech",
             "store": "tech", "kitchen": "service", "dining": "lounge", "cafe": "lounge", "assembly": "hall", "art": "games", "music": "games", "clinic": "staff"}


def ring_kind(k): return RING_FILL.get(k, k)


def ring_sec(a):
    a = ((a + 57.0) % 360.0) - 57.0
    for sc in R.RING["sections"]:
        if sc["a"][0] <= a < sc["a"][1]: return sc
    return R.RING["sections"][0]


def upright(a):
    """a label's rotation along the ring that never reads upside down"""
    a = ((a + 180.0) % 360.0) - 180.0
    return a if -90 <= a <= 90 else a - 180.0 if a > 0 else a + 180.0


def ring():
    C = R.RING; r0, r1, rc = C["r0"], C["r1"], C["rc"]; GL, GR, EN, PD = C["gallery"], R.GARDEN_RING, R.ENTRANCE, R.POD_DOCK
    out, areas = [], {}
    for fl, title, sub, fname in (("upper", "T-06 · The Ring: the upper floor", "Level with the palace's floor and the garden ring. The front, the start's side, at the bottom; behind the dome at the top.", "svg-ring-upper.svg"),
                                  ("lower", "T-06 · The Ring: the lower floor", "5.6 m down, all the way round: the garden gallery behind and on the right, underground on the right front, beside the sunken grove on the left.", "svg-ring-lower.svg")):
        W, H, S = 1120, 1250, 6.3
        d = Plan(W, H, title, sub); d.frame(W / 2, 640, 0.0, 0.0, S)
        G0, G1 = -80.0, 224.0; V0, V1 = GR["grove"]["a"]
        if fl == "upper":
            d.poly(ring_band_pts(GR["r0"], r0, G0, G1), FILL["garden"], "#6F8F5A", 0.9)                       # the garden ring at this level
            d.poly(ring_band_pts(GR["r0"], r0, V0, V1), "#C9DDB4", "#6F8F5A", 0.9, "4 3")                     # the grove, 5.6 m down
            d.note(*polar(37.3, 252), "T09-06 sunken grove, 5.6 m down", 9.5, 700, "#4E6E3A", rot=upright(252))
            for a, t in ((60, "T09-01 garden ring"), (-30, "T09-01 garden ring"), (122, "T09-01 garden ring")): d.note(*polar(37.3, a), t, 10, 700, "#4E6E3A", rot=upright(a))
            sd = GR["sundial"]; d.circ(polar(sd["r"], sd["a"]), 1.4, "#E8D9A8", "#8A6D2E", 1.0); d.note(*polar(sd["r"] - 3.2, sd["a"]), "sundial (T16-01)", 8.5, 400, INK2, rot=upright(sd["a"]))
            d.circ((0, 0), 28.75, "#ECE9E2", "#77706A", 2.0); d.note(0, 0, "T-01 Math Palace", 11, 700)
            d.poly(box(-4.6, 28.0, 4.6, 33.4), "#ECE9E2", "#77706A", 1.0); d.note(0, 31.0, "palace door", 8, 400, INK2)
        else:
            d.poly(ring_band_pts(GR["r0"], r0, V0, V1), FILL["garden"], "#6F8F5A", 0.9)                       # the grove at this level
            d.note(*polar(37.3, 252), "T09-06 sunken grove", 10, 700, "#4E6E3A", rot=upright(252))
            d.circ((0, 0), 28.75, "none", "#9C968C", 1.0, "5 4"); d.note(0, 0, "under the palace", 9, 400, INK2)
            d.note(*polar(37.3, 60), "the garden ring above", 9.5, 400, INK2, rot=upright(60))
        # the Ring's rooms on this floor
        for rm in R.RING_ROOMS:
            on = rm["floor"] == fl or rm["floor"] == "both" or (rm["floor"] == "gate" and fl == "upper")
            if not on or rm.get("band") == "gallery": continue
            a0, a1 = rm["a"]; am = (a0 + a1) / 2; sc = ring_sec(am)
            if rm.get("band") == "corridor":
                if fl == "upper":
                    segs = [(-57, -7), (7, 120), (191, 197)]; band = (r0, rc)
                else:
                    segs = [(-57, -7), (7, 164), (191, 303)]; band = (r0, rc)
                for s0, s1 in segs:
                    d.room(rm["code"], ring_band_pts(band[0], band[1], s0, s1), "move", at=polar((band[0] + band[1]) / 2, (s0 + s1) / 2), rot=upright((s0 + s1) / 2), size=8.5)
                if fl == "upper":
                    for s0, s1 in ((120, 164),):                               # through the rooms under the sloping roof, along the garden glass
                        d.poly(ring_band_pts(r0, rc, s0, s1), "none", "#77706A", 0.8, "4 3")
                continue
            full = rm["kind"] in ("gate",) or rm["code"] in ("T06-01", "T06-08", "T06-35") or (fl == "upper" and sc["kind"] == "low")
            if full: ri, ro = r0, r1
            else: ri, ro = rc, r1
            nm = rm.get("short") if (a1 - a0) < 10 else rm["name"].split(":")[0]
            if rm.get("no"): nm = "%d %s" % (rm["no"], nm)
            d.room(rm["code"], ring_band_pts(ri, ro, a0, a1), ring_kind(rm["kind"]), nm, at=polar((ri + ro) / 2, am), rot=upright(am), room_w=(ri + ro) / 2 * (a1 - a0) * D2R, size=10)
            if rm["floor"] == "both" and fl == "lower": areas[rm["code"]] = areas.get(rm["code"], 0) + area_of(ring_band_pts(ri, ro, a0, a1))
            # the glass: onto the plain (the upper floor where it stands clear), onto the gallery, onto the grove
            glass_out = (fl == "upper" and sc["kind"] == "two") or (fl == "lower" and GL["a"][0] <= am <= GL["a"][1])
            if rm["kind"] not in ("service", "move", "plant", "store", "kitchen") and glass_out: d.line([polar(r1, a0 + (a1 - a0) * k / 12) for k in range(13)], GLASS, 2.6)
            if fl == "lower" and rm["kind"] in ("cafe", "art"): d.line([polar(rc, a0 + (a1 - a0) * k / 12) for k in range(13)], GLASS, 2.6)   # glass to the corridor
        if fl == "lower": d.line([polar(r0, a) for a in frange(V0, V1 + 0.1, 1.0)], GLASS, 2.6)              # the corridor's glass onto the grove
        d.areas.update(areas)
        if fl == "upper":
            # the corridor's glass onto the garden ring, the sunk quarter's roof with its skylights
            for s0, s1 in ((-57, 197),): d.line([polar(r0, a) for a in frange(s0, s1 + 0.1, 1.0)], GLASS, 2.0)
            d.poly(ring_band_pts(r0, r1, 197, 303), "#E4E0D6", "#9C968C", 0.9, "5 4")
            SK, rS = C["skylight"], (rc + r1) / 2                         # a skylight about every 10 degrees over each room below, as built
            for rm in R.RING_ROOMS:
                if rm.get("band") or rm["floor"] != "lower" or ring_sec(rm["a"][0] + 0.01)["kind"] != "sunk" or ring_sec(rm["a"][1] - 0.01)["kind"] != "sunk": continue
                sp = rm["a"][1] - rm["a"][0]; n = max(1, round(sp / SK["every"])); hw = SK["w"] / 2 / rS / D2R
                for k in range(n):
                    am = rm["a"][0] + (k + 0.5) * sp / n
                    d.poly(ring_band_pts(rS - SK["l"] / 2, rS + SK["l"] / 2, am - hw, am + hw), "#D6E6EF", "#7C9AAA", 0.6)
            d.note(*polar(54, 230), "the lower floor's roof at ground level, skylights", 9, 400, INK2, rot=upright(230))
            d.poly(ring_band_pts(GL["r0"], GL["r1"], GL["a"][0], GL["a"][1]), "none", "#8A847A", 0.8, "5 4"); d.note(*polar(65.3, 20), "garden gallery's glass roof, below", 8.5, 400, INK2, rot=upright(20))
            # the entrance: the dome over the plaza, the airlock at its front, the Gate Hall behind
            d.circ(EN["c"], EN["r"], "#E6F0F4", "#3E86B8", 1.6); A = EN["airlock"]
            d.room("T04-02", box(-A["w"] / 2, A["s0"], A["w"] / 2, A["s1"]), "move", "airlock", room_w=A["w"], size=9)
            d.note(EN["c"][0], EN["c"][1] + 3.5, "T04-01 entrance dome", 10.5, 700, "#2A6E8E"); d.note(EN["c"][0], EN["c"][1] + 6.0, "glass dome 23 m across, 6.8 m high on a 3 m glass drum", 8.5, 400, INK2)
            d.arrow((0, A["s1"] + 6.0), (0, A["s1"] + 0.4), "in from the start", RED, 9.5)
            for yy in (A["s0"], A["s1"]): d.line([(-1.3, yy), (1.3, yy)], PAPER, 3.6)
            d.line([(-1.3, 62.0), (1.3, 62.0)], PAPER, 3.6); d.line([(-1.3, 46.0), (1.3, 46.0)], PAPER, 3.6)
            d.arrow((0, 58.0), (0, 35.0), None, RED)
            # the pod dock: the bridge from the pod lounge over the gallery, the deck, a pod at its docking spot
            pa = PD["a"]; dc = polar(PD["r"], pa); d.circ(dc, PD["deck_r"], "#5B6066", "#2B2926", 1.2); d.circ(dc, PD["deck_r"] - 0.6, "none", "#F2C14E", 1.0)
            d.poly(ring_band_pts(PD["bridge"][0], PD["bridge"][1] + 0.6, pa - 1.2, pa + 1.2), "#E6F0F4", GLASS, 1.2)
            sp = polar(PD["spot_r"], pa); t = (math.cos(pa * D2R), math.sin(pa * D2R))
            d.poly([(sp[0] + t[0] * 2.8 + math.sin(pa * D2R) * 1.15, sp[1] + t[1] * 2.8 - math.cos(pa * D2R) * 1.15), (sp[0] + t[0] * 2.8 - math.sin(pa * D2R) * 1.15, sp[1] + t[1] * 2.8 + math.cos(pa * D2R) * 1.15),
                    (sp[0] - t[0] * 2.8 - math.sin(pa * D2R) * 1.15, sp[1] - t[1] * 2.8 + math.cos(pa * D2R) * 1.15), (sp[0] - t[0] * 2.8 + math.sin(pa * D2R) * 1.15, sp[1] - t[1] * 2.8 - math.cos(pa * D2R) * 1.15)], "#FFFFFF", "#2B2926", 1.0)
            d.note(*polar(PD["r"], pa + 8.2), "T04-03 pod dock", 10, 700, INK, rot=0); d.note(*polar(PD["r"] - 1.0, pa + 10.2), "T17-02 glass bridge, docking collar", 8.5, 400, INK2, rot=0)
            d.note(*polar(66, 142), "the hill rises here", 9, 400, "#8A6D2E", rot=upright(142))
        else:
            d.room("T06-15", ring_band_pts(GL["r0"], GL["r1"], GL["a"][0], GL["a"][1]), "garden", "Garden gallery", at=polar(65.3, -30), rot=upright(-30), room_w=40, size=10)
            d.line([polar(GL["r1"], a) for a in frange(GL["a"][0], GL["a"][1] + 0.1, 1.0) if not (-15 < a < 15)], "#8A847A", 3.4)
            for dm in R.DOMES[:1]: d.line([(dm["lat"] + dm["r"] * math.sin(t * D2R), dm["rad"] + dm["r"] * math.cos(t * D2R)) for t in range(-26, 27, 2)], "#6F8F5A", 1.4, "6 4")
            d.arrow((0, -GL["r1"] + 3.0), (0, -GL["r1"] - 2.4), None, "#4E6E3A"); d.note(0, -GL["r1"] - 4.2, "into the upper garden dome (T09-02)", 9, 700, "#4E6E3A")
            d.line([polar(r0 - 0.4, a) for a in frange(-80, 224, 1.0)], "#8A847A", 3.0)
            d.note(*polar(44.0, 140), "retaining wall: the garden ring above", 8.5, 400, INK2, rot=upright(140))
            for a in frange(203, 300, 8.0):
                for rr in (50.0,): d.poly(ring_band_pts(rr - 1.0, rr + 1.0, a - 1.4, a + 1.4), "none", "#7C9AAA", 0.6, "2 2")
            d.note(*polar(63.6, 236), "the corridor runs against the earth", 8.5, 400, INK2, rot=upright(236))
        d.scalebar(24, H - 30, 10)
        out.append(d.save(fname)); areas.update(d.areas)
    return out, areas


def ring_band_pts(ra, rb, a0, a1, n=None):
    n = n or max(3, int(abs(a1 - a0) / 1.5))
    return [polar(rb, a0 + (a1 - a0) * k / n) for k in range(n + 1)] + [polar(ra, a1 - (a1 - a0) * k / n) for k in range(n + 1)]


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


# ------------------------------------------------------------------------------------------------- T-09 the garden domes and the winter garden
def dome_top(dm, lat, rad):
    """the height (absolute) of a garden dome's glass over a point, or None outside it: a spherical cap"""
    a, h = dm["r"], dm["h"]; rho = (a * a + h * h) / (2 * h); q = math.hypot(lat - dm["lat"], rad - dm["rad"])
    return None if q > a else dm["floor"] + h - rho + math.sqrt(rho * rho - q * q)


def garden():
    G = R.GARDEN; C = R.RING; GL = R.RING["gallery"]; WG = R.GARDEN_RING
    d = Plan(760, 860, "T-09 · The garden ring and the garden domes: plan", "From the palace's back door through the winter garden and the Crescent, down three glass domes to the observatory: all under glass, all in air.")
    d.frame(380, 84, 0.0, -186.0, 3.6)
    d.poly(sector(16, 28, -60, 60), "#ECE9E2", "#9C968C", 1.0); d.note(0, -19, "T-01 Math Palace", 10, 400)
    wg = sector(WG["r0"], WG["r1"], -80, 80); d.poly(wg, FILL["garden"], "#6F8F5A", 1.0)
    for a in range(-78, 79, 6): d.line([polar(WG["r0"], a), polar(WG["r1"], a)], "#9DB58A", 0.6)          # the vault's ribs
    d.note(0, -37.6, "T09-01 garden ring", 10, 700, "#3F5E2E"); d.note(0, -40.6, "all the way round the dome", 8.5, 400, "#4E6E3A")
    d.poly(sector(C["r0"], C["r1"], -90, 90), "#EBDFC6", WALL, 1.0); d.note(*polar(54, -34), "T-06 the Ring", 9.5, 700, INK, rot=-34)
    d.poly(sector(C["r1"], GL["r1"], GL["a"][0], 90), "#DCEACB", "#6F8F5A", 0.9); d.note(*polar(65.3, 34), "T06-15 garden gallery", 8.5, 700, "#3F5E2E", rot=34)
    bd = G["back_door"]; d.poly(box(-bd["w"] / 2, -26.6, bd["w"] / 2, -30.6), FILL["move"]); d.note(4.5, -28.6, "T09-04", 9, 700, INK, "start")
    names = {"T09-02": "upper garden dome", "T09-03": "spiral garden dome", "T09-05": "lower garden dome"}
    for k, dm in enumerate(G["domes"]):
        pts = circle((dm["lat"], dm["rad"]), dm["r"], 90); d.poly(pts, "#E3EFD7", "#4E7A3C", 1.6)
        for rr in (dm["r"] * 0.33, dm["r"] * 0.66): d.circ((dm["lat"], dm["rad"]), rr, "none", "#A9C495", 0.6)
        for t in range(0, 360, 30): d.line([(dm["lat"] + dm["r"] * 0.33 * math.sin(t * D2R), dm["rad"] + dm["r"] * 0.33 * math.cos(t * D2R)), (dm["lat"] + dm["r"] * math.sin(t * D2R), dm["rad"] + dm["r"] * math.cos(t * D2R))], "#A9C495", 0.6)
        d.areas[dm["code"]] = math.pi * dm["r"] ** 2
        lx, ly, an = ((0.0, dm["rad"] + 16.5, "middle"), (-dm["r"] - 2.0, dm["rad"] - 2.0, "end"), (0.0, dm["rad"] - 11.0, "middle"))[k]
        d.note(lx, ly, "%s %s" % (dm["code"], names[dm["code"]]), 9.5, 700, "#3F5E2E", an)
        d.note(lx, ly + 3.2, "floor %+.1f m · %d m tall" % (dm["floor"], dm["h"]), 8.5, 400, "#4E6E3A", an)
    for k in range(len(G["domes"]) - 1):                                   # the arch where two domes meet, and the steps down
        A, B = G["domes"][k], G["domes"][k + 1]; mid = (A["rad"] + B["rad"]) / 2; hw = math.sqrt(A["r"] ** 2 - ((A["rad"] - B["rad"]) / 2) ** 2)
        d.line([(-hw, mid), (hw, mid)], "#4E7A3C", 2.4); d.poly(box(-4.0, mid + 1.4, 4.0, mid - 1.4), "#FFFFFF", WALL, 0.8)
        for j in range(1, 8): d.line([(-4.0, mid + 1.4 - j * 0.35), (4.0, mid + 1.4 - j * 0.35)], "#8A847C", 0.5)
        d.note(-5.0, mid, "steps down %.1f m" % (A["floor"] - B["floor"]), 8.5, 400, INK2, "end")
    sp = G["spiral"]; phi = (1 + 5 ** 0.5) / 2; pts = []
    for k in range(160):
        th = k / 159 * sp["turns"] * 2 * math.pi; q = sp["a"] * phi ** (th / (math.pi / 2)); pts.append((sp["lat"] + q * math.cos(th) * 0.5, sp["rad"] + q * math.sin(th) * 0.5))
    d.line(pts, "#B0623F", 2.2); d.note(sp["lat"] + 9.0, sp["rad"] - 9.0, "golden spiral path", 9, 700, "#8A4A2E", "start")
    for sc in G["sculptures"]:
        d.circ((sc["lat"], sc["rad"]), 1.3, "#B58B4C", "#5C4626", 1.0); right = sc["lat"] > 0
        d.note(sc["lat"] + (2.4 if right else -2.4), sc["rad"], sc["name"], 8.5, 400, "#5C4626", "start" if right else "end")
    O = R.OBSERVATORY; d.circ((O["lat"], O["rad"]), O["r"], FILL["tech"]); d.note(O["lat"], O["rad"], "T-10", 10, 700, INK)
    for L in R.LINKS:
        if L["code"] in ("T17-03", "T17-04", "T17-05"):
            (la, ra), (lb, rb) = L["a"], L["b"]; ux, uy = lb - la, rb - ra; n = math.hypot(ux, uy) or 1; vx, vy = -uy / n * L["w"] / 2, ux / n * L["w"] / 2
            d.poly([(la + vx, ra + vy), (lb + vx, rb + vy), (lb - vx, rb - vy), (la - vx, ra - vy)], FILL["move"], WALL, 1.0)
    d.note(-40.0, -96.0, "T17-03 → T-07 Infinity Hall", 9, 700, INK2, "end"); d.note(24.0, -93.0, "T17-04 → T-08 Garden of Primes", 9, 700, INK2, "start")
    d.note(9.5, -162.0, "T17-05", 8.5, 700, INK2, "start")
    d.scalebar(24, 830, 20); d.toward_palace(470, 826)
    full = ring_band_pts(WG["r0"], WG["r1"], -80, WG["grove"]["a"][0]); grove = ring_band_pts(WG["r0"], WG["r1"], *WG["grove"]["a"])
    return d.save("svg-garden.svg"), dict(d.areas, **{"T09-01": area_of(full), "T09-06": area_of(grove), "T09-04": bd["w"] * bd["d"]})


# ------------------------------------------------------------------------------------------------- T-04 the courtyard hall and the entrance
def wing_edge(sg, u):
    latf = lambda s: 10.5 - 1.5 * ((s - 55.5) / 22.5) ** 2
    return [(sg * (latf(s) + u), s) for s in [33.3 + k * (77.7 - 33.3) / 24 for k in range(25)]]


def courtyard():
    K = R.COURTYARD; A = K["airlock"]; PS = R.COURTYARD["podstop"]
    d = Plan(980, 760, "T-04 · The courtyard hall and the entrance: plan and section", "The courtyard between the wings under a glass vault, the entrance airlock under the gateway, the pod stop beside it.")
    d.text(24, 78, "Plan", 13, 700, anchor="start"); d.frame(250, 110, -36.0, 18.0, 5.4)
    for sg in (-1, 1):
        d.poly(wing_edge(sg, 0) + wing_edge(sg, 8.6)[::-1], "#E4E0D6", "#9C968C", 1.0)
        d.note(sg * 15.5, 56, "T-0%d %s" % (2 if sg > 0 else 3, "classroom wing" if sg > 0 else "café and library wing"), 9, 700, INK2, rot=-90 * sg)
    vault = wing_edge(-1, -1.2) + wing_edge(1, -1.2)[::-1]; d.poly(vault, "#E6EFF3", "#3E86B8", 1.4)
    d.areas["T04-01"] = area_of(vault)
    for k in range(int((77.7 - 33.3) / 3.0) + 1):
        sv = 33.3 + k * 3.0; hw = 10.5 - 1.5 * ((sv - 55.5) / 22.5) ** 2 - 1.2; d.line([(-hw, sv), (hw, sv)], "#9CC0D8", 0.7)
    d.line([(0, 33.3), (0, 77.7)], "#9CC0D8", 0.9, "6 4")
    d.note(0, 52.0, "T04-01", 11, 700, INK); d.note(0, 49.6, "courtyard hall", 9.5, 400, INK2); d.note(0, 47.4, "glass vault overhead", 8.5, 400, "#3E86B8")
    d.poly(sector(20.0, 28.6, 150, 210), "#ECE9E2", "#9C968C", 1.0); d.note(0, 24.4, "T-01 Math Palace", 9, 400)
    hw = A["w"] / 2; air = box(-hw, A["s0"], hw, A["s1"]); d.room("T04-02", air, "move", "airlock", at=(0, (A["s0"] + A["s1"]) / 2), room_w=A["w"], size=9.5)
    for sv in (A["s0"] + 0.2, A["s1"] - 0.2): d.line([(-1.4, sv), (1.4, sv)], RED, 2.6)
    d.note(-hw - 0.6, A["s1"] - 0.4, "outer doors", 8, 600, RED, "end"); d.note(-hw - 0.6, A["s0"] + 0.9, "inner doors", 8, 600, RED, "end")
    d.line([(-9.4, 77.1), (9.4, 77.1)], "#5C4626", 3.0); d.note(-18.6, 76.0, "gateway arch", 8.5, 400, "#5C4626", "end")
    d.arrow((0, 95.0), (0, A["s1"] + 0.4), "in over the ridge, from the start", RED, 9)
    ps = (PS["lat"], PS["rad"]); d.circ(ps, PS["r"], FILL["pad"], "#FFFFFF", 2.0); d.circ(ps, PS["r"] - 0.8, "none", "#F2C14E", 1.3)
    d.poly([(ps[0] - 1.0, ps[1] - 2.9), (ps[0] + 1.0, ps[1] - 2.9), (ps[0] + 1.25, ps[1] + 2.6), (ps[0] - 1.25, ps[1] + 2.6)], "#F4F4F1", "#1D2124", 0.9)
    d.note(ps[0], ps[1] + PS["r"] + 1.6, "T04-03 pod stop", 9, 700, INK); d.areas["T04-03"] = math.pi * PS["r"] ** 2
    L = [k for k in R.LINKS if k["code"] == "T17-02"][0]; (la, ra), (lb, rb) = L["a"], L["b"]; ux, uy = lb - la, rb - ra; n = math.hypot(ux, uy); vx, vy = -uy / n * L["w"] / 2, ux / n * L["w"] / 2
    d.poly([(la + vx, ra + vy), (lb + vx, rb + vy), (lb - vx, rb - vy), (la - vx, ra - vy)], FILL["move"], WALL, 1.0); d.note((la + lb) / 2 + 0.4, (ra + rb) / 2 - 2.2, "T17-02", 8, 700, INK2)
    d.scalebar(24, 720, 10)
    # cross-section at the middle of the courtyard: the vault from roof edge to roof edge, the wings' rooms
    d.text(560, 78, "Section across the courtyard, at its middle", 13, 700, anchor="start"); d.frame(760, 420, 0.0, 0.0, 9.0)
    def sec(pts, fill, stroke=WALL, sw=1.2): d.poly([(x, -y) for x, y in pts], fill, stroke, sw)
    def sline(pts, stroke=WALL, sw=1.2, dash=None): d.line([(x, -y) for x, y in pts], stroke, sw, dash)
    hwc, yE = 10.5 - 1.2, 0.6 + 4.3 + 2.9 * (77.7 - 56.0) / 44.4; yC = [c[1] for c in K["crown"] if c[0] == 56.0][0]   # the canopy edge (half-width, height) and the crown at the middle
    for sg in (-1, 1):
        sec([(sg * 10.5, 0.4), (sg * 19.1, 0.4), (sg * 19.1, 0.9), (sg * 16.1, 3.4), (sg * 12.0, 5.6), (sg * hwc, yE), (sg * hwc, yE - 0.4), (sg * 10.5, yE - 0.6)], "#E4E0D6", "#9C968C")
        sline([(sg * 10.5, 0.4), (sg * 10.5, yE - 0.6)], GLASS, 2.2); sline([(sg * 10.5, 4.3), (sg * 16.1, 4.3)], "#8A847C", 1.0, "4 3")
        d.note(sg * 14.6, -2.2, "T-0%d" % (2 if sg > 0 else 3), 9, 700, INK2); d.note(sg * 14.6, -4.9, "ceiling", 7.5, 400, INK2)
    rho = (hwc ** 2 + (yC - yE) ** 2) / (2 * (yC - yE)); cy = yC - rho
    arc = [(x, cy + math.sqrt(max(0, rho * rho - x * x))) for x in [-hwc + 2 * hwc * k / 40 for k in range(41)]]
    sline(arc, "#3E86B8", 2.4)
    for x in (-6, -3, 0, 3, 6): yv = cy + math.sqrt(rho * rho - x * x); sline([(x, yv), (x, yv - 0.35)], "#3E86B8", 1.2)
    sline([(-12, 0), (12, 0)], "#8A847C", 1.6); d.note(0, 0.9, "courtyard paving", 8.5, 400, INK2)
    d.note(0, -yC - 1.2, "glass vault, crown %.1f m" % yC, 9, 700, "#3E86B8"); d.note(hwc + 0.3, -yE - 0.9, "springs from the wing's roof edge", 8, 400, INK2, "start")
    sline([(-15, -0.6), (-15, 1.8)], INK, 1.0); d.note(-15.4, -0.9, "0", 8, 400, INK2, "end")
    d.text(560, 520, "The crown falls with the line of sight from the start:", 10, 400, INK2, anchor="start")
    d.text(560, 538, "%.1f m by the palace, %.1f m at the middle, %.1f m at the gateway;" % tuple(c[1] for c in K["crown"]), 10, 400, INK2, anchor="start")
    d.text(560, 556, "it stays at least 0.5 m under it everywhere (checked on the site plan).", 10, 400, INK2, anchor="start")
    return d.save("svg-courtyard.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-16 the Sun court
def suncourt():
    S = R.SUNCOURT; w, dd = S["w"], S["d"]; c = (S["lat"], S["rad"]); l0, l1, q0, q1 = c[0] - w / 2, c[0] + w / 2, c[1] - dd / 2, c[1] + dd / 2
    d = Plan(900, 560, "T-16 · The Sun court: plan and section", "Sunk to the lobby's floor under a low glass vault on bronze ribs; the sun reaches the dial through the glass.")
    d.text(24, 78, "Plan", 13, 700, anchor="start"); d.frame(40, 100, l0 - 9.5, q0 - 1.0, 17.0)
    d.poly(wing_edge(1, 0)[6:15] + wing_edge(1, 8.6)[6:15][::-1], "#E4E0D6", "#9C968C", 1.0); d.note(14.5, 47.0, "T-02 lobby", 9, 700, INK2, rot=-90)
    d.room("T16-02", box(l0, q0, l1, q1), "garden", "Sun classroom", at=(c[0], q1 - 2.2), room_w=w, size=10)
    for k in range(1, 12): d.line([(l0, q0 + k * dd / 12), (l1, q0 + k * dd / 12)], "#A9C495", 0.6)
    d.line([(c[0], q0), (c[0], q1)], "#7FA36A", 1.0, "6 4")
    d.circ(c, S["sphere"] / 2, "#C9A86A", "#5C4626", 1.4); d.circ(c, S["sphere"] / 2 + 0.25, "none", "#8A847C", 0.8)
    d.note(c[0] + 1.8, c[1], "T16-01 sundial", 9, 700, "#5C4626", "start"); d.areas["T16-01"] = math.pi * (S["sphere"] / 2 + 0.3) ** 2
    for k in range(S["benches"]):
        t = (-60 + 30 * k) * D2R; bx, bz = c[0] - 4.2 * math.cos(t), c[1] + 4.2 * math.sin(t)
        d.poly([(bx + ex * math.cos(t) - ez * math.sin(t), bz - ex * math.sin(t) - ez * math.cos(t)) for ex, ez in ((-0.25, -1.0), (0.25, -1.0), (0.25, 1.0), (-0.25, 1.0))], "#BDB6A8", WALL, 0.8)
    L = [k for k in R.LINKS if k["code"] == "T17-01"][0]; (la, ra), (lb, rb) = L["a"], L["b"]
    d.poly(box(la, ra - L["w"] / 2, lb, ra + L["w"] / 2), FILL["move"], WALL, 1.0); d.note((la + lb) / 2, ra + L["w"] / 2 + 0.8, "T17-01", 8.5, 700, INK2)
    d.scalebar(24, 520, 5)
    d.text(500, 78, "Section across the court", 13, 700, anchor="start"); d.frame(700, 380, 0.0, 0.0, 22.0)
    def sline(pts, stroke=WALL, sw=1.2, dash=None): d.line([(x, -y) for x, y in pts], stroke, sw, dash)
    hw, f, cr, sp = w / 2, S["floor"], S["crown"], S["spring"]
    sline([(-hw - 2.5, 1.4), (-hw, 1.4), (-hw, f), (hw, f), (hw, 1.4), (hw + 2.5, 1.4)], "#7A6A55", 2.0); d.note(hw + 1.2, -2.0, "ground", 8, 400, INK2)
    rho = (hw ** 2 + (cr - sp) ** 2) / (2 * (cr - sp)); cy = cr - rho
    sline([(x, cy + math.sqrt(rho * rho - x * x)) for x in [-hw + k * w / 30 for k in range(31)]], "#3E86B8", 2.4)
    sline([(-hw, sp), (-hw, 1.4)], "#8A847C", 3.0); sline([(hw, sp), (hw, 1.4)], "#8A847C", 3.0)
    sline([(0, f), (0, f + S["plinth"])], "#8A847C", 6.0); d.circ((0, -(f + S["plinth"] + S["sphere"] / 2)), S["sphere"] / 2, "none", "#B58B4C", 2.0)
    d.note(0, -cr - 0.35, "glass vault, crown %.1f m" % cr, 9, 700, "#3E86B8"); d.note(-hw + 0.2, -f + 0.4, "floor %.1f m, the lobby's level" % f, 8, 400, INK2, "start")
    d.text(500, 500, "Heights from the palace's datum. The crown stays under the line of sight from the start.", 10, 400, INK2, anchor="start")
    return d.save("svg-suncourt.svg"), d.areas


# ------------------------------------------------------------------------------------------------- T-17 the links
def links():
    d = Plan(860, 430, "T-17 · The links: a typical section", "A concrete trough half sunk in the ground, banked with regolith outside, a glass vault on steel ribs over it: in air, in light.")
    d.frame(430, 300, 0.0, 0.0, 34.0)
    def sline(pts, stroke=WALL, sw=1.2, dash=None): d.line([(x, -y) for x, y in pts], stroke, sw, dash)
    def spoly(pts, fill, stroke=WALL, sw=1.0): d.poly([(x, -y) for x, y in pts], fill, stroke, sw)
    w = 4.0; hw = w / 2
    spoly([(-hw - 0.3, -1.2), (hw + 0.3, -1.2), (hw + 0.3, 1.2), (hw, 1.2), (hw, -0.9), (-hw, -0.9), (-hw, 1.2), (-hw - 0.3, 1.2)], "#CFCAC0")
    for sg in (-1, 1): spoly([(sg * (hw + 0.3), -0.2), (sg * (hw + 0.3), 1.2), (sg * (hw + 4.2), -0.2)], "#C9A27C", "#8A6A4A", 0.8)
    sline([(-hw - 5, -0.2), (hw + 5, -0.2)], "#7A6A55", 1.6, "6 4"); d.note(hw + 4.6, 0.3 + 0.2, "ground", 8, 400, INK2)
    rho = 2.4; cy = 1.2
    sline([(hw * math.cos(t * D2R) * 1.0, cy + 1.6 * math.sin(t * D2R)) for t in range(0, 181, 6)], "#3E86B8", 2.2)
    for t in (30, 60, 90, 120, 150): x, y = hw * math.cos(t * D2R), cy + 1.6 * math.sin(t * D2R); sline([(x, y), (x * 0.92, y - 0.12)], "#3E86B8", 1.0)
    sline([(-hw, -0.9 + 0.05), (hw, -0.9 + 0.05)], "#8A847C", 2.0)
    d.note(0, 0.9 - 0.4, "floor: terrazzo, underfloor heating", 8.5, 400, INK2); d.note(0, -cy - 1.6 - 0.35, "glass vault on steel ribs, every 1.5 m", 9, 700, "#3E86B8")
    d.note(-hw - 2.6, -0.9, "regolith bank", 8.5, 400, "#8A6A4A"); d.note(hw + 2.6, -0.9, "regolith bank", 8.5, 400, "#8A6A4A")
    d.note(0, 0.9 + 0.9, "4 m clear · 3.4 m at the crown", 9, 700, INK)
    d.scalebar(24, 400, 2)
    for L in R.LINKS: d.areas[L["code"]] = math.hypot(L["b"][0] - L["a"][0], L["b"][1] - L["a"][1]) * L["w"]
    return d.save("svg-links.svg"), d.areas


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
    d.frame(330, 76, 20.0, -228.0, 6.0)
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
    d.door((l0, T["rad"] - 1.0), (0, 1), (1, 0), 1.8); d.poly(box(l0 - 8.0, T["rad"] - 3.0, l0, T["rad"] + 1.0), FILL["move"], WALL, 1.0)
    d.arrow((l0 - 7.5, T["rad"] - 1.0), (l0 - 0.4, T["rad"] - 1.0), "T17-06 from the observatory", INK, 9)
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
    nos = any(r.get("no") for r in rooms)
    rows = "".join('<tr><td class="code">%s</td>%s<td><b>%s</b></td><td>%s%s</td><td class="n">%s</td></tr>' % (
        r["code"], ('<td class="n"><b>%s</b></td>' % (r.get("no") or "")) if nos else "", E(r["name"]), E(r["use"]), (" <i>Also: %s</i>" % E(r["also"])) if r.get("also") else "", size(r["code"])) for r in rooms)
    return '<div class="tw"><table><thead><tr><th>Code</th>%s<th>Room</th><th>What it is for</th><th>Size</th></tr></thead><tbody>%s</tbody></table></div>' % ('<th>No.</th>' if nos else "", rows)


def schedule_page():
    """plan/schedule.html: the Fall timetable with the room of every class, and the rooms by number"""
    T = TTB.data(); days = T["days"]
    names = {rm["no"]: rm for rm in R.RING_ROOMS if rm.get("no")}
    def cell(c):
        if not c: return "<td></td>"
        t, r = c
        if r == 0: return '<td class="off">%s<br><span>online</span></td>' % E(t)
        return '<td class="%s">%s<br><b>%d</b> %s%s</td>' % ("both" if r < 0 else "on", E(t), abs(r), E(names[abs(r)]["name"].split(":")[0]), " + online" if r < 0 else "")
    body = []
    for g in T["groups"]:
        rows = []
        for c in g["classes"]:
            for i, row in enumerate(c["rows"]):
                head = '<td class="code" rowspan="%d">%s</td>' % (len(c["rows"]), E(c["name"])) if i == 0 else ""
                hw = '<td rowspan="%d">%s</td>' % (len(c["rows"]), E(c["hw"])) if i == 0 else ""
                rows.append("<tr>%s%s%s</tr>" % (head, "".join(cell(x) for x in row), hw))
        body.append('<h2>%s</h2><div class="tw tt"><table><thead><tr><th>Class</th>%s<th>Homework class</th></tr></thead><tbody>%s</tbody></table></div>' % (
            E(g["name"]), "".join("<th>%s</th>" % d for d in days), "".join(rows)))
    used = {}
    for g in T["groups"]:
        for c in g["classes"]:
            for row in c["rows"]:
                for x in row:
                    if x and x[1]: used.setdefault(abs(x[1]), set()).add(c["name"])
    def place(rm):
        a = (rm["a"][0] + rm["a"][1]) / 2
        side = "behind the dome" if -60 <= a <= 60 else "on the right" if a < 160 else "at the front" if a < 195 else "on the left"
        return "the Ring, %s, %s" % (side, "upstairs" if rm["floor"] == "upper" else "downstairs")
    dirrows = "".join('<tr><td class="n"><b>%d</b></td><td><b>%s</b></td><td>%s</td><td>%s</td></tr>' % (
        rm["no"], E(rm["name"]), E(place(rm)), E(", ".join(sorted(used.get(rm["no"], [])))) or "") for no, rm in sorted(names.items()))
    lede = ("TTMath's %s (%s, %d weeks), as it shows on the first of the two big screens in the Gate Hall, by the way in: every class, the days and times, "
            "and the room it meets in. Classes printed in black meet in the room, in red online, in purple in the room and online at once." % (T["term"]["title"], T["term"]["dates"], T["term"]["weeks"]))
    rule = ("<p>Jim, 5 Oct 2026: <i>\"each area esp classroom should have room number so students know which room they should go. also check ttmath.ca for fall schedule. "
            "the schedule should be somewhere in the entrance so students know where they are going to\"</i>; the schedule is Jim's picture of 6 Oct 2026.</p>"
            "<ul><li><b>Room numbers</b> have three digits: the first is the floor, <b>2</b> upstairs (the floor you come in on, level with the palace) and <b>1</b> downstairs "
            "(the garden level); the last two count up as you walk to the right from the Gate Hall, all the way round the Ring, so a room upstairs is right over the room "
            "with the same last two digits downstairs. Halls, corridors and stairs have names.</li>"
            "<li><b>The wings' rooms</b> moved into the Ring with their numbers (Pythagoras 219, Lovelace 213, Socrates 211).</li>"
            "<li><b>Each class keeps its room</b> where it can; no two classes ever share a room at the same time (<code>campus_timetable.py</code> checks it).</li></ul>")
    page("schedule.html", "Timetable · Fall 2026", '<h1>The Fall 2026 timetable and the rooms</h1><p class="lede">%s</p>%s%s<h2>The rooms by number</h2>'
         '<div class="tw"><table><thead><tr><th>No.</th><th>Room</th><th>Where</th><th>Fall classes</th></tr></thead><tbody>%s</tbody></table></div>' % (E(lede), rule, "".join(body), dirrows))


def contests_page():
    """plan/contests.html: the contests of Sept to Dec 2026, as on the second big screen in the Gate Hall"""
    rows = []
    for c in CTS.CONTESTS:
        nm = '<b>%s%s</b>%s<br><span class="when">%s</span>' % (E(c["org"] + ": " if c["org"] else ""), E(c["name"]), ('<br><span class="note">%s</span>' % E(c["note"])) if c.get("note") else "", E(c["when"]))
        rows.append("<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class=\"dl\">%s</td><td>%s</td><td>%s</td></tr>" % (
            nm, "<br>".join(map(E, c["info"])), "<br>".join(map(E, c["grades"])), "<br>".join(map(E, c["level"])), E(c["price"][0]), E(c["price"][1]), E(c["early"]), E(c["deadline"]), "<br>".join(map(E, CTS.REGISTER))))
    for t in CTS.TEAMS:
        rows.append('<tr class="team"><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>N/A</td><td>N/A</td><td>N/A</td><td>TTmath students only</td></tr>' % (E(t["name"]), E(t["when"]), E(t["grades"]), E(t["level"]), E(t["price"])))
    notes = "".join("<li>%s</li>" % E(n) for n, col in CTS.NOTES)
    lede = ("TTMath's contests for September to December 2026, as they show on the second of the two big screens in the Gate Hall, beside the timetable. "
            "From the sheet Jim sent on 6 Oct 2026 (\"2 big screens, one is for schedule, one is for below contest\"). %s." % CTS.VENUE)
    page("contests.html", "Contests · Sept–Dec 2026", '<h1>%s</h1><p class="lede">%s</p><div class="tw tt"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
         '<h2>%s</h2><ul>%s</ul>' % (E(CTS.TITLE), E(lede), "".join("<th>%s</th>" % E(h) for h in CTS.COLUMNS), "".join(rows), E(CTS.NOTES_HEAD), notes))


def fig(src, cap): return '<figure><a href="%s"><img src="%s" alt="%s"></a><figcaption>%s</figcaption></figure>' % (src, src, E(cap), cap)


PODS_MORE = """<ul><li><b>The pads:</b> dark, with white markings, a ring of lights round each and a charging mast beside it; taxi lanes to the terminal. The pads are outside, on the ground: only the pods go there. People board through the terminal's collars, so nobody needs a suit.</li>
<li><b>The pods</b> (Jim: <i>"on mars air is so little and can hardly support flying pod. borrow the same idea from Jim's retirement home use anti gravity technology"</i>): no rotors and no thrust. A two-seat cabin 5.6 m long, a teardrop of pearl-white composite under a one-piece tinted canopy, sits inside a halo: a flat elliptical ring round its waist on two swept pylons, the anti-gravity drive, whose field pushes against the ground like the Crown's drives at Arcadia and steers by leaning. It glows faintly underneath and stirs the dust when the pod is low. The pilot sits on the right, with chin windows at the feet for looking straight down.</li>
<li><b>Fly one:</b> board it at the pod dock off the Ring's right side (T04-03) or here; fly it over the campus and the crater, up to 400 m and at up to 40 m/s, for the eagle's view. Set down anywhere open: a pod floats level 0.45 m over the ground, whatever the slope, and never touches a roof. At the pod dock it settles onto its docking spot and the collar runs out to its door.</li>
<li><b>Ready for later:</b> the pads, chargers and collars are sized for bigger pods, and two more pads fit on the plain beyond.</li></ul>"""
SEALED_MORE = """<p>Jim, 5 Oct 2026: <i>"since bad conditions, all the schools buildings should be connected and sealed, so there should not be open area to the air. all open space should be covered by dome or sealed"</i>. Every room, court and garden is under a roof, a glass vault or a dome; every building is joined to the next by a sealed link; people meet the outside only at airlocks.</p>"""
RING_LEDE = ("The whole school in one ring round the Math Palace, like Apple Park's ring but sealed for Mars and set into the crater's slope: "
             "the Crescent grows all the way round, the two wings' rooms move into it, the courtyard becomes the entrance under a glass dome, "
             "and the garden ring under glass fills the space between the Ring and the dome.")
RING_MORE = """<p>Jim, 5 Oct 2026: <i>"why classroom building are half? please build the circle around the dome, like apple headquarter building"</i>; <i>"the entrance is not sealed by dome. it needs to. overall I like this structure similar like apple headerqueate but much more future proof and impressive than it"</i>.</p>
<ul><li><b>One ring, 340 m round its middle</b>, between radii 46 and 62 m round the dome, 16 m deep: rooms on the outside, a corridor along the garden glass. The lower floor's corridor goes all the way round; the upper floor's from the west stair round the back and the right to the Gate Hall.</li>
<li><b>Set into the slope.</b> Two storeys behind and beside the dome, where the ground falls to the plain. On the right front, where the hill rises, the upper floor's roof slopes down toward it. The Gate Hall at the front, two storeys tall. On the left front, where the start looks down through a dip in the ridge, only the lower floor, its roof at ground level with skylights, beside the sunken grove; so the campus still stays hidden until you reach the ridge. The roof line rises and falls with the hill all the way round (the profile below).</li>
<li><b>The way in:</b> from the start through the airlock (T04-02) into the entrance dome (T04-01), a plaza under glass 23 m across; through the Gate Hall into the garden ring; on to the palace's door.</li>
<li><b>The pods dock</b> at the pod dock off the right side (T04-03): the pod settles onto its spot, the docking collar runs out from the glass bridge (T17-02) and you walk straight into the pod lounge (T06-21).</li>
<li><b>The wings come down:</b> M1 Mathematics becomes Pythagoras (T06-20), the coding lab Lovelace (T06-23), the seminar room Socrates (T06-24); the library (T06-25), the reading room (T06-26) and the café (T06-38) move in; reception and the lobby become the Gate Hall (T06-27).</li>
<li><b>Future-proof:</b> 36 bays of 10° on one steel frame with the same facade panels, so any bay can change its use; a metre of water in sealed cells in the roof, a shield against cosmic rays and the campus's water store; the air, water and power run round the lower floor's corridor; the frame over the back half is sized for a third storey.</li></ul>
<figure><a href="svg-ring-profile.svg"><img src="svg-ring-profile.svg" alt="The Ring unrolled: floors, roof, ground and line of sight"></a><figcaption><b>The Ring unrolled</b> all the way round: its floors and roof, the ground and the line of sight from the start (red; the start sees what is above it). The garden ring's glass vault in green.</figcaption></figure>"""
def ring_corridors():
    """the corridors' signs and prints, from the program (RING_SIGNS, RING_ART)"""
    names = {r["code"]: r for r in R.RING_ROOMS}
    def where(x):
        if x.get("room"): return "in the %s (%s), on its %s wall" % (E(names[x["room"]]["name"]), x["room"], x["wall"])
        if x.get("end"): return "upper corridor, its %s end (%g°)" % ("west" if x["end"] > 0 else "east", x["a"])
        rm = names[x["faces"]]
        return "lower corridor at %g°, facing %s%s" % (x["a"], E(rm["name"]), (" (%s)" % rm["no"]) if rm.get("no") else "")
    rows = "".join("<tr><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td></tr>" % (E(x["title"]), E(x["note"]), where(x),
                   ("a bench, a %s" % x["plant"][0]) if x.get("bench") else "") for x in R.RING_ART)
    return ("<h2>Finding the way, and the corridors' prints</h2>"
            "<p>Blade signs hang across the corridors, upstairs at %s° and downstairs at %s°: each face lists the room numbers ahead of you that way, up to the next sign, "
            "and the stairs and halls. A lit green exit sign hangs over each stair's door on both floors. Every room has its number beside each of its doors (v0.14).</p>"
            "<p>On the lower corridor's long back wall, a walk of framed prints of mathematics, each facing a room and showing what it is named for or used for; "
            "at the upper corridor's two blind ends a print over a bench. Each print 1.8 by 1.2 m in a walnut frame under a brass picture light; benches where people wait, "
            "each with a plant chosen for its light: downstairs, with no daylight, ones that live in low light; at the upper ends, by the garden glass, a fig and a bird of paradise.</p>"
            '<div class="tw"><table><thead><tr><th>Print</th><th>What it shows</th><th>Where</th><th>Beside it</th></tr></thead><tbody>%s</tbody></table></div>'
            % (", ".join("%g" % a for a in R.RING_SIGNS["upper"]), ", ".join("%g" % a for a in R.RING_SIGNS["lower"]), rows)
            + "<p>Notice boards of cork in aluminium frames on the lower corridor's back wall: %s. A stainless bottle filler over a drinking fountain on the corridor wall beside the door of %s.</p>"
            % ("; ".join("<b>%s</b> at %g° (%s)" % (E(b["title"]), b["a"], "each of the term's contests on its own flyer, from the contest sheet" if b["topic"] == "contests"
                         else "the clubs and events the rooms are planned for: " + ", ".join(E(names[c]["also"][:1].lower() + names[c]["also"][1:].rstrip(".")) for c in b.get("rooms", ()))) for b in R.RING_BOARDS),
               ", ".join("%s (%s)" % (E(names[c]["name"]), names[c].get("no") or c) for c in R.RING_FOUNTAINS)))


CRESCENT_MORE = """<p>Big rooms with high ceilings (Jim, 5 Oct 2026: <i>"class rooms are all too small and roof are too low. feels depressed"</i>): each classroom about 17 m by 12 m under a ceiling 4.5 m high; the floors 5.6 m apart; the hall two storeys tall.</p>"""
SPECS = [
    ("ring.html", "T-06 · The Ring", RING_LEDE, ring, R.RING_ROOMS + R.ENTRANCE_ROOMS + R.POD_DOCK_ROOMS, RING_MORE + ring_corridors()),
    ("infinity.html", "T-07 · Infinity Hall", "A lecture theatre for 240 on the west side of the garden domes, built into the slope like a Greek theatre; in from the upper garden dome by a link.", infinity, R.INFINITY_ROOMS, ""),
    ("greenhouse.html", "T-08 · Garden of Primes", "Two glass vaults full of real plants on the east side of the garden domes, joined to them by a link.", greenhouse, R.GREENHOUSE_ROOMS, ""),
    ("garden.html", "T-09 · The garden ring and the garden domes", "The garden all under glass: the garden ring all the way round the dome (with the sunken grove on the left and the armillary sundial at the front right), the garden gallery along the Ring, three glass domes stepping down the hill to the observatory.", garden, R.GARDEN_RING_AREAS + [x for x in R.GARDEN_AREAS if x["code"] != "T09-01"] + R.SUNCOURT_ROOMS, SEALED_MORE),
    ("observatory.html", "T-10 · Observatory", "A tower at the foot of the garden domes on the palace's axis, with a telescope dome on top; links to the lowest garden dome and to the pod terminal.", observatory, R.OBSERVATORY_ROOMS, ""),
    ("sports.html", "T-11 · Low-gravity Sports Dome", "Games in Mars gravity, a climbing wall and a fitness gallery under one dome; a link from behind Infinity Hall's stage.", sports, R.SPORTS_ROOMS, ""),
    ("hangar.html", "T-12 · Robotics and Rover Hangar", "Where the rovers live and students build robots, next to the test yard (T-13); a link from the Garden of Primes. The rovers dock to suitports, so nobody walks outside without a suit room.", hangar, R.HANGAR_ROOMS, ""),
    ("pods.html", "T-14 · Pod Port and T-15 · terminal", "A parking field for flying pods with its terminal, at the far end of the campus on the plain, where nothing on the ground can be seen from the start: built now so the campus is ready for travel by air.", pods, R.PODPORT_ROOMS + R.TERMINAL_ROOMS, PODS_MORE),
    ("links.html", "T-17 · The links", "The sealed galleries that join every building to the next, so you can go everywhere in shirt sleeves.", links, R.LINK_ROOMS, SEALED_MORE),
]
if __name__ == "__main__":
    AREAS = {}
    for fn, title, lede, draw, rooms, more in SPECS:
        src, areas = draw(); AREAS.update(areas)
        figs = "".join(fig(sv, "<b>%s</b>, to scale." % E(title.split(" · ")[0] + (" · " + ("upper floor" if "upper" in sv else "lower floor") if "ring-" in sv else ""))) for sv in (src if isinstance(src, list) else [src]))
        page(fn, title, '<h1>%s</h1><p class="lede">%s</p>%s%s%s' % (E(title), E(lede), more, figs, table(rooms, areas)))
    schedule_page()
    contests_page()
    missing = [r["code"] for b in SPECS for r in b[4] if r["code"] not in AREAS]
    indoor = sum(a for c, a in AREAS.items() if not c.startswith(("T14", "T04-03")) and c not in ("T07-05", "T11-03"))
    print("building pages written:", len(SPECS), "; rooms", sum(len(s[4]) for s in SPECS), "; indoor floor area about", round(indoor), "m2; no size for", missing)
    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)
    json.dump({k: round(v, 1) for k, v in sorted(AREAS.items())}, open(os.path.join(HERE, "data", "room_areas.json"), "w"), indent=0)
    # the data the demo builds from
    keep = ("code", "name", "floor", "a", "kind", "double", "band", "short", "no", "also")
    data = {"crescent": dict(R.CRESCENT, rooms=[dict({k: v for k, v in r.items() if k in keep}, plants=R.CRESCENT_PLANTS.get(r["code"], [])) for r in R.CRESCENT_ROOMS]),
            "infinity": R.INFINITY, "greenhouse": R.GREENHOUSE, "garden": R.GARDEN, "observatory": R.OBSERVATORY, "sports": R.SPORTS, "hangar": R.HANGAR,
            "podport": R.PODPORT, "terminal": R.TERMINAL, "suncourt": R.SUNCOURT, "courtyard": R.COURTYARD, "gallery": R.GALLERY, "winter": R.WINTER,
            "links": R.LINKS, "pod": R.POD,
            "ring": dict(R.RING, rooms=[dict({k: v for k, v in r.items() if k in keep}, plants=R.RING_PLANTS.get(r["code"], [])) for r in R.RING_ROOMS], signs=R.RING_SIGNS, art=R.RING_ART, boards=R.RING_BOARDS, fountains=R.RING_FOUNTAINS), "garden_ring": R.GARDEN_RING, "entrance": R.ENTRANCE, "pod_dock": R.POD_DOCK,
            "wing_nos": R.WING_NOS, "vault_lock": R.VAULT_LOCK, "link_stair": R.LINK_STAIR, "timetable": TTB.data(), "contests": CTS.data()}
    js = "  /* ===================== Phase 2 data: written by ttmath/tools/campus_buildings.py from campus_rooms.py; do not edit ===================== */\n  var P2 = " + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n"
    open(os.path.join(TT, "src", "blocks", "blk_p2data.js"), "w").write(js)
    print("wrote blk_p2data.js", len(js), "bytes")
