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
                 airlock=dict(s0=77.7, s1=84.0, w=7.0, h=3.2), podstop=dict(lat=-18.5, rad=74.5, r=4.0, heading=180.0))       # left of the avenue, nose to the start (the old design; since v0.19 the pod docks at POD_DOCK)
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
    "T06-07": [("strelitzia", "side1"), ("pothos", "shelf")],
    "T06-08": [("maple", "window0"), ("monstera", "window1"), ("strelitzia", "corner1")],
    "T06-09": [("ficus", "window0"), ("kentia", "window1"), ("fern", "corner0"), ("pothos", "shelf")],
    "T06-10": [("fig", "window0"), ("anthurium", "desk"), ("croton", "corner1")],
    "T06-11": [("snake", "window1"), ("bromeliad", "desk"), ("pothos", "shelf")],
    "T06-12": [("olive", "window0"), ("olive", "window1"), ("croton", "corner0"), ("strelitzia", "corner1")],
    "T06-13": [("monstera", "window0"), ("maple", "window1"), ("fern", "corner1"), ("orchid", "desk")],
    "T06-14": [("kentia", "side1"), ("pothos", "shelf")],
}

# the Ring's other rooms, each with its own plants (Jim, 4 Oct 2026: "it should includes all kinds of plants, different
# colors like maple leaves"); the Crescent's rooms keep theirs (CRESCENT_PLANTS)
RING_PLANTS = dict(CRESCENT_PLANTS, **{
    "T06-19": [("olive", "window0"), ("croton", "window1"), ("orchid", "desk"), ("snake", "door")],
    "T06-20": [("strelitzia", "window0"), ("fig", "windowmid"), ("anthurium", "desk"), ("fern", "corner1")],
    "T06-21": [("kentia", "side0"), ("bromeliad", "door")],
    "T06-22": [("monstera", "side1"), ("pothos", "shelf")],
    "T06-23": [("ficus", "window0"), ("agave", "window1"), ("orchid", "desk"), ("pothos", "shelf")],
    "T06-24": [("maple", "window0"), ("kentia", "window1"), ("anthurium", "desk")],
    "T06-25": [("fig", "window0"), ("monstera", "side1"), ("fern", "corner0"), ("pothos", "desk")],
    "T06-26": [("strelitzia", "window0"), ("olive", "window1"), ("croton", "corner1")],
    "T06-27": [("maple", "window0"), ("maple", "window1"), ("agave", "corner0"), ("strelitzia", "corner1"), ("kentia", "windowmid")],   # low by the screens' wall
    "T06-28": [("snake", "window1")],
    "T06-29": [("ficus", "window0"), ("agave", "window1")],
    "T06-30": [("kentia", "window0"), ("bromeliad", "corner1")],
    "T06-31": [("fig", "side1"), ("pothos", "shelf")],
    "T06-32": [("fern", "window0"), ("orchid", "desk")],
    "T06-33": [("monstera", "corner0")],
    "T06-35": [("kentia", "corner0"), ("monstera", "corner1")],
    "T06-36": [],   # a working kitchen: no pots on its floor
    "T06-37": [("olive", "window0"), ("fig", "windowmid"), ("olive", "window1"), ("strelitzia", "corner1")],
    "T06-38": [("monstera", "window0"), ("maple", "window1"), ("anthurium", "desk"), ("croton", "corner0")],
    "T06-39": [("kentia", "window0"), ("kentia", "window1"), ("croton", "corner0")],
    "T06-40": [("bromeliad", "window0"), ("agave", "window1"), ("orchid", "desk")],
    "T06-41": [("fig", "window1"), ("fern", "side1")],
    "T06-42": [("orchid", "desk"), ("snake", "window1")],
})

