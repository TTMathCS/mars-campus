
  /* ============================== rooms, doors and tour stops ============================== */
  var ROOMS = [
    { id: "dome", name: "Great Dome", stop: "dome", s: ["c", 0, 0, 26] },
    { id: "linkN", s: ["r", -2.1, 2.1, -28, -25.4], kind: "link" },
    { id: "foyer", name: "Private gallery", stop: "foyer", s: ["r", -8, 8, -36, -28] },
    { id: "bedroom", name: "Master bedroom", stop: "bedroom", s: ["r", -8, 8, -56, -36] },
    { id: "bath", name: "Bath & dressing", stop: "bath", s: ["r", -8, 8, -70, -56] },
    { id: "study", name: "Study & shelter", stop: "study", s: ["r", -8, 8, -88, -70] },
    { id: "linkE", s: ["r", 25.4, 28, -2.1, 2.1], kind: "link" },
    { id: "dining", name: "Grand dining", stop: "dining", s: ["r", 28, 48, -8, 8] },
    { id: "kitchen", name: "Kitchen", stop: "kitchen", s: ["r", 48, 64, -8, 8] },
    { id: "cellar", name: "Cellar", stop: "cellar", s: ["r", 64, 74, -8, 8] },
    { id: "library", name: "Library", stop: "library", s: ["r", 74, 98, -8, 8] },
    { id: "boot", name: "Boot room", stop: "hangar", s: ["r", 98, 106, -8, 8] },
    { id: "hangar", name: "Hangar", stop: "hangar", s: ["r", 106, 146, -20, 20] },
    { id: "linkS", s: ["r", -2.1, 2.1, 25.4, 28], kind: "link" },
    { id: "spa", name: "Spa foyer", stop: "sauna", s: ["r", -8, 8, 28, 34] },
    { id: "pool", name: "Low-gravity pool", stop: "pool", s: ["r", -8, 8, 34, 66] },
    { id: "sauna", name: "Sauna & plunge", stop: "sauna", s: ["r", -8, 8, 66, 76] },
    { id: "gym", name: "Gym & centrifuge", stop: "gym", s: ["r", -8, 8, 76, 92] },
    { id: "zen", name: "Zen garden", stop: "zen", s: ["r", -8, 8, 92, 104] },
    { id: "linkW", s: ["r", -28, -25.4, -2.1, 2.1], kind: "link" },
    { id: "loggia", name: "Sunset loggia", stop: "loggia", s: ["r", -62, -28, -12, 12], kind: "glass" },
    { id: "linkO", s: ["r", -48.1, -43.9, -20.4, -12], kind: "link" },
    { id: "tower", name: "Observatory", stop: "observatory", s: ["c", -46, -26, 6] },
    { id: "glounge", name: "Guest lounge", stop: "guestlounge", s: ["r", 32, 48, 8.6, 16] },
    { id: "phobos", name: "Phobos suite", stop: "guests", s: ["r", 32, 48, 16, 30] },
    { id: "deimos", name: "Deimos suite", stop: "guests", s: ["r", 32, 48, 30, 44] },
    { id: "earthS", name: "Earth suite", stop: "guests", s: ["r", 32, 48, 44, 58] },
    { id: "linkG1", s: ["r", 48.6, 62.2, 34.9, 39.1], kind: "link" },
    { id: "g1", name: "Kitchen garden", stop: "greenhouse", s: ["c", 74, 37, 12], kind: "glass" },
    { id: "linkG2", s: ["r", 85.8, 90.2, 34.9, 39.1], kind: "link" },
    { id: "g2", name: "Field greenhouse", stop: "grain", s: ["c", 102, 37, 12], kind: "glass" },
    { id: "linkG3", s: ["r", 71.9, 76.1, 48.8, 55.2], kind: "link" },
    { id: "g3", name: "Orchard", stop: "orchard", s: ["c", 74, 65, 10], kind: "glass" }
  ];
  function areaOf(r) { var s = r.s; return s[0] === "c" ? Math.PI * s[3] * s[3] : s[0] === "a" ? Math.PI * (s[4] * s[4] - s[3] * s[3]) : s[0] === "e" ? Math.PI * s[3] * s[4] : s[0] === "o" ? 4 * s[3] * s[4] : (s[2] - s[1]) * (s[4] - s[3]); }
  var TOTAL_AREA = 0, DEEP_AREA = 0;
  // doorways for walking: [x0, x1, z0, z1]
  var DOORS = [];
  function doorAcross(axis, along, across) { if (axis === "z") DOORS.push([across - 1.1, across + 1.1, along - 0.7, along + 0.7]); else DOORS.push([along - 0.7, along + 0.7, across - 1.1, across + 1.1]); }
  [[-28, 0], [-36, 0], [-56, 5], [-70, 5]].forEach(function (d) { doorAcross("z", d[0], d[1]); });
  [28, 48, 64, 74, 98, 106].forEach(function (a) { doorAcross("x", a, 0); });
  [28, 34, 66, 76, 92].forEach(function (a) { doorAcross("z", a, 0); });
  [16, 30, 44].forEach(function (a) { doorAcross("z", a, 40); });
  DOORS.push([38.9, 41.1, 7.3, 9.4]);       // dining to guest lounge
  DOORS.push([47.3, 49.4, 35.9, 38.1]);     // Deimos suite to the garden tube
  DOORS.push([-28.8, -27.2, -1.1, 1.1]);    // loggia to dome link
  DOORS.push([-47.1, -44.9, -12.8, -11.2]); // loggia to observatory link
  DOORS.push([144.8, 152, 9.4, 11.6]);      // hangar suit airlock to outside
  DOORS.push([-1.1, 1.1, -26.4, -24.6], [-1.1, 1.1, 24.6, 26.4], [24.6, 26.4, -1.1, 1.1], [-26.4, -24.6, -1.1, 1.1]); // dome ends of the links
  DOORS.push([-47.1, -44.9, -21.2, -19.6]);  // observatory link into the tower
  DOORS.push([61.4, 63.2, 35.9, 38.1], [85, 86.6, 35.9, 38.1], [89.4, 91, 35.9, 38.1], [72.9, 75.1, 48, 49.6], [72.9, 75.1, 54.4, 56]); // garden tubes
  var BLOCKS = [["r", -3.3, 3.3, 36.7, 63.3], ["c", 11.3, 11.3, 3.5], ["c", 0, 0, 1.4], ["c", 74, 65.5, 2.7], ["r", 2.5, 5.5, 69.4, 72.6], ["r", -7.8, -1.4, 66.4, 75.6], ["c", -3.6, 84, 3.3], ["c", -46, -26, 1.6]];
  var FOOTPRINTS = [["c", 0, 0, 27.6], ["r", -63.2, -26.8, -13.2, 13.2], ["c", -46, -26, 7], ["r", -12.5, 12.5, -95, -25], ["r", 25, 106, -12.5, 12.5], ["r", 103, 147.2, -24.5, 24.5], ["r", -12.5, 12.5, 25, 111], ["r", 27.5, 52.5, 7, 64.5], ["c", 74, 37, 13.4], ["c", 102, 37, 13.4], ["c", 74, 65, 11.4], ["r", 48, 62, 34, 40], ["r", 85, 91, 34, 40], ["r", 71, 77, 48, 56]];

  var STOPS = [
    { id: "arrival", group: "Arrival & grounds", name: "Arrival", where: "From the air", mode: "orbit", pos: [178, 96, 176], look: [38, 0, 4], ceil: "—", shield: "—", area: "total",
      text: "Arcadia Palace sits on the western rim of a mesa above the plains of Arcadia Planitia, 44° north. The wings are buried under regolith for shielding, so from the air the house reads as a glass dome ringed by long red mounds, with an observatory tower, three garden domes and a private landing pad a third of a kilometre east.",
      details: ["Great Dome 52 m across and 26 m high", "Four vaulted wings, each 16 m wide", "Three garden domes and a hangar for two rovers", "Private landing pad 330 m east, down a lit road"],
      mars: ["The site sits over shallow ground ice, so the house mines its own water", "Arcadia is low ground: the air above it is a little thicker than on the highlands, though still under 1 % of Earth's", "Everything faces west over the cliff, because Mars sunsets are blue"] },
    { id: "pad", group: "Arrival & grounds", name: "Landing pad", where: "Grounds · 330 m east", mode: "orbit", pos: [392, 52, 92], look: [322, 6, 0], ceil: "open sky", shield: "blast berm", area: 2830,
      text: "The private landing pad, far enough from the house that rocket blast and grit never reach the glass. Your ship stands on it, ready for trips to orbit. A road of sintered regolith, lit with blue guide lights, runs straight to the hangar door.",
      details: ["Pad 60 m across, fused from local regolith", "Blast berm on the side facing the house", "Blue guide lights every 12 m along the road", "Your ship: a lander for trips to orbit and back"],
      mars: ["Rocket exhaust on loose soil throws gravel faster than a bullet, so the pad is hard-surfaced and kept well away", "The guide lights are blue so they read against the red ground in a dust storm"] },
    { id: "power", group: "Arrival & grounds", name: "Power, water & air", where: "Grounds · north of the house", mode: "orbit", pos: [236, 150, -30], look: [60, 0, -300], ceil: "open sky", shield: "berm", area: 22000,
      text: "The house makes its own power, water and air. A field of 440 solar panels tilts toward the equator, a compact fission plant sits behind a berm half a kilometre north, an ice mine pumps meltwater from the ground, and an oxygen plant splits carbon dioxide out of the Martian air.",
      details: ["440 solar panels in ten rows", "Four compact fission units behind a regolith berm, each about 10 kW", "Ice mine drawing water from ground ice a few metres down", "Oxygen plant beside the hangar"],
      mars: ["Sunlight on Mars is about 43 % as strong as on Earth, and a dust storm can cut it much further; the reactor keeps the lights on", "Making oxygen from Martian CO₂ is the method NASA's MOXIE proved on the Perseverance rover", "NASA tested a small fission reactor of this kind, Kilopower, in 2018"] },

    { id: "dome", group: "The Great Dome", name: "The Great Dome", where: "Living room · centre of the house", mode: "stand", pos: [15.4, 7.9, 15.6], look: [-2, 0.2, -2], ceil: "26 m", shield: "glass", room: "dome",
      text: "The heart of the house. The living room sits in a sunken conversation pit around a column of cold plasma: a fire with nothing to burn. Above it the dome rises 26 m, with a mezzanine ring for walking above the garden and a mobile of polished meteorites turning slowly overhead.",
      details: ["Circular sofa for 16 in cream wool bouclé", "Plasma hearth in a quartz cylinder", "Grand piano under the south glass", "Curved bar in brass and basalt", "Mezzanine ring at 6 m with a glass balustrade", "Mobile of meteorite fragments and light rings"],
      mars: ["The glass is three layers with a water-filled gap: light comes in, much of the radiation does not", "The dome is a pressure vessel first: 70 kPa of air pushes outward on every square metre, far more than its own weight", "Iris shutters close over the glass during a solar storm"] },
    { id: "garden", group: "The Great Dome", name: "Atrium garden", where: "Great Dome · north-east", mode: "stand", pos: [-1.2, 1.7, 9.6], look: [14, 1.6, -13], ceil: "26 m", shield: "glass", room: "dome", areaOverride: 520,
      text: "Fruit trees, moss lawns and a stone path wind around a basalt fountain. Its jets are tuned to Earth heights, and in Mars gravity every arc hangs in the air about 1.6 times longer before it falls.",
      details: ["Dwarf orange, lemon, apple and olive trees", "Moss and clover lawn", "Basalt fountain with slow, tall arcs", "Stepping-stone path in local basalt"],
      mars: ["The plants are part of the air system: they take in CO₂ and give back oxygen and moisture", "Martian daylight is about 43 % of Earth's, so lamps on the mezzanine top up the garden"] },
    { id: "loggia", group: "The Great Dome", name: "Sunset loggia", where: "West wing · on the cliff edge", mode: "stand", pos: [-31, 1.7, 7.6], look: [-80, -6, -6], ceil: "5.5 m", shield: "shuttered", room: "loggia",
      text: "A pressurised glass pavilion on the edge of the cliff, facing west. The sky is butterscotch all afternoon; then the sun goes down in a cold blue halo over the canyon, and after dark Earth comes out as a bright evening star.",
      details: ["Six loungers facing the sunset", "Plasma fire table in basalt", "Sunset bar", "Telescope for Earth and Phobos", "Glass walls 34 m long"],
      mars: ["Fine dust scatters blue light forward, around the sun, so Mars sunsets are blue", "Phobos rises in the west and crosses the sky twice a sol", "Earth and the Moon show as two points of light after sunset"] },
    { id: "observatory", group: "The Great Dome", name: "Observatory tower", where: "Tower · 26 m up", mode: "stand", pos: [-43.6, 27.9, -23.6], look: [-120, 12, -46], ceil: "cupola", shield: "shuttered", room: "tower",
      text: "A 26 m tower with a glass cupola and a 50 cm telescope. From the top you can see across Arcadia Planitia to the knobs of Erebus Montes, and at night pick out Earth and the Moon as two points of light.",
      details: ["Spiral stair around a glass lift", "Three reclining chairs for sky-watching", "50 cm reflecting telescope", "Glass cupola 12 m across"],
      mars: ["A message to Earth takes between 3 and 22 minutes, depending on where the planets are", "The thin air barely makes stars twinkle"] },

    { id: "foyer", group: "Private wing", name: "Private gallery", where: "Private wing · entrance", mode: "stand", pos: [-2.6, 1.7, -29.1], look: [2, 1.3, -36.5], ceil: "6.8 m", shield: "3 m berm", room: "foyer",
      text: "A gallery leads from the dome into the private wing: paintings along the walls, a single meteorite on a basalt plinth, and daylight coming down through light pipes in the vault.",
      details: ["Meteorite on a basalt plinth", "Four paintings in brass frames", "Light pipes bring real sunlight through the berm", "A pressure door can seal the wing off"],
      mars: ["Every wing can seal itself, so a leak in one part never empties the rest of the house", "Above the vault lie 3 m of regolith"] },
    { id: "bedroom", group: "Private wing", name: "Master bedroom", where: "Private wing", mode: "stand", pos: [5.8, 1.7, -37.4], look: [-3, 0.9, -50.5], ceil: "6.8 m", shield: "3 m berm", room: "bedroom",
      text: "The most shielded room in the house: you spend a third of your life asleep, so it sits deepest under the berm. The ceiling over the bed is a screen that shows the sky above the dome, or an Earth sky if you would rather wake up to blue.",
      details: ["King bed on a walnut platform with a brass canopy", "Sky ceiling with a live Mars sky or an Earth sky", "Reading corner with two armchairs", "Rug woven with the contour lines of Olympus Mons", "Earth window on the west wall"],
      mars: ["Shielding: 3 m of regolith plus a water jacket in the vault", "Lighting drifts across the 24 h 39 min sol so your body clock keeps up"] },
    { id: "bath", group: "Private wing", name: "Bath & dressing", where: "Private wing", mode: "stand", pos: [5.6, 1.7, -57.2], look: [-3, 0.8, -66], ceil: "6.8 m", shield: "3 m berm", room: "bath",
      text: "Bath and dressing room in stone and walnut. Water moves slowly here: a ripple crosses the tub at about 60 % of its speed on Earth, and drops from the rain shower fall gently.",
      details: ["Soaking tub cut from one block of basalt", "Rain shower for two behind glass", "Twin vanities with backlit mirrors", "Dressing island and walnut wardrobes", "Heated stone floor"],
      mars: ["All water is recycled; the ISS already recovers 98 % of its water, and this house aims higher", "Hot water is cheap: waste heat from the reactor warms it"] },
    { id: "study", group: "Private wing", name: "Study & storm shelter", where: "Private wing · far end", mode: "stand", pos: [5.2, 1.7, -71.3], look: [-1, 1.3, -86], ceil: "6.8 m", shield: "berm + water", room: "study",
      text: "The quietest room in the house doubles as the storm shelter. Its side walls hold a metre of water, the best shield there is per kilogram, and it stores three weeks of supplies. The desk faces a live link to Earth.",
      details: ["Walnut desk facing the Earth link", "The link shows the light delay to Earth", "Water walls 1 m thick, lit from behind", "Three weeks of food, water and oxygen"],
      mars: ["Solar storms arrive with hours of warning; the shelter is for those hours", "Hydrogen-rich water stops radiation better than the same weight of metal"] },

    { id: "dining", group: "Social wing", name: "Grand dining", where: "Social wing", mode: "stand", pos: [29.3, 1.8, -6.4], look: [40, 0.7, 1], ceil: "6.8 m", shield: "3 m berm", room: "dining",
      text: "A dining hall for twelve under a lit vault. The walnut table is the one piece of furniture shipped from Earth; everything else was printed or grown here.",
      details: ["Walnut table for twelve", "Two brass ring chandeliers", "Basalt sideboard under a large painting", "Door to the guest wing"],
      mars: ["At 0.38 g a solid chair weighs what a folding chair does on Earth", "Dinner guests on Earth join by video, with a pause of several minutes each way"] },
    { id: "kitchen", group: "Social wing", name: "Chef's kitchen", where: "Social wing", mode: "stand", pos: [49.3, 1.8, -5.6], look: [58, 0.9, 2], ceil: "6.8 m", shield: "3 m berm", room: "kitchen",
      text: "A chef's kitchen stocked straight from the greenhouses, with an herb wall that grows under its own lights. Cooking is by induction: nothing burns inside a sealed house.",
      details: ["Basalt island 6 m long, seats five", "Induction range and steam ovens", "Herb wall of basil, mint and chives", "Walk-in pantry and cold store"],
      mars: ["At the house's 70 kPa, water boils at about 90 °C, so pasta takes a little longer", "Outside, water would boil away almost as soon as it melted"] },
    { id: "cellar", group: "Social wing", name: "Wine & tea cellar", where: "Social wing", mode: "stand", pos: [64.9, 1.7, 1.4], look: [73, 1.2, -4], ceil: "6.8 m", shield: "3 m berm", room: "cellar",
      text: "A cool, dim room for wine brought from Earth, tea grown in the greenhouses, and the first vintage from the orchard's own vines.",
      details: ["Racks for 900 bottles", "Tea wall of glass jars", "Tasting table in basalt", "Oak barrels for the house wine"],
      mars: ["The ground outside averages about −60 °C, so keeping a cellar cool costs nothing; the work is keeping it warm enough"] },
    { id: "library", group: "Social wing", name: "Library & meteorites", where: "Social wing", mode: "stand", pos: [75.1, 2.0, 5.8], look: [92, 2.0, -2], ceil: "6.8 m", shield: "3 m berm", room: "library",
      text: "Floor-to-vault books with a rolling ladder, and down the middle a collection in glass cases: meteorites that fell on Earth after being knocked off Mars, brought home again.",
      details: ["Shelves for about 6,000 books", "Brass rolling ladder", "Eight cases of Martian meteorites", "Reading chairs and a 1.2 m Mars globe"],
      mars: ["Scientists have identified a few hundred meteorites on Earth that came from Mars", "In 0.38 g a full shelf of books weighs 38 % of what it would at home"] },

    { id: "pool", group: "Wellness wing", name: "Low-gravity pool", where: "Wellness wing", mode: "stand", pos: [6.2, 2.0, 35.3], look: [-1.5, -0.3, 56], ceil: "6.8 m", shield: "3 m berm", room: "pool",
      text: "A 26 m pool where swimming feels different. In 0.38 g, waves roll at about 60 % of their Earth speed, and a splash rises more than twice as high before it falls back.",
      details: ["Pool 26 m by 6 m, 1.8 m deep", "Heated to 29 °C", "Wave machine for slow, tall waves", "Loungers along both sides"],
      mars: ["The pool is the house's thermal battery and its emergency water reserve", "Buoyancy feels the same as on Earth: both your weight and the water's push drop by the same amount"] },
    { id: "sauna", group: "Wellness wing", name: "Sauna & cold plunge", where: "Wellness wing", mode: "stand", pos: [5.6, 1.7, 66.9], look: [-3.5, 1.2, 73.5], ceil: "6.8 m", shield: "3 m berm", room: "sauna",
      text: "A cedar sauna, a cold plunge at 8 °C and a spa foyer with robes and towels. After the heat, stepping into the plunge feels like sinking in slow motion.",
      details: ["Cedar sauna for eight at 85 °C", "Cold plunge at 8 °C", "Spa foyer with robes and towels", "Rain shower between the two"],
      mars: ["The sauna runs on waste heat from the house's reactor"] },
    { id: "gym", group: "Wellness wing", name: "Gym & centrifuge", where: "Wellness wing", mode: "stand", pos: [5.8, 1.8, 77.1], look: [-3.6, 0.8, 85], ceil: "6.8 m", shield: "3 m berm", room: "gym",
      text: "A gym built around a short-arm centrifuge: lie down, spin, and feel your Earth weight for half an hour. It keeps bones and muscles ready for a trip home.",
      details: ["Short-arm centrifuge with two beds", "Treadmill with a bungee harness", "Free weights and cable rack", "Mat for stretching"],
      mars: ["Over months at 0.38 g, bones and muscles weaken; daily loading slows that down", "Spinning at about 20 turns a minute on a 2.8 m arm gives close to Earth gravity at the feet"] },
    { id: "zen", group: "Wellness wing", name: "Zen garden", where: "Wellness wing · far end", mode: "stand", pos: [5.5, 1.7, 92.8], look: [-1, 0.2, 100], ceil: "6.8 m", shield: "3 m berm", room: "zen",
      text: "The quietest end of the wellness wing: raked Martian sand, three dark stones from the mesa and a juniper bonsai.",
      details: ["Garden of raked regolith", "Three basalt stones", "Juniper bonsai on a plinth", "Floor cushions and a singing bowl"],
      mars: ["Martian soil contains perchlorate salts; this sand was washed before it came indoors"] },

    { id: "guestlounge", group: "Guest wing", name: "Guest lounge", where: "Guest wing", mode: "stand", pos: [44.2, 1.7, 9.7], look: [33, 1.1, 14], ceil: "6.8 m", shield: "3 m berm", room: "glounge",
      text: "Where guests land after the long trip: a lounge with a coffee bar and a wall of arrival photos, each taken on the landing pad.",
      details: ["Sofa and two armchairs", "Coffee bar", "Wall of arrival photos", "Handrails everywhere for the first days"],
      mars: ["New arrivals need a few days to get used to 0.38 g: they bound when they mean to walk"] },
    { id: "guests", group: "Guest wing", name: "Guest suites", where: "Guest wing", mode: "stand", pos: [46.8, 1.7, 17.2], look: [34, 0.8, 22], ceil: "6.8 m", shield: "3 m berm", rooms: ["phobos", "deimos", "earthS"],
      text: "Three suites named after what you can see in the night sky from here: Phobos, Deimos and Earth. Each has a queen bed, a reading chair, a desk and its own shower.",
      details: ["Phobos, Deimos and Earth suites", "Queen bed and reading chair in each", "Private shower and vanity", "Deimos suite opens onto the garden domes"],
      mars: ["A guest's body clock drifts about 40 minutes every sol; the lighting helps it keep up"] },

    { id: "greenhouse", group: "Gardens", name: "Kitchen garden", where: "Garden dome 1", mode: "stand", pos: [64.6, 1.8, 38.4], look: [80, 1.2, 31], ceil: "12 m dome", shield: "glass", room: "g1",
      text: "Vegetables and herbs in raised beds under glass and grow lights. It feeds the kitchen and cleans the air.",
      details: ["Raised beds of tomatoes, lettuce and strawberries", "Grow lights for dust-storm days", "Compost and worm beds", "Bench for an evening walk"],
      mars: ["Martian soil is washed of perchlorates and mixed with compost before anything grows in it", "In a dust storm the grow lights take over completely"] },
    { id: "grain", group: "Gardens", name: "Field greenhouse", where: "Garden dome 2", mode: "stand", pos: [92.6, 1.8, 38.8], look: [108, 0.8, 30], ceil: "12 m dome", shield: "glass", room: "g2",
      text: "The staples: wheat, potatoes and beans in dense rows under a dome 24 m across.",
      details: ["Wheat, potatoes and beans", "Drip irrigation from the ice mine", "Harvest store next door"],
      mars: ["The glass filters Mars's strong ultraviolet light; Mars has almost no ozone layer"] },
    { id: "orchard", group: "Gardens", name: "Orchard dome", where: "Garden dome 3", mode: "stand", pos: [72.5, 1.8, 56.6], look: [76, 1.8, 69], ceil: "10 m dome", shield: "glass", room: "g3",
      text: "Fruit trees around a reflecting pond, a row of vines for the house wine, and a beehive.",
      details: ["Apple, pear, cherry, fig and orange trees", "Vine row for the house wine", "Beehive and hand pollination", "Reflecting pond"],
      mars: ["Trees here grow tall and thin in low gravity, so they are pruned hard and tied in"] },

    { id: "hangar", group: "Service", name: "Hangar & suit room", where: "East end", mode: "stand", pos: [108.4, 3.6, 17.2], look: [128, 1.5, -2], ceil: "10 m", shield: "berm", rooms: ["boot", "hangar"],
      text: "Where the house meets Mars. Two pressurised rovers park inside, suits hang ready on the wall, and dust is stopped before it gets any further. A suit airlock in the east wall leads outside.",
      details: ["Two pressurised rovers", "Four suits on the suitport wall", "Dust lock with air jets", "Workshop, spare wheels and a boot room"],
      mars: ["Martian dust is fine, clingy and full of perchlorates: it never comes indoors", "Suitports let you climb into a suit from inside, without letting dust in"] }
  ];
  var STOP = {};
  // called once every part of the estate has added its rooms and stops
  function indexStops() {
  // keep each group together, with the journey first
  var GO = []; STOPS.forEach(function (s) { if (GO.indexOf(s.group) < 0) GO.push(s.group); });
  GO.splice(GO.indexOf("The journey"), 1); GO.unshift("The journey");
  STOPS.forEach(function (s, i) { s.o = i; }); STOPS.sort(function (a, b) { return GO.indexOf(a.group) - GO.indexOf(b.group) || a.o - b.o; });
  ROOMS.forEach(function (r) { r.lv = r.lv || 0; if (r.lv) DEEP_AREA += areaOf(r); else TOTAL_AREA += areaOf(r); });
  STOPS.forEach(function (s, i) { s.i = i; STOP[s.id] = s; });
  STOPS.forEach(function (s) {
    if (s.area === "total") s.areaVal = TOTAL_AREA;
    else if (s.area === "deep") s.areaVal = DEEP_AREA;
    else if (typeof s.area === "number") s.areaVal = s.area;
    else if (s.areaOverride) s.areaVal = s.areaOverride;
    else { var ids = s.rooms || [s.room]; s.areaVal = ROOMS.filter(function (r) { return ids.indexOf(r.id) >= 0; }).reduce(function (a, r) { return a + areaOf(r); }, 0); }
  });
  }
  var LIGHT_ANCHORS = [[0, 5, 0], [12, 4, -12], [11, 3, 11], [-8, 4, 12], [-15, 4, -10], [-45, 5.1, 0], [-46, 4, -26], [-46, 28.5, -26], [0, 3.4, -32], [-1, 3.6, -49], [3, 3.4, -42], [0, 3.4, -63], [0, 3.4, -79],
    [38, 3.4, 0], [56, 3.4, 0], [69, 3.2, 0], [80, 3.4, 0], [92, 3.4, 0], [102, 3.2, 0], [118, 8, -8], [118, 8, 8], [136, 8, 0], [0, 3.2, 31], [0, 3.4, 42], [0, 3.4, 58], [0, 3.2, 71], [0, 3.4, 84], [0, 3.2, 98],
    [40, 3.2, 12], [40, 3.2, 23], [40, 3.2, 37], [40, 3.2, 51], [74, 5, 37], [102, 5, 37], [74, 5, 65]];

  /* ============================== building the palace ============================== */
  var dyn = {}; // animated things
  function buildPalace(progress) {
    var S = 3.6, R = 3.2;
    progress("Laying the Great Dome", 0.3);
    // ---------- Great Dome ----------
    var floorRing = new THREE.RingGeometry(8, 26, 96, 1); floorRing.rotateX(-Math.PI / 2); addGeo("terrazzo", floorRing, mat4(0, 0.001, 0, 0, 1, 1, 1));
    var pathRing = new THREE.RingGeometry(9.2, 10.4, 96, 1); pathRing.rotateX(-Math.PI / 2); addGeo("basalt", pathRing, mat4(0, 0.006, 0, 0, 1, 1, 1));
    glassDome(0, 0, 26, 2.2, [0, Math.PI / 2, Math.PI, -Math.PI / 2, -Math.PI / 4], { ribs: 8, ribR: 0.22 });
    // sunken conversation pit
    var pitStep = new THREE.RingGeometry(7, 8, 72, 1); pitStep.rotateX(-Math.PI / 2); addGeo("terrazzo", pitStep, mat4(0, -0.45, 0, 0, 1, 1, 1));
    var pitFloor = new THREE.CircleGeometry(7, 72); pitFloor.rotateX(-Math.PI / 2); addGeo("terrazzo", pitFloor, mat4(0, -0.9, 0, 0, 1, 1, 1));
    var riser1 = new THREE.CylinderGeometry(8, 8, 0.45, 72, 1, true), riser2 = new THREE.CylinderGeometry(7, 7, 0.45, 72, 1, true);
    addGeo("stoneDS", riser1, mat4(0, -0.225, 0, 0, 1, 1, 1)); addGeo("stoneDS", riser2, mat4(0, -0.675, 0, 0, 1, 1, 1));
    var pitRug = new THREE.Mesh(new THREE.CircleGeometry(6.4, 64), new THREE.MeshStandardMaterial({ map: TEX.contour, roughness: 1, normalMap: TX.carpet.normalMap }));
    pitRug.rotation.x = -Math.PI / 2; pitRug.position.y = -0.885; pitRug.receiveShadow = true; put(pitRug);
    YOFF = -0.9;
    for (var k = 0; k < 26; k++) {
      var a = (k + 0.5) / 26 * Math.PI * 2;
      if (Math.abs(Math.cos(a)) > 0.965) continue; // openings east and west
      var ry = Math.atan2(-Math.cos(a), -Math.sin(a));
      var f = new F(Math.cos(a) * 5.95, Math.sin(a) * 5.95, ry);
      f.box("fabCream", 1.5, 0.42, 1.0, 0, 0.1, 0).box("fabCream", 1.55, 0.55, 0.3, 0, 0.5, -0.36).box("fabSand", 1.3, 0.13, 0.7, 0, 0.52, 0.08);
      if (k % 3 === 0) f.box(k % 2 ? "fabRust" : "fabBlue", 0.45, 0.4, 0.14, 0, 0.62, -0.18, 0, null, -0.2);
    }
    [0.6, 2.2, 3.8, 5.4].forEach(function (a2) { tableRound(Math.cos(a2) * 3.7, Math.sin(a2) * 3.7, 0.55, 0.42, "basalt"); });
    YOFF = 0;
    // hearth: cold plasma in a quartz cylinder
    cyl("basalt", 1.25, 0.5, 0, -0.9, 0, 32); cyl("gold", 1.3, 0.06, 0, -0.42, 0, 32); cyl("gold", 1.05, 0.08, 0, 2.7, 0, 32);
    var hearthMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "uniform float uT; varying vec2 vUv; varying vec3 vP;",
        "float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }",
        "float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }",
        "void main(){",
        "  float y = vUv.y; float a = vUv.x * 6.2831;",
        "  float f = n(vec2(vUv.x * 8.0, y * 3.0 - uT * 1.3)) * 0.6 + n(vec2(vUv.x * 17.0 + 3.0, y * 6.0 - uT * 2.1)) * 0.4;",
        "  float body = smoothstep(1.0, 0.1, y) * (0.35 + f);",
        "  vec3 c = mix(vec3(1.0, 0.45, 0.18), vec3(0.55, 0.75, 1.0), smoothstep(0.2, 0.9, y + 0.3 * f));",
        "  gl_FragColor = vec4(c * body * 2.2, body);",
        "}"
      ].join("\n")
    });
    var hearth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 3.1, 32, 1, true), hearthMat); hearth.position.set(0, 1.15, 0); put(hearth);
    dyn.hearth = hearthMat;
    cylC("glass", 1.0, 3.1, 0, 1.15, 0, 32);
    // mezzanine ring and spiral stair
    var mzTop = new THREE.RingGeometry(21, 25, 96, 1); mzTop.rotateX(-Math.PI / 2); addGeo("terrazzo", mzTop, mat4(0, 6.3, 0, 0, 1, 1, 1));
    var mzBot = new THREE.RingGeometry(21, 25, 96, 1); mzBot.rotateX(Math.PI / 2); addGeo("plaster", mzBot, mat4(0, 6.0, 0, 0, 1, 1, 1));
    addGeo("stoneDS", new THREE.CylinderGeometry(21, 21, 0.3, 96, 1, true), mat4(0, 6.15, 0, 0, 1, 1, 1));
    addGeo("glass", new THREE.CylinderGeometry(21, 21, 1.1, 96, 1, true), mat4(0, 6.85, 0, 0, 1, 1, 1)); var rail = new THREE.TorusGeometry(21, 0.04, 6, 128); addGeo("gold", rail, mat4(0, 7.42, 0, 0, 1, 1, 1, Math.PI / 2));
    var ledRing = new THREE.TorusGeometry(21.05, 0.03, 4, 128); addGeo("lampSoft", ledRing, mat4(0, 5.98, 0, 0, 1, 1, 1, Math.PI / 2));
    for (var c = 0; c < 12; c++) { var ca = (c + 0.5) / 12 * Math.PI * 2; cyl("gold", 0.16, 6, Math.cos(ca) * 21.2, 0, Math.sin(ca) * 21.2, 12); }
    var sx = Math.cos(2.36) * 18.4, sz = Math.sin(2.36) * 18.4;
    cyl("gold", 0.18, 6.4, sx, 0, sz, 12);
    for (var st = 0; st < 30; st++) { var sa = 2.36 - Math.PI * 1.6 + st / 29 * Math.PI * 1.6; var f2 = new F(sx + Math.cos(sa) * 1.15, sz + Math.sin(sa) * 1.15, Math.PI / 2 - sa); f2.box("wood", 0.35, 0.06, 1.9, 0, st * 6.1 / 29, 0); }
    // mezzanine planters and loungers
    [0.3, 1.1, 3.4, 4.3, 5.2].forEach(function (a3) { var x3 = Math.cos(a3) * 23.6, z3 = Math.sin(a3) * 23.6; YOFF = 6.3; plant(x3, z3, 1.3, "terracotta"); YOFF = 0; });
    YOFF = 6.3; lounger(Math.cos(0.7) * 23.2, Math.sin(0.7) * 23.2, Math.atan2(-Math.cos(0.7), -Math.sin(0.7)), "fabTeal"); lounger(Math.cos(0.9) * 23.2, Math.sin(0.9) * 23.2, Math.atan2(-Math.cos(0.9), -Math.sin(0.9)), "fabTeal"); YOFF = 0;
    // meteorite mobile and light rings
    var mobile = new THREE.Group(), rr = mulberry(12);
    for (var m = 0; m < 26; m++) {
      var ma = rr() * Math.PI * 2, mr = 1 + rr() * 6.5, my = 11 + rr() * 6;
      var g = new THREE.DodecahedronGeometry(0.28 + rr() * 0.45, 0); var rock = new THREE.Mesh(g, M.meteor); rock.position.set(Math.cos(ma) * mr, my, Math.sin(ma) * mr); rock.rotation.set(rr() * 3, rr() * 3, 0); rock.castShadow = true; mobile.add(rock);
      var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 25.5 - my, 3), M.gold); wire.position.set(rock.position.x, (25.5 + my) / 2, rock.position.z); mobile.add(wire);
    }
    var lr1 = new THREE.Mesh(new THREE.TorusGeometry(5, 0.06, 6, 96), M.lamp); lr1.rotation.x = Math.PI / 2; lr1.position.y = 14.2; mobile.add(lr1);
    var lr2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.05, 6, 80), M.lamp); lr2.rotation.x = Math.PI / 2; lr2.position.y = 16.8; mobile.add(lr2);
    var lr3 = new THREE.Mesh(new THREE.TorusGeometry(5.06, 0.05, 6, 96), M.gold); lr3.rotation.x = Math.PI / 2; lr3.position.y = 14.26; mobile.add(lr3);
    put(mobile); dyn.mobile = mobile;
    // piano, bar and lounge chairs
    piano(Math.cos(1.92) * 15.2, Math.sin(1.92) * 15.2, -2.6);
    for (var b = 0; b < 9; b++) { var ba = 3.52 + b * 0.075; var fb = new F(Math.cos(ba) * 22.2, Math.sin(ba) * 22.2, -ba); fb.box("basalt", 0.75, 1.08, 1.75, 0, 0, 0).box("gold", 0.8, 0.05, 1.76, 0, 1.08, 0).box("lampSoft", 0.04, 0.04, 1.7, -0.4, 0.12, 0); stool(Math.cos(ba) * 21.1, Math.sin(ba) * 21.1, "fabRust"); }
    for (var sh = 0; sh < 6; sh++) { var sa2 = 3.55 + sh * 0.1; var fs = new F(Math.cos(sa2) * 24.9, Math.sin(sa2) * 24.9, -sa2); fs.box("woodDark", 0.35, 2.2, 1.6, 0, 0, 0); for (var bt = 0; bt < 6; bt++) fs.cyl(bt % 2 ? "bottle" : "bottle2", 0.045, 0.3, 0.05, 1.2 + (bt % 2) * 0.5, -0.6 + bt * 0.24, 8); }
    [1.13, 1.31].forEach(function (a5) { armchair(Math.cos(a5) * 17, Math.sin(a5) * 17, Math.atan2(-Math.cos(a5), -Math.sin(a5)), "fabTeal"); });
    tableRound(Math.cos(1.22) * 18, Math.sin(1.22) * 18, 0.45, 0.5, "basalt"); floorLamp(Math.cos(1.22) * 19.2, Math.sin(1.22) * 19.2, 1.7);
    // garden: trees, moss lawns, fountain
    var moss = new THREE.CircleGeometry(7.5, 48); moss.rotateX(-Math.PI / 2); addGeo("moss", moss, mat4(14.2, 0.012, -13.5, 0, 1, 1, 1));
    var moss2 = new THREE.CircleGeometry(4.5, 40); moss2.rotateX(-Math.PI / 2); addGeo("moss", moss2, mat4(-13, 0.012, -9, 0, 1, 1, 1));
    [[20.5, -5.5, "fruitO", 1.1], [17.5, -8.8, "fruitY", 1], [8.6, -17.2, "fruitR", 1.05], [5.2, -21.4, null, 1.2], [19.5, -12.8, "fruitO", 0.95], [11.5, -20.5, "fruitR", 1], [-13.5, -8.5, null, 1.2], [-10.5, -12.5, "fruitY", 0.9]].forEach(function (t) { tree(t[0], t[1], t[3], t[2]); });
    for (var ps = 0; ps < 9; ps++) { var pa = -0.95 + ps * 0.14; cyl("basalt", 0.42, 0.04, Math.cos(pa) * 13.2, 0.012, Math.sin(pa) * 13.2, 12); }
    var fx = Math.cos(0.785) * 16, fz = Math.sin(0.785) * 16;
    cyl("basalt", 3.2, 0.55, fx, 0, fz, 40); cyl("waterBlue", 2.95, 0.02, fx, 0.5, fz, 40); cyl("basalt", 0.5, 1.2, fx, 0, fz, 16); cyl("gold", 0.62, 0.08, fx, 1.2, fz, 16);
    dyn.fountain = makeFountain(fx, fz);
    [[20, 6], [6, 21], [-21, -3], [-6, -21.5], [-3, 21.5], [21.5, -3]].forEach(function (p2) { plant(p2[0], p2[1], 1.4, "terracotta"); });
    [[3.2, -22.5], [22.5, 3.2]].forEach(function (p3) { plant(p3[0], p3[1], 1.1); });

    progress("Opening the wings", 0.45);
    // ---------- links from the dome ----------
    link("z", -28, -25.4, 0); link("x", 25.4, 28, 0); link("z", 25.4, 28, 0); link("x", -28, -25.4, 0);

    // ---------- private wing (north) ----------
    wing({ axis: "z", center: 0, a0: -88, a1: -28, cap0: 6, cap1: 1.5, seed: 3, cuts: [[-28, [0]], [-36, [0]], [-56, [5]], [-70, [5]], [-88, []]] });
    floorRect("terrazzo", -8, 8, -36, -28); floorRect("floorOak", -8, 8, -56, -36); floorRect("stone", -8, 8, -70, -56); floorRect("floorOak", -8, 8, -88, -70);
    // gallery
    painting(TEX.art[0], 1.6, 2.0, -7.94, 2.0, -30.6, Math.PI / 2); painting(TEX.art[1], 1.6, 2.0, -7.94, 2.0, -33.6, Math.PI / 2);
    painting(TEX.art[2], 1.6, 2.0, 7.94, 2.0, -30.6, -Math.PI / 2); painting(TEX.art[3], 1.6, 2.0, 7.94, 2.0, -33.6, -Math.PI / 2);
    plinth(4.6, -32.2, 1.05, function (x, h, z) { meteorite(x, h, z, 1.3); }); box("led", 0.7, 0.02, 0.7, 4.6, 6.4, -32.2);
    box("woodDark", 2.2, 0.45, 0.55, -6.9, 0, -32.1, Math.PI / 2); rug("fabRust", 0, -32, 2.2, 7.4);
    plant(-6.9, -29, 1.2); plant(6.9, -35, 1.2);
    // master bedroom
    bed(-2.5, -54.1, 0, 2.4, 2.6, "fabBlue", "fabGold"); canopy(-2.5, -54.1, 0, 2.4, 2.6, 2.7);
    var bedRug = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 6.2), new THREE.MeshStandardMaterial({ map: TEX.contour, roughness: 1, normalMap: TX.carpet.normalMap })); bedRug.rotation.x = -Math.PI / 2; bedRug.position.set(-2.5, 0.012, -52.8); bedRug.receiveShadow = true; put(bedRug);
    box("fabSand", 1.9, 0.45, 0.5, -2.5, 0, -51.6); // bench at the foot of the bed
    var skyC = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.0), new THREE.MeshBasicMaterial({ map: TEX.earthSky, toneMapped: false })); skyC.rotation.x = Math.PI / 2; skyC.position.set(-2.5, 5.7, -53.6); put(skyC);
    box("gold", 4.4, 0.08, 0.1, -2.5, 5.62, -56.15); box("gold", 4.4, 0.08, 0.1, -2.5, 5.62, -51.05); box("gold", 0.1, 0.08, 5.2, -4.75, 5.62, -53.6); box("gold", 0.1, 0.08, 5.2, -0.25, 5.62, -53.6);
    screen(TEX.earthLink, 3.6, 1.8, -7.92, 2.2, -45.5, Math.PI / 2, true);
    armchair(4.6, -41.2, -Math.PI / 2 - 0.35, "fabTeal"); armchair(4.6, -43.9, -Math.PI / 2 + 0.35, "fabTeal"); tableRound(5.6, -42.6, 0.4, 0.55, "basalt"); floorLamp(6.8, -40.3, 1.7);
    box("woodDark", 3.2, 0.85, 0.55, 7.35, 0, -48.5, Math.PI / 2); tableLamp(7.35, 0.85, -47.4); plant(6.9, -54.5, 1.3); plant(-6.9, -38, 1.1);
    rug("fabCream", 4.9, -42.6, 3.2, 4.2);
    // bath and dressing
    box("basalt", 2.3, 0.62, 1.25, 0, 0, -67.3); box("waterBlue", 2.0, 0.02, 0.95, 0, 0.56, -67.3); box("gold", 0.08, 0.35, 0.08, 0, 0.62, -67.95); cyl("lamp", 0.15, 0.02, 0, 5.5, -67.3, 16);
    box("glass", 2.1, 2.4, 0.04, -5, 0, -66.4); box("glass", 0.04, 2.4, 2.0, -3.95, 0, -67.4); box("slate", 2.1, 0.06, 2.0, -5, 0, -67.4); cyl("gold", 0.3, 0.03, -5, 2.35, -67.4, 20);
    box("stone", 0.6, 0.86, 4.2, -7.35, 0, -60); cyl("ceramic", 0.22, 0.12, -7.3, 0.86, -58.9, 20); cyl("ceramic", 0.22, 0.12, -7.3, 0.86, -61.1, 20); box("mirror", 0.03, 1.2, 3.8, -7.66, 1.3, -60); box("lampSoft", 0.04, 0.05, 3.9, -7.6, 2.55, -60);
    box("wood", 1.3, 0.95, 2.4, 3, 0, -60.5); box("stone", 1.34, 0.04, 2.44, 3, 0.95, -60.5);
    for (var wd = 0; wd < 4; wd++) { box("wood", 0.62, 2.7, 1.7, 7.35, 0, -57.2 - wd * 1.75); box("gold", 0.04, 0.9, 0.04, 7.02, 0.9, -57.2 - wd * 1.75 + 0.7); }
    rug("fabSand", 3, -60.5, 2.6, 3.4); plant(-6.9, -69, 1.1);
    // study and storm shelter
    tableRect(0, -83, 2.6, 0.9, 0.76, "wood", "gold"); box("woodDark", 0.5, 0.7, 0.8, 0.9, 0, -83); chair(0, -81.9, Math.PI, "fabRust"); tableLamp(-1, 0.76, -83.2);
    screen(TEX.earthLink, 6, 3, 0, 2.2, -87.74, 0, true);
    box("waterWall", 0.9, 3.4, 12.5, -7.2, 0, -79.8); box("waterWall", 0.9, 3.4, 12.5, 7.2, 0, -79.8); box("ledBlue", 0.05, 0.05, 12.4, -6.72, 0.05, -79.8); box("ledBlue", 0.05, 0.05, 12.4, 6.72, 0.05, -79.8);
    armchair(3.6, -74.6, -2.3, "fabBlue"); floorLamp(4.6, -73.4, 1.6); bookcase(-3.8, -70.55, Math.PI, 5.5, 3.1, 6);
    box("steel", 1.4, 2.2, 0.8, -6.9, 0, -71.2); box("steel", 1.4, 2.2, 0.8, 6.9, 0, -72.2); rug("fabBlue", 0, -82, 4, 3);

    progress("Furnishing the social wing", 0.55);
    // ---------- social wing (east) ----------
    wing({ axis: "x", center: 0, a0: 28, a1: 106, cap0: 1.5, cap1: 0.2, bermEnd: 105.8, seed: 7, gapsPos: [[38.8, 41.2]], cuts: [[28, [0]], [48, [0]], [64, [0]], [74, [0]], [98, [0]], [106, [0]]] });
    floorRect("floorOak", 28, 48, -8, 8); floorRect("stone", 48, 64, -8, 8); floorRect("slate", 64, 74, -8, 8); floorRect("floorWalnut", 74, 98, -8, 8); floorRect("slate", 98, 106, -8, 8);
    // dining
    tableRect(38, 0, 10, 2.2, 0.76, "wood", "wood"); box("wood", 9.2, 0.62, 0.3, 38, 0.1, 0);
    [-4, -2, 0, 2, 4].forEach(function (dx) { chair(38 + dx, -1.45, 0, "fabSand"); chair(38 + dx, 1.45, Math.PI, "fabSand"); });
    chair(32.4, 0, Math.PI / 2, "fabRust"); chair(43.6, 0, -Math.PI / 2, "fabRust");
    [35, 41].forEach(function (cx) { var t1 = new THREE.TorusGeometry(1.5, 0.05, 6, 64); addGeo("lamp", t1, mat4(cx, 3.1, 0, 0, 1, 1, 1, Math.PI / 2)); addGeo("gold", new THREE.TorusGeometry(1.55, 0.04, 6, 64), mat4(cx, 3.14, 0, 0, 1, 1, 1, Math.PI / 2)); cyl("gold", 0.01, 3.6, cx - 1.5, 3.1, 0, 3); cyl("gold", 0.01, 3.6, cx + 1.5, 3.1, 0, 3); });
    box("basalt", 5, 0.9, 0.55, 38, 0, -7.35); painting(TEX.art[4], 4.2, 2.0, 38, 2.35, -7.94, 0);
    [36, 40].forEach(function (x) { cyl("gold", 0.12, 0.25, x, 0.9, -7.35, 12); }); plant(29.4, 6.9, 1.3); plant(46.7, -7, 1.3); plant(46.7, 6.8, 1.2); rug("fabBlue", 38, 0, 11.5, 4.4);
    // kitchen
    box("wood", 6, 0.88, 1.3, 56, 0, 2.6); box("basalt", 6.1, 0.05, 1.4, 56, 0.88, 2.6); [53.8, 55, 56.2, 57.4, 58.6].forEach(function (x) { stool(x, 3.95, "fabTeal"); });
    box("wood", 13, 0.88, 0.66, 55.5, 0, -7.34); box("basalt", 13.1, 0.05, 0.7, 55.5, 0.88, -7.34); box("black", 1.2, 0.02, 0.55, 53, 0.93, -7.34); box("steel", 0.9, 0.05, 0.5, 58, 0.9, -7.34); cyl("gold", 0.02, 0.4, 58, 0.93, -7.6, 6);
    box("steel", 1.3, 1.0, 0.6, 53, 2.1, -7.4); box("steel", 0.5, 2.6, 0.4, 53, 3.1, -7.6); box("wood", 8, 0.9, 0.4, 58, 2.2, -7.55); box("steel", 1.6, 2.6, 0.66, 63, 0, -7.34);
    box("black", 8.2, 2.3, 0.1, 54, 0.4, 7.7); for (var hr = 0; hr < 5; hr++) for (var hc = 0; hc < 12; hc++) sph(hc % 3 ? "leaf" : "leaf3", 0.13, 50.4 + hc * 0.66, 0.75 + hr * 0.42, 7.58, 6);
    box("ledGreen", 8, 0.04, 0.05, 54, 2.62, 7.62); [54.2, 56, 57.8].forEach(function (x) { pendant(x, 3.1, 2.6); cyl("gold", 0.01, 2.3, x, 4.3, 2.6, 4); });
    // cellar
    [-7.3, 7.3].forEach(function (z, si) {
      box("woodDark", 8.6, 2.9, 0.5, 69, 0, z);
      for (var ry2 = 0; ry2 < 12; ry2++) for (var rc = 0; rc < 40; rc++) {
        var xx = 64.95 + rc * 0.205, yy = 0.2 + ry2 * 0.225;
        if (si === 1 && rc > 24) { if (ry2 % 3 === 0) cyl("jar", 0.07, 0.18, xx, yy - 0.08, z - 0.33, 10); continue; }
        cylC(ry2 % 4 ? "bottle" : "bottle2", 0.042, 0.3, xx, yy, z + (si ? -0.32 : 0.32), 7, null, Math.PI / 2);
      }
    });
    tableRound(68.4, -3.6, 0.75, 0.95, "basalt"); stool(67.4, -4.4, "fabPlum"); stool(69.4, -4.4, "fabPlum"); stool(68.4, -2.6, "fabPlum");
    cylC("wood", 0.55, 1.1, 72.6, 0.6, 4.6, 16, null, Math.PI / 2); cylC("wood", 0.55, 1.1, 72.6, 0.6, 3.4, 16, null, Math.PI / 2); cylC("goldDark", 0.57, 0.06, 72.6, 0.6, 4.3, 16, null, Math.PI / 2);
    pendant(68.4, 3.0, -3.6);
    // library
    [[-7.45, 0], [7.45, Math.PI]].forEach(function (w) { [77.2, 82.8, 88.4, 94].forEach(function (x) { bookcase(x, w[0], w[1], 5.4, 3.3, 7); }); });
    box("gold", 22, 0.04, 0.04, 85.6, 3.3, -6.92); box("gold", 0.05, 3.5, 0.05, 82.2, 0, -6.55, 0, null, -0.2, 0); box("gold", 0.05, 3.5, 0.05, 82.9, 0, -6.55, 0, null, -0.2, 0);
    for (var rg = 0; rg < 10; rg++) { var ly = 0.3 + rg * 0.32; box("gold", 0.72, 0.03, 0.05, 82.55, ly, -6.55 - (ly - 1.75) * 0.204); }
    [77, 81, 85, 89].forEach(function (x, i) { glassCase(x, -3.2, 1.1, 1.1, true, 0.6 + (i % 2) * 0.3); glassCase(x, 3.2, 1.1, 1.1, true, 0.8 - (i % 2) * 0.2); });
    armchair(95.2, -4.3, -Math.PI / 2 + 0.4, "fabRust"); armchair(95.2, 4.3, -Math.PI / 2 - 0.4, "fabRust"); floorLamp(96.6, -5.6, 1.6); floorLamp(96.6, 5.6, 1.6);
    var globe = new THREE.Mesh(new THREE.SphereGeometry(0.6, 48, 24), new THREE.MeshStandardMaterial({ map: TEX.mars, roughness: 0.8 })); globe.position.set(91.8, 1.45, -3.6); globe.rotation.z = 0.44; globe.castShadow = true; put(globe); dyn.globe = globe;
    cyl("gold", 0.25, 0.04, 91.8, 0, -3.6, 16); cyl("gold", 0.03, 0.85, 91.8, 0, -3.6, 6); addGeo("gold", new THREE.TorusGeometry(0.66, 0.02, 4, 48, Math.PI), mat4(91.8, 1.45, -3.6, 0, 1, 1, 1, 0, 0.44));
    rug("fabPlum", 86, 0, 20, 2.2);
    // boot room
    [-7.3, 7.3].forEach(function (z) { for (var lk = 0; lk < 5; lk++) box("steel", 1.2, 2.3, 0.55, 99.2 + lk * 1.4, 0, z); box("wood", 6.5, 0.45, 0.45, 102, 0, z * 0.86); });
    // hangar
    progress("Parking the rovers", 0.62);
    box("slate", 40, 0.1, 40, 126, -0.1, 0);
    sideWallBox(106, 146, -20, 20, 10);
    box("shell", 41.6, 0.6, 41.6, 126, 10, 0, 0, "roof");
    for (var hl = 0; hl < 4; hl++) box("lampCool", 36, 0.06, 0.4, 126, 9.9, -15 + hl * 10);
    var hb = bermGeo(26, 12, 39.5, 0.2, 0.3, 9); addGeo("berm", hb, mat4(106.2, 0, 0, Math.PI / 2, 1, 1, 1), "roof");
    rover(120, -8.5, Math.PI / 2); rover(120, 8.5, Math.PI / 2);
    box("yellow", 12, 0.012, 0.15, 121, 0.002, -12.5); box("yellow", 12, 0.012, 0.15, 121, 0.002, -4.5); box("yellow", 12, 0.012, 0.15, 121, 0.002, 4.5); box("yellow", 12, 0.012, 0.15, 121, 0.002, 12.5);
    [129.5, 132.5, 135.5, 138.5].forEach(function (x) { suit(x, -18.9, 0); box("steel", 1.2, 0.08, 0.3, x, 2.3, -19.5); });
    box("glass", 5, 3, 0.05, 143.5, 0, 8.4); box("glass", 5, 3, 0.05, 143.5, 0, 12.6); box("steel", 5, 0.12, 4.3, 143.5, 3, 10.5); box("lampCool", 4, 0.04, 0.3, 143.5, 2.97, 10.5);
    for (var nz = 0; nz < 5; nz++) { sph("gold", 0.06, 141.6 + nz * 0.9, 1.9, 8.47, 6); sph("gold", 0.06, 141.6 + nz * 0.9, 1.9, 12.53, 6); }
    box("steel", 8, 0.95, 0.9, 131, 0, 19.2); box("darkMetal", 8, 1.6, 0.2, 131, 1.2, 19.55); for (var tw = 0; tw < 3; tw++) cylC("black", 0.62, 0.5, 124 + tw * 1.6, 0.62, 18.6, 18, null, Math.PI / 2);
    box("darkMetal", 0.2, 7.6, 14, 145.9, 0.1, 0); box("yellow", 0.24, 0.2, 14.2, 145.9, 7.7, 0);
    box("steel", 0.3, 3.2, 0.25, 146, 0, 8.9); box("steel", 0.3, 3.2, 0.25, 146, 0, 12.1); box("steel", 0.3, 0.25, 3.45, 146, 3.2, 10.5); box("ledBlue", 0.1, 0.08, 3.2, 146.2, 3.35, 10.5);
    // outside face of the hangar: hazard-striped door frame, floodlights and the suit-lock hood
    for (var hz = 0; hz < 14; hz++) { box(hz % 2 ? "yellow" : "black", 0.06, 0.5, 1.0, 146.84, 7.6, -6.5 + hz); }
    [-7.2, 7.2].forEach(function (z) { for (var hy = 0; hy < 8; hy++) box(hy % 2 ? "yellow" : "black", 0.06, 0.95, 0.4, 146.84, hy * 0.95, z); });
    [-9.5, 0, 9.5].forEach(function (z) { box("darkMetal", 0.6, 0.25, 1.4, 147.1, 8.9, z); box("lampCool", 0.04, 0.12, 1.2, 147.42, 8.85, z); });
    box("darkMetal", 1.6, 0.2, 4.2, 147.6, 3.6, 10.5); box("darkMetal", 0.15, 3.6, 0.15, 148.3, 0, 8.5); box("darkMetal", 0.15, 3.6, 0.15, 148.3, 0, 12.5);
    box("ledBlue", 0.05, 0.05, 3.9, 148.38, 3.55, 10.5);

    progress("Filling the pool", 0.68);
    // ---------- wellness wing (south) ----------
    wing({ axis: "z", center: 0, a0: 28, a1: 104, cap0: 1.5, cap1: 6, seed: 11, cuts: [[28, [0]], [34, [0]], [66, [0]], [76, [0]], [92, [0]], [104, []]] });
    floorRect("stone", -8, 8, 28, 34);
    floorRect("stone", -8, -3.2, 34, 66); floorRect("stone", 3.2, 8, 34, 66); floorRect("stone", -3.2, 3.2, 34, 36.8); floorRect("stone", -3.2, 3.2, 63.2, 66);
    floorRect("cedar", -8, 8, 66, 76); floorRect("slate", -8, 8, 76, 92); floorRect("floorOak", -8, 8, 92, 104);
    // spa foyer
    box("stone", 3.2, 1.05, 0.8, -4.5, 0, 31.8); box("gold", 3.3, 0.04, 0.9, -4.5, 1.05, 31.8); for (var rb = 0; rb < 6; rb++) box("fabWhite", 0.22, 1.1, 0.6, 7.35, 0.6, 29.1 + rb * 0.75); box("gold", 0.04, 0.04, 4.6, 7.4, 1.72, 31.1);
    plant(-6.9, 29.2, 1.2); plant(3, 29.2, 1.0);
    // pool
    box("tileBlue", 6.4, 0.1, 26.4, 0, -1.9, 50); box("tileBlue", 0.2, 1.8, 26.4, -3.1, -1.8, 50); box("tileBlue", 0.2, 1.8, 26.4, 3.1, -1.8, 50); box("tileBlue", 6.4, 1.8, 0.2, 0, -1.8, 36.9); box("tileBlue", 6.4, 1.8, 0.2, 0, -1.8, 63.1);
    box("stone", 0.35, 0.06, 26.8, -3.3, 0, 50); box("stone", 0.35, 0.06, 26.8, 3.3, 0, 50); box("stone", 6.9, 0.06, 0.35, 0, 0, 36.7); box("stone", 6.9, 0.06, 0.35, 0, 0, 63.3);
    box("ledBlue", 0.04, 0.05, 25.8, -2.98, -0.7, 50); box("ledBlue", 0.04, 0.05, 25.8, 2.98, -0.7, 50);
    var wg = new THREE.PlaneGeometry(6, 26, 16, 64); wg.rotateX(-Math.PI / 2); worldUV(wg, 3);
    var water = new THREE.Mesh(wg, M.waterBlue); water.position.set(0, -0.18, 50); water.receiveShadow = true; put(water); dyn.pool = water; dyn.poolBase = wg.attributes.position.array.slice();
    [40, 44.5, 49, 53.5, 58].forEach(function (z) { lounger(-5.7, z, Math.PI / 2, "fabWhite"); lounger(5.7, z, -Math.PI / 2, "fabWhite"); });
    [42.2, 51.2, 60.2].forEach(function (z) { plant(-7.1, z, 1.1); plant(7.1, z + 1.5, 1.1); });
    // sauna and cold plunge
    box("cedar", 6, 2.6, 0.12, -4.6, 0, 66.7); box("cedar", 6, 2.6, 0.12, -4.6, 0, 75.3); box("cedar", 0.12, 2.6, 8.7, -7.55, 0, 71); box("glass", 0.06, 2.6, 8.7, -1.6, 0, 71); box("cedar", 6.1, 0.12, 8.8, -4.6, 2.6, 71);
    box("cedar", 1.2, 0.45, 8.4, -6.8, 0, 71); box("cedar", 1.0, 0.9, 8.4, -7.05, 0.45, 71); box("black", 0.8, 0.9, 0.8, -3, 0, 74.4); for (var sn = 0; sn < 8; sn++) sph("rock", 0.12, -3.2 + (sn % 3) * 0.2, 0.95, 74.2 + Math.floor(sn / 3) * 0.2, 6);
    box("lampSoft", 5.8, 0.04, 0.05, -4.6, 2.5, 75.2);
    box("stone", 3, 0.95, 3.2, 4, 0, 71); box("waterBlue", 2.6, 0.02, 2.8, 4, 0.88, 71); box("stone", 1.0, 0.45, 0.6, 4, 0, 68.9);
    cyl("gold", 0.03, 2.3, 7.5, 0, 74.6, 6); cyl("gold", 0.25, 0.03, 7.2, 2.3, 74.6, 16); box("slate", 1.4, 0.03, 1.4, 7.1, 0, 74.6); box("glass", 0.04, 2.3, 1.4, 6.38, 0, 74.6);
    // gym and centrifuge
    var cf = new THREE.Group(); cf.position.set(-3.6, 0, 84);
    cf.add(meshOf(new THREE.CylinderGeometry(0.4, 0.55, 1.2, 20), M.steel, 0, 0.6, 0));
    cf.add(meshOf(new THREE.BoxGeometry(6.2, 0.18, 0.5), M.gold, 0, 0.95, 0));
    [-1, 1].forEach(function (sg) { cf.add(meshOf(new THREE.BoxGeometry(2.1, 0.22, 0.85), M.white, sg * 1.95, 1.1, 0)); cf.add(meshOf(new THREE.BoxGeometry(1.8, 0.1, 0.7), M.fabBlue, sg * 1.95, 1.26, 0)); cf.add(meshOf(new THREE.BoxGeometry(0.1, 0.6, 0.85), M.steel, sg * 3.02, 1.35, 0)); });
    put(cf); dyn.centrifuge = cf; cyl("slate", 3.3, 0.05, -3.6, 0, 84, 48); addGeo("led", new THREE.TorusGeometry(3.32, 0.035, 4, 72), mat4(-3.6, 0.04, 84, 0, 1, 1, 1, Math.PI / 2));
    box("black", 0.9, 0.25, 2.1, 3.2, 0, 90); box("steel", 0.06, 1.3, 0.06, 2.8, 0, 89.1); box("steel", 0.06, 1.3, 0.06, 3.6, 0, 89.1); box("black", 0.9, 0.2, 0.2, 3.2, 1.2, 89.0);
    addGeo("gold", new THREE.TorusGeometry(0.9, 0.04, 6, 32, Math.PI), mat4(3.2, 0, 90, Math.PI / 2, 1.3, 2.5, 1));
    box("steel", 0.6, 1.6, 5.5, 7.3, 0, 87.2); for (var pl2 = 0; pl2 < 6; pl2++) cylC("black", 0.22 + (pl2 % 3) * 0.04, 0.05, 7.0, 0.4 + Math.floor(pl2 / 3) * 0.7, 85.2 + (pl2 % 3) * 1.3, 18, null, 0, Math.PI / 2);
    box("fabGrey", 2.2, 0.03, 3.2, 3.6, 0, 86.8); box("mirror", 0.03, 2.2, 3.6, -7.94, 0.4, 79.8);
    // zen garden
    var sand = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ map: TEX.sand, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.02, 99); sand.receiveShadow = true; put(sand);
    box("basalt", 12.3, 0.15, 0.15, 0, 0, 94.95); box("basalt", 12.3, 0.15, 0.15, 0, 0, 103.05); box("basalt", 0.15, 0.15, 8.2, -6.08, 0, 99); box("basalt", 0.15, 0.15, 8.2, 6.08, 0, 99);
    [[-2.5, 98.4, 1.0], [2.1, 100.9, 1.25], [-0.2, 102.3, 0.75]].forEach(function (s2) { var g2 = new THREE.DodecahedronGeometry(0.55 * s2[2], 1); g2.scale(1.2, 0.7, 1); geoAt("basaltRough", g2, s2[0], 0.25 * s2[2], s2[1], s2[0]); });
    box("basalt", 0.7, 0.9, 0.7, 6.9, 0, 93.6); cyl("ceramic", 0.3, 0.15, 6.9, 0.9, 93.6, 16); cyl("trunk", 0.05, 0.4, 6.9, 1.05, 93.6, 6, null, 0.3); sph("leaf2", 0.3, 7.05, 1.52, 93.55, 8, null, 1.6, 0.5, 1.2); sph("leaf2", 0.22, 6.72, 1.38, 93.65, 8, null, 1.4, 0.5, 1);
    [-2.6, 2.6].forEach(function (x) { cyl("fabRust", 0.35, 0.12, x, 0, 93.5, 20); }); cyl("gold", 0.16, 0.1, 0, 0.26, 93.4, 20); box("woodDark", 0.6, 0.25, 0.6, 0, 0, 93.4); sph("lampSoft", 0.3, -6.8, 0.3, 93.3, 14); sph("lampSoft", 0.22, 6.9, 0.22, 103.2, 12);

    progress("Making up the guest suites", 0.74);
    // ---------- guest wing ----------
    wing({ axis: "z", center: 40, a0: 8.6, a1: 58, cap0: 0.2, bermStart: 8.7, cap1: 6, seed: 17, gapsPos: [[35.8, 38.2]], cuts: [[8.6, [0]], [16, [0]], [30, [0]], [44, [0]], [58, []]] });
    floorRect("floorOak", 32, 48, 8.6, 16); floorRect("floorOak", 32, 48, 16, 58);
    painting(TEX.photos, 5.4, 2.7, 32.06, 2.0, 12.3, Math.PI / 2); sofa(41.6, 13.2, -Math.PI / 2, 3.0, "fabTeal"); armchair(36.2, 10.3, Math.PI / 2 - 0.4, "fabSand"); armchair(36.2, 14.6, Math.PI / 2 + 0.4, "fabSand"); tableRound(38.3, 12.4, 0.5, 0.42, "basalt");
    box("wood", 0.7, 1.0, 3.2, 47.3, 0, 11.4); box("basalt", 0.75, 0.05, 3.3, 47.3, 1.0, 11.4); box("steel", 0.4, 0.45, 0.4, 47.35, 1.05, 10.6); plant(46.9, 15.2, 1.1);
    [[16, "fabRust"], [30, "fabPlum"], [44, "fabBlue"]].forEach(function (s3) {
      var z0 = s3[0];
      bed(34.2, z0 + 5.4, Math.PI / 2, 1.8, 2.2, s3[1], "fabSand"); rug("fabCream", 35.4, z0 + 5.4, 3.6, 3.2);
      armchair(45.2, z0 + 3.2, -Math.PI / 2 - 0.4, "fabGrey"); floorLamp(46.5, z0 + 2.2, 1.6);
      tableRect(46.9, z0 + 10.2, 0.8, 1.8, 0.76, "wood", "gold"); chair(46.1, z0 + 10.2, Math.PI / 2, "fabSand");
      box("glass", 2.4, 2.4, 0.04, 34, 0, z0 + 11.2); box("glass", 0.04, 2.4, 2.6, 35.2, 0, z0 + 12.5); box("slate", 2.4, 0.04, 2.6, 34, 0, z0 + 12.5); cyl("gold", 0.22, 0.03, 34, 2.3, z0 + 12.6, 16);
      box("stone", 1.6, 0.85, 0.55, 37.2, 0, z0 + 13.4); cyl("ceramic", 0.2, 0.1, 37.2, 0.85, z0 + 13.4, 16); box("mirror", 1.2, 1.0, 0.03, 37.2, 1.3, z0 + 13.67);
    });
    link("x", 48.6, 62.2, 37);

    progress("Planting the gardens", 0.8);
    // ---------- greenhouses ----------
    glassDome(74, 37, 12, 1.2, [Math.PI, 0, Math.PI / 2], { ribs: 6, ribR: 0.12 });
    glassDome(102, 37, 12, 1.2, [Math.PI], { ribs: 6, ribR: 0.12 });
    glassDome(74, 65, 10, 1.2, [-Math.PI / 2], { ribs: 6, ribR: 0.12 });
    link("x", 85.8, 90.2, 37); link("z", 48.8, 55.2, 74);
    [[74, 37, 12], [102, 37, 12], [74, 65, 10]].forEach(function (d) { var fl = new THREE.CircleGeometry(d[2] - 0.2, 48); fl.rotateX(-Math.PI / 2); addGeo("soil", fl, mat4(d[0], 0.004, d[1], 0, 1, 1, 1)); });
    box("stone", 23.6, 0.02, 4.2, 74, 0.006, 37); box("stone", 23.6, 0.02, 4.2, 102, 0.006, 37); box("stone", 4.2, 0.02, 12, 74, 0.006, 45);
    var beds1 = [[64.6, 83.4, 30.5], [66.2, 71.6, 42.6], [76.4, 81.8, 42.6], [67.4, 71.6, 45.9], [76.4, 80.6, 45.9], [65.5, 82.5, 32.6]];
    var plantSpots = [], fruitSpots = [];
    beds1.forEach(function (bd, i) {
      var cx = (bd[0] + bd[1]) / 2, L = bd[1] - bd[0];
      box("wood", L, 0.55, 1.1, cx, 0, bd[2]); box("soil", L - 0.1, 0.02, 1.0, cx, 0.55, bd[2]);
      box(i % 2 ? "ledPink" : "lampCool", L, 0.06, 0.2, cx, 2.9, bd[2]); cyl("steel", 0.01, 0.4, bd[0] + 0.3, 2.96, bd[2], 3); cyl("steel", 0.01, 0.4, bd[1] - 0.3, 2.96, bd[2], 3);
      for (var x = bd[0] + 0.35; x < bd[1] - 0.2; x += 0.55) { plantSpots.push([x, 0.72, bd[2] - 0.2, i]); plantSpots.push([x + 0.25, 0.72, bd[2] + 0.22, i]); if (i % 3 === 0) fruitSpots.push([x + 0.05, 0.95, bd[2] - 0.1, "r"]); if (i % 3 === 2) fruitSpots.push([x + 0.2, 0.8, bd[2] + 0.2, "r"]); }
    });
    box("wood", 1.8, 0.45, 0.45, 70.5, 0, 34.1);
    // field greenhouse: wheat and potatoes
    var wheatSpots = [];
    for (var wz = 26.4; wz < 47.8; wz += 0.42) {
      if (wz > 34.4 && wz < 39.6) continue;
      var half = Math.sqrt(Math.max(0, 11.4 * 11.4 - (wz - 37) * (wz - 37)));
      for (var wx = 102 - half + 0.3; wx < 102 + half - 0.3; wx += 0.42) {
        var band = wz < 34.4 ? (wx < 102 ? "wheat" : "potato") : (wx < 102 ? "potato" : "wheat");
        wheatSpots.push([wx + (rnd() - 0.5) * 0.12, wz + (rnd() - 0.5) * 0.12, band]);
      }
    }
    // orchard
    [[-40, "fruitR"], [0, "fruitY"], [40, "fruitR"], [140, "fruitP"], [180, "fruitO"], [220, "fruitR"]].forEach(function (t) { var a4 = t[0] * D2R; tree(74 + Math.cos(a4) * 6.2, 65.5 + Math.sin(a4) * 6.2, 1.1, t[1]); });
    for (var vp = 0; vp < 6; vp++) { box("wood", 0.08, 1.8, 0.08, 70 + vp * 1.6, 0, 73); if (vp < 5) { box("leaf2", 1.5, 0.6, 0.35, 70.8 + vp * 1.6, 1.0, 73); for (var gp = 0; gp < 3; gp++) sph("fruitP", 0.1, 70.4 + vp * 1.6 + gp * 0.35, 0.85, 72.78, 6); } }
    box("yellow", 0.6, 0.7, 0.5, 66.6, 0, 61.2); box("woodLight", 0.7, 0.06, 0.6, 66.6, 0.7, 61.2); box("basalt", 0.8, 0.4, 0.8, 66.6, 0, 61.2);
    cyl("basalt", 2.55, 0.35, 74, 0, 65.5, 40); cyl("waterBlue", 2.3, 0.02, 74, 0.3, 65.5, 40); box("wood", 1.8, 0.45, 0.45, 70.6, 0, 66.6, 1.2);
    addCrops(plantSpots, fruitSpots, wheatSpots);

    progress("Raising the observatory", 0.86);
    // ---------- sunset loggia (glass pavilion on the cliff) ----------
    floorRect("basalt", -62, -28, -12, 12);
    var LH = 5.5;
    function glassWall(x0, z0, x1, z1, gaps) {
      var L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
      var segs = [[0, L]]; (gaps || []).forEach(function (g) { var ns = []; segs.forEach(function (s) { if (g[1] <= s[0] || g[0] >= s[1]) ns.push(s); else { if (g[0] > s[0]) ns.push([s[0], g[0]]); if (g[1] < s[1]) ns.push([g[1], s[1]]); } }); segs = ns; });
      segs.forEach(function (s) { var m = (s[0] + s[1]) / 2; box("glass", s[1] - s[0], LH, 0.06, x0 + Math.cos(ang) * m, 0, z0 + Math.sin(ang) * m, -ang, null); });
      for (var d = 0; d <= L + 0.01; d += 3) box("steel", 0.12, LH, 0.16, x0 + Math.cos(ang) * d, 0, z0 + Math.sin(ang) * d, -ang);
      (gaps || []).forEach(function (g) { var m = (g[0] + g[1]) / 2; box("steel", g[1] - g[0], LH - 3, 0.12, x0 + Math.cos(ang) * m, 3, z0 + Math.sin(ang) * m, -ang); });
    }
    glassWall(-62, -12, -62, 12); glassWall(-62, -12, -28, -12, [[14.9, 17.1]]); glassWall(-62, 12, -28, 12); glassWall(-28, -12, -28, 12, [[10.9, 13.1]]);
    box("glass", 34, 0.06, 24, -45, LH, 0, 0, "roof"); for (var lb = 0; lb <= 34; lb += 3.4) box("steel", 0.16, 0.25, 24, -62 + lb, LH - 0.1, 0, 0, "roof");
    box("steel", 34, 0.25, 0.16, -45, LH - 0.1, -12, 0, "roof"); box("steel", 34, 0.25, 0.16, -45, LH - 0.1, 12, 0, "roof");
    [-9, -6, -3, 3, 6, 9].forEach(function (z) { lounger(-58.4, z, -Math.PI / 2, "fabCream"); });
    [-7.5, -1.5, 4.5].forEach(function (z) { tableRound(-59.2, z, 0.3, 0.45, "basalt"); });
    box("basalt", 2.6, 0.45, 1.1, -51.5, 0, 0); box("fireWarm", 2.2, 0.06, 0.18, -51.5, 0.45, 0); sofa(-51.5, 2.6, Math.PI, 3.2, "fabSand"); sofa(-51.5, -2.6, 0, 3.2, "fabSand");
    box("basalt", 7, 1.08, 0.8, -35, 0, -10.9); box("gold", 7.1, 0.04, 0.9, -35, 1.08, -10.9); [-37.5, -35.8, -34.2, -32.5].forEach(function (x) { stool(x, -9.9, "fabRust"); });
    var tf = new F(-58.8, 9.8, 0); tf.box("black", 0.05, 1.3, 0.05, 0, 0, 0.3, 0, null, 0.3).box("black", 0.05, 1.3, 0.05, 0.3, 0, -0.2, 0, null, -0.2).box("black", 0.05, 1.3, 0.05, -0.3, 0, -0.2, 0, null, -0.2);
    cylC("white", 0.14, 1.4, -58.8, 1.55, 9.8, 16, null, 0, 1.1, -0.4);
    plant(-60.8, -10.8, 1.4, "terracotta"); plant(-29.4, 10.6, 1.4, "terracotta"); rug("fabBlue", -51.5, 0, 6, 7);
    link("z", -20.4, -12, -46);
    // ---------- observatory tower ----------
    var TH = 26, TR = 6, nseg = 40, tl = 2 * Math.PI * TR / nseg * 1.05;
    for (var ts = 0; ts < nseg; ts++) {
      var ta = (ts + 0.5) / nseg * Math.PI * 2, dd = Math.atan2(Math.sin(ta - Math.PI / 2), Math.cos(ta - Math.PI / 2));
      var tx = -46 + Math.cos(ta) * (TR + 0.25), tz = -26 + Math.sin(ta) * (TR + 0.25);
      if (Math.abs(dd) < 0.23) { box("shell", 0.5, TH - 3.4, tl, tx, 3.4, tz, -ta); continue; }
      box("shell", 0.5, TH, tl, tx, 0, tz, -ta);
    }
    var tfl = new THREE.CircleGeometry(TR, 40); tfl.rotateX(-Math.PI / 2); addGeo("terrazzo", tfl, mat4(-46, 0.002, -26, 0, 1, 1, 1));
    cyl("stone", TR + 0.6, 0.35, -46, TH - 0.35, -26, 48); addGeo("gold", new THREE.TorusGeometry(TR + 0.35, 0.1, 6, 64), mat4(-46, TH, -26, 0, 1, 1, 1, Math.PI / 2));
    cylC("glass", 1.1, TH, -46, TH / 2, -26, 24); cyl("steel", 1.15, 0.1, -46, 0, -26, 24);
    for (var ss = 0; ss < 110; ss++) { var sa3 = ss * 0.36, sy3 = ss * (TH - 0.4) / 110; var fsx = new F(-46 + Math.cos(sa3) * 2.9, -26 + Math.sin(sa3) * 2.9, -sa3); fsx.box("wood", 0.32, 0.06, 3.3, 0, sy3, 0, Math.PI / 2); }
    var cup = new THREE.SphereGeometry(TR, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2); addGeo("glassDome", cup, mat4(-46, TH, -26, 0, 1, 1, 1), "roof", true);
    var crib = new THREE.TorusGeometry(TR, 0.1, 6, 40, Math.PI); for (var cr = 0; cr < 4; cr++) addGeo("gold", crib, mat4(-46, TH, -26, cr * Math.PI / 4, 1, 1, 1), "roof");
    YOFF = TH;
    var tsc = new F(-47.6, -28.6, 0.3); tsc.box("darkMetal", 1.0, 0.9, 1.0, 0, 0, 0).box("darkMetal", 0.3, 1.1, 0.3, 0, 0.9, 0);
    cylC("white", 0.3, 2.6, -47.9, 2.6, -29.3, 24, null, 0.9, 0.35); cylC("black", 0.32, 0.25, -48.3, 3.3, -30.3, 24, null, 0.9, 0.35);
    [[-49.5, -24.2], [-44, -29.8], [-42.6, -26.5]].forEach(function (p4) { lounger(p4[0], p4[1], Math.atan2(-46 - p4[0], -26 - p4[1]) + Math.PI, "fabBlue"); });
    rug("fabCream", -46, -26, 5, 5);
    YOFF = 0;

    progress("Walking out to the pad", 0.9);
    // ---------- exterior: road, pad, ship ----------
    box("road", 20, 0.3, 44, 157, -0.3, 0); box("road", 150, 0.3, 9, 242, -0.3, 0);
    for (var gl = 170; gl < 300; gl += 12) { [-5.2, 5.2].forEach(function (z) { cyl("steel", 0.05, 0.6, gl, 0, z, 6); sph("ledBlue", 0.18, gl, 0.68, z, 8); }); }
    cyl("pad", 30, 0.5, 330, -0.45, 0, 64);
    addGeo("marking", new THREE.TorusGeometry(22, 0.35, 4, 96), mat4(330, 0.06, 0, 0, 1, 1, 0.1, Math.PI / 2)); addGeo("marking", new THREE.TorusGeometry(7, 0.35, 4, 64), mat4(330, 0.06, 0, 0, 1, 1, 0.1, Math.PI / 2));
    box("marking", 12, 0.02, 0.8, 330, 0.05, 0); box("marking", 0.8, 0.02, 12, 330, 0.05, 0);
    for (var pl3 = 0; pl3 < 28; pl3++) { var pa3 = pl3 / 28 * Math.PI * 2; sph("ledBlue", 0.22, 330 + Math.cos(pa3) * 28.8, 0.1, Math.sin(pa3) * 28.8, 8); }
    for (var bb = 0; bb < 7; bb++) { var ba2 = Math.PI * (0.78 + bb * 0.075); var bg = bermGeo(4.2, 5.5, 9, 2.5, 2.5, 20 + bb); addGeo("berm", bg, mat4(330 + Math.cos(ba2) * 44, 0, Math.sin(ba2) * 44, -ba2 + Math.PI, 1, 1, 1)); }
    var ship = new F(330, 0, 0);
    ship.cyl("steel", 4.2, 16, 0, 3.2, 0, 40).cyl("glassDark", 4.25, 0.9, 0, 14.4, 0, 40).cyl("orange", 4.25, 0.4, 0, 6.4, 0, 40).cyl("darkMetal", 3.6, 1.6, 0, 1.6, 0, 32);
    geoAt("steel", new THREE.ConeGeometry(4.2, 7.5, 40), 330, 23, 0);
    [0, 1, 2, 3].forEach(function (lg) { var la = lg * Math.PI / 2 + Math.PI / 4; box("darkMetal", 0.5, 5.2, 0.5, 330 + Math.cos(la) * 5.2, 0, Math.sin(la) * 5.2, 0, null, -Math.sin(la) * 0.45, Math.cos(la) * 0.45); cyl("darkMetal", 0.9, 0.2, 330 + Math.cos(la) * 6.2, 0, Math.sin(la) * 6.2, 16); });
    [[-1.6, -1.4], [1.6, -1.4], [0, 1.8]].forEach(function (e) { cyl("black", 0.8, 1.4, 330 + e[0], 0.4, e[1], 20); });
    box("steel", 8.6, 0.12, 1.4, 321.9, 1.94, 0, 0, null, 0, 0.4847); box("darkMetal", 0.12, 2.2, 1.5, 325.78, 4, 0); box("lampCool", 0.06, 0.06, 1.5, 325.86, 6.25, 0);
    // ---------- exterior: solar field, reactor, ice mine, oxygen, dish, mast ----------
    var nPanels = 0, panelMats = [], postMats = [];
    for (var row = 0; row < 10; row++) for (var px = -40; px <= 160; px += 4.6) {
      var pz = -150 - row * 11, py = terrainH(px, pz);
      panelMats.push(new THREE.Matrix4().compose(new V3(px, py + 1.4, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.66, 0, 0)), new V3(1, 1, 1)));
      postMats.push(new THREE.Matrix4().compose(new V3(px, py + 0.7, pz), new THREE.Quaternion(), new V3(1, 1, 1))); nPanels++;
    }
    var panelMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(4.2, 0.06, 2.3), M.solar, nPanels), postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), M.steel, nPanels);
    for (var np = 0; np < nPanels; np++) { panelMesh.setMatrixAt(np, panelMats[np]); postMesh.setMatrixAt(np, postMats[np]); }
    panelMesh.castShadow = true; panelMesh.receiveShadow = true; put(panelMesh); put(postMesh);
    var rx0 = 40, rz0 = -520, ry0 = terrainH(rx0, rz0);
    var ringB = new THREE.TorusGeometry(20, 6, 10, 48); ringB.rotateX(Math.PI / 2); ringB.scale(1, 0.55, 1); addGeo("berm", ringB, mat4(rx0, ry0, rz0, 0, 1, 1, 1));
    for (var ku = 0; ku < 4; ku++) { var kx = rx0 + (ku % 2 ? 3.2 : -3.2), kz = rz0 + (ku < 2 ? 3.2 : -3.2); cyl("steel", 1.3, 3.4, kx, ry0, kz, 20); geoAt("steel", new THREE.SphereGeometry(1.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), kx, ry0 + 3.4, kz); sph("ledRed", 0.12, kx, ry0 + 4.8, kz, 8); }
    for (var rd = 0; rd < 8; rd++) { var ra = rd / 8 * Math.PI * 2; box("radiator", 9, 3.2, 0.12, rx0 + Math.cos(ra) * 9.5, ry0 + 1.4, rz0 + Math.sin(ra) * 9.5, -ra); box("steel", 0.2, 1.4, 0.2, rx0 + Math.cos(ra) * 9.5, ry0, rz0 + Math.sin(ra) * 9.5); }
    box("darkMetal", 1.2, 0.3, 420, 40, -0.1, -305);
    var ix = 212, iz = -168, iy = terrainH(ix, iz);
    for (var il = 0; il < 4; il++) box("darkMetal", 0.3, 16, 0.3, ix + (il % 2 ? 2 : -2), iy, iz + (il < 2 ? 2 : -2), 0, null, (il < 2 ? -1 : 1) * 0.1, (il % 2 ? 1 : -1) * 0.1);
    for (var ib = 0; ib < 5; ib++) box("darkMetal", 4.4 - ib * 0.5, 0.2, 0.2, ix, iy + 2 + ib * 3, iz); box("orange", 1.4, 1.4, 1.4, ix, iy + 15, iz);
    [-172, -166, -160].forEach(function (tz) { cylC("roverWhite", 1.6, 8, ix + 10, iy + 1.8, tz, 20, null, 0, Math.PI / 2); box("steel", 0.3, 1.2, 3, ix + 7, iy, tz); box("steel", 0.3, 1.2, 3, ix + 13, iy, tz); });
    var pipeLen = Math.hypot(ix - 146, iz + 20), pipeAng = Math.atan2(iz + 20, ix - 146);
    cylC("steel", 0.25, pipeLen, (ix + 146) / 2, 1.2, (iz - 20) / 2, 10, null, 0, Math.PI / 2, -pipeAng);
    for (var sp = 0; sp < pipeLen; sp += 12) box("darkMetal", 0.2, 1.2, 0.2, 146 + Math.cos(pipeAng) * sp, -0.2, -20 + Math.sin(pipeAng) * sp);
    [[168, 32], [168, 40]].forEach(function (p5) { sph("roverWhite", 3, p5[0], 4.2, p5[1], 20); for (var lq = 0; lq < 4; lq++) box("steel", 0.25, 2, 0.25, p5[0] + (lq % 2 ? 1.8 : -1.8), 0, p5[1] + (lq < 2 ? 1.8 : -1.8)); });
    box("steel", 5, 3, 3, 160, 0, 48); box("ledRed", 0.1, 0.1, 2, 162.55, 2.4, 48);
    var dish = new THREE.LatheGeometry((function () { var pts = []; for (var i = 0; i <= 12; i++) { var r = i / 12 * 5; pts.push(new THREE.Vector2(r, r * r * 0.06)); } return pts; })(), 40);
    var dm = new THREE.Mesh(dish, new THREE.MeshStandardMaterial({ color: new THREE.Color(0xeeeae2).convertSRGBToLinear(), roughness: 0.5, side: THREE.DoubleSide })); dm.position.set(165, 6.2, -58); dm.rotation.set(-0.5, 0, 0.4); dm.castShadow = true; put(dm);
    cyl("steel", 0.5, 6, 165, 0, -58, 14); cyl("darkMetal", 1.8, 0.4, 165, 0, -58, 20);
    cyl("steel", 0.08, 9, -30, 0, -62, 8); box("solar", 1.2, 0.05, 0.8, -30, 7, -62, 0, null, 0.5); for (var an = 0; an < 3; an++) { var aa = an * 2.1; sph("steel", 0.12, -30 + Math.cos(aa) * 0.5, 9.1, -62 + Math.sin(aa) * 0.5, 8); }
    rover(176, -14, -0.6, 1);
  }
  function sideWallBox(x0, x1, z0, z1, h) {
    box("shell", x1 - x0 + 1.6, h, 0.8, (x0 + x1) / 2, 0, z0 - 0.4); box("shell", x1 - x0 + 1.6, h, 0.8, (x0 + x1) / 2, 0, z1 + 0.4);
    // west wall with a door to the boot room, east wall with the big door and the suit airlock
    box("shell", 0.8, h, (z1 - z0) / 2 - 1.2, x0 - 0.4, 0, (z0 + (-1.2)) / 2); box("shell", 0.8, h, (z1 - z0) / 2 - 1.2, x0 - 0.4, 0, (z1 + 1.2) / 2); box("shell", 0.8, h - 3, 2.4, x0 - 0.4, 3, 0);
    box("shell", 0.8, h, 13, x1 + 0.4, 0, -13.5); box("shell", 0.8, h - 7.6, 14, x1 + 0.4, 7.6, 0); box("shell", 0.8, h, 1.9, x1 + 0.4, 0, 7.95);
    box("shell", 0.8, h - 3.2, 3.2, x1 + 0.4, 3.2, 10.5); box("shell", 0.8, h, 7.9, x1 + 0.4, 0, 16.05);
  }
  function meshOf(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
  function mergeGeos(list) {
    var tv = 0, ti = 0; list.forEach(function (g) { tv += g.attributes.position.count; ti += g.index ? g.index.count : g.attributes.position.count; });
    var pos = new Float32Array(tv * 3), nor = new Float32Array(tv * 3), idx = new Uint16Array(ti), vo = 0, io = 0;
    list.forEach(function (g) {
      var c = g.attributes.position.count, k;
      pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
      if (g.index) { for (k = 0; k < g.index.count; k++) idx[io + k] = g.index.array[k] + vo; io += g.index.count; }
      else { for (k = 0; k < c; k++) idx[io + k] = vo + k; io += c; }
      vo += c;
    });
    var out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  }
  // vegetables, berries, wheat and potatoes as instanced meshes
  function addCrops(plantSpots, fruitSpots, wheatSpots) {
    var o = new THREE.Object3D(), r = mulberry(55);
    function inst(geo, mat, list, place) {
      if (!list.length) return;
      var m = new THREE.InstancedMesh(geo, mat, list.length);
      for (var i = 0; i < list.length; i++) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); place(o, list[i]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
      m.castShadow = true; m.receiveShadow = true; put(m);
    }
    inst(new THREE.IcosahedronGeometry(0.2, 1), M.leaf3, plantSpots, function (q, p) { var s = 0.7 + r() * 0.6; q.position.set(p[0], p[1] + 0.05, p[2]); q.scale.set(s, s * (p[3] % 2 ? 1.6 : 0.7), s); q.rotation.y = r() * 6; });
    inst(new THREE.SphereGeometry(0.045, 6, 4), M.fruitR, fruitSpots, function (q, p) { q.position.set(p[0], p[1], p[2]); q.scale.setScalar(0.8 + r() * 0.6); });
    var parts = [];
    for (var k = 0; k < 4; k++) {
      var a = k * 1.7, dx = Math.cos(a) * 0.07, dz = Math.sin(a) * 0.07, tilt = 0.12 + 0.05 * k;
      var st = new THREE.BoxGeometry(0.014, 0.85, 0.014); st.translate(0, 0.425, 0); st.rotateZ(Math.cos(a) * tilt); st.rotateX(Math.sin(a) * tilt); st.translate(dx, 0, dz); parts.push(st);
      var hd = new THREE.BoxGeometry(0.035, 0.13, 0.035); hd.translate(0, 0.9, 0); hd.rotateZ(Math.cos(a) * tilt); hd.rotateX(Math.sin(a) * tilt); hd.translate(dx, 0, dz); parts.push(hd);
    }
    var wheat = [], pot = [];
    wheatSpots.forEach(function (w) { (w[2] === "wheat" ? wheat : pot).push(w); });
    inst(mergeGeos(parts), M.wheat, wheat, function (q, p) { q.position.set(p[0], 0, p[1]); q.rotation.y = r() * 6; q.scale.set(1, 0.85 + r() * 0.3, 1); });
    inst(new THREE.IcosahedronGeometry(0.24, 1), M.leaf, pot, function (q, p) { q.position.set(p[0], 0.16, p[1]); q.scale.set(1, 0.65, 1); q.rotation.y = r() * 6; });
  }
  function makeFountain(cx, cz) {
    var n = MOBILE ? 500 : 900, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seeds = new Float32Array(n * 3), r = mulberry(31);
    for (var i = 0; i < n; i++) { seeds[i * 3] = r() * Math.PI * 2; seeds[i * 3 + 1] = r(); seeds[i * 3 + 2] = r(); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ color: 0xcfe9ff, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false });
    var pts = new THREE.Points(geo, mat); pts.frustumCulled = false; put(pts);
    return { pts: pts, pos: pos, seeds: seeds, n: n, cx: cx, cz: cz };
  }
