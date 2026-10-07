"""The furnishing program for the Ring: what each room's furniture is, planned before it is drawn (CLAUDE.md, "Furniture
fits the rooms, and every plant is chosen"; "Design before drawing"). Jim, 7 Oct 2026: "it is almost good. but need more
details. overall it looks cartoon, and furnitures are not designed well to make the campus relaxing and comfortable".

Why it looked like a cartoon: sofas and chairs were boxes with hard edges in mustard, terracotta and royal blue; the big
rooms (about 17 by 12 m) held a few pieces round their edges and a bare floor; the walls were maroon and slate; nothing
cast a shadow on the floor. So: upholstery that is rounded and stuffed (softBox in blk_soft.js: edges and corners
rounded, faces bulging like cushions), pieces made the way real ones are (legs, cushions, pillows, frames), a quiet
palette, light warm walls, a soft shadow under every piece, rugs with borders, lamps that make pools of warm light,
and rooms furnished in groups so that every part of the floor has its use.

The pieces are in ttmath/src/blocks/blk_soft.js (sofa, armchair, ottoman, tableLamp, lampTable, walnutTable, readingTable,
banquette, softBox, shelfBooks, lampLight, the contact shadows), blk_wings.js (officeChair, schoolChair, floorLamp,
bankerLamp) and blk_ringfurnish.js (diningChair). Room codes as campus_rooms.py; the prints in rooms are RING_ART's
entries with a room.
usage: python3 ttmath/tools/campus_furnishing.py   (prints the program)
"""

# the palette: what the upholstery, leather, wood and walls are (the material shader's colours)
PALETTE = dict(
    fabrics={0: "charcoal wool", 1: "ink blue wool", 4: "sage linen", 5: "oatmeal", 6: "linen", 7: "cream boucle",
             8: "olive wool", 9: "rust wool", 10: "warm grey felt", 11: "forest-green velvet", 12: "dusty rose"},
    retired={2: "mustard (now olive)", 3: "terracotta (now rust)"},
    leather={2: "cognac"},
    woods={1: "oak", 2: "walnut"},
    walls={0: "off-white plaster", 1: "warm grey", 4: "linen plaster", 5: "soft sage plaster"},
)

