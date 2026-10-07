  /* ===================== Phase 2: the Crescent's rooms, furnished ===================== */
  // Every room of the Crescent furnished for what it is for (campus_rooms.py), with its own plants chosen in the program
  // (P2 rooms' plants). Rooms are laid out in their polar frame: the board on the radial wall away from the door, the
  // students facing it, daylight from the garden glass at their side. Furniture comes from the wings' builders where
  // they fit, new pieces below; obstacles for walking go to CRS.obst.
  function crsPlace(B, fb, r, a, y, rot) { B.add(fb, crsFrame(r, a, y, rot)); }
  function crsObst(rA, rB, aA, aB, floor) { (CRS.obst = CRS.obst || []).push([Math.min(rA, rB), Math.max(rA, rB), Math.min(aA, aB), Math.max(aA, aB), floor]); }
  function crsPic(B, r, a, y, off, n, w, h, uv, mat, g2) { wpic(B, crsFrame(r, a, y), off, "z", n, w, h, uv, mat, g2); }
  // ---- new pieces ----
  function carrel() { return furn("carrel", function (b) {                // a study carrel: desk, side and back panels, a lamp
    b.box(-0.45, 0.72, -0.4, 0.45, 0.75, 0.4, MT.WOOD); b.tag(b.count() - 24, null, 1);
    [-0.45, 0.42].forEach(function (x) { b.box(x, 0, -0.4, x + 0.03, 1.2, 0.4, MT.FABRIC); b.tag(b.count() - 24, 3, null); });
    b.box(-0.45, 0.75, 0.37, 0.45, 1.2, 0.4, MT.FABRIC); b.tag(b.count() - 24, 3, null);
    b.box(-0.42, 0, -0.38, -0.4, 0.72, 0.38, MT.STEEL); b.box(0.4, 0, -0.38, 0.42, 0.72, 0.38, MT.STEEL);
    latheOn(b, 0.28, 0.75, 0.25, [[0.06, 0], [0.06, 0.01], [0.01, 0.02], [0.01, 0.38]], 10, MT.ANOD, 0);
    b.box(0.18, 1.12, 0.12, 0.32, 1.16, 0.28, MT.ANOD); b.box(0.19, 1.115, 0.13, 0.31, 1.12, 0.27, MT.LIGHT); b.tag(b.count() - 24, 1.4, 0.2);
  }); }
  function gameTable() { return furn("gtable", function (b) {             // a square table with an inlaid chessboard
    b.box(-0.4, 0.71, -0.4, 0.4, 0.74, 0.4, MT.WOOD); b.tag(b.count() - 24, null, 2);
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { b.box(-0.28 + i * 0.07, 0.74, -0.28 + j * 0.07, -0.21 + i * 0.07, 0.743, -0.21 + j * 0.07, MT.WOOD); b.tag(b.count() - 24, null, (i + j) % 2 ? 2 : 1); }
    b.box(-0.05, 0, -0.05, 0.05, 0.71, 0.05, MT.ANOD); b.box(-0.3, 0, -0.3, 0.3, 0.03, 0.3, MT.ANOD);
  }); }
  function teamTable() { return furn("ttable", function (b) {             // a team table 1.6 x 0.9
    b.box(-0.8, 0.72, -0.45, 0.8, 0.75, 0.45, MT.WOOD); b.tag(b.count() - 24, null, 1);
    [[-0.72, -0.37], [0.72, -0.37], [-0.72, 0.37], [0.72, 0.37]].forEach(function (c) { b.box(c[0] - 0.025, 0, c[1] - 0.025, c[0] + 0.025, 0.72, c[1] + 0.025, MT.STEEL); });
  }); }
  function lockerBank(n) { return furn("lockers" + n, function (b) {      // n lockers 0.4 wide, 1.8 tall, 0.45 deep (back at +z)
    for (var k = 0; k < n; k++) { var x0 = -n * 0.2 + k * 0.4; b.box(x0 + 0.005, 0.08, -0.22, x0 + 0.395, 1.8, 0.23, MT.PLASTIC); b.tag(b.count() - 24, [3, 5, 0][k % 3], null);
      b.box(x0 + 0.3, 1.0, -0.235, x0 + 0.33, 1.12, -0.22, MT.STEEL); b.box(x0 + 0.08, 1.6, -0.226, x0 + 0.32, 1.62, -0.22, MT.ANOD); }
    b.box(-n * 0.2, 0, -0.2, n * 0.2, 0.08, 0.23, MT.ANOD);
  }); }
  function wcRow(n) { return furn("wc" + n, function (b) {                 // n cubicles 1.0 wide, 1.5 deep (doors at -z), partitions and pans
    for (var k = 0; k <= n; k++) { var x = -n * 0.5 + k; b.box(x - 0.012, 0.15, -1.5, x + 0.012, 2.1, 0, MT.PLASTIC); b.tag(b.count() - 24, 5, null); }
    for (k = 0; k < n; k++) { var x0 = -n * 0.5 + k; b.box(x0 + 0.06, 0.15, -1.52, x0 + 0.94, 2.05, -1.5, MT.PLASTIC); b.tag(b.count() - 24, 5, null);
      b.box(x0 + 0.82, 1.0, -1.545, x0 + 0.88, 1.04, -1.52, MT.STEEL);
      latheOn(b, x0 + 0.5, 0, -0.35, [[0.15, 0], [0.19, 0.25], [0.2, 0.4], [0.17, 0.42], [0.0, 0.42]], 16, MT.CERAMIC, 0); b.box(x0 + 0.3, 0.42, -0.08, x0 + 0.7, 0.85, 0, MT.CERAMIC); }
  }); }
  function basinCounter(len) { return furn("basins" + len, function (b) { // a stone counter with basins and a mirror above (back at +z)
    b.box(-len / 2, 0.82, -0.28, len / 2, 0.86, 0.28, MT.TERRAZZO); b.box(-len / 2, 0.6, 0.22, len / 2, 0.82, 0.28, MT.TERRAZZO);
    for (var k = 0; k < Math.round(len / 0.9); k++) { var x = -len / 2 + 0.45 + k * 0.9; latheOn(b, x, 0.74, 0, [[0.0, 0], [0.14, 0.02], [0.2, 0.12], [0.21, 0.13]], 18, MT.CERAMIC, 0);
      latheOn(b, x, 0.86, 0.2, [[0.02, 0], [0.02, 0.22]], 8, MT.STEEL, 0); b.box(x - 0.012, 1.06, 0.06, x + 0.012, 1.08, 0.22, MT.STEEL); }
    b.box(-len / 2, 1.05, 0.27, len / 2, 2.0, 0.28, MT.DKGLASS);
  }); }
  function kitchenette() { return furn("kitchen", function (b) {         // 2.4 m of counter with cupboards and a sink (back at +z)
    b.box(-1.2, 0.1, -0.3, 1.2, 0.88, 0.3, MT.PLASTIC); b.tag(b.count() - 24, 0, null); b.box(-1.21, 0.88, -0.31, 1.21, 0.92, 0.31, MT.TERRAZZO);
    b.box(-1.2, 1.45, -0.05, 1.2, 2.15, 0.3, MT.PLASTIC); b.tag(b.count() - 24, 0, null); b.box(-1.2, 0, -0.27, 1.2, 0.1, 0.3, MT.ANOD);
    b.box(0.3, 0.86, -0.22, 0.75, 0.921, 0.12, MT.STEEL); latheOn(b, 0.52, 0.92, 0.2, [[0.015, 0], [0.015, 0.3]], 8, MT.STEEL, 0);
    for (var k = 0; k < 4; k++) b.box(-1.18 + k * 0.6, 0.45, -0.312, -0.62 + k * 0.6, 0.47, -0.3, MT.STEEL);
  }); }
  function platonicSet() { return furn("platonic", function (b) {         // the five solids on a low shelf (Euclid)
    b.box(-0.9, 0, -0.18, 0.9, 0.9, 0.18, MT.WOOD); b.tag(b.count() - 24, null, 1);
    [new THREE.TetrahedronGeometry(0.11), new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.OctahedronGeometry(0.11), new THREE.DodecahedronGeometry(0.1), new THREE.IcosahedronGeometry(0.11)].forEach(function (g, k) {
      b.geo(addF2(g, 0, 7), T(-0.68 + k * 0.34, 1.02, 0, 0.3 * k, 0.7 * k, 0.2), MT.BRASS); });
  }); }
  function spiralWall(w, h) { return furn("spiral" + w, function (b) {    // a golden spiral in brass on squares of Fibonacci sizes (Fibonacci)
    var F = [1, 1, 2, 3, 5, 8, 13], s = h / 21, x = 0, y = 0, dir = 0, rects = [], pts = [];
    var bx = [[0, 0]], cx = 0, cy = 0; for (var k = 0; k < F.length; k++) {
      var f = F[k] * s; rects.push([cx, cy, f]);
      for (var t = 0; t <= 8; t++) { var a = dir * Math.PI / 2 + Math.PI / 2 * t / 8, ox = [[f, 0], [0, f], [0, 0], [f, 0]][dir % 4], oy = [[0, 0], [f, 0], [f, f], [0, f]][dir % 4];
        pts.push(new THREE.Vector3(0.012, 0, 0)); }
      dir++;
    }
    // squares as thin frames, the spiral as a tube of quarter arcs
    var sq = [[0, 0, 1], [1, 0, 1], [0, 1, 2], [-2, 0, 3], [-2, -3, 5], [1, -3, 8], [-2, 2, 13]];
    sq.forEach(function (q, i) { var x0 = q[0] * s, y0 = q[1] * s, f = q[2] * s; [[x0, y0, x0 + f, y0 + 0.01], [x0, y0 + f - 0.01, x0 + f, y0 + f], [x0, y0, x0 + 0.01, y0 + f], [x0 + f - 0.01, y0, x0 + f, y0 + f]].forEach(function (e) { b.box(0, e[1], e[0], 0.008, e[3], e[2], MT.ANOD); }); });
    var arcs = [[1, 1, 1, 180, 270], [1, 1, 1, 270, 360], [1, 0, 2, 0, 90], [0, 0, 3, 90, 180], [0, 0, 5, 180, 270], [1, 0, 8, 270, 360], [1, 2, 13, 0, 90]], sp = [];
    var c = [[1, 1], [1, 1], [0, 1], [0, 0], [0, 0], [1, 0], [1, 0]];
    var cs = [[1, 1], [1, 1], [0, 1], [0, 1], [0, -2], [1, -2], [1, 2]];
    // a log spiral close to the golden one, drawn directly
    for (var k2 = 0; k2 <= 120; k2++) { var th = k2 / 120 * 3.6 * Math.PI, rr = s * 0.25 * Math.pow(1.618, th / (Math.PI / 2)); sp.push(new THREE.Vector3(0.015, s * 0.5 + rr * Math.sin(th) * 0.95, s * 0.6 + rr * Math.cos(th) * 0.95)); }
    tubeAlong(b, sp, 0.012, 6, MT.BRASS);
  }); }
  function tilingWall(w, h) { return furn("tiling" + w, function (b) {    // a wall of hexagons and triangles in three colours (Noether: symmetry)
    var R = 0.18, cols = [3, 4, 0];
    for (var i = 0; i < Math.floor(w / (R * 1.75)); i++) for (var j = 0; j < Math.floor(h / (R * 1.5)); j++) {
      var cz = -w / 2 + R + i * R * 1.75 + (j % 2) * R * 0.87, cy = R + j * R * 1.5, n0 = b.count();
      b.geo(new THREE.CylinderGeometry(R * 0.96, R * 0.96, 0.02, 6), T(0.01, cy, cz, 0, 0, Math.PI / 2), MT.PLASTIC); b.tag(n0, cols[(i + j * 2) % 3], null);
    }
  }); }
  function scoreboard() { return furn("score", function (b) {             // a framed screen 2.4 x 1.35 (the picture is added on it)
    b.box(-0.06, -0.72, -1.25, 0, 0.72, 1.25, MT.ANOD);
  }); }
  function stagePlatform(w, d) { return furn("stage" + w, function (b) {  // a low timber platform with a lectern
    b.box(-d / 2, 0, -w / 2, d / 2, 0.3, w / 2, MT.WOOD); b.tag(b.count() - 24, null, 1);
    b.box(-0.25, 0.3, -0.3, 0.15, 1.42, 0.3, MT.WOOD); b.tag(b.count() - 24, null, 2); b.box(-0.3, 1.38, -0.34, 0.2, 1.42, 0.34, MT.WOOD);
  }); }
  function coffeeTable(len) { return furn("ctable" + len, function (b) {
    b.box(-len / 2, 0.36, -0.3, len / 2, 0.4, 0.3, MT.WOOD); b.tag(b.count() - 24, null, 2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { b.box(c[0] * (len / 2 - 0.06) - 0.02, 0, c[1] * 0.24 - 0.02, c[0] * (len / 2 - 0.06) + 0.02, 0.36, c[1] * 0.24 + 0.02, MT.STEEL); });
  }); }

  function cubeWall(w, h) { return furn("cubes" + w, function (b) {      // a wall of Rubik's cube faces: 3 x 3 stickers on black tiles (games room)
    var cols = [[0.86, 0.1, 0.08], [0.95, 0.5, 0.05], [0.95, 0.85, 0.1], [0.05, 0.55, 0.25], [0.06, 0.25, 0.75], [0.95, 0.95, 0.92]], R = mulberry(77);
    for (var i = 0; i < Math.floor(w / 0.36); i++) for (var j = 0; j < Math.floor(h / 0.36); j++) {
      var cz = -w / 2 + 0.18 + i * 0.36, cy = 0.18 + j * 0.36; b.box(0, cy - 0.17, cz - 0.17, 0.015, cy + 0.17, cz + 0.17, MT.PLASTIC); b.tag(b.count() - 24, 1, null);
      for (var u = -1; u <= 1; u++) for (var v = -1; v <= 1; v++) { var n0 = b.count(), c = Math.floor(R() * 6); b.box(0.015, cy + v * 0.105 - 0.048, cz + u * 0.105 - 0.048, 0.022, cy + v * 0.105 + 0.048, cz + u * 0.105 + 0.048, MT.PLASTIC); b.tag(n0, [0, 4, 2, 7, 3, 6][c], null); }
    }
  }); }
  function planter(len) { return furn("planter" + len, function (b) {    // a long concrete trough 0.9 deep, 0.55 tall, the soil 5 cm below its rim (along x)
    var x0 = -len / 2, x1 = len / 2, t = 0.08;
    b.box(x0, 0, -0.45, x1, 0.55, -0.45 + t, MT.CONCRETE); b.box(x0, 0, 0.45 - t, x1, 0.55, 0.45, MT.CONCRETE); b.box(x0, 0, -0.45 + t, x0 + t, 0.55, 0.45 - t, MT.CONCRETE); b.box(x1 - t, 0, -0.45 + t, x1, 0.55, 0.45 - t, MT.CONCRETE);
    b.box(x0 + t, 0, -0.45 + t, x1 - t, 0.5, 0.45 - t, MT.RUBBER);
  }); }
  function bottleFiller() { return furn("filler", function (b) {           // a stainless bottle filler over a drinking fountain, on a wall (back at z = 0, facing -z)
    b.box(-0.24, 1.0, -0.13, 0.24, 1.98, 0, MT.STEEL);                      // the filler
    b.box(-0.17, 1.14, -0.135, 0.17, 1.6, -0.125, MT.ANOD);                 // its dark recess
    b.box(-0.03, 1.55, -0.2, 0.03, 1.6, -0.12, MT.STEEL);                   // the spout
    b.box(-0.26, 0.8, -0.46, 0.26, 1.0, 0, MT.STEEL);                       // the fountain
    b.box(-0.2, 0.995, -0.41, 0.2, 1.006, -0.06, MT.ANOD);                  // its basin
    b.box(-0.02, 1.0, -0.13, 0.02, 1.08, -0.09, MT.STEEL);                  // the bubbler
  }); }
  function gardenBench(len) { return furn("gbench" + len, function (b) {  // oak slats on two stone blocks (along x)
    for (var k = 0; k < 5; k++) { b.box(-len / 2, 0.43, -0.25 + k * 0.1, len / 2, 0.47, -0.17 + k * 0.1, MT.WOOD); b.tag(b.count() - 24, null, 2); }
    [-len / 2 + 0.35, len / 2 - 0.35].forEach(function (x) { b.box(x - 0.2, 0, -0.24, x + 0.2, 0.43, 0.24, MT.CONCRETE); });
  }); }
  function rugAt(B, r, a, y, lw, ld, g2) {                                  // a flat rug lw along the arc, ld across, at (r, a)
    var M = crsFrame(r, a, y + 0.008), rb = new Builder(); rb.box(-lw / 2, 0, -ld / 2, lw / 2, 0.012, ld / 2, MT.FABRIC); rb.tag(0, g2, null); B.add(rb, M);
  }

  // ---- a room's frame: its angles, the front (board) side, the floor's height ----
  // Local frames (crsFrame): x along increasing a, z outward. Pieces with a back at +z (sofas, shelves, counters) face
  // inward at rot 0, outward at PI, +a at -PI/2, -a at PI/2; desks and chairs face +a at rot 0.
  var ROT = { "in": 0, out: Math.PI, plusA: -Math.PI / 2, minusA: Math.PI / 2 };
  function roomFrame(rm) {
    var C = CRS, a0 = rmA0(rm), a1 = rmA1(rm), y = rm.floor === "lower" ? C.yL : C.yU, mid = (a0 + a1) / 2, eastSide = mid >= 0;
    // the hall is at the room's inner end: the board goes on the wall at the far end, the students face it
    var front = eastSide ? a1 : a0, back = eastSide ? a0 : a1, sgn = eastSide ? 1 : -1, rM = (C.rc + C.r1) / 2;
    return { a0: a0, a1: a1, y: y, mid: mid, front: front, back: back, sgn: sgn, rM: rM, span: (a1 - a0) * rM, floor: rm.floor,
             at: function (dist, fromFront) { return fromFront ? front - sgn * dist / rM : back + sgn * dist / rM; } };
  }
  function boardOn(B, F, w, uv, mat, g2, onBack) {                          // a board on the front (or the back) wall, centred
    var rM = F.rM, wall = onBack ? F.back : F.front, s = onBack ? -F.sgn : F.sgn, wa = wall - s * 0.09 / rM;
    var fr = new Builder(); fr.box(-0.03, -0.62, -w / 2 - 0.05, 0.0, 0.62, w / 2 + 0.05, MT.ANOD); fr.box(-0.1, -0.66, -w / 2 + 0.1, 0.0, -0.63, w / 2 - 0.1, MT.ANOD);
    crsPlace(B, fr, rM, wa, F.y + 1.5, s > 0 ? 0 : Math.PI);
    crsPic(B, rM, wa, F.y + 1.5, [-0.034 * s, 0, 0], [-s, 0], w, 1.2, uv, mat, g2);
    var wl = crsPt(rM, wall - s * 1.2 / rM); wLight(wl.x, F.y + 2.8, wl.z, LAMPC, 1.2, 4, [0, -0.4, 0], 1);
  }
  function screenOn(B, F, w, h, uv) {
    var rM = F.rM, wa = F.front - F.sgn * 0.08 / rM;
    crsPlace(B, scoreboard(), rM, wa, F.y + 1.75, F.sgn > 0 ? 0 : Math.PI);
    crsPic(B, rM, wa, F.y + 1.75, [-0.064 * F.sgn, 0, 0], [-F.sgn, 0], w, h, uv, MT.SCREEN, [1.0, 0]);
    var sl = crsPt(rM, F.front - F.sgn * 1.0 / rM); wLight(sl.x, F.y + 1.7, sl.z, [0.75, 0.85, 1.0], 0.7, 5);
  }
  function shelvesOnCorridor(B, F, n, fromDist) {                           // bookshelves along the corridor wall, from a distance from the back wall
    var C = CRS, r = C.rc + 0.27, half = 0.45 / r;
    for (var k = 0; k < n; k++) { var a = F.back + F.sgn * (fromDist + k * 0.9 + 0.45) / r; crsPlace(B, bookshelf(), r, a, F.y, ROT.out); crsObst(r - 0.2, r + 0.4, a - half, a + half, F.floor); }
  }
  // the plants chosen for the room, at their spots
  function roomPlants(B, rm, F, deskAt) {
    var C = CRS, i = 0;
    (rm.plants || []).forEach(function (pl) {
      var kind = pl[0], spot = pl[1], r, a, y = F.y, seed = 60 + Math.round(F.mid * 100) + i++;
      if (spot === "window0") { r = C.r1 - 0.75; a = F.a0 + 0.85 / r; } else if (spot === "window1") { r = C.r1 - 0.75; a = F.a1 - 0.85 / r; }
      else if (spot === "windowmid") { r = C.r1 - 0.75; a = F.at(F.span * 0.72, true); } else if (spot === "corner0") { r = C.rc + 0.7; a = F.a0 + 0.75 / r; } else if (spot === "corner1") { r = C.rc + 0.7; a = F.a1 - 0.75 / r; }
      else if (spot === "door") { var d = (rm.doors && rm.doors[0]) || F.mid; r = C.rc + 0.6; a = d + (d > F.mid ? -1 : 1) * 1.05 / r; }
      else if (spot === "desk" && deskAt) { r = deskAt[0]; a = deskAt[1]; y = F.y + deskAt[2]; }
      else if (spot === "shelf") { r = C.rc + 0.3; a = F.back + F.sgn * 0.5 / (C.rc + 0.3); y = F.y + 1.8; }
      else { r = C.r1 - 0.75; a = F.mid; }
      crsPlace(B, plantBuilder(kind, seed), r, a, y, seed * 0.7);
      if (y === F.y) crsObst(r - 0.4, r + 0.4, a - 0.4 / r, a + 0.4 / r, F.floor);
    });
  }

  // ---- the rooms ----
  function classroom(B, rm, F, theme) {
    var C = CRS, CR = mulberry(Math.round(F.mid * 1000) + 7), big = F.span > 15, cols = [52.4, 55.9, 59.4];
    var rows = big ? [3.4, 5.2, 7.0, 8.8, 10.6] : [3.0, 4.8, 6.6, 8.4], faceRot = F.sgn > 0 ? 0 : Math.PI;
    rows.forEach(function (d, ri) { cols.forEach(function (r, ci) {
      var a = F.at(d, true), k = (ri * 3 + ci) % 3;
      if (theme === "gauss") crsPlace(B, labDesk(), r, a, F.y, faceRot); else crsPlace(B, studentDesk(k), r, a, F.y, faceRot);
      crsObst(r - 0.72, r + 0.72, a - 0.33 / r, a + 0.33 / r, F.floor);
      [-0.35, 0.35].forEach(function (dz) { var out = CR() * 0.12, turn = (CR() - 0.5) * 0.35, ac = a - F.sgn * (0.6 + out) / r;
        crsPlace(B, theme === "gauss" ? officeChair() : schoolChair(CR() < 0.7 ? 5 : [0, 3, 2][Math.floor(CR() * 3)]), r + dz, ac, F.y, faceRot + turn);
        if (CR() < 0.25) crsPlace(B, backpack(CR() < 0.5 ? 1 : 3), r + dz + (dz > 0 ? 0.42 : -0.42), a - F.sgn * 0.3 / r, F.y, CR() * 3); });
    }); });
    var td = F.at(1.7, true), rt = 59.2;                                     // the teacher's desk by the window, facing the class
    crsPlace(B, teacherDesk(), rt, td, F.y, F.sgn > 0 ? Math.PI : 0); crsObst(rt - 0.85, rt + 0.85, td - 0.42 / rt, td + 0.42 / rt, F.floor);
    crsPlace(B, officeChair(), rt + 0.2, F.at(1.05, true), F.y, F.sgn > 0 ? Math.PI : 0);
    if (theme === "gauss") screenOn(B, F, 2.66, 1.5, ATL.scrLab);
    else boardOn(B, F, big ? 4.2 : 3.4, ATL.wb, MT.ATLAS, [0, 2]);
    if (theme === "hypatia") boardOn(B, F, 3.4, ATL.wb, MT.ATLAS, [0, 2], true);
    shelvesOnCorridor(B, F, 4, 2.6);
    // the back of the big rooms: a reading corner by the window (a long sofa facing in, a rug, a low table)
    if (big && theme !== "hypatia") {
      var ra = F.at(F.span - 14.2 > 0 ? 2.6 : 2.2, false), rs = C.r1 - 1.0;
      rugAt(B, rs - 1.25, ra, F.y, 3.6, 2.6, 3); crsPlace(B, sofa(3, 3.0), rs, ra, F.y, ROT["in"]); crsPlace(B, coffeeTable(1.4), rs - 1.35, ra, F.y, 0);
      crsObst(rs - 1.9, rs + 0.55, ra - 1.6 / rs, ra + 1.6 / rs, F.floor);
    }
    // the room's own thing, on the back wall or by it
    var bk = F.back + F.sgn * 0.07 / F.rM;
    if (theme === "euclid") { var pa = F.at(1.0, false); crsPlace(B, platonicSet(), C.rc + 2.4, pa, F.y, F.sgn > 0 ? ROT.plusA : ROT.minusA); crsObst(C.rc + 1.4, C.rc + 3.4, pa - 0.3 / 52, pa + 0.3 / 52, F.floor); }
    if (theme === "fibonacci") crsPlace(B, spiralWall(3.0, 2.1), 54.4, bk, F.y + 0.6, F.sgn > 0 ? 0 : Math.PI);
    if (theme === "noether") crsPlace(B, tilingWall(4.6, 2.3), 54.4, bk, F.y + 0.5, F.sgn > 0 ? 0 : Math.PI);
    roomPlants(B, rm, F, [rt, td + F.sgn * 0.15 / rt, 0.77]);
  }
  function studyHall(B, rm, F) {
    var C = CRS, n = 0, cols = [52.2, 54.7, 57.2, 59.7];
    for (var d = 2.2; d < F.span - 1.8 && n < 40; d += 1.45) cols.forEach(function (r) {
      if (n >= 40) return; var a = F.at(d, false);
      crsPlace(B, carrel(), r, a, F.y, F.sgn > 0 ? -Math.PI / 2 : Math.PI / 2);                 // the reader faces away from the back wall
      crsPlace(B, schoolChair(5), r, a - F.sgn * 0.62 / r, F.y, F.sgn > 0 ? 0 : Math.PI); crsObst(r - 0.48, r + 0.48, a - 0.45 / r, a + 0.45 / r, F.floor); n++; });
    var la = F.at(1.2, true); crsPlace(B, teacherDesk(), C.rc + 1.5, la, F.y, F.sgn > 0 ? Math.PI : 0); crsObst(C.rc + 0.65, C.rc + 2.35, la - 0.42 / 51, la + 0.42 / 51, F.floor);
    shelvesOnCorridor(B, F, 12, 1.4);
    roomPlants(B, rm, F, [C.rc + 1.5, la, 0.77]);
  }
  function competitionRoom(B, rm, F) {
    var C = CRS;
    [3.8, 6.8, 9.8, 12.8, 15.8].forEach(function (d) { [53.4, 58.4].forEach(function (r) {
      var a = F.at(d, true); crsPlace(B, teamTable(), r, a, F.y, Math.PI / 2); crsObst(r - 0.9, r + 0.9, a - 0.5 / r, a + 0.5 / r, F.floor);
      [[-0.45, -0.62], [0.45, -0.62], [-0.45, 0.62], [0.45, 0.62]].forEach(function (c) { crsPlace(B, officeChair(), r + c[0], a + c[1] / r, F.y, c[1] > 0 ? Math.PI : 0); });
    }); });
    var st = F.at(1.3, true); crsPlace(B, stagePlatform(4.4, 1.8), 55.9, st, F.y, F.sgn > 0 ? 0 : Math.PI); crsObst(53.6, 58.2, st - 0.9 / 55.9, st + 0.9 / 55.9, F.floor);
    screenOn(B, F, 2.4, 1.35, ATL.scrSem);
    roomPlants(B, rm, F, null);
  }
  function gamesLounge(B, rm, F) {
    var C = CRS;
    [[52.4, 2.4], [55.0, 2.4], [52.4, 5.0], [55.0, 5.0], [52.4, 7.6]].forEach(function (g) { var a = F.at(g[1], false); crsPlace(B, gameTable(), g[0], a, F.y, 0); crsObst(g[0] - 0.75, g[0] + 0.75, a - 0.75 / g[0], a + 0.75 / g[0], F.floor);
      [-0.7, 0.7].forEach(function (dz) { crsPlace(B, diningChair(2), g[0] + dz, a, F.y, dz > 0 ? Math.PI / 2 : -Math.PI / 2); }); });
    shelvesOnCorridor(B, F, 5, 0.6);
    crsPlace(B, cubeWall(3.6, 2.2), 54.6, F.back + F.sgn * 0.07 / F.rM, F.y + 0.5, F.sgn > 0 ? 0 : Math.PI);
    // the lounge by the glass: two long sofas facing each other over a low table and a rug
    var la = F.at(F.span * 0.66, false), rA = C.r1 - 1.0, rB = C.r1 - 4.0;
    rugAt(B, (rA + rB) / 2, la, F.y, 3.8, 2.6, 2);
    crsPlace(B, sofa(1, 3.0), rA, la, F.y, ROT["in"]); crsPlace(B, sofa(0, 3.0), rB, la, F.y, ROT.out);
    crsPlace(B, coffeeTable(1.6), (rA + rB) / 2, la, F.y, 0); crsObst(rB - 0.55, rA + 0.55, la - 1.6 / 58, la + 1.6 / 58, F.floor);
    var ea = F.at(F.span * 0.9, false); crsPlace(B, kitchenette(), C.rc + 0.42, ea, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.8, ea - 1.25 / 50, ea + 1.25 / 50, F.floor);
    crsPlace(B, espressoMachine(), C.rc + 0.36, ea, F.y + 0.92, ROT.out);
    roomPlants(B, rm, F, [(rA + rB) / 2, la, 0.4]);
  }
  function teachersRoom(B, rm, F) {
    var C = CRS;
    [1.6, 3.6, 5.6].forEach(function (d) { var a = F.at(d, false); crsPlace(B, teacherDesk(), C.r1 - 1.0, a, F.y, -Math.PI / 2); crsPlace(B, officeChair(), C.r1 - 1.75, a, F.y, -Math.PI / 2); crsObst(C.r1 - 1.65, C.r1 - 0.4, a - 0.85 / 60, a + 0.85 / 60, F.floor); });
    var ma = F.at(3.6, false); crsPlace(B, teamTable(), 55.4, ma, F.y, Math.PI / 2); crsObst(54.6, 56.2, ma - 0.5 / 55, ma + 0.5 / 55, F.floor);
    [[-0.45, -0.62], [0.45, -0.62], [-0.45, 0.62], [0.45, 0.62]].forEach(function (c) { crsPlace(B, officeChair(), 55.4 + c[0], ma + c[1] / 55, F.y, c[1] > 0 ? Math.PI : 0); });
    var ka = F.at(4.8, false); crsPlace(B, kitchenette(), C.rc + 0.42, ka, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.8, ka - 1.25 / 50, ka + 1.25 / 50, F.floor);
    crsPlace(B, espressoMachine(), C.rc + 0.36, F.at(4.0, false), F.y + 0.92, ROT.out);
    crsPlace(B, lockerBank(4), C.rc + 0.36, F.at(1.5, false), F.y, ROT.out);
    var sa = F.at(F.span - 1.6, false); crsPlace(B, sofa(2, 2.8), 53.0, sa, F.y, F.sgn > 0 ? ROT.minusA : ROT.plusA); crsObst(51.5, 54.5, sa - 0.5 / 53, sa + 0.5 / 53, F.floor);
    roomPlants(B, rm, F, [55.4, ma, 0.77]);
  }
  function computerRoom(B, rm, F) {
    var C = CRS, k = 0;
    [1.8, 3.6, 5.4, 7.2].forEach(function (d) { var a = F.at(d, true); [53.2, 57.8].forEach(function (r) {
      crsPlace(B, labDesk(), r, a, F.y, F.sgn > 0 ? 0 : Math.PI); crsObst(r - 1.95, r + 1.95, a - 0.38 / r, a + 0.38 / r, F.floor);
      [-1.2, 0, 1.2].forEach(function (dz) { crsPlace(B, officeChair(), r + dz, a - F.sgn * 0.75 / r, F.y, F.sgn > 0 ? 0 : Math.PI);
        wpic(B, crsFrame(r, a, F.y, F.sgn > 0 ? 0 : Math.PI), [0.097, 1.17, dz], "z", [-1, 0], 0.6, 0.345, ATL["code" + (k++ % 3)], MT.SCREEN, [1.0, 0]); });
    }); });
    screenOn(B, F, 2.4, 1.35, ATL.scrLab);
    roomPlants(B, rm, F, [57.8, F.at(1.8, true), 0.77]);
  }
  function washrooms(B, rm, F, store) {
    var C = CRS;
    crsPlace(B, wcRow(store ? 4 : 5), C.r1 - 0.25, F.mid, F.y, ROT["in"]); crsObst(C.r1 - 1.85, C.r1, F.a0, F.a1, F.floor);
    crsPlace(B, basinCounter(3.6), C.rc + 0.45, F.mid, F.y, ROT.out); crsObst(C.rc, C.rc + 0.8, F.mid - 1.85 / 50, F.mid + 1.85 / 50, F.floor);
    if (store) { var sa = F.at(0.6, false); for (var k = 0; k < 3; k++) crsPlace(B, bookshelf(), 54.0 + k * 0.95, sa, F.y, F.sgn > 0 ? ROT.plusA : ROT.minusA); crsObst(53.4, 56.8, sa - 0.3 / 55, sa + 0.3 / 55, F.floor); }
    if ((P2.ring.fountains || []).indexOf(rm.code) >= 0 && rm.doors && rm.doors.length) {   // a bottle filler on the corridor wall beside the door
      var d = rm.doors[0], sd = F.mid > d ? 1 : -1, rf = C.rc - C.wall / 2, af = d + sd * 1.15 / rf;
      crsPlace(B, bottleFiller(), rf, af, F.y, ROT["in"]); crsObst(rf - 0.5, rf, af - 0.3 / rf, af + 0.3 / rf, F.floor);
    }
    roomPlants(B, rm, F, null);
  }
  function hallRoom(B, rm, F) {
    var C = CRS;
    if (rm.floor === "upper") {                                             // the timetable on the hall's west wall by the landing
      var sa = -C.hallA + 0.1 / 50.4; crsPlace(B, scoreboard(), 50.4, sa, F.y + 1.75, Math.PI); crsPic(B, 50.4, sa, F.y + 1.75, [0.064, 0, 0], [1, 0], 2.4, 1.35, ATL.scrLobby, MT.SCREEN, [1.1, 0]);
      [-4.3, 4.3].forEach(function (d) { var ab = d * D2R, rb = C.r0 + 0.5; crsPlace(B, gardenBench(2.4), rb, ab, F.y, 0); crsObst(rb - 0.3, rb + 0.3, ab - 1.25 / rb, ab + 1.25 / rb, F.floor); });   // two long benches by the garden glass
      roomPlants(B, rm, F, null); return;
    }
    // below, on the side away from the stair and clear of the door to the gallery: a seating group sized to the hall,
    // two long sofas facing each other over a low table and a rug, an armchair at each end; tall plants by the side wall
    var ba = -3.8 * D2R, rS = C.r1 - 1.0, rT = 59.1, rB = 57.2;
    rugAt(B, rT, ba, F.y, 5.4, 4.6, 3);
    crsPlace(B, sofa(1, 3.8), rS, ba, F.y, ROT["in"]); crsObst(rS - 0.55, rS + 0.55, ba - 2.0 / rS, ba + 2.0 / rS, F.floor);
    crsPlace(B, sofa(1, 3.8), rB, ba, F.y, ROT.out); crsObst(rB - 0.55, rB + 0.55, ba - 2.0 / rB, ba + 2.0 / rB, F.floor);
    crsPlace(B, coffeeTable(2.0), rT, ba, F.y, 0); crsObst(rT - 0.4, rT + 0.4, ba - 1.1 / rT, ba + 1.1 / rT, F.floor);
    [[-2.75, ROT.plusA], [2.75, ROT.minusA]].forEach(function (e) { var aa = ba + e[0] / rT; crsPlace(B, armchair(), rT, aa, F.y, e[1]); crsObst(rT - 0.5, rT + 0.5, aa - 0.5 / rT, aa + 0.5 / rT, F.floor); });
    [["fig", 52.6], ["kentia", 55.2]].forEach(function (t, i) { var aa = -6.25 * D2R; crsPlace(B, plantBuilder(t[0], 911 + i), t[1], aa, F.y, i * 2.1); crsObst(t[1] - 0.45, t[1] + 0.45, aa - 0.45 / t[1], aa + 0.45 / t[1], F.floor); });
    roomPlants(B, rm, F, null);
  }
  function crescentFurnish(W) {
    var C = CRS; W.zone = ZONE.WING;
    C.rooms.forEach(function (rm) {
      if (rm.band || isBay(rm)) return;
      var F = roomFrame(rm);
      var th = { "T06-02": "euclid", "T06-03": "hypatia", "T06-05": "fibonacci", "T06-06": "noether", "T06-10": "gauss" }[rm.code];
      if (rm.code === "T06-01" || rm.code === "T06-08") hallRoom(W, rm, F);
      else if (rm.code === "T06-35") underGate(W, rm, F);
      else if (rm.code === "T06-28") lockerRoom(W, rm, F);
      else if (RING_FURNISH[rm.kind]) RING_FURNISH[rm.kind](W, rm, F);
      else if (rm.kind === "class") classroom(W, rm, F, th);
      else if (rm.kind === "study") studyHall(W, rm, F);
      else if (rm.kind === "compete") competitionRoom(W, rm, F);
      else if (rm.kind === "games") gamesLounge(W, rm, F);
      else if (rm.kind === "staff") teachersRoom(W, rm, F);
      else if (rm.kind === "lab") computerRoom(W, rm, F);
      else if (rm.kind === "service") washrooms(W, rm, F, rm.code === "T06-14" || rm.code === "T06-31");
    });
    W.zone = ZONE.OUT;
  }
  // the garden gallery: long planters along the stone wall with plants of every kind, oak benches between them facing the glass
  function crescentGalleryFurnish(B) {
    var C = CRS, G = C.gal, rP = G.r1 - 0.85, rB = G.r1 - 1.9, kinds = ["kentia", "strelitzia", "fern", "monstera", "maple", "olive", "agave", "bromeliad", "croton", "fig", "anthurium", "ficus"], n = 0;
    var doorsA = (C.doors || []).filter(function (d) { return Math.abs(d.r - C.r1) < 0.01; }).map(function (d) { return d.a; });
    for (var a = G.a0 + 3.0 / rP; a < G.a1 - 3.0 / rP; a += 8.0 / rP) {
      crsPlace(B, planter(5.0), rP, a, C.yL, 0); crsObst(rP - 0.5, rP + 0.5, a - 2.55 / rP, a + 2.55 / rP, "gallery");
      for (var k = 0; k < 3; k++) { var kind = kinds[n++ % kinds.length], pa = a + (-1.6 + 1.6 * k) / rP; bedPlant(B, kind, 300 + n, crsFrame(rP, pa, C.yL, n * 1.3), 0.5, 1.7); }   // big plants set into the troughs
      var ba = a + 4.0 / rP; if (ba < G.a1 - 2.0 / rB && !doorsA.some(function (d) { return Math.abs(d - ba) * C.r1 < 2.2; })) { crsPlace(B, gardenBench(2.4), rB, ba, C.yL, ROT["in"]); crsObst(rB - 0.3, rB + 0.3, ba - 1.25 / rB, ba + 1.25 / rB, "gallery"); }
    }
  }
