
  /* ============================== shapes, levels and walking ============================== */
  var EYE = 1.65, G_MARS = 3.71, UP = new V3(0, 1, 0);
  var GLASS = { dome: 1, loggia: 1, g1: 1, g2: 1, g3: 1 };
  function inShape(s, x, z, pad) {
    var t = s[0];
    if (t === "c") return Math.hypot(x - s[1], z - s[2]) < s[3] - pad;
    if (t === "a") { var d = Math.hypot(x - s[1], z - s[2]); return d > s[3] + pad && d < s[4] - pad; }
    if (t === "e") { var ex = (x - s[1]) / Math.max(0.1, s[3] - pad), ez = (z - s[2]) / Math.max(0.1, s[4] - pad); return ex * ex + ez * ez < 1; }
    if (t === "o") { var dx = x - s[1], dz = z - s[2], c = Math.cos(s[5]), sn = Math.sin(s[5]), al = dx * c + dz * sn, ac = -dx * sn + dz * c; return Math.abs(al) < s[3] - pad && Math.abs(ac) < s[4] - pad; }
    return x > s[1] + pad && x < s[2] - pad && z > s[3] + pad && z < s[4] - pad;
  }
  function inDoor(d, x, z) { return typeof d[0] === "string" ? inShape(d, x, z, 0) : (x > d[0] && x < d[1] && z > d[2] && z < d[3]); }
  function roomsOf(lv) { return ROOMS.filter(function (r) { return (r.lv || 0) === lv; }); }
  var RBL = [];
  function roomAt(x, z, lv) { var L = RBL[lv || 0]; for (var i = 0; i < L.length; i++) if (inShape(L[i].s, x, z, 0)) return L[i]; return null; }
  function centroid(r) { var s = r.s; return s[0] === "c" || s[0] === "a" || s[0] === "e" || s[0] === "o" ? [s[1], s[2]] : [(s[1] + s[2]) / 2, (s[3] + s[4]) / 2]; }
  function insideAt(x, z, lv) {
    lv = lv || 0; var L = RBL[lv];
    for (var i = 0; i < L.length; i++) { var s = L[i].s; if (inShape(s, x, z, s[0] === "c" ? 0.6 : 0.4)) return L[i]; }
    var D = lv ? DDOORS[lv] : DOORS; for (var j = 0; j < D.length; j++) if (inDoor(D[j], x, z)) return roomAt(x, z, lv) || { id: "door", s: ["r", 0, 0, 0, 0] };
    return null;
  }
  function blockedAt(x, z, lv) {
    var B = lv ? DBLOCKS[lv] : BLOCKS; for (var i = 0; i < B.length; i++) if (inShape(B[i], x, z, -0.3)) return true;
    if (!lv) for (var k in GATE.doors) { var d = GATE.doors[k]; if (d.open < 0.85 && inShape(d.block, x, z, -0.25)) return true; }
    return false;
  }
  function outsideOK(x, z) {
    if ((plateauSD(x, z) > -6 && portSD(x, z) > -20) || x < cliffX(z) + 10) return false;
    if (Math.hypot(x - 330, z) < 7 || Math.hypot(x - 40, z + 520) < 27) return false;
    for (var i = 0; i < FOOTPRINTS.length; i++) if (inShape(FOOTPRINTS[i], x, z, -0.6)) return false;
    return true;
  }
  function canStand(x, z, lv) { lv = lv || 0; if (blockedAt(x, z, lv)) return false; if (insideAt(x, z, lv)) return true; return !lv && outsideOK(x, z); }
  function groundY(x, z, lv) {
    lv = lv || 0;
    if (lv) { var r = insideAt(x, z, lv); return LVY[lv] + (r && r.hf ? r.hf(x, z) : 0); }
    if (insideAt(x, z, 0)) { var d = Math.hypot(x, z); return d < 7 ? -0.9 : d < 8 ? -0.45 : 0; }
    if (Math.hypot(x - 330, z) < 30 || Math.hypot(x - PADW[0], z - PADW[1]) < 14) return 0.05;
    if ((x > 147 && x < 317 && Math.abs(z) < 4.5) || (x > 147 && x < 167 && Math.abs(z) < 22)) return 0;
    if (portSD(x, z) < 0) return Math.max(terrainH(x, z), PY - 0.3);
    return terrainH(x, z);
  }
  // which level is the camera on (for zones and light)
  function levelAt(p) {
    if (p.y > -3) return 0;
    if (Math.hypot(p.x - AC.x, p.z - AC.z) < ATR.r1 + 0.5) { var best = 1, bd = 1e9; for (var k = 1; k <= 5; k++) { var d = Math.abs(p.y - LVY[k] - 2); if (d < bd) { bd = d; best = k; } } return best; }
    for (var lv = 1; lv <= 5; lv++) { var L = RBL[lv]; for (var i = 0; i < L.length; i++) { var r = L[i]; if (p.y >= LVY[lv] - 2 && p.y <= LVY[lv] + (r.h || 6) + 2 && inShape(r.s, p.x, p.z, -1)) return lv; } }
    var b2 = 1, d2 = 1e9; for (var k2 = 1; k2 <= 5; k2++) { var dd = Math.abs(p.y - LVY[k2]); if (dd < d2) { d2 = dd; b2 = k2; } } return b2;
  }

  /* ============================== zones ============================== */
  var curLv = -1, nearGate = null;
  function setZones(lv, ng) {
    if (lv === curLv && ng === nearGate) return; curLv = lv; nearGate = ng;
    var surf = lv === 0;
    ["surface", "port"].forEach(function (z) { if (ZG[z]) ZG[z].all.visible = surf; });
    sky.visible = surf; starGroup.visible = surf; TERRAIN.forEach(function (t) { t.visible = surf; }); if (VEH.taxi) VEH.taxi.visible = surf;
    if (ZG.atrium) ZG.atrium.all.visible = !surf || ng;
    for (var k = 1; k <= 5; k++) if (ZG["deep" + k]) ZG["deep" + k].all.visible = k === lv;
    shadowDirty = true; lampTimer = 0;
  }
  var TERRAIN = [];

  /* ============================== state ============================== */
  var state = { mode: "orbit", stop: 0, cut: false, t: 17.4, playing: false, stormOn: false, storm: 0, sound: false, plan: false, about: false, planLv: 0, sit: null };
  var cam = { yaw: 0, pitch: 0, target: new V3(), dist: 60 };
  var tween = null, timeDirty = true, shadowDirty = true, lastShadow = 0, elapsed = 0, lampTimer = 0;
  var walk = { x: 0, z: 0, y: 0, lv: 0, vy: 0, onGround: true, bob: 0, room: null, outside: false };
  var keys = {}, joy = { x: 0, y: 0 };
  var sunDir = new V3(0, 0.3, -1).normalize(), interiorAmt = 0, glassAmt = 0, nightAmt = 0;
  var skyOut = { hemi: new THREE.Color(), ground: new THREE.Color(), exposure: 1, horizon: [0.3, 0.2, 0.15], p: P_DAY };
  function narrow() { return window.matchMedia("(max-width: 760px)").matches; }
  function setAngles(pos, look) { var d = new V3().subVectors(look, pos); cam.yaw = Math.atan2(-d.x, -d.z); cam.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); }
  function fwdOf(yaw, pitch, out) { return out.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); }
  var _f = new V3();
  function applyCam() {
    if (state.mode === "orbit") {
      fwdOf(cam.yaw, cam.pitch, _f); camera.position.copy(cam.target).addScaledVector(_f, -cam.dist);
      var gy = groundY(camera.position.x, camera.position.z, 0) + 2; if (camera.position.y < gy) camera.position.y = gy;
    }
    camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
  }

  /* ============================== the clock and the sky ============================== */
  function outsideTemp() { return -52 + 30 * Math.cos((state.t - 14.5) / SOL_H * 2 * Math.PI) * (1 - 0.6 * state.storm); }
  function fmtTemp(c) { return (c < 0 ? "−" : "") + Math.abs(Math.round(c)) + " °C"; }
  function fmtClock(t) { var h = Math.floor(t), m = Math.floor((t - h) * 60); return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
  var STAR_SIGN = (function () { var a = dirOf(altAz(0, DEC_SUN), new V3()), b = dirOf(altAz(0.3, DEC_SUN), new V3()); return a.clone().applyAxisAngle(POLE, 0.3).distanceTo(b) < a.clone().applyAxisAngle(POLE, -0.3).distanceTo(b) ? 1 : -1; })();
  var DIRS = [new V3(0, 1, 0), new V3(0.8, 0.6, 0), new V3(-0.8, 0.6, 0), new V3(0, 0.6, 0.8), new V3(0, 0.6, -0.8)];
  var HOR = [new V3(1, 0.04, 0).normalize(), new V3(-1, 0.04, 0).normalize(), new V3(0, 0.04, 1).normalize(), new V3(0, 0.04, -1).normalize()];
  var _e2 = new V3(), outSun = { color: new THREE.Color(), intensity: 0 };
  function applyTime() {
    var t = state.t, H = hourAngle(t), st = state.storm;
    dirOf(altAz(H, DEC_SUN), sunDir);
    var p = mixP(P_DAY, P_SET, smoothstep(0.30, 0.02, sunDir.y)); if (st > 0.001) p = mixP(p, P_STORM, st);
    SU.uSun.value.copy(sunDir); SU.uWide.value.fromArray(p.wide); SU.uFwd.value.fromArray(p.fwd); SU.uSunTau.value.fromArray(p.sunTau);
    SU.uGW.value = p.gW; SU.uGF.value = p.gF; SU.uKW.value = p.kW; SU.uKF.value = p.kF; SU.uKI.value = p.kI; SU.uTau.value = p.tau; SU.uSunE.value = p.sunE;
    nightAmt = smoothstep(0.03, -0.16, sunDir.y);
    SU.uNight.value = nightAmt * (1 - st); SU.uDisk.value = 1 - 0.85 * st;
    dirOf(altAz(H - 36.7 * D2R, 16 * D2R), SU.uEarth.value);
    starGroup.userData.mat.opacity = nightAmt * (1 - st) * 0.95; starGroup.quaternion.setFromAxisAngle(POLE, STAR_SIGN * H);
    var ph = altAz(2.4 - 2 * Math.PI * t / 11.1, -2 * D2R); dirOf(ph, _e2); phobos.position.copy(_e2).multiplyScalar(12000); phobos.lookAt(0, 0, 0); phobos.visible = ph.alt > -0.02 && curLv === 0;
    phobos.material.emissive.setRGB(0.09, 0.075, 0.06).multiplyScalar(nightAmt);
    var am = 1 / (Math.max(sunDir.y, 0) * 0.98 + 0.04), tr = [0, 1, 2].map(function (i) { return Math.exp(-p.sunTau[i] * Math.min(am, 12)); });
    var mx = Math.max(tr[0], tr[1], tr[2], 1e-4), lum = (tr[0] + tr[1] + tr[2]) / 3;
    outSun.color.setRGB(tr[0] / mx, tr[1] / mx, tr[2] / mx); outSun.intensity = 3.0 * smoothstep(-0.02, 0.07, sunDir.y) * Math.sqrt(lum / 0.65) * (1 - 0.7 * st);
    var s = [0, 0, 0]; DIRS.forEach(function (d) { var r = skyRadJS(d, sunDir, p); s[0] += r[0] / 5; s[1] += r[1] / 5; s[2] += r[2] / 5; });
    skyOut.hemi.setRGB(s[0] + 0.012 * nightAmt, s[1] + 0.015 * nightAmt, s[2] + 0.026 * nightAmt);
    var f = [0, 0, 0]; HOR.forEach(function (d) { var r = skyRadJS(d, sunDir, p); f[0] += r[0] / 4; f[1] += r[1] / 4; f[2] += r[2] / 4; });
    skyOut.horizon = f; skyOut.p = p;
    SU.uGround.value.set(f[0] * 0.5 + 0.004, f[1] * 0.4 + 0.004, f[2] * 0.36 + 0.006);
    skyOut.exposure = lerp(0.72, 1.35, smoothstep(0.4, -0.02, sunDir.y)) + 0.7 * nightAmt;
    M.lens.emissiveIntensity = 2.4 * Math.max(nightAmt, st * 0.8);
    $("mClock").textContent = fmtClock(t);
    var altD = Math.asin(clamp(sunDir.y, -1, 1)) / D2R; $("mSun").textContent = (altD >= 0 ? "+" : "−") + Math.abs(altD).toFixed(0) + "°";
    $("mTemp").textContent = fmtTemp(outsideTemp());
    shadowDirty = true;
  }
  function setTime(t) { state.t = ((t % SOL_H) + SOL_H) % SOL_H; $("timeRange").value = state.t.toFixed(2); timeDirty = true; }
  function setPlaying(v) { state.playing = v; $("playBtn").setAttribute("aria-label", v ? "Pause the sol" : "Play the sol"); $("playIcon").innerHTML = v ? '<path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/>' : '<path d="M4 2.5v11l9-5.5z"/>'; }

  /* ============================== light for wherever you are ============================== */
  var _order = LIGHT_ANCHORS.map(function (a, i) { return i; }), _warm = new THREE.Color(), _warm2 = new THREE.Color(), _hz = new V3();
  var artSun = new V3();
  function updateLight(dt) {
    var p = camera.position, lv = state.mode === "walk" ? walk.lv : levelAt(p), g0 = Math.hypot(p.x - GH.x, p.z - GH.z) < 45 && p.y < 40 && p.y > -3;
    setZones(lv, g0);
    var r = roomAt(p.x, p.z, lv), outdoorSun = lv === 0, cavern = null;
    if (lv === 2 && r && r.id === "grotto") cavern = "grotto"; else if (lv === 3 && r && r.id === "forest") cavern = "forest";
    var buried = lv > 0 ? !cavern : (r && !state.cut && ((r.id === "tower" && p.y < 20) || (!GLASS[r.id] && r.id !== "tower" && p.y < 12)));
    var glassIn = lv === 0 && r && !state.cut && (GLASS[r.id] || (r.id === "tower" && p.y > 20)) && p.y < 28;
    interiorAmt += ((buried ? 1 : 0) - interiorAmt) * Math.min(1, dt * 3); glassAmt += ((glassIn ? 1 : 0) - glassAmt) * Math.min(1, dt * 3);
    var target = sun.target.position, fog = scene.fog, exp;
    if (outdoorSun) {
      sun.color.copy(outSun.color); sun.intensity = outSun.intensity; sun.position.copy(target).addScaledVector(sunDir.y > -0.05 ? sunDir : UP, 420);
      hemi.color.copy(skyOut.hemi).lerp(_warm.setRGB(0.3, 0.25, 0.2), interiorAmt); hemi.groundColor.setRGB(0.06, 0.035, 0.02); hemi.intensity = 0.25;
      fwdOf(cam.yaw, 0.04, _hz); var hr = skyRadJS(_hz, sunDir, skyOut.p), hf = skyOut.horizon;
      fog.color.setRGB((hr[0] + hf[0]) / 2 + 0.006, (hr[1] + hf[1]) / 2 + 0.007, (hr[2] + hf[2]) / 2 + 0.012); fog.density = 0.00022 + 0.0065 * state.storm;
      exp = lerp(skyOut.exposure * lerp(1, 0.8, glassAmt), 1.0, interiorAmt); // glass rooms: less glare off polished floors
      setEnv(interiorAmt > 0.5 ? "interior" : "sky", interiorAmt > 0.5 ? 0.55 : lerp(1.0, 0.55, glassAmt));
    } else if (cavern === "grotto") {
      // an artificial tropical sun on the LED sky, moving with the Mars clock but on an Earth day
      var ha = (state.t / SOL_H) * Math.PI * 2 - Math.PI, el = Math.max(0.25, 0.9 * Math.cos(ha) + 0.15);
      artSun.set(Math.sin(ha) * 0.8, el, -0.35).normalize(); sun.color.setRGB(1, 0.94, 0.84); sun.intensity = 3.4; sun.position.copy(target).addScaledVector(artSun, 300);
      SKYCEIL.forEach(function (m) { m.uniforms.uSunD.value.copy(artSun); });
      hemi.color.setRGB(0.35, 0.45, 0.6); hemi.groundColor.setRGB(0.3, 0.26, 0.2); hemi.intensity = 0.4;
      fog.color.setRGB(0.36, 0.44, 0.52); fog.density = 0.0035; exp = 0.82; setEnv("grotto", 0.9);
    } else if (cavern === "forest") {
      artSun.set(0.55, 0.42, 0.3).normalize(); sun.color.setRGB(1, 0.88, 0.7); sun.intensity = 2.6; sun.position.copy(target).addScaledVector(artSun, 300);
      hemi.color.setRGB(0.3, 0.34, 0.3); hemi.groundColor.setRGB(0.1, 0.12, 0.08); hemi.intensity = 0.35;
      fog.color.setRGB(0.3, 0.34, 0.3); fog.density = 0.011; exp = 1.0; setEnv("forest", 0.8);
    } else {
      sun.intensity = 0; hemi.color.setRGB(0.3, 0.26, 0.22); hemi.groundColor.setRGB(0.12, 0.1, 0.08); hemi.intensity = 0.2;
      fog.color.setRGB(0.1, 0.09, 0.08); fog.density = 0.002; exp = 1.0; setEnv(lv >= 4 || (r && (r.id === "farms" || r.id === "reserves")) ? "works" : "interior", 0.5);
    }
    POST.u.uExp.value = exp;
    lampTimer -= dt;
    if (lampTimer <= 0) {
      lampTimer = 0.2;
      var fp = state.mode === "orbit" && !tween ? cam.target : p, far = state.mode === "orbit" ? 160 : 70, fx = fp.x, fy = fp.y, fz = fp.z;
      _order.sort(function (a, b) { var A = LIGHT_ANCHORS[a], B = LIGHT_ANCHORS[b]; return (A[0] - fx) * (A[0] - fx) + (A[1] - fy) * (A[1] - fy) * 4 + (A[2] - fz) * (A[2] - fz) - ((B[0] - fx) * (B[0] - fx) + (B[1] - fy) * (B[1] - fy) * 4 + (B[2] - fz) * (B[2] - fz)); });
      var k = lv > 0 ? (cavern ? 1.2 : 1.9) : interiorAmt > 0.5 ? 1.8 : lerp(0.3, 1.25, Math.max(nightAmt, state.storm * 0.7));
      for (var i = 0; i < pool.length; i++) {
        var a = LIGHT_ANCHORS[_order[i]], d = Math.hypot(a[0] - fx, a[2] - fz), dy = Math.abs(a[1] - fy);
        pool[i].position.set(a[0], a[1], a[2]); pool[i].intensity = d < far && dy < 16 ? k : 0; pool[i].distance = lv > 0 ? 26 : 22;
      }
    }
  }
