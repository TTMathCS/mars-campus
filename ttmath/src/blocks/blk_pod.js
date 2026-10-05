  /* ===================== The flying pods (T04-03): board one and fly over the campus ===================== */
  // Jim, 5 Oct 2026: "add some flying pod I can take and can drive the flying pod to see the eagle view". A two-seat craft
  // about 6 m long (P2.pod): a teardrop cabin in white composite under a tinted glass canopy, four ducted rotors on short
  // arms (Mars's thin air needs big blades), skids, navigation lights. One waits at the pod stop by the entrance (P2
  // courtyard.podstop). Walk up to it and board (F, or BOARD); fly where you look with the walking keys or the joystick,
  // Space and Shift (or the arrows on screen) to climb and descend, V for the view from behind; F (LAND) sets it down on
  // open, level ground and you step out beside it. The pod stays where you leave it.
  var POD = { list: [], cur: null, flying: false, view: 0, landing: false, near: null, up: false, down: false, eye: new THREE.Vector3() };
  var POD_GEO = null;
  // ---- the craft, in its own frame: x to the left as you sit (the pod is turned half round onto the walker's yaw), y up, z forward
  // (the nose at +z), the skids on y = 0; the pilot sits on the right (-x), as in a helicopter, and gets in and out on that side ----
  function podGeometries() {
    if (POD_GEO) return POD_GEO;
    var P = P2.pod, L = P.length / 2, b = new Builder(), gl = new Builder(), ck = new Builder();
    function sec(t) { return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.72))), 0.62); }   // the section's size along the cabin: 0 at both ends
    function cabin(u, t) { var s = sec(t), cu = Math.cos(u), su = Math.sin(u); return [1.08 * s * cu, 1.34 + 0.1 * t + (su > 0 ? 0.9 : 0.6) * s * su, lerp(-L, L, t)]; }
    // a bubble canopy over the front, down past the waist on both sides, so you can look down from the seat
    var U0 = -0.38, U1 = Math.PI + 0.38, T0 = 0.42, T1 = 0.975, NU = 48, NV = 40;
    function shell(B, u0, u1, t0, t1, nu, nv, inset, mat, g2) {
      var n0 = B.count(), sgn = inset ? -1 : 1;
      B.surf(nu, nv, function (i, j, q) { var u = lerp(u0, u1, i / nu), t = lerp(t0, t1, j / nv), p = cabin(u, t), k = 1 - inset; q.p[0] = p[0] * k; q.p[1] = 1.38 + (p[1] - 1.38) * k; q.p[2] = p[2] * (1 - inset * 0.3); q.f[0] = p[2] * 1.2; q.f[1] = u * 0.9; q.f2[0] = g2 || 0; q.m = mat; });
      B.orient(n0, function (x, y, z) { return [sgn * x, sgn * (y - 1.4), sgn * z * 0.15]; });
    }
    // the white composite: the tail half, the nose's tip, the belly under the canopy round chin windows at your feet (as
    // in a sightseeing helicopter, to look straight down); a dark lining inside them
    var C0u = 1.5 * Math.PI - 0.72, C1u = 1.5 * Math.PI + 0.72, CT0 = lerp(T0, T1, 10 / NV), CT1 = lerp(T0, T1, 35 / NV);
    shell(b, 0, 2 * Math.PI, 0, T0, NU, 16, 0, MT.COMPOSITE); shell(b, 0, 2 * Math.PI, T1, 1, NU, 3, 0, MT.COMPOSITE); shell(b, 0, 2 * Math.PI, 0.08, T0, NU, 12, 0.03, MT.FABRIC, 0);
    [[U1, C0u, T0, T1, 3, NV], [C1u, 2 * Math.PI + U0, T0, T1, 3, NV], [C0u, C1u, T0, CT0, 9, 10], [C0u, C1u, CT1, T1, 9, 5]].forEach(function (e) {
      shell(b, e[0], e[1], e[2], e[3], e[4], e[5], 0, MT.COMPOSITE); shell(b, e[0], e[1], e[2], e[3], e[4], e[5], 0.03, MT.FABRIC, 0);
    });
    // the canopy's glass and the chin windows, and their dark frames
    gl.surf(30, 26, function (i, j, q) { var u = lerp(U0, U1, i / 30), t = lerp(T0, T1, j / 26), p = cabin(u, t); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = p[2]; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    gl.surf(9, 25, function (i, j, q) { var u = lerp(C0u, C1u, i / 9), t = lerp(CT0, CT1, j / 25), p = cabin(u, t); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = p[2]; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    gl.orient(0, function (x, y, z) { return [x, y - 1.4, z * 0.15]; });
    function rim(u0, u1, t0, t1, n) { var pts = []; for (var k = 0; k <= n; k++) { var p = cabin(lerp(u0, u1, k / n), lerp(t0, t1, k / n)); pts.push(new THREE.Vector3(p[0] * 1.006, 1.38 + (p[1] - 1.38) * 1.006, p[2])); } tubeAlong(b, pts, 0.03, 6, MT.ANOD); }
    rim(U0, U0, T0, T1, 14); rim(U1, U1, T0, T1, 14); rim(U0, U1, T0, T0, 24); rim(U0, U1, T1, T1, 16);
    rim(C0u, C0u, CT0, CT1, 12); rim(C1u, C1u, CT0, CT1, 12); rim(C0u, C1u, CT0, CT0, 8); rim(C0u, C1u, CT1, CT1, 8);
    b.box(-0.98, 0.42, -0.4, -0.62, 0.46, 0.4, MT.STEEL);                                                                                        // a step under the canopy's hinge side
    // four ducts on arms: an airfoil ring, a motor pod on three spokes
    P.rotors.forEach(function (rc) {
      var x = rc[0], z = rc[1], y = 1.55, R = P.rotor_r;
      latheOn(b, x, y - 0.24, z, [[R + 0.14, 0.0], [R + 0.19, 0.12], [R + 0.17, 0.32], [R + 0.08, 0.46], [R + 0.01, 0.42], [R - 0.01, 0.2], [R + 0.02, 0.02], [R + 0.14, 0.0]], 40, MT.COMPOSITE, 0.3);
      latheOn(b, x, y - 0.2, z, [[0.0, 0.0], [0.16, 0.02], [0.18, 0.2], [0.13, 0.36], [0.0, 0.4]], 16, MT.ANOD, 0.5);
      for (var k = 0; k < 3; k++) { var a = k / 3 * 2 * Math.PI + 0.5; tubeAlong(b, [new THREE.Vector3(x + 0.16 * Math.cos(a), y - 0.05, z + 0.16 * Math.sin(a)), new THREE.Vector3(x + (R + 0.05) * Math.cos(a), y - 0.05, z + (R + 0.05) * Math.sin(a))], 0.025, 5, MT.ANOD); }
      var sx = Math.sign(x), x0 = sx * 0.85, y0 = 1.3 + 0.05 * Math.sign(z);
      [[y0 + 0.1, 0.065], [y0 - 0.15, 0.05]].forEach(function (e) { tubeAlong(b, [new THREE.Vector3(x0, e[0], z * 0.7), new THREE.Vector3(x - sx * (R + 0.1), y - 0.02, z)], e[1], 12, MT.COMPOSITE); });
    });
    // skids on struts
    [-1, 1].forEach(function (sx) {
      var pts = [new THREE.Vector3(sx * 0.95, 0.32, -2.15), new THREE.Vector3(sx * 0.95, 0.06, -1.8)]; for (var k = 0; k <= 8; k++) pts.push(new THREE.Vector3(sx * 0.95, 0.05, lerp(-1.6, 1.7, k / 8)));
      pts.push(new THREE.Vector3(sx * 0.95, 0.12, 2.05), new THREE.Vector3(sx * 0.95, 0.38, 2.3)); tubeAlong(b, pts, 0.045, 8, MT.ANOD);
      [-1.1, 1.2].forEach(function (z) { tubeAlong(b, [new THREE.Vector3(sx * 0.95, 0.06, z), new THREE.Vector3(sx * 0.62, 0.78, z * 0.92)], 0.04, 6, MT.ANOD); });
    });
    // lights: brighter on the left duct, dimmer on the right, white at the tail; landing lights under the nose's tip, ahead of the chin windows
    [[-P.rotors[0][0] - P.rotor_r - 0.2, 1.5, P.rotors[0][1], 3.4], [P.rotors[0][0] + P.rotor_r + 0.2, 1.5, P.rotors[0][1], 1.2], [0, 1.55, -L + 0.08, 1.8]].forEach(function (l) { b.geo(addF2(new THREE.SphereGeometry(0.05, 10, 8), l[3], 0), T(l[0], l[1], l[2]), MT.LIGHT, 1); });
    [-0.13, 0.13].forEach(function (x) { b.geo(addF2(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), 1.8, 0), T(x, 1.225, 2.52, 0.5, 0, 0), MT.LIGHT, 1); });
    // what you see in the cockpit: the dashboard with its screens, the canopy's frame, the seat's edge
    ck.box(-0.62, 1.12, 1.02, 0.62, 1.34, 1.38, MT.ANOD); ck.box(-0.6, 1.34, 1.06, 0.6, 1.37, 1.3, MT.FABRIC); ck.tag(ck.count() - 24, 0, null);
    [["podPfd", -0.34], ["podMap", 0.0], ["podSys", 0.34]].forEach(function (e) {                                                              // three displays facing the seats
      var x = e[1], uv = ATL[e[0]]; ck.box(x - 0.165, 1.125, 1.006, x + 0.165, 1.335, 1.02, MT.ANOD);
      quadB(ck, new THREE.Vector3(x + 0.15, 1.14, 1.003), new THREE.Vector3(x - 0.15, 1.14, 1.003), new THREE.Vector3(x - 0.15, 1.32, 1.003), new THREE.Vector3(x + 0.15, 1.32, 1.003), [0, 0, -1], MT.SCREEN,
        [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]], [1.0, 0]);
    });
    ck.box(-0.78, 0.9, -0.9, 0.78, 0.94, 0.42, MT.RUBBER);                                                                                      // the floor, up to the chin windows
    // a hoop behind your head
    var arc = []; for (var k2 = 0; k2 <= 16; k2++) { var p2 = cabin(Math.PI * (0.1 + 0.8 * k2 / 16), 0.47); arc.push(new THREE.Vector3(p2[0] * 0.97, 1.34 + (p2[1] - 1.34) * 0.97, p2[2])); } tubeAlong(ck, arc, 0.03, 6, MT.ANOD);
    var rb = new Builder();                                                  // one rotor: three blades and a spinner
    for (var k3 = 0; k3 < 3; k3++) { var a3 = k3 / 3 * 2 * Math.PI, cb = Math.cos(a3), sb = Math.sin(a3), nb = rb.count(); rb.box(0.12, -0.012, -0.09, P.rotor_r - 0.04, 0.012, 0.09, MT.ANOD);
      for (var v = nb; v < rb.count(); v++) { var X = rb.p[v * 3], Z = rb.p[v * 3 + 2], Y = rb.p[v * 3 + 1] + Z * 0.12 * (1 - X / P.rotor_r); rb.p[v * 3] = X * cb - Z * sb; rb.p[v * 3 + 2] = X * sb + Z * cb; rb.p[v * 3 + 1] = Y; var NX = rb.n[v * 3], NZ = rb.n[v * 3 + 2]; rb.n[v * 3] = NX * cb - NZ * sb; rb.n[v * 3 + 2] = NX * sb + NZ * cb; } }
    latheOn(rb, 0, -0.04, 0, [[0.0, 0.0], [0.13, 0.0], [0.12, 0.08], [0.0, 0.14]], 14, MT.COMPOSITE, 0.3);
    function out(B) { var g = B.build(), n = g.attributes.position.count; g.attributes.aAO.array.fill(1); g.attributes.aSky.array.fill(1); return g; }
    POD_GEO = { body: out(b), glass: out(gl), cockpit: out(ck), rotor: out(rb) };
    return POD_GEO;
  }
  // a pod standing at (x, z) on the ground, its nose along the walker's yaw convention h (forward = (-sin h, -cos h))
  function podMake(x, z, h) {
    var G = podGeometries(), grp = new THREE.Group(), P = P2.pod;
    var body = new THREE.Mesh(G.body, matMat); body.frustumCulled = false; grp.add(body);
    var glass = [THREE.BackSide, THREE.FrontSide].map(function (side, i) { var m = new THREE.Mesh(G.glass, glassMat(side)); m.renderOrder = 14 + i; m.frustumCulled = false; grp.add(m); return m; });
    var ck = new THREE.Mesh(G.cockpit, matMat); ck.visible = false; ck.frustumCulled = false; grp.add(ck);
    var rotors = P.rotors.map(function (rc) { var m = new THREE.Mesh(G.rotor, matMat); m.position.set(rc[0], 1.6, rc[1]); m.frustumCulled = false; grp.add(m); return m; });
    scene.add(grp);
    var blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), podBlobMat()); blob.rotation.x = -Math.PI / 2; blob.renderOrder = 2; blob.frustumCulled = false; scene.add(blob);
    var g0 = podGround(x, z), pod = { grp: grp, ck: ck, rotors: rotors, blob: blob, x: x, z: z, y: g0, h: h, vx: 0, vz: 0, vy: 0, bank: 0, tilt: 0, spin: 0, rpm: 0 };
    podPose(pod); POD.list.push(pod); return pod;
  }
  function podPose(p, gnd) {
    p.grp.position.set(p.x, p.y, p.z); p.grp.rotation.order = "YXZ"; p.grp.rotation.set(p.tilt, p.h + Math.PI, p.bank);
    p.rotors.forEach(function (m, i) { m.rotation.y = p.spin * (i % 2 ? 1 : -1) + i; });
    // a soft shadow on the ground under it, fading and spreading as it climbs
    var g = gnd === undefined ? p.y : Math.max(gnd, Math.min(p.y, gnd + 0.15)), alt = Math.max(0, p.y - g), s = 7.4 + alt * 0.12;
    p.blob.position.set(p.x, g + 0.04, p.z); p.blob.scale.set(s, s * 0.95, 1); p.blob.rotation.z = p.h; p.blob.material.opacity = 0.55 * Math.max(0, 1 - alt / 45);
  }
  var POD_BLOB = null;
  function podBlobMat() {                                                    // a radial gradient, dark in the middle
    if (!POD_BLOB) { var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
      gr.addColorStop(0, "rgba(0,0,0,0.85)"); gr.addColorStop(0.45, "rgba(0,0,0,0.5)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); POD_BLOB = new THREE.CanvasTexture(c); }
    return new THREE.MeshBasicMaterial({ map: POD_BLOB, transparent: true, depthWrite: false, opacity: 0.55 });
  }
  // the pod stop by the airlock: a level concrete pad cut into the slope (the ground falls about 13 % across it), with a kerb
  // that holds the ground back on the uphill side and runs flush round the rest, a dark landing surface, a painted ring and
  // lights; built into the campus and baked with it. The ground is cut away under the pad; you stand on the pad and its kerb
  // (podStopSupport), and the pod lands on it.
  function podStop(B) {
    var S = P2.courtyard.podstop, c = palXZ(S.lat, S.rad), R = S.r, L = groundAt(c.x, c.z, 0) + 0.06, RK = R + 0.12, RW = R + 0.35, NA = 96, KT = [];
    p2Sector(S.lat, S.rad, 0, RK, -4, 4); p2CutApply();
    for (var i = 0; i <= NA; i++) { var a0 = i / NA * 2 * Math.PI; KT.push(Math.max(L + 0.02, groundAt(c.x + (RW + 0.15) * Math.cos(a0), c.z + (RW + 0.15) * Math.sin(a0), L) + 0.06)); }
    POD.stop = { x: c.x, z: c.z, y: L, rk: RK, rw: RW, kt: KT };
    latheOn(B, c.x, L - 1.2, c.z, [[RK, 0.0], [RK, 1.17], [R + 0.08, 1.2], [0.0, 1.2]], 48, MT.CONCRETE, 0.5);
    function kerb(r0, r1, y0, y1, up) {                              // one face of the kerb all the way round: y0, y1 are functions of the step
      B.surf(NA, 1, function (i, j, q) { var a = i / NA * 2 * Math.PI, cs = Math.cos(a), sn = Math.sin(a), r = j ? r1 : r0; q.p[0] = c.x + r * cs; q.p[1] = j ? y1(i) : y0(i); q.p[2] = c.z + r * sn;
        q.nn = up ? [0, 1, 0] : [(r0 < RW ? -1 : 1) * cs, 0, (r0 < RW ? -1 : 1) * sn]; q.f[0] = a * r; q.f[1] = q.p[1]; q.f2[0] = 0.5; q.m = MT.CONCRETE; });
    }
    function top(i) { return KT[i]; }
    kerb(RK, RK, function () { return L - 0.03; }, top, false);       // its face to the pad
    kerb(RK, RW, top, top, true);                                      // its top
    kerb(RW, RW, function () { return L - 1.0; }, top, false);        // its back, down into the ground
    B.geo(addF2(new THREE.CylinderGeometry(R - 0.2, R - 0.2, 0.006, 48), 0, 4), T(c.x, L + 0.003, c.z), MT.ANOD, 1);                    // the landing surface
    latheOn(B, c.x, L + 0.0065, c.z, [[R - 0.55, 0.0], [R - 0.35, 0.0], [R - 0.35, 0.002], [R - 0.55, 0.002]], 48, MT.PLASTIC, 4);      // the painted ring
    for (var k = 0; k < 16; k++) { var a = k / 16 * 2 * Math.PI, p = { x: c.x + (R - 0.08) * Math.cos(a), z: c.z + (R - 0.08) * Math.sin(a) };
      B.geo(addF2(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10), 2.2, 0), T(p.x, L + 0.015, p.z), MT.LIGHT, 1); }
    extLight(c.x, L + 2.4, c.z, WARMC, 1.2, 9, [0, -1, 0], 1);
  }
  function podStopSupport(x, z) {                                       // the height you stand at on the pad and its kerb
    var S = POD.stop; if (!S) return undefined;
    var dx = x - S.x, dz = z - S.z, d = Math.hypot(dx, dz); if (d >= S.rw) return undefined;
    if (d < S.rk) return S.y + 0.006;
    var a = Math.atan2(dz, dx); if (a < 0) a += 2 * Math.PI; var f = a / (2 * Math.PI) * (S.kt.length - 1), i = Math.floor(f);
    return lerp(S.kt[i], S.kt[Math.min(i + 1, S.kt.length - 1)], f - i);
  }
  function podGround(x, z, y) { var s = podStopSupport(x, z); return s !== undefined ? s : groundAt(x, z, y === undefined ? 0 : y); }   // the ground under the pod
  function podInit() {
    var S = P2.courtyard.podstop, c = palXZ(S.lat, S.rad), h = Math.atan2(PAL.F.x, PAL.F.z) + S.heading * D2R;   // the nose toward the gateway
    var p = podMake(c.x, c.z, h); p.y = POD.stop ? POD.stop.y : p.y; podPose(p);
  }

  // ---- how high the pod must stay: the ground, or the roof of whatever stands there ----
  function podFloor(x, z) {
    var g = podGround(x, z), top = g;
    var o = palLoc(x, z, {}), r = o.r, yB = PALY.B;
    if (r < PAL.ringOut + 0.5) top = Math.max(top, yB + PAL.beam + (PAL.H - PAL.beam) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(r, PAL.R) / PAL.R, 2))) + 0.6);
    if (o.rad > 22 && o.rad < PAL.vFront + 1.5 && Math.abs(o.lat) < 7) top = Math.max(top, yB + 8);   // the front vault and its door
    if (o.rad > 31 && o.rad < 80 && Math.abs(o.lat) < 20.5) top = Math.max(top, yB + 7.8);             // the wings, the courtyard, the gateway
    if (o.rad < 0 && WGD && r > PAL.ringOut && r < BACK.tr1 + 0.5) top = Math.max(top, (r < WGD.rOut ? wgY(Math.max(r, WGD.rIn)) : yB + 6.5) + 0.5);
    if (CRS && o.rad < -20 && r > CRS.r0 - 1.5 && r < CRS.gal.r1 + 0.5 && Math.abs(Math.atan2(o.lat, -o.rad)) < CRS.a1 + 0.05) top = Math.max(top, CRS.yU + CRS.roofY + CRS.roofRise + 0.6);
    var SC = P2.suncourt; if (Math.abs(o.lat - SC.lat) < SC.w / 2 + 1 && Math.abs(o.rad - SC.rad) < SC.d / 2 + 1) top = Math.max(top, SC.crown + 0.5);
    COLL.rovers.forEach(function (rv) { if (Math.hypot(x - rv.x, z - rv.z) < 4.5) top = Math.max(top, g + 3.4); });
    return top;
  }
  function podCanLand(x, z) {
    var g = podGround(x, z); if (podFloor(x, z) > g + 0.3) return false;
    for (var k = 0; k < 8; k++) { var a = k / 8 * 2 * Math.PI; if (Math.abs(podGround(x + 3.2 * Math.cos(a), z + 3.2 * Math.sin(a), g) - g) > P2.pod.land_slope * 3.2) return false; }
    return true;
  }

  // ---- boarding, flying, landing ----
  function podAction() {
    if (POD.flying) { podLand(); return; }
    if (POD.near) podBoard(POD.near);
  }
  function podBoard(p) {
    POD.cur = p; POD.flying = true; POD.landing = false; POD.view = 0; p.vx = p.vz = 0; p.vy = 2.5; p.ck.visible = true;
    yaw = p.h; pitch = -4 * D2R; setAuto(false); tween = null;
    podHud();
  }
  function podLand() {
    var p = POD.cur; if (!p || POD.landing) return;
    if (p.y - podGround(p.x, p.z) > 80 || !podCanLand(p.x, p.z)) { showToast("Pod", "No room to land here", "Find open, level ground or a pad, below 80 m.", 3200); return; }
    POD.landing = true;
  }
  function podExit() {
    var p = POD.cur; POD.flying = false; POD.landing = false; POD.cur = null; p.ck.visible = false; p.vx = p.vz = p.vy = 0;
    var ex = p.x + Math.cos(p.h) * 4.6, ez = p.z - Math.sin(p.h) * 4.6;     // step out on the right, by the canopy's step, clear of the rotors
    var ps = campusSupport(ex, ez, p.y); px = ex; pz = ez; ground = ps === undefined || ps !== ps ? groundAt(ex, ez, p.y) : ps; py = ground + EYE; vx = vz = vy = 0; onGround = true;
    yaw = Math.atan2(-(p.x - ex), -(p.z - ez)) + 0.6; pitch = -6 * D2R;
    camera.near = 0.1; camera.updateProjectionMatrix();
    podHud();
  }
  function podUpdate(dt, now) {
    var p = POD.cur, P = P2.pod;
    if (tween) { var tw = Math.min(1, (now - tween.t0) / tween.dur), kk = tw * tw * (3 - 2 * tw); yaw = tween.y0 + (tween.y1 - tween.y0) * kk; pitch = tween.p0 + (tween.p1 - tween.p0) * kk; if (tw >= 1) tween = null; }
    var turn = (keys["arrowleft"] || keys["q"] || held === "left" ? 1 : 0) - (keys["arrowright"] || keys["e"] || held === "right" ? 1 : 0);
    var tilt = (keys["arrowup"] || held === "up" ? 1 : 0) - (keys["arrowdown"] || held === "down" ? 1 : 0);
    yaw += turn * dt * 1.0; pitch += tilt * dt * 0.7; clampPitch();
    var fwd = (keys["w"] || walkHeld ? 1 : 0) - (keys["s"] ? 1 : 0), side = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0), jm = 1;
    if (joyActive) { jm = Math.min(1, Math.hypot(joyX, joyY)); if (jm > 0.12) { fwd = -joyY / jm; side = joyX / jm; } else { fwd = side = 0; } }
    var climb = (keys[" "] || POD.up ? 1 : 0) - (keys["shift"] || POD.down ? 1 : 0);
    var gnd = podGround(p.x, p.z, p.y), alt = p.y - gnd, vmax = clamp(9 + alt * 0.2, 9, P.top_speed);
    var tx = 0, tz = 0;
    if (!POD.landing && (fwd || side)) { var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), len = Math.hypot(fwd, side); tx = (fx * fwd + rx * side) / len * vmax * Math.min(1, jm); tz = (fz * fwd + rz * side) / len * vmax * Math.min(1, jm); }
    var vyT = POD.landing ? -clamp(alt * 0.6, 0.6, 4.0) : climb * P.climb;
    p.vx += (tx - p.vx) * Math.min(1, dt * 0.9); p.vz += (tz - p.vz) * Math.min(1, dt * 0.9); p.vy += (vyT - p.vy) * Math.min(1, dt * 2.2);
    var nx = p.x + p.vx * dt, nz = p.z + p.vz * dt, ny = p.y + p.vy * dt, rr = Math.hypot(nx, nz);
    if (rr > MAXR) { nx *= MAXR / rr; nz *= MAXR / rr; }
    var flHere = podFloor(p.x, p.z), fl = podFloor(nx, nz);
    if (!POD.landing) {
      if (fl > flHere + 0.8 && fl + 0.5 > p.y) { nx = p.x; nz = p.z; p.vx *= 0.2; p.vz *= 0.2; fl = flHere; }   // a wall or a roof's edge ahead: stop short
      if (ny < fl + P.min_clear) { p.vy = Math.max(p.vy, 3.0 * Math.min(1, fl + P.min_clear - ny)); ny = Math.max(ny, fl + 0.05); }   // too low: rise gently
      if (ny > gnd + P.ceiling) { ny = gnd + P.ceiling; p.vy = Math.min(0, p.vy); }
    } else if (ny <= podGround(nx, nz, ny)) { p.x = nx; p.z = nz; p.y = podGround(nx, nz, ny); p.bank = p.tilt = 0; podPose(p); podExit(); return; }
    p.x = nx; p.z = nz; p.y = ny;
    // the pod turns toward where you look, banks into the turn and dips its nose as it speeds up
    var dh = Math.atan2(Math.sin(yaw - p.h), Math.cos(yaw - p.h)); p.h += dh * Math.min(1, dt * 1.6);
    var fwdV = -(p.vx * Math.sin(p.h) + p.vz * Math.cos(p.h)), sideV = p.vx * Math.cos(p.h) - p.vz * Math.sin(p.h);
    p.bank += (clamp(-dh * 0.6 - sideV * 0.012, -0.35, 0.35) - p.bank) * Math.min(1, dt * 2.0);
    p.tilt += (clamp(-fwdV * 0.006, -0.2, 0.2) - p.tilt) * Math.min(1, dt * 1.5);
    p.rpm += ((POD.landing && alt < 0.6 ? 0.3 : 1.0) - p.rpm) * Math.min(1, dt * 1.5); p.spin += dt * 38 * p.rpm;
    podPose(p, podGround(p.x, p.z, p.y));
    // the camera: in the right seat, or behind and above
    p.grp.updateMatrixWorld(true);
    if (POD.view === 0) {
      POD.eye.set(-0.3, 2.02, 0.5).applyMatrix4(p.grp.matrixWorld); camera.position.copy(POD.eye);
      var nr = Math.min(0.32, Math.max(0.1, alt / 100)); if (Math.abs(camera.near - nr) > 0.02) { camera.near = nr; camera.updateProjectionMatrix(); }
    } else {
      var dist = 13 + Math.min(20, alt * 0.05), cp = Math.cos(pitch);
      camera.position.set(p.x + Math.sin(yaw) * cp * dist, p.y + 2.2 - Math.sin(pitch) * dist, p.z + Math.cos(yaw) * cp * dist);
      var cg = podGround(camera.position.x, camera.position.z) + 1.0; if (camera.position.y < cg) camera.position.y = cg;
      var nr2 = clamp(alt / 30, 0.2, 3); if (Math.abs(camera.near - nr2) > 0.05) { camera.near = nr2; camera.updateProjectionMatrix(); }
    }
    px = p.x; pz = p.z; ground = gnd; py = camera.position.y;
    camera.rotation.set(pitch, yaw, 0);
  }
  // each frame while walking: the pods' rotors idle, and is one near enough to board?
  function podIdle(dt) {
    var near = null;
    POD.list.forEach(function (p) { if (p === POD.cur) return; if (p.rpm > 0.001) { p.rpm *= Math.exp(-dt * 0.8); p.spin += dt * 38 * p.rpm; podPose(p); } if (Math.hypot(px - p.x, pz - p.z) < 5.0 && Math.abs(py - EYE - p.y) < 2.5) near = p; });
    if (near !== POD.near) { POD.near = near; podHud(); }
  }
  function podHud() {
    var bar = $("podbar"); if (!bar) return;
    bar.hidden = !(POD.flying || POD.near);
    $("podBoard").hidden = !!POD.flying; $("podFly").hidden = !POD.flying;
    $("podHint").innerHTML = POD.flying ? "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · <kbd>Space</kbd> up · <kbd>Shift</kbd> down · <kbd>V</kbd> view · <kbd>F</kbd> land" : "<kbd>F</kbd> board the pod";
    document.body.classList.toggle("in-pod", !!POD.flying);
  }