# Finding the way along the Ring's corridors (v0.17). Jim, 5 Oct 2026: "each area esp classroom should have room number so
# students know which room they should go"; 6 Oct 2026: "please continue to improve/bugfix/continue for the walking
# experience and real life experience". Blade signs hang across the corridors at these angles, each face listing the
# room numbers ahead of you that way up to the next sign (and the stairs and halls); a lit green exit sign over each
# stair's door on both floors.
RING_SIGNS = dict(upper=(-42, -20, 20, 42, 70, 95, 120, 146), lower=(-42, -20, 20, 42, 70, 95, 120, 146, 205, 228, 252, 276, 295))
# The corridors' prints: on the lower corridor's long back wall (the retaining wall against the garden ring's soil), a
# walk of framed prints of mathematics, each facing a room and showing what it is named for or used for; at the upper
# corridor's two blind ends a print over a bench. Each print 1.8 by 1.2 m in a walnut frame with a brass picture light.
# Benches where people wait (outside the competition room, the classrooms, the music room and the clinic), each with a
# plant chosen for the corridor's light, all different: downstairs, with no daylight, ones that live in low light (the
# small ones on a walnut plinth); at the upper ends, by the garden glass, a fig and a bird of paradise. a: the angle
# (degrees); faces: the room across the corridor.
RING_ART = [
    dict(a=-34.0, floor="lower", faces="T06-13", subject="knight", title="The knight's tour", note="a knight visits every square of the board once and comes home"),
    dict(a=-13.0, floor="lower", faces="T06-12", subject="partitions", title="The partitions of 6", note="eleven ways to break six into parts, the counting Ramanujan and Hardy solved", bench=1.8, plant=("anthurium", 1)),
    dict(a=13.0, floor="lower", faces="T06-09", subject="pascal", title="Pascal's triangle, odd numbers marked", note="the odd entries draw Sierpinski's triangle"),
    dict(a=34.0, floor="lower", faces="T06-10", subject="galton", title="The Galton board", note="balls bouncing left or right pile up into Gauss's bell curve", bench=1.8, plant=("snake", -1)),
    dict(a=47.5, floor="lower", faces="T06-11", subject="turing", title="A Turing pattern", note="two chemicals reacting and spreading make stripes and spots, as Turing showed"),
    dict(a=63.0, floor="lower", faces="T06-29", subject="cannon", title="Newton's cannon", note="fire fast enough from a mountain and the ball falls round the Earth for ever", bench=1.8, plant=("fern", 1)),
    dict(a=85.0, floor="lower", faces="T06-30", subject="hilbert", title="The Hilbert curve", note="one path that passes through every cell of the square"),
    dict(a=111.0, floor="lower", faces="T06-32", subject="kepler", title="Kepler's second law", note="a planet sweeps equal areas in equal times", bench=1.8, plant=("bromeliad", -1)),
    dict(a=133.0, floor="lower", faces="T06-33", subject="sunflower", title="The golden angle", note="seeds set 137.5 degrees apart pack a sunflower's head"),
    dict(a=157.0, floor="lower", faces="T06-34", subject="solids", title="The five Platonic solids", note="the only solids with equal regular faces and equal corners"),
    dict(a=196.0, floor="lower", faces="T06-36", subject="buffon", title="Buffon's needle", note="drop needles on lines: the share that cross tells you pi"),
    dict(a=214.0, floor="lower", faces="T06-37", subject="penrose", title="A Penrose tiling", note="two rhombs tile the floor for ever and never repeat"),
    dict(a=286.0, floor="lower", faces="T06-41", subject="harmonics", title="The harmonics of a string", note="a string vibrates in halves, thirds, quarters: the notes of music", bench=1.8, plant=("kentia", 1)),
    dict(a=300.5, floor="lower", faces="T06-42", subject="cardioid", title="Times two round a circle", note="join each of 200 points to its double and a heart appears", bench=1.8, plant=("monstera", -1)),
    dict(a=-57.0, floor="upper", end=1, subject="mandel", title="The Mandelbrot set", note="the points that stay near home under z to z squared plus c", bench=1.8, plant=("fig", 1)),
    dict(a=197.0, floor="upper", end=-1, subject="golden", title="The golden rectangle", note="squares of the Fibonacci numbers and the spiral through them", bench=1.8, plant=("strelitzia", 1)),
    # in the rooms (v0.20): on a room's back or front wall (a radius), r the picture's middle, w its width, y its middle's height
    dict(room="T06-26", wall="back", r=54.45, y=1.75, w=1.2, floor="upper", subject="harmonograph", title="Two pendulums", note="a pen hung from two swinging pendulums draws a figure that dies away"),
    dict(room="T06-26", wall="back", r=55.95, y=1.75, w=1.2, floor="upper", subject="ford", title="Ford circles", note="a circle on every fraction, 1/q squared across: neighbours only ever touch"),
    dict(room="T06-26", wall="front", r=55.2, y=1.85, w=1.8, floor="upper", subject="roses", title="Rose curves", note="r = cos(k theta): petals for every fraction k"),
    dict(room="T06-04", wall="front", r=57.0, y=1.8, w=1.5, floor="upper", subject="voronoi", title="Voronoi cells", note="every point of the plane belongs to the seed nearest to it"),
    dict(room="T06-37", wall="front", r=55.2, y=1.95, w=2.6, floor="lower", subject="pidigits", title="The first thousand digits of pi", note="each digit its own colour: the pattern never repeats"),
    dict(room="T06-29", wall="back", r=57.2, y=1.85, w=1.8, floor="lower", subject="spectrum", title="The electromagnetic spectrum", note="light is one narrow band of a range that runs from radio waves to gamma rays"),
    dict(room="T06-42", wall="front", r=59.1, y=1.7, w=1.4, floor="lower", subject="lissajous", title="Lissajous figures", note="a point swinging two ways at once, in the ratio of two whole numbers"),
]
# The classrooms' pinboards (v0.23): a cork board 2.8 by 1.4 m in an oak frame on each classroom's back wall (solid wall,
# never a window): the room's classes this week (from the timetable), a problem of the week for its mathematician, a
# pupil's copy of a diagram (subject: the prints' drawings), the next contest's flyer and a marked quiz. Over each board a
# wall clock whose hands keep the visitor's own time.
RING_PINS = [
    dict(room="T06-02", subject="solids", caption="The five Platonic solids, by Grade 8",
         problem="Construct a regular hexagon with only a compass and a straightedge. Why does the compass, opened to the radius, step round the circle exactly six times?"),
    dict(room="T06-03", subject="cardioid", caption="Times two round a circle, by Grade 10",
         problem="The parabola y = x² − 5x + 6 crosses the x-axis twice. Where? And where is its lowest point?"),
    dict(room="T06-19", subject="cannon", caption="Newton's cannon, by Grade 11",
         problem="A plank 3 m long balances on a pivot 1 m from one end, where a 60 kg student sits. How heavy is the friend on the long end?"),
    dict(room="T06-20", subject="harmonics", caption="A string's harmonics, by Grade 7",
         problem="Find every right triangle with whole-number sides that has a side of length 12."),
    dict(room="T06-06", subject="penrose", caption="A Penrose tiling, by Grade 12",
         problem="In how many ways can you colour the six faces of a cube black or white, if two colourings that differ only by a turn count as one?"),
    dict(room="T06-05", subject="sunflower", caption="The golden angle, by Grade 6",
         problem="Show that every third Fibonacci number is even: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 …"),
    dict(room="T06-10", subject="galton", caption="The Galton board, by Grade 11",
         problem="Add 1 + 2 + 3 + … + 200 in your head, the way Gauss did when he was nine."),
]
# Notice boards (v0.18): cork in an aluminium frame on the lower corridor's back wall, 2.4 by 1.2 m, flyers pinned on
# them. By the competition room, the contests (from campus_contests.py: each contest, when, its grades, the deadlines,
# room 139); under the Gate Hall, by the stair everyone takes, the clubs and events the rooms are planned for (each
# room's "also" above, with its number). a: the angle (degrees).
RING_BOARDS = [
    dict(a=-29.0, floor="lower", topic="contests", title="Contests this term"),
    dict(a=177.5, floor="lower", topic="clubs", title="Clubs and events",
         rooms=("T06-23", "T06-38", "T06-12", "T06-41", "T06-32", "T06-19", "T06-33", "T06-30", "T06-02", "T06-24", "T06-13", "T06-01", "T06-27")),
]
# Bottle fillers (v0.18): a stainless steel filler and fountain on the corridor wall beside each washroom's door.
RING_FOUNTAINS = ["T06-14", "T06-31", "T06-22"]

