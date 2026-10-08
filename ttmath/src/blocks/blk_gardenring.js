  /* ===================== Phase 2: the garden ring (T09-01) and the sunken grove (T09-06) ===================== */
  // Jim, 5 Oct 2026: "all open space should be covered by dome or sealed". The garden all the way round the dome, between
  // it and the Ring, under one glass vault on bronze ribs. The vault springs from the dome's own glass (P2.garden_ring.spring,
  // lower where the line of sight from the start is low), so the dome rises out of a glass garden and the palace's front
  // door stands under it; it lands on the Ring's eave, or on a low wall where the Ring is sunk; its crown follows the line
  // of sight (P2.garden_ring.crown). On the left front the garden drops 5.6 m into the sunken grove under flat glass at
  // ground level, reached from the Ring's lower corridor: tall trees, a pond. Basalt paths, beds of trees and plants of
  // every kind, oak benches, the armillary sundial from the Sun court, uplights on the ribs.
  // Angles as the Ring's (degrees from straight behind the dome, positive toward +lat; crsPt, ringDeg).
  var GRD = null, GRD_GLASS = new Builder();
  function grCrown(deg) {
    var K = P2.garden_ring.crown, a = ((deg + 80) % 360 + 360) % 360 - 80;
    if (a <= K[0][0]) return K[0][1];
    for (var i = 0; i < K.length - 1; i++) if (a <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], (a - K[i][0]) / (K[i + 1][0] - K[i][0]));
    return K[K.length - 1][1];
  }
  // the vault's section at angle deg: from the dome's glass (rIn, yIn) to the Ring's eave (rOut, yOut), a parabola with its
  // top at the crown (c, at rm)
  function grSection(deg) {
    deg = ((deg + 57) % 360 + 360) % 360 - 57;
    var G = P2.garden_ring, C = CRS, s = secAt(deg), hs = Math.min(G.spring, grCrown(deg) - 1.0);
    var rIn = PAL.R * Math.sqrt(Math.max(0, 1 - Math.pow((hs - PAL.beam) / (PAL.H - PAL.beam), 2))) + 0.06, yIn = PALY.B + hs;
    var rOut = C.roofIn - 0.05, yOut = s.kind === "sunk" ? PALY.B + 0.6 : ringRoofY(C.roofIn, deg) - C.roofT - 0.06;
    var c = Math.max(PALY.B + grCrown(deg), Math.max(yIn, yOut) + 0.3), q = Math.sqrt((c - yIn) / (c - yOut)), rm = (rIn + q * rOut) / (1 + q);
    return { rIn: rIn, yIn: yIn, rOut: rOut, yOut: yOut, c: c, rm: rm, k: (c - yIn) / Math.pow(rm - rIn, 2) };
  }
  function grY(S, r) { return S.c - S.k * Math.pow(r - S.rm, 2); }
  function grInGrove(deg) { var g = P2.garden_ring.grove.a; return deg >= g[0] && deg < g[1]; }
  // the palace's front vault and the back door's vestibule stand in the garden: its floor and beds keep out of them
  function grInPalace(r, deg) {
    var p = crsPt(r, deg * D2R), o = palLoc(p.x, p.z, {});
    if (o.rad > 0 && o.rad < PAL.vFront + 0.4 && Math.abs(o.lat) < vaultW(Math.min(o.rad, PAL.vFront)) + PAL.vt + 0.15) return true;
    return o.rad < 0 && -o.rad < BACK.r1 + 0.5 && Math.abs(o.lat) < BACK.w + BACK.wall + 0.3;
  }
  function gardenRing(B) {
    var C = crsInit(), GR = P2.garden_ring, yU = PALY.B, yL = C.yL, r0 = PAL.ringOut, r1 = C.r0 - 0.2, D = D2R, gv = GR.grove.a, R2 = mulberry(4040);
    GRD = { posts: [], rim: [gv[0], gv[1]] };
    B.zone = ZONE.OUT;
    // the floor: basalt paving all round at the palace's level, out of the vault's and the vestibule's footprints and the grove
    var NA = 720, NR = 22;
    for (var i = 0; i < NA; i++) {
      var d0 = -57 + 360 * i / NA, d1 = -57 + 360 * (i + 1) / NA; if (grInGrove((d0 + d1) / 2)) continue;
      for (var j = 0; j < NR; j++) {
        var ra = lerp(r0, r1, j / NR), rb = lerp(r0, r1, (j + 1) / NR); if (grInPalace((ra + rb) / 2, (d0 + d1) / 2)) continue;
        B.surf(1, 1, function (u, v, q) { var a = (u ? d1 : d0) * D, r = v ? rb : ra, p = crsPt(r, a); q.p[0] = p.x; q.p[1] = yU; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = p.x; q.f[1] = p.z; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE; });
      }
    }
    // through the dome's ring where the glass links came in: the floor across the gap, a bronze portal round each opening
    [-1, 1].forEach(function (sg) {
      var n = 6; B.surf(n, 4, function (u, v, q) { var ll = lerp(-LINK.w + 0.05, LINK.w - 0.05, u / n), sl = lerp(PAL.ringIn - 0.4, PAL.ringOut + 0.4, v / 4), p = linkXZ(sg, ll, sl); q.p[0] = p.x; q.p[1] = yU + 0.005; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = ll; q.f[1] = sl; q.m = MT.BALSTONE; });
      var pts = []; for (var k = 0; k <= 24; k++) { var ll2 = -LINK.w * Math.cos(Math.PI * k / 24), pp = linkXZ(sg, ll2 * 1.03, PAL.ringOut + 0.08); pts.push(new THREE.Vector3(pp.x, yU + linkArch(ll2) + 0.06, pp.z)); }
      tubeAlong(B, pts, 0.07, 6, MT.RIB, 3);
    });
    // the vault: glass from the dome to the Ring, bronze ribs every 2.5 degrees, purlins, a gutter on the dome, a beam on the Ring
    var NV = 24, NAv = 288;
    function vaultPatch(dA, dB) {
      var n = Math.max(2, Math.round((dB - dA) / 360 * NAv));
      GRD_GLASS.surf(n, NV, function (u, v, q) { var deg = lerp(dA, dB, u / n), S = grSection(deg), r = lerp(S.rIn, S.rOut, v / NV), p = crsPt(r, deg * D), dd = crsPt(1, deg * D), sl = -2 * S.k * (r - S.rm), L = Math.hypot(1, sl);
        q.p[0] = p.x; q.p[1] = grY(S, r); q.p[2] = p.z; q.nn = [(dd.x - PAL.c.x) * -sl / L, 1 / L, (dd.z - PAL.c.z) * -sl / L]; q.f[0] = deg * D * r; q.f[1] = r; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    }
    vaultPatch(gv[1], gv[0] + 360);
    for (var dr = gv[1]; dr <= gv[0] + 360 + 1e-6; dr += 2.5) {
      var S = grSection(dr), pts = []; for (var k2 = 0; k2 <= 24; k2++) { var rr = lerp(S.rIn, S.rOut, k2 / 24), pr = crsPt(rr, dr * D); pts.push(new THREE.Vector3(pr.x, grY(S, rr) - 0.06, pr.z)); }
      tubeAlong(B, pts, (Math.abs(dr - gv[1]) < 1e-3 || Math.abs(dr - gv[0] - 360) < 1e-3) ? 0.1 : 0.065, 6, MT.RIB);
    }
    [0.0, 0.22, 0.45, 0.68, 0.88, 1.0].forEach(function (t, ti) {
      var pts = []; for (var k3 = 0; k3 <= 240; k3++) { var deg = lerp(gv[1], gv[0] + 360, k3 / 240), S = grSection(deg), rr = lerp(S.rIn, S.rOut, t), pr = crsPt(rr, deg * D); pts.push(new THREE.Vector3(pr.x, grY(S, rr) - (ti === 0 || ti === 5 ? 0.1 : 0.08), pr.z)); }
      tubeAlong(B, pts, ti === 0 ? 0.09 : ti === 5 ? 0.12 : 0.04, 6, MT.RIB);
    });
    // the sunk quarter: the vault lands on a low wall at the Ring's edge; the grove's flat glass at ground level, its ends
    var gy = yU + GR.grove.roof;
    [[197, gv[0], yU + 0.6], [gv[0], gv[1], gy], [gv[1], 303, yU + 0.6]].forEach(function (w) {
      arcWall(B, r1, w[0] * D, w[1] * D, yU - 0.45, w[2], MT.CONCRETE, 0, -1, 3); arcWall(B, r1 + 0.25, w[0] * D, w[1] * D, yU - 0.45, w[2], MT.CONCRETE, 0, 1, 3);
      flat(B, r1, r1 + 0.25, w[0] * D, w[1] * D, w[2], MT.CONCRETE, 0, true);
    });
    var ng = Math.round((gv[1] - gv[0]) * 2);
    GRD_GLASS.surf(ng, 12, function (u, v, q) { var deg = lerp(gv[0], gv[1], u / ng), r = lerp(PAL.R - 0.05, r1, v / 12), p = crsPt(r, deg * D); q.p[0] = p.x; q.p[1] = gy; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = deg * D * r; q.f[1] = r; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    for (var dg = gv[0]; dg <= gv[1] + 1e-6; dg += 2.0) { var pa = crsPt(PAL.R, dg * D), pb = crsPt(r1, dg * D); tubeAlong(B, [new THREE.Vector3(pa.x, gy - 0.06, pa.z), new THREE.Vector3(pb.x, gy - 0.06, pb.z)], 0.05, 6, MT.RIB); }
    gv.forEach(function (dg2, e) {                                                          // the gables between the flat glass and the vault, the rim
      var S = grSection(dg2), a = dg2 * D, t = crsPt(1, a + Math.PI / 2), sg = e ? -1 : 1, nn = [(t.x - PAL.c.x) * sg, 0, (t.z - PAL.c.z) * sg], n = 24;
      GRD_GLASS.surf(n, 1, function (u, v, q) { var r = lerp(S.rIn, S.rOut, u / n), p = crsPt(r, a); q.p[0] = p.x; q.p[1] = v ? grY(S, r) - 0.04 : gy; q.p[2] = p.z; q.nn = nn; q.f[0] = r; q.f[1] = q.p[1]; q.f2[0] = v ? 4 : 0.1; q.f2[1] = 1; q.m = 0; });
      GRD_GLASS.surf(n, 1, function (u, v, q) { var r = lerp(r0 + 0.1, r1, u / n), p = crsPt(r, a); q.p[0] = p.x; q.p[1] = v ? gy - 0.05 : yU + 0.05; q.p[2] = p.z; q.nn = nn; q.f[0] = r; q.f[1] = q.p[1]; q.f2[0] = v ? 1 : 0.05; q.f2[1] = 1; q.m = 0; });
      for (var rr2 = r0 + 1.5; rr2 < S.rOut - 0.5; rr2 += 1.5) { var pm = crsPt(rr2, a); tubeAlong(B, [new THREE.Vector3(pm.x, yU, pm.z), new THREE.Vector3(pm.x, grY(S, rr2) - 0.08, pm.z)], 0.04, 5, MT.RIB); }
      var rl = [crsPt(r0 + 0.1, a), crsPt(r1, a)]; tubeAlong(B, rl.map(function (p) { return new THREE.Vector3(p.x, gy - 0.02, p.z); }), 0.05, 6, MT.RIB);
      // the grove's end walls, from its floor up to the garden's
      radWall(B, a + sg * 0.004, r0, r1, yL - 0.05, yU, MT.CONCRETE, 0, sg, 3);
    });
    arcWall(B, r0 + 0.02, gv[0] * D, gv[1] * D, yL - 0.05, yU, MT.CONCRETE, 0, 1, 3);           // the grove's wall on the dome's side
    flat(B, r0, r1, gv[0] * D, gv[1] * D, yL, MT.PAVE, 0, true);                                   // its floor
    // the grove: a long pond, tall trees in beds, ferns, benches along the Ring's glass
    var pc = 248 * D, pr0 = 31.6, pr1 = 34.4;
    arcWall(B, pr0, pc - 9 * D, pc + 9 * D, yL, yL + 0.42, MT.CONCRETE, 0, -1, 3); arcWall(B, pr1, pc - 9 * D, pc + 9 * D, yL, yL + 0.42, MT.CONCRETE, 0, 1, 3);
    flat(B, pr0, pr1, pc - 9 * D, pc + 9 * D, yL + 0.3, MT.DKGLASS, 0, true);                       // the water
    [[pc - 9 * D, 1], [pc + 9 * D, -1]].forEach(function (e) { radWall(B, e[0], pr0, pr1, yL, yL + 0.42, MT.CONCRETE, 0, -e[1], 3); });
    GRD.posts.push({ grove: 1, r0: pr0 - 0.3, r1: pr1 + 0.3, a0: pc - 9.3 * D, a1: pc + 9.3 * D });
    [[230, 38.5, "fig"], [237, 31.0, "kentia"], [244, 39.8, "olive"], [256, 39.6, "maple"], [262, 31.2, "kentia"], [268, 38.2, "fig"], [275, 33.0, "strelitzia"]].forEach(function (t, n) {
      var c = crsPt(t[1], t[0] * D); latheOn(B, c.x, yL, c.z, [[1.5, 0], [1.5, 0.45], [1.56, 0.5], [1.42, 0.52], [1.42, 0.44], [0, 0.44]], 32, MT.CONCRETE, 0.4);
      B.geo(new THREE.CylinderGeometry(1.4, 1.4, 0.02, 32), T(c.x, yL + 0.44, c.z), MT.RUBBER, 1);
      bedPlantKept(B, t[2], 700 + n, crsFrame(t[1], t[0] * D, yL), R2() * 6.28, 0.45, 3.2, t[1] - PAL.ringOut - 0.5, CRS.r0 - t[1] - 0.5, yU + GR.grove.roof - 0.35 - yL);   // under the grove's glass, clear of the palace's foot
      GRD.posts.push({ x: c.x, z: c.z, r: 1.8, low: 1 });
    });
    // the garden: trees in big round planters between the paths to the doors, ferns and flowering plants along the dome's foot
    var keep = [-50, -25, 0, 25, 50, 75, 100, 125, 150, 160, 174, 180, 186, 200].map(function (d) { return d; });
    function clear(deg, w) { return !keep.some(function (k) { return Math.abs(((deg - k) % 360 + 540) % 360 - 180) < w; }); }
    var trees = ["olive", "maple", "kentia", "fig", "strelitzia", "maple", "olive", "kentia"], nT = 0;
    for (var dt = -45; dt < 197; dt += 12.5) {
      if (!clear(dt, 4.5) || grInPalace(37.4, dt)) continue;
      var kind = trees[nT % trees.length], c2 = crsPt(37.4, dt * D), rr3 = 1.2; nT++;
      latheOn(B, c2.x, yU, c2.z, [[rr3, 0], [rr3, 0.62], [rr3 + 0.06, 0.66], [rr3 - 0.08, 0.68], [rr3 - 0.08, 0.6], [0.0, 0.6]], 32, MT.CONCRETE, 0.4);
      B.geo(new THREE.CylinderGeometry(rr3 - 0.1, rr3 - 0.1, 0.02, 32), T(c2.x, yU + 0.6, c2.z), MT.RUBBER, 1);
      bedPlant(B, kind, 500 + nT, T(c2.x, yU, c2.z, 0, R2() * 6.28, 0), 0.61, 2.3);
      GRD.posts.push({ x: c2.x, z: c2.z, r: rr3 + 0.3 });
      extLight(c2.x, yU + 0.8, c2.z, WARMC, 1.0, 6, [0, 1, 0], 1.6);
    }
    for (var dt2 = 280; dt2 < 304; dt2 += 12) { if (!clear(dt2, 4) || grInGrove(dt2)) continue; var c4 = crsPt(37.4, dt2 * D); latheOn(B, c4.x, yU, c4.z, [[1.2, 0], [1.2, 0.62], [1.26, 0.66], [1.12, 0.68], [1.12, 0.6], [0, 0.6]], 32, MT.CONCRETE, 0.4); B.geo(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 32), T(c4.x, yU + 0.6, c4.z), MT.RUBBER, 1); bedPlant(B, dt2 < 290 ? "maple" : "olive", 560 + dt2, T(c4.x, yU, c4.z, 0, R2() * 6.28, 0), 0.61, 2.3); GRD.posts.push({ x: c4.x, z: c4.z, r: 1.5 }); }
    // long oak benches facing the Ring, between the trees
    for (var db = -38.75; db < 197; db += 25) {
      if (!clear(db, 3) || grInPalace(42.0, db)) continue;
      var c3 = crsPt(42.0, db * D), yaw = Math.atan2(PAL.c.x - c3.x, PAL.c.z - c3.z), gb = new Builder();
      for (var k5 = 0; k5 < 5; k5++) { gb.box(-1.4, 0.43, -0.25 + k5 * 0.1, 1.4, 0.47, -0.17 + k5 * 0.1, MT.WOOD); gb.tag(gb.count() - 24, null, 2); }
      [-1.05, 1.05].forEach(function (x) { gb.box(x - 0.2, 0, -0.24, x + 0.2, 0.43, 0.24, MT.CONCRETE); });
      B.add(gb, T(c3.x, yU, c3.z, 0, yaw, 0)); GRD.posts.push({ x: c3.x, z: c3.z, r: 0.75 });
    }
    // the beds (v0.45): planted like a tropical house under glass, in drifts, along the dome's foot and along the Ring's glass
    // between its doors (P2.garden_ring.beds): a low concrete curb, dark soil, the plants at their real size set into it
    var BD = GR.beds, bedRuns = [];
    function bedSegs(rA, rB, path) {                   // the runs of angle clear of the paths, the palace's vault and vestibule, the grove
      var out = [], cur = null, rm = (rA + rB) / 2;
      for (var d = -50; d <= 310.001; d += 0.25) {
        var ok = d < 309.9 && !grInGrove(d) && keep.every(function (k) { return Math.abs(((d - k) % 360 + 540) % 360 - 180) * D * rm > path; }) && !grInPalace(rA, d) && !grInPalace(rB, d) && !grInPalace(rm, d);
        if (ok && cur === null) cur = d; else if (!ok && cur !== null) { if ((d - 0.25 - cur) * D * rm > 2.0) out.push([cur, d - 0.25]); cur = null; }
      }
      return out;
    }
    function bedRun(rA, rB, s, rows, seed0) {
      var a0 = s[0] * D, a1 = s[1] * D, hc = BD.curb, t = 0.12, ys = hc - 0.04;
      arcWall(B, rA, a0, a1, yU, yU + hc, MT.CONCRETE, 0, -1, 0.4); arcWall(B, rB, a0, a1, yU, yU + hc, MT.CONCRETE, 0, 1, 0.4);
      arcWall(B, rA + t, a0, a1, yU + ys, yU + hc, MT.CONCRETE, 0, 1, 0.4); arcWall(B, rB - t, a0, a1, yU + ys, yU + hc, MT.CONCRETE, 0, -1, 0.4);
      flat(B, rA, rA + t, a0, a1, yU + hc, MT.CONCRETE, 0, true); flat(B, rB - t, rB, a0, a1, yU + hc, MT.CONCRETE, 0, true);
      radWall(B, a0, rA, rB, yU, yU + hc, MT.CONCRETE, 0, -1, 0.4); radWall(B, a1, rA, rB, yU, yU + hc, MT.CONCRETE, 0, 1, 0.4);
      flat(B, rA + t, rB - t, a0, a1, yU + ys, MT.RUBBER, 0, true);
      rows.forEach(function (row, ri) {                 // each row in drifts of three of a kind
        var r = rA + row[0], n = Math.max(1, Math.floor((a1 - a0) * r / row[1])), da = (a1 - a0) / n;
        for (var i = 0; i < n; i++) {
          var kind = row[3][(Math.floor(i / BD.drift) + seed0 + ri) % row[3].length], a = a0 + da * (i + 0.5) + (R2() - 0.5) * da * 0.3, rr = r + (R2() - 0.5) * 0.2, p = crsPt(rr, a);
          bedPlantReal(B, kind, 900 + (seed0 * 5 + i * 3 + ri) % 6, T(p.x, yU, p.z, 0, R2() * 6.28, 0), ys, row[2] * (0.9 + 0.2 * R2()));
        }
      });
      GRD.posts.push({ bed: 1, r0: rA - 0.05, r1: rB + 0.05, a0: a0 - 0.05 / rA, a1: a1 + 0.05 / rA }); bedRuns.push([rA, rB, a0, a1]);
    }
    var bi = BD.inner, rIa = r0 + bi.r, rIb = rIa + bi.depth, bo = BD.outer, rOb = r1 - bo.r, rOa = rOb - bo.depth;
    bedSegs(rIa, rIb, bi.path).forEach(function (s, n) { bedRun(rIa, rIb, s, bi.rows, n); });
    bedSegs(rOa, rOb, bo.path).forEach(function (s, n) { bedRun(rOa, rOb, s, bo.rows, n + 3); });
    function inBed(r, a) { return bedRuns.some(function (b) { return r > b[0] && r < b[1] && a > b[2] && a < b[3]; }); }
    // uplights along the dome's foot washing the ribs
    for (var d7 = -55; d7 < 302; d7 += 10) { if (grInGrove(d7) || !clear(d7, 2) || grInPalace(PAL.ringOut + 0.4, d7)) continue; var p7 = crsPt(PAL.ringOut + 0.45, d7 * D), q7 = crsPt(1, d7 * D);
      var yb7 = inBed(PAL.ringOut + 0.45, d7 * D) ? BD.curb - 0.04 : 0;                  // in a bed: on its soil
      B.geo(addF2(new THREE.CylinderGeometry(0.07, 0.08, 0.06, 12), 1.5, 0), T(p7.x, yU + yb7 + 0.03, p7.z), MT.LIGHT, 1);
      extLight(p7.x, yU + yb7 + 0.2, p7.z, WARMC, 1.4, 9, [(q7.x - PAL.c.x) * 0.55, 0.83, (q7.z - PAL.c.z) * 0.55], 2); }
    // the armillary sundial from the Sun court
    var sd = GR.sundial, cs = crsPt(sd.r, sd.a * D); sundial(B, cs, yU); GRD.posts.push({ x: cs.x, z: cs.z, r: 1.35 });
  }
  // where you can stand in the garden ring: its floor, round the planters and benches, kept from the grove's rim; the grove
  function gardenSupport(x, z, yf) {
    if (!GRD) return undefined;
    var C = CRS, o = crsLoc(x, z), r = o.r, deg = ringDeg(o.a), yU = PALY.B, gv = GRD.rim;
    if (r < PAL.ringOut - 0.05 || r > C.r0 - 0.35) return undefined;      // the Ring's glass and the low wall: the Ring's own
    if (grInGrove(deg)) {
      if (yf > (yU + C.yL) / 2) return NaN;                                  // the rim: a glass balustrade
      for (var i = 0; i < GRD.posts.length; i++) { var g = GRD.posts[i]; if (g.grove) { var a = deg * D2R; if (r > g.r0 && r < g.r1 && a > g.a0 && a < g.a1) return NaN; } else if (g.low && Math.hypot(x - g.x, z - g.z) < g.r) return NaN; }
      if ((deg - gv[0]) * D2R * r < 0.3 || (gv[1] - deg) * D2R * r < 0.3 || r < PAL.ringOut + 0.3) return NaN;
      return C.yL;
    }
    if (Math.abs(deg - gv[0]) * D2R * r < 0.3 || Math.abs(deg - gv[1]) * D2R * r < 0.3) return NaN;
    for (var j = 0; j < GRD.posts.length; j++) { var p = GRD.posts[j];
      if (p.bed) { var ab = o.a; if (r > p.r0 && r < p.r1 && ((ab > p.a0 && ab < p.a1) || (ab + 2 * Math.PI > p.a0 && ab + 2 * Math.PI < p.a1) || (ab - 2 * Math.PI > p.a0 && ab - 2 * Math.PI < p.a1))) return NaN; continue; }
      if (!p.grove && !p.low && Math.hypot(x - p.x, z - p.z) < p.r) return NaN; }
    return yU;
  }
  function gardenInside(x, z) { if (!GRD) return 0; var o = crsLoc(x, z); return o.r > PAL.ringOut && o.r < CRS.r0 ? 1 : 0; }
  // the armillary sundial (T16-01): its rod parallel to Mars's axis (Gale crater is 5.4 deg south, so the rod points south
  // and 5.4 deg up), an equatorial hour band marked for the day hours of the sol, on a turned concrete pedestal
  function sundial(B, c, g0) {
    var plinth = 0.6, R = 1.1, yc = g0 + plinth + R, phi = 5.4 * D2R;
    var O = new THREE.Vector3(c.x, yc, c.z), A = new THREE.Vector3(0, Math.sin(phi), Math.cos(phi));          // the polar axis
    var U = new THREE.Vector3(1, 0, 0), V = new THREE.Vector3().crossVectors(A, U);                              // the equator's plane
    function bronze(g) { return addF2(g, 0, 7); }
    var pl = new Builder();
    latheOn(pl, 0, 0, 0, [[0.0, 0], [0.5, 0], [0.5, 0.2], [0.44, 0.24], [0.36, 0.3], [0.33, plinth + 0.05], [0.4, plinth + 0.1], [0.4, plinth + 0.15], [0.0, plinth + 0.15]], 32, MT.CONCRETE);
    for (var n = 0, nf = pl.count() * 2; n < nf; n++) pl.f[n] = 0.45 + 0.035 * pl.f[n];
    B.add(pl, T(c.x, g0 - 0.15, c.z));
    B.geo(bronze(new THREE.TorusGeometry(R, 0.03, 8, 128)), T(c.x, yc, c.z, 0, Math.PI / 2, 0), MT.BRASS);
    B.geo(bronze(new THREE.TorusGeometry(R * 0.985, 0.022, 8, 128)), T(c.x, yc, c.z, Math.PI / 2, 0, 0), MT.BRASS);
    B.geo(bronze(new THREE.BoxGeometry(0.16, 0.08, 0.1)), T(c.x, g0 + plinth + 0.03, c.z), MT.BRASS);
    var Re = R - 0.045, hw = 0.09, th = 0.015, NT = 128;
    function bandPt(t, r, w) { return O.clone().addScaledVector(U, Math.cos(t) * r).addScaledVector(V, Math.sin(t) * r).addScaledVector(A, w); }
    [[Re - th, -1], [Re + th, 1]].forEach(function (f) {
      B.surf(NT, 1, function (i, j, q) { var t = i / NT * 2 * Math.PI, p = bandPt(t, f[0], j ? hw : -hw), nn = bandPt(t, 1, 0).sub(O).multiplyScalar(f[1]);
        q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [nn.x, nn.y, nn.z]; q.f[0] = t * Re; q.f[1] = j * 2 * hw; q.f2[1] = 7; q.m = MT.BRASS; }, true);
    });
    [-1, 1].forEach(function (e) {
      B.surf(NT, 1, function (i, j, q) { var t = i / NT * 2 * Math.PI, p = bandPt(t, j ? Re + th : Re - th, e * hw); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [A.x * e, A.y * e, A.z * e]; q.f2[1] = 7; q.m = MT.BRASS; }, true);
    });
    for (var hr = 6; hr <= 18; hr++) {
      var t = Math.PI + (hr - 6) * Math.PI / 12, rd = bandPt(t, 1, 0).sub(O), tg = new THREE.Vector3().crossVectors(A, rd), big = hr % 3 === 0;
      var M = new THREE.Matrix4().makeBasis(tg, A, rd.clone().negate()); M.setPosition(bandPt(t, Re - th - 0.003, 0));
      B.geo(new THREE.BoxGeometry(big ? 0.016 : 0.009, hw * (big ? 1.8 : 1.1), 0.006), M, MT.BRASS);
    }
    var rot = Math.PI / 2 - phi;
    B.geo(bronze(new THREE.CylinderGeometry(0.018, 0.018, 2 * R + 0.3, 12)), T(c.x, yc, c.z, rot, 0, 0), MT.BRASS);
    var tip = O.clone().addScaledVector(A, R + 0.24); B.geo(bronze(new THREE.ConeGeometry(0.055, 0.18, 14)), T(tip.x, tip.y, tip.z, rot, 0, 0), MT.BRASS);
    var tail = O.clone().addScaledVector(A, -R - 0.1);
    [0, Math.PI / 2].forEach(function (a) { var Mt = T(tail.x, tail.y, tail.z, rot, 0, 0).multiply(new THREE.Matrix4().makeRotationY(a)); B.geo(bronze(new THREE.BoxGeometry(0.11, 0.16, 0.006)), Mt, MT.BRASS); });
    var lp = { x: c.x + 1.6, z: c.z + 0.6 }, dl = new THREE.Vector3(c.x - lp.x, yc - g0, c.z - lp.z).normalize();
    B.box(lp.x - 0.09, g0 - 0.05, lp.z - 0.09, lp.x + 0.09, g0 + 0.07, lp.z + 0.09, MT.ANOD);
    extLight(lp.x, g0 + 0.1, lp.z, WARMC, 1.3, 7, [dl.x, dl.y, dl.z], 1);
  }
