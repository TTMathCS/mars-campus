"""TTMath campus, phase 2: the plan for Jim's approval. Draws the site plan over the map of how tall a building may be
and stay hidden from the start (out/envelope.json from envelope.py) and writes the plan pages in ttmath/plan/.
usage: python3 ttmath/tools/campus_plan.py   (needs numpy and Pillow)
Places are in the Math Palace's frame, in metres: rad from the dome's centre toward the start (the visitor), lat to
the visitor's right. The program (what each building is for) is PROGRAM below; heights are checked against the map."""
import base64, html, io, json, math, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); TT = os.path.dirname(HERE); OUT = os.path.join(TT, "plan")
os.makedirs(OUT, exist_ok=True); E = html.escape
ENV = json.load(open(os.path.join(HERE, "out", "envelope.json")))
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


def fan(lat, rad, r0, r1, a0, a1, n=24):
    """a fan (a lecture hall): stage at the point (lat, rad) facing +rad... angles from the +rad axis"""
    pts = [(lat + r1 * math.sin(math.radians(a)), rad - r1 * math.cos(math.radians(a))) for a in np.linspace(a0, a1, n)]
    pts += [(lat + r0 * math.sin(math.radians(a)), rad - r0 * math.cos(math.radians(a))) for a in np.linspace(a1, a0, n)]
    return pts


def wing(sg):
    latf = lambda s: 10.5 - 1.5 * ((s - 55.5) / 22.5) ** 2
    ss = np.linspace(33.3, 77.7, 20)
    return [(sg * latf(s), s) for s in ss] + [(sg * (latf(s) + 8.6), s) for s in ss[::-1]]


