"""The Crown's stops on the 360 tour (palace/tour/stops.js), one in every room of the main floor, and the render jobs
for their 360s. Each stop stands where its scene's stop is (`stops=` in palace/tools/render/crown_rooms.py,
crown_more.py and crown_wellness.py: keep the two in step), looks first at the room's main view, and links to the
stops either side of it round the ring.
  python3 palace/tools/tour_crown.py            write the Crown's stops into palace/tour/stops.js
  python3 palace/tools/tour_crown.py jobs       print the render jobs for the 360s, one line per scene
A stop whose new 360 is not published yet (not in CURRENT) is written hidden (ready: false): the 360s from before
show the old windows high on the walls, which Jim does not want seen (7 Oct 2026: "all the rooms should have the
window same as master room"); add its id to CURRENT when its 360 is published."""
import math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STOPS_JS = os.path.join(HERE, "..", "tour", "stops.js")
PANO = os.path.join(HERE, "..", "tour", "pano")
D = math.pi / 180
R_IN, R_GL, R_OUT = 115.0, 118.5, 135.0            # the Crown of revision H: the inner wall, the glass along the Glide, the outer wall
RM = (R_GL + R_OUT) / 2                             # the middle of the rooms
GLIDE = (R_IN + R_GL) / 2                           # the middle of the Glide
PC, PB, PL = 127.0, 198.0, 25.0                     # the sky pool (crown_wellness.py): its middle radius and bearing, its length
POOL0 = PB - PL / 2 / PC / D


def tang(m, r=RM): return m / r / D                 # metres along the ring at radius r, in degrees


