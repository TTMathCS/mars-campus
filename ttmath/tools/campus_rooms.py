"""TTMath campus, phase 2: the rooms of every new building (Jim, 4 Oct 2026: "building expansion / new rooms/area design
as priority"). One entry per room or area, with its code: T06-01 is building T-06 (the Crescent), room 01.
campus_buildings.py draws the floor plans and the building pages from this file and writes ttmath/src/blocks/blk_p2data.js,
which the demo builds from, so the 3D campus follows the plan. campus_plan.py draws the site plan.

Places are in the Math Palace's frame, in metres: rad from the dome's centre toward the start, lat to the visitor's
right; angles (deg) are round the dome's centre, 0 straight behind the dome, positive toward +lat. Heights are from
each building's main floor."""

# ------------------------------------------------------------------------------------------------- the sealed campus
# Jim, 5 Oct 2026: "since bad conditions, all the schools buildings should be connected and sealed, so there should not
# be open area to the air. all open space should be covered by dome or sealed". The campus is one pressurised whole:
# every room, court and garden is under a roof, a glass vault or a dome, and every building is joined to the next by a
# sealed link (T-17), so you can go everywhere in shirt sleeves. People meet the outside only at airlocks: the entrance
# under the gateway (T04-02), the hangar's suit room and the rovers' suitports (T-12), the pods' boarding collars (T04-03,
# T15-05). Only the vehicles' ground stays outside: the rover test yard (T-13) and the pod pads (T-14).
SEALED = dict(
    covers=["T04-01 Courtyard hall", "T09-01 Winter garden", "T06-15 Garden gallery", "T-09 Garden domes", "T-16 Sun court"],
    airlocks=["T04-02 entrance", "T12-04 suit room", "T12-01 rover suitports", "T04-03 and T15-05 pod collars"],
    outside=["T-13 rover test yard", "T-14 pod pads"])

# ------------------------------------------------------------------------------------------------- T-04 the courtyard, sealed
# The courtyard between the wings goes under a glass vault that springs from the wings' roof edges, its crown falling
# with the line of sight from 10.6 m by the palace to 6.2 m at the gateway (s: the distance along the palace's axis, as
# rad). The gateway arch stands in front of a glass end wall with the entrance airlock; a pod stop by the airlock.
COURTYARD = dict(s0=33.3, s1=77.7, crown=[(33.3, 10.6), (56.0, 8.6), (77.7, 6.2)], ribs=1.5,
                 airlock=dict(s0=77.7, s1=84.0, w=7.0, h=4.2), podstop=dict(lat=-8.0, rad=81.0, r=4.0, heading=180.0))       # left of the avenue (the rover stands on the right), nose to the start: its door faces the airlock
