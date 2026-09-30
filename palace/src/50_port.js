  /* ==========================================================================================
     Arcadia Spaceport, 30 km east of the Crown (sheet A-501). Plan coordinates on that sheet are
     metres east (x) and north (y) of the terminal; world = (30 000 + x, -y).
     Terminal, control tower, pod station with four pads, three ship pads behind berms with the
     ship from Earth on Pad 2, fuel plant and tank farm, the ice mine with its conveyor, the solar
     field, the buried reactor, the cargo yard, roads and lights.
     ========================================================================================== */
  var PORT = (function () {
    var OX = 30000;
    function W(x, y) { return [OX + x, -y]; }
    function gh(x, z) { return TER.h(x, z); }
    var grp = new THREE.Group(); scene.add(grp);
    function mesh(gb, mat, cast) { var m = new THREE.Mesh(gb.build(), mat); m.frustumCulled = false; grp.add(m); if (cast !== false) SHADOW.caster(m); return m; }

    var mShell = MAT.make({ color: 0xece6dc, rough: 0.55, pat: 1, win: 2, rows: [3.1, 22.4, 1.2, 4.2] });
    var mPanel = MAT.make({ color: 0xe6e0d6, rough: 0.6, pat: 6 });
    var mWhite = MAT.make({ color: 0xe8e4de, rough: 0.42 });
    var mTi = MAT.make({ color: 0xa29d96, rough: 0.34, metal: 1 });
    var mSteel = MAT.make({ color: 0xc9cbcd, rough: 0.24, metal: 1, pat: 4 });
    var mDark = MAT.make({ color: 0x2b2b2d, rough: 0.55 });
    var mPad = MAT.make({ color: 0x9a8a7c, rough: 0.92, pat: 3, vcol: true });
    var mBerm = MAT.make({ color: 0x8e6d57, rough: 1.0 });
    var mGlass = MAT.make({ color: 0x0c1116, rough: 0.06, emis: [0.10, 0.07, 0.045] });
    var mSolar = MAT.make({ color: 0xffffff, rough: 0.2, pat: 2 });
    var mCont = MAT.make({ color: 0xffffff, rough: 0.62, icol: true });
    var mIce = MAT.make({ color: 0xc8d4dc, rough: 0.3 });

    /* ---------------- terminal: a low white dome with a raised drum, slots all round */
    var T0 = gh(OX, 0), g = new GB();
    lathe(g, [[90, -1], [90, 5.6], [88.8, 8.4], [85, 11.6], [78, 14.8], [69, 17.6], [60, 19.4], [55.5, 20]], 160, OX, T0, 0);
    lathe(g, [[55, 19.6], [55, 27.2], [54.2, 28.1]], 128, OX, T0, 0);
    lathe(g, [[54.2, 28.1], [47, 30.6], [36, 32.4], [22, 33.5], [8, 33.9], [0, 34]], 96, OX, T0, 0);
    mesh(g, mShell);
    g = new GB(); lathe(g, [[90.3, 5.4], [90.3, 6.0], [89.2, 6.2]], 160, OX, T0, 0); lathe(g, [[55.3, 27.0], [55.3, 27.6], [54.4, 28.3]], 128, OX, T0, 0); mesh(g, mTi);
    // entrances: four canopies facing the roads
    g = new GB();
    [0, 90, 180, 270].forEach(function (b) { var a = b * D2R, r = 96; boxAt(g, OX + Math.sin(a) * r, T0 + 5.2, Math.cos(a) * r, b % 180 ? 14 : 16, 0.6, b % 180 ? 16 : 14, 0); });
    mesh(g, mTi);
    g = new GB();
    [0, 90, 180, 270].forEach(function (b) { var a = b * D2R, r = 90.4; boxAt(g, OX + Math.sin(a) * r, T0 + 2.4, Math.cos(a) * r, b % 180 ? 1 : 10, 4.6, b % 180 ? 10 : 1, 0); });
    mesh(g, mGlass, false);
    [0, 90, 180, 270].forEach(function (b) { var a = b * D2R; for (var k = -1; k <= 1; k += 2) { var ox = b % 180 ? 0 : k * 6.5, oz = b % 180 ? k * 6.5 : 0; LIGHTS.add(OX + Math.sin(a) * 102 + ox, T0 + 4.8, Math.cos(a) * 102 + oz, LC.warm, 0.7); } });

    /* ---------------- control tower */
    var tw = W(-150, 190), TH = gh(tw[0], tw[1]);
    g = new GB(); lathe(g, [[4.4, -1], [3.7, 8], [3.2, 49], [4.6, 53.2], [8.6, 56.0], [9.4, 56.8]], 48, tw[0], TH, tw[1]);
    lathe(g, [[9.4, 62.2], [8.4, 63.6], [4, 64.3], [1.4, 65], [0.8, 71], [0.25, 77], [0, 77]], 48, tw[0], TH, tw[1]); mesh(g, mWhite);
    g = new GB(); lathe(g, [[9.4, 56.8], [9.9, 59.5], [9.4, 62.2]], 48, tw[0], TH, tw[1]); var twGlass = mesh(g, MAT.make({ color: 0x0c1116, rough: 0.05, emis: [0.35, 0.26, 0.16] }), false);
    LIGHTS.add(tw[0], TH + 77.4, tw[1], LC.red, 1.1, -0.8);

    /* ---------------- pod station: hangar with a barrel roof, four pads on its east side */
    var PS = { x: OX - 385, z: 0, w: 70, l: 120 }, PSH = gh(PS.x, PS.z);
    g = new GB();
    (function () {
      var n = 24, prof = [];
      for (var i = 0; i <= n; i++) { var t = i / n, x = (t - 0.5) * PS.w; prof.push([x, 11 + 6.5 * Math.sqrt(Math.max(0, 1 - Math.pow(x / (PS.w / 2), 2)))]); }
      var z0 = -PS.l / 2, z1 = PS.l / 2;
      for (var j = 0; j < n; j++) {
        var a = prof[j], b = prof[j + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nn = [-dy / L, dx / L, 0];
        g.quad([PS.x + a[0], PSH + a[1], z1], [PS.x + b[0], PSH + b[1], z1], [PS.x + b[0], PSH + b[1], z0], [PS.x + a[0], PSH + a[1], z0], nn, null, null, null, [0, 0], [0, 0], [0, 0], [0, 0]);
        // end walls
        g.quad([PS.x + a[0], PSH - 1, z1], [PS.x + b[0], PSH - 1, z1], [PS.x + b[0], PSH + b[1], z1], [PS.x + a[0], PSH + a[1], z1], [0, 0, 1]);
        g.quad([PS.x + b[0], PSH - 1, z0], [PS.x + a[0], PSH - 1, z0], [PS.x + a[0], PSH + a[1], z0], [PS.x + b[0], PSH + b[1], z0], [0, 0, -1]);
      }
      // side walls
      g.quad([PS.x + PS.w / 2, PSH - 1, z1], [PS.x + PS.w / 2, PSH - 1, z0], [PS.x + PS.w / 2, PSH + 11, z0], [PS.x + PS.w / 2, PSH + 11, z1], [1, 0, 0]);
      g.quad([PS.x - PS.w / 2, PSH - 1, z0], [PS.x - PS.w / 2, PSH - 1, z1], [PS.x - PS.w / 2, PSH + 11, z1], [PS.x - PS.w / 2, PSH + 11, z0], [-1, 0, 0]);
    })();
    mesh(g, mPanel);
    // four hangar doors on the east wall, one per pad, lit inside
    g = new GB(); [-45, -15, 15, 45].forEach(function (z) { boxAt(g, PS.x + PS.w / 2 + 0.3, PSH + 4.2, z, 0.4, 8.4, 16, 0); });
    mesh(g, MAT.make({ color: 0x14161a, rough: 0.3, emis: [0.25, 0.18, 0.12] }), false);
    var POD_PADS = [];
    g = new GB();
    [-80, -27, 27, 80].forEach(function (py, i) {
      var p = W(-300, py), h0 = gh(p[0], p[1]);
      lathe(g, [[13.6, -0.6], [13, 0.2], [12.2, 0.45], [0, 0.45]], 48, p[0], h0, p[1], 0, Math.PI * 2, [0.92, 0.9, 0.88]);
      POD_PADS.push(new THREE.Vector3(p[0], h0 + 0.45, p[1]));
      for (var k = 0; k < 10; k++) { var a = k / 10 * Math.PI * 2; LIGHTS.add(p[0] + Math.sin(a) * 12.6, h0 + 0.6, p[1] + Math.cos(a) * 12.6, i === 3 ? LC.green : LC.white, 0.35); }
    });
    mesh(g, mPad);

    /* ---------------- roads: sintered ribbons that follow the ground */
    function road(pts, w, shade) {
      var gg = new GB(), c = [shade, shade * 0.98, shade * 0.96];
      var P = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 12));
        for (var k = 0; k < n; k++) P.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      }
      P.push(pts[pts.length - 1]);
      for (var j = 0; j < P.length - 1; j++) {
        var p0 = P[j], p1 = P[j + 1], dx = p1[0] - p0[0], dz = p1[1] - p0[1], L2 = Math.hypot(dx, dz) || 1, nx = -dz / L2 * w / 2, nz = dx / L2 * w / 2;
        var y0 = gh(p0[0], p0[1]) + 0.12, y1 = gh(p1[0], p1[1]) + 0.12;
        gg.quad([p0[0] - nx, y0, p0[1] - nz], [p0[0] + nx, y0, p0[1] + nz], [p1[0] + nx, y1, p1[1] + nz], [p1[0] - nx, y1, p1[1] - nz], [0, 1, 0], null, null, null, [0, 0], [1, 0], [1, 1], [0, 1], c);
      }
      var m = mesh(gg, mPad, false); m.renderOrder = 2;
      return P;
    }
    function catm(pts, n) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(function (c) { return 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3); })); }
      }
      out.push(pts[pts.length - 1]); return out;
    }
    function WP(list) { return list.map(function (q) { return W(q[0], q[1]); }); }
    var padsP = [60, 90, 120].map(function (b) { return [1600 * Math.sin(b * D2R), 1600 * Math.cos(b * D2R)]; });
    var mainRoad = road(WP([[92, 0], [1480, 0]]), 12, 0.92);
    [padsP[0], padsP[2]].forEach(function (p) { road(WP(catm([[1000, 0], [1160, p[1] * 0.45], [p[0] - 115, p[1] * 0.96]], 12)), 9, 0.9); });
    road(WP(catm([[380, 0], [470, -110], [545, -230]], 10)), 8, 0.88);
    road(WP([[-92, 0], [-283, 0]]), 9, 0.9);
    road(WP([[-86, -40], [-240, -150], [-420, -150], [-1400, -150]]), 8, 0.86);
    for (var rx = 160; rx <= 1440; rx += 64) { [-7.5, 7.5].forEach(function (oz) { var p = W(rx, oz); LIGHTS.add(p[0], gh(p[0], p[1]) + 5, p[1], LC.warm, 0.5); }); }

    /* ---------------- ship pads with berms, and the ship from Earth on Pad 2 */
    g = new GB(); var gb2 = new GB();
    padsP.forEach(function (pp, i) {
      var p = W(pp[0], pp[1]), h0 = gh(p[0], p[1]);
      lathe(g, [[41, -0.5], [40, 0.4], [39, 0.7], [0, 0.7]], 72, p[0], h0, p[1], 0, Math.PI * 2, [0.95, 0.93, 0.9]);
      lathe(g, [[112, -0.4], [110, 0.08], [41, 0.08]], 72, p[0], h0, p[1], 0, Math.PI * 2, [0.62, 0.55, 0.5]);
      lathe(gb2, [[147, -0.5], [139, 3.4], [132, 5.8], [128, 5.8], [121, 3.6], [114, -0.5]], 96, p[0], h0, p[1]);
      for (var k = 0; k < 24; k++) { var a = k / 24 * Math.PI * 2; LIGHTS.add(p[0] + Math.sin(a) * 39.5, h0 + 0.9, p[1] + Math.cos(a) * 39.5, LC.amber, 0.45); }
      for (var k2 = 0; k2 < 12; k2++) { var a2 = k2 / 12 * Math.PI * 2; LIGHTS.add(p[0] + Math.sin(a2) * 130, h0 + 6.4, p[1] + Math.cos(a2) * 130, LC.red, 0.7, -0.5); }
    });
    mesh(g, mPad, false); mesh(gb2, mBerm);

    var SHIP = (function () {
      var p = W(padsP[1][0], padsP[1][1]), h0 = gh(p[0], p[1]) + 0.7, x = p[0], z = p[1];
      var hull = new GB();
      lathe(hull, [[4.7, 0.6], [4.55, 3.4], [4.55, 38.5], [4.45, 40.8], [4.15, 43.2], [3.65, 45.6], [2.95, 47.9], [2.05, 50.1], [1.05, 51.6], [0.3, 52.3], [0, 52.4]], 64, x, h0, z);
      mesh(hull, mSteel);
      var dark = new GB();
      // engine skirt and three bells
      lathe(dark, [[4.2, 0.2], [4.2, 3.6]], 48, x, h0, z);
      for (var e = 0; e < 3; e++) { var a = e / 3 * Math.PI * 2; lathe(dark, [[1.35, 0.5], [0.95, 1.6], [0.55, 2.8]], 20, x + Math.sin(a) * 2.1, h0, z + Math.cos(a) * 2.1); }
      mesh(dark, mDark);
      // six landing legs and their feet
      var legs = new GB();
      for (var l = 0; l < 6; l++) {
        var b = (l / 6 + 1 / 12) * Math.PI * 2, s = Math.sin(b), c = Math.cos(b);
        var top = new THREE.Vector3(x + s * 4.4, h0 + 11, z + c * 4.4), foot = new THREE.Vector3(x + s * 9.2, h0 + 0.45, z + c * 9.2);
        var mid = top.clone().add(foot).multiplyScalar(0.5), dir = foot.clone().sub(top), L = dir.length();
        var m = new THREE.Matrix4().lookAt(top, foot, new THREE.Vector3(0, 1, 0));
        m.setPosition(mid); m.multiply(new THREE.Matrix4().makeScale(0.9, 0.9, L));
        legs.add(BOXG, m);
        lathe(legs, [[1.7, 0], [1.5, 0.5], [0, 0.5]], 16, foot.x, h0, foot.z);
        var m2 = new THREE.Matrix4().makeRotationY(b).setPosition(x + s * 4.6, h0 + 7, z + c * 4.6).multiply(new THREE.Matrix4().makeScale(0.8, 8, 0.7));
        legs.add(BOXG, m2);
      }
      mesh(legs, mTi);
      // four aft fins
      var fins = new GB();
      for (var f = 0; f < 4; f++) {
        var fb = f / 4 * Math.PI * 2 + Math.PI / 4, fs = Math.sin(fb), fc = Math.cos(fb);
        var fm = new THREE.Matrix4().makeRotationY(fb).setPosition(x + fs * 5.6, h0 + 7.5, z + fc * 5.6).multiply(new THREE.Matrix4().makeScale(0.35, 9, 2.4));
        fins.add(BOXG, fm);
      }
      mesh(fins, mSteel);
      // the passenger deck: a ring of lit windows, and the cargo door
      var win = new GB(); lathe(win, [[4.58, 35.4], [4.58, 36.8]], 64, x, h0, z); mesh(win, MAT.make({ color: 0x0c1116, rough: 0.05, emis: [0.9, 0.62, 0.36] }), false);
      LIGHTS.add(x, h0 + 52.8, z, LC.red, 0.9, -0.6);
      LIGHTS.add(x + 4.8, h0 + 20, z, LC.red, 0.5, -0.6); LIGHTS.add(x - 4.8, h0 + 20, z, LC.red, 0.5, -0.6);
      // floodlights round the pad light the hull from below
      for (var fl = 0; fl < 4; fl++) { var fa = (fl / 4 + 0.125) * Math.PI * 2; LIGHTS.add(x + Math.sin(fa) * 36, h0 + 1.5, z + Math.cos(fa) * 36, LC.white, 1.2); }
      return { pos: new THREE.Vector3(x, h0, z), vents: [new THREE.Vector3(x + 4.6, h0 + 5.5, z), new THREE.Vector3(x - 3.2, h0 + 6.5, z + 3.3), new THREE.Vector3(x, h0 + 30, z - 4.6)] };
    })();

    /* ---------------- fuel plant, tank farm, ice mine and conveyor */
    g = new GB();
    var fp = W(455, 840), fh = gh(fp[0], fp[1]);
    boxAt(g, fp[0], fh + 6, fp[1], 230, 12, 120, 0);
    boxAt(g, fp[0] - 60, fh + 15, fp[1], 60, 6, 60, 0);
    mesh(g, mPanel);
    g = new GB();
    for (var ri = 0; ri < 4; ri++) lathe(g, [[4.2, 12], [4.2, 30], [3.2, 32.5], [0, 33]], 24, fp[0] + 20 + ri * 22, fh, fp[1] - 20);
    lathe(g, [[1.6, 12], [1.3, 46], [1.5, 46.5]], 16, fp[0] + 95, fh, fp[1] + 40);
    mesh(g, mSteel);
    LIGHTS.add(fp[0] + 95, fh + 47, fp[1] + 40, LC.red, 0.9, -0.7);
    // pipe rack from the plant to the tanks
    g = new GB();
    for (var pi = 0; pi < 3; pi++) { var m3 = new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(fp[0] + 175, fh + 5 + pi * 1.4, fp[1] + 10); m3.multiply(new THREE.Matrix4().makeScale(0.7, 120, 0.7)); g.add(CYLG, m3); }
    mesh(g, mTi);
    g = new GB(); var gl = new GB();
    for (var ti = 0; ti < 6; ti++) {
      var tp = W(640 + (ti % 3) * 60, 840 - Math.floor(ti / 3) * 60), th = gh(tp[0], tp[1]);
      g.add(SPHG, new THREE.Matrix4().makeScale(18, 18, 18).setPosition(tp[0], th + 20.5, tp[1]));
      for (var lg = 0; lg < 8; lg++) { var la = lg / 8 * Math.PI * 2; gl.add(CYLG, new THREE.Matrix4().makeScale(0.8, 13, 0.8).setPosition(tp[0] + Math.sin(la) * 15.5, th + 6.5, tp[1] + Math.cos(la) * 15.5)); }
      gl.add(CYLG, new THREE.Matrix4().makeScale(18.3, 0.7, 18.3).setPosition(tp[0], th + 20.5, tp[1]));
    }
    mesh(g, mWhite); mesh(gl, mTi);
    // ice mine: a bucket-wheel excavator and two haul trucks in the pit, a conveyor to the plant
    g = new GB();
    var ex = [29640, -1085], eh = gh(ex[0], ex[1]);
    boxAt(g, ex[0], eh + 5, ex[1], 22, 10, 12, 0.3);
    boxAt(g, ex[0] - 2, eh + 12, ex[1], 10, 5, 8, 0.3);
    var bm = new THREE.Matrix4().makeRotationY(0.3).multiply(new THREE.Matrix4().makeRotationZ(-0.28)).setPosition(ex[0] - 20, eh + 9, ex[1] + 6);
    bm.multiply(new THREE.Matrix4().makeScale(30, 2.2, 2.2)); g.add(BOXG, bm);
    [[29760, -1010, 0.9], [29600, -1110, 2.4]].forEach(function (t) { var hh = gh(t[0], t[1]); boxAt(g, t[0], hh + 2.4, t[1], 11, 3.6, 5.5, t[2]); boxAt(g, t[0] + Math.cos(t[2]) * 5, hh + 4.6, t[1] - Math.sin(t[2]) * 5, 2.6, 2.4, 4.6, t[2]); });
    mesh(g, MAT.make({ color: 0xc9a13e, rough: 0.55 }));
    g = new GB();
    var wm = new THREE.Matrix4().makeRotationY(0.3).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).setPosition(ex[0] - 34, eh + 5, ex[1] + 10.5).multiply(new THREE.Matrix4().makeScale(6, 1.6, 6));
    g.add(CYLG, wm); mesh(g, mDark);
    g = new GB();
    var c0 = [29860, -1050], c1 = [30340, -880], cl = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]), ca = Math.atan2(-(c1[1] - c0[1]), c1[0] - c0[0]);
    boxAt(g, (c0[0] + c1[0]) / 2, 5, (c0[1] + c1[1]) / 2, cl, 1.4, 2.6, ca);
    for (var ci = 0; ci <= cl; ci += 24) { var cx = c0[0] + (c1[0] - c0[0]) * ci / cl, cz = c0[1] + (c1[1] - c0[1]) * ci / cl; boxAt(g, cx, 2.2, cz, 0.6, 5, 2.2, ca); }
    mesh(g, mTi);

    /* ---------------- solar field: 23 rows of panels facing south */
    (function () {
      var rows = 23, per = 101, n = rows * per, im = new THREE.InstancedMesh(BOXG, mSolar, n), m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 35 * D2R), s = new THREE.Vector3(9.6, 0.09, 4.2), p = new THREE.Vector3(), k = 0;
      var posts = new THREE.InstancedMesh(BOXG, mTi, n), mp = new THREE.Matrix4();
      for (var r = 0; r < rows; r++) for (var i = 0; i < per; i++) {
        var x = OX - 705 + i * 10 + 5, z = 660 + r * 22, h = gh(x, z);
        p.set(x, h + 2.4, z); m.compose(p, q, s); im.setMatrixAt(k, m);
        mp.makeScale(0.18, 2.4, 0.18).setPosition(x, h + 1.2, z); posts.setMatrixAt(k, mp); k++;
      }
      im.frustumCulled = false; posts.frustumCulled = false; grp.add(im); grp.add(posts);
    })();

    /* ---------------- buried reactor with radiators and its keep-out fence */
    g = new GB();
    var rp = W(-560, -380), rh = gh(rp[0], rp[1]);
    lathe(g, [[26, -1], [25.2, 2.4], [21.5, 4.3], [12, 5.3], [0, 5.6]], 64, rp[0], rh, rp[1]);
    mesh(g, mWhite);
    g = new GB();
    for (var rd = 0; rd < 6; rd++) boxAt(g, rp[0] + 45 + rd * 7, rh + 5, rp[1] - 30, 0.4, 10, 22, 0);
    mesh(g, MAT.make({ color: 0x34383c, rough: 0.35, metal: 0.6 }));
    (function () {
      var n = 80, im = new THREE.InstancedMesh(BOXG, mTi, n), m = new THREE.Matrix4();
      for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, x = rp[0] + Math.sin(a) * 150, z = rp[1] + Math.cos(a) * 150; m.makeScale(0.2, 2.2, 0.2).setPosition(x, gh(x, z) + 1.1, z); im.setMatrixAt(i, m); }
      im.frustumCulled = false; grp.add(im);
    })();

    /* ---------------- cargo yard: stacked containers */
    (function () {
      var cols = [[0.85, 0.83, 0.8], [0.69, 0.38, 0.23], [0.49, 0.5, 0.51], [0.25, 0.35, 0.47], [0.36, 0.42, 0.29]].map(function (c) { return new THREE.Color(c[0], c[1], c[2]).convertSRGBToLinear(); });
      var list = [];
      [196, 266, 336].forEach(function (z0, yi) {
        for (var i = 0; i < 23; i++) for (var j = 0; j < 4; j++) {
          var hsh = TER.hash12(i * 3.1 + yi * 17, j * 7.3), stack = hsh < 0.25 ? 0 : hsh < 0.6 ? 1 : hsh < 0.88 ? 2 : 3;
          for (var s = 0; s < stack; s++) list.push([OX + 472 + i * 6.4 + 3, z0 + 6 + j * 10, s, Math.floor(TER.hash12(i + s * 5, j + yi * 3) * 5)]);
        }
      });
      var im = new THREE.InstancedMesh(BOXG, mCont, list.length), m = new THREE.Matrix4(), ic = new Float32Array(list.length * 3);
      list.forEach(function (c, i) { var h = gh(c[0], c[1]); m.makeScale(6.05, 2.6, 2.45).setPosition(c[0], h + 1.3 + c[2] * 2.62, c[1]); im.setMatrixAt(i, m); var cc = cols[c[3]]; ic[i * 3] = cc.r; ic[i * 3 + 1] = cc.g; ic[i * 3 + 2] = cc.b; });
      var gI = BOXG.clone(); im.geometry = gI; gI.setAttribute("iCol", new THREE.InstancedBufferAttribute(ic, 3));
      im.frustumCulled = false; grp.add(im); SHADOW.caster(im);
    })();

    /* ---------------- pressurised buses: one at the terminal, one at the ship */
    function bus(x, z, ry) {
      var h = gh(x, z), gg = new GB();
      boxAt(gg, x, h + 2.6, z, 14, 3.4, 4, ry);
      mesh(gg, mWhite);
      var gw = new GB(); boxAt(gw, x, h + 3.1, z, 12.6, 0.9, 4.06, ry); mesh(gw, MAT.make({ color: 0x0c1116, rough: 0.05, emis: [0.5, 0.35, 0.2] }), false);
      var gt = new GB(); for (var w = -1; w <= 1; w++) for (var sd = -1; sd <= 1; sd += 2) { var m = new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeTranslation(w * 4.8, 0, sd * 2)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(1.1, 0.7, 1.1)); m.setPosition(new THREE.Vector3(w * 4.8, 0, sd * 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, h + 1.1, z))); gt.add(CYLG, m); }
      mesh(gt, mDark);
    }
    bus(OX + 150, -3, 0); bus(SHIP.pos.x - 60, 6, 0.1);

    return { grp: grp, ship: SHIP, podPads: POD_PADS, departPad: POD_PADS[3], podStation: PS, W: W, terminal: new THREE.Vector3(OX, T0, 0), tower: new THREE.Vector3(tw[0], TH, tw[1]) };
  })();