# id, room code, scene (crown_rooms.py ROOMS), the scene's stop, where it stands (r, bearing), what it looks at first
# (r, bearing), name, short name, part, what you see
STOPS = [
    ("crown_stars", "C-30", "observatory", "stars", (RM + 1.0, 12.4), (R_OUT, 10.6), "The star lounge", "Star lounge", "Observatory",
     "The Observatory at night: round daybeds for two laid back under the stars, a velvet crescent sofa, kentia palms in silhouette, and walls of glass that clear for the night sky. Across the ring the other rooms' windows glow."),
    ("crown_telescope", "C-31", "observatory", "telescope", (RM - 1.5, 27.5), (R_OUT - 0.8, 31.2), "The telescope room", "Telescope room", "Observatory",
     "The control desk of the telescope in the dome above, with leather chairs at it, and a sofa facing the screens of what the telescope sees."),
    ("crown_breakfast", "C-33", "garden", "breakfast", (RM - 3.0, 44.5), (RM + 0.7, 40.9), "The breakfast room", "Breakfast room", "Garden room",
     "A round oak table for eight in upholstered chairs under a cluster of opal globes, an orchid on the table and lemon trees in pairs: late suppers under the stars, and breakfast at sunrise on a day off."),
    ("crown_garden", "C-34", "garden", "garden", (RM - 0.3, 59.2), (R_OUT - 1.2, 61.5), "The sky garden", "Sky garden", "Garden room",
     "A conservatory in the ring: red and orange maples, a golden ginkgo, olive and lemon trees, tree ferns, beds of lavender and herbs, and daybeds under the trees, with grow lights overhead and the plain through the windows."),
    ("crown_suit", "C-01", "suit", "suit", (RM, 75.6), (R_OUT - 0.8, 73.6), "The suit room", "Suit room", "Arrival",
     "The suits wait in their ports in the outer wall, so no dust comes in; a leather bench down the middle for the boots and a walnut counter for helmets and gloves."),
    ("crown_hangar", "C-02", "hangar", "hangar", (RM - 1.0, 84.7), (RM + 0.4, 81.4), "The pod hangar", "Pod hangar", "Arrival",
     "Arcadia's airlock: the pods fly in through the door in the outer wall, and the hangar fills with air in about 90 seconds while the dust is blown off them."),
    ("crown_door", "C-03", "arrival", "door", (RM, 93.6), (RM, 95.6), "The Door", "The Door", "Arrival",
     "Arcadia's front door, a round opening 5 m across closed by an iris of light that knows Jim by face, eyes and walk; orange maples flank it and curved leather benches line the walls."),
    ("crown_arrival", "C-04", "arrival", "arrival", (RM + 4.4, 98.6), (RM - 1.0, 104.0), "The Arrival hall", "Arrival", "Arrival",
     "20 m tall under the Arrival spire: the great maple, red and orange, in a round cognac banquette, a halo of light 12 m up, The Starry Night across the hall, and the portal to the Orb, the spires and the Pentagon."),
    ("crown_dressing", "C-06", "dressing", "dressing", (RM - 0.6, 112.3), (R_OUT - 0.5, 110.0), "The dressing room up", "Dressing room", "Master suite up",
     "Walnut wardrobes 3.2 m tall along the outer wall, an island of drawers under a cluster of globes, a round velvet ottoman, and Matisse's Woman with a Hat."),
    ("crown_bedroom", "C-07", "bedroom", "bedroom", (128.6, 123.5), (123.8, 123.2), "The bedroom up", "Bedroom up", "Master suite up",
     "The grand bed against its wall of walnut and velvet under a halo of light, red maples either side; a sitting group under Monet's Water Lilies at the bath end, and Jim's desk at the other."),
    ("crown_bath", "C-08", "bath_up", "bath_up", (RM - 0.6, 137.0), (R_OUT - 1.0, 136.9), "The bath up", "Bath up", "Master suite up",
     "A soaking tub by the windows under alabaster pendants, a white leather chaise, a marble vanity 4 m long, a tree fern in the humid corner, and Hokusai's Great Wave."),
    ("crown_hearth", "C-09", "salon", "hearth", (RM + 3.6, 149.2), (RM - 0.2, 146.2), "The hearth room", "Hearth room", "Salon",
     "A velvet crescent sofa round a marble table faces the hearth of lit mist in its stone wall, under Turner's Wreck of a Transport Ship; a golden ginkgo beside it."),
    ("crown_salon", "C-10", "salon", "salon", (RM + 2.4, 159.6), (RM - 1.2, 163.6), "The great salon", "Salon", "Salon",
     "20 m tall under the Salon spire: boucle sofas across a travertine table, a velvet crescent round a marble table facing the windows, red and orange maples between the groups, and Kandinsky and Delaunay on the screen walls."),
    ("crown_piano", "C-11", "salon", "piano_up", (RM + 1.2, 172.9), (RM, 176.5), "The recital room", "Recital room", "Salon",
     "The concert grand under a cluster of globes, two velvet crescents facing it, kentia palms either side, and Picabia's Udnie behind the audience."),
    ("crown_spa", "C-13", "wellness", "spa", (RM - 1.0, 187.6), (R_OUT - 2.0, 183.0), "The spa", "Spa", "Wellness",
     "A round hot pool under low opal globes, a cold plunge, a cedar sauna with a glass front, daybeds in white leather, chaises at the windows, and tree ferns by the frosted glass."),
    ("crown_wellness", "C-14", "wellness", "wellness", (PC, POOL0 - tang(1.0, PC)), (PC, PB + 2.0), "The sky pool", "Sky pool", "Wellness",
     "A pool 25 m along the ring, lit from below, where low gravity makes every wave rise high and fall slowly; daybeds along the windows, kentias, maples and a fiddle-leaf fig along the inner side, halos over the water."),
    ("crown_gym", "C-15", "wellness", "gym", (RM - 0.6, 208.6), (R_OUT - 1.0, 211.0), "The gym", "Gym", "Wellness",
     "Treadmills, bikes and rowers in a row facing the windows, a power rack before a mirror wall, mats for yoga by the glass, and Jim's photographs of Mars."),
    ("crown_wine", "C-16", "wine", "wine", (RM + 1.4, 219.4), (R_OUT - 0.6, 217.2), "The wine room", "Wine room", "Dining",
     "The wine wall and the tasting counter under its globes, oxblood sofas facing across a travertine table by the glass, and a banquette under Caravaggio's Basket of Fruit."),
    ("crown_dining", "C-17", "dining", "dining", (RM + 3.6, 232.2), (RM, 239.0), "The dining hall", "Dining hall", "Dining",
     "Under the Dining spire, one table of polished basalt for 22, high-backed velvet chairs, a line of halos down the table, lemon trees along the windows, and Van Gogh's olive trees and wheat field across the table."),
    ("crown_kitchen", "C-18", "kitchen_up", "kitchen_up", (RM + 1.0, 247.6), (R_OUT - 2.0, 243.2), "The chef's kitchen", "Chef's kitchen", "Dining",
     "Two islands of steel and marble under a halo, the cooking line under one long hood, the chef's table, and herbs in pots along the window."),
    ("crown_dayroom", "C-20", "day_room", "day_room", (RM - 0.6, 256.4), (R_OUT - 0.6, 254.5), "The guests' lounge", "Guests' lounge", "Sunset",
     "The guests' day room up in the Crown: a sectional and two club chairs round a travertine table, two guest desks, a kitchenette, and Mondrian and Léger on the walls."),
    ("crown_sunset", "C-21", "sunset", "sunset", (RM, 270.0), (R_OUT, 270.0), "The sunset lounge", "Sunset lounge", "Sunset",
     "Long low sofas and a rust velvet crescent face the west windows, where at sunset the sun shines straight in for a few minutes and the sky round it turns blue; agaves and a golden ginkgo by the glass."),
    ("crown_gallery", "C-22", "gallery", "gallery", (RM + 1.0, 283.5), (R_OUT - 0.4, 281.4), "The gallery", "Gallery", "Sunset",
     "The most paintings in the Crown, each under its own light, on both cross walls and on walls standing down the room; long leather benches, an old olive, and Van Gogh's Night Café between two kentias."),
    ("crown_study", "C-23", "library", "study", (RM, 292.0), (R_OUT - 2.0, 290.6), "The study up", "Study", "Library",
     "Jim's walnut desk under an alabaster pendant, a reading sofa and Van Gogh's Self-Portrait with a Straw Hat: letters home in the evening, with Earth a star in the window."),
    ("crown_library", "C-24", "library", "library", (RM - 3.0, 306.8), (R_OUT - 2.0, 309.0), "The library up", "Library up", "Library",
     "20 m tall under the Library spire: two floors of walnut shelves round a spiral stair, long reading tables under lamps, leather sofas by the windows and kentias between the shelves."),
    ("crown_maproom", "C-25", "library", "maproom", (RM + 2.6, 318.2), (RM - 0.2, 320.4), "The map room", "Map room", "Library",
     "A globe of Mars 3 m across, lit by washers, chests of map drawers, a long leather sofa facing the globe, and Claude Lorrain's Harbour with the Large Tower."),
    ("crown_studio", "C-27", "studio", "studio", (RM + 0.3, 332.2), (RM, 325.0), "The art studio", "Art studio", "Studio",
     "Three easels by the windows, a work table under a halo of daylight white, a linen sofa and a cognac daybed on a big rug, a red maple and a bird of paradise, and Jim's big canvases on the end wall."),
    ("crown_prints", "C-28", "studio", "prints", (RM - 1.0, 343.0), (130.4, 348.4), "The print room", "Print room", "Studio",
     "Jim's prints of Mars on both cross walls, a light table, the printers, a viewing sofa with club chairs, and a golden ginkgo by the glass."),
    ("crown_craft", "C-29", "studio", "craft", (RM - 1.0, 354.0), (R_OUT - 1.0, 356.0), "The craft room", "Craft room", "Studio",
     "The potter's wheel under a halo, workbenches, a board of drying pots, an olive and a lemon in terracotta; heavy work goes down to the workshops on L3."),
]
CURRENT = {"crown_arrival", "crown_bedroom", "crown_breakfast", "crown_door", "crown_dressing", "crown_hangar", "crown_suit"}   # stops whose 360 in palace/tour/pano/ is of the rooms as they are now (glass onto the Glide)
OTHER_LINKS = {   # links that are not to the next room round the ring
    "crown_arrival": [("bridge", (125.72, -39.40, 1.6), "Portal: down to the Pentagon")],
    "crown_stars": [("orb_earth", None, "Portal: up to the Orb")],
}


