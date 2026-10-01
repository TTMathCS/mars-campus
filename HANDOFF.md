# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 1 Oct 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## 1. Status

| Part | Where | State |
| --- | --- | --- |
| Hub page | `index.html` | Live. Lists the demos and links the demo 2 plans and the design book. |
| Demo 1, TTMath on Mars | `ttmath/` | v0.7 live and finished: one integrated campus, real rooms, real materials. See `ttmath/REQUIREMENTS.md`. |
| Demo 2, old palace | `palace/index.html`, source in `palace/src_old/` | Still live, but Jim rejected it ("far from satisfactory"). It stays up until the new build replaces it at the same link. |
| Demo 2, plans | `palace/plans/` | Rev B, **approved by Jim on 30 Sep 2026** ("Approve. Go"). Live at https://ttmathcs.github.io/mars-campus/palace/plans/. |
| Demo 2, new 3D build | `palace/src/` | **Paused on 30 Sep 2026 at Jim's request** until the design book is finished. Phase 1 works end to end in the debug build: terrain, sky, spaceport, pod, the Crown with the Orb, storm, the 10-shot flight, cameras and UI. Not published yet (`palace/index.html` is still the old palace). |
| Design book | `palace/design/` | **In progress, live at https://ttmathcs.github.io/mars-campus/palace/design/.** Jim asked for all plans to be designed and documented before more implementation. Done and live: the cover (`index.html`), the Mars Atlas (`atlas/`), chapters 01 Site and city, 02 The Crown, 03 The Pentagon, 04 Interiors, 05 Power, 06 Transportation, 07 Arcadia Spaceport. To write: 08 Life support, 09 Communications and space, 10 Building it (they show as "coming" until `READY` in `book.js` lists them). Waiting for Jim: the universe ball (section 2). |

## 2. Demo 2 redesign: decisions so far

The requirements are in `palace/REQUIREMENTS.md`, section 10. In short:

- **Above ground: the Crown.** A solid white ring 276 m across, floating on anti-gravity 40 m above the plain, not glass-heavy because of the strong sun. It has five spires to 90 m and the mirror Orb with the Wormhole Gate at its centre.
- **Below ground: the Pentagon.** One solid pentagon, 160 m sides. It has five levels from 24 m to 68 m down under 16 m of soil, five rings (A–E) and five sectors around an atrium. It holds 10 times the Crown's floor area.
- **Arcadia Spaceport**, 30 km due east: three pads, terminal, fuel plant, pod station.
- **Pod flight home**: a scenic route of about 37 km and 4½ minutes, landing at sunset. Jim wants it to be an impressive video.
- **The city** grows from the house on a sunflower spiral (golden angle). Civic buildings go on the Fibonacci seeds, which line up due north. There are four phases.

Jim's answers to the Rev A questions (30 Sep 2026):
1. The Crown: "even wilder".
2. Master suite: "one up and one down", so one in the Crown and one on L1.
3. Add a "wormhole transformation device which can transfer me to anytime any space".
4. "Arrival land on sunset, but animation can go through Mars storm etc."

On how the Crown stays up, he chose: "use anti gravity. No elevator. From crown to underground is by use warm
hole or any transmission device." He also asked to keep all progress in this repo, and to delete the first
copy of the plans that had been published as a Claude artifact (done).

**Rev B is drawn and live** (palace/plans/, 30 Sep 2026):
- **Floating Crown.** An anti-gravity drive in each of the five spires holds the ring 40 m up. There are no legs and nothing touches the ground.
- **Spires.** The five points are sharp spires up to +90 m; the dips stay at +50. Roof profile: `50 + 40·c^6`, where `c = (1 + cos 5φ) / 2`.
- **Ring.** 16 m wide (122–138 m radius, 276 m across). The Glide walkway runs 779 m around the inside edge.
- **The Orb.** A mirror sphere, 40 m across, floats over the Sun Well from +52 to +92 m. Its floors are at +64 (portal hall), +72 (the **Wormhole Gate** hall) and +80 (destination library), about 3,370 m² in all. Its underside bounces the garden mirrors' light down the Sun Well.
- **No lifts.** Portals sit in the five spires, the Orb, the Pentagon's five corner cores and a portal column in the atrium. The Pentagon keeps stairs between its levels.
- **Two master suites.** "Master suite up" is in the Crown's SE dip; "Master suite down" is on L1, sector 1, ring B.
- **Pod.** It flies in under the ring, loops once round the Orb and enters the hangar through a door on the garden side of the east spire.
- **Flight video.** Ten shots, about 4 min 40 s, including a dust storm after the Ice Cliffs and a breakout into the blue sunset with Phobos crossing the sun.
- **Numbers.** Crown 20,100 m²; Pentagon 209,700 m² (10.4×).

