"""The room program: one entry per room or area, with its code (floor plans Rev G). The geometry and the drawings are
in draw_plans.py, which reads this file. Edit a room here and re-run `python3 palace/tools/draw_plans.py`.

Codes (Jim, 2 Oct 2026: "each room / area give it some code which can be easily referenced"):
  L1-02  the Pentagon: level 1, room 02. Rooms are numbered level by level, sector by sector (1 Jim's residence, 2 the
         club, 3 the baths, 4 the library, 5 the guests on L1), from the atrium outwards, then along the ring
         clockwise. Shared areas get two letters: L1-AT the atrium terrace, L1-ST the streets.
  C-10   the Crown: room 10. Numbered clockwise from the Arrival hall's part, part by part; a spire's upper floor
         follows its part.
  O-07   the Orb: room 07; O-00 is the Wormhole Gate.
  G-01   the ground: the Stone Garden, the Sun Well, the Orb's dock and the corner pavilions.

Where (Pentagon): (ring, sector, u0, u1, v0, v1). Ring "A"…"E", sector 1…5. u runs along the ring, clockwise seen from
above, 0 at the middle of the sector; None means "to the end of the ring". v0, v1 are 0…1 across the ring's 14 m depth
(0 on the atrium side); None means the whole depth. "rings": ("A", "C") spans rings A to C with their streets.
Where (Crown): (bearing0, bearing1) in degrees, clockwise from north; "up": True for a spire's upper floor.

kind: living, sleep, food, culture, wellness, guest, work, service, garden, tech, move (circulation).
pair: the code of its twin of the same kind, and how the two differ (Jim, 2 Oct 2026: two of a kind is fine "as long
as they could be used for multiple purpose").
seen: the stop or photo already rendered for it, so the pictures follow the plan.
"""

# ---------------------------------------------------------------------------------------------- the Pentagon
SECTORS = {1: "Jim's residence", 2: "The club", 3: "Baths and sport", 4: "Library and archive", 5: "Guests"}

