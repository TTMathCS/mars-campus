  /* ===================== The Fall timetable in the Gate Hall, and the rooms' door plates ===================== */
  // Jim, 5 Oct 2026: "the schedule should be somewhere in the entrance so students know where they are going to"; "each
  // area esp classroom should have room number". Two big screens on the Gate Hall's wall show TTMath's 2026 Fall Schedule
  // as Jim sent it (P2.timetable, from campus_timetable.py): every class, its days and times, and the room it meets in
  // (amber), online (red) or both (violet). Their own texture (the atlas is full), drawn once; a plain emissive material
  // that takes the exposure like the screens in the campus material.
  var BOARD = { W: 2048, H: 1024, mesh: null };
  function boardCanvas() {
    var T2 = P2.timetable, s = MOBILE ? 0.5 : 1, cv = mkCanvas(BOARD.W * s, BOARD.H * 2 * s), g = cv.getContext("2d");
    g.scale(s, s);
    var split = [["FunMath", "Basic and Calculus", "By invitation and Olympiad"], ["Contest", "Computer Science"]];
    split.forEach(function (names, bi) { drawBoard(g, 0, bi * BOARD.H, BOARD.W, BOARD.H, T2, T2.groups.filter(function (gr) { return names.indexOf(gr.name) >= 0; })); });
    return cv;
  }
  function drawBoard(g, x0, y0, W, H, T2, groups) {
    var bg = g.createLinearGradient(0, y0, 0, y0 + H); bg.addColorStop(0, "#0d1116"); bg.addColorStop(1, "#080a0d");
    g.fillStyle = bg; g.fillRect(x0, y0, W, H);
    var AMB = "#e8b04a", VIO = "#a98be6", RED = "#ff7f6e", INK = "#eef0f2", DIM = "#9aa3ad", M = 46;
    g.textBaseline = "middle";
    g.fillStyle = INK; g.font = "700 52px " + SANS; g.fillText(T2.term.title, x0 + M, y0 + 66);
    var tw = g.measureText(T2.term.title).width; g.fillStyle = DIM; g.font = "400 30px " + SANS; g.fillText(T2.term.dates + "  ·  " + T2.term.weeks + " weeks", x0 + M + tw + 28, y0 + 70);
    // the legend, right
    function chip(x, y, txt, col, h) { g.font = "700 " + Math.round(h * 0.66) + "px " + SANS; var w = g.measureText(txt).width + h * 0.6; g.fillStyle = col; roundRect(g, x, y - h / 2, w, h, h * 0.22); g.fill(); g.fillStyle = "#101418"; g.fillText(txt, x + h * 0.3, y + 1); return w; }
    var lx = x0 + W - M - 470, ly = y0 + 68;
    lx += chip(lx, ly, "Room", AMB, 34) + 18; lx += chip(lx, ly, "Room + online", VIO, 34) + 22;
    g.fillStyle = RED; g.font = "700 26px " + SANS; g.fillText("Online", lx, ly + 1);
    // columns
    var cols = [M, M + 470], cw = 252; for (var k = 0; k < 5; k++) cols.push(cols[1] + (k + 1) * cw); var hwX = cols[6];
    var hy = y0 + 132; g.fillStyle = AMB; g.font = "700 22px " + SANS;
    ["CLASS"].concat(T2.days).forEach(function (t, i) { g.fillText(t, x0 + (i === 0 ? cols[0] : cols[i] + 6), hy); }); g.fillText("HOMEWORK", x0 + hwX + 6, hy);
    g.fillStyle = "#2a323b"; g.fillRect(x0 + M, hy + 22, W - 2 * M, 2);
    var nrow = 0; groups.forEach(function (gr) { nrow += 1; gr.classes.forEach(function (c) { nrow += c.rows.length; }); });
    var top = hy + 34, rh = Math.min(40, (y0 + H - 30 - top) / nrow), y = top;
    groups.forEach(function (gr) {
      g.fillStyle = AMB; g.font = "700 23px " + SANS; g.fillText(gr.name.toUpperCase(), x0 + M, y + rh * 0.55); y += rh;
      gr.classes.forEach(function (c) {
        g.fillStyle = "#1a2028"; g.fillRect(x0 + M, y - 1, W - 2 * M, 1);
        c.rows.forEach(function (row, ri) {
          var cy = y + rh / 2;
          if (ri === 0) {
            g.fillStyle = INK; g.font = "600 25px " + SANS; fitText(g, c.name, x0 + cols[0], cy, 452);
            g.fillStyle = DIM; g.font = "400 19px " + SANS; fitText(g, c.hw, x0 + hwX + 6, cy, W - M - hwX - 6);
          }
          row.forEach(function (cell, di) {
            if (!cell) return; var cx = x0 + cols[di + 1] + 6, t = cell[0], r = cell[1];
            g.fillStyle = r === 0 ? RED : "#d5d9de"; g.font = "500 21px " + SANS; g.fillText(t.replace(" pm", "p").replace(" am", "a"), cx, cy);
            var tw2 = g.measureText(t.replace(" pm", "p").replace(" am", "a")).width + 10;
            if (r !== 0) chip(cx + tw2, cy, String(Math.abs(r)) + (r < 0 ? "+" : ""), r < 0 ? VIO : AMB, Math.min(28, rh - 6));
          });
          y += rh;
        });
      });
    });
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
  function fitText(g, t, x, y, w) { var f = g.font, px = parseFloat(f.match(/(\d+)px/)[1]); while (g.measureText(t).width > w && px > 12) { px -= 1; g.font = f.replace(/\d+px/, px + "px"); } g.fillText(t, x, y); g.font = f; }
  var BOARD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
  var BOARD_FS = "uniform sampler2D map; uniform float uExposure, uBright; varying vec2 vUv;\n" +
    "void main(){ vec3 t = texture2D(map, vUv).rgb; vec3 c = pow(t, vec3(2.2)) * uBright + vec3(0.003); c *= uExposure; gl_FragColor = vec4(c / (1.0 + c), 0.0); }";
  // the screens on the Gate Hall's wall at 164 degrees, facing into the hall: A (FunMath, Basic, by invitation) on the left,
  // B (Contest, CS) on the right as you face them; a dark aluminium bezel round each
  function timetableBoards(W) {
    var C = CRS, a = 164 * D2R + (C.wall / 2 + 0.07) / 55.8, y0 = C.yU + 1.05, h = 1.8, w = 3.6, spans = [[51.9, 51.9 + w], [55.8, 55.8 + w]];
    var tex = new THREE.CanvasTexture(boardCanvas()); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    var pos = [], uvs = [], idx = [];
    spans.forEach(function (sp, bi) {
      var v0 = bi === 0 ? 0.5 : 0.0, v1 = bi === 0 ? 1.0 : 0.5, n = pos.length / 3;
      [[sp[0], y0, 0, v0], [sp[1], y0, 1, v0], [sp[1], y0 + h, 1, v1], [sp[0], y0 + h, 0, v1]].forEach(function (c) { var p = crsPt(c[0], a); pos.push(p.x, c[1], p.z); uvs.push(c[2], c[3]); });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3, n, n + 2, n + 1, n, n + 3, n + 2);
      var bz = new Builder(), Mb = crsFrame((sp[0] + sp[1]) / 2, 164 * D2R + C.wall / 2 / 55.8, y0 + h / 2);
      bz.box(0.0, -h / 2 - 0.06, -w / 2 - 0.06, 0.06, h / 2 + 0.06, w / 2 + 0.06, MT.ANOD); bz.tag(0, 3, null); W.add(bz, Mb);
      var lp = crsPt((sp[0] + sp[1]) / 2, 164 * D2R + 1.2 / 55.8); wLight(lp.x, y0 + h / 2, lp.z, [0.75, 0.82, 1.0], 0.9, 6);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(idx);
    var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uExposure: U.uExposure, uBright: { value: 1.05 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS });
    BOARD.mesh = new THREE.Mesh(geo, mat); BOARD.mesh.matrixAutoUpdate = false; scene.add(BOARD.mesh);
    crsObst(51.5, 59.8, 164 * D2R, 164 * D2R + 0.6 / 55.8, "upper");
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
      g.fillStyle = "#24282d"; g.fillRect(x + 1, y + 1, 190, 46); g.fillStyle = "#e8b04a"; g.fillRect(x + 1, y + 1, 5, 46);
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
          var pa = d + (d < mid ? 1 : -1) * 0.86 / C.rc;
          wpic(W, crsFrame(C.rc - C.wall / 2 - 0.012, pa, y + 1.5), [0, 0, 0], "x", [0, -1], 0.42, 0.105, uv, MT.ATLAS, [0, 0]);
        });
      });
    });
  }