lw = palace(math.sin(math.radians(313.5)) * 27.5, -math.cos(math.radians(313.5)) * 27.5)
EXISTING = [
    dict(code="T-01", name="Math Palace", shape=circle(0, 0, 28), h=15, area=2460, use="The glass dome over the rotunda of math exhibits: the heart of the campus. Phase 2 gives it a back door, onto the new garden."),
    dict(code="T-02", name="Classroom wing", shape=wing(1), h=7.2, area=480, use="M1 Mathematics, the coding lab, the seminar room, the lobby."),
    dict(code="T-03", name="Café and library wing", shape=wing(-1), h=7.2, area=480, use="Café π, reception, the library and the reading room."),
    dict(code="T-04", name="Courtyard and gateway", shape=[(-9, 33), (9, 33), (8.8, 79), (-8.8, 79)], h=5.6, area=0, ground=True, use="The paved courtyard between the wings, the gateway with the campus name."),
    dict(code="T-05", name="Logo wall", shape=rect(lw[0], lw[1], 4.8, 1.2, 0), h=1.45, area=0, use="The curved wall with the TTMath logo by the path, just past the ridge."),
]
NEW = [
    dict(code="T-06", name="The Crescent: the Academy", shape=arc(46, 60, -50, 50), h=9.0, area=2600, floors=2,
         use="Eight classrooms, each named after a mathematician (Euclid, Archimedes, Hypatia, Fibonacci, Gauss, Noether, Ramanujan, Turing), a competition room, the teachers' room, a student lounge and a study hall, on two floors in a crescent that wraps the back of the dome. Its roof is a terrace you walk out onto from the palace's back door.",
         look="White fibre-composite shell like the wings, a glass front onto the garden, oak and terrazzo inside."),
    dict(code="T-07", name="Infinity Hall", shape=fan(-60, -86, 6, 34, -38, 38), h=13.0, area=900,
         use="A lecture theatre with 240 seats on raked tiers, a stage and a screen 14 m wide: talks, competitions, films, the graduation.",
         look="A low shell shaped like a lemniscate (∞) in plan above the foyer, copper-coloured cladding, timber inside."),
    dict(code="T-08", name="Garden of Primes", shape=rect(62, -100, 26, 40, 0), h=8.0, area=1040,
         use="Two glass barrel vaults full of real plants under grow lights: vegetables and herbs for the café, citrus and fig trees, a fern grotto, benches among the beds. A biology class and a quiet place to read.",
         look="Clear vaults on white steel ribs, plants in raised beds, a path that turns at prime numbers of steps."),
    dict(code="T-09", name="Fibonacci Garden", shape=[(-36, -66), (36, -66), (30, -132), (-30, -132)], h=0, area=0, ground=True,
         use="A garden in three terraces down the slope from the palace to the observatory, its paths laid on a golden spiral: basalt gravel, Mars rock, math sculptures (a Klein bottle, a trefoil knot, a Möbius bench), lights at Fibonacci distances.",
         look="Stone walls, gravel, sculptures in bronze and stone: built for Mars, nothing that needs air."),
    dict(code="T-10", name="Observatory", name_dy=24, shape=circle(0, -146, 9), h=24.0, area=320, floors=4,
         use="A tower with a telescope dome on top, at the foot of the garden on the palace's axis: Mars's night sky, Earth and the Moon as evening stars, Phobos and Deimos. A viewing deck round the dome.",
         look="A slender stone-clad tower, a white dome 9 m across that opens, a ring of windows at the deck."),
    dict(code="T-11", name="Low-gravity Sports Dome", short="Sports Dome", shape=circle(-58, -158, 17), h=16.0, area=900,
         use="A sports hall under a dome 34 m across for games in Mars gravity (0.38 g): basketball with 2.6 times the hang time, a climbing wall, a running track round the edge.",
         look="A ribbed composite dome with a band of windows, a sprung timber floor inside."),
    dict(code="T-12", name="Robotics and Rover Hangar", short="Rover Hangar", shape=rect(72, -156, 34, 22, 0), h=8.0, area=750,
         use="The engineering lab where students build robots and rovers, and the hangar for the campus rovers, with a suitport for each and a workshop. The test yard next to it has a track with ramps and rocks.",
         look="A long steel and composite hall with three big doors onto the yard, a rover in each bay."),
    dict(code="T-13", name="Rover test yard", short="Test yard", shape=rect(108, -152, 30, 36, 0), h=0, area=0, ground=True,
         use="A track over gravel, ramps, a rock garden and a sand trap, for the students' rovers.", look="Marked lines and cones; floodlights on masts."),
    dict(code="T-14", name="Pod Port", shape=[(-24, -184), (64, -184), (64, -230), (-24, -230)], h=0, area=0, ground=True,
         use="A parking field for flying pods, ready for travel when it comes: six landing pads 14 m across with lit rings and charging masts, pods parked on four of them, a taxi lane to the terminal.",
         look="Dark pads with white markings and a ring of lights; the pods in white composite with tinted canopies."),
    dict(code="T-15", name="Pod terminal", shape=rect(20, -173, 26, 12, 0), h=6.0, area=310,
         use="A glass lounge by the pads: check-in, a waiting room with the view, a charging room and the pod crew's office.",
         look="A low glass pavilion under a thin white roof that overhangs the pad side."),
]
PADS = [(lat, rad) for rad in (-198, -218) for lat in (-6, 20, 46)]


# ------------------------------------------------------------------------------------------------- checks
def check(b):
    pts = b["shape"]; hs = []
    for (lat, rad) in pts + [(sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))]:
        h, g = at(lat, rad)
        if h is not None: hs.append((h, g))
    if not hs: return None, None
    return min(h for h, g in hs), sum(g for h, g in hs) / len(hs)


for b in EXISTING + NEW:
    b["limit"], b["gnd"] = check(b)

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
    poly(b, "#efe9da" if b.get("ground") else "#f7f3ea", "#a8432a", dash="5 3" if b.get("ground") else None, sw=2.0, op=0.92)
for (lat, rad) in PADS:
    o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#4a4f55" stroke="#ffffff" stroke-width="1.6"/>' % (*px(lat, rad), 7 * S))
    o.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#f2c14e" stroke-width="1.2"/>' % (*px(lat, rad), 6.2 * S))
