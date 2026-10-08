  /* ===================== Baked light: quick pass now, shadows and occlusion traced in a worker ===================== */
  // Every built vertex gets the light of the fittings around it (light list by zone: outside, rotunda, wings). A worker then
  // voxelizes the whole campus (20 cm) and traces, per vertex, ambient occlusion, how much sky it sees through the glass,
  // and shadow rays toward its two strongest lights; the result replaces the quick values a few seconds after loading.
  function zoneLights(z) { return z === 1 ? palLights : z === 2 ? wingLights : campusLights; }
  // the lights a point can reach, from a grid of 8 m cells over the plan: each light is listed in every cell its range
  // touches (one reaching over 40 m in all of them), so a vertex visits a few lights, not the whole zone's hundreds
  function lightGrid(L) {
    if (L._grid && L._grid.n === L.length) return L._grid;
    var S = 4, m = new Map(), wide = [];
    L.forEach(function (l) {
      if (l.r > 40) { wide.push(l); return; }
      var x0 = Math.floor((l.x - l.r) / S), x1 = Math.floor((l.x + l.r) / S), z0 = Math.floor((l.z - l.r) / S), z1 = Math.floor((l.z + l.r) / S);
      for (var i = x0; i <= x1; i++) for (var j = z0; j <= z1; j++) { var key = i * 65536 + j, a = m.get(key); if (!a) m.set(key, a = []); a.push(l); }
    });
    if (wide.length) m.forEach(function (a) { Array.prototype.push.apply(a, wide); });
    return (L._grid = { n: L.length, S: S, m: m, wide: wide });
  }
  function bakeQuick(g, lightsOverride, off) {
    var P = g.attributes.position.array, N = g.attributes.normal.array, Z = g.userData.zone, n = P.length / 3, out = g.attributes.aLight.array;
    var ox = off ? off.x : 0, oy = off ? off.y : 0, oz = off ? off.z : 0, G0 = lightsOverride ? lightGrid(lightsOverride) : null, GZ = {}, lG = null, lK = NaN, L = null;
    // (v0.50) the same numbers, faster: a cell's list kept while the points stay in it, smoothstep written out, and no power
    // taken for a lobe of 1 or 2 (Math.pow took most of the time and gives exactly sp and sp * sp there)
    for (var k = 0; k < n; k++) {
      var x = P[k * 3] + ox, y = P[k * 3 + 1] + oy, z = P[k * 3 + 2] + oz, nx = N[k * 3], ny = N[k * 3 + 1], nz = N[k * 3 + 2], r = 0, gg = 0, b = 0;
      var G = G0 || GZ[Z[k]] || (GZ[Z[k]] = lightGrid(zoneLights(Z[k]))), key = Math.floor(x / G.S) * 65536 + Math.floor(z / G.S);
      if (G !== lG || key !== lK) { L = G.m.get(key) || G.wide; lG = G; lK = key; }
      for (var i = 0; i < L.length; i++) {
        var l = L[i], lx = l.x - x, ly = l.y - y, lz = l.z - z, d2 = lx * lx + ly * ly + lz * lz, lr = l.r;
        if (d2 > lr * lr) continue;
        var d = Math.sqrt(d2) + 1e-6, e0 = lr * 0.55, t = (d - e0) / (lr - e0), ndl = (nx * lx + ny * ly + nz * lz) / d, w = 0.12 / (d2 + 2);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        if (ndl > 0) { var dw = ndl / (d2 + 1); if (l.d) { var sp = -(l.d[0] * lx + l.d[1] * ly + l.d[2] * lz) / d, lo = l.lobe; dw = sp > 0 ? dw * (lo === 1 ? sp : lo === 2 ? sp * sp : Math.pow(sp, lo)) : 0; } w += dw; }
        w *= 1 - t * t * (3 - 2 * t); r += l.c[0] * w; gg += l.c[1] * w; b += l.c[2] * w;
      }
      out[k * 3] = r; out[k * 3 + 1] = gg; out[k * 3 + 2] = b;
    }
    g.attributes.aLight.needsUpdate = true;
  }
  var BAKE = { meshes: [], worker: null, done: false, t0: 0 };
  // (v0.49) a static mesh drawn once has its arrays on the graphics card: they move to the worker instead of being copied,
  // and the traced light it sends back leaves the page once drawn, so the page keeps a fraction of the campus in memory
  function bakeDrawn() { this.userData.drawn = true; delete this.onAfterRender; }
  function bakeDrop() { var A = this.geometry.attributes; A.aLight.array = A.aAO.array = A.aSky.array = BLD_E; delete this.onAfterRender; }
  // mesh from a builder, lit at once; static meshes also go to the worker. opts.later (v0.50, the four big static meshes):
  // the worker gives it the quick light first thing, the same numbers, so the page opens without waiting for it
  function bakedMesh(Bd, material, lightsOverride, off, opts) {
    var g = Bd.build(), later = !!(opts && opts.later) && !lightsOverride && !off && typeof Worker !== "undefined";
    if (!later) bakeQuick(g, lightsOverride, off);
    var m = new THREE.Mesh(g, material); m.frustumCulled = false; m.matrixAutoUpdate = false;
    if (!off) { BAKE.meshes.push({ mesh: m, occluder: !(opts && opts.noOcclude), quick: later }); m.onAfterRender = bakeDrawn; }
    return m;
  }
  function bakeQuickLeft() { BAKE.meshes.forEach(function (e) { if (e.quick) { bakeQuick(e.mesh.geometry); e.quick = false; } }); }   // no worker after all
  function startBakeWorker() {
    if (BAKE.worker || BAKE.started || typeof Worker === "undefined" || !CG.h) return;
    var src = "(" + bakeWorkerMain.toString() + ")()", w;
    try { w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" }))); } catch (e) { bakeQuickLeft(); return; }
    BAKE.worker = w; BAKE.started = true; BAKE.t0 = performance.now();
    var transfer = [], seen = new Set();
    function give(a, Ty, own) {                    // the array itself once it is on the card, else a copy; either way it moves to the worker
      var b = own && a instanceof Ty ? a : new Ty(a);
      if (!seen.has(b.buffer)) { seen.add(b.buffer); transfer.push(b.buffer); }
      return b;
    }
    var meshes = BAKE.meshes.map(function (e) {
      var g = e.mesh.geometry, A = g.attributes, own = !!e.mesh.userData.drawn;
      var m = { pos: give(A.position.array, Float32Array, own), nor: give(A.normal.array, Float32Array, own), idx: give(g.index.array, Uint32Array, own), zone: give(g.userData.zone, Uint8Array, own), occ: e.occluder, quick: !!e.quick };
      if (own) { A.aFac.array = A.aFac2.array = A.aMat.array = BLD_E; g.userData.zone = null; e.own = true; }
      return m;
    });
    function packL(L) { return L.map(function (l) { return [l.x, l.y, l.z, l.c[0], l.c[1], l.c[2], l.r, l.d ? l.d[0] : 0, l.d ? l.d[1] : 0, l.d ? l.d[2] : 0, l.d ? l.lobe : -1]; }); }
    w.onmessage = function (ev) {
      var r = ev.data; if (!r) return;
      if (r.quick) {                                                   // the quick light of the meshes left to the worker
        r.quick.forEach(function (i, j) { var e = BAKE.meshes[i], A = e.mesh.geometry.attributes; if (e.own) A.aLight.array = r.light[j]; else A.aLight.array.set(r.light[j]); A.aLight.needsUpdate = true; e.quick = false; });
        BAKE.quickMs = Math.round(performance.now() - BAKE.t0); if (typeof queueEnv === "function") queueEnv(true); return;
      }
      if (!r.out) return;
      r.out.forEach(function (o, i) {
        var e = BAKE.meshes[i], A = e.mesh.geometry.attributes;
        if (e.own) { A.aLight.array = o.light; A.aAO.array = o.ao; A.aSky.array = o.sky; e.mesh.onAfterRender = bakeDrop; }
        else { A.aLight.array.set(o.light); A.aAO.array.set(o.ao); A.aSky.array.set(o.sky); }
        A.aLight.needsUpdate = A.aAO.needsUpdate = A.aSky.needsUpdate = true;
      });
      BAKE.done = true; BAKE.ms = Math.round(performance.now() - BAKE.t0); w.terminate(); BAKE.worker = null;
      if (typeof queueEnv === "function") queueEnv(true);
    };
    w.onerror = function () { BAKE.failed = true; };
    w.postMessage({
      meshes: meshes, lights: [packL(campusLights), packL(palLights), packL(wingLights)], mobile: MOBILE,
      cg: { h: CG.h, x0: CG.x0, z0: CG.z0, res: CG.res, nx: CG.nx, nz: CG.nz },
      pal: { cx: PAL.c.x, cz: PAL.c.z, fx: PAL.F.x, fz: PAL.F.z, R: PAL.R, vW: 4.45, vF: PAL.vFront, yF: PALY.F, yB: PALY.B },
      cuts: P2CUTS.map(function (c) { return c.p.concat(c.q); }), domains: P2DOMAINS
    }, transfer);
  }
  // runs inside the worker: must not use anything from the page
  function bakeWorkerMain() {
    self.onmessage = function (ev) {
      var D = ev.data, P = D.pal, RES = 0.2, Y1 = P.yB + 17.5;
      // (v0.50) first the quick light of the meshes the page left unlit, sent back at once: bakeQuick's sums exactly, on the
      // lights by 4 m cell as lightGrid lists them (the wide ones, reaching over 40 m, after each cell's own)
      var QG = D.lights.map(function (L) {
        var m = new Map(), wide = [];
        L.forEach(function (l) {
          if (l[6] > 40) { wide.push(l); return; }
          var x0 = Math.floor((l[0] - l[6]) / 4), x1 = Math.floor((l[0] + l[6]) / 4), z0 = Math.floor((l[2] - l[6]) / 4), z1 = Math.floor((l[2] + l[6]) / 4);
          for (var i = x0; i <= x1; i++) for (var j = z0; j <= z1; j++) { var key = i * 65536 + j, a = m.get(key); if (!a) m.set(key, a = []); a.push(l); }
        });
        if (wide.length) m.forEach(function (a) { Array.prototype.push.apply(a, wide); });
        return { m: m, wide: wide };
      });
      function quickLight(m) {
        var Pq = m.pos, Nq = m.nor, Zq = m.zone, n = Pq.length / 3, out = new Float32Array(n * 3), lG = null, lK = NaN, L = null;
        for (var k = 0; k < n; k++) {
          var x = Pq[k * 3], y = Pq[k * 3 + 1], z = Pq[k * 3 + 2], nx = Nq[k * 3], ny = Nq[k * 3 + 1], nz = Nq[k * 3 + 2], r = 0, gg = 0, b = 0;
          var G = QG[Zq[k] === 1 ? 1 : Zq[k] === 2 ? 2 : 0], key = Math.floor(x / 4) * 65536 + Math.floor(z / 4);
          if (G !== lG || key !== lK) { L = G.m.get(key) || G.wide; lG = G; lK = key; }
          for (var i = 0; i < L.length; i++) {
            var l = L[i], lx = l[0] - x, ly = l[1] - y, lz = l[2] - z, d2 = lx * lx + ly * ly + lz * lz, lr = l[6];
            if (d2 > lr * lr) continue;
            var d = Math.sqrt(d2) + 1e-6, e0 = lr * 0.55, t = (d - e0) / (lr - e0), ndl = (nx * lx + ny * ly + nz * lz) / d, w = 0.12 / (d2 + 2);
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            if (ndl > 0) { var dw = ndl / (d2 + 1); if (l[10] >= 0) { var sp = -(l[7] * lx + l[8] * ly + l[9] * lz) / d, lo = l[10]; dw = sp > 0 ? dw * (lo === 1 ? sp : lo === 2 ? sp * sp : Math.pow(sp, lo)) : 0; } w += dw; }
            w *= 1 - t * t * (3 - 2 * t); r += l[3] * w; gg += l[4] * w; b += l[5] * w;
          }
          out[k * 3] = r; out[k * 3 + 1] = gg; out[k * 3 + 2] = b;
        }
        return out;
      }
      var QI = [], QL = [];
      D.meshes.forEach(function (m, i) { if (m.quick) { QI.push(i); QL.push(quickLight(m)); } });
      if (QI.length) self.postMessage({ quick: QI, light: QL }, QL.map(function (a) { return a.buffer; }));
      // voxel domains in the palace frame: today's campus, then the new quarter's buildings (the first that holds a point owns it)
      var DOM = [{ l0: -27, l1: 27, r0: -40, r1: 96, y0: P.yF - 1.0, y1: P.yB + 17.5 }].concat(D.domains || []), NV = 0;
      DOM.forEach(function (d) { d.NL = Math.ceil((d.l1 - d.l0) / RES); d.NR = Math.ceil((d.r1 - d.r0) / RES); d.NY = Math.ceil((d.y1 - d.y0) / RES); d.off = NV; NV += d.NL * d.NR * d.NY; });
      var vox = new Uint32Array(Math.ceil(NV / 32));
      var fx = P.fx, fz = P.fz, rx = fz, rz = -fx;                         // palace frame: lat along (rx, rz), rad along (fx, fz)
      function vIndex(x, y, z) {
        var dx = x - P.cx, dz = z - P.cz, la = dx * rx + dz * rz, ra = dx * fx + dz * fz;
        for (var n = 0; n < DOM.length; n++) { var d = DOM[n]; if (la < d.l0 || la >= d.l1 || ra < d.r0 || ra >= d.r1 || y < d.y0 || y >= d.y1) continue;
          var i = Math.floor((la - d.l0) / RES), j = Math.floor((ra - d.r0) / RES), k = Math.floor((y - d.y0) / RES); return d.off + (k * d.NR + j) * d.NL + i; }
        return -1;
      }
      function mark(x, y, z) { var id = vIndex(x, y, z); if (id >= 0) vox[id >>> 5] |= 1 << (id & 31); }
      function solidV(x, y, z) { var id = vIndex(x, y, z); return id >= 0 && (vox[id >>> 5] & (1 << (id & 31))) !== 0; }
      // voxelize every occluding triangle by sampling it densely
      D.meshes.forEach(function (m) {
        if (!m.occ) return;
        var p = m.pos, I = m.idx, h = RES * 0.5;
        for (var t = 0; t < I.length; t += 3) {
          var a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
          var ax = p[a], ay = p[a + 1], az = p[a + 2], bx = p[b] - ax, by = p[b + 1] - ay, bz = p[b + 2] - az, cx = p[c] - ax, cy = p[c + 1] - ay, cz = p[c + 2] - az;
          var l = Math.max(Math.sqrt(bx * bx + by * by + bz * bz), Math.sqrt(cx * cx + cy * cy + cz * cz), Math.sqrt((bx - cx) * (bx - cx) + (by - cy) * (by - cy) + (bz - cz) * (bz - cz)));
          var n = Math.min(400, Math.max(1, Math.ceil(l / h)));
          for (var i = 0; i <= n; i++) for (var j = 0; j <= n - i; j++) { var u = i / n, v = j / n; mark(ax + bx * u + cx * v, ay + by * u + cy * v, az + bz * u + cz * v); }
        }
      });
      // the ground, except where the campus is cut into it
      var G = D.cg, CUTS = D.cuts || [];
      function gH(x, z) { var u = Math.min(Math.max((x - G.x0) / G.res - 0.5, 0), G.nx - 1.001), v = Math.min(Math.max((z - G.z0) / G.res - 0.5, 0), G.nz - 1.001), i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, H = G.h, W = G.nx; return (H[j * W + i] * (1 - fu) + H[j * W + i + 1] * fu) * (1 - fv) + (H[(j + 1) * W + i] * (1 - fu) + H[(j + 1) * W + i + 1] * fu) * fv; }
      function inCut(x, z) { var dx = x - P.cx, dz = z - P.cz; if (dx * dx + dz * dz < (P.R + 0.1) * (P.R + 0.1)) return true; var s = dx * fx + dz * fz, al = Math.abs(dx * rx + dz * rz);
        if (al < P.vW && s > 0 && s < P.vF + 0.1) return true;
        var lat = dx * rx + dz * rz;
        for (var n = 0; n < CUTS.length; n++) { var c = CUTS[n]; if (c[6] < 0.5) { var ql = lat - c[0], qr = s - c[1], r = Math.sqrt(ql * ql + qr * qr), a = Math.atan2(ql, -qr); if (r > c[2] && r < c[3] && a > c[4] && a < c[5]) return true; }
          else if (lat > c[0] && lat < c[2] && s > c[1] && s < c[3]) return true; }
        return false; }
      var gMax = -1e9; for (var q = 0; q < G.h.length; q++) if (G.h[q] > gMax) gMax = G.h[q];
      var skipId = -1;                                                    // the voxel a ray starts in, when that one is solid
      function solid(x, y, z) {
        var id = vIndex(x, y, z);
        if (id >= 0 && id !== skipId && (vox[id >>> 5] & (1 << (id & 31))) !== 0) return true;
        if (y < gMax && x > G.x0 && z > G.z0 && x < G.x0 + G.nx * G.res && z < G.z0 + G.nz * G.res && y < gH(x, z) - 0.05 && !inCut(x, z)) return true;
        return false;
      }
      function startAt(x, y, z) { var id = vIndex(x, y, z); skipId = (id >= 0 && (vox[id >>> 5] & (1 << (id & 31))) !== 0) ? id : -1; }
      // ray patterns: cosine-weighted directions on the hemisphere around +z, turned to each normal
      function pattern(n, seed) { var out = [], ga = Math.PI * (3 - Math.sqrt(5)); for (var i = 0; i < n; i++) { var r = Math.sqrt((i + 0.5) / n), a = i * ga + seed; out.push([Math.cos(a) * r, Math.sin(a) * r, Math.sqrt(Math.max(0, 1 - r * r))]); } return out; }
      var NAO = D.mobile ? 12 : 16, NSK = D.mobile ? 10 : 16, AOP = pattern(NAO, 0.3), SKP = pattern(NSK, 1.1);
      // (v0.50) each zone's lights by 4 m cell: every light, in its order, in each cell its reach touches; a point visits its
      // cell's few instead of the zone's hundreds and meets the same lights in the same order, so the light is the same
      var LG = D.lights.map(function (L) {
        var m = new Map();
        L.forEach(function (l) { var r = l[6], x0 = Math.floor((l[0] - r) / 4), x1 = Math.floor((l[0] + r) / 4), z0 = Math.floor((l[2] - r) / 4), z1 = Math.floor((l[2] + r) / 4);
          for (var i = x0; i <= x1; i++) for (var j = z0; j <= z1; j++) { var key = i * 65536 + j, a = m.get(key); if (!a) m.set(key, a = []); a.push(l); } });
        return m;
      }), NOL = [];
      function cellLights(zone, x, z) { var m = LG[zone]; return (m && m.get(Math.floor(x / 4) * 65536 + Math.floor(z / 4))) || NOL; }
      var out = [];
      D.meshes.forEach(function (m) {
        var p = m.pos, nn = m.nor, Z = m.zone, N = p.length / 3, light = new Float32Array(N * 3), ao = new Float32Array(N), sky = new Float32Array(N);
        for (var k = 0; k < N; k++) {
          var x = p[k * 3], y = p[k * 3 + 1], z = p[k * 3 + 2], nx = nn[k * 3], ny = nn[k * 3 + 1], nz = nn[k * 3 + 2], zone = Z[k];
          // tangent frame
          var tx, ty, tz; if (Math.abs(ny) < 0.9) { tx = nz; ty = 0; tz = -nx; } else { tx = 0; ty = -nz; tz = ny; } var tl = Math.sqrt(tx * tx + ty * ty + tz * tz); tx /= tl; ty /= tl; tz /= tl;
          var bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
          var cr = 1, sr = 0;
          var ox = x + nx * 0.2, oy = y + ny * 0.2, oz = z + nz * 0.2; startAt(ox, oy, oz);
          // ambient occlusion within 2 m (3 m outside)
          var maxD = zone === 0 ? 3.0 : 2.0, occ = 0;
          for (var r = 0; r < NAO; r++) {
            var d = AOP[r], a1 = d[0] * cr - d[1] * sr, a2 = d[0] * sr + d[1] * cr, dx = tx * a1 + bx * a2 + nx * d[2], dy = ty * a1 + by * a2 + ny * d[2], dz = tz * a1 + bz * a2 + nz * d[2];
            for (var t = 0.05; t < maxD; t += RES * 0.9) { if (solid(ox + dx * t, oy + dy * t, oz + dz * t)) { occ += 1 - t / maxD; break; } }
          }
          ao[k] = Math.min(1, Math.max(0, 1 - 1.15 * occ / NAO)) + 2 * zone;
          // sky seen through the glass (inside only)
          if (zone > 0) {
            var vis = 0;
            for (r = 0; r < NSK; r++) {
              d = SKP[r]; a1 = d[0] * cr - d[1] * sr; a2 = d[0] * sr + d[1] * cr; dx = tx * a1 + bx * a2 + nx * d[2]; dy = ty * a1 + by * a2 + ny * d[2]; dz = tz * a1 + bz * a2 + nz * d[2];
              var hit = false; for (t = 0.3; t < 30; t += 0.25 + t * 0.06) { var qy = oy + dy * t; if (qy > Y1) break; if (solid(ox + dx * t, qy, oz + dz * t)) { hit = true; break; } }
              if (!hit) vis += 1;
            }
            sky[k] = 0.85 * vis / NSK;
          } else sky[k] = 1;
          // artificial light, with shadows toward the two strongest fittings (the zone's lights listed for this point's cell)
          var L = cellLights(zone, x, z), best = [-1, -1], bw = [0, 0], cr3 = [], lr = 0, lg = 0, lb = 0;
          for (var i = 0; i < L.length; i++) {
            var l = L[i], lx = l[0] - x, ly = l[1] - y, lz = l[2] - z, d2 = lx * lx + ly * ly + lz * lz; if (d2 > l[6] * l[6]) continue;
            var dd = Math.sqrt(d2) + 1e-6, win = 1 - Math.min(1, Math.max(0, (dd - l[6] * 0.55) / (l[6] * 0.45))); win = win * win * (3 - 2 * win);
            var ndl = (nx * lx + ny * ly + nz * lz) / dd, w = 0.12 / (d2 + 2), dw = 0;
            if (ndl > 0) { dw = ndl / (d2 + 1); if (l[10] >= 0) { var sp = -(l[7] * lx + l[8] * ly + l[9] * lz) / dd, lo = l[10]; dw = sp > 0 ? dw * (lo === 1 ? sp : lo === 2 ? sp * sp : Math.pow(sp, lo)) : 0; } }
            w *= win; dw *= win;
            lr += l[3] * w; lg += l[4] * w; lb += l[5] * w;
            var lum = (l[3] + l[4] + l[5]) * dw;
            if (lum > bw[0]) { bw[1] = bw[0]; best[1] = best[0]; bw[0] = lum; best[0] = cr3.length; } else if (lum > bw[1]) { bw[1] = lum; best[1] = cr3.length; }
            cr3.push([l[3] * dw, l[4] * dw, l[5] * dw, i]);
          }
          for (i = 0; i < cr3.length; i++) {
            var c = cr3[i], v = 1;
            if (i === best[0] || i === best[1]) {
              l = L[c[3]]; var sx = x + nx * 0.2, sy = y + ny * 0.2, sz = z + nz * 0.2, ex = l[0] - sx, ey = l[1] - sy, ez = l[2] - sz, el = Math.sqrt(ex * ex + ey * ey + ez * ez); startAt(sx, sy, sz);
              ex /= el; ey /= el; ez /= el;
              for (t = 0.1; t < el - 0.4; t += RES * 0.9) if (solid(sx + ex * t, sy + ey * t, sz + ez * t)) { v = 0.12; break; }
            }
            lr += c[0] * v; lg += c[1] * v; lb += c[2] * v;
          }
          light[k * 3] = lr; light[k * 3 + 1] = lg; light[k * 3 + 2] = lb;
        }
        // smooth occlusion and sky over each surface, so the ray pattern never shows
        var I = m.idx, acc = new Float32Array(N * 2), cnt = new Float32Array(N);
        for (var it = 0; it < 2; it++) {
          acc.fill(0); cnt.fill(0);
          for (var t2 = 0; t2 < I.length; t2 += 3) for (var e = 0; e < 3; e++) { var a = I[t2 + e]; for (var f = 0; f < 3; f++) { var bb = I[t2 + f]; acc[a * 2] += ao[bb] - 2 * Z[bb]; acc[a * 2 + 1] += sky[bb]; cnt[a] += 1; } }
          for (k = 0; k < N; k++) if (cnt[k] > 0) { ao[k] = 0.5 * (ao[k] - 2 * Z[k]) + 0.5 * acc[k * 2] / cnt[k] + 2 * Z[k]; sky[k] = 0.5 * sky[k] + 0.5 * acc[k * 2 + 1] / cnt[k]; }
        }
        out.push({ light: light, ao: ao, sky: sky });
      });
      var tr = []; out.forEach(function (o) { tr.push(o.light.buffer, o.ao.buffer, o.sky.buffer); });
      self.postMessage({ out: out }, tr);
    };
  }