# ------------------------------------------------------------------------------------------------- T-06 the Ring
# Jim, 5 Oct 2026: "why classroom building are half? please build the circle around the dome, like apple headquarter
# building"; "the entrance is not sealed by dome. it needs to. overall I like this structure similar like apple
# headerqueate but much more future proof and impressive than it". The Crescent grows into the Ring: one building all the
# way round the Math Palace between radii 46 and 62 m (340 m round its middle), the garden ring between it and the dome,
# all of it sealed. The two wings stand where the Ring passes, so their rooms move into it (RING_MOVES) and the wings come
# down; the courtyard becomes the entrance plaza under a glass dome (ENTRANCE) and the Gate Hall through the Ring.
# The Ring is set into the crater's slope and stays out of sight from the start, like the whole campus (you discover it
# from the ridge): two storeys behind and beside the dome, where the ground falls to the plain; a lower roof over the
# upper floor on the right-front, where the hill rises; the Gate Hall two storeys tall at the front; and on the left-front
# quarter, where the start looks down through a dip in the ridge, only the lower floor, its roof at ground level with
# skylights, beside the sunken grove. Its roof rises and falls with the hill all the way round.
# Future-proof: 36 bays of 10 degrees on one steel frame with the same facade panels, so a bay can change its use; the
# roof holds a metre of water in sealed cells (a shield against cosmic rays, and the campus's water store); the lower
# floor's ring corridor carries the air, water and power all the way round; the frame over the back half is sized for a
# third storey. Angles here run past 180 so that a section can cross the front: 191 is -169.
# Sections: where each kind stands and the roof's top above the upper floor (m); where the hill rises, the roof slopes down
# toward it, from roof on the garden side to roof_out on the outside. The line of sight sets them (campus_plan).
RING = dict(r0=46.0, r1=62.0, rc=49.6, floor_h=5.6, upper=0.0, lower=-5.6, ceil=4.5, ceil_corridor=3.8, bay=10.0,
            sections=[dict(a=(-57.0, 120.0), kind="two", roof=5.95, note="two storeys: the ground falls to the plain"),
                      dict(a=(120.0, 164.0), kind="low", roof=5.5, roof_out=4.3, ceil_upper=4.9, ceil_out=3.7, note="the hill rises: the upper floor's roof slopes down toward it; the lower floor underground"),
                      dict(a=(164.0, 191.0), kind="gate", roof=6.8, note="the Gate Hall, two storeys tall"),
                      dict(a=(191.0, 197.0), kind="low", roof=5.5, roof_out=4.3, ceil_upper=4.9, ceil_out=3.7, note="lockers, washrooms and a stair by the gate"),
                      dict(a=(197.0, 303.0), kind="sunk", roof=-0.45, note="only the lower floor, its roof at ground level with skylights")],
            gallery=dict(r0=62.0, r1=68.5, a=(-52.0, 120.0), wall=1.2),
            upper_corridor=(-57.0, 197.0), lower_corridor=(-180.0, 180.0),
            # the hall's stair and lift (as in the Crescent); the stair-and-lift bays (T06-16, T06-18): two flights of 16
            # risers and a half landing along the bay, the lift at its outer end; in the sunk quarter the lower corridor
            # runs along the outer wall from cw outward, with crossings at both ends; the Gate Hall's doors
            stair=dict(a=3.6, r0=51.0, r1=60.6, w=3.0, n=32, landing=(55.2, 56.4)), lift=(49.8, -4.6),
            # the stair bays, redesigned (Jim, 7 Oct 2026: "stairs are not designed well and have bugs": the door opened onto a
            # 1.3 m landing facing the wall between the flights): a landing 1.8 m deep inside the doors on both floors, two
            # flights side by side wall to wall (16 risers each, treads 0.28) with an open well 0.3 m wide between them behind
            # glass, out to a half landing 1.5 m deep; past it, the floor below runs on under the half landing to the bay's
            # outer end, two storeys tall (the gallery's glass at the east bay), a bench there
            bay_stair=dict(n=32, run=0.28, landing=1.8, half=1.5, gap=0.3), cw=58.4, skylight=dict(every=10.0, w=2.0, l=6.0),
            gate=dict(inner_doors=(173.0, 180.0, 187.0), outer_doors=(180.0,)))
