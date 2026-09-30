
  /* ============================== merging and contact shadows ============================== */
  function buildBuckets() {
    Object.keys(BUCKETS).forEach(function (key) {
      var parts = key.split("|"), mat = M[parts[0]], layer = parts[1], zone = parts[2], ns = parts[3] === "ns";
      if (!mat) { console.warn("Missing material: " + parts[0] + " in " + key + " n=" + BUCKETS[key].length + " v0=" + BUCKETS[key][0].attributes.position.count); mat = M.shell; }
      var glowing = mat.emissive && mat.color && mat.color.getHex() === 0;
      var meshes = mergeInto(BUCKETS[key], mat, layer, !(ns || mat.transparent || glowing || mat === M.rockWall), !mat.transparent, zoneGroup(zone)[layer === "roof" ? "roof" : "base"]);
      if (mat.alphaTest) meshes.forEach(function (m) { m.customDepthMaterial = depthFor(mat); });
      delete BUCKETS[key];
    });
  }
  function buildBlobs() {
    var tex = canvasTex(128, 128, function (g, w, h) { var img = g.createImageData(w, h); for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var dx = Math.max(Math.abs(x / w - 0.5) * 2 - 0.55, 0) / 0.45, dz = Math.max(Math.abs(y / h - 0.5) * 2 - 0.55, 0) / 0.45, d = Math.min(1, Math.hypot(dx, dz)), a = Math.pow(1 - d, 1.8), k = (y * w + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 0; img.data[k + 3] = a * 255; } g.putImageData(img, 0, 0); }, false);
    var byZone = {}; BLOBS.forEach(function (b) { (byZone[b[7]] || (byZone[b[7]] = [])).push(b); });
    var pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    Object.keys(byZone).forEach(function (z) {
      var list = byZone[z], mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), im = new THREE.InstancedMesh(pg, mat, list.length), o = new THREE.Object3D();
      list.forEach(function (b, i) { o.position.set(b[0], b[6] + 0.014, b[1]); o.rotation.set(0, b[4], 0); o.scale.set(b[2], 1, b[3]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.renderOrder = 1; zoneGroup(z).extra.add(im);
    });
  }

  /* ============================== camera flights and fades ============================== */
  function isInterior(p) { var r = roomAt(p.x, p.z, 0); return !!r && p.y < 9 && !GLASS[r.id]; }
  function flyTo(pos, look, mode, onDone) {
    var p0 = camera.position.clone(), q0 = camera.quaternion.clone(), q1 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, look, UP));
    var d = p0.distanceTo(pos), dur = REDUCE ? 0.01 : clamp(1.0 + d / 90, 1.2, 4.2), arc = d < 8 ? 0 : clamp(d * 0.3, 4, 90);
    var hide = d > 10 && (isInterior(p0) || isInterior(pos) || p0.y < 8 || pos.y < 8);
    tween = { p0: p0, p1: pos.clone(), q0: q0, q1: q1, look: look.clone(), start: performance.now(), dur: dur, arc: arc, hide: hide, mode: mode, done: onDone };
  }
  function stepTween() {
    var tw = tween, t = Math.min((performance.now() - tw.start) / 1000 / tw.dur, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(tw.p0, tw.p1, e); camera.position.y += tw.arc * Math.sin(Math.PI * e);
    camera.quaternion.slerpQuaternions(tw.q0, tw.q1, Math.min(1, e * 1.15));
    setRoofVisible(!state.cut && !(tw.hide && t > 0.04 && t < 0.96));
    if (t >= 1) {
      tween = null; setAngles(tw.p1, tw.look);
      if (tw.mode === "orbit") { cam.target.copy(tw.look); cam.dist = tw.p1.distanceTo(tw.look); }
      camera.position.copy(tw.p1); setRoofVisible(!state.cut);
      if (tw.done) tw.done();
    }
  }
  function setRoofVisible(v) { var rg = ZG.surface.roof; if (rg.visible !== v) { rg.visible = v; shadowDirty = true; } }
  var fading = false;
  function fadeTo(fn) {
    if (fading) return; fading = true; var t0 = performance.now();
    (function out() { var k = Math.min(1, (performance.now() - t0) / 350); POST.u.uFade.value = k; if (k < 1) requestAnimationFrame(out); else { fn(); var t1 = performance.now(); (function inn() { var k2 = Math.min(1, (performance.now() - t1) / 500); POST.u.uFade.value = 1 - k2; if (k2 < 1) requestAnimationFrame(inn); else fading = false; })(); } })();
  }

  /* ============================== tour stops ============================== */
  function fmtArea(a) { return Math.round(a).toLocaleString("en-GB") + " m²"; }
  function goStop(i, instant) {
    i = (i + STOPS.length) % STOPS.length; var s = STOPS[i];
    if (J) finishJourneyQuiet();
    if (state.sit) state.sit = null;
    if (state.mode === "walk" || state.mode === "ride") endWalk();
    state.stop = i;
    if ((s.mode === "stand" || (s.lv || 0) > 0) && state.cut) setCut(false, true);
    var pos = new V3().fromArray(s.pos), look = new V3().fromArray(s.look), lvNow = levelAt(camera.position), far2 = camera.position.distanceTo(pos) > 900;
    function place() { tween = null; state.mode = s.mode; camera.position.copy(pos); setAngles(pos, look); if (s.mode === "orbit") { cam.target.copy(look); cam.dist = pos.distanceTo(look); } applyCam(); setRoofVisible(!state.cut); setModeButtons(); }
    if (camera.userData.zoomed) { camera.userData.zoomed = false; resize(); }
    if (instant) place();
    else if ((s.lv || 0) !== lvNow || (s.lv || 0) > 0 && (lvNow > 0) && camera.position.distanceTo(pos) > 60 || far2) fadeTo(function () { place(); toast(s.group, s.name); });
    else { state.mode = s.mode; flyTo(pos, look, s.mode, function () { toast(s.group, s.name); }); }
    renderInfo(s); markRooms(); setModeButtons(); $("nowTitle").textContent = s.name;
    if (!instant) hint(s.mode === "orbit" ? HINTS.orbit : HINTS.stand);
    shadowDirty = true;
  }
  function finishJourneyQuiet() { J = null; $("caption").hidden = true; $("skipBtn").hidden = true; setCine(false); VEH.rocket.position.y = PY; VEH.rocket.userData.plume.material.uniforms.uK.value = 0; VEH.rocket.userData.light.intensity = 0; if (TAXI.st === "journey") { TAXI.st = "idle"; VEH.taxi.position.set(TAXIPAD[0], PY, TAXIPAD[1]); VEH.taxi.rotation.set(0, -Math.PI / 2, 0); TAXI.rotor = 0; TAXI.door = 0; } }
  function renderInfo(s) {
    $("infoWhere").textContent = s.where; $("infoTitle").textContent = s.name;
    var st = [[fmtArea(s.areaVal), s.area === "total" ? "Above ground" : s.area === "deep" ? "Below ground" : "Floor"], [s.ceil, "Ceiling"], [s.shield, "Shielding"]];
    $("infoStats").innerHTML = st.map(function (x) { return '<div class="stat"><span class="v">' + x[0] + '</span><span class="l">' + x[1] + "</span></div>"; }).join("");
    $("infoText").textContent = s.text;
    $("infoDetails").innerHTML = s.details.map(function (d) { return "<li>" + d + "</li>"; }).join("");
    $("infoMars").innerHTML = s.mars.map(function (d) { return "<li>" + d + "</li>"; }).join("");
    $("infoCount").textContent = (s.i + 1) + " / " + STOPS.length; $("infoScroll").scrollTop = 0;
  }
  function buildRooms() {
    var html = [], last = null;
    STOPS.forEach(function (s, i) { if (s.group !== last) { html.push("<h2>" + s.group + "</h2>"); last = s.group; } html.push('<button type="button" class="room-btn" data-i="' + i + '"><span>' + s.name + "</span><span>" + fmtArea(s.areaVal) + "</span></button>"); });
    $("rooms").innerHTML = html.join("");
    $("rooms").addEventListener("click", function (e) { var b = e.target.closest(".room-btn"); if (!b) return; goStop(+b.getAttribute("data-i")); if (narrow()) { showRooms(false); showInfo(true); } });
  }
  function markRooms() {
    Array.prototype.forEach.call(document.querySelectorAll(".room-btn"), function (b) {
      var on = +b.getAttribute("data-i") === state.stop; if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      if (on && !narrow()) { var nav = $("rooms"); if (b.offsetTop < nav.scrollTop || b.offsetTop > nav.scrollTop + nav.clientHeight - 40) nav.scrollTop = b.offsetTop - 60; }
    });
  }
  function showRooms(v) { $("rooms").hidden = !v; $("roomsBtn").setAttribute("aria-pressed", v ? "true" : "false"); if (v && narrow()) $("info").hidden = true; syncSheet(); }
  function showInfo(v) { $("info").hidden = !v; if (v && narrow()) $("rooms").hidden = true; syncSheet(); }
  function syncSheet() {
    var open = narrow() && (!$("rooms").hidden || !$("info").hidden || !$("plan").hidden || !$("about").hidden || !$("reader").hidden || !$("liftp").hidden);
    document.body.classList.toggle("sheet-open", open);
    if (narrow()) $("roomsBtn").setAttribute("aria-pressed", $("rooms").hidden ? "false" : "true");
  }
  function layoutPanels() { if (document.body.classList.contains("cine")) return; if (narrow()) { $("rooms").hidden = true; $("info").hidden = true; } else { $("rooms").hidden = false; $("info").hidden = false; } syncSheet(); }

  /* ============================== messages ============================== */
  var HINTS = TOUCH ? { stand: "Drag to look around · tap Walk to walk from here", orbit: "Drag to circle · pinch to zoom", walk: "Push the stick to walk · JUMP to bound in 0.38 g", cut: "Roofs lifted · tap a label to go into a room" }
    : { stand: "Drag to look around · <kbd>←</kbd> <kbd>→</kbd> places · <kbd>W</kbd> walk from here", orbit: "Drag to circle · scroll to zoom · <kbd>→</kbd> next place", walk: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk · <kbd>Shift</kbd> bound · <kbd>Space</kbd> jump · <kbd>E</kbd> use · <kbd>Esc</kbd> stop", cut: "Roofs lifted · click a label to go into a room" };
  var hintTimer = 0, toastTimer = 0;
  function hint(html, ms) { var el = $("hint"); el.innerHTML = html; el.classList.remove("fade"); clearTimeout(hintTimer); hintTimer = setTimeout(function () { el.classList.add("fade"); }, ms || 5500); }
  function toast(a, b) { $("toast1").textContent = a; $("toast2").textContent = b; var el = $("toast"); el.classList.remove("hide"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.add("hide"); }, 2400); }
  function setModeButtons() {
    document.body.classList.toggle("walking", state.mode === "walk" || state.mode === "ride");
    $("journeyBtn").setAttribute("aria-pressed", state.mode === "journey" ? "true" : "false");
    $("tourBtn").setAttribute("aria-pressed", state.mode === "orbit" || state.mode === "stand" ? "true" : "false");
    $("walkBtn").setAttribute("aria-pressed", state.mode === "walk" || state.mode === "ride" ? "true" : "false");
    $("cutBtn").setAttribute("aria-pressed", state.cut ? "true" : "false"); $("planBtn").setAttribute("aria-pressed", state.plan ? "true" : "false"); $("soundBtn").setAttribute("aria-pressed", state.sound ? "true" : "false");
  }
  function levelChip(lv) { $("lvlChip").textContent = lv ? "L" + lv + " · " + LVNAME[lv] + " · " + LVY[lv] + " m" : "Ground level"; }

  /* ============================== walking ============================== */
  var WALK_START = { arrival: [0, 18.5, 0, 0, 0], dome: [0, 18.5, 0, 0, 0], observatory: [-46, -21.6, -46, -30, 0], pad: [316, 10, 330, 0, 0], power: [150, -40, 100, -150, 0], hangar: [138, 10.5, 150, 10.5, 0],
    spaceport: null, fusion: [30, 36, 50, 70, 4], atrium: null, atriumfloor: null };
  function walkStart(s) {
    if (s.id === "spaceport") { var tp = [TAXIPAD[0] + 20, TAXIPAD[1] - 20]; return [tp[0], tp[1], PORT.x, PORT.z - 100, 0]; }
    if (WALK_START[s.id]) return WALK_START[s.id];
    var lv = s.lv || 0, fy = lv ? LVY[lv] : 0;
    if (s.pos[1] - fy < 3.6 && canStand(s.pos[0], s.pos[2], lv)) return [s.pos[0], s.pos[2], s.look[0], s.look[2], lv];
    var r = ROOMS.filter(function (q) { return q.stop === s.id && (q.lv || 0) === lv; })[0]; if (r) { var c = centroid(r); if (canStand(c[0], c[1], lv)) return [c[0], c[1], s.look[0], s.look[2], lv]; }
    return WALK_START.dome;
  }
  function startWalk(here) {
    if (state.mode === "walk" || state.mode === "walking-in" || state.mode === "journey") return;
    closeDialogs(); if (state.cut) setCut(false, true);
    var p = camera.position, lv = levelAt(p);
    if (!tween && here !== false && state.mode === "stand" && canStand(p.x, p.z, lv) && p.y < groundY(p.x, p.z, lv) + 3.6) { beginWalk(p.x, p.z, lv); return; }
    var w = walkStart(STOPS[state.stop]), wl = w[4] || 0, pos = new V3(w[0], groundY(w[0], w[1], wl) + EYE, w[1]), look = new V3(w[2], pos.y - 0.2, w[3]);
    if (wl !== lv || p.distanceTo(pos) > 400) { fadeTo(function () { camera.position.copy(pos); setAngles(pos, look); beginWalk(w[0], w[1], wl); }); return; }
    state.mode = "walking-in"; setModeButtons(); flyTo(pos, look, "stand", function () { beginWalk(w[0], w[1], wl); });
  }
  function beginWalk(x, z, lv) {
    $("liftp").hidden = true; state.sit = null; state.mode = "walk"; lv = lv || 0; walk.lv = lv;
    walk.x = x; walk.z = z; walk.y = groundY(x, z, lv); walk.vy = 0; walk.onGround = true; walk.room = null;
    walk.outside = !lv && !insideAt(x, z, 0); $("suitline").classList.toggle("out", walk.outside); $("suitline").hidden = false;
    if (walk.outside) $("nowTitle").textContent = "Outside, on the mesa";
    if (TOUCH) { $("joy").hidden = false; $("jumpBtn").hidden = false; }
    if (narrow()) { $("info").hidden = true; $("rooms").hidden = true; syncSheet(); }
    camera.position.set(x, walk.y + EYE, z); setModeButtons(); levelChip(lv); hint(HINTS.walk, 7000);
  }
  function endWalk() {
    if (state.mode === "walk" || state.mode === "ride" || state.mode === "walking-in") state.mode = "stand";
    RIDE = null; state.sit = null; keys = {}; joy.x = joy.y = 0;
    $("joy").hidden = true; $("jumpBtn").hidden = true; $("suitline").hidden = true; $("prompt").hidden = true; $("joyKnob").style.transform = "";
    setModeButtons();
  }
  function jump() { if (state.mode === "walk" && walk.onGround && !state.sit) { walk.vy = 3.0; walk.onGround = false; } }
  function stepWalk(dt) {
    var f = 0, r = 0;
    if (keys.w || keys.arrowup) f += 1; if (keys.s || keys.arrowdown) f -= 1; if (keys.d || keys.arrowright) r += 1; if (keys.a || keys.arrowleft) r -= 1;
    f -= joy.y; r += joy.x;
    var mag = Math.hypot(f, r); if (mag > 1) { f /= mag; r /= mag; mag = 1; }
    var speed = keys.shift || (mag > 0.97 && TOUCH && joy.run) ? 4.2 : 1.9, sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw), lv = walk.lv;
    var dx = (-sy * f + cy * r) * speed * dt, dz = (-cy * f - sy * r) * speed * dt;
    if (dx && canStand(walk.x + dx, walk.z, lv)) walk.x += dx; if (dz && canStand(walk.x, walk.z + dz, lv)) walk.z += dz;
    var g = groundY(walk.x, walk.z, lv);
    if (walk.onGround) { walk.y += (g - walk.y) * Math.min(1, dt * 10); if (mag > 0.05 && !REDUCE) walk.bob += dt * speed * 3.2; }
    else { walk.vy -= G_MARS * dt; walk.y += walk.vy * dt; if (walk.y <= g) { walk.y = g; walk.vy = 0; walk.onGround = true; } }
    camera.position.set(walk.x, walk.y + EYE + Math.sin(walk.bob) * 0.025, walk.z); camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
    var room = insideAt(walk.x, walk.z, lv), out = !lv && !room;
    if (room && room.name && room !== walk.room) { walk.room = room; $("nowTitle").textContent = room.name; var rs = room.stop && STOP[room.stop]; if (rs && rs.i !== state.stop) { state.stop = rs.i; renderInfo(rs); markRooms(); } }
    if (out !== walk.outside) { walk.outside = out; $("suitline").classList.toggle("out", out); if (out) { $("nowTitle").textContent = "Outside, on the mesa"; walk.room = null; toast("Suit on", "Outside on Mars"); } else toast("Inside", "Back in the palace"); }
    if (!$("suitline").classList.contains("cyc")) $("suitline").innerHTML = out ? "<b>SUIT ON</b> · outside " + fmtTemp(outsideTemp()) + " · 0.8 kPa · 0.38 g" : "<b>INSIDE</b> · 21 °C · 70 kPa · " + (lv ? LVY[lv] + " m" : "0.38 g");
  }

  /* ============================== cutaway, labels, plan, about ============================== */
  function setCut(on, silent) {
    state.cut = on; setRoofVisible(!on); setModeButtons(); LABELS.forEach(function (l) { l.el.hidden = !on; });
    if (silent) return;
    if (on) { if (state.mode === "walk" || state.mode === "ride") endWalk(); var go = function () { state.mode = "orbit"; setModeButtons(); flyTo(new V3(110, 165, 140), new V3(34, 0, -8), "orbit"); hint(HINTS.cut); $("nowTitle").textContent = "Cutaway"; }; if (levelAt(camera.position) !== 0) fadeTo(function () { camera.position.set(110, 165, 140); setAngles(camera.position, new V3(34, 0, -8)); go(); }); else go(); }
    else goStop(state.stop);
  }
  var LABELS = [];
  function buildLabels() {
    STOPS.forEach(function (s) {
      if (s.mode !== "stand" || (s.lv || 0) !== 0) return;
      var ids = s.rooms || [s.room], best = null; ROOMS.forEach(function (r) { if (ids.indexOf(r.id) >= 0 && (!best || areaOf(r) > areaOf(best))) best = r; });
      if (!best) return;
      var c = s.id === "garden" ? [14, -13] : s.id === "observatory" ? [-46, -26] : s.id === "portal" ? [PADW[0], PADW[1]] : centroid(best);
      var el = document.createElement("button"); el.type = "button"; el.className = "label"; el.hidden = true; el.innerHTML = s.name + "<small>" + fmtArea(s.areaVal) + "</small>";
      el.addEventListener("click", function () { goStop(s.i); }); document.body.appendChild(el);
      LABELS.push({ el: el, p: new V3(c[0], s.id === "observatory" ? 30 : 7.5, c[1]) });
    });
  }
  var _v = new V3();
  function updateLabels() { var w = window.innerWidth, h = window.innerHeight; LABELS.forEach(function (l) { _v.copy(l.p).project(camera); var vis = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1; l.el.style.visibility = vis ? "visible" : "hidden"; if (vis) l.el.style.transform = "translate(" + ((_v.x * 0.5 + 0.5) * w).toFixed(1) + "px," + ((-_v.y * 0.5 + 0.5) * h).toFixed(1) + "px) translate(-50%,-100%)"; }); }
  var youDot = null;
  function shapeSVG(s, attrs) {
    if (s[0] === "c") return '<circle cx="' + s[1] + '" cy="' + s[2] + '" r="' + s[3] + '"' + attrs + "/>";
    if (s[0] === "e") return '<ellipse cx="' + s[1] + '" cy="' + s[2] + '" rx="' + s[3] + '" ry="' + s[4] + '"' + attrs + "/>";
    if (s[0] === "a") return '<path fill-rule="evenodd" d="M' + (s[1] + s[4]) + " " + s[2] + " a" + s[4] + " " + s[4] + " 0 1 0 " + (-2 * s[4]) + " 0 a" + s[4] + " " + s[4] + " 0 1 0 " + (2 * s[4]) + " 0 M" + (s[1] + s[3]) + " " + s[2] + " a" + s[3] + " " + s[3] + " 0 1 0 " + (-2 * s[3]) + " 0 a" + s[3] + " " + s[3] + " 0 1 0 " + (2 * s[3]) + ' 0"' + attrs + "/>";
    if (s[0] === "o") { var c = Math.cos(s[5]), sn = Math.sin(s[5]), pts = [[s[3], s[4]], [s[3], -s[4]], [-s[3], -s[4]], [-s[3], s[4]]].map(function (q) { return (s[1] + q[0] * c - q[1] * sn).toFixed(2) + "," + (s[2] + q[0] * sn + q[1] * c).toFixed(2); }); return '<polygon points="' + pts.join(" ") + '"' + attrs + "/>"; }
    return '<rect x="' + s[1] + '" y="' + s[3] + '" width="' + (s[2] - s[1]) + '" height="' + (s[4] - s[3]) + '"' + attrs + "/>";
  }
  function bboxOf(list) { var b = [1e9, -1e9, 1e9, -1e9]; list.forEach(function (r) { var s = r.s, x0, x1, z0, z1; if (s[0] === "r") { x0 = s[1]; x1 = s[2]; z0 = s[3]; z1 = s[4]; } else { var R = s[0] === "c" ? s[3] : s[0] === "a" ? s[4] : s[0] === "e" ? Math.max(s[3], s[4]) : Math.hypot(s[3], s[4]); x0 = s[1] - R; x1 = s[1] + R; z0 = s[2] - R; z1 = s[2] + R; } b[0] = Math.min(b[0], x0); b[1] = Math.max(b[1], x1); b[2] = Math.min(b[2], z0); b[3] = Math.max(b[3], z1); }); return b; }
  function buildPlan(lv) {
    state.planLv = lv; var list = RBL[lv], b = bboxOf(list), pad = 10, vb = [b[0] - pad, b[2] - pad, b[1] - b[0] + 2 * pad, b[3] - b[2] + 2 * pad], sc = Math.max(vb[2], vb[3]) / 220;
    var o = ['<svg viewBox="' + vb.join(" ") + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plan of ' + LVNAME[lv] + '" style="--k:' + sc.toFixed(2) + '">'];
    list.forEach(function (r) { var cls = "rm" + (r.kind === "link" ? " link" : GLASS[r.id] || r.id === "grotto" || r.id === "forest" ? " glass" : ""), st = r.stop && STOP[r.stop] ? STOP[r.stop].i : -1; o.push(shapeSVG(r.s, ' class="' + cls + '"' + (st >= 0 ? ' data-i="' + st + '"' : "") + "")); });
    if (lv === 0) o.push('<rect class="rm water" x="-3" y="37" width="6" height="26"/><circle class="rm water" cx="11.3" cy="11.3" r="3"/><circle class="rm water" cx="0" cy="0" r="7"/>');
    if (lv === 2) o.push('<ellipse class="rm water" cx="' + GRO.lake.x + '" cy="' + GRO.lake.z + '" rx="' + GRO.lake.rx + '" ry="' + GRO.lake.rz + '"/>');
    var seen = {};
    list.forEach(function (r) { if (!r.name || r.kind === "link" || seen[r.name]) return; seen[r.name] = 1; var c = r.id === "dome" ? [0, -13] : r.id === "tower" ? [-46, -23] : centroid(r); o.push('<text x="' + c[0] + '" y="' + c[1] + '" text-anchor="middle" style="font-size:' + (2.6 * sc).toFixed(2) + 'px">' + r.name + "</text>"); o.push('<text class="a" x="' + c[0] + '" y="' + (c[1] + 3 * sc) + '" text-anchor="middle" style="font-size:' + (1.9 * sc).toFixed(2) + 'px">' + fmtArea(areaOf(r)) + "</text>"); });
    o.push('<circle class="you" id="youDot" r="' + (1.8 * sc).toFixed(2) + '" cx="0" cy="0"/></svg>');
    $("planSvg").innerHTML = o.join(""); youDot = $("youDot");
    $("planTitle").textContent = lv ? "L" + lv + " · " + LVNAME[lv] : "Ground floor";
    var la = list.reduce(function (a, r) { return a + areaOf(r); }, 0);
    $("planSub").textContent = (lv ? LVY[lv] + " m · " : "") + "≈ " + fmtArea(la) + " on this level · the Deep ≈ " + fmtArea(DEEP_AREA) + " · north is up";
    Array.prototype.forEach.call(document.querySelectorAll(".ptab"), function (t) { t.setAttribute("aria-selected", +t.getAttribute("data-lv") === lv ? "true" : "false"); });
  }
  function setPlan(v) { state.plan = v; $("plan").hidden = !v; setModeButtons(); if (v) { setAbout(false); buildPlan(state.mode === "walk" ? walk.lv : levelAt(camera.position)); $("planClose").focus(); } syncSheet(); }
  function setAbout(v) { state.about = v; $("about").hidden = !v; $("aboutBtn").setAttribute("aria-expanded", v ? "true" : "false"); if (v) { if (state.plan) setPlan(false); $("aboutClose").focus(); } syncSheet(); }
  function closeDialogs() { if (state.plan) setPlan(false); if (state.about) setAbout(false); $("reader").hidden = true; $("liftp").hidden = true; syncSheet(); }

  /* ============================== moving things ============================== */
  var poolTick = 0, _io = new THREE.Object3D();
  function animate(dt) {
    var t = elapsed, cp = camera.position;
    if (dyn.hearth) dyn.hearth.uniforms.uT.value = t; if (dyn.mobile) dyn.mobile.rotation.y += dt * 0.035; if (dyn.centrifuge) dyn.centrifuge.rotation.y += dt * 2.09; if (dyn.globe) dyn.globe.rotation.y += dt * 0.12;
    if (M.waterBlue.userData.t) M.waterBlue.userData.t.value = t;
    SKYCEIL.forEach(function (m) { m.uniforms.uT.value = t; });
    if (curLv === 0) {
      var fo = dyn.fountain;
      if (fo && Math.hypot(cp.x - fo.cx, cp.z - fo.cz) < 90) {
        for (var i = 0; i < fo.n; i++) { var s0 = fo.seeds[i * 3], s1 = fo.seeds[i * 3 + 1], s2 = fo.seeds[i * 3 + 2], tall = s2 < 0.16, vv = tall ? 3.6 : 2.2, vh = tall ? 0.12 : 1.64, T = tall ? 2.13 : 1.465, a = tall ? s0 : Math.floor(s0 / (2 * Math.PI) * 12) / 12 * 2 * Math.PI + (s2 - 0.58) * 0.05, tau = (t + s1 * T) % T; fo.pos[i * 3] = fo.cx + Math.cos(a) * vh * tau; fo.pos[i * 3 + 1] = 1.28 + vv * tau - 0.5 * G_MARS * tau * tau; fo.pos[i * 3 + 2] = fo.cz + Math.sin(a) * vh * tau; }
        fo.pts.geometry.attributes.position.needsUpdate = true;
      }
      if (dyn.pool && Math.hypot(cp.x, cp.z - 50) < 60 && (poolTick = (poolTick + 1) % 2) === 0) { var g = dyn.pool.geometry, pa = g.attributes.position.array, b = dyn.poolBase; for (var j = 0; j < pa.length; j += 3) { var x = b[j], z = b[j + 2]; pa[j + 1] = 0.035 * Math.sin(z * 2.094 - t * 2.79) + 0.012 * Math.sin(x * 3.1 + z * 0.8 - t * 3.4); } g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }
    } else {
      var R = DEEPDYN.rain; if (R && Math.hypot(cp.x - AC.x, cp.z - AC.z) < 60) { R.seeds.forEach(function (s, k) { _io.position.set(AC.x + s[0], s[2] + Math.sin(t * 0.6 + s[3] + s[0] * 0.4) * 1.6, AC.z + s[1]); _io.updateMatrix(); R.mesh.setMatrixAt(k, _io.matrix); }); R.mesh.instanceMatrix.needsUpdate = true; }
      if (DEEPDYN.plasma) DEEPDYN.plasma.uniforms.uT.value = t; if (DEEPDYN.fall) DEEPDYN.fall.uniforms.uT.value = t;
      if (DEEPDYN.arms && curLv === 4) DEEPDYN.arms.forEach(function (a) { var ph = t * 0.6 + a.ph; a.turret.rotation.y = Math.sin(ph) * 1.1; a.sh.rotation.x = -0.3 + Math.sin(ph * 1.3) * 0.35; a.el.rotation.x = 0.9 + Math.sin(ph * 0.9 + 1) * 0.4; a.wr.rotation.y = t * 1.5; });
      if (DEEPDYN.gantry && curLv === 4) { DEEPDYN.gantry.g.position.x = 172 + Math.sin(t * 0.25) * 8; DEEPDYN.gantry.head.position.z = Math.sin(t * 0.37) * 9; }
      if (DEEPDYN.racks) DEEPDYN.racks.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
      if (DEEPDYN.boat) { DEEPDYN.boat.position.y = LVY[2] - 0.55 + Math.sin(t * 1.1) * 0.05; DEEPDYN.boat.rotation.z = Math.sin(t * 0.8) * 0.03; }
      if (DEEPDYN.train) DEEPDYN.train.position.y = LVY[5] + 0.6 + Math.sin(t * 2) * 0.01;
    }
  }

  /* ============================== input ============================== */
  var pointers = {}, pinch = 0;
  function look(dx, dy) {
    if (tween) return; var k = 0.0042 * camera.fov / 55;
    if (J) { J.lookY = clamp(J.lookY - dx * k * 0.08, -0.8, 0.8); J.lookP = clamp(J.lookP + dy * k * 0.08, -0.4, 0.4); return; }
    cam.yaw += dx * k;
    if (state.mode === "orbit") cam.pitch = clamp(cam.pitch + dy * k, -1.45, -0.03); else cam.pitch = clamp(cam.pitch + dy * k, -1.35, 1.35);
    if (state.mode !== "walk" && state.mode !== "ride") applyCam(); else if (state.sit || state.mode === "ride") camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
  }
  function zoom(f) { if (tween || J) return; if (state.mode === "orbit") { cam.dist = clamp(cam.dist * f, 12, 900); applyCam(); } else { camera.fov = clamp(camera.fov * f, 22, 80); camera.userData.zoomed = true; camera.updateProjectionMatrix(); } }
  canvas.addEventListener("pointerdown", function (e) { canvas.focus({ preventScroll: true }); pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } var ids = Object.keys(pointers); if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } canvas.classList.add("dragging"); });
  canvas.addEventListener("pointermove", function (e) { var pt = pointers[e.pointerId]; if (!pt) return; var dx = e.clientX - pt.x, dy = e.clientY - pt.y; pt.x = e.clientX; pt.y = e.clientY; var ids = Object.keys(pointers); if (ids.length === 1) look(dx, dy); else if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0) zoom(pinch / d); pinch = d; } });
  function pointerEnd(e) { delete pointers[e.pointerId]; if (!Object.keys(pointers).length) canvas.classList.remove("dragging"); pinch = 0; }
  canvas.addEventListener("pointerup", pointerEnd); canvas.addEventListener("pointercancel", pointerEnd);
  canvas.addEventListener("wheel", function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  (function () {
    var el = $("joy"), knob = $("joyKnob"), id = null, cx = 0, cy = 0;
    el.addEventListener("pointerdown", function (e) { id = e.pointerId; var r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; el.setPointerCapture(id); move(e); e.preventDefault(); if (state.sit) standUp(); });
    function move(e) { if (e.pointerId !== id) return; var dx = e.clientX - cx, dy = e.clientY - cy, m = Math.hypot(dx, dy), R = 46; if (m > R) { dx *= R / m; dy *= R / m; } knob.style.transform = "translate(" + dx + "px," + dy + "px)"; joy.x = dx / R; joy.y = dy / R; joy.run = m > R * 1.25; }
    function end(e) { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; joy.run = false; knob.style.transform = ""; }
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); $("jumpBtn").addEventListener("click", jump);
  })();
  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; var tg = e.target, k = e.key.toLowerCase(); if (tg && tg.tagName === "INPUT") return;
    if (k === "escape") { if (J) { finishJourney(true); return; } if (!$("reader").hidden) { $("reader").hidden = true; syncSheet(); return; } if (!$("liftp").hidden) { $("liftp").hidden = true; syncSheet(); return; } if (state.plan) setPlan(false); else if (state.about) setAbout(false); else if (state.sit) standUp(); else if (state.mode === "walk") endWalk(); else if (narrow()) { showInfo(false); showRooms(false); } return; }
    if (state.plan || state.about || !$("reader").hidden || !$("liftp").hidden) return;
    if (J) { if (k === " " || k === "enter") { if (J.ph === "toTaxi") J.go = true; e.preventDefault(); } return; }
    if (state.mode === "walk") {
      if (k === "shift") keys.shift = true; else keys[k] = true;
      if (state.sit && ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].indexOf(k) >= 0) standUp();
      if (k === " ") { jump(); e.preventDefault(); } if (k.indexOf("arrow") === 0) e.preventDefault();
      if (k === "e" || k === "enter") { interact(); e.preventDefault(); }
      else if (k === "t") { endWalk(); goStop(state.stop); } else if (k === "c") setCut(true); else if (k === "p") setPlan(true); else if (k === "m") toggleSound(); else if (k === "j") startJourney();
      return;
    }
    if (tg && tg.tagName === "BUTTON" && (k === " " || k === "enter")) return;
    if (k === "w") startWalk(); else if (k === "t") goStop(state.stop); else if (k === "c") setCut(!state.cut); else if (k === "p") setPlan(!state.plan); else if (k === "j") startJourney();
    else if (k === "m") toggleSound(); else if (k === " ") { setPlaying(!state.playing); e.preventDefault(); }
    else if (k === "arrowright" || k === "pagedown") { goStop(state.stop + 1); e.preventDefault(); } else if (k === "arrowleft" || k === "pageup") { goStop(state.stop - 1); e.preventDefault(); }
  });
  window.addEventListener("keyup", function (e) { var k = e.key.toLowerCase(); if (k === "shift") keys.shift = false; else keys[k] = false; if (!e.shiftKey) keys.shift = false; });
  window.addEventListener("blur", function () { keys = {}; });

  function wireUI() {
    $("journeyBtn").addEventListener("click", startJourney);
    $("tourBtn").addEventListener("click", function () { if (state.mode === "walk") endWalk(); goStop(state.stop); });
    $("walkBtn").addEventListener("click", function () { if (state.mode === "walk") { endWalk(); hint(HINTS.stand); } else startWalk(); });
    $("walkHereBtn").addEventListener("click", function () { if (state.mode !== "walk") startWalk(false); });
    $("cutBtn").addEventListener("click", function () { setCut(!state.cut); });
    $("planBtn").addEventListener("click", function () { setPlan(!state.plan); }); $("planClose").addEventListener("click", function () { setPlan(false); });
    $("planTabs").addEventListener("click", function (e) { var t = e.target.closest(".ptab"); if (t) buildPlan(+t.getAttribute("data-lv")); });
    $("planSvg").addEventListener("click", function (e) { var t = e.target.closest("[data-i]"); if (!t) return; setPlan(false); goStop(+t.getAttribute("data-i")); });
    $("aboutBtn").addEventListener("click", function () { setAbout(!state.about); }); $("aboutClose").addEventListener("click", function () { setAbout(false); });
    $("soundBtn").addEventListener("click", toggleSound);
    $("fsBtn").addEventListener("click", function () { var d = document, el = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else if (el.requestFullscreen || el.webkitRequestFullscreen) (el.requestFullscreen || el.webkitRequestFullscreen).call(el); });
    $("prevBtn").addEventListener("click", function () { goStop(state.stop - 1); }); $("nextBtn").addEventListener("click", function () { goStop(state.stop + 1); });
    $("roomsBtn").addEventListener("click", function () { showRooms($("rooms").hidden); }); $("infoClose").addEventListener("click", function () { showInfo(false); });
    $("playBtn").addEventListener("click", function () { setPlaying(!state.playing); }); $("timeRange").addEventListener("input", function () { setTime(parseFloat(this.value)); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) { b.addEventListener("click", function () { var p = b.getAttribute("data-preset"); setPlaying(false); setTime(p === "sunrise" ? SUNRISE_T + 0.35 : p === "noon" ? SOL_H / 2 : p === "sunset" ? SUNSET_T - 0.3 : SUNSET_T + 2.1); }); });
    $("stormBtn").addEventListener("click", function () { state.stormOn = !state.stormOn; this.setAttribute("aria-pressed", state.stormOn ? "true" : "false"); });
    $("prompt").addEventListener("click", interact);
    $("capBtn").addEventListener("click", function () { if (J && J.ph === "toTaxi") J.go = true; });
    $("skipBtn").addEventListener("click", function () { if (J) finishJourney(true); });
    $("liftBtns").addEventListener("click", function (e) { var b = e.target.closest(".lvbtn"); if (b) rideLift(+$("liftp").dataset.lift, +b.getAttribute("data-lv")); });
    $("liftClose").addEventListener("click", function () { $("liftp").hidden = true; syncSheet(); });
    $("readerClose").addEventListener("click", function () { $("reader").hidden = true; syncSheet(); });
    $("readerBody").addEventListener("click", function (e) { var bk = e.target.closest("[data-b]"), nv = e.target.closest("[data-nav]"); if (bk) { READ.b = +bk.getAttribute("data-b"); READ.p = 0; renderReader(); } else if (nv) { var d = nv.getAttribute("data-nav"); if (d === "next") READ.p = Math.min(READS[READ.b].pages.length - 1, READ.p + 1); else if (READ.p) READ.p--; else READ.b = -1; renderReader(); } });
    $("aboutArea").textContent = "≈ " + fmtArea(TOTAL_AREA); $("aboutDeep").textContent = "≈ " + fmtArea(DEEP_AREA);
    var tabs = []; for (var k = 0; k <= 5; k++) tabs.push('<button type="button" class="ptab" role="tab" data-lv="' + k + '">' + (k ? "L" + k + " " + LVNAME[k] : "Ground") + "</button>"); $("planTabs").innerHTML = tabs.join("");
    window.addEventListener("resize", function () { resize(); layoutPanels(); });
  }

  /* ============================== frame loop ============================== */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    if (!camera.userData.zoomed) camera.fov = w / h < 0.8 ? 70 : 55; camera.updateProjectionMatrix();
    var pr = renderer.getPixelRatio(); POST.setSize(Math.round(w * pr), Math.round(h * pr));
  }
  var chipLv = -9, clock = new THREE.Clock(), slowFrames = 0, dpr = DPR, lastNear = 0;
  function frame() {
    requestAnimationFrame(frame);
    var raw = Math.min(clock.getDelta(), 0.1), dt = Math.min(raw, 0.05); elapsed += dt;
    if (raw > 0.034) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); slowFrames = 0; }
    if (state.playing) { state.t = (state.t + dt * 0.5) % SOL_H; $("timeRange").value = state.t.toFixed(2); timeDirty = true; }
    var st = state.stormOn ? 1 : 0; if (Math.abs(st - state.storm) > 0.001) { state.storm += (st - state.storm) * Math.min(1, dt * 1.2); timeDirty = true; }
    if (timeDirty) { applyTime(); timeDirty = false; }
    if (J) journeyStep(raw); else if (tween) stepTween(); else if (RIDE) rideStep(raw); else if (state.mode === "walk" && !state.sit) stepWalk(raw);
    if (tween && J == null && state.sit) { /* sitting down */ }
    taxiStep(raw); doorsStep(raw); airlockStep(raw); interStep();
    var above = camera.position.y - (curLv === 0 ? groundY(camera.position.x, camera.position.z, 0) : LVY[Math.max(1, curLv)]), near = J && J.lastCam === "cockpit" ? 0.1 : clamp(above * 0.012, 0.1, curLv ? 0.3 : 1.2);
    if (Math.abs(near - lastNear) > 0.02) { camera.near = near; camera.updateProjectionMatrix(); lastNear = near; }
    var c = state.mode === "orbit" && !tween ? cam.target : camera.position, tx = c.x, tz = c.z;
    if (curLv === 0) { tx = clamp(tx, -60, PORT.x + 300); tz = clamp(tz, -600, 200); }
    if (Math.hypot(tx - sun.target.position.x, tz - sun.target.position.z) > 25 || Math.abs(sun.target.position.y - (curLv ? LVY[curLv] : 0)) > 1) { sun.target.position.set(tx, curLv ? LVY[curLv] : 0, tz); shadowDirty = true; }
    updateLight(dt); if (curLv !== chipLv) { chipLv = curLv; levelChip(curLv); }
    if (curLv === 0) refreshSkyEnv(false);
    animate(dt); particlesStep(dt); tvStep(elapsed); takeSnaps(dt);
    if (state.cut) updateLabels();
    if (state.plan && youDot) { var lvp = state.mode === "walk" ? walk.lv : curLv; youDot.style.display = lvp === state.planLv ? "" : "none"; youDot.setAttribute("cx", camera.position.x.toFixed(1)); youDot.setAttribute("cy", camera.position.z.toFixed(1)); }
    updateSound();
    if (shadowDirty || elapsed - lastShadow > 0.5 || J) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; lastShadow = elapsed; }
    POST.render(scene, camera, elapsed);
  }

  /* ============================== start ============================== */
  function setLoad(msg, f) { $("loadMsg").textContent = msg; var pc = Math.round(f * 100) + "%"; $("loadPct").textContent = pc; $("loadBar").style.width = pc; }
  var STEPS = [];
  for (var tg = 0; tg < TEXGEN.length; tg += 3) (function (a) { STEPS.push(["Mixing materials", function () { TEXGEN.slice(a, a + 3).forEach(function (g) { g[1](); }); }]); })(tg);
  STEPS.push(["Mixing materials", function () { texturize(); }],
    ["Surveying the mesa", function () { var n = buildTerrain(50, -200, 900, MOBILE ? 225 : 300); shapeTerrain(n); scene.add(n); TERRAIN.push(n); var pt = buildTerrain(PORT.x, PORT.z, 900, MOBILE ? 150 : 200); scene.add(pt); TERRAIN.push(pt); }],
    ["Mapping Arcadia Planitia", function () { var f = buildTerrain(50, -200, 16000, MOBILE ? 150 : 220, [[50, -200, 450], [PORT.x, PORT.z, 450]]); scene.add(f); TERRAIN.push(f); }],
    ["Raising the palace", function () { buildPalace(function () {}); buildGatehouse(); }],
    ["Digging the Deep", function () { buildAtrium(); buildSalon(); buildSalon2(); }],
    ["Flooding the Grotto", function () { buildGrotto(); }],
    ["Planting the forest", function () { buildForest(); }],
    ["Starting the reactor", function () { buildEngine(); buildTransit(); }],
    ["Clearing the spaceport", function () { buildPort(); }],
    ["Sealing the domes", function () { buildBlobs(); buildBuckets(); }],
    ["Lighting the rooms", function () {
      renderer.shadowMap.autoUpdate = false; buildEnvs(); buildGateDoors(); buildLifts(); buildTVs(); tvSet("cinema", true, -1); buildParticles(); buildJourney();
      indexStops(); for (var k = 0; k <= 5; k++) RBL[k] = roomsOf(k); _order = LIGHT_ANCHORS.map(function (a, i) { return i; });
      buildRooms(); buildLabels(); wireUI(); layoutPanels(); resize();
      $("timeRange").value = state.t; applyTime(); timeDirty = false; refreshSkyEnv(true);
      goStop(STOP.arrival.i, true); updateLight(1);
      var vis = Object.keys(ZG).map(function (z) { var v = ZG[z].all.visible; ZG[z].all.visible = true; return v; }); renderer.compile(scene, camera); Object.keys(ZG).forEach(function (z, i) { ZG[z].all.visible = vis[i]; }); primeSnaps();
    }]);
  function shapeTerrain(mesh) {
    var p = mesh.geometry.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), z = p.getZ(i);
      if (Math.hypot(x, z) < 9.5 || (Math.abs(x) < 4.8 && z > 34 && z < 66)) { p.setY(i, Math.min(p.getY(i), -3)); continue; }
      if (Math.hypot(x - GH.x, z - GH.z) < 7.5) { p.setY(i, Math.min(p.getY(i), -3)); continue; }
      var gl = gLocal(x, z); if (Math.abs(gl.lx) < 10 && gl.lz > 18 && gl.lz < 47) { p.setY(i, -0.03); continue; } // the portal forecourt and walkway
      for (var k = 0; k < FOOTPRINTS.length; k++) if (inShape(FOOTPRINTS[k], x, z, -1.5)) { p.setY(i, -0.03); break; }
    }
    p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
  }
  var stepI = 0;
  function runStep() {
    if (stepI >= STEPS.length) {
      setLoad("Ready", 1); $("loadBtns").hidden = false; $("loadMsg").textContent = "Your ship is approaching Mars";
      requestAnimationFrame(frame);
      function go(journey) { $("loading").classList.add("done"); setTimeout(function () { $("loading").hidden = true; }, 900); if (!state.sound) toggleSound(); if (journey) startJourney(); else { toast("Mars · Arcadia Planitia", "Arcadia Palace"); hint(HINTS.orbit, 6000); } }
      $("beginBtn").addEventListener("click", function () { go(true); }); $("skipLoadBtn").addEventListener("click", function () { go(false); });
      return;
    }
    setLoad(STEPS[stepI][0], stepI / STEPS.length);
    setTimeout(function () {
      try { STEPS[stepI][1](); } catch (err) { console.error(err); showError("Something went wrong while building the palace: " + (err && err.message ? err.message : err)); return; }
      stepI++; runStep();
    }, 30);
  }
  runStep();
})();
