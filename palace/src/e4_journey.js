
  /* ============================== particles: dust, steam, mist, rain ============================== */
  function spriteTex() { return canvasTex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
  function makePS(n, size, color, opacity, blending) {
    var geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) pos[i * 3 + 1] = -9999;
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ size: size, map: spriteTex(), color: color, transparent: true, opacity: opacity, depthWrite: false, blending: blending || THREE.NormalBlending, sizeAttenuation: true });
    var pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    return { pts: pts, pos: pos, vel: new Float32Array(n * 3), age: new Float32Array(n).fill(99), life: new Float32Array(n).fill(1), n: n, next: 0 };
  }
  var DUST, PUFF, STEAM, RAIN;
  function buildParticles() {
    DUST = makePS(MOBILE ? 500 : 1400, 18, new THREE.Color(0xd9a27c).convertSRGBToLinear(), 0.32);
    PUFF = makePS(MOBILE ? 200 : 400, 3.2, new THREE.Color(0xd9a27c).convertSRGBToLinear(), 0.3);
    STEAM = makePS(MOBILE ? 200 : 420, 2.4, new THREE.Color(0xffffff), 0.14);
    RAIN = makePS(MOBILE ? 300 : 700, 0.09, new THREE.Color(0xcfe6ff), 0.75);
  }
  function emit(P, x, y, z, vx, vy, vz, life) { var i = P.next; P.next = (P.next + 1) % P.n; P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz; P.age[i] = 0; P.life[i] = life; }
  function dustBurst(x, y, z, n, sp, P) { P = P || DUST; for (var k = 0; k < n; k++) { var a = Math.random() * 6.28, s = sp * (0.4 + Math.random() * 0.6); emit(P, x + Math.cos(a) * 2, y + 0.4, z + Math.sin(a) * 2, Math.cos(a) * s, 0.5 + Math.random() * 2.5, Math.sin(a) * s, 3 + Math.random() * 4); } }
  function stepPS(P, dt, drag, grav) {
    for (var i = 0; i < P.n; i++) {
      if (P.age[i] > P.life[i]) { if (P.pos[i * 3 + 1] > -9000) P.pos[i * 3 + 1] = -9999; continue; }
      P.age[i] += dt; var k = 1 - drag * dt;
      P.vel[i * 3] *= k; P.vel[i * 3 + 2] *= k; P.vel[i * 3 + 1] = P.vel[i * 3 + 1] * k - grav * dt;
      P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
    }
    P.pts.geometry.attributes.position.needsUpdate = true;
  }
  function particlesStep(dt) {
    stepPS(DUST, dt, 0.9, -0.05); DUST.pts.visible = curLv === 0; stepPS(PUFF, dt, 1.2, -0.02); PUFF.pts.visible = curLv === 0;
    // steam over warm water on this level, mist at the waterfall
    var lv = curLv, em = (DEEPDYN.steam || []).filter(function (e) { return e.lv === lv; });
    for (var s = 0; s < em.length; s++) if (Math.random() < dt * 22) { var e = em[s]; emit(STEAM, e.x + (Math.random() - 0.5) * e.w, e.y + 0.1, e.z + (Math.random() - 0.5) * e.d, (Math.random() - 0.5) * 0.2, 0.25 + Math.random() * 0.3, (Math.random() - 0.5) * 0.2, 4 + Math.random() * 3); }
    var mi = DEEPDYN.mist; if (mi && mi.lv === lv) for (var m = 0; m < 3; m++) emit(STEAM, mi.x + (Math.random() - 0.5) * 6, mi.y + Math.random() * 2, mi.z + (Math.random() - 0.5) * 8, -Math.random() * 1.5, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, 3 + Math.random() * 2);
    stepPS(STEAM, dt, 0.3, -0.02); STEAM.pts.visible = lv > 0;
    var rr = DEEPDYN.rainRoom; if (rr && DEEPDYN.raining && lv === 3) for (var r = 0; r < 14; r++) emit(RAIN, rr.x + (Math.random() - 0.5) * 8, rr.y + 3.9, rr.z + (Math.random() - 0.5) * 8, 0, -1.5, 0, 1.6);
    stepPS(RAIN, dt, 0, 3.71); RAIN.pts.visible = lv === 3;
  }

  /* ============================== the journey ============================== */
  var J = null, TAXI = { st: "idle", t: 0, yaw: 0, roll: 0, rotor: 0, door: 0, pathU: 0 };
  var JPATH, JBACK, POBS;
  function buildJourney() {
    var tp = new V3(TAXIPAD[0], PY, TAXIPAD[1]);
    POBS = new V3(PORT.x - 95, PY + 24, PORT.z + 24);
    JPATH = new THREE.CatmullRomCurve3([new V3(tp.x, PY + 38, tp.z), new V3(PORT.x - 420, 95, PORT.z + 120), new V3(900, 125, -150), new V3(580, 125, -130), new V3(370, 100, -40), new V3(215, 86, 82), new V3(60, 76, 152), new V3(-88, 72, 82), new V3(-122, 76, -44), new V3(-40, 70, -150), new V3(92, 46, -168), new V3(PADW[0] + 32, 20, PADW[1] - 32), new V3(PADW[0], 9, PADW[1])], false, "centripetal", 0.5);
    JBACK = new THREE.CatmullRomCurve3([new V3(PADW[0], 32, PADW[1]), new V3(210, 95, -120), new V3(620, 120, -150), new V3(1020, 110, -120), new V3(tp.x + 70, 60, tp.z - 30), new V3(tp.x, PY + 26, tp.z)], false, "centripetal", 0.5);
  }
  var _tl = new V3(), _tp = new V3(), _tt = new V3(), _ta = new V3(), _tb = new V3();
  function taxiLocal(lx, ly, lz, out) { return VEH.taxi.localToWorld(out.set(lx, ly, lz)); }
  function taxiSync() { VEH.taxi.updateMatrixWorld(); } // read the pose set this frame, not the last one
  function poseTaxiOnPath(curve, u, dt) {
    curve.getPointAt(clamp(u, 0, 1), _tp); curve.getTangentAt(clamp(u, 0, 0.999), _tt);
    var yaw = Math.atan2(_tt.x, _tt.z), dy = Math.atan2(Math.sin(yaw - TAXI.yaw), Math.cos(yaw - TAXI.yaw));
    TAXI.roll = lerp(TAXI.roll, clamp(-dy / Math.max(dt, 0.001) * 0.35, -0.42, 0.42), Math.min(1, dt * 2)); TAXI.yaw = yaw;
    VEH.taxi.position.copy(_tp); VEH.taxi.rotation.set(clamp(0.06 - _tt.y * 0.25, -0.12, 0.2), yaw, TAXI.roll, "YXZ");
  }
  function taxiStep(dt) {
    var T = VEH.taxi, ud = T.userData;
    ud.rotors.forEach(function (r, i) { r.rotation.y += dt * TAXI.rotor * 55 * (i % 2 ? 1 : -1); });
    ud.hinge.rotation.z = -TAXI.door * 1.15;
    ud.nav[2].visible = Math.floor(elapsed * 1.4) % 2 === 0;
    if (TAXI.st === "depart") {
      TAXI.t += dt; var t = TAXI.t;
      TAXI.door = Math.max(0, 1 - t / 1.2);
      if (t < 2.5) TAXI.rotor = lerp(0.2, 1, t / 2.5);
      else if (t < 6.5) { var e = (t - 2.5) / 4; T.position.y = lerp(0.05, 32, e * e * (3 - 2 * e)); if (t < 3) dustBurst(T.position.x, 0, T.position.z, 6, 9, PUFF); }
      else if (t < 28.5) { var u = (t - 6.5) / 22; poseTaxiOnPath(JBACK, u * u * (3 - 2 * u), dt); }
      else if (t < 33) { var e2 = (t - 28.5) / 4.5; T.position.y = lerp(PY + 26, PY, e2 * e2 * (3 - 2 * e2)); T.rotation.x = 0; T.rotation.z = 0; }
      else { TAXI.st = "idle"; TAXI.rotor = 0; }
    }
  }
  function caption(a, b, btn) { $("cap1").textContent = a; $("cap2").textContent = b; $("caption").hidden = false; $("capBtn").hidden = !btn; if (btn) $("capBtn").textContent = btn; }
  function setCine(on) { document.body.classList.toggle("cine", on); if (on) { $("rooms").hidden = true; $("info").hidden = true; } else layoutPanels(); }
  function startJourney() {
    closeDialogs(); if (state.mode === "walk") endWalk(); if (state.cut) setCut(false, true); state.sit = null;
    setCine(true); state.mode = "journey"; tween = null; setModeButtons();
    setTime(15.6); if (state.stormOn) { state.stormOn = false; $("stormBtn").setAttribute("aria-pressed", "false"); } setPlaying(false);
    J = { ph: "land", t: 0, lookY: 0, lookP: 0 };
    var R = VEH.rocket; R.position.y = PY + 380; R.userData.plume.material.uniforms.uK.value = 1;
    var T = VEH.taxi; T.position.set(TAXIPAD[0], PY, TAXIPAD[1]); T.rotation.set(0, -Math.PI / 2, 0); TAXI.yaw = -Math.PI / 2; TAXI.roll = 0; TAXI.door = 1; TAXI.rotor = 0.15; TAXI.st = "journey";
    GATE.auth = false; GATE.doors.outer.target = 0; GATE.doors.inner.target = 0;
    camera.position.copy(POBS); setAngles(POBS, new V3(PADS[0][0], PY + 300, PADS[0][1]));
    caption("Sol 1 · Arcadia Spaceport", "Your ship is on its final descent");
    $("skipBtn").hidden = false; hint(TOUCH ? "Drag to look around" : "Drag to look around · <kbd>Esc</kbd> skips the journey", 5000);
  }
  function jPhase(ph) { J.ph = ph; J.t = 0; J.p0 = camera.position.clone(); J.q0 = camera.quaternion.clone(); }
  var _cq = new THREE.Quaternion(), _cm = new THREE.Matrix4();
  function lookFrom(pos, target, blendQ) { _cm.lookAt(pos, target, UP); _cq.setFromRotationMatrix(_cm); if (blendQ) camera.quaternion.slerp(_cq, blendQ); else camera.quaternion.copy(_cq); }
  function journeyStep(dt) {
    J.t += dt; var t = J.t, R = VEH.rocket, T = VEH.taxi, ud = R.userData;
    if (J.ph === "land") {
      var h = t < 12 ? 380 * Math.pow(1 - t / 12, 2.0) : 0; R.position.y = PY + h;
      var k = t < 12 ? 1 : Math.max(0, 1 - (t - 12) * 1.6); ud.plume.material.uniforms.uK.value = k; ud.plume.scale.y = 0.6 + Math.min(1, h / 120) * 0.6; ud.light.intensity = k * 7;
      if (h < 90 && t < 12.6) dustBurst(PADS[0][0], PY, PADS[0][1], Math.round(40 * dt * 60 / 6), 26 + (90 - h) * 0.3);
      camera.position.copy(POBS); lookFrom(POBS, _ta.set(R.position.x, R.position.y + 22, R.position.z), t < 0.05 ? 0 : Math.min(1, dt * 3));
      if (t > 12.3 && !J.c1) { J.c1 = true; caption("Touchdown", "Welcome to Mars"); rumble(0); }
      if (t > 15) { jPhase("toTaxi"); caption("Your air taxi is ready", "1.4 km to Arcadia Palace", "Board"); }
    } else if (J.ph === "toTaxi") {
      taxiSync(); taxiLocal(-7, 3.4, -9, _ta); var e = Math.min(1, t / 4.5), ee = e * e * (3 - 2 * e);
      camera.position.lerpVectors(J.p0, _ta, ee); camera.position.y += Math.sin(Math.PI * ee) * 12; lookFrom(camera.position, taxiLocal(0, 1.2, 1, _tb), Math.min(1, dt * 3));
      if (t > 9 || J.go) { jPhase("board"); $("capBtn").hidden = true; caption("Boarding", "Seat 2 · window"); }
    } else if (J.ph === "board") {
      taxiSync(); taxiLocal(0.48, 1.93, 0.78, _ta); var e3 = Math.min(1, t / 2.6), ee3 = e3 * e3 * (3 - 2 * e3);
      camera.position.lerpVectors(J.p0, _ta, ee3); lookFrom(camera.position, taxiLocal(0.3, 1.7, 12, _tb), Math.min(1, dt * 4));
      TAXI.door = Math.max(0, 1 - Math.max(0, t - 1.6) / 1.2); TAXI.rotor = 0.15 + Math.max(0, t - 2) * 0.3;
      if (t > 3.2) { jPhase("takeoff"); J.y0 = T.position.y; J.yaw0 = TAXI.yaw; JPATH.getTangentAt(0, _tt); J.yaw1 = Math.atan2(_tt.x, _tt.z); caption("Lift-off", "Four fans, very thin air"); }
    } else if (J.ph === "takeoff") {
      var e4 = Math.min(1, t / 5.5), ee4 = e4 * e4 * (3 - 2 * e4); TAXI.rotor = Math.min(1, 0.4 + t * 0.2);
      T.position.y = lerp(J.y0, PY + 38, ee4); var dyaw = Math.atan2(Math.sin(J.yaw1 - J.yaw0), Math.cos(J.yaw1 - J.yaw0)); TAXI.yaw = J.yaw0 + dyaw * ee4; T.rotation.set(0.02, TAXI.yaw, 0, "YXZ");
      if (t < 2.5) dustBurst(T.position.x, PY, T.position.z, 5, 8, PUFF);
      cockpitCam(dt); drawHUD(dt, 0);
      if (t > 5.5) { jPhase("cruise"); caption("Arcadia Planitia", "Over the plain, west to the mesa"); }
    } else if (J.ph === "cruise") {
      var D = 36, u = Math.min(1, t / D), uu = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; poseTaxiOnPath(JPATH, uu, dt);
      if (uu < 0.36 || uu > 0.9) cockpitCam(dt); else chaseCam(dt); drawHUD(dt, uu);
      if (uu > 0.33 && !J.c2) { J.c2 = true; caption("Arcadia Palace", "Your home, from the air"); }
      if (uu > 0.9 && !J.c3) { J.c3 = true; caption("Final approach", "The Gatehouse pad"); }
      if (t > D) { jPhase("land2"); J.y0 = T.position.y; J.yaw0 = TAXI.yaw; J.yaw1 = Math.atan2(GH.x - PADW[0], GH.z - PADW[1]); }
    } else if (J.ph === "land2") {
      var e5 = Math.min(1, t / 6), ee5 = e5 * e5 * (3 - 2 * e5); T.position.y = lerp(J.y0, 0.05, ee5);
      var dy5 = Math.atan2(Math.sin(J.yaw1 - J.yaw0), Math.cos(J.yaw1 - J.yaw0)); TAXI.yaw = J.yaw0 + dy5 * Math.min(1, e5 * 1.6); TAXI.roll *= 0.9; T.rotation.set(0.02 * (1 - e5), TAXI.yaw, TAXI.roll, "YXZ");
      if (T.position.y < 6) dustBurst(T.position.x, 0, T.position.z, 4, 8, PUFF);
      TAXI.rotor = 1 - Math.max(0, e5 - 0.8) * 3.5; cockpitCam(dt); drawHUD(dt, 1);
      if (t > 6.3) { jPhase("out"); caption("You have arrived", "The house will recognise you at the door"); }
    } else if (J.ph === "out") {
      TAXI.door = Math.min(1, t / 1.2); TAXI.rotor = 0.2;
      taxiSync(); taxiLocal(-3.6, EYE, 0.4, _ta); var e6 = clamp((t - 0.8) / 2.4, 0, 1), ee6 = e6 * e6 * (3 - 2 * e6);
      camera.position.lerpVectors(J.p0, _ta, ee6); var portal = gw(0, 19); lookFrom(camera.position, _tb.set(portal[0], 3, portal[1]), Math.min(1, dt * (1 + e6 * 3)));
      if (t > 3.4) finishJourney(false);
    }
    if (J && J.ph !== "land" && J.ph !== "toTaxi") { R.position.y = PY; ud.plume.material.uniforms.uK.value = 0; ud.light.intensity = 0; }
  }
  var _hp = new V3(), hudLast = null;
  function drawHUD(dt, u) {
    var H = VEH.taxi.userData.hud, T = VEH.taxi; H.t -= dt; if (H.t > 0) return; H.t = 0.2;
    var spd = hudLast ? T.position.distanceTo(hudLast) / Math.max(0.2 - H.t, 0.05) : 0; hudLast = (hudLast || new V3()).copy(T.position);
    var dist = Math.hypot(T.position.x - PADW[0], T.position.z - PADW[1]), g = H.g, w = 1024, h = 200;
    g.fillStyle = "#05070a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(120,200,255,0.25)"; g.lineWidth = 2; g.strokeRect(6, 6, w - 12, h - 12);
    g.font = "500 30px monospace"; g.fillStyle = "#8fd0ff"; g.textAlign = "left"; g.fillText("ALT " + Math.max(0, Math.round(T.position.y)) + " m", 36, 62);
    g.textAlign = "right"; g.fillText(Math.round(Math.min(spd, 90) * 3.6) + " km/h", w - 36, 62);
    g.textAlign = "center"; g.fillStyle = "#f2e2c2"; g.font = "600 34px Georgia, serif"; g.fillText("ARCADIA PALACE", w / 2, 60);
    g.font = "500 26px monospace"; g.fillStyle = "#c9b89c"; g.fillText((dist / 1000).toFixed(2) + " km  ·  0.38 g  ·  outside " + fmtTemp(outsideTemp()), w / 2, 104);
    g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(60, 140, w - 120, 8); g.fillStyle = "#d9b46b"; g.fillRect(60, 140, (w - 120) * clamp(u, 0, 1), 8);
    g.beginPath(); g.arc(60 + (w - 120) * clamp(u, 0, 1), 144, 11, 0, 6.28); g.fill();
    g.font = "22px monospace"; g.fillStyle = "#8a7d6d"; g.textAlign = "left"; g.fillText("SPACEPORT", 60, 184); g.textAlign = "right"; g.fillText("GATEHOUSE PAD", w - 60, 184);
    H.tex.needsUpdate = true;
  }
  function cockpitCam(dt) { taxiSync(); taxiLocal(0.48, 1.93, 0.78, _ta); camera.position.copy(_ta); lookFrom(_ta, taxiLocal(0.2 + J.lookY * 6, 1.55 + J.lookP * 6, 12, _tb), J.ph === "cruise" && J.lastCam === "chase" ? 0 : Math.min(1, dt * 8)); J.lastCam = "cockpit"; }
  function chaseCam(dt) { taxiSync(); taxiLocal(7 + J.lookY * 20, 5.5 + J.lookP * 10, -17, _ta); if (J.lastCam !== "chase") camera.position.copy(_ta); else camera.position.lerp(_ta, Math.min(1, dt * 2.5)); lookFrom(camera.position, taxiLocal(0, 1.5, 3, _tb), J.lastCam !== "chase" ? 0 : Math.min(1, dt * 5)); J.lastCam = "chase"; }
  function finishJourney(skipped) {
    var T = VEH.taxi;
    if (skipped) { T.position.set(PADW[0], 0.05, PADW[1]); TAXI.yaw = Math.atan2(GH.x - PADW[0], GH.z - PADW[1]); T.rotation.set(0, TAXI.yaw, 0, "YXZ"); TAXI.door = 1; VEH.rocket.position.y = PY; VEH.rocket.userData.plume.material.uniforms.uK.value = 0; VEH.rocket.userData.light.intensity = 0; }
    T.updateMatrixWorld(); taxiLocal(-3.6, 0, 0.4, _ta);
    var portal = gw(0, 19); cam.yaw = Math.atan2(-(portal[0] - _ta.x), -(portal[1] - _ta.z)); cam.pitch = 0.02;
    J = null; TAXI.st = "depart"; TAXI.t = 0; TAXI.pathU = 0;
    $("caption").hidden = true; $("skipBtn").hidden = true; setCine(false);
    state.stop = STOP.portal.i; renderInfo(STOP.portal); markRooms();
    beginWalk(_ta.x, _ta.z, 0);
    hint(TOUCH ? "Walk to the portal: the house knows you" : "Walk to the portal with <kbd>W</kbd>: the house knows you", 7000);
  }

  /* ============================== sound ============================== */
  var audio = null;
  function initAudio() {
    var AC2 = window.AudioContext || window.webkitAudioContext; if (!AC2) return null;
    var ctx = new AC2(), len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    var wbuf = ctx.createBuffer(1, len, ctx.sampleRate), wd = wbuf.getChannelData(0); for (var j = 0; j < len; j++) wd[j] = Math.random() * 2 - 1;
    function noise(b) { var s = ctx.createBufferSource(); s.buffer = b || buf; s.loop = true; s.start(); return s; }
    function chain(src, type, freq, q, gain) { var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; var g = ctx.createGain(); g.gain.value = gain; src.connect(f); f.connect(g); return { f: f, g: g }; }
    var master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    var wind = chain(noise(), "bandpass", 420, 0.7, 0); wind.g.connect(master);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 220; lfo.connect(lg); lg.connect(wind.f.frequency); lfo.start();
    var hum = ctx.createGain(); hum.gain.value = 0; hum.connect(master);
    [55, 110.3, 164.8].forEach(function (fq, k) { var o = ctx.createOscillator(); o.frequency.value = fq; var g = ctx.createGain(); g.gain.value = [0.1, 0.035, 0.012][k]; o.connect(g); g.connect(hum); o.start(); });
    var air = chain(noise(), "lowpass", 700, 0.5, 0.35); air.g.connect(hum);
    var water = chain(noise(wbuf), "highpass", 1700, 0.5, 0); water.g.connect(master);
    var rain = chain(noise(wbuf), "bandpass", 3200, 0.4, 0); rain.g.connect(master);
    var roar = chain(noise(), "lowpass", 160, 0.8, 0); roar.g.connect(master);
    var fan = chain(noise(wbuf), "bandpass", 900, 2, 0); fan.g.connect(master);
    var fo = ctx.createOscillator(); fo.type = "sawtooth"; fo.frequency.value = 96; var fg = ctx.createGain(); fg.gain.value = 0; var ff = ctx.createBiquadFilter(); ff.type = "lowpass"; ff.frequency.value = 500; fo.connect(ff); ff.connect(fg); fg.connect(master); fo.start();
    return { ctx: ctx, master: master, wind: wind.g, hum: hum, water: water.g, rain: rain.g, roar: roar.g, fan: fan.g, fanTone: fg, fanOsc: fo, wbuf: wbuf };
  }
  function tone(freq, dur, vol, type, when) { if (!audio || !state.sound) return; var c = audio.ctx, t0 = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.value = freq; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur); o.connect(g); g.connect(audio.master); o.start(t0); o.stop(t0 + dur + 0.05); }
  function chime() { tone(880, 1.6, 0.12); tone(1318.5, 2.2, 0.1, "sine", 0.18); }
  function hiss() { if (!audio || !state.sound) return; var c = audio.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = audio.wbuf; f.type = "bandpass"; f.frequency.setValueAtTime(600, c.currentTime); f.frequency.linearRampToValueAtTime(3000, c.currentTime + 3); g.gain.setValueAtTime(0.0, c.currentTime); g.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.4); g.gain.linearRampToValueAtTime(0, c.currentTime + 3.2); s.connect(f); f.connect(g); g.connect(audio.master); s.start(); s.stop(c.currentTime + 3.4); }
  function playPiano() {
    var n = [[392, 0], [587.3, 0.02], [739.99, 0.04], [659.25, 1.2], [587.3, 2.4], [554.37, 3.0], [587.3, 3.6], [440, 4.8], [493.88, 5.1], [392, 6.0], [587.3, 6.02], [739.99, 6.04], [880, 7.2], [783.99, 8.4]];
    n.forEach(function (q) { tone(q[0], 2.6, 0.07, "triangle", q[1] * 0.55); tone(q[0] * 2, 1.2, 0.015, "sine", q[1] * 0.55); });
  }
  function rumble() {}
  function toggleSound() { state.sound = !state.sound; if (state.sound && !audio) audio = initAudio(); if (audio) { if (state.sound) audio.ctx.resume(); else audio.ctx.suspend(); } setModeButtons(); }
  function updateSound() {
    if (!audio || !state.sound) return;
    var p = camera.position, now = audio.ctx.currentTime, outside = curLv === 0 && interiorAmt < 0.5 && glassAmt < 0.5, high = state.mode === "orbit" && p.y > 30;
    var inTaxi = J && (J.ph === "takeoff" || J.ph === "cruise" || J.ph === "land2") && J.lastCam === "cockpit";
    audio.wind.gain.setTargetAtTime(inTaxi ? 0.05 : outside ? (high ? 0.12 : 0.3) * (1 + 1.6 * state.storm) : glassAmt * 0.07 * (1 + state.storm), now, 0.4);
    audio.hum.gain.setTargetAtTime(curLv > 0 ? 0.2 : interiorAmt * 0.3 + glassAmt * 0.18 + (state.mode === "walk" && walk.outside ? 0.12 : 0), now, 0.4);
    var dw = curLv === 0 ? Math.min(Math.hypot(p.x - 11.3, p.z - 11.3), Math.hypot(p.x, p.z - 50) + 3) : curLv === 2 ? Math.min(Math.hypot(p.x - 372, p.z + 56) * 0.25, 40) : curLv === 1 ? Math.hypot(p.x + 25, p.z + 37) : 99;
    audio.water.gain.setTargetAtTime(0.18 * Math.max(0, 1 - dw / 18), now, 0.3);
    audio.rain.gain.setTargetAtTime(DEEPDYN.raining && curLv === 3 && DEEPDYN.rainRoom ? 0.2 * Math.max(0, 1 - Math.hypot(p.x - DEEPDYN.rainRoom.x, p.z - DEEPDYN.rainRoom.z) / 20) : 0, now, 0.3);
    var R = VEH.rocket, rk = R.userData.plume.material.uniforms.uK.value, rd = p.distanceTo(R.position);
    audio.roar.gain.setTargetAtTime(curLv === 0 ? rk * 0.9 * Math.min(1, 300 / Math.max(rd, 50)) : 0, now, 0.2);
    var T = VEH.taxi, td = p.distanceTo(T.position), fk = curLv === 0 ? TAXI.rotor * Math.min(1, 25 / Math.max(td, 6)) * (inTaxi ? 0.45 : 1) : 0;
    audio.fan.gain.setTargetAtTime(fk * 0.12, now, 0.2); audio.fanTone.gain.setTargetAtTime(fk * 0.05, now, 0.2); audio.fanOsc.frequency.setTargetAtTime(70 + TAXI.rotor * 60, now, 0.3);
  }
