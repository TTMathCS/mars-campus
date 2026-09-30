  /* ===================== Inside the wings: classrooms, coding lab, café, reception, library ===================== */
  // Local frame of a piece of furniture: x along the wing (toward the gateway), y up, z into the wing (toward the back wall).
  var WING_OBST = { "1": [], "-1": [] };            // footprints for walking: [s0, s1, u0, u1]
  var WALLC = { foyer: 0, math: 0, lobby: 3, lab: 0, seminar: 1, cafe: 2, reception: 1, library: 3, study: 2 };
  var FLOORM = { foyer: [MT.TERRAZZO, 0], math: [MT.WOOD, 0], lobby: [MT.TERRAZZO, 0], lab: [MT.WOOD, 0], seminar: [MT.WOOD, 3], cafe: [MT.TERRAZZO, 0], reception: [MT.TERRAZZO, 0], library: [MT.WOOD, 3], study: [MT.WOOD, 3] };
  var LAMPC = [1.0, 0.9, 0.78];
  function wLight(x, y, z, c, k, range, dir, lobe) { wingLights.push({ x: x, y: y, z: z, c: [c[0] * k, c[1] * k, c[2] * k], r: range, d: dir || null, lobe: lobe || 0 }); }
  function obst(sg, s0, s1, u0, u1) { WING_OBST[sg > 0 ? "1" : "-1"].push([Math.min(s0, s1), Math.max(s0, s1), Math.min(u0, u1), Math.max(u0, u1)]); }
  function place(B, fb, sg, s, u, y, rot) { var M = wingFrame(sg, s, u, y); if (rot) M.multiply(new THREE.Matrix4().makeRotationY(rot)); B.add(fb, M); }
  function wpt(sg, s, u, y) { var p = wingXZ(sg, u, s); return new THREE.Vector3(p.x, y, p.z); }
  // picture quad centred at P facing f (unit, horizontal); uv = atlas rect [u0, v0, u1, v1] seen upright by its viewer
  function wquad(B, P, f, w, h, uv, mat, g2) {
    var rx = f.z, rz = -f.x;
    quadB(B, new THREE.Vector3(P.x - rx * w / 2, P.y - h / 2, P.z - rz * w / 2), new THREE.Vector3(P.x + rx * w / 2, P.y - h / 2, P.z + rz * w / 2),
      new THREE.Vector3(P.x + rx * w / 2, P.y + h / 2, P.z + rz * w / 2), new THREE.Vector3(P.x - rx * w / 2, P.y + h / 2, P.z - rz * w / 2),
      [f.x, 0, f.z], mat, [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]], g2);
  }
  function negv(d) { return { x: -d.x, z: -d.z }; }
  // picture in the local frame M (the same frame as the boxes around it): centre c, width along local x or z, facing local n
  var _pc = new THREE.Vector3(), _pa = new THREE.Vector3(), _pn = new THREE.Vector3();
  function wpic(B, M, c, wAxis, n, w, h, uv, mat, g2) {
    _pc.set(c[0], c[1], c[2]).applyMatrix4(M); _pa.set(wAxis === "x" ? 1 : 0, 0, wAxis === "z" ? 1 : 0).transformDirection(M); _pn.set(n[0], 0, n[1]).transformDirection(M);
    if (_pa.x * _pn.z - _pa.z * _pn.x < 0) _pa.negate();              // left to right as seen by someone facing the picture
    var ax = _pa.x * w / 2, az = _pa.z * w / 2, C = _pc;
    quadB(B, new THREE.Vector3(C.x - ax, C.y - h / 2, C.z - az), new THREE.Vector3(C.x + ax, C.y - h / 2, C.z + az), new THREE.Vector3(C.x + ax, C.y + h / 2, C.z + az), new THREE.Vector3(C.x - ax, C.y + h / 2, C.z - az),
      [_pn.x, 0, _pn.z], mat, [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]], g2);
  }

  // ---- furniture, built once in local coordinates ----
  var FURN = {};
  function furn(name, fn) { if (!FURN[name]) { var b = new Builder(); fn(b); FURN[name] = b; } return FURN[name]; }
  function leg(b, x0, y0, z0, x1, y1, z1, r, mat) { tubeAlong(b, [new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)], r, 6, mat, 0.3); }
  function kindTag(b, n0, k) { b.tag(n0, null, k); }
  function studentDesk() { return furn("desk", function (b) {
    var n0 = b.count(); b.box(-0.3, 0.72, -0.7, 0.3, 0.745, 0.7, MT.WOOD); kindTag(b, n0, 1);
    [[-0.26, -0.66], [0.26, -0.66], [-0.26, 0.66], [0.26, 0.66]].forEach(function (c) { b.box(c[0] - 0.015, 0, c[1] - 0.015, c[0] + 0.015, 0.72, c[1] + 0.015, MT.ANOD); });
    b.box(-0.26, 0.68, -0.68, 0.26, 0.72, -0.64, MT.ANOD); b.box(-0.26, 0.68, 0.64, 0.26, 0.72, 0.68, MT.ANOD);
    b.box(0.24, 0.36, -0.64, 0.26, 0.68, 0.64, MT.ANOD);
    b.box(-0.27, 0.02, -0.68, 0.27, 0.05, -0.65, MT.ANOD); b.box(-0.27, 0.02, 0.65, 0.27, 0.05, 0.68, MT.ANOD);
  }); }
  function schoolChair(col) { return furn("chair" + col, function (b) {
    var n0 = b.count();
    b.box(-0.21, 0.44, -0.21, 0.21, 0.462, 0.21, MT.PLASTIC); b.box(-0.245, 0.5, -0.2, -0.225, 0.84, 0.2, MT.PLASTIC); b.tag(n0, col, null);
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(function (c) { leg(b, c[0], 0.44, c[1], c[0] * 1.08, 0, c[1] * 1.08, 0.011, MT.STEEL); });
    leg(b, -0.19, 0.44, -0.16, -0.235, 0.62, -0.16, 0.01, MT.STEEL); leg(b, -0.19, 0.44, 0.16, -0.235, 0.62, 0.16, 0.01, MT.STEEL);
  }); }
  function officeChair() { return furn("office", function (b) {
    for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a); leg(b, 0, 0.1, 0, cx * 0.3, 0.07, cz * 0.3, 0.018, MT.PLASTIC); b.geo(addF2(new THREE.SphereGeometry(0.03, 8, 6), 1, 0), T(cx * 0.3, 0.035, cz * 0.3), MT.PLASTIC, 1); }
    latheOn(b, 0, 0.08, 0, [[0.03, 0], [0.03, 0.3], [0.022, 0.32], [0.022, 0.38]], 10, MT.STEEL, 0.4);
    var n0 = b.count(); b.box(-0.24, 0.44, -0.24, 0.24, 0.52, 0.24, MT.FABRIC); b.box(-0.3, 0.6, -0.22, -0.24, 1.08, 0.22, MT.FABRIC); b.tag(n0, 0, null);
    b.box(-0.28, 0.5, -0.03, -0.24, 0.62, 0.03, MT.PLASTIC);
    [-0.25, 0.25].forEach(function (z) { b.box(-0.12, 0.6, z - 0.025, 0.14, 0.63, z + 0.025, MT.PLASTIC); leg(b, 0.0, 0.5, z, 0.0, 0.6, z, 0.012, MT.PLASTIC); });
    for (k = n0; k < b.count(); k++) if (b.m[k] === MT.PLASTIC) b.f2[k * 2] = 1;
    for (k = 0; k < n0; k++) if (b.m[k] === MT.PLASTIC) b.f2[k * 2] = 1;
  }); }
  function teacherDesk() { return furn("tdesk", function (b) {
    var n0 = b.count(); b.box(-0.38, 0.72, -0.8, 0.38, 0.75, 0.8, MT.WOOD); b.box(-0.35, 0, -0.78, 0.35, 0.72, -0.4, MT.WOOD); b.box(-0.35, 0, 0.74, 0.35, 0.72, 0.78, MT.WOOD); b.box(0.3, 0.2, -0.4, 0.34, 0.72, 0.74, MT.WOOD); kindTag(b, n0, 2);
    [0.14, 0.38, 0.6].forEach(function (y) { b.box(-0.355, y, -0.7, -0.35, y + 0.02, -0.48, MT.STEEL); });
    // laptop and a mug
    b.box(-0.05, 0.75, -0.3, 0.2, 0.765, 0.06, MT.ANOD); b.box(-0.07, 0.765, -0.3, -0.05, 0.99, 0.06, MT.ANOD);
    latheOn(b, 0.1, 0.75, 0.45, [[0.04, 0], [0.042, 0.02], [0.042, 0.1], [0.038, 0.1], [0.038, 0.012], [0.0, 0.012]], 14, MT.CERAMIC, 0);
  }); }
  function labDesk() { return furn("lab", function (b) {
    var n0 = b.count(); b.box(-0.38, 0.72, -1.8, 0.38, 0.75, 1.8, MT.WOOD); kindTag(b, n0, 1);
    [-1.74, 0, 1.74].forEach(function (z) { b.box(-0.34, 0, z - 0.03, 0.34, 0.03, z + 0.03, MT.ANOD); b.box(-0.02, 0.03, z - 0.03, 0.02, 0.72, z + 0.03, MT.ANOD); });
    b.box(0.3, 0.3, -1.72, 0.33, 0.7, 1.72, MT.ANOD);
    [-1.2, 0, 1.2].forEach(function (z) {
      b.box(0.08, 0.75, z - 0.12, 0.22, 0.76, z + 0.12, MT.ANOD); b.box(0.13, 0.76, z - 0.03, 0.16, 1.0, z + 0.03, MT.ANOD);
      b.box(0.1, 0.98, z - 0.32, 0.14, 1.36, z + 0.32, MT.PLASTIC);
      b.box(-0.28, 0.75, z - 0.22, -0.13, 0.768, z + 0.22, MT.PLASTIC); b.box(-0.24, 0.75, z + 0.3, -0.18, 0.772, z + 0.36, MT.PLASTIC);
    });
    for (var k = n0; k < b.count(); k++) if (b.m[k] === MT.PLASTIC) b.f2[k * 2] = 1;
  }); }
  function roundTable() { return furn("rtable", function (b) {
    latheOn(b, 0, 0, 0, [[0.24, 0], [0.24, 0.02], [0.05, 0.04], [0.035, 0.1], [0.035, 0.7], [0.08, 0.72], [0.0, 0.72]], 20, MT.ANOD, 0.4);
    latheOn(b, 0, 0.72, 0, [[0.0, 0.0], [0.36, 0.0], [0.36, 0.025], [0.0, 0.025]], 32, MT.MARBLE, 99, 0);
  }); }
  function cafeChair() { return furn("cchair", function (b) {
    var n0 = b.count(); latheOn(b, 0, 0.44, 0, [[0.0, 0.0], [0.2, 0.0], [0.2, 0.025], [0.0, 0.03]], 18, MT.WOOD, 99, 1); kindTag(b, n0, 1);
    [[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]].forEach(function (c) { leg(b, c[0], 0.44, c[1], c[0] * 1.25, 0, c[1] * 1.25, 0.012, MT.ANOD); });
    var bk = []; for (var k = 0; k <= 12; k++) { var a = Math.PI * (0.62 + 0.76 * k / 12); bk.push(new THREE.Vector3(Math.cos(a) * 0.2, 0.8, Math.sin(a) * 0.2)); }
    tubeAlong(b, bk, 0.016, 6, MT.WOOD); b.tag(b.count() - 13 * 7, 99, 1);
    leg(b, -0.19, 0.46, -0.08, -0.2, 0.8, -0.08, 0.011, MT.ANOD); leg(b, -0.19, 0.46, 0.08, -0.2, 0.8, 0.08, 0.011, MT.ANOD);
  }); }
  function cup() { return furn("cup", function (b) {
    latheOn(b, 0, 0, 0, [[0.0, 0.0], [0.075, 0.0], [0.08, 0.008], [0.03, 0.012], [0.0, 0.012]], 18, MT.CERAMIC, 0);
    latheOn(b, 0, 0.012, 0, [[0.028, 0], [0.04, 0.01], [0.045, 0.06], [0.041, 0.06], [0.036, 0.015], [0.0, 0.015]], 16, MT.CERAMIC, 0);
  }); }
  function pendantCone() { return furn("cone", function (b) {
    latheOn(b, 0, 0, 0, [[0.2, 0], [0.19, 0.03], [0.1, 0.2], [0.03, 0.26], [0.015, 0.28]], 24, MT.BRASS, 0);
    b.geo(addF2(new THREE.CircleGeometry(0.17, 20), 2.0, 0), T(0, 0.04, 0, Math.PI / 2, 0, 0), MT.LIGHT, 1);
  }); }
  function linearPendant() { return furn("lin", function (b) {
    b.box(-0.7, 0, -0.04, 0.7, 0.06, 0.04, MT.ANOD); var n0 = b.count(); b.box(-0.68, -0.004, -0.03, 0.68, 0.0, 0.03, MT.LIGHT); b.tag(n0, 1.6, 0.25);
  }); }
  function sofa(col, len) { return furn("sofa" + col + "_" + len, function (b) {
    var n0 = b.count(), L = len / 2;
    b.box(-L, 0.12, -0.45, L, 0.42, 0.45, MT.FABRIC); b.box(-L, 0.42, 0.22, L, 0.85, 0.45, MT.FABRIC); b.box(-L - 0.02, 0.12, -0.45, -L + 0.16, 0.62, 0.45, MT.FABRIC); b.box(L - 0.16, 0.12, -0.45, L + 0.02, 0.62, 0.45, MT.FABRIC);
    for (var x = -L + 0.18; x < L - 0.3; x += (len - 0.36) / Math.round((len - 0.36) / 0.65)) b.box(x + 0.01, 0.42, -0.42, x + (len - 0.36) / Math.round((len - 0.36) / 0.65) - 0.01, 0.52, 0.2, MT.FABRIC);
    b.tag(n0, col, null);
    [[-L + 0.08, -0.38], [L - 0.08, -0.38], [-L + 0.08, 0.38], [L - 0.08, 0.38]].forEach(function (c) { var m = b.count(); b.box(c[0] - 0.025, 0, c[1] - 0.025, c[0] + 0.025, 0.12, c[1] + 0.025, MT.WOOD); kindTag(b, m, 2); });
  }); }
  function armchair() { return furn("arm", function (b) {
    var n0 = b.count(); b.box(-0.4, 0.14, -0.42, 0.4, 0.44, 0.42, MT.LEATHER); b.box(-0.4, 0.44, 0.24, 0.4, 0.95, 0.42, MT.LEATHER); b.box(-0.42, 0.14, -0.42, -0.3, 0.66, 0.42, MT.LEATHER); b.box(0.3, 0.14, -0.42, 0.42, 0.66, 0.42, MT.LEATHER); b.tag(n0, 2, null);
    [[-0.34, -0.36], [0.34, -0.36], [-0.34, 0.36], [0.34, 0.36]].forEach(function (c) { var m = b.count(); b.box(c[0] - 0.02, 0, c[1] - 0.02, c[0] + 0.02, 0.14, c[1] + 0.02, MT.WOOD); kindTag(b, m, 2); });
  }); }
  function bookshelf() { return furn("shelf", function (b) {   // 0.9 wide (x), 0.34 deep (z, back at +z), 2.2 tall; books added as pictures
    var n0 = b.count(); b.box(-0.45, 0, -0.17, -0.43, 2.2, 0.17, MT.WOOD); b.box(0.43, 0, -0.17, 0.45, 2.2, 0.17, MT.WOOD); b.box(-0.45, 2.18, -0.17, 0.45, 2.2, 0.17, MT.WOOD);
    b.box(-0.43, 0, -0.16, 0.43, 0.08, 0.17, MT.WOOD); b.box(-0.43, 0.08, 0.15, 0.43, 2.18, 0.17, MT.WOOD);
    [0.5, 0.92, 1.34, 1.76].forEach(function (y) { b.box(-0.43, y, -0.16, 0.43, y + 0.022, 0.15, MT.WOOD); });
    kindTag(b, n0, 2);
  }); }
  function bankerLamp() { return furn("banker", function (b) {
    latheOn(b, 0, 0, 0, [[0.0, 0], [0.08, 0], [0.08, 0.02], [0.012, 0.03], [0.012, 0.3]], 14, MT.BRASS, 0);
    var n0 = b.count(); b.geo(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 16, 1, true, 0, Math.PI), T(0, 0.33, -0.04, Math.PI / 2, 0, Math.PI / 2), MT.PLASTIC, 1); b.tag(n0, 6, null);
    b.box(-0.15, 0.3, -0.035, 0.15, 0.302, 0.0, MT.LIGHT); b.tag(b.count() - 24, 1.3, 0);
  }); }
  function floorLamp() { return furn("flamp", function (b) {
    latheOn(b, 0, 0, 0, [[0.0, 0], [0.16, 0], [0.16, 0.02], [0.015, 0.03], [0.015, 1.45]], 16, MT.BRASS, 0);
    var n0 = b.count(); latheOn(b, 0, 1.3, 0, [[0.2, 0], [0.16, 0.28], [0.155, 0.28]], 20, MT.FABRIC, 5); b.tag(n0, 5, null);
    b.geo(addF2(new THREE.CircleGeometry(0.19, 18), 1.2, 0), T(0, 1.302, 0, Math.PI / 2, 0, 0), MT.LIGHT, 1);
  }); }
  function sideTable() { return furn("stable", function (b) { latheOn(b, 0, 0, 0, [[0.18, 0], [0.18, 0.02], [0.03, 0.03], [0.03, 0.5], [0.26, 0.5], [0.26, 0.53], [0.0, 0.53]], 20, MT.WOOD, 99, 2); }); }
  function bench() { return furn("bench", function (b) {
    for (var k = 0; k < 5; k++) { var z = -0.18 + k * 0.09, n0 = b.count(); b.box(-0.9, 0.42, z - 0.035, 0.9, 0.46, z + 0.035, MT.WOOD); kindTag(b, n0, 1); }
    [-0.75, 0.75].forEach(function (x) { b.box(x - 0.02, 0, -0.2, x + 0.02, 0.42, -0.17, MT.ANOD); b.box(x - 0.02, 0, 0.17, x + 0.02, 0.42, 0.2, MT.ANOD); b.box(x - 0.02, 0.38, -0.2, x + 0.02, 0.42, 0.2, MT.ANOD); });
  }); }
  function espressoMachine() { return furn("espresso", function (b) {
    b.box(-0.35, 0, -0.26, 0.35, 0.42, 0.26, MT.STEEL); b.box(-0.36, 0.42, -0.27, 0.36, 0.45, 0.27, MT.ANOD);
    b.box(-0.3, 0.02, -0.33, 0.3, 0.05, -0.26, MT.STEEL);
    [-0.16, 0.16].forEach(function (x) {
      latheOn(b, x, 0.26, -0.27, [[0.05, 0], [0.05, 0.06], [0.035, 0.08]], 14, MT.STEEL, 0);
      b.box(x - 0.012, 0.25, -0.46, x + 0.012, 0.27, -0.3, MT.PLASTIC);
    });
    b.box(-0.02, 0.36, -0.28, 0.02, 0.4, -0.26, MT.PLASTIC);
    tubeAlong(b, [new THREE.Vector3(0.3, 0.33, -0.27), new THREE.Vector3(0.33, 0.25, -0.33), new THREE.Vector3(0.33, 0.12, -0.33)], 0.008, 5, MT.STEEL);
    for (var k = 0; k < 6; k++) { var n0 = b.count(); latheOn(b, -0.25 + k * 0.1, 0.45, 0.05, [[0.0, 0], [0.035, 0], [0.042, 0.06], [0.0, 0.06]], 12, MT.CERAMIC, 0); }
    for (k = 0; k < b.count(); k++) if (b.m[k] === MT.PLASTIC) b.f2[k * 2] = 1;
  }); }
  function grinder() { return furn("grinder", function (b) {
    b.box(-0.1, 0, -0.14, 0.1, 0.36, 0.14, MT.ANOD); b.box(-0.06, 0.12, -0.18, 0.06, 0.16, -0.14, MT.STEEL);
    latheOn(b, 0, 0.36, 0, [[0.05, 0], [0.09, 0.2], [0.095, 0.24], [0.0, 0.25]], 16, MT.DKGLASS, 0);
  }); }

  // ---- the rooms: floor, ceiling, back wall, cross walls with doors and steps, end walls ----
  function wingInterior(B, sg) {
    var R = wingRooms(sg), uB = WG.uB;
    B.zone = ZONE.WING;
    R.forEach(function (rm, idx) {
      var fa = idx === 0 ? WG.sA + WG.ei : rm.s0, fb = idx === R.length - 1 ? WG.sB - WG.ei : rm.s1, ns = Math.max(4, Math.ceil((fb - fa) / 0.3)), fm = FLOORM[rm.kind], wc = WALLC[rm.kind];
      var e0 = idx === 0 ? fa : rm.s0 + 0.1, e1 = idx === R.length - 1 ? fb : rm.s1 - 0.1, ne = Math.max(4, Math.ceil((e1 - e0) / 0.3));
      // floor
      B.surf(ns, 20, function (i, j, q) { var s = lerp(fa, fb, i / ns), u = lerp(-0.02, 5.9, j / 20), p = wingXZ(sg, u, s); q.p[0] = p.x; q.p[1] = rm.y; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = u; q.f2[1] = fm[1]; q.m = fm[0]; });
      // ceiling: the underside of the roof shell
      B.surf(ne, 16, function (i, j, q) { var s = lerp(e0, e1, i / ne), u = lerp(0, uB + 0.05, j / 16), p = roofPt(sg, s, roofT(u), true); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.f[0] = s; q.f[1] = u; q.m = MT.PLASTER; });
      B.orient(B.count() - (ne + 1) * 17, function () { return [0, -1, 0]; });
      // back wall and its skirting
      var bn = acrossDir(sg, (e0 + e1) / 2);
      B.surf(ne, 10, function (i, j, q) { var s = lerp(e0, e1, i / ne), p = wingXZ(sg, uB, s), yt = roofYAt(sg, s, uB, true), y = lerp(rm.y, yt, j / 10); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [-bn.x, 0, -bn.z]; q.f[0] = s; q.f[1] = y; q.f2[1] = wc; q.m = MT.PLASTER; });
      B.surf(ne, 1, function (i, j, q) { var s = lerp(e0, e1, i / ne), p = wingXZ(sg, uB - 0.015, s); q.p[0] = p.x; q.p[1] = rm.y + 0.09 * j; q.p[2] = p.z; q.nn = [-bn.x, 0, -bn.z]; q.f[0] = s; q.f[1] = j * 0.09; q.f2[1] = 2; q.m = MT.WOOD; });
      // the wall to the next room, with its door (and steps where the floors differ)
      if (idx < R.length - 1) crossWall(B, sg, rm, R[idx + 1]);
      // pendant lights in two rows
      var nl = Math.max(1, Math.round((e1 - e0 - 1.2) / 2.6));
      for (var k = 0; k < nl; k++) {
        var sl = lerp(e0 + 1.3, e1 - 1.3, nl === 1 ? 0.5 : k / (nl - 1));
        [1.45, 3.75].forEach(function (u) {
          if (rm.kind === "cafe" && sl < 40) return;
          var yc = roofYAt(sg, sl, u, true), yl = Math.min(rm.y + 2.95, yc - 0.3);
          place(B, linearPendant(), sg, sl, u, yl, 0);
          [-0.5, 0.5].forEach(function (d) { var a = wpt(sg, sl + d, u, yl + 0.06), c = wpt(sg, sl + d, u, yc + 0.05); tubeAlong(B, [a, c], 0.003, 3, MT.STEEL); });
          var lp = wpt(sg, sl, u, yl - 0.15); wLight(lp.x, lp.y, lp.z, LAMPC, rm.kind === "library" || rm.kind === "study" ? 1.5 : 2.1, 7.5, [0, -1, 0], 1);
        });
      }
      // light spilling out through the glass onto the courtyard at night
      for (var ss = e0 + 1.5; ss < e1 - 0.5; ss += 4.2) { var sp = wpt(sg, ss, -0.4, rm.y + 2.3), od = acrossDir(sg, ss); extLight(sp.x, sp.y, sp.z, LAMPC, 0.9, 7, [-od.x * 0.75, -0.66, -od.z * 0.75], 1); }
      FURNISH[rm.kind](B, sg, rm, e0, e1);
    });
    endWall(B, sg, WG.sA + WG.ei, 1, R[0]); endWall(B, sg, WG.sB - WG.ei, -1, R[R.length - 1]);
  }
  function endWall(B, sg, se, dirS, rm) {
    var ad = alongDir(sg, se), nrm = [ad.x * dirS, 0, ad.z * dirS], wc = WALLC[rm.kind];
    function ws(u0, u1, n, bottom) { B.surf(n, 8, function (i, j, q) { var u = lerp(u0, u1, i / n), p = wingXZ(sg, u, se), yt = roofYAt(sg, se, u, true), yb = bottom(u), y = lerp(yb, yt, j / 8); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = nrm; q.f[0] = u; q.f[1] = y; q.f2[1] = wc; q.m = MT.PLASTER; }); }
    var flo = function () { return rm.y; };
    if (dirS > 0) {
      var uc = linkU(0, se), ua = uc - LINK.w / LC20, ub = uc + LINK.w / LC20;
      ws(0.03, ua, 5, flo); ws(ub, WG.uB, 3, flo);
      ws(ua, ub, 16, function (u) { var y = linkCutY(sg, se, u); return y === undefined ? rm.y : Math.max(rm.y, y); });
      // the link opening's frame
      var pts = []; for (var i = 0; i <= 24; i++) { var ll = -LINK.w * Math.cos(Math.PI * i / 24), sl = linkSlAt(ll, se); var p = linkXZ(sg, ll * 1.01, sl + 0.02); pts.push(new THREE.Vector3(p.x, linkBase(sg, sl) + linkArch(ll) + 0.02, p.z)); }
      tubeAlong(B, pts, 0.04, 5, MT.ANOD, 3);
    } else ws(0.03, WG.uB, 20, flo);
  }
  function crossWall(B, sg, A, Bm) {
    var w = A.s1, d0 = A.door[0], d1 = A.door[1], yhi = Math.max(A.y, Bm.y), ylo = Math.min(A.y, Bm.y), hD = yhi + 2.2, ad = alongDir(sg, w);
    [[w - 0.1, -1, A], [w + 0.1, 1, Bm]].forEach(function (e) {
      var se = e[0], rm = e[2], nrm = [ad.x * e[1], 0, ad.z * e[1]], wc = WALLC[rm.kind];
      function ws(u0, u1, n, yb) { B.surf(n, 8, function (i, j, q) { var u = lerp(u0, u1, i / n), p = wingXZ(sg, u, se), yt = roofYAt(sg, se, u, true), y = lerp(yb, yt, j / 8); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = nrm; q.f[0] = u; q.f[1] = y; q.f2[1] = wc; q.m = MT.PLASTER; }); }
      ws(0.03, d0, Math.max(3, Math.round(d0 / 0.4)), rm.y); ws(d1, WG.uB, 3, rm.y); ws(d0, d1, 4, hD);
      if (rm.y < yhi - 0.01) B.surf(4, 1, function (i, j, q) { var u = lerp(d0, d1, i / 4), p = wingXZ(sg, u, se); q.p[0] = p.x; q.p[1] = j ? yhi : rm.y; q.p[2] = p.z; q.nn = nrm; q.m = MT.PLASTER; q.f2[1] = wc; });
      // skirting and the door casing
      B.surf(Math.max(3, Math.round(d0 / 0.4)), 1, function (i, j, q) { var u = lerp(0.03, d0 - 0.08, i / Math.max(3, Math.round(d0 / 0.4))), p = wingXZ(sg, u, se + e[1] * 0.012); q.p[0] = p.x; q.p[1] = rm.y + 0.09 * j; q.p[2] = p.z; q.nn = nrm; q.f2[1] = 2; q.m = MT.WOOD; });
      var cs = new Builder(); cs.box(-0.012, 0, -0.07, 0.012, 2.2 + 0.07, 0, MT.WOOD); cs.box(-0.012, 0, d1 - d0, 0.012, 2.27, d1 - d0 + 0.07, MT.WOOD); cs.box(-0.012, 2.2, -0.07, 0.012, 2.27, d1 - d0 + 0.07, MT.WOOD); cs.tag(0, null, 2);
      place(B, cs, sg, se + e[1] * 0.012, d0, yhi, 0);
    });
    // reveals, lintel, threshold
    [[d0, 1], [d1, -1]].forEach(function (e) { var cd = acrossDir(sg, w); B.surf(2, 4, function (i, j, q) { var s = lerp(w - 0.1, w + 0.1, i / 2), p = wingXZ(sg, e[0], s), y = lerp(yhi, hD, j / 4); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [cd.x * e[1], 0, cd.z * e[1]]; q.f2[1] = 0; q.m = MT.PLASTER; }); });
    B.surf(2, 4, function (i, j, q) { var s = lerp(w - 0.1, w + 0.1, i / 2), p = wingXZ(sg, lerp(d0, d1, j / 4), s); q.p[0] = p.x; q.p[1] = hD; q.p[2] = p.z; q.nn = [0, -1, 0]; q.m = MT.PLASTER; });
    B.surf(2, 4, function (i, j, q) { var s = lerp(w - 0.1, w + 0.1, i / 2), p = wingXZ(sg, lerp(d0, d1, j / 4), s); q.p[0] = p.x; q.p[1] = yhi; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = p.x; q.m = MT.TERRAZZO; });
    // steps into the lower room
    var dl = yhi - ylo, nr = dl > 0.05 ? Math.max(1, Math.round(dl / 0.17)) : 0, lowSide = A.y < Bm.y ? -1 : 1;
    A.stepW = { w: w, nr: nr, side: lowSide, yhi: yhi, ylo: ylo };
    for (var k = 1; k < nr; k++) {
      var yt = yhi - dl * k / nr, sa = w + lowSide * (0.1 + 0.3 * (k - 1)), sb = w + lowSide * (0.1 + 0.3 * k), st = new Builder();
      st.box(Math.min(sa, sb) - w, ylo - 0.02, d0 - 0.05, Math.max(sa, sb) - w, yt, d1 + 0.05, MT.TERRAZZO);
      place(B, st, sg, w, 0, 0, 0);
    }
    // door plates: each side names the room beyond
    [[w - 0.1, -1, Bm], [w + 0.1, 1, A]].forEach(function (e) {
      var pi = { math: 0, lobby: 1, lab: 2, seminar: 3, cafe: 4, reception: 5, library: 6, study: 7 }[e[2].kind]; if (pi === undefined) return;
      wpic(B, wingFrame(sg, e[0], d0 - 0.35, yhi + 1.55), [e[1] * 0.012, 0, 0], "z", [e[1], 0], 0.4, 0.1, atlasSub("plates", pi / 8, 0.03, (pi + 1) / 8, 0.97), MT.ATLAS, [0, 0]);
    });
  }

  // ---- what is in each room ----
  var FURNISH = {
    foyer: function (B, sg, rm, e0, e1) {
      place(B, bench(), sg, (e0 + e1) / 2 + 0.2, 1.1, rm.y, 0); obst(sg, (e0 + e1) / 2 - 0.7, (e0 + e1) / 2 + 1.1, 0.8, 1.4);
      var sp = new Builder(); sp.box(-0.84, -0.44, -0.02, 0.84, 0.44, 0.0, MT.ANOD); place(B, sp, sg, (e0 + e1) / 2, WG.uB - 0.001, rm.y + 1.65, 0);
      wpic(B, wingFrame(sg, (e0 + e1) / 2, WG.uB - 0.001, rm.y + 1.65), [0, 0, -0.024], "x", [0, -1], 1.6, 0.8, ATL[sg > 0 ? "signR" : "signL"], MT.ATLAS, [0, 0]);
    },
    math: function (B, sg, rm) {
      [39.8, 41.4, 43.0, 44.6].forEach(function (s) { [1.2, 3.0].forEach(function (u) {
        place(B, studentDesk(), sg, s, u, rm.y, 0); obst(sg, s - 0.3, s + 0.3, u - 0.7, u + 0.7);
        [-0.35, 0.35].forEach(function (d) { place(B, schoolChair(3), sg, s - 0.55, u + d, rm.y, 0); });
      }); });
      place(B, teacherDesk(), sg, 46.9, 1.6, rm.y, Math.PI); obst(sg, 46.5, 47.3, 0.8, 2.4);
      place(B, officeChair(), sg, 47.5, 1.8, rm.y, Math.PI);
      // whiteboard on the wall ahead of the students
      var wsf = 49 - 0.1 - 0.02, f = negv(alongDir(sg, wsf)), uc = 2.15, P = wpt(sg, wsf, uc, rm.y + 1.5);
      var fr = new Builder(); fr.box(-0.03, -0.62, -1.75, 0.0, 0.62, 1.75, MT.ANOD); fr.box(-0.1, -0.66, -1.6, 0.0, -0.63, 1.6, MT.ANOD); place(B, fr, sg, wsf, uc, rm.y + 1.5, 0);
      wpic(B, wingFrame(sg, wsf, uc, rm.y + 1.5), [-0.034, 0, 0], "z", [-1, 0], 3.4, 1.2, ATL.wb, MT.ATLAS, [0, 2]);
      [[-0.04, MT.PLASTIC, 3], [0.06, MT.PLASTIC, 1], [0.16, MT.PLASTIC, 2]].forEach(function (mk) { var m = new Builder(); m.box(-0.08, 0, -0.008, 0.0, 0.016, 0.008, mk[1]); m.tag(0, mk[2], null); place(B, m, sg, wsf - 0.02, uc + mk[0] * 4, rm.y + 0.855, 0); });
      var wl = wpt(sg, wsf - 1.2, uc, rm.y + 2.6); wLight(wl.x, wl.y, wl.z, LAMPC, 1.2, 4, [f.x * -0.2, -0.4, f.z * -0.2], 1);
    },
    lobby: function (B, sg, rm) {
      var sc = 53, f = negv(acrossDir(sg, sc)), P = wpt(sg, sc, WG.uB - 0.06, rm.y + 1.75);
      var fr = new Builder(); fr.box(-1.25, -0.72, -0.06, 1.25, 0.72, 0.0, MT.ANOD); place(B, fr, sg, sc, WG.uB - 0.001, rm.y + 1.75, 0);
      wpic(B, wingFrame(sg, sc, WG.uB - 0.001, rm.y + 1.75), [0, 0, -0.063], "x", [0, -1], 2.4, 1.35, ATL.scrLobby, MT.SCREEN, [1.1, 0]);
      var sl = wpt(sg, sc, WG.uB - 1.0, rm.y + 1.6); wLight(sl.x, sl.y, sl.z, [0.75, 0.85, 1.0], 0.6, 4);
      [[50.6, 1.2], [55.4, 1.2]].forEach(function (c, i) {
        place(B, armchair(), sg, c[0], c[1], rm.y, i ? Math.PI / 2 - 0.35 : -Math.PI / 2 + 0.35); obst(sg, c[0] - 0.5, c[0] + 0.5, c[1] - 0.5, c[1] + 0.5);
      });
      place(B, sideTable(), sg, 51.8, 0.9, rm.y, 0); place(B, sideTable(), sg, 54.2, 0.9, rm.y, 0);
    },
    lab: function (B, sg, rm) {
      [58.9, 61.3, 63.7].forEach(function (s, r) {
        place(B, labDesk(), sg, s, 2.3, rm.y, 0); obst(sg, s - 0.38, s + 0.38, 0.5, 4.1);
        [-1.2, 0, 1.2].forEach(function (d, k) {
          place(B, officeChair(), sg, s - 0.75, 2.3 + d, rm.y, 0);
          wpic(B, wingFrame(sg, s, 2.3, rm.y), [0.097, 1.17, d], "z", [-1, 0], 0.6, 0.345, ATL["code" + ((k + r) % 3)], MT.SCREEN, [1.0, 0]);
        });
      });
      var wsf = 67 - 0.1 - 0.02, f = negv(alongDir(sg, wsf)), uc = 2.1, P = wpt(sg, wsf, uc, rm.y + 1.65);
      var fr = new Builder(); fr.box(-0.06, -0.8, -1.4, 0.0, 0.8, 1.4, MT.ANOD); place(B, fr, sg, wsf, uc, rm.y + 1.65, 0);
      wpic(B, wingFrame(sg, wsf, uc, rm.y + 1.65), [-0.064, 0, 0], "z", [-1, 0], 2.66, 1.5, ATL.scrLab, MT.SCREEN, [1.0, 0]);
      var sl = wpt(sg, wsf - 1.0, uc, rm.y + 1.6); wLight(sl.x, sl.y, sl.z, [0.75, 0.85, 1.0], 0.7, 5);
      place(B, teacherDesk(), sg, 65.6, 3.4, rm.y, Math.PI); obst(sg, 65.2, 66.0, 2.6, 4.2);
    },
    seminar: function (B, sg, rm) {
      var sc = 72.2, uc = 2.3;
      var tb = furn("oval", function (b) {
        var n0 = b.count(); b.surf(40, 1, function (i, j, q) { var a = i / 40 * 2 * Math.PI, r = j, x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.4) * 1.8 * r, z = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.4) * 0.65 * r; q.p[0] = x; q.p[1] = 0.75; q.p[2] = z; q.nn = [0, 1, 0]; q.f[0] = x; q.f[1] = z; q.m = MT.WOOD; }, true);
        b.surf(40, 1, function (i, j, q) { var a = i / 40 * 2 * Math.PI, x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.4) * 1.8, z = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.4) * 0.65; q.p[0] = x; q.p[1] = 0.72 + 0.03 * j; q.p[2] = z; q.f[0] = a; q.f[1] = j * 0.03; q.m = MT.WOOD; }, true);
        kindTag(b, n0, 2);
        [-1.0, 1.0].forEach(function (x) { b.box(x - 0.25, 0, -0.25, x + 0.25, 0.03, 0.25, MT.ANOD); b.box(x - 0.05, 0.03, -0.05, x + 0.05, 0.72, 0.05, MT.ANOD); });
      });
      place(B, tb, sg, sc, uc, rm.y, 0); obst(sg, sc - 1.85, sc + 1.85, uc - 0.7, uc + 0.7);
      [-1.2, -0.4, 0.4, 1.2].forEach(function (d) { place(B, officeChair(), sg, sc + d, uc - 1.0, rm.y, -Math.PI / 2); place(B, officeChair(), sg, sc + d, uc + 1.0, rm.y, Math.PI / 2); });
      place(B, officeChair(), sg, sc + 2.3, uc, rm.y, Math.PI); place(B, officeChair(), sg, sc - 2.3, uc, rm.y, 0);
      var wsf = WG.sB - WG.ei - 0.02, f = negv(alongDir(sg, wsf)), P = wpt(sg, wsf, uc, rm.y + 1.45);
      var fr = new Builder(); fr.box(-0.06, -0.62, -1.08, 0.0, 0.62, 1.08, MT.ANOD); place(B, fr, sg, wsf, uc, rm.y + 1.45, 0);
      wpic(B, wingFrame(sg, wsf, uc, rm.y + 1.45), [-0.064, 0, 0], "z", [-1, 0], 2.08, 1.17, ATL.scrSem, MT.SCREEN, [1.0, 0]);
      var sl = wpt(sg, wsf - 1.0, uc, rm.y + 1.4); wLight(sl.x, sl.y, sl.z, [0.75, 0.85, 1.0], 0.5, 4);
      place(B, sofa(1, 2.2), sg, 76.3, 4.75, rm.y, 0); obst(sg, 75.2, 77.4, 4.25, 5.25);
    },
    cafe: function (B, sg, rm) {
      var y = rm.y;
      // back bar against the wall, Nero Marquina top, espresso machine and grinder; the menu above
      var bar = furn("backbar", function (b) {
        var n0 = b.count(); b.box(-0.3, 0, -1.5, 0.3, 0.88, 1.5, MT.WOOD); kindTag(b, n0, 2);
        var n1 = b.count(); b.box(-0.32, 0.88, -1.52, 0.32, 0.92, 1.52, MT.MARBLE); kindTag(b, n1, 3);
        [-0.75, 0, 0.75].forEach(function (z) { b.box(-0.305, 0.08, z - 0.36, -0.3, 0.84, z + 0.36, MT.WOOD); b.tag(b.count() - 24, null, 2); b.box(-0.315, 0.62, z - 0.12, -0.305, 0.64, z + 0.12, MT.BRASS); });
        var n2 = b.count(); b.box(-0.02, 1.3, -1.5, 0.3, 1.33, 1.5, MT.WOOD); kindTag(b, n2, 2);
        for (var k = 0; k < 10; k++) { latheOn(b, 0.12, 1.33, -1.3 + k * 0.29, [[0.0, 0], [0.04, 0], [0.045, 0.1], [0.0, 0.1]], 12, MT.CERAMIC, 0); }
      });
      var sb = 37 + 0.1 + 0.31;
      place(B, bar, sg, sb, 2.0, y, Math.PI); obst(sg, 37.0, 37.75, 0.45, 3.55);
      place(B, espressoMachine(), sg, sb, 1.5, y + 0.92, -Math.PI / 2); place(B, grinder(), sg, sb, 2.6, y + 0.92, -Math.PI / 2);
      var wsf = 37 + 0.1 + 0.02, f = alongDir(sg, wsf), P = wpt(sg, wsf, 2.0, y + 2.2);
      var fr = new Builder(); fr.box(0.0, -0.49, -1.55, 0.04, 0.49, 1.55, MT.WOOD); fr.tag(0, null, 2); place(B, fr, sg, wsf, 2.0, y + 2.2, 0);
      wpic(B, wingFrame(sg, wsf, 2.0, y + 2.2), [0.044, 0, 0], "z", [1, 0], 3.0, 0.9, ATL.menu, MT.ATLAS, [0, 3]);
      // front counter: oak slats, Carrara top, a till and a cake stand
      var ctr = furn("counter", function (b) {
        for (var z = -1.45; z < 1.45; z += 0.1) { var n0 = b.count(); b.box(0.24, 0, z, 0.3, 1.02, z + 0.085, MT.WOOD); kindTag(b, n0, 1); }
        var n1 = b.count(); b.box(-0.3, 0, -1.45, 0.24, 0.98, 1.45, MT.WOOD); kindTag(b, n1, 2);
        var n2 = b.count(); b.box(-0.34, 1.02, -1.5, 0.36, 1.06, 1.5, MT.MARBLE); kindTag(b, n2, 0);
        b.box(-0.2, 1.06, 0.8, 0.05, 1.1, 1.1, MT.PLASTIC); b.tag(b.count() - 24, 1, null); b.box(-0.14, 1.1, 0.88, -0.1, 1.34, 1.02, MT.PLASTIC); b.tag(b.count() - 24, 1, null);
        latheOn(b, 0.05, 1.06, -0.6, [[0.0, 0], [0.06, 0], [0.02, 0.1], [0.02, 0.2], [0.17, 0.21], [0.17, 0.23], [0.0, 0.23]], 20, MT.CERAMIC, 0);
      });
      place(B, ctr, sg, 38.95, 2.0, y, 0); obst(sg, 38.6, 39.3, 0.45, 3.55);
      [1.05, 2.0, 2.95].forEach(function (u) { var yc = roofYAt(sg, 38.8, u, true), yl = y + 2.25; place(B, pendantCone(), sg, 38.8, u, yl, 0); tubeAlong(B, [wpt(sg, 38.8, u, yl + 0.28), wpt(sg, 38.8, u, yc + 0.05)], 0.004, 3, MT.ANOD); var lp = wpt(sg, 38.8, u, yl - 0.05); wLight(lp.x, lp.y, lp.z, [1.0, 0.8, 0.58], 1.3, 5, [0, -1, 0], 2); });
      // tables with chairs and cups
      [[41.3, 1.2], [41.3, 3.1], [43.7, 1.2], [43.7, 3.1], [46.1, 1.2], [46.1, 3.1], [48.4, 2.1]].forEach(function (c, i) {
        place(B, roundTable(), sg, c[0], c[1], y, 0); obst(sg, c[0] - 0.4, c[0] + 0.4, c[1] - 0.4, c[1] + 0.4);
        place(B, cafeChair(), sg, c[0] - 0.62, c[1], y, 0); place(B, cafeChair(), sg, c[0] + 0.62, c[1], y, Math.PI);
        if (i % 2 === 0) place(B, cup(), sg, c[0] - 0.12, c[1] + 0.08, y + 0.745, 0);
        if (i % 3 !== 1) place(B, cup(), sg, c[0] + 0.14, c[1] - 0.1, y + 0.745, 0);
        var yc = roofYAt(sg, c[0], c[1], true), yl = y + 2.1; place(B, pendantCone(), sg, c[0], c[1], yl, 0); tubeAlong(B, [wpt(sg, c[0], c[1], yl + 0.28), wpt(sg, c[0], c[1], yc + 0.05)], 0.004, 3, MT.ANOD);
        var lp = wpt(sg, c[0], c[1], yl - 0.05); wLight(lp.x, lp.y, lp.z, [1.0, 0.8, 0.58], 1.1, 4.5, [0, -1, 0], 2);
      });
    },
    reception: function (B, sg, rm) {
      var y = rm.y, sc = 54, cu = 4.9, Rr = 2.1;
      // curved front desk facing the door: oak slat front, Carrara counter top
      var desk = furn("recdesk", function (b) {
        var a0 = -1.0, a1 = 1.0, N = 28;
        for (var k = 0; k < N; k++) { var a = lerp(a0, a1, (k + 0.5) / N), da = (a1 - a0) / N * 0.4, n0 = b.count();
          b.surf(1, 1, function (i, j, q) { var aa = a + (i - 0.5) * da, r = Rr + 0.02; q.p[0] = Math.sin(aa) * r; q.p[1] = j * 1.02; q.p[2] = -Math.cos(aa) * r; q.nn = [Math.sin(aa), 0, -Math.cos(aa)]; q.f[0] = q.p[1]; q.f[1] = aa; q.m = MT.WOOD; }); kindTag(b, n0, 1); }
        var n1 = b.count();
        b.surf(N, 1, function (i, j, q) { var a = lerp(a0, a1, i / N), r = Rr; q.p[0] = Math.sin(a) * r; q.p[1] = j * 1.0; q.p[2] = -Math.cos(a) * r; q.nn = [Math.sin(a), 0, -Math.cos(a)]; q.f[0] = a * r; q.f[1] = q.p[1]; q.m = MT.WOOD; }); kindTag(b, n1, 2);
        b.surf(N, 1, function (i, j, q) { var a = lerp(a0, a1, i / N), r = Rr - 0.55; q.p[0] = Math.sin(a) * r; q.p[1] = j * 1.0; q.p[2] = -Math.cos(a) * r; q.nn = [-Math.sin(a), 0, Math.cos(a)]; q.f[0] = a * r; q.f[1] = q.p[1]; q.m = MT.WOOD; }); kindTag(b, n1, 2);
        var n2 = b.count();
        b.surf(N, 1, function (i, j, q) { var a = lerp(a0 - 0.02, a1 + 0.02, i / N), r = j ? Rr + 0.07 : Rr - 0.62; q.p[0] = Math.sin(a) * r; q.p[1] = 1.02; q.p[2] = -Math.cos(a) * r; q.nn = [0, 1, 0]; q.f[0] = q.p[0]; q.f[1] = q.p[2]; q.m = MT.MARBLE; }); kindTag(b, n2, 0);
        b.surf(N, 1, function (i, j, q) { var a = lerp(a0 - 0.02, a1 + 0.02, i / N), r = Rr + 0.07; q.p[0] = Math.sin(a) * r; q.p[1] = 0.985 + 0.035 * j; q.p[2] = -Math.cos(a) * r; q.nn = [Math.sin(a), 0, -Math.cos(a)]; q.f[0] = q.p[0]; q.f[1] = q.p[1]; q.m = MT.MARBLE; }); kindTag(b, n2, 0);
        [a0, a1].forEach(function (a) { b.surf(1, 1, function (i, j, q) { var r = i ? Rr : Rr - 0.55; q.p[0] = Math.sin(a) * r; q.p[1] = j * 1.0; q.p[2] = -Math.cos(a) * r; q.m = MT.WOOD; q.f2[1] = 2; }); });
        b.box(-0.9, 0.72, -Rr + 0.62, 0.9, 0.75, -Rr + 1.05, MT.WOOD); b.tag(b.count() - 24, null, 2);
      });
      place(B, desk, sg, sc, cu, y, 0); obst(sg, sc - 1.9, sc + 1.9, cu - Rr - 0.15, cu - Rr + 1.1);
      place(B, officeChair(), sg, sc, cu - Rr + 1.4, y, Math.PI / 2);
      // backlit logo on a dark wall panel behind
      var f = negv(acrossDir(sg, sc)), P = wpt(sg, sc, WG.uB - 0.035, y + 2.0);
      var pn = new Builder(); pn.box(-1.9, -0.9, -0.03, 1.9, 0.9, 0.0, MT.PLASTER); pn.tag(0, null, 3); place(B, pn, sg, sc, WG.uB - 0.001, y + 2.0, 0);
      wpic(B, wingFrame(sg, sc, WG.uB - 0.001, y + 2.0), [0, 0, -0.034], "x", [0, -1], 3.2, 1.0, [0, 0, 1, 1], MT.LOGO, [0, 0]);
      var ll = wpt(sg, sc, WG.uB - 0.6, y + 2.0); wLight(ll.x, ll.y, ll.z, [0.95, 0.97, 1.0], 0.7, 4);
      // sofa and table by the window
      place(B, sofa(4, 2.1), sg, 56.6, 2.4, y, 0); obst(sg, 55.5, 57.7, 1.9, 2.9);
      var ct = furn("ctable", function (b) { var n0 = b.count(); b.box(-0.55, 0.36, -0.3, 0.55, 0.4, 0.3, MT.WOOD); [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(function (c) { b.box(c[0] - 0.02, 0, c[1] - 0.02, c[0] + 0.02, 0.36, c[1] + 0.02, MT.WOOD); }); kindTag(b, n0, 2); });
      place(B, ct, sg, 56.6, 1.35, y, 0); obst(sg, 56.0, 57.2, 1.0, 1.7);
    },
    library: function (B, sg, rm, e0, e1) { shelvesAlongBack(B, sg, rm, e0, e1);
      [[60.6, 2.0], [64.6, 2.0]].forEach(function (c) {
        var tbl = furn("ltable", function (b) { var n0 = b.count(); b.box(-1.2, 0.72, -0.45, 1.2, 0.76, 0.45, MT.WOOD); [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]].forEach(function (d) { b.box(d[0] - 0.04, 0, d[1] - 0.04, d[0] + 0.04, 0.72, d[1] + 0.04, MT.WOOD); }); kindTag(b, n0, 1); });
        place(B, tbl, sg, c[0], c[1], rm.y, 0); obst(sg, c[0] - 1.2, c[0] + 1.2, c[1] - 0.45, c[1] + 0.45);
        [-0.8, 0, 0.8].forEach(function (d) { place(B, cafeChair(), sg, c[0] + d, c[1] - 0.72, rm.y, -Math.PI / 2); place(B, cafeChair(), sg, c[0] + d, c[1] + 0.72, rm.y, Math.PI / 2); });
        [-0.8, 0.8].forEach(function (d) { place(B, bankerLamp(), sg, c[0] + d, c[1], rm.y + 0.76, 0); var lp = wpt(sg, c[0] + d, c[1], rm.y + 1.0); wLight(lp.x, lp.y, lp.z, [1.0, 0.82, 0.6], 0.35, 2.4, [0, -1, 0], 1); });
      });
    },
    study: function (B, sg, rm, e0, e1) { shelvesAlongBack(B, sg, rm, e0, e1);
      [[70.5, 1.6], [74.5, 1.6]].forEach(function (c) {
        var rug = new Builder(); rug.box(-1.3, 0.0, -1.0, 1.3, 0.012, 1.0, MT.FABRIC); rug.tag(0, 3, null); place(B, rug, sg, c[0], c[1] + 0.3, rm.y, 0);
        place(B, armchair(), sg, c[0] - 0.8, c[1] + 0.3, rm.y, -Math.PI / 2); place(B, armchair(), sg, c[0] + 0.8, c[1] + 0.3, rm.y, Math.PI / 2);
        obst(sg, c[0] - 1.25, c[0] - 0.35, c[1] - 0.15, c[1] + 0.75); obst(sg, c[0] + 0.35, c[0] + 1.25, c[1] - 0.15, c[1] + 0.75);
        place(B, sideTable(), sg, c[0], c[1] + 0.3, rm.y, 0); place(B, floorLamp(), sg, c[0] - 0.8, c[1] + 1.05, rm.y, 0);
        var lp = wpt(sg, c[0] - 0.8, c[1] + 1.05, rm.y + 1.25); wLight(lp.x, lp.y, lp.z, [1.0, 0.8, 0.58], 0.6, 3.5);
      });
    }
  };
  // bookshelves along the back wall, filled with books (pictures on the shelf fronts)
  function shelvesAlongBack(B, sg, rm, e0, e1) {
    var n = Math.floor((e1 - e0 - 0.4) / 0.92);
    for (var k = 0; k < n; k++) {
      var s = e0 + 0.2 + 0.46 + k * 0.92; place(B, bookshelf(), sg, s, WG.uB - 0.2, rm.y, 0);
      var f = negv(acrossDir(sg, s));
      [0.08, 0.522, 0.942, 1.362, 1.782].forEach(function (y, r) {
        var h = r === 4 ? 0.36 : 0.4, o = ((k * 5 + r) * 0.137) % 0.55;
        wpic(B, wingFrame(sg, s, WG.uB - 0.2, rm.y), [0, y + 0.022 + (h - 0.03) / 2, -0.15], "x", [0, -1], 0.84, h - 0.03, atlasSub("books", o, 0.0, o + 0.45, 1.0), MT.ATLAS, [0, 4]);
      });
    }
    obst(sg, e0, e1, WG.uB - 0.4, WG.uB);
  }

  // ---- walking in the wings and the links: undefined outside, NaN where blocked, else the floor height ----
  function wingSupport(x, z, yf) {
    var o = palLoc(x, z, {}), s = o.rad;
    for (var sg = -1; sg <= 1; sg += 2) {
      var L = linkLoc(sg, o.lat, o.rad);
      if (L.sl > PAL.ringOut + 0.3 && Math.abs(L.ll) < LINK.wo + 0.3) {
        var sEnd = linkSlAt(L.ll, WG.sA + WG.ei);
        if (L.sl < sEnd) return Math.abs(L.ll) < LINK.w - 0.35 ? linkFloorY(sg, L.sl) : NaN;
      }
      if (s < WG.sA - WG.ew - 0.3 || s > WG.sB + WG.ew + 0.3) continue;
      var u = sg * o.lat - latf(s);
      if (u < -0.3 || u > WG.D + 0.3) continue;
      var R = wingRooms(sg), ri = wingRoomIdx(sg, s), rm = R[ri];
      // the entrance and its steps
      if (rm.entry && Math.abs(s - rm.entry) < 1.1 && u < 0.3) {
        if (u >= -0.3) return rm.y;
        return undefined;
      }
      if (rm.entry && rm.stepN && Math.abs(s - rm.entry) < 1.4 && u < -0.14 && u > -0.14 - rm.stepN * 0.34 - 0.1) {
        var k = Math.ceil((-0.14 - u) / 0.34); return rm.stepG + (rm.y - rm.stepG) * (rm.stepN - k + 1) / rm.stepN;
      }
      if (u < -0.18) continue;
      if (u < 0.25 || u > WG.uB - 0.25) return NaN;                     // facade, back wall and the roof behind it
      if (s < WG.sA + WG.ei + 0.25) {                                    // end wall at the dome end: the link comes through here
        var Lk = linkLoc(sg, o.lat, o.rad); if (Math.abs(Lk.ll) < LINK.w - 0.35) return linkFloorY(sg, Lk.sl);
        return NaN;
      }
      if (s > WG.sB - WG.ei - 0.25) return NaN;
      for (var i = 0; i < R.length - 1; i++) {                          // walls between rooms, their doors and steps
        var w = R[i].s1, d = R[i].door;
        if (Math.abs(s - w) < 0.25) { if (u > d[0] + 0.25 && u < d[1] - 0.25) return Math.max(R[i].y, R[i + 1].y); return NaN; }
        var sw = R[i].stepW;
        if (sw && sw.nr > 1 && u > d[0] - 0.05 && u < d[1] + 0.05) {
          var dd = (s - w) * sw.side - 0.1;
          if (dd >= 0 && dd < 0.3 * (sw.nr - 1)) { var kk = Math.floor(dd / 0.3) + 1; return sw.yhi - (sw.yhi - sw.ylo) * kk / sw.nr; }
        }
      }
      var ob = WING_OBST[sg > 0 ? "1" : "-1"];
      for (i = 0; i < ob.length; i++) { var b = ob[i]; if (s > b[0] - 0.22 && s < b[1] + 0.22 && u > b[2] - 0.22 && u < b[3] + 0.22) return NaN; }
      return rm.y;
    }
    return undefined;
  }
  function wingInside(x, z) {
    var o = palLoc(x, z, {}), s = o.rad;
    for (var sg = -1; sg <= 1; sg += 2) {
      var L = linkLoc(sg, o.lat, o.rad); if (L.sl > PAL.ringOut && L.sl < linkSlAt(L.ll, WG.sA) && Math.abs(L.ll) < LINK.w) return 0.8;
      if (s < WG.sA || s > WG.sB) continue; var u = sg * o.lat - latf(s);
      if (u > 0 && u < WG.uB) return smoothstep(0, 1.2, u);
    }
    return 0;
  }
  function wingAt(x, z) {                  // which wing you are in (1 classroom wing, -1 café wing), 0 if in neither
    var o = palLoc(x, z, {}), s = o.rad; if (s < WG.sA + 0.3 || s > WG.sB - 0.3) return 0;
    for (var sg = -1; sg <= 1; sg += 2) { var u = sg * o.lat - latf(s); if (u > 0.4 && u < WG.uB - 0.2) return sg; }
    return 0;
  }
