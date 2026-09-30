  /* ==========================================================================================
     The Crown · demo 2 of Mars Campus. Core: renderer, shared uniforms, shader chunks, HDR post.
     World units are metres. x = east, z = south, y = up. The Crown's centre is the origin;
     Arcadia Spaceport's terminal is at x = 30 000. All vertex shaders bend the world with the
     curvature of Mars (radius 3 389.5 km) around the camera, so the horizon is where it really is.
     ========================================================================================== */
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  var DEBUG = !!window.__crownDebug;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function fract(x) { return x - Math.floor(x); }

  var canvas = document.getElementById("view");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, logarithmicDepthBuffer: true, powerPreference: "high-performance", preserveDrawingBuffer: DEBUG });
  renderer.autoClear = false;
  renderer.outputEncoding = THREE.LinearEncoding;
  var GL2 = renderer.capabilities.isWebGL2;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.3, 260000);
  var cockpitScene = new THREE.Scene(), cockpitCam = new THREE.PerspectiveCamera(55, 16 / 9, 0.02, 40);

  /* ------------------------------------------------------------------ shared uniforms */
  var U = {
    uCam: { value: new THREE.Vector3() }, uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() }, uSunCol: { value: new THREE.Vector3(3, 2.6, 2.2) }, uSunEl: { value: 0.15 },
    uAmbUp: { value: new THREE.Vector3(0.3, 0.22, 0.16) }, uAmbHor: { value: new THREE.Vector3(0.5, 0.36, 0.25) },
    uStorm: { value: 0 }, uHazeDen: { value: 1 / 12000 }, uPhobos: { value: new THREE.Vector2(9, 9) }, uNight: { value: 0 },
    uShadowMat: { value: new THREE.Matrix4() }, uShadowMap: { value: null }, uShadowOn: { value: 0 }, uShadowTx: { value: 1 / 2048 },
    uEnv: { value: null }, uDusk: { value: 0 }
  };

  /* ------------------------------------------------------------------ shader chunks */
  var GLSL_COMMON = [
    "uniform vec3 uCam; uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunEl;",
    "uniform vec3 uAmbUp; uniform vec3 uAmbHor; uniform float uStorm; uniform float uHazeDen; uniform vec2 uPhobos; uniform float uNight; uniform float uDusk;",
    "const float CURV = 1.4751e-7;",
    "vec3 curveW(vec3 w){ vec2 d = w.xz - uCam.xz; w.y -= dot(d, d) * CURV; return w; }",
    "float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }",
    "vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }",
    "float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);",
    "  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0)), c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0; }",
    "float fbm4(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; } return s; }",
    // the Mars sky: butterscotch by day, grey-brown with a blue glow round the sun at sunset
    "vec3 skyColor(vec3 v){",
    "  float e = uSunEl, vy = clamp(v.y, -0.3, 1.0), mu = dot(v, uSunDir);",
    "  float day = smoothstep(-0.10, 0.30, e), low = 1.0 - smoothstep(0.03, 0.40, e);",
    "  vec3 zen = mix(vec3(0.11, 0.075, 0.060), vec3(0.40, 0.285, 0.19), day);",
    "  vec3 hor = mix(vec3(0.33, 0.20, 0.13), vec3(0.78, 0.56, 0.38), day);",
    "  float hg = pow(1.0 - max(vy, 0.0), 3.2);",
    "  vec3 c = mix(zen, hor, hg);",
    "  c *= mix(1.0, (0.28 + 0.72 * (0.5 + 0.5 * mu)) * 0.62, low);",
    "  float th = acos(clamp(mu, -1.0, 1.0));",
    "  vec3 blue = vec3(0.40, 0.60, 0.98);",
    "  float halo = 2.8 * exp(-th / 0.04) + 0.85 * exp(-th / 0.15) + 0.16 * exp(-th / 0.5);",
    "  c += blue * halo * mix(0.30, 1.0, low) * smoothstep(-0.14, 0.02, e);",
    "  vec2 hv = normalize(v.xz + 1e-5), hs = normalize(uSunDir.xz + 1e-5);",
    "  float az = max(0.0, dot(hv, hs));",
    "  c += vec3(0.60, 0.38, 0.22) * pow(az, 5.0) * exp(-max(vy, 0.0) * 10.0) * low * 0.75;",
    "  c *= mix(0.035, 1.0, smoothstep(-0.16, 0.10, e));",
    "  vec3 st = vec3(0.20, 0.085, 0.040) * (0.35 + 0.65 * day) * (0.6 + 0.4 * exp(-th / 0.5));",
    "  c = mix(c, st, uStorm);",
    "  return c * 1.7;",
    "}",
    // aerial haze: fine dust everywhere, thick inside the storm
    "vec3 haze(vec3 col, vec3 w){",
    "  vec3 d = w - uCam; float dist = length(d); vec3 v = d / max(dist, 1e-3);",
    "  float den = uHazeDen * (1.0 + uStorm * 80.0);",
    "  float T = exp(-dist * den);",
    "  vec3 sc = skyColor(normalize(vec3(v.x, max(v.y, 0.0) * 0.4 + 0.015, v.z)));",
    "  return col * T + sc * (1.0 - T);",
    "}"
  ].join("\n");

  // log-depth hooks for hand-written shaders
  var LOGV_PARS = "\n#include <common>\n#include <logdepthbuf_pars_vertex>\n", LOGV = "\n#include <logdepthbuf_vertex>\n";
  var LOGF_PARS = "\n#include <logdepthbuf_pars_fragment>\n", LOGF = "\n#include <logdepthbuf_fragment>\n";

  // sun shadow map sampling, shared by the terrain and the buildings
  var GLSL_SHADOW = [
    "uniform mat4 uShadowMat; uniform sampler2D uShadowMap; uniform float uShadowOn; uniform float uShadowTx;",
    "float unpackD(vec4 c){ return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }",
    "float shadowAt(vec3 w, float bias){",
    "  if (uShadowOn < 0.5) return 1.0;",
    "  vec4 s = uShadowMat * vec4(w, 1.0); vec3 q = s.xyz / s.w * 0.5 + 0.5;",
    "  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0 || q.z > 1.0) return 1.0;",
    "  float lit = 0.0;",
    "  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++){",
    "    float d = unpackD(texture2D(uShadowMap, q.xy + vec2(float(i), float(j)) * uShadowTx * 1.2));",
    "    lit += step(q.z - bias, d);",
    "  }",
    "  return lit / 9.0;",
    "}"
  ].join("\n");

  /* ------------------------------------------------------------------ the same sky in JS (for ambient light and fog colour) */
  var SKY = {
    color: function (v, out) {
      var e = U.uSunEl.value, s = U.uSunDir.value, vy = clamp(v.y, -0.3, 1), mu = v.x * s.x + v.y * s.y + v.z * s.z;
      var day = smooth(-0.10, 0.30, e), low = 1 - smooth(0.03, 0.40, e);
      var zr = lerp(0.11, 0.40, day), zg = lerp(0.075, 0.285, day), zb = lerp(0.060, 0.19, day);
      var hr = lerp(0.33, 0.78, day), hgc = lerp(0.20, 0.56, day), hb = lerp(0.13, 0.38, day);
      var hg = Math.pow(1 - Math.max(vy, 0), 3.2);
      var r = lerp(zr, hr, hg), g = lerp(zg, hgc, hg), b = lerp(zb, hb, hg);
      var k = lerp(1, (0.28 + 0.72 * (0.5 + 0.5 * mu)) * 0.62, low); r *= k; g *= k; b *= k;
      var th = Math.acos(clamp(mu, -1, 1));
      var halo = (2.8 * Math.exp(-th / 0.04) + 0.85 * Math.exp(-th / 0.15) + 0.16 * Math.exp(-th / 0.5)) * lerp(0.30, 1, low) * smooth(-0.14, 0.02, e);
      r += 0.40 * halo; g += 0.60 * halo; b += 0.98 * halo;
      var bright = lerp(0.035, 1, smooth(-0.16, 0.10, e));
      r *= bright; g *= bright; b *= bright;
      var st = U.uStorm.value, sd = 0.35 + 0.65 * day, sk = 0.6 + 0.4 * Math.exp(-th / 0.5);
      r = lerp(r, 0.20 * sd * sk, st); g = lerp(g, 0.085 * sd * sk, st); b = lerp(b, 0.040 * sd * sk, st);
      out.set(r * 1.7, g * 1.7, b * 1.7); return out;
    }
  };

  /* ------------------------------------------------------------------ HDR pipeline: scene -> bloom -> ACES composite */
  var POST = (function () {
    var type = THREE.HalfFloatType, msaa = GL2 && !MOBILE;
    var opts = { type: type, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false };
    var rt = msaa ? new THREE.WebGLMultisampleRenderTarget(4, 4, opts) : new THREE.WebGLRenderTarget(4, 4, opts); if (msaa) rt.samples = 4;
    var bopt = { type: type, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    var N = 5, mips = [], tmps = [];
    for (var i = 0; i < N; i++) { mips.push(new THREE.WebGLRenderTarget(4, 4, bopt)); tmps.push(new THREE.WebGLRenderTarget(4, 4, bopt)); }
    var ocam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; qs.add(quad);
    var VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    function mat(fs, uni) { return new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false }); }
    var bright = mat("uniform sampler2D t; uniform float uTh; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float s = c.r + c.g + c.b; if (!(s >= 0.0 && s < 1e5)) c = vec3(0.0); c = clamp(c, 0.0, 80.0); float l = max(max(c.r, c.g), c.b); float k = max(l - uTh, 0.0); k = k * k / (k + 0.8); gl_FragColor = vec4(c * (k / max(l, 1e-4)), 1.0); }", { t: { value: null }, uTh: { value: 1.4 } });
    var down = mat("uniform sampler2D t; uniform vec2 uTx; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv + uTx * vec2(-1.0, -1.0)).rgb + texture2D(t, vUv + uTx * vec2(1.0, -1.0)).rgb + texture2D(t, vUv + uTx * vec2(-1.0, 1.0)).rgb + texture2D(t, vUv + uTx * vec2(1.0, 1.0)).rgb; gl_FragColor = vec4(c * 0.25, 1.0); }", { t: { value: null }, uTx: { value: new THREE.Vector2() } });
    var blur = mat("uniform sampler2D t; uniform vec2 uD; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb * 0.2270270; c += (texture2D(t, vUv + uD * 1.3846154).rgb + texture2D(t, vUv - uD * 1.3846154).rgb) * 0.3162162; c += (texture2D(t, vUv + uD * 3.2307692).rgb + texture2D(t, vUv - uD * 3.2307692).rgb) * 0.0702703; gl_FragColor = vec4(c, 1.0); }", { t: { value: null }, uD: { value: new THREE.Vector2() } });
    var cu = { tS: { value: null }, uBloom: { value: 0.55 }, uExp: { value: 1 }, uTime: { value: 0 }, uGrain: { value: 0.028 }, uVig: { value: 0.30 }, uFade: { value: 0 }, uFlash: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) } };
    for (var b = 0; b < N; b++) cu["tB" + b] = { value: null };
    var comp = mat([
      "uniform sampler2D tS, tB0, tB1, tB2, tB3, tB4; uniform float uBloom, uExp, uTime, uGrain, uVig, uFade, uFlash; uniform vec3 uTint; varying vec2 vUv;",
      "vec3 fit(vec3 v){ return (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081); }",
      "vec3 aces(vec3 c){ const mat3 I = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777); const mat3 O = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602); return clamp(O * fit(I * c), 0.0, 1.0); }",
      "vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }",
      "float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
      "void main(){",
      "  vec3 c = texture2D(tS, vUv).rgb; float s = c.r + c.g + c.b; if (!(s >= -1.0 && s < 1e6)) c = vec3(0.0); c = max(c, 0.0);",
      "  vec3 bl = texture2D(tB0, vUv).rgb * 0.30 + texture2D(tB1, vUv).rgb * 0.28 + texture2D(tB2, vUv).rgb * 0.22 + texture2D(tB3, vUv).rgb * 0.18 + texture2D(tB4, vUv).rgb * 0.16;",
      "  c = (c + bl * uBloom) * uExp * uTint + vec3(0.75, 0.85, 1.0) * uFlash;",
      "  vec3 a = aces(c); float m = max(max(c.r, c.g), c.b); vec3 hp = aces(vec3(m)) * c / max(m, 1e-4);",
      "  c = mix(a, hp, 0.3);",
      "  vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q, q) * 2.2;",
      "  c = srgb(clamp(c, 0.0, 1.0));",
      "  c += (h(vUv * 1000.0 + uTime) - 0.5) * uGrain * (1.0 - c * 0.6);",
      "  c += (h(vUv * 731.0 - uTime * 0.7) - 0.5) / 255.0;",
      "  gl_FragColor = vec4(c * (1.0 - uFade), 1.0);",
      "}"].join("\n"), cu);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qs, ocam); }
    function setSize(w, h) {
      rt.setSize(w, h);
      var bw = Math.max(2, w >> 1), bh = Math.max(2, h >> 1);
      for (var i = 0; i < N; i++) { mips[i].setSize(Math.max(2, bw >> i), Math.max(2, bh >> i)); tmps[i].setSize(Math.max(2, bw >> i), Math.max(2, bh >> i)); }
    }
    function bloom(src) {
      bright.uniforms.t.value = src; pass(bright, mips[0]);
      for (var i = 0; i < N; i++) {
        if (i > 0) { down.uniforms.t.value = mips[i - 1].texture; down.uniforms.uTx.value.set(0.5 / mips[i - 1].width, 0.5 / mips[i - 1].height); pass(down, mips[i]); }
        blur.uniforms.t.value = mips[i].texture; blur.uniforms.uD.value.set(1 / mips[i].width, 0); pass(blur, tmps[i]);
        blur.uniforms.t.value = tmps[i].texture; blur.uniforms.uD.value.set(0, 1 / mips[i].height); pass(blur, mips[i]);
      }
    }
    function render(t, withCockpit) {
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
      renderer.render(scene, camera);
      if (withCockpit) { renderer.clearDepth(); renderer.render(cockpitScene, cockpitCam); }
      bloom(rt.texture);
      cu.tS.value = rt.texture; for (var i = 0; i < N; i++) cu["tB" + i].value = mips[i].texture;
      cu.uTime.value = (t || 0) % 100;
      pass(comp, null);
    }
    return { setSize: setSize, render: render, u: cu };
  })();

  /* ------------------------------------------------------------------ sizing, with a resolution scale that follows the frame rate */
  var VIEW = { w: 1, h: 1, scale: MOBILE ? 0.8 : 1, maxDpr: MOBILE ? 1.5 : 1.6 };
  function resize() {
    var w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, VIEW.maxDpr) * VIEW.scale;
    VIEW.w = w; VIEW.h = h;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    POST.setSize(Math.max(2, Math.round(w * dpr)), Math.max(2, Math.round(h * dpr)));
    camera.aspect = cockpitCam.aspect = w / h; camera.updateProjectionMatrix(); cockpitCam.updateProjectionMatrix();
    if (window.FXC) FXC.resize();
  }
  window.addEventListener("resize", resize);

  /* ------------------------------------------------------------------ helpers for materials */
  function sharedUniforms(extra) { var u = {}; for (var k in U) u[k] = U[k]; if (extra) for (var e in extra) u[e] = extra[e]; return u; }