RING_ROOMS = [
    # upper floor, level with the palace's balcony and the garden ring (the Crescent's rooms stay where they are)
    dict(code="T06-01", name="Hall and stair", floor="upper", a=(-7, 7), kind="move", double=True, use="The way in from the garden ring and down to the garden gallery: a hall two storeys tall with a wide stair and a lift, the timetable on a screen, two long benches by the garden glass; its two tall side walls lined from the lower floor to the ceiling with oak slats on dark felt, warm to look at and quiet to hear.", also="Exhibitions of students' work."),
    dict(code="T06-02", name="Euclid", floor="upper", a=(7, 25), kind="class", use="Classroom for geometry: 30 seats at double desks, a whiteboard wall, compasses and models of the solids.", also="Evening classes for adults."),
    dict(code="T06-03", name="Hypatia", floor="upper", a=(25, 43), kind="class", use="Classroom for algebra and measurement: 30 seats, two whiteboards, a demonstration bench.", also=""),
    dict(code="T06-04", name="Teachers' room", floor="upper", a=(43, 52), kind="staff", short="Teachers", use="Desks for the teachers, a meeting table, a kitchenette, lockers and a long sofa.", also="Marking and lesson planning."),
    dict(code="T06-18", name="East stair and lift", floor="both", a=(52, 58), kind="move", short="Stair", use="A stair and a lift between the floors in the room band, behind fire doors; the corridors pass by.", also=""),
    dict(code="T06-19", name="Archimedes", floor="upper", a=(58, 76), kind="class", use="Classroom for mechanics: 30 seats, a demonstration bench with levers, pulleys and a balance.", also="Science fair."),
    dict(code="T06-20", name="Pythagoras", floor="upper", a=(76, 93), kind="class", use="The wing's M1 Mathematics moves here: 30 seats, a long whiteboard, the proof of Pythagoras in tiles on the wall.", also="Exams."),
    dict(code="T06-21", name="Pod lounge", floor="upper", a=(93, 100), kind="lounge", short="Pods", use="The glass bridge to the pod dock starts here, through a sliding door in the outer glass: long benches by the glass either side of it, a screen with the pods' places and charge on the wall by the corridor's door, a coat rack.", also=""),
    dict(code="T06-22", name="Washrooms", floor="upper", a=(100, 106), kind="service", short="WC", use="Washrooms for the right side of the upper floor.", also=""),
    dict(code="T06-23", name="Lovelace", floor="upper", a=(106, 120), kind="lab", use="The wing's coding lab moves here: 20 workstations with two screens each, a big screen for the teacher.", also="Robotics club."),
    dict(code="T06-24", name="Socrates", floor="upper", a=(120, 134), kind="seminar", use="The wing's seminar room: one long table for 20, a screen and a whiteboard, under the roof that slopes down toward the hill (ceiling 4.9 to 3.7 m).", also="Parents' evenings."),
    dict(code="T06-25", name="Library", floor="upper", a=(134, 152), kind="library", use="The wing's library: shelves along the outer wall, reading tables by the glass onto the garden ring, the librarian's desk, under a sloping ceiling (4.9 to 3.7 m).", also=""),
    dict(code="T06-26", name="Reading room", floor="upper", a=(152, 164), kind="reading", use="The wing's reading room: deep armchairs and long sofas by the garden glass, lamps, a quiet room, under a sloping ceiling.", also=""),
    dict(code="T06-27", name="Gate Hall", floor="gate", a=(164, 191), kind="gate", use="The way in, two storeys tall: from the entrance dome through the Ring into the garden ring and on to the palace's door; the reception desk, the Fall timetable on a wall of screens with every class's room, a wide stair down to the lower corridor and a glass lift, benches and tall plants.", also="Welcome days, the graduation reception."),
    dict(code="T06-28", name="Lockers", floor="upper", a=(191, 197), kind="service", short="Lockers", use="Lockers and washrooms by the Gate Hall, whose stair goes down to the dining hall and the café on the lower floor.", also=""),
    dict(code="T06-16", name="West stair and lift", floor="both", a=(-57, -52), kind="move", short="Stair", use="A stair and a lift where the upper floor ends on the west: down to the lower floor that goes on all the way round.", also=""),
    dict(code="T06-07", name="Washrooms", floor="upper", a=(-52, -43), kind="service", short="WC", use="Washrooms for the upper floor, above the lower ones; a cleaner's cupboard.", also=""),
    dict(code="T06-06", name="Noether", floor="upper", a=(-43, -25), kind="class", use="Classroom for symmetry and abstract algebra: 30 seats, a wall of tilings.", also=""),
    dict(code="T06-05", name="Fibonacci", floor="upper", a=(-25, -7), kind="class", use="Classroom for number patterns: 30 seats, a wall of sequences and spirals.", also=""),
    dict(code="T06-CU", name="Upper corridor", floor="upper", a=(-57, 197), band="corridor", kind="move", use="Along the garden side behind glass, from the west stair round the back and the right, through the Gate Hall to the stair down by the gate.", also=""),
    # lower floor, all the way round: the garden gallery behind and on the right, underground on the right-front, the
    # sunken grove's side on the left
    dict(code="T06-08", name="Lower hall", floor="lower", a=(-7, 7), kind="move", use="Under the hall's gallery: glass doors out to the garden gallery and the garden domes; by the glass a seating group on a rug: two long sofas facing over a low table, an armchair at each end, a fig and a kentia palm beside it.", also="Parents wait here; small talks after class."),
    dict(code="T06-09", name="Study hall", floor="lower", a=(7, 27), kind="study", use="A quiet room for homework: 40 carrels with lamps, a librarian's desk, shelves along the corridor wall.", also="Exam room."),
    dict(code="T06-10", name="Gauss", floor="lower", a=(27, 41), kind="class", use="Classroom for statistics and data: 24 seats at tables with screens.", also=""),
    dict(code="T06-11", name="Turing", floor="lower", a=(41, 52), kind="lab", short="Turing", use="Computer classroom: 16 workstations for coding and modelling.", also=""),
    dict(code="T06-29", name="Newton", floor="lower", a=(58, 76), kind="physics", use="The physics lab: six benches with gas, power and water, a vacuum chamber, a pendulum hanging from the ceiling, glass onto the garden gallery.", also=""),
    dict(code="T06-30", name="Maker space", floor="lower", a=(76, 94), kind="maker", use="Workbenches, 3D printers, a laser cutter and the robot rovers the students build; a roller door to the gallery.", also="Robotics contests."),
    dict(code="T06-31", name="Washrooms", floor="lower", a=(94, 106), kind="service", short="WC", use="Washrooms for the right side of the lower floor, under the upper ones.", also=""),
    dict(code="T06-32", name="Kepler", floor="lower", a=(106, 120), kind="astro", use="The astronomy room: 24 seats under a small dome screen that shows the sky from anywhere, star maps, a model of the solar system.", also="Planetarium shows for families."),
    dict(code="T06-33", name="Life support", floor="lower", a=(120, 150), kind="plant", short="Air and water", use="The campus's air, water and heat: CO2 scrubbers, oxygen from water, water recycling and the heat pumps, behind a glass wall so classes can watch them work.", also="Lessons on how Mars air and water are made."),
    dict(code="T06-34", name="Store and archive", floor="lower", a=(150, 164), kind="store", short="Store", use="Spare furniture, teaching kit, the archive of exam papers.", also=""),
    dict(code="T06-35", name="Under the gate", floor="lower", a=(164, 191), kind="move", use="The lower corridor passes under the Gate Hall; a stair up into it, washrooms.", also=""),
    dict(code="T06-36", name="Kitchen", floor="lower", a=(191, 203), kind="kitchen", use="The kitchen and the servery for the dining hall, with its stores and the goods lift.", also=""),
    dict(code="T06-37", name="Dining hall", floor="lower", a=(203, 224), kind="dining", use="Lunch for 120 at long tables under skylights; its far end opens onto the sunken grove.", also="Parties, exams."),
    dict(code="T06-38", name="Café", floor="lower", a=(224, 242), kind="cafe", use="The wing's café moves here: the espresso bar, the chalk menu, tables and long sofas, glass onto the sunken grove.", also="Chess and coffee after school."),
    dict(code="T06-39", name="Assembly hall", floor="lower", a=(242, 266), kind="assembly", use="A flat hall for 150 with a low stage, glass onto the sunken grove: assemblies, plays, dance.", also="Exams, the science fair."),
    dict(code="T06-40", name="Art studio", floor="lower", a=(266, 280), kind="art", use="Easels, a long sink, a kiln, glass onto the sunken grove.", also=""),
    dict(code="T06-41", name="Music room", floor="lower", a=(280, 292), kind="music", use="A grand piano, practice booths, instruments on the walls, under skylights.", also="The choir."),
    dict(code="T06-42", name="Clinic and counsellor", floor="lower", a=(292, 303), kind="clinic", short="Clinic", use="The nurse's room with a bed, the counsellor's quiet room, under skylights.", also=""),
    dict(code="T06-14", name="Washrooms and store", floor="lower", a=(-52, -41), kind="service", short="WC, store", use="Washrooms for the lower floor and a store for chairs and teaching kit.", also=""),
    dict(code="T06-13", name="Games room and lounge", floor="lower", a=(-41, -27), kind="games", use="Chess, Go, puzzles and math games at tables, shelves of games, a Rubik's cube wall; long sofas and a coffee machine by the glass onto the garden gallery.", also="Clubs after school."),
    dict(code="T06-12", name="Ramanujan: competition room", floor="lower", a=(-27, -7), kind="compete", short="Ramanujan", use="Math olympiad training and contests: team tables, a scoreboard on the wall, a stage for the problem reader.", also="Chess tournaments."),
    dict(code="T06-CL", name="Lower corridor", floor="lower", a=(-180, 180), band="corridor", kind="move", use="All the way round on the garden side: the Ring's main street, with the air, water and power above its ceiling.", also=""),
    dict(code="T06-15", name="Garden gallery", floor="lower", a=(-52, 120), band="gallery", kind="garden", use="The court along the garden front and the right side, under a sloping glass roof from the Ring's eave to a low stone wall: planters, benches, the doors of the lower rooms; behind the dome it opens into the garden domes.", also=""),
]
# where the wings' rooms go when the wings come down
RING_MOVES = [("M1 Mathematics", "T06-20 Pythagoras"), ("Lobby", "T06-27 Gate Hall"), ("Coding Lab", "T06-23 Lovelace"), ("Seminar Room", "T06-24 Socrates"),
              ("Café", "T06-38 Café"), ("Reception", "T06-27 Gate Hall"), ("Library", "T06-25 Library"), ("Reading Room", "T06-26 Reading room")]