for b in EXISTING:
    if b["code"] in ("T-01",): label(b, -10)
for b in NEW: label(b, size=12 if b["code"] not in ("T-13",) else 10)
# paths: the palace's back door down the garden's axis to the observatory and the pod port; branches to each building
for path in ([(0, -28), (0, -46)], [(0, -60), (0, -137)], [(0, -155), (20, -167)], [(0, -100), (-40, -96), (-55, -96)], [(0, -100), (40, -100), (49, -100)],
             [(0, -125), (-40, -142)], [(0, -125), (55, -145)], [(20, -179), (20, -190)]):
    o.append('<polyline points="%s" fill="none" stroke="#a8432a" stroke-width="2.2" stroke-dasharray="1 4" stroke-linecap="round"/>' % " ".join("%.1f,%.1f" % px(*p) for p in path))
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
o.append('<text x="%d" y="%d" font-size="11" fill="#3a3733">grey: today · white, red outline: new · how tall a building may be and stay hidden from the start</text>' % (240, H + 58))
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
NAV = [("index.html", "The plan"), ("buildings.html", "The buildings"), ("rover.html", "The rover"), ("pods.html", "The pod port")]


def page(fn, title, body):
    nav = "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if h == fn else "", n) for h, n in NAV)
    open(os.path.join(OUT, fn), "w").write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s · TTMath campus, phase 2</title><meta name="robots" content="noindex"><link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="plan.css"></head>
