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
    links: ["terrace", { id: "court", at: [0.0, -18.6, 1.6], label: "Portal: down to the sun court" }] },
  { id: "court", ready: false, name: "The sun court", short: "Sun court", k: "L5 · 68 m down", p: [0.0, -35.6], z: -44.05, az0: 0, img: "pano/court.jpg",
    d: "The bottom of the atrium: a lawn with olive trees round a pool at the foot of the column, in the light of the sky lens 52 m above. Behind the glass all round are the halls of L5: the maglev, the freight portals, the seed vault and the rovers.",
    links: [{ id: "bridge", at: [2.9, -28.1, -42.5], label: "Portal: up to L1" }] }
];
window.TOUR_PHOTOS = [
  { img: "photos/hero.jpg", caption: "The family room on L1, from the fireplace end, looking out through the glass to the atrium and the portal column." },
  { img: "photos/living.jpg", caption: "The family room: the fire, the books and a skylight. The sofa, the chairs, the pouf, the plant and the flowers are 3D scans of real things." }
];