# Room numbers (Jim, 5 Oct 2026: "each area esp classroom should have room number so students know which room they
# should go"). Three digits: the first is the floor, 2 upstairs (the floor you come in on, level with the palace and the
# garden ring), 1 downstairs (the garden level); the last two say where the room stands, counting up in steps of 5
# degrees of the Ring as you walk to the right from the Gate Hall, all the way round. So the numbers rise one way round
# the Ring, a room upstairs has the number of the room under it plus 100, and a bay can change its use and keep its
# number. Halls, corridors and stairs have names, not numbers. The wings' rooms already carry the numbers of the rooms
# they move to (WING_NOS), so a class keeps its room number when the wings come down.
def room_no(rm):
    if rm.get("band") or rm["kind"] in ("move", "gate") or rm["floor"] not in ("upper", "lower"): return None
    mid = (rm["a"][0] + rm["a"][1]) / 2.0
    return (200 if rm["floor"] == "upper" else 100) + int(((180.0 - mid) % 360.0) / 5.0 + 0.5)
for _rm in RING_ROOMS: _rm["no"] = room_no(_rm)
RING_NOS = {rm["code"]: rm["no"] for rm in RING_ROOMS if rm["no"]}
assert len(set(RING_NOS.values())) == len(RING_NOS), "two rooms share a number"
for _rm in CRESCENT_ROOMS: _rm["no"] = RING_NOS.get(_rm["code"]) if room_no(_rm) else None
# the wings' rooms today (by their kind in the demo) and the Ring's rooms they move to
WING_MOVES = dict(math="T06-20", lab="T06-23", seminar="T06-24", cafe="T06-38", library="T06-25", study="T06-26")
WING_NOS = {k: [RING_NOS[c], [rm for rm in RING_ROOMS if rm["code"] == c][0]["name"]] for k, c in WING_MOVES.items()}

