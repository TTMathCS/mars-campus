  /* ===================== Phase 2: the Crescent (T-06), the Academy ===================== */
  // Two floors in a crescent round the back of the dome (P2.crescent): the upper floor level with the balcony and the
  // back terrace, the lower floor 4.2 m down, opening onto a sunken court dug along the whole garden face. A corridor on
  // the dome side, the rooms on the garden side, a hall two storeys tall with the stair in the middle; flat ceilings.
  // Polar frame round the dome's centre: r out from the centre, a in radians from straight behind, positive toward +lat.
  var CRS = null, CRS_GLASS = new Builder();
  // the new quarter's holes in the terrain (exact shapes, tested in the terrain shaders and the bake) and its bake domains
  var P2CUTS = [], P2DOMAINS = [];
  function p2Sector(clat, crad, r0, r1, a0, a1) { P2CUTS.push({ p: [clat, crad, r0, r1], q: [a0, a1, 0, 0] }); }
  function p2Box(lat0, rad0, lat1, rad1) { P2CUTS.push({ p: [lat0, rad0, lat1, rad1], q: [0, 0, 1, 0] }); }
  function p2CutApply() { P2CUTS.slice(0, 16).forEach(function (c, i) { U.uCutP.value[i].fromArray(c.p); U.uCutQ.value[i].fromArray(c.q); }); U.uCutN.value = Math.min(16, P2CUTS.length); }
  function crsPt(r, a) { return palPol(r, Math.PI - a); }
  function crsLoc(x, z) { var o = palLoc(x, z, {}); return { r: o.r, a: Math.atan2(o.lat, -o.rad), lat: o.lat, rad: o.rad }; }
  function crsInit() {
    if (CRS) return CRS;
    var C = P2.crescent, yU = PALY.B, yL = PALY.B + C.lower;
    CRS = { r0: C.r0, r1: C.r1, rc: C.rc, a0: C.a0 * D2R, a1: C.a1 * D2R, yU: yU, yL: yL, hR: 3.0, hC: 2.8, wall: 0.15,
            hallA: 6 * D2R, landR: 51.4, stairA: 3.0 * D2R, stairR1: 58.2, stairW: 2.4, endA: 1.6 * D2R,        // endA: the lower passages to the exits
            roofIn: C.r0 - 1.2, roofOut: C.r1 + 1.6, roofY: 3.75, roofRise: 0.85, roofT: 0.3,
            court: { r1: 66.5, aEnd: 54 * D2R, latHalf: 36.0, radFar: -84.0, stairA0: 51.5 * D2R }, rooms: C.rooms };
    CRS.nSteps = Math.round((yU - yL) / 0.175); CRS.stepH = (yU - yL) / CRS.nSteps;
    return CRS;
  }
  function crsRoofY(r) { var C = CRS, t = clamp((r - C.roofIn) / (C.roofOut - C.roofIn), 0, 1); return C.yU + C.roofY + C.roofRise * Math.pow(Math.sin(Math.PI * t), 0.8); }
  // a room's angles; on the lower floor the end rooms stop short of the passages to the exits
  function rmA0(rm) { var a = rm.a[0] * D2R; return (rm.floor === "lower" && rm.a[0] <= P2.crescent.a0 + 1e-6) ? a + CRS.endA : a; }
  function rmA1(rm) { var a = rm.a[1] * D2R; return (rm.floor === "lower" && rm.a[1] >= P2.crescent.a1 - 1e-6) ? a - CRS.endA : a; }
  // the room (from P2) at angle a on a floor; the hall spans both floors
  function crsRoomAt(a, floor) { var deg = a * R2D, R = CRS.rooms; for (var i = 0; i < R.length; i++) { var rm = R[i]; if (rm.floor !== floor || rm.band) continue; if (deg >= rm.a[0] && deg < rm.a[1]) return rm; } return null; }
  var CRS_FLOOR = { "class": [MT.WOOD, 0], study: [MT.WOOD, 0], lab: [MT.TERRAZZO, 0], compete: [MT.WOOD, 0], games: [MT.WOOD, 0], lounge: [MT.WOOD, 0], staff: [MT.WOOD, 0], service: [MT.TERRAZZO, 0], move: [MT.TERRAZZO, 0] };
  var CRS_WALL = { "class": 0, study: 0, lab: 0, compete: 1, games: 2, lounge: 3, staff: 1, service: 0, move: 0 };
  var CRS_TILES = { "class": 1, study: 1, lab: 1, compete: 1, games: 1, staff: 1 };

  // ---- surfaces in the polar frame ----
  function arcWall(B, r, a0, a1, y0, y1, mat, g2, out, f2x) {          // a curved wall at radius r, facing out (+1) or in (-1)
    var n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r / 0.5));
    B.surf(n, 1, function (i, j, q) { var a = lerp(a0, a1, i / n), p = crsPt(r, a), d = crsPt(1, a), y = j ? y1 : y0;
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * out, 0, (d.z - PAL.c.z) * out]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = f2x === undefined ? 99 : f2x; q.f2[1] = g2 || 0; q.m = mat; });
  }
  function radWall(B, a, r0, r1, y0, y1, mat, g2, side, f2x) {          // a flat wall along a radius at angle a, facing +a (+1) or -a (-1)
    var n = Math.max(2, Math.ceil((r1 - r0) / 0.5)), t = crsPt(1, a + Math.PI / 2), tn = [(t.x - PAL.c.x) * side, 0, (t.z - PAL.c.z) * side];
    B.surf(n, 1, function (i, j, q) { var r = lerp(r0, r1, i / n), p = crsPt(r, a), y = j ? y1 : y0;
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = tn; q.f[0] = r; q.f[1] = y; q.f2[0] = f2x === undefined ? 99 : f2x; q.f2[1] = g2 || 0; q.m = mat; });
  }
  function flat(B, r0, r1, a0, a1, y, mat, g2, up) {                    // a level floor (up) or ceiling (down)
    var nr = Math.max(2, Math.ceil((r1 - r0) / 0.6)), na = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r1 / 0.6));
    B.surf(na, nr, function (i, j, q) { var a = lerp(a0, a1, i / na), r = lerp(r0, r1, j / nr), p = crsPt(r, a);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, up ? 1 : -1, 0]; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 0; q.f2[1] = g2 || 0; q.m = mat; });
  }
  // a local frame at (r, a): x along increasing a, y up, z outward
  function crsFrame(r, a, y, rot) {
    var p = crsPt(r, a), t = crsPt(1, a + Math.PI / 2), o = crsPt(1, a), X = new THREE.Vector3(t.x - PAL.c.x, 0, t.z - PAL.c.z).normalize(), Z = new THREE.Vector3(o.x - PAL.c.x, 0, o.z - PAL.c.z).normalize();
    var M = new THREE.Matrix4().makeBasis(X, new THREE.Vector3(0, 1, 0), Z).setPosition(p.x, y, p.z);
    if (rot) M.multiply(new THREE.Matrix4().makeRotationY(rot));
    return M;
  }

  // ---- glass fronts: panes between aluminium mullions every 1.5 m, a sill and a head rail; doors where asked ----
  function glassFront(B, r, a0, a1, y0, y1, out, doors) {
    var C = CRS, gaps = (doors || []).map(function (d) { return [d - 1.33 / r, d + 1.33 / r]; });
    function inGap(a) { for (var k = 0; k < gaps.length; k++) if (a > gaps[k][0] && a < gaps[k][1]) return true; return false; }
    var segs = [], cur = a0; gaps.slice().sort(function (p, q) { return p[0] - q[0]; }).forEach(function (g) { segs.push([cur, g[0]]); cur = g[1]; }); segs.push([cur, a1]);
    segs.forEach(function (sg) {
      if (sg[1] - sg[0] < 1e-3) return;
      var n = Math.max(2, Math.ceil((sg[1] - sg[0]) * r / 0.5));
      CRS_GLASS.surf(n, 1, function (i, j, q) { var a = lerp(sg[0], sg[1], i / n), p = crsPt(r, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = j ? y1 : y0 + 0.08; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * out, 0, (d.z - PAL.c.z) * out]; q.f[0] = a * r; q.f[1] = q.p[1]; q.f2[0] = j ? y1 - y0 : 0.08; q.f2[1] = 1; q.m = 0; });
    });
    arcWall(B, r + 0.05 * out, a0, a1, y0, y0 + 0.08, MT.ANOD, 0, out, 3); arcWall(B, r - 0.05 * out, a0, a1, y0, y0 + 0.08, MT.ANOD, 0, -out, 3);   // sill
    arcWall(B, r + 0.05 * out, a0, a1, y1 - 0.1, y1, MT.ANOD, 0, out, 3); arcWall(B, r - 0.05 * out, a0, a1, y1 - 0.1, y1, MT.ANOD, 0, -out, 3);   // head
    var nm = Math.max(1, Math.round((a1 - a0) * r / 1.5));
    for (var k = 0; k <= nm; k++) {
      var a = lerp(a0, a1, k / nm); if (inGap(a)) continue;
      var mb = new Builder(); mb.box(-0.035, 0, -0.07, 0.035, y1 - y0, 0.07, MT.ANOD); mb.tag(0, 3, null); B.add(mb, crsFrame(r, a, y0));
    }
    (doors || []).forEach(function (d) { crsSlidingDoor(B, r, d, y0, out, y1); });
  }
  // sliding glass doors in a front at (r, a): frame, transom glass, the two leaves (opened by the frame loop)
  function crsSlidingDoor(B, r, a, y0, out, yTop) {
    var M = crsFrame(r, a, y0), hD = 2.62, fr = new Builder();
    fr.box(-1.33, 0, -0.07, -1.2, yTop - y0, 0.08, MT.ANOD); fr.box(1.2, 0, -0.07, 1.33, yTop - y0, 0.08, MT.ANOD);
    fr.box(-1.25, hD, -0.09, 1.25, hD + 0.16, 0.1, MT.ANOD); fr.box(-1.3, -0.03, -0.14, 1.3, 0.006, 0.14, MT.STEEL); fr.tag(0, 3, null); B.add(fr, M);
    if (yTop - y0 > hD + 0.3) CRS_GLASS.surf(2, 1, function (i, j, q) { var aa = a + (-1.2 + 2.4 * i / 2) / r, p = crsPt(r, aa), d = crsPt(1, aa); q.p[0] = p.x; q.p[1] = j ? yTop : y0 + hD + 0.16; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * out, 0, (d.z - PAL.c.z) * out]; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    var p = crsPt(r, a), t = crsPt(1, a + Math.PI / 2), dir = { x: t.x - PAL.c.x, z: t.z - PAL.c.z };
    var door = { c: { x: p.x, z: p.z }, y: y0, dir: dir, open: 0, leaves: [], M: M.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.12 * out)) };
    [-1, 1].forEach(function (side) {
      var lf = new Builder(), x0 = side < 0 ? -1.22 : 0.0, x1 = side < 0 ? 0.0 : 1.22;
      lf.box(x0, 0, -0.03, x1, 0.09, 0.03, MT.ANOD); lf.box(x0, 2.5, -0.03, x1, 2.58, 0.03, MT.ANOD);
      lf.box(x0, 0.09, -0.03, x0 + 0.06, 2.5, 0.03, MT.ANOD); lf.box(x1 - 0.06, 0.09, -0.03, x1, 2.5, 0.03, MT.ANOD);
      var hx = side < 0 ? x1 - 0.09 : x0 + 0.05; lf.box(hx, 0.95, 0.03, hx + 0.04, 1.3, 0.07, MT.STEEL); lf.box(hx, 0.95, -0.07, hx + 0.04, 1.3, -0.03, MT.STEEL);
      lf.tag(0, 3, null);
      var gl = new Builder(); gl.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0 + 0.06, x1 - 0.06, i); q.p[1] = lerp(0.09, 2.5, j); q.p[2] = 0; q.nn = [0, 0, -1]; q.f2[0] = lerp(0.09, 2.5, j); q.f2[1] = 2; q.m = 0; });
      door.leaves.push({ side: side, frame: lf, glass: gl });
    });
    DOORS.push(door); CRS.doors = (CRS.doors || []).concat([{ r: r, a: a, y: y0 }]);
  }
  // an inside doorway in a curved partition at (r, a): the opening's casing and a door leaf standing open into the room
  function crsDoorway(B, r, a, y0, intoOut) {
    var M = crsFrame(r, a, y0), cs = new Builder(), w = 1.0, h = 2.15;
    cs.box(-w / 2 - 0.07, 0, -0.1, -w / 2, h + 0.07, 0.1, MT.WOOD); cs.box(w / 2, 0, -0.1, w / 2 + 0.07, h + 0.07, 0.1, MT.WOOD); cs.box(-w / 2 - 0.07, h, -0.1, w / 2 + 0.07, h + 0.07, 0.1, MT.WOOD);
    cs.tag(0, null, 2);
    var lf = new Builder(); lf.box(0, 0.01, 0, 0.04, h - 0.01, w - 0.02, MT.WOOD); lf.tag(0, null, 1);
    lf.box(-0.05, 1.0, w - 0.12, 0.0, 1.03, w - 0.08, MT.STEEL); lf.box(0.04, 1.0, w - 0.12, 0.09, 1.03, w - 0.08, MT.STEEL);
    cs.add(lf, new THREE.Matrix4().makeTranslation(w / 2 - 0.02, 0, intoOut > 0 ? 0.1 : -0.1 - (w - 0.02)));
    B.add(cs, M);
  }

  // ---- the building ----
  function crescentBuild(B, W) {
    var C0 = crsInit(), K0 = C0.court, ea = C0.a1 + 0.03 / C0.r0;
    p2Sector(0, 0, C0.r0 - 0.03, C0.r1 + 0.08, -ea, ea);                 // the building
    p2Sector(0, 0, C0.r1, K0.r1, -K0.aEnd, K0.aEnd);                      // the court along the garden front
    p2Box(-K0.latHalf, K0.radFar, K0.latHalf, -48.0);                      // the open court down the slope
    p2CutApply();
    P2DOMAINS.push({ l0: -48, l1: 48, r0: -86, r1: -28, y0: PALY.B - 5.6, y1: PALY.B + 5.6 });
    var C = crsInit(), r0 = C.r0, r1 = C.r1, rc = C.rc, a0 = C.a0, a1 = C.a1, yU = C.yU, yL = C.yL, hw = C.wall / 2, hA = C.hallA;
    // floors: the upper floor except over the hall's void; the lower floor; the corridors' terrazzo, the rooms' own floors
    W.zone = ZONE.WING;
    [["upper", yU], ["lower", yL]].forEach(function (fl) {
      var y = fl[1], up = fl[0] === "upper";
      flat(W, r0, rc, a0, a1, y, MT.TERRAZZO, 0, true);                                      // corridor
      C.rooms.forEach(function (rm) {
        if (rm.floor !== fl[0] || rm.band) return;
        var ra0 = rmA0(rm), ra1 = rmA1(rm), fm = CRS_FLOOR[rm.kind] || [MT.TERRAZZO, 0];
        if (rm.code === "T06-01") { flat(W, rc, C.landR, ra0, ra1, y, MT.TERRAZZO, 0, true); return; }   // the landing; the rest is open to below
        flat(W, rc, r1, ra0, ra1, y, fm[0], fm[1], true);
        // ceiling: flat, tiles in the teaching rooms
        flat(W, rc, r1 + 0.05, ra0, ra1, y + (rm.code === "T06-10" ? (yU - yL) + C.hR : C.hR), MT.PLASTER, CRS_TILES[rm.kind] ? 6 : 0, false);
      });
      flat(W, r0 - 0.05, rc, a0, a1, y + C.hC, MT.PLASTER, 0, false);                        // corridor ceiling
    });
    // the corridor partition at rc on both floors, with a doorway into each room near its end toward the hall
    [["upper", yU], ["lower", yL]].forEach(function (fl) {
      var y = fl[1];
      C.rooms.forEach(function (rm) {
        if (rm.floor !== fl[0] || rm.band || rm.code === "T06-01" || rm.code === "T06-10") return;
        var ra0 = rmA0(rm), ra1 = rmA1(rm), mid = (ra0 + ra1) / 2, ad = mid < 0 ? ra1 - 2.2 * D2R : ra0 + 2.2 * D2R, half = 0.5 / rc;
        var wc = CRS_WALL[rm.kind] || 0;
        [[ra0, ad - half], [ad + half, ra1]].forEach(function (s) {
          arcWall(W, rc - hw, s[0], s[1], y, y + C.hC + 0.1, MT.PLASTER, 0, -1); arcWall(W, rc + hw, s[0], s[1], y, y + C.hR + 0.1, MT.PLASTER, wc, 1);
        });
        arcWall(W, rc - hw, ad - half, ad + half, y + 2.22, y + C.hC + 0.1, MT.PLASTER, 0, -1); arcWall(W, rc + hw, ad - half, ad + half, y + 2.22, y + C.hR + 0.1, MT.PLASTER, wc, 1);
        crsDoorway(W, rc, ad, y, 1);
        rm.door = ad;
        // walls between rooms (radial), from the partition to the garden glass
        [[ra0, 1], [ra1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * hw / ((rc + r1) / 2), rc, r1 - 0.06, y, y + C.hR + 0.1, MT.PLASTER, wc, e[1]); });
      });
      // the hall's side walls
      [[-hA, -1], [hA, 1]].forEach(function (e) { radWall(W, e[0] - e[1] * hw / 53, rc, r1 - 0.06, y, (fl[0] === "lower" ? yU : y) + C.hR + 0.1, MT.PLASTER, 0, -e[1]); });
    });
    // the lower corridor's back wall: the retaining wall against the slope; the lower passages along the end walls
    arcWall(W, r0 + 0.02, a0, a1, yL, yL + C.hC + 0.1, MT.PLASTER, 0, 1);
    [[a0, a0 + C.endA, 1], [a1 - C.endA, a1, -1]].forEach(function (e) {
      flat(W, rc, r1, e[0], e[1], yL, MT.TERRAZZO, 0, true); flat(W, rc, r1 + 0.05, e[0], e[1], yL + C.hC, MT.PLASTER, 0, false);
      radWall(W, e[2] > 0 ? e[1] - hw / 55 : e[0] + hw / 55, rc, r1 - 0.06, yL, yL + C.hR + 0.1, MT.PLASTER, 0, -e[2]);   // the passage's side of the room's wall
    });
    // frosted glass at the washrooms: white panels just inside the glass
    C.rooms.forEach(function (rm) { if (rm.kind !== "service" || rm.band) return; var y = rm.floor === "upper" ? yU : yL; arcWall(W, r1 - 0.12, rmA0(rm), rmA1(rm), y + 0.08, y + C.hR - 0.1, MT.PLASTER, 0, -1); });
    // end walls on both floors, inside
    [[a0, 1], [a1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * 0.06 / 53, r0, r1, yL, yU + C.hR + 0.1, MT.PLASTER, 0, e[1]); });
    // the hall: the stair down to the lower floor, its balustrade, the lift
    var st = new Builder(), n = C.nSteps, run = (C.stairR1 - C.landR) / n;
    for (var k = 0; k < n; k++) st.box(-C.stairW / 2, -(k + 1) * C.stepH - 0.18, k * run, C.stairW / 2, -k * C.stepH, (k + 1) * run, MT.TERRAZZO);
    [-1, 1].forEach(function (sd) { var rail = []; for (var k2 = 0; k2 <= 8; k2++) { var t = k2 / 8; rail.push(new THREE.Vector3(sd * (C.stairW / 2 + 0.05), 0.95 - t * (yU - yL), t * n * run)); }
      [sd * (C.stairW / 2 + 0.01), sd * (C.stairW / 2 + 0.03)].forEach(function (x) { st.surf(1, 1, function (i, j, q) { var z = i * n * run, yTop = 0.06 - i * (n - 1) * C.stepH; q.p[0] = x; q.p[1] = j ? yTop : yTop - 0.4; q.p[2] = z; q.nn = [sd, 0, 0]; q.f2[0] = 3; q.m = MT.STEEL; }); });
      var tb = new Builder(); tubeAlong(tb, rail, 0.025, 8, MT.STEEL); st.add(tb, new THREE.Matrix4()); });
    W.add(st, crsFrame(C.landR, C.stairA, yU));
    // the landing's edge over the void: a glass balustrade with a steel rail
    var gapA = (C.stairW / 2 + 0.1) / C.landR;
    [[-hA + 0.004, C.stairA - gapA], [C.stairA + gapA, hA - 0.004]].forEach(function (sp) {
      var lr = []; for (var k4 = 0; k4 <= 10; k4++) { var pp = crsPt(C.landR, lerp(sp[0], sp[1], k4 / 10)); lr.push(new THREE.Vector3(pp.x, yU + 1.0, pp.z)); }
      tubeAlong(W, lr, 0.025, 8, MT.STEEL);
      [sp[0], (sp[0] + sp[1]) / 2, sp[1]].forEach(function (pa) { var pq = crsPt(C.landR, pa); tubeAlong(W, [new THREE.Vector3(pq.x, yU, pq.z), new THREE.Vector3(pq.x, yU + 1.0, pq.z)], 0.02, 6, MT.STEEL); });
      var ng = 6; CRS_GLASS.surf(ng, 1, function (i, j, q) { var a = lerp(sp[0], sp[1], i / ng), p = crsPt(C.landR + 0.02, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = yU + (j ? 0.95 : 0.05); q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f2[0] = j ? 1 : 0.05; q.f2[1] = 1; q.m = 0; });
    });
    flat(W, C.rc, C.landR, -hA, hA, yU - 0.35, MT.PLASTER, 0, false);                    // under the landing
    arcWall(W, C.landR, -hA, hA, yU - 0.35, yU, MT.PLASTER, 0, 1);
    // ceiling lights: two rows in the rooms, one in the corridors
    C.rooms.forEach(function (rm) {
      if (rm.band) return;
      var y = rm.floor === "upper" ? yU : yL, ra0 = rmA0(rm), ra1 = rmA1(rm), hall = rm.code === "T06-01" || rm.code === "T06-10";
      if (hall && rm.floor === "lower") return;
      var yc = y + C.hR, span = (ra1 - ra0) * 55, nl = Math.max(1, Math.round((span - 1.5) / 3.0));
      [52.0, 57.0].forEach(function (rr) { for (var k3 = 0; k3 < nl; k3++) {
        var aa = lerp(ra0, ra1, (k3 + 0.5) / nl), M = crsFrame(rr, aa, yc - 0.45); W.add(linearPendant(), M);
        [-0.5, 0.5].forEach(function (d) { var p0 = new THREE.Vector3(d, 0.06, 0).applyMatrix4(M), p1 = new THREE.Vector3(d, 0.5, 0).applyMatrix4(M); tubeAlong(W, [p0, p1], 0.003, 3, MT.STEEL); });
        var lp = crsPt(rr, aa); wLight(lp.x, yc - 0.6, lp.z, LAMPC, 2.0, 7.5, [0, -1, 0], 1);
      } });
    });
    for (var ka = a0 + 0.05; ka < a1; ka += 4.0 / r0) { var lp2 = crsPt((r0 + rc) / 2, ka); [yU, yL].forEach(function (y) { W.geo(addF2(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), 1.8, 0), T(lp2.x, y + C.hC - 0.012, lp2.z), MT.LIGHT, 1); wLight(lp2.x, y + C.hC - 0.2, lp2.z, LAMPC, 1.3, 6, [0, -1, 0], 1.2); }); }
    W.zone = ZONE.OUT;

    // ---- outside: the glass fronts, the floor band, end walls, the roof ----
    B.zone = ZONE.OUT;
    // garden front: the lower floor and the upper floor, a band of composite at the slab between them; doors at the halls and the exits
    var exA = a1 - C.endA / 2;
    glassFront(B, r1, a0, a1, yL, yL + C.hR, 1, [0, -exA, exA]);
    glassFront(B, r1, a0, a1, yU, yU + C.hR, 1, []);
    arcWall(B, r1 + 0.06, a0, a1, yL + C.hR, yU, MT.COMPOSITE, 0, 1, 3);
    W.zone = ZONE.WING; arcWall(W, r1 - 0.1, -hA, hA, yL + C.hR - 0.1, yU - 0.02, MT.PLASTER, 0, -1); W.zone = ZONE.OUT;
    arcWall(B, r1 + 0.06, a0, a1, yU + C.hR, crsRoofY(r1) - C.roofT, MT.DKGLASS, 0, 1, 3);                // spandrel band to the roof
    // the terrace front of the upper corridor: glass with the main doors at the hall and an exit near each end
    glassFront(B, r0, a0, a1, yU, yU + C.hC, -1, [0, -(a1 - 1.6 / r0), a1 - 1.6 / r0]);
    arcWall(B, r0 - 0.06, a0, a1, yU + C.hC, crsRoofY(r0) - C.roofT, MT.DKGLASS, 0, -1, 3);
    // end walls outside: white composite from the lower floor (or the ground) to the roof
    [[a0, -1], [a1, 1]].forEach(function (e) {
      var n = Math.ceil((r1 - r0) / 0.5);
      B.surf(n, 1, function (i, j, q) { var r = lerp(r0, r1, i / n), p = crsPt(r, e[0] + e[1] * 0.02 / r), t = crsPt(1, e[0] + e[1] * Math.PI / 2), g = groundAt(p.x, p.z, yL), y = j ? crsRoofY(r) - C.roofT : Math.min(g, yL) - 0.4;
        q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [t.x - PAL.c.x, 0, t.z - PAL.c.z]; q.f[0] = r; q.f[1] = y; q.f2[0] = y - g; q.m = MT.SHELL; });
    });
    // the roof: a white composite shell over both fronts, its edges, and the soffits under the overhangs with downlights
    var na = Math.ceil((a1 - a0 + 0.02) * C.roofOut / 0.8), nr = 24, ea0 = a0 - 0.6 / r0, ea1 = a1 + 0.6 / r0;
    B.surf(na, nr, function (i, j, q) { var a = lerp(ea0, ea1, i / na), r = lerp(C.roofIn, C.roofOut, j / nr), p = crsPt(r, a), y = crsRoofY(r); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 5; q.m = MT.SHELL; });
    B.orient(B.count() - (na + 1) * (nr + 1), function () { return [0, 1, 0]; });
    [[C.roofIn, -1, r0], [C.roofOut, 1, r1]].forEach(function (e) {
      arcWall(B, e[0], ea0, ea1, crsRoofY(e[0]) - C.roofT, crsRoofY(e[0]), MT.ANOD, 0, e[1], 4);
      var nsf = Math.ceil((ea1 - ea0) * e[0] / 0.8);
      B.surf(nsf, 2, function (i, j, q) { var a = lerp(ea0, ea1, i / nsf), r = lerp(e[2], e[0], j / 2), p = crsPt(r, a); q.p[0] = p.x; q.p[1] = crsRoofY(e[0]) - C.roofT; q.p[2] = p.z; q.nn = [0, -1, 0]; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 4; q.m = MT.SHELL; });
      for (var ka2 = a0 + 0.04; ka2 < a1; ka2 += 3.0 / e[0]) { var dl = crsPt((e[0] + e[2]) / 2, ka2), yd = crsRoofY(e[0]) - C.roofT - 0.012; B.geo(addF2(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), 1.8, 0), T(dl.x, yd, dl.z), MT.LIGHT, 1); extLight(dl.x, yd - 0.15, dl.z, WARMC, 1.3, 6, [0, -1, 0], 1.4); }
    });
    [[ea0, -1], [ea1, 1]].forEach(function (e) {                         // the roof's ends
      var n = Math.ceil((C.roofOut - C.roofIn) / 0.5);
      B.surf(n, 1, function (i, j, q) { var r = lerp(C.roofIn, C.roofOut, i / n), p = crsPt(r, e[0]), t = crsPt(1, e[0] + e[1] * Math.PI / 2), y = crsRoofY(r) - (j ? 0 : C.roofT); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [t.x - PAL.c.x, 0, t.z - PAL.c.z]; q.f2[0] = 4; q.m = MT.ANOD; });
    });
    crescentCourt(B);
  }

  // ---- the sunken court along the garden front: basalt paving at the lower floor, retaining walls with a glass guard, stairs ----
  function crescentCourt(B) {
    var C = CRS, K = C.court, yL = C.yL, r1 = C.r1;
    function gAt(p) { return groundAt(p.x, p.z, yL); }
    // the paving: the band in front of the glass, and the open court down to the far edge
    flat(B, r1 + 0.06, K.r1, -K.aEnd, K.aEnd, yL, MT.PAVE, 0, true);
    var nl = 36, nf = 30, rFar = -K.radFar;
    B.surf(nl, nf, function (i, j, q) { var lat = lerp(-K.latHalf, K.latHalf, i / nl), radTop = -Math.sqrt(Math.max(0, K.r1 * K.r1 - lat * lat)), rad = lerp(radTop, K.radFar, j / nf), p = palXZ(lat, rad);
      q.p[0] = p.x; q.p[1] = yL; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
    // retaining walls: the band's outer arc beyond the open court, the court's two sides, the band's ends
    var aSide = Math.asin(K.latHalf / K.r1);
    function retain(pts, out) {                                          // a wall along a line of (lat, rad) points, from the court up to the ground, with a guard
      var n = pts.length - 1;
      B.surf(n, 1, function (i, j, q) { var p = palXZ(pts[i][0], pts[i][1]), g = gAt(p), y = j ? Math.max(g + 0.12, yL + 0.3) : yL - 0.3, a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dl = b[0] - a[0], dr = b[1] - a[1], nx = -dr * out, nz = dl * out;
        q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.Rt.x * nx + PAL.F.x * nz, 0, PAL.Rt.z * nx + PAL.F.z * nz]; q.f[0] = i * 0.5; q.f[1] = y; q.f2[0] = y - yL; q.m = MT.CONCRETE; });
      // a glass guard on top where the drop is more than half a metre
      var run = [], cur = null;
      pts.forEach(function (pt) { var p = palXZ(pt[0], pt[1]), g = gAt(p); if (g - yL > 0.5) { if (!cur) { cur = []; run.push(cur); } cur.push([p, g]); } else cur = null; });
      run.forEach(function (rn) {
        if (rn.length < 2) return;
        var rail = rn.map(function (e) { return new THREE.Vector3(e[0].x, e[1] + 1.0, e[0].z); });
        tubeAlong(B, rail, 0.025, 8, MT.STEEL);
        CRS_GLASS.surf(rn.length - 1, 1, function (i, j, q) { var e = rn[i], e2 = rn[Math.min(rn.length - 1, i + 1)], e1 = rn[Math.max(0, i - 1)]; q.p[0] = e[0].x; q.p[1] = e[1] + (j ? 0.95 : 0.14); q.p[2] = e[0].z; q.nn = [e2[0].z - e1[0].z, 0, -(e2[0].x - e1[0].x)]; q.f2[0] = j ? 1.0 : 0.05; q.f2[1] = 1; q.m = 0; });
        for (var k = 0; k < rn.length; k += 3) tubeAlong(B, [new THREE.Vector3(rn[k][0].x, rn[k][1] + 0.12, rn[k][0].z), new THREE.Vector3(rn[k][0].x, rn[k][1] + 1.0, rn[k][0].z)], 0.02, 6, MT.STEEL);
      });
    }
    function arcPts(r, aa0, aa1) { var n = Math.max(2, Math.ceil(Math.abs(aa1 - aa0) * r / 0.5)), o = []; for (var k = 0; k <= n; k++) { var a = lerp(aa0, aa1, k / n); o.push([r * Math.sin(a), -r * Math.cos(a)]); } return o; }
    function linePts(p, q2) { var n = Math.max(2, Math.ceil(Math.hypot(q2[0] - p[0], q2[1] - p[1]) / 0.5)), o = []; for (var k = 0; k <= n; k++) o.push([lerp(p[0], q2[0], k / n), lerp(p[1], q2[1], k / n)]); return o; }
    [-1, 1].forEach(function (sd) {
      retain(arcPts(K.r1, sd * aSide, sd * K.stairA0), sd);
      retain(arcPts(r1, sd * C.a1, sd * K.aEnd), -sd);
      var top = [sd * K.latHalf, -Math.sqrt(K.r1 * K.r1 - K.latHalf * K.latHalf)];
      retain(linePts(top, [sd * K.latHalf, K.radFar]), -sd);
      retain(linePts([sd * (r1 + 0.06) * Math.sin(K.aEnd), -(r1 + 0.06) * Math.cos(K.aEnd)], [sd * K.r1 * Math.sin(K.aEnd), -K.r1 * Math.cos(K.aEnd)]), sd > 0 ? -1 : 1);
      // the stair up to the ground at the band's end, between the end wall and the court
      var am = sd * (K.stairA0 + K.aEnd) / 2, pTop = crsPt(K.r1 - 0.2, am), gT = gAt(pTop), rise = gT - yL, ns = Math.max(1, Math.round(rise / 0.17)), hs = rise / ns, runS = Math.min(0.3, (K.r1 - r1 - 0.8) / ns);
      var sb = new Builder(), wS = (K.aEnd - K.stairA0) * (r1 + K.r1) / 2 - 0.1;
      for (var k = 0; k < ns; k++) sb.box(-wS / 2, -0.3, k * runS, wS / 2, (k + 1) * hs, (k + 1) * runS, MT.CONCRETE);
      for (var n2 = 0; n2 < sb.f.length; n2++) sb.f[n2] = 0.45 + 0.07 * sb.f[n2] * 0.3;
      B.add(sb, crsFrame(K.r1 - 0.2 - ns * runS, am, yL));
      C["stair" + (sd > 0 ? "R" : "L")] = { a: am, r0: K.r1 - 0.2 - ns * runS, run: runS, n: ns, hs: hs, w: wS };
    });
    // bollards along the court
    for (var k = 0; k < 8; k++) { var lat = lerp(-K.latHalf + 1.2, K.latHalf - 1.2, k / 7), p = palXZ(lat, K.radFar + 1.0);
      latheOn(B, p.x, yL - 0.05, p.z, [[0.1, 0], [0.1, 0.9]], 16, MT.ANOD, 0.3); latheOn(B, p.x, yL + 0.85, p.z, [[0.112, 0], [0.112, 0.08], [0.09, 0.1], [0.0, 0.105]], 16, MT.ANOD, 0.9);
      B.geo(addF2(new THREE.CylinderGeometry(0.094, 0.094, 0.1, 16, 1, true), 1.4, 0), T(p.x, yL + 0.8, p.z), MT.LIGHT, 1); extLight(p.x, yL + 0.8, p.z, WARMC, 1.1, 6); COLL.posts.push({ x: p.x, z: p.z, r: 0.35 }); }
  }

  // ---- where you can stand in and round the Crescent: the two floors, the stair, the court; NaN at walls ----
  function crescentSupport(x, z, yf) {
    if (!CRS) return undefined;
    var C = CRS, K = C.court, o = crsLoc(x, z), r = o.r, a = o.a, yU = C.yU, yL = C.yL, aa = Math.abs(a);
    if (o.rad > -25) return undefined;                                   // the Crescent and its court are all behind the dome
    var inCourt = (r > C.r1 + 0.25 && r < K.r1 - 0.3 && aa < K.aEnd - 0.012) || (Math.abs(o.lat) < K.latHalf - 0.3 && o.rad > K.radFar - 0.6 && o.rad < 0 && r > C.r1 + 0.25);
    // the stairs at the band's ends
    var ss = [C.stairL, C.stairR];
    for (var i = 0; i < 2; i++) { var s = ss[i]; if (!s) continue;
      if (Math.abs(a - s.a) * r < s.w / 2 - 0.1 && r > s.r0 - 0.2 && r < K.r1 + 0.6) { var k = clamp(Math.floor((r - s.r0) / s.run), -1, s.n - 1); return r >= K.r1 - 0.2 ? undefined : yL + (k + 1) * s.hs; } }
    // the doors in the garden front: through to the court
    if (Math.abs(r - C.r1) < 0.45 && yf < yL + 0.6 && (C.doors || []).some(function (d) { return d.r === C.r1 && Math.abs(d.y - yL) < 0.1 && Math.abs(d.a - a) * r < 1.1; })) return yL;
    if (inCourt) return yf < yL + 0.6 ? yL : NaN;
    var nearCourt = (r > C.r1 - 0.1 && r < K.r1 + 0.6 && aa < K.aEnd + 0.03) || (Math.abs(o.lat) < K.latHalf + 0.6 && o.rad > K.radFar + 0.4 && o.rad < 0 && r > C.r1 - 0.1);
    if (nearCourt) return NaN;                                             // the retaining walls and their guards
    if (r < C.r0 - 0.35 || r > K.r1 + 0.6 || aa > K.aEnd + 0.03) return undefined;
    if (r > C.r1 + 0.1) return NaN;                                       // the court's retaining walls
    if (aa > C.a1 - 0.006) return aa > C.a1 + 0.006 ? undefined : NaN;    // the end walls
    // inside: which floor
    var lower = yf < (yU + yL) / 2, y = lower ? yL : yU, onFront = r > C.r1 - 0.25 || r < C.r0 + 0.25;
    function nearDoor(rr, ang) { return (C.doors || []).some(function (d) { return Math.abs(d.r - rr) < 0.5 && Math.abs(d.a - ang) * rr < 1.1 && Math.abs(d.y - y) < 0.5; }); }
    if (r > C.r1 - 0.25) return nearDoor(C.r1, a) ? y : NaN;
    if (r < C.r0 + 0.25) { if (lower) return NaN; return nearDoor(C.r0, a) ? y : NaN; }
    // the hall: the landing upstairs, the stair, the void
    if (aa < C.hallA - 0.004) {
      var sa = (a - C.stairA) * r;
      if (Math.abs(sa) < C.stairW / 2 - 0.05 && r > C.landR - 0.05 && r < C.stairR1 + 0.1 && yf > yL + 0.3) { var kk = clamp(Math.floor((r - C.landR) / ((C.stairR1 - C.landR) / C.nSteps)), 0, C.nSteps); return yU - kk * C.stepH; }
      if (!lower && r > C.landR + 0.05) return NaN;                       // the void
      if (!lower && Math.abs(r - C.landR) < 0.2 && Math.abs(sa) > C.stairW / 2) return NaN;   // the balustrade
      return y;
    }
    if (Math.abs(aa - C.hallA) * r < 0.2 && r > C.rc) return NaN;         // the hall's side walls
    if (Math.abs(r - C.rc) < 0.2) {                                         // the corridor partition, open at the doorways
      if (lower && Math.abs(a) > C.a1 - C.endA) return y;                 // the passages to the exits
      var rm = crsRoomAt(a, lower ? "lower" : "upper"); return rm && rm.door !== undefined && Math.abs(a - rm.door) * C.rc < 0.4 ? y : NaN;
    }
    if (r > C.rc) {                                                          // the walls between rooms
      var R = C.rooms; for (var j = 0; j < R.length; j++) { var q = R[j]; if (q.band || q.floor !== (lower ? "lower" : "upper")) continue; if (Math.abs(a - rmA0(q)) * r < 0.18 || Math.abs(a - rmA1(q)) * r < 0.18) return NaN; }
    }
    return y;
  }
  function crescentInside(x, z) { if (!CRS) return 0; var o = crsLoc(x, z); return (o.r > CRS.r0 && o.r < CRS.r1 && Math.abs(o.a) < CRS.a1) ? 1 : 0; }
