  /* ===================== Phase 2: the Ring (T-06), the Academy ===================== */
  // Jim, 5-6 Oct 2026: "please build the circle around the dome, like apple headquarter building"; "much more future
  // proof and impressive than it". The Crescent grows into one ring all the way round the palace (P2.ring): rooms on the
  // outside, a corridor along the garden side, two floors 5.6 m apart, every room under a flat ceiling. It follows the
  // slope so the campus stays hidden from the start: two storeys behind and beside the dome, where the ground falls to the
  // plain, with the garden gallery under glass along them; on the right front, where the hill rises, the upper floor's
  // roof slopes down toward the hill and the lower floor is underground; the Gate Hall at the front, two storeys tall, the
  // way in from the entrance dome; on the left front only the lower floor, its roof at ground level with skylights, beside
  // the sunken grove. Sealed: no door opens to the air. Stairs and lifts: the hall's grand stair and the Gate Hall's,
  // a lift beside each, and a stair at each end of the upper floor (T06-16, T06-18).
  // Polar frame round the dome's centre: r out from the centre, a in radians from straight behind, positive toward +lat.
  // The Ring's angles run from -57 to 303 degrees, so a section can cross the front (191 is -169).
  var CRS = null, CRS_GLASS = new Builder();
  // the new quarter's holes in the terrain (exact shapes, tested in the terrain shaders and the bake) and its bake domains
  var P2CUTS = [], P2DOMAINS = [];
  function p2Sector(clat, crad, r0, r1, a0, a1) { P2CUTS.push({ p: [clat, crad, r0, r1], q: [a0, a1, 0, 0] }); }
  function p2Box(lat0, rad0, lat1, rad1) { P2CUTS.push({ p: [lat0, rad0, lat1, rad1], q: [0, 0, 1, 0] }); }
  function p2CutApply() { P2CUTS.slice(0, 16).forEach(function (c, i) { U.uCutP.value[i].fromArray(c.p); U.uCutQ.value[i].fromArray(c.q); }); U.uCutN.value = Math.min(16, P2CUTS.length); }
  function crsPt(r, a) { return palPol(r, Math.PI - a); }
  function crsLoc(x, z) { var o = palLoc(x, z, {}); return { r: o.r, a: Math.atan2(o.lat, -o.rad), lat: o.lat, rad: o.rad }; }
  // a radial stair between the floors: two flights and a landing, from its top at r0 (upstairs) down outward to r1
  function mkStair(a, r0, r1, w, n, land) {
    var s = { a: a, r0: r0, r1: r1, w: w, n: n, l0: land[0], l1: land[1] };
    s.h = -P2.ring.lower / n; s.half = n / 2; s.run1 = (s.l0 - s.r0) / s.half; s.run2 = (s.r1 - s.l1) / s.half; s.yM = PALY.B - s.half * s.h; return s;
  }
  function crsInit() {
    if (CRS) return CRS;
    var C = P2.ring, S = C.stair, yU = PALY.B, yL = PALY.B + C.lower, hall = C.rooms.filter(function (r) { return r.code === "T06-01"; })[0];
    CRS = { r0: C.r0, r1: C.r1, rc: C.rc, yU: yU, yL: yL, hR: C.ceil, hC: C.ceil_corridor, wall: 0.15, lowStep: 53.7,
            secs: C.sections.map(function (s) { return { a0: s.a[0], a1: s.a[1], kind: s.kind, roof: s.roof, roofOut: s.roof_out === undefined ? s.roof : s.roof_out }; }),
            hallA: hall.a[1] * D2R, gate: [164, 191], upper: C.upper_corridor, hGate: 6.2,
            st: mkStair(S.a * D2R, S.r0, S.r1, S.w, S.n, S.landing), gst: mkStair(187.4 * D2R, 50.6, 60.2, 3.0, S.n, [54.8, 56.0]),
            lift: { r: C.lift[0], a: C.lift[1] * D2R, w: 2.2 }, glift: { r: 50.8, a: 167.4 * D2R, w: 2.2 },
            bay: C.bay_stair, gal: { r1: C.gallery.r1, d0: C.gallery.a[0], d1: C.gallery.a[1], a0: C.gallery.a[0] * D2R, a1: C.gallery.a[1] * D2R, wall: C.gallery.wall },
            grove: P2.garden_ring.grove.a, roofIn: C.r0 - 0.2, roofOut: C.r1 + 0.9, roofT: 0.3, rooms: C.rooms, doors: [],
            gateIn: C.gate.inner_doors, gateOut: [180] };
    CRS.stairA = CRS.st.a; CRS.stairR0 = S.r0; CRS.stairR1 = S.r1;                 // for the walking test
    // the skylights in the sunk quarter's roof, at ground level: about one every 10 degrees over each room below, 2 m
    // along the arc by 6 m across, each through a light well down to the room's ceiling
    var SK = C.skylight, rS = (C.rc + C.r1) / 2; CRS.sky = [];
    C.rooms.forEach(function (rm) {
      if (rm.band || rm.floor !== "lower" || secAt(rm.a[0] + 0.01).kind !== "sunk" || secAt(rm.a[1] - 0.01).kind !== "sunk") return;
      var span = rm.a[1] - rm.a[0], n = Math.max(1, Math.round(span / SK.every));
      for (var k = 0; k < n; k++) { var am = (rm.a[0] + (k + 0.5) * span / n) * D2R; CRS.sky.push({ a0: am - SK.w / 2 / rS, a1: am + SK.w / 2 / rS, r0: rS - SK.l / 2, r1: rS + SK.l / 2, code: rm.code }); }
    });
    return CRS;
  }
  // angles: radians to degrees in the Ring's range [-57, 303); the section there; whether the upper floor runs there
  function ringDeg(a) { var d = a * R2D; return ((d + 57) % 360 + 360) % 360 - 57; }
  function secAt(deg) { var S = CRS.secs; for (var i = 0; i < S.length; i++) if (deg >= S[i].a0 && deg < S[i].a1) return S[i]; return S[0]; }
  function hasUpper(deg) { return deg >= CRS.upper[0] && deg < CRS.upper[1]; }
  function inGate(deg) { return deg >= CRS.gate[0] && deg < CRS.gate[1]; }
  function inGrove(deg) { return deg >= CRS.grove[0] && deg < CRS.grove[1]; }
  // the roof's top at radius r over the section at ring angle deg: a soft crown over the two storeys and the Gate Hall,
  // sloping down toward the hill on the right front, flat at ground level over the sunk quarter
  function ringRoofY(r, deg) {
    var C = CRS, s = secAt(deg), t = clamp((r - C.roofIn) / (C.roofOut - C.roofIn), 0, 1);
    if (s.kind === "two") return C.yU + C.hR + 0.6 + 0.85 * Math.pow(Math.sin(Math.PI * t), 0.8);
    if (s.kind === "low") return C.yU + lerp(s.roof, s.roofOut, clamp((r - C.r0) / (C.r1 - C.r0), -0.1, 1.1));
    if (s.kind === "gate") return C.yU + s.roof - 0.3 + 0.3 * Math.pow(Math.sin(Math.PI * t), 0.8);
    return C.yU + s.roof;
  }
  function crsRoofY(r) { return ringRoofY(r, 0); }                      // over the hall (the gallery's eave)
  function rmA0(rm) { return rm.a[0] * D2R; }
  function rmA1(rm) { return rm.a[1] * D2R; }
  function isHall(rm) { return rm.code === "T06-01" || rm.code === "T06-08" || rm.code === "T06-27" || rm.code === "T06-35"; }
  function isBay(rm) { return rm.code === "T06-16" || rm.code === "T06-18"; }
  function rmFloors(rm) { return rm.floor === "both" ? ["upper", "lower"] : [rm.floor === "gate" ? "upper" : rm.floor]; }
  // the room (from P2) at angle a (radians, any range) on a floor; the hall spans both floors
  function crsRoomAt(a, floor) {
    var deg = ringDeg(a), R = CRS.rooms;
    for (var i = 0; i < R.length; i++) { var rm = R[i]; if (rm.band || rmFloors(rm).indexOf(floor) < 0) continue; if (deg >= rm.a[0] && deg < rm.a[1]) return rm; }
    return null;
  }
  // a room's ceiling over radius r
  function ceilY(rm, fl, r) {
    var C = CRS, s = secAt((rm.a[0] + rm.a[1]) / 2);
    if (fl === "lower") return C.yL + C.hR;
    if (s.kind === "gate") return C.yU + C.hGate;
    if (s.kind === "low") return C.yU + (r < C.lowStep ? 4.2 : 3.6);
    return C.yU + C.hR;
  }
  // the doors from the corridor into a room: near the end toward the nearest hall, and a second at the far end of the big
  // rooms; one in the middle of a stair's bay
  function roomDoors(rm) {
    if (isBay(rm)) return [(rm.a[0] + rm.a[1]) / 2 * D2R];
    function dh(d) { var e = Math.abs(((d % 360) + 540) % 360 - 180), g = Math.abs((((d - 177.5) % 360) + 540) % 360 - 180); return Math.min(e, g); }
    var a0 = rm.a[0], a1 = rm.a[1], near = dh(a0) < dh(a1) ? a0 + 2.2 : a1 - 2.2, far = dh(a0) < dh(a1) ? a1 - 2.2 : a0 + 2.2;
    return (a1 - a0 >= 13.5 ? [near, far] : [near]).map(function (d) { return d * D2R; });
  }
  // the hall's stair (and the Gate Hall's): the height of its tread at radius r (two flights and a landing between them)
  function stairY(r, S) {
    var s = S || CRS.st, yU = CRS.yU;
    if (r < s.r0) return yU;
    if (r < s.l0) return yU - (clamp(Math.floor((r - s.r0) / s.run1), 0, s.half - 1) + 1) * s.h;
    if (r <= s.l1) return s.yM;
    if (r < s.r1) return s.yM - (clamp(Math.floor((r - s.l1) / s.run2), 0, s.half - 1) + 1) * s.h;
    return CRS.yL;
  }
  // the stair in a bay (T06-16, T06-18): landings at the corridor's door on both floors, a flight down along the bay's
  // +a side to a half landing at its outer end, a flight back along the -a side. In the bay's frame: e metres out from the
  // corridor wall (rc), x metres along the arc from the bay's middle. NaN at the wall between the flights.
  function bayY(e, x, yf) {
    var C = CRS, B = C.bay, half = B.n / 2, h = (C.yU - C.yL) / B.n, run = 0.28, L0 = B.landing, L1 = L0 + (half - 1) * run, yM = C.yU - half * h;
    if (e < L0) return yf > (C.yU + C.yL) / 2 ? C.yU : C.yL;
    if (e > L1) return e < L1 + B.landing ? yM : NaN;
    if (x > 0.12) return C.yU - (clamp(Math.floor((e - L0) / run), 0, half - 1) + 1) * h;
    if (x < -0.12) return yM - (clamp(Math.floor((L1 - e) / run), 0, half - 1) + 1) * h;
    return NaN;
  }
  var CRS_FLOOR = { "class": [MT.WOOD, 0], study: [MT.WOOD, 0], lab: [MT.TERRAZZO, 0], compete: [MT.WOOD, 0], games: [MT.WOOD, 0], lounge: [MT.WOOD, 0], staff: [MT.WOOD, 0], service: [MT.TERRAZZO, 0], move: [MT.TERRAZZO, 0],
                    seminar: [MT.WOOD, 3], library: [MT.WOOD, 3], reading: [MT.WOOD, 3], gate: [MT.TERRAZZO, 0], physics: [MT.TERRAZZO, 0], maker: [MT.TERRAZZO, 0], astro: [MT.WOOD, 0],
                    plant: [MT.TERRAZZO, 0], store: [MT.TERRAZZO, 0], kitchen: [MT.TERRAZZO, 0], dining: [MT.WOOD, 0], cafe: [MT.TERRAZZO, 0], assembly: [MT.WOOD, 3], art: [MT.WOOD, 0], music: [MT.WOOD, 3], clinic: [MT.TERRAZZO, 0] };
  var CRS_WALL = { "class": 0, study: 0, lab: 0, compete: 1, games: 2, lounge: 3, staff: 1, service: 0, move: 0, seminar: 1, library: 3, reading: 2, gate: 0, physics: 0, maker: 0, astro: 1, plant: 0, store: 0, kitchen: 0, dining: 2, cafe: 0, assembly: 1, art: 0, music: 3, clinic: 0 };
  var CRS_GLAZED = { cafe: 1, art: 1 };                                 // rooms with glass to the corridor (and the sunken grove beyond)
  var CRS_TILES = { "class": 1, study: 1, lab: 1, compete: 1, games: 1, staff: 1, seminar: 1, library: 1, physics: 1, maker: 1, astro: 1, art: 1, music: 1, clinic: 1 };

  // ---- surfaces in the polar frame ----
  function arcWall(B, r, a0, a1, y0, y1, mat, g2, out, f2x, ny) {      // a curved wall at radius r, facing out (+1) or in (-1); ny rows up it
    var n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r / 0.5)), m = ny || 1;
    B.surf(n, m, function (i, j, q) { var a = lerp(a0, a1, i / n), p = crsPt(r, a), d = crsPt(1, a), y = lerp(y0, y1, j / m);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * out, 0, (d.z - PAL.c.z) * out]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = f2x === undefined ? 99 : f2x; q.f2[1] = g2 || 0; q.m = mat; });
  }
  function radWall(B, a, r0, r1, y0, y1, mat, g2, side, f2x, ny) {      // a flat wall along a radius at angle a, facing +a (+1) or -a (-1); ny rows up it
    var n = Math.max(2, Math.ceil((r1 - r0) / 0.5)), t = crsPt(1, a + Math.PI / 2), tn = [(t.x - PAL.c.x) * side, 0, (t.z - PAL.c.z) * side], m = ny || 1;
    B.surf(n, m, function (i, j, q) { var r = lerp(r0, r1, i / n), p = crsPt(r, a), y = lerp(y0, y1, j / m);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = tn; q.f[0] = r; q.f[1] = y; q.f2[0] = f2x === undefined ? 99 : f2x; q.f2[1] = g2 || 0; q.m = mat; });
  }
  function flat(B, r0, r1, a0, a1, y, mat, g2, up) {                    // a level floor (up) or ceiling (down)
    var nr = Math.max(2, Math.ceil((r1 - r0) / 0.6)), na = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r1 / 0.6));
    B.surf(na, nr, function (i, j, q) { var a = lerp(a0, a1, i / na), r = lerp(r0, r1, j / nr), p = crsPt(r, a);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, up ? 1 : -1, 0]; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 0; q.f2[1] = g2 || 0; q.m = mat; });
  }
  // a polar strip less its holes ({r0, r1, a0, a1}, apart in angle): the rectangles [r0, r1, a0, a1] that cover the rest
  function flatBits(r0, r1, a0, a1, holes) {
    var out = [], cur = a0;
    (holes || []).filter(function (h) { return h.a1 > a0 && h.a0 < a1; }).sort(function (p, q) { return p.a0 - q.a0; }).forEach(function (h) {
      if (h.a0 > cur) out.push([r0, r1, cur, h.a0]);
      if (h.r0 > r0) out.push([r0, h.r0, h.a0, h.a1]); if (h.r1 < r1) out.push([h.r1, r1, h.a0, h.a1]);
      cur = h.a1;
    });
    if (a1 > cur) out.push([r0, r1, cur, a1]);
    return out;
  }
  function skyIn(rm) { return CRS.sky.filter(function (h) { return h.code === rm.code; }); }
  function inSkylight(r, a, m) { return CRS.sky.some(function (h) { return r > h.r0 - m && r < h.r1 + m && a > h.a0 - m / r && a < h.a1 + m / r; }); }
  function grow(h, m) { var rr = (h.r0 + h.r1) / 2; return { r0: h.r0 - m, r1: h.r1 + m, a0: h.a0 - m / rr, a1: h.a1 + m / rr }; }
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
  // an open doorway in a glass partition: anodized jambs and head, glass above it
  function glassDoorway(W, r, a, y0, y1) {
    var M = crsFrame(r, a, y0), fr = new Builder(), w = 0.5;
    fr.box(-w - 0.07, 0, -0.07, -w, 2.3, 0.07, MT.ANOD); fr.box(w, 0, -0.07, w + 0.07, 2.3, 0.07, MT.ANOD); fr.box(-w - 0.07, 2.22, -0.07, w + 0.07, 2.3, 0.07, MT.ANOD);
    fr.box(-w - 0.07, 2.3, -0.05, w + 0.07, 2.36, 0.05, MT.ANOD); fr.box(-w - 0.07, y1 - y0 - 0.1, -0.05, w + 0.07, y1 - y0, 0.05, MT.ANOD); fr.tag(0, 3, null); W.add(fr, M);
    CRS_GLASS.surf(2, 1, function (i, j, q) { var aa = a + (-w + w * i) / r, p = crsPt(r, aa), d = crsPt(1, aa); q.p[0] = p.x; q.p[1] = j ? y1 - 0.1 : y0 + 2.36; q.p[2] = p.z; q.nn = [PAL.c.x - d.x, 0, PAL.c.z - d.z]; q.f2[0] = j ? y1 - y0 : 2.36; q.f2[1] = 1; q.m = 0; });
  }
  // ---- the building ----
  function crescentBuild(B, W) {
    var C = crsInit(), G = C.gal, r0 = C.r0, r1 = C.r1, rc = C.rc, yU = C.yU, yL = C.yL, hw = C.wall / 2, hA = C.hallA, st = C.st, D = D2R, up = C.upper;
    // the terrain's holes: the garden ring and the Ring all the way round, the gallery; the bake's domains round them
    p2Sector(0, 0, PAL.R - 0.1, r1 + 0.12, -4, 4);
    p2Sector(0, 0, r1, G.r1 + 0.12, G.a0 - 0.004, G.a1 + 0.004);
    p2CutApply();
    [[-70, -27, -70, 70], [27, 70, -70, 70], [-27, 27, -70, -40]].forEach(function (d) { P2DOMAINS.push({ l0: d[0], l1: d[1], r0: d[2], r1: d[3], y0: yL - 0.6, y1: yU + 14.5 }); });
    W.zone = ZONE.WING;
    // floors: the corridors' terrazzo (the upper one where the upper floor runs, the lower one all the way round), the
    // rooms' own floors, the halls'; the rooms' flat ceilings (a lower soffit along the outer wall under the sloping roof)
    flat(W, r0, rc, up[0] * D, up[1] * D, yU, MT.TERRAZZO, 0, true);
    flat(W, r0, rc, -57 * D, 303 * D, yL, MT.TERRAZZO, 0, true);
    C.rooms.forEach(function (rm) {
      if (rm.band || isBay(rm)) return;
      var a0 = rmA0(rm), a1 = rmA1(rm), fm = CRS_FLOOR[rm.kind] || [MT.TERRAZZO, 0], tiles = CRS_TILES[rm.kind] ? 6 : 0;
      rmFloors(rm).forEach(function (fl) {
        var y = fl === "upper" ? yU : yL;
        if (rm.code === "T06-01") { flat(W, rc, st.r0, a0, a1, y, MT.TERRAZZO, 0, true); return; }   // the hall's landing; beyond it the hall is open to below
        if (rm.code === "T06-27") { gateFloor(W); return; }
        flat(W, rc, r1, a0, a1, y, fm[0], fm[1], true);
        if (rm.code === "T06-08") return;                                                         // open to the hall above
        if (rm.code === "T06-35") { gateCeilingBelow(W); return; }
        if (fl === "upper" && secAt((rm.a[0] + rm.a[1]) / 2).kind === "low") {
          flat(W, rc, C.lowStep, a0, a1, yU + 4.2, MT.PLASTER, tiles, false); flat(W, C.lowStep, r1 + 0.05, a0, a1, yU + 3.6, MT.PLASTER, tiles, false);
          arcWall(W, C.lowStep, a0, a1, yU + 3.6, yU + 4.2, MT.PLASTER, 0, -1);
        } else flatBits(rc, r1 + 0.05, a0, a1, fl === "lower" ? skyIn(rm) : []).forEach(function (q) { flat(W, q[0], q[1], q[2], q[3], ceilY(rm, fl, 50), MT.PLASTER, tiles, false); });
      });
    });
    [[up[0], -7], [7, 164], [191, up[1]]].forEach(function (s) { flat(W, r0 - 0.05, rc, s[0] * D, s[1] * D, yU + C.hC, MT.PLASTER, 0, false); });   // the corridors' ceilings
    [[-57, -7], [7, 164], [191, 303]].forEach(function (s) { flat(W, r0 - 0.05, rc, s[0] * D, s[1] * D, yL + C.hC, MT.PLASTER, 0, false); });
    flat(W, r0 - 0.05, r1 + 0.05, -hA, hA, yU + C.hR, MT.PLASTER, 0, false);                       // the hall's ceiling, two storeys up
    flat(W, r0 - 0.05, st.r0, -hA, hA, yU - 0.35, MT.PLASTER, 0, false);                           // under the landing
    arcWall(W, st.r0, -hA, hA, yU - 0.35, yU, MT.PLASTER, 0, 1);
    // the corridor partition at rc on both floors, with doorways into each room; the walls between the rooms
    C.rooms.forEach(function (rm) {
      if (rm.band || isHall(rm)) return;
      var ra0 = rmA0(rm), ra1 = rmA1(rm), wc = CRS_WALL[rm.kind] || 0, half = 0.5 / rc, ds = roomDoors(rm), tall = isBay(rm), glz = CRS_GLAZED[rm.kind];
      rm.doors = ds; rm.door = ds[0];
      rmFloors(rm).forEach(function (fl) {
        var y = fl === "upper" ? yU : yL, hc = (tall ? y + C.hR : ceilY(rm, fl, rc + 0.5)) - y, cur = ra0;
        function seg(s0, s1) { if (s1 - s0 < 1e-4) return;
          if (glz) { glassFront(W, rc, s0, s1, y, y + C.hC, -1, []); arcWall(W, rc + 0.05, s0, s1, y + C.hC, y + hc + 0.1, MT.PLASTER, wc, 1); return; }
          arcWall(W, rc - hw, s0, s1, y, y + C.hC + 0.1, MT.PLASTER, 0, -1, undefined, 6); arcWall(W, rc + hw, s0, s1, y, y + hc + 0.1, MT.PLASTER, wc, 1);
          arcWall(W, rc - hw - 0.012, s0, s1, y, y + 0.1, MT.ANOD, 0, -1); }
        ds.slice().sort(function (p, q) { return p - q; }).forEach(function (d) { seg(cur, d - half); cur = d + half; }); seg(cur, ra1);
        ds.forEach(function (d) {
          if (glz) { glassDoorway(W, rc, d, y, y + C.hC); arcWall(W, rc + 0.05, d - half, d + half, y + C.hC, y + hc + 0.1, MT.PLASTER, wc, 1); return; }
          arcWall(W, rc - hw, d - half, d + half, y + 2.22, y + C.hC + 0.1, MT.PLASTER, 0, -1); arcWall(W, rc + hw, d - half, d + half, y + 2.22, y + hc + 0.1, MT.PLASTER, wc, 1);
          crsDoorway(W, rc, d, y, 1);
        });
        if (!tall) [[ra0, 1], [ra1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * hw / ((rc + r1) / 2), rc, r1 - 0.06, y, y + hc + 0.1, MT.PLASTER, wc, e[1]); });
      });
      if (tall) [[ra0, 1], [ra1, -1]].forEach(function (e) { radWall(W, e[0] + e[1] * hw / ((rc + r1) / 2), rc, r1 - 0.06, yL, yU + C.hR + 0.1, MT.PLASTER, 0, e[1]); });
    });
    [[-hA, -1], [hA, 1]].forEach(function (e) { radWall(W, e[0] - e[1] * hw / 53, rc, r1 - 0.06, yL, yU + C.hR + 0.1, MT.PLASTER, 0, -e[1]); });   // the hall's side walls, two storeys
    [[164, -1], [191, 1]].forEach(function (e) {                                                                                                   // the Gate Hall's, and below it
      var a = e[0] * D - e[1] * hw / 53; radWall(W, a, rc, r1 - 0.06, yU, yU + C.hGate + 0.1, MT.PLASTER, 0, -e[1], undefined, 8); radWall(W, a, rc, r1 - 0.06, yL, yL + C.hR + 0.1, MT.PLASTER, 0, -e[1]);
    });
    radWall(W, up[0] * D + 0.06 / 48, r0, rc, yU, yU + C.hC + 0.1, MT.PLASTER, 0, 1);              // the upper corridor's two ends
    radWall(W, up[1] * D - 0.06 / 48, r0, rc, yU, yU + C.hC + 0.1, MT.PLASTER, 0, -1);
    // the lower corridor's back: the retaining wall (glass onto the sunken grove); in the halls up to their ceilings
    [[-57, C.grove[0]], [C.grove[1], 303]].forEach(function (s) {                                 // with rows up it, and its skirting
      arcWall(W, r0 + 0.02, s[0] * D, s[1] * D, yL, yL + C.hC + 0.1, MT.PLASTER, 0, 1, undefined, 6);
      arcWall(W, r0 + 0.032, s[0] * D, s[1] * D, yL, yL + 0.1, MT.ANOD, 0, 1);
    });
    arcWall(W, r0 + 0.02, 164 * D, 191 * D, yL + C.hC + 0.1, yL + C.hR + 0.05, MT.PLASTER, 0, 1);
    arcWall(W, r0 + 0.02, -hA, hA, yL + C.hC + 0.1, yU - 0.35, MT.PLASTER, 0, 1);                 // up to the landing in the hall
    arcWall(W, r0 + 0.07, -hA, hA, yU + C.hC, yU + C.hR + 0.05, MT.PLASTER, 0, 1);                // and above the glass to the hall's ceiling
    // the outer wall's inside face where there is no glass; frosted panels behind the glass at the washrooms
    C.rooms.forEach(function (rm) {
      if (rm.band) return;
      var s = secAt((rm.a[0] + rm.a[1]) / 2), inGal = rm.a[0] >= G.d0 - 0.01 && rm.a[1] <= G.d1 + 0.01, a0 = rmA0(rm), a1 = rmA1(rm), wc = CRS_WALL[rm.kind] || 0;
      if (isBay(rm)) { if (!inGal) arcWall(W, r1 - 0.06, a0, a1, yL, yU + C.hR + 0.1, MT.PLASTER, 0, -1); return; }
      rmFloors(rm).forEach(function (fl) {
        var y = fl === "upper" ? yU : yL, glass = (s.kind === "two" && inGal) || (s.kind === "gate" && fl === "upper"), top = ceilY(rm, fl, r1 - 0.5) + 0.05;
        if (glass) { if (rm.kind === "service") arcWall(W, r1 - 0.12, a0, a1, y + 0.08, y + C.hR - 0.1, MT.PLASTER, 0, -1); return; }
        if (s.kind === "low" && fl === "upper") { arcWall(W, r1 - 0.06, a0, a1, y, y + 2.2, MT.PLASTER, wc, -1); arcWall(W, r1 - 0.06, a0, a1, y + 3.5, top, MT.PLASTER, 0, -1); return; }
        arcWall(W, r1 - 0.06, a0, a1, y, top, MT.PLASTER, wc, -1);
      });
    });
    doorPlates(W);
    ringSigns(W);
    corridorArt(W);
    crescentStair(W, C.st, true);
    crescentStair(W, C.gst, false);
    C.rooms.forEach(function (rm) { if (isBay(rm)) bayStair(W, rm); });
    crescentLift(W, C.lift); crescentLift(W, C.glift);
    C.sky.forEach(function (h) { skylightWell(W, h); });
    // lights: pendants in rows in the rooms (three rows in the big ones), downlights in the corridors and the halls
    C.rooms.forEach(function (rm) {
      if (rm.band || isHall(rm) || isBay(rm) || rm.kind === "cafe") return;                       // the café has its own lamps over the tables
      var ra0 = rmA0(rm), ra1 = rmA1(rm), span = (ra1 - ra0) * 55.8, nl = Math.max(1, Math.round((span - 1.6) / 3.4));
      var rows = ra1 - ra0 >= 13.5 * D2R ? [52.6, 55.9, 59.2] : [53.2, 58.4];
      rmFloors(rm).forEach(function (fl) {
        var y = fl === "upper" ? yU : yL;
        rows.forEach(function (rr) { var yc = ceilY(rm, fl, rr), yl = Math.min(y + 3.25, yc - 0.5); for (var k3 = 0; k3 < nl; k3++) {
          var aa = lerp(ra0, ra1, (k3 + 0.5) / nl); if (fl === "lower" && inSkylight(rr, aa, 0.5)) continue;
          var M = crsFrame(rr, aa, yl); W.add(linearPendant(), M);
          [-0.5, 0.5].forEach(function (d) { var p0 = new THREE.Vector3(d, 0.06, 0).applyMatrix4(M), p1 = new THREE.Vector3(d, yc - yl, 0).applyMatrix4(M); tubeAlong(W, [p0, p1], 0.003, 3, MT.STEEL); });
          var lp = crsPt(rr, aa); wLight(lp.x, yl - 0.15, lp.z, LAMPC, rows.length > 2 ? 1.9 : 2.1, 8, [0, -1, 0], 1);
        } });
      });
    });
    function corridorLights(d0, d1, y, k) {
      for (var ka = d0 * D + 2.0 / r0; ka < d1 * D - 1.0 / r0; ka += 4.0 / r0) { var lp2 = crsPt((r0 + rc) / 2, ka); W.geo(addF2(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), 1.8, 0), T(lp2.x, y + C.hC - 0.012, lp2.z), MT.LIGHT, 1); wLight(lp2.x, y + C.hC - 0.2, lp2.z, LAMPC, k, 6, [0, -1, 0], 1.2); }
    }
    [[up[0], -7], [7, 164], [191, up[1]]].forEach(function (s) { corridorLights(s[0], s[1], yU, 1.3); });
    [[-57, -7], [7, 164], [191, 303]].forEach(function (s) { corridorLights(s[0], s[1], yL, 1.6); });         // no daylight down there
    [[47.6, -4.5], [47.6, 4.5], [49.8, 0]].forEach(function (d) { var p = crsPt(d[0], d[1] * D); W.geo(addF2(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), 1.8, 0), T(p.x, yU + C.hR - 0.012, p.z), MT.LIGHT, 1); wLight(p.x, yU + C.hR - 0.2, p.z, LAMPC, 1.8, 8, [0, -1, 0], 1.2); });
    for (var gd = 166.5; gd < 190; gd += 4.5) [47.8, 53.0, 58.6].forEach(function (rr) {             // the Gate Hall's and Under the gate's downlights
      if (Math.abs(gd - 187.4) < 2.4 && rr > 50) return;                                               // not over the stair's opening
      var p = crsPt(rr, gd * D); W.geo(addF2(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 14), 1.8, 0), T(p.x, yU + C.hGate - 0.012, p.z), MT.LIGHT, 1); wLight(p.x, yU + C.hGate - 0.2, p.z, LAMPC, 2.3, 11, [0, -1, 0], 1.2);
      W.geo(addF2(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), 1.8, 0), T(p.x, yL + C.hR - 0.012, p.z), MT.LIGHT, 1); wLight(p.x, yL + C.hR - 0.2, p.z, LAMPC, 1.6, 7, [0, -1, 0], 1.2);
    });
    // wall-washers in the Gate Hall's ceiling along its two tall end walls
    [[191, -1], [164, 1]].forEach(function (e) {
      var t = crsPt(1, e[0] * D + Math.PI / 2), dx = (t.x - PAL.c.x) * -e[1], dz = (t.z - PAL.c.z) * -e[1];
      for (var wr = 51.2; wr < 61.5; wr += 2.5) { var p = crsPt(wr, e[0] * D + e[1] * 1.1 / wr);
        W.geo(addF2(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 14), 1.8, 0), T(p.x, yU + C.hGate - 0.012, p.z), MT.LIGHT, 1);
        wLight(p.x, yU + C.hGate - 0.3, p.z, LAMPC, 2.2, 9, [dx * 0.7, -0.71, dz * 0.7], 1.0); }
    });
    crescentChandelier(W);
    W.zone = ZONE.OUT;
    B.zone = ZONE.OUT;
    ringOutside(B);
    crescentGallery(B);
    crescentFurnish(W);
  }

  // ---- the Gate Hall's floor round the stair's opening, its ceiling; the ceiling below it, with the same opening ----
  function gateOpening() { var S = CRS.gst, m = (S.w / 2 + 0.15) / 55.4; return { a0: S.a - m, a1: S.a + m, r0: S.r0, r1: S.r1 + 0.4 }; }
  function gateFloor(W) {
    var C = CRS, D = D2R, a0 = 164 * D, a1 = 191 * D, yU = C.yU, O = gateOpening();
    flat(W, C.rc, C.r1, a0, O.a0, yU, MT.TERRAZZO, 0, true); flat(W, C.rc, C.r1, O.a1, a1, yU, MT.TERRAZZO, 0, true);
    flat(W, C.rc, O.r0, O.a0, O.a1, yU, MT.TERRAZZO, 0, true); flat(W, O.r1, C.r1, O.a0, O.a1, yU, MT.TERRAZZO, 0, true);
    flat(W, C.r0 - 0.05, C.r1 + 0.05, a0, a1, yU + C.hGate, MT.PLASTER, 0, false);                // the hall's ceiling
    // the opening's edges, the slab from the lower hall's ceiling up to the floor
    var y0 = C.yL + C.hR;
    [[O.a0, 1], [O.a1, -1]].forEach(function (e) { radWall(W, e[0], O.r0, O.r1, y0, yU, MT.PLASTER, 0, e[1]); });
    arcWall(W, O.r1, O.a0, O.a1, y0, yU, MT.PLASTER, 0, -1);
    // a glass balustrade with a steel rail round the opening, open at the stair's top
    var S = C.gst, gap = (S.w / 2 + 0.05) / S.r0;
    [[[O.a0, O.r0], [O.a0, O.r1]], [[O.a0, O.r1], [O.a1, O.r1]], [[O.a1, O.r1], [O.a1, O.r0]], [[O.a0, O.r0], [S.a - gap, O.r0]], [[S.a + gap, O.r0], [O.a1, O.r0]]].forEach(function (L) {
      var p0 = crsPt(L[0][1], L[0][0]), p1 = crsPt(L[1][1], L[1][0]), n = 8, rail = [];
      for (var k = 0; k <= n; k++) rail.push(new THREE.Vector3(lerp(p0.x, p1.x, k / n), yU + 1.0, lerp(p0.z, p1.z, k / n)));
      tubeAlong(W, rail, 0.025, 8, MT.STEEL);
      [0, 0.5, 1].forEach(function (t) { tubeAlong(W, [new THREE.Vector3(lerp(p0.x, p1.x, t), yU, lerp(p0.z, p1.z, t)), new THREE.Vector3(lerp(p0.x, p1.x, t), yU + 1.0, lerp(p0.z, p1.z, t))], 0.02, 6, MT.STEEL); });
      CRS_GLASS.surf(1, 1, function (i, j, q) { var p = i ? p1 : p0; q.p[0] = p.x; q.p[1] = yU + (j ? 0.95 : 0.05); q.p[2] = p.z; q.nn = [p1.z - p0.z, 0, p0.x - p1.x]; q.f2[0] = j ? 1 : 0.05; q.f2[1] = 1; q.m = 0; });
    });
  }
  function gateCeilingBelow(W) {
    var C = CRS, D = D2R, a0 = 164 * D, a1 = 191 * D, y = C.yL + C.hR, O = gateOpening();
    flat(W, C.r0 - 0.05, C.r1 + 0.05, a0, O.a0, y, MT.PLASTER, 0, false); flat(W, C.r0 - 0.05, C.r1 + 0.05, O.a1, a1, y, MT.PLASTER, 0, false);
    flat(W, C.r0 - 0.05, O.r0, O.a0, O.a1, y, MT.PLASTER, 0, false); flat(W, O.r1, C.r1 + 0.05, O.a0, O.a1, y, MT.PLASTER, 0, false);
  }

  // ---- outside: the fronts section by section, the garden side, the roof ----
  function ringOutside(B) {
    var C = CRS, G = C.gal, r0 = C.r0, r1 = C.r1, yU = C.yU, yL = C.yL, D = D2R;
    // the outer wall at r1 where it is solid: white composite from below the ground to the roof's edge, a band of windows if asked
    function solidOut(a0, a1, wy0, wy1) {
      var r = r1 + 0.06, n = Math.max(2, Math.ceil((a1 - a0) * r / 0.5));
      function top(a) { var d = ringDeg(a); return ringRoofY(r1, d) - C.roofT; }
      function bot(a) { var p = crsPt(r + 0.3, a); return Math.min(groundAt(p.x, p.z, yL), yU) - 0.5; }
      function wall(fa, fb) { B.surf(n, 1, function (i, j, q) { var a = lerp(a0, a1, i / n), p = crsPt(r, a), d = crsPt(1, a), y = j ? fb(a) : fa(a); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = y - bot(a); q.m = MT.SHELL; }); }
      if (wy0 === undefined) { wall(bot, top); return; }
      wall(bot, function () { return wy0; }); wall(function () { return wy1; }, top); glassFront(B, r1, a0, a1, wy0, wy1, 1, []);
    }
    function band(r, a0, a1, y0, top, out, mat) { var n = Math.max(2, Math.ceil((a1 - a0) * r / 0.5)); B.surf(n, 1, function (i, j, q) { var a = lerp(a0, a1, i / n), p = crsPt(r, a), d = crsPt(1, a), y = j ? top(a) : y0; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * out, 0, (d.z - PAL.c.z) * out]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = 3; q.m = mat; }); }
    function eaveOut(a) { return ringRoofY(C.roofOut, ringDeg(a)) - C.roofT; }
    function eaveIn(a) { return ringRoofY(C.roofIn, ringDeg(a)) - C.roofT; }
    // the outer fronts
    C.secs.forEach(function (s) {
      var a0 = s.a0 * D, a1 = s.a1 * D;
      if (s.kind === "two") {
        var g0 = Math.max(s.a0, G.d0) * D, g1 = Math.min(s.a1, G.d1) * D, gd = [0];
        C.rooms.forEach(function (rm) { if (rm.floor === "lower" && !rm.band && rm.kind !== "service" && rm.kind !== "move" && rm.a[0] >= G.d0 && rm.a[1] <= G.d1) gd.push((rm.a[0] + rm.a[1]) / 2 * D); });
        glassFront(B, r1, g0, g1, yL, yL + C.hR, 1, gd);
        glassFront(B, r1, g0, g1, yU, yU + C.hR, 1, []);
        band(r1 + 0.06, g0, g1, yL + C.hR, function () { return yU; }, 1, MT.COMPOSITE);                     // the floor band
        band(r1 + 0.06, g0, g1, yU + C.hR, eaveOut, 1, MT.DKGLASS);                                          // dark glass up to the eave
        if (g0 > a0) solidOut(a0, g0);
        if (g1 < a1) solidOut(g1, a1);
      } else if (s.kind === "low") solidOut(a0, a1, yU + 2.2, yU + 3.5);
      else if (s.kind === "gate") { glassFront(B, r1, a0, a1, yU, yU + C.hGate, 1, C.gateOut.map(function (d) { return d * D; })); band(r1 + 0.06, a0, a1, yU + C.hGate, eaveOut, 1, MT.DKGLASS); }
      else solidOut(a0, a1);
    });
    // the garden side: the upper corridor's glass with its doors onto the garden ring, the Gate Hall's glass wall, the
    // lower corridor's glass onto the sunken grove; dark glass above them up to the eave
    var doors = [-50, -25, 0, 25, 50, 75, 100, 125, 150];
    [[C.upper[0], 164], [191, C.upper[1]]].forEach(function (s) {
      glassFront(B, r0, s[0] * D, s[1] * D, yU, yU + C.hC, -1, doors.filter(function (d) { return d > s[0] + 2 && d < s[1] - 2; }).map(function (d) { return d * D; }));
      band(r0 - 0.06, s[0] * D, s[1] * D, yU + C.hC, eaveIn, -1, MT.DKGLASS);
    });
    glassFront(B, r0, 164 * D, 191 * D, yU, yU + C.hGate, -1, C.gateIn.map(function (d) { return d * D; }));
    band(r0 - 0.06, 164 * D, 191 * D, yU + C.hGate, eaveIn, -1, MT.DKGLASS);
    glassFront(B, r0, C.grove[0] * D, C.grove[1] * D, yL, yL + C.hC, -1, [233 * D, 252 * D, 271 * D]);              // doors out into the grove
    band(r0 - 0.06, C.grove[0] * D, C.grove[1] * D, yL + C.hC, function () { return yU - 0.45; }, -1, MT.COMPOSITE);
    // the roof, section by section: its top, its edges, the soffit under the outer eave with downlights
    C.secs.forEach(function (s) {
      var a0 = s.a0 * D, a1 = s.a1 * D, mid = (s.a0 + s.a1) / 2, sunk = s.kind === "sunk", ro = sunk ? r1 + 0.15 : C.roofOut, ri = C.roofIn;
      flatBits(ri, ro, a0, a1, sunk ? C.sky.map(function (h) { return grow(h, 0.14); }) : []).forEach(function (bt) {
        var na = Math.max(2, Math.ceil((bt[3] - bt[2]) * bt[1] / 0.8)), nr = (s.kind === "two" || s.kind === "gate") ? 24 : Math.max(2, Math.ceil((bt[1] - bt[0]) / 4));
        B.surf(na, nr, function (i, j, q) { var a = lerp(bt[2], bt[3], i / na), r = lerp(bt[0], bt[1], j / nr), p = crsPt(r, a), y = ringRoofY(r, mid); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 5; q.m = MT.SHELL; });
        B.orient(B.count() - (na + 1) * (nr + 1), function () { return [0, 1, 0]; });
      });
      if (sunk) C.sky.forEach(function (h) { skylightTop(B, h); });
      arcWall(B, ri, a0, a1, ringRoofY(ri, mid) - C.roofT, ringRoofY(ri, mid), MT.ANOD, 0, -1, 4);
      arcWall(B, ro, a0, a1, ringRoofY(ro, mid) - C.roofT, ringRoofY(ro, mid), MT.ANOD, 0, 1, 4);
      if (sunk) return;
      var nsf = Math.ceil((a1 - a0) * ro / 0.8), ys = ringRoofY(ro, mid) - C.roofT;
      B.surf(nsf, 2, function (i, j, q) { var a = lerp(a0, a1, i / nsf), r = lerp(r1, ro, j / 2), p = crsPt(r, a); q.p[0] = p.x; q.p[1] = ys; q.p[2] = p.z; q.nn = [0, -1, 0]; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 4; q.m = MT.SHELL; });
      if (s.kind !== "two") for (var ka2 = a0 + 0.04; ka2 < a1; ka2 += 3.0 / ro) { var dl = crsPt((ro + r1) / 2, ka2), yd = ys - 0.012; B.geo(addF2(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), 1.8, 0), T(dl.x, yd, dl.z), MT.LIGHT, 1); extLight(dl.x, yd - 0.15, dl.z, WARMC, 1.3, 6, [0, -1, 0], 1.4); }
    });
    // where the roof steps between sections: a white face from the lower roof up to the higher, across the roof's width
    [120, 164, 191, 197, 303].forEach(function (d) {
      var a = d * D, db = d >= 303 ? -56.99 : d + 0.01, sunkB = secAt(db).kind === "sunk", sunkA = secAt(d - 0.01).kind === "sunk", ro = (sunkA || sunkB) ? r1 + 0.15 : C.roofOut, n = 18, t = crsPt(1, a + Math.PI / 2);
      B.surf(n, 1, function (i, j, q) { var r = lerp(C.roofIn, ro, i / n), A = ringRoofY(r, d - 0.01), Bv = ringRoofY(r, db), p = crsPt(r, a), sg = A > Bv ? 1 : -1;
        q.p[0] = p.x; q.p[1] = j ? Math.max(A, Bv) : Math.min(A, Bv) - C.roofT; q.p[2] = p.z; q.nn = [(t.x - PAL.c.x) * sg, 0, (t.z - PAL.c.z) * sg]; q.f[0] = r; q.f[1] = q.p[1]; q.f2[0] = 4; q.m = MT.SHELL; });
      if (sunkA || sunkB) {                                                                     // the end of the eave that overhangs on the high side
        var hiSide = sunkA ? 1 : -1, ah = a + hiSide * 0.0004;
        B.surf(4, 1, function (i, j, q) { var r = lerp(r1 + 0.15, C.roofOut, i / 4), y = ringRoofY(r, sunkA ? db : d - 0.01), p = crsPt(r, ah); q.p[0] = p.x; q.p[1] = j ? y : y - C.roofT; q.p[2] = p.z; q.nn = [(t.x - PAL.c.x) * -hiSide, 0, (t.z - PAL.c.z) * -hiSide]; q.f2[0] = 4; q.m = MT.ANOD; });
      }
    });
  }

  // ---- a skylight: the well's white walls from the room's ceiling up through the roof, a bronze curb on the roof, the
  // glass on it with two glazing bars ----
  function skyGlassY() { return CRS.yU + CRS.secs.filter(function (s) { return s.kind === "sunk"; })[0].roof + 0.3; }
  function skylightWell(W, h) {
    var C = CRS, y0 = C.yL + C.hR, y1 = skyGlassY();
    arcWall(W, h.r0, h.a0, h.a1, y0, y1, MT.PLASTER, 0, 1); arcWall(W, h.r1, h.a0, h.a1, y0, y1, MT.PLASTER, 0, -1);
    radWall(W, h.a0, h.r0, h.r1, y0, y1, MT.PLASTER, 0, 1); radWall(W, h.a1, h.r0, h.r1, y0, y1, MT.PLASTER, 0, -1);
  }
  function skylightTop(B, h) {
    var C = CRS, yR = skyGlassY() - 0.3, y1 = skyGlassY(), o = grow(h, 0.14), rm = (h.r0 + h.r1) / 2;
    arcWall(B, o.r0, o.a0, o.a1, yR - 0.05, y1, MT.ANOD, 0, -1, 3); arcWall(B, o.r1, o.a0, o.a1, yR - 0.05, y1, MT.ANOD, 0, 1, 3);
    radWall(B, o.a0, o.r0, o.r1, yR - 0.05, y1, MT.ANOD, 0, -1, 3); radWall(B, o.a1, o.r0, o.r1, yR - 0.05, y1, MT.ANOD, 0, 1, 3);
    flatBits(o.r0, o.r1, o.a0, o.a1, [h]).forEach(function (q) { flat(B, q[0], q[1], q[2], q[3], y1, MT.ANOD, 0, true); });
    CRS_GLASS.surf(2, 2, function (i, j, q) { var a = lerp(h.a0, h.a1, i / 2), r = lerp(h.r0, h.r1, j / 2), p = crsPt(r, a); q.p[0] = p.x; q.p[1] = y1 + 0.01; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = a * r; q.f[1] = r; q.f2[0] = 3; q.f2[1] = 4; q.m = 0; });
    [1 / 3, 2 / 3].forEach(function (t) { var rr = lerp(h.r0, h.r1, t), bb = new Builder(); bb.box(-(h.a1 - h.a0) * rr / 2, 0, -0.03, (h.a1 - h.a0) * rr / 2, 0.05, 0.03, MT.ANOD); bb.tag(0, 3, null); B.add(bb, crsFrame(rr, (h.a0 + h.a1) / 2, y1)); });
  }

  // ---- a stair in a bay (T06-16, T06-18): two flights of Carrara treads with a half landing, a wall between them ----
  function bayStair(W, rm) {
    var C = CRS, Bs = C.bay, half = Bs.n / 2, h = (C.yU - C.yL) / Bs.n, run = 0.28, L0 = Bs.landing, L1 = L0 + (half - 1) * run, L2 = L1 + Bs.landing, yM = C.yU - half * h - C.yL, yT = C.yU - C.yL;
    var am = (rm.a[0] + rm.a[1]) / 2 * D2R, b = new Builder(), xg = 0.1, X1 = xg + Bs.w, X0 = -X1;      // frame: x along +a, z out from rc, y up from the lower floor
    function tread(x0, x1, z0, z1, y, nose) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0, x1, i); q.p[1] = y; q.p[2] = lerp(z0, z1, j); q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = nose ? Math.abs(q.p[2] - nose) : 1; q.m = nose ? MT.STEP : MT.TERRAZZO; }); }
    function riser(x0, x1, z, y0, y1, nz) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0, x1, i); q.p[1] = j ? y1 : y0; q.p[2] = z; q.nn = [0, 0, nz]; q.f[0] = q.p[0]; q.f[1] = 1; q.m = MT.MARBLE; }); }
    function under(x0, x1, z0, y0, z1, y1) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0, x1, i); q.p[1] = j ? y1 : y0; q.p[2] = j ? z1 : z0; q.nn = [0, -1, 0]; q.m = MT.PLASTER; }); }
    tread(X0, X1, 0.15, L0, yT, 0); tread(X0, X1, L1, L2, yM, 0);                                     // the landings: upstairs at the door, the half landing
    under(X0, X1, 0.15, yT - 0.3, L0, yT - 0.3); under(X0, X1, L1, yM - 0.3, L2, yM - 0.3);
    for (var k = 0; k < half - 1; k++) {                                                                  // down outward on the +a side, then back on the -a side
      var z0 = L0 + k * run, y1 = yT - (k + 1) * h; tread(xg, X1, z0, z0 + run, y1, z0 + run); riser(xg, X1, z0, y1, y1 + h, 1);
      var zb = L1 - k * run, y2 = yM - (k + 1) * h; tread(X0, -xg, zb - run, zb, y2, zb - run); riser(X0, -xg, zb, y2, y2 + h, -1);
    }
    riser(xg, X1, L1, yM, yM + h, 1); riser(X0, -xg, L0, 0, h, -1);
    under(xg, X1, L0, yT - 0.45, L1, yM - 0.25); under(X0, -xg, L1, yM - 0.45, L0, 0.0);
    // the wall between the flights, the end wall past the half landing, both from the floor to the ceiling upstairs
    [[-xg, -1], [xg, 1]].forEach(function (e) { b.surf(1, 1, function (i, j, q) { q.p[0] = e[0]; q.p[1] = j ? yT + C.hR : 0; q.p[2] = i ? L1 : L0; q.nn = [e[1], 0, 0]; q.f[0] = q.p[2]; q.f[1] = q.p[1]; q.m = MT.PLASTER; }); });
    b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(X0 - 0.2, X1 + 0.2, i); q.p[1] = j ? yT + C.hR : 0; q.p[2] = L2; q.nn = [0, 0, -1]; q.f[0] = q.p[0]; q.f[1] = q.p[1]; q.m = MT.PLASTER; });
    b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(X0 - 0.2, X1 + 0.2, i); q.p[1] = yT + C.hR; q.p[2] = lerp(0.1, L2, j); q.nn = [0, -1, 0]; q.m = MT.PLASTER; });
    tread(X0 - 0.2, X1 + 0.2, 0.1, L2, 0, 0);                                                              // the floor at the bottom
    b.tag(0, null, null);
    var M = crsFrame(C.rc, am, C.yL); W.add(b, M);
    // handrails: on both sides of each flight, 0.9 m over the nosings
    [[xg + 0.06, L0, yT, L1, yM], [X1 - 0.06, L0, yT, L1, yM], [-xg - 0.06, L1, yM, L0, 0], [X0 + 0.06, L1, yM, L0, 0]].forEach(function (f) {
      var p0 = new THREE.Vector3(f[0], f[2] + 0.9, f[1]).applyMatrix4(M), p1 = new THREE.Vector3(f[0], f[4] + 0.9 + h, f[3]).applyMatrix4(M);
      tubeAlong(W, [p0, p1], 0.022, 8, MT.STEEL);
    });
    [[0.6, yT], [L1 + 0.6, yM], [0.6, 0]].forEach(function (l) { var p = new THREE.Vector3(0, l[1] + 2.7, l[0]).applyMatrix4(M); wLight(p.x, p.y, p.z, LAMPC, 0.9, 5); });
  }

  // ---- a grand stair (the hall's, the Gate Hall's): two flights of Carrara treads with brass nosings and a landing, on
  // steel stringers, glass sides; in the hall the landing's edge over the void gets a balustrade too ----
  function crescentStair(W, S, hallEdge) {
    var C = CRS, yU = C.yU, sw = S.w / 2, b = new Builder(), h = S.h, zl0 = (S.half - 1) * S.run1, zl1 = S.l1 - S.r0, zEnd = S.r1 - S.r0;
    function tread(z0, z1, y) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = y; q.p[2] = lerp(z0, z1, j); q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = z1 - q.p[2]; q.m = MT.STEP; }); }
    function riser(z, y0, y1) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = j ? y1 : y0; q.p[2] = z; q.nn = [0, 0, 1]; q.f[0] = q.p[0]; q.f[1] = 1; q.m = MT.STEP; }); }
    function soffit(z0, y0, z1, y1) { b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = j ? y1 : y0; q.p[2] = j ? z1 : z0; q.nn = [0, -1, 0]; q.m = MT.PLASTER; }); }
    var flights = [{ z0: 0, run: S.run1, y0: 0, n: S.half - 1 }, { z0: zl1, run: S.run2, y0: S.yM - yU, n: S.half - 1 }];
    flights.forEach(function (F) {
      riser(F.z0, F.y0 - h, F.y0);
      for (var k = 0; k < F.n; k++) { var z0 = F.z0 + k * F.run, z1 = z0 + F.run, y = F.y0 - (k + 1) * h; tread(z0, z1, y); riser(z1, y - h, y); }
      var zE = F.z0 + F.n * F.run, yE = F.y0 - (F.n + 1) * h;
      soffit(F.z0 + 0.2, F.y0 - 0.45, zE, yE - 0.2);
      [-1, 1].forEach(function (sd) { b.surf(1, 1, function (i, j, q) { var z = i ? zE : F.z0, yt = (i ? yE + h : F.y0) + 0.06; q.p[0] = sd * (sw + 0.012); q.p[1] = j ? yt : yt - 0.5; q.p[2] = z; q.nn = [sd, 0, 0]; q.f2[0] = 3; q.m = MT.STEEL; }); });
    });
    // the landing between the flights, on two steel posts
    tread(zl0, zl1, S.yM - yU); b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = S.yM - yU - 0.3; q.p[2] = lerp(zl0, zl1, j); q.nn = [0, -1, 0]; q.m = MT.PLASTER; });
    b.surf(1, 1, function (i, j, q) { q.p[0] = lerp(-sw, sw, i); q.p[1] = S.yM - yU - (j ? 0 : 0.3); q.p[2] = zl0; q.nn = [0, 0, -1]; q.m = MT.PLASTER; });
    [-1, 1].forEach(function (sd) {
      b.surf(1, 1, function (i, j, q) { q.p[0] = sd * (sw + 0.012); q.p[1] = S.yM - yU - (j ? -0.06 : 0.3); q.p[2] = lerp(zl0, zl1, i); q.nn = [sd, 0, 0]; q.f2[0] = 3; q.m = MT.STEEL; });
      var pz = (zl0 + zl1) / 2; b.box(sd * (sw - 0.3) - 0.06, -(yU - C.yL), pz - 0.06, sd * (sw - 0.3) + 0.06, S.yM - yU - 0.3, pz + 0.06, MT.STEEL);
    });
    // glass balustrades with a steel handrail on both sides, from the top to the floor
    var path = [[0, 0], [zl0, S.yM - yU], [zl1, S.yM - yU], [zEnd - S.run2, C.yL - yU + h]], Mg = crsFrame(S.r0, S.a, yU);
    [-1, 1].forEach(function (sd) {
      var rail = path.map(function (p) { return new THREE.Vector3(sd * (sw + 0.04), p[1] + 0.95, p[0]); });
      var tb = new Builder(); tubeAlong(tb, rail, 0.025, 8, MT.STEEL); b.add(tb, new THREE.Matrix4());
      for (var k = 0; k < path.length - 1; k++) {
        var pa = path[k], pb = path[k + 1], gx = sd * (sw + 0.03);
        var gb = new Builder(); gb.surf(1, 1, function (i, j, q) { var p = i ? pb : pa; q.p[0] = gx; q.p[1] = p[1] + (j ? 0.9 : 0.1); q.p[2] = p[0]; q.nn = [sd, 0, 0]; q.f2[0] = j ? 0.9 : 0.1; q.f2[1] = 1; q.m = 0; });
        CRS_GLASS.add(gb, Mg);
      }
    });
    b.tag(0, null, null);
    W.add(b, Mg);
    if (!hallEdge) return;
    // the landing's edge over the hall's void: a glass balustrade with a steel rail, open where the stair starts
    var gapA = (S.w / 2 + 0.1) / S.r0;
    [[-C.hallA + 0.004, S.a - gapA], [S.a + gapA, C.hallA - 0.004]].forEach(function (sp) {
      var lr = []; for (var k4 = 0; k4 <= 10; k4++) { var pp = crsPt(S.r0, lerp(sp[0], sp[1], k4 / 10)); lr.push(new THREE.Vector3(pp.x, yU + 1.0, pp.z)); }
      tubeAlong(W, lr, 0.025, 8, MT.STEEL);
      [sp[0], (sp[0] + sp[1]) / 2, sp[1]].forEach(function (pa) { var pq = crsPt(S.r0, pa); tubeAlong(W, [new THREE.Vector3(pq.x, yU, pq.z), new THREE.Vector3(pq.x, yU + 1.0, pq.z)], 0.02, 6, MT.STEEL); });
      var ng = 6; CRS_GLASS.surf(ng, 1, function (i, j, q) { var a = lerp(sp[0], sp[1], i / ng), p = crsPt(S.r0 + 0.02, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = yU + (j ? 0.95 : 0.05); q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f2[0] = j ? 1 : 0.05; q.f2[1] = 1; q.m = 0; });
    });
  }

  // ---- a lift: a glass shaft on steel posts through both floors, the car waiting below ----
  function crescentLift(W, L) {
    var C = CRS, w = L.w / 2, H = C.yU - C.yL + 3.3, b = new Builder();
    [[-w, -w], [w, -w], [-w, w], [w, w]].forEach(function (c) { b.box(c[0] - 0.05, 0, c[1] - 0.05, c[0] + 0.05, H, c[1] + 0.05, MT.ANOD); });
    [0, C.yU - C.yL - 0.25, H - 0.12].forEach(function (y) { b.box(-w, y, -w - 0.04, w, y + 0.12, -w + 0.04, MT.ANOD); b.box(-w, y, w - 0.04, w, y + 0.12, w + 0.04, MT.ANOD); b.box(-w - 0.04, y, -w, -w + 0.04, y + 0.12, w, MT.ANOD); b.box(w - 0.04, y, -w, w + 0.04, y + 0.12, w, MT.ANOD); });
    b.box(-w + 0.08, 0.0, -w + 0.08, w - 0.08, 0.12, w - 0.08, MT.STEEL);                         // the car: floor, back, roof, a rail
    b.box(-w + 0.08, 0.12, w - 0.14, w - 0.08, 2.4, w - 0.08, MT.WOOD); b.box(-w + 0.08, 2.4, -w + 0.08, w - 0.08, 2.5, w - 0.08, MT.STEEL);
    b.box(-w + 0.3, 0.9, w - 0.2, w - 0.3, 0.94, w - 0.15, MT.STEEL);
    b.tag(0, 3, null); var M = crsFrame(L.r, L.a, C.yL); W.add(b, M);
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
    var C = CRS, G = C.gal, yL = C.yL, r1 = C.r1, gr1 = G.r1, A0 = G.a0, A1 = G.a1, yE = crsRoofY(C.roofOut) - C.roofT - 0.05, rT = r1 + 0.4;
    function gTop(a) { var p = crsPt(gr1 + 0.4, a); return Math.max(groundAt(p.x, p.z, yL) + G.wall, yL + 2.8); }     // the stone wall's top, a parapet above the ground outside
    var n = Math.ceil((A1 - A0) * gr1 / 0.5), tops = []; for (var i0 = 0; i0 <= n; i0++) tops.push(gTop(lerp(A0, A1, i0 / n)));
    function topAt(a) { var t = clamp((a - A0) / (A1 - A0), 0, 1) * n, i = Math.min(n - 1, Math.floor(t)); return lerp(tops[i], tops[i + 1], t - i); }
    B.zone = ZONE.OUT;
    flat(B, r1 + 0.06, gr1 - 0.3, A0 + 0.004, A1 - 0.004, yL, MT.PAVE, 0, true);
    // the stone wall: its face to the gallery, the coping, its face to the slope outside down into the ground
    B.surf(n, 1, function (i, j, q) { var a = lerp(A0, A1, i / n), p = crsPt(gr1 - 0.3, a), d = crsPt(1, a), y = j ? tops[i] : yL - 0.05; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.c.x - d.x, 0, PAL.c.z - d.z]; q.f[0] = a * gr1; q.f[1] = y; q.f2[0] = y - yL; q.m = MT.CONCRETE; });
    B.surf(n, 1, function (i, j, q) { var a = lerp(A0, A1, i / n), p = crsPt(j ? gr1 + 0.12 : gr1 - 0.34, a); q.p[0] = p.x; q.p[1] = tops[i] + 0.05; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = a * gr1; q.f[1] = j * 0.45; q.m = MT.CONCRETE; });
    B.surf(n, 1, function (i, j, q) { var a = lerp(A0, A1, i / n), p = crsPt(gr1 + 0.12, a), d = crsPt(1, a), g = groundAt(p.x, p.z, yL), y = j ? tops[i] + 0.05 : Math.min(g, tops[i]) - 0.6; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [d.x - PAL.c.x, 0, d.z - PAL.c.z]; q.f[0] = a * gr1; q.f[1] = y; q.f2[0] = y - g; q.m = MT.CONCRETE; });
    // the glass roof from under the Ring's eave down to the wall, on bronze rafters every 1.5 m, a gutter on the wall
    CRS_GLASS.surf(n, 1, function (i, j, q) { var a = lerp(A0, A1, i / n), r = j ? gr1 - 0.15 : rT, p = crsPt(r, a), d = crsPt(1, a), y = j ? tops[i] + 0.16 : yE, dr = gr1 - 0.15 - rT, dy = tops[i] + 0.16 - yE, L = Math.hypot(dr, dy);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * -dy / L, dr / L, (d.z - PAL.c.z) * -dy / L]; q.f[0] = a * r; q.f[1] = y; q.f2[0] = 3; q.f2[1] = 4; q.m = 0; });
    var nrf = Math.round((A1 - A0) * (rT + gr1) / 2 / 1.5);
    for (var k = 0; k <= nrf; k++) { var a = lerp(A0 + 0.002, A1 - 0.002, k / nrf), pa = crsPt(rT, a), pb = crsPt(gr1 - 0.15, a), yb = topAt(a) + 0.1; tubeAlong(B, [new THREE.Vector3(pa.x, yE - 0.07, pa.z), new THREE.Vector3(pb.x, yb, pb.z)], 0.045, 6, MT.RIB); }
    arcWall(B, rT - 0.05, A0, A1, yE - 0.2, yE + 0.02, MT.RIB, 0, -1, 3);                                                // the beam under the eave
    B.surf(n, 1, function (i, j, q) { var a = lerp(A0, A1, i / n), p = crsPt(gr1 - 0.3 + j * 0.2, a); q.p[0] = p.x; q.p[1] = tops[i] + 0.06 + (j ? 0.12 : 0); q.p[2] = p.z; q.nn = [0, 1, 0]; q.m = MT.ANOD; });
    // the end walls: stone, up to the roof's line, both faces
    [[A0, 1], [A1, -1]].forEach(function (e) {
      [[e[0] + e[1] * 0.004, e[1]], [e[0] - e[1] * 0.004, -e[1]]].forEach(function (f) {
        var m = 10, t = crsPt(1, f[0] + Math.PI / 2);
        B.surf(m, 1, function (i, j, q) { var r = lerp(r1 + 0.06, gr1 + 0.12, i / m), p = crsPt(r, f[0]), g = groundAt(p.x, p.z, yL), top = lerp(yE, topAt(e[0]) + 0.16, clamp((r - rT) / (gr1 - 0.15 - rT), 0, 1)), y = j ? top : (f[1] === e[1] ? yL - 0.05 : Math.min(g, yL) - 0.4);
          q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(t.x - PAL.c.x) * f[1], 0, (t.z - PAL.c.z) * f[1]]; q.f[0] = r; q.f[1] = y; q.f2[0] = y - yL; q.m = MT.CONCRETE; });
      });
    });
    // light: uplights washing the stone wall
    var nu = Math.round((A1 - A0) * gr1 / 5.2);
    for (var k2 = 0; k2 <= nu; k2++) { var a2 = lerp(A0 + 1.5 / gr1, A1 - 1.5 / gr1, k2 / nu), p2 = crsPt(gr1 - 0.55, a2), d2 = crsPt(1, a2);
      B.geo(addF2(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 12), 1.5, 0), T(p2.x, yL + 0.03, p2.z), MT.LIGHT, 1);
      extLight(p2.x, yL + 0.15, p2.z, WARMC, 1.5, 7, [(d2.x - PAL.c.x) * 0.3, 0.95, (d2.z - PAL.c.z) * 0.3], 2); }
    crescentGalleryFurnish(B);
  }

  // ---- where you can stand in the Ring and its gallery: the two floors, the stairs; NaN at walls ----
  function crescentSupport(x, z, yf) {
    if (!CRS) return undefined;
    var C = CRS, G = C.gal, o = crsLoc(x, z), r = o.r, deg = ringDeg(o.a), a = deg * D2R, yU = C.yU, yL = C.yL, rc = C.rc;
    var gal = deg > G.d0 && deg < G.d1;
    if (r < C.r0 - 0.35 || r > (gal ? G.r1 + 0.45 : C.r1 + 0.35)) return undefined;
    var upF = hasUpper(deg), lower = !upF || yf < (yU + yL) / 2, y = lower ? yL : yU, fl = lower ? "lower" : "upper";
    function nearDoor(rr, ang) { return C.doors.some(function (d) { return Math.abs(d.r - rr) < 0.5 && Math.abs(d.a - ang) * rr < 1.1 && Math.abs(d.y - y) < 0.5; }); }
    function obst(f) { if (C.obst) for (var m = 0; m < C.obst.length; m++) { var ob = C.obst[m]; if (ob[4] === f && r > ob[0] && r < ob[1] && a > ob[2] && a < ob[3]) return true; } return false; }
    if (gal) {
      if (r > G.r1 - 0.55) return NaN;                                    // the gallery's stone wall
      if (Math.abs(deg - G.d0) * D2R * r < 0.25 || Math.abs(deg - G.d1) * D2R * r < 0.25) { if (r > C.r1 - 0.25) return NaN; }   // its end walls
      if (r > C.r1 + 0.25) return lower && !obst("gallery") ? yL : NaN;    // the gallery
    } else if (r > C.r1 - 0.25) return (inGate(deg) && !lower && nearDoor(C.r1, a)) ? yU : NaN;   // the outer wall; the Gate Hall's door to the entrance dome
    if (r > C.r1 - 0.25) return lower && nearDoor(C.r1, a) ? yL : NaN;    // the garden front and its doors
    if (r < C.r0 + 0.25) return nearDoor(C.r0, a) && (!lower || inGrove(deg)) ? y : NaN;   // the garden side and its doors (below, into the grove); the retaining wall
    if (upF && !lower && (Math.abs(deg - C.upper[0]) * D2R * r < 0.2 || Math.abs(deg - C.upper[1]) * D2R * r < 0.2)) return NaN;   // the upper floor's ends
    // a stair's bay
    var rm = crsRoomAt(a, fl);
    if (rm && isBay(rm) && r > rc - 0.2) {
      var am = (rm.a[0] + rm.a[1]) / 2, xx = (deg - am) * D2R * (rc + 3), e = r - rc;
      if (e < 0.2) return Math.abs(xx) < 0.45 ? y : NaN;                   // the partition, a door on each floor
      if (Math.abs(deg - rm.a[0]) * D2R * r < 0.2 || Math.abs(deg - rm.a[1]) * D2R * r < 0.2) return NaN;
      var hy = bayY(e, xx, yf); return (hy !== hy || Math.abs(hy - yf) > 0.6) ? NaN : hy;
    }
    // the lifts' shafts
    if ([C.lift, C.glift].some(function (L) { return Math.abs(r - L.r) < L.w / 2 + 0.25 && Math.abs(a - L.a) * r < L.w / 2 + 0.25; })) return NaN;
    // the hall: the landing upstairs, the stair, the void
    if (Math.abs(deg) < C.hallA * R2D - 0.2) {
      var S = C.st, sa = (a - S.a) * r;
      if (Math.abs(sa) < S.w / 2 - 0.05 && r > S.r0 - 0.05 && r < S.r1 + 0.1) { var hy2 = stairY(r, S); if (Math.abs(hy2 - yf) < 0.6) return hy2; }
      if (Math.abs(sa) < S.w / 2 + 0.15 && r > S.r0 && r < S.r1) return NaN;   // the stair's sides, and the space under it
      if (!lower && r > S.r0 + 0.05) return NaN;                           // the void
      if (!lower && Math.abs(r - S.r0) < 0.2 && Math.abs(sa) > S.w / 2) return NaN;   // the balustrade
      return obst(fl) ? NaN : y;
    }
    if (Math.abs(Math.abs(deg) - C.hallA * R2D) * D2R * r < 0.2 && r > rc) return NaN;   // the hall's side walls
    // the Gate Hall and the hall under it: the floor round the stair's opening, the stair
    if (inGate(deg)) {
      if ((Math.abs(deg - 164) * D2R * r < 0.2 || Math.abs(deg - 191) * D2R * r < 0.2) && r > rc) return NaN;
      var Sg = C.gst, sg2 = (a - Sg.a) * r, O = gateOpening();
      if (Math.abs(sg2) < Sg.w / 2 - 0.05 && r > Sg.r0 - 0.45 && r < Sg.r1 + 0.1) { var hy3 = stairY(r, Sg); return Math.abs(hy3 - yf) < 0.6 ? hy3 : NaN; }
      if (a > O.a0 - 0.15 / r && a < O.a1 + 0.15 / r && r > O.r0 - 0.15 && r < O.r1 + 0.15) return NaN;   // the opening's balustrade, the space under the stair
      return obst(fl) ? NaN : y;
    }
    if (Math.abs(r - rc) < 0.2) {                                           // the corridor partition, open at the doorways
      var rmd = crsRoomAt(a, fl); return rmd && rmd.doors && rmd.doors.some(function (d) { return Math.abs(a - d) * rc < 0.4; }) ? y : NaN;
    }
    if (obst(fl)) return NaN;                                               // furniture
    if (r > rc) {                                                            // the walls between rooms
      var R = C.rooms; for (var j = 0; j < R.length; j++) { var q = R[j]; if (q.band || rmFloors(q).indexOf(fl) < 0) continue; if (Math.abs(a - rmA0(q)) * r < 0.18 || Math.abs(a - rmA1(q)) * r < 0.18) return NaN; }
    }
    return y;
  }
  function crescentInside(x, z) {
    if (!CRS) return 0; var o = crsLoc(x, z), d = ringDeg(o.a);
    return (o.r > CRS.r0 && o.r < CRS.r1) || (o.r >= CRS.r1 && o.r < CRS.gal.r1 && d > CRS.gal.d0 && d < CRS.gal.d1) ? 1 : 0;
  }
