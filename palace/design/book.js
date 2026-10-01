/* The design book: shared page furniture (top bar, chapter menu, page turn) and small SVG helpers
   used by the diagrams in every chapter. Each page sets <body data-ch="site"> and draws its own figures. */
var BOOK = (function () {
  var CH = [
    ["index", "00", "Overview", "What the design is, key numbers and the decisions for Jim"],
    ["site", "01", "Site and city", "Where on Mars, why there, the site plan and how the city grows"],
    ["crown", "02", "The Crown", "The floating house above ground, the Orb and the Stone Garden"],
    ["pentagon", "03", "The Pentagon", "Five levels below ground, the atrium and how it is built"],
    ["interiors", "04", "Interiors", "Every room, the materials, light and the Wormhole Gate"],
    ["power", "05", "Power", "Solar field, reactors, storage and the grid, in sunshine and in storms"],
    ["transport", "06", "Transportation", "Ships from Earth, the pod, rovers, the maglev and the portals"],
    ["spaceport", "07", "Arcadia Spaceport", "Pads, terminal, the fuel plant and the ice mine"],
    ["life", "08", "Life support", "Air, water, food, warmth and protection from radiation and dust"],
    ["space", "09", "Communications and space", "The link to Earth, the relays, the moons and time on Mars"],
    ["phases", "10", "Building it", "Robots first: the order of work, from the first landing to the city"]
  ];
  // chapters that are written; the others show as "coming" and are not linked yet
  var READY = { index: 1, site: 1, crown: 1, pentagon: 1, interiors: 1, power: 1, transport: 1, spaceport: 1 };
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
     Plain SVG images, so no CORS is needed. The simplified map img/mars-map.jpg lies underneath, so the
     figure still reads if the tiles can't be reached. proj(lat, lonE) must be linear in both. */
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
    var items = CH.map(function (c) { return READY[c[0]] ? '<li><a href="' + (c[0] === "index" ? "./" : c[0] + ".html") + '"><span>' + c[1] + "</span>" + c[2] + "</a></li>" : '<li><span class="soon"><span>' + c[1] + "</span>" + c[2] + " · coming</span></li>"; }).join("");
    bar.innerHTML = '<div class="wrap"><div class="crumb"><a href="../../">Mars Campus</a> · <a href="./">Design book</a>' + (i > 0 ? " · " + CH[i][1] + " " + CH[i][2] : "") + '</div><nav><details><summary>Chapters</summary><ol>' + items + '</ol></details><a href="../plans/">Drawings</a><a class="atlas" href="atlas/">Mars Atlas</a></nav></div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var main = document.querySelector("main");
    if (main && i >= 0) {
      var pg = document.createElement("nav"); pg.className = "pager"; pg.setAttribute("aria-label", "Next and previous chapter");
      var prev = i > 0 ? CH[i - 1] : null, next = i < CH.length - 1 ? CH[i + 1] : null;
      pg.innerHTML = (prev ? '<a class="prev" href="' + (prev[0] === "index" ? "./" : prev[0] + ".html") + '"><span>← ' + prev[1] + "</span><b>" + prev[2] + "</b></a>" : "<span></span>") + (next ? (READY[next[0]] ? '<a class="next" href="' + next[0] + '.html"><span>' + next[1] + " →</span><b>" + next[2] + "</b></a>" : '<span class="next soon"><span>' + next[1] + " · coming next</span><b>" + next[2] + "</b></span>") : "");
      main.appendChild(pg);
      var ft = document.createElement("footer"); ft.className = "foot";
      ft.innerHTML = '<div class="wrap">The Crown and the Pentagon · design book for Jim (TTMath) · Mars Campus demo 2 · Rev C, 30 Sep 2026. Real science and engineering unless marked <b>future technology</b>.</div>';
      document.body.appendChild(ft);
    }
    document.addEventListener("click", function (e) { var d = document.querySelector(".bar details[open]"); if (d && !d.contains(e.target)) d.removeAttribute("open"); });
    // wide drawings on a phone: start scrolled to the part that matters (data-focus = fraction of the width)
    function focusScrolls() { document.querySelectorAll(".scroll").forEach(function (el) { if (el.scrollWidth <= el.clientWidth + 2) return; var f = parseFloat(el.getAttribute("data-focus") || "0.5"); el.scrollLeft = Math.max(0, f * el.scrollWidth - el.clientWidth / 2); }); }
    focusScrolls(); window.addEventListener("load", focusScrolls);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", furnish); else furnish();
  return { CH: CH, READY: READY, S: S, T: T, TL: TL, r1: r1, path: path, arrowDefs: arrowDefs, box: box, catmull: catmull, rng: rng, scalebar: scalebar, north: north, marsImagery: marsImagery, greatCircle: greatCircle, D2R: Math.PI / 180 };
})();
