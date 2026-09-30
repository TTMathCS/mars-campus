
  /* ============================== the Gatehouse airlock: doors, scan, cycle ============================== */
  var GATE = { doors: {}, auth: false, phase: "", timer: 0, side: "out", scanShown: false };
  function buildGateDoors() {
    function leaf(mat, w, h, t, lx, lz, y) { var g = new THREE.Mesh(rboxGeo(w, h, t, 0.02, 1), M[mat]); worldUV(g.geometry, 1); g.castShadow = true; g.receiveShadow = true; var p = gw(lx, lz); g.position.set(p[0], y + h / 2, p[1]); g.rotation.y = GH.ry; ZONE = "surface"; put(g); return g; }
    GATE.doors.outer = { open: 0, target: 0, lz: 19, w: 2.4, leaves: [leaf("goldDark", 2.42, 5.2, 0.22, -1.2, 19, 0), leaf("goldDark", 2.42, 5.2, 0.22, 1.2, 19, 0)], block: gShape(18.7, 19.3, 2.5) };
    GATE.doors.inner = { open: 0, target: 0, lz: 12, w: 2.2, leaves: [leaf("glass", 2.22, 3.2, 0.06, -1.1, 12, 0), leaf("glass", 2.22, 3.2, 0.06, 1.1, 12, 0)], block: gShape(11.7, 12.3, 2.3) };
    // brass pulls on the bronze doors
    GATE.doors.outer.leaves.forEach(function (l, i) { var pull = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), M.gold); pull.position.set(i ? -0.95 : 0.95, 0, 0.18); l.add(pull); });
  }
  function doorsStep(dt) {
    ["outer", "inner"].forEach(function (k) {
      var d = GATE.doors[k], was = d.open; d.open += clamp(d.target - d.open, -dt / 1.6, dt / 1.6);
      if (was !== d.open) { d.leaves.forEach(function (l, i) { var s = i ? 1 : -1, off = s * (d.w / 2 + d.open * d.w * 0.98), p = gw(off, d.lz); l.position.x = p[0]; l.position.z = p[1]; }); shadowDirty = true; }
    });
  }
  function gLocal(x, z) { var dx = x - GH.x, dz = z - GH.z, c = Math.cos(GH.ry), s = Math.sin(GH.ry); return { lx: dx * c - dz * s, lz: dx * s + dz * c }; }
  function airlockStep(dt) {
    var O = GATE.doors.outer, I = GATE.doors.inner;
    if (state.mode !== "walk" || walk.lv !== 0) { if (state.mode !== "journey") { O.target = 0; I.target = 0; } if (GATE.phase === "scan") $("scan").hidden = true; GATE.phase = ""; return; }
    var L = gLocal(walk.x, walk.z), near = Math.abs(L.lx) < 9;
    if (L.lz > 19.4) GATE.side = "out"; else if (L.lz < 11.6) GATE.side = "in";
    if (GATE.phase === "scan" || GATE.phase === "cycle") {
      GATE.timer -= dt;
      if (GATE.phase === "scan") scanHUD(GATE.timer);
      if (GATE.timer <= 0) {
        if (GATE.phase === "scan") { GATE.auth = true; GATE.phase = ""; hideScan(1.6); chime(); O.target = 1; }
        else { GATE.phase = ""; $("suitline").classList.remove("cyc"); if (GATE.dir === "in") I.target = 1; else O.target = 1; }
      }
      return;
    }
    if (GATE.side === "out" && near && L.lz > 19.4 && L.lz < 36) {
      if (!GATE.auth) { GATE.phase = "scan"; GATE.timer = 2.6; showScan(); return; }
      if (I.open < 0.02) O.target = 1;
    }
    var inLock = L.lz > 12.3 && L.lz < 18.7 && Math.abs(L.lx) < 4.6;
    if (inLock && GATE.side === "out" && L.lz < 17.4) { O.target = 0; if (O.open < 0.02 && I.open < 0.02) { GATE.phase = "cycle"; GATE.dir = "in"; GATE.timer = 3.2; GATE.side = "lock"; hiss(); cycleLine("PRESSURISING · 0.8 → 70 kPa"); } }
    else if (inLock && GATE.side === "in" && L.lz > 13.6) { I.target = 0; if (I.open < 0.02 && O.open < 0.02) { GATE.phase = "cycle"; GATE.dir = "out"; GATE.timer = 3.2; GATE.side = "lock"; hiss(); cycleLine("DEPRESSURISING · 70 → 0.8 kPa"); } }
    else if (GATE.side === "in" && near && L.lz > 6 && L.lz < 11.6 && O.open < 0.02) I.target = 1;
    if (!inLock) { if (L.lz < 5 || L.lz > 24 || !near) I.target = GATE.side === "in" && L.lz > 6 && near ? I.target : 0; if (L.lz < 12 || L.lz > 40 || !near) O.target = 0; }
  }
  function cycleLine(t) { var el = $("suitline"); el.hidden = false; el.classList.add("cyc"); el.innerHTML = "<b>AIRLOCK</b> · " + t; }
  var scanT = 0;
  function showScan() { $("scan").hidden = false; $("scan").classList.remove("ok"); $("scan1").textContent = "Identity"; $("scan2").textContent = "Face · iris · gait"; scanT = 0; }
  function scanHUD(left) { var p = clamp(1 - left / 2.6, 0, 1); $("scanBar").style.width = Math.round(p * 100) + "%"; if (p > 0.55) $("scan2").textContent = "Resident recognised"; }
  function hideScan(delay) { $("scan").classList.add("ok"); $("scan1").textContent = "Welcome home"; $("scan2").textContent = "Doors opening"; setTimeout(function () { $("scan").hidden = true; }, (delay || 1) * 1000); }

  /* ============================== glass lifts ============================== */
  var CARS = [];
  function buildLifts() {
    LIFTS.forEach(function (l, i) {
      var g = new THREE.Group(), gl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3, 36, 1, true), M.glass), fl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.14, 36), M.goldDark), rf = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.2, 36), M.goldDark);
      gl.position.y = 1.5; fl.position.y = -0.07; rf.position.y = 3.1; var lt = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 32), M.led); lt.position.y = 2.99;
      var bench = new THREE.Mesh(rboxGeo(1.4, 0.45, 0.5, 0.06, 2), M.leather); bench.position.set(0, 0.22, -0.85);
      g.add(gl, fl, rf, lt, bench); g.traverse(function (m) { if (m.isMesh) { m.castShadow = m.material !== M.glass; m.receiveShadow = true; } });
      g.position.set(l.x, 0, l.z); scene.add(g); CARS.push({ g: g, y: 0, lift: l, idx: i });
      for (var lv = 0; lv <= 5; lv++) INTER.push({ kind: "lift", lift: i, x: l.x, z: l.z, lv: lv, r: 3.2, label: "Call the lift" });
    });
  }
  var RIDE = null;
  function openLiftPanel(liftIdx) {
    var h = []; for (var k = 0; k <= 5; k++) h.push('<button type="button" class="lvbtn" data-lv="' + k + '"' + (k === walk.lv ? ' aria-current="true"' : "") + '><span>' + (k ? "L" + k : "G") + '</span><span>' + LVNAME[k] + '</span><span>' + (k ? LVY[k] + " m" : "ground") + "</span></button>");
    $("liftBtns").innerHTML = h.join(""); $("liftp").hidden = false; $("liftp").dataset.lift = liftIdx; syncSheet();
  }
  function rideLift(liftIdx, to) {
    $("liftp").hidden = true; syncSheet(); if (to === walk.lv) return;
    var car = CARS[liftIdx], from = walk.lv, y0 = LVY[from], y1 = LVY[to], dur = clamp(Math.abs(y1 - y0) / 11, 3.2, 9);
    RIDE = { car: car, from: from, to: to, y0: y0, y1: y1, t: 0, dur: dur };
    state.mode = "ride"; setModeButtons(); $("prompt").hidden = true;
    toast("Lift", "To " + LVNAME[to] + (to ? " · " + LVY[to] + " m" : ""));
  }
  function rideStep(dt) {
    var R = RIDE; R.t += dt; var t = Math.min(1, R.t / R.dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, y = lerp(R.y0, R.y1, e);
    R.car.g.position.y = y; camera.position.set(R.car.lift.x + 0.2, y + EYE, R.car.lift.z + 0.3); camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
    walk.lv = t < 0.5 ? R.from : R.to;
    if (t >= 1) {
      RIDE = null; var l = R.car.lift, a = Math.atan2(l.z - AC.z, l.x - AC.x), ex, ez, yaw;
      if (R.to === 0) { var ll = gLocal(l.x, l.z), side = ll.lx > 0 ? 1 : -1, p2 = gw(ll.lx + side * 2.4, ll.lz); ex = p2[0]; ez = p2[1]; yaw = Math.atan2(-(GH.x - ex), -(GH.z - ez)); }
      else { var rr3 = R.to === 5 ? 11 : 10.6; ex = AC.x + Math.cos(a) * rr3; ez = AC.z + Math.sin(a) * rr3; yaw = Math.atan2(-Math.cos(a), -Math.sin(a)); }
      cam.yaw = yaw; cam.pitch = -0.05; beginWalk(ex, ez, R.to);
      toast(R.to ? "The Deep" : "The Gatehouse", LVNAME[R.to]);
    }
  }

  /* ============================== TVs: Earth live, palace cameras, weather, sky, film ============================== */
  var TVOBJ = {}, CHANNELS = ["Earth · Pacific live", "Palace cameras", "Mars weather", "Night sky"];
  var SNAPS = [], snapCams = [[[150, 70, 140], [30, 0, 0]], [[-110, 40, -60], [0, 5, -10]], [[GH.x + 70, 28, GH.z - 70], [GH.x, 4, GH.z]]];
  function buildTVs() {
    TVS.forEach(function (tv) {
      var c = document.createElement("canvas"); c.width = 960; c.height = 540; var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
      var mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x060708 }), m = new THREE.Mesh(new THREE.PlaneGeometry(tv.w, tv.h), mat);
      m.position.set(tv.x, tv.y, tv.z); m.rotation.y = tv.ry; ZONE = tv.lv ? "deep" + tv.lv : "surface";
      var bz = new THREE.Mesh(rboxGeo(tv.w + 0.08, tv.h + 0.08, 0.06, 0.02, 1), M.black); bz.position.copy(m.position); bz.rotation.y = tv.ry; bz.translateZ(-0.035);
      put(m); put(bz);
      if (tv.id === "dome") { var st = new F(tv.x, tv.z, tv.ry); st.box("gold", 0.08, tv.y - tv.h / 2 + 0.1, 0.08, -tv.w * 0.35, 0, -0.1).box("gold", 0.08, tv.y - tv.h / 2 + 0.1, 0.08, tv.w * 0.35, 0, -0.1).box("gold", tv.w * 0.8, 0.06, 0.5, 0, 0, -0.1); }
      ZONE = "surface";
      TVOBJ[tv.id] = { def: tv, canvas: c, g: c.getContext("2d"), tex: tex, mat: mat, on: false, ch: tv.film ? -1 : 0, last: -1, lv: tv.lv };
    });
    INTER.push({ kind: "tv", tv: "dome", x: TVS[0].x * 0.35, z: TVS[0].z * 0.35, lv: 0, r: 8, label: "Watch TV" });
    var sa = 3.6 - Math.PI; INTER.push({ kind: "sit", x: Math.cos(sa) * 5.6, z: Math.sin(sa) * 5.6, lv: 0, r: 1.8, label: "Sit and watch", look: [TVS[0].x, 1.55, TVS[0].z], sitY: -0.9 + 1.1, tv: "dome" });
    for (var i = 0; i < snapCams.length; i++) { var rt = new THREE.WebGLRenderTarget(512, 288, { type: THREE.UnsignedByteType, depthBuffer: false }); rt.texture.encoding = THREE.sRGBEncoding; SNAPS.push(rt); }
  }
  var snapCam = new THREE.PerspectiveCamera(50, 16 / 9, 0.5, 30000), snapTimer = 0, snapI = 0;
  function takeSnaps(dt) { // refreshed from the real scene while you are on the surface
    if (curLv !== 0 || !Object.keys(TVOBJ).some(function (k) { return TVOBJ[k].on && TVOBJ[k].ch === 1; })) return; snapTimer -= dt; if (snapTimer > 0) return; snapTimer = 1.2;
    var sc = snapCams[snapI], rt = SNAPS[snapI]; snapI = (snapI + 1) % SNAPS.length;
    snapCam.position.fromArray(sc[0]); snapCam.lookAt(new V3().fromArray(sc[1])); snapCam.updateMatrixWorld();
    POST.snapshot(scene, snapCam, rt);
  }
  function primeSnaps() { for (var i = 0; i < SNAPS.length; i++) { var sc = snapCams[i]; snapCam.position.fromArray(sc[0]); snapCam.lookAt(new V3().fromArray(sc[1])); snapCam.updateMatrixWorld(); POST.snapshot(scene, snapCam, SNAPS[i]); } }
  function tvSet(id, on, ch) { var T = TVOBJ[id]; T.on = on; if (ch != null) T.ch = ch; T.mat.color.setScalar(on ? 1.5 : 0.02); if (!on) { T.mat.map = T.tex; T.mat.needsUpdate = true; } }
  function drawTV(T, t) {
    var g = T.g, w = 960, h = 540, ch = T.ch;
    if (ch === 1) { var s = SNAPS[Math.floor(t / 6) % SNAPS.length]; if (T.mat.map !== s.texture) { T.mat.map = s.texture; T.mat.needsUpdate = true; } return; }
    if (T.mat.map !== T.tex) { T.mat.map = T.tex; T.mat.needsUpdate = true; }
    if (ch === 0 || ch === -1) {
      var film = ch === -1, horizon = h * (film ? 0.62 : 0.55), sunX = w * (0.5 + 0.2 * Math.sin(t * 0.02)), gr = g.createLinearGradient(0, 0, 0, horizon);
      gr.addColorStop(0, film ? "#1a1640" : "#3f86d6"); gr.addColorStop(0.6, film ? "#c8604a" : "#8fc0ea"); gr.addColorStop(1, film ? "#ffc27a" : "#dbeaf5"); g.fillStyle = gr; g.fillRect(0, 0, w, horizon);
      var sg = g.createRadialGradient(sunX, horizon - 30, 5, sunX, horizon - 30, 160); sg.addColorStop(0, "rgba(255,248,220,1)"); sg.addColorStop(0.15, "rgba(255,220,160,0.8)"); sg.addColorStop(1, "rgba(255,200,140,0)"); g.fillStyle = sg; g.fillRect(0, 0, w, horizon);
      for (var cl = 0; cl < 7; cl++) { var cx = ((cl * 173 + t * (8 + cl * 3)) % (w + 300)) - 150, cy = 60 + (cl * 37) % 150; g.fillStyle = film ? "rgba(255,190,150,0.35)" : "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(cx, cy, 120 + cl * 10, 18 + cl * 2, 0, 0, Math.PI * 2); g.fill(); }
      var sea = g.createLinearGradient(0, horizon, 0, h); sea.addColorStop(0, film ? "#7a4a52" : "#2b6a9a"); sea.addColorStop(1, film ? "#1a1024" : "#0b2a44"); g.fillStyle = sea; g.fillRect(0, horizon, w, h - horizon);
      g.strokeStyle = film ? "rgba(255,200,150,0.45)" : "rgba(220,240,255,0.5)"; g.lineWidth = 1.5;
      for (var wv = 0; wv < 26; wv++) { var yy = horizon + 6 + wv * wv * 0.62; g.beginPath(); for (var x = 0; x <= w; x += 16) { var yw = yy + Math.sin(x * 0.02 + t * (1.2 + wv * 0.05) + wv) * (1 + wv * 0.25); if (x) g.lineTo(x, yw); else g.moveTo(x, yw); } g.stroke(); }
      g.fillStyle = "rgba(255,230,190,0.5)"; g.fillRect(sunX - 20, horizon + 2, 40, h - horizon);
      if (film) { g.fillStyle = "#000"; g.fillRect(0, 0, w, 58); g.fillRect(0, h - 58, w, 58); g.fillStyle = "rgba(242,235,224,0.9)"; g.font = "italic 26px Georgia, serif"; g.textAlign = "center"; var lines = ["Home is a small blue point in the evening sky.", "From here, every sea on Earth fits behind your thumb.", "We came a long way to see it like this."]; g.fillText(lines[Math.floor(t / 7) % lines.length], w / 2, h - 22); g.textAlign = "left"; }
      else { g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(24, 24, 360, 46); g.fillStyle = "#fff"; g.font = "600 22px monospace"; g.fillText("EARTH · PACIFIC · LIVE", 38, 54); g.fillStyle = "#ff4a3a"; g.beginPath(); g.arc(w - 60, 48, 8, 0, 6.28); g.fill(); g.fillStyle = "#fff"; g.fillText("12 min delay", w - 230, 56); }
    } else if (ch === 2) {
      g.fillStyle = "#0a0d14"; g.fillRect(0, 0, w, h); g.fillStyle = "#d9b46b"; g.font = "600 30px monospace"; g.fillText("MARS WEATHER · ARCADIA PLANITIA", 40, 70);
      g.fillStyle = "#e8e2d8"; g.font = "26px monospace"; var T0 = outsideTemp();
      [["Local time", fmtClock(state.t)], ["Outside", fmtTemp(T0)], ["Pressure", (0.82 + 0.03 * Math.sin(state.t)).toFixed(2) + " kPa"], ["Wind", (4 + state.storm * 20 + 2 * Math.sin(t * 0.3)).toFixed(0) + " m/s"], ["Dust (tau)", (0.35 + state.storm * 1.3).toFixed(2)], ["Sunset", fmtClock(SUNSET_T)]].forEach(function (r2, i) { g.fillText(r2[0], 40, 140 + i * 50); g.fillText(r2[1], 330, 140 + i * 50); });
      g.strokeStyle = "#39d0ff"; g.lineWidth = 3; g.beginPath(); for (var k = 0; k <= 60; k++) { var tt = k / 60 * SOL_H, v = -52 + 30 * Math.cos((tt - 14.5) / SOL_H * 2 * Math.PI), px = 560 + k * 6, py = 380 - (v + 90) * 3.2; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke();
      g.fillStyle = "#ffb23a"; g.beginPath(); g.arc(560 + state.t / SOL_H * 360, 380 - (T0 + 90) * 3.2, 7, 0, 6.28); g.fill();
      g.fillStyle = state.storm > 0.5 ? "#ff7a4a" : "#6dff9c"; g.fillText(state.storm > 0.5 ? "DUST STORM: stay below ground" : "Clear · good for a walk outside", 40, 470);
    } else {
      g.fillStyle = "#03040a"; g.fillRect(0, 0, w, h); var r = mulberry(12);
      for (var sN = 0; sN < 420; sN++) { var a = r() * 6.28 + t * 0.01, d = r() * 700, x2 = w / 2 + Math.cos(a) * d, y2 = h / 2 + Math.sin(a) * d * 0.6, b = r(); g.fillStyle = "rgba(255,255,255," + (0.3 + b * 0.7) + ")"; g.fillRect(x2, y2, b > 0.9 ? 2 : 1, b > 0.9 ? 2 : 1); }
      g.fillStyle = "#8fc6ff"; g.beginPath(); g.arc(w * 0.62, h * 0.42, 5, 0, 6.28); g.fill(); g.fillStyle = "#ddd"; g.beginPath(); g.arc(w * 0.62 + 11, h * 0.42 - 4, 2, 0, 6.28); g.fill();
      g.fillStyle = "#e8e2d8"; g.font = "22px monospace"; g.fillText("Earth and the Moon", w * 0.62 + 18, h * 0.42 + 8); g.fillText("NIGHT SKY OVER THE PALACE", 40, 60);
    }
    T.tex.needsUpdate = true;
  }
  function tvStep(t) {
    Object.keys(TVOBJ).forEach(function (id) {
      var T = TVOBJ[id]; if (!T.on || T.lv !== curLv) return;
      var d = camera.position.distanceTo(new V3(T.def.x, T.def.y, T.def.z)); if (d > 60) return;
      var fr = Math.floor(t * 20); if (fr === T.last) return; T.last = fr; drawTV(T, t);
    });
  }

  /* ============================== books ============================== */
  var READS = [
    { t: "The War of the Worlds", a: "H. G. Wells, 1898", pages: ["No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own; that as men busied themselves about their various concerns they were scrutinised and studied, perhaps almost as narrowly as a man with a microscope might scrutinise the transient creatures that swarm and multiply in a drop of water.", "The house copy is a facsimile printed in the Deep. The first page is enough to see why it is kept on the shelf nearest the door: a story about Mars, read on Mars."] },
    { t: "A Field Guide to Arcadia", a: "The house library", pages: ["Arcadia Planitia is a smooth lowland plain in the northern hemisphere of Mars. Radar from orbit shows ice a few metres below the surface over much of it, which is why the palace was built here: water can be mined straight from the ground.", "The mesa the palace stands on drops to a canyon on its western side. Late in the day the sun sets over it, and because fine dust scatters blue light forwards, the sky round the setting sun turns blue while the rest of the sky stays butterscotch.", "Look for Phobos after dark. It rises in the west, crosses the sky in about four hours and sets in the east, twice a sol. Deimos is smaller and slower, a bright star that barely seems to move."] },
    { t: "The House Book", a: "How the palace works", pages: ["Air. The house keeps 70 kPa of air, a little less than a mountain town on Earth, with more oxygen than Mars's outside air could ever give. Oxygen comes from water split in the Engine level and from carbon dioxide taken from outside.", "Water. Ice is mined under the palace, melted and cleaned. Almost every litre is recycled: showers, pools and the lagoon all return to the works on L4.", "Power. A compact fusion plant 88 m down gives the house its power; the solar field above the ground is kept as a back-up for the surface. Waste heat warms the baths, the pools and the forest.", "Weather. When a dust storm comes, the surface rooms close their shutters and life moves down into the Deep. The stores on L5 hold two years of everything."] },
    { t: "Letters Home", a: "Sol 1 to Sol 30", pages: ["Sol 1. The ship came down on its engines and the whole terminal shook. Then a quiet little air taxi, the mesa, and the dome glowing like a lamp. The door knew me before I reached it.", "Sol 9. I swam in the lagoon today under a painted blue sky, then went up in the lift and watched a real Martian sunset from the loggia: blue round the sun, gold everywhere else. Two skies in one day.", "Sol 30. It rained in the forest room this morning. The drops fall slowly here, fat and soft. I stood in it for an hour and thought of all of you."] },
    { t: "Mars in Numbers", a: "Reference", pages: ["Gravity 3.71 m/s², 38 % of Earth's. A sol lasts 24 h 39 min 35 s. A year lasts 687 Earth days.", "Air pressure at this site about 0.8 kPa, 95 % carbon dioxide. Average surface temperature about −60 °C. Sunlight about 43 % as strong as on Earth.", "A radio message takes between about 3 and 22 minutes to reach Earth, depending on where the two planets are in their orbits."] }
  ];
  var READ = { b: -1, p: 0 };
  function openReader() { READ.b = -1; renderReader(); $("reader").hidden = false; syncSheet(); }
  function renderReader() {
    var el = $("readerBody");
    if (READ.b < 0) { el.innerHTML = '<h2>Choose a book</h2><div class="books">' + READS.map(function (b, i) { return '<button type="button" class="book" data-b="' + i + '"><span class="bt">' + b.t + '</span><span class="ba">' + b.a + "</span></button>"; }).join("") + "</div>"; return; }
    var b = READS[READ.b]; el.innerHTML = '<div class="bhead"><span class="bt">' + b.t + '</span><span class="ba">' + b.a + '</span></div><p class="page">' + b.pages[READ.p] + '</p><div class="bfoot"><button type="button" class="navbtn" data-nav="back">' + (READ.p ? "Previous page" : "All books") + '</button><span class="count">' + (READ.p + 1) + " / " + b.pages.length + '</span><button type="button" class="navbtn primary" data-nav="next"' + (READ.p + 1 >= b.pages.length ? " disabled" : "") + ">Next page</button></div>";
  }

  /* ============================== interactions while walking ============================== */
  var near = null;
  function interStep() {
    near = null; if (state.mode !== "walk" || state.sit) { if (!state.sit) $("prompt").hidden = true; return; }
    var best = 1e9;
    INTER.forEach(function (it) { if (it.lv !== walk.lv) return; var d = Math.hypot(walk.x - it.x, walk.z - it.z); if (d < it.r && d < best) { best = d; near = it; } });
    if (!$("liftp").hidden && (!near || near.kind !== "lift")) { $("liftp").hidden = true; syncSheet(); }
    if (!near) { $("prompt").hidden = true; return; }
    var lab = near.label; if (near.kind === "tv") { var T = TVOBJ[near.tv]; lab = T.on ? "Channel: " + CHANNELS[T.ch] + " · next" : "Watch TV"; }
    if (near.kind === "rain") lab = DEEPDYN.raining ? "Stop the rain" : "Stand in the rain";
    $("promptText").textContent = lab; $("prompt").hidden = false;
  }
  function interact() {
    if (state.sit) { standUp(); return; }
    if (!near) return; var it = near;
    if (it.kind === "tv") { var T = TVOBJ[it.tv]; if (!T.on) tvSet(it.tv, true, T.ch < 0 ? 0 : T.ch); else tvSet(it.tv, true, (T.ch + 1) % CHANNELS.length); toast("TV", CHANNELS[TVOBJ[it.tv].ch]); }
    else if (it.kind === "sit") sitDown(it);
    else if (it.kind === "books") openReader();
    else if (it.kind === "piano") { playPiano(); toast("Music room", "Gymnopédie, slowly"); }
    else if (it.kind === "lift") openLiftPanel(it.lift);
    else if (it.kind === "rain") { DEEPDYN.raining = !DEEPDYN.raining; }
    else if (it.kind === "maglev") { fadeTo(function () { endWalk(); goStop(STOP.spaceport.i, true); toast("Maglev · 38 s", "Arcadia Spaceport"); }); }
  }
  function sitDown(it) {
    state.sit = { it: it, px: walk.x, pz: walk.z, py: camera.position.y };
    var p = new V3(it.x, it.sitY, it.z), look = new V3().fromArray(it.look); flyTo(p, look, "stand");
    if (it.tv) { var T = TVOBJ[it.tv]; if (!T.on) tvSet(it.tv, true, T.ch); }
    $("promptText").textContent = "Stand up"; $("prompt").hidden = false; hint(TOUCH ? "Tap Stand up to get up" : "Press <kbd>E</kbd> or a move key to stand up", 4000);
  }
  function standUp() { var s = state.sit; state.sit = null; if (!s) return; tween = null; camera.position.set(s.px, walk.y + EYE, s.pz); cam.pitch = 0; }