def xy(rb): r, b = rb; return (round(r * math.sin(b * D), 2), round(r * math.cos(b * D), 2))


def heading(frm, to):
    """the tour's az: degrees, 0 looking along +y (north), 90 along -x (west)"""
    (x0, y0), (x1, y1) = xy(frm), xy(to)
    return round(math.degrees(math.atan2(-(x1 - x0), y1 - y0)))


def stop_js(i, ready):
    sid, code, scene, key, at, look, name, short, part, d = STOPS[i]
    n = len(STOPS); prev, nxt = STOPS[(i - 1) % n], STOPS[(i + 1) % n]
    links = []
    for other, side in ((prev, -1), (nxt, 1)):
        same = other[8] == part                     # rooms of one part open into each other; between parts, out along the Glide
        bb = (at[1] + other[4][1]) / 2 if abs(at[1] - other[4][1]) < 180 else (at[1] + other[4][1] + 360) / 2
        p = xy((RM, bb) if same else (GLIDE, at[1] + side * 3.0))
        label = ("Through to the " if same else "The Glide: to the ") + other[6][4:].lstrip() if other[6].startswith("The ") else other[6]
        links.append('{ id: "%s", at: [%s, %s, 0], label: "%s" }' % (other[0], p[0], p[1], label))
    for (lid, lat, label) in OTHER_LINKS.get(sid, []):
        links.append('{ id: "%s", %slabel: "%s" }' % (lid, ("at: [%s, %s, %s], " % lat) if lat else "", label))
    ready = ready and os.path.exists(os.path.join(PANO, sid + ".jpg"))
    p = xy(at)
    return ('  { id: "%s", place: "crown", %sname: "%s", short: "%s", k: "The Crown · %s", p: [%s, %s], az0: %d, img: "pano/%s.jpg",\n'
            '    d: "%s",\n    links: [%s] }') % (sid, "" if ready else "ready: false, ", name, short, part, p[0], p[1], heading(at, look), sid, d.replace('"', '\\"'), ", ".join(links))


