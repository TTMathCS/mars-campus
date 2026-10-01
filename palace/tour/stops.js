/* The tour's stops: each is a 360° render of the 3D model (Blender Cycles, path-traced). Positions are in the
   family room's frame, in metres: x along the glass onto the atrium (y = 0), y into the room, z the height of the
   floor you stand on (0 = L1). az0 is where you look first (degrees: 0 = into the room, 90 = to the left,
   180 = out to the atrium). A link is a stop's id, or { id, at: [x, y, z] } to put its ring somewhere else (the portal). */
window.TOUR_STOPS = [
  { id: "fire", name: "By the fire", short: "The fire", k: "L1 · Jim's family room", p: [0.8, 11.3], az0: 20, img: "pano/fire.jpg",
    d: "The family room: a hearth of lit mist in a travertine chimney breast (no open flames in air with 27% oxygen), walnut shelves lit from within, an oak ceiling and a skylight full of the Sun Well's light. The doors either side go out to the street and the master suite.",
    links: ["glass", "piano", "table"] },
  { id: "glass", name: "At the glass", short: "The glass", k: "L1 · Jim's family room", p: [2.6, 1.1], az0: 180, img: "pano/glass.jpg",
    d: "The whole front of the room is glass onto the atrium gardens, with doors out to the terrace. A chess table in the light; the music room is through the wall to the left, the dining room to the right.",
    links: ["fire", "terrace", "piano", "table"] },
  { id: "piano", ready: false, name: "The music room", short: "Music room", k: "L1 · Jim's residence", p: [-11.2, 6.2], az0: 172, img: "pano/piano.jpg",
    d: "The grand piano by the glass, a sofa and two chairs to listen from, and books along the back wall. The opening in the wall goes through to the family room.",
    links: ["fire", "glass"] },
  { id: "table", ready: false, name: "The dining room", short: "Dining room", k: "L1 · Jim's residence", p: [9.4, 9.8], az0: 196, img: "pano/table.jpg",
    d: "A walnut table for eight under five glass globes, a sideboard under a painting, shelves of books, and the atrium through the glass. The family room is through the opening.",
    links: ["fire", "glass"] },
  { id: "terrace", ready: false, name: "On the terrace", short: "Terrace", k: "L1 · The atrium", p: [0.0, -1.9], z: -0.02, az0: 180, img: "pano/terrace.jpg",
    d: "Outside the family room: olive trees and box hedges, vines trailing over the glass, Jim's study upstairs, and the bridge out to the portal column under the sky lens.",
    links: ["glass", "bridge"] },
  { id: "bridge", ready: false, name: "On the bridge", short: "Bridge", k: "L1 · The atrium, 24 m down", p: [0.0, -11.0], z: -0.02, az0: 140, img: "pano/bridge.jpg",
    d: "Halfway out to the portal column. The atrium goes on down 44 m to the sun court, past the garden level and the studios; the sky lens of the Sun Well is overhead. The portal at the end of the bridge goes to any level.",
    links: ["terrace", { id: "court", at: [0.6, -18.6, 1.4], label: "Portal: down to the sun court" }, { id: "crown_arrival", at: [-0.6, -18.6, 2.6], label: "Portal: up to the Crown" }] },
  { id: "court", ready: false, name: "The sun court", short: "Sun court", k: "L5 · 68 m down", p: [0.0, -35.6], z: -44.05, az0: 0, img: "pano/court.jpg",
    d: "The bottom of the atrium: a lawn with olive trees round a pool at the foot of the column, in the light of the sky lens 52 m above. Behind the glass all round are the halls of L5: the maglev, the freight portals, the seed vault and the rovers.",
    links: [{ id: "bridge", at: [2.9, -28.1, -42.5], label: "Portal: up to L1" }] },

  /* The Crown, above ground: positions in metres from the ring's centre, x east, y north (the ring's rooms lie between
     125 and 135 m out, the Glide along the inner wall); z from the main floor, 41 m up. */
  { id: "crown_arrival", place: "crown", ready: false, name: "The Arrival hall", short: "Arrival", k: "The Crown · Arrival", p: [129.26, -27.00], az0: -12, img: "pano/crown_arrival.jpg",
    d: "The first room above ground: 9 m tall, polished basalt, a long olive-wood bench, an olive tree, and slots through both walls; through the inner ones the mirror Orb floats over the garden. Behind you the Door, a ring of light that knows you; at the far end the portal.",
    links: [{ id: "crown_bedroom", at: [122.25, -33.67, 0], label: "The Glide: to the master suite" }, { id: "bridge", at: [125.72, -39.40, 1.6], label: "Portal: down to the Pentagon" }] },
  { id: "crown_bedroom", place: "crown", ready: false, name: "The master suite up", short: "Bedroom up", k: "The Crown · Master suite up", p: [108.79, -75.90], az0: 55, img: "pano/crown_bedroom.jpg",
    d: "Pale oak walls, a floor of linen-coloured stone, and the bed facing the south-east slots: on a clear morning the sun rises straight across the room. A sitting corner by the slots, a desk at the far end.",
    links: [{ id: "crown_arrival", at: [108.35, -65.87, 0], label: "The Glide: to the Arrival hall" }, { id: "crown_salon", at: [99.23, -78.93, 0], label: "The Glide: to the salon" }] },
  { id: "crown_salon", place: "crown", ready: false, name: "The great salon", short: "Salon", k: "The Crown · Salon", p: [40.71, -125.30], az0: -162, img: "pano/crown_salon.jpg",
    d: "45 m along the curve of the ring: linen sofas round wool rugs, olive-wood tables, olive trees, an oak ceiling lit from its coves, and the sun in blades through the slots. A hearth of lit mist at one end, the concert grand at the other.",
    links: [{ id: "crown_bedroom", at: [46.68, -117.90, 0], label: "The Glide: to the master suite" }, { id: "crown_dining", at: [31.53, -122.82, 0], label: "The Glide: to the dining hall" }] },
  { id: "crown_dining", place: "crown", ready: false, name: "The dining hall", short: "Dining hall", k: "The Crown · Dining", p: [-105.37, -81.73], az0: -52, img: "pano/crown_dining.jpg",
    d: "A table of polished basalt for twenty under the Dining spire, glass globes over it, linen chairs, and the afternoon sun low through the slots.",
    links: [{ id: "crown_salon", at: [-95.11, -83.85, 0], label: "The Glide: to the salon" }, { id: "crown_sunset", at: [-104.87, -71.27, 0], label: "The Glide: to the sunset lounge" }] },
  { id: "crown_sunset", place: "crown", ready: false, name: "The sunset lounge", short: "Sunset lounge", k: "The Crown · Sunset lounge", p: [-131.75, 0.0], az0: 90, img: "pano/crown_sunset.jpg",
    d: "The west side of the ring: low sofas face the west slots, and at sunset the sun shines straight in for a few minutes while the sky round it turns blue, as the sky of Mars does.",
    links: [{ id: "crown_dining", at: [-126.55, -7.96, 0], label: "The Glide: to the dining hall" }, { id: "crown_arrival", at: [-126.55, 7.96, 0], label: "The Glide: round to the Arrival hall" }] }
];
window.TOUR_PHOTOS = [
  { img: "photos/hero.jpg", caption: "The family room on L1, from the fireplace end, looking out through the glass to the atrium and the portal column." },
  { img: "photos/living.jpg", caption: "The family room: the fire, the books and a skylight. The sofa, the chairs, the pouf, the plant and the flowers are 3D scans of real things." }
];
