(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var D2R = Math.PI / 180;
  var TOUCH = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || (navigator.maxTouchPoints > 0 && !(window.matchMedia && matchMedia("(pointer: fine)").matches));
  var MOBILE = TOUCH && Math.min(screen.width, screen.height) < 900;
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function showError(msg) { $("loadErr").textContent = msg; $("loadErr").hidden = false; $("loadMsg").textContent = "Could not start"; $("loadPct").textContent = ""; }
  if (!window.THREE) { showError("The 3D library did not load. Check your connection and reload the page."); return; }
  var V3 = THREE.Vector3;

  /* ============================== math + noise ============================== */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash2i(i, j, s) { var n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2i(xi, yi, s), b = hash2i(xi + 1, yi, s), c = hash2i(xi, yi + 1, s), d = hash2i(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct, s) { var sum = 0, amp = 0.5, f = 1, nrm = 0; for (var o = 0; o < oct; o++) { sum += amp * vnoise(x * f, y * f, s + o * 13); nrm += amp; f *= 2.03; amp *= 0.5; } return sum / nrm; }
  function ridged(x, y, oct, s) { var sum = 0, amp = 0.5, f = 1, nrm = 0; for (var o = 0; o < oct; o++) { var n = 1 - Math.abs(vnoise(x * f, y * f, s + o * 31) * 2 - 1); sum += amp * n * n; nrm += amp; f *= 2.1; amp *= 0.5; } return sum / nrm; }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry(20260929);

  /* ============================== renderer ============================== */
  var canvas = $("view");
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: "high-performance" }); }
  catch (e) { showError("This browser could not start WebGL, which the 3D view needs. Try a current Chrome, Edge, Firefox or Safari."); return; }
  var DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.6 : 1.5);
  renderer.setPixelRatio(DPR);
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.toneMapping = THREE.NoToneMapping; // the composite pass tone-maps the HDR frame
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); showError("The graphics context was lost. Reload the page to continue."); $("loading").classList.remove("done"); });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 30000);
  camera.rotation.order = "YXZ";
  scene.fog = new THREE.FogExp2(0x9a6f55, 0.00022);

  /* ============================== sky ============================== */
  var LAT = 44.2 * D2R, DEC_SUN = 12 * D2R, SOL_H = 24.66;
  var H_SUNSET = Math.acos(clamp(-Math.tan(LAT) * Math.tan(DEC_SUN), -1, 1));
  function altAz(H, dec) {
    var sa = Math.sin(LAT) * Math.sin(dec) + Math.cos(LAT) * Math.cos(dec) * Math.cos(H);
    var alt = Math.asin(clamp(sa, -1, 1));
    var az = Math.atan2(-Math.sin(H) * Math.cos(dec), Math.cos(LAT) * Math.sin(dec) - Math.sin(LAT) * Math.cos(dec) * Math.cos(H));
    if (az < 0) az += 2 * Math.PI;
    return { alt: alt, az: az };
  }
  function dirOf(p, out) { return out.set(Math.sin(p.az) * Math.cos(p.alt), Math.sin(p.alt), -Math.cos(p.az) * Math.cos(p.alt)); }
  function hourAngle(t) { return (t - SOL_H / 2) / SOL_H * 2 * Math.PI; }
  var SUNSET_T = SOL_H / 2 + H_SUNSET / (2 * Math.PI) * SOL_H;
  var SUNRISE_T = SOL_H / 2 - H_SUNSET / (2 * Math.PI) * SOL_H;

  var P_DAY = { wide: [0.80, 0.64, 0.47], fwd: [0.9, 0.85, 0.8], gW: 0.55, gF: 0.93, kW: 1.0, kF: 0.5, kI: 0.33, tau: 0.35, sunTau: [0.36, 0.38, 0.42], sunE: 2.0 };
  var P_SET = { wide: [1.0, 0.60, 0.36], fwd: [0.18, 0.45, 1.0], gW: 0.55, gF: 0.93, kW: 1.0, kF: 0.5, kI: 0.33, tau: 0.35, sunTau: [0.36, 0.38, 0.42], sunE: 1.0 };
  var P_STORM = { wide: [1.0, 0.55, 0.30], fwd: [0.95, 0.66, 0.44], gW: 0.55, gF: 0.8, kW: 1.0, kF: 0.4, kI: 0.5, tau: 1.6, sunTau: [1.05, 1.1, 1.18], sunE: 1.3 };
  function mixP(a, b, t) {
    var o = {};
    for (var k in a) {
      if (Array.isArray(a[k])) o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t), lerp(a[k][2], b[k][2], t)];
      else o[k] = lerp(a[k], b[k], t);
    }
    return o;
  }
  var SKY_GAIN = 4.2;
  var SU = {
    uSun: { value: new V3(0, 0.2, -1).normalize() }, uWide: { value: new V3() }, uFwd: { value: new V3() }, uSunTau: { value: new V3() },
    uGW: { value: 0.55 }, uGF: { value: 0.93 }, uKW: { value: 1 }, uKF: { value: 0.5 }, uKI: { value: 0.33 }, uTau: { value: 0.35 }, uSunE: { value: 1 },
    uGain: { value: SKY_GAIN }, uExpo: { value: 1 }, uDisk: { value: 1 }, uNight: { value: 0 }, uEarth: { value: new V3(0, -1, 0) }, uGround: { value: new V3(0.1, 0.05, 0.03) }
  };
  var SKY_GLSL = [
    "uniform vec3 uSun,uWide,uFwd,uSunTau; uniform float uGW,uGF,uKW,uKF,uKI,uTau,uSunE,uGain;",
    "float hg(float g, float c){ float g2 = g*g; return (1.0 - g2) / pow(max(1.0 + g2 - 2.0*g*c, 1e-4), 1.5) * 0.0795775; }",
    "float airm(float y){ return 1.0 / (max(y, 0.0) * 0.98 + 0.04); }",
    "float sunFade(){ return uSunE * exp(min(uSun.y, 0.0) * 14.0); }",
    "vec3 sunTrans(){ return exp(-uSunTau * airm(uSun.y)); }",
    "vec3 skyRadC(vec3 d, float c){",
    "  float y = max(d.y, 0.0);",
    "  float path = 1.0 - exp(-uTau * airm(y));",
    "  vec3 Tl = exp(-uSunTau * min(airm(max(uSun.y, 0.0)), 8.0) * 0.35);",
    "  vec3 sc = uWide * (uKW * hg(uGW, c) + uKI) + uFwd * (uKF * hg(uGF, c));",
    "  float below = clamp(-uSun.y * 6.0, 0.0, 1.0);",
    "  float hb = mix(1.0, exp(-y * 7.0) * 1.6 + 0.08, below);",
    "  return sunFade() * Tl * sc * path * hb * uGain;",
    "}"
  ].join("\n");
  var skyMat = new THREE.ShaderMaterial({
    uniforms: SU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
    fragmentShader: [
      SKY_GLSL,
      "uniform float uDisk, uNight; uniform vec3 uEarth, uGround; varying vec3 vDir;",
      "void main(){",
      "  vec3 d = normalize(vDir);",
      "  vec3 dh = d; dh.y = max(dh.y, 0.004); dh = normalize(dh);",
      "  float c = dot(dh, uSun);",
      "  vec3 col = skyRadC(dh, c);",
      "  float cs = dot(d, uSun);",
      "  float disk = smoothstep(0.999955, 0.99998, cs);",
      "  col += sunTrans() * sunFade() * uGain * (disk * 60.0 + pow(max(cs, 0.0), 900.0) * 1.2) * uDisk * step(0.0, d.y + 0.01);",
      "  col += vec3(0.012, 0.016, 0.03) * uNight;",
      "  float e = dot(d, uEarth); col += vec3(0.55, 0.72, 1.0) * smoothstep(0.999992, 0.999998, e) * 40.0 * uNight;",
      "  col += vec3(0.55, 0.72, 1.0) * pow(max(e, 0.0), 20000.0) * 0.5 * uNight;",
      "  if (d.y < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.05, d.y));",
      "  gl_FragColor = vec4(max(col, 0.0), 1.0);",
      "  #include <encodings_fragment>",
      "}"
    ].join("\n")
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 64, 32), skyMat);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  function hgJS(g, c) { var g2 = g * g; return (1 - g2) / Math.pow(Math.max(1 + g2 - 2 * g * c, 1e-4), 1.5) * 0.0795775; }
  function airmJS(y) { return 1 / (Math.max(y, 0) * 0.98 + 0.04); }
  function skyRadJS(d, s, p) {
    var c = d.x * s.x + d.y * s.y + d.z * s.z, y = Math.max(d.y, 0);
    var path = 1 - Math.exp(-p.tau * airmJS(y));
    var mS = Math.min(airmJS(Math.max(s.y, 0)), 8) * 0.35;
    var below = clamp(-s.y * 6, 0, 1), hb = 1 + (Math.exp(-y * 7) * 1.6 + 0.08 - 1) * below;
    var fade = p.sunE * Math.exp(Math.min(s.y, 0) * 14), out = [0, 0, 0];
    var a = p.kW * hgJS(p.gW, c) + p.kI, b = p.kF * hgJS(p.gF, c);
    for (var i = 0; i < 3; i++) out[i] = fade * Math.exp(-p.sunTau[i] * mS) * (p.wide[i] * a + p.fwd[i] * b) * path * hb * SKY_GAIN;
    return out;
  }

  // stars: fixed to the celestial sphere and turned with the sol
  var starGroup = new THREE.Group();
  (function () {
    var n = MOBILE ? 1400 : 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), r = mulberry(77);
    for (var i = 0; i < n; i++) {
      var u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * s * 15000; pos[i * 3 + 1] = u * 15000; pos[i * 3 + 2] = Math.sin(a) * s * 15000;
      var b = Math.pow(r(), 3) * 0.9 + 0.1, t = r();
      col[i * 3] = b * (0.85 + 0.15 * t); col[i * 3 + 1] = b * 0.9; col[i * 3 + 2] = b * (1.05 - 0.15 * t);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var m = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
    var pts = new THREE.Points(g, m); pts.renderOrder = -9; pts.frustumCulled = false;
    starGroup.add(pts); starGroup.userData.mat = m;
  })();
  scene.add(starGroup);
  var POLE = new V3(0, Math.sin(LAT), -Math.cos(LAT)).normalize();

  // Phobos: a small dark potato that crosses the sky west to east
  var phobos = new THREE.Mesh(new THREE.IcosahedronGeometry(38, 2), new THREE.MeshStandardMaterial({ color: 0x5a4c42, roughness: 1, fog: false }));
  (function () { var p = phobos.geometry.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i); var k = 1 + 0.18 * (vnoise(x * 0.05, z * 0.05, 3) - 0.5); p.setXYZ(i, x * k * 1.25, y * k * 0.95, z * k); } phobos.geometry.computeVertexNormals(); })();
  scene.add(phobos);

  /* ============================== lights ============================== */
  var sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  var SHADOW_RES = MOBILE ? 2048 : 4096;
  sun.shadow.mapSize.set(SHADOW_RES, SHADOW_RES);
  var sc = sun.shadow.camera; sc.left = -150; sc.right = 150; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 900;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  sun.target.position.set(42, 0, 8);
  scene.add(sun); scene.add(sun.target);
  var hemi = new THREE.HemisphereLight(0xffffff, 0x553322, 0.6);
  scene.add(hemi);
  var NPOOL = MOBILE ? 5 : 8;
  var pool = [];
  for (var pi = 0; pi < NPOOL; pi++) { var pl = new THREE.PointLight(0xffc98a, 0, 22, 2); pl.color.convertSRGBToLinear(); scene.add(pl); pool.push(pl); }

  /* ============================== terrain ============================== */
  var KNOBS = [[2600, -3300, 620, 950], [-1900, -4300, 480, 820], [4300, -800, 430, 720], [3100, 2700, 360, 700], [900, -5400, 720, 1250], [5200, -3400, 540, 900], [-4200, -2600, 520, 1000], [-600, 4800, 300, 900]];
  function plateauSD(x, z) { var qx = Math.abs(x - 157) - 223, qz = Math.abs(z + 230) - 380; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0); }
  var PORT = { x: 1450, z: -260 };
  function portSD(x, z) { var qx = Math.abs(x - PORT.x) - 320, qz = Math.abs(z - PORT.z) - 270; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0); }
  function cliffX(z) { return -71 - 11 * fbm(z / 130 + 3.1, 1.3, 3, 5) - 5 * vnoise(z / 33, 2.2, 9); }
  function terrainH(x, z) {
    var h = (fbm(x / 420, z / 420, 4, 3) - 0.5) * 24 + (fbm(x / 90, z / 90, 3, 7) - 0.5) * 5;
    for (var i = 0; i < KNOBS.length; i++) {
      var k = KNOBS[i], dx = x - k[0], dz = z - k[1], d2 = (dx * dx + dz * dz) / (k[3] * k[3]);
      if (d2 < 9) h += k[2] * Math.exp(-d2 * 1.6) * (0.75 + 0.5 * ridged(x / 500, z / 500, 3, 17 + i));
    }
    var ps = portSD(x, z), pw = 1 - smoothstep(0, 170, ps);
    if (pw > 0) h = lerp(h, 1.2 + 0.25 * vnoise(x / 6, z / 6, 19), pw);
    var sd = plateauSD(x, z), w = 1 - smoothstep(0, 110, sd);
    if (w > 0) h = lerp(h, -0.14 - 0.22 * vnoise(x / 5, z / 5, 11) - 0.5 * smoothstep(20, 110, sd) * fbm(x / 30, z / 30, 2, 4), w);
    var d = cliffX(z) - x;
    if (d > -6) {
      var gully = ridged(x / 42, z / 58, 4, 13);
      h -= 205 * (0.6 * smoothstep(-3, 24, d) + 0.4 * smoothstep(34, 80, d)) + gully * 16 * smoothstep(0, 30, d) - (fbm(x / 140, z / 140, 3, 21) - 0.5) * 30 * smoothstep(60, 160, d);
      if (x < -500) {
        var b = fbm(x / 800, z / 800, 3, 29);
        h += 190 * smoothstep(0.53, 0.58, b) * smoothstep(-500, -900, x) + 60 * smoothstep(0.6, 0.66, b) * smoothstep(-500, -900, x);
      }
    }
    return h;
  }
  function terrainColor(x, z, h, slope, out) {
    var n1 = fbm(x / 38, z / 38, 3, 41), n2 = vnoise(x / 9, z / 9, 43), n3 = fbm(x / 400, z / 400, 2, 47);
    var r = 0.52 + 0.12 * n1, g = 0.29 + 0.07 * n1, b = 0.17 + 0.04 * n1;
    var dark = smoothstep(0.58, 0.72, n3 + 0.2 * n2) * 0.45; r = lerp(r, 0.24, dark); g = lerp(g, 0.15, dark); b = lerp(b, 0.11, dark);
    var dust = smoothstep(0.55, 0.8, n2) * 0.25 * (1 - slope); r = lerp(r, 0.66, dust); g = lerp(g, 0.44, dust); b = lerp(b, 0.30, dust);
    if (slope > 0.35) {
      var band = 0.5 + 0.5 * Math.sin(h * 0.42 + 3 * fbm(x / 60, z / 60, 2, 5)), k = smoothstep(0.35, 0.8, slope);
      var br = lerp(0.62, 0.42, band), bg = lerp(0.40, 0.25, band), bb = lerp(0.27, 0.17, band);
      r = lerp(r, br, k); g = lerp(g, bg, k); b = lerp(b, bb, k);
    }
    out[0] = r; out[1] = g; out[2] = b;
  }
  // terrain: vertex colours for the large-scale look, a two-scale regolith detail map for the close-up grit
  var terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  terrainMat.onBeforeCompile = function (sh) {
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <map_fragment>", "#ifdef USE_MAP\n vec3 d1 = texture2D(map, vUv).rgb, d2 = texture2D(map, vUv * 0.173 + 0.31).rgb;\n diffuseColor.rgb *= d1 * d2 * 1.62;\n#endif")
      .replace("vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;", "vec3 mapN = normalize(texture2D(normalMap, vUv).xyz * 2.0 - 1.0 + (texture2D(normalMap, vUv * 0.173 + 0.31).xyz * 2.0 - 1.0) * vec3(1.0, 1.0, 0.0));");
  };
  // drops: [cx, cz, half] squares lowered out of sight where a finer mesh takes over
  function buildTerrain(cx, cz, size, seg, drops) {
    var g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    var p = g.attributes.position, uv = g.attributes.uv, n = p.count, col = new Float32Array(n * 3), c3 = [0, 0, 0], e = size / seg;
    for (var i = 0; i < n; i++) {
      var x = p.getX(i) + cx, z = p.getZ(i) + cz, h = terrainH(x, z);
      (drops || []).forEach(function (d) { if (Math.abs(x - d[0]) < d[2] && Math.abs(z - d[1]) < d[2]) h -= 6; });
      p.setXYZ(i, x, h, z); uv.setXY(i, x / 4, -z / 4);
      var hx = terrainH(x + e, z) - terrainH(x - e, z), hz = terrainH(x, z + e) - terrainH(x, z - e);
      var slope = clamp(Math.hypot(hx, hz) / (2 * e), 0, 1.5) / 1.5;
      terrainColor(x, z, h, slope, c3); col[i * 3] = Math.pow(c3[0], 2.2); col[i * 3 + 1] = Math.pow(c3[1], 2.2); col[i * 3 + 2] = Math.pow(c3[2], 2.2);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    var mesh = new THREE.Mesh(g, terrainMat); mesh.receiveShadow = true; mesh.castShadow = !drops;
    return mesh;
  }

  /* ============================== materials ============================== */
  function std(color, rough, metal, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: rough == null ? 0.8 : rough, metalness: metal || 0 }, extra || {})); }
  function phys(color, rough, metal, extra) { return new THREE.MeshPhysicalMaterial(Object.assign({ color: color, roughness: rough, metalness: metal || 0 }, extra || {})); }
  function glow(color, k) { return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k || 2, roughness: 1 }); }
  var DS = { side: THREE.DoubleSide };
  var M = {
    // structure
    shell: std(0xffffff, 1), vault: std(0xf4ece0, 1, 0, DS), berm: std(0xffffff, 1), bermDark: std(0xcdbcae, 1),
    wall: std(0xf2e8da, 1), plaster: std(0xeadfce, 1), panelWood: std(0xffffff, 1), concrete: std(0xffffff, 1), rockWall: std(0xffffff, 1, 0, DS),
    // floors and stone
    stone: std(0xffffff, 1), marbleDark: std(0xffffff, 1), basalt: std(0xffffff, 1), basaltRough: std(0x9a8e88, 1), terrazzo: std(0xffffff, 1),
    slate: std(0xffffff, 1), tileBlue: std(0xffffff, 1), floorOak: std(0xffffff, 1), floorWalnut: std(0xa8876c, 1), sand: std(0xffffff, 1), grassFloor: std(0xffffff, 1),
    // wood
    wood: std(0xffffff, 1), woodLight: std(0xffffff, 1), woodDark: std(0x9c8a80, 1), cedar: std(0xffd2a8, 1), bamboo: std(0xfff0c8, 1),
    // metals and lacquers
    gold: std(0xd9ae62, 1, 1), goldDark: std(0xa27a45, 1, 1), steel: std(0xd4d6d8, 1, 1), darkMetal: std(0x4a4d52, 1, 0.9), goldDS: std(0xd9ae62, 1, 1, DS),
    black: phys(0x0d0d0f, 0.25, 0, { clearcoat: 1, clearcoatRoughness: 0.06 }), white: phys(0xf2efe9, 0.35, 0, { clearcoat: 0.8, clearcoatRoughness: 0.1 }),
    ceramic: phys(0xf7f5f0, 0.18, 0, { clearcoat: 0.7, clearcoatRoughness: 0.05 }), mirror: std(0xffffff, 0.03, 1),
    stainless: std(0xdfe1e3, 1, 1), heatTile: std(0xffffff, 1),
    // fabric and leather (the weave is white; colours tint it)
    fabBlue: std(0x2c4a73, 1), fabCream: std(0xeee4d4, 1), fabTeal: std(0x245f5c, 1), fabRust: std(0xa4532f, 1), fabPlum: std(0x4f2e49, 1),
    fabSand: std(0xd2bfa3, 1), fabGrey: std(0x6a686e, 1), fabGold: std(0xc49a4c, 1), fabWhite: std(0xf8f5ee, 1), fabMoss: std(0x5a6a3d, 1),
    leather: std(0x8f4d28, 1), leatherBlack: std(0x242120, 1), carpet: std(0xd8ccb8, 1), carpetBlue: std(0x2b3f5e, 1), carpetRust: std(0x8a3f24, 1),
    // plants
    leaf: std(0x3f6f3a, 0.7), leaf2: std(0x2c5632, 0.7), leaf3: std(0x6d913d, 0.7), olive: std(0x7d8a5c, 0.8), trunk: std(0xffffff, 1), soil: std(0xffffff, 1), moss: std(0x9fbf80, 1),
    wheat: std(0xd8b25a, 0.8), fruitR: std(0xc93a2b, 0.4), fruitY: std(0xe8b93a, 0.4), fruitO: std(0xe07b26, 0.4), fruitP: std(0x5a2a5e, 0.35), flowerP: std(0xd8577a, 0.6), flowerW: std(0xf4efe4, 0.6),
    rock: std(0xffffff, 1), meteor: std(0x6a5a52, 1, 0.35), terracotta: std(0xd0714a, 1),
    book1: std(0x7a2a24, 0.7), book2: std(0x23405f, 0.7), book3: std(0x2f5a3e, 0.7), book4: std(0xc9b58c, 0.7), book5: std(0x3d3437, 0.7), book6: std(0x9a6a2e, 0.7),
    bottle: phys(0x1d2a1f, 0.08, 0, { clearcoat: 1 }), bottle2: phys(0x3a1316, 0.08, 0, { clearcoat: 1 }), jar: phys(0xcfd6d2, 0.05, 0, { clearcoat: 1 }),
    // light sources
    lamp: glow(0xffc88a, 3.2), lampSoft: glow(0xffd9aa, 1.8), lampCool: glow(0xd6ecff, 2.6), led: glow(0xffe7c4, 3.4), ledBlue: glow(0x7fc6ff, 4), ledPink: glow(0xff5ccf, 2.6),
    ledGreen: glow(0x9dffb0, 1.6), ledRed: glow(0xff5a3a, 3.5), fireWarm: glow(0xff8a3a, 4), plasma: glow(0xff9ad8, 6), ledWhite: glow(0xffffff, 5),
    // glass and water
    glass: std(0xdfeaf2, 0.03, 0, { transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    glassDome: std(0xd6e4ee, 0.02, 0, { transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
    glassDark: std(0x151b24, 0.05, 0.3), waterBlue: std(0x1f6f86, 0.04, 0, { transparent: true, opacity: 0.86 }),
    waterWall: std(0x2a6f9a, 0.1, 0.1, { emissive: 0x0d3a5c, emissiveIntensity: 0.9, transparent: true, opacity: 0.8 }),
    // outdoors
    solar: std(0xffffff, 1, 0.3), roverWhite: phys(0xf2f0ec, 1, 0, { clearcoat: 0.6, clearcoatRoughness: 0.2 }), suitWhite: std(0xf2f0ea, 1), orange: phys(0xd9632b, 0.45, 0, { clearcoat: 0.5 }), yellow: std(0xe0b23a, 0.6),
    pad: std(0xd6c6b2, 1), road: std(0xc4ae96, 1), marking: std(0xfff2d8, 1), radiator: std(0x55585d, 1, 0.8),
    stoneDS: std(0xffffff, 1, 0, DS), lens: std(0x1a2230, 0.1, 0.5, { emissive: 0xffd9a8, emissiveIntensity: 0 }),
    lampshade: std(0xf6ead6, 0.9, 0, { emissive: 0xffc98a, emissiveIntensity: 0.9, side: THREE.DoubleSide }),
    // alpha-tested foliage cards
    leafBroad: std(0xffffff, 0.75, 0, { alphaTest: 0.45, side: THREE.DoubleSide }), leafConifer: std(0xffffff, 0.8, 0, { alphaTest: 0.4, side: THREE.DoubleSide }),
    leafPalm: std(0xffffff, 0.7, 0, { alphaTest: 0.45, side: THREE.DoubleSide }), leafFern: std(0xffffff, 0.8, 0, { alphaTest: 0.45, side: THREE.DoubleSide }),
    leafGrass: std(0xffffff, 0.85, 0, { alphaTest: 0.4, side: THREE.DoubleSide }), leafMonstera: std(0xffffff, 0.6, 0, { alphaTest: 0.45, side: THREE.DoubleSide }),
    bookWall: std(0xffffff, 0.75)
  };
  // colours above are written in sRGB; the renderer works in linear light
  Object.keys(M).forEach(function (k) { M[k].color.convertSRGBToLinear(); if (M[k].emissive) M[k].emissive.convertSRGBToLinear(); });
  // texture set, metres per tile, normal strength
  var TEXMAP = {
    shell: ["sinter", 1.2, 1], vault: ["plaster", 3, 0.5], wall: ["plaster", 3, 0.5], plaster: ["plaster", 3, 0.5], panelWood: ["walnut", 1.2, 0.6], concrete: ["concrete", 3, 1], rockWall: ["rock", 9, 2],
    berm: ["regolith", 4, 1.2], bermDark: ["regolith", 4, 1.2],
    stone: ["marble", 2.4, 0.4], marbleDark: ["marbleDark", 1.6, 0.4], basalt: ["basalt", 1.2, 0.5], basaltRough: ["rock", 2.5, 1.5], terrazzo: ["terrazzo", 1.2, 0.4],
    slate: ["slate", 1.2, 1], tileBlue: ["mosaic", 0.5, 0.8], floorOak: ["oak", 2.4, 0.7], floorWalnut: ["oak", 2.4, 0.7], sand: ["sand", 3, 1], grassFloor: ["grass", 2, 1],
    wood: ["walnut", 1.2, 0.5], woodLight: ["oakgrain", 1.2, 0.5], woodDark: ["walnut", 1.2, 0.5], cedar: ["oakgrain", 0.9, 0.8], bamboo: ["oakgrain", 1.2, 0.5],
    gold: ["brushed", 0.6, 0.25], goldDark: ["brushed", 0.6, 0.25], steel: ["brushed", 0.6, 0.25], darkMetal: ["brushed", 0.8, 0.25], goldDS: ["brushed", 0.6, 0.25], radiator: ["brushed", 1, 0.3],
    stainless: ["steelPlate", 7, 0.5], heatTile: ["tiles", 1.4, 0.8],
    fabCream: ["boucle", 0.22, 1], leather: ["leather", 0.16, 0.35], leatherBlack: ["leather", 0.16, 0.35], carpet: ["carpet", 0.6, 0.6], carpetBlue: ["carpet", 0.6, 0.6], carpetRust: ["carpet", 0.6, 0.6],
    trunk: ["bark", 1.4, 1.2], soil: ["soil", 1.5, 1], moss: ["grass", 2, 1], rock: ["rock", 3, 1.5], meteor: ["rock", 0.7, 1.5], terracotta: ["concrete", 1, 0.6],
    solar: ["solar", 1.4, 0.4], roverWhite: ["panel", 2.4, 0.6], suitWhite: ["weave", 0.5, 1], pad: ["concrete", 4, 1], road: ["concrete", 4, 1], marking: ["concrete", 4, 1]
  };
  ["fabBlue", "fabTeal", "fabRust", "fabPlum", "fabSand", "fabGrey", "fabGold", "fabWhite", "fabMoss"].forEach(function (k) { TEXMAP[k] = ["weave", 0.3, 0.8]; });
  function texturize() {
    Object.keys(TEXMAP).forEach(function (k) {
      var t = TX[TEXMAP[k][0]], m = M[k]; if (!t || !m) return;
      if (t.map) m.map = t.map; m.normalMap = t.normalMap; m.normalScale.set(TEXMAP[k][2], TEXMAP[k][2]);
      if (t.roughnessMap && !m.isMeshPhysicalMaterial) m.roughnessMap = t.roughnessMap;
      m.needsUpdate = true;
    });
    [["leafBroad", "broad"], ["leafConifer", "conifer"], ["leafPalm", "palm"], ["leafFern", "fern"], ["leafGrass", "grass"], ["leafMonstera", "monstera"]].forEach(function (k) { M[k[0]].map = LEAFTEX[k[1]]; M[k[0]].needsUpdate = true; });
    M.bookWall.map = TX.bookWall; M.bookWall.needsUpdate = true;
    terrainMat.map = TX.ground.map; terrainMat.normalMap = TX.ground.normalMap; terrainMat.normalScale.set(1.3, 1.3); terrainMat.needsUpdate = true;
    // water: two scrolling copies of the wave normals
    var wm = M.waterBlue; wm.normalMap = TX.water.normalMap; wm.normalScale.set(0.6, 0.6); wm.userData.t = { value: 0 };
    wm.onBeforeCompile = function (sh) {
      sh.uniforms.uWT = wm.userData.t;
      sh.fragmentShader = "uniform float uWT;\n" + sh.fragmentShader.replace("vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;",
        "vec3 mapN = normalize(texture2D(normalMap, vUv + vec2(uWT * 0.021, uWT * 0.013)).xyz * 2.0 - 1.0 + texture2D(normalMap, vUv * 1.73 + vec2(-uWT * 0.017, uWT * 0.027)).xyz * 2.0 - 1.0);");
    };
    wm.needsUpdate = true;
  }
  TEXMAP.waterBlue = ["water", 3, 0.6];

  /* ============================== geometry buckets ============================== */
  var BUCKETS = {};
  var YOFF = 0; // lifts everything added while it is set (sunken pit, mezzanine, tower top)
  var UNIT = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: {}, cone: {}, sph: {}
  };
  function unitCyl(seg) { if (!UNIT.cyl[seg]) UNIT.cyl[seg] = new THREE.CylinderGeometry(0.5, 0.5, 1, seg); return UNIT.cyl[seg]; }
  function unitSph(seg) { if (!UNIT.sph[seg]) UNIT.sph[seg] = new THREE.SphereGeometry(0.5, seg, Math.max(4, Math.round(seg * 0.6))); return UNIT.sph[seg]; }
  var _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, "YXZ"), _p = new V3(), _s = new V3();
  function mat4(x, y, z, ry, sx, sy, sz, rx, rz) { _e.set(rx || 0, ry || 0, rz || 0, "YXZ"); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); return _m.compose(_p, _q, _s); }
  // Zones keep each part of the estate in its own groups, so levels you are not on are simply switched off.
  var ZONE = "surface", ZG = {};
  function zoneGroup(z) {
    if (!ZG[z]) { var g = { base: new THREE.Group(), roof: new THREE.Group(), extra: new THREE.Group(), all: new THREE.Group() }; g.all.add(g.base, g.roof, g.extra); g.all.name = z; scene.add(g.all); ZG[z] = g; }
    return ZG[z];
  }
  function put(o) { if (YOFF) o.position.y += YOFF; zoneGroup(ZONE).extra.add(o); return o; }
  // world-space box mapping, so every texture keeps its real size whatever the piece
  function worldUV(g, S) {
    var p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    if (!uv) { uv = new THREE.BufferAttribute(new Float32Array(p.count * 2), 2); g.setAttribute("uv", uv); }
    for (var i = 0; i < p.count; i++) {
      var ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ay >= ax && ay >= az) uv.setXY(i, x / S, -z / S); else if (ax >= az) uv.setXY(i, z / S, y / S); else uv.setXY(i, x / S, y / S);
    }
    uv.needsUpdate = true; return g;
  }
  function addGeo(mat, geo, matrix, layer, noShadow) {
    var key = mat + "|" + (layer || "base") + "|" + ZONE + (noShadow ? "|ns" : "");
    var g = geo.clone(); if (matrix) g.applyMatrix4(matrix); if (YOFF) g.translate(0, YOFF, 0);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (TEXMAP[mat]) worldUV(g, TEXMAP[mat][1]);
    (BUCKETS[key] || (BUCKETS[key] = [])).push(g);
  }
  // rounded box (soft cushions, bevelled tops): after three.js RoundedBoxGeometry
  var RB = {};
  function rboxGeo(w, h, d, r, seg) {
    var key = Math.round(w * 1000) + "," + Math.round(h * 1000) + "," + Math.round(d * 1000) + "," + Math.round(r * 1000) + "," + seg;
    if (RB[key]) return RB[key];
    r = Math.min(r, w / 2, h / 2, d / 2) * 0.999; var S = seg * 2 + 1;
    var g = new THREE.BoxGeometry(1, 1, 1, S, S, S), p = g.attributes.position, nr = g.attributes.normal, hs = 0.5 / S, bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r, v = new V3();
    for (var i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i)); var sx = Math.sign(v.x), sy = Math.sign(v.y), sz = Math.sign(v.z);
      v.x -= sx * hs; v.y -= sy * hs; v.z -= sz * hs; v.normalize();
      p.setXYZ(i, bx * sx + v.x * r, by * sy + v.y * r, bz * sz + v.z * r); nr.setXYZ(i, v.x, v.y, v.z);
    }
    RB[key] = g; return g;
  }
  function rbox(mat, w, h, d, x, y, z, ry, r, layer, rx, rz) { r = r == null ? 0.02 : r; addGeo(mat, rboxGeo(w, h, d, r, r > 0.035 ? 2 : 1), mat4(x, y + h / 2, z, ry || 0, 1, 1, 1, rx, rz), layer); }
  // lathe from [radius, height] pairs
  function lathe(mat, pts, x, y, z, seg, layer) { addGeo(mat, new THREE.LatheGeometry(pts.map(function (q) { return new THREE.Vector2(q[0], q[1]); }), seg || 24), mat4(x, y, z, 0, 1, 1, 1), layer); }
  // soft contact shadows under furniture, gathered and drawn as one instanced mesh per zone
  var BLOBS = [];
  function blob(x, z, w, d, ry, k) { BLOBS.push([x, z, w, d, ry || 0, k == null ? 0.55 : k, YOFF, ZONE]); }
  // box with its bottom at y
  function box(mat, w, h, d, x, y, z, ry, layer, rx, rz) { addGeo(mat, UNIT.box, mat4(x, y + h / 2, z, ry || 0, w, h, d, rx, rz), layer); }
  // box centred at y
  function boxC(mat, w, h, d, x, y, z, ry, layer, rx, rz) { addGeo(mat, UNIT.box, mat4(x, y, z, ry || 0, w, h, d, rx, rz), layer); }
  function cyl(mat, r, h, x, y, z, seg, layer, rx, rz, ry) { addGeo(mat, unitCyl(seg || 16), mat4(x, y + (rx || rz ? 0 : h / 2), z, ry || 0, r * 2, h, r * 2, rx, rz), layer); }
  function cylC(mat, r, h, x, y, z, seg, layer, rx, rz, ry) { addGeo(mat, unitCyl(seg || 16), mat4(x, y, z, ry || 0, r * 2, h, r * 2, rx, rz), layer); }
  function sph(mat, r, x, y, z, seg, layer, sx, sy, sz) { addGeo(mat, unitSph(seg || 12), mat4(x, y, z, 0, r * 2 * (sx || 1), r * 2 * (sy || 1), r * 2 * (sz || 1)), layer); }
  function geoAt(mat, geo, x, y, z, ry, layer, rx, rz, s) { addGeo(mat, geo, mat4(x, y, z, ry || 0, s || 1, s || 1, s || 1, rx, rz), layer); }

  // A local frame: position + yaw, so furniture can be written in its own coordinates
  function F(x, z, ry, y) { this.x = x; this.z = z; this.ry = ry || 0; this.y = y || 0; this.c = Math.cos(this.ry); this.s = Math.sin(this.ry); }
  F.prototype.wx = function (lx, lz) { return this.x + lx * this.c + lz * this.s; };
  F.prototype.wz = function (lx, lz) { return this.z - lx * this.s + lz * this.c; };
  F.prototype.box = function (mat, w, h, d, lx, ly, lz, lry, layer, rx, rz) { box(mat, w, h, d, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), this.ry + (lry || 0), layer, rx, rz); return this; };
  F.prototype.boxC = function (mat, w, h, d, lx, ly, lz, lry, layer, rx, rz) { boxC(mat, w, h, d, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), this.ry + (lry || 0), layer, rx, rz); return this; };
  F.prototype.cyl = function (mat, r, h, lx, ly, lz, seg, layer) { cyl(mat, r, h, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), seg, layer); return this; };
  F.prototype.cylH = function (mat, r, h, lx, ly, lz, seg, alongX) { // horizontal cylinder
    cylC(mat, r, h, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), seg, null, alongX ? 0 : Math.PI / 2, alongX ? Math.PI / 2 : 0, this.ry); return this; };
  F.prototype.sph = function (mat, r, lx, ly, lz, seg, sx, sy, sz) { sph(mat, r, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), seg, null, sx, sy, sz); return this; };
  F.prototype.geo = function (mat, geo, lx, ly, lz, lry, layer, rx, rz, s) { geoAt(mat, geo, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), this.ry + (lry || 0), layer, rx, rz, s); return this; };
  F.prototype.rbox = function (mat, w, h, d, lx, ly, lz, r, lry, layer, rx, rz) { rbox(mat, w, h, d, this.wx(lx, lz), this.y + ly, this.wz(lx, lz), this.ry + (lry || 0), r, layer, rx, rz); return this; };
  F.prototype.blob = function (w, d, lx, lz, k) { blob(this.wx(lx, lz), this.wz(lx, lz), w, d, this.ry, k); return this; };

  function mergeInto(list, material, layer, castShadow, receiveShadow, group) {
    var chunk = [], nv = 0, meshes = [];
    function flush() {
      if (!chunk.length) return;
      var ni = 0, tv = 0, i;
      for (i = 0; i < chunk.length; i++) { tv += chunk[i].attributes.position.count; ni += chunk[i].index ? chunk[i].index.count : chunk[i].attributes.position.count; }
      var pos = new Float32Array(tv * 3), nor = new Float32Array(tv * 3), uv = new Float32Array(tv * 2), idx = new Uint16Array(ni), vo = 0, io = 0;
      for (i = 0; i < chunk.length; i++) {
        var g = chunk[i], p = g.attributes.position, c = p.count;
        pos.set(p.array, vo * 3);
        if (g.attributes.normal) nor.set(g.attributes.normal.array, vo * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
        if (g.index) { var ia = g.index.array; for (var k = 0; k < ia.length; k++) idx[io + k] = ia[k] + vo; io += ia.length; }
        else { for (var k2 = 0; k2 < c; k2++) idx[io + k2] = vo + k2; io += c; }
        vo += c;
      }
      var out = new THREE.BufferGeometry();
      out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      out.setIndex(new THREE.BufferAttribute(idx, 1));
      out.computeBoundingSphere();
      var mesh = new THREE.Mesh(out, material); mesh.castShadow = castShadow; mesh.receiveShadow = receiveShadow; mesh.userData.layer = layer;
      group.add(mesh); meshes.push(mesh);
      chunk = []; nv = 0;
    }
    for (var i = 0; i < list.length; i++) {
      var c = list[i].attributes.position.count;
      if (nv + c > 60000) flush();
      chunk.push(list[i]); nv += c;
    }
    flush();
    return meshes;
  }
