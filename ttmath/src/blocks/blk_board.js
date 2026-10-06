  /* ===================== The Gate Hall's two big screens: the Fall timetable and the contests; the door plates ===================== */
  // Jim, 5 Oct 2026: "the schedule should be somewhere in the entrance so students know where they are going to"; "each
  // area esp classroom should have room number"; 6 Oct 2026: "2 big screens, one is for schedule, one is for below
  // contest", "compress all schedule within one screen, leaving second screen as contest above". On the Gate Hall's wall,
  // side by side: the whole 2026 Fall Schedule (P2.timetable, campus_timetable.py: every class, its days and times, and
  // the room it meets in (amber), online (red) or both (violet)) in two columns, and TTMath's Sept-Dec contests
  // (P2.contests, campus_contests.py). Each on its own texture, drawn once at 4096 x 2048 units (3072 px, 1536 on a
  // phone); a plain emissive material that takes the exposure like the screens in the campus material.
  var SCR = { W: 4096, H: 2048 };
  var AMB = "#e8b04a", VIO = "#a98be6", RED = "#ff7f6e", INK = "#eef0f2", DIM = "#9aa3ad", BLUE = "#86b6ff", PINK = "#e97fa0", MAG = "#e46ad6";
  function screenCanvas(draw) {
    var s = MOBILE ? 0.375 : 0.75, cv = mkCanvas(Math.round(SCR.W * s), Math.round(SCR.H * s)), g = cv.getContext("2d");
    g.scale(s, s); var bg = g.createLinearGradient(0, 0, 0, SCR.H); bg.addColorStop(0, "#0d1116"); bg.addColorStop(1, "#080a0d"); g.fillStyle = bg; g.fillRect(0, 0, SCR.W, SCR.H);
    g.textBaseline = "middle"; draw(g, SCR.W, SCR.H); return cv;
  }
  function chip(g, x, y, txt, col, h) { g.font = "700 " + Math.round(h * 0.66) + "px " + SANS; var w = g.measureText(txt).width + h * 0.6; g.fillStyle = col; roundRect(g, x, y - h / 2, w, h, h * 0.22); g.fill(); g.fillStyle = "#101418"; g.fillText(txt, x + h * 0.3, y + 1); return w; }
  // the timetable: the title across the top, then two columns of classes, each with its own head
  function drawSchedule(g, W, H) {
    var T2 = P2.timetable, M = 60;
    g.fillStyle = INK; g.font = "700 92px " + SANS; g.fillText(T2.term.title, M, 96);
    var tw = g.measureText(T2.term.title).width; g.fillStyle = DIM; g.font = "400 50px " + SANS; g.fillText(T2.term.dates + "  ·  " + T2.term.weeks + " weeks", M + tw + 44, 102);
    var lx = W - M - 760; lx += chip(g, lx, 98, "Room", AMB, 56) + 28; lx += chip(g, lx, 98, "Room + online", VIO, 56) + 34;
    g.fillStyle = RED; g.font = "700 44px " + SANS; g.fillText("Online", lx, 100);
    g.fillStyle = "#2a323b"; g.fillRect(M, 170, W - 2 * M, 3);
    var split = [["FunMath", "Basic and Calculus", "By invitation and Olympiad"], ["Contest", "Computer Science"]], CW = (W - 2 * M - 60) / 2;
    split.forEach(function (names, ci) { drawColumn(g, M + ci * (CW + 60), 196, CW, H - 196 - 30, T2, T2.groups.filter(function (gr) { return names.indexOf(gr.name) >= 0; })); });
  }
  function drawColumn(g, x0, y0, W, H, T2, groups) {
    var cols = [0, 424], cw = 240; for (var k = 0; k < 5; k++) cols.push(cols[1] + (k + 1) * cw); var hwX = cols[6];
    g.fillStyle = AMB; g.font = "700 30px " + SANS;
    ["CLASS"].concat(T2.days).forEach(function (t, i) { g.fillText(t, x0 + cols[i] + (i ? 6 : 0), y0 + 22); }); g.fillText("HOMEWORK", x0 + hwX + 6, y0 + 22);
    g.fillStyle = "#2a323b"; g.fillRect(x0, y0 + 48, W, 2);
    var nrow = 0; groups.forEach(function (gr) { nrow += 1; gr.classes.forEach(function (c) { nrow += c.rows.length; }); });
    var top = y0 + 60, rh = Math.min(76, (y0 + H - top) / nrow), y = top;
    groups.forEach(function (gr) {
      g.fillStyle = AMB; g.font = "700 32px " + SANS; g.fillText(gr.name.toUpperCase(), x0, y + rh * 0.56); y += rh;
      gr.classes.forEach(function (c) {
        g.fillStyle = "#1a2028"; g.fillRect(x0, y - 1, W, 2);
        c.rows.forEach(function (row, ri) {
          var cy = y + rh / 2;
          if (ri === 0) {
            g.fillStyle = INK; g.font = "600 34px " + SANS; fitText(g, c.name, x0, cy, 410);
            g.fillStyle = DIM; g.font = "400 26px " + SANS; fitText(g, c.hw.replace(" pm", "p").replace(" am", "a"), x0 + hwX + 6, cy, W - hwX - 6);
          }
          row.forEach(function (cell, di) {
            if (!cell) return; var cx = x0 + cols[di + 1] + 6, t = cell[0].replace(" pm", "p").replace(" am", "a"), r = cell[1];
            g.fillStyle = r === 0 ? RED : "#d5d9de"; g.font = "500 27px " + SANS; fitText(g, t, cx, cy, r === 0 ? 236 : 160);
            if (r !== 0) chip(g, cx + Math.min(160, g.measureText(t).width) + 10, cy, String(Math.abs(r)) + (r < 0 ? "+" : ""), r < 0 ? VIO : AMB, Math.min(40, rh - 10));
          });
          y += rh;
        });
      });
    });
  }
  // the contests: as the sheet, its nine columns, the team contests, the notes under it
  function drawContests(g, W, H) {
    var C2 = P2.contests, M = 50, Y = 0;
    g.textAlign = "center"; g.fillStyle = INK; g.font = "700 88px " + SANS; g.fillText(C2.title, W / 2, 78);
    g.font = "600 38px " + SANS; var vw = g.measureText(C2.venue).width + 60; g.fillStyle = "#4a4419"; g.fillRect(W / 2 - vw / 2, 132, vw, 54); g.fillStyle = "#ffe066"; g.fillText(C2.venue, W / 2, 160);
    g.textAlign = "right"; g.fillStyle = DIM; g.font = "400 28px " + SANS; g.fillText(C2.contact[0] + "   " + C2.contact[1], W - M, 50); g.fillStyle = BLUE; g.font = "600 32px " + SANS; g.fillText(C2.contact[2], W - M, 92);
    g.textAlign = "left";
    var cw = [1000, 470, 330, 640, 230, 260, 280, 260, 526], cx = [M]; cw.forEach(function (w, k) { cx.push(cx[k] + w); });
    function cell(k, y, lines, font, col, h) { g.font = font; g.fillStyle = col; g.textAlign = "center"; var lh = Math.min(42, (h - 14) / Math.max(1, lines.length)), y0 = y + h / 2 - (lines.length - 1) * lh / 2;
      lines.forEach(function (t, i) { fitText(g, t, cx[k] + cw[k] / 2, y0 + i * lh, cw[k] - 24); }); g.textAlign = "left"; }
    Y = 214; g.fillStyle = "#1c2a3c"; g.fillRect(M, Y, cx[9] - M, 74); g.fillStyle = "#4a4419"; g.fillRect(cx[6], Y, cw[6], 74);
    C2.columns.forEach(function (t, k) { cell(k, Y, [t], "700 32px " + SANS, k === 6 ? "#ffe066" : INK, 74); });
    Y += 74;
    var RH = 140;
    C2.contests.forEach(function (c, n) {
      if (n % 2 === 0) { g.fillStyle = "#211620"; g.fillRect(M, Y, cx[9] - M, RH); }
      g.fillStyle = "#2a323b"; g.fillRect(M, Y + RH - 2, cx[9] - M, 2);
      // the name: the body that sets it, the contest, a note, the day and time
      var lines = [[c.name, 44, "700 ", RED]]; if (c.note) lines.push([c.note, 32, "600 ", RED]); lines.push([c.when, 34, "600 ", BLUE]);
      var lh = c.note ? 40 : 48, ly0 = Y + RH / 2 - (lines.length - 1) * lh / 2, mid = cx[0] + cw[0] / 2;
      lines.forEach(function (L, li) {
        var ly = ly0 + li * lh, pre = li === 0 && c.org ? c.org + ": " : "", px = L[1], wp, wn;
        do { g.font = L[2] + px + "px " + SANS; wp = g.measureText(pre).width; wn = g.measureText(L[0]).width; px -= 1; } while (wp + wn > cw[0] - 30 && px > 16);
        var x = mid - (wp + wn) / 2; g.textAlign = "left";
        if (pre) { g.fillStyle = PINK; g.fillText(pre, x, ly); }
        g.fillStyle = L[3]; g.fillText(L[0], x + wp, ly);
      });
      cell(1, Y, c.info, "500 30px " + SANS, "#d5d9de", RH);
      cell(2, Y, c.grades, "600 34px " + SANS, INK, RH);
      cell(3, Y, c.level, "500 30px " + SANS, "#d5d9de", RH);
      cell(4, Y, [c.price[0]], "700 50px " + SANS, INK, RH); cell(5, Y, [c.price[1]], "700 50px " + SANS, INK, RH);
      cell(6, Y, [c.early], "700 38px " + SANS, RED, RH); cell(7, Y, [c.deadline], "700 38px " + SANS, c.deadline === "FULL" ? RED : INK, RH);
      cell(8, Y, C2.register, "500 30px " + SANS, "#d5d9de", RH);
      Y += RH;
    });
    var TH = 58;
    C2.teams.forEach(function (t) {
      g.fillStyle = "#2a1a2a"; g.fillRect(M, Y, cx[9] - M, TH); g.fillStyle = "#3a2a3a"; g.fillRect(M, Y + TH - 2, cx[9] - M, 2);
      cell(0, Y, [t.name], "700 38px " + SANS, MAG, TH); cell(1, Y, [t.when], "500 28px " + SANS, INK, TH); cell(2, Y, [t.grades], "500 28px " + SANS, INK, TH); cell(3, Y, [t.level], "500 28px " + SANS, INK, TH);
      cell(4, Y, [t.price], "600 30px " + SANS, INK, TH); [5, 6, 7].forEach(function (k) { cell(k, Y, ["N/A"], "500 28px " + SANS, DIM, TH); }); cell(8, Y, ["TTmath students only"], "600 28px " + SANS, INK, TH);
      Y += TH;
    });
    // the notes
    Y += 44; g.textAlign = "center"; g.font = "700 46px " + SANS; g.fillStyle = "#b48cff"; g.fillText(C2.notes_head, W / 2, Y); var hw = g.measureText(C2.notes_head).width; g.fillRect(W / 2 - hw / 2, Y + 28, hw, 3);
    Y += 64; var NC = { maroon: PINK, blue: BLUE, red: RED, ink: "#d5d9de" }, nh = Math.min(46, (H - 24 - Y) / C2.notes.length);
    C2.notes.forEach(function (n) { g.font = (n[1] === "red" ? "600 " : "400 ") + "31px " + SANS; g.fillStyle = NC[n[1]] || INK; fitText(g, n[0], W / 2, Y, W - 2 * M); Y += nh; });
    g.textAlign = "left";
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
  function fitText(g, t, x, y, w) { var f = g.font, px = parseFloat(f.match(/(\d+)px/)[1]); while (g.measureText(t).width > w && px > 12) { px -= 1; g.font = f.replace(/\d+px/, px + "px"); } g.fillText(t, x, y); g.font = f; }
  var BOARD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
  var BOARD_FS = "uniform sampler2D map; uniform float uExposure, uBright; varying vec2 vUv;\n" +
    "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * uBright + vec3(0.003); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
  // a screen: the canvas on a quad along a radius at angle a, from r0 to r1 (the viewer's left to right), y0 to y0 + h
  function screenQuad(cv, a, r0, r1, y0, h) {
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.minFilter = THREE.LinearMipmapLinearFilter;
    var pos = [], uvs = [];
    [[r0, y0, 0, 0], [r1, y0, 1, 0], [r1, y0 + h, 1, 1], [r0, y0 + h, 0, 1]].forEach(function (c) { var p = crsPt(c[0], a); pos.push(p.x, c[1], p.z); uvs.push(c[2], c[3]); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: 1.05 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS });
    var m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; scene.add(m); return m;
  }
  // the two screens on the Gate Hall's wall at 164 degrees, facing into the hall: the timetable on the left as you face
  // them, the contests on the right; a dark aluminium bezel round each, a soft light in front
  function timetableBoards(W) {
    var C = CRS, a = 164 * D2R + (C.wall / 2 + 0.07) / 55.8, y0 = C.yU + 1.0, h = 2.15, w = 4.3, spans = [[51.5, 51.5 + w], [56.1, 56.1 + w]];
    screenQuad(screenCanvas(drawSchedule), a, spans[0][0], spans[0][1], y0, h);
    screenQuad(screenCanvas(drawContests), a, spans[1][0], spans[1][1], y0, h);
    spans.forEach(function (sp) {
      var bz = new Builder(), Mb = crsFrame((sp[0] + sp[1]) / 2, 164 * D2R + C.wall / 2 / 55.8, y0 + h / 2);
      bz.box(0.0, -h / 2 - 0.06, -w / 2 - 0.06, 0.06, h / 2 + 0.06, w / 2 + 0.06, MT.ANOD); bz.tag(0, 3, null); W.add(bz, Mb);
      var lp = crsPt((sp[0] + sp[1]) / 2, 164 * D2R + 1.2 / 55.8); wLight(lp.x, y0 + h / 2, lp.z, [0.75, 0.82, 1.0], 0.9, 6);
    });
    crsObst(51.2, 60.7, 164 * D2R, 164 * D2R + 0.6 / 55.8, "upper");
  }

  // ---- the door plates: the room's number big, its name under it, printed in the atlas (plateUV) ----
  var PLATE_ROOMS = null;
  function plateRooms() { if (!PLATE_ROOMS) PLATE_ROOMS = P2.ring.rooms.filter(function (r) { return r.no; }); return PLATE_ROOMS; }
  // 46 slots of 192 x 48 px: beside the old gateway's name (2 rows), in the wing signs' corner (10 rows), along the bottom strip
  function plateSlot(i) {
    if (i < 16) return [i % 8 * 192, 792 + Math.floor(i / 8) * 48];
    if (i < 36) { var k = i - 16; return [1536 + k % 2 * 192, Math.floor(k / 2) * 48]; }
    return [(i - 36) * 192, 1984];
  }
  function plateUV(i) { var s = plateSlot(i); return [s[0] / ATL_N, 1 - (s[1] + 48) / ATL_N, (s[0] + 192) / ATL_N, 1 - s[1] / ATL_N]; }
  function drawPlates(g) {
    plateRooms().forEach(function (rm, i) {
      var s = plateSlot(i), x = s[0], y = s[1];
      g.fillStyle = "#1d2125"; g.fillRect(x, y, 192, 48); g.fillStyle = "#2a2f35"; g.fillRect(x + 2, y + 2, 188, 44); g.fillStyle = "#e8b04a"; g.fillRect(x + 2, y + 2, 6, 44);
      g.fillStyle = "#ffffff"; g.font = "700 30px " + SANS; g.textBaseline = "middle"; g.fillText(String(rm.no), x + 14, y + 25);
      g.fillStyle = "#c9ced4"; g.font = "500 15px " + SANS; var nm = (rm.short && rm.name.length > 16 ? rm.short : rm.name.split(":")[0]); fitText(g, nm, x + 76, y + 25, 108);
    });
  }
  // a plate beside each door of every numbered room, on the corridor's side, at eye height
  function doorPlates(W) {
    var C = CRS;
    plateRooms().forEach(function (rm, i) {
      var uv = plateUV(i), mid = (rm.a[0] + rm.a[1]) / 2 * D2R;
      rmFloors(rm).forEach(function (fl) {
        var y = fl === "upper" ? C.yU : C.yL;
        (rm.doors || []).forEach(function (d) {
          var pa = d + (d < mid ? 1 : -1) * 0.86 / C.rc, rp = CRS_GLAZED[rm.kind] ? C.rc - 0.012 : C.rc - C.wall / 2 - 0.012;
          wpic(W, crsFrame(rp, pa, y + 1.5), [0, 0, 0], "x", [0, -1], 0.42, 0.105, uv, MT.ATLAS, [0, 0]);
        });
      });
    });
  }

  // ---- the rooms' directory: the Ring as a map, every room at its place with its number (upstairs on the outer band,
  // downstairs on the inner), the halls, "You are here"; beside it every room by number. The Gate Hall's on its own
  // texture; the hall's screen (scrLobby in the atlas) gets the same map, smaller ----
  var DIR_COL = { "class": "#e8b04a", seminar: "#6fa3e0", study: "#6fa3e0", library: "#6fa3e0", reading: "#6fa3e0", lab: "#4fb3a9", physics: "#4fb3a9",
                  maker: "#4fb3a9", astro: "#4fb3a9", compete: "#7cc36a", games: "#7cc36a", lounge: "#7cc36a", dining: "#d9825b", cafe: "#d9825b",
                  kitchen: "#d9825b", assembly: "#a98be6", art: "#a98be6", music: "#a98be6" };
  function dirCol(rm) { return DIR_COL[rm.kind] || "#7f8b97"; }
  function dirName(rm) { return rm.name.split(":")[0]; }
  // the map: centre (cx, cy), the outer band (upstairs) from R2 in to R1, the inner (downstairs) from R1 - gap in to R0;
  // a = 180 (the Gate Hall) at the bottom, numbers rising to the right as you stand there facing the dome
  function drawRingMap(g, cx, cy, R0, R1, R2, here, small) {
    function th(d) { return (d - 90) * Math.PI / 180; }
    function band(d0, d1, ri, ro) { g.beginPath(); g.arc(cx, cy, ro, th(d0), th(d1)); g.arc(cx, cy, ri, th(d1), th(d0), true); g.closePath(); }
    function pt(d, r) { return [cx + r * Math.sin(d * Math.PI / 180), cy - r * Math.cos(d * Math.PI / 180)]; }
    var gap = small ? 4 : 8, Rm = R1 - gap, rings = { upper: [R1, R2], lower: [R0, Rm] };
    // the palace and the garden ring
    g.fillStyle = "#1b2a1f"; g.beginPath(); g.arc(cx, cy, R0 - gap, 0, 7); g.fill();
    g.fillStyle = "#2b2f36"; g.strokeStyle = "#8f98a3"; g.lineWidth = small ? 1.5 : 3; g.beginPath(); g.arc(cx, cy, (R0 - gap) * 0.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "#d5d9de"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "600 " + (small ? 13 : 30) + "px " + SANS; g.fillText("Math Palace", cx, cy - (small ? 7 : 16));
    g.fillStyle = "#9aa3ad"; g.font = "400 " + (small ? 10 : 22) + "px " + SANS; g.fillText("garden ring", cx, cy + (small ? 9 : 22));
    // the corridors: a thin band inside each floor's rooms
    P2.ring.rooms.forEach(function (rm) {
      if (rm.band) return;
      rmFloors(rm).forEach(function (fl) {
        var rr = rings[fl], full = isHall(rm) || isBay(rm);
        band(rm.a[0] + 0.25, rm.a[1] - 0.25, rr[0], rr[1]);
        g.fillStyle = full ? "#3a4048" : dirCol(rm); g.globalAlpha = full ? 1 : 0.9; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = "#0b0e12"; g.lineWidth = small ? 1 : 2; g.stroke();
        var mid = (rm.a[0] + rm.a[1]) / 2, p = pt(mid, (rr[0] + rr[1]) / 2), len = (rm.a[1] - rm.a[0]) * Math.PI / 180 * (rr[0] + rr[1]) / 2;
        var t = rm.no ? String(rm.no) : (rm.code === "T06-27" ? "Gate Hall" : rm.code === "T06-01" ? "Hall" : ""), fs = Math.min(small ? 12 : 30, len / (t.length * 0.62 + 0.4), (rr[1] - rr[0]) * 0.62);
        if (t && fs >= (small ? 6 : 11)) { g.fillStyle = full ? "#eef0f2" : "#101418"; g.font = "700 " + Math.round(fs) + "px " + SANS; g.fillText(t, p[0], p[1] + 1); }
      });
    });
    // you are here
    var hp = pt(here, (R1 + R2) / 2 + (small ? 0 : 0)), rr2 = small ? 6 : 14;
    g.fillStyle = "#ff5b47"; g.strokeStyle = "#ffffff"; g.lineWidth = small ? 2 : 4; g.beginPath(); g.arc(hp[0], hp[1], rr2, 0, 7); g.fill(); g.stroke();
    var lp = pt(here, R2 + (small ? 16 : 40)); g.fillStyle = "#ff7f6e"; g.font = "700 " + (small ? 12 : 28) + "px " + SANS; g.fillText("You are here", lp[0], lp[1]);
    g.textAlign = "left";
  }
  function drawDirectory(g, x0, y0, W, H, here) {
    var bg = g.createLinearGradient(0, y0, 0, y0 + H); bg.addColorStop(0, "#0d1116"); bg.addColorStop(1, "#080a0d"); g.fillStyle = bg; g.fillRect(x0, y0, W, H);
    var M = 46; g.textBaseline = "middle"; g.textAlign = "left";
    g.fillStyle = "#eef0f2"; g.font = "700 52px " + SANS; g.fillText("The Ring", x0 + M, y0 + 66);
    g.fillStyle = "#9aa3ad"; g.font = "400 28px " + SANS; g.fillText("2xx upstairs  ·  1xx downstairs", x0 + M + 250, y0 + 70);
    drawRingMap(g, x0 + 520, y0 + 535, 228, 316, 398, here, false);
    // every room by number, upstairs and downstairs
    var rooms = P2.ring.rooms.filter(function (rm) { return rm.no; }).slice().sort(function (p, q) { return p.no - q.no; });
    [["UPSTAIRS", rooms.filter(function (rm) { return rm.no >= 200; }), x0 + 1060], ["DOWNSTAIRS", rooms.filter(function (rm) { return rm.no < 200; }), x0 + 1560]].forEach(function (c) {
      g.fillStyle = "#e8b04a"; g.font = "700 24px " + SANS; g.fillText(c[0], c[2], y0 + 140); g.fillStyle = "#2a323b"; g.fillRect(c[2], y0 + 160, 440, 2);
      var rh = Math.min(46, (H - 230) / Math.max(1, c[1].length));
      c[1].forEach(function (rm, i) {
        var y = y0 + 190 + i * rh + rh / 2;
        g.fillStyle = dirCol(rm); g.fillRect(c[2], y - 9, 18, 18);
        g.fillStyle = "#ffffff"; g.font = "700 28px " + SANS; g.fillText(String(rm.no), c[2] + 32, y + 1);
        g.fillStyle = "#c9ced4"; g.font = "400 24px " + SANS; fitText(g, dirName(rm), c[2] + 108, y + 1, 330);
      });
    });
  }
  // the Gate Hall's directory: on the wall at 191 degrees over the stair, facing the hall
  function directoryScreen(W) {
    var C = CRS, s = MOBILE ? 0.5 : 1, cv = mkCanvas(2048 * s, 1024 * s), g = cv.getContext("2d"); g.scale(s, s); drawDirectory(g, 0, 0, 2048, 1024, 180);
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.minFilter = THREE.LinearMipmapLinearFilter;
    var w = 5.0, h = 2.5, rcn = 55.8, y0 = C.yU + 1.6, a = 191 * D2R - (C.wall / 2 + 0.07) / rcn, pos = [], uvs = [];
    // facing -a (into the hall): the viewer's left is the outer side, so u runs from r high to r low
    [[rcn + w / 2, y0, 0, 0], [rcn - w / 2, y0, 1, 0], [rcn - w / 2, y0 + h, 1, 1], [rcn + w / 2, y0 + h, 0, 1]].forEach(function (c) { var p = crsPt(c[0], a); pos.push(p.x, c[1], p.z); uvs.push(c[2], c[3]); });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: 1.05 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS });
    var m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; scene.add(m);
    var bz = new Builder(), Mb = crsFrame(rcn, 191 * D2R - C.wall / 2 / rcn, y0 + h / 2); bz.box(-0.06, -h / 2 - 0.06, -w / 2 - 0.06, 0.0, h / 2 + 0.06, w / 2 + 0.06, MT.ANOD); bz.tag(0, 3, null); W.add(bz, Mb);
    var lp = crsPt(rcn, 191 * D2R - 1.2 / rcn); wLight(lp.x, y0 + h / 2, lp.z, [0.75, 0.82, 1.0], 0.9, 6);
  }
  // the hall's screen (scrLobby in the atlas): the map, small, with you at the hall, and Saturday's classes from the timetable
  function drawLobbyDirectory(g, x0, y0, W, H) {
    g.save(); g.translate(x0, y0);
    g.fillStyle = "#0e1622"; g.fillRect(0, 0, W, H);
    g.textBaseline = "middle"; g.textAlign = "left";
    drawRingMap(g, 205, 236, 112, 150, 186, 0, true);
    var T2 = P2.timetable, di = T2.days.indexOf("SAT"), rows = [];
    T2.groups.forEach(function (gr) { gr.classes.forEach(function (c) { c.rows.forEach(function (row) { var cell = row[di]; if (cell) rows.push([cell[0], c.name, cell[1]]); }); }); });
    function mins(t) {                                                   // the start in minutes: the end carries am or pm, the start is the later reading before it
      var m = t.match(/(\d+):(\d+)\D+(\d+):(\d+)\s*(am|pm)/); if (!m) return 0;
      var e = (+m[3] % 12) * 60 + +m[4] + (m[5] === "pm" ? 720 : 0), s = (+m[1] % 12) * 60 + +m[2]; return s + 720 < e ? s + 720 : s;
    }
    function hm(v) { var h = Math.floor(v / 60) % 12 || 12, mm = v % 60; return h + ":" + (mm < 10 ? "0" : "") + mm + (v >= 720 ? " pm" : " am"); }
    rows.sort(function (p, q) { return mins(p[0]) - mins(q[0]); });
    g.fillStyle = "#ffffff"; g.font = "600 24px " + SANS; g.fillText("Saturday's classes", 420, 34);
    g.fillStyle = "#1c2a3d"; g.fillRect(420, 54, W - 440, 2);
    var n = Math.min(rows.length, 11), rh = (H - 76) / n;
    rows.slice(0, n).forEach(function (r, i) {
      var y = 76 + i * rh + rh / 2;
      g.fillStyle = "#e8b04a"; g.font = "600 15px " + SANS; g.fillText(hm(mins(r[0])), 420, y);
      g.fillStyle = "#dfe6ef"; g.font = "15px " + SANS; fitText(g, r[1], 500, y, 182);
      g.fillStyle = r[2] === 0 ? "#ff7f6e" : "#9fb0c6"; g.textAlign = "right"; g.fillText(r[2] === 0 ? "online" : String(Math.abs(r[2])), W - 20, y); g.textAlign = "left";
    });
    g.restore();
  }
