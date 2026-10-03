  /* ==========================================================================================
     The pod: a four-seat lifting body, 9.2 m long, white ceramic skin, tinted canopy. Four
     thrusters underneath lift it off and land it, two engines at the tail push it in cruise
     (methane and oxygen, so the flames are blue). Local frame: -z forward, +y up, +x right.
     The cockpit, seen by the cockpit camera, lives in its own scene so it is never clipped.
     ========================================================================================== */
  var POD = (function () {
    var L = 9.2, grp = new THREE.Group(); scene.add(grp);
    // cross-sections along the body: superellipses with a flat belly
    function sec(t) {
      var w = 2.25 * Math.pow(Math.sin(Math.min(1, t / 0.64) * Math.PI / 2), 0.85) * (1 - 0.12 * smooth(0.75, 1, t)) + 0.04;
      var up = 0.12 + 0.78 * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.98) * 0.5 + 0.02), 0.7) - 0.25 * smooth(0.7, 1, t);
      var dn = 0.1 + 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.9) * 0.5), 0.5);
      return { w: w, up: up, dn: dn, y: -0.1 + 0.25 * t };
    }
    function hullGeo() {
      var gb = new GB(), NS = 56, NT = 36, ring = [];
      for (var i = 0; i <= NS; i++) {
        var t = i / NS, s = sec(t), z = -L / 2 + t * L, row = [];
        for (var j = 0; j <= NT; j++) {
          var th = j / NT * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), ex = 2 / 2.6;
          var x = s.w * Math.sign(c) * Math.pow(Math.abs(c), ex), y = s.y + (sn > 0 ? s.up : s.dn) * Math.sign(sn) * Math.pow(Math.abs(sn), ex);
          row.push(new THREE.Vector3(x, y, z));
        }
        ring.push(row);
      }
      // close the tail with a flat plate
      var nrm = function (i, j) {
        var a = ring[Math.min(NS, i + 1)][j].clone().sub(ring[Math.max(0, i - 1)][j]), b = ring[i][(j + 1) % NT].clone().sub(ring[i][(j + NT - 1) % NT]);
        return b.cross(a).normalize();
      };
      for (var i2 = 0; i2 < NS; i2++) for (var j2 = 0; j2 < NT; j2++) {
        var A = ring[i2][j2], B = ring[i2][j2 + 1], Cc = ring[i2 + 1][j2 + 1], Dd = ring[i2 + 1][j2];
        gb.quad(A.toArray(), B.toArray(), Cc.toArray(), Dd.toArray(), nrm(i2, j2).toArray(), nrm(i2, (j2 + 1) % NT).toArray(), nrm(i2 + 1, (j2 + 1) % NT).toArray(), nrm(i2 + 1, j2).toArray());
      }
      var tail = ring[NS], tc = new THREE.Vector3(0, sec(1).y, L / 2);
      for (var j3 = 0; j3 < NT; j3++) gb.tri(tc.toArray(), tail[j3].toArray(), tail[j3 + 1].toArray(), [0, 0, 1]);
      return gb;
    }
    var mSkin = MAT.make({ color: 0xf0ece6, rough: 0.35, pat: 5 });
    var mGlass = MAT.make({ color: 0x0a0e12, rough: 0.03, emis: [0.02, 0.025, 0.03] });
    var mTi = MAT.make({ color: 0x9a958e, rough: 0.3, metal: 1 });
    var mDark = MAT.make({ color: 0x1d1e20, rough: 0.5 });
    function build(withFlames) {
      var g = new THREE.Group();
      var hull = new THREE.Mesh(hullGeo().build(), mSkin); g.add(hull);
      // canopy bubble over the front seats
      var can = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), mGlass);
      can.scale.set(1.15, 0.72, 2.05); can.position.set(0, 0.52, -1.35); g.add(can);
      // titanium spine and fins
      var fin = new GB();
      [-1, 1].forEach(function (s) {
        var m = new THREE.Matrix4().makeTranslation(s * 1.15, 0.95, 3.3).multiply(new THREE.Matrix4().makeRotationZ(-s * 0.55)).multiply(new THREE.Matrix4().makeRotationX(-0.35)).multiply(new THREE.Matrix4().makeScale(0.08, 1.1, 1.3));
        fin.add(BOXG, m);
      });
      fin.add(BOXG, new THREE.Matrix4().makeTranslation(0, 0.93, 1.9).multiply(new THREE.Matrix4().makeScale(0.16, 0.08, 3.2)));
      g.add(new THREE.Mesh(fin.build(), mTi));
      // thrusters: four under the belly, two at the tail
      var noz = new GB();
      var TH = [[-1.45, -0.42, -2.1], [1.45, -0.42, -2.1], [-1.45, -0.42, 2.4], [1.45, -0.42, 2.4]];
      TH.forEach(function (p) { lathe(noz, [[0.42, 0], [0.34, -0.25], [0.18, -0.3]], 20, p[0], p[1] + 0.05, p[2]); });
      [[-0.6, 0.1, 4.62], [0.6, 0.1, 4.62]].forEach(function (p) { noz.add(CYLG, new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(0.36, 0.3, 0.36))); });
      g.add(new THREE.Mesh(noz.build(), mDark));
      var flames = null;
      if (withFlames) {
        flames = { lift: [], main: [] };
        var fu = sharedUniforms({ uThr: { value: 0 } }), fu2 = sharedUniforms({ uThr: { value: 0 } });
        var fs = GLSL_COMMON + LOGF_PARS + "uniform float uThr; varying vec2 vUv; varying vec3 vW; void main(){ float a = vUv.y; float core = pow(1.0 - a, 2.2); float fl = 0.8 + 0.2 * sin(uTime * 60.0 + a * 20.0); vec3 c = mix(vec3(0.35, 0.5, 1.0), vec3(1.0, 0.85, 0.7), core * core) * core * fl * uThr * 3.0; gl_FragColor = vec4(c, 1.0); " + LOGF + " }";
        var vs = GLSL_COMMON + LOGV_PARS + "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * vec4(curveW(w.xyz), 1.0); " + LOGV + " }";
        var fm = new THREE.ShaderMaterial({ uniforms: fu, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        var fm2 = new THREE.ShaderMaterial({ uniforms: fu2, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        // a cone with v = 0 at the nozzle
        var cone = new THREE.CylinderGeometry(0.3, 0.02, 1, 16, 4, true); cone.translate(0, -0.5, 0);
        TH.forEach(function (p) { var f = new THREE.Mesh(cone, fm); f.position.set(p[0], p[1] - 0.25, p[2]); f.scale.set(1, 3, 1); f.frustumCulled = false; g.add(f); flames.lift.push(f); });
        [[-0.6, 0.1, 4.8], [0.6, 0.1, 4.8]].forEach(function (p) { var f = new THREE.Mesh(cone, fm2); f.position.set(p[0], p[1], p[2]); f.rotation.x = -Math.PI / 2; f.scale.set(1, 4, 1); f.frustumCulled = false; g.add(f); flames.main.push(f); });
        flames.uLift = fu.uThr; flames.uMain = fu2.uThr;
      }
      g.traverse(function (o) { o.frustumCulled = false; });
      return { g: g, flames: flames };
    }
    var main = build(true); grp.add(main.g);
    main.g.traverse(function (o) { if (!o.material || !o.material.blending || o.material.blending === THREE.NormalBlending) { o.layers.enable(1); o.layers.enable(2); } });
    // navigation lights that move with the pod: red left, green right, white strobes
    var navU = sharedUniforms({ uPx: LIGHTS.u.uPx });
    var nav = new THREE.Points(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: navU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: GLSL_COMMON + LOGV_PARS + "attribute vec3 lcol; attribute float lblink; uniform float uPx; varying vec3 vC; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec4 mv = viewMatrix * vec4(curveW(w.xyz), 1.0); gl_Position = projectionMatrix * mv; float px = 0.18 * uPx / max(-mv.z, 0.5); float ps = max(px, 1.6);" +
        " float b = lblink > 0.0 ? 0.05 + 4.0 * pow(max(0.0, sin(6.2832 * uTime * lblink)), 60.0) : 1.0; vC = lcol * b * max(px * px / (ps * ps), 0.15); gl_PointSize = min(ps * 4.0, 90.0); " + LOGV + " }",
      fragmentShader: GLSL_COMMON + LOGF_PARS + "varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; gl_FragColor = vec4(vC * (exp(-r * r * 40.0) * 2.0 + exp(-r * 5.0) * 0.3) * (1.0 - smoothstep(0.7, 1.0, r)), 1.0); " + LOGF + " }"
    }));
    nav.geometry.setAttribute("position", new THREE.Float32BufferAttribute([-2.25, 0, 0.6, 2.25, 0, 0.6, 0, 1.0, 3.9, 0, -0.55, 0], 3));
    nav.geometry.setAttribute("lcol", new THREE.Float32BufferAttribute([3, 0.2, 0.1, 0.2, 3, 0.8, 3, 3, 3, 3, 0.4, 0.2], 3));
    nav.geometry.setAttribute("lblink", new THREE.Float32BufferAttribute([0, 0, 1.1, 0.9], 1));
    nav.frustumCulled = false; main.g.add(nav);

    // three more pods parked on the other pads of the pod station
    PORT.podPads.forEach(function (p, i) {
      if (p === PORT.departPad) return;
      var b = build(false); b.g.position.copy(p).add(new THREE.Vector3(0, 0.55, 0)); b.g.rotation.y = Math.PI / 2 + 0.05 * i; scene.add(b.g);
      b.g.traverse(function (o) { o.layers.enable(1); });
    });

    /* ---------------- the cockpit: canopy frame, dashboard with three screens */
    var ck = new THREE.Group(); cockpitScene.add(ck);
    var mFrame = MAT.make({ color: 0x3e4044, rough: 0.55, metal: 0.35, ambK: 0.75, emis: [0.008, 0.009, 0.01] }), mDash = MAT.make({ color: 0x1e1f22, rough: 0.55, pat: 7, ambK: 0.75, emis: [0.016, 0.018, 0.022] });
    var fr = new GB();
    // windshield frame round the canopy opening, seen from the left seat
    // round titanium tubes from a to b
    function bar(a, b, r) { var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), mid = A.clone().add(B).multiplyScalar(0.5), m = new THREE.Matrix4().lookAt(A, B, new THREE.Vector3(0, 1, 0)); m.setPosition(mid); m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).multiply(new THREE.Matrix4().makeScale(r, A.distanceTo(B), r)); fr.add(CYLG, m); }
    bar([0, 1.12, -2.9], [0, 1.24, -0.4], 0.045);
    bar([-1.08, 0.56, -2.4], [-0.72, 1.12, -0.6], 0.04); bar([1.08, 0.56, -2.4], [0.72, 1.12, -0.6], 0.04);
    bar([-1.1, 0.62, -0.55], [1.1, 0.62, -0.55], 0.035);
    ck.add(new THREE.Mesh(fr.build(), mFrame));
    var dash = new GB();
    // the instrument panel faces the pilot; a glare shield on top, a console below
    var dm = new THREE.Matrix4().makeTranslation(0, 0.68, -1.95).multiply(new THREE.Matrix4().makeRotationX(1.05)).multiply(new THREE.Matrix4().makeScale(2.2, 0.05, 0.5)); dash.add(BOXG, dm);
    dash.add(BOXG, new THREE.Matrix4().makeTranslation(0, 0.915, -2.13).multiply(new THREE.Matrix4().makeScale(2.2, 0.04, 0.36)));
    dash.add(BOXG, new THREE.Matrix4().makeTranslation(0, 0.3, -1.75).multiply(new THREE.Matrix4().makeScale(2.2, 0.36, 0.45)));
    ck.add(new THREE.Mesh(dash.build(), mDash));
    // screens drawn on a canvas each frame
    var scr = document.createElement("canvas"); scr.width = 768; scr.height = 256;
    var sctx = scr.getContext("2d"), stex = new THREE.CanvasTexture(scr); stex.minFilter = THREE.LinearFilter;
    var smat = new THREE.ShaderMaterial({ uniforms: { t: { value: stex }, k: { value: 1 } }, vertexShader: LOGV_PARS + "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); " + LOGV + " }", fragmentShader: LOGF_PARS + "uniform sampler2D t; uniform float k; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; c = c * c * 1.6 * k; gl_FragColor = vec4(c, 1.0); " + LOGF + " }" });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), smat);
    screen.scale.set(1, 0.84, 1); screen.position.set(-0.05, 0.6978, -1.9193); screen.rotation.x = -0.52; ck.add(screen);
    // a glossy black bezel round the screens, and a row of lit buttons on the console
    var bez = new THREE.Mesh(BOXG, MAT.make({ color: 0x0b0c0e, rough: 0.12, ambK: 0.8 })); bez.scale.set(1.6, 0.5, 0.03); bez.rotation.x = -0.52;
    bez.position.set(-0.05, 0.6978 - 0.018 * 0.497, -1.9193 - 0.018 * 0.868); ck.add(bez);
    var btn = new GB(), btnLit = new GB();
    for (var bi = 0; bi < 10; bi++) { var bx = -0.62 + bi * 0.11; (bi % 3 === 1 ? btnLit : btn).add(BOXG, new THREE.Matrix4().makeTranslation(bx, 0.487, -1.62).multiply(new THREE.Matrix4().makeScale(0.07, 0.014, 0.045))); }
    ck.add(new THREE.Mesh(btn.build(), MAT.make({ color: 0x2c2d31, rough: 0.35, ambK: 0.8 })));
    ck.add(new THREE.Mesh(btnLit.build(), MAT.make({ color: 0x2c2d31, rough: 0.35, ambK: 0.8, emis: [0.55, 0.32, 0.1] })));
    var EYE = new THREE.Vector3(-0.42, 1.0, -1.25);

    return { g: main.g, flames: main.flames, L: L, cockpit: ck, EYE: EYE, skin: mSkin, screen: { canvas: scr, ctx: sctx, tex: stex, mat: smat } };
  })();
