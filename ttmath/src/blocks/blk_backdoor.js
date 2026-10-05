  /* ===================== Phase 2: the palace's back door (T09-04) and the back terrace (T09-01) ===================== */
  // A glass vestibule through the back of the dome at balcony level opens onto a stone terrace that wraps the back of
  // the dome, level with the balcony; the ground falls away behind it, so the terrace stands on a low retaining wall with
  // a parapet, and a stair at each end goes down to the ground. Sizes and places from P2 (campus_rooms.py).
  // Palace-frame angles: 0 toward the start, PI straight behind the dome.
  var BACK = { gap: 5.625 * D2R, w: 2.55, wall: 0.15, r1: 31.6, roofY: 2.85, roofT: 0.2, doorW: 1.22, kerb: 0.12, guard: 1.0,
               t0: (180 - 50) * D2R, t1: (180 + 50) * D2R, tr0: PAL.ringOut, tr1: 46.0, stairR: 37.0, stairW: 3.0, par: 0.9 };
  var BACK_GLASS = new Builder();
  // the vestibule: floor, side walls of glass in aluminium frames, a white composite roof, the collar on the dome
  function backDoor(B) {
    var yB = PALY.B, W = BACK.w, Wo = W + BACK.wall, r0 = PAL.ringIn, r1 = BACK.r1, yR = yB + BACK.roofY;
    var F = PAL.F, Rt = PAL.Rt;
    function P(lat, rad, y) { var p = palXZ(lat, rad); return new THREE.Vector3(p.x, y, p.z); }
    // floor: black marble, from the balcony's edge to past the doors
    B.zone = ZONE.ROT;
    B.surf(6, 10, function (i, j, q) { var lat = lerp(-Wo, Wo, i / 6), rad = -lerp(r0 - 0.05, r1 + 0.25, j / 10), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = yB + 0.01; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.m = MT.BALSTONE; });
    // ceiling under the roof slab, with a downlight
    B.surf(6, 8, function (i, j, q) { var lat = lerp(-W, W, i / 6), rad = -lerp(PAL.ringOut - 0.2, r1, j / 8), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = yR - 0.012; q.p[2] = p.z; q.nn = [0, -1, 0]; q.f[0] = lat; q.f[1] = rad; q.f2[1] = 0; q.m = MT.PLASTER; });   // just under the roof slab, never on it
    var dl = palXZ(0, -30.1); B.geo(addF2(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), 1.8, 0), T(dl.x, yR - 0.024, dl.z), MT.LIGHT, 1);
    extLight(dl.x, yR - 0.15, dl.z, [1.0, 0.85, 0.66], 1.4, 6, [0, -1, 0], 1.2);
    B.zone = ZONE.OUT;
    // roof slab: white composite with a dark aluminium fascia, over the collar and a little past the doors
    var rb = new Builder(), rFront = r1 + 0.45, rBack = PAL.ringOut - 0.75;
    rb.box(-(Wo + 0.2), 0, rBack, Wo + 0.2, BACK.roofT, rFront, MT.SHELL); rb.tag(0, 3, null);
    var fs = new Builder(); fs.box(-(Wo + 0.22), -0.02, rFront, Wo + 0.22, BACK.roofT + 0.02, rFront + 0.04, MT.ANOD);
    fs.box(-(Wo + 0.24), -0.02, rBack, -(Wo + 0.2), BACK.roofT + 0.02, rFront + 0.04, MT.ANOD); fs.box(Wo + 0.2, -0.02, rBack, Wo + 0.24, BACK.roofT + 0.02, rFront + 0.04, MT.ANOD); fs.tag(0, 3, null);
    var Mr = new THREE.Matrix4().makeBasis(new THREE.Vector3(Rt.x, 0, Rt.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-F.x, 0, -F.z)); Mr.setPosition(PAL.c.x, yR, PAL.c.z);
    B.add(rb, Mr); B.add(fs, Mr);
    // the collar: a portal frame on the dome around the opening, covering the cut edges of the ring and the glass
    var cb = new Builder(), cr0 = PAL.ringIn - 0.05, cr1 = PAL.ringOut + 0.12;
    [-1, 1].forEach(function (sd) { cb.box(sd > 0 ? W : -(Wo + 0.25), -0.02, cr0 + 0.3, sd > 0 ? Wo + 0.25 : -W, BACK.roofY + 0.02, cr1, MT.ANOD); });
    cb.tag(0, 3, null);
    // inside the dome, a steel portal: jambs and a lintel that the cut ribs of the lattice land on (blk_palace2 domeRibs)
    var pz0 = PAL.ringIn - 0.35, pw = W + 0.5, pH = BACK.roofY + 0.4;
    [-1, 1].forEach(function (sd) { cb.box(sd > 0 ? W : -pw, -0.02, pz0, sd > 0 ? pw : -W, BACK.roofY, cr0 + 0.3, MT.RIB); });
    cb.box(-pw, BACK.roofY, pz0, pw, pH, PAL.ringOut - 0.75, MT.RIB);
    var Mc = new THREE.Matrix4().makeBasis(new THREE.Vector3(Rt.x, 0, Rt.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-F.x, 0, -F.z)); Mc.setPosition(PAL.c.x, yB, PAL.c.z);
    B.add(cb, Mc);
    // side walls: frames (posts, sill, head) and glass from the dome to the door line
    [-1, 1].forEach(function (sd) {
      var lat = sd * (W + BACK.wall / 2), fb = new Builder();
      [PAL.ringOut + 0.12, (PAL.ringOut + r1) / 2, r1].forEach(function (rr) { fb.box(lat - 0.075, 0, rr - 0.06, lat + 0.075, BACK.roofY, rr + 0.06, MT.ANOD); });
      fb.box(lat - 0.075, 0, PAL.ringOut, lat + 0.075, 0.1, r1, MT.ANOD); fb.box(lat - 0.075, BACK.roofY - 0.12, PAL.ringOut, lat + 0.075, BACK.roofY, r1, MT.ANOD);
      fb.tag(0, 3, null); B.add(fb, Mc);
      BACK_GLASS.surf(4, 1, function (i, j, q) { var rad = -lerp(PAL.ringOut + 0.18, r1 - 0.06, i / 4), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = yB + (j ? BACK.roofY - 0.12 : 0.1); q.p[2] = p.z; q.nn = [Rt.x * sd, 0, Rt.z * sd]; q.f[0] = rad; q.f[1] = q.p[1]; q.f2[0] = j ? BACK.roofY : 0.1; q.f2[1] = 1; q.m = 0; });
    });
    // the door line: side lights beside the sliding doors, a transom above, the frame and a stainless threshold
    var dfr = new Builder(), hD = 2.62;
    dfr.box(-Wo, 0, -0.07, -BACK.doorW - 0.03, 0.1, 0.08, MT.ANOD); dfr.box(BACK.doorW + 0.03, 0, -0.07, Wo, 0.1, 0.08, MT.ANOD);
    [-BACK.doorW - 0.1, BACK.doorW + 0.03].forEach(function (x) { dfr.box(x, 0, -0.07, x + 0.07, BACK.roofY, 0.08, MT.ANOD); });
    dfr.box(-Wo, hD, -0.09, Wo, hD + 0.16, 0.1, MT.ANOD);
    dfr.box(-BACK.doorW - 0.05, -0.03, -0.14, BACK.doorW + 0.05, 0.006, 0.08, MT.STEEL); dfr.tag(0, 3, null);
    var Md = new THREE.Matrix4().makeBasis(new THREE.Vector3(Rt.x, 0, Rt.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-F.x, 0, -F.z)), pd = palXZ(0, -r1);
    Md.setPosition(pd.x, yB, pd.z); B.add(dfr, Md);
    function paneAt(x0, x1, y0, y1) { BACK_GLASS.surf(2, 1, function (i, j, q) { var lat = lerp(x0, x1, i / 2), p = palXZ(lat, -r1); q.p[0] = p.x; q.p[1] = yB + (j ? y1 : y0); q.p[2] = p.z; q.nn = [-F.x, 0, -F.z]; q.f[0] = lat; q.f[1] = q.p[1]; q.f2[0] = j ? y1 : y0; q.f2[1] = 1; q.m = 0; }); }
    paneAt(-W, -BACK.doorW - 0.1, 0.1, BACK.roofY); paneAt(BACK.doorW + 0.1, W, 0.1, BACK.roofY); paneAt(-BACK.doorW, BACK.doorW, hD + 0.16, BACK.roofY);
    // a warm light over the doors for the terrace
    var lo = palXZ(0, -(r1 + 0.3)); extLight(lo.x, yR - 0.1, lo.z, WARMC, 1.6, 8, [-F.x * 0.3, -0.95, -F.z * 0.3], 1.2);
    // the sliding doors, opened by the frame loop like the wings' doors
    var door = { c: { x: pd.x, z: pd.z }, y: yB, dir: { x: Rt.x, z: Rt.z }, open: 0, leaves: [], M: Md.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.12)) };
    [-1, 1].forEach(function (side) {
      var lf = new Builder(), x0 = side < 0 ? -BACK.doorW : 0.0, x1 = side < 0 ? 0.0 : BACK.doorW;
      lf.box(x0, 0, -0.03, x1, 0.09, 0.03, MT.ANOD); lf.box(x0, 2.5, -0.03, x1, 2.58, 0.03, MT.ANOD);
      lf.box(x0, 0.09, -0.03, x0 + 0.06, 2.5, 0.03, MT.ANOD); lf.box(x1 - 0.06, 0.09, -0.03, x1, 2.5, 0.03, MT.ANOD);
      var hx = side < 0 ? x1 - 0.09 : x0 + 0.05; lf.box(hx, 0.95, 0.03, hx + 0.04, 1.3, 0.07, MT.STEEL); lf.box(hx, 0.95, -0.07, hx + 0.04, 1.3, -0.03, MT.STEEL);
      lf.tag(0, 3, null);
      var gl = new Builder();
      gl.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0 + 0.06, x1 - 0.06, i); q.p[1] = lerp(0.09, 2.5, j); q.p[2] = 0; q.nn = [0, 0, -1]; q.f2[0] = lerp(0.09, 2.5, j); q.f2[1] = 2; q.m = 0; });
      door.leaves.push({ side: side, frame: lf, glass: gl });
    });
    DOORS.push(door);
  }
  // the back terrace: basalt paving level with the balcony on a concrete retaining wall, a parapet, a stair at each end
  function backTerrace(B) {
    var yB = PALY.B, t0 = BACK.t0, t1 = BACK.t1, r0 = BACK.tr0, r1 = BACK.tr1, NT = 64; BACK._B = B;
    var sa = BACK.stairW / 2 / BACK.stairR;                                  // half the stair's width as an angle on the side edges
    // paving
    B.surf(NT, 12, function (i, j, q) { var th = lerp(t0, t1, i / NT), r = lerp(r0, r1, j / 12), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yB; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = r * Math.sin(th); q.f[1] = r * Math.cos(th); q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
    function gAt(p) { return cgH(p.x, p.z); }
    // the outer edge: retaining wall down into the ground, a parapet with a coping
    function wallArc(r, th0, th1, top, sgn) {
      var n = Math.max(2, Math.round(Math.abs(th1 - th0) * r / 0.5));
      B.surf(n, 1, function (i, j, q) { var th = lerp(th0, th1, i / n), p = palPol(r, th), g = gAt(p), y = j ? top : Math.min(g, yB) - 0.4, d = palPol(1, th);
        q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [(d.x - PAL.c.x) * sgn, 0, (d.z - PAL.c.z) * sgn]; q.f[0] = th * r; q.f[1] = y; q.f2[0] = y - g; q.m = MT.CONCRETE; });
    }
    // the outer edge is the Crescent's glass front (blk_crescent.js)
    // the two side edges: a retaining wall with a parapet, broken by the stair in the middle
    [[t0, -1], [t1, 1]].forEach(function (e) {
      var th = e[0], sg = e[1], tg = palPol(1, th + sg * Math.PI / 2), tn = [tg.x - PAL.c.x, 0, tg.z - PAL.c.z];  // outward, across the edge
      function radial(ra, rb, off, top, sgn) {
        var n = Math.max(2, Math.round((rb - ra) / 0.5));
        B.surf(n, 1, function (i, j, q) { var r = lerp(ra, rb, i / n), lat = r * Math.sin(th), rad = r * Math.cos(th), p = palXZ(lat + tn[0] * 0 + (PAL.Rt.x * tn[0] + PAL.Rt.z * tn[2]) * off, rad + (PAL.F.x * tn[0] + PAL.F.z * tn[2]) * off), g = gAt(p), y = j ? top : Math.min(g, yB) - 0.4;
          q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [tn[0] * sgn, 0, tn[2] * sgn]; q.f[0] = r; q.f[1] = y; q.f2[0] = y - g; q.m = MT.CONCRETE; });
      }
      [[r0, BACK.stairR - BACK.stairW / 2], [BACK.stairR + BACK.stairW / 2, r1]].forEach(function (rr) {
        radial(rr[0], rr[1], 0.3, yB + BACK.kerb, 1); radial(rr[0], rr[1], 0, yB + BACK.kerb, -1);
        var lo = (PAL.Rt.x * tn[0] + PAL.Rt.z * tn[2]) * 0.15, ro = (PAL.F.x * tn[0] + PAL.F.z * tn[2]) * 0.15;
        guardAlong(function (t) { var r = lerp(rr[0], rr[1], t); return palXZ(r * Math.sin(th) + lo, r * Math.cos(th) + ro); }, rr[1] - rr[0]);
        var n = Math.max(2, Math.round((rr[1] - rr[0]) / 0.5));
        B.surf(n, 1, function (i, j, q) { var r = lerp(rr[0], rr[1], i / n), off = j ? -0.03 : 0.33, p = palXZ(r * Math.sin(th) + (PAL.Rt.x * tn[0] + PAL.Rt.z * tn[2]) * off, r * Math.cos(th) + (PAL.F.x * tn[0] + PAL.F.z * tn[2]) * off);
          q.p[0] = p.x; q.p[1] = yB + BACK.kerb; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = r; q.f[1] = j * 0.36; q.f2[0] = 3; q.m = MT.CONCRETE; });
      });
      // the stair: concrete treads from the terrace down to the ground, cheek walls either side
      function gOut(d) { return gAt(palXZ(BACK.stairR * Math.sin(th) + (PAL.Rt.x * tn[0] + PAL.Rt.z * tn[2]) * d, BACK.stairR * Math.cos(th) + (PAL.F.x * tn[0] + PAL.F.z * tn[2]) * d)); }
      var rise = yB - gOut(1.0), nst = 1;                                       // size the flight to the ground at its foot
      for (var it = 0; it < 3; it++) { nst = Math.max(1, Math.round(rise / 0.165)); rise = yB - gOut(0.3 + nst * 0.32 + 0.2); }
      nst = Math.max(1, Math.round(rise / 0.165)); var hs = rise / nst, st = new Builder();
      for (var k = 0; k < nst; k++) st.box(-BACK.stairW / 2, -rise - 0.4, k * 0.32, BACK.stairW / 2, -k * hs, (k + 1) * 0.32, MT.CONCRETE);
      [-1, 1].forEach(function (cs) { st.box(cs * BACK.stairW / 2 - (cs > 0 ? 0 : 0.25), -rise - 0.4, 0, cs * BACK.stairW / 2 + (cs > 0 ? 0.25 : 0), 0.45, nst * 0.32 + 0.1, MT.CONCRETE); });
      for (var n2 = 0; n2 < st.f.length; n2++) st.f[n2] = 0.45 + 0.07 * st.f[n2] * 0.4;
      var ax = new THREE.Vector3(tn[0], 0, tn[2]).normalize(), along = new THREE.Vector3(-ax.z, 0, ax.x), Ms = new THREE.Matrix4().makeBasis(along, new THREE.Vector3(0, 1, 0), ax);
      var p0 = palXZ(BACK.stairR * Math.sin(th) + (PAL.Rt.x * tn[0] + PAL.Rt.z * tn[2]) * 0.3, BACK.stairR * Math.cos(th) + (PAL.F.x * tn[0] + PAL.F.z * tn[2]) * 0.3);
      Ms.setPosition(p0.x, yB, p0.z); B.add(st, Ms);
      BACK["stair" + (sg > 0 ? "R" : "L")] = { p: p0, ax: ax, along: along, n: nst, hs: hs, run: 0.32 };
    });
    // bollard lights along the Crescent's front
    [-40, -24, -8, 8, 24, 40].forEach(function (deg) {                    // between the Crescent's doors
      var th = Math.PI + deg * D2R, p = palPol(r1 - 1.6, th);
      latheOn(B, p.x, yB - 0.05, p.z, [[0.1, 0], [0.1, 0.9]], 16, MT.ANOD, 0.3);
      latheOn(B, p.x, yB + 0.85, p.z, [[0.112, 0], [0.112, 0.08], [0.09, 0.1], [0.0, 0.105]], 16, MT.ANOD, 0.9);
      B.geo(addF2(new THREE.CylinderGeometry(0.094, 0.094, 0.1, 16, 1, true), 1.4, 0), T(p.x, yB + 0.8, p.z), MT.LIGHT, 1);
      extLight(p.x, yB + 0.8, p.z, WARMC, 1.1, 6);
      COLL.posts.push({ x: p.x, z: p.z, r: 0.35 });
    });
  }
  // a glass guard along a line on the terrace's edge: path(t) gives the point at t in 0..1, len its length (m)
  function guardAlong(path, len) {
    var B = BACK._B, yB = PALY.B, y0 = yB + BACK.kerb, y1 = yB + BACK.guard, n = Math.max(2, Math.round(len / 0.5)), np = Math.max(1, Math.round(len / 1.5));
    BACK_GLASS.surf(n, 1, function (i, j, q) { var p = path(i / n), pa = path(Math.max(0, i / n - 0.01)), pb = path(Math.min(1, i / n + 0.01)), dx = pb.x - pa.x, dz = pb.z - pa.z;
      q.p[0] = p.x; q.p[1] = j ? y1 - 0.05 : y0 + 0.02; q.p[2] = p.z; q.nn = [dz, 0, -dx]; q.f[0] = i / n * len; q.f[1] = q.p[1]; q.f2[0] = j ? 1.0 : 0.05; q.f2[1] = 1; q.m = 0; });
    var rail = []; for (var k = 0; k <= n; k++) { var p = path(k / n); rail.push(new THREE.Vector3(p.x, y1, p.z)); }
    tubeAlong(B, rail, 0.025, 8, MT.STEEL);
    for (k = 0; k <= np; k++) { var pp = path(k / np); tubeAlong(B, [new THREE.Vector3(pp.x, y0, pp.z), new THREE.Vector3(pp.x, y1, pp.z)], 0.02, 6, MT.STEEL); }
  }
  // where you can stand: the vestibule and the terrace at balcony level, the stairs; undefined elsewhere, NaN where blocked
  function backSupport(x, z, yf) {
    if (!PAL.built) return undefined;
    var o = palLoc(x, z, {}), r = o.r, th = Math.atan2(o.lat, o.rad); if (th < 0) th += 2 * Math.PI;
    if (r < PAL.ringIn - 0.4 || r > BACK.tr1 + 4.5) return undefined;
    var yB = PALY.B, alat = Math.abs(o.lat);
    // the vestibule (and the ring's gap): open between the side walls, blocked by them
    if (-o.rad > PAL.ringIn - 0.4 && -o.rad < BACK.r1 + 0.3 && o.rad < 0) {
      if (alat < BACK.w - 0.3) return yB;
      if (alat < BACK.w + BACK.wall + 0.3 && -o.rad > PAL.ringIn - 0.1) return NaN;
    }
    if (r < PAL.ringOut + 0.3) return undefined;                            // the ring itself: the palace decides
    // the stairs
    var st = [BACK.stairL, BACK.stairR];
    for (var i = 0; i < 2; i++) {
      var s = st[i]; if (!s) continue;
      var dx = x - s.p.x, dz = z - s.p.z, a = dx * s.ax.x + dz * s.ax.z, b = dx * s.along.x + dz * s.along.z;
      if (Math.abs(b) < BACK.stairW / 2 - 0.15 && a > -0.35 && a < s.n * s.run + 0.6) { var k = clamp(Math.floor(a / s.run), 0, s.n); return a >= s.n * s.run ? undefined : yB - k * s.hs; }
      if (Math.abs(b) < BACK.stairW / 2 + 0.4 && a > 0 && a < s.n * s.run + 0.1) return NaN;   // the cheek walls
    }
    if (th < BACK.t0 - 0.01 || th > BACK.t1 + 0.01) {                       // just outside a side edge: the wall and parapet
      var dth = th < BACK.t0 ? BACK.t0 - th : th - BACK.t1;
      if (r < BACK.tr1 + 0.4 && dth * r < 0.45) return NaN;
      return undefined;
    }
    if (r < BACK.tr1 - 0.25) { if (yf > yB - 0.6) return yB; return NaN; }   // on the terrace (from below: the wall)
    if (r < BACK.tr1 + 0.5) return NaN;                                       // the parapet on the outer edge
    return undefined;
  }
  function backInside(x, z) { if (!PAL.built) return 0; var o = palLoc(x, z, {}); return (o.rad < -PAL.ringOut && -o.rad < BACK.r1 && Math.abs(o.lat) < BACK.w) ? 1 : 0; }
