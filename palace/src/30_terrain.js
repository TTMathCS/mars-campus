  /* ==========================================================================================
     Terrain: the floor of Arcadia Planitia between the Crown (x = 0) and the spaceport (x = 30 km).
     One height function, written twice: GLSL for drawing and JS for placing things and keeping the
     pod clear of the ground. Features: gentle plain with polygon ground, the Dune Sea, a 3.2 km
     crater, the Ice Cliffs (a 100 m scarp of layered ice), small craters, and graded ground at the
     spaceport and under the Crown. Drawn with ten nested grids that follow the camera.
     ========================================================================================== */
  var FEAT = {
    crater: { x: 13800, z: -2300, r: 1600, depth: 290, rim: 55 },
    dunes: { x: 21300, z: -3300, rx: 4800, rz: 1900 },
    cliff: [[10900, 400], [9200, 1600], [7600, 2900], [5900, 4300]],
    port: { x: 30000, z: 0, r0: 1900, r1: 2700 },
    home: { r0: 170, r1: 420, garden: 112 },
    pit: { x: 29700, z: -1050, hx: 160, hz: 100, depth: 9 }   // the spaceport's ice mine, an open pit with benches
  };

  var GLSL_TERRAIN = [
    "const vec2 CR_C = vec2(" + FEAT.crater.x.toFixed(1) + ", " + FEAT.crater.z.toFixed(1) + "); const float CR_R = " + FEAT.crater.r.toFixed(1) + ";",
    "const vec2 DS_C = vec2(" + FEAT.dunes.x.toFixed(1) + ", " + FEAT.dunes.z.toFixed(1) + "); const vec2 DS_R = vec2(" + FEAT.dunes.rx.toFixed(1) + ", " + FEAT.dunes.rz.toFixed(1) + ");",
    "const vec2 CL0 = vec2(" + FEAT.cliff[0].join(".0, ") + ".0); const vec2 CL1 = vec2(" + FEAT.cliff[1].join(".0, ") + ".0); const vec2 CL2 = vec2(" + FEAT.cliff[2].join(".0, ") + ".0); const vec2 CL3 = vec2(" + FEAT.cliff[3].join(".0, ") + ".0);",
    "const vec2 PORT_C = vec2(" + FEAT.port.x.toFixed(1) + ", " + FEAT.port.z.toFixed(1) + ");",
    "const vec2 PIT_C = vec2(" + FEAT.pit.x.toFixed(1) + ", " + FEAT.pit.z.toFixed(1) + "); const vec2 PIT_H = vec2(" + FEAT.pit.hx.toFixed(1) + ", " + FEAT.pit.hz.toFixed(1) + ");",
    "float pitSD(vec2 p){ vec2 d = abs(p - PIT_C) - PIT_H; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }",
    "float pitDepth(vec2 p){ float d = pitSD(p); if (d > 0.0) return 0.0; float t = clamp(-d / 22.0, 0.0, 1.0); float dep = " + FEAT.pit.depth.toFixed(1) + " * t;",
    "  return 3.0 * floor(dep / 3.0) + 3.0 * smoothstep(0.62, 1.0, fract(dep / 3.0)); }",
    "float sminT(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }",
    // band-limited fbm: octaves shorter than about three grid spacings are left out
    "float fbmF(vec2 p, float lam0, float sp){ float s = 0.0, a = 0.5, lam = lam0; vec2 q = p / lam0;",
    "  for (int i = 0; i < 5; i++){ float w = clamp((lam / max(sp, 0.01) - 2.0) * 0.5, 0.0, 1.0); if (w <= 0.0) break; s += a * w * vnoise(q); q = mat2(1.6, 1.2, -1.2, 1.6) * q; a *= 0.5; lam *= 0.5; }",
    "  return s; }",
    "float craterP(float r, float depth, float rim){",
    "  float b = max(sminT(1.0 - r * r, 0.84, 0.08), 0.0);",
    "  float rimH = rim * exp(-pow((r - 1.0) / 0.12, 2.0));",
    "  float ej = rim * 0.35 * exp(-max(r - 1.0, 0.0) / 0.5) * smoothstep(0.96, 1.12, r);",
    "  return -depth * b + rimH + ej; }",
    "float duneMask(vec2 p){ vec2 q = (p - DS_C) / DS_R; return 1.0 - smoothstep(0.72, 1.0, length(q) + 0.12 * vnoise(p / 900.0)); }",
    "float dunesF(vec2 p, float sp){",
    "  float m = duneMask(p); if (m <= 0.0) return 0.0;",
    "  vec2 dir = vec2(0.93, 0.37);",
    "  float u = dot(p, dir) + 190.0 * vnoise(p / 1500.0 + 3.0) + 105.0 * vnoise(p / 520.0) + 38.0 * vnoise(p / 170.0);",
    "  float lam = 230.0 * (0.85 + 0.25 * vnoise(p / 2600.0 + 5.0)); float along = dot(p, vec2(-dir.y, dir.x));",
    "  float f = fract(u / lam); float prof = f < 0.78 ? f / 0.78 : (1.0 - f) / 0.22; prof = pow(prof, 1.25);",
    "  float crest = clamp(0.62 + 0.5 * vnoise(vec2(u / 520.0, along / 210.0)) + 0.25 * vnoise(vec2(u / 160.0, along / 85.0)), 0.12, 1.2);",
    "  float u3 = dot(p, vec2(0.80, 0.60)) + 30.0 * vnoise(p / 260.0 + 2.0); float f3 = fract(u3 / 47.0);",
    "  float prof3 = (f3 < 0.7 ? f3 / 0.7 : (1.0 - f3) / 0.3) * (1.0 - smoothstep(4.0, 12.0, sp)) * smoothstep(0.1, 0.6, vnoise(p / 380.0 + 9.0));",
    "  vec2 d2 = vec2(0.62, -0.78); float u2 = dot(p, d2) + 50.0 * vnoise(p / 400.0 + 7.0); float f2 = fract(u2 / 410.0);",
    "  float prof2 = f2 < 0.8 ? f2 / 0.8 : (1.0 - f2) / 0.2;",
    "  float h = 17.0 * prof * crest + 6.0 * prof2 + 2.2 * prof3 * (1.0 - prof * crest);",
    "  return mix(h, 8.5, smoothstep(20.0, 70.0, sp)) * m; }",
    // signed distance to the cliff line (positive on the low, south-east side) and position along it
    "void cliffSD(vec2 p, out float s, out float T, out vec2 nn){",
    "  s = 0.0; T = 0.0; nn = vec2(0.0, 1.0); float best = 1e9;",
    "  for (int i = 0; i < 3; i++){",
    "    vec2 a = i == 0 ? CL0 : (i == 1 ? CL1 : CL2); vec2 b = i == 0 ? CL1 : (i == 1 ? CL2 : CL3);",
    "    vec2 ab = b - a; float L2 = dot(ab, ab); float tr = dot(p - a, ab) / L2; float t = clamp(tr, 0.0, 1.0);",
    "    float d = length(p - (a + ab * t));",
    "    if (d < best){ best = d; vec2 n = normalize(vec2(ab.y, -ab.x)); s = dot(p - a, n); T = (float(i) + tr) / 3.0; nn = n; }",
    "  } }",
    // the scarp: 86 % of the drop on a face about 60 m wide (wider where the grid is coarse), the rest on the apron.
    // Returns the drop and its slope across the face.
    "vec2 cliffDrop(vec2 p, float s, float T, float sp){",
    "  float ht = 100.0 * (0.82 + 0.18 * vnoise(vec2(T * 9.0, 1.7)));",
    "  float sx = s + 4.0 * vnoise(p / 60.0), w = max(30.0, 3.0 * sp);",
    "  float t1 = clamp((sx - 12.0 + w) / (2.0 * w), 0.0, 1.0), t2 = clamp((sx - 20.0) / 130.0, 0.0, 1.0);",
    "  float f = (1.0 - smoothstep(1800.0, 5200.0, s)) * smoothstep(-0.10, 0.03, T) * (1.0 - smoothstep(0.97, 1.10, T));",
    "  float drop = ht * (0.86 * t1 * t1 * (3.0 - 2.0 * t1) + 0.14 * t2 * t2 * (3.0 - 2.0 * t2)) * f;",
    "  float slope = ht * (0.86 * 3.0 * t1 * (1.0 - t1) / w + 0.14 * 6.0 * t2 * (1.0 - t2) / 130.0) * f;",
    "  return vec2(drop, slope); }",
    "float cliffH(vec2 p, float sp){ float s, T; vec2 nn; cliffSD(p, s, T, nn); if (s < -150.0) return 0.0; return -cliffDrop(p, s, T, sp).x; }",
    "float smallCraters(vec2 p, float sp){",
    "  vec2 cell = floor(p / 700.0); float h = hash12(cell + 71.3); if (h < 0.62) return 0.0;",
    "  float R = 14.0 + 90.0 * pow(hash12(cell + 5.1), 2.2); if (R < sp * 1.5) return 0.0;",
    "  vec2 c = (cell + 0.25 + 0.5 * hash22(cell + 3.7)) * 700.0;",
    "  float r = length(p - c) / R; if (r > 1.8) return 0.0;",
    "  return craterP(r, 0.2 * R, 0.05 * R); }",
    "float terrainH(vec2 p, float sp){",
    "  float h = 4.5 * fbmF(p, 2600.0, sp) + 1.3 * fbmF(p + 331.0, 210.0, sp);",
    "  float rc = length(p - CR_C) / CR_R;",
    "  if (rc < 2.6){ h += craterP(rc, 290.0, 55.0) + 6.0 * fbmF(p + 71.0, 260.0, sp) * smoothstep(1.6, 0.9, rc) * smoothstep(0.5, 0.95, rc);",
    // concentric crater fill: ice-rich ridges on the floor, about 70 m apart
    "    float fm = 1.0 - smoothstep(0.30, 0.52, rc); if (fm > 0.0 && sp < 40.0){ float rr = rc + 0.012 * vnoise(p / 90.0) + 0.006 * vnoise(p / 31.0);",
    "      h += fm * (1.0 - smoothstep(14.0, 40.0, sp)) * (2.6 * sin(rr * 6.2832 / 0.044) + 1.4 * sin(rr * 6.2832 / 0.019 + 1.3) * (1.0 - smoothstep(6.0, 20.0, sp))) + fm * 9.0 * fbmF(p + 13.0, 330.0, sp); } }",
    "  float dm = duneMask(p);",
    "  h += smallCraters(p, sp) * (1.0 - dm) * smoothstep(1.3, 1.6, rc);",
    "  h += dunesF(p, sp);",
    "  h += cliffH(p, sp);",
    "  float dp = length(p - PORT_C); float wp = 1.0 - smoothstep(" + FEAT.port.r0.toFixed(1) + ", " + FEAT.port.r1.toFixed(1) + ", dp);",
    "  h = mix(h, 0.25 * vnoise(p / 60.0), wp);",
    "  h -= pitDepth(p);",
    "  float dh = length(p); float wh = 1.0 - smoothstep(" + FEAT.home.r0.toFixed(1) + ", " + FEAT.home.r1.toFixed(1) + ", dh);",
    "  float bowl = -1.4 * max(0.0, 1.0 - dh * dh / " + (FEAT.home.garden * FEAT.home.garden).toFixed(1) + ");",
    "  h = mix(h, bowl, wh);",
    "  return h; }"
  ].join("\n");

  /* ------------------------------------------------------------------ the same height in JS */
  var TER = (function () {
    function hash12(x, y) {
      var p3x = fract(x * 0.1031), p3y = fract(y * 0.1031), p3z = fract(x * 0.1031);
      var d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
      p3x += d; p3y += d; p3z += d;
      return fract((p3x + p3y) * p3z);
    }
    function hash22(x, y) {
      var p3x = fract(x * 0.1031), p3y = fract(y * 0.1030), p3z = fract(x * 0.0973);
      var d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
      p3x += d; p3y += d; p3z += d;
      return [fract((p3x + p3y) * p3z), fract((p3x + p3z) * p3y)];
    }
    function vnoise(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      var a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
      return (lerp(lerp(a, b, ux), lerp(c, d, ux), uy)) * 2 - 1;
    }
    function fbmF(x, y, lam0, sp) {
      var s = 0, a = 0.5, lam = lam0, qx = x / lam0, qy = y / lam0;
      for (var i = 0; i < 5; i++) {
        var w = clamp((lam / Math.max(sp, 0.01) - 2) * 0.5, 0, 1); if (w <= 0) break;
        s += a * w * vnoise(qx, qy);
        var nx = 1.6 * qx - 1.2 * qy, ny = 1.2 * qx + 1.6 * qy; qx = nx; qy = ny; a *= 0.5; lam *= 0.5;
      }
      return s;
    }
    function smin(a, b, k) { var h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); }
    function craterP(r, depth, rim) {
      var b = Math.max(smin(1 - r * r, 0.84, 0.08), 0);
      var rimH = rim * Math.exp(-Math.pow((r - 1) / 0.12, 2));
      var ej = rim * 0.35 * Math.exp(-Math.max(r - 1, 0) / 0.5) * smooth(0.96, 1.12, r);
      return -depth * b + rimH + ej;
    }
    var C = FEAT.crater, DS = FEAT.dunes, CL = FEAT.cliff, PT = FEAT.port, HM = FEAT.home;
    function duneMask(x, z) { var qx = (x - DS.x) / DS.rx, qz = (z - DS.z) / DS.rz; return 1 - smooth(0.72, 1, Math.sqrt(qx * qx + qz * qz) + 0.12 * vnoise(x / 900, z / 900)); }
    function dunesF(x, z, sp) {
      var m = duneMask(x, z); if (m <= 0) return 0;
      var u = x * 0.93 + z * 0.37 + 190 * vnoise(x / 1500 + 3, z / 1500 + 3) + 105 * vnoise(x / 520, z / 520) + 38 * vnoise(x / 170, z / 170);
      var lam = 230 * (0.85 + 0.25 * vnoise(x / 2600 + 5, z / 2600 + 5)), along = x * -0.37 + z * 0.93;
      var f = fract(u / lam), prof = f < 0.78 ? f / 0.78 : (1 - f) / 0.22; prof = Math.pow(prof, 1.25);
      var crest = clamp(0.62 + 0.5 * vnoise(u / 520, along / 210) + 0.25 * vnoise(u / 160, along / 85), 0.12, 1.2);
      var u3 = x * 0.80 + z * 0.60 + 30 * vnoise(x / 260 + 2, z / 260 + 2), f3 = fract(u3 / 47);
      var prof3 = (f3 < 0.7 ? f3 / 0.7 : (1 - f3) / 0.3) * (1 - smooth(4, 12, sp)) * smooth(0.1, 0.6, vnoise(x / 380 + 9, z / 380 + 9));
      var u2 = x * 0.62 - z * 0.78 + 50 * vnoise(x / 400 + 7, z / 400 + 7), f2 = fract(u2 / 410);
      var prof2 = f2 < 0.8 ? f2 / 0.8 : (1 - f2) / 0.2;
      var h = 17 * prof * crest + 6 * prof2 + 2.2 * prof3 * (1 - prof * crest);
      return lerp(h, 8.5, smooth(20, 70, sp)) * m;
    }
    function cliffSD(x, z) {
      var best = 1e9, s = 0, T = 0;
      for (var i = 0; i < 3; i++) {
        var ax = CL[i][0], az = CL[i][1], abx = CL[i + 1][0] - ax, abz = CL[i + 1][1] - az, L2 = abx * abx + abz * abz;
        var tr = ((x - ax) * abx + (z - az) * abz) / L2, t = clamp(tr, 0, 1);
        var dx = x - (ax + abx * t), dz = z - (az + abz * t), d = Math.sqrt(dx * dx + dz * dz);
        if (d < best) { best = d; var L = Math.sqrt(L2), nx = abz / L, nz = -abx / L; s = (x - ax) * nx + (z - az) * nz; T = (i + tr) / 3; }
      }
      return [s, T];
    }
    function cliffH(x, z, sp) {
      var sd = cliffSD(x, z), s = sd[0], T = sd[1];
      if (s < -150) return 0;
      var ht = 100 * (0.82 + 0.18 * vnoise(T * 9, 1.7)), sx = s + 4 * vnoise(x / 60, z / 60), w = Math.max(30, 3 * sp);
      var drop = ht * (0.86 * smooth(12 - w, 12 + w, sx) + 0.14 * smooth(20, 150, sx));
      drop *= 1 - smooth(1800, 5200, s);
      drop *= smooth(-0.10, 0.03, T) * (1 - smooth(0.97, 1.10, T));
      return -drop;
    }
    var PI_ = FEAT.pit;
    function pitDepth(x, z) {
      var dx = Math.abs(x - PI_.x) - PI_.hx, dz = Math.abs(z - PI_.z) - PI_.hz;
      var d = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
      if (d > 0) return 0;
      var dep = PI_.depth * clamp(-d / 22, 0, 1);
      return 3 * Math.floor(dep / 3) + 3 * smooth(0.62, 1, fract(dep / 3));
    }
    function smallCraters(x, z, sp) {
      var cx = Math.floor(x / 700), cz = Math.floor(z / 700);
      if (hash12(cx + 71.3, cz + 71.3) < 0.62) return 0;
      var R = 14 + 90 * Math.pow(hash12(cx + 5.1, cz + 5.1), 2.2); if (R < sp * 1.5) return 0;
      var o = hash22(cx + 3.7, cz + 3.7), px = (cx + 0.25 + 0.5 * o[0]) * 700, pz = (cz + 0.25 + 0.5 * o[1]) * 700;
      var r = Math.sqrt((x - px) * (x - px) + (z - pz) * (z - pz)) / R; if (r > 1.8) return 0;
      return craterP(r, 0.2 * R, 0.05 * R);
    }
    function h(x, z, sp) {
      sp = sp || 0;
      var v = 4.5 * fbmF(x, z, 2600, sp) + 1.3 * fbmF(x + 331, z + 331, 210, sp);
      var rc = Math.sqrt((x - C.x) * (x - C.x) + (z - C.z) * (z - C.z)) / C.r;
      if (rc < 2.6) {
        v += craterP(rc, C.depth, C.rim) + 6 * fbmF(x + 71, z + 71, 260, sp) * smooth(1.6, 0.9, rc) * smooth(0.5, 0.95, rc);
        var fm = 1 - smooth(0.30, 0.52, rc);
        if (fm > 0 && sp < 40) {
          var rr = rc + 0.012 * vnoise(x / 90, z / 90) + 0.006 * vnoise(x / 31, z / 31);
          v += fm * (1 - smooth(14, 40, sp)) * (2.6 * Math.sin(rr * 6.2832 / 0.044) + 1.4 * Math.sin(rr * 6.2832 / 0.019 + 1.3) * (1 - smooth(6, 20, sp))) + fm * 9 * fbmF(x + 13, z + 13, 330, sp);
        }
      }
      var dm = duneMask(x, z);
      v += smallCraters(x, z, sp) * (1 - dm) * smooth(1.3, 1.6, rc);
      v += dunesF(x, z, sp);
      v += cliffH(x, z, sp);
      var dp = Math.sqrt((x - PT.x) * (x - PT.x) + (z - PT.z) * (z - PT.z)), wp = 1 - smooth(PT.r0, PT.r1, dp);
      v = lerp(v, 0.25 * vnoise(x / 60, z / 60), wp);
      v -= pitDepth(x, z);
      var dh = Math.sqrt(x * x + z * z), wh = 1 - smooth(HM.r0, HM.r1, dh), bowl = -1.4 * Math.max(0, 1 - dh * dh / (HM.garden * HM.garden));
      return lerp(v, bowl, wh);
    }
    return { h: h, vnoise: vnoise, hash12: hash12, duneMask: duneMask, cliffSD: cliffSD };
  })();

  /* ------------------------------------------------------------------ nested grids that follow the camera */
  var TERRAIN = (function () {
    var N = 64, LEVELS = 10, S0 = 2.0;
    // one grid shared by every level: (2N+1)^2 vertices in grid units, plus a skirt round the edge
    var idx = [], pos = [], sk = [];
    for (var j = -N; j <= N; j++) for (var i = -N; i <= N; i++) { pos.push(i, j); sk.push(0); }
    var W = 2 * N + 1;
    for (var j2 = 0; j2 < 2 * N; j2++) for (var i2 = 0; i2 < 2 * N; i2++) {
      var a = j2 * W + i2, b = a + 1, c = a + W, d = c + 1;
      if ((i2 + j2) & 1) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
    }
    // skirt: walk the border once, hang a copy of each border vertex below it
    var border = [];
    for (var t = -N; t < N; t++) border.push([t, -N]);
    for (t = -N; t < N; t++) border.push([N, t]);
    for (t = N; t > -N; t--) border.push([t, N]);
    for (t = N; t > -N; t--) border.push([-N, t]);
    var base = pos.length / 2;
    border.forEach(function (q) { pos.push(q[0], q[1]); sk.push(1); });
    for (var k = 0; k < border.length; k++) {
      var q0 = border[k], q1 = border[(k + 1) % border.length];
      var t0 = (q0[1] + N) * W + (q0[0] + N), t1 = (q1[1] + N) * W + (q1[0] + N), s0 = base + k, s1 = base + (k + 1) % border.length;
      idx.push(t0, s0, t1, t1, s0, s1);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 2 * 3), 3));
    geo.setAttribute("grid", new THREE.Float32BufferAttribute(pos, 2));
    geo.setAttribute("skirt", new THREE.Float32BufferAttribute(sk, 1));
    geo.setIndex(idx);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);

    var VS = [
      GLSL_COMMON, GLSL_TERRAIN, LOGV_PARS,
      "attribute vec2 grid; attribute float skirt;",
      "uniform vec2 uC; uniform float uS; uniform float uN; uniform float uLevel;",
      "varying vec3 vW; varying vec3 vN; varying float vSh; varying float vSp; varying float vDist; varying float vMorph;",
      "void main(){",
      "  vec2 p = uC + grid * uS;",
      // geomorph towards the next coarser grid in the outer quarter of the level
      "  vec2 dc = abs(p - uCam.xz) / (uN * uS);",
      "  float m = smoothstep(0.62, 0.86, max(dc.x, dc.y));",
      "  vec2 fr = fract(grid * 0.5) * 2.0;",
      "  p -= fr * uS * m;",
      "  float sp = uS * (1.0 + m);",
      "  float h = terrainH(p, sp);",
      "  float e = max(sp, 1.0);",
      "  float hx = terrainH(p + vec2(e, 0.0), sp), hz = terrainH(p + vec2(0.0, e), sp);",
      "  vN = normalize(vec3(h - hx, e, h - hz));",
      // soft sun shadow from the terrain itself: march towards the sun
      "  float vis = 1.0;",
      "  if (uLevel < 8.5 && uSunDir.y > -0.02){",
      "    vec2 sd = normalize(uSunDir.xz + 1e-6); float tanE = uSunDir.y / max(length(uSunDir.xz), 1e-4);",
      "    float dist = 14.0;",
      "    for (int i = 0; i < 11; i++){",
      "      vec2 q = p + sd * dist; float ray = h + 1.5 + dist * tanE;",
      "      float th = terrainH(q, max(sp, dist * 0.12));",
      "      vis = min(vis, clamp((ray - th) / (dist * 0.035 + 1.0) + 0.5, 0.0, 1.0));",
      "      dist *= 1.63;",
      "    }",
      "  }",
      "  vSh = vis; vSp = sp; vMorph = m;",
      "  vec3 w = vec3(p.x, h - skirt * (6.0 + uS * 4.0), p.y);",
      "  vW = w;",
      "  vec3 wc = curveW(w);",
      "  vDist = length(w - uCam);",
      "  gl_Position = projectionMatrix * viewMatrix * vec4(wc, 1.0);",
      "  " + LOGV,
      "}"].join("\n");

    var FS = [
      GLSL_COMMON, GLSL_TERRAIN, GLSL_SHADOW, LOGF_PARS,
      "uniform vec4 uInner; uniform float uLevel; uniform float uDbg; uniform float uAG;",
      "varying vec3 vW; varying vec3 vN; varying float vSh; varying float vSp; varying float vDist; varying float vMorph;",
      // cracked polygon ground of ice-rich plains: distance to the nearest cell edge
      "vec3 polyEdge(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec2 r1 = vec2(0.0), r2 = vec2(0.0);",
      "  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){ vec2 g = vec2(float(x), float(y)); vec2 o = hash22(i + g) * 0.8 + 0.1; vec2 r = g + o - f; float d = dot(r, r);",
      "    if (d < d1){ d2 = d1; r2 = r1; d1 = d; r1 = r; } else if (d < d2){ d2 = d; r2 = r; } }",
      "  float a = sqrt(d1), b = sqrt(d2);",
      "  return vec3(b - a, r1 / max(a, 1e-4) - r2 / max(b, 1e-4)); }",
      "void main(){",
      "  if (uInner.z > 0.0){ vec2 dq = abs(vW.xz - uInner.xy); if (max(dq.x, dq.y) < uInner.z) discard; }",
      "  vec3 n = normalize(vN);",
      "  float dist = vDist;",
      "  float near = 1.0 - smoothstep(80.0, 1400.0, dist), mid = 1.0 - smoothstep(600.0, 9000.0, dist);",
      // detail bumps: small stones and ripples, faded with distance
      "  vec2 pw = vW.xz;",
      "  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);",
      "  vec2 q1 = rot * pw / 6.5; float b0 = vnoise(q1), bx = vnoise(q1 + vec2(0.12, 0.0)), bz = vnoise(q1 + vec2(0.0, 0.12));",
      "  vec2 g1 = rot * vec2(bx - b0, bz - b0) / 0.12 * 0.07;",
      "  vec2 q2 = rot * rot * pw / 1.7 + 17.0; float c0 = vnoise(q2), cx = vnoise(q2 + vec2(0.15, 0.0)), cz = vnoise(q2 + vec2(0.0, 0.15));",
      "  vec2 g2 = rot * rot * vec2(cx - c0, cz - c0) / 0.15 * 0.06;",
      // scattered stones on the plain, a few per square metre near the camera
      "  vec2 sc = floor(pw / 2.3); vec2 so = hash22(sc + 41.0); float sr = 0.10 + 0.55 * pow(hash12(sc + 9.0), 3.0);",
      "  vec2 sdv = pw - (sc + 0.2 + 0.6 * so) * 2.3; float sdist = length(sdv);",
      "  float rockField = smoothstep(-0.2, 0.5, vnoise(pw / 55.0 + 3.0));",
      "  float graded0 = max(1.0 - smoothstep(" + FEAT.port.r0.toFixed(1) + ", " + FEAT.port.r1.toFixed(1) + ", length(pw - PORT_C)), 1.0 - smoothstep(" + FEAT.home.r0.toFixed(1) + ", " + FEAT.home.r1.toFixed(1) + ", length(pw)));",
      "  float stone = step(0.72 - 0.3 * rockField, hash12(sc + 2.0)) * (1.0 - smoothstep(sr * 0.75, sr, sdist)) * (1.0 - smoothstep(40.0, 160.0, dist)) * (1.0 - graded0);",
      "  float sz = sdist / max(sr, 1e-3); vec2 gst = -sdv / max(sdist, 1e-3) * stone * clamp(sz / sqrt(max(1.0 - sz * sz, 0.05)), 0.0, 1.6) * 0.32;",
      // rolled gravel on the graded ground: small pebbles, packed, lighter and darker
      "  vec2 pc = floor(pw / 0.35); vec2 po = hash22(pc + 13.0); float pr = 0.03 + 0.05 * hash12(pc + 4.0); vec2 pdv = pw - (pc + 0.2 + 0.6 * po) * 0.35; float pdist = length(pdv);",
      "  float peb = step(0.35, hash12(pc + 8.0)) * (1.0 - smoothstep(pr * 0.7, pr, pdist)) * graded0 * (1.0 - smoothstep(6.0, 45.0, dist));",
      "  float grit = (vnoise(pw * 3.1) * 0.5 + vnoise(pw * 7.3 + 3.0) * 0.3) * graded0 * (1.0 - smoothstep(4.0, 30.0, dist));",
      "  float dm = duneMask(pw);",
      "  float rip = sin(dot(pw, vec2(0.93, 0.37)) * 6.2832 / 1.4 + vnoise(pw / 6.0) * 3.0);",
      "  float ripF = 1.0 - smoothstep(12.0, 70.0, dist);",
      "  vec2 gr = vec2(0.93, 0.37) * cos(dot(pw, vec2(0.93, 0.37)) * 6.2832 / 1.4 + vnoise(pw / 6.0) * 3.0) * 0.35 * dm * ripF;",
      "  vec2 gd = (g1 * (1.0 - dm * 0.7) + g2 * (1.0 - dm) * (1.0 - smoothstep(30.0, 260.0, dist))) * near + gr + gst * (1.0 - dm);",
      "  n = normalize(n + vec3(-gd.x, 0.0, -gd.y) * 0.55);",
      "  float slope = 1.0 - n.y, bslope = 1.0 - normalize(vN).y;",
      // albedo: regolith, bright dust on flats, darker rock on slopes, dark basalt sand in the dunes
      "  vec2 wq = pw / 1500.0; wq += vec2(vnoise(wq * 1.7 + 3.1), vnoise(wq * 1.7 + 9.4)) * 0.55;",
      "  float big = vnoise(wq) * 0.55 + vnoise(rot * wq * 3.3 + 2.0) * 0.28 + vnoise(rot * rot * pw / 75.0 + 3.0) * 0.17;",
      "  vec3 reg = mix(vec3(0.245, 0.152, 0.100), vec3(0.335, 0.218, 0.143), smoothstep(-0.75, 0.75, big));",
      "  reg *= 0.9 + 0.1 * smoothstep(-0.4, 0.6, vnoise(pw / 2600.0 + 11.0));",
      // dust devil tracks: long thin dark curves, seen best from above
      "  float trk = 0.0;",
      "  for (int k = 0; k < 3; k++){",
      "    float sc = 480.0 + 230.0 * float(k); vec2 q = pw / sc + vec2(float(k) * 7.3, float(k) * 3.1);",
      "    q += vec2(vnoise(q * 0.6 + 1.3), vnoise(q * 0.6 + 8.1)) * 0.7;",
      "    float f = vnoise(q) + 0.45 * vnoise(q * 2.3 + 4.0);",
      "    float fw = fwidth(f) + 1e-5, e = 0.012 + 0.008 * float(k);",
      "    float ln = (1.0 - smoothstep(e * 0.4, e + fw, abs(f))) * min(1.0, e / fw);",
      "    trk = max(trk, ln * smoothstep(-0.2, 0.45, vnoise(pw / 1700.0 + float(k) * 5.0)));",
      "  }",
      "  reg *= 1.0 - 0.22 * trk;",
      // bright dust on the flats: rotated, warped noise so the patches don't line up with the axes
      "  vec2 wdir = vec2(0.93, 0.37); vec2 dq = vec2(dot(pw, wdir) / 520.0, dot(pw, vec2(-wdir.y, wdir.x)) / 170.0); dq += vec2(vnoise(dq * 0.4 + 1.7), vnoise(dq * 0.4 + 6.3)) * 0.6;",
      "  float dust = vnoise(dq + 5.0) * 0.6 + vnoise(dq * 2.3 + 2.0) * 0.28 + vnoise(rot * pw / 60.0 + 4.0) * 0.12;",
      "  reg = mix(reg, vec3(0.37, 0.255, 0.175), smoothstep(-0.3, 0.8, dust) * (1.0 - smoothstep(0.02, 0.12, bslope)) * 0.34);",
      "  vec3 rock = vec3(0.155, 0.112, 0.090) * (0.8 + 0.4 * (vnoise(pw / 7.0) * 0.5 + 0.5));",
      "  vec3 alb = mix(reg, rock, smoothstep(0.18, 0.45, bslope));",
      "  vec3 sand = mix(vec3(0.105, 0.088, 0.078), vec3(0.16, 0.115, 0.088), 0.5 + 0.5 * vnoise(pw / 90.0));",
      "  alb = mix(alb, sand, dm * (0.9 + 0.1 * rip * ripF));",
      "  alb = mix(alb, vec3(0.20, 0.15, 0.12) * (0.85 + 0.3 * hash12(sc + 6.0)), stone * (1.0 - dm) * 0.7);",
      "  alb = mix(alb, alb * (0.85 + 0.3 * hash12(pc + 1.0)), peb * 0.6); alb *= 1.0 + 0.08 * grit;",
      // polygon ground on the open plain
      "  float psz = 15.0;",
      "  vec3 pe3 = polyEdge(pw / psz + vec2(vnoise(pw / 37.0), vnoise(pw / 37.0 + 9.0)) * 0.45 + vec2(vnoise(pw / 11.0 + 2.0), vnoise(pw / 11.0 + 5.0)) * 0.10 + vec2(vnoise(pw / 230.0 + 4.0), vnoise(pw / 230.0 + 1.0)) * 0.8); float pe = pe3.x;",
      "  float graded = max(1.0 - smoothstep(" + FEAT.port.r0.toFixed(1) + ", " + FEAT.port.r1.toFixed(1) + ", length(pw - PORT_C)), 1.0 - smoothstep(" + FEAT.home.r0.toFixed(1) + ", " + FEAT.home.r1.toFixed(1) + ", length(pw)));",
      "  float polyA = (1.0 - dm) * (1.0 - smoothstep(0.08, 0.2, bslope)) * (0.25 + 0.5 * smoothstep(-0.3, 0.4, vnoise(pw / 150.0))) * (1.0 - 0.85 * graded);",
      "  float crack = (1.0 - smoothstep(0.02, 0.13, pe)) * polyA * (1.0 - smoothstep(180.0, 900.0, dist));",
      "  float tq = clamp(pe / 0.16, 0.0, 1.0); vec2 gtr = pe3.yz * (6.0 * tq * (1.0 - tq) / 0.16) * 0.05 * (0.5 + 0.5 * smoothstep(-0.4, 0.5, vnoise(pw / 23.0 + 6.0))) / psz * polyA * (1.0 - smoothstep(90.0, 600.0, dist));",
      "  n = normalize(n + vec3(-gtr.x, 0.0, -gtr.y));",
      "  alb *= 1.0 - 0.035 * crack;",
      // the crater: frost on its cold floor and in the shade of its walls
      "  float rc = length(pw - CR_C) / CR_R;",
      "  float frost = (1.0 - smoothstep(0.55, 0.8, rc)) * smoothstep(-150.0, -215.0, vW.y);",
      "  float fpat = smoothstep(-0.7, 0.9, vnoise(rot * pw / 55.0 + 2.0) + 0.45 * vnoise(rot * rot * pw / 17.0 + 7.0) + 0.2 * vnoise(rot * pw / 6.0));",
      "  float shadeF = (1.0 - smoothstep(0.0, 0.85, vSh)) * smoothstep(-0.2, 0.6, vnoise(pw / 260.0 + 3.0));",
      "  frost = max(frost * (0.55 + 0.45 * fpat), shadeF * (1.0 - smoothstep(0.85, 1.0, rc)) * 0.22 * fpat);",
      "  frost *= smoothstep(1.02, 0.9, rc);",
      "  alb = mix(alb, vec3(0.56, 0.54, 0.52), clamp(frost, 0.0, 1.0) * 0.7);",
      // the Ice Cliffs: layers of clean and dusty ice on the steep scarp
      "  float cs, cT; vec2 cn; cliffSD(pw, cs, cT, cn);",
      "  vec2 cd = cs > -150.0 ? cliffDrop(pw, cs, cT, vSp) : vec2(0.0);",
      "  float cliff = smoothstep(0.45, 1.0, cd.y) * smoothstep(3.0, 12.0, cd.x);",
      "  vec3 ice = vec3(0.0); float streak = 0.0;",
      "  if (cd.y > 0.05){",
      "    vec2 tg = vec2(-cn.y, cn.x); float along = dot(pw, tg);",
      "    vec3 nC = normalize(vec3(cd.y * cn.x, 1.0, cd.y * cn.y));",
      "    float fl = vnoise(vec2(along / 6.0, vW.y / 30.0)) + 0.35 * vnoise(vec2(along / 2.2, vW.y / 12.0));",
      "    float fl2 = vnoise(vec2((along + 0.6) / 6.0, vW.y / 30.0)) + 0.35 * vnoise(vec2((along + 0.6) / 2.2, vW.y / 12.0));",
      "    vec3 tg3 = vec3(tg.x, 0.0, tg.y);",
      "    nC = normalize(nC + tg3 * (fl2 - fl) / 0.6 * 0.3 * cliff);",
      "    n = normalize(mix(n, nC, smoothstep(0.12, 0.5, cd.y)));",
      "    float ly = vW.y + 2.2 * vnoise(vec2(along / 90.0, vW.y / 35.0)) + 0.6 * vnoise(vec2(along / 14.0, 3.0));",
      "    float b1 = fract(ly / 5.3), b2 = fract(ly / 1.9 + 0.3), b3 = fract(ly / 13.0);",
      "    float big2 = vnoise(vec2(along / 160.0, 2.0)) * 0.6 + vnoise(vec2(along / 45.0, vW.y / 60.0)) * 0.4;",
      "    ice = mix(vec3(0.46, 0.58, 0.68), vec3(0.74, 0.82, 0.88), smoothstep(0.2, 0.5, b1) * (1.0 - smoothstep(0.7, 0.95, b1)) * (0.6 + 0.4 * big2));",
      "    ice *= 0.94 + 0.06 * smoothstep(0.3, 0.6, b2);",
      // dust washed down the face in streaks
      "    float streak = smoothstep(0.25, 0.8, vnoise(vec2(along / 4.5, vW.y / 70.0 + 5.0))) * (0.4 + 0.6 * smoothstep(-0.2, 0.5, big2));",
      "    ice = mix(ice, vec3(0.34, 0.28, 0.24), 0.55 * streak);",
      "    ice = mix(ice, vec3(0.40, 0.36, 0.34), 0.55 * smoothstep(0.86, 0.9, b3) * (1.0 - smoothstep(0.95, 0.99, b3)));",
      "    ice = mix(ice, vec3(0.30, 0.22, 0.17), 0.7 * (1.0 - smoothstep(10.0, 18.0, cd.x)));",
      "    alb = mix(alb, ice, cliff);",
      "  }",
      // the ice mine: dirty ice on the floor and benches, tyre tracks
      "  float pd = pitSD(pw);",
      "  if (pd < 2.0){",
      "    float pin = 1.0 - smoothstep(-4.0, 1.0, pd);",
      "    vec3 dice = mix(vec3(0.40, 0.42, 0.44), vec3(0.62, 0.66, 0.70), smoothstep(-0.3, 0.6, vnoise(pw / 9.0)));",
      "    float track = smoothstep(0.6, 0.9, abs(sin(dot(pw, vec2(0.8, 0.6)) * 1.9))) * smoothstep(0.2, 0.6, vnoise(pw / 25.0));",
      "    dice *= 1.0 - 0.25 * track;",
      "    alb = mix(alb, dice, pin * (0.55 + 0.45 * smoothstep(-5.0, -8.5, vW.y)));",
      "  }",
      // the Stone Garden under the Crown: raked rings round the Sun Well
      "  float rh = length(pw); float gard = 1.0 - smoothstep(108.0, 114.0, rh);",
      "  float rfw = clamp(1.0 - fwidth(rh / 0.9) * 1.5, 0.0, 1.0); float rake = sin(rh * 6.2832 / 0.9) * rfw;",
      "  alb = mix(alb, vec3(0.34, 0.25, 0.185) * (0.92 + 0.08 * rake), gard);",
      "  n = normalize(n + vec3(pw.x / max(rh, 1.0), 0.0, pw.y / max(rh, 1.0)) * cos(rh * 6.2832 / 0.9) * 0.12 * gard * near * rfw);",
      // light
      "  float ndl = max(dot(n, uSunDir), 0.0);",
      "  float back = 0.18 * pow(max(0.0, dot(normalize(uCam - vW), uSunDir)), 3.0);",
      "  float sh = vSh * shadowAt(vW, 0.004);",
      "  vec3 amb = mix(uAmbHor, uAmbUp, n.y * 0.5 + 0.5) * (1.0 - 0.35 * crack) * (0.75 + 0.25 * vSh);",
      "  vec3 col = alb * (uSunCol * (ndl * (1.0 + back)) * sh + amb * 0.85);",
      "  if (cliff > 0.01){",
      "    col += cliff * vec3(0.04, 0.11, 0.22) * (uAmbUp + uAmbHor) * (0.8 + 0.6 * (1.0 - sh)) * (1.0 - 0.6 * streak);",
      "    vec3 vv = normalize(vW - uCam); vec3 rv = reflect(vv, n); rv.y = abs(rv.y);",
      "    float fr = 0.04 + 0.5 * pow(1.0 - max(dot(-vv, n), 0.0), 5.0);",
      "    col += skyColor(rv) * fr * cliff * 0.45 * (1.0 - 0.7 * streak);",
      "  }",
      "  float spec = pow(max(dot(reflect(-uSunDir, n), normalize(uCam - vW)), 0.0), 60.0) * (cliff * 0.5 + frost * 0.08);",
      "  col += uSunCol * spec * sh;",
      // the anti-gravity fields under the Crown's five spires: slow rings of pale light on the ground
      "  if (uAG > 0.0 && dot(pw, pw) < 40000.0){",
      "    for (int k = 0; k < 5; k++){",
      "      float b = (18.0 + 72.0 * float(k)) * 0.0174533; vec2 c = vec2(sin(b), -cos(b)) * 130.0; float d = length(pw - c);",
      "      if (d < 40.0){ float ph = fract(d / 9.0 - uTime * 0.12); float ring = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.08, 0.35, ph));",
      "        col += vec3(0.30, 0.46, 1.0) * (ring * 0.5 + 0.25 * exp(-d / 6.0)) * (1.0 - smoothstep(20.0, 38.0, d)) * uAG * 0.35; }",
      "    }",
      "  }",
      "  col = haze(col, vW);",
      "  if (rc < 1.05){",
      "    float fogH = smoothstep(-120.0, -245.0, vW.y) * (1.0 - smoothstep(0.75, 1.02, rc));",
      "    float fogN = 0.6 + 0.4 * vnoise(pw / 160.0 + uTime * 0.01);",
      "    vec3 fogC = vec3(0.60, 0.62, 0.66) * (uAmbUp + uAmbHor) * 0.9 + uSunCol * 0.05;",
      "    col = mix(col, fogC, fogH * fogN * 0.55 * smoothstep(80.0, 600.0, dist));",
      "  }",
      "  if (uDbg > 0.5) col = vec3(fract(uLevel * 0.37), fract(uLevel * 0.61 + 0.3), fract(uLevel * 0.83 + 0.6)) * (0.4 + 0.6 * ndl) + vec3(vMorph, 0.0, 0.0) * 0.5;",
      "  gl_FragColor = vec4(col, 1.0);",
      "  " + LOGF,
      "}"].join("\n");

    var levels = [], DBGU = { value: 0 }, AGU = { value: 1 };
    for (var L = 0; L < LEVELS; L++) {
      var u = sharedUniforms({ uC: { value: new THREE.Vector2() }, uS: { value: S0 * Math.pow(2, L) }, uN: { value: N }, uLevel: { value: L }, uInner: { value: new THREE.Vector4(0, 0, 0, 0) }, uDbg: DBGU, uAG: AGU });
      var mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, extensions: { derivatives: true } });
      var mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
      scene.add(mesh); levels.push(mesh);
    }
    function update(cam) {
      for (var L = 0; L < LEVELS; L++) {
        var u = levels[L].material.uniforms, s = u.uS.value, g = 2 * s;
        u.uC.value.set(Math.round(cam.x / g) * g, Math.round(cam.z / g) * g);
        if (L > 0) { var ui = levels[L - 1].material.uniforms; u.uInner.value.set(ui.uC.value.x, ui.uC.value.y, (N - 1.5) * ui.uS.value, 0); }
      }
    }
    return { levels: levels, update: update, S0: S0, N: N, dbg: DBGU, ag: AGU };
  })();
