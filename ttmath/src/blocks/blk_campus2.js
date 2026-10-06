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
  // the classroom wing (sg > 0) rises higher at the gateway end and keeps its height further back, so its rooms get high
  // ceilings (Jim, 5 Oct 2026: "class rooms are all too small and roof are too low"); the café wing cannot rise there and
  // stay hidden from the start
  function wingH(s, sg) { return sg > 0 ? 4.8 + 2.4 * (WG.sB - s) / (WG.sB - WG.sA) : 4.3 + 2.9 * (WG.sB - s) / (WG.sB - WG.sA); }
  function wingXZ(sg, u, s) { return palXZ(sg * (latf(s) + u), s); }
  function wingRooms(sg) { return WG.rooms[sg > 0 ? "1" : "-1"]; }
  function wingRoomIdx(sg, s) { var R = wingRooms(sg); for (var i = 0; i < R.length - 1; i++) if (s < R[i].s1) return i; return R.length - 1; }
  function wingRoom(sg, s) { return wingRooms(sg)[wingRoomIdx(sg, s)]; }
  function wingFloor(sg, s) { return wingRoom(sg, clamp(s, WG.sA, WG.sB)).y; }
  function wingBase(sg, s) { var a = 0, n = 0; for (var d = -3; d <= 3; d += 1) { a += wingFloor(sg, clamp(s + d, WG.sA, WG.sB)); n++; } return a / n; }
  function roofProf(t, sg) { return Math.pow(Math.max(0, 1 - Math.pow(t, sg > 0 ? 2.6 : 1.7)), 0.75) + 0.09 * Math.sin(Math.PI * t); }
  // roof surface at along-position s and across-parameter t (0 = canopy edge, 1 = where it meets the ground); inner = the ceiling
  function roofPt(sg, s, t, inner) {
    var sc = clamp(s, WG.sA, WG.sB), u = t * (WG.D + WG.ov) - WG.ov, p = wingXZ(sg, u, s), yb = wingBase(sg, sc), y = yb + wingH(sc, sg) * roofProf(t, sg) - (inner ? 0.35 : 0);
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
  function linkSteps(sg) { return { y0: PALY.B, y1: PALY.B, n: 0, a: 29.6, run: 0.55 }; }   // the links' openings in the dome's ring: level, into the garden ring
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
  var PLAZA = { c: { x: 0, z: 0 }, a: 9, b: 4.2 };
  var AVE = { s0: 86.75, s1: 96.0 };                                    // from the airlock's outer doors to the plaza in front of it
  function aveHalf(s) { return 2.2 + 0.9 * (1 - smoothstep(0, 4, s - AVE.s0)); }
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
    ROVER_BAYS.forEach(function (bay) {
      var W = 3.6, L = 6.2, dx = Math.sin(bay.yaw), dz = Math.cos(bay.yaw), bxx = dz, bzz = -dx;
      D.surf(8, 12, function (i, j, q) {
        var lx = W * i / 8, lz = L * j / 12, x = bay.x + bxx * (lx - W / 2) + dx * (lz - L / 2), z = bay.z + bzz * (lx - W / 2) + dz * (lz - L / 2);
        q.p[0] = x; q.p[1] = cgH(x, z) + 0.05; q.p[2] = z; q.nn = [0, 1, 0]; q.f[0] = lx; q.f[1] = lz; q.f2[0] = 0; q.f2[1] = 2; q.m = MT.PAVE;
      });
    });
  }
