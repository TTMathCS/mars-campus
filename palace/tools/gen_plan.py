"""The design plan's area pages, room by room: for each area and room, what it is for, the facts, its pictures
(path-traced stills and 360° views from the photo tour) and where it is on the floor plans. Re-run it whenever a
render goes into the tour: a picture or a 360° view appears on its page as soon as it exists.
  python3 palace/tools/gen_plan.py      -> palace/design/rooms-*.html and their posters in palace/design/img/pano/"""
import html, os, re
from PIL import Image

PAL = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); DES = os.path.join(PAL, "design"); TOUR = os.path.join(PAL, "tour")
STOPS_JS = open(os.path.join(TOUR, "stops.js"), encoding="utf-8").read()


def stop_ready(sid):
    m = re.search(r'^\s*\{ id: "%s",([^\n]*)' % re.escape(sid), STOPS_JS, re.M)
    return bool(m) and "ready: false" not in m.group(1) and os.path.exists(os.path.join(TOUR, "pano", stop_img(sid)))


def stop_img(sid):
    m = re.search(r'^\s*\{ id: "%s",[^\n]*?img: "pano/([^"]+)"' % re.escape(sid), STOPS_JS, re.M)
    return m.group(1) if m else sid + ".jpg"


def stop_az0(sid):
    m = re.search(r'^\s*\{ id: "%s",[^\n]*?az0: (-?[\d.]+)' % re.escape(sid), STOPS_JS, re.M)
    return float(m.group(1)) if m else 0.0


