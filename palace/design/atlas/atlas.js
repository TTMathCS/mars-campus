/* ==============================================================================================
   Mars Atlas: a zoomable map from the solar system down to Arcadia, Jim's home on Mars.
   - Mars is drawn from real global mosaics served as 512 px tiles by Esri OnMars (Viking MDIM 2.1
     colour, and MOLA + HRSC colour-coded relief). Tiles stream in as you zoom, like Google Earth.
     If they can't load, a simplified map drawn from known feature positions stands in.
   - Units are kilometres. The camera always sits at the origin and the world is moved around it,
     so positions keep full precision from 10^9 km down to a metre.
   - Mars frame: +y is the north pole, longitude east is a positive turn about +y.
   - Jim's design (the Crown, the spaceport, the city, the pod route) uses the demo's frame:
     metres, x east, y up, z south, with the Crown's centre at the origin.
   ============================================================================================== */
(function () {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var RM = 3396.19, AU = 149597870.7, KMDEG = 2 * Math.PI * RM / 360;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function fmt(n, d) { return n.toLocaleString("en-US", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------------------------------------------------------- where things are */
  // Arcadia Spaceport sits on AP-1, the safest of the Arcadia Planitia sites studied for SpaceX Starship
  // (Golombek et al., LPSC 2021: 39.8° N, 202.1° E, -3.9 km). Arcadia is 30 km due west.
  var PORT_LL = { lat: 39.80, lon: 202.10 };
  var HOUSE_LL = { lat: 39.80, lon: 202.10 - 30 / (KMDEG * Math.cos(39.80 * D2R)) };
  function nrm(lat, lon, out) { var a = lat * D2R, b = lon * D2R, c = Math.cos(a); out = out || new THREE.Vector3(); return out.set(c * Math.cos(b), Math.sin(a), -c * Math.sin(b)); }
  function toLL(v) { var n = v.clone().normalize(); var lon = Math.atan2(-n.z, n.x) * R2D; if (lon < 0) lon += 360; return { lat: Math.asin(clamp(n.y, -1, 1)) * R2D, lon: lon }; }
  function enu(lat, lon) {
    var u = nrm(lat, lon), b = lon * D2R, a = lat * D2R;
    var e = new THREE.Vector3(-Math.sin(b), 0, -Math.cos(b));
    var n = new THREE.Vector3(-Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b));
    return { u: u, e: e, n: n };
  }
  // design frame (metres; x east, y up, z south; origin at the Crown) to the Mars frame (km)
  var HB = enu(HOUSE_LL.lat, HOUSE_LL.lon), HOUSE_P = nrm(HOUSE_LL.lat, HOUSE_LL.lon).multiplyScalar(RM);
  function site(x, y, z) { return HOUSE_P.clone().addScaledVector(HB.e, x / 1000).addScaledVector(HB.u, y / 1000).addScaledVector(HB.n, -z / 1000); }
  function siteLL(x, z) { return toLL(site(x, 0, z)); }

  /* ---------------------------------------------------------------- places */
  var BOOK = "../";
  var P = [];
  function place(o) { P.push(o); return o; }
  // Jim's Mars
  place({ id: "house", kind: "jim", name: "Arcadia · Jim's home", sub: "Crown above, Pentagon below", lat: HOUSE_LL.lat, lon: HOUSE_LL.lon, size: 1.2, prio: 100, view: { d: 1.25, tilt: 58, head: 118 },
    k: "Jim's Mars · home", d: "The Crown, a white ring 276 m across, floats 40 m above the Stone Garden on anti-gravity drives in its five spires. The mirror Orb hovers at its centre: the universe fills its rooms in 3D at a switch, round the Wormhole Gate. Below the ground, the Pentagon holds five levels, 209,700 m².", link: ["The Crown", BOOK + "crown.html"] });
  place({ id: "port", kind: "jim", name: "Arcadia Spaceport", sub: "30 km east of Arcadia", lat: PORT_LL.lat, lon: PORT_LL.lon, size: 4, prio: 95, view: { d: 5.5, tilt: 50, head: 70 },
    k: "Jim's Mars · spaceport", d: "Three pads for ships from Earth, the terminal, a fuel plant that makes methane and oxygen from ground ice and air, the pod station and two buried reactors, with no panels on the ground. It stands on AP-1, the safest of the Arcadia Planitia sites studied as a landing site for SpaceX Starship.", link: ["The spaceport", BOOK + "spaceport.html"] });
  var cityLL = siteLL(0, -1500);
  place({ id: "city", kind: "jim", name: "Arcadia City", sub: "future · grows round Arcadia", lat: cityLL.lat, lon: cityLL.lon, size: 9, prio: 90, view: { d: 11, tilt: 35, head: 0 },
    k: "Jim's Mars · the future city", d: "Homes take the seeds of a sunflower spiral round the Crown, 137.5° apart and about 450 m from their neighbours. The civic buildings fall on the Fibonacci seeds, which line up due north as one avenue. 233 homes reach 3.8 km out.", link: ["Site and city", BOOK + "site.html"] });
  place({ id: "ttmath", kind: "jim", name: "TTMath campus", sub: "Dingo Gap, Gale crater", lat: -4.605, lon: 137.405, size: 3, prio: 88, view: { d: 6, tilt: 45, head: 20 },
    k: "TTMath on Mars", d: "The TTMath school campus stands at Dingo Gap in Gale crater, where the Curiosity rover crossed a sand dune in 2014. Its ground is NASA's real 3D model of the place. It is 4,360 km from Arcadia.", link: ["Walk into the campus", "../../../ttmath/"] });
  place({ id: "ap9", kind: "site", name: "Ice field AP-9", sub: "thickest ice · future ice mine", lat: 40.02, lon: 203.35, size: 6, prio: 60, maxD: 1400,
    k: "Resources", d: "Another studied Starship site, 58 km east of the spaceport, with the thickest ice seen by radar in the area. A later ice mine and a second landing field could go here." });
  // landmarks
  var F = [
    ["olympus", "Olympus Mons", 18.65, 226.2, 600, "The tallest volcano in the solar system: 22 km high and 600 km across, about the size of Poland.", 1],
    ["tharsis", "Tharsis", 2, 250, 4000, "A volcanic plateau 4,000 km across and up to 10 km high, with three giant volcanoes in a row.", 2],
    ["ascraeus", "Ascraeus Mons", 11.92, 255.92, 480, "The northernmost of the three Tharsis volcanoes, 18 km high.", 0],
    ["pavonis", "Pavonis Mons", 1.48, 247.04, 375, "The middle Tharsis volcano, right on the equator. A favourite idea for a space elevator.", 0],
    ["arsia", "Arsia Mons", -8.26, 239.91, 435, "The southern Tharsis volcano, with a 110 km caldera.", 0],
    ["alba", "Alba Mons", 40.47, 250.4, 1500, "The widest volcano on Mars, so flat that you could hardly see it standing on it.", 0],
    ["elysium", "Elysium Mons", 24.8, 146.9, 700, "The main volcano of the Elysium rise, 12.6 km high.", 1],
    ["valles", "Valles Marineris", -13.9, 300.8, 4000, "A canyon system 4,000 km long and up to 7 km deep. It would stretch across the United States.", 2],
    ["noctis", "Noctis Labyrinthus", -6.8, 258.4, 1100, "The labyrinth of the night: a maze of canyons at the head of Valles Marineris.", 0],
    ["hellas", "Hellas Planitia", -42.4, 70.5, 2300, "An impact basin 2,300 km across and 7 km deep, the lowest place on Mars. The air at the bottom is twice as thick as at the average height.", 2],
    ["argyre", "Argyre Planitia", -49.7, 316, 1800, "An impact basin ringed by mountains in the southern highlands.", 1],
    ["isidis", "Isidis Planitia", 12.9, 87, 1500, "An impact basin at the edge of the highlands. Jezero crater, where Perseverance landed, is on its rim.", 1],
    ["utopia", "Utopia Planitia", 46.7, 117.5, 3300, "The largest known impact basin on Mars, now a smooth plain with buried ice. Viking 2 and Zhurong landed here.", 2],
    ["arcadia", "Arcadia Planitia", 47.2, 184.3, 1500, "Smooth, low northern plains with thick ice not far under the surface: the reason Arcadia and its spaceport are here.", 2],
    ["amazonis", "Amazonis Planitia", 24.8, 196, 2800, "Among the flattest and youngest plains on Mars, south of Arcadia.", 1],
    ["acidalia", "Acidalia Planitia", 49.8, 339.3, 2300, "A dark plain in the north, easy to see even through a small telescope from Earth.", 1],
    ["chryse", "Chryse Planitia", 28.4, 319.7, 1600, "A plain where ancient floods drained into the north. Viking 1 and Pathfinder landed here.", 1],
    ["vastitas", "Vastitas Borealis", 72, 200, 5000, "The vast northern lowlands that ring the polar cap. Some think an ocean once filled them.", 2],
    ["elyp", "Elysium Planitia", 2.0, 154.7, 3000, "A broad young plain along the equator. InSight listened for marsquakes here.", 1],
    ["arabia", "Arabia Terra", 21.2, 6, 4500, "Old, heavily cratered highlands, bright with dust.", 2],
    ["cimmeria", "Terra Cimmeria", -32.7, 145.5, 5000, "Ancient southern highlands with bands of magnetised rock.", 1],
    ["sabaea", "Terra Sabaea", 2, 42, 4000, "Cratered highlands between Arabia and Hellas.", 1],
    ["noachis", "Noachis Terra", -45, 350, 5000, "The oldest highlands, which gave Mars' oldest era its name, the Noachian.", 1],
    ["tempe", "Tempe Terra", 39.7, 288.6, 1600, "A highland block north of Tharsis, cut by long fractures.", 0],
    ["syrtis", "Syrtis Major", 8.4, 69.5, 1350, "A dark volcanic plateau, the first feature ever mapped on another planet (Huygens, 1659).", 1],
    ["meridiani", "Meridiani Planum", -0.2, 357.5, 1100, "Plains of layered rock where Opportunity found signs of ancient water.", 1],
    ["boreum", "North polar cap", 87.5, 20, 1000, "Planum Boreum: a dome of water ice 3 km thick and 1,000 km across.", 1],
    ["australe", "South polar cap", -84, 320, 900, "Planum Australe: water ice capped by a layer of frozen carbon dioxide.", 1],
    ["phlegra", "Phlegra Montes", 40.4, 163.7, 1400, "A long ridge of hills west of Arcadia with glaciers of buried ice on its flanks.", 0],
    ["cerberus", "Cerberus Fossae", 11.28, 166.37, 1200, "Young fractures where many marsquakes seen by InSight came from.", 0],
    ["medusae", "Medusae Fossae", -3.2, 197, 1000, "Soft wind-carved rock, perhaps volcanic ash, south of Amazonis.", 0],
    ["gale", "Gale crater", -5.37, 137.81, 154, "A 154 km crater with a 5 km mountain of layered rock in the middle, Mount Sharp. Home of Curiosity and of the TTMath campus.", 0],
    ["jezero", "Jezero crater", 18.38, 77.58, 49, "An old lake with a river delta. Perseverance is collecting samples here.", 0],
    ["gusev", "Gusev crater", -14.5, 175.4, 166, "A crater where the Spirit rover explored from 2004 to 2010.", 0],
    ["huygens", "Huygens crater", -13.9, 55.6, 467, "A great old crater in the southern highlands.", 0],
    ["schiap", "Schiaparelli crater", -2.7, 16.7, 459, "A large crater named after the astronomer who mapped the 'canali'.", 0],
    ["korolev", "Korolev crater", 73.0, 165.0, 82, "An 82 km crater filled with a mound of water ice 1.8 km thick, all year round.", 0],
    ["lyot", "Lyot crater", 50.5, 29.3, 236, "A fresh crater in the north with layers of ice-rich ejecta.", 0]
  ];
  F.forEach(function (f) { place({ id: f[0], kind: "feature", name: f[1], lat: f[2], lon: f[3], size: f[4], big: f[6], prio: 20 + f[6] * 15 + Math.log(f[4]) * 2, k: "Landmark", d: f[5] }); });
  // rovers and landers
  var L = [
    ["viking1", "Viking 1", 22.27, 312.05, "1976", "The first successful landing on Mars that sent back pictures from the surface for years."],
    ["viking2", "Viking 2", 47.64, 134.29, "1976", "Landed on Utopia Planitia and saw frost on the ground in winter."],
    ["pathfinder", "Pathfinder and Sojourner", 19.13, 326.78, "1997", "The first rover on Mars, the size of a microwave oven."],
    ["spirit", "Spirit", -14.57, 175.47, "2004", "A rover that drove 7.7 km in Gusev crater."],
    ["oppy", "Opportunity", -1.95, 354.47, "2004", "Planned for 90 days, it drove 45 km over 14 years."],
    ["phoenix", "Phoenix", 68.22, 234.25, "2008", "Dug into the northern plains and touched water ice just under the soil."],
    ["curiosity", "Curiosity", -4.59, 137.44, "2012", "The car-sized rover climbing Mount Sharp in Gale crater."],
    ["insight", "InSight", 4.50, 135.62, "2018", "Measured more than 1,300 marsquakes and the size of Mars' core."],
    ["perseverance", "Perseverance and Ingenuity", 18.44, 77.45, "2021", "The sample-collecting rover and the first helicopter to fly on another planet."],
    ["zhurong", "Zhurong", 25.07, 109.93, "2021", "China's first Mars rover, on southern Utopia Planitia."],
    ["mars3", "Mars 3", -45, 202, "1971", "The first soft landing on Mars. It worked for 20 seconds."]
  ];
  L.forEach(function (l) { place({ id: l[0], kind: "lander", name: l[1], sub: l[4], lat: l[2], lon: l[3], size: 60, prio: 30, maxD: 9000, k: "Rovers and landers · " + l[4], d: l[5] }); });
  // parts of the site, in the design frame
  var SITEP = [
    ["crown", "The Crown", 0, 0, 90, 4, "Arcadia above ground. Its five spires hold the anti-gravity drives; the pod hangar is in the east spire."],
    ["orb", "The Orb", 0, 0, 72, 3.2, "A mirror sphere 48 m across floating over the Sun Well. Inside, rooms ring the Wormhole Gate, a ball that shoots you like light to any place and time. Switch the universe on and it fills the room in 3D, with Earth and Mars and their weather in the corner. Rest rooms behind radiation glass."],
    ["garden", "Stone Garden", -75, 60, 1, 1.4, "Raked gravel and seven basalt stones round the Sun Well's sky lens. Nothing else stands on the ground."],
    ["pentagon", "The Pentagon", 118, -118, 0, 3, "Five levels below ground, from 24 to 68 m down, under 16 m of soil that stops radiation."],
    ["terminal", "Terminal", 30000, 0, 34, 8, "Arrivals, health check and lounge. A maglev station opens under it in phase 2."],
    ["podst", "Pod station", 29615, 0, 18, 6, "Four pod pads and a hangar, on the side facing home."],
    ["tower", "Control tower", 29850, -190, 77, 6, "Watches the pads, the pods and the weather."],
    ["pad1", "Pad 1", 31386, -800, 6, 10, "Landing pad for ships from Earth, behind a berm that catches thrown rocks."],
    ["pad2", "Pad 2 · ship from Earth", 31600, 0, 52, 10, "The ship Jim arrived on, venting vapour while it refuels for the trip back."],
    ["pad3", "Pad 3", 31386, 800, 6, 10, "Third landing pad."],
    ["fuel", "Fuel plant", 30455, -840, 14, 8, "Turns ice and carbon dioxide into methane and oxygen for the ships."],
    ["tanks", "Tank farm", 30700, -810, 38, 8, "Six spheres of liquid methane and oxygen."],
    ["mine", "Ice mine", 29700, -1050, 0, 8, "An open pit into the ice-rich ground. Conveyors carry ice to the fuel plant."],
    ["reactor", "Reactors", 29440, 380, 6, 8, "Two fission reactors buried behind a keep-out ring: power for the port and the fuel plant, day and night, in storms too."],
    ["cargo", "Cargo yard", 30545, 290, 8, 8, "Containers from Earth and from the city's workshops."],
    ["dunes", "Dune Sea", 21300, -3300, 20, 40, "Dark sand dunes crossed by dust devils. Part of the demo's scenic route."],
    ["crater", "Crater, 3.2 km", 13800, -2300, 55, 30, "A crater with frost in its shadows. Part of the demo's scenic route."],
    ["cliffs", "Ice Cliffs", 8400, 2300, 0, 30, "A 100 m scarp of layered ice, blue in the shade. Part of the demo's scenic route."],
    ["storm", "Dust storm (in the video)", 5150, 2250, 800, 40, "Where the pod flies through a dust storm in the flight video."]
  ];
  SITEP.forEach(function (s) { var ll = siteLL(s[2], s[3]); place({ id: s[0], kind: "site", name: s[1], lat: ll.lat, lon: ll.lon, h: s[4], size: 0.3, maxD: s[5], prio: 70, k: "Jim's Mars · site", d: s[6], sx: s[2], sz: s[3] }); });

  /* ---------------------------------------------------------------- planets (JPL approximate elements, J2000 + rates per century) */
  var EL = {
    Mercury: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    Venus: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
    Earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    Mars: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    Jupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]
  };
  function helio(name, jd, M_override) {
    var e0 = EL[name], T = (jd - 2451545.0) / 36525;
    var a = e0[0] + e0[6] * T, e = e0[1] + e0[7] * T, I = (e0[2] + e0[8] * T) * D2R, Lm = e0[3] + e0[9] * T, wb = e0[4] + e0[10] * T, Om = (e0[5] + e0[11] * T) * D2R;
    var w = (wb * D2R) - Om, M = M_override !== undefined ? M_override : (((Lm - wb) % 360) + 540) % 360 - 180;
    M *= D2R; var E = M + e * Math.sin(M);
    for (var i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    var xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), cI = Math.cos(I), sI = Math.sin(I);
    var x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
    var y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
    var z = (sw * sI) * xp + (cw * sI) * yp;
    return new THREE.Vector3(x * AU, z * AU, -y * AU);   // ecliptic to world: y up = ecliptic north
  }
  var JD = Date.now() / 86400000 + 2440587.5;

  /* ---------------------------------------------------------------- renderer, scene, frames */
  var canvas = $("map");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: !!window.__atlasDebug });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 1e-5, 2e10);
  var world = new THREE.Group(); scene.add(world);                 // heliocentric ecliptic frame, moved so the camera is at the origin
  var MARS_W = helio("Mars", JD);
  var marsG = new THREE.Group(); world.add(marsG);                  // Mars frame
  marsG.position.copy(MARS_W);
  marsG.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -25.19 * D2R);
  var sunDirW = MARS_W.clone().negate().normalize();
  var amb = new THREE.AmbientLight(0xffffff, 0.55); scene.add(amb);
  var key = new THREE.DirectionalLight(0xfff4e8, 0.75); scene.add(key); scene.add(key.target);
  var LIGHT_V = new THREE.Vector3();

  /* ---------------------------------------------------------------- a simplified Mars, drawn from known features, until the real tiles arrive */
  function fallbackMaps() {
    var W = 1024, H = 512;
    var hgt = new Float32Array(W * H), alb = new Float32Array(W * H);
    function hsh(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
    function vn(x, y) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); var a = hsh(ix, iy), b = hsh(ix + 1, iy), c = hsh(ix, iy + 1), d = hsh(ix + 1, iy + 1); return lerp(lerp(a, b, fx), lerp(c, d, fx), fy); }
    function fbm(x, y) { return vn(x, y) * 0.5 + vn(x * 2.1, y * 2.1) * 0.25 + vn(x * 4.3, y * 4.3) * 0.125 + vn(x * 8.7, y * 8.7) * 0.0625; }
    function gd(lat, lon, la, lo, s) { var dl = lat - la, dg = ((lon - lo + 540) % 360) - 180; dg *= Math.cos(lat * D2R); return Math.exp(-(dl * dl + dg * dg) / (2 * s * s)); }
    var hills = [[18.65, 226.2, 20, 3.2], [11.9, 255.9, 14, 2.2], [1.5, 247, 11, 1.9], [-8.3, 239.9, 14, 2.1], [40.5, 250.4, 4.5, 6], [24.8, 146.9, 9, 2.6], [8.4, 69.5, 1.5, 7], [-9.3, 174.4, 3.5, 1.5]];
    var basins = [[-42.4, 70.5, -7.5, 13], [-49.7, 316, -3.5, 9], [12.9, 87, -2.5, 7], [46.7, 117.5, -1.5, 16]];
    var darks = [[9, 69, 7, 0.85], [-6, 350, 9, 0.6], [-8, 15, 9, 0.6], [-8, 40, 8, 0.55], [-20, 102, 10, 0.55], [-24, 146, 11, 0.6], [-30, 205, 10, 0.55], [-24, 322, 12, 0.45], [-27, 272, 5, 0.45], [-14, 311, 5, 0.45], [46, 330, 11, 0.75], [44, 110, 9, 0.35], [68, 150, 10, 0.3], [67, 280, 10, 0.35], [-60, 60, 12, 0.3]];
    var brights = [[3, 245, 22, 0.35], [20, 8, 18, 0.4], [26, 150, 12, 0.3], [-42, 70, 12, 0.35], [30, 195, 18, 0.3], [45, 185, 14, 0.15]];
    for (var j = 0; j < H; j++) {
      var lat = 90 - (j + 0.5) / H * 180;
      for (var i = 0; i < W; i++) {
        var lon = (i + 0.5) / W * 360 - 180, lonE = (lon + 360) % 360;
        var bnd = 17 + 16 * Math.cos((lonE - 12) * D2R) + 6 * Math.sin(lonE * 3 * D2R);
        var tb = smooth(bnd - 5, bnd + 5, lat), h = lerp(1.5 + 0.7 * fbm(lonE / 20, lat / 20), -4.1 + 0.5 * fbm(lonE / 30, lat / 30), tb);
        h += 6.5 * gd(lat, lonE, 0, 250, 20);
        hills.forEach(function (v) { h += v[2] * gd(lat, lonE, v[0], v[1], v[3]); });
        basins.forEach(function (v) { h += v[2] * gd(lat, lonE, v[0], v[1], v[3]); });
        // Valles Marineris
        if (lonE > 258 && lonE < 322) { var vc = -9 - 5 * Math.sin((lonE - 258) / 64 * Math.PI) * 0.6 - (lonE > 300 ? (lonE - 300) * 0.12 : 0); h -= 5.5 * Math.exp(-Math.pow((lat - vc) / 1.1, 2)) * smooth(258, 266, lonE) * (1 - smooth(310, 322, lonE)); }
        // craters in the highlands
        var cx = lonE / 4.5, cy = (lat + 90) / 4.5, fx = Math.floor(cx), fy = Math.floor(cy);
        for (var q = -1; q <= 1; q++) for (var r = -1; r <= 1; r++) {
          var gx = fx + q, gy = fy + r, rr = hsh(gx, gy); if (rr < 0.45) continue;
          var ox = gx + hsh(gx + 7, gy) , oy = gy + hsh(gx, gy + 3), dd = Math.hypot((cx - ox) * Math.cos(lat * D2R), cy - oy) / (0.15 + 0.5 * hsh(gx + 1, gy + 2));
          if (dd < 1.4) h += (dd < 1 ? -0.9 * (1 - dd * dd) : 0.35 * (1.4 - dd) / 0.4 * (dd - 1) / 0.4 * 4) * (1 - tb * 0.8);
        }
        var a = 0.62 + 0.12 * (fbm(lonE / 9, lat / 9) - 0.5);
        darks.forEach(function (v) { a -= v[3] * 0.42 * gd(lat, lonE, v[0], v[1], v[2]) * (0.7 + 0.6 * fbm(lonE / 6 + v[0], lat / 6)); });
        brights.forEach(function (v) { a += v[3] * 0.3 * gd(lat, lonE, v[0], v[1], v[2]); });
        var cap = lat > 0 ? smooth(78, 84, lat + 3 * (fbm(lonE / 10, 3) - 0.5)) : smooth(79, 85, -lat + 5 * Math.cos((lonE - 315) * D2R) + 3 * (fbm(lonE / 10, 7) - 0.5));
        hgt[j * W + i] = h; alb[j * W + i] = clamp(a, 0.15, 1) * (1 - cap) + 2 * cap;
      }
    }
    function paint(terrainColours) {
      var c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data;
      var ramp = [[-8, [30, 30, 110]], [-5.5, [40, 90, 200]], [-3.5, [60, 170, 210]], [-1.5, [80, 190, 110]], [0, [220, 210, 90]], [2, [225, 145, 60]], [5, [200, 70, 45]], [10, [150, 90, 80]], [18, [240, 235, 230]]];
      for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
        var k = j * W + i, h = hgt[k], hx = hgt[j * W + ((i + 1) % W)] - hgt[j * W + ((i + W - 1) % W)], hy = hgt[Math.min(H - 1, j + 1) * W + i] - hgt[Math.max(0, j - 1) * W + i];
        var sh = clamp(1 + (-hx * 0.8 + hy * 0.8) * 0.35, 0.55, 1.45), rgb;
        if (terrainColours) {
          var n = 0; while (n < ramp.length - 2 && h > ramp[n + 1][0]) n++;
          var t = clamp((h - ramp[n][0]) / (ramp[n + 1][0] - ramp[n][0]), 0, 1); rgb = [0, 1, 2].map(function (m) { return lerp(ramp[n][1][m], ramp[n + 1][1][m], t); });
          if (alb[k] > 1.5) rgb = [240, 240, 245];
        } else {
          var a = alb[k];
          rgb = a > 1.5 ? [236, 232, 226] : [lerp(92, 205, a), lerp(62, 132, a), lerp(48, 88, a)];
        }
        d[k * 4] = clamp(rgb[0] * sh, 0, 255); d[k * 4 + 1] = clamp(rgb[1] * sh, 0, 255); d[k * 4 + 2] = clamp(rgb[2] * sh, 0, 255); d[k * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
    }
    return { MDIM: paint(false), MColorDEM: paint(true) };
  }

  /* ---------------------------------------------------------------- the globe: base sphere and streamed tiles */
  var TILE_V = "#include <common>\n#include <logdepthbuf_pars_vertex>\nattribute vec3 dir; uniform float uLift; varying vec2 vUv; varying vec3 vN;\nvoid main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * dir); vec3 p = position + dir * uLift; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);\n#include <logdepthbuf_vertex>\n}";
  var TILE_F = "#include <logdepthbuf_pars_fragment>\nuniform sampler2D map; uniform vec3 uLight; uniform float uFade; varying vec2 vUv; varying vec3 vN;\nvoid main(){ vec3 c = texture2D(map, vUv).rgb; float l = 0.80 + 0.32 * max(dot(normalize(vN), uLight), 0.0); gl_FragColor = vec4(c * l, uFade);\n#include <logdepthbuf_fragment>\n}";
  var LIGHT_U = { value: new THREE.Vector3(0, 1, 0) };
  function patch(lat0, lat1, lon0, lon1, n) {
    // a piece of the sphere between two latitudes and longitudes, with vertices relative to its centre
    var c = nrm((lat0 + lat1) / 2, (lon0 + lon1) / 2).multiplyScalar(RM), pos = [], dir = [], uv = [], idx = [], v = new THREE.Vector3();
    for (var j = 0; j <= n; j++) for (var i = 0; i <= n; i++) {
      var la = lerp(lat0, lat1, j / n), lo = lerp(lon0, lon1, i / n); nrm(la, lo, v);
      dir.push(v.x, v.y, v.z); pos.push(v.x * RM - c.x, v.y * RM - c.y, v.z * RM - c.z); uv.push(i / n, j / n);
    }
    for (var j2 = 0; j2 < n; j2++) for (var i2 = 0; i2 < n; i2++) { var a = j2 * (n + 1) + i2, b = a + 1, cc = a + n + 1, d = cc + 1; idx.push(a, b, d, a, d, cc); }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("dir", new THREE.Float32BufferAttribute(dir, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeBoundingSphere();
    return { g: g, c: c };
  }
  function tileMat(tex, lift, fade) {
    return new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uLift: { value: lift || 0 }, uLight: LIGHT_U, uFade: { value: fade === undefined ? 1 : fade } }, vertexShader: TILE_V, fragmentShader: TILE_F, transparent: fade !== undefined, depthWrite: fade === undefined });
  }
  var FALL = fallbackMaps();
  // the real colour map (Solar System Scope, CC BY 4.0, from NASA imagery; 0 to 360 E) replaces the simplified one as soon as it loads
  (function () {
    var im = new Image();
    im.onload = function () { var c = FALL.MDIM.image, g = c.getContext("2d"); g.drawImage(im, -c.width / 2, 0, c.width, c.height); g.drawImage(im, c.width / 2, 0, c.width, c.height); FALL.MDIM.needsUpdate = true; };
    im.src = "../img/mars-map.jpg";
  })();
  // base sphere: 8 x 4 patches carrying the simplified map (shown until tiles arrive, and in any gaps)
  var base = [];
  for (var r0 = 0; r0 < 4; r0++) for (var c0 = 0; c0 < 8; c0++) {
    var la0 = 90 - (r0 + 1) * 45, la1 = 90 - r0 * 45, lo0 = -180 + c0 * 45, lo1 = lo0 + 45, pp = patch(la0, la1, lo0, lo1, 24);
    var uvA = pp.g.attributes.uv; for (var q = 0; q < uvA.count; q++) uvA.setXY(q, (c0 + uvA.getX(q)) / 8, (3 - r0 + uvA.getY(q)) / 4);
    var m = new THREE.Mesh(pp.g, tileMat(FALL.MDIM, -0.02)); m.position.copy(pp.c); m.frustumCulled = false; m.renderOrder = 0; marsG.add(m); base.push(m);
  }
  var LAYER = "MDIM", TILE_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/{L}/MapServer/tile/{z}/{y}/{x}";
  var MAXL = { MDIM: 7, MColorDEM: 7 };
  var tiles = new Map(), loading = 0, tileFails = 0, tileOK = 0, frameNo = 0;
  var texLoader = new THREE.TextureLoader(); texLoader.setCrossOrigin("anonymous");
  function tkey(z, y, x) { return LAYER + "/" + z + "/" + y + "/" + x; }
  function getTile(z, y, x) {
    var k = tkey(z, y, x), t = tiles.get(k);
    if (!t) {
      var span = 180 / Math.pow(2, z);
      t = { z: z, y: y, x: x, span: span, lon0: -180 + x * span, lat1: 90 - y * span, lat0: 90 - (y + 1) * span, state: 0, mesh: null, used: 0, layer: LAYER };
      t.c = nrm((t.lat0 + t.lat1) / 2, t.lon0 + span / 2).multiplyScalar(RM);
      t.rad = span * D2R * RM * 0.75;
      tiles.set(k, t);
    }
    t.used = frameNo;
    return t;
  }
  var queue = [];
  function load(t) {
    if (t.state !== 0) return;
    t.state = 1; queue.push(t);
  }
  function pump() {
    queue.sort(function (a, b) { return a.z - b.z || a.pri - b.pri; });
    while (loading < 8 && queue.length) {
      var t = queue.shift(); if (t.layer !== LAYER || t.used < frameNo - 30) { t.state = 0; continue; }
      loading++;
      (function (t) {
        var url = TILE_URL.replace("{L}", t.layer).replace("{z}", t.z).replace("{y}", t.y).replace("{x}", t.x);
        texLoader.load(url, function (tex) {
          loading--; tileOK++; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
          if (t.layer !== LAYER) { tex.dispose(); t.state = 0; return; }
          var pp = patch(t.lat0, t.lat1, t.lon0, t.lon0 + t.span, t.z <= 3 ? 20 : 14);
          t.mesh = new THREE.Mesh(pp.g, tileMat(tex, 0)); t.mesh.position.copy(pp.c); t.mesh.frustumCulled = false; t.mesh.renderOrder = t.z; t.mesh.visible = false; marsG.add(t.mesh);
          t.state = 2; t.born = performance.now();
          noteImagery(true);
        }, undefined, function () { loading--; tileFails++; t.state = 3; noteImagery(false); });
      })(t);
    }
  }
  function dropTiles(all) {
    tiles.forEach(function (t, k) {
      if (all || (t.state === 2 && t.used < frameNo - 400 && tiles.size > 150)) {
        if (t.mesh) { marsG.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.uniforms.map.value.dispose(); t.mesh.material.dispose(); }
        tiles.delete(k);
      }
    });
  }
  var imageryNoted = 0;
  function noteImagery(ok) {
    if (ok && imageryNoted !== 1 && tileOK > 3) { imageryNoted = 1; toast(""); }
    if (!ok && tileFails > 6 && tileOK === 0 && imageryNoted !== 2) { imageryNoted = 2; toast("NASA's detailed imagery could not load, so a coarser colour map is shown. Check the connection and reload to try again.", 9000); }
  }
  // pick the tiles to draw: split from level 2 down while a tile's pixels look bigger than about 1.5 screen pixels
  var _v = new THREE.Vector3(), frustum = new THREE.Frustum(), projView = new THREE.Matrix4(), _sph = new THREE.Sphere();
  function selectTiles(camL, pxK) {
    var draw = [];
    var camLen = camL.length();
    function visit(z, y, x) {
      var t = getTile(z, y, x);
      _v.copy(t.c).sub(camL); var dist = Math.max(0.001, _v.length() - t.rad);
      // behind the planet?
      var up = t.c.clone().normalize(), horizon = Math.acos(clamp(RM / camLen, -1, 1)), ang = Math.acos(clamp(up.dot(camL) / camLen, -1, 1));
      if (ang - t.span * D2R * 0.8 > horizon + 0.02) return;
      // outside the view?
      _sph.center.copy(t.c).applyQuaternion(marsG.quaternion).add(marsG.getWorldPosition(_v)); _sph.radius = t.rad * 1.4;
      if (!frustum.intersectsSphere(_sph)) return;
      var texel = t.span * D2R * RM / 512, need = dist * pxK;
      var split = texel > need * 1.5 && z < MAXL[LAYER];
      if (split) {
        var kids = [[2 * y, 2 * x], [2 * y, 2 * x + 1], [2 * y + 1, 2 * x], [2 * y + 1, 2 * x + 1]], ready = true;
        kids.forEach(function (k) { var kt = getTile(z + 1, k[0], k[1]); if (kt.state !== 2 && kt.state !== 3) ready = false; });
        if (t.state === 2) draw.push(t); else if (t.state === 0) { t.pri = dist; load(t); }
        kids.forEach(function (k) { visit(z + 1, k[0], k[1]); });
        return;
      }
      if (t.state === 0) { t.pri = dist; load(t); }
      if (t.state === 2) draw.push(t);
    }
    for (var y = 0; y < 4; y++) for (var x = 0; x < 8; x++) visit(2, y, x);
    return draw;
  }

  /* ---------------------------------------------------------------- atmosphere, stars, sun */
  var atmo = new THREE.Mesh(new THREE.SphereGeometry(RM + 70, 96, 48), new THREE.ShaderMaterial({
    uniforms: {}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vN; varying vec3 vV; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix * viewMatrix * w;\n#include <logdepthbuf_vertex>\n}",
    fragmentShader: "#include <logdepthbuf_pars_fragment>\nvarying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); float g = pow(f, 4.0) * 1.1 + pow(f, 12.0) * 1.4; gl_FragColor = vec4(vec3(0.95, 0.62, 0.42) * g * 0.55, 1.0);\n#include <logdepthbuf_fragment>\n}"
  }));
  marsG.add(atmo);
  (function stars() {
    var n = 7000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), s = 1;
    function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    for (var i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      // more stars along a band, like the Milky Way
      if (rnd() < 0.35) { u = (rnd() - 0.5) * 0.35; r = Math.sqrt(1 - u * u); }
      var R = 1e9; pos[i * 3] = r * Math.cos(th) * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = r * Math.sin(th) * R;
      var b = Math.pow(rnd(), 3.2) * 0.95 + 0.08, t = rnd();
      col[i * 3] = b * (0.85 + 0.25 * t); col[i * 3 + 1] = b * 0.92; col[i * 3 + 2] = b * (1.1 - 0.3 * t);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false }));
    p.renderOrder = -5; p.frustumCulled = false; p.rotation.x = 0.9; scene.add(p);
    scene.userData.stars = p;
  })();
  function glowSprite(col, size) {
    var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, col); gr.addColorStop(0.4, "rgba(255,200,120,0.18)"); gr.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false }));
    sp.scale.set(size, size, 1); return sp;
  }
  var sun = glowSprite("rgba(255,236,190,0.95)", 0.09); world.add(sun);

  /* ---------------------------------------------------------------- space: planets, orbits, the transfer, moons, relays */
  var spaceG = new THREE.Group(); world.add(spaceG);
  var PLAN = {};
  function orbitLine(name, col, op) {
    var pts = []; for (var i = 0; i <= 360; i += 2) pts.push(helio(name, JD, i - 180));
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op || 0.5, depthWrite: false }));
    l.frustumCulled = false; spaceG.add(l); return l;
  }
  ["Mercury", "Venus", "Earth", "Mars", "Jupiter"].forEach(function (nm) {
    var col = { Mercury: 0x9aa3a6, Venus: 0xe6d3a3, Earth: 0x6fa8dc, Mars: 0xef8a68, Jupiter: 0xd8b48a }[nm];
    orbitLine(nm, col, nm === "Mars" || nm === "Earth" ? 0.7 : 0.35);
    var p = helio(nm, JD), dot = glowSprite(nm === "Earth" ? "rgba(140,190,255,.95)" : nm === "Mars" ? "rgba(255,150,110,.95)" : "rgba(230,220,200,.9)", nm === "Jupiter" ? 0.03 : 0.022);
    dot.position.copy(p); if (nm !== "Mars") spaceG.add(dot);
    PLAN[nm] = p;
  });
  // Earth to Mars: a Hohmann transfer from where Earth is now, drawn as half an ellipse
  (function () {
    var e0 = PLAN.Earth.clone(), r1 = e0.length(), r2 = 1.5237 * AU, a = (r1 + r2) / 2, e = (r2 - r1) / (r2 + r1), dir = e0.clone().normalize(), side = new THREE.Vector3(0, 1, 0).cross(dir).negate().normalize(), pts = [];
    for (var i = 0; i <= 180; i += 2) { var th = i * D2R, r = a * (1 - e * e) / (1 + e * Math.cos(th)); pts.push(dir.clone().multiplyScalar(r * Math.cos(th)).addScaledVector(side, r * Math.sin(th))); }
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffd27a, dashSize: 4e6, gapSize: 3e6, transparent: true, opacity: 0.8, depthWrite: false }));
    l.computeLineDistances(); l.frustumCulled = false; spaceG.add(l);
    PLAN.transferMid = pts[45];
  })();
  // moons and relays live in the Mars frame
  var moonG = new THREE.Group(); marsG.add(moonG);
  function lumpy(ax, ay, az, seed, craters) {
    var g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      var f = 1 + 0.06 * Math.sin(v.x * 7 + seed) * Math.cos(v.y * 5 - seed) + 0.04 * Math.sin(v.z * 11 + seed * 2);
      craters.forEach(function (c) { var d = v.distanceTo(c[0]); if (d < c[1] * 1.3) f -= c[2] * (d < c[1] ? 1 - (d / c[1]) * (d / c[1]) : -0.35 * (1.3 - d / c[1]) / 0.3); });
      p.setXYZ(i, v.x * ax * f, v.y * ay * f, v.z * az * f);
    }
    g.computeVertexNormals(); return g;
  }
  var mMoon = new THREE.MeshLambertMaterial({ color: 0x6d625a });
  var phobos = new THREE.Mesh(lumpy(13.0, 9.1, 11.4, 1.3, [[new THREE.Vector3(1, 0.1, 0.2).normalize(), 0.42, 0.18], [new THREE.Vector3(-0.3, 0.5, -0.8).normalize(), 0.2, 0.08]]), mMoon); moonG.add(phobos);
  var deimos = new THREE.Mesh(lumpy(7.5, 5.2, 6.1, 4.1, [[new THREE.Vector3(0.2, 0.9, 0.3).normalize(), 0.3, 0.06]]), mMoon); moonG.add(deimos);
  function ring(r, col, op, dash) {
    var pts = []; for (var i = 0; i <= 256; i++) { var a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, -Math.sin(a) * r)); }
    var mat = dash ? new THREE.LineDashedMaterial({ color: col, dashSize: r * 0.02, gapSize: r * 0.015, transparent: true, opacity: op, depthWrite: false }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false });
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); if (dash) l.computeLineDistances(); l.frustumCulled = false; moonG.add(l); return l;
  }
  var ringsG = new THREE.Group(); moonG.add(ringsG);
  [ring(9376, 0xcfd8dc, 0.45), ring(23463, 0xcfd8dc, 0.4), ring(20428, 0x7cc0de, 0.5, true)].forEach(function (l) { moonG.remove(l); ringsG.add(l); });
  var RELAY_LON = [202.1, 322.1, 82.1], relays = RELAY_LON.map(function (lo) { var s = glowSprite("rgba(160,215,240,.95)", 0.018); s.position.copy(nrm(0, lo).multiplyScalar(20428)); moonG.add(s); return s; });
  place({ id: "phobos", kind: "space", name: "Phobos", sub: "moon · 6,000 km up", size: 27, prio: 75, space: function () { return phobos.position; }, view: { d: 9000, tilt: 0 },
    k: "Mars' inner moon", d: "A dark, cratered moon 27 km long that circles Mars every 7 hours 39 minutes, only 6,000 km above the surface. Seen from Arcadia it crosses the sun as a black notch, as in the flight video. In this map the moons move 60 times faster than in real life." });
  place({ id: "deimos", kind: "space", name: "Deimos", sub: "moon · 20,000 km up", size: 15, prio: 70, space: function () { return deimos.position; }, view: { d: 30000, tilt: 0 },
    k: "Mars' outer moon", d: "A small moon 15 km across that goes round every 30 hours. From the surface it looks like a bright star." });
  place({ id: "relay", kind: "space", name: "Arcadia Relay", sub: "3 satellites · 17,000 km up", size: 1, prio: 65, space: function () { return relays[0].position; }, view: { d: 26000, tilt: 0 },
    k: "Communications", d: "Three relay satellites in areostationary orbit, 17,032 km up, stay fixed over their spots on Mars. Relay 1 hangs over Arcadia, which talks to it by radio; the relays send messages on to Earth by laser: 3 to 22 minutes each way." });
  place({ id: "earth", kind: "space", name: "Earth", sub: "", size: 1, prio: 80, world: function () { return PLAN.Earth; }, solar: true,
    k: "Home planet", d: "Earth and Mars come closest every 26 months. That is when ships leave: the trip takes about 6 to 9 months, depending on the path and the fuel." });
  place({ id: "sun", kind: "space", name: "Sun", sub: "", size: 1, prio: 85, world: function () { return new THREE.Vector3(); }, solar: true, k: "Star", d: "From Mars the sun looks about two thirds as wide as from Earth and gives 43% as much light." });
  place({ id: "jupiter", kind: "space", name: "Jupiter", sub: "", size: 1, prio: 40, world: function () { return PLAN.Jupiter; }, solar: true, k: "Planet", d: "The giant planet beyond the asteroid belt." });
  place({ id: "transfer", kind: "space", name: "Earth → Mars trip", sub: "Hohmann transfer", size: 1, prio: 50, world: function () { return PLAN.transferMid; }, solar: true, k: "The trip", d: "The cheapest path from Earth to Mars is half an ellipse that touches both orbits, about 8½ months. Faster ships burn more fuel and arrive in about 6 months." });
  place({ id: "marsdot", kind: "space", name: "Mars", sub: "", size: 1, prio: 90, world: function () { return MARS_W; }, solar: true, onlyFar: true, k: "Planet", d: "Mars, 1.52 times as far from the sun as Earth. A year on Mars lasts 687 Earth days." });

  /* ---------------------------------------------------------------- Jim's site in 3D (design frame, metres) */
  var siteG = new THREE.Group(); marsG.add(siteG);
  (function () {
    var m = new THREE.Matrix4().makeBasis(HB.e, HB.u, HB.n.clone().negate()); m.multiply(new THREE.Matrix4().makeScale(0.001, 0.001, 0.001)); m.setPosition(HOUSE_P);
    siteG.matrixAutoUpdate = false; siteG.matrix.copy(m);
  })();
  var mWhite = new THREE.MeshLambertMaterial({ color: 0xf2ede4 }), mTi = new THREE.MeshLambertMaterial({ color: 0xaaa49c }), mDark = new THREE.MeshLambertMaterial({ color: 0x3a3a3c });
  var mSteel = new THREE.MeshPhongMaterial({ color: 0xc8cacc, shininess: 60, specular: 0x666666 }), mOrb = new THREE.MeshPhongMaterial({ color: 0xb9c0c6, shininess: 120, specular: 0xffffff, emissive: 0x2a2f36 });
  var mPad = new THREE.MeshLambertMaterial({ color: 0xa89888 }), mGarden = new THREE.MeshLambertMaterial({ color: 0xc9b39a });
  var planG = new THREE.Group(); siteG.add(planG);
  function add(geo, mat, x, y, z, g) { var me = new THREE.Mesh(geo, mat); me.position.set(x || 0, y || 0, z || 0); (g || planG).add(me); return me; }
  // the Crown: ring with five spires (roof 50 + 40 c^6), the Orb, the garden
  (function () {
    function top(b) { var c = (1 + Math.cos(5 * (b - 18) * D2R)) / 2; return 50 + 40 * Math.pow(c, 6); }
    function P(r, b, y) { return [r * Math.sin(b * D2R), y, -r * Math.cos(b * D2R)]; }
    var pos = [], ri = 122, ro = 138, st = 1;
    function q(a, b, c, d) { pos.push.apply(pos, a.concat(b, c, a, c, d)); }
    for (var b = 0; b < 360; b += st) {
      var b1 = b + st, t0 = top(b), t1 = top(b1);
      q(P(ro, b1, 40), P(ro, b, 40), P(ro, b, t0), P(ro, b1, t1));
      q(P(ri, b, 40), P(ri, b1, 40), P(ri, b1, t1), P(ri, b, t0));
      q(P(ri, b, t0), P(ri, b1, t1), P(ro, b1, t1), P(ro, b, t0));
      q(P(ro, b, 40), P(ro, b1, 40), P(ri, b1, 40), P(ri, b, 40));
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    add(g, mWhite);
    add(new THREE.SphereGeometry(24, 48, 24), mOrb, 0, 72, 0);   // 48 m across, +48 to +96 m
    add(new THREE.CircleGeometry(10.2, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), 0, 1.6, 0);
    [18, 90, 162, 234, 306].forEach(function (pb) { var p = P(130, pb, 0); [8, 16, 24].forEach(function (rr, j) { var l = add(new THREE.RingGeometry(rr - 0.8, rr, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.7 - j * 0.18, depthWrite: false }), p[0], 1.8, p[2]); }); });
  })();
  // spaceport (plan coordinates: x east, y north of the terminal)
  (function () {
    var OX = 30000;
    function W(x, y) { return [OX + x, -y]; }
    add(new THREE.CylinderGeometry(90, 90, 6, 64), mWhite, OX, 3, 0);
    add(new THREE.SphereGeometry(90, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.31, 1), mWhite, OX, 6, 0);
    add(new THREE.CylinderGeometry(55, 55, 8, 48), mWhite, OX, 23, 0);
    add(new THREE.BoxGeometry(70, 16, 120), mWhite, OX - 385, 8, 0);
    [-80, -27, 27, 80].forEach(function (z) { add(new THREE.CylinderGeometry(13, 13.6, 0.8, 32), mPad, 29700, 0.4, z); });
    var tw = W(-150, 190); add(new THREE.CylinderGeometry(3.3, 4.2, 56, 16), mWhite, tw[0], 28, tw[1]); add(new THREE.CylinderGeometry(9.5, 8.6, 7, 24), mDark, tw[0], 59.5, tw[1]);
    [60, 90, 120].forEach(function (b, i) {
      var p = W(1600 * Math.sin(b * D2R), 1600 * Math.cos(b * D2R));
      add(new THREE.CylinderGeometry(40, 41, 1.4, 64), mPad, p[0], 0.7, p[1]);
      add(new THREE.TorusGeometry(130, 7, 6, 96).rotateX(Math.PI / 2).scale(1, 0.4, 1), new THREE.MeshLambertMaterial({ color: 0x8e6d57 }), p[0], 0, p[1]);
      if (i === 1) { add(new THREE.CylinderGeometry(4.5, 4.7, 38, 32), mSteel, p[0], 20, p[1]); add(new THREE.ConeGeometry(4.5, 14, 32), mSteel, p[0], 46, p[1]); }
    });
    var fp = W(455, 840); add(new THREE.BoxGeometry(230, 12, 120), mWhite, fp[0], 6, fp[1]);
    for (var t = 0; t < 6; t++) { var tp = W(640 + (t % 3) * 60, 840 - Math.floor(t / 3) * 60); add(new THREE.SphereGeometry(18, 24, 16), mWhite, tp[0], 20.5, tp[1]); }
    add(new THREE.BoxGeometry(320, 1, 200), new THREE.MeshLambertMaterial({ color: 0xb8c4cc }), 29700, -4, -1050);
    var rp = W(-560, -380); add(new THREE.SphereGeometry(26, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.22, 1), mWhite, rp[0], 0, rp[1]);
    add(new THREE.RingGeometry(148, 150, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.6 }), rp[0], 0.5, rp[1]);
    [196, 266, 336].forEach(function (z) { add(new THREE.BoxGeometry(150, 6, 40), new THREE.MeshLambertMaterial({ color: 0x9a7a5a }), OX + 545, 3, z + 22); });
  })();
  // the city, planned: plots on a sunflower spiral round the Crown, civic buildings on the Fibonacci seeds.
  // Drawn flat on the ground as plan marks, since none of it is built in phase 1.
  var CIVIC = { 21: "School", 34: "Hospital", 55: "Market hall", 89: "University", 144: "Concert hall", 233: "Stadium" };
  var cityG = new THREE.Group(); siteG.add(cityG);
  (function () {
    // each home's plot is about 120 m across: a small crown over a small pentagon
    var home = new THREE.RingGeometry(52, 60, 40).rotateX(-Math.PI / 2), dot = new THREE.CircleGeometry(52, 32).rotateX(-Math.PI / 2), civ = new THREE.PlaneGeometry(130, 130).rotateX(-Math.PI / 2);
    var mP2 = new THREE.MeshBasicMaterial({ color: 0xfff3e2, transparent: true, opacity: 0.8, depthWrite: false }), mP3 = new THREE.MeshBasicMaterial({ color: 0xf0e4d4, transparent: true, opacity: 0.45, depthWrite: false }), mCiv = new THREE.MeshBasicMaterial({ color: 0xf0c36a, transparent: true, opacity: 0.75, depthWrite: false });
    var mD2 = new THREE.MeshBasicMaterial({ color: 0xfff3e2, transparent: true, opacity: 0.25, depthWrite: false }), mD3 = new THREE.MeshBasicMaterial({ color: 0xf0e4d4, transparent: true, opacity: 0.12, depthWrite: false });
    for (var n = 1; n <= 233; n++) {
      var r = 250 * Math.sqrt(n + 2), b = n * 137.50776, x = r * Math.sin(b * D2R), z = -r * Math.cos(b * D2R);
      var me = new THREE.Mesh(CIVIC[n] ? civ : home, CIVIC[n] ? mCiv : n <= 13 ? mP2 : mP3); me.position.set(x, 3.2, z); me.renderOrder = 12; cityG.add(me);
      if (!CIVIC[n]) { var md = new THREE.Mesh(dot, n <= 13 ? mD2 : mD3); md.position.set(x, 3.2, z); md.renderOrder = 12; cityG.add(md); }
      if (CIVIC[n]) { var ll = siteLL(x, z); place({ id: "civic" + n, kind: "site", name: CIVIC[n], sub: "seed " + n, lat: ll.lat, lon: ll.lon, h: 14, size: 0.3, maxD: 14, prio: 55, k: "Arcadia City · civic building", d: "On Fibonacci seed " + n + " of the sunflower spiral. The Fibonacci seeds line up due north from the Crown, so the civic buildings form one avenue." }); }
    }
  })();
  // routes: the pod's flight at its real height, the rover road, the maglev tunnel (phase 2)
  var routeG = new THREE.Group(); siteG.add(routeG);
  var underG = new THREE.Group(); siteG.add(underG); underG.visible = false;
  function catm(pts, n) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; out.push(p1.map(function (_, c) { return 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3); })); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function pol(b, r, y) { return [r * Math.sin(b * D2R), y, -r * Math.cos(b * D2R)]; }
  var WP = [[29700, 1, -80], [29700, 14, -80], [29696, 48, -86], [29610, 110, -190], [29400, 220, -460], [29000, 340, -780], [28300, 410, -1180], [27200, 400, -1700], [25900, 250, -2250], [24500, 72, -2800],
    [23000, 58, -3230], [21450, 56, -3500], [19950, 58, -3450], [18450, 55, -3200], [17000, 62, -2860], [16050, 140, -2600], [15250, 240, -2450], [14100, 248, -2250], [12950, 240, -1880], [12150, 185, -1180], [11420, 75, -260],
    [10870, 5, 480], [10477, -52, 883], [9627, -55, 1483], [8815, -56, 2106], [8015, -52, 2756], [7520, 0, 3040], [7150, 110, 2950], [6100, 160, 2600], [5050, 160, 2250], [4000, 158, 1850], [3250, 145, 1600], [2250, 135, 1250], [1250, 125, 850],
    pol(160, 560, 118), pol(205, 480, 105), pol(250, 470, 90), pol(295, 470, 72), pol(340, 470, 58), pol(22, 420, 45), pol(62, 290, 34), pol(100, 150, 30), pol(128, 95, 30), pol(175, 52, 31), pol(235, 46, 32), pol(295, 46, 34), pol(345, 50, 38), [22, 40, -28], [70, 43, -3.7], [118, 44.3, -6.2], [126, 43.3, -6.6], [131, 42.4, -6.9]];
  function line(pts, col, op, g, dash, w) {
    var v = pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
    var mat = dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.7, transparent: true, opacity: op, depthWrite: false }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false });
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), mat); if (dash) l.computeLineDistances(); l.frustumCulled = false; l.renderOrder = 20; (g || routeG).add(l); return l;
  }
  var routePts = catm(WP, 8); line(routePts, 0xef8a68, 0.95);
  line(routePts.map(function (p) { return [p[0], 2, p[2]]; }), 0xef8a68, 0.25);
  line(catm([[29700, 2, 0], [24000, 2, 500], [18000, 2, 550], [12000, 2, 250], [6000, 2, 450], [200, 2, 0]], 16), 0xe6d8c4, 0.75, routeG, 120);
  line([[0, -68, 0], [30000, -68, 0]], 0x7cc0de, 0.9, underG, 200);
  // the Pentagon: five levels from 24 to 68 m down, and its atrium
  (function () {
    var Rp = 160 / (2 * Math.sin(36 * D2R)), Ra = 35 / (2 * Math.sin(36 * D2R)), C = [18, 90, 162, 234, 306];
    [-24, -41, -50, -59, -68].forEach(function (y) { line(C.concat([18]).map(function (b) { return pol(b, Rp, y); }), 0x7cc0de, 0.9, underG); line(C.concat([18]).map(function (b) { return pol(b, Ra, y); }), 0x7cc0de, 0.6, underG); });
    C.forEach(function (b) { line([pol(b, Rp, -24), pol(b, Rp, -68)], 0x7cc0de, 0.7, underG); });
    var sh = new THREE.Shape(); C.forEach(function (b, i) { var p = pol(b, Rp, 0); if (i) sh.lineTo(p[0], -p[2]); else sh.moveTo(p[0], -p[2]); });
    var slab = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 44, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0x7cc0de, transparent: true, opacity: 0.16, depthWrite: false, depthTest: false }));
    slab.rotation.x = -Math.PI / 2; slab.position.y = -68; slab.renderOrder = 30; underG.add(slab);
    line(C.concat([18]).map(function (b) { return pol(b, Rp, 1); }), 0x7cc0de, 0.55, planG, 6);
  })();

  /* ---------------------------------------------------------------- the local terrain as designed for the demo, draped over the corridor */
  var PX0 = -6000, PX1 = 34000, PZ0 = -6000, PZ1 = 6000, patchU = { value: 0 }, patchLift = { value: 0 };
  var sitePatch = (function () {
    var nx = 80, nz = 24, c = site((PX0 + PX1) / 2, 0, (PZ0 + PZ1) / 2), pos = [], dir = [], uv = [], idx = [];
    for (var j = 0; j <= nz; j++) for (var i = 0; i <= nx; i++) {
      var x = lerp(PX0, PX1, i / nx), z = lerp(PZ0, PZ1, j / nz), p = site(x, 0, z), d = p.clone().normalize();
      pos.push(p.x - c.x, p.y - c.y, p.z - c.z); dir.push(d.x, d.y, d.z); uv.push(i / nx, 1 - j / nz);
    }
    for (var j2 = 0; j2 < nz; j2++) for (var i2 = 0; i2 < nx; i2++) { var a = j2 * (nx + 1) + i2, b = a + 1, cc = a + nx + 1, d2 = cc + 1; idx.push(a, cc, d2, a, d2, b); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("dir", new THREE.Float32BufferAttribute(dir, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    var tex = new THREE.TextureLoader().load("site-terrain.jpg", function () { sitePatch.userData.ready = true; }); tex.anisotropy = 8; tex.minFilter = THREE.LinearMipmapLinearFilter;
    var m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uLight: LIGHT_U, uFade: patchU, uLift: patchLift }, transparent: true, depthWrite: false,
      vertexShader: TILE_V,
      fragmentShader: "#include <logdepthbuf_pars_fragment>\nuniform sampler2D map; uniform vec3 uLight; uniform float uFade; varying vec2 vUv; varying vec3 vN;\nvoid main(){ vec3 c = texture2D(map, vUv).rgb; float l = 0.85 + 0.2 * max(dot(normalize(vN), uLight), 0.0); vec2 e = min(vUv, 1.0 - vUv) * vec2(40.0, 12.0); float a = smoothstep(0.0, 1.0, min(e.x, e.y)) * uFade; gl_FragColor = vec4(c * l * 1.06, a);\n#include <logdepthbuf_fragment>\n}"
    }));
    m.position.copy(c); m.frustumCulled = false; m.renderOrder = 9; marsG.add(m); m.userData.ready = false;
    return m;
  })();

  /* ---------------------------------------------------------------- labels */
  var labelsEl = $("labels");
  P.forEach(function (p) {
    var el = document.createElement("div"); el.className = "lb " + p.kind + (p.big === 2 ? " big" : "");
    el.innerHTML = '<span class="dot"></span><span class="tx">' + p.name + (p.sub && p.kind !== "feature" ? "<small>" + p.sub + "</small>" : "") + "</span>";
    el.addEventListener("click", function (e) { e.stopPropagation(); select(p, true); });
    labelsEl.appendChild(el); p.el = el; p.w = p.name.length * 7.4 + 20; p.hgt = p.sub ? 30 : 18;
    if (p.lat !== undefined) { p.n = nrm(p.lat, p.lon); p.pos = p.sx !== undefined ? site(p.sx, p.h || 0, p.sz) : p.n.clone().multiplyScalar(RM); }
  });
  var OPT = { labels: true, plan: true, route: true, under: false, landers: true, grid: false, space: true };
  var _p = new THREE.Vector3(), _q = new THREE.Vector3();
  function placeLabels(camL, camW) {
    var W = canvas.clientWidth, H = canvas.clientHeight, alt = camL.length() - RM, boxes = [];
    var vis = [];
    P.forEach(function (p) {
      var show = OPT.labels, d, sx, sy;
      if (p.kind === "lander" && !OPT.landers) show = false;
      if ((p.kind === "site" || p.kind === "jim") && !OPT.plan && p.id !== "ttmath") show = false;
      if (p.kind === "space" && !OPT.space) show = false;
      if (show) {
        if (p.world) { _p.copy(p.world()).sub(camW); if (p.onlyFar && alt < 3e6) show = false; if (!p.onlyFar && alt < 2e6) show = false; }
        else if (p.space) { _p.copy(p.space()).applyMatrix4(moonG.matrixWorld); if (alt > 5e6 || alt < 3000) show = false; }
        else {
          // surface places: hide when over the horizon or out of their zoom range
          _q.copy(p.pos).sub(camL); d = _q.length();
          if (p.n.dot(camL) / camL.length() < RM / camL.length() - 0.002) show = false;
          var maxD = p.maxD || p.size * (p.kind === "feature" ? 9 : 30) + (p.kind === "jim" ? 30000 : 0), minD = p.kind === "feature" ? p.size * 0.35 : 0;
          if (p.kind === "jim") maxD = 40000;
          if (p.kind === "feature" && p.big === 2) maxD = 26000;
          if (alt > maxD || alt < minD || alt > 1.2e5) show = false;
          _p.copy(p.pos).applyMatrix4(marsG.matrixWorld);
        }
      }
      if (show) {
        _p.project(camera); if (_p.z > 1 || _p.z < -1) show = false;
        sx = (_p.x * 0.5 + 0.5) * W; sy = (-_p.y * 0.5 + 0.5) * H;
        if (sx < -50 || sx > W + 50 || sy < -30 || sy > H + 30) show = false;
      }
      p.onScreen = show; if (show) { p.sx = sx; p.sy = sy; vis.push(p); }
    });
    vis.sort(function (a, b) { return (b.id === selId) - (a.id === selId) || b.prio - a.prio; });
    var placed = [];
    vis.forEach(function (p) {
      var x0 = p.kind === "feature" ? p.sx - p.w / 2 : p.sx - 6, y0 = p.sy - (p.kind === "feature" ? 9 : 8), x1 = x0 + p.w, y1 = y0 + p.hgt;
      for (var i = 0; i < placed.length; i++) { var b = placed[i]; if (x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]) { p.onScreen = false; return; } }
      placed.push([x0 - 4, y0 - 2, x1 + 4, y1 + 2]);
    });
    P.forEach(function (p) {
      if (p.onScreen) { var ox = p.kind === "feature" ? -p.w / 2 + 10 : -6; p.el.style.transform = "translate(" + Math.round(p.sx + ox) + "px," + Math.round(p.sy - 8) + "px)"; p.el.style.display = ""; p.el.classList.toggle("sel", p.id === selId); }
      else p.el.style.display = "none";
    });
  }

  /* ---------------------------------------------------------------- latitude and longitude grid */
  var gridG = new THREE.Group(); marsG.add(gridG); gridG.visible = false;
  (function () {
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }), R = RM + 0.5;
    for (var la = -75; la <= 75; la += 15) { var pts = []; for (var lo = 0; lo <= 360; lo += 2) pts.push(nrm(la, lo).multiplyScalar(R)); var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); l.frustumCulled = false; gridG.add(l); }
    for (var lo2 = 0; lo2 < 360; lo2 += 15) { var pts2 = []; for (var la2 = -90; la2 <= 90; la2 += 2) pts2.push(nrm(la2, lo2).multiplyScalar(R)); var l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), mat); l2.frustumCulled = false; gridG.add(l2); }
  })();

  /* ---------------------------------------------------------------- the camera: Google Earth style */
  // globe view: a target on the surface (lat, lon), distance from it (km), heading and tilt.
  // At more than about 3 x 10^7 km it becomes a view of the solar system centred between Mars and the sun.
  var CAM = { lat: 32, lon: 202, dist: 15500, head: 0, tilt: 0 };
  function maxTilt(d) { return 74 * D2R * (1 - smooth(Math.log(40), Math.log(4500), Math.log(d))); }
  function camLocal(c) {
    var b = enu(c.lat, c.lon), T = b.u.clone().multiplyScalar(RM), H = b.n.clone().multiplyScalar(Math.cos(c.head)).addScaledVector(b.e, Math.sin(c.head));
    var ct = Math.cos(c.tilt), st = Math.sin(c.tilt);
    var off = b.u.clone().multiplyScalar(ct).addScaledVector(H, -st);
    return { pos: T.clone().addScaledVector(off, c.dist), target: T, up: b.u.clone().multiplyScalar(st).addScaledVector(H, ct) };
  }
  var camW = new THREE.Vector3(), camL = new THREE.Vector3(), SOLAR_K = 0;
  function applyCamera() {
    var L = camLocal(CAM);
    camL.copy(L.pos);
    // far out: slide the view towards the sun and lift it above the plane of the planets
    SOLAR_K = smooth(2.5e7, 6e8, CAM.dist);
    var mq = marsG.quaternion, posW = L.pos.clone().applyQuaternion(mq).add(MARS_W), tgtW = L.target.clone().applyQuaternion(mq).add(MARS_W), upW = L.up.clone().applyQuaternion(mq);
    if (SOLAR_K > 0) {
      var tgtS = MARS_W.clone().multiplyScalar(1 - SOLAR_K * 0.85);
      var dirS = new THREE.Vector3(Math.sin(CAM.head) * 0.45, 0.89, Math.cos(CAM.head) * 0.45).normalize();
      var dirG = posW.clone().sub(tgtW).normalize();
      var dir = dirG.lerp(dirS, smooth(0, 0.6, SOLAR_K)).normalize();
      tgtW.lerp(tgtS, SOLAR_K); posW.copy(tgtW).addScaledVector(dir, CAM.dist + RM);
      upW.lerp(new THREE.Vector3(-Math.sin(CAM.head), 0, -Math.cos(CAM.head)), smooth(0, 0.6, SOLAR_K)).normalize();
      camL.copy(posW).sub(MARS_W).applyQuaternion(mq.clone().invert());
    }
    camW.copy(posW);
    world.position.copy(camW).negate();
    camera.position.set(0, 0, 0); camera.up.copy(upW); camera.lookAt(tgtW.sub(camW));
    camera.updateMatrixWorld(); world.updateMatrixWorld(true);
    return L;
  }
  function surfaceAt(cx, cy) {
    // the point on Mars under a screen position, in the Mars frame
    var W = canvas.clientWidth, H = canvas.clientHeight, v = new THREE.Vector3((cx / W) * 2 - 1, -(cy / H) * 2 + 1, 0.5).unproject(camera).normalize();
    var mqi = marsG.quaternion.clone().invert(), d = v.applyQuaternion(mqi), o = camL;
    var b = o.dot(d), c = o.lengthSq() - RM * RM, disc = b * b - c;
    if (disc < 0) return null;
    var t = -b - Math.sqrt(disc); if (t < 0) return null;
    return o.clone().addScaledVector(d, t);
  }

  /* ---------------------------------------------------------------- flying between views */
  var FLY = null;
  function flyTo(dest, secs) {
    var a = { lat: CAM.lat, lon: CAM.lon, dist: CAM.dist, head: CAM.head, tilt: CAM.tilt }, b = Object.assign({}, a, dest);
    var na = nrm(a.lat, a.lon), nb = nrm(b.lat, b.lon), ang = Math.acos(clamp(na.dot(nb), -1, 1));
    var peak = Math.max(a.dist, b.dist, ang * RM * 1.25);
    var la = Math.log(a.dist), lb = Math.log(b.dist), lp = Math.log(peak);
    var dur = secs || clamp(1.4 + 0.28 * Math.abs(lp - Math.min(la, lb)) + 0.12 * Math.abs(la - lb), 1.4, 5.5);
    var dh = ((b.head - a.head) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    FLY = { a: a, b: b, na: na, nb: nb, ang: ang, la: la, lb: lb, lm: 2 * lp - (la + lb) / 2, t0: performance.now(), dur: dur * 1000, dh: dh, bump: lp > Math.max(la, lb) + 0.05 };
  }
  function flyStep(now) {
    if (!FLY) return;
    var s = clamp((now - FLY.t0) / FLY.dur, 0, 1), e = s * s * (3 - 2 * s), f = FLY;
    var m = f.bump ? smooth(0.12, 0.88, s) : e;
    var n = f.ang > 1e-6 ? f.na.clone().multiplyScalar(Math.sin((1 - m) * f.ang)).addScaledVector(f.nb, Math.sin(m * f.ang)).divideScalar(Math.sin(f.ang)) : f.nb.clone();
    var ll = toLL(n); CAM.lat = ll.lat; CAM.lon = ll.lon;
    var ld = f.bump ? (1 - e) * (1 - e) * f.la + 2 * e * (1 - e) * f.lm + e * e * f.lb : lerp(f.la, f.lb, e);
    CAM.dist = Math.exp(ld); CAM.head = f.a.head + f.dh * e; CAM.tilt = lerp(f.a.tilt, f.b.tilt, e);
    if (s >= 1) { FLY = null; saveHash(); }
  }

  /* ---------------------------------------------------------------- input: drag, turn, tilt, zoom, pinch */
  var ptr = {}, gesture = null, lastMove = 0, helpEl = $("help");
  function mpp() { return CAM.dist * 2 * Math.tan(camera.fov * D2R / 2) / canvas.clientHeight; }
  function pan(dx, dy) {
    if (SOLAR_K > 0.5) { CAM.head -= dx * 0.005; return; }
    var b = enu(CAM.lat, CAM.lon), ch = Math.cos(CAM.head), sh = Math.sin(CAM.head);
    var right = b.e.clone().multiplyScalar(ch).addScaledVector(b.n, -sh), fwd = b.n.clone().multiplyScalar(ch).addScaledVector(b.e, sh);
    // near the ground, move by the ground distance under the pointer; far out, turn the globe so it follows the pointer
    var near = mpp() / RM, rho = Math.atan(RM / (RM + CAM.dist)) / (camera.fov * D2R / 2) * canvas.clientHeight / 2, far = Math.min(1 / Math.max(rho, 1), 0.012);
    var ang = lerp(near, far, smooth(RM, 2.5 * RM, CAM.dist)), tl = Math.max(0.35, Math.cos(CAM.tilt));
    var n = b.u.clone().addScaledVector(right, -dx * ang).addScaledVector(fwd, dy * ang / tl).normalize();
    var ll = toLL(n); CAM.lat = clamp(ll.lat, -89.5, 89.5); CAM.lon = ll.lon;
  }
  function zoomBy(f, cx, cy) {
    var d0 = CAM.dist, d1 = clamp(d0 * f, 0.08, 9e8);
    if (cx !== undefined && d1 < d0 && d0 < 3 * RM) {
      var p = surfaceAt(cx, cy);
      if (p) { var n0 = nrm(CAM.lat, CAM.lon), n1 = p.normalize(), k = 1 - d1 / d0, n = n0.lerp(n1, k).normalize(), ll = toLL(n); CAM.lat = ll.lat; CAM.lon = ll.lon; }
    }
    CAM.dist = d1; CAM.tilt = Math.min(CAM.tilt, maxTilt(CAM.dist));
  }
  function turn(dx, dy) { CAM.head -= dx * 0.006; CAM.tilt = clamp(CAM.tilt + dy * 0.006, 0, maxTilt(CAM.dist)); }
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId); ptr[e.pointerId] = { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey || e.ctrlKey || e.metaKey };
    FLY = null; canvas.classList.add("drag"); lastMove = performance.now(); helpEl.style.opacity = 0;
    var ids = Object.keys(ptr); if (ids.length === 2) { var a = ptr[ids[0]], b = ptr[ids[1]]; gesture = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2, mx: (a.x + b.x) / 2 }; }
  });
  canvas.addEventListener("pointermove", function (e) {
    var p = ptr[e.pointerId];
    if (!p) { hover(e.clientX, e.clientY); return; }
    var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    var ids = Object.keys(ptr);
    if (ids.length === 2 && gesture) {
      var a = ptr[ids[0]], b = ptr[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), my = (a.y + b.y) / 2, mx = (a.x + b.x) / 2;
      if (gesture.d > 10 && d > 10) zoomBy(gesture.d / d, mx, my);
      var da = ang - gesture.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      CAM.head -= da; CAM.tilt = clamp(CAM.tilt + (my - gesture.my) * 0.005, 0, maxTilt(CAM.dist));
      gesture.d = d; gesture.ang = ang; gesture.my = my; gesture.mx = mx;
    } else if (p.b === 2 || p.sh) turn(dx, dy);
    else if (p.b === 0) pan(dx, dy);
    lastMove = performance.now();
  });
  function up(e) { delete ptr[e.pointerId]; if (Object.keys(ptr).length < 2) gesture = null; if (!Object.keys(ptr).length) canvas.classList.remove("drag"); saveHashSoon(); }
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", function (e) { e.preventDefault(); FLY = null; var dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; zoomBy(Math.exp(clamp(dy, -300, 300) * 0.0016), e.clientX, e.clientY); helpEl.style.opacity = 0; saveHashSoon(); }, { passive: false });
  canvas.addEventListener("dblclick", function (e) { var p = surfaceAt(e.clientX, e.clientY); if (!p) return; var ll = toLL(p); flyTo({ lat: ll.lat, lon: ll.lon, dist: CAM.dist * 0.4, tilt: Math.min(CAM.tilt, maxTilt(CAM.dist * 0.4)) }, 0.9); });
  window.addEventListener("keydown", function (e) {
    if (e.target === $("q")) return;
    var k = e.key, s = 60;
    if (k === "ArrowLeft") pan(s, 0); else if (k === "ArrowRight") pan(-s, 0); else if (k === "ArrowUp") pan(0, s); else if (k === "ArrowDown") pan(0, -s);
    else if (k === "+" || k === "=") zoomBy(0.7); else if (k === "-" || k === "_") zoomBy(1.4);
    else if (k === "q" || k === "Q") CAM.head += 0.1; else if (k === "e" || k === "E") CAM.head -= 0.1;
    else if (k === "PageUp") turn(0, -20); else if (k === "PageDown") turn(0, 20);
    else if (k === "n" || k === "N") flyTo({ head: 0, tilt: 0 }, 0.8);
    else if (k === "h" || k === "H") jump("house");
    else if (k === "Escape") closeCard();
    else return;
    e.preventDefault(); FLY = k === "n" || k === "N" || k === "h" || k === "H" ? FLY : null; saveHashSoon();
  });
  var whereEl = $("where");
  function hover(x, y) { var p = surfaceAt(x, y); whereEl.textContent = p ? llText(toLL(p)) : "—"; }
  function llText(ll) { var la = ll.lat, lo = ll.lon; return Math.abs(la).toFixed(la > -10 && la < 10 ? 3 : 2) + "° " + (la >= 0 ? "N" : "S") + "  " + lo.toFixed(2) + "° E"; }

  /* ---------------------------------------------------------------- the panel: search, places, card, layers, buttons */
  var listEl = $("list"), qEl = $("q"), selId = null;
  var GROUPS = [["Jim's Mars", ["house", "port", "city", "ttmath", "ap9"]], ["At the site", ["crown", "orb", "garden", "pentagon", "terminal", "pad2", "fuel", "mine", "reactor", "dunes", "crater", "cliffs", "storm"]], ["Space", ["phobos", "deimos", "relay", "earth", "transfer", "sun"]], ["Landmarks", F.map(function (f) { return f[0]; })], ["Rovers and landers", L.map(function (l) { return l[0]; })]];
  var BYID = {}; P.forEach(function (p) { BYID[p.id] = p; });
  function renderList(q) {
    q = (q || "").trim().toLowerCase(); listEl.innerHTML = "";
    GROUPS.forEach(function (g) {
      var items = g[1].map(function (id) { return BYID[id]; }).filter(function (p) { return p && (!q || (p.name + " " + (p.sub || "") + " " + (p.d || "")).toLowerCase().indexOf(q) >= 0); });
      if (!items.length) return;
      var h = document.createElement("h2"); h.textContent = g[0]; listEl.appendChild(h);
      items.forEach(function (p) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "listitem");
        var sub = p.lat !== undefined ? Math.abs(p.lat).toFixed(1) + "°" + (p.lat >= 0 ? "N" : "S") + " " + p.lon.toFixed(1) + "°E" : p.sub;
        b.innerHTML = '<i class="' + p.kind + '"></i><b>' + p.name + "</b><small>" + (sub || "") + "</small>";
        b.addEventListener("click", function () { select(p, true); if (window.innerWidth < 720) collapse(true); });
        if (p.id === selId) b.classList.add("on");
        listEl.appendChild(b);
      });
    });
  }
  qEl.addEventListener("input", function () { renderList(qEl.value); });
  qEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { var b = listEl.querySelector("button"); if (b) b.click(); } });
  function collapse(c) { $("top").classList.toggle("collapsed", c); $("list").hidden = c; $("toggleList").textContent = c ? "Show places" : "Hide places"; $("toggleList").setAttribute("aria-expanded", c ? "false" : "true"); }
  $("toggleList").addEventListener("click", function () { collapse(!$("list").hidden); });
  function viewFor(p) {
    if (p.view && p.view.d) return { lat: p.lat !== undefined ? p.lat : CAM.lat, lon: p.lon !== undefined ? p.lon : CAM.lon, dist: p.view.d, tilt: (p.view.tilt || 0) * D2R, head: (p.view.head || 0) * D2R };
    var d = p.kind === "feature" ? Math.max(p.size * 2.4, 250) : p.kind === "lander" ? 400 : p.kind === "site" ? Math.max(1.5, (p.maxD || 4) * 0.5) : 20;
    return { lat: p.lat, lon: p.lon, dist: d, tilt: Math.min(p.kind === "site" ? 50 : p.kind === "feature" && p.size < 800 ? 35 : 0, maxTilt(d) * R2D) * D2R, head: CAM.head };
  }
  function select(p, fly) {
    selId = p.id; renderList(qEl.value);
    $("cardK").textContent = p.k || ""; $("cardT").textContent = p.name; $("cardD").textContent = p.d || "";
    $("cardC").textContent = p.lat !== undefined ? llText(p) : "";
    var row = $("cardR"); row.innerHTML = "";
    if (p.link) { var a = document.createElement("a"); a.href = p.link[1]; a.textContent = p.link[0] + " →"; row.appendChild(a); }
    var b = document.createElement("button"); b.type = "button"; b.textContent = "Fly there"; b.addEventListener("click", function () { go(p); }); row.appendChild(b);
    $("card").hidden = false; document.body.classList.add("cardOpen"); helpEl.style.opacity = 0;
    if (window.innerHeight < 900) collapse(true);
    if (fly) go(p);
  }
  function go(p) {
    if (p.solar) { flyTo({ lat: 25, lon: CAM.lon, dist: 7.5e8, tilt: 0, head: 0.4 }, 4.5); return; }
    if (p.space) { flyTo({ lat: 18, lon: 202, dist: p.view.d, tilt: 0, head: 0 }); return; }
    flyTo(viewFor(p));
  }
  function closeCard() { $("card").hidden = true; selId = null; document.body.classList.remove("cardOpen"); renderList(qEl.value); }
  $("cardX").addEventListener("click", closeCard);
  var JUMPS = {
    house: function () { select(BYID.house, true); },
    arcadia: function () { flyTo({ lat: 41.5, lon: 199, dist: 2600, tilt: 28 * D2R, head: 0 }); },
    mars: function () { flyTo({ lat: 30, lon: 202, dist: 15500, tilt: 0, head: 0 }); },
    moons: function () { flyTo({ lat: 22, lon: 202, dist: 70000, tilt: 0, head: 0 }); },
    solar: function () { flyTo({ lat: 25, lon: 202, dist: 7.5e8, tilt: 0, head: 0.4 }, 4.5); }
  };
  function jump(k) { if (JUMPS[k]) JUMPS[k](); }
  document.querySelectorAll("[data-jump]").forEach(function (b) { b.addEventListener("click", function () { jump(b.dataset.jump); }); });
  $("zin").addEventListener("click", function () { flyTo({ dist: CAM.dist * 0.5, tilt: Math.min(CAM.tilt, maxTilt(CAM.dist * 0.5)) }, 0.5); });
  $("zout").addEventListener("click", function () { flyTo({ dist: CAM.dist * 2 }, 0.5); });
  $("compass").addEventListener("click", function () { flyTo({ head: 0, tilt: 0 }, 0.8); });
  $("tiltBtn").addEventListener("click", function () { var mt = maxTilt(CAM.dist); flyTo({ tilt: CAM.tilt > 0.1 ? 0 : Math.min(55 * D2R, mt) }, 0.8); });
  $("layersBtn").addEventListener("click", function () { var h = !$("layers").hidden; $("layers").hidden = h; $("layersBtn").setAttribute("aria-expanded", h ? "false" : "true"); });
  document.querySelectorAll("[data-base]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-base]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      setLayer(b.dataset.base);
    });
  });
  function setLayer(l) { if (l === LAYER) return; dropTiles(true); LAYER = l; base.forEach(function (m) { m.material.uniforms.map.value = FALL[l]; }); saveHashSoon(); }
  [["oLabels", "labels"], ["oPlan", "plan"], ["oRoute", "route"], ["oUnder", "under"], ["oLanders", "landers"], ["oGrid", "grid"], ["oSpace", "space"]].forEach(function (o) {
    $(o[0]).addEventListener("change", function () { OPT[o[1]] = $(o[0]).checked; });
  });
  var toastT = 0;
  function toast(msg, ms) { var t = $("toast"); if (!msg) { t.hidden = true; return; } t.textContent = msg; t.hidden = false; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(function () { t.style.opacity = 0; setTimeout(function () { t.hidden = true; }, 700); }, ms || 4000); }

  /* ---------------------------------------------------------------- the view in the address, so a link opens the same place */
  var hashT = 0;
  function saveHashSoon() { clearTimeout(hashT); hashT = setTimeout(saveHash, 700); }
  function saveHash() {
    var h = "#@" + CAM.lat.toFixed(4) + "," + CAM.lon.toFixed(4) + "," + (CAM.dist < 100 ? CAM.dist.toFixed(3) : Math.round(CAM.dist)) + "km," + Math.round(CAM.head * R2D) + "h," + Math.round(CAM.tilt * R2D) + "t" + (LAYER !== "MDIM" ? ",terrain" : "");
    try { history.replaceState(null, "", h); } catch (e) { }
  }
  function readHash() {
    var m = /#@(-?[\d.]+),(-?[\d.]+),([\d.e+]+)km,(-?\d+)h,(\d+)t(,terrain)?/.exec(location.hash);
    if (m) { CAM.lat = +m[1]; CAM.lon = +m[2]; CAM.dist = +m[3]; CAM.head = +m[4] * D2R; CAM.tilt = +m[5] * D2R; if (m[6]) { document.querySelector('[data-base="MColorDEM"]').click(); } return true; }
    var pm = /place=(\w+)/.exec(location.hash); if (pm && BYID[pm[1]]) { setTimeout(function () { select(BYID[pm[1]], true); }, 600); return true; }
    return false;
  }

  /* ---------------------------------------------------------------- each frame */
  var scaleT = $("scaleT"), scaleB = $("scaleB"), eyeEl = $("eye"), compassSvg = $("compass").querySelector("svg"), sel = 0;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();
  var lastSel = 0, drawn = [];
  function frame(now) {
    frameNo++;
    flyStep(now);
    var L = applyCamera();
    frustum.setFromProjectionMatrix(projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    var alt = camL.length() - RM;
    // key light from over the viewer's shoulder, the same for the whole map (no night side)
    LIGHT_V.set(-0.45, 0.7, 0.55).applyQuaternion(camera.quaternion).normalize();
    LIGHT_U.value.copy(LIGHT_V); key.position.copy(LIGHT_V).multiplyScalar(10); key.target.position.set(0, 0, 0);
    // tiles
    if (now - lastSel > 90 || FLY) {
      lastSel = now;
      drawn.forEach(function (t) { if (t.mesh) t.mesh.visible = false; });
      var pxK = 2 * Math.tan(camera.fov * D2R / 2) / (canvas.clientHeight * renderer.getPixelRatio());
      drawn = alt < 3e5 ? selectTiles(camL, pxK) : [];
      // the finest tiles sit on the true surface; coarser ones and the simplified map are pushed just below them
      var lift = Math.max(0.004, alt * 2.5e-5);
      drawn.forEach(function (t) { t.mesh.visible = true; t.mesh.material.uniforms.uLift.value = (t.z - 7) * lift; });
      base.forEach(function (m) { m.material.uniforms.uLift.value = -6.5 * lift - 0.02; });
      patchLift.value = 0.35 * lift;
      pump();
      if (frameNo % 120 === 0) dropTiles(false);
    }
    // what shows at which scale
    var siteOn = alt < 90;
    patchU.value = sitePatch.userData.ready && LAYER === "MDIM" ? 1 - smooth(160, 420, alt) : 0; sitePatch.visible = patchU.value > 0.001;
    siteG.visible = siteOn; planG.visible = siteOn && OPT.plan; cityG.visible = siteOn && OPT.plan; routeG.visible = siteOn && OPT.route; underG.visible = siteOn && OPT.under;
    gridG.visible = OPT.grid && alt > 200;
    atmo.visible = alt > 25;
    moonG.visible = OPT.space; ringsG.visible = alt > 2500;
    spaceG.visible = OPT.space && alt > 5e5;
    sun.visible = true; sun.position.set(0, 0, 0);
    // the moons move 60 times faster than in life
    var tt = (Date.now() / 1000) * 60, ph = tt / (7.6539 * 3600) * Math.PI * 2, dm = tt / (30.312 * 3600) * Math.PI * 2;
    phobos.position.set(Math.cos(ph) * 9376, 0, -Math.sin(ph) * 9376); phobos.rotation.y = ph + Math.PI / 2;
    deimos.position.set(Math.cos(dm) * 23463, 0, -Math.sin(dm) * 23463); deimos.rotation.y = dm + Math.PI / 2;
    // the sky turns dusty when you come down into the air
    var air = 1 - smooth(8, 70, alt);
    renderer.setClearColor(new THREE.Color(0.02 + 0.30 * air, 0.02 + 0.20 * air, 0.03 + 0.15 * air), 1);
    scene.userData.stars.material.opacity = 1 - air; scene.userData.stars.material.transparent = true;
    world.updateMatrixWorld(true);
    renderer.render(scene, camera);
    placeLabels(camL, camW);
    // readouts
    var m = mpp(), target = 110, raw = m * target, pw = Math.pow(10, Math.floor(Math.log10(raw))), nice = raw / pw >= 5 ? 5 * pw : raw / pw >= 2 ? 2 * pw : pw;
    scaleB.style.width = Math.round(nice / m) + "px"; scaleT.textContent = nice >= 1 ? fmt(nice) + " km" : fmt(nice * 1000) + " m";
    if (CAM.dist > 2e6) { scaleT.textContent = nice >= 1e6 ? fmt(nice / 1e6, 1) + " million km" : fmt(nice) + " km"; }
    var au = camW.length() / AU;
    eyeEl.textContent = SOLAR_K > 0.3 ? "Eye " + au.toFixed(2) + " AU from the sun" : alt > 1e5 ? "Eye " + fmt(alt / 1000) + " thousand km up" : alt > 20 ? "Eye " + fmt(alt) + " km up" : "Eye " + fmt(alt * 1000) + " m up";
    compassSvg.style.transform = "rotate(" + (-CAM.head * R2D) + "deg)";
    $("tiltBtn").textContent = CAM.tilt > 0.1 ? "2D" : "3D";
    if (window.__atlasDebug) window.__atlasState = { alt: alt, tiles: drawn.length, ok: tileOK, fail: tileFails, loading: loading, cache: tiles.size };
    requestAnimationFrame(frame);
  }
  renderList("");
  readHash();
  if (window.innerWidth < 720) collapse(true);
  requestAnimationFrame(frame);
  setTimeout(function () { helpEl.style.opacity = 0; }, 9000);
  if (window.__atlasDebug) window.__atlas = { CAM: CAM, flyTo: flyTo, jump: jump, select: function (id) { select(BYID[id], true); }, setLayer: function (l) { document.querySelector('[data-base="' + l + '"]').click(); }, OPT: OPT, P: P, BYID: BYID, site: site, HOUSE_LL: HOUSE_LL };
})();
