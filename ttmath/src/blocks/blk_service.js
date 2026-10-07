  /* ===================== The service rooms: the washrooms, one room for everyone ===================== */
  // Jim, 7 Oct 2026: "washroom not designed well. it should be modern luxury design and gender free"; "the washrooms are not
  // designed well and have many bugs". The program is campus_furnishing.py ("washrooms"; wc_suite, stone_vanity,
  // tall_cupboard). No men's and women's: along the outer wall a row of private rooms, each a room of its own with a
  // full-height walnut door, the one at the door's end wide enough for a wheelchair and standing open; on the side wall away
  // from the door a floating Carrara vanity under one long mirror lit from behind, on a wall of Nero Marquina; on the door's
  // side wall a banquette under oak slats; a cupboard in the corner by the corridor wall; the room's own plants.

  // a white wall-hung WC on its cistern panel: the panel's back at z = 0 (the wall), the bowl toward +z, a steel flush plate
  function wallWC() { return furn("wallwc", function (b) {
    var n0 = b.count(); b.box(-0.3, 0, 0.0, 0.3, 1.12, 0.18, MT.PLASTER); b.tag(n0, 99, 4);
    b.box(-0.12, 0.95, 0.18, 0.12, 1.1, 0.186, MT.STEEL);
    b.geo(new THREE.CylinderGeometry(0.18, 0.14, 0.24, 22), T(0, 0.3, 0.44, 0, 0, 0, 1, 1, 1.45), MT.CERAMIC);
    var nl = b.count(); b.geo(new THREE.CylinderGeometry(0.176, 0.176, 0.025, 22), T(0, 0.435, 0.44, 0, 0, 0, 1, 1, 1.42), MT.PLASTIC); b.tag(nl, 0, null);
  }); }
  // the private rooms along the outer wall: n about 1.4 m wide and, at the end nearer the door, one 2.2 m wide for a
  // wheelchair (grab rails, a basin, a mirror, its door standing open); walls 2.7 m high, a plaster bulkhead over them
  function wcSuites(B, rm, F) {
    var C = CRS, y = F.y, rB = C.r1 - 0.12, D = 2.05, rF = rB - D, rMd = rB - D / 2, H = 2.7, top = ceilY(rm, F.floor, rF), k;
    var d0 = F.doors.length ? F.doors[0] : F.mid, accHi = (d0 - F.a0) > (F.a1 - d0);
    var A0 = F.a0 + 0.075 / rMd, A1 = F.a1 - 0.075 / rMd, Lt = (A1 - A0) * rMd, n = Math.max(1, Math.floor((Lt - 2.2) / 1.35)), ws = (Lt - 2.2) / n, widths = [];
    for (k = 0; k < n; k++) widths.push(ws); if (accHi) widths.push(2.2); else widths.unshift(2.2);
    var acc = accHi ? widths.length - 1 : 0, edges = [A0]; widths.forEach(function (w) { edges.push(edges[edges.length - 1] + w / rMd); });
    for (k = 1; k < edges.length - 1; k++) { radWall(B, edges[k] - 0.04 / rMd, rF + 0.04, rB, y, y + H, MT.PLASTER, 4, -1); radWall(B, edges[k] + 0.04 / rMd, rF + 0.04, rB, y, y + H, MT.PLASTER, 4, 1); }
    widths.forEach(function (w, i) {
      var ac = (edges[i] + edges[i + 1]) / 2, wide = i === acc, dwR = wide ? 0.5 : 0.43, dw = dwR / rF;
      [[edges[i], ac - dw], [ac + dw, edges[i + 1]]].forEach(function (s) {
        arcWall(B, rF, s[0], s[1], y + 0.08, y + H, MT.WOOD, 2, -1); arcWall(B, rF - 0.004, s[0], s[1], y, y + 0.08, MT.PLASTIC, 0, -1, 1);   // walnut over a black plinth
        arcWall(B, rF + 0.04, s[0], s[1], y, y + H, MT.PLASTER, 4, 1); });
      arcWall(B, rF, ac - dw, ac + dw, y + 2.4, y + H, MT.WOOD, 2, -1);
      var Md = crsFrame(rF + 0.02, ac, y, ROT.out), d = new Builder(), nd = d.count();   // the door: +z toward the room
      if (wide) d.box(-dwR, 0, -2 * dwR + 0.02, -dwR + 0.04, 2.39, -0.02, MT.WOOD);           // open, in against the partition
      else { d.box(-dwR + 0.004, 0, -0.02, dwR - 0.004, 2.39, 0.02, MT.WOOD); var xp = dwR - 0.12;
        d.box(xp - 0.012, 0.8, 0.035, xp + 0.012, 1.4, 0.055, MT.BRASS); [0.86, 1.34].forEach(function (yy) { d.box(xp - 0.008, yy - 0.008, 0.02, xp + 0.008, yy + 0.008, 0.035, MT.BRASS); }); }
      kindTag(d, nd, 2);
      if (!wide) { var ni = d.count(); d.box(xp - 0.016, 1.5, 0.02, xp + 0.016, 1.532, 0.03, MT.PLASTIC); d.tag(ni, (i * 7 + 3) % 5 ? 6 : 2, null); }   // free (green) or taken (orange)
      B.add(d, Md);
      var Mw = crsFrame(rB, ac + (wide ? (accHi ? 1 : -1) * 0.45 / rB : 0), y, ROT.out);   // the WC on the outer wall, toward the door
      B.add(wallWC(), Mw); contactShadow(wallWC(), Mw);
      if (wide) {                                                                      // grab rails, a basin and a mirror, a light
        var Ms = crsFrame(rB, ac, y, ROT.out), g = new Builder(), nx = accHi ? -1.02 : 1.02;   // (its x runs toward -a) the wall by the WC at nx, the other at -nx
        tubeAlong(g, [V3(nx, 0.75, 0.25), V3(nx, 0.75, 0.95)], 0.017, 8, MT.STEEL); tubeAlong(g, [V3(nx, 0.75, 0.25), V3(nx, 1.55, 0.25)], 0.017, 8, MT.STEEL);
        [[nx, 0.75, 0.25], [nx, 0.75, 0.95], [nx, 1.55, 0.25]].forEach(function (p) { g.box(p[0] - 0.03 * Math.sign(nx), p[1] - 0.025, p[2] - 0.025, p[0] + 0.04 * Math.sign(nx), p[1] + 0.025, p[2] + 0.025, MT.STEEL); });
        latheOn(g, -nx * 0.78, 0.78, 1.3, [[0.0, 0.0], [0.1, 0.0], [0.17, 0.06], [0.18, 0.13], [0.165, 0.13], [0.15, 0.07], [0.0, 0.05]], 22, MT.CERAMIC, 0);
        var nm = g.count(); g.box(-nx * 1.03 - 0.006, 1.15, 1.0, -nx * 1.03 + 0.006, 1.85, 1.6, MT.STEEL); g.tag(nm, 9, null);
        B.add(g, Ms); var lp = V3(0, 2.45, 1.0).applyMatrix4(Ms); wLight(lp.x, lp.y, lp.z, LAMPC, 0.7, 3.5, [0, -1, 0], 1);
      }
    });
    arcWall(B, rF, A0, A1, y + H, top + 0.02, MT.PLASTER, 4, -1);                     // the bulkhead over the fronts
    flat(B, rF, rB, A0, A1, y + H, MT.PLASTER, 4, false);                            // the rooms' ceilings
    crsObst(rF - 0.05, C.r1, F.a0, F.a1, F.floor);
    return rF;
  }
  // the vanity, len along x, its back on the wall at z = 0, toward -z: Nero Marquina slabs behind, a floating Carrara slab,
  // white vessel basins every 1.2 m with brass spouts from the wall and soap between them, one long mirror on stand-offs lit
  // from behind, a walnut shelf of rolled towels under it
  function stoneVanity(L) { return furn("svanity" + L, function (b) {
    var h = L / 2, n = Math.max(2, Math.round(L / 1.2)), k;
    b.surf(1, 1, function (i, j, q) { q.p[0] = (i ? 1 : -1) * (h + 0.35); q.p[1] = j ? 2.7 : 0; q.p[2] = -0.012; q.nn = [0, 0, -1]; q.f[0] = q.p[0] + 10.3; q.f[1] = q.p[1]; q.f2[0] = 98; q.f2[1] = 3; q.m = MT.MARBLE; });
    var ns = b.count(); b.box(-h, 0.8, -0.55, h, 0.92, -0.012, MT.MARBLE); b.tag(ns, 0, 0);
    for (k = 0; k < n; k++) { var x = -h + (k + 0.5) * L / n;
      latheOn(b, x, 0.92, -0.3, [[0.0, 0.002], [0.15, 0.002], [0.2, 0.05], [0.215, 0.14], [0.2, 0.14], [0.185, 0.06], [0.13, 0.03], [0.0, 0.025]], 28, MT.CERAMIC, 0);
      tubeAlong(b, [V3(x, 1.16, -0.012), V3(x, 1.16, -0.2), V3(x, 1.1, -0.24)], 0.011, 8, MT.BRASS);
      b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), T(x, 1.16, -0.018, Math.PI / 2, 0, 0), MT.BRASS); b.box(x + 0.09, 1.12, -0.05, x + 0.11, 1.19, -0.012, MT.BRASS);
      if (k < n - 1) { var xs = x + L / n / 2, nb = b.count(); latheOn(b, xs, 0.92, -0.16, [[0.0, 0.0], [0.032, 0.0], [0.032, 0.15], [0.014, 0.17], [0.0, 0.17]], 14, MT.PLASTIC, 1); b.tag(nb, 1, null);
        b.box(xs - 0.008, 1.09, -0.17, xs + 0.008, 1.12, -0.12, MT.BRASS); }
    }
    var nm = b.count(); b.box(-h + 0.05, 1.3, -0.052, h - 0.05, 2.3, -0.046, MT.STEEL); b.tag(nm, 9, null);
    b.geo(addF2(new THREE.PlaneGeometry(L - 0.02, 1.06), 0.8, 0.0), T(0, 1.8, -0.03, 0, Math.PI, 0), MT.LIGHT, 1);
    var nw = b.count(); b.box(-h + 0.08, 0.2, -0.5, h - 0.08, 0.23, -0.012, MT.WOOD); kindTag(b, nw, 2);
    var nt = b.count(); for (var xg = -h + 0.45; xg < h - 0.3; xg += 0.9) [[-0.086, 0], [0, 0], [0.086, 0], [-0.043, 1], [0.043, 1], [0, 2]].forEach(function (c) {   // rolled towels, piled in sixes
      b.geo(new THREE.CylinderGeometry(0.042, 0.042, 0.26, 12), T(xg + c[0], 0.272 + c[1] * 0.074, -0.26, Math.PI / 2, 0, 0), MT.FABRIC); }); b.tag(nt, 7, 0);
  }); }
  // oak cupboards len along x, 2.4 high, 0.6 deep, their back at +z: a pair of doors to each 1.2 m, brass handles
  function tallCupboard(len) { return furn("tcup" + len, function (b) {
    var h = len / 2, n0 = b.count(), k; b.box(-h, 0.06, -0.3, h, 2.4, 0.3, MT.WOOD); kindTag(b, n0, 1);
    var np = b.count(); b.box(-h + 0.02, 0, -0.27, h - 0.02, 0.06, 0.3, MT.PLASTIC); for (k = 0; k <= Math.round(len / 0.6); k++) { var xs = -h + k * len / Math.round(len / 0.6); b.box(xs - 0.002, 0.08, -0.304, xs + 0.002, 2.38, -0.3, MT.PLASTIC); } b.tag(np, 1, null);
    for (k = 0; k < Math.round(len / 0.6); k++) { var xh = -h + (k + (k % 2 ? 0.12 : 0.88)) * len / Math.round(len / 0.6); b.box(xh - 0.008, 1.0, -0.33, xh + 0.008, 1.3, -0.31, MT.BRASS); }
  }); }
  function washrooms(B, rm, F, store) {
    var C = CRS, y = F.y, d0 = F.doors.length ? F.doors[0] : F.mid, doorHi = (d0 - F.a0) > (F.a1 - d0), rF = wcSuites(B, rm, F);
    // the vanity on the side wall away from the door
    var L = Math.round(Math.min(6.0, (rF - 1.9) - (C.rc + 2.2)) * 10) / 10, rv = C.rc + 2.2 + L / 2, aV = doorHi ? F.a0 + 0.075 / rv : F.a1 - 0.075 / rv;
    if (L >= 2.4) { var Mv = crsFrame(rv, aV, y, doorHi ? ROT.plusA : ROT.minusA); B.add(stoneVanity(L), Mv);
      crsObst(rv - L / 2, rv + L / 2, doorHi ? F.a0 : aV - 0.62 / rv, doorHi ? aV + 0.62 / rv : F.a1, F.floor);
      for (var k = 0; k < 3; k++) { var lp = V3((k - 1) * L / 3, 2.5, -0.7).applyMatrix4(Mv); wLight(lp.x, lp.y, lp.z, LAMPC, 0.85, 3.5, [0, -1, 0], 1); } }
    // the banquette on the door's side wall under oak slats
    var rb = C.rc + 4.2, aBw = doorHi ? F.a1 - 0.075 / rb : F.a0 + 0.075 / rb, aB = doorHi ? aBw - 0.4 / rb : aBw + 0.4 / rb;
    slatWall(B, aBw, doorHi ? -1 : 1, C.rc + 2.7, C.rc + 5.7, y, y + 2.7);
    crsPlace(B, banquette(2.4, 7), rb, aB, y, doorHi ? ROT.minusA : ROT.plusA); crsObst(rb - 1.25, rb + 1.25, Math.min(aB, aBw) - 0.35 / rb, Math.max(aB, aBw) + 0.35 / rb, F.floor);
    // a cupboard in the corridor wall's far corner (T06-14: its store, a run of them)
    var avail = Math.abs(d0 - (doorHi ? F.a0 : F.a1)) * C.rc - 0.5 - 1.1, cl = store ? Math.min(3.6, Math.floor(avail / 1.2) * 1.2) : 1.2, rcu = C.rc + 0.075 + 0.3;
    if (cl >= 1.2) { var acu = doorHi ? F.a0 + (0.075 + cl / 2 + 0.05) / rcu : F.a1 - (0.075 + cl / 2 + 0.05) / rcu; crsPlace(B, tallCupboard(cl), rcu, acu, y, ROT.out);
      crsObst(C.rc, rcu + 0.32, acu - (cl / 2 + 0.02) / rcu, acu + (cl / 2 + 0.02) / rcu, F.floor); }
    if ((P2.ring.fountains || []).indexOf(rm.code) >= 0 && rm.doors && rm.doors.length) {   // a bottle filler on the corridor wall beside the door
      var sd = F.mid > d0 ? 1 : -1, rf = C.rc - C.wall / 2, af = d0 + sd * 1.15 / rf;
      crsPlace(B, bottleFiller(), rf, af, y, ROT["in"]); crsObst(rf - 0.5, rf, af - 0.3 / rf, af + 0.3 / rf, F.floor);
    }
    roomPlants(B, rm, F, null);
  }
