  /* ===================== Pressurized expedition rover ===================== */
  // Jim: "the rover is not cool at all". An expedition machine you would want to drive: a long, low cabin with a wedge
  // nose and a wrap-around tinted canopy, on six big wheels with open treads, each on its own swing arm with an orange
  // coil-over strut; a light bar on the roof, a dish on a mast, lockers along the sides, two suitports at the back.
  // Local frame: x across (right +), y up from the ground, z forward; wheels at z -1.95, 0, 1.95 and x +-1.32.
  function roverBuilder() {
    var L = new Builder(), WZ = [-1.95, 0, 1.95], WX = 1.32, WR = 0.62, WW = 0.36;
    function V(x, y, z) { return new THREE.Vector3(x, y, z); }
    function onAxle(n0, M) {                              // turn what was built since n0 by M (lathes run round y)
      var nm = new THREE.Matrix3().getNormalMatrix(M), v = new THREE.Vector3();
      for (var k = n0; k < L.count(); k++) {
        v.set(L.p[k * 3], L.p[k * 3 + 1], L.p[k * 3 + 2]).applyMatrix4(M); L.p[k * 3] = v.x; L.p[k * 3 + 1] = v.y; L.p[k * 3 + 2] = v.z;
        v.set(L.n[k * 3], L.n[k * 3 + 1], L.n[k * 3 + 2]).applyMatrix3(nm).normalize(); L.n[k * 3] = v.x; L.n[k * 3 + 1] = v.y; L.n[k * 3 + 2] = v.z;
      }
    }
    // ---- the cabin: a chamfered body from the rear bulkhead to a wedge nose; cross-section (half width, height) per point
    var SEC = [[0.0, 1.02], [1.12, 1.02], [1.3, 1.2], [1.3, 1.95], [1.16, 2.45], [0.92, 2.78], [0.0, 2.86]];        // right half, bottom to roof
    var ZR = [-2.25, -2.1, -1.2, 0.0, 1.0, 1.7, 2.25, 2.7, 3.0], NA = SEC.length - 1;
    function prof(z) {                                    // how the section shrinks toward the nose (roof down, sides in)
      var t = clamp((z - 1.55) / (3.0 - 1.55), 0, 1), w = 1 - 0.32 * t * t, top = 1 - 0.42 * Math.pow(t, 1.4), back = z < -2.1 ? 0.96 : 1;
      return [w * back, top * back];
    }
    function sec(k, z) { var pr = prof(z), c = SEC[Math.abs(k)]; return [Math.sign(k || 1) * c[0] * pr[0], 1.02 + (c[1] - 1.02) * pr[1]]; }
    // glass: the canopy over the nose and a window band along the sides
    function isGlass(k, z) { var a = Math.abs(k); return (z > 1.62 && a >= 3 && a <= 5) || (z > 2.2 && a >= 2 && a <= 3) || (a === 3 && z > -1.0 && z < 1.4); }
    for (var side = -1; side <= 1; side += 2) {
      for (var a = 0; a < NA; a++) {
        L.surf(1, ZR.length - 1, function (i, j, q) {
          var z = ZR[j], k = (a + i) * side, p = sec(k, z); q.p[0] = p[0]; q.p[1] = p[1]; q.p[2] = z; q.f[0] = z; q.f[1] = p[1];
          q.m = isGlass(a + 0.5, (ZR[Math.max(0, j - 1)] + z) / 2) && isGlass(a + 0.5, z) ? MT.DKGLASS : MT.COMPOSITE;
        });
        if (side < 0) L.orient(L.count() - 2 * ZR.length, function (x, y, z) { return [x, y - 1.9, 0]; });
      }
    }
    // orient every cabin face outward from the cabin's long axis
    // nose cap and rear bulkhead
    var nz = ZR[ZR.length - 1], rz = ZR[0];
    L.surf(2 * NA, 1, function (i, j, q) { var k = i - NA, p = sec(k, nz); q.p[0] = p[0] * (1 - j); q.p[1] = j ? 1.3 : p[1]; q.p[2] = nz + 0.05 * j; q.nn = [0, 0.2, 1]; q.m = MT.COMPOSITE; q.f[0] = p[0]; q.f[1] = p[1]; });
    L.surf(2 * NA, 1, function (i, j, q) { var k = i - NA, p = sec(k, rz); q.p[0] = p[0] * (1 - j); q.p[1] = j ? 1.9 : p[1]; q.p[2] = rz; q.nn = [0, 0, -1]; q.m = MT.COMPOSITE; q.f[0] = p[0]; q.f[1] = p[1]; });
    // orange accent stripe along the beltline, dark sill below
    [-1, 1].forEach(function (sd) {
      L.surf(1, 8, function (i, j, q) { var z = lerp(-2.1, 2.5, j / 8), pr = prof(z); q.p[0] = sd * (1.305 * pr[0] + 0.004); q.p[1] = 1.02 + (1.88 + i * 0.06 - 1.02) * pr[1]; q.p[2] = z; q.nn = [sd, 0, 0]; q.m = MT.PLASTIC; q.f2[0] = 2; });
      var n1 = L.count(); L.box(sd > 0 ? 1.12 : -1.3, 0.98, -2.2, sd > 0 ? 1.3 : -1.12, 1.22, 2.6, MT.ANOD);
    });
    // ---- chassis spine, battery packs, lockers
    L.box(-0.85, 0.66, -2.45, 0.85, 1.02, 2.7, MT.ANOD);
    [-1, 1].forEach(function (sd) { for (var lk = 0; lk < 3; lk++) { var z0 = -1.55 + lk * 1.0; L.box(sd > 0 ? 1.302 : -1.312, 1.25, z0, sd > 0 ? 1.312 : -1.302, 1.62, z0 + 0.86, MT.ANOD);
      L.box(sd > 0 ? 1.312 : -1.318, 1.42, z0 + 0.36, sd > 0 ? 1.318 : -1.312, 1.46, z0 + 0.5, MT.STEEL); } });
    // ---- six wheels: open-tread tyres on dark rims, swing arms, orange coil-over struts
    WZ.forEach(function (zz) { [-1, 1].forEach(function (sx) {
      var n0 = L.count(), hw = WW / 2;
      latheOn(L, 0, 0, 0, [[0.36, -hw], [0.56, -hw], [WR - 0.02, -hw + 0.04], [WR, -hw + 0.08], [WR, hw - 0.08], [WR - 0.02, hw - 0.04], [0.56, hw], [0.36, hw]], 36, MT.RUBBER, 0.1);
      latheOn(L, 0, 0, 0, [[0.0, hw - 0.02], [0.2, hw - 0.02], [0.36, hw - 0.06], [0.36, -hw + 0.06], [0.2, -hw + 0.02], [0.0, -hw + 0.02]], 20, MT.ANOD, 0.1);
      latheOn(L, 0, 0, 0, [[0.0, hw + 0.01], [0.09, hw + 0.01], [0.09, hw - 0.03]], 14, MT.PLASTIC, 2);            // orange hub cap
      for (var g = 0; g < 24; g++) {                     // chevron treads round the tyre
        var th = g / 24 * Math.PI * 2, c = Math.cos(th), s2 = Math.sin(th), r0 = WR - 0.005;
        [[-1, 0.06], [1, -0.06]].forEach(function (e) { L.geo(new THREE.BoxGeometry(0.05, 0.03, hw * 0.95), new THREE.Matrix4().makeRotationY(th).multiply(T(r0, 0, e[0] * hw * 0.48, 0, e[1] * 4, 0)), MT.RUBBER); });
      }
      onAxle(n0, T(sx * WX, WR, zz, 0, 0, Math.PI / 2));
      var piv = V(sx * 0.9, 0.98, zz + 0.55), hub = V(sx * (WX - 0.22), WR, zz);
      tubeAlong(L, [piv, hub], 0.06, 8, MT.ANOD); tubeAlong(L, [V(sx * 0.9, 0.98, zz - 0.15), hub], 0.045, 8, MT.ANOD);
      var top = V(sx * 1.0, 1.32, zz + 0.2), bot = V(sx * (WX - 0.3), WR + 0.12, zz + 0.05), coil = [];
      for (var t = 0; t <= 60; t++) { var u = t / 60, ang = u * Math.PI * 2 * 7, pp = top.clone().lerp(bot, 0.15 + 0.6 * u), ax = bot.clone().sub(top).normalize(), e1 = new THREE.Vector3(1, 0, 0).cross(ax).normalize(), e2 = ax.clone().cross(e1);
        coil.push(pp.add(e1.multiplyScalar(Math.cos(ang) * 0.075)).add(e2.multiplyScalar(Math.sin(ang) * 0.075))); }
      var nc = L.count(); tubeAlong(L, coil, 0.012, 5, MT.PLASTIC, 2);
      tubeAlong(L, [top, bot], 0.03, 8, MT.STEEL);
      var fz = []; for (var f = 0; f <= 12; f++) { var a2 = Math.PI * (0.18 + 0.64 * f / 12); fz.push(V(sx * WX, WR + Math.sin(a2) * (WR + 0.12), zz + Math.cos(a2) * (WR + 0.12))); }
      L.surf(12, 1, function (i, j, q) { var p = fz[i]; q.p[0] = p.x + (j ? 0.24 : -0.24) * sx; q.p[1] = p.y; q.p[2] = p.z; q.f[0] = i * 0.1; q.f[1] = j * 0.48; q.m = MT.COMPOSITE; });
    }); });
    // ---- roof: equipment rack, a light bar over the canopy, a dish on a mast, a radiator panel
    [-1, 1].forEach(function (sd) { tubeAlong(L, [V(sd * 0.8, 2.84, -1.9), V(sd * 0.82, 3.02, -1.7), V(sd * 0.82, 3.02, 0.9), V(sd * 0.78, 2.9, 1.25)], 0.03, 8, MT.ANOD); });
    [-1.6, -0.6, 0.4].forEach(function (zb) { tubeAlong(L, [V(-0.82, 3.02, zb), V(0.82, 3.02, zb)], 0.025, 8, MT.ANOD); });
    var lbn = L.count(); L.box(-0.7, 2.96, 1.22, 0.7, 3.06, 1.34, MT.ANOD);
    var nl = L.count(); L.box(-0.66, 2.97, 1.341, 0.66, 3.05, 1.345, MT.LIGHT); L.tag(nl, 2.4, 0.9);
    L.box(-0.75, 3.04, -1.65, 0.75, 3.07, -0.25, MT.STEEL);
    tubeAlong(L, [V(0.55, 3.02, -2.0), V(0.55, 3.48, -2.0)], 0.025, 6, MT.STEEL);
    var nd = L.count(); latheOn(L, 0, 0, 0, [[0.0, 0.0], [0.12, 0.012], [0.24, 0.05], [0.3, 0.09], [0.29, 0.1], [0.0, 0.03]], 24, MT.PLASTIC, 0);
    onAxle(nd, T(0.55, 3.5, -2.0, -1.1, 0, 0));
    // ---- lights: headlights in the nose, amber markers on the sides, red at the back
    [-0.62, 0.62].forEach(function (x) { var nh = L.count(); L.geo(addF2(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), 2.0, 0.85), T(x, 1.26, 3.04, Math.PI / 2 - 0.25, 0, 0), MT.LIGHT, 1); });
    [-1, 1].forEach(function (sd) { [-1.9, 2.4].forEach(function (z) { var nm = L.count(); L.box(sd * 1.31 - 0.004, 1.1, z, sd * 1.31 + 0.004, 1.16, z + 0.16, MT.LIGHT); L.tag(nm, 0.7, 0.0); }); });
    [-0.9, 0.9].forEach(function (x) { var nr = L.count(); L.box(x - 0.14, 1.5, -2.262, x + 0.14, 1.6, -2.255, MT.LIGHT); L.tag(nr, 0.6, 0.0); });
    // ---- the back: two suitports, a ladder to the roof
    [-0.48, 0.48].forEach(function (x) {
      var ring = []; for (var k = 0; k <= 24; k++) { var t2 = k / 24 * 2 * Math.PI; ring.push(V(x + Math.cos(t2) * 0.34, 1.95 + Math.sin(t2) * 0.42, rz - 0.04)); }
      tubeAlong(L, ring, 0.045, 6, MT.ANOD);
      L.surf(24, 1, function (i, j, q) { var t2 = i / 24 * 2 * Math.PI, r = j ? 0.32 : 0.0; q.p[0] = x + Math.cos(t2) * r; q.p[1] = 1.95 + Math.sin(t2) * r * 1.2; q.p[2] = rz - 0.03; q.nn = [0, 0, -1]; q.f[0] = q.p[0]; q.f[1] = q.p[1]; q.m = MT.COMPOSITE; });
    });
    [-0.2, 0.2].forEach(function (x) { tubeAlong(L, [V(x, 1.1, rz - 0.12), V(x, 2.8, rz - 0.12)], 0.016, 6, MT.STEEL); });
    for (var rg = 0; rg < 6; rg++) tubeAlong(L, [V(-0.2, 1.25 + rg * 0.28, rz - 0.12), V(0.2, 1.25 + rg * 0.28, rz - 0.12)], 0.012, 6, MT.STEEL);
    // dust gathers low on the body: facade value = height above the ground (not on lights or coloured parts)
    for (var kk = 0; kk < L.count(); kk++) { var mm = L.m[kk]; if (mm !== MT.LIGHT && mm !== MT.PLASTIC) L.f2[kk * 2] = L.p[kk * 3 + 1]; }
    return L;
  }
  var ROVER_L = null;
  function addRover(B, x, z, yaw) {
    var ca = Math.cos(yaw), sa = Math.sin(yaw);
    function at(lx, lz) { return cgH(x + lx * ca + lz * sa, z - lx * sa + lz * ca); }
    var gf = at(0, 1.95), gb = at(0, -1.95), gl = at(-1.32, 0), gr = at(1.32, 0);
    var y = (gf + gb + gl + gr) / 4 - 0.03, pitch = Math.atan2(gf - gb, 3.9), roll = Math.atan2(gr - gl, 2.64);
    var R = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, yaw, roll, "YXZ")), new THREE.Vector3(1, 1, 1));
    if (!ROVER_L) ROVER_L = roverBuilder();
    B.add(ROVER_L, R);
  }

