  /* ===================== The Ring's other rooms: each furnished for its use, the furniture sized to the room ===================== */
  // Jim, 4 Oct 2026: "make them proportional the furniture be proportional to the size of the room"; "I hate those small
  // chairs". Long tables with generous chairs, long sofas, shelves to the ceiling; every room with its own plants (P2's
  // RING_PLANTS). Frames as in blk_crsfurnish.js (roomFrame, crsPlace, ROT): x along increasing a, z outward; chairs face
  // +a at rot 0, inward at PI/2; pieces with their back at +z face inward at rot 0.
  var IN = Math.PI / 2, OUT = -Math.PI / 2;
  function longTable(len) { return furn("ltable" + len, function (b) {               // oak, len along x by 1.0, on steel legs
    var n0 = b.count(); b.box(-len / 2, 0.71, -0.5, len / 2, 0.75, 0.5, MT.WOOD); b.tag(n0, null, 2);
    var nl = Math.max(1, Math.round(len / 2.4)); for (var k = 0; k <= nl; k++) { var x = lerp(-len / 2 + 0.2, len / 2 - 0.2, k / nl); [-0.4, 0.4].forEach(function (z) { b.box(x - 0.03, 0, z - 0.03, x + 0.03, 0.71, z + 0.03, MT.ANOD); }); }
  }); }
  function counter(len, top) { return furn("counter" + len + "_" + (top || 0), function (b) {   // len along x, 0.66 deep, 0.92 high, back at +z
    b.box(-len / 2, 0, -0.3, len / 2, 0.88, 0.33, MT.WOOD); b.box(-len / 2 - 0.02, 0.88, -0.34, len / 2 + 0.02, 0.92, 0.34, top ? MT.STEEL : MT.MARBLE);
  }); }
  function receptionDesk() { return furn("recdesk", function (b) {                   // 4.0 long, a raised counter for visitors at -z
    b.box(-2.0, 0, -0.32, 2.0, 1.05, 0.32, MT.WOOD); b.box(-2.05, 1.05, -0.48, 2.05, 1.1, 0.18, MT.MARBLE); b.box(-1.9, 0.72, 0.18, 1.9, 0.76, 0.66, MT.WOOD);
  }); }
  function easel() { return furn("easel", function (b) {
    leg(b, -0.3, 0, 0.18, -0.05, 1.75, 0, 0.018, MT.WOOD); leg(b, 0.3, 0, 0.18, 0.05, 1.75, 0, 0.018, MT.WOOD); leg(b, 0, 0, -0.5, 0, 1.62, -0.02, 0.016, MT.WOOD);
    b.box(-0.34, 0.78, 0.04, 0.34, 0.81, 0.16, MT.WOOD); var n0 = b.count(); b.box(-0.32, 0.81, 0.07, 0.32, 1.55, 0.09, MT.PLASTER); b.tag(n0, 0, null);
  }); }
  function workbench() { return furn("wbench", function (b) {                         // 2.4 along x, 0.9 deep, beech top on steel, a shelf
    b.box(-1.2, 0.86, -0.45, 1.2, 0.92, 0.45, MT.WOOD); b.box(-1.15, 0.2, -0.4, 1.15, 0.23, 0.4, MT.ANOD);
    [[-1.15, -0.4], [1.15, -0.4], [-1.15, 0.4], [1.15, 0.4]].forEach(function (c) { b.box(c[0] - 0.03, 0, c[1] - 0.03, c[0] + 0.03, 0.86, c[1] + 0.03, MT.ANOD); });
  }); }
  function printer3d() { return furn("p3d", function (b) {
    b.box(-0.3, 0, -0.3, 0.3, 0.06, 0.3, MT.ANOD); [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(function (c) { b.box(c[0] - 0.02, 0, c[1] - 0.02, c[0] + 0.02, 0.62, c[1] + 0.02, MT.ANOD); });
    b.box(-0.3, 0.6, -0.3, 0.3, 0.64, 0.3, MT.ANOD); b.box(-0.08, 0.4, -0.06, 0.08, 0.5, 0.06, MT.STEEL); b.box(-0.18, 0.06, -0.18, 0.18, 0.08, 0.18, MT.STEEL);
  }); }
  function machine(w, h, d) { return furn("mach" + w + h, function (b) {             // a plant cabinet, w along x, back at +z, pipes on top
    b.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, MT.STEEL); b.box(-w / 2 + 0.1, h * 0.55, -d / 2 - 0.01, w / 2 - 0.1, h * 0.85, -d / 2, MT.ANOD);
    [-w / 4, w / 4].forEach(function (x) { leg(b, x, h, 0, x, h + 1.2, 0, 0.08, MT.STEEL); });
  }); }
  function tank(r, h) { return furn("tank" + r + h, function (b) { latheOn(b, 0, 0, 0, [[0.0, 0], [r, 0], [r, h], [r * 0.6, h + r * 0.3], [0.0, h + r * 0.35]], 28, MT.STEEL, 0.4); }); }
  function rack() { return furn("rack", function (b) {                               // a steel store rack 2.0 along x, 0.6 deep, 2.4 high
    [[-1.0, -0.3], [1.0, -0.3], [-1.0, 0.3], [1.0, 0.3]].forEach(function (c) { b.box(c[0] - 0.02, 0, c[1] - 0.02, c[0] + 0.02, 2.4, c[1] + 0.02, MT.ANOD); });
    [0.1, 0.7, 1.3, 1.9, 2.36].forEach(function (y) { b.box(-1.0, y, -0.3, 1.0, y + 0.03, 0.3, MT.STEEL); });
    [[-0.6, 0.13, 0.5], [0.3, 0.13, 0.45], [-0.2, 0.73, 0.4], [0.6, 1.33, 0.35]].forEach(function (c) { var n0 = b.count(); b.box(c[0] - 0.3, c[1], -0.22, c[0] + 0.3, c[1] + c[2], 0.22, MT.PLASTER); b.tag(n0, 5, null); });
  }); }
  function planets() { return furn("planets", function (b) {                         // a model of the solar system hung on a brass arc
    var sizes = [0.18, 0.04, 0.06, 0.065, 0.05, 0.13, 0.11, 0.08, 0.075];
    sizes.forEach(function (s, k) { var x = -2.4 + k * 0.6; b.geo(k ? new THREE.SphereGeometry(s, 16, 12) : addF2(new THREE.SphereGeometry(s, 20, 14), 1.8, 0), T(x, 0, 0), k ? MT.CERAMIC : MT.LIGHT, 1); leg(b, x, s, 0, x, 0.6, 0, 0.004, MT.STEEL); });
    leg(b, -2.6, 0.6, 0, 2.6, 0.6, 0, 0.012, MT.BRASS);
  }); }
  function stool() { return furn("stool", function (b) { latheOn(b, 0, 0, 0, [[0.2, 0], [0.2, 0.02], [0.03, 0.04], [0.03, 0.62], [0.19, 0.64], [0.19, 0.68], [0.0, 0.68]], 18, MT.ANOD, 0.3); }); }
  // an upholstered dining chair with arms, 0.62 wide, the seat at 0.47: for the café, the dining hall, the library's tables
  var DCHAIR_COL = { 2: 8, 3: 9 };                                                    // the old mustard and terracotta: olive and rust
  function diningChair(col) { return furn("dchair" + col, function (b) {             // facing +x: an upholstered chair with arms on walnut legs, its back leaning back
    var c = DCHAIR_COL[col] !== undefined ? DCHAIR_COL[col] : col;
    softBox(b, -0.27, 0.36, -0.29, 0.29, 0.47, 0.29, 0.045, MT.FABRIC, c, { py: 0.016 }, 0);
    var t = new Builder(); softBox(t, -0.06, -0.25, -0.31, 0.06, 0.25, 0.31, 0.05, MT.FABRIC, c, { px: 0.016 }, 0);
    b.add(t, new THREE.Matrix4().makeTranslation(-0.25, 0.66, 0).multiply(new THREE.Matrix4().makeRotationZ(0.12)));
    [-1, 1].forEach(function (s2) { softBox(b, -0.26, 0.42, s2 > 0 ? 0.21 : -0.31, 0.22, 0.64, s2 > 0 ? 0.31 : -0.21, 0.035, MT.FABRIC, c, { py: 0.008 }, 0); });
    [[-0.26, -0.27], [0.26, -0.27], [-0.26, 0.27], [0.26, 0.27]].forEach(function (cc) { var m = b.count(); leg(b, cc[0], 0.37, cc[1], cc[0] * 1.07, 0, cc[1] * 1.07, 0.019, MT.WOOD); kindTag(b, m, 2); });
  }); }
  function squareTable(w, d) { return furn("sqtable" + w + "x" + d, function (b) {    // an oak top w along x by d, on a dark steel pedestal
    var n0 = b.count(); b.box(-w / 2, 0.72, -d / 2, w / 2, 0.755, d / 2, MT.WOOD); b.tag(n0, null, 2);
    b.box(-0.04, 0.04, -0.04, 0.04, 0.72, 0.04, MT.ANOD); b.box(-w * 0.34, 0, -0.035, w * 0.34, 0.04, 0.035, MT.ANOD); b.box(-0.035, 0, -d * 0.34, 0.035, 0.04, d * 0.34, MT.ANOD);
  }); }
  // a table for four: the table and a chair on each side, all facing it
  function tableForFour(B, r, a, y, w, col, floor) {
    crsPlace(B, squareTable(w, w), r, a, y, 0); crsObst(r - w / 2 - 0.15, r + w / 2 + 0.15, a - (w / 2 + 0.15) / r, a + (w / 2 + 0.15) / r, floor);
    var e = w / 2 + 0.3;
    crsPlace(B, diningChair(col), r + e, a, y, IN); crsPlace(B, diningChair(col), r - e, a, y, OUT);
    crsPlace(B, diningChair(col), r, a - e / r, y, 0); crsPlace(B, diningChair(col), r, a + e / r, y, Math.PI);
  }

  // ---- the rooms ----
  // ---- Socrates: a boardroom table for twenty ----
  // a walnut table len along x, w across, its ends rounded, on three plinths; power ports along its middle
  function boardTable(len, w) { return furn("board" + len + "_" + w, function (b) {
    var h = len / 2, r = w / 2, sh = new THREE.Shape(); sh.moveTo(-h + r, -r); sh.lineTo(h - r, -r); sh.absarc(h - r, 0, r, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-h + r, r); sh.absarc(-h + r, 0, r, Math.PI / 2, 3 * Math.PI / 2, false);
    var n0 = b.count(); b.geo(new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 16 }), T(0, 0.765, 0, -Math.PI / 2, 0, 0), MT.WOOD); b.tag(n0, null, 2);
    var n1 = b.count(); [-len / 3, 0, len / 3].forEach(function (x) { b.box(x - 0.3, 0, -0.32, x + 0.3, 0.73, 0.32, MT.WOOD); }); b.tag(n1, null, 2);
    var np = b.count(); for (var x = -h + 1.2; x < h - 1.0; x += 1.8) b.box(x - 0.13, 0.81, -0.045, x + 0.13, 0.814, 0.045, MT.PLASTIC); b.tag(np, 1, null);
  }); }
  // a high-backed conference chair facing +x: a stuffed seat and back in cognac leather, padded arms, a five-star base on castors
  function conferenceChair() { return furn("confchair", function (b) {
    for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a); leg(b, 0, 0.1, 0, cx * 0.32, 0.06, cz * 0.32, 0.017, MT.STEEL); b.geo(new THREE.SphereGeometry(0.028, 10, 8), T(cx * 0.32, 0.028, cz * 0.32), MT.RUBBER); }
    latheOn(b, 0, 0.08, 0, [[0.03, 0], [0.03, 0.28], [0.022, 0.3], [0.022, 0.36]], 12, MT.STEEL, 0);
    softBox(b, -0.25, 0.42, -0.26, 0.27, 0.5, 0.26, 0.04, MT.LEATHER, 2, { py: 0.018 }, 0);
    var t = new Builder(); softBox(t, -0.05, -0.33, -0.25, 0.05, 0.33, 0.25, 0.045, MT.LEATHER, 2, { px: 0.016 }, 0);
    b.add(t, new THREE.Matrix4().makeTranslation(-0.28, 0.86, 0).multiply(new THREE.Matrix4().makeRotationZ(0.14)));
    [-1, 1].forEach(function (s) { softBox(b, -0.18, 0.64, s * 0.27 - 0.04, 0.16, 0.68, s * 0.27 + 0.04, 0.015, MT.LEATHER, 1, null, 0);
      tubeAlong(b, [V3(0.1, 0.48, s * 0.25), V3(0.1, 0.64, s * 0.27)], 0.01, 5, MT.STEEL); tubeAlong(b, [V3(-0.14, 0.48, s * 0.25), V3(-0.14, 0.64, s * 0.27)], 0.01, 5, MT.STEEL); });
  }); }
  // a place at the table, in the chair's frame (the table's edge toward +x): a leather pad, a notebook and pen, a glass
  function placeSetting(k) { return furn("place" + (k % 3), function (b) {
    var n0 = b.count(); b.box(0.02, 0.0, -0.22, 0.34, 0.004, 0.22, MT.LEATHER); b.tag(n0, 1, null);
    var nn = b.count(); b.box(0.08, 0.004, -0.12 + 0.03 * (k % 3), 0.29, 0.014, 0.04 + 0.03 * (k % 3), MT.PLASTIC); b.tag(nn, 0, null);
    var npn = b.count(); b.box(0.1, 0.014, 0.08, 0.25, 0.022, 0.09, MT.PLASTIC); b.tag(npn, 1, null);
    latheOn(b, 0.33, 0.0, 0.3, [[0.0, 0.0], [0.03, 0.0], [0.034, 0.1], [0.031, 0.1], [0.027, 0.006], [0.0, 0.006]], 16, MT.CERAMIC, 0);
  }); }
  // a walnut credenza len along x, 0.45 deep (its back at +z), on a plinth set back; a coffee machine, cups, a lamp on it
  function credenza(len) { return furn("credenza" + len, function (b) {
    var h = len / 2, n0 = b.count(), k; b.box(-h, 0.1, -0.22, h, 0.74, 0.22, MT.WOOD); b.box(-h - 0.01, 0.74, -0.23, h + 0.01, 0.77, 0.23, MT.WOOD); kindTag(b, n0, 2); b.box(-h + 0.06, 0, -0.16, h - 0.06, 0.1, 0.2, MT.RUBBER);
    var nd = b.count(); for (k = 1; k < 4; k++) b.box(-h + len * k / 4 - 0.003, 0.12, -0.224, -h + len * k / 4 + 0.003, 0.72, -0.221, MT.PLASTIC); b.tag(nd, 1, null);
    for (k = 0; k < 4; k++) { var x = -h + len * (k + 0.5) / 4 + (k % 2 ? -0.24 : 0.24) * len / 4 / 0.7; b.box(x - 0.006, 0.36, -0.235, x + 0.006, 0.56, -0.224, MT.BRASS); }
    var nm = b.count(); b.box(h - 0.62, 0.77, -0.16, h - 0.3, 1.18, 0.16, MT.PLASTIC); b.tag(nm, 1, null); b.box(h - 0.58, 0.82, -0.165, h - 0.34, 0.86, -0.16, MT.STEEL);
    for (k = 0; k < 6; k++) latheOn(b, -0.2 + (k % 3) * 0.1, 0.77, -0.06 + Math.floor(k / 3) * 0.1, [[0.0, 0.0], [0.03, 0.0], [0.038, 0.08], [0.0, 0.08]], 14, MT.CERAMIC, 0);
    b.add(tableLamp(), T(-h + 0.35, 0.77, 0));
  }); }
  function seminarRoom(B, rm, F) {                                                    // Socrates: the boardroom table for twenty on a rug, the screen over a credenza, a whiteboard, books
    var C = CRS, len = 9.0, w = 1.5, r = 55.6, a = F.at(F.span / 2 + 0.3, true), n = 9, along = F.sgn > 0 ? 0 : Math.PI;
    rugAt(B, r, a, F.y, len + 2.6, 4.6, 10);
    crsPlace(B, boardTable(len, w), r, a, F.y, along); crsObst(r - w / 2 - 0.1, r + w / 2 + 0.1, a - (len / 2 + 0.1) / r, a + (len / 2 + 0.1) / r, F.floor);
    for (var k = 0; k < n; k++) { var x = (k - (n - 1) / 2) * (len - 1.6) / (n - 1);
      [[r + w / 2 + 0.42, IN], [r - w / 2 - 0.42, OUT]].forEach(function (c, ci) { var ac = a + x / r; crsPlace(B, conferenceChair(), c[0], ac, F.y, c[1] + (k % 3 - 1) * 0.06);
        B.add(placeSetting(k + ci), crsFrame(r + (ci ? -1 : 1) * w / 2, ac, F.y + 0.819, c[1])); }); }
    [[len / 2 + 0.42, Math.PI], [-len / 2 - 0.42, 0]].forEach(function (e, ei) { var ae = a + F.sgn * e[0] / r; crsPlace(B, conferenceChair(), r, ae, F.y, F.sgn > 0 ? e[1] : e[1] + Math.PI);
      B.add(placeSetting(ei), crsFrame(r, a + F.sgn * (e[0] > 0 ? len / 2 : -len / 2) / r, F.y + 0.819, F.sgn > 0 ? e[1] : e[1] + Math.PI)); });
    [-len / 4, len / 4].forEach(function (x) { var Mc = crsFrame(r, a + x / r, F.y + 0.819); glassLathe(Mc, [[0.05, 0.0], [0.055, 0.12], [0.03, 0.2], [0.022, 0.26], [0.024, 0.28], [0.0, 0.28]], 20); });   // carafes
    screenOn(B, F, 2.4, 1.35, ATL.scrSem);
    var ca = F.at(0.3, true); crsPlace(B, credenza(2.8), 55.8, ca, F.y, F.sgn > 0 ? ROT.minusA : ROT.plusA); crsObst(54.3, 57.3, F.at(0.55, true), F.front, F.floor);
    boardOn(B, F, 3.6, ATL.wb, MT.ATLAS, [0, 2], true);
    shelvesOnCorridor(B, F, 5, 1.0);
    roomPlants(B, rm, F, [r, a + F.sgn * 1.2 / r, 0.819]);
  }
  function libraryRoom(B, rm, F) {                                                    // the library: shelves along the outer wall, tables, the desk
    var C = CRS, rs = C.r1 - 0.35;
    for (var d = 0.9; d < F.span - 0.6; d += 0.92) { var a = F.at(d, false); crsPlace(B, bookshelf(), rs, a, F.y, 0); shelfBooks(B, crsFrame(rs, a, F.y, 0), Math.round(d * 3)); crsObst(rs - 0.25, rs + 0.25, a - 0.46 / rs, a + 0.46 / rs, F.floor); }
    [[53.6, 3.6], [53.6, 8.2], [57.2, 3.6], [57.2, 8.2], [53.6, 12.8], [57.2, 12.8]].forEach(function (t) {
      if (t[1] > F.span - 2.2) return; var a = F.at(t[1], false); crsPlace(B, longTable(2.4), t[0], a, F.y, 0); crsObst(t[0] - 0.95, t[0] + 0.95, a - 1.3 / t[0], a + 1.3 / t[0], F.floor);
      [-0.6, 0.6].forEach(function (x) { crsPlace(B, diningChair(1), t[0] + 0.82, a + x / t[0], F.y, IN); crsPlace(B, diningChair(1), t[0] - 0.82, a + x / t[0], F.y, OUT); });
      crsPlace(B, bankerLamp(), t[0], a, F.y + 0.75, 0);
    });
    var da = F.at(1.6, true); crsPlace(B, teacherDesk(), C.rc + 1.5, da, F.y, F.sgn > 0 ? Math.PI : 0); crsObst(C.rc + 0.65, C.rc + 2.35, da - 0.45 / 51, da + 0.45 / 51, F.floor);
    roomPlants(B, rm, F, [C.rc + 1.5, da, 0.77]);
  }
  function readingRoom(B, rm, F) {          // furnished in groups (campus_furnishing.py): by the windows two sofas facing club chairs, a reading table
    var C = CRS, ra = C.r1 - 0.7, rc = C.rc;  // in the middle, a banquette between bookcases on the back wall, two club chairs on the front wall, shelves on the corridor's
    var faceIn = F.sgn > 0 ? ROT.plusA : ROT.minusA, faceBack = F.sgn > 0 ? ROT.minusA : ROT.plusA;
    // the window groups: a long sofa on the outer wall, a walnut table with books, two club chairs across, a rug; lamps between
    [3.7, 8.2].forEach(function (d, i) {
      var a = F.at(d, false), rr = ra - 2.75; rugAt(B, ra - 1.45, a, F.y, 4.4, 3.4, i ? 2 : 3);
      crsPlace(B, sofa(i ? 11 : 6, 3.4), ra, a, F.y, ROT["in"]); crsPlace(B, walnutTable(1.4, 0.7), ra - 1.4, a, F.y, 0);
      [-1, 1].forEach(function (x) { crsPlace(B, armchair(), rr, a + x * 1.0 / rr, F.y, ROT.out); });
      crsObst(ra - 3.25, ra + 0.5, a - 1.95 / ra, a + 1.95 / ra, F.floor);
    });
    [1.72, 5.95, 10.18].forEach(function (d) { var a = F.at(d, false); crsPlace(B, lampTable(), ra + 0.05, a, F.y, 0); lampLight(ra + 0.05, a, F.y, 0.95, 0.55, 3.2); crsObst(ra - 0.25, ra + 0.35, a - 0.28 / ra, a + 0.28 / ra, F.floor); });
    [1.85, 5.95, 10.05].forEach(function (d) { var a = F.at(d, false), rl = ra - 2.9; crsPlace(B, floorLamp(), rl, a, F.y, 0); lampLight(rl, a, F.y, 1.4, 0.7, 3.6); crsObst(rl - 0.2, rl + 0.2, a - 0.2 / rl, a + 0.2 / rl, F.floor); });
    // the reading table in the middle: walnut, eight upholstered chairs, two green-shaded lamps, on a rug
    var tr = 54.6, ta = F.at(5.95, false); rugAt(B, tr, ta, F.y, 4.6, 3.3, 5);
    crsPlace(B, readingTable(3.2), tr, ta, F.y, 0); crsObst(tr - 1.35, tr + 1.35, ta - 1.9 / tr, ta + 1.9 / tr, F.floor);
    [-1.2, -0.4, 0.4, 1.2].forEach(function (x) { crsPlace(B, diningChair(10), tr + 0.8, ta + x / tr, F.y, IN); crsPlace(B, diningChair(10), tr - 0.8, ta + x / tr, F.y, OUT); });
    [-0.8, 0.8].forEach(function (x) { crsPlace(B, bankerLamp(), tr, ta + x / tr, F.y + 0.75, 0); lampLight(tr, ta + x / tr, F.y, 1.05, 0.4, 2.6); });
    // the back wall: a banquette between bookcases, two prints over it (RING_ART)
    var ab = F.at(0.41, false); crsPlace(B, banquette(3.0, 8), 55.2, ab, F.y, faceIn); crsObst(53.65, 56.75, F.back, F.at(0.74, false), F.floor);
    [52.35, 53.25, 57.15, 58.05].forEach(function (r, k) { var a = F.at(0.26, false); crsPlace(B, bookshelf(), r, a, F.y, faceIn); shelfBooks(B, crsFrame(r, a, F.y, faceIn), 11 + k); crsObst(r - 0.45, r + 0.45, F.back, F.at(0.44, false), F.floor); });
    // the front wall: two club chairs with a lamp table between them, bookcases either side, a print over them
    var af = F.at(F.span - 0.58, false); [54.35, 56.05].forEach(function (r) { crsPlace(B, armchair(), r, af, F.y, faceBack); crsObst(r - 0.45, r + 0.45, F.at(F.span - 1.03, false), F.front, F.floor); });
    var al = F.at(F.span - 0.42, false); crsPlace(B, lampTable(), 55.2, al, F.y, 0); lampLight(55.2, al, F.y, 0.95, 0.55, 3.2); crsObst(54.9, 55.5, F.at(F.span - 0.7, false), F.front, F.floor);
    [52.4, 53.3, 57.1, 58.0].forEach(function (r, k) { var a = F.at(F.span - 0.26, false); crsPlace(B, bookshelf(), r, a, F.y, faceBack); shelfBooks(B, crsFrame(r, a, F.y, faceBack), 23 + k); crsObst(r - 0.45, r + 0.45, F.at(F.span - 0.44, false), F.front, F.floor); });
    shelvesOnCorridor(B, F, 6, 1.0);
    roomPlants(B, rm, F, null);
  }
  function podLounge(B, rm, F) {          // the bridge's door in the middle of the outer glass: long sofas by the glass either side, the pods' screen, a coat rack
    var C = CRS, ad = P2.pod_dock.a * D2R, rb = C.r1 - 0.75, d = rm.doors[0];
    [-1, 1].forEach(function (s) { var ab = ad + s * 2.6 / rb; crsPlace(B, sofa(10, 2.0), rb, ab, F.y, ROT["in"]); crsObst(rb - 0.6, rb + 0.65, ab - 1.1 / rb, ab + 1.1 / rb, F.floor);
      crsPlace(B, walnutTable(1.1, 0.55), rb - 1.25, ab, F.y, 0); crsObst(rb - 1.55, rb - 0.95, ab - 0.6 / rb, ab + 0.6 / rb, F.floor); });
    var as = d - Math.sign(d - ad || 1) * 2.6 / C.rc;                                          // the screen on the corridor wall, clear of its door
    crsPlace(B, scoreboard(), C.rc + 0.12, as, F.y + 1.75, Math.PI); crsPic(B, C.rc + 0.12, as, F.y + 1.75, [0.064, 0, 0], [1, 0], 2.4, 1.35, ATL.podMap, MT.SCREEN, [1.0, 0]);
    var ac = d + Math.sign(d - ad || 1) * 1.25 / C.rc, rr = C.rc + 0.45;                       // the coat rack in the corner by the door
    crsPlace(B, coatRack(), rr, ac, F.y, 0); crsObst(rr - 0.35, rr + 0.35, ac - 0.35 / rr, ac + 0.35 / rr, F.floor);
    roomPlants(B, rm, F, null);
  }
  function coatRack() { return furn("coatrack", function (b) {                         // a turned oak stand on a cast base, hooks round its top
    latheOn(b, 0, 0, 0, [[0.0, 0.0], [0.27, 0.0], [0.27, 0.03], [0.05, 0.05], [0.03, 0.12], [0.022, 1.7], [0.04, 1.74], [0.0, 1.78]], 16, MT.WOOD, undefined, 1);
    for (var k = 0; k < 6; k++) { var t = k / 6 * 2 * Math.PI; leg(b, 0.02 * Math.cos(t), 1.58, 0.02 * Math.sin(t), 0.16 * Math.cos(t), 1.66, 0.16 * Math.sin(t), 0.012, MT.BRASS); }
  }); }

  function astroRoom(B, rm, F) {                                                      // Kepler: seats facing the sky screen, the planets overhead
    var C = CRS, fr = F.sgn > 0 ? 0 : Math.PI;
    [3.6, 5.2, 6.8, 8.4].forEach(function (d) { var a = F.at(d, true); [52.6, 54.4, 56.2, 58.0, 59.8].forEach(function (r) { crsPlace(B, armchair(), r, a, F.y, fr + Math.PI / 2 * (F.sgn > 0 ? -1 : 1) * 0 + (F.sgn > 0 ? -Math.PI / 2 : Math.PI / 2)); }); crsObst(52.0, 60.4, a - 0.5 / 56, a + 0.5 / 56, F.floor); });
    screenOn(B, F, 2.4, 1.35, ATL.podMap);
    var pa = F.at(F.span / 2, true), pm = crsFrame(55.8, pa, F.y + 3.2); B.add(planets(), pm);
    roomPlants(B, rm, F, null);
  }
  function plantRoom(B, rm, F) {                                                      // life support: tanks and cabinets
    var C = CRS;
    for (var d = 2.0; d < F.span - 1.5; d += 3.4) { var a = F.at(d, false); crsPlace(B, tank(0.75, 2.4), 58.6, a, F.y, 0); crsPlace(B, machine(2.2, 2.0, 0.9), 53.0, a, F.y, ROT.out); crsObst(52.4, 59.6, a - 1.2 / 56, a + 1.2 / 56, F.floor); }
    roomPlants(B, rm, F, null);
  }
  function storeRoom(B, rm, F) {
    for (var d = 1.5; d < F.span - 1.2; d += 2.3) { var a = F.at(d, false); [52.8, 56.0, 59.2].forEach(function (r) { crsPlace(B, rack(), r, a, F.y, Math.PI / 2); }); crsObst(52.2, 59.8, a - 0.4 / 56, a + 0.4 / 56, F.floor); }
  }
  function kitchenRoom(B, rm, F) {                                                    // steel counters along the walls, an island
    var C = CRS;
    [[C.r1 - 0.45, 0], [C.rc + 0.45, Math.PI]].forEach(function (w) { for (var d = 1.4; d < F.span - 1.2; d += 2.5) { var a = F.at(d, false); crsPlace(B, counter(2.4, 1), w[0], a, F.y, w[1]); } crsObst(w[0] - 0.4, w[0] + 0.4, F.a0, F.a1, F.floor); });
    var ia = F.at(F.span / 2, false); crsPlace(B, counter(4.0, 1), 55.8, ia, F.y, 0); crsObst(55.3, 56.3, ia - 2.1 / 56, ia + 2.1 / 56, F.floor);
    roomPlants(B, rm, F, null);
  }
  // ---- the dining hall: lunch for a hundred and more ----
  // the servery, len along x, 0.8 deep, its back at +z: a steel counter, hot wells of food, a tray rail on the diners' side,
  // a heat lamp over the wells on two posts (the glass guard apart)
  function servery(len) { return furn("servery" + len, function (b) {
    var h = len / 2, k = 0, food = [2, 4, 6, 7, 2, 7, 6, 4, 2]; b.box(-h, 0.1, -0.35, h, 0.9, 0.4, MT.STEEL); b.box(-h + 0.05, 0, -0.3, h - 0.05, 0.1, 0.35, MT.RUBBER);
    b.box(-h - 0.02, 0.9, -0.4, h + 0.02, 0.93, 0.42, MT.STEEL);
    for (var x = -h + 0.42; x < h - 0.3; x += 0.62, k++) { b.box(x - 0.27, 0.93, -0.12, x + 0.27, 0.935, 0.28, MT.ANOD); var nf = b.count(); b.box(x - 0.25, 0.925, -0.1, x + 0.25, 0.945, 0.26, MT.PLASTIC); b.tag(nf, food[k % food.length], null); }
    b.box(-h, 0.84, -0.66, h, 0.87, -0.42, MT.STEEL); [-h + 0.1, 0, h - 0.1].forEach(function (x) { b.box(x - 0.015, 0.6, -0.62, x + 0.015, 0.84, -0.6, MT.STEEL); });
    [-h + 0.05, h - 0.05].forEach(function (x) { b.box(x - 0.02, 0.93, 0.0, x + 0.02, 1.42, 0.04, MT.STEEL); });
    b.box(-h, 1.42, -0.08, h, 1.47, 0.24, MT.STEEL); var nl = b.count(); b.box(-h + 0.05, 1.415, -0.05, h - 0.05, 1.42, 0.2, MT.LIGHT); b.tag(nl, 1.0, 0);
  }); }
  // a steel trolley of trays, the cutlery in cups on top (len 0.9 along x, back at +z)
  function trayStand() { return furn("traystand", function (b) {
    b.box(-0.45, 0.05, -0.3, 0.45, 0.08, 0.3, MT.STEEL); b.box(-0.45, 0.9, -0.3, 0.45, 0.93, 0.3, MT.STEEL);
    [[-0.43, -0.28], [0.43, -0.28], [-0.43, 0.28], [0.43, 0.28]].forEach(function (c) { b.box(c[0] - 0.015, 0, c[1] - 0.015, c[0] + 0.015, 0.93, c[1] + 0.015, MT.STEEL); });
    var nt = b.count(); b.box(-0.42, 0.08, -0.26, 0.42, 0.62, 0.26, MT.PLASTIC); b.tag(nt, 1, null);
    for (var k = 0; k < 4; k++) { latheOn(b, -0.3 + k * 0.2, 0.93, 0, [[0.0, 0.0], [0.05, 0.0], [0.05, 0.14], [0.046, 0.14], [0.046, 0.005], [0.0, 0.005]], 14, MT.STEEL, 0);
      for (var j = 0; j < 7; j++) b.box(-0.3 + k * 0.2 - 0.004 + (j - 3) * 0.008, 0.95, -0.003, -0.3 + k * 0.2 + 0.004 + (j - 3) * 0.008, 1.12, 0.003, MT.STEEL); }
  }); }
  // a drum pendant: a linen shade 0.6 across lit from inside, hung low over a table
  function drumPendant() { return furn("drum", function (b) {
    var n0 = b.count(); latheOn(b, 0, 0, 0, [[0.3, 0.0], [0.3, 0.3], [0.295, 0.3], [0.295, 0.0]], 32, MT.FABRIC); b.tag(n0, 6, null);
    b.geo(addF2(new THREE.CircleGeometry(0.29, 28), 1.4, 0), T(0, 0.04, 0, Math.PI / 2, 0, 0), MT.LIGHT, 1);
  }); }
  function diningHall(B, rm, F) {                                                     // lunch for a hundred and more: the servery, long tables, a banquette, lamps
    var C = CRS, y = F.y, ceil = ceilY(rm, F.floor, 55.8), back = F.sgn > 0 ? ROT.plusA : ROT.minusA;
    // the servery along the back wall (the kitchen behind it), its glass guard, the trays
    var sa = F.at(0.5, false), Ms = crsFrame(54.0, sa, y, back); B.add(servery(6.0), Ms); contactShadow(servery(6.0), Ms); crsObst(50.9, 57.1, F.back, F.at(1.25, false), F.floor);
    glassPane(Ms, -2.95, 1.0, 2.95, 1.4, -0.12, 1);
    crsPlace(B, trayStand(), 57.8, F.at(0.6, false), y, back); crsObst(57.3, 58.3, F.back, F.at(1.0, false), F.floor);
    // six long oak tables across the room, twelve upholstered chairs at each, three drum lamps low over each
    [3.4, 6.0, 8.6, 11.2, 13.8, 16.4].forEach(function (d, ti) { var a = F.at(d, false), r = 54.5, len = 6.0;
      crsPlace(B, longTable(len), r, a, y, Math.PI / 2); crsObst(r - len / 2 - 0.1, r + len / 2 + 0.1, a - 0.55 / r, a + 0.55 / r, F.floor);
      for (var k = 0; k < 6; k++) { var rr = r - len / 2 + 0.5 + k * (len - 1.0) / 5; crsPlace(B, diningChair((k + ti) % 2 ? 8 : 5), rr, a + 0.84 / rr, y, Math.PI); crsPlace(B, diningChair((k + ti) % 2 ? 5 : 8), rr, a - 0.84 / rr, y, 0); }
      [r - 2.0, r, r + 2.0].forEach(function (rl) { var p = crsPt(rl, a); B.add(drumPendant(), crsFrame(rl, a, y + 2.3)); tubeAlong(B, [V3(p.x, y + 2.6, p.z), V3(p.x, ceil, p.z)], 0.004, 3, MT.STEEL); wLight(p.x, y + 2.25, p.z, LAMPC, 1.4, 6, [0, -1, 0], 0.8); });
      B.add(plantBuilder("orchid", 400 + ti), crsFrame(r + 0.8, a, y + 0.75, ti));
    });
    // along the outer wall a built-in banquette, a table for four before each pair of seats
    [[1.9, 4.9], [6.5, 18.6]].forEach(function (run) {
      var L = run[1] - run[0], ra = F.at((run[0] + run[1]) / 2, false), rb = C.r1 - 0.4, rt = rb - 0.95;
      crsPlace(B, banquette(+L.toFixed(2), 9), rb, ra, y, ROT["in"]); crsObst(rb - 0.35, C.r1, Math.min(F.at(run[0], false), F.at(run[1], false)), Math.max(F.at(run[0], false), F.at(run[1], false)), F.floor);
      for (var d = run[0] + 0.8; d < run[1] - 0.5; d += 1.65) { var a = F.at(d, false);
        crsPlace(B, squareTable(1.2, 0.75), rt, a, y, 0); crsObst(rt - 0.42, rt + 0.42, a - 0.65 / rt, a + 0.65 / rt, F.floor);
        [-0.32, 0.32].forEach(function (x) { crsPlace(B, diningChair(5), rt - 0.75, a + x / rt, y, OUT); }); }
    });
    roomPlants(B, rm, F, null);
  }
  function cafeRoom(B, rm, F) {                                                       // the café: the espresso bar along its glass to the corridor, the menu hung
    var C = CRS, ba = F.at(6.2, true), rbar = C.rc + 1.3, rb = C.r1 - 0.55, rt = rb - 1.05;    // over it, a long banquette on the outer wall, tables for four
    crsPlace(B, counter(4.4), rbar, ba, F.y, ROT.out); crsObst(rbar - 0.4, rbar + 0.4, ba - 2.3 / rbar, ba + 2.3 / rbar, F.floor);
    crsPlace(B, espressoMachine(), rbar, ba - 0.8 / rbar, F.y + 0.92, Math.PI); crsPlace(B, grinder(), rbar, ba + 0.6 / rbar, F.y + 0.92, Math.PI);
    var Mm = crsFrame(rbar + 0.1, ba, F.y + 2.6), mb = new Builder(); mb.box(-1.56, -0.5, -0.03, 1.56, 0.5, 0.0, MT.WOOD); mb.tag(0, null, 2); B.add(mb, Mm);
    wpic(B, Mm, [0, 0, 0.004], "x", [0, 1], 3.0, 0.9, ATL.menu, MT.ATLAS, [0, 3]);
    [-1.3, 1.3].forEach(function (x) { var p0 = new THREE.Vector3(x, 0.5, -0.015).applyMatrix4(Mm), p1 = new THREE.Vector3(x, F.y + C.hR - (F.y + 2.6), -0.015).applyMatrix4(Mm); tubeAlong(B, [p0, p1], 0.004, 3, MT.STEEL); });
    var ml = crsPt(rbar + 1.4, ba); wLight(ml.x, F.y + 3.4, ml.z, LAMPC, 0.9, 4, [0, -0.3, 0], 1);
    // the banquette: three long sofas end to end, a table for two in front of each pair of seats, an armchair across
    var d0 = 1.4, d1 = F.span - 1.4, ns = 3, Ls = +((d1 - d0) / ns - 0.06).toFixed(2);
    for (var k = 0; k < ns; k++) crsPlace(B, sofa(9, Ls), rb, F.at(d0 + (k + 0.5) * (d1 - d0) / ns, true), F.y, ROT["in"]);
    crsObst(rb - 0.5, C.r1, Math.min(F.at(d0, true), F.at(d1, true)), Math.max(F.at(d0, true), F.at(d1, true)), F.floor);
    for (var d = d0 + 0.85; d < d1 - 0.4; d += 1.75) { var a = F.at(d, true);
      crsPlace(B, squareTable(0.8, 0.8), rt, a, F.y, 0); crsObst(rt - 0.45, rt + 0.45, a - 0.45 / rt, a + 0.45 / rt, F.floor);
      crsPlace(B, diningChair(5), rt - 0.72, a, F.y, OUT); crsPlace(B, cup(), rt - 0.18, a, F.y + 0.755, 0); }
    [3.0, 9.6, 13.2].forEach(function (d) { if (d < F.span - 1.8) { tableForFour(B, 55.4, F.at(d, true), F.y, 1.0, d > 9 ? 4 : 2, F.floor); tableLamp(55.4, F.at(d, true)); } });
    // the communal table in front of the bar: oak for eight, two lamps over it
    var ca = F.at(6.3, true), cr = 55.6; crsPlace(B, longTable(3.2), cr, ca, F.y, 0); crsObst(cr - 1.35, cr + 1.35, ca - 1.9 / cr, ca + 1.9 / cr, F.floor);
    [-1.2, -0.4, 0.4, 1.2].forEach(function (x, k) { crsPlace(B, diningChair(k % 2 ? 5 : 8), cr + 0.8, ca + x / cr, F.y, IN); crsPlace(B, diningChair(k % 2 ? 8 : 5), cr - 0.8, ca + x / cr, F.y, OUT); });
    [-0.8, 0.8].forEach(function (x) { tableLamp(cr, ca + x / cr); });
    // the lounge by the corridor's glass, past the bar: a sofa backed onto the glass, a walnut table, two club chairs, a rug, lamps
    var la = F.at(11.6, true), rs = C.rc + 0.6; rugAt(B, rs + 1.3, la, F.y, 3.6, 3.0, 2);
    crsPlace(B, sofa(10, 2.6), rs, la, F.y, ROT.out); crsObst(rs - 0.5, rs + 0.5, la - 1.35 / rs, la + 1.35 / rs, F.floor);
    crsPlace(B, walnutTable(1.2, 0.6), rs + 1.3, la, F.y, 0); crsObst(rs + 0.95, rs + 1.65, la - 0.65 / rs, la + 0.65 / rs, F.floor);
    [-0.65, 0.65].forEach(function (x) { var aa = la + x / (rs + 2.65); crsPlace(B, armchair(), rs + 2.65, aa, F.y, ROT["in"]); crsObst(rs + 2.2, rs + 3.1, aa - 0.45 / (rs + 2.65), aa + 0.45 / (rs + 2.65), F.floor); });
    var lt = F.at(13.35, true); crsPlace(B, lampTable(), rs, lt, F.y, 0); lampLight(rs, lt, F.y, 0.95, 0.55, 3.2); crsObst(rs - 0.28, rs + 0.28, lt - 0.28 / rs, lt + 0.28 / rs, F.floor);
    var lf = F.at(9.9, true); crsPlace(B, floorLamp(), rs - 0.1, lf, F.y, 0); lampLight(rs - 0.1, lf, F.y, 1.4, 0.7, 3.6); crsObst(rs - 0.3, rs + 0.1, lf - 0.2 / rs, lf + 0.2 / rs, F.floor);
    for (var d2 = d0 + 0.85; d2 < d1 - 0.4; d2 += 1.75) tableLamp(rt, F.at(d2, true));
    [-1.5, 0, 1.5].forEach(function (x) { tableLamp(rbar + 0.03, ba + x / rbar, 1.8); });           // low over the bar, under the menu
    // a brass cone on a long cable over each table, warm, as low as a café's lights hang (none in a skylight's well)
    function tableLamp(r, a, h) {
      if (inSkylight(r, a, 0.3)) return;
      var y = F.y + (h || 2.2), p = crsPt(r, a); B.add(pendantCone(), crsFrame(r, a, y));
      tubeAlong(B, [new THREE.Vector3(p.x, y + 0.28, p.z), new THREE.Vector3(p.x, F.y + C.hR, p.z)], 0.004, 3, MT.STEEL);
      wLight(p.x, y - 0.1, p.z, LAMPC, 1.3, 5.5, [0, -1, 0], 0.7);
    }
    roomPlants(B, rm, F, [rt, F.at(d0 + 0.85 + 1.75, true), 0.755]);
  }
  function assemblyHall(B, rm, F) {                                                   // a low stage, rows of upholstered chairs
    var C = CRS, st = F.at(1.6, true); crsPlace(B, stagePlatform(7.0, 3.0), 55.8, st, F.y, F.sgn > 0 ? 0 : Math.PI); crsObst(52.2, 59.4, st - 1.6 / 55.8, st + 1.6 / 55.8, F.floor);
    for (var d = 5.4; d < F.span - 2.0; d += 1.25) { var a = F.at(d, true); for (var r = 51.6; r < 60.4; r += 0.75) { if (Math.abs(r - 55.8) < 0.6) continue; crsPlace(B, officeChair(), r, a, F.y, F.sgn > 0 ? Math.PI : 0); } crsObst(51.2, 55.2, a - 0.35 / 53, a + 0.35 / 53, F.floor); crsObst(56.4, 60.8, a - 0.35 / 58, a + 0.35 / 58, F.floor); }
    roomPlants(B, rm, F, null);
  }
  function lockerRoom(B, rm, F) {
    var C = CRS; for (var d = 0.6; d < F.span - 0.6; d += 3.4) { var a = F.at(d + 1.6, false); crsPlace(B, lockerBank(8), C.r1 - 0.3, a, F.y, 0); }
    crsObst(C.r1 - 0.8, C.r1, F.a0, F.a1, F.floor); crsPlace(B, basinCounter(3.6), C.rc + 0.45, F.mid, F.y, ROT.out); crsObst(C.rc, C.rc + 0.8, F.mid - 1.85 / 50, F.mid + 1.85 / 50, F.floor);
    roomPlants(B, rm, F, null);
  }
  function gateHall(B, rm, F) {                                                       // the reception desk by the garden glass, benches, tall plants
    var C = CRS, D = D2R, da = 168.6 * D; crsPlace(B, receptionDesk(), 48.6, da, F.y, OUT); crsObst(47.9, 49.3, da - 2.2 / 48.6, da + 2.2 / 48.6, F.floor);
    crsPlace(B, officeChair(), 49.5, da - 0.8 / 49.5, F.y, OUT); crsPlace(B, officeChair(), 49.5, da + 0.8 / 49.5, F.y, OUT);
    [[57.6, 172.5], [57.6, 182.5], [53.0, 183.0]].forEach(function (b) { var a = b[1] * D; crsPlace(B, gardenBench(2.4), b[0], a, F.y, 0); crsObst(b[0] - 0.35, b[0] + 0.35, a - 1.3 / b[0], a + 1.3 / b[0], F.floor); });
    timetableBoards(B); directoryScreen(B);
    roomPlants(B, rm, F, null);
  }
  function underGate(B, rm, F) {
    var D = D2R; [[57.8, 170.0], [57.8, 180.0]].forEach(function (b) { var a = b[1] * D; crsPlace(B, gardenBench(2.4), b[0], a, F.y, 0); crsObst(b[0] - 0.35, b[0] + 0.35, a - 1.3 / b[0], a + 1.3 / b[0], F.floor); });
    roomPlants(B, rm, F, null);
  }
  // the Ring's rooms beyond the Crescent's kinds
  var RING_FURNISH = { seminar: seminarRoom, library: libraryRoom, reading: readingRoom, lounge: podLounge, physics: physicsLab, maker: makerSpace, astro: astroRoom,
                       plant: plantRoom, store: storeRoom, kitchen: kitchenRoom, dining: diningHall, cafe: cafeRoom, assembly: assemblyHall, art: artStudio, music: musicRoom,
                       clinic: clinicRoom, gate: gateHall };
