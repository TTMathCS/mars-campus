
  /* ============================== procedural PBR textures ============================== */
  // Every texture tiles: noise lattices wrap with a whole-number period.
  var TS = MOBILE ? 0.5 : 1; // texture size scale
  var ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function pn(x, y, P, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var x0 = ((xi % P) + P) % P, y0 = ((yi % P) + P) % P, x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
    var a = hash2i(x0, y0, s), b = hash2i(x1, y0, s), c = hash2i(x0, y1, s), d = hash2i(x1, y1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // periodic fbm: Px, Py are the lattice periods across the unit texture
  function pf(u, v, Px, Py, oct, s) {
    var sum = 0, amp = 0.5, f = 1, n = 0;
    for (var o = 0; o < oct; o++) { sum += amp * pnXY(u * Px * f, v * Py * f, Px * f, Py * f, s + o * 17); n += amp; f *= 2; amp *= 0.5; }
    return sum / n;
  }
  function pnXY(x, y, Px, Py, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var x0 = ((xi % Px) + Px) % Px, y0 = ((yi % Py) + Py) % Py, x1 = (x0 + 1) % Px, y1 = (y0 + 1) % Py;
    var a = hash2i(x0, y0, s), b = hash2i(x1, y0, s), c = hash2i(x0, y1, s), d = hash2i(x1, y1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // periodic Worley: returns [F1, F2, cell id] for N x N cells
  var _wr = [0, 0, 0];
  function worley(u, v, N, s) {
    var x = u * N, y = v * N, xi = Math.floor(x), yi = Math.floor(y), f1 = 9, f2 = 9, id = 0;
    for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var cx = xi + i, cy = yi + j, wx = ((cx % N) + N) % N, wy = ((cy % N) + N) % N;
      var px = cx + hash2i(wx, wy, s), py = cy + hash2i(wx, wy, s + 1), d = Math.hypot(px - x, py - y);
      if (d < f1) { f2 = f1; f1 = d; id = hash2i(wx, wy, s + 2); } else if (d < f2) f2 = d;
    }
    _wr[0] = f1; _wr[1] = f2; _wr[2] = id; return _wr;
  }
  function toCanvas(data, size) { var c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").putImageData(new ImageData(data, size, size), 0, 0); return c; }
  function mkTex(canvas, srgb) {
    var t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
    if (srgb) t.encoding = THREE.sRGBEncoding; return t;
  }
  // fn(u, v, o) fills o.h (height 0..1), o.r o.g o.b (sRGB albedo 0..1) and o.ro (roughness)
  function pbr(size, strength, fn, opts) {
    size = Math.max(64, Math.round(size * TS)); opts = opts || {};
    var n = size * size, H = new Float32Array(n), A = new Uint8ClampedArray(n * 4), R = opts.noRough ? null : new Uint8ClampedArray(n * 4), o = { h: 0.5, r: 1, g: 1, b: 1, ro: 0.5, a: 1 };
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      o.a = 1; fn(x / size, y / size, o);
      var i = y * size + x, k = i * 4; H[i] = o.h;
      A[k] = o.r * 255; A[k + 1] = o.g * 255; A[k + 2] = o.b * 255; A[k + 3] = o.a * 255;
      if (R) { var rv = o.ro * 255; R[k] = rv; R[k + 1] = rv; R[k + 2] = 0; R[k + 3] = 255; }
    }
    var N = new Uint8ClampedArray(n * 4), st = strength * size / 512;
    for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) {
      var xl = (xx - 1 + size) % size, xr = (xx + 1) % size, yu = (yy - 1 + size) % size, yd = (yy + 1) % size;
      var dx = (H[yy * size + xr] - H[yy * size + xl]) * st, dy = (H[yd * size + xx] - H[yu * size + xx]) * st, l = Math.sqrt(dx * dx + dy * dy + 1), kk = (yy * size + xx) * 4;
      N[kk] = (-dx / l * 0.5 + 0.5) * 255; N[kk + 1] = (dy / l * 0.5 + 0.5) * 255; N[kk + 2] = (1 / l * 0.5 + 0.5) * 255; N[kk + 3] = 255;
    }
    return { map: opts.noMap ? null : mkTex(toCanvas(A, size), true), normalMap: mkTex(toCanvas(N, size), false), roughnessMap: R ? mkTex(toCanvas(R, size), false) : null };
  }
  function mix3(o, a, b, t) { o.r = lerp(a[0], b[0], t); o.g = lerp(a[1], b[1], t); o.b = lerp(a[2], b[2], t); }
  function frac(x) { return x - Math.floor(x); }

  var TX = {};
  var TEXGEN = [
    ["oak", function () { // oak floorboards, 2.4 m tile: 12 rows of 20 cm planks, 1.2 m long
      TX.oak = pbr(1024, 5, function (u, v, o) {
        var row = Math.floor(v * 12), rv = v * 12 - row, off = hash2i(row, 7, 3), pu = (u + off) * 2, pk = Math.floor(pu), pfr = pu - pk;
        var id = hash2i(row, ((pk % 2) + 2) % 2, 5), tone = (id - 0.5) * 0.16;
        var warp = pf(u, v, 4, 24, 4, 11 + row) * 3;
        var ring = 0.5 + 0.5 * Math.sin((rv * 2.2 + warp + id * 9) * Math.PI * 2);
        var fine = pnXY(u * 6, v * 1440, 6, 1440, 31);
        var t = clamp(ring * 0.55 + fine * 0.45, 0, 1);
        mix3(o, [0.70 + tone, 0.53 + tone * 0.9, 0.36 + tone * 0.7], [0.53 + tone, 0.37 + tone * 0.9, 0.23 + tone * 0.7], t);
        var e = Math.min(rv, 1 - rv) * 0.2, e2 = Math.min(pfr, 1 - pfr) * 1.2, g = Math.min(e, e2);
        var groove = 1 - smoothstep(0.0006, 0.0022, g);
        o.r *= 1 - groove * 0.55; o.g *= 1 - groove * 0.6; o.b *= 1 - groove * 0.6;
        o.h = 0.7 + fine * 0.05 - ring * 0.04 - groove * 0.5; o.ro = 0.34 + fine * 0.14 + groove * 0.4;
      });
    }],
    ["walnut", function () {
      TX.walnut = pbr(512, 3, function (u, v, o) {
        var warp = pf(u, v, 3, 5, 4, 41) * 2.6 + 0.35 * Math.sin(u * Math.PI * 2);
        var ring = 0.5 + 0.5 * Math.sin((v * 7 + warp) * Math.PI * 2), fine = pnXY(u * 4, v * 900, 4, 900, 43);
        var t = clamp(ring * 0.6 + fine * 0.4, 0, 1);
        mix3(o, [0.45, 0.29, 0.18], [0.27, 0.16, 0.09], t);
        o.h = 0.5 + fine * 0.06 - ring * 0.03; o.ro = 0.3 + fine * 0.12;
      });
    }],
    ["oakgrain", function () { // light oak for furniture and panelling
      TX.oakgrain = pbr(512, 3, function (u, v, o) {
        var warp = pf(u, v, 3, 5, 4, 47) * 2.2 + 0.3 * Math.sin(u * Math.PI * 2);
        var ring = 0.5 + 0.5 * Math.sin((v * 9 + warp) * Math.PI * 2), fine = pnXY(u * 4, v * 900, 4, 900, 49), ray = pnXY(u * 60, v * 12, 60, 12, 53) > 0.82 ? 1 : 0;
        mix3(o, [0.76, 0.6, 0.42], [0.6, 0.44, 0.28], clamp(ring * 0.55 + fine * 0.45, 0, 1)); o.r += ray * 0.04; o.g += ray * 0.035;
        o.h = 0.5 + fine * 0.06 - ring * 0.03; o.ro = 0.36 + fine * 0.12;
      });
    }],
    ["ground", function () { // neutral regolith detail for the terrain (the vertex colours carry the hue)
      TX.ground = pbr(512, 7, function (u, v, o) {
        var w = worley(u, v, 26, 311), pebOn = w[2] > 0.5 ? 1 - smoothstep(0.16, 0.32, w[0]) : 0, w2 = worley(u, v, 90, 313), grit = w2[2] > 0.45 ? 1 - smoothstep(0.08, 0.26, w2[0]) : 0;
        var d = pf(u, v, 5, 5, 5, 315), gr = pnXY(u * 256, v * 256, 256, 256, 317), rip = 0.5 + 0.5 * Math.sin((u * 3 + v * 11 + d * 3) * Math.PI * 2);
        var c = 0.78 + (d - 0.5) * 0.16 + (gr - 0.5) * 0.08 - pebOn * 0.28 - grit * 0.1; o.r = c * 1.02; o.g = c; o.b = c * 0.97;
        o.h = d * 0.25 + gr * 0.12 + pebOn * 0.55 + grit * 0.22 + rip * 0.08; o.ro = 0.95 - pebOn * 0.2;
      });
    }],
    ["bookWall", function () { TX.bookWall = bookWallTex(); ["broad", "conifer", "palm", "fern", "grass", "monstera"].forEach(function (k) { LEAFTEX[k] = leafCard(k); }); }],
    ["marble", function () { // Calacatta: warm white with grey-gold veins, 1.2 m slabs
      TX.marble = pbr(1024, 1.5, function (u, v, o) {
        var t = pf(u, v, 3, 3, 6, 61), t2 = pf(u, v, 6, 6, 5, 67);
        var a1 = Math.abs(Math.sin((u + 2 * v + t * 2.4) * Math.PI * 2)), a2 = Math.abs(Math.sin((2 * u - v + t2 * 3.1) * Math.PI * 2));
        var vein = 1 - smoothstep(0, 0.045, a1), thin = (1 - smoothstep(0, 0.012, a2)) * 0.6, haze = 1 - smoothstep(0, 0.22, a1);
        var cloud = pf(u, v, 8, 8, 4, 69);
        mix3(o, [0.95, 0.94, 0.92], [0.86, 0.85, 0.83], cloud * 0.6 + haze * 0.3);
        var vt = Math.max(vein, thin); o.r = lerp(o.r, 0.55, vt); o.g = lerp(o.g, 0.52, vt); o.b = lerp(o.b, 0.47, vt);
        var su = frac(u * 2), sv = frac(v * 2), seam = 1 - smoothstep(0.0005, 0.0016, Math.min(su, 1 - su, sv, 1 - sv) * 1.2);
        o.r -= seam * 0.2; o.g -= seam * 0.2; o.b -= seam * 0.2;
        o.h = 0.8 - seam * 0.6 - vt * 0.01; o.ro = 0.07 + vt * 0.08 + seam * 0.4;
      });
    }],
    ["marbleDark", function () { // Nero Marquina: black with white veins
      TX.marbleDark = pbr(512, 1.5, function (u, v, o) {
        var t = pf(u, v, 3, 3, 6, 71), a1 = Math.abs(Math.sin((u * 2 + v + t * 2.8) * Math.PI * 2)), a2 = Math.abs(Math.sin((u - 2 * v + t * 4) * Math.PI * 2));
        var vt = Math.max(1 - smoothstep(0, 0.02, a1), (1 - smoothstep(0, 0.008, a2)) * 0.7), cl = pf(u, v, 6, 6, 4, 73);
        mix3(o, [0.06, 0.06, 0.065], [0.11, 0.105, 0.1], cl); o.r = lerp(o.r, 0.85, vt); o.g = lerp(o.g, 0.84, vt); o.b = lerp(o.b, 0.82, vt);
        o.h = 0.5; o.ro = 0.08 + vt * 0.05;
      });
    }],
    ["terrazzo", function () {
      var pal = [[0.93, 0.92, 0.89], [0.55, 0.53, 0.5], [0.72, 0.48, 0.36], [0.24, 0.23, 0.23], [0.86, 0.8, 0.68]];
      TX.terrazzo = pbr(512, 1.2, function (u, v, o) {
        var w = worley(u, v, 34, 81), base = pf(u, v, 8, 8, 3, 83);
        mix3(o, [0.83, 0.81, 0.77], [0.78, 0.76, 0.72], base);
        var rad = 0.18 + hash2i(Math.floor(w[2] * 997), 1, 3) * 0.3;
        if (w[0] < rad) { var c = pal[Math.floor(w[2] * pal.length)]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }
        var w2 = worley(u, v, 90, 85); if (w2[0] < 0.14) { var c2 = pal[Math.floor(w2[2] * pal.length)]; o.r = lerp(o.r, c2[0], 0.8); o.g = lerp(o.g, c2[1], 0.8); o.b = lerp(o.b, c2[2], 0.8); }
        o.h = 0.5 + base * 0.02; o.ro = 0.16 + base * 0.08;
      });
    }],
    ["plaster", function () { // Venetian lime plaster, pale and warm (tinted by each material)
      TX.plaster = pbr(512, 1.2, function (u, v, o) {
        var m = pf(u, v, 4, 4, 5, 91), m2 = pf(u, v, 16, 16, 3, 93), c = 0.92 + (m - 0.5) * 0.1 + (m2 - 0.5) * 0.04;
        o.r = c; o.g = c * 0.985; o.b = c * 0.96; o.h = m * 0.4 + m2 * 0.2; o.ro = 0.62 + (m2 - 0.5) * 0.2;
      });
    }],
    ["sinter", function () { // 3D-printed sintered regolith: 2.5 cm layers
      TX.sinter = pbr(512, 4, function (u, v, o) {
        var wob = pf(u, v, 8, 2, 3, 101) * 0.35, f = frac(v * 40 + wob), prof = Math.pow(Math.sin(f * Math.PI), 0.6);
        var gr = pnXY(u * 128, v * 128, 128, 128, 103), m = pf(u, v, 4, 4, 4, 105);
        mix3(o, [0.74, 0.55, 0.41], [0.6, 0.42, 0.3], m * 0.7 + gr * 0.3);
        o.r *= 0.86 + prof * 0.14; o.g *= 0.86 + prof * 0.14; o.b *= 0.86 + prof * 0.14;
        o.h = prof * 0.8 + gr * 0.2; o.ro = 0.88 + gr * 0.1;
      });
    }],
    ["regolith", function () { // Martian soil: dust, grit and pebbles
      TX.regolith = pbr(512, 6, function (u, v, o) {
        var w = worley(u, v, 22, 111), peb = 1 - smoothstep(0.18, 0.34, w[0]) * 1, pebOn = w[2] > 0.55 ? peb : 0;
        var w2 = worley(u, v, 70, 113), sm = w2[2] > 0.5 ? 1 - smoothstep(0.1, 0.3, w2[0]) : 0;
        var d = pf(u, v, 6, 6, 5, 115), gr = pnXY(u * 256, v * 256, 256, 256, 117);
        mix3(o, [0.66, 0.42, 0.29], [0.52, 0.31, 0.2], d * 0.8 + gr * 0.2);
        var pc = 0.55 + hash2i(Math.floor(w[2] * 1e4), 3, 5) * 0.35;
        if (pebOn > 0.05) { o.r = lerp(o.r, 0.36 * pc + 0.1, pebOn); o.g = lerp(o.g, 0.26 * pc + 0.05, pebOn); o.b = lerp(o.b, 0.2 * pc + 0.04, pebOn); }
        o.h = d * 0.3 + gr * 0.15 + pebOn * 0.55 + sm * 0.25; o.ro = 0.93 - pebOn * 0.25;
      });
    }],
    ["basalt", function () {
      TX.basalt = pbr(512, 1.5, function (u, v, o) {
        var s = pnXY(u * 512, v * 512, 512, 512, 121), m = pf(u, v, 6, 6, 4, 123), w = worley(u, v, 60, 125), xtal = w[2] > 0.85 && w[0] < 0.2 ? 1 : 0;
        var c = 0.17 + m * 0.05 + (s - 0.5) * 0.06 + xtal * 0.2; o.r = c; o.g = c * 0.98; o.b = c * 0.98; o.h = 0.5 + s * 0.05; o.ro = 0.3 + s * 0.1 - xtal * 0.15;
      });
    }],
    ["slate", function () {
      TX.slate = pbr(512, 5, function (u, v, o) {
        var tu = frac(u * 2), tv = frac(v * 2), gr = Math.min(tu, 1 - tu, tv, 1 - tv), grout = 1 - smoothstep(0.004, 0.009, gr);
        var tid = hash2i(Math.floor(u * 2), Math.floor(v * 2), 131), cleft = pf(u + tid, v, 4, 16, 5, 133);
        var c = 0.28 + (tid - 0.5) * 0.05 + cleft * 0.06; o.r = c * 0.97; o.g = c; o.b = c * 1.06;
        if (grout > 0) { o.r = lerp(o.r, 0.18, grout); o.g = lerp(o.g, 0.18, grout); o.b = lerp(o.b, 0.18, grout); }
        o.h = 0.6 + cleft * 0.3 - grout * 0.5; o.ro = 0.62 + cleft * 0.2;
      });
    }],
    ["mosaic", function () { // glass mosaic for the pools, 2.5 cm tiles
      TX.mosaic = pbr(512, 3, function (u, v, o) {
        var N = 20, cu = Math.floor(u * N), cv = Math.floor(v * N), fu = frac(u * N), fv = frac(v * N), g = Math.min(fu, 1 - fu, fv, 1 - fv), grout = 1 - smoothstep(0.03, 0.07, g);
        var id = hash2i(cu, cv, 141), id2 = hash2i(cu, cv, 143);
        o.r = 0.08 + id * 0.1; o.g = 0.42 + id * 0.18 + id2 * 0.06; o.b = 0.55 + id2 * 0.2;
        if (grout > 0) { o.r = lerp(o.r, 0.85, grout); o.g = lerp(o.g, 0.86, grout); o.b = lerp(o.b, 0.84, grout); }
        o.h = 0.8 - grout * 0.6; o.ro = 0.08 + grout * 0.6;
      });
    }],
    ["weave", function () { // plain-woven upholstery (white, tinted by each fabric)
      TX.weave = pbr(512, 2.2, function (u, v, o) {
        var N = 96, tu = u * N, tv = v * N, cu = Math.floor(tu), cv = Math.floor(tv), over = (cu + cv) % 2 === 0;
        var w1 = Math.sin(Math.PI * frac(tu)), w2 = Math.sin(Math.PI * frac(tv)), h = over ? Math.max(w1 * 0.95, w2 * 0.55) : Math.max(w2 * 0.95, w1 * 0.55);
        var heather = pnXY(u * 192, v * 24, 192, 24, 151), slub = pf(u, v, 8, 8, 3, 153);
        var c = 0.8 + heather * 0.12 + slub * 0.06 - (1 - h) * 0.12; o.r = o.g = o.b = c; o.h = h; o.ro = 0.86 + (1 - h) * 0.1;
      });
    }],
    ["boucle", function () {
      TX.boucle = pbr(512, 3, function (u, v, o) {
        var w = worley(u, v, 70, 161), loop = smoothstep(0.1, 0.45, w[0]) * (1 - smoothstep(0.45, 0.6, w[0])), n = pf(u, v, 32, 32, 3, 163);
        var h = loop * 0.7 + n * 0.3, c = 0.78 + h * 0.18; o.r = o.g = o.b = c; o.h = h; o.ro = 0.95;
      });
    }],
    ["leather", function () {
      TX.leather = pbr(512, 2.5, function (u, v, o) {
        var w = worley(u, v, 48, 171), cr = smoothstep(0, 0.14, w[1] - w[0]), m = pf(u, v, 6, 6, 4, 173);
        var c = 0.82 + cr * 0.16 + (m - 0.5) * 0.1; o.r = o.g = o.b = c; o.h = cr * 0.7 + m * 0.2; o.ro = 0.42 + (1 - cr) * 0.18;
      });
    }],
    ["brushed", function () { // brushed metal, streaks along u
      TX.brushed = pbr(512, 0.7, function (u, v, o) {
        var s = pnXY(u * 4, v * 384, 4, 384, 181) * 0.7 + pnXY(u * 16, v * 1024, 16, 1024, 183) * 0.3, m = pf(u, v, 4, 4, 3, 185);
        var c = 0.94 - s * 0.1 - m * 0.04; o.r = o.g = o.b = c; o.h = s; o.ro = 0.26 + s * 0.16 + m * 0.06;
      });
    }],
    ["concrete", function () {
      TX.concrete = pbr(512, 2.5, function (u, v, o) {
        var m = pf(u, v, 6, 6, 5, 191), gr = pnXY(u * 256, v * 256, 256, 256, 193), w = worley(u, v, 40, 195), pore = w[2] > 0.8 ? 1 - smoothstep(0.05, 0.14, w[0]) : 0;
        var bv = frac(v * 6), board = 1 - smoothstep(0.002, 0.008, Math.min(bv, 1 - bv));
        var c = 0.6 + (m - 0.5) * 0.14 + (gr - 0.5) * 0.05 - pore * 0.25 - board * 0.06; o.r = c * 1.01; o.g = c; o.b = c * 0.97;
        o.h = 0.6 + gr * 0.1 - pore * 0.5 - board * 0.3 + (pf(u, v * 6 % 1, 32, 2, 2, 197) - 0.5) * 0.04; o.ro = 0.84 + gr * 0.1;
      });
    }],
    ["rock", function () { // layered Martian basaltic rock with fractures
      TX.rock = pbr(1024, 6, function (u, v, o) {
        var warp = pf(u, v, 3, 3, 4, 201) * 1.5, strata = 0.5 + 0.5 * Math.sin((v * 9 + warp) * Math.PI * 2);
        var cr = 0, amp = 0.5, f = 1;
        for (var k = 0; k < 4; k++) { var n = pnXY(u * 6 * f, v * 6 * f, 6 * f, 6 * f, 203 + k * 7); cr += amp * Math.pow(1 - Math.abs(n * 2 - 1), 6); amp *= 0.5; f *= 2; }
        var m = pf(u, v, 8, 8, 5, 211), gr = pnXY(u * 384, v * 384, 384, 384, 213);
        mix3(o, [0.56, 0.36, 0.25], [0.36, 0.22, 0.15], m * 0.6 + strata * 0.4);
        var dk = smoothstep(0.55, 0.75, pf(u, v, 4, 4, 3, 215)); o.r = lerp(o.r, 0.26, dk * 0.6); o.g = lerp(o.g, 0.19, dk * 0.6); o.b = lerp(o.b, 0.15, dk * 0.6);
        o.r *= 1 - cr * 0.45; o.g *= 1 - cr * 0.45; o.b *= 1 - cr * 0.45;
        o.h = m * 0.5 + strata * 0.25 - cr * 0.45 + gr * 0.08; o.ro = 0.86 + gr * 0.1;
      });
    }],
    ["sand", function () { // washed white-gold sand for the grotto beach
      TX.sand = pbr(512, 3, function (u, v, o) {
        var warp = pf(u, v, 3, 3, 3, 221), rip = 0.5 + 0.5 * Math.sin((v * 14 + warp * 2.5 + u) * Math.PI * 2), gr = pnXY(u * 512, v * 512, 512, 512, 223);
        mix3(o, [0.9, 0.82, 0.66], [0.8, 0.7, 0.54], warp * 0.5 + gr * 0.5); o.h = rip * 0.5 + gr * 0.2; o.ro = 0.9;
      });
    }],
    ["carpet", function () {
      TX.carpet = pbr(256, 2, function (u, v, o) {
        var n = pnXY(u * 128, v * 128, 128, 128, 231), m = pf(u, v, 8, 8, 3, 233), c = 0.82 + n * 0.14 + (m - 0.5) * 0.06;
        o.r = o.g = o.b = c; o.h = n; o.ro = 1;
      });
    }],
    ["water", function () { // wave normals only
      var W = []; for (var k = 0; k < 9; k++) W.push([Math.round((hash2i(k, 1, 241) - 0.5) * 12), Math.round((hash2i(k, 2, 241) - 0.5) * 12) + 1, hash2i(k, 3, 241) * 6.28, 1 / (1 + k * 0.5)]);
      TX.water = pbr(512, 4, function (u, v, o) {
        var h = 0; for (var k = 0; k < W.length; k++) h += Math.sin((W[k][0] * u + W[k][1] * v) * Math.PI * 2 + W[k][2]) * W[k][3];
        h = h * 0.12 + pf(u, v, 16, 16, 3, 243) * 0.3; o.h = h; o.r = o.g = o.b = 1; o.ro = 0.05;
      }, { noMap: true, noRough: true });
    }],
    ["bark", function () {
      TX.bark = pbr(512, 7, function (u, v, o) {
        var r = 0, amp = 0.5, f = 1;
        for (var k = 0; k < 4; k++) { var n = pnXY(u * 10 * f, v * 2 * f, 10 * f, 2 * f, 251 + k); r += amp * Math.pow(1 - Math.abs(n * 2 - 1), 3); amp *= 0.5; f *= 2; }
        var m = pf(u, v, 4, 4, 3, 257); mix3(o, [0.42, 0.3, 0.22], [0.24, 0.16, 0.11], 1 - r); o.r += (m - 0.5) * 0.06;
        o.h = r; o.ro = 0.92;
      });
    }],
    ["grass", function () { // lawn, moss and forest floor
      TX.grass = pbr(512, 3, function (u, v, o) {
        var b = pnXY(u * 256, v * 64, 256, 64, 261), m = pf(u, v, 6, 6, 4, 263), dry = smoothstep(0.55, 0.8, pf(u, v, 4, 4, 3, 265));
        mix3(o, [0.2, 0.33, 0.12], [0.35, 0.45, 0.18], b); o.r = lerp(o.r, 0.45, dry * 0.5); o.g = lerp(o.g, 0.4, dry * 0.5); o.b = lerp(o.b, 0.2, dry * 0.4);
        o.r *= 0.85 + m * 0.3; o.g *= 0.85 + m * 0.3; o.h = b * 0.6 + m * 0.4; o.ro = 0.9;
      });
    }],
    ["soil", function () {
      TX.soil = pbr(512, 4, function (u, v, o) {
        var w = worley(u, v, 40, 271), cl = smoothstep(0.1, 0.5, w[0]), m = pf(u, v, 8, 8, 4, 273);
        mix3(o, [0.3, 0.2, 0.14], [0.18, 0.12, 0.08], cl * 0.5 + m * 0.5); o.h = 1 - cl + m * 0.3; o.ro = 0.95;
      });
    }],
    ["solar", function () { // photovoltaic cells with silver busbars
      TX.solar = pbr(512, 1, function (u, v, o) {
        var N = 8, fu = frac(u * N), fv = frac(v * N), gap = Math.min(fu, 1 - fu, fv, 1 - fv) < 0.02;
        var bus = Math.abs(frac(fu * 3) - 0.5) > 0.485, fing = Math.abs(frac(fv * 40) - 0.5) > 0.47;
        var s = pnXY(u * 64, v * 64, 64, 64, 281);
        if (gap) { o.r = 0.8; o.g = 0.8; o.b = 0.82; o.ro = 0.4; } else if (bus) { o.r = 0.7; o.g = 0.72; o.b = 0.75; o.ro = 0.3; }
        else { o.r = 0.05 + s * 0.02; o.g = 0.08 + s * 0.03; o.b = 0.2 + s * 0.05; o.ro = fing ? 0.3 : 0.12; if (fing) { o.r += 0.08; o.g += 0.08; o.b += 0.08; } }
        o.h = gap ? 0.2 : 0.6;
      });
    }],
    ["tiles", function () { // hexagonal heat-shield tiles
      TX.tiles = pbr(512, 3, function (u, v, o) {
        var x = u * 16, y = v * 16 * 1.1547, r = y - Math.floor(y / 2) * 2; // cheap hex: offset rows
        var row = Math.floor(v * 18), ox = (row % 2) * 0.5, fu = frac(u * 16 + ox), fv = frac(v * 18);
        var d = Math.max(Math.abs(fu - 0.5) * 1.15 + Math.abs(fv - 0.5) * 0.6, Math.abs(fv - 0.5) * 1.2);
        var grout = smoothstep(0.52, 0.58, d), id = hash2i(Math.floor(u * 16 + ox), row, 291);
        var c = 0.06 + id * 0.04; o.r = o.g = o.b = c; o.r += grout * 0.1; o.g += grout * 0.1; o.b += grout * 0.1;
        o.h = 0.7 - grout * 0.5; o.ro = 0.55 + id * 0.2;
      });
    }],
    ["steelPlate", function () { // stainless hull with weld seams
      TX.steelPlate = pbr(512, 2, function (u, v, o) {
        var s = pnXY(u * 256, v * 4, 256, 4, 301), sv = frac(v * 4), su = frac(u * 3), seam = 1 - smoothstep(0.002, 0.006, Math.min(sv, 1 - sv, su, 1 - su));
        var m = pf(u, v, 4, 4, 3, 303), c = 0.86 - s * 0.06 - m * 0.05 - seam * 0.2; o.r = c; o.g = c; o.b = c * 1.01;
        o.h = 0.5 + s * 0.2 + seam * 0.3; o.ro = 0.22 + s * 0.1 + m * 0.1;
      });
    }],
    ["panel", function () { // painted composite skin with panel lines
      TX.panel = pbr(512, 2, function (u, v, o) {
        var fu = frac(u * 2), fv = frac(v * 4), line = 1 - smoothstep(0.0015, 0.004, Math.min(fu, 1 - fu, fv, 1 - fv));
        var m = pf(u, v, 8, 8, 3, 311), c = 0.93 - line * 0.35 + (m - 0.5) * 0.03; o.r = c; o.g = c; o.b = c;
        o.h = 0.6 - line * 0.5; o.ro = 0.3 + line * 0.3 + m * 0.08;
      });
    }]
  ];

  // books on shelves, for large library walls (albedo + relief)
  function bookWallTex() {
    var W = Math.round(1024 * TS), Hh = W, c = document.createElement("canvas"); c.width = W; c.height = Hh; var g = c.getContext("2d"), r = mulberry(77);
    var cols = ["#6b2320", "#23395b", "#2d4f37", "#b8a07a", "#3a3134", "#7a5a2a", "#4b2a44", "#1e2a2e", "#8a3a22", "#d8cdb4", "#5c1a1a", "#1f3b54"];
    g.fillStyle = "#3a2416"; g.fillRect(0, 0, W, Hh);
    var rows = 6, rh = Hh / rows;
    for (var rw = 0; rw < rows; rw++) {
      var y0 = rw * rh, x = 0;
      g.fillStyle = "#1b0f08"; g.fillRect(0, y0, W, rh);
      while (x < W) {
        var bw = W * (0.012 + r() * 0.018), bh = rh * (0.68 + r() * 0.26), col = cols[Math.floor(r() * cols.length)];
        if (r() < 0.05) { x += bw * 2; continue; }
        var grd = g.createLinearGradient(x, 0, x + bw, 0); grd.addColorStop(0, "rgba(0,0,0,0.45)"); grd.addColorStop(0.25, "rgba(0,0,0,0)"); grd.addColorStop(0.8, "rgba(0,0,0,0.05)"); grd.addColorStop(1, "rgba(0,0,0,0.5)");
        g.fillStyle = col; g.fillRect(x, y0 + rh * 0.92 - bh, bw, bh); g.fillStyle = grd; g.fillRect(x, y0 + rh * 0.92 - bh, bw, bh);
        if (r() < 0.7) { g.fillStyle = "rgba(214,178,104,0.85)"; g.fillRect(x + bw * 0.15, y0 + rh * 0.92 - bh * 0.85, bw * 0.7, Math.max(1, rh * 0.01)); g.fillRect(x + bw * 0.15, y0 + rh * 0.92 - bh * 0.2, bw * 0.7, Math.max(1, rh * 0.008)); g.fillRect(x + bw * 0.35, y0 + rh * 0.92 - bh * 0.7, bw * 0.3, bh * 0.35); }
        x += bw + 0.5;
      }
      g.fillStyle = "#5a3a22"; g.fillRect(0, y0 + rh * 0.92, W, rh * 0.08); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y0, W, rh * 0.06);
    }
    var t = mkTex(c, true); return t;
  }
  // leaf and frond cards with alpha, drawn once
  function leafCard(kind) {
    var S = Math.round(512 * Math.max(TS, 0.75)), c = document.createElement("canvas"); c.width = c.height = S; var g = c.getContext("2d"), r = mulberry(kind.length * 31 + 7);
    function leaf(x, y, len, wid, ang, col, col2) {
      g.save(); g.translate(x, y); g.rotate(ang);
      var gr = g.createLinearGradient(0, -wid, 0, wid); gr.addColorStop(0, col2); gr.addColorStop(0.5, col); gr.addColorStop(1, col2);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -wid, len, 0); g.quadraticCurveTo(len * 0.45, wid, 0, 0); g.fill();
      g.strokeStyle = "rgba(230,240,190,0.35)"; g.lineWidth = Math.max(1, wid * 0.08); g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.95, 0); g.stroke(); g.restore();
    }
    var greens = [["#3f6b2c", "#23401a"], ["#4f7d33", "#2b4a1c"], ["#5e8a3a", "#34521f"], ["#355f2a", "#1e3814"]];
    if (kind === "broad") {
      for (var i = 0; i < 70; i++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.36, gc = greens[Math.floor(r() * 4)]; leaf(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, S * (0.11 + r() * 0.06), S * (0.035 + r() * 0.015), r() * Math.PI * 2, gc[0], gc[1]); }
    } else if (kind === "conifer") {
      g.strokeStyle = "#3b2a1c"; g.lineWidth = S * 0.008; g.beginPath(); g.moveTo(S * 0.5, S * 0.98); g.lineTo(S * 0.5, S * 0.05); g.stroke();
      for (var j = 0; j < 26; j++) { var y = S * (0.1 + j * 0.034), L = S * (0.1 + (1 - Math.abs(j - 13) / 13) * 0.3); [-1, 1].forEach(function (s) { for (var k = 0; k < 18; k++) { var t = k / 18; g.strokeStyle = t < 0.5 ? "#2f4f2a" : "#3d6233"; g.lineWidth = Math.max(1, S * 0.004); g.beginPath(); g.moveTo(S / 2 + s * L * t, y + L * t * 0.25); g.lineTo(S / 2 + s * (L * t + S * 0.02), y + L * t * 0.25 - S * 0.03); g.stroke(); } }); }
    } else if (kind === "palm") {
      g.strokeStyle = "#6b6a3a"; g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(S * 0.02, S * 0.5); g.quadraticCurveTo(S * 0.5, S * 0.42, S * 0.98, S * 0.58); g.stroke();
      for (var p = 0; p < 46; p++) { var t2 = p / 46, px = S * (0.04 + t2 * 0.92), py = S * (0.5 - Math.sin(t2 * Math.PI) * 0.06 + t2 * 0.08), L2 = S * (0.24 * Math.sin(Math.PI * (0.15 + t2 * 0.8))); [-1, 1].forEach(function (s) { leaf(px, py, L2, S * 0.012, s * (1.2 + t2 * 0.3), "#4c7a33", "#2e4d1e"); }); }
    } else if (kind === "fern") {
      for (var q = 0; q < 7; q++) { var aa = -Math.PI / 2 + (q - 3) * 0.32, L3 = S * 0.45; g.save(); g.translate(S / 2, S * 0.98); g.rotate(aa + Math.PI / 2);
        for (var z = 0; z < 22; z++) { var tz = z / 22; [-1, 1].forEach(function (s) { leaf(0, -L3 * tz, S * 0.07 * (1 - tz * 0.7), S * 0.012, -Math.PI / 2 + s * 1.3, "#4a7a31", "#2c4c1c"); }); }
        g.restore(); }
    } else if (kind === "grass") {
      for (var b = 0; b < 140; b++) { var x0 = S * (0.1 + r() * 0.8), h = S * (0.4 + r() * 0.55), bend = (r() - 0.5) * S * 0.3; g.strokeStyle = r() < 0.2 ? "#8a8a4a" : (r() < 0.5 ? "#4f7a2e" : "#3d6524"); g.lineWidth = S * (0.004 + r() * 0.006);
        g.beginPath(); g.moveTo(x0, S); g.quadraticCurveTo(x0 + bend * 0.3, S - h * 0.6, x0 + bend, S - h); g.stroke(); }
    } else if (kind === "monstera") {
      for (var mm = 0; mm < 9; mm++) { var am = r() * Math.PI * 2, dm = r() * S * 0.22; g.save(); g.translate(S / 2 + Math.cos(am) * dm, S / 2 + Math.sin(am) * dm); g.rotate(r() * 6.28);
        var R = S * (0.14 + r() * 0.06); g.fillStyle = r() < 0.5 ? "#2f5e2a" : "#3b6d30"; g.beginPath(); g.ellipse(0, 0, R, R * 0.8, 0, 0, Math.PI * 2); g.fill();
        g.globalCompositeOperation = "destination-out"; for (var sl = 0; sl < 7; sl++) { var sa = -1.2 + sl * 0.4; g.beginPath(); g.moveTo(Math.cos(sa) * R * 0.35, Math.sin(sa) * R * 0.35); g.lineTo(Math.cos(sa) * R * 1.1, Math.sin(sa) * R * 1.1); g.lineWidth = R * 0.08; g.stroke(); }
        g.globalCompositeOperation = "source-over"; g.strokeStyle = "rgba(200,230,170,0.4)"; g.lineWidth = 2; g.beginPath(); g.moveTo(-R, 0); g.lineTo(R, 0); g.stroke(); g.restore(); }
    }
    var t = mkTex(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }
  var LEAFTEX = {};
