  /* ===================== The campus: one building around a courtyard ===================== */
  // Two curved wings sweep from the dome toward the ridge and frame a paved courtyard; a gateway closes it at the
  // avenue end and glass links join each wing to the dome. Classrooms, the café, reception and library are in the wings.
  // Wing frame: s = distance along the palace axis (as rad), u = depth into the wing from the courtyard facade.
  var WG = { sA: 33.3, sB: 77.7, D: 8.6, ov: 1.2, uB: 5.6, ew: 0.15, ei: 0.1,
    rooms: {
      "1": [{ s0: 33.3, s1: 37.0, y: 1.0, kind: "foyer", door: [3.3, 4.7] }, { s0: 37.0, s1: 49.0, y: 0.85, kind: "math", door: [4.1, 5.3] },
            { s0: 49.0, s1: 57.0, y: 0.55, kind: "lobby", door: [4.1, 5.3], entry: 53.0 }, { s0: 57.0, s1: 67.0, y: 0.6, kind: "lab", door: [4.1, 5.3] },
            { s0: 67.0, s1: 77.7, y: 0.25, kind: "seminar" }],
      "-1": [{ s0: 33.3, s1: 37.0, y: -0.05, kind: "foyer", door: [3.3, 4.7] }, { s0: 37.0, s1: 50.0, y: -0.45, kind: "cafe", door: [4.1, 5.3] },
             { s0: 50.0, s1: 58.0, y: -0.3, kind: "reception", door: [4.1, 5.3], entry: 54.0 }, { s0: 58.0, s1: 68.0, y: 0.1, kind: "library", door: [4.1, 5.3] },
             { s0: 68.0, s1: 77.7, y: 0.5, kind: "study" }]
    } };
  var LINK = { th: 20 * D2R, sIn: 27.4, w: 1.6, h: 3.0, pl: 0.35, wo: 2.0 };
  var LS = Math.sin(LINK.th), LC20 = Math.cos(LINK.th);
  function latf(s) { var k = (s - 55.5) / 22.5; return 10.5 - 1.5 * k * k; }
  function wingH(s) { return 4.3 + 2.9 * (WG.sB - s) / (WG.sB - WG.sA); }
  function wingXZ(sg, u, s) { return palXZ(sg * (latf(s) + u), s); }
  function wingRooms(sg) { return WG.rooms[sg > 0 ? "1" : "-1"]; }
  function wingRoomIdx(sg, s) { var R = wingRooms(sg); for (var i = 0; i < R.length - 1; i++) if (s < R[i].s1) return i; return R.length - 1; }
  function wingRoom(sg, s) { return wingRooms(sg)[wingRoomIdx(sg, s)]; }
  function wingFloor(sg, s) { return wingRoom(sg, clamp(s, WG.sA, WG.sB)).y; }
  function wingBase(sg, s) { var a = 0, n = 0; for (var d = -3; d <= 3; d += 1) { a += wingFloor(sg, clamp(s + d, WG.sA, WG.sB)); n++; } return a / n; }
  function roofProf(t) { return Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.75) + 0.09 * Math.sin(Math.PI * t); }
  // roof surface at along-position s and across-parameter t (0 = canopy edge, 1 = where it meets the ground); inner = the ceiling
  function roofPt(sg, s, t, inner) {
    var sc = clamp(s, WG.sA, WG.sB), u = t * (WG.D + WG.ov) - WG.ov, p = wingXZ(sg, u, s), yb = wingBase(sg, sc), y = yb + wingH(sc) * roofProf(t) - (inner ? 0.35 : 0);
    var g = cgH(p.x, p.z), k = smoothstep(0, 2.2, y - yb);
    p.y = inner ? y : y * k + (g - 0.25) * (1 - k); p.u = u; p.g = g; return p;
  }
  function roofT(u) { return (u + WG.ov) / (WG.D + WG.ov); }
  function roofYAt(sg, s, u, inner) { return roofPt(sg, s, roofT(u), inner).y; }
  // links: sl = distance from the dome centre along the link, ll = sideways (positive away from the palace axis)
  function linkXZ(sg, ll, sl) { return palXZ(sg * (LS * sl + LC20 * ll), LC20 * sl - LS * ll); }
  function linkLoc(sg, lat, rad) { var a = sg * lat; return { sl: a * LS + rad * LC20, ll: a * LC20 - rad * LS }; }
  function linkSlAt(ll, s) { return (s + LS * ll) / LC20; }           // where the plane s = const crosses the link
  function linkU(ll, s) { var sl = linkSlAt(ll, s); return LS * sl + LC20 * ll - latf(s); }
  function linkSteps(sg) { var y0 = PALY.B, y1 = wingRooms(sg)[0].y, d = y1 - y0, n = Math.abs(d) > 0.3 ? Math.ceil(Math.abs(d) / 0.18) : 0; return { y0: y0, y1: y1, n: n, a: 29.6, run: 0.55 }; }
  function linkFloorY(sg, sl) { var L = linkSteps(sg); if (!L.n) return lerp(L.y0, L.y1, smoothstep(29.0, 33.4, sl)); var k = clamp(Math.floor((sl - L.a) / L.run) + 1, 0, L.n); return L.y0 + (L.y1 - L.y0) * k / L.n; }
  function linkBase(sg, sl) { var L = linkSteps(sg); return lerp(L.y0, L.y1, L.n ? smoothstep(L.a - 0.3, L.a + L.n * L.run + 0.3, sl) : smoothstep(29.0, 33.4, sl)); }
  function linkArch(ll) { var x = clamp(ll / LINK.w, -1, 1); return LINK.pl + (LINK.h - LINK.pl) * Math.pow(Math.max(0, 1 - x * x), 0.5); }
  // the opening a link makes in a plane s = const: lowest solid height at depth u (undefined outside the opening)
  function linkCutY(sg, s, u) {
    var uc = linkU(0, s), ll = (u - uc) * LC20; if (Math.abs(ll) > LINK.wo) return undefined;
    var sl = linkSlAt(ll, s); return Math.abs(ll) < LINK.w ? linkBase(sg, sl) + linkArch(ll) + 0.03 : linkBase(sg, sl) + LINK.pl;
  }

  var campusLights = [], wingLights = [], palLights = [];
  function extLight(x, y, z, c, k, range, dir, lobe) { campusLights.push({ x: x, y: y, z: z, c: [c[0] * k, c[1] * k, c[2] * k], r: range, d: dir || null, lobe: lobe || 0 }); }
  var WARMC = [1.0, 0.82, 0.62];
  var DOORS = [];
  function yawOf(d) { return Math.atan2(d.x, d.z); }
  function alongDir(sg, s) { var a = wingXZ(sg, 0, s - 0.05), b = wingXZ(sg, 0, s + 0.05), l = Math.hypot(b.x - a.x, b.z - a.z); return { x: (b.x - a.x) / l, z: (b.z - a.z) / l }; }
  function acrossDir(sg, s) { var a = wingXZ(sg, 0, s), b = wingXZ(sg, 1, s); return { x: b.x - a.x, z: b.z - a.z }; }
  // local frame at a point of a wing: x along the wing, y up, z into the wing (away from the courtyard)
  function wingFrame(sg, s, u, y) { var a = alongDir(sg, s), c = acrossDir(sg, s), p = wingXZ(sg, u, s); return new THREE.Matrix4().makeBasis(new THREE.Vector3(a.x, 0, a.z), new THREE.Vector3(0, 1, 0), new THREE.Vector3(c.x, 0, c.z)).setPosition(p.x, y, p.z); }

  function campusExterior(B) {
    var yB = PALY.B;
    B.zone = ZONE.OUT;
    // ---- dome ring: board-marked concrete, a dark aluminium sill where the glass springs; openings for the vault and the links
    var runs = [[8.95, 15.7], [24.3, 174.375], [185.625, 335.7], [344.3, 351.05]].map(function (c) { return [c[0] * D2R, c[1] * D2R]; });
    runs.forEach(function (r) {
      var na = Math.max(6, Math.round((r[1] - r[0]) / (2 * Math.PI) * 360));
      B.surf(na, 1, function (i, j, q) { var th = lerp(r[0], r[1], i / na), p = palPol(PAL.ringOut, th), gg = cgH(p.x, p.z), y = j ? yB + PAL.beam : Math.min(gg, yB) - 0.4;
        q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [p.x - PAL.c.x, 0, p.z - PAL.c.z]; q.f[0] = th * PAL.ringOut; q.f[1] = y; q.f2[0] = y - gg; q.m = MT.CONCRETE; });
      B.surf(na, 1, function (i, j, q) { var th = lerp(r[0], r[1], i / na), p = palPol(lerp(PAL.ringIn + 0.3, PAL.ringOut, j), th); q.p[0] = p.x; q.p[1] = yB + PAL.beam; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = th * 28; q.f[1] = j * 0.9; q.f2[0] = 3; q.m = MT.CONCRETE; });
      B.surf(na, 1, function (i, j, q) { var th = lerp(r[0], r[1], i / na), p = palPol(j ? 27.85 : 28.15, th); q.p[0] = p.x; q.p[1] = yB + PAL.beam + 0.12; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f2[0] = 3; q.m = MT.ANOD; });
      [27.85, 28.15].forEach(function (rr) { B.surf(na, 1, function (i, j, q) { var th = lerp(r[0], r[1], i / na), p = palPol(rr, th), sgn = rr > 28 ? 1 : -1; q.p[0] = p.x; q.p[1] = yB + PAL.beam + 0.12 * j; q.p[2] = p.z; q.nn = [(p.x - PAL.c.x) * sgn, 0, (p.z - PAL.c.z) * sgn]; q.f2[0] = 3; q.m = MT.ANOD; }); });
      [r[0], r[1]].forEach(function (th, e) { var tg = [Math.cos(th) * PAL.Rt.x - Math.sin(th) * PAL.F.x, 0, Math.cos(th) * PAL.Rt.z - Math.sin(th) * PAL.F.z], sgn = e ? 1 : -1;
        B.surf(1, 1, function (i, j, q) { var p = palPol(i ? PAL.ringOut : PAL.ringIn, th), gg = cgH(p.x, p.z); q.p[0] = p.x; q.p[1] = j ? yB + PAL.beam : Math.min(gg, yB) - 0.4; q.p[2] = p.z; q.nn = [tg[0] * sgn, 0, tg[2] * sgn]; q.f[0] = i * 1.2; q.f[1] = q.p[1]; q.f2[0] = 2; q.m = MT.CONCRETE; }); });
    });
    // ---- entrance vault, outside: composite shell with dark flashing at both arches and a warm light under the front arch
    var NS = 40, NT = 24;
    function vout(s, rad) { var wo = vaultW(rad) + PAL.vt, ho = vaultH(rad) + 0.55, o = palXZ(s * wo, rad); o.y = vestY(rad) + ho * Math.pow(Math.max(0, 1 - s * s), 0.55); return o; }
    function vin(s, rad) { var o = palXZ(s * vaultW(rad), rad); o.y = vestY(rad) + vaultH(rad) * Math.pow(Math.max(0, 1 - s * s), 0.55); return o; }
    var v0 = B.count();
    B.surf(NS + 2, NT, function (i, j, q) {
      var rad = lerp(PAL.vBack + 0.4, PAL.vFront, j / NT), ii = clamp(i - 1, 0, NS), s = -Math.cos(Math.PI * ii / NS), o = vout(s, rad), y = (i === 0 || i === NS + 2) ? vestY(rad) - 1.4 : o.y;
      q.p[0] = o.x; q.p[1] = y; q.p[2] = o.z; q.f[0] = Math.asin(clamp(s, -1, 1)) * 4.8; q.f[1] = rad; q.f2[0] = y - cgH(o.x, o.z); q.m = MT.SHELL;
    });
    B.orient(v0, function (x, y, z) { var o = palLoc(x, z, {}), ax = palXZ(0, o.rad); return [x - ax.x, y - vestY(o.rad) - 1.0, z - ax.z]; });
    [[PAL.vFront, PAL.vFront], [PAL.vBack, PAL.vBack + 0.4]].forEach(function (e) {
      B.surf(NS, 1, function (i, j, q) { var s = -Math.cos(Math.PI * i / NS), o = j ? vout(s, e[1]) : vin(s, e[0]); q.p[0] = o.x; q.p[1] = o.y; q.p[2] = o.z; q.nn = [PAL.F.x, 0, PAL.F.z]; q.f2[0] = 4; q.m = MT.ANOD; });
    });
    // logo crest over the door: brushed steel with the backlit logo, its lower edge following the arch
    var W = 5.6, Th = 0.3, Rc = 16, pc = PAL.vFront - 0.3, top = PALY.front + vaultH(PAL.vFront) + 0.55 + 1.6, ly0 = PALY.front + vaultH(PAL.vFront) + 0.55 - 0.1, N2 = 28;
    function at(s, off) { return palXZ(s, pc + off - s * s / (2 * Rc)); }
    function low(s) { return vout(clamp(s / (vaultW(PAL.vFront) + PAL.vt), -1, 1), PAL.vFront).y - 0.25; }
    B.surf(N2, 1, function (i, j, q) { var s = -W / 2 + W * i / N2, p = at(s, Th / 2), y = j ? top : low(s); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.F.x, 0, PAL.F.z]; q.f[0] = (s + 2.5) / 5.0; q.f[1] = (y - ly0) / 1.5625; q.f2[0] = 9; q.m = MT.SIGN; });
    B.surf(N2, 1, function (i, j, q) { var s = -W / 2 + W * i / N2, p = at(s, -Th / 2), y = j ? top : low(s); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [-PAL.F.x, 0, -PAL.F.z]; q.f[0] = s; q.f[1] = y; q.f2[0] = 9; q.m = MT.SHELL; });
    B.surf(N2, 1, function (i, j, q) { var s = -W / 2 + W * i / N2, p = at(s, j ? Th / 2 : -Th / 2); q.p[0] = p.x; q.p[1] = top; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = j * Th; q.f2[0] = 9; q.m = MT.ANOD; });
    [-W / 2, W / 2].forEach(function (s) { B.surf(1, 1, function (i, j, q) { var p = at(s, i ? Th / 2 : -Th / 2); q.p[0] = p.x; q.p[1] = j ? top : low(s); q.p[2] = p.z; q.nn = [PAL.Rt.x * Math.sign(s), 0, PAL.Rt.z * Math.sign(s)]; q.f2[0] = 9; q.m = MT.ANOD; }); });
    var lfp = palXZ(0, PAL.vFront + 1.2); extLight(lfp.x, PALY.front + 6.6, lfp.z, WARMC, 3.2, 14, [0, -1, 0], 1);

    // ---- the two wings and the links to the dome
    [1, -1].forEach(function (sg) { wingShell(B, sg); linkShell(B, sg); });

    // ---- gateway: a slender arch between the wings' ends, carrying the campus name
    (function () {
      var sG = WG.sB - 0.6, yG = (wingBase(1, WG.sB) + wingBase(-1, WG.sB)) / 2, crown = 5.6, L0 = latf(WG.sB) - WG.ov + 0.3, NA = 48, hE = wingH(WG.sB);
      function gy(lat) { var x = lat / L0, yb = lerp(wingBase(-1, WG.sB), wingBase(1, WG.sB), clamp(0.5 + 0.5 * x, 0, 1)); return lerp(yb, yG, 1 - x * x) + hE + (crown - hE) * Math.pow(Math.max(0, 1 - x * x), 0.8); }
      [[0.3, 1], [-0.3, -1]].forEach(function (e) {
        B.surf(NA, 1, function (i, j, q) { var lat = lerp(-L0, L0, i / NA), p = palXZ(lat, sG + e[0]), y = gy(lat) - (j ? 0 : 0.55); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.F.x * e[1], 0, PAL.F.z * e[1]]; q.f[0] = lat; q.f[1] = y; q.f2[0] = 5; q.m = MT.SHELL; });
      });
      [[0, 1], [0.55, -1]].forEach(function (e) {
        B.surf(NA, 1, function (i, j, q) { var lat = lerp(-L0, L0, i / NA), p = palXZ(lat, sG + (j ? 0.3 : -0.3)), y = gy(lat) - e[0]; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, e[1], 0]; q.f[0] = lat; q.f[1] = j * 0.6; q.f2[0] = 5; q.m = e[1] > 0 ? MT.SHELL : MT.ANOD; });
      });
      // the name, in lit letters on a dark band hung under the crown
      var w2 = 8.6, h2 = 0.64, yc = gy(0) - 1.15, b0 = palXZ(-w2 / 2, sG + 0.34), b1 = palXZ(w2 / 2, sG + 0.34), A = ATL.gate;
      quadB(B, new THREE.Vector3(b0.x, yc - h2 / 2, b0.z), new THREE.Vector3(b1.x, yc - h2 / 2, b1.z), new THREE.Vector3(b1.x, yc + h2 / 2, b1.z), new THREE.Vector3(b0.x, yc + h2 / 2, b0.z),
        [PAL.F.x, 0, PAL.F.z], MT.ATLAS, [[A[0], A[1]], [A[2], A[1]], [A[2], A[3]], [A[0], A[3]]], [2.6, 6]);
      var bc = palXZ(0, sG + 0.3), fb = new Builder(); fb.box(-(w2 + 0.3) / 2, -(h2 + 0.16) / 2, -0.03, (w2 + 0.3) / 2, (h2 + 0.16) / 2, 0.03, MT.ANOD);
      B.add(fb, T(bc.x, yc, bc.z, 0, yawOf(PAL.F), 0));
      [-2.6, 2.6].forEach(function (lat) { var pp = palXZ(lat, sG + 0.3); tubeAlong(B, [new THREE.Vector3(pp.x, yc + h2 / 2 + 0.08, pp.z), new THREE.Vector3(pp.x, gy(lat) - 0.55, pp.z)], 0.012, 4, MT.STEEL, 5); });
      [-L0 + 1.0, L0 - 1.0].forEach(function (lat) { var pp = palXZ(lat, sG - 0.9); extLight(pp.x, cgH(pp.x, pp.z) + 0.3, pp.z, WARMC, 1.8, 8, [0, 1, 0], 2); });
      var nl = palXZ(0, sG + 1.2); extLight(nl.x, yc - 0.6, nl.z, WARMC, 0.8, 5);
    })();

    // ---- bollard lights along the courtyard
    [1, -1].forEach(function (sg) { [41, 49.5, 61, 70].forEach(function (s) {
      var p = palXZ(sg * 5.8, s), g = cgH(p.x, p.z);
      latheOn(B, p.x, g - 0.2, p.z, [[0.1, 0], [0.1, 0.9]], 16, MT.ANOD, 0.3);
      latheOn(B, p.x, g + 0.8, p.z, [[0.112, 0], [0.112, 0.08], [0.09, 0.1], [0.0, 0.105]], 16, MT.ANOD, 0.9);
      B.geo(addF2(new THREE.CylinderGeometry(0.094, 0.094, 0.1, 16, 1, true), 1.4, 0), T(p.x, g + 0.75, p.z), MT.LIGHT, 1);
      extLight(p.x, g + 0.75, p.z, WARMC, 1.1, 6);
      COLL.posts.push({ x: p.x, z: p.z, r: 0.35 });
    }); });
    // ---- the Sun court (T-16), where the solar field stood: the campus is on the city's grid and has no power plant of
    // its own. An armillary sundial on a concrete plinth, its rod parallel to Mars's axis (Gale crater is 5.4 deg south,
    // so the rod points south and 5.4 deg up), an hour band marked for the day hours of the sol; precast benches in a
    // half-circle facing it. The paving and the path round the wing are in the drape.
    (function () {
      var SC = P2.suncourt, c = palXZ(SC.lat, SC.rad), g0 = cgH(c.x, c.z), R = SC.sphere / 2, yc = g0 + SC.plinth + R, phi = 5.4 * D2R;
      var O = new THREE.Vector3(c.x, yc, c.z), A = new THREE.Vector3(0, Math.sin(phi), Math.cos(phi));          // the polar axis
      var U = new THREE.Vector3(1, 0, 0), V = new THREE.Vector3().crossVectors(A, U);                              // the equator's plane
      function bronze(g) { return addF2(g, 0, 7); }
      function smooth(sb, k) { for (var n = 0; n < sb.f.length; n++) sb.f[n] = 0.45 + 0.07 * sb.f[n] * (k || 1); }  // precast: no board marks or tie holes
      var pl = new Builder();                                            // the plinth: a turned pedestal, the ring stands in its cap
      latheOn(pl, 0, 0, 0, [[0.0, 0], [0.5, 0], [0.5, 0.2], [0.44, 0.24], [0.36, 0.3], [0.33, SC.plinth + 0.05], [0.4, SC.plinth + 0.1], [0.4, SC.plinth + 0.15], [0.0, SC.plinth + 0.15]], 32, MT.CONCRETE);
      smooth(pl, 0.5); B.add(pl, T(c.x, g0 - 0.15, c.z));
      B.geo(bronze(new THREE.TorusGeometry(R, 0.03, 8, 128)), T(c.x, yc, c.z, 0, Math.PI / 2, 0), MT.BRASS);           // meridian ring, upright north-south
      B.geo(bronze(new THREE.TorusGeometry(R * 0.985, 0.022, 8, 128)), T(c.x, yc, c.z, Math.PI / 2, 0, 0), MT.BRASS);  // horizon ring
      B.geo(bronze(new THREE.BoxGeometry(0.16, 0.08, 0.1)), T(c.x, g0 + SC.plinth + 0.03, c.z), MT.BRASS);              // the ring's foot in the cap
      // the equatorial hour band, square to the axis, touching the meridian ring inside
      var Re = R - 0.045, hw = 0.09, th = 0.015, NT = 128;
      function bandPt(t, r, w) { return O.clone().addScaledVector(U, Math.cos(t) * r).addScaledVector(V, Math.sin(t) * r).addScaledVector(A, w); }
      [[Re - th, -1], [Re + th, 1]].forEach(function (f) {
        B.surf(NT, 1, function (i, j, q) { var t = i / NT * 2 * Math.PI, p = bandPt(t, f[0], j ? hw : -hw), n = bandPt(t, 1, 0).sub(O).multiplyScalar(f[1]);
          q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [n.x, n.y, n.z]; q.f[0] = t * Re; q.f[1] = j * 2 * hw; q.f2[1] = 7; q.m = MT.BRASS; }, true);
      });
      [-1, 1].forEach(function (e) {
        B.surf(NT, 1, function (i, j, q) { var t = i / NT * 2 * Math.PI, p = bandPt(t, j ? Re + th : Re - th, e * hw); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [A.x * e, A.y * e, A.z * e]; q.f2[1] = 7; q.m = MT.BRASS; }, true);
      });
      // hour marks on the inside of the band where the rod's shadow falls by day: noon at the bottom, 6 to 18 Mars hours
      for (var hr = 6; hr <= 18; hr++) {
        var t = Math.PI + (hr - 6) * Math.PI / 12, rd = bandPt(t, 1, 0).sub(O), tg = new THREE.Vector3().crossVectors(A, rd), big = hr % 3 === 0;
        var M = new THREE.Matrix4().makeBasis(tg, A, rd.clone().negate()); M.setPosition(bandPt(t, Re - th - 0.003, 0));
        B.geo(new THREE.BoxGeometry(big ? 0.016 : 0.009, hw * (big ? 1.8 : 1.1), 0.006), M, MT.BRASS);
      }
      // the polar rod (the gnomon) with an arrowhead toward the south celestial pole and a fletch at the north end
      var rot = Math.PI / 2 - phi;
      B.geo(bronze(new THREE.CylinderGeometry(0.018, 0.018, 2 * R + 0.3, 12)), T(c.x, yc, c.z, rot, 0, 0), MT.BRASS);
      var tip = O.clone().addScaledVector(A, R + 0.24); B.geo(bronze(new THREE.ConeGeometry(0.055, 0.18, 14)), T(tip.x, tip.y, tip.z, rot, 0, 0), MT.BRASS);
      var tail = O.clone().addScaledVector(A, -R - 0.1);
      [0, Math.PI / 2].forEach(function (a) { var M = T(tail.x, tail.y, tail.z, rot, 0, 0).multiply(new THREE.Matrix4().makeRotationY(a)); B.geo(bronze(new THREE.BoxGeometry(0.11, 0.16, 0.006)), M, MT.BRASS); });
      COLL.posts.push({ x: c.x, z: c.z, r: 1.35 });
      var l0 = SC.lat - SC.w / 2, l1 = SC.lat + SC.w / 2, r0 = SC.rad - SC.d / 2, r1 = SC.rad + SC.d / 2;
      function line(a, b) { var n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)), o = []; for (var k = 0; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); return o; }
      kerbAlong(B, line([l0 + 3.0, r1], [l1, r1]), -0.15, 0); kerbAlong(B, line([l1, r1], [l1, r0]), -0.15, 0);
      kerbAlong(B, line([l1, r0], [l0, r0]), -0.15, 0); kerbAlong(B, line([l0, r0], [l0, r1]), -0.15, 0);
      var sp = sunPath(); kerbAlong(B, sp.slice(2), 1.1, 1.25); kerbAlong(B, sp.slice(2), -1.25, -1.1);
      // a warm uplight in the paving, toward the sphere, for the evening
      var lp = palXZ(SC.lat + 2.2, SC.rad - 0.6), gl = cgH(lp.x, lp.z), dl = new THREE.Vector3(c.x - lp.x, yc - gl, c.z - lp.z).normalize();
      B.box(lp.x - 0.09, gl - 0.05, lp.z - 0.09, lp.x + 0.09, gl + 0.07, lp.z + 0.09, MT.ANOD);
      extLight(lp.x, gl + 0.1, lp.z, WARMC, 1.3, 7, [dl.x, dl.y, dl.z], 1);
      // five precast benches in a half-circle on the far side, facing the sundial
      for (var k = 0; k < SC.benches; k++) {
        var a = (-64 + 128 * k / (SC.benches - 1)) * D2R, bp = palXZ(SC.lat + 5.0 * Math.cos(a), SC.rad + 5.0 * Math.sin(a)), gb = cgH(bp.x, bp.z);
        var rw = new THREE.Vector3(PAL.Rt.x * Math.cos(a) + PAL.F.x * Math.sin(a), 0, PAL.Rt.z * Math.cos(a) + PAL.F.z * Math.sin(a)).normalize();
        var tw = new THREE.Vector3(-rw.z, 0, rw.x), bn = new Builder();
        bn.box(-0.85, -0.25, -0.17, 0.85, 0.4, 0.17, MT.CONCRETE); bn.box(-0.92, 0.4, -0.25, 0.92, 0.47, 0.25, MT.CONCRETE); smooth(bn);
        var Mb = new THREE.Matrix4().makeBasis(tw, new THREE.Vector3(0, 1, 0), rw); Mb.setPosition(bp.x, gb, bp.z); B.add(bn, Mb);
        [-0.55, 0.55].forEach(function (o) { COLL.posts.push({ x: bp.x + tw.x * o, z: bp.z + tw.z * o, r: 0.45 }); });
      }
    })();
    // ---- the logo wall by the path: concrete with a brushed-steel face and the backlit logo
    (function () {
      var c = SIGNP.c, nx = RIDGE_VIEW.x - c.x, nz = RIDGE_VIEW.z - c.z, nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
      var tx = nz, tz = -nx, Wd = SIGNP.W, Ht = SIGNP.Ht, Tt = SIGNP.T, Rc2 = 12, gR = cgH(c.x, c.z), NS2 = 28;
      SIGNP.n = { x: nx, z: nz }; SIGNP.t = { x: tx, z: tz }; SIGNP.gR = gR;
      function at2(s, off) { var bend = -s * s / (2 * Rc2); return { x: c.x + tx * s + nx * (off + bend), z: c.z + tz * s + nz * (off + bend) }; }
      SIGNP.at = at2;
      B.surf(NS2, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS2, p = at2(s, Tt / 2 + 0.006), y = j ? gR + Ht - 0.12 : gR + 0.12; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [nx, 0, nz]; q.f[0] = (s + 2.1) / 4.2; q.f[1] = (y - gR - 0.1) / 1.3125; q.f2[0] = y - gR; q.m = MT.SIGN; });
      B.surf(NS2, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS2, p = at2(s, Tt / 2), gg = cgH(p.x, p.z); q.p[0] = p.x; q.p[1] = j ? gR + Ht : gg - 0.4; q.p[2] = p.z; q.nn = [nx, 0, nz]; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - gg; q.m = MT.CONCRETE; });
      B.surf(NS2, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS2, p = at2(s, -Tt / 2), gg = cgH(p.x, p.z), y = j ? gR + Ht : gg - 0.4; q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [-nx, 0, -nz]; q.f[0] = s; q.f[1] = y; q.f2[0] = y - gg; q.m = MT.CONCRETE; });
      B.surf(NS2, 1, function (i, j, q) { var s = -Wd / 2 + Wd * i / NS2, p = at2(s, j ? Tt / 2 : -Tt / 2); q.p[0] = p.x; q.p[1] = gR + Ht; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = j * Tt; q.f2[0] = Ht; q.m = MT.CONCRETE; });
      [-Wd / 2, Wd / 2].forEach(function (s) { B.surf(1, 1, function (i, j, q) { var p = at2(s, i ? Tt / 2 : -Tt / 2), gg = cgH(p.x, p.z); q.p[0] = p.x; q.p[1] = j ? gR + Ht : gg - 0.4; q.p[2] = p.z; q.nn = [tx * Math.sign(s), 0, tz * Math.sign(s)]; q.f[0] = i * Tt; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - gg; q.m = MT.CONCRETE; }); });
      var sp = at2(0, Tt / 2 + 1.3); extLight(sp.x, cgH(sp.x, sp.z) + 0.25, sp.z, [0.92, 0.94, 1.0], 1.6, 6, [-nx, 0.45, -nz], 1);
    })();
    // ---- rovers: one parked by the avenue at the gateway, one behind the left wing
    ROVER_BAYS.forEach(function (bay) { addRover(B, bay.x, bay.z, bay.yaw); COLL.rovers.push({ x: bay.x, z: bay.z }); });
  }

  // one wing: roof shell with canopy and soffit, end walls, facade (plinth, mullions, doors); glass goes to WING_GLASS
  var WING_GLASS = new Builder();
  function wingShell(B, sg) {
    var sA = WG.sA, sB = WG.sB, NSs = 96, NTt = 24, s0 = sA - WG.ew, s1 = sB + WG.ew, n0 = B.count();
    B.surf(NSs, NTt, function (i, j, q) {       // roof: composite panels over the curve
      var s = lerp(s0, s1, i / NSs), t = j / NTt, p = roofPt(sg, s, t, false);
      q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.f[0] = s; q.f[1] = t * (WG.D + WG.ov) * 1.05; q.f2[0] = p.y - p.g; q.m = MT.SHELL;
    });
    B.orient(n0, function () { return [0, 1, 0]; });
    // canopy edge flashing, the soffit under the overhang with its downlights
    B.surf(NSs, 1, function (i, j, q) { var s = lerp(s0, s1, i / NSs), p = roofPt(sg, s, 0, false), d = wingXZ(sg, -2, s); q.p[0] = p.x; q.p[1] = p.y - 0.36 * j; q.p[2] = p.z; q.nn = [d.x - p.x, 0, d.z - p.z]; q.f[0] = s; q.f[1] = j; q.f2[0] = 4; q.m = MT.ANOD; });
    B.surf(NSs, 4, function (i, j, q) { var s = lerp(s0, s1, i / NSs), u = lerp(-WG.ov, 0, j / 4), p = roofPt(sg, s, roofT(u), true); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [0, -1, 0]; q.f[0] = s; q.f[1] = u; q.f2[0] = 4; q.m = MT.SHELL; });
    for (var s = sA + 1.6; s < sB - 1; s += 3.0) {
      var p = wingXZ(sg, -0.6, s), y = roofYAt(sg, s, -0.6, true) - 0.015;
      B.geo(addF2(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 14), 1.8, 0), T(p.x, y, p.z), MT.LIGHT, 1);
      extLight(p.x, y - 0.15, p.z, WARMC, 1.5, 7, [0, -1, 0], 1.5);
    }
    // end walls, outside: across the canopy only its thickness, then down to the ground; the link passes through the first
    [[s0, -1], [s1, 1]].forEach(function (e) {
      var se = e[0], nrm = [PAL.F.x * e[1], 0, PAL.F.z * e[1]];
      function wallSurf(u0, u1, n, bottom) {
        B.surf(n, 1, function (i, j, q) { var u = lerp(u0, u1, i / n), p = roofPt(sg, se, roofT(u), false); q.p[0] = p.x; q.p[1] = j ? p.y : bottom(u, p); q.p[2] = p.z; q.nn = nrm; q.f[0] = u * 1.05; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - p.g; q.m = MT.SHELL; });
      }
      wallSurf(-WG.ov, -0.12, 4, function (u) { return roofYAt(sg, se, u, true); });
      var ground = function (u, p) { return Math.min(p.g, wingFloor(sg, se)) - 0.3; };
      if (e[1] > 0) wallSurf(-0.12, WG.D, 30, ground);
      else {
        var uc = linkU(0, se), ua = uc - LINK.wo / LC20, ub = uc + LINK.wo / LC20;
        wallSurf(-0.12, ua, 6, ground); wallSurf(ub, WG.D, 18, ground);
        wallSurf(ua, ub, 24, function (u) { var y = linkCutY(sg, se, u); return y === undefined ? ground(u, roofPt(sg, se, roofT(u), false)) : y; });
      }
    });
    // facade: a concrete plinth (standing up where the ground outside is higher than the floor), mullions, rails, the glass
    wingRooms(sg).forEach(function (rm) {
      var a = rm.s0 + (rm.s0 === sA ? -WG.ew : 0), b = rm.s1 + (rm.s1 === sB ? WG.ew : 0), n = Math.max(2, Math.round((b - a) / 0.5));
      var segs = rm.entry ? [[a, rm.entry - 1.25], [rm.entry + 1.25, b]] : [[a, b]];
      segs.forEach(function (sgm) {
        var nn = Math.max(2, Math.round((sgm[1] - sgm[0]) / 0.5));
        function topY(s) { var pe = wingXZ(sg, -0.12, s); return Math.max(rm.y + 0.03, cgH(pe.x, pe.z) + 0.06); }
        var inn = acrossDir(sg, (sgm[0] + sgm[1]) / 2), no = [-inn.x, 0, -inn.z];
        B.surf(nn, 1, function (i, j, q) { var s = lerp(sgm[0], sgm[1], i / nn), pe = wingXZ(sg, -0.12, s), g = cgH(pe.x, pe.z); q.p[0] = pe.x; q.p[1] = j ? topY(s) : Math.min(g, rm.y) - 0.45; q.p[2] = pe.z; q.nn = no; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - g; q.m = MT.CONCRETE; });
        B.surf(nn, 1, function (i, j, q) { var s = lerp(sgm[0], sgm[1], i / nn), pe = wingXZ(sg, j ? 0.03 : -0.12, s); q.p[0] = pe.x; q.p[1] = topY(s); q.p[2] = pe.z; q.nn = [0, 1, 0]; q.f[0] = s; q.f[1] = j * 0.15; q.f2[0] = 0.5; q.m = MT.CONCRETE; });
        B.zone = ZONE.WING;
        B.surf(nn, 1, function (i, j, q) { var s = lerp(sgm[0], sgm[1], i / nn), pe = wingXZ(sg, 0.03, s); q.p[0] = pe.x; q.p[1] = j ? topY(s) : rm.y - 0.02; q.p[2] = pe.z; q.nn = [inn.x, 0, inn.z]; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = 3; q.m = MT.CONCRETE; });
        B.zone = ZONE.OUT;
        // glass, floor to ceiling (the plinth hides its foot where it stands up)
        WING_GLASS.surf(nn, 1, function (i, j, q) { var s = lerp(sgm[0], sgm[1], i / nn), pg = wingXZ(sg, 0, s), yt = roofYAt(sg, s, 0, true); q.p[0] = pg.x; q.p[1] = j ? yt : rm.y; q.p[2] = pg.z; q.nn = no; q.f[0] = s; q.f[1] = q.p[1]; q.f2[0] = j ? yt - rm.y : 0; q.f2[1] = 1; q.m = 0; });
        // bottom rail and door-height transom
        [[rm.y + 0.02, 0.1], [rm.y + 2.62, 0.08]].forEach(function (rl) {
          B.surf(nn, 3, function (i, j, q) { var s = lerp(sgm[0], sgm[1], i / nn), k = [[-0.05, 0], [-0.05, 1], [0.06, 1], [0.06, 0]][j], pr = wingXZ(sg, k[0], s); q.p[0] = pr.x; q.p[1] = rl[0] + k[1] * rl[1]; q.p[2] = pr.z; q.f[0] = s; q.f[1] = j; q.f2[0] = 3; q.m = MT.ANOD; });
        });
      });
      // mullions every 1.5 m and at the room ends
      var nm = Math.max(1, Math.round((b - a) / 1.5));
      for (var k = 0; k <= nm; k++) {
        var sm = lerp(a, b, k / nm); if (rm.entry && Math.abs(sm - rm.entry) < 1.4) continue;
        var hm = roofYAt(sg, sm, 0, true), wide = (k === 0 || k === nm) ? 0.14 : 0.07;
        var mb = new Builder(); mb.box(-wide / 2, 0, -0.07, wide / 2, hm - rm.y, 0.08, MT.ANOD); mb.tag(0, 3, null);
        B.add(mb, wingFrame(sg, sm, 0, rm.y));
      }
      // head rail under the ceiling
      B.surf(n, 1, function (i, j, q) { var s = lerp(a, b, i / n), pr = wingXZ(sg, j ? 0.08 : -0.06, s); q.p[0] = pr.x; q.p[1] = roofYAt(sg, s, 0, true) - 0.1; q.p[2] = pr.z; q.nn = [0, -1, 0]; q.f2[0] = 4; q.m = MT.ANOD; });
      if (rm.entry) wingEntrance(B, sg, rm);
    });
  }
  // the entrance: frame, sliding glass doors, a threshold and steps down to the courtyard where the floor stands higher
  function wingEntrance(B, sg, rm) {
    var sd = rm.entry, dir = alongDir(sg, sd), inn = acrossDir(sg, sd), pc = wingXZ(sg, 0, sd), hD = rm.y + 2.62, yc = roofYAt(sg, sd, 0, true), M = wingFrame(sg, sd, 0, 0);
    var fr = new Builder();
    fr.box(-1.33, rm.y, -0.07, -1.2, yc, 0.08, MT.ANOD); fr.box(1.2, rm.y, -0.07, 1.33, yc, 0.08, MT.ANOD);
    fr.box(-1.25, hD, -0.09, 1.25, hD + 0.16, 0.1, MT.ANOD);
    fr.box(-1.3, rm.y - 0.03, -0.14, 1.3, rm.y + 0.006, 0.08, MT.STEEL);
    fr.tag(0, 3, null); B.add(fr, M);
    WING_GLASS.surf(4, 1, function (i, j, q) { var s = sd - 1.2 + 2.4 * i / 4, pg = wingXZ(sg, 0, s), yt = roofYAt(sg, s, 0, true); q.p[0] = pg.x; q.p[1] = j ? yt : hD + 0.16; q.p[2] = pg.z; q.nn = [-inn.x, 0, -inn.z]; q.f2[0] = 3; q.f2[1] = 1; q.m = 0; });
    var pd = wingXZ(sg, -1.6, sd), gd = cgH(pd.x, pd.z), rise = rm.y - gd;
    rm.stepN = 0; rm.stepG = gd; rm.stepRun = 0.34;
    if (rise > 0.1) {
      var nst = Math.max(1, Math.round(rise / 0.17)), hs = rise / nst; rm.stepN = nst;
      var st = new Builder();
      for (var k = 0; k < nst; k++) { var u0 = -0.14 - (nst - k) * 0.34, y1 = gd + (k + 1) * hs; st.box(-1.5, gd - 0.35, u0, 1.5, y1, -0.14, MT.CONCRETE); }
      st.tag(0, 0.3, null); B.add(st, M);
    }
    // two sliding leaves: aluminium frame + glass, moved in the frame loop
    var door = { sg: sg, s: sd, c: pc, y: rm.y, dir: dir, inn: inn, open: 0, leaves: [] };
    [-1, 1].forEach(function (side) {
      var lf = new Builder(), x0 = side < 0 ? -1.22 : 0.0, x1 = side < 0 ? 0.0 : 1.22;
      lf.box(x0, 0, -0.03, x1, 0.09, 0.03, MT.ANOD); lf.box(x0, 2.5, -0.03, x1, 2.58, 0.03, MT.ANOD);
      lf.box(x0, 0.09, -0.03, x0 + 0.06, 2.5, 0.03, MT.ANOD); lf.box(x1 - 0.06, 0.09, -0.03, x1, 2.5, 0.03, MT.ANOD);
      var hx = side < 0 ? x1 - 0.09 : x0 + 0.05; lf.box(hx, 0.95, 0.03, hx + 0.04, 1.3, 0.07, MT.STEEL); lf.box(hx, 0.95, -0.07, hx + 0.04, 1.3, -0.03, MT.STEEL);
      lf.tag(0, 3, null);
      var gl = new Builder();
      gl.surf(1, 1, function (i, j, q) { q.p[0] = lerp(x0 + 0.06, x1 - 0.06, i); q.p[1] = lerp(0.09, 2.5, j); q.p[2] = 0; q.nn = [0, 0, -1]; q.f2[0] = lerp(0.09, 2.5, j); q.f2[1] = 2; q.m = 0; });
      door.leaves.push({ side: side, frame: lf, glass: gl });
    });
    DOORS.push(door);
  }
  // glass link from a wing to the dome: a glazed barrel vault on a concrete curb, aluminium ribs, a stone floor (with steps)
  var LINK_GLASS = new Builder();
  function linkShell(B, sg) {
    var sIn = LINK.sIn, w = LINK.w, wo = LINK.wo, NA = 24, NL = 24, S = linkSteps(sg);
    function sOut(ll) { return linkSlAt(ll, WG.sA + WG.ei); }
    function P(ll, sl, y) { var p = linkXZ(sg, ll, sl); return new THREE.Vector3(p.x, y, p.z); }
    var a0 = linkXZ(sg, 0, 30), a1 = linkXZ(sg, 1, 30), side = { x: a1.x - a0.x, z: a1.z - a0.z };
    // curbs
    [1, -1].forEach(function (e) {
      var nIn = [-side.x * e, 0, -side.z * e], nOut = [side.x * e, 0, side.z * e];
      B.zone = ZONE.WING;
      B.surf(NL, 1, function (i, j, q) { var sl = lerp(sIn, sOut(e * w), i / NL), p = P(e * w, sl, j ? linkBase(sg, sl) + LINK.pl : linkFloorY(sg, sl) - 0.02); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = nIn; q.f[0] = sl; q.f[1] = p.y; q.f2[0] = 3; q.m = MT.CONCRETE; });
      B.zone = ZONE.OUT;
      B.surf(NL, 1, function (i, j, q) { var ll = e * (j ? wo : w), sl = lerp(sIn, sOut(ll), i / NL), p = P(ll, sl, linkBase(sg, sl) + LINK.pl); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = sl; q.f[1] = j * 0.4; q.f2[0] = 3; q.m = MT.CONCRETE; });
      B.surf(NL, 1, function (i, j, q) { var sl = lerp(28.7, sOut(e * wo), i / NL), pp = linkXZ(sg, e * wo, sl), g = cgH(pp.x, pp.z); q.p[0] = pp.x; q.p[1] = j ? linkBase(sg, sl) + LINK.pl : Math.min(g, linkFloorY(sg, sl)) - 0.6; q.p[2] = pp.z; q.nn = nOut; q.f[0] = sl; q.f[1] = q.p[1]; q.f2[0] = q.p[1] - g; q.m = MT.CONCRETE; });
    });
    // floor: stone landings and, where the wing floor is higher, a short flight of steps
    B.zone = ZONE.WING;
    function tread(slA, slB, y, mat) { var fw = w - 0.01, nv = Math.max(1, Math.round((slB === 99 ? 3.7 : slB - Math.max(sIn, slA)) / 0.4)); B.surf(6, nv, function (i, j, q) { var ll = lerp(-fw, fw, i / 6), sl = lerp(Math.max(sIn, slA), slB === 99 ? sOut(ll) : slB, j / nv), p = P(ll, sl, y); q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = ll; q.f[1] = sl - slA; q.m = mat; }); }
    if (!S.n) {
      B.surf(6, 30, function (i, j, q) { var ll = lerp(-w + 0.01, w - 0.01, i / 6), sl = lerp(sIn, sOut(ll), j / 30), p = P(ll, sl, linkFloorY(sg, sl)); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.f[0] = ll; q.f[1] = sl; q.m = MT.TERRAZZO; });
    } else {
      tread(sIn, S.a, S.y0, MT.TERRAZZO);
      for (var k = 1; k <= S.n; k++) {
        var yk = S.y0 + (S.y1 - S.y0) * k / S.n, ykp = S.y0 + (S.y1 - S.y0) * (k - 1) / S.n, sa = S.a + (k - 1) * S.run;
        tread(sa, k === S.n ? 99 : sa + S.run, yk, k === S.n ? MT.TERRAZZO : MT.STEP);
        B.surf(6, 1, function (i, j, q) { var ll = lerp(-w + 0.01, w - 0.01, i / 6), p = P(ll, sa, j ? yk : ykp); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.nn = [-(linkXZ(sg, 0, 31).x - linkXZ(sg, 0, 30).x), 0, -(linkXZ(sg, 0, 31).z - linkXZ(sg, 0, 30).z)]; q.f[0] = ll; q.f[1] = p.y; q.m = MT.MARBLE; });
      }
    }
    // ribs and portal frames (outside the end wall, so they never cut through it)
    B.zone = ZONE.OUT;
    var sl0 = sIn + 0.12, sl1 = linkSlAt(-w, WG.sA - WG.ew) - 0.1, nr = Math.max(2, Math.round((sl1 - sl0) / 1.4));
    for (k = 0; k <= nr; k++) {
      var slr = lerp(sl0, sl1, k / nr), pts = [];
      for (var i = 0; i <= NA; i++) { var ll = -w * Math.cos(Math.PI * i / NA); pts.push(P(ll * 1.015, slr, linkBase(sg, slr) + linkArch(ll) + 0.035)); }
      tubeAlong(B, pts, k === 0 || k === nr ? 0.055 : 0.032, 5, MT.ANOD, 3);
    }
    // glass vault
    LINK_GLASS.surf(NA, NL, function (i, j, q) { var ll = -w * Math.cos(Math.PI * i / NA), sl = lerp(sIn, sOut(ll), j / NL), y = linkBase(sg, sl) + linkArch(ll), p = P(ll, sl, y); q.p[0] = p.x; q.p[1] = p.y; q.p[2] = p.z; q.f2[0] = y - linkBase(sg, sl) - LINK.pl; q.f2[1] = 1; q.m = 0; });
    // lights along the crown
    for (var sl = sIn + 1.1; sl < sOut(0) - 0.6; sl += 2.1) {
      var pl = P(0, sl, linkBase(sg, sl) + LINK.h - 0.1);
      B.zone = ZONE.WING; B.geo(addF2(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 14), 1.5, 0), T(pl.x, pl.y, pl.z), MT.LIGHT, 1);
      var Lk = { x: pl.x, y: pl.y - 0.12, z: pl.z, c: [WARMC[0] * 1.2, WARMC[1] * 1.2, WARMC[2] * 1.2], r: 6, d: [0, -1, 0], lobe: 1 };
      wingLights.push(Lk); campusLights.push(Lk);
    }
    B.zone = ZONE.OUT;
  }
  // helpers: a textured quad, a small lathe
  function quadB(B, c0, c1, c2, c3, nrm, mat, uv, g2) {
    B.surf(1, 1, function (i, j, q) { var c = j ? (i ? c2 : c3) : (i ? c1 : c0), t = uv[j ? (i ? 2 : 3) : (i ? 1 : 0)]; q.p[0] = c.x; q.p[1] = c.y; q.p[2] = c.z; q.nn = nrm; q.f[0] = t[0]; q.f[1] = t[1]; if (g2) { q.f2[0] = g2[0]; q.f2[1] = g2[1]; } q.m = mat; });
  }
  function latheOn(B, cx, cy, cz, prof, NA, mat, g2x, g2y) {
    B.surf(NA, prof.length - 1, function (i, j, q) {
      var th = i / NA * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th), pr = prof[j], j0 = Math.max(0, j - 1), j1 = Math.min(prof.length - 1, j + 1), dr = prof[j1][0] - prof[j0][0], dy = prof[j1][1] - prof[j0][1], l = Math.hypot(dr, dy) || 1;
      q.p[0] = cx + c * pr[0]; q.p[1] = cy + pr[1]; q.p[2] = cz + s * pr[0]; q.nn = [c * dy / l, -dr / l, s * dy / l]; q.f[0] = th * Math.max(0.05, pr[0]); q.f[1] = pr[1]; q.f2[0] = g2x === undefined ? pr[1] : g2x; q.f2[1] = g2y || 0; q.m = mat;
    }, true);
  }
  // the Sun court's path from the plaza round the end of the classroom wing: a smooth line every half metre (lat, rad)
  var SUN_PATH = null;
  function sunPath() {
    if (SUN_PATH) return SUN_PATH;
    var SC = P2.suncourt, PATH = [[SC.lat - SC.w / 2 + 1.8, SC.rad + SC.d / 2 - 0.4], [22.8, 76.0], [21.6, 80.4], [18.6, 84.4], [14.0, 87.9], [9.0, 88.5]], pts = [];
    for (var n = 0; n < PATH.length - 1; n++) {
      var a0 = PATH[Math.max(0, n - 1)], a1 = PATH[n], a2 = PATH[n + 1], a3 = PATH[Math.min(PATH.length - 1, n + 2)], ns = Math.ceil(Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) / 0.5);
      for (var k = 0; k < ns; k++) { var t = k / ns, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1].map(function (c) { return 0.5 * (2 * a1[c] + (-a0[c] + a2[c]) * t + (2 * a0[c] - 5 * a1[c] + 4 * a2[c] - a3[c]) * t2 + (-a0[c] + 3 * a1[c] - 3 * a2[c] + a3[c]) * t3); })); }
    }
    pts.push(PATH[PATH.length - 1]); SUN_PATH = pts; return pts;
  }
  // a concrete kerb along a line of (lat, rad) points, between side offsets o0 < o1 (m, to the line's left)
  function kerbAlong(B, pts, o0, o1) {
    function frame(j) { var a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)], dl = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dl, dr) || 1; return [-dr / l, dl / l]; }
    function side(j, o) { var n = frame(j); return palXZ(pts[j][0] + n[0] * o, pts[j][1] + n[1] * o); }
    function worldN(j, sg) { var n = frame(j); return [sg * (PAL.Rt.x * n[0] + PAL.F.x * n[1]), 0, sg * (PAL.Rt.z * n[0] + PAL.F.z * n[1])]; }
    B.surf(1, pts.length - 1, function (i, j, q) { var p = side(j, i ? o1 : o0), g = cgH(p.x, p.z);          // the top
      q.p[0] = p.x; q.p[1] = g + 0.12; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = 0.45 + 0.004 * j; q.f[1] = 0.47; q.f2[0] = 0.12; q.m = MT.CONCRETE; });
    [[o0, -1], [o1, 1]].forEach(function (f) {                                                                   // the two sides
      B.surf(1, pts.length - 1, function (i, j, q) { var p = side(j, f[0]), g = cgH(p.x, p.z), y = i ? g - 0.12 : g + 0.12;
        q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = worldN(j, f[1]); q.f[0] = 0.45 + 0.004 * j; q.f[1] = 0.47; q.f2[0] = y - g; q.m = MT.CONCRETE; });
    });
  }
  // paving: courtyard slabs between the wings, the avenue from the palace door to the plaza, the plaza, rover bays
  var PLAZA = { c: { x: 0, z: 0 }, a: 9, b: 4.2 };
  var AVE = { s0: PAL.vFront + 0.05, s1: 83.75 };
  function aveHalf(s) { return 2.2 + 1.6 * (1 - smoothstep(0, 7, s - PAL.vFront)); }
  var ROVER_BAYS = [];
  function drapeGeometry(D) {
    D.zone = ZONE.OUT;
    var c = PLAZA.c;
    D.surf(72, 14, function (i, j, q) {
      var th = i / 72 * 2 * Math.PI, rho = j / 14, lx = Math.cos(th) * PLAZA.a * rho, lz = Math.sin(th) * PLAZA.b * rho;
      var x = c.x + PAL.Rt.x * lx + PAL.F.x * lz, z = c.z + PAL.Rt.z * lx + PAL.F.z * lz;
      q.p[0] = x; q.p[1] = cgH(x, z) + 0.05; q.p[2] = z; q.nn = [0, 1, 0]; q.f[0] = lx; q.f[1] = lz; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE;
    }, true);
    D.surf(10, 200, function (i, j, q) {
      var s = lerp(AVE.s0, AVE.s1, j / 200), hw = aveHalf(s), lat = lerp(-hw, hw, i / 10), p = palXZ(lat, s);
      q.p[0] = p.x; q.p[1] = cgH(p.x, p.z) + 0.06; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = s - PAL.vFront; q.f2[0] = hw; q.f2[1] = 1; q.m = MT.PAVE;
    });
    [1, -1].forEach(function (sg) {                  // courtyard slabs either side of the avenue, up to the facades
      D.surf(18, 180, function (i, j, q) {
        var s = lerp(PAL.vFront - 0.25, WG.sB + WG.ew, j / 180), l0 = s < AVE.s0 ? vaultW(PAL.vFront) + PAL.vt : aveHalf(s), l1 = latf(s) - 0.1, lat = sg * lerp(l0, l1, i / 18), p = palXZ(lat, s);
        q.p[0] = p.x; q.p[1] = cgH(p.x, p.z) + 0.05; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = s; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE;
      });
    });
    // the Sun court's basalt paving and its path from the plaza round the end of the classroom wing
    var SC = P2.suncourt;
    D.surf(24, 38, function (i, j, q) {
      var lat = SC.lat - SC.w / 2 + SC.w * i / 24, rad = SC.rad - SC.d / 2 + SC.d * j / 38, p = palXZ(lat, rad);
      q.p[0] = p.x; q.p[1] = cgH(p.x, p.z) + 0.05; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = lat; q.f[1] = rad; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE;
    });
    var pts = sunPath();
    var run = [0]; for (var n = 1; n < pts.length; n++) run.push(run[n - 1] + Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]));
    D.surf(4, pts.length - 1, function (i, j, q) {
      var a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)], dl = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dl, dr) || 1, o = -1.1 + 2.2 * i / 4;
      var lat = pts[j][0] - dr / l * o, rad = pts[j][1] + dl / l * o, p = palXZ(lat, rad);
      q.p[0] = p.x; q.p[1] = cgH(p.x, p.z) + 0.055; q.p[2] = p.z; q.nn = [0, 1, 0]; q.f[0] = o; q.f[1] = run[j]; q.f2[0] = 0; q.f2[1] = 0; q.m = MT.PAVE;
    });
    ROVER_BAYS.forEach(function (bay) {
      var W = 3.6, L = 6.2, dx = Math.sin(bay.yaw), dz = Math.cos(bay.yaw), bxx = dz, bzz = -dx;
      D.surf(8, 12, function (i, j, q) {
        var lx = W * i / 8, lz = L * j / 12, x = bay.x + bxx * (lx - W / 2) + dx * (lz - L / 2), z = bay.z + bzz * (lx - W / 2) + dz * (lz - L / 2);
        q.p[0] = x; q.p[1] = cgH(x, z) + 0.05; q.p[2] = z; q.nn = [0, 1, 0]; q.f[0] = lx; q.f[1] = lz; q.f2[0] = 0; q.f2[1] = 2; q.m = MT.PAVE;
      });
    });
  }
