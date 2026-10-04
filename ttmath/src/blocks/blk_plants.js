  /* ===================== Plants: real house plants in the wings and the palace ===================== */
  // Each plant is built from leaf cards cut out of one drawn leaf texture (alpha test in the LEAF material), on stems
  // and trunks, in a pot of glazed ceramic, terracotta or dark fibreglass. Light is baked per vertex like the rest of
  // the furniture; the leaves also let light through from behind. Kinds: fig (fiddle-leaf fig), monstera, snake plant,
  // kentia palm, olive tree, ficus, fern, pothos.
  var LEAF_CELLS = { fig: [0, 0], monstera: [1, 0], snake: [2, 0], kentia: [3, 0], olive: [0, 1], ficus: [1, 1], fern: [2, 1], pothos: [3, 1] };
  function leafTexture() {
    var N = 1024, C = 256, cv = document.createElement("canvas"); cv.width = cv.height = N;
    var g = cv.getContext("2d"), rnd = mulberry(77);
    function rgb(c, k) { return "rgb(" + Math.round(c[0] * k) + "," + Math.round(c[1] * k) + "," + Math.round(c[2] * k) + ")"; }
    // a leaf along the cell's middle, base at the bottom, tip at the top: w(t) is the half width (0..1 of the cell's half)
    function leaf(cx, cy, w, opt) {
      var x0 = cx * C, y0 = cy * C, L = C * (opt.len || 0.96), H = C * 0.5 * (opt.wscale || 1), base = y0 + C * 0.98, n = 64;
      function P(t, side) { var y = base - L * t, wv = w(t) * (1 + (opt.wave || 0) * Math.sin(t * (opt.waveN || 14) + side)); return [x0 + C / 2 + side * H * wv + (opt.bend || 0) * C * t * t, y]; }
      g.save(); g.beginPath();
      for (var k = 0; k <= n; k++) { var p = P(k / n, 1); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
      for (k = n; k >= 0; k--) { p = P(k / n, -1); g.lineTo(p[0], p[1]); }
      g.closePath();
      var gr = g.createLinearGradient(0, base, 0, base - L); gr.addColorStop(0, rgb(opt.c0, 1)); gr.addColorStop(0.55, rgb(opt.c1, 1)); gr.addColorStop(1, rgb(opt.c2, 1));
      g.fillStyle = gr; g.fill(); g.clip();
      // darker towards the margins, a sheen along the middle
      var gx = g.createLinearGradient(x0 + C / 2 - H, 0, x0 + C / 2 + H, 0);
      gx.addColorStop(0, "rgba(0,0,0,0.28)"); gx.addColorStop(0.42, "rgba(255,255,230,0.06)"); gx.addColorStop(0.5, "rgba(255,255,230,0.10)"); gx.addColorStop(0.58, "rgba(255,255,230,0.06)"); gx.addColorStop(1, "rgba(0,0,0,0.28)");
      g.fillStyle = gx; g.fillRect(x0, y0, C, C);
      // veins: the midrib and lateral veins curving to the tip
      g.strokeStyle = rgb(opt.vein, 1); g.lineCap = "round";
      g.lineWidth = opt.mid || 2.4; g.beginPath(); for (k = 0; k <= n; k++) { p = P(k / n, 0); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
      g.globalAlpha = opt.veinA || 0.5; g.lineWidth = opt.lat || 1.2;
      for (var v = 0; v < (opt.nv || 9); v++) {
        var t0 = 0.08 + 0.84 * v / (opt.nv || 9);
        [-1, 1].forEach(function (sd) {
          var a = P(t0, 0); g.beginPath(); g.moveTo(a[0], a[1]);
          for (var s = 1; s <= 8; s++) { var tt = Math.min(1, t0 + 0.1 * s / 8 * (opt.rise || 1.4)), q = P(tt, sd * s / 8 * 0.92); g.lineTo(q[0], q[1]); }
          g.stroke();
        });
      }
      g.globalAlpha = 1;
      // mottling
      for (k = 0; k < 260; k++) { g.fillStyle = "rgba(" + (rnd() < 0.5 ? "0,0,0" : "255,255,200") + "," + (0.03 + 0.04 * rnd()) + ")"; g.beginPath(); g.arc(x0 + rnd() * C, y0 + rnd() * C, 1 + rnd() * 3, 0, 6.3); g.fill(); }
      g.restore();
    }
    function smoothW(ts, ws) { return function (t) { for (var i = 1; i < ts.length; i++) if (t <= ts[i]) { var k = (t - ts[i - 1]) / (ts[i] - ts[i - 1]); k = k * k * (3 - 2 * k); return ws[i - 1] + (ws[i] - ws[i - 1]) * k; } return 0; }; }
    // fiddle-leaf fig: broad, violin-shaped, wavy, glossy dark green with pale veins
    leaf(0, 0, smoothW([0, 0.08, 0.3, 0.5, 0.62, 0.78, 0.9, 0.97, 1], [0.03, 0.22, 0.46, 0.58, 0.66, 0.78, 0.7, 0.42, 0.0]),
      { c0: [36, 58, 28], c1: [44, 72, 32], c2: [40, 66, 30], vein: [132, 150, 96], wave: 0.035, waveN: 22, nv: 9, rise: 1.5, mid: 3.0, lat: 1.6, veinA: 0.55 });
    // monstera: heart-shaped, deep splits from the margin and holes by the midrib
    leaf(1, 0, smoothW([0, 0.05, 0.18, 0.42, 0.7, 0.9, 1], [0.35, 0.62, 0.86, 0.94, 0.8, 0.45, 0.0]), { c0: [26, 52, 24], c1: [32, 62, 28], c2: [30, 58, 26], vein: [96, 122, 70], nv: 8, rise: 0.9, mid: 3.2, lat: 1.4, veinA: 0.4, len: 0.94 });
    g.save(); g.globalCompositeOperation = "destination-out"; g.lineCap = "round";
    for (var k = 0; k < 7; k++) { var t = 0.14 + 0.11 * k; [-1, 1].forEach(function (sd) {
      var y = C * 0.98 - C * 0.94 * t; g.lineWidth = 5 + 2 * rnd(); g.beginPath(); g.moveTo(C + C / 2 + sd * C * 0.5, y - 6); g.lineTo(C + C / 2 + sd * C * 0.17, y + 10); g.stroke();
      if (k > 0 && k < 6 && rnd() < 0.7) { g.beginPath(); g.ellipse(C + C / 2 + sd * C * 0.1, y + 4, 3.5, 7, sd * 0.5, 0, 6.3); g.fill(); }
    }); }
    g.restore();
    // snake plant (Sansevieria laurentii): a sword with dark bands and yellow margins
    (function () {
      var x0 = 2 * C, base = C * 0.99; g.save(); g.beginPath();
      function wS(t) { return 0.86 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.35) * (1 - 0.25 * t); }
      for (var k = 0; k <= 60; k++) { var t = k / 60; g.lineTo(x0 + C / 2 + wS(t) * C / 2, base - t * C * 0.97); }
      for (k = 60; k >= 0; k--) { t = k / 60; g.lineTo(x0 + C / 2 - wS(t) * C / 2, base - t * C * 0.97); }
      g.closePath(); g.fillStyle = "rgb(202,186,84)"; g.fill(); g.clip();
      g.beginPath(); for (k = 0; k <= 60; k++) { t = k / 60; g.lineTo(x0 + C / 2 + wS(t) * C * 0.42, base - t * C * 0.97); } for (k = 60; k >= 0; k--) { t = k / 60; g.lineTo(x0 + C / 2 - wS(t) * C * 0.42, base - t * C * 0.97); }
      g.closePath(); g.fillStyle = "rgb(40,72,38)"; g.fill();
      for (k = 0; k < 34; k++) { var yy = base - (k + rnd() * 0.6) * C * 0.03; g.strokeStyle = "rgba(146,172,110," + (0.35 + 0.3 * rnd()) + ")"; g.lineWidth = 2 + 3 * rnd(); g.beginPath();
        for (var x = -0.5; x <= 0.5; x += 0.05) g.lineTo(x0 + C / 2 + x * C * 0.84, yy + 5 * Math.sin(x * 9 + k)); g.stroke(); }
      g.restore();
    })();
    // kentia palm frond: a thin rachis with drooping, tapered leaflets on both sides
    function leaflet(x, y, ang, ln, wd, c, rib) {
      g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(wd, -ln * 0.25, wd * 0.8, -ln * 0.7, 0, -ln); g.bezierCurveTo(-wd * 0.8, -ln * 0.7, -wd, -ln * 0.25, 0, 0);
      g.fillStyle = c; g.fill(); g.strokeStyle = rib; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -ln * 0.95); g.stroke(); g.restore();
    }
    (function () {
      var x0 = 3 * C;
      for (var k = 0; k < 30; k++) { var t = 0.05 + 0.93 * k / 30, y = C * 0.98 - C * 0.95 * t, ln = C * (0.42 - 0.3 * t * t) * (0.88 + 0.24 * rnd());
        [-1, 1].forEach(function (sd) { var gc = 0.85 + 0.25 * rnd();
          leaflet(x0 + C / 2, y, sd * (1.05 - 0.35 * t) + (rnd() - 0.5) * 0.12, ln, 4.2 + 1.6 * rnd(), "rgb(" + Math.round(46 * gc) + "," + Math.round(74 * gc) + "," + Math.round(36 * gc) + ")", "rgba(150,170,110,0.55)"); }); }
      g.strokeStyle = "rgb(70,84,48)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0 + C / 2, C); g.lineTo(x0 + C / 2, C * 0.04); g.stroke();
    })();
    // a sprig: a twig with small leaves either side (olive: narrow, grey-green, silvery below; ficus: small glossy ovals)
    function sprig(cx, cy, n, lenA, widA, cTop, cUnder, tw) {
      var x0 = cx * C, y0 = cy * C; g.save(); g.lineCap = "round";
      g.strokeStyle = tw; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + C / 2, y0 + C); g.quadraticCurveTo(x0 + C * 0.44, y0 + C * 0.5, x0 + C / 2 + 6, y0 + C * 0.06); g.stroke();
      for (var k = 0; k < n; k++) { var t = 0.1 + 0.85 * k / n, y = y0 + C - C * 0.9 * t, sd = k % 2 ? 1 : -1, a = sd * (0.75 + 0.35 * rnd()) - 0.2 * sd * t, ln = C * lenA * (1 - 0.35 * t) * (0.85 + 0.3 * rnd()), wd = C * widA * (0.85 + 0.3 * rnd());
        g.save(); g.translate(x0 + C / 2 - 4 * (1 - t), y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wd, -ln * 0.45, 0, -ln); g.quadraticCurveTo(-wd, -ln * 0.45, 0, 0);
        g.fillStyle = rnd() < 0.25 ? cUnder : cTop; g.fill(); g.strokeStyle = "rgba(220,226,190,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -2); g.lineTo(0, -ln * 0.9); g.stroke(); g.restore(); }
      g.restore();
    }
    sprig(0, 1, 16, 0.3, 0.045, "rgb(88,100,72)", "rgb(140,146,124)", "rgb(90,80,68)");
    sprig(1, 1, 14, 0.2, 0.075, "rgb(44,76,34)", "rgb(62,96,46)", "rgb(86,76,58)");
    // fern frond: many small tapered pinnae on a thin rachis
    (function () {
      var x0 = 2 * C, y0 = C;
      for (var k = 0; k < 34; k++) { var t = 0.04 + 0.93 * k / 34, y = y0 + C * 0.98 - C * 0.94 * t, ln = C * 0.28 * Math.sin(Math.PI * Math.min(1, t * 1.04 + 0.04)) * (0.85 + 0.25 * rnd());
        [-1, 1].forEach(function (sd) { var gc = 0.85 + 0.3 * rnd(); leaflet(x0 + C / 2, y, sd * 1.25, ln, 3.2, "rgb(" + Math.round(58 * gc) + "," + Math.round(90 * gc) + "," + Math.round(40 * gc) + ")", "rgba(140,160,100,0.4)"); }); }
      g.strokeStyle = "rgb(78,96,52)"; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x0 + C / 2, y0 + C); g.lineTo(x0 + C / 2, y0 + C * 0.04); g.stroke();
    })();
    // pothos: a heart-shaped leaf with golden streaks
    leaf(3, 1, smoothW([0, 0.06, 0.2, 0.45, 0.75, 0.92, 1], [0.3, 0.62, 0.8, 0.78, 0.5, 0.2, 0.0]), { c0: [42, 76, 32], c1: [50, 90, 38], c2: [48, 86, 36], vein: [170, 166, 100], nv: 5, rise: 0.8, mid: 2.4, lat: 1.2, veinA: 0.45, len: 0.92 });
    g.save(); g.beginPath(); g.rect(3 * C, C, C, C); g.clip(); g.globalCompositeOperation = "source-atop";
    for (k = 0; k < 18; k++) { g.strokeStyle = "rgba(214,204,110," + (0.25 + 0.3 * rnd()) + ")"; g.lineWidth = 2 + 4 * rnd(); var sx = 3 * C + C * (0.3 + 0.4 * rnd()); g.beginPath(); g.moveTo(sx, C * 1.95); g.lineTo(sx + (rnd() - 0.5) * 60, C * 1.1); g.stroke(); }
    g.restore();
    // spread each leaf's colours into the transparent texels round it, so mipmaps don't darken the edges
    var img = g.getImageData(0, 0, N, N), d = img.data, own = new Uint8Array(N * N);
    for (k = 0; k < N * N; k++) own[k] = d[k * 4 + 3] > 8 ? 1 : 0;
    for (var pass = 0; pass < 10; pass++) {
      var nxt = own.slice();
      for (var y = 1; y < N - 1; y++) for (var x = 1; x < N - 1; x++) {
        var i = y * N + x; if (own[i]) continue;
        var j = own[i - 1] ? i - 1 : own[i + 1] ? i + 1 : own[i - N] ? i - N : own[i + N] ? i + N : -1;
        if (j >= 0) { d[i * 4] = d[j * 4]; d[i * 4 + 1] = d[j * 4 + 1]; d[i * 4 + 2] = d[j * 4 + 2]; nxt[i] = 1; }
      }
      own = nxt;
    }
    for (k = 0; k < N * N; k++) if (d[k * 4 + 3] <= 8) d[k * 4 + 3] = 0;
    var t = new THREE.DataTexture(new Uint8Array(d.buffer.slice(0)), N, N, THREE.RGBAFormat);
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = maxAniso; t.flipY = false; t.needsUpdate = true;
    return t;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // one leaf card: base point, direction of the midrib, the up of its blade, length, width, droop and fold (a V along the
  // midrib); its picture is the cell of the leaf texture (texture v grows downward, like the canvas)
  function leafCard(b, base, dir, up, len, wid, droop, fold, cell, tint, gloss) {
    var side = new THREE.Vector3().crossVectors(dir, up).normalize(), nrm = new THREE.Vector3().crossVectors(side, dir).normalize();
    var u0 = cell[0] / 4, v0 = cell[1] / 4, NA = 4;
    b.surf(2, NA, function (i, j, q) {
      var t = j / NA, sx = i - 1, p = base.clone().addScaledVector(dir, len * t).addScaledVector(nrm, -droop * len * t * t)
        .addScaledVector(side, sx * wid / 2).addScaledVector(nrm, Math.abs(sx) * fold * wid / 2);
      q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.m = MT.LEAF; q.f[0] = u0 + (i / 2) * 0.25; q.f[1] = v0 + (1 - t * 0.97 - 0.01) * 0.25; q.f2[0] = tint; q.f2[1] = gloss;
    });
  }
  // a stem, a cane or a trunk: g.y = -1 makes the LEAF material draw bark (tint 0) or a green stem (tint 1)
  function stem(b, pts, r, tint) { var n0 = b.count(); tubeAlong(b, pts, r, 7, MT.LEAF, tint); b.tag(n0, tint, -1); }
  function pot(b, kind, r, h) {
    // kind: 0 glazed white ceramic, 1 terracotta, 2 dark fibreglass
    var prof = kind === 1 ? [[r * 0.72, 0], [r * 0.8, h * 0.08], [r, h * 0.88], [r * 1.06, h * 0.9], [r * 1.06, h], [r * 0.95, h]]
      : kind === 2 ? [[r * 0.94, 0], [r, h * 0.04], [r, h], [r * 0.93, h]] : [[r * 0.7, 0], [r * 0.82, h * 0.06], [r, h * 0.55], [r * 0.98, h * 0.95], [r * 0.94, h], [r * 0.88, h]];
    var n0 = b.count();
    latheOn(b, 0, 0, 0, prof, 32, kind === 1 ? MT.PLASTER : kind === 2 ? MT.PLASTIC : MT.CERAMIC, kind === 1 ? undefined : (kind === 2 ? 1 : 0), kind === 1 ? 2 : 0);
    if (kind === 1) b.tag(n0, null, 2);
    var n1 = b.count(); latheOn(b, 0, 0, 0, [[0, h * 0.94], [prof[prof.length - 1][0], h * 0.94]], 24, MT.RUBBER); return h * 0.94;
  }
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }
  var UP = v3(0, 1, 0);
  function plantBuilder(kind, seed) { return furn("plant_" + kind + "_" + seed, function (b) {
    var R = mulberry(seed * 131 + kind.length * 7), k, a;
    if (kind === "fig") {                                    // fiddle-leaf fig, about 1.8 m
      var top = pot(b, 0, 0.24, 0.46), H = 1.55 + 0.35 * R(), tr = [v3(0, top - 0.05, 0)];
      for (k = 1; k <= 6; k++) tr.push(v3(0.03 * Math.sin(k * 1.3 + seed), top + (H - top) * k / 6, 0.03 * Math.cos(k * 1.1)));
      stem(b, tr, function (t) { return 0.022 * (1 - 0.5 * t); }, 0);
      for (k = 0; k < 46; k++) {
        var t = 0.32 + 0.68 * Math.pow(R(), 0.8), ang = R() * Math.PI * 2, pt = tr[Math.min(6, Math.floor(t * 6))].clone().lerp(tr[Math.min(6, Math.ceil(t * 6))], (t * 6) % 1);
        var dir = v3(Math.cos(ang), 0.55 + 0.6 * R() - 0.5 * (1 - t), Math.sin(ang)).normalize(), up = v3(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)).normalize();
        if (up.lengthSq() < 0.1) up.set(1, 0, 0);
        leafCard(b, pt, dir, up, 0.26 + 0.12 * R(), 0.19 + 0.06 * R(), 0.25 + 0.2 * R(), 0.22, LEAF_CELLS.fig, R(), 0.85);
      }
    } else if (kind === "monstera") {                        // monstera: big split leaves on long arching stalks, about 1.1 m
      var top2 = pot(b, 2, 0.27, 0.42);
      for (k = 0; k < 11; k++) {
        a = (k / 11) * Math.PI * 2 + R() * 0.4; var reach = 0.25 + 0.3 * R(), hgt = 0.45 + 0.45 * R(), c = Math.cos(a), s = Math.sin(a);
        var pts = [v3(c * 0.04, top2 - 0.02, s * 0.04), v3(c * reach * 0.4, top2 + hgt * 0.75, s * reach * 0.4), v3(c * reach, top2 + hgt, s * reach)];
        stem(b, pts, 0.009, 1);
        var d2 = v3(c * 0.75, 0.35 + 0.3 * R(), s * 0.75).normalize(), u2 = v3(-c * 0.4, 1, -s * 0.4).normalize();
        leafCard(b, pts[2], d2, u2, 0.42 + 0.18 * R(), 0.4 + 0.12 * R(), 0.3 + 0.2 * R(), 0.12, LEAF_CELLS.monstera, R(), 0.7);
      }
    } else if (kind === "snake") {                           // snake plant: upright swords, about 0.9 m
      var top3 = pot(b, 0, 0.17, 0.34);
      for (k = 0; k < 13; k++) {
        a = R() * Math.PI * 2; var rr = 0.03 + 0.09 * R(), lean = 0.05 + 0.14 * R(), d3 = v3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize(), u3 = v3(-Math.sin(a + R()), 0, Math.cos(a + R()));
        leafCard(b, v3(Math.cos(a) * rr, top3 - 0.02, Math.sin(a) * rr), d3, u3, 0.5 + 0.45 * R(), 0.07 + 0.025 * R(), -0.04 + 0.06 * R(), 0.35, LEAF_CELLS.snake, R(), 0.6);
      }
    } else if (kind === "kentia") {                          // kentia palm: thin canes, arching fronds, about 2 m
      var top4 = pot(b, 2, 0.27, 0.5);
      for (k = 0; k < 8; k++) {
        a = k / 8 * Math.PI * 2 + R() * 0.5; var c4 = Math.cos(a), s4 = Math.sin(a), hc = 0.7 + 0.7 * R(), sp = 0.08 + 0.12 * R();
        var cane = [v3(c4 * 0.03, top4 - 0.02, s4 * 0.03), v3(c4 * sp * 0.5, top4 + hc * 0.5, s4 * sp * 0.5), v3(c4 * sp, top4 + hc, s4 * sp)];
        stem(b, cane, 0.011, 1);
        var d4 = v3(c4 * 0.8, 0.55, s4 * 0.8).normalize();
        leafCard(b, cane[2], d4, v3(-c4 * 0.5, 1, -s4 * 0.5).normalize(), 0.95 + 0.35 * R(), 0.62 + 0.15 * R(), 0.55 + 0.2 * R(), -0.1, LEAF_CELLS.kentia, R(), 0.5);
        leafCard(b, cane[2], d4, v3(-s4, 0.2, c4).normalize(), 0.9 + 0.3 * R(), 0.5, 0.6, 0.0, LEAF_CELLS.kentia, R(), 0.5);
      }
    } else if (kind === "olive") {                           // olive tree in a big terracotta pot, about 2.1 m
      var top5 = pot(b, 1, 0.33, 0.55), tr5 = [v3(0, top5 - 0.05, 0)];
      for (k = 1; k <= 7; k++) tr5.push(v3(0.06 * Math.sin(k * 1.7 + seed), top5 + 0.9 * k / 7, 0.05 * Math.cos(k * 1.3 + seed)));
      stem(b, tr5, function (t) { return 0.045 * (1 - 0.45 * t); }, 0);
      var crown = tr5[7];
      for (k = 0; k < 5; k++) { a = k / 5 * Math.PI * 2 + R(); stem(b, [crown, crown.clone().add(v3(Math.cos(a) * 0.3, 0.25 + 0.2 * R(), Math.sin(a) * 0.3))], 0.016, 0); }
      for (k = 0; k < 150; k++) {
        a = R() * Math.PI * 2; var el = (R() - 0.35) * 1.4, rad5 = 0.2 + 0.4 * Math.sqrt(R());
        var c5 = crown.clone().add(v3(Math.cos(a) * rad5 * Math.cos(el), 0.35 + 0.45 * Math.sin(el), Math.sin(a) * rad5 * Math.cos(el)));
        var d5 = v3(Math.cos(a), 0.3 + 0.6 * R(), Math.sin(a)).normalize(), u5 = v3(R() - 0.5, 1, R() - 0.5).normalize();
        leafCard(b, c5, d5, u5, 0.32 + 0.1 * R(), 0.2, 0.3, 0.05, LEAF_CELLS.olive, R(), 0.2);
      }
    } else if (kind === "ficus") {                           // weeping fig: a bushy small tree, about 1.6 m
      var top6 = pot(b, 0, 0.22, 0.42), tr6 = [v3(0, top6 - 0.05, 0), v3(0.02, top6 + 0.5, 0.01), v3(-0.01, top6 + 0.75, 0.02)];
      stem(b, tr6, 0.02, 0);
      for (k = 0; k < 80; k++) {
        a = R() * Math.PI * 2; var el6 = (R() - 0.3) * 1.5, r6 = 0.2 + 0.3 * R(), c6 = tr6[2].clone().add(v3(Math.cos(a) * r6 * Math.cos(el6), 0.25 + 0.35 * Math.sin(el6), Math.sin(a) * r6 * Math.cos(el6)));
        var d6 = v3(Math.cos(a), -0.2 + 0.5 * R(), Math.sin(a)).normalize(), u6 = v3(R() - 0.5, 1, R() - 0.5).normalize();
        leafCard(b, c6, d6, u6, 0.26 + 0.08 * R(), 0.18, 0.4, 0.05, LEAF_CELLS.ficus, R(), 0.8);
      }
    } else if (kind === "fern") {                            // Boston fern on a stand: arching fronds, about 0.9 m
      var top7 = pot(b, 1, 0.2, 0.3), stand = b.count(); latheOn(b, 0, -0.03, 0, [[0.0, 0], [0.24, 0], [0.24, 0.03], [0.0, 0.03]], 24, MT.WOOD);
      for (var lg = 0; lg < 3; lg++) { var la = lg / 3 * Math.PI * 2; tubeAlong(b, [v3(Math.cos(la) * 0.16, -0.03, Math.sin(la) * 0.16), v3(Math.cos(la) * 0.22, -0.5, Math.sin(la) * 0.22)], 0.014, 6, MT.WOOD, 0); }
      b.tag(stand, null, 2);
      for (k = 0; k < 26; k++) { a = R() * Math.PI * 2; var d7 = v3(Math.cos(a), 0.5 + 0.6 * R(), Math.sin(a)).normalize();
        leafCard(b, v3(Math.cos(a) * 0.04, top7, Math.sin(a) * 0.04), d7, v3(-Math.cos(a) * 0.3, 1, -Math.sin(a) * 0.3).normalize(), 0.45 + 0.25 * R(), 0.22, 0.9 + 0.4 * R(), 0.05, LEAF_CELLS.fern, R(), 0.3); }
    } else {                                                 // pothos trailing from a small pot
      var top8 = pot(b, 0, 0.12, 0.16);
      for (k = 0; k < 5; k++) { a = R() * Math.PI * 2; var pp = v3(Math.cos(a) * 0.08, top8, Math.sin(a) * 0.08), dd = v3(Math.cos(a), -0.2, Math.sin(a)).normalize(), chain = [pp.clone()];
        for (var j = 0; j < 7; j++) { pp = pp.clone().add(dd.clone().multiplyScalar(0.09)); pp.y -= 0.06 * j * (0.8 + 0.4 * R()); chain.push(pp.clone());
          leafCard(b, pp, v3(Math.cos(a + (j % 2 ? 1 : -1)), 0.2, Math.sin(a + (j % 2 ? 1 : -1))).normalize(), UP, 0.1 + 0.03 * R(), 0.09, 0.2, 0.15, LEAF_CELLS.pothos, R(), 0.6); }
        stem(b, chain, 0.003, 1); }
    }
  }); }
  // a plant on the floor of a wing room: s along the wing, u in from the glass
  function wingPlant(B, sg, s, u, y, kind, seed, rot) { place(B, plantBuilder(kind, seed), sg, s, u, y, rot || 0); obst(sg, s - 0.3, s + 0.3, u - 0.3, u + 0.3); }
