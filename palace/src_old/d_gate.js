  /* ============================== the Gatehouse: arrival, airlock and the way down ============================== */
  // Local frame: +z runs out from the Great Dome towards the north-east, +x points north-west.
  var GH = { r: 52, ang: -Math.PI / 4 };
  GH.x = Math.cos(GH.ang) * GH.r; GH.z = Math.sin(GH.ang) * GH.r; GH.ry = 3 * Math.PI / 4;
  var GF = new F(GH.x, GH.z, GH.ry);
  function gw(lx, lz) { return [GF.wx(lx, lz), GF.wz(lx, lz)]; }
  function gShape(lz0, lz1, hw) { var c = gw(0, (lz0 + lz1) / 2); return ["o", c[0], c[1], (lz1 - lz0) / 2, hw, GH.ang]; }
  var LIFTS = [{ lx: 5.5, lz: -6 }, { lx: -5.5, lz: -6 }];
  LIFTS.forEach(function (l) { var w = gw(l.lx, l.lz); l.x = w[0]; l.z = w[1]; });
  var PADW = gw(0, 58); // the air-taxi pad in front of the Gatehouse
  var DOORW = { outer: gw(0, 19), inner: gw(0, 12), scan: gw(3.4, 21.8) };

  ROOMS.push(
    { id: "linkNE", s: gShape(-26.4, -11, 2.2), kind: "link" },
    { id: "gate", name: "Gatehouse", stop: "gatehouse", s: gShape(-12, 12, 8) },
    { id: "airlock", name: "Airlock", stop: "gatehouse", s: gShape(12, 19, 4.5) }
  );
  DOORS.push(gShape(-27, -25, 1.2), gShape(11.2, 12.8, 1.5), gShape(18.2, 20.2, 1.8));
  FOOTPRINTS.push(gShape(-27, 19.4, 9.6));
  // the portal pylons and the scanner stand outside the walls
  [-6.4, 6.4].forEach(function (lx) { var c = gw(lx, 20.4); BLOCKS.push(["o", c[0], c[1], 2, 1.4, GH.ang]); });
  BLOCKS.push(["c", DOORW.scan[0], DOORW.scan[1], 0.4]);
  LIFTS.forEach(function (l) { BLOCKS.push(["c", l.x, l.z, 1.55]); });
  (function () { var a = gw(0, 0), b = gw(0, -8), c = gw(0, 8), d = gw(0, -19), e = gw(0, 15.5), f = gw(0, 24);
    LIGHT_ANCHORS.push([a[0], 7, a[1]], [b[0], 4, b[1]], [c[0], 4, c[1]], [d[0], 3, d[1]], [e[0], 4, e[1]], [f[0], 7, f[1]]); })();

  // the TV in the Great Dome faces the conversation pit
  var TVS = [{ id: "dome", x: Math.cos(3.6) * 9.4, z: Math.sin(3.6) * 9.4, y: 1.55, ry: Math.atan2(-Math.cos(3.6), -Math.sin(3.6)), w: 3.3, h: 1.86, lv: 0 }];

  function buildGatehouse() {
    var G = GF;
    // ---------- link corridor from the dome ----------
    G.box("stone", 4.4, 0.1, 14.6, 0, -0.1, -18.6)
     .box("shell", 0.4, 3.8, 14.6, -2.4, 0, -18.6).box("shell", 0.4, 3.8, 14.6, 2.4, 0, -18.6)
     .box("panelWood", 0.05, 1.05, 14.4, -2.17, 0, -18.6).box("panelWood", 0.05, 1.05, 14.4, 2.17, 0, -18.6)
     .box("wall", 0.04, 2.6, 14.4, -2.18, 1.05, -18.6).box("wall", 0.04, 2.6, 14.4, 2.18, 1.05, -18.6)
     .box("shell", 5.4, 0.45, 14.6, 0, 3.8, -18.6, 0, "roof").box("plaster", 4.3, 0.04, 14.4, 0, 3.62, -18.6)
     .box("lampSoft", 0.06, 0.05, 14, -2.1, 3.5, -18.6).box("lampSoft", 0.06, 0.05, 14, 2.1, 3.5, -18.6);
    for (var ln = 0; ln < 4; ln++) G.cyl("led", 0.12, 0.02, 0, 3.6, -24 + ln * 3.6, 16);
    // ---------- the hall: marble floor with an oculus looking 104 m down, and two glass lifts ----------
    var sh = new THREE.Shape(); sh.moveTo(-8, -12); sh.lineTo(8, -12); sh.lineTo(8, 12); sh.lineTo(-8, 12); sh.lineTo(-8, -12);
    function hole(x, y, r) { var h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); sh.holes.push(h); }
    hole(0, 0, 6); LIFTS.forEach(function (l) { hole(l.lx, -l.lz, 1.45); });
    var fg = new THREE.ShapeGeometry(sh, 48); fg.rotateX(-Math.PI / 2); addGeo("stone", fg, mat4(G.x, 0.002, G.z, G.ry, 1, 1, 1));
    var og = new THREE.CircleGeometry(6, 64); og.rotateX(-Math.PI / 2); addGeo("glass", og, mat4(G.x, 0.0, G.z, 0, 1, 1, 1), null, true);
    addGeo("gold", new THREE.TorusGeometry(6.02, 0.07, 8, 96), mat4(G.x, 0.02, G.z, 0, 1, 1, 1, Math.PI / 2));
    for (var ob = 0; ob < 8; ob++) { var oa = ob / 8 * Math.PI; G.box("gold", 12, 0.04, 0.06, 0, -0.02, 0, oa); }
    // walls: sintered shell outside, marble and bronze fins inside, light slots down the long sides
    var H = 11;
    [-1, 1].forEach(function (sd) {
      for (var sz = -12; sz < 12; sz += 3) {
        G.box("shell", 0.6, H, 2.55, sd * 8.3, 0, sz + 1.275).box("stone", 0.04, H - 1, 2.5, sd * 7.98, 0, sz + 1.275);
        G.box("glass", 0.06, H - 2, 0.42, sd * 8.3, 0.6, sz + 2.76).box("gold", 0.12, H - 1, 0.08, sd * 7.94, 0, sz + 2.55).box("gold", 0.12, H - 1, 0.08, sd * 7.94, 0, sz + 2.97);
      }
    });
    G.box("shell", 6.4, H, 0.6, -5.4, 0, 12.3).box("shell", 6.4, H, 0.6, 5.4, 0, 12.3).box("shell", 4.4, H - 3.2, 0.6, 0, 3.2, 12.3).box("shell", 6.4, H, 0.6, -5.4, 0, -12.3).box("shell", 6.4, H, 0.6, 5.4, 0, -12.3).box("shell", 4.4, H - 3.8, 0.6, 0, 3.8, -12.3);
    G.box("stone", 5.75, H - 1, 0.04, -5.075, 0, 11.98).box("stone", 5.75, H - 1, 0.04, 5.075, 0, 11.98).box("stone", 4.4, H - 4.2, 0.04, 0, 3.2, 11.98).box("stone", 5.6, H - 1, 0.04, -5.2, 0, -11.98).box("stone", 5.6, H - 1, 0.04, 5.2, 0, -11.98);
    G.rbox("gold", 4.8, 0.3, 0.1, 0, 3.8, -11.95, 0.02).rbox("gold", 9.8, 0.3, 0.1, 0, 6.1, 11.95, 0.02);
    // ceiling: coffered, with a long skylight lantern
    G.box("plaster", 16, 0.1, 24, 0, H - 0.6, 0);
    for (var cb = -10; cb <= 10; cb += 4) G.box("wood", 16, 0.5, 0.25, 0, H - 1.1, cb);
    for (var cx2 = -6; cx2 <= 6; cx2 += 4) G.box("wood", 0.25, 0.5, 24, cx2, H - 1.1, 0);
    G.box("glass", 4, 0.06, 20, 0, H + 0.6, 0, 0, "roof").box("shell", 17.6, 0.6, 24.6, 0, H - 0.5, 0, 0, "roof").box("steel", 4.4, 1.2, 0.2, 0, H, -10.1, 0, "roof").box("steel", 4.4, 1.2, 0.2, 0, H, 10.1, 0, "roof");
    G.box("lampSoft", 15.6, 0.05, 0.08, 0, H - 1.25, -11.8).box("lampSoft", 15.6, 0.05, 0.08, 0, H - 1.25, 11.8);
    // halo over the oculus
    var halo = new THREE.TorusGeometry(4.2, 0.05, 8, 96); addGeo("lamp", halo, mat4(G.x, 7.2, G.z, 0, 1, 1, 1, Math.PI / 2));
    addGeo("gold", new THREE.TorusGeometry(4.26, 0.035, 6, 96), mat4(G.x, 7.25, G.z, 0, 1, 1, 1, Math.PI / 2));
    for (var hw2 = 0; hw2 < 6; hw2++) { var ha = hw2 / 6 * Math.PI * 2; cyl("gold", 0.006, H - 1.6 - 7.2, G.x + Math.cos(ha) * 4.2, 7.2, G.z + Math.sin(ha) * 4.2, 3); }
    // glass lift shafts
    LIFTS.forEach(function (l) {
      addGeo("glass", new THREE.CylinderGeometry(1.4, 1.4, 7, 36, 1, true), mat4(l.x, 3.5, l.z, 0, 1, 1, 1), null, true);
      [0.02, 3.5, 7].forEach(function (yy) { addGeo("gold", new THREE.TorusGeometry(1.42, 0.05, 6, 48), mat4(l.x, yy, l.z, 0, 1, 1, 1, Math.PI / 2)); });
      cyl("darkMetal", 1.6, 0.6, l.x, 7, l.z, 36); cyl("gold", 1.62, 0.08, l.x, 7.6, l.z, 36);
      for (var rr = 0; rr < 6; rr++) { var ra = rr / 6 * Math.PI * 2; cyl("gold", 0.03, 7, l.x + Math.cos(ra) * 1.44, 0, l.z + Math.sin(ra) * 1.44, 6); }
    });
    // benches, planters and a plaque
    [-1, 1].forEach(function (sd) {
      G.rbox("leather", 3.2, 0.12, 0.7, sd * 6.2, 0.4, 5, 0.04).rbox("basalt", 3.2, 0.4, 0.62, sd * 6.2, 0, 5, 0.01).blob(3.6, 1, sd * 6.2, 5, 0.5);
      var tp = gw(sd * 6, 9.6); lathe("basalt", [[0, 0], [0.7, 0], [0.75, 0.9], [0.68, 0.92], [0, 0.9]], tp[0], 0, tp[1], 32); tree(tp[0], tp[1], 0.85, null, 0.9);
    });
    var plq = canvasTex(1024, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9a7440"); gr.addColorStop(1, "#6d5028"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "#3a2a14"; g.font = "600 96px Georgia, serif"; g.textAlign = "center"; g.fillText("ARCADIA", w / 2, 120); g.font = "36px Georgia, serif"; g.fillText("ARCADIA PLANITIA  ·  MARS  ·  44.2° N", w / 2, 200);
    });
    var pm = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshStandardMaterial({ map: plq, metalness: 0.7, roughness: 0.4 }));
    var pp = gw(0, -11.9); pm.position.set(pp[0], 6.2, pp[1]); pm.rotation.y = G.ry; put(pm);
    // ---------- airlock ----------
    G.box("darkMetal", 9, 0.12, 7, 0, -0.1, 15.5).box("shell", 0.6, 6.5, 7.6, -4.8, 0, 15.5).box("shell", 0.6, 6.5, 7.6, 4.8, 0, 15.5)
     .box("stainless", 0.04, 5.8, 7, -4.48, 0, 15.5).box("stainless", 0.04, 5.8, 7, 4.48, 0, 15.5).box("shell", 10.2, 0.6, 7.6, 0, 6.5, 15.5, 0, "roof").box("stainless", 9, 0.05, 7, 0, 5.8, 15.5)
     .box("shell", 2.4, 6.5, 0.6, -3.6, 0, 19).box("shell", 2.4, 6.5, 0.6, 3.6, 0, 19).box("shell", 4.8, 1.3, 0.6, 0, 5.2, 19)
     .box("shell", 2.6, 6, 0.4, -3.5, 0, 12).box("shell", 2.6, 6, 0.4, 3.5, 0, 12).box("shell", 4.4, 2.8, 0.4, 0, 3.2, 12);
    for (var nz = 0; nz < 6; nz++) { G.cyl("steel", 0.05, 0.1, -4.4, 1 + (nz % 3) * 1.4, 13.6 + Math.floor(nz / 3) * 3.8, 8).cyl("steel", 0.05, 0.1, 4.4, 1 + (nz % 3) * 1.4, 13.6 + Math.floor(nz / 3) * 3.8, 8); }
    G.box("lampCool", 7, 0.04, 0.2, 0, 5.75, 14).box("lampCool", 7, 0.04, 0.2, 0, 5.75, 17);
    // stainless linings on the end walls, a bronze frame round the glass inner doors
    [-1, 1].forEach(function (sd) { G.box("stainless", 2.6, 5.8, 0.03, sd * 3.5, 0, 12.64).box("stainless", 2.4, 5.8, 0.03, sd * 3.6, 0, 18.68).box("goldDark", 0.12, 3.3, 0.12, sd * 2.26, 0, 12.68); });
    G.box("stainless", 4.4, 2.6, 0.03, 0, 3.2, 12.64).box("stainless", 4.8, 0.6, 0.03, 0, 5.2, 18.68).box("goldDark", 4.64, 0.12, 0.12, 0, 3.2, 12.68);
    // the face of the house: polished basalt round a ring of light
    [-1, 1].forEach(function (sd) { G.box("basalt", 2.4, 6.5, 0.08, sd * 3.6, 0, 19.34); });
    G.box("basalt", 4.8, 1.3, 0.08, 0, 5.2, 19.34);
    G.geo("goldDark", new THREE.TorusGeometry(3.52, 0.2, 18, 128), 0, 2.72, 19.52).geo("lamp", new THREE.TorusGeometry(3.24, 0.045, 8, 128), 0, 2.72, 19.5)
     .geo("gold", new THREE.TorusGeometry(3.8, 0.04, 8, 128), 0, 2.72, 19.46);
    // ---------- the portal: basalt pylons, a bronze canopy, the scanner ----------
    G.rbox("basaltRough", 2.2, 13, 3.4, -6.4, 0, 20.4, 0.06).rbox("basaltRough", 2.2, 13, 3.4, 6.4, 0, 20.4, 0.06)
     .rbox("goldDark", 15.2, 0.35, 7, 0, 10, 22.4, 0.05).rbox("gold", 15.2, 0.08, 7.05, 0, 9.96, 22.4, 0.02)
     .box("lampSoft", 12, 0.04, 0.1, 0, 9.9, 25.7).box("lampSoft", 0.1, 0.04, 6, -7.3, 9.9, 22.4).box("lampSoft", 0.1, 0.04, 6, 7.3, 9.9, 22.4);
    for (var cc = 0; cc < 5; cc++) G.cyl("ledWhite", 0.1, 0.03, -4 + cc * 2, 9.92, 22.4, 12);
    G.rbox("basalt", 0.36, 1.35, 0.3, 3.4, 0, 21.8, 0.03).cyl("ledBlue", 0.11, 0.02, 3.4, 1.26, 21.96, 20).rbox("glassDark", 0.26, 0.26, 0.02, 3.4, 1.1, 21.96, 0.01);
    // ---------- walkway and the arrival pad ----------
    G.box("basalt", 5, 0.08, 23, 0, -0.06, 33.5);
    for (var pv = 22; pv < 45; pv += 1.2) G.box("slate", 5.02, 0.005, 0.03, 0, 0.02, pv);
    for (var bl = 24; bl < 46; bl += 4) [-1, 1].forEach(function (sd) { G.cyl("darkMetal", 0.09, 0.9, sd * 3.1, 0, bl, 12).cyl("ledWhite", 0.07, 0.05, sd * 3.1, 0.9, bl, 12); });
    cyl("pad", 14, 0.35, PADW[0], -0.3, PADW[1], 64);
    addGeo("marking", new THREE.TorusGeometry(10.5, 0.22, 4, 96), mat4(PADW[0], 0.06, PADW[1], 0, 1, 1, 0.1, Math.PI / 2));
    G.box("marking", 7, 0.02, 0.5, 0, 0.05, 58).box("marking", 0.5, 0.02, 7, 0, 0.05, 58);
    for (var pl = 0; pl < 24; pl++) { var pa = pl / 24 * Math.PI * 2; sph("ledBlue", 0.14, PADW[0] + Math.cos(pa) * 13.4, 0.08, PADW[1] + Math.sin(pa) * 13.4, 8); }
  }
