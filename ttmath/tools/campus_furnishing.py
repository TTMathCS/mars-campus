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
