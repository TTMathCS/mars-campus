  /* ===================== Phase 2: the Crescent (T-06), the Academy ===================== */
  // Two floors in a crescent round the back of the dome (P2.crescent): the upper floor level with the balcony and the
  // winter garden, the lower floor 5.6 m down, opening onto the garden gallery (T06-15), a court along the whole garden
  // front under a sloping glass roof. A corridor on the dome side, big rooms on the garden side under 4.5 m ceilings
  // (Jim, 5 Oct 2026: "class rooms are all too small and roof are too low"), a hall two storeys tall with the stair and
  // the lift in the middle, an enclosed emergency stair at each end of the corridors. Sealed: no door opens to the air.
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
    var C = P2.crescent, G = P2.gallery, S = C.stair, yU = PALY.B, yL = PALY.B + C.lower, hall = C.rooms.filter(function (r) { return r.code === "T06-01"; })[0];
    CRS = { r0: C.r0, r1: C.r1, rc: C.rc, a0: C.a0 * D2R, a1: C.a1 * D2R, yU: yU, yL: yL, hR: C.ceil, hC: C.ceil_corridor, wall: 0.15,
            hallA: hall.a[1] * D2R,
            st: { a: S.a * D2R, r0: S.r0, r1: S.r1, w: S.w, n: S.n, l0: S.landing[0], l1: S.landing[1] },
            lift: { r: C.lift[0], a: C.lift[1] * D2R, w: 2.2 },
            es: { a: C.estair.a * D2R, w: C.estair.w, n: 28, land: 1.0 },
            roofIn: C.r0 - 1.2, roofOut: C.r1 + 0.9, roofY: C.ceil + 0.6, roofRise: 0.85, roofT: 0.3,
            gal: { r1: G.r1, a: G.a * D2R, wall: G.wall }, rooms: C.rooms };
    var st = CRS.st; st.h = (yU - yL) / st.n; st.half = st.n / 2; st.run1 = (st.l0 - st.r0) / st.half; st.run2 = (st.r1 - st.l1) / st.half; st.yM = yU - st.half * st.h;
    var es = CRS.es; es.rm = (C.r0 + C.rc) / 2; es.L = es.a * es.rm; es.h = (yU - yL) / es.n; es.half = es.n / 2; es.tread = (es.L - 2 * es.land) / es.half; es.yM = yU - es.half * es.h;
    CRS.stairA = st.a; CRS.stairR0 = st.r0; CRS.stairR1 = st.r1;                 // for the walking test
    return CRS;
  }
  function crsRoofY(r) { var C = CRS, t = clamp((r - C.roofIn) / (C.roofOut - C.roofIn), 0, 1); return C.yU + C.roofY + C.roofRise * Math.pow(Math.sin(Math.PI * t), 0.8); }
  function rmA0(rm) { return rm.a[0] * D2R; }
  function rmA1(rm) { return rm.a[1] * D2R; }
  // the room (from P2) at angle a on a floor; the hall spans both floors
  function crsRoomAt(a, floor) { var deg = a * R2D, R = CRS.rooms; for (var i = 0; i < R.length; i++) { var rm = R[i]; if (rm.floor !== floor || rm.band) continue; if (deg >= rm.a[0] && deg < rm.a[1]) return rm; } return null; }
  // the hall's stair: the height of its tread at radius r (two flights of 16 and a landing between them)
  function stairY(r) {
    var s = CRS.st, yU = CRS.yU;
    if (r < s.r0) return yU;
    if (r < s.l0) return yU - (clamp(Math.floor((r - s.r0) / s.run1), 0, s.half - 1) + 1) * s.h;
    if (r <= s.l1) return s.yM;
    if (r < s.r1) return s.yM - (clamp(Math.floor((r - s.l1) / s.run2), 0, s.half - 1) + 1) * s.h;
    return CRS.yL;
  }
  // an emergency stair, at e metres along the corridor from its door and z metres out from the corridor's middle: the
  // landings at the doors (one per floor, one above the other), a flight down along the rooms' side, a half landing at
  // the end wall, a flight back along the front. NaN at the wall between the flights.
  function esY(e, z, yf) {
    var s = CRS.es, yU = CRS.yU, yL = CRS.yL;
    if (e < s.land) return yf > (yU + yL) / 2 ? yU : yL;
    if (e > s.L - s.land) return s.yM;
    if (z > 0.1) return yU - (clamp(Math.floor((e - s.land) / s.tread), 0, s.half - 1) + 1) * s.h;
    if (z < -0.1) return s.yM - (clamp(Math.floor((s.L - s.land - e) / s.tread), 0, s.half - 1) + 1) * s.h;
    return NaN;
  }
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
    var gaps = (doors || []).map(function (d) { return [d - 1.33 / r, d + 1.33 / r]; });
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
  // an inside doorway at (r, a): the opening's oak casing and the door leaf standing open; in a curved partition (along
  // the arc) or, with radial set, in a wall along a radius
  function crsDoorway(B, r, a, y0, intoOut, radial) {
    var M = crsFrame(r, a, y0, radial ? Math.PI / 2 : 0), cs = new Builder(), w = 1.0, h = 2.15;
    cs.box(-w / 2 - 0.07, 0, -0.1, -w / 2, h + 0.07, 0.1, MT.WOOD); cs.box(w / 2, 0, -0.1, w / 2 + 0.07, h + 0.07, 0.1, MT.WOOD); cs.box(-w / 2 - 0.07, h, -0.1, w / 2 + 0.07, h + 0.07, 0.1, MT.WOOD);
    cs.tag(0, null, 2);
    var lf = new Builder(); lf.box(0, 0.01, 0, 0.04, h - 0.01, w - 0.02, MT.WOOD); lf.tag(0, null, 1);
    lf.box(-0.05, 1.0, w - 0.12, 0.0, 1.03, w - 0.08, MT.STEEL); lf.box(0.04, 1.0, w - 0.12, 0.09, 1.03, w - 0.08, MT.STEEL);
    cs.add(lf, new THREE.Matrix4().makeTranslation(w / 2 - 0.02, 0, intoOut > 0 ? 0.1 : -0.1 - (w - 0.02)));
    B.add(cs, M);
  }

  // ---- the building ----
  function crescentBuild(B, W) {
    var C = crsInit(), G = C.gal, r0 = C.r0, r1 = C.r1, rc = C.rc, a0 = C.a0, a1 = C.a1, yU = C.yU, yL = C.yL, hw = C.wall / 2, hA = C.hallA, st = C.st, es = C.es;
    var ea = a1 + 0.03 / r0, eA = a1 - es.a;                               // eA: where the emergency stairs begin
    p2Sector(0, 0, r0 - 0.03, G.r1 + 0.12, -ea, ea);                       // the building and its garden gallery
    p2CutApply();
    P2DOMAINS.push({ l0: -55, l1: 55, r0: -70.5, r1: -27, y0: yL - 0.6, y1: yU + 6.6 });
    W.zone = ZONE.WING;
    // floors: the corridor's terrazzo (to the emergency stairs), the rooms' own floors, the hall's landing upstairs
    [["upper", yU], ["lower", yL]].forEach(function (fl) {
      var y = fl[1];
      flat(W, r0, rc, -eA, eA, y, MT.TERRAZZO, 0, true);
      C.rooms.forEach(function (rm) {
        if (rm.floor !== fl[0] || rm.band) return;
        var ra0 = rmA0(rm), ra1 = rmA1(rm), fm = CRS_FLOOR[rm.kind] || [MT.TERRAZZO, 0];
        if (rm.code === "T06-01") { flat(W, rc, st.r0, ra0, ra1, y, MT.TERRAZZO, 0, true); return; }   // the landing; beyond it the hall is open to below
        flat(W, rc, r1, ra0, ra1, y, fm[0], fm[1], true);
        if (rm.code !== "T06-08") flat(W, rc, r1 + 0.05, ra0, ra1, y + C.hR, MT.PLASTER, CRS_TILES[rm.kind] ? 6 : 0, false);   // ceilings: flat, tiles in the teaching rooms
      });
      [[-eA, -hA], [hA, eA]].forEach(function (s) { flat(W, r0 - 0.05, rc, s[0], s[1], y + C.hC, MT.PLASTER, 0, false); });   // the corridors' ceilings
    });
    flat(W, r0 - 0.05, r1 + 0.05, -hA, hA, yU + C.hR, MT.PLASTER, 0, false);                       // the hall's ceiling, two storeys up
    flat(W, r0 - 0.05, st.r0, -hA, hA, yU - 0.35, MT.PLASTER, 0, false);                           // under the landing
    arcWall(W, st.r0, -hA, hA, yU - 0.35, yU, MT.PLASTER, 0, 1);
    // the corridor partition at rc on both floors, with doorways into each room; the walls between the rooms
    [["upper", yU], ["lower", yL]].forEach(function (fl) {
      var y = fl[1];
      C.rooms.forEach(function (rm) {
        if (rm.floor !== fl[0] || rm.band || rm.code === "T06-01" || rm.code === "T06-08") return;
        var ra0 = rmA0(rm), ra1 = rmA1(rm), mid = (ra0 + ra1) / 2, wc = CRS_WALL[rm.kind] || 0, half = 0.5 / rc;
        // a doorway near the end toward the hall, a second at the far end of the big rooms; none inside the stairs' enclosures
        var ds = [mid < 0 ? ra1 - 2.2 * D2R : ra0 + 2.2 * D2R];
        if (ra1 - ra0 >= 13.5 * D2R) ds.push(mid < 0 ? ra0 + 2.2 * D2R : ra1 - 2.2 * D2R);
        ds = ds.filter(function (d) { return Math.abs(d) < eA - 0.8 / rc; }); rm.doors = ds; rm.door = ds[0];
        var cur = ra0;
        ds.slice().sort(function (p, q) { return p - q; }).forEach(function (d) { seg(cur, d - half); cur = d + half; }); seg(cur, ra1);
        function seg(s0, s1) { if (s1 - s0 < 1e-4) return; arcWall(W, rc - hw, s0, s1, y, y + C.hC + 0.1, MT.PLASTER, 0, -1); arcWall(W, rc + hw, s0, s1, y, y + C.hR + 0.1, MT.PLASTER, wc, 1); }
        ds.forEach(function (d) {
          arcWall(W, rc - hw, d - half, d + half, y + 2.22, y + C.hC + 0.1, MT.PLASTER, 0, -1); arcWall(W, rc + hw, d - half, d + half, y + 2.22, y + C.hR + 0.1, MT.PLASTER, wc, 1);
          crsDoorway(W, rc, d, y, 1);
        });
        [[ra0, 1], [ra1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * hw / ((rc + r1) / 2), rc, r1 - 0.06, y, y + C.hR + 0.1, MT.PLASTER, wc, e[1]); });
      });
    });
    [[-hA, -1], [hA, 1]].forEach(function (e) { radWall(W, e[0] - e[1] * hw / 53, rc, r1 - 0.06, yL, yU + C.hR + 0.1, MT.PLASTER, 0, -e[1]); });   // the hall's side walls, two storeys
    arcWall(W, r0 + 0.02, -eA, eA, yL, yL + C.hC + 0.1, MT.PLASTER, 0, 1);                       // the lower corridor's back: the retaining wall
    arcWall(W, r0 + 0.02, -hA, hA, yL + C.hC + 0.1, yU - 0.35, MT.PLASTER, 0, 1);                 // ... up to the landing in the hall
    arcWall(W, r0 + 0.07, -hA, hA, yU + C.hC, yU + C.hR + 0.05, MT.PLASTER, 0, 1);                // and above the glass to the hall's ceiling
    // frosted glass at the washrooms: white panels just inside the glass
    C.rooms.forEach(function (rm) { if (rm.kind !== "service" || rm.band) return; var y = rm.floor === "upper" ? yU : yL; arcWall(W, r1 - 0.12, rmA0(rm), rmA1(rm), y + 0.08, y + C.hR - 0.1, MT.PLASTER, 0, -1); });
    // end walls on both floors, inside
    [[a0, 1], [a1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * 0.06 / 53, r0, r1, yL, yU + C.hR + 0.1, MT.PLASTER, 0, e[1]); });
    crescentEStairs(W);
    crescentStair(W);
    crescentLift(W);
    // lights: pendants in rows in the rooms (three rows in the big ones), downlights in the corridors and the hall
    C.rooms.forEach(function (rm) {
      if (rm.band || rm.code === "T06-01" || rm.code === "T06-08") return;
      var y = rm.floor === "upper" ? yU : yL, ra0 = rmA0(rm), ra1 = rmA1(rm), yc = y + C.hR, yl = y + 3.25, span = (ra1 - ra0) * 55.8, nl = Math.max(1, Math.round((span - 1.6) / 3.4));
      var rows = ra1 - ra0 >= 13.5 * D2R ? [52.6, 55.9, 59.2] : [53.2, 58.4];
      rows.forEach(function (rr) { for (var k3 = 0; k3 < nl; k3++) {
        var aa = lerp(ra0, ra1, (k3 + 0.5) / nl), M = crsFrame(rr, aa, yl); W.add(linearPendant(), M);
        [-0.5, 0.5].forEach(function (d) { var p0 = new THREE.Vector3(d, 0.06, 0).applyMatrix4(M), p1 = new THREE.Vector3(d, yc - yl, 0).applyMatrix4(M); tubeAlong(W, [p0, p1], 0.003, 3, MT.STEEL); });
        var lp = crsPt(rr, aa); wLight(lp.x, yl - 0.15, lp.z, LAMPC, rows.length > 2 ? 1.9 : 2.1, 8, [0, -1, 0], 1);
      } });
    });
    for (var ka = -eA + 2.0 / r0; ka < eA - 1.0 / r0; ka += 4.0 / r0) {
      if (Math.abs(ka) < hA) continue;
      var lp2 = crsPt((r0 + rc) / 2, ka);
      [yU, yL].forEach(function (y) { W.geo(addF2(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), 1.8, 0), T(lp2.x, y + C.hC - 0.012, lp2.z), MT.LIGHT, 1); wLight(lp2.x, y + C.hC - 0.2, lp2.z, LAMPC, 1.3, 6, [0, -1, 0], 1.2); });
    }
    [[47.6, -4.5], [47.6, 4.5], [49.8, 0]].forEach(function (d) { var p = crsPt(d[0], d[1] * D2R); W.geo(addF2(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), 1.8, 0), T(p.x, yU + C.hR - 0.012, p.z), MT.LIGHT, 1); wLight(p.x, yU + C.hR - 0.2, p.z, LAMPC, 1.8, 8, [0, -1, 0], 1.2); });
    crescentChandelier(W);
    W.zone = ZONE.OUT;

    // ---- outside: the glass fronts, the floor band, end walls, the roof ----
    B.zone = ZONE.OUT;
    // garden front: the lower floor's glass with doors into the gallery from the hall and from each room; the upper floor's
    var gd = [0];
    C.rooms.forEach(function (rm) { if (rm.floor === "lower" && !rm.band && rm.kind !== "service" && rm.code !== "T06-08") gd.push((rm.a[0] + rm.a[1]) / 2 * D2R); });
    glassFront(B, r1, a0, a1, yL, yL + C.hR, 1, gd);
    glassFront(B, r1, a0, a1, yU, yU + C.hR, 1, []);
    arcWall(B, r1 + 0.06, a0, a1, yL + C.hR, yU, MT.COMPOSITE, 0, 1, 3);
    W.zone = ZONE.WING; arcWall(W, r1 - 0.1, -hA, hA, yL + C.hR - 0.1, yU - 0.02, MT.PLASTER, 0, -1); W.zone = ZONE.OUT;
    arcWall(B, r1 + 0.06, a0, a1, yU + C.hR, crsRoofY(r1) - C.roofT, MT.DKGLASS, 0, 1, 3);                // spandrel band to the roof
    // the winter garden's side: the upper corridor's glass, doors at the hall and halfway to each end; solid at the stairs
    var td = 25 * D2R;
    glassFront(B, r0, -eA, eA, yU, yU + C.hC, -1, [0, -td, td]);
    [-1, 1].forEach(function (sg) { arcWall(B, r0 - 0.06, sg > 0 ? eA : -a1, sg > 0 ? a1 : -eA, yU, yU + C.hC, MT.COMPOSITE, 0, -1, 3); });
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
    crescentGallery(B);
    crescentFurnish(W);
  }

  // ---- the hall's stair: two flights of Carrara treads with brass nosings and a landing, on steel stringers, glass sides ----
  function crescentStair(W) {
    var C = CRS, S = C.st, yU = C.yU, sw = S.w / 2, b = new Builder(), h = S.h, zl0 = (S.half - 1) * S.run1, zl1 = S.l1 - S.r0, zEnd = S.r1 - S.r0;
    function tread(z0, z1, y) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = y; q.p[2] = lerp(z0, z1, j); q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = z1 - q.p[2]; q.m = MT.STEP; }); }
    function riser(z, y0, y1) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = j ? y1 : y0; q.p[2] = z; q.nn = [0, 0, 1]; q.f[0] = q.p[0]; q.f[1] = 1; q.m = MT.STEP; }); }
    function soffit(z0, y0, z1, y1) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = j ? y1 : y0; q.p[2] = j ? z1 : z0; q.nn = [0, -1, 0]; q.m = MT.PLASTER; }); }
    var flights = [{ z0: 0, run: S.run1, y0: 0, n: S.half - 1 }, { z0: zl1, run: S.run2, y0: S.yM - yU, n: S.half - 1 }], noses = [];
    flights.forEach(function (F) {
      riser(F.z0, F.y0 - h, F.y0);
      for (var k = 0; k < F.n; k++) {
        var z0 = F.z0 + k * F.run, z1 = z0 + F.run, y = F.y0 - (k + 1) * h;
        tread(z0, z1, y); riser(z1, y - h, y); noses.push([z1, y]);
      }
      var zE = F.z0 + F.n * F.run, yE = F.y0 - (F.n + 1) * h;
      soffit(F.z0 + 0.2, F.y0 - 0.45, zE, yE - 0.2);
      // stringers: steel plates along both sides, following the nosings
      [-1, 1].forEach(function (sd) { b.surf(1, 1, function (i, j, q) { var z = i ? zE : F.z0, yt = (i ? yE + h : F.y0) + 0.06; q.p[0] = sd * (sw + 0.012); q.p[1] = j ? yt : yt - 0.5; q.p[2] = z; q.nn = [sd, 0, 0]; q.f2[0] = 3; q.m = MT.STEEL; }); });
    });
    // the landing between the flights, on two steel posts
    tread(zl0, zl1, S.yM - yU); b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = S.yM - yU - 0.3; q.p[2] = lerp(zl0, zl1, j); q.nn = [0, -1, 0]; q.m = MT.PLASTER; });
    [[zl0, -1], [zl1, 1]].forEach(function (e) { if (e[1] > 0) return; b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = S.yM - yU - (j ? 0 : 0.3); q.p[2] = e[0]; q.nn = [0, 0, -1]; q.m = MT.PLASTER; }); });
    [-1, 1].forEach(function (sd) {
      b.surf(1, 1, function (i, j, q) { q.p[0] = sd * (sw + 0.012); q.p[1] = S.yM - yU - (j ? -0.06 : 0.3); q.p[2] = lerp(zl0, zl1, i); q.nn = [sd, 0, 0]; q.f2[0] = 3; q.m = MT.STEEL; });
      var pz = (zl0 + zl1) / 2; b.box(sd * (sw - 0.3) - 0.06, -(yU - C.yL), pz - 0.06, sd * (sw - 0.3) + 0.06, S.yM - yU - 0.3, pz + 0.06, MT.STEEL);
    });
    // glass balustrades with a steel handrail on both sides, from the landing upstairs to the floor
    var path = [[0, 0], [zl0, S.yM - yU], [zl1, S.yM - yU], [zEnd - S.run2, C.yL - yU + h]];
    [-1, 1].forEach(function (sd) {
      var rail = path.map(function (p) { return new THREE.Vector3(sd * (sw + 0.04), p[1] + 0.95, p[0]); });
      var tb = new Builder(); tubeAlong(tb, rail, 0.025, 8, MT.STEEL); b.add(tb, new THREE.Matrix4());
      for (var k = 0; k < path.length - 1; k++) {
        var pa = path[k], pb = path[k + 1], gx = sd * (sw + 0.03);
        var gb = new Builder(); gb.surf(1, 1, function (i, j, q) { var p = i ? pb : pa; q.p[0] = gx; q.p[1] = p[1] + (j ? 0.9 : 0.1); q.p[2] = p[0]; q.nn = [sd, 0, 0]; q.f2[0] = j ? 0.9 : 0.1; q.f2[1] = 1; q.m = 0; });
        var Mg = crsFrame(S.r0, S.a, yU); CRS_GLASS.add(gb, Mg);
      }
    });
    b.tag(0, null, null);
    W.add(b, crsFrame(S.r0, S.a, yU));
    // the landing's edge over the void: a glass balustrade with a steel rail, open where the stair starts
    var gapA = (S.w / 2 + 0.1) / S.r0;
    [[-C.hallA + 0.004, S.a - gapA], [S.a + gapA, C.hallA - 0.004]].forEach(function (sp) {
      var lr = []; for (var k4 = 0; k4 <= 10; k4++) { var pp = crsPt(S.r0, lerp(sp[0], sp[1], k4 / 10)); lr.push(new THREE.Vector3(pp.x, yU + 1.0, pp.z)); }
      tubeAlong(W, lr, 0.025, 8, MT.STEEL);
      [sp[0], (sp[0] + sp[1]) / 2, sp[1]].forEach(function (pa) { var pq = crsPt(S.r0, pa); tubeAlong(W, [new THREE.Vector3(pq.x, yU, pq.z), new THREE.Vector3(pq.x, yU + 1.0, pq.z)], 0.02, 6, MT.STEEL); });
      var ng = 6; CRS_GLASS.surf(ng, 1, function (i, j, q) { var a = lerp(sp[0], sp[1], i / ng), p = crsPt(S.r0 + 0.02, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = yU + (j ? 0.95 : 0.05); q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f2[0] = j ? 1 : 0.05; q.f2[1] = 1; q.m = 0; });
    });
  }

  // ---- the emergency stairs at the corridors' ends: a fire door on each floor, two flights and a half landing ----
  function crescentEStairs(W) {
    var C = CRS, E = C.es, yU = C.yU, yL = C.yL, rm = E.rm, eA = C.a1 - E.a, hw = C.wall / 2, r0 = C.r0, rc = C.rc;
    [-1, 1].forEach(function (sg) {
      function ang(e) { return sg * (eA + e / rm); }
      function span(e0, e1) { var p = ang(e0), q = ang(e1); return [Math.min(p, q), Math.max(p, q)]; }
      // the wall across the corridor, both faces, with a door on each floor
      [[ang(0) - sg * hw / rm, -sg], [ang(0) + sg * hw / rm, sg]].forEach(function (f) {
        [yL, yU].forEach(function (y) { radWall(W, f[0], r0 + 0.05, rm - 0.55, y, y + C.hC + 0.1, MT.PLASTER, 0, f[1]); radWall(W, f[0], rm + 0.55, rc - 0.05, y, y + C.hC + 0.1, MT.PLASTER, 0, f[1]); radWall(W, f[0], rm - 0.55, rm + 0.55, y + 2.22, y + C.hC + 0.1, MT.PLASTER, 0, f[1]); });
        radWall(W, f[0], r0 + 0.05, rc - 0.05, yL + C.hC + 0.1, yU, MT.PLASTER, 0, f[1]);
      });
      [yL, yU].forEach(function (y) { crsDoorway(W, rm, ang(0), y, sg, true); });
      // the floor at the bottom, the landing at the top door (with its edge and rail over the lower flight), the half landing
      var s = span(0, E.L); flat(W, r0, rc, s[0], s[1], yL, MT.TERRAZZO, 0, true);
      s = span(0, E.land); flat(W, r0 + 0.05, rc - 0.05, s[0], s[1], yU, MT.TERRAZZO, 0, true); flat(W, r0 + 0.05, rc - 0.05, s[0], s[1], yU - 0.25, MT.PLASTER, 0, false);
      radWall(W, ang(E.land), r0 + 0.05, rm - 0.1, yU - 0.25, yU, MT.PLASTER, 0, sg);
      var rl = [new THREE.Vector3(), new THREE.Vector3()]; [r0 + 0.15, rm - 0.15].forEach(function (rr, k) { var p = crsPt(rr, ang(E.land) - sg * 0.04 / rm); rl[k].set(p.x, yU + 1.0, p.z); });
      tubeAlong(W, rl, 0.025, 8, MT.STEEL);
      s = span(E.L - E.land, E.L); flat(W, r0 + 0.05, rc - 0.05, s[0], s[1], E.yM, MT.TERRAZZO, 0, true); flat(W, r0 + 0.05, rc - 0.05, s[0], s[1], E.yM - 0.25, MT.PLASTER, 0, false);
      radWall(W, ang(E.L - E.land), r0 + 0.05, rc - 0.05, E.yM - 0.25, E.yM, MT.PLASTER, 0, -sg);
      // the flights: down along the rooms' side to the half landing, then back along the front
      [[rm + 0.1, rc - 0.05, E.land, E.L - E.land, yU], [r0 + 0.05, rm - 0.1, E.L - E.land, E.land, E.yM]].forEach(function (F) {
        var dir = Math.sign(F[3] - F[2]), last = F[4] === CRS.yU ? E.half : E.half - 1;   // the lower flight's last tread is the floor itself
        for (var k = 0; k < E.half; k++) {
          var e0 = F[2] + dir * k * E.tread, e1 = e0 + dir * E.tread, y = F[4] - (k + 1) * E.h, sp = span(e0, e1);
          if (k < last) flat(W, F[0], F[1], sp[0], sp[1], y, MT.TERRAZZO, 0, true);
          radWall(W, ang(e0), F[0], F[1], y, y + E.h, MT.TERRAZZO, 0, -sg * dir);
        }
        var eN = F[2] + dir * (E.half - 1) * E.tread;
        var n = 8; W.surf(n, 1, function (i, j, q) { var e = lerp(F[2], eN, i / n), y = F[4] - (i / n) * (E.half - 1) * E.h - 0.45, p = crsPt(j ? F[1] : F[0], ang(e)); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, -1, 0]; q.m = MT.PLASTER; });
      });
      // the wall between the flights, the ceiling, a light on each landing
      s = span(E.land, E.L - E.land);
      arcWall(W, rm - 0.08, s[0], s[1], yL, yU + C.hC, MT.PLASTER, 0, -1); arcWall(W, rm + 0.08, s[0], s[1], yL, yU + C.hC, MT.PLASTER, 0, 1);
      s = span(0, E.L); flat(W, r0 - 0.05, rc, s[0], s[1], yU + C.hC, MT.PLASTER, 0, false);
      [[0.5, yU + 2.6], [0.5, yL + 2.6], [E.L - 0.5, E.yM + 2.6]].forEach(function (lgt) { var p = crsPt(r0 + 0.12, ang(lgt[0])); W.geo(addF2(new THREE.BoxGeometry(0.3, 0.1, 0.06), 1.6, 0), T(p.x, lgt[1], p.z, 0, -ang(lgt[0]), 0), MT.LIGHT, 1); wLight(p.x, lgt[1] - 0.1, p.z, LAMPC, 0.9, 5); });
    });
  }

  // ---- the lift: a glass shaft on steel posts through both floors, the car waiting below ----
  function crescentLift(W) {
    var C = CRS, L = C.lift, w = L.w / 2, H = C.yU - C.yL + 3.3, b = new Builder();
    [[-w, -w], [w, -w], [-w, w], [w, w]].forEach(function (c) { b.box(c[0] - 0.05, 0, c[1] - 0.05, c[0] + 0.05, H, c[1] + 0.05, MT.ANOD); });
    [0, C.yU - C.yL - 0.25, H - 0.12].forEach(function (y) { b.box(-w, y, -w - 0.04, w, y + 0.12, -w + 0.04, MT.ANOD); b.box(-w, y, w - 0.04, w, y + 0.12, w + 0.04, MT.ANOD); b.box(-w - 0.04, y, -w, -w + 0.04, y + 0.12, w, MT.ANOD); b.box(w - 0.04, y, -w, w + 0.04, y + 0.12, w, MT.ANOD); });
    b.box(-w + 0.08, 0.0, -w + 0.08, w - 0.08, 0.12, w - 0.08, MT.STEEL);                         // the car: floor, back, roof, a rail
    b.box(-w + 0.08, 0.12, w - 0.14, w - 0.08, 2.4, w - 0.08, MT.WOOD); b.box(-w + 0.08, 2.4, -w + 0.08, w - 0.08, 2.5, w - 0.08, MT.STEEL);
    b.box(-w + 0.3, 0.9, w - 0.2, w - 0.3, 0.94, w - 0.15, MT.STEEL);
    b.tag(0, 3, null); W.add(b, crsFrame(L.r, L.a, C.yL));
    var M = crsFrame(L.r, L.a, C.yL);
    [[-w, -w, w, -w, [0, 0, -1]], [w, -w, w, w, [1, 0, 0]], [w, w, -w, w, [0, 0, 1]], [-w, w, -w, -w, [-1, 0, 0]]].forEach(function (f) {
      var gb = new Builder(); gb.surf(1, 1, function (i, j, q) { q.p[0] = lerp(f[0], f[2], i); q.p[1] = j ? H - 0.12 : 0.12; q.p[2] = lerp(f[1], f[3], i); q.nn = f[4]; q.f2[0] = j ? H : 0.1; q.f2[1] = 1; q.m = 0; });
      CRS_GLASS.add(gb, M);
    });
    var lp = crsPt(L.r, L.a); wLight(lp.x, C.yL + 2.3, lp.z, LAMPC, 0.8, 3, [0, -1, 0], 1);
  }

  // ---- the hall's light: a cluster of glass globes on long cables in the double-height space ----
  function crescentChandelier(W) {
    var C = CRS, R = mulberry(606), top = C.yU + C.hR;
    for (var k = 0; k < 9; k++) {
      var rr = 57.4 + (R() - 0.5) * 3.6, aa = (-3.4 + (R() - 0.5) * 4.4) * D2R, y = C.yU + 0.9 + R() * 2.2, p = crsPt(rr, aa), s = 0.17 + R() * 0.1;
      W.geo(addF2(new THREE.SphereGeometry(s, 18, 12), 2.0, 0), T(p.x, y, p.z), MT.LIGHT, 1);
      W.geo(new THREE.CylinderGeometry(s * 0.35, s * 0.35, 0.08, 12), T(p.x, y + s + 0.03, p.z), MT.BRASS, 1);
      tubeAlong(W, [new THREE.Vector3(p.x, y + s + 0.07, p.z), new THREE.Vector3(p.x, top, p.z)], 0.004, 3, MT.STEEL);
      wLight(p.x, y, p.z, LAMPC, 1.3, 9);
    }
  }

  // ---- the garden gallery: a court along the garden front under a sloping glass roof, a stone wall to the slope (T06-15) ----
  function crescentGallery(B) {
    var C = CRS, G = C.gal, yL = C.yL, r1 = C.r1, gr1 = G.r1, gA = G.a, yE = crsRoofY(C.roofOut) - C.roofT - 0.05, rT = r1 + 0.4;
    function gTop(a) { var p = crsPt(gr1 + 0.4, a); return Math.max(groundAt(p.x, p.z, yL) + G.wall, yL + 2.8); }     // the stone wall's top, a parapet above the ground outside
    var n = Math.ceil(2 * gA * gr1 / 0.5), tops = []; for (var i0 = 0; i0 <= n; i0++) tops.push(gTop(lerp(-gA, gA, i0 / n)));
    function topAt(a) { var t = clamp((a + gA) / (2 * gA), 0, 1) * n, i = Math.min(n - 1, Math.floor(t)); return lerp(tops[i], tops[i + 1], t - i); }
    B.zone = ZONE.OUT;
    flat(B, r1 + 0.06, gr1 - 0.3, -gA + 0.004, gA - 0.004, yL, MT.PAVE, 0, true);
    // the stone wall: its face to the gallery, the coping, its face to the slope outside down into the ground
    B.surf(n, 1, function (i, j, q) { var a = lerp(-gA, gA, i / n), p = crsPt(gr1 - 0.3, a), d = crsPt(1, a), y = j ? tops[i] : yL - 0.05; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.c.x - d.x, 0, PAL.c.z - d.z]; q.f[0] = a * gr1; q.f[1] = y; q.f2[0] = y - yL; q.m = MT.CONCRETE; });
    B.surf(n, 1, function (i, j, q) { var a = lerp(-gA, gA, i / n), p = crsPt(j ? gr1 + 0.12 : gr1 - 0.34, a); q.p[0] = p.x; q.p[1] = tops[i] + 0.05; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = a * gr1; q.f[1] = j * 0.45; q.m = MT.CONCRETE; });
    B.surf(n, 1, function (i, j, q) { var a = lerp(-gA, gA, i / n), p = crsPt(gr1 + 0.12, a), d = crsPt(1, a), g = groundAt(p.x, p.z, yL), y = j ? tops[i] + 0.05 : Math.min(g, tops[i]) - 0.6; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f[0] = a * gr1; q.f[1] = y; q.f2[0] = y - g; q.m = MT.CONCRETE; });
    // the glass roof from under the Crescent's eave down to the wall, on bronze rafters every 1.5 m, a gutter on the wall
    CRS_GLASS.surf(n, 1, function (i, j, q) { var a = lerp(-gA, gA, i / n), r = j ? gr1 - 0.15 : rT, p = crsPt(r, a), d = crsPt(1, a), y = j ? tops[i] + 0.16 : yE, dr = gr1 - 0.15 - rT, dy = tops[i] + 0.16 - yE, L = Math.hypot(dr, dy);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * -dy / L, dr / L, (d.z - PAL.c.z) * -dy / L]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    var nrf = Math.round(2 * gA * (rT + gr1) / 2 / 1.5);
    for (var k = 0; k <= nrf; k++) { var a = lerp(-gA + 0.002, gA - 0.002, k / nrf), pa = crsPt(rT, a), pb = crsPt(gr1 - 0.15, a), yb = topAt(a) + 0.1; tubeAlong(B, [new THREE.Vector3(pa.x, yE - 0.07, pa.z), new THREE.Vector3(pb.x, yb, pb.z)], 0.045, 6, MT.RIB); }
    arcWall(B, rT - 0.05, -gA, gA, yE - 0.2, yE + 0.02, MT.RIB, 0, -1, 3);                                                // the beam under the eave
    B.surf(n, 1, function (i, j, q) { var a = lerp(-gA, gA, i / n), p = crsPt(gr1 - 0.3 + j * 0.2, a); q.p[0] = p.x; q.p[1] = tops[i] + 0.06 + (j ? 0.12 : 0); q.p[2] = p.z; q.nn = [0, 1, 0]; q.m = MT.ANOD; });
    // the end walls: stone, up to the roof's line, both faces
    [[-gA, 1], [gA, -1]].forEach(function (e) {
      [[e[0] + e[1] * 0.004, e[1]], [e[0] - e[1] * 0.004, -e[1]]].forEach(function (f) {
        var m = 10, t = crsPt(1, f[0] + Math.PI / 2);
        B.surf(m, 1, function (i, j, q) { var r = lerp(r1 + 0.06, gr1 + 0.12, i / m), p = crsPt(r, f[0]), g = groundAt(p.x, p.z, yL), top = lerp(yE, topAt(e[0]) + 0.16, clamp((r - rT) / (gr1 - 0.15 - rT), 0, 1)), y = j ? top : (f[1] === e[1] ? yL - 0.05 : Math.min(g, yL) - 0.4);
          q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(t.x - PAL.c.x) * f[1], 0, (t.z - PAL.c.z) * f[1]]; q.f[0] = r; q.f[1] = y; q.f2[0] = y - yL; q.m = MT.CONCRETE; });
      });
    });
    // light: uplights washing the stone wall, a warm downlight at each bench
    for (var k2 = 0; k2 < 22; k2++) { var a2 = lerp(-gA + 1.5 / gr1, gA - 1.5 / gr1, k2 / 21), p2 = crsPt(gr1 - 0.55, a2), d2 = crsPt(1, a2);
      B.geo(addF2(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 12), 1.5, 0), T(p2.x, yL + 0.03, p2.z), MT.LIGHT, 1);
      extLight(p2.x, yL + 0.15, p2.z, WARMC, 1.5, 7, [(d2.x - PAL.c.x) * 0.3, 0.95, (d2.z - PAL.c.z) * 0.3], 2); }
    crescentGalleryFurnish(B);
  }

  // ---- where you can stand in the Crescent and its gallery: the two floors, the stairs; NaN at walls ----
  function crescentSupport(x, z, yf) {
    if (!CRS) return undefined;
    var C = CRS, G = C.gal, o = crsLoc(x, z), r = o.r, a = o.a, aa = Math.abs(a), yU = C.yU, yL = C.yL;
    if (o.rad > -25) return undefined;                                   // all of it is behind the dome
    if (r < C.r0 - 0.35 || r > G.r1 + 0.45 || aa > C.a1 + 0.012) return undefined;
    if (aa > C.a1 - 0.006 || r > G.r1 - 0.55) return NaN;                 // the end walls, the gallery's stone wall
    var lower = yf < (yU + yL) / 2, y = lower ? yL : yU, fl = lower ? "lower" : "upper";
    function nearDoor(rr, ang) { return (C.doors || []).some(function (d) { return Math.abs(d.r - rr) < 0.5 && Math.abs(d.a - ang) * rr < 1.1 && Math.abs(d.y - y) < 0.5; }); }
    function obst(f) { if (C.obst) for (var m = 0; m < C.obst.length; m++) { var ob = C.obst[m]; if (ob[4] === f && r > ob[0] && r < ob[1] && a > ob[2] && a < ob[3]) return true; } return false; }
    if (r > C.r1 + 0.25) return lower && !obst("gallery") ? yL : NaN;      // the gallery
    if (r > C.r1 - 0.25) return lower && nearDoor(C.r1, a) ? yL : NaN;     // the garden front and its doors
    if (r < C.r0 + 0.25) return !lower && nearDoor(C.r0, a) ? yU : NaN;    // the winter garden's side and its doors; the retaining wall below
    // the emergency stairs at the corridors' ends
    var E = C.es, eA = C.a1 - E.a;
    if (r < C.rc + 0.1 && aa > eA - 0.12 / E.rm) {
      var e = (aa - eA) * E.rm, zz = r - E.rm;
      if (e < 0.12) return Math.abs(zz) < 0.45 ? y : NaN;                  // the wall across the corridor, a fire door on each floor
      if (r > C.rc - 0.15) return NaN;
      var hy = esY(e, zz, yf); return (hy !== hy || Math.abs(hy - yf) > 0.6) ? NaN : hy;
    }
    // the lift's shaft
    if (Math.abs(r - C.lift.r) < C.lift.w / 2 + 0.25 && Math.abs(a - C.lift.a) * r < C.lift.w / 2 + 0.25) return NaN;
    // the hall: the landing upstairs, the stair, the void
    if (aa < C.hallA - 0.004) {
      var S = C.st, sa = (a - S.a) * r;
      if (Math.abs(sa) < S.w / 2 - 0.05 && r > S.r0 - 0.05 && r < S.r1 + 0.1) { var hy2 = stairY(r); if (Math.abs(hy2 - yf) < 0.6) return hy2; }
      if (Math.abs(sa) < S.w / 2 + 0.15 && r > S.r0 && r < S.r1) return NaN;   // the stair's sides, and the space under it
      if (!lower && r > S.r0 + 0.05) return NaN;                           // the void
      if (!lower && Math.abs(r - S.r0) < 0.2 && Math.abs(sa) > S.w / 2) return NaN;   // the balustrade
      return obst(fl) ? NaN : y;
    }
    if (Math.abs(aa - C.hallA) * r < 0.2 && r > C.rc) return NaN;         // the hall's side walls
    if (Math.abs(r - C.rc) < 0.2) {                                         // the corridor partition, open at the doorways
      var rm = crsRoomAt(a, fl); return rm && rm.doors && rm.doors.some(function (d) { return Math.abs(a - d) * C.rc < 0.4; }) ? y : NaN;
    }
    if (obst(fl)) return NaN;                                               // furniture
    if (r > C.rc) {                                                          // the walls between rooms
      var R = C.rooms; for (var j = 0; j < R.length; j++) { var q = R[j]; if (q.band || q.floor !== fl) continue; if (Math.abs(a - rmA0(q)) * r < 0.18 || Math.abs(a - rmA1(q)) * r < 0.18) return NaN; }
    }
    return y;
  }
  function crescentInside(x, z) { if (!CRS) return 0; var o = crsLoc(x, z); return (o.r > CRS.r0 && o.r < CRS.gal.r1 && Math.abs(o.a) < CRS.a1) ? 1 : 0; }