def write():
    s = open(STOPS_JS, encoding="utf-8").read()
    a = s.index("  /* The Crown, above ground")
    b = s.index("\n];", a)
    orb = re.findall(r'  \{ id: "orb_[a-z]+".*?\] \}', s[a:b], flags=re.S)       # the Orb's stops, kept as they are
    olds = {m.group(1): m.group(0) for m in re.finditer(r'  \{ id: "(crown_[a-z_]+)".*?\] \}', s[a:b], flags=re.S)}
    def one(i):
        sid = STOPS[i][0]
        return stop_js(i, sid in CURRENT)
    head = ("  /* The Crown, above ground, one stop in every room of the main floor (written by palace/tools/tour_crown.py):\n"
            "     positions in metres from the ring's centre, x east, y north (the rooms lie between 118.5 and 135 m out, the\n"
            "     Glide along the inner wall); z from the main floor, 41 m up. */\n")
    body = ",\n".join([one(i) for i in range(len(STOPS))] + orb)
    s = s[:a] + head + body + s[b:]
    open(STOPS_JS, "w", encoding="utf-8").write(s)
    print("stops.js: %d Crown stops: %d with their new 360, %d hidden until theirs is published; %d of the Orb kept" % (len(STOPS), len(CURRENT), len(STOPS) - len(CURRENT), len(orb)))


def jobs(out="final/crown_pano/%s.jpg"):
    by = {}
    for t in STOPS: by.setdefault(t[2], []).append(t[3])
    for scene, keys in by.items():
        ex = "2.0" if scene == "observatory" else "-0.2"
        print("./bvenv/bin/python blend/crown_rooms.py %s %s %s 1600 900 96 %s 4096 24" % (scene, ",".join("pano:" + k for k in keys), out, ex))


if __name__ == "__main__":
    jobs() if sys.argv[1:] == ["jobs"] else write()
