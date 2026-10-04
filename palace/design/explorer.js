/* The house explorer on the design plan's home page: the whole house in section, path-traced from the model in
   frames round it. Drag (or ◀ ▶, or the arrow keys) to turn it; a label goes to that part's page (the Crown and
   L1 to their rooms). Frames and label positions: img/house/ (palace/tools/render/overall.py). */
(function () {
  var stage = document.getElementById("exStage"); if (!stage) return;
  var cur = 0, spots = null, have = [0];                     // have: the frames published so far
  var img = stage.querySelector(".ex-frame"), labs = stage.querySelector(".ex-labels");
  var LABELS = { crown: "The Crown", orb: "The Orb", garden: "Stone Garden", sunwell: "Sun Well", soil: "16 m of soil",
    pentagon: "The Pentagon", l1: "L1 · Residence", l2: "L2 · Garden", l3: "L3 · Studio", l4: "L4 · Life support", l5: "L5 · Transit", court: "Sun court" };
  // each part opens its own page (a link: the browser's back comes straight back here)
  var PAGES = { crown: "rooms-crown.html", orb: "crown.html#orb", garden: "crown.html#dock", sunwell: "pentagon.html#atrium", soil: "pentagon.html#why",
    pentagon: "pentagon.html", l1: "rooms-residence.html", l2: "pentagon.html#levels", l3: "pentagon.html#levels", l4: "pentagon.html#levels",
    l5: "pentagon.html#levels", court: "rooms-atrium.html" };

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
  function turnBy(k) { leaveWhole(); vel = 0; target = Math.round(target) + k * Math.max(1, Math.round(have.length / 24)); go(); }   // a click or a key: 15°, with 24 or 72 frames
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
    var step = Math.max(4, stage.clientWidth * 0.75 / have.length), now = performance.now(), dt = Math.max(1, now - drag.lt);   // a whole turn over 3/4 of the width
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

  // ---------------------------------------------------------------- the labels: links to the parts' pages
  Object.keys(LABELS).forEach(function (k) {
    var b = document.createElement("a"); b.className = "ex-lab"; b.href = PAGES[k]; b.setAttribute("data-part", k); b.hidden = true;
    b.innerHTML = '<i></i><span>' + E(LABELS[k]) + '</span>'; labs.appendChild(b);
  });

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
})();