COURTYARD_ROOMS = [
    dict(code="T04-01", name="Courtyard hall", kind="move", use="The courtyard under a glass vault on slender steel ribs: the paving, the bollards and young trees, the wings' doors on both sides and the palace's door at the end, warm and in air.", also="Assemblies, the graduation reception, stargazing evenings in shirt sleeves."),
    dict(code="T04-02", name="Entrance airlock", kind="move", use="Under the gateway: outer and inner sliding glass doors with a chamber 6 m long between them; the inner doors open once the outer ones have closed and the air is in. Suit lockers and a bench along the side.", also=""),
    dict(code="T04-03", name="Pod stop", kind="pad", use="A pad right beside the airlock with one pod, its door at a short glass collar from the airlock: take it and fly over the campus.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-06 the Crescent
# A two-storey crescent wrapping the back of the dome between radii 46 and 62 m, from -52 to +52 degrees. The upper
# floor opens onto the winter garden (T09-01, the covered back terrace); the ground falls away behind it, so the lower
# floor opens onto the garden gallery (T06-15) and the garden domes. Rooms on the garden side, a corridor on the dome
# side, a hall two storeys tall in the middle with the stair and the lift. Washrooms at the west end of both floors, one
# above the other; an enclosed emergency stair at each end of the corridors. The stair and landings are sized here so
# the plan and the demo agree (stair: angle, radii of its foot and top, width, risers, the landing between the flights).
# Big rooms with high ceilings (Jim, 5 Oct 2026: "class rooms are all too small and roof are too low. feels depressed"):
# each classroom about 17 m by 12 m under a ceiling 4.5 m high, floors 5.6 m apart.
CRESCENT = dict(r0=46.0, r1=62.0, rc=49.6, a0=-52.0, a1=52.0, floor_h=5.6, upper=0.0, lower=-5.6, ceil=4.5, ceil_corridor=3.8,
                stair=dict(a=3.6, r0=51.0, r1=60.6, w=3.0, n=32, landing=(55.2, 56.4)), lift=(49.8, -4.6), estair=dict(a=6.5, w=2.6))
CRESCENT_ROOMS = [
    # upper floor (level with the palace's balcony and the winter garden)
    dict(code="T06-01", name="Hall and stair", floor="upper", a=(-7, 7), kind="move", double=True,
         use="The way in from the winter garden and down to the garden gallery: a hall two storeys tall with a wide stair and a lift, the timetable on a screen, long benches.",
         also="Exhibitions of students' work."),
    dict(code="T06-02", name="Euclid", floor="upper", a=(7, 25), kind="class", use="Classroom for geometry: 30 seats at double desks, a whiteboard wall, compasses and models of the solids.", also="Evening classes for adults."),
    dict(code="T06-03", name="Hypatia", floor="upper", a=(25, 43), kind="class", use="Classroom for algebra and measurement: 30 seats, two whiteboards, a demonstration bench.", also=""),
    dict(code="T06-04", name="Teachers' room", floor="upper", a=(43, 52), kind="staff", short="Teachers", use="Desks for the teachers, a meeting table, a kitchenette, lockers and a long sofa.", also="Marking and lesson planning."),
    dict(code="T06-05", name="Fibonacci", floor="upper", a=(-25, -7), kind="class", use="Classroom for number patterns: 30 seats, a wall of sequences and spirals.", also=""),
    dict(code="T06-06", name="Noether", floor="upper", a=(-43, -25), kind="class", use="Classroom for symmetry and abstract algebra: 30 seats, a wall of tilings.", also=""),
    dict(code="T06-07", name="Washrooms", floor="upper", a=(-52, -43), kind="service", short="WC", use="Washrooms for the upper floor, above the lower ones; a cleaner's cupboard.", also=""),
    dict(code="T06-CU", name="Upper corridor", floor="upper", a=(-52, 52), band="corridor", kind="move", use="Along the dome side, with glass onto the winter garden; the emergency stairs at both ends.", also=""),
    # lower floor (level with the garden gallery and the top garden dome)
    dict(code="T06-08", name="Lower hall", floor="lower", a=(-7, 7), kind="move", use="Under the hall's gallery: glass doors out to the garden gallery and the garden domes.", also=""),
    dict(code="T06-09", name="Study hall", floor="lower", a=(7, 27), kind="study", use="A quiet room for homework: 40 carrels with lamps, a librarian's desk, shelves along the corridor wall.", also="Exam room."),
    dict(code="T06-10", name="Gauss", floor="lower", a=(27, 41), kind="class", use="Classroom for statistics and data: 24 seats at tables with screens.", also=""),
    dict(code="T06-11", name="Turing", floor="lower", a=(41, 52), kind="lab", short="Turing", use="Computer classroom: 16 workstations for coding and modelling.", also=""),
    dict(code="T06-12", name="Ramanujan: competition room", floor="lower", a=(-27, -7), kind="compete", short="Ramanujan", use="Math olympiad training and contests: team tables, a scoreboard on the wall, a stage for the problem reader.", also="Chess tournaments."),
    dict(code="T06-13", name="Games room and lounge", floor="lower", a=(-41, -27), kind="games", use="Chess, Go, puzzles and math games at tables, shelves of games, a Rubik's cube wall; long sofas and a coffee machine by the glass onto the garden gallery.", also="Clubs after school."),
    dict(code="T06-14", name="Washrooms and store", floor="lower", a=(-52, -41), kind="service", short="WC, store", use="Washrooms for the lower floor and a store for chairs and teaching kit.", also=""),
    dict(code="T06-CL", name="Lower corridor", floor="lower", a=(-52, 52), band="corridor", kind="move", use="Along the dome side, against the slope; the emergency stairs at both ends.", also=""),
    dict(code="T06-16", name="West stair", floor="both", a=(-52, -45.5), band="corridor", kind="move", use="An enclosed emergency stair at the corridors' west end, between the floors, behind fire doors.", also=""),
    dict(code="T06-17", name="East stair", floor="both", a=(45.5, 52), band="corridor", kind="move", use="The same at the east end.", also=""),
    dict(code="T06-15", name="Garden gallery", floor="lower", a=(-52, 52), band="gallery", kind="garden", use="The court along the whole garden front, under a sloping glass roof from the Crescent's eave to a low stone wall: planters, benches, the doors of every lower room; in the middle it opens into the top garden dome.", also=""),
]
GALLERY = dict(r0=62.0, r1=68.5, a=52.0, wall=1.2)

# The plants of the Crescent, chosen room by room (Jim's rule: all kinds and colours, never one pot plant repeated):
# kind and spot. Spots: window0/window1 (the garden glass, at the room's lower/higher-angle end), windowmid, corner0/
# corner1 (the corridor wall's ends), door (beside the doorway), desk (on the teacher's or a table), shelf (on a shelf).
CRESCENT_PLANTS = {
    "T06-01": [("strelitzia", "window0"), ("strelitzia", "window1"), ("maple", "corner0"), ("kentia", "corner1")],
    "T06-02": [("croton", "window0"), ("fig", "windowmid"), ("orchid", "desk"), ("snake", "door")],
    "T06-03": [("monstera", "window0"), ("agave", "window1"), ("anthurium", "desk"), ("ficus", "corner1")],
    "T06-04": [("olive", "window1"), ("orchid", "desk"), ("pothos", "shelf")],
    "T06-05": [("agave", "window1"), ("kentia", "windowmid"), ("fern", "corner0"), ("bromeliad", "desk")],
    "T06-06": [("strelitzia", "window1"), ("croton", "windowmid"), ("orchid", "desk"), ("snake", "door")],
    "T06-07": [("snake", "window0"), ("pothos", "shelf")],
    "T06-08": [("maple", "window0"), ("monstera", "window1"), ("strelitzia", "corner1")],
    "T06-09": [("ficus", "window0"), ("kentia", "window1"), ("fern", "corner0"), ("pothos", "shelf")],
    "T06-10": [("fig", "window0"), ("anthurium", "desk"), ("croton", "corner1")],
    "T06-11": [("snake", "window1"), ("bromeliad", "desk"), ("pothos", "shelf")],
    "T06-12": [("olive", "window0"), ("olive", "window1"), ("croton", "corner0"), ("strelitzia", "corner1")],
    "T06-13": [("monstera", "window0"), ("maple", "window1"), ("fern", "corner1"), ("orchid", "desk")],
    "T06-14": [("snake", "window1"), ("pothos", "shelf")],
}

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
OBSERVATORY = dict(lat=0.0, rad=-172.0, r=9.0, floors=4, floor_h=4.5, dome_r=4.5)          # at the foot of the garden domes, joined to the lowest by a short link
OBSERVATORY_ROOMS = [
    dict(code="T10-01", name="Entrance and planet hall", level=0, kind="move", use="Ground floor, in from the lowest garden dome and the link to the pod terminal: models of the planets to scale, a lit globe of Mars, the stair and the lift up.", also=""),
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
# A glass pavilion facing the pads (-rad), joined to the observatory by a link (T17-06). The pods taxi up to two boarding
# collars on the pad side, so nobody needs a suit.
TERMINAL = dict(lat=30.0, rad=-176.0, turn=0.0, w=26.0, d=12.0, height=6.0, gates=(12.0, 28.0))
TERMINAL_ROOMS = [
    dict(code="T15-01", name="Lounge", kind="lounge", use="A waiting room with the view of the pads through the glass.", also=""),
    dict(code="T15-02", name="Check-in", kind="move", use="A desk and the departures board.", also=""),
    dict(code="T15-03", name="Charging room", kind="tech", use="The pods' batteries and chargers.", also=""),
    dict(code="T15-04", name="Crew office", kind="staff", use="The pod crew's desk and the flight screens.", also=""),
    dict(code="T15-05", name="Boarding gates", kind="move", use="Two collars on the pad side that seal onto a pod's door: you board without a suit.", also=""),
]

# The pods (Jim, 5 Oct 2026: "add some flying pod I can take and can drive the flying pod to see the eagle view"): two-seat
# craft about 6 m long, a teardrop cabin in white composite with a tinted canopy, four big ducted rotors (Mars's thin air
# needs large blades), skids, navigation lights. One waits at the pod stop by the entrance (T04-03), four on the pads.
# Walk up to one to board it; fly it anywhere over the campus and the crater, up to 400 m, at up to 40 m/s; set it down on
# any pad or on open, level ground, and step out beside it.
POD = dict(length=6.0, width=2.4, height=2.4, rotor_r=1.1, rotors=[(-2.45, 2.0), (2.45, 2.0), (-2.45, -2.0), (2.45, -2.0)],   # room to get in between the right-hand ducts
           top_speed=40.0, climb=8.0, ceiling=400.0, min_clear=2.5, land_slope=0.12)

# ------------------------------------------------------------------------------------------------- T-16 Sun court
# Where the solar field stood, behind the classroom wing. The campus has no power plant of its own: it is on the grid of
# the city nearby (Jim, 4 Oct 2026: "no need for plant generators, since the power is supplied centrally by the city
# close by. free the space up for other purposes"). Kept low: here the ground hides no more than about 4 m. An
# armillary sundial, because Gale crater is almost on the equator, where a dial drawn flat on the ground fails.
# Sealed (Jim, 5 Oct 2026): the court is sunk to the lobby's floor and covered by a low glass vault, whose crown stays
# under the line of sight; the sun still reaches the dial through the glass. A short link (T17-01) from the classroom
# wing's lobby. Heights here are absolute (the palace frame's y).
SUNCOURT = dict(lat=27.0, rad=47.5, w=12.0, d=19.0, sphere=2.2, plinth=0.6, benches=5, floor=0.0, crown=4.4, spring=1.6)
SUNCOURT_ROOMS = [
    dict(code="T16-01", name="Armillary sundial", kind="garden", use="A bronze armillary sphere 2.2 m across on a stone plinth, its rod parallel to Mars's axis; the hour ring shows the sol's 24 Mars hours (each 1 h 2 min long).", also="Lessons on angles, time and orbits."),
    dict(code="T16-02", name="Sun classroom", kind="garden", use="Five long stone benches with cushions in a half-circle facing the sundial, on basalt paving, under a low glass vault on bronze ribs; in from the lobby by a short link.", also="A quiet seat in the morning sun."),
]

# ------------------------------------------------------------------------------------------------- T-09 the garden domes and the winter garden
# Sealed (Jim, 5 Oct 2026). The back terrace between the dome and the Crescent becomes the winter garden (T09-01) under a
# glass vault that wraps the back of the dome. Down the slope, the Fibonacci Garden grows under three geodesic glass
# domes in a row on the palace's axis, each a step lower, opening into one another under steel arches: the top one
# joins the Crescent's garden gallery, the lowest the observatory. Infinity Hall, the Garden of Primes and the rest join
# them by links (T-17). Dome levels are absolute floor heights (the Crescent's lower floor is -5.6).
WINTER = dict(r0=28.6, r1=46.0, a=50.0, crown=13.0, spring_in=0.6, spring_out=None)      # spring_out: on the Crescent's eave
DOMES = [dict(code="T09-02", lat=0.0, rad=-91.0, r=22.0, floor=-5.6, h=16.0),
         dict(code="T09-03", lat=0.0, rad=-115.0, r=22.0, floor=-8.4, h=18.0),
         dict(code="T09-05", lat=0.0, rad=-139.0, r=22.0, floor=-11.2, h=20.0)]
GARDEN = dict(back_terrace=(28.0, 46.0), domes=DOMES, winter=WINTER,
              spiral=dict(lat=0.0, rad=-115.0, a=2.2, turns=1.7), back_door=dict(w=6.0, d=4.0),
              sculptures=[dict(name="Klein bottle", lat=-12.0, rad=-86.0), dict(name="trefoil knot", lat=12.0, rad=-88.0),
                          dict(name="Möbius bench", lat=-12.0, rad=-120.0), dict(name="stellated dodecahedron", lat=12.0, rad=-141.0)])
GARDEN_AREAS = [
    dict(code="T09-01", name="Winter garden", kind="garden", use="The old back terrace, now under a glass vault on bronze ribs that wraps the back of the dome from the palace's back door to the Crescent: stone paving, olive trees, palms and red maples in big planters, long benches, the view up into the dome.", also="Receptions, a quiet place to read."),
    dict(code="T09-02", name="Upper garden dome", kind="garden", use="Under the first glass dome, level with the Crescent's lower floor: lawns and flower beds on the golden spiral, the Klein bottle and the trefoil knot, a café kiosk.", also="Lessons outdoors, as it feels."),
    dict(code="T09-03", name="Spiral garden dome", kind="garden", use="Under the middle dome, a step lower: the golden spiral path through ferns, grasses and flowering shrubs, the Möbius bench, a pool.", also=""),
    dict(code="T09-05", name="Lower garden dome", kind="garden", use="Under the lowest and tallest dome: fruit trees and tall palms, the stellated dodecahedron, the plaza at the observatory's door.", also="Concerts and the graduation party."),
    dict(code="T09-04", name="Palace back door", kind="move", use="A glass vestibule at the back of the dome, from the balcony into the winter garden.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-17 the links
# Sealed galleries joining every building to the next, so you go everywhere in shirt sleeves: a concrete trough half sunk
# in the ground and banked with regolith on the outside (shade and shielding), a glass vault on steel ribs above it.
# From and to are points in the palace frame; w is the clear width, h the height inside at the crown.
LINKS = [
    dict(code="T17-01", name="Sun court link", a=(16.0, 53.0), b=(21.0, 53.0), w=3.0, h=3.0, use="From the classroom wing's lobby down three steps into the Sun court."),
    dict(code="T17-02", name="Pod stop collar", a=(-3.5, 81.0), b=(-4.6, 81.0), w=2.2, h=2.6, use="A short glass collar from the entrance airlock's side to the door of the pod at the pod stop."),
    dict(code="T17-03", name="Infinity link", a=(-22.0, -91.0), b=(-38.5, -92.0), w=4.0, h=3.4, use="From the upper garden dome to Infinity Hall's foyer."),
    dict(code="T17-04", name="Greenhouse link", a=(22.0, -88.0), b=(48.0, -88.0), w=4.0, h=3.4, use="From the upper garden dome to the Garden of Primes."),
    dict(code="T17-05", name="Observatory collar", a=(0.0, -161.0), b=(0.0, -163.0), w=5.0, h=3.6, use="From the lowest garden dome into the observatory."),
    dict(code="T17-06", name="Terminal link", a=(9.0, -174.0), b=(17.0, -176.0), w=4.0, h=3.4, use="From the observatory to the pod terminal."),
    dict(code="T17-07", name="Sports link", a=(-60.0, -126.0), b=(-58.5, -141.0), w=4.0, h=3.4, use="From behind Infinity Hall's stage to the sports dome."),
    dict(code="T17-08", name="Hangar link", a=(62.0, -120.0), b=(62.0, -145.0), w=4.0, h=3.4, use="From the far end of the Garden of Primes to the robotics and rover hangar."),
]
LINK_ROOMS = [dict(code=k["code"], name=k["name"], kind="move", use=k["use"], also="") for k in LINKS]

BUILDINGS = [
    dict(code="T-04", name="Courtyard hall and entrance", rooms=COURTYARD_ROOMS, geo=COURTYARD, page="courtyard.html"),
    dict(code="T-06", name="The Crescent: the Academy", rooms=CRESCENT_ROOMS, geo=CRESCENT, page="crescent.html"),
    dict(code="T-07", name="Infinity Hall", rooms=INFINITY_ROOMS, geo=INFINITY, page="infinity.html"),
    dict(code="T-08", name="Garden of Primes", rooms=GREENHOUSE_ROOMS, geo=GREENHOUSE, page="greenhouse.html"),
    dict(code="T-09", name="Garden domes and winter garden", rooms=GARDEN_AREAS, geo=None, page="garden.html"),
    dict(code="T-10", name="Observatory", rooms=OBSERVATORY_ROOMS, geo=OBSERVATORY, page="observatory.html"),
    dict(code="T-11", name="Low-gravity Sports Dome", rooms=SPORTS_ROOMS, geo=SPORTS, page="sports.html"),
    dict(code="T-12", name="Robotics and Rover Hangar", rooms=HANGAR_ROOMS, geo=HANGAR, page="hangar.html"),
    dict(code="T-14", name="Pod Port", rooms=PODPORT_ROOMS, geo=PODPORT, page="pods.html"),
    dict(code="T-15", name="Pod terminal", rooms=TERMINAL_ROOMS, geo=TERMINAL, page="pods.html"),
    dict(code="T-16", name="Sun court", rooms=SUNCOURT_ROOMS, geo=SUNCOURT, page="suncourt.html"),
    dict(code="T-17", name="The links", rooms=LINK_ROOMS, geo=None, page="links.html"),
]

# the pages of ttmath/plan/, for the navigation bar of campus_plan.py and campus_buildings.py
PLAN_NAV = [("index.html", "The plan"), ("buildings.html", "The buildings")] + [(b, c) for b, c in (
    ("courtyard.html", "T-04"), ("crescent.html", "T-06"), ("infinity.html", "T-07"), ("greenhouse.html", "T-08"), ("garden.html", "T-09"),
    ("observatory.html", "T-10"), ("sports.html", "T-11"), ("hangar.html", "T-12"), ("pods.html", "T-14, T-15"), ("suncourt.html", "T-16"),
    ("links.html", "T-17"))] + [("rover.html", "The rover")]
