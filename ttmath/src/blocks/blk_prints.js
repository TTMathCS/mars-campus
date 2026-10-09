  /* ===================== The corridors' prints: framed mathematics along the Ring ===================== */
  // Jim, 6 Oct 2026: "please continue to improve/bugfix/continue for the walking experience and real life experience".
  // The lower corridor's long back wall gets a walk of framed prints, each facing a room and showing what it is named for
  // or used for; the upper corridor's two blind ends a print over a bench (the program: RING_ART in campus_rooms.py).
  // Each print is drawn on a cell of one canvas (warm paper, the picture, its title on the mat under it) and hung in an
  // oak frame under a brass picture light, a bench and a plant chosen for the corridor's low light where people wait.
  var PRINT = { W: 600, H: 400, cols: 4, w: 1.8, h: 1.2, yc: 1.7 }, PRINT_PLINTH = { anthurium: 1, bromeliad: 1, orchid: 1 };
  var PRC = { paper: "#f2eee5", ink: "#1f2430", red: "#c4502f", ochre: "#d9a23a", teal: "#2b7a78", navy: "#2c4a73", sand: "#e3d5b8", rose: "#b5546a", olive: "#6f8248" };
  function printBox(W, H) { var m = Math.round(H * 0.075); return { x: m, y: m, w: W - 2 * m, h: H - 3 * m }; }
  function dot(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); }
  // a knight's tour by Warnsdorff's rule (always to the square with the fewest ways on); a closed one if a start gives it
  function knightTour() {
    var M = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]], first = null;
    function onBoard(u, v) { return u >= 0 && u < 8 && v >= 0 && v < 8; }
    for (var st = 0; st < 64; st++) {
      var seen = {}, x = st % 8, y = (st / 8) | 0, path = [[x, y]]; seen[x + y * 8] = 1;
      var ways = function (u, v) { var c = 0; M.forEach(function (m) { if (onBoard(u + m[0], v + m[1]) && !seen[u + m[0] + (v + m[1]) * 8]) c++; }); return c; };
      while (path.length < 64) {
        var best = null, bw = 9;
        M.forEach(function (m) { var u = x + m[0], v = y + m[1]; if (!onBoard(u, v) || seen[u + v * 8]) return; var c = ways(u, v); if (c < bw) { bw = c; best = [u, v]; } });
        if (!best) break;
        x = best[0]; y = best[1]; seen[x + y * 8] = 1; path.push(best);
      }
      if (path.length < 64) continue;
      var dx = Math.abs(path[63][0] - path[0][0]), dy = Math.abs(path[63][1] - path[0][1]);
      if (dx * dy === 2) { path.closed = true; return path; }
      if (!first) first = path;
    }
    return first || [];
  }
  function hilbertXY(n, d) {
    var x = 0, y = 0, t = d;
    for (var s = 1; s < n; s *= 2) {
      var rx = 1 & (t >> 1), ry = 1 & (t ^ rx);
      if (!ry) { if (rx) { x = s - 1 - x; y = s - 1 - y; } var q = x; x = y; y = q; }
      x += s * rx; y += s * ry; t >>= 2;
    }
    return [x, y];
  }
  // the five Platonic solids: vertices and faces (each face's corners in order round it)
  function platonic() {
    var f = (1 + Math.sqrt(5)) / 2, S = {};
    S.tetra = { v: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], f: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]] };
    var cv = []; [-1, 1].forEach(function (x) { [-1, 1].forEach(function (y) { [-1, 1].forEach(function (z) { cv.push([x, y, z]); }); }); });
    S.cube = { v: cv, f: [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]] };
    var ov = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], of = [];
    [0, 1].forEach(function (i) { [2, 3].forEach(function (j) { [4, 5].forEach(function (k) { of.push([i, j, k]); }); }); });
    S.octa = { v: ov, f: of };
    var iv = []; [-1, 1].forEach(function (p) { [-1, 1].forEach(function (q) { iv.push([0, p, q * f], [p, q * f, 0], [q * f, 0, p]); }); });
    function d2(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) + (a[2] - b[2]) * (a[2] - b[2]); }
    var iff = [];
    for (var i = 0; i < 12; i++) for (var j = i + 1; j < 12; j++) for (var k = j + 1; k < 12; k++)
      if (Math.abs(d2(iv[i], iv[j]) - 4) < 1e-6 && Math.abs(d2(iv[j], iv[k]) - 4) < 1e-6 && Math.abs(d2(iv[i], iv[k]) - 4) < 1e-6) iff.push([i, j, k]);
    S.icosa = { v: iv, f: iff };
    // the dodecahedron: the icosahedron's face centres; round each of its corners, the five faces that meet there
    var dv = iff.map(function (t) { return [0, 1, 2].map(function (c) { return (iv[t[0]][c] + iv[t[1]][c] + iv[t[2]][c]) / 3; }); }), df = [];
    iv.forEach(function (p, vi) {
      var around = []; iff.forEach(function (t, fi) { if (t.indexOf(vi) >= 0) around.push(fi); });
      var n = p.slice(), ln = Math.hypot(n[0], n[1], n[2]); n = n.map(function (c) { return c / ln; });
      var u = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      var l1 = Math.hypot(e1[0], e1[1], e1[2]); e1 = e1.map(function (c) { return c / l1; });
      var e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
      around.sort(function (a, b) { var A = dv[a], B = dv[b]; return Math.atan2(A[0] * e2[0] + A[1] * e2[1] + A[2] * e2[2], A[0] * e1[0] + A[1] * e1[1] + A[2] * e1[2]) - Math.atan2(B[0] * e2[0] + B[1] * e2[1] + B[2] * e2[2], B[0] * e1[0] + B[1] * e1[1] + B[2] * e1[2]); });
      df.push(around);
    });
    S.dodeca = { v: dv, f: df };
    return S;
  }
  function serif(g, px, style) { g.font = (style ? style + " " : "") + Math.round(px) + "px " + SERIF; }
  // each print's picture, in its box b (the cell's own units); s, ox, oy: the canvas pixels per unit and the cell's corner
  // in canvas pixels, for the pictures drawn pixel by pixel
  var PRINT_DRAW = {
    knight: function (g, b) {
      var s = Math.min(b.w, b.h), x0 = b.x + (b.w - s) / 2, y0 = b.y + (b.h - s) / 2, c = s / 8, tour = knightTour();
      for (var j = 0; j < 8; j++) for (var i = 0; i < 8; i++) { g.fillStyle = (i + j) % 2 ? "#c2a77c" : "#efe5cc"; g.fillRect(x0 + i * c, y0 + j * c, c, c); }
      g.strokeStyle = PRC.ink; g.lineWidth = 2; g.strokeRect(x0 - 1, y0 - 1, s + 2, s + 2);
      function at(q) { return [x0 + (q[0] + 0.5) * c, y0 + (q[1] + 0.5) * c]; }
      g.strokeStyle = PRC.navy; g.lineWidth = 2.2; g.lineJoin = "round"; g.lineCap = "round"; g.beginPath();
      tour.forEach(function (q, k) { var p = at(q); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      if (tour.closed) g.closePath(); g.stroke();
      g.fillStyle = PRC.navy; tour.forEach(function (q) { var p = at(q); dot(g, p[0], p[1], 2.6); });
      var p0 = at(tour[0]); g.fillStyle = PRC.red; dot(g, p0[0], p0[1], 5.5);
      serif(g, c * 0.22, "italic"); g.fillStyle = "rgba(31,36,48,0.55)"; g.textAlign = "left"; g.textBaseline = "top";
      tour.forEach(function (q, k) { g.fillText(String(k + 1), x0 + q[0] * c + 3, y0 + q[1] * c + 2); });
    },
    partitions: function (g, b) {
      var P = [[6], [5, 1], [4, 2], [4, 1, 1], [3, 3], [3, 2, 1], [3, 1, 1, 1], [2, 2, 2], [2, 2, 1, 1], [2, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]];
      var cols = [PRC.red, PRC.ochre, PRC.teal, PRC.navy, PRC.rose, PRC.olive], rows = [P.slice(0, 4), P.slice(4, 8), P.slice(8)];
      var c = Math.min(b.w / 27, (b.h - 12) / 19.5), y0 = b.y + (b.h - 19.5 * c) / 2 + 2;
      rows.forEach(function (row) {
        serif(g, Math.min(14, c * 0.8), "italic");
        var slot = function (p) { return Math.max(p[0] * c, g.measureText(p.join(" + ")).width + 4); }, gap = 1.6 * c, tw = row.reduce(function (t, p) { return t + slot(p); }, 0) + gap * (row.length - 1), x = b.x + (b.w - tw) / 2;
        var hgt = Math.max.apply(null, row.map(function (p) { return p.length; }));
        row.forEach(function (p) {
          var ox = x + (slot(p) - p[0] * c) / 2;
          p.forEach(function (n, r) { for (var q = 0; q < n; q++) { g.fillStyle = cols[r]; g.fillRect(ox + q * c, y0 + r * c, c, c); g.strokeStyle = PRC.ink; g.lineWidth = 1.2; g.strokeRect(ox + q * c, y0 + r * c, c, c); } });
          serif(g, Math.min(14, c * 0.8), "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "top"; g.fillText(p.join(" + "), x + slot(p) / 2, y0 + (hgt + 0.3) * c);
          x += slot(p) + gap;
        });
        y0 += (hgt + 1.5) * c + 0.9 * c;
      });
    },
    pascal: function (g, b) {
      var N = 32, d = Math.min(b.w / (N + 1), b.h / ((N - 1) * 0.866 + 1.2)), R = d / Math.sqrt(3) * 0.93, cx = b.x + b.w / 2, y0 = b.y + (b.h - (N - 1) * 0.866 * d) / 2;
      for (var n = 0; n < N; n++) for (var k = 0; k <= n; k++) {
        var odd = (k & (n - k)) === 0, x = cx + (k - n / 2) * d, y = y0 + n * 0.866 * d;
        g.beginPath(); for (var e = 0; e < 6; e++) { var an = Math.PI / 6 + e * Math.PI / 3; g[e ? "lineTo" : "moveTo"](x + R * Math.cos(an), y + R * Math.sin(an)); } g.closePath();
        g.fillStyle = odd ? (n % 8 < 4 ? PRC.navy : PRC.teal) : "#e7dcc7"; g.fill();
      }
      // the first rows' numbers, small, on the left
      serif(g, 11, "italic"); g.fillStyle = PRC.ink; g.textAlign = "left"; g.textBaseline = "middle";
      var row = [1]; for (var r = 0; r < 7; r++) { g.fillText(row.join("  "), b.x + 4, b.y + 14 + r * 17); var nx = [1]; for (var q = 1; q < row.length; q++) nx.push(row[q - 1] + row[q]); nx.push(1); row = nx; }
    },
    galton: function (g, b) {
      var n = 12, N = 165, bins = [], C = 1, k;
      for (k = 0; k <= n; k++) { bins.push(Math.round(N * C / 4096)); C = C * (n - k) / (k + 1); }
      var bw = 25, bd = bw / 3, cx = b.x + b.w / 2, yF = b.y + 4, yP = b.y + 34, sp = 10.5, yB0 = yP + (n - 1) * sp + 9, yB1 = b.y + b.h;
      g.strokeStyle = PRC.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 70, yF); g.lineTo(cx - 9, yP - 12); g.moveTo(cx + 70, yF); g.lineTo(cx + 9, yP - 12); g.stroke();
      g.fillStyle = PRC.ink; for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) dot(g, cx + (j - i / 2) * bw, yP + i * sp, 1.9);
      g.lineWidth = 1.2; for (k = 0; k <= n + 1; k++) { var xd = cx + (k - (n + 1) / 2) * bw; g.beginPath(); g.moveTo(xd, yB0); g.lineTo(xd, yB1); g.stroke(); }
      g.lineWidth = 2; g.beginPath(); g.moveTo(cx - (n + 1) / 2 * bw - 6, yB1); g.lineTo(cx + (n + 1) / 2 * bw + 6, yB1); g.stroke();
      function ball(x, y) { g.fillStyle = PRC.ochre; dot(g, x, y, bd * 0.46); g.fillStyle = "rgba(255,255,255,0.45)"; dot(g, x - bd * 0.13, y - bd * 0.13, bd * 0.14); }
      bins.forEach(function (cnt, kk) { var x0 = cx + (kk - (n + 1) / 2) * bw; for (var q = 0; q < cnt; q++) ball(x0 + bd * (q % 3 + 0.5), yB1 - bd * (Math.floor(q / 3) + 0.5) - 1); });
      [[2, 0.6], [5, 2.4], [7, 3.5], [9, 5.6], [10, 4.4]].forEach(function (f) { ball(cx + (f[1] - f[0] / 2) * bw, yP + f[0] * sp - 5); });
      g.strokeStyle = PRC.red; g.lineWidth = 2.2; g.beginPath();
      for (var t = -0.5; t <= n + 0.5; t += 0.1) { var cnt = N / Math.sqrt(2 * Math.PI * 3) * Math.exp(-(t - 6) * (t - 6) / 6), X = cx + (t - n / 2) * bw, Y = yB1 - cnt / 3 * bd - 1; if (t > -0.45) g.lineTo(X, Y); else g.moveTo(X, Y); }
      g.stroke();
    },
    turing: function (g, b, s, ox, oy) {
      var X0 = Math.round(ox + b.x * s), Y0 = Math.round(oy + b.y * s), w = Math.round(b.w * s), h = Math.round(b.h * s);
      var img = g.createImageData(w, h), d = img.data, R = mulberry(1952), K = 26, kx = [], ky = [], ph = [], k0 = 2 * Math.PI / (14 * s), sig = Math.sqrt(K / 2);
      for (var i = 0; i < K; i++) { var th = R() * Math.PI; kx.push(k0 * Math.cos(th)); ky.push(k0 * Math.sin(th)); ph.push(R() * 2 * Math.PI); }
      var A = [58, 36, 24], B2 = [233, 201, 138];
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var f = 0; for (var q = 0; q < K; q++) f += Math.cos(kx[q] * x + ky[q] * y + ph[q]);
        var u = x / w, thr = sig * 1.05 * (1 - Math.min(1, Math.max(0, (u - 0.18) / 0.55))), v = Math.min(1, Math.max(0, (f - thr) / (0.45 * sig) + 0.5)), o = (y * w + x) * 4;
        d[o] = A[0] + (B2[0] - A[0]) * v; d[o + 1] = A[1] + (B2[1] - A[1]) * v; d[o + 2] = A[2] + (B2[2] - A[2]) * v; d[o + 3] = 255;
      }
      g.putImageData(img, X0, Y0);
    },
    cannon: function (g, b) {
      var vF = 1.08, apo = vF * vF / (2 - vF * vF), S = b.h / (1.05 + apo) * 0.9, cx = b.x + b.w * 0.37, cy = b.y + b.h / 2 - (apo - 1.05) / 2 * S, Re = 0.8;
      function P(r, th) { return [cx + r * S * Math.sin(th), cy - r * S * Math.cos(th)]; }
      g.fillStyle = "#dfe5e3"; g.beginPath(); g.arc(cx, cy, Re * S, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = "rgba(31,36,48,0.18)"; g.lineWidth = 1; for (var la = -60; la <= 60; la += 30) { var yy = cy - Re * S * Math.sin(la * D2R), hw = Re * S * Math.cos(la * D2R); g.beginPath(); g.moveTo(cx - hw, yy); g.lineTo(cx + hw, yy); g.stroke(); }
      [0.35, 0.7].forEach(function (k) { g.beginPath(); g.ellipse(cx, cy, Re * S * k, Re * S, 0, 0, 2 * Math.PI); g.stroke(); });
      g.strokeStyle = PRC.ink; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, Re * S, 0, 2 * Math.PI); g.stroke();
      var m0 = P(Re, -0.22), m1 = P(1.0, 0), m2 = P(Re, 0.22); g.fillStyle = "#b9a888"; g.beginPath(); g.moveTo(m0[0], m0[1]); g.lineTo(m1[0], m1[1]); g.lineTo(m2[0], m2[1]); g.closePath(); g.fill(); g.stroke();
      function path(fr, th1, col, lw, dash) {
        g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash || []); g.beginPath();
        for (var th = 0, k = 0; th <= th1 + 1e-9; th += 0.01, k++) { var r = fr(th); if (r < Re) break; var p = P(r, th); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
        g.stroke(); g.setLineDash([]);
      }
      [0.5, 0.62, 0.74, 0.85, 0.93].forEach(function (v) { var e = 1 - v * v; path(function (th) { return v * v / (1 - e * Math.cos(th)); }, 6.3, PRC.ink, 1.4); });
      path(function () { return 1; }, 2 * Math.PI, PRC.navy, 1.8);
      path(function (th) { var e = vF * vF - 1; return vF * vF / (1 + e * Math.cos(th)); }, 2 * Math.PI, PRC.red, 1.8, [7, 4]);
      g.strokeStyle = PRC.ink; g.lineWidth = 4; g.lineCap = "butt"; var c0 = P(1.0, -0.012); g.beginPath(); g.moveTo(c0[0] - 6, c0[1] - 2); g.lineTo(c0[0] + 9, c0[1] - 5); g.stroke();
      serif(g, 13, "italic"); g.fillStyle = PRC.ink; g.textAlign = "left"; g.textBaseline = "middle";
      function note(r, th, col, l1, l2) { var q = P(r, th); g.fillStyle = col; g.fillText(l1, q[0], q[1] - 8); g.fillText(l2, q[0], q[1] + 9); }
      note(1.2, 0.9, PRC.ink, "too slow:", "falls to the ground");
      note(1.45, 1.75, PRC.navy, "fast enough:", "falls round for ever");
      note(1.5, 2.55, PRC.red, "faster:", "an ellipse");
    },
    hilbert: function (g, b) {
      var n = 32, s = Math.min(b.w, b.h) * 0.98, c = s / n, x0 = b.x + (b.w - s) / 2, y0 = b.y + (b.h - s) / 2, prev = null;
      g.lineWidth = 2.6; g.lineCap = "round";
      for (var d = 0; d < n * n; d++) {
        var q = hilbertXY(n, d), p = [x0 + (q[0] + 0.5) * c, y0 + (n - 0.5 - q[1]) * c];
        if (prev) { var t = d / (n * n - 1); g.strokeStyle = "hsl(" + Math.round(178 - 165 * t) + "," + Math.round(48 + 12 * t) + "%," + Math.round(36 + 6 * Math.sin(Math.PI * t)) + "%)"; g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke(); }
        prev = p;
      }
    },
    kepler: function (g, b) {
      var a = Math.min(b.w * 0.34, b.h * 0.56), e = 0.6, bb = a * Math.sqrt(1 - e * e), cx = b.x + b.w / 2, cy = b.y + b.h / 2, fx = cx + a * e, N = 12;
      function solve(M) { var E = M; for (var it = 0; it < 12; it++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
      for (var k = 0; k < N; k++) {
        var E0 = solve(2 * Math.PI * k / N), E1 = solve(2 * Math.PI * (k + 1) / N);
        g.beginPath(); g.moveTo(fx, cy); for (var t = 0; t <= 24; t++) { var E = E0 + (E1 - E0) * t / 24; g.lineTo(cx + a * Math.cos(E), cy - bb * Math.sin(E)); } g.closePath();
        g.fillStyle = k % 2 ? "#eadfc5" : "#d8bf86"; g.fill(); g.strokeStyle = "rgba(31,36,48,0.45)"; g.lineWidth = 1; g.stroke();
      }
      g.strokeStyle = PRC.ink; g.lineWidth = 1.8; g.beginPath(); g.ellipse(cx, cy, a, bb, 0, 0, 2 * Math.PI); g.stroke();
      g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - a - 8, cy); g.lineTo(cx + a + 8, cy); g.stroke(); g.setLineDash([]);
      var sg = g.createRadialGradient(fx, cy, 1, fx, cy, 13); sg.addColorStop(0, "#fff1c4"); sg.addColorStop(0.5, "#f2b33d"); sg.addColorStop(1, "rgba(217,130,40,0)");
      g.fillStyle = sg; dot(g, fx, cy, 13);
      var Ep = solve(2 * Math.PI * 2 / N); g.fillStyle = PRC.navy; dot(g, cx + a * Math.cos(Ep), cy - bb * Math.sin(Ep), 5);
      g.strokeStyle = PRC.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - a * e - 5, cy - 5); g.lineTo(cx - a * e + 5, cy + 5); g.moveTo(cx - a * e - 5, cy + 5); g.lineTo(cx - a * e + 5, cy - 5); g.stroke();
    },
    sunflower: function (g, b) {
      var N = 1100, ga = Math.PI * (3 - Math.sqrt(5)), Rr = Math.min(b.w, b.h) * 0.48, c = Rr / Math.sqrt(N), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      var A = [64, 38, 20], B2 = [163, 114, 44];
      for (var n = 1; n <= N; n++) {
        var r = c * Math.sqrt(n), th = n * ga, t = Math.sqrt(n / N), dk = (n % 34) < 17 ? 1 : 0.84;
        g.fillStyle = "rgb(" + Math.round((A[0] + (B2[0] - A[0]) * t) * dk) + "," + Math.round((A[1] + (B2[1] - A[1]) * t) * dk) + "," + Math.round((A[2] + (B2[2] - A[2]) * t) * dk) + ")";
        dot(g, cx + r * Math.cos(th), cy + r * Math.sin(th), c * (0.36 + 0.16 * t));
      }
      serif(g, 13, "italic"); g.fillStyle = PRC.ink; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText("137.5° between", cx + Rr + 16, cy - 9); g.fillText("one seed and the next", cx + Rr + 16, cy + 11);
    },
    solids: function (g, b) {
      var S = platonic(), keys = ["tetra", "cube", "octa", "dodeca", "icosa"], names = ["tetrahedron", "cube", "octahedron", "dodecahedron", "icosahedron"], cols = [PRC.red, PRC.ochre, PRC.teal, PRC.navy, PRC.rose];
      var cw = b.w / 5, rad = Math.min(cw * 0.42, b.h * 0.34), L = [-0.45, 0.6, 0.66], ll = Math.hypot(L[0], L[1], L[2]);
      keys.forEach(function (key, i) {
        var so = S[key], cx = b.x + cw * (i + 0.5), cy = b.y + b.h * 0.44, yaw = [-0.5, 0.6, 0.42, 0.3, 0.22][i], pit = [0.5, 0.45, 0.36, 0.33, 0.3][i];
        var vr = so.v.map(function (p) { var x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw), z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw), y = p[1]; return [x, y * Math.cos(pit) - z * Math.sin(pit), y * Math.sin(pit) + z * Math.cos(pit)]; });
        var R0 = Math.max.apply(null, vr.map(function (p) { return Math.hypot(p[0], p[1], p[2]); })), k = rad / R0;
        so.f.forEach(function (fc) {
          var P = fc.map(function (vi) { return vr[vi]; }), u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], w = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
          var nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], cen = [0, 1, 2].map(function (c) { return P.reduce(function (s, p) { return s + p[c]; }, 0) / P.length; });
          if (nn[0] * cen[0] + nn[1] * cen[1] + nn[2] * cen[2] < 0) nn = nn.map(function (c) { return -c; });
          if (nn[2] <= 0) return;
          var ln = Math.hypot(nn[0], nn[1], nn[2]), lam = Math.max(0, (nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]) / (ln * ll)), sh = 0.55 + 0.45 * lam;
          var c0 = parseInt(cols[i].slice(1), 16), rr = (c0 >> 16) & 255, gg = (c0 >> 8) & 255, bl = c0 & 255;
          g.fillStyle = "rgb(" + Math.round(Math.min(255, rr * sh + 30 * lam)) + "," + Math.round(Math.min(255, gg * sh + 30 * lam)) + "," + Math.round(Math.min(255, bl * sh + 30 * lam)) + ")";
          g.beginPath(); P.forEach(function (p, j) { g[j ? "lineTo" : "moveTo"](cx + p[0] * k, cy - p[1] * k); }); g.closePath(); g.fill();
          g.strokeStyle = PRC.ink; g.lineWidth = 1.4; g.lineJoin = "round"; g.stroke();
        });
        serif(g, 14, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "top";
        g.fillText(names[i], cx, b.y + b.h * 0.84); serif(g, 12); g.fillStyle = "rgba(31,36,48,0.7)"; g.fillText(so.f.length + " faces", cx, b.y + b.h * 0.84 + 18);
      });
    },
    buffon: function (g, b) {
      var d = 40, l = 30, n = 220, rows = Math.floor(b.h / d), top = b.y + (b.h - rows * d) / 2, seed = 1, R, list, cross;
      for (seed = 1; seed < 400; seed++) {
        R = mulberry(seed * 7919); list = []; cross = 0;
        for (var i = 0; i < n; i++) { var x = b.x + 12 + R() * (b.w - 24), y = top + 6 + R() * (rows * d - 12), th = R() * Math.PI, dx = Math.cos(th) * l / 2, dy = Math.sin(th) * l / 2, c = Math.floor((y - dy - top) / d) !== Math.floor((y + dy - top) / d); list.push([x - dx, y - dy, x + dx, y + dy, c]); if (c) cross++; }
        if (Math.abs(2 * l * n / (d * cross) - Math.PI) < 0.005) break;
      }
      g.strokeStyle = "rgba(31,36,48,0.55)"; g.lineWidth = 1.2; for (var k = 0; k <= rows; k++) { g.beginPath(); g.moveTo(b.x, top + k * d); g.lineTo(b.x + b.w, top + k * d); g.stroke(); }
      g.lineCap = "round"; list.forEach(function (q) { g.strokeStyle = q[4] ? PRC.red : PRC.ink; g.lineWidth = q[4] ? 2.3 : 1.8; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); g.fillStyle = g.strokeStyle; dot(g, q[0], q[1], 1.6); });
      serif(g, 14, "italic"); g.textAlign = "right"; g.textBaseline = "bottom"; var tx = b.x + b.w - 6, ty = b.y + b.h - 4, txt = n + " needles, " + cross + " cross:  2 × " + n + " × " + l + " ÷ (" + d + " × " + cross + ") = " + (2 * l * n / (d * cross)).toFixed(3);
      g.fillStyle = "rgba(242,238,229,0.92)"; g.fillRect(tx - g.measureText(txt).width - 8, ty - 20, g.measureText(txt).width + 12, 22); g.fillStyle = PRC.ink; g.fillText(txt, tx, ty);
    },
    penrose: function (g, b) {
      var phi = (1 + Math.sqrt(5)) / 2, cx = b.x + b.w / 2, cy = b.y + b.h / 2, Rw = Math.hypot(b.w, b.h) * 0.56, T = [];
      for (var i = 0; i < 10; i++) {
        var B = [Math.cos((2 * i - 1) * Math.PI / 10), Math.sin((2 * i - 1) * Math.PI / 10)], C = [Math.cos((2 * i + 1) * Math.PI / 10), Math.sin((2 * i + 1) * Math.PI / 10)];
        if (i % 2 === 0) { var q = B; B = C; C = q; }
        T.push([0, [0, 0], B, C]);
      }
      function mix(P, Q, t) { return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; }
      for (var it = 0; it < 6; it++) {
        var out = [];
        T.forEach(function (t) {
          var A = t[1], B = t[2], C = t[3];
          if (t[0] === 0) { var P = mix(A, B, 1 / phi); out.push([0, C, P, B], [1, P, C, A]); }
          else { var Q = mix(B, A, 1 / phi), R = mix(B, C, 1 / phi); out.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]); }
        });
        T = out;
      }
      function X(p) { return cx + p[0] * Rw; } function Y(p) { return cy + p[1] * Rw; }
      [[0, "#c9704f"], [1, "#e9dbbb"]].forEach(function (cc) {
        g.fillStyle = cc[1]; g.beginPath();
        T.forEach(function (t) { if (t[0] !== cc[0]) return; g.moveTo(X(t[1]), Y(t[1])); g.lineTo(X(t[2]), Y(t[2])); g.lineTo(X(t[3]), Y(t[3])); g.closePath(); });
        g.fill();
      });
      g.strokeStyle = "#3a2f28"; g.lineWidth = 1.1; g.lineJoin = "round"; g.beginPath();
      T.forEach(function (t) { g.moveTo(X(t[3]), Y(t[3])); g.lineTo(X(t[1]), Y(t[1])); g.lineTo(X(t[2]), Y(t[2])); });
      g.stroke();
    },
    harmonics: function (g, b) {
      var names = ["the fundamental", "an octave", "an octave and a fifth", "two octaves", "and a major third", "and a fifth"], rh = b.h / 6, x0 = b.x + 150, x1 = b.x + b.w - 14;
      for (var n = 1; n <= 6; n++) {
        var yc = b.y + rh * (n - 0.5), A = rh * 0.36, col = [PRC.navy, PRC.teal, PRC.olive, PRC.ochre, PRC.red, PRC.rose][n - 1];
        g.fillStyle = col; g.globalAlpha = 0.16; g.beginPath();
        for (var t = 0; t <= 200; t++) { var x = x0 + (x1 - x0) * t / 200, y = yc - A * Math.sin(n * Math.PI * t / 200); g[t ? "lineTo" : "moveTo"](x, y); }
        for (t = 200; t >= 0; t--) { x = x0 + (x1 - x0) * t / 200; y = yc + A * Math.sin(n * Math.PI * t / 200); g.lineTo(x, y); }
        g.closePath(); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = col; g.lineWidth = 2;
        [-1, 1].forEach(function (sg) { g.beginPath(); for (var t2 = 0; t2 <= 200; t2++) { var xx = x0 + (x1 - x0) * t2 / 200, yy = yc + sg * A * Math.sin(n * Math.PI * t2 / 200); g[t2 ? "lineTo" : "moveTo"](xx, yy); } g.stroke(); });
        g.strokeStyle = "rgba(31,36,48,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, yc); g.lineTo(x1, yc); g.stroke();
        g.fillStyle = PRC.ink; for (var k = 0; k <= n; k++) dot(g, x0 + (x1 - x0) * k / n, yc, k === 0 || k === n ? 3.4 : 2.6);
        serif(g, 15); g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(String(n), b.x + 6, yc - 1);
        serif(g, 12.5, "italic"); g.fillText(names[n - 1], b.x + 24, yc - 1);
      }
    },
    cardioid: function (g, b) {
      var N = 200, R = Math.min(b.w, b.h) * 0.47, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      function P(k) { var t = 2 * Math.PI * k / N + Math.PI; return [cx + R * Math.cos(t), cy - R * Math.sin(t)]; }
      g.lineWidth = 0.9;
      for (var k = 0; k < N; k++) { var p = P(k), q = P(2 * k % N), t = k / N; g.strokeStyle = "rgba(" + Math.round(150 + 50 * t) + "," + Math.round(50 + 30 * t) + "," + Math.round(80 - 20 * t) + ",0.62)"; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      g.strokeStyle = PRC.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
      g.fillStyle = PRC.ink; for (k = 0; k < N; k++) { var pp = P(k); dot(g, pp[0], pp[1], 1.3); }
      serif(g, 13, "italic"); g.textAlign = "right"; g.textBaseline = "bottom"; g.fillText("k  →  2k  (mod 200)", b.x + b.w - 8, b.y + b.h - 8);
    },
    pidigits: function (g, b) {                                       // the first digits of pi, each digit its own colour, in rows: no pattern ever repeats
      var D = piDigits(1000).replace(".", ""), cols = 40, rows = Math.ceil(D.length / cols), cw = b.w / cols, ch = Math.min(cw * 1.25, b.h / rows);
      var pal = ["#e8e2d4", "#c4502f", "#d9a23a", "#e3c35a", "#6f8248", "#2b7a78", "#2c4a73", "#5e4a8a", "#b5546a", "#1f2430"];
      for (var i = 0; i < D.length && i < cols * rows; i++) { var dgt = +D[i], x = b.x + (i % cols) * cw, yy = b.y + Math.floor(i / cols) * ch;
        g.fillStyle = pal[dgt]; g.fillRect(x + 0.6, yy + 0.6, cw - 1.2, ch - 1.2);
        g.fillStyle = dgt === 0 || dgt === 3 ? "rgba(31,36,48,0.8)" : "rgba(242,238,229,0.9)"; serif(g, ch * 0.62); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(D[i], x + cw / 2, yy + ch / 2 + 1); }
    },
    spectrum: function (g, b) {                                       // radio to gamma: a wave shortening across, the band's names, the visible slice opened out below
      var x0 = b.x + 8, w = b.w - 16, yb = b.y + b.h * 0.3, cuts = [0, 0.24, 0.4, 0.55, 0.585, 0.72, 0.86, 1.0], i;
      var names = ["Radio", "Microwave", "Infrared", "", "Ultraviolet", "X-ray", "Gamma"], tone = ["#ddd5c4", "#d3cab7", "#d9c2b0", "", "#cbc4d8", "#c2cad6", "#bccbc6"];
      for (i = 0; i < 7; i++) { var xa = x0 + w * cuts[i], xb = x0 + w * cuts[i + 1];
        if (i === 3) { var gv = g.createLinearGradient(xa, 0, xb, 0); ["#c0392b", "#e67e22", "#f1c40f", "#27ae60", "#2980b9", "#6c3483"].forEach(function (c, k) { gv.addColorStop(k / 5, c); }); g.fillStyle = gv; }
        else g.fillStyle = tone[i];
        g.fillRect(xa, yb - 26, xb - xa, 52);
        if (names[i]) { serif(g, 13, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(names[i], (xa + xb) / 2, yb - 34); } }
      g.strokeStyle = "rgba(31,36,48,0.85)"; g.lineWidth = 1.1; g.beginPath();                    // the wave, its wavelength falling a hundredfold and more across
      for (i = 0; i <= 1600; i++) { var u = i / 1600, ph = 2 * Math.PI / (0.11 * 4.6) * (Math.exp(4.6 * u) - 1), yy = yb - 18 * Math.sin(ph); if (i) g.lineTo(x0 + w * u, yy); else g.moveTo(x0 + w * u, yy); }
      g.stroke();
      serif(g, 11); g.fillStyle = PRC.ink; g.textAlign = "center";                                     // the wavelengths
      [["1 km", 0.02], ["1 m", 0.2], ["1 mm", 0.4], ["1 \u00b5m", 0.55], ["1 nm", 0.72], ["1 pm", 0.93]].forEach(function (m) { var x = x0 + w * m[1]; g.fillRect(x - 0.5, yb + 26, 1, 6); g.fillText(m[0], x, yb + 44); });
      var vx0 = b.x + b.w * 0.16, vw = b.w * 0.68, vy = b.y + b.h * 0.66, gv2 = g.createLinearGradient(vx0, 0, vx0 + vw, 0);   // the visible band, 700 to 400 nm
      [[0, "#8e1b12"], [0.12, "#d7301f"], [0.3, "#f28c28"], [0.42, "#f5d327"], [0.55, "#3aa655"], [0.7, "#1f77b4"], [0.86, "#3f2a8c"], [1, "#2a1450"]].forEach(function (c) { gv2.addColorStop(c[0], c[1]); });
      g.fillStyle = gv2; g.fillRect(vx0, vy - 18, vw, 36);
      g.strokeStyle = "rgba(31,36,48,0.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + w * cuts[3], yb + 26); g.lineTo(vx0, vy - 18); g.moveTo(x0 + w * cuts[4], yb + 26); g.lineTo(vx0 + vw, vy - 18); g.stroke();
      g.fillStyle = PRC.ink; [700, 600, 500, 400].forEach(function (nm, k) { var x = vx0 + vw * k / 3; g.fillRect(x - 0.5, vy + 18, 1, 5); g.fillText(nm + " nm", x, vy + 36); });
    },
    lissajous: function (g, b) {                                      // x = sin(p t + pi/4), y = sin(q t) for six ratios p:q, quiet blues and greens
      var R = [[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [4, 5]], cols = [PRC.navy, PRC.teal, PRC.olive, PRC.teal, PRC.navy, PRC.olive], cw = b.w / 3, ch = b.h / 2;
      R.forEach(function (f, k) {
        var cx = b.x + cw * (k % 3 + 0.5), cy = b.y + ch * (Math.floor(k / 3) + 0.5), A = Math.min(cw, ch) * 0.38;
        g.lineWidth = 1.3; g.strokeStyle = cols[k]; g.globalAlpha = 0.85; g.beginPath();
        for (var i = 0; i <= 900; i++) { var t = i / 900 * 2 * Math.PI, x = cx + A * Math.sin(f[0] * t + Math.PI / 4), y = cy - A * Math.sin(f[1] * t); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.globalAlpha = 1;
        serif(g, 13, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(f[0] + " : " + f[1], cx, cy + ch * 0.47);
      });
    },
    harmonograph: function (g, b) {                                   // a pen moved by two swinging pendulums, dying away
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, A = b.h * 0.46;
      g.lineWidth = 0.7; g.strokeStyle = "rgba(44,74,115,0.72)"; g.beginPath();
      for (var k = 0; k <= 9000; k++) {
        var t = k * 0.012, d1 = Math.exp(-0.0042 * t), d2 = Math.exp(-0.0031 * t);
        var x = cx + A * 1.3 * (0.62 * Math.sin(2.0 * t + 0.6) * d1 + 0.38 * Math.sin(3.004 * t + 1.1) * d2), y = cy + A * (0.6 * Math.sin(3.0 * t) * d2 + 0.4 * Math.sin(2.003 * t + 0.4) * d1);
        if (k) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    },
    ford: function (g, b) {                                           // on every fraction p/q a circle 1/q squared across, standing on the line; neighbours only touch
      var x0 = b.x + 14, S = b.w - 28, yb = b.y + b.h - 24, cols = [PRC.red, PRC.navy, PRC.ochre, PRC.teal, PRC.rose, PRC.olive];
      function gcd(a, c) { return c ? gcd(c, a % c) : a; }
      for (var q = 1; q <= 44; q++) for (var p = 0; p <= q; p++) {
        if (gcd(p, q) !== 1) continue; var r = S / (2 * q * q); if (r < 0.6) continue; var cx = x0 + S * p / q;
        g.globalAlpha = 0.82; g.fillStyle = cols[(q - 1) % cols.length]; g.beginPath(); g.arc(cx, yb - r, r, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = PRC.ink; g.lineWidth = Math.min(1.3, 0.35 + r * 0.03); g.stroke();
        if (r > 10 && r < 200) { serif(g, Math.min(17, r * 0.5), "italic"); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p + "/" + q, cx, yb - r); }
      }
      g.strokeStyle = PRC.ink; g.lineWidth = 1.4; g.beginPath(); g.moveTo(b.x, yb); g.lineTo(b.x + b.w, yb); g.stroke();
    },
    roses: function (g, b) {                                          // r = cos(k theta) for six values of k
      var ks = [[2, 1], [3, 1], [5, 1], [3, 2], [5, 3], [7, 4]], cw = b.w / 3, ch = b.h / 2, cols = [PRC.red, PRC.navy, PRC.teal, PRC.rose, PRC.olive, PRC.ochre];
      ks.forEach(function (k, i) {
        var cx = b.x + cw * (i % 3 + 0.5), cy = b.y + ch * (Math.floor(i / 3) + 0.5) - 9, R = Math.min(cw, ch) * 0.37, n = k[0], d = k[1], T = Math.PI * d * ((n * d) % 2 ? 1 : 2);
        g.strokeStyle = cols[i]; g.lineWidth = 1.7; g.beginPath();
        for (var st = 0; st <= 900; st++) { var t = T * st / 900, r = R * Math.cos(n / d * t), x = cx + r * Math.cos(t), y = cy - r * Math.sin(t); if (st) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); serif(g, 14, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "top"; g.fillText("k = " + (d === 1 ? n : n + "/" + d), cx, cy + R + 5);
      });
    },
    voronoi: function (g, b, s, ox, oy) {                             // every point coloured by the seed nearest to it
      var X0 = Math.round(ox + b.x * s), Y0 = Math.round(oy + b.y * s), W = Math.round(b.w * s), H = Math.round(b.h * s), img = g.createImageData(W, H), d = img.data, R = mulberry(31), seeds = [];
      var pal = [[196, 80, 47], [217, 162, 58], [43, 122, 120], [44, 74, 115], [181, 84, 106], [111, 130, 72], [227, 213, 184]];
      for (var k = 0; k < 34; k++) seeds.push([R() * W, R() * H, pal[k % pal.length]]);
      for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
        var b1 = 1e9, b2 = 1e9, c = null;
        for (var q = 0; q < seeds.length; q++) { var dx = i - seeds[q][0], dy = j - seeds[q][1], dd = dx * dx + dy * dy; if (dd < b1) { b2 = b1; b1 = dd; c = seeds[q][2]; } else if (dd < b2) b2 = dd; }
        var edge = Math.sqrt(b2) - Math.sqrt(b1) < 1.7 * s, o = (j * W + i) * 4;
        d[o] = edge ? 31 : c[0]; d[o + 1] = edge ? 36 : c[1]; d[o + 2] = edge ? 48 : c[2]; d[o + 3] = 255;
      }
      g.putImageData(img, X0, Y0);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PRC.ink; seeds.forEach(function (q) { g.beginPath(); g.arc(X0 + q[0], Y0 + q[1], 2.4 * s, 0, 2 * Math.PI); g.fill(); }); g.restore();
    },
    mandel: function (g, b, s, ox, oy) {
      var X0 = Math.round(ox + b.x * s), Y0 = Math.round(oy + b.y * s), W = Math.round(b.w * s), H = Math.round(b.h * s), img = g.createImageData(W, H), d = img.data;
      var sc = Math.max(3.0 / W, 2.2 / H), x0 = -0.72 - sc * W / 2, y0 = -sc * H / 2;
      for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
        var cx = x0 + sc * i, cy = y0 + sc * j, x = 0, y = 0, n = 0;
        while (n < 120 && x * x + y * y < 64) { var t = x * x - y * y + cx; y = 2 * x * y + cy; x = t; n++; }
        var k = (j * W + i) * 4;
        if (n >= 120) { d[k] = 10; d[k + 1] = 12; d[k + 2] = 22; }
        else { var sm = (n + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.LN2) / 120, u = Math.pow(Math.min(1, Math.max(0, sm)), 0.45);
          d[k] = 255 * Math.min(1, 0.06 + 1.5 * u * u); d[k + 1] = 255 * Math.min(1, 0.07 + 0.95 * u * u * u); d[k + 2] = 255 * Math.min(1, 0.16 + 0.5 * u * (1 - u) + 0.2 * u * u * u * u); }
        d[k + 3] = 255;
      }
      g.putImageData(img, X0, Y0);
    },
    golden: function (g, b) {
      var u = Math.min(b.h / 21, b.w / 34), ox = b.x + (b.w - 34 * u) / 2, oy = b.y + (b.h - 21 * u) / 2;
      var cols = ["#c8553d", "#e7b04a", "#2f6690", "#3a7d44", "#8c5383", "#d8a47f", "#4d7ea8", "#e0c879"];
      var sq = [[0, 0, 21], [21, 0, 13], [26, 13, 8], [21, 16, 5], [21, 13, 3], [23, 13, 2], [23, 15, 1], [24, 15, 1]];
      sq.forEach(function (q, n) { g.fillStyle = cols[n]; g.fillRect(ox + q[0] * u, oy + q[1] * u, q[2] * u, q[2] * u); g.strokeStyle = PRC.ink; g.lineWidth = 2.5; g.strokeRect(ox + q[0] * u, oy + q[1] * u, q[2] * u, q[2] * u); });
      var arcs = [[21, 21, 21, Math.PI, 1.5 * Math.PI], [21, 13, 13, 1.5 * Math.PI, 2 * Math.PI], [26, 13, 8, 0, 0.5 * Math.PI], [26, 16, 5, 0.5 * Math.PI, Math.PI], [24, 16, 3, Math.PI, 1.5 * Math.PI], [24, 15, 2, 1.5 * Math.PI, 2 * Math.PI]];
      g.strokeStyle = PRC.ink; g.lineWidth = 3.5; arcs.forEach(function (a) { g.beginPath(); g.arc(ox + a[0] * u, oy + a[1] * u, a[2] * u, a[3], a[4]); g.stroke(); });
      serif(g, 15, "italic"); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; [[0, 0, 21], [21, 0, 13], [26, 13, 8], [21, 16, 5]].forEach(function (q) { g.fillText(String(q[2]), ox + (q[0] + q[2] / 2) * u, oy + (q[1] + q[2] / 2) * u); });
    }
  };
  // the figures of the classrooms' mathematicians (v0.39) that the prints did not have yet
  function inkLine(g, w, col) { g.strokeStyle = col || PRC.ink; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "round"; }
  PRINT_DRAW.euclid = function (g, b) {                                // Elements I.1: an equilateral triangle from two circles
    var r = Math.min(b.w / 3.2, b.h / 2.3), cx = b.x + b.w / 2, cy = b.y + b.h * 0.56, A = [cx - r / 2, cy], B = [cx + r / 2, cy], C = [cx, cy - r * Math.sqrt(3) / 2];
    g.fillStyle = "rgba(217,162,58,0.32)"; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); g.fill();
    inkLine(g, 2, PRC.navy); [A, B].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], r, 0, 2 * Math.PI); g.stroke(); });
    inkLine(g, 3); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); g.stroke();
    g.fillStyle = PRC.ink; [A, B, C].forEach(function (p) { dot(g, p[0], p[1], 4); });
    serif(g, b.h * 0.075, "italic"); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A", A[0] - 14, A[1] + 14); g.fillText("B", B[0] + 14, B[1] + 14); g.fillText("C", C[0], C[1] - 16);
  };
  PRINT_DRAW.conics = function (g, b) {                                // the three sections of a cone, on one pair of axes
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, u = Math.min(b.w, b.h) / 9;
    inkLine(g, 1, "rgba(31,36,48,0.45)"); g.beginPath(); g.moveTo(b.x + 6, cy); g.lineTo(b.x + b.w - 6, cy); g.moveTo(cx, b.y + 6); g.lineTo(cx, b.y + b.h - 6); g.stroke();
    inkLine(g, 3, PRC.navy); g.beginPath(); g.ellipse(cx, cy, 2.6 * u, 1.6 * u, 0, 0, 2 * Math.PI); g.stroke();
    inkLine(g, 3, PRC.red); g.beginPath(); for (var t = -2.2; t <= 2.2001; t += 0.05) { var x = cx + t * u * 1.5, y = cy - 3.6 * u + 0.62 * Math.pow(t * 1.5, 2) * u; if (t > -2.2) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    inkLine(g, 3, PRC.teal); [-1, 1].forEach(function (sd) { g.beginPath(); for (var v = -1.6; v <= 1.6001; v += 0.05) { var x = cx + sd * 3.4 * u * Math.cosh(v) * 0.62, y = cy + 1.4 * u * Math.sinh(v) * 0.9; if (v > -1.6) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
    serif(g, b.h * 0.062, "italic"); g.textBaseline = "middle"; g.textAlign = "center"; g.fillStyle = PRC.navy; g.fillText("ellipse", cx, cy + 2.15 * u); g.fillStyle = PRC.red; g.fillText("parabola", cx, cy - 4.0 * u + 4); g.fillStyle = PRC.teal; g.fillText("hyperbola", cx + 3.0 * u, cy + 3.6 * u);
  };
  PRINT_DRAW.sphere = function (g, b) {                                // a sphere in the cylinder round it: two thirds
    var R = Math.min(b.w / 3.4, b.h / 2.6), cx = b.x + b.w / 2, cy = b.y + b.h * 0.52, e = R * 0.28;
    var gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); gr.addColorStop(0, "#f6e7c4"); gr.addColorStop(1, "#c9a25c"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fill();
    inkLine(g, 2.5); g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
    inkLine(g, 1.5, "rgba(31,36,48,0.55)"); g.beginPath(); g.ellipse(cx, cy, R, e, 0, 0, Math.PI); g.stroke(); g.setLineDash([5, 5]); g.beginPath(); g.ellipse(cx, cy, R, e, 0, Math.PI, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    inkLine(g, 3, PRC.navy); g.beginPath(); g.moveTo(cx - R, cy - R); g.lineTo(cx - R, cy + R); g.moveTo(cx + R, cy - R); g.lineTo(cx + R, cy + R); g.stroke();
    g.beginPath(); g.ellipse(cx, cy - R, R, e, 0, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.ellipse(cx, cy + R, R, e, 0, 0, Math.PI); g.stroke();
    g.setLineDash([5, 5]); g.beginPath(); g.ellipse(cx, cy + R, R, e, 0, Math.PI, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    serif(g, b.h * 0.085, "italic"); g.fillStyle = PRC.ink; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("2 : 3", cx + R + 16, cy);
  };
  PRINT_DRAW.pythagoras = function (g, b) {                            // the 3, 4, 5 triangle with its squares cut in units
    var u = Math.min(b.w / 12.5, b.h / 12.5), ox = b.x + b.w / 2 - 1.6 * u, oy = b.y + b.h / 2 + 0.8 * u;   // the right angle at (ox, oy); legs 3 up, 4 across
    var A = [ox, oy], Bp = [ox + 4 * u, oy], Cp = [ox, oy - 3 * u];
    function sq(p, q, col, n) {                                        // the square outward on side p-q, n by n units
      var dx = q[0] - p[0], dy = q[1] - p[1], nx = dy, ny = -dx, pts = [p, q, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]];
      g.fillStyle = col; g.beginPath(); pts.forEach(function (t, i) { if (i) g.lineTo(t[0], t[1]); else g.moveTo(t[0], t[1]); }); g.closePath(); g.fill();
      inkLine(g, 1, "rgba(31,36,48,0.35)"); for (var i = 1; i < n; i++) { var f = i / n; g.beginPath(); g.moveTo(p[0] + dx * f, p[1] + dy * f); g.lineTo(p[0] + dx * f + nx, p[1] + dy * f + ny); g.stroke(); g.beginPath(); g.moveTo(p[0] + nx * f, p[1] + ny * f); g.lineTo(q[0] + nx * f, q[1] + ny * f); g.stroke(); }
      inkLine(g, 2.2); g.beginPath(); pts.forEach(function (t, i) { if (i) g.lineTo(t[0], t[1]); else g.moveTo(t[0], t[1]); }); g.closePath(); g.stroke();
      return [(p[0] + q[0] + nx) / 2, (p[1] + q[1] + ny) / 2];
    }
    var la = sq(A, Cp, "rgba(196,80,47,0.5)", 3), lb = sq(Bp, A, "rgba(43,122,120,0.45)", 4), lc = sq(Cp, Bp, "rgba(217,162,58,0.45)", 5);
    serif(g, b.h * 0.08, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("9", la[0], la[1]); g.fillText("16", lb[0], lb[1]); g.fillText("25", lc[0], lc[1]);
  };
  PRINT_DRAW.bell = function (g, b) {                                  // the normal curve, its bands at one, two and three sigma
    var x0 = b.x + b.w * 0.06, x1 = b.x + b.w * 0.94, yb = b.y + b.h * 0.84, H = b.h * 0.7, cx = (x0 + x1) / 2, sg = (x1 - x0) / 7.4;
    function y(x) { var z = (x - cx) / sg; return yb - H * Math.exp(-z * z / 2); }
    [[3, "rgba(43,122,120,0.16)"], [2, "rgba(43,122,120,0.3)"], [1, "rgba(43,122,120,0.5)"]].forEach(function (k) {
      g.fillStyle = k[1]; g.beginPath(); g.moveTo(cx - k[0] * sg, yb); for (var x = cx - k[0] * sg; x <= cx + k[0] * sg + 0.01; x += 2) g.lineTo(x, y(x)); g.lineTo(cx + k[0] * sg, yb); g.closePath(); g.fill(); });
    inkLine(g, 3, PRC.navy); g.beginPath(); for (var x2 = x0; x2 <= x1; x2 += 2) { if (x2 > x0) g.lineTo(x2, y(x2)); else g.moveTo(x2, y(x2)); } g.stroke();
    inkLine(g, 1.5); g.beginPath(); g.moveTo(x0, yb); g.lineTo(x1, yb); g.stroke();
    serif(g, b.h * 0.06, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "top";
    [-3, -2, -1, 0, 1, 2, 3].forEach(function (k) { var xx = cx + k * sg; g.beginPath(); g.moveTo(xx, yb); g.lineTo(xx, yb + 5); g.stroke(); g.fillText(k ? (k > 0 ? k + "σ" : "−" + (-k) + "σ") : "μ", xx, yb + 8); });
    g.textBaseline = "middle"; g.fillText("68 %", cx, yb - H * 0.32); g.fillText("95 %", cx + 1.5 * sg, yb - H * 0.1);
  };
  PRINT_DRAW.hohmann = function (g, b) {                               // Earth to Mars (v0.48): the Sun, the two orbits, half an ellipse between
    var cx = b.x + b.w * 0.5, cy = b.y + b.h * 0.5, R2 = Math.min(b.w * 0.3, b.h * 0.46), R1 = R2 / 1.524, am = (R1 + R2) / 2, cf = (R2 - R1) / 2, bm = Math.sqrt(R1 * R2);
    function P(r, th) { return [cx + r * Math.cos(th), cy - r * Math.sin(th)]; }
    inkLine(g, 1.6, PRC.navy); g.beginPath(); g.arc(cx, cy, R1, 0, 2 * Math.PI); g.stroke();
    inkLine(g, 1.6, PRC.red); g.beginPath(); g.arc(cx, cy, R2, 0, 2 * Math.PI); g.stroke();
    g.setLineDash([5, 5]); inkLine(g, 1.2, "rgba(43,122,120,0.6)"); g.beginPath(); g.ellipse(cx + cf, cy, am, bm, 0, 0, Math.PI, true); g.stroke(); g.setLineDash([]);
    inkLine(g, 3, PRC.teal); g.beginPath(); g.ellipse(cx + cf, cy, am, bm, 0, Math.PI, 2 * Math.PI, true); g.stroke();
    var sg = g.createRadialGradient(cx, cy, 1, cx, cy, 15); sg.addColorStop(0, "#fff1c4"); sg.addColorStop(0.5, "#f2b33d"); sg.addColorStop(1, "rgba(217,130,40,0)"); g.fillStyle = sg; dot(g, cx, cy, 15);
    var e0 = P(R1, Math.PI), m0 = P(R2, Math.PI - 136 * D2R + Math.PI), m1 = P(R2, 0);
    g.fillStyle = PRC.navy; dot(g, e0[0], e0[1], 6); g.fillStyle = PRC.red; dot(g, m1[0], m1[1], 6);
    g.fillStyle = "rgba(196,80,47,0.45)"; dot(g, m0[0], m0[1], 5);
    serif(g, b.h * 0.055, "italic"); g.fillStyle = PRC.ink; g.textBaseline = "middle";
    g.textAlign = "right"; g.fillText("Earth, at launch", e0[0] - 10, e0[1] - 12);
    g.textAlign = "left"; g.fillText("Mars, 259 days later", m1[0] + 10, m1[1] - 12);
    g.fillText("Mars at launch, 44° ahead", m0[0] + 10, m0[1] + 2);
    g.textAlign = "center"; g.fillStyle = PRC.teal; var mp = P(bm * 1.04, -Math.PI / 2); g.fillText("half an ellipse round the Sun", mp[0] + cf, mp[1] + 14);
  };
  PRINT_DRAW.brachistochrone = function (g, b) {                       // the fastest way down (v0.48): beads on the cycloid and the straight line at equal times
    // (v0.58) past half a turn of the wheel (T > pi), as in the classic figure: the fastest way dips below B and climbs to it,
    // across the print; the labels clear of the curves and the points
    var T = 3.6, R = Math.min(b.w * 0.84 / (T - Math.sin(T)), b.h * 0.72 / 2), x0 = b.x + b.w * 0.08, y0 = b.y + b.h * 0.12;
    function C(t) { return [x0 + R * (t - Math.sin(t)), y0 + R * (1 - Math.cos(t))]; }
    var B = C(T), L = Math.hypot(B[0] - x0, B[1] - y0), sn = (B[1] - y0) / L, tC = T * Math.sqrt(R);   // times with g = 1
    inkLine(g, 1.6, "rgba(31,36,48,0.55)"); g.setLineDash([6, 5]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(B[0], B[1]); g.stroke(); g.setLineDash([]);
    inkLine(g, 3, PRC.red); g.beginPath(); for (var k = 0; k <= 100; k++) { var q = C(T * k / 100); if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); } g.stroke();
    for (var i = 1; i <= 6; i++) { var tt = tC * i / 6;
      var q2 = C(tt / Math.sqrt(R)); g.fillStyle = PRC.red; dot(g, q2[0], q2[1], 5);
      var s2 = Math.min(L, 0.5 * sn * tt * tt); g.fillStyle = "rgba(31,36,48,0.6)"; dot(g, x0 + (B[0] - x0) * s2 / L, y0 + (B[1] - y0) * s2 / L, 5); }
    g.fillStyle = PRC.ink; dot(g, x0, y0, 4); dot(g, B[0], B[1], 4);
    serif(g, b.h * 0.06, "italic"); g.textBaseline = "middle";
    g.textAlign = "right"; g.fillText("A", x0 - 9, y0 - 4); g.textAlign = "left"; g.fillText("B", B[0] + 10, B[1] - 10);
    var D = C(Math.PI); g.textAlign = "center"; g.fillStyle = PRC.red; g.fillText("the cycloid: first to arrive", D[0], D[1] + b.h * 0.075);
    g.save(); g.translate((x0 + B[0]) / 2, (y0 + B[1]) / 2); g.rotate(Math.atan2(B[1] - y0, B[0] - x0));
    g.fillStyle = "rgba(31,36,48,0.75)"; g.fillText("the straight line: shortest, yet slower", 0, -b.h * 0.05); g.restore();
  };
  // a room's mathematician (v0.39): the figure on the left, the name, the years and the city, and one line on the right
  function drawPoster(g, b, x) {
    var P = x.poster, fw = b.w * 0.52, fb = { x: b.x + 8, y: b.y + 8, w: fw - 16, h: b.h - 16 };
    g.save(); g.beginPath(); g.rect(fb.x, fb.y, fb.w, fb.h); g.clip(); (PRINT_DRAW[P.fig] || function () {})(g, fb, 1, 0, 0); g.restore();
    inkLine(g, 1, "rgba(31,36,48,0.3)"); g.beginPath(); g.moveTo(b.x + fw, b.y + b.h * 0.1); g.lineTo(b.x + fw, b.y + b.h * 0.9); g.stroke();
    var tx = b.x + fw + b.w * 0.05, tw = b.w - fw - b.w * 0.09; g.fillStyle = PRC.ink; g.textAlign = "left"; g.textBaseline = "alphabetic";
    serif(g, b.h * 0.15); fitText(g, P.name, tx, b.y + b.h * 0.3, tw);
    g.fillStyle = PRC.red; g.font = "600 " + Math.round(b.h * 0.06) + "px " + SANS; fitText(g, P.years.toUpperCase(), tx, b.y + b.h * 0.42, tw);
    g.fillStyle = PRC.ink; serif(g, b.h * 0.072, "italic"); var words = P.line.split(" "), ln = "", ly = b.y + b.h * 0.58;
    words.forEach(function (wd) { var t = ln ? ln + " " + wd : wd; if (g.measureText(t).width > tw && ln) { g.fillText(ln, tx, ly); ln = wd; ly += b.h * 0.095; } else ln = t; }); if (ln) g.fillText(ln, tx, ly);
  }
  // one print on its cell: the paper, the picture clipped to its box, a fine line round it, the title under it
  function drawPrint(g, x, s, ox, oy) {
    var W = PRINT.W, H = PRINT.H, b = printBox(W, H);
    g.fillStyle = PRC.paper; g.fillRect(0, 0, W, H);
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,255,255,0.06)"); gr.addColorStop(1, "rgba(120,100,70,0.06)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (x.poster) b = { x: b.x, y: b.y, w: b.w, h: H - 2 * b.y };                                  // a poster has no caption: its box runs down to the mat
    g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip(); if (x.poster) drawPoster(g, b, x); else (PRINT_DRAW[x.subject] || function () {})(g, b, s, ox, oy); g.restore();
    g.strokeStyle = "rgba(31,36,48,0.75)"; g.lineWidth = 1; g.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
    if (x.title && !x.poster) { serif(g, H * 0.046, "italic"); g.fillStyle = PRC.ink; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(x.title, W / 2, b.y + b.h + (H - b.y - b.h) * 0.6); }
  }
  function printAtlas(art) {
    var s = MOBILE ? 0.5 : 1, cols = PRINT.cols, rows = Math.ceil(art.length / cols), cv = mkCanvas(Math.round(cols * PRINT.W * s), Math.round(rows * PRINT.H * s)), g = cv.getContext("2d");
    art.forEach(function (x, k) {
      var cx = (k % cols) * PRINT.W, cy = Math.floor(k / cols) * PRINT.H;
      g.save(); g.scale(s, s); g.translate(cx, cy); drawPrint(g, x, s, cx * s, cy * s); g.restore();
    });
    return cv;
  }
  // the prints on the walls, from the program: one mesh for all; each in an oak frame under a picture light, a bench and a
  // plant beside it where the program puts one
  function corridorArt(W) {
    var C = CRS, D = D2R, art = P2.ring.art || [], cols = PRINT.cols, rows = Math.ceil(art.length / cols), pw = PRINT.w, ph = PRINT.h, rM = (C.r0 + C.rc) / 2;
    if (!art.length) return;
    var tex = { value: dummyTex };                                  // drawn after the first frames (v0.49)
    lateTexture(function () { var t = new THREE.CanvasTexture(printAtlas(art)); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.value = t; });
    var pos = [], uvs = [], idx = [], brt = [];
    function unit(a) { var p = crsPt(1, a); return new THREE.Vector3(p.x - PAL.c.x, 0, p.z - PAL.c.z).normalize(); }
    art.forEach(function (x, k) {
      var up = x.floor === "upper", y = up ? C.yU : C.yL, yc = y + PRINT.yc, a, P, Rv, Nv, rw, pw = x.w || PRINT.w, ph = pw * PRINT.h / PRINT.w;
      if (x.room) {                                                 // in a room, on its back or front wall (along a radius), facing into the room
        var rmx = C.rooms.filter(function (q) { return q.code === x.room; })[0], Fr = roomFrame(rmx), fw = x.wall === "front", wa = fw ? Fr.front : Fr.back, sd = fw ? -Fr.sgn : Fr.sgn, rr = x.r;
        y = Fr.y; yc = y + (x.y || PRINT.yc); a = wa + sd * 0.12 / rr; var cq = crsPt(rr, a);
        P = new THREE.Vector3(cq.x, yc, cq.z); Nv = unit(wa + Math.PI / 2).multiplyScalar(sd); Rv = unit(wa).multiplyScalar(sd);
        var Mr = crsFrame(rr, wa + sd * 0.095 / rr, yc), br = new Builder(); br.box(-0.018, -ph / 2 - 0.05, -pw / 2 - 0.05, 0.018, ph / 2 + 0.05, pw / 2 + 0.05, MT.WOOD); br.tag(0, null, 2); W.add(br, Mr);
      } else if (x.end) {                                                  // a blind end of the upper corridor: the wall along a radius, facing along the corridor
        var aw = x.a * D + x.end * 0.06 / 48; a = aw + x.end * 0.045 / rM; var cp = crsPt(rM, a);
        P = new THREE.Vector3(cp.x, yc, cp.z); Nv = unit(aw + Math.PI / 2).multiplyScalar(x.end); Rv = unit(aw).multiplyScalar(x.end);
        var Mf = crsFrame(rM, aw + x.end * 0.022 / rM, yc), bz = new Builder(); bz.box(-0.018, -ph / 2 - 0.05, -pw / 2 - 0.05, 0.018, ph / 2 + 0.05, pw / 2 + 0.05, MT.WOOD); bz.tag(0, null, 2); W.add(bz, Mf);
        var ab = aw + x.end * 0.5 / rM; crsPlace(W, gardenBench(x.bench || 1.8), rM, ab, y, Math.PI / 2); crsObst(rM - 1.0, rM + 1.0, ab - 0.35 / rM, ab + 0.35 / rM, x.floor);
        if (x.plant) { var fbp = plantBuilder(x.plant[0], 960 + k), Rp = plantReach(fbp), rp = C.rc - 0.13 - Math.max(0.29, Rp), ap = aw + x.end * Math.max(0.55, Rp + 0.13) / rp;   // its leaves this side of the walls
          crsPlace(W, fbp, rp, ap, y, k); crsObst(rp - 0.4, rp + 0.4, ap - 0.4 / rp, ap + 0.4 / rp, x.floor); }
      } else {                                                      // the lower corridor's back wall at r0, facing out across the corridor
        rw = C.r0 + 0.02; a = x.a * D; var cp2 = crsPt(rw + 0.041, a);
        P = new THREE.Vector3(cp2.x, yc, cp2.z); Nv = unit(a); Rv = unit(a + Math.PI / 2).multiplyScalar(-1);
        var Mb = crsFrame(rw, a, yc), bx = new Builder(); bx.box(-pw / 2 - 0.05, -ph / 2 - 0.05, 0.004, pw / 2 + 0.05, ph / 2 + 0.05, 0.039, MT.WOOD); bx.tag(0, null, 2); W.add(bx, Mb);
        if (x.bench) { var rb = rw + 0.31; crsPlace(W, gardenBench(x.bench), rb, a, y, 0); crsObst(rw, rw + 0.62, a - (x.bench / 2 + 0.05) / rb, a + (x.bench / 2 + 0.05) / rb, x.floor); }
        if (x.plant) {
          var fbq = plantBuilder(x.plant[0], 960 + k), Rq = plantReach(fbq), rq = rw + Math.max(0.36, Rq + 0.1), aq = a + x.plant[1] * ((x.bench || 0) / 2 + Math.max(0.55, 0.7 * Rq)) / rq, py = y;
          if (PRINT_PLINTH[x.plant[0]]) { var pl = new Builder(); pl.box(-0.21, 0, -0.21, 0.21, 0.56, 0.21, MT.WOOD); pl.tag(0, null, 2); crsPlace(W, pl, rq, aq, y, 0); py = y + 0.56; }
          crsPlace(W, fbq, rq, aq, py, k * 1.7); crsObst(rq - 0.38, rq + 0.38, aq - 0.38 / rq, aq + 0.38 / rq, x.floor);
        }
      }
      // the picture, upright and the right way round for whoever faces it
      var u0 = (k % cols) / cols, u1 = u0 + 1 / cols, v1 = 1 - Math.floor(k / cols) / rows, v0 = v1 - 1 / rows, n = pos.length / 3;
      [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]].forEach(function (c) { pos.push(P.x + Rv.x * c[0] * pw / 2, P.y + c[1] * ph / 2, P.z + Rv.z * c[0] * pw / 2); uvs.push(c[2], c[3]); brt.push(up ? 0.4 : 0.3); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      // the picture light: a brass bar on an arm over the frame, lighting it
      var yb = yc + ph / 2 + 0.13, Bc = P.clone().addScaledVector(Nv, 0.17); Bc.y = yb;
      tubeAlong(W, [Bc.clone().addScaledVector(Rv, -0.36), Bc.clone().addScaledVector(Rv, 0.36)], 0.02, 10, MT.BRASS);
      var Wp = P.clone().addScaledVector(Nv, -0.03); Wp.y = yc + ph / 2 + 0.03; tubeAlong(W, [Wp, new THREE.Vector3(Bc.x, yb - 0.01, Bc.z)], 0.008, 6, MT.BRASS);
      var dl = new THREE.Vector3(P.x - Bc.x, yc - 0.15 - yb, P.z - Bc.z).normalize(); wLight(Bc.x, yb - 0.04, Bc.z, LAMPC, 0.9, 3.2, [dl.x, dl.y, dl.z], 2.5);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute("aBright", new THREE.Float32BufferAttribute(brt, 1)); geo.setIndex(idx);
    var vs = "attribute float aBright; varying vec2 vUv; varying float vB; void main(){ vUv = uv; vB = aBright; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    var fs = "uniform sampler2D map; uniform float uExposure; varying vec2 vUv; varying float vB;\n" +
      "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * vB + vec3(0.003); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 1.0); }";
    var mat = new THREE.ShaderMaterial({ uniforms: { map: tex, uExposure: U.uExposure }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide });
    var m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; scene.add(m);
  }