# The way in, until the Ring's front is built (Jim, 5 Oct 2026: "the side stairs are connected from outside, not in the
# dome seal. also this stairs are not designed well"): the wings' glass doors onto the open courtyard close for good, so
# no stair and no door of the campus opens to the air; the one way in is the palace's front vault, which becomes an
# airlock: outer sliding doors at its mouth and inner ones 2.5 m in, in glass walls that close the vault's arch, never
# open together. The welcome panels stand in the chamber; past the inner doors the Fall timetable fills a screen on each
# wall (campus_timetable.py), with the room numbers. The wings are reached through the palace and the glass links; the
# right link's stair is rebuilt to a proper rise and going (risers about 15 cm, treads 30 cm) with handrails on both
# sides, lit treads and landings at both ends.
VAULT_LOCK = dict(outer=34.0, inner=31.5, door_w=2.4, door_h=2.62, boards=dict(r0=28.5, r1=31.3, lat=3.72, y0=0.7, h=1.6))
LINK_STAIR = dict(riser=0.16, tread=0.30, landing=1.2, rail=0.9)

# the garden ring between the dome and the Ring, sealed all round: at the palace's level under a glass vault whose crown
# follows the line of sight (m above the palace's floor, by angle), except where the start looks down through the dip in
# the ridge: there it steps down into the sunken grove at the lower floor's level, under flat glass at ground level
# The vault springs from the dome's own glass at spring m up (lower where the line of sight is low: never more than
# crown - 1), so the dome rises out of a glass garden and the palace's tall front door stands under the vault.
GARDEN_RING = dict(r0=28.6, r1=46.0, spring=8.2, crown=[(-80, 7.0), (-70, 7.5), (-60, 9.5), (-50, 12.5), (-40, 13.0), (55, 13.0), (65, 11.0), (75, 10.3), (85, 9.0),
                                           (95, 7.8), (105, 6.8), (115, 6.3), (125, 6.2), (135, 6.6), (145, 7.4), (155, 8.2), (165, 9.8), (195, 9.4),
                                           (200, 8.2), (207, 6.2), (214, 5.2), (224, 5.2)],
                   grove=dict(a=(224.0, 280.0), floor=-5.6, roof=1.0), sundial=dict(a=150.0, r=38.0))
GARDEN_RING_AREAS = [
    dict(code="T09-01", name="Garden ring", kind="garden", use="The garden all the way round the dome at the palace's level, under a glass vault on bronze ribs from the dome's foot to the Ring's eave: olive trees, red maples, palms, ferns and flowering beds along a path round the dome, benches; the armillary sundial at the front right.", also="Walks between classes, open-air lessons."),
    dict(code="T09-06", name="Sunken grove", kind="garden", use="On the left, the garden steps down 5.6 m into a grove at the lower floor's level under flat glass at ground level: tall trees with room to grow, a pond, stairs down at both ends; the café, the dining hall, the assembly hall and the art studio open onto it.", also="Lunch outside, concerts."),
]

