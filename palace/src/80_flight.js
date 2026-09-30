  /* ==========================================================================================
     The flight home (sheet A-601): the route, the pod's speed and attitude, the sun, the storm,
     the hangar door, and the director's cameras for the ten shots. Everything is a function of
     the flight time t, so the video can be paused, scrubbed and skipped.
     ========================================================================================== */
  var FLIGHT = (function () {
    function polar(b, r, y, v) { var a = b * D2R; return [r * Math.sin(a), y, -r * Math.cos(a), v]; }
    // waypoints: x, y, z (world metres) and the speed there (m/s)
    var WP = [
      [29700, 1.25, -80, 1.4], [29700, 14, -80, 5], [29696, 48, -86, 12], [29610, 110, -190, 42], [29400, 220, -460, 85],
      [29000, 340, -780, 120], [28300, 410, -1180, 145], [27200, 400, -1700, 160], [25900, 250, -2250, 172],
      [24500, 72, -2800, 182],
      // the Dune Sea, 55 m up, between the dust devils
      [23000, 58, -3230, 188], [21450, 56, -3500, 190], [19950, 58, -3450, 190], [18450, 55, -3200, 188], [17000, 62, -2860, 178],
      // up over the crater's rim, across, and down again
      [16050, 140, -2600, 150], [15250, 240, -2450, 132], [14100, 248, -2250, 122], [12950, 240, -1880, 124], [12150, 185, -1180, 138],
      [11420, 75, -260, 148],
      // over the Ice Cliffs' rim and down along the scarp, 45 m above its foot
      [10870, 5, 480, 150], [10477, -52, 883, 150], [9627, -55, 1483, 150], [8815, -56, 2106, 150], [8015, -52, 2756, 146],
      [7520, 0, 3040, 138],
      // up over the rim and into the storm
      [7150, 110, 2950, 132], [6100, 160, 2600, 130], [5050, 160, 2250, 132], [4000, 158, 1850, 135], [3250, 145, 1600, 135],
      // breakout: the Crown ahead
      [2250, 135, 1250, 132], [1250, 125, 850, 130],
      // once round the Crown, in under the ring, round the Orb and into the hangar
      polar(160, 560, 118, 128), polar(205, 480, 105, 126), polar(250, 470, 90, 124), polar(295, 470, 72, 120), polar(340, 470, 58, 112),
      polar(22, 420, 45, 95), polar(62, 290, 34, 75), polar(100, 150, 30, 58), polar(128, 95, 30, 45), polar(175, 52, 31, 36),
      polar(235, 46, 32, 34), polar(295, 46, 34, 32), polar(345, 50, 38, 30),
      [22, 40, -28, 27], [70, 43, -3.7, 21], [118, 44.3, -6.2, 11], [126, 43.3, -6.6, 5], [131, 42.4, -6.9, 0.6]
    ];
    var NW = WP.length;

    /* ---------------- centripetal Catmull-Rom through the waypoints, sampled densely */
    var PX = [], PY = [], PZ = [], PS = [], PV = [], WS = [];
    (function () {
      var P = WP.map(function (w) { return new THREE.Vector3(w[0], w[1], w[2]); });
      var first = P[0].clone().multiplyScalar(2).sub(P[1]), last = P[NW - 1].clone().multiplyScalar(2).sub(P[NW - 2]);
      var Q = [first].concat(P, [last]);
      var s = 0, prev = null;
      for (var i = 1; i < Q.length - 2; i++) {
        var p0 = Q[i - 1], p1 = Q[i], p2 = Q[i + 1], p3 = Q[i + 2];
        var t0 = 0, t1 = t0 + Math.pow(p0.distanceTo(p1), 0.5) + 1e-6, t2 = t1 + Math.pow(p1.distanceTo(p2), 0.5) + 1e-6, t3 = t2 + Math.pow(p2.distanceTo(p3), 0.5) + 1e-6;
        var n = Math.max(6, Math.ceil(p1.distanceTo(p2) / 2.5));
        WS.push(s);
        for (var k = 0; k < n; k++) {
          var t = t1 + (t2 - t1) * k / n;
          var A1 = p0.clone().multiplyScalar((t1 - t) / (t1 - t0)).addScaledVector(p1, (t - t0) / (t1 - t0));
          var A2 = p1.clone().multiplyScalar((t2 - t) / (t2 - t1)).addScaledVector(p2, (t - t1) / (t2 - t1));
          var A3 = p2.clone().multiplyScalar((t3 - t) / (t3 - t2)).addScaledVector(p3, (t - t2) / (t3 - t2));
          var B1 = A1.multiplyScalar((t2 - t) / (t2 - t0)).addScaledVector(A2, (t - t0) / (t2 - t0));
          var B2 = A2.clone().multiplyScalar((t3 - t) / (t3 - t1)).addScaledVector(A3, (t - t1) / (t3 - t1));
          var Cc = B1.multiplyScalar((t2 - t) / (t2 - t1)).addScaledVector(B2, (t - t1) / (t2 - t1));
          if (prev) s += Cc.distanceTo(prev);
          PX.push(Cc.x); PY.push(Cc.y); PZ.push(Cc.z); PS.push(s); prev = Cc;
          // speed: eased between the two waypoints' speeds
          var u = k / n; PV.push(lerp(WP[i - 1][3], WP[i][3], u * u * (3 - 2 * u)));
        }
      }
      var pl = P[NW - 1]; s += pl.distanceTo(prev); PX.push(pl.x); PY.push(pl.y); PZ.push(pl.z); PS.push(s); PV.push(WP[NW - 1][3]); WS.push(s);
    })();
    var NP = PX.length, LEN = PS[NP - 1];
    // time at each sample: integrate ds / v
    var PT = new Float64Array(NP);
    for (var i = 1; i < NP; i++) PT[i] = PT[i - 1] + (PS[i] - PS[i - 1]) / Math.max(0.3, 0.5 * (PV[i] + PV[i - 1]));
    var TOTAL = PT[NP - 1];
    var WT = WS.map(function (s) { var k = 0; while (k < NP - 1 && PS[k] < s) k++; return PT[k]; });

    /* ---------------- resample at 20 Hz, keep the pod clear of the ground, work out its attitude */
    var HZ = 20, NT = Math.ceil(TOTAL * HZ) + 2;
    var X = new Float32Array(NT), Y = new Float32Array(NT), Z = new Float32Array(NT);
    (function () {
      var k = 0;
      for (var j = 0; j < NT; j++) {
        var t = Math.min(j / HZ, TOTAL);
        while (k < NP - 2 && PT[k + 1] < t) k++;
        var f = clamp((t - PT[k]) / Math.max(1e-6, PT[k + 1] - PT[k]), 0, 1);
        X[j] = lerp(PX[k], PX[k + 1], f); Y[j] = lerp(PY[k], PY[k + 1], f); Z[j] = lerp(PZ[k], PZ[k + 1], f);
      }
      // ground clearance between the lift-off and the Crown
      var lift = new Float32Array(NT);
      for (var j2 = 0; j2 < NT; j2++) {
        var t2 = j2 / HZ; if (t2 < 12 || t2 > WT[39]) continue;
        var need = 0;
        for (var a = -1; a <= 1; a++) { var jj = clamp(j2 + a * 4, 0, NT - 1); need = Math.max(need, TER.h(X[jj], Z[jj]) + 26 - Y[j2]); }
        lift[j2] = Math.max(0, need);
      }
      // spread each lift so the pod rises ahead of the obstacle and settles after it
      var sm = new Float32Array(NT), R = 40;
      for (var j3 = 0; j3 < NT; j3++) {
        var m = 0;
        for (var d = -R; d <= R; d++) { var q = j3 + d; if (q < 0 || q >= NT) continue; var w = Math.cos(d / R * Math.PI / 2); m = Math.max(m, lift[q] * w * w); }
        sm[j3] = m;
      }
      for (var j4 = 0; j4 < NT; j4++) Y[j4] += sm[j4];
    })();
    var HEAD = new Float32Array(NT), PITCH = new Float32Array(NT), BANK = new Float32Array(NT), SPD = new Float32Array(NT);
    (function () {
      var valid = new Uint8Array(NT);
      for (var j = 0; j < NT; j++) {
        var a = Math.max(0, j - 2), b = Math.min(NT - 1, j + 2), dt = (b - a) / HZ;
        var vx = (X[b] - X[a]) / dt, vy = (Y[b] - Y[a]) / dt, vz = (Z[b] - Z[a]) / dt, vh = Math.hypot(vx, vz);
        SPD[j] = Math.hypot(vh, vy);
        if (vh > 2.0) { HEAD[j] = Math.atan2(-vx, -vz); valid[j] = 1; }
        PITCH[j] = clamp(Math.atan2(vy, Math.max(vh, 1)) * 0.75, -0.45, 0.45) * smooth(3, 25, vh);
      }
      // where the pod hovers, keep the heading it is about to take (or last had)
      var first = 0; while (first < NT && !valid[first]) first++;
      for (var j1 = 0; j1 < first; j1++) HEAD[j1] = HEAD[first];
      for (var j5 = first + 1; j5 < NT; j5++) if (!valid[j5]) HEAD[j5] = HEAD[j5 - 1];
      // unwrap the heading so it can be smoothed
      for (var j2 = 1; j2 < NT; j2++) { var d = HEAD[j2] - HEAD[j2 - 1]; while (d > Math.PI) { HEAD[j2] -= 2 * Math.PI; d -= 2 * Math.PI; } while (d < -Math.PI) { HEAD[j2] += 2 * Math.PI; d += 2 * Math.PI; } }
      // bank into turns: rate of turn times speed
      for (var j3 = 0; j3 < NT; j3++) {
        var a2 = Math.max(0, j3 - 10), b2 = Math.min(NT - 1, j3 + 10), rate = (HEAD[b2] - HEAD[a2]) / ((b2 - a2) / HZ);
        BANK[j3] = clamp(Math.atan(rate * SPD[j3] / 12.0), -0.62, 0.62) * smooth(8, 30, SPD[j3]);
      }
      function blur(A, R) { var o = new Float32Array(NT); for (var j = 0; j < NT; j++) { var s = 0, w = 0; for (var d = -R; d <= R; d++) { var q = clamp(j + d, 0, NT - 1), k = 1 - Math.abs(d) / (R + 1); s += A[q] * k; w += k; } o[j] = s / w; } return o; }
      var bb = blur(BANK, 14), pp = blur(PITCH, 8); BANK.set(bb); PITCH.set(pp);
    })();

    function sample(A, t) { var f = clamp(t, 0, TOTAL) * HZ, j = Math.floor(f), g = f - j; j = Math.min(j, NT - 2); return lerp(A[j], A[j + 1], g); }
    var S = { p: new THREE.Vector3(), v: new THREE.Vector3(), head: 0, pitch: 0, bank: 0, speed: 0, q: new THREE.Quaternion(), fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
    var _e = new THREE.Euler(), _a = new THREE.Vector3();
    function podAt(t, out) {
      out = out || S;
      out.p.set(sample(X, t), sample(Y, t), sample(Z, t));
      _a.set(sample(X, t + 0.05), sample(Y, t + 0.05), sample(Z, t + 0.05)); out.v.copy(_a).sub(out.p).multiplyScalar(20);
      out.head = sample(HEAD, t); out.pitch = sample(PITCH, t); out.bank = sample(BANK, t); out.speed = sample(SPD, t);
      _e.set(out.pitch, out.head, out.bank, "YXZ"); out.q.setFromEuler(_e);
      out.fwd.set(-Math.sin(out.head), 0, -Math.cos(out.head)); out.right.set(Math.cos(out.head), 0, -Math.sin(out.head));
      return out;
    }
    function timeAtWP(i) { return WT[i]; }
    function posAt(t) { return { x: sample(X, t), y: sample(Y, t), z: sample(Z, t) }; }

    /* ---------------- the sun, the storm and the Crown over time */
    var SUNK = [[0, 10.5], [60, 8.6], [120, 6.3], [180, 4.1], [220, 2.7], [240, 2.1], [268, 1.45], [284, 1.05], [320, 0.7]];
    function key(K, t) { if (t <= K[0][0]) return K[0][1]; for (var i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) { var f = (t - K[i][0]) / (K[i + 1][0] - K[i][0]); return lerp(K[i][1], K[i + 1][1], f); } return K[K.length - 1][1]; }
    function sunEl(t) { return key(SUNK, t); }
    // Phobos: crosses the sun's disc between about 224 and 242 s (offsets in radians, in the sun's frame)
    function phobos(t) { var f = (t - 233) / 9; return Math.abs(f) > 3 ? [9, 9] : [f * 0.0052, 0.0006 - f * 0.0004]; }

    return { WP: WP, TOTAL: TOTAL, LEN: LEN, podAt: podAt, posAt: posAt, timeAtWP: timeAtWP, sunEl: sunEl, phobos: phobos, key: key, S: S, WT: WT };
  })();

  /* ==========================================================================================
     The director: ten shots with cuts inside them. Each camera rig returns a position, a point
     to look at and a field of view. The chase and cockpit cameras are always available too.
     ========================================================================================== */
  var DIRECTOR = (function () {
    var F = FLIGHT, tmp = { p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
    var W = F.WT;
    function at(t) { return F.podAt(t, tmp); }
    function frame(s, a, b, c) { return s.p.clone().addScaledVector(s.fwd, a).addScaledVector(s.right, b).add(new THREE.Vector3(0, c, 0)); }
    // fixed camera placed relative to where the pod will be at time tr
    function flyby(tr, a, b, c, fov, lead) { var s = at(tr), cp = frame(s, a, b, c); return function (t, S) { return { p: cp, look: S.p.clone().addScaledVector(S.v, lead || 0.0), fov: fov }; }; }
    function fixed(p, fov, lookOff) { return function (t, S) { return { p: p, look: S.p.clone().add(lookOff || new THREE.Vector3()), fov: fov }; }; }
    // a camera that flies with the pod in its heading frame (no bank), looking at the pod or ahead of it
    function follow(a, b, c, la, lb, lc, fov) { return function (t, S) { return { p: frame(S, a, b, c), look: frame(S, la, lb, lc), fov: fov }; }; }
    function chase() { return function (t, S) { var sp = clamp(S.speed / 150, 0, 1); return { p: frame(S, -16 - 14 * sp, 0, 4.2 + 2 * sp), look: frame(S, 30, 0, 1.2), fov: 58 }; }; }
    function cockpit(back) { return function (t, S) { return { cockpit: true, back: back || 0, fov: back ? 62 : 66 }; }; }
    function podFront() { return function (t, S) { return { attached: new THREE.Vector3(0, 0.35, -5.4), fov: 70, steady: 0.45 }; }; }
    // outside the orbit, a little behind and above the pod, keeping the Crown in the frame
    function orbitCam(back, out, up, mix, fov) { var c = new THREE.Vector3(0, 58, 0); return function (t, S) { var toC = c.clone().sub(S.p); toC.y = 0; toC.normalize(); return { p: S.p.clone().addScaledVector(toC, -out).addScaledVector(S.fwd, -back).add(new THREE.Vector3(0, up, 0)), look: S.p.clone().lerp(c, mix), fov: fov }; }; }
    function lookBetween(p, target, k, fov) { return function (t, S) { return { p: p, look: S.p.clone().lerp(target, k), fov: fov }; }; }

    var C = CROWN.C, HM = CROWN.hangar.M;
    var obsSpire = new THREE.Vector3().fromArray(C.P(116, 24, 80));
    var hangIn = new THREE.Vector3(1.6, 44.6, -4.2).applyMatrix4(HM), hangDoor = new THREE.Vector3(14.4, 44.3, 0).applyMatrix4(HM);
    var doorPt = new THREE.Vector3(-0.2, 45.2, 0).applyMatrix4(HM);
    var ship = PORT.ship.pos;
    var SH = [
      { t: 0, n: 1, k: "Arcadia Spaceport", title: "Lift-off", d: "The pod rises from the pod station. Behind it, the ship you came on stands on Pad 2, venting white vapour.",
        cuts: [[0, function (t, S) { var p = new THREE.Vector3(29655, 1.8, -112); return { p: p, look: S.p.clone().multiplyScalar(0.78).add(new THREE.Vector3(ship.x, ship.y + 20, ship.z).multiplyScalar(0.22)).add(new THREE.Vector3(0, 1.5, 0)), fov: 50 }; }],
          [9.5, follow(-30, -6, -9, 40, 0, 6, 52)], [19, flyby(24, 70, -120, -150, 44)]] },
      { t: 30, n: 2, k: "Arcadia Spaceport", title: "Over the spaceport", d: "It pitches over and turns west into the low sun. Pads, fuel tanks and the solar field slide by below.",
        cuts: [[30, follow(46, -34, 20, -160, 10, -110, 54)], [43, follow(-60, 12, 14, 200, 0, -20, 50)], [52, follow(-10, 60, 8, 20, 0, -2, 44)]] },
      { t: 62, n: 3, k: "The Dune Sea", title: "Dune Sea", d: "Down to 55 m over black dunes. Dust devils march across the plain and the pod banks between two of them.",
        cuts: [[62, follow(-6, 42, 4, 10, 0, 0, 44)], [72, flyby(79, 110, -45, -38, 48)], [84, chase()], [94, follow(38, 9, 1.5, 0, 0, 0.5, 48)]] },
      { t: 108, n: 4, k: "Crater", title: "Crater", d: "A climb over the rim of a 3 km crater. Frost fog still lies in its shadows.",
        cuts: [[W[15] - 2, follow(-45, 14, 22, 160, 0, -150, 56)], [W[16] + 3, follow(-34, 26, 40, 60, 0, -70, 56)], [W[18] - 1, follow(-40, -18, 10, 60, 0, -10, 52)]] },
      { t: W[20] - 1, n: 5, k: "The Ice Cliffs", title: "Ice Cliffs", d: "The pod drops to 45 m and follows a 100 m scarp of layered ice, blue in the shade.",
        cuts: [[W[20] - 1, flyby(W[22], 60, -90, -25, 52)], [W[22] + 1, follow(-24, -15, 3, 25, 12, 0, 58)], [W[23] + 2, follow(40, -10, 3, 0, 0, 0, 52)], [W[24] + 2, follow(-18, -26, 2, 30, 20, 8, 60)], [W[25] + 1, follow(-38, 4, 9, 300, 0, 40, 56)]] },
      { t: W[27], n: 6, k: "Dust storm", title: "Dust storm", d: "A wall of dust 2 km high rolls across the plain and the pod dives in. The sky turns dark red, static sparks crawl over the canopy and the cockpit switches to radar.",
        cuts: [[W[27], follow(-42, 10, 12, 260, 0, 50, 56)], [W[27] + 5, cockpit()], [W[29] + 1, follow(-15, 5, 3.5, 20, 0, 1, 60)], [W[30] + 2, cockpit()]] },
      { t: W[31] - 1, n: 7, k: "Breakout", title: "Breakout", d: "The pod bursts out into clear air. The sunset glows blue, Phobos crosses the sun, and ahead the Crown floats over the plain with the Orb shining at its centre.",
        cuts: [[W[31] - 1, cockpit(1)], [227.5, function (t, S) { return { sun: true, fov: 1.5 }; }], [233.5, cockpit(1)]] },
      { t: W[34] - 1, n: 8, k: "The Crown", title: "Orbit, under the ring", d: "One circle around the Crown, then in under the ring, 30 m above the Stone Garden, where nothing holds it up. The pod loops once round the Orb as the mirrors flash.",
        cuts: [[W[34] - 1, lookBetween(new THREE.Vector3().fromArray(C.P(980, 212, 58)), new THREE.Vector3(0, 60, 0), 0.55, 34)], [W[36], orbitCam(34, 30, 10, 0.55, 52)], [W[39] + 0.5, podFront()], [W[43] - 0.2, lookBetween(new THREE.Vector3(-9, 2.6, 21), new THREE.Vector3(0, 60, 0), 0.25, 64)]] },
      { t: W[46] - 1.2, n: 9, k: "The Crown", title: "Into the hangar", d: "The hangar door in the east spire opens on the garden side and the pod flies straight in as the sunset turns deep blue.",
        cuts: [[W[46] - 1.2, function (t, S) { return { p: obsSpire, look: S.p.clone().lerp(doorPt, 0.45), fov: 27 }; }]] },
      { t: W[49] - 0.6, n: 10, k: "The Crown · Arrival", title: "Welcome home", d: "The hangar closes and fills with air. The Door recognises you and opens onto the Arrival hall.",
        cuts: [[W[49] - 0.6, function (t, S) { return { p: hangIn, look: S.p.clone().lerp(hangDoor, 0.55).add(new THREE.Vector3(0, 0.3, 0)), fov: 58 }; }]] }
    ];
    var END = F.TOTAL + 9;
    function shotAt(t) { var s = SH[0]; for (var i = 0; i < SH.length; i++) if (t >= SH[i].t) s = SH[i]; return s; }
    function rigAt(t, mode) {
      if (mode === "cockpit" && t < F.WT[48]) return cockpit(0);
      if (mode === "chase" && t < F.WT[48]) return chase();
      var s = shotAt(t), r = s.cuts[0][1];
      for (var i = 0; i < s.cuts.length; i++) if (t >= s.cuts[i][0]) r = s.cuts[i][1];
      return r;
    }
    return { SH: SH, shotAt: shotAt, rigAt: rigAt, END: END };
  })();
