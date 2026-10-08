  /* ===================== The labs: Newton, the physics lab, furnished for its use ===================== */
  // Jim, 7 Oct 2026: "need more details ... furnitures are not designed well to make the campus relaxing and comfortable".
  // The program is campus_furnishing.py (T06-29). Six island benches with black resin tops, a spine of sockets and gas
  // taps and a sink each; padded lab stools with a low back; the demonstration bench under the board with Newton's cradle,
  // a bell jar on its plate and an air track; apparatus in glass-fronted oak cabinets on the back wall, a Van de Graaff
  // generator, a side counter of meters and supplies under a board of patch leads; and at the back a Foucault pendulum that
  // swings, once every 6.8 s in Mars's gravity, over a black disc ringed with pegs it has been knocking down.
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }
  // glass, in the Ring's glass mesh: a pane in a piece's frame M at z, and a surface of revolution about its y axis
  // (prof: [radius, y]); their normals face away from whoever looks at them, so they mirror the room, not the day outside
  function glassPane(M, x0, y0, x1, y1, z, nz) {
    var n = V3(0, 0, nz).applyMatrix3(new THREE.Matrix3().getNormalMatrix(M)).normalize(), v = V3(0, 0, 0);
    CRS_GLASS.surf(1, 1, function (i, j, q) { v.set(i ? x1 : x0, j ? y1 : y0, z).applyMatrix4(M); q.p[0] = v.x; q.p[1] = v.y; q.p[2] = v.z; q.nn = [n.x, n.y, n.z]; q.f2[0] = 1; q.f2[1] = 1; q.m = 0; });
  }
  function glassLathe(M, prof, n) {
    var nm = new THREE.Matrix3().getNormalMatrix(M), v = V3(0, 0, 0), nv = V3(0, 0, 0);
    CRS_GLASS.surf(n, prof.length - 1, function (i, j, q) {
      var t = i / n * 2 * Math.PI, p = prof[j], p0 = prof[Math.max(0, j - 1)], p1 = prof[Math.min(prof.length - 1, j + 1)], dr = p1[0] - p0[0], dy = p1[1] - p0[1];
      v.set(p[0] * Math.cos(t), p[1], p[0] * Math.sin(t)).applyMatrix4(M); nv.set(-dy * Math.cos(t), dr, -dy * Math.sin(t)).applyMatrix3(nm).normalize();
      q.p[0] = v.x; q.p[1] = v.y; q.p[2] = v.z; q.nn = [nv.x, nv.y, nv.z]; q.f2[0] = 1; q.f2[1] = 1; q.m = 0;
    }, true);
  }
  // an island bench 2.4 along x, 1.2 deep: oak cupboards both sides on a dark plinth, a black resin top, a grey spine of
  // sockets and gas taps (yellow handles) along its middle, a sink and a swan-neck tap at +x
  function labBench() { return furn("labbench", function (b) {
    var n0 = b.count(), k; b.box(-1.15, 0.1, -0.55, 1.15, 0.87, 0.55, MT.WOOD); kindTag(b, n0, 1);
    b.box(-1.1, 0, -0.5, 1.1, 0.1, 0.5, MT.RUBBER);
    var nt = b.count(); b.box(-1.2, 0.87, -0.6, 1.2, 0.9, 0.6, MT.PLASTIC); b.tag(nt, 1, null);
    var nd = b.count(); [-1, 1].forEach(function (s) { for (k = 0; k <= 4; k++) { var x = -1.15 + 0.575 * k; b.box(x - 0.003, 0.1, s * 0.551 - 0.003, x + 0.003, 0.87, s * 0.551 + 0.003, MT.PLASTIC); } b.box(-1.15, 0.79, s * 0.551 - 0.003, 1.15, 0.796, s * 0.551 + 0.003, MT.PLASTIC); }); b.tag(nd, 1, null);   // door seams, the drawer line
    [-1, 1].forEach(function (s) { for (k = 0; k < 4; k++) { var x = -1.15 + 0.575 * (k + 0.5); b.box(x - 0.07, 0.72, s * 0.556 - 0.006, x + 0.07, 0.732, s * 0.556 + 0.006, MT.STEEL); } });
    var ns = b.count(); b.box(-1.05, 0.9, -0.075, 0.62, 1.12, 0.075, MT.PLASTIC); b.tag(ns, 5, null);
    var no = b.count(); [-0.8, -0.3, 0.2].forEach(function (x) { [-1, 1].forEach(function (s) { b.box(x - 0.045, 0.96, s * 0.075 - 0.004, x + 0.045, 1.05, s * 0.075 + 0.004, MT.PLASTIC); }); }); b.tag(no, 0, null);   // sockets
    [-0.55, -0.05, 0.45].forEach(function (x) { [-1, 1].forEach(function (s) { b.geo(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 8), T(x, 1.0, s * 0.105, Math.PI / 2, 0, 0), MT.BRASS);
      var nh = b.count(); b.box(x - 0.008, 1.0, s * 0.11 - 0.006, x + 0.008, 1.06, s * 0.11 + 0.006, MT.PLASTIC); b.tag(nh, 4, null); }); });                     // gas taps
    b.box(0.72, 0.9, -0.22, 1.12, 0.903, 0.22, MT.STEEL); b.box(0.76, 0.902, -0.18, 1.08, 0.905, 0.18, MT.ANOD);                                             // the sink
    tubeAlong(b, [V3(0.66, 0.9, 0), V3(0.66, 1.26, 0), V3(0.8, 1.33, 0), V3(0.9, 1.21, 0)], 0.011, 6, MT.STEEL);
  }); }
  // a lab stool facing +x: a padded seat 0.66 high and a low padded back on a gas column, a foot ring, five feet
  function labStool() { return furn("lstool", function (b) {
    for (var k = 0; k < 5; k++) { var t = k / 5 * 2 * Math.PI; tubeAlong(b, [V3(0, 0.08, 0), V3(Math.cos(t) * 0.29, 0.035, Math.sin(t) * 0.29)], 0.015, 5, MT.ANOD); b.geo(new THREE.SphereGeometry(0.024, 8, 6), T(Math.cos(t) * 0.29, 0.024, Math.sin(t) * 0.29), MT.RUBBER); }
    tubeAlong(b, [V3(0, 0.06, 0), V3(0, 0.59, 0)], 0.024, 10, MT.STEEL);
    b.geo(new THREE.TorusGeometry(0.21, 0.009, 6, 30), T(0, 0.34, 0, Math.PI / 2, 0, 0), MT.STEEL);
    [0, 2.1, 4.2].forEach(function (t) { tubeAlong(b, [V3(0, 0.34, 0), V3(Math.cos(t) * 0.21, 0.34, Math.sin(t) * 0.21)], 0.006, 4, MT.STEEL); });
    latheOn(b, 0, 0.58, 0, [[0.0, 0.0], [0.17, 0.0], [0.195, 0.015], [0.2, 0.045], [0.185, 0.075], [0.1, 0.085], [0.0, 0.085]], 26, MT.FABRIC, 0);
    [-0.12, 0.12].forEach(function (z) { tubeAlong(b, [V3(-0.12, 0.6, z), V3(-0.2, 0.86, z)], 0.008, 5, MT.STEEL); });
    var t2 = new Builder(); softBox(t2, -0.03, -0.065, -0.17, 0.03, 0.065, 0.17, 0.025, MT.FABRIC, 0, { px: 0.008 }, 0); b.add(t2, T(-0.215, 0.88, 0, 0, 0, 0.12));
  }); }
  // the demonstration bench, len along x, 0.8 deep: oak drawers toward the teacher (-z), a plain oak front toward the
  // class (+z), a black resin top, a spine of sockets and gas, a sink at +x
  function demoBench(len) { return furn("demo" + len, function (b) {
    var h = len / 2, n0 = b.count(), k; b.box(-h + 0.05, 0.1, -0.37, h - 0.05, 0.87, 0.37, MT.WOOD); kindTag(b, n0, 1); b.box(-h + 0.1, 0, -0.32, h - 0.1, 0.1, 0.32, MT.RUBBER);
    var nt = b.count(); b.box(-h, 0.87, -0.4, h, 0.9, 0.4, MT.PLASTIC); b.tag(nt, 1, null);
    var nd = b.count(); for (k = 0; k <= 6; k++) { var x = -h + 0.05 + (len - 0.1) * k / 6; b.box(x - 0.003, 0.1, -0.374, x + 0.003, 0.87, -0.368, MT.PLASTIC); }
    [0.36, 0.6].forEach(function (y) { b.box(-h + 0.05, y - 0.003, -0.374, h - 0.05, y + 0.003, -0.368, MT.PLASTIC); }); b.tag(nd, 1, null);
    for (k = 0; k < 6; k++) { var xc = -h + 0.05 + (len - 0.1) * (k + 0.5) / 6; [0.48, 0.74].forEach(function (y) { b.box(xc - 0.08, y - 0.006, -0.382, xc + 0.08, y + 0.006, -0.37, MT.STEEL); }); }
    var ns = b.count(); b.box(-h + 0.2, 0.9, -0.4, h - 0.6, 1.1, -0.25, MT.PLASTIC); b.tag(ns, 5, null);
    var no = b.count(); for (k = 0; k < 4; k++) b.box(-h + 0.5 + k * 0.7, 0.95, -0.254, -h + 0.59 + k * 0.7, 1.04, -0.246, MT.PLASTIC); b.tag(no, 0, null);
    b.box(h - 0.5, 0.9, -0.2, h - 0.08, 0.903, 0.2, MT.STEEL); b.box(h - 0.46, 0.902, -0.16, h - 0.12, 0.905, 0.16, MT.ANOD);
    tubeAlong(b, [V3(h - 0.55, 0.9, -0.3), V3(h - 0.55, 1.25, -0.3), V3(h - 0.4, 1.32, -0.3), V3(h - 0.3, 1.2, -0.25)], 0.011, 6, MT.STEEL);
  }); }
  // five steel balls hung in a row from a steel frame on a black base, 0.24 long (x)
  function newtonsCradle() { return furn("cradle", function (b) {
    var nb = b.count(); b.box(-0.12, 0, -0.07, 0.12, 0.016, 0.07, MT.PLASTIC); b.tag(nb, 1, null);
    [[-0.1, -0.055], [0.1, -0.055], [-0.1, 0.055], [0.1, 0.055]].forEach(function (c) { tubeAlong(b, [V3(c[0], 0.016, c[1]), V3(c[0], 0.2, c[1])], 0.0028, 5, MT.STEEL); });
    [-0.055, 0.055].forEach(function (z) { tubeAlong(b, [V3(-0.1, 0.2, z), V3(0.1, 0.2, z)], 0.0028, 5, MT.STEEL); });
    for (var k = 0; k < 5; k++) { var x = (k - 2) * 0.025; b.geo(new THREE.SphereGeometry(0.0124, 14, 10), T(x, 0.07, 0), MT.STEEL); [-0.055, 0.055].forEach(function (z) { tubeAlong(b, [V3(x, 0.082, 0), V3(x, 0.2, z)], 0.0007, 3, MT.STEEL); }); }
  }); }
  // the bell jar's steel plate and gasket, a small bell on a stand under it, the hose to the pump; the jar is glass (JAR)
  var JAR = [[0.13, 0.0], [0.13, 0.19], [0.124, 0.24], [0.105, 0.278], [0.075, 0.302], [0.04, 0.316], [0.0, 0.32]];
  function bellJarBase() { return furn("belljar", function (b) {
    b.geo(new THREE.CylinderGeometry(0.17, 0.18, 0.026, 32), T(0, 0.013, 0), MT.STEEL); b.geo(new THREE.TorusGeometry(0.133, 0.006, 6, 32), T(0, 0.028, 0, Math.PI / 2, 0, 0), MT.RUBBER);
    tubeAlong(b, [V3(0, 0.026, 0), V3(0, 0.17, 0)], 0.004, 5, MT.STEEL); latheOn(b, 0, 0.105, 0, [[0.0, 0.065], [0.016, 0.065], [0.03, 0.045], [0.042, 0.0], [0.0, 0.0]], 18, MT.BRASS, 0);
    tubeAlong(b, [V3(0.0, 0.013, -0.175), V3(0.0, 0.013, -0.33), V3(0.02, -0.05, -0.42), V3(0.0, -0.4, -0.5)], 0.008, 6, MT.RUBBER);
  }); }
  // an air track 1.6 long (x): an aluminium beam of diamond section on two feet, two gliders with their flags, the hose
  function airTrack() { return furn("airtrack", function (b) {
    b.geo(new THREE.BoxGeometry(1.6, 0.06, 0.06), T(0, 0.1, 0, Math.PI / 4, 0, 0), MT.STEEL);
    [-0.68, 0.68].forEach(function (x) { b.box(x - 0.03, 0, -0.07, x + 0.03, 0.07, 0.07, MT.ANOD); });
    [[-0.32, 3], [0.22, 1]].forEach(function (g2) { var ng = b.count(); b.geo(new THREE.BoxGeometry(0.16, 0.05, 0.05), T(g2[0], 0.128, 0, Math.PI / 4, 0, 0), MT.PLASTIC); b.tag(ng, g2[1], null);
      var nf = b.count(); b.box(g2[0] - 0.035, 0.155, -0.002, g2[0] + 0.035, 0.2, 0.002, MT.PLASTIC); b.tag(nf, 1, null); });
    tubeAlong(b, [V3(0.8, 0.1, 0), V3(0.9, 0.08, 0.05), V3(0.95, -0.2, 0.15)], 0.016, 6, MT.RUBBER);
  }); }
  // a cabinet of apparatus 1.0 wide (x), 0.45 deep with its back at +z, 2.2 tall: oak, cupboard doors below, glazed above
  // (the glass apart, cabinetGlass), the apparatus on its shelves varied by k
  function apparatusCabinet(k) { return furn("appcab" + k, function (b) {
    var n0 = b.count(), R = mulberry(500 + k), i;
    b.box(-0.5, 0, 0.2, 0.5, 2.2, 0.225, MT.WOOD); b.box(-0.5, 0, -0.225, -0.48, 2.2, 0.225, MT.WOOD); b.box(0.48, 0, -0.225, 0.5, 2.2, 0.225, MT.WOOD); b.box(-0.5, 2.17, -0.225, 0.5, 2.2, 0.225, MT.WOOD);
    b.box(-0.48, 0.1, -0.225, -0.005, 0.92, -0.2, MT.WOOD); b.box(0.005, 0.1, -0.225, 0.48, 0.92, -0.2, MT.WOOD);
    [0.92, 1.33, 1.75].forEach(function (y) { b.box(-0.48, y, -0.2, 0.48, y + 0.022, 0.2, MT.WOOD); });
    [[-0.48, -0.445], [-0.018, 0.018], [0.445, 0.48]].forEach(function (c) { b.box(c[0], 0.94, -0.228, c[1], 2.17, -0.205, MT.WOOD); }); b.box(-0.48, 2.12, -0.228, 0.48, 2.17, -0.205, MT.WOOD);
    kindTag(b, n0, 1); b.box(-0.48, 0, -0.2, 0.48, 0.1, 0.2, MT.RUBBER);
    [-0.06, 0.06].forEach(function (x) { b.box(x - 0.006, 0.72, -0.235, x + 0.006, 0.86, -0.225, MT.STEEL); });
    [0.942, 1.352, 1.772].forEach(function (y) {                       // apparatus: meters, coils, boxes, brass masses, lenses
      for (var x = -0.42; x < 0.36;) {
        var kind = Math.floor(R() * 5), w;
        if (kind === 0) { w = 0.16; var nm = b.count(); b.box(x, y, -0.12, x + w, y + 0.13, 0.06, MT.PLASTIC); b.tag(nm, 5, null); var nf = b.count(); b.box(x + 0.03, y + 0.045, -0.123, x + w - 0.03, y + 0.115, -0.12, MT.PLASTIC); b.tag(nf, 0, null); }
        else if (kind === 1) { w = 0.13; b.geo(new THREE.TorusGeometry(0.045, 0.02, 8, 18), T(x + w / 2, y + 0.065, -0.02), MT.BRASS); }
        else if (kind === 2) { w = 0.2; var nw = b.count(); b.box(x, y, -0.14, x + w, y + 0.09 + R() * 0.12, 0.1, MT.WOOD); b.tag(nw, null, R() < 0.5 ? 1 : 2); }
        else if (kind === 3) { w = 0.12; for (i = 0; i < 4; i++) b.geo(new THREE.CylinderGeometry(0.022 - i * 0.003, 0.022 - i * 0.003, 0.03, 12), T(x + w / 2, y + 0.015 + i * 0.03, -0.03), MT.BRASS); }
        else { w = 0.1; b.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 18), T(x + w / 2, y + 0.06, -0.03, Math.PI / 2, 0, 0), MT.CERAMIC); tubeAlong(b, [V3(x + w / 2, y, -0.03), V3(x + w / 2, y + 0.02, -0.03)], 0.006, 5, MT.ANOD); }
        x += w + 0.03 + R() * 0.04;
      }
    });
  }); }
  function cabinetGlass(M) { [[-0.445, -0.018], [0.018, 0.445]].forEach(function (c) { glassPane(M, c[0], 0.94, c[1], 2.12, -0.216, 1); }); }
  // a Van de Graaff generator: a polished dome 0.4 across on a white column, its motor in a black base; the discharge sphere
  function vanDeGraaff() { return furn("vdg", function (b) {
    var nb = b.count(); b.box(-0.2, 0, -0.15, 0.2, 0.12, 0.15, MT.PLASTIC); b.box(0.34, 0, -0.07, 0.5, 0.06, 0.07, MT.PLASTIC); b.tag(nb, 1, null);
    var nc = b.count(); b.geo(new THREE.CylinderGeometry(0.05, 0.055, 0.75, 20, 1, true), T(0, 0.495, 0), MT.PLASTIC); b.tag(nc, 0, null);
    b.geo(new THREE.SphereGeometry(0.2, 32, 20), T(0, 1.06, 0), MT.STEEL); b.geo(new THREE.SphereGeometry(0.06, 16, 10), T(0.42, 0.86, 0), MT.STEEL); leg(b, 0.42, 0.06, 0, 0.42, 0.8, 0, 0.008, MT.STEEL);
  }); }
  // a side counter len along x, 0.66 deep, its back at +z: oak drawers, a black resin top; meters and supplies on it
  function sideCounter(len) { return furn("sidectr" + len.toFixed(2), function (b) {
    var h = len / 2, n0 = b.count(), k, R = mulberry(77); b.box(-h, 0.1, -0.3, h, 0.87, 0.33, MT.WOOD); kindTag(b, n0, 1); b.box(-h + 0.05, 0, -0.25, h - 0.05, 0.1, 0.33, MT.RUBBER);
    var nt = b.count(); b.box(-h - 0.02, 0.87, -0.34, h + 0.02, 0.9, 0.34, MT.PLASTIC); b.tag(nt, 1, null);
    var nd = b.count(), nc = Math.round(len / 0.6); for (k = 0; k <= nc; k++) { var x = -h + len * k / nc; b.box(x - 0.003, 0.1, -0.304, x + 0.003, 0.87, -0.298, MT.PLASTIC); }
    [0.36, 0.62].forEach(function (y) { b.box(-h, y - 0.003, -0.304, h, y + 0.003, -0.298, MT.PLASTIC); }); b.tag(nd, 1, null);
    for (k = 0; k < nc; k++) { var xc = -h + len * (k + 0.5) / nc; [0.49, 0.75].forEach(function (y) { b.box(xc - 0.07, y - 0.006, -0.312, xc + 0.07, y + 0.006, -0.3, MT.STEEL); }); }
    for (var x0 = -h + 0.15; x0 < h - 0.5; x0 += 0.55 + R() * 0.25) {   // power supplies (two terminals, a dial) and meters
      var nps = b.count(), w = 0.26 + R() * 0.08; b.box(x0, 0.9, -0.12, x0 + w, 1.02 + R() * 0.04, 0.16, MT.PLASTIC); b.tag(nps, R() < 0.6 ? 5 : 0, null);
      var nk = b.count(); b.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 10), T(x0 + 0.06, 0.95, -0.125, Math.PI / 2, 0, 0), MT.PLASTIC); b.tag(nk, 2, null);
      var nk2 = b.count(); b.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 10), T(x0 + 0.1, 0.95, -0.125, Math.PI / 2, 0, 0), MT.PLASTIC); b.tag(nk2, 1, null);
      b.geo(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14), T(x0 + w - 0.06, 0.97, -0.125, Math.PI / 2, 0, 0), MT.ANOD);
    }
  }); }
  // a board of patch leads over the side counter: an oak panel len along x on the wall (its back at +z), hooks, red and
  // black leads coiled on them and a few hanging straight
  function leadBoard(len) { return furn("leads" + len.toFixed(2), function (b) {
    var h = len / 2, n0 = b.count(), R = mulberry(31); b.box(-h, 1.2, -0.02, h, 2.0, 0.0, MT.WOOD); kindTag(b, n0, 1);
    for (var x = -h + 0.18; x < h - 0.1; x += 0.24) {
      b.box(x - 0.006, 1.8, -0.09, x + 0.006, 1.812, -0.02, MT.STEEL);
      for (var j = 0; j < 3; j++) { var nl = b.count(); b.geo(new THREE.TorusGeometry(0.07 - j * 0.008, 0.004, 5, 24), T(x + (R() - 0.5) * 0.02, 1.73 - j * 0.01, -0.06 - j * 0.008), MT.PLASTIC); b.tag(nl, R() < 0.5 ? 2 : 1, null); }
      if (R() < 0.4) { var ns = b.count(); tubeAlong(b, [V3(x, 1.8, -0.05), V3(x + 0.02, 1.4, -0.04), V3(x + 0.03, 1.25, -0.035)], 0.004, 4, MT.PLASTIC); b.tag(ns, R() < 0.5 ? 2 : 1, null); }
    }
  }); }
  // the Foucault pendulum: the floor's black disc, its brass ring and hour marks and 24 pegs here, those the swing has
  // passed lying knocked down; the wire and the bob a mesh of their own (FOUC), built once the lights exist and swung by
  // pendulumUpdate: period 2 pi sqrt(L / g) with g = 3.72 m/s2
  var FOUC = null, FOUC_T = null, FOUC_M = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  function foucault(B, r, a, y, ceil) {
    var M = crsFrame(r, a, y), fl = new Builder(), k, phi = 0.5;
    var nd = fl.count(); fl.geo(new THREE.CylinderGeometry(1.0, 1.0, 0.02, 56), T(0, 0.01, 0), MT.MARBLE); fl.tag(nd, null, 3);
    fl.geo(new THREE.TorusGeometry(0.93, 0.012, 6, 72), T(0, 0.021, 0, Math.PI / 2, 0, 0), MT.BRASS);
    for (k = 0; k < 24; k++) { var t = k / 24 * 2 * Math.PI; fl.geo(new THREE.BoxGeometry(k % 6 ? 0.07 : 0.13, 0.004, 0.007), T(Math.cos(t) * (k % 6 ? 0.85 : 0.82), 0.022, Math.sin(t) * (k % 6 ? 0.85 : 0.82), 0, -t, 0), MT.BRASS); }
    for (k = 0; k < 24; k++) {
      var t2 = k / 24 * 2 * Math.PI + Math.PI / 24, del = (((t2 - phi) % Math.PI) + Math.PI) % Math.PI, np = fl.count();
      if (del > 0.12 && del < 1.0) fl.geo(new THREE.CylinderGeometry(0.012, 0.014, 0.085, 10), T(Math.cos(t2) * 0.7, 0.034, Math.sin(t2) * 0.7, 0, -t2, Math.PI / 2), MT.PLASTIC);
      else fl.geo(new THREE.CylinderGeometry(0.012, 0.014, 0.085, 10), T(Math.cos(t2) * 0.66, 0.0625, Math.sin(t2) * 0.66), MT.PLASTIC);
      fl.tag(np, 0, null);
    }
    B.add(fl, M);
    var P = V3(0, ceil - y, 0).applyMatrix4(M), L = ceil - y - 0.33, pb = new Builder(); pb.zone = ZONE.WING;
    var nb = pb.count(); latheOn(pb, 0, 0.0, 0, [[0.0, 0.0], [0.006, 0.03], [0.05, 0.1], [0.12, 0.2], [0.135, 0.25], [0.12, 0.3], [0.06, 0.34], [0.02, 0.355], [0.0, 0.36]], 28, MT.BRASS, 0);
    tubeAlong(pb, [V3(0, 0.355, 0), V3(0, L + 0.33, 0)], 0.0022, 4, MT.STEEL);
    var g = new Builder(); g.zone = ZONE.WING; g.add(pb, M); var ax = V3(Math.sin(phi), 0, -Math.cos(phi)).transformDirection(M);   // the swing along (cos phi, sin phi), so its axis across it
    FOUC = { b: g, P: P, ax: ax, T: 2 * Math.PI * Math.sqrt((L + 0.15) / GRAV), amp: 0.62 / (L + 0.15), mesh: null };
  }
  function pendulumBuild() { if (!FOUC || FOUC.mesh) return; FOUC.mesh = bakedMesh(FOUC.b, matMat, null, null, { noOcclude: true }); BAKE.meshes.pop(); scene.add(FOUC.mesh); }
  function pendulumUpdate() {
    if (!FOUC || !FOUC.mesh) return;
    var t = FOUC_T !== null ? FOUC_T : performance.now() / 1000, th = FOUC.amp * Math.cos(2 * Math.PI * t / FOUC.T), P = FOUC.P, m = FOUC.mesh.matrix;
    m.makeTranslation(P.x, P.y, P.z).multiply(FOUC_M[0].makeRotationAxis(FOUC.ax, th)).multiply(FOUC_M[1].makeTranslation(-P.x, -P.y, -P.z)); FOUC.mesh.matrixWorldNeedsUpdate = true;
  }
  function physicsLab(B, rm, F) {
    var C = CRS, y = F.y, sg = F.sgn, back = sg > 0 ? ROT.plusA : ROT.minusA, top = 0.9;
    boardOn(B, F, 4.2, ATL.wb, MT.ATLAS, [0, 2]);
    // the demonstration bench across the front, the teacher's chair behind it; on it Newton's cradle, the bell jar, the air track
    var da = F.at(1.75, true), Md = crsFrame(55.8, da, y, sg > 0 ? -Math.PI / 2 : Math.PI / 2); B.add(demoBench(3.6), Md); contactShadow(demoBench(3.6), Md);
    crsObst(53.9, 57.7, F.at(1.3, true), F.at(2.2, true), F.floor);
    B.add(newtonsCradle(), Md.clone().multiply(T(-1.45, top, 0.08, 0, 0.25, 0)));
    var Mj = Md.clone().multiply(T(-0.85, top, 0.05)); B.add(bellJarBase(), Mj); glassLathe(Mj.clone().multiply(T(0, 0.028, 0)), JAR, 30);
    B.add(airTrack(), Md.clone().multiply(T(0.42, top, 0.1)));
    var vp = new Builder(), nv = vp.count(); vp.box(-0.16, 0, -0.12, 0.16, 0.22, 0.12, MT.PLASTIC); vp.tag(nv, 5, null); vp.geo(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16), T(0.0, 0.29, 0, 0, 0, Math.PI / 2), MT.PLASTIC);
    B.add(vp, Md.clone().multiply(T(-0.85, 0, -0.62)));                                                                       // the vacuum pump on the floor behind the bench
    crsPlace(B, officeChair(), 55.3, F.at(0.95, true), y, sg > 0 ? Math.PI : 0);
    // six island benches, a lab stool on each side of each end
    [4.8, 8.0, 11.2].forEach(function (d) { var a = F.at(d, true); [53.2, 58.4].forEach(function (r) {
      crsPlace(B, labBench(), r, a, y, sg > 0 ? 0 : Math.PI); crsObst(r - 0.62, r + 0.62, a - 1.22 / r, a + 1.22 / r, F.floor);
      [-0.6, 0.6].forEach(function (x) { [[r - 0.93, -Math.PI / 2], [r + 0.93, Math.PI / 2]].forEach(function (s, si) { crsPlace(B, labStool(), s[0], a + x / s[0], y, s[1] + (x > 0 ? 0.1 : -0.12) * (si ? -1 : 1)); }); });
    }); });
    // the corridor wall between the doors: a side counter of supplies and meters, the patch leads over it, a screen logging an experiment
    var c0 = 4.2, c1 = 10.2, cm = F.at((c0 + c1) / 2, true), rr = C.rc + 0.405, cl = (c1 - c0) * rr / 55.8;
    crsPlace(B, sideCounter(cl), rr, cm, y, ROT.out); crsObst(C.rc + 0.05, C.rc + 0.78, F.at(c0, true), F.at(c1, true), F.floor);
    B.add(leadBoard(cl * 0.55), crsFrame(C.rc + 0.075, F.at(c0 + (c1 - c0) * 0.3, true), y, ROT.out));
    var sa = F.at(c0 + (c1 - c0) * 0.78, true), ms = new Builder(); ms.box(-0.3, 0.0, -0.02, 0.3, 0.36, 0.02, MT.PLASTIC); ms.box(-0.03, -0.3, 0.02, 0.03, 0.0, 0.05, MT.PLASTIC); ms.box(-0.12, -0.31, -0.06, 0.12, -0.3, 0.1, MT.PLASTIC); ms.tag(0, 1, null);
    B.add(ms, crsFrame(rr + 0.05, sa, y + 1.22, ROT.out)); wpic(B, crsFrame(rr + 0.05, sa, y + 1.4), [0, 0, 0.022], "x", [0, 1], 0.56, 0.315, ATL.scrLab, MT.SCREEN, [1.0, 0]);
    // the back wall: apparatus in four glass-fronted cabinets, the Van de Graaff generator; the pendulum before them
    [50.6, 51.65, 52.7, 53.75].forEach(function (r, k) { var M = crsFrame(r, F.at(0.31, false), y, back), fb = apparatusCabinet(k); B.add(fb, M); contactShadow(fb, M); cabinetGlass(M); });
    crsObst(50.05, 54.3, F.back, F.at(0.6, false), F.floor);
    crsPlace(B, vanDeGraaff(), 59.6, F.at(0.95, false), y, back); crsObst(59.3, 60.2, F.at(0.6, false), F.at(1.3, false), F.floor);
    var pa = F.at(3.3, false); foucault(B, 55.8, pa, y, ceilY(rm, F.floor, 55.8)); crsObst(54.8, 56.8, pa - 1.0 / 55.8, pa + 1.0 / 55.8, F.floor);
    roomPlants(B, rm, F, null);
  }
  /* ---- the maker space (T06-30): the tool wall, workbenches, the printers, the laser cutter, the robot arena ---- */
  // a picture drawn on its own canvas and laid on quads that keep a fixed brightness (as the paintings): quads [{M, x0, x1,
  // y0, y1, z, u0, u1, v0, v1, b}] in their frames M (x across, y up, facing +z at z)
  function texQuads(cv, quads) {
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var pos = [], uvs = [], idx = [], brt = [], v = V3(0, 0, 0);
    quads.forEach(function (q) { var n = pos.length / 3, u0 = q.u0, u1 = q.u1;
      if (q.M.determinant() < 0) { u0 = q.u1; u1 = q.u0; }                 // the Ring's frames are mirror-handed: keep the picture the right way round
      [[q.x0, q.y0, u0, q.v0], [q.x1, q.y0, u1, q.v0], [q.x1, q.y1, u1, q.v1], [q.x0, q.y1, u0, q.v1]].forEach(function (c) { v.set(c[0], c[1], q.z).applyMatrix4(q.M); pos.push(v.x, v.y, v.z); uvs.push(c[2], c[3]); brt.push(q.b); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute("aBright", new THREE.Float32BufferAttribute(brt, 1)); geo.setIndex(idx);
    var vs = "attribute float aBright; varying vec2 vUv; varying float vB; void main(){ vUv = uv; vB = aBright; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    var fs = "uniform sampler2D map; uniform float uExposure; varying vec2 vUv; varying float vB;\n" +
      "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * vB + vec3(0.002); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
    var m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide })); m.matrixAutoUpdate = false; scene.add(m);
  }
  // the maker space's canvas: on top the tool wall (2048 x 600: pegboard with every tool on its painted outline), below it
  // the robot arena's mat (1024 x 1024: Mars ground with craters and rocks, a start box and a track)
  var MAKER = { W: 2048, H: 1624, wallH: 600 };
  function makerCanvas() {
    var s = MOBILE ? 0.5 : 1, cv = mkCanvas(Math.round(MAKER.W * s), Math.round(MAKER.H * s)), g = cv.getContext("2d"), R = mulberry(4242), i, j;
    g.scale(s, s);
    // pegboard: tempered hardboard, a hole every inch
    g.fillStyle = "#8f6d4a"; g.fillRect(0, 0, MAKER.W, MAKER.wallH);
    for (i = 0; i < 2000; i++) { g.fillStyle = "rgba(60,40,20," + (0.03 + R() * 0.05) + ")"; g.fillRect(R() * MAKER.W, R() * MAKER.wallH, 2 + R() * 40, 1 + R() * 3); }
    g.fillStyle = "rgba(25,16,8,0.85)"; for (i = 6; i < MAKER.W; i += 8.5) for (j = 6; j < MAKER.wallH; j += 8.5) g.fillRect(i, j, 2.2, 2.2);
    function outline(draw) { g.save(); g.translate(3, 3); g.fillStyle = "rgba(240,236,226,0.9)"; draw(true); g.restore(); draw(false); }
    function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function hook(x, y) { g.fillStyle = "#9a9a98"; g.fillRect(x - 3, y - 6, 6, 10); }
    function hammer(x, y, k) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : (k ? "#2b2b2b" : "#9b6a3c"); rr(x - 7, y, 14, 150, 5); g.fill(); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#6f7275"; rr(x - 34, y - 14, 68, 22, 4); g.fill(); }); hook(x - 12, y + 12); hook(x + 12, y + 12); }
    function screwdriver(x, y, c) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : c; rr(x - 9, y, 18, 62, 7); g.fill(); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#b9bcbf"; g.fillRect(x - 2.5, y + 62, 5, 70); }); hook(x, y - 4); }
    function wrench(x, y, L) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#a9adb1"; rr(x - 5, y + 12, 10, L, 4); g.fill(); g.beginPath(); g.arc(x, y + 8, 12, 0, 2 * Math.PI); g.fill(); g.beginPath(); g.arc(x, y + L + 16, 10, 0, 2 * Math.PI); g.fill(); });
      g.fillStyle = "#8f6d4a"; g.fillRect(x - 4, y - 6, 8, 10); hook(x, y + L + 16); }
    function pliers(x, y, c) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#7d8085"; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + 8, y + 40); g.lineTo(x - 8, y + 40); g.fill();
      g.fillStyle = sh ? "rgba(240,236,226,0.9)" : c; g.save(); g.translate(x, y + 40); g.rotate(0.12); rr(-14, 0, 9, 80, 4); g.fill(); g.restore(); g.save(); g.translate(x, y + 40); g.rotate(-0.12); rr(5, 0, 9, 80, 4); g.fill(); g.restore(); }); hook(x, y - 4); }
    function saw(x, y) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#c3c6c9"; g.beginPath(); g.moveTo(x, y + 50); g.lineTo(x + 330, y + 30); g.lineTo(x + 330, y + 60); g.lineTo(x, y + 95); g.fill();
      g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#8a5a33"; rr(x - 90, y + 30, 100, 80, 18); g.fill(); }); g.fillStyle = "#8f6d4a"; rr(x - 70, y + 50, 52, 40, 12); g.fill(); hook(x - 40, y + 26); hook(x + 200, y + 34); }
    function clamp(x, y) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#9da1a5"; g.fillRect(x - 4, y, 8, 190); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#c0392b"; g.fillRect(x - 4, y, 46, 16); g.fillRect(x - 4, y + 120, 46, 16); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#2c2c2c"; rr(x + 36, y + 136, 14, 46, 5); g.fill(); }); hook(x, y - 4); }
    function level(x, y) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#d6a91c"; g.fillRect(x, y, 420, 30); }); g.fillStyle = "#cfe8c8"; g.fillRect(x + 196, y + 8, 28, 14); g.fillStyle = "#2b2b2b"; g.fillRect(x + 8, y + 8, 20, 14); g.fillRect(x + 392, y + 8, 20, 14); hook(x + 60, y + 34); hook(x + 360, y + 34); }
    function tape(x, y) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#e0b21f"; rr(x - 32, y, 64, 62, 10); g.fill(); }); g.fillStyle = "#2b2b2b"; g.beginPath(); g.arc(x, y + 31, 16, 0, 2 * Math.PI); g.fill(); hook(x, y - 4); }
    function drill(x, y) { outline(function (sh) { g.fillStyle = sh ? g.fillStyle : "#1f7a74"; rr(x - 70, y, 120, 46, 14); g.fill(); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#222"; rr(x - 30, y + 40, 34, 70, 8); g.fill(); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#2b2b2b"; rr(x - 44, y + 106, 62, 34, 6); g.fill(); g.fillStyle = sh ? "rgba(240,236,226,0.9)" : "#888"; g.fillRect(x + 50, y + 14, 34, 18); });
      g.fillStyle = "#666"; g.fillRect(x - 60, y + 46, 100, 10); }
    function glasses(x, y) { g.strokeStyle = "rgba(230,232,236,0.9)"; g.lineWidth = 4; g.strokeRect(x - 46, y, 40, 26); g.strokeRect(x + 6, y, 40, 26); g.beginPath(); g.moveTo(x - 6, y + 8); g.lineTo(x + 6, y + 8); g.stroke(); hook(x, y - 4); }
    function ears(x, y) { g.strokeStyle = "#2b2b2b"; g.lineWidth = 7; g.beginPath(); g.arc(x, y + 40, 38, Math.PI, 0); g.stroke(); g.fillStyle = "#b03a2e"; rr(x - 50, y + 36, 24, 44, 9); g.fill(); rr(x + 26, y + 36, 24, 44, 9); g.fill(); hook(x, y - 2); }
    // the wall's layout, left to right in five bays
    hammer(70, 120, 0); hammer(150, 130, 1); hammer(225, 145, 0);
    ["#c0392b", "#c0392b", "#2b2b2b", "#d4a017", "#d4a017", "#2b2b2b", "#c0392b"].forEach(function (c, k) { screwdriver(320 + k * 36, 70, c); });
    ["#c0392b", "#2b6fb3", "#c0392b"].forEach(function (c, k) { pliers(330 + k * 70, 300, c); });
    for (i = 0; i < 9; i++) wrench(600 + i * 34, 60, 120 + i * 14);
    saw(1000, 70); level(950, 260); [1010, 1100, 1190].forEach(function (x) { tape(x, 380); });
    [1430, 1500, 1570, 1640].forEach(function (x) { clamp(x, 60); }); drill(1530, 330);
    glasses(1800, 80); glasses(1800, 150); ears(1880, 260); ears(1790, 260);
    g.fillStyle = "rgba(0,0,0,0.35)"; for (i = 1; i < 5; i++) g.fillRect(i * MAKER.W / 5 - 2, 0, 4, MAKER.wallH);   // the board's sheets meet
    // the arena's mat: dusty Mars ground, craters, scattered rocks, a white start box and a dashed track
    var y0 = MAKER.wallH, S = 1024;
    g.fillStyle = "#a35d36"; g.fillRect(0, y0, S, S);
    for (i = 0; i < 2600; i++) { var c0 = 120 + R() * 70; g.fillStyle = "rgba(" + Math.round(c0 + 40) + "," + Math.round(c0 * 0.55) + "," + Math.round(c0 * 0.35) + "," + (0.08 + R() * 0.12) + ")"; g.beginPath(); g.arc(R() * S, y0 + R() * S, 2 + R() * 26, 0, 2 * Math.PI); g.fill(); }
    for (i = 0; i < 9; i++) { var cx = 80 + R() * (S - 160), cy = y0 + 80 + R() * (S - 160), cr = 20 + R() * 70;
      var gr = g.createRadialGradient(cx - cr * 0.2, cy - cr * 0.2, cr * 0.2, cx, cy, cr); gr.addColorStop(0, "rgba(70,32,16,0.55)"); gr.addColorStop(0.8, "rgba(120,62,34,0.25)"); gr.addColorStop(1, "rgba(220,150,100,0.35)");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, cr, 0, 2 * Math.PI); g.fill(); }
    for (i = 0; i < 140; i++) { g.fillStyle = "rgba(" + (50 + R() * 40) + ",30,20,0.8)"; g.beginPath(); g.ellipse(R() * S, y0 + R() * S, 2 + R() * 7, 2 + R() * 5, R() * 3, 0, 2 * Math.PI); g.fill(); }
    g.strokeStyle = "rgba(245,240,230,0.92)"; g.lineWidth = 6; g.strokeRect(60, y0 + S - 220, 160, 160);
    g.setLineDash([26, 18]); g.lineWidth = 5; g.beginPath(); g.moveTo(140, y0 + S - 220); g.bezierCurveTo(160, y0 + 500, 420, y0 + 700, 520, y0 + 460); g.bezierCurveTo(620, y0 + 220, 880, y0 + 300, 900, y0 + 120); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "rgba(245,240,230,0.92)"; g.lineWidth = 6; g.beginPath(); g.arc(900, y0 + 110, 46, 0, 2 * Math.PI); g.stroke();
    return cv;
  }
  // a maker's workbench 2.4 along x, 1.2 deep: a thick beech top on a dark steel frame, a plywood shelf with bins under it,
  // a blue vice at +x, a socket strip along -z; kind varies what is on it
  function makerBench(len, kind) { return furn("mbench" + len + "_" + kind, function (b) {
    var h = len / 2, n0 = b.count(), R = mulberry(900 + kind), x; b.box(-h, 0.86, -0.6, h, 0.92, 0.6, MT.WOOD); b.box(-h + 0.08, 0.16, -0.52, h - 0.08, 0.18, 0.52, MT.WOOD); kindTag(b, n0, 1);
    [[-h + 0.06, -0.54], [h - 0.06, -0.54], [-h + 0.06, 0.54], [h - 0.06, 0.54]].forEach(function (c) { b.box(c[0] - 0.03, 0, c[1] - 0.03, c[0] + 0.03, 0.86, c[1] + 0.03, MT.ANOD); });
    [-0.54, 0.54].forEach(function (z) { b.box(-h + 0.06, 0.78, z - 0.02, h - 0.06, 0.84, z + 0.02, MT.ANOD); });
    for (x = -h + 0.25; x < h - 0.4; x += 0.5) { var nb = b.count(); b.box(x, 0.18, -0.2, x + 0.4, 0.36, 0.2, MT.PLASTIC); b.tag(nb, R() < 0.5 ? 3 : 5, null); }
    var nv = b.count(); b.box(h - 0.25, 0.92, -0.14, h - 0.05, 1.02, 0.14, MT.PLASTIC); b.box(h - 0.05, 0.92, -0.08, h + 0.08, 1.0, 0.08, MT.PLASTIC); b.tag(nv, 3, null);   // the vice
    b.box(h - 0.07, 0.92, -0.14, h - 0.05, 1.04, 0.14, MT.STEEL); tubeAlong(b, [V3(h + 0.08, 0.96, 0), V3(h + 0.2, 0.96, 0)], 0.008, 5, MT.STEEL); b.box(h + 0.19, 0.91, -0.1, h + 0.21, 1.01, 0.1, MT.STEEL);
    var ns = b.count(); b.box(-h + 0.2, 0.92, -0.58, -h + 0.9, 0.97, -0.52, MT.PLASTIC); b.tag(ns, 0, null);
    var nm = b.count(); b.box(-0.55, 0.92, -0.35, 0.25, 0.925, 0.2, MT.PLASTIC); b.tag(nm, 6, null);                          // a cutting mat
    if (kind % 2 === 0) { var np = b.count(); b.box(-0.35, 0.925, -0.2, -0.2, 0.932, -0.1, MT.PLASTIC); b.tag(np, 6, null);  // a board, a soldering station
      var nst = b.count(); b.box(0.35, 0.92, -0.4, 0.55, 1.02, -0.25, MT.PLASTIC); b.tag(nst, 5, null); tubeAlong(b, [V3(0.45, 1.02, -0.3), V3(0.45, 1.12, -0.18), V3(0.4, 1.1, -0.05)], 0.006, 5, MT.STEEL); }
    else { var nr = b.count(); b.box(-0.4, 0.95, -0.12, -0.05, 0.97, 0.1, MT.STEEL); [-0.36, -0.22, -0.09].forEach(function (xx) { [-0.13, 0.11].forEach(function (z) { b.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14), T(xx, 0.965, z, Math.PI / 2, 0, 0), MT.RUBBER); }); }); }   // a rover's chassis
  }); }
  // a cable reel on the ceiling over a bench and its socket box hanging at y (relative to the floor)
  function powerDrop(B, r, a, y, ceil) { var p = crsPt(r, a), M = crsFrame(r, a, y), bx = new Builder(), nb = bx.count();
    bx.box(-0.09, -0.06, -0.05, 0.09, 0.06, 0.05, MT.PLASTIC); bx.tag(nb, 1, null); var ns = bx.count(); [-0.045, 0.045].forEach(function (x) { bx.box(x - 0.025, -0.03, -0.052, x + 0.025, 0.03, -0.05, MT.PLASTIC); }); bx.tag(ns, 0, null); B.add(bx, M);
    tubeAlong(B, [V3(p.x, y + 0.06, p.z), V3(p.x, ceil - 0.25, p.z)], 0.006, 5, MT.RUBBER);
    var rl = new Builder(), nr = rl.count(); rl.geo(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 20), T(0, 0, 0, 0, 0, Math.PI / 2), MT.PLASTIC); rl.tag(nr, 1, null); rl.box(-0.08, 0.1, -0.08, 0.08, 0.24, 0.08, MT.ANOD); B.add(rl, crsFrame(r, a, ceil - 0.24)); }
  // an enclosed 3D printer 0.5 wide (x), 0.55 deep, back at +z: a dark case, a glass door (apart), the bed with a print on it,
  // the head on its gantry, a spool on the side
  function printerBox(k) { return furn("printer" + k, function (b) {
    var n0 = b.count(); b.box(-0.25, 0, -0.26, 0.25, 0.04, 0.28, MT.PLASTIC); b.box(-0.25, 0.56, -0.26, 0.25, 0.6, 0.28, MT.PLASTIC); b.box(-0.25, 0, 0.25, 0.25, 0.6, 0.28, MT.PLASTIC);
    [-1, 1].forEach(function (s) { b.box(s * 0.25 - 0.02, 0, -0.26, s * 0.25, 0.6, 0.28, MT.PLASTIC); }); [[-0.25, -0.23], [0.23, 0.25]].forEach(function (c) { b.box(c[0], 0.04, -0.27, c[1], 0.56, -0.25, MT.PLASTIC); }); b.tag(n0, k % 3 ? 1 : 5, null);
    b.box(-0.18, 0.12, -0.18, 0.18, 0.13, 0.18, MT.STEEL); tubeAlong(b, [V3(-0.21, 0.42, -0.05), V3(0.21, 0.42, -0.05)], 0.006, 5, MT.STEEL); var nh = b.count(); b.box(-0.04 + (k - 2) * 0.03, 0.38, -0.09, 0.04 + (k - 2) * 0.03, 0.46, -0.01, MT.PLASTIC); b.tag(nh, 5, null);
    var np = b.count(), pc = [6, 0, 3, 5, 2, 0][k % 6]; if (k % 3 === 0) b.box(-0.06, 0.13, -0.06, 0.06, 0.2, 0.06, MT.PLASTIC); else b.geo(new THREE.CylinderGeometry(0.05, 0.07, 0.1 + 0.03 * k, 16), T(0, 0.18 + 0.015 * k, 0), MT.PLASTIC); b.tag(np, pc, null);
    var nsp = b.count(); b.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.065, 22), T(0.29, 0.42, 0.05, 0, 0, Math.PI / 2), MT.PLASTIC); b.tag(nsp, pc, null); b.box(0.25, 0.4, 0.04, 0.33, 0.44, 0.06, MT.ANOD);
    var nd = b.count(); b.box(-0.12, 0.58, -0.272, 0.04, 0.6, -0.27, MT.PLASTIC); b.tag(nd, 0, null);
  }); }
  // the laser cutter 1.4 wide (x), 0.95 deep, back at +z, made like a real one (v0.43): a grey stand with two doors on
  // levelling feet; the white machine on it, its lid hinged at the back and sloping down to the front, a big smoked window
  // in it and a handle along its front edge; the control panel on the front at the right, a screen, two lamps and the
  // stop button; the exhaust duct from the back to the ceiling
  function laserCutter(ceil) { return furn("laser" + ceil.toFixed(2), function (b) {
    var nst = b.count(); b.box(-0.68, 0.02, -0.45, 0.68, 0.62, 0.45, MT.PLASTIC); b.tag(nst, 5, null);
    b.box(-0.004, 0.08, -0.453, 0.004, 0.58, -0.45, MT.ANOD); b.box(-0.64, 0.585, -0.453, 0.64, 0.59, -0.45, MT.ANOD);
    [-0.07, 0.07].forEach(function (x) { b.box(x - 0.008, 0.44, -0.472, x + 0.008, 0.55, -0.453, MT.STEEL); });
    [[-0.62, -0.4], [0.62, -0.4], [-0.62, 0.4], [0.62, 0.4]].forEach(function (c) { b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), T(c[0], 0.01, c[1]), MT.RUBBER); });
    var nb = b.count(); b.box(-0.7, 0.62, -0.47, 0.7, 0.98, 0.47, MT.PLASTIC);
    var sh = new THREE.Shape(); sh.moveTo(-0.47, 0.98); sh.lineTo(0.47, 0.98); sh.lineTo(0.47, 1.2); sh.closePath();        // the wedge under the lid
    b.geo(new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false }), T(0.7, 0, 0, 0, -Math.PI / 2, 0), MT.PLASTIC); b.tag(nb, 0, null);
    var L = new Builder(), sl = Math.hypot(0.94, 0.22);
    L.box(-0.7, 0, -sl, 0.7, 0.035, -sl + 0.1, MT.PLASTIC); L.box(-0.7, 0, -0.1, 0.7, 0.035, 0, MT.PLASTIC);
    L.box(-0.7, 0, -sl + 0.1, -0.6, 0.035, -0.1, MT.PLASTIC); L.box(0.6, 0, -sl + 0.1, 0.7, 0.035, -0.1, MT.PLASTIC); L.tag(0, 0, null);
    L.box(-0.6, 0.006, -sl + 0.1, 0.6, 0.03, -0.1, MT.DKGLASS);
    tubeAlong(L, [V3(-0.42, 0.035, -sl + 0.05), V3(-0.42, 0.075, -sl + 0.05), V3(0.42, 0.075, -sl + 0.05), V3(0.42, 0.035, -sl + 0.05)], 0.011, 8, MT.STEEL);
    b.add(L, T(0, 1.2, 0.47, -Math.atan2(0.22, 0.94), 0, 0));
    var np = b.count(); b.box(0.4, 0.74, -0.478, 0.66, 0.94, -0.47, MT.PLASTIC); b.tag(np, 1, null);
    b.box(0.43, 0.84, -0.481, 0.57, 0.92, -0.478, MT.DKGLASS);
    [0.6, 0.63].forEach(function (x) { b.geo(addF2(new THREE.CircleGeometry(0.008, 10), 1.6, 0.6), T(x, 0.9, -0.482, 0, Math.PI, 0), MT.LIGHT, 1); });
    var nk = b.count(); b.geo(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 16), T(0.615, 0.79, -0.485, Math.PI / 2, 0, 0), MT.PLASTIC); b.tag(nk, 2, null);
    tubeAlong(b, [V3(0.4, 0.8, 0.47), V3(0.4, 0.8, 0.62), V3(0.4, 1.4, 0.68), V3(0.4, ceil, 0.68)], 0.075, 14, MT.STEEL);
  }); }
  // the robot arena 3.0 by 3.0: an oak rim round a plywood table 0.55 high, its mat drawn on the canvas (apart), cones, and
  // the rovers students built: six wheels on rocker arms, a deck, a solar panel, a mast with a camera head, an antenna
  function arenaTable() { return furn("arena", function (b) {
    var n0 = b.count(); b.box(-1.5, 0.45, -1.5, 1.5, 0.52, 1.5, MT.WOOD); [[-1.5, -1.5, 1.5, -1.44], [-1.5, 1.44, 1.5, 1.5], [-1.5, -1.44, -1.44, 1.44], [1.44, -1.44, 1.5, 1.44]].forEach(function (c) { b.box(c[0], 0.52, c[1], c[2], 0.62, c[3], MT.WOOD); }); kindTag(b, n0, 1);
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4], [0, -1.4], [0, 1.4], [-1.4, 0], [1.4, 0]].forEach(function (c) { b.box(c[0] - 0.04, 0, c[1] - 0.04, c[0] + 0.04, 0.45, c[1] + 0.04, MT.ANOD); });
    [[0.6, -0.9], [-0.2, 0.5], [0.9, 0.7]].forEach(function (c) { var nc = b.count(); b.geo(new THREE.ConeGeometry(0.05, 0.13, 14), T(c[0], 0.585, c[1]), MT.PLASTIC); b.tag(nc, 2, null); b.box(c[0] - 0.06, 0.52, c[1] - 0.06, c[0] + 0.06, 0.53, c[1] + 0.06, MT.PLASTIC); });
  }); }
  function rover(k) { return furn("rover" + k, function (b) {            // 0.42 long (x), its wheels 0.1 across
    var w = 0.16, nd = b.count(); b.box(-0.18, 0.12, -0.12, 0.18, 0.15, 0.12, MT.STEEL); var np = b.count(); b.box(-0.12, 0.15, -0.08, 0.06, 0.16, 0.06, MT.PLASTIC); b.tag(np, 6, null);
    [-1, 1].forEach(function (s) { tubeAlong(b, [V3(-0.2, 0.06, s * w), V3(-0.04, 0.13, s * w), V3(0.08, 0.1, s * w), V3(0.2, 0.06, s * w)], 0.008, 4, MT.ANOD);
      [-0.2, 0.0, 0.2].forEach(function (x) { b.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), T(x, 0.05, s * (w + 0.02), Math.PI / 2, 0, 0), MT.RUBBER); }); });
    var ns = b.count(); b.box(-0.17, 0.17, -0.13, 0.05, 0.175, 0.13, MT.SOLAR);
    tubeAlong(b, [V3(0.12, 0.15, 0.04), V3(0.12, 0.36, 0.04)], 0.008, 5, MT.ANOD); var nh = b.count(); b.box(0.08, 0.35, -0.01, 0.16, 0.4, 0.09, MT.PLASTIC); b.tag(nh, k % 2 ? 0 : 1, null);
    [0.02, 0.06].forEach(function (z) { b.geo(new THREE.CircleGeometry(0.012, 12), T(0.161, 0.375, z, 0, Math.PI / 2, 0), MT.DKGLASS); });
    tubeAlong(b, [V3(-0.15, 0.17, -0.1), V3(-0.15, 0.42, -0.1)], 0.002, 3, MT.STEEL);
  }); }
  // racks for sheets of plywood and acrylic, len along x, back at +z, the sheets standing on edge
  function sheetRack(len) { return furn("sheets" + len, function (b) {
    var h = len / 2, R = mulberry(61); [-h, h].forEach(function (x) { b.box(x - 0.025, 0, -0.3, x + 0.025, 1.6, 0.3, MT.ANOD); }); b.box(-h, 0, -0.3, h, 0.06, 0.3, MT.ANOD);
    for (var k = 0; k < 9; k++) { var x = -h + 0.12 + k * (len - 0.24) / 8, ac = R() < 0.35, n0 = b.count(), ht = 1.2 + R() * 0.3; b.box(x - 0.009, 0.06, -0.28, x + 0.009, ht, 0.26, ac ? MT.PLASTIC : MT.WOOD); if (ac) b.tag(n0, [0, 1, 6, 5][Math.floor(R() * 4)], null); else b.tag(n0, null, 1); }
  }); }
  // a wall shelf of filament spools, len along x, back at +z
  function spoolShelf(len) { return furn("spools" + len, function (b) {
    var h = len / 2, n0 = b.count(); b.box(-h, 0, -0.24, h, 0.025, 0.0, MT.WOOD); kindTag(b, n0, 1); [-h + 0.05, h - 0.05].forEach(function (x) { b.box(x - 0.01, -0.18, -0.02, x + 0.01, 0.0, 0.0, MT.ANOD); });
    var cols = [0, 1, 5, 6, 3, 0, 2, 1, 5, 7]; for (var x = -h + 0.12, k = 0; x < h - 0.1; x += 0.2, k++) { var ns = b.count(); b.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.065, 22), T(x, 0.125, -0.12, 0, 0, Math.PI / 2), MT.PLASTIC); b.tag(ns, cols[k % cols.length], null); b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 10), T(x, 0.125, -0.12, 0, 0, Math.PI / 2), MT.CERAMIC); }
  }); }
  function makerSpace(B, rm, F) {
    var C = CRS, y = F.y, sg = F.sgn, back = sg > 0 ? ROT.plusA : ROT.minusA, front = sg > 0 ? ROT.minusA : ROT.plusA, ceil = ceilY(rm, F.floor, 55.8), quads = [];
    // the back wall: the tool wall over a long bench with its vices
    var tw = 6.0, th = 1.76, tr = 54.6, Mw = crsFrame(tr, F.back + sg * 0.08 / tr, y + 0.95, sg > 0 ? Math.PI / 2 : -Math.PI / 2);   // its +z into the room
    var fr = new Builder(), nf = fr.count(); fr.box(-tw / 2 - 0.04, -0.04, -0.02, tw / 2 + 0.04, th + 0.04, 0.0, MT.WOOD); kindTag(fr, nf, 2); B.add(fr, Mw);
    quads.push({ M: Mw, x0: -tw / 2, x1: tw / 2, y0: 0, y1: th, z: 0.004, u0: 0, u1: 1, v0: 1 - MAKER.wallH / MAKER.H, v1: 1, b: 0.42 });
    var lb = F.at(0.5, false); crsPlace(B, makerBench(6.0, 5), tr, lb, y, sg > 0 ? -Math.PI / 2 : Math.PI / 2); crsObst(tr - 3.05, tr + 3.05, F.back, F.at(1.15, false), F.floor);
    var wl = crsPt(tr, F.at(1.6, false)); wLight(wl.x, y + 3.2, wl.z, LAMPC, 1.1, 5, [0, -0.5, 0], 1);
    // four workbenches with stools, a power drop over each
    [[53.2, 5.0], [58.4, 5.0], [53.2, 8.6], [58.4, 8.6]].forEach(function (p, k) { var a = F.at(p[1], true);
      crsPlace(B, makerBench(2.4, k), p[0], a, y, sg > 0 ? 0 : Math.PI); crsObst(p[0] - 0.62, p[0] + 0.62, a - 1.22 / p[0], a + 1.22 / p[0], F.floor);
      [-0.6, 0.6].forEach(function (x) { [[p[0] - 0.95, -Math.PI / 2], [p[0] + 0.95, Math.PI / 2]].forEach(function (s, si) { crsPlace(B, labStool(), s[0], a + x / s[0], y, s[1] + (x > 0 ? 0.15 : -0.1) * (si ? -1 : 1)); }); });
      powerDrop(B, p[0], a, y + 1.75, ceil); });
    // the robot arena and its rovers
    var aa = F.at(12.6, true), ar = 56.0, Ma = crsFrame(ar, aa, y); B.add(arenaTable(), Ma); contactShadow(arenaTable(), Ma); crsObst(ar - 1.55, ar + 1.55, aa - 1.55 / ar, aa + 1.55 / ar, F.floor);
    quads.push({ M: Ma.clone().multiply(T(0, 0.522, 0, -Math.PI / 2, 0, 0)), x0: -1.44, x1: 1.44, y0: -1.44, y1: 1.44, z: 0, u0: 0, u1: S_U(1024), v0: 0, v1: 1024 / MAKER.H, b: 0.5 });
    [[-0.95, 0.9, 0.4], [0.2, -0.2, 2.2], [0.7, 0.95, -0.8], [-0.6, -0.8, 1.1]].forEach(function (p, k) { B.add(rover(k), Ma.clone().multiply(T(p[0], 0.522, p[1], 0, p[2], 0))); });
    // the corridor wall between the doors: six printers on a counter, a shelf of filament over them
    var c0 = 4.0, c1 = 10.0, cm = F.at((c0 + c1) / 2, true), rr2 = C.rc + 0.405, cl = (c1 - c0) * rr2 / 55.8;
    crsPlace(B, counter(cl), rr2, cm, y, ROT.out); crsObst(C.rc + 0.05, C.rc + 0.78, F.at(c0, true), F.at(c1, true), F.floor);
    for (var k2 = 0; k2 < 6; k2++) { var pa = F.at(c0 + 0.5 + k2 * (c1 - c0 - 1.0) / 5, true), Mp = crsFrame(rr2, pa, y + 0.92, ROT.out); B.add(printerBox(k2), Mp); glassPane(Mp, -0.23, 0.04, 0.23, 0.56, -0.262, 1); }
    B.add(spoolShelf(cl * 0.8), crsFrame(C.rc + 0.075, cm, y + 1.85, ROT.out));
    // the front wall: racks of bins, the sheets of plywood and acrylic; the laser cutter near the glass, its duct to the ceiling
    [52.4, 54.5].forEach(function (r) { var a = F.at(0.4, true); crsPlace(B, rack(), r, a, y, front); }); crsObst(51.3, 55.6, F.at(0.75, true), F.front, F.floor);
    var sa = F.at(0.4, true); crsPlace(B, sheetRack(1.6), 56.6, sa, y, front); crsObst(55.7, 57.5, F.at(0.75, true), F.front, F.floor);
    var la = F.at(1.35, true); crsPlace(B, laserCutter(ceil - y), 59.4, la, y, front); crsObst(58.6, 60.2, F.at(0.6, true), F.at(1.9, true), F.floor);
    texQuads(makerCanvas(), quads);
    roomPlants(B, rm, F, null);
  }
  function S_U(px) { return px / MAKER.W; }
  /* ---- Ramanujan, the competition room (T06-12): the stage and the scoreboard, team tables, chess, the trophies ---- */
  // the room's canvas: the scoreboard (drawn at 1920 x 1080, laid on 1280 x 720) and the demonstration chess board (720 x 720)
  var COMP = { W: 2048, H: 1024, sbW: 1280, sbH: 720, bx: 1300, bs: 720 };
  function compScoreboard(g) {                               // the team round under way: the standings problem by problem, the time left
    var W = 1920, R = mulberry(139), pts = [3, 3, 3, 4, 4, 4, 5, 5, 6, 6], odds = [0.92, 0.86, 0.8, 0.7, 0.62, 0.5];
    g.fillStyle = "#0b0e13"; g.fillRect(0, 0, W, 1080);
    var gr = g.createLinearGradient(0, 0, 0, 140); gr.addColorStop(0, "#1a2330"); gr.addColorStop(1, "#10161e"); g.fillStyle = gr; g.fillRect(0, 0, W, 140);
    g.textBaseline = "middle"; g.textAlign = "left"; g.fillStyle = "#ece6d8"; g.font = "bold 62px " + SANS; g.fillText("TEAM ROUND", 60, 72);
    g.fillStyle = "#97a2b0"; g.font = "44px " + SANS; g.fillText("problem 7 of 10", 510, 74);
    g.textAlign = "right"; g.fillStyle = "#97a2b0"; g.font = "38px " + SANS; g.fillText("time left", W - 330, 76);
    g.fillStyle = "#e3a83c"; g.font = "bold 90px " + MONO; g.fillText("24:37", W - 60, 74);
    var teams = ["Euclid", "Gauss", "Hypatia", "Noether", "Fibonacci", "Archimedes", "Pythagoras", "Lovelace", "Turing", "Ramanujan"], rows = [];
    teams.forEach(function (t) { var pr = [], tot = 0;               // 1 right, -1 wrong, 0 handed in and waiting to be marked, null not reached
      for (var p = 0; p < 10; p++) { var st = p < 6 ? (R() < odds[p] ? 1 : -1) : p === 6 ? (R() < 0.6 ? (R() < 0.65 ? 1 : -1) : 0) : null; pr.push(st); if (st === 1) tot += pts[p]; }
      rows.push({ t: t, pr: pr, tot: tot }); });
    rows.sort(function (a, b) { return b.tot - a.tot; });
    var y0 = 196, rh = 86, cx0 = 600, cw = 116;
    g.textAlign = "center"; g.font = "36px " + SANS;
    for (var p = 0; p < 10; p++) { g.fillStyle = p === 6 ? "#e3a83c" : "#6f7a88"; g.fillText(String(p + 1), cx0 + p * cw, y0 - 26); }
    g.fillStyle = "#6f7a88"; g.fillText("total", 1790, y0 - 26);
    rows.forEach(function (rw, i) { var y = y0 + i * rh + rh / 2, rank = 1 + rows.filter(function (o) { return o.tot > rw.tot; }).length;
      g.fillStyle = i % 2 ? "#0f141b" : "#141a22"; g.fillRect(40, y - rh / 2 + 4, W - 80, rh - 8);
      g.textAlign = "right"; g.fillStyle = rank <= 3 ? "#e3a83c" : "#8b95a3"; g.font = "bold 44px " + SANS; g.fillText(String(rank), 112, y + 2);
      g.textAlign = "left"; g.fillStyle = "#ece6d8"; g.font = "50px " + SANS; g.fillText(rw.t, 150, y + 2);
      g.textAlign = "center";
      rw.pr.forEach(function (st, q) { var x = cx0 + q * cw;
        g.fillStyle = st === null ? "#19202a" : st === 0 ? "#2c3542" : st > 0 ? "#2e7a4d" : "#7a2e35"; g.fillRect(x - 50, y - 29, 100, 58);
        if (st === null) return; g.fillStyle = st === 0 ? "#9aa4b2" : "#f1ede4"; g.font = "bold 40px " + SANS; g.fillText(st === 0 ? "…" : st > 0 ? String(pts[q]) : "–", x, y + 2); });
      g.fillStyle = "#f1ede4"; g.font = "bold 54px " + MONO; g.fillText(String(rw.tot), 1790, y + 2);
    });
  }
  function compChessBoard(g) {                               // the demonstration board: the final position of Morphy's Opera game
    var S = 75, x0 = 60, y0 = 16, f, k, FIG = "'DejaVu Sans', 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Apple Symbols', 'Arial Unicode MS', serif";
    g.fillStyle = "#e6dcc6"; g.fillRect(0, 0, 720, 720);
    for (f = 0; f < 8; f++) for (k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? "#eee5cf" : "#6b8a5b"; g.fillRect(x0 + f * S, y0 + (7 - k) * S, S, S); }
    g.strokeStyle = "#3b3226"; g.lineWidth = 3; g.strokeRect(x0, y0, 8 * S, 8 * S);
    g.fillStyle = "#3b3226"; g.font = "bold 26px " + SANS; g.textAlign = "center"; g.textBaseline = "middle";
    for (f = 0; f < 8; f++) g.fillText("abcdefgh"[f], x0 + (f + 0.5) * S, y0 + 8 * S + 22);
    for (k = 0; k < 8; k++) g.fillText(String(k + 1), x0 - 28, y0 + (7.5 - k) * S);
    var OUT = { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" }, FILL = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
    g.font = "62px " + FIG; g.lineJoin = "round";
    "Kc1 Rd8 Bg5 Pa2 Pb2 Pc2 Pe4 Pf2 Pg2 Ph2 ke8 qe6 rh8 bf8 nb8 pa7 pe5 pf7 pg7 ph7".split(" ").forEach(function (t) {
      var white = t[0] !== t[0].toLowerCase(), p = t[0].toLowerCase(), cx = x0 + (t.charCodeAt(1) - 96.5) * S, cy = y0 + (8.5 - (+t[2])) * S + 4;
      if (white) { g.fillStyle = "#f8f4ea"; g.fillText(FILL[p] + "︎", cx, cy); g.fillStyle = "#1c1915"; g.fillText(OUT[p] + "︎", cx, cy); }
      else { g.strokeStyle = "#eee6d4"; g.lineWidth = 3; g.strokeText(FILL[p] + "︎", cx, cy); g.fillStyle = "#1c1915"; g.fillText(FILL[p] + "︎", cx, cy); }
    });
    g.fillStyle = "#2a241c"; g.font = "italic 24px " + SERIF; g.fillText("Paul Morphy v Duke Karl of Brunswick and Count Isouard", 360, y0 + 8 * S + 54);
    g.font = "24px " + SERIF; g.fillText("Paris Opera, 1858  ·  17.Rd8 mate", 360, y0 + 8 * S + 84);
  }
  function compCanvas() {
    var s = MOBILE ? 0.5 : 1, cv = mkCanvas(Math.round(COMP.W * s), Math.round(COMP.H * s)), g = cv.getContext("2d"), k = COMP.sbW / 1920;
    g.setTransform(s * k, 0, 0, s * k, 0, 0); compScoreboard(g);
    g.setTransform(s, 0, 0, s, s * COMP.bx, 0); compChessBoard(g);
    return cv;
  }
  // a trophy cabinet len along x, 0.45 deep (its back at +z), 1.9 high: walnut, a closed base, glass doors above between thin
  // walnut bars, two shelves; brass cups on walnut plinths (the big ones with two handles) and walnut plaques with brass plates
  function trophyCabinet(len) { return furn("trophies" + len, function (b) {
    var h = len / 2, n0 = b.count(), R = mulberry(77), nd = Math.round(len / 0.9), k;
    b.box(-h, 0, 0.2, h, 1.9, 0.225, MT.WOOD); b.box(-h, 0, -0.225, -h + 0.03, 1.9, 0.225, MT.WOOD); b.box(h - 0.03, 0, -0.225, h, 1.9, 0.225, MT.WOOD);
    b.box(-h, 1.87, -0.225, h, 1.9, 0.225, MT.WOOD); b.box(-h, 0.04, -0.225, h, 0.75, 0.2, MT.WOOD); [1.2, 1.55].forEach(function (y) { b.box(-h + 0.03, y, -0.2, h - 0.03, y + 0.015, 0.2, MT.WOOD); });
    for (k = 1; k < nd; k++) { var xs = -h + len * k / nd; b.box(xs - 0.012, 0.75, -0.228, xs + 0.012, 1.87, -0.21, MT.WOOD); }
    kindTag(b, n0, 2); var nb = b.count(); b.box(-h + 0.02, 0, -0.205, h - 0.02, 0.04, 0.19, MT.PLASTIC);
    for (k = 0; k < nd; k++) { var xd = -h + len * (k + 0.5) / nd; b.box(xd - 0.002, 0.08, -0.2265, xd + 0.002, 0.71, -0.224, MT.PLASTIC); } b.tag(nb, 1, null);   // the plinth, the seams between the doors
    for (k = 0; k < nd; k++) { var xh = -h + len * (k + 0.5) / nd; b.box(xh - 0.05, 0.62, -0.24, xh - 0.02, 0.64, -0.225, MT.BRASS); b.box(xh + 0.02, 0.62, -0.24, xh + 0.05, 0.64, -0.225, MT.BRASS); }
    [0.75, 1.215, 1.565].forEach(function (y, row) { for (var x = -h + 0.2; x < h - 0.15; x += 0.3 + R() * 0.15) {
      if (R() < 0.6) { var s = 0.7 + R() * (row ? 0.3 : 0.5), np = b.count(), z = -0.02; b.box(x - 0.055 * s, y, z - 0.055 * s, x + 0.055 * s, y + 0.045 * s, z + 0.055 * s, MT.WOOD); kindTag(b, np, 2);
        var yc = y + 0.045 * s; latheOn(b, x, yc, z, [[0.0, 0.0], [0.045 * s, 0.0], [0.045 * s, 0.012 * s], [0.016 * s, 0.03 * s], [0.011 * s, 0.1 * s], [0.028 * s, 0.12 * s], [0.066 * s, 0.17 * s], [0.078 * s, 0.24 * s], [0.0, 0.24 * s]], 18, MT.BRASS, 0);
        if (s > 0.95) [-1, 1].forEach(function (e) { tubeAlong(b, [V3(x + e * 0.07 * s, yc + 0.21 * s, z), V3(x + e * 0.12 * s, yc + 0.18 * s, z), V3(x + e * 0.038 * s, yc + 0.135 * s, z)], 0.006, 4, MT.BRASS); }); }
      else { var pl = new Builder(), nq = pl.count(); pl.box(-0.085, 0, -0.012, 0.085, 0.24, 0.012, MT.WOOD); kindTag(pl, nq, 2); pl.box(-0.06, 0.07, -0.015, 0.06, 0.125, -0.012, MT.BRASS);
        b.add(pl, T(x, y, 0.15, 0.12, 0, 0)); } } });
  }); }
  function chessClock() { return furn("chessclock", function (b) {        // a wooden case 0.2 along x, two white faces toward +z, a brass button over each
    var n0 = b.count(); b.geo(new THREE.BoxGeometry(0.2, 0.08, 0.08), T(0, 0.04, 0, -0.25, 0, 0), MT.WOOD); kindTag(b, n0, 2);
    [-0.05, 0.05].forEach(function (x) { var nf = b.count(); b.geo(new THREE.CircleGeometry(0.028, 16), T(x, 0.05, 0.04, -0.25, 0, 0), MT.PLASTIC); b.tag(nf, 0, null);
      b.geo(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), T(x, 0.09, -0.01), MT.BRASS); });
  }); }
  // a game on a chess table's inlaid board (as gameTable: squares 0.07, its top at 0.743), the pieces as the giant set's at a
  // sixth of its size: White at +z, the files from a at +x, so that in the Ring's mirror-handed frames a1 is dark and on
  // White's left; "Ke1 Pe4 ... ke8", upper case White
  function chessGame(pos) { return furn("game" + pos, function (b) {
    var s = 0.07 / 0.4; pos.split(" ").forEach(function (t) { var white = t[0] !== t[0].toLowerCase(), p = t[0].toLowerCase(), f = t.charCodeAt(1) - 97, k = +t[2] - 1;
      b.add(chessPiece(p, !white), T(0.245 - 0.07 * f, 0.743, 0.245 - 0.07 * k, 0, p === "n" ? (white ? Math.PI : 0) : 0, 0, s, s, s)); });
  }); }
  // what lies on a team's table (its top at y = 0; x along the table, the team at +-z): four answer sheets with a pencil by
  // each, a cup of pencils, the team's number card folded like a tent
  function teamKit(k) { return furn("teamkit" + (k % 4), function (b) {
    var R = mulberry(300 + k), ns = b.count();
    [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].forEach(function (c) { var tw = (R() - 0.5) * 0.3, M = T(c[0], 0, c[1], 0, tw, 0); var sh = new Builder();
      sh.box(-0.105, 0, -0.15, 0.105, 0.003, 0.15, MT.PLASTIC); if (R() < 0.7) sh.box(-0.1, 0.003, -0.145, 0.11, 0.005, 0.14, MT.PLASTIC); b.add(sh, M); });
    b.tag(ns, 0, null); var np = b.count();
    [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].forEach(function (c) { var pc = new Builder(); pc.box(-0.003, 0, -0.085, 0.003, 0.007, 0.085, MT.PLASTIC); b.add(pc, T(c[0] + 0.15, 0.003, c[1], 0, (R() - 0.5) * 0.6, 0)); });
    b.tag(np, 4, null); var nc = b.count();
    latheOn(b, 0.0, 0, 0.05, [[0.0, 0.0], [0.036, 0.0], [0.04, 0.1], [0.036, 0.1], [0.032, 0.006], [0.0, 0.006]], 16, MT.CERAMIC, 0);
    for (var i = 0; i < 6; i++) tubeAlong(b, [V3(0.0, 0.01, 0.05), V3(Math.cos(i * 1.1) * 0.032, 0.18 + R() * 0.03, 0.05 + Math.sin(i * 1.1) * 0.032)], 0.0035, 4, MT.PLASTIC, 4);
    var nt = b.count(); b.geo(new THREE.BoxGeometry(0.16, 0.1, 0.003), T(0.0, 0.047, -0.075, -0.33, 0, 0), MT.PLASTIC); b.geo(new THREE.BoxGeometry(0.16, 0.1, 0.003), T(0.0, 0.047, -0.11, 0.33, 0, 0), MT.PLASTIC); b.tag(nt, 0, null);
  }); }
  function competitionRoom(B, rm, F) {
    var C = CRS, y = F.y, sg = F.sgn, rf = sg > 0 ? Math.PI / 2 : -Math.PI / 2, quads = [];
    // the front: the problem reader's stage and lectern, the problems on it in a folder; the scoreboard over the stage
    var Ms = crsFrame(55.8, F.at(0.075, true), y, rf), Ml = Ms.clone().multiply(T(-1.6, 0.6, -1.1)); B.add(stageDeck(6.0, 1.8), Ms); B.add(lectern(), Ml);
    var fo = new Builder(), nf = fo.count(); fo.box(-0.12, 0, -0.16, 0.12, 0.006, 0.16, MT.PLASTIC); fo.tag(nf, 6, null); var nfp = fo.count(); fo.box(-0.105, 0.006, -0.148, 0.105, 0.01, 0.148, MT.PLASTIC); fo.tag(nfp, 0, null);
    B.add(fo, Ml.clone().multiply(T(-0.05, 1.156, 0.055, 0.3, 0, 0))); crsObst(52.7, 58.9, F.front, F.at(2.75, true), F.floor);
    var sw = 3.2, sh = 1.8, Mb = crsFrame(55.8, F.at(0.085, true), y + 3.1, -rf);    // on the wall's face, its +z into the room
    var fb = new Builder(), nb = fb.count(); fb.box(-sw / 2 - 0.05, -sh / 2 - 0.05, 0.0, sw / 2 + 0.05, sh / 2 + 0.05, 0.05, MT.PLASTIC); fb.tag(nb, 1, null); B.add(fb, Mb);
    quads.push({ M: Mb, x0: -sw / 2, x1: sw / 2, y0: -sh / 2, y1: sh / 2, z: 0.052, u0: 0, u1: COMP.sbW / COMP.W, v0: 1 - COMP.sbH / COMP.H, v1: 1, b: 1.0 });
    var lp = V3(0, -0.6, 1.6).applyMatrix4(Mb); wLight(lp.x, lp.y, lp.z, [0.75, 0.82, 1.0], 0.5, 4, null, 0);
    // ten team tables across the room, two task chairs along each long side; on each the team's papers, pencils, card, water
    var k = 0; [4.3, 7.0, 9.7, 12.4, 15.1].forEach(function (d) { [53.4, 58.4].forEach(function (r) {
      var a = F.at(d, true), Mt = crsFrame(r, a, y, Math.PI / 2); crsPlace(B, teamTable(), r, a, y, Math.PI / 2); crsObst(r - 0.9, r + 0.9, a - 0.95 / r, a + 0.95 / r, F.floor);
      B.add(teamKit(k++), Mt.clone().multiply(T(0, 0.75, 0)));
      [[-0.45, -0.62], [0.45, -0.62], [-0.45, 0.62], [0.45, 0.62]].forEach(function (c) { crsPlace(B, officeChair(), r + c[0], a + c[1] / r, y, c[1] > 0 ? Math.PI : 0);
        var Mw = Mt.clone().multiply(T(-c[0] * 1.42, 0.75, c[1] > 0 ? 0.1 : -0.1)), cap = new Builder(), nc = cap.count();
        glassLathe(Mw, [[0.03, 0.0], [0.033, 0.012], [0.033, 0.14], [0.027, 0.168], [0.013, 0.188], [0.013, 0.205], [0.0, 0.205]], 12);
        cap.geo(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12), T(0, 0.212, 0), MT.PLASTIC); cap.tag(nc, 3, null); B.add(cap, Mw); });
    }); });
    // the back: two chess tables, a game on each and its clock, under the demonstration board
    [[54.2, "Ke1 Qd1 Ra1 Rh1 Bc1 Bf1 Nc3 Nd4 Pa2 Pb2 Pc2 Pe4 Pf2 Pg2 Ph2 ke8 qd8 ra8 rh8 bc8 bf8 nb8 nf6 pa6 pb7 pd6 pe7 pf7 pg7 ph7"],
     [57.4, "Kg2 Rc7 Pa4 Pf3 Pg3 Ph4 kg8 ra2 pf7 pg6 ph5 pe5"]].forEach(function (g) { var r = g[0], a = F.at(1.45, false), Mc = crsFrame(r, a, y, 0);   // White on the outer side
      crsPlace(B, gameTable(), r, a, y, 0); B.add(chessGame(g[1]), Mc); B.add(chessClock(), Mc.clone().multiply(T(0.335, 0.74, 0, 0, Math.PI / 2, 0)));
      crsObst(r - 1.05, r + 1.05, a - 0.45 / r, a + 0.45 / r, F.floor);
      [-0.72, 0.72].forEach(function (dz) { crsPlace(B, diningChair(1), r + dz, a, y, dz > 0 ? Math.PI / 2 : -Math.PI / 2); }); });
    var Mg = crsFrame(55.8, F.at(0.085, false), y + 1.95, rf), gs = 1.3, gf = new Builder(), ng = gf.count();     // its +z into the room
    gf.box(-gs / 2 - 0.06, -gs / 2 - 0.06, 0.0, gs / 2 + 0.06, gs / 2 + 0.06, 0.035, MT.WOOD); kindTag(gf, ng, 2); B.add(gf, Mg);
    quads.push({ M: Mg, x0: -gs / 2, x1: gs / 2, y0: -gs / 2, y1: gs / 2, z: 0.037, u0: COMP.bx / COMP.W, u1: (COMP.bx + COMP.bs) / COMP.W, v0: 1 - COMP.bs / COMP.H, v1: 1, b: 0.5 });
    // the corridor wall between the doors: the trophy cabinet, its glass apart
    var ta = F.at(9.8, true), tr = C.rc + 0.3, Mt2 = crsFrame(tr, ta, y, ROT.out), tc = trophyCabinet(3.6), ed = [-1.77, -0.9, 0, 0.9, 1.77];
    if (!nearDoor(F, ta, 1.8)) { B.add(tc, Mt2); contactShadow(tc, Mt2); for (var e = 0; e < 4; e++) glassPane(Mt2, ed[e] + 0.014, 0.77, ed[e + 1] - 0.014, 1.86, -0.226, 1);
      crsObst(C.rc + 0.05, C.rc + 0.6, ta - 1.85 / tr, ta + 1.85 / tr, F.floor); }
    texQuads(compCanvas(), quads);
    roomPlants(B, rm, F, null);
  }
