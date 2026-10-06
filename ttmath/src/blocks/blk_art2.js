  /* ===================== Math Palace artwork, drawn in code ===================== */
  var SERIF = "Georgia, 'Times New Roman', serif";
  function mkCanvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function piDigits(n) {                    // Machin's formula with BigInt: pi = 16 atan(1/5) - 4 atan(1/239)
    var fallback = "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127";
    if (typeof BigInt === "undefined") return fallback.slice(0, n + 1);
    var big = function (v) { return BigInt(v); };
    var S = big(10) ** big(n + 10);
    function atanInv(x) { x = big(x); var x2 = x * x, term = S / x, sum = term, k = big(1), neg = true; while (term !== big(0)) { term = term / x2; var t = term / (big(2) * k + big(1)); sum = neg ? sum - t : sum + t; neg = !neg; k = k + big(1); } return sum; }
    var s = ((big(16) * atanInv(5) - big(4) * atanInv(239)) / big(10) ** big(10)).toString();
    return s[0] + "." + s.slice(1, n);
  }
  // text with ^{...} superscripts and _{...} subscripts; returns the width drawn (measure only when dry)
  function drawMath(g, str, x, y, size, dry) {
    var fam = g.font.replace(/^.*?\d+px\s*/, ""), style = /italic/.test(g.font) ? "italic " : "", weight = /\b600\b/.test(g.font) ? "600 " : "";
    var i = 0, cx = x;
    function run(txt, sz, dy) { g.font = style + weight + Math.round(sz) + "px " + fam; if (!dry) g.fillText(txt, cx, y + dy); cx += g.measureText(txt).width; }
    while (i < str.length) {
      var ch = str[i];
      if ((ch === "^" || ch === "_") && i + 1 < str.length) {
        var body, j;
        if (str[i + 1] === "{") { j = str.indexOf("}", i + 2); body = str.slice(i + 2, j); i = j + 1; } else { body = str[i + 1]; i += 2; }
        run(body, size * 0.62, ch === "^" ? -size * 0.42 : size * 0.2);
      } else {
        j = i; while (j < str.length && str[j] !== "^" && str[j] !== "_") j++;
        run(str.slice(i, j), size, 0); i = j;
      }
    }
    g.font = style + weight + Math.round(size) + "px " + fam;
    return cx - x;
  }
  function fitMath(g, str, x, y, size, maxW, style) {   // shrink to fit maxW
    g.font = (style || "") + size + "px " + SERIF;
    var w = drawMath(g, str, x, y, size, true);
    if (w > maxW) size *= maxW / w;
    g.font = (style || "") + Math.round(size) + "px " + SERIF;
    drawMath(g, str, x, y, size);
  }
  function penroseTris(levels) {            // Robinson-triangle deflation of a P3 (rhombus) tiling, unit radius
    var phi = (1 + Math.sqrt(5)) / 2, tris = [], i, l;
    for (i = 0; i < 10; i++) {
      var b = [Math.cos((2 * i - 1) * Math.PI / 10), Math.sin((2 * i - 1) * Math.PI / 10)], c = [Math.cos((2 * i + 1) * Math.PI / 10), Math.sin((2 * i + 1) * Math.PI / 10)];
      if (i % 2 === 0) { var t = b; b = c; c = t; }
      tris.push([0, [0, 0], b, c]);
    }
    for (l = 0; l < levels; l++) {
      var out = [];
      for (i = 0; i < tris.length; i++) {
        var T = tris[i], A = T[1], B = T[2], C = T[3];
        if (T[0] === 0) { var P = [A[0] + (B[0] - A[0]) / phi, A[1] + (B[1] - A[1]) / phi]; out.push([0, C, P, B], [1, P, C, A]); }
        else { var Q = [B[0] + (A[0] - B[0]) / phi, B[1] + (A[1] - B[1]) / phi], R = [B[0] + (C[0] - B[0]) / phi, B[1] + (C[1] - B[1]) / phi]; out.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]); }
      }
      tris = out;
    }
    return tris;
  }
  // rotunda floor: Penrose tiling in Carrara and Botticino marble with brass joints, a brass degree ring and a golden-angle
  // sunflower of brass seeds set in black Nero Marquina, the palace name in brass around the edge. Brass is painted #ffcc00
  // (the shader turns it into metal); light tiles become Carrara, mid tones Botticino, dark ones Nero.
  function palaceFloorTexture(Rm, N) {
    var cv = mkCanvas(N, N), g = cv.getContext("2d"), s = N / (2 * Rm), cx = N / 2;
    g.fillStyle = "#cdbfa8"; g.fillRect(0, 0, N, N);
    var tris = penroseTris(7), scale = Rm * 1.08 * s;
    g.lineJoin = "round";
    for (var pass = 0; pass < 2; pass++) for (var i = 0; i < tris.length; i++) {
      var T = tris[i], A = T[1], B = T[2], C = T[3];
      if (pass === 0) {
        g.beginPath(); g.moveTo(cx + A[0] * scale, cx + A[1] * scale); g.lineTo(cx + B[0] * scale, cx + B[1] * scale); g.lineTo(cx + C[0] * scale, cx + C[1] * scale); g.closePath();
        g.fillStyle = T[0] ? "#ebe2d0" : "#a8957e"; g.fill();
      } else {
        g.beginPath(); g.moveTo(cx + C[0] * scale, cx + C[1] * scale); g.lineTo(cx + A[0] * scale, cx + A[1] * scale); g.lineTo(cx + B[0] * scale, cx + B[1] * scale);
        g.strokeStyle = "#ffcc00"; g.lineWidth = Math.max(1.5, 0.03 * s); g.stroke();
      }
    }
    // centre medallion: dark stone with a sunflower (Vogel's model, golden angle 137.508 degrees)
    var rC = 9.4 * s, n = 1600, GA = Math.PI * (3 - Math.sqrt(5)), c0 = rC * 0.965 / Math.sqrt(n), sp = Math.sqrt(Math.PI) * c0;
    g.fillStyle = "#141210"; g.beginPath(); g.arc(cx, cx, rC, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffcc00";
    for (var k = 1; k < n; k++) {
      var r = c0 * Math.sqrt(k), a = k * GA, rr = sp * 0.4 * (0.72 + 0.28 * Math.sqrt(k / n));
      g.beginPath(); g.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, rr, 0, Math.PI * 2); g.fill();
    }
    // gold ring with a 360-degree scale: the pendulum's swing can be read against it
    g.fillStyle = "#141210"; g.beginPath(); g.arc(cx, cx, rC + 1.3 * s, 0, Math.PI * 2); g.arc(cx, cx, rC + 0.02 * s, 0, Math.PI * 2, true); g.fill();
    g.strokeStyle = "#ffcc00"; g.lineWidth = 0.16 * s; g.beginPath(); g.arc(cx, cx, rC + 0.1 * s, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 0.06 * s; g.beginPath(); g.arc(cx, cx, rC + 1.3 * s, 0, Math.PI * 2); g.stroke();
    for (var d = 0; d < 360; d += 2) {
      var aa = d * Math.PI / 180, l1 = rC + 0.3 * s, l2 = rC + (d % 10 === 0 ? 0.78 : 0.52) * s;
      g.lineWidth = Math.max(1, (d % 10 === 0 ? 0.05 : 0.025) * s); g.beginPath(); g.moveTo(cx + Math.cos(aa) * l1, cx + Math.sin(aa) * l1); g.lineTo(cx + Math.cos(aa) * l2, cx + Math.sin(aa) * l2); g.stroke();
    }
    g.fillStyle = "#ffcc00"; g.font = "600 " + Math.round(0.34 * s) + "px " + SERIF; g.textAlign = "center"; g.textBaseline = "middle";
    for (d = 0; d < 360; d += 30) { g.save(); g.translate(cx, cx); g.rotate(d * Math.PI / 180); g.fillText(String(d), 0, -(rC + 1.03 * s)); g.restore(); }
    // outer border with the palace name
    g.fillStyle = "#141210"; g.beginPath(); g.arc(cx, cx, Rm * s, 0, Math.PI * 2); g.arc(cx, cx, (Rm - 1.1) * s, 0, Math.PI * 2, true); g.fill();
    g.strokeStyle = "#ffcc00"; g.lineWidth = 0.06 * s; g.beginPath(); g.arc(cx, cx, (Rm - 1.12) * s, 0, Math.PI * 2); g.stroke();
    var text = "TTMATH  MATH  PALACE  ✦  MARS  ✦  ", fs = Math.round(0.52 * s); g.font = "600 " + fs + "px " + SERIF; g.fillStyle = "#ffcc00";
    var circ = 2 * Math.PI * (Rm - 0.55) * s, reps = Math.max(1, Math.floor(circ / g.measureText(text).width)), full = ""; for (var q = 0; q < reps; q++) full += text;
    var step = Math.PI * 2 / full.length;
    for (q = 0; q < full.length; q++) { g.save(); g.translate(cx, cx); g.rotate(q * step); g.fillText(full[q], 0, -(Rm - 0.55) * s); g.restore(); }
    return cv;
  }
  // one exhibit panel: title, the idea, a picture and three lines of trivia
  function drawPanel(g, x0, y0, W, H, spec) {
    g.save(); g.translate(x0, y0);
    var grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#14253d"); grd.addColorStop(1, "#0a1424"); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#c9a24a"; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.lineWidth = 1.5; g.strokeRect(20, 20, W - 40, H - 40);
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillStyle = "#e3c173"; fitMath(g, spec.title.toUpperCase(), 40, 72, 38, 400, "600 ");
    g.fillStyle = "#f6ecd8"; spec.formula.forEach(function (f, i) { fitMath(g, f, 40, 150 + i * 52, i ? 34 : 50, 410, "italic "); });
    g.save(); g.translate(W - 300, 70); spec.draw(g, 260, 260, x0 + W - 300, y0 + 70); g.restore();
    g.fillStyle = "#e8dcc6";
    spec.lines.forEach(function (ln, i) { fitMath(g, ln, 40, 392 + i * 36, 25, W - 80); });
    g.restore();
  }
  var PANELS = [
    { title: "Euler's identity", formula: ["e^{iπ} + 1 = 0"],
      draw: function (g, w, h) { g.strokeStyle = "#4d6a8c"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, h / 2); g.lineTo(w - 10, h / 2); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 10); g.stroke();
        g.strokeStyle = "#8fb3d9"; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = "#e3c173"; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * 0.38, 0, -Math.PI, true); g.stroke();
        g.fillStyle = "#e3c173"; g.beginPath(); g.arc(w / 2 - w * 0.38, h / 2, 9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(w / 2 + w * 0.38, h / 2, 7, 0, Math.PI * 2); g.fill();
        g.font = "italic 30px " + SERIF; g.fillText("−1", w / 2 - w * 0.38 - 22, h / 2 + 42); g.fillText("1", w / 2 + w * 0.38 - 6, h / 2 + 42); },
      lines: ["Five famous numbers in one line: 0, 1, e, i and π.", "Turn half a circle in the complex plane and you land on −1.", "Leonhard Euler wrote about it in 1748."] },
    { title: "Pythagoras", formula: ["a^2 + b^2 = c^2"],
      draw: function (g) { var A = [80, 160], B = [160, 160], C = [80, 100];
        function sq(p, q, col) { var dx = q[0] - p[0], dy = q[1] - p[1]; g.fillStyle = col; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(q[0] - dy, q[1] + dx); g.lineTo(p[0] - dy, p[1] + dx); g.closePath(); g.fill(); }
        sq(A, B, "rgba(143,179,217,.85)"); sq(C, A, "rgba(227,193,115,.9)"); sq(B, C, "rgba(214,120,90,.85)");
        g.strokeStyle = "#f6ecd8"; g.lineWidth = 3; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); g.stroke(); },
      lines: ["The two small squares together fill the big one.", "More than 370 proofs are known. One came from", "U.S. President James Garfield in 1876."] },
    { title: "The golden ratio", formula: ["φ = (1 + √5) / 2", "= 1.6180339887…"],
      draw: function (g) { var f = [1, 1, 2, 3, 5, 8, 13], u = 12.5, bx = 118, by = 118, bw = u, bh = u, dir = 0, rects = [[bx, by, u, u]];
        for (var i = 1; i < f.length; i++) { var s = f[i] * u; if (dir === 0) { rects.push([bx + bw, by, s, s]); bw += s; } else if (dir === 1) { rects.push([bx, by + bh, s, s]); bh += s; } else if (dir === 2) { rects.push([bx - s, by, s, s]); bx -= s; bw += s; } else { rects.push([bx, by - s, s, s]); by -= s; bh += s; } dir = (dir + 1) % 4; }
        var ox = 130 - (bx + bw / 2), oy = 130 - (by + bh / 2);
        rects.forEach(function (r, i) { g.fillStyle = "rgba(90,130,190," + (0.10 + 0.03 * (i % 2)) + ")"; g.fillRect(r[0] + ox, r[1] + oy, r[2], r[3]); g.strokeStyle = "#8fb3d9"; g.lineWidth = 1.5; g.strokeRect(r[0] + ox, r[1] + oy, r[2], r[3]);
          if (i > 1) { g.fillStyle = "#8fb3d9"; g.font = Math.round(8 + r[2] * 0.16) + "px " + SERIF; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(f[i]), r[0] + ox + r[2] / 2, r[1] + oy + r[3] / 2); } });
        g.textAlign = "left"; g.textBaseline = "alphabetic";
        g.strokeStyle = "#e3c173"; g.lineWidth = 4; g.beginPath();
        rects.forEach(function (r, i) { var d = (i + 3) % 4, cxr, cyr, a0; // quarter arcs through each square
          if (d === 0) { cxr = r[0]; cyr = r[1] + r[3]; a0 = -Math.PI / 2; } else if (d === 1) { cxr = r[0]; cyr = r[1]; a0 = 0; } else if (d === 2) { cxr = r[0] + r[2]; cyr = r[1]; a0 = Math.PI / 2; } else { cxr = r[0] + r[2]; cyr = r[1] + r[3]; a0 = Math.PI; }
          if (i > 0) g.arc(cxr + ox, cyr + oy, r[2], a0, a0 + Math.PI / 2); });
        g.stroke(); },
      lines: ["Divide a Fibonacci number by the one before it:", "8/5, 13/8, 21/13 … the answers close in on φ.", "Sunflowers pack their seeds by the golden angle, 137.5°."] },
    { title: "Pi", formula: ["π = 3.14159 26535 …"],
      draw: function (g, w, h) { var cx = w / 2, cy = h / 2, R = w * 0.34; g.strokeStyle = "#e3c173"; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
        [6, 12].forEach(function (n, j) { g.strokeStyle = j ? "#8fb3d9" : "#d6785a"; g.lineWidth = 2; g.beginPath(); for (var k = 0; k <= n; k++) { var a = k / n * Math.PI * 2; g.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); } g.stroke();
          var Ro = R / Math.cos(Math.PI / n); g.beginPath(); for (k = 0; k <= n; k++) { a = (k + 0.5) / n * Math.PI * 2; g.lineTo(cx + Ro * Math.cos(a), cy + Ro * Math.sin(a)); } g.stroke(); }); },
      lines: ["Archimedes trapped π between polygons inside and outside", "a circle. With 96 sides: 3 10/71 < π < 3 1/7.", "The digits never end and never repeat: look at the ring above."] },
    { title: "Prime numbers", formula: ["2, 3, 5, 7, 11, 13 …"],
      draw: function (g, w) { var n = 81, cell = w / n, isP = function (k) { if (k < 2) return false; for (var d = 2; d * d <= k; d++) if (k % d === 0) return false; return true; };
        var x = Math.floor(n / 2), y = x, k = 1, step = 1, dir = 0; g.fillStyle = "#e3c173";
        while (k <= n * n) { for (var rep = 0; rep < 2; rep++) { for (var s = 0; s < step; s++) { if (isP(k)) g.fillRect(x * cell, y * cell, cell * 1.05, cell * 1.05); k++; if (dir === 0) x++; else if (dir === 1) y--; else if (dir === 2) x--; else y++; } dir = (dir + 1) % 4; } step++; } },
      lines: ["Write 1, 2, 3 … in a square spiral and mark the primes:", "diagonal lines appear (Stanisław Ulam, 1963).", "Euclid proved the primes never run out, about 300 BC."] },
    { title: "Fractals", formula: ["z → z^2 + c"],
      draw: function (g, w, h, ax, ay) { var img = g.createImageData(w, h), d = img.data;
        for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) { var cr = -2.15 + i / w * 2.8, ci = -1.4 + j / h * 2.8, zr = 0, zi = 0, it = 0; while (it < 64 && zr * zr + zi * zi < 4) { var t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; it++; }
          var o = (j * w + i) * 4, v = it === 64 ? 0 : Math.sqrt(it / 64); d[o] = it === 64 ? 10 : 30 + 225 * v; d[o + 1] = it === 64 ? 14 : 22 + 170 * v * v; d[o + 2] = it === 64 ? 26 : 80 + 110 * (1 - v); d[o + 3] = 255; }
        g.putImageData(img, ax, ay); },
      lines: ["The Mandelbrot set: repeat the rule, keep the c that stay small.", "Zoom into its edge and new detail keeps appearing forever.", "Coastlines, ferns and lightning have the same kind of shape."] },
    { title: "Pascal's triangle", formula: ["add the two numbers above"],
      draw: function (g, w) { var rows = 16, row = [1], cs = w / rows; for (var r = 0; r < rows; r++) { for (var k = 0; k <= r; k++) { var x = w / 2 + (k - r / 2) * cs - cs / 2, y = r * cs; g.fillStyle = row[k] % 2 ? "#e3c173" : "#23364f"; g.fillRect(x + 1, y + 1, cs - 2, cs - 2); } var nr = [1]; for (k = 1; k <= r; k++) nr.push(row[k - 1] + row[k]); nr.push(1); row = nr; } },
      lines: ["1 · 1 1 · 1 2 1 · 1 3 3 1 … Colour only the odd numbers", "and a Sierpinski triangle appears: a fractal.", "Blaise Pascal wrote about it in 1654."] },
    { title: "Infinity", formula: ["∞ + 1 = ∞"],
      draw: function (g) { g.strokeStyle = "#8fb3d9"; g.lineWidth = 2; g.fillStyle = "#e3c173"; g.font = "20px " + SERIF;
        for (var i = 0; i < 6; i++) { var x = 12 + i * 41; g.strokeRect(x, 130, 32, 66); g.fillText(String(i + 1), x + 10, 122); g.beginPath(); g.moveTo(x + 16, 206); g.quadraticCurveTo(x + 36, 236, x + 57, 206); g.stroke(); }
        g.font = "90px " + SERIF; g.fillText("∞", 86, 86); },
      lines: ["Hilbert's Hotel has infinitely many rooms, all of them full.", "A new guest arrives? Everyone moves up one room,", "and room 1 is free. (David Hilbert, 1924)"] },
    { title: "The Möbius strip", formula: ["one side, one edge"],
      draw: function (g, w, h) { g.lineWidth = 2; for (var v = -1; v <= 1.001; v += 0.25) { g.strokeStyle = Math.abs(v) > 0.99 ? "#e3c173" : "#5f7fa6"; g.beginPath();
          for (var u = 0; u <= Math.PI * 2 + 0.01; u += 0.05) { var R = 82, X = (R + v * 28 * Math.cos(u / 2)) * Math.cos(u), Y = (R + v * 28 * Math.cos(u / 2)) * Math.sin(u), Z = v * 28 * Math.sin(u / 2); var px = w / 2 + X, py = h / 2 + Y * 0.45 - Z; if (u === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); } },
      lines: ["Give a strip of paper half a twist and join the ends.", "An ant can walk both 'sides' without crossing an edge.", "Cut it down the middle and it stays in one piece."] },
    { title: "Platonic solids", formula: ["V − E + F = 2"],
      draw: function (g) { var phi = 1.618, sets = [
          [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
          [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]],
          [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
          [[0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi], [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0], [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]]];
        sets.forEach(function (P, si) { var cx = 65 + (si % 2) * 130, cy = 65 + Math.floor(si / 2) * 130, sc = si === 3 ? 27 : 38, dmin = 1e9;
          var ps = P.map(function (p) { var a = 0.6, b = 0.45, x = p[0] * Math.cos(a) - p[2] * Math.sin(a), z = p[0] * Math.sin(a) + p[2] * Math.cos(a), y = p[1] * Math.cos(b) - z * Math.sin(b); return [cx + x * sc, cy + y * sc]; });
          for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) { var d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]); if (d < dmin - 1e-6) dmin = d; }
          g.strokeStyle = "#e3c173"; g.lineWidth = 2;
          for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++) { d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]); if (d < dmin * 1.01) { g.beginPath(); g.moveTo(ps[i][0], ps[i][1]); g.lineTo(ps[j][0], ps[j][1]); g.stroke(); } } }); },
      lines: ["Only five solids have identical regular faces. Find them", "on the pedestals: count corners, edges and faces.", "Corners − edges + faces is always 2 (Euler, 1758)."] },
    { title: "Fermat's last theorem", formula: ["x^n + y^n = z^n"],
      draw: function (g) { g.fillStyle = "#e9dcc0"; g.fillRect(34, 22, 196, 220); g.fillStyle = "#6b5a44"; g.font = "italic 18px " + SERIF;
        ["Cuius rei", "demonstrationem", "mirabilem sane", "detexi. Hanc", "marginis exiguitas", "non caperet."].forEach(function (s, i) { g.fillText(s, 48, 58 + i * 32); }); },
      lines: ["No whole numbers solve it when n is bigger than 2.", "Fermat, 1637: 'I have a marvellous proof, but this margin", "is too small to hold it.' Andrew Wiles proved it in 1994."] },
    { title: "Math on Mars", formula: ["g = 3.71 m/s^2"],
      draw: function (g) { var grd = g.createRadialGradient(100, 100, 10, 130, 130, 120); grd.addColorStop(0, "#e39a66"); grd.addColorStop(0.7, "#a9502b"); grd.addColorStop(1, "#4a1d0e"); g.fillStyle = grd; g.beginPath(); g.arc(130, 130, 105, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#b9a898"; g.beginPath(); g.arc(238, 60, 9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(22, 232, 5, 0, Math.PI * 2); g.fill(); },
      lines: ["A sol lasts 24 h 39 min 35 s. A year is 687 Earth days.", "You can jump 2.6 times higher than on Earth.", "The 24 m pendulum here swings once every 16 s (Earth: 9.8 s)."] }
  ];
  // two welcome panels for the entrance vault: the math hidden in the building itself
  var VEST_PANELS = [
    { title: "Welcome to the Math Palace", formula: ["21 + 34 = 55"],
      draw: function (g, w, h) { var n = 520, GA = Math.PI * (3 - Math.sqrt(5)), c0 = w * 0.47 / Math.sqrt(n);
        for (var k = 1; k < n; k++) { var r = c0 * Math.sqrt(k), a = k * GA; g.fillStyle = "hsl(40,60%," + (38 + 25 * k / n) + "%)"; g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 1.6 + 3.2 * Math.sqrt(k / n), 0, Math.PI * 2); g.fill(); } },
      lines: ["The dome has 21 ribs winding one way and 34 the other:", "Fibonacci numbers, the same spirals as a sunflower head.", "The avenue lights sit 1, 2, 3, 5, 8, 13, 21 and 34 m from this door."] },
    { title: "Find the math", formula: ["π · φ · e · ∞"],
      draw: function (g, w, h) { var cx = w / 2, cy = h / 2, R = w * 0.42, i;
        g.strokeStyle = "#e3c173"; g.lineWidth = 2.5; g.fillStyle = "rgba(227,193,115,.18)";
        for (i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5, c = a - Math.PI / 5;   // five kites around a point
          g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(c) * R * 0.62, cy + Math.sin(c) * R * 0.62); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(b) * R * 0.62, cy + Math.sin(b) * R * 0.62); g.closePath(); g.fill(); g.stroke(); } },
      lines: ["Floor: a Penrose tiling. It never repeats, yet it has 5-fold symmetry.", "Centre: 1,600 gold seeds set 137.5° apart, the golden angle.", "Up on the wall: 465 digits of π run right round the rotunda."] }
  ];
  function vestAtlas() { var cv = mkCanvas(1536, 512), g = cv.getContext("2d"); VEST_PANELS.forEach(function (sp, i) { drawPanel(g, i * 768, 0, 768, 512, sp); }); return cv; }
  function panelAtlas(small) {              // 4 x 3 panels of 768 x 512
    var cv = mkCanvas(3072, 1536), g = cv.getContext("2d");
    PANELS.forEach(function (sp, i) { drawPanel(g, (i % 4) * 768, Math.floor(i / 4) * 512, 768, 512, sp); });
    if (!small) return cv;
    var c2 = mkCanvas(2048, 1024); c2.getContext("2d").drawImage(cv, 0, 0, 2048, 1024); return c2;
  }
  function friezeTexture(small) {           // gold equations on a dark band; tiles 8 times around the wall
    var W = 4096, Hh = 192, cv = mkCanvas(W, Hh), g = cv.getContext("2d");
    var grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, "#2a1d12"); grd.addColorStop(0.5, "#3b2918"); grd.addColorStop(1, "#2a1d12"); g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
    g.fillStyle = "#c9a24a"; g.fillRect(0, 10, W, 5); g.fillRect(0, Hh - 15, W, 5);
    var eqs = ["e^{iπ} + 1 = 0", "a^2 + b^2 = c^2", "V − E + F = 2", "φ = (1 + √5) / 2", "1 + 1/4 + 1/9 + 1/16 + … = π^2/6", "x = (−b ± √(b^2 − 4ac)) / 2a", "F_{n+1} = F_n + F_{n−1}", "i^2 = −1", "A = πr^2", "a^p ≡ a (mod p)", "e = 2.71828…"];
    g.textBaseline = "middle"; g.fillStyle = "#f0d58c"; g.font = "italic 72px " + SERIF;
    // lay the equations out once, evenly spread so the strip tiles seamlessly
    var widths = eqs.map(function (e) { return drawMath(g, e, 0, 0, 72, true); }), total = widths.reduce(function (a, b) { return a + b; }, 0), gap = (W - total) / eqs.length, x = gap / 2;
    eqs.forEach(function (e, i) { g.font = "italic 72px " + SERIF; drawMath(g, e, x, Hh / 2 + 4, 72); g.font = "40px " + SERIF; g.fillText("✦", x + widths[i] + gap / 2 - 14, Hh / 2 + 2); x += widths[i] + gap; });
    if (!small) return cv;
    var c2 = mkCanvas(2048, 96); c2.getContext("2d").drawImage(cv, 0, 0, 2048, 96); return c2;
  }
  var GLYPHS = "0123456789.π= eφ∞√iΣzng∂";
  var GLYPH_N = 24;
  function glyphAtlas() {                   // 24 cells of 64 x 128: white glyphs on transparent
    var cv = mkCanvas(GLYPH_N * 64, 128), g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    for (var i = 0; i < GLYPHS.length; i++) { var ch = GLYPHS[i]; g.font = (/[0-9.=]/.test(ch) ? "600 " : "italic 600 ") + (ch === "\u221e" || ch === "\u221a" ? 84 : 96) + "px " + SERIF; g.fillText(ch, i * 64 + 32, 70); }
    return cv;
  }
  function plaqueAtlas() {                  // the five solids with their V - E + F = 2
    var cv = mkCanvas(2560, 256), g = cv.getContext("2d"), P = [["Tetrahedron", "4 − 6 + 4 = 2"], ["Cube", "8 − 12 + 6 = 2"], ["Octahedron", "6 − 12 + 8 = 2"], ["Dodecahedron", "20 − 30 + 12 = 2"], ["Icosahedron", "12 − 30 + 20 = 2"]];
    P.forEach(function (p, i) { var x = i * 512; g.fillStyle = "#15100c"; g.fillRect(x, 0, 512, 256); g.strokeStyle = "#c9a24a"; g.lineWidth = 6; g.strokeRect(x + 12, 12, 488, 232);
      g.fillStyle = "#e9c877"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.font = "600 50px " + SERIF; g.fillText(p[0].toUpperCase(), x + 256, 106);
      g.font = "italic 50px " + SERIF; g.fillStyle = "#f6ecd8"; g.fillText(p[1], x + 256, 190); });
    return cv;
  }
  // One 2048 x 2048 atlas for everything else that carries a picture: welcome panels, brass glyphs, plaques, the gateway
  // name, whiteboard, code on the lab monitors, lobby and seminar screens, the café menu, book spines, door plates, signs.
  var ATL_N = 2048, ATL_PX = {
    vest: [0, 0, 1536, 512], signR: [1536, 0, 512, 256], signL: [1536, 256, 512, 256],
    glyph: [0, 520, 1536, 128], plaque: [0, 656, 1280, 128], gate: [0, 792, 1536, 112],
    wb: [0, 912, 1024, 362], scrLab: [1032, 912, 768, 432], code0: [0, 1282, 336, 189], code1: [344, 1282, 336, 189], code2: [688, 1282, 336, 189],
    scrLobby: [1032, 1352, 768, 432], menu: [0, 1480, 1016, 300], scrSem: [0, 1788, 344, 194], books: [352, 1788, 1696, 190], plates: [0, 1984, 2048, 64],
    podPfd: [1536, 520, 256, 154], podMap: [1792, 520, 256, 154], podSys: [1536, 682, 256, 154],
    podReg: [1800, 690, 240, 60], podRed: [1800, 760, 16, 16], podGreen: [1824, 760, 16, 16], podWhite: [1848, 760, 16, 16]
  };
  var ATL = {};
  Object.keys(ATL_PX).forEach(function (k) { var r = ATL_PX[k]; ATL[k] = [r[0] / ATL_N, 1 - (r[1] + r[3]) / ATL_N, (r[0] + r[2]) / ATL_N, 1 - r[1] / ATL_N]; });
  function atlasSub(name, u0, v0, u1, v1) { var A = ATL[name]; return [lerp(A[0], A[2], u0), lerp(A[1], A[3], v0), lerp(A[0], A[2], u1), lerp(A[1], A[3], v1)]; }
  var MONO = "Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace", SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  // text that looks written by hand: every character a little rotated and shifted
  function handText(g, str, x, y, size, color, seed) {
    var rnd = mulberry(seed || 7); g.fillStyle = color; g.textBaseline = "alphabetic";
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], sz = size * (0.94 + 0.12 * rnd()); g.font = "italic " + Math.round(sz) + "px " + SERIF;
      g.save(); g.translate(x, y + (rnd() - 0.5) * size * 0.08); g.rotate((rnd() - 0.5) * 0.09); g.fillText(ch, 0, 0); g.restore();
      x += g.measureText(ch).width * (0.97 + 0.06 * rnd());
    }
    return x;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function wobbleLine(g, pts, color, width, seed) {
    var rnd = mulberry(seed || 3); g.strokeStyle = color; g.lineWidth = width; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    pts.forEach(function (p, i) { var x = p[0] + (rnd() - 0.5) * 1.2, y = p[1] + (rnd() - 0.5) * 1.2; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
  }
  function drawWhiteboard(g, W, H) {                 // ink only: the board itself is the material
    var blue = "#1d3f8f", red = "#b3262a", blk = "#1f2226", grn = "#1f6b3a";
    handText(g, "Quadratic equations", 34, 58, 38, blue, 11); wobbleLine(g, [[34, 70], [360, 68]], blue, 3, 2);
    handText(g, "Sol 528", W - 150, 50, 28, blk, 5);
    handText(g, "ax² + bx + c = 0", 50, 124, 34, blk, 12);
    g.strokeStyle = red; g.lineWidth = 3; g.strokeRect(40, 150, 420, 64);
    handText(g, "x = (−b ± √(b² − 4ac)) / 2a", 54, 196, 32, red, 13);
    handText(g, "e.g.  x² − 5x + 6 = 0", 50, 262, 30, blk, 14);
    handText(g, "(x − 2)(x − 3) = 0  →  x = 2 or 3", 70, 304, 28, blk, 15);
    handText(g, "b² − 4ac > 0 : two roots", 560, 296, 23, grn, 16); handText(g, "= 0 : one root   < 0 : none (real)", 560, 326, 23, grn, 17);
    // the parabola y = x² − 5x + 6 on a small grid
    var ox = 690, oy = 250, sx = 34, sy = 18;
    wobbleLine(g, [[ox - 150, oy], [ox + 190, oy]], blk, 2.5, 21); wobbleLine(g, [[ox - 120, oy + 30], [ox - 120, oy - 200]], blk, 2.5, 22);
    var pts = []; for (var x = -0.4; x <= 5.4; x += 0.1) { var y = x * x - 5 * x + 6; pts.push([ox - 120 + x * sx, oy - y * sy]); }
    wobbleLine(g, pts.filter(function (p) { return p[1] > oy - 210; }), blue, 3, 23);
    [2, 3].forEach(function (r) { g.fillStyle = red; g.beginPath(); g.arc(ox - 120 + r * sx, oy, 5, 0, 7); g.fill(); });
    handText(g, "y = x² − 5x + 6", ox - 20, oy - 150, 24, blue, 24);
    handText(g, "Homework: p. 42, 1–12", 50, H - 14, 24, blk, 25);
  }
  var CODE = [
    ["primes.py", [["k", "def "], ["f", "sieve"], ["p", "(n):"]], [["p", "    is_p = [True] * (n + 1)"]], [["p", "    is_p[0] = is_p[1] = "], ["k", "False"]], [["k", "    for "], ["p", "i "], ["k", "in "], ["f", "range"], ["p", "(2, "], ["f", "int"], ["p", "(n ** 0.5) + 1):"]],
      [["k", "        if "], ["p", "is_p[i]:"]], [["k", "            for "], ["p", "j "], ["k", "in "], ["f", "range"], ["p", "(i * i, n + 1, i):"]], [["p", "                is_p[j] = "], ["k", "False"]], [["k", "    return "], ["p", "[i "], ["k", "for "], ["p", "i, p "], ["k", "in "], ["f", "enumerate"], ["p", "(is_p) "], ["k", "if "], ["p", "p]"]],
      [["p", ""]], [["f", "print"], ["p", "(sieve("], ["n", "50"], ["p", "))"]], [["c", "# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]"]]],
    ["golden.js", [["c", "// ratios of Fibonacci numbers close in on phi"]], [["k", "let "], ["p", "a = "], ["n", "1"], ["p", ", b = "], ["n", "1"], ["p", ";"]], [["k", "for "], ["p", "("], ["k", "let "], ["p", "i = "], ["n", "0"], ["p", "; i < "], ["n", "20"], ["p", "; i++) {"]],
      [["p", "  [a, b] = [b, a + b];"]], [["p", "  console."], ["f", "log"], ["p", "(b / a);"]], [["p", "}"]], [["k", "const "], ["p", "phi = ("], ["n", "1"], ["p", " + Math."], ["f", "sqrt"], ["p", "("], ["n", "5"], ["p", ")) / "], ["n", "2"], ["p", ";"]],
      [["c", "// 1.618033988749895"]], [["p", "console."], ["f", "log"], ["p", "("], ["s", "`angle: ${"], ["p", "360 / (phi * phi)"], ["s", "}°`"], ["p", ");"]], [["c", "// angle: 137.50776405003785°"]]],
    ["orbit.py", [["k", "import "], ["p", "math"]], [["p", "GM = "], ["n", "4.2828e13"], ["p", "   "], ["c", "# Mars, m^3/s^2"]], [["k", "def "], ["f", "period"], ["p", "(a):"]], [["k", "    return "], ["n", "2"], ["p", " * math.pi * math."], ["f", "sqrt"], ["p", "(a ** 3 / GM)"]],
      [["p", "phobos = "], ["n", "9.376e6"], ["p", "   "], ["c", "# semi-major axis, m"]], [["f", "print"], ["p", "(period(phobos) / 3600)"]], [["c", "# 7.65 hours: faster than a sol,"]], [["c", "# so Phobos rises in the west"]]]
  ];
  var CODE_COL = { k: "#c678dd", f: "#61afef", p: "#d7dae0", s: "#98c379", n: "#d19a66", c: "#7f848e" };
  function drawCode(g, x0, y0, W, H, spec, big) {
    g.save(); g.translate(x0, y0);
    g.fillStyle = "#1e2127"; g.fillRect(0, 0, W, H); g.fillStyle = "#282c34"; g.fillRect(0, 0, W, H * 0.1); g.fillStyle = "#1e2127"; g.fillRect(8, H * 0.03, W * 0.32, H * 0.07);
    var fs = Math.round(H / 15.5); g.font = fs * 0.8 + "px " + SANS; g.fillStyle = "#abb2bf"; g.textBaseline = "middle"; g.fillText(spec[0], 16, H * 0.066);
    g.font = fs + "px " + MONO; g.textBaseline = "alphabetic";
    for (var i = 1; i < spec.length; i++) {
      var y = H * 0.1 + (i + 0.2) * fs * 1.28, x = 12; g.fillStyle = "#4b5263"; g.fillText(String(i), x, y); x += fs * 1.9;
      spec[i].forEach(function (tk) { g.fillStyle = CODE_COL[tk[0]]; g.fillText(tk[1], x, y); x += g.measureText(tk[1]).width; });
    }
    g.fillStyle = "#528bff"; g.fillRect(12 + fs * 1.9, H * 0.1 + (spec.length - 0.35) * fs * 1.28 - fs * 0.8, 2, fs);
    g.fillStyle = "#21252b"; g.fillRect(0, H - H * 0.07, W, H * 0.07); g.font = Math.round(fs * 0.7) + "px " + SANS; g.fillStyle = "#9da5b4"; g.textBaseline = "middle"; g.fillText("Ln " + (spec.length - 1) + ", Col 1    UTF-8    " + (spec[0].split(".")[1] === "js" ? "JavaScript" : "Python"), 12, H - H * 0.035);
    g.restore();
  }
  function slide(g, x0, y0, W, H, title, lines, pic) {
    g.save(); g.translate(x0, y0);
    var grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, "#0f1a2b"); grd.addColorStop(1, "#1b2a40"); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.fillStyle = "#e8b04a"; g.fillRect(0, 0, W, H * 0.012);
    g.fillStyle = "#ffffff"; g.font = "600 " + Math.round(H * 0.085) + "px " + SANS; g.textBaseline = "alphabetic"; g.fillText(title, W * 0.05, H * 0.15);
    g.font = Math.round(H * 0.05) + "px " + SANS; g.fillStyle = "#c9d4e3";
    lines.forEach(function (l, i) { g.fillText(l, W * 0.05, H * (0.27 + i * 0.085)); });
    if (pic) pic(g, W, H);
    g.fillStyle = "#6f7f96"; g.font = Math.round(H * 0.035) + "px " + SANS; g.fillText("TTMath Mars Campus", W * 0.05, H * 0.95);
    g.restore();
  }
  function orbitPic(g, W, H) {
    var cx = W * 0.74, cy = H * 0.55, a = W * 0.18, b = W * 0.14, c = Math.sqrt(a * a - b * b);
    g.strokeStyle = "#5f86b8"; g.lineWidth = H * 0.006; g.beginPath(); g.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#d9663a"; g.beginPath(); g.arc(cx - c, cy, H * 0.04, 0, 7); g.fill();
    g.fillStyle = "#cfd6e0"; g.beginPath(); g.arc(cx + a * Math.cos(0.9), cy + b * Math.sin(0.9), H * 0.015, 0, 7); g.fill();
    g.fillStyle = "rgba(95,134,184,0.25)"; g.beginPath(); g.moveTo(cx - c, cy); for (var t = 0.9; t <= 1.5; t += 0.05) g.lineTo(cx + a * Math.cos(t), cy + b * Math.sin(t)); g.closePath(); g.fill();
  }
  function drawMenu(g, W, H) {                     // chalk: white with a little grain, on the board material
    var rnd = mulberry(99); g.save();
    function chalk(str, x, y, size, seed) { handText(g, str, x, y, size, "rgba(255,255,255,0.92)", seed); }
    chalk("Café  π", 36, 62, 50, 31);
    [["Espresso", "2"], ["Cappuccino", "3"], ["Flat white", "3"], ["Martian mocha", "4"], ["Hot chocolate", "3"]].forEach(function (it, i) { chalk(it[0], 44, 116 + i * 38, 30, 40 + i); chalk(it[1], 440, 116 + i * 38, 30, 50 + i); });
    [["Green tea", "2"], ["Pi(e) of the day", "3.14"], ["Fibonacci cookies", "1, 1, 2 …"], ["Hydroponic salad", "5"]].forEach(function (it, i) { chalk(it[0], 540, 116 + i * 38, 30, 60 + i); chalk(it[1], 850, 116 + i * 38, 30, 70 + i); });
    chalk("grown in the greenhouse on level −1", 540, 270, 22, 80);
    g.globalCompositeOperation = "destination-out";
    for (var k = 0; k < 9000; k++) { g.fillStyle = "rgba(0,0,0," + (0.2 + 0.5 * rnd()) + ")"; g.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
    g.restore();
  }
  function drawBooks(g, x0, y0, W, H) {
    var rnd = mulberry(123), x = 0, cols = ["#6b1f1f", "#1f3354", "#2c4a32", "#a8844f", "#1c1c1f", "#d8cfb8", "#5a2e4f", "#8a4b23", "#39505c", "#b9a57a"];
    g.save(); g.translate(x0, y0); g.fillStyle = "#1a120c"; g.fillRect(0, 0, W, H);
    while (x < W) {
      var w = 14 + rnd() * 26, h = H * (0.72 + rnd() * 0.26), c = cols[Math.floor(rnd() * cols.length)];
      if (x + w > W) w = W - x;
      g.fillStyle = c; g.fillRect(x, H - h, w - 1, h);
      var sh = g.createLinearGradient(x, 0, x + w, 0); sh.addColorStop(0, "rgba(0,0,0,0.35)"); sh.addColorStop(0.3, "rgba(255,255,255,0.08)"); sh.addColorStop(1, "rgba(0,0,0,0.3)"); g.fillStyle = sh; g.fillRect(x, H - h, w - 1, h);
      g.fillStyle = rnd() < 0.5 ? "#d8b35a" : "#e9e2cf"; g.fillRect(x + 2, H - h + h * 0.12, w - 5, 2); g.fillRect(x + 2, H - h * 0.18, w - 5, 2);
      if (w > 22) { g.save(); g.translate(x + w / 2 + 4, H - h * 0.5); g.rotate(-Math.PI / 2); g.fillStyle = "rgba(233,226,207,0.85)"; g.font = Math.round(w * 0.42) + "px " + SERIF; g.textAlign = "center"; g.fillText(["EUCLID", "GAUSS", "EULER", "NOETHER", "RAMANUJAN", "TURING", "KEPLER", "LOVELACE", "CALCULUS", "ALGEBRA", "TOPOLOGY", "PRIMES"][Math.floor(rnd() * 12)], 0, 0); g.restore(); }
      x += w;
    }
    g.restore();
  }
  // the pod's three displays: flight (attitude, speed, height, heading), the map of the campus, the craft's systems
  function drawPodScreens(g, R) {
    [["podRed", "#ff2a1a"], ["podGreen", "#1aff5a"], ["podWhite", "#ffffff"]].forEach(function (c) { var r = R[c[0]]; g.fillStyle = c[1]; g.fillRect(r[0], r[1], r[2], r[3]); });
    var rg = R.podReg; g.fillStyle = "#dcdad3"; g.fillRect(rg[0], rg[1], rg[2], rg[3]); g.fillStyle = "#3a3d42"; g.font = "700 38px " + SANS; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("TTM \u00b7 01", rg[0] + rg[2] / 2, rg[1] + rg[3] / 2 + 2); g.textAlign = "left";
    function screen(r, draw) { g.save(); g.translate(r[0], r[1]); g.beginPath(); g.rect(0, 0, r[2], r[3]); g.clip(); g.fillStyle = "#0a0c0f"; g.fillRect(0, 0, r[2], r[3]); draw(r[2], r[3]); g.restore(); }
    screen(R.podPfd, function (W, H) {
      var cx = W / 2, cy = H / 2;
      g.save(); g.beginPath(); g.rect(W * 0.2, 8, W * 0.6, H - 16); g.clip(); g.translate(cx, cy + 7); g.rotate(-0.07);
      g.fillStyle = "#b98457"; g.fillRect(-W, -H * 2, W * 2, H * 2); g.fillStyle = "#5e3420"; g.fillRect(-W, 0, W * 2, H * 2);
      g.strokeStyle = "#ffffff"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-W, 0); g.lineTo(W, 0); g.stroke(); g.lineWidth = 1.2;
      for (var k = -3; k <= 3; k++) if (k) { var w = k % 2 ? 9 : 18; g.beginPath(); g.moveTo(-w, -k * 12); g.lineTo(w, -k * 12); g.stroke(); }
      g.restore();
      g.strokeStyle = "#f2c230"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 34, cy); g.lineTo(cx - 12, cy); g.lineTo(cx - 6, cy + 6); g.moveTo(cx + 34, cy); g.lineTo(cx + 12, cy); g.lineTo(cx + 6, cy + 6); g.stroke();
      g.fillStyle = "rgba(24,28,34,0.92)"; g.fillRect(3, 8, W * 0.17, H - 16); g.fillRect(W * 0.83 - 3, 8, W * 0.17, H - 16);
      g.font = "600 11px " + MONO; g.textAlign = "center"; g.textBaseline = "middle";
      for (var j = -2; j <= 2; j++) { g.fillStyle = "#b9c0c9"; g.fillText(String(24 + j * 10 > 0 ? 24 + j * 10 : 0), 3 + W * 0.085, cy - j * 26); g.fillText(String(120 + j * 20), W * 0.915 - 3, cy - j * 26); }
      g.fillStyle = "#000"; g.strokeStyle = "#ffffff"; g.lineWidth = 1.2; g.fillRect(2, cy - 9, W * 0.19, 18); g.strokeRect(2, cy - 9, W * 0.19, 18); g.fillRect(W * 0.81 - 2, cy - 9, W * 0.19, 18); g.strokeRect(W * 0.81 - 2, cy - 9, W * 0.19, 18);
      g.font = "700 13px " + MONO; g.fillStyle = "#55e07a"; g.fillText("24", 2 + W * 0.095, cy + 1); g.fillText("120", W * 0.905 - 2, cy + 1);
      g.font = "600 10px " + MONO; g.fillStyle = "#8fd3ff"; g.fillText("m/s", 3 + W * 0.085, 18); g.fillText("m", W * 0.915 - 3, 18);
      g.fillStyle = "rgba(24,28,34,0.92)"; g.fillRect(cx - 26, H - 20, 52, 16); g.fillStyle = "#ffffff"; g.font = "700 12px " + MONO; g.fillText("012°", cx, H - 12);
    });
    screen(R.podMap, function (W, H) {
      g.fillStyle = "#101a22"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(120,160,190,0.25)"; g.lineWidth = 1;
      for (var k = 0; k < 5; k++) { g.beginPath(); g.ellipse(W * 0.3, H * 0.75, 40 + k * 26, 22 + k * 15, 0.3, 0, 2 * Math.PI); g.stroke(); }
      var cx = W * 0.55, cy = H * 0.52, s = 0.55;
      g.strokeStyle = "#d9dde2"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 28 * s, 0, 2 * Math.PI); g.stroke();
      g.lineWidth = 6; g.strokeStyle = "#8a96a3"; g.beginPath(); g.arc(cx, cy, 54 * s, Math.PI * 0.21, Math.PI * 0.79); g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = "#7ec8e3"; g.beginPath(); g.arc(cx, cy, 38 * s, Math.PI * 0.22, Math.PI * 0.78); g.stroke();
      g.strokeStyle = "#8a96a3"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 14, cy - 20 * s); g.lineTo(cx - 24, cy - 78 * s); g.moveTo(cx + 14, cy - 20 * s); g.lineTo(cx + 24, cy - 78 * s); g.stroke();
      g.fillStyle = "#f2c230"; g.beginPath(); g.moveTo(cx - 40, cy - 64); g.lineTo(cx - 46, cy - 50); g.lineTo(cx - 34, cy - 50); g.closePath(); g.fill();
      g.strokeStyle = "rgba(242,194,48,0.6)"; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(cx - 40, cy - 57); g.lineTo(cx - 6, cy - 10); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#e6e9ee"; g.font = "600 10px " + SANS; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText("TTMath campus", 8, 16); g.fillStyle = "#8fa3b8"; g.fillText("N ↑", W - 28, 16);
      g.strokeStyle = "#e6e9ee"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(8, H - 10); g.lineTo(48, H - 10); g.moveTo(8, H - 14); g.lineTo(8, H - 6); g.moveTo(48, H - 14); g.lineTo(48, H - 6); g.stroke(); g.fillText("100 m", 54, H - 6);
    });
    screen(R.podSys, function (W, H) {
      g.textBaseline = "middle";
      [[36, 34], [92, 34], [36, 86], [92, 86]].forEach(function (p, i) {
        g.strokeStyle = "#2a3440"; g.lineWidth = 5; g.beginPath(); g.arc(p[0], p[1], 19, 0.75 * Math.PI, 2.25 * Math.PI); g.stroke();
        g.strokeStyle = "#55e07a"; g.beginPath(); g.arc(p[0], p[1], 19, 0.75 * Math.PI, (0.75 + 1.5 * [0.86, 0.88, 0.85, 0.87][i]) * Math.PI); g.stroke();
        g.fillStyle = "#e6e9ee"; g.font = "700 10px " + MONO; g.textAlign = "center"; g.fillText(["86", "88", "85", "87"][i], p[0], p[1]);
      });
      g.font = "600 9px " + MONO; g.fillStyle = "#8fa3b8"; g.textAlign = "center"; g.fillText("ROTOR %", 64, 118);
      g.textAlign = "left"; g.font = "600 11px " + MONO;
      [["BATTERY", "86 %", "#55e07a"], ["RANGE", "48 km", "#e6e9ee"], ["CABIN", "1.00 bar", "#e6e9ee"], ["", "21 °C", "#e6e9ee"], ["OUTSIDE", "−63 °C", "#8fd3ff"], ["", "6.1 mbar", "#8fd3ff"]].forEach(function (r, i) {
        g.fillStyle = "#8fa3b8"; g.fillText(r[0], 130, 18 + i * 21); g.fillStyle = r[2]; g.textAlign = "right"; g.fillText(r[1], W - 8, 18 + i * 21); g.textAlign = "left"; });
      g.fillStyle = "#1d2630"; g.fillRect(130, H - 14, W - 138, 6); g.fillStyle = "#55e07a"; g.fillRect(130, H - 14, (W - 138) * 0.86, 6);
    });
  }
  function campusAtlas() {
    var cv = mkCanvas(ATL_N, ATL_N), g = cv.getContext("2d"), R = ATL_PX;
    // welcome panels and glyphs and plaques from the palace art
    VEST_PANELS.forEach(function (sp, i) { drawPanel(g, R.vest[0] + i * 768, R.vest[1], 768, 512, sp); });
    var ga = glyphAtlas(); g.drawImage(ga, R.glyph[0], R.glyph[1], R.glyph[2], R.glyph[3]);
    var pa = plaqueAtlas(); g.drawImage(pa, R.plaque[0], R.plaque[1], R.plaque[2], R.plaque[3]);
    g.save(); g.translate(R.wb[0], R.wb[1]); drawWhiteboard(g, R.wb[2], R.wb[3]); g.restore();
    slide(g, R.scrLab[0], R.scrLab[1], R.scrLab[2], R.scrLab[3], "Today: simulate an orbit", ["1. Newton's law of gravity: F = GMm / r²", "2. Step the position every second", "3. Plot it: an ellipse appears", "4. Check Kepler: T² ∝ a³"], orbitPic);
    [0, 1, 2].forEach(function (k) { var r = R["code" + k]; drawCode(g, r[0], r[1], r[2], r[3], CODE[k]); });
    drawLobbyDirectory(g, R.scrLobby[0], R.scrLobby[1], R.scrLobby[2], R.scrLobby[3]); drawPodScreens(g, R);
    slide(g, R.scrSem[0], R.scrSem[1], R.scrSem[2], R.scrSem[3], "Kepler's laws", ["Orbits are ellipses", "Equal areas in equal times", "T² ∝ a³"], orbitPic);
    g.save(); g.translate(R.menu[0], R.menu[1]); drawMenu(g, R.menu[2], R.menu[3]); g.restore();
    drawBooks(g, R.books[0], R.books[1], R.books[2], R.books[3]);
    drawPlates(g);                                                  // the Ring's door plates (blk_board.js)
    return cv;
  }
