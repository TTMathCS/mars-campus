  /* ===================== The classrooms' details: a clock over the board, a pinboard on the back wall ===================== */
  // Jim, 7 Oct 2026: "it is almost good. but need more details". Over each classroom's board a wall clock whose hands keep
  // the visitor's own time; on the back wall (solid wall, never a window) a cork pinboard in an oak frame with what a real
  // classroom's board carries: the room's classes this week (from the timetable), a problem of the week for the room's
  // mathematician, a pupil's copy of a diagram, the next contest's flyer and a marked quiz (RING_PINS in campus_rooms.py).
  // The pinboards are drawn on one canvas, a cell each, and hung as one mesh; the clocks' bodies are baked with the room,
  // their hands are small meshes turned every frame.
  var PINB = { W: 1024, H: 512, w: 2.8, h: 1.4, yc: 1.6, r: 58.95 }, CLOCKS = [], CLOCK_T = null, CLOCK_SIGN = -1;
  // the clock's body: its back on the wall at x = 0, its face toward -x, in the wall's plane (y up, z along the wall)
  function wallClock() { return furn("wclock", function (b) {
    var R = 0.21, n0 = b.count();
    b.geo(new THREE.CylinderGeometry(R, R, 0.05, 40), T(-0.025, 0, 0, 0, 0, Math.PI / 2), MT.ANOD);
    var n1 = b.count(); b.geo(new THREE.CircleGeometry(R * 0.9, 40), T(-0.0505, 0, 0, 0, -Math.PI / 2, 0), MT.PLASTIC); b.tag(n1, 0, null);
    for (var k = 0; k < 12; k++) {                                         // the marks: long at the quarters
      var t = k / 12 * 2 * Math.PI, big = k % 3 === 0, n2 = b.count();
      b.geo(new THREE.BoxGeometry(0.004, big ? 0.042 : 0.024, big ? 0.012 : 0.007), T(-0.0525, 0.155 * Math.cos(t), 0.155 * Math.sin(t), t, 0, 0), MT.PLASTIC); b.tag(n2, 1, null);
    }
    var n3 = b.count(); b.geo(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), T(-0.06, 0, 0, 0, 0, Math.PI / 2), MT.PLASTIC); b.tag(n3, 1, null);
  }); }
  var HAND_VS = "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
  var HAND_FS = "uniform vec3 uCol; uniform float uExposure; void main(){ vec3 c = uCol * uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
  function handMesh(len, wid, tail, x, col) {                              // a hand from its pivot up along +y, turned about x
    var g = new THREE.BoxGeometry(0.003, len + tail, wid); g.translate(x, (len - tail) / 2, 0);
    return new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Vector3().fromArray(col) }, uExposure: U.uExposure }, vertexShader: HAND_VS, fragmentShader: HAND_FS }));
  }
  // a clock over the room's board (or screen), its hands in a group hung in the clock's frame
  function clockAt(W, F, y) {
    var rM = F.rM, wa = F.front - F.sgn * 0.08 / rM, M = crsFrame(rM, wa, y, F.sgn > 0 ? 0 : Math.PI);
    W.add(wallClock(), M);
    var grp = new THREE.Group(); grp.matrixAutoUpdate = false; grp.matrix.copy(M); grp.matrixWorldNeedsUpdate = true;
    var c = { h: handMesh(0.105, 0.016, 0.025, -0.058, [0.004, 0.004, 0.005]), m: handMesh(0.16, 0.011, 0.03, -0.061, [0.004, 0.004, 0.005]), s: handMesh(0.165, 0.004, 0.045, -0.064, [0.12, 0.012, 0.008]) };
    grp.add(c.h); grp.add(c.m); grp.add(c.s); scene.add(grp); CLOCKS.push(c);
  }
  // each frame: the hands at the visitor's time (CLOCK_T, seconds after midnight, holds a time for shots)
  function clocksUpdate() {
    if (!CLOCKS.length) return;
    var d = new Date(), t = CLOCK_T !== null ? CLOCK_T : d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    var a = CLOCK_SIGN * 2 * Math.PI, h = (t / 3600) % 12 / 12, m = (t / 60) % 60 / 60, s = Math.floor(t % 60) / 60;
    CLOCKS.forEach(function (c) { c.h.rotation.x = a * h; c.m.rotation.x = a * m; c.s.rotation.x = a * s; });
  }
  // ---- the pinboards ----
  var DAY3 = { WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" };
  // the classes that meet in a room this week, in order: "Sat 9:15 am  L1 Contest" (the class's name without what it is)
  function roomWeek(no) {
    var T2 = P2.timetable, out = [];
    T2.groups.forEach(function (gr) { gr.classes.forEach(function (c) { c.rows.forEach(function (row) { row.forEach(function (cell, di) {
      if (cell && Math.abs(cell[1]) === no) { var sp = schSpan(cell[0]); out.push({ di: di, s: sp[0], name: c.name.split(" · ")[0], both: cell[1] < 0 }); }
    }); }); }); });
    return out.sort(function (p, q) { return p.di - q.di || p.s - q.s; });
  }
  // the next contest to come (by the visitor's date), else the last
  function nextContest() {
    var now = new Date(), today = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
    var cs = P2.contests.contests.slice().sort(function (p, q) { return p.screen.iso < q.screen.iso ? -1 : 1; });
    for (var i = 0; i < cs.length; i++) if (cs[i].screen.iso >= today && cs[i].deadline !== "FULL") return cs[i];
    return cs[cs.length - 1];
  }
  function pinHead(g, x, y, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 8, 0, 2 * Math.PI); g.fill(); g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.arc(x - 3, y - 3, 2.8, 0, 2 * Math.PI); g.fill(); }
  // a pupil's copy of one of the prints' drawings, a caption under it
  function diagramSheet(g, x, y, w, h, rot, subject, caption, pin) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
    g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(5, 7, w, h); g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
    var b = { x: 12, y: 12, w: w - 24, h: h - 46 };
    g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip(); g.textBaseline = "alphabetic"; (PRINT_DRAW[subject] || function () {})(g, b, 1, 0, 0); g.restore();
    g.fillStyle = "#30343a"; g.font = "italic 400 15px " + SERIF; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(caption, w / 2, h - 18); g.textAlign = "left";
    pinHead(g, w / 2, 10, pin); g.restore();
  }
  // a quiz, marked: ruled paper, four answers ticked, the mark in red
  var QUIZ = [["1.  3x + 5 = 20,  x = 5", "2.  √144 = 12", "3.  2⁵ = 32", "4.  15% of 80 = 12"], ["1.  (x − 2)(x + 3) = x² + x − 6", "2.  sin 30° = 1/2", "3.  7 × 8 = 56", "4.  1/3 + 1/6 = 1/2"],
              ["1.  a² + b² = c²:  5, 12, 13", "2.  17 is prime", "3.  0.375 = 3/8", "4.  the mean of 2, 4, 9 is 5"]];
  function quizSheet(g, x, y, w, h, rot, k, pin) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
    g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(5, 7, w, h); g.fillStyle = "#fdfdf8"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,140,200,0.45)"; g.lineWidth = 1; for (var yy = 52; yy < h - 8; yy += 30) { g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
    g.strokeStyle = "rgba(210,70,70,0.6)"; g.beginPath(); g.moveTo(34, 0); g.lineTo(34, h); g.stroke();
    g.fillStyle = "#1d2a5a"; g.font = "italic 400 17px " + SERIF; g.textBaseline = "alphabetic"; g.fillText("Quiz 3", 44, 34);
    QUIZ[k % QUIZ.length].forEach(function (t, i) { g.fillStyle = "#1d2a5a"; g.font = "italic 400 17px " + SERIF; g.fillText(t, 44, 76 + i * 30); g.fillStyle = "#c62f2f"; g.font = "700 20px " + SANS; g.fillText("✓", w - 34, 76 + i * 30); });
    g.strokeStyle = "#c62f2f"; g.lineWidth = 3; g.beginPath(); g.arc(w - 58, 34, 24, 0, 2 * Math.PI); g.stroke(); g.fillStyle = "#c62f2f"; g.font = "700 18px " + SANS; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("10/10", w - 58, 35);
    g.font = "italic 700 17px " + SERIF; g.fillText("Great work!", w - 92, h - 18); g.textAlign = "left";
    pinHead(g, w / 2, 10, pin); g.restore();
  }
  // one pinboard on its cell: the cork, then the sheets
  function drawPinboard(g, p, k) {
    var W = PINB.W, H = PINB.H, R = mulberry(500 + k), rm = P2.ring.rooms.filter(function (q) { return q.code === p.room; })[0] || {};
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#b98d5c"); gr.addColorStop(1, "#a97c4e"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var q = 0; q < 5200; q++) { var v = R(); g.fillStyle = v < 0.5 ? "rgba(70,42,20," + (0.18 + 0.3 * R()) + ")" : "rgba(235,200,150," + (0.12 + 0.25 * R()) + ")"; g.fillRect(R() * W, R() * H, 1 + 2 * R(), 1 + 2 * R()); }
    // the room's week
    var wk = roomWeek(rm.no), lines = [];
    if (!wk.length) lines.push(["No classes this term", 17, 700], ["The room is open for study and clubs", 15, 400, "#444"]);
    else wk.forEach(function (s) { lines.push([DAY3[P2.timetable.days[s.di]] + "  " + schHM(s.s, true) + "   " + s.name + (s.both ? "  + online" : ""), 15, 500]); });
    flyer(g, 24, 28, 322, 458, -0.008, "#ffffff", "#1f4e8c", "Room " + rm.no + " · " + (rm.name || "").split(":")[0] + " · this week", lines, PINS[0]);
    // the problem of the week, a pupil's diagram
    flyer(g, 366, 22, 304, 244, 0.018, "#fff8d6", "#c77d1a", "Problem of the week", [[p.problem, 17, 500], null, ["Answers in the box by Friday", 14, 700, "#7a4a0a"]], PINS[2]);
    diagramSheet(g, 364, 286, 304, 204, -0.022, p.subject, p.caption, PINS[3]);
    // the next contest, a marked quiz
    var c = nextContest();
    flyer(g, 694, 26, 306, 222, -0.014, "#ffffff", NOTE_COL[c.org] || NOTE_COL[""], (c.org ? c.org + " · " : "") + c.screen.short,
          [[c.when, 15, 700], [c.grades.join(" · "), 14, 500, "#444"], null, [c.price[0] + " TTmath · " + c.price[1] + " others", 15, 700], ["Register by " + c.deadline, 15, 700, "#7a1f1a"], ["Written in room 139", 14, 500, "#444"]], PINS[1]);
    quizSheet(g, 698, 270, 300, 214, 0.016, k, PINS[4]);
  }
  function pinAtlas(pins) {
    var s = MOBILE ? 0.5 : 1, cols = 2, rows = Math.ceil(pins.length / cols), cv = mkCanvas(Math.round(cols * PINB.W * s), Math.round(rows * PINB.H * s)), g = cv.getContext("2d");
    pins.forEach(function (p, k) { g.save(); g.scale(s, s); g.translate((k % cols) * PINB.W, Math.floor(k / cols) * PINB.H); g.textBaseline = "top"; drawPinboard(g, p, k); g.restore(); });
    return cv;
  }
  // every classroom's clock and pinboard
  function classDetails(W) {
    var C = CRS, pins = (P2.ring.pins || []).filter(function (p) { return C.rooms.some(function (q) { return q.code === p.room; }); });
    C.rooms.forEach(function (rm) {
      if (rm.kind !== "class") return; var F = roomFrame(rm);
      clockAt(W, F, F.y + (rm.code === "T06-10" ? 2.95 : 2.62));
    });
    if (!pins.length) return;
    var cols = 2, rows = Math.ceil(pins.length / cols), tex = { value: dummyTex };                 // drawn after the first frames (v0.49)
    lateTexture(function () { var t = new THREE.CanvasTexture(pinAtlas(pins)); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.value = t; });
    var pos = [], uvs = [], idx = [], brt = [], w = PINB.w, h = PINB.h;
    function unit(a) { var p = crsPt(1, a); return new THREE.Vector3(p.x - PAL.c.x, 0, p.z - PAL.c.z).normalize(); }
    pins.forEach(function (p, k) {
      var rm = C.rooms.filter(function (q) { return q.code === p.room; })[0], F = roomFrame(rm), wall = F.back, sd = F.sgn, rr = PINB.r, yc = F.y + PINB.yc;
      var Mf = crsFrame(rr, wall + sd * 0.095 / rr, yc), bz = new Builder(); bz.box(-0.018, -h / 2 - 0.045, -w / 2 - 0.045, 0.018, h / 2 + 0.045, w / 2 + 0.045, MT.WOOD); bz.tag(0, null, 1); W.add(bz, Mf);
      var cp = crsPt(rr, wall + sd * 0.116 / rr), P = new THREE.Vector3(cp.x, yc, cp.z), Rv = unit(wall).multiplyScalar(sd), Nv = unit(wall + Math.PI / 2).multiplyScalar(sd);
      var u0 = (k % cols) / cols, u1 = u0 + 1 / cols, v1 = 1 - Math.floor(k / cols) / rows, v0 = v1 - 1 / rows, n = pos.length / 3;
      [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]].forEach(function (c) { pos.push(P.x + Rv.x * c[0] * w / 2, P.y + c[1] * h / 2, P.z + Rv.z * c[0] * w / 2); uvs.push(c[2], c[3]); brt.push(rm.floor === "upper" ? 0.4 : 0.32); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      var lp = P.clone().addScaledVector(Nv, 1.3); wLight(lp.x, F.y + 3.0, lp.z, LAMPC, 0.6, 3.5, [-Nv.x * 0.45, -0.89, -Nv.z * 0.45], 1.5);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute("aBright", new THREE.Float32BufferAttribute(brt, 1)); geo.setIndex(idx);
    var vs = "attribute float aBright; varying vec2 vUv; varying float vB; void main(){ vUv = uv; vB = aBright; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    var fs = "uniform sampler2D map; uniform float uExposure; varying vec2 vUv; varying float vB;\n" +
      "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * vB + vec3(0.003); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
    var mat = new THREE.ShaderMaterial({ uniforms: { map: tex, uExposure: U.uExposure }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide });
    var m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; scene.add(m);
  }
  // ---- roller blinds on the outer glass (v0.40; CP-30): one in each bay between the mullions of the classrooms, the labs,
  // the study hall and the staff and games rooms; oatmeal screen fabric from a slim cassette under the head rail, most rolled
  // up, some let down a little, as the last class left them; none in the washrooms, the halls or the pod lounge ----
  var BLIND_KINDS = { "class": 1, lab: 1, study: 1, physics: 1, maker: 1, astro: 1, staff: 1, compete: 1, games: 1 };
  function outerBlinds(W) {
    var C = CRS, G = C.gal, D = D2R, r1 = C.r1, rb = r1 - 0.13, H = C.hR, R = mulberry(4040), modes = {};
    var sec = C.secs.filter(function (s) { return s.kind === "two"; })[0]; if (!sec) return;
    var a0 = Math.max(sec.a0, G.d0) * D, a1 = Math.min(sec.a1, G.d1) * D, nm = Math.max(1, Math.round((a1 - a0) * r1 / 1.5));   // the mullions, as glassFront spaces them
    var low = [0]; C.rooms.forEach(function (rm) { if (rm.floor === "lower" && !rm.band && rm.kind !== "service" && rm.kind !== "move" && rm.a[0] >= G.d0 && rm.a[1] <= G.d1) low.push((rm.a[0] + rm.a[1]) / 2 * D); });
    function arc(r, b0, b1, ya, yb, s, mat, f2) {                                 // a curved strip at r facing in (s 1) or out (s -1)
      var n = Math.max(2, Math.ceil((b1 - b0) * r / 0.5));
      W.surf(n, 1, function (i, j, q) { var a = lerp(b0, b1, i / n), p = crsPt(r, a), d = crsPt(1, a); q.p[0] = p.x; q.p[1] = j ? yb : ya; q.p[2] = p.z; q.nn = [(PAL.c.x - d.x) * s, 0, (PAL.c.z - d.z) * s]; q.f[0] = a * r; q.f[1] = q.p[1]; q.f2[0] = f2[0]; q.f2[1] = f2[1]; q.m = mat; });
    }
    ["upper", "lower"].forEach(function (fl) {
      var y = fl === "upper" ? C.yU : C.yL, doors = fl === "lower" ? low : [P2.pod_dock.a * D], yc = y + H - 0.1;
      for (var k = 0; k < nm; k++) {
        var b0 = lerp(a0, a1, k / nm) + 0.045 / r1, b1 = lerp(a0, a1, (k + 1) / nm) - 0.045 / r1, dm = (b0 + b1) / 2 / D;
        if (doors.some(function (d) { return b1 > d - 1.4 / r1 && b0 < d + 1.4 / r1; })) continue;           // a door's bay: its glass stays clear
        var rm = C.rooms.filter(function (q) { return !q.band && (q.floor === fl || q.floor === "both") && dm > q.a[0] && dm < q.a[1]; })[0];
        if (!rm || !BLIND_KINDS[rm.kind]) continue;
        var md = modes[rm.code]; if (md === undefined) { var t = R(); md = modes[rm.code] = t < 0.35 ? 0 : t < 0.8 ? 1 : 2; }
        var u = R(), drop = md === 0 ? 0.06 : md === 1 ? (u < 0.3 ? 0.5 + 0.7 * R() : 0.06) : (u < 0.7 ? 0.9 + 0.6 * R() : 0.06);
        var yt = yc - 0.11, yb = yt - drop;
        var cb = new Builder(); cb.box(-0.5, -0.11, -0.055, 0.5, 0, 0.055, MT.ANOD); cb.tag(0, 3, null);    // the cassette, 11 cm, under the head rail
        var half = (b1 - b0) / 2 * (r1 - 0.14), Mc = crsFrame(r1 - 0.14, (b0 + b1) / 2, yc).multiply(new THREE.Matrix4().makeScale(half / 0.5, 1, 1)); W.add(cb, Mc);
        arc(rb, b0, b1, yb, yt, 1, MT.FABRIC, [5, 0]); arc(rb + 0.004, b0, b1, yb, yt, -1, MT.FABRIC, [5, 0]);   // the fabric, both faces
        var bb = new Builder(); bb.box(-0.5, -0.03, -0.012, 0.5, 0, 0.012, MT.ANOD); W.add(bb, crsFrame(rb, (b0 + b1) / 2, yb).multiply(new THREE.Matrix4().makeScale(half / 0.5, 1, 1)));   // its bottom bar
      }
    });
  }
