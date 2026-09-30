
  /* ============================== HDR pipeline: scene -> bloom -> filmic composite ============================== */
  var POST = (function () {
    var gl2 = renderer.capabilities.isWebGL2, type = THREE.HalfFloatType, msaa = gl2 && !MOBILE;
    var opts = { type: type, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    var rt = msaa ? new THREE.WebGLMultisampleRenderTarget(4, 4, opts) : new THREE.WebGLRenderTarget(4, 4, opts); if (msaa) rt.samples = 4;
    var bopt = { type: type, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    var N = MOBILE ? 4 : 5, mips = [], tmps = [];
    for (var i = 0; i < N; i++) { mips.push(new THREE.WebGLRenderTarget(4, 4, bopt)); tmps.push(new THREE.WebGLRenderTarget(4, 4, bopt)); }
    var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; qs.add(quad);
    var VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    var bright = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uTh: { value: 1.1 } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform float uTh; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(max(c.r, c.g), c.b); if (!(l >= 0.0 && l < 65000.0)) c = vec3(0.0); c = clamp(c, 0.0, 60.0); l = max(max(c.r, c.g), c.b); float k = max(l - uTh, 0.0); k = k * k / (k + 0.6); gl_FragColor = vec4(c * (k / max(l, 1e-4)), 1.0); }" });
    var copy = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uTx: { value: new THREE.Vector2() } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform vec2 uTx; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv + uTx * vec2(-1.0, -1.0)).rgb + texture2D(t, vUv + uTx * vec2(1.0, -1.0)).rgb + texture2D(t, vUv + uTx * vec2(-1.0, 1.0)).rgb + texture2D(t, vUv + uTx * vec2(1.0, 1.0)).rgb; gl_FragColor = vec4(c * 0.25, 1.0); }" });
    var blur = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uD: { value: new THREE.Vector2() } }, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform vec2 uD; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb * 0.2270270; c += (texture2D(t, vUv + uD * 1.3846154).rgb + texture2D(t, vUv - uD * 1.3846154).rgb) * 0.3162162; c += (texture2D(t, vUv + uD * 3.2307692).rgb + texture2D(t, vUv - uD * 3.2307692).rgb) * 0.0702703; gl_FragColor = vec4(c, 1.0); }" });
    var cu = { tS: { value: null }, uBloom: { value: 0.9 }, uExp: { value: 1 }, uTime: { value: 0 }, uGrain: { value: 0.035 }, uVig: { value: 0.28 }, uFade: { value: 0 } };
    for (var b = 0; b < 5; b++) cu["tB" + b] = { value: null };
    var comp = new THREE.ShaderMaterial({ uniforms: cu, vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: [
        "uniform sampler2D tS, tB0, tB1, tB2, tB3, tB4; uniform float uBloom, uExp, uTime, uGrain, uVig, uFade; varying vec2 vUv;",
        "vec3 fit(vec3 v){ return (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081); }",
        "vec3 aces(vec3 c){ const mat3 I = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777); const mat3 O = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602); return clamp(O * fit(I * c), 0.0, 1.0); }",
        "vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }",
        "float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
        "void main(){",
        "  vec3 c = texture2D(tS, vUv).rgb; float cm = c.r + c.g + c.b; if (!(cm >= -1.0 && cm < 1e6)) c = vec3(0.0); c = max(c, 0.0);",
        "  vec3 bl = texture2D(tB0, vUv).rgb * 0.35 + texture2D(tB1, vUv).rgb * 0.3 + texture2D(tB2, vUv).rgb * 0.22 + texture2D(tB3, vUv).rgb * 0.18 + texture2D(tB4, vUv).rgb * 0.15;",
        "  c = (c + bl * uBloom) * uExp / 0.6;",
        "  // ACES, with part of the hue kept for very bright colours (sunsets, lamps, plasma)",
        "  vec3 a = aces(c); float m = max(max(c.r, c.g), c.b); vec3 hp = aces(vec3(m)) * c / max(m, 1e-4);",
        "  c = mix(a, hp, 0.35);",
        "  vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q, q) * 2.2;",
        "  c = srgb(clamp(c, 0.0, 1.0));",
        "  c += (h(vUv * 1000.0 + uTime) - 0.5) * uGrain * (1.0 - c * 0.6);",
        "  c += (h(vUv * 731.0 - uTime * 0.7) - 0.5) / 255.0;",
        "  gl_FragColor = vec4(c * (1.0 - uFade), 1.0);",
        "}"
      ].join("\n") });
    function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(qs, cam); }
    var W = 4, H = 4;
    function setSize(w, h) {
      W = w; H = h; rt.setSize(w, h);
      var bw = Math.max(2, w >> 1), bh = Math.max(2, h >> 1);
      for (var i = 0; i < N; i++) { mips[i].setSize(Math.max(2, bw >> i), Math.max(2, bh >> i)); tmps[i].setSize(Math.max(2, bw >> i), Math.max(2, bh >> i)); }
    }
    function bloomChain(src) {
      bright.uniforms.t.value = src; pass(bright, mips[0]);
      for (var i = 0; i < N; i++) {
        if (i > 0) { copy.uniforms.t.value = mips[i - 1].texture; copy.uniforms.uTx.value.set(0.5 / mips[i - 1].width, 0.5 / mips[i - 1].height); pass(copy, mips[i]); }
        blur.uniforms.t.value = mips[i].texture; blur.uniforms.uD.value.set(1 / mips[i].width, 0); pass(blur, tmps[i]);
        blur.uniforms.t.value = tmps[i].texture; blur.uniforms.uD.value.set(0, 1 / mips[i].height); pass(blur, mips[i]);
      }
    }
    function render(sc, camera, t) {
      renderer.setRenderTarget(rt); renderer.render(sc, camera);
      bloomChain(rt.texture);
      cu.tS.value = rt.texture; for (var i = 0; i < 5; i++) cu["tB" + i].value = mips[Math.min(i, N - 1)].texture;
      cu.uTime.value = (t || 0) % 100;
      pass(comp, null);
    }
    // small offline render (TV camera feeds): scene -> hdr -> composite without bloom
    var snapHDR = new THREE.WebGLRenderTarget(512, 288, opts), black = new THREE.DataTexture(new Uint16Array([0, 0, 0, 15360]), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType);
    black.needsUpdate = true;
    function snapshot(sc, camera, out) {
      renderer.setRenderTarget(snapHDR); renderer.render(sc, camera);
      var keep = cu.uBloom.value, g = cu.uGrain.value, f = cu.uFade.value; cu.uBloom.value = 0; cu.uGrain.value = 0.02; cu.uFade.value = 0;
      cu.tS.value = snapHDR.texture; for (var i = 0; i < 5; i++) cu["tB" + i].value = black;
      pass(comp, out); cu.uBloom.value = keep; cu.uGrain.value = g; cu.uFade.value = f;
      renderer.setRenderTarget(null);
    }
    return { setSize: setSize, render: render, snapshot: snapshot, u: cu, bright: bright };
  })();

  /* ============================== image-based light: the Mars sky, rooms, caverns ============================== */
  var PM = new THREE.PMREMGenerator(renderer);
  var ENV = {};
  function envFromGradient(stops, panels) {
    var es = new THREE.Scene();
    var tex = canvasTex(64, 256, function (g, w, h) { var gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
    (panels || []).forEach(function (q) { var m = new THREE.Mesh(new THREE.PlaneGeometry(q[3], q[3]), new THREE.MeshBasicMaterial({ color: new THREE.Color(q[4] || 0xfff6e8).multiplyScalar(q[5] || 1), side: THREE.DoubleSide })); m.position.set(q[0], q[1], q[2]); m.lookAt(0, 0, 0); es.add(m); });
    return PM.fromScene(es, 0.03).texture;
  }
  var envSkyScene = new THREE.Scene(), envSkyMesh = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat), envGround = new THREE.Mesh(new THREE.CircleGeometry(80, 32), new THREE.MeshBasicMaterial({ color: 0x331a10 }));
  envGround.rotation.x = -Math.PI / 2; envGround.position.y = -2; envSkyScene.add(envSkyMesh); envSkyScene.add(envGround);
  var envSkyRT = null, envSkyStamp = { t: -99, st: -1, at: -9 };
  function refreshSkyEnv(force) {
    if (!force && Math.abs(state.t - envSkyStamp.t) < 0.2 && Math.abs(state.storm - envSkyStamp.st) < 0.08) return;
    if (!force && elapsed - envSkyStamp.at < 0.6) return;
    // the ground as the sky sees it: rust regolith lit by the sun and the sky
    var E = Math.max(sunDir.y, 0) * outSun.intensity * 1.1 + 0.35 * (skyOut.hemi.r + skyOut.hemi.g + skyOut.hemi.b) / 3 + 0.02;
    envGround.material.color.setRGB(0.36 * E, 0.16 * E, 0.075 * E);
    var old = envSkyRT; envSkyRT = PM.fromScene(envSkyScene, 0.02, 0.1, 200); if (old) old.dispose();
    ENV.sky = envSkyRT.texture; envSkyStamp = { t: state.t, st: state.storm, at: elapsed };
    if (curEnv === "sky") scene.environment = ENV.sky;
  }
  function buildEnvs() {
    ENV.interior = envFromGradient([[0, "#fff1dc"], [0.42, "#d6a67a"], [0.55, "#6e4430"], [1, "#22150e"]], [[0, 9, 0, 6, 0xfff0dc, 1.4], [7, 3, 4, 3], [-6, 4, -5, 3], [3, 2, -8, 2.5]]);
    ENV.grotto = envFromGradient([[0, "#9cc4ff"], [0.45, "#cfe2ff"], [0.55, "#e8dcc2"], [1, "#9a8a70"]], [[3, 9, 2, 3, 0xfff4e0, 6]]);
    ENV.forest = envFromGradient([[0, "#dfe5e0"], [0.45, "#a9b8a4"], [0.55, "#4a5a3c"], [1, "#1e2618"]], [[-4, 8, 3, 3, 0xfff2d8, 3]]);
    ENV.works = envFromGradient([[0, "#e8eef4"], [0.45, "#98a0a8"], [0.55, "#4a4c50"], [1, "#1a1b1d"]], [[0, 9, 0, 8, 0xeef6ff, 1.6], [6, 4, 0, 3, 0xeef6ff, 1]]);
    Object.keys(M).forEach(function (k) { var m = M[k]; if (m.userData.envBase == null) m.userData.envBase = m.metalness > 0.5 ? 1 : m.transparent ? 0.6 : 1; });
  }
  var curEnv = "", curEnvK = -1;
  function setEnv(name, k) {
    if (name !== curEnv) { curEnv = name; scene.environment = ENV[name] || null; }
    if (Math.abs(k - curEnvK) > 0.01) { curEnvK = k; Object.keys(M).forEach(function (n) { var m = M[n]; m.envMapIntensity = (m.userData.envBase == null ? 1 : m.userData.envBase) * k; }); }
  }
