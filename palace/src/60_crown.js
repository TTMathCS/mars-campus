  /* ==========================================================================================
     The Crown (sheets A-001, A-201, A-401). A ring of white sintered regolith 244-276 m across,
     floating with its underside at +40 m on anti-gravity drives in its five spires. Roof line
     50 + 40·c^6 with c = (1 + cos 5(b - 18°)) / 2, so spires reach +90 m at bearings 18, 90, 162,
     234 and 306. Window slots 1.2 m tall at +44 m (and +55 m in the spires), a titanium rim, the
     pod hangar behind a door on the garden side of the east spire, the mirror Orb over the Sun
     Well, and the Stone Garden's mirrors that aim the sun at the Orb's underside.
     Bearings are compass bearings: 0 = north (-z), 90 = east (+x).
     ========================================================================================== */
  var CROWN = (function () {
    var C = { rc: 130, ri: 122, ro: 138, under: 40, floor: 41, peaks: [18, 90, 162, 234, 306], orbY: 72, orbR: 20, door: { b0: 84.4, b1: 89.6, y0: 41, y1: 49 } };
    function top(b) { var c = (1 + Math.cos(5 * (b - 18) * D2R)) / 2; return 50 + 40 * Math.pow(c, 6); }
    function dtop(b) { var c = (1 + Math.cos(5 * (b - 18) * D2R)) / 2, dc = -2.5 * Math.sin(5 * (b - 18) * D2R); return 240 * Math.pow(c, 5) * dc; }   // per radian
    function P(r, b, y) { var a = b * D2R; return [r * Math.sin(a), y, -r * Math.cos(a)]; }
    C.top = top; C.P = P;
    var grp = new THREE.Group(); scene.add(grp);
    function add(gb, mat, cast) { var m = new THREE.Mesh(gb.build(), mat); m.frustumCulled = false; grp.add(m); if (cast !== false) SHADOW.caster(m); m.layers.enable(2); return m; }

    var mShell = MAT.make({ color: 0xf1ebe1, rough: 0.5, pat: 1, win: 2, rows: [44, 55, 1.2, 4.2] });
    var mTi = MAT.make({ color: 0xa8a39c, rough: 0.3, metal: 1 });
    var mUnder = MAT.make({ color: 0xd8d2c8, rough: 0.6, pat: 1 });

    /* ---------------- the ring */
    var step = 0.5, sh = new GB(), un = new GB(), ti = new GB(), D = C.door;
    function inDoor(b) { return b > D.b0 - 1e-6 && b < D.b1 + 1e-6; }
    for (var b0 = 0; b0 < 360; b0 += step) {
      var b1 = b0 + step, T0 = top(b0), T1 = top(b1), a0 = b0 * D2R, a1 = b1 * D2R;
      var no0 = [Math.sin(a0), 0, -Math.cos(a0)], no1 = [Math.sin(a1), 0, -Math.cos(a1)], ni0 = [-no0[0], 0, -no0[2]], ni1 = [-no1[0], 0, -no1[2]];
      // outer wall
      sh.quad(P(C.ro, b1, C.under), P(C.ro, b0, C.under), P(C.ro, b0, T0), P(C.ro, b1, T1), no1, no0, no0, no1, [C.ro * a1, C.under], [C.ro * a0, C.under], [C.ro * a0, T0], [C.ro * a1, T1]);
      // inner wall, with the hangar door cut out of the east spire
      var bm = (b0 + b1) / 2;
      if (inDoor(bm)) {
        sh.quad(P(C.ri, b0, C.under), P(C.ri, b1, C.under), P(C.ri, b1, D.y0), P(C.ri, b0, D.y0), ni0, ni1, ni1, ni0, [C.ri * a0, C.under], [C.ri * a1, C.under], [C.ri * a1, D.y0], [C.ri * a0, D.y0]);
        sh.quad(P(C.ri, b0, D.y1), P(C.ri, b1, D.y1), P(C.ri, b1, T1), P(C.ri, b0, T0), ni0, ni1, ni1, ni0, [C.ri * a0, D.y1], [C.ri * a1, D.y1], [C.ri * a1, T1], [C.ri * a0, T0]);
      } else sh.quad(P(C.ri, b0, C.under), P(C.ri, b1, C.under), P(C.ri, b1, T1), P(C.ri, b0, T0), ni0, ni1, ni1, ni0, [C.ri * a0, C.under], [C.ri * a1, C.under], [C.ri * a1, T1], [C.ri * a0, T0]);
      // roof: normal tilts along the ring where it climbs a spire
      var s0 = dtop(b0) / C.rc, s1 = dtop(b1) / C.rc;
      var t0 = [Math.cos(a0), 0, Math.sin(a0)], t1 = [Math.cos(a1), 0, Math.sin(a1)];
      var nt0 = new THREE.Vector3(-s0 * t0[0], 1, -s0 * t0[2]).normalize().toArray(), nt1 = new THREE.Vector3(-s1 * t1[0], 1, -s1 * t1[2]).normalize().toArray();
      sh.quad(P(C.ri, b0, T0), P(C.ri, b1, T1), P(C.ro, b1, T1), P(C.ro, b0, T0), nt0, nt1, nt1, nt0, [C.rc * a0, 100], [C.rc * a1, 100], [C.rc * a1, 116], [C.rc * a0, 116]);
      // underside
      un.quad(P(C.ro, b0, C.under), P(C.ro, b1, C.under), P(C.ri, b1, C.under), P(C.ri, b0, C.under), [0, -1, 0], null, null, null, [C.rc * a0, 200], [C.rc * a1, 200], [C.rc * a1, 216], [C.rc * a0, 216]);
      // titanium rim: a band under the roof edge and round the underside, both walls
      [[C.ro + 0.14, no0, no1, 1], [C.ri - 0.14, ni0, ni1, -1]].forEach(function (w) {
        var r = w[0], A = [P(r, b0, T0 - 0.9), P(r, b1, T1 - 0.9), P(r, b1, T1 + 0.03), P(r, b0, T0 + 0.03)], B = [P(r, b0, C.under - 0.03), P(r, b1, C.under - 0.03), P(r, b1, C.under + 0.7), P(r, b0, C.under + 0.7)];
        if (w[3] > 0) { ti.quad(A[1], A[0], A[3], A[2], w[2], w[1], w[1], w[2]); ti.quad(B[1], B[0], B[3], B[2], w[2], w[1], w[1], w[2]); }
        else { ti.quad(A[0], A[1], A[2], A[3], w[1], w[2], w[2], w[1]); if (!inDoor(bm)) ti.quad(B[0], B[1], B[2], B[3], w[1], w[2], w[2], w[1]); }
      });
    }
    var shellMesh = add(sh, mShell), underMesh = add(un, mUnder), tiMesh = add(ti, mTi);

    /* ---------------- the hangar in the east spire: frame, sliding doors and a lit interior */
    var HB = (D.b0 + D.b1) / 2, hc = P(C.ri, HB, 0), hr = new THREE.Vector3(Math.sin(HB * D2R), 0, -Math.cos(HB * D2R)), ht = new THREE.Vector3(Math.cos(HB * D2R), 0, Math.sin(HB * D2R));
    var HW = C.ri * (D.b1 - D.b0) * D2R, HD = 14.5, HY0 = D.y0, HY1 = D.y1 + 0.6;
    // local frame of the hangar: x into the spire (radially out), z along the ring, origin at the door's centre on the floor
    var HM = new THREE.Matrix4().makeBasis(hr, new THREE.Vector3(0, 1, 0), ht.clone()).setPosition(hc[0], 0, hc[2]);
    function hbox(gb, x, y, z, sx, sy, sz) { var m = HM.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z)).multiply(new THREE.Matrix4().makeScale(sx, sy, sz)); gb.add(BOXG, m); }
    var hin = new GB(), hdark = new GB(), hlit = new GB();
    // an inside-out room: thin boxes for floor, ceiling, side walls and back wall
    hbox(hin, HD / 2, HY0 - 0.25, 0, HD, 0.5, HW + 1);
    hbox(hin, HD / 2, HY1 + 0.25, 0, HD, 0.5, HW + 1);
    hbox(hin, HD / 2, (HY0 + HY1) / 2, -HW / 2 - 0.25, HD, HY1 - HY0, 0.5);
    hbox(hin, HD / 2, (HY0 + HY1) / 2, HW / 2 + 0.25, HD, HY1 - HY0, 0.5);
    hbox(hin, HD + 0.25, (HY0 + HY1) / 2, 0, 0.5, HY1 - HY0, HW + 1);
    // light strips along the ceiling and walls, and the Door at the back: a tall arch of light
    for (var ls = -1; ls <= 1; ls++) hbox(hlit, HD / 2, HY1 - 0.02, ls * 3.4, HD - 2, 0.06, 0.5);
    hbox(hlit, HD / 2, HY0 + 1.2, -HW / 2 + 0.03, HD - 1, 0.08, 0.06); hbox(hlit, HD / 2, HY0 + 1.2, HW / 2 - 0.03, HD - 1, 0.08, 0.06);
    // landing circle on the floor
    var hmats = { room: MAT.make({ color: 0xd9d5cf, rough: 0.45, pat: 6, side: THREE.DoubleSide, ambK: 0.12, emis: [0.34, 0.33, 0.31] }), lit: glowMat([3.2, 3.0, 2.7]) };
    var hangarRoom = add(hin, hmats.room, false), hangarLit = new THREE.Mesh(hlit.build(), hmats.lit); hangarLit.frustumCulled = false; grp.add(hangarLit);
    // the Door: a round portal of light in the back wall that opens at the end
    var doorU = sharedUniforms({ uOpen: { value: 0 } });
    var theDoor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.ShaderMaterial({
      uniforms: doorU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform float uOpen; varying vec2 vP; varying vec3 vW; void main(){ float r = length(vP) / 2.6; float a = atan(vP.y, vP.x);" +
        " float ring = exp(-pow((r - 0.93) / 0.03, 2.0)) * 2.5; float iris = smoothstep(uOpen * 1.02, uOpen * 1.02 - 0.03, r);" +
        " float sw = 0.5 + 0.5 * sin(a * 6.0 - uTime * 2.0 + r * 12.0); vec3 c = vec3(0.55, 0.8, 1.0) * ring * (0.8 + 0.2 * sw) + vec3(1.0, 0.86, 0.66) * iris * 2.2 + vec3(0.3, 0.5, 0.9) * (1.0 - iris) * smoothstep(1.0, 0.0, r) * 0.25;" +
        " gl_FragColor = vec4(c, 1.0); " + LOGF + " }"
    }));
    theDoor.applyMatrix4(HM.clone().multiply(new THREE.Matrix4().makeTranslation(HD - 0.02, HY0 + 3.3, 0)).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)));
    grp.add(theDoor); theDoor.frustumCulled = false;
    // two door leaves that slide apart along the ring
    var leafL = new GB(), leafR = new GB();
    (function () {
      function leaf(gb, s) { var m = new THREE.Matrix4().makeTranslation(-0.2, (HY0 + D.y1) / 2, s * HW / 4).multiply(new THREE.Matrix4().makeScale(0.4, D.y1 - HY0, HW / 2)); gb.add(BOXG, m); }
      leaf(leafL, -1); leaf(leafR, 1);
    })();
    var mLeaf = MAT.make({ color: 0xece6dc, rough: 0.45, pat: 6 });
    var leafMeshL = new THREE.Mesh(leafL.build(), mLeaf), leafMeshR = new THREE.Mesh(leafR.build(), mLeaf);
    [leafMeshL, leafMeshR].forEach(function (m) { m.matrixAutoUpdate = false; m.frustumCulled = false; grp.add(m); SHADOW.caster(m); });
    function setDoor(open) {
      open = clamp(open, 0, 1);
      var e = open * open * (3 - 2 * open), off = e * (HW / 2 + 0.4);
      leafMeshL.matrix.copy(HM).multiply(new THREE.Matrix4().makeTranslation(0, 0, -off)); leafMeshR.matrix.copy(HM).multiply(new THREE.Matrix4().makeTranslation(0, 0, off));
      leafMeshL.visible = leafMeshR.visible = open < 0.999;
    }
    setDoor(0);
    // door frame lights, on when the door opens
    var hangarLights = [];
    for (var dl = 0; dl < 8; dl++) { var dz = (dl / 7 - 0.5) * HW, dp = new THREE.Vector3(-0.35, HY0 - 0.2, dz).applyMatrix4(HM); LIGHTS.add(dp.x, dp.y, dp.z, LC.amber, 0.28, 1.2); }

    /* ---------------- the Orb: a mirror sphere 40 m across over the Sun Well */
    var cubeRT = new THREE.WebGLCubeRenderTarget(MOBILE ? 128 : 256, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    var cubeCam = new THREE.CubeCamera(1, 250000, cubeRT); cubeCam.position.set(0, C.orbY, 0); scene.add(cubeCam);
    cubeCam.children.forEach(function (c) { c.layers.set(2); });
    var orbU = sharedUniforms({ uEnvMap: { value: cubeRT.texture }, uGlowOn: { value: 0 } });
    var orb = new THREE.Mesh(new THREE.SphereGeometry(C.orbR, 128, 64), new THREE.ShaderMaterial({
      uniforms: orbU,
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + [
        "uniform samplerCube uEnvMap; uniform float uGlowOn; varying vec3 vW; varying vec3 vN;",
        "void main(){",
        "  vec3 n = normalize(vN); vec3 v = normalize(uCam - vW); vec3 r = reflect(-v, n);",
        "  vec3 c = textureCube(uEnvMap, r).rgb * vec3(0.93, 0.92, 0.90);",
        "  float y = vW.y;",
        // thin seams of light at the three floors; the Wormhole Gate hall glows blue
        "  float s1 = exp(-pow((y - 64.0) / 0.10, 2.0)), s2 = exp(-pow((y - 72.0) / 0.12, 2.0)), s3 = exp(-pow((y - 80.0) / 0.10, 2.0));",
        "  float fl = 0.85 + 0.15 * sin(uTime * 1.7 + atan(n.z, n.x) * 3.0);",
        "  c += (vec3(1.0, 0.72, 0.42) * (s1 + s3) * 2.2 + vec3(0.45, 0.72, 1.0) * s2 * 3.0 * fl) * uGlowOn;",
        "  c = haze(c, vW);",
        "  gl_FragColor = vec4(c, 1.0);",
        "  " + LOGF,
        "}"].join("\n")
    }));
    orb.position.set(0, C.orbY, 0); grp.add(orb); SHADOW.caster(orb);

    // what the Orb sees below the horizon: a flat plain and the Stone Garden, cheap to draw six times
    var proxy = new THREE.Mesh(new THREE.CircleGeometry(20000, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: sharedUniforms(),
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; " + LOGV + " }",
      fragmentShader: GLSL_COMMON + GLSL_SHADOW + LOGF_PARS + [
        "varying vec3 vW;",
        "void main(){",
        "  float r = length(vW.xz);",
        "  vec3 alb = mix(vec3(0.24, 0.15, 0.10), vec3(0.34, 0.22, 0.145), 0.5 + 0.5 * vnoise(vW.xz / 900.0));",
        "  float gard = 1.0 - smoothstep(108.0, 114.0, r);",
        "  alb = mix(alb, vec3(0.34, 0.25, 0.185) * (0.92 + 0.08 * sin(r * 6.9813)), gard);",
        "  float sh = shadowAt(vec3(vW.x, 0.0, vW.z), 0.004);",
        "  vec3 col = alb * (uSunCol * max(uSunDir.y, 0.0) * sh + mix(uAmbHor, uAmbUp, 0.75) * 0.85);",
        "  col += vec3(1.0, 0.85, 0.62) * 3.0 * (1.0 - smoothstep(9.0, 10.5, r));",
        "  gl_FragColor = vec4(haze(col, vW), 1.0);",
        "  " + LOGF,
        "}"].join("\n")
    }));
    proxy.position.y = -1.2; proxy.layers.set(2); proxy.frustumCulled = false; scene.add(proxy);
    SKYMESH.layers.enable(2);
    var cubeFace = 0, cubeAll = true;
    function updateOrb(all) {
      // one face per frame (or all six), from the Orb's centre; the Orb and the sky follow it
      var sp = SKYMESH.position.clone(), cp = U.uCam.value.clone(); SKYMESH.position.copy(cubeCam.position); U.uCam.value.copy(cubeCam.position);
      orb.visible = false;
      var n = all ? 6 : 1;
      for (var i = 0; i < n; i++) {
        renderer.setRenderTarget(cubeRT, cubeFace); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, false);
        renderer.render(scene, cubeCam.children[cubeFace]);
        cubeFace = (cubeFace + 1) % 6;
      }
      orb.visible = true; SKYMESH.position.copy(sp); U.uCam.value.copy(cp);
    }

    /* ---------------- the Stone Garden: mirrors aimed at the Orb's underside, big stones, the Sun Well */
    var MIR = [];
    [34, 46, 58, 70, 82, 94].forEach(function (r, ri) { var n = Math.round(2 * Math.PI * r / 10.5); for (var i = 0; i < n; i++) { var b = (i + (ri % 2) * 0.5) / n * 360; if (Math.abs(((b - 90 + 540) % 360) - 180) < 3.5) continue; MIR.push({ b: b, r: r }); } });
    var mMirror = MAT.make({ color: 0xdfe3e6, rough: 0.035, metal: 1 }), mPost = MAT.make({ color: 0x55565a, rough: 0.5, metal: 0.6 });
    var mirIM = new THREE.InstancedMesh(BOXG, mMirror, MIR.length), frameIM = new THREE.InstancedMesh(BOXG, mPost, MIR.length), postIM = new THREE.InstancedMesh(CYLG, mPost, MIR.length);
    [mirIM, frameIM, postIM].forEach(function (m) { m.frustumCulled = false; grp.add(m); SHADOW.caster(m); m.layers.enable(2); });
    var _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1);
    function aimMirrors() {
      var sun = U.uSunDir.value;
      MIR.forEach(function (mr, i) {
        var p = P(mr.r, mr.b, 0), gy = TER.h(p[0], p[2]);
        _p.set(p[0], gy + 3.2, p[2]);
        _t.set(0, C.orbY - C.orbR, 0).sub(_p).normalize();
        _n.copy(sun).add(_t).normalize();
        _q.setFromUnitVectors(_z, _n);
        _m.compose(_p, _q, _s.set(3.2, 3.2, 0.06)); mirIM.setMatrixAt(i, _m);
        _m.compose(_p.clone().addScaledVector(_n, -0.08), _q, _s.set(3.4, 3.4, 0.1)); frameIM.setMatrixAt(i, _m);
        _m.makeScale(0.12, 3.2, 0.12).setPosition(_p.x, gy + 1.6, _p.z); postIM.setMatrixAt(i, _m);
      });
      mirIM.instanceMatrix.needsUpdate = frameIM.instanceMatrix.needsUpdate = postIM.instanceMatrix.needsUpdate = true;
    }
    // big dark stones set in the raked gravel
    var stones = new GB(), mStone = MAT.make({ color: 0x3a302b, rough: 0.85 });
    [[26, 40, 3.2], [22, 150, 2.4], [30, 230, 4.1], [18, 300, 2.0], [38, 330, 2.8], [104, 200, 3.4], [100, 20, 2.6]].forEach(function (s, i) {
      var p = P(s[0] + 70 * (i > 4 ? 0 : 0), s[1], 0), gy = TER.h(p[0], p[2]);
      var ico = new THREE.IcosahedronGeometry(1, 2), pa = ico.attributes.position;
      for (var k = 0; k < pa.count; k++) { var x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k), f = 1 + 0.18 * TER.vnoise(x * 2 + i * 7, z * 2 + y * 3) + 0.08 * TER.vnoise(x * 5 + i, y * 5); pa.setXYZ(k, x * f, y * f, z * f); }
      ico.computeVertexNormals();
      stones.add(ico, new THREE.Matrix4().makeRotationY(i * 1.3).setPosition(p[0], gy + s[2] * 0.25, p[2]).multiply(new THREE.Matrix4().makeScale(s[2] * 1.3, s[2] * 0.7, s[2])));
    });
    add(stones, mStone);
    // the Sun Well: a thick glass lens in a titanium ring, warm light rising from the atrium 68 m below
    var well = new GB(); lathe(well, [[11.4, -0.5], [11.4, 0.4], [10.2, 0.5]], 64, 0, TER.h(0, 0), 0); add(well, mTi, false);
    var lens = new THREE.Mesh(new THREE.CircleGeometry(10.2, 64).rotateX(-Math.PI / 2), MAT.make({ color: 0x0d1418, rough: 0.02, emis: [0.9, 0.72, 0.5] }));
    lens.position.y = TER.h(0, 0) + 0.3; grp.add(lens); lens.layers.enable(2);
    // the beam: sunlight from the mirrors, bounced off the Orb's underside down into the Sun Well
    var beamU = sharedUniforms({ uBeam: { value: 0 } });
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.2, C.orbY - C.orbR + 1, 48, 1, true), new THREE.ShaderMaterial({
      uniforms: beamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform float uBeam; varying vec3 vW; varying vec3 vN; void main(){ vec3 v = normalize(uCam - vW); float edge = pow(1.0 - abs(dot(normalize(vN), v)), 1.5); float y = vW.y / " + (C.orbY - C.orbR).toFixed(1) + ";" +
        " float sh = 0.75 + 0.25 * vnoise(vec2(atan(vW.z, vW.x) * 8.0, vW.y * 0.2 - uTime * 0.6)); vec3 c = vec3(1.0, 0.86, 0.66) * (0.25 + 0.75 * edge) * sh * (0.45 + 0.55 * y) * uBeam * 0.18;" +
        " gl_FragColor = vec4(c, 1.0); " + LOGF + " }"
    }));
    beam.position.y = (C.orbY - C.orbR + 1) / 2 - 1.2; beam.frustumCulled = false; grp.add(beam);

    /* ---------------- anti-gravity: a glowing emitter under each spire, a faint field column, floating dust */
    var agU = sharedUniforms({ uAG: { value: 1 } });
    var agGeo = new THREE.CircleGeometry(7, 48).rotateX(Math.PI / 2);
    var emitMat = new THREE.ShaderMaterial({
      uniforms: agU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec2 vP; varying vec3 vW; void main(){ vP = position.xz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform float uAG; varying vec2 vP; varying vec3 vW; void main(){ float r = length(vP) / 7.0; float rings = 0.5 + 0.5 * sin(r * 40.0 - uTime * 3.0); float g = (exp(-r * 3.0) * 1.4 + rings * 0.35 * (1.0 - r)) * (1.0 - smoothstep(0.85, 1.0, r)); gl_FragColor = vec4(vec3(0.42, 0.62, 1.0) * g * uAG * 2.2, 1.0); " + LOGF + " }"
    });
    var colMat = new THREE.ShaderMaterial({
      uniforms: agU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: GLSL_COMMON + LOGV_PARS + "varying vec3 vW; varying vec3 vN; varying float vY; void main(){ vY = uv.y; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "uniform float uAG; varying vec3 vW; varying vec3 vN; varying float vY; void main(){ vec3 v = normalize(uCam - vW); float edge = pow(1.0 - abs(dot(normalize(vN), v)), 2.0);" +
        " float wave = 0.6 + 0.4 * sin(vW.y * 0.9 + uTime * 2.4 + atan(vW.z, vW.x) * 2.0); float f = edge * wave * (0.35 + 0.65 * vY) * uAG * 0.07;" +
        " gl_FragColor = vec4(vec3(0.45, 0.62, 1.0) * f, 1.0); " + LOGF + " }"
    });
    var AG = [];
    C.peaks.forEach(function (b) {
      var p = P(C.rc, b, 0);
      var e = new THREE.Mesh(agGeo, emitMat); e.position.set(p[0], C.under - 0.08, p[2]); e.frustumCulled = false; grp.add(e);
      var gy = TER.h(p[0], p[2]);
      AG.push(new THREE.Vector3(p[0], gy, p[2]));
      LIGHTS.add(p[0], top(b) + 0.6, p[2], LC.red, 0.8, -0.55);
    });
    // floating dust in the fields
    (function () {
      var n = 220, pos = [], seed = [];
      AG.forEach(function (c) { for (var i = 0; i < n; i++) { pos.push(c.x, c.y, c.z); seed.push(TER.hash12(i * 1.7, c.x), TER.hash12(i * 3.1, c.z), TER.hash12(i * 0.37, 5.1)); } });
      var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("seed", new THREE.Float32BufferAttribute(seed, 3));
      var m = new THREE.ShaderMaterial({
        uniforms: sharedUniforms({ uPx: LIGHTS.u.uPx, uAG: agU.uAG }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: GLSL_COMMON + LOGV_PARS + "attribute vec3 seed; uniform float uPx; uniform float uAG; varying float vA; void main(){ float t = uTime * (0.4 + 0.5 * seed.z) + seed.x * 40.0; float y = mod(t * 1.4, 38.0); float a = seed.y * 6.2832 + t * 0.35 + y * 0.05; float r = 1.5 + 9.0 * sqrt(seed.x);" +
          " vec3 w = position + vec3(cos(a) * r, y, sin(a) * r); vec4 mv = viewMatrix * vec4(curveW(w), 1.0); gl_Position = projectionMatrix * mv; float px = 0.12 * uPx / max(-mv.z, 1.0); gl_PointSize = clamp(px * 3.0, 1.0, 12.0);" +
          " vA = smoothstep(0.0, 4.0, y) * (1.0 - smoothstep(30.0, 38.0, y)) * uAG * min(px * px, 1.0); " + LOGV + " }",
        fragmentShader: GLSL_COMMON + LOGF_PARS + "varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = exp(-dot(q, q) * 30.0); gl_FragColor = vec4(vec3(0.9, 0.75, 0.6) * (uSunCol * 0.15 + vec3(0.25, 0.35, 0.6)) * d * vA, 1.0); " + LOGF + " }"
      });
      var pts = new THREE.Points(g, m); pts.frustumCulled = false; grp.add(pts);
    })();

    // everything of the Crown the Orb should see
    grp.traverse(function (o) { o.layers.enable(2); });
    orb.layers.disable(2);

    return {
      C: C, grp: grp, orb: orb, updateOrb: updateOrb, aimMirrors: aimMirrors, setDoor: setDoor, doorU: doorU, orbU: orbU, beamU: beamU, agU: agU, AG: AG,
      hangar: { M: HM, width: HW, depth: HD, y0: HY0, y1: HY1, bearing: HB, entry: new THREE.Vector3(hc[0], 45, hc[2]), inward: hr.clone().negate(), radial: hr.clone(), along: ht.clone() }
    };
  })();
