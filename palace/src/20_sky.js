  /* ==========================================================================================
     Sky: the dusty Mars sky with the small sun, its blue sunset glow, Phobos crossing the sun,
     stars and Earth as the evening star. The sun state lives in the shared uniforms.
     ========================================================================================== */
  var SUN = { az: 262 * D2R, el: 10 * D2R, e1: new THREE.Vector3(), e2: new THREE.Vector3() };
  var _v3 = new THREE.Vector3(), _c3 = new THREE.Vector3();
  function setSun(elDeg, azDeg) {
    SUN.el = elDeg * D2R; if (azDeg !== undefined) SUN.az = azDeg * D2R;
    var ce = Math.cos(SUN.el), d = U.uSunDir.value.set(Math.sin(SUN.az) * ce, Math.sin(SUN.el), -Math.cos(SUN.az) * ce);
    U.uSunEl.value = SUN.el;
    // tangent basis around the sun, for Phobos
    SUN.e1.set(Math.cos(SUN.az), 0, Math.sin(SUN.az)).normalize(); SUN.e2.crossVectors(SUN.e1, d).normalize();
    // direct light: whiter high up, reddened near the horizon, dimmed by the storm
    var e = SUN.el, redden = smooth(0.0, 0.26, e), inten = 3.1 * smooth(-0.025, 0.06, e) * (1 - 0.93 * U.uStorm.value);
    U.uSunCol.value.set(inten, inten * lerp(0.66, 0.92, redden), inten * lerp(0.44, 0.83, redden));
    // sky light for ambient terms: straight up, and the average of the horizon ring
    SKY.color(_v3.set(0, 1, 0), _c3); U.uAmbUp.value.copy(_c3).multiplyScalar(0.95);
    var acc = new THREE.Vector3();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; SKY.color(_v3.set(Math.sin(a) * 0.96, 0.28, -Math.cos(a) * 0.96).normalize(), _c3); acc.add(_c3); }
    U.uAmbHor.value.copy(acc.multiplyScalar(1 / 8 * 0.9));
    U.uNight.value = 1 - smooth(-0.02, 0.07, e);
  }

  var SKYMESH = (function () {
    var g = new THREE.SphereGeometry(200000, 64, 32);
    var m = new THREE.ShaderMaterial({
      uniforms: sharedUniforms(),
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: LOGV_PARS + "varying vec3 vD; void main(){ vD = position; vec4 w = modelMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * viewMatrix * w; " + LOGV + " }",
      fragmentShader: GLSL_COMMON + "\n" + LOGF_PARS + [
        "varying vec3 vD;",
        "vec3 starField(vec3 d){",
        "  vec3 a = abs(d); vec2 uv; float f;",
        "  if (a.x > a.y && a.x > a.z){ uv = d.yz / a.x; f = sign(d.x); } else if (a.y > a.z){ uv = d.xz / a.y; f = 2.0 + sign(d.y); } else { uv = d.xy / a.z; f = 4.0 + sign(d.z); }",
        "  vec2 g = uv * 260.0; vec2 cell = floor(g); vec2 r = hash22(cell + f * 17.0); float h = hash12(cell * 1.7 + f);",
        "  float s = 0.0; if (h > 0.965){ vec2 p = fract(g) - r; float k = pow(hash12(cell + 3.1 + f), 6.0); s = exp(-dot(p, p) * 900.0) * (0.25 + 5.0 * k); }",
        "  return vec3(s) * mix(vec3(1.0, 0.85, 0.7), vec3(0.8, 0.9, 1.0), hash12(cell + 9.0 + f));",
        "}",
        "void main(){",
        "  vec3 d = normalize(vD);",
        "  vec3 c = skyColor(d);",
        "  float mu = dot(d, uSunDir), th = acos(clamp(mu, -1.0, 1.0));",
        // Phobos: offset from the sun centre in the sun's tangent plane
        "  vec3 e1 = normalize(vec3(-uSunDir.z, 0.0, uSunDir.x)); vec3 e2 = normalize(cross(e1, uSunDir));",
        "  vec2 q = vec2(dot(d, e1), dot(d, e2)) - uPhobos;",
        "  float ph = smoothstep(0.00215, 0.00195, length(q));",
        // the sun: a disk 0.35 degrees across with limb darkening
        "  float disk = smoothstep(0.00318, 0.00292, th);",
        "  float limb = sqrt(max(0.0, 1.0 - pow(th / 0.00305, 2.0)));",
        "  vec3 sunc = uSunCol / max(uSunCol.r, 1e-3) * (18.0 + 26.0 * limb) * smoothstep(-0.02, 0.02, uSunEl + d.y * 0.0);",
        "  c += sunc * disk * (1.0 - ph) * (1.0 - 0.9 * uStorm) * step(0.0, d.y + 0.003);",
        "  c *= 1.0 - 0.35 * ph;",
        // stars and Earth after sunset
        "  float night = uNight * (1.0 - uStorm) * smoothstep(0.02, 0.2, d.y);",
        "  if (night > 0.001){",
        "    c += starField(d) * night * 0.9;",
        "    vec3 earth = normalize(vec3(uSunDir.x * 0.86 - uSunDir.z * 0.31, 0.36, uSunDir.z * 0.86 + uSunDir.x * 0.31));",
        "    float ea = acos(clamp(dot(d, earth), -1.0, 1.0));",
        "    c += vec3(0.75, 0.88, 1.0) * exp(-ea * ea / 1.6e-6) * 9.0 * night;",
        "  }",
        // below the horizon, fade to the ground haze colour so nothing shows through at the edges
        "  c = mix(c, skyColor(normalize(vec3(d.x, 0.015, d.z))) * 0.85, smoothstep(0.0, -0.06, d.y));",
        "  gl_FragColor = vec4(c, 1.0);",
        "  " + LOGF,
        "}"].join("\n")
    });
    var mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -10;
    scene.add(mesh);
    return mesh;
  })();