<body><header><div class="in"><div class="crumb"><a href="../../">Mars – No Way Home</a> · <a href="../">TTMath on Mars</a> · TTMath campus, phase 2 · for Jim's approval</div><nav>%s</nav></div></header>
<main>%s</main><footer><p>Drawn by <code>ttmath/tools/campus_plan.py</code> from the program in it and the line-of-sight map from <code>ttmath/tools/envelope.py</code>.</p></footer></body></html>
""" % (E(title), nav, body))


area_now = sum(b["area"] for b in EXISTING); area_new = sum(b["area"] for b in NEW)
rows = "".join('<tr><td class="code">%s</td><td><b>%s</b><br>%s</td><td class="n">%s</td><td class="n">%s m%s</td></tr>' % (
    b["code"], E(b["name"]), E(b["use"]), ("%s m²" % format(b["area"], ",")) if b["area"] else "outdoor",
    ("%g" % b["h"]) if b["h"] else "0", (" · hidden to %d m" % b["limit"]) if b["limit"] is not None else "") for b in NEW)
page("index.html", "The plan", """<h1>TTMath campus, phase 2</h1>
<p class="lede">The campus grows to about three times its size: ten new buildings and spaces on the slope behind the Math Palace, where the ground falls 15 to 20 m to the plain. From the start nothing new can be seen: every building stays under the ridge's line of sight, checked against the real terrain. You reach the new quarter through a new back door in the rotunda, or round the dome.</p>
<figure><a href="site-plan.svg"><img src="site-plan.svg" alt="Site plan of the TTMath campus with phase 2: the Math Palace and its courtyard, and behind it the Crescent, Infinity Hall, the Garden of Primes, the Fibonacci Garden, the observatory, the sports dome, the robotics and rover hangar and the pod port, over a map of how tall a building may be and stay hidden from the start"></a>
<figcaption><b>Site plan</b>, the start at the bottom, the campus rising up the page. Grey: today's campus. White with a red outline: new. The colours behind show how tall a building may be at each spot and still be hidden from the start.</figcaption></figure>
<p>Floor area today: about %s m². New: %s m². Together: %s m², <b>%.1f times</b> today's.</p>
<div class="cards"><a class="card" href="buildings.html"><b>The buildings</b><span>Each new building: what it is for, its size, how tall it may be</span></a>
<a class="card" href="rover.html"><b>The rover</b><span>A new rover that looks the part</span></a><a class="card" href="pods.html"><b>The pod port</b><span>Parking for flying pods, ready for travel</span></a></div>
<div class="ask"><b>For your approval:</b> the layout and the list of buildings. Once you approve, I build them into the demo, one at a time, starting with the Crescent (more classrooms) and the pod port. Say what to change by its code (T-06 …).</div>
<h2>Also in phase 2</h2><ul><li><b>More real look</b> everywhere: furniture, wood, the dome's glass and frame, and real plants in the Garden of Primes (already in hand; it needs no approval).</li>
<li>The <b>solar panels</b> behind the classroom wing go: the campus draws its power from the town's reactor, so the ground stays clean.</li></ul>""" % (format(area_now, ","), format(area_new, ","), format(area_now + area_new, ","), (area_now + area_new) / area_now))
page("buildings.html", "The buildings", """<h1>The buildings</h1><p class="lede">Ten new buildings and spaces, coded T-06 to T-15 after today's T-01 to T-05. Heights are checked against the line of sight from the start: "hidden to" is the most a building could be there.</p>
<div class="tw"><table><thead><tr><th>Code</th><th>What it is for</th><th>Floor area</th><th>Height</th></tr></thead><tbody>%s</tbody></table></div>
<h2>Today's campus</h2><ul>%s</ul>""" % (rows, "".join("<li><b>%s %s</b>: %s</li>" % (b["code"], E(b["name"]), E(b["use"])) for b in EXISTING)))
page("rover.html", "The rover", """<h1>The rover</h1><p class="lede">Today's rovers are boxy and plain. The new one is an expedition machine you would want to drive: long, low and muscular, built for Mars.</p>
<ul><li><b>Shape:</b> a wedge-nosed cabin 7.4 m long on a long-travel six-wheel chassis, each wheel on its own arm with an electric motor in the hub, so it can climb a 1 m rock or a 30° slope and stays level.</li>
<li><b>Cabin:</b> a wrap-around tinted canopy in one piece of glass for the view, seats for four, a suitport in the back for each.</li>
<li><b>Wheels:</b> 1.3 m open-mesh metal tyres like NASA's Mars tyres (spring wire, titanium treads), with lights in the hubs.</li>
<li><b>Body:</b> white and graphite composite with orange accents, panel lines, grab handles, a roof rack with a high-gain antenna, a light bar across the front and amber side markers.</li>
<li><b>Details that make it real:</b> dust on the lower body, scuffed treads, a winch on the nose, sample drawers on the sides, a docking collar at the back that seals onto the hangar.</li></ul>
<p>Three of them: one at the hangar (T-12), one by the gateway, one out on the test yard (T-13).</p>""")
page("pods.html", "The pod port", """<h1>The pod port</h1><p class="lede">A parking field for flying pods (T-14) with its terminal (T-15), at the far end of the campus on the plain, where nothing on the ground can be seen from the start. Built now so the campus is ready for travel by air when it comes.</p>
<ul><li><b>Six pads</b> 14 m across in two rows, dark with white markings, a ring of lights round each, a charging mast beside it; a taxi lane to the terminal.</li>
<li><b>The pods:</b> four parked on the pads, two-seat craft about 6 m long: a teardrop cabin in white composite with a tinted canopy, four big ducted rotors (Mars's thin air needs large blades), landing skids, navigation lights. No toy shapes: proportions and detail of a real aircraft.</li>
<li><b>The terminal:</b> a glass lounge under a thin white roof, check-in, a waiting room with the view of the pads, a charging room.</li></ul>""")
print("new floor area", area_new, "total", area_now + area_new, "x%.2f" % ((area_now + area_new) / area_now))
for b in NEW: print(b["code"], b["name"][:28].ljust(28), "h", b["h"], "limit", None if b["limit"] is None else round(b["limit"], 1), "ground", None if b["gnd"] is None else round(b["gnd"], 1))
