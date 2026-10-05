  /* ===================== Materials: one shader for every built surface ===================== */
  // Real-world surfaces: weathered cladding and concrete outside; marble, brass, oak, fabric and plaster inside.
  // Light: sun and sky with the shadow map, artificial light baked per vertex (with shadows and ambient occlusion
  // traced in a worker), and reflections of the actual surroundings from cube maps captured in the scene.
  var MT = { SHELL: 0, CONCRETE: 1, DKGLASS: 2, ANOD: 3, STEEL: 4, BRASS: 5, MARBLE: 6, ROTFLOOR: 7, BALSTONE: 8, EXHIBIT: 9, ATLAS: 10, LIGHT: 11, LOGO: 12,
    RIB: 13, PLASTER: 14, WOOD: 15, FABRIC: 16, PLASTIC: 17, TERRAZZO: 18, VAULT: 19, STEP: 20, RUBBER: 21, PAVE: 22, SOLAR: 23, CERAMIC: 24, LEATHER: 25,
    SCREEN: 26, COMPOSITE: 27, SIGN: 28, FRIEZE: 29, LEAF: 30 };
  var ZONE = { OUT: 0, ROT: 1, WING: 2 };
  var matU = {
    uFloorTex: { value: dummyTex }, uPanelTex: { value: dummyTex }, uFriezeTex: { value: dummyTex }, uAtlas: { value: dummyTex },
    uLeafTex: { value: (function () { var t = new THREE.DataTexture(new Uint8Array([60, 90, 40, 0]), 1, 1, THREE.RGBAFormat); t.needsUpdate = true; return t; })() },
    uEnvIn: { value: null }, uEnvOut: { value: null }, uEnvW: { value: null }, uEnvOn: { value: 0 },
    uEnvInP: { value: new THREE.Vector4(0, 0, 0, 1) }, uEnvOutP: { value: new THREE.Vector4(0, 0, 0, 1) }, uEnvWP: { value: new THREE.Vector4(0, 0, 0, 1) },
    uPalA: { value: new THREE.Vector4() }, uPalB: { value: new THREE.Vector4() }, uDustC: { value: new THREE.Vector3(0.3, 0.2, 0.12) },
    uPortal: { value: new THREE.Vector4() }, uLinkA: { value: new THREE.Vector4() }, uLinkB: { value: new THREE.Vector4() }
  };
  var MAT_VS = [
    "attribute vec2 aFac; attribute vec2 aFac2; attribute float aMat; attribute vec3 aLight; attribute float aAO; attribute float aSky;",
    "varying vec3 vW; varying vec3 vN; varying vec2 vFac; varying vec2 vFac2; varying float vMat; varying vec3 vL; varying float vAO; varying float vSky;",
    "void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vFac = aFac; vFac2 = aFac2; vMat = aMat; vL = aLight; vAO = aAO; vSky = aSky; gl_Position = projectionMatrix * viewMatrix * wp; }"
  ].join("\n");
  var MAT_COMMON = [
    "uniform samplerCube uEnvIn, uEnvOut, uEnvW; uniform float uEnvOn; uniform vec4 uEnvInP, uEnvOutP, uEnvWP; uniform vec4 uPalA, uPalB;",
    "const vec3 WARM = vec3(1.0, 0.8, 0.58);",
    "float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float aline(float x, float period, float w){ float fw = fwidth(x) + 1e-5; float d = abs(fract(x / period + 0.5) - 0.5) * period;",
    "  float l = 1.0 - smoothstep(w * 0.5 - fw, w * 0.5 + fw, d); return mix(l, min(w / period, 1.0), smoothstep(period * 0.25, period * 0.8, fw)); }",
    "vec3 decEnv(vec4 t){ vec3 e = min(t.rgb, vec3(0.996)); return e / (1.0 - e); }",
    // reflections: the rotunda uses an ellipsoid around its capture point so the floor mirrors the dome in the right place
    "vec3 envLook(float zone, vec3 p, vec3 R, float rough){",
    "  float lod = rough * 7.0;",
    "  if (uEnvOn < 0.5) return zone > 0.5 ? WARM * 0.08 + skyRad(normalize(vec3(R.x, max(R.y, 0.05), R.z))) * 0.2 : skyRad(normalize(vec3(R.x, max(R.y, 0.02), R.z)));",
    "  if (zone > 1.5) return decEnv(textureCube(uEnvW, R, lod)) * uEnvWP.w;",
    "  if (zone > 0.5) {",
    "    vec3 c = uEnvInP.xyz, rad = vec3(22.5, 13.0, 22.5), o = (p - c) / rad, d = R / rad;",
    "    float a = dot(d, d), b = dot(o, d), cc = dot(o, o) - 1.0, t = (-b + sqrt(max(b * b - a * cc, 0.0))) / a;",
    "    return decEnv(textureCube(uEnvIn, normalize(p + R * max(t, 0.0) - c), lod)) * uEnvInP.w;",
    "  }",
    "  return decEnv(textureCube(uEnvOut, R, lod)) * uEnvOutP.w;",
    "}"
  ].join("\n");
  var MAT_FS = [
    "#include <packing>",
    SKY_GLSL, NOISE_GLSL, HAZE_GLSL, LIGHT_GLSL, HF_GLSL, SHADOW_GLSL, MAT_COMMON,
    "uniform sampler2D uFloorTex, uPanelTex, uFriezeTex, uAtlas, uLogo, uLeafTex; uniform vec3 uDustC; uniform float uTime;",
    "varying vec3 vW; varying vec3 vN; varying vec2 vFac; varying vec2 vFac2; varying float vMat; varying vec3 vL; varying float vAO; varying float vSky;",
    // polished stone: domain-warped veins, anti-aliased so they fade instead of flickering far away
    "vec3 marble(vec3 p, float kind, out float rough){",
    "  vec3 q = p * 1.25; float w = fbm4(q.xz * 0.33 + q.y * 0.29 + kind * 7.3);",
    "  float t = fbm5(q.xz * 1.15 + vec2(q.y * 0.9, -q.y * 0.4) + w * 2.4 + kind * 3.1);",
    "  float ft = fbm4(q.xz * 4.1 + w * 3.0 + q.y * 3.1 + kind);",
    "  float vw = max(0.03, fwidth(t) * 1.5), fw = max(0.018, fwidth(ft) * 1.5);",
    "  float vein = (1.0 - smoothstep(0.0, vw, abs(t - 0.5))) * (0.03 / vw), fine = (1.0 - smoothstep(0.0, fw, abs(ft - 0.5))) * (0.018 / fw);",
    "  float cloud = fbm4(q.xz * 0.12 + q.y * 0.1 + 3.0 + kind);",
    "  vec3 base, vc;",
    "  if (kind < 0.5) { base = vec3(0.87, 0.865, 0.85); vc = vec3(0.47, 0.48, 0.50); }",            // Carrara
    "  else if (kind < 1.5) { base = vec3(0.05, 0.09, 0.07); vc = vec3(0.52, 0.60, 0.54); }",          // Verde Alpi
    "  else if (kind < 2.5) { base = vec3(0.79, 0.62, 0.39); vc = vec3(0.47, 0.30, 0.21); }",          // Giallo Siena
    "  else if (kind < 3.5) { base = vec3(0.03, 0.03, 0.034); vc = vec3(0.78, 0.78, 0.76); }",         // Nero Marquina
    "  else { base = vec3(0.81, 0.74, 0.62); vc = vec3(0.62, 0.54, 0.44); }",                           // Botticino
    "  vec3 c = base * (0.9 + 0.2 * cloud);",
    "  c = mix(c, vc, clamp(vein * 0.55 + fine * 0.2, 0.0, 1.0));",
    "  rough = 0.07 + 0.08 * cloud; return c; }",
    "vec2 planar(vec3 p, vec3 n){ return abs(n.y) > 0.6 ? p.xz : (abs(n.x) > abs(n.z) ? p.zy : p.xy); }",
    "void main(){",
    "  vec3 n0 = normalize(vN);",
    "  vec3 V = vW - cameraPosition; float dist = length(V); vec3 vd = V / max(dist, 1e-3);",
    "  vec3 n = dot(n0, vd) > 0.0 ? -n0 : n0;",
    "  float m = vMat; vec2 f = vFac, g = vFac2;",
    "  float zone = floor(vAO * 0.5 + 0.01), ao = clamp(vAO - zone * 2.0, 0.0, 1.0);",
    "  vec3 alb = vec3(0.7); vec3 emi = vec3(0.0); float rough = 0.6, metal = 0.0, dustable = 0.0, hab = g.x, isLeaf = 0.0;",
    "  vec2 q = vW.xz - uPalA.xy; float lat = q.x * uPalA.w - q.y * uPalA.z, rad = dot(q, uPalA.zw);",
    "  vec2 pc = planar(vW, n0);",
    "  if (m < 0.5) {",                                                   // SHELL: white fibre-composite cladding panels, f in metres
    "    vec2 pid = floor(vec2(f.x / 2.4, f.y / 1.2)); float off = step(0.5, fract(pid.y * 0.5)) * 1.2;",
    "    pid = floor(vec2((f.x + off) / 2.4, f.y / 1.2));",
    "    float j = max(aline(f.x + off, 2.4, 0.016), aline(f.y, 1.2, 0.016));",
    "    float grain = 0.93 + 0.07 * vnoise(vW.xz * 6.0 + vW.y * 5.0) + 0.04 * (vnoise(vW.xz * 31.0 + vW.y * 27.0) - 0.5);",
    "    alb = vec3(0.79, 0.775, 0.74) * (0.95 + 0.07 * hsh(pid)) * grain * (1.0 - 0.5 * j); rough = 0.42 + 0.1 * hsh(pid + 3.0); dustable = 1.0;",
    "  } else if (m < 1.5) {",                                            // CONCRETE: board-marked, with tie holes
    "    float agg = vnoise(pc * 9.0) * 0.6 + vnoise(pc * 37.0) * 0.4;",
    "    float tie = 1.0 - smoothstep(0.012, 0.02, length(fract(f / vec2(0.6, 0.6)) - 0.5) * 0.6);",
    "    alb = vec3(0.60, 0.58, 0.55) * (0.88 + 0.2 * agg) * (1.0 - 0.07 * max(aline(f.x, 1.2, 0.01), aline(f.y, 0.6, 0.01))) * (1.0 - 0.5 * tie);",
    "    rough = 0.85; dustable = 1.0;",
    "  } else if (m < 2.5) { alb = vec3(0.025, 0.028, 0.03); rough = 0.04; dustable = 0.3; }",          // dark glass
    "  else if (m < 3.5) { alb = vec3(0.13, 0.135, 0.14); metal = 0.85; rough = 0.34; dustable = 0.6; }",   // anodised aluminium
    "  else if (m < 4.5) { alb = vec3(0.80, 0.81, 0.82); metal = 1.0; rough = 0.26 + 0.12 * vnoise(vec2(pc.x * 260.0, pc.y * 2.0)); dustable = 0.4; }",   // brushed steel
    "  else if (m < 5.5) {",                                              // BRASS: polished; g.y 7 bronze weathered outside (dark, dull, dusty)
    "    if (g.y > 6.5 && g.y < 7.5) { float pt = fbm4(vW.xz * 3.1 + vW.y * 4.3); alb = vec3(0.47, 0.32, 0.19) * (0.8 + 0.3 * pt); metal = 0.8; rough = 0.4 + 0.18 * pt; dustable = 0.9; }",
    "    else { alb = vec3(0.96, 0.87, 0.64); metal = 1.0; rough = 0.14 + 0.12 * fbm4(vW.xz * 2.7 + vW.y * 2.2); }",
    "  }",
    "  else if (m < 6.5) { alb = marble(vW, g.y, rough);",                 // g.x = 98: wall cladding in 1.2 x 1.8 m slabs with fine joints
    "    if (g.x > 97.5 && g.x < 98.5) { float row = floor(f.y / 1.8), jn = max(aline(f.x + row * 0.6, 1.2, 0.004), aline(f.y, 1.8, 0.004)); alb *= 1.0 - 0.4 * jn; rough = mix(rough, 0.55, jn); }",
    "  }",
    "  else if (m < 7.5) {",                                              // ROTFLOOR: Penrose marble with brass inlay (texture alpha = brass)
    "    vec3 t = texture2D(uFloorTex, vec2(0.5 - lat, 0.5 * uPalB.z + rad) / (2.0 * uPalB.z) + vec2(0.5, 0.25)).rgb;",
    "    float br = smoothstep(0.32, 0.12, t.b) * smoothstep(0.55, 0.8, t.r), lum = dot(t, vec3(0.33));",   // brass is painted #ffcc00 in the texture
    "    float kind = lum > 0.78 ? 0.0 : (lum > 0.3 ? 4.0 : 3.0);",
    "    alb = marble(vW + kind * 3.7, kind, rough);",
    "    if (br > 0.5) { alb = vec3(0.96, 0.87, 0.64) * (0.94 + 0.08 * vnoise(vW.xz * 7.0)); metal = 1.0; rough = 0.18 + 0.08 * vnoise(vW.xz * 3.0); }",
    "  } else if (m < 8.5) {",                                            // BALSTONE: black marble with brass inlay lines
    "    float ln = g.y > 0.5 ? max(aline(abs(f.x) - 2.2, 100.0, 0.04), aline(f.y, 2.4, 0.03) * step(abs(f.x), 2.2))",
    "                         : max(max(aline(f.x - 22.9, 100.0, 0.04), aline(f.x - 26.8, 100.0, 0.04)), aline(f.y, 2.62753, 0.03) * step(22.9, f.x) * step(f.x, 26.8));",
    "    alb = marble(vW, 3.0, rough); if (ln > 0.5) { alb = vec3(0.96, 0.87, 0.64); metal = 1.0; rough = 0.2; }",
    "  } else if (m < 9.5) {",                                            // EXHIBIT: backlit print behind glass
    "    vec3 t = texture2D(uPanelTex, f).rgb; alb = vec3(0.02); emi = pow(t, vec3(2.2)) * 0.85; rough = 0.04;",
    "  } else if (m < 10.5) {",                                           // ATLAS: g.y 0 print, 1 brass letters set in black marble, 2 whiteboard, 3 chalkboard, 4 books, 5 backlit display, 6 lit lettering
    "    vec4 t = texture2D(uAtlas, f);",
    "    if (g.y < 0.5) { alb = t.rgb; rough = 0.55; }",
    "    else if (g.y < 1.5) { if (t.a > 0.5) { alb = vec3(0.96, 0.87, 0.64) * (0.95 + 0.06 * vnoise(vW.xz * 9.0 + vW.y * 7.0)); metal = 1.0; rough = 0.2; } else alb = marble(vW, 3.0, rough); }",
    "    else if (g.y < 2.5) { alb = mix(vec3(0.92, 0.93, 0.92), t.rgb, t.a); rough = mix(0.08, 0.45, t.a); }",
    "    else if (g.y < 3.5) { alb = mix(vec3(0.06, 0.08, 0.075), vec3(0.85, 0.84, 0.8), t.a * 0.9); rough = 0.8; }",
    "    else if (g.y < 4.5) { alb = t.rgb; rough = 0.5; }",
    "    else if (g.y < 5.5) { alb = vec3(0.02); emi = pow(t.rgb, vec3(2.2)) * 0.85 * (g.x > 50.0 ? 1.0 : g.x); rough = 0.04; }",
    "    else { alb = mix(vec3(0.12, 0.125, 0.13), vec3(0.95, 0.94, 0.9), t.a); metal = 0.8 * (1.0 - t.a); rough = mix(0.32, 0.2, t.a); emi = WARM * t.a * g.x; }",
    "  } else if (m < 11.5) { alb = vec3(0.95); emi = mix(WARM, vec3(0.78, 0.88, 1.0), g.y) * g.x; rough = 0.2; }",   // LIGHT: g.x intensity, g.y warm..cool
    "  else if (m < 12.5) {",                                             // LOGO: backlit acrylic logo on a dark plate
    "    vec2 k = step(vec2(0.0), f) * step(f, vec2(1.0)); float lg = texture2D(uLogo, clamp(f, 0.0, 1.0)).a * k.x * k.y;",
    "    alb = mix(vec3(0.05, 0.07, 0.1), vec3(0.95), lg); emi = vec3(1.0, 0.97, 0.92) * 0.85 * lg; rough = mix(0.25, 0.1, lg); metal = 0.5 * (1.0 - lg);",
    "  } else if (m < 13.5) { alb = vec3(0.16, 0.15, 0.14) * (0.94 + 0.08 * vnoise(vW.xz * 4.0 + vW.y * 4.0)); metal = 0.65; rough = 0.34; }",   // RIB: dark bronze-anodised steel, like real glass-dome lattices
    "  else if (m < 14.5) {",                                             // PLASTER: g.y 0 off-white, 1 warm grey, 2 terracotta, 3 slate blue, 6 ceiling tiles
    "    vec3 c = g.y < 0.5 ? vec3(0.86, 0.85, 0.82) : (g.y < 1.5 ? vec3(0.60, 0.58, 0.55) : (g.y < 2.5 ? vec3(0.58, 0.33, 0.24) : vec3(0.22, 0.28, 0.36)));",
    "    alb = c * (0.96 + 0.05 * vnoise(pc * 3.0) + 0.03 * (vnoise(pc * 45.0) - 0.5)); rough = 0.88;",
    "    if (g.y > 5.5 && g.y < 6.5) {",                                     // g.y 6: acoustic ceiling tiles, 60 cm, in a white steel grid
    "      float gl = max(aline(f.x, 0.6, 0.007), aline(f.y, 0.6, 0.007)), fis = vnoise(f * 55.0) * 0.6 + vnoise(f * 160.0) * 0.4;",
    "      alb = mix(vec3(0.83, 0.825, 0.80) * (0.93 + 0.09 * fis) * (0.97 + 0.04 * hsh(floor(f / 0.6))), vec3(0.88, 0.88, 0.87), gl); rough = mix(0.95, 0.4, gl);",
    "    }",
    "  } else if (m < 15.5) {",                                           // WOOD: f = (along the grain, across) m; g.y 0 floor planks, 1 oak, 2 walnut
    "    float pw = 0.19, pl = 2.2, row = floor(f.y / pw), sh = hsh(vec2(row, 3.0)) * pl, col = floor((f.x + sh) / pl), pr = hsh(vec2(row, col) + 7.0);",
    "    float seam = (g.y < 0.5 || g.y > 2.5) ? max(aline(f.y, pw, 0.004), aline(f.x + sh, pl, 0.004)) : 0.0;",
    "    float ws = f.y * 55.0 + fbm4(vec2(f.x * 1.6 + pr * 9.0, f.y * 7.0)) * 8.0 + pr * 30.0, fw = fwidth(ws);",
    "    float rings = mix(0.5 + 0.5 * sin(ws), 0.5, smoothstep(0.8, 2.5, fw));",
    "    float streak = fbm4(vec2(f.x * 0.7 + pr * 13.0, f.y * 34.0));",
    "    vec3 wa = vec3(0.71, 0.53, 0.34), wb = vec3(0.50, 0.34, 0.20); if (g.y > 1.5) { wa = vec3(0.42, 0.28, 0.18); wb = vec3(0.24, 0.15, 0.09); }",
    "    alb = mix(wb, wa, clamp(0.35 + 0.35 * rings + 0.5 * (streak - 0.5), 0.0, 1.0)) * (0.88 + 0.22 * pr) * (1.0 - 0.55 * seam); rough = 0.34 + 0.18 * streak;",
    "  } else if (m < 16.5) {",                                           // FABRIC: g.x colour
    "    float c = g.x; vec3 fc = c < 0.5 ? vec3(0.17, 0.17, 0.19) : (c < 1.5 ? vec3(0.23, 0.30, 0.40) : (c < 2.5 ? vec3(0.62, 0.47, 0.18) : (c < 3.5 ? vec3(0.55, 0.27, 0.17) : (c < 4.5 ? vec3(0.40, 0.46, 0.36) : vec3(0.72, 0.66, 0.56)))));",
    "    vec2 wc = pc * 520.0; float fwv = fwidth(wc.x) + fwidth(wc.y);",
    "    float weave = mix(0.5 + 0.25 * (sin(wc.x) + sin(wc.y)), 0.5, smoothstep(0.6, 2.0, fwv));",
    "    alb = fc * (0.86 + 0.18 * weave) * (0.92 + 0.12 * vnoise(pc * 30.0)); rough = 0.95;",
    "  } else if (m < 17.5) {",                                           // PLASTIC: g.x colour
    "    float c = g.x; vec3 pcol = c < 0.5 ? vec3(0.86, 0.86, 0.84) : (c < 1.5 ? vec3(0.07, 0.07, 0.075) : (c < 2.5 ? vec3(0.78, 0.30, 0.13) : (c < 3.5 ? vec3(0.13, 0.31, 0.58) : (c < 4.5 ? vec3(0.86, 0.66, 0.14) : (c < 5.5 ? vec3(0.47, 0.48, 0.49) : (c < 6.5 ? vec3(0.07, 0.25, 0.15) : vec3(0.84, 0.80, 0.70)))))));",
    "    alb = pcol * (0.97 + 0.04 * vnoise(pc * 20.0)); rough = 0.36;",
    "  } else if (m < 18.5) {",                                           // TERRAZZO: polished, with stone chips
    "    vec2 tc = pc * 42.0; float fz = fwidth(tc.x) + fwidth(tc.y), a = 1.0 - smoothstep(0.35, 1.2, fz);",
    "    float c1 = smoothstep(0.8, 0.84, vnoise(tc)) * a, c2 = smoothstep(0.82, 0.86, vnoise(tc * 1.6 + 11.0)) * a, c3 = smoothstep(0.8, 0.85, vnoise(tc * 2.3 + 23.0)) * a;",
    "    alb = vec3(0.70, 0.685, 0.65) * (0.96 + 0.05 * vnoise(pc * 1.5) + 0.04 * (vnoise(pc * 90.0) - 0.5));",
    "    alb = mix(alb, vec3(0.36, 0.35, 0.34), c1 * 0.7); alb = mix(alb, vec3(0.62, 0.45, 0.36), c2 * 0.6); alb = mix(alb, vec3(0.93, 0.92, 0.9), c3 * 0.8);",
    "    alb = mix(alb, vec3(0.64, 0.625, 0.595), (1.0 - a) * 0.5); rough = 0.16;",
    "  } else if (m < 19.5) {",                                           // VAULT: coffered plaster ceiling with recessed downlights; f = (lat, rad), g.x height above floor
    "    vec2 cq = vec2(fract(f.x / 1.3) - 0.5, fract(f.y / 1.5) - 0.5);",
    "    float spot = (1.0 - smoothstep(0.08, 0.12, length(cq * vec2(1.3, 1.5)))) * step(5.2, g.x);",
    "    float cof = max(aline(f.x, 1.3, 0.05), aline(f.y, 1.5, 0.05)) * step(4.6, g.x);",
    "    alb = vec3(0.87, 0.86, 0.83) * (1.0 - 0.2 * cof) * (0.97 + 0.04 * vnoise(vW.xz * 3.0)); emi = WARM * 2.6 * spot; rough = 0.85;",
    "  } else if (m < 20.5) {",                                           // STEP: Carrara tread with a brass nosing
    "    alb = marble(vW, 0.0, rough); if (f.y < 0.06) { alb = vec3(0.96, 0.87, 0.64); metal = 1.0; rough = 0.22; }",
    "  } else if (m < 21.5) { alb = vec3(0.045, 0.043, 0.042) * (0.9 + 0.2 * vnoise(pc * 40.0)); rough = 0.88; dustable = 1.4; }",   // rubber
    "  else if (m < 22.5) {",                                             // PAVE: g.y 0 court basalt slabs, 1 avenue granite with light studs, 2 bays concrete
    "    dustable = 0.45; hab = 0.0;",
    "    if (g.y < 0.5) {",
    "      vec2 sz = vec2(1.2, 0.8); vec2 id = floor(f / sz); float j = max(aline(f.x, sz.x, 0.012), aline(f.y + step(0.5, fract(id.x * 0.5)) * 0.4, sz.y, 0.012));",
    "      alb = vec3(0.30, 0.285, 0.27) * (0.9 + 0.2 * hsh(id)) * (0.93 + 0.1 * vnoise(f * 9.0)) * (1.0 - 0.5 * j); rough = 0.72;",
    "    } else if (g.y < 1.5) {",
    "      float hw = g.x, e = hw - abs(f.x); vec2 id = floor(vec2((f.x + hw) / 1.0, f.y / 0.6));",
    "      float j = max(aline(f.x + hw, 1.0, 0.01), aline(f.y, 0.6, 0.01));",
    "      alb = vec3(0.58, 0.55, 0.51) * (0.9 + 0.18 * hsh(id)) * (0.92 + 0.12 * vnoise(f * 11.0)) * (1.0 - 0.45 * j); rough = 0.6;",
    "      alb = mix(alb, vec3(0.20, 0.19, 0.18), 1.0 - smoothstep(0.2, 0.24, e));",
    "      float fa = 1.0, fb = 2.0, stud = 0.0;",                         // light studs 1, 2, 3, 5, 8, 13, 21, 34 m from the door
    "      for (int k = 0; k < 8; k++) { stud = max(stud, 1.0 - smoothstep(0.045, 0.06, length(vec2(f.y - fa, e - 0.5)))); float t2 = fa + fb; fa = fb; fb = t2; }",
    "      emi = WARM * 1.4 * stud; alb = mix(alb, vec3(0.9), stud); dustable *= 1.0 - stud;",
    "      hab = 0.0;",
    "    } else {",                                                    // charging bays: concrete with painted edges; f in metres over 3.6 x 6
    "      float e = min(min(f.x, 3.6 - f.x), min(f.y, 6.0 - f.y)), ln = 1.0 - smoothstep(0.06, 0.08, e);",
    "      alb = vec3(0.55, 0.53, 0.50) * (0.9 + 0.15 * vnoise(f * 6.0)); alb = mix(alb, vec3(0.86, 0.85, 0.81), ln * 0.9); rough = 0.8;",
    "    }",
    "  } else if (m < 23.5) {",                                           // SOLAR cells
    "    float gl = max(aline(f.x, 0.156, 0.004), aline(f.y, 0.156, 0.004)); alb = mix(vec3(0.02, 0.035, 0.07), vec3(0.6), gl); rough = 0.08; metal = gl; dustable = 0.7;",
    "  } else if (m < 24.5) { alb = vec3(0.91, 0.90, 0.88); rough = 0.07; }",   // ceramic
    "  else if (m < 25.5) { alb = (g.x > 0.5 && g.x < 1.5 ? vec3(0.05, 0.045, 0.045) : (g.x > 1.5 && g.x < 2.5 ? vec3(0.45, 0.24, 0.11) : vec3(0.30, 0.17, 0.11))) * (0.9 + 0.2 * vnoise(pc * 60.0)); rough = 0.45; }",   // leather: g.x 0 brown, 1 black, 2 cognac
    "  else if (m < 26.5) { vec3 t = texture2D(uAtlas, f).rgb; alb = vec3(0.012); emi = pow(t, vec3(2.2)) * 0.95 * g.x; rough = 0.05; }",   // SCREEN
    "  else if (m < 27.5) {",                                             // COMPOSITE: vehicle bodywork, panel lines and fasteners
    "    float j = max(aline(f.x, 0.9, 0.008), aline(f.y, 0.6, 0.008)); float rv = 1.0 - smoothstep(0.006, 0.01, length(fract(f / vec2(0.15, 0.6)) - vec2(0.5, 0.06)) * 0.15);",
    "    alb = vec3(0.80, 0.79, 0.76) * (1.0 - 0.45 * j) * (1.0 - 0.3 * rv) * (0.95 + 0.06 * vnoise(pc * 8.0)); rough = 0.48; dustable = 1.2;",
    "  } else if (m < 28.5) {",                                           // SIGN: brushed steel plate with the backlit logo
    "    vec2 k = step(vec2(0.0), f) * step(f, vec2(1.0)); float lg = texture2D(uLogo, clamp(f, 0.0, 1.0)).a * k.x * k.y;",
    "    alb = mix(vec3(0.42, 0.43, 0.44), vec3(0.96), lg); metal = 1.0 - lg; rough = mix(0.3 + 0.1 * vnoise(vec2(pc.x * 200.0, pc.y * 2.0)), 0.2, lg); emi = vec3(1.0, 0.98, 0.95) * 0.55 * lg; dustable = 0.5 * (1.0 - lg);",
    "  } else if (m < 29.5) {",                                           // FRIEZE: brass equations set into a band of black marble
    "    vec3 t = texture2D(uFriezeTex, f).rgb; float gl = smoothstep(0.45, 0.7, t.r);",
    "    alb = marble(vW, 3.0, rough); if (gl > 0.5) { alb = vec3(0.96, 0.87, 0.64) * (0.95 + 0.06 * vnoise(vW.xz * 9.0 + vW.y * 7.0)); metal = 1.0; rough = 0.2; }",
    "  } else {",                                                         // LEAF: a leaf cut out of the leaf texture; g.x tint 0..1, g.y gloss
    "    if (g.y < -0.5) {",                                                // stems and trunks: bark (g.x 0) or a green stem (g.x 1)
    "      float bn = vnoise(vec2(pc.x * 26.0, pc.y * 5.0)) * 0.7 + vnoise(pc * 90.0) * 0.3;",
    "      alb = g.x < 0.5 ? vec3(0.36, 0.31, 0.25) * (0.7 + 0.5 * bn) : vec3(0.30, 0.42, 0.20) * (0.88 + 0.24 * bn); rough = g.x < 0.5 ? 0.9 : 0.55;",
    "    } else {",
    "      vec4 t = texture2D(uLeafTex, f); float a = (t.a - 0.5) / max(fwidth(t.a), 1e-3) + 0.5; if (a < 0.5) discard;",
    "      alb = t.rgb * mix(vec3(0.82, 0.86, 0.78), vec3(1.0, 1.0, 0.9), g.x); rough = mix(0.62, 0.3, g.y); isLeaf = 1.0;",
    "    }",
    "  }",
    "  vec3 albl = pow(alb, vec3(2.2));",
    // Mars dust on everything outside: settled on ledges, streaked down walls, splashed at the foot
    "  if (zone < 0.5 && dustable > 0.0) {",
    "    float up = smoothstep(0.3, 0.9, n0.y);",
    "    float streak = vnoise(vec2((vW.x * 0.7 + vW.z * 0.7) * 3.2, vW.y * 0.22)) * vnoise(vec2((vW.x - vW.z) * 1.6, vW.y * 0.5 + 3.0));",
    "    float splash = 1.0 - smoothstep(0.0, 1.7, hab);",
    "    float d = dustable * clamp(0.6 * up + 0.3 * streak * (1.0 - up) + 0.55 * splash, 0.0, 1.0) * (0.55 + 0.45 * vnoise(vW.xz * 0.8 + vW.y * 0.6));",
    "    albl = mix(albl, uDustC, clamp(d, 0.0, 0.85)); rough = mix(rough, 0.95, d); metal *= 1.0 - d;",
    "  }",
    "  float NdL = max(dot(n, uSun), 0.0), sh = 0.0;",
    "  if (NdL > 0.0) { sh = shadowAt(vW, n); if (zone < 0.5) sh *= hfShadow(vW + n * 0.4); }",
    "  vec3 skyE = ambientAt(n) * (zone < 0.5 ? 1.0 : vSky);",
    "  vec3 E = vL * (0.55 + 0.45 * ao) + skyE * ao + uSunIrr * NdL * sh + WARM * 0.008 * ao;",
    "  vec3 col = albl * (1.0 - metal) * 0.6 * E;",
    "  float NdV = max(dot(n, -vd), 1e-3);",
    "  vec3 F0 = mix(vec3(0.04), albl, metal); vec3 Fr = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - NdV, 5.0);",
    "  vec3 R = reflect(vd, n);",
    "  float so = clamp(pow(NdV + ao, exp2(-16.0 * rough - 1.0)) - 1.0 + ao, 0.0, 1.0);",
    "  col += Fr * envLook(zone, vW, R, rough) * so * (1.0 - 0.6 * rough * rough);",
    "  if (sh > 0.0) { vec3 H = normalize(uSun - vd); float a = max(rough * rough, 0.003), a2 = a * a, nh = max(dot(n, H), 0.0), dd = nh * nh * (a2 - 1.0) + 1.0; col += uSunIrr * sh * NdL * (a2 / (3.14159 * dd * dd)) * Fr * 0.2; }",
    "  if (isLeaf > 0.5) {",                                              // light through the leaf: lamps and the sun from behind
    "    float back = max(-dot(n, uSun), 0.0), shb = back > 0.0 ? shadowAt(vW, -n) : 0.0;",
    "    col += albl * (vL * 0.1 + uSunIrr * back * shb * 0.25) * vec3(0.85, 1.0, 0.55);",
    "  }",
    "  col += emi;",
    "  col = mix(col, hazeCol(vd), hazeAmt(dist) * (1.0 - uPalB.w));",
    "  gl_FragColor = vec4(enc(col * uExposure), 0.0);",
    "}"
  ].join("\n");
