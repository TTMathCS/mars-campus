  /* ===================== The Gate Hall's two big screens: the Fall timetable and the contests; the door plates ===================== */
  // Jim, 5 Oct 2026: "the schedule should be somewhere in the entrance so students know where they are going to"; "each
  // area esp classroom should have room number"; 6 Oct 2026: "2 big screens, one is for schedule, one is for below
  // contest", "compress all schedule within one screen, leaving second screen as contest above"; 7 Oct 2026: "the schedule
  // and contest on the big screen need a better way to display well. now it is bit messy and fonts small". On the Gate
  // Hall's wall, side by side: the 2026 Fall Schedule (P2.timetable, campus_timetable.py: every class, its days and times,
  // and the room it meets in, online, or both) and TTMath's Sept-Dec contests (P2.contests, campus_contests.py), each
  // screen turning its pages (below). Each on its own texture, 4096 x 2048 units (3072 px, 1536 on a phone), redrawn when
  // its page turns; a plain emissive material that takes the exposure like the screens in the campus material.
  var SCR = { W: 4096, H: 2048 };
  var AMB = "#e8b04a", RED = "#ff7f6e", INK = "#eef0f2", DIM = "#9aa3ad", BLUE = "#86b6ff";
  function screenCanvas(draw) {
    var s = MOBILE ? 0.375 : 0.75, cv = mkCanvas(Math.round(SCR.W * s), Math.round(SCR.H * s)), g = cv.getContext("2d");
    g.scale(s, s); var bg = g.createLinearGradient(0, 0, 0, SCR.H); bg.addColorStop(0, "#0d1116"); bg.addColorStop(1, "#080a0d"); g.fillStyle = bg; g.fillRect(0, 0, SCR.W, SCR.H);
    g.textBaseline = "middle"; draw(g, SCR.W, SCR.H); return cv;
  }
  // ---- the screens turn their pages (v0.21). Jim, 7 Oct 2026: "the schedule and contest on the big screen need a
  // better way to display well. now it is bit messy and fonts small". Eighty-seven classes a week cannot be read from
  // the hall on one page, so each screen turns its pages as a lobby's screens do, in type that reads across the hall
  // (names about 6 cm tall): the timetable a page for Wednesday to Friday, Saturday, Sunday and Monday's homework
  // classes, opening on today's; the contests a card each in date order, then what to read before paying.
  var SCH_PAGES = [{ tab: "WED – FRI", days: [0, 1, 2] }, { tab: "SATURDAY", days: [3] }, { tab: "SUNDAY", days: [4] }, { tab: "MONDAY", hw: true }];
  var DAY_NAME = { WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
  var GROUP_COL = { "FunMath": "#3fb5a5", "Basic and Calculus": "#5b9cf0", "Contest": "#ef8a5b", "By invitation and Olympiad": "#b28ae8", "Computer Science": "#7cc36e" };
  var GROUP_NAME = { "FunMath": "FunMath", "Basic and Calculus": "Basic and Calculus", "Contest": "Contest", "By invitation and Olympiad": "By invitation and Olympiad", "Computer Science": "Computer Science" };
  // "6:45–8:45 pm" or "11:30–1:30 pm": [start, end] in minutes; the am or pm printed is the end's
  function schSpan(t) {
    var m = String(t).match(/(\d+):(\d+)\D+(\d+):(\d+)\s*(am|pm)/); if (!m) return [0, 0];
    var h1 = +m[1], m1 = +m[2], h2 = +m[3], m2 = +m[4], pm = m[5] === "pm"; if (pm && h2 < 12) h2 += 12;
    var e = h2 * 60 + m2, st = h1 * 60 + m1; if (pm && h1 < 12 && (h1 + 12) * 60 + m1 <= e) st += 720; return [st, e];
  }
  function schHM(v, ap) { var h = Math.floor(v / 60) % 12 || 12, mm = v % 60; return h + ":" + (mm < 10 ? "0" : "") + mm + (ap ? (v >= 720 ? " pm" : " am") : ""); }
  // the classes of a day (index into the days), in the order they start: start, end, name, room (0 online, -n both), group
  function schDay(di) {
    var out = [];
    P2.timetable.groups.forEach(function (gr, gi) { gr.classes.forEach(function (c, ci) { c.rows.forEach(function (row) { var cell = row[di]; if (!cell) return; var sp = schSpan(cell[0]); out.push({ s: sp[0], e: sp[1], name: c.name, room: cell[1], group: gr.name, o: gi * 100 + ci }); }); }); });
    return out.sort(function (p, q) { return p.s - q.s || p.o - q.o; });
  }
  // Monday's homework classes, online
  function schHomework() {
    var out = [];
    P2.timetable.groups.forEach(function (gr, gi) { gr.classes.forEach(function (c, ci) { if (!/^Mon /.test(c.hw)) return; var sp = schSpan(c.hw); out.push({ s: sp[0], e: sp[1], name: c.name, room: 0, group: gr.name, o: gi * 100 + ci }); }); });
    return out.sort(function (p, q) { return p.s - q.s || p.o - q.o; });
  }
  // a day's classes in k columns, never splitting a start time, the longest column as short as can be
  function schSplit(rows, k) {
    var groups = []; rows.forEach(function (r) { var g = groups[groups.length - 1]; if (g && g[0].s === r.s) g.push(r); else groups.push([r]); });
    if (groups.length <= k) return groups;
    var best = null, n = groups.length;
    (function rec(start, left, acc) {
      if (left === 1) { var cols = acc.concat([groups.slice(start)]); var mx = Math.max.apply(null, cols.map(function (c) { return c.reduce(function (t, g) { return t + g.length; }, 0); })); if (!best || mx < best.mx) best = { mx: mx, cols: cols }; return; }
      for (var e = start + 1; e <= n - left + 1; e++) rec(e, left - 1, acc.concat([groups.slice(start, e)]));
    })(0, k, []);
    return best.cols.map(function (c) { return [].concat.apply([], c); });
  }
  // the room at the right of a row: its number on an amber plate; "Online"; or the plate and "+ online"
  function schRoom(g, xr, cy, room, rh) {
    var h = Math.round(rh * 0.66), f = Math.round(h * 0.68);
    g.textAlign = "right";
    if (room === 0) { g.fillStyle = RED; g.font = "600 " + Math.round(rh * 0.42) + "px " + SANS; g.fillText("Online", xr, cy); g.textAlign = "left"; return; }
    var x = xr;
    if (room < 0) { g.fillStyle = RED; g.font = "600 " + Math.round(rh * 0.32) + "px " + SANS; g.fillText("+ online", x, cy); x -= g.measureText("+ online").width + 16; }
    g.font = "700 " + f + "px " + SANS; var txt = String(Math.abs(room)), w = g.measureText(txt).width + h * 0.62;
    g.fillStyle = AMB; roundRect(g, x - w, cy - h / 2, w, h, h * 0.18); g.fill(); g.fillStyle = "#14181d"; g.textAlign = "center"; g.fillText(txt, x - w / 2, cy + h * 0.04);
    g.textAlign = "left";
  }
  // a class's name in one size on every row: the class ("L2 Basic") large, what it is ("Gr 9–10 Algebra") smaller after it
  function schName(g, nm, x, cy, avail, F) {
    var i = nm.indexOf(" · "), main = i < 0 ? nm : nm.slice(0, i), sub = i < 0 ? "" : nm.slice(i + 3);
    g.fillStyle = INK; g.font = "600 " + F + "px " + SANS; var mw = g.measureText(main).width;
    if (mw > avail || !sub) { fitText(g, main, x, cy, avail); return; }
    g.fillText(main, x, cy); var left = avail - mw - F * 0.36, f2 = Math.round(F * 0.74);
    g.font = "400 " + f2 + "px " + SANS; while (g.measureText(sub).width > left && f2 > F * 0.6) { f2--; g.font = "400 " + f2 + "px " + SANS; }
    if (g.measureText(sub).width <= left) { g.fillStyle = "#aab2bb"; g.fillText(sub, x + mw + F * 0.36, cy + F * 0.04); }   // what does not fit is left out, never shrunk to a speck
  }
  // a column of classes: the start time big at the left of the first class to start then, its end under it; a thin bar
  // in the class's group colour, its name, its room at the right
  function schColumn(g, x0, y0, CW, rows, rh) {
    var gut = Math.min(330, CW * 0.25), roomW = Math.min(360, CW * 0.27), y = y0, lastS = -1, lastE = -1;
    rows.forEach(function (r) {
      var cy = y + rh / 2, first = r.s !== lastS;
      if (first && lastS >= 0) { g.fillStyle = "#28313b"; g.fillRect(x0, y - 1, CW, 3); }
      if (first || r.e !== lastE) {
        if (first) { g.fillStyle = INK; g.font = "700 " + Math.round(rh * 0.44) + "px " + SANS; g.fillText(schHM(r.s, true), x0, cy - rh * 0.13); }
        g.fillStyle = DIM; g.font = "400 " + Math.round(rh * 0.27) + "px " + SANS; g.fillText("to " + schHM(r.e, false), x0, first ? cy + rh * 0.27 : cy);
      }
      g.fillStyle = GROUP_COL[r.group] || DIM; g.fillRect(x0 + gut, y + rh * 0.2, 9, rh * 0.6);
      schName(g, r.name, x0 + gut + 30, cy, CW - gut - roomW - 30, Math.round(rh * 0.46));
      schRoom(g, x0 + CW, cy, r.room, rh);
      lastS = r.s; lastE = r.e; y += rh;
    });
  }
  // the head: the term, and the pages as tabs with this one lit
  function screenHead(g, W, title, sub, tabs, page) {
    var M = 72; g.fillStyle = "#121a23"; g.fillRect(0, 0, W, 214); g.fillStyle = AMB; g.fillRect(0, 210, W, 6);
    g.textAlign = "left"; g.fillStyle = INK; g.font = "700 104px " + SANS; g.fillText(title, M, 88);
    g.fillStyle = DIM; g.font = "400 52px " + SANS; fitText(g, sub, M, 166, W * 0.5);
    var x = W - M; g.font = "700 52px " + SANS;
    for (var i = tabs.length - 1; i >= 0; i--) {
      var tw = g.measureText(tabs[i]).width + 70; x -= tw;
      if (i === page) { g.fillStyle = AMB; roundRect(g, x, 66, tw, 92, 16); g.fill(); g.fillStyle = "#14181d"; }
      else { g.strokeStyle = "#3b4652"; g.lineWidth = 4; roundRect(g, x, 66, tw, 92, 16); g.stroke(); g.fillStyle = DIM; }
      g.textAlign = "center"; g.fillText(tabs[i], x + tw / 2, 113); g.textAlign = "left"; x -= 26;
    }
  }
  function drawSchedulePage(g, W, H, page) {
    var T2 = P2.timetable, P = SCH_PAGES[page], M = 72, gap = 80, foot = H - 104;
    screenHead(g, W, T2.term.title, T2.term.dates + "  ·  " + T2.term.weeks + " weeks", SCH_PAGES.map(function (q) { return q.tab; }), page);
    var cols = [], top = 262;
    if (P.days && P.days.length > 1) P.days.forEach(function (di) { cols.push({ head: DAY_NAME[T2.days[di]], rows: schDay(di) }); });
    else {
      var rows = P.hw ? schHomework() : schDay(P.days[0]);
      g.fillStyle = AMB; g.font = "700 76px " + SANS; g.fillText(P.hw ? "Monday" : DAY_NAME[T2.days[P.days[0]]], M, top + 44);
      var hw = g.measureText(P.hw ? "Monday" : DAY_NAME[T2.days[P.days[0]]]).width; g.fillStyle = DIM; g.font = "400 50px " + SANS;
      g.fillText(P.hw ? "homework classes, all online" : rows.length + " classes", M + hw + 36, top + 48); top += 118;
      schSplit(rows, 3).forEach(function (r) { cols.push({ rows: r }); });
    }
    var CW = (W - 2 * M - gap * (cols.length - 1)) / cols.length, nmax = 0;
    cols.forEach(function (c) { nmax = Math.max(nmax, c.rows.length + (c.head ? 1.25 : 0)); });
    var rh = Math.min(168, (foot - 24 - top) / nmax);
    cols.forEach(function (c, ci) {
      var x0 = M + ci * (CW + gap), y = top;
      if (c.head) { g.fillStyle = AMB; g.font = "700 " + Math.round(rh * 0.56) + "px " + SANS; g.fillText(c.head, x0, y + rh * 0.42); g.fillStyle = "#3b4652"; g.fillRect(x0, y + rh * 0.92, CW, 4); y += rh * 1.25; }
      schColumn(g, x0, y, CW, c.rows, rh);
    });
    // the foot: the groups' colours; where the rooms are
    g.fillStyle = "#121a23"; g.fillRect(0, foot, W, H - foot); var x = M, fy = foot + (H - foot) / 2; g.font = "500 42px " + SANS;
    T2.groups.forEach(function (gr) { g.fillStyle = GROUP_COL[gr.name] || DIM; g.fillRect(x, fy - 22, 10, 44); g.fillStyle = "#c9ced4"; g.fillText(GROUP_NAME[gr.name] || gr.name, x + 26, fy + 2); x += g.measureText(GROUP_NAME[gr.name] || gr.name).width + 80; });
    g.textAlign = "right"; g.fillStyle = "#c9ced4"; g.fillText("Rooms 1xx downstairs, 2xx upstairs", W - M, fy + 2); g.textAlign = "left";
  }
  // ---- the contests: a card each in date order; then what to read before paying ----
  var CON_TABS = ["CONTESTS", "BEFORE YOU PAY"], MON3 = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], WD3 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var ORG_COL = { CMS: "#ff8a7a", MAA: "#86b6ff", Waterloo: "#5fd0c0", "": "#5fd0c0" };
  function conItems() {
    var C2 = P2.contests, out = [];
    C2.contests.forEach(function (c) { out.push({ c: c, sc: c.screen, team: false }); });
    C2.teams.forEach(function (t) { out.push({ c: t, sc: t.screen, team: true }); });
    return out.sort(function (p, q) { return p.sc.iso < q.sc.iso ? -1 : 1; });
  }
  function conCard(g, x, y, w, h, it) {
    var c = it.c, sc = it.sc, d = sc.iso.split("-").map(Number), wd = new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay(), full = c.deadline === "FULL", bw = 220;
    g.fillStyle = it.team ? "#1d1a26" : "#151c25"; roundRect(g, x, y, w, h, 22); g.fill();
    g.fillStyle = it.team ? "#2a2238" : "#1d2733"; roundRect(g, x, y, bw, h, 22); g.fill(); g.fillRect(x + bw - 30, y, 30, h);
    // the date, and the last day to register under it
    var bx = x + bw / 2; g.textAlign = "center"; g.fillStyle = AMB; g.font = "700 48px " + SANS; g.fillText(MON3[d[1] - 1] + (d[0] > 2026 ? " " + d[0] : ""), bx, y + 64);
    g.fillStyle = INK; g.font = "700 " + (sc.until ? 100 : 124) + "px " + SANS; g.fillText(String(d[2]), bx, y + 168);
    g.fillStyle = DIM; g.font = "500 42px " + SANS; g.fillText(sc.until ? "to " + sc.until : WD3[wd], bx, y + 252);
    if (!it.team) {
      g.fillStyle = "#2c3846"; g.fillRect(x + 24, y + h - 150, bw - 48, 3);
      if (full) { g.fillStyle = RED; g.font = "800 50px " + SANS; g.fillText("FULL", bx, y + h - 82); }
      else { g.fillStyle = DIM; g.font = "600 30px " + SANS; g.fillText("REGISTER BY", bx, y + h - 106); g.fillStyle = AMB; g.font = "700 46px " + SANS; fitText(g, c.deadline.replace(/\.$/, "").replace(".", ""), bx, y + h - 56, bw - 30); }
    }
    // the contest
    var tx = x + bw + 36, tw = w - bw - 60, ty = y + 58; g.textAlign = "left";
    g.fillStyle = it.team ? "#c3a3f0" : (ORG_COL[c.org] || "#7cc36e"); g.font = "700 38px " + SANS; g.fillText(it.team ? "TEAM · TTMATH STUDENTS ONLY" : (c.org === "Waterloo" ? "CEMC · WATERLOO" : (c.org || "CEMC · WATERLOO")).toUpperCase(), tx, ty);
    g.fillStyle = INK; g.font = "700 64px " + SANS; fitText(g, sc.short, tx, ty + 76, tw); ty += 76;
    if (sc.at) { g.fillStyle = BLUE; g.font = "600 46px " + SANS; g.fillText(sc.at, tx, ty + 66); var aw = g.measureText(sc.at).width;
      if (c.note) { g.fillStyle = RED; g.font = "600 38px " + SANS; fitText(g, "·  " + c.note.toLowerCase(), tx + aw + 20, ty + 68, tw - aw - 20); } ty += 66; }
    g.fillStyle = "#aab2bb"; g.font = "400 38px " + SANS; fitText(g, sc.form, tx, ty + 58, tw); ty += 58;
    g.fillStyle = "#d5d9de"; g.font = "500 40px " + SANS; fitText(g, it.team ? c.grades : "Grades " + c.grades.map(function (q) { return q.replace(/^Gr(ade)?\s?/, ""); }).join(" · "), tx, ty + 60, tw); ty += 60;
    g.fillStyle = "#aab2bb"; g.font = "400 36px " + SANS; fitText(g, it.team ? c.level : "Best after " + c.level.map(function (q) { return q.replace(" completed", ""); }).join(", "), tx, ty + 54, tw); ty += 54;
    if (it.team) { g.fillStyle = INK; g.font = "700 50px " + SANS; g.fillText(c.price === "N/A" ? "Free" : "Price " + c.price, tx, ty + 72); }
    else { g.fillStyle = INK; g.font = "700 50px " + SANS; g.fillText(c.price[0] + " TTmath", tx, ty + 72); var pw = g.measureText(c.price[0] + " TTmath").width; g.fillStyle = DIM; g.font = "500 42px " + SANS; g.fillText("·  " + c.price[1] + " others", tx + pw + 20, ty + 74); }
  }
  // the last card: where the contests are written
  function conWhere(g, x, y, w, h) {
    g.fillStyle = "#151c25"; roundRect(g, x, y, w, h, 22); g.fill(); g.strokeStyle = AMB; g.lineWidth = 4; roundRect(g, x + 2, y + 2, w - 4, h - 4, 20); g.stroke();
    g.textAlign = "left"; g.fillStyle = AMB; g.font = "700 38px " + SANS; g.fillText("WHERE YOU WRITE", x + 44, y + 64);
    g.font = "700 150px " + SANS; var nw = g.measureText("139").width + 70; g.fillStyle = AMB; roundRect(g, x + 44, y + 110, nw, 170, 22); g.fill(); g.fillStyle = "#14181d"; g.fillText("139", x + 79, y + 198);
    g.fillStyle = INK; g.font = "700 58px " + SANS; g.fillText("Ramanujan", x + 44 + nw + 36, y + 160); g.fillStyle = "#aab2bb"; g.font = "400 40px " + SANS; g.fillText("the competition room", x + 44 + nw + 36, y + 222);
    g.fillStyle = "#d5d9de"; g.font = "500 40px " + SANS; fitText(g, "Downstairs, on the lower corridor: follow the signs", x + 44, y + h - 120, w - 88);
    g.fillStyle = "#aab2bb"; g.font = "400 38px " + SANS; fitText(g, "The team contests meet with their clubs", x + 44, y + h - 60, w - 88);
  }
  function drawContestPage(g, W, H, page) {
    var C2 = P2.contests, M = 72;
    screenHead(g, W, "Math Contests", "Sept – Dec 2026  ·  written here, in Ramanujan, room 139", CON_TABS, page);
    var foot = H - 104;
    if (page === 0) {
      var items = conItems(), cols = 4, rows = Math.ceil(items.length / cols), gx = 36, gy = 34, top = 252;
      var cw = (W - 2 * M - gx * (cols - 1)) / cols, ch = (foot - 30 - top - gy * (rows - 1)) / rows;
      items.forEach(function (it, k) { conCard(g, M + (k % cols) * (cw + gx), top + Math.floor(k / cols) * (ch + gy), cw, ch, it); });
      if (items.length < cols * rows) { var kk = items.length; conWhere(g, M + (kk % cols) * (cw + gx), top + Math.floor(kk / cols) * (ch + gy), cw, ch); }
    } else {
      var y = 316; g.fillStyle = AMB; g.font = "700 80px " + SANS; g.fillText("Please read before you pay", M, y); y += 86;
      var NC = { maroon: "#f0a0b8", blue: BLUE, red: RED, ink: "#d5d9de" };
      C2.notes.forEach(function (n) {
        g.font = "500 64px " + SANS; var lines = wrapText(g, n[0], W - 2 * M - 80);
        g.fillStyle = NC[n[1]] || INK; g.beginPath(); g.arc(M + 18, y + 70, 13, 0, 2 * Math.PI); g.fill();
        lines.forEach(function (t, li) { g.fillText(t, M + 70, y + 70 + li * 80); });
        y += 70 + lines.length * 80 + 18;
      });
    }
    g.fillStyle = "#121a23"; g.fillRect(0, foot, W, H - foot); var fy = foot + (H - foot) / 2;
    g.fillStyle = "#c9ced4"; g.font = "500 42px " + SANS; g.fillText("Register at your day school or at TTmath  ·  e-transfer to payment@ttmath.ca", M, fy + 2);
    g.textAlign = "right"; g.fillStyle = BLUE; g.fillText(C2.contact[2] + "   " + C2.contact[0].replace("Tel ", "") + "   " + C2.contact[1].replace("Tel ", ""), W - M, fy + 2); g.textAlign = "left";
  }
  // a screen that turns its pages: its canvas, its texture, how long each page stays
  var SCREENS = [], SCR_FORCE = null;
  function pagedScreen(draw, n, secs, first) {
    var cv = screenCanvas(function (g, W, H) { draw(g, W, H, first); }), S = { cv: cv, draw: draw, n: n, secs: secs, page: first, t0: -1, tex: null };
    SCREENS.push(S); return S;
  }
  function screenRedraw(S) {
    var s = MOBILE ? 0.375 : 0.75, g = S.cv.getContext("2d");
    g.setTransform(s, 0, 0, s, 0, 0); var bg = g.createLinearGradient(0, 0, 0, SCR.H); bg.addColorStop(0, "#0d1116"); bg.addColorStop(1, "#080a0d"); g.fillStyle = bg; g.fillRect(0, 0, SCR.W, SCR.H);
    g.textBaseline = "middle"; g.textAlign = "left"; S.draw(g, SCR.W, SCR.H, S.page); if (S.tex) S.tex.needsUpdate = true;
  }
  // each frame: turn a screen's page when its time is up (or as SCR_FORCE says)
  function screensUpdate(time) {
    SCREENS.forEach(function (S, i) {
      if (S.t0 < 0) S.t0 = time;
      var want = SCR_FORCE ? SCR_FORCE[i] : S.page;
      if (!SCR_FORCE && time - S.t0 > S.secs[S.page]) { want = (S.page + 1) % S.n; }
      if (want !== S.page) { S.page = want; S.t0 = time; screenRedraw(S); }
      else if (SCR_FORCE) S.t0 = time;
    });
  }
  // today's page: Wednesday to Friday, Saturday, Sunday; on Monday and Tuesday the homework classes, then on
  function schToday() { var d = new Date().getDay(); return d === 6 ? 1 : (d === 0 ? 2 : (d === 1 || d === 2 ? 3 : 0)); }
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
    var S1 = pagedScreen(drawSchedulePage, SCH_PAGES.length, [12, 12, 12, 9], schToday()), S2 = pagedScreen(drawContestPage, 2, [16, 9], 0);
    S1.tex = screenQuad(S1.cv, a, spans[0][0], spans[0][1], y0, h).material.uniforms.map.value;
    S2.tex = screenQuad(S2.cv, a, spans[1][0], spans[1][1], y0, h).material.uniforms.map.value;
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
