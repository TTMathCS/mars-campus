  /* ===================== The pod dock (T04-03), the glass bridge and the docking collar (T17-02) ===================== */
  // Jim, 5 Oct 2026: "the parking is too close to the building. need special parking so that when parked, there is
  // connection so people can go directly into the building". A round deck off the Ring's right side, 1.35 m below the upper
  // floor, on slender columns, a ring of lights round its edge. The glass bridge runs from the pod lounge (T06-21) through
  // a sliding door in the outer glass, over the garden gallery's roof, to the deck's edge. A pod settles side-on onto the
  // docking spot, its canopy toward the bridge and its sill level with the bridge's floor, and the collar runs out over its
  // halo and seals: you walk from the pod through the collar and the bridge into the Ring, never outside (P2.pod_dock).
  // Frame: u along the dock's radius from the palace's centre (u = r on the axis), v across it (+v toward +a).
  var PDK = null;
  function pdkInit() {
    if (PDK || !CRS) return PDK;
    var D = P2.pod_dock, a = D.a * D2R, o = crsPt(1, a), t = crsPt(1, a + Math.PI / 2);
    var O = { x: o.x - PAL.c.x, z: o.z - PAL.c.z }, T = { x: t.x - PAL.c.x, z: t.z - PAL.c.z };
    PDK = { a: a, O: O, T: T, c: crsPt(D.r, a), sp: crsPt(D.spot_r, a), R: D.deck_r, yD: CRS.yU + D.deck_y, yB: CRS.yU, hw: D.w / 2, h: D.h,
            u0: CRS.r1, u1: D.bridge[1] + 0.6, cmax: D.collar, ext: 1, want: 1, hd: Math.atan2(O.z, -O.x), pod: null, cols: [], collar: null, shutter: null };
    return PDK;
  }
  function pdkUV(x, z) { var P = PDK, dx = x - PAL.c.x, dz = z - PAL.c.z; return { u: dx * P.O.x + dz * P.O.z, v: dx * P.T.x + dz * P.T.z }; }
  function pdkAt(u, v) { var P = PDK; return { x: PAL.c.x + P.O.x * u + P.T.x * v, z: PAL.c.z + P.O.z * u + P.T.z * v }; }
  function pdkV3(u, v, y) { var p = pdkAt(u, v); return new THREE.Vector3(p.x, y, p.z); }
  // a flat quad in the (u, v) frame at height y, or upright along u at side v
  function pdkFlat(B, u0, u1, v0, v1, y, mat, f2, up, nu) {
    var n = nu || Math.max(1, Math.ceil((u1 - u0) / 0.6)), m = Math.max(1, Math.ceil((v1 - v0) / 0.6));
    B.surf(n, m, function (i, j, q) { var p = pdkAt(lerp(u0, u1, i / n), lerp(v0, v1, j / m)); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, up ? 1 : -1, 0]; q.f[0] = p.x; q.f[1] = p.z; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  function pdkSide(B, u0, u1, v, y0, y1, s, mat, f2) {
    var P = PDK, n = Math.max(1, Math.ceil((u1 - u0) / 0.6));
    B.surf(n, 1, function (i, j, q) { var p = pdkAt(lerp(u0, u1, i / n), v); q.p[0] = p.x; q.p[1] = j ? y1 : y0; q.p[2] = p.z; q.nn = [P.T.x * s, 0, P.T.z * s]; q.f[0] = lerp(u0, u1, i / n); q.f[1] = q.p[1]; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  function pdkEnd(B, u, v0, v1, y0, y1, s, mat, f2) {
    var P = PDK;
    B.surf(1, 1, function (i, j, q) { var p = pdkAt(u, lerp(v0, v1, i)); q.p[0] = p.x; q.p[1] = j ? y1 : y0; q.p[2] = p.z; q.nn = [P.O.x * s, 0, P.O.z * s]; q.f[0] = lerp(v0, v1, i); q.f[1] = q.p[1]; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
  }
  // the deck, its columns and lights, the docking spot's marks; the bridge with its glass and frames
  function podDockBuild(B) {
    var P = pdkInit(); if (!P) return;
    var c = P.c, R = P.R, yD = P.yD, NA = 64;
    // the deck: dark basalt slabs, a dark metal edge with a lip, its underside
    B.surf(NA, 4, function (i, j, q) { var t = i / NA * 2 * Math.PI, rr = R * j / 4; q.p[0] = c.x + rr * Math.cos(t); q.p[1] = yD; q.p[2] = c.z + rr * Math.sin(t); q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = q.p[2]; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
    B.orient(B.count() - (NA + 1) * 5, function () { return [0, 1, 0]; });
    latheOn(B, c.x, yD - 0.5, c.z, [[R - 0.25, 0.0], [R, 0.0], [R, 0.62], [R - 0.12, 0.62], [R - 0.12, 0.5]], NA, MT.ANOD, 0);
    B.surf(NA, 2, function (i, j, q) { var t = i / NA * 2 * Math.PI, rr = (R - 0.25) * j / 2; q.p[0] = c.x + rr * Math.cos(t); q.p[1] = yD - 0.5; q.p[2] = c.z + rr * Math.sin(t); q.nn = [0, -1, 0]; q.f[0] = q.p[0]; q.f[1] = q.p[2]; q.f2[0] = 4; q.m = MT.SHELL; });
    // the ring of lights in the deck, a little in from the edge
    for (var k = 0; k < 40; k++) { var t = k / 40 * 2 * Math.PI, lx = c.x + (R - 0.55) * Math.cos(t), lz = c.z + (R - 0.55) * Math.sin(t); B.geo(addF2(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), 2.2, 0), T(lx, yD + 0.01, lz), MT.LIGHT, 1); }
    for (var k2 = 0; k2 < 6; k2++) { var t2 = (k2 + 0.5) / 6 * 2 * Math.PI; extLight(c.x + (R - 0.55) * Math.cos(t2), yD + 0.25, c.z + (R - 0.55) * Math.sin(t2), WARMC, 0.35, 3.5); }
    // the docking spot: the halo's outline painted on the slabs, and a line from the bridge to the spot's middle
    var HL = P2.pod.halo, s0 = pdkUV(P.sp.x, P.sp.z).u;
    B.surf(72, 1, function (i, j, q) { var t = i / 72 * 2 * Math.PI, k3 = j ? 1.1 : 1.06, p = pdkAt(s0 + HL.rz * k3 * Math.sin(t), HL.rx * k3 * Math.cos(t)); q.p[0] = p.x; q.p[1] = yD + 0.004; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f2[0] = 4; q.m = MT.PLASTIC; });
    for (var d = 0; d < 6; d++) { var ua = P.u1 + 0.2 + d * 0.32; if (ua + 0.18 > s0) break; pdkFlat(B, ua, ua + 0.18, -0.05, 0.05, yD + 0.004, MT.PLASTIC, [4, 0], true, 1); }
    // slender columns down to the ground, on concrete footings
    var cols = [[0, 0]]; for (var k4 = 0; k4 < 6; k4++) cols.push([4.3 * Math.cos(k4 / 6 * 2 * Math.PI + 0.3), 4.3 * Math.sin(k4 / 6 * 2 * Math.PI + 0.3)]);
    cols.forEach(function (cc) {
      var x = c.x + cc[0], z = c.z + cc[1], g = groundAt(x, z, yD - 4);
      tubeAlong(B, [new THREE.Vector3(x, g - 0.3, z), new THREE.Vector3(x, yD - 0.5, z)], 0.13, 12, MT.SHELL);
      latheOn(B, x, g - 0.4, z, [[0.45, 0.0], [0.45, 0.45], [0.0, 0.45]], 16, MT.CONCRETE, 0.5);
      P.cols.push({ x: x, z: z, g: g });
    });
    // the bridge: a terrazzo floor on a slab, glass sides and roof on dark steel frames every 1.5 m, a light strip inside
    var u0 = P.u0 + 0.06, u1 = P.u1, hw = P.hw, yB = P.yB, h = P.h;
    pdkFlat(B, u0, u1, -hw, hw, yB, MT.TERRAZZO, [0, 0], true);
    pdkFlat(B, u0, u1, -hw - 0.08, hw + 0.08, yB - 0.32, MT.SHELL, [4, 0], false);
    [-1, 1].forEach(function (s) { pdkSide(B, u0, u1, s * (hw + 0.08), yB - 0.32, yB + 0.06, s, MT.ANOD, [0, 0]); });
    pdkEnd(B, u1, -hw - 0.08, hw + 0.08, yB - 0.32, yB + 0.06, 1, MT.ANOD, [0, 0]);
    [-1, 1].forEach(function (s) {
      CRS_GLASS.surf(Math.max(2, Math.ceil((u1 - u0) / 1.5)), 1, function (i, j, q) { var p = pdkAt(lerp(u0, u1, i / Math.max(2, Math.ceil((u1 - u0) / 1.5))), s * hw); q.p[0] = p.x; q.p[1] = j ? yB + h : yB + 0.06; q.p[2] = p.z; q.nn = [P.T.x * s, 0, P.T.z * s]; q.f[0] = 0; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - yB; q.f2[1] = 4; q.m = 0; });
    });
    CRS_GLASS.surf(Math.max(2, Math.ceil((u1 - u0) / 1.5)), 1, function (i, j, q) { var p = pdkAt(lerp(u0, u1, i / Math.max(2, Math.ceil((u1 - u0) / 1.5))), j ? hw : -hw); q.p[0] = p.x; q.p[1] = yB + h + 0.02; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = 0; q.f[1] = 0; q.f2[0] = h; q.f2[1] = 4; q.m = 0; });
    var nf = Math.max(2, Math.round((u1 - u0) / 1.5));
    for (var f = 0; f <= nf; f++) { var uf = lerp(u0 + 0.04, u1 - 0.04, f / nf);
      [-1, 1].forEach(function (s) { tubeAlong(B, [pdkV3(uf, s * (hw + 0.03), yB), pdkV3(uf, s * (hw + 0.03), yB + h + 0.04)], 0.035, 8, MT.RIB); });
      tubeAlong(B, [pdkV3(uf, -hw - 0.03, yB + h + 0.05), pdkV3(uf, hw + 0.03, yB + h + 0.05)], 0.035, 8, MT.RIB); }
    [[-1, yB + 0.07], [1, yB + 0.07], [-1, yB + h + 0.05], [1, yB + h + 0.05]].forEach(function (e) { tubeAlong(B, [pdkV3(u0, e[0] * (hw + 0.03), e[1]), pdkV3(u1, e[0] * (hw + 0.03), e[1])], 0.04, 8, MT.RIB); });
    // the heavier frame at the deck's end, where the collar is fixed
    var bx = new Builder(), Me = new THREE.Matrix4().makeBasis(new THREE.Vector3(P.T.x, 0, P.T.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(P.O.x, 0, P.O.z)).setPosition(pdkV3(u1, 0, yB));
    bx.box(-hw - 0.14, -0.34, -0.08, -hw, h + 0.16, 0.06, MT.ANOD); bx.box(hw, -0.34, -0.08, hw + 0.14, h + 0.16, 0.06, MT.ANOD); bx.box(-hw - 0.14, h, -0.08, hw + 0.14, h + 0.2, 0.06, MT.ANOD);
    B.add(bx, Me);
    pdkFlat(B, u0 + 0.3, u1 - 0.3, -0.06, 0.06, yB + h - 0.02, MT.LIGHT, [1.6, 0], false, 1);
    [0.25, 0.6, 0.92].forEach(function (k5) { var p = pdkAt(lerp(u0, u1, k5), 0); extLight(p.x, yB + h - 0.25, p.z, LAMPC, 1.1, 5, [0, -1, 0], 1); });
  }
  // the collar: dark bellows on steel frames from the bridge's end to the pod's canopy, folding up as it runs back in;
  // built where it stands run out, then squeezed along the dock's radius about its root (pdkCollarSet)
  function podDockCollar() {
    var P = PDK; if (!P || P.collar) return;
    var hw = P.hw, h = P.h, u1 = P.u1, L = P.cmax, yB = P.yB, N = 7, cb = new Builder(), sb = new Builder(); cb.zone = ZONE.OUT; sb.zone = ZONE.OUT;
    var M = new THREE.Matrix4().makeBasis(new THREE.Vector3(P.T.x, 0, P.T.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(P.O.x, 0, P.O.z)).setPosition(pdkV3(u1, 0, yB));
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
    pdkCollarSet();
  }
  // squeeze the collar along the dock's radius about its root: s = 1 run out, small run in
  function pdkCollarSet() {
    var P = PDK; if (!P || !P.collar) return;
    var s = Math.max(0.08, P.ext), n = new THREE.Vector3(P.O.x, 0, P.O.z), root = pdkV3(P.u1, 0, P.yB);
    var S = new THREE.Matrix4().set(1 + (s - 1) * n.x * n.x, 0, (s - 1) * n.x * n.z, 0, 0, 1, 0, 0, (s - 1) * n.z * n.x, 0, 1 + (s - 1) * n.z * n.z, 0, 0, 0, 0, 1);
    var t = root.clone().sub(root.clone().applyMatrix4(S)); S.setPosition(t.x, t.y, t.z);
    [P.collar, P.shutter].forEach(function (m) { m.matrix.copy(S); m.matrixWorldNeedsUpdate = true; });
    P.shutter.visible = P.ext < 0.97;
  }
  function pdkUpdate(dt) {
    var P = PDK; if (!P || !P.collar) return;
    var e = P.ext + clamp(P.want - P.ext, -dt * 0.9, dt * 0.9);
    if (Math.abs(e - P.ext) > 1e-4) { P.ext = e; pdkCollarSet(); }
  }
  // where you walk: the bridge's floor from the door in the Ring's outer glass to its end, and on into the collar when it
  // is run out to a pod; its glass sides; the collar's mouth (the pod) or the closed end beyond
  function podDockSupport(x, z, yf) {
    var P = PDK; if (!P || yf === undefined || yf < P.yB - 1.0) return undefined;
    var q = pdkUV(x, z), u = q.u, v = q.v, end = P.u1 + P.cmax * (P.ext > 0.97 ? 1 : 0);
    if (u < P.u0 - 0.3 || u > end + 0.6 || Math.abs(v) > P.hw + 0.45) return undefined;
    if (Math.abs(v) > P.hw - 0.18) return u > P.u0 + 0.15 ? NaN : undefined;
    if (u > end - 0.2) return NaN;
    return P.yB;
  }
  // the deck stands just clear of the ground on its legs: from the ground you walk round it
  function podDockBlocked(x, z, yf) {
    var P = PDK; if (!P || yf > P.yD - 0.5) return false;
    return Math.hypot(x - P.c.x, z - P.c.z) < P.R + 0.3;
  }
  // for the pod: the deck is the ground it floats over; the bridge and the collar are no place to fly through
  function podDockGround(x, z) { var P = PDK; if (!P) return undefined; return Math.hypot(x - P.c.x, z - P.c.z) < P.R ? P.yD : undefined; }
  function podDockTop(x, z) {
    var P = PDK; if (!P) return -1e9;
    var q = pdkUV(x, z); return q.u > P.u0 - 0.5 && q.u < P.u1 + P.cmax * P.ext + 0.4 && Math.abs(q.v) < P.hw + 0.5 ? P.yB + P.h + 0.5 : -1e9;
  }
