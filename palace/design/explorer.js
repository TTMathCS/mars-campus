/* The house explorer on the design plan's home page: the whole house in section, path-traced from the model in
   frames round it. Drag (or ◀ ▶, or the arrow keys) to turn it; click a label to open that part: the Crown and L1
   open their floor plans, where every room can be clicked for its pictures, 360° views and facts.
   Frames and label positions: img/house/ (palace/tools/render/overall.py); rooms and plan shapes:
   explorer-rooms.json (palace/tools/gen_plan.py). */
(function () {
  var stage = document.getElementById("exStage"); if (!stage) return;
  var cur = 0, spots = null, data = null, have = [0];        // have: the frames published so far
  var img = stage.querySelector(".ex-frame"), labs = stage.querySelector(".ex-labels");
  var LABELS = { crown: "The Crown", orb: "The Orb", garden: "Stone Garden", sunwell: "Sun Well", soil: "16 m of soil",
    pentagon: "The Pentagon", l1: "L1 · Residence", l2: "L2 · Garden", l3: "L3 · Studio", l4: "L4 · Life support", l5: "L5 · Transit", court: "Sun court" };
  var PARTS = {
    crown: { kick: "Above ground · 276 m across", title: "The Crown", plan: "crown", more: [["rooms-crown.html", "The Crown, room by room"], ["crown.html", "Chapter 02: the Crown"]],
      text: "A white ring of fired Mars soil 276 m across, floating 40 m over the Stone Garden on five anti-gravity drives. Its ten parts run round the ring and the Glide, a moving walkway, links them in a 779 m loop. Five spires rise to 90 m, each with a portal. Click a part of the plan to look inside." },
    orb: { kick: "Over the middle of the ring · 48 to 96 m up", title: "The Orb", fig: ["img/orb-universe.jpg", "Inside the Orb, the universe switched on."], more: [["crown.html#orb", "Chapter 02: the Orb and the Wormhole Gate"]],
      text: "A mirror ball 48 m across. On three floors, five rooms each sit between two lanes round the Wormhole Gate, a ball 18 m across that floats in the middle; in every room the universe fills the space in 3D at a switch." },
    garden: { kick: "On the ground", title: "The Stone Garden", fig: ["img/crown-garden.jpg", "From the paved terrace by a corner pavilion, under the ring."], more: [["crown.html#dock", "The Orb's dock and the garden"]],
      text: "Raked gravel and seven basalt stones inside a paved pentagon 4 m wider than the Pentagon below, so the ground shows where the house lies. A glass pavilion stands over the stair at each corner, under each spire." },
    sunwell: { kick: "In the middle of the Stone Garden", title: "The Sun Well", fig: ["img/crown-garden.jpg", "The Sun Well's lens, round the Orb's dock."], more: [["pentagon.html#atrium", "The atrium and the sun court"]],
      text: "A glass lens 20 m across, the sky lens over the atrium: lamps behind it give the atrium the sky outside at that moment, 68 m down to the sun court, and keep it bright through a dust storm. An iris closes over it in a storm." },
    soil: { kick: "Over the roof of L1", title: "16 m of soil", fig: ["../docs/img/book/pentagon-dose.png", "Radiation in mSv a year, by place."], more: [["pentagon.html#why", "Why underground"]],
      text: "The soil on the roof stops the radiation (about 230 mSv a year on the open plain; below it, less than people get on Earth), holds the air pressure down and keeps the warmth steady. The ground round the walls stays frozen, as under buildings on permafrost." },
    pentagon: { kick: "Below ground · five levels, 24 to 68 m down", title: "The Pentagon", levels: true, fig: ["../docs/img/book/pentagon-section.png", "Section east to west through the middle, to scale: the five levels round the atrium, the Sun Well above, the sun court at the bottom."], more: [["pentagon.html", "Chapter 03: the Pentagon"]],
      text: "One solid five-sided block, 160 m on each side and five levels deep, dug into thick ice under 16 m of soil: 209,700 m², eleven times the Crown. Round the atrium run five rings of rooms with streets between them, and avenues lead out to the corner cores under the spires. Choose a level." },
    l1: { kick: "The Pentagon · 24 m down · 8 m high", title: "L1 · Residence", plan: "l1", more: [["rooms-residence.html", "Jim's residence, room by room"], ["rooms-atrium.html", "Round the atrium"]],
      text: "Jim's home below ground: the master suite down, the family rooms, a club with a cinema and a ballroom, thermal baths and a 50 m pool, the great library and the guest suites. Click a room on the plan." },
    l2: { kick: "The Pentagon · 41 m down · 16 m high", title: "L2 · Garden", sheet: "../plans/svg/l2.svg", more: [["pentagon.html#levels", "Chapter 03: the five levels"]],
      text: "Under a sky of lamps: orchards, a farm, a lake that is also the water reserve, a forest with a stream, and a meadow with bees." },
    l3: { kick: "The Pentagon · 50 m down", title: "L3 · Studio", sheet: "../plans/svg/l3.svg", more: [["pentagon.html#levels", "Chapter 03: the five levels"]],
      text: "Jim's studio and workshops, the robot foundry that prints parts for the city, laboratories and the medical centre, the house mind and the control rooms." },
    l4: { kick: "The Pentagon · 59 m down", title: "L4 · Life support", sheet: "../plans/svg/l4.svg", more: [["pentagon.html#levels", "Chapter 03: the five levels"], ["power.html", "Chapter 05: power"]],
      text: "Two fission reactors and a bay kept for fusion, water from ice, the air plant, the storm reserve of two years' food, and recycling." },
    l5: { kick: "The Pentagon · 68 m down", title: "L5 · Transit", sheet: "../plans/svg/l5.svg", more: [["pentagon.html#levels", "Chapter 03: the five levels"], ["transport.html", "Chapter 06: transport"]],
      text: "The maglev station (phase 2), the cargo halls, the seed vault, the tunnel works, and the rover hall with the tunnel up to the plain. The sun court is at its centre." },
    court: { kick: "The bottom of the atrium · 68 m down", title: "The atrium and the sun court", room: "l1:court", more: [["rooms-atrium.html", "Round the atrium"], ["pentagon.html#atrium", "Chapter 03: the atrium"]],
      text: "A five-sided shaft 35 m across and 68 m deep, with terraces of hanging gardens on every level and a bridge from each to the portal column. At the bottom, a garden of 2,100 m² round a pool, lit with the colour and warmth of a clear Mars noon." }
  };

  function E(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function src(i) { return "img/house/f" + (i < 10 ? "0" : "") + i + ".jpg"; }

  // ---------------------------------------------------------------- turning
  // The frames are decoded once and drawn on a canvas. While you drag, the two nearest frames are blended by how far
  // you are between them; let go and it glides on, slows down and comes to rest on a whole frame.
  var cv = document.createElement("canvas"), ctx = cv.getContext("2d"), bmp = {};
  cv.className = "ex-canvas"; stage.insertBefore(cv, labs);
  var pos = 0, target = 0, vel = 0, raf = 0, drag = null;
  function mod(i) { var n = have.length; return ((i % n) + n) % n; }
  function fit() {
    var r = stage.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  }
  function nearest(i) {                                           // the nearest frame already decoded
    for (var d = 0; d < have.length; d++) { var a = have[mod(i + d)], b = have[mod(i - d)]; if (bmp[a]) return a; if (bmp[b]) return b; }
    return null;
  }
  function draw(p) {
    var i0 = Math.floor(p), f = p - i0, a = bmp[have[mod(i0)]] ? have[mod(i0)] : nearest(i0), b = have[mod(i0 + 1)];
    if (a === null) return;
    f = f < 0.3 ? 0 : f > 0.7 ? 1 : (f - 0.3) / 0.4; f = f * f * (3 - 2 * f);     // each frame stays sharp; blend only near the middle
    fit(); ctx.globalAlpha = 1; ctx.drawImage(bmp[a], 0, 0, cv.width, cv.height);
    if (f >= 0.998 && bmp[b]) { a = b; f = 0; ctx.drawImage(bmp[a], 0, 0, cv.width, cv.height); }
    else if (f > 0.002 && bmp[b] && b !== a) { ctx.globalAlpha = f; ctx.drawImage(bmp[b], 0, 0, cv.width, cv.height); ctx.globalAlpha = 1; } else { b = a; f = 0; }
    if (img.style.visibility !== "hidden") img.style.visibility = "hidden";
    place(a, b, f);
  }
  function place(a, b, f) {                                       // the labels, slid between the two frames' positions
    if (!spots) return;
    var A = spots.frames[a] || spots.frames[0], B = spots.frames[b] || A;
    Object.keys(LABELS).forEach(function (k) {
      var el = labs.querySelector('[data-part="' + k + '"]'); if (!el || !A[k]) return;
      var q = B[k] || A[k], x = A[k][0] + (q[0] - A[k][0]) * f, y = A[k][1] + (q[1] - A[k][1]) * f;
      var vis = x > 0.02 && x < 0.98 && y > 0.03 && y < 0.97;
      el.style.left = (x * 100) + "%"; el.style.top = (y * 100) + "%"; el.hidden = !vis;
      el.classList.toggle("left", x > 0.78);
    });
  }
  function tick() {
    raf = 0;
    if (!drag) {
      if (Math.abs(vel) > 0.004) { target += vel; vel *= 0.9; }   // glide on after you let go
      else { vel = 0; target = Math.round(target); }              // then settle on a whole frame
    }
    var d = target - pos;
    pos = Math.abs(d) < 0.002 ? target : pos + d * (drag ? 0.5 : 0.18);
    draw(pos); cur = mod(Math.round(pos));
    if (drag || vel || pos !== target) raf = requestAnimationFrame(tick);
  }
  function go() { if (!raf) raf = requestAnimationFrame(tick); }
  function leaveWhole() { if (wimg && !wimg.hidden) { wimg.hidden = true; labs.hidden = false; wb.textContent = "Without the cut"; stage.classList.remove("whole"); } }
  function turnBy(k) { leaveWhole(); vel = 0; target = Math.round(target) + k; go(); }
  function show(i) {                                              // to frame i the short way round
    var n = have.length; vel = 0; target = i + n * Math.round((pos - i) / n); go();
  }
  function preload() {
    have.forEach(function (j) {
      var im = new Image(); im.decoding = "async";
      im.onload = function () {
        function done(x) { bmp[j] = x; if (!raf) draw(pos); }
        if (window.createImageBitmap) createImageBitmap(im).then(done, function () { done(im); }); else done(im);
      };
      im.src = src(j);
    });
  }
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".ex-lab, .ex-ctrl") || have.length < 2) return;
    leaveWhole(); vel = 0;
    drag = { x: e.clientX, t0: target, lx: e.clientX, lt: performance.now(), v: 0 };
    stage.setPointerCapture(e.pointerId); stage.classList.add("dragging"); go();
  });
  stage.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var step = Math.max(12, stage.clientWidth / 32), now = performance.now(), dt = Math.max(1, now - drag.lt);
    target = drag.t0 + (drag.x - e.clientX) / step;
    drag.v = 0.7 * drag.v + 0.3 * ((drag.lx - e.clientX) / step) / dt * 16.7;      // frames per tick at 60 Hz
    drag.lx = e.clientX; drag.lt = now; go();
  });
  function end() {
    if (!drag) return;
    vel = performance.now() - drag.lt > 90 ? 0 : Math.max(-0.5, Math.min(0.5, drag.v));
    drag = null; stage.classList.remove("dragging"); go();
  }
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  window.addEventListener("resize", function () { draw(pos); });
  stage.querySelectorAll(".ex-ctrl button[data-step]").forEach(function (b) { b.addEventListener("click", function () { turnBy(+b.getAttribute("data-step")); }); });
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { turnBy(-1); e.preventDefault(); } else if (e.key === "ArrowRight") { turnBy(1); e.preventDefault(); }
  });

  // ---------------------------------------------------------------- the labels and the panel
  Object.keys(LABELS).forEach(function (k) {
    var b = document.createElement("button"); b.type = "button"; b.className = "ex-lab"; b.setAttribute("data-part", k); b.hidden = true;
    b.innerHTML = '<i></i><span>' + E(LABELS[k]) + '</span>'; b.addEventListener("click", function () { openPart(k); });
    labs.appendChild(b);
  });
  document.querySelectorAll(".ex-parts button[data-part]").forEach(function (b) { b.addEventListener("click", function () { openPart(b.getAttribute("data-part")); }); });
  var panel = document.getElementById("exPanel"), body = panel.querySelector(".xp-body");
  panel.querySelector(".xp-x").addEventListener("click", closePanel);
  panel.addEventListener("click", function (e) { if (e.target === panel) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) closePanel(); });
  function closePanel() { panel.hidden = true; body.innerHTML = ""; document.body.classList.remove("xp-open"); }
  function openPanel(html) { body.innerHTML = html; panel.hidden = false; document.body.classList.add("xp-open"); panel.querySelector(".xp-box").scrollTop = 0; wire(); }
  function links(more) { return more ? '<p class="xp-more">' + more.map(function (m) { return '<a href="' + m[0] + '">' + E(m[1]) + ' →</a>'; }).join("") + "</p>" : ""; }

  function planHtml(key) {
    var p = data.plans[key], svg = "";
    Object.keys(p.shapes).forEach(function (id) {
      var r = data.rooms[p.prefix + id]; if (!r) return;
      p.shapes[id].forEach(function (poly) {
        svg += '<polygon data-room="' + p.prefix + id + '" points="' + poly.map(function (q) { return q[0] + "," + q[1]; }).join(" ") + '"><title>' + E(r.name) + "</title></polygon>";
      });
    });
    var list = Object.keys(p.shapes).map(function (id) {
      var r = data.rooms[p.prefix + id]; if (!r) return "";
      var th = r.photos.length ? r.photos[0].src : (r.views.length ? r.views[0].poster : "");
      return '<button type="button" data-room="' + p.prefix + id + '">' + (th ? '<img src="' + th + '" alt="" loading="lazy">' : '<span class="noimg"></span>') + "<b>" + E(r.name) + "</b></button>";
    }).join("");
    return '<figure class="xp-plan"><div class="xp-sheet"><img src="' + p.sheet + '" alt="Floor plan" width="' + p.w + '" height="' + p.h + '"><svg viewBox="0 0 ' + p.w + " " + p.h + '" preserveAspectRatio="none">' + svg + "</svg></div>" +
      "<figcaption>Click a shaded room, or choose one below.</figcaption></figure>" + '<div class="xp-rooms">' + list + "</div>";
  }
  function openPart(k) {
    var P = PARTS[k], h = '<div class="xp-kick">' + E(P.kick) + "</div><h2>" + E(P.title) + '</h2><p class="xp-text">' + E(P.text) + "</p>";
    if (P.levels) h += '<div class="xp-levels">' + ["l1", "l2", "l3", "l4", "l5"].map(function (l) { return '<button type="button" data-part="' + l + '"><b>' + E(PARTS[l].title) + "</b><span>" + E(PARTS[l].kick.replace("The Pentagon · ", "")) + "</span></button>"; }).join("") + "</div>";
    if (P.plan) h += data ? planHtml(P.plan) : "<p>Loading the plan…</p>";
    else if (P.sheet) h += '<figure class="xp-fig"><a href="' + P.sheet + '" target="_blank" rel="noopener"><img src="' + P.sheet + '" alt="Floor plan of ' + E(P.title) + '"></a><figcaption>The floor plan of ' + E(P.title) + ', with every room\'s code.</figcaption></figure>';
    else if (P.fig) h += '<figure class="xp-fig"><img src="' + P.fig[0] + '" alt=""><figcaption>' + E(P.fig[1]) + "</figcaption></figure>";
    if (P.room && data && data.rooms[P.room]) h += roomMedia(data.rooms[P.room]);
    openPanel(h + links(P.more));
    panel.setAttribute("data-part", k);
  }
  function roomMedia(r) {
    var m = "";
    r.views.forEach(function (v) {
      m += '<figure><div class="pano"><img src="' + v.poster + '" alt="' + E(v.label) + '" loading="lazy"><span class="tag">360°</span><div class="play"><button type="button" data-stop="' + v.stop + '">Look round in 360°</button><a href="../tour/#' + v.stop + '">Full screen ↗</a></div></div><figcaption><b>' + E(v.label) + "</b>: drag to look round.</figcaption></figure>";
    });
    r.photos.forEach(function (p) { m += '<figure><img src="' + p.src + '" alt="' + E(p.cap) + '" loading="lazy"><figcaption>' + E(p.cap) + "</figcaption></figure>"; });
    return m ? '<div class="xp-media">' + m + "</div>" : '<div class="xp-pending">Pictures of this room are rendering, and appear here when they are done.</div>';
  }
  function openRoom(key) {
    var r = data.rooms[key], back = panel.getAttribute("data-part");
    var h = (back ? '<button type="button" class="xp-back" data-part="' + back + '">← ' + E(PARTS[back].title) + "</button>" : "") +
      '<div class="xp-kick">' + E(r.k) + "</div><h2>" + E(r.name) + '</h2><p class="xp-text">' + E(r.purpose) + "</p>" + roomMedia(r) +
      '<table class="spec"><tbody>' + r.facts.map(function (f) { return "<tr><th>" + E(f[0]) + "</th><td>" + E(f[1]) + "</td></tr>"; }).join("") + "</tbody></table>" +
      links([[r.page, "Its page in the design plan"]]);
    openPanel(h); panel.setAttribute("data-part", back || "");
  }
  function wire() {
    body.querySelectorAll("[data-room]").forEach(function (el) { el.addEventListener("click", function () { openRoom(el.getAttribute("data-room")); }); });
    body.querySelectorAll(".xp-back, .xp-levels button").forEach(function (el) { el.addEventListener("click", function () { openPart(el.getAttribute("data-part")); }); });
    body.querySelectorAll(".pano button[data-stop]").forEach(function (b) {
      b.addEventListener("click", function () {
        var box = b.closest(".pano"), f = document.createElement("iframe");
        f.src = "../tour/index.html?embed#" + b.getAttribute("data-stop"); f.title = "360° view"; f.allow = "fullscreen";
        box.querySelectorAll("img, .tag").forEach(function (e) { e.remove(); }); b.remove(); box.appendChild(f);
      });
    });
  }

  // the same view with the ground left whole: what you would really see, on a button once it is rendered
  var wb = null, wimg = null;
  function wholeButton() {
    wimg = document.createElement("img"); wimg.className = "ex-whole"; wimg.alt = "The same view with the ground left whole: the Crown floating over the Stone Garden"; wimg.hidden = true;
    stage.insertBefore(wimg, labs);
    wb = document.createElement("button"); wb.type = "button"; wb.className = "ex-wb"; wb.textContent = "Without the cut";
    wb.addEventListener("click", function () {
      var on = wimg.hidden;
      if (on) { show(0); if (!wimg.getAttribute("src")) wimg.src = "img/house-whole.jpg"; }
      wimg.hidden = !on; labs.hidden = on; wb.textContent = on ? "Show the inside" : "Without the cut"; stage.classList.toggle("whole", on);
    });
    stage.querySelector(".ex-ctrl").insertBefore(wb, stage.querySelector(".ex-ctrl").firstChild);
  }
  fetch("img/house/spots.json").then(function (r) { return r.json(); }).then(function (s) {
    spots = s; have = s.have && s.have.length ? s.have : [0];
    if (s.whole) wholeButton();
    stage.classList.toggle("still", have.length < 2);                // one frame so far: nothing to turn yet
    place(have[0], have[0], 0); preload();
  }).catch(function () {});
  fetch("explorer-rooms.json").then(function (r) { return r.json(); }).then(function (d) { data = d; var k = panel.getAttribute("data-part"); if (!panel.hidden && k && PARTS[k] && PARTS[k].plan) openPart(k); }).catch(function () {});
})();
