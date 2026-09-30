
  /* ============================== THE DEEP: shared builders ============================== */
  var LVY = [0, -14, -40, -64, -88, -104];
  var LVNAME = ["Surface", "Salon level", "The Grotto", "Living Earth", "Engine level", "Transit level"];
  var AC = { x: GH.x, z: GH.z }; // the atrium sits right under the Gatehouse oculus
  var DDOORS = [[], [], [], [], [], []], DBLOCKS = [[], [], [], [], [], []], INTER = [], DEEPDYN = {};
  function rr(x0, x1, z0, z1) { return ["r", Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]; }
  function droom(lv, id, name, stop, s, h, extra) { var r = Object.assign({ id: id, name: name, stop: stop, s: s, lv: lv, h: h || 6 }, extra || {}); ROOMS.push(r); return r; }
  // a straight wall along x (at z = across) or along z (at x = across), with door gaps [a0, a1]
  function wallRun(axis, across, a0, a1, y, h, gaps, mat, dh, lv) {
    gaps = (gaps || []).slice().sort(function (p, q) { return p[0] - q[0]; }); var cur = a0;
    function seg2(s0, s1, y0, hh) { if (s1 - s0 < 0.02 || hh <= 0) return; var m = (s0 + s1) / 2; if (axis === "x") box(mat, s1 - s0, hh, 0.5, m, y0, across); else box(mat, 0.5, hh, s1 - s0, across, y0, m); }
    gaps.forEach(function (g) {
      seg2(cur, g[0], y, h); seg2(g[0], g[1], y + (g[2] || dh), h - (g[2] || dh)); cur = g[1];
      if (lv != null) { if (axis === "x") DDOORS[lv].push(["r", g[0] + 0.1, g[1] - 0.1, across - 0.9, across + 0.9]); else DDOORS[lv].push(["r", across - 0.9, across + 0.9, g[0] + 0.1, g[1] - 0.1]); }
      // bronze door frame
      var fm = (g[0] + g[1]) / 2, fw = g[1] - g[0], fh = g[2] || dh;
      if (axis === "x") { box("goldDark", 0.12, fh, 0.6, g[0], y, across); box("goldDark", 0.12, fh, 0.6, g[1], y, across); box("goldDark", fw + 0.24, 0.14, 0.6, fm, y + fh, across); }
      else { box("goldDark", 0.6, fh, 0.12, across, y, g[0]); box("goldDark", 0.6, fh, 0.12, across, y, g[1]); box("goldDark", 0.6, 0.14, fw + 0.24, across, y + fh, fm); }
    });
    seg2(cur, a1, y, h);
  }
  // a finished room: floor, ceiling, walls with doors, cove light, downlights and optional wainscot
  function hall(o) {
    var y = o.y, h = o.h, x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1, d = o.doors || {}, op = o.open || {}, wm = o.wall || "wall", dh = o.dh || 3.6;
    floorRect(o.floor || "stone", x0, x1, z0, z1, y);
    if (!o.noCeil) box(o.ceil || "plaster", x1 - x0 + 1, 0.3, z1 - z0 + 1, (x0 + x1) / 2, y + h, (z0 + z1) / 2);
    if (!op.n) wallRun("x", z0 - 0.25, x0 - 0.5, x1 + 0.5, y, h, d.n, wm, dh, o.lv);
    if (!op.s) wallRun("x", z1 + 0.25, x0 - 0.5, x1 + 0.5, y, h, d.s, wm, dh, o.lv);
    if (!op.w) wallRun("z", x0 - 0.25, z0, z1, y, h, d.w, wm, dh, o.lv);
    if (!op.e) wallRun("z", x1 + 0.25, z0, z1, y, h, d.e, wm, dh, o.lv);
    if (o.cove !== false) { box("lampSoft", x1 - x0 - 0.6, 0.05, 0.08, (x0 + x1) / 2, y + h - 0.12, z0 + 0.25); box("lampSoft", x1 - x0 - 0.6, 0.05, 0.08, (x0 + x1) / 2, y + h - 0.12, z1 - 0.25);
      box("lampSoft", 0.08, 0.05, z1 - z0 - 0.6, x0 + 0.25, y + h - 0.12, (z0 + z1) / 2); box("lampSoft", 0.08, 0.05, z1 - z0 - 0.6, x1 - 0.25, y + h - 0.12, (z0 + z1) / 2); }
    if (o.downs !== false) { var st = o.downs || 4.5; for (var gx = x0 + st / 2; gx < x1; gx += st) for (var gz = z0 + st / 2; gz < z1; gz += st) cyl("led", 0.09, 0.02, gx, y + h - 0.03, gz, 12); }
    if (o.wains) {
      [["x", z0 + 0.03, x0, x1, d.n, op.n], ["x", z1 - 0.03, x0, x1, d.s, op.s], ["z", x0 + 0.03, z0, z1, d.w, op.w], ["z", x1 - 0.03, z0, z1, d.e, op.e]].forEach(function (w) {
        if (w[5]) return; var cur = w[2], gs = (w[4] || []).slice().sort(function (p, q) { return p[0] - q[0]; }).concat([[w[3], w[3]]]);
        gs.forEach(function (g) { var s0 = cur + 0.1, s1 = g[0] - 0.1; cur = g[1]; if (s1 - s0 < 0.3) return; var m = (s0 + s1) / 2;
          if (w[0] === "x") { box(o.wains, s1 - s0, 1.1, 0.06, m, y, w[1]); box("gold", s1 - s0, 0.035, 0.07, m, y + 1.1, w[1]); } else { box(o.wains, 0.06, 1.1, s1 - s0, w[1], y, m); box("gold", 0.07, 0.035, s1 - s0, w[1], y + 1.1, m); } });
      });
    }
  }
  function lightsAt(pts) { pts.forEach(function (p) { LIGHT_ANCHORS.push([p[0], p[1] + YOFF, p[2]]); }); }
  // an art panel on a wall (reuses the painting frames)
  function art(i, w, h, x, y, z, ry) { painting(TEX.art[i % TEX.art.length], w, h, x, y, z, ry); }
  // a wall of books: textured panel with a walnut case, set just in front of a wall
  function bookWall(w, h, x, y, z, ry) {
    var f = new F(x, z, ry, y); f.box("bookWall", w, h, 0.05, 0, 0, 0);
    f.rbox("wood", w + 0.12, 0.12, 0.42, 0, h, -0.16, 0.01).rbox("wood", w + 0.12, 0.1, 0.42, 0, -0.1, -0.16, 0.01).rbox("wood", 0.08, h, 0.42, -w / 2 - 0.04, 0, -0.16, 0.01).rbox("wood", 0.08, h, 0.42, w / 2 + 0.04, 0, -0.16, 0.01);
    for (var k = 1; k < Math.round(w / 1.2); k++) f.rbox("wood", 0.05, h, 0.4, -w / 2 + k * w / Math.round(w / 1.2), 0, -0.14, 0.01);
    for (var s2 = 0; s2 <= 6; s2++) f.box("wood", w, 0.035, 0.36, 0, s2 * h / 6 - 0.02, -0.15);
  }
  // an Earth-sky ceiling: emissive, with drifting clouds and a sun you can see bloom
  var SKYCEIL = [];
  function skyCeilMat(kind) {
    var m = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uK: { value: 1 }, uSunD: { value: new V3(0.4, 0.7, 0.3) }, uKind: { value: kind || 0 } },
      side: THREE.DoubleSide,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform float uT, uK, uKind; uniform vec3 uSunD; varying vec3 vP;",
        "float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
        "float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }",
        "float fb(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n(p); p *= 2.03; a *= 0.5; } return s; }",
        "void main(){",
        "  vec3 d = normalize(vP); float el = clamp(d.y, 0.0, 1.0);",
        "  vec3 zen = uKind > 0.5 ? vec3(0.5, 0.56, 0.58) : vec3(0.13, 0.33, 0.86), hor = uKind > 0.5 ? vec3(0.85, 0.86, 0.82) : vec3(0.6, 0.76, 1.0);",
        "  vec3 col = mix(hor, zen, pow(el, 0.55));",
        "  vec2 cp = d.xz / (d.y + 0.3) * 1.6 + vec2(uT * 0.006, uT * 0.0025);",
        "  float c = fb(cp * 2.2); float cl = smoothstep(uKind > 0.5 ? 0.3 : 0.5, 0.82, c) * smoothstep(0.02, 0.2, el);",
        "  col = mix(col, vec3(1.0, 0.985, 0.96), cl * 0.9);",
        "  float sd = dot(d, normalize(uSunD));",
        "  col += vec3(1.0, 0.95, 0.85) * (smoothstep(0.9992, 0.9996, sd) * 40.0 + pow(max(sd, 0.0), 160.0) * 1.5) * (1.0 - cl * 0.75) * (1.0 - uKind * 0.85);",
        "  gl_FragColor = vec4(col * uK * 1.6, 1.0);",
        "}"
      ].join("\n")
    });
    SKYCEIL.push(m); return m;
  }
  // a sky dome: half an ellipsoid of radii (rx, ry, rz) sitting on (x, y, z)
  function skyDome(kind, x, y, z, rx, ry2, rz) { var sm = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2), skyCeilMat(kind)); sm.position.set(x, y, z); sm.scale.set(rx, ry2, rz); sm.frustumCulled = false; put(sm); return sm; }

  /* ============================== the grand atrium (104 m deep) ============================== */
  var ATR = { r0: 18, r1: 24.3 };
  function buildAtrium() {
    ZONE = "atrium";
    var DOORANG = { 1: [-Math.PI / 2, 0, Math.PI / 2, Math.PI], 2: [0], 3: [-Math.PI / 2, Math.PI], 4: [Math.PI / 2], 5: [0, Math.PI] };
    var NS = 72, half = Math.asin(5 / ATR.r1) + 0.02, segL = 2 * Math.PI * (ATR.r1 + 0.3) / NS * 1.05;
    for (var k = 1; k <= 5; k++) {
      var yb = LVY[k], yt = k === 1 ? -2 : LVY[k - 1] - 0.6;
      for (var i = 0; i < NS; i++) {
        var a = (i + 0.5) / NS * Math.PI * 2, inGap = false;
        DOORANG[k].forEach(function (d) { var da = Math.atan2(Math.sin(a - d), Math.cos(a - d)); if (Math.abs(da) < half) inGap = true; });
        var x = AC.x + Math.cos(a) * (ATR.r1 + 0.3), z = AC.z + Math.sin(a) * (ATR.r1 + 0.3);
        if (inGap) box("stone", 0.6, yt - yb - 5, segL, x, yb + 5, z, -a); else box("stone", 0.6, yt - yb, segL, x, yb, z, -a);
        if (i % 3 === 0 && !inGap) box("goldDark", 0.14, yt - yb, 0.12, AC.x + Math.cos(a) * ATR.r1, yb, AC.z + Math.sin(a) * ATR.r1, -a);
      }
      // level floor: a ring balcony on 1-4, the full floor at the bottom
      if (k < 5) {
        var top = new THREE.RingGeometry(ATR.r0, ATR.r1 + 0.1, 96, 1); top.rotateX(-Math.PI / 2); addGeo("terrazzo", top, mat4(AC.x, yb, AC.z, 0, 1, 1, 1));
        var bot = new THREE.RingGeometry(ATR.r0, ATR.r1 + 0.1, 96, 1); bot.rotateX(Math.PI / 2); addGeo("plaster", bot, mat4(AC.x, yb - 0.6, AC.z, 0, 1, 1, 1));
        addGeo("stoneDS", new THREE.CylinderGeometry(ATR.r0, ATR.r0, 0.6, 96, 1, true), mat4(AC.x, yb - 0.3, AC.z, 0, 1, 1, 1));
        addGeo("lampSoft", new THREE.TorusGeometry(ATR.r0 + 0.25, 0.04, 6, 128), mat4(AC.x, yb - 0.63, AC.z, 0, 1, 1, 1, Math.PI / 2));
        // balustrade arcs, broken where the bridges to the lifts land
        var gaps = LIFTS.map(function (l) { return Math.atan2(l.z - AC.z, l.x - AC.x); }).sort(function (p, q) { return p - q; }), gw2 = 0.075;
        for (var gi = 0; gi < gaps.length; gi++) {
          var s0 = gaps[gi] + gw2, s1 = (gi + 1 < gaps.length ? gaps[gi + 1] : gaps[0] + Math.PI * 2) - gw2;
          var ag = new THREE.CylinderGeometry(ATR.r0, ATR.r0, 1.1, 64, 1, true, Math.PI / 2 - s1, s1 - s0); addGeo("glass", ag, mat4(AC.x, yb + 0.55, AC.z, 0, 1, 1, 1), null, true);
          var tg = new THREE.TorusGeometry(ATR.r0, 0.035, 6, 64, s1 - s0); addGeo("gold", tg, mat4(AC.x, yb + 1.1, AC.z, -s0, 1, 1, 1, Math.PI / 2));
        }
        droom(k, "atr" + k, "Grand atrium", "atrium", ["a", AC.x, AC.z, ATR.r0, ATR.r1], ATR.r1 * 2, { ring: true });
      } else {
        var fl = new THREE.CircleGeometry(ATR.r1 + 0.1, 96); fl.rotateX(-Math.PI / 2); addGeo("terrazzo", fl, mat4(AC.x, yb, AC.z, 0, 1, 1, 1));
        lathe("marbleDark", [[0, 0.05], [4.6, 0.05], [5, 0.25], [5.4, 0.45], [5.4, 0.5], [5.8, 0.5], [5.8, 0]], AC.x, yb, AC.z, 64);
        var pw = new THREE.CircleGeometry(4.95, 64); pw.rotateX(-Math.PI / 2); worldUV(pw, 3); var pm = new THREE.Mesh(pw, M.waterBlue); pm.position.set(AC.x, yb + 0.4, AC.z); put(pm);
        droom(5, "atr5", "Atrium floor", "atriumfloor", ["c", AC.x, AC.z, ATR.r1], 104);
        DBLOCKS[5].push(["c", AC.x, AC.z, 5.9]);
      }
      // bridges to the two glass lifts
      LIFTS.forEach(function (l) {
        var la = Math.atan2(l.z - AC.z, l.x - AC.x), rl = Math.hypot(l.x - AC.x, l.z - AC.z), r0 = rl + 1.5, r1 = k < 5 ? ATR.r0 + 0.2 : r0 + 0.5, mid = (r0 + r1) / 2;
        var bx = AC.x + Math.cos(la) * mid, bz = AC.z + Math.sin(la) * mid, fb = new F(bx, bz, Math.PI / 2 - la);
        if (k < 5) {
          fb.box("glass", 2.4, 0.06, r1 - r0, 0, yb - 0.06, 0).box("gold", 0.08, 0.22, r1 - r0, -1.2, yb - 0.2, 0).box("gold", 0.08, 0.22, r1 - r0, 1.2, yb - 0.2, 0)
            .box("glass", 0.03, 1.05, r1 - r0, -1.2, yb, 0).box("glass", 0.03, 1.05, r1 - r0, 1.2, yb, 0).box("gold", 0.05, 0.05, r1 - r0, -1.2, yb + 1.05, 0).box("gold", 0.05, 0.05, r1 - r0, 1.2, yb + 1.05, 0);
          DDOORS[k].push(["o", bx, bz, (r1 - r0) / 2 + 0.6, 1.1, la]);
        }
        cyl("gold", 1.45, 0.25, l.x, yb - 0.25, l.z, 36);
        addGeo("gold", new THREE.TorusGeometry(1.42, 0.05, 6, 48), mat4(l.x, yb + 3.3, l.z, 0, 1, 1, 1, Math.PI / 2));
      });
      DOORANG[k].forEach(function (d) { DDOORS[k].push(["o", AC.x + Math.cos(d) * 24.3, AC.z + Math.sin(d) * 24.3, 1.8, 4.6, d]); });
      lightsAt([[AC.x + 21, yb + 3, AC.z], [AC.x - 21, yb + 3, AC.z], [AC.x, yb + 3, AC.z + 21], [AC.x, yb + 3, AC.z - 21]]);
    }
    // lift shafts all the way down, and the short shaft up to the oculus
    LIFTS.forEach(function (l) { addGeo("glass", new THREE.CylinderGeometry(1.4, 1.4, 104, 36, 1, true), mat4(l.x, -52, l.z, 0, 1, 1, 1), null, true); for (var rb = 0; rb < 6; rb++) { var ra = rb / 6 * Math.PI * 2; cyl("gold", 0.03, 104, l.x + Math.cos(ra) * 1.44, -104, l.z + Math.sin(ra) * 1.44, 6); } });
    addGeo("stoneDS", new THREE.CylinderGeometry(6.1, 6.1, 2.1, 64, 1, true), mat4(AC.x, -1.05, AC.z, 0, 1, 1, 1));
    var cap = new THREE.RingGeometry(6.1, ATR.r1 + 0.6, 96, 1); cap.rotateX(Math.PI / 2); addGeo("plaster", cap, mat4(AC.x, -2, AC.z, 0, 1, 1, 1));
    addGeo("lamp", new THREE.TorusGeometry(6.4, 0.06, 6, 96), mat4(AC.x, -2.1, AC.z, 0, 1, 1, 1, Math.PI / 2));
    addGeo("lampSoft", new THREE.TorusGeometry(ATR.r1 - 0.4, 0.05, 6, 128), mat4(AC.x, -2.1, AC.z, 0, 1, 1, 1, Math.PI / 2));
    // "Rain of gold": 640 polished spheres hung in a slow travelling wave below the oculus
    var N = MOBILE ? 360 : 640, sg = new THREE.SphereGeometry(0.2, 14, 10), im = new THREE.InstancedMesh(sg, M.gold, N), seeds = [], rgn = mulberry(404);
    for (var s = 0; s < N; s++) { var rr2 = 0.8 + Math.sqrt(rgn()) * 5.2, aa = rgn() * Math.PI * 2; seeds.push([Math.cos(aa) * rr2, Math.sin(aa) * rr2, -10 - rgn() * 56, rgn() * 6.28]); }
    im.frustumCulled = false; put(im); DEEPDYN.rain = { mesh: im, seeds: seeds, o: new THREE.Object3D() };
    YOFF = 0; ZONE = "surface";
  }

  /* ============================== L1 · the Salon level ============================== */
  var L1 = LVY[1], GZ0 = AC.z - 5, GZ1 = AC.z + 5; // the gallery spine runs east from the atrium
  function buildSalon() {
    ZONE = "deep1"; var y = 0; YOFF = L1;
    // corridors out of the atrium
    hall({ lv: 1, x0: AC.x - 5, x1: AC.x + 5, z0: -76, z1: AC.z - ATR.r1 + 0.6, y: y, h: 5, floor: "stone", wall: "wall", open: { n: true, s: true }, wains: "panelWood", downs: 3.6 });
    droom(1, "corN1", "North hall", "library", rr(AC.x - 5, AC.x + 5, -76.5, AC.z - ATR.r1 + 0.2), 5, { kind: "link" });
    hall({ lv: 1, x0: 0, x1: AC.x - ATR.r1 + 0.6, z0: GZ0, z1: GZ1, y: y, h: 5, floor: "stone", open: { w: true, e: true }, wains: "panelWood", downs: 3.6 });
    droom(1, "corW1", "West hall", "baths", rr(-0.5, AC.x - ATR.r1 + 0.2, GZ0, GZ1), 5, { kind: "link" });
    hall({ lv: 1, x0: AC.x - 5, x1: AC.x + 5, z0: AC.z + ATR.r1 - 0.6, z1: 0, y: y, h: 5, floor: "stone", open: { n: true, s: true }, wains: "panelWood", downs: 3.6 });
    droom(1, "corS1", "South hall", "sports", rr(AC.x - 5, AC.x + 5, AC.z + ATR.r1 - 0.2, 0.5), 5, { kind: "link" });
    // ---------- the gallery spine ----------
    var NR = [["media", 64, 96], ["music", 96, 120], ["holo", 120, 156], ["jazz", 156, 181]], SR = [["cinema", 64, 100], ["skyhall", 100, 150], ["sculpt", 150, 181]];
    hall({ lv: 1, x0: AC.x + ATR.r1 - 0.6, x1: 181, z0: GZ0, z1: GZ1, y: y, h: 7, floor: "stone", wall: "wall", open: { w: true }, downs: false, cove: true,
      doors: { n: NR.map(function (r) { var m = (r[1] + r[2]) / 2; return [m - 2, m + 2]; }), s: SR.map(function (r) { var m = (r[1] + r[2]) / 2; return [m - 2, m + 2]; }) } });
    droom(1, "gallery", "The Long Gallery", "gallery", rr(AC.x + ATR.r1 - 1, 181, GZ0, GZ1), 7);
    box("marbleDark", 181 - 62, 0.012, 1.2, (181 + 62) / 2, y, AC.z);
    box("lampSoft", 181 - 64, 0.04, 1.4, (181 + 64) / 2, y + 6.9, AC.z);
    for (var gx = 66; gx < 178; gx += 7) {
      var isDoor = NR.concat(SR).some(function (r) { var m = (r[1] + r[2]) / 2; return Math.abs(gx - m) < 3.2; });
      if (!isDoor) { art(gx, 2.6, 1.9, gx, y + 2.6, GZ0 + 0.04, 0); art(gx + 3, 2.6, 1.9, gx, y + 2.6, GZ1 - 0.04, Math.PI); }
      if ((gx - 66) % 14 === 0) { plinth(gx + 3.5, AC.z - 2.6, 1.05, function (px, ph, pz) { meteorite(px, ph, pz, 1.4); }); rbox("leather", 2.2, 0.1, 0.6, gx + 3.5, y + 0.42, AC.z + 2.6, 0, 0.04); rbox("basalt", 2.2, 0.42, 0.55, gx + 3.5, y, AC.z + 2.6, 0, 0.01); }
    }
    lightsAt([[80, y + 5, AC.z], [110, y + 5, AC.z], [140, y + 5, AC.z], [170, y + 5, AC.z]]);
    // ---------- media lounge: the TV and book room ----------
    var mz0 = GZ0 - 28, mz1 = GZ0;
    hall({ lv: 1, x0: 64, x1: 96, z0: mz0, z1: mz1, y: y, h: 6, floor: "floorWalnut", wall: "wall", open: { s: true }, wains: null, downs: 5 });
    droom(1, "media", "Media lounge", "media", rr(64, 96, mz0, mz1), 6);
    box("woodDark", 14, 5.4, 0.5, 80, y, mz0 + 0.25); // walnut media wall
    TVS.push({ id: "media", x: 80, z: mz0 + 0.54, y: YOFF + y + 2.4, ry: 0, w: 6.2, h: 3.49, lv: 1 });
    bookWall(4.2, 4.6, 74.4 - 2.4, y + 0.4, mz0 + 0.56, 0); bookWall(4.2, 4.6, 85.6 + 2.4, y + 0.4, mz0 + 0.56, 0);
    bookWall(12, 4.6, 64.3, y + 0.4, mz0 + 9, Math.PI / 2); bookWall(12, 4.6, 64.3, y + 0.4, mz0 + 21.5, Math.PI / 2);
    // sectional sofa facing the screen, rug, tables, lamps
    rug("fabSand", 80, mz0 + 11.5, 11, 8);
    sofa(80, mz0 + 14.5, Math.PI, 6.4, "fabCream", "fabCream"); sofa(75.9, mz0 + 11.3, Math.PI / 2, 4.2, "fabCream", "fabCream"); sofa(84.1, mz0 + 11.3, -Math.PI / 2, 4.2, "fabCream", "fabCream");
    rbox("leather", 2.6, 0.4, 1.4, 80, y, mz0 + 11, 0, 0.06); rbox("stone", 1.2, 0.05, 0.8, 80, y + 0.4, mz0 + 11, 0, 0.01);
    [74, 86].forEach(function (x) { floorLamp(x, mz0 + 15.8, 1.7); });
    armchair(91.5, mz0 + 21, -2.4, "leather"); armchair(91.5, mz0 + 17.5, -0.8, "leather"); tableRound(92.5, mz0 + 19.3, 0.4, 0.5, "marbleDark"); floorLamp(94, mz0 + 21.5, 1.6);
    lounger(68.5, mz0 + 16, Math.PI / 2 + 0.3, "fabRust"); floorLamp(66.2, mz0 + 17.5, 1.7);
    // bioethanol fireplace in the east wall
    box("marbleDark", 0.4, 1.6, 4, 95.8, y, mz0 + 9); box("black", 0.2, 0.6, 3, 95.62, y + 0.4, mz0 + 9); box("fireWarm", 0.05, 0.08, 2.6, 95.5, y + 0.48, mz0 + 9); box("gold", 0.44, 0.06, 4.1, 95.8, y + 1.6, mz0 + 9);
    art(2, 3.2, 2, 95.94, y + 3.2, mz0 + 20, -Math.PI / 2);
    INTER.push({ kind: "tv", tv: "media", x: 80, z: mz0 + 10, lv: 1, r: 7, label: "Watch TV" }, { kind: "sit", x: 80, z: mz0 + 14.2, lv: 1, r: 1.6, label: "Sit and watch", look: [80, YOFF + y + 2.4, mz0], sitY: YOFF + y + 1.15 },
      { kind: "books", x: 65.8, z: mz0 + 15, lv: 1, r: 4, label: "Choose a book" }, { kind: "books", x: 72, z: mz0 + 1.6, lv: 1, r: 3, label: "Choose a book" });
    lightsAt([[74, y + 4.5, mz0 + 8], [86, y + 4.5, mz0 + 8], [80, y + 4.5, mz0 + 18], [68, y + 4, mz0 + 20], [92, y + 4, mz0 + 20]]);
    // ---------- music room ----------
    hall({ lv: 1, x0: 96, x1: 120, z0: mz0, z1: mz1, y: y, h: 6, floor: "floorOak", wall: "wall", open: { s: true }, downs: 5 });
    droom(1, "music", "Music room", "music", rr(96, 120, mz0, mz1), 6);
    for (var sl = 0; sl < 40; sl++) { box("wood", 0.08, 5.4, 0.12, 96.4 + sl * 0.58, y + 0.3, mz0 + 0.1); }
    piano(108, mz0 + 12, 0.2); rug("fabRust", 108, mz0 + 12, 7, 6);
    var gs = new THREE.Shape(); gs.moveTo(0, 0); gs.bezierCurveTo(0.24, 0, 0.26, 0.2, 0.17, 0.27); gs.bezierCurveTo(0.12, 0.31, 0.2, 0.42, 0.14, 0.5); gs.bezierCurveTo(0.08, 0.58, -0.08, 0.58, -0.14, 0.5); gs.bezierCurveTo(-0.2, 0.42, -0.12, 0.31, -0.17, 0.27); gs.bezierCurveTo(-0.26, 0.2, -0.24, 0, 0, 0);
    var gbody = new THREE.ExtrudeGeometry(gs, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 16 });
    [[101, mz0 + 6, "wood"], [103.5, mz0 + 5.6, "woodLight"], [106, mz0 + 5.4, "black"]].forEach(function (g) {
      var gf = new F(g[0], g[1], 0.25, y); gf.geo(g[2], gbody, 0, 0.15, 0, 0, null, -0.22); gf.rbox("woodDark", 0.05, 0.62, 0.03, 0, 0.66, 0.06, 0.01, 0, null, -0.22).rbox("woodDark", 0.08, 0.16, 0.03, 0, 1.28, 0.2, 0.01, 0, null, -0.22);
      seg("darkMetal", g[0], y, g[1] - 0.25, g[0], y + 0.6, g[1] - 0.05, 0.012, 0.012, 6); seg("darkMetal", g[0] - 0.2, y, g[1] + 0.15, g[0], y + 0.2, g[1] + 0.02, 0.012, 0.012, 6); seg("darkMetal", g[0] + 0.2, y, g[1] + 0.15, g[0], y + 0.2, g[1] + 0.02, 0.012, 0.012, 6);
    });
    [98, 118].forEach(function (x) { rbox("black", 0.6, 1.9, 0.5, x, y, mz0 + 2.5, 0, 0.04); cyl("darkMetal", 0.16, 0.02, x, y + 1.4, mz0 + 2.76, 20); cyl("darkMetal", 0.1, 0.02, x, y + 0.8, mz0 + 2.76, 20); });
    armchair(114, mz0 + 18, -2.6, "fabTeal"); armchair(116.5, mz0 + 15.5, -2.1, "fabTeal"); floorLamp(117.5, mz0 + 19.5, 1.6);
    INTER.push({ kind: "piano", x: 108, z: mz0 + 11, lv: 1, r: 3, label: "Play the piano" });
    lightsAt([[102, y + 4.5, mz0 + 10], [114, y + 4.5, mz0 + 10], [108, y + 4.5, mz0 + 20]]);
    // ---------- holodeck and games ----------
    hall({ lv: 1, x0: 120, x1: 156, z0: mz0, z1: mz1, y: y, h: 6, floor: "floorWalnut", wall: "wall", open: { s: true }, downs: 5 });
    droom(1, "holo", "Holodeck & games", "holo", rr(120, 156, mz0, mz1), 6);
    var grid = canvasTex(512, 512, function (g, w, h) { g.fillStyle = "#020611"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,190,255,0.9)"; g.lineWidth = 3; for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } });
    grid.wrapS = grid.wrapT = THREE.RepeatWrapping; grid.repeat.set(3, 1.5);
    var hm = new THREE.MeshBasicMaterial({ map: grid, side: THREE.DoubleSide });
    [[138, mz0 + 0.1, 0, 36], [120.1, mz0 + 7, Math.PI / 2, 14], [155.9, mz0 + 7, -Math.PI / 2, 14]].forEach(function (q) { var pl = new THREE.Mesh(new THREE.PlaneGeometry(q[3] === 36 ? 35.6 : 13.8, 5.8), hm); pl.position.set(q[0], y + 2.9, q[1]); pl.rotation.y = q[2]; put(pl); });
    var hf = new THREE.Mesh(new THREE.PlaneGeometry(35.6, 13.8), hm); hf.rotation.x = -Math.PI / 2; hf.position.set(138, y + 0.012, mz0 + 7); put(hf);
    box("glass", 35.8, 5.9, 0.06, 138, y, mz0 + 14.2); box("gold", 35.8, 0.06, 0.1, 138, y + 5.9, mz0 + 14.2);
    // billiards, arcade row, lounge chairs
    var bf = new F(128, mz0 + 21, 0); bf.rbox("wood", 2.9, 0.18, 1.6, 0, 0.62, 0, 0.04).rbox("fabMoss", 2.54, 0.04, 1.27, 0, 0.8, 0, 0.01).rbox("wood", 0.16, 0.62, 0.16, -1.2, 0, -0.6, 0.02).rbox("wood", 0.16, 0.62, 0.16, 1.2, 0, -0.6, 0.02).rbox("wood", 0.16, 0.62, 0.16, -1.2, 0, 0.6, 0.02).rbox("wood", 0.16, 0.62, 0.16, 1.2, 0, 0.6, 0.02).blob(3.4, 2.1, 0, 0, 0.6);
    for (var bb = 0; bb < 9; bb++) sph(bb ? (bb % 2 ? "fruitR" : "fruitY") : "white", 0.028, 127.5 + (bb % 3) * 0.06, y + 0.845, mz0 + 21 + Math.floor(bb / 3) * 0.06 - 0.06, 10);
    pendant(127.2, y + 1.7, mz0 + 21); pendant(128.8, y + 1.7, mz0 + 21);
    for (var ar = 0; ar < 5; ar++) { var af = new F(140 + ar * 1.6, mz1 - 1.2, Math.PI); af.rbox("black", 0.8, 1.8, 0.8, 0, 0, 0, 0.03).rbox("ledBlue", 0.62, 0.45, 0.02, 0, 1.2, 0.41, 0.01, 0, null, -0.25).rbox("ledPink", 0.7, 0.06, 0.8, 0, 1.78, 0, 0.01); }
    armchair(150, mz0 + 20, -2.2, "leatherBlack"); armchair(152, mz0 + 18, -1.5, "leatherBlack");
    lightsAt([[128, y + 4, mz0 + 21], [146, y + 4, mz0 + 21], [138, y + 4, mz0 + 7]]);
    // ---------- jazz bar ----------
    hall({ lv: 1, x0: 156, x1: 181, z0: mz0, z1: mz1, y: y, h: 5.5, floor: "floorWalnut", wall: "panelWood", open: { s: true }, downs: false });
    droom(1, "jazz", "Jazz bar", "jazz", rr(156, 181, mz0, mz1), 5.5);
    var jb = new F(168.5, mz0 + 4, 0); jb.rbox("marbleDark", 12, 1.1, 1.1, 0, 0, 0, 0.03).rbox("gold", 12.04, 0.05, 1.14, 0, 1.1, 0, 0.01).box("lampSoft", 11.6, 0.04, 0.05, 0, 0.12, 0.56);
    for (var bs = 0; bs < 8; bs++) stool(163.2 + bs * 1.5, mz0 + 5.3, "leather");
    box("woodDark", 12, 3.6, 0.4, 168.5, y, mz0 + 0.45); for (var bsh = 0; bsh < 3; bsh++) { box("glass", 11.6, 0.03, 0.34, 168.5, y + 1.3 + bsh * 0.75, mz0 + 0.7); box("lampSoft", 11.6, 0.02, 0.03, 168.5, y + 1.3 + bsh * 0.75, mz0 + 0.86); for (var bt = 0; bt < 36; bt++) cyl(bt % 3 ? "bottle" : "bottle2", 0.04, 0.32, 163 + bt * 0.31, y + 1.33 + bsh * 0.75, mz0 + 0.72, 8); }
    [mz0 + 11, mz0 + 17, mz0 + 23].forEach(function (bz) { var bf2 = new F(158.6, bz, Math.PI / 2); bf2.rbox("leather", 2.4, 0.45, 0.7, 0, 0, -0.9, 0.06).rbox("leather", 2.4, 1.1, 0.25, 0, 0, -1.3, 0.08).rbox("leather", 2.4, 0.45, 0.7, 0, 0, 0.9, 0.06).rbox("leather", 2.4, 1.1, 0.25, 0, 0, 1.3, 0.08); tableRect(158.6, bz, 1.2, 0.8, 0.74, "marbleDark", "gold", Math.PI / 2); pendant(158.6, y + 1.6, bz); });
    [[167, mz0 + 13], [167, mz0 + 20], [171.5, mz0 + 16.5]].forEach(function (t2) { tableRound(t2[0], t2[1], 0.45, 0.74, "marbleDark"); [0, 2.1, 4.2].forEach(function (ca) { chair(t2[0] + Math.cos(ca) * 0.95, t2[1] + Math.sin(ca) * 0.95, Math.atan2(-Math.cos(ca), -Math.sin(ca)), "leather"); }); cyl("lamp", 0.04, 0.12, t2[0], y + 0.74, t2[1], 8); });
    rbox("woodDark", 4.6, 0.35, 9, 178.4, y, mz0 + 16, 0, 0.02); box("fabRust", 0.1, 5, 9.4, 180.9, y, mz0 + 16);
    YOFF += 0.35; piano(178.2, mz0 + 14.2, -Math.PI / 2 + 0.35); seg("darkMetal", 177, y, mz0 + 18.2, 177, y + 1.45, mz0 + 18.2, 0.012, 0.012, 6); sph("darkMetal", 0.05, 177, y + 1.5, mz0 + 18.2, 10);
    lathe("wood", [[0, 0.3], [0.3, 0.35], [0.36, 0.7], [0.26, 1.0], [0.3, 1.25], [0.2, 1.45], [0, 1.47]], 179, y, mz0 + 19, 20); seg("woodDark", 179, y + 1.8, mz0 + 19, 179, y + 2.6, mz0 + 19, 0.03, 0.025, 6); YOFF -= 0.35;
    lightsAt([[163, y + 3.5, mz0 + 5], [174, y + 3.5, mz0 + 5], [168, y + 3.5, mz0 + 17], [178, y + 3.5, mz0 + 16], [159, y + 3.5, mz0 + 17]]);
    // ---------- private cinema ----------
    var cz0 = GZ1, cz1 = GZ1 + 28;
    hall({ lv: 1, x0: 64, x1: 100, z0: cz0, z1: cz1, y: y, h: 8, floor: "carpetBlue", wall: "fabGrey", ceil: "black", open: { n: true }, downs: false, cove: false });
    // the screen is on the south wall; tiers rise towards the gallery
    droom(1, "cinema", "Private cinema", "cinema", rr(64, 100, cz0, cz1), 8, { hf: function (x, z) { return z >= cz1 - 8 ? 0 : Math.min(4, Math.floor((cz1 - 8 - z) / 3) + 1) * 0.42; } });
    for (var tr = 1; tr <= 4; tr++) { var zB = cz1 - 8 - 3 * (tr - 1), zA = tr === 4 ? cz0 : zB - 3; rbox("carpetBlue", 30, tr * 0.42, zB - zA, 82, y, (zA + zB) / 2, 0, 0.01); box("ledBlue", 30, 0.02, 0.03, 82, y + tr * 0.42 - 0.03, zB + 0.01); }
    TVS.push({ id: "cinema", x: 82, z: cz1 - 0.3, y: YOFF + y + 4.2, ry: Math.PI, w: 14, h: 5.9, lv: 1, film: true });
    box("black", 16, 7, 0.2, 82, y + 0.4, cz1 - 0.15);
    for (var row = 0; row < 5; row++) for (var sc = 0; sc < 7; sc++) {
      var sx = 72 + sc * 3.2 + (row % 2) * 0.4, sz = cz1 - 6.5 - row * 3, syy = Math.min(4, row) * 0.42;
      YOFF += syy; var sf = new F(sx, sz, Math.PI); sf.rbox("leather", 0.95, 0.45, 1.0, 0, 0, 0, 0.08).rbox("leather", 0.95, 0.75, 0.25, 0, 0.35, -0.42, 0.1, 0, null, -0.15).rbox("leather", 0.18, 0.62, 0.9, -0.5, 0, 0, 0.07).rbox("leather", 0.18, 0.62, 0.9, 0.5, 0, 0, 0.07).cyl("ledBlue", 0.03, 0.01, 0.5, 0.62, 0.3, 8); YOFF -= syy;
    }
    var stars = new THREE.BufferGeometry(), sp = [], rgs = mulberry(88); for (var st = 0; st < 1600; st++) sp.push(64.5 + rgs() * 35, y + 7.95, cz0 + 0.5 + rgs() * 27);
    stars.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); var spm = new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xfff4e0, size: 1.8, sizeAttenuation: false })); put(spm);
    INTER.push({ kind: "sit", x: 82, z: cz1 - 12.5, lv: 1, r: 2, label: "Take a seat", look: [82, YOFF + y + 4.2, cz1], sitY: YOFF + y + 0.84 + 1.05, tv: "cinema" });
    lightsAt([[82, y + 6, cz0 + 6], [82, y + 6, cz1 - 10]]);
    // ---------- Sky Hall ballroom ----------
    hall({ lv: 1, x0: 100, x1: 150, z0: cz0, z1: cz1, y: y, h: 11.5, floor: "stone", wall: "wall", open: { n: true }, noCeil: true, downs: false, wains: "panelWood" });
    droom(1, "skyhall", "Sky Hall", "skyhall", rr(100, 150, cz0, cz1), 11);
    skyDome(0, 125, y + 6.6, (cz0 + cz1) / 2, 25, 5, 14);
    box("plaster", 51, 0.3, 29, 125, y + 11.6, (cz0 + cz1) / 2); box("gold", 50.2, 0.25, 0.25, 125, y + 6.4, cz0 + 0.3); box("gold", 50.2, 0.25, 0.25, 125, y + 6.4, cz1 - 0.3);
    for (var col2 = 0; col2 < 9; col2++) { [cz0 + 1.5, cz1 - 1.5].forEach(function (cz) { var cx = 104 + col2 * 5.25; lathe("stone", [[0, 0], [0.62, 0], [0.62, 0.3], [0.45, 0.4], [0.4, 6.0], [0.55, 6.2], [0.6, 6.4], [0, 6.4]], cx, y, cz, 24); cyl("gold", 0.47, 0.12, cx, y + 5.9, cz, 24); }); }
    [[104, cz0 + 7], [104, cz1 - 7], [146, cz0 + 7], [146, cz1 - 7], [118, cz0 + 3], [132, cz0 + 3]].forEach(function (cp) { lathe("gold", [[0, 0], [0.3, 0], [0.32, 0.05], [0.06, 0.3], [0.05, 2.6], [0.28, 2.9], [0.3, 3.0], [0, 3.0]], cp[0], y, cp[1], 24); sph("lamp", 0.2, cp[0], y + 3.05, cp[1], 14); });
    for (var tt = 0; tt < 6; tt++) { var tx = 108 + (tt % 3) * 9, tzz = cz0 + 8 + Math.floor(tt / 3) * 12; lathe("fabWhite", [[0, 0.76], [0.95, 0.76], [0.98, 0.72], [1.0, 0.1], [0.98, 0], [0, 0]], tx, y, tzz, 36); for (var ch = 0; ch < 8; ch++) { var ca = ch / 8 * Math.PI * 2; chair(tx + Math.cos(ca) * 1.45, tzz + Math.sin(ca) * 1.45, Math.atan2(-Math.cos(ca), -Math.sin(ca)), "fabGold"); } cyl("lamp", 0.05, 0.25, tx, y + 0.76, tzz, 10); }
    rbox("floorWalnut", 14, 0.5, 5, 138, y, cz1 - 3, 0, 0.02); piano(136, cz1 - 3.2, Math.PI); YOFF += 0.5; stool(139, cz1 - 2.5, "leather"); YOFF -= 0.5;
    lightsAt([[113, y + 6, cz0 + 14], [125, y + 6, cz0 + 14], [137, y + 6, cz0 + 14], [140, y + 4, cz1 - 4]]);
    // ---------- sculpture court ----------
    hall({ lv: 1, x0: 150, x1: 181, z0: cz0, z1: cz1, y: y, h: 7, floor: "stone", wall: "wall", open: { n: true }, downs: 6 });
    droom(1, "sculpt", "Sculpture court", "sculpt", rr(150, 181, cz0, cz1), 7);
    var SC = [[157, cz0 + 8], [165, cz0 + 8], [173, cz0 + 8], [157, cz0 + 18], [165, cz0 + 18], [173, cz0 + 18]];
    SC.forEach(function (p, i) {
      rbox("stone", 1.2, 0.9, 1.2, p[0], y, p[1], 0, 0.02); blob(p[0], p[1], 1.8, 1.8, 0, 0.5);
      var g = i === 0 ? new THREE.TorusKnotGeometry(0.5, 0.16, 160, 20, 2, 3) : i === 1 ? new THREE.TorusGeometry(0.62, 0.2, 24, 64) : i === 2 ? new THREE.IcosahedronGeometry(0.7, 0) : i === 3 ? new THREE.TorusKnotGeometry(0.45, 0.12, 160, 18, 3, 5) : i === 4 ? new THREE.SphereGeometry(0.62, 48, 32) : new THREE.OctahedronGeometry(0.7, 0);
      geoAt(i === 4 ? "mirror" : i === 2 ? "marbleDark" : i === 5 ? "stone" : "gold", g, p[0], y + 1.75, p[1], i * 0.6, null, i === 1 ? Math.PI / 2 : 0);
      lightsAt([[p[0], y + 5.5, p[1]]]);
    });
    for (var aw = 0; aw < 4; aw++) art(aw + 1, 3.4, 2.4, 155 + aw * 7, y + 3, cz1 - 0.04, Math.PI);
    YOFF = 0; ZONE = "surface";
  }

  /* ---------- the grand library, the thermae and the sports hall (L1) ---------- */
  function buildSalon2() {
    ZONE = "deep1"; var y = 0; YOFF = L1;
    // ---------- grand library: two storeys of books, a gallery, reading tables ----------
    var lx0 = 10, lx1 = 64, lz0 = -112, lz1 = -76, H = 11.5;
    hall({ lv: 1, x0: lx0, x1: lx1, z0: lz0, z1: lz1, y: y, h: H, floor: "floorWalnut", wall: "panelWood", doors: { s: [[AC.x - 3, AC.x + 3, 4.2]] }, downs: false });
    droom(1, "library2", "Grand library", "library2", rr(lx0, lx1, lz0, lz1), H);
    // book walls on both storeys (not across the door)
    [[lx0 + 0.3, Math.PI / 2, lz0 + 2, lz1 - 2, "z"], [lx1 - 0.3, -Math.PI / 2, lz0 + 2, lz1 - 2, "z"], [lz0 + 0.3, 0, lx0 + 2, lx1 - 2, "x"]].forEach(function (w) {
      for (var a = w[2]; a < w[3] - 0.5; a += 4.2) { var m = a + 2.1; if (w[4] === "z") { bookWall(4, 4.7, w[0], y + 0.1, m, w[1]); bookWall(4, 4.4, w[0], y + 6.2, m, w[1]); } else { bookWall(4, 4.7, m, y + 0.1, w[0], w[1]); bookWall(4, 4.4, m, y + 6.2, w[0], w[1]); } }
    });
    [[lx0 + 2, lz1 - 0.3], [AC.x - 7.5, lz1 - 0.3], [AC.x + 7.5, lz1 - 0.3], [lx1 - 2, lz1 - 0.3]].forEach(function (p) { bookWall(3.4, 4.7, p[0], y + 0.1, p[1], Math.PI); });
    // gallery walkway at 5.6 m round three sides, brass rail, two spiral stairs
    [[lx0 + 1.5, (lz0 + lz1) / 2, 3, lz1 - lz0 - 0.2], [lx1 - 1.5, (lz0 + lz1) / 2, 3, lz1 - lz0 - 0.2], [(lx0 + lx1) / 2, lz0 + 1.5, lx1 - lx0 - 6, 3]].forEach(function (g) {
      box("floorWalnut", g[2], 0.3, g[3], g[0], y + 5.6, g[1]); box("lampSoft", Math.max(0.05, g[2] - 0.2), 0.03, Math.max(0.05, g[3] - 0.2), g[0], y + 5.58, g[1]);
    });
    box("gold", 0.06, 0.06, lz1 - lz0 - 3, lx0 + 3, y + 6.95, (lz0 + lz1) / 2); box("gold", 0.06, 0.06, lz1 - lz0 - 3, lx1 - 3, y + 6.95, (lz0 + lz1) / 2); box("gold", lx1 - lx0 - 6, 0.06, 0.06, (lx0 + lx1) / 2, y + 6.95, lz0 + 3);
    for (var bp = lz0 + 3.5; bp < lz1 - 1; bp += 1.2) { cyl("gold", 0.018, 1.05, lx0 + 3, y + 5.9, bp, 6); cyl("gold", 0.018, 1.05, lx1 - 3, y + 5.9, bp, 6); }
    for (var bq = lx0 + 3.5; bq < lx1 - 3; bq += 1.2) cyl("gold", 0.018, 1.05, bq, y + 5.9, lz0 + 3, 6);
    [[lx0 + 5, lz1 - 5], [lx1 - 5, lz1 - 5]].forEach(function (sp2) {
      cyl("gold", 0.12, 5.9, sp2[0], y, sp2[1], 12);
      for (var s3 = 0; s3 < 24; s3++) { var sa = s3 / 24 * Math.PI * 1.9, sfr = new F(sp2[0] + Math.cos(sa) * 0.75, sp2[1] + Math.sin(sa) * 0.75, Math.PI / 2 - sa); sfr.rbox("wood", 0.32, 0.05, 1.3, 0, y + s3 * 0.24, 0, 0.01); }
      addGeo("gold", new THREE.TorusGeometry(1.4, 0.025, 6, 48, Math.PI * 1.9), mat4(sp2[0], y + 3, sp2[1], 0, 1, 2.2, 1, Math.PI / 2));
    });
    // reading tables with green banker's lamps, chesterfields, a globe
    for (var rt = 0; rt < 3; rt++) {
      var tz = lz0 + 9 + rt * 7.5; tableRect(AC.x, tz, 7, 1.5, 0.78, "wood", "wood");
      for (var cs = -3; cs <= 3; cs += 1.5) { chair(AC.x + cs, tz - 1.05, 0, "leather"); chair(AC.x + cs, tz + 1.05, Math.PI, "leather"); }
      for (var bl = -2.4; bl <= 2.4; bl += 2.4) { cyl("gold", 0.07, 0.02, AC.x + bl, y + 0.78, tz, 12); cyl("gold", 0.012, 0.32, AC.x + bl, y + 0.8, tz, 6); addGeo("ledGreen", new THREE.CylinderGeometry(0.06, 0.13, 0.12, 16, 1, true, 0, Math.PI), mat4(AC.x + bl, y + 1.14, tz, Math.PI / 2, 1, 1, 1, 0, Math.PI / 2)); }
    }
    [[lx0 + 8, lz0 + 12], [lx0 + 8, lz0 + 20], [lx1 - 8, lz0 + 12], [lx1 - 8, lz0 + 20]].forEach(function (c, i) { armchair(c[0] + (i < 2 ? -1 : 1), c[1] - 1.1, i < 2 ? 0.6 : -0.6, "leather"); armchair(c[0] + (i < 2 ? -1 : 1), c[1] + 1.1, i < 2 ? 2.5 : -2.5, "leather"); tableRound(c[0] + (i < 2 ? -1.8 : 1.8), c[1], 0.35, 0.55, "marbleDark"); floorLamp(c[0] + (i < 2 ? -2.6 : 2.6), c[1] + 2, 1.6); });
    var gl2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 32), new THREE.MeshStandardMaterial({ map: TEX.mars, roughness: 0.5 })); gl2.position.set(lx1 - 7, y + 1.6, lz1 - 4); gl2.rotation.z = 0.44; put(gl2);
    lathe("wood", [[0, 0], [0.7, 0], [0.5, 0.2], [0.12, 0.3], [0.1, 0.7], [0, 0.72]], lx1 - 7, y, lz1 - 4, 24); addGeo("gold", new THREE.TorusGeometry(1.0, 0.025, 6, 48, Math.PI), mat4(lx1 - 7, y + 1.6, lz1 - 4, 0, 1, 1, 1, 0, 0.44));
    rug("fabRust", AC.x, lz0 + 16.5, 12, 22);
    box("lampSoft", 12, 0.05, 16, AC.x, y + H - 0.05, (lz0 + lz1) / 2); for (var lb = -8; lb <= 8; lb += 2) box("wood", 0.2, 0.5, 20.2, AC.x + lb, y + H - 0.5, (lz0 + lz1) / 2);
    INTER.push({ kind: "books", x: lx0 + 1.6, z: lz0 + 16, lv: 1, r: 4, label: "Choose a book" }, { kind: "books", x: lx1 - 1.6, z: lz0 + 16, lv: 1, r: 4, label: "Choose a book" }, { kind: "books", x: AC.x, z: lz0 + 1.6, lv: 1, r: 4, label: "Choose a book" });
    lightsAt([[AC.x, y + 8, lz0 + 9], [AC.x, y + 8, lz0 + 24], [lx0 + 6, y + 4, lz0 + 16], [lx1 - 6, y + 4, lz0 + 16], [AC.x, y + 4, lz1 - 5]]);
    // ---------- the thermae: Roman baths warmed by the reactor ----------
    var tx0 = -50, tx1 = 0, tz0 = -62, tz1 = -12;
    hall({ lv: 1, x0: tx0, x1: tx1, z0: tz0, z1: tz1, y: y, h: 9, floor: "stone", wall: "stone", doors: { e: [[GZ0 + 1, GZ1 - 1, 4.4]] }, downs: false, cove: true });
    droom(1, "baths", "Thermal baths", "baths", rr(tx0, tx1, tz0, tz1), 9);
    function pool(cx, cz, w, d, deep, round) {
      if (round) { lathe("marbleDark", [[0, -deep], [w / 2 - 0.3, -deep], [w / 2, -deep + 0.3], [w / 2, 0.05], [w / 2 + 0.5, 0.05], [w / 2 + 0.5, 0]], cx, y, cz, 64); var wgc = new THREE.CircleGeometry(w / 2, 64); wgc.rotateX(-Math.PI / 2); worldUV(wgc, 3); var wmc = new THREE.Mesh(wgc, M.waterBlue); wmc.position.set(cx, y - 0.12, cz); put(wmc); DBLOCKS[1].push(["c", cx, cz, w / 2 + 0.1]); return; }
      box("tileBlue", w, 0.1, d, cx, y - deep, cz); box("tileBlue", 0.2, deep, d, cx - w / 2, y - deep, cz); box("tileBlue", 0.2, deep, d, cx + w / 2, y - deep, cz); box("tileBlue", w, deep, 0.2, cx, y - deep, cz - d / 2); box("tileBlue", w, deep, 0.2, cx, y - deep, cz + d / 2);
      box("marbleDark", w + 0.8, 0.06, 0.4, cx, y, cz - d / 2 - 0.2); box("marbleDark", w + 0.8, 0.06, 0.4, cx, y, cz + d / 2 + 0.2); box("marbleDark", 0.4, 0.06, d, cx - w / 2 - 0.2, y, cz); box("marbleDark", 0.4, 0.06, d, cx + w / 2 + 0.2, y, cz);
      var wg2 = new THREE.PlaneGeometry(w, d); wg2.rotateX(-Math.PI / 2); worldUV(wg2, 3); var wm2 = new THREE.Mesh(wg2, M.waterBlue); wm2.position.set(cx, y - 0.12, cz); put(wm2);
      DBLOCKS[1].push(["r", cx - w / 2 - 0.1, cx + w / 2 + 0.1, cz - d / 2 - 0.1, cz + d / 2 + 0.1]);
    }
    pool(-25, -37, 22, 12, 1.4); pool(-43, -22, 7, 0, 1.2, true); pool(-43, -52, 7, 0, 1.2, true);
    for (var cc = 0; cc < 7; cc++) [-45.5, -4.5].forEach(function (cx) { lathe("stone", [[0, 0], [0.7, 0], [0.7, 0.35], [0.5, 0.45], [0.45, 8.1], [0.65, 8.4], [0.7, 8.6], [0, 8.6]], cx, y, tz0 + 5 + cc * 6.7, 24); });
    for (var ll = 0; ll < 5; ll++) { lounger(-9, tz0 + 8 + ll * 3.2, -Math.PI / 2, "fabWhite"); lounger(-41, tz0 + 18 + ll * 3.2 - 6, Math.PI / 2, "fabWhite"); }
    var vault2 = vaultGeo(50, 7, 2, 50, 28); addGeo("plaster", vault2, mat4(tx0, y, (tz0 + tz1) / 2, Math.PI / 2, 1, 1, 1));
    for (var ov = 0; ov < 5; ov++) cyl("lamp", 0.8, 0.05, -45 + ov * 10, y + 8.9, -37, 24);
    DEEPDYN.steam = (DEEPDYN.steam || []).concat([{ x: -25, z: -37, y: YOFF + y, w: 20, d: 10, lv: 1 }, { x: -43, z: -22, y: YOFF + y, w: 5, d: 5, lv: 1 }]);
    lightsAt([[-25, y + 5, -44], [-25, y + 5, -30], [-43, y + 4, -22], [-43, y + 4, -52], [-9, y + 4, -30]]);
    // ---------- low-gravity sports hall ----------
    var hx0 = 5, hx1 = 69, hz0 = 0, hz1 = 44, HH = 11;
    hall({ lv: 1, x0: hx0, x1: hx1, z0: hz0, z1: hz1, y: y, h: HH, floor: "floorOak", wall: "wall", doors: { n: [[AC.x - 3, AC.x + 3, 4.2]] }, downs: false, cove: false });
    droom(1, "sports", "Low-gravity sports hall", "sports", rr(hx0, hx1, hz0, hz1), HH);
    // court lines, hoops at 7.8 m (a Mars rim), a climbing wall and a running track
    box("marking", 40, 0.006, 0.08, 37, y + 0.001, 8); box("marking", 40, 0.006, 0.08, 37, y + 0.001, 36); box("marking", 0.08, 0.006, 28, 17, y + 0.001, 22); box("marking", 0.08, 0.006, 28, 57, y + 0.001, 22); box("marking", 0.08, 0.006, 28, 37, y + 0.001, 22);
    addGeo("marking", new THREE.TorusGeometry(3.6, 0.04, 4, 64), mat4(37, y + 0.005, 22, 0, 1, 1, 0.2, Math.PI / 2));
    [[18.5, 1], [55.5, -1]].forEach(function (hp) { box("steel", 0.3, 7.8, 0.3, hp[0] - hp[1] * 1.8, y, 22); box("white", 0.08, 1.2, 1.8, hp[0] - hp[1] * 0.2, y + 7.2, 22); addGeo("orange", new THREE.TorusGeometry(0.23, 0.02, 8, 24), mat4(hp[0] + hp[1] * 0.1, y + 7.8, 22, 0, 1, 1, 1, Math.PI / 2)); box("steel", 1.6, 0.1, 0.1, hp[0] - hp[1] * 1, y + 7.5, 22); });
    box("rock", 30, HH - 0.5, 0.6, 37, y, hz1 - 0.3); var hr = mulberry(9);
    for (var hd = 0; hd < 160; hd++) sph(["fruitR", "fruitY", "fabTeal", "fabRust", "fruitO"][hd % 5], 0.09, 22.5 + hr() * 29, y + 0.4 + hr() * (HH - 1.5), hz1 - 0.66, 6, null, 1.3, 1, 0.6);
    rbox("carpetRust", hx1 - hx0 - 2, 0.01, 1.4, 37, y, hz0 + 1.7, 0, 0.004); rbox("carpetRust", hx1 - hx0 - 2, 0.01, 1.4, 37, y, hz1 - 2.8, 0, 0.004); rbox("carpetRust", 1.4, 0.01, hz1 - hz0 - 5, hx0 + 1.7, y, 22, 0, 0.004); rbox("carpetRust", 1.4, 0.01, hz1 - hz0 - 5, hx1 - 1.7, y, 22, 0, 0.004);
    for (var fl2 = 0; fl2 < 4; fl2++) box("lampCool", 12, 0.1, 1.2, 13 + fl2 * 16, y + HH - 0.2, 22);
    lightsAt([[21, y + 8, 22], [37, y + 8, 22], [53, y + 8, 22], [37, y + 6, 40]]);
    YOFF = 0; ZONE = "surface";
  }
