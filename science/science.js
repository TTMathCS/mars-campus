/* The science pages: the top bar, the list of the section's pages, the page turn and the footer.
   Each page sets <body data-sec="mars-facts" data-page="weather"> (science/index.html sets neither).
   To add a page: write it, then add it to its section's list here; the menus and page turns follow. */
(function () {
  var SECTIONS = {
    "mars-facts": { name: "Mars facts", pages: [
      ["index", "Mars facts"], ["surface", "The surface"], ["inside", "Inside Mars"], ["weather", "Weather"],
      ["space", "Mars in space"], ["resources", "Resources"], ["hazards", "Hazards"], ["numbers", "The numbers"],
      ["exploration", "Exploration"]] },
    "building-on-mars": { name: "Building on Mars", pages: [
      ["index", "Building on Mars"], ["factors", "Every factor"], ["getting-there", "Getting there"],
      ["construction", "Construction"], ["water", "Water"], ["air", "Air"], ["food", "Food"], ["energy", "Energy"],
      ["shielding", "Shielding"], ["health", "Health"], ["fuel", "Rocket fuel"], ["communication", "Talking to Earth"],
      ["protection", "Protecting Mars"]] }
  };
  var body = document.body, sec = body.getAttribute("data-sec"), page = body.getAttribute("data-page") || "index";
  var S = SECTIONS[sec], up = S ? "../" : "", home = S ? "../../" : "../";
  function href(p) { return p === "index" ? "./" : p + ".html"; }
  var idx = S ? S.pages.map(function (p) { return p[0]; }).indexOf(page) : -1;

  var crumb = '<a href="' + home + '">Mars – No Way Home</a> · ' + (S ? '<a href="' + up + '">The science</a>' : "The science");
  if (S) crumb += " · " + (page === "index" ? S.name : '<a href="./">' + S.name + "</a> · " + S.pages[idx][1]);
  var nav = '<nav aria-label="The science"><a href="' + up + 'mars-facts/"' + (sec === "mars-facts" ? ' class="on"' : "") + '>Mars facts</a>' +
    '<a href="' + up + 'building-on-mars/"' + (sec === "building-on-mars" ? ' class="on"' : "") + ">Building on Mars</a></nav>";
  var head = '<header class="bar"><div class="in"><div class="crumb">' + crumb + "</div>" + nav + "</div></header>";
  if (S) head += '<nav class="sub" aria-label="' + S.name + '"><div class="in">' + S.pages.map(function (p) {
    return '<a href="' + href(p[0]) + '"' + (p[0] === page ? ' class="on" aria-current="page"' : "") + ">" + p[1] + "</a>";
  }).join("") + "</div></nav>";
  body.insertAdjacentHTML("afterbegin", head);
  var cur = document.querySelector(".sub a.on");
  if (cur && cur.scrollIntoView) cur.parentNode.scrollLeft = Math.max(0, cur.offsetLeft - 16);

  var main = document.querySelector("main");
  var kick = document.querySelector(".hero .kick");
  if (S && kick && !kick.textContent.trim()) kick.textContent = page === "index" ? "The science" : S.name + " · " + idx + " of " + (S.pages.length - 1);
  if (S && main) {
    var prev = idx > 0 ? S.pages[idx - 1] : null, next = idx < S.pages.length - 1 ? S.pages[idx + 1] : null;
    var other = sec === "mars-facts" ? ["building-on-mars", "Building on Mars"] : ["mars-facts", "Mars facts"];
    main.insertAdjacentHTML("beforeend", '<nav class="pager" aria-label="Page turn">' +
      (prev ? '<a class="prev" href="' + href(prev[0]) + '"><span>← Back</span><b>' + prev[1] + "</b></a>" : "") +
      (next ? '<a class="next" href="' + href(next[0]) + '"><span>Next →</span><b>' + next[1] + "</b></a>"
            : '<a class="next" href="' + up + other[0] + '/"><span>Next →</span><b>' + other[1] + "</b></a>") + "</nav>");
  }
  document.body.insertAdjacentHTML("beforeend", '<footer class="foot"><div class="in"><p>Real science, with the sources at the end of every page; the few numbers that are our own estimates say so. ' +
    'The two demos on the homepage are imagined.</p><p><a href="' + home + '">Mars – No Way Home</a> · <a href="' + up + 'mars-facts/">Mars facts</a> · <a href="' + up +
    'building-on-mars/">Building on Mars</a> · <a href="https://github.com/TTMathCS/mars-campus">Source on GitHub</a></p></div></footer>');
})();