# the catalogue: how each piece is made
PIECES = dict(
    sofa="A low sofa on tapered walnut legs: a base, rounded arms 0.2 m wide, one stuffed seat cushion and one back cushion per seat, "
         "the back cushions leaning back against a frame; throw pillows at the ends (and a third on a long sofa) in a quiet contrast. Seat 0.45 m high, 0.95 m deep.",
    club_chair="A club chair in cognac leather on walnut legs: rounded arms, a stuffed seat, a back leaning back.",
    ottoman="A stuffed ottoman on short walnut legs, in leather or the sofa's fabric.",
    dining_chair="An upholstered chair with arms on walnut legs, its back leaning back: for the café, the dining hall, the games tables.",
    task_chair="A task chair with a stuffed seat and back in warm grey felt on a five-star base: the teachers', the labs', the study hall's.",
    classroom_chair="A moulded shell chair on steel legs with an upholstered seat pad; shells in grey, cream or black, never orange or blue.",
    coffee_table="A low walnut table with rounded corners and a shelf under it; books and a ceramic bowl on it.",
    table_lamp="A turned ceramic base under a linen drum shade, lit from inside.",
    floor_lamp="A brass floor lamp with a fabric shade, by a sofa or a reading chair.",
    rug="A wool rug: a border round a field, a soft mottled pile.",
    banquette="A built-in bench against a wall on an oak plinth set back: a stuffed seat, back cushions leaning on the wall, pillows. Seat 0.45 m high, 0.64 m deep.",
    reading_table="A walnut table with rounded corners on four square legs set in, for eight; green-shaded brass lamps on it.",
    lamp_table="A turned walnut side table with a table lamp on it, at the end of a sofa or between two chairs.",
    bookcase="Walnut, 0.9 m wide and 2.2 m tall, five shelves of books (every bookcase in the Ring has its books).",
    lamplight="Every lamp lights the room round it: floor lamps, table lamps and reading lamps each add a warm pool of light to the bake.",
    carrel="A study carrel: an oak desk between oak sides, a warm grey felt back and inner sides, a shelf of books, a lamp.",
    giant_chess="A giant chess set: pieces of oak and walnut 0.3 to 0.6 m tall, turned, the knights carved, on a board of 40 cm oak and walnut squares on a walnut plinth.",
    shadow="Every piece that stands on a floor sits in its own soft shadow (contact shadows, one mesh for all).",
    wall_clock="A round clock 42 cm across, an aluminium rim, a white face with black marks, black hands and a red second hand that keep the visitor's own time.",
    pinboard="Cork 2.8 by 1.4 m in an oak frame, the sheets pinned on it with coloured pins, a light over it.",
    grand_piano="A grand piano 1.52 by 2.0 m in black lacquer: the case's straight side and its bentside drawn from a real outline, the lid open "
                "on its prop over the treble side, the gold plate with its openings over the spruce soundboard, the strings (the bass ones copper), "
                "88 keys on a felt-lined key slip, a score on the desk, three tapered legs on brass cups and casters, the lyre with three brass pedals, "
                "an adjustable bench with a black leather top.",
    upright_piano="An upright piano in walnut 1.54 m wide, its back to the wall: 88 keys, the toes and consoles, a score on its desk, three brass pedals.",
    ensemble_chair="An ensemble chair 0.56 m wide without arms (for bows and guitars): a stuffed seat and a padded back in ink-blue wool on oak legs.",
    music_stand="A music stand in black steel on a tripod, a score open on its desk.",
    practice_booth="A practice booth on a corridor wall, 2.2 m along it, 2.3 m deep and 2.5 m high: felt walls on an oak frame, an oak roof, "
                   "a glass front with a glazed door and a steel pull, an upright piano and its bench inside, a felt panel over the piano, a glass globe lamp.",
    hung_instruments="Instruments hung on solid wall from oak hangers by their necks: guitars (spruce, dark, black, with their strings), a violin with "
                     "its bow on a peg, a viola, a ukulele; a cello and a double bass stand leaning back on their floor stands.",
    slat_wall="Oak slats 4.5 cm wide every 9 cm on dark felt, 4 cm proud of the wall, with oak edges, top and bottom (as the halls' walls).",
    lab_bench="An island lab bench 2.4 by 1.2 m: oak cupboards both sides on a dark plinth, a black resin top, a grey spine of sockets and gas taps with yellow handles, a sink and a swan-neck tap.",
    lab_stool="A lab stool: a padded seat 0.66 m high and a low padded back on a gas column, a steel foot ring, five feet.",
    foucault_pendulum="A brass bob on a long wire from the ceiling, swinging at the period its length and Mars's gravity give, over a black disc with a brass ring, hour marks and pegs to knock down.",
)

