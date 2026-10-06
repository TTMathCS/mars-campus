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
  function grandPiano() { return furn("piano", function (b) {                         // 1.55 wide (x), 2.2 long (z), keys at -z
    var sh = new THREE.Shape(); sh.moveTo(-0.77, -1.1); sh.lineTo(0.77, -1.1); sh.lineTo(0.77, -0.05); sh.quadraticCurveTo(0.74, 1.1, 0.05, 1.1); sh.quadraticCurveTo(-0.62, 1.1, -0.77, 0.35); sh.lineTo(-0.77, -1.1);
    var g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 12 }); g.rotateX(Math.PI / 2); g.translate(0, 1.0, 0); b.geo(g, new THREE.Matrix4(), MT.ANOD, 1);
    b.box(-0.74, 0.7, -1.32, 0.74, 0.76, -1.1, MT.CERAMIC); b.box(-0.74, 0.76, -1.16, 0.74, 0.79, -1.1, MT.ANOD);
    [[-0.62, -0.95], [0.62, -0.95], [0.1, 0.8]].forEach(function (c) { b.box(c[0] - 0.05, 0, c[1] - 0.05, c[0] + 0.05, 0.7, c[1] + 0.05, MT.ANOD); });
    b.box(-0.45, 0, -1.75, 0.45, 0.5, -1.45, MT.LEATHER);
  }); }
  function bed() { return furn("bed", function (b) {                                  // the clinic's couch, 2.0 long (x)
    b.box(-1.0, 0.0, -0.45, 1.0, 0.55, 0.45, MT.ANOD); var n0 = b.count(); b.box(-0.98, 0.55, -0.43, 0.98, 0.7, 0.43, MT.FABRIC); b.tag(n0, 5, null); b.box(0.6, 0.7, -0.4, 0.95, 0.82, 0.4, MT.FABRIC);
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
  function diningChair(col) { return furn("dchair" + col, function (b) {             // facing +x
    var n0 = b.count();
    b.box(-0.27, 0.38, -0.29, 0.29, 0.47, 0.29, MT.FABRIC); b.box(-0.31, 0.4, -0.31, -0.19, 0.9, 0.31, MT.FABRIC);
    b.box(-0.26, 0.4, -0.31, 0.24, 0.65, -0.22, MT.FABRIC); b.box(-0.26, 0.4, 0.22, 0.24, 0.65, 0.31, MT.FABRIC);
    b.tag(n0, col, null);
    [[-0.26, -0.27], [0.26, -0.27], [-0.26, 0.27], [0.26, 0.27]].forEach(function (c) { var m = b.count(); leg(b, c[0], 0.39, c[1], c[0] * 1.07, 0, c[1] * 1.07, 0.019, MT.WOOD); kindTag(b, m, 2); });
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
  function seminarRoom(B, rm, F) {                                                    // Socrates: one long table for 20, the screen, shelves
    var len = Math.min(9.6, F.span - 4.4), r = 55.9, a = F.at(F.span / 2 + 0.6, true), n = Math.round(len / 1.0);
    crsPlace(B, longTable(len), r, a, F.y, 0); crsObst(r - 1.4, r + 1.4, a - (len / 2 + 0.3) / r, a + (len / 2 + 0.3) / r, F.floor);
    for (var k = 0; k < n; k++) { var x = (k - (n - 1) / 2) * len / n; [[r + 0.85, IN], [r - 0.85, OUT]].forEach(function (c) { crsPlace(B, officeChair(), c[0], a + x / r, F.y, c[1]); }); }
    screenOn(B, F, 2.4, 1.35, ATL.scrSem); shelvesOnCorridor(B, F, 5, 1.0);
    roomPlants(B, rm, F, [r, a, 0.75]);
  }
  function libraryRoom(B, rm, F) {                                                    // the library: shelves along the outer wall, tables, the desk
    var C = CRS, rs = C.r1 - 0.35;
    for (var d = 0.9; d < F.span - 0.6; d += 0.92) { var a = F.at(d, false); crsPlace(B, bookshelf(), rs, a, F.y, 0); crsObst(rs - 0.25, rs + 0.25, a - 0.46 / rs, a + 0.46 / rs, F.floor); }
    [[53.6, 3.6], [53.6, 8.2], [57.2, 3.6], [57.2, 8.2], [53.6, 12.8], [57.2, 12.8]].forEach(function (t) {
      if (t[1] > F.span - 2.2) return; var a = F.at(t[1], false); crsPlace(B, longTable(2.4), t[0], a, F.y, 0); crsObst(t[0] - 0.95, t[0] + 0.95, a - 1.3 / t[0], a + 1.3 / t[0], F.floor);
      [-0.6, 0.6].forEach(function (x) { crsPlace(B, diningChair(1), t[0] + 0.82, a + x / t[0], F.y, IN); crsPlace(B, diningChair(1), t[0] - 0.82, a + x / t[0], F.y, OUT); });
      crsPlace(B, bankerLamp(), t[0], a, F.y + 0.75, 0);
    });
    var da = F.at(1.6, true); crsPlace(B, teacherDesk(), C.rc + 1.5, da, F.y, F.sgn > 0 ? Math.PI : 0); crsObst(C.rc + 0.65, C.rc + 2.35, da - 0.45 / 51, da + 0.45 / 51, F.floor);
    roomPlants(B, rm, F, [C.rc + 1.5, da, 0.77]);
  }
  function readingRoom(B, rm, F) {                                                    // deep armchairs and long sofas, lamps, rugs
    var C = CRS, ra = C.r1 - 0.7;
    [F.span * 0.3, F.span * 0.72].forEach(function (d, i) {
      var a = F.at(d, false); rugAt(B, ra - 2.0, a, F.y, 4.2, 3.4, i ? 2 : 3); crsPlace(B, sofa(i ? 1 : 3, 3.4), ra, a, F.y, ROT["in"]); crsPlace(B, coffeeTable(1.6), ra - 1.5, a, F.y, 0);
      [-1.3, 1.3].forEach(function (x) { crsPlace(B, armchair(), ra - 3.0, a + x / ra, F.y, ROT.out); crsPlace(B, floorLamp(), ra - 0.2, a + (x * 1.5) / ra, F.y, 0); });
      crsObst(ra - 3.6, ra + 0.5, a - 2.2 / ra, a + 2.2 / ra, F.floor);
    });
    shelvesOnCorridor(B, F, 6, 1.0);
    roomPlants(B, rm, F, null);
  }
  function podLounge(B, rm, F) {                                                      // benches to wait on, the pods' screen, coats
    var C = CRS, a = F.at(F.span / 2, false);
    crsPlace(B, sofa(2, 3.0), C.r1 - 0.7, a, F.y, ROT["in"]); crsObst(C.r1 - 1.3, C.r1 - 0.1, a - 1.6 / 61, a + 1.6 / 61, F.floor);
    crsPlace(B, scoreboard(), C.rc + 0.12, a, F.y + 1.75, Math.PI); crsPic(B, C.rc + 0.12, a, F.y + 1.75, [0.064, 0, 0], [1, 0], 2.4, 1.35, ATL.podMap, MT.SCREEN, [1.0, 0]);
    roomPlants(B, rm, F, null);
  }
  function physicsLab(B, rm, F) {                                                     // Newton: six benches, a long pendulum, the board
    var C = CRS;
    [3.2, 6.6, 10.0].forEach(function (d) { var a = F.at(d, true); [53.4, 58.0].forEach(function (r) {
      crsPlace(B, workbench(), r, a, F.y, 0); crsObst(r - 0.6, r + 0.6, a - 1.25 / r, a + 1.25 / r, F.floor);
      [-0.7, 0.7].forEach(function (x) { crsPlace(B, stool(), r - 0.7, a + x / r, F.y, 0); });
    }); });
    var pa = F.at(F.span - 2.6, true), pp = crsPt(55.8, pa); tubeAlong(B, [new THREE.Vector3(pp.x, F.y + C.hR, pp.z), new THREE.Vector3(pp.x, F.y + 0.9, pp.z)], 0.004, 3, MT.STEEL);
    B.geo(new THREE.SphereGeometry(0.15, 18, 12), T(pp.x, F.y + 0.75, pp.z), MT.BRASS, 1); crsObst(55.2, 56.4, pa - 0.6 / 55.8, pa + 0.6 / 55.8, F.floor);
    boardOn(B, F, 4.2, ATL.wb, MT.ATLAS, [0, 2]);
    roomPlants(B, rm, F, null);
  }
  function makerSpace(B, rm, F) {                                                     // workbenches, 3D printers on a long counter, racks
    var C = CRS;
    [3.4, 7.0, 10.6].forEach(function (d) { var a = F.at(d, true); [53.6, 57.6].forEach(function (r) { crsPlace(B, workbench(), r, a, F.y, 0); crsObst(r - 0.6, r + 0.6, a - 1.25 / r, a + 1.25 / r, F.floor); crsPlace(B, stool(), r - 0.75, a, F.y, 0); }); });
    var ca = F.at(F.span - 3.0, true); crsPlace(B, counter(4.0), C.rc + 0.45, ca, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.85, ca - 2.1 / 50, ca + 2.1 / 50, F.floor);
    [-1.3, 0, 1.3].forEach(function (x) { crsPlace(B, printer3d(), C.rc + 0.45, ca + x / 50, F.y + 0.92, 0); });
    var ra = F.at(1.2, false); crsPlace(B, rack(), C.r1 - 0.5, ra, F.y, 0); crsObst(C.r1 - 0.85, C.r1 - 0.15, ra - 1.05 / 61, ra + 1.05 / 61, F.floor);
    roomPlants(B, rm, F, null);
  }
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
  function diningHall(B, rm, F) {                                                     // long tables for 120 with upholstered chairs
    var C = CRS;
    for (var d = 2.6; d < F.span - 2.2; d += 3.3) { var a = F.at(d, false);
      [53.0, 58.2].forEach(function (r) { crsPlace(B, longTable(4.2), r, a, F.y, Math.PI / 2); crsObst(r - 2.2, r + 2.2, a - 0.95 / r, a + 0.95 / r, F.floor);
        for (var k = 0; k < 4; k++) { var rr = r - 1.6 + k * 1.05; crsPlace(B, diningChair(k % 2 ? 4 : 5), rr, a + 0.82 / r, F.y, Math.PI); crsPlace(B, diningChair(k % 2 ? 5 : 4), rr, a - 0.82 / r, F.y, 0); } });
    }
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
    for (var k = 0; k < ns; k++) crsPlace(B, sofa(3, Ls), rb, F.at(d0 + (k + 0.5) * (d1 - d0) / ns, true), F.y, ROT["in"]);
    crsObst(rb - 0.5, C.r1, Math.min(F.at(d0, true), F.at(d1, true)), Math.max(F.at(d0, true), F.at(d1, true)), F.floor);
    for (var d = d0 + 0.85; d < d1 - 0.4; d += 1.75) { var a = F.at(d, true);
      crsPlace(B, squareTable(0.8, 0.8), rt, a, F.y, 0); crsObst(rt - 0.45, rt + 0.45, a - 0.45 / rt, a + 0.45 / rt, F.floor);
      crsPlace(B, diningChair(5), rt - 0.72, a, F.y, OUT); crsPlace(B, cup(), rt - 0.18, a, F.y + 0.755, 0); }
    [3.0, 9.6, 13.2].forEach(function (d) { if (d < F.span - 1.8) { tableForFour(B, 55.4, F.at(d, true), F.y, 1.0, d > 9 ? 4 : 2, F.floor); tableLamp(55.4, F.at(d, true)); } });
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
  function artStudio(B, rm, F) {                                                      // easels round a long table, the sink
    var C = CRS, ta = F.at(F.span / 2, true); crsPlace(B, longTable(6.0), 55.8, ta, F.y, 0); crsObst(55.0, 56.6, ta - 3.1 / 55.8, ta + 3.1 / 55.8, F.floor);
    for (var k = 0; k < 6; k++) { var x = -2.5 + k; [[57.6, IN], [54.0, OUT]].forEach(function (c) { crsPlace(B, easel(), c[0], ta + x / 55.8, F.y, c[1] - Math.PI / 2); crsPlace(B, stool(), c[0] + (c[1] === IN ? 0.6 : -0.6), ta + x / 55.8, F.y, 0); }); }
    var sa = F.at(1.0, false); crsPlace(B, counter(3.0), C.rc + 0.45, sa, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.8, sa - 1.6 / 50, sa + 1.6 / 50, F.floor);
    roomPlants(B, rm, F, null);
  }
  function musicRoom(B, rm, F) {                                                      // the grand piano, chairs and stands for the choir
    var pa = F.at(2.4, true); crsPlace(B, grandPiano(), 55.8, pa, F.y, F.sgn > 0 ? -Math.PI / 2 : Math.PI / 2); crsObst(54.6, 57.0, pa - 1.6 / 55.8, pa + 1.6 / 55.8, F.floor);
    for (var d = 5.2; d < F.span - 1.4; d += 1.6) { var a = F.at(d, true); [52.6, 54.2, 57.4, 59.0].forEach(function (r) { crsPlace(B, schoolChair(5), r, a, F.y, F.sgn > 0 ? Math.PI : 0); }); }
    shelvesOnCorridor(B, F, 3, 1.0);
    roomPlants(B, rm, F, null);
  }
  function clinicRoom(B, rm, F) {                                                     // the nurse's couch, a desk, the counsellor's armchairs
    var C = CRS, ba = F.at(1.8, false); crsPlace(B, bed(), C.r1 - 1.2, ba, F.y, 0); crsObst(C.r1 - 1.7, C.r1 - 0.7, ba - 1.05 / 61, ba + 1.05 / 61, F.floor);
    var da = F.at(4.6, false); crsPlace(B, teacherDesk(), C.rc + 1.4, da, F.y, F.sgn > 0 ? Math.PI : 0); crsPlace(B, officeChair(), C.rc + 0.6, da, F.y, OUT); crsObst(C.rc + 0.5, C.rc + 2.3, da - 0.45 / 51, da + 0.45 / 51, F.floor);
    var aa = F.at(F.span - 2.2, false); [-0.7, 0.7].forEach(function (x) { crsPlace(B, armchair(), 57.0, aa + x / 57, F.y, x > 0 ? ROT.plusA : ROT.minusA); }); crsPlace(B, sideTable(), 57.0, aa, F.y, 0);
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
