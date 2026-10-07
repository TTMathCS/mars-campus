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
