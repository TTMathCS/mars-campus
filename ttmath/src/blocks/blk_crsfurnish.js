  /* ===================== Phase 2: the Crescent's rooms, furnished ===================== */
  // Every room of the Crescent furnished for what it is for (campus_rooms.py), with its own plants chosen in the program
  // (P2 rooms' plants). Rooms are laid out in their polar frame: the board on the radial wall away from the door, the
  // students facing it, daylight from the garden glass at their side. Furniture comes from the wings' builders where
  // they fit, new pieces below; obstacles for walking go to CRS.obst.
  function crsPlace(B, fb, r, a, y, rot) { var M = crsFrame(r, a, y, rot); B.add(fb, M); contactShadow(fb, M); }
  function crsObst(rA, rB, aA, aB, floor) { (CRS.obst = CRS.obst || []).push([Math.min(rA, rB), Math.max(rA, rB), Math.min(aA, aB), Math.max(aA, aB), floor]); }
  function crsPic(B, r, a, y, off, n, w, h, uv, mat, g2) { wpic(B, crsFrame(r, a, y), off, "z", n, w, h, uv, mat, g2); }
  // ---- new pieces ----
  function carrel() { return furn("carrel", function (b) {                // a study carrel: an oak desk between oak sides, a felt back with a shelf, a lamp
    var n0 = b.count(); b.box(-0.43, 0.72, -0.4, 0.43, 0.75, 0.37, MT.WOOD);
    [-0.455, 0.43].forEach(function (x) { b.box(x, 0, -0.4, x + 0.025, 1.2, 0.4, MT.WOOD); });
    b.box(-0.43, 1.18, 0.34, 0.43, 1.2, 0.4, MT.WOOD); b.box(-0.43, 0.95, 0.22, 0.08, 0.97, 0.37, MT.WOOD); b.tag(n0, null, 1);
    var n1 = b.count(); b.box(-0.43, 0.75, 0.37, 0.43, 1.18, 0.4, MT.FABRIC); [-0.43, 0.42].forEach(function (x) { b.box(x, 0.76, -0.36, x + 0.01, 1.16, 0.36, MT.FABRIC); }); b.tag(n1, 10, 0);
    [[0.034, 4, 0.0], [0.028, 9, 0.04], [0.03, 6, 0.075], [0.026, 0, 0.11]].forEach(function (bk) { var nb = b.count(); b.box(-0.38 + bk[2], 0.97, 0.23, -0.38 + bk[2] + bk[0], 1.13 + bk[0], 0.35, MT.FABRIC); b.tag(nb, bk[1], 0); });
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
    var nm = b.count(); b.box(-len / 2, 1.05, 0.27, len / 2, 2.0, 0.28, MT.STEEL); b.tag(nm, 9, null);   // the mirror: polished (STEEL g.x 9)
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
  // ---- a giant chess set: pieces of oak and walnut 0.3 to 0.6 m tall on a board of 40 cm squares ----
  var CHESS_PROF = {
    p: [[0, 0], [0.12, 0], [0.12, 0.03], [0.09, 0.05], [0.07, 0.08], [0.045, 0.19], [0.075, 0.205], [0.04, 0.215], [0.07, 0.26], [0.065, 0.3], [0.035, 0.322], [0, 0.326]],
    r: [[0, 0], [0.14, 0], [0.14, 0.035], [0.1, 0.06], [0.085, 0.3], [0.112, 0.312], [0.112, 0.4], [0.075, 0.4], [0.075, 0.37], [0, 0.37]],
    b: [[0, 0], [0.14, 0], [0.14, 0.035], [0.1, 0.06], [0.065, 0.3], [0.095, 0.315], [0.05, 0.33], [0.076, 0.38], [0.062, 0.43], [0.022, 0.47], [0, 0.482]],
    q: [[0, 0], [0.15, 0], [0.15, 0.04], [0.11, 0.07], [0.07, 0.36], [0.105, 0.38], [0.06, 0.4], [0.1, 0.5], [0.092, 0.53], [0.045, 0.54], [0.03, 0.565], [0, 0.575]],
    k: [[0, 0], [0.15, 0], [0.15, 0.04], [0.11, 0.07], [0.072, 0.38], [0.108, 0.4], [0.062, 0.42], [0.095, 0.51], [0.075, 0.54], [0, 0.545]],
    n: [[0, 0], [0.14, 0], [0.14, 0.035], [0.1, 0.06], [0.09, 0.14], [0, 0.14]]
  };
  function chessPiece(kind, dark) { return furn("chess" + kind + (dark ? "d" : "l"), function (b) {
    var n0 = b.count(); latheOn(b, 0, 0, 0, CHESS_PROF[kind], 18, MT.WOOD);
    if (kind === "k") { b.box(-0.016, 0.54, -0.016, 0.016, 0.66, 0.016, MT.WOOD); b.box(-0.055, 0.585, -0.016, 0.055, 0.615, 0.016, MT.WOOD); }
    if (kind === "n") {                                                  // the knight: a neck leaning forward and a head with its muzzle
      var hb = new Builder(); hb.box(-0.055, 0, -0.07, 0.055, 0.24, 0.07, MT.WOOD); b.add(hb, T(0, 0.12, 0.0, 0.28, 0, 0));
      var mz = new Builder(); mz.box(-0.05, -0.045, 0, 0.05, 0.045, 0.16, MT.WOOD); b.add(mz, T(0, 0.33, 0.06, 0.5, 0, 0));
      b.box(-0.06, 0.36, -0.06, -0.04, 0.42, -0.02, MT.WOOD); b.box(0.04, 0.36, -0.06, 0.06, 0.42, -0.02, MT.WOOD);
    }
    b.tag(n0, null, dark ? 2 : 1);
  }); }
  // the board at (r, a): x along the arc is the files a to h, z outward the ranks 1 to 8 (white nearest the room)
  function giantChess(B, r, a, y, floor) {
    var M = crsFrame(r, a, y), bd = new Builder(), S = 0.4;
    var n0 = bd.count(); bd.box(-1.72, 0, -1.72, 1.72, 0.025, 1.72, MT.WOOD); bd.tag(n0, null, 2);
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { var n1 = bd.count(); bd.box(-1.6 + i * S + 0.004, 0.025, -1.6 + j * S + 0.004, -1.6 + (i + 1) * S - 0.004, 0.032, -1.6 + (j + 1) * S - 0.004, MT.WOOD); bd.tag(n1, null, (i + j) % 2 ? 1 : 2); }
    B.add(bd, M);
    var back = ["r", "n", "b", "q", "k", "b", "n", "r"], put = function (k, dark, f, rk, turn) { crsPlace(B, chessPiece(k, dark), r + (-1.6 + (rk - 0.5) * S), a + (-1.6 + (f - 0.5) * S) / r, y + 0.032, turn); };
    // after 1 e4 e5 2 Nf3 Nc6 3 Bb5: white's knight on f3 and bishop on b5, black's knight on c6, the e-pawns met
    back.forEach(function (k, f) {
      if (!(f === 6 || f === 5)) put(k, false, f + 1, 1, 0);                  // the knights look across the board at the other side
      if (f !== 1) put(k, true, f + 1, 8, Math.PI);
    });
    for (var f = 1; f <= 8; f++) { put("p", false, f, f === 5 ? 4 : 2, 0); put("p", true, f, f === 5 ? 5 : 7, 0); }
    put("n", false, 6, 3, 0.4); put("b", false, 2, 5, 0); put("n", true, 3, 6, Math.PI - 0.3);
    crsObst(r - 1.75, r + 1.75, a - 1.75 / r, a + 1.75 / r, floor);
  }
  var RUG_FIELD = { 1: 6, 2: 6, 3: 9, 4: 6, 5: 5 }, RUG_BORDER = { 0: 6, 1: 10, 5: 10, 6: 10, 7: 10, 8: 6, 9: 10, 10: 6, 11: 6 };
  function rugAt(B, r, a, y, lw, ld, g2) {                                  // a wool rug lw along the arc, ld across, at (r, a): a border round a field, a soft pile
    var fld = RUG_FIELD[g2] !== undefined ? RUG_FIELD[g2] : g2, bd = RUG_BORDER[fld] !== undefined ? RUG_BORDER[fld] : 10, e = Math.min(0.22, Math.min(lw, ld) * 0.08);
    var M = crsFrame(r, a, y + 0.006), rb = new Builder();
    softBox(rb, -lw / 2, 0, -ld / 2, lw / 2, 0.014, ld / 2, 0.006, MT.FABRIC, bd, null, 2);
    softBox(rb, -lw / 2 + e, 0.002, -ld / 2 + e, lw / 2 - e, 0.0165, ld / 2 - e, 0.004, MT.FABRIC, fld, null, 2);
    B.add(rb, M);
  }

  // ---- a room's frame: its angles, the front (board) side, the floor's height ----
  // Local frames (crsFrame): x along increasing a, z outward. Pieces with a back at +z (sofas, shelves, counters) face
  // inward at rot 0, outward at PI, +a at -PI/2, -a at PI/2; desks and chairs face +a at rot 0.
  var ROT = { "in": 0, out: Math.PI, plusA: -Math.PI / 2, minusA: Math.PI / 2 };
  function roomFrame(rm) {
    var C = CRS, a0 = rmA0(rm), a1 = rmA1(rm), y = rm.floor === "lower" ? C.yL : C.yU, mid = (a0 + a1) / 2, eastSide = mid >= 0;
    // the hall is at the room's inner end: the board goes on the wall at the far end, the students face it
    var front = eastSide ? a1 : a0, back = eastSide ? a0 : a1, sgn = eastSide ? 1 : -1, rM = (C.rc + C.r1) / 2;
    return { a0: a0, a1: a1, y: y, mid: mid, front: front, back: back, sgn: sgn, rM: rM, span: (a1 - a0) * rM, floor: rm.floor, doors: rm.doors || [],
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
  // whether something on the corridor wall at angle a, half as wide as hw (m), would stand in a door (1 m) or against its open leaf
  function nearDoor(F, a, hw) { return (F.doors || []).some(function (d) { return Math.abs(a - d) * CRS.rc < hw + 0.5 + 0.25; }); }
  function shelvesOnCorridor(B, F, n, fromDist) {                           // bookshelves along the corridor wall, from a distance from the back wall
    var C = CRS, r = C.rc + 0.27, half = 0.45 / r;
    for (var k = 0; k < n; k++) { var a = F.back + F.sgn * (fromDist + k * 0.9 + 0.45) / r; if (nearDoor(F, a, 0.45)) continue; crsPlace(B, bookshelf(), r, a, F.y, ROT.out); shelfBooks(B, crsFrame(r, a, F.y, ROT.out), k + Math.round(F.mid * 40)); crsObst(r - 0.2, r + 0.4, a - half, a + half, F.floor); }
  }
  // how far a plant reaches out from its stem, from its leaves (cached on its builder)
  function plantReach(fb) { if (fb._reach) return fb._reach; var P = fb.p, m = 0.3; for (var k = 0; k < P.length; k += 3) m = Math.max(m, Math.hypot(P[k], P[k + 2])); return (fb._reach = m); }
  // where a floor plant may stand in a room: its leaves (reach R) inside the walls, clear of each door's way in and its open
  // leaf, its pot clear of the furniture placed before it and of the room's other plants; the nearest such place to the
  // one planned within 3 m, or none (Jim, 7 Oct 2026: "plants cannot block the door"; "plants get through door?")
  function plantFits(F, r, a, R, rp, near, pots) {
    var C = CRS, k;
    if (r - R < C.rc + 0.13 || r + R > C.r1 - 0.17 || (a - F.a0) * r < R + 0.13 || (F.a1 - a) * r < R + 0.13) return false;   // the walls' faces are 0.075 in
    for (k = 0; k < F.doors.length; k++) if (Math.abs(a - F.doors[k]) * C.rc < 0.65 + R && r - R < C.rc + 1.9) return false;
    for (k = 0; k < near.length; k++) { var o = near[k], cr = clamp(r, o[0], o[1]), ca = clamp(a, o[2], o[3]); if (Math.hypot(r - cr, (a - ca) * r) < rp) return false; }
    for (k = 0; k < pots.length; k++) if (Math.hypot(r - pots[k][0], (a - pots[k][1]) * r) < rp + pots[k][2]) return false;
    return true;
  }
  // the nearest place to the one planned (within 3.5 m) that fits, preferring places by a wall to the middle of the floor
  function plantSpot(F, r0, a0, R, near, pots) {
    var C = CRS, rp = Math.max(0.25, 0.55 * R), best = null, bc = 1e9;
    for (var i = -14; i <= 14; i++) for (var j = -14; j <= 14; j++) {
      var d = Math.hypot(i, j) * 0.25; if (d > 3.5 || d >= bc) continue;
      var r = r0 + i * 0.25, a = a0 + j * 0.25 / r0; if (!plantFits(F, r, a, R, rp, near, pots)) continue;
      var gap = Math.min(r - R - C.rc - 0.13, C.r1 - 0.17 - r - R, (a - F.a0) * r - R - 0.13, (F.a1 - a) * r - R - 0.13), c = d + 1.5 * Math.max(0, gap - 0.25);
      if (c < bc) { best = [r, a]; bc = c; }
    }
    return best;
  }
  // a plant at the place planned for it (pref(R) gives it for a reach R), moved as little as it must be; if it fits nowhere
  // near, a smaller one of its kind (a plant left out is the last resort)
  function placePlant(B, F, fb, pref, rot, near, pots, log) {
    var R = plantReach(fb), sc = [1, 0.85, 0.7], p = null, s = 1, q;
    for (var k = 0; k < sc.length && !p; k++) { s = sc[k]; q = pref(R * s); p = plantSpot(F, q[0], q[1], R * s, near, pots); }
    log.R = R; log.s = s;
    if (!p) { log.skipped = true; (CRS.plantLog = CRS.plantLog || []).push(log); return null; }
    log.r = p[0]; log.a = p[1]; log.moved = Math.hypot(p[0] - q[0], (p[1] - q[1]) * p[0]); (CRS.plantLog = CRS.plantLog || []).push(log);
    var M = crsFrame(p[0], p[1], F.y, rot); if (s < 1) M.multiply(new THREE.Matrix4().makeScale(s, s, s));
    B.add(fb, M); contactShadow(fb, M); pots.push([p[0], p[1], Math.max(0.25, 0.55 * R * s)]);
    crsObst(p[0] - 0.4 * s, p[0] + 0.4 * s, p[1] - 0.4 * s / p[0], p[1] + 0.4 * s / p[0], F.floor);
    return p;
  }
  function roomObstacles(F) { var C = CRS; return (C.obst || []).filter(function (o) { return o[4] === F.floor && o[1] > C.rc - 0.5 && o[0] < C.r1 + 0.5 && o[3] > F.a0 - 0.1 && o[2] < F.a1 + 0.1; }); }
  // a slim oak plant stand 1.25 m tall, its top 0.36 square, a shelf low between its legs
  function plantStand() { return furn("pstand", function (b) {
    var n0 = b.count(); b.box(-0.18, 1.22, -0.18, 0.18, 1.25, 0.18, MT.WOOD); b.box(-0.15, 0.25, -0.15, 0.15, 0.27, 0.15, MT.WOOD);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { b.box(c[0] * 0.15 - 0.018, 0, c[1] * 0.15 - 0.018, c[0] * 0.15 + 0.018, 1.22, c[1] * 0.15 + 0.018, MT.WOOD); }); kindTag(b, n0, 2);
  }); }
  // a trailing pothos, its vines down the wall's face and into the room (it hung in the air with half its vines through the
  // wall: Jim, 7 Oct 2026, "is that plants on the wall? so strange"): on an oak shelf 1.85 m up over a free stretch of the
  // corridor wall clear of the doors and the side walls; else on top of a bookcase on that wall; else on a plant stand
  function shelfPothos(B, rm, F, seed, near, pots) {
    var C = CRS, rw = C.rc + 0.075, log = { code: rm.code, kind: "pothos", spot: "shelf" }, x, a;
    for (x = 1.0; x < F.span - 1.0; x += 0.2) {
      a = F.at(x, false);
      if ((a - F.a0) * rw < 0.95 || (F.a1 - a) * rw < 0.95) continue;
      if (F.doors.some(function (d) { return Math.abs(a - d) * C.rc < 1.45; })) continue;
      if (near.some(function (o) { return o[0] < rw + 0.95 && o[2] < a + 0.95 / rw && o[3] > a - 0.95 / rw; })) continue;
      var M = crsFrame(rw, a, F.y + 1.85, ROT["in"]), sh = new Builder(), n0 = sh.count();
      sh.box(-0.36, 0, 0.0, 0.36, 0.032, 0.25, MT.WOOD); kindTag(sh, n0, 1);
      [-0.24, 0.24].forEach(function (bx) { sh.box(bx - 0.012, -0.16, 0.0, bx + 0.012, 0.0, 0.012, MT.ANOD); sh.box(bx - 0.012, -0.014, 0.0, bx + 0.012, 0.0, 0.2, MT.ANOD); });
      B.add(sh, M); B.add(plantBuilder("pothoswall", seed), M.clone().multiply(T(0, 0.032, 0.13)));
      log.on = "shelf"; log.a = a; (C.plantLog = C.plantLog || []).push(log); return;
    }
    var cases = near.filter(function (o) { return Math.abs(o[0] - (C.rc + 0.07)) < 0.02 && Math.abs(o[1] - (C.rc + 0.67)) < 0.02; })   // the corridor wall's bookcases
                    .map(function (o) { return (o[2] + o[3]) / 2; }).filter(function (ac) { return !nearDoor(F, ac, 0.45); })
                    .sort(function (p, q) { return Math.abs(p - F.back) - Math.abs(q - F.back); });
    if (cases.length) { B.add(plantBuilder("pothoswall", seed), crsFrame(C.rc + 0.27, cases[0], F.y + 2.2, ROT["in"]).multiply(T(0, 0, -0.06))); log.on = "bookcase"; log.a = cases[0]; (C.plantLog = C.plantLog || []).push(log); return; }
    var fb = plantBuilder("pothosstand", seed), st = new Builder(); st.add(plantStand(), T(0, 0, 0)); st.add(fb, T(0, 1.25, 0)); st._reach = Math.max(0.3, plantReach(fb));
    log.on = "stand"; placePlant(B, F, st, function (R) { return [C.rc + 0.13 + R + 0.05, F.back + F.sgn * (R + 0.2) / (C.rc + 1)]; }, seed * 0.7, near, pots, log);
  }
  // the plants chosen for the room at their spots, each moved as little as it must be to stand clear (plantSpot)
  function roomPlants(B, rm, F, deskAt) {
    var C = CRS, i = 0, pots = [], near = roomObstacles(F);
    (rm.plants || []).forEach(function (pl) {
      var kind = pl[0], spot = pl[1], seed = 60 + Math.round(F.mid * 100) + i++;
      if (spot === "shelf") { shelfPothos(B, rm, F, seed, near, pots); return; }
      var fb = plantBuilder(kind, seed), log = { code: rm.code, kind: kind, spot: spot };
      if (spot === "desk" && deskAt) { crsPlace(B, fb, deskAt[0], deskAt[1], F.y + deskAt[2], seed * 0.7); log.on = "desk"; (C.plantLog = C.plantLog || []).push(log); return; }
      placePlant(B, F, fb, function (R) {
        var cl = R + 0.13, r, a;
        if (spot === "window0") { r = C.r1 - 0.17 - R; a = F.a0 + Math.max(0.85, cl) / r; } else if (spot === "window1") { r = C.r1 - 0.17 - R; a = F.a1 - Math.max(0.85, cl) / r; }
        else if (spot === "windowmid") { r = C.r1 - 0.17 - R; a = F.at(F.span * 0.72, true); }
        else if (spot === "corner0") { r = C.rc + Math.max(0.7, cl); a = F.a0 + Math.max(0.75, cl) / r; } else if (spot === "corner1") { r = C.rc + Math.max(0.7, cl); a = F.a1 - Math.max(0.75, cl) / r; }
        else if (spot === "door") { var d = F.doors[0] || F.mid; r = C.rc + cl; a = d + (d > F.mid ? -1 : 1) * (0.85 + R) / r; }   // beside the door, past its open leaf
        else if (spot === "side0" || spot === "side1") { r = (C.rc + C.r1) / 2; a = spot === "side0" ? F.a0 + Math.max(0.6, cl) / r : F.a1 - Math.max(0.6, cl) / r; }   // by a side wall, halfway out
        else if (spot === "glass0" || spot === "glass1") { r = C.r1 - 3.0; a = spot === "glass0" ? F.a0 + Math.max(0.6, cl) / r : F.a1 - Math.max(0.6, cl) / r; }   // by a side wall, 3 m in from the glass
        else { r = C.r1 - 0.17 - R; a = F.mid; }
        return [r, a];
      }, seed * 0.7, near, pots, log);
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
        crsPlace(B, theme === "gauss" ? officeChair() : schoolChair([5, 5, 7, 1][Math.floor(CR() * 4)]), r + dz, ac, F.y, faceRot + turn);
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
      rugAt(B, rs - 1.25, ra, F.y, 3.6, 2.6, 3); crsPlace(B, sofa(6, 3.0), rs, ra, F.y, ROT["in"]); crsPlace(B, coffeeTable(1.4), rs - 1.35, ra, F.y, 0);
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
      crsPlace(B, officeChair(), r, a - F.sgn * 0.62 / r, F.y, F.sgn > 0 ? 0 : Math.PI); crsObst(r - 0.48, r + 0.48, a - 0.45 / r, a + 0.45 / r, F.floor); n++; });   // padded task chairs (the program's), not shell chairs
    var la = F.at(1.2, true), rd = C.rc + 2.1; crsPlace(B, teacherDesk(), rd, la, F.y, F.sgn > 0 ? Math.PI : 0); crsObst(rd - 0.85, rd + 0.85, la - 0.42 / 51, la + 0.42 / 51, F.floor);   // clear of the door's open leaf
    shelvesOnCorridor(B, F, 12, 1.4);
    roomPlants(B, rm, F, [rd, la, 0.77]);
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
    crsPlace(B, sofa(10, 3.0), rA, la, F.y, ROT["in"]); crsPlace(B, sofa(8, 3.0), rB, la, F.y, ROT.out);
    crsPlace(B, walnutTable(1.4, 0.7), (rA + rB) / 2, la, F.y, 0); crsObst(rB - 0.55, rA + 0.55, la - 1.6 / 58, la + 1.6 / 58, F.floor);
    var rm2 = (rA + rB) / 2; [[-2.15, ROT.plusA], [2.15, ROT.minusA]].forEach(function (e) { var aa = la + e[0] / rm2; crsPlace(B, armchair(), rm2, aa, F.y, e[1]); crsObst(rm2 - 0.5, rm2 + 0.5, aa - 0.5 / rm2, aa + 0.5 / rm2, F.floor); });
    [-1.8, 1.8].forEach(function (x) { var aa = la + x / rA; crsPlace(B, lampTable(), rA + 0.05, aa, F.y, 0); lampLight(rA + 0.05, aa, F.y, 0.95, 0.55, 3.2); crsObst(rA - 0.25, rA + 0.35, aa - 0.28 / rA, aa + 0.28 / rA, F.floor); });
    giantChess(B, 59.3, F.at(3.6, false), F.y, F.floor);
    var ea = F.at(F.span * 0.62, false); crsPlace(B, kitchenette(), C.rc + 0.42, ea, F.y, ROT.out);   // between the doors crsObst(C.rc + 0.1, C.rc + 0.8, ea - 1.25 / 50, ea + 1.25 / 50, F.floor);
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
    var la = F.at(F.span - 1.25, false); if (!nearDoor(F, la, 0.8)) { crsPlace(B, lockerBank(4), C.rc + 0.36, la, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.65, la - 0.85 / C.rc, la + 0.85 / C.rc, F.floor); }   // the lockers past the kitchenette (they stood in the doorway)
    // the lounge on the front wall: a long sofa backed onto it, a walnut table, two club chairs across, a rug, lamps
    var faceBack = F.sgn > 0 ? ROT.minusA : ROT.plusA, faceFront = F.sgn > 0 ? ROT.plusA : ROT.minusA, ls = F.at(F.span - 0.6, false), lt = F.at(F.span - 1.6, false), lc = F.at(F.span - 2.8, false);
    rugAt(B, 57.0, F.at(F.span - 1.75, false), F.y, 3.0, 3.4, 4);
    crsPlace(B, sofa(8, 2.8), 57.0, ls, F.y, faceBack); crsObst(55.55, 58.45, F.at(F.span - 1.1, false), F.front, F.floor);
    crsPlace(B, walnutTable(1.2, 0.6), 57.0, lt, F.y, ROT.minusA); crsObst(56.35, 57.65, F.at(F.span - 1.95, false), F.at(F.span - 1.25, false), F.floor);
    [56.3, 57.7].forEach(function (r) { crsPlace(B, armchair(), r, lc, F.y, faceFront); crsObst(r - 0.45, r + 0.45, F.at(F.span - 3.25, false), F.at(F.span - 2.35, false), F.floor); });
    [55.25, 58.75].forEach(function (r) { var a = F.at(F.span - 0.45, false); crsPlace(B, lampTable(), r, a, F.y, 0); lampLight(r, a, F.y, 0.95, 0.55, 3.2); crsObst(r - 0.28, r + 0.28, F.at(F.span - 0.75, false), F.front, F.floor); });
    var fl = F.at(F.span - 3.0, false); crsPlace(B, floorLamp(), 58.75, fl, F.y, 0); lampLight(58.75, fl, F.y, 1.4, 0.7, 3.6); crsObst(58.55, 58.95, fl - 0.2 / 58.75, fl + 0.2 / 58.75, F.floor);
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
  // the basins on the corridor wall, in the middle, if that leaves the door and its open leaf clear; in a narrow room along
  // the side wall away from the door instead (they stood across the doorway in 207, 222 and 269)
  function basinsClearOfDoor(B, rm, F) {
    var C = CRS, lw = 3.6, d0 = (rm.doors || [])[0];
    if (!(rm.doors || []).some(function (d) { return Math.abs(d - F.mid) * C.rc < lw / 2 + 1.1; })) { crsPlace(B, basinCounter(lw), C.rc + 0.45, F.mid, F.y, ROT.out); crsObst(C.rc, C.rc + 0.8, F.mid - 1.85 / 50, F.mid + 1.85 / 50, F.floor); return; }
    var far0 = Math.abs(d0 - F.a0) > Math.abs(d0 - F.a1), rb = C.rc + 2.0 + lw / 2, ab = far0 ? F.a0 + 0.36 / rb : F.a1 - 0.36 / rb;
    crsPlace(B, basinCounter(lw), rb, ab, F.y, far0 ? ROT.plusA : ROT.minusA); crsObst(rb - lw / 2 - 0.05, rb + lw / 2 + 0.05, far0 ? F.a0 : ab - 0.38 / rb, far0 ? ab + 0.38 / rb : F.a1, F.floor);
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
    crsPlace(B, sofa(7, 3.8), rS, ba, F.y, ROT["in"]); crsObst(rS - 0.55, rS + 0.55, ba - 2.0 / rS, ba + 2.0 / rS, F.floor);
    crsPlace(B, sofa(7, 3.8), rB, ba, F.y, ROT.out); crsObst(rB - 0.55, rB + 0.55, ba - 2.0 / rB, ba + 2.0 / rB, F.floor);
    crsPlace(B, walnutTable(1.8, 0.8), rT, ba, F.y, 0); crsObst(rT - 0.45, rT + 0.45, ba - 1.0 / rT, ba + 1.0 / rT, F.floor);
    [-2.2, 2.2].forEach(function (x) { var aa = ba + x / rS; crsPlace(B, lampTable(), rS + 0.05, aa, F.y, 0); lampLight(rS + 0.05, aa, F.y, 0.95, 0.6, 3.4); crsObst(rS - 0.25, rS + 0.35, aa - 0.28 / rS, aa + 0.28 / rS, F.floor); });
    [-2.3, 2.3].forEach(function (x) { var aa = ba + x / rB, rl = rB - 0.25; crsPlace(B, floorLamp(), rl, aa, F.y, 0); lampLight(rl, aa, F.y, 1.4, 0.7, 3.6); crsObst(rl - 0.2, rl + 0.2, aa - 0.2 / rl, aa + 0.2 / rl, F.floor); });
    [[-2.75, ROT.plusA], [2.75, ROT.minusA]].forEach(function (e) { var aa = ba + e[0] / rT; crsPlace(B, armchair(), rT, aa, F.y, e[1]); crsObst(rT - 0.5, rT + 0.5, aa - 0.5 / rT, aa + 0.5 / rT, F.floor); });
    var hn = roomObstacles(F), hp = [];                                      // tall plants by the side wall, their leaves on this side of it
    [["fig", 52.6], ["kentia", 55.2]].forEach(function (t, i) { placePlant(B, F, plantBuilder(t[0], 911 + i), function (R) { return [t[1], F.a0 + (R + 0.15) / t[1]]; }, i * 2.1, hn, hp, { code: rm.code, kind: t[0], spot: "side wall" }); });
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
    classDetails(W);                                                         // the classrooms' clocks and pinboards (blk_classdetail.js)
    outerBlinds(W);                                                          // roller blinds on the outer glass (blk_classdetail.js)
    softShadowsBuild();
    W.zone = ZONE.OUT;
  }
  // the garden gallery: long planters along the stone wall with plants of every kind, oak benches between them facing the glass
  function crescentGalleryFurnish(B) {
    var C = CRS, G = C.gal, rP = G.r1 - 0.85, rB = G.r1 - 1.9, kinds = ["kentia", "strelitzia", "fern", "monstera", "maple", "olive", "agave", "bromeliad", "croton", "fig", "anthurium", "ficus"], n = 0;
    var doorsA = (C.doors || []).filter(function (d) { return Math.abs(d.r - C.r1) < 0.01; }).map(function (d) { return d.a; });
    var yE = crsRoofY(C.roofOut) - C.roofT - 0.05, rT = C.r1 + 0.4, rW = G.r1 - 0.15;                            // the glass roof, as crescentGallery builds it
    function roofAt(a, r) { var p = crsPt(G.r1 + 0.4, a), top = Math.max(groundAt(p.x, p.z, C.yL) + G.wall, C.yL + 2.8); return lerp(yE, top + 0.16, (r - rT) / (rW - rT)); }
    for (var a = G.a0 + 3.0 / rP; a < G.a1 - 3.0 / rP; a += 8.0 / rP) {
      crsPlace(B, planter(5.0), rP, a, C.yL, 0); crsObst(rP - 0.5, rP + 0.5, a - 2.55 / rP, a + 2.55 / rP, "gallery");
      for (var k = 0; k < 3; k++) { var kind = kinds[n++ % kinds.length], pa = a + (-1.6 + 1.6 * k) / rP;      // big plants set into the troughs, their leaves this side of the wall and under the glass
        bedPlantKept(B, kind, 300 + n, crsFrame(rP, pa, C.yL), n * 1.3, 0.5, 1.7, 0, G.r1 - 0.3 - rP - 0.12, roofAt(pa, rP) - 0.3 - C.yL); }
      var ba = a + 4.0 / rP; if (ba < G.a1 - 2.0 / rB && !doorsA.some(function (d) { return Math.abs(d - ba) * C.r1 < 2.2; })) { crsPlace(B, gardenBench(2.4), rB, ba, C.yL, ROT["in"]); crsObst(rB - 0.3, rB + 0.3, ba - 1.25 / rB, ba + 1.25 / rB, "gallery"); }
    }
  }
