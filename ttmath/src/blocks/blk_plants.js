  /* ===================== Plants: real house plants in the wings and the palace ===================== */
  // Each plant is built from leaf cards cut out of one drawn leaf texture (alpha test in the LEAF material), on stems
  // and trunks, in a pot of glazed ceramic, terracotta or dark fibreglass. Light is baked per vertex like the rest of
  // the furniture; the leaves also let light through from behind. Kinds: fig (fiddle-leaf fig), monstera, snake plant,
  // kentia palm, olive tree, ficus, fern, pothos; and in colour: Japanese maple (red), croton, anthurium (red spathes),
  // moth orchid (white and pink), bird of paradise, agave (blue-grey), bromeliad (a red star).
  var LEAF_CELLS = { fig: [0, 0], monstera: [1, 0], snake: [2, 0], kentia: [3, 0], olive: [0, 1], ficus: [1, 1], fern: [2, 1], pothos: [3, 1],
                     maple: [0, 2], croton: [1, 2], anthurium: [2, 2], spathe: [3, 2], orchid: [0, 3], bloom: [1, 3], strelitzia: [2, 3], agave: [3, 3] };
  function leafTexture() {
    var N = 1024, C = 256, cv = document.createElement("canvas"); cv.width = cv.height = N;
    var g = cv.getContext("2d", { willReadFrequently: true }), rnd = mulberry(77);   // on the CPU: its thousands of small marks took seconds through the GPU
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
    // a sprig: a twig with small leaves either side (the ficus: small glossy ovals)
    function sprig(cx, cy, n, lenA, widA, cTop, cUnder, tw) {
      var x0 = cx * C, y0 = cy * C; g.save(); g.lineCap = "round";
      g.strokeStyle = tw; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + C / 2, y0 + C); g.quadraticCurveTo(x0 + C * 0.44, y0 + C * 0.5, x0 + C / 2 + 6, y0 + C * 0.06); g.stroke();
      for (var k = 0; k < n; k++) { var t = 0.1 + 0.85 * k / n, y = y0 + C - C * 0.9 * t, sd = k % 2 ? 1 : -1, a = sd * (0.75 + 0.35 * rnd()) - 0.2 * sd * t, ln = C * lenA * (1 - 0.35 * t) * (0.85 + 0.3 * rnd()), wd = C * widA * (0.85 + 0.3 * rnd());
        g.save(); g.translate(x0 + C / 2 - 4 * (1 - t), y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wd, -ln * 0.45, 0, -ln); g.quadraticCurveTo(-wd, -ln * 0.45, 0, 0);
        g.fillStyle = rnd() < 0.25 ? cUnder : cTop; g.fill(); g.strokeStyle = "rgba(220,226,190,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -2); g.lineTo(0, -ln * 0.9); g.stroke(); g.restore(); }
      g.restore();
    }
    // olive: a spray of narrow leaves in pairs along a grey twig and its side shoots, dark grey-green above and silvery
    // below, a third of them turned to show the silver; a pale midrib on each (v0.42)
    (function () {
      var x0 = 0, y0 = C, rnd = mulberry(5077), leaves = [], tw = []; g.save(); g.beginPath(); g.rect(x0, y0, C, C); g.clip(); g.lineCap = "round"; g.lineJoin = "round";
      function path(xa, ya, xb, yb, bend) { var p = []; for (var k = 0; k <= 12; k++) { var t = k / 12; p.push([xa + (xb - xa) * t + bend * Math.sin(Math.PI * t), ya + (yb - ya) * t]); } return p; }
      function at(p, t) { var f = t * (p.length - 1), i = Math.min(p.length - 2, Math.floor(f)), k = f - i; return [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k, Math.atan2(p[i + 1][0] - p[i][0], -(p[i + 1][1] - p[i][1]))]; }
      function shoot(p, w0, n, L0, L1) {
        tw.push([p, w0]);
        for (var j = 0; j < n; j++) { var t = 0.14 + 0.8 * j / n, q = at(p, t), L = (L0 + (L1 - L0) * t) * (0.88 + 0.24 * rnd());
          [-1, 1].forEach(function (sd) { leaves.push({ x: q[0], y: q[1], a: q[2] + sd * (0.45 + 0.35 * rnd()), L: L * (0.9 + 0.2 * rnd()), under: rnd() < 0.4, k: 0.82 + 0.3 * rnd() }); }); }
        var e = at(p, 1); leaves.push({ x: e[0], y: e[1], a: e[2] + (rnd() - 0.5) * 0.3, L: L1 * 0.9, under: rnd() < 0.3, k: 0.9 + 0.2 * rnd() });
      }
      var main = path(x0 + C * 0.5, y0 + C, x0 + C * 0.51, y0 + C * 0.07, -C * 0.03);
      shoot(main, 2.2, 9, C * 0.21, C * 0.17);
      [[0.15, -1], [0.3, 1], [0.45, -1], [0.6, 1], [0.75, -1]].forEach(function (s) {
        var q = at(main, s[0]), ang = q[2] + s[1] * (0.5 + 0.2 * rnd()), ln = C * (0.34 - 0.2 * s[0]);
        shoot(path(q[0], q[1], q[0] + Math.sin(ang) * ln, q[1] - Math.cos(ang) * ln, s[1] * C * 0.015), 1.3, 5, C * 0.2, C * 0.16);
      });
      tw.forEach(function (t) { var p = t[0]; for (var k = 1; k < p.length; k++) { g.strokeStyle = "rgb(104,96,82)"; g.lineWidth = t[1] * (1 - 0.55 * k / p.length); g.beginPath(); g.moveTo(p[k - 1][0], p[k - 1][1]); g.lineTo(p[k][0], p[k][1]); g.stroke(); } });
      leaves.sort(function (a, b) { return (a.under ? 0 : 1) + a.k * 0.5 - (b.under ? 0 : 1) - b.k * 0.5; });
      leaves.forEach(function (l) {
        var c = l.under ? [152, 160, 140] : [80, 90, 66], k = l.k, w = l.L * 0.2;
        g.save(); g.translate(l.x, l.y); g.rotate(l.a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w, -l.L * 0.45, 0, -l.L); g.quadraticCurveTo(-w, -l.L * 0.45, 0, 0);
        g.fillStyle = "rgb(" + Math.round(c[0] * k) + "," + Math.round(c[1] * k) + "," + Math.round(c[2] * k) + ")"; g.fill();
        g.strokeStyle = l.under ? "rgba(214,218,196,0.5)" : "rgba(170,180,140,0.35)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, -1.5); g.lineTo(0, -l.L * 0.9); g.stroke(); g.restore();
      });
      g.restore();
    })();
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
    // Japanese maple (a red Acer palmatum): a spray of small leaves in pairs on long red stalks along a slender twig, each
    // leaf of seven narrow lobes cut deep toward the stalk, drawn out to sharp tips and finely toothed; burgundy to wine to
    // crimson, a few turning orange, darker at the heart; the leaves underneath in shadow, those on top in the light (v0.42)
    (function () {
      var x0 = 0, y0 = 2 * C, rnd = mulberry(4021); g.save(); g.beginPath(); g.rect(x0, y0, C, C); g.clip(); g.lineCap = "round"; g.lineJoin = "round";
      var LA = [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9], LL = [1, 0.95, 0.95, 0.8, 0.8, 0.48, 0.48], WT = [0, 0.22, 0.5, 0.64, 0.82, 0.94, 1], WW = [0.1, 0.42, 0.9, 1.0, 0.62, 0.2, 0];
      function wl(u) { for (var i = 1; i < WT.length; i++) if (u <= WT[i]) { var k = (u - WT[i - 1]) / (WT[i] - WT[i - 1]); k = k * k * (3 - 2 * k); return WW[i - 1] + (WW[i] - WW[i - 1]) * k; } return 0; }
      function col(c, k) { return "rgb(" + Math.round(Math.min(255, c[0] * k)) + "," + Math.round(Math.min(255, c[1] * k)) + "," + Math.round(Math.min(255, c[2] * k)) + ")"; }
      var PAL = [[92, 16, 30], [112, 20, 34], [128, 24, 36], [146, 30, 38], [166, 52, 36]];
      function mapleLeaf(cx, cy, R, rot, c, sh) {
        var lobes = [];
        g.beginPath();
        for (var i = 0; i < 7; i++) {
          var L = R * LL[i] * (0.9 + 0.2 * rnd()), hw = 0.17 * L, a = rot + LA[i] + (rnd() - 0.5) * 0.1, sa = Math.sin(a), ca = Math.cos(a), n = 18;
          lobes.push([a, L]);
          for (var s = 0; s < 2; s++) for (var k = 0; k <= n; k++) {
            var kk = s ? n - k : k, u = kk / n, w = hw * wl(u) * (1 + (kk % 2 && u > 0.3 && u < 0.92 ? 0.16 : 0)) * (s ? -1 : 1);
            var px = cx + sa * u * L + ca * w, py = cy - ca * u * L + sa * w;
            if (!s && !k) g.moveTo(px, py); else g.lineTo(px, py);
          }
          g.closePath();
        }
        var gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
        gr.addColorStop(0, col(c, 0.55 * sh)); gr.addColorStop(0.35, col(c, 0.85 * sh)); gr.addColorStop(0.8, col(c, 1.0 * sh)); gr.addColorStop(1, col([c[0] * 1.05, c[1] * 1.25, c[2]], 1.04 * sh));
        g.fillStyle = gr; g.fill("nonzero");
        g.strokeStyle = "rgba(44,6,14," + (0.35 + 0.2 * (1 - sh)) + ")"; g.lineWidth = 0.7;
        lobes.forEach(function (lb) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(lb[0]) * lb[1] * 0.82, cy - Math.cos(lb[0]) * lb[1] * 0.82); g.stroke(); });
      }
      // the twig and its shoots, then the leaves on their stalks, the lowest layer first
      var leaves = [], tw = [];
      function twigPts(xa, ya, xb, yb, bend) { var p = []; for (var k = 0; k <= 16; k++) { var t = k / 16; p.push([xa + (xb - xa) * t + bend * Math.sin(Math.PI * t), ya + (yb - ya) * t]); } return p; }
      function along(p, t) { var f = t * (p.length - 1), i = Math.min(p.length - 2, Math.floor(f)), k = f - i; return [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k, Math.atan2(p[i + 1][0] - p[i][0], -(p[i + 1][1] - p[i][1]))]; }
      function shoot(p, w0, nodes, R0, R1) {
        tw.push([p, w0]);
        nodes.forEach(function (t, ni) {
          var q = along(p, t), r = R0 + (R1 - R0) * t;
          [-1, 1].forEach(function (sd) {
            var ang = q[2] + sd * (0.95 + 0.35 * rnd()), pl = r * (0.75 + 0.35 * rnd()), rr = r * (0.85 + 0.25 * rnd());
            var ex = q[0] + Math.sin(ang) * pl, ey = q[1] - Math.cos(ang) * pl;
            leaves.push({ x0: q[0], y0: q[1], x: ex + Math.sin(ang) * rr * 0.12, y: ey - Math.cos(ang) * rr * 0.12, R: rr, rot: ang + (rnd() - 0.5) * 0.3, layer: rnd() + (ni % 2 ? 0.3 : 0) });
          });
        });
        var e = p[p.length - 1], q2 = along(p, 1);
        leaves.push({ x0: e[0], y0: e[1], x: e[0] + Math.sin(q2[2]) * R1 * 0.7, y: e[1] - Math.cos(q2[2]) * R1 * 0.7, R: R1 * 0.95, rot: q2[2], layer: 1.4 });
      }
      var main = twigPts(x0 + C * 0.5, y0 + C, x0 + C * 0.52, y0 + C * 0.1, C * 0.04);
      shoot(main, 2.4, [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.79, 0.89], C * 0.12, C * 0.09);
      [[0.16, 1], [0.28, -1], [0.42, 1], [0.55, -1], [0.7, 1]].forEach(function (s) {
        var q = along(main, s[0]), ang = q[2] + s[1] * (0.6 + 0.2 * rnd()), ln = C * (0.34 - 0.16 * s[0]);
        shoot(twigPts(q[0], q[1], q[0] + Math.sin(ang) * ln, q[1] - Math.cos(ang) * ln, s[1] * C * 0.02), 1.4, [0.3, 0.6, 0.86], C * 0.1, C * 0.08);
      });
      tw.forEach(function (t) { var p = t[0]; for (var k = 1; k < p.length; k++) { g.strokeStyle = "rgb(96,42,36)"; g.lineWidth = t[1] * (1 - 0.55 * k / p.length); g.beginPath(); g.moveTo(p[k - 1][0], p[k - 1][1]); g.lineTo(p[k][0], p[k][1]); g.stroke(); } });
      leaves.sort(function (a, b) { return a.layer - b.layer; });
      leaves.forEach(function (l) {
        var sh = 0.62 + 0.42 * Math.min(1, l.layer / 1.4), c = PAL[rnd() < 0.07 ? 4 : Math.floor(rnd() * 4)];
        g.strokeStyle = "rgb(120,34,32)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(l.x0, l.y0); g.lineTo(l.x, l.y); g.stroke();
        mapleLeaf(l.x, l.y, l.R, l.rot, c, sh);
      });
      g.restore();
    })();
    // croton: a leathery leaf, dark green with yellow veins and red and orange patches
    leaf(1, 2, smoothW([0, 0.06, 0.3, 0.6, 0.85, 1], [0.08, 0.34, 0.5, 0.46, 0.26, 0.0]), { c0: [44, 66, 26], c1: [96, 104, 34], c2: [150, 120, 36], vein: [244, 206, 52], nv: 7, rise: 1.2, mid: 5.0, lat: 3.0, veinA: 0.95 });
    (function () { g.save(); g.beginPath(); g.rect(C, 2 * C, C, C); g.clip(); g.globalCompositeOperation = "source-atop";
      for (var k = 0; k < 48; k++) { var px = C + C * (0.28 + 0.44 * rnd()), py = 2 * C + C * (0.08 + 0.85 * rnd()), cols = ["rgba(200,40,26,0.75)", "rgba(226,110,26,0.7)", "rgba(236,200,56,0.6)"]; g.fillStyle = cols[Math.floor(rnd() * 3)]; g.beginPath(); g.ellipse(px, py, 4 + 9 * rnd(), 3 + 6 * rnd(), rnd() * 3, 0, 6.3); g.fill(); }
      g.restore(); })();
    // anthurium: a glossy heart-shaped leaf, very dark green; its spathe: glossy red with a pale yellow spadix
    leaf(2, 2, smoothW([0, 0.04, 0.16, 0.4, 0.7, 0.9, 1], [0.5, 0.78, 0.86, 0.72, 0.42, 0.16, 0.0]), { c0: [22, 44, 20], c1: [28, 54, 24], c2: [26, 50, 22], vein: [70, 100, 56], nv: 6, rise: 0.8, mid: 2.6, lat: 1.2, veinA: 0.5, len: 0.9 });
    leaf(3, 2, smoothW([0, 0.04, 0.16, 0.4, 0.7, 0.9, 1], [0.5, 0.8, 0.88, 0.74, 0.44, 0.16, 0.0]), { c0: [150, 14, 20], c1: [196, 22, 28], c2: [176, 18, 24], vein: [120, 10, 16], nv: 6, rise: 0.8, mid: 1.6, lat: 1.0, veinA: 0.35, len: 0.86 });
    (function () { g.save(); g.lineCap = "round"; g.strokeStyle = "rgb(236,214,120)"; g.lineWidth = 7; g.beginPath(); g.moveTo(3 * C + C / 2, 2 * C + C * 0.8); g.lineTo(3 * C + C * 0.55, 2 * C + C * 0.32); g.stroke(); g.restore(); })();
    // moth orchid leaf: broad, thick, mid green and glossy
    leaf(0, 3, smoothW([0, 0.08, 0.3, 0.6, 0.85, 1], [0.3, 0.62, 0.8, 0.82, 0.6, 0.0]), { c0: [52, 86, 38], c1: [62, 98, 42], c2: [58, 92, 40], vein: [96, 130, 70], nv: 4, rise: 1.0, mid: 2.2, lat: 0.8, veinA: 0.3 });
    // its flower spray: an arching stem with white petals and magenta throats
    (function () {
      var x0 = C, y0 = 3 * C; g.save(); g.beginPath(); g.rect(x0, y0, C, C); g.clip(); g.lineCap = "round";
      g.strokeStyle = "rgb(70,92,48)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0 + C * 0.5, y0 + C); g.quadraticCurveTo(x0 + C * 0.42, y0 + C * 0.35, x0 + C * 0.78, y0 + C * 0.1); g.stroke();
      for (var k = 0; k < 6; k++) {
        var t = 0.3 + 0.62 * k / 6, px = x0 + C * (0.5 - 0.08 * Math.sin(Math.PI * t) + 0.26 * t * t), py = y0 + C - C * 0.9 * t, R = C * (0.15 - 0.03 * t);
        g.save(); g.translate(px, py);
        for (var q = 0; q < 5; q++) { var a = q / 5 * Math.PI * 2 + 0.3; g.fillStyle = q < 2 ? "rgb(246,240,244)" : "rgb(240,232,238)"; g.beginPath(); g.ellipse(Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, R * (q < 3 ? 0.62 : 0.45), R * 0.42, a, 0, 6.3); g.fill(); }
        g.fillStyle = "rgb(186,40,110)"; g.beginPath(); g.ellipse(0, R * 0.12, R * 0.26, R * 0.2, 0, 0, 6.3); g.fill();
        g.fillStyle = "rgb(236,200,60)"; g.beginPath(); g.arc(0, -R * 0.04, R * 0.08, 0, 6.3); g.fill();
        g.restore();
      }
      g.restore();
    })();
    // bird of paradise: a long paddle, blue-green with a pale midrib, torn into strips at the edge here and there
    leaf(2, 3, smoothW([0, 0.04, 0.2, 0.5, 0.8, 0.95, 1], [0.08, 0.3, 0.42, 0.46, 0.4, 0.2, 0.0]), { c0: [46, 82, 64], c1: [56, 96, 72], c2: [52, 90, 68], vein: [196, 204, 150], nv: 22, rise: 0.25, mid: 3.4, lat: 0.7, veinA: 0.35 });
    (function () { g.save(); g.globalCompositeOperation = "destination-out"; g.lineCap = "round";
      for (var k = 0; k < 6; k++) { var y = 3 * C + C * (0.2 + 0.65 * rnd()), sd = rnd() < 0.5 ? -1 : 1; g.lineWidth = 2.5; g.beginPath(); g.moveTo(2 * C + C / 2 + sd * C * 0.26, y); g.lineTo(2 * C + C / 2 + sd * C * 0.08, y - 3); g.stroke(); }
      g.restore(); })();
    // agave: a thick sword, blue-grey with a paler middle, small dark teeth along the margins and a sharp brown tip
    (function () {
      var x0 = 3 * C, y0 = 3 * C, base = y0 + C * 0.99; g.save(); g.beginPath();
      function wA(t) { return 0.62 * Math.pow(Math.max(0, 1 - t), 0.7) * (0.8 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 2))); }
      for (var k = 0; k <= 60; k++) { var t = k / 60; g.lineTo(x0 + C / 2 + wA(t) * C / 2, base - t * C * 0.97); }
      for (k = 60; k >= 0; k--) { t = k / 60; g.lineTo(x0 + C / 2 - wA(t) * C / 2, base - t * C * 0.97); }
      g.closePath(); var gr = g.createLinearGradient(x0, 0, x0 + C, 0); gr.addColorStop(0, "rgb(88,114,112)"); gr.addColorStop(0.5, "rgb(134,160,154)"); gr.addColorStop(1, "rgb(88,114,112)"); g.fillStyle = gr; g.fill();
      g.fillStyle = "rgb(70,52,40)";
      for (k = 1; k < 14; k++) { t = k / 15; [-1, 1].forEach(function (sd) { var px = x0 + C / 2 + sd * wA(t) * C / 2, py = base - t * C * 0.97; g.beginPath(); g.moveTo(px, py - 3); g.lineTo(px + sd * 4, py); g.lineTo(px, py + 3); g.fill(); }); }
      g.strokeStyle = "rgb(84,60,44)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + C / 2, base - C * 0.9); g.lineTo(x0 + C / 2, base - C * 0.97); g.stroke();
      g.restore();
    })();
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
    // the mipmaps made here rather than by the GPU, each cell's alpha scaled so its leaves cover as much of it at every
    // size as at full size: a spray of small leaves stays leafy from across the garden instead of thinning to bare twigs
    // as the averaged alpha falls under the cut (v0.42)
    var base = new Uint8Array(d.buffer.slice(0)), mips = [{ data: base, width: N, height: N }], cov = new Float32Array(16), sPrev = new Float32Array(16).fill(1);
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (base[(y * N + x) * 4 + 3] > 127) cov[(y >> 8) * 4 + (x >> 8)] += 1 / (C * C);
    for (var w = N >> 1, src = base, sw = N; w >= 1; src = lvl, sw = w, w >>= 1) {
      var lvl = new Uint8Array(w * w * 4), out = new Uint8Array(w * w * 4), cs = w >> 2;
      for (y = 0; y < w; y++) for (x = 0; x < w; x++) for (var ch = 0; ch < 4; ch++) { var i0 = (2 * y * sw + 2 * x) * 4 + ch; lvl[(y * w + x) * 4 + ch] = (src[i0] + src[i0 + 4] + src[i0 + sw * 4] + src[i0 + sw * 4 + 4] + 2) >> 2; }
      out.set(lvl);
      if (cs >= 1) for (var cl = 0; cl < 16; cl++) {     // in each cell, the scale that brings its coverage back to full size's
        var hist = new Uint32Array(256), cx0 = (cl & 3) * cs, cy0 = (cl >> 2) * cs, want = cov[cl] * cs * cs, acc = 0, aT = 255;
        for (y = cy0; y < cy0 + cs; y++) for (x = cx0; x < cx0 + cs; x++) hist[lvl[(y * w + x) * 4 + 3]]++;
        for (var av = 255; av > 0; av--) { acc += hist[av]; if (acc >= want) { aT = av; break; } }
        var sc = want < 0.5 ? 1 : Math.min(6, Math.max(0.6, 127.5 / Math.max(aT, 1))); sPrev[cl] = sc;
        for (y = cy0; y < cy0 + cs; y++) for (x = cx0; x < cx0 + cs; x++) { var ia = (y * w + x) * 4 + 3; out[ia] = Math.min(255, Math.round(lvl[ia] * sc)); }
      } else { var sm = 0; for (cl = 0; cl < 16; cl++) sm += sPrev[cl] / 16; for (var q2 = 0; q2 < w * w; q2++) out[q2 * 4 + 3] = Math.min(255, Math.round(lvl[q2 * 4 + 3] * sm)); }
      mips.push({ data: out, width: w, height: w });
    }
    var t = new THREE.DataTexture(base, N, N, THREE.RGBAFormat); t.mipmaps = mips;
    t.generateMipmaps = false; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = maxAniso; t.flipY = false; t.needsUpdate = true;
    return t;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // one leaf card: base point, direction of the midrib, the up of its blade, length, width, droop and fold (a V along the
  // midrib); its picture is the cell of the leaf texture (texture v grows downward, like the canvas)
  function leafCard(b, base, dir, up, len, wid, droop, fold, cell, tint, gloss, na) {
    var side = new THREE.Vector3().crossVectors(dir, up).normalize(), nrm = new THREE.Vector3().crossVectors(side, dir).normalize();
    var u0 = cell[0] / 4, v0 = cell[1] / 4, NA = na || 4;
    b.surf(2, NA, function (i, j, q) {
      var t = j / NA, sx = i - 1, p = base.clone().addScaledVector(dir, len * t).addScaledVector(nrm, -droop * len * t * t)
        .addScaledVector(side, sx * wid / 2).addScaledVector(nrm, Math.abs(sx) * fold * wid / 2);
      q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.m = MT.LEAF; q.f[0] = u0 + (i / 2) * 0.25; q.f[1] = v0 + (1 - t * 0.97 - 0.01) * 0.25; q.f2[0] = tint; q.f2[1] = gloss;
    });
  }
  // a stem, a cane or a trunk: g.y = -1 makes the LEAF material draw bark (tint 0) or a green stem (tint 1)
  function stem(b, pts, r, tint) { var n0 = b.count(); tubeAlong(b, pts, r, 7, MT.LEAF, tint); b.tag(n0, tint, -1); }
  // plants set into a bed (a planter's soil) are built without their pots: POT_H is each kind's pot height, its soil line
  // at 0.94 of it, which bedPlant puts on the bed's soil
  var POT_H = { fig: 0.46, monstera: 0.42, snake: 0.34, kentia: 0.5, olive: 0.55, ficus: 0.42, fern: 0.3, maple: 0.42, croton: 0.34, anthurium: 0.2, orchid: 0.16, strelitzia: 0.45, agave: 0.24, bromeliad: 0.17, pothos: 0.16 }, POT_SKIP = false;
  function bedPlant(B, kind, seed, M, soilY, k) {    // M: the bed's frame at the plant's spot (y = 0 there); soilY: the soil's height in it; k: the plant's scale
    B.add(plantBuilder(kind, seed, true, k), M.clone().multiply(new THREE.Matrix4().makeTranslation(0, soilY - (POT_H[kind] || 0.4) * 0.94 * k, 0)).multiply(new THREE.Matrix4().makeScale(k, k, k)));
  }
  // a garden bed's understory plant at its real size (v0.45): the potted plant's proportions (FOLIAGE), without its pot
  function bedPlantReal(B, kind, seed, M, soilY, k) {
    B.add(plantBuilder(kind, seed, true, 1, true), M.clone().multiply(new THREE.Matrix4().makeTranslation(0, soilY - (POT_H[kind] || 0.4) * 0.94 * k, 0)).multiply(new THREE.Matrix4().makeScale(k, k, k)));
  }
  // a plant in a bed by a wall or the glass, or under a roof (F: the ring's frame at its spot, z out from the palace): its
  // crown kept inside, folded softly back near where it would reach through (zIn toward the palace, zOut away from it, yMax
  // up from the floor), the way a gardener trains and prunes a tree under glass (v0.41; 0 or undefined: no limit that way)
  function bedPlantKept(B, kind, seed, F, rot, soilY, k, zIn, zOut, yMax) {
    var t = new Builder();
    t.add(plantBuilder(kind, seed, true, k), new THREE.Matrix4().makeRotationY(rot || 0).multiply(new THREE.Matrix4().makeTranslation(0, soilY - (POT_H[kind] || 0.4) * 0.94 * k, 0)).multiply(new THREE.Matrix4().makeScale(k, k, k)));
    function fold(v, m) { var kn = 0.7 * m; return v < kn ? v : kn + (m - kn) * Math.tanh((v - kn) / (m - kn)); }
    for (var q = 0; q < t.p.length / 3; q++) {
      var z = t.p[q * 3 + 2], y = t.p[q * 3 + 1];
      if (zOut > 0 && z > 0) t.p[q * 3 + 2] = fold(z, zOut); else if (zIn > 0 && z < 0) t.p[q * 3 + 2] = -fold(-z, zIn);
      if (yMax > 0 && y > 0) t.p[q * 3 + 1] = fold(y, yMax);
    }
    B.add(t, F);
  }
  function pot(b, kind, r, h) {
    POT_TOP = h * 0.94; if (POT_SKIP) { POT_END = b.count(); return h * 0.94; }
    // kind: 0 glazed white ceramic, 1 terracotta, 2 dark fibreglass
    var prof = kind === 1 ? [[r * 0.72, 0], [r * 0.8, h * 0.08], [r, h * 0.88], [r * 1.06, h * 0.9], [r * 1.06, h], [r * 0.95, h]]
      : kind === 2 ? [[r * 0.94, 0], [r, h * 0.04], [r, h], [r * 0.93, h]] : [[r * 0.7, 0], [r * 0.82, h * 0.06], [r, h * 0.55], [r * 0.98, h * 0.95], [r * 0.94, h], [r * 0.88, h]];
    var n0 = b.count();
    latheOn(b, 0, 0, 0, prof, 32, kind === 1 ? MT.PLASTER : kind === 2 ? MT.PLASTIC : MT.CERAMIC, kind === 1 ? undefined : (kind === 2 ? 1 : 0), kind === 1 ? 2 : 0);
    if (kind === 1) b.tag(n0, null, 2);
    var n1 = b.count(); latheOn(b, 0, 0, 0, [[0, h * 0.94], [prof[prof.length - 1][0], h * 0.94]], 24, MT.RUBBER); POT_END = b.count(); return h * 0.94;
  }
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }
  var UP = v3(0, 1, 0);
  // the foliage's spread and height scaled toward a real indoor plant's (measured 7 Oct 2026: a kentia 3.4 m across, an olive 2.1 m, a monstera 2.4 m, a fern 2.1 m wide and 0.4 m high)
  var FOLIAGE = { kentia: [0.55, 0.85], fern: [0.48, 1.15], monstera: [0.62, 0.9], strelitzia: [0.75, 1.0], ficus: [0.7, 0.95], orchid: [0.55, 1.0], bromeliad: [0.65, 1.0] }, POT_END = 0, POT_TOP = 0;
  function plantBuilder(kind, seed, bed, lk, real) { POT_SKIP = !!bed; var LKm = bed ? Math.min(2.2, Math.max(1, (lk || 1) / 1.45)) : 1;
    var out = furn("plant_" + kind + "_" + seed + (bed ? "_bed" + (LKm > 1 ? LKm.toFixed(2) : "") + (real ? "r" : "") : ""), function (b) {
    var R = mulberry(seed * 131 + kind.length * 7), k, a;
    if (kind === "fig") {                                    // fiddle-leaf fig, about 1.8 m
      var top = pot(b, 0, 0.24, 0.46), H = 1.55 + 0.35 * R(), tr = [v3(0, top - 0.05, 0)];
      for (k = 1; k <= 6; k++) tr.push(v3(0.03 * Math.sin(k * 1.3 + seed), top + (H - top) * k / 6, 0.03 * Math.cos(k * 1.1)));
      stem(b, tr, function (t) { return 0.022 * (1 - 0.5 * t); }, 0);
      for (k = 0; k < Math.round(46 * LKm); k++) {          // in a bed, smaller leaves and more of them (fiddle leaves grow big, so half way)
        var t = 0.32 + 0.68 * Math.pow(R(), 0.8), ang = R() * Math.PI * 2, pt = tr[Math.min(6, Math.floor(t * 6))].clone().lerp(tr[Math.min(6, Math.ceil(t * 6))], (t * 6) % 1);
        var dir = v3(Math.cos(ang), 0.55 + 0.6 * R() - 0.5 * (1 - t), Math.sin(ang)).normalize(), up = v3(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y)).normalize();
        if (up.lengthSq() < 0.1) up.set(1, 0, 0);
        leafCard(b, pt, dir, up, (0.26 + 0.12 * R()) / Math.sqrt(LKm), (0.19 + 0.06 * R()) / Math.sqrt(LKm), 0.25 + 0.2 * R(), 0.22, LEAF_CELLS.fig, R(), 0.85);
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
    } else if (kind === "kentia" && LKm > 1.2) {            // kentia palm grown up, in a bed: three or four slender green trunks of different heights,
      // each with a crownshaft and a crown of eight fronds arching out and down, the leaflets hanging from them (v0.42)
      var top4b = pot(b, 2, 0.27, 0.5), nT4 = 3 + Math.floor(R() * 2);
      for (k = 0; k < nT4; k++) {
        a = k / nT4 * 6.283 + R() * 0.6; var c4 = Math.cos(a), s4 = Math.sin(a), ht = 0.75 + 0.55 * (k === 0 ? 1 : R()), lean4 = 0.06 + 0.1 * R();
        var tk = [v3(c4 * 0.05, top4b - 0.02, s4 * 0.05), v3(c4 * (0.05 + lean4 * 0.4), top4b + ht * 0.5, s4 * (0.05 + lean4 * 0.4)), v3(c4 * (0.05 + lean4), top4b + ht, s4 * (0.05 + lean4))];
        stem(b, tk, function (t) { return 0.022 * (1 - 0.25 * t); }, 1);
        var hd = tk[2], cs4 = [hd, hd.clone().add(v3(0, 0.14, 0))]; stem(b, cs4, function (t) { return 0.02 * (1 - 0.3 * t); }, 1);
        for (var fr = 0; fr < 8; fr++) {
          var af = fr / 8 * 6.283 + R() * 0.5, ef = 0.25 + 0.7 * R(), df = v3(Math.cos(af) * Math.cos(ef), Math.sin(ef), Math.sin(af) * Math.cos(ef)).normalize();
          var uf = v3(0, 1, 0).sub(df.clone().multiplyScalar(df.y)).normalize();
          leafCard(b, cs4[1], df, uf, 0.62 + 0.18 * R(), 0.46 + 0.08 * R(), 0.75 + 0.3 * (1 - ef), -0.55, LEAF_CELLS.kentia, R(), 0.5);
        }
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
    } else if (kind === "olive") {                           // olive tree in a big terracotta pot, about 2 m: a gnarled, leaning trunk; limbs leaving
      // it at different heights and leaning out, each ending in two or three clumps of silvery sprays: a loose, broad crown
      // with the light through it, broader still as a tree in a bed (v0.42)
      var top5 = pot(b, 1, 0.33, 0.55), lean = R() * 6.28, tr5 = [], sf = LKm > 1 ? 1.35 : 0.8;
      for (k = 0; k <= 6; k++) { var tt = k / 6; tr5.push(v3(0.07 * tt * Math.cos(lean) + 0.022 * Math.sin(k * 1.9 + seed), top5 - 0.05 + 0.66 * tt, 0.07 * tt * Math.sin(lean) + 0.022 * Math.cos(k * 1.4 + seed))); }
      stem(b, tr5, function (t) { return 0.05 * (1 - 0.3 * t) * (1 + 0.1 * Math.sin(t * 17)); }, 0);
      var nL = 4 + Math.floor(R() * 2), off5 = R() * 6.28;
      for (var lb5 = 0; lb5 < nL; lb5++) {
        var ph5 = off5 + lb5 / nL * 6.283 + (R() - 0.5) * 0.5, el5 = 0.55 + 0.35 * R(), L5 = (0.3 + 0.1 * R()) * sf, f5 = 0.62 + 0.38 * lb5 / nL;
        var P5 = tr5[Math.round(f5 * 6)], dir5 = v3(Math.cos(ph5) * Math.cos(el5), Math.sin(el5), Math.sin(ph5) * Math.cos(el5));
        var E5 = P5.clone().addScaledVector(dir5, L5), M5 = P5.clone().lerp(E5, 0.5).add(v3((R() - 0.5) * 0.05, 0.03, (R() - 0.5) * 0.05));
        stem(b, [P5, M5, E5], function (t) { return 0.028 * (1 - 0.6 * t); }, 0);
        for (var cq = 0; cq < 2 + Math.floor(R() * 2); cq++) {   // the clumps at the limb's end
          var cph = ph5 + (R() - 0.5) * 1.6, cc = E5.clone().add(v3(Math.cos(cph) * (0.08 + 0.1 * R()) * sf, (0.02 + 0.12 * R()) * sf, Math.sin(cph) * (0.08 + 0.1 * R()) * sf)), cr = (0.12 + 0.05 * R()) * sf;
          var out5 = cc.clone().sub(v3(tr5[6].x, tr5[6].y + 0.2, tr5[6].z)).normalize();
          stem(b, [E5, E5.clone().lerp(cc, 0.6).add(v3(0, 0.02, 0)), cc], 0.008, 0);
          for (var q5 = 0; q5 < Math.round(14 * LKm * LKm); q5++) {   // sprays over the clump's outer side, pointing every way out of it
            var u5 = v3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(); if (u5.dot(out5) < -0.2) u5.addScaledVector(out5, -1.6 * u5.dot(out5)).normalize();
            var ln5 = (0.24 + 0.06 * R()) / LKm, d5 = u5.clone().add(v3(0, -0.15, 0)).normalize();
            leafCard(b, cc.clone().addScaledVector(u5, cr * (0.55 + 0.45 * R())).addScaledVector(d5, -0.35 * ln5), d5, v3(R() - 0.5, 1, R() - 0.5).normalize(), ln5, ln5 * 0.95, 0.15, 0.05, LEAF_CELLS.olive, R(), 0.2, 2);
          }
        }
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
      var top7 = pot(b, 1, 0.2, 0.3), stand = b.count(); if (!POT_SKIP) latheOn(b, 0, -0.03, 0, [[0.0, 0], [0.24, 0], [0.24, 0.03], [0.0, 0.03]], 24, MT.WOOD);
      for (var lg = 0; lg < (POT_SKIP ? 0 : 3); lg++) { var la = lg / 3 * Math.PI * 2; tubeAlong(b, [v3(Math.cos(la) * 0.16, -0.03, Math.sin(la) * 0.16), v3(Math.cos(la) * 0.22, -0.5, Math.sin(la) * 0.22)], 0.014, 6, MT.WOOD, 0); }
      if (b.count() > stand) b.tag(stand, null, 2);
      for (k = 0; k < 26; k++) { a = R() * Math.PI * 2; var d7 = v3(Math.cos(a), 0.5 + 0.6 * R(), Math.sin(a)).normalize();
        leafCard(b, v3(Math.cos(a) * 0.04, top7, Math.sin(a) * 0.04), d7, v3(-Math.cos(a) * 0.3, 1, -Math.sin(a) * 0.3).normalize(), 0.45 + 0.25 * R(), 0.22, 0.9 + 0.4 * R(), 0.05, LEAF_CELLS.fern, R(), 0.3); }
    } else if (kind === "maple") {                          // Japanese maple, about 1.5 m: a short trunk forking into three stems that lean out;
      // branches from them to four tiers, each tier a flat plate of leaf sprays over the outer part of a dome-shaped crown,
      // open between the tiers and inside, a cap of sprays on top (v0.42)
      pot(b, 2, 0.3, 0.42);
      var fk = v3(0.02, 0.58, -0.01), yc = 1.06, RH = 0.55, RV = 0.42, lead = [], KS = 73 * LKm * LKm;
      stem(b, [v3(0, 0.37, 0), v3(0.012, 0.5, 0), fk], function (t) { return 0.032 * (1 - 0.2 * t); }, 0);
      function onPath(P, t) { var f = t * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)); return P[i].clone().lerp(P[i + 1], f - i); }
      function spray(pos, az, el, tl) {                     // one spray centred near pos, pointing out toward az, its face tilted by tl
        var d9 = v3(Math.cos(az), el, Math.sin(az)).normalize(), ln = (0.22 + 0.07 * R()) / LKm;
        var up = v3(-d9.x * 0.2 + (R() - 0.5) * tl, 1, -d9.z * 0.2 + (R() - 0.5) * tl).normalize();
        leafCard(b, pos.clone().addScaledVector(d9, -0.4 * ln), d9, up, ln, ln * 0.95, 0.12, 0.04, LEAF_CELLS.maple, R(), 0.35, 2);
      }
      for (var ld = 0; ld < 3; ld++) {
        var al = ld / 3 * Math.PI * 2 + R() * 0.8, spl = 0.2 + 0.08 * R(), hl = 0.67 + 0.13 * R(), cl = Math.cos(al), sl = Math.sin(al);
        var lp = [fk, fk.clone().add(v3(cl * 0.06, 0.2, sl * 0.06)), v3(cl * spl * 0.6, 0.58 + hl * 0.6, sl * spl * 0.6), v3(cl * spl, 0.58 + hl, sl * spl)];
        stem(b, lp, function (t) { return 0.02 * (1 - 0.6 * t); }, 0); lead.push({ a: al, p: lp, top: 0.58 + hl });
      }
      [0.82, 0.99, 1.16, 1.32].forEach(function (h0, ti) {
        var h = h0 + (R() - 0.5) * 0.04, rT = RH * Math.sqrt(Math.max(0, 1 - Math.pow((h - yc) / RV, 2))), nb = ti < 3 ? 4 : 3, off = R() * 6.3;
        for (var j = 0; j < nb; j++) {                    // the branches out to this tier, each from the stem nearest its side
          var ab = off + j / nb * Math.PI * 2 + (R() - 0.5) * 0.7, L0 = lead[0], dm = 9;
          lead.forEach(function (L) { var dd = Math.abs(((ab - L.a) % 6.283 + 9.425) % 6.283 - 3.1416); if (dd < dm) { dm = dd; L0 = L; } });
          var P = onPath(L0.p, Math.min(0.97, Math.max(0.05, (h - 0.07 - 0.58) / (L0.top - 0.58)))), E = v3(Math.cos(ab) * rT * 0.8, h, Math.sin(ab) * rT * 0.8);
          stem(b, [P, P.clone().lerp(E, 0.5).add(v3(0, 0.025, 0)), E], function (t) { return (0.011 - 0.002 * ti) * (1 - 0.6 * t); }, 0);
        }
        for (var q = 0; q < Math.round(KS * 0.65 * Math.PI * rT * rT); q++) {   // the plate: sprays over the tier's outer part
          var ph = R() * 6.283, rho = rT * Math.sqrt(0.35 + 0.65 * R()), e = rho / rT;
          spray(v3(Math.cos(ph) * rho, h + (R() - 0.5) * 0.07 - 0.05 * e * e, Math.sin(ph) * rho), ph + (R() - 0.5) * 1.2, -0.1 + 0.3 * R(), 0.6);
        }
      });
      for (var qc = 0; qc < Math.round(KS * 0.28); qc++) {   // the cap
        var phc = R() * 6.283, th = 0.8 * Math.sqrt(R()), rc = RH * Math.sin(th) * (0.85 + 0.15 * R());
        spray(v3(Math.cos(phc) * rc, yc + RV * Math.cos(th) - 0.04 * R(), Math.sin(phc) * rc), phc + (R() - 0.5) * 1.5, 0.25 + 0.45 * R(), 0.5);
      }
    } else if (kind === "croton") {                          // croton: a bush of leathery coloured leaves, about 0.9 m
      pot(b, 0, 0.24, 0.34);
      for (var cs = 0; cs < 5; cs++) { var ac = cs / 5 * Math.PI * 2 + R(), top = 0.7 + 0.3 * R(), cst = [v3(0, 0.3, 0), v3(Math.cos(ac) * 0.05, top * 0.7, Math.sin(ac) * 0.05), v3(Math.cos(ac) * 0.1, top, Math.sin(ac) * 0.1)];
        stem(b, cst, function (t) { return 0.012 * (1 - 0.4 * t); }, 1);
        for (var lc = 0; lc < 11; lc++) { var t2 = 0.35 + 0.65 * lc / 11, pc = v3(Math.cos(ac) * 0.1 * t2, 0.3 + (top - 0.3) * t2, Math.sin(ac) * 0.1 * t2), a2 = R() * 6.3, dc = v3(Math.cos(a2), 0.35 + 0.4 * R() - 0.3 * (1 - t2), Math.sin(a2)).normalize();
          leafCard(b, pc, dc, v3(-dc.x * 0.4, 1, -dc.z * 0.4).normalize(), 0.27 + 0.1 * R(), 0.13, 0.3, 0.12, LEAF_CELLS.croton, R(), 0.75); } }
    } else if (kind === "anthurium") {                       // anthurium: dark hearts and red spathes on long stalks, about 0.55 m
      pot(b, 0, 0.13, 0.2);
      for (var la = 0; la < 10; la++) { var aa = la / 10 * Math.PI * 2 + R() * 0.4, ha = 0.32 + 0.14 * R(), pa = [v3(0, 0.18, 0), v3(Math.cos(aa) * 0.06, ha * 0.8, Math.sin(aa) * 0.06), v3(Math.cos(aa) * 0.12, ha, Math.sin(aa) * 0.12)];
        stem(b, pa, 0.005, 1); var da = v3(Math.cos(aa), -0.25, Math.sin(aa)).normalize(); leafCard(b, pa[2], da, v3(-da.x * 0.5, 1, -da.z * 0.5).normalize(), 0.2 + 0.05 * R(), 0.15, 0.3, 0.1, LEAF_CELLS.anthurium, R(), 0.95); }
      for (var fa = 0; fa < 4; fa++) { var af = fa / 4 * Math.PI * 2 + 0.6, hf = 0.45 + 0.1 * R(), pf = [v3(0, 0.18, 0), v3(Math.cos(af) * 0.04, hf * 0.8, Math.sin(af) * 0.04), v3(Math.cos(af) * 0.08, hf, Math.sin(af) * 0.08)];
        stem(b, pf, 0.004, 1); var df = v3(Math.cos(af), 0.5, Math.sin(af)).normalize(); leafCard(b, pf[2], df, v3(-df.x * 0.6, 1, -df.z * 0.6).normalize(), 0.12, 0.09, 0.1, 0.1, LEAF_CELLS.spathe, R(), 0.95); }
    } else if (kind === "orchid") {                          // moth orchid: broad leaves at the base, two arching sprays on stakes, about 0.6 m
      pot(b, 0, 0.1, 0.16);
      for (var lo = 0; lo < 5; lo++) { var ao = lo / 5 * Math.PI * 2 + 0.2, d0 = v3(Math.cos(ao), 0.15, Math.sin(ao)).normalize(); leafCard(b, v3(0, 0.17, 0), d0, v3(0, 1, 0), 0.2 + 0.05 * R(), 0.09, 0.25, 0.15, LEAF_CELLS.orchid, R(), 0.8); }
      [0.4, 3.0].forEach(function (as) { var ps = [v3(0, 0.17, 0), v3(Math.cos(as) * 0.03, 0.45, Math.sin(as) * 0.03), v3(Math.cos(as) * 0.12, 0.6, Math.sin(as) * 0.12)];
        stem(b, ps, 0.004, 1); var ds = v3(Math.cos(as), 0.3, Math.sin(as)).normalize(); leafCard(b, ps[1], ds, v3(-Math.sin(as), 0.2, Math.cos(as)).normalize(), 0.38, 0.34, 0.12, 0.0, LEAF_CELLS.bloom, R(), 0.3); });
    } else if (kind === "strelitzia") {                      // bird of paradise: a fan of long paddle leaves on upright stalks, about 1.8 m
      pot(b, 1, 0.3, 0.45);
      for (var ls = 0; ls < 9; ls++) { var as2 = (ls / 9 - 0.5) * 2.2 + (R() - 0.5) * 0.3, side = (ls % 2 ? 1 : -1) * 0.12, hs = 0.9 + 0.5 * R(), ps2 = [v3(side * 0.2, 0.42, 0), v3(Math.sin(as2) * 0.12 + side * 0.1, hs * 0.75, Math.cos(as2) * 0.05), v3(Math.sin(as2) * 0.28, hs, Math.cos(as2) * 0.1)];
        stem(b, ps2, 0.012, 1); var d8 = v3(Math.sin(as2) * 0.6, 0.85, Math.cos(as2) * 0.25).normalize(); leafCard(b, ps2[2], d8, v3(-Math.cos(as2) * 0.2, 0.1, 1).normalize(), 0.75 + 0.2 * R(), 0.3, 0.35, 0.05, LEAF_CELLS.strelitzia, R(), 0.6); }
    } else if (kind === "agave") {                           // agave: a wide rosette of thick blue-grey swords in a low bowl, about 0.8 m across
      pot(b, 1, 0.34, 0.24);
      for (var lg = 0; lg < 22; lg++) { var ag = lg * 2.4, tier = lg / 22, dg = v3(Math.cos(ag) * (0.9 - 0.5 * tier), 0.45 + 0.9 * tier, Math.sin(ag) * (0.9 - 0.5 * tier)).normalize();
        leafCard(b, v3(Math.cos(ag) * 0.03, 0.23, Math.sin(ag) * 0.03), dg, v3(-dg.x * 0.4, 1, -dg.z * 0.4).normalize(), 0.42 - 0.12 * tier, 0.11, 0.08, 0.3, LEAF_CELLS.agave, R(), 0.3); }
    } else if (kind === "bromeliad") {                       // bromeliad: a rosette of glossy straps round a red star of bracts, about 0.45 m
      pot(b, 0, 0.12, 0.17);
      for (var lb = 0; lb < 14; lb++) { var ab2 = lb * 2.4, db = v3(Math.cos(ab2), 0.6 + 0.3 * R(), Math.sin(ab2)).normalize(); leafCard(b, v3(0, 0.17, 0), db, v3(-db.x * 0.5, 1, -db.z * 0.5).normalize(), 0.3 + 0.06 * R(), 0.06, 0.5, 0.2, LEAF_CELLS.orchid, R(), 0.85); }
      for (var rb = 0; rb < 7; rb++) { var ar = rb / 7 * Math.PI * 2, dr = v3(Math.cos(ar), 1.6, Math.sin(ar)).normalize(); leafCard(b, v3(0, 0.22, 0), dr, v3(-dr.x, 0.6, -dr.z).normalize(), 0.16, 0.06, 0.15, 0.2, LEAF_CELLS.spathe, R(), 0.9); }
    } else {                                                 // pothos: a crown of heart-shaped leaves over a small pot and a dozen vines trailing
      // from it, long on a wall shelf (pothoswall: forward only, never into the wall), shorter on a stand, short on a desk
      var top8 = pot(b, 0, 0.12, 0.16), wallOnly = kind === "pothoswall", nMin = wallOnly ? 6 : kind === "pothosstand" ? 5 : 4, nVar = wallOnly ? 4 : 3, fall = wallOnly ? 0.04 : 0.035;
      for (k = 0; k < 14; k++) { var tc = R() * Math.PI * 2; if (wallOnly) tc = Math.PI / 2 + (tc / Math.PI / 2 - 0.5) * 2.4;
        var dc = v3(Math.cos(tc) * 0.75, 0.55 + 0.35 * R(), Math.sin(tc) * 0.75).normalize();
        leafCard(b, v3(Math.cos(tc) * 0.03, top8 + 0.01, Math.sin(tc) * 0.03), dc, UP, 0.12 + 0.04 * R(), 0.09, 0.2, 0.15, LEAF_CELLS.pothos, R(), 0.6); }
      for (k = 0; k < 12; k++) { a = R() * Math.PI * 2; if (wallOnly) a = Math.PI / 2 + (a / Math.PI / 2 - 0.5) * 2.6;
        var nseg = nMin + Math.floor(R() * nVar), pp = v3(Math.cos(a) * 0.09, top8, Math.sin(a) * 0.09), dd = v3(Math.cos(a), -0.15, Math.sin(a)).normalize(), chain = [pp.clone()];
        for (var j = 0; j < nseg; j++) { pp = pp.clone().add(dd.clone().multiplyScalar(0.08)); pp.y -= fall * j * (0.8 + 0.4 * R()); chain.push(pp.clone());
          var sl = j % 2 ? 1 : -1, ov = v3(Math.cos(a), 0, Math.sin(a)), dl = v3(ov.x * 0.35 - ov.z * sl * 0.45, -0.8, ov.z * 0.35 + ov.x * sl * 0.45).normalize();   // each leaf hangs from the vine, its face outward
          leafCard(b, pp, dl, ov, 0.14 - 0.04 * j / nseg + 0.02 * R(), 0.1, 0.2, 0.15, LEAF_CELLS.pothos, R(), 0.6); }
        stem(b, chain, 0.003, 1); }
    }
    var fs = (!bed || real) && FOLIAGE[kind]; if (fs) {                           // real proportions: the foliage in toward a potted plant's spread
      for (var q = POT_END; q < b.p.length / 3; q++) { b.p[q * 3] *= fs[0]; b.p[q * 3 + 2] *= fs[0]; b.p[q * 3 + 1] = POT_TOP + (b.p[q * 3 + 1] - POT_TOP) * fs[1];
        var nx = b.n[q * 3] / fs[0], ny = b.n[q * 3 + 1] / fs[1], nz = b.n[q * 3 + 2] / fs[0], nl = Math.hypot(nx, ny, nz) || 1; b.n[q * 3] = nx / nl; b.n[q * 3 + 1] = ny / nl; b.n[q * 3 + 2] = nz / nl; } }
  }); POT_SKIP = false; return out; }
  // a plant on the floor of a wing room: s along the wing, u in from the glass
  function wingPlant(B, sg, s, u, y, kind, seed, rot) { place(B, plantBuilder(kind, seed), sg, s, u, y, rot || 0); obst(sg, s - 0.3, s + 0.3, u - 0.3, u + 0.3); }
