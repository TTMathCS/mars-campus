  /* ===================== Finding the way along the Ring: direction signs, exit signs, the corridors' ends ===================== */
  // Jim, 5 Oct 2026: "each area esp classroom should have room number so students know which room they should go"; 6 Oct
  // 2026: "please continue to improve/bugfix/continue for the walking experience and real life experience". Blade signs
  // hang across the corridors on both floors: each face lists the numbers of the rooms ahead of you that way, up to the
  // next sign (and the halls and stairs), at the angles the program gives (RING_SIGNS in campus_rooms.py). A lit green exit
  // sign over each stair's door on both floors. Drawn on canvases of their own (the atlas is full).
  var SIGN = { cols: 5, rows: 10, W: 384, H: 96 };
  // the rooms ahead from angle a (degrees) toward decreasing (dir -1) or increasing (dir +1) angle, within span degrees
  function roomsAhead(fl, a, dir, span) {
    var out = [];
    P2.ring.rooms.forEach(function (rm) {
      if (rm.band || rmFloors(rm).indexOf(fl) < 0) return;
      var m = (rm.a[0] + rm.a[1]) / 2, d = (((m - a) * dir) % 360 + 540) % 360 - 180;
      if (d <= 0 || d > span) return;
      out.push({ rm: rm, d: d });
    });
    return out.sort(function (p, q) { return p.d - q.d; });
  }
  function aheadLabel(list) {
    var nos = list.filter(function (x) { return x.rm.no; }).map(function (x) { return x.rm.no; }), extra = [];
    list.forEach(function (x) { var c = x.rm.code; if (c === "T06-16" || c === "T06-18") extra.push("Stair"); if (c === "T06-01" || c === "T06-08") extra.push("Hall"); if (c === "T06-27" || c === "T06-35") extra.push("Gate Hall"); });
    var txt = nos.length > 4 ? nos[0] + " – " + nos[nos.length - 1] : nos.join("  ·  ");
    return { nos: txt, extra: extra.filter(function (v, i, s) { return s.indexOf(v) === i; }).join("  ·  ") };
  }
  function drawSignFace(g, x, y, lab) {
    var W = SIGN.W, H = SIGN.H;
    g.fillStyle = "#23272c"; g.fillRect(x, y, W, H); g.fillStyle = "#e8b04a"; g.fillRect(x, y, 8, H);
    g.fillStyle = "#ffffff"; g.font = "700 50px " + SANS; g.textBaseline = "middle"; g.textAlign = "left"; g.fillText("↑", x + 20, y + H / 2 + 2);
    g.font = "700 40px " + SANS; fitText(g, lab.nos || lab.extra, x + 62, y + (lab.nos && lab.extra ? H * 0.36 : H / 2), W - 74);
    if (lab.nos && lab.extra) { g.fillStyle = "#c9ced4"; g.font = "500 24px " + SANS; fitText(g, lab.extra, x + 62, y + H * 0.76, W - 74); }
  }
  // the green exit sign: a running figure out through a door, an arrow
  function exitCanvas() {
    var cv = mkCanvas(256, 128), g = cv.getContext("2d");
    g.fillStyle = "#0b7d3e"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#ffffff"; g.fillStyle = "#ffffff"; g.lineCap = "round"; g.lineJoin = "round";
    g.lineWidth = 6; g.strokeRect(150, 18, 54, 92);                                                              // the door
    g.beginPath(); g.arc(98, 30, 10, 0, 7); g.fill();                                                             // the figure
    g.lineWidth = 12; g.beginPath(); g.moveTo(94, 46); g.lineTo(84, 76); g.stroke();
    g.lineWidth = 9; g.beginPath(); g.moveTo(92, 50); g.lineTo(112, 62); g.lineTo(126, 54); g.moveTo(90, 52); g.lineTo(72, 60); g.lineTo(64, 72); g.stroke();
    g.beginPath(); g.moveTo(84, 76); g.lineTo(104, 92); g.lineTo(110, 112); g.moveTo(84, 76); g.lineTo(68, 96); g.lineTo(48, 98); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(218, 64); g.lineTo(244, 64); g.moveTo(234, 54); g.lineTo(244, 64); g.lineTo(234, 74); g.stroke();   // the arrow
    return cv;
  }
  // a picture on a curved wall at radius r facing in, from angle a0 to a1 (the viewer's left to right), y0 to y0 + h
  function arcQuad(cv, r, a0, a1, y0, h, bright) {
    var tex = new THREE.CanvasTexture(cv), pos = [], uvs = [];
    [[a0, y0, 0, 0], [a1, y0, 1, 0], [a1, y0 + h, 1, 1], [a0, y0 + h, 0, 1]].forEach(function (c) { var p = crsPt(r, c[0]); pos.push(p.x, c[1], p.z); uvs.push(c[2], c[3]); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]);
    var m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: bright } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS }));
    m.matrixAutoUpdate = false; scene.add(m); return m;
  }
  // all of it, once the Ring's rooms have their doors
  function ringSigns(W) {
    var C = CRS, D = D2R, rM = (C.r0 + C.rc) / 2, sw = 1.3, sh = 0.325;
    var spots = P2.ring.signs;
    var cv = mkCanvas(SIGN.cols * SIGN.W, SIGN.rows * SIGN.H), g = cv.getContext("2d"), slot = 0, faces = [];
    ["upper", "lower"].forEach(function (fl) {
      var S = spots[fl], y = fl === "upper" ? C.yU : C.yL, yc = y + C.hC - 0.5;
      S.forEach(function (a, i) {
        [-1, 1].forEach(function (dir) {                                                           // the face toward +a is read by those walking toward -a
          var nb = S[(i + (dir > 0 ? -1 : 1) + S.length) % S.length], span = Math.abs(((nb - a) % 360 + 540) % 360 - 180);   // up to the next sign that way
          span = Math.min(45, span < 8 ? 40 : span);
          var lab = aheadLabel(roomsAhead(fl, a, -dir, span)); if (!lab.nos && !lab.extra) return;
          var sx = (slot % SIGN.cols) * SIGN.W, sy = Math.floor(slot / SIGN.cols) * SIGN.H; drawSignFace(g, sx, sy, lab);
          faces.push({ a: a * D + dir * 0.03 / rM, y: yc, uv: [sx / cv.width, 1 - (sy + SIGN.H) / cv.height, (sx + SIGN.W) / cv.width, 1 - sy / cv.height], dir: dir }); slot++;
        });
        var M = crsFrame(rM, a * D, yc), bx = new Builder(); bx.box(-0.025, -sh / 2 - 0.02, -sw / 2 - 0.02, 0.025, sh / 2 + 0.02, sw / 2 + 0.02, MT.ANOD); bx.tag(0, 3, null); W.add(bx, M);
        [-0.5, 0.5].forEach(function (z) { var p0 = new THREE.Vector3(0, sh / 2, z).applyMatrix4(M), p1 = new THREE.Vector3(0, y + C.hC - yc, z).applyMatrix4(M); tubeAlong(W, [p0, p1], 0.006, 4, MT.STEEL); });
      });
    });
    // the faces: one mesh, both sides of each blade; the text reads left to right to whoever faces it
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var pos = [], uvs = [], idx = [];
    faces.forEach(function (f) {
      var n = pos.length / 3, rl = f.dir > 0 ? rM - sw / 2 : rM + sw / 2, rr = f.dir > 0 ? rM + sw / 2 : rM - sw / 2;   // facing +a: left is the inner side
      [[rl, 0, f.uv[0], f.uv[1]], [rr, 0, f.uv[2], f.uv[1]], [rr, 1, f.uv[2], f.uv[3]], [rl, 1, f.uv[0], f.uv[3]]].forEach(function (c) { var p = crsPt(c[0], f.a); pos.push(p.x, f.y + (c[1] ? sh / 2 : -sh / 2), p.z); uvs.push(c[2], c[3]); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3, n, n + 2, n + 1, n, n + 3, n + 2);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(idx);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: 0.75 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS });
    var sm = new THREE.Mesh(geo, mat); sm.matrixAutoUpdate = false; scene.add(sm);
    // exit signs over the stairs' doors, both floors, on the corridor side
    var ex = exitCanvas();
    P2.ring.rooms.forEach(function (rm) {
      if (!isBay(rm)) return; var d = (rm.a[0] + rm.a[1]) / 2 * D;
      var rS = C.rc - C.wall / 2 - 0.015;
      [C.yU, C.yL].forEach(function (y) { arcQuad(ex, rS, d - 0.21 / rS, d + 0.21 / rS, y + 2.4, 0.21, 1.15); });
    });
  }
