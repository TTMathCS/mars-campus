  /* ===================== Soft furniture: upholstery with rounded edges and stuffed faces; contact shadows ===================== */
  // Jim, 7 Oct 2026: "it is almost good. but need more details. overall it looks cartoon, and furnitures are not designed
  // well to make the campus relaxing and comfortable". Furniture of hard-edged boxes reads as toys; real upholstery is
  // rounded and stuffed, stands on legs, carries cushions and pillows, and sits in its own soft shadow. softBox builds a box
  // whose edges and corners are rounded with radius r (its points pushed out from an inner box) and whose faces can bulge
  // like a cushion's (puff); the pieces are built from it to the furnishing program (tools/campus_furnishing.py).
  // Fabric colours (MT.FABRIC g.x): 0 charcoal, 1 ink, 2 mustard, 3 terracotta, 4 sage, 5 oatmeal, 6 linen, 7 cream (boucle),
  // 8 olive, 9 rust, 10 warm grey, 11 forest velvet, 12 dusty rose; g.y 1 boucle, 2 a rug's pile. Leather g.x 2 cognac.
  function softBox(b, x0, y0, z0, x1, y1, z1, r, mat, col, puff, gy) {
    r = Math.max(0.004, Math.min(r, (x1 - x0) / 2 - 0.002, (y1 - y0) / 2 - 0.002, (z1 - z0) / 2 - 0.002));
    var lo = [x0 + r, y0 + r, z0 + r], hi = [x1 - r, y1 - r, z1 - r], mn = [x0, y0, z0], mx = [x1, y1, z1], tq = Math.tan(Math.PI / 8);
    function samples(a0, a1, fine) {                                 // the rounding at 45, 22.5 and 0 degrees each end, the flat between (finer on a stuffed face)
      var s = [a0, a0 + r * (1 - tq), a0 + r], inner = a1 - a0 - 2 * r, n = fine ? Math.max(inner > 0.12 ? 4 : 1, Math.round(inner / 0.1)) : Math.max(1, Math.round(inner / 0.22));
      for (var k = 1; k < n; k++) s.push(a0 + r + inner * k / n);
      s.push(a1 - r, a1 - r * (1 - tq), a1); return s;
    }
    // the flats' samples may differ between faces (fine or coarse): their shared edges are straight, so nothing opens
    var S = [[samples(x0, x1), samples(x0, x1, 1)], [samples(y0, y1), samples(y0, y1, 1)], [samples(z0, z1), samples(z0, z1, 1)]], n0 = b.count();
    [[0, 1, 2, 1], [0, -1, 1, 2], [1, 1, 0, 2], [1, -1, 2, 0], [2, 1, 1, 0], [2, -1, 0, 1]].forEach(function (F) {   // [axis, side, u, v]
      var ax = F[0], sg = F[1], ua = F[2], va = F[3], pf = puff ? (puff[(sg > 0 ? "p" : "n") + "xyz"[ax]] || 0) : 0, SU = S[ua][pf ? 1 : 0], SV = S[va][pf ? 1 : 0];
      var hu = Math.max(1e-3, (hi[ua] - lo[ua]) / 2), hv = Math.max(1e-3, (hi[va] - lo[va]) / 2), cu = (lo[ua] + hi[ua]) / 2, cv = (lo[va] + hi[va]) / 2;
      b.surf(SU.length - 1, SV.length - 1, function (i, j, q) {
        var p = [0, 0, 0]; p[ax] = sg > 0 ? mx[ax] : mn[ax]; p[ua] = SU[i]; p[va] = SV[j];
        var c = [clamp(p[0], lo[0], hi[0]), clamp(p[1], lo[1], hi[1]), clamp(p[2], lo[2], hi[2])], d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
        var nn = [d[0] / L, d[1] / L, d[2] / L], o = [c[0] + nn[0] * r, c[1] + nn[1] * r, c[2] + nn[2] * r];
        var U = (p[ua] - cu) / hu, V = (p[va] - cv) / hv;
        if (pf && Math.abs(U) < 1 && Math.abs(V) < 1) {               // stuffed: the face bulges, its normal tilts with the bulge
          o[ax] += sg * pf * (1 - U * U) * (1 - V * V);
          nn = nn.slice(); nn[ua] += pf * 2 * U * (1 - V * V) / hu; nn[va] += pf * 2 * V * (1 - U * U) / hv;
        }
        q.p[0] = o[0]; q.p[1] = o[1]; q.p[2] = o[2]; q.nn = nn; q.f[0] = o[ua]; q.f[1] = o[va]; q.m = mat;
      });
    });
    if (col !== undefined && col !== null) b.tag(n0, col, gy === undefined ? null : gy);
  }
  function softM(x, y, z, rx, ry) { return new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx || 0, ry || 0, 0, "YXZ"))); }
  function taperLeg(b, x, z, h, rTop, rBot, mat, gy) { var n0 = b.count(); latheOn(b, x, 0, z, [[0.0, 0.0], [rBot, 0.0], [rTop, h], [0.0, h]], 12, mat); if (gy !== undefined) b.tag(n0, null, gy); }
  // a throw pillow: thin at its seams, plump in the middle (t), leaning back (rx) and turned (ry)
  function pillow(b, x, y, z, w, h, t, rx, ry, col, gy) {
    var tb = new Builder(), te = 0.05, pf = Math.max(0.02, (t - te) / 2); softBox(tb, -w / 2, -h / 2, -te / 2, w / 2, h / 2, te / 2, 0.03, MT.FABRIC, col, { pz: pf, nz: pf }, gy || 0);
    b.add(tb, softM(x, y, z, rx, ry));
  }
  // the pillows' colours for a sofa of each fabric: quiet contrasts
  var SOFA_ACCENT = { 0: [6, 9], 1: [6, 9], 2: [10, 6], 3: [6, 10], 4: [6, 9], 5: [8, 9], 6: [9, 8], 7: [8, 9], 8: [6, 9], 9: [6, 7], 10: [9, 6], 11: [6, 9], 12: [6, 8] };
  // a sofa, len along x, back at +z: tapered walnut legs, a base, rounded arms, one seat and one back cushion per seat,
  // the back cushions leaning back, throw pillows at the ends
  function sofa(col, len) { return furn("sofa" + col + "_" + len, function (b) {
    var L = len / 2, H = 0.1, d0 = -0.47, d1 = 0.47, aw = 0.2, n = Math.max(1, Math.round((len - 2 * aw) / 0.95)), cw = (len - 2 * aw) / n, gy = col === 7 ? 1 : 0;
    [[-L + 0.08, d0 + 0.08], [L - 0.08, d0 + 0.08], [-L + 0.08, d1 - 0.08], [L - 0.08, d1 - 0.08]].forEach(function (c) { taperLeg(b, c[0], c[1], H, 0.022, 0.014, MT.WOOD, 2); });
    softBox(b, -L, H, d0, L, H + 0.2, d1, 0.03, MT.FABRIC, col, null, gy);
    [-1, 1].forEach(function (s) { softBox(b, s > 0 ? L - aw : -L, H, d0, s > 0 ? L : -L + aw, 0.62, d1, 0.08, MT.FABRIC, col, { py: 0.012 }, gy); });
    softBox(b, -L + aw - 0.01, H + 0.18, d1 - 0.22, L - aw + 0.01, 0.68, d1, 0.05, MT.FABRIC, col, null, gy);
    for (var k = 0; k < n; k++) {
      var xa = -L + aw + k * cw + 0.008, xb = xa + cw - 0.016, t = new Builder();
      softBox(b, xa, H + 0.19, d0 + 0.02, xb, H + 0.34, d1 - 0.2, 0.06, MT.FABRIC, col, { py: 0.024 }, gy);
      softBox(t, xa - (xa + xb) / 2, -0.21, -0.1, xb - (xa + xb) / 2, 0.21, 0.1, 0.05, MT.FABRIC, col, { nz: 0.04, pz: 0.01 }, gy);
      b.add(t, softM((xa + xb) / 2, H + 0.6, d1 - 0.3, 0.16, 0));
    }
    var ac = SOFA_ACCENT[col] || [6, 9];
    pillow(b, -L + aw + 0.27, H + 0.55, d1 - 0.43, 0.46, 0.46, 0.17, 0.36, 0.3, ac[0]);
    pillow(b, L - aw - 0.27, H + 0.55, d1 - 0.43, 0.46, 0.46, 0.17, 0.36, -0.3, ac[1]);
    if (len > 2.6) pillow(b, -L + aw + 0.72, H + 0.53, d1 - 0.41, 0.42, 0.42, 0.16, 0.3, 0.12, ac[1]);
  }); }
  // a club chair in cognac leather, back at +z: walnut legs, rounded arms, a stuffed seat and a back leaning back
  function armchair() { return furn("arm", function (b) {
    var H = 0.12, w = 0.43;
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(function (c) { taperLeg(b, c[0], c[1], H, 0.02, 0.013, MT.WOOD, 2); });
    softBox(b, -w, H, -0.43, w, H + 0.2, 0.43, 0.04, MT.LEATHER, 2);
    [-1, 1].forEach(function (s) { softBox(b, s > 0 ? w - 0.14 : -w, H, -0.43, s > 0 ? w : -w + 0.14, 0.64, 0.43, 0.065, MT.LEATHER, 2, { py: 0.01 }); });
    var t = new Builder(); softBox(t, -w + 0.13, -0.28, -0.09, w - 0.13, 0.28, 0.09, 0.07, MT.LEATHER, 2, { nz: 0.025 }); b.add(t, softM(0, 0.64, 0.3, 0.14, 0));
    softBox(b, -w + 0.14, H + 0.18, -0.41, w - 0.14, H + 0.33, 0.2, 0.06, MT.LEATHER, 2, { py: 0.022 });
  }); }
  // an ottoman to put your feet up: a stuffed drum-like box on short legs
  function ottoman(w, d, col) { return furn("otto" + w + "_" + d + "_" + col, function (b) {
    [[-w / 2 + 0.07, -d / 2 + 0.07], [w / 2 - 0.07, -d / 2 + 0.07], [-w / 2 + 0.07, d / 2 - 0.07], [w / 2 - 0.07, d / 2 - 0.07]].forEach(function (c) { taperLeg(b, c[0], c[1], 0.08, 0.018, 0.012, MT.WOOD, 2); });
    softBox(b, -w / 2, 0.08, -d / 2, w / 2, 0.42, d / 2, 0.07, col === undefined ? MT.LEATHER : MT.FABRIC, col === undefined ? 2 : col, { py: 0.02 }, col === 7 ? 1 : 0);
  }); }
  // a table lamp: a turned ceramic base, a linen drum shade lit from inside
  function tableLamp() { return furn("tlamp", function (b) {
    latheOn(b, 0, 0, 0, [[0.0, 0.0], [0.07, 0.0], [0.1, 0.06], [0.11, 0.16], [0.08, 0.27], [0.03, 0.31], [0.015, 0.36]], 18, MT.CERAMIC, 0);
    var n0 = b.count(); latheOn(b, 0, 0.34, 0, [[0.17, 0.0], [0.15, 0.24], [0.148, 0.24], [0.168, 0.0]], 24, MT.FABRIC); b.tag(n0, 6, null);
    b.geo(addF2(new THREE.CircleGeometry(0.15, 20), 1.1, 0), T(0, 0.345, 0, Math.PI / 2, 0, 0), MT.LIGHT, 1);
  }); }
  // a low walnut coffee table with rounded corners, a shelf under it, books and a bowl on it
  function walnutTable(w, d) { return furn("wtable" + w + "_" + d, function (b) {
    var n0 = b.count(); roundSlab(b, w, d, 0.04, 0.06, 0.36, MT.WOOD); b.tag(n0, null, 2);
    var n1 = b.count(); roundSlab(b, w - 0.12, d - 0.12, 0.025, 0.05, 0.1, MT.WOOD); b.tag(n1, null, 2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { var n2 = b.count(); b.box(c[0] * (w / 2 - 0.08) - 0.025, 0, c[1] * (d / 2 - 0.08) - 0.025, c[0] * (w / 2 - 0.08) + 0.025, 0.36, c[1] * (d / 2 - 0.08) + 0.025, MT.WOOD); b.tag(n2, null, 2); });
    [[0.035, 6], [0.03, 9], [0.028, 10]].reduce(function (y, bk, k) { var nb = b.count(); b.geo(new THREE.BoxGeometry(0.24 - k * 0.02, bk[0], 0.31 - k * 0.03), T(-w * 0.22, y + bk[0] / 2, 0, 0, 0.1 * k - 0.1, 0), MT.FABRIC); b.tag(nb, bk[1], null); return y + bk[0]; }, 0.4);
    latheOn(b, w * 0.2, 0.4, 0.02, [[0.0, 0.0], [0.06, 0.0], [0.13, 0.05], [0.14, 0.07], [0.125, 0.07], [0.055, 0.012], [0.0, 0.012]], 24, MT.CERAMIC, 0);
  }); }
  // a side table with a lamp on it (its warm light is added where it is placed: lampLight)
  function lampTable() { return furn("lamptable", function (b) { b.add(sideTable(), T(0, 0, 0)); b.add(tableLamp(), T(0, 0.53, 0)); }); }
  // a lamp's pool of warm light at (r, a), h over the floor at y: k its strength, rg its reach
  function lampLight(r, a, y, h, k, rg) { var p = crsPt(r, a); wLight(p.x, y + h, p.z, LAMPC, k || 0.6, rg || 3.5); }
  // books on a bookshelf's five shelves (spines, as in the wings' shelves), the shelf placed with frame M; k varies them
  function shelfBooks(B, M, k) {
    [0.08, 0.522, 0.942, 1.362, 1.782].forEach(function (y, r) {
      var h = r === 4 ? 0.36 : 0.4, o = ((k * 5 + r) * 0.137) % 0.55;
      wpic(B, M, [0, y + 0.022 + (h - 0.03) / 2, -0.15], "x", [0, -1], 0.84, h - 0.03, atlasSub("books", o, 0.0, o + 0.45, 1.0), MT.ATLAS, [0, 4]);
    });
  }
  // a built-in banquette against a wall, back at +z: an oak plinth set back, a stuffed seat, back cushions leaning on the
  // wall, pillows; seat 0.45 m high, 0.64 m deep
  function banquette(len, col) { return furn("banq" + len + "_" + col, function (b) {
    var L = len / 2, n = Math.max(1, Math.round(len / 0.8)), cw = len / n, gy = col === 7 ? 1 : 0;
    var n0 = b.count(); b.box(-L + 0.04, 0, -0.26, L - 0.04, 0.1, 0.3, MT.WOOD); b.tag(n0, null, 1);
    softBox(b, -L, 0.1, -0.32, L, 0.3, 0.32, 0.02, MT.FABRIC, col, null, gy);
    for (var k = 0; k < n; k++) {
      var xa = -L + k * cw + 0.006, xb = xa + cw - 0.012, t = new Builder();
      softBox(b, xa, 0.29, -0.32, xb, 0.45, 0.2, 0.05, MT.FABRIC, col, { py: 0.022 }, gy);
      softBox(t, -(xb - xa) / 2, -0.24, -0.08, (xb - xa) / 2, 0.24, 0.08, 0.05, MT.FABRIC, col, { nz: 0.035 }, gy); b.add(t, softM((xa + xb) / 2, 0.72, 0.23, 0.12, 0));
    }
    var ac = SOFA_ACCENT[col] || [6, 9];
    pillow(b, -L + 0.36, 0.64, 0.07, 0.46, 0.46, 0.17, 0.3, 0.25, ac[0]); pillow(b, L - 0.36, 0.64, 0.07, 0.46, 0.46, 0.17, 0.3, -0.25, ac[1]);
    if (len > 2.4) pillow(b, -L + 0.82, 0.62, 0.09, 0.42, 0.42, 0.16, 0.26, 0.1, ac[1]);
  }); }
  // a reading table: walnut, rounded corners, on four square oak legs set in (len along x by 1.0)
  function readingTable(len) { return furn("rtable" + len, function (b) {
    var n0 = b.count(); roundSlab(b, len, 1.0, 0.04, 0.05, 0.71, MT.WOOD); b.tag(n0, null, 2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { var n1 = b.count(); b.box(c[0] * (len / 2 - 0.16) - 0.035, 0, c[1] * 0.34 - 0.035, c[0] * (len / 2 - 0.16) + 0.035, 0.71, c[1] * 0.34 + 0.035, MT.WOOD); b.tag(n1, null, 2); });
    var n2 = b.count(); b.box(-len / 2 + 0.2, 0.62, -0.02, len / 2 - 0.2, 0.68, 0.02, MT.WOOD); b.tag(n2, null, 2);
  }); }
  // ---- contact shadows: every piece that stands on a floor sits in its own soft shadow ----
  var SOFT_SHADOWS = [];
  function furnBox(fb) {
    if (fb._bb) return fb._bb;
    var P = fb.p, bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (var k = 0; k < P.length; k += 3) { bb[0] = Math.min(bb[0], P[k]); bb[1] = Math.min(bb[1], P[k + 1]); bb[2] = Math.min(bb[2], P[k + 2]); bb[3] = Math.max(bb[3], P[k]); bb[4] = Math.max(bb[4], P[k + 1]); bb[5] = Math.max(bb[5], P[k + 2]); }
    fb._bb = bb; return bb;
  }
  function contactShadow(fb, M) {
    var bb = furnBox(fb); if (bb[1] > 0.06 || bb[4] - bb[1] < 0.25) return;           // only what stands on its floor (not rugs, frames, things on walls)
    var w = bb[3] - bb[0], d = bb[5] - bb[2]; if (w * d < 0.05 || w > 6.5 || d > 6.5) return;
    var m = 0.08 + 0.06 * Math.min(w, d), k = bb[4] - bb[1] > 1.2 ? 0.75 : 1.0;
    SOFT_SHADOWS.push({ c: [[bb[0] - m, bb[2] - m], [bb[3] + m, bb[2] - m], [bb[3] + m, bb[5] + m], [bb[0] - m, bb[5] + m]].map(function (c) { return new THREE.Vector3(c[0], bb[1] + 0.006, c[1]).applyMatrix4(M); }), k: k });
  }
  function softShadowsBuild() {
    if (!SOFT_SHADOWS.length) return;
    var cv = mkCanvas(128, 128), g = cv.getContext("2d");
    g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, 128, 128);
    if (g.filter !== undefined) { g.filter = "blur(11px)"; g.fillStyle = "rgba(0,0,0,1)"; g.fillRect(30, 30, 68, 68); g.filter = "none"; }
    else { var gr = g.createRadialGradient(64, 64, 8, 64, 64, 62); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    var pos = [], uvs = [], al = [], idx = [];
    SOFT_SHADOWS.forEach(function (s) { var n = pos.length / 3; s.c.forEach(function (p, i) { pos.push(p.x, p.y, p.z); uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0); al.push(s.k); }); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute("aK", new THREE.Float32BufferAttribute(al, 1)); geo.setIndex(idx);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: new THREE.CanvasTexture(cv) } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: "attribute float aK; varying vec2 vUv; varying float vK; void main(){ vUv = uv; vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D map; varying vec2 vUv; varying float vK; void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, texture2D(map, vUv).a * 0.42 * vK); }" });
    var m = new THREE.Mesh(geo, mat); m.renderOrder = 2; m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m);
    SOFT_SHADOWS = [];
  }
