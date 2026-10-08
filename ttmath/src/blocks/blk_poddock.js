  /* ===================== The pod docks: the Ring's (T04-03) with its glass bridge (T17-02), and the pod gates round the entrance dome (T04-04 to T04-07) ===================== */
  // Jim, 5 Oct 2026: "the parking is too close to the building. need special parking so that when parked, there is
  // connection so people can go directly into the building". A round deck off the Ring's right side, 1.35 m below the upper
  // floor, on slender columns, a ring of lights round its edge. The glass bridge runs from the pod lounge (T06-21) through
  // a sliding door in the outer glass, over the garden gallery's roof, to the deck's edge. A pod settles side-on onto the
  // docking spot, its canopy toward the bridge and its sill level with the bridge's floor, and the collar runs out over its
  // halo and seals: you walk from the pod through the collar and the bridge into the Ring, never outside (P2.pod_dock).
  // Jim, 8 Oct 2026: "it is OK to keep one over there. but we need several pod lounge around the building, esp. several
  // parking lots and connections at the entrance" (P2.pod_gates): four gates round the entrance dome. A doorway in the
  // dome's drum, framed in bronze like the airlock's, opens onto a short glazed landing over a round well sunk into the
  // ground beside the dome; a pod settles side-on into the well, its canopy's sill level with the dome's floor, and the
  // collar runs out to it from the landing. Pods wait at three gates; the fourth is kept free for one coming in.
  // Every dock has its frame: u along its axis from its origin (the palace's centre for the Ring's, the dome's centre for a
  // gate), v across it; the bridge or landing from u0 to u1, the collar from u1 toward the pod at its spot sp; the pod
  // floats over the deck or the well's floor yD, the bridge's floor is yB.
  var PDK = null, PDKS = [];
  function pdkInit() {
    if (PDK || !CRS) return PDK;
    var D = P2.pod_dock, a = D.a * D2R, o = crsPt(1, a), t = crsPt(1, a + Math.PI / 2);
    var O = { x: o.x - PAL.c.x, z: o.z - PAL.c.z }, T = { x: t.x - PAL.c.x, z: t.z - PAL.c.z };
    PDK = { kind: "deck", a: a, org: { x: PAL.c.x, z: PAL.c.z }, O: O, T: T, c: crsPt(D.r, a), sp: crsPt(D.spot_r, a), R: D.deck_r, yD: CRS.yU + D.deck_y, yB: CRS.yU, hw: D.w / 2, h: D.h,
            u0: CRS.r1, uf: CRS.r1 + 0.06, ug: CRS.r1 + 0.06, u1: D.bridge[1] + 0.6, cmax: D.collar, ext: 1, want: 1, hd: Math.atan2(O.z, -O.x), pod: null, cols: [], collar: null, shutter: null };
    PDK.safe = PDK.yB + PDK.h + 1.2; PDKS.push(PDK);
    var G = P2.pod_gates, E = entInit(); if (!G || !E) return PDK;
    var oc = palXZ(E.c.lat, E.c.rad);
    G.phi.forEach(function (phd, i) {
      var ph = phd * D2R, O2 = { x: Math.sin(ph) * PAL.Rt.x + Math.cos(ph) * PAL.F.x, z: Math.sin(ph) * PAL.Rt.z + Math.cos(ph) * PAL.F.z },
          T2 = { x: Math.cos(ph) * PAL.Rt.x - Math.sin(ph) * PAL.F.x, z: Math.cos(ph) * PAL.Rt.z - Math.sin(ph) * PAL.F.z };
      var u1 = E.a + 0.18 + G.landing, yB = entFloor(entPt(E.a, ph).rad);
      var P = { kind: "well", gate: i, phi: ph, org: { x: oc.x, z: oc.z }, O: O2, T: T2, R: G.well_r, yD: yB - G.sill, yB: yB, hw: G.door_w / 2, h: G.door_h,
                u0: E.a - 0.4, uf: E.a - 0.06, ug: E.a + 0.1, u1: u1, cmax: G.collar, ext: 0, want: 0, hd: Math.atan2(O2.z, -O2.x), pod: null, cols: [], collar: null, shutter: null,
                phiD: Math.asin((G.door_w / 2 + 0.12) / E.a) };
      P.c = pdkAt(P, G.q, 0); P.sp = pdkAt(P, u1 + G.spot, 0);
      P.safe = Math.max(P.yB + P.h + 1.2, E.yb + E.h + 1.5);                // over the dome's cap, then straight down into the well
      PDKS.push(P);
    });
    return PDK;
  }
  function pdkOf(p) { for (var i = 0; i < PDKS.length; i++) if (PDKS[i].pod === p) return PDKS[i]; return null; }   // the dock holding pod p
  function pdkUV(P, x, z) { var dx = x - P.org.x, dz = z - P.org.z; return { u: dx * P.O.x + dz * P.O.z, v: dx * P.T.x + dz * P.T.z }; }
  function pdkAt(P, u, v) { return { x: P.org.x + P.O.x * u + P.T.x * v, z: P.org.z + P.O.z * u + P.T.z * v }; }
  function pdkV3(P, u, v, y) { var p = pdkAt(P, u, v); return new THREE.Vector3(p.x, y, p.z); }
  // a flat quad in a dock's (u, v) frame at height y, or upright along u at side v, or across it at u
  function pdkFlat(B, P, u0, u1, v0, v1, y, mat, f2, up, nu) {
    var n = nu || Math.max(1, Math.ceil((u1 - u0) / 0.6)), m = Math.max(1, Math.ceil((v1 - v0) / 0.6));
    B.surf(n, m, function (i, j, q) { var p = pdkAt(P, lerp(u0, u1, i / n), lerp(v0, v1, j / m)); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, up ? 1 : -1, 0]; q.f[0] = p.x; q.f[1] = p.z; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  function pdkSide(B, P, u0, u1, v, y0, y1, s, mat, f2) {
    var n = Math.max(1, Math.ceil((u1 - u0) / 0.6));
    B.surf(n, 1, function (i, j, q) { var p = pdkAt(P, lerp(u0, u1, i / n), v); q.p[0] = p.x; q.p[1] = j ? y1 : y0; q.p[2] = p.z; q.nn = [P.T.x * s, 0, P.T.z * s]; q.f[0] = lerp(u0, u1, i / n); q.f[1] = q.p[1]; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  function pdkEnd(B, P, u, v0, v1, y0, y1, s, mat, f2) {
    B.surf(1, 1, function (i, j, q) { var p = pdkAt(P, u, lerp(v0, v1, i)); q.p[0] = p.x; q.p[1] = j ? y1 : y0; q.p[2] = p.z; q.nn = [P.O.x * s, 0, P.O.z * s]; q.f[0] = lerp(v0, v1, i); q.f[1] = q.p[1]; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  // every dock: the Ring's deck on its legs, the gates' wells; the bridges and landings with their glass and frames
  function podDockBuild(B) {
    if (!pdkInit()) return;
    PDKS.forEach(function (P) { if (P.kind === "deck") pdkDeck(B, P); else pdkWell(B, P); pdkBridge(B, P); });
  }
  // the docking spot: the halo's outline painted on the slabs, and dashes from the bridge's end to the spot's middle
  function pdkSpotMarks(B, P, y) {
    var HL = P2.pod.halo, s0 = pdkUV(P, P.sp.x, P.sp.z).u;
    B.surf(72, 1, function (i, j, q) { var t = i / 72 * 2 * Math.PI, k3 = j ? 1.1 : 1.06, p = pdkAt(P, s0 + HL.rz * k3 * Math.sin(t), HL.rx * k3 * Math.cos(t)); q.p[0] = p.x; q.p[1] = y + 0.004; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f2[0] = 4; q.m = MT.PLASTIC; });
    for (var d = 0; d < 6; d++) { var ua = P.u1 + 0.2 + d * 0.32; if (ua + 0.18 > s0) break; pdkFlat(B, P, ua, ua + 0.18, -0.05, 0.05, y + 0.004, MT.PLASTIC, [4, 0], true, 1); }
  }
  // the Ring's deck: dark basalt slabs, a dark metal edge with a lip, its underside, a ring of lights, slender columns
  function pdkDeck(B, P) {
    var c = P.c, R = P.R, yD = P.yD, NA = 64;
    B.surf(NA, 4, function (i, j, q) { var t = i / NA * 2 * Math.PI, rr = R * j / 4; q.p[0] = c.x + rr * Math.cos(t); q.p[1] = yD; q.p[2] = c.z + rr * Math.sin(t); q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = q.p[2]; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
    B.orient(B.count() - (NA + 1) * 5, function () { return [0, 1, 0]; });
    latheOn(B, c.x, yD - 0.5, c.z, [[R - 0.25, 0.0], [R, 0.0], [R, 0.62], [R - 0.12, 0.62], [R - 0.12, 0.5]], NA, MT.ANOD, 0);
    B.surf(NA, 2, function (i, j, q) { var t = i / NA * 2 * Math.PI, rr = (R - 0.25) * j / 2; q.p[0] = c.x + rr * Math.cos(t); q.p[1] = yD - 0.5; q.p[2] = c.z + rr * Math.sin(t); q.nn = [0, -1, 0]; q.f[0] = q.p[0]; q.f[1] = q.p[2]; q.f2[0] = 4; q.m = MT.SHELL; });
    for (var k = 0; k < 40; k++) { var t = k / 40 * 2 * Math.PI, lx = c.x + (R - 0.55) * Math.cos(t), lz = c.z + (R - 0.55) * Math.sin(t); B.geo(addF2(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), 2.2, 0), T(lx, yD + 0.01, lz), MT.LIGHT, 1); }
    for (var k2 = 0; k2 < 6; k2++) { var t2 = (k2 + 0.5) / 6 * 2 * Math.PI; extLight(c.x + (R - 0.55) * Math.cos(t2), yD + 0.25, c.z + (R - 0.55) * Math.sin(t2), WARMC, 0.35, 3.5); }
    pdkSpotMarks(B, P, yD);
    var cols = [[0, 0]]; for (var k4 = 0; k4 < 6; k4++) cols.push([4.3 * Math.cos(k4 / 6 * 2 * Math.PI + 0.3), 4.3 * Math.sin(k4 / 6 * 2 * Math.PI + 0.3)]);
    cols.forEach(function (cc) {
      var x = c.x + cc[0], z = c.z + cc[1], g = groundAt(x, z, yD - 4);
      tubeAlong(B, [new THREE.Vector3(x, g - 0.3, z), new THREE.Vector3(x, yD - 0.5, z)], 0.13, 12, MT.SHELL);
      latheOn(B, x, g - 0.4, z, [[0.45, 0.0], [0.45, 0.45], [0.0, 0.45]], 16, MT.CONCRETE, 0.5);
      P.cols.push({ x: x, z: z, g: g });
    });
  }
  // a gate's well: basalt slabs out to a stone wall under a granite coping flush with the ground, amber markers set in the
  // coping, a ring of lights in the floor; where the well meets the dome its wall is the dome's curb, carried down, and
  // under the landing it stops at the landing's slab. The ground is cut away over it (p2Sector).
  function pdkWell(B, P) {
    var E = ENT, c = P.c, R = P.R, yD = P.yD, NA = 96, dc = P.org, aD = E.a + 0.18, oc = palLoc(c.x, c.z, {});
    p2Sector(oc.lat, oc.rad, 0, R + 0.35, -4, 4);
    function qd(x, z) { return Math.hypot(x - dc.x, z - dc.z); }
    function outD(x, z) { var dx = x - dc.x, dz = z - dc.z, q = Math.hypot(dx, dz) || 1; return q < aD + 0.01 ? { x: dc.x + dx / q * (aD + 0.01), z: dc.z + dz / q * (aD + 0.01) } : { x: x, z: z }; }
    var n0 = B.count();
    B.surf(NA, 8, function (i, j, q) { var t = i / NA * 2 * Math.PI, rr = R * j / 8, p = outD(c.x + rr * Math.cos(t), c.z + rr * Math.sin(t)); q.p[0] = p.x; q.p[1] = yD; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = p.x; q.f[1] = p.z; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
    B.orient(n0, function () { return [0, 1, 0]; });
    // the wall and its coping, all round but where the dome stands: one run from beside the dome round the far side
    var tD = Math.atan2(dc.z - c.z, dc.x - c.x), run = [], tops = [];
    for (var k = 0; k <= NA; k++) { var t = tD + k / NA * 2 * Math.PI, x = c.x + R * Math.cos(t), z = c.z + R * Math.sin(t); if (qd(x, z) > aD + 0.02) run.push(t); }
    run.forEach(function (t) { var x = c.x + (R + 0.3) * Math.cos(t), z = c.z + (R + 0.3) * Math.sin(t); tops.push(Math.max(yD + 0.6, cgH(x, z) + 0.03)); });
    var n = run.length - 1;
    if (n > 0) {
      B.surf(n, 1, function (i, j, q) { var t = run[i], x = c.x + R * Math.cos(t), z = c.z + R * Math.sin(t); q.p[0] = x; q.p[1] = j ? tops[i] - 0.02 : yD - 0.02; q.p[2] = z; q.nn = [-Math.cos(t), 0, -Math.sin(t)]; q.f[0] = t * R; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - yD; q.m = MT.CONCRETE; });
      B.surf(n, 1, function (i, j, q) { var t = run[i], rr = j ? R + 0.45 : R - 0.04, x = c.x + rr * Math.cos(t), z = c.z + rr * Math.sin(t); q.p[0] = x; q.p[1] = tops[i]; q.p[2] = z; q.nn = [0, 1, 0]; q.f[0] = t * R; q.f[1] = j * 0.45; q.f2[0] = 1; q.m = MT.CONCRETE; });
      B.surf(n, 1, function (i, j, q) { var t = run[i], x = c.x + (R + 0.45) * Math.cos(t), z = c.z + (R + 0.45) * Math.sin(t); q.p[0] = x; q.p[1] = j ? tops[i] : tops[i] - 0.35; q.p[2] = z; q.nn = [Math.cos(t), 0, Math.sin(t)]; q.f[0] = t * R; q.f[1] = q.p[1]; q.f2[0] = 0.3; q.m = MT.CONCRETE; });
      B.surf(n, 1, function (i, j, q) { var t = run[i], x = c.x + (R - 0.04) * Math.cos(t), z = c.z + (R - 0.04) * Math.sin(t); q.p[0] = x; q.p[1] = j ? tops[i] : tops[i] - 0.06; q.p[2] = z; q.nn = [-Math.cos(t), 0, -Math.sin(t)]; q.f[0] = t * R; q.f[1] = q.p[1]; q.f2[0] = 1; q.m = MT.CONCRETE; });
      for (var m = 1; m < n; m += 5) { var tm = run[m], mx = c.x + (R + 0.2) * Math.cos(tm), mz = c.z + (R + 0.2) * Math.sin(tm);     // the amber markers, every 2.5 m or so
        B.geo(addF2(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), 1.6, 0), T(mx, tops[m] + 0.005, mz), MT.LIGHT, 1); }
    }
    // the dome's side: its curb carried down into the well, to the landing's slab under the doorway
    var dd = pdkUV(P, c.x, c.z).u, del = Math.acos(clamp((dd * dd + aD * aD - R * R) / (2 * dd * aD), -1, 1)), NL = 24;
    B.surf(NL, 1, function (i, j, q) {
      var ph = P.phi - del + 2 * del * i / NL, o = entPt(aD, ph), p = palXZ(o.lat, o.rad), door = Math.abs(ph - P.phi) < P.phiD + 0.01;
      var top = door ? P.yB - 0.32 : Math.min(cgH(p.x, p.z), entFloor(o.rad)) - 0.4;
      q.p[0] = p.x; q.p[1] = j ? top : yD - 0.02; q.p[2] = p.z; q.nn = [Math.sin(ph) * PAL.Rt.x + Math.cos(ph) * PAL.F.x, 0, Math.sin(ph) * PAL.Rt.z + Math.cos(ph) * PAL.F.z]; q.f[0] = ph * aD; q.f[1] = q.p[1]; q.f2[0] = 0.3; q.m = MT.CONCRETE;
    });
    // a ring of lights in the floor, warm light low round the well, the docking spot's marks
    for (var k2 = 0; k2 < 36; k2++) { var t2 = k2 / 36 * 2 * Math.PI, lx = c.x + (R - 0.55) * Math.cos(t2), lz = c.z + (R - 0.55) * Math.sin(t2); if (qd(lx, lz) < aD + 0.4) continue; B.geo(addF2(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), 2.2, 0), T(lx, yD + 0.01, lz), MT.LIGHT, 1); }
    for (var k3 = 0; k3 < 5; k3++) { var t3 = tD + (k3 + 1) / 6 * 2 * Math.PI; extLight(c.x + (R - 0.6) * Math.cos(t3), yD + 0.3, c.z + (R - 0.6) * Math.sin(t3), WARMC, 0.35, 3.5); }
    pdkSpotMarks(B, P, yD);
  }
  // the bridge (the Ring's) or the landing (a gate's): a terrazzo floor on a slab, glass sides and roof on dark steel frames,
  // a light in its ceiling; the heavier frame at its end where the collar is fixed
  function pdkBridge(B, P) {
    var uf = P.uf, ug = P.ug, u1 = P.u1, hw = P.hw, yB = P.yB, h = P.h, well = P.kind === "well", GL = well ? ENT_GLASS : CRS_GLASS, gk = well ? 1 : 4, us = well ? ug - 0.1 : ug;
    pdkFlat(B, P, uf, u1, -hw, hw, yB, MT.TERRAZZO, [0, 0], true);
    pdkFlat(B, P, us, u1, -hw - 0.08, hw + 0.08, yB - 0.32, MT.SHELL, [4, 0], false);
    [-1, 1].forEach(function (s) { pdkSide(B, P, us, u1, s * (hw + 0.08), yB - 0.32, yB + 0.06, s, MT.ANOD, [0, 0]); });
    pdkEnd(B, P, u1, -hw - 0.08, hw + 0.08, yB - 0.32, yB + 0.06, 1, MT.ANOD, [0, 0]);
    var ng = Math.max(1, Math.ceil((u1 - ug) / 1.5));
    [-1, 1].forEach(function (s) {
      GL.surf(ng, 1, function (i, j, q) { var p = pdkAt(P, lerp(ug, u1, i / ng), s * hw); q.p[0] = p.x; q.p[1] = j ? yB + h : yB + 0.06; q.p[2] = p.z; q.nn = [P.T.x * s, 0, P.T.z * s]; q.f[0] = 0; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - yB; q.f2[1] = gk; q.m = 0; });
    });
    GL.surf(ng, 1, function (i, j, q) { var p = pdkAt(P, lerp(ug, u1, i / ng), j ? hw : -hw); q.p[0] = p.x; q.p[1] = yB + h + 0.02; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = 0; q.f[1] = 0; q.f2[0] = h; q.f2[1] = gk; q.m = 0; });
    var nf = (u1 - ug) > 3 ? Math.max(2, Math.round((u1 - ug) / 1.5)) : 1;
    for (var f = 0; f <= nf; f++) { var uq = lerp(ug + 0.04, u1 - 0.04, f / nf);
      [-1, 1].forEach(function (s) { tubeAlong(B, [pdkV3(P, uq, s * (hw + 0.03), yB), pdkV3(P, uq, s * (hw + 0.03), yB + h + 0.04)], 0.035, 8, MT.RIB); });
      tubeAlong(B, [pdkV3(P, uq, -hw - 0.03, yB + h + 0.05), pdkV3(P, uq, hw + 0.03, yB + h + 0.05)], 0.035, 8, MT.RIB); }
    [[-1, yB + 0.07], [1, yB + 0.07], [-1, yB + h + 0.05], [1, yB + h + 0.05]].forEach(function (e) { tubeAlong(B, [pdkV3(P, ug, e[0] * (hw + 0.03), e[1]), pdkV3(P, u1, e[0] * (hw + 0.03), e[1])], 0.04, 8, MT.RIB); });
    var bx = new Builder(), Me = new THREE.Matrix4().makeBasis(new THREE.Vector3(P.T.x, 0, P.T.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(P.O.x, 0, P.O.z)).setPosition(pdkV3(P, u1, 0, yB));
    bx.box(-hw - 0.14, -0.34, -0.08, -hw, h + 0.16, 0.06, MT.ANOD); bx.box(hw, -0.34, -0.08, hw + 0.14, h + 0.16, 0.06, MT.ANOD); bx.box(-hw - 0.14, h, -0.08, hw + 0.14, h + 0.2, 0.06, MT.ANOD);
    B.add(bx, Me);
    if (u1 - ug > 2) {
      pdkFlat(B, P, ug + 0.3, u1 - 0.3, -0.06, 0.06, yB + h - 0.02, MT.LIGHT, [1.6, 0], false, 1);
      [0.25, 0.6, 0.92].forEach(function (k5) { var p = pdkAt(P, lerp(ug, u1, k5), 0); extLight(p.x, yB + h - 0.25, p.z, LAMPC, 1.1, 5, [0, -1, 0], 1); });
    } else {
      var pl = pdkAt(P, (ug + u1) / 2, 0); B.geo(addF2(new THREE.CircleGeometry(0.12, 16), 1.4, 0.3), T(pl.x, yB + h - 0.01, pl.z, Math.PI / 2, 0, 0), MT.LIGHT, 1);
      extLight(pl.x, yB + h - 0.2, pl.z, LAMPC, 0.9, 4, [0, -1, 0], 1);
    }
  }
  // the collars: dark bellows on steel frames from the bridge's end to the pod's canopy, folding up as they run back in;
  // each built where it stands run out, then squeezed along its dock's axis about its root (pdkCollarSet)
  function podDockCollar() { PDKS.forEach(pdkCollarBuild); }
  function pdkCollarBuild(P) {
    if (P.collar) return;
    var hw = P.hw, h = P.h, u1 = P.u1, L = P.cmax, yB = P.yB, N = 7, cb = new Builder(), sb = new Builder(); cb.zone = ZONE.OUT; sb.zone = ZONE.OUT;
    var M = new THREE.Matrix4().makeBasis(new THREE.Vector3(P.T.x, 0, P.T.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(P.O.x, 0, P.O.z)).setPosition(pdkV3(P, u1, 0, yB));
    var fb = new Builder();
    for (var k = 0; k <= N; k++) {                                         // the folds' frames
      var z = L * k / N, w = hw + 0.1 + (k % 2) * 0.05, t = k === N ? 0.12 : 0.03;
      fb.box(-w, -0.06, z - t, w, 0.0, z + t, MT.ANOD); fb.box(-w, h + 0.05, z - t, w, h + 0.1 + (k % 2) * 0.05, z + t, MT.ANOD);
      fb.box(-w - 0.05, -0.06, z - t, -w, h + 0.1, z + t, MT.ANOD); fb.box(w, -0.06, z - t, w + 0.05, h + 0.1, z + t, MT.ANOD);
    }
    fb.box(-hw, -0.06, 0, hw, -0.01, L, MT.STEEL);                         // the tread
    fb.box(-hw - 0.06, -0.04, -0.02, -hw - 0.04, h + 0.08, L, MT.RUBBER); fb.box(hw + 0.04, -0.04, -0.02, hw + 0.06, h + 0.08, L, MT.RUBBER);   // the bellows' skin
    fb.box(-hw - 0.06, h + 0.06, -0.02, hw + 0.06, h + 0.08, L, MT.RUBBER);
    fb.box(-hw - 0.2, -0.1, L - 0.06, -hw - 0.05, h + 0.2, L + 0.06, MT.RUBBER); fb.box(hw + 0.05, -0.1, L - 0.06, hw + 0.2, h + 0.2, L + 0.06, MT.RUBBER);   // the seal round its mouth
    fb.box(-hw - 0.2, h + 0.08, L - 0.06, hw + 0.2, h + 0.22, L + 0.06, MT.RUBBER);
    cb.add(fb, M);
    var sh = new Builder(); sh.box(-hw, 0, L + 0.04, hw, h + 0.05, L + 0.08, MT.ANOD); sb.add(sh, M);   // the shutter that closes its mouth when no pod is there
    P.collar = bakedMesh(cb, matMat, campusLights, null, { noOcclude: true }); BAKE.meshes.pop(); P.collar.matrixAutoUpdate = false; scene.add(P.collar);
    P.shutter = bakedMesh(sb, matMat, campusLights, null, { noOcclude: true }); BAKE.meshes.pop(); P.shutter.matrixAutoUpdate = false; scene.add(P.shutter);
    pdkCollarSet(P);
  }
  // squeeze a collar along its dock's axis about its root: ext 1 run out, small run in
  function pdkCollarSet(P) {
    if (!P || !P.collar) return;
    var s = Math.max(0.08, P.ext), n = new THREE.Vector3(P.O.x, 0, P.O.z), root = pdkV3(P, P.u1, 0, P.yB);
    var S = new THREE.Matrix4().set(1 + (s - 1) * n.x * n.x, 0, (s - 1) * n.x * n.z, 0, 0, 1, 0, 0, (s - 1) * n.z * n.x, 0, 1 + (s - 1) * n.z * n.z, 0, 0, 0, 0, 1);
    var t = root.clone().sub(root.clone().applyMatrix4(S)); S.setPosition(t.x, t.y, t.z);
    [P.collar, P.shutter].forEach(function (m) { m.matrix.copy(S); m.matrixWorldNeedsUpdate = true; });
    P.shutter.visible = P.ext < 0.97;
  }
  function pdkUpdate(dt) {
    for (var i = 0; i < PDKS.length; i++) { var P = PDKS[i]; if (!P.collar) continue;
      var e = P.ext + clamp(P.want - P.ext, -dt * 0.9, dt * 0.9);
      if (Math.abs(e - P.ext) > 1e-4) { P.ext = e; pdkCollarSet(P); } }
  }
  // where you walk: a bridge's or landing's floor from its start to its end, and on into the collar when it is run out to a
  // pod; its glass sides; the collar's mouth (the pod) or the closed end beyond. Outside, nobody walks into a gate's well.
  function podDockSupport(x, z, yf) {
    if (yf === undefined) return undefined;
    for (var i = 0; i < PDKS.length; i++) { var v = pdkSupport(PDKS[i], x, z, yf); if (v !== undefined) return v; }
    return undefined;
  }
  function pdkSupport(P, x, z, yf) {
    if (yf < P.yB - 1.0) return undefined;
    var q = pdkUV(P, x, z), u = q.u, v = q.v, end = P.u1 + P.cmax * (P.ext > 0.97 ? 1 : 0);
    if (u < P.u0 - 0.3 || u > end + 0.6 || Math.abs(v) > P.hw + 0.45) {
      if (P.kind === "well" && Math.hypot(x - P.c.x, z - P.c.z) < P.R + 0.25 && Math.hypot(x - P.org.x, z - P.org.z) > ENT.a + 0.25) return NaN;
      return undefined;
    }
    if (Math.abs(v) > P.hw - 0.18) return u > P.u0 + 0.15 ? NaN : undefined;
    if (u > end - 0.2) return NaN;
    return P.yB;
  }
  // the Ring's deck stands just clear of the ground on its legs: from the ground you walk round it
  function podDockBlocked(x, z, yf) {
    var P = PDK; if (!P || yf > P.yD - 0.5) return false;
    return Math.hypot(x - P.c.x, z - P.c.z) < P.R + 0.3;
  }
  // for the pods: a deck or a well's floor is the ground they float over; the bridges and the collars are no place to fly through
  function podDockGround(x, z) { for (var i = 0; i < PDKS.length; i++) { var P = PDKS[i]; if (Math.hypot(x - P.c.x, z - P.c.z) < P.R) return P.yD; } return undefined; }
  function podDockTop(x, z) {
    var top = -1e9;
    for (var i = 0; i < PDKS.length; i++) { var P = PDKS[i], q = pdkUV(P, x, z); if (q.u > P.u0 - 0.5 && q.u < P.u1 + P.cmax * P.ext + 0.4 && Math.abs(q.v) < P.hw + 0.5) top = Math.max(top, P.yB + P.h + 0.5); }
    return top;
  }