# the entrance: the old courtyard becomes a plaza under a shallow glass dome in front of the Gate Hall, the airlock at its
# front; its height stays under the line of sight from the start
# The dome stands 2.4 m into the Ring's front, so its glass lands on the Gate Hall's facade along an arch 13.7 m wide
# (a dome only touching the Ring would leave the joint open); the airlock's inner end stands inside the dome's edge.
ENTRANCE = dict(c=(0.0, 71.0), r=11.6, h=6.8, drum=3.0, airlock=dict(s0=81.6, s1=86.6, w=6.0, h=2.6))   # a glass drum 3 m tall, a cap to 6.8 m
ENTRANCE_ROOMS = [
    dict(code="T04-01", name="Entrance dome", kind="move", use="The plaza in front of the Gate Hall under a glass dome 23 m across: an upright glass drum 3 m tall on a stone curb, a shallow cap on a ring beam to 6.8 m, on a bronze lattice, its back on the Ring's front; the airlock comes in through a framed doorway in the drum: paving, the campus's name on a stone wall, planters with young trees, benches.", also="Arrivals and farewells, the graduation photo."),
    dict(code="T04-02", name="Entrance airlock", kind="move", use="At the dome's front: outer and inner sliding glass doors with a chamber 5 m long between them, never open together; suit lockers and a bench.", also=""),
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

# The pods (Jim, 5 Oct 2026: "add some flying pod I can take and can drive the flying pod to see the eagle view"; then "it
# is like drone, but on mars air is so little and can hardly support flying pod. borrow the same idea from Jim's
# retirement home use anti gravity technology (not 5 anti gravity drives but with some cool shape)"; "the flying pod looks
# not real. please improve"). Version 2: no rotors and no thrust. The drive is a halo, a flat elliptical ring round the
# cabin's waist on two swept pylons, whose field pushes against the ground like the Crown's drives at Arcadia and steers by
# leaning; it glows faintly underneath and stirs the dust when the pod is low. The cabin is a teardrop of pearl-white
# composite under a one-piece tinted canopy, two seats side by side with the pilot on the right as in a helicopter, chin
# windows at the feet, the door on the right. A pod never needs flat ground and never touches a roof: set down, it floats
# level 0.45 m over the ground or its dock (hover), and you step out on its right. Up to 400 m and 40 m/s.
POD = dict(length=5.6, width=2.3, height=1.95, halo=dict(rx=3.2, rz=1.9, w=0.34, t=0.11, y=0.8), hover=0.45,
           top_speed=40.0, climb=8.0, ceiling=400.0, min_clear=1.2)
# The pod dock (Jim: "the parking is too close to the building. need special parking so that when parked, there is
# connection so people can go directly into the building"): a round deck off the Ring's right side, clear of everything
# for the approach; LAND near it and the pod settles onto the docking spot side-on, its canopy toward the bridge, the
# collar runs out and seals, and you walk through the glass bridge (T17-02) into the pod lounge (T06-21). The deck lies
# deck_y below the upper floor (v0.19), so that a pod floating over it has its canopy's sill level with the bridge's floor
# and the collar (up to collar m long) runs out over the pod's halo to the canopy. It replaces the pod stop by the airlock.
POD_DOCK = dict(a=96.5, r=75.0, deck_r=6.5, spot_r=71.6, bridge=(62.0, 68.5), w=2.6, h=2.7, deck_y=-1.35, collar=1.25)
POD_DOCK_ROOMS = [dict(code="T04-03", name="Pod dock", kind="pad", use="A round deck 13 m across off the Ring's right side, 1.35 m below the upper floor and just clear of the ground on short steel legs, a ring of lights round its edge: a pod settles side-on onto its docking spot with its canopy's sill level with the glass bridge, the collar runs out over its halo to the canopy, and you walk straight into the Ring's pod lounge.", also="")]

# ------------------------------------------------------------------------------------------------- T-16 Sun court
# Where the solar field stood, behind the classroom wing. The campus has no power plant of its own: it is on the grid of
# the city nearby (Jim, 4 Oct 2026: "no need for plant generators, since the power is supplied centrally by the city
# close by. free the space up for other purposes"). Kept low: here the ground hides no more than about 4 m. An
# armillary sundial, because Gale crater is almost on the equator, where a dial drawn flat on the ground fails.
# Sealed (Jim, 5 Oct 2026): the court is sunk to the lobby's floor and covered by a low glass vault, whose crown stays
# under the line of sight; the sun still reaches the dial through the glass. Heights here are absolute (the palace
# frame's y). With the Ring (T-06), whose library stands on this spot, the sundial and its benches move into the garden
# ring at the front right (GARDEN_RING's sundial), under the glass vault, where the sun still reaches it.
SUNCOURT = dict(lat=27.0, rad=47.5, w=12.0, d=19.0, sphere=2.2, plinth=0.6, benches=5, floor=0.0, crown=4.4, spring=1.6)
SUNCOURT_ROOMS = [
    dict(code="T16-01", name="Armillary sundial", kind="garden", use="A bronze armillary sphere 2.2 m across on a stone plinth, its rod parallel to Mars's axis; the hour ring shows the sol's 24 Mars hours (each 1 h 2 min long).", also="Lessons on angles, time and orbits."),
    dict(code="T16-02", name="Sun classroom", kind="garden", use="Five long stone benches with cushions in a half-circle facing the sundial, on basalt paving, in the garden ring under its glass vault.", also="A quiet seat in the morning sun."),
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
    dict(code="T09-02", name="Upper garden dome", kind="garden", use="Under the first glass dome, level with the Ring's lower floor: lawns and flower beds on the golden spiral, the Klein bottle and the trefoil knot, a café kiosk.", also="Lessons outdoors, as it feels."),
    dict(code="T09-03", name="Spiral garden dome", kind="garden", use="Under the middle dome, a step lower: the golden spiral path through ferns, grasses and flowering shrubs, the Möbius bench, a pool.", also=""),
    dict(code="T09-05", name="Lower garden dome", kind="garden", use="Under the lowest and tallest dome: fruit trees and tall palms, the stellated dodecahedron, the plaza at the observatory's door.", also="Concerts and the graduation party."),
    dict(code="T09-04", name="Palace back door", kind="move", use="A glass vestibule at the back of the dome, from the balcony into the garden ring.", also=""),
]

# ------------------------------------------------------------------------------------------------- T-17 the links
# Sealed galleries joining every building to the next, so you go everywhere in shirt sleeves: a concrete trough half sunk
# in the ground and banked with regolith on the outside (shade and shielding), a glass vault on steel ribs above it.
# From and to are points in the palace frame; w is the clear width, h the height inside at the crown.
LINKS = [
    dict(code="T17-02", name="Pod dock bridge", a=(61.6, 7.02), b=(68.06, 7.75), w=2.6, h=2.7, use="A glass bridge from the Ring's pod lounge over the garden gallery to the pod dock, and the docking collar that runs out to a pod's door."),
    dict(code="T17-03", name="Infinity link", a=(-22.0, -91.0), b=(-38.5, -92.0), w=4.0, h=3.4, use="From the upper garden dome to Infinity Hall's foyer."),
    dict(code="T17-04", name="Greenhouse link", a=(22.0, -88.0), b=(48.0, -88.0), w=4.0, h=3.4, use="From the upper garden dome to the Garden of Primes."),
    dict(code="T17-05", name="Observatory collar", a=(0.0, -161.0), b=(0.0, -163.0), w=5.0, h=3.6, use="From the lowest garden dome into the observatory."),
    dict(code="T17-06", name="Terminal link", a=(9.0, -174.0), b=(17.0, -176.0), w=4.0, h=3.4, use="From the observatory to the pod terminal."),
    dict(code="T17-07", name="Sports link", a=(-60.0, -126.0), b=(-58.5, -141.0), w=4.0, h=3.4, use="From behind Infinity Hall's stage to the sports dome."),
    dict(code="T17-08", name="Hangar link", a=(62.0, -120.0), b=(62.0, -145.0), w=4.0, h=3.4, use="From the far end of the Garden of Primes to the robotics and rover hangar."),
]
LINK_ROOMS = [dict(code=k["code"], name=k["name"], kind="move", use=k["use"], also="") for k in LINKS]

BUILDINGS = [
    dict(code="T-04", name="Entrance dome, airlock and pod dock", rooms=ENTRANCE_ROOMS + POD_DOCK_ROOMS, geo=ENTRANCE, page="ring.html"),
    dict(code="T-06", name="The Ring", rooms=RING_ROOMS, geo=RING, page="ring.html"),
    dict(code="T-07", name="Infinity Hall", rooms=INFINITY_ROOMS, geo=INFINITY, page="infinity.html"),
    dict(code="T-08", name="Garden of Primes", rooms=GREENHOUSE_ROOMS, geo=GREENHOUSE, page="greenhouse.html"),
    dict(code="T-09", name="Garden ring and garden domes", rooms=GARDEN_RING_AREAS + [a for a in GARDEN_AREAS if a["code"] != "T09-01"] + SUNCOURT_ROOMS, geo=None, page="garden.html"),
    dict(code="T-10", name="Observatory", rooms=OBSERVATORY_ROOMS, geo=OBSERVATORY, page="observatory.html"),
    dict(code="T-11", name="Low-gravity Sports Dome", rooms=SPORTS_ROOMS, geo=SPORTS, page="sports.html"),
    dict(code="T-12", name="Robotics and Rover Hangar", rooms=HANGAR_ROOMS, geo=HANGAR, page="hangar.html"),
    dict(code="T-14", name="Pod Port", rooms=PODPORT_ROOMS, geo=PODPORT, page="pods.html"),
    dict(code="T-15", name="Pod terminal", rooms=TERMINAL_ROOMS, geo=TERMINAL, page="pods.html"),
    dict(code="T-17", name="The links", rooms=LINK_ROOMS, geo=None, page="links.html"),
]

# the pages of ttmath/plan/, for the navigation bar of campus_plan.py and campus_buildings.py
PLAN_NAV = [("index.html", "The plan"), ("buildings.html", "The buildings")] + [(b, c) for b, c in (
    ("ring.html", "T-04, T-06"), ("infinity.html", "T-07"), ("greenhouse.html", "T-08"), ("garden.html", "T-09"),
    ("observatory.html", "T-10"), ("sports.html", "T-11"), ("hangar.html", "T-12"), ("pods.html", "T-14, T-15"),
    ("links.html", "T-17"))] + [("schedule.html", "Timetable"), ("contests.html", "Contests"), ("rover.html", "The rover")]
