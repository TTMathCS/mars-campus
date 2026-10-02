/* The tour's stops: each is a 360° render of the 3D model (Blender Cycles, path-traced). Positions are in the
   family room's frame, in metres: x along the glass onto the atrium (y = 0), y into the room, z the height of the
   floor you stand on (0 = L1). az0 is where you look first (degrees: 0 = into the room, 90 = to the left,
   180 = out to the atrium). A link is a stop's id, or { id, at: [x, y, z] } to put its ring somewhere else (the portal). */
window.TOUR_STOPS = [
  { id: "fire", name: "By the fire", short: "The fire", k: "L1 · Jim's family room", p: [0.8, 11.3], az0: 20, img: "pano/fire.jpg",
    d: "The family room: a hearth of lit mist in a travertine chimney breast (no open flames in air with 27% oxygen), walnut shelves lit from within, an oak ceiling and a skylight full of the Sun Well's light. The doors either side go out to the street and the master suite.",
    links: ["glass", "piano", "table", { id: "bedroom", at: [2.9, 13.6, 0], label: "Through the door: the master suite" }] },
  { id: "glass", name: "At the glass", short: "The glass", k: "L1 · Jim's family room", p: [2.6, 1.1], az0: 180, img: "pano/glass.jpg",
    d: "The whole front of the room is glass onto the atrium gardens, with doors out to the terrace. A chess table in the light; the music room is through the wall to the left, the dining room to the right.",
    links: ["fire", "terrace", "piano", "table"] },
  { id: "piano", name: "The music room", short: "Music room", k: "L1 · Jim's residence", p: [-11.2, 6.2], az0: 172, img: "pano/piano.jpg",
    d: "The grand piano by the glass, a sofa and two chairs to listen from, and at the far end a wall of records with a turntable between two tall speakers and two armchairs. The opening in the wall goes through to the family room.",
    links: ["fire", "glass"] },
  { id: "table", name: "The dining room", short: "Dining room", k: "L1 · Jim's residence", p: [9.4, 9.8], az0: 196, img: "pano/table.jpg",
    d: "A walnut table for eight under five glass globes, a sideboard under a painting, shelves of books, and the atrium through the glass. The family room is through the opening.",
    links: ["fire", "glass"] },
  { id: "terrace", ready: false, name: "On the terrace", short: "Terrace", k: "L1 · The atrium", p: [0.0, -1.9], z: -0.02, az0: 180, img: "pano/terrace.jpg",
    d: "Outside the family room: olive trees and box hedges, vines trailing over the glass, Jim's study upstairs, and the bridge out to the portal column under the sky lens.",
    links: ["glass", "bridge"] },
  { id: "bridge", ready: false, name: "On the bridge", short: "Bridge", k: "L1 · The atrium, 24 m down", p: [0.0, -11.0], z: -0.02, az0: 140, img: "pano/bridge.jpg",
    d: "Halfway out to the portal column. The atrium goes on down 44 m to the sun court, past the garden level and the studios; the sky lens of the Sun Well is overhead. The portal at the end of the bridge goes to any level.",
    links: ["terrace", { id: "court", at: [0.6, -18.6, 1.4], label: "Portal: down to the sun court" }, { id: "crown_arrival", at: [-0.6, -18.6, 2.6], label: "Portal: up to the Crown" },
      { id: "library", at: [-14.16, -43.58, 0], label: "Across the atrium: the great library" }, { id: "baths", at: [14.16, -43.58, 0], label: "Across the atrium: the thermal baths" }, { id: "cinema", at: [22.91, -16.65, 0], label: "Across the atrium: the cinema" }] },
  { id: "court", ready: false, name: "The sun court", short: "Sun court", k: "L5 · 68 m down", p: [0.0, -35.6], z: -44.05, az0: 0, img: "pano/court.jpg",
    d: "The bottom of the atrium: a lawn with olive trees round a pool at the foot of the column, in the light of the sky lens 52 m above. Behind the glass all round are the halls of L5: the maglev, the freight portals, the seed vault and the rovers.",
    links: [{ id: "bridge", at: [2.9, -28.1, -42.5], label: "Portal: up to L1" }] },

  /* The master suite down, across the street behind the family room (ring B of sector 1). */
  { id: "bedroom", ready: false, name: "The bedroom down", short: "Bedroom", k: "L1 · Master suite down", p: [10.4, 23.4], az0: -87, img: "pano/bedroom.jpg",
    d: "Where Jim sleeps most nights: an upholstered headboard wall in vertical channels, walnut and pale oak, the bed facing the moss garden through the glass, two chairs by the window and sheer curtains.",
    links: [{ id: "garden", at: [6.4, 22.0, 0], label: "Out into the moss garden" }, "bath"] },
  { id: "garden", ready: false, name: "The moss garden", short: "Moss garden", k: "L1 · Master suite down", p: [2.17, 21.6], z: 0.05, az0: 38, img: "pano/garden.jpg",
    d: "The heart of the suite, open to a sky ceiling: moss in cushions round a pond with maple leaves floating on it, a Japanese maple, a stone lantern that glows at night, a water basin fed by a bamboo spout, ferns and clipped box.",
    links: ["bedroom", "bath"] },
  { id: "bath", ready: false, name: "The bath down", short: "Bath", k: "L1 · Master suite down", p: [-11.6, 23.4], az0: 87, img: "pano/bath.jpg",
    d: "A stone tub facing the garden, a double vanity on a wall of green marble with round mirrors lit from behind, a walk-in shower with a rain head and a teak floor, oak on the walls.",
    links: [{ id: "garden", at: [-6.4, 22.0, 0], label: "Out into the moss garden" }, "bedroom"] },

  /* The other rooms of ring A on L1, each behind the glass of another side of the atrium. They are rendered in their
     own frame (the family room's, turned round the atrium's middle), so rot gives the map direction of the picture's
     middle; p is on the map. Full height, 7.6 m: the library, the baths and the cinema. */
  { id: "library", rot: 144, name: "The great library", short: "Library", k: "L1 · The great library", p: [-18.69, -45.73], az0: 20, img: "pano/library.jpg",
    d: "Two storeys of books on three walls, 49 m along the back: walnut shelves washed with warm light, a gallery all round reached by a spiral stair, rolling ladders, long reading tables with brass lamps, leather chairs by the glass and a globe of the Earth.",
    links: [{ id: "bridge", at: [-13.81, -43.09, 0], label: "Out across the atrium, to the bridge" }, { id: "baths", label: "Next door: the thermal baths" }] },
  { id: "baths", ready: false, rot: 216, name: "The thermal baths", short: "Baths", k: "L1 · The baths", p: [23.35, -49.76], az0: 180, img: "pano/baths.jpg",
    d: "Grey-green quartzite laid in thin courses, blades of daylight through slots in the ceiling, and three pools: a long warm pool, a round hot pool and a cold plunge. Loungers along the glass look out at the atrium's gardens.",
    links: [{ id: "bridge", at: [13.81, -43.09, 0], label: "Out across the atrium, to the bridge" }, { id: "library", label: "Next door: the great library" }, { id: "cinema", label: "Next door: the cinema" }] },
  { id: "cinema", ready: false, rot: 288, name: "The cinema", short: "Cinema", k: "L1 · The club", p: [24.43, -16.15], z: 1.26, az0: 0, img: "pano/cinema.jpg",
    d: "Forty velvet seats in four rows under a ceiling of stars, walnut walls, curtains drawn across the glass, and a screen 12 m wide. Tonight: the Earth.",
    links: [{ id: "bridge", at: [22.34, -16.83, 0], label: "Out across the atrium, to the bridge" }, { id: "baths", label: "Next door: the thermal baths" }] },

  /* The Crown, above ground: positions in metres from the ring's centre, x east, y north (the ring's rooms lie between
     125 and 135 m out, the Glide along the inner wall); z from the main floor, 41 m up. */
  { id: "crown_arrival", place: "crown", ready: false, name: "The Arrival hall", short: "Arrival", k: "The Crown · Arrival", p: [129.26, -27.00], az0: -12, img: "pano/crown_arrival.jpg",
    d: "The first room above ground: 9 m tall, polished basalt, a long olive-wood bench, an olive tree, and slots through both walls; through the inner ones the mirror Orb floats over the garden. Behind you the Door, a ring of light that knows you; at the far end the portal.",
    links: [{ id: "crown_bedroom", at: [122.25, -33.67, 0], label: "The Glide: to the master suite" }, { id: "bridge", at: [125.72, -39.40, 1.6], label: "Portal: down to the Pentagon" }] },
  { id: "crown_bedroom", place: "crown", name: "The master suite up", short: "Bedroom up", k: "The Crown · Master suite up", p: [108.79, -75.90], az0: 55, img: "pano/crown_bedroom.jpg",
    d: "Pale oak walls, a floor of linen-coloured stone, and the bed facing the south-east slots: on a clear morning the sun rises straight across the room. A sitting corner by the slots, a desk at the far end.",
    links: [{ id: "crown_arrival", at: [108.35, -65.87, 0], label: "The Glide: to the Arrival hall" }, { id: "crown_salon", at: [99.23, -78.93, 0], label: "The Glide: to the salon" }] },
  { id: "crown_salon", place: "crown", name: "The great salon", short: "Salon", k: "The Crown · Salon", p: [33.65, -127.38], az0: 80, img: "pano/crown_salon.jpg",
    d: "45 m along the curve of the ring: linen sofas round wool rugs, olive-wood tables, olive trees, an oak ceiling lit from its coves, and the sun in blades through the slots. A hearth of lit mist at one end, the concert grand at the other.",
    links: [{ id: "crown_bedroom", at: [41.27, -119.84, 0], label: "The Glide: to the master suite" }, { id: "crown_dining", at: [23.10, -124.63, 0], label: "The Glide: to the dining hall" }] },
  { id: "crown_wellness", place: "crown", ready: false, name: "The pool", short: "Pool", k: "The Crown · Wellness", p: [-41.5, -123.3], az0: 71, img: "pano/crown_wellness.jpg",
    d: "A pool 25 m long along the curve of the ring, lit from below, where low gravity makes every wave rise high and fall slowly; loungers along the Glide, a cedar sauna and a round hot pool at the spa end, the gym at the other.",
    links: [{ id: "crown_salon", at: [-33.87, -122.14, 0], label: "The Glide: to the salon" }, { id: "crown_dining", at: [-47.48, -117.52, 0], label: "The Glide: to the dining hall" }] },
  { id: "crown_dining", place: "crown", ready: false, name: "The dining hall", short: "Dining hall", k: "The Crown · Dining", p: [-105.37, -81.73], az0: -52, img: "pano/crown_dining.jpg",
    d: "A table of polished basalt for twenty under the Dining spire, glass globes over it, linen chairs, and the afternoon sun low through the slots.",
    links: [{ id: "crown_salon", at: [-95.11, -83.85, 0], label: "The Glide: to the salon" }, { id: "crown_sunset", at: [-104.87, -71.27, 0], label: "The Glide: to the sunset lounge" }] },
  { id: "crown_sunset", place: "crown", ready: false, name: "The sunset lounge", short: "Sunset lounge", k: "The Crown · Sunset lounge", p: [-131.75, 0.0], az0: 90, img: "pano/crown_sunset.jpg",
    d: "The west side of the ring: low sofas face the west slots, and at sunset the sun shines straight in for a few minutes while the sky round it turns blue, as the sky of Mars does.",
    links: [{ id: "crown_dining", at: [-126.55, -7.96, 0], label: "The Glide: to the dining hall" }, { id: "crown_arrival", at: [-126.55, 7.96, 0], label: "The Glide: round to the Arrival hall" }, { id: "crown_library", at: [-125.52, 17.64, 0], label: "The Glide: to the library" }] },
  { id: "crown_library", place: "crown", name: "The library", short: "Library up", k: "The Crown · Library", p: [-107.97, 73.93], az0: -34, img: "pano/crown_library.jpg",
    d: "Two floors of walnut shelves along the outer wall under the Library spire, 9.5 m tall: a gallery reached by a spiral stair, low cases along the Glide, long reading tables under brass pendants, and the window slots between the two floors of books.",
    links: [{ id: "crown_sunset", at: [-109.77, 63.38, 0], label: "The Glide: to the sunset lounge" }, { id: "crown_maproom", at: [-90.0, 94.84, 0], label: "The map room" }, { id: "crown_arrival", at: [-98.5, 79.77, 0], label: "The Glide: round to the Arrival hall" }] },
  { id: "crown_maproom", place: "crown", ready: false, name: "The map room", short: "Map room", k: "The Crown · Library", p: [-87.49, 97.17], az0: -41, img: "pano/crown_maproom.jpg",
    d: "A globe of Mars 3 m across in a bronze meridian, lit from the spire, and chests of map drawers along the wall. The library is through the opening.",
    links: [{ id: "crown_library", at: [-90.83, 94.05, 0], label: "The library" }] }
];
window.TOUR_PHOTOS = [
  { img: "photos/hero.jpg", caption: "The family room on L1, from the fireplace end, looking out through the glass to the atrium and the portal column." },
  { img: "photos/living.jpg", caption: "The family room: the fire, the books and a skylight. The sofa, the chairs, the pouf, the plant and the flowers are 3D scans of real things." },
  { img: "photos/crown_salon.jpg", caption: "The great salon in the Crown, 41 m above the plain: linen sofas, olive trees, an oak ceiling lit from its coves, and the slots through the ring's outer wall. The Glide runs along the right." },
  { img: "photos/crown_bedroom.jpg", caption: "The master suite up in the Crown: pale oak walls, a floor of linen-coloured stone, the bed facing the south-east slots, where the sun rises straight across the room." },
  { img: "photos/library.jpg", caption: "The great library on L1: two storeys of books, a gallery reached by a spiral stair, reading tables under lamps, and daylight from the skylights." },
  { img: "photos/crown_library.jpg", caption: "The Crown's Library: two floors of walnut shelves along the curve of the ring, a gallery reached by a spiral stair, reading tables under brass pendants, the window slots between the shelves." },
  { img: "photos/crown_maproom.jpg", caption: "The map room in the Crown's Library: a globe of Mars 3 m across in a bronze meridian, chests of map drawers, the afternoon sun through the slots." }
];
