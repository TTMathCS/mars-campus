"""TTMath campus, phase 2: the site plan and the overview pages. Draws the site plan over the map of how tall a building
may be and stay hidden from the start (data/envelope.json from envelope.py) and writes index, buildings and rover pages in
ttmath/plan/; campus_buildings.py writes a page per building. Shapes come from the room program, campus_rooms.py.
usage: python3 ttmath/tools/campus_plan.py   (needs numpy and Pillow)
Places are in the Math Palace's frame, in metres: rad from the dome's centre toward the start (the visitor), lat to
the visitor's right. The program (what each building is for) is PROGRAM below; heights are checked against the map."""
import base64, html, io, json, math, os
import numpy as np
from PIL import Image
import campus_rooms as R
HERE = os.path.dirname(os.path.abspath(__file__)); TT = os.path.dirname(HERE); OUT = os.path.join(TT, "plan")
os.makedirs(OUT, exist_ok=True); E = html.escape
ENV = json.load(open(os.path.join(HERE, "data", "envelope.json")))
AZ = np.array(ENV["az"], float); AZU = np.where(AZ < 200, AZ + 360, AZ); DD = np.array(ENV["d"], float)
HID = np.array(ENV["hidden"], float); GR = np.array(ENV["g"], float)
C = np.array([math.sin(math.radians(326)) * 124, -math.cos(math.radians(326)) * 124])          # the dome's centre
F = np.array([-5.2, -7.4]) - C; F /= np.linalg.norm(F); RT = np.array([F[1], -F[0]])


def world(lat, rad): return C + RT * lat + F * rad


def palace(x, z): q = np.array([x, z]) - C; return float(q @ RT), float(q @ F)


def at(lat, rad):
    """(hidden height above the ground, ground height) at a point, from the map; None outside it"""
    x, z = world(lat, rad); az = (math.degrees(math.atan2(x, -z)) + 360) % 360; az = az + 360 if az < 200 else az; d = math.hypot(x, z)
    i = int(np.argmin(abs(AZU - az))); j = int(np.argmin(abs(DD - d)))
    if abs(AZU[i] - az) > 1.5 or d > DD[-1]: return None, None
    return float(HID[i, j]), float(GR[i, j])


# ------------------------------------------------------------------------------------------------- the program
def rect(lat, rad, w, d, rot=0.0):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(lat + x * c - y * s, rad + x * s + y * c) for x, y in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2))]


def circle(lat, rad, r, n=48): return [(lat + r * math.sin(2 * math.pi * k / n), rad + r * math.cos(2 * math.pi * k / n)) for k in range(n)]


def arc(r0, r1, p0, p1, n=40):
    """a band between radii r0 and r1 round the dome's centre, behind it, from angle p0 to p1 (0 = straight behind)"""
    a = [(r1 * math.sin(math.radians(p)), -r1 * math.cos(math.radians(p))) for p in np.linspace(p0, p1, n)]
    b = [(r0 * math.sin(math.radians(p)), -r0 * math.cos(math.radians(p))) for p in np.linspace(p1, p0, n)]
    return a + b


def fan(G, n=24):
    """Infinity Hall's outline from the room program: the stage at the point, the fan opening along the turn (0 = +rad)"""
    t = math.radians(G["turn"]); r0, r1 = G["r_stage"], G["r_foyer"][1]; a = G["half_angle"]
    L = lambda x, y: (G["lat"] + x * math.cos(t) + y * math.sin(t), G["rad"] + y * math.cos(t) - x * math.sin(t))
    pts = [L(r1 * math.sin(math.radians(b)), r1 * math.cos(math.radians(b))) for b in np.linspace(-a, a, n)]
    return pts + [L(r0 * math.sin(math.radians(b)), r0 * math.cos(math.radians(b))) for b in np.linspace(a, -a, n)]


def infinity_height(lat, rad):
    """Infinity Hall's section: the stage house 11 m, the roof stepping down over the rows to 7.5 m, the foyer 6.5 m"""
    G = R.INFINITY; t = math.radians(G["turn"]); dx, dy = lat - G["lat"], rad - G["rad"]
    y = dy * math.cos(t) + dx * math.sin(t); r = math.hypot(dx, dy) if y > 0 else 0.0
    if r <= G["r_seats"][0]: return 11.0
    if r <= G["r_seats"][1]: return 11.0 - 3.5 * (r - G["r_seats"][0]) / (G["r_seats"][1] - G["r_seats"][0])
    return 6.5


def wing(sg):
    latf = lambda s: 10.5 - 1.5 * ((s - 55.5) / 22.5) ** 2
    ss = np.linspace(33.3, 77.7, 20)
    return [(sg * latf(s), s) for s in ss] + [(sg * (latf(s) + 8.6), s) for s in ss[::-1]]


