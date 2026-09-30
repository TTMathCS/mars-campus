
  /* ============================== architecture helpers ============================== */
  // Wings run along an axis: "z" (north and south wings) or "x" (east wing). "across" is the other horizontal axis.
  function wp(axis, along, across) { return axis === "z" ? [across, along] : [along, across]; }

  // arched wall across a wing (end walls and partitions), with door holes at the given across-offsets
  function archGeo(W, S, R, doors, t, doorW, doorH) {
    var sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.lineTo(-W / 2, S);
    sh.absellipse(0, S, W / 2, R, Math.PI, 0, true, 0);
    sh.lineTo(W / 2, 0); sh.lineTo(-W / 2, 0);
    (doors || []).forEach(function (d) {
      var hp = new THREE.Path(), a = d - doorW / 2, b = d + doorW / 2;
      hp.moveTo(a, 0.02); hp.lineTo(b, 0.02); hp.lineTo(b, doorH); hp.lineTo(a, doorH); hp.lineTo(a, 0.02);
      sh.holes.push(hp);
    });
    return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 20 });
  }
  function archWall(axis, along, center, W, S, R, doors, mat, t) {
    t = t || 0.4;
    var g = archGeo(W, S, R, doors, t, 2.4, 3.0);
    if (axis === "z") addGeo(mat, g, mat4(center, 0, along - t / 2, 0, 1, 1, 1));
    else addGeo(mat, g, mat4(along + t / 2, 0, center, -Math.PI / 2, 1, 1, 1));
    // gold door frames
    (doors || []).forEach(function (d) {
      var p = wp(axis, along, center + d), ry = axis === "z" ? 0 : Math.PI / 2;
      var f = new F(p[0], p[1], ry);
      f.box("gold", 0.08, 3.05, t + 0.06, -1.24, 0, 0).box("gold", 0.08, 3.05, t + 0.06, 1.24, 0, 0).box("gold", 2.56, 0.08, t + 0.06, 0, 3.0, 0);
    });
  }
  // straight wall along the wing axis at a fixed "across", with gaps [a0, a1] (along) for doors
  function sideWall(axis, across, a0, a1, h, gaps, mat, t) {
    t = t || 0.6; gaps = (gaps || []).slice().sort(function (p, q) { return p[0] - q[0]; });
    var cur = a0;
    function seg(s0, s1, y0, hh) { if (s1 - s0 < 0.01) return; var m = (s0 + s1) / 2, p = wp(axis, m, across); if (axis === "z") box(mat, t, hh, s1 - s0, p[0], y0, p[1]); else box(mat, s1 - s0, hh, t, p[0], y0, p[1]); }
    gaps.forEach(function (g) { seg(cur, g[0], 0, h); seg(g[0], g[1], g[2] || 3.0, h - (g[2] || 3.0)); cur = g[1]; });
    seg(cur, a1, 0, h);
  }
  // barrel vault shell (inside ceiling) as a parametric surface
  function vaultGeo(W, S, R, L, N) {
    var g = new THREE.BufferGeometry(), pos = [], nor = [], uv = [], idx = [];
    for (var i = 0; i <= N; i++) {
      var th = Math.PI * i / N, cx = Math.cos(th), sy = Math.sin(th);
      var nx = -cx / (W / 2), ny = -sy / R, nl = Math.hypot(nx, ny);
      for (var j = 0; j <= 1; j++) { pos.push(cx * W / 2, S + sy * R, j * L); nor.push(nx / nl, ny / nl, 0); uv.push(i / N, j * L / 4); }
    }
    for (var k = 0; k < N; k++) { var a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  }
  function vault(axis, center, a0, a1, W, S, R) {
    var g = vaultGeo(W, S, R, a1 - a0, 28);
    if (axis === "z") addGeo("vault", g, mat4(center, 0, a0, 0, 1, 1, 1), "roof");
    else addGeo("vault", g, mat4(a0, 0, center, Math.PI / 2, 1, 1, 1), "roof");
  }
  // regolith berm over a wing: a long mound with rounded ends
  function bermGeo(B, H, L, cap0, cap1, seed) {
    var nu = 22, nv = Math.max(8, Math.round((L + cap0 + cap1) / 3)), g = new THREE.BufferGeometry(), pos = [], uv = [], idx = [];
    for (var j = 0; j <= nv; j++) {
      var v = -cap0 + (L + cap0 + cap1) * j / nv, s = 1;
      if (v < 0) s = Math.sqrt(Math.max(0, 1 - (v / cap0) * (v / cap0)));
      if (v > L) s = Math.sqrt(Math.max(0, 1 - ((v - L) / cap1) * ((v - L) / cap1)));
      for (var i = 0; i <= nu; i++) {
        var u = -1 + 2 * i / nu, prof = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.3)), 0.55);
        var y = H * s * prof, x = u * B * (0.55 + 0.45 * s);
        var jit = (vnoise(x * 0.35 + seed, v * 0.35, 5) - 0.5) * 0.6 * prof * s;
        pos.push(x, Math.max(0, y + jit) - 0.2, v); uv.push(i / nu * 3, v / 6);
      }
    }
    for (var jj = 0; jj < nv; jj++) for (var ii = 0; ii < nu; ii++) { var a = jj * (nu + 1) + ii, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeVertexNormals(); return g;
  }
  function berm(axis, center, a0, a1, W, H, cap0, cap1, seed) {
    var g = bermGeo(W / 2 + 3.6, H, a1 - a0, cap0, cap1, seed || 1);
    if (axis === "z") addGeo("berm", g, mat4(center, 0, a0, 0, 1, 1, 1), "roof");
    else addGeo("berm", g, mat4(a0, 0, center, Math.PI / 2, 1, 1, 1), "roof");
    // light pipes: small glass lenses along the crown
    for (var a = a0 + 4; a < a1 - 2; a += 7) {
      var p = wp(axis, a, center); sph("lens", 0.7, p[0], H - 0.3, p[1], 10, "roof", 1, 0.45, 1); cyl("gold", 0.78, 0.12, p[0], H - 0.42, p[1], 16, "roof");
    }
  }
  // a full vaulted wing: floor, walls, vault, cove lights, berm
  function wing(o) {
    var ax = o.axis, c = o.center, W = o.width || 16, S = o.S || 3.6, R = o.R || 3.2, a0 = o.a0, a1 = o.a1;
    sideWall(ax, c - W / 2 - 0.3, a0, a1, S, o.gapsNeg || [], "wall");
    sideWall(ax, c + W / 2 + 0.3, a0, a1, S, o.gapsPos || [], "wall");
    vault(ax, c, a0, a1, W + 0.02, S, R);
    // cove light strips along both springlines and down the crown
    [-1, 1].forEach(function (sgn) { var p = wp(ax, (a0 + a1) / 2, c + sgn * (W / 2 - 0.08)); if (ax === "z") box("lampSoft", 0.08, 0.06, a1 - a0 - 0.6, p[0], S - 0.1, p[1]); else box("lampSoft", a1 - a0 - 0.6, 0.06, 0.08, p[0], S - 0.1, p[1]); });
    for (var a = a0 + 3; a < a1 - 1.5; a += 7) { var q = wp(ax, a, c); cyl("lampCool", 0.55, 0.05, q[0], S + R - 0.08, q[1], 20, "roof"); }
    if (o.berm !== false) berm(ax, c, o.bermStart == null ? a0 - 0.6 : o.bermStart, o.bermEnd == null ? a1 + 0.6 : o.bermEnd, W + 1.2, S + R + 2.8, o.cap0 == null ? 5 : o.cap0, o.cap1 == null ? 5 : o.cap1, o.seed);
    (o.cuts || []).forEach(function (cut) { archWall(ax, cut[0], c, W, S, R, cut[1], "wall"); });
    // walnut wainscot with a brass rail along both walls, and brass ribs across the vault
    [[-1, o.gapsNeg || []], [1, o.gapsPos || []]].forEach(function (side) {
      var cur = a0, gaps = side[1].slice().sort(function (p, q) { return p[0] - q[0]; }).concat([[a1, a1]]);
      gaps.forEach(function (g) {
        var s0 = cur + 0.25, s1 = g[0] - 0.25; cur = g[1];
        if (s1 - s0 < 0.3) return;
        var m = (s0 + s1) / 2, q2 = wp(ax, m, c + side[0] * (W / 2 - 0.03)), q3 = wp(ax, m, c + side[0] * (W / 2 - 0.06));
        if (ax === "z") { box("panelWood", 0.06, 1.05, s1 - s0, q2[0], 0, q2[1]); box("gold", 0.05, 0.035, s1 - s0, q3[0], 1.05, q3[1]); }
        else { box("panelWood", s1 - s0, 1.05, 0.06, q2[0], 0, q2[1]); box("gold", s1 - s0, 0.035, 0.05, q3[0], 1.05, q3[1]); }
      });
    });
    var rib = vaultGeo(W - 0.12, S, R - 0.06, 0.14, 28);
    for (var ra = a0 + 2; ra < a1 - 1; ra += 4) { if (ax === "z") addGeo("goldDS", rib, mat4(c, 0, ra, 0, 1, 1, 1), "roof"); else addGeo("goldDS", rib, mat4(ra, 0, c, Math.PI / 2, 1, 1, 1), "roof"); }
  }
  function floorRect(mat, x0, x1, z0, z1, y) { box(mat, x1 - x0, 0.1, z1 - z0, (x0 + x1) / 2, (y || 0) - 0.1, (z0 + z1) / 2); }
  // a short straight link corridor
  function link(axis, a0, a1, center, width) {
    var W = width || 4.2, h = 3.4;
    var p = wp(axis, (a0 + a1) / 2, center), L = a1 - a0;
    if (axis === "z") { floorRect("terrazzo", center - W / 2, center + W / 2, a0, a1); box("shell", 0.3, h, L, center - W / 2 - 0.15, 0, p[1]); box("shell", 0.3, h, L, center + W / 2 + 0.15, 0, p[1]); box("shell", W + 0.9, 0.35, L, center, h, p[1], 0, "roof"); box("lampCool", 0.5, 0.04, L - 0.4, center, h - 0.04, p[1]); }
    else { floorRect("terrazzo", a0, a1, center - W / 2, center + W / 2); box("shell", L, h, 0.3, p[0], 0, center - W / 2 - 0.15); box("shell", L, h, 0.3, p[0], 0, center + W / 2 + 0.15); box("shell", L, 0.35, W + 0.9, p[0], h, center, 0, "roof"); box("lampCool", L - 0.4, 0.04, 0.5, p[0], h - 0.04, center); }
  }
  // glass dome on a low ring wall with ribs
  function glassDome(cx, cz, R, ringH, doors, opts) {
    opts = opts || {};
    var dome = new THREE.SphereGeometry(R, 64, 22, 0, Math.PI * 2, 0, Math.PI / 2);
    addGeo("glassDome", dome, mat4(cx, 0, cz, 0, 1, 1, 1), "roof", true);
    var nRib = opts.ribs || 8, rib = new THREE.TorusGeometry(R, opts.ribR || 0.18, 6, 64, Math.PI);
    for (var k = 0; k < nRib; k++) addGeo("gold", rib, mat4(cx, 0, cz, k * Math.PI / nRib, 1, 1, 1), "roof");
    [0.32, 0.62, 0.86].forEach(function (f) { var a = Math.asin(f); var ring = new THREE.TorusGeometry(R * Math.cos(a), (opts.ribR || 0.18) * 0.8, 6, 72); addGeo("gold", ring, mat4(cx, R * f, cz, 0, 1, 1, 1, Math.PI / 2), "roof"); });
    var n = Math.max(24, Math.round(R * 2.6)), segL = 2 * Math.PI * R / n * 1.04;
    for (var i = 0; i < n; i++) {
      var a2 = (i + 0.5) / n * Math.PI * 2, skip = false;
      (doors || []).forEach(function (d) { var da = Math.atan2(Math.sin(a2 - d), Math.cos(a2 - d)); if (Math.abs(da) < (2.6 / R)) skip = true; });
      if (skip) continue;
      box(opts.ringMat || "shell", 0.55, ringH, segL, cx + Math.cos(a2) * (R + 0.2), 0, cz + Math.sin(a2) * (R + 0.2), -a2);
    }
    addGeo("gold", new THREE.TorusGeometry(R + 0.2, 0.1, 6, 96), mat4(cx, ringH + 0.02, cz, 0, 1, 1, 1, Math.PI / 2));
  }

  /* ============================== furniture ============================== */
  // a tapered cylinder between two points (branches, pipes, cables, struts)
  var _up = new V3(0, 1, 0), _sd = new V3(), _sq = new THREE.Quaternion(), _sm = new THREE.Matrix4();
  function seg(mat, x0, y0, z0, x1, y1, z1, r0, r1, n, layer) {
    _sd.set(x1 - x0, y1 - y0, z1 - z0); var L = _sd.length(); if (L < 1e-4) return; _sd.divideScalar(L);
    _sq.setFromUnitVectors(_up, _sd); _sm.compose(_p.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _sq, _s.set(1, 1, 1));
    addGeo(mat, new THREE.CylinderGeometry(r1, r0, L, n || 8, 1, false), _sm, layer);
  }
  var RUGMAT = { fabBlue: "carpetBlue", fabRust: "carpetRust", fabPlum: "carpetRust" };
  function rug(mat, x, z, w, d, ry) {
    var m = RUGMAT[mat] || "carpet";
    rbox(m === "carpet" ? "carpetRust" : "carpet", w, 0.012, d, x, 0.002, z, ry || 0, 0.004);
    rbox(m, w - 0.18, 0.016, d - 0.18, x, 0.002, z, ry || 0, 0.006);
  }
  function sofa(x, z, ry, len, fab, cush) {
    var f = new F(x, z, ry), D = 1.0, c = cush || fab;
    f.rbox(fab, len, 0.34, D, 0, 0.1, 0, 0.04).rbox(fab, len - 0.02, 0.5, 0.26, 0, 0.32, -D / 2 + 0.13, 0.09)
     .rbox(fab, 0.24, 0.62, D, -len / 2 + 0.12, 0.1, 0, 0.09).rbox(fab, 0.24, 0.62, D, len / 2 - 0.12, 0.1, 0, 0.09);
    var nc = Math.max(1, Math.round((len - 0.48) / 0.85)), cw = (len - 0.48) / nc;
    for (var i = 0; i < nc; i++) {
      var lx = -len / 2 + 0.24 + cw * (i + 0.5);
      f.rbox(c, cw - 0.02, 0.17, 0.74, lx, 0.43, 0.1, 0.07).rbox(c, cw - 0.04, 0.48, 0.2, lx, 0.52, -0.27, 0.09, 0, null, -0.2);
    }
    [-1, 1].forEach(function (s) {
      f.cyl("gold", 0.022, 0.1, s * (len / 2 - 0.1), 0, 0.38, 10).cyl("gold", 0.022, 0.1, s * (len / 2 - 0.1), 0, -0.38, 10);
      if (len > 1.8) f.rbox(s > 0 ? "fabGold" : "fabRust", 0.42, 0.4, 0.13, s * (len / 2 - 0.5), 0.56, -0.08, 0.06, s * 0.18, null, -0.25);
    });
    f.blob(len + 0.3, D + 0.3, 0, 0, 0.6);
  }
  function armchair(x, z, ry, fab) {
    var f = new F(x, z, ry);
    f.rbox(fab, 0.86, 0.3, 0.84, 0, 0.14, 0, 0.04).rbox(fab, 0.84, 0.5, 0.2, 0, 0.36, -0.32, 0.08, 0, null, -0.12)
     .rbox(fab, 0.17, 0.4, 0.84, -0.35, 0.3, 0, 0.07).rbox(fab, 0.17, 0.4, 0.84, 0.35, 0.3, 0, 0.07)
     .rbox(fab, 0.54, 0.14, 0.62, 0, 0.44, 0.07, 0.06);
    [[0.34, 0.34], [-0.34, 0.34], [0.34, -0.34], [-0.34, -0.34]].forEach(function (q) { f.cyl("wood", 0.022, 0.14, q[0], 0, q[1], 8); });
    f.blob(1.1, 1.1, 0, 0, 0.55);
  }
  function lounger(x, z, ry, fab) {
    var f = new F(x, z, ry);
    f.rbox("wood", 0.72, 0.08, 1.95, 0, 0.26, 0.1, 0.02).rbox("wood", 0.06, 0.26, 0.06, -0.3, 0, 0.9, 0.01).rbox("wood", 0.06, 0.26, 0.06, 0.3, 0, 0.9, 0.01)
     .rbox("wood", 0.06, 0.26, 0.06, -0.3, 0, -0.6, 0.01).rbox("wood", 0.06, 0.26, 0.06, 0.3, 0, -0.6, 0.01)
     .rbox(fab, 0.66, 0.1, 1.28, 0, 0.34, 0.42, 0.045).rbox(fab, 0.66, 0.1, 0.78, 0, 0.52, -0.52, 0.045, 0, null, 0.72)
     .rbox(fab, 0.44, 0.1, 0.22, 0, 0.72, -0.72, 0.05, 0, null, 0.72);
    f.blob(0.95, 2.2, 0, 0.1, 0.45);
  }
  function tableRect(x, z, w, d, h, top, legs, ry) {
    var f = new F(x, z, ry || 0), lm = legs || "gold";
    f.rbox(top, w, 0.05, d, 0, h - 0.05, 0, 0.012).rbox(top, w - 0.2, 0.07, d - 0.2, 0, h - 0.12, 0, 0.01);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { f.rbox(lm, 0.05, h - 0.05, 0.05, q[0] * (w / 2 - 0.12), 0, q[1] * (d / 2 - 0.12), 0.008); });
    f.blob(w + 0.3, d + 0.3, 0, 0, 0.45);
  }
  function tableRound(x, z, r, h, top) {
    lathe(top || "basalt", [[0, h], [r - 0.012, h], [r, h - 0.012], [r, h - 0.035], [r - 0.02, h - 0.05], [r * 0.4, h - 0.06], [0, h - 0.06]], x, 0, z, 40);
    lathe("gold", [[0.04, h - 0.06], [0.035, h * 0.5], [0.05, 0.08], [r * 0.42, 0.02], [r * 0.45, 0], [0, 0]], x, 0, z, 28);
    blob(x, z, r * 2 + 0.3, r * 2 + 0.3, 0, 0.45);
  }
  function chair(x, z, ry, fab) {
    var f = new F(x, z, ry), c = fab || "fabSand";
    f.rbox(c, 0.48, 0.09, 0.47, 0, 0.44, 0.01, 0.035).rbox(c, 0.46, 0.5, 0.07, 0, 0.52, -0.22, 0.03, 0, null, -0.1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { f.geo("wood", new THREE.CylinderGeometry(0.016, 0.022, 0.46, 8), q[0] * 0.19, 0.23, q[1] * 0.19, 0, null, q[1] < 0 ? -0.06 : 0.04); });
    f.blob(0.62, 0.62, 0, 0, 0.4);
  }
  function stool(x, z, fab) {
    lathe(fab || "fabRust", [[0, 0.8], [0.17, 0.8], [0.2, 0.78], [0.2, 0.72], [0.17, 0.7], [0, 0.7]], x, 0, z, 24);
    cyl("gold", 0.022, 0.7, x, 0, z, 8); addGeo("gold", new THREE.TorusGeometry(0.17, 0.012, 6, 28), mat4(x, 0.28, z, 0, 1, 1, 1, Math.PI / 2));
    lathe("gold", [[0, 0.02], [0.18, 0.015], [0.2, 0], [0, 0]], x, 0, z, 24); blob(x, z, 0.5, 0.5, 0, 0.35);
  }
  function floorLamp(x, z, h) {
    h = h || 1.6;
    lathe("gold", [[0, 0.03], [0.15, 0.025], [0.17, 0], [0, 0]], x, 0, z, 28); cyl("gold", 0.012, h, x, 0, z, 8);
    addGeo("lampshade", new THREE.CylinderGeometry(0.17, 0.22, 0.3, 28, 1, true), mat4(x, h + 0.1, z, 0, 1, 1, 1));
    sph("lamp", 0.06, x, h + 0.05, z, 10); blob(x, z, 0.45, 0.45, 0, 0.35);
  }
  function tableLamp(x, y, z) {
    lathe("ceramic", [[0, 0], [0.07, 0], [0.1, 0.06], [0.11, 0.16], [0.07, 0.28], [0.03, 0.31], [0.03, 0.34], [0, 0.34]], x, y, z, 24);
    addGeo("lampshade", new THREE.CylinderGeometry(0.1, 0.15, 0.2, 24, 1, true), mat4(x, y + 0.42, z, 0, 1, 1, 1)); sph("lamp", 0.035, x, y + 0.38, z, 8);
  }
  function pendant(x, y, z) { cyl("gold", 0.006, 1.2, x, y, z, 4); cyl("gold", 0.05, 0.05, x, y + 0.12, z, 12); sph("lamp", 0.16, x, y - 0.05, z, 16); }
  function sconce(x, y, z, ry) { var f = new F(x, z, ry, y); f.rbox("gold", 0.12, 0.3, 0.03, 0, 0, 0, 0.01).cyl("gold", 0.012, 0.12, 0, 0.12, 0.07, 6); addGeo("lampshade", new THREE.CylinderGeometry(0.07, 0.09, 0.16, 18, 1, true), mat4(f.wx(0, 0.14), y + 0.2, f.wz(0, 0.14), 0, 1, 1, 1)); }
  function card(mat, w, h, x, y, z, ry, rx, rz, cx, cy, cz) {
    // a foliage card; normals lean away from (cx, cy, cz) so a canopy shades like a volume
    var g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(mat4(x, y, z, ry, 1, 1, 1, rx, rz));
    if (cx != null) { var p = g.attributes.position, n = g.attributes.normal; for (var i = 0; i < p.count; i++) { _sd.set(p.getX(i) - cx, (p.getY(i) - cy) * 1.3, p.getZ(i) - cz).normalize(); n.setXYZ(i, _sd.x, _sd.y, _sd.z); } }
    addGeo(mat, g, null);
  }
  function plant(x, z, s, pot) {
    s = s || 1; var r = mulberry(Math.floor(x * 97 + z * 61) + 3);
    lathe(pot || "ceramic", [[0, 0.02], [0.18 * s, 0], [0.24 * s, 0.06 * s], [0.27 * s, 0.44 * s], [0.29 * s, 0.5 * s], [0.25 * s, 0.5 * s], [0.24 * s, 0.46 * s]], x, 0, z, 28);
    cyl("soil", 0.24 * s, 0.02, x, 0.43 * s, z, 16);
    for (var i = 0; i < 9; i++) {
      var a = i / 9 * 6.28 + r(), el = 0.5 + r() * 0.5, L = (0.4 + r() * 0.5) * s, tx = x + Math.cos(a) * L * 0.4, tz = z + Math.sin(a) * L * 0.4, ty = (0.5 + L * 0.9) * s;
      seg("leaf2", x, 0.45 * s, z, tx, ty, tz, 0.012, 0.008, 5);
      card("leafMonstera", 0.62 * s, 0.62 * s, tx, ty + 0.05, tz, -a, -1.1 + r() * 0.5, (r() - 0.5) * 0.6, x, 0.9 * s, z);
    }
    blob(x, z, 0.7 * s, 0.7 * s, 0, 0.4);
  }
  function tree(x, z, s, fruit, y) {
    s = s || 1; y = y || 0; var r = mulberry(Math.floor(x * 131 + z * 71) + 11);
    var h = 1.6 * s, lx = (r() - 0.5) * 0.25 * s, lz = (r() - 0.5) * 0.25 * s, tx = x + lx, tz = z + lz, cy = y + h + 0.55 * s;
    seg("trunk", x, y, z, tx, y + h, tz, 0.13 * s, 0.08 * s, 10);
    for (var b = 0; b < 6; b++) { var a = b / 6 * 6.28 + r() * 0.8, L = (0.6 + r() * 0.5) * s; seg("trunk", tx, y + h * (0.75 + r() * 0.2), tz, tx + Math.cos(a) * L * 0.8, y + h + L * 0.55, tz + Math.sin(a) * L * 0.8, 0.05 * s, 0.018 * s, 6); }
    var n = Math.round(46 * s);
    for (var i = 0; i < n; i++) {
      var th = r() * 6.28, ph = Math.acos(1 - 2 * Math.pow(r(), 0.8)), rr = (0.7 + r() * 0.45) * s;
      var px = tx + Math.sin(ph) * Math.cos(th) * rr * 1.15, py = cy + Math.cos(ph) * rr * 0.8, pz = tz + Math.sin(ph) * Math.sin(th) * rr * 1.15;
      card("leafBroad", 0.95 * s, 0.95 * s, px, py, pz, r() * 6.28, (r() - 0.5) * 2.4, (r() - 0.5) * 2.4, tx, cy, tz);
    }
    if (fruit) for (var k = 0; k < 18; k++) { var a2 = r() * 6.28, e = (r() - 0.3) * 1.2, rf = 1.02 * s; sph(fruit, 0.055 * s, tx + Math.cos(a2) * rf * Math.cos(e), cy + Math.sin(e) * rf * 0.7, tz + Math.sin(a2) * rf * Math.cos(e), 8); }
    blob(x, z, 2.6 * s, 2.6 * s, 0, 0.45);
  }
  var BOOKS = ["book1", "book2", "book3", "book4", "book5", "book6"];
  function bookcase(x, z, ry, len, h, shelves, depth) {
    var f = new F(x, z, ry), d = depth || 0.38, n = shelves || 5, r = mulberry(Math.floor(x * 97 + z * 13 + len));
    f.box("wood", len, h, 0.04, 0, 0, -d / 2 + 0.02).box("wood", 0.05, h, d, -len / 2, 0, 0).box("wood", 0.05, h, d, len / 2, 0, 0);
    for (var s = 0; s <= n; s++) {
      var y = 0.06 + (h - 0.1) * s / n; f.box("wood", len, 0.035, d, 0, y, 0);
      if (s === n) break;
      var room = (h - 0.1) / n - 0.08, lx = -len / 2 + 0.06;
      while (lx < len / 2 - 0.1) {
        var bw = 0.025 + r() * 0.035, bh = room * (0.62 + r() * 0.35);
        if (r() < 0.06) { lx += 0.12; continue; }
        f.box(BOOKS[Math.floor(r() * BOOKS.length)], bw, bh, d * 0.72, lx + bw / 2, y + 0.035, 0.02);
        lx += bw + 0.004;
      }
    }
  }
  function bed(x, z, ry, W, L, duvet, head) {
    var f = new F(x, z, ry), c0 = 0.1 - L / 2;
    f.rbox("wood", W + 0.44, 0.24, L + 0.3, 0, 0.04, 0.1, 0.02).rbox("darkMetal", W + 0.2, 0.05, L + 0.1, 0, 0, 0.1, 0.01)
     .rbox("fabWhite", W, 0.24, L, 0, 0.27, 0.1, 0.06)
     .rbox(duvet, W + 0.08, 0.1, L * 0.66, 0, 0.47, 0.1 + L * 0.17, 0.05).rbox(duvet, W + 0.1, 0.3, 0.06, 0, 0.26, 0.1 + L / 2 + 0.01, 0.03)
     .rbox("fabGold", W + 0.12, 0.05, 0.5, 0, 0.56, 0.1 + L / 2 - 0.35, 0.02);
    var np = W > 2 ? 4 : 2;
    for (var i = 0; i < np; i++) f.rbox(i % 2 ? "fabWhite" : "fabCream", W / np - 0.06, 0.18, 0.46, -W / 2 + (i + 0.5) * W / np, 0.5, c0 + 0.34, 0.08, 0, null, -0.35);
    f.rbox(duvet, 0.48, 0.34, 0.12, -0.3, 0.52, c0 + 0.62, 0.05, 0.1, null, -0.3).rbox("fabGold", 0.48, 0.34, 0.12, 0.3, 0.52, c0 + 0.62, 0.05, -0.1, null, -0.3);
    // channel-tufted headboard
    var hw = W + 0.7, nch = Math.round(hw / 0.22);
    for (var k = 0; k < nch; k++) f.rbox(head || "fabBlue", hw / nch - 0.01, 1.3, 0.12, -hw / 2 + (k + 0.5) * hw / nch, 0.3, c0 - 0.12, 0.05);
    f.rbox("wood", hw + 0.06, 0.06, 0.16, 0, 1.6, c0 - 0.12, 0.02);
    [-1, 1].forEach(function (s2) {
      var nx = s2 * (W / 2 + 0.62), nz = c0 + 0.25;
      f.rbox("woodDark", 0.58, 0.5, 0.46, nx, 0.02, nz, 0.015).rbox("gold", 0.18, 0.02, 0.02, nx, 0.34, nz + 0.235, 0.008).rbox("stone", 0.6, 0.03, 0.48, nx, 0.52, nz, 0.008);
      tableLamp(f.wx(nx, nz), 0.55, f.wz(nx, nz));
    });
    f.blob(W + 1.6, L + 0.8, 0, 0.1, 0.6);
  }
  function canopy(x, z, ry, W, L, h) {
    var f = new F(x, z, ry);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { f.box("gold", 0.05, h, 0.05, q[0] * (W / 2 + 0.25), 0, 0.1 + q[1] * (L / 2 + 0.17)); });
    f.box("gold", W + 0.55, 0.05, 0.05, 0, h, 0.1 - L / 2 - 0.17).box("gold", W + 0.55, 0.05, 0.05, 0, h, 0.1 + L / 2 + 0.17)
     .box("gold", 0.05, 0.05, L + 0.4, -W / 2 - 0.25, h, 0.1).box("gold", 0.05, 0.05, L + 0.4, W / 2 + 0.25, h, 0.1);
  }
  function piano(x, z, ry) {
    var sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(1.5, 0); sh.lineTo(1.5, 0.55); sh.bezierCurveTo(1.45, 1.35, 0.9, 1.2, 0.72, 1.7); sh.bezierCurveTo(0.6, 2.05, 0.35, 2.15, 0.12, 2.15); sh.lineTo(0, 2.1); sh.lineTo(0, 0);
    var body = new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: false, curveSegments: 10 });
    body.rotateX(Math.PI / 2); body.translate(-0.75, 0, -0.35);
    var f = new F(x, z, ry);
    f.geo("black", body, 0, 1.02, 0);
    var lid = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false, curveSegments: 10 }); lid.rotateX(Math.PI / 2); lid.translate(0, 0, -0.35);
    f.geo("black", lid, -0.75, 1.06, 0, 0, null, 0, -0.62);
    f.box("gold", 0.02, 0.9, 0.02, 0.55, 1.04, 0.7, 0, null, 0, 0.3);
    [[-0.6, -0.2], [0.6, -0.2], [0.1, 1.5]].forEach(function (q) { f.box("black", 0.1, 0.72, 0.1, q[0], 0, q[1]); });
    f.box("white", 1.3, 0.05, 0.16, 0, 0.74, -0.46).box("black", 1.3, 0.03, 0.06, 0, 0.79, -0.5).box("black", 1.5, 0.12, 0.28, 0, 0.66, -0.48);
    f.box("black", 0.9, 0.48, 0.38, 0, 0, -1.05).box("fabBlue", 0.86, 0.06, 0.34, 0, 0.48, -1.05);
  }
  function screen(tex, w, h, x, y, z, ry, emissive) {
    var m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: emissive ? 0xffffff : 0xdddddd });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(x, y, z); mesh.rotation.y = ry || 0; put(mesh);
    box("gold", w + 0.12, 0.06, 0.06, x - Math.sin(ry || 0) * 0.02, y + h / 2, z - Math.cos(ry || 0) * 0.02, ry);
    box("gold", w + 0.12, 0.06, 0.06, x - Math.sin(ry || 0) * 0.02, y - h / 2 - 0.06, z - Math.cos(ry || 0) * 0.02, ry);
    return mesh;
  }
  function painting(tex, w, h, x, y, z, ry) {
    var m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.receiveShadow = true; put(mesh);
    var f = new F(x, z, ry); f.box("gold", w + 0.1, 0.06, 0.04, 0, y + h / 2 - 0.01, -0.02).box("gold", w + 0.1, 0.06, 0.04, 0, y - h / 2 - 0.05, -0.02).box("gold", 0.06, h + 0.1, 0.04, -w / 2 - 0.03, y - h / 2 - 0.05, -0.02).box("gold", 0.06, h + 0.1, 0.04, w / 2 + 0.03, y - h / 2 - 0.05, -0.02);
    return mesh;
  }
  function plinth(x, z, h, what) { box("basalt", 0.7, h, 0.7, x, 0, z); if (what) what(x, h, z); }
  function meteorite(x, y, z, s) { var g = new THREE.DodecahedronGeometry(0.25 * (s || 1), 1); var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var k = 0.8 + 0.4 * vnoise(p.getX(i) * 9, p.getZ(i) * 9 + p.getY(i) * 5, 2); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k); } g.computeVertexNormals(); geoAt("meteor", g, x, y + 0.2 * (s || 1), z, 0.4); }
  function glassCase(x, z, w, d, withRock, s) { box("basalt", w, 0.9, d, x, 0, z); box("glass", w - 0.04, 0.6, d - 0.04, x, 0.9, z); box("led", w - 0.1, 0.02, d - 0.1, x, 1.49, z); if (withRock) meteorite(x, 0.9, z, s || 0.7); }
  function suit(x, z, ry) {
    var f = new F(x, z, ry);
    f.box("suitWhite", 0.55, 0.7, 0.36, 0, 1.0, 0).box("suitWhite", 0.5, 0.45, 0.32, 0, 0.55, 0).box("orange", 0.56, 0.06, 0.37, 0, 1.4, 0).box("steel", 0.52, 0.6, 0.18, 0, 1.0, -0.26)
     .sph("suitWhite", 0.2, 0, 1.92, 0.02).sph("glassDark", 0.17, 0, 1.92, 0.09)
     .box("suitWhite", 0.17, 0.62, 0.17, -0.38, 0.9, 0.02, 0, null, 0, 0.12).box("suitWhite", 0.17, 0.62, 0.17, 0.38, 0.9, 0.02, 0, null, 0, -0.12)
     .box("suitWhite", 0.2, 0.62, 0.2, -0.13, 0, 0).box("suitWhite", 0.2, 0.62, 0.2, 0.13, 0, 0).box("darkMetal", 0.22, 0.1, 0.3, -0.13, 0, 0.04).box("darkMetal", 0.22, 0.1, 0.3, 0.13, 0, 0.04);
  }
  function rover(x, z, ry, s) {
    s = s || 1; var f = new F(x, z, ry);
    f.box("roverWhite", 3.2 * s, 1.9 * s, 7.4 * s, 0, 1.0 * s, 0).box("roverWhite", 2.8 * s, 0.7 * s, 5.4 * s, 0, 2.9 * s, -0.6 * s).box("glassDark", 2.9 * s, 0.9 * s, 0.12 * s, 0, 1.8 * s, 3.72 * s, 0, null, -0.35)
     .box("orange", 3.22 * s, 0.14 * s, 7.42 * s, 0, 1.55 * s, 0).box("glassDark", 0.06 * s, 0.5 * s, 3.2 * s, -1.61 * s, 2.0 * s, 0.6 * s).box("glassDark", 0.06 * s, 0.5 * s, 3.2 * s, 1.61 * s, 2.0 * s, 0.6 * s)
     .box("lampCool", 2.4 * s, 0.12 * s, 0.06 * s, 0, 1.25 * s, 3.72 * s).box("darkMetal", 2.6 * s, 0.4 * s, 0.4 * s, 0, 3.6 * s, -2.6 * s);
    [-2.5, 0, 2.5].forEach(function (lz) { [-1, 1].forEach(function (sg) { f.cylH("black", 0.62 * s, 0.5 * s, sg * 1.75 * s, 0.62 * s, lz * s, 18, true); f.cylH("steel", 0.3 * s, 0.52 * s, sg * 1.75 * s, 0.62 * s, lz * s, 12, true); }); });
    [-0.7, 0.7].forEach(function (lx) { f.cylH("suitWhite", 0.42 * s, 0.1 * s, lx * s, 1.9 * s, -3.72 * s, 20); f.cylH("orange", 0.46 * s, 0.05 * s, lx * s, 1.9 * s, -3.7 * s, 20); });
  }

  /* ============================== textures ============================== */
  function canvasTex(w, h, draw, srgb) { var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); var t = new THREE.CanvasTexture(c); if (srgb !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  var TEX = {};
  TEX.contour = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "#1c2f4d"; g.fillRect(0, 0, w, h);
    for (var k = 1; k < 26; k++) {
      g.beginPath(); var r0 = k * 10;
      for (var a = 0; a <= 64; a++) { var t = a / 64 * Math.PI * 2, rr = r0 * (1 + 0.1 * Math.sin(3 * t + k * 0.3) + 0.05 * Math.sin(7 * t)); var px = w / 2 + Math.cos(t) * rr * 1.25, py = h / 2 + Math.sin(t) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.strokeStyle = k % 5 === 0 ? "rgba(217,180,107,.95)" : "rgba(217,180,107,.45)"; g.lineWidth = k % 5 === 0 ? 2.2 : 1.1; g.stroke();
    }
    g.strokeStyle = "rgba(217,180,107,.9)"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  });
  TEX.earthSky = canvasTex(512, 512, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3f7fd0"); gr.addColorStop(0.7, "#8fbde8"); gr.addColorStop(1, "#cfe5f7"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    var r = mulberry(4);
    for (var i = 0; i < 14; i++) { var cx = r() * w, cy = r() * h * 0.8, s = 30 + r() * 60; for (var j = 0; j < 6; j++) { g.fillStyle = "rgba(255,255,255," + (0.18 + r() * 0.2) + ")"; g.beginPath(); g.arc(cx + (r() - 0.5) * s * 1.6, cy + (r() - 0.5) * s * 0.4, s * (0.4 + r() * 0.4), 0, Math.PI * 2); g.fill(); } }
  });
  TEX.earthLink = canvasTex(1024, 512, function (g, w, h) {
    g.fillStyle = "#05070d"; g.fillRect(0, 0, w, h);
    var gr = g.createRadialGradient(330, 256, 20, 330, 256, 190); gr.addColorStop(0, "#9fd0ff"); gr.addColorStop(0.55, "#2f6fc0"); gr.addColorStop(0.95, "#0e2a55"); gr.addColorStop(1, "rgba(14,42,85,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(330, 256, 180, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; for (var i = 0; i < 9; i++) { g.beginPath(); g.ellipse(250 + i * 22, 180 + (i % 3) * 60, 60, 12, 0.3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#6c9a4a"; g.beginPath(); g.ellipse(360, 230, 50, 70, 0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d9b46b"; g.font = "600 30px monospace"; g.fillText("EARTH LINK", 590, 170);
    g.fillStyle = "#f2ebe0"; g.font = "22px monospace"; g.fillText("One-way light time", 590, 230); g.font = "600 44px monospace"; g.fillText("11 min 42 s", 590, 285);
    g.font = "22px monospace"; g.fillStyle = "#b8a996"; g.fillText("Next contact window 19:40", 590, 340); g.fillText("Relay: areostationary", 590, 375);
  });
  TEX.mars = canvasTex(512, 256, function (g, w, h) {
    var img = g.createImageData(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var lat = (y / h - 0.5) * Math.PI, n = fbm(x / 60, y / 60, 4, 8), dark = smoothstep(0.5, 0.62, fbm(x / 90 + 3, y / 90, 3, 9)), cap = smoothstep(0.42, 0.48, Math.abs(y / h - 0.5));
      var r = 0.72 - dark * 0.3 + n * 0.12, gg = 0.38 - dark * 0.15 + n * 0.07, b = 0.22 - dark * 0.08 + n * 0.04;
      r = lerp(r, 0.95, cap); gg = lerp(gg, 0.93, cap); b = lerp(b, 0.9, cap);
      var p = (y * w + x) * 4; img.data[p] = r * 255; img.data[p + 1] = gg * 255; img.data[p + 2] = b * 255; img.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  TEX.sand = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = "#b7836a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,52,36,.35)"; g.lineWidth = 3;
    for (var y = 6; y < h; y += 12) { g.beginPath(); g.moveTo(0, y); for (var x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + y * 0.1) * 1.5); g.stroke(); }
    [[150, 180, 60], [360, 300, 75], [250, 420, 45]].forEach(function (c) { for (var r = c[2] + 10; r < c[2] + 70; r += 12) { g.fillStyle = "#b7836a"; g.beginPath(); g.arc(c[0], c[1], r + 5, 0, Math.PI * 2); g.fill(); } for (var r2 = c[2] + 10; r2 < c[2] + 70; r2 += 12) { g.beginPath(); g.arc(c[0], c[1], r2, 0, Math.PI * 2); g.stroke(); } });
  });
  function artTex(seed, pal) {
    return canvasTex(256, 320, function (g, w, h) {
      var r = mulberry(seed); g.fillStyle = pal[0]; g.fillRect(0, 0, w, h);
      for (var i = 1; i < pal.length; i++) { g.fillStyle = pal[i]; g.globalAlpha = 0.85; var y0 = r() * h * 0.6; g.fillRect(18 + r() * 10, y0, w - 36 - r() * 20, 40 + r() * 110); }
      g.globalAlpha = 1;
    });
  }
  TEX.art = [artTex(1, ["#2b1c2e", "#c9673f", "#d9b46b", "#6b2c2c"]), artTex(2, ["#11233a", "#3f7fd0", "#9cc4ea", "#f2ebe0"]), artTex(3, ["#3a2418", "#b86b3a", "#e8c37a"]), artTex(4, ["#15161c", "#8a3b2e", "#c9a45c", "#304a5a"]),
    artTex(5, ["#e8ddcd", "#1f5d5a", "#c9673f"]), artTex(6, ["#241c30", "#6b4a8a", "#d9b46b", "#9cc4ea"])];
  TEX.photos = canvasTex(1024, 512, function (g, w, h) {
    g.fillStyle = "#e9dfd0"; g.fillRect(0, 0, w, h); var r = mulberry(9);
    for (var i = 0; i < 18; i++) {
      var x = 30 + (i % 6) * 165, y = 30 + Math.floor(i / 6) * 160;
      g.fillStyle = "#fff"; g.fillRect(x, y, 145, 140);
      var gr = g.createLinearGradient(0, y + 8, 0, y + 110); gr.addColorStop(0, i % 3 ? "#d9a57a" : "#6f93c8"); gr.addColorStop(1, "#8c4a2e"); g.fillStyle = gr; g.fillRect(x + 8, y + 8, 129, 100);
      g.fillStyle = "#1c1c22"; g.fillRect(x + 50 + r() * 30, y + 60, 16, 40); g.fillRect(x + 80 + r() * 20, y + 64, 14, 36);
    }
  });
  var skyScreenMat = null;
