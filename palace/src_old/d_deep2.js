
  /* ============================== caverns, palms and conifers ============================== */
  // merge geometries keeping uvs (for instanced plant models)
  function mergeList(list) {
    var tv = 0, ti = 0; list.forEach(function (g) { tv += g.attributes.position.count; ti += g.index ? g.index.count : g.attributes.position.count; });
    var pos = new Float32Array(tv * 3), nor = new Float32Array(tv * 3), uv = new Float32Array(tv * 2), idx = new Uint32Array(ti), vo = 0, io = 0;
    list.forEach(function (g) {
      var c = g.attributes.position.count, k; pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
      if (g.index) { for (k = 0; k < g.index.count; k++) idx[io + k] = g.index.array[k] + vo; io += g.index.count; } else { for (k = 0; k < c; k++) idx[io + k] = vo + k; io += c; }
      vo += c;
    });
    var out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); out.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.computeBoundingSphere(); return out;
  }
  function tube(x0, y0, z0, x1, y1, z1, r0, r1, n, uvLen) { // a tapered cylinder geometry between two points, uv scaled for bark
    var d = new V3(x1 - x0, y1 - y0, z1 - z0), L = d.length(); d.normalize();
    var g = new THREE.CylinderGeometry(r1, r0, L, n || 8, 2, false), uv = g.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * L / (uvLen || 1.4));
    g.applyMatrix4(new THREE.Matrix4().compose(new V3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d), new V3(1, 1, 1))); return g;
  }
  function cardGeo(w, h, x, y, z, ry, rx, rz, bend) { // a foliage card, normals bent away from a centre
    var g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(mat4(x, y, z, ry, 1, 1, 1, rx, rz).clone());
    if (bend) { var p = g.attributes.position, n = g.attributes.normal; for (var i = 0; i < p.count; i++) { _sd.set(p.getX(i) - bend[0], (p.getY(i) - bend[1]) * 0.6, p.getZ(i) - bend[2]).normalize(); n.setXYZ(i, _sd.x, _sd.y, _sd.z); } }
    return g;
  }
  function coniferModel(h, seed) {
    var r = mulberry(seed), trunk = [tube(0, -0.5, 0, (r() - 0.5) * 0.6, h, (r() - 0.5) * 0.6, h * 0.035, h * 0.006, 14, 2)], fol = [];
    var n = Math.round(46 + h * 1.4);
    for (var k = 0; k < n; k++) {
      var t = 0.32 + 0.68 * Math.pow(k / n, 0.9), yy = t * h, rad = (1 - t) * h * 0.2 + 0.5, a = r() * 6.28 + k * 2.4, w = rad * 1.5 + 1.2;
      fol.push(cardGeo(w, w * 0.9, Math.cos(a) * rad * 0.55, yy, Math.sin(a) * rad * 0.55, -a + Math.PI / 2, -0.35 - r() * 0.4, (r() - 0.5) * 0.4, [0, yy + 1, 0]));
    }
    return { trunk: mergeList(trunk), fol: mergeList(fol) };
  }
  function palmModel(h, seed) {
    var r = mulberry(seed), lean = 0.8 + r() * 1.6, dir = r() * 6.28, pts = [], trunk = [], fol = [];
    for (var i = 0; i <= 8; i++) { var t = i / 8, off = Math.pow(t, 1.8) * lean; pts.push([Math.cos(dir) * off, t * h, Math.sin(dir) * off]); }
    for (var j = 0; j < 8; j++) trunk.push(tube(pts[j][0], pts[j][1], pts[j][2], pts[j + 1][0], pts[j + 1][1], pts[j + 1][2], 0.3 - j * 0.015, 0.29 - (j + 1) * 0.015, 10, 0.9));
    var top = pts[8];
    for (var f = 0; f < 15; f++) {
      var a = f / 15 * 6.28 + r() * 0.3, droop = 0.25 + r() * 0.55 + (f % 2) * 0.2, L = 4.4 + r() * 1.2;
      var g = new THREE.PlaneGeometry(L, 1.5, 6, 1), p = g.attributes.position;
      for (var q = 0; q < p.count; q++) { var x = p.getX(q) + L / 2, tt = x / L; p.setXYZ(q, x, p.getY(q) * 0.5 - tt * tt * L * droop, p.getZ(q) + p.getY(q) * 0.8); }
      g.computeVertexNormals(); g.applyMatrix4(mat4(top[0], top[1], top[2], -a, 1, 1, 1));
      var nn = g.attributes.normal; for (var q2 = 0; q2 < nn.count; q2++) { var nx = nn.getX(q2), ny = nn.getY(q2), nz = nn.getZ(q2); if (ny < 0) nn.setXYZ(q2, -nx, -ny, -nz); }
      fol.push(g);
    }
    return { trunk: mergeList(trunk), fol: mergeList(fol), top: top };
  }
  function flipGeo(g) { var ix = g.index.array; for (var i = 0; i < ix.length; i += 3) { var t = ix[i]; ix[i] = ix[i + 2]; ix[i + 2] = t; } var n = g.attributes.normal; for (var k = 0; k < n.count; k++) n.setXYZ(k, -n.getX(k), -n.getY(k), -n.getZ(k)); return g; }
  function depthFor(mat) { return new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: mat.alphaTest }); }
  // instanced plants: models [{trunk, fol}], placements [[x, y, z, ry, s], ...]
  function plantMany(models, places, trunkMat, folMat) {
    var groups = models.map(function () { return []; }); places.forEach(function (p, i) { groups[i % models.length].push(p); });
    var o = new THREE.Object3D();
    models.forEach(function (m, mi) {
      var list = groups[mi]; if (!list.length) return;
      [[m.trunk, M[trunkMat]], [m.fol, M[folMat]]].forEach(function (pair) {
        if (!pair[0].attributes.position) return;
        var im = new THREE.InstancedMesh(pair[0], pair[1], list.length);
        list.forEach(function (p, k) { o.position.set(p[0], p[1], p[2]); o.rotation.set(0, p[3], 0); o.scale.setScalar(p[4]); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
        im.castShadow = true; im.receiveShadow = true; if (pair[1].alphaTest) im.customDepthMaterial = depthFor(pair[1]); im.frustumCulled = false; put(im);
      });
    });
  }
  function cardsMany(mat, w, h, places) { // crossed cards (ferns, grass tufts)
    var g = mergeList([cardGeo(w, h, 0, h / 2, 0, 0, 0, 0), cardGeo(w, h, 0, h / 2, 0, Math.PI / 2, 0, 0), cardGeo(w, h, 0, h / 2, 0, Math.PI / 4, 0, 0)]);
    var n = g.attributes.normal; for (var i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    plantMany([{ trunk: new THREE.BufferGeometry(), fol: g }], places, "leaf", mat);
  }
  // a lava-tube cavern: axis "x" or "z", full height between a0 and a1, rounded ends
  function cavern(o) {
    var cap = o.cap || o.W * 0.55, A0 = o.a0 - cap, A1 = o.a1 + cap, na = Math.max(10, Math.round((A1 - A0) / 4)), nb = 44, pos = [], idx = [];
    for (var i = 0; i <= na; i++) {
      var A = A0 + (A1 - A0) * i / na, s = A < o.a0 ? Math.sqrt(Math.max(0, 1 - Math.pow((o.a0 - A) / cap, 2))) : A > o.a1 ? Math.sqrt(Math.max(0, 1 - Math.pow((A - o.a1) / cap, 2))) : 1;
      for (var j = 0; j <= nb; j++) {
        var th = -0.14 + (Math.PI + 0.28) * j / nb, cx = -Math.cos(th), cy = Math.sin(th);
        var nx = cx / o.W, ny = cy / o.Hh, nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        var dsp = (fbm(A / 14, th * 2.2, 4, o.seed) - 0.5) * 7 + ridged(A / 7, th * 4, 3, o.seed + 3) * 2.2;
        var ac = cx * o.W * (0.35 + 0.65 * s) + nx * dsp * s, h = Math.max(-1.5, cy * o.Hh * s + ny * dsp * s);
        if (o.axis === "x") pos.push(A, o.y0 + h, o.c + ac); else pos.push(o.c + ac, o.y0 + h, A);
      }
    }
    for (var a = 0; a < na; a++) for (var b = 0; b < nb; b++) { var p0 = a * (nb + 1) + b, p1 = p0 + nb + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    addGeo("rockWall", g, null, null, true);
  }
  function boulder(mat, x, y, z, s, seed) {
    var g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
    for (var i = 0; i < p.count; i++) { var vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 0.75 + 0.5 * vnoise(vx * 2.1 + seed, vz * 2.1 + vy * 1.7, seed); p.setXYZ(i, vx * k, vy * k * 0.7, vz * k); }
    g.computeVertexNormals(); geoAt(mat, g, x, y, z, seed, null, 0, 0, s);
  }
  // a path of lanterns: posts with glowing tops
  function lantern(x, y, z) { cyl("darkMetal", 0.06, 1.1, x, y, z, 8); rbox("glass", 0.24, 0.3, 0.24, x, y + 1.1, z, 0, 0.02); sph("lamp", 0.07, x, y + 1.25, z, 8); cyl("darkMetal", 0.16, 0.04, x, y + 1.4, z, 4); }

  /* ============================== L2 · the Grotto ============================== */
  var GRO = { x0: 96, x1: 396, cz: -50, W: 60, H: 23, lake: { x: 250, z: -56, rx: 105, rz: 32 } };
  function buildGrotto() {
    ZONE = "deep2"; var y = 0, L = GRO.lake; YOFF = LVY[2];
    M.travertine = M.travertine || (function () { var m = std(0xf6e6cc, 1); m.color.convertSRGBToLinear(); var t = TX.sinter; m.map = t.map; m.normalMap = t.normalMap; m.roughnessMap = t.roughnessMap; TEXMAP.travertine = ["sinter", 1.6, 0.8]; return m; })();
    M.lagoon = M.lagoon || (function () { var m = M.waterBlue.clone(); m.color.setRGB(0.05, 0.36, 0.36); m.opacity = 0.72; m.onBeforeCompile = M.waterBlue.onBeforeCompile; return m; })();
    // tunnel from the atrium
    hall({ lv: 2, x0: AC.x + ATR.r1 - 0.6, x1: 104, z0: AC.z - 4, z1: AC.z + 4, y: y, h: 6, floor: "slate", wall: "rockWall", ceil: "rockWall", open: { w: true, e: true }, cove: true, downs: 5 });
    droom(2, "tun2", "Grotto tunnel", "grotto", rr(AC.x + ATR.r1 - 1, 106, AC.z - 4, AC.z + 4), 6, { kind: "link" });
    cavern({ axis: "x", a0: GRO.x0, a1: GRO.x1, c: GRO.cz, W: GRO.W, Hh: GRO.H, y0: y, seed: 21 });
    droom(2, "grotto", "The Grotto", "grotto", rr(GRO.x0 - 4, GRO.x1 + 4, GRO.cz - GRO.W + 7, GRO.cz + GRO.W - 7), 22);
    // beach with a lagoon cut into it
    var bs = new THREE.Shape(), zA = -(GRO.cz - 64), zB = -(GRO.cz + 64); bs.moveTo(GRO.x0 - 40, zA); bs.lineTo(GRO.x1 + 40, zA); bs.lineTo(GRO.x1 + 40, zB); bs.lineTo(GRO.x0 - 40, zB); bs.lineTo(GRO.x0 - 40, zA);
    var lh = new THREE.Path(); lh.absellipse(L.x, -L.z, L.rx, L.rz, 0, Math.PI * 2, true, 0); bs.holes.push(lh);
    var sg = new THREE.ShapeGeometry(bs, 64); sg.rotateX(-Math.PI / 2); addGeo("sand", sg, mat4(0, y, 0, 0, 1, 1, 1));
    var bed = flipGeo(new THREE.SphereGeometry(1, 64, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)); bed.scale(L.rx, 3, L.rz); addGeo("sand", bed, mat4(L.x, y, L.z, 0, 1, 1, 1));
    var wg = new THREE.CircleGeometry(1, 96); wg.scale(L.rx * 0.998, L.rz * 0.998, 1); wg.rotateX(-Math.PI / 2); worldUV(wg, 4); var wm = new THREE.Mesh(wg, M.lagoon); wm.position.set(L.x, y - 0.25, L.z); wm.receiveShadow = true; put(wm);
    DBLOCKS[2].push(["e", L.x, L.z, L.rx + 0.5, L.rz + 0.5]);
    // LED sky canopy with a bronze rim, hung under the rock
    var sky = skyDome(0, 246, y + 10, GRO.cz, 128, 11, 44); DEEPDYN.grottoSky = sky;
    for (var e = 0; e < 96; e++) { var a0 = e / 96 * Math.PI * 2, a1 = (e + 1) / 96 * Math.PI * 2; seg("goldDark", 246 + Math.cos(a0) * 128, y + 10, GRO.cz + Math.sin(a0) * 44, 246 + Math.cos(a1) * 128, y + 10, GRO.cz + Math.sin(a1) * 44, 0.18, 0.18, 6); }
    for (var cb = 0; cb < 10; cb++) { var ca = cb / 10 * Math.PI * 2, px = 246 + Math.cos(ca) * 128, pz = GRO.cz + Math.sin(ca) * 44; seg("darkMetal", px, y + 10, pz, px + Math.cos(ca) * 8, y + 22, pz + Math.sin(ca) * 8, 0.08, 0.08, 6); }
    // palms along the shore
    var palms = [palmModel(11, 1), palmModel(13, 2), palmModel(9.5, 3)], pp = [], rg = mulberry(2020);
    for (var p = 0; p < 90 && pp.length < (MOBILE ? 30 : 46); p++) {
      var pa = rg() * Math.PI * 2, pr = 1.12 + rg() * 0.35, px2 = L.x + Math.cos(pa) * L.rx * pr, pz2 = L.z + Math.sin(pa) * L.rz * pr;
      if (px2 < GRO.x0 + 10 || px2 > GRO.x1 - 5 || Math.abs(pz2 - GRO.cz) > GRO.W - 12) continue;
      if (px2 < 150 && pz2 > -30) continue; // keep the beach house clear
      pp.push([px2, y, pz2, rg() * 6.28, 0.85 + rg() * 0.35]);
    }
    plantMany(palms, pp, "trunk", "leafPalm");
    cardsMany("leafGrass", 1.2, 0.8, pp.map(function (q) { return [q[0] + 1.2, y, q[2] + 0.8, q[3], 1]; }));
    // beach house: a teak deck under a timber roof, daybeds, a bar
    var bx0 = 106, bx1 = 142, bz0 = -30, bz1 = -12;
    rbox("floorOak", bx1 - bx0, 0.35, bz1 - bz0, (bx0 + bx1) / 2, y, (bz0 + bz1) / 2, 0, 0.02);
    for (var cx = bx0 + 1; cx <= bx1 - 1; cx += 5) [bz0 + 1, bz1 - 1].forEach(function (cz) { rbox("wood", 0.3, 4.6, 0.3, cx, y + 0.35, cz, 0, 0.03); });
    rbox("wood", bx1 - bx0 + 2, 0.35, bz1 - bz0 + 2, (bx0 + bx1) / 2, y + 4.95, (bz0 + bz1) / 2, 0, 0.05); for (var rb2 = bx0; rb2 <= bx1; rb2 += 1.2) box("woodDark", 0.12, 0.25, bz1 - bz0 + 1.6, rb2, y + 4.7, (bz0 + bz1) / 2);
    YOFF += 0.35;
    [[112, -24], [118, -24], [124, -24]].forEach(function (d) { var df = new F(d[0], d[1], Math.PI); df.rbox("wood", 2.4, 0.3, 2.2, 0, 0, 0, 0.03).rbox("fabWhite", 2.3, 0.2, 2.1, 0, 0.3, 0, 0.08).rbox("fabSand", 0.6, 0.4, 0.2, -0.6, 0.5, -0.9, 0.08).rbox("fabSand", 0.6, 0.4, 0.2, 0.6, 0.5, -0.9, 0.08).blob(2.8, 2.6, 0, 0, 0.5); });
    sofa(131, -22, Math.PI, 3, "fabWhite", "fabWhite"); tableRound(131, -19.8, 0.6, 0.4, "wood");
    rbox("travertine", 6, 1.1, 1, 137, y, -15, 0, 0.03); rbox("wood", 6.1, 0.06, 1.1, 137, y + 1.1, -15, 0, 0.01); [134.8, 136.3, 137.8, 139.3].forEach(function (sx) { stool(sx, -16.2, "fabWhite"); });
    for (var ln = 0; ln < 6; ln++) pendant(110 + ln * 6, y + 3.2, -21);
    YOFF -= 0.35;
    // boardwalk with lanterns along the north shore
    for (var bw = 104; bw < 330; bw += 3.2) { var bzz = GRO.cz + 30 + Math.sin(bw / 40) * 3; rbox("floorOak", 3.1, 0.18, 3, bw, y + 0.05, bzz, 0, 0.01); if (Math.round(bw) % 16 < 3.2) lantern(bw, y + 0.23, bzz - 1.9); }
    // hot springs: travertine terraces stepping down to the lagoon
    [[122, -94, 7, 1.8], [132, -88, 6, 1.2], [141, -82, 5.5, 0.6], [149, -76, 5, 0.1]].forEach(function (t, i) {
      lathe("travertine", [[0, t[3] - 0.9], [t[2] - 0.4, t[3] - 0.9], [t[2], t[3] - 0.4], [t[2] + 0.2, t[3] + 0.08], [t[2] + 1.2, t[3] + 0.05], [t[2] + 1.6, -0.2]], t[0], y, t[1], 48);
      var sg2 = new THREE.CircleGeometry(t[2], 48); sg2.rotateX(-Math.PI / 2); worldUV(sg2, 3); var sm = new THREE.Mesh(sg2, M.lagoon); sm.position.set(t[0], y + t[3] - 0.08, t[1]); put(sm);
      DBLOCKS[2].push(["c", t[0], t[1], t[2] + 0.3]);
    });
    DEEPDYN.steam = (DEEPDYN.steam || []).concat([{ x: 122, z: -94, y: YOFF + y + 1.8, w: 10, d: 10, lv: 2 }, { x: 136, z: -85, y: YOFF + y + 1, w: 12, d: 8, lv: 2 }]);
    // the waterfall at the far end
    var fx = 372, fz = -56;
    for (var rk = 0; rk < 26; rk++) { var rgn = mulberry(rk + 5); boulder("rock", fx + 4 + rgn() * 10, y + rgn() * 16, fz - 16 + rk * 1.25, 3 + rgn() * 3, rk); }
    boulder("rock", fx + 8, y + 18, fz, 9, 3); boulder("rock", fx + 6, y + 8, fz - 9, 7, 4); boulder("rock", fx + 6, y + 8, fz + 9, 7, 5);
    var fallMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uT; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); } void main(){ float s = n(vec2(vUv.x * 40.0, vUv.y * 3.0 + uT * 2.2)) * 0.6 + n(vec2(vUv.x * 90.0, vUv.y * 8.0 + uT * 3.1)) * 0.4; float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x); float a = (0.35 + s * 0.65) * edge; gl_FragColor = vec4(vec3(0.75, 0.88, 0.95) * (0.8 + s * 0.8), a * 0.85); }"
    });
    var fall = new THREE.Mesh(new THREE.PlaneGeometry(9, 18), fallMat); fall.position.set(fx + 1.2, y + 9, fz); fall.rotation.y = -Math.PI / 2; put(fall); DEEPDYN.fall = fallMat;
    DEEPDYN.mist = { x: fx - 3, y: YOFF + y, z: fz, lv: 2 };
    // a small electric launch on the lagoon
    var boat = new THREE.Group(), hull = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.6, 0.15), new THREE.Vector2(0.9, 0.55), new THREE.Vector2(0.95, 0.75)], 24); hull.scale(1, 1, 3.4);
    boat.add(new THREE.Mesh(hull, M.white)); var deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 5.4), M.cedar); deck.position.y = 0.72; boat.add(deck);
    var seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.7), M.fabWhite); seat.position.set(0, 0.9, -0.8); boat.add(seat);
    boat.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); boat.position.set(230, y - 0.55, -44); boat.rotation.y = 1.2; put(boat); DEEPDYN.boat = boat;
    // rocks round the cavern edge
    var rgb = mulberry(77); for (var bd = 0; bd < 60; bd++) { var ba = rgb() * Math.PI * 2, bxx = 246 + Math.cos(ba) * 150 * (0.95 + rgb() * 0.1), bzz2 = GRO.cz + Math.sin(ba) * 55 * (0.92 + rgb() * 0.1); boulder("rock", bxx, y + 0.3, bzz2, 1 + rgb() * 3, bd + 40); }
    lightsAt([[124, y + 3.5, -21], [136, y + 3.5, -16], [130, y + 3, -88], [200, y + 3, -18], [270, y + 3, -18], [360, y + 4, -56], [104, y + 4, AC.z]]);
    INTER.push({ kind: "sit", x: 118, z: -24, lv: 2, r: 1.8, label: "Lie on the daybed", look: [240, YOFF + y + 4, -60], sitY: YOFF + y + 0.35 + 0.95 });
    YOFF = 0; ZONE = "surface";
  }

  /* ============================== L3 · Living Earth: forest and farms ============================== */
  var FOR = { a0: -330, a1: -140, cx: 40, W: 70, H: 30 };
  function streamX(z) { return FOR.cx + 16 * Math.sin((z + 140) / 26) + 6 * Math.sin((z + 140) / 11); }
  function buildForest() {
    ZONE = "deep3"; var y = 0; YOFF = LVY[3];
    hall({ lv: 3, x0: AC.x - 4, x1: AC.x + 4, z0: -124, z1: AC.z - ATR.r1 + 0.6, y: y, h: 6, floor: "slate", wall: "rockWall", ceil: "rockWall", open: { n: true, s: true }, downs: 5 });
    droom(3, "tun3", "Forest tunnel", "forest", rr(AC.x - 4, AC.x + 4, -125, AC.z - ATR.r1 + 0.2), 6, { kind: "link" });
    cavern({ axis: "z", a0: FOR.a0, a1: FOR.a1, c: FOR.cx, W: FOR.W, Hh: FOR.H, y0: y, seed: 33 });
    droom(3, "forest", "The forest", "forest", rr(FOR.cx - FOR.W + 8, FOR.cx + FOR.W - 8, FOR.a0 - 25, FOR.a1 + 22), 30);
    var gf = new THREE.PlaneGeometry(FOR.W * 2 + 20, FOR.a1 - FOR.a0 + 90); gf.rotateX(-Math.PI / 2); addGeo("grassFloor", gf, mat4(FOR.cx, y, (FOR.a0 + FOR.a1) / 2, 0, 1, 1, 1));
    skyDome(1, FOR.cx, y + 14, (FOR.a0 + FOR.a1) / 2, 52, 14, 118);
    // stream: a ribbon of water with stepping stones and a bridge
    var sp = [], su = [], si = [], ns = 80;
    for (var i = 0; i <= ns; i++) { var z = FOR.a0 - 20 + (FOR.a1 - FOR.a0 + 40) * i / ns, x = streamX(z), w = 2.2 + Math.sin(i * 0.7) * 0.6; sp.push(x - w, y + 0.03, z, x + w, y + 0.03, z); su.push(0, z / 4, w / 2, z / 4); if (i < ns) { var b = i * 2; si.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
    var stg = new THREE.BufferGeometry(); stg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); stg.setAttribute("uv", new THREE.Float32BufferAttribute(su, 2)); stg.setIndex(si); stg.computeVertexNormals();
    var sm = new THREE.Mesh(stg, M.lagoon); sm.receiveShadow = true; put(sm);
    for (var st = FOR.a0; st < FOR.a1; st += 5) { var rs = mulberry(Math.round(st)); boulder("rock", streamX(st) + (rs() - 0.5) * 7, y, st, 0.5 + rs() * 0.8, Math.round(st)); }
    var bz = -225, bxs = streamX(bz);
    rbox("wood", 7, 0.15, 2.2, bxs, y + 0.55, bz, 0, 0.02); [-3.2, 3.2].forEach(function (d) { rbox("wood", 0.15, 0.8, 0.15, bxs + d, y, bz - 1, 0, 0.02); rbox("wood", 0.15, 0.8, 0.15, bxs + d, y, bz + 1, 0, 0.02); }); box("wood", 7, 0.08, 0.1, bxs, y + 1.5, bz - 1); box("wood", 7, 0.08, 0.1, bxs, y + 1.5, bz + 1);
    // conifers, big and many, away from the stream and the clearing
    var models = [coniferModel(26, 5), coniferModel(32, 6), coniferModel(21, 7)], places = [], rg = mulberry(3131), clear = { x: FOR.cx - 22, z: -235, r: 20 };
    for (var t = 0; t < 400 && places.length < (MOBILE ? 60 : 110); t++) {
      var tz = FOR.a0 - 18 + rg() * (FOR.a1 - FOR.a0 + 30), tx = FOR.cx + (rg() - 0.5) * (FOR.W * 1.7);
      if (Math.abs(tx - streamX(tz)) < 6 || Math.hypot(tx - clear.x, tz - clear.z) < clear.r || (Math.abs(tx - AC.x) < 7 && tz > -175)) continue;
      places.push([tx, y - 0.3, tz, rg() * 6.28, 0.75 + rg() * 0.45]);
    }
    plantMany(models, places, "trunk", "leafConifer");
    var ferns = []; for (var f = 0; f < (MOBILE ? 160 : 360); f++) { var fz = FOR.a0 + rg() * (FOR.a1 - FOR.a0), fx = FOR.cx + (rg() - 0.5) * FOR.W * 1.6; if (Math.abs(fx - streamX(fz)) < 3.5) continue; ferns.push([fx, y, fz, rg() * 6.28, 0.7 + rg() * 0.7]); }
    cardsMany("leafFern", 1.6, 1.1, ferns);
    var tufts = []; for (var g = 0; g < 240; g++) { var ga = rg() * 6.28, gr = Math.sqrt(rg()) * clear.r; tufts.push([clear.x + Math.cos(ga) * gr, y, clear.z + Math.sin(ga) * gr, rg() * 6.28, 0.6 + rg() * 0.6]); }
    cardsMany("leafGrass", 1.0, 0.6, tufts);
    // the rain room: a glass pavilion where it rains on the hour
    var rx = clear.x, rz = clear.z;
    rbox("slate", 9, 0.2, 9, rx, y, rz, 0, 0.02); [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]].forEach(function (c) { rbox("steel", 0.14, 4.2, 0.14, rx + c[0], y + 0.2, rz + c[1], 0, 0.02); });
    box("glass", 8.8, 4, 0.05, rx, y + 0.2, rz - 4.4); box("glass", 0.05, 4, 8.8, rx - 4.4, y + 0.2, rz); box("glass", 0.05, 4, 8.8, rx + 4.4, y + 0.2, rz); box("glass", 3, 4, 0.05, rx - 2.9, y + 0.2, rz + 4.4); box("glass", 3, 4, 0.05, rx + 2.9, y + 0.2, rz + 4.4);
    rbox("steel", 9.2, 0.2, 9.2, rx, y + 4.2, rz, 0, 0.03); for (var nz = -3; nz <= 3; nz += 1.5) for (var nx = -3; nx <= 3; nx += 1.5) cyl("steel", 0.05, 0.05, rx + nx, y + 4.15, rz + nz, 8);
    rbox("wood", 2.6, 0.45, 0.6, rx, y + 0.2, rz + 1.8, 0, 0.03); lathe("wood", [[0, 0], [0.5, 0], [0.5, 0.45], [0, 0.45]], rx + 2.4, y + 0.2, rz - 1.5, 20);
    DEEPDYN.rainRoom = { x: rx, z: rz, y: YOFF + y + 0.2, lv: 3 };
    INTER.push({ kind: "rain", x: rx, z: rz + 1, lv: 3, r: 3.5, label: "Stand in the rain" });
    // a picnic deck by the stream
    var dz = -185, dx = streamX(dz) + 9; rbox("floorOak", 8, 0.3, 6, dx, y, dz, 0, 0.02); YOFF += 0.3; lounger(dx - 2, dz, Math.PI / 2 + 0.4, "fabMoss"); lounger(dx - 2, dz + 2.2, Math.PI / 2 + 0.2, "fabMoss"); tableRound(dx + 1.5, dz + 1, 0.6, 0.72, "wood"); YOFF -= 0.3;
    lightsAt([[rx, y + 3.5, rz], [dx, y + 3, dz], [AC.x, y + 4, -130], [FOR.cx, y + 6, -170], [FOR.cx, y + 6, -290]]);
    // ---------- vertical farms and aquaculture (west of the atrium) ----------
    var fx0 = -50, fx1 = 0, fz0 = -66, fz1 = -8, FH = 22;
    hall({ lv: 3, x0: 0, x1: AC.x - ATR.r1 + 0.6, z0: GZ0, z1: GZ1, y: y, h: 5, floor: "concrete", wall: "concrete", open: { w: true, e: true }, downs: 4 });
    droom(3, "corW3", "Farm hall", "farms", rr(-0.5, AC.x - ATR.r1 + 0.2, GZ0, GZ1), 5, { kind: "link" });
    hall({ lv: 3, x0: fx0, x1: fx1, z0: fz0, z1: fz1, y: y, h: FH, floor: "concrete", wall: "concrete", ceil: "concrete", doors: { e: [[GZ0 + 1, GZ1 - 1, 4.4]] }, downs: false, cove: false });
    droom(3, "farms", "Vertical farms", "farms", rr(fx0, fx1, fz0, fz1), FH);
    for (var tx2 = fx0 + 3; tx2 < fx1 - 16; tx2 += 4) for (var tz2 = fz0 + 4; tz2 < fz1 - 4; tz2 += 7.5) {
      if (tz2 > GZ0 - 4 && tz2 < GZ1 + 3 && tx2 > -18) continue;
      box("steel", 0.08, 16, 0.08, tx2 - 0.6, y, tz2 - 2.5); box("steel", 0.08, 16, 0.08, tx2 + 0.6, y, tz2 - 2.5); box("steel", 0.08, 16, 0.08, tx2 - 0.6, y, tz2 + 2.5); box("steel", 0.08, 16, 0.08, tx2 + 0.6, y, tz2 + 2.5);
      for (var sh = 0; sh < 10; sh++) { var sy = y + 0.8 + sh * 1.55; box("white", 1.3, 0.12, 5.1, tx2, sy, tz2); box(sh % 3 === 0 ? "leaf3" : "leaf", 1.1, 0.28, 4.9, tx2, sy + 0.12, tz2); box(sh % 2 ? "ledPink" : "lampCool", 1.1, 0.03, 4.9, tx2, sy + 1.4, tz2); }
    }
    [-58, -48, -25, -15].forEach(function (tkz) { var tkx = fx1 - 8; lathe("white", [[0, 0], [4.2, 0], [4.4, 0.2], [4.4, 1.8], [4.6, 1.9], [4.6, 2.0]], tkx, y, tkz, 48); var wt = new THREE.CircleGeometry(4.3, 48); wt.rotateX(-Math.PI / 2); worldUV(wt, 3); var wtm = new THREE.Mesh(wt, M.lagoon); wtm.position.set(tkx, y + 1.7, tkz); put(wtm); DBLOCKS[3].push(["c", tkx, tkz, 4.8]); });
    for (var fl = 0; fl < 5; fl++) box("lampCool", 36, 0.1, 1.2, -32, y + FH - 0.3, fz0 + 6 + fl * 11);
    lightsAt([[-25, y + 8, -50], [-25, y + 8, -22], [-8, y + 4, -40], [-8, y + 4, -14]]);
    YOFF = 0; ZONE = "surface";
  }