lw = palace(math.sin(math.radians(313.5)) * 27.5, -math.cos(math.radians(313.5)) * 27.5)
EXISTING = [
    dict(code="T-01", name="Math Palace", shape=circle(0, 0, 28), h=15, area=2460, use="The glass dome over the rotunda of math exhibits: the heart of the campus. Phase 2 gives it a back door, onto the new garden."),
    dict(code="T-02", name="Classroom wing", shape=wing(1), h=7.2, area=480, use="M1 Mathematics, the coding lab, the seminar room, the lobby."),
    dict(code="T-03", name="Café and library wing", shape=wing(-1), h=7.2, area=480, use="Café π, reception, the library and the reading room."),
    dict(code="T-05", name="Logo wall", shape=rect(lw[0], lw[1], 4.8, 1.2, 0), h=1.45, area=0, use="The curved wall with the TTMath logo by the path, just past the ridge."),
]
def ground_at(lat, rad): h, g = at(lat, rad); return g if g is not None else 0.0


def latf(sv): return 10.5 - 1.5 * ((sv - 55.5) / 22.5) ** 2


def courtyard_top(lat, rad):
    """the courtyard hall's glass vault over a point (absolute): from the wings' roof edges up to the crown, which falls
    along the axis as in the room program"""
    K = R.COURTYARD; sv = min(max(rad, K["s0"]), K["s1"]); cr = float(np.interp(sv, [c[0] for c in K["crown"]], [c[1] for c in K["crown"]]))
    yE = 0.6 + 4.3 + 2.9 * (77.7 - sv) / 44.4; hw = latf(sv) - 1.2; t = min(1.0, abs(lat) / hw)
    if rad > K["s1"]: return K["airlock"]["h"]
    return yE + (cr - yE) * (1 - t * t)


def rel(fn): return lambda lat, rad: fn(lat, rad) - ground_at(lat, rad)


def winter_top(lat, rad): return 0.134 + R.WINTER["crown"]


def gallery_top(lat, rad):
    r = math.hypot(lat, rad); G = R.GALLERY; t = min(1.0, max(0.0, (r - G["r0"]) / (G["r1"] - G["r0"])))
    return (0.134 + 5.6) * (1 - t) + (ground_at(lat, rad) + G["wall"]) * t


def dome_top(dm):
    def f(lat, rad):
        a, h = dm["r"], dm["h"]; rho = (a * a + h * h) / (2 * h); q = math.hypot(lat - dm["lat"], rad - dm["rad"])
        return dm["floor"] + 0.134 + h - rho + math.sqrt(max(0.0, rho * rho - q * q))
    return f


def link_shape(L):
    (la, ra), (lb, rb) = L["a"], L["b"]; ux, uy = lb - la, rb - ra; n = math.hypot(ux, uy) or 1
    vx, vy = -uy / n * (L["w"] / 2 + 0.4), ux / n * (L["w"] / 2 + 0.4)                       # the clear width and the walls
    return [(la + vx, ra + vy), (lb + vx, rb + vy), (lb - vx, rb - vy), (la - vx, ra - vy)]


