  /* ===================== Pressurized rover ===================== */
  // A crewed pressurized rover of the kind NASA has tested: a cabin on a six-wheel chassis, a wide front window,
  // two suitports on the back, solar panel and radiator on the roof. Parked on the ground, pitched to the terrain.
  function roverBuilder() {
    var L = new Builder(), NA = 36, a = 1.12, b = 0.98, yc = 1.78;
    function sect(th, sx, sy) { var c = Math.cos(th), s = Math.sin(th), p = 4; return [sx * a * Math.sign(c) * Math.pow(Math.abs(c), 2 / p), yc + sy * b * Math.sign(s) * Math.pow(Math.abs(s), 2 / p)]; }
    // cabin: rounded pressure hull, then the front with its window band
    var z0 = -1.85, z1 = 1.25, zn = 2.05, NL = 12;
    L.surf(NA, NL, function (i, j, q) { var th = i / NA * 2 * Math.PI, z = lerp(z0, z1, j / NL), s = sect(th, 1, 1); q.p[0] = s[0]; q.p[1] = s[1]; q.p[2] = z; q.f[0] = z; q.f[1] = th * 1.05; q.m = MT.COMPOSITE; }, true);
    L.surf(NA, 6, function (i, j, q) {
      var th = i / NA * 2 * Math.PI, t = j / 6, z = lerp(z1, zn, Math.sin(t * Math.PI / 2)), sc = Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))) * 0.35 + 0.65 * (1 - t * t * 0.55);
      var s = sect(th, sc, 0.72 + 0.28 * (1 - t * t)); q.p[0] = s[0]; q.p[1] = s[1] - 0.18 * t * t; q.p[2] = z;
      var up = Math.sin(th); q.f[0] = z; q.f[1] = th * 1.05; q.m = (up > 0.05 && up < 0.93 && t > 0.15) || (up > 0.05 && t > 0.8) ? MT.DKGLASS : MT.COMPOSITE;
    }, true);
    // window frame: a dark rim where glass meets the hull
    L.surf(NA, 1, function (i, j, q) { var th = i / NA * 2 * Math.PI, s = sect(th, 1.004, 1.004); q.p[0] = s[0]; q.p[1] = s[1]; q.p[2] = z1 + 0.02 + j * 0.06; q.m = MT.ANOD; }, true);
    // rear bulkhead with two suitports
    L.surf(NA, 6, function (i, j, q) { var th = i / NA * 2 * Math.PI, rho = j / 6, s = sect(th, rho, rho); q.p[0] = s[0]; q.p[1] = yc + (s[1] - yc); q.p[2] = z0 - 0.04 * (1 - rho * rho); q.nn = [0, 0, -1]; q.f[0] = s[0]; q.f[1] = s[1]; q.m = MT.COMPOSITE; }, true);
    [-0.5, 0.5].forEach(function (x) {
      var ring = []; for (var k = 0; k <= 24; k++) { var t = k / 24 * 2 * Math.PI; ring.push(new THREE.Vector3(x + Math.cos(t) * 0.36, 1.72 + Math.sin(t) * 0.42, z0 - 0.07)); }
      tubeAlong(L, ring, 0.045, 6, MT.ANOD);
      L.surf(24, 1, function (i, j, q) { var t = i / 24 * 2 * Math.PI, r = j ? 0.34 : 0.0; q.p[0] = x + Math.cos(t) * r; q.p[1] = 1.72 + Math.sin(t) * r * 1.17; q.p[2] = z0 - 0.06; q.nn = [0, 0, -1]; q.f[0] = q.p[0]; q.f[1] = q.p[1]; q.m = MT.COMPOSITE; }, true);
      tubeAlong(L, [new THREE.Vector3(x - 0.16, 1.62, z0 - 0.11), new THREE.Vector3(x + 0.16, 1.62, z0 - 0.11)], 0.018, 5, MT.STEEL);
    });
    // chassis, fenders, suspension, six wheels
    L.box(-0.95, 0.52, -2.0, 0.95, 0.8, 1.9, MT.ANOD);
    L.box(-1.02, 0.8, -1.95, 1.02, 0.86, 1.6, MT.STEEL);
    [-1.45, 0, 1.45].forEach(function (zz) { [-1, 1].forEach(function (sx) {
      var xw = sx * 1.28, n0 = L.count();
      latheOn(L, 0, 0, 0, [[0.2, -0.21], [0.47, -0.21], [0.55, -0.15], [0.56, -0.05], [0.56, 0.05], [0.55, 0.15], [0.47, 0.21], [0.2, 0.21]], 28, MT.RUBBER, 0.1);
      latheOn(L, 0, 0, 0, [[0.0, 0.22], [0.3, 0.22], [0.34, 0.2], [0.34, -0.2]], 20, MT.ANOD, 0.1);
      // the lathe runs around y: turn it onto the axle (x) and move it into place
      var M = T(xw, 0.56, zz, 0, 0, Math.PI / 2);
      for (var k = n0; k < L.count(); k++) { var v = new THREE.Vector3(L.p[k * 3], L.p[k * 3 + 1], L.p[k * 3 + 2]).applyMatrix4(M), nv = new THREE.Vector3(L.n[k * 3], L.n[k * 3 + 1], L.n[k * 3 + 2]).applyMatrix3(new THREE.Matrix3().getNormalMatrix(M));
        L.p[k * 3] = v.x; L.p[k * 3 + 1] = v.y; L.p[k * 3 + 2] = v.z; L.n[k * 3] = nv.x; L.n[k * 3 + 1] = nv.y; L.n[k * 3 + 2] = nv.z; }
      tubeAlong(L, [new THREE.Vector3(sx * 0.9, 0.7, zz + 0.25), new THREE.Vector3(xw - sx * 0.1, 0.58, zz)], 0.05, 6, MT.STEEL);
      tubeAlong(L, [new THREE.Vector3(sx * 0.9, 0.7, zz - 0.25), new THREE.Vector3(xw - sx * 0.1, 0.58, zz)], 0.05, 6, MT.STEEL);
      tubeAlong(L, [new THREE.Vector3(sx * 0.95, 0.95, zz), new THREE.Vector3(xw - sx * 0.12, 0.62, zz)], 0.035, 6, MT.ANOD);
      var fend = []; for (k = 0; k <= 10; k++) { var t = Math.PI * (0.12 + 0.76 * k / 10); fend.push(new THREE.Vector3(xw, 0.56 + Math.sin(t) * 0.68, zz + Math.cos(t) * 0.68)); }
      L.surf(10, 1, function (i, j, q) { var p = fend[i]; q.p[0] = p.x + (j ? 0.24 : -0.24) * sx; q.p[1] = p.y; q.p[2] = p.z; q.f[0] = i * 0.1; q.f[1] = j * 0.48; q.m = MT.COMPOSITE; });
    }); });
    // roof: solar panel on posts, radiator, mast with a small dish, handrails
    var sb = L.count(); L.box(-0.95, 2.86, -1.55, 0.95, 2.92, 0.7, MT.ANOD); L.surf(1, 1, function (i, j, q) { q.p[0] = (i - 0.5) * 1.86; q.p[1] = 2.925; q.p[2] = lerp(-1.5, 0.65, j); q.nn = [0, 1, 0]; q.f[0] = i * 1.86; q.f[1] = j * 2.15; q.m = MT.SOLAR; });
    [[-0.8, -1.4], [0.8, -1.4], [-0.8, 0.55], [0.8, 0.55]].forEach(function (c) { tubeAlong(L, [new THREE.Vector3(c[0], 2.6, c[1]), new THREE.Vector3(c[0], 2.86, c[1])], 0.03, 5, MT.STEEL); });
    L.box(-1.16, 1.25, -1.2, -1.13, 2.05, 0.6, MT.STEEL); L.box(1.13, 1.25, -1.2, 1.16, 2.05, 0.6, MT.STEEL);
    tubeAlong(L, [new THREE.Vector3(0.62, 2.7, -1.72), new THREE.Vector3(0.62, 3.55, -1.72)], 0.022, 5, MT.STEEL);
    L.geo(addF2(new THREE.SphereGeometry(0.2, 14, 6, 0, Math.PI * 2, 0, 1.0), 0, 0), T(0.62, 3.55, -1.72, -1.9, 0, 0), MT.PLASTIC, 1);
    [-1, 1].forEach(function (sx) { tubeAlong(L, [new THREE.Vector3(sx * 1.14, 2.22, -1.6), new THREE.Vector3(sx * 1.17, 2.25, -0.6), new THREE.Vector3(sx * 1.17, 2.25, 0.6), new THREE.Vector3(sx * 1.14, 2.22, 1.05)], 0.02, 5, MT.STEEL); });
    // headlights and a side hatch
    [-0.42, 0.42].forEach(function (x) { L.geo(addF2(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 14), 0.6, 0), T(x, 1.1, 1.9, Math.PI / 2, 0, 0), MT.LIGHT, 1); });
    var hatch = []; for (var k = 0; k <= 20; k++) { var t2 = k / 20 * 2 * Math.PI; hatch.push(new THREE.Vector3(1.125, 1.75 + Math.sin(t2) * 0.45, -0.25 + Math.cos(t2) * 0.38)); }
    tubeAlong(L, hatch, 0.03, 5, MT.ANOD);
    // dust gathers low on the body: facade value = height above the ground (not on parts whose value is a colour or a brightness)
    for (k = 0; k < L.count(); k++) { var mm = L.m[k]; if (mm !== MT.LIGHT && mm !== MT.PLASTIC) L.f2[k * 2] = L.p[k * 3 + 1]; }
    return L;
  }
  var ROVER_L = null;
  function addRover(B, x, z, yaw) {
    var ca = Math.cos(yaw), sa = Math.sin(yaw);
    function at(lx, lz) { return cgH(x + lx * ca + lz * sa, z - lx * sa + lz * ca); }
    var gf = at(0, 1.45), gb = at(0, -1.45), gl = at(-1.28, 0), gr = at(1.28, 0);
    var y = (gf + gb + gl + gr) / 4 - 0.03, pitch = Math.atan2(gf - gb, 2.9), roll = Math.atan2(gr - gl, 2.56);
    var R = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, yaw, roll, "YXZ")), new THREE.Vector3(1, 1, 1));
    if (!ROVER_L) ROVER_L = roverBuilder();
    B.add(ROVER_L, R);
  }

