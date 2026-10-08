  /* ===================== The flying pods (T04-03): board one and fly over the campus ===================== */
  // Jim, 5 Oct 2026: "add some flying pod I can take and can drive the flying pod to see the eagle view"; then "on mars air
  // is so little and can hardly support flying pod. borrow the same idea from Jim's retirement home use anti gravity
  // technology (not 5 anti gravity drives but with some cool shape)"; "the flying pod looks not real" (P2.pod). No rotors:
  // a two-seat cabin, a teardrop of pearl-white composite under a one-piece tinted canopy, sits in a halo, the anti-gravity
  // drive: a flat elliptical ring round its waist on two swept pylons, glowing faintly underneath, its field pushing against
  // the ground like the Crown's drives at Arcadia. Walk up and board it (F, or BOARD); fly where you look with the walking
  // keys or the joystick, Space and Shift (or the arrows on screen) to climb and descend, V for the view from behind; F
  // (LAND) sets it down on open ground anywhere: it floats level P2.pod.hover over the highest ground under it, whatever
  // the slope, and you step out on its right. It never lands on a roof. The pod stays where you leave it. Its home is the
  // pod dock off the Ring's right side (blk_poddock.js): land near it and it settles onto the docking spot, the collar runs
  // out to its canopy, and you step out into the glass bridge to the pod lounge.
  var POD = { list: [], cur: null, flying: false, view: 0, landing: false, dock: null, near: null, up: false, down: false, eye: new THREE.Vector3() };
  var POD_GEO = null, POD_BELLY = 0.1;
  // ---- the craft, in its own frame: x to the left as you sit (the pod is turned half round onto the walker's yaw), y up,
  // z forward (the nose at +z), its belly at y = POD_BELLY; the pilot sits on the right (-x), as in a helicopter ----
  function podGeometries() {
    if (POD_GEO) return POD_GEO;
    var P = P2.pod, L = P.length / 2, HL = P.halo, b = new Builder(), gl = new Builder(), ck = new Builder();
    function sec(t) { return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 1.45))), 0.62); }    // the section's size along the cabin: a blunt nose, a long tail
    function cabin(u, t) { var s = sec(t), cu = Math.cos(u), su = Math.sin(u); return [1.08 * s * cu, 0.72 + 0.06 * t + (su > 0 ? 1.02 : 0.62) * s * su, lerp(-L, L, t)]; }
    function shell(B, u0, u1, t0, t1, nu, nv, inset, mat, g2x, g2y) {
      var n0 = B.count(), sgn = inset ? -1 : 1;
      B.surf(nu, nv, function (i, j, q) { var u = lerp(u0, u1, i / nu), t = lerp(t0, t1, j / nv), p = cabin(u, t), k = 1 - inset; q.p[0] = p[0] * k; q.p[1] = 0.75 + (p[1] - 0.75) * k; q.p[2] = p[2] * (1 - inset * 0.3);
        q.f[0] = p[2]; q.f[1] = u * 0.9; q.f2[0] = g2x || 0; q.f2[1] = g2y || 0; q.m = mat; });
      B.orient(n0, function (x, y, z) { return [sgn * x, sgn * (y - 0.78), sgn * z * 0.15]; });
    }
    // the cabin: the canopy over the front, chin windows at your feet, the rest pearl-white composite with a dark lining
    var U0 = -0.3, U1 = Math.PI + 0.3, T0 = 0.38, T1 = 0.965, NU = 48, NV = 40;
    var C0u = 1.5 * Math.PI - 0.62, C1u = 1.5 * Math.PI + 0.62, CT0 = lerp(T0, T1, 10 / NV), CT1 = lerp(T0, T1, 33 / NV);
    shell(b, -0.12, Math.PI + 0.12, 0, T0, 26, 16, 0, MT.COMPOSITE, 0, 1); shell(b, Math.PI + 0.12, 2 * Math.PI - 0.12, 0, T0, 22, 16, 0, MT.ANOD);    // the tail: pearl over graphite
    shell(b, 0, 2 * Math.PI, T1, 1, NU, 3, 0, MT.COMPOSITE, 0, 1); shell(b, 0, 2 * Math.PI, 0.1, T0, NU, 12, 0.03, MT.FABRIC, 0, 0);
    [[U1, C0u, T0, T1, 4, NV], [C1u, 2 * Math.PI + U0, T0, T1, 4, NV], [C0u, C1u, T0, CT0, 9, 10], [C0u, C1u, CT1, T1, 9, 7]].forEach(function (e) {
      shell(b, e[0], e[1], e[2], e[3], e[4], e[5], 0, MT.ANOD); shell(b, e[0], e[1], e[2], e[3], e[4], e[5], 0.03, MT.FABRIC, 0, 0);     // the belly round the chin windows, graphite
    });
    var seam = []; for (var k0 = 0; k0 <= 40; k0++) { var ps = cabin(-0.12, k0 / 40 * T0); seam.push(new THREE.Vector3(ps[0] * 1.004, 0.75 + (ps[1] - 0.75) * 1.004, ps[2])); } tubeAlong(b, seam, 0.008, 4, MT.STEEL);
    seam = []; for (var k1 = 0; k1 <= 40; k1++) { var ps2 = cabin(Math.PI + 0.12, k1 / 40 * T0); seam.push(new THREE.Vector3(ps2[0] * 1.004, 0.75 + (ps2[1] - 0.75) * 1.004, ps2[2])); } tubeAlong(b, seam, 0.008, 4, MT.STEEL);
    gl.surf(30, 26, function (i, j, q) { var u = lerp(U0, U1, i / 30), t = lerp(T0, T1, j / 26), p = cabin(u, t); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = p[2]; q.f2[0] = 3; q.f2[1] = 3; q.m = 0; });
    gl.surf(9, 23, function (i, j, q) { var u = lerp(C0u, C1u, i / 9), t = lerp(CT0, CT1, j / 23), p = cabin(u, t); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = p[2]; q.f2[0] = 3; q.f2[1] = 3; q.m = 0; });
    gl.orient(0, function (x, y, z) { return [x, y - 0.78, z * 0.15]; });
    function rim(u0, u1, t0, t1, n, r) { var pts = []; for (var k = 0; k <= n; k++) { var p = cabin(lerp(u0, u1, k / n), lerp(t0, t1, k / n)); pts.push(new THREE.Vector3(p[0] * 1.006, 0.75 + (p[1] - 0.75) * 1.006, p[2])); } tubeAlong(b, pts, r || 0.022, 6, MT.ANOD); }
    rim(U0, U0, T0, T1, 16); rim(U1, U1, T0, T1, 16); rim(U0, U1, T0, T0, 24, 0.03); rim(U0, U1, T1, T1, 16);
    rim(C0u, C0u, CT0, CT1, 12); rim(C1u, C1u, CT0, CT1, 12); rim(C0u, C1u, CT0, CT0, 8); rim(C0u, C1u, CT1, CT1, 8);
    // the halo: a flat elliptical ring round the waist, pearl-white on top, a dark inner edge, the field's emitters glowing
    // underneath, a thin light along its outer edge; joined to the cabin by two swept pylons
    var ZC = -0.15, HA = HL.rx, HB = HL.rz, HW = HL.w / 2, HT = HL.t / 2, HY = HL.y, NH = 120;
    function haloPt(th, ph, grow) { var c = Math.cos(th), s = Math.sin(th), nx = c / HB, nz = s / HA, nl = Math.hypot(nx, nz), cp = Math.cos(ph), sp = Math.sin(ph), w = HW * cp * (grow || 1);
      return [HB * c + nx / nl * w, HY + HT * (sp > 0 ? sp : sp * 0.75) * (grow || 1), ZC + HA * s + nz / nl * w]; }
    function haloBand(ph0, ph1, nv, mat, g2x, g2y) {
      b.surf(NH, nv, function (i, j, q) { var th = i / NH * 2 * Math.PI, ph = lerp(ph0, ph1, j / nv), p = haloPt(th, ph); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = p[2];
        var c = Math.cos(th), s = Math.sin(th), nx = c / HB, nz = s / HA, nl = Math.hypot(nx, nz); q.nn = [nx / nl * Math.cos(ph), Math.sin(ph) * 2.2, nz / nl * Math.cos(ph)];
        q.f[0] = th * 2.6; q.f[1] = ph; q.f2[0] = g2x || 0; q.f2[1] = g2y || 0; q.m = mat; }, true);
    }
    haloBand(-0.55, 2.35, 10, MT.COMPOSITE, 0, 1); haloBand(2.35, Math.PI + 0.75, 5, MT.ANOD); haloBand(Math.PI + 0.75, 2 * Math.PI - 0.55, 6, MT.LIGHT, 1.25, 1.0);
    var led = []; for (var k = 0; k <= NH; k++) { var pp = haloPt(k / NH * 2 * Math.PI, 0.18, 1.0); led.push(new THREE.Vector3(pp[0] * 1.004, pp[1] + 0.012, pp[2])); }
    tubeAlong(b, led, 0.009, 4, MT.LIGHT, 1.4);
    [-1, 1].forEach(function (sx) {                                           // the pylons: flat swept struts, an airfoil in section
      var th = sx > 0 ? -0.22 : Math.PI + 0.22, hp = haloPt(th, Math.PI, 1.0), a = [sx * 0.95, 0.86, 0.15], bb = [hp[0] - sx * 0.05, HY + 0.01, hp[2]], n = 10;
      b.surf(n, 12, function (i, j, q) { var t = i / n, ph = j / 12 * 2 * Math.PI, ch = lerp(0.62, 0.42, t), th2 = lerp(0.1, 0.07, t), x = lerp(a[0], bb[0], t), y = lerp(a[1], bb[1], t) + Math.sin(Math.PI * t) * 0.05, z = lerp(a[2], bb[2], t);
        q.p[0] = x; q.p[1] = y + th2 / 2 * Math.sin(ph); q.p[2] = z + ch / 2 * Math.cos(ph) - (Math.cos(ph) < 0 ? 0 : ch * 0.18 * Math.cos(ph)); q.nn = [0, Math.sin(ph) * 1.6, Math.cos(ph)]; q.f[0] = x; q.f[1] = z; q.f2[1] = 1; q.m = MT.COMPOSITE; }, false, true);
      // a pod on the halo where the pylon meets it: the position light (red on the left, green on the right)
      var np = haloPt(th, 0, 1.0), n0 = b.count(); latheOnAxis(b, [np[0] + sx * 0.02, HY, np[2]], [0, 0, 1], [[0.0, -0.32], [0.07, -0.28], [0.085, 0.0], [0.07, 0.26], [0.0, 0.34]], 14, MT.ANOD);
      b.orient(n0, function (x, y, z) { return [x - (np[0] + sx * 0.02), y - HY, 0]; });
      var la = ATL[sx > 0 ? "podRed" : "podGreen"]; b.geo(addF2(sphereUV(0.045, la), 2.4, 0), T(np[0] + sx * 0.09, HY + 0.01, np[2] + 0.05), MT.SCREEN, 1);
    });
    var tl = ATL.podWhite, tp = haloPt(-Math.PI / 2, 0, 1.0); b.geo(addF2(sphereUV(0.045, tl), 2.0, 0), T(tp[0], HY + 0.02, tp[2] - 0.06), MT.SCREEN, 1);   // the white light at the tail
    // inside, seen through the canopy: two seats in white leather on a dark floor, the dashboard
    b.box(-0.82, 0.28, -1.1, 0.82, 0.32, 0.55, MT.RUBBER);                                                                    // the floor, up to the chin windows
    [-0.32, 0.32].forEach(function (x) {
      b.box(x - 0.27, 0.32, -0.27, x + 0.27, 0.6, 0.3, MT.ANOD);                                                           // the seat's base
      b.box(x - 0.26, 0.6, -0.25, x + 0.26, 0.72, 0.29, MT.FABRIC); b.tag(b.lastBox, 5, null);                           // the cushion
      var bk = b.count(); b.box(x - 0.26, 0.7, -0.37, x + 0.26, 1.28, -0.23, MT.FABRIC); b.tag(bk, 5, null);                 // the back, leaning
      for (var v = bk; v < b.count(); v++) { var Y = b.p[v * 3 + 1]; b.p[v * 3 + 2] -= (Y - 0.7) * 0.22; }
      var hr = b.count(); b.box(x - 0.13, 1.32, -0.5, x + 0.13, 1.47, -0.39, MT.FABRIC); b.tag(hr, 5, null);
    });
    b.box(-0.07, 0.32, -0.25, 0.07, 0.66, 0.55, MT.ANOD);                                                                     // the console between them
    b.box(-0.6, 0.72, 1.25, 0.6, 0.94, 1.55, MT.ANOD); b.box(-0.58, 0.94, 1.29, 0.58, 0.97, 1.5, MT.FABRIC); b.tag(b.lastBox, 0, null);   // the dashboard
    [["podPfd", -0.34], ["podMap", 0.0], ["podSys", 0.34]].forEach(function (e) {                                              // three displays facing the seats
      var x = e[1], uv = ATL[e[0]]; b.box(x - 0.165, 0.73, 1.236, x + 0.165, 0.94, 1.25, MT.ANOD);
      quadB(b, new THREE.Vector3(x + 0.15, 0.745, 1.233), new THREE.Vector3(x - 0.15, 0.745, 1.233), new THREE.Vector3(x - 0.15, 0.925, 1.233), new THREE.Vector3(x + 0.15, 0.925, 1.233), [0, 0, -1], MT.SCREEN,
        [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]], [1.0, 0]);
    });
    ck.box(-0.01, 0.0, 0.0, 0.01, 0.01, 0.01, MT.ANOD);                                                                       // (nothing extra in the cockpit view for now)
    function out(B) { var g = B.build(); g.attributes.aAO.array.fill(1); g.attributes.aSky.array.fill(1); return g; }
    POD_GEO = { body: out(b), glass: out(gl), cockpit: out(ck) };
    return POD_GEO;
  }
  function sphereUV(r, uv) { var g = new THREE.SphereGeometry(r, 10, 8), A = g.attributes.uv; for (var i = 0; i < A.count; i++) A.setXY(i, lerp(uv[0], uv[2], 0.5), lerp(uv[1], uv[3], 0.5)); return g; }
  function latheOnAxis(B, c, ax, prof, n, mat, g2x, g2y) {         // a solid of revolution round an axis through c (prof: [r, along])
    var a = new THREE.Vector3().fromArray(ax).normalize(), t1 = new THREE.Vector3(0, 1, 0); if (Math.abs(a.y) > 0.9) t1.set(1, 0, 0); var t2 = new THREE.Vector3().crossVectors(a, t1).normalize(); t1.crossVectors(t2, a).normalize();
    B.surf(n, prof.length - 1, function (i, j, q) { var th = i / n * 2 * Math.PI, pr = prof[j], cs = Math.cos(th), sn = Math.sin(th);
      q.p[0] = c[0] + a.x * pr[1] + (t1.x * cs + t2.x * sn) * pr[0]; q.p[1] = c[1] + a.y * pr[1] + (t1.y * cs + t2.y * sn) * pr[0]; q.p[2] = c[2] + a.z * pr[1] + (t1.z * cs + t2.z * sn) * pr[0];
      q.f2[0] = g2x || 0; q.f2[1] = g2y || 0; q.m = mat; }, true);
  }
  // a pod at (x, z), its nose along the walker's yaw convention h (forward = (-sin h, -cos h)), floating where it is left
  function podMake(x, z, h) {
    var G = podGeometries(), grp = new THREE.Group();
    var body = new THREE.Mesh(G.body, matMat); body.frustumCulled = false; grp.add(body);
    var glass = [THREE.BackSide, THREE.FrontSide].map(function (side, i) { var m = new THREE.Mesh(G.glass, glassMat(side)); m.renderOrder = 14 + i; m.frustumCulled = false; grp.add(m); return m; });
    var ck = new THREE.Mesh(G.cockpit, matMat); ck.visible = false; ck.frustumCulled = false; grp.add(ck);
    scene.add(grp);
    var blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), podBlobMat()); blob.rotation.x = -Math.PI / 2; blob.renderOrder = 2; blob.frustumCulled = false; scene.add(blob);
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), podGlowMat()); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 3; glow.frustumCulled = false; scene.add(glow);
    var pod = { grp: grp, ck: ck, blob: blob, glow: glow, x: x, z: z, y: 0, h: h, vx: 0, vz: 0, vy: 0, bank: 0, tilt: 0, t: Math.random() * 10 };
    pod.y = podPark(pod); podPose(pod); POD.list.push(pod); return pod;
  }
  // where a pod floats when set down: P2.pod.hover over the highest ground under its halo
  function podPark(p) {
    var g = podGround(p.x, p.z), HL = P2.pod.halo, c = Math.cos(p.h), s = Math.sin(p.h);
    for (var k = 0; k < 12; k++) { var a = k / 12 * 2 * Math.PI, lx = HL.rz * 0.92 * Math.cos(a), lz = HL.rx * 0.92 * Math.sin(a);
      g = Math.max(g, podGround(p.x + lx * c + lz * -s, p.z - lx * s + lz * -c)); }
    return g + P2.pod.hover - POD_BELLY;
  }
  function podPose(p, gnd) {
    p.grp.position.set(p.x, p.y, p.z); p.grp.rotation.order = "YXZ"; p.grp.rotation.set(p.tilt, p.h + Math.PI, p.bank);
    // a soft shadow on the ground under it, and the field's glow, both fading and spreading as it climbs
    var g = gnd === undefined ? podGround(p.x, p.z) : gnd, alt = Math.max(0, p.y + POD_BELLY - g), s = 7.0 + alt * 0.12;
    p.blob.position.set(p.x, g + 0.04, p.z); p.blob.scale.set(s, s * 0.7, 1); p.blob.rotation.z = p.h; p.blob.material.opacity = 0.5 * Math.max(0, 1 - alt / 45);
    var gs = 8.0 + alt * 0.5; p.glow.position.set(p.x, g + 0.06, p.z); p.glow.scale.set(gs, gs * 0.75, 1); p.glow.rotation.z = p.h; p.glow.material.opacity = 0.16 * Math.max(0, 1 - alt / 14);
  }
  var POD_BLOB = null, POD_GLOW = null;
  function podBlobMat() {                                                    // a radial gradient, dark in the middle
    if (!POD_BLOB) { var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
      gr.addColorStop(0, "rgba(0,0,0,0.85)"); gr.addColorStop(0.45, "rgba(0,0,0,0.5)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); POD_BLOB = new THREE.CanvasTexture(c); }
    return new THREE.MeshBasicMaterial({ map: POD_BLOB, transparent: true, depthWrite: false, opacity: 0.5 });
  }
  function podGlowMat() {                                                    // the field on the ground: a soft blue-white ring, added to the light there
    if (!POD_GLOW) { var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 63);
      gr.addColorStop(0, "rgba(170,200,255,0.0)"); gr.addColorStop(0.5, "rgba(170,200,255,0.12)"); gr.addColorStop(0.68, "rgba(205,225,255,0.5)"); gr.addColorStop(0.8, "rgba(170,200,255,0.12)"); gr.addColorStop(1, "rgba(170,200,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128); POD_GLOW = new THREE.CanvasTexture(c); }
    return new THREE.MeshBasicMaterial({ map: POD_GLOW, transparent: true, depthWrite: false, opacity: 0.4, blending: THREE.AdditiveBlending });
  }
  function podGround(x, z, y) { var s = podDockGround(x, z); return s !== undefined ? s : groundAt(x, z, y === undefined ? 0 : y); }   // the ground under the pod: the dock's deck, or the ground
  function podInit() {                                                       // pods wait at the Ring's dock and at the gates that keep one, their collars run out to them
    if (!pdkInit()) return;
    podDockCollar();
    PDKS.forEach(function (P) { var on = P.kind !== "well" || P2.pod_gates.parked.indexOf(P.gate) >= 0; if (on) P.pod = podMake(P.sp.x, P.sp.z, P.hd); P.ext = P.want = on ? 1 : 0; pdkCollarSet(P); });
  }

  // ---- how high the pod must stay: the ground, or the roof of whatever stands there ----
  function podFloor(x, z) {
    var g = podGround(x, z), top = g;
    var o = palLoc(x, z, {}), r = o.r, yB = PALY.B;
    if (r < PAL.ringOut + 0.5) top = Math.max(top, yB + PAL.beam + (PAL.H - PAL.beam) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(r, PAL.R) / PAL.R, 2))) + 0.6);
    if (o.rad > 22 && o.rad < PAL.vFront + 1.5 && Math.abs(o.lat) < 7) top = Math.max(top, yB + 8);   // the front vault and its door
    if (CRS) {                                                                // the Ring and its gallery, the garden ring's vault
      var d = ringDeg(Math.atan2(o.lat, -o.rad)), gal = d > CRS.gal.d0 && d < CRS.gal.d1;
      if (r > CRS.r0 - 0.6 && r < (gal ? CRS.gal.r1 : CRS.r1) + 1.2) top = Math.max(top, ringRoofY(clamp(r, CRS.roofIn, CRS.roofOut), d) + 0.6);
      if (GRD && r >= PAL.ringOut - 0.5 && r <= CRS.r0 - 0.6) { var S = grSection(d); top = Math.max(top, (grInGrove(d) ? PALY.B + P2.garden_ring.grove.roof : grY(S, clamp(r, S.rIn, S.rOut))) + 0.6); }
    }
    if (ENT) { var qe = Math.hypot(o.lat - ENT.c.lat, o.rad - ENT.c.rad); if (qe < ENT.a + 1.0) top = Math.max(top, entTop(Math.min(qe, ENT.a)) + 0.6); if (inAirlockBox(o.lat, o.rad, 1.0)) top = Math.max(top, ENT.yA + ENT.ah + 0.6); }
    COLL.rovers.forEach(function (rv) { if (Math.hypot(x - rv.x, z - rv.z) < 4.5) top = Math.max(top, g + 3.4); });
    return Math.max(top, podDockTop(x, z));
  }
  // it may set down wherever no roof or wall is under its halo: it floats level, so the slope does not matter
  function podCanLand(x, z) {
    if (podFloor(x, z) > podGround(x, z) + 0.3) return false;
    for (var k = 0; k < 8; k++) { var a = k / 8 * 2 * Math.PI, qx = x + 3.0 * Math.cos(a), qz = z + 3.0 * Math.sin(a); if (podFloor(qx, qz) > podGround(qx, qz) + 0.3) return false; }
    return true;
  }

  // ---- boarding, flying, landing ----
  function podAction() {
    if (POD.flying) { podLand(); return; }
    if (POD.near) podBoard(POD.near);
  }
  function podBoard(p) {
    var D = pdkOf(p); if (D) { D.pod = null; D.want = 0; }
    POD.cur = POD.last = p; POD.flying = true; POD.landing = false; POD.docking = false; POD.view = 0; p.vx = p.vz = 0; p.vy = 2.5; p.ck.visible = true;
    yaw = p.h; pitch = -4 * D2R; setAuto(false); tween = null;
    podHud();
  }
  function podLand() {
    var p = POD.cur; if (!p || POD.landing) return;
    var dk = null, best = 18; PDKS.forEach(function (P) { var d = Math.hypot(p.x - P.sp.x, p.z - P.sp.z); if (!P.pod && d < best) { best = d; dk = P; } });
    if (dk) { POD.landing = true; POD.docking = true; POD.dock = dk; return; }   // near a free dock or gate: it docks there
    if (!podCanLand(p.x, p.z)) { showToast("Pod", "Not on a roof", "Fly clear of the buildings and press F again: it sets down on any open ground.", 3400); return; }
    POD.landing = true;
  }
  function podExit() {
    var p = POD.cur, dk = POD.dock && POD.dock.pod === p ? POD.dock : null; POD.flying = false; POD.landing = false; POD.docking = false; POD.dock = null; POD.cur = null; p.ck.visible = false; p.vx = p.vz = p.vy = 0;
    if (dk) {                                                                 // docked: out through the canopy into the collar, facing the bridge
      var q = pdkAt(dk, dk.u1 + dk.cmax - 0.5, 0); px = q.x; pz = q.z; ground = dk.yB; py = ground + EYE; vx = vz = vy = 0; onGround = true;
      yaw = Math.atan2(dk.O.x, dk.O.z); pitch = -4 * D2R; camera.near = 0.1; camera.updateProjectionMatrix(); podHud(); return;
    }
    var ex = p.x + Math.cos(p.h) * 3.6, ez = p.z - Math.sin(p.h) * 3.6;     // step out on the right, clear of the halo
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
    var gnd = podGround(p.x, p.z, p.y), alt = p.y + POD_BELLY - gnd, vmax = clamp(9 + alt * 0.2, 9, P.top_speed), park = podPark(p);
    var tx = 0, tz = 0;
    if (POD.docking) { podDockStep(p, dt, park); return; }
    if (!POD.landing && (fwd || side)) { var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), len = Math.hypot(fwd, side); tx = (fx * fwd + rx * side) / len * vmax * Math.min(1, jm); tz = (fz * fwd + rz * side) / len * vmax * Math.min(1, jm); }
    var vyT = POD.landing ? -clamp((p.y - park) * 0.7, 0.5, 12.0) : climb * P.climb;
    p.vx += (tx - p.vx) * Math.min(1, dt * 0.9); p.vz += (tz - p.vz) * Math.min(1, dt * 0.9); p.vy += (vyT - p.vy) * Math.min(1, dt * 2.2);
    var nx = p.x + p.vx * dt, nz = p.z + p.vz * dt, ny = p.y + p.vy * dt, rr = Math.hypot(nx, nz);
    if (rr > MAXR) { nx *= MAXR / rr; nz *= MAXR / rr; }
    var flHere = podFloor(p.x, p.z), fl = podFloor(nx, nz);
    if (!POD.landing) {
      if (fl > flHere + 0.8 && fl + 0.5 > p.y) { nx = p.x; nz = p.z; p.vx *= 0.2; p.vz *= 0.2; fl = flHere; }   // a wall or a roof's edge ahead: stop short
      var minY = Math.max(park, fl + P.hover - POD_BELLY);                                                // down to its float over the ground, never onto a roof
      if (ny < minY) { p.vy = Math.max(p.vy, 3.0 * Math.min(1, minY - ny)); ny = Math.max(ny, minY - 0.02); }
      if (ny > gnd + P.ceiling) { ny = gnd + P.ceiling; p.vy = Math.min(0, p.vy); }
    } else if (ny <= park + 0.01) { p.x = nx; p.z = nz; p.y = park; p.bank = p.tilt = 0; p.vx = p.vz = p.vy = 0; podPose(p); podExit(); return; }
    p.x = nx; p.z = nz; p.y = ny;
    // the pod turns toward where you look, banks into the turn and dips its nose as it speeds up
    var dh = Math.atan2(Math.sin(yaw - p.h), Math.cos(yaw - p.h)); p.h += dh * Math.min(1, dt * 1.6);
    var fwdV = -(p.vx * Math.sin(p.h) + p.vz * Math.cos(p.h)), sideV = p.vx * Math.cos(p.h) - p.vz * Math.sin(p.h);
    p.bank += (clamp(-dh * 0.6 - sideV * 0.012, -0.35, 0.35) - p.bank) * Math.min(1, dt * 2.0);
    p.tilt += (clamp(-fwdV * 0.006, -0.2, 0.2) - p.tilt) * Math.min(1, dt * 1.5);
    podPose(p, podGround(p.x, p.z, p.y));
    // the camera: in the right seat, or behind and above
    p.grp.updateMatrixWorld(true);
    if (POD.view === 0) {
      POD.eye.set(-0.32, 1.3, 0.62).applyMatrix4(p.grp.matrixWorld); camera.position.copy(POD.eye);
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
  // docking: glide over the spot at a safe height, turn side-on with the canopy to the bridge, settle, then wait for the
  // collar to run out and seal before stepping out
  function podDockStep(p, dt, park) {
    var P = POD.dock, dx = P.sp.x - p.x, dz = P.sp.z - p.z, dist = Math.hypot(dx, dz), dh = Math.atan2(Math.sin(P.hd - p.h), Math.cos(P.hd - p.h));
    if (P.pod === p) {                                                        // down: the collar runs out, then out you step
      pdkUpdate(dt); if (P.ext >= 0.999) { podExit(); return; }
    } else {
      var sp = Math.min(7, dist * 0.9), safe = Math.max(park, P.safe);
      var tx = dist > 1e-3 ? dx / dist * sp : 0, tz = dist > 1e-3 ? dz / dist * sp : 0, vyT = dist > 0.5 || Math.abs(dh) > 0.06 ? clamp((safe - p.y) * 1.2, -4, 6) : -clamp((p.y - park) * 0.8, 0.4, 5);
      p.vx += (tx - p.vx) * Math.min(1, dt * 2.0); p.vz += (tz - p.vz) * Math.min(1, dt * 2.0); p.vy += (vyT - p.vy) * Math.min(1, dt * 2.5);
      p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.h += dh * Math.min(1, dt * 1.4); p.bank *= 0.9; p.tilt *= 0.9;
      if (p.y <= park + 0.01 && dist < 0.35) { p.x = P.sp.x; p.z = P.sp.z; p.y = park; p.h = P.hd; p.vx = p.vz = p.vy = 0; p.bank = p.tilt = 0; P.pod = p; P.want = 1; }
    }
    podPose(p, podGround(p.x, p.z, p.y)); p.grp.updateMatrixWorld(true);
    if (POD.view === 0) { POD.eye.set(-0.32, 1.3, 0.62).applyMatrix4(p.grp.matrixWorld); camera.position.copy(POD.eye); }
    else { var cp = Math.cos(pitch), dd = 13; camera.position.set(p.x + Math.sin(yaw) * cp * dd, p.y + 2.2 - Math.sin(pitch) * dd, p.z + Math.cos(yaw) * cp * dd); }
    px = p.x; pz = p.z; ground = podGround(p.x, p.z, p.y); py = camera.position.y; camera.rotation.set(pitch, yaw, 0);
  }
  // each frame while walking: the parked pods float and breathe a little; is one near enough to board?
  function podIdle(dt) {
    pdkUpdate(dt);
    var near = null;
    POD.list.forEach(function (p) { if (p === POD.cur) return; p.t += dt; p.grp.position.y = p.y + 0.015 * Math.sin(p.t * 1.1); if (Math.hypot(px - p.x, pz - p.z) < 5.0 && Math.abs(py - EYE - p.y) < 2.5) near = p; });
    if (near !== POD.near) { POD.near = near; podHud(); }
  }
  function podHud() {
    var bar = $("podbar"); if (!bar) return;
    bar.hidden = !(POD.flying || POD.near);
    $("podBoard").hidden = !!POD.flying; $("podFly").hidden = !POD.flying;
    $("podHint").innerHTML = POD.flying ? "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · <kbd>Space</kbd> up · <kbd>Shift</kbd> down · <kbd>V</kbd> view · <kbd>F</kbd> land anywhere open, or at a dock" : "<kbd>F</kbd> board the pod";
    document.body.classList.toggle("in-pod", !!POD.flying);
  }