NEW = [
    dict(code="T-04", name="Courtyard hall and entrance", short="Courtyard hall", shape=[(-latf(sv) + 1.2, sv) for sv in np.linspace(33.3, 77.7, 12)] + [(-3.5, 77.7), (-3.5, 84.0), (3.5, 84.0), (3.5, 77.7)] + [(latf(sv) - 1.2, sv) for sv in np.linspace(77.7, 33.3, 12)],
         h=6.0, hprof=rel(courtyard_top), h_note="glass vault, 10.6 m by the palace to 6.2 m at the gateway", area=900, label_dy=-30,
         use="The courtyard between the wings, sealed under a glass vault on slender steel ribs; the entrance airlock under the gateway (the way in from the start); a pod stop beside it.",
         look="Clear glass on steel ribs every 1.5 m, springing from the wings' roof edges; the gateway arch in front of the airlock's glass."),
    dict(code="T04-03", name="Pod stop", short="Pod stop", shape=[(R.COURTYARD["podstop"]["lat"] + R.COURTYARD["podstop"]["r"] * math.sin(2 * math.pi * k / 24), R.COURTYARD["podstop"]["rad"] + R.COURTYARD["podstop"]["r"] * math.cos(2 * math.pi * k / 24)) for k in range(24)],
         h=2.45, hprof=lambda lat, rad: (lambda q: 2.45 if q < 1.6 else (1.95 if q < 3.9 else 0.15))(math.hypot(lat - R.COURTYARD["podstop"]["lat"], rad - R.COURTYARD["podstop"]["rad"])), h_note="the pod 2.45 m tall, its rotor ducts 1.95 m", area=0, ground=True, nolabel=True,
         use="A pad right beside the airlock with one pod: take it and fly over the campus.", look="A dark pad with a ring of lights, the pod in white composite."),
    dict(code="T-06", name="The Crescent: the Academy", shape=arc(R.CRESCENT["r0"], R.CRESCENT["r1"], R.CRESCENT["a0"], R.CRESCENT["a1"]), h=9.0, hprof=rel(lambda lat, rad: 0.134 + 7.0), h_note="7 m above the palace's floor", area=3140, floors=2,
         use="Six big classrooms named after mathematicians (Euclid, Hypatia, Fibonacci, Noether, Gauss, Turing), each about 17 by 12 m under a 4.5 m ceiling, a study hall, a competition room, a games room and lounge, the teachers' room, on two floors in a crescent that wraps the back of the dome. The upper floor opens onto the winter garden, the lower onto the garden gallery.",
         look="White fibre-composite shell like the wings, a glass front onto the garden, oak and terrazzo inside."),
    dict(code="T-07", name="Infinity Hall", shape=fan(R.INFINITY), h=11.0, hprof=infinity_height, h_note="11 m at the stage, 6.5 m at the foyer", area=900,
         use="A lecture theatre with 240 seats on 12 rows climbing the slope like a Greek theatre, a stage and a screen 14 m wide: talks, competitions, films, the graduation.",
         look="A low shell shaped like a lemniscate (∞) in plan above the foyer, copper-coloured cladding, timber inside."),
    dict(code="T-08", name="Garden of Primes", shape=rect(R.GREENHOUSE["lat"], R.GREENHOUSE["rad"], 2 * R.GREENHOUSE["vault_w"] + R.GREENHOUSE["link_w"], R.GREENHOUSE["vault_l"], 0), h=8.0, area=1010,
         use="Two glass barrel vaults full of real plants under grow lights: vegetables and herbs for the café, citrus and fig trees, a fern grotto, benches among the beds. A biology class and a quiet place to read.",
         look="Clear vaults on white steel ribs, plants in raised beds, a path that turns at prime numbers of steps."),
    dict(code="T09-01", name="Winter garden", shape=arc(R.WINTER["r0"], R.WINTER["r1"], -R.WINTER["a"], R.WINTER["a"]), h=13.0, hprof=rel(winter_top), h_note="glass vault 13 m tall", area=1170, label_dy=6,
         use="The back terrace between the dome and the Crescent, sealed under a glass vault on bronze ribs: stone paving, olive trees, palms and red maples in big planters, long benches.",
         look="A curved glass vault wrapping the back of the dome, from a low stone plinth by the dome to the Crescent's eave."),
    dict(code="T06-15", name="Garden gallery", shape=arc(R.GALLERY["r0"], R.GALLERY["r1"], -R.GALLERY["a"], R.GALLERY["a"]), h=7.0, hprof=rel(gallery_top), h_note="glass roof sloping from the Crescent's eave to a low wall", area=800, nolabel=True,
         use="The court along the Crescent's garden front under a sloping glass roof; it opens into the upper garden dome.", look="Glass on bronze rafters, a low stone wall, planters."),
    dict(code="T09-02", name="Upper garden dome", shape=[(R.DOMES[0]["lat"] + R.DOMES[0]["r"] * math.sin(2 * math.pi * k / 48), R.DOMES[0]["rad"] + R.DOMES[0]["r"] * math.cos(2 * math.pi * k / 48)) for k in range(48)],
         h=16, hprof=rel(dome_top(R.DOMES[0])), h_note="glass dome 16 m tall", area=1521,
         use="The Fibonacci Garden's top dome, level with the Crescent's lower floor: lawns and flower beds on the golden spiral, the Klein bottle and the trefoil knot.", look="A geodesic dome of triangular glass panes on white steel, 44 m across."),
    dict(code="T09-03", name="Spiral garden dome", shape=[(R.DOMES[1]["lat"] + R.DOMES[1]["r"] * math.sin(2 * math.pi * k / 48), R.DOMES[1]["rad"] + R.DOMES[1]["r"] * math.cos(2 * math.pi * k / 48)) for k in range(48)],
         h=18, hprof=rel(dome_top(R.DOMES[1])), h_note="glass dome 18 m tall", area=1521,
         use="A step lower: the golden spiral path through ferns, grasses and flowering shrubs, the Möbius bench, a pool.", look="A geodesic dome of triangular glass panes on white steel, 44 m across."),
    dict(code="T09-05", name="Lower garden dome", shape=[(R.DOMES[2]["lat"] + R.DOMES[2]["r"] * math.sin(2 * math.pi * k / 48), R.DOMES[2]["rad"] + R.DOMES[2]["r"] * math.cos(2 * math.pi * k / 48)) for k in range(48)],
         h=20, hprof=rel(dome_top(R.DOMES[2])), h_note="glass dome 20 m tall", area=1521,
         use="The lowest and tallest dome: fruit trees and tall palms, the stellated dodecahedron, the plaza at the observatory's door.", look="A geodesic dome of triangular glass panes on white steel, 44 m across."),
    dict(code="T-17", name="The links", shapes=[link_shape(L) for L in R.LINKS], shape=link_shape(R.LINKS[2]), h=2.4, area=sum(round(math.hypot(L["b"][0] - L["a"][0], L["b"][1] - L["a"][1]) * L["w"]) for L in R.LINKS), nolabel=True,
         use="Sealed galleries joining every building to the next: a trough half sunk in the ground, banked with regolith, under a glass vault on steel ribs.", look="Low glass vaults over regolith banks."),
    dict(code="T-10", name="Observatory", name_dy=24, shape=circle(R.OBSERVATORY["lat"], R.OBSERVATORY["rad"], R.OBSERVATORY["r"]), h=24.0, area=1020, floors=4,
         use="A tower with a telescope dome on top, at the foot of the garden on the palace's axis: Mars's night sky, Earth and the Moon as evening stars, Phobos and Deimos. A viewing deck round the dome.",
         look="A slender stone-clad tower, a white dome 9 m across that opens, a ring of windows at the deck."),
    dict(code="T-11", name="Low-gravity Sports Dome", short="Sports Dome", shape=circle(R.SPORTS["lat"], R.SPORTS["rad"], R.SPORTS["r"]), h=16.0, area=900,
         use="A sports hall under a dome 34 m across for games in Mars gravity (0.38 g): basketball with 2.6 times the hang time, a climbing wall, a fitness gallery with treadmills that load you to your Earth weight.",
         look="A ribbed composite dome with a band of windows, a sprung timber floor inside."),
    dict(code="T-12", name="Robotics and Rover Hangar", short="Rover Hangar", shape=rect(R.HANGAR["lat"], R.HANGAR["rad"], R.HANGAR["w"], R.HANGAR["d"], 0), h=8.0, area=750,
         use="The engineering lab where students build robots and rovers, and the hangar for the campus rovers, with a suitport for each and a workshop. The test yard next to it has a track with ramps and rocks.",
         look="A long steel and composite hall with three big doors onto the yard, a rover in each bay."),
    dict(code="T-13", name="Rover test yard", short="Test yard", shape=rect(108, -152, 30, 36, 0), h=0, area=0, ground=True,
         use="A track over gravel, ramps, a rock garden and a sand trap, for the students' rovers: outside, on the Mars ground, for the rovers only (they dock to the hangar's suitports).", look="Marked lines and cones; floodlights on masts."),
    dict(code="T-14", name="Pod Port", shape=[(-24, -184), (64, -184), (64, -230), (-24, -230)], h=0, area=0, ground=True,
         use="A parking field for flying pods, ready for travel when it comes: six landing pads 14 m across with lit rings and charging masts, pods parked on four of them, a taxi lane to the terminal. Outside, for the pods only: people board through the terminal's collars.",
         look="Dark pads with white markings and a ring of lights; the pods in white composite with tinted canopies."),
    dict(code="T-15", name="Pod terminal", shape=rect(R.TERMINAL["lat"], R.TERMINAL["rad"], R.TERMINAL["w"], R.TERMINAL["d"], 0), h=6.0, area=310,
         use="A glass lounge by the pads: check-in, a waiting room with the view, a charging room, the pod crew's office and two boarding collars, so nobody needs a suit.",
         look="A low glass pavilion under a thin white roof that overhangs the pad side."),
    dict(code="T-16", name="Sun court", shape=rect(R.SUNCOURT["lat"], R.SUNCOURT["rad"], R.SUNCOURT["w"], R.SUNCOURT["d"], 0), h=3.0, hprof=rel(lambda lat, rad: R.SUNCOURT["crown"]), h_note="sunk; glass vault crown 4.4 m above the palace's floor", area=230,
         use="Where the solar field stood behind the classroom wing (the campus is on the city's grid): a classroom round a bronze armillary sundial that keeps Mars time, in a sunken court under a low glass vault, in from the lobby by a link.",
         look="Basalt paving, long stone benches, the bronze sphere on a stone plinth, a low glass vault on bronze ribs."),
]
PADS = R.PODPORT["pads"]