**Jim's direction, 30 Sep 2026 (later):** "before the detailed html implementation, I really like to put efforts on the
design and figure out all the plans ... architecture, interior, power station design, transportation design/etc with
details on its outlook/how it works ... we need to finish this before we move the implementation." And: "in the design
doc, I need full map of mars, terrain and space maps. also mark where are the city/my house/spaceport are located ...
better like google earth design so that we can zoom in/out."

**Waiting for Jim (1 Oct 2026): the universe ball.** Asked where the Wormhole Gate should take him, Jim answered: "I
don't know because you have the crystal ball in the middle. And what I'm thinking is actually I need something like 3D
projector to project the center of the dome. Because that's project the whole universe ... I can zoom in, zoom out to
find a certain space in the universe. For example, solar systems ... But I don't know where to put the ball. So let's
say I need some plan to figure it out." The plan sent to him, recommended, not yet confirmed:
- **The ball goes inside the Orb, at its exact centre (+72 m).** The Orb's three solid floors become three open
  balcony rings round a void 24 m across: +64 **Portal ring** (arrive from the spires, about 600 m²), +72 **Gate bridge**
  with the Wormhole Gate (about 800 m²), +80 **Gallery** of saved places (about 600 m²). The Orb's area drops from
  3,370 m² to about 2,010 m².
- **The ball**: a 3D projection 8 m across that you zoom by hand or voice: the observable universe and the cosmic web →
  superclusters → the Local Group → the Milky Way → the Sun's neighbourhood → the solar system → a planet → a place
  (for Mars, the Mars Atlas data, down to the house). It zooms in time too. The whole inner shell (about 5,000 m²) is a
  seamless sky screen showing the sky seen from wherever you have zoomed to.
- **The Gate** then goes wherever you choose in the ball; the demo default: zoom out to the whole universe and back in
  to the TTMath campus in Gale crater, then step through into demo 1.
- Real today: screen-lined domes (the Sphere in Las Vegas) and zooming the universe on real survey data (NASA-backed
  OpenSpace in planetariums; Gaia stars, Sloan galaxy maps). Future technology: the image floating in mid-air without
  glasses, and the Gate. Fallback: the dome screen with 3D glasses.
