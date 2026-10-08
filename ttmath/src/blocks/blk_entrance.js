  /* ===================== Phase 2: the entrance dome (T04-01) and its airlock (T04-02) ===================== */
  // Jim, 5 Oct 2026: "the entrance is not sealed by dome. it needs to". A glass dome on a bronze lattice over the plaza in
  // front of the Gate Hall (P2.entrance): 23 m across, a drum of upright glass 3 m tall on a stone curb, a shallow cap on a
  // ring beam to 6.8 m, standing 2.4 m into the Ring's front so its glass lands on the Gate Hall's facade; inside,
  // paving, planters with young trees, the campus's name on a stone wall. Jim, 6 Oct 2026, of the first one, a cap that
  // came down to the ground with a rib ending in mid-air over the airlock: "why has this? not designed well". The airlock
  // now comes in through a framed doorway in the drum, under the ring beam, where every rib lands.
  // The way in from outside is the airlock at its front: outer and inner sliding doors with a chamber 5 m long between
  // them, each opening only once the other has closed (doorsUpdate), so the two are never open together.
  // Dome frame: q metres from the dome's centre on the ground, phi from the start's side (+rad) toward +lat.
  var ENT = null, ENT_GLASS = new Builder();
  function entInit() {
    if (ENT) return ENT;
    var E = P2.entrance, a = E.r, A = E.airlock, pg = palXZ(0, A.s1 + 0.6), yA = Math.max(PALY.B, cgH(pg.x, pg.z));
    // the airlock stands on the ground outside; the plaza slopes gently down from it to the Gate Hall's door; the dome sits
    // on a low wall at the airlock's level, its top where the plan puts it (under the line of sight)
    var h2 = E.h - (yA - PALY.B), hd = E.drum, hc = h2 - hd;
    ENT = { c: { lat: E.c[0], rad: E.c[1] }, a: a, h: h2, hd: hd, rho: (a * a + hc * hc) / (2 * hc), y: PALY.B, yA: yA, yb: yA, s0: A.s0, s1: A.s1, hw: A.w / 2, ah: A.h, rLow: 63.5 };
    ENT.phiP = Math.asin((ENT.hw + 0.12) / a);                                          // the airlock's doorway in the drum: phi within this
    ENT.phiG = P2.pod_gates ? Math.asin((P2.pod_gates.door_w / 2 + 0.12) / a) : 0;     // each pod gate's doorway, round its phi
    return ENT;
  }
  function entFloor(rad) { return ENT.y + (ENT.yA - ENT.y) * clamp((rad - ENT.rLow) / (ENT.s0 - ENT.rLow), 0, 1); }
  function entPt(q, phi) { return { lat: ENT.c.lat + q * Math.sin(phi), rad: ENT.c.rad + q * Math.cos(phi) }; }
  function entTop(q) { return ENT.yb + ENT.h - ENT.rho + Math.sqrt(Math.max(0, ENT.rho * ENT.rho - q * q)); }   // the cap; at q = a the drum's top
  // how far the dome reaches along phi: its edge, or the Ring's front where it stands into it
  function entReach(phi) {
    var R1 = CRS.r1 + 0.1, cu = ENT.c.lat * Math.sin(phi) + ENT.c.rad * Math.cos(phi), cc = ENT.c.lat * ENT.c.lat + ENT.c.rad * ENT.c.rad, disc = cu * cu - (cc - R1 * R1);
    if (cu >= 0 || disc <= 0) return ENT.a;
    var qh = -cu - Math.sqrt(disc); return qh > 0 ? Math.min(ENT.a, qh) : ENT.a;
  }
  // in a doorway through the drum (phi in radians, pad widens it): the airlock's, or one of the pod gates' (P2.pod_gates)
  function entDoorway(phi, pad) {
    var p = pad || 0, ph = Math.atan2(Math.sin(phi), Math.cos(phi)); if (Math.abs(ph) < ENT.phiP + p) return true;
    var G = P2.pod_gates; if (!G) return false;
    for (var i = 0; i < G.phi.length; i++) { var d = Math.atan2(Math.sin(phi - G.phi[i] * D2R), Math.cos(phi - G.phi[i] * D2R)); if (Math.abs(d) < ENT.phiG + p) return true; }
    return false;
  }
  function entBenchAt(phi) {
    var ph = Math.atan2(Math.sin(phi), Math.cos(phi)) * R2D;
    return (P2.entrance.benches || []).some(function (bn) { var half = bn[1] * 1.64 / 2 / (ENT.a - 0.44) * R2D + 2; return Math.abs(Math.abs(ph) - bn[0]) < half; });
  }
  function inAirlockBox(lat, rad, pad) { return Math.abs(lat) < ENT.hw + (pad || 0) && rad > ENT.s0 - (pad || 0) && rad < ENT.s1 + (pad || 0); }
  // sliding glass doors across the axis at rad s, facing the start; opened by the frame loop
  function entDoor(B, s, lock) {
    var y0 = ENT.yA, p = palXZ(0, s), M = new THREE.Matrix4().makeBasis(new THREE.Vector3(PAL.Rt.x, 0, PAL.Rt.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(PAL.F.x, 0, PAL.F.z)).setPosition(p.x, y0, p.z);
    var fr = new Builder(), hD = 2.3, top = ENT.ah - 0.1;
    fr.box(-1.18, 0, -0.07, -1.05, top, 0.08, MT.ANOD); fr.box(1.05, 0, -0.07, 1.18, top, 0.08, MT.ANOD); fr.box(-1.1, hD, -0.09, 1.1, hD + 0.14, 0.1, MT.ANOD); fr.box(-1.15, -0.03, -0.14, 1.15, 0.006, 0.14, MT.STEEL);
    fr.box(-ENT.hw, 0, -0.06, -1.18, 0.1, 0.06, MT.ANOD); fr.box(1.18, 0, -0.06, ENT.hw, 0.1, 0.06, MT.ANOD); fr.box(-ENT.hw, top - 0.1, -0.06, ENT.hw, top, 0.06, MT.ANOD);
    fr.tag(0, 3, null); B.add(fr, M);
    [[-ENT.hw + 0.05, -1.18], [1.18, ENT.hw - 0.05]].forEach(function (sp) { ENT_GLASS.surf(2, 1, function (i, j, q) { var lat = lerp(sp[0], sp[1], i / 2), pp = palXZ(lat, s); q.p[0] = pp.x; q.p[1] = y0 + (j ? top - 0.1 : 0.1); q.p[2] = pp.z; q.nn = [PAL.F.x, 0, PAL.F.z]; q.f2[0] = j ? 2.4 : 0.1; q.f2[1] = 1; q.m = 0; }); });
    ENT_GLASS.surf(2, 1, function (i, j, q) { var lat = -1.05 + 2.1 * i / 2, pp = palXZ(lat, s); q.p[0] = pp.x; q.p[1] = y0 + (j ? top - 0.1 : hD + 0.14); q.p[2] = pp.z; q.nn = [PAL.F.x, 0, PAL.F.z]; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    var door = { c: { x: p.x, z: p.z }, y: y0, dir: { x: PAL.Rt.x, z: PAL.Rt.z }, open: 0, leaves: [], M: M.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.12)), lock: lock || null, slide: 1.05, hall: true };
    [-1, 1].forEach(function (side) {
      var lf = new Builder(), x0 = side < 0 ? -1.07 : 0.0, x1 = side < 0 ? 0.0 : 1.07;
      lf.box(x0, 0, -0.03, x1, 0.09, 0.03, MT.ANOD); lf.box(x0, 2.2, -0.03, x1, 2.28, 0.03, MT.ANOD); lf.box(x0, 0.09, -0.03, x0 + 0.06, 2.2, 0.03, MT.ANOD); lf.box(x1 - 0.06, 0.09, -0.03, x1, 2.2, 0.03, MT.ANOD);
      var hx = side < 0 ? x1 - 0.09 : x0 + 0.05; lf.box(hx, 0.95, 0.03, hx + 0.04, 1.3, 0.07, MT.STEEL); lf.box(hx, 0.95, -0.07, hx + 0.04, 1.3, -0.03, MT.STEEL); lf.tag(0, 3, null);
      var gl = new Builder(); gl.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0 + 0.06, x1 - 0.06, i); q.p[1] = lerp(0.09, 2.2, j); q.p[2] = 0; q.nn = [0, 0, 1]; q.f2[0] = lerp(0.09, 2.2, j); q.f2[1] = 2; q.m = 0; });
      door.leaves.push({ side: side, frame: lf, glass: gl });
    });
    DOORS.push(door); return door;
  }
  function entranceBuild(B) {
    var E = entInit(), D = D2R, y = E.y, NP = 144, NQ = 22;
    p2Sector(E.c.lat, E.c.rad, 0, E.a + 0.25, -4, 4); p2Box(-E.hw - 0.3, E.s0 - 0.5, E.hw + 0.3, E.s1 + 0.4); p2CutApply();
    B.zone = ZONE.OUT;
    function W(q, phi, yy) { var o = entPt(q, phi), p = palXZ(o.lat, o.rad); return new THREE.Vector3(p.x, yy, p.z); }
    // the plaza's paving, out to the dome's curb and the Ring's front
    B.surf(NP, NQ, function (i, j, q) { var phi = i / NP * 2 * Math.PI, qq = (entReach(phi) - 0.06) * j / NQ, o = entPt(qq, phi), p = palXZ(o.lat, o.rad); q.p[0] = p.x; q.p[1] = entFloor(o.rad); q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = o.lat; q.f[1] = o.rad; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; }, true);
    // the curb the glass stands on, out of the ground, where the dome stands clear of the Ring and the airlock
    var runs = [], cur = null, nc = 160;
    for (var ic = 0; ic <= nc; ic++) { var phc = ic / nc * 2 * Math.PI, oc = entPt(E.a, phc), ok = entReach(phc) > E.a - 0.01 && !entDoorway(phc); if (ok) { if (!cur) { cur = []; runs.push(cur); } cur.push(phc); } else cur = null; }
    runs.forEach(function (rn) {
      if (rn.length < 2) return; var n = rn.length - 1;
      B.surf(n, 1, function (i, j, q) { var phi = rn[i], o = entPt(E.a + 0.18, phi), p = palXZ(o.lat, o.rad), g = cgH(p.x, p.z), yy = j ? E.yb + 0.32 : Math.min(g, entFloor(o.rad)) - 0.4; q.p[0] = p.x; q.p[1] = yy; q.p[2] = p.z; q.nn = [Math.sin(phi) * PAL.Rt.x + Math.cos(phi) * PAL.F.x, 0, Math.sin(phi) * PAL.Rt.z + Math.cos(phi) * PAL.F.z]; q.f[0] = phi * E.a; q.f[1] = yy; q.f2[0] = yy - g; q.m = MT.CONCRETE; });
      B.surf(n, 1, function (i, j, q) { var phi = rn[i], o = entPt(E.a + (j ? 0.18 : -0.12), phi), p = palXZ(o.lat, o.rad); q.p[0] = p.x; q.p[1] = E.yb + 0.32; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = phi * E.a; q.f[1] = j * 0.3; q.f2[0] = 1; q.m = MT.CONCRETE; });
      B.surf(n, 1, function (i, j, q) { var phi = rn[i], o = entPt(E.a - 0.12, phi), p = palXZ(o.lat, o.rad); q.p[0] = p.x; q.p[1] = j ? E.yb + 0.32 : entFloor(o.rad) - 0.02; q.p[2] = p.z; q.nn = [-(Math.sin(phi) * PAL.Rt.x + Math.cos(phi) * PAL.F.x), 0, -(Math.sin(phi) * PAL.Rt.z + Math.cos(phi) * PAL.F.z)]; q.f[0] = phi * E.a; q.f[1] = q.p[1]; q.f2[0] = 0.3; q.m = MT.CONCRETE; });
      tubeAlong(B, rn.map(function (phi) { return W(E.a, phi, E.yb + 0.36); }), 0.07, 6, MT.RIB);
    });
    // the glass: the cap, clipped by the Ring's front; the drum, upright from the curb to the ring beam, where the dome stands
    // clear of the Ring, open at the airlock's doorway
    var NG = 120, NV = 18, cx0 = palXZ(E.c.lat, E.c.rad), cyS = E.yb + E.h - E.rho, yDb = E.yb + 0.32, yDt = E.yb + E.hd;
    function out(phi) { return [Math.sin(phi) * PAL.Rt.x + Math.cos(phi) * PAL.F.x, 0, Math.sin(phi) * PAL.Rt.z + Math.cos(phi) * PAL.F.z]; }
    for (var i = 0; i < NG; i++) for (var j = 0; j < NV; j++) (function (i, j) {
      var p0 = i / NG * 2 * Math.PI, p1 = (i + 1) / NG * 2 * Math.PI, t0 = j / NV, t1 = (j + 1) / NV;
      ENT_GLASS.surf(1, 1, function (u, v, q) { var phi = u ? p1 : p0, qq = Math.min(E.a, entReach(phi)) * (v ? t1 : t0), P = W(qq, phi, entTop(qq) + 0.02); q.p[0] = P.x; q.p[1] = P.y; q.p[2] = P.z;
        q.nn = [P.x - cx0.x, P.y - cyS, P.z - cx0.z]; q.f[0] = phi * qq; q.f[1] = qq; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    })(i, j);
    // the drum's runs: every quarter degree, where the dome stands clear of the Ring's front, less the doorway
    var drum = [], run2 = null;
    for (var k5 = 0; k5 <= 1440; k5++) { var ph5 = E.phiP + (2 * Math.PI - 2 * E.phiP) * k5 / 1440; if (entReach(ph5) > E.a - 0.01 && !entDoorway(ph5)) { if (!run2) { run2 = []; drum.push(run2); } run2.push(ph5); } else run2 = null; }
    drum.forEach(function (rn) {
      if (rn.length < 2) return; var n = rn.length - 1;
      ENT_GLASS.surf(n, 1, function (u, v, q) { var phi = rn[u], P = W(E.a, phi, v ? yDt - 0.06 : yDb); q.p[0] = P.x; q.p[1] = P.y; q.p[2] = P.z; q.nn = out(phi); q.f[0] = phi * E.a; q.f[1] = P.y; q.f2[0] = P.y - yDb; q.f2[1] = 1; q.m = 0; });
      tubeAlong(B, rn.map(function (phi) { return W(E.a, phi, yDt); }), 0.09, 8, MT.RIB);                       // the ring beam
    });
    // the doorway: two bronze jambs, the fascia over the airlock's roof up to the ring beam, the beam across it
    var pd = []; for (var k6 = 0; k6 <= 16; k6++) pd.push(lerp(-E.phiP, E.phiP, k6 / 16));
    tubeAlong(B, pd.map(function (phi) { return W(E.a, phi, yDt); }), 0.09, 8, MT.RIB);
    [1, -1].forEach(function (sd) { B.surf(16, 1, function (u, v, q) { var phi = pd[u], P = W(E.a + sd * 0.07, phi, v ? yDt : E.yA + E.ah - 0.06), nn = out(phi); q.p[0] = P.x; q.p[1] = P.y; q.p[2] = P.z; q.nn = [nn[0] * sd, 0, nn[2] * sd]; q.f[0] = phi * E.a; q.f[1] = P.y; q.f2[0] = 3; q.m = MT.ANOD; }); });
    [-E.phiP, E.phiP].forEach(function (pj) { var jb = new Builder(), Pj = W(E.a, pj, 0), nn = out(pj), M = new THREE.Matrix4().makeBasis(new THREE.Vector3(nn[2], 0, -nn[0]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nn[0], 0, nn[2])).setPosition(Pj.x, E.yA - 0.05, Pj.z);
      jb.box(-0.1, 0, -0.1, 0.1, yDt - E.yA + 0.05, 0.1, MT.ANOD); jb.tag(0, 3, null); B.add(jb, M); });
    // the pod gates' doorways (blk_poddock.js builds their landings and wells): bronze jambs from the floor to the ring beam
    // over the curb's cut ends, the beam across, a fascia down to the landing's glass roof, the gate's number on it inside
    if (P2.pod_gates) P2.pod_gates.phi.forEach(function (phd, gi) {
      var ph = phd * D, yF = entFloor(entPt(E.a, ph).rad), yTop = yF + P2.pod_gates.door_h + 0.06, pg = [];
      for (var k7 = 0; k7 <= 8; k7++) pg.push(lerp(ph - E.phiG, ph + E.phiG, k7 / 8));
      tubeAlong(B, pg.map(function (p) { return W(E.a, p, yDt); }), 0.09, 8, MT.RIB);
      [1, -1].forEach(function (sd) { B.surf(8, 1, function (u, v, q) { var p = pg[u], P = W(E.a + sd * 0.07, p, v ? yDt : yTop), nn = out(p); q.p[0] = P.x; q.p[1] = P.y; q.p[2] = P.z; q.nn = [nn[0] * sd, 0, nn[2] * sd]; q.f[0] = p * E.a; q.f[1] = P.y; q.f2[0] = 3; q.m = MT.ANOD; }); });
      [ph - E.phiG, ph + E.phiG].forEach(function (pj) { var jb = new Builder(), Pj = W(E.a, pj, 0), nn = out(pj), M = new THREE.Matrix4().makeBasis(new THREE.Vector3(nn[2], 0, -nn[0]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nn[0], 0, nn[2])).setPosition(Pj.x, yF - 0.05, Pj.z);
        jb.box(-0.1, 0, -0.14, 0.1, yDt - yF + 0.05, 0.2, MT.ANOD); jb.tag(0, 3, null); B.add(jb, M); });
      gateSign(gi, ph, yTop, yDt);
    });
    // the lattice: meridian ribs every 10 degrees from the crown ring down to the ring beam (or to the Gate Hall's facade),
    // rings round the cap, mullions down the drum under each rib
    for (var m = 0; m < 36; m++) {
      var phi = m * 10 * D, qm = Math.min(E.a, entReach(phi)), pts = [];
      for (var k = 0; k <= 20; k++) { var qq = lerp(1.2, qm, k / 20); pts.push(W(qq, phi, entTop(qq) - 0.04)); }
      tubeAlong(B, pts, 0.055, 6, MT.RIB);
      if (entReach(phi) > E.a - 0.01 && !entDoorway(phi, 0.01)) tubeAlong(B, [W(E.a, phi, yDb), W(E.a, phi, yDt)], 0.05, 6, MT.RIB);
    }
    [1.2, 4.0, 6.6, 8.8, 10.5].forEach(function (qr) {
      var run = [];
      function flush() { if (run.length > 1) tubeAlong(B, run, qr === 1.2 ? 0.08 : 0.045, 6, MT.RIB); run = []; }
      for (var k2 = 0; k2 <= 180; k2++) { var ph = k2 / 180 * 2 * Math.PI; if (qr > entReach(ph) - 0.05) { flush(); continue; } run.push(W(qr, ph, entTop(qr) - 0.04)); }
      flush();
    });
    // the airlock: a glass box on an aluminium frame, its floor, the two pairs of doors
    var hw = E.hw, s0 = E.s0, s1 = E.s1, ah = E.ah, ya = E.yA;
    B.surf(4, 8, function (u, v, q) { var lat = lerp(-hw, hw, u / 4), rad = lerp(s0, s1, v / 8), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = ya + 0.004; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.m = MT.BALSTONE; });
    [-1, 1].forEach(function (sg) {
      ENT_GLASS.surf(6, 1, function (u, v, q) { var rad = lerp(s0 + 0.08, s1 - 0.08, u / 6), p = palXZ(sg * hw, rad); q.p[0] = p.x; q.p[1] = ya + (v ? ah - 0.08 : 0.1); q.p[2] = p.z; q.nn = [PAL.Rt.x * sg, 0, PAL.Rt.z * sg]; q.f[0] = rad; q.f[1] = q.p[1]; q.f2[0] = v ? ah : 0.1; q.f2[1] = 1; q.m = 0; });
      var fb = new Builder(); [s0, (s0 + s1) / 2, s1].forEach(function (rad) { var p = palXZ(sg * hw, rad); fb.box(p.x - 0.06, ya - 0.3, p.z - 0.06, p.x + 0.06, ya + ah, p.z + 0.06, MT.ANOD); }); B.add(fb, new THREE.Matrix4());
      var r0p = palXZ(sg * hw, s0), r1p = palXZ(sg * hw, s1); tubeAlong(B, [new THREE.Vector3(r0p.x, ya + ah - 0.04, r0p.z), new THREE.Vector3(r1p.x, ya + ah - 0.04, r1p.z)], 0.05, 4, MT.ANOD);
      tubeAlong(B, [new THREE.Vector3(r0p.x, ya + 0.05, r0p.z), new THREE.Vector3(r1p.x, ya + 0.05, r1p.z)], 0.05, 4, MT.ANOD);
    });
    ENT_GLASS.surf(2, 4, function (u, v, q) { var lat = lerp(-hw, hw, u / 2), rad = lerp(s0, s1, v / 4), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = ya + ah; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    [-1, 1].forEach(function (sg) { B.surf(8, 1, function (u, v, q) { var rad = lerp(s0, s1, u / 8), p = palXZ(sg * (hw + 0.02), rad), g = cgH(p.x, p.z); q.p[0] = p.x; q.p[1] = v ? ya + 0.05 : Math.min(g, ya) - 0.4; q.p[2] = p.z; q.nn = [PAL.Rt.x * sg, 0, PAL.Rt.z * sg]; q.f[0] = rad; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - g; q.m = MT.CONCRETE; }); });
    ENT.inner = entDoor(B, s0); ENT.outer = entDoor(B, s1, ENT.inner); ENT.inner.lock = ENT.outer;
    var lp = palXZ(0, (s0 + s1) / 2); extLight(lp.x, ya + ah - 0.15, lp.z, WARMC, 1.4, 6, [0, -1, 0], 1);
    // the campus's name on a curved stone wall by the path, young trees in planters, benches, light
    // (v0.37, with the pod gates) the paths from the airlock and the four gates meet in the middle; the wall stands at the
    // back facing the airlock, before the Gate Hall's door, and the six trees between the paths (P2.entrance)
    var LG = P2.entrance.logo, lc = palXZ(LG.lat, LG.rad); logoWall(B, lc, entFloor(LG.rad), Math.atan2(PAL.F.x, PAL.F.z));
    ENT.posts = [-1.6, 0, 1.6].map(function (s) { var p = palXZ(LG.lat + s, LG.rad); return { x: p.x, z: p.z, r: 0.95 }; });
    var R2 = mulberry(9090);
    P2.entrance.trees.map(function (t) { var o = entPt(t[1], t[0] * D); return [o.lat, o.rad, t[2]]; }).forEach(function (t, n) {
      var c = palXZ(t[0], t[1]), rr = 1.0, y = entFloor(t[1]); latheOn(B, c.x, y, c.z, [[rr, 0], [rr, 0.55], [rr + 0.05, 0.6], [rr - 0.08, 0.62], [rr - 0.08, 0.54], [0, 0.54]], 32, MT.CONCRETE, 0.4);
      B.geo(new THREE.CylinderGeometry(rr - 0.1, rr - 0.1, 0.02, 32), T(c.x, y + 0.54, c.z), MT.RUBBER, 1); bedPlant(B, t[2], 800 + n, T(c.x, y, c.z, 0, R2() * 6.28, 0), 0.55, 1.9);
      ENT.posts.push({ x: c.x, z: c.z, r: rr + 0.3 }); extLight(c.x, y + 0.7, c.z, WARMC, 0.9, 5, [0, 1, 0], 1.6);
    });
    // curved banquettes in navy wool against the drum's curb between the doorways (P2.entrance.benches), seats while
    // waiting for a pod or a ride: straight 1.6 m pieces round the curve, their backs leaning on the curb
    (P2.entrance.benches || []).forEach(function (bn) { [-1, 1].forEach(function (sd) {
      for (var k6 = 0; k6 < bn[1]; k6++) {
        var pB = sd * bn[0] * D + (k6 - (bn[1] - 1) / 2) * 1.64 / (E.a - 0.44) * sd;
        var o6 = entPt(E.a - 0.44, pB), p6 = palXZ(o6.lat, o6.rad), nn = out(pB), M6 = new THREE.Matrix4().makeBasis(new THREE.Vector3(nn[2], 0, -nn[0]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nn[0], 0, nn[2])).setPosition(p6.x, entFloor(o6.rad), p6.z);
        var fb6 = banquette(1.6, 1); B.add(fb6, M6); contactShadow(fb6, M6);
        [-0.4, 0.4].forEach(function (s6) { var q6 = entPt(E.a - 0.5, pB + s6 / (E.a - 0.5)), c6 = palXZ(q6.lat, q6.rad); ENT.posts.push({ x: c6.x, z: c6.z, r: 0.5 }); });
      }
    }); });
    for (var k4 = 0; k4 < 12; k4++) { var ph4 = (k4 + 0.5) / 12 * 2 * Math.PI, q4 = entReach(ph4) - 0.5; if (q4 < E.a - 0.6 || entDoorway(ph4, 0.2) || entBenchAt(ph4)) continue; var o4 = entPt(q4, ph4); if (inAirlockBox(o4.lat, o4.rad, 0.8)) continue; var p4 = palXZ(o4.lat, o4.rad);
      var y4 = entFloor(o4.rad); B.geo(addF2(new THREE.CylinderGeometry(0.07, 0.08, 0.06, 12), 1.5, 0), T(p4.x, y4 + 0.03, p4.z), MT.LIGHT, 1); extLight(p4.x, y4 + 0.2, p4.z, WARMC, 1.2, 8, [0, 0.9, 0], 2); }
  }
  // the gates' numbers over their doorways, inside: a dark plate with an amber edge and white letters, like the Ring's signs
  var GATE_SIGN_MAT = null;
  function gateSign(gi, ph, y0, y1) {
    var G = P2.pod_gates, n = G.phi.length, E = ENT;
    if (!GATE_SIGN_MAT) {
      var cv = mkCanvas(512, 128 * n), g = cv.getContext("2d");
      for (var i = 0; i < n; i++) { var y = i * 128; g.fillStyle = "#23272c"; g.fillRect(0, y, 512, 128); g.fillStyle = "#e8b04a"; g.fillRect(0, y, 10, 128);
        g.fillStyle = "#ffffff"; g.font = "700 66px " + SANS; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText("Gate " + (i + 1), 42, y + 66);
        g.fillStyle = "#c9ced4"; g.font = "500 34px " + SANS; g.textAlign = "right"; g.fillText(G.parked.indexOf(i) >= 0 ? "Pod" : "Arrivals", 486, y + 68); }
      GATE_SIGN_MAT = new THREE.ShaderMaterial({ uniforms: { map: { value: new THREE.CanvasTexture(cv) }, uExposure: U.uExposure, uBright: { value: 1.0 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS });
    }
    // seen from inside, facing out through the doorway, increasing phi is on the left
    var w = 1.2 / E.a, hh = Math.min(0.32, y1 - y0 - 0.12), yc = (y0 + y1) / 2, qs = E.a - 0.08, vA = 1 - (gi + 1) / n, vB = 1 - gi / n, pos = [], uvs = [];
    [[ph + w / 2, yc - hh / 2, 0, vA], [ph - w / 2, yc - hh / 2, 1, vA], [ph - w / 2, yc + hh / 2, 1, vB], [ph + w / 2, yc + hh / 2, 0, vB]].forEach(function (c) {
      var o = entPt(qs, c[0]), p = palXZ(o.lat, o.rad); pos.push(p.x, c[1], p.z); uvs.push(c[2], c[3]); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]);
    var m = new THREE.Mesh(geo, GATE_SIGN_MAT); m.matrixAutoUpdate = false; scene.add(m);
  }
  // a curved stone wall with a brushed-steel face and the backlit logo, like the one by the path at the start
  function logoWall(B, c, g, yaw) {
    var Wd = 4.8, Ht = 1.45, Tt = 0.3, Rc = 12, NS = 28, nx = Math.sin(yaw), nz = Math.cos(yaw), tx = nz, tz = -nx;
    function at(s, off) { var bend = -s * s / (2 * Rc); return { x: c.x + tx * s + nx * (off + bend), z: c.z + tz * s + nz * (off + bend) }; }
    B.surf(NS, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS, p = at(s, Tt / 2 + 0.006), yy = j ? g + Ht - 0.12 : g + 0.12; q.p[0] = p.x; q.p[1] = yy; q.p[2] = p.z; q.nn = [nx, 0, nz]; q.f[0] = (s + 2.1) / 4.2; q.f[1] = (yy - g - 0.1) / 1.3125; q.f2[0] = 9; q.m = MT.SIGN; });
    B.surf(NS, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS, p = at(s, Tt / 2); q.p[0] = p.x; q.p[1] = j ? g + Ht : g - 0.05; q.p[2] = p.z; q.nn = [nx, 0, nz]; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - g; q.m = MT.CONCRETE; });
    B.surf(NS, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS, p = at(s, -Tt / 2); q.p[0] = p.x; q.p[1] = j ? g + Ht : g - 0.05; q.p[2] = p.z; q.nn = [-nx, 0, -nz]; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - g; q.m = MT.CONCRETE; });
    B.surf(NS, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS, p = at(s, j ? Tt / 2 : -Tt / 2); q.p[0] = p.x; q.p[1] = g + Ht; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = j * Tt; q.f2[0] = Ht; q.m = MT.CONCRETE; });
    [-Wd / 2, Wd / 2].forEach(function (s) { B.surf(1, 1, function (i, j, q) { var p = at(s, i ? Tt / 2 : -Tt / 2); q.p[0] = p.x; q.p[1] = j ? g + Ht : g - 0.05; q.p[2] = p.z; q.nn = [tx * Math.sign(s), 0, tz * Math.sign(s)]; q.f[0] = i * Tt; q.f[1] = q.p[1]; q.f2[0] = Ht; q.m = MT.CONCRETE; }); });
    var sp = at(0, Tt / 2 + 1.3); extLight(sp.x, g + 0.25, sp.z, [0.92, 0.94, 1.0], 1.6, 6, [-nx, 0.45, -nz], 1);
  }
  // where you can stand: the plaza (round the planters and the wall), the airlock (its doors only when they are open)
  function entranceSupport(x, z, yf) {
    if (!ENT) return undefined;
    var o = palLoc(x, z, {}), y = ENT.y, dl = o.lat - ENT.c.lat, dr = o.rad - ENT.c.rad, q = Math.hypot(dl, dr), phi = Math.atan2(dl, dr);
    if (Math.abs(o.lat) < ENT.hw + 0.35 && o.rad > ENT.s0 - 0.25 && o.rad < ENT.s1 + 0.4) {     // the airlock
      var ya = ENT.yA;
      if (o.rad > ENT.s1 + 0.25) return undefined;                                                 // out in front
      if (Math.abs(o.rad - ENT.s1) < 0.25) return Math.abs(o.lat) < 1.0 && ENT.outer.open > 0.75 ? ya : NaN;
      if (Math.abs(o.rad - ENT.s0) < 0.25) return Math.abs(o.lat) < 1.0 && ENT.inner.open > 0.75 ? ya : NaN;
      return Math.abs(o.lat) < ENT.hw - 0.3 ? ya : NaN;
    }
    y = entFloor(o.rad);
    if (q > ENT.a + 0.5) return undefined;
    var reach = entReach(phi);
    if (reach < ENT.a - 0.01 && q > reach - 0.3) return undefined;                                 // at the Ring's front: the Ring decides
    if (q > ENT.a - 0.35) return NaN;                                                              // the curb and the glass
    for (var i = 0; i < ENT.posts.length; i++) { var p = ENT.posts[i]; if (Math.hypot(x - p.x, z - p.z) < p.r) return NaN; }
    return y;
  }
  function entranceInside(x, z) { if (!ENT) return 0; var o = palLoc(x, z, {}); return (Math.hypot(o.lat - ENT.c.lat, o.rad - ENT.c.rad) < ENT.a || inAirlockBox(o.lat, o.rad, 0)) ? 1 : 0; }