# ------------------------------------------------------------------------------------------------- checks
def inside(pts, lat, rad):
    c = False
    for i in range(len(pts)):
        (x0, y0), (x1, y1) = pts[i], pts[i - 1]
        if (y0 > rad) != (y1 > rad) and lat < x0 + (rad - y0) * (x1 - x0) / (y1 - y0): c = not c
    return c


def check(b):
    """the smallest clearance under the line of sight over the footprint (outline and a 2 m grid inside it), with the
    building's height at each point (hprof, or its height h everywhere); returns (clearance, mean ground)"""
    if "shapes" in b:
        rs = [check({k: v for k, v in dict(b, shape=sh).items() if k != "shapes"}) for sh in b["shapes"]]
        rs = [r for r in rs if r[0] is not None]
        return (min(r[0] for r in rs), sum(r[1] for r in rs) / len(rs)) if rs else (None, None)
    pts = b["shape"]; hp = b.get("hprof") or (lambda lat, rad: b["h"]); res = []
    lats, rads = [p[0] for p in pts], [p[1] for p in pts]
    step = 2.0 if (max(lats) - min(lats)) > 6 and (max(rads) - min(rads)) > 6 else 0.5
    grid = [(x, y) for x in np.arange(min(lats), max(lats), step) for y in np.arange(min(rads), max(rads), step) if inside(pts, x, y)]
    for (lat, rad) in pts + grid:
        h, g = at(lat, rad)
        if h is not None: res.append((h - hp(lat, rad), g))
    if not res: return None, None
    return min(m for m, g in res), sum(g for m, g in res) / len(res)


