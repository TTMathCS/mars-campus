  /* ===================== Phase 2: the palace's back door (T09-04) ===================== */
  // A glass vestibule through the back of the dome at balcony level, its sliding doors opening into the garden ring
  // (blk_gardenring.js), the way to the Ring's hall. Sizes from P2 (campus_rooms.py).
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
  // where you can stand in the vestibule: between its glass sides at balcony level; undefined elsewhere
  function backSupport(x, z, yf) {
    if (!PAL.built) return undefined;
    var o = palLoc(x, z, {}), alat = Math.abs(o.lat);
    if (o.rad >= 0 || -o.rad < PAL.ringIn - 0.4 || -o.rad > BACK.r1 + 0.3 || alat > BACK.w + BACK.wall + 0.3) return undefined;
    if (alat < BACK.w - 0.3) return PALY.B;
    return -o.rad > PAL.ringIn - 0.1 ? NaN : undefined;
  }
  function backInside(x, z) {                                               // the vestibule is inside
    if (!PAL.built) return 0; var o = palLoc(x, z, {});
    return (o.rad < -PAL.ringOut && -o.rad < BACK.r1 && Math.abs(o.lat) < BACK.w) ? 1 : 0;
  }
