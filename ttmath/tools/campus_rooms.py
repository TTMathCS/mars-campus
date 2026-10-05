"""TTMath campus, phase 2: the rooms of every new building (Jim, 4 Oct 2026: "building expansion / new rooms/area design
as priority"). One entry per room or area, with its code: T06-01 is building T-06 (the Crescent), room 01.
campus_buildings.py draws the floor plans and the building pages from this file and writes ttmath/src/blocks/blk_p2data.js,
which the demo builds from, so the 3D campus follows the plan. campus_plan.py draws the site plan.

Places are in the Math Palace's frame, in metres: rad from the dome's centre toward the start, lat to the visitor's
right; angles (deg) are round the dome's centre, 0 straight behind the dome, positive toward +lat. Heights are from
each building's main floor."""

# ------------------------------------------------------------------------------------------------- T-06 the Crescent
# A two-storey crescent wrapping the back of the dome between radii 46 and 60 m, from -50 to +50 degrees. The upper
# floor opens onto the palace's back terrace (T09-01); the ground falls away behind it, so the lower floor opens onto
# the Fibonacci Garden. Rooms on the garden side, a corridor on the dome side, a double-height hall in the middle with
# the stair and the lift, the way through from the terrace to the garden. Washrooms at the west end of both floors, one
# above the other; an exit at each end of both corridors.
CRESCENT = dict(r0=46.0, r1=60.0, rc=49.2, a0=-50.0, a1=50.0, floor_h=4.2, upper=0.0, lower=-4.2)
CRESCENT_ROOMS = [
    # upper floor (terrace level)
    dict(code="T06-01", name="Hall and stair", floor="upper", a=(-6, 6), kind="move", double=True,
         use="The way in from the palace's back terrace and down to the garden: a hall two storeys tall with a wide stair and a lift, the timetable on a screen, benches.",
         also="Exhibitions of students' work."),
    dict(code="T06-02", name="Euclid", floor="upper", a=(6, 18), kind="class", use="Classroom for geometry: 24 seats, a whiteboard, compasses and models of the solids.", also="Evening classes for adults."),
    dict(code="T06-03", name="Archimedes", floor="upper", a=(18, 30), kind="class", use="Classroom for measurement and physics problems: 24 seats, a demonstration bench.", also=""),
    dict(code="T06-04", name="Hypatia", floor="upper", a=(30, 42), kind="class", use="Classroom for algebra: 24 seats, two whiteboards.", also=""),
    dict(code="T06-05", name="Teachers' room", floor="upper", a=(42, 50), kind="staff", short="Teachers", use="Desks for the teachers, a meeting table, a kitchenette and lockers.", also="Marking and lesson planning."),
    dict(code="T06-06", name="Fibonacci", floor="upper", a=(-18, -6), kind="class", use="Classroom for number patterns: 24 seats, a wall of sequences and spirals.", also=""),
    dict(code="T06-07", name="Gauss", floor="upper", a=(-30, -18), kind="class", use="Classroom for statistics and data: 24 seats, screens at each table.", also=""),
    dict(code="T06-08", name="Noether", floor="upper", a=(-42, -30), kind="class", use="Classroom for symmetry and abstract algebra: 24 seats, a wall of tilings.", also=""),
    dict(code="T06-09", name="Washrooms", floor="upper", a=(-50, -42), kind="service", short="WC", use="Washrooms for the upper floor, above the lower ones; a cleaner's cupboard.", also=""),
    dict(code="T06-CU", name="Upper corridor", floor="upper", a=(-50, 50), band="corridor", kind="move", use="Along the dome side, with windows onto the terrace.", also=""),
    # lower floor (garden level)
    dict(code="T06-10", name="Lower hall", floor="lower", a=(-6, 6), kind="move", use="Under the hall's gallery: doors out to the garden's top terrace.", also=""),
    dict(code="T06-11", name="Study hall", floor="lower", a=(6, 30), kind="study", use="A quiet room for homework: 40 carrels with lamps, a librarian's desk.", also="Exam room."),
    dict(code="T06-12", name="Ramanujan", floor="lower", a=(30, 42), kind="class", use="Classroom for number theory and problem solving: 24 seats.", also=""),
    dict(code="T06-13", name="Turing", floor="lower", a=(42, 50), kind="lab", short="Turing", use="Computer classroom: 16 workstations for coding and modelling.", also=""),
    dict(code="T06-14", name="Competition room", floor="lower", a=(-30, -6), kind="compete", use="Math olympiad training and contests: team tables, a scoreboard on the wall, a stage for the problem reader.", also="Chess tournaments."),
    dict(code="T06-15", name="Games room and lounge", floor="lower", a=(-42, -30), kind="games", use="Chess, Go, puzzles and math games at tables, shelves of games, a Rubik's cube wall; sofas and a coffee machine by the glass onto the garden.", also="Clubs after school."),
    dict(code="T06-16", name="Washrooms and store", floor="lower", a=(-50, -42), kind="service", short="WC, store", use="Washrooms for the lower floor and a store for chairs and teaching kit.", also=""),
    dict(code="T06-CL", name="Lower corridor", floor="lower", a=(-50, 50), band="corridor", kind="move", use="Along the dome side, against the slope.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-07 Infinity Hall
# A lecture theatre built into the slope like a Greek theatre: the stage at the low end, at the point of a fan, the rows
# climbing the hill toward the palace, the foyer behind the last row at the top, level with the garden's first terrace.
# Local frame: origin at the stage's centre, +y toward the audience; turn = the direction of +y in degrees from +rad
# toward +lat (0: the fan opens toward the palace).
INFINITY = dict(lat=-60.0, rad=-120.0, turn=0.0, r_stage=6.0, r_seats=(8.0, 30.0), r_foyer=(30.0, 36.0), half_angle=38.0, rows=12, seats_per_row=20)
INFINITY_ROOMS = [
    dict(code="T07-01", name="Foyer", kind="move", use="The way in from the garden's first terrace, at the top of the rows: a bar, coat racks, posters of the season's talks.", also="Receptions after a talk."),
    dict(code="T07-02", name="Auditorium", kind="hall", use="240 seats on 12 raked rows facing a screen 14 m wide: talks, contests, films, the graduation.", also="Concerts."),
    dict(code="T07-03", name="Stage", kind="hall", use="A timber stage 12 m wide with a lectern and a demonstration table.", also=""),
    dict(code="T07-04", name="Green room", kind="staff", use="Behind the stage: where speakers wait, with a mirror and a sofa.", also=""),
    dict(code="T07-05", name="Projection and sound booth", kind="tech", use="Above the foyer, behind glass: the projector, the sound desk, the lights.", also=""),
    dict(code="T07-06", name="Washrooms", kind="service", use="Off the foyer.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-08 Garden of Primes
# Two glass barrel vaults along the slope (40 m long toward the palace), the potting room between them. Near end = the
# end toward the palace (+rad), where the doors are.
GREENHOUSE = dict(lat=62.0, rad=-100.0, turn=0.0, vault_w=12.0, vault_l=40.0, link_w=4.0, link_l=12.0, height=8.0)
GREENHOUSE_ROOMS = [
    dict(code="T08-01", name="Kitchen garden", kind="garden", use="The vault on the garden side: raised beds of vegetables and herbs for Café π, lettuce towers under grow lights.", also="Biology classes."),
    dict(code="T08-02", name="Orchard vault", kind="garden", use="The outer vault: citrus, figs and olives in big tubs, a path that turns at prime numbers of steps.", also="A quiet place to read."),
    dict(code="T08-03", name="Fern grotto", kind="garden", use="The far end of the orchard vault: ferns and moss over rocks, misted, cool.", also=""),
    dict(code="T08-04", name="Potting room and seed bank", kind="service", use="Between the vaults, with a door into each: benches for potting, drawers of seeds, tools.", also=""),
    dict(code="T08-05", name="Tea corner", kind="lounge", use="The near end of the kitchen garden: a few tables among the herbs.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-10 Observatory
OBSERVATORY = dict(lat=0.0, rad=-146.0, r=9.0, floors=4, floor_h=4.5, dome_r=4.5)
OBSERVATORY_ROOMS = [
    dict(code="T10-01", name="Entrance and planet hall", level=0, kind="move", use="Ground floor: models of the planets to scale, a lit globe of Mars, the stair up.", also=""),
    dict(code="T10-02", name="Astronomy classroom", level=1, kind="class", use="First floor: 20 seats, a screen, star charts.", also=""),
    dict(code="T10-03", name="Control room", level=2, kind="tech", use="Second floor: the telescope's computers and the camera screens.", also=""),
    dict(code="T10-04", name="Telescope dome", level=3, kind="tech", use="Top: a 1 m telescope under a dome 9 m across that opens and turns.", also=""),
    dict(code="T10-05", name="Viewing deck", level=3, kind="lounge", use="A ring round the dome behind radiation glass: Earth and the Moon as evening stars, Phobos and Deimos.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-11 Sports Dome
# The entrance faces the observatory's plaza (+lat); under a gallery over the entrance side are the changing rooms and the
# store; the climbing wall is on the far side.
SPORTS = dict(lat=-58.0, rad=-158.0, r=17.0, height=16.0, court=(24.0, 13.0), gallery=(4.0, 5.5), door_turn=90.0)
SPORTS_ROOMS = [
    dict(code="T11-01", name="Court", kind="sport", use="A sprung timber court 24 by 13 m for basketball and volleyball, where a jump lasts 2.6 times as long as on Earth.", also="Assemblies."),
    dict(code="T11-02", name="Climbing wall", kind="sport", use="A wall 10 m tall and 18 m wide on the far side, following the dome's curve, so it leans out near the top.", also=""),
    dict(code="T11-03", name="Fitness gallery", kind="sport", use="On a gallery over the entrance side: treadmills with harnesses that pull you down to your Earth weight, rowers and bikes, a view of the court. Keeps bones and muscles strong in Mars gravity.", also=""),
    dict(code="T11-04", name="Changing rooms", kind="service", use="Two, with showers, under the gallery by the entrance.", also=""),
    dict(code="T11-05", name="Equipment store", kind="service", use="Under the gallery: balls, nets, mats and harnesses.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-12 Robotics and Rover Hangar
# 34 m across the slope (lat) by 22 m: the three rover bays on the yard side (+lat) with a big door each, the suit room
# between the bays and the corridor, the lab and the workshop on the garden side; the way in from the palace side (+rad).
HANGAR = dict(lat=72.0, rad=-156.0, turn=0.0, w=34.0, d=22.0, height=8.0, bay_depth=14.0)
HANGAR_ROOMS = [
    dict(code="T12-01", name="Rover bays", kind="tech", use="Three bays for the campus rovers, each with a big door onto the test yard; the rovers dock to the suit room's suitports.", also=""),
    dict(code="T12-02", name="Robotics lab", kind="lab", use="Benches where students build robots and small rovers: tools, parts drawers, a test table.", also="Robotics club."),
    dict(code="T12-03", name="Workshop", kind="tech", use="3D printers, a laser cutter, a lathe and a mill.", also=""),
    dict(code="T12-04", name="Suit room", kind="tech", use="The EVA suits on their racks and an airlock out onto the surface, next to the bays.", also=""),
    dict(code="T12-05", name="Parts store", kind="service", use="Spares for the rovers and the robots.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-14 Pod Port, T-15 terminal
PODPORT = dict(pads=[(-6.0, -198.0), (20.0, -198.0), (46.0, -198.0), (-6.0, -218.0), (20.0, -218.0), (46.0, -218.0)], pad_r=7.0, parked=[0, 2, 3, 5])
PODPORT_ROOMS = [dict(code="T14-P%d" % (i + 1), name="Pad %d" % (i + 1), kind="pad", use="A landing pad 14 m across with a lit ring and a charging mast." + (" A pod parked." if i in (0, 2, 3, 5) else ""), also="") for i in range(6)]
# A glass pavilion facing the pads (-rad). The pods taxi up to two boarding collars on the pad side, so nobody needs a suit.
TERMINAL = dict(lat=20.0, rad=-173.0, turn=0.0, w=26.0, d=12.0, height=6.0, gates=(12.0, 28.0))
TERMINAL_ROOMS = [
    dict(code="T15-01", name="Lounge", kind="lounge", use="A waiting room with the view of the pads through the glass.", also=""),
    dict(code="T15-02", name="Check-in", kind="move", use="A desk and the departures board.", also=""),
    dict(code="T15-03", name="Charging room", kind="tech", use="The pods' batteries and chargers.", also=""),
    dict(code="T15-04", name="Crew office", kind="staff", use="The pod crew's desk and the flight screens.", also=""),
    dict(code="T15-05", name="Boarding gates", kind="move", use="Two collars on the pad side that seal onto a pod's door: you board without a suit.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-16 Sun court
# Where the solar field stood, behind the classroom wing. The campus has no power plant of its own: it is on the grid of
# the city nearby (Jim, 4 Oct 2026: "no need for plant generators, since the power is supplied centrally by the city
# close by. free the space up for other purposes"). Kept low: here the ground hides no more than about 4 m. An
# armillary sundial, because Gale crater is almost on the equator, where a dial drawn flat on the ground fails.
SUNCOURT = dict(lat=27.0, rad=47.5, w=12.0, d=19.0, sphere=2.2, plinth=0.6, benches=5)
SUNCOURT_ROOMS = [
    dict(code="T16-01", name="Armillary sundial", kind="garden", use="A bronze armillary sphere 2.2 m across on a stone plinth, its rod parallel to Mars's axis; the hour ring shows the sol's 24 Mars hours (each 1 h 2 min long).", also="Lessons on angles, time and orbits."),
    dict(code="T16-02", name="Outdoor classroom", kind="garden", use="Five stone benches in a half-circle facing the sundial, on basalt paving, with a path round the wing to the courtyard.", also="A quiet seat in the morning sun."),
]

# ------------------------------------------------------------------------------------------------- T-09 Fibonacci Garden and the back door
# Terraces step down the slope from the Crescent's lower floor to the observatory's plaza; levels are from the Crescent's
# upper floor (the palace's floor) and will be fitted to the real ground when it is built. The back terrace is the band
# between the dome and the Crescent.
GARDEN = dict(back_terrace=(28.0, 46.0), terraces=[(-84.0, 36.0, -4.2), (-106.0, 33.0, -7.6), (-128.0, 30.0, -11.0)], plaza=(-128.0, -160.0, -13.5),
              spiral=dict(lat=0.0, rad=-100.0, a=2.2, turns=1.7), back_door=dict(w=6.0, d=4.0),
              sculptures=[dict(name="Klein bottle", lat=-20.0, rad=-76.0), dict(name="trefoil knot", lat=22.0, rad=-80.0),
                          dict(name="Möbius bench", lat=-22.0, rad=-118.0), dict(name="stellated dodecahedron", lat=21.0, rad=-121.0)])
GARDEN_AREAS = [
    dict(code="T09-01", name="Back terrace", kind="garden", use="A paved terrace between the palace's new back door and the Crescent, with benches and the view down the garden.", also=""),
    dict(code="T09-02", name="Spiral garden", kind="garden", use="Three terraces down the slope, the paths on a golden spiral, basalt gravel and Mars rock.", also=""),
    dict(code="T09-03", name="Sculpture walk", kind="garden", use="Math in bronze and stone along the paths: a Klein bottle, a trefoil knot, a Möbius bench, a stellated dodecahedron.", also=""),
    dict(code="T09-04", name="Palace back door", kind="move", use="A glass vestibule at the back of the dome, from the balcony out onto the back terrace.", also=""),
]

BUILDINGS = [
    dict(code="T-06", name="The Crescent: the Academy", rooms=CRESCENT_ROOMS, geo=CRESCENT, page="crescent.html"),
    dict(code="T-07", name="Infinity Hall", rooms=INFINITY_ROOMS, geo=INFINITY, page="infinity.html"),
    dict(code="T-08", name="Garden of Primes", rooms=GREENHOUSE_ROOMS, geo=GREENHOUSE, page="greenhouse.html"),
    dict(code="T-09", name="Fibonacci Garden", rooms=GARDEN_AREAS, geo=None, page="garden.html"),
    dict(code="T-10", name="Observatory", rooms=OBSERVATORY_ROOMS, geo=OBSERVATORY, page="observatory.html"),
    dict(code="T-11", name="Low-gravity Sports Dome", rooms=SPORTS_ROOMS, geo=SPORTS, page="sports.html"),
    dict(code="T-12", name="Robotics and Rover Hangar", rooms=HANGAR_ROOMS, geo=HANGAR, page="hangar.html"),
    dict(code="T-14", name="Pod Port", rooms=PODPORT_ROOMS, geo=PODPORT, page="pods.html"),
    dict(code="T-15", name="Pod terminal", rooms=TERMINAL_ROOMS, geo=TERMINAL, page="pods.html"),
]

# the pages of ttmath/plan/, for the navigation bar of campus_plan.py and campus_buildings.py
PLAN_NAV = [("index.html", "The plan"), ("buildings.html", "The buildings")] + [(b, c) for b, c in (
    ("crescent.html", "T-06"), ("infinity.html", "T-07"), ("greenhouse.html", "T-08"), ("garden.html", "T-09"), ("observatory.html", "T-10"),
    ("sports.html", "T-11"), ("hangar.html", "T-12"), ("pods.html", "T-14, T-15"))] + [("rover.html", "The rover")]
