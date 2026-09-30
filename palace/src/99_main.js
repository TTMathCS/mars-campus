  /* ==========================================================================================
     Main loop: moves the pod, the sun and the storm along the flight, places the camera for
     the chosen view, updates the Crown (door, lights, the Orb's reflections) and draws.
     ========================================================================================== */
  LIGHTS.build();
  U.uShadowOn.value = 1;
  var MAIN = (function () {
    var t = 0, seekFlag = true, lastEl = -99, W = FLIGHT.WT;
    var EXP = [[0, 1.0], [40, 1.0], [100, 1.06], [150, 1.12], [184, 1.18], [216, 1.22], [236, 1.28], [266, 1.34], [W[49], 1.25], [W[51], 1.0], [400, 1.0]];
    var _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), BACK = new THREE.Vector3(0.1, 0.1, 0.55), TINT_IN = new THREE.Vector3(0.93, 0.95, 0.985), ONE = new THREE.Vector3(1, 1, 1);
    var HINV = new THREE.Matrix4().copy(CROWN.hangar.M).invert();
    var flash = 0, stormCam = 0;
    function seek(tt) { t = tt; seekFlag = true; }
    function inHangar(p) { var l = p.clone().applyMatrix4(HINV); return l.x > -1 && l.x < CROWN.hangar.depth + 1 && Math.abs(l.z) < CROWN.hangar.width / 2 + 1 && p.y > 40 && p.y < 50; }
    function apply(tt) {
      var P = FLIGHT.podAt(tt);
      POD.g.position.copy(P.p); POD.g.quaternion.copy(P.q); POD.g.updateMatrixWorld();
      var lift = tt < 16 ? smooth(0, 0.5, tt) * (1 - smooth(10, 16, tt)) : smooth(W[48], W[49] + 0.5, tt) * (1 - smooth(W[51] - 0.4, W[51] + 1.2, tt)) * 0.55;
      var main = smooth(7, 13, tt) * (1 - smooth(W[47], W[49], tt));
      POD.flames.uLift.value = lift; POD.flames.uMain.value = main * (0.55 + 0.45 * clamp(P.speed / 180, 0, 1));
      POD.flames.lift.forEach(function (f) { f.scale.y = 0.6 + 4.5 * lift; f.visible = lift > 0.01; });
      POD.flames.main.forEach(function (f) { f.scale.y = 1.5 + 5 * main; f.visible = main > 0.01; });
      P.lift = lift;
      var inside = smooth(W[49] - 0.8, W[50], tt); POD.skin.uniforms.uEmis.value.setScalar(0.2 * inside);
      return P;
    }
    function placeCamera(tt, P) {
      var r = {};
      if (UI.st.look) {
        var L = UI.LOOK;
        camera.position.set(L.target.x + Math.sin(L.az) * Math.cos(L.el) * L.dist, L.target.y + Math.sin(L.el) * L.dist, L.target.z - Math.cos(L.az) * Math.cos(L.el) * L.dist);
        camera.position.y = Math.max(camera.position.y, TER.h(camera.position.x, camera.position.z) + 2);
        camera.lookAt(L.target); camera.fov = 45;
      } else {
        r = DIRECTOR.rigAt(tt, UI.st.mode)(tt, P);
        if (r.cockpit || r.attached) {
          var loc = r.cockpit ? POD.EYE.clone().add(r.back ? BACK : _v.set(0, 0, 0)) : r.attached.clone();
          camera.position.copy(loc).applyQuaternion(P.q).add(P.p);
          if (r.steady) camera.quaternion.setFromEuler(_e.set(P.pitch * (1 - r.steady * 0.5), P.head, P.bank * (1 - r.steady), "YXZ")); else camera.quaternion.copy(P.q);
          if (r.back) camera.quaternion.multiply(_q.setFromEuler(_e.set(-0.06, 0, 0)));
        } else if (r.sun) {
          camera.position.copy(POD.EYE).applyQuaternion(P.q).add(P.p); camera.lookAt(_v.copy(camera.position).add(U.uSunDir.value));
        } else {
          camera.position.copy(r.p);
          var gy = TER.h(r.p.x, r.p.z) + 1.2;
          if (camera.position.y < gy) camera.position.y = gy;
          camera.lookAt(r.look);
        }
        camera.fov = r.fov || 55;
        if (!UI.st.playing && UI.st.started && (UI.st.yaw || UI.st.pitch)) camera.quaternion.multiply(_q.setFromEuler(_e.set(UI.st.pitch, UI.st.yaw, 0, "YXZ")));
      }
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      return r;
    }
    function step(dtReal) {
      var dt = Math.min(dtReal, 0.1);
      U.uTime.value += dt;
      if (UI.st.playing && !UI.st.look) t = Math.min(t + dt, DIRECTOR.END);
      var tt = UI.st.look ? DIRECTOR.END : t;
      var P = apply(tt);
      // sun and storm (the storm dims the sun, so it goes first)
      var el = FLIGHT.sunEl(tt);
      U.uStorm.value = FX.stormAt(P.p); setSun(el, 262);
      var r = placeCamera(tt, P);
      stormCam = FX.stormAt(camera.position); U.uStorm.value = stormCam; setSun(el, 262);
      var ph = FLIGHT.phobos(tt); U.uPhobos.value.set(ph[0], ph[1]);
      if (Math.abs(el - lastEl) > 0.05) { lastEl = el; CROWN.aimMirrors(); }
      // the Crown: its door, the Door, window light, the Orb's seams, the beam down the Sun Well
      var open = smooth(W[46] - 2.5, W[47] + 0.5, tt) * (1 - smooth(W[51] + 0.3, W[51] + 3.3, tt));
      CROWN.setDoor(open); CROWN.doorU.uOpen.value = smooth(W[51] + 4, W[51] + 7.5, tt);
      MAT.winCol.value.set(0.9, 0.56, 0.3).multiplyScalar(0.45 + 1.35 * smooth(4.5, 1.2, el));
      CROWN.orbU.uGlowOn.value = smooth(4.5, 1.6, el);
      CROWN.beamU.uBeam.value = 1 - stormCam;
      // effects
      FX.update(tt, camera.position, P.v, stormCam, tt > 58 && tt < 106 ? 0.1 : 0);
      var sp = FX.stormAt(P.p); FX.updateArcs(U.uTime.value, smooth(0.35, 0.85, sp) * (0.5 + 0.5 * Math.sin(U.uTime.value * 23.0) * Math.sin(U.uTime.value * 5.3)));
      var fk = Math.floor(U.uTime.value * 3); if (stormCam > 0.5 && TER.hash12(fk, 1.7) > 0.93) flash = 0.22 * TER.hash12(fk, 5.1); flash *= Math.pow(0.02, dt);
      POST.u.uFlash.value = flash * stormCam;
      POST.u.uExp.value = FLIGHT.key(EXP, tt) * (1 + 0.45 * stormCam) * (inHangar(camera.position) ? 0.75 : 1);
      POST.u.uTint.value.copy(r.cockpit ? TINT_IN : ONE);
      // shadows: round the spaceport at first, then round the pod, then round the Crown
      if (UI.st.look || tt > W[33]) SHADOW.set(0, 55, 0, 190);
      else if (tt < 36) SHADOW.set(29760, 20, -150, 560);
      else SHADOW.set(P.p.x, P.p.y, P.p.z, 26);
      // draw
      U.uCam.value.copy(camera.position);
      TERRAIN.update(camera.position);
      SKYMESH.position.copy(camera.position);
      SHADOW.render();
      if (UI.st.look || camera.position.length() < 6000) CROWN.updateOrb(seekFlag);
      var ck = !!r.cockpit;
      if (ck) { cockpitCam.position.copy(camera.position); cockpitCam.quaternion.copy(camera.quaternion); cockpitCam.fov = camera.fov; cockpitCam.updateProjectionMatrix(); cockpitCam.updateMatrixWorld(); POD.cockpit.position.copy(P.p); POD.cockpit.quaternion.copy(P.q); POD.cockpit.updateMatrixWorld(); }
      U.uCam.value.copy(camera.position);
      POST.render(U.uTime.value, ck);
      UI.update(tt, P, stormCam, r);
      AUDIO.update(tt, P, stormCam, ck || inHangar(camera.position), P.lift);
      seekFlag = false;
    }
    return { step: step, seek: seek, t: function () { return t; } };
  })();

  // resolution follows the frame rate
  var PERF = { acc: 0, n: 0, last: 0 };
  function adapt(ms) {
    PERF.acc += ms; PERF.n++;
    if (PERF.n < 45) return;
    var avg = PERF.acc / PERF.n, now = performance.now(); PERF.acc = PERF.n = 0;
    if (now - PERF.last < 2500) return;
    if (avg > 27 && VIEW.scale > 0.55) { VIEW.scale = Math.max(0.55, VIEW.scale - 0.12); PERF.last = now; resize(); }
    else if (avg < 17.8 && VIEW.scale < 1) { VIEW.scale = Math.min(1, VIEW.scale + 0.05); PERF.last = now; resize(); }
  }
  var _rs = resize; resize = function () { _rs(); LIGHTS.resize(Math.round(VIEW.h * renderer.getPixelRatio())); };
  window.removeEventListener("resize", _rs); window.addEventListener("resize", resize);
  resize(); setSun(10.5, 262); CROWN.aimMirrors(); CROWN.setDoor(0);
  var last = performance.now();
  function loop(now) { var ms = now - last; last = now; MAIN.step(ms / 1000); adapt(ms); requestAnimationFrame(loop); }
  // compile everything before the first frame, then show the start card
  MAIN.step(0);
  try { renderer.compile(scene, camera); renderer.compile(cockpitScene, cockpitCam); } catch (e) { }
  var hashT = /t=(\d+(\.\d+)?)/.exec(location.hash);
  UI.show();
  if (hashT) { var ht = parseFloat(hashT[1]); document.getElementById("bStart").addEventListener("click", function () { MAIN.seek(ht); }, { once: true }); }
  if (DEBUG) {
    window.__crown = {
      at: function (tt, mode) { UI.st.started = true; UI.st.playing = false; UI.st.mode = mode || "director"; ["shot", "data", "bar"].forEach(function (id) { document.getElementById(id).hidden = false; }); document.getElementById("start").hidden = true; MAIN.seek(tt); MAIN.step(0); return +tt.toFixed(2); },
      view: function (x, y, z, tx, ty, tz) { camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld(); },
      exp: function (e) { POST.u.uExp.value = e; },
      look: function (az, el, dist) { UI.lookMode(true); UI.LOOK.az = az * D2R; UI.LOOK.el = el * D2R; UI.LOOK.dist = dist; MAIN.seek(DIRECTOR.END); for (var i = 0; i < 6; i++) MAIN.step(0); return 1; },
      step: function (n, dt) { for (var i = 0; i < (n || 1); i++) MAIN.step(dt || 0); return 1; },
      ev: function (s) { return eval(s); }
    };
    window.__crownReady = true;
  } else requestAnimationFrame(loop);
