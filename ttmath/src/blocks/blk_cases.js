  /* ===================== The corridors: display cases of the students' models, and the safety fittings (v0.44) ===================== */
  // CP-30 ("details for each classroom/area, also real feeling of the campus"). The program is in campus_rooms.py:
  // RING_CASES, glazed oak cases on the lower corridor's back wall between the prints, each holding models a class made;
  // RING_SAFETY, what every real corridor has: fire extinguisher cabinets with their signs, call points by the stair doors,
  // smoke detectors and sprinkler heads on the ceilings.
  var CASE = { w: 1.6, h: 1.0, d: 0.32, y0: 0.95, shelf: 0.5 };
  function cv3(x, y, z) { return new THREE.Vector3(x, y, z); }
  // a solid turned to stand on its first face (the face's normal turned straight down), then turned by yaw
  function faceDown(g, yaw) {
    g = g.index ? g.toNonIndexed() : g.clone(); var P = g.attributes.position, a = cv3(P.getX(0), P.getY(0), P.getZ(0)), e1 = cv3(P.getX(1), P.getY(1), P.getZ(1)).sub(a), e2 = cv3(P.getX(2), P.getY(2), P.getZ(2)).sub(a);
    var n = e1.cross(e2).normalize(); if (n.dot(a) < 0) n.negate();
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(n, cv3(0, -1, 0)))); if (yaw) g.rotateY(yaw); return g;
  }
  // a three.js solid standing on a face on y = base at (x, z), in a plastic colour
  function restOn(b, g, x, base, z, yaw, col) {
    g = faceDown(g, yaw); g.computeBoundingBox();
    var n0 = b.count(); b.geo(g, new THREE.Matrix4().makeTranslation(x, base - g.boundingBox.min.y, z), MT.PLASTIC); b.tag(n0, col, null);
  }
  // the models, in the case's frame: x along the wall, y up from the case's bottom, z out from its back (0.01 to 0.31)
  function caseModels(theme) { return furn("case_" + theme, function (b) {
    var lo = 0.07, hi = CASE.shelf + 0.006, zc = 0.165;
    if (theme === "platonic") {                         // folded card: three above, two below, each on its face
      restOn(b, new THREE.TetrahedronGeometry(0.085), -0.45, hi, zc, 0.4, 2);
      restOn(b, new THREE.BoxGeometry(0.11, 0.11, 0.11), 0, hi, zc, 0.5, 3);
      restOn(b, new THREE.OctahedronGeometry(0.08), 0.45, hi, zc, 0.3, 4);
      restOn(b, new THREE.DodecahedronGeometry(0.1), -0.3, lo, zc, 0.3, 6);
      restOn(b, new THREE.IcosahedronGeometry(0.1), 0.3, lo, zc, 0.2, 0);
    } else if (theme === "knots") {                     // a trefoil knot and a torus on stands above, a Moebius strip below
      [[-0.35, new THREE.TorusKnotGeometry(0.08, 0.021, 140, 10, 2, 3), 3], [0.35, new THREE.TorusGeometry(0.075, 0.03, 18, 44), 4]].forEach(function (m) {
        var cy = hi + 0.03 + 0.13, n0 = b.count(); b.geo(m[1], new THREE.Matrix4().makeTranslation(m[0], cy, zc), MT.PLASTIC); b.tag(n0, m[2], null);
        b.box(m[0] - 0.05, hi, zc - 0.04, m[0] + 0.05, hi + 0.02, zc + 0.04, MT.WOOD); tubeAlong(b, [cv3(m[0], hi + 0.02, zc - 0.035), cv3(m[0], cy - 0.07, zc - 0.035)], 0.003, 6, MT.STEEL);
      });
      var R0 = 0.13, Wd = 0.045, cyM = lo + 0.03 + 0.17;
      b.box(-0.06, lo, zc - 0.04, 0.06, lo + 0.02, zc + 0.04, MT.WOOD); tubeAlong(b, [cv3(0, lo + 0.02, zc - 0.035), cv3(0, cyM - R0 + 0.01, zc - 0.035)], 0.003, 6, MT.STEEL);
      [-1, 1].forEach(function (sd) {                    // the strip, a card 3 mm thick: two sheets
        var n0 = b.count();
        b.surf(72, 2, function (i, j, q) {
          var u = (sd > 0 ? i : 72 - i) / 72 * 2 * Math.PI, v = (j / 2 * 2 - 1) * Wd, c = Math.cos(u / 2), s = Math.sin(u / 2);
          var px = (R0 + v * c) * Math.cos(u), py = (R0 + v * c) * Math.sin(u), pz = v * s;
          var nx = Math.cos(u) * s, ny = Math.sin(u) * s, nz = -c, k = sd * 0.0015;   // the strip's normal: d/du x d/dv, unit near the middle
          var v = cv3(px + nx * k, py + ny * k, pz + nz * k).applyEuler(new THREE.Euler(0.85, 0.4, 0));   // turned so the twist faces the corridor
          q.p[0] = v.x; q.p[1] = cyM + v.y; q.p[2] = zc + v.z * 0.9; q.m = MT.PLASTIC;
        });
        b.tag(n0, 2, null);
      });
    } else if (theme === "fractal") {                   // 3D-printed: a Sierpinski tetrahedron and a Menger sponge, two steps each
      function sier(n0, p, e, lev) {                     // a tetrahedron with its base on y = p.y, centred on p, edge e
        if (lev === 0) { restOn(b, new THREE.TetrahedronGeometry(e * Math.sqrt(3 / 8)), p.x, p.y, p.z, 0, 0); return; }
        var h = e * Math.sqrt(2 / 3), r = e / Math.sqrt(3) / 2;
        [[0, r * 2], [-e / 4, -r], [e / 4, -r]].forEach(function (c) { sier(n0, cv3(p.x + c[0], p.y, p.z + c[1] * 0.5 - r * 0.0), e / 2, lev - 1); });
        sier(n0, cv3(p.x, p.y + h / 2, p.z + r * 0.0), e / 2, lev - 1);
      }
      function menger(c, s, lev) {                        // a cube of side s centred on c
        if (lev === 0) { var n0 = b.count(); b.box(c.x - s / 2, c.y - s / 2, c.z - s / 2, c.x + s / 2, c.y + s / 2, c.z + s / 2, MT.PLASTIC); b.tag(n0, 3, null); return; }
        for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) for (var k = -1; k <= 1; k++) if (Math.abs(i) + Math.abs(j) + Math.abs(k) > 1) menger(cv3(c.x + i * s / 3, c.y + j * s / 3, c.z + k * s / 3), s / 3, lev - 1);
      }
      sier(0, cv3(-0.36, hi, zc), 0.2, 2); sier(0, cv3(-0.36, lo, zc), 0.3, 3);
      menger(cv3(0.36, hi + 0.09, zc), 0.18, 1); menger(cv3(0.36, lo + 0.135, zc), 0.27, 2);
    } else if (theme === "ruled") {                     // string models: a hyperboloid between two oak rings, a saddle in a skew oak frame
      var rr = 0.13, y0 = lo + 0.06, y1 = lo + 0.66, xh = -0.36;
      [y0, y1].forEach(function (yy) { b.geo(new THREE.TorusGeometry(rr, 0.008, 6, 48), new THREE.Matrix4().makeTranslation(xh, yy, zc).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), MT.WOOD); });
      [0, 2.094, 4.189].forEach(function (t) { tubeAlong(b, [cv3(xh + Math.cos(t) * (rr + 0.012), lo, zc + Math.sin(t) * (rr + 0.012)), cv3(xh + Math.cos(t) * (rr + 0.012), y1, zc + Math.sin(t) * (rr + 0.012))], 0.004, 6, MT.STEEL); });
      b.geo(new THREE.CylinderGeometry(rr + 0.03, rr + 0.03, 0.02, 32), new THREE.Matrix4().makeTranslation(xh, lo + 0.01, zc), MT.WOOD);
      for (var s = 0; s < 32; s++) { var t0 = s / 32 * 2 * Math.PI, t1 = t0 + 2 * Math.PI / 3;
        tubeAlong(b, [cv3(xh + Math.cos(t0) * rr, y0, zc + Math.sin(t0) * rr), cv3(xh + Math.cos(t1) * rr, y1, zc + Math.sin(t1) * rr)], 0.0012, 4, MT.PLASTIC, 21); }
      var xs = 0.36, A = cv3(xs - 0.17, lo + 0.12, zc - 0.11), Bq = cv3(xs + 0.17, lo + 0.62, zc - 0.11), Cq = cv3(xs + 0.17, lo + 0.12, zc + 0.11), Dq = cv3(xs - 0.17, lo + 0.62, zc + 0.11);
      [[A, Bq], [Bq, Cq], [Cq, Dq], [Dq, A]].forEach(function (e) { tubeAlong(b, [e[0], e[1]], 0.007, 6, MT.WOOD); });
      b.geo(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 24), new THREE.Matrix4().makeTranslation(xs, lo + 0.01, zc), MT.WOOD);
      [A, Cq].forEach(function (c) { tubeAlong(b, [cv3(xs, lo + 0.02, zc), c], 0.004, 6, MT.STEEL); });     // two rods up to the frame's low corners
      for (var q = 1; q < 14; q++) { var f = q / 14;               // the two families of straight lines
        tubeAlong(b, [A.clone().lerp(Bq, f), Dq.clone().lerp(Cq, f)], 0.0012, 4, MT.PLASTIC, 3);
        tubeAlong(b, [Bq.clone().lerp(Cq, f), A.clone().lerp(Dq, f)], 0.0012, 4, MT.PLASTIC, 21); }
    } else if (theme === "soma") {                      // above, the cube put together in oak; below, the seven pieces laid out
      var u = 0.052, gp = 0.002;
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) {
        var n0 = b.count(); b.box(-1.5 * u + i * u + gp / 2, hi + j * u + gp / 2, zc - 1.5 * u + k * u + gp / 2, -1.5 * u + (i + 1) * u - gp / 2, hi + (j + 1) * u - gp / 2, zc - 1.5 * u + (k + 1) * u - gp / 2, MT.WOOD); b.tag(n0, null, (i + j * 2 + k) % 3);
      }
      var PIECES = [[[0, 0, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1]], [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]],
                    [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1]], [[0, 1, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]]], PC = [2, 3, 4, 6, 0, 1, 21];
      PIECES.forEach(function (pc, n) { var ox = -0.66 + n * 0.2;
        pc.forEach(function (c) { var nn = b.count(); b.box(ox + c[0] * u + gp / 2, lo + c[1] * u + gp / 2, zc - u + c[2] * u + gp / 2, ox + (c[0] + 1) * u - gp / 2, lo + (c[1] + 1) * u - gp / 2, zc - u + (c[2] + 1) * u - gp / 2, MT.PLASTIC); b.tag(nn, PC[n], null); }); });
    } else if (theme === "galton") {                    // an oak board standing in the case: a hopper, ten rows of pins, eleven bins of beads
      var zb = 0.1, xw = 0.3, top = 0.86, nr = 10, sp = 0.042, yp0 = 0.66;
      var nwb = b.count(); b.box(-xw, lo, zb - 0.02, xw, top, zb, MT.PLASTIC); b.tag(nwb, 0, null);
      var nfr = b.count(); b.box(-xw - 0.03, lo, zb - 0.02, -xw, top, zb + 0.07, MT.WOOD); b.box(xw, lo, zb - 0.02, xw + 0.03, top, zb + 0.07, MT.WOOD); b.box(-xw - 0.03, top, zb - 0.02, xw + 0.03, top + 0.03, zb + 0.07, MT.WOOD);
      b.box(-xw - 0.05, lo - 0.0, zb - 0.06, xw + 0.05, lo + 0.03, zb + 0.1, MT.WOOD); b.tag(nfr, null, 1);
      [-1, 1].forEach(function (sd) { var p0 = cv3(sd * xw, top - 0.02, zb + 0.03), p1 = cv3(sd * 0.03, yp0 + 0.07, zb + 0.03); tubeAlong(b, [p0, p1], 0.008, 6, MT.WOOD); });
      for (var rw = 0; rw < nr; rw++) for (var pn = 0; pn <= rw; pn++) {
        var px = (pn - rw / 2) * sp, py = yp0 - rw * 0.032; b.geo(new THREE.CylinderGeometry(0.0035, 0.0035, 0.06, 5, 1, true), new THREE.Matrix4().makeTranslation(px, py, zb + 0.03).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), MT.STEEL);
      }
      var bead = new THREE.IcosahedronGeometry(0.0085, 0), C10 = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1], yb0 = lo + 0.035;
      for (var bn = 0; bn <= nr; bn++) {
        var bx = (bn - nr / 2) * sp; if (bn < nr) b.box(bx + sp / 2 - 0.002, yb0, zb, bx + sp / 2 + 0.002, yb0 + 0.24, zb + 0.06, MT.WOOD);
        for (var hb = 0; hb < Math.round(C10[bn] / 252 * 13); hb++) for (var cb = 0; cb < 2; cb++) b.geo(bead, new THREE.Matrix4().makeTranslation(bx + (cb - 0.5) * 0.018, yb0 + 0.009 + hb * 0.017, zb + 0.02 + cb * 0.02), MT.STEEL);
      }
      for (var hp = 0; hp < 30; hp++) { var ax = (hp % 6 - 2.5) * 0.017 * (1 - Math.floor(hp / 6) * 0.15), ay = top - 0.05 - Math.floor(hp / 6) * 0.016; b.geo(bead, new THREE.Matrix4().makeTranslation(ax, ay, zb + 0.02 + (hp % 2) * 0.02), MT.STEEL); }
    } else if (theme === "geodesic") {                  // straws and connectors: a dome on the case's floor, a small icosahedron beside it
      function struts(geo, R, cx, base, cz, keep, dome) {
        var P = geo.attributes.position, pts = [], key = {}, edges = [];
        function vid(x, y, z) { var k = Math.round(x * 1e4) + "," + Math.round(y * 1e4) + "," + Math.round(z * 1e4); if (!(k in key)) { key[k] = pts.length; pts.push(cv3(x, y, z)); } return key[k]; }
        for (var f = 0; f < P.count; f += 3) { var ids = [0, 1, 2].map(function (o) { return vid(P.getX(f + o), P.getY(f + o), P.getZ(f + o)); });
          [[0, 1], [1, 2], [2, 0]].forEach(function (e) { var a0 = Math.min(ids[e[0]], ids[e[1]]), a1 = Math.max(ids[e[0]], ids[e[1]]), ek = a0 + "-" + a1; if (!key["e" + ek]) { key["e" + ek] = 1; edges.push([a0, a1]); } }); }
        var lens = edges.map(function (e) { return pts[e[0]].distanceTo(pts[e[1]]); }), mid = (Math.min.apply(null, lens) + Math.max.apply(null, lens)) / 2;
        var miny = Math.min.apply(null, pts.filter(function (p) { return p.y >= keep; }).map(function (p) { return p.y; }));
        function at(p) { return cv3(cx + p.x, base + (p.y - miny), cz + p.z); }
        edges.forEach(function (e, i) { var p = pts[e[0]], q = pts[e[1]]; if (p.y < keep || q.y < keep) return; tubeAlong(b, [at(p), at(q)], 0.0028, 5, MT.PLASTIC, lens[i] > mid ? 3 : 21); });
        pts.forEach(function (p) { if (p.y < keep) return; var n0 = b.count(); b.geo(new THREE.OctahedronGeometry(0.0075), new THREE.Matrix4().makeTranslation(at(p).x, at(p).y, at(p).z), MT.PLASTIC); b.tag(n0, 1, null); });
      }
      struts(new THREE.IcosahedronGeometry(0.3, 1), 0.3, -0.25, lo, zc, -0.07, true);
      struts(faceDown(new THREE.IcosahedronGeometry(0.1, 0), 0.3), 0.1, 0.48, lo, zc, -1, false);
    }
  }); }
  function ringCases(W) {
    var C = CRS, D = D2R, w = CASE.w, h = CASE.h, d = CASE.d;
    (P2.ring.cases || []).forEach(function (cs) {
      var y = C.yL, a = cs.a * D, rw = C.r0 + 0.02, M = crsFrame(rw, a, y + CASE.y0), b = new Builder();
      b.box(-w / 2, 0, 0, w / 2, 0.07, d, MT.WOOD); b.box(-w / 2, h - 0.08, 0, w / 2, h, d, MT.WOOD);
      b.box(-w / 2, 0.07, 0, -w / 2 + 0.04, h - 0.08, d, MT.WOOD); b.box(w / 2 - 0.04, 0.07, 0, w / 2, h - 0.08, d, MT.WOOD); b.tag(0, null, 1);
      var nf = b.count(); b.box(-w / 2 + 0.04, 0.07, 0, w / 2 - 0.04, h - 0.08, 0.01, MT.FABRIC); b.tag(nf, 7, null);
      b.box(-0.2, 0.015, d + 0.001, 0.2, 0.055, d + 0.006, MT.BRASS);
      b.geo(addF2(new THREE.BoxGeometry(w - 0.12, 0.01, 0.025), 1.5, 0), new THREE.Matrix4().makeTranslation(0, h - 0.087, d - 0.05), MT.LIGHT, 1);
      b.add(caseModels(cs.theme), new THREE.Matrix4());
      W.add(b, M);
      var gb = new Builder();
      gb.surf(1, 1, function (i, j, q) { q.p[0] = (i - 0.5) * (w - 0.08); q.p[1] = lerp(0.07, h - 0.08, j); q.p[2] = d; q.nn = [0, 0, 1]; q.f2[0] = CASE.y0 + lerp(0.07, h - 0.08, j); q.f2[1] = 1; q.m = 0; });
      if (cs.theme === "galton") gb.surf(1, 1, function (i, j, q) { q.p[0] = (i - 0.5) * 0.6; q.p[1] = lerp(0.07, 0.86, j); q.p[2] = 0.165; q.nn = [0, 0, 1]; q.f2[0] = CASE.y0 + lerp(0.07, 0.86, j); q.f2[1] = 1; q.m = 0; });
      else if (cs.theme !== "ruled" && cs.theme !== "geodesic") gb.surf(1, 1, function (i, j, q) { q.p[0] = (i - 0.5) * (w - 0.08); q.p[1] = CASE.shelf; q.p[2] = lerp(0.01, d - 0.005, j); q.nn = [0, 1, 0]; q.f2[0] = CASE.y0 + CASE.shelf; q.f2[1] = 1; q.m = 0; });
      CRS_GLASS.add(gb, M);
      var lp = cv3(0, h - 0.13, d * 0.55).applyMatrix4(M); wLight(lp.x, lp.y, lp.z, LAMPC, 0.75, 1.6, [0, -1, 0], 1.0);
      crsObst(rw, rw + d + 0.08, a - (w / 2 + 0.05) / rw, a + (w / 2 + 0.05) / rw, "lower");
    });
  }
  // ---- safety: on a wall, the back at z = 0, facing +z ----
  function extCabinet() { return furn("extcab", function (b) {          // 0.55 wide, 0.85 high (its top at y = 0), 0.2 deep, a glass door
    var w = 0.55, h = 0.85, d = 0.2;
    b.box(-w / 2, -h, 0, w / 2, -h + 0.03, d, MT.STEEL); b.box(-w / 2, -0.03, 0, w / 2, 0, d, MT.STEEL); b.box(-w / 2, -h, 0, -w / 2 + 0.025, 0, d, MT.STEEL); b.box(w / 2 - 0.025, -h, 0, w / 2, 0, d, MT.STEEL);
    var nb = b.count(); b.box(-w / 2 + 0.025, -h + 0.03, 0, w / 2 - 0.025, -0.03, 0.008, MT.PLASTIC); b.tag(nb, 0, null);
    b.box(-w / 2, -h, d, w / 2, -h + 0.04, d + 0.012, MT.STEEL); b.box(-w / 2, -0.04, d, w / 2, 0, d + 0.012, MT.STEEL);
    b.box(-w / 2, -h + 0.04, d, -w / 2 + 0.04, -0.04, d + 0.012, MT.STEEL); b.box(w / 2 - 0.04, -h + 0.04, d, w / 2, -0.04, d + 0.012, MT.STEEL);
    b.box(w / 2 - 0.08, -0.5, d + 0.012, w / 2 - 0.065, -0.36, d + 0.03, MT.STEEL);
    latheOn(b, 0, -h + 0.035, 0.1, [[0, 0], [0.07, 0], [0.074, 0.012], [0.074, 0.44], [0.058, 0.48], [0.024, 0.5], [0, 0.5]], 20, MT.PLASTIC, 21);
    var nv = b.count(); b.box(-0.022, -h + 0.535, 0.078, 0.022, -h + 0.6, 0.122, MT.PLASTIC); b.tag(nv, 1, null);
    b.box(-0.075, -h + 0.585, 0.093, 0.03, -h + 0.596, 0.107, MT.STEEL);
    tubeAlong(b, [cv3(0.022, -h + 0.56, 0.1), cv3(0.085, -h + 0.5, 0.115), cv3(0.095, -h + 0.22, 0.15)], 0.008, 6, MT.RUBBER);
    b.geo(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 12), new THREE.Matrix4().makeTranslation(0, -h + 0.57, 0.126).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), MT.STEEL);
    var ns = b.count(); b.box(-0.11, 0.07, 0, 0.11, 0.29, 0.012, MT.PLASTIC); b.tag(ns, 21, null);   // the sign over it: red, an extinguisher drawn in white
    var nw = b.count(); b.box(-0.045, 0.1, 0.012, 0.0, 0.225, 0.016, MT.PLASTIC); b.box(-0.032, 0.225, 0.012, -0.013, 0.245, 0.016, MT.PLASTIC); b.box(-0.013, 0.236, 0.012, 0.03, 0.244, 0.016, MT.PLASTIC);
    b.box(0.012, 0.12, 0.012, 0.022, 0.215, 0.016, MT.PLASTIC); b.box(0.035, 0.16, 0.012, 0.085, 0.172, 0.016, MT.PLASTIC); b.tag(nw, 0, null);
  }); }
  function callPoint() { return furn("callpoint", function (b) {
    var n0 = b.count(); b.box(-0.045, -0.045, 0, 0.045, 0.045, 0.05, MT.PLASTIC); b.tag(n0, 21, null);
    var n1 = b.count(); b.box(-0.03, -0.03, 0.05, 0.03, 0.03, 0.053, MT.PLASTIC); b.tag(n1, 0, null);
    var n2 = b.count(); b.box(-0.008, -0.008, 0.053, 0.008, 0.008, 0.056, MT.PLASTIC); b.tag(n2, 1, null);
  }); }
  function smokeDetector() { return furn("smoke", function (b) {        // under a ceiling at y = 0
    var n0 = b.count(); b.geo(new THREE.CylinderGeometry(0.06, 0.068, 0.035, 18), new THREE.Matrix4().makeTranslation(0, -0.0175, 0), MT.PLASTIC); b.geo(new THREE.CylinderGeometry(0.03, 0.04, 0.012, 14), new THREE.Matrix4().makeTranslation(0, -0.041, 0), MT.PLASTIC); b.tag(n0, 0, null);
  }); }
  function sprinkler() { return furn("sprinkler", function (b) {
    b.geo(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 12), new THREE.Matrix4().makeTranslation(0, -0.003, 0), MT.STEEL);
    b.geo(new THREE.CylinderGeometry(0.006, 0.009, 0.03, 6), new THREE.Matrix4().makeTranslation(0, -0.021, 0), MT.BRASS);
    b.geo(new THREE.CylinderGeometry(0.016, 0.016, 0.003, 10), new THREE.Matrix4().makeTranslation(0, -0.037, 0), MT.BRASS);
  }); }
  function ringSafety(W) {
    var C = CRS, D = D2R, S = P2.ring.safety || {}, E = S.extinguisher || {}, hw = C.wall / 2, rM = (C.r0 + C.rc) / 2;
    var spans = { upper: [[C.upper[0], -7], [7, 164], [191, C.upper[1]]], lower: [[-57, -7], [7, 164], [191, 303]] };
    function inSpan(deg, fl, m) { return spans[fl].some(function (s) { return deg > s[0] + m && deg < s[1] - m; }); }
    function nearDoorA(a, m, fl) { return C.rooms.some(function (rm) { return rmFloors(rm).indexOf(fl) >= 0 && (rm.doors || []).some(function (d) { return Math.abs(d - a) * C.rc < m; }); }); }
    ["upper", "lower"].forEach(function (fl) {
      var y = fl === "upper" ? C.yU : C.yL, last = -1e9;
      var rooms = C.rooms.filter(function (rm) { return !rm.band && rmFloors(rm).indexOf(fl) >= 0; }).sort(function (p, q) { return p.a[0] - q.a[0]; });
      var cand = [];                                              // the boundaries between two rooms with solid wall, clear of the doors
      for (var i = 0; i + 1 < rooms.length; i++) {
        var A = rooms[i], Bn = rooms[i + 1], deg = A.a[1];
        if (Math.abs(deg - Bn.a[0]) > 0.05 || !inSpan(deg, fl, 1.5)) continue;
        if (![A, Bn].every(function (rm) { return !isHall(rm) && !isBay(rm) && !CRS_GLAZED[rm.kind] && rm.kind !== "gate"; })) continue;
        if (!nearDoorA(deg * D, 1.2, fl)) cand.push(deg * D);
      }
      cand.forEach(function (a, k) {                              // a cabinet at the first, then wherever the next would be too far from the last
        if (k > 0 && k + 1 < cand.length && (cand[k + 1] - last) * C.rc <= (E.spacing || 30)) return;
        if (k + 1 === cand.length && (a - last) * C.rc < 12) return;
        last = a; var rw = C.rc - hw;
        var Mc = crsFrame(rw, a, y + (E.top || 1.75), Math.PI), gc = new Builder();             // its glass door
        gc.surf(1, 1, function (i, j, q) { q.p[0] = (i - 0.5) * 0.47; q.p[1] = lerp(-0.81, -0.04, j); q.p[2] = 0.206; q.nn = [0, 0, 1]; q.f2[0] = (E.top || 1.75) + lerp(-0.81, -0.04, j); q.f2[1] = 1; q.m = 0; }); CRS_GLASS.add(gc, Mc);
        W.add(extCabinet(), Mc); crsObst(rw - 0.25, rw, a - 0.3 / rw, a + 0.3 / rw, fl); (C.safetyLog = C.safetyLog || []).push([fl, Math.round(a / D)]);
      });
      C.rooms.forEach(function (rm) {                             // a call point beside each stair bay's door
        if (!isBay(rm) || rmFloors(rm).indexOf(fl) < 0) return;
        (rm.doors || []).forEach(function (d) { var rw = C.rc - hw; W.add(callPoint(), crsFrame(rw, d + 0.95 / rw, y + ((S.call_point || {}).h || 1.4), Math.PI)); });
      });
      spans[fl].forEach(function (s) {                            // on the ceiling: sprinklers between the downlights, smoke detectors every 9 m
        var yc = y + C.hC;
        for (var ka = s[0] * D + 4.0 / C.r0; ka < s[1] * D - 1.0 / C.r0; ka += 4.0 / C.r0) { var p = crsPt(rM, ka); W.add(sprinkler(), T(p.x, yc, p.z)); }
        for (var kb = s[0] * D + 4.5 / C.r0; kb < s[1] * D - 2.0 / C.r0; kb += (S.smoke || 9) / C.r0) { var q = crsPt(rM - 0.6, kb); W.add(smokeDetector(), T(q.x, yc, q.z)); }
      });
    });
  }
