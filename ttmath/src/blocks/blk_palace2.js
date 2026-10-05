  /* ===================== The Math Palace ===================== */
  // Built from real materials: Carrara, Giallo Siena, Verde Alpi and Nero Marquina marble, polished brass inlay and fittings,
  // painted steel ribs. Light from about a hundred fittings is baked per vertex with ambient occlusion and shadows.
  var palMesh = null, palGlassB = null, palGlassF = null, palPend = null, palMob = null, palSolids = [], palAnimHidden = [], palTexReady = false, palB = null;
  var PEND = { L: 23.75, A: 0.092, T: 15.9 }, NLAN = 12;
  function addF2(g, a, b) { var n = g.attributes.position.count, arr = new Float32Array(n * 2); for (var i = 0; i < n; i++) { arr[i * 2] = a; arr[i * 2 + 1] = b; } g.setAttribute("aFac2", new THREE.BufferAttribute(arr, 2)); return g; }
  // tube along points (parallel-transport frames, analytic normals)
  function tubeAlong(Bd, pts, rad, nside, mat, g2x) {
    var N = pts.length - 1, tg = new THREE.Vector3(), a = null, frames = [];
    for (var i = 0; i <= N; i++) {
      tg.subVectors(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      if (!a) { a = new THREE.Vector3(0, 1, 0); if (Math.abs(tg.y) > 0.9) a.set(1, 0, 0); a.sub(tg.clone().multiplyScalar(a.dot(tg))).normalize(); }
      else { a.sub(tg.clone().multiplyScalar(a.dot(tg))); if (a.lengthSq() < 1e-8) a.set(1, 0, 0); a.normalize(); }
      frames.push([a.clone(), new THREE.Vector3().crossVectors(tg, a).normalize()]);
    }
    Bd.surf(N, nside, function (i, j, q) {
      var ang = j / nside * 2 * Math.PI, fr = frames[i], c = Math.cos(ang), s = Math.sin(ang), rr = typeof rad === "function" ? rad(i / N) : rad;
      var nx = fr[0].x * c + fr[1].x * s, ny = fr[0].y * c + fr[1].y * s, nz = fr[0].z * c + fr[1].z * s, p = pts[i];
      q.p[0] = p.x + nx * rr; q.p[1] = p.y + ny * rr; q.p[2] = p.z + nz * rr; q.nn = [nx, ny, nz]; q.f[0] = i; q.f[1] = j; q.f2[0] = g2x || 0; q.m = mat;
    }, false, true);
  }
  // solid of revolution around a vertical axis: prof = [[r, y], ...] bottom to top
  function latheAt(Bd, cx, cy, cz, prof, NA, mat, g2y, g2x) {
    Bd.surf(NA, prof.length - 1, function (i, j, q) {
      var th = i / NA * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th), pr = prof[j];
      var j0 = Math.max(0, j - 1), j1 = Math.min(prof.length - 1, j + 1), dr = prof[j1][0] - prof[j0][0], dy = prof[j1][1] - prof[j0][1], l = Math.hypot(dr, dy) || 1;
      q.p[0] = cx + c * pr[0]; q.p[1] = cy + pr[1]; q.p[2] = cz + s * pr[0]; q.nn = [c * dy / l, -dr / l, s * dy / l]; q.f[0] = th; q.f[1] = pr[1]; q.f2[0] = g2x === undefined ? 99 : g2x; q.f2[1] = g2y || 0; q.m = mat;
    }, true);
  }
  function buildPalace() {
    var yB = PALY.B, yF = PALY.F, P = new Builder(), lights = palLights, TAU = Math.PI * 2, WARM = [1.0, 0.8, 0.58], COOL = [1.0, 0.95, 0.88], WHITE = [1, 0.96, 0.9];
    P.zone = ZONE.ROT; palB = P;
    matU.uPalA.value.set(PAL.c.x, PAL.c.z, PAL.F.x, PAL.F.z); matU.uPalB.value.set(yB, yF, PAL.pitR, 0);
    matU.uPortal.value.set(vaultW(26) + PAL.vt + 0.03, vaultH(26) + 0.58, 0, 0);
    matU.uLinkA.value.set(LINK.w + 0.05, LINK.h + 0.08, LINK.pl, 0);
    function light(x, y, z, c, k, range, dir, lobe) { lights.push({ x: x, y: y, z: z, c: [c[0] * k, c[1] * k, c[2] * k], r: range, d: dir || null, lobe: lobe || 0 }); }
    var RUNS = [[8.95, 15.7], [24.3, 174.375], [185.625, 335.7], [344.3, 351.05]].map(function (c) { return [c[0] * D2R, c[1] * D2R]; });
    function nearOpening(th, pad) { var a = Math.abs(Math.atan2(Math.sin(th), Math.cos(th))) * R2D; return a < 8.95 + pad || Math.abs(a - 20) < 4.3 + pad; }
    function glyphUV(gi) { var A = ATL.glyph, u0 = A[0] + (A[2] - A[0]) * (gi + 0.06) / GLYPH_N, u1 = A[0] + (A[2] - A[0]) * (gi + 0.94) / GLYPH_N, v0 = lerp(A[1], A[3], 0.02), v1 = lerp(A[1], A[3], 0.98); return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; }
    function V3(r, th, y) { var p = palPol(r, th); return new THREE.Vector3(p.x, y, p.z); }
    function inward(th) { var d = palPol(1, th); return [PAL.c.x - d.x, 0, PAL.c.z - d.z]; }            // unit vector toward the axis
    function tangent(th) { return [Math.cos(th) * PAL.Rt.x - Math.sin(th) * PAL.F.x, 0, Math.cos(th) * PAL.Rt.z - Math.sin(th) * PAL.F.z]; }   // direction of growing th
    function yawTo(p) { return Math.atan2(PAL.c.x - p.x, PAL.c.z - p.z); }
    // vertical band on a circle, facing the axis; th0..th1 in radians
    function band(r, y0, y1, mat, nv, th0, th1, g2, NA) {
      var a0 = th0 === undefined ? 0 : th0, a1 = th1 === undefined ? TAU : th1, na = NA || Math.max(8, Math.round(Math.abs(a1 - a0) / TAU * 360));
      P.surf(na, nv || 1, function (i, j, q) { var th = lerp(a0, a1, i / na), p = palPol(r, th), y = lerp(y0, y1, j / (nv || 1)); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = inward(th); q.f[0] = th * r; q.f[1] = y; if (g2) { q.f2[0] = g2[0]; q.f2[1] = g2[1]; } q.m = mat; });
    }
    function flatRing(r0, r1, y, mat, nr, th0, th1, up, kind) {   // horizontal annulus
      var a0 = th0 === undefined ? 0 : th0, a1 = th1 === undefined ? TAU : th1, na = Math.max(8, Math.round(Math.abs(a1 - a0) / TAU * 360));
      P.surf(na, nr || 1, function (i, j, q) { var th = lerp(a0, a1, i / na), r = lerp(r0, r1, j / (nr || 1)), p = palPol(r, th); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, up === false ? -1 : 1, 0]; q.f[0] = r; q.f[1] = th * 23; if (kind !== undefined) q.f2[1] = kind; q.m = mat; });
    }
    function boxAt(r, th, y0, y1, w, d, mat, g2) { var p = palPol(r, th), g = new THREE.BoxGeometry(w, y1 - y0, d); if (g2) addF2(g, g2[0], g2[1]); P.geo(g, T(p.x, (y0 + y1) / 2, p.z, 0, yawTo(p), 0), mat, 1); }
    function quad(c0, c1, c2, c3, nrm, mat, uv, g2) {   // corners counter-clockwise from bottom-left; uv = [[u,v] x4]
      P.surf(1, 1, function (i, j, q) { var c = j ? (i ? c2 : c3) : (i ? c1 : c0), t = uv[j ? (i ? 2 : 3) : (i ? 1 : 0)]; q.p[0] = c.x; q.p[1] = c.y; q.p[2] = c.z; q.nn = nrm; q.f[0] = t[0]; q.f[1] = t[1]; if (g2) { q.f2[0] = g2[0]; q.f2[1] = g2[1]; } q.m = mat; });
    }

    // ---- rotunda floor and the exhibit wall ----
    P.surf(360, 60, function (i, j, q) { var th = i / 360 * TAU, r = 0.03 + (PAL.pitR - 0.03) * Math.pow(j / 60, 0.8), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yF; q.p[2] = p.z; q.nn = [0, 1, 0]; q.m = MT.ROTFLOOR; }, true);
    band(PAL.pitR, yF, yB - 0.35, MT.MARBLE, 40, 0, TAU, [98, 2]);
    band(PAL.pitR - 0.04, yF, yF + 0.9, MT.MARBLE, 3, 0, TAU, [98, 1]);          // dark green dado
    band(PAL.pitR - 0.05, yF + 0.9, yF + 0.96, MT.BRASS);
    band(PAL.pitR - 0.06, yF + 0.02, yF + 0.05, MT.LIGHT, 1, 0, TAU, [0.7, 0]);   // light line along the foot of the wall
    // cornice under the frieze and a gold lip under the pi ring
    band(PAL.pitR - 0.16, yF + 8.3, yF + 8.46, MT.BRASS);
    flatRing(PAL.pitR - 0.16, PAL.pitR, yF + 8.46, MT.BRASS, 1);
    flatRing(PAL.pitR - 0.16, PAL.pitR, yF + 8.3, MT.BRASS, 1, 0, TAU, false);
    band(PAL.pitR - 0.03, yB - 1.05, yB - 0.35, MT.MARBLE, 2, 0, TAU, [99, 3]);
    band(PAL.pitR - 0.05, yB - 0.35, yB - 0.29, MT.BRASS);
    band(PAL.pitR - 0.02, yB - 0.29, yB + 0.001, MT.MARBLE);
    // equation frieze: 8 strips, text runs the way a visitor facing the wall reads
    for (var k = 0; k < 8; k++) (function (k) {
      P.surf(48, 1, function (i, j, q) { var th = (k + 1 - i / 48) * TAU / 8, p = palPol(PAL.pitR - 0.05, th), y = yF + 7.5 + 0.8 * j; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = inward(th); q.f[0] = i / 48; q.f[1] = j; q.m = MT.FRIEZE; });
    })(k);
    // ring of pi: 465 digits, starting at the back of the rotunda, opposite the entrance
    var digits = "π=" + piDigits(470), ND = 465, dth = TAU / ND;
    for (k = 0; k < ND; k++) {
      var gi = GLYPHS.indexOf(digits[k]); if (gi < 0) gi = 13;
      var tha = Math.PI - k * dth, thb = tha - dth * 0.92, ya = yB - 0.95, yb = yB - 0.45, rP = PAL.pitR - 0.06;
      quad(V3(rP, tha, ya), V3(rP, thb, ya), V3(rP, thb, yb), V3(rP, tha, yb), inward(tha - dth / 2), MT.ATLAS, glyphUV(gi), [0, 1]);
    }
    // twelve exhibit panels between gold-capped pilasters on the back half of the wall
    var PANEL_ORDER = [1, 3, 4, 10, 5, 0, 2, 9, 8, 7, 6, 11], PW = 4.4, PH = 2.933, py0 = yF + 1.35, pd = 21.95;
    for (k = 0; k < 12; k++) {
      var thc = (106.667 + k * 13.333) * D2R, idx = PANEL_ORDER[k], col = idx % 4, row = Math.floor(idx / 4);
      var cc = palPol(pd, thc), tg = tangent(thc), rt = [-tg[0], -tg[2]];   // viewer's right when facing the wall
      var pL = new THREE.Vector3(cc.x - rt[0] * PW / 2, 0, cc.z - rt[1] * PW / 2), pR = new THREE.Vector3(cc.x + rt[0] * PW / 2, 0, cc.z + rt[1] * PW / 2);
      var u0 = col / 4, u1 = (col + 1) / 4, v0 = 1 - (row + 1) / 3, v1 = 1 - row / 3;
      quad(new THREE.Vector3(pL.x, py0, pL.z), new THREE.Vector3(pR.x, py0, pR.z), new THREE.Vector3(pR.x, py0 + PH, pR.z), new THREE.Vector3(pL.x, py0 + PH, pL.z), inward(thc), MT.EXHIBIT, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
      var fy = T(cc.x, 0, cc.z, 0, yawTo(cc), 0), fr = [[0, py0 - 0.05, PW + 0.2, 0.1], [0, py0 + PH + 0.05, PW + 0.2, 0.1], [-PW / 2 - 0.05, py0 + PH / 2, 0.1, PH + 0.2], [PW / 2 + 0.05, py0 + PH / 2, 0.1, PH + 0.2]];
      fr.forEach(function (b) { P.geo(new THREE.BoxGeometry(b[2], b[3], 0.1), new THREE.Matrix4().multiplyMatrices(fy, T(b[0], b[1], 0.02)), MT.BRASS, 1); });
      var lw = palPol(20.2, thc); light(lw.x, py0 + PH + 0.9, lw.z, COOL, 1.0, 7, [-inward(thc)[0] * 0.6, -0.8, -inward(thc)[2] * 0.6], 1);
    }
    // a glowing symbol in a gold medallion above each panel
    var SYM = "e\u221a\u03c6\u03c07z\u03a3\u221e15ng";
    for (k = 0; k < 12; k++) {
      var thm = (106.667 + k * 13.333) * D2R, cm = palPol(PAL.pitR - 0.07, thm), tgm = tangent(thm), rm = [-tgm[0], -tgm[2]], ym = yF + 5.65, gs = GLYPHS.indexOf(SYM[PANEL_ORDER[k]]);
      P.surf(24, 1, function (i, j, q) { var a2 = i / 24 * TAU, rr2 = j * 0.56, x = cm.x + rm[0] * Math.cos(a2) * rr2, z = cm.z + rm[1] * Math.cos(a2) * rr2; q.p[0] = x; q.p[1] = ym + Math.sin(a2) * rr2; q.p[2] = z; q.nn = inward(thm); q.f2[1] = 3; q.m = MT.MARBLE; }, true);
      var mr = []; for (var i2 = 0; i2 <= 32; i2++) { var a3 = i2 / 32 * TAU; mr.push(new THREE.Vector3(cm.x + rm[0] * Math.cos(a3) * 0.58 - inward(thm)[0] * 0.02, ym + Math.sin(a3) * 0.58, cm.z + rm[1] * Math.cos(a3) * 0.58 - inward(thm)[2] * 0.02)); }
      tubeAlong(P, mr, 0.05, 6, MT.BRASS);
      var gc = { x: cm.x + inward(thm)[0] * 0.03, z: cm.z + inward(thm)[2] * 0.03 }, hw = 0.3, hh = 0.6;
      quad(new THREE.Vector3(gc.x - rm[0] * hw, ym - hh, gc.z - rm[1] * hw), new THREE.Vector3(gc.x + rm[0] * hw, ym - hh, gc.z + rm[1] * hw), new THREE.Vector3(gc.x + rm[0] * hw, ym + hh, gc.z + rm[1] * hw), new THREE.Vector3(gc.x - rm[0] * hw, ym + hh, gc.z - rm[1] * hw),
        inward(thm), MT.ATLAS, glyphUV(gs), [0, 1]);
    }
    var PIL = []; for (k = 0; k <= 12; k++) PIL.push(100 + k * 13.333);
    for (k = 20; k <= 90; k += 10) { PIL.push(k); PIL.push(-k); }
    PIL.forEach(function (a) {
      var th = a * D2R;
      boxAt(PAL.pitR - 0.09, th, yF + 0.9, yF + 7.0, 0.5, 0.18, MT.MARBLE, [99, 0]);
      boxAt(PAL.pitR - 0.13, th, yF + 7.0, yF + 7.42, 0.64, 0.26, MT.BRASS);
      boxAt(PAL.pitR - 0.11, th, yF, yF + 0.9, 0.62, 0.22, MT.MARBLE, [99, 1]);
    });
    // the TTMath logo under the entrance
    (function () {
      var d0 = 21.95, W = 7.2, y0 = yF + 3.3, y1 = yF + 5.55, a = palXZ(3.6, d0), b = palXZ(-3.6, d0), ly0 = yF + 3.43, n = [-PAL.F.x, 0, -PAL.F.z];
      quad(new THREE.Vector3(a.x, y0, a.z), new THREE.Vector3(b.x, y0, b.z), new THREE.Vector3(b.x, y1, b.z), new THREE.Vector3(a.x, y1, a.z), n, MT.LOGO,
        [[(-3.6 + 3.2) / 6.4, (y0 - ly0) / 2], [(3.6 + 3.2) / 6.4, (y0 - ly0) / 2], [(3.6 + 3.2) / 6.4, (y1 - ly0) / 2], [(-3.6 + 3.2) / 6.4, (y1 - ly0) / 2]]);
      var c0 = palXZ(0, d0), fy = T(c0.x, 0, c0.z, 0, yawTo(c0), 0);
      [[0, y0 - 0.06, W + 0.24, 0.12], [0, y1 + 0.06, W + 0.24, 0.12], [-W / 2 - 0.06, (y0 + y1) / 2, 0.12, y1 - y0 + 0.24], [W / 2 + 0.06, (y0 + y1) / 2, 0.12, y1 - y0 + 0.24]].forEach(function (b2) {
        P.geo(new THREE.BoxGeometry(b2[2], b2[3], 0.1), new THREE.Matrix4().multiplyMatrices(fy, T(b2[0], b2[1], 0.02)), MT.BRASS, 1);
      });
      var lp = palXZ(0, 20.4); light(lp.x, yF + 4.4, lp.z, [0.92, 0.95, 1.0], 1.2, 9);
    })();

    // ---- balcony ring, pit-edge balustrade, ring beam inner face ----
    flatRing(PAL.pitR, PAL.ringIn, yB, MT.BALSTONE, 16);
    RUNS.forEach(function (r) { band(PAL.ringIn, yB, yB + PAL.beam, MT.MARBLE, 2, r[0], r[1], [98, 4]); flatRing(PAL.ringIn, PAL.ringIn + 0.3, yB + PAL.beam, MT.MARBLE, 1, r[0], r[1]); });
    function balustrade(a0, a1) {                 // classic balusters on the pit edge between angles a0..a1 (radians)
      var rB = 22.33, len = Math.abs(a1 - a0) * rB, nb = Math.max(2, Math.round(len / 0.3));
      for (var i = 0; i <= nb; i++) {
        var th = lerp(a0, a1, i / nb), p = palPol(rB, th);
        latheAt(P, p.x, yB + 0.08, p.z, [[0.068, 0], [0.068, 0.06], [0.045, 0.1], [0.04, 0.26], [0.066, 0.42], [0.07, 0.5], [0.042, 0.62], [0.036, 0.68], [0.056, 0.72], [0.056, 0.8]], 8, MT.MARBLE);
      }
      var sp = function (r0, r1, y0, y1, mat) {   // rail with a rectangular section
        var na = Math.max(4, Math.round(len / 0.5));
        [[r0, y1, r1, y1, [0, 1, 0]], [r1, y0, r0, y0, [0, -1, 0]]].forEach(function (f) {
          P.surf(na, 1, function (i, j, q) { var th = lerp(a0, a1, i / na), r = j ? f[2] : f[0], p = palPol(r, th); q.p[0] = p.x; q.p[1] = j ? f[3] : f[1]; q.p[2] = p.z; q.nn = f[4]; q.f[0] = th * 23; q.f[1] = j; q.m = mat; });
        });
        [[r0, 1], [r1, -1]].forEach(function (f) {
          P.surf(na, 1, function (i, j, q) { var th = lerp(a0, a1, i / na), p = palPol(f[0], th), iw = inward(th); q.p[0] = p.x; q.p[1] = j ? y1 : y0; q.p[2] = p.z; q.nn = [iw[0] * f[1], 0, iw[2] * f[1]]; q.f[0] = th * 23; q.f[1] = j; q.m = mat; });
        });
      };
      sp(rB - 0.12, rB + 0.12, yB, yB + 0.08, MT.MARBLE);
      sp(rB - 0.11, rB + 0.11, yB + 0.88, yB + 0.98, MT.MARBLE);
      var rail = [], nr = Math.max(4, Math.round(len / 0.5)); for (i = 0; i <= nr; i++) rail.push(V3(rB, lerp(a0, a1, i / nr), yB + 1.02));
      tubeAlong(P, rail, 0.035, 8, MT.BRASS);
    }
    balustrade(PAL.stairTop * D2R, TAU - PAL.stairTop * D2R);
    balustrade(-PAL.landA * D2R, PAL.landA * D2R);

    // ---- the two grand stairs, cantilevered from the wall ----
    var NST = 56, rise = PAL.depth / NST, dA = (PAL.stairBot - PAL.stairTop) / NST;
    function walkY(a) { return palStairY(a); }                  // a in degrees
    [1, -1].forEach(function (sg) {
      var A = function (deg) { return sg * deg * D2R; };
      // top landing
      P.surf(6, 4, function (i, j, q) { var th = A(lerp(PAL.landA, PAL.stairTop, j / 4)), r = lerp(PAL.stairIn, PAL.pitR, i / 6), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yB; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = r; q.f[1] = th * 23; q.m = MT.BALSTONE; });
      P.surf(6, 4, function (i, j, q) { var th = A(lerp(PAL.landA, PAL.stairTop, j / 4)), r = lerp(PAL.stairIn, PAL.pitR, i / 6), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yB - 0.4; q.p[2] = p.z; q.nn = [0, -1, 0]; q.m = MT.MARBLE; });
      band(PAL.stairIn, yB - 0.4, yB, MT.MARBLE, 1, A(PAL.landA), A(PAL.stairTop), null, 6);
      [PAL.landA, PAL.stairTop].forEach(function (deg) { var th = A(deg), tgv = tangent(th), s2 = deg === PAL.landA ? -sg : sg;
        P.surf(6, 1, function (i, j, q) { var r = lerp(PAL.stairIn, PAL.pitR, i / 6), p = palPol(r, th); q.p[0] = p.x; q.p[1] = j ? yB : yB - 0.4; q.p[2] = p.z; q.nn = [tgv[0] * s2, 0, tgv[2] * s2]; q.m = MT.MARBLE; }); });
      for (var k = 0; k < NST - 1; k++) {
        var a0 = A(PAL.stairTop + k * dA), a1 = A(PAL.stairTop + (k + 1) * dA), yt = yB - (k + 1) * rise, yb2 = yt - 0.16, tg1 = tangent(a1);
        P.surf(4, 1, function (i, j, q) { var th = lerp(a0, a1, j), r = lerp(PAL.stairIn, PAL.pitR, i / 4), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yt; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = r; q.f[1] = (1 - j) * dA * D2R * 20.8; q.m = MT.STEP; });
        P.surf(4, 1, function (i, j, q) { var r = lerp(PAL.stairIn, PAL.pitR, i / 4), p = palPol(r, a1); q.p[0] = p.x; q.p[1] = j ? yt : yb2; q.p[2] = p.z; q.nn = [tg1[0] * sg, 0, tg1[2] * sg]; q.m = MT.MARBLE; });
        P.surf(4, 1, function (i, j, q) { var th = lerp(a0, a1, j), r = lerp(PAL.stairIn, PAL.pitR, i / 4), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yb2; q.p[2] = p.z; q.nn = [0, -1, 0]; q.m = MT.MARBLE; });
        var iw0 = inward(a0);
        P.surf(1, 1, function (i, j, q) { var th = i ? a1 : a0, p = palPol(PAL.stairIn, th); q.p[0] = p.x; q.p[1] = j ? yt : yb2; q.p[2] = p.z; q.nn = iw0; q.m = MT.MARBLE; });
        var ls = a1 - sg * 0.12 / 20.8;          // light strip under the nosing
        P.surf(4, 1, function (i, j, q) { var th = j ? ls : a1, r = lerp(PAL.stairIn + 0.1, PAL.pitR - 0.1, i / 4), p = palPol(r, th); q.p[0] = p.x; q.p[1] = yb2 - 0.004; q.p[2] = p.z; q.nn = [0, -1, 0]; q.f2[0] = 1.1; q.f2[1] = 0; q.m = MT.LIGHT; });
      }
      // gold stringer along the open side, handrails, posts
      var NS = 80;
      P.surf(NS, 1, function (i, j, q) { var deg = lerp(PAL.stairTop, PAL.stairBot, i / NS), th = A(deg), p = palPol(PAL.stairIn - 0.03, th), y = walkY(deg); q.p[0] = p.x; q.p[1] = j ? y + 0.04 : y - 0.42; q.p[2] = p.z; q.nn = inward(th); q.m = MT.BRASS; });
      var rail = [], low = [], wallR = [];
      [[PAL.pitR - 0.02, PAL.landA], [PAL.stairIn + 0.05, PAL.landA]].forEach(function (c) { rail.push(V3(c[0], A(c[1]), yB + 1.0)); });
      for (var i = 0; i <= NS; i++) { var deg = lerp(PAL.landA, PAL.stairBot + 1.5, i / NS), y = walkY(clamp(deg, PAL.stairTop, PAL.stairBot)); rail.push(V3(PAL.stairIn + 0.05, A(deg), y + 1.0)); low.push(V3(PAL.stairIn + 0.05, A(deg), y + 0.5)); }
      for (i = 0; i <= NS; i++) { deg = lerp(PAL.stairTop + 0.5, PAL.stairBot, i / NS); wallR.push(V3(PAL.pitR - 0.12, A(deg), walkY(deg) + 0.9)); }
      tubeAlong(P, rail, 0.04, 8, MT.BRASS); tubeAlong(P, low, 0.022, 6, MT.BRASS); tubeAlong(P, wallR, 0.03, 6, MT.BRASS);
      for (i = 0; i <= 18; i++) { deg = lerp(PAL.landA + 0.4, PAL.stairBot + 1.2, i / 18); var yy = walkY(clamp(deg, PAL.stairTop, PAL.stairBot)); tubeAlong(P, [V3(PAL.stairIn + 0.05, A(deg), yy - 0.05), V3(PAL.stairIn + 0.05, A(deg), yy + 1.0)], 0.025, 6, MT.BRASS); }
      [0.35, 0.65, 0.95].forEach(function (t) { var c = V3(PAL.stairIn + 0.05, A(PAL.landA), yB); tubeAlong(P, [V3(lerp(PAL.stairIn + 0.05, PAL.pitR - 0.02, t), A(PAL.landA), yB), V3(lerp(PAL.stairIn + 0.05, PAL.pitR - 0.02, t), A(PAL.landA), yB + 1.0)], 0.025, 6, MT.BRASS); });
      for (i = 0; i < 8; i++) { deg = lerp(PAL.stairTop + 4, PAL.stairBot - 3, i / 7); var lp = palPol(20.8, A(deg)); light(lp.x, walkY(deg) + 0.35, lp.z, WARM, 0.8, 5.5); }
    });

    // ---- pedestals with the five Platonic solids, the pendulum rail ----
    var SOLIDS = palSolidDefs();
    for (k = 0; k < 5; k++) {
      var th = (36 + 72 * k) * D2R, pc = palPol(PAL.pedR, th);
      latheAt(P, pc.x, yF, pc.z, [[0.9, 0], [0.9, 0.12], [0.76, 0.15], [0.76, 0.2], [0.58, 0.25], [0.55, 0.9], [0.63, 0.95], [0.76, 1.0], [0.8, 1.06], [0.8, 1.12], [0.4, 1.12], [0.0, 1.12]], 32, MT.MARBLE, 3);
      latheAt(P, pc.x, yF + 0.2, pc.z, [[0.585, 0], [0.62, 0.025], [0.585, 0.05]], 32, MT.BRASS);
      latheAt(P, pc.x, yF + 1.121, pc.z, [[0.36, 0], [0.0, 0.0]], 16, MT.LIGHT, 0, 1.2);
      // plaque on the shaft, facing the wall
      var out = [-inward(th)[0], -inward(th)[2]], right = [out[1], -out[0]];   // a visitor facing the pedestal looks along -out
      var c1 = new THREE.Vector3(pc.x + out[0] * 0.6, 0, pc.z + out[1] * 0.6);
      quad(new THREE.Vector3(c1.x - right[0] * 0.45, yF + 0.42, c1.z - right[1] * 0.45), new THREE.Vector3(c1.x + right[0] * 0.45, yF + 0.42, c1.z + right[1] * 0.45),
        new THREE.Vector3(c1.x + right[0] * 0.45, yF + 0.84, c1.z + right[1] * 0.45), new THREE.Vector3(c1.x - right[0] * 0.45, yF + 0.84, c1.z - right[1] * 0.45),
        [out[0], 0, out[1]], MT.ATLAS, (function () { var A = ATL.plaque, u0 = lerp(A[0], A[2], k / 5 + 0.003), u1 = lerp(A[0], A[2], (k + 1) / 5 - 0.003), v0 = lerp(A[1], A[3], 0.02), v1 = lerp(A[1], A[3], 0.98); return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; })(), [0, 0]);
      light(pc.x, yF + 3.6, pc.z, WHITE, 2.4, 6.5);
      light(pc.x, yF + 1.3, pc.z, WARM, 0.5, 3, [0, 1, 0], 2);
    }
    // curved marble benches between the pedestals
    for (k = 0; k < 5; k++) {
      var tb = 72 * k * D2R, b0 = tb - PAL.benchA * D2R, b1 = tb + PAL.benchA * D2R, rI = PAL.benchR - 0.3, rO = PAL.benchR + 0.3, ys = yF + 0.45;
      flatRing(rI, rO, ys, MT.MARBLE, 2, b0, b1, true, 4);
      flatRing(rI, rO, ys - 0.09, MT.MARBLE, 1, b0, b1, false, 4);
      band(rI, ys - 0.09, ys, MT.MARBLE, 1, b0, b1, [99, 4], 24);
      band(rO, ys - 0.09, ys, MT.MARBLE, 1, b0, b1, [99, 4], 24);
      [b0, b1].forEach(function (a) { var tgb = tangent(a), sgn = a === b0 ? -1 : 1; P.surf(1, 1, function (i, j, q) { var pp = palPol(i ? rO : rI, a); q.p[0] = pp.x; q.p[1] = j ? ys : ys - 0.09; q.p[2] = pp.z; q.nn = [tgb[0] * sgn, 0, tgb[2] * sgn]; q.f2[1] = 4; q.m = MT.MARBLE; }); });
      [b0 + 0.02, tb, b1 - 0.02].forEach(function (a) { boxAt(PAL.benchR, a, yF, ys - 0.09, 0.08, 0.44, MT.BRASS); });
    }
    for (k = 0; k < 16; k++) { var tp = V3(4.0, k / 16 * TAU, yF); tubeAlong(P, [tp, new THREE.Vector3(tp.x, yF + 0.95, tp.z)], 0.03, 6, MT.BRASS); }
    var railC = []; for (k = 0; k <= 64; k++) railC.push(V3(4.0, k / 64 * TAU, yF + 0.95)); tubeAlong(P, railC, 0.035, 8, MT.BRASS);

    // ---- lanterns, oculus crown, uplights ----
    var ico = new THREE.IcosahedronGeometry(0.5, 0), icoP = ico.attributes.position, iv = [];
    for (k = 0; k < icoP.count; k++) { var vv = new THREE.Vector3().fromBufferAttribute(icoP, k); if (!iv.some(function (u) { return u.distanceTo(vv) < 1e-4; })) iv.push(vv); }
    var icoEdges = []; for (var a = 0; a < iv.length; a++) for (var b = a + 1; b < iv.length; b++) if (iv[a].distanceTo(iv[b]) < 0.55) icoEdges.push([a, b]);
    var LAN = [];
    for (k = 0; k < NLAN; k++) {
      var lth = (15 + 30 * k) * D2R, lc = palPol(PAL.lanR, lth), ly = yB + 3.2, top = domeY(PAL.lanR) - 0.3;
      P.geo(addF2(ico.clone(), 2.2, 0), T(lc.x, ly, lc.z, 0.3, lth, 0), MT.LIGHT, 1);
      var rot = T(lc.x, ly, lc.z, 0.3, lth, 0);
      icoEdges.forEach(function (e) { tubeAlong(P, [iv[e[0]].clone().multiplyScalar(1.04).applyMatrix4(rot), iv[e[1]].clone().multiplyScalar(1.04).applyMatrix4(rot)], 0.022, 5, MT.BRASS); });
      latheAt(P, lc.x, ly + 0.48, lc.z, [[0.16, 0], [0.12, 0.12], [0.05, 0.2], [0.0, 0.22]], 12, MT.BRASS);
      tubeAlong(P, [new THREE.Vector3(lc.x, ly + 0.66, lc.z), new THREE.Vector3(lc.x, top, lc.z)], 0.012, 5, MT.ANOD);
      light(lc.x, ly - 0.75, lc.z, WARM, 7.0, 28); LAN.push(new THREE.Vector3(lc.x, ly, lc.z));
    }
    var ocY = domeY(PAL.oc) - 0.15, ring = []; for (k = 0; k <= 96; k++) ring.push(V3(PAL.oc, k / 96 * TAU, ocY));
    tubeAlong(P, ring, 0.22, 12, MT.BRASS);
    var hub = new THREE.Vector3(PAL.c.x, yB + PAL.H - 0.25, PAL.c.z);
    for (k = 0; k < 8; k++) tubeAlong(P, [V3(PAL.oc, k / 8 * TAU, ocY), hub], 0.07, 8, MT.BRASS);
    P.geo(new THREE.SphereGeometry(0.4, 24, 16), T(hub.x, hub.y, hub.z), MT.BRASS, 1);
    PEND.pivot = new THREE.Vector3(hub.x, hub.y - 0.35, hub.z); PEND.L = PEND.pivot.y - (yF + 0.85); PEND.T = 2 * Math.PI * Math.sqrt(PEND.L / GRAV);
    light(PAL.c.x, yB + 13.2, PAL.c.z, [0.92, 0.95, 1.0], 18, 44);
    for (k = 0; k < 34; k++) {
      var uth = k / 34 * TAU; if (nearOpening(uth, 2.6)) continue;
      var up = palPol(27.75, uth), iw = inward(uth);
      boxAt(27.75, uth, yB + PAL.beam, yB + PAL.beam + 0.13, 0.3, 0.22, MT.ANOD);
      boxAt(27.75, uth, yB + PAL.beam + 0.13, yB + PAL.beam + 0.15, 0.22, 0.16, MT.LIGHT, [1.6, 0]);
      var dl = Math.hypot(iw[0] * 0.32, 0.95, iw[2] * 0.32);
      light(up.x, yB + PAL.beam + 0.2, up.z, WARM, 5.0, 20, [iw[0] * 0.32 / dl, 0.95 / dl, iw[2] * 0.32 / dl], 2);
    }
    // pi ring glow, spilling onto the wall and the balcony lip
    for (k = 0; k < 24; k++) { var gp = palPol(21.5, k / 24 * TAU); light(gp.x, yB - 0.2, gp.z, WARM, 0.55, 5); }

    // ---- entrance vault inside, vestibule floor ----
    var v0 = P.count();
    P.surf(40, 30, function (i, j, q) {
      var s = -Math.cos(Math.PI * i / 40), rad = lerp(PAL.vBack, PAL.vFront, j / 30), wi = vaultW(rad), hi = vaultH(rad), fl = vestY(rad), p = palXZ(s * wi, rad);   // finer near the floor
      var y = fl + hi * Math.pow(Math.max(0, 1 - s * s), 0.55);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.f[0] = s * wi; q.f[1] = rad; q.f2[0] = y - fl; q.m = MT.VAULT;
    });
    P.orient(v0, function (x, y, z) { var o = palLoc(x, z, {}), ax = palXZ(0, o.rad); return [ax.x - x, vestY(o.rad) + 2.5 - y, ax.z - z]; });
    P.surf(10, 16, function (i, j, q) { var rad = lerp(PAL.ringIn - 0.1, PAL.vFront + 0.05, j / 16), wi = vaultW(rad), lat = lerp(-wi, wi, i / 10), p = palXZ(lat, rad); q.p[0] = p.x; q.p[1] = vestY(rad) + 0.004; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.f2[1] = 1; q.m = MT.BALSTONE; });
    [25.5, 28.5, 31.5, 34.0].forEach(function (rad) { var p = palXZ(0, rad); light(p.x, vestY(rad) + vaultH(rad) - 1.3, p.z, WARM, 2.6, 11); });
    // welcome panels on the vault walls, facing each other
    [[-1, 0], [1, 1]].forEach(function (e) {
      var sd = e[0], lat = sd * 3.72, r0 = 30.1, r1 = 32.5, y0 = 0.95, y1 = y0 + (r1 - r0) / 1.5, n = [-sd * PAL.Rt.x, 0, -sd * PAL.Rt.z];
      var ra = sd < 0 ? r1 : r0, rb = sd < 0 ? r0 : r1, a = palXZ(lat, ra), b = palXZ(lat, rb), ym = vestY((r0 + r1) / 2), u0 = e[1] / 2, u1 = (e[1] + 1) / 2;
      var AV = ATL.vest, U0 = lerp(AV[0], AV[2], u0), U1 = lerp(AV[0], AV[2], u1);
      quad(new THREE.Vector3(a.x, ym + y0, a.z), new THREE.Vector3(b.x, ym + y0, b.z), new THREE.Vector3(b.x, ym + y1, b.z), new THREE.Vector3(a.x, ym + y1, a.z), n, MT.ATLAS, [[U0, AV[1]], [U1, AV[1]], [U1, AV[3]], [U0, AV[3]]], [0.8, 5]);
      var c = palXZ(lat, (r0 + r1) / 2), fyv = T(c.x, ym, c.z, 0, Math.atan2(n[0], n[2]), 0), Wp = r1 - r0, Hp = y1 - y0;
      [[0, y0 - 0.05, Wp + 0.16, 0.08], [0, y1 + 0.05, Wp + 0.16, 0.08], [-Wp / 2 - 0.04, (y0 + y1) / 2, 0.08, Hp + 0.16], [Wp / 2 + 0.04, (y0 + y1) / 2, 0.08, Hp + 0.16]].forEach(function (bx) {
        P.geo(new THREE.BoxGeometry(bx[2], bx[3], 0.06), new THREE.Matrix4().multiplyMatrices(fyv, T(bx[0], bx[1], -0.02)), MT.BRASS, 1); });
    });

    // ---- the dome's spiral lattice ----
    domeRibs(P);

    palMesh = bakedMesh(P, matMat); scene.add(palMesh);

    // ---- moving pieces: Foucault pendulum, golden Moebius strip, the five solids ----
    var PB = new Builder();
    PB.zone = ZONE.ROT;
    tubeAlong(PB, [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -PEND.L + 0.3, 0)], 0.012, 6, MT.STEEL);
    PB.geo(new THREE.SphereGeometry(0.32, 32, 20), T(0, -PEND.L, 0), MT.BRASS, 1);
    PB.geo(new THREE.ConeGeometry(0.07, 0.3, 16), T(0, -PEND.L - 0.42, 0, Math.PI, 0, 0), MT.BRASS, 1);
    palPend = bakedMesh(PB, matMat, lights, PEND.pivot); palPend.position.copy(PEND.pivot); palPend.matrixAutoUpdate = true; scene.add(palPend);
    var MB = new Builder(), mR = 3.6, mW = 1.4, mY = yB + 4.4; MB.zone = ZONE.ROT;
    MB.surf(240, 10, function (i, j, q) {
      var u = i / 240 * TAU, v = -1 + 2 * j / 10, rr = mR + v * mW * Math.cos(u / 2);
      q.p[0] = rr * Math.cos(u); q.p[1] = v * mW * Math.sin(u / 2); q.p[2] = rr * Math.sin(u); q.m = MT.BRASS;
    });
    var edge = []; for (k = 0; k <= 480; k++) { var u = k / 480 * 2 * TAU, rr2 = mR + mW * Math.cos(u / 2); edge.push(new THREE.Vector3(rr2 * Math.cos(u), mW * Math.sin(u / 2), rr2 * Math.sin(u))); }
    tubeAlong(MB, edge, 0.05, 8, MT.BRASS);
    PAL.mob = { x: PAL.c.x, y: mY, z: PAL.c.z };
    palMob = bakedMesh(MB, matMat, lights, PAL.mob); palMob.matrixAutoUpdate = true;
    PAL.mobHold = new THREE.Group(); PAL.mobHold.position.set(PAL.c.x, mY, PAL.c.z); PAL.mobHold.add(palMob); scene.add(PAL.mobHold);
    for (k = 0; k < 5; k++) {
      var SB = new Builder(), sd = SOLIDS[k], thk = (36 + 72 * k) * D2R, pcs = palPol(PAL.pedR, thk), cy = yF + 2.05; SB.zone = ZONE.ROT;
      sd.e.forEach(function (e) { tubeAlong(SB, [sd.v[e[0]], sd.v[e[1]]], 0.03, 8, MT.BRASS); });
      sd.v.forEach(function (p) { SB.geo(new THREE.SphereGeometry(0.06, 12, 8), T(p.x, p.y, p.z), MT.BRASS, 1); });
      SB.geo(addF2(new THREE.SphereGeometry(0.1, 14, 10), 2.0, 0), T(0, 0, 0), MT.LIGHT, 1);
      var ms = bakedMesh(SB, matMat, lights, { x: pcs.x, y: cy, z: pcs.z }); ms.position.set(pcs.x, cy, pcs.z); ms.matrixAutoUpdate = true; scene.add(ms); palSolids.push(ms);
    }
    palAnimHidden = [palPend, palMob].concat(palSolids);
    PAL.built = true;
  }
  function palSolidDefs() {
    var phi = (1 + Math.sqrt(5)) / 2, ip = 1 / phi, sets = [
      [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
      [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]],
      [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
      [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [0, ip, phi], [0, ip, -phi], [0, -ip, phi], [0, -ip, -phi], [ip, phi, 0], [ip, -phi, 0], [-ip, phi, 0], [-ip, -phi, 0], [phi, 0, ip], [phi, 0, -ip], [-phi, 0, ip], [-phi, 0, -ip]],
      [[0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi], [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0], [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]]];
    return sets.map(function (S) {
      var v = S.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), R0 = v[0].length();
      v.forEach(function (p) { p.multiplyScalar(0.62 / R0); });
      var dmin = 1e9, i, j; for (i = 0; i < v.length; i++) for (j = i + 1; j < v.length; j++) dmin = Math.min(dmin, v[i].distanceTo(v[j]));
      var e = []; for (i = 0; i < v.length; i++) for (j = i + 1; j < v.length; j++) if (v[i].distanceTo(v[j]) < dmin * 1.01) e.push([i, j]);
      return { v: v, e: e };
    });
  }
  // The lattice: 21 ribs winding one way and 34 the other, like the seed spirals of a sunflower. Each rib keeps a
  // constant angle to the meridians (58 and 32 degrees), so the cells stay square as they shrink toward the oculus.
  function domeTables() {
    var R = PAL.R, Hh = PAL.H - PAL.beam, phMax = Math.acos(PAL.oc / R), NT = 1600, LT = new Float32Array(NT + 1), ST = new Float32Array(NT + 1);
    for (var k = 1; k <= NT; k++) { var p0 = (k - 1) / NT * phMax, p1 = k / NT * phMax, pm = (p0 + p1) / 2, ds = Math.hypot(R * Math.sin(pm), Hh * Math.cos(pm)) * (p1 - p0); ST[k] = ST[k - 1] + ds; LT[k] = LT[k - 1] + ds / (R * Math.cos(pm)); }
    PAL.phMax = phMax; PAL.LT = LT; PAL.ST = ST; PAL.NT = NT;
  }
  function domeLam(ph) { var t = clamp(ph / PAL.phMax, 0, 1) * PAL.NT, i = Math.min(PAL.NT - 1, Math.floor(t)), f = t - i; return PAL.LT[i] * (1 - f) + PAL.LT[i + 1] * f; }
  function domePhAtS(s) { var ST = PAL.ST, lo = 0, hi = PAL.NT; while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (ST[mid] <= s) lo = mid; else hi = mid; } return (lo + (s - ST[lo]) / Math.max(1e-9, ST[hi] - ST[lo])) / PAL.NT * PAL.phMax; }
  var RIBF = [{ m: 21, tn: Math.tan(58 * D2R) }, { m: 34, tn: -Math.tan(32 * D2R) }];
  function domeRibs(P) {
    domeTables();
    var R = PAL.R, Hh = PAL.H - PAL.beam, y0 = PALY.B + PAL.beam, sMax = PAL.ST[PAL.NT];
    function sp(ph, th) { var p = palPol(R * Math.cos(ph), th); return new THREE.Vector3(p.x, y0 + Hh * Math.sin(ph), p.z); }
    function sn(ph, th) { var nr = Math.cos(ph) / R, ny = Math.sin(ph) / Hh, l = Math.hypot(nr, ny), d = palPol(1, th); return new THREE.Vector3((d.x - PAL.c.x) * nr / l, ny / l, (d.z - PAL.c.z) * nr / l); }
    function inVault(p) {
      var o = palLoc(p.x, p.z, {}), hy = p.y - PALY.B;
      for (var sg = -1; sg <= 1; sg += 2) { var L = linkLoc(sg, o.lat, o.rad); if (L.sl > 20 && Math.abs(L.ll) < LINK.w + 0.4 && hy < linkArch(L.ll) + 0.45) return true; }
      if (o.rad < 20 || Math.abs(o.lat) > vaultW(26) + PAL.vt + 0.45) return false; var s = o.lat / (vaultW(26) + PAL.vt + 0.45); return hy < (vaultH(26) + 0.55 + 0.45) * Math.pow(Math.max(0, 1 - s * s), 0.55); }
    var T3 = new THREE.Vector3(), Bn = new THREE.Vector3();
    function beam(pts, nrm) {
      var N = pts.length - 1; if (N < 1) return;
      var cs = [];
      for (var i = 0; i <= N; i++) {
        T3.subVectors(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        var n = nrm[i], t = pts[i].tag, w = lerp(0.26, 0.16, t), dp = lerp(0.55, 0.3, t);
        Bn.crossVectors(n, T3).normalize();
        var o = pts[i].clone().addScaledVector(n, -0.02), inn = pts[i].clone().addScaledVector(n, -0.02 - dp);
        cs.push({ oa: o.clone().addScaledVector(Bn, w / 2), ob: o.clone().addScaledVector(Bn, -w / 2), ia: inn.clone().addScaledVector(Bn, w / 2), ib: inn.clone().addScaledVector(Bn, -w / 2), n: n.clone(), b: Bn.clone(), t: T3.clone() });
      }
      [["oa", "ob", "n", 1], ["ib", "ia", "n", -1], ["ia", "oa", "b", 1], ["ob", "ib", "b", -1]].forEach(function (fc) {
        P.surf(N, 1, function (i, j, q) { var c = cs[i], v = c[j ? fc[1] : fc[0]], nn = c[fc[2]]; q.p[0] = v.x; q.p[1] = v.y; q.p[2] = v.z; q.nn = [nn.x * fc[3], nn.y * fc[3], nn.z * fc[3]]; q.f[0] = i; q.f[1] = j; q.f2[0] = pts[i].tag; q.m = MT.RIB; });
      });
      [[0, -1], [N, 1]].forEach(function (e) { var c = cs[e[0]]; quad(c.ob, c.oa, c.ia, c.ib, [c.t.x * e[1], c.t.y * e[1], c.t.z * e[1]]); });
    }
    function quad(a, b, c, d, nn) { P.surf(1, 1, function (i, j, q) { var v = j ? (i ? c : d) : (i ? b : a); q.p[0] = v.x; q.p[1] = v.y; q.p[2] = v.z; q.nn = nn; q.m = MT.RIB; }); }
    RIBF.forEach(function (F) {
      var N = Math.ceil(sMax / Math.cos(Math.atan(Math.abs(F.tn))) / 0.6);
      for (var k = 0; k < F.m; k++) {
        var th0 = k / F.m * 2 * Math.PI, run = [], rn = [];
        for (var i = 0; i <= N; i++) {
          var ph = domePhAtS(i / N * sMax), th = th0 + F.tn * domeLam(ph), p = sp(ph, th);
          p.tag = i / N;
          if (inVault(p)) { beam(run, rn); run = []; rn = []; continue; }
          run.push(p); rn.push(sn(ph, th));
        }
        beam(run, rn);
      }
    });
  }
  function domeGlassGeometry() {
    var NU = 192, NV = 56, R = PAL.R, Hh = PAL.H - PAL.beam, y0 = PALY.B + PAL.beam, pos = [], nor = [], fa = [], fb = [], idx = [];
    for (var j = 0; j <= NV; j++) for (var i = 0; i <= NU; i++) {
      var ph = j / NV * Math.PI / 2, th = i / NU * 2 * Math.PI, p = palPol(R * Math.cos(ph), th), d = palPol(1, th);
      var nr = Math.cos(ph) / R, ny = Math.sin(ph) / Hh, l = Math.hypot(nr, ny), L = domeLam(Math.min(ph, PAL.phMax));
      pos.push(p.x, y0 + Hh * Math.sin(ph), p.z); nor.push((d.x - PAL.c.x) * nr / l, ny / l, (d.z - PAL.c.z) * nr / l);
      fa.push((th - RIBF[0].tn * L) * RIBF[0].m / (2 * Math.PI), (th - RIBF[1].tn * L) * RIBF[1].m / (2 * Math.PI)); fb.push(ph / (Math.PI / 2), 0);
    }
    for (j = 0; j < NV; j++) for (i = 0; i < NU; i++) { if (j < 5 && i >= NU / 2 - 3 && i < NU / 2 + 3) continue;   // the back door's opening
      var k = j * (NU + 1) + i; idx.push(k, k + 1, k + NU + 2, k, k + NU + 2, k + NU + 1); }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("aFac", new THREE.Float32BufferAttribute(fa, 2)); g.setAttribute("aFac2", new THREE.Float32BufferAttribute(fb, 2));
    g.setIndex(idx); g.computeBoundingSphere(); return g;
  }
  // textures are drawn after the first frames, so the page opens as fast as before
  function buildPalaceTextures() {
    if (palTexReady) return; palTexReady = true;
    function tex(cv, repeat) { var t = new THREE.CanvasTexture(cv); t.anisotropy = maxAniso; t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; }
    matU.uFloorTex.value = tex(palaceFloorTexture(PAL.pitR, MOBILE ? 1024 : 2048));
    matU.uPanelTex.value = tex(panelAtlas(MOBILE));
    matU.uFriezeTex.value = tex(friezeTexture(MOBILE), true);
    matU.uAtlas.value = tex(campusAtlas());
    matU.uLeafTex.value = leafTexture();
    ENV.ready = true; queueEnv(true);                                   // reflections once everything has its pictures
    setTimeout(startBakeWorker, 60);
  }
  // ---- walking in the palace ----
  function palStairY(deg) { return PALY.B - PAL.depth * clamp((deg - PAL.stairTop) / (PAL.stairBot - PAL.stairTop), 0, 1); }
  var _ps = {};
  // walkable height at (x, z) for a walker whose feet are at yf: undefined outside the palace, NaN where blocked
  function palSupport(x, z, yf) {
    if (!PAL.built) return undefined;
    var o = palLoc(x, z, _ps), r = o.r;
    if (r > 37) return undefined;
    var wi = vaultW(o.rad), wo = wi + PAL.vt, alat = Math.abs(o.lat);
    var inV = o.rad > PAL.vBack - 0.3 && o.rad < PAL.vFront + 0.25 && alat < wi - 0.6;
    if (inV && o.rad >= PAL.ringIn - 0.1) return vestY(Math.min(o.rad, PAL.vFront));
    var vaultWall = o.rad > PAL.vBack - 0.35 && o.rad < PAL.vFront + 0.25 && alat >= wi - 0.6 && alat < wo + 0.35;
    if (r >= PAL.ringOut + 0.3) return vaultWall ? NaN : undefined;
    if (r >= PAL.ringIn - 0.4) { for (var sg = -1; sg <= 1; sg += 2) { var L = linkLoc(sg, o.lat, o.rad); if (Math.abs(L.ll) < LINK.w - 0.35) return linkFloorY(sg, L.sl); } }
    if (vaultWall || (r >= PAL.ringIn - 0.35 && !inV)) return NaN;
    var ath = Math.abs(o.th) * R2D, best = -1e9, c = [];
    if (r >= PAL.balR + 0.15) c.push(PALY.B);                                                 // balcony
    else {
      c.push(PALY.F);
      if (r >= PAL.stairIn + 0.3) {
        if (ath >= PAL.landA + 1 && ath <= PAL.stairTop) c.push(PALY.B);                          // top landing
        else if (ath > PAL.stairTop && ath < PAL.stairBot && r <= PAL.pitR - 0.3) c.push(palStairY(ath));   // stair
      }
    }
    for (var i = 0; i < c.length; i++) if (c[i] <= yf + 0.45 && c[i] > best) best = c[i];
    if (best < -1e8) return NaN;
    if (best === PALY.F) {
      if (r >= PAL.stairIn - 0.35 && ath > PAL.landA - 1 && ath < PAL.stairBot && palStairY(Math.max(ath, PAL.stairTop)) - PALY.F < 2.3) return NaN;   // under the stairs
      if (r < 4.25) return NaN;                                                                  // pendulum rail
      if (r > PAL.pedR - 1.2 && r < PAL.pedR + 1.2) for (var k = 0; k < 5; k++) { var d = palPol(PAL.pedR, (36 + 72 * k) * D2R); if (Math.hypot(x - d.x, z - d.z) < 1.2) return NaN; }
      if (Math.abs(r - PAL.benchR) < 0.65) { var bd = ((o.th * R2D % 72) + 72 + 36) % 72 - 36; if (Math.abs(bd) < PAL.benchA + 1.5) return NaN; }   // benches
      if (r > PAL.pitR - 0.45) return NaN;                                                       // the wall
    }
    return best;
  }
  function palInside(x, z) {       // 0 outside .. 1 under the dome
    if (!PAL.built) return 0;
    var o = palLoc(x, z, {});
    if (o.r < PAL.ringIn) return 1;
    if (Math.abs(o.lat) < vaultW(o.rad) && o.rad > 20 && o.rad < PAL.vFront + 0.5) return smoothstep(PAL.vFront + 0.5, PAL.ringIn, o.rad);
    return 0;
  }
  function palUpdate(time) {
    if (!palPend) return;
    var sw = PEND.A * Math.sin(2 * Math.PI * time / PEND.T), plane = (PAL.th0 || 0) + tMin * (28.8 / 1477.6) * D2R;   // Mars Foucault precession at 4.6 degrees S: about 29 degrees per sol
    var ax = palPol(1, plane + Math.PI / 2), axis = new THREE.Vector3(ax.x - PAL.c.x, 0, ax.z - PAL.c.z).normalize();
    palPend.quaternion.setFromAxisAngle(axis, sw); palPend.updateMatrix();
    PAL.mobHold.rotation.set(0.5, time * 2 * Math.PI / 140, 0, "YXZ"); PAL.mobHold.position.y = PAL.mob.y + 0.12 * Math.sin(time * 0.37); palMob.rotation.y = time * 2 * Math.PI / 60;
    palSolids.forEach(function (s, i) { s.rotation.set(0.35 * Math.sin(time * 0.2 + i), time * (0.22 + 0.04 * i), 0); s.position.y = PALY.F + 2.05 + 0.06 * Math.sin(time * 0.8 + i * 1.3); });
  }
