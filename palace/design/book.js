/* The design book: shared page furniture (top bar, chapter menu, page turn) and small SVG helpers
   used by the diagrams in every chapter. Each page sets <body data-ch="site"> and draws its own figures. */
var BOOK = (function () {
  var CH = [
    ["index", "00", "Overview", "Arcadia at a glance: the two places, and the ways in"],
    ["idea", "00·1", "The idea", "By day in the ground, by night in the sky: the Pentagon, the Crown, the city, and what is real or future"],
    ["site", "01", "Site and city", "Where on Mars, why there, the site plan and how the city grows"],
    ["crown", "02", "The Crown", "The floating ring above ground, the Orb with the universe in VR and the Wormhole Gate, and the Stone Garden"],
    ["rooms-crown", "02·1", "The Crown, room by room", "Each part of the ring: what it is for, its plan, pictures and 360° views"],
    ["pentagon", "03", "The Pentagon", "Five levels below ground, the atrium and how it is built"],
    ["rooms-residence", "03·1", "L1: Jim's residence", "The family room, the music room, the dining room and bar, the master suite down"],
    ["rooms-atrium", "03·2", "L1: round the atrium", "The atrium and the sun court, the great library, the thermal baths, the cinema"],
    ["rooms-club", "03·3", "L1: the club", "The wine cellar under its brick vaults"],
    ["interiors", "04", "Interiors", "Every room, the materials, light, and the rooms round the Wormhole Gate"],
    ["power", "05", "Power", "From the city's grid, with storage and heat pumps of its own, in sunshine and in storms"],
    ["transport", "06", "Transportation", "Ships from Earth, the pod, rovers, the maglev and the portals"],
    ["spaceport", "07", "Arcadia Spaceport", "Pads, terminal, the fuel plant and the ice mine"],
    ["life", "08", "Life support", "Air, water, food, warmth and protection from radiation and dust"],
    ["space", "09", "Communications and space", "The link to Earth, the relays, the moons and time on Mars"],
    ["phases", "10", "Building it", "Robots first: the order of work, from the first landing to the city"]
  ];
  // the science behind the plan: its own pages elsewhere on the site, listed after the chapters
  var SCIENCE = [["Mars facts", "../../science/mars-facts/"], ["Building on Mars", "../../science/building-on-mars/"]];
  // chapters that are written; the others show as "coming" and are not linked yet
  var READY = { index: 1, idea: 1, site: 1, crown: 1, "rooms-crown": 1, pentagon: 1, "rooms-residence": 1, "rooms-atrium": 1, "rooms-club": 1, interiors: 1, power: 1, transport: 1, spaceport: 1, life: 1, space: 1, phases: 1 };
  // a chapter's page: its own file, or (the science) a page elsewhere on the site
  function chHref(c) { return c[4] || (c[0] === "index" ? "./" : c[0] + ".html"); }
  var NS = "http://www.w3.org/2000/svg";
  function S(tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in (a || {})) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function T(p, x, y, txt, cls, a) { var t = S("text", Object.assign({ x: r1(x), y: r1(y), "class": cls || "" }, a || {}), p); t.textContent = txt; return t; }
  // several lines of text, each [text, class]
  function TL(p, x, y, lines, cls, lh, anchor) { var g = S("g", {}, p); lines.forEach(function (l, i) { T(g, x, y + i * (lh || 15), l[0], (cls || "") + " " + (l[1] || ""), { "text-anchor": anchor || "start" }); }); return g; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function path(pts, close) { return pts.map(function (p, i) { return (i ? "L" : "M") + r1(p[0]) + " " + r1(p[1]); }).join("") + (close ? "Z" : ""); }
  function arrowDefs(svg, id, cls) {
    var d = S("defs", {}, svg), m = S("marker", { id: id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, d);
    S("path", { d: "M0 1L9 5L0 9Z", "class": cls || "inkf" }, m); return "url(#" + id + ")";
  }
  function box(p, x, y, w, h, title, sub, cls) {
    var g = S("g", {}, p); S("rect", { x: r1(x), y: r1(y), width: r1(w), height: r1(h), rx: 3, "class": cls || "paper", style: "stroke: var(--ink-2); stroke-width: 1.2" }, g);
    T(g, x + w / 2, y + (sub ? h / 2 - 3 : h / 2 + 5), title, "disp", { "text-anchor": "middle", style: "font-size:16px;font-weight:600" });
    if (sub) (Array.isArray(sub) ? sub : [sub]).forEach(function (s, i) { T(g, x + w / 2, y + h / 2 + 13 + i * 14, s, "t2", { "text-anchor": "middle", style: "font-size:12.5px" }); });
    return g;
  }
  function catmull(pts, n) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(function (c) { return 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3); })); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function scalebar(p, x, y, k, stops, unit) {
    var g = S("g", {}, p), last = stops[stops.length - 1];
    S("line", { x1: x, y1: y, x2: r1(x + last * k), y2: y, "class": "ink", "stroke-width": 1.3 }, g);
    stops.forEach(function (s, i) { var xx = x + s * k; S("line", { x1: r1(xx), y1: y - 4, x2: r1(xx), y2: y + 4, "class": "ink", "stroke-width": 1.1 }, g); T(g, xx, y + 16, s + (i === stops.length - 1 ? " " + unit : ""), "mono t2", { "text-anchor": "middle", style: "font-size:11px" }); });
    return g;
  }
  function north(p, x, y) { var g = S("g", { transform: "translate(" + x + " " + y + ")" }, p); S("path", { d: "M0 -16L6 6L0 1L-6 6Z", "class": "inkf" }, g); T(g, 0, -21, "N", "disp", { "text-anchor": "middle", style: "font-size:14px;font-weight:600" }); return g; }
  /* Real Mars imagery for the map figures: the NASA/JPL/USGS Viking colour mosaic (MDIM 2.1), as 512 px tiles
     from Esri OnMars (geographic; level z has 2^(z+1) x 2^z tiles of 180/2^z degrees, origin 180 W, 90 N).
     Plain SVG images, so no CORS is needed. A real but coarser colour map, img/mars-map.jpg (tools/fetch_marsmap.py),
     lies underneath, so the figure still looks right if the tiles can't be reached. proj(lat, lonE) must be linear in both. */
  var TILE_URL = "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/";
  function marsImagery(p, proj, box, z) {
    var g = S("g", { "class": "imagery" }, p);
    for (var k = -1; k <= 1; k++) {
      var o = proj(90, k * 360), q = proj(-90, 360 + k * 360);
      S("image", { href: "img/mars-map.jpg", x: r1(o[0]), y: r1(o[1]), width: r1(q[0] - o[0]), height: r1(q[1] - o[1]), preserveAspectRatio: "none" }, g);
    }
    var span = 180 / Math.pow(2, z), lo0 = Math.floor(box[2] / span) * span, la1 = Math.min(90, Math.ceil(box[1] / span) * span);
    for (var la = la1; la > box[0] + 1e-9 && la > -90; la -= span) for (var lo = lo0; lo < box[3]; lo += span) {
      var l180 = (((lo + 180) % 360) + 360) % 360 - 180, tx = Math.round((l180 + 180) / span), ty = Math.round((90 - la) / span);
      var p0 = proj(la, lo), p1 = proj(la - span, lo + span);
      S("image", { href: TILE_URL + z + "/" + ty + "/" + tx, x: r1(p0[0]), y: r1(p0[1]), width: r1(p1[0] - p0[0] + 0.6), height: r1(p1[1] - p0[1] + 0.6), preserveAspectRatio: "none" }, g);
    }
    return g;
  }
  // great-circle path between two places, as [lat, lon] points (lon continuous from the first point)
  function greatCircle(a, b, n) {
    var D = Math.PI / 180, out = [];
    function v(la, lo) { return [Math.cos(la * D) * Math.cos(lo * D), Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D)]; }
    var A = v(a[0], a[1]), B = v(b[0], b[1]), w = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))), prev = a[1];
    for (var i = 0; i <= n; i++) {
      var t = i / n, s0 = Math.sin((1 - t) * w) / Math.sin(w), s1 = Math.sin(t * w) / Math.sin(w), x = s0 * A[0] + s1 * B[0], y = s0 * A[1] + s1 * B[1], zz = s0 * A[2] + s1 * B[2];
      var lo = Math.atan2(y, x) / D; while (lo - prev > 180) lo -= 360; while (lo - prev < -180) lo += 360; prev = lo;
      out.push([Math.asin(zz) / D, lo]);
    }
    return out;
  }
  // page furniture
  function furnish() {
    var id = document.body.getAttribute("data-ch") || "index", i = CH.findIndex(function (c) { return c[0] === id; });
    var root = id === "index" ? "./" : "./";
    var bar = document.createElement("header"); bar.className = "bar";
    var items = CH.map(function (c) { return READY[c[0]] ? '<li><a href="' + chHref(c) + '"><span>' + c[1] + "</span>" + c[2] + "</a></li>" : '<li><span class="soon"><span>' + c[1] + "</span>" + c[2] + " · coming</span></li>"; }).join("")
      + '<li class="grp">The science</li>' + SCIENCE.map(function (c) { return '<li><a href="' + c[1] + '"><span></span>' + c[0] + "</a></li>"; }).join("");
    bar.innerHTML = '<div class="wrap"><div class="crumb"><a href="../../">Mars – your new home</a> · <a href="./">Arcadia design plan</a>' + (i > 0 ? " · " + CH[i][1] + " " + CH[i][2] : "") + '</div><nav><details><summary>Chapters</summary><ol>' + items + '</ol></details><a href="../plans/">Floor plans</a><a href="../tour/">360° tour</a><a class="atlas" href="atlas/">Mars Atlas</a></nav></div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var main = document.querySelector("main");
    if (main && i >= 0) {
      var pg = document.createElement("nav"); pg.className = "pager"; pg.setAttribute("aria-label", "Next and previous chapter");
      var prev = i > 0 ? CH[i - 1] : null, next = i < CH.length - 1 ? CH[i + 1] : null;
      pg.innerHTML = (prev ? '<a class="prev" href="' + chHref(prev) + '"><span>← ' + prev[1] + "</span><b>" + prev[2] + "</b></a>" : "<span></span>") + (next ? (READY[next[0]] ? '<a class="next" href="' + chHref(next) + '"><span>' + next[1] + " →</span><b>" + next[2] + "</b></a>" : '<span class="next soon"><span>' + next[1] + " · coming next</span><b>" + next[2] + "</b></span>") : "");
      main.appendChild(pg);
      var ft = document.createElement("footer"); ft.className = "foot";
      ft.innerHTML = '<div class="wrap">Arcadia · design plan for Jim (TTMath) · Mars – your new home. Maps: NASA/JPL/USGS Viking colour mosaic via Esri OnMars, over a base map by Solar System Scope (CC BY 4.0).</div>';
      document.body.appendChild(ft);
    }
    document.addEventListener("click", function (e) { var d = document.querySelector(".bar details[open]"); if (d && !d.contains(e.target)) d.removeAttribute("open"); });
    // wide drawings on a phone: start scrolled to the part that matters (data-focus = fraction of the width)
    function focusScrolls() { document.querySelectorAll(".scroll").forEach(function (el) { if (el.scrollWidth <= el.clientWidth + 2) return; var f = parseFloat(el.getAttribute("data-focus") || "0.5"); el.scrollLeft = Math.max(0, f * el.scrollWidth - el.clientWidth / 2); }); }
    focusScrolls(); window.addEventListener("load", focusScrolls);
  }
  // Labels stay readable in both themes. The drawings' materials (ice, soil, steel, water) are fixed tints, so in dark
  // mode a light label can land on a light fill. For each label, find the shapes drawn under its centre, blend their
  // colours, and if the label is hard to read there, switch it to the dark or light ink of its kind, whichever reads best.
  var INK = { "": ["#1C2124", "#F2F4F1"], t2: ["#3E4649", "#E4E8E4"], t3: ["#4E575B", "#C9D0D1"], tr: ["#8F3520", "#F4A58C"],
              ti: ["#1F5873", "#A6D6EC"], tg: ["#7A5A12", "#F1CF84"], tl: ["#475F25", "#BCD98F"] };
  function rgba(c) { var m = (c || "").match(/rgba?\(([^)]+)\)/); if (!m) return null; var v = m[1].split(",").map(parseFloat); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function lum(c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function legible() {
    document.querySelectorAll("figure svg").forEach(function (svg) {
      var base = null;   // the first solid background behind the drawing
      for (var e = svg; e && !base; e = e.parentElement) { var c = rgba(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) base = c; }
      base = base || [248, 249, 246, 1];
      var seen = Array.prototype.slice.call(svg.querySelectorAll("rect,path,polygon,polyline,circle,ellipse,line,image"));
      // the colour behind screen point p, blended from every shape there, topmost first; null over imagery or a gradient
      function behind(p) {
        var layers = [], cover = 0;
        for (var i = seen.length - 1; i >= 0 && cover < 0.98; i--) {
          var s = seen[i], ss = getComputedStyle(s);
          if (ss.display === "none" || ss.visibility === "hidden") continue;
          var sm = s.getScreenCTM(); if (!sm) continue;
          var q = p.matrixTransform(sm.inverse());
          if (s.tagName === "image") { var ib = s.getBBox(); if (q.x >= ib.x && q.x <= ib.x + ib.width && q.y >= ib.y && q.y <= ib.y + ib.height) return null; continue; }
          var paint = null, op = 1;
          if (s.isPointInStroke && ss.stroke !== "none" && parseFloat(ss.strokeWidth) >= 3 && s.isPointInStroke(q)) { paint = ss.stroke; op = parseFloat(ss.strokeOpacity); }   // a wide band drawn as a stroke
          else if (ss.fill !== "none" && s.tagName !== "line" && s.isPointInFill && s.isPointInFill(q)) { paint = ss.fill; op = parseFloat(ss.fillOpacity); }
          if (!paint) continue;
          var sc = rgba(paint); if (!sc || paint.indexOf("url(") >= 0) return null;
          var a = sc[3] * op * parseFloat(ss.opacity); if (a < 0.03) continue;
          layers.push([sc, a]); cover = 1 - (1 - cover) * (1 - a);
        }
        var bg = base.slice(0, 3);
        for (var j = layers.length - 1; j >= 0; j--) { var L = layers[j]; bg = [0, 1, 2].map(function (k) { return L[0][k] * L[1] + bg[k] * (1 - L[1]); }); }
        return bg;
      }
      // the lower median of the contrasts over the sample points: a small feature under one letter does not decide,
      // but a label half on a dark fill and half on a light one is judged by its worse half
      function typical(c, bgs) { var r = bgs.map(function (g) { return contrast(c, g); }).sort(function (x, y) { return x - y; }); return r[(r.length - 1) >> 1]; }
      svg.querySelectorAll("text").forEach(function (el) {
        if (el.getAttribute("data-ink")) { el.style.fill = ""; el.removeAttribute("data-ink"); }
        var cs = getComputedStyle(el), fc = rgba(cs.fill);
        if (!fc || cs.display === "none" || cs.visibility === "hidden") return;
        if (cs.paintOrder.indexOf("stroke") === 0 && cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 1.5) return;   // has a halo
        var b; try { b = el.getBBox(); } catch (e) { return; }
        var m = el.getScreenCTM(); if (!m || !b.width) return;
        var bgs = [];
        for (var n = 0; n < 10; n++) {   // a spread of points across the label
          var g = behind(new DOMPoint(b.x + (0.1 + 0.2 * (n % 5)) * b.width, b.y + (n < 5 ? 0.35 : 0.6) * b.height).matrixTransform(m));
          if (!g) return;
          bgs.push(g);
        }
        var now = typical(fc, bgs); if (now >= 2.6) return;
        var kind = ""; ["t2", "t3", "tr", "ti", "tg", "tl"].forEach(function (k) { if (el.classList.contains(k)) kind = k; });
        // the ink of the label's own kind if it reads well, else the strongest ink
        var best = null, br = now;
        INK[kind].forEach(function (h) { var r = typical(hex(h), bgs); if (r > br) { br = r; best = h; } });
        if (br < 3) INK[""].forEach(function (h) { var r = typical(hex(h), bgs); if (r > br + 0.3) { br = r; best = h; } });
        if (best) { el.style.fill = best; el.setAttribute("data-ink", "1"); }
      });
    });
  }
  function legibleSoon() { clearTimeout(legibleSoon.t); legibleSoon.t = setTimeout(legible, 60); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", legibleSoon); else legibleSoon();
  window.addEventListener("load", legibleSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(legibleSoon);
  if (window.matchMedia) { var mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", legibleSoon); }
  new MutationObserver(legibleSoon).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", furnish); else furnish();
  // The rooms of the floor plans (palace/plans/rooms.js, which a page loads before book.js when it draws rooms), with their
  // shapes as palace/tools/draw_plans.py draws them: plan metres, x east, y north, the centre of the house at 0.
  var rooms = (function () {
    var T36 = Math.tan(36 * Math.PI / 180), C36 = Math.cos(36 * Math.PI / 180);
    function G() { return window.PLANS.geom; }
    function ringV(r) { var g = G(), i = "ABCDE".indexOf(r), a0 = g.APA + i * (g.RING + 4); return [a0, a0 + g.RING]; }   // a Pentagon ring, from the atrium out
    function half(v) { return v * T36 - (G().AVE / 2) / C36; }                     // half the width of a sector at v, inside the avenues
    function sectorC(k) { return 126 + 72 * (k - 1); }                              // the bearing of sector k's middle
    function local(rm) {                                                             // [sector, 4 corners [u, v]]: u along the ring, clockwise; v outwards
      var at = rm.at, u0 = at.length > 2 ? at[2] : null, u1 = at.length > 3 ? at[3] : null, f0 = at.length > 4 ? at[4] : 0, f1 = at.length > 5 ? at[5] : 1;
      var va = ringV(rm.rings ? rm.rings[0] : at[0])[0], vb = ringV(rm.rings ? rm.rings[1] : at[0])[1], v0 = va + (vb - va) * f0, v1 = va + (vb - va) * f1;
      function lo(v) { return u0 == null ? -half(v) : Math.max(-half(v), u0); }
      function hi(v) { return u1 == null ? half(v) : Math.min(half(v), u1); }
      return [at[1], [[lo(v0), v0], [hi(v0), v0], [hi(v1), v1], [lo(v1), v1]]];
    }
    function world(k, u, v) { var c = sectorC(k) * Math.PI / 180; return [v * Math.sin(c) + u * Math.cos(c), v * Math.cos(c) - u * Math.sin(c)]; }
    function of(place) { return window.PLANS.rooms.filter(function (r) { return r.place === place; }); }
    function byCode(code) { return window.PLANS.rooms.filter(function (r) { return r.code === code; })[0]; }
    function range(list) { return list.length > 1 ? list[0].code + " to " + list[list.length - 1].code : list.length ? list[0].code : ""; }
    function kind(k) { return (window.PLANS.kinds[k] || ["#ddd", k])[0]; }        // the floor plans' colour for a kind of room
    return { ringV: ringV, half: half, sectorC: sectorC, local: local, world: world, of: of, byCode: byCode, range: range, kind: kind };
  })();
  return { CH: CH, SCIENCE: SCIENCE, READY: READY, S: S, T: T, TL: TL, r1: r1, path: path, arrowDefs: arrowDefs, box: box, catmull: catmull, rng: rng, scalebar: scalebar, north: north, marsImagery: marsImagery, greatCircle: greatCircle, rooms: rooms, D2R: Math.PI / 180 };
})();
