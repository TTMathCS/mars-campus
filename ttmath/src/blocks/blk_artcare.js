  /* ===================== The clinic, the art studio and the music room, furnished ===================== */
  // Jim, 7 Oct 2026: "need more details ... furnitures are not designed well to make the campus relaxing and comfortable".
  // A survey of the rooms not yet furnished in groups found these three the barest (campus_furnishing.py): the clinic gets
  // an examination bay behind a curtain, the nurse's desk and a quiet lounge for the counsellor; the art studio paintings
  // in progress on its easels, a wall of finished work and the table's jars and brushes; the music room a rug under the
  // piano, a stand for every chair, guitars and a cello on stands, a drum kit and fabric panels on its walls.

  // ---- the clinic ----
  function examCouch() { return furn("couch", function (b) {            // 1.9 long (x), the head at +x raised, on a steel frame
    [[-0.82, -0.27], [0.82, -0.27], [-0.82, 0.27], [0.82, 0.27]].forEach(function (c) { b.box(c[0] - 0.022, 0, c[1] - 0.022, c[0] + 0.022, 0.52, c[1] + 0.022, MT.STEEL); });
    b.box(-0.84, 0.12, -0.29, 0.84, 0.14, 0.29, MT.STEEL); var n0 = b.count(); b.box(-0.92, 0.5, -0.33, 0.92, 0.58, 0.33, MT.PLASTIC); b.tag(n0, 0, null);
    softBox(b, -0.95, 0.58, -0.35, 0.42, 0.68, 0.35, 0.035, MT.FABRIC, 1, { py: 0.008 }, 0);           // the pad, ink vinyl
    var hd = new Builder(); softBox(hd, 0, -0.05, -0.35, 0.56, 0.05, 0.35, 0.035, MT.FABRIC, 1, { py: 0.008 }, 0); b.add(hd, T(0.42, 0.63, 0, 0, 0, 0.42));
    var n1 = b.count(); b.box(-0.95, 0.69, -0.24, 0.42, 0.693, 0.24, MT.PLASTIC); b.tag(n1, 0, null);   // the paper down it, its roll at the foot
    var n2 = b.count(); b.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16), T(-1.0, 0.64, 0, Math.PI / 2, 0, 0), MT.PLASTIC); b.tag(n2, 0, null);
  }); }
  // a curtain hanging from its track in folds, len along x, 0.25 above the floor to the track at 2.2; bunched: drawn back
  function curtain(len, col, bunched) { return furn("curt" + len + "_" + col + (bunched ? "b" : ""), function (b) {
    var lam = bunched ? 0.08 : 0.17, A = bunched ? 0.055 : 0.035, nu = Math.max(8, Math.round(len / lam * 6)), n0 = b.count();
    b.surf(nu, 1, function (i, j, q) { var x = len * i / nu; q.p[0] = x; q.p[1] = j ? 2.16 : 0.26; q.p[2] = A * Math.sin(2 * Math.PI * x / lam); q.f[0] = x; q.f[1] = q.p[1]; q.m = MT.FABRIC; });
    b.tag(n0, col, 0);
  }); }
  // a ceiling track for the curtains, len along x at 2.2, on rods to the ceiling (ceil: its height over the floor)
  function curtainTrack(len, ceil) { return furn("ctrack" + len + "_" + ceil, function (b) {
    b.box(-0.02, 2.17, -0.02, len + 0.02, 2.21, 0.02, MT.STEEL);
    [0.05, len - 0.05].forEach(function (x) { b.box(x - 0.008, 2.21, -0.008, x + 0.008, ceil, 0.008, MT.STEEL); });
  }); }
  // the clinic's counter on the back wall (back at +z): cupboards, a stone top, a basin and its tap, cabinets over it
  function clinicCounter(len) { return furn("clinicctr" + len, function (b) {
    var n0 = b.count(); b.box(-len / 2, 0.1, -0.3, len / 2, 0.88, 0.3, MT.PLASTIC); b.tag(n0, 0, null); b.box(-len / 2, 0, -0.26, len / 2, 0.1, 0.3, MT.ANOD);
    for (var k = 0; k < Math.round(len / 0.6); k++) { var x = -len / 2 + (k + 0.5) * len / Math.round(len / 0.6); b.box(x - 0.08, 0.76, -0.315, x + 0.08, 0.78, -0.3, MT.STEEL); }
    b.box(-len / 2 - 0.02, 0.88, -0.32, len / 2 + 0.02, 0.92, 0.32, MT.TERRAZZO);
    latheOn(b, len / 2 - 0.45, 0.92, -0.02, [[0.0, 0.0], [0.13, 0.0], [0.19, 0.11], [0.2, 0.12], [0.18, 0.12], [0.11, 0.015], [0.0, 0.015]], 22, MT.CERAMIC, 0);
    tubeAlong(b, [new THREE.Vector3(len / 2 - 0.45, 0.92, 0.25), new THREE.Vector3(len / 2 - 0.45, 1.2, 0.25), new THREE.Vector3(len / 2 - 0.45, 1.24, 0.17), new THREE.Vector3(len / 2 - 0.45, 1.14, 0.08)], 0.012, 8, MT.STEEL);
    var n1 = b.count(); b.box(-len / 2, 1.5, -0.17, len / 2, 2.3, 0.3, MT.PLASTIC); b.tag(n1, 0, null);
    var nd = Math.max(1, Math.round(len / 0.6));
    for (k = 0; k < nd; k++) { var x0 = -len / 2 + k * len / nd + 0.012, x1 = x0 + len / nd - 0.024, n2 = b.count(); b.box(x0, 1.52, -0.185, x1, 2.28, -0.17, MT.PLASTIC); b.tag(n2, 5, null); b.box(k % 2 ? x0 + 0.04 : x1 - 0.06, 1.55, -0.2, k % 2 ? x0 + 0.06 : x1 - 0.04, 1.68, -0.185, MT.STEEL); }
  }); }
  // frosted glass in an oak frame 2.4 m high, len along x and centred: a sill, a head, posts 1.2 m apart or less
  function frostedScreen(len) { return furn("frost" + len.toFixed(2), function (b) {
    var h = 2.4, np = Math.max(1, Math.ceil(len / 1.2)), n0 = b.count();
    b.box(-len / 2, 0, -0.035, len / 2, 0.09, 0.035, MT.WOOD); b.box(-len / 2, h - 0.07, -0.035, len / 2, h, 0.035, MT.WOOD);
    for (var k = 0; k <= np; k++) { var x = -len / 2 + len * k / np; b.box(x - 0.03, 0, -0.035, x + 0.03, h, 0.035, MT.WOOD); }
    kindTag(b, n0, 1); var n1 = b.count(); b.box(-len / 2, 0.09, -0.008, len / 2, h - 0.07, 0.008, MT.PLASTIC); b.tag(n1, 0, null);
  }); }
  // a rest bed 2.0 long (x), its head at -x, 0.96 wide: an oak frame and headboard, the mattress made up in white, a pillow, a
  // folded blanket at the foot
  function restBed() { return furn("restbed", function (b) {
    var n0 = b.count(); b.box(-1.0, 0.28, -0.48, 1.0, 0.4, 0.48, MT.WOOD); b.box(-1.04, 0.0, -0.48, -1.0, 0.95, 0.48, MT.WOOD);
    [[-0.96, -0.44], [0.96, -0.44], [-0.96, 0.44], [0.96, 0.44]].forEach(function (c) { b.box(c[0] - 0.03, 0, c[1] - 0.03, c[0] + 0.03, 0.28, c[1] + 0.03, MT.WOOD); }); kindTag(b, n0, 1);
    softBox(b, -0.98, 0.4, -0.46, 0.98, 0.58, 0.46, 0.05, MT.FABRIC, 7, { py: 0.01 }, 0);
    softBox(b, -0.95, 0.58, -0.32, -0.6, 0.7, 0.32, 0.05, MT.FABRIC, 6, { py: 0.03 }, 0);
    softBox(b, 0.45, 0.58, -0.47, 0.92, 0.64, 0.47, 0.03, MT.FABRIC, 1, { py: 0.008 }, 0);
  }); }
  function clinicRoom(B, rm, F) {                    // the examination bay at the back, the nurse's desk in the middle, the counsellor's lounge at the front
    var C = CRS, faceIn = F.sgn > 0 ? ROT.plusA : ROT.minusA, along = F.sgn > 0 ? 0 : Math.PI, ceil = 4.45;
    // the bay: the couch along the outer wall, a curtain drawn back on a track round it, the counter and cabinets on the back wall
    var cr = C.r1 - 1.05, ca = F.at(2.45, false); crsPlace(B, examCouch(), cr, ca, F.y, along); crsObst(cr - 0.4, cr + 0.4, F.at(1.45, false), F.at(3.45, false), F.floor);
    var tr = C.r1 - 1.85, t0 = F.at(0.9, false), t1 = F.at(4.0, false);
    crsPlace(B, curtainTrack(3.1, ceil), tr, t0, F.y, along); crsPlace(B, curtain(1.25, 4, true), tr, t0, F.y, along);
    crsPlace(B, curtainTrack(C.r1 - 0.1 - tr, ceil), tr, t1, F.y, -Math.PI / 2); crsPlace(B, curtain(0.85, 4, true), C.r1 - 0.95, t1, F.y, -Math.PI / 2);
    var ka = F.at(0.42, false); crsPlace(B, clinicCounter(2.4), 57.4, ka, F.y, faceIn); crsObst(56.2, 58.6, F.back, F.at(0.78, false), F.floor);
    // the nurse's desk, a chair for whoever comes in, two bookcases on the corridor wall behind it
    var da = F.at(4.6, false); crsPlace(B, teacherDesk(), C.rc + 1.4, da, F.y, F.sgn > 0 ? Math.PI : 0); crsPlace(B, officeChair(), C.rc + 0.6, da, F.y, OUT); crsObst(C.rc + 0.5, C.rc + 2.3, da - 0.45 / 51, da + 0.45 / 51, F.floor);
    crsPlace(B, diningChair(10), C.rc + 2.45, da, F.y, IN); crsObst(C.rc + 2.15, C.rc + 2.75, da - 0.3 / 52, da + 0.3 / 52, F.floor);
    shelvesOnCorridor(B, F, 2, 2.4);
    // the counsellor's lounge: a long sofa by the outer wall, two club chairs across a walnut table, a rug, lamps, a print
    var la = F.at(F.span - 2.6, false), rs = C.r1 - 0.7, rc2 = rs - 2.7; rugAt(B, rs - 1.4, la, F.y, 3.8, 3.2, 4);
    crsPlace(B, sofa(4, 2.4), rs, la, F.y, ROT["in"]); crsObst(rs - 0.5, rs + 0.5, la - 1.25 / rs, la + 1.25 / rs, F.floor);
    crsPlace(B, walnutTable(1.1, 0.55), rs - 1.35, la, F.y, 0); crsObst(rs - 1.65, rs - 1.05, la - 0.6 / rs, la + 0.6 / rs, F.floor);
    [-0.9, 0.9].forEach(function (x) { var aa = la + x / rc2; crsPlace(B, armchair(), rc2, aa, F.y, ROT.out); crsObst(rc2 - 0.45, rc2 + 0.45, aa - 0.45 / rc2, aa + 0.45 / rc2, F.floor); });
    var lt = F.at(F.span - 4.15, false); crsPlace(B, lampTable(), rs + 0.05, lt, F.y, 0); lampLight(rs + 0.05, lt, F.y, 0.95, 0.55, 3.2); crsObst(rs - 0.25, rs + 0.35, lt - 0.28 / rs, lt + 0.28 / rs, F.floor);
    var fl = F.at(F.span - 4.45, false), rf = 57.25; crsPlace(B, floorLamp(), rf, fl, F.y, 0); lampLight(rf, fl, F.y, 1.4, 0.65, 3.4); crsObst(rf - 0.2, rf + 0.2, fl - 0.2 / rf, fl + 0.2 / rf, F.floor);
    // the counsellor's own room: frosted glass in an oak frame round the lounge, open by the front wall; against its glass, on
    // the clinic's side, two rest beds made up, a curtain between them
    var pr = 56.6, ga = F.at(F.span - 1.35, false), gb = F.at(F.span - 5.0, false), ro = C.r1 - 0.075;
    crsPlace(B, frostedScreen(Math.abs(ga - gb) * pr), pr, (ga + gb) / 2, F.y, 0); crsObst(pr - 0.05, pr + 0.05, ga, gb, F.floor);
    crsPlace(B, frostedScreen(ro - pr), (pr + ro) / 2, gb, F.y, -Math.PI / 2); crsObst(pr, ro, gb - 0.05 / 58, gb + 0.05 / 58, F.floor);
    [2.35, 3.85].forEach(function (d) { var ba = F.at(F.span - d, false); crsPlace(B, restBed(), pr - 1.09, ba, F.y, IN); crsObst(pr - 2.12, pr, ba - 0.5 / 55.5, ba + 0.5 / 55.5, F.floor); });
    var ca = F.at(F.span - 3.1, false); crsPlace(B, curtainTrack(2.1, ceil), pr - 2.15, ca, F.y, -Math.PI / 2); crsPlace(B, curtain(0.7, 4, true), pr - 0.75, ca, F.y, -Math.PI / 2);
    roomPlants(B, rm, F, [C.rc + 1.1, da - F.sgn * 0.55 / 51, 0.77]);
  }
  // ---- the art studio ----
  // paintings: a Mars dusk, Olympus Mons, a colour field, circles in squares, the dome, a still life, waves, the pale blue dot
  var PAINT = { S: 512, n: 8, cols: 4 }, PAINT_QUADS = [];
  function strokes(g, R, x, y, w, h, cols, n, len) {                      // short brush strokes that make a flat colour look painted
    g.lineCap = "round";
    for (var k = 0; k < n; k++) { var px = x + R() * w, py = y + R() * h, t = R() * Math.PI; g.strokeStyle = cols[Math.floor(R() * cols.length)]; g.globalAlpha = 0.12 + 0.18 * R(); g.lineWidth = 2 + 5 * R(); g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(t) * len, py + Math.sin(t) * len * 0.4); g.stroke(); }
    g.globalAlpha = 1;
  }
  function drawPainting(g, k, S) {
    var R = mulberry(700 + k * 13), gr;
    if (k === 0) {                                                         // a Mars dusk: the sky blue round the setting sun, dunes in layers
      gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#3c4a66"); gr.addColorStop(0.45, "#a9b6c4"); gr.addColorStop(0.62, "#c9a07a"); gr.addColorStop(1, "#6b3b22"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      var sg = g.createRadialGradient(S * 0.6, S * 0.52, 2, S * 0.6, S * 0.52, S * 0.3); sg.addColorStop(0, "rgba(220,235,255,0.95)"); sg.addColorStop(1, "rgba(160,190,230,0)"); g.fillStyle = sg; g.fillRect(0, 0, S, S);
      ["#8a4a2a", "#6e3820", "#4e2614"].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.moveTo(0, S); for (var x = 0; x <= S; x += 8) g.lineTo(x, S * (0.6 + i * 0.1) + Math.sin(x * 0.02 + i * 2) * 18 + Math.sin(x * 0.051 + i) * 7); g.lineTo(S, S); g.fill(); });
      strokes(g, R, 0, 0, S, S, ["#b88a64", "#2f3a52", "#e0c0a0"], 400, 22);
    } else if (k === 1) {                                                  // Olympus Mons: a shield so wide its slopes run off the canvas
      gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, "#d9a77c"); gr.addColorStop(1, "#f0d2b0"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.fillStyle = "#9c5634"; g.beginPath(); g.moveTo(0, S * 0.78); g.quadraticCurveTo(S * 0.3, S * 0.5, S * 0.42, S * 0.47); g.lineTo(S * 0.58, S * 0.47); g.quadraticCurveTo(S * 0.72, S * 0.5, S, S * 0.76); g.lineTo(S, S); g.lineTo(0, S); g.fill();
      g.fillStyle = "#7a3f22"; g.fillRect(S * 0.44, S * 0.465, S * 0.12, S * 0.012); g.fillStyle = "#5e2f18"; g.fillRect(0, S * 0.85, S, S * 0.15);
      strokes(g, R, 0, 0, S, S, ["#c47a4e", "#f3dcc0", "#8a4628"], 420, 26);
    } else if (k === 2) {                                                  // a colour field: two soft blocks
      g.fillStyle = "#5a1d1a"; g.fillRect(0, 0, S, S);
      [["#c2452b", 0.08, 0.1, 0.84, 0.42], ["#e08a2c", 0.08, 0.58, 0.84, 0.32]].forEach(function (b) { g.fillStyle = b[0]; g.shadowColor = b[0]; g.shadowBlur = 24; g.fillRect(S * b[1], S * b[2], S * b[3], S * b[4]); });
      g.shadowBlur = 0; strokes(g, R, 0, 0, S, S, ["#7a2a20", "#e9a050", "#b03a24"], 500, 30);
    } else if (k === 3) {                                                  // circles in squares
      var cols = ["#2b5f8a", "#d8a23a", "#b8432f", "#3f7d4f", "#6b4b8a", "#e3d6b8", "#c7642b", "#1e2b3a", "#8fb3c4"];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
        var cx = (i + 0.5) * S / 3, cy = (j + 0.5) * S / 3, c = (i * 3 + j); g.fillStyle = cols[c]; g.fillRect(i * S / 3, j * S / 3, S / 3, S / 3);
        for (var q = 4; q >= 1; q--) { g.fillStyle = cols[(c + q * 2) % cols.length]; g.beginPath(); g.arc(cx + (R() - 0.5) * 6, cy + (R() - 0.5) * 6, q * S / 30, 0, 2 * Math.PI); g.fill(); }
      }
      strokes(g, R, 0, 0, S, S, ["#ffffff", "#000000"], 250, 14);
    } else if (k === 4) {                                                  // the dome under a pale sky
      g.fillStyle = "#e9d2b4"; g.fillRect(0, 0, S, S); g.fillStyle = "#b5643a"; g.fillRect(0, S * 0.62, S, S * 0.38);
      g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(S * 0.5, S * 0.64, S * 0.24, Math.PI, 0); g.fill(); g.strokeStyle = "#9aa3ad"; g.lineWidth = 2;
      for (var m = 1; m < 6; m++) { g.beginPath(); g.ellipse(S * 0.5, S * 0.64, S * 0.24 * m / 6, S * 0.24, 0, Math.PI, 0); g.stroke(); }
      g.fillStyle = "#8a4a2a"; g.fillRect(S * 0.16, S * 0.6, S * 0.68, S * 0.05);
      strokes(g, R, 0, 0, S, S, ["#d49a6a", "#f7e7d0", "#9c5634"], 380, 20);
    } else if (k === 5) {                                                  // a still life: a jug, a bowl and two pears on a cloth
      g.fillStyle = "#2c2a26"; g.fillRect(0, 0, S, S); g.fillStyle = "#c9b48c"; g.fillRect(0, S * 0.66, S, S * 0.34);
      g.fillStyle = "#3e6a8a"; g.beginPath(); g.ellipse(S * 0.36, S * 0.52, S * 0.1, S * 0.17, 0, 0, 2 * Math.PI); g.fill(); g.fillRect(S * 0.31, S * 0.3, S * 0.1, S * 0.08);
      g.fillStyle = "#d8d2c4"; g.beginPath(); g.ellipse(S * 0.64, S * 0.66, S * 0.15, S * 0.06, 0, 0, Math.PI); g.fill();
      ["#b7b23e", "#9aa033"].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.ellipse(S * (0.55 + i * 0.14), S * 0.6, S * 0.05, S * 0.07, 0.3 * (i - 0.5), 0, 2 * Math.PI); g.fill(); });
      strokes(g, R, 0, 0, S, S, ["#5a5246", "#e0d0b0", "#141210"], 450, 24);
    } else if (k === 6) {                                                  // waves: lines that ripple
      g.fillStyle = "#f2efe8"; g.fillRect(0, 0, S, S); g.strokeStyle = "#1c2430"; g.lineWidth = 5;
      for (var y = -10; y < S + 10; y += 16) { g.beginPath(); for (var x = 0; x <= S; x += 6) { var yy = y + Math.sin(x * 0.03 + y * 0.05) * 9 * Math.sin(y * 0.02 + 1); if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
    } else {                                                               // the pale blue dot: the Earth in the Martian night
      g.fillStyle = "#06080e"; g.fillRect(0, 0, S, S);
      for (var s = 0; s < 260; s++) { var v = R(); g.fillStyle = "rgba(255,255,255," + (0.3 + 0.7 * v * v) + ")"; g.fillRect(R() * S, R() * S * 0.8, 1 + (v > 0.95 ? 1.5 : 0), 1 + (v > 0.95 ? 1.5 : 0)); }
      var eg = g.createRadialGradient(S * 0.66, S * 0.3, 0, S * 0.66, S * 0.3, 14); eg.addColorStop(0, "rgba(170,210,255,1)"); eg.addColorStop(1, "rgba(80,130,220,0)"); g.fillStyle = eg; g.fillRect(S * 0.6, S * 0.24, 30, 30);
      g.fillStyle = "#2a160c"; g.beginPath(); g.moveTo(0, S); g.lineTo(0, S * 0.84); for (var x2 = 0; x2 <= S; x2 += 10) g.lineTo(x2, S * 0.84 - Math.sin(x2 * 0.013) * 22 - R() * 4); g.lineTo(S, S); g.fill();
    }
  }
  function paintAtlas() {
    var s = MOBILE ? 0.5 : 1, S = PAINT.S, rows = Math.ceil(PAINT.n / PAINT.cols), cv = mkCanvas(Math.round(PAINT.cols * S * s), Math.round(rows * S * s)), g = cv.getContext("2d");
    for (var k = 0; k < PAINT.n; k++) { g.save(); g.scale(s, s); g.translate((k % PAINT.cols) * S, Math.floor(k / PAINT.cols) * S); g.beginPath(); g.rect(0, 0, S, S); g.clip(); drawPainting(g, k, S); g.restore(); }
    return cv;
  }
  // a painting on a canvas: corners in a local frame M (x across, y up, the face toward +z at z0), painting k, cropped to its shape
  function paintQuad(M, x0, x1, y0, y1, z0, k, bright) { PAINT_QUADS.push({ M: M, x0: x0, x1: x1, y0: y0, y1: y1, z: z0, k: k, b: bright }); }
  function paintMesh() {
    if (!PAINT_QUADS.length) return;
    var tex = new THREE.CanvasTexture(paintAtlas()); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var pos = [], uvs = [], idx = [], brt = [], rows = Math.ceil(PAINT.n / PAINT.cols), v = new THREE.Vector3();
    PAINT_QUADS.forEach(function (q) {
      var A = (q.x1 - q.x0) / (q.y1 - q.y0), cu = A >= 1 ? 1 : A, cvv = A >= 1 ? 1 / A : 1;   // the part of the square painting this shape shows
      var u0 = (q.k % PAINT.cols + 0.5 - cu / 2) / PAINT.cols, u1 = (q.k % PAINT.cols + 0.5 + cu / 2) / PAINT.cols;
      var vm = 1 - (Math.floor(q.k / PAINT.cols) + 0.5) / rows, v0 = vm - cvv / 2 / rows, v1 = vm + cvv / 2 / rows, n = pos.length / 3;
      [[q.x0, q.y0, u0, v0], [q.x1, q.y0, u1, v0], [q.x1, q.y1, u1, v1], [q.x0, q.y1, u0, v1]].forEach(function (c) { v.set(c[0], c[1], q.z).applyMatrix4(q.M); pos.push(v.x, v.y, v.z); uvs.push(c[2], c[3]); brt.push(q.b); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute("aBright", new THREE.Float32BufferAttribute(brt, 1)); geo.setIndex(idx);
    var vs = "attribute float aBright; varying vec2 vUv; varying float vB; void main(){ vUv = uv; vB = aBright; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    var fs = "uniform sampler2D map; uniform float uExposure; varying vec2 vUv; varying float vB;\n" +
      "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * vB + vec3(0.002); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
    var m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide })); m.matrixAutoUpdate = false; scene.add(m);
    PAINT_QUADS = [];
  }
  // the long table's things: jars of paint, cups of brushes, palettes, a roll of paper (along x, the top at y = 0)
  function tableClutter(len) { return furn("clutter" + len, function (b) {
    var R = mulberry(31), cols = [2, 3, 4, 6, 0, 1];
    for (var k = 0; k < 14; k++) {
      var x = -len / 2 + 0.3 + (len - 0.6) * (k + R() * 0.6) / 14, z = (R() - 0.5) * 0.6, kind = k % 4, n0 = b.count();
      if (kind === 0) { latheOn(b, x, 0, z, [[0.0, 0], [0.045, 0], [0.045, 0.11], [0.04, 0.12], [0.0, 0.12]], 12, MT.PLASTIC, cols[k % cols.length]); }
      else if (kind === 1) { latheOn(b, x, 0, z, [[0.0, 0], [0.05, 0], [0.05, 0.13], [0.0, 0.13]], 12, MT.CERAMIC, 0); for (var s = 0; s < 5; s++) { var t = s / 5 * 6.28; tubeAlong(b, [new THREE.Vector3(x + Math.cos(t) * 0.015, 0.05, z + Math.sin(t) * 0.015), new THREE.Vector3(x + Math.cos(t) * 0.05, 0.3, z + Math.sin(t) * 0.05)], 0.004, 4, MT.WOOD); } }
      else if (kind === 2) { b.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.008, 18), T(x, 0.004, z, 0, R() * 3, 0, 1.4, 1, 1), MT.PLASTIC); b.tag(n0, 0, null);
        for (var d = 0; d < 5; d++) { var nd = b.count(); b.geo(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 10), T(x + Math.cos(d * 1.2) * 0.09, 0.011, z + Math.sin(d * 1.2) * 0.06), MT.PLASTIC); b.tag(nd, [2, 3, 4, 6, 1][d], null); } }
      else { var n1 = b.count(); b.geo(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 14), T(x, 0.04, z, Math.PI / 2, R(), 0), MT.PLASTIC); b.tag(n1, 7, null); }
    }
  }); }
  function stretcher(w, h) { return furn("stretch" + w + "_" + h, function (b) {   // a stretched canvas 3 cm deep, its face at -x (a radial wall's frame)
    var n0 = b.count(); b.box(-0.03, -h / 2, -w / 2, 0, h / 2, w / 2, MT.PLASTER); b.tag(n0, null, 0);
  }); }
  function artStudio(B, rm, F) {          // paintings in progress on easels round a long table of jars and brushes, a wall of finished work, the sink, a kiln
    var C = CRS, ta = F.at(F.span / 2, true), k = 0;
    crsPlace(B, longTable(6.0), 55.8, ta, F.y, 0); crsObst(55.0, 56.6, ta - 3.1 / 55.8, ta + 3.1 / 55.8, F.floor);
    B.add(tableClutter(6.0), crsFrame(55.8, ta, F.y + 0.75, 0));
    for (var e = 0; e < 6; e++) { var x = -2.5 + e; [[57.6, IN], [54.0, OUT]].forEach(function (c) {
      var a = ta + x / 55.8, rot = c[1] - Math.PI / 2; crsPlace(B, easel(), c[0], a, F.y, rot); crsPlace(B, stool(), c[0] + (c[1] === IN ? 0.6 : -0.6), a, F.y, 0);
      paintQuad(crsFrame(c[0], a, F.y, rot), -0.31, 0.31, 0.82, 1.54, 0.0915, k++ % PAINT.n, 0.3);
    }); }
    var sa = F.at(4.6, false); crsPlace(B, counter(3.0), C.rc + 0.45, sa, F.y, ROT.out); crsObst(C.rc + 0.1, C.rc + 0.8, sa - 1.6 / 50, sa + 1.6 / 50, F.floor);   // the sink, clear of the door
    // the back wall: finished work hung close together, an oak strip of light over it
    var s = -F.sgn, wa = F.back, hang = [[1.2, 0.9, 53.3, 1.85], [0.8, 1.0, 54.75, 1.7], [0.6, 0.5, 54.75, 2.6], [1.4, 1.0, 56.4, 1.95], [0.7, 0.7, 57.95, 1.55], [0.8, 0.6, 57.95, 2.45], [0.9, 1.2, 59.25, 1.9]];
    hang.forEach(function (h, i) {
      var r = h[2], Mw = crsFrame(r, wa - s * 0.075 / r, F.y + h[3], s > 0 ? 0 : Math.PI); B.add(stretcher(h[0], h[1]), Mw);
      paintQuad(crsFrame(r, wa - s * 0.075 / r, F.y + h[3], (s > 0 ? 0 : Math.PI) - Math.PI / 2), -h[0] / 2 + 0.005, h[0] / 2 - 0.005, -h[1] / 2 + 0.005, h[1] / 2 - 0.005, 0.0305, (i + 3) % PAINT.n, 0.36);
    });
    var gl = crsPt(56.3, wa + F.sgn * 1.2 / 56.3); wLight(gl.x, F.y + 3.4, gl.z, LAMPC, 1.0, 5, [0, -0.6, 0], 1);
    // the front wall: a kiln and shelves of supplies
    var fa = F.at(0.55, true), faceBack = F.sgn > 0 ? ROT.minusA : ROT.plusA;
    [57.4, 58.3].forEach(function (r, i) { var a = F.at(0.26, true); crsPlace(B, bookshelf(), r, a, F.y, faceBack); shelfBooks(B, crsFrame(r, a, F.y, faceBack), 40 + i); crsObst(r - 0.45, r + 0.45, F.at(0.45, true), F.front, F.floor); });
    crsPlace(B, kiln(), 55.6, fa, F.y, faceBack); crsObst(55.15, 56.05, F.at(1.0, true), F.front, F.floor);
    paintMesh();
    roomPlants(B, rm, F, [55.8, ta + 2.6 / 55.8, 0.75]);
  }
  function kiln() { return furn("kiln", function (b) {                   // a steel kiln 0.8 square, a lid, its controller (back at +z)
    b.box(-0.4, 0.12, -0.4, 0.4, 0.92, 0.4, MT.STEEL); b.box(-0.42, 0.92, -0.42, 0.42, 0.98, 0.42, MT.STEEL); b.box(-0.36, 0, -0.36, 0.36, 0.12, 0.36, MT.ANOD);
    b.box(-0.15, 0.55, -0.43, 0.15, 0.75, -0.4, MT.ANOD); var n0 = b.count(); b.box(-0.1, 0.66, -0.432, 0.02, 0.71, -0.429, MT.LIGHT); b.tag(n0, 1.2, 0.1);
    b.box(-0.42, 0.98, 0.35, 0.42, 1.12, 0.42, MT.STEEL);
  }); }
  // ---- the music room ----
  // The room is sunk and lit by its skylights, its outer wall solid: that wall is the stage, oak slats on felt behind the
  // grand piano, whose lid opens over the chairs; the ensemble's chairs stand in three arcs facing it. On the corridor wall
  // the door, three bookcases of scores and two practice booths; at the back the guitars hung, the cello, the double bass and
  // the drum kit; by the door a violin, a viola and a ukulele; felt panels across the front wall.
  function musicStand() { return furn("mstand", function (b) {           // its desk faces -x (toward the player), sheet music on it
    for (var k = 0; k < 3; k++) { var t = k / 3 * 6.283 + 0.5; tubeAlong(b, [new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(Math.cos(t) * 0.24, 0.0, Math.sin(t) * 0.24)], 0.007, 5, MT.ANOD); }
    tubeAlong(b, [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 1.05, 0)], 0.009, 6, MT.ANOD);
    var dk = new Builder(); dk.box(-0.006, -0.17, -0.25, 0.006, 0.17, 0.25, MT.PLASTIC); dk.box(-0.04, -0.19, -0.25, 0.006, -0.17, 0.25, MT.PLASTIC); dk.tag(0, 1, null);   // black steel
    var n0 = dk.count(); dk.box(-0.012, -0.15, -0.21, -0.006, 0.15, 0.0, MT.PLASTIC); dk.box(-0.012, -0.15, 0.005, -0.006, 0.15, 0.21, MT.PLASTIC); dk.tag(n0, 7, null);
    b.add(dk, T(0.0, 1.17, 0, 0, 0, -0.35));
  }); }
  // a grand piano's case seen from above, from the bass cheek (x 0.76, z 0) up the straight side, round the tail and down the
  // bentside to the treble cheek: points [x, z] and, with their outward normals, [x, z, nx, nz]
  var PIANO_PATH = null;
  function pianoPath() {
    if (PIANO_PATH) return PIANO_PATH;
    var W = 0.76, P = [[W, 0], [W, 1.52]], E = [];
    function bz(a, b, c, d) { for (var i = 1; i <= 14; i++) { var t = i / 14, u = 1 - t; P.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } }
    bz([W, 1.52], [W, 1.9], [0.5, 2.04], [0.2, 1.97]); bz([0.2, 1.97], [-0.04, 1.9], [-0.14, 1.6], [-0.3, 1.3]); bz([-0.3, 1.3], [-0.5, 0.95], [-W, 0.8], [-W, 0.4]); P.push([-W, 0]);
    P.forEach(function (p, k) { var a = P[Math.max(0, k - 1)], c = P[Math.min(P.length - 1, k + 1)], tx = c[0] - a[0], tz = c[1] - a[1], l = Math.hypot(tx, tz); E.push([p[0], p[1], tz / l, -tx / l]); });
    return (PIANO_PATH = { P: P, E: E });
  }
  // a shape from a path's points, cut off in front at z0; and a shape laid flat at height y (x, z), facing up or down
  function pathShape(pts, z0) {
    var q = pts.filter(function (p) { return p[1] >= z0; }), s = new THREE.Shape();
    if (q[0][1] > z0) q.unshift([pts[0][0], z0]); if (q[q.length - 1][1] > z0) q.push([pts[pts.length - 1][0], z0]);
    s.moveTo(q[0][0], q[0][1]); for (var i = 1; i < q.length; i++) s.lineTo(q[i][0], q[i][1]); return s;
  }
  function flatM(y, up) { return new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, up ? 1 : -1, y, 0, 1, 0, 0, 0, 0, 0, 1); }
  // the grand piano, 1.52 wide (x) and 2.0 long, its keys at -z and its middle at the origin: the case in black lacquer, the
  // lid open on its prop over the treble side (-x, the player's right), the gold plate and the strings under it, 88 keys,
  // a score on the desk, three legs on brass casters, the lyre and its pedals, the bench
  // placed the right way round: the Ring's frames are mirror-handed, so a piece with a left and a right (a piano's bass to
  // the player's left, a drum kit's hi-hat) is flipped back across its own x
  function crsPlaceTrue(B, fb, r, a, y, rot) { var M = crsFrame(r, a, y, rot).multiply(new THREE.Matrix4().makeScale(-1, 1, 1)); B.add(fb, M); contactShadow(fb, M); }
  function grandPiano() { return furn("piano", function (b) {
    var g = new Builder(), PP = pianoPath(), P = PP.P, E = PP.E, yB = 0.62, yT = 0.99, th = 0.04, nE = E.length - 1, k;
    g.surf(nE, 1, function (i, j, q) { var e = E[i]; q.p[0] = e[0]; q.p[1] = j ? yT : yB; q.p[2] = e[1]; q.nn = [e[2], 0, e[3]]; q.f[0] = i * 0.03; q.f[1] = q.p[1]; q.m = MT.DKGLASS; });   // the rim
    g.surf(nE, 1, function (i, j, q) { var e = E[i], o = j ? th : 0; q.p[0] = e[0] - o * e[2]; q.p[1] = yT; q.p[2] = e[1] - o * e[3]; q.nn = [0, 1, 0]; q.m = MT.DKGLASS; });
    g.surf(nE, 1, function (i, j, q) { var e = E[i]; q.p[0] = e[0] - th * e[2]; q.p[1] = j ? yT : 0.8; q.p[2] = e[1] - th * e[3]; q.nn = [-e[2], 0, -e[3]]; q.m = MT.DKGLASS; });
    var n0 = g.count(); g.geo(new THREE.ShapeGeometry(pathShape(P, 0), 4), flatM(yB, false), MT.PLASTIC); g.tag(n0, 1, null);                   // the bottom
    var Pi = E.map(function (e) { return [e[0] - th * e[2], e[1] - th * e[3]]; }), Pl = E.map(function (e) { return [e[0] - (th + 0.035) * e[2], e[1] - (th + 0.035) * e[3]]; });
    n0 = g.count(); g.geo(new THREE.ShapeGeometry(pathShape(Pi, 0), 4), flatM(0.8, true), MT.WOOD); g.tag(n0, null, 1);                         // the soundboard
    var ps = pathShape(Pl, 0.3); [[-0.2, 1.0, 0.11, 0.2], [0.33, 1.12, 0.13, 0.28], [0.18, 1.62, 0.09, 0.14], [-0.38, 0.62, 0.08, 0.16]].forEach(function (h) { var hp = new THREE.Path(); hp.absellipse(h[0], h[1], h[2], h[3], 0, 2 * Math.PI, true); ps.holes.push(hp); });
    g.geo(new THREE.ShapeGeometry(ps, 6), flatM(0.86, true), MT.BRASS);                                                                     // the plate
    function zEnd(x) { var z = 0; for (var i = 0; i < Pl.length - 1; i++) { var a = Pl[i], c = Pl[i + 1]; if ((a[0] - x) * (c[0] - x) <= 0 && a[0] !== c[0]) z = Math.max(z, a[1] + (x - a[0]) / (c[0] - a[0]) * (c[1] - a[1])); } return z; }
    for (var x = 0.6; x > -0.62; x -= 0.021) { var bass = x > 0.3, w = bass ? 0.0021 : 0.0011; g.box(x - w, 0.874, 0.36, x + w, 0.874 + w * 1.6, zEnd(x) - 0.06, bass ? MT.BRASS : MT.STEEL); }   // the strings
    g.box(-0.62, 0.865, 0.31, 0.62, 0.885, 0.35, MT.STEEL);                                                                                   // the tuning pins
    // the keybed, the key slip and its felt, 52 white keys and 36 black, the cheeks, the fallboard pushed back, the action's cover
    g.box(-0.76, yB, -0.19, 0.76, 0.7, 0.02, MT.DKGLASS); g.box(-0.62, 0.66, -0.215, 0.62, 0.715, -0.19, MT.DKGLASS);
    n0 = g.count(); g.box(-0.611, 0.7, -0.19, 0.611, 0.714, -0.183, MT.FABRIC); g.tag(n0, 9, null);
    var kw = 1.222 / 52; for (k = 0; k < 52; k++) g.box(0.611 - (k + 1) * kw + 0.0007, 0.7, -0.18, 0.611 - k * kw - 0.0007, 0.722, -0.02, MT.CERAMIC);
    for (k = 0; k < 51; k++) if ([0, 2, 3, 5, 6].indexOf(k % 7) >= 0) { var xc = 0.611 - (k + 1) * kw; g.box(xc - 0.0064, 0.7, -0.09, xc + 0.0064, 0.737, -0.02, MT.DKGLASS); }
    g.box(-0.76, yB, -0.215, -0.615, 0.81, 0.02, MT.DKGLASS); g.box(0.615, yB, -0.215, 0.76, 0.81, 0.02, MT.DKGLASS);
    g.box(-0.615, 0.7, -0.02, 0.615, 0.82, 0.03, MT.DKGLASS); n0 = g.count(); g.box(-0.72, 0.8, 0.03, 0.72, 0.94, 0.31, MT.PLASTIC); g.tag(n0, 1, null);
    // the desk with a score open on it, leaning back
    var dk = new Builder(); dk.box(-0.42, 0, -0.012, 0.42, 0.3, 0.0, MT.DKGLASS); dk.box(-0.42, -0.005, -0.06, 0.42, 0.012, 0.0, MT.DKGLASS);
    n0 = dk.count(); dk.box(-0.215, 0.012, -0.018, -0.004, 0.3, -0.012, MT.PLASTIC); dk.box(0.004, 0.012, -0.018, 0.215, 0.3, -0.012, MT.PLASTIC); dk.tag(n0, 7, null);
    g.add(dk, T(0, 0.95, 0.17, 0.26, 0, 0));
    // the lid with its front flap folded back on it, hinged along the straight side, held up by its prop
    var lid = new Builder(); lid.geo(new THREE.ExtrudeGeometry(pathShape(P, 0.34), { depth: 0.022, bevelEnabled: false, curveSegments: 4 }), flatM(yT, true), MT.DKGLASS);
    lid.box(-0.755, yT + 0.022, 0.345, 0.755, yT + 0.04, 0.66, MT.DKGLASS);
    var hinge = new THREE.Matrix4().makeTranslation(0.76, yT + 0.011, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.64)).multiply(new THREE.Matrix4().makeTranslation(-0.76, -yT - 0.011, 0));
    g.add(lid, hinge); [0.55, 1.0, 1.42].forEach(function (z) { g.box(0.745, yT - 0.012, z - 0.035, 0.772, yT + 0.022, z + 0.035, MT.BRASS); });
    var bi = 0, bd = 9; P.forEach(function (p, i) { if (p[0] < 0 && Math.abs(p[1] - 1.12) < bd) { bd = Math.abs(p[1] - 1.12); bi = i; } });
    tubeAlong(g, [new THREE.Vector3(P[bi][0] + 0.07, yT, P[bi][1]), new THREE.Vector3(P[bi][0] + 0.1, yT, P[bi][1]).applyMatrix4(hinge)], 0.011, 6, MT.DKGLASS);
    // three tapered legs on brass cups and casters; the lyre, its three brass pedals
    [[0.64, 0.12], [-0.64, 0.12], [0.36, 1.72]].forEach(function (c) {
      g.geo(new THREE.CylinderGeometry(0.06, 0.042, yB - 0.075, 10), T(c[0], 0.075 + (yB - 0.075) / 2, c[1]), MT.DKGLASS);
      g.geo(new THREE.CylinderGeometry(0.048, 0.044, 0.05, 14), T(c[0], 0.05, c[1]), MT.BRASS); g.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.026, 12), T(c[0], 0.03, c[1] + 0.02, 0, 0, Math.PI / 2), MT.RUBBER);
    });
    [-0.11, 0.11].forEach(function (x2) { g.box(x2 - 0.018, 0.12, 0.2, x2 + 0.018, yB, 0.24, MT.DKGLASS); });
    g.box(-0.17, 0.04, 0.15, 0.17, 0.13, 0.3, MT.DKGLASS); [-0.07, 0, 0.07].forEach(function (x2) { g.box(x2 - 0.014, 0.07, 0.02, x2 + 0.014, 0.085, 0.16, MT.BRASS); });
    leg(g, 0, 0.1, 0.3, 0, yB, 0.62, 0.012, MT.DKGLASS);
    g.add(pianoBench(), T(0, 0, -0.64));
    b.add(g, T(0, 0, -0.9));
  }); }
  function pianoBench() { return furn("pbench", function (b) {             // 0.76 long (x), 0.36 deep: a stuffed black leather top on a black frame, its knobs
    softBox(b, -0.38, 0.45, -0.18, 0.38, 0.53, 0.18, 0.025, MT.LEATHER, 1, { py: 0.008 }, 0);
    b.box(-0.37, 0.38, -0.17, 0.37, 0.45, 0.17, MT.DKGLASS);
    [[-0.33, -0.14], [0.33, -0.14], [-0.33, 0.14], [0.33, 0.14]].forEach(function (c) { b.box(c[0] - 0.022, 0, c[1] - 0.022, c[0] + 0.022, 0.38, c[1] + 0.022, MT.DKGLASS); });
    [-1, 1].forEach(function (s) { b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 14), T(s * 0.385, 0.41, 0, 0, 0, Math.PI / 2), MT.DKGLASS); });
  }); }
  // an upright piano 1.54 wide (x), its back at +z (0.3) against a wall, its keys toward -z: walnut, a score on its desk
  function uprightPiano() { return furn("upright", function (b) {
    var n0 = b.count(), k;
    b.box(-0.75, 0.06, -0.02, 0.75, 1.24, 0.3, MT.WOOD); b.box(-0.77, 1.24, -0.05, 0.77, 1.28, 0.32, MT.WOOD);                      // the case and its lid
    [[-0.75, -0.68], [0.68, 0.75]].forEach(function (c) { b.box(c[0], 0.62, -0.32, c[1], 0.86, -0.02, MT.WOOD); b.box(c[0] + 0.01, 0.06, -0.32, c[1] - 0.01, 0.62, -0.26, MT.WOOD); b.box(c[0], 0, -0.38, c[1], 0.06, 0.0, MT.WOOD); });
    b.box(-0.68, 0.62, -0.32, 0.68, 0.7, -0.02, MT.WOOD); b.box(-0.68, 0.7, -0.17, 0.68, 0.8, -0.02, MT.WOOD); b.box(-0.45, 0.86, -0.1, 0.45, 0.88, -0.02, MT.WOOD);   // the keybed, the fallboard, the desk
    b.box(-0.68, 0.0, -0.06, 0.68, 0.06, 0.3, MT.WOOD); b.tag(n0, null, 2);
    var kw = 1.222 / 52; for (k = 0; k < 52; k++) b.box(0.611 - (k + 1) * kw + 0.0007, 0.7, -0.31, 0.611 - k * kw - 0.0007, 0.722, -0.17, MT.CERAMIC);
    for (k = 0; k < 51; k++) if ([0, 2, 3, 5, 6].indexOf(k % 7) >= 0) { var xc = 0.611 - (k + 1) * kw; b.box(xc - 0.0064, 0.7, -0.23, xc + 0.0064, 0.737, -0.17, MT.DKGLASS); }
    var n1 = b.count(); b.box(-0.2, 0.88, -0.032, -0.004, 1.15, -0.022, MT.PLASTIC); b.box(0.004, 0.88, -0.032, 0.2, 1.15, -0.022, MT.PLASTIC); b.tag(n1, 7, null);
    [-0.07, 0, 0.07].forEach(function (x) { b.box(x - 0.013, 0.05, -0.14, x + 0.013, 0.064, -0.02, MT.BRASS); });
  }); }
  // an ensemble chair facing +x, 0.56 wide, the seat at 0.49: a stuffed seat and a padded back in wool on oak legs, no arms
  // (for bows and guitars)
  function ensembleChair(col) { return furn("echair" + col, function (b) {
    softBox(b, -0.25, 0.4, -0.28, 0.29, 0.5, 0.28, 0.04, MT.FABRIC, col, { py: 0.018 }, 0);
    var t = new Builder(); softBox(t, -0.045, -0.17, -0.265, 0.045, 0.17, 0.265, 0.04, MT.FABRIC, col, { px: 0.014 }, 0);
    b.add(t, new THREE.Matrix4().makeTranslation(-0.27, 0.76, 0).multiply(new THREE.Matrix4().makeRotationZ(0.13)));
    var n0 = b.count(); b.box(-0.24, 0.36, -0.26, 0.27, 0.4, 0.26, MT.WOOD);
    [[-0.22, -0.24], [0.25, -0.24], [-0.22, 0.24], [0.25, 0.24]].forEach(function (c) { leg(b, c[0], 0.37, c[1], c[0] * 1.08, 0, c[1] * 1.05, 0.018, MT.WOOD); });
    [-0.23, 0.23].forEach(function (z) { leg(b, -0.24, 0.39, z, -0.31, 0.62, z, 0.014, MT.WOOD); });
    kindTag(b, n0, 1);
  }); }
  // a guitar's or a cello's body: two bouts and a waist, h tall, s its scale, d deep (the face toward -z)
  function fiddleBody(b, s, d, y0, matTop, matBack) {
    function w(y) { var lo = 0.19 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.2) / 0.21, 2))), up = 0.145 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.47) / 0.16, 2))); return Math.max(lo, up, 0.001); }
    var pts = [], N = 26, k;
    for (k = 0; k <= N; k++) { var y = 0.63 * k / N; pts.push(new THREE.Vector2(w(y) * s, y * s)); }
    for (k = N; k >= 0; k--) { var y2 = 0.63 * k / N; pts.push(new THREE.Vector2(-w(y2) * s, y2 * s)); }
    var g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: d, bevelEnabled: true, bevelThickness: 0.008 * s, bevelSize: 0.006 * s, bevelSegments: 2, curveSegments: 4 });
    var n0 = b.count(); b.geo(g, T(0, y0, -d / 2), matBack); b.tag(n0, null, 2);
    var n1 = b.count(); b.geo(new THREE.ShapeGeometry(new THREE.Shape(pts.map(function (p) { return new THREE.Vector2(p.x * 0.985, p.y * 0.985 + 0.004 * s); }))), T(0, y0, -d / 2 - 0.0085 * s, 0, Math.PI, 0), matTop); b.tag(n1, null, 1);
  }
  // instruments for a wall, built in the wall's frame (the wall at x = 0, the face toward -x), hung by the neck from an oak
  // hanger whose yoke is at y = 0: a guitar (s 1) or a ukulele (s 0.45), kind 0 spruce, 1 dark, 2 black; a violin (s 1) or a viola
  function wallHanger(b, d) { var n0 = b.count(); b.box(-0.02, -0.05, -0.035, 0, 0.07, 0.035, MT.WOOD); [-1, 1].forEach(function (k) { b.box(-d - 0.05, -0.012, k * 0.03 - 0.006, -0.02, 0.0, k * 0.03 + 0.006, MT.WOOD); }); b.tag(n0, null, 1); }
  function hungGuitar(kind, s) { return furn("hguitar" + kind + "_" + s, function (b) {
    var g = new Builder(), d = 0.1 * s, fz = -d / 2 - 0.0085 * s, top = kind === 2 ? MT.PLASTIC : MT.WOOD;
    fiddleBody(g, s, d, 0.0, top, top); if (kind === 2) g.tag(0, 1, null); else if (kind === 1) g.tag(0, null, 2);
    var n0 = g.count(); g.geo(new THREE.CircleGeometry(0.045 * s, 20), T(0, 0.42 * s, fz - 0.001, 0, Math.PI, 0), MT.PLASTIC); g.tag(n0, 1, null);   // the sound hole
    var n1 = g.count(); g.box(-0.024 * s, 0.6 * s, fz - 0.012 * s, 0.024 * s, 1.06 * s, -d / 2 + 0.03 * s, MT.WOOD); g.box(-0.04 * s, 1.06 * s, fz - 0.008 * s, 0.04 * s, 1.22 * s, -d / 2 + 0.02 * s, MT.WOOD);
    g.box(-0.05 * s, 0.19 * s, fz - 0.009 * s, 0.05 * s, 0.21 * s, fz, MT.WOOD); g.tag(n1, null, 2);
    var ns = s < 0.6 ? 4 : 6; for (var k = 0; k < ns; k++) { var x = (k - (ns - 1) / 2) * 0.0075 * s; g.box(x - 0.0006, 0.2 * s, fz - 0.016 * s, x + 0.0006, 1.07 * s, fz - 0.014 * s, MT.STEEL); }
    b.add(g, T(-d / 2 - 0.03, -1.06 * s, 0, 0, Math.PI / 2, 0)); wallHanger(b, d);
  }); }
  function hungFiddle(s) { return furn("hfiddle" + s, function (b) {
    var g = new Builder(), k = 0.56 * s, d = 0.04 * s, fz = -d / 2 - 0.0085 * k, L = 0.63 * k, q;
    fiddleBody(g, k, d, 0.0, MT.WOOD, MT.WOOD);
    var n0 = g.count(); g.box(-0.016 * s, 0.24 * s, fz - 0.022 * s, 0.016 * s, 0.6 * s, fz - 0.01 * s, MT.PLASTIC);                       // the ebony fingerboard
    [-1, 1].forEach(function (k2) { g.box(k2 * 0.04 * s - 0.003 * s, 0.13 * s, fz - 0.0015, k2 * 0.04 * s + 0.003 * s, 0.2 * s, fz - 0.0005, MT.PLASTIC); });   // the f-holes
    g.box(-0.019 * s, 0.025 * s, fz - 0.016 * s, 0.019 * s, 0.13 * s, fz - 0.004 * s, MT.PLASTIC); g.tag(n0, 1, null);                    // the tailpiece
    var n1 = g.count(); g.box(-0.013 * s, L, fz - 0.01 * s, 0.013 * s, 0.49 * s, -d / 2 + 0.006 * s, MT.WOOD); g.box(-0.012 * s, 0.49 * s, fz - 0.016 * s, 0.012 * s, 0.56 * s, -d / 2 + 0.004 * s, MT.WOOD);
    g.geo(new THREE.CylinderGeometry(0.021 * s, 0.021 * s, 0.026 * s, 14), T(0, 0.575 * s, fz - 0.004 * s, 0, 0, Math.PI / 2), MT.WOOD); g.tag(n1, null, 2);   // the neck, the pegbox, the scroll
    var n2 = g.count(); g.box(-0.022 * s, 0.155 * s, fz - 0.026 * s, 0.022 * s, 0.162 * s, fz, MT.WOOD); g.tag(n2, null, 1);           // the bridge
    for (q = 0; q < 4; q++) { var x = (q - 1.5) * 0.006 * s; g.box(x - 0.0005, 0.12 * s, fz - 0.027 * s, x + 0.0005, 0.5 * s, fz - 0.026 * s, MT.STEEL); }
    b.add(g, T(-d / 2 - 0.03, -0.49 * s, 0, 0, Math.PI / 2, 0)); wallHanger(b, d);
    var nb = b.count(); tubeAlong(b, [new THREE.Vector3(-0.03, -0.62 * s, 0.16 * s), new THREE.Vector3(-0.03, 0.1, 0.16 * s)], 0.0045, 5, MT.WOOD); b.tag(nb, null, 2);   // its bow on a peg
    var nh = b.count(); b.box(-0.034, -0.6 * s, 0.16 * s - 0.006 - 0.004, -0.031, 0.08, 0.16 * s - 0.002, MT.PLASTIC); b.tag(nh, 7, null);
    var np = b.count(); b.box(-0.05, 0.1, 0.16 * s - 0.006, 0, 0.114, 0.16 * s + 0.006, MT.WOOD); b.tag(np, null, 1);
  }); }
  function guitar() { return furn("guitar", function (b) {               // on a low stand, leaning back, its face toward -z
    var g = new Builder(); fiddleBody(g, 1, 0.1, 0.0, MT.WOOD, MT.WOOD);
    var n0 = g.count(); g.geo(new THREE.CircleGeometry(0.045, 20), T(0, 0.42, -0.06, 0, Math.PI, 0), MT.PLASTIC); g.tag(n0, 1, null);
    var n1 = g.count(); g.box(-0.024, 0.62, -0.03, 0.024, 1.06, 0.0, MT.WOOD); g.box(-0.04, 1.06, -0.025, 0.04, 1.22, 0.0, MT.WOOD); g.box(-0.05, 0.19, -0.062, 0.05, 0.21, -0.055, MT.WOOD); g.tag(n1, null, 2);
    b.add(g, T(0, 0.12, 0, 0.26, 0, 0));
    [-1, 1].forEach(function (sx) { tubeAlong(b, [new THREE.Vector3(sx * 0.16, 0, -0.2), new THREE.Vector3(sx * 0.12, 0.16, -0.02), new THREE.Vector3(0, 0.62, 0.17)], 0.008, 5, MT.ANOD); });
  }); }
  function cello() { return furn("cello", function (b) {                 // standing on its endpin, leaning back on its stand
    var g = new Builder(); fiddleBody(g, 1.2, 0.13, 0.0, MT.WOOD, MT.WOOD);                                  // a body 0.76 long, 0.46 across
    var n0 = g.count(); g.box(-0.028, 0.74, -0.04, 0.028, 1.26, 0.0, MT.WOOD); g.box(-0.032, 1.26, -0.04, 0.032, 1.38, 0.02, MT.WOOD); g.tag(n0, null, 2);
    [-0.06, 0.06].forEach(function (x) { var n1 = g.count(); g.box(x - 0.008, 0.3, -0.0775, x + 0.008, 0.48, -0.074, MT.PLASTIC); g.tag(n1, 1, null); });   // the f-holes
    var n2 = g.count(); g.box(-0.03, 0.45, -0.1, 0.03, 1.24, -0.08, MT.PLASTIC); g.box(-0.035, 0.05, -0.095, 0.035, 0.26, -0.078, MT.PLASTIC); g.tag(n2, 1, null);   // fingerboard, tailpiece
    for (var q = 0; q < 4; q++) { var x2 = (q - 1.5) * 0.011; g.box(x2 - 0.0007, 0.2, -0.104, x2 + 0.0007, 1.3, -0.102, MT.STEEL); }
    tubeAlong(g, [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.28, 0)], 0.006, 5, MT.STEEL);
    b.add(g, T(0, 0.28, 0, 0.2, 0, 0));
    [-1, 1].forEach(function (sx) { tubeAlong(b, [new THREE.Vector3(sx * 0.3, 0, 0.32), new THREE.Vector3(sx * 0.1, 0.75, 0.2)], 0.009, 5, MT.ANOD); });
  }); }
  function doubleBass() { return furn("dbass", function (b) {            // on its endpin, leaning back on its stand: a body 1.04 long, 1.9 to the scroll
    var g = new Builder(), k = 1.65, d = 0.2, fz = -d / 2 - 0.0085 * k, L = 0.63 * k; fiddleBody(g, k, d, 0.0, MT.WOOD, MT.WOOD); g.tag(0, null, 2);
    var n0 = g.count(); g.box(-0.035, L - 0.05, fz - 0.02, 0.035, L + 0.48, -d / 2 + 0.02, MT.WOOD); g.box(-0.032, L + 0.48, fz - 0.02, 0.032, L + 0.62, -d / 2 + 0.02, MT.WOOD);
    g.geo(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 14), T(0, L + 0.65, fz + 0.02, 0, 0, Math.PI / 2), MT.WOOD); g.tag(n0, null, 2);
    var n1 = g.count(); g.box(-0.035, 0.62, fz - 0.05, 0.035, L + 0.48, fz - 0.025, MT.PLASTIC); g.box(-0.05, 0.06, fz - 0.03, 0.05, 0.36, fz - 0.008, MT.PLASTIC);
    [-0.09, 0.09].forEach(function (x) { g.box(x - 0.012, 0.4, fz - 0.0015, x + 0.012, 0.66, fz - 0.0005, MT.PLASTIC); }); g.tag(n1, 1, null);
    var n2 = g.count(); g.box(-0.07, 0.44, fz - 0.07, 0.07, 0.455, fz, MT.WOOD); g.tag(n2, null, 1);
    for (var q = 0; q < 4; q++) { var x2 = (q - 1.5) * 0.016; g.box(x2 - 0.001, 0.3, fz - 0.07, x2 + 0.001, L + 0.5, fz - 0.067, MT.STEEL); }
    tubeAlong(g, [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.2, 0)], 0.008, 5, MT.STEEL);
    b.add(g, T(0, 0.2, 0, 0.13, 0, 0));
    [-1, 1].forEach(function (sx) { tubeAlong(b, [new THREE.Vector3(sx * 0.4, 0, 0.42), new THREE.Vector3(sx * 0.12, 1.0, 0.25)], 0.01, 5, MT.ANOD); });
  }); }
  function drumKit() { return furn("drums", function (b) {               // the drummer at +z facing -z
    function drum(x, y, z, r, h, rx, rz, shell) { var n0 = b.count(); b.geo(new THREE.CylinderGeometry(r, r, h, 24, 1, true), T(x, y, z, rx, 0, rz), MT.PLASTIC); b.tag(n0, shell, null);
      [-1, 1].forEach(function (s) { var n1 = b.count(); b.geo(new THREE.CircleGeometry(r * 0.99, 24), T(x, y, z, rx, 0, rz).multiply(new THREE.Matrix4().makeTranslation(0, s * h / 2, 0)).multiply(new THREE.Matrix4().makeRotationX(-s * Math.PI / 2)), MT.PLASTIC); b.tag(n1, 0, null); }); }
    drum(0, 0.29, -0.05, 0.28, 0.42, Math.PI / 2, 0, 1);                    // the bass drum on its side
    drum(-0.17, 0.72, -0.08, 0.14, 0.13, 0.5, 0.15, 1); drum(0.17, 0.72, -0.08, 0.15, 0.14, 0.5, -0.15, 1);   // two toms on it
    drum(0.36, 0.62, 0.22, 0.18, 0.13, 0.12, -0.1, 5); drum(-0.48, 0.42, 0.25, 0.2, 0.34, 0, 0, 1);        // the snare, the floor tom
    [[0.36, 0.22, 0.48], [-0.48, 0.25, 0.08]].forEach(function (p) { tubeAlong(b, [new THREE.Vector3(p[0], 0, p[1]), new THREE.Vector3(p[0], p[2], p[1])], 0.012, 6, MT.STEEL); });
    [[0.66, 0.36, 0.86, 0.17, 0], [-0.52, -0.25, 1.32, 0.21, 0.3], [0.52, -0.3, 1.25, 0.2, -0.25]].forEach(function (c) {      // hi-hat and two cymbals on stands
      tubeAlong(b, [new THREE.Vector3(c[0], 0, c[1]), new THREE.Vector3(c[0], c[2], c[1])], 0.009, 6, MT.STEEL);
      latheOn(b, c[0], c[2], c[1], [[0.0, 0.03], [c[3] * 0.18, 0.025], [c[3] * 0.25, 0.01], [c[3], 0.0], [c[3], -0.004], [0.0, 0.022]], 22, MT.BRASS, 0); });
    latheOn(b, 0, 0, 0.62, [[0.18, 0], [0.18, 0.02], [0.03, 0.03], [0.03, 0.47], [0.0, 0.47]], 14, MT.STEEL, 0); softBox(b, -0.17, 0.47, 0.45, 0.17, 0.55, 0.79, 0.04, MT.FABRIC, 0, { py: 0.01 }, 0);
  }); }
  // a fabric panel for the room's sound, w along the wall, h tall, its face at -x (a radial wall's frame)
  function soundPanel(w, h, col) { return furn("spanel" + w + "_" + h + "_" + col, function (b) { softBox(b, -0.05, -h / 2, -w / 2, 0, h / 2, w / 2, 0.015, MT.FABRIC, col, null, 0); }); }
  // oak slats on dark felt on the inside face of a curved wall at radius r (as slatWall), from angle a0 to a1 (a0 < a1), oak edges
  function arcSlats(B, r, a0, a1, y0, y1) {
    var n = Math.max(2, Math.ceil((a1 - a0) * r / 0.5)), ny = Math.max(2, Math.round((y1 - y0) / 1.2));
    B.surf(n, ny, function (i, j, q) { var a = lerp(a0, a1, i / n), p = crsPt(r, a), d = crsPt(1, a), y = lerp(y0, y1, j / ny);
      q.p[0] = p.x; q.p[1] = y; q.p[2] = p.z; q.nn = [PAL.c.x - d.x, 0, PAL.c.z - d.z]; q.f[0] = y * 0.2; q.f[1] = a * r; q.f2[0] = 7; q.f2[1] = 1; q.m = MT.WOOD; });
    flat(B, r, r + 0.045, a0, a1, y1, MT.WOOD, 1, false); flat(B, r, r + 0.045, a0, a1, y0, MT.WOOD, 1, true);
    [a0, a1].forEach(function (a, k) { var e = new Builder(); e.box(-0.02, 0, 0, 0.02, y1 - y0, 0.045, MT.WOOD); e.tag(0, null, 1); B.add(e, crsFrame(r, a + (k ? -1 : 1) * 0.02 / r, y0)); });
  }
  // a practice booth on the corridor wall between angles lo and hi: felt walls 2.5 m high on oak, an oak roof, a glass front
  // with its door, an upright piano and its bench inside, a lamp; sides: the angles that need a wall of their own
  function practiceBooth(B, F, lo, hi, sides) {
    var C = CRS, r0 = C.rc + 0.075, r1 = C.rc + 2.35, rm = (r0 + r1) / 2, y = F.y, h = 2.5, am = (lo + hi) / 2, wd = (hi - lo) * rm, w1 = (hi - lo) * r1;
    sides.forEach(function (a) { var w = new Builder(); w.box(-0.05, 0, 0, 0.05, h, r1 - r0, MT.FABRIC); w.tag(0, 10, null); var no = w.count(); w.box(-0.056, 0, r1 - r0 - 0.07, 0.056, h, r1 - r0 + 0.01, MT.WOOD); w.tag(no, null, 1); B.add(w, crsFrame(r0, a, y)); });
    var rf = new Builder(); rf.box(-wd / 2 - 0.06, h, 0, wd / 2 + 0.06, h + 0.07, r1 - r0 + 0.02, MT.WOOD); rf.tag(0, null, 1); B.add(rf, crsFrame(r0, am, y));
    var n = Math.max(2, Math.ceil(w1 / 0.5));
    CRS_GLASS.surf(n, 1, function (i, j, q) { var a = lerp(lo, hi, i / n), p = crsPt(r1, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = j ? y + h : y + 0.08; q.p[2] = p.z; q.nn = [PAL.c.x - d.x, 0, PAL.c.z - d.z]; q.f[0] = a * r1; q.f[1] = q.p[1]; q.f2[0] = j ? h : 0.08; q.f2[1] = 1; q.m = 0; });   // its normal toward the corridor: from the room it mirrors the room
    var fr = new Builder(); fr.box(-w1 / 2, 0, -0.04, w1 / 2, 0.08, 0.04, MT.WOOD); fr.box(-w1 / 2, h - 0.09, -0.04, w1 / 2, h, 0.04, MT.WOOD);
    [-w1 / 2 + 0.035, -w1 / 2 + 0.98, w1 / 2 - 0.035].forEach(function (x) { fr.box(x - 0.035, 0, -0.045, x + 0.035, h, 0.045, MT.WOOD); });
    fr.box(-w1 / 2, 2.08, -0.04, -w1 / 2 + 0.98, 2.15, 0.04, MT.WOOD); fr.tag(0, null, 1);
    fr.box(-w1 / 2 + 0.86, 0.9, 0.045, -w1 / 2 + 0.875, 1.2, 0.06, MT.STEEL); fr.box(-w1 / 2 + 0.86, 0.9, 0.04, -w1 / 2 + 0.875, 0.915, 0.06, MT.STEEL); fr.box(-w1 / 2 + 0.86, 1.185, 0.04, -w1 / 2 + 0.875, 1.2, 0.06, MT.STEEL);
    B.add(fr, crsFrame(r1, am, y));
    var ua = am + (F.sgn > 0 ? 1 : -1) * 0.25 / rm; crsPlaceTrue(B, uprightPiano(), r0 + 0.34, ua, y, ROT.out); crsPlace(B, pianoBench(), r0 + 1.06, ua, y, 0);
    var pn = new Builder(); pn.box(0, 1.35, -wd / 2 + 0.15, 0.04, 2.3, wd / 2 - 0.15, MT.FABRIC); pn.tag(0, 1, null); B.add(pn, crsFrame(r0, am, y, -Math.PI / 2));
    var lp = crsPt(rm + 0.2, am); globeLamp(B, lp, y + 2.12, h - 2.12); wLight(lp.x, y + 2.05, lp.z, LAMPC, 0.75, 3.2, [0, -1, 0], 1);
    crsObst(r0 - 0.1, r1 + 0.1, lo - 0.06 / rm, hi + 0.06 / rm, F.floor);
  }
  function globeLamp(B, p, y, cord) {                                     // a white glass globe on its cord
    B.geo(addF2(new THREE.SphereGeometry(0.1, 16, 12), 1.1, 0.1), T(p.x, y, p.z), MT.LIGHT, 1);
    tubeAlong(B, [new THREE.Vector3(p.x, y + 0.1, p.z), new THREE.Vector3(p.x, y + cord, p.z)], 0.004, 4, MT.STEEL);
  }
  // on the back (or the front) wall at radius r, y above the floor, a piece built in a radial wall's frame
  function onWall(B, F, back, r, y, fb) { var s = back ? -F.sgn : F.sgn, wa = back ? F.back : F.front; B.add(fb, crsFrame(r, wa - s * 0.075 / r, F.y + y, s > 0 ? 0 : Math.PI)); }
  function musicRoom(B, rm, F) {
    var C = CRS, y = F.y, ib = F.sgn > 0 ? ROT.plusA : ROT.minusA;
    // the stage: oak slats along the outer wall, the grand piano before them on a forest rug, a lamp by the player, a wash of light
    var s0 = F.at(1.9, true), s1 = F.at(10.9, true); arcSlats(B, C.r1 - 0.1, Math.min(s0, s1), Math.max(s0, s1), y + 0.1, y + 3.6);
    var pa = F.at(5.2, true); rugAt(B, 59.4, pa, y, 4.6, 3.4, 11);
    crsPlaceTrue(B, grandPiano(), 60.0, pa, y, ib); crsObst(59.2, 60.85, F.at(3.45, true), F.at(6.35, true), F.floor);
    var la = F.at(3.85, true); crsPlace(B, floorLamp(), 61.25, la, y, 0); lampLight(61.25, la, y, 1.4, 0.7, 3.6); crsObst(61.05, 61.45, la - 0.2 / 61.2, la + 0.2 / 61.2, F.floor);
    var wl = crsPt(60.4, F.at(7.6, true)); wLight(wl.x, y + 3.5, wl.z, LAMPC, 1.0, 6, [0, -0.5, 0], 1);
    var ka = F.at(4.6, true), kp = crsPt(59.8, ka); B.add(pendantCone(), crsFrame(59.8, ka, y + 2.65));            // a brass cone low over the keys and the score
    tubeAlong(B, [new THREE.Vector3(kp.x, y + 2.93, kp.z), new THREE.Vector3(kp.x, ceilY(rm, F.floor, 59.8), kp.z)], 0.004, 3, MT.STEEL); wLight(kp.x, y + 2.55, kp.z, LAMPC, 1.2, 5, [0, -1, 0], 0.7);
    // two more pendants over the chairs, between the room's two rows
    [3.4, 8.3].forEach(function (d) { var pa2 = F.at(d, true), yc = ceilY(rm, F.floor, 55.8), yl = Math.min(y + 3.25, yc - 0.5), M = crsFrame(55.8, pa2, yl); if (inSkylight(55.8, pa2, 0.5)) return; B.add(linearPendant(), M);
      [-0.5, 0.5].forEach(function (x) { tubeAlong(B, [new THREE.Vector3(x, 0.06, 0).applyMatrix4(M), new THREE.Vector3(x, yc - yl, 0).applyMatrix4(M)], 0.003, 3, MT.STEEL); });
      var lp = crsPt(55.8, pa2); wLight(lp.x, yl - 0.15, lp.z, LAMPC, 1.8, 8, [0, -1, 0], 1); });
    // the ensemble: three arcs of chairs facing the piano, 7, 9 and 7, a stand before each chair of the first
    var fr = 59.6, fa = F.at(5.85, true);
    [[3.6, 7, 20], [5.0, 9, 15], [6.4, 7, 12]].forEach(function (row, ri) {
      for (var k = 0; k < row[1]; k++) {
        var psi = (k - (row[1] - 1) / 2) * row[2] * D2R, r = fr - row[0] * Math.cos(psi), a = fa - F.sgn * row[0] * Math.sin(psi) / ((r + fr) / 2), rot = Math.atan2(-(fr - r), (fa - a) * r);
        crsPlace(B, ensembleChair(1), r, a, y, rot); crsObst(r - 0.3, r + 0.3, a - 0.3 / r, a + 0.3 / r, F.floor);
        if (!ri) { var R2 = row[0] - 0.62, rs = fr - R2 * Math.cos(psi), as = fa - F.sgn * R2 * Math.sin(psi) / ((rs + fr) / 2); crsPlace(B, musicStand(), rs, as, y, rot); }
      }
    });
    // the corridor wall: two practice booths from the back corner, three bookcases of scores, then the door
    var bw = F.sgn * 2.2 / 50.8, b1 = F.back + bw, b2 = F.back + 2 * bw;
    practiceBooth(B, F, Math.min(F.back, b1), Math.max(F.back, b1), [b1]); practiceBooth(B, F, Math.min(b1, b2), Math.max(b1, b2), [b2]);
    shelvesOnCorridor(B, F, 3, 2 * 2.2 * 49.87 / 50.8 + 0.3);
    // the back wall: three guitars hung, the cello and the double bass on their stands, the drum kit in the corner on a rug
    [[52.8, 0], [53.55, 1], [54.3, 2]].forEach(function (gt) { onWall(B, F, true, gt[0], 2.08, hungGuitar(gt[1], 1)); });
    crsPlace(B, cello(), 55.4, F.at(0.55, false), y, ib); crsPlace(B, doubleBass(), 56.45, F.at(0.72, false), y, ib); crsObst(54.9, 57.0, F.back, F.at(1.25, false), F.floor);
    var dk = F.at(1.45, false), rd = 59.4; rugAt(B, rd, dk, y, 2.6, 2.4, 0); crsPlaceTrue(B, drumKit(), rd, dk, y, ib); crsObst(rd - 1.0, rd + 1.0, F.back, F.at(2.5, false), F.floor);
    // the front wall: a violin, a viola and a ukulele by the door, four felt panels across the middle
    onWall(B, F, false, 51.4, 1.95, hungFiddle(1)); onWall(B, F, false, 52.0, 2.02, hungFiddle(1.17)); onWall(B, F, false, 52.65, 1.9, hungGuitar(0, 0.45));
    [54.8, 55.85, 56.9, 57.95].forEach(function (r) { onWall(B, F, false, r, 1.75, soundPanel(0.9, 1.9, 5)); });
    roomPlants(B, rm, F, null);
  }
