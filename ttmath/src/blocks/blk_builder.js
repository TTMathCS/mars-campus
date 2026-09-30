  /* Geometry builder: boxes, parametric surfaces and shapes, with facade coordinates, material ids and a light zone */
  // zone: 0 outside, 1 rotunda, 2 wings (set B.zone before adding geometry); it picks the reflection map and sky light
  function Builder() { this.p = []; this.n = []; this.f = []; this.f2 = []; this.m = []; this.i = []; this.z = []; this.zone = 0; }
  Builder.prototype.quad = function (a, b, c, d, nrm, fa, fb, fc, fd, mat) {
    var base = this.p.length / 3, self = this;
    [a, b, c, d].forEach(function (v) { self.p.push(v[0], v[1], v[2]); self.n.push(nrm[0], nrm[1], nrm[2]); self.m.push(mat); self.f2.push(99, 0); self.z.push(self.zone); });
    [fa, fb, fc, fd].forEach(function (v) { self.f.push(v[0], v[1]); });
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
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
    var P = g.attributes.position.array, N = g.attributes.normal.array, UV = g.attributes.uv ? g.attributes.uv.array : null, base = this.p.length / 3, s = facScale || 1;
    var AM = g.attributes.aMat ? g.attributes.aMat.array : null, AF = g.attributes.aFac ? g.attributes.aFac.array : null, AF2 = g.attributes.aFac2 ? g.attributes.aFac2.array : null;
    for (var k = 0; k < P.length / 3; k++) {
      this.p.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); this.n.push(N[k * 3], N[k * 3 + 1], N[k * 3 + 2]);
      if (AF) this.f.push(AF[k * 2], AF[k * 2 + 1]); else this.f.push(UV ? UV[k * 2] * s : 0, UV ? UV[k * 2 + 1] * s : 0);
      if (AF2) this.f2.push(AF2[k * 2], AF2[k * 2 + 1]); else this.f2.push(99, 0);
      this.m.push(AM ? AM[k] : mat); this.z.push(this.zone); this.i.push(base + k);
    }
  };
  // another builder's content, transformed (keeps its facade coordinates in its own metres)
  Builder.prototype.add = function (o, matrix) {
    var base = this.p.length / 3, v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(matrix), e = matrix.elements;
    for (var k = 0; k < o.p.length / 3; k++) {
      v.set(o.p[k * 3], o.p[k * 3 + 1], o.p[k * 3 + 2]).applyMatrix4(matrix); this.p.push(v.x, v.y, v.z);
      v.set(o.n[k * 3], o.n[k * 3 + 1], o.n[k * 3 + 2]).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z);
      this.f.push(o.f[k * 2], o.f[k * 2 + 1]); this.f2.push(o.f2[k * 2], o.f2[k * 2 + 1]); this.m.push(o.m[k]); this.z.push(this.zone);
    }
    var flip = (e[0] * (e[5] * e[10] - e[6] * e[9]) - e[4] * (e[1] * e[10] - e[2] * e[9]) + e[8] * (e[1] * e[6] - e[2] * e[5])) < 0;
    for (k = 0; k < o.i.length; k += 3) { if (flip) this.i.push(base + o.i[k], base + o.i[k + 2], base + o.i[k + 1]); else this.i.push(base + o.i[k], base + o.i[k + 1], base + o.i[k + 2]); }
  };
  // parametric grid surface: fn(i, j, q) fills q.p (xyz), q.f, q.f2, q.m for grid point (i, j); smooth normals from the grid
  // (fn may set q.nn to give the normal of a point explicitly)
  Builder.prototype.surf = function (nu, nv, fn, wrapU, wrapV) {
    var base = this.p.length / 3, W = nu + 1, P = [], NN = null, q = { p: [0, 0, 0], f: [0, 0], f2: [99, 0], m: 0, nn: null }, i, j;
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
      q.f[0] = 0; q.f[1] = 0; q.f2[0] = 99; q.f2[1] = 0; q.nn = null; fn(i, j, q);
      P.push(q.p[0], q.p[1], q.p[2]); this.p.push(q.p[0], q.p[1], q.p[2]);
      this.f.push(q.f[0], q.f[1]); this.f2.push(q.f2[0], q.f2[1]); this.m.push(q.m); this.z.push(this.zone);
      if (q.nn) { if (!NN) NN = []; NN[j * W + i] = q.nn; }
    }
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
      if (NN && NN[j * W + i]) { var gn = NN[j * W + i], gl = Math.hypot(gn[0], gn[1], gn[2]) || 1; this.n.push(gn[0] / gl, gn[1] / gl, gn[2] / gl); continue; }
      var i0 = i - 1, i1 = i + 1, j0 = j - 1, j1 = j + 1;
      if (i0 < 0) i0 = wrapU ? nu - 1 : 0; if (i1 > nu) i1 = wrapU ? 1 : nu;
      if (j0 < 0) j0 = wrapV ? nv - 1 : 0; if (j1 > nv) j1 = wrapV ? 1 : nv;
      var a = (j * W + i1) * 3, b = (j * W + i0) * 3, c = (j1 * W + i) * 3, d = (j0 * W + i) * 3;
      var ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (l < 1e-9) { nx = 0; ny = 1; nz = 0; l = 1; }
      this.n.push(nx / l, ny / l, nz / l);
    }
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var k = base + j * W + i; this.i.push(k, k + 1, k + W + 1, k, k + W + 1, k + W); }
  };
  Builder.prototype.count = function () { return this.p.length / 3; };
  // set facade values (aFac2) or the material of everything added since vertex `start`
  Builder.prototype.tag = function (start, a, b) { for (var k = start, N = this.p.length / 3; k < N; k++) { if (a !== null) this.f2[k * 2] = a; if (b !== null && b !== undefined) this.f2[k * 2 + 1] = b; } };
  Builder.prototype.mat = function (start, m) { for (var k = start, N = this.p.length / 3; k < N; k++) this.m[k] = m; };
  // flip normals from vertex `start` on so they point toward dirFn(x, y, z)
  Builder.prototype.orient = function (start, dirFn) {
    for (var k = start, N = this.p.length / 3; k < N; k++) {
      var d = dirFn(this.p[k * 3], this.p[k * 3 + 1], this.p[k * 3 + 2]);
      if (this.n[k * 3] * d[0] + this.n[k * 3 + 1] * d[1] + this.n[k * 3 + 2] * d[2] < 0) { this.n[k * 3] *= -1; this.n[k * 3 + 1] *= -1; this.n[k * 3 + 2] *= -1; }
    }
  };
  var SKY0 = [1, 0.42, 0.2];                     // sky light before the bake: outside, rotunda, wings
  Builder.prototype.build = function () {
    var g = new THREE.BufferGeometry(), N = this.p.length / 3, ao = new Float32Array(N), sk = new Float32Array(N);
    for (var k = 0; k < N; k++) { ao[k] = 1 + 2 * this.z[k]; sk[k] = SKY0[this.z[k]] || 1; }
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("aFac", new THREE.Float32BufferAttribute(this.f, 2));
    g.setAttribute("aFac2", new THREE.Float32BufferAttribute(this.f2, 2));
    g.setAttribute("aMat", new THREE.Float32BufferAttribute(this.m, 1));
    g.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
    g.setAttribute("aSky", new THREE.BufferAttribute(sk, 1));
    g.setAttribute("aLight", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setIndex(this.i); g.computeBoundingSphere();
    g.userData.zone = this.z;
    return g;
  };
  function T(x, y, z, rx, ry, rz, sx, sy, sz) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1)); }

