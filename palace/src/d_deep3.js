
  /* ============================== L4 · the Engine level ============================== */
  function robotArm(x, y, z, ry, s) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry;
    function part(geo, mat, px, py, pz, parent) { var m = new THREE.Mesh(geo, M[mat]); m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; (parent || g).add(m); return m; }
    part(new THREE.CylinderGeometry(0.7 * s, 0.85 * s, 0.6 * s, 24), "darkMetal", 0, 0.3 * s, 0);
    var turret = new THREE.Group(); turret.position.y = 0.6 * s; g.add(turret); part(new THREE.CylinderGeometry(0.55 * s, 0.6 * s, 0.7 * s, 24), "orange", 0, 0.35 * s, 0, turret);
    var sh = new THREE.Group(); sh.position.y = 0.8 * s; turret.add(sh); part(new THREE.BoxGeometry(0.5 * s, 2.6 * s, 0.5 * s), "orange", 0, 1.3 * s, 0, sh); part(new THREE.CylinderGeometry(0.34 * s, 0.34 * s, 0.7 * s, 20), "darkMetal", 0, 0, 0, sh).rotation.z = Math.PI / 2;
    var el = new THREE.Group(); el.position.y = 2.6 * s; sh.add(el); part(new THREE.BoxGeometry(0.38 * s, 2.1 * s, 0.38 * s), "orange", 0, 1.05 * s, 0, el); part(new THREE.CylinderGeometry(0.26 * s, 0.26 * s, 0.56 * s, 20), "darkMetal", 0, 0, 0, el).rotation.z = Math.PI / 2;
    var wr = new THREE.Group(); wr.position.y = 2.1 * s; el.add(wr); part(new THREE.CylinderGeometry(0.16 * s, 0.2 * s, 0.4 * s, 16), "steel", 0, 0.2 * s, 0, wr); part(new THREE.BoxGeometry(0.3 * s, 0.08 * s, 0.3 * s), "darkMetal", 0, 0.44 * s, 0, wr);
    put(g); return { turret: turret, sh: sh, el: el, wr: wr, ph: x * 0.37 + z * 0.13 };
  }
  function ledRackTex() {
    return canvasTex(256, 512, function (g, w, h) {
      g.fillStyle = "#07090c"; g.fillRect(0, 0, w, h); var r = mulberry(5);
      for (var u = 0; u < 22; u++) { var y0 = 8 + u * 22.5; g.fillStyle = "#11151b"; g.fillRect(8, y0, w - 16, 19); for (var k = 0; k < 18; k++) if (r() < 0.55) { g.fillStyle = r() < 0.75 ? "#39d0ff" : (r() < 0.5 ? "#6dff9c" : "#ffb23a"); g.fillRect(16 + k * 12, y0 + 7, 4, 4); } }
    });
  }
  function buildEngine() {
    ZONE = "deep4"; var y = 0; YOFF = LVY[4];
    hall({ lv: 4, x0: AC.x - 4, x1: AC.x + 4, z0: AC.z + ATR.r1 - 0.6, z1: 20, y: y, h: 6, floor: "concrete", wall: "concrete", open: { n: true, s: true }, downs: 4 });
    droom(4, "corS4", "Engine hall", "fusion", rr(AC.x - 4, AC.x + 4, AC.z + ATR.r1 - 0.2, 20.5), 6, { kind: "link" });
    // Engine street: the working spine, every hall opens off it
    var ROOMS4 = [["works", -60, 0], ["fusion", 0, 100], ["fab", 100, 190]];
    hall({ lv: 4, x0: -60, x1: 190, z0: 20, z1: 28, y: y, h: 8, floor: "concrete", wall: "concrete", downs: 6,
      doors: { s: ROOMS4.map(function (r) { var m = (r[1] + r[2]) / 2; return [m - 4, m + 4, 6]; }), n: [[AC.x - 4, AC.x + 4, 6], [-16, -12, 4], [84, 88, 4]] } });
    droom(4, "street", "Engine street", "fusion", rr(-60, 190, 20, 28), 8);
    box("yellow", 250, 0.006, 0.12, 65, y + 0.001, 21.2); box("yellow", 250, 0.006, 0.12, 65, y + 0.001, 26.8);
    // ---------- fusion hall ----------
    var fz0 = 28, fz1 = 108, FH = 30, cx = 50, cz = 70;
    hall({ lv: 4, x0: 0, x1: 100, z0: fz0, z1: fz1, y: y, h: FH, floor: "concrete", wall: "concrete", ceil: "concrete", open: { n: true }, downs: false, cove: false });
    droom(4, "fusion", "Fusion hall", "fusion", rr(0, 100, fz0, fz1), FH);
    lathe("concrete", [[0, 0], [17, 0], [17, 2.2], [15, 2.4], [0, 2.4]], cx, y, cz, 64);
    var vessel = new THREE.TorusGeometry(11, 4.2, 32, 96, Math.PI * 1.55); addGeo("stainless", vessel, mat4(cx, y + 8.6, cz, 0.6, 1, 1, 1, Math.PI / 2));
    var plasma = new THREE.Mesh(new THREE.TorusGeometry(11, 2.2, 24, 128), new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uT; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); } void main(){ float s = n(vec2(vUv.x * 60.0 - uT * 3.0, vUv.y * 6.0)) * 0.6 + n(vec2(vUv.x * 140.0 + uT * 5.0, vUv.y * 14.0)) * 0.4; float core = pow(sin(vUv.y * 3.14159), 3.0); gl_FragColor = vec4(vec3(1.0, 0.45, 0.95) * (0.8 + s) * core * 2.4, core * 0.8); }"
    }));
    plasma.rotation.x = Math.PI / 2; plasma.position.set(cx, y + 8.6, cz); put(plasma); DEEPDYN.plasma = plasma.material;
    var dsh = new THREE.Shape(); dsh.moveTo(0, -8.5); dsh.lineTo(0, 8.5); dsh.bezierCurveTo(5, 9.2, 10.5, 5, 10.5, 0); dsh.bezierCurveTo(10.5, -5, 5, -9.2, 0, -8.5);
    var dh = new THREE.Path(); dh.moveTo(0.9, -7); dh.bezierCurveTo(4.5, -7.7, 9.3, -4.2, 9.3, 0); dh.bezierCurveTo(9.3, 4.2, 4.5, 7.7, 0.9, 7); dh.lineTo(0.9, -7); dsh.holes.push(dh);
    var dcoil = new THREE.ExtrudeGeometry(dsh, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 20 }); dcoil.translate(0, 0, -0.45);
    for (var c = 0; c < 18; c++) { var a = c / 18 * Math.PI * 2; if (a > 0.6 + Math.PI * 1.55 - 0.1 && a < 0.6 + Math.PI * 2 - 0.2) continue; geoAt("goldDark", dcoil, cx + Math.cos(a) * 5.2, y + 8.6, cz + Math.sin(a) * 5.2, -a); }
    cyl("goldDark", 3, 19, cx, y + 2.4, cz, 40); cyl("steel", 3.1, 0.5, cx, y + 21.4, cz, 40);
    for (var pt = 0; pt < 8; pt++) { var pa = pt / 8 * Math.PI * 2; seg("steel", cx + Math.cos(pa) * 16, y + 2.4, cz + Math.sin(pa) * 16, cx + Math.cos(pa) * 22, y + 2.4 + 12, cz + Math.sin(pa) * 22, 0.4, 0.4, 12); seg("steel", cx + Math.cos(pa) * 22, y + 14.4, cz + Math.sin(pa) * 22, cx + Math.cos(pa) * 22, y + FH - 1, cz + Math.sin(pa) * 22, 0.4, 0.4, 12); }
    [[18, 98], [50, 101], [82, 98]].forEach(function (t) { cylC("steel", 3, 14, t[0], y + 3.2, t[1], 32, null, 0, Math.PI / 2); cylC("darkMetal", 3.2, 0.6, t[0] - 7, y + 3.2, t[1], 32, null, 0, Math.PI / 2); cylC("darkMetal", 3.2, 0.6, t[0] + 7, y + 3.2, t[1], 32, null, 0, Math.PI / 2); box("concrete", 12, 0.3, 5, t[0], y, t[1]); });
    // gantry crane and the control gallery
    box("yellow", 1, 1.4, 80, 4, y + FH - 3, (fz0 + fz1) / 2); box("yellow", 1, 1.4, 80, 96, y + FH - 3, (fz0 + fz1) / 2); box("yellow", 92, 1.6, 1.4, 50, y + FH - 4.6, 60); box("darkMetal", 3, 2, 3, 50, y + FH - 6.4, 60); seg("steel", 50, y + FH - 6.4, 60, 50, y + 14, 60, 0.05, 0.05, 6);
    box("concrete", 30, 0.4, 5, 16, y + 6, fz0 + 2.5); box("glass", 30, 1.1, 0.06, 16, y + 6.4, fz0 + 5); box("gold", 30, 0.06, 0.08, 16, y + 7.5, fz0 + 5);
    for (var sc = 0; sc < 6; sc++) { rbox("black", 1.6, 1, 0.08, 4 + sc * 4.5, y + 6.9, fz0 + 0.6, 0, 0.02); rbox("ledBlue", 1.5, 0.9, 0.02, 4 + sc * 4.5, y + 6.95, fz0 + 0.66, 0, 0.01); }
    for (var fl = 0; fl < 6; fl++) box("lampCool", 3, 0.2, 60, 10 + fl * 16, y + FH - 0.3, (fz0 + fz1) / 2);
    lightsAt([[cx, y + 12, cz], [cx - 20, y + 10, cz - 25], [cx + 20, y + 10, cz + 20], [16, y + 8, fz0 + 3]]);
    // ---------- fabrication and robotics ----------
    hall({ lv: 4, x0: 100, x1: 190, z0: fz0, z1: fz1, y: y, h: 18, floor: "concrete", wall: "concrete", ceil: "concrete", open: { n: true }, downs: false, cove: false });
    droom(4, "fab", "Fabrication hall", "fab", rr(100, 190, fz0, fz1), 18);
    DEEPDYN.arms = [];
    [[122, 48], [136, 48], [150, 48], [122, 62], [136, 62], [150, 62]].forEach(function (p, i) { DEEPDYN.arms.push(robotArm(p[0], y, p[1], i * 0.9, 1)); box("yellow", 6, 0.006, 6, p[0], y + 0.002, p[1]); rbox("steel", 2.2, 0.9, 1.4, p[0] + 2.6, y, p[1] + 1.6, 0, 0.02); });
    // the big regolith printer, printing a dome segment
    [[160, 74], [184, 74], [160, 100], [184, 100]].forEach(function (q) { box("darkMetal", 0.6, 14, 0.6, q[0], y, q[1]); });
    box("darkMetal", 25, 0.8, 0.8, 172, y + 14, 74); box("darkMetal", 25, 0.8, 0.8, 172, y + 14, 100);
    var gant = new THREE.Group(), gb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 26), M.orange); gant.add(gb); var head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), M.darkMetal); head.position.y = -1.2; gant.add(head);
    var noz = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 3.5, 12), M.steel); noz.position.y = -3.6; head.add(noz); gant.position.set(166, y + 14.8, 87); gant.traverse(function (m) { if (m.isMesh) m.castShadow = true; }); put(gant); DEEPDYN.gantry = { g: gant, head: head };
    var shellP = new THREE.SphereGeometry(8, 48, 16, 0, Math.PI, 0, Math.PI * 0.42); addGeo("shell", shellP, mat4(172, y, 87, 0, 1, 1, 1));
    for (var dr = 0; dr < 5; dr++) { box("steel", 12, 0.08, 1.4, 112, y + 1 + dr * 1.3, 102); for (var dd = 0; dd < 6; dd++) { var dx = 107 + dd * 2; rbox("black", 0.7, 0.14, 0.7, dx, y + 1.1 + dr * 1.3, 102, 0, 0.03); for (var pr = 0; pr < 4; pr++) cyl("steel", 0.18, 0.02, dx + (pr % 2 ? 0.34 : -0.34), y + 1.26 + dr * 1.3, 102 + (pr < 2 ? 0.34 : -0.34), 12); } }
    for (var fl2 = 0; fl2 < 5; fl2++) box("lampCool", 2.5, 0.2, 70, 110 + fl2 * 18, y + 17.7, 68);
    lightsAt([[136, y + 10, 55], [172, y + 10, 87], [112, y + 6, 100]]);
    // ---------- water and air works ----------
    hall({ lv: 4, x0: -60, x1: 0, z0: fz0, z1: fz1, y: y, h: 14, floor: "concrete", wall: "concrete", ceil: "concrete", open: { n: true }, downs: false, cove: false });
    droom(4, "works", "Water & air works", "works", rr(-60, 0, fz0, fz1), 14);
    for (var tk = 0; tk < 8; tk++) { var tx = -52 + (tk % 4) * 12, tz = 45 + Math.floor(tk / 4) * 22; lathe("white", [[0, 0], [3.2, 0], [3.4, 0.4], [3.4, 9], [2.6, 10.6], [0.6, 11.2], [0, 11.2]], tx, y, tz, 40); cyl("steel", 3.45, 0.2, tx, y + 3, tz, 40); cyl("steel", 3.45, 0.2, tx, y + 6.5, tz, 40); seg("steel", tx, y + 11.2, tz, tx, y + 13.6, tz, 0.25, 0.25, 10); DBLOCKS[4].push(["c", tx, tz, 3.6]); }
    for (var el = 0; el < 4; el++) { var ex = -52 + el * 12; rbox("steel", 4, 2.6, 2.2, ex, y, 96, 0, 0.05); for (var ep = 0; ep < 10; ep++) box("darkMetal", 4.05, 0.05, 2.25, ex, y + 0.3 + ep * 0.22, 96); rbox("gold", 2, 1.4, 1.4, ex, y, 102, 0, 0.1); }
    for (var pp = 0; pp < 6; pp++) seg("steel", -58, y + 12 - pp * 0.6, 34 + pp * 12, -2, y + 12 - pp * 0.6, 34 + pp * 12, 0.3, 0.3, 10);
    for (var fl3 = 0; fl3 < 3; fl3++) box("lampCool", 2.5, 0.2, 70, -50 + fl3 * 20, y + 13.7, 68);
    lightsAt([[-30, y + 8, 50], [-30, y + 8, 90], [-10, y + 4, 34]]);
    // ---------- AI core: servers round a quantum "chandelier" ----------
    var ax0 = 60, ax1 = 110, az0 = -8, az1 = 20;
    hall({ lv: 4, x0: ax0, x1: ax1, z0: az0, z1: az1, y: y, h: 8, floor: "darkMetal", wall: "concrete", ceil: "black", open: { s: true }, downs: false, cove: false });
    droom(4, "aicore", "AI core", "aicore", rr(ax0, ax1, az0, az1), 8);
    var rackMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.4, metalness: 0.5, emissiveMap: ledRackTex(), emissive: 0xffffff, emissiveIntensity: 1.6 });
    var rg = new THREE.BoxGeometry(0.8, 2.3, 1.2), rIM = new THREE.InstancedMesh(rg, rackMat, 72), o = new THREE.Object3D(), ri = 0;
    for (var row = 0; row < 4; row++) for (var k = 0; k < 18; k++) { o.position.set(ax0 + 3 + k * 0.82 + (k > 8 ? 12 : 0), y + 1.15, az0 + 3 + row * 6); o.rotation.set(0, Math.PI / 2 * (row % 2 ? -1 : 1), 0); o.updateMatrix(); rIM.setMatrixAt(ri++, o.matrix); }
    rIM.castShadow = true; put(rIM); DEEPDYN.racks = rackMat;
    var qx = 85, qz = 6;
    addGeo("glass", new THREE.CylinderGeometry(2.4, 2.4, 7.6, 40, 1, true), mat4(qx, y + 3.8, qz, 0, 1, 1, 1), null, true);
    [0, 1.4, 2.6, 3.7, 4.6].forEach(function (hh, i) { cyl("gold", 1.7 - i * 0.22, 0.1, qx, y + 7.2 - hh, qz, 40); for (var cc = 0; cc < 8; cc++) { var ca = cc / 8 * Math.PI * 2; cyl("gold", 0.025, 1.1, qx + Math.cos(ca) * (1.3 - i * 0.2), y + 6.1 - hh, qz + Math.sin(ca) * (1.3 - i * 0.2), 6); } });
    cyl("gold", 0.35, 0.3, qx, y + 2.3, qz, 20); cyl("ledBlue", 2.3, 0.04, qx, y + 0.01, qz, 40);
    lightsAt([[qx, y + 5, qz], [70, y + 5, 6], [102, y + 5, 6]]);
    // ---------- seed and gene vault, medical bay with hibernation pods ----------
    var vx0 = -40, vx1 = 12;
    hall({ lv: 4, x0: vx0, x1: vx1, z0: az0, z1: az1, y: y, h: 6, floor: "white", wall: "wall", open: { s: true }, downs: 3.5 });
    droom(4, "vault", "Seed vault & medical bay", "vault", rr(vx0, vx1, az0, az1), 6);
    for (var dcol = 0; dcol < 30; dcol++) for (var drow = 0; drow < 8; drow++) { rbox("steel", 0.78, 0.5, 0.5, vx0 + 1 + dcol * 0.82, y + 0.3 + drow * 0.62, az0 + 0.3, 0, 0.02); box("ledBlue", 0.3, 0.02, 0.02, vx0 + 1 + dcol * 0.82, y + 0.72 + drow * 0.62, az0 + 0.56); }
    box("fabWhite", 25, 0.02, 6, vx0 + 13, y + 0.003, az0 + 4);
    box("glass", 0.06, 5.8, 26, -14, y, (az0 + az1) / 2);
    for (var pod = 0; pod < 3; pod++) { var px = -9 + pod * 6, pz = 12; var pf = new F(px, pz, 0); pf.rbox("white", 1.4, 0.9, 2.8, 0, 0, 0, 0.3).rbox("darkMetal", 1.3, 0.2, 2.7, 0, 0.9, 0, 0.05); var lid = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2); lid.scale(0.62, 0.45, 1.3); addGeo("glass", lid, mat4(px, y + 1.1, pz, 0, 1, 1, 1), null, true); rbox("ledBlue", 1.2, 0.02, 2.4, px, y + 1.1, pz, 0, 0.01); }
    var sr = new F(2, 2, 0); sr.rbox("white", 2.2, 0.9, 0.9, 0, 0, 0, 0.05).rbox("fabTeal", 2, 0.1, 0.7, 0, 0.9, 0, 0.04); robotArm(3.5, y, 3.8, -2.6, 0.5); robotArm(0.5, y, 0.2, 0.6, 0.5);
    lightsAt([[-26, y + 4, 4], [-3, y + 4, 10]]);
    YOFF = 0; ZONE = "surface";
  }

  /* ============================== L5 · Transit: the maglev and the storm reserves ============================== */
  function buildTransit() {
    ZONE = "deep5"; var y = 0; YOFF = LVY[5];
    hall({ lv: 5, x0: AC.x + ATR.r1 - 0.6, x1: 80, z0: AC.z - 4, z1: AC.z + 4, y: y, h: 5, floor: "stone", wall: "concrete", open: { w: true, e: true }, downs: 4 });
    droom(5, "corE5", "Station hall", "maglev", rr(AC.x + ATR.r1 - 1, 81, AC.z - 4, AC.z + 4), 5, { kind: "link" });
    var sx0 = 80, sx1 = 160, sz0 = -54, sz1 = -22;
    hall({ lv: 5, x0: sx0, x1: sx1, z0: sz0, z1: sz1, y: y, h: 12, floor: "stone", wall: "concrete", ceil: "concrete", open: { e: true }, doors: { w: [[AC.z - 4, AC.z + 4, 4.6]] }, downs: false, cove: false });
    droom(5, "maglev", "Maglev station", "maglev", rr(sx0, sx1, sz0, -40.6), 12);
    // the track trench and the capsule train
    box("black", sx1 - sx0 + 60, 1.6, 14, (sx0 + sx1) / 2 + 30, y - 1.6, -33); box("concrete", sx1 - sx0 + 60, 0.4, 3, (sx0 + sx1) / 2 + 30, y - 1.6, -33); box("ledBlue", sx1 - sx0, 0.03, 0.06, (sx0 + sx1) / 2, y - 1.2, -34.6); box("ledBlue", sx1 - sx0, 0.03, 0.06, (sx0 + sx1) / 2, y - 1.2, -31.4);
    for (var ps = sx0 + 2; ps < sx1 - 2; ps += 4) { box("glass", 3.2, 2.6, 0.06, ps + 1.6, y, -40.3); box("steel", 0.12, 2.8, 0.12, ps, y, -40.3); }
    box("steel", sx1 - sx0, 0.14, 0.2, (sx0 + sx1) / 2, y + 2.6, -40.3);
    var train = new THREE.Group(), body = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.9, 0.4), new THREE.Vector2(1.6, 1.6), new THREE.Vector2(1.85, 4), new THREE.Vector2(1.9, 14), new THREE.Vector2(1.85, 24), new THREE.Vector2(1.6, 26.4), new THREE.Vector2(0.9, 27.6), new THREE.Vector2(0, 28)], 32);
    body.rotateZ(-Math.PI / 2); var bm = new THREE.Mesh(body, M.roverWhite); bm.scale.set(1, 1.1, 1); train.add(bm);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(1.93, 1.93, 20, 32, 1, true, -1.2, 2.4), M.glassDark); band.rotation.z = Math.PI / 2; band.position.set(14, 0.5, 0); train.add(band);
    var strip = new THREE.Mesh(new THREE.BoxGeometry(24, 0.06, 0.05), M.ledBlue); strip.position.set(14, -0.8, 1.9); train.add(strip);
    train.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); train.position.set(sx0 + 20, y + 0.6, -33); put(train); DEEPDYN.train = train;
    var board = canvasTex(1024, 256, function (g, w, h) { g.fillStyle = "#05070b"; g.fillRect(0, 0, w, h); g.font = "600 44px monospace"; g.fillStyle = "#ffb23a"; g.fillText("ARCADIA SPACEPORT", 40, 80); g.fillStyle = "#e8e2d8"; g.font = "36px monospace"; g.fillText("Maglev · 1.45 km · 38 s", 40, 140); g.fillText("Departs on request", 40, 196); g.fillStyle = "#39d0ff"; g.fillText("● READY", 760, 196); });
    var bdm = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: board })); bdm.position.set(sx0 + 30, y + 5.2, sz0 + 0.3); put(bdm);
    for (var bn = 0; bn < 4; bn++) { rbox("leather", 3, 0.12, 0.7, sx0 + 14 + bn * 14, y + 0.42, -50, 0, 0.04); rbox("basalt", 3, 0.42, 0.62, sx0 + 14 + bn * 14, y, -50, 0, 0.01); }
    for (var ll = 0; ll < 3; ll++) box("lampCool", sx1 - sx0 - 4, 0.08, 0.3, (sx0 + sx1) / 2, y + 11.7, -48 + ll * 7);
    addGeo("darkMetal", new THREE.CylinderGeometry(4.5, 4.5, 30, 40, 1, true), mat4(sx1 + 15, y + 1, -33, 0, 1, 1, 1, 0, Math.PI / 2));
    INTER.push({ kind: "maglev", x: sx0 + 22, z: -41.5, lv: 5, r: 4, label: "Ride the maglev to the spaceport" });
    lightsAt([[sx0 + 12, y + 6, -46], [sx0 + 40, y + 6, -46], [sx0 + 68, y + 6, -46], [sx0 + 40, y + 4, -33]]);
    // ---------- storm reserves ----------
    var rx0 = -40, rx1 = 0, rz0 = -64, rz1 = -10;
    hall({ lv: 5, x0: AC.x - ATR.r1 - 12, x1: AC.x - ATR.r1 + 0.6, z0: AC.z - 4, z1: AC.z + 4, y: y, h: 5, floor: "concrete", wall: "concrete", open: { w: true, e: true }, downs: 4 });
    droom(5, "corW5", "Reserves hall", "reserves", rr(AC.x - ATR.r1 - 12.5, AC.x - ATR.r1 + 0.2, AC.z - 4, AC.z + 4), 5, { kind: "link" });
    hall({ lv: 5, x0: rx0, x1: rx1, z0: rz0, z1: rz1, y: y, h: 10, floor: "concrete", wall: "concrete", ceil: "concrete", doors: { e: [[AC.z - 4, AC.z + 4, 4.6]] }, downs: false, cove: false });
    droom(5, "reserves", "Storm reserves", "reserves", rr(rx0, rx1, rz0, rz1), 10);
    var pal = new THREE.BoxGeometry(1.2, 1.1, 1.0), pIM = new THREE.InstancedMesh(pal, M.fabSand, 300), pc = 0, po = new THREE.Object3D();
    for (var ra = 0; ra < 5; ra++) for (var lvl = 0; lvl < 4; lvl++) for (var pk = 0; pk < 15 && pc < 300; pk++) { po.position.set(rx0 + 3 + ra * 6.5, y + 0.55 + lvl * 1.8, rz0 + 4 + pk * 2.8); po.rotation.set(0, 0, 0); po.updateMatrix(); pIM.setMatrixAt(pc++, po.matrix); }
    for (var rb = 0; rb < 5; rb++) for (var lv2 = 0; lv2 < 4; lv2++) box("yellow", 0.12, 0.1, 44, rx0 + 2.4 + rb * 6.5, y + lv2 * 1.8, rz0 + 23.6);
    pIM.castShadow = true; put(pIM);
    for (var wt = 0; wt < 3; wt++) { lathe("white", [[0, 0], [2.4, 0], [2.6, 0.3], [2.6, 7], [2, 8], [0, 8.2]], -8, y, rz0 + 8 + wt * 8, 32); DBLOCKS[5].push(["c", -8, rz0 + 8 + wt * 8, 2.8]); }
    for (var lf = 0; lf < 3; lf++) box("lampCool", 2, 0.12, 50, -34 + lf * 14, y + 9.8, (rz0 + rz1) / 2);
    lightsAt([[-20, y + 6, -50], [-20, y + 6, -24], [-6, y + 4, -40]]);
    YOFF = 0; ZONE = "surface";
  }
