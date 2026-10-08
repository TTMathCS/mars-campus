  /* Geometry builder: boxes, parametric surfaces and shapes, with facade coordinates, material ids and a light zone */
  // zone: 0 outside, 1 rotunda, 2 wings (set B.zone before adding geometry); it picks the reflection map and sky light.
  // (v0.49) The arrays are typed and grow as they fill: nv points and ni indices are used of their room. Plain arrays held
  // each number in 8 bytes of the page's own heap, and the campus's four million points crashed the page on PCs with
  // little memory (Jim, 8 Oct 2026: "even not finish loading on some old pc"). Read b.count(), never b.p.length.
  var BLD_E = new Float32Array(0);
  // nv0, ni0: room to start with, for a builder that will hold a lot (the campus's), so it does not grow by copying itself
  function Builder(nv0, ni0) { this.nv = 0; this.ni = 0; this.p = this.n = this.f = this.f2 = this.m = BLD_E; this.z = new Uint8Array(0); this.i = new Uint32Array(0); this.zone = 0; if (nv0) this.grow(nv0, ni0 || nv0 * 3); }
  // room for k more points and j more indices (twice as much each time it runs out)
  Builder.prototype.grow = function (k, j) {
    var need = this.nv + k, cap = this.m.length;
    if (need > cap) {
      cap = Math.max(need, cap * 2, 64);
      var re = function (a, w, Ty) { var b = new Ty(cap * w); b.set(a); return b; };
      this.p = re(this.p, 3, Float32Array); this.n = re(this.n, 3, Float32Array); this.f = re(this.f, 2, Float32Array); this.f2 = re(this.f2, 2, Float32Array);
      this.m = re(this.m, 1, Float32Array); this.z = re(this.z, 1, Uint8Array);
    }
    need = this.ni + j; cap = this.i.length;
    if (need > cap) { var b = new Uint32Array(Math.max(need, cap * 2, 96)); b.set(this.i); this.i = b; }
  };
  Builder.prototype.quad = function (a, b, c, d, nrm, fa, fb, fc, fd, mat) {
    if (this.pc) this.mark();
    this.grow(4, 6);
    var base = this.nv, P = this.p, N = this.n, F = this.f, F2 = this.f2, V = [a, b, c, d], FF = [fa, fb, fc, fd], t = this.ni, I = this.i;
    for (var k = 0; k < 4; k++) {
      var o = base + k, v = V[k], u = FF[k];
      P[o * 3] = v[0]; P[o * 3 + 1] = v[1]; P[o * 3 + 2] = v[2]; N[o * 3] = nrm[0]; N[o * 3 + 1] = nrm[1]; N[o * 3 + 2] = nrm[2];
      F[o * 2] = u[0]; F[o * 2 + 1] = u[1]; F2[o * 2] = 99; F2[o * 2 + 1] = 0; this.m[o] = mat; this.z[o] = this.zone;
    }
    I[t] = base; I[t + 1] = base + 1; I[t + 2] = base + 2; I[t + 3] = base; I[t + 4] = base + 2; I[t + 5] = base + 3;
    this.nv = base + 4; this.ni = t + 6;
  };
  // axis-aligned box; mats = number or {px,nx,py,ny,pz,nz}; facade coords: u = metres along face, v = y (or z on top)
  Builder.prototype.box = function (x0, y0, z0, x1, y1, z1, mats, skipBottom) {
    function mt(k) { return typeof mats === "number" ? mats : (mats[k] !== undefined ? mats[k] : mats.all); }
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0, y0], [x1, y0], [x1, y1], [x0, y1], mt("pz"));
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [x1, y0], [x0, y0], [x0, y1], [x1, y1], mt("nz"));
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [z1, y0], [z0, y0], [z0, y1], [z1, y1], mt("px"));
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0, y0], [z1, y0], [z1, y1], [z0, y1], mt("nx"));
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [x0, z1], [x1, z1], [x1, z0], [x0, z0], mt("py"));
    if (!skipBottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [x0, z0], [x1, z0], [x1, z1], [x0, z1], mt("ny"));
  };
  // any three.js geometry with a transform (keeps aMat / aFac / aFac2 if the geometry has them)
  Builder.prototype.geo = function (g, matrix, mat, facScale) {
    g = g.index ? g.toNonIndexed() : g.clone(); g.applyMatrix4(matrix);
    var Pg = g.attributes.position.array, Ng = g.attributes.normal.array, UV = g.attributes.uv ? g.attributes.uv.array : null, s = facScale || 1, cnt = Pg.length / 3;
    var AM = g.attributes.aMat ? g.attributes.aMat.array : null, AF = g.attributes.aFac ? g.attributes.aFac.array : null, AF2 = g.attributes.aFac2 ? g.attributes.aFac2.array : null;
    if (this.pc) this.mark();
    this.grow(cnt, cnt);
    var base = this.nv, P = this.p, N = this.n, F = this.f, F2 = this.f2, M = this.m, Z = this.z, I = this.i, t = this.ni, zn = this.zone;
    for (var k = 0; k < cnt; k++) {
      var o = base + k;
      P[o * 3] = Pg[k * 3]; P[o * 3 + 1] = Pg[k * 3 + 1]; P[o * 3 + 2] = Pg[k * 3 + 2]; N[o * 3] = Ng[k * 3]; N[o * 3 + 1] = Ng[k * 3 + 1]; N[o * 3 + 2] = Ng[k * 3 + 2];
      if (AF) { F[o * 2] = AF[k * 2]; F[o * 2 + 1] = AF[k * 2 + 1]; } else { F[o * 2] = UV ? UV[k * 2] * s : 0; F[o * 2 + 1] = UV ? UV[k * 2 + 1] * s : 0; }
      if (AF2) { F2[o * 2] = AF2[k * 2]; F2[o * 2 + 1] = AF2[k * 2 + 1]; } else { F2[o * 2] = 99; F2[o * 2 + 1] = 0; }
      M[o] = AM ? AM[k] : mat; Z[o] = zn; I[t + k] = o;
    }
    this.nv = base + cnt; this.ni = t + cnt;
  };
  // another builder's content, transformed (keeps its facade coordinates in its own metres)
  Builder.prototype.add = function (o, matrix) {
    var n = o.nv !== undefined ? o.nv : o.p.length / 3, ni = o.nv !== undefined ? o.ni : o.i.length, k;
    if (this.pc) this.mark();
    this.grow(n, ni);
    var base = this.nv, e = matrix.elements, q = new THREE.Matrix3().getNormalMatrix(matrix).elements;
    var e0 = e[0], e1 = e[1], e2 = e[2], e4 = e[4], e5 = e[5], e6 = e[6], e8 = e[8], e9 = e[9], e10 = e[10], e12 = e[12], e13 = e[13], e14 = e[14];   // affine: no divide by w
    var q0 = q[0], q1 = q[1], q2 = q[2], q3 = q[3], q4 = q[4], q5 = q[5], q6 = q[6], q7 = q[7], q8 = q[8], P = this.p, NN = this.n, F = this.f, F2 = this.f2, M = this.m, Z = this.z, zn = this.zone, op = o.p, on = o.n, of = o.f, of2 = o.f2, om = o.m;
    for (k = 0; k < n; k++) {
      var x = op[k * 3], y = op[k * 3 + 1], z = op[k * 3 + 2], a = on[k * 3], b = on[k * 3 + 1], c = on[k * 3 + 2], v = base + k;
      P[v * 3] = e0 * x + e4 * y + e8 * z + e12; P[v * 3 + 1] = e1 * x + e5 * y + e9 * z + e13; P[v * 3 + 2] = e2 * x + e6 * y + e10 * z + e14;
      var nx = q0 * a + q3 * b + q6 * c, ny = q1 * a + q4 * b + q7 * c, nz = q2 * a + q5 * b + q8 * c, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      NN[v * 3] = nx / l; NN[v * 3 + 1] = ny / l; NN[v * 3 + 2] = nz / l; F[v * 2] = of[k * 2]; F[v * 2 + 1] = of[k * 2 + 1]; F2[v * 2] = of2[k * 2]; F2[v * 2 + 1] = of2[k * 2 + 1]; M[v] = om[k]; Z[v] = zn;
    }
    var flip = (e[0] * (e[5] * e[10] - e[6] * e[9]) - e[4] * (e[1] * e[10] - e[2] * e[9]) + e[8] * (e[1] * e[6] - e[2] * e[5])) < 0, I = this.i, oi = o.i, t = this.ni;
    for (k = 0; k < ni; k += 3) { I[t + k] = base + oi[k]; if (flip) { I[t + k + 1] = base + oi[k + 2]; I[t + k + 2] = base + oi[k + 1]; } else { I[t + k + 1] = base + oi[k + 1]; I[t + k + 2] = base + oi[k + 2]; } }
    this.nv = base + n; this.ni = t + ni;
  };
  // parametric grid surface: fn(i, j, q) fills q.p (xyz), q.f, q.f2, q.m for grid point (i, j); smooth normals from the grid
  // (fn may set q.nn to give the normal of a point explicitly)
  Builder.prototype.surf = function (nu, nv, fn, wrapU, wrapV) {
    var W = nu + 1, cnt = W * (nv + 1), P = new Float64Array(cnt * 3), NN = null, q = { p: [0, 0, 0], f: [0, 0], f2: [99, 0], m: 0, nn: null }, i, j, v;
    if (this.pc) this.mark();
    this.grow(cnt, nu * nv * 6);
    var base = this.nv, BP = this.p, BN = this.n, F = this.f, F2 = this.f2, M = this.m, Z = this.z, zn = this.zone;
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
      q.f[0] = 0; q.f[1] = 0; q.f2[0] = 99; q.f2[1] = 0; q.nn = null; fn(i, j, q);
      var g = j * W + i; v = base + g;
      P[g * 3] = q.p[0]; P[g * 3 + 1] = q.p[1]; P[g * 3 + 2] = q.p[2]; BP[v * 3] = q.p[0]; BP[v * 3 + 1] = q.p[1]; BP[v * 3 + 2] = q.p[2];
      F[v * 2] = q.f[0]; F[v * 2 + 1] = q.f[1]; F2[v * 2] = q.f2[0]; F2[v * 2 + 1] = q.f2[1]; M[v] = q.m; Z[v] = zn;
      if (q.nn) { if (!NN) NN = []; NN[g] = q.nn; }
    }
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
      v = base + j * W + i;
      if (NN && NN[j * W + i]) { var gn = NN[j * W + i], gl = Math.hypot(gn[0], gn[1], gn[2]) || 1; BN[v * 3] = gn[0] / gl; BN[v * 3 + 1] = gn[1] / gl; BN[v * 3 + 2] = gn[2] / gl; continue; }
      var i0 = i - 1, i1 = i + 1, j0 = j - 1, j1 = j + 1;
      if (i0 < 0) i0 = wrapU ? nu - 1 : 0; if (i1 > nu) i1 = wrapU ? 1 : nu;
      if (j0 < 0) j0 = wrapV ? nv - 1 : 0; if (j1 > nv) j1 = wrapV ? 1 : nv;
      var a = (j * W + i1) * 3, b = (j * W + i0) * 3, c = (j1 * W + i) * 3, d = (j0 * W + i) * 3;
      var ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (l < 1e-9) { nx = 0; ny = 1; nz = 0; l = 1; }
      BN[v * 3] = nx / l; BN[v * 3 + 1] = ny / l; BN[v * 3 + 2] = nz / l;
    }
    var I = this.i, t = this.ni;
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var k = base + j * W + i; I[t++] = k; I[t++] = k + 1; I[t++] = k + W + 1; I[t++] = k; I[t++] = k + W + 1; I[t++] = k + W; }
    this.nv = base + cnt; this.ni = t;
  };
  Builder.prototype.count = function () { return this.nv; };
  // set facade values (aFac2) or the material of everything added since vertex `start`
  Builder.prototype.tag = function (start, a, b) { for (var k = start, N = this.nv; k < N; k++) { if (a !== null) this.f2[k * 2] = a; if (b !== null && b !== undefined) this.f2[k * 2 + 1] = b; } };
  Builder.prototype.mat = function (start, m) { for (var k = start, N = this.nv; k < N; k++) this.m[k] = m; };
  // flip normals from vertex `start` on so they point toward dirFn(x, y, z)
  Builder.prototype.orient = function (start, dirFn) {
    for (var k = start, N = this.nv; k < N; k++) {
      var d = dirFn(this.p[k * 3], this.p[k * 3 + 1], this.p[k * 3 + 2]);
      if (this.n[k * 3] * d[0] + this.n[k * 3 + 1] * d[1] + this.n[k * 3 + 2] * d[2] < 0) { this.n[k * 3] *= -1; this.n[k * 3 + 1] *= -1; this.n[k * 3 + 2] *= -1; }
    }
  };
  var SKY0 = [1, 0.42, 0.2];                     // sky light before the bake: outside, rotunda, wings
  // the used part of a typed array: itself when full, a view when little of it is spare, else a copy that fits
  function bldFit(a, n) { return a.length === n ? a : (a.length - n > (n >> 3) + 64 ? a.slice(0, n) : a.subarray(0, n)); }
  function bldGeometry(Pa, Na, Fa, F2a, Ma, Z, I) {
    var g = new THREE.BufferGeometry(), N = Z.length, ao = new Float32Array(N), sk = new Float32Array(N);
    for (var k = 0; k < N; k++) { ao[k] = 1 + 2 * Z[k]; sk[k] = SKY0[Z[k]] || 1; }
    g.setAttribute("position", new THREE.BufferAttribute(Pa, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(Na, 3));
    g.setAttribute("aFac", new THREE.BufferAttribute(Fa, 2));
    g.setAttribute("aFac2", new THREE.BufferAttribute(F2a, 2));
    g.setAttribute("aMat", new THREE.BufferAttribute(Ma, 1));
    g.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
    g.setAttribute("aSky", new THREE.BufferAttribute(sk, 1));
    g.setAttribute("aLight", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    var mx = 0; for (k = 0; k < I.length; k++) if (I[k] > mx) mx = I[k];
    g.setIndex(new THREE.BufferAttribute(mx > 65535 ? I : new Uint16Array(I), 1)); g.computeBoundingSphere();   // 16-bit indices when they fit, as three.js picks them
    g.userData.zone = Z;
    return g;
  }
  Builder.prototype.build = function () {
    var N = this.nv;
    return bldGeometry(bldFit(this.p, N * 3), bldFit(this.n, N * 3), bldFit(this.f, N * 2), bldFit(this.f2, N * 2), bldFit(this.m, N), bldFit(this.z, N), bldFit(this.i, this.ni));
  };
  // (v0.52) a builder that keeps its pieces (track(): each quad, geometry, surface or builder added is one) is built as
  // chunks by place (buildChunks(S)): a piece goes whole to the S metre square its middle stands in, or to the first chunk
  // when it is wider than that; the camera then draws only the chunks it sees, and as no piece is cut, every point keeps
  // the same neighbours for the bake, which lights it exactly as in one mesh
  Builder.prototype.track = function () { if (window.MARS_ONE_MESH) return this; this.pc = new Uint32Array(4096); this.npc = 0; return this; };   // MARS_ONE_MESH: as before, for tests
  Builder.prototype.mark = function () {
    if (this.npc + 2 > this.pc.length) { var a = new Uint32Array(this.pc.length * 2); a.set(this.pc); this.pc = a; }
    this.pc[this.npc++] = this.nv; this.pc[this.npc++] = this.ni;
  };
  Builder.prototype.buildChunks = function (S) {
    var P = this.p, pc = this.pc, np = this.npc >> 1, nv = this.nv, ni = this.ni, ids = new Map(), ch = [{ nv: 0, ni: 0 }], pcs = new Int32Array(np), k, v, t;
    for (k = 0; k < np; k++) {
      var v0 = pc[k * 2], v1 = k + 1 < np ? pc[k * 2 + 2] : nv, i0 = pc[k * 2 + 1], i1 = k + 1 < np ? pc[k * 2 + 3] : ni;
      if (v1 <= v0) { pcs[k] = -1; continue; }
      var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (v = v0; v < v1; v++) { var x = P[v * 3], z = P[v * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      var c = 0;
      if (x1 - x0 <= S && z1 - z0 <= S) { var key = Math.floor((x0 + x1) / 2 / S) * 65536 + Math.floor((z0 + z1) / 2 / S); c = ids.get(key); if (c === undefined) { c = ch.length; ids.set(key, c); ch.push({ nv: 0, ni: 0 }); } }
      pcs[k] = c; ch[c].nv += v1 - v0; ch[c].ni += i1 - i0;
    }
    var self = this, out = ch.map(function (c) { return { p: new Float32Array(c.nv * 3), n: new Float32Array(c.nv * 3), f: new Float32Array(c.nv * 2), f2: new Float32Array(c.nv * 2), m: new Float32Array(c.nv), z: new Uint8Array(c.nv), i: new Uint32Array(c.ni), nv: 0, ni: 0 }; });
    for (k = 0; k < np; k++) {
      if (pcs[k] < 0) continue;
      var o = out[pcs[k]], a0 = pc[k * 2], a1 = k + 1 < np ? pc[k * 2 + 2] : nv, j0 = pc[k * 2 + 1], j1 = k + 1 < np ? pc[k * 2 + 3] : ni, base = o.nv;
      o.p.set(self.p.subarray(a0 * 3, a1 * 3), base * 3); o.n.set(self.n.subarray(a0 * 3, a1 * 3), base * 3);
      o.f.set(self.f.subarray(a0 * 2, a1 * 2), base * 2); o.f2.set(self.f2.subarray(a0 * 2, a1 * 2), base * 2);
      o.m.set(self.m.subarray(a0, a1), base); o.z.set(self.z.subarray(a0, a1), base);
      for (t = j0; t < j1; t++) o.i[o.ni++] = self.i[t] - a0 + base;
      o.nv += a1 - a0;
    }
    return out.filter(function (o) { return o.nv > 0; }).map(function (o) { return bldGeometry(o.p, o.n, o.f, o.f2, o.m, o.z, o.i); });
  };
  function T(x, y, z, rx, ry, rz, sx, sy, sz) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1)); }