# room by room: seating, tables, lights, finishes; "next" is what the following step adds
ROOMS = {
    "T06-08": dict(name="Lower hall", seating=["two cream boucle sofas 3.8 m facing each other by the garden glass", "two cognac club chairs at the ends"],
                   tables=["a walnut table 1.8 m with books and a bowl between the sofas", "lamp tables at the window sofa's ends"], lights=["the hall's globe pendants", "two table lamps, two floor lamps by the inner sofa"],
                   finishes="oak slat walls on felt, two storeys", rug="rust field, warm grey border, 5.4 by 4.6 m", next=""),
    "T06-21": dict(name="Pod lounge", seating=["two warm grey sofas 2 m by the glass either side of the bridge's door"], tables=["a walnut table with books in front of each sofa"], lights=["linear pendants"],
                   finishes="linen plaster", next=""),
    "T06-26": dict(name="Reading room", seating=["by the outer wall a linen sofa 3.4 m and a forest-green velvet sofa 3.4 m, each facing two cognac club chairs across a walnut table on a rug",
                   "eight warm grey upholstered chairs round the reading table", "an olive banquette 3 m on the back wall between four bookcases", "two cognac club chairs on the front wall, a lamp table between them, two bookcases each side"],
                   tables=["walnut tables with books and a bowl", "a walnut reading table 3.2 m in the middle on an oatmeal rug", "lamp tables at the sofas' ends"],
                   lights=["three table lamps by the sofas, three floor lamps by the chairs, two green-shaded lamps on the reading table, a lamp between the front chairs", "linear pendants"],
                   finishes="linen plaster (was maroon); prints over the banquette (two pendulums, Ford circles) and over the front chairs (rose curves); six bookcases on the corridor wall",
                   layout="d along the room from the back wall (0) to the front (11.7 m), r from the corridor wall (49.6) to the outer wall (62): window groups at d 3.7 and 8.2 (r 58 to 62), "
                          "the reading table at d 5.95, r 54.6, the banquette and its bookcases on the back wall (r 52 to 58.5), the front chairs and bookcases on the front wall, "
                          "the corridor wall's bookcases from d 1 to 6.4; the door at d 8.5 stays clear",
                   next=""),
    "T06-13": dict(name="Games room and lounge", seating=["olive upholstered chairs at the chess tables", "by the glass a warm grey sofa 3 m and an olive sofa 3 m facing each other over a walnut table on a rug, a cognac club chair at each end"],
                   tables=["chess tables", "the walnut table", "lamp tables at the window sofa's ends"], lights=["linear pendants", "two table lamps"],
                   finishes="linen plaster (was terracotta); a wall of Rubik's cube faces; a giant chess set by the glass, a game under way (1 e4 e5 2 Nf3 Nc6 3 Bb5)", next=""),
    "T06-04": dict(name="Teachers' room", seating=["task chairs at the desks and the meeting table", "on the front wall an olive sofa 2.8 m facing two cognac club chairs across a walnut table on a rug"],
                   tables=["desks by the glass", "a meeting table", "the walnut table", "lamp tables at the sofa's ends"], lights=["linear pendants", "two table lamps, a floor lamp by the chairs"],
                   finishes="linen plaster", next=""),
    "T06-38": dict(name="Café", seating=["a long rust banquette along the wall", "upholstered chairs at the tables (olive, oatmeal, ink)", "eight olive and oatmeal chairs at a communal oak table in front of the bar",
                   "past the bar, by the corridor's glass, a warm grey sofa 2.6 m facing two cognac club chairs across a walnut table on a rug"],
                   tables=["tables for two and for four", "the communal table 3.2 m"], lights=["brass cone lamps over every table and low over the bar", "a lamp table and a floor lamp in the lounge"],
                   finishes="off-white plaster", next=""),
    "T06-39": dict(name="Assembly hall", seating=["160 stacking chairs with padded ink-blue seats and backs on black steel frames, ten rows of sixteen with a centre aisle", "the operator's chair at the sound desk"],
                   tables=["the sound desk at the back in the aisle's line", "a table for tea along the back wall: a cream cloth, two urns, cups"],
                   lights=["linear pendants", "a truss of eight spotlights over the stage's front", "warm light on the stage", "the skylights"],
                   finishes="linen plaster (was warm grey); the stage 10 by 3.6 m, 0.6 high, an oak floor, a black skirt, steps at both ends; rust velvet curtains and a valance behind it; "
                            "a walnut lectern with a microphone, two speakers on stands; a dolly of stacked chairs; kentias at the outer corners, a croton by the back door",
                   layout="d from the front wall (0, the stage) to the back (23.4 m); the rows from d 6 to 15; the sound desk at d 17.8; the tea table and the chair dollies on the back wall", next=""),
    "T06-25": dict(name="Library", seating=["24 upholstered ink-blue chairs at six walnut reading tables", "two cognac club chairs in a reading corner by the corridor wall"],
                   tables=["six walnut reading tables 2.4 m, two green-shaded brass lamps on each", "a lamp table between the club chairs"],
                   lights=["linear pendants", "the green lamps", "a table lamp and a floor lamp in the corner", "the clerestory under the sloping roof"],
                   finishes="a wall of books along the outer wall under the clerestory, two rolling oak ladders on brass rails; five double-sided stacks in bays from the aisle toward it; "
                            "the circulation desk in walnut by the front door, a stone ledge for visitors, a screen, returned books, the slot for returns; a trolley of books; "
                            "a globe of Mars on a walnut stand; a fig, a monstera, a fern, a pothos trailing from the desk",
                   layout="d from the back wall (0) to the front (17.5 m); the stacks at r 58.6 to 60.4 every 2.8 m from d 2.2; the tables at r 53.0 and 56.4, d 3.0 to 10.2; "
                          "the desk at r 52.2, 4.4 m from the front wall", next=""),
    "T06-37": dict(name="Dining hall", seating=["72 upholstered chairs in olive and oatmeal at six long oak tables across the room, twelve at each",
                   "a rust banquette along the outer wall in two runs with tables for four, two oatmeal chairs across each"],
                   tables=["six long oak tables 6 m across the room, an orchid on each", "nine tables 1.2 by 0.75 m along the banquette"],
                   lights=["three linen drum lamps low over each long table", "the heat lamp over the servery", "the skylights"],
                   finishes="linen plaster (the sage went dark); along the back wall, the kitchen behind it, a stainless servery 6 m: hot wells of food, a tray rail, a glass guard, "
                            "a heat lamp; a trolley of trays and cutlery; on the front wall a print of the first thousand digits of pi; olives at the outer corners, a fig between the banquettes, "
                            "a bird of paradise by the door",
                   layout="d along the room from the back wall (0, the kitchen) to the front (20.4 m); the tables at d 3.4 to 16.4 every 2.6 m, r 51.5 to 57.5; the banquettes at r 61.6 "
                          "from d 1.9 to 4.9 and 6.5 to 18.6, their tables at r 60.65; the doors at d 2.1 and 18.3", next=""),
    "T06-24": dict(name="Socrates, the seminar room", seating=["twenty high-backed conference chairs in cognac leather with padded arms on five-star bases, nine along each side of the table and one at each end"],
                   tables=["a walnut boardroom table 9 by 1.5 m with rounded ends on three plinths, power ports along its middle; at each place a leather pad, a notebook and pen, a glass; two glass carafes",
                           "a walnut credenza 2.8 m under the screen: cupboards, a coffee machine, cups, a table lamp"],
                   lights=["linear pendants", "the lamp on the credenza"],
                   finishes="linen plaster; a warm grey wool rug under the table; the screen on the front wall; a whiteboard on the back wall; five bookcases on the corridor wall; "
                            "a red maple and a kentia by the windows (a clerestory band under the sloping roof: nothing hangs there), an anthurium on the table",
                   layout="d along the room from the front wall (0) to the back (13.6 m); the table's middle at r 55.6, 0.3 m behind the room's middle", next=""),
    "T06-29": dict(name="Newton, the physics lab", seating=["24 lab stools with padded charcoal seats and low backs on gas columns, two along each side of each bench",
                   "the teacher's task chair behind the demonstration bench"],
                   tables=["six island benches 2.4 by 1.2 m: oak cupboards both sides, a black resin top, a grey spine of sockets and gas taps with yellow handles, a sink with a swan-neck tap",
                           "the demonstration bench 3.6 m across the front under the board, its drawers toward the teacher", "a side counter of black resin 6 m on the corridor wall, oak drawers under it"],
                   lights=["linear pendants in three rows", "a light over the board", "the glass onto the garden gallery"],
                   finishes="off-white plaster; the glass onto the garden gallery kept clear; on the demonstration bench Newton's cradle, a bell jar on its plate with a bell under it "
                            "(its pump on the floor) and an air track with two gliders; on the side counter power supplies and meters, a screen logging an orbit, "
                            "red and black patch leads coiled on a board over it; on the back wall apparatus in four glass-fronted oak cabinets (meters, coils, brass masses, lenses, boxes), "
                            "a Van de Graaff generator and a print of the electromagnetic spectrum; before them a Foucault pendulum, a brass bob on a 4 m wire that swings once every "
                            "6.7 s (Mars's gravity) over a black disc ringed in brass with hour marks and 24 white pegs, those the swing has passed lying knocked down",
                   layout="d along the room from the front wall (0) to the back (17.5 m), r from the corridor wall (49.6) to the glass (62); the doors at d 2.15 and 15.35; "
                          "the benches' long sides along the room in two columns (r 53.2 and 58.4) and three rows (d 4.8, 8.0, 11.2), the aisle between them at r 55.8; "
                          "the pendulum at r 55.8, 3.3 m from the back wall; the side counter from d 4.2 to 10.2",
                   next=""),
    "T06-30": dict(name="Maker space", seating=["padded lab stools with low backs, two along each side of each workbench"],
                   tables=["four workbenches 2.4 by 1.2 m: thick beech tops on dark steel frames, a plywood shelf of bins under each, a blue vice at one end, a socket strip, a cutting mat",
                           "a long bench 6 m under the tool wall", "a counter of six enclosed 3D printers on the corridor wall", "the robot arena 3 by 3 m: a plywood table in an oak rim"],
                   lights=["linear pendants in three rows", "a power drop over each bench: a reel on the ceiling, its socket box hanging at 1.75 m", "a light over the tool wall"],
                   finishes="off-white plaster; the glass onto the garden gallery kept clear; on the back wall the tool wall, hardboard pegboard 6 by 1.8 m with every tool on its painted outline "
                            "(hammers, screwdrivers, pliers, a set of spanners, a saw, a level, tape measures, clamps, a drill, safety glasses, ear defenders); the printers each with a glass door, "
                            "a print on its bed and a spool on its side, a shelf of filament over them; on the arena a mat of Mars ground (craters, rocks, a start box, a dashed track), cones "
                            "and four rovers the students built (six wheels on rocker arms, a solar panel, a mast with a camera head); racks of bins and a rack of plywood and acrylic sheets "
                            "on the front wall, the laser cutter in the corner by the glass with its duct to the ceiling",
                   layout="d along the room from the front wall (0) to the back (17.5 m), r from the corridor wall (49.6) to the glass (62); the doors at d 2.15 and 15.35; "
                          "the workbenches at r 53.2 and 58.4, d 5.0 and 8.6; the arena at r 56.0, d 12.6; the printers from d 4 to 10 on the corridor wall",
                   next="the laser cutter made more like the real machine: a sloping lid with a big tinted window"),
    "T06-42": dict(name="Clinic and counsellor", seating=["the nurse's task chair and a chair for whoever comes in", "in the counsellor's lounge a sage sofa 2.4 m by the outer wall facing two cognac club chairs across a walnut table on a rug"],
                   tables=["the nurse's desk", "the walnut table", "a lamp table"], lights=["a table lamp and a floor lamp in the lounge"],
                   finishes="linen plaster (the sage walls went dark under the skylights); the examination bay at the back: a padded couch on a steel frame with its paper roll, a sage curtain drawn back on a ceiling track round it, "
                            "a counter with a basin and frosted cabinets over it on the back wall; two bookcases behind the nurse's desk; the counsellor's lounge a room of its own, "
                            "frosted glass 2.4 m high in an oak frame round it, open by the front wall; against that glass on the clinic's side two rest beds made up "
                            "(oak frames, white linen, pillows, ink-blue blankets folded at the foot) with a curtain on a track between them; "
                            "over the lounge on the front wall a print of Lissajous figures", next=""),
    "T06-40": dict(name="Art studio", seating=["stools at twelve easels round the long table"], tables=["the long table, jars of paint, cups of brushes, palettes and a roll of paper on it"],
                   lights=["a light washing the back wall"], finishes="paintings in progress on the easels (a Mars dusk, Olympus Mons, a colour field, circles in squares, the dome, "
                   "a still life, waves, the pale blue dot); seven finished canvases hung close together on the back wall; a kiln and two bookcases of supplies on the front wall; the sink counter", next=""),
    "T06-41": dict(name="Music room", seating=["23 ensemble chairs in ink-blue wool in three arcs facing the piano (7, 9, 7), a music stand before each chair of the first arc",
                   "a bench at the grand piano and one in each booth"], tables=[], lights=["linear pendants, two more over the chairs", "a brass cone low over the keys", "a brass floor lamp by the player", "a light washing down the slats", "a globe lamp in each booth"],
                   finishes="linen plaster (was sage); the stage is the outer wall, solid here: oak slats on felt 9 m long and 3.5 m high behind the grand piano, which stands on a forest rug "
                            "with its lid open toward the chairs; on the corridor wall two practice booths from the back corner, three bookcases of scores, then the door; "
                            "on the back wall three guitars hung, the cello and the double bass on their stands, the drum kit in the corner on a charcoal rug; "
                            "on the front wall a violin, a viola and a ukulele by the door and four oatmeal felt panels; a fig by the piano, a fern by the door",
                   layout="d along the room from the front wall (0) to the back (11.7 m), r from the corridor wall (49.6) to the outer wall (62); the door at d 2.1 on the corridor wall; "
                          "the piano's middle at r 60.0, d 5.2, its keys toward the front and its bentside toward the chairs; the arcs centred on r 59.6, d 5.85 at 3.6, 5.0 and 6.4 m; "
                          "the booths from the back wall to d 6.8 (r 49.7 to 52.0); the bookcases from there toward the door",
                   next=""),
    "class": dict(name="Classrooms", seating=["shell chairs with upholstered seat pads at the double desks", "in the big rooms, a linen sofa 3 m in a reading corner by the window"],
                  tables=["double desks", "the teacher's desk"], lights=["linear pendants in rows", "a light over the pinboard"], finishes="off-white plaster",
                  details=["a wall clock over the board, its hands keeping the visitor's own time",
                           "on the back wall a cork pinboard 2.8 by 1.4 m in an oak frame (RING_PINS in campus_rooms.py): the room's classes this week from the timetable, "
                           "a problem of the week for the room's mathematician, a pupil's copy of a diagram, the next contest's flyer, a marked quiz"],
                  next="blinds on the outer glass; each room's mathematician on a poster"),
}


if __name__ == "__main__":
    print(__doc__.strip().splitlines()[0])
    for k, v in PIECES.items(): print("  %-15s %s" % (k, v))
    for code, r in ROOMS.items():
        print("%s %s: %s" % (code, r["name"], "; ".join(r["seating"])))
        if r.get("next"): print("    next:", r["next"])
