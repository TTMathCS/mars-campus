  /* ==========================================================================================
     The screen around the video: shot titles, flight data, the timeline with its ten shots,
     camera buttons, the start and end cards, the radar in the storm, the pod's cockpit screens,
     and sound made on the fly with Web Audio.
     ========================================================================================== */
  var UI = (function () {
    var $ = function (id) { return document.getElementById(id); };
    var st = { playing: false, mode: "director", started: false, look: false, ended: false, drag: null, yaw: 0, pitch: 0, lastShot: -1, shotT: 0 };
    var F = FLIGHT, SH = DIRECTOR.SH, END = DIRECTOR.END;
    function fmt(t) { t = Math.max(0, t); var m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; }

    // timeline: one numbered marker per shot, the storm hatched
    var tl = $("tl"), fill = $("tlFill");
    tl.setAttribute("aria-valuemax", String(Math.round(END)));
    var marks = SH.map(function (s, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "mk"; b.textContent = String(s.n); b.title = s.title; b.setAttribute("aria-label", "Shot " + s.n + ": " + s.title);
      b.style.left = (s.t / END * 100) + "%";
      b.addEventListener("click", function (e) { e.stopPropagation(); seek(s.t + 0.01); });
      tl.appendChild(b); return b;
    });
    var storm = document.createElement("div"); storm.className = "storm"; storm.style.left = (F.WT[27] / END * 100) + "%"; storm.style.width = ((F.WT[31] + 2 - F.WT[27]) / END * 100) + "%"; tl.insertBefore(storm, tl.firstChild.nextSibling);
    function tlSeek(e) { var r = tl.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; seek(clamp(x / r.width, 0, 1) * END); }
    tl.addEventListener("pointerdown", function (e) { tlSeek(e); tl.setPointerCapture(e.pointerId); st.tlDrag = true; });
    tl.addEventListener("pointermove", function (e) { if (st.tlDrag) tlSeek(e); });
    tl.addEventListener("pointerup", function () { st.tlDrag = false; });
    tl.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { nextShot(1); e.preventDefault(); } else if (e.key === "ArrowLeft") { nextShot(-1); e.preventDefault(); } });

    function seek(t) { MAIN.seek(clamp(t, 0, END)); st.ended = false; $("end").hidden = true; }
    function nextShot(d) {
      var t = MAIN.t(), cur = SH.indexOf(DIRECTOR.shotAt(t)), i;
      if (d > 0) i = Math.min(SH.length - 1, cur + 1); else i = t - SH[cur].t > 2 ? cur : Math.max(0, cur - 1);
      seek(SH[i].t + 0.01);
    }
    function play(on) { st.playing = on; $("bPlay").textContent = on ? "Pause" : "Play"; $("bPlay").setAttribute("aria-label", on ? "Pause" : "Play"); if (on) { st.yaw = st.pitch = 0; } AUDIO.pause(!on); }
    function setMode(m) { st.mode = m; document.querySelectorAll("[data-cam]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cam === m ? "true" : "false"); }); }
    $("bPlay").addEventListener("click", function () { play(!st.playing); });
    document.querySelectorAll("[data-cam]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.cam); }); });
    $("bSound").addEventListener("click", function () { var on = !AUDIO.on(); AUDIO.enable(on); $("bSound").textContent = on ? "Sound on" : "Sound off"; $("bSound").setAttribute("aria-pressed", on ? "true" : "false"); });
    $("bSkip").addEventListener("click", function () { var t8 = SH[7].t; if (MAIN.t() < t8 - 1) seek(t8 + 0.01); else seek(END); });
    $("bStart").addEventListener("click", function () { start(0); });
    $("bReplay").addEventListener("click", function () { lookMode(false); start(0); });
    $("bLook").addEventListener("click", function () { lookMode(true); });
    function start(t) {
      st.started = true; $("start").hidden = true; $("end").hidden = true; ["shot", "data", "bar"].forEach(function (id) { $(id).hidden = false; });
      seek(t); play(true); AUDIO.pause(false);
    }
    // the look-around mode after the flight: drag to circle the Crown, wheel or pinch to come closer
    var lookBtn = document.createElement("button"); lookBtn.type = "button"; lookBtn.textContent = "Back"; lookBtn.id = "bBack"; lookBtn.hidden = true;
    lookBtn.style.cssText = "position:fixed;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:4;padding:10px 16px;border-radius:10px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font:600 14px var(--body);cursor:pointer";
    document.body.appendChild(lookBtn);
    var lookHint = document.createElement("div"); lookHint.hidden = true;
    lookHint.style.cssText = "position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);font:500 12px var(--mono);color:var(--dim);letter-spacing:.08em;text-shadow:0 1px 6px rgba(0,0,0,.8);pointer-events:none";
    lookHint.textContent = "DRAG TO CIRCLE THE CROWN · SCROLL OR PINCH TO ZOOM"; document.body.appendChild(lookHint);
    lookBtn.addEventListener("click", function () { lookMode(false); $("end").hidden = false; });
    var LOOK = { az: 250 * D2R, el: 6 * D2R, dist: 620, target: new THREE.Vector3(0, 58, 0), idle: 0 };
    function lookMode(on) {
      st.look = on; lookBtn.hidden = !on; lookHint.hidden = !on; $("end").hidden = true;
      ["shot", "data", "bar"].forEach(function (id) { $(id).hidden = on || !st.started; });
      if (on) { ["shot", "data", "bar"].forEach(function (id) { $(id).hidden = true; }); MAIN.seek(END); play(false); }
    }
    // dragging: look around while paused, or circle the Crown in look mode
    var cv = $("view"), pts = {};
    cv.addEventListener("pointerdown", function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); LOOK.idle = 0; });
    cv.addEventListener("pointermove", function (e) {
      var p = pts[e.pointerId]; if (!p) return;
      var ids = Object.keys(pts);
      if (ids.length === 2 && st.look) {
        var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]);
        if (d0 > 10) LOOK.dist = clamp(LOOK.dist * d0 / d1, 170, 1800);
      } else {
        var dx = e.clientX - p[0], dy = e.clientY - p[1];
        if (st.look) { LOOK.az -= dx * 0.006; LOOK.el = clamp(LOOK.el + dy * 0.004, -0.02, 1.2); }
        else if (!st.playing && st.started) { st.yaw -= dx * 0.004; st.pitch = clamp(st.pitch - dy * 0.004, -1.2, 1.2); }
      }
      pts[e.pointerId] = [e.clientX, e.clientY]; LOOK.idle = 0;
    });
    function up(e) { delete pts[e.pointerId]; }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", function (e) { if (!st.look) return; e.preventDefault(); LOOK.dist = clamp(LOOK.dist * Math.exp(e.deltaY * 0.001), 170, 1800); LOOK.idle = 0; }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (!st.started || st.look) return;
      if (e.key === " ") { play(!st.playing); e.preventDefault(); }
      else if (e.key === "1") setMode("director"); else if (e.key === "2") setMode("cockpit"); else if (e.key === "3") setMode("chase");
      else if (e.key === "ArrowRight" && e.target !== tl) nextShot(1); else if (e.key === "ArrowLeft" && e.target !== tl) nextShot(-1);
    });

    /* ---------------- per-frame: titles, data, timeline, radar, cockpit screens */
    var shotEl = $("shot"), dataEl = $("data"), welcome = $("welcome"), radar = $("radar"), rctx = radar.getContext("2d");
    var lastData = 0, lastScr = 0;
    function update(t, S, storm, cam) {
      fill.style.width = (t / END * 100) + "%";
      $("tTime").textContent = fmt(t) + " / " + fmt(END);
      tl.setAttribute("aria-valuenow", String(Math.round(t)));
      var sh = DIRECTOR.shotAt(t), si = SH.indexOf(sh);
      if (si !== st.lastShot) {
        st.lastShot = si; st.shotT = performance.now();
        $("shotK").textContent = "Shot " + sh.n + " of 10 · " + sh.k; $("shotT").textContent = sh.title; $("shotD").textContent = sh.d;
        marks.forEach(function (m, i) { m.classList.toggle("on", i <= si); });
        shotEl.style.transition = "none"; shotEl.style.opacity = 0; void shotEl.offsetWidth; shotEl.style.transition = "opacity .8s"; shotEl.style.opacity = 1;
      }
      $("shotD").style.opacity = performance.now() - st.shotT > 11000 && st.playing ? 0 : 1; $("shotD").style.transition = "opacity 1s";
      var now = performance.now();
      if (now - lastData > 120) {
        lastData = now;
        var alt = Math.max(0, S.p.y - TER.h(S.p.x, S.p.z) - 0.8), home = Math.hypot(S.p.x, S.p.z) / 1000;
        var temp = Math.round(-34 - 30 * (1 - FLIGHT.sunEl(t) / 10.5) - 6 * storm);
        dataEl.innerHTML = "SPEED <b>" + Math.round(S.speed * 3.6) + "</b> km/h<br>HEIGHT <b>" + Math.round(alt) + "</b> m<br>HOME <b>" + (home < 1 ? Math.round(home * 1000) + "</b> m" : home.toFixed(1) + "</b> km") + "<br>OUTSIDE <b>" + temp + "</b> °C";
      }
      // welcome text once the pod is in
      var w = t > F.WT[51] + 1.5 && t < END + 30 && !st.look;
      welcome.style.opacity = w ? 1 : 0;
      // the radar in the storm
      var showRadar = storm > 0.25 && st.started && !st.look;
      radar.style.display = showRadar ? "block" : "none";
      if (showRadar) drawRadar(t, S, storm);
      if (st.mode === "cockpit" || (cam && cam.cockpit)) { if (now - lastScr > 90) { lastScr = now; drawScreens(t, S, storm); } }
      // look mode: circle slowly when left alone
      if (st.look) { LOOK.idle += 1 / 60; if (LOOK.idle > 4) LOOK.az -= 0.0009; }
      if (!st.ended && t >= END - 0.01 && st.started && !st.look) { st.ended = true; play(false); $("end").hidden = false; }
    }
    function drawRadar(t, S, storm) {
      var c = rctx, W = radar.width, R = W / 2 - 6;
      c.clearRect(0, 0, W, W);
      c.save(); c.translate(W / 2, W / 2);
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fillStyle = "rgba(6,14,10,0.78)"; c.fill(); c.strokeStyle = "rgba(120,255,170,0.55)"; c.lineWidth = 2; c.stroke();
      c.strokeStyle = "rgba(120,255,170,0.18)"; c.lineWidth = 1; [0.33, 0.66].forEach(function (k) { c.beginPath(); c.arc(0, 0, R * k, 0, Math.PI * 2); c.stroke(); });
      c.beginPath(); c.moveTo(-R, 0); c.lineTo(R, 0); c.moveTo(0, -R); c.lineTo(0, R); c.stroke();
      // heading up: world points rotated by the pod's heading
      var sc = R / 4000;
      function toR(x, z) { var dx = x - S.p.x, dz = z - S.p.z, h = S.head; var rx = dx * Math.cos(h) - dz * Math.sin(h), rz = dx * Math.sin(h) + dz * Math.cos(h); return [rx * sc, rz * sc]; }
      // speckle: dust returns
      for (var i = 0; i < 90; i++) { var a = TER.hash12(i, Math.floor(t * 4)) * Math.PI * 2, r = Math.sqrt(TER.hash12(i * 3, Math.floor(t * 4) + 1)) * R; c.fillStyle = "rgba(120,255,170," + (0.08 + 0.2 * TER.hash12(i, 7)) * storm + ")"; c.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2); }
      // the sweep
      var sw = (t * 1.6) % (Math.PI * 2), g = c.createConicGradient ? c.createConicGradient(sw - 0.9, 0, 0) : null;
      if (g) { g.addColorStop(0, "rgba(120,255,170,0)"); g.addColorStop(0.14, "rgba(120,255,170,0.28)"); g.addColorStop(0.145, "rgba(120,255,170,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill(); }
      // the route ahead and home
      c.strokeStyle = "rgba(255,190,120,0.8)"; c.lineWidth = 1.5; c.beginPath();
      for (var k = 0; k <= 30; k++) { var q = FLIGHT.posAt(t + k * 1.2), rr = toR(q.x, q.z); if (k === 0) c.moveTo(rr[0], rr[1]); else c.lineTo(rr[0], rr[1]); }
      c.stroke();
      var hm = toR(0, 0), hr = Math.hypot(hm[0], hm[1]); if (hr > R - 8) { hm[0] *= (R - 8) / hr; hm[1] *= (R - 8) / hr; }
      c.fillStyle = "#ffd9a8"; c.beginPath(); c.arc(hm[0], hm[1], 5, 0, Math.PI * 2); c.fill();
      c.font = "600 18px IBM Plex Mono, monospace"; c.fillText("HOME", hm[0] + 8, hm[1] + 6);
      c.fillStyle = "rgba(120,255,170,0.9)"; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(-6, 7); c.closePath(); c.fill();
      c.font = "500 17px IBM Plex Mono, monospace"; c.fillStyle = "rgba(120,255,170,0.85)"; c.fillText("RADAR · DUST " + Math.round(storm * 100) + "%", -R * 0.62, R * 0.62);
      c.restore();
    }
    function drawScreens(t, S, storm) {
      var sc = POD.screen, c = sc.ctx, W = sc.canvas.width, H = sc.canvas.height, w3 = W / 3;
      c.fillStyle = "#05080a"; c.fillRect(0, 0, W, H);
      // left: horizon and speed
      c.save(); c.beginPath(); c.rect(8, 8, w3 - 16, H - 16); c.clip();
      c.translate(w3 / 2, H / 2); c.rotate(-S.bank); var py = S.pitch * 300;
      c.fillStyle = "#1c3d5a"; c.fillRect(-300, -300 + py, 600, 300); c.fillStyle = "#4a2f1d"; c.fillRect(-300, py, 600, 300);
      c.strokeStyle = "#e8e8e8"; c.lineWidth = 2; c.beginPath(); c.moveTo(-300, py); c.lineTo(300, py); c.stroke();
      c.restore();
      c.strokeStyle = "#ffd27a"; c.lineWidth = 3; c.beginPath(); c.moveTo(w3 / 2 - 40, H / 2); c.lineTo(w3 / 2 - 12, H / 2); c.moveTo(w3 / 2 + 12, H / 2); c.lineTo(w3 / 2 + 40, H / 2); c.stroke();
      c.fillStyle = "#cfe8ff"; c.font = "600 26px IBM Plex Mono, monospace"; c.fillText(Math.round(S.speed * 3.6) + " km/h", 18, 40);
      var alt = Math.max(0, S.p.y - TER.h(S.p.x, S.p.z)); c.fillText(Math.round(alt) + " m", 18, H - 20);
      // middle: map of the route with the pod and home
      c.fillStyle = "#081410"; c.fillRect(w3 + 8, 8, w3 - 16, H - 16);
      var mx = function (x) { return w3 + 20 + (1 - x / 31500) * (w3 - 40); }, mz = function (z) { return H / 2 + z / 5200 * (H / 2 - 20); };
      c.strokeStyle = "rgba(255,190,120,0.55)"; c.lineWidth = 2; c.beginPath();
      for (var k = 0; k <= 80; k++) { var q = FLIGHT.posAt(k / 80 * FLIGHT.TOTAL); if (k === 0) c.moveTo(mx(q.x), mz(q.z)); else c.lineTo(mx(q.x), mz(q.z)); }
      c.stroke();
      c.fillStyle = "#ffd9a8"; c.beginPath(); c.arc(mx(0), mz(0), 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#7dffb0"; c.beginPath(); c.arc(mx(S.p.x), mz(S.p.z), 5, 0, Math.PI * 2); c.fill();
      c.font = "500 20px IBM Plex Mono, monospace"; c.fillStyle = "#9fd3ee"; c.fillText("HOME " + (Math.hypot(S.p.x, S.p.z) / 1000).toFixed(1) + " km", w3 + 18, 34);
      // right: systems
      c.fillStyle = "#0a0d10"; c.fillRect(2 * w3 + 8, 8, w3 - 16, H - 16);
      c.font = "500 21px IBM Plex Mono, monospace";
      var lines = [["MAIN ENGINES", t > 9 && t < FLIGHT.WT[49] ? "ON" : "IDLE"], ["LIFT THRUST", t < 14 || t > FLIGHT.WT[48] ? "ON" : "OFF"], ["CABIN", "21 °C  101 kPa"], ["DUST", storm > 0.2 ? "STORM · RADAR" : "CLEAR"], ["ETA", fmt(Math.max(0, FLIGHT.TOTAL - t))]];
      lines.forEach(function (l, i) { c.fillStyle = "#8ea0ad"; c.fillText(l[0], 2 * w3 + 20, 40 + i * 42); c.fillStyle = l[1].indexOf("STORM") >= 0 ? "#ffb070" : "#dff3ff"; c.fillText(l[1], 2 * w3 + 20 + 180, 40 + i * 42); });
      sc.tex.needsUpdate = true;
    }
    function show() { $("load").hidden = true; $("start").hidden = false; }
    return { st: st, update: update, show: show, LOOK: LOOK, start: start, setMode: setMode, play: play, lookMode: lookMode };
  })();

  /* ---------------- sound: the pod's engines, wind, the storm's crackle and a chime at the Door */
  var AUDIO = (function () {
    var ctx = null, on = false, paused = true, nodes = {};
    function noise(len) { var b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = b.getChannelData(0), last = 0; for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } return b; }
    function white(len) { var b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      var master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); nodes.master = master;
      var br = ctx.createBufferSource(); br.buffer = noise(4); br.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 300; var eg = ctx.createGain(); eg.gain.value = 0;
      br.connect(lp); lp.connect(eg); eg.connect(master); br.start(); nodes.engLP = lp; nodes.engG = eg;
      var osc = ctx.createOscillator(); osc.type = "sawtooth"; osc.frequency.value = 48; var og = ctx.createGain(); og.gain.value = 0; var olp = ctx.createBiquadFilter(); olp.type = "lowpass"; olp.frequency.value = 180;
      osc.connect(olp); olp.connect(og); og.connect(master); osc.start(); nodes.osc = osc; nodes.oscG = og;
      var wn = ctx.createBufferSource(); wn.buffer = white(3); wn.loop = true; var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.6; var wg = ctx.createGain(); wg.gain.value = 0;
      wn.connect(bp); bp.connect(wg); wg.connect(master); wn.start(); nodes.windBP = bp; nodes.windG = wg;
    }
    function enable(v) { if (!ctx && v) init(); on = v; if (ctx) { if (on && ctx.state === "suspended") ctx.resume(); nodes.master.gain.setTargetAtTime(on && !paused ? 0.8 : 0, ctx.currentTime, 0.15); } }
    function pause(p) { paused = p; if (ctx) nodes.master.gain.setTargetAtTime(on && !paused ? 0.8 : 0, ctx.currentTime, 0.15); }
    var lastCrack = 0, chimed = false;
    function update(t, S, storm, inside, lift) {
      if (!ctx || !on) return;
      var now = ctx.currentTime, sp = clamp(S.speed / 190, 0, 1);
      nodes.engLP.frequency.setTargetAtTime(160 + 900 * sp + 500 * lift, now, 0.2);
      nodes.engG.gain.setTargetAtTime((0.12 + 0.35 * sp + 0.5 * lift) * (inside ? 0.25 : 1), now, 0.2);
      nodes.osc.frequency.setTargetAtTime(42 + 30 * sp + 18 * lift, now, 0.3);
      nodes.oscG.gain.setTargetAtTime((0.05 + 0.08 * lift + 0.04 * sp) * (inside ? 0.2 : 1), now, 0.2);
      nodes.windBP.frequency.setTargetAtTime(300 + 900 * sp - 150 * storm, now, 0.3);
      nodes.windG.gain.setTargetAtTime((0.03 + 0.1 * sp) * (1 + 3 * storm) * (inside ? 0.1 : 1), now, 0.3);
      // crackles of static in the storm
      if (storm > 0.4 && now - lastCrack > 0.08 + Math.random() * 0.5) { lastCrack = now; var s = ctx.createBufferSource(); s.buffer = white(0.06); var g = ctx.createGain(); g.gain.value = 0.25 * storm * Math.random(); var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500; s.connect(hp); hp.connect(g); g.connect(nodes.master); s.start(); }
      // a soft chime when the Door opens
      if (t > FLIGHT.WT[51] + 4 && !chimed) { chimed = true; [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; var g = ctx.createGain(); g.gain.setValueAtTime(0, now + i * 0.12); g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.12 + 2.6); o.connect(g); g.connect(nodes.master); o.start(now + i * 0.12); o.stop(now + i * 0.12 + 2.8); }); }
      if (t < FLIGHT.WT[51]) chimed = false;
    }
    return { enable: enable, pause: pause, update: update, on: function () { return on; } };
  })();