for b in EXISTING + NEW:
    b["spare"], b["gnd"] = check(b)

# ------------------------------------------------------------------------------------------------- the drawing
LAT0, LAT1, RAD0, RAD1 = -130.0, 150.0, -245.0, 135.0         # what the plan shows: the start at the bottom
S = 3.0                                                       # px per metre
W, H = int((LAT1 - LAT0) * S), int((RAD1 - RAD0) * S)


def px(lat, rad): return ((lat - LAT0) * S, (rad - RAD0) * S)


def colour(h):
    if h is None: return (238, 236, 230)
    if h < 0: return (230, 150, 135)
    stops = [(0, (247, 233, 196)), (4, (240, 226, 176)), (8, (205, 226, 184)), (14, (172, 212, 196)), (22, (150, 192, 206)), (34, (138, 168, 204)), (50, (130, 150, 196)), (70, (124, 140, 190))]
    for (h0, c0), (h1, c1) in zip(stops, stops[1:]):
        if h <= h1:
            t = (h - h0) / (h1 - h0); return tuple(int(a + (b2 - a) * t) for a, b2 in zip(c0, c1))
    return stops[-1][1]


bg = Image.new("RGB", (W // 3, H // 3))
for j in range(bg.height):
    for i in range(bg.width):
        lat = LAT0 + (i + 0.5) * 3 / S; rad = RAD0 + (j + 0.5) * 3 / S
        bg.putpixel((i, j), colour(at(lat, rad)[0]))
bg = bg.resize((W, H), Image.BILINEAR); buf = io.BytesIO(); bg.save(buf, "JPEG", quality=84)
BG = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()     # inside the SVG: an SVG shown as a picture loads nothing else

o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" font-family="Helvetica, Arial, sans-serif">' % (W, H + 70, W, H + 70),
     '<title>TTMath campus, phase 2: site plan</title>', '<image href="%s" x="0" y="0" width="%d" height="%d"/>' % (BG, W, H)]
# contour lines of the hidden height, every 10 m: read off the map
for lev in (5, 10, 20, 30, 40, 50):
    pass
for rr in (50, 100, 150, 200, 250, 300, 350):            # distance from the start
    pts = []
    for az in np.linspace(280, 375, 200):
        x, z = math.sin(math.radians(az)) * rr, -math.cos(math.radians(az)) * rr; lat, rad = palace(x, z)
        if LAT0 < lat < LAT1 and RAD0 < rad < RAD1: pts.append(px(lat, rad))
        elif pts: break
    if len(pts) > 2:
        o.append('<polyline points="%s" fill="none" stroke="#7d7a72" stroke-width="0.8" stroke-dasharray="3 4"/>' % " ".join("%.1f,%.1f" % p for p in pts))
        q = min(pts, key=lambda p: p[0]); o.append('<text x="%.1f" y="%.1f" font-size="10" fill="#6d6a62">%d m from the start</text>' % (max(4, q[0] + 4), q[1] - 4, rr))


def poly(b, fill, stroke, dash=None, sw=1.4, op=1.0):
    o.append('<polygon points="%s" fill="%s" fill-opacity="%.2f" stroke="%s" stroke-width="%.1f"%s/>' % (" ".join("%.1f,%.1f" % px(*p) for p in b["shape"]), fill, op, stroke, sw, ' stroke-dasharray="%s"' % dash if dash else ""))


def label(b, dy=0, size=12):
    cx = sum(p[0] for p in b["shape"]) / len(b["shape"]); cy = sum(p[1] for p in b["shape"]) / len(b["shape"]); x, y = px(cx, cy)
    o.append('<text x="%.1f" y="%.1f" font-size="%d" font-weight="700" text-anchor="middle" fill="#1d2124">%s</text>' % (x, y - 2 + dy, size, b["code"]))
    nm = b.get("short") or b["name"].split(":")[0]
    o.append('<text x="%.1f" y="%.1f" font-size="%.1f" text-anchor="middle" fill="#2c3336">%s</text>' % (x, y + 11 + dy + b.get("name_dy", 0), size - 2.5, E(nm)))


for b in EXISTING:
    poly(b, "#d6d2c8" if b.get("ground") else "#8e8a82", "#3a3733", sw=1.0, op=0.85)
for b in NEW:
    for sh in b.get("shapes") or [b["shape"]]:
        poly(dict(b, shape=sh), "#efe9da" if b.get("ground") else ("#e6f0f4" if b["code"] in ("T-04", "T06-15", "T09-01", "T-16") else ("#e3efd7" if b["code"].startswith("T09") else "#f7f3ea")),
             "#a8432a", dash="5 3" if b.get("ground") else None, sw=2.0 if not b.get("shapes") else 1.4, op=0.92)
for (lat, rad) in PADS:
    o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#4a4f55" stroke="#ffffff" stroke-width="1.6"/>' % (*px(lat, rad), 7 * S))
    o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#f2c14e" stroke-width="1.2"/>' % (*px(lat, rad), 6.2 * S))
for b in EXISTING:
    if b["code"] in ("T-01",): label(b, -10)
for b in NEW:
    if not b.get("nolabel"): label(b, dy=b.get("label_dy", 0), size=12 if b["code"] not in ("T-13", "T09-01") else 10)
# the links' code once, and the airlocks: where people meet the outside
x, y = px(-31.0, -86.0); o.append('<text x="%.1f" y="%.1f" font-size="10" font-weight="700" text-anchor="middle" fill="#1d2124">T-17</text>' % (x, y))
for (lat, rad, t, side) in ((0.0, 82.5, "airlock", -1), (72.0, -150.0, "suit room", 1), (6.0, -183.0, "collars", 1)):
    x, y = px(lat, rad); o.append('<rect x="%.1f" y="%.1f" width="9" height="9" fill="#c0392b" stroke="#ffffff" stroke-width="1"/><text x="%.1f" y="%.1f" font-size="9.5" fill="#c0392b" font-weight="700" text-anchor="%s">%s</text>' % (x - 4.5, y - 4.5, x + 8 * side, y + 3.5, "start" if side > 0 else "end", t))
# the start, the ridge view, north
sl, sr = palace(0, 0)
if LAT0 < sl < LAT1 and RAD0 < sr < RAD1:
    x, y = px(sl, sr); o.append('<circle cx="%.1f" cy="%.1f" r="6" fill="#c0392b"/><text x="%.1f" y="%.1f" font-size="12" fill="#c0392b" font-weight="700">start</text>' % (x, y, x + 9, y + 4))
d = np.array([float(np.array([0.0, -1.0]) @ RT), float(np.array([0.0, -1.0]) @ F)])        # north: (lat, rad) per metre north
d = d / np.linalg.norm(d); nx, ny = 46, 70
o.append('<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke="#1d2124" stroke-width="2.4"/><text x="%.1f" y="%.1f" font-size="14" font-weight="700" text-anchor="middle">N</text>' % (nx - d[0] * 18, ny - d[1] * 18, nx + d[0] * 18, ny + d[1] * 18, nx + d[0] * 30, ny + d[1] * 30 + 5))
# scale bar and key
o.append('<g transform="translate(20,%d)"><line x1="0" y1="20" x2="%.1f" y2="20" stroke="#1d2124" stroke-width="2"/>' % (H + 12, 50 * S))
for k in (0, 25, 50): o.append('<line x1="%.1f" y1="15" x2="%.1f" y2="25" stroke="#1d2124" stroke-width="1.5"/><text x="%.1f" y="40" font-size="11" text-anchor="middle">%d m</text>' % (k * S, k * S, k * S, k))
o.append('</g>')
kx = 240
for h, t in ((-1, "seen from the start"), (3, "hidden to 3 m"), (10, "10 m"), (20, "20 m"), (35, "35 m"), (60, "60 m")):
    c = colour(h); o.append('<rect x="%d" y="%d" width="16" height="12" fill="rgb%s" stroke="#8a867e"/><text x="%d" y="%d" font-size="11">%s</text>' % (kx, H + 24, str(c), kx + 21, H + 34, t)); kx += 135 if h < 0 else (115 if h < 5 else 80)
o.append('<text x="%d" y="%d" font-size="11" fill="#3a3733">grey: today · red outline: new (blue: glass covers, green: garden domes) · red squares: airlocks · the colours: how tall a building may be and stay hidden from the start</text>' % (240, H + 58))
o.append("</svg>")
open(os.path.join(OUT, "site-plan.svg"), "w").write("\n".join(o))

# ------------------------------------------------------------------------------------------------- the pages
CSS = """:root{color-scheme:light;--bg:#ECEAE4;--sheet:#FAF9F6;--ink:#1D2124;--ink2:#4F575B;--rule:#CFCBC2;--red:#A8432A}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif}
a{color:#2A6E8E}header{background:var(--sheet);border-bottom:1px solid var(--rule)}header .in,main,footer{max-width:1160px;margin:0 auto;padding:10px 16px}
header nav{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px}header nav a{color:var(--ink2);text-decoration:none;font-weight:600}header nav a.on{color:var(--red)}
.crumb{font:500 12px/1.4 ui-monospace,Menlo,monospace;color:var(--ink2);margin-bottom:6px}h1{font-size:clamp(28px,4.5vw,40px);line-height:1.1;margin:18px 0 8px}
h2{font-size:22px;margin:28px 0 8px}.lede{font-size:17.5px;max-width:76ch}figure{margin:16px 0;background:var(--sheet);border:1px solid var(--rule);padding:8px}
figure img{display:block;width:100%;height:auto}figcaption{font-size:14px;color:var(--ink2);padding:8px 4px 2px}
.tw{overflow-x:auto;background:var(--sheet);border:1px solid var(--rule)}table{width:100%;border-collapse:collapse;font-size:14.5px}
th,td{text-align:left;vertical-align:top;padding:8px 10px;border-top:1px solid var(--rule)}thead th{border-top:0;font:600 11.5px ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);background:#F1EFEA}
td.n{white-space:nowrap}td.code{font-weight:700;white-space:nowrap}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:10px}
.card{display:block;background:var(--sheet);border:1px solid var(--rule);padding:12px 14px;text-decoration:none;color:var(--ink)}.card b{display:block;font-size:18px}.card span{color:var(--ink2);font-size:14px}
.ask{background:#FFF6E3;border:1px solid #E4C98C;padding:12px 14px;margin:18px 0}footer{font-size:13px;color:var(--ink2);border-top:1px solid var(--rule);margin-top:28px}
@media (max-width:640px){table,tbody,tr,td{display:block}thead{display:none}tr{border-top:1px solid var(--rule);padding:8px 10px}td{border:0;padding:2px 0}}"""
open(os.path.join(OUT, "plan.css"), "w").write(CSS)
NAV = R.PLAN_NAV
PAGE = {b["code"]: b["page"] for b in R.BUILDINGS}
PAGE["T-13"] = "hangar.html"


def page(fn, title, body):
    nav = "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if h == fn else "", n) for h, n in NAV)
    open(os.path.join(OUT, fn), "w").write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s · TTMath campus, phase 2</title><meta name="robots" content="noindex"><link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="plan.css"></head>
<body><header><div class="in"><div class="crumb"><a href="../../">Mars – No Way Home</a> · <a href="../">TTMath on Mars</a> · <a href="index.html">TTMath campus, phase 2</a></div><nav>%s</nav></div></header>
<main>%s</main></body></html>
""" % (E(title), nav, body))


area_now = sum(b["area"] for b in EXISTING); area_new = sum(b["area"] for b in NEW)
rows = "".join('<tr><td class="code">%s</td><td><b>%s</b><br>%s</td><td class="n">%s</td><td>%s%s</td></tr>' % (
    ('<a href="%s">%s</a>' % (PAGE[b["code"]], b["code"])) if b["code"] in PAGE else b["code"], E(b["name"]), E(b["use"]), ("%s m²" % format(b["area"], ",")) if b["area"] else "outdoor",
    b.get("h_note") or (("%g m" % b["h"]) if b["h"] else "0 m"), (" · %.1f m below the line of sight" % b["spare"]) if b["spare"] is not None else "") for b in NEW)
page("index.html", "The plan", """<h1>TTMath campus, phase 2</h1>
<p class="lede">The campus grows to about three times its size on the slope behind the Math Palace, where the ground falls 15 to 20 m to the plain, and all of it is sealed: every room, court and garden is under a roof, a glass vault or a dome, and every building is joined to the next by a sealed link, so you go everywhere in shirt sleeves. People meet the outside only at airlocks; only the pods and the rovers go out. From the start nothing new can be seen: every building stays under the ridge's line of sight.</p>
<figure><a href="site-plan.svg"><img src="site-plan.svg" alt="Site plan of the TTMath campus with phase 2: the Math Palace and its courtyard, and behind it the Crescent, Infinity Hall, the Garden of Primes, the Fibonacci Garden, the observatory, the sports dome, the robotics and rover hangar and the pod port, over a map of how tall a building may be and stay hidden from the start"></a>
<figcaption><b>Site plan</b>, the start at the bottom, the campus rising up the page. Grey: today's campus. White with a red outline: new. The colours behind show how tall a building may be at each spot and still be hidden from the start.</figcaption></figure>
<p>Floor area today: about %s m². New: %s m². Together: %s m², <b>%.1f times</b> today's.</p>
<div class="cards"><a class="card" href="buildings.html"><b>The buildings</b><span>Each new building: what it is for, its size, how tall it may be</span></a>
<a class="card" href="rover.html"><b>The rover</b><span>A new rover that looks the part</span></a><a class="card" href="pods.html"><b>The pod port</b><span>Parking for flying pods, ready for travel</span></a></div>
<h2>Also in phase 2</h2><ul><li><b>Sealed</b> (Jim, 5 Oct 2026: "all the schools buildings should be connected and sealed … all open space should be covered by dome or sealed"): the courtyard under a glass vault with the entrance airlock under the gateway (T-04), the back terrace as a winter garden under glass (T09-01), the garden under three glass domes (T-09), the Sun court under a low vault (T-16), the links between every building (T-17).</li>
<li><b>Bigger classrooms, higher ceilings</b> (Jim: "class rooms are all too small and roof are too low"): the Crescent's classrooms about 17 by 12 m under 4.5 m ceilings; the wings' ceilings raised as high as their roofs allow.</li>
<li><b>Flying pods</b> (Jim: "add some flying pod I can take and can drive … to see the eagle view"): board one at the pod stop by the entrance or at the pod port and fly it.</li>
<li><b>More real look</b> everywhere: furniture, wood, the dome's glass and frame, and real plants.</li>
<li><b>No power plant on the campus:</b> it is on the grid of the city nearby. Where the solar field stood behind the classroom wing is now the Sun court (T-16).</li></ul>""" % (format(area_now, ","), format(area_new, ","), format(area_now + area_new, ","), (area_now + area_new) / area_now))
page("buildings.html", "The buildings", """<h1>The buildings</h1><p class="lede">The new buildings, covers and links, coded T-04 (the courtyard, now sealed) and T-06 to T-17 after today's T-01 to T-05; click a code for its floor plans and rooms. Heights are checked against the line of sight from the start over the whole footprint: the number after the height is how far the building stays below it at its tightest point.</p>
<div class="tw"><table><thead><tr><th>Code</th><th>What it is for</th><th>Floor area</th><th>Height</th></tr></thead><tbody>%s</tbody></table></div>
<h2>Today's campus</h2><ul>%s</ul>""" % (rows, "".join("<li><b>%s %s</b>: %s</li>" % (b["code"], E(b["name"]), E(b["use"])) for b in EXISTING)))
page("rover.html", "The rover", """<h1>The rover</h1><p class="lede">Today's rovers are boxy and plain. The new one is an expedition machine you would want to drive: long, low and muscular, built for Mars.</p>
<ul><li><b>Shape:</b> a wedge-nosed cabin 7.4 m long on a long-travel six-wheel chassis, each wheel on its own arm with an electric motor in the hub, so it can climb a 1 m rock or a 30° slope and stays level.</li>
<li><b>Cabin:</b> a wrap-around tinted canopy in one piece of glass for the view, seats for four, a suitport in the back for each.</li>
<li><b>Wheels:</b> 1.3 m open-mesh metal tyres like NASA's Mars tyres (spring wire, titanium treads), with lights in the hubs.</li>
<li><b>Body:</b> white and graphite composite with orange accents, panel lines, grab handles, a roof rack with a high-gain antenna, a light bar across the front and amber side markers.</li>
<li><b>Details that make it real:</b> dust on the lower body, scuffed treads, a winch on the nose, sample drawers on the sides, a docking collar at the back that seals onto the hangar.</li></ul>
<p>Three of them: one at the hangar (T-12), one by the gateway, one out on the test yard (T-13).</p>""")
print("new floor area", area_new, "total", area_now + area_new, "x%.2f" % ((area_now + area_new) / area_now))
for b in NEW: print(b["code"], b["name"][:28].ljust(28), "h", b["h"], "to spare", None if b["spare"] is None else round(b["spare"], 1), "ground", None if b["gnd"] is None else round(b["gnd"], 1))
bad = [b["code"] for b in NEW if b["spare"] is not None and b["spare"] < 0.5 and b.get("h")]
print("CHECK:", "every new building stays at least 0.5 m below the line of sight (today's campus is checked by hidden.py)" if not bad else "too tall: %s" % bad)
