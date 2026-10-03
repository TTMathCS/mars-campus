  /* ==========================================================================================
     Lights: small lamps, beacons and strobes drawn as glowing points. They stay visible as a
     spark when far away and dim with the haze. blink: 0 steady, > 0 strobe at that rate (Hz),
     < 0 on/off beacon at that rate.
     ========================================================================================== */
  var LIGHTS = (function () {
    var pos = [], col = [], size = [], blink = [], mesh = null;
    var U2 = sharedUniforms({ uPx: { value: 600 } });
    function add(x, y, z, c, s, b) { pos.push(x, y, z); col.push(c[0], c[1], c[2]); size.push(s || 0.6); blink.push(b || 0); }
    function build() {
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("lcol", new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute("lsize", new THREE.Float32BufferAttribute(size, 1));
      g.setAttribute("lblink", new THREE.Float32BufferAttribute(blink, 1));
      var m = new THREE.ShaderMaterial({
        uniforms: U2,
        vertexShader: GLSL_COMMON + LOGV_PARS + [
          "attribute vec3 lcol; attribute float lsize; attribute float lblink; uniform float uPx; varying vec3 vC;",
          "void main(){",
          "  vec3 w = position; vec4 mv = viewMatrix * vec4(curveW(w), 1.0); gl_Position = projectionMatrix * mv;",
          "  float d = max(-mv.z, 0.5); float px = lsize * uPx / d;",
          "  float ph = hash12(w.xz * 0.37);",
          "  float b = 1.0;",
          "  if (lblink > 0.0) b = 0.04 + 4.0 * pow(max(0.0, sin(6.2832 * (uTime * lblink + ph))), 40.0);",
          "  else if (lblink < 0.0) b = 0.15 + 0.85 * step(0.45, fract(uTime * -lblink + ph));",
          "  float T = exp(-length(w - uCam) * uHazeDen * (1.0 + uStorm * 60.0));",
          "  float ps = max(px, 1.6);",
          "  vC = lcol * b * T * max(px * px / (ps * ps), 0.10) * (1.0 - 0.6 * smoothstep(0.08, 0.25, uSunEl));",
          "  gl_PointSize = min(ps * 4.0, 160.0);",
          "  " + LOGV,
          "}"].join("\n"),
        fragmentShader: GLSL_COMMON + LOGF_PARS + "varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float core = exp(-r * r * 40.0) * 2.0; float halo = exp(-r * 5.0) * 0.35; gl_FragColor = vec4(vC * (core + halo) * (1.0 - smoothstep(0.7, 1.0, r)), 1.0); " + LOGF + " }",
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
      });
      mesh = new THREE.Points(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    function resize(hpx) { U2.uPx.value = hpx / (2 * Math.tan(camera.fov * D2R / 2)); }
    return { add: add, build: build, resize: resize, u: U2 };
  })();
  var LC = { white: [2.2, 2.0, 1.7], warm: [2.4, 1.6, 0.9], red: [3.2, 0.25, 0.12], green: [0.3, 2.6, 0.9], blue: [0.6, 1.3, 3.0], amber: [3.0, 1.5, 0.3] };
