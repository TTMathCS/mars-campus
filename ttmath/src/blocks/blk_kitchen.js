  /* ===================== The kitchen (T06-36): a working school kitchen behind the dining hall's servery ===================== */
  // Jim, 7 Oct 2026: "kitchen is empty and has no furniture and design". The program is campus_furnishing.py (T06-36). In
  // the middle the cooking island under its stainless canopy, a prep island beside it; along the outer wall the combi ovens,
  // prep tables under shelves of pans, the double sink with its spray arm; on the corridor wall a hand basin by the door, the
  // goods lift, the dry store's shelves and the walk-in cold room; on the back wall the dish station; on the wall to the
  // dining hall the pass under its heat lamps. Stainless everywhere (brushed STEEL), black knobs, white crockery.

  // satin stainless for the kitchen's steel (STEEL g.x 2): brushed steel mirrored the warm room and the sky and read brown
  function satin(b) { for (var k = 0, N = b.count(); k < N; k++) if (b.m[k] === MT.STEEL && !(b.f2[k * 2] > 8.5 && b.f2[k * 2] < 9.5)) b.f2[k * 2] = 2; return b; }
  // a stainless table len along x, dp deep (its back at +z), 0.9 high: a top with a turned-down edge, an undershelf, four
  // legs on feet, a splash 0.12 high at the back if it stands on a wall
  function steelTable(len, dp, splash) { return furn("stab" + len + "_" + dp + "_" + (splash ? 1 : 0), function (b) {
    var h = len / 2, d = dp / 2; b.box(-h, 0.86, -d, h, 0.9, d, MT.STEEL); b.box(-h, 0.82, -d, h, 0.86, -d + 0.02, MT.STEEL);
    b.box(-h + 0.04, 0.2, -d + 0.04, h - 0.04, 0.22, d - 0.04, MT.STEEL);
    [[-h + 0.04, -d + 0.04], [h - 0.04, -d + 0.04], [-h + 0.04, d - 0.04], [h - 0.04, d - 0.04]].forEach(function (c) { b.box(c[0] - 0.02, 0.03, c[1] - 0.02, c[0] + 0.02, 0.86, c[1] + 0.02, MT.STEEL); b.box(c[0] - 0.025, 0, c[1] - 0.025, c[0] + 0.025, 0.03, c[1] + 0.025, MT.RUBBER); });
    if (splash) b.box(-h, 0.9, d - 0.012, h, 1.02, d, MT.STEEL);
    satin(b);
  }); }
  // two stainless wall shelves len along x, their back at +z, at 1.45 and 1.85 m, with what a kitchen keeps on them
  function kitchenShelves(len, k) { return furn("kshelf" + len + "_" + (k % 3), function (b) {
    var h = len / 2, R = mulberry(500 + k), x;
    [1.45, 1.85].forEach(function (y, row) { b.box(-h, y, -0.36, h, y + 0.025, 0.0, MT.STEEL); [-h + 0.1, h - 0.1].forEach(function (xb) { b.box(xb - 0.01, y - 0.18, -0.02, xb + 0.01, y, 0.0, MT.STEEL); b.box(xb - 0.01, y - 0.02, -0.3, xb + 0.01, y, 0.0, MT.STEEL); });
      for (x = -h + 0.2; x < h - 0.18; ) { var kind = R(), w;
        if (kind < 0.35) { var rr = 0.11 + R() * 0.08, hh = rr * (1.1 + R()); latheOn(b, x + rr, y + 0.025, -0.18, [[0.0, 0.0], [rr, 0.0], [rr, hh], [rr - 0.008, hh], [rr - 0.008, 0.008], [0.0, 0.008]], 18, MT.STEEL, 0); w = 2 * rr + 0.05; }   // a stock pot
        else if (kind < 0.6) { var nn = 3 + Math.floor(R() * 3), rp = 0.13 + R() * 0.04; for (var j = 0; j < nn; j++) latheOn(b, x + rp, y + 0.025 + j * 0.022, -0.18, [[0.0, 0.0], [rp - 0.02, 0.0], [rp, 0.05], [rp - 0.006, 0.05], [rp - 0.024, 0.006], [0.0, 0.006]], 18, MT.STEEL, 0); w = 2 * rp + 0.06; }   // stacked pans
        else if (kind < 0.8) { var nc = b.count(); for (var j2 = 0; j2 < 3; j2++) b.box(x, y + 0.025 + j2 * 0.11, -0.3, x + 0.32, y + 0.125 + j2 * 0.11, -0.04, MT.PLASTIC); b.tag(nc, 0, null); w = 0.38; }   // lidded boxes
        else { for (var j3 = 0; j3 < 6; j3++) { var nb = b.count(); b.box(x + j3 * 0.045, y + 0.025, -0.28, x + j3 * 0.045 + 0.035, y + 0.3, -0.06, MT.PLASTIC); b.tag(nb, [0, 3, 6, 4, 2, 1][j3], null); } w = 0.32; }   // chopping boards on edge, one of each colour
        x += w;
      } });
    satin(b);
  }); }
  // the cooking island len along x, 2.0 deep: two lines back to back, each with ranges of six rings, a flat griddle and
  // two fryers on stainless cupboards, black knobs along the front, pans on the rings
  function cookingIsland(len) { return furn("cook" + len, function (b) {
    var h = len / 2, k;
    b.box(-h, 0.0, -0.98, h, 0.86, 0.98, MT.STEEL); b.box(-h - 0.02, 0.86, -1.0, h + 0.02, 0.9, 1.0, MT.STEEL);
    var np = b.count(); b.box(-h + 0.03, 0, -0.95, h - 0.03, 0.08, 0.95, MT.PLASTIC); b.tag(np, 1, null);
    [-1, 1].forEach(function (s) {
      var zf = s * 0.99;
      for (k = 0; k < Math.round(len / 0.6); k++) { var xs = -h + k * len / Math.round(len / 0.6); b.box(xs - 0.002, 0.1, zf - 0.004 * s, xs + 0.002, 0.84, zf + 0.002 * s, MT.PLASTIC); }   // the cupboards' seams
      var x0 = -h + 0.1, nk = b.count();
      for (k = 0; k < 2; k++) { var xr = x0 + k * 1.2;                                                                     // two ranges of six rings
        b.box(xr, 0.9, s * 0.1, xr + 1.15, 0.905, s * 0.92, MT.PLASTIC);
        for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) { var cx = xr + 0.2 + i * 0.37, cz = s * (0.3 + j * 0.38);
          b.geo(new THREE.TorusGeometry(0.11, 0.012, 6, 20), T(cx, 0.915, cz, Math.PI / 2, 0, 0), MT.PLASTIC);
          b.box(cx - 0.15, 0.91, cz - 0.008, cx + 0.15, 0.925, cz + 0.008, MT.PLASTIC); b.box(cx - 0.008, 0.91, cz - 0.15, cx + 0.008, 0.925, cz + 0.15, MT.PLASTIC); }
        for (i = 0; i < 6; i++) b.geo(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), T(xr + 0.12 + i * 0.18, 0.72, zf + s * 0.015, Math.PI / 2, 0, 0), MT.PLASTIC);
      }
      b.tag(nk, 1, null);
      var xg = x0 + 2.45; b.box(xg, 0.9, s * 0.1, xg + 0.95, 0.93, s * 0.92, MT.STEEL); b.box(xg, 0.93, s * 0.9, xg + 0.95, 1.02, s * 0.92, MT.STEEL);   // the griddle
      var xf = xg + 1.05; [0, 0.45].forEach(function (dx) { var nf = b.count(); b.box(xf + dx, 0.9, s * 0.25, xf + dx + 0.4, 0.905, s * 0.8, MT.PLASTIC); b.tag(nf, 1, null);   // the fryers' wells, a basket each
        b.box(xf + dx + 0.06, 0.91, s * 0.32, xf + dx + 0.34, 1.0, s * 0.72, MT.STEEL); tubeAlong(b, [V3(xf + dx + 0.2, 1.0, s * 0.72), V3(xf + dx + 0.2, 1.05, s * 0.9)], 0.008, 5, MT.PLASTIC, 1); });
    });
    // pans on the rings: a stock pot, a sauce pan, a sauté pan
    [[-h + 0.3, 0.3, 0.17, 0.3], [-h + 0.67, -0.68, 0.1, 0.12], [-h + 1.5, 0.68, 0.14, 0.07]].forEach(function (p) {
      latheOn(b, p[0], 0.925, p[1], [[0.0, 0.0], [p[2], 0.0], [p[2], p[3]], [p[2] - 0.006, p[3]], [p[2] - 0.006, 0.006], [0.0, 0.006]], 20, MT.STEEL, 0);
      if (p[3] < 0.2) tubeAlong(b, [V3(p[0] + p[2], 0.925 + p[3] * 0.8, p[1]), V3(p[0] + p[2] + 0.22, 0.925 + p[3] * 0.9, p[1])], 0.009, 5, MT.PLASTIC, 1); });
    satin(b);
  }); }
  // the canopy over the cooking island, len by dp, its underside at 0 (hung at 2.1 m): a stainless box with sloped sides,
  // baffle filters along both long sides, lights in its underside, a duct up to the ceiling (height up)
  function canopyHood(len, dp, up) { return furn("hood" + len + "_" + dp + "_" + up, function (b) {
    var h = len / 2, d = dp / 2;
    b.box(-h, 0.0, -d, h, 0.04, -d + 0.08, MT.STEEL); b.box(-h, 0.0, d - 0.08, h, 0.04, d, MT.STEEL); b.box(-h, 0.0, -d, -h + 0.08, 0.04, d, MT.STEEL); b.box(h - 0.08, 0.0, -d, h, 0.04, d, MT.STEEL);
    b.box(-h, 0.04, -d, h, 0.6, -d + 0.02, MT.STEEL); b.box(-h, 0.04, d - 0.02, h, 0.6, d, MT.STEEL); b.box(-h, 0.04, -d, -h + 0.02, 0.6, d, MT.STEEL); b.box(h - 0.02, 0.04, -d, h, 0.6, d, MT.STEEL);
    b.box(-h, 0.58, -d, h, 0.6, d, MT.STEEL);
    [-1, 1].forEach(function (s) { for (var x = -h + 0.1; x < h - 0.1; x += 0.5) { var nb = b.count(); b.geo(new THREE.BoxGeometry(0.48, 0.42, 0.02), T(x + 0.25, 0.3, s * (d - 0.25), s * 0.6, 0, 0), MT.STEEL); b.tag(nb, 0.3, null); } });   // baffle filters
    for (var xl = -h + 0.6; xl < h - 0.4; xl += 1.2) b.geo(addF2(new THREE.PlaneGeometry(0.5, 0.18), 1.2, 0.7), T(xl, 0.045, 0, Math.PI / 2, 0, 0), MT.LIGHT, 1);   // lights in its underside
    b.box(-0.3, 0.6, -0.3, 0.3, up, 0.3, MT.STEEL);
    satin(b);
  }); }
  // a double sink 1.8 along x (back at +z): two bowls, a drainer, the pre-rinse spray on its spring arm
  function doubleSink(len) { return furn("dsink" + len, function (b) {
    var h = len / 2; b.add(steelTable(len, 0.7, true), T(0, 0, 0));
    [-0.45, 0.15].forEach(function (x) { b.box(x - 0.25, 0.68, -0.25, x + 0.25, 0.9, 0.25, MT.STEEL); var nd = b.count(); b.box(x - 0.24, 0.69, -0.24, x + 0.24, 0.7, 0.24, MT.PLASTIC); b.tag(nd, 5, null); });
    tubeAlong(b, [V3(-0.15, 1.02, 0.33), V3(-0.15, 1.6, 0.33), V3(-0.15, 1.75, 0.15), V3(-0.15, 1.55, -0.05)], 0.012, 8, MT.STEEL);
    for (var k = 0; k < 9; k++) { var t = k * 0.8; tubeAlong(b, [V3(-0.15 + Math.cos(t) * 0.03, 1.2 + k * 0.035, 0.33 + Math.sin(t) * 0.03), V3(-0.15 + Math.cos(t + 0.8) * 0.03, 1.235 + k * 0.035, 0.33 + Math.sin(t + 0.8) * 0.03)], 0.004, 4, MT.STEEL); }
    satin(b);
  }); }
  // two combi ovens stacked on a stand (back at +z), 0.9 wide: dark glass doors, a control panel lit at the right
  function combiStack() { return furn("combi", function (b) {
    b.box(-0.42, 0.0, -0.35, 0.42, 0.5, 0.4, MT.STEEL);
    [0.5, 1.35].forEach(function (y) { b.box(-0.45, y, -0.4, 0.45, y + 0.82, 0.42, MT.STEEL);
      var ng = b.count(); b.box(-0.4, y + 0.06, -0.415, 0.22, y + 0.76, -0.4, MT.DKGLASS); b.tag(ng, null, null);
      var np = b.count(); b.box(0.26, y + 0.1, -0.415, 0.42, y + 0.72, -0.4, MT.PLASTIC); b.tag(np, 1, null);
      b.geo(addF2(new THREE.PlaneGeometry(0.11, 0.14), 0.9, 0.9), T(0.34, y + 0.58, -0.417, 0, Math.PI, 0), MT.LIGHT, 1);
      b.box(-0.42, y + 0.36, -0.46, -0.38, y + 0.46, -0.415, MT.STEEL); });
    satin(b);
  }); }
  // the walk-in cold room w along x, d deep (back at +z), 2.5 high: stainless panels, a heavy door with its handle and
  // hinges, a display over it
  function walkIn(w, d) { return furn("walkin" + w + "_" + d, function (b) {
    var h = w / 2; b.box(-h, 0, -d, h, 2.5, 0.0, MT.STEEL); var ns = b.count();
    for (var x = -h + 0.6; x < h - 0.1; x += 0.6) b.box(x - 0.003, 0.02, -d - 0.004, x + 0.003, 2.48, -d, MT.PLASTIC); b.tag(ns, 5, null);
    b.box(-0.45, 0.02, -d - 0.06, 0.45, 2.02, -d - 0.004, MT.STEEL); b.box(0.28, 0.9, -d - 0.13, 0.33, 1.25, -d - 0.06, MT.STEEL);
    [0.3, 1.7].forEach(function (y) { b.box(-0.48, y, -d - 0.08, -0.42, y + 0.18, -d - 0.004, MT.STEEL); });
    var nd = b.count(); b.box(-0.12, 2.15, -d - 0.02, 0.12, 2.27, -d - 0.004, MT.PLASTIC); b.tag(nd, 1, null);
    b.geo(addF2(new THREE.PlaneGeometry(0.16, 0.05), 0.8, 1.0), T(0, 2.21, -d - 0.022, 0, Math.PI, 0), MT.LIGHT, 1);
    satin(b);
  }); }
  // the dish station len along x (back at +z): an inlet table with a sink and a spray arm, a hood dishwasher, an outlet
  // table with racks of clean plates, shelves of racks over the outlet
  function dishStation() { return furn("dish", function (b) {
    b.add(steelTable(1.8, 0.7, true), T(-1.5, 0, 0)); b.box(-1.9, 0.68, -0.25, -1.3, 0.9, 0.25, MT.STEEL);
    tubeAlong(b, [V3(-1.6, 1.02, 0.33), V3(-1.6, 1.6, 0.33), V3(-1.6, 1.72, 0.18), V3(-1.6, 1.5, 0.0)], 0.012, 8, MT.STEEL);
    b.box(-0.55, 0, -0.35, 0.25, 0.9, 0.35, MT.STEEL); b.box(-0.55, 0.9, -0.35, 0.25, 1.55, 0.35, MT.STEEL);   // the dishwasher and its hood
    b.box(-0.6, 1.2, -0.36, 0.3, 1.24, -0.33, MT.STEEL); var np = b.count(); b.box(0.08, 0.6, -0.36, 0.22, 0.8, -0.35, MT.PLASTIC); b.tag(np, 1, null);
    b.add(steelTable(1.4, 0.7, true), T(1.0, 0, 0));
    for (var k = 0; k < 3; k++) { var xr = 0.6 + k * 0.42; b.box(xr - 0.2, 0.9, -0.2, xr + 0.2, 0.98, 0.2, MT.PLASTIC); b.tag(b.lastBox, 5, null);
      for (var j = 0; j < 9; j++) b.geo(new THREE.CylinderGeometry(0.13, 0.13, 0.008, 18), T(xr, 0.92 + 0.02 * 0, -0.16 + j * 0.04, Math.PI / 2, 0, 0), MT.CERAMIC); }
    b.add(kitchenShelves(1.4, 2), T(1.0, 0, 0.35));
    satin(b);
  }); }
  // the pass len along x (back at +z): a stainless counter, its top warmed; a gantry of heat lamps glowing over it, the
  // tickets on a rail, plates waiting
  function passCounter(len) { return furn("pass" + len, function (b) {
    var h = len / 2; b.add(steelTable(len, 0.8, true), T(0, 0, 0));
    [-h + 0.1, h - 0.1].forEach(function (x) { b.box(x - 0.02, 0.9, 0.3, x + 0.02, 1.62, 0.34, MT.STEEL); });
    b.box(-h + 0.08, 1.6, -0.25, h - 0.08, 1.66, 0.36, MT.STEEL);
    for (var x = -h + 0.4; x < h - 0.3; x += 0.6) { b.geo(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 14), T(x, 1.55, -0.02), MT.STEEL); b.geo(addF2(new THREE.CircleGeometry(0.055, 14), 2.6, 0.0), T(x, 1.499, -0.02, Math.PI / 2, 0, 0), MT.LIGHT, 1); }
    b.box(-h + 0.2, 1.25, 0.33, h - 0.2, 1.28, 0.36, MT.STEEL); var nt = b.count();
    for (var t = -h + 0.4; t < h - 0.4; t += 0.35) b.box(t, 1.07, 0.338, t + 0.08, 1.25, 0.34, MT.PLASTIC); b.tag(nt, 7, null);
    for (var p = -h + 0.35; p < h - 0.3; p += 0.5) latheOn(b, p, 0.9, -0.05, [[0.0, 0.0], [0.09, 0.0], [0.13, 0.02], [0.135, 0.028], [0.0, 0.012]], 20, MT.CERAMIC, 0);
    satin(b);
  }); }
  // a hand basin on the wall by the door (back at +z) with soap and a towel dispenser over it
  function handBasin() { return furn("hbasin", function (b) {
    b.box(-0.25, 0.78, -0.35, 0.25, 0.9, 0.0, MT.STEEL); b.box(-0.2, 0.8, -0.3, 0.2, 0.9, -0.05, MT.STEEL);
    tubeAlong(b, [V3(0, 1.05, -0.01), V3(0, 1.05, -0.15), V3(0, 0.98, -0.18)], 0.01, 6, MT.STEEL);
    var nd = b.count(); b.box(0.28, 1.0, -0.1, 0.4, 1.25, 0.0, MT.PLASTIC); b.box(-0.18, 1.35, -0.12, 0.18, 1.7, 0.0, MT.PLASTIC); b.tag(nd, 0, null);
    satin(b);
  }); }
  // a speed rack: a tall steel frame on castors with sheet pans in its runners
  function speedRack() { return furn("srack", function (b) {
    [[-0.25, -0.33], [0.25, -0.33], [-0.25, 0.33], [0.25, 0.33]].forEach(function (c) { b.box(c[0] - 0.012, 0.08, c[1] - 0.012, c[0] + 0.012, 1.75, c[1] + 0.012, MT.STEEL); b.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), T(c[0], 0.04, c[1], Math.PI / 2, 0, 0), MT.RUBBER); });
    for (var y = 0.25; y < 1.7; y += 0.11) b.box(-0.24, y, -0.32, 0.24, y + 0.012, 0.32, MT.STEEL);
    satin(b);
  }); }
  // the goods lift's doors in the wall (back at +z): a stainless frame, two leaves, a call panel, the floor shown over it
  function goodsLift() { return furn("glift", function (b) {
    b.box(-0.85, 0, -0.06, 0.85, 2.45, 0.0, MT.STEEL); b.box(-0.7, 0.0, -0.075, -0.005, 2.2, -0.06, MT.STEEL); b.box(0.005, 0.0, -0.075, 0.7, 2.2, -0.06, MT.STEEL);
    var nb = b.count(); b.box(0.95, 1.05, -0.03, 1.05, 1.3, 0.0, MT.PLASTIC); b.box(-0.8, 2.29, -0.077, 0.8, 2.41, -0.06, MT.PLASTIC); b.tag(nb, 1, null);
    b.geo(addF2(new THREE.CircleGeometry(0.018, 12), 1.0, 0.8), T(1.0, 1.2, -0.032, 0, Math.PI, 0), MT.LIGHT, 1);
    b.geo(addF2(new THREE.PlaneGeometry(0.3, 0.07), 0.9, 0.0), T(0, 2.35, -0.079, 0, Math.PI, 0), MT.LIGHT, 1);
    satin(b);
  }); }
  // the dry store: steel wire shelving len along x, 0.5 deep (back at +z), four shelves of boxes, sacks, tins and jars
  function dryShelving(len, k) { return furn("dry" + len + "_" + k, function (b) {
    var h = len / 2, R = mulberry(700 + k);
    [[-h + 0.02, -0.23], [h - 0.02, -0.23], [-h + 0.02, 0.23], [h - 0.02, 0.23]].forEach(function (c) { b.box(c[0] - 0.012, 0, c[1] - 0.012, c[0] + 0.012, 1.9, c[1] + 0.012, MT.STEEL); });
    [0.25, 0.7, 1.15, 1.6].forEach(function (y) { b.box(-h, y, -0.24, h, y + 0.02, 0.24, MT.STEEL);
      for (var x = -h + 0.06; x < h - 0.1; ) { var r = R(), w;
        if (r < 0.35) { var bh = 0.2 + R() * 0.15, nb = b.count(); b.box(x, y + 0.02, -0.2, x + 0.32, y + 0.02 + bh, 0.2, MT.FABRIC); b.tag(nb, 5, 0); w = 0.36; }   // a cardboard box
        else if (r < 0.6) { var ns = b.count(); softBox(b, x, y + 0.02, -0.18, x + 0.34, y + 0.2, 0.18, 0.05, MT.FABRIC, 6, null, 0); w = 0.38; }   // a sack of flour
        else if (r < 0.85) { for (var t = 0; t < 3; t++) latheOn(b, x + 0.06 + t * 0.11, y + 0.02, -0.05, [[0.0, 0.0], [0.05, 0.0], [0.05, 0.16], [0.0, 0.16]], 12, MT.STEEL, 0); w = 0.36; }   // tins
        else { var nj = b.count(); for (var t2 = 0; t2 < 2; t2++) latheOn(b, x + 0.07 + t2 * 0.14, y + 0.02, -0.05, [[0.0, 0.0], [0.06, 0.0], [0.06, 0.2], [0.045, 0.22], [0.0, 0.22]], 12, MT.PLASTIC, 0); b.tag(nj, 7, null); w = 0.3; }   // tubs
        x += w; } });
    satin(b);
  }); }
  function kitchenRoom(B, rm, F) {
    var C = CRS, y = F.y, ceil = ceilY(rm, F.floor, 55.8), rO = C.r1 - 0.12, rw = C.rc + 0.075, sg = F.sgn;
    var backR = sg > 0 ? ROT.plusA : ROT.minusA, frontR = sg > 0 ? ROT.minusA : ROT.plusA;
    function aB(s, r) { return F.back + sg * s / r; }                         // s metres along the arc from the back wall at radius r
    function aF(s, r) { return F.front - sg * s / r; }                        // and from the front wall
    // the cooking island and its canopy; the prep island toward the back wall
    var rI = 55.6, ai = F.at(F.span * 0.56, false); crsPlace(B, cookingIsland(4.8), rI, ai, y, Math.PI / 2); crsObst(rI - 2.45, rI + 2.45, ai - 1.05 / rI, ai + 1.05 / rI, F.floor);
    var Mh = crsFrame(rI, ai, y + 2.1, Math.PI / 2); B.add(canopyHood(5.2, 2.4, ceil - y - 2.1), Mh);
    [-1.6, 0, 1.6].forEach(function (x) { var p = V3(x, -0.1, 0).applyMatrix4(Mh); wLight(p.x, p.y, p.z, [0.95, 0.97, 1.0], 1.1, 4, [0, -1, 0], 1); });
    var ap = aB(2.8, rI); crsPlace(B, steelTable(3.0, 1.0, false), rI, ap, y, Math.PI / 2); crsObst(rI - 1.55, rI + 1.55, ap - 0.55 / rI, ap + 0.55 / rI, F.floor);
    // the outer wall: combi ovens, prep tables under shelves, the double sink, speed racks, the dry goods
    var rl = rO - 0.36;
    [[0.62, combiStack(), 0.9, 0, 0.43], [2.33, steelTable(2.4, 0.7, true), 2.4, 1, 0.35], [4.53, doubleSink(1.8), 1.8, 0, 0.35], [6.73, steelTable(2.4, 0.7, true), 2.4, 2, 0.35],
     [8.33, speedRack(), 0.6, 0, 0.34], [8.98, speedRack(), 0.6, 0, 0.34], [10.6, dryShelving(2.4, 1), 2.4, 0, 0.25]].forEach(function (p) {
      var rp = rO - p[4], a = aB(p[0], rp); crsPlace(B, p[1], rp, a, y, ROT["in"]); crsObst(rp - p[4] - 0.05, rO, a - (p[2] / 2 + 0.03) / rp, a + (p[2] / 2 + 0.03) / rp, F.floor);
      if (p[3]) B.add(kitchenShelves(2.4, p[3]), crsFrame(rO, a, y, ROT["in"])); });
    // the corridor wall: a hand basin by the door, the goods lift, the dry store's shelves, the walk-in cold room
    var d0 = F.doors.length ? F.doors[0] : F.back, sD = Math.abs(d0 - F.back) * C.rc;
    var ah = aB(Math.max(0.4, sD - 1.15), rw + 0.2); if (!nearDoor(F, ah, 0.25)) { crsPlace(B, handBasin(), rw, ah, y, ROT.out); crsObst(rw, rw + 0.4, ah - 0.3 / rw, ah + 0.3 / rw, F.floor); }
    var ag = aB(sD + 2.5, rw); crsPlace(B, goodsLift(), rw, ag, y, ROT.out); crsObst(rw, rw + 0.3, ag - 0.9 / rw, ag + 0.9 / rw, F.floor);
    var aw = aF(1.4, rw); crsPlace(B, walkIn(2.6, 2.4), rw, aw, y, ROT.out); crsObst(rw, rw + 2.5, aw - 1.35 / rw, aw + 1.35 / rw, F.floor);
    var asd = aB(sD + 4.6, rw + 0.3); if (Math.abs(asd - aw) * rw > 2.6) { crsPlace(B, dryShelving(2.4, 2), rw + 0.3, asd, y, ROT.out); crsObst(rw, rw + 0.6, asd - 1.25 / rw, asd + 1.25 / rw, F.floor); }
    // the dish station on the back wall; the pass on the wall to the dining hall, under its heat lamps
    var rd = 55.0, ad = aB(0.075 + 0.35, rd); crsPlace(B, dishStation(), rd, ad, y, backR); crsObst(rd - 2.5, rd + 2.5, F.back, aB(0.85, rd), F.floor);
    var rp2 = 55.1, apa = aF(0.075 + 0.4, rp2); crsPlace(B, passCounter(5.0), rp2, apa, y, frontR); crsObst(rp2 - 2.55, rp2 + 2.55, aF(0.95, rp2), F.front, F.floor);
    for (var k = 0; k < 3; k++) { var hp = crsPt(rp2 - 1.6 + k * 1.6, apa); wLight(hp.x, y + 1.4, hp.z, [1.0, 0.55, 0.3], 0.9, 2.0, [0, -1, 0], 1); }
    // the ceiling: flush light panels in two rows
    [53.0, 58.3].forEach(function (r) { for (var s = 1.6; s < F.span - 1.0; s += 2.9) { var a = aB(s, r), M = crsFrame(r, a, ceil - 0.01, 0);
      B.geo(addF2(new THREE.PlaneGeometry(1.2, 0.3), 1.3, 0.4), M.clone().multiply(T(0, 0, 0, Math.PI / 2, 0, 0)), MT.LIGHT, 1); var lp = crsPt(r, a); wLight(lp.x, ceil - 0.3, lp.z, [0.95, 0.96, 1.0], 1.9, 7, [0, -1, 0], 1); } });
    roomPlants(B, rm, F, null);
  }
