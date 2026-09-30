  /* ==========================================================================================
     Materials for everything built: one lit shader with sun and shadows, sky light, light
     bounced off the ground, reflections of the sky, glow for lights and haze. Plus a geometry
     builder and the sun shadow map.
     Patterns (uPat): 0 plain, 1 white ceramic shell of the Crown (panel joints, window slots,
     dust), 2 solar panel, 3 sintered pad or road, 4 steel with weld seams, 5 pod skin.
     ========================================================================================== */
  var GLSL_MAT_V = [
    GLSL_COMMON, LOGV_PARS,
    "varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol; varying vec3 vL;",
    "attribute vec3 iCol;",
    "uniform float uHasICol;",
    "void main(){",
    "  vec4 lp = vec4(position, 1.0); vec3 ln = normal;",
    "  #ifdef USE_INSTANCING",
    "  lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;",
    "  #endif",
    "  vec4 w = modelMatrix * lp;",
    "  vW = w.xyz; vN = normalize(mat3(modelMatrix) * ln); vUv = uv; vL = position;",
    "  vCol = vec3(1.0);",
    "  #ifdef USE_COLOR",
    "  vCol = color;",
    "  #endif",
    "  if (uHasICol > 0.5) vCol *= iCol;",
    "  gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0);",
    "  " + LOGV,
    "}"].join("\n");

  var GLSL_MAT_F = [
    GLSL_COMMON, GLSL_SHADOW, LOGF_PARS,
    "uniform vec3 uColor; uniform float uRough; uniform float uMetal; uniform vec3 uEmis; uniform float uPat; uniform float uAlpha;",
    "uniform float uWin; uniform vec3 uWinCol; uniform vec4 uWinRows; uniform float uAmbK;",
    "varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol; varying vec3 vL;",
    "float lineAA(float x, float w){ float d = abs(fract(x) - 0.5) * 2.0; float fw = fwidth(x) * 2.0 + 1e-4; return 1.0 - smoothstep(1.0 - w - fw, 1.0 - w, d); }",
    "void main(){",
    "  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;",
    "  vec3 v = normalize(uCam - vW); float dist = length(uCam - vW);",
    "  vec3 alb = uColor * vCol; float rough = uRough, metal = uMetal; vec3 emis = uEmis; float ao = 1.0;",
    "  float fadeD = 1.0 - smoothstep(300.0, 2500.0, dist);",
    // 1: the Crown's shell of white sintered regolith. uv = (arc length, height) in metres.
    "  if (uPat > 0.5 && uPat < 1.5){",
    "    float vert = 1.0 - smoothstep(0.3, 0.6, abs(n.y));",
    "    float jh = lineAA(vUv.y / 2.4, 0.035), jv = lineAA(vUv.x / 3.6 + floor(vUv.y / 2.4) * 0.5, 0.03);",
    "    float joint = max(jh, jv) * fadeD;",
    "    float tone = 0.94 + 0.06 * vnoise(vec2(floor(vUv.x / 3.6 + floor(vUv.y / 2.4) * 0.5), floor(vUv.y / 2.4)) * 1.37);",
    "    alb *= tone * (1.0 - 0.22 * joint);",
    "    vec3 dust = vec3(0.62, 0.44, 0.31);",
    "    float dm = smoothstep(0.35, 0.95, n.y) * (0.55 + 0.25 * vnoise(vW.xz / 3.0));",
    "    dm = max(dm, vert * (1.0 - smoothstep(0.0, 5.0, vUv.y - 40.0)) * 0.35 * (0.6 + 0.4 * vnoise(vec2(vUv.x / 1.3, 0.0))));",
    "    dm = max(dm, vert * 0.16 * smoothstep(0.2, 0.9, vnoise(vec2(vUv.x / 0.9, vUv.y / 14.0))));",
    "    alb = mix(alb, alb * dust * 1.25, dm);",
    "    rough = mix(rough, 0.9, dm);",
    // window slots, 1.2 m tall, set 3 m deep: dark glass in a deep reveal, warm light inside after sunset
    "    if (uWin > 0.5 && vert > 0.5){",
    "      float sl = 0.0; float y = vUv.y;",
    "      float inRow1 = step(uWinRows.x, y) * step(y, uWinRows.x + uWinRows.z);",
    "      float inRow2 = step(uWinRows.y, y) * step(y, uWinRows.y + uWinRows.z) * step(1.5, uWin);",
    "      float mull = step(0.18, fract(vUv.x / uWinRows.w));",
    "      sl = max(inRow1, inRow2) * mull;",
    "      if (sl > 0.5){",
    "        float yy = inRow1 > 0.5 ? (y - uWinRows.x) / uWinRows.z : (y - uWinRows.y) / uWinRows.z;",
    "        float vis = clamp(1.0 - abs(dot(v, vec3(0.0, 1.0, 0.0))) * 2.2, 0.0, 1.0);",
    "        alb = vec3(0.03, 0.035, 0.04); rough = 0.08; metal = 0.0; ao = 0.35;",
    "        float glow = (0.55 + 0.45 * smoothstep(0.0, 0.8, yy)) * vis * (0.8 + 0.2 * vnoise(vec2(vUv.x / 7.0, 3.0)));",
    "        emis += uWinCol * glow;",
    "      }",
    "    }",
    "  }",
    // 2: solar panel: dark blue cells in an aluminium frame
    "  else if (uPat > 1.5 && uPat < 2.5){",
    "    float cell = max(lineAA(vUv.x * 12.0, 0.08), lineAA(vUv.y * 6.0, 0.08));",
    "    float frame = 1.0 - step(0.02, vUv.x) * step(vUv.x, 0.98) * step(0.03, vUv.y) * step(vUv.y, 0.97);",
    "    alb = mix(vec3(0.020, 0.028, 0.055), vec3(0.28, 0.29, 0.30), max(cell * 0.35 * fadeD, frame));",
    "    rough = mix(0.12, 0.5, max(cell, frame)); metal = frame * 0.8;",
    "    alb = mix(alb, vec3(0.45, 0.31, 0.22), 0.25 * smoothstep(0.0, 1.0, vnoise(vW.xz / 9.0)));",
    "  }",
    // 3: sintered regolith pads and roads: slabs with joints, burn marks
    "  else if (uPat > 2.5 && uPat < 3.5){",
    "    float slab = max(lineAA(vW.x / 6.0, 0.02), lineAA(vW.z / 6.0, 0.02)) * fadeD;",
    "    alb *= (0.92 + 0.08 * vnoise(floor(vW.xz / 6.0) * 1.7)) * (1.0 - 0.18 * slab);",
    "    float burn = vCol.r < 0.99 ? 0.0 : 0.0;",
    "    alb *= 0.85 + 0.15 * vnoise(vW.xz / 17.0);",
    "  }",
    // 4: stainless steel: panels with weld seams, soft streaks
    "  else if (uPat > 3.5 && uPat < 4.5){",
    "    float seam = max(lineAA(vUv.y / 1.8, 0.02), lineAA(vUv.x * 8.0, 0.015)) * fadeD;",
    "    alb *= 1.0 - 0.25 * seam;",
    "    rough = clamp(rough + 0.12 * vnoise(vec2(vUv.x * 30.0, vUv.y / 3.0)), 0.05, 1.0);",
    "  }",
    // 5: the pod's skin: white ceramic with fine panel lines and a titanium band
    "  else if (uPat > 4.5 && uPat < 5.5){",
    "    float pl = max(lineAA(vL.x / 1.5, 0.02), lineAA(vL.z / 1.1 + 0.25, 0.02)) * (1.0 - smoothstep(20.0, 120.0, dist));",
    "    alb *= 1.0 - 0.3 * pl;",
    "  }",
    // 6: white ceramic panels on boxes, in world coordinates
    "  else if (uPat > 5.5 && uPat < 6.5){",
    "    float up = smoothstep(0.5, 0.9, abs(n.y));",
    "    float hx = mix(vW.x + vW.z, vW.x, up), hy = mix(vW.y, vW.z, up);",
    "    float joint = max(lineAA(hy / 2.4, 0.035), lineAA(hx / 3.6 + floor(hy / 2.4) * 0.5, 0.03)) * fadeD;",
    "    alb *= (0.95 + 0.05 * vnoise(vec2(floor(hx / 3.6), floor(hy / 2.4)) * 1.37)) * (1.0 - 0.2 * joint);",
    "    float dm = smoothstep(0.35, 0.95, n.y) * (0.5 + 0.3 * vnoise(vW.xz / 3.0));",
    "    alb = mix(alb, alb * vec3(0.62, 0.44, 0.31) * 1.25, dm); rough = mix(rough, 0.9, dm);",
    "  }",
    "  float sh = shadowAt(vW + n * 0.06, 0.0012);",
    "  float ndl = max(dot(n, uSunDir), 0.0);",
    "  vec3 amb = mix(uAmbHor, uAmbUp, n.y * 0.5 + 0.5) * (0.55 + 0.45 * n.y * n.y + 0.3 * (1.0 - abs(n.y)));",
    // light bounced off the red ground onto surfaces that face down or sideways
    "  vec3 bounce = vec3(0.30, 0.19, 0.13) * (uSunCol * max(uSunDir.y, 0.0) * 1.2 + uAmbUp * 0.9) * clamp(0.5 - 0.5 * n.y, 0.0, 1.0);",
    "  vec3 diff = alb * (1.0 - metal) * (uSunCol * ndl * sh + (amb + bounce) * ao * uAmbK);",
    "  vec3 h = normalize(uSunDir + v); float ndh = max(dot(n, h), 0.0), ndv = max(dot(n, v), 1e-3), vdh = max(dot(v, h), 0.0);",
    "  float a = max(rough * rough, 0.002), a2 = a * a; float dd = ndh * ndh * (a2 - 1.0) + 1.0; float D = a2 / (3.14159 * dd * dd);",
    "  float k = a * 0.5; float G = ndl / (ndl * (1.0 - k) + k) * ndv / (ndv * (1.0 - k) + k);",
    "  vec3 f0 = mix(vec3(0.04), alb, metal);",
    "  vec3 F = f0 + (1.0 - f0) * pow(1.0 - vdh, 5.0);",
    "  vec3 spec = D * G * F / max(4.0 * ndv, 1e-3) * uSunCol * sh;",
    "  vec3 r = reflect(-v, n);",
    "  vec3 grd = vec3(0.30, 0.19, 0.13) * (uSunCol * max(uSunDir.y, 0.0) + uAmbUp) * 0.5;",
    "  vec3 env = r.y > 0.0 ? skyColor(r) : mix(skyColor(normalize(vec3(r.x, 0.02, r.z))), grd, smoothstep(0.0, -0.12, r.y));",
    "  env = mix(env, amb * 1.1, clamp(rough * 1.3, 0.0, 1.0));",
    "  vec3 Fe = f0 + (max(vec3(1.0 - rough), f0) - f0) * pow(1.0 - ndv, 5.0);",
    "  vec3 col = diff + spec + env * Fe * ao * uAmbK + emis * (uPat > 4.5 && uPat < 6.5 ? alb * 1.6 : vec3(1.0));",
    "  col = haze(col, vW);",
    "  gl_FragColor = vec4(col, uAlpha);",
    "  " + LOGF,
    "}"].join("\n");

  var MAT = {
    list: [],
    make: function (o) {
      o = o || {};
      var u = sharedUniforms({
        uColor: { value: new THREE.Color(o.color !== undefined ? o.color : 0xcccccc) },
        uRough: { value: o.rough !== undefined ? o.rough : 0.6 }, uMetal: { value: o.metal || 0 },
        uEmis: { value: o.emis ? new THREE.Vector3().fromArray(o.emis) : new THREE.Vector3() },
        uPat: { value: o.pat || 0 }, uAlpha: { value: o.alpha !== undefined ? o.alpha : 1 },
        uWin: { value: o.win || 0 }, uWinCol: o.winCol || MAT.winCol, uHasICol: { value: o.icol ? 1 : 0 },
        uWinRows: { value: new THREE.Vector4().fromArray(o.rows || [44, 55, 1.2, 4.2]) }, uAmbK: { value: o.ambK !== undefined ? o.ambK : 1 }
      });
      // three.js keeps sRGB colours in hex; the shader works in linear light
      u.uColor.value.convertSRGBToLinear();
      var m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: GLSL_MAT_V, fragmentShader: GLSL_MAT_F, vertexColors: !!o.vcol, side: o.side || THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite !== undefined ? o.depthWrite : true, extensions: { derivatives: true } });
      MAT.list.push(m);
      return m;
    },
    winCol: { value: new THREE.Vector3(0.9, 0.55, 0.28) }
  };

  // glowing things that are not lit: lamps, flames, screens. Additive, drawn after everything.
  function glowMat(col, o) {
    o = o || {};
    return new THREE.ShaderMaterial({
      uniforms: sharedUniforms({ uGlow: { value: new THREE.Vector3().fromArray(col) }, uSoft: { value: o.soft || 0 } }),
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec3 vN; varying vec3 vW; void main(){ vec4 lp = vec4(position, 1.0);\n#ifdef USE_INSTANCING\nlp = instanceMatrix * lp;\n#endif\n vec4 w = modelMatrix * lp; vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform vec3 uGlow; uniform float uSoft; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(uCam - vW); float f = uSoft > 0.0 ? pow(abs(dot(normalize(vN), v)), uSoft) : 1.0; float T = exp(-length(vW - uCam) * uHazeDen * (1.0 + uStorm * 80.0)); gl_FragColor = vec4(uGlow * f * T, 1.0); " + LOGF + " }",
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: o.side || THREE.FrontSide
    });
  }

  /* ------------------------------------------------------------------ geometry builder */
  function GB() { this.p = []; this.n = []; this.uv = []; this.c = []; }
  GB.prototype = {
    v: function (p, n, uv, c) { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.uv.push(uv ? uv[0] : 0, uv ? uv[1] : 0); var cc = c || [1, 1, 1]; this.c.push(cc[0], cc[1], cc[2]); },
    // quad a b c d counter-clockwise seen from the front, with per-corner normals (or one for all)
    quad: function (a, b, c, d, na, nb, nc, nd, ua, ub, uc, ud, col) {
      nb = nb || na; nc = nc || na; nd = nd || na;
      this.v(a, na, ua, col); this.v(b, nb, ub, col); this.v(c, nc, uc, col);
      this.v(a, na, ua, col); this.v(c, nc, uc, col); this.v(d, nd, ud, col);
    },
    tri: function (a, b, c, na, nb, nc, ua, ub, uc, col) { this.v(a, na, ua, col); this.v(b, nb || na, ub, col); this.v(c, nc || na, uc, col); },
    // add an existing three.js geometry, transformed by a matrix
    add: function (g, m, col) {
      var gg = g.index ? g.toNonIndexed() : g, P = gg.attributes.position, N = gg.attributes.normal, UV = gg.attributes.uv;
      var nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3(), nv = new THREE.Vector3();
      for (var i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m); nv.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
        this.v([v.x, v.y, v.z], [nv.x, nv.y, nv.z], UV ? [UV.getX(i), UV.getY(i)] : null, col);
      }
      return this;
    },
    build: function () {
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
      g.computeBoundingSphere();
      return g;
    }
  };
  // a solid of revolution around y from a profile [[r, y], ...], with smooth normals; uv = (arc length, y)
  function lathe(gb, prof, seg, cx, cy, cz, a0, a1, col) {
    a0 = a0 || 0; a1 = a1 === undefined ? Math.PI * 2 : a1;
    var nrm = [];
    for (var i = 0; i < prof.length; i++) {
      var p0 = prof[Math.max(0, i - 1)], p1 = prof[Math.min(prof.length - 1, i + 1)];
      var dr = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dr, dy) || 1;
      nrm.push([dy / L, -dr / L]);
    }
    for (var s = 0; s < seg; s++) {
      var t0 = a0 + (a1 - a0) * s / seg, t1 = a0 + (a1 - a0) * (s + 1) / seg;
      var c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      for (var j = 0; j < prof.length - 1; j++) {
        var A = prof[j], B = prof[j + 1], nA = nrm[j], nB = nrm[j + 1];
        if (A[0] < 1e-6 && B[0] < 1e-6) continue;
        gb.quad([cx + A[0] * s0, cy + A[1], cz + A[0] * c0], [cx + A[0] * s1, cy + A[1], cz + A[0] * c1], [cx + B[0] * s1, cy + B[1], cz + B[0] * c1], [cx + B[0] * s0, cy + B[1], cz + B[0] * c0],
          [nA[0] * s0, nA[1], nA[0] * c0], [nA[0] * s1, nA[1], nA[0] * c1], [nB[0] * s1, nB[1], nB[0] * c1], [nB[0] * s0, nB[1], nB[0] * c0],
          [A[0] * t0, A[1]], [A[0] * t1, A[1]], [B[0] * t1, B[1]], [B[0] * t0, B[1]], col);
      }
    }
    return gb;
  }
  function boxAt(gb, x, y, z, sx, sy, sz, ry, col) {
    var m = new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z).multiply(new THREE.Matrix4().makeScale(sx, sy, sz));
    return gb.add(BOXG, m, col);
  }
  var BOXG = new THREE.BoxGeometry(1, 1, 1);
  var CYLG = new THREE.CylinderGeometry(1, 1, 1, 20, 1), SPHG = new THREE.SphereGeometry(1, 40, 24);

  /* ------------------------------------------------------------------ the sun's shadow map */
  var SHADOW = (function () {
    var size = MOBILE ? 1024 : 2048;
    var rt = new THREE.WebGLRenderTarget(size, size, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, stencilBuffer: false });
    var cam = new THREE.OrthographicCamera(-200, 200, 200, -200, 1, 20000);
    cam.layers.set(1);
    var depth = new THREE.ShaderMaterial({
      vertexShader: "\n#include <common>\nvarying vec2 vZW; void main(){ vec4 lp = vec4(position, 1.0);\n#ifdef USE_INSTANCING\nlp = instanceMatrix * lp;\n#endif\n gl_Position = projectionMatrix * viewMatrix * modelMatrix * lp; vZW = gl_Position.zw; }",
      fragmentShader: "\n#include <packing>\nvarying vec2 vZW; void main(){ gl_FragColor = packDepthToRGBA(0.5 * vZW.x / vZW.y + 0.5); }",
      side: THREE.DoubleSide
    });
    U.uShadowMap.value = rt.texture; U.uShadowTx.value = 1 / size;
    var focus = new THREE.Vector3(), half = 200, bias = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    function caster(obj) { obj.traverse(function (o) { o.layers.enable(1); }); }
    function render() {
      if (!U.uShadowOn.value) return;
      var d = U.uSunDir.value;
      cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = 12000;
      cam.position.copy(focus).addScaledVector(d, 6000); cam.up.set(0, 1, 0); if (Math.abs(d.y) > 0.99) cam.up.set(0, 0, 1);
      cam.lookAt(focus); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      var bg = scene.overrideMaterial; scene.overrideMaterial = depth;
      renderer.setRenderTarget(rt); renderer.setClearColor(0xffffff, 1); renderer.clear(true, true, false);
      renderer.render(scene, cam);
      scene.overrideMaterial = bg;
      U.uShadowMat.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    }
    return { rt: rt, cam: cam, caster: caster, render: render, set: function (x, y, z, h) { focus.set(x, y, z); half = h; } };
  })();
