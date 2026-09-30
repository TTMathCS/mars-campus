  /* ==========================================================================================
     Effects: dust devils on the Dune Sea, the dust storm (its rolling wall and what it is like
     inside), dust streaks round the camera, static sparks on the canopy, vapour from the ship,
     and the dust the pod kicks up when it lifts off.
     ========================================================================================== */
  var FX = (function () {
    var BILL_V = GLSL_COMMON + LOGV_PARS + [
      // a camera-facing quad; cyl = 1 keeps it upright (turns only round y)
      "attribute vec4 inst; attribute vec4 inst2; uniform float uCyl; varying vec2 vQ; varying vec3 vW; varying vec4 vI; varying vec4 vI2;",
      "void main(){",
      "  vQ = position.xy; vI = inst; vI2 = inst2;",
      "  vec3 c = inst.xyz; float s = inst.w;",
      "  vec3 toC = uCam - c;",
      "  vec3 rt, up;",
      "  if (uCyl > 0.5){ vec2 h = normalize(toC.xz + 1e-4); rt = vec3(h.y, 0.0, -h.x); up = vec3(0.0, 1.0, 0.0); }",
      "  else { vec3 f = normalize(toC); rt = normalize(cross(vec3(0.0, 1.0, 0.0), f)); up = cross(f, rt); }",
      "  vec3 w = c + rt * position.x * s * inst2.x + up * (position.y * s * inst2.y + inst2.z);",
      "  vW = w;",
      "  gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w), 1.0);",
      "  " + LOGV,
      "}"].join("\n");
    function billboards(n, fs, cyl, uni, order) {
      var g = new THREE.InstancedBufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      var a = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), b = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      a.setUsage(THREE.DynamicDrawUsage); b.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute("inst", a); g.setAttribute("inst2", b); g.instanceCount = n;
      var m = new THREE.ShaderMaterial({ uniforms: sharedUniforms(Object.assign({ uCyl: { value: cyl ? 1 : 0 } }, uni || {})), vertexShader: BILL_V, fragmentShader: fs, transparent: true, depthWrite: false });
      var mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = order || 8; scene.add(mesh);
      return { mesh: mesh, a: a, b: b, m: m };
    }

    /* ---------------- dust devils */
    var DEV = [
      [21520, -3640, 620, 14, 95], [21380, -3355, 520, 11, 80], [23600, -2650, 700, 18, 120],
      [20100, -4150, 450, 10, 70], [18900, -2880, 560, 13, 90], [24900, -3950, 380, 9, 60], [22400, -4300, 500, 12, 85]
    ];
    var devFS = GLSL_COMMON + LOGF_PARS + [
      "varying vec2 vQ; varying vec3 vW; varying vec4 vI; varying vec4 vI2;",
      "void main(){",
      "  float v = vQ.y, u = vQ.x;",   // u -1..1 across, v 0..1 up
      "  float H = vI2.y * vI.w, w0 = vI2.w, w1 = vI.w * vI2.x;",
      "  float w = mix(w0, w1 * 0.8, pow(v, 0.75)) / w1;",
      "  float twist = u / max(w, 0.02) * 1.6 + v * H / 40.0 - uTime * 2.2 + vI.x * 0.01;",
      "  float n = vnoise(vec2(twist, v * H / 90.0 - uTime * 0.7)) * 0.6 + vnoise(vec2(twist * 2.3, v * H / 35.0 - uTime * 1.3)) * 0.4;",
      "  float core = exp(-pow(u / max(w, 0.02), 2.0) * 2.2);",
      "  float d = core * (0.5 + 0.5 * n) * smoothstep(0.0, 0.03, v) * (1.0 - smoothstep(0.55, 1.0, v));",
      "  d += exp(-pow(u / (w * 2.6 + 0.1), 2.0) * 2.0) * exp(-v * H / 14.0) * 0.6;",   // the skirt of dust at the foot
      "  vec2 hs = normalize(uSunDir.xz + 1e-5); vec2 hv = normalize(uCam.xz - vI.xz + 1e-5); vec2 side = vec2(hv.y, -hv.x);",
      "  float lit = 0.35 + 0.65 * clamp(0.5 + 0.5 * dot(side, hs) * u / max(w, 0.05) + 0.3 * dot(hv, hs), 0.0, 1.0);",
      "  vec3 dust = vec3(0.58, 0.42, 0.30);",
      "  vec3 col = dust * (uSunCol * lit * 0.8 + (uAmbUp + uAmbHor) * 0.45);",
      "  col = haze(col, vW);",
      "  gl_FragColor = vec4(col, clamp(d * 0.62, 0.0, 0.9));",
      "  " + LOGF,
      "}"].join("\n");
    var devils = billboards(DEV.length, devFS, true);
    function updateDevils(t) {
      for (var i = 0; i < DEV.length; i++) {
        var d = DEV[i], dx = 4.5 * (t - 75), dz = -1.6 * (t - 75) + 30 * Math.sin(t * 0.05 + i);
        var x = d[0] + dx, z = d[1] + dz, y = TER.h(x, z) - 2;
        // inst: centre (x, y, z), scale = top half-width; inst2: (1, height / scale, 0, base half-width)
        devils.a.setXYZW(i, x, y, z, d[4]); devils.b.setXYZW(i, 1.3, d[2] / d[4], 0, d[3]);
      }
      devils.a.needsUpdate = devils.b.needsUpdate = true;
    }

    /* ---------------- the storm: an ellipse of dust 2 km high, sitting across the route */
    var ST = { c: new THREE.Vector2(5150, 2250), a: 2150, b: 3000, h: 1900, dir: new THREE.Vector2(-0.945, -0.327).normalize() };
    ST.perp = new THREE.Vector2(-ST.dir.y, ST.dir.x);
    function stormE(x, z) { var dx = x - ST.c.x, dz = z - ST.c.y, u = (dx * ST.dir.x + dz * ST.dir.y) / ST.a, v = (dx * ST.perp.x + dz * ST.perp.y) / ST.b; return Math.sqrt(u * u + v * v); }
    function stormAt(p) { var e = stormE(p.x, p.z); return (1 - smooth(0.84, 1.0, e)) * (1 - smooth(1450, 1950, p.y)); }
    var puffFS = GLSL_COMMON + LOGF_PARS + [
      "uniform float uIn; varying vec2 vQ; varying vec3 vW; varying vec4 vI; varying vec4 vI2;",
      "void main(){",
      "  vec2 q = vec2(vQ.x, vQ.y * 2.0 - 1.0); float r2 = dot(q, q); if (r2 > 1.0) discard;",
      // treat the puff as a ball: a normal from its disc, turned to face the camera
      "  vec3 f = normalize(uCam - vI.xyz); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), f)); vec3 up = cross(f, rt);",
      "  vec3 nrm = normalize(rt * q.x + up * q.y + f * sqrt(1.0 - r2));",
      "  float t = uTime * 0.035;",
      "  vec2 p = q * 2.2 + vI.xz * 0.003 + vec2(t, -t * 0.6);",
      "  float n = fbm4(p) * 0.6 + fbm4(p * 2.7 + 5.0) * 0.4;",
      "  float d = smoothstep(1.0, 0.25, r2 + 0.55 * n) * vI2.w;",
      "  float ndl = dot(nrm, uSunDir) * 0.5 + 0.5;",
      "  vec3 dust = vec3(0.62, 0.40, 0.25);",
      "  vec3 col = dust * (uSunCol * (0.15 + 0.85 * ndl * ndl) * 0.75 + mix(uAmbHor, uAmbUp, nrm.y * 0.5 + 0.5) * 0.55) * (0.75 + 0.35 * n);",
      "  col *= mix(0.55, 1.0, smoothstep(0.0, 900.0, vW.y));",   // darker near the ground
      "  col = haze(col, vW);",
      "  gl_FragColor = vec4(col, d * (1.0 - uIn));",
      "  " + LOGF,
      "}"].join("\n");
    var PUFF = [];
    (function () {
      var k = 0;
      for (var i = 0; i < 64; i++) {
        var th = i / 64 * Math.PI * 2 + TER.hash12(i, 3) * 0.05;
        var lu = Math.cos(th), lv = Math.sin(th);
        for (var j = 0; j < 3; j++) {
          var y = 260 + j * 520 + TER.hash12(i, j) * 180, e = 0.99 - 0.04 * j;
          var x = ST.c.x + (ST.dir.x * lu * ST.a + ST.perp.x * lv * ST.b) * e, z = ST.c.y + (ST.dir.y * lu * ST.a + ST.perp.y * lv * ST.b) * e;
          PUFF.push([x, y, z, 520 + 260 * TER.hash12(i * 2, j), 0.9]);
        }
      }
      for (var tI = 0; tI < 26; tI++) {
        var a2 = TER.hash12(tI, 9) * Math.PI * 2, rr = Math.sqrt(TER.hash12(tI, 11)) * 0.8;
        var x2 = ST.c.x + (ST.dir.x * Math.cos(a2) * ST.a + ST.perp.x * Math.sin(a2) * ST.b) * rr, z2 = ST.c.y + (ST.dir.y * Math.cos(a2) * ST.a + ST.perp.y * Math.sin(a2) * ST.b) * rr;
        PUFF.push([x2, 1700 + TER.hash12(tI, 2) * 250, z2, 900 + 300 * TER.hash12(tI, 4), 0.85]);
      }
    })();
    var puffs = billboards(PUFF.length, puffFS, false, { uIn: { value: 0 } }, 7);
    PUFF.forEach(function (p, i) { puffs.a.setXYZW(i, p[0], p[1] - p[3], p[2], p[3]); puffs.b.setXYZW(i, 1, 2, 0, p[4]); });
    // inst2.y = 2 makes the quad twice as tall as its scale, centred by the y offset of -scale: a disc of radius = scale
    puffs.a.needsUpdate = puffs.b.needsUpdate = true;

    /* ---------------- dust streaks round the camera (in the storm, and lightly in the wind) */
    var NSTR = 1400;
    var strU = sharedUniforms({ uVel: { value: new THREE.Vector3() }, uAmt: { value: 0 }, uBox: { value: 70 } });
    var strG = new THREE.BufferGeometry(), sp = [], sd = [];
    for (var i = 0; i < NSTR; i++) { var h = [TER.hash12(i, 1), TER.hash12(i, 2), TER.hash12(i, 3)]; sp.push(h[0], h[1], h[2], h[0], h[1], h[2]); sd.push(0, 1); }
    strG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); strG.setAttribute("tail", new THREE.Float32BufferAttribute(sd, 1));
    var streaks = new THREE.LineSegments(strG, new THREE.ShaderMaterial({
      uniforms: strU, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      vertexShader: GLSL_COMMON + LOGV_PARS + "attribute float tail; uniform vec3 uVel; uniform float uAmt; uniform float uBox; varying float vA; varying vec3 vW;" +
        " void main(){ vec3 wind = vec3(-38.0, 2.0, -9.0); vec3 rel = wind - uVel; vec3 p = position * uBox; p = mod(p + rel * uTime * 0.0 - uCam + uBox * 100.0 + (wind * uTime), vec3(uBox)) - uBox * 0.5;" +
        " vec3 w = uCam + p - rel * 0.035 * tail; vW = w; float d = length(p); vA = uAmt * (1.0 - smoothstep(uBox * 0.25, uBox * 0.5, d)) * smoothstep(0.5, 3.0, d);" +
        " gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "varying float vA; varying vec3 vW; void main(){ vec3 c = vec3(0.62, 0.42, 0.28) * (uSunCol * 0.5 + uAmbUp + uAmbHor) * 0.9; gl_FragColor = vec4(c, vA * 0.55); " + LOGF + " }"
    }));
    streaks.frustumCulled = false; streaks.renderOrder = 9; scene.add(streaks);

    /* ---------------- static sparks on the canopy: jagged arcs, redrawn many times a second */
    var NARC = 10, ARCSEG = 8;
    function arcGroup() {
      var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(NARC * ARCSEG * 2 * 3), 3));
      var m = new THREE.LineSegments(g, new THREE.ShaderMaterial({
        uniforms: sharedUniforms({ uArc: { value: 0 } }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: LOGV_PARS + "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); " + LOGV + " }",
        fragmentShader: LOGF_PARS + "uniform float uArc; void main(){ gl_FragColor = vec4(vec3(0.7, 0.85, 1.6) * uArc * 2.5, 1.0); " + LOGF + " }"
      }));
      m.frustumCulled = false; return m;
    }
    var arcsOut = arcGroup(), arcsIn = arcGroup();
    POD.g.add(arcsOut); POD.cockpit.add(arcsIn);
    function canopyPt(u, v) {   // a point on the canopy ellipsoid, u round, v up (0 = rim, 1 = top)
      var th = u * Math.PI * 2, ph = (1 - v) * Math.PI * 0.5;
      return new THREE.Vector3(Math.sin(th) * Math.sin(ph + 0.001) * 1.17, 0.52 + Math.cos(ph) * 0.74, -1.35 + Math.cos(th) * Math.sin(ph + 0.001) * 2.08);
    }
    var arcT = 0;
    function updateArcs(t, amt) {
      [arcsOut, arcsIn].forEach(function (m) { m.material.uniforms.uArc.value = amt > 0.01 ? amt * (0.6 + 0.4 * Math.random()) : 0; m.visible = amt > 0.01; });
      if (amt < 0.01 || t - arcT < 0.05) return; arcT = t;
      var P = arcsOut.geometry.attributes.position, k = 0;
      for (var i = 0; i < NARC; i++) {
        var u = Math.random(), v = 0.05 + Math.random() * 0.6, du = (Math.random() - 0.5) * 0.08, dv = 0.04 + Math.random() * 0.08;
        var prev = canopyPt(u, v);
        for (var s = 0; s < ARCSEG; s++) {
          u += du + (Math.random() - 0.5) * 0.03; v = clamp(v + dv * (Math.random() * 1.4 - 0.2), 0.02, 0.98);
          var nx = canopyPt(u, v).multiplyScalar(1.004);
          P.setXYZ(k++, prev.x, prev.y, prev.z); P.setXYZ(k++, nx.x, nx.y, nx.z); prev = nx;
        }
      }
      P.needsUpdate = true;
      arcsIn.geometry.attributes.position.array.set(P.array); arcsIn.geometry.attributes.position.needsUpdate = true;
    }

    /* ---------------- vapour from the ship, dust at lift-off: soft particles with their own clocks */
    function puffSystem(n, emit, spread, life, rise, size, col, alpha) {
      var g = new THREE.BufferGeometry(), pos = [], sd = [];
      for (var i = 0; i < n; i++) { var e = emit[i % emit.length]; pos.push(e.x, e.y, e.z); sd.push(TER.hash12(i * 1.3, 7.7), TER.hash12(i * 2.1, 3.3), TER.hash12(i * 0.7, 9.1), i % emit.length); }
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("seed", new THREE.Float32BufferAttribute(sd, 4));
      var u = sharedUniforms({ uPx: LIGHTS.u.uPx, uClock: { value: 0 }, uAmt: { value: 1 }, uSpread: { value: spread }, uLife: { value: life }, uRise: { value: rise }, uSize: { value: size }, uCol: { value: new THREE.Vector3().fromArray(col) }, uAlpha: { value: alpha } });
      var m = new THREE.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false,
        vertexShader: GLSL_COMMON + LOGV_PARS + "attribute vec4 seed; uniform float uPx, uClock, uSpread, uLife, uRise, uSize, uAmt; varying float vA; varying vec3 vW;" +
          " void main(){ float age = fract(uClock / uLife + seed.x); float a = seed.y * 6.2832; vec3 dir = vec3(cos(a), 0.0, sin(a));" +
          " vec3 w = position + dir * uSpread * sqrt(age) * (0.4 + 0.6 * seed.z) + vec3(6.0, uRise, 1.5) * age; vW = w;" +
          " vec4 mv = viewMatrix * vec4(curveW(w), 1.0); gl_Position = projectionMatrix * mv; float sz = uSize * (0.35 + 1.4 * age); gl_PointSize = clamp(sz * uPx / max(-mv.z, 1.0), 1.0, 380.0);" +
          " vA = smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.4, 1.0, age)) * uAmt; " + LOGV + " }",
        fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform vec3 uCol; uniform float uAlpha; varying float vA; varying vec3 vW; void main(){ vec2 q = gl_PointCoord - 0.5; float d = exp(-dot(q, q) * 12.0); vec3 c = uCol * (uSunCol * 0.7 + (uAmbUp + uAmbHor) * 0.6); c = haze(c, vW); gl_FragColor = vec4(c, d * vA * uAlpha); " + LOGF + " }"
      });
      var p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 8; scene.add(p);
      return { p: p, u: u };
    }
    var vapour = puffSystem(260, PORT.ship.vents, 7, 7, 9, 5.5, [0.95, 0.95, 0.97], 0.5);
    var pad = POD_START();
    function POD_START() { return [PORT.departPad]; }
    var liftDust = puffSystem(160, pad, 26, 3.5, 2.5, 4.5, [0.62, 0.45, 0.33], 0.28);

    function update(t, camPos, podVel, stormAmt, wind) {
      updateDevils(t);
      puffs.m.uniforms.uIn.value = smooth(0.25, 0.8, stormAmt);
      strU.uVel.value.copy(podVel); strU.uAmt.value = Math.max(stormAmt, wind || 0);
      strU.uBox.value = 70;
      vapour.u.uClock.value = U.uTime.value;
      liftDust.u.uClock.value = t; liftDust.u.uAmt.value = smooth(0, 1.2, t) * (1 - smooth(9, 14, t));
      liftDust.p.visible = t < 15;
    }
    return { update: update, stormAt: stormAt, stormE: stormE, ST: ST, updateArcs: updateArcs, devils: DEV };
  })();