def poster(sid):
    """a still from the 360, looking where the tour first looks, for the player's cover"""
    out = os.path.join(DES, "img", "pano", sid + ".jpg"); src = os.path.join(TOUR, "pano", stop_img(sid))
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        im = Image.open(src).convert("RGB"); W, H = im.size
        w = int(W * 100 / 360); h = int(w * 9 / 16); cx = int((0.5 - stop_az0(sid) / 360.0) * W) % W
        x0 = cx - w // 2
        if x0 < 0 or x0 + w > W:                          # the view wraps round the picture's edge: turn it half round
            half = Image.new("RGB", (W, H)); half.paste(im.crop((W // 2, 0, W, H)), (0, 0)); half.paste(im.crop((0, 0, W // 2, H)), (W - W // 2, 0))
            im = half; x0 = (x0 + W // 2) % W
        im.crop((x0, H // 2 - h // 2, x0 + w, H // 2 - h // 2 + h)).resize((960, 540), Image.LANCZOS).save(out, "JPEG", quality=84)
    return "img/pano/%s.jpg" % sid


def photo_ok(path):
    return os.path.exists(os.path.join(DES, path))


E = html.escape

# ------------------------------------------------------------------ the areas and their rooms
# photos: (path from palace/design/, caption); views: (tour stop, label); plan: (image, caption)
RESIDENCE = dict(
    id="rooms-residence", no="03 · 1", title="L1 · Jim's residence",
    lede="Jim's home below ground: sector 1 of L1, 24 m under the plain and 16 m of soil, which stop the radiation, hold the air in and keep the warmth steady. It is the safest place on Mars to live. The front rooms stand behind 28.8 m of glass onto the atrium's terraces and gardens; behind them runs a street lit from above, and across it the master suite down wraps round a moss garden.",
    plan=("img/plan/l1-residence.jpg", "Where it is: sector 1 of L1, south-east of the atrium. Shaded, ring A (the music room, the family room and the dining room) and ring B (the master suite down, between the laundry and the kitchen)."),
    plan_codes=["L1-01", "L1-02", "L1-03", "L1-05", "L1-06", "L1-07", "L1-08", "L1-09", "L1-10"],
    rooms=[
        dict(id="family", codes=["L1-02"], k="L1-02 · ring A · the middle of the glass", name="The family room",
             purpose="The room Jim lives in every evening: a fire to sit by, his books, a game of chess in the light from the atrium, a film on the screen over the hearth. It is the heart of Jim's home below ground, with the music room on one side, the dining room on the other, and doors behind to the street and the master suite.",
             facts=[("Size", "16 m along the glass, 13.9 m deep and 3.8 m high: 224 m². Jim's study (L1-04) is the storey above."),
                    ("Made of", "Oak boards; an oak-slat ceiling on black felt; a chimney breast of travertine; walnut bookcases lit from within; bronze mullions and doors."),
                    ("In it", "A curved velvet sofa and two chairs round a travertine table, a silk pouf, a chess table by the glass, six bookcases, and the hearth: a long fire of lit mist, since there are no open flames in air with 27% oxygen. A screen hangs above it."),
                    ("Light", "Daylight from the atrium through the glass; three skylights with sky ceilings; downlights in the slats; a light under every shelf; lamps."),
                    ("Next to", "The music room and the dining room through cased openings; the terrace in front; the street behind.")],
             photos=[("../tour/photos/hero.jpg", "From the fireplace end, looking out through the glass to the atrium's olive trees and the portal column."),
                     ("../tour/photos/living.jpg", "The hearth of lit mist in its travertine chimney breast, the walnut shelves, a skylight.")],
             views=[("fire", "By the fire"), ("glass", "At the glass")], plan=("img/plan/l1-family.jpg", "Ring A of sector 1, the middle 16 m of the glass.")),
        dict(id="music", codes=["L1-01"], k="L1-01 · ring A · left of the family room", name="The music room",
             purpose="Where Jim plays: a concert grand by the glass, so that he plays looking out at the atrium, and a wall of records at the far end to listen to on a turntable and two tall speakers, from a pair of armchairs.",
             facts=[("Size", "6.4 m along the glass, widening to 16.5 m at the back wall, 13.9 m deep, 3.8 m high: 161 m²."),
                    ("Made of", "Oak boards and an oak-slat ceiling, as in the family room; walnut; wool rugs."),
                    ("In it", "A grand piano 2.1 m long on a rug by the glass; a velvet sofa and two green chairs to listen from; a walnut console 7.2 m long full of records, with a turntable and an amplifier on it and a tall speaker at each end; two cognac armchairs and a reading lamp; two bookcases; paintings."),
                    ("Light", "The glass and a skylight over the piano; downlights; a floor lamp by the piano and lamps by the chairs."),
                    ("Next to", "The family room, through a cased opening.")],
             photos=[("../tour/photos/music.jpg", "The music room from the back, the piano by the glass.")],
             views=[("piano", "By the piano")], plan=("img/plan/l1-music.jpg", "Ring A of sector 1, the left end of the glass.")),
        dict(id="dining", codes=["L1-03"], k="L1-03 · ring A · right of the family room", name="The dining room and the bar",
             purpose="Dinner for eight by the glass, and a drink after at the bar at the back of the room.",
             facts=[("Size", "6.4 m along the glass, widening to 16.5 m, 13.9 m deep, 3.8 m high: 161 m²."),
                    ("Made of", "Oak; a walnut table on travertine bases; marble; an antique mirror; brass."),
                    ("In it", "The table for eight with linen chairs and five glass globes on cords over it; a sideboard under a painting; the bar: bottles on four bronze shelves in front of an antique mirror, a walnut counter with a marble top and a brass foot rail, four leather stools, three glass pendants."),
                    ("Light", "The glass and a skylight; the globes over the table; the shelves of bottles lit from below them."),
                    ("Next to", "The family room, through a cased opening; the kitchen (L1-10) is behind, across the street.")],
             photos=[("../tour/photos/dining.jpg", "The dining room, the table for eight by the glass.")],
             views=[("table", "At the table")], plan=("img/plan/l1-dining.jpg", "Ring A of sector 1, the right end of the glass.")),
        dict(id="suite", codes=["L1-06", "L1-07", "L1-08", "L1-09"], k="L1-06 to L1-09 · ring B · across the street", name="The master suite down",
             purpose="Where Jim sleeps most nights. Below ground the radiation is lowest: sleeping here and spending about six hours a day in the Crown keeps his dose near 20 mSv a year. The suite wraps round a moss garden open to a sky ceiling, which brightens with the morning and dims to stars at night.",
             facts=[("Size", "434 m² in all: the bath (L1-06) 119 m², the moss garden (L1-07) 196 m² and 8 m high, the bedroom (L1-08) 81 m² and the dressing room behind it (L1-09) 38 m². The bath and the bedroom each have a glass wall onto the garden."),
                    ("Bedroom", "The bed faces the garden, with an upholstered headboard wall in vertical channels; walnut and pale oak; nightstands and lamps, a bench, two chairs by the glass, a dresser under a round mirror, sheer curtains."),
                    ("Bath", "A stone tub facing the garden; a double vanity on a wall of green marble, with round mirrors lit from behind; a walk-in shower with a rain head and a teak floor; travertine underfoot."),
                    ("Garden", "Moss in cushions round a pond with maple leaves floating on it; a Japanese maple; a stone lantern that glows at night; a water basin fed by a bamboo spout; ferns, clipped box, stepping stones; gravel along the glass."),
                    ("Next to", "The street in front, the family room across it; the laundry (L1-05) at one end and the kitchen (L1-10) at the other.")],
             photos=[("../tour/photos/suite_bedroom.jpg", "The bedroom, the headboard wall and the bed."), ("../tour/photos/suite_garden.jpg", "The moss garden from the bedroom."), ("../tour/photos/suite_bath.jpg", "The bath, the vanity on its green marble wall.")],
             views=[("bedroom", "The bedroom"), ("garden", "The moss garden"), ("bath", "The bath")], plan=("img/plan/l1-suite.jpg", "Ring B of sector 1, across the street from the family room.")),
        dict(id="back", codes=["L1-05", "L1-10", "L1-11", "L1-12", "L1-13", "L1-14", "L1-15", "L1-16"], k="L1-05, L1-10 to L1-16 · rings B to E", name="The kitchen, the robot bay and the stores",
             purpose="Round and behind the suite: the kitchen across the street from the dining room, where robots cook and Jim can too; the laundry; the pantry, the robot bay and the household stores; Jim's memory rooms, with his keepsakes from Earth and his memoirs; the wardrobes and the residence's plant room.",
             facts=[("Rooms", "Ring B: L1-05 Laundry and linen, L1-10 Kitchen · ring C: L1-11 Pantry and cold store, L1-12 Robot bay, L1-13 Household stores · ring D: L1-14 Memory rooms · ring E: L1-15 Wardrobe and stores, L1-16 Residence plant room")],
             photos=[("../tour/photos/kitchen.jpg", "The kitchen: the island for breakfast, the open shelves, and the robot that cooks on its rail.")], views=[("kitchen", "The kitchen")],
             plan=("img/plan/l1-back.jpg", "Rings B to E of sector 1, round and behind the master suite down.")),
    ])

ATRIUM = dict(
    id="rooms-atrium", no="03 · 2", title="L1 · round the atrium",
    lede="The atrium is the Pentagon's courtyard: a five-sided void 68 m deep under the Sun Well's lens, with terraces of olive trees and box hedges on every level, a bridge from each side to the portal column in the middle, and the sun court at the bottom. Ring A's rooms look into it through glass on all five sides. On L1 they are Jim's family room, the cinema, the thermal baths, the great library and the guest lounge.",
    plan=("img/plan/l1-atrium.jpg", "L1 round the atrium. Shaded, the four rooms of ring A on the other sides: the cinema, the thermal baths, the great library and the guest lounge."),
    plan_codes=["L1-17", "L1-22", "L1-27", "L1-32"],
    rooms=[
        dict(id="atrium", codes=["L1-AT"], k="L1-AT · the atrium", name="The terrace, the bridge and the portal column",
             purpose="The way between the five sectors and between the levels: a terrace in front of every room, a bridge from each terrace to the portal column, and in the column the portals to every other level and up to the Crown. There are no lifts.",
             facts=[("Size", "48 m across at the glass; terraces 3.6 m deep; the void 41 m across; the column 10 m across; the sun court 44 m below L1."),
                    ("Made of", "Travertine paving; glass balustrades with bronze caps; a fluted column of coursed travertine; troughs of trailing vines; olive trees and box hedges."),
                    ("Light", "The Sun Well's lens over the void, 33.6 m across, round the top of the column.")],
             photos=[], views=[("terrace", "On the terrace"), ("bridge", "On the bridge")], plan=("img/plan/l1-terrace.jpg", "The atrium on L1: the terraces round it, the five bridges and the portal column in the middle.")),
        dict(id="court", codes=["L5-SC"], k="L5-SC · the bottom of the atrium", name="The sun court",
             purpose="The bottom of the atrium, 68 m down: a lawn with olive trees round a pool at the foot of the column, in the light of the lens 52 m above. Behind the glass all round are the halls of L5: the maglev, the freight portals, the seed vault and the rovers.",
             facts=[("Size", "The void 41 m across; a paved walk round the lawn; causeways over the pool to the column's portals.")],
             photos=[], views=[("court", "The sun court")], plan=("img/plan/l5-court.jpg", "The sun court, at the bottom of the atrium on L5, 68 m down.")),
        dict(id="library", codes=["L1-27"], k="L1-27 · ring A · sector 4", name="The great library",
             purpose="Jim's library, and the reading room of the Archive of Earth, which keeps copies of the world's books, films and music. It is one room the full 7.6 m height of L1, with books on three walls on two storeys.",
             facts=[("Size", "28.8 m of glass, 49 m along the back wall, 13.9 m deep, 7.6 m high: 546 m²."),
                    ("Made of", "Oak boards, plaster, walnut shelves and walnut ribs across the ceiling, brass rails and ladders."),
                    ("In it", "Tens of thousands of books; a gallery all round under the upper shelves, reached by a spiral stair; rolling ladders; three long reading tables with brass lamps; leather chairs by the glass; a globe of the Earth."),
                    ("Light", "The glass onto the atrium; eight skylights between the ribs; lights washing the shelves; reading lamps."),
                    ("Next to", "The guest lounge and the baths on the next sides; behind it the Archive of Earth and the reading rooms.")],
             photos=[("../tour/photos/library.jpg", "The great library: two storeys of books, the gallery and the reading tables.")],
             views=[("library", "In the library")], plan=("img/plan/l1-library.jpg", "Ring A of sector 4, north-west of the atrium."),
             above=("img/above/l1-library.jpg", "the glass onto the atrium along the bottom, four seating groups and a globe of the Earth by it, three long reading tables, the spiral stair up to the gallery, shelves on the three other walls.")),
        dict(id="baths", codes=["L1-22"], k="L1-22 · ring A · sector 3", name="The thermal baths",
             purpose="Warm water at three temperatures, for long soaks and for a body living in low gravity: the warm pool at 36 °C, the hot pool at 40 °C and the cold plunge at 14 °C. Behind it are the 50 m pool, the sauna and steam rooms, the gym and the treatment rooms.",
             facts=[("Size", "The same hall as the library: 546 m², 7.6 m high."),
                    ("Made of", "Grey-green quartzite laid in thin courses, as in the baths at Vals, and in slabs on the floor; a ceiling of stone slabs with slots of daylight between them."),
                    ("In it", "A warm pool 15 m by 5.6 m with steps along one end; a round hot pool 4.6 m across; a cold plunge 3 m square and 1.6 m deep; lights under the water; eight loungers and stone tables along the glass; a stone bench with towels."),
                    ("Light", "Blades of sunlight from the slots in the ceiling; the glass onto the atrium; the pools lit from within.")],
             photos=[("../tour/photos/baths.jpg", "The thermal baths: quartzite, slots of daylight and the warm pool.")],
             views=[("baths", "In the baths")], plan=("img/plan/l1-baths.jpg", "Ring A of sector 3, west of the atrium."),
             above=("img/above/l1-baths.jpg", "the round hot pool on the left, the warm pool in the middle with its steps at one end, the cold plunge on the right, the loungers along the glass onto the atrium at the bottom.")),
        dict(id="cinema", codes=["L1-17"], k="L1-17 · ring A · sector 2", name="The cinema",
             purpose="Films with guests, or alone: forty seats in front of a screen 12 m wide, in the club next to Jim's residence.",
             facts=[("Size", "The club's front hall, 546 m² and 7.6 m high; the auditorium in its middle is 16 m wide and 13.9 m deep."),
                    ("Made of", "Walnut slats on the side walls; black velvet round the screen; a carpet of charcoal wool; seats in claret velvet."),
                    ("In it", "Four rows of ten seats, each row a step higher; a screen 12 m by 5 m; curtains drawn across the glass onto the atrium; a ceiling of 700 points of light, like stars."),
                    ("Light", "The screen itself, sconces, a cove along the walls, lights in the steps.")],
             photos=[("../tour/photos/cinema.jpg", "The cinema: forty seats, a ceiling of stars and the Earth on the screen.")],
             views=[("cinema", "In the cinema")], plan=("img/plan/l1-cinema.jpg", "Ring A of sector 2, south of the atrium."),
             above=("img/above/l1-cinema.jpg", "the screen at the top, the four rows of ten seats on their steps, and the curtained glass onto the atrium along the bottom.")),
        dict(id="guests", codes=["L1-32"], k="L1-32 · ring A · sector 5", name="The guest lounge",
             purpose="Where visitors from Earth gather. They come only once every 26 months and stay until the next launch window, so they have real apartments: eight guest suites above the lounge and behind it, and two family apartments.",
             facts=[("Rooms", "L1-32 Guest lounge, two storeys of 4 m, 546 m² · L1-33 to L1-40 Guest suites 1 to 8 · L1-41, L1-42 Family apartments · L1-43 Staff and robots")],
             photos=[("../tour/photos/guests.jpg", "The guest lounge: sofas by the glass, the table for twelve, the gallery of the guest suites."), ("../tour/photos/guests2.jpg", "From the gallery: the lounge and the atrium through the glass.")],
             views=[("guests", "The guest lounge")], plan=("img/plan/l1-guests.jpg", "Ring A of sector 5, north-east of the atrium.")),
    ])

CROWN = dict(
    id="rooms-crown", no="02 · 1", title="The Crown, room by room",
    lede="The Crown's main floor is a ring 10 m wide and 276 m across, 41 m above the Stone Garden. The rooms run along the outer wall; the Glide, a moving walkway, runs along the garden side and links every part in a 779 m loop. Window slots 1.2 m tall run through both walls, framing the plain on one side and the mirror Orb on the other. Five spires rise over the Arrival hall, the Salon, the Dining hall, the Library and the Observatory, and each holds a portal.",
    plan=("../plans/svg/crown.svg", "The Crown's main floor: the ten parts of the ring, and in each room its code (10 is C-10). The Orb floats in the middle."),
    rooms=[
        dict(id="arrival", codes=["C-01", "C-02", "C-03", "C-04"], k="C-01 to C-05 · part 1 · east · a spire", name="Arrival",
             purpose="Coming home. The pod flies into the hangar from the garden side; the hangar fills with air in about 90 seconds while the dust is blown off; then the Door, a ring of light 5 m across, opens for Jim and his guests alone. The Arrival hall beyond is 9 m tall, with the first window slot looking back over the garden to the Orb.",
             facts=[("Rooms", "C-01 Suit room · C-02 Pod hangar · C-03 The Door · C-04 Arrival hall; C-05 Dock control upstairs"),
                    ("Made of", "Polished basalt underfoot, regolith plaster, an olive-wood bench, bronze reveals round the slots."),
                    ("In it", "The bench, an olive tree, and at the far end the portal to the Orb, the other spires and the Pentagon.")],
             photos=[("../tour/photos/crown_arrival.jpg", "The Arrival hall: polished basalt, the olive tree, the sun through the slots and the portal at the far end.")], views=[("crown_arrival", "The Arrival hall")], plan=("img/plan/crown-arrival.jpg", "Part 1 of the ring, east."),
             above=("img/above/crown-arrival.jpg", "the pod hangar at the left end, then the Door, and the Arrival hall: the bench, the olive tree and the portal at the right end; the Glide along the garden side.")),
        dict(id="suite_up", codes=["C-06", "C-07", "C-08"], k="C-06 to C-08 · part 2 · south-east", name="The master suite up",
             purpose="Jim's morning rooms: the bed faces the south-east slot, so the sun rises straight across the room. He sleeps below ground most nights; this suite is for mornings, naps and the view.",
             facts=[("Rooms", "C-06 Dressing room · C-07 Bedroom up · C-08 Bath up, with a soaking tub by the slots"), ("Size", "537 m² inside the walls, in the Crown's south-east dip."),
                    ("Made of", "Pale oak walls and screens, a floor of linen-coloured stone, an oak-slat ceiling."),
                    ("In it", "The bed and its nightstands, a sitting corner by the slots, a writing desk, dressers, plants.")],
             photos=[("../tour/photos/crown_bedroom.jpg", "The bedroom up, facing the south-east slots.")], views=[("crown_bedroom", "The bedroom up")], plan=("img/plan/crown-suite_up.jpg", "Part 2, south-east, straight above the master suite down.")),
        dict(id="salon", codes=["C-09", "C-10", "C-11"], k="C-09 to C-12 · part 3 · south · a spire", name="The Salon",
             purpose="Where Jim has guests and music: the great salon, 45 m along the curve of the ring, the hearth room at one end and the recital room with the concert grand at the other, and the Sky lounge upstairs in the spire.",
             facts=[("Rooms", "C-09 Hearth room · C-10 Great salon · C-11 Recital room; C-12 Sky lounge upstairs"),
                    ("Made of", "A floor of linen-coloured stone, regolith plaster, an oak-slat ceiling lit from its coves, olive wood."),
                    ("In it", "Three groups of linen sofas on wool rugs round olive-wood tables; olive trees in basalt planters; a hearth of lit mist; a concert grand.")],
             photos=[("../tour/photos/crown_salon.jpg", "The great salon: linen sofas, olive trees and the slots through the outer wall; the Glide on the right.")], views=[("crown_salon", "The great salon")], plan=("img/plan/crown-salon.jpg", "Part 3, south."),
             above=("img/above/crown-salon.jpg", "the hearth room at the left end, three groups of sofas on rugs with olive trees between them, the recital room at the right end, and the Glide along the garden side.")),
        dict(id="wellness", codes=["C-13", "C-14", "C-15"], k="C-13 to C-15 · part 4 · south-west", name="Wellness",
             purpose="Exercise and rest: a 25 m pool along the ring, where low gravity makes every wave rise high and fall slowly; a spa with a hot pool and a cedar sauna; a gym.",
             facts=[("Rooms", "C-13 Spa · C-14 Sky pool, 25 m · C-15 Gym"),
                    ("Made of", "A deck of polished basalt, pale stone in the pool, cedar, an oak-slat ceiling."),
                    ("In it", "A pool 25 m by 4 m and 1.5 m deep, lit from below; loungers along the Glide side; a round hot pool; a sauna with a glass front; a mirror wall and mats in the gym.")],
             photos=[("../tour/photos/crown_wellness.jpg", "The pool, 25 m along the ring.")], views=[("crown_wellness", "By the pool")], plan=("img/plan/crown-wellness.jpg", "Part 4, south-west."),
             above=("img/above/crown-wellness.jpg", "the cedar sauna and the round hot pool at the spa end on the left, the 25 m pool in the middle with its loungers along the Glide, the gym at the right end.")),
        dict(id="dining_up", codes=["C-16", "C-17", "C-18"], k="C-16 to C-19 · part 5 · west-south-west · a spire", name="Dining",
             purpose="Dinners for many: a dining hall for 22 at one table of polished basalt, the chef's kitchen, a wine room of Mars glass, and the Sky bar upstairs in the spire.",
             facts=[("Rooms", "C-16 Wine room · C-17 Dining hall · C-18 Chef's kitchen; C-19 Sky bar upstairs"),
                    ("Made of", "Polished basalt, regolith plaster, linen, glass."),
                    ("In it", "The basalt table for 22 under glass globes, linen chairs, the afternoon sun low through the slots.")],
             photos=[("../tour/photos/crown_dining.jpg", "The dining hall: the basalt table for 22, the glass globes and the slots.")], views=[("crown_dining", "The dining hall")], plan=("img/plan/crown-dining_up.jpg", "Part 5, west-south-west."),
             above=("img/above/crown-dining.jpg", "the long basalt table for 22 under its glass globes in the middle, sideboards under the slots at either end, and the Glide along the garden side.")),
        dict(id="sunset", codes=["C-20", "C-21", "C-22"], k="C-20 to C-22 · part 6 · west", name="The sunset lounge",
             purpose="The west side of the ring: low sofas face the west slots, and at sunset the sun shines straight down the room for a few minutes while the sky round it turns blue, as the sky of Mars does. At one end the guests' day room, where visitors spend their days; at the other a gallery of Jim's paintings and his photographs of Mars.",
             facts=[("Rooms", "C-20 Guests' day room · C-21 Sunset lounge · C-22 Gallery"), ("In it", "Low sofas and chairs facing the slots, rugs, olive trees.")],
             photos=[("../tour/photos/crown_sunset.jpg", "The sunset lounge, the sun low in the west slots.")], views=[("crown_sunset", "The sunset lounge")], plan=("img/plan/crown-sunset.jpg", "Part 6, west.")),
        dict(id="library_up", codes=["C-23", "C-24", "C-25"], k="C-23 to C-26 · part 7 · north-west · a spire", name="The Library",
             purpose="The second library, under its own spire: two floors of walnut shelves along the outer wall with the window slots between them, a study, and a map room round a globe of Mars 3 m across.",
             facts=[("Rooms", "C-23 Study · C-24 Library, two floors · C-25 Map room; C-26 Reading gallery upstairs"), ("Size", "45 m along the ring and 9.5 m high under the spire."),
                    ("Made of", "Oak boards, walnut shelves and gallery, brass rails and pendants, a basalt plinth for the globe."),
                    ("In it", "A gallery reached by a spiral stair; low cases along the Glide; reading tables under brass pendants; leather chairs by the slots; the Mars globe in a bronze meridian; chests of map drawers.")],
             photos=[("../tour/photos/crown_library.jpg", "The Library: two floors of books along the curve of the ring."), ("../tour/photos/crown_maproom.jpg", "The map room and its globe of Mars, 3 m across.")],
             views=[("crown_library", "The Library"), ("crown_maproom", "The map room")], plan=("img/plan/crown-library_up.jpg", "Part 7, north-west."),
             above=("img/above/crown-library.jpg", "the study at the left end, the reading tables and the spiral stair on its long rug in the library hall, low cases along the Glide, and the map room with its globe of Mars at the right end.")),
        dict(id="studio", codes=["C-27", "C-28", "C-29"], k="C-27 to C-29 · part 8 · north-north-west", name="The Studio",
             purpose="Jim's art studio in the steady north light through the slots, a photo and print room for his pictures of Mars, and a craft room for pottery and models; heavy work goes down to the workshops on L3.",
             facts=[("Rooms", "C-27 Art studio · C-28 Photo and print room · C-29 Craft room"), ("Made of", "Oak boards, regolith plaster, walnut cases and counters, beech easels."),
                    ("In it", "Three easels in the north light, a standing work table of brushes and paints, a wide printer and a light table, Jim's prints of Mars on the walls, a potter's wheel, a kiln and shelves of pots, a bench for models.")],
             photos=[("../tour/photos/crown_studio.jpg", "The art studio: easels in the north light from the slots, the work table, canvases waiting."), ("../tour/photos/crown_craft.jpg", "The craft room: the potter's wheel, shelves of pots and the bench for models.")],
             views=[("crown_studio", "The Studio")], plan=("img/plan/crown-studio.jpg", "Part 8, north-north-west."),
             above=("img/above/crown-studio.jpg", "the art studio at the left end, its easels by the outer wall and the work table; the print room in the middle with its counter of screens, the printer and the light table; the craft room at the right end with the shelves of pots, the wheel, the kiln and the benches. The Glide runs along the inner wall.")),
        dict(id="observatory", codes=["C-30", "C-31"], k="C-30 to C-32 · part 9 · north · a spire", name="The Observatory",
             purpose="A star lounge with reclining chairs under the northern sky, the telescope room with its controls and screens, and the telescope dome upstairs in the spire, which opens at night. From here Earth shows as the evening or the morning star, with the Moon beside it in the telescope.",
             facts=[("Rooms", "C-30 Star lounge · C-31 Telescope room; C-32 Telescope dome upstairs"), ("Made of", "Polished basalt, an oak-slat ceiling on black felt, tan leather, walnut."),
                    ("In it", "Ten reclining chairs in pairs under the outer slots, side tables with candles of light, a long desk of screens showing what the telescope sees, the portal up to the dome.")],
             photos=[("../tour/photos/crown_stars.jpg", "The star lounge at night: reclining chairs under the slots full of stars."), ("../tour/photos/crown_telescope.jpg", "The telescope room: screens of what the telescope sees, the portal up to the dome.")],
             views=[("crown_stars", "The star lounge")], plan=("img/plan/crown-observatory.jpg", "Part 9, north."),
             above=("img/above/crown-observatory.jpg", "the star lounge from the left: five pairs of reclining chairs on dark rugs under the outer slots, each pair with its side table, poufs and lamps along the Glide; the telescope room at the right end with its long desk of screens and the portal up to the dome.")),
        dict(id="garden_room", codes=["C-33", "C-34"], k="C-33 to C-34 · part 10 · north-east", name="The Garden room",
             purpose="A breakfast room in the morning light through the east slots, and a sky garden of fruit trees, flowers and herbs: a conservatory in the ring, with fresh herbs for the chef's kitchen.",
             facts=[("Rooms", "C-33 Breakfast room · C-34 Sky garden"), ("Made of", "Oak and linen-coloured stone, basalt beds, raked gravel."),
                    ("In it", "A round oak table for six under a glass globe, a sitting corner by the slots; beds of basil, sage, rosemary and thyme, lavender, marigolds and poppies under small lemon and olive trees; grow lights on long cables.")],
             photos=[("../tour/photos/crown_breakfast.jpg", "The breakfast room at sunrise, the sun through the east slots."), ("../tour/photos/crown_garden.jpg", "The sky garden: herbs and flowers under lemon and olive trees.")],
             views=[("crown_garden", "The sky garden")], plan=("img/plan/crown-garden_room.jpg", "Part 10, north-east."),
             above=("img/above/crown-garden.jpg", "the breakfast room at the left end: the round table for six under its globe, the sideboard along the Glide, the sitting corner and an olive tree by the slots; then the sky garden, its raised beds of herbs and flowers along both walls under lemon and olive trees, two benches, and the grow lights in rows overhead.")),
    ])

CLUB = dict(
    id="rooms-club", no="03 · 3", title="L1 · the club",
    lede="Sector 2 of L1, behind the cinema: the rooms for evenings with guests. Across the first street, the games room; across the next, the ballroom, where visitors are welcomed every 26 months; then Arcadia's one wine cellar, cool and steady below ground; and the club's stores at the back.",
    plan=("img/plan/l1-club.jpg", "Where it is: sector 2 of L1, behind the cinema. Shaded, rings B to E: the games room, the ballroom, the wine cellar and the club's stores."),
    plan_codes=["L1-18", "L1-19", "L1-20", "L1-21"],
    rooms=[
        dict(id="cellar", codes=["L1-20"], k="L1-20 · ring D · sector 2", name="The wine cellar",
             purpose="Arcadia's one cellar, the whole of ring D behind the ballroom: a tasting room under a brick vault in the middle, and from it two aisles running 44 m along the ring each way, the bottles in racks between brick ribs and oak casks in some bays. It sends wine up to the Crown's wine room (C-16) for the dinners.",
             facts=[("Size", "1,640 m²: ring D is 14 m deep and 107 to 128 m long. The tasting room 12 m square and 6.2 m high under its vault; the aisles 4.2 m wide and 4.6 m high."),
                    ("Made of", "Brick fired from Mars soil in the kilns that make the Pentagon's panels; a floor of terracotta tiles from the same kilns; racks and casks of oak; black iron."),
                    ("In it", "Racks for about 30,000 bottles; oak casks on cradles; an oak table for ten with a decanter, glasses and candles under an iron chandelier; a sommelier's counter by the door."),
                    ("Keeps", "13 °C and 70% humidity, all year: below ground nothing changes from day to night or summer to winter."),
                    ("Light", "Warm and low: a sconce on every pier, lamps on top of the racks washing the vaults, the chandelier and the candles at the table."),
                    ("Next to", "The street in front, the ballroom (L1-19) across it; the club's stores (L1-21) behind.")],
             photos=[("../tour/photos/cellar.jpg", "The tasting room: the oak table under the iron chandelier, an aisle of racks beyond the arch."), ("../tour/photos/cellar2.jpg", "Down an aisle: racks and casks between the brick ribs, the tasting room's light at the end.")],
             views=[("cellar", "The tasting room")], plan=("img/plan/l1-cellar.jpg", "Ring D of sector 2."),
             above=("img/above/l1-cellar.jpg", "the tasting room in the middle with its table for ten and the racks along its far wall, the two aisles running out to either side with racks along both walls and casks in some of the bays.")),
    ])

SPORT = dict(
    id="rooms-sport", no="03 · 4", title="L1 · baths and sport",
    lede="Sector 3 of L1, behind the thermal baths: the rooms that keep Jim strong in a third of Earth's gravity. Across the first street, a pool 50 m long; then the sports hall with its climbing wall and running track; the saunas and steam rooms; and the treatment rooms at the back.",
    plan=("img/plan/l1-sport.jpg", "Where it is: sector 3 of L1, behind the thermal baths. Shaded, rings B to E: the lap pool, the sports hall, the saunas and the treatment rooms."),
    plan_codes=["L1-23", "L1-24", "L1-25", "L1-26"],
    rooms=[
        dict(id="pool", codes=["L1-23"], k="L1-23 · ring B · sector 3", name="The lap pool",
             purpose="Training every day: lengths and water exercise, safe below ground; water sports in low gravity, and swimming lessons for visiting children. In Mars' gravity a swimmer floats just as on Earth, but a splash rises nearly three times as high and falls slowly, and the waves roll more slowly.",
             facts=[("Size", "All of ring B: 55 m along the inner wall and 75 m along the outer, 13.8 m deep, 7.6 m high. The pool 50 m by 8.4 m, four lanes, 2 m deep."),
                    ("Made of", "A deck of pale travertine; a basin of small glass tiles with dark blue lines on its floor; walls of travertine; a ceiling of oak slats."),
                    ("In it", "Lane ropes, four starting blocks, backstroke flags 5 m from each end, a pace clock, loungers and towels along the outer wall, kickboards on a rack."),
                    ("Light", "Three slots of sky along the ceiling; lights under the water; a band of glass onto the street, lit from above."),
                    ("Next to", "The street behind the thermal baths (L1-22), across the glass; the sports hall (L1-24) across the next street.")],
             photos=[("../tour/photos/pool.jpg", "From behind the starting blocks: 50 m of water under the slots of sky."), ("../tour/photos/pool2.jpg", "Along the deck: the loungers, the lanes and the glass onto the street.")],
             views=[("pool", "On the deck")], plan=("img/plan/l1-pool.jpg", "Ring B of sector 3."),
             above=("img/above/l1-pool.jpg", "the pool in the middle with its four lanes and the lines on its floor, the starting blocks at the left end, the loungers along the outer wall at the top, the band of glass onto the street along the bottom.")),
    ])

GARDEN = dict(
    id="rooms-garden", no="03 · 5", title="L2 · the garden level",
    lede="L2 is 16 m tall, 41 m down, under a sky of lamps that brightens with the morning and dims to moonlight at night: orchards and a vineyard, a farm, a lake that is also Arcadia's water reserve, a forest with a stream and falls, and a meadow with bees and a tea house. Wind fans move the leaves; mist brings rain at night. From the atrium's terrace on L2 you walk straight out into it.",
    plan=("../plans/svg/l2.svg", "L2, the garden level: the orchards in sector 1, the farm in sector 2, the lake in sector 3, the forest in sector 4, the meadow in sector 5."),
    rooms=[
        dict(id="lake", codes=["L2-11"], k="L2-11 · rings A to C · sector 3", name="The lake",
             purpose="A lake that is also Arcadia's water reserve: the water you can see. Swimming and boating in the summer light of the sky of lamps; a beach behind the glass onto the atrium; the stream from the forest falling into it over the rocks.",
             facts=[("Size", "Rings A to C of sector 3 with their streets: 3,259 m², 50 m out from the glass, 29 m wide at the glass and 101 m at the far bank; 16 m up to the sky of lamps."),
                    ("Water", "About 8,000 t, 2.5 m deep on average and 3.6 m at the deepest; its pumps and filters are in L2-13."),
                    ("Made of", "A beach of pale sand, a bed of sand and gravel, banks of grass; a jetty and a swimming raft of teak; columns of coursed stone; the sky of lamps in panels 2.25 m square."),
                    ("In it", "The jetty with a rowing boat, loungers on the beach, lilies in the shallows and reeds round the shore, a weeping willow, and two rows of columns standing in the water under L1's streets, carrying the floor above."),
                    ("Light", "The sky of lamps, which uses 2 MW over the whole level: bright as a summer day under high cloud, dimmed to moonlight at night."),
                    ("Next to", "The atrium's terrace on L2, through the glass; the forest walk (L2-14) beyond the avenue on the right; the farm (L2-06 to L2-08) on the left; the fish farm (L2-12) across the street behind.")],
             photos=[("../tour/photos/lake.jpg", "From the beach: the jetty and the rowing boat, the columns standing in the water, the sky of lamps 16 m up."), ("../tour/photos/lake2.jpg", "From the end of the jetty, back to the beach and the glass onto the atrium.")],
             views=[("lake", "On the jetty")], plan=("img/plan/l2-lake.jpg", "Rings A to C of sector 3 on L2."),
             above=("img/above/l2-lake.jpg", "the glass onto the atrium along the bottom with the beach behind it, the jetty running out into the lake with the boat beside it, the raft on the left, the two rows of columns, the trees of the forest on the right and of the far bank at the top.")),
    ])

def has_pictures(a): return any(photo_ok(p[0]) for r in a["rooms"] for p in r["photos"])


MEMORY = dict(id="memory", codes=["L1-14"], k="L1-14 · ring D · Jim's residence", name="The memory rooms",
              purpose="Jim's keepsakes from Earth: family photographs, letters and the things he brought from home, in a suite of quiet rooms along ring D. Here he records his memoirs, and visiting family find the family's history.",
              facts=[("Size", "All of ring D of Jim's residence, a suite of rooms; the gallery of photographs in the middle is 12 m by 9 m and 3.6 m high."),
                     ("Made of", "Walls of deep green over a walnut dado, oak boards, brass picture lights, glass cases on walnut stands."),
                     ("In it", "Photographs of the places of Jim's life hung close in three rows; two cases of keepsakes (letters tied with a ribbon, a pocket watch, spectacles, a compass, a key, a medal); a reading table with the albums; two armchairs; the desk where he records his memoirs, with a microphone and a screen."),
                     ("Light", "A sky ceiling over the middle of the room; a brass light over the photographs; spots on the cases; lamps."),
                     ("Next to", "The letters room and the family's history on either side, through open doorways; the street in front.")],
              photos=[("../tour/photos/memory.jpg", "The gallery of photographs: the places of Jim's life hung close on the deep green wall, the cases of keepsakes."), ("../tour/photos/memory2.jpg", "From the memoir desk: the cases, the reading table and the doorway to the next room.")],
              views=[("memory", "In the memory rooms")], plan=("img/plan/l1-memory.jpg", "Ring D of Jim's residence, behind the suite and the kitchen."),
              above=("img/above/l1-memory.jpg", "the photographs along the wall at the top, the two cases on the rug in the middle, the reading table at the bottom left and the armchairs at the bottom right, the memoir desk at the top right; the next rooms through the doorways at either end."))
if photo_ok(MEMORY["photos"][0][0]):           # the memory rooms get their own entry once their first picture is published
    for r in RESIDENCE["rooms"]:
        if r["id"] == "back":
            r["codes"] = [c for c in r["codes"] if c != "L1-14"]
            r["purpose"] = r["purpose"].replace(" Jim's memory rooms, with his keepsakes from Earth and his memoirs;", "")
            r["facts"] = [(k, v.replace(" · ring D: L1-14 Memory rooms", "")) for (k, v) in r["facts"]]
    RESIDENCE["rooms"].append(MEMORY)
    RESIDENCE["plan_codes"] = RESIDENCE["plan_codes"] + ["L1-14"]


# the newer areas get their page once their first picture is published (no page of plans alone)
AREAS = [CROWN, RESIDENCE, ATRIUM] + [a for a in (CLUB, SPORT, GARDEN) if has_pictures(a)]

CSS = """
  .area-plan { margin: 22px 0 0; max-width: 860px; }
  .rm { padding: 34px 0 6px; border-top: 1px solid var(--rule); margin-top: 32px; }
  .rm > small { display: block; font: 600 12.5px/1.2 var(--f-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--route); margin-bottom: 8px; }
  .rm > h2 { margin: 0 0 8px; font: 700 34px/1.05 var(--f-display); }
  .rm .purpose { margin: 0 0 18px; max-width: 72ch; color: var(--ink-2); font-size: 18.5px; }
  .rm .grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .rm .grid > div { display: grid; gap: 14px; min-width: 0; }
  .rm figure { margin: 0; background: var(--sheet); border: 1px solid var(--rule); }
  .rm figure img { width: 100%; height: auto; display: block; }
  .rm figcaption { padding: 8px 12px 10px; font-size: 14px; line-height: 1.45; color: var(--ink-2); border-top: 1px solid var(--rule); }
  .rm table.spec { margin: 0; }
  .rm table.spec th { width: 92px; }
  .pano { position: relative; aspect-ratio: 16 / 9; background: #0e1012; overflow: hidden; }
  .pano img { width: 100%; height: 100%; object-fit: cover; }
  .pano iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .pano .play { position: absolute; left: 12px; bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
  .pano .play button, .pano .play a { font: 600 14.5px var(--f-body); padding: 9px 14px; border: 0; background: rgba(16, 18, 20, .82); color: #f4efe8; cursor: pointer; text-decoration: none; }
  .pano .play button { background: #f4efe8; color: #16191b; }
  .pano .tag { position: absolute; left: 12px; top: 12px; font: 600 11.5px var(--f-mono); letter-spacing: .1em; text-transform: uppercase; padding: 4px 8px; background: rgba(16, 18, 20, .78); color: #f4efe8; }
  .toc { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; margin: 18px 0 0; }
  .toc a { display: block; background: var(--sheet); border: 1px solid var(--rule); text-decoration: none; }
  .toc a img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .toc a .nm { display: block; padding: 8px 10px; font: 600 17px/1.15 var(--f-display); }
  .toc a .nm small { display: block; font: 500 11px var(--f-mono); color: var(--ink-3); letter-spacing: .04em; margin-bottom: 2px; }
  .toc a img.map { object-fit: contain; background: #F7F5F0; }
  @media (max-width: 880px) { .rm .grid { grid-template-columns: minmax(0, 1fr); } }
  img.zoom { cursor: zoom-in; }
  .lightbox { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 48px 16px 16px; background: rgba(12, 13, 14, .92); cursor: zoom-out; }
  .lightbox img { max-width: calc(100vw - 32px); max-height: calc(100vh - 64px); object-fit: contain; background: #f6f6f4; }
  .lightbox span { position: absolute; right: 16px; top: 10px; padding: 5px 10px; background: rgba(16, 18, 20, .9); color: #f4efe8; font: 600 14px var(--f-body); }
"""

JS = """
document.querySelectorAll('.pano button[data-stop]').forEach(function (b) {
  b.addEventListener('click', function () {
    var box = b.closest('.pano'), f = document.createElement('iframe');
    f.src = '../tour/index.html?embed#' + b.getAttribute('data-stop'); f.title = '360° view: ' + b.getAttribute('data-name'); f.allow = 'fullscreen';
    box.querySelectorAll('img, .tag').forEach(function (e) { e.remove(); }); b.remove(); box.appendChild(f);
  });
});
// a floor plan opens full size over the page; a click or Esc closes it
function closeBox() { var l = document.querySelector('.lightbox'); if (l) l.remove(); }
document.querySelectorAll('img.zoom').forEach(function (im) {
  im.addEventListener('click', function () {
    var l = document.createElement('div'); l.className = 'lightbox';
    l.innerHTML = '<img alt=""><span>Close ✕</span>'; l.querySelector('img').src = im.src; l.querySelector('img').alt = im.alt;
    l.addEventListener('click', closeBox); document.body.appendChild(l);
  });
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });
"""


def room_html(r):
    photos = [p for p in r["photos"] if photo_ok(p[0])]
    views = [v for v in r["views"] if stop_ready(v[0])]
    left = []
    for (sid, label) in views:
        left.append('<figure><div class="pano"><img src="%s" alt="%s" loading="lazy" width="960" height="540"><span class="tag">360°</span><div class="play"><button type="button" data-stop="%s" data-name="%s">Look round in 360°</button><a href="../tour/#%s">Full screen ↗</a></div></div><figcaption><b>%s</b>: drag to look round, click a ring on the floor to walk on.</figcaption></figure>'
                    % (poster(sid), E(label), sid, E(label), sid, E(label)))
    for (src, cap) in photos:
        left.append('<figure><img src="%s" alt="%s" loading="lazy" width="1600" height="900"><figcaption>%s</figcaption></figure>' % (src, E(cap), E(cap)))
    if r.get("above") and photo_ok(r["above"][0]):         # the room from straight above, its ceiling taken off
        left.append('<figure><img class="zoom" src="%s" alt="%s from above" loading="lazy"><figcaption><b>From above</b>, the ceiling taken off: %s Click to enlarge.</figcaption></figure>' % (r["above"][0], E(r["name"]), E(r["above"][1])))
    right = ['<table class="spec"><tbody>%s</tbody></table>' % "".join('<tr><th>%s</th><td>%s</td></tr>' % (E(k), E(v)) for k, v in r["facts"])]
    if r.get("plan"):
        plan = '<figure><img class="zoom" src="%s" alt="Where %s is on the floor plan" loading="lazy"><figcaption><b>Where it is.</b> %s Click to enlarge.</figcaption></figure>' % (r["plan"][0], E(r["name"]), E(r["plan"][1]))
        (right if left else left).append(plan)        # no pictures yet: the plan takes their place (no notes for visitors, GN-18)
    if not left: left, right = right, []
    return ('<section class="rm" id="%s"><small>%s</small><h2>%s</h2><p class="purpose">%s</p><div class="grid"><div>%s</div><div>%s</div></div></section>'
            % (r["id"], E(r["k"]), E(r["name"]), E(r["purpose"]), "".join(left), "".join(right)))


def toc_html(area):
    out = []
    for r in area["rooms"]:
        photos = [p for p in r["photos"] if photo_ok(p[0])]; views = [v for v in r["views"] if stop_ready(v[0])]
        img = photos[0][0] if photos else (poster(views[0][0]) if views else (r["plan"][0] if r.get("plan") else area["plan"][0]))
        out.append('<a href="#%s"><img src="%s" alt="" loading="lazy"%s><span class="nm"><small>%s</small>%s</span></a>' % (r["id"], img, ' class="map"' if not (photos or views) else "", E(r["k"].split(" · ")[0]), E(r["name"])))
    return '<div class="toc">%s</div>' % "".join(out)


def page(area):
    plan_src, plan_cap = area["plan"]
    body = ('<main class="wrap"><div class="open"><div class="no">Design plan · %s</div><h1>%s</h1><p class="lede">%s</p></div>%s'
            '<figure class="fig area-plan"><img class="zoom" src="%s" alt="Floor plan: %s" loading="lazy"><figcaption><b>The floor plan.</b> %s Click to enlarge.</figcaption></figure>%s</main>'
            % (E(area["no"]), E(area["title"]), E(area["lede"]), toc_html(area), plan_src, E(area["title"]), E(plan_cap), "".join(room_html(r) for r in area["rooms"])))
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>%s · Design plan</title>\n'
            '<meta name="description" content="%s">\n<link rel="icon" href="../../favicon.svg" type="image/svg+xml">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Saira+Condensed:wght@500;600;700&display=swap">\n'
            '<link rel="stylesheet" href="book.css">\n<style>%s</style>\n</head>\n<body data-ch="%s">\n%s\n<script src="book.js"></script>\n<script>%s</script>\n</body>\n</html>\n'
            % (E(area["title"]), E(area["lede"][:200]), CSS, area["id"], body, JS))


def sheet_of(code):
    """the floor plan (palace/plans/svg/) a room code is drawn on: C-10 -> crown, L1-02 -> l1"""
    return "crown" if code.startswith("C-") else code.split("-")[0].lower()


def explorer_json():
    """for the explorer on the design plan's home page: every room's purpose, facts, pictures and 360s, and the
    shapes to click on the floor plans Rev G (palace/plans/shapes.json, written by draw_plans.py: each room's
    polygons by code, in the sheet's own units)"""
    import json
    SH = json.load(open(os.path.join(PAL, "plans", "shapes.json"), encoding="utf-8"))
    rooms = {}
    for a in AREAS:
        for r in a["rooms"]:
            key = ("crown:" if a is CROWN else "l2:" if a is GARDEN else "l1:") + r["id"]
            rooms[key] = dict(name=r["name"], k=r["k"], purpose=r["purpose"], facts=r["facts"], page="%s.html#%s" % (a["id"], r["id"]),
                              photos=[dict(src=ph[0], cap=ph[1]) for ph in r["photos"] if photo_ok(ph[0])] + ([dict(src=r["above"][0], cap="From above, the ceiling taken off: " + r["above"][1])] if r.get("above") and photo_ok(r["above"][0]) else []),
                              views=[dict(stop=v[0], label=v[1], poster=poster(v[0])) for v in r["views"] if stop_ready(v[0])])
    def shapes(sheet, area_list):
        out = {}
        for a in area_list:
            for r in a["rooms"]:
                cs = [c for c in r.get("codes", []) if sheet_of(c) == sheet]
                if cs: out[r["id"]] = [poly for c in cs for poly in SH[sheet]["shapes"].get(c, [])]
        return out
    plans = {}
    l1_areas = [a for a in AREAS if a not in (CROWN, GARDEN)]
    for key, sheet, area_list, prefix in (("l1", "l1", l1_areas, "l1:"), ("crown", "crown", [CROWN], "crown:")):
        plans[key] = dict(sheet="../plans/svg/%s.svg" % sheet, w=SH[sheet]["w"], h=SH[sheet]["h"], shapes=shapes(sheet, area_list), prefix=prefix)
    l1, cr = plans["l1"]["shapes"], plans["crown"]["shapes"]
    data = dict(rooms=rooms, plans=plans)
    open(os.path.join(DES, "explorer-rooms.json"), "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print("explorer-rooms.json", len(rooms), "rooms,", len(l1) + len(cr), "shapes")


if __name__ == "__main__":
    os.makedirs(os.path.join(DES, "img", "pano"), exist_ok=True)
    for a in AREAS:
        open(os.path.join(DES, a["id"] + ".html"), "w", encoding="utf-8").write(page(a))
        n_ph = sum(1 for r in a["rooms"] for p in r["photos"] if photo_ok(p[0])); n_v = sum(1 for r in a["rooms"] for v in r["views"] if stop_ready(v[0]))
        print(a["id"], "rooms", len(a["rooms"]), "photos", n_ph, "360s", n_v)
    explorer_json()
