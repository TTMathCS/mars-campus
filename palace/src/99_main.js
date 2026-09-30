  /* ==========================================================================================
     Main loop (temporary test harness while the flight is being built).
     ========================================================================================== */
  var clock = new THREE.Clock(), T = 0;
  function frame() {
    var dt = Math.min(clock.getDelta(), 0.1); T += dt;
    U.uTime.value = T;
    U.uCam.value.copy(camera.position);
    TERRAIN.update(camera.position);
    SKYMESH.position.copy(camera.position);
    POST.render(T, false);
  }
  function loop() { frame(); requestAnimationFrame(loop); }
  resize(); setSun(8, 262);
  camera.position.set(12000, 400, -600); camera.lookAt(13800, -100, -2300);
  document.getElementById("load").hidden = true;
  if (DEBUG) {
    window.__crown = {
      view: function (x, y, z, tx, ty, tz) { camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld(); },
      sun: function (el, az) { setSun(el, az); },
      frame: frame, H: TER.h,
      exp: function (e) { POST.u.uExp.value = e; },
      dbg: function (v) { TERRAIN.dbg.value = v; },
      noDiscard: function () { TERRAIN.levels.forEach(function (m) { m.material.uniforms.uInner.value.z = 0; }); },
      render: function () { POST.render(T, false); }
    };
    window.__crownReady = true;
  } else loop();