- Other places offered: the Observatory spire's planetarium (separates choosing from going), the Pentagon's atrium
  (blocks the Sun Well's light).
- Knock-on numbers if he says yes: Crown 13,070 + 3,630 + 2,010 = **18,710 m²** (was 20,100; 5.5 times the TTMath
  campus); Pentagon **11.2 times** the Crown (was 10.4). Pages to change: `crown.html` (the Orb section, its section
  drawing, the floor-area tables and key numbers, the elevation label "Wormhole Gate hall"), `interiors.html` (the
  three Orb room cards), `pentagon.html` (the lede's "ten times" and the "10.4 times" number), `index.html` (decision 1
  becomes settled), `atlas/atlas.js` (the Orb's description in `SITEP`), and later the floor plans `palace/plans/`.
- Offered as a follow-up: extend the Mars Atlas outward so the same zoom runs from the house to the edge of the
  universe, a working model of the ball.

The cover of the design book (`palace/design/index.html`) lists the other open decisions: the site on AP-1, 70 kPa
air with 27% oxygen, sleeping below ground, and the arrival year.

**Build order** (Jim approved Rev B, so this is under way). Each phase replaces the old palace at `palace/` (same link):
1. The 30 km landscape, the spaceport and the pod flight video.
2. The Crown and the Orb.
3. The Pentagon, one level at a time.

## 2b. Next steps, in order

1. **The universe ball**: when Jim answers, apply it (or his alternative) through the pages listed above, then commit,
   push and send him the link.
2. **Write chapter 08 Life support** (`life.html`): air at 70 kPa with 27% oxygen, recommended (breathes like
   Calgary; NASA's exploration atmosphere is 56.5 kPa with 34%), the alternative 101 kPa; oxygen from electrolysis
   and the fuel plant's spare 100 t a ship; CO₂ scrubbing; the water loop (ice melt, over 95% recycling, the L2 lake
   as the reserve, the Crown's 90,000 t of wall ice); food from the L2 farm under lamps, the storm reserve of two
   years on L4; heating from reactor heat; radiation with a dose budget (open plain about 230 mSv a year, the Crown
   about a third behind 3 m of ice, the Pentagon about 1, Jim's target about 20 by sleeping below and spending about
   6 h a day in the Crown); dust and perchlorates (suit ports, filters); fire safety at 27% oxygen; the medical centre
   on L3. Reuse the decision boxes from the cover (decisions 3 and 4).
3. **Write chapter 09 Communications and space** (`space.html`): radio delay 3 to 22 min one way; three areostationary
   relays at 17,032 km up (orbit radius 20,428 km) plus a relay off to the side of the Sun for the two weeks of solar
   conjunction every 26 months; laser links; the fibre to the port; Phobos (9,376 km orbit, 7.65 h, rises in the west)
   and Deimos (23,463 km, 30.3 h); Mars time (sol 24 h 39 min 35 s, a year of 668.6 sols, a Mars clock in every room);
   Earth as an evening or morning star. The atlas already draws the relays and the moons.
4. **Write chapter 10 Building it** (`phases.html`): robots first, counting from Jim's arrival (year 0) because the
   arrival year is still Jim's decision: robots land two launch windows ahead (about 4½ years before); the order of
   work (power and the fuel plant at the port first, then the road and cable, the Pentagon dig and L4/L5, the
   Crown's pads and ring, the gardens); the city's phases 1 to 4 (chapter 01). Use a timeline drawing with the
   26-month windows.
5. For each new chapter: add it to `READY` in `book.js`, check it with `book_shot.py` (desktop, phone and dark),
   commit, push and tell Jim what it is before he opens it.
6. When Jim approves the whole design book, resume the paused 3D build (`palace/src/`), starting with the flight
   polish, then replace the old palace at `palace/` with the new demo (phase 1), then the Crown and the Orb, then the
   Pentagon.

## 2c. Numbers used across the design book

Keep new pages consistent with these (sources and working are in the chapters):
- Site: the Crown at 39.80° N 201.44° E, Arcadia Spaceport on AP-1 at 39.80° N 202.10° E, 30 km apart; ground −3.9 km,
  air 870 Pa (40% above the Mars average); ice within 1 m and tens of metres thick; AP-9 thick ice 58 km east of the
  port. House to Olympus Mons 1,780 km, to Gale crater (TTMath campus) 4,360 km, to Jezero 6,030 km.
- The Crown: ring 244–276 m across (radius 122–138), underside +40, main floor +41, roof 50 + 40·c⁶ (spires +90,
  dips +50); walls and roof 3 m (0.1 skin, 0.3 sintered shell, 2.2 ice, 0.2 aerogel, 0.2 liner); about 90,000 t of
  wall ice; mass about 155,000 t, 115 MN per drive; the Orb Ø 40 m, +52 to +92; the Stone Garden Ø 224 m with 224
  mirrors of 3.2 m on six rings and seven basalt stones; the Sun Well lens Ø 20.4 m; about 500 kW of sunlight down
  the well at a clear noon (beam-down optics). Floor area 20,100 m² (18,710 if the universe ball is accepted).
- The Pentagon: 160 m sides, circumradius 136.1 m, atrium 35 m sides, rings A–E 14 m deep with 4 m streets, 5 m
  avenues, levels L1 −24 (top −16), L2 −41 (16 m tall), L3 −50, L4 −59, L5 −68; 41,940 m² a level, 209,700 m² in all;
  16 m of soil; the dig 3.1 million m³ and 1.5 million t of ice.
- Power, phase 1: demand 8 MW average, about 14 MW peak; three 5 MWe heat-pipe microreactors (two on L4, one at the
  port, 13.5 MW available); solar field 94,000 m², 11 MW at a clear noon, 3.5 MW average, near 0 in a global storm;
  batteries 2 × 20 MWh; fuel cells 4 MW; DC link 30 km at ±20 kV, 15 MW, about 1.5% loss; radiators 150 × 60 m, 400 m
  north, up to 20 MW of heat.
- Transport: the pod is 9.2 × 4.5 m, 4 seats, about 6 t, 22 kN on Mars, top speed 680 km/h, about 1.5 t of methalox
  for the scenic flight (37 km, 4 min 40 s), about 1 t for a direct hop; the bus 12 seats at 40 km/h, 45 min; the
  maglev (phase 2) 30 km at 400 km/h in a 7 m tunnel at −68 m, about 6 min; Hohmann transfer 259 days, windows every
  26 months.
- The spaceport: three pads Ø 80 m with berms (radius 114–147 m, 6 m high) at bearings 60, 90 and 120, 1.6 km from
  the terminal (Ø 180 m); tower 77 m; pod station 70 × 120 m with four pod pads; one ship's propellant 1,200 t (260 t
  CH₄, 940 t O₂, plus 100 t spare O₂) from 585 t of water and 715 t of CO₂, about 8.6 GWh, about 5 months at 2.4 MW;
  tank farm six spheres Ø 36 m; ice mine 320 × 200 m, 9 m deep, 1 km north.

## 3. How to work on each part

**Publishing.** Every push to `main` deploys the site through `.github/workflows/pages.yml`. The workflow first checks that key files exist. It takes about a minute.

**Demo 1** (`ttmath/`):
1. Edit a block in `ttmath/src/blocks/`.
2. Run `python3 ttmath/src/assemble.py`, which fills `ttmath/src/page.html` between the CAMPUS markers.
3. Run `python3 ttmath/src/build.py`, which writes the published `ttmath/index.html`.

Tests in `ttmath/tools/` use headless Chromium with Playwright:
- `shot.py`: screenshots.
- `evalpage.py`: runs JavaScript in the page. `__mars._eval(expr)` reaches the page's internals.
- `walktest.py`: doors, steps and links.
- `site_check.py`: loads the built page.
- `hidden.py`: the campus must stay hidden behind the ridge from the start point.

**Demo 2, new build** (`palace/src/`): plain JavaScript on three.js r128, no build tools beyond `sh`.
- `palace/build.sh` joins `src/00_head.html` and `src/[1-9]*.js` (in name order, inside one function) into one page.
  - `sh palace/build.sh debug` writes `palace/palace-debug.html` (git-ignored) with test hooks. Use this while working.
  - `sh palace/build.sh` writes the published `palace/index.html`. **Don't run it until the new demo is ready to replace
    the old one**, because it overwrites the old demo.
- Source files: `10_core.js` renderer, shared uniforms, shader chunks, HDR bloom and tone mapping; `20_sky.js` sun, sky,
  Phobos, stars; `30_terrain.js` the height function (GLSL and a JS twin that must match) and ten nested terrain grids;
  `40_mat.js` building material and shadow map; `45_lights.js` point lights; `50_port.js` spaceport; `55_pod.js` pod and
  cockpit; `60_crown.js` the Crown, the Orb and the Stone Garden; `70_fx.js` dust devils, storm, sparks; `80_flight.js` the
  path, the ten shots and the cameras; `90_ui.js` HUD, cards, look-around, sound; `99_main.js` the main loop.
- World: metres, x east, z south, y up, the Crown's centre at the origin, the spaceport terminal at x = 30 000. Plan
  coordinates (x, y north) map to world (x, −y). Every vertex shader bends the world with the curvature of Mars.
- Test: `python3 palace/tools/crown_shot.py '[["name", "js", waitMs], ...]' 960x540` loads the debug page headless and
  saves PNGs to `palace/tools/out/`. In the page, `__crown.at(t)` jumps the flight video to time t (director's camera),
  `__crown.view(x, y, z, tx, ty, tz)` places the camera, `__crown.exp(e)` sets the exposure, `__crown.step(n)` renders n
  frames and `__crown.ev("js")` runs code inside the page's scope (FLIGHT, CROWN, U, camera, setSun ...). Each frame takes
  about 8 s at 960×540 in SwiftShader; long jobs must run in the background (`nohup ... &`).

**Demo 2, old palace**: source in `palace/src_old/` (its build script is in git history, commit c2e231b). It will be
deleted when the new build replaces it; it stays in git history.

**Design book** (`palace/design/`): static pages, no build step.
- `book.css` and `book.js` are shared by every page. `book.js` adds the top bar, the chapter menu, the page turn and the
  footer, and has SVG helpers (`BOOK.S`, `BOOK.T`, `BOOK.path`, `BOOK.scalebar`, `BOOK.north` ...). Each page sets
  `<body data-ch="site">` and draws its own figures in a script at the end. Chapters: `site.html`, `crown.html`,
  `pentagon.html`, and the rest as listed in `BOOK.CH`.
- Map figures use real NASA imagery: `BOOK.marsImagery()` lays Esri OnMars tiles (Viking MDIM 2.1 colour mosaic,
  `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`, 512 px, geographic) over
  `img/mars-map.jpg`, a simplified stand-in map baked by `python3 palace/tools/bake_marsmap.py`. The sandbox this was
  built in can't reach astro.arcgis.com, so the tiles are only seen in a real browser.
- Pictures in `img/` come from the demo 2 debug build: `python3 palace/tools/book_renders.py [names]` renders the views
  listed in the script (fixed cameras via `SHOT(...)`, or flight times). Thumbnails `img/th-*` are cropped from them or
  drawn as SVG. `flight-crater.jpg` is rendered but not used yet. `atlas-teaser.jpg` is a screenshot of the Atlas at
  the house (`atlas_shot.py` with the UI hidden).
- The live site can't be fetched from the sandbox (the proxy refuses github.io with 403), so check deployed pages in a
  browser, or ask Jim to open them.
- Check pages with `python3 palace/tools/book_shot.py site,crown light [phone]`: section screenshots in
  `palace/tools/out/`, script errors, missing files and page overflow. Tiles are faked from the stand-in map with yellow
  outlines so their placement can be checked (`TILES=none` makes them fail instead).
- **The Mars Atlas** (`atlas/index.html` + `atlas/atlas.js`): three.js r128, camera-relative rendering in km, a quadtree
  of OnMars tiles (MDIM and the colour elevation map), the planets and moons, and Jim's site placed in the demo's frame
  (metres, x east, z south, the Crown at the origin). `atlas/site-terrain.jpg` is the demo's own 40 × 12 km landscape
  seen from above, baked by `python3 palace/tools/bake_site.py` (about 17 min, run in the background). Test with
  `python3 palace/tools/atlas_shot.py '[["name", "js", waitMs]]' 1280x720 fake|none`; `window.__atlas` has `jump(k)`,
  `select(id)`, `flyTo({...})` and `CAM`. Links can open a view: `atlas/#place=house` or `atlas/#@lat,lon,distkm,...`.

**Demo 2 plans**: edit `palace/plans/index.html` directly. It is one self-contained page, and every drawing is SVG built by its script. The geometry constants sit near the top of the script:
- `CR` is the Crown.
- `PG` is the Pentagon.
- `SEGS` holds the Crown's rooms.
- `LEVELS` holds the Pentagon's rooms.

The areas on the page are computed from these constants, so keep the numbers in the text in step with them. Check with `python3 palace/tools/plans_snap.py light` (or `all`). It writes one PNG per sheet to `palace/tools/out/`.

**Test environment notes.** WebGL runs in SwiftShader. Load waits allow up to 400 s, and demo 1 bakes its light in about 6 s. If the three.js r128 CDN is blocked, put `three.min.js` in `ttmath/tools/` or `palace/tools/`; both paths are git-ignored. If Google Fonts is blocked, the plans tool uses local stand-in fonts.

## 4. Working with Jim

- Show plans before building details, and wait for his approval.
- It must look real: real materials, never cartoon.
- Everything goes to this GitHub repo and the live site. Don't deliver as a chat-app artifact.
- Keep all progress committed so another account or AI can continue.
- Before anything opens on his screen, say what it is and how to use it.
- He views the demos on his laptop. Share links; don't drive a browser on his machine.
- He prefers short, direct answers.
- A possible future Scotiabank demo needs branding permission, or an "unofficial concept" label.

## 5. File map

```
index.html              hub page
HANDOFF.md              this file
data/                   NASA terrain for demo 1 (Dingo Gap tiles as base64 text)
ttmath/                 demo 1: index.html (built), logo.png, REQUIREMENTS.md
ttmath/src/             page.html (source page), blocks/*.js, assemble.py, build.py
ttmath/tools/           Playwright tests; hraster.npy + lay/ for the hidden check
palace/                 demo 2: index.html (built, still the old palace), REQUIREMENTS.md, build.sh, tools/
palace/src/             demo 2 new build (in progress)
palace/src_old/         demo 2 old palace source, to be deleted when the new build goes live
palace/tools/crown_shot.py   headless screenshots of the new build
palace/plans/           demo 2 redesign floor plans (index.html, self-contained)
palace/tools/plans_snap.py   screenshots of the plans page
palace/design/          the design book: index.html (cover), site/crown/pentagon.html ..., book.css, book.js, img/
palace/design/atlas/    the Mars Atlas: index.html, atlas.js, site-terrain.jpg
palace/tools/book_shot.py, book_renders.py, atlas_shot.py, bake_site.py, bake_marsmap.py   tools for the design book
.github/workflows/pages.yml  deploys to GitHub Pages on every push to main
```
