  /* ===================== Notice boards: the contests and the clubs, pinned on cork ===================== */
  // Jim, 6 Oct 2026: "please continue to improve/bugfix/continue for the walking experience and real life experience".
  // Cork boards in aluminium frames on the lower corridor's back wall (RING_BOARDS in campus_rooms.py): by the
  // competition room the term's contests, each on its own flyer (from P2.contests); under the Gate Hall the clubs and
  // events the rooms are planned for (each room's second use, with its number). Each board on a canvas of its own.
  var NOTICE = { W: 1536, H: 768, w: 2.4, h: 1.2, yc: 1.55 };
  var NOTE_COL = { CMS: "#b3322b", MAA: "#1f4e8c", Waterloo: "#6b3f8f", "": "#2f7d4f", team: "#c77d1a" };
  function corkCanvas() {
    var s = MOBILE ? 0.5 : 1, cv = mkCanvas(Math.round(NOTICE.W * s), Math.round(NOTICE.H * s)), g = cv.getContext("2d"), R = mulberry(4242);
    g.scale(s, s);
    var gr = g.createLinearGradient(0, 0, NOTICE.W, NOTICE.H); gr.addColorStop(0, "#b98d5c"); gr.addColorStop(1, "#a97c4e"); g.fillStyle = gr; g.fillRect(0, 0, NOTICE.W, NOTICE.H);
    for (var k = 0; k < 9000; k++) { var v = R(); g.fillStyle = v < 0.5 ? "rgba(70,42,20," + (0.18 + 0.3 * R()) + ")" : "rgba(235,200,150," + (0.12 + 0.25 * R()) + ")"; g.fillRect(R() * NOTICE.W, R() * NOTICE.H, 1 + 2.2 * R(), 1 + 2.2 * R()); }
    return { cv: cv, g: g, R: R };
  }
  // the words of t in lines no wider than w (in the font set)
  function wrapText(g, t, w) {
    var out = [], cur = "";
    String(t).split(" ").forEach(function (wd) { var tr = cur ? cur + " " + wd : wd; if (g.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; });
    if (cur) out.push(cur); return out;
  }
  // a sheet pinned at (x, y), w by h, turned a little: a coloured band with its title, then its lines ([text, size, weight,
  // colour], or null for a gap), each wrapped to the sheet; a stamp across it if given
  function flyer(g, x, y, w, h, rot, paper, band, head, lines, pin, stamp) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
    g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(5, 7, w, h);
    g.fillStyle = paper; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
    g.textAlign = "left"; g.textBaseline = "top";
    var yy = 14;
    if (band) {
      var hs = 21; g.font = "700 21px " + SANS; var hl = wrapText(g, head, w - 34);
      if (hl.length > 2) { hs = 18; g.font = "700 18px " + SANS; hl = wrapText(g, head, w - 34); }      // a long title in a smaller type
      var bh = 22 + hl.length * (hs + 4);
      g.fillStyle = band; g.fillRect(0, 0, w, bh); g.fillStyle = "#fff"; hl.forEach(function (t, k) { g.fillText(t, 14, 13 + k * (hs + 4)); }); yy = bh + 11;
    }
    lines.forEach(function (l) {
      if (l === null) { yy += 7; return; } if (!l[0]) return;
      g.font = (l[2] || 400) + " " + l[1] + "px " + SANS; g.fillStyle = l[3] || "#24272c";
      wrapText(g, l[0], w - 28).forEach(function (t) { g.fillText(t, 14, yy); yy += l[1] * 1.24; });
    });
    g.restore();
    if (stamp) { g.save(); g.translate(w * 0.55, h * 0.62); g.rotate(-0.3); g.strokeStyle = "rgba(190,30,30,0.85)"; g.lineWidth = 6; g.strokeRect(-w * 0.34, -30, w * 0.68, 60); g.fillStyle = "rgba(190,30,30,0.85)"; g.font = "800 42px " + SANS; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(stamp, 0, 2); g.restore(); }
    g.fillStyle = pin; g.beginPath(); g.arc(w - 15, 10, 8.5, 0, 2 * Math.PI); g.fill(); g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.arc(w - 18, 7, 3, 0, 2 * Math.PI); g.fill();
    g.restore();
  }
  // the board's name, printed on a strip across its top
  function boardHead(g, t) {
    g.fillStyle = "#2a2d31"; g.fillRect(0, 0, NOTICE.W, 58); g.fillStyle = "#e8b04a"; g.fillRect(0, 54, NOTICE.W, 4);
    g.fillStyle = "#ffffff"; g.font = "700 30px " + SANS; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(t.toUpperCase(), 30, 29);
  }
  // lay sheets out in two rows under the strip, each in its slot with a little jitter; hk: the share of the slot's height used
  function boardLayout(n, R, hk) {
    var cols = Math.ceil(n / 2), out = [], mx = 30, top = 74, cw = (NOTICE.W - 2 * mx) / cols, rh = (NOTICE.H - top - 14) / 2;
    for (var i = 0; i < n; i++) { var c = i % cols, r = Math.floor(i / cols), h = (rh - 20) * (hk || 1); out.push({ x: mx + c * cw + 6 + R() * 10, y: top + r * rh + 4 + R() * (rh - 20 - h + 8), w: cw - 20, h: h, rot: (R() - 0.5) * 0.07 }); }
    return out;
  }
  var PINS = ["#d23b2f", "#2c6fbb", "#e3b31c", "#2f9a52", "#f2f2f2"];
  function drawContestBoard(bd) {
    var C = P2.contests, B = corkCanvas(), g = B.g, R = B.R, items = [];
    boardHead(g, bd.title);
    C.contests.forEach(function (c) {
      var full = c.early === "FULL";
      items.push({ band: NOTE_COL[c.org] || NOTE_COL[""], head: (c.org ? c.org + " · " : "") + c.name, stamp: full ? "FULL" : null,
                   lines: [[c.when, 17, 700], [c.info.join(" · "), 14, 400, "#444"], null, [c.grades.join(" · "), 16, 700], [c.level.join(" · "), 13, 400, "#555"], null,
                           [full ? "Registration closed" : "Early price until " + c.early + "; deadline " + c.deadline, 14], [c.price[0] + " TTmath · " + c.price[1] + " others", 14, 700], null, ["Room 139, Ramanujan", 15, 700, "#7a1f1a"]] });
    });
    C.teams.forEach(function (t) {
      items.push({ band: NOTE_COL.team, head: t.name, lines: [[t.when, 19, 700], [t.grades, 17, 700], null, [t.level, 16], ["Price: " + t.price, 16], null, ["TTmath students only", 16, 700, "#7a4a0a"]] });
    });
    var L = boardLayout(items.length, R, 1);
    items.forEach(function (it, i) { var l = L[i]; flyer(g, l.x, l.y, l.w, l.h, l.rot, i % 3 === 2 ? "#fbf7ea" : "#ffffff", it.band, it.head, it.lines, PINS[i % PINS.length], it.stamp); });
    return B.cv;
  }
  function drawClubBoard(bd) {
    var B = corkCanvas(), g = B.g, R = B.R, rooms = {}, items = [];
    boardHead(g, bd.title);
    P2.ring.rooms.forEach(function (r) { rooms[r.code] = r; });
    var papers = ["#fff8d6", "#ffffff", "#e7f2fb", "#fde9e4", "#eef6e6", "#f3ecfa"], bands = ["#1f4e8c", "#2f7d4f", "#b3322b", "#c77d1a", "#6b3f8f", "#2b7a78"];
    (bd.rooms || []).forEach(function (code, i) {
      var r = rooms[code]; if (!r || !r.also) return;
      var what = r.also.replace(/\.$/, "");
      items.push({ paper: papers[i % papers.length], band: bands[i % bands.length], head: what.charAt(0).toUpperCase() + what.slice(1),
                   lines: [[r.name.split(":")[0] + (r.no ? ", room " + r.no : ""), 18, 700], [r.floor === "lower" ? "Downstairs" : "Upstairs", 16, 400, "#555"]] });
    });
    var L = boardLayout(items.length, R, 0.72);
    items.forEach(function (it, i) { var l = L[i]; flyer(g, l.x, l.y, l.w, l.h, l.rot, it.paper, it.band, it.head, it.lines, PINS[(i + 2) % PINS.length]); });
    return B.cv;
  }
  // the boards on the lower corridor's back wall: an aluminium frame, the cork with its sheets, a light over it
  function noticeBoards(W) {
    var C = CRS, D = D2R;
    (P2.ring.boards || []).forEach(function (bd) {
      var y = bd.floor === "upper" ? C.yU : C.yL, yc = y + NOTICE.yc, a = bd.a * D, rw = C.r0 + 0.02, w = NOTICE.w, h = NOTICE.h;
      var cv = bd.topic === "contests" ? drawContestBoard(bd) : drawClubBoard(bd);
      var M = crsFrame(rw, a, yc), fr = new Builder();
      fr.box(-w / 2 - 0.04, -h / 2 - 0.04, 0.004, w / 2 + 0.04, h / 2 + 0.04, 0.03, MT.STEEL);
      W.add(fr, M);
      var o = crsPt(1, a), t = crsPt(1, a + Math.PI / 2), N = new THREE.Vector3(o.x - PAL.c.x, 0, o.z - PAL.c.z).normalize(), Rv = new THREE.Vector3(PAL.c.x - t.x, 0, PAL.c.z - t.z).normalize();
      var cp = crsPt(rw + 0.032, a), P = new THREE.Vector3(cp.x, yc, cp.z), pos = [], uvs = [];
      [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(function (c) { pos.push(P.x + Rv.x * c[0] * w / 2, P.y + c[1] * h / 2, P.z + Rv.z * c[0] * w / 2); uvs.push(c[2], c[3]); });
      var tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: 0.34 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS, side: THREE.DoubleSide });
      var m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; scene.add(m);
      var lp = P.clone().addScaledVector(N, 1.1); wLight(lp.x, y + C.hC - 0.25, lp.z, LAMPC, 0.9, 4, [-N.x * 0.45, -0.89, -N.z * 0.45], 1.5);
    });
  }
