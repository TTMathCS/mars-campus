
  /* ============================== Arcadia Spaceport ============================== */
  var PY = 1.5; // top of the concrete
  var PADS = [[PORT.x - 170, PORT.z - 170], [PORT.x + 20, PORT.z - 215], [PORT.x + 200, PORT.z - 165]];
  var TAXIPAD = [PORT.x - 125, PORT.z + 120];
  var VEH = {};
  function meshL(geo, mat, x, y, z, parent, uvScale) { if (!uvScale && typeof mat === "string" && TEXMAP[mat]) uvScale = TEXMAP[mat][1]; if (uvScale) geo = worldUV(geo.clone(), uvScale); var m = new THREE.Mesh(geo, M[mat] || mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
  // a Starship-class steel rocket, 52 m, built along +y from the engine skirt
  function rocketModel() {
    var g = new THREE.Group();
    meshL(new THREE.CylinderGeometry(4.5, 4.5, 41, 48, 1, true), "stainless", 0, 22.5, 0, g, 7);
    var tiles = new THREE.CylinderGeometry(4.53, 4.53, 40, 48, 1, true, -Math.PI / 2, Math.PI); meshL(tiles, "heatTile", 0, 22.5, 0, g, 1.4);
    var og = []; for (var i = 0; i <= 12; i++) { var t = i / 12; og.push(new THREE.Vector2(4.5 * Math.cos(t * Math.PI / 2 * 0.98), t * 9.5)); }
    meshL(new THREE.LatheGeometry(og, 48), "stainless", 0, 43, 0, g, 7);
    meshL(new THREE.LatheGeometry(og.map(function (p) { return new THREE.Vector2(p.x + 0.03, p.y); }), 48, -Math.PI / 2, Math.PI), "heatTile", 0, 43, 0, g, 1.4);
    meshL(new THREE.CylinderGeometry(4.5, 4.7, 2, 48), "darkMetal", 0, 1, 0, g);
    [[1, 6, 5.4, 8], [-1, 6, 5.4, 8], [1, 42, 3.4, 5], [-1, 42, 3.4, 5]].forEach(function (f) { var fl = meshL(rboxGeo(f[2], f[3], 0.35, 0.12, 1), "heatTile", f[0] * (4.5 + f[2] / 2 - 0.3), f[1], 1.2, g, 1.4); fl.rotation.z = f[0] * 0.08; });
    for (var e = 0; e < 6; e++) { var a = e / 6 * Math.PI * 2, rr2 = e < 3 ? 1.4 : 3.1, ea = e < 3 ? a : a + 0.5; meshL(new THREE.LatheGeometry([new THREE.Vector2(0.5, 0), new THREE.Vector2(0.62, -0.8), new THREE.Vector2(1.0, -2.2), new THREE.Vector2(1.25, -2.8)], 24), "darkMetal", Math.cos(ea) * rr2, 0.3, Math.sin(ea) * rr2, g); }
    for (var l = 0; l < 6; l++) { var la = l / 6 * Math.PI * 2 + 0.3, lg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.2, 10), M.darkMetal); lg.position.set(Math.cos(la) * 4.9, 1.2, Math.sin(la) * 4.9); lg.rotation.set(-Math.sin(la) * 0.35, 0, Math.cos(la) * 0.35); lg.castShadow = true; g.add(lg); }
    var plume = new THREE.Mesh(new THREE.ConeGeometry(3.4, 30, 32, 1, true), new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uK: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uT, uK; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ float y = vUv.y; float core = pow(y, 1.6) * (0.35 + 0.65 * smoothstep(0.0, 0.25, y)); float f = 0.75 + 0.25 * h(vec2(floor(vUv.x * 40.0), floor(uT * 30.0 + y * 12.0))); vec3 c = mix(vec3(1.0, 0.45, 0.15), vec3(0.55, 0.7, 1.0), smoothstep(0.75, 1.0, y)); gl_FragColor = vec4(c * core * f * 9.0 * uK, core * uK); }"
    }));
    plume.position.y = -16.5; g.add(plume); // tip at the nozzles, widening towards the ground
    var glowL = new THREE.PointLight(0xff9a4a, 0, 260, 2); glowL.position.y = -6; g.add(glowL);
    g.userData = { plume: plume, light: glowL };
    return g;
  }
  // the air taxi: an autonomous eVTOL with four ducted fans; nose along +z, door on the right (-x)
  function taxiModel() {
    var g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    var prof = [[0, 0], [0.55, 0.25], [1.0, 0.9], [1.24, 2], [1.3, 3.6], [1.2, 5.6], [0.9, 7], [0.42, 8.0], [0, 8.3]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var fg = new THREE.LatheGeometry(prof, 40); fg.rotateX(Math.PI / 2); fg.translate(0, 0, -4.2); fg.scale(1.15, 0.85, 1);
    meshL(fg, "roverWhite", 0, 1.35, 0, body, 2.4);
    var canopy = new THREE.SphereGeometry(1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2); canopy.scale(1.2, 0.95, 2.7);
    var cm = new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }); cm.color.convertSRGBToLinear();
    var cmesh = new THREE.Mesh(canopy, cm); cmesh.position.set(0, 1.55, 0.9); body.add(cmesh);
    meshL(rboxGeo(2.1, 0.35, 5.2, 0.12, 1), "darkMetal", 0, 0.62, -0.2, body);
    [1.6, -2.8].forEach(function (az) { meshL(rboxGeo(7.2, 0.22, 0.6, 0.1, 1), "roverWhite", 0, 1.05, az, body, 2.4); }); // rotor arms, kept below the passengers' eye line
    var rotors = [];
    [[3.5, 1.6], [-3.5, 1.6], [3.5, -2.8], [-3.5, -2.8]].forEach(function (p) {
      var duct = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.2, 14, 48), M.roverWhite); duct.rotation.x = Math.PI / 2; duct.position.set(p[0], 1.05, p[1]); duct.castShadow = true; body.add(duct);
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.42, 48, 1, true), M.darkMetal); ring.position.set(p[0], 1.05, p[1]); body.add(ring);
      var rot = new THREE.Group(); rot.position.set(p[0], 1.05, p[1]); body.add(rot);
      for (var b = 0; b < 5; b++) { var bl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 1.15), M.black); bl.position.z = 0.6; bl.rotation.z = 0.25; var hb = new THREE.Group(); hb.rotation.y = b / 5 * Math.PI * 2; hb.add(bl); rot.add(hb); }
      var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16), M.steel); rot.add(hub); rotors.push(rot);
    });
    [[0.75, 1], [-0.75, 1]].forEach(function (s) { var sk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 10), M.darkMetal); sk.rotation.x = Math.PI / 2; sk.position.set(s[0], 0.06, 0); body.add(sk); [1.6, -1.6].forEach(function (z) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), M.darkMetal); st.position.set(s[0], 0.45, z); body.add(st); }); });
    // interior: four leather seats facing forward and a glowing dash
    [[0.48, 0.9], [-0.48, 0.9], [0.48, -0.9], [-0.48, -0.9]].forEach(function (s) { meshL(rboxGeo(0.62, 0.5, 0.6, 0.08, 2), "leather", s[0], 1.0, s[1], body); var bk = meshL(rboxGeo(0.62, 0.72, 0.14, 0.06, 2), "leather", s[0], 1.55, s[1] - 0.3, body); bk.rotation.x = -0.15; });
    meshL(rboxGeo(1.9, 0.12, 0.6, 0.05, 2), "leatherBlack", 0, 1.4, 2.4, body);
    // flight display: altitude, speed and the way home, redrawn during the flight
    var hc = document.createElement("canvas"); hc.width = 1024; hc.height = 200; var htex = new THREE.CanvasTexture(hc); htex.encoding = THREE.sRGBEncoding;
    var hud = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.266), new THREE.MeshBasicMaterial({ map: htex, color: new THREE.Color(1.4, 1.4, 1.4) })); hud.position.set(0, 1.64, 2.3); hud.rotation.set(0.45, Math.PI, 0); body.add(hud);
    var hb = meshL(rboxGeo(1.42, 0.31, 0.04, 0.015, 1), "black", 0, 1.64, 2.33, body); hb.rotation.set(0.45, 0, 0);
    var nav = [[4.85, 1.05, 1.6, "ledRed"], [-4.85, 1.05, 1.6, "ledGreen"], [0, 2.3, -3.2, "ledWhite"]].map(function (n) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), M[n[3]]); m.position.set(n[0], n[1], n[2]); body.add(m); return m; });
    // gull-wing door on the right side
    var hinge = new THREE.Group(); hinge.position.set(-1.1, 2.2, 0.4); body.add(hinge);
    var door = meshL(rboxGeo(0.08, 1.2, 2.2, 0.03, 1), "roverWhite", -0.1, -0.62, 0, hinge, 2.4);
    var cabinL = new THREE.PointLight(0xffd9a8, 0.6, 5, 2); cabinL.position.set(0, 2, 0.3); body.add(cabinL);
    g.traverse(function (m) { if (m.isMesh && m.material !== cm) m.castShadow = true; });
    g.userData = { rotors: rotors, hinge: hinge, nav: nav, body: body, hud: { c: hc, g: hc.getContext("2d"), tex: htex, t: 0 } };
    return g;
  }
  function buildPort() {
    ZONE = "port"; var X = PORT.x, Z = PORT.z;
    // roads and aprons
    box("road", 12, 0.3, 300, X - 60, PY - 0.3, Z - 60); box("road", 380, 0.3, 12, X + 20, PY - 0.3, Z - 110); box("road", 300, 0.3, 12, X, PY - 0.3, Z + 40);
    box("pad", 220, 0.3, 70, X, PY - 0.3, Z + 90);
    // three landing pads, each with a blast wall towards the terminal
    PADS.forEach(function (p, i) {
      cyl("pad", 44, 0.6, p[0], PY - 0.6, p[1], 72);
      addGeo("marking", new THREE.TorusGeometry(30, 0.6, 4, 96), mat4(p[0], PY + 0.02, p[1], 0, 1, 1, 0.05, Math.PI / 2)); addGeo("marking", new THREE.TorusGeometry(9, 0.5, 4, 64), mat4(p[0], PY + 0.02, p[1], 0, 1, 1, 0.05, Math.PI / 2));
      for (var k = 0; k < 36; k++) { var a = k / 36 * Math.PI * 2; sph("ledRed", 0.3, p[0] + Math.cos(a) * 43, PY + 0.2, p[1] + Math.sin(a) * 43, 8); }
      for (var b = 0; b < 9; b++) { var ba = Math.PI * (0.25 + b * 0.0625); addGeo("concrete", rboxGeo(16, 10, 3, 0.4, 1), mat4(p[0] + Math.cos(ba) * 62, PY + 5, p[1] + Math.sin(ba) * 62, Math.PI / 2 - ba, 1, 1, 1)); }
      [[-1, -1], [1, -1]].forEach(function (s) { var mx = p[0] + s[0] * 50, mz = p[1] + s[1] * 40; cyl("steel", 0.4, 30, mx, PY, mz, 10); rbox("darkMetal", 3, 1.2, 1.2, mx, PY + 30, mz, 0, 0.1); box("lampCool", 2.6, 0.9, 0.05, mx, PY + 30.15, mz + 0.62); });
    });
    // standing rocket on pad 2, rocket in its service tower on pad 3
    var r2 = rocketModel(); r2.position.set(PADS[1][0], PY, PADS[1][1]); r2.rotation.y = 0.4; put(r2);
    var r3 = rocketModel(); r3.position.set(PADS[2][0], PY, PADS[2][1]); r3.rotation.y = -0.3; put(r3);
    var tw = new F(PADS[2][0] + 14, PADS[2][1], 0);
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(function (q) { tw.box("darkMetal", 0.6, 70, 0.6, q[0], PY, q[1]); });
    for (var tl = 0; tl < 14; tl++) { var ty = PY + 3 + tl * 5; tw.box("darkMetal", 6.6, 0.4, 0.4, 0, ty, -3).box("darkMetal", 6.6, 0.4, 0.4, 0, ty, 3).box("darkMetal", 0.4, 0.4, 6.6, -3, ty, 0).box("darkMetal", 0.4, 0.4, 6.6, 3, ty, 0); seg("darkMetal", tw.x - 3, ty, tw.z - 3, tw.x - 3, ty + 5, tw.z + 3, 0.12, 0.12, 6); seg("darkMetal", tw.x + 3, ty, tw.z + 3, tw.x + 3, ty + 5, tw.z - 3, 0.12, 0.12, 6); }
    tw.box("darkMetal", 20, 2, 2, -10, PY + 60, 0).box("yellow", 12, 1.2, 1.2, -6, PY + 48, 0); sph("ledRed", 0.5, tw.x, PY + 71, tw.z, 10);
    // the landing rocket (animated in the journey)
    var r1 = rocketModel(); r1.position.set(PADS[0][0], PY, PADS[0][1]); r1.rotation.y = 1.1; put(r1); VEH.rocket = r1;
    // terminal: a long vault of sintered regolith with a glass north face
    var tx0 = X - 90, tx1 = X + 90, tz0 = Z + 20, tz1 = Z + 66, TH = 12;
    floorRect("terrazzo", tx0, tx1, tz0, tz1, PY);
    var tv = vaultGeo(tz1 - tz0, TH, 7, tx1 - tx0, 36); addGeo("shell", tv, mat4(tx0, PY, (tz0 + tz1) / 2, Math.PI / 2, 1, 1, 1));
    var tvi = vaultGeo(tz1 - tz0 - 0.6, TH - 0.3, 6.6, tx1 - tx0, 36); addGeo("plaster", tvi, mat4(tx0, PY, (tz0 + tz1) / 2, Math.PI / 2, 1, 1, 1));
    for (var sk = tx0 + 8; sk < tx1 - 4; sk += 16) box("glass", 4, 0.1, 30, sk, PY + TH + 6.9, (tz0 + tz1) / 2);
    for (var gx = tx0; gx <= tx1; gx += 4) box("steel", 0.18, TH, 0.3, gx, PY, tz0);
    box("glass", tx1 - tx0, TH, 0.06, (tx0 + tx1) / 2, PY, tz0); box("steel", tx1 - tx0, 0.4, 0.5, (tx0 + tx1) / 2, PY + TH, tz0);
    box("shell", tx1 - tx0, TH, 0.8, (tx0 + tx1) / 2, PY, tz1); box("shell", 0.8, TH, tz1 - tz0, tx0, PY, (tz0 + tz1) / 2); box("shell", 0.8, TH, tz1 - tz0, tx1, PY, (tz0 + tz1) / 2);
    for (var sr = 0; sr < 6; sr++) for (var sc = 0; sc < 5; sc++) { var sx = tx0 + 20 + sc * 32, sz = tz0 + 10 + sr * 5; rbox("leather", 7, 0.45, 0.8, sx, PY, sz, 0, 0.08); rbox("leather", 7, 0.7, 0.2, sx, PY + 0.3, sz - 0.4, 0, 0.06); }
    for (var pl = 0; pl < 10; pl++) { var ppx = tx0 + 10 + pl * 17.5; lathe("basalt", [[0, 0], [1, 0], [1.1, 0.8], [0, 0.8]], ppx, PY, tz1 - 4, 24); tree(ppx, tz1 - 4, 1.1, null, PY + 0.8); }
    var fid = canvasTex(1024, 256, function (g, w, h) { g.fillStyle = "#06080c"; g.fillRect(0, 0, w, h); g.font = "600 34px monospace"; g.fillStyle = "#d9b46b"; g.fillText("ARRIVALS", 30, 50); g.fillStyle = "#e8e2d8"; g.font = "28px monospace"; [["MSV Hesperia", "Earth · 186 sols", "LANDED"], ["Phobos shuttle", "Orbit", "ON TIME"], ["Air taxi", "Arcadia Palace", "BOARDING"]].forEach(function (r, i) { g.fillText(r[0], 30, 104 + i * 52); g.fillText(r[1], 380, 104 + i * 52); g.fillStyle = i === 2 ? "#39d0ff" : "#6dff9c"; g.fillText(r[2], 800, 104 + i * 52); g.fillStyle = "#e8e2d8"; }); });
    var fidm = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({ map: fid })); fidm.position.set(X, PY + 7, tz1 - 0.6); fidm.rotation.y = Math.PI; put(fidm);
    for (var tlt = 0; tlt < 8; tlt++) box("lampSoft", 16, 0.08, 1.2, tx0 + 12 + tlt * 22, PY + TH + 5.6, (tz0 + tz1) / 2);
    // control tower
    var cx = X + 130, cz = Z + 55; cyl("shell", 3.6, 38, cx, PY, cz, 32); cyl("darkMetal", 6.4, 1, cx, PY + 38, cz, 40);
    addGeo("glassDark", new THREE.CylinderGeometry(6.6, 6, 4, 40, 1, true), mat4(cx, PY + 41, cz, 0, 1, 1, 1)); cyl("shell", 7, 0.8, cx, PY + 43, cz, 40); cyl("steel", 0.15, 10, cx, PY + 43.8, cz, 8); sph("ledRed", 0.35, cx, PY + 54, cz, 10); sph("lampCool", 0.12, cx + 6.62, PY + 41, cz, 6);
    // propellant farm: methane and oxygen spheres
    [[X - 190, Z + 40], [X - 170, Z + 40], [X - 190, Z + 62], [X - 170, Z + 62]].forEach(function (q, i) { sph(i % 2 ? "white" : "steel", 8.5, q[0], PY + 10, q[1], 32); for (var lg = 0; lg < 6; lg++) { var la = lg / 6 * Math.PI * 2; seg("darkMetal", q[0] + Math.cos(la) * 6, PY, q[1] + Math.sin(la) * 6, q[0] + Math.cos(la) * 6.5, PY + 8, q[1] + Math.sin(la) * 6.5, 0.25, 0.25, 8); } });
    seg("steel", X - 180, PY + 2, Z + 51, X - 180, PY + 2, Z - 150, 0.5, 0.5, 12); seg("steel", X - 182, PY + 2, Z + 51, X - 182, PY + 2, Z - 150, 0.5, 0.5, 12);
    // maglev portal and the air-taxi pad
    rbox("shell", 16, 5, 10, X + 60, PY, Z + 95, 0, 0.3); box("glass", 14, 3.2, 0.06, X + 60, PY + 0.6, Z + 89.95); box("ledBlue", 14, 0.06, 0.06, X + 60, PY + 3.9, Z + 89.9);
    cyl("pad", 16, 0.5, TAXIPAD[0], PY - 0.45, TAXIPAD[1], 64); addGeo("marking", new THREE.TorusGeometry(12, 0.3, 4, 96), mat4(TAXIPAD[0], PY + 0.07, TAXIPAD[1], 0, 1, 1, 0.1, Math.PI / 2));
    for (var tp = 0; tp < 24; tp++) { var tpa = tp / 24 * Math.PI * 2; sph("ledBlue", 0.16, TAXIPAD[0] + Math.cos(tpa) * 15.4, PY + 0.1, TAXIPAD[1] + Math.sin(tpa) * 15.4, 8); }
    // a field of solar panels behind the terminal
    for (var sp = 0; sp < 5; sp++) for (var sq = 0; sq < 14; sq++) box("solar", 5, 0.08, 2.6, X - 40 + sq * 6, PY + 1.6, Z + 130 + sp * 7, 0, null, 0.66);
    LIGHT_ANCHORS.push([X, PY + 8, Z + 43], [X - 60, PY + 8, Z + 43], [X + 60, PY + 8, Z + 43]);
    // the air taxi lives outside the zones: it flies between them
    var tx = taxiModel(); tx.position.set(TAXIPAD[0], PY, TAXIPAD[1]); tx.rotation.y = -Math.PI / 2; scene.add(tx); VEH.taxi = tx;
    ZONE = "surface";
  }