L1 = [
    # sector 1 · Jim's residence: home, below ground for the nights (LV-3)
    dict(code="L1-01", name="Music room", kind="culture", at=("A", 1, None, -8.0), seen="piano",
         use="Jim's piano, played every day, and his records on a long console with a turntable.",
         also="Listening to music in the evening; a quiet room for a guest who plays.", pair="C-11"),
    dict(code="L1-02", name="Family room", kind="living", at=("A", 1, -8.0, 8.0), seen="fire",
         use="Jim's evening living room: the long fire of lit mist, a sofa, books, the screen.",
         also="Films and video letters from home on the screen; chess by the glass.", pair="C-10"),
    dict(code="L1-03", name="Dining room and bar", kind="food", at=("A", 1, 8.0, None), seen="table",
         use="Everyday meals, a table for eight; the bar at the back of the room.",
         also="Drinks after dinner; small dinners with guests.", pair="C-17"),
    dict(code="L1-04", name="Study", kind="work", at=("A", 1, -8.0, 8.0), upper=True,
         use="Jim's evening desk, on the upper storey over the family room: letters and video letters home, his accounts, Arcadia's console.",
         also="A quiet room to read late.", pair="C-23"),
    dict(code="L1-05", name="Laundry and linen", kind="service", at=("B", 1, None, -15.5),
         use="Washing, ironing and the linen for the suite, next to the bath.", also="Robots' storeroom for the suite."),
    dict(code="L1-06", name="Bath", kind="sleep", at=("B", 1, -15.5, -7.0), seen="bath",
         use="The master bath: a stone tub, a shower, two basins, a glass wall onto the moss garden.", also="A steam shower for the evenings."),
    dict(code="L1-07", name="Moss garden", kind="garden", at=("B", 1, -7.0, 7.0), seen="garden",
         use="A garden open to the lit roof, 8 m tall, between the bedroom and the bath: moss, a pond, stones, a maple.",
         also="Where Jim sits before sleep."),
    dict(code="L1-08", name="Bedroom", kind="sleep", at=("B", 1, 7.0, 15.5, 0.0, 0.68), seen="bedroom",
         use="Jim's bedroom for the nights, under 16 m of soil: the bed faces a glass wall onto the moss garden.",
         also="Reading in bed; a sitting corner.", pair="C-07"),
    dict(code="L1-09", name="Dressing room", kind="sleep", at=("B", 1, 7.0, 15.5, 0.68, 1.0),
         use="Clothes, shoes, the suits for going outside, behind the bedroom.", also=""),
    dict(code="L1-10", name="Kitchen", kind="food", at=("B", 1, 15.5, None),
         use="The everyday kitchen, across the street from the dining room. Robots cook; Jim can too.",
         also="Breakfast at the counter.", pair="C-18"),
    dict(code="L1-11", name="Pantry and cold store", kind="service", at=("C", 1, None, -12.0),
         use="Food from the garden level, kept for the kitchen.", also=""),
    dict(code="L1-12", name="Robot bay", kind="service", at=("C", 1, -12.0, 12.0),
         use="Where the robots that cook, clean and carry charge and are serviced.", also=""),
    dict(code="L1-13", name="Household stores", kind="service", at=("C", 1, 12.0, None),
         use="China, glass, furniture and decorations not in use.", also=""),
    dict(code="L1-14", name="Memory rooms", kind="culture", at=("D", 1),
         use="Jim's keepsakes from Earth: family photographs, letters and the things he brought from home, in a suite of quiet rooms.",
         also="Where he records his memoirs; where visiting family find the family's history."),
    dict(code="L1-15", name="Wardrobe and stores", kind="service", at=("E", 1, None, 0.0),
         use="Clothes and things not in daily use.", also=""),
    dict(code="L1-16", name="Residence plant room", kind="tech", at=("E", 1, 0.0, None),
         use="The air, heat and water for the residence, with its own back-up.", also=""),
    # sector 2 · the club: evenings and entertainment, for Jim and his guests
    dict(code="L1-17", name="Cinema", kind="culture", at=("A", 2), seen="cinema",
         use="Forty seats in front of a screen 12 m wide: films.",
         also="Concerts and talks streamed from Earth; video letters from the family on the big screen; a lecture hall when visitors come.",
         pair="O-07"),
    dict(code="L1-18", name="Games room", kind="living", at=("B", 2),
         use="Billiards, cards and table tennis, which plays strangely in low gravity.", also="Evenings with guests."),
    dict(code="L1-19", name="Ballroom", kind="living", at=("C", 2),
         use="Dances and celebrations when visitors arrive, every 26 months.", also="The rest of the time: dance, yoga and exercise classes, and exhibitions."),
    dict(code="L1-20", name="Wine cellar", kind="food", at=("D", 2),
         use="Arcadia's one cellar, cool and steady below ground, with a tasting table.", also="It supplies the Crown's wine room (C-16)."),
    dict(code="L1-21", name="Club stores", kind="service", at=("E", 2), use="Chairs, tables, instruments and decorations for the club.", also=""),
    # sector 3 · baths and sport
    dict(code="L1-22", name="Thermal baths", kind="wellness", at=("A", 3), seen="baths",
         use="Long soaks: a warm pool at 36 °C, a round hot pool at 40 °C and a cold plunge at 14 °C, loungers along the glass.",
         also="Recovery after exercise; a quiet evening with guests.", pair="C-13"),
    dict(code="L1-23", name="Lap pool, 50 m", kind="wellness", at=("B", 3),
         use="Training: lengths and water exercise, safe below ground.", also="Water sports in low gravity; swimming lessons for visiting children.", pair="C-14"),
    dict(code="L1-24", name="Sports hall", kind="wellness", at=("C", 3),
         use="A climbing wall, ball games and a running track, all lively in low gravity.", also="The exercise that keeps bones and muscles strong (see Health in the science pages).", pair="C-15"),
    dict(code="L1-25", name="Sauna and steam", kind="wellness", at=("D", 3),
         use="Saunas and steam rooms for the evening, next to the baths.", also="", pair="C-13"),
    dict(code="L1-26", name="Treatment rooms", kind="wellness", at=("E", 3),
         use="Massage and physiotherapy for bones and muscles in low gravity, with changing rooms for the baths.", also="Linked to the medical centre (L3-10)."),
    # sector 4 · library and archive
    dict(code="L1-27", name="Great library", kind="culture", at=("A", 4), seen="library",
         use="Arcadia's main collection, two storeys of books, read at long tables by the atrium glass.",
         also="Talks and readings when visitors come.", pair="C-24"),
    dict(code="L1-28", name="Archive of Earth", kind="culture", at=("B", 4),
         use="Earth's history and culture, and family records, to read and to look at.", also="Its sealed copy is in the vault (L5-11)."),
    dict(code="L1-29", name="Film and music archive", kind="culture", at=("C", 4),
         use="Films and recordings, with booths to watch and listen.", also="Feeds the cinema (L1-17) and the music room (L1-01)."),
    dict(code="L1-30", name="Book stacks", kind="culture", at=("D", 4),
         use="Robotic stacks that bring any book to the library or to any room.", also=""),
    dict(code="L1-31", name="Conservation workshop", kind="work", at=("E", 4),
         use="Repairing, scanning and printing books; the library's stores.", also=""),
    # sector 5 · guests: they sleep below ground too, as Jim does
    dict(code="L1-32", name="Guest lounge", kind="guest", at=("A", 5),
         use="The guests' living and dining room on the atrium glass, two storeys tall.", also="Where guests and Jim meet in the evening."),
    dict(code="L1-33", name="Guest suite 1", kind="guest", at=("B", 5, None, -18.8), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-34", name="Guest suite 2", kind="guest", at=("B", 5, -18.8, 0.0), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-35", name="Guest suite 3", kind="guest", at=("B", 5, 0.0, 18.8), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-36", name="Guest suite 4", kind="guest", at=("B", 5, 18.8, None), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-37", name="Guest suite 5", kind="guest", at=("C", 5, None, -25.4), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-38", name="Guest suite 6", kind="guest", at=("C", 5, -25.4, 0.0), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-39", name="Guest suite 7", kind="guest", at=("C", 5, 0.0, 25.4), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-40", name="Guest suite 8", kind="guest", at=("C", 5, 25.4, None), use="A bedroom, a bath and a sitting room.", also=""),
    dict(code="L1-41", name="Family apartment 1", kind="guest", at=("D", 5, None, 0.0), use="For a family visiting with children: bedrooms, a kitchen, a living room.", also=""),
    dict(code="L1-42", name="Family apartment 2", kind="guest", at=("D", 5, 0.0, None), use="For a family visiting with children: bedrooms, a kitchen, a living room.", also=""),
    dict(code="L1-43", name="Staff and robots", kind="service", at=("E", 5), use="Rooms for staff, if any come; robot bays and stores for the guest wing.", also=""),
]

L2 = [
    dict(code="L2-01", name="Citrus grove", kind="garden", at=("A", 1), use="Oranges, lemons and limes under the sky of lamps.", also=""),
    dict(code="L2-02", name="Apples and pears", kind="garden", at=("B", 1), use="An orchard of apples and pears.", also=""),
    dict(code="L2-03", name="Olives and figs", kind="garden", at=("C", 1), use="Olives for oil, and figs.", also=""),
    dict(code="L2-04", name="Vineyard", kind="garden", at=("D", 1), use="Vines for grapes and wine.", also=""),
    dict(code="L2-05", name="Tree nursery", kind="garden", at=("E", 1), use="Young trees for the orchards and the city.", also=""),
    dict(code="L2-06", name="Market garden", kind="garden", at=("A", 2), use="Vegetables and herbs, picked fresh.", also=""),
    dict(code="L2-07", name="Vertical farm", kind="garden", at=("B", 2), use="Racks of greens under LEDs, the highest yields.", also=""),
    dict(code="L2-08", name="Grain and rice", kind="garden", at=("C", 2), use="Wheat, rice and beans.", also=""),
    dict(code="L2-09", name="Mushroom cellar", kind="garden", at=("D", 2), use="Mushrooms grown on the garden's waste.", also=""),
    dict(code="L2-10", name="Seed store", kind="garden", at=("E", 2), use="The farm's working seeds.", also="", pair="L5-09"),
    dict(code="L2-11", name="Lake", kind="garden", at=("A", 3), rings=("A", "C"), use="A lake that is also Arcadia's water reserve.", also="Swimming and boating in summer light."),
    dict(code="L2-12", name="Fish farm", kind="garden", at=("D", 3), use="Fish for the table, fed from the gardens.", also=""),
    dict(code="L2-13", name="Pumps and filters", kind="tech", at=("E", 3), use="The lake's pumps and filters.", also=""),
    dict(code="L2-14", name="Forest walk", kind="garden", at=("A", 4), rings=("A", "C"), use="A forest with paths, under trees 12 m tall.", also=""),
    dict(code="L2-15", name="Stream and falls", kind="garden", at=("D", 4), use="A stream that falls into the lake.", also=""),
    dict(code="L2-16", name="Forest nursery", kind="garden", at=("E", 4), use="Young trees and plants for the forest.", also=""),
    dict(code="L2-17", name="Meadow and bees", kind="garden", at=("A", 5), use="A meadow of wild flowers, with hives.", also=""),
    dict(code="L2-18", name="Flower garden", kind="garden", at=("B", 5), use="Flowers for the rooms.", also=""),
    dict(code="L2-19", name="Tea house", kind="garden", at=("C", 5), use="A tea house in the meadow: tea, quiet, contemplation.", also="Small meetings out in the garden."),
    dict(code="L2-20", name="Aquaponics", kind="garden", at=("D", 5), use="Fish and plants in one loop of water.", also=""),
    dict(code="L2-21", name="Compost and soil", kind="service", at=("E", 5), use="Making soil from Arcadia's waste.", also=""),
]

L3 = [
    dict(code="L3-01", name="Workshop", kind="work", at=("A", 1), use="Jim's workshop for wood and metal.", also=""),
    dict(code="L3-02", name="Sculpture and casting hall", kind="work", at=("B", 1), use="Big and heavy work: sculpture, casting, kilns.", also="", pair="C-27"),
    dict(code="L3-03", name="Model hall", kind="work", at=("C", 1), use="Room for big models: railways, rockets, the city.", also=""),
    dict(code="L3-04", name="Tool store", kind="service", at=("D", 1), use="Tools and machines.", also=""),
    dict(code="L3-05", name="Materials", kind="service", at=("E", 1), use="Timber, metals and materials.", also=""),
    dict(code="L3-06", name="Robot foundry", kind="work", at=("A", 2), rings=("A", "C"), use="Prints the parts for Arcadia and the city.", also=""),
    dict(code="L3-07", name="Regolith kilns", kind="work", at=("D", 2), use="Fires Mars soil into panels and bricks.", also=""),
    dict(code="L3-08", name="Parts yard", kind="service", at=("E", 2), use="Finished parts waiting for use.", also=""),
    dict(code="L3-09", name="Laboratories", kind="work", at=("A", 3), use="Science: soil, ice, air, plants.", also=""),
    dict(code="L3-10", name="Medical centre", kind="work", at=("B", 3), use="A doctor's surgery, a scanner and an operating room, with no evacuation possible.", also="Works with the treatment rooms (L1-26)."),
    dict(code="L3-11", name="Clean rooms", kind="work", at=("C", 3), use="Electronics and medicines made clean.", also=""),
    dict(code="L3-12", name="Test halls", kind="work", at=("D", 3), use="Testing machines before use.", also=""),
    dict(code="L3-13", name="Science stores", kind="service", at=("E", 3), use="", also=""),
    dict(code="L3-14", name="AI core", kind="tech", at=("A", 4), use="The house mind: the computers that run Arcadia.", also=""),
    dict(code="L3-15", name="Data vault", kind="tech", at=("B", 4), use="Arcadia's data, kept safe.", also=""),
    dict(code="L3-16", name="Earth link", kind="tech", at=("C", 4), use="The link to the relays and to Earth.", also=""),
    dict(code="L3-17", name="Cooling", kind="tech", at=("D", 4), use="Cooling for the computers.", also=""),
    dict(code="L3-18", name="Backup core", kind="tech", at=("E", 4), use="A second house mind, in case the first fails.", also=""),
    dict(code="L3-19", name="City control room", kind="work", at=("A", 5), use="Runs Arcadia, the city and the spaceport.", also=""),
    dict(code="L3-20", name="Storm watch", kind="work", at=("B", 5), use="Weather and dust storms, radiation alerts.", also=""),
    dict(code="L3-21", name="Flight control", kind="work", at=("C", 5), use="All flights and rovers: the pods, the ships, the rover trips.", also="", pair="C-05"),
    dict(code="L3-22", name="Training", kind="work", at=("D", 5), use="Training for robots and people: suits, rovers, emergencies.", also=""),
    dict(code="L3-23", name="Control stores", kind="service", at=("E", 5), use="", also=""),
]

L4 = [
    dict(code="L4-01", name="Fission reactors", kind="tech", at=("A", 1), rings=("A", "B"), use="Two 5 MWe microreactors.", also=""),
    dict(code="L4-02", name="Fusion-ready bay", kind="tech", at=("C", 1), use="Kept for a fusion plant when one exists.", also=""),
    dict(code="L4-03", name="Batteries and heat store", kind="tech", at=("D", 1), use="", also=""),
    dict(code="L4-04", name="Switchgear", kind="tech", at=("E", 1), use="", also=""),
    dict(code="L4-05", name="Ice melt", kind="tech", at=("A", 2), use="Melting the ice from the mine.", also=""),
    dict(code="L4-06", name="Purification", kind="tech", at=("B", 2), use="Removing the perchlorate salts.", also=""),
    dict(code="L4-07", name="Water recycling", kind="tech", at=("C", 2), use="98% of the water used again.", also=""),
    dict(code="L4-08", name="Water tanks", kind="tech", at=("D", 2), rings=("D", "E"), use="", also=""),
    dict(code="L4-09", name="Oxygen plant", kind="tech", at=("A", 3), use="Oxygen from carbon dioxide and water.", also=""),
    dict(code="L4-10", name="CO₂ scrubbers", kind="tech", at=("B", 3), use="", also=""),
    dict(code="L4-11", name="Nitrogen and argon", kind="tech", at=("C", 3), use="The buffer gases, from the Mars air.", also=""),
    dict(code="L4-12", name="Air tanks", kind="tech", at=("D", 3), rings=("D", "E"), use="", also=""),
    dict(code="L4-13", name="Food for two years", kind="service", at=("A", 4), rings=("A", "C"), use="The storm reserve.", also=""),
    dict(code="L4-14", name="Spare parts", kind="service", at=("D", 4), rings=("D", "E"), use="", also=""),
    dict(code="L4-15", name="Waste to soil", kind="tech", at=("A", 5), use="", also=""),
    dict(code="L4-16", name="Metals", kind="tech", at=("B", 5), use="", also=""),
    dict(code="L4-17", name="Plastics", kind="tech", at=("C", 5), use="", also=""),
    dict(code="L4-18", name="Maintenance", kind="work", at=("D", 5), use="", also=""),
    dict(code="L4-19", name="Life support stores", kind="service", at=("E", 5), use="", also=""),
]

L5 = [
    dict(code="L5-01", name="Maglev hall", kind="move", at=("A", 1), rings=("A", "C"), use="The station for the maglev to the spaceport (phase 2).", also=""),
    dict(code="L5-02", name="Platforms", kind="move", at=("D", 1), use="", also=""),
    dict(code="L5-03", name="Tunnel portal", kind="move", at=("E", 1), use="", also=""),
    dict(code="L5-04", name="Freight portals", kind="move", at=("A", 2), use="", also=""),
    dict(code="L5-05", name="Cargo hall", kind="service", at=("B", 2), use="", also=""),
    dict(code="L5-06", name="Sorting", kind="service", at=("C", 2), use="", also=""),
    dict(code="L5-07", name="Cold store", kind="service", at=("D", 2), use="", also=""),
    dict(code="L5-08", name="Loading", kind="service", at=("E", 2), use="", also=""),
    dict(code="L5-09", name="Seed vault", kind="culture", at=("A", 3), use="Seeds of Earth's plants, kept for centuries.", also="", pair="L2-10"),
    dict(code="L5-10", name="DNA archive", kind="culture", at=("B", 3), use="", also=""),
    dict(code="L5-11", name="Earth memory vault", kind="culture", at=("C", 3), use="The sealed copy of the Archive of Earth.", also="", pair="L1-28"),
    dict(code="L5-12", name="Vault services", kind="tech", at=("D", 3), use="", also=""),
    dict(code="L5-13", name="Vault stores", kind="service", at=("E", 3), use="", also=""),
    dict(code="L5-14", name="Tunnel boring machines", kind="work", at=("A", 4), rings=("A", "C"), use="They dig the city's tunnels.", also=""),
    dict(code="L5-15", name="Spoil to bricks", kind="work", at=("D", 4), use="", also=""),
    dict(code="L5-16", name="City roots", kind="move", at=("E", 4), use="The start of the tunnels to the city.", also=""),
    dict(code="L5-17", name="Rover hall", kind="move", at=("A", 5), use="", also=""),
    dict(code="L5-18", name="Garage", kind="service", at=("B", 5), use="", also=""),
    dict(code="L5-19", name="Charging", kind="tech", at=("C", 5), use="", also=""),
    dict(code="L5-20", name="Suit room", kind="move", at=("D", 5), use="Suits for going out by rover through the tunnel.", also="The second way out of Arcadia.", pair="C-01"),
    dict(code="L5-21", name="Tunnel to the surface", kind="move", at=("E", 5), use="", also=""),
]

LEVELS = [
    dict(id="L1", name="Residence", floor=-24, height=8, rooms=L1,
         intro="Jim's home below ground, for the nights and the evenings: his residence, the club, the baths, the library and the guests. Everyone sleeps here, under 16 m of soil."),
    dict(id="L2", name="Garden", floor=-41, height=16, rooms=L2,
         intro="Sixteen metres tall under a sky of lamps: the orchard, the farm, the lake that is the water reserve, the forest and the meadow."),
    dict(id="L3", name="Studio", floor=-50, height=8, rooms=L3,
         intro="Where things are made and run: Jim's workshops, the robot foundry, the laboratories and the medical centre, the house mind and the control rooms."),
    dict(id="L4", name="Life support", floor=-59, height=8, rooms=L4,
         intro="The machine room: power, water, air, the storm reserve and recycling."),
    dict(id="L5", name="Transit", floor=-68, height=8, rooms=L5,
         intro="Where things arrive and leave: the maglev station, cargo, the seed vault, the tunnel works and the rovers. The sun court is at its centre."),
]

SHARED = {  # areas on every level of the Pentagon
    "AT": ("Atrium terrace", "The terrace along the glass round the atrium, with hanging gardens."),
    "BR": ("Bridges", "The bridges from the terrace to the portal column."),
    "PC": ("Portal column", "Portals to every level, the Crown and the Orb."),
    "ST": ("Streets", "Four streets, 4 m wide, between the rings; lit from above on L1."),
    "AV": ("Avenues", "Five avenues, 5 m wide, from the atrium's corners out to the corner cores."),
    "CC": ("Corner cores", "At the five outer corners: stairs (the fallback for the portals), pressure doors and services."),
}

# ---------------------------------------------------------------------------------------------- the Crown
CROWN_PARTS = [  # (number, name, bearing0, bearing1, spire?, compass)
    (1, "Arrival", 72, 108, True, "E"), (2, "Master suite up", 108, 144, False, "SE"), (3, "Salon", 144, 180, True, "SSE"),
    (4, "Wellness", 180, 216, False, "SSW"), (5, "Dining", 216, 252, True, "SW"), (6, "Sunset", 252, 288, False, "W"),
    (7, "Library", 288, 324, True, "NW"), (8, "Studio", 324, 360, False, "NNW"), (9, "Observatory", 0, 36, True, "NNE"),
    (10, "Garden room", 36, 72, False, "NE"),
]

CROWN = [
    dict(code="C-01", part=1, name="Suit room", kind="move", at=(72.0, 78.0), use="Suits and the airlock with a dust room, for going out onto the hull or the plain.", also="", pair="L5-20"),
    dict(code="C-02", part=1, name="Pod hangar", kind="move", at=(78.0, 91.44), use="The pods dock here, through a door in the outer wall.", also=""),
    dict(code="C-03", part=1, name="The Door", kind="move", at=(91.44, 95.76), use="The front door of Arcadia, from the hangar.", also=""),
    dict(code="C-04", part=1, name="Arrival hall", kind="move", at=(95.76, 108.0), seen="crown_arrival", use="Where everyone arrives: 9 m tall, an olive bench, the portal to the Orb, the spires and the Pentagon.", also="Where visitors are welcomed."),
    dict(code="C-05", part=1, name="Dock control", kind="work", at=(78.0, 108.0), up=True, use="Upstairs in the Arrival spire: watches the pods dock.", also="", pair="L3-21"),
    dict(code="C-06", part=2, name="Dressing room", kind="sleep", at=(108.0, 116.64), use="Clothes for the day, next to the bedroom up.", also=""),
    dict(code="C-07", part=2, name="Bedroom up", kind="sleep", at=(116.64, 130.32), seen="crown_bedroom",
         use="Jim's day room to rest in: a nap after lunch, reading; the bed faces the south-east slots, where the sun rises.", also="Changing between the morning and the afternoon.", pair="L1-08"),
    dict(code="C-08", part=2, name="Bath up", kind="sleep", at=(130.32, 144.0), use="A bath with a soaking tub by the slots.", also=""),
    dict(code="C-09", part=3, name="Hearth room", kind="living", at=(144.0, 151.92), seen="crown_salon", use="A fireside corner of the salon, a hearth of lit mist.", also="Quiet talks."),
    dict(code="C-10", part=3, name="Great salon", kind="living", at=(151.92, 172.08), seen="crown_salon",
         use="Jim's living room by day: linen sofas, olive trees, the sun through the slots, the view.", also="Receptions and parties when visitors come.", pair="L1-02"),
    dict(code="C-11", part=3, name="Recital room", kind="culture", at=(172.08, 180.0), seen="crown_salon",
         use="The concert grand, played for guests: the salon's chairs turn to face it.", also="Rehearsing in daylight.", pair="L1-01"),
    dict(code="C-12", part=3, name="Sky lounge", kind="living", at=(144.0, 180.0), up=True, use="Upstairs in the Salon spire: the highest view over the plain by day.", also="A quiet retreat."),
    dict(code="C-13", part=4, name="Spa", kind="wellness", at=(180.0, 192.8), use="A cedar sauna with a glass front and a round hot pool, with the view.", also="", pair="L1-25"),
    dict(code="C-14", part=4, name="Sky pool, 25 m", kind="wellness", at=(192.8, 203.65), seen="crown_wellness",
         use="Swimming in daylight along the ring, where low gravity makes every wave rise high and fall slowly.", also="Lying by the water in the sun.", pair="L1-23"),
    dict(code="C-15", part=4, name="Gym", kind="wellness", at=(203.65, 216.0), use="Machines and weights with the view, for the daily exercise.", also="", pair="L1-24"),
    dict(code="C-16", part=5, name="Wine room", kind="food", at=(216.0, 223.2), use="Wine brought up from the cellar (L1-20) for the dinners, and served from here.", also=""),
    dict(code="C-17", part=5, name="Dining hall", kind="food", at=(223.2, 241.2), seen="crown_dining",
         use="Dinners with guests: one basalt table for 22, the afternoon sun low through the slots.", also="Celebrations; meetings when visitors come.", pair="L1-03"),
    dict(code="C-18", part=5, name="Chef's kitchen", kind="food", at=(241.2, 252.0), use="Cooks for the dining hall.", also="", pair="L1-10"),
    dict(code="C-19", part=5, name="Sky bar", kind="food", at=(216.0, 252.0), up=True, use="Upstairs in the Dining spire: drinks at sunset with the view west.", also="", pair="L1-03"),
    dict(code="C-20", part=6, name="Guests' day room", kind="guest", at=(252.0, 261.0),
         use="Where visitors spend their days up here: desks, sofas, a kitchenette, a corner for children.", also="(Guests sleep below ground, in the guest wing on L1.)"),
    dict(code="C-21", part=6, name="Sunset lounge", kind="living", at=(261.0, 279.0), use="Low sofas facing the west slots: at sunset the sun shines straight in, in a blue sky.", also="Evening drinks before going down."),
    dict(code="C-22", part=6, name="Gallery", kind="culture", at=(279.0, 288.0), use="Jim's paintings from the studio and his photographs of Mars.", also="Exhibitions; a quiet room by the sunset lounge."),
    dict(code="C-23", part=7, name="Study", kind="work", at=(288.0, 297.0), seen="crown_library", use="Jim's day desk in the north light: writing, his memoirs, video letters.", also="", pair="L1-04"),
    dict(code="C-24", part=7, name="Library", kind="culture", at=(297.0, 316.8), seen="crown_library",
         use="Reading in daylight: two floors of walnut shelves with a working collection, a gallery and a spiral stair.", also="", pair="L1-27"),
    dict(code="C-25", part=7, name="Map room", kind="culture", at=(316.8, 324.0), seen="crown_maproom", use="A globe of Mars 3 m across and chests of maps: planning trips and flights.", also=""),
    dict(code="C-26", part=7, name="Reading gallery", kind="culture", at=(288.0, 324.0), up=True, use="Upstairs in the Library spire, a reading room under the roof.", also=""),
    dict(code="C-27", part=8, name="Art studio", kind="work", at=(324.0, 339.0), use="Painting and drawing in the steady north light.", also="", pair="L3-02"),
    dict(code="C-28", part=8, name="Photo and print room", kind="work", at=(339.0, 349.0), use="Printing Jim's photographs of Mars and his art.", also=""),
    dict(code="C-29", part=8, name="Craft room", kind="work", at=(349.0, 360.0), use="Pottery, models and small repairs (heavy work is in L3's workshops).", also=""),
    dict(code="C-30", part=9, name="Star lounge", kind="living", at=(0.0, 24.0), use="Night: reclining chairs under the slots and the real stars.", also="Parties at night."),
    dict(code="C-31", part=9, name="Telescope room", kind="culture", at=(24.0, 36.0), use="The controls of the telescope upstairs, and screens for what it sees.", also=""),
    dict(code="C-32", part=9, name="Telescope dome", kind="culture", at=(0.0, 36.0), up=True, use="Upstairs in the Observatory spire: the telescope.", also=""),
    dict(code="C-33", part=10, name="Breakfast room", kind="food", at=(36.0, 48.0), use="Breakfast with the sunrise through the east slots.", also="Morning coffee with guests."),
    dict(code="C-34", part=10, name="Sky garden", kind="garden", at=(48.0, 72.0), use="Herbs, flowers and small trees under the slots: a conservatory in the ring.", also="Fresh herbs for the chef's kitchen."),
]
CROWN_SHARED = {"GL": ("The Glide", "The moving walkway along the garden side, 779 m round, past every room.")}

# ---------------------------------------------------------------------------------------------- the Orb
# 48 m across, from +48 to +96 m (Rev F, 2 Oct 2026). On each floor five rooms sit between two lanes, 2.4 m wide: the
# outer lane along the windows, the inner lane along the glass onto the Gate's round space (24 m across); five
# passages join the lanes under the spires. "slot" is the room's place round the floor, clockwise from the north-east.
ORB_SHARED = {"OL": ("Outer lane", "2.4 m wide along the windows, on every floor: the view out over the plain."),
              "IL": ("Inner lane", "2.4 m wide along the glass, on every floor: the view in onto the Wormhole Gate."),
              "PS": ("Passages", "Five on every floor, 2.4 m wide, joining the lanes under the five spires.")}
ORB = [
    dict(code="O-00", name="Wormhole Gate", kind="culture", floor=0, use="A ball 18 m across in the middle of the Orb: it sends Jim to any place and time.", also=""),
    dict(code="O-01", name="Foyer", kind="move", floor=64, use="Under the Gate, round which the portals open.", also=""),
] + [dict(code="O-%02d" % (2 + i), name="Portal %d" % (i + 1), kind="move", floor=64, slot=i,
          use="The portal from the %s spire, in a room between the lanes, with seats to wait in." % n, also="") for i, n in enumerate(("Arrival", "Salon", "Dining", "Library", "Observatory"))] + [
    dict(code="O-%02d" % (7 + i), name=n, kind="culture", floor=72, slot=i, use=u, also="The universe fills the room at a switch.",
         **({"pair": "L1-17"} if i == 0 else {}))
    for i, (n, u) in enumerate((("Earth lounge", "The universe zoomed to Earth: home, its weather, its news."),
                                ("Mars lounge", "Mars, Arcadia and the city."),
                                ("Solar system lounge", "The planets and their moons."),
                                ("Galaxy lounge", "The Milky Way: choosing far places for the Gate."),
                                ("Deep universe lounge", "The web of galaxies and time.")))] + [
    dict(code="O-12", name="Bridge into the Gate", kind="move", floor=72, use="3 m wide, from the inner lane into the Gate.", also="")] + [
    dict(code="O-%02d" % (13 + i), name=("Jim's rest room" if i == 0 else "Rest room %d" % (i + 1)), kind="sleep", floor=80, slot=i,
         use="A day bed, a window to the sky behind radiation glass, a glass wall onto the Gate that turns frosted.", also="")
    for i in range(5)]

GROUND = [
    dict(code="G-01", name="Stone Garden", use="Raked gravel and seven basalt stones inside a paved pentagon over the Pentagon."),
    dict(code="G-02", name="Sun Well", use="A lens over the atrium that brings daylight 68 m down."),
    dict(code="G-03", name="Orb dock", use="A basalt ring with five pads, where the Orb comes down for service."),
] + [dict(code="G-%02d" % (4 + i), name="Corner pavilion %d" % (i + 1), use="Glass pavilion over the stair and airlock at a corner of the Pentagon.") for i in range(5)]

# ---------------------------------------------------------------------------------------------- changes from Rev B
REMOVED = [
    ("The planetarium (Crown, Observatory)", "The Orb shows the universe better; the Observatory keeps the star lounge and the real telescope (C-30 to C-32)."),
    ("The music room in the Crown's Studio, and the club's music room (L1)", "Music has two rooms with two purposes: the recital room up (C-11) and Jim's music room down (L1-01)."),
    ("The club's bar (L1)", "Bars: the Sky bar up (C-19) and the bar in Jim's dining room down (L1-03); the ballroom has a counter for parties."),
    ("The two guest suites in the Crown's Sunset part", "Guests sleep below ground, like Jim; by day they have the guests' day room (C-20)."),
    ("The private spa in the master suite up, and the private spa on L1", "Spas: the Crown's spa with a view (C-13) and the sauna and steam rooms below (L1-25); each master bath has a deep tub."),
    ("The workshop in the Crown's Studio", "Heavy work is in L3's workshops (L3-01); the Studio keeps a craft room (C-29)."),
    ("The tea house in the Crown's Garden room", "One tea house, in the meadow of the garden level (L2-19)."),
    ("The reading rooms (L1)", "Reading is in the great library (L1-27) and the Crown's library (C-24)."),
]
NEW = [
    ("L1-14 Memory rooms", "Jim's keepsakes from Earth and his memoirs: he is not going back."),
    ("L1-19 Ballroom", "Celebrations when visitors come; classes and exhibitions in between."),
    ("L1-24 Sports hall", "Climbing, ball games and running in low gravity."),
    ("C-20 Guests' day room, C-22 Gallery, C-28 Photo and print room, C-31 Telescope room", "In place of the rooms taken out of the Crown."),
    ("Room codes", "Every room and area has a code: L1-02, C-10, O-07, G-01."),
]
