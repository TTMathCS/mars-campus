  /* ===================== Glass, reflections captured from the scene, material instances ===================== */
  // Clear glass: the dome, the wing facades and the sliding doors. It reflects the captured surroundings and lets
  // the real interior show through; drawn after everything solid.
  var GLASS_VS = [
    "attribute vec2 aFac; attribute vec2 aFac2;",
    "varying vec3 vW; varying vec3 vN; varying vec2 vS; varying vec2 vK;",
    "void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vS = aFac; vK = aFac2; gl_Position = projectionMatrix * viewMatrix * wp; }"
  ].join("\n");
  var GLASS_FS = [
    SKY_GLSL, NOISE_GLSL, HAZE_GLSL, LIGHT_GLSL, MAT_COMMON,
    "uniform vec4 uPortal, uLinkA; uniform vec3 uDustC;",
    "varying vec3 vW; varying vec3 vN; varying vec2 vS; varying vec2 vK;",   // dome: vS = spiral coords, vK = (phi 0..1, 0); facades: vK = (height above floor, 1); doors: (.., 2)
    "void main(){",
    "  vec3 nO = normalize(vN);",
    "  vec3 V = vW - cameraPosition; float dist = length(V); vec3 vd = V / max(dist, 1e-3);",
    "  if (vK.y < 0.5) {",                                                // openings in the dome for the entrance vault and the two glass links
    "    vec2 q = vW.xz - uPalA.xy; float lat = q.x * uPalA.w - q.y * uPalA.z, rad = dot(q, uPalA.zw), hy = vW.y - uPalB.x, al = abs(lat);",
    "    if (rad > 20.0 && al < uPortal.x) { float s = lat / uPortal.x; if (hy < uPortal.y * pow(max(1.0 - s * s, 0.0), 0.55)) discard; }",
    "    float sl = al * 0.34202 + rad * 0.93969, ll = al * 0.93969 - rad * 0.34202;",
    "    if (sl > 20.0 && abs(ll) < uLinkA.x) { float s = ll / uLinkA.x; if (hy < uLinkA.z + (uLinkA.y - uLinkA.z) * sqrt(max(1.0 - s * s, 0.0))) discard; }",
    "  }",
    "  bool outside = dot(nO, vd) < 0.0; vec3 n = outside ? nO : -nO;",
    "  float cosT = max(dot(-vd, n), 0.0), F = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);",
    "  vec3 R = reflect(vd, n);",
    "  vec3 col; float a;",
    "  float dust = vK.y < 0.5 ? 1.0 - smoothstep(0.0, 0.2, vK.x) : 1.0 - smoothstep(0.0, 0.45, vK.x);",
    "  dust *= 0.45 + 0.55 * vnoise(vW.xz * 0.6 + vW.y * 1.3);",
    "  if (outside) {",
    "    col = envLook(0.0, vW, R, 0.02) * F + uSunIrr * pow(max(dot(R, uSun), 0.0), 900.0) * 30.0 * F; a = F * 0.85 + 0.06;",
    "    vec3 dcol = uDustC * 0.6 * (uSunIrr * max(dot(n, uSun), 0.0) + ambientAt(n));",
    "    col = mix(col, dcol, dust * 0.45); a = mix(a, 1.0, dust * 0.4);",
    "  } else {",
    "    col = envLook(vK.y < 0.5 ? 1.0 : 2.0, vW, R, 0.03) * F; a = F * 0.7 + 0.035;",
    "  }",
    "  if (vK.y < 0.5) {",                                                // dome mullions: every lattice cell split into four panes
    "    float mull = max(aline(vS.x, 0.5, 0.03), aline(vS.y, 0.5, 0.03)) * (1.0 - smoothstep(0.86, 0.9, vK.x));",
    "    vec3 mc = pow(vec3(0.84, 0.84, 0.82), vec3(2.2)) * 0.6 * (outside ? uSunIrr * max(dot(n, uSun), 0.0) + ambientAt(n) : WARM * 0.12);",
    "    col = mix(col, mc, mull * 0.85); a = mix(a, 1.0, mull * 0.85);",
    "  }",
    "  float hz = hazeAmt(dist) * (1.0 - uPalB.w);",
    "  col = col * (1.0 - hz) + hazeCol(vd) * hz * a;",
    "  gl_FragColor = vec4(enc(col * uExposure), a);",
    "}"
  ].join("\n");
  var matUniforms = Object.assign({}, U, matU);
  var matMat = new THREE.ShaderMaterial({ uniforms: matUniforms, vertexShader: MAT_VS, fragmentShader: MAT_FS, side: THREE.DoubleSide, extensions: { derivatives: true } });
  // same shading for paving laid on the ground, pulled forward so it never flickers with the terrain
  var matDrape = new THREE.ShaderMaterial({ uniforms: matUniforms, vertexShader: MAT_VS, fragmentShader: MAT_FS, side: THREE.DoubleSide, extensions: { derivatives: true }, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  function glassMat(side) {
    return new THREE.ShaderMaterial({ uniforms: matUniforms, vertexShader: GLASS_VS, fragmentShader: GLASS_FS, side: side, transparent: true, depthWrite: false, extensions: { derivatives: true },
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  }
  // terrain depth for the shadow map, with the campus hole cut out
  var cutDepthMat = new THREE.ShaderMaterial({
    uniforms: { uCut: U.uCut, uCutV: U.uCutV }, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vXZ; varying vec2 vZW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vXZ = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; vZW = gl_Position.zw; }",
    fragmentShader: ["#include <packing>", CUT_GLSL, "varying vec2 vXZ; varying vec2 vZW;", "void main(){ if (inCut(vXZ)) discard; gl_FragColor = packDepthToRGBA(0.5 * vZW.x / vZW.y + 0.5); }"].join("\n")
  });

  // Reflections: cube maps captured from inside the rotunda, inside a wing and out in the courtyard.
  // They are re-captured when the sky changes, one at a time so there is no stutter.
  var ENV = { size: MOBILE ? 128 : 256, list: [], queue: [], lastT: -999, dummy: null, ready: false };
  ENV.dummy = new THREE.WebGLCubeRenderTarget(1);
  matU.uEnvIn.value = matU.uEnvOut.value = matU.uEnvW.value = ENV.dummy.texture;
  function makeEnv(name, texU, posU, interior) {
    var rt = new THREE.WebGLCubeRenderTarget(ENV.size, { format: THREE.RGBAFormat, type: THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    var e = { name: name, rt: rt, cam: new THREE.CubeCamera(0.15, 30000, rt), pos: new THREE.Vector3(), tex: texU, p: posU, interior: interior, done: false };
    ENV.list.push(e); return e;
  }
  var envIn = makeEnv("rotunda", matU.uEnvIn, matU.uEnvInP, true), envW = makeEnv("wing", matU.uEnvW, matU.uEnvWP, true), envOut = makeEnv("court", matU.uEnvOut, matU.uEnvOutP, false);
  function captureEnv(e) {
    var exp = e.interior ? interiorExposure() : exposure, keepExp = U.uExposure.value, keepOn = matU.uEnvOn.value, keepSky = sky.position.clone();
    var hidden = [motes].concat(palAnimHidden).filter(Boolean);
    hidden.forEach(function (o) { o.visible = false; });
    var bound = [matU.uEnvIn.value, matU.uEnvOut.value, matU.uEnvW.value];
    matU.uEnvIn.value = matU.uEnvOut.value = matU.uEnvW.value = ENV.dummy.texture;       // never sample the map being drawn
    U.uExposure.value = exp; matU.uEnvOn.value = 0; matU.uPalB.value.w = e.interior ? 1 : 0;
    sky.position.copy(e.pos); e.cam.position.copy(e.pos); e.cam.update(renderer, scene);
    sky.position.copy(keepSky); U.uExposure.value = keepExp; hidden.forEach(function (o) { o.visible = true; });
    matU.uEnvIn.value = bound[0]; matU.uEnvOut.value = bound[1]; matU.uEnvW.value = bound[2];
    e.tex.value = e.rt.texture; e.p.value.set(e.pos.x, e.pos.y, e.pos.z, 1 / exp); e.done = true;
    matU.uEnvOn.value = ENV.list.every(function (x) { return x.done; }) ? 1 : keepOn;
  }
  function queueEnv(all) { ENV.list.forEach(function (e) { if ((all || !e.interior || e === envIn) && ENV.queue.indexOf(e) < 0) ENV.queue.push(e); }); ENV.lastT = tMin; }
  function stepEnv() {                     // called once per frame
    if (!ENV.ready) return;
    if (!ENV.queue.length && Math.abs(tMin - ENV.lastT) > 6) queueEnv(false);
    var e = ENV.queue.shift(); if (e) captureEnv(e);
  }
