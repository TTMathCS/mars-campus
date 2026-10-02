# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 1 Oct 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## 0. Where the work stopped (2 Oct 2026, about 03:20 UTC) — read this first

The site is **Mars – No Way Home** (Jim's name). Demo 2 is now **the design plan** (`palace/design/`); the real-time
3D pages are unlinked. Everything is pushed; the render scratch work lives in `palace/tools/render/`.

**Jim's latest asks, in order (the top one is the priority):**
1. *"I need you really put focus on the overall construction image (real and 3d)"*: the design plan's front page
   must show the whole construction (the Crown floating over the Stone Garden, the Orb, the Pentagon's five levels
   below in a cutaway), path-traced, and turnable in 3D; the homepage's demo 2 card shows the same picture (it shows
   `palace/design/img/crown-sunset.jpg` until then).
   - The model: `palace/tools/render/overall.py` (first draft written; a 960×540 test, `hero`, rendered in 53 s; its
     look still to check). Jobs: `hero` (the picture), `turn<i>of24` (frames of a turntable, camera at bearing
     234 + 15·i), `spots` (screen positions of the parts per frame, JSON, for clickable labels).
   - Then the explorer (to build): on the design plan's front page the turntable with labels; click the Crown, the
     Orb or the Pentagon to open its floor plan (the sheets in `palace/docs/img/plans/`, rooms as clickable polygons:
     `palace/tools/plan_maps.py` already computes every room's polygon in sheet pixels); click a room for a pop-up
     with its pictures, 360° view (`../tour/index.html?embed#<stop>`) and facts (the room data in
     `palace/tools/gen_plan.py`).
2. Every room path-traced (photos and 360s), each shown in the design plan with its purpose, facts and floor plan.
   `python3 palace/tools/gen_plan.py` rebuilds the area pages (`rooms-crown`, `rooms-residence`, `rooms-atrium`)
   from the room data and picks up every render that is in the tour.

**Renders: how to carry on after a restart.** The scenes and tools are in `palace/tools/render/` (copy them into a
scratch folder with `bvenv` = a Python 3.11 venv with `bpy==4.2.0` and Pillow, and the assets from
`fetch_assets.py` + `make_spines.py`). Two job lists, one per lane, run by `runner.py` (each line a command; done
lines drop off; 360s render in six bands kept on disk, so a restart loses one band):
`queue_a.txt` (the Pentagon: the dining room 360 is next, then the library, the baths, the cinema, the master suite
down, the fire 360's two openings, the atrium 360s, two stills) and `queue_b.txt` (the Crown: the bedroom 360, the
salon 360 moved off the table, the library and map room, the pool, dining, arrival, sunset; and a floor plan from
above for each room, `plan:<view>` jobs, see `plan_render.py`). Start: `python3 blend/runner.py a` and `... b` from
the scratch folder. Publish a finished 360 or still with `pub.py` (`pano <file> <stop>` / `photo <file> <name>
<caption>`), then re-run `gen_plan.py`, commit and push.

**Done today:** one demo 2 card (Jim: "you kept making such mistake"); the tour merged into the design plan; area
pages with every room's purpose, facts, floor plan and pictures/360s playing in the page; the Mars Atlas as a
picture in the homepage header; the music room's 360 (its far end furnished: records, turntable, speakers); the
Crown's salon and bedroom stills; new rooms modelled and tested: the great library, the thermal baths, the cinema,
the master suite down redone (suite.py), the Crown's library with a 3 m Mars globe and its 25 m pool.

## 1. Status

| Part | Where | State |
| --- | --- | --- |
| Hub page | `index.html` | Live, titled **Mars – No Way Home**. One card per demo, never more; the demo 2 card opens the design plan. The Mars Atlas is a picture at the top right. |
| Demo 1, TTMath on Mars | `ttmath/` | v0.7 live and finished: one integrated campus, real rooms, real materials. See `ttmath/REQUIREMENTS.md`. |
| Demo 2 home | `palace/README.md` | **Start here for demo 2.** Links the requirements, the decision log, the design chapter by chapter, the floor plans and every picture, all viewable on GitHub. |
| Demo 2, requirements | `palace/REQUIREMENTS.md` | Rewritten 1 Oct 2026 by area (GN, ST, CR, OR, PG, LV, TR, SY, DM), with status and links. **No open questions.** |
| Demo 2, design book | `palace/design/` | **Rev E, live** at https://ttmathcs.github.io/mars-campus/palace/design/. Chapters 01–07 written; 08 Life support, 09 Communications and space, 10 Building it still to write. For Jim's review: the Orb, Rev E. |
| Demo 2, floor plans | `palace/plans/` | Rev B, **approved by Jim on 30 Sep 2026** ("Approve. Go"). B.1 (1 Oct): the garden mirrors and the solar field taken off at his request. The Orb is still drawn as Rev B. |
| Demo 2, 3D build | `palace/src/` → `palace/index.html` | **Phase 1 live** since 1 Oct 2026 (Jim, the night before: "please go ahead to build, you have my pre approve"): terrain, sky, spaceport, pod, the Crown with the Orb and the built ground, storm, the 10-shot flight, cameras, look-around. Phase 2 is live: **the Crown's main floor** at `palace/crown/` (the hangar, the Door, the Arrival hall, the Glide, 30 furnished rooms, the sun through the slots at five times of day, a map, portals) and **the Orb** at `palace/orb/` (the universe switch, the zoom from the cosmic web to the house, the Earth and Mars dashboard, the Gate sending you to demo 1). Phase 3 has started: **the Pentagon** at `palace/pentagon/` (the atrium, its bridges and the portal column; the rooms of ring A seen through the glass on every level; the garden level with the lake, forest, orchard, farm and meadow; the sun court; Jim's residence on L1 to walk into, with the piano, the TV and the books). Next: the rest of L1. |
| Demo 2, photo tour | `palace/tour/` | **Live since 1 Oct 2026.** Jim found the real-time 3D pages cartoonish ("WTH IS THIS? CATOON? nothing is real or feel real at all"), so the house is now shown as path-traced 360° photographs (Blender Cycles, scanned furniture). He likes them ("so great and almost perfect. i need all rooms to be like this"): **every room is to be rendered this way.** Live: the family room. Rendering: the rest of Jim's L1 rooms, the atrium, the sun court; next the master suite down, the Crown's rooms (the great salon first), then the Orb. The scenes are scripts in `palace/tools/render/`. |
| Demo 2, first palace | `palace/archive/old-palace/` | Archived (Jim rejected it: "far from satisfactory"). Its requirements are in `palace/docs/archive/old-palace.md`. |

## 2. Demo 2: where the design stands

The full record is in `palace/docs/decisions.md` (every question, Jim's words, what changed). In short:

- **Above ground: the Crown.** A white ring 276 m across floats on anti-gravity 40 m over the Stone Garden, with five
  spires to 90 m and no big windows. At its centre floats the **Orb**, a mirror ball 40 m across.
- **The Orb, Rev E (1 Oct 2026, for Jim's review).** The universe is **future-tech VR**: switched on, it appears in 3D
  directly in the space of the room, all round, with no projector, no screen and no ball (Jim: "not projector",
  "not inside a ball", "projected directly in the 3d space"). Jim zooms it like a 3D dashboard, from the whole universe
  down to Mars and the house; Earth and Mars float in the corner of his view with live weather, and can be hidden.
  The ball in the middle, 18 m across, is the **Wormhole Gate**: choose a place and a time in the universe, walk
  across a short bridge into the ball (things ride in on a cart or with a robot), press send, and it shoots you like a
  beam of light to that place and time, instantly ("this is how wormhole works"). The far end is a ball too, for the
  way back. Rooms on three rings round it: +64 portal ring, +72 Universe lounges and the bridge, +80 five rest rooms
  behind radiation glass.
- **The ground, Rev E (1 Oct 2026, for Jim's review): built, not raw** (Jim: "the ground is raw and need some
  construction/design as well. and at least some hints that there is big part underground", GN-13). A **paved
  pentagon** 4 m wider than the Pentagon shows where the house lies; the **Stone Garden** (raked gravel 224 m across,
  seven basalt stones) is the circle inside it; five strips of glass trace the avenues; a glass **corner pavilion**
  holds each corner stair; basalt pads lie under the spires. At the centre the **Orb's dock** (Jim: "some interface
  when orb can land on the ground", OR-9) rings the **Sun Well**, the sky lens over the Pentagon's atrium. Still
  **nothing spread over the ground**: no mirrors and no solar panels (GN-12).
- **Below ground: the Pentagon.** One solid pentagon, 160 m sides, five levels 24 to 68 m down under 16 m of soil,
  eleven times the Crown's floor area. Jim sleeps here (the master suite down on L1).
- **Arcadia Spaceport**, 30 km due east on landing zone AP-1: three pads, terminal, pod station, fuel plant, ice mine.
- **Power:** four 5 MWe fission microreactors, two on the Pentagon's L4 and two at the port, joined by a 30 km DC
  cable. No solar field.
- **The pod flight home:** about 37 km and 4 min 40 s, through a dust storm into the blue sunset.
- **The city** grows from the house on a sunflower spiral (golden angle), with civic buildings on the Fibonacci seeds.

Decided on 1 Oct 2026 (Jim answered, or asked for our best judgment): site on **AP-1** at 39.80° N; air at
**70 kPa with 27% oxygen**; **sleep below ground**, with rest rooms in the Orb; **Jim moves in 2027** (launch window
Nov–Dec 2026); the Gate's demo default opens on the **TTMath campus** in Gale crater; the guest rooms stay; all four
demo extras stay as nice-to-haves; **visitors are rare**.

How Jim got here: rounds 1–2 built the first palace (archived) → Rev A floor plans → Rev B, the floating Crown,
approved 30 Sep → Rev C, the design book, because Jim wants every plan designed before more 3D work (30 Sep) →
Rev D, the Universe Hall, his decisions and the clean ground (1 Oct) → Rev E, the universe in VR and the ball as
the Wormhole Gate (1 Oct). The revisions are listed on the book's cover.

**Build order** once Jim approves the design book. Each phase is published at `palace/` (same link):
1. The 30 km landscape, the spaceport and the pod flight video.
2. The Crown and the Orb.
3. The Pentagon, one level at a time.

## 2b. Next steps, in order

1. **Jim's review of the Orb (Rev E).** If he asks for changes, update `crown.html` (the Orb section and its figures
   `fOrbIn`, `fDash`, `fZoom`), `interiors.html` (the Orb room cards), `docs/design/02-crown.md` and the decision log,
   then re-export the drawings (section 3).
2. **Write chapter 08 Life support** (`life.html`): air at 70 kPa with 27% oxygen (decided; breathes like Calgary;
   NASA's exploration atmosphere is 56.5 kPa with 34%); oxygen from electrolysis and the fuel plant's spare 100 t a
   ship; CO₂ scrubbing; the water loop (ice melt, over 95% recycling, the L2 lake as the reserve, the Crown's 90,000 t
   of wall ice); food from the L2 farm under lamps, the storm reserve of two years on L4; heating from reactor heat;
   radiation with a dose budget (open plain about 230 mSv a year, the Crown about a third behind 3 m of ice, the
   Pentagon about 1, Jim's target about 20 by sleeping below and spending about 6 h a day in the Crown and the Orb);
   dust and perchlorates (suit ports, filters); fire safety at 27% oxygen; the medical centre on L3.
3. **Write chapter 09 Communications and space** (`space.html`): radio delay 3 to 22 min one way; three areostationary
   relays at 17,032 km up (orbit radius 20,428 km) plus a relay off to the side of the Sun for the two weeks of solar
   conjunction every 26 months; laser links; the fibre to the port; Phobos (9,376 km orbit, 7.65 h, rises in the
   west) and Deimos (23,463 km, 30.3 h); Mars time (sol 24 h 39 min 35 s, a year of 668.6 sols, a Mars clock in every
   room); Earth as an evening or morning star; the live Earth and Mars weather on the Orb's dashboard. The Atlas
   already draws the relays and the moons.
4. **Write chapter 10 Building it** (`phases.html`): year 0 is 2027, when Jim lands. Robots land two launch windows
   ahead (about 4½ years before); the order of work (power and the fuel plant at the port first, then the road and
   cable, the Pentagon dig and L4/L5, the Crown's pads and ring, the gardens); the city's phases 1 to 4 (chapter 01).
   Use a timeline drawing with the 26-month windows.
5. For each new chapter: add it to `READY` in `book.js`, write its page in `palace/docs/design/` (copy the pattern of
   01–07), add its figures to `BOOK` in `docs_export.py` and export, add its requirements' links in
   `REQUIREMENTS.md`, check it with `book_shot.py` (desktop, phone and dark), commit, push and tell Jim what it is
   before he opens it.
6. **The 3D demo** (Jim pre-approved the build on 1 Oct 2026): phase 1 is live at `palace/`, phase 2 (the Crown's main
   floor and the Orb) at `palace/crown/` and `palace/orb/`, and phase 3 has started at `palace/pentagon/`. Next in
   the Pentagon: the rest of L1 (the club and cinema, the baths and the 50 m pool, the great library, the guests),
   then the corner cores and the rooms of L3 to L5. Still to come above ground: the spires' upper floors and the Orb's rest rooms. When Jim
   approves Rev E, redraw the floor plans' Orb and ground (Rev C of the plans).

## 2c. Numbers used across the design book

Keep new pages consistent with these (sources and working are in the chapters):
- Site: the Crown at 39.80° N 201.44° E, Arcadia Spaceport on AP-1 at 39.80° N 202.10° E, 30 km apart; ground −3.9 km,
  air 870 Pa (40% above the Mars average); ice within 1 m and tens of metres thick; AP-9 thick ice 58 km east of the
  port. House to Olympus Mons 1,780 km, to Gale crater (TTMath campus) 4,360 km, to Jezero 6,030 km.
- The Crown: ring 244–276 m across (radius 122–138), underside +40, main floor +41, roof 50 + 40·c⁶ (spires +90,
  dips +50), where c = (1 + cos 5φ) / 2; walls and roof 3 m (0.1 skin, 0.3 sintered shell, 2.2 ice, 0.2 aerogel, 0.2
  liner); about 90,000 t of wall ice; mass about 155,000 t, 115 MN per drive. Floor area **19,110 m²** (main floor
  9,950 + the Glide 3,120 + spire upper floors 3,630 + the Orb 2,410), 5.6 times the TTMath campus.
- The Orb: Ø 40 m, +52 to +92; a round space Ø 24 m from +60 to +84 with the Wormhole Gate in it, a ball Ø 18 m; a
  bridge 3 m wide from the +72 floor to the Gate; rings at +64, +72 and +80 of 804 m² each; five rest rooms on the top
  ring.
- The Stone Garden: Ø 224 m (gravel to r 112 m), raked gravel and seven basalt stones of 2 to 4 m; no mirrors, no
  panels. The Sun Well lens Ø 20.4 m, a sky lens with lamps; it closes under an iris in a storm.
- The built ground: paved pentagon with inradius 114.1 m and circumradius 141.0 m (166 m sides), corners at bearings
  18 + 72k like the Pentagon's, slabs 3 × 1.5 m, a basalt kerb 1.6 m wide with a light line 0.8 m in; the Orb's dock
  a basalt lathe ring r 12–15.4 m, 5.5 m high, bronze band at 5.5–5.64, five bronze pads at r 13.5 m with tops at
  6.9 m (a seated Orb clears the ring by 0.23 m); spire pads r 7 m at r 130 m with bronze rims; glass strips 0.72 m
  wide in paved bands 2.6 m wide from r 15 to 111 m along bearings 18 + 72k; corner pavilions at r 116 m (plinth
  9.6 × 12 m, glass 6.2 × 8.2 × 2.9 m, roof 8.6 × 11 m at 3.3 m, door facing the garden).
- The Pentagon: 160 m sides, circumradius 136.1 m, atrium 35 m sides, rings A–E 14 m deep with 4 m streets, 5 m
  avenues, levels L1 −24 (top −16), L2 −41 (16 m tall), L3 −50, L4 −59, L5 −68; 41,940 m² a level, 209,700 m² in all
  (11 times the Crown); 16 m of soil; the dig 3.1 million m³ and 1.5 million t of ice.
- Air inside: 70 kPa with 27% oxygen.
- Power, phase 1: demand 8 MW average (house 4.9, port 3.1), about 14 MW peak; four 5 MWe heat-pipe microreactors,
  two on L4 and two in a vault at the port, 9 MW available at each end (18 in all); no solar field; batteries
  2 × 20 MWh; fuel cells 8 MW on stored methalox (about 9 days at full load); DC link 30 km at ±20 kV, 15 MW, about
  1.5% loss; heat at the house about 10 MW (2 MW warms the house, 8 to the radiators), radiators 150 × 60 m, 400 m
  north, up to 20 MW.
- Transport: the pod is 9.2 × 4.5 m, 4 seats, about 6 t, 22 kN on Mars, top speed 680 km/h, about 1.5 t of methalox
  for the scenic flight (37 km, 4 min 40 s), about 1 t for a direct hop; the bus 12 seats at 40 km/h, 45 min; the
  maglev (phase 2) 30 km at 400 km/h in a 7 m tunnel at −68 m, about 6 min; Hohmann transfer 259 days, windows every
  26 months; Jim launches Nov–Dec 2026 and lands mid-2027.
- The spaceport: three pads Ø 80 m with berms (radius 114–147 m, 6 m high) at bearings 60, 90 and 120, 1.6 km from
  the terminal (Ø 180 m); tower 77 m; pod station 70 × 120 m with four pod pads; two reactor domes south-west of the
  terminal; one ship's propellant 1,200 t (260 t CH₄, 940 t O₂, plus 100 t spare O₂) from 585 t of water and 715 t of
  CO₂, about 8.6 GWh, about 5 months at 2.4 MW; tank farm six spheres Ø 36 m; ice mine 320 × 200 m, 9 m deep, 1 km
  north.

## 3. How to work on each part

**Publishing.** Every push to `main` deploys the site through `.github/workflows/pages.yml`. The workflow first checks
that key files exist (among them `palace/index.html` and `palace/REQUIREMENTS.md`). It takes about a minute.
**Work on `main` directly** (Jim, 1 Oct 2026: "only main is needed"): commit and push to `main`, no separate branches.
Check everything before pushing, because every push goes live.

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

**Demo 2 docs** (`palace/README.md`, `palace/REQUIREMENTS.md`, `palace/docs/`): Markdown that Jim reads on GitHub.
- Every page has the same nav line at the top: Demo 2 home · Requirements · Decisions · Design · Floor plans · Pictures.
- `docs/design/0N-*.md` is a summary of each design book chapter with its drawings; the live chapter is linked at
  the top. Keep the two in step when a chapter changes.
- The drawings in `docs/img/` are exported from the live pages: `python3 palace/tools/docs_export.py [book|plans|atlas|all]`.
  It writes `docs/img/book/<chapter>-<name>.png` (the figure list is `BOOK` at the top of the script),
  `docs/img/plans/<sheet>.png` and `docs/img/atlas/<view>.jpg`. Re-exports of unchanged drawings can differ by a
  pixel of layout; restore those with `git checkout` so commits only carry real changes.
- Pictures (renders) live in `palace/design/img/` and are listed in `palace/design/img/README.md` and
  `docs/gallery.md`.
- When Jim answers or asks for something new: add it to `REQUIREMENTS.md` first, log his words in `docs/decisions.md`,
  then change the design.

**Demo 2, 3D build** (`palace/src/`): plain JavaScript on three.js r128, no build tools beyond `sh`.
- `palace/build.sh` joins `src/00_head.html` and `src/[1-9]*.js` (in name order, inside one function) into one page.
  - `sh palace/build.sh debug` writes `palace/palace-debug.html` (git-ignored) with test hooks. Use this while working.
  - `sh palace/build.sh` writes the published `palace/index.html` (phase 1 is live). Run it after every change to
    `src/` and commit the result with the source.
- Source files: `10_core.js` renderer, shared uniforms, shader chunks, HDR bloom and tone mapping; `20_sky.js` sun,
  sky, Phobos, stars; `30_terrain.js` the height function (GLSL and a JS twin that must match), ground detail (dunes,
  speckle pebbles, frost, dust) and ten nested terrain grids; `40_mat.js` building material (patterns 1 shell, 2 solar
  (unused now), 3 pad, 4 steel, 5 pod skin, 6 white ceramic, 7 soft-touch trim; optional `ENV_CUBE` reflections) and
  shadow map; `45_lights.js` point lights; `50_port.js` spaceport (two reactor domes, no solar field); `55_pod.js` pod
  and cockpit; `60_crown.js` the Crown, the Orb, the Stone Garden (`STONES`, smooth-normal boulders, no mirrors), the
  Orb's dock and the corner pavilions (the paving, kerb, glass strips and pads are drawn in the terrain shader);
  `70_fx.js` dust devils, storm, sparks; `80_flight.js` the path, the ten shots and the cameras; `90_ui.js` HUD,
  cards, look-around, sound; `99_main.js` the main loop.
- World: metres, x east, z south, y up, the Crown's centre at the origin, the spaceport terminal at x = 30 000. Plan
  coordinates (x, y north) map to world (x, −y). Every vertex shader bends the world with the curvature of Mars.
- Test: `python3 palace/tools/crown_shot.py '[["name", "js", waitMs], ...]' 960x540` loads the debug page headless and
  saves PNGs to `palace/tools/out/`. In the page, `__crown.at(t)` jumps the flight video to time t (director's
  camera), `__crown.view(x, y, z, tx, ty, tz)` places the camera, `__crown.exp(e)` sets the exposure, `__crown.step(n)`
  renders n frames and `__crown.ev("js")` runs code inside the page's scope (FLIGHT, CROWN, U, camera, setSun ...).
  Each frame takes about 8 s at 960×540 in SwiftShader; long jobs must run in the background (`nohup ... &`). Node
  helpers: `shot.js`, `probe.js` (evaluate one expression), `grid.js` (contact sheet of a folder of PNGs).
- **Pictures for the book:** `python3 palace/tools/book_renders.py [name,name,...]` renders the views listed in
  `RENDERS` (a fixed camera via `SHOT(...)`, or a time in the flight) to `palace/design/img/<name>.jpg`, 1600 × 900,
  about 25–45 s each. Set `RENDER_OUT=some/dir` to try views without touching the book. Jim judges every picture on
  whether it looks real; drop a view rather than publish one that looks like a game (the cockpit view was dropped on
  1 Oct 2026 for that reason).

**Demo 2, the Crown's main floor** (`palace/crown/index.html`): one self-contained page, three.js r128. Read
`palace/crown/README.md` first. The ring is built in 9° chunks from `roofTop(b)` and `ceilAt(b)`; `ROOMS` comes from
`SEGS` (the same list as chapter 02); each room's furniture is placed in its frame (`roomFrame`: x clockwise round the
ring, z towards the garden) with the kit (`sofa`, `table`, `bed`, `shelves`, `piano`, `tree`, `fern`, `pool` ...).
Light: a 4096 shadow map that follows you, `TOD` for the five times of day, and `probe()`, a cube camera turned into
image-based light every 14 m. Test with `python3 palace/tools/crown_in_shot.py`.

**Demo 2, the Orb** (`palace/orb/index.html`): one self-contained page, no build step, three.js r128. Read
`palace/orb/README.md` first. Levels are built in `LV` (web, mw, sol, mars, arc, home, earth), each a group with a slow
spin, a focus point where its child level sits, and labels; `go(id)` zooms there through the chain (`PARENT`).
`ASTRO` has the planets' positions today, the Mars clock (Mars24's algorithm) and the Sun over Earth; `DASH` draws the
two globes into the canvas behind the dashboard and fetches Earth's weather (Open-Meteo) for the home town kept in
`localStorage`. The send sequence is `sending()`. Test with `python3 palace/tools/orb_shot.py` (`?debug` exposes
`window.__orb`); the planet maps come from `python3 palace/tools/fetch_textures.py`.

**Demo 2, the Pentagon** (`palace/pentagon/index.html`): one self-contained page, no build step, three.js r128. Read
`palace/pentagon/README.md` first. `LV` holds the five levels; the atrium is built side by side (`onSide(a, k, t, y)`:
the point at apothem `a` on side `k`, a fraction `t` along it). The rooms behind the glass are interior-mapped: `ROOMS`
lists them per level and side as on the plans, and `ROOM_FS` draws each kind (walls, floor, ceiling, lights, then the
furniture on a plane halfway back). `GARDEN` builds L2 (`lakeD` is the lake's shape, `each(sector, ...)` plants a sector
row by row, `BLOCK` holds what you can't walk through); its sky shader also draws the far horizon on the outer walls.
`canStand` decides where you can walk. `RES` is Jim's residence on L1 (walkable rooms, built in (a, u) coordinates
with the Crown's furniture kit) and `ACTS` the things to do there. Static meshes are merged by material at the end
(`mergeStatic`; the residence separately, so its shell can stop casting shadows on L2). The render
target has a 24-bit depth buffer (three r128 gives render targets 16 bits otherwise, and surfaces 2 cm apart flicker).
Test with `python3 palace/tools/pentagon_shot.py` (`?debug` exposes `window.__pent`). The probe's re-captures fade in
over 1.5 s (`ENVB`: every standard material's shader blends the previous environment map into the new one); a sudden
swap made the rooms flash every few seconds as you walked (Jim, 1 Oct 2026). The Crown has the same `ENVB`.

**Demo 2, the photo tour** (`palace/tour/`): read `palace/tour/README.md` first. The viewer `index.html` (three.js r128,
no build step) puts each 360° JPEG from `pano/` on the inside of a sphere; `stops.js` lists the stops (where each was
taken in the family room's frame, where you look first, the rings it shows; a ring can sit at a portal). The pictures
are rendered by Blender 4.2 (the `bpy` wheel from PyPI, Python 3.11) from the scripts in `palace/tools/render/`:
`lib.py` (materials, modelling, lights, cameras), `furn.py` (the piano, bookcases and books, lamps, rugs, paintings,
olive trees), `atrium.py` (the atrium on every level, the column, the sun court, the roof and sky lens), `family.py`
(Jim's rooms and their lighting; `CAMS` are the stills), `pano.py` (`STOPS` are the 360s, with their exposure) and
`final.py` (renders a list of both). Fetch the models and textures with `fetch_assets.py` first. Look at a quick
preview (1024 px, 12 samples, about a minute) before a final (4096 px, 32 samples, about 25 minutes on 4 cores), and
look at every final critically before it goes up.

**Demo 2, first palace**: the built page is `palace/archive/old-palace/index.html`; its source is in git history
(before commit 0f7a717, `palace/src_old/`; build script at commit c2e231b).

**Design book** (`palace/design/`): static pages, no build step.
- `book.css` and `book.js` are shared by every page. `book.js` adds the top bar, the chapter menu, the page turn and
  the footer, and has SVG helpers (`BOOK.S`, `BOOK.T`, `BOOK.path`, `BOOK.scalebar`, `BOOK.north` ...). Each page sets
  `<body data-ch="site">` and draws its own figures in a script at the end. Chapters are listed in `BOOK.CH`; the ones
  in `READY` are live.
- Map figures use real NASA imagery: `BOOK.marsImagery()` lays Esri OnMars tiles (Viking MDIM 2.1 colour mosaic,
  `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`, 512 px, geographic) over
  `img/mars-map.jpg`, a real colour map of Mars (Solar System Scope, CC BY 4.0) made by
  `python3 palace/tools/fetch_marsmap.py`. Credit both in captions and the footer.
- Thumbnails `img/th-*` are cropped from the renders or drawn as SVG.
- Two pictures come from their own small three.js scenes in `palace/tools/`, rendered by
  `python3 palace/tools/scene_render.py orb|mars ['{"key": value}'] [out.jpg]` (a few seconds each):
  `orb_scene.html` → `img/orb-universe.jpg`, inside the Orb with the universe switched on (HDR bloom and ACES as in the
  demo, a planar reflection in the floor, a particle galaxy over a spiral body shader, the Gate's lensed far sky);
  `mars_scene.html` → `img/atlas-teaser.jpg`, Mars from orbit on the real colour map, for the Atlas card. The book's
  views are the defaults (`VIEW` in each scene). Jim rejected people drawn as mannequins: leave figures out of renders.
- Labels stay readable in both themes: `legible()` in `book.js` finds the shapes under each SVG label after the
  drawings are made and, where a label would be hard to read (dark mode puts light ink on the fixed light material
  colours), switches it to the dark or light ink of its kind. Draw in the light theme and let it handle dark.
- Check pages with `python3 palace/tools/book_shot.py site,crown light [phone]`: section screenshots in
  `palace/tools/out/`, script errors, missing files and page overflow. Tiles are faked from the base map with yellow
  outlines so their placement can be checked (`TILES=none` makes them fail instead).
- **The Mars Atlas** (`atlas/index.html` + `atlas/atlas.js`): three.js r128, camera-relative rendering in km, a
  quadtree of OnMars tiles (MDIM and the colour elevation map) over the real base map, the planets and moons, and
  Jim's site placed in the demo's frame (metres, x east, z south, the Crown at the origin). `atlas/site-terrain.jpg`
  is the demo's own 40 × 12 km landscape seen from above, baked by `python3 palace/tools/bake_site.py` (about 17 min,
  run in the background). Test with `python3 palace/tools/atlas_shot.py '[["name", "js", waitMs]]' 1280x720 fake|none`;
  `window.__atlas` has `jump(k)`, `select(id)`, `flyTo({...})` and `CAM`. Links can open a view:
  `atlas/#place=house` or `atlas/#@lat,lon,distkm,...`.

**Demo 2 plans**: edit `palace/plans/index.html` directly. It is one self-contained page, and every drawing is SVG
built by its script. The geometry constants sit near the top of the script:
- `CR` is the Crown.
- `PG` is the Pentagon.
- `SEGS` holds the Crown's rooms.
- `LEVELS` holds the Pentagon's rooms.

The areas on the page are computed from these constants, so keep the numbers in the text in step with them. Rev B is
approved, so change it only for what Jim asks, and say so on the page (`.newer` at the top, `.since` under a sheet),
as B.1 did for the clean ground. `STONES` holds the Stone Garden's seven stones, the same list as in the design book
and `src/60_crown.js`. Check with `python3 palace/tools/plans_snap.py light` (or `all`). It writes one PNG per sheet to
`palace/tools/out/`.

**Test environment notes.**
- WebGL runs in SwiftShader. Load waits allow up to 400 s, and demo 1 bakes its light in about 6 s.
- Python Playwright must match the installed Chromium: in the cloud sandbox `pip install playwright==1.56.0` works
  with `/opt/pw-browsers/chromium-1194`. Don't run `playwright install`.
- three.js r128: if the cdnjs CDN is blocked, get it from npm (`npm pack three@0.128.0`, then copy
  `package/build/three.min.js`) into `palace/tools/` or `ttmath/tools/`; both paths are git-ignored.
- The NASA tiles (`astro.arcgis.com`) and the live site (github.io) can't be reached from the sandbox, so check
  deployed pages in a browser, or ask Jim to open them. Google Fonts and raw.githubusercontent.com can be reached.

## 4. Working with Jim

- Show plans before building details, and wait for his approval.
- It must look real: real materials, never cartoon. Every picture is judged on that; replace or drop one that isn't.
  On 1 Oct 2026 he rejected the real-time 3D pages as cartoon; path-traced renders (the photo tour) are the standard.
- Keep the ground clean: no fields of panels or mirrors ("so ugly", "very messy").
- Docs must be easy to navigate: several short files, tables and bullets, pictures visible on GitHub.
- Don't leave answered questions on any page. Record his answer in the decision log and move on.
- Everything goes to this GitHub repo and the live site. Don't deliver as a chat-app artifact.
- Keep all progress committed so another account or AI can continue.
- Before anything opens on his screen, say what it is and how to use it.
- He views the demos on his laptop. Share links; don't drive a browser on his machine.
- He prefers short, direct answers.
- "Try again" from him has meant "the session stopped; carry on" as well as "redo it": check whether work stalled.
- **Demo 2 is the design plan** (2 Oct 2026): the homepage card opens `palace/design/`, *Jim's Retirement House ·
  Design Plan*. The real-time 3D pages (the flight, the Crown, the Orb, the Pentagon) are hidden from the homepage
  ("far from satisfying"); keep them unlinked until he says otherwise. Every area and room gets its purpose, facts,
  floor plan and pictures/360s: edit the room data in `palace/tools/gen_plan.py` and re-run it after each render.
- **The homepage has one card per demo, never more.** A new part of a demo (the photo tour, a new page) is a link
  inside that demo's card. He has had to say this twice ("why I have 2 demo 2? you kept making such mistake").
- **Floor plans always show in full**, never cropped round a room ("the L1 floor plan doesn't show full"): the room is
  shaded on the whole sheet (`palace/tools/plan_maps.py`), and a click enlarges it.
- Long renders die when the container restarts: render 360s in bands (`lib.render_pano`) and publish each finished
  picture at once, so a restart costs minutes, not the night.
- A possible future Scotiabank demo needs branding permission, or an "unofficial concept" label.

## 5. File map

```
index.html                    hub page: one card per demo
HANDOFF.md                    this file
data/                         NASA terrain for demo 1 (Dingo Gap tiles as base64 text)
ttmath/                       demo 1: index.html (built), logo.png, REQUIREMENTS.md
ttmath/src/                   page.html (source page), blocks/*.js, assemble.py, build.py
ttmath/tools/                 Playwright tests; hraster.npy + lay/ for the hidden check
palace/                       demo 2
├── README.md                 demo 2 home: start here
├── REQUIREMENTS.md           what Jim wants: the source of truth
├── docs/                     decisions.md, design/ (chapter summaries), plans.md, gallery.md, img/, archive/
├── design/                   the design book: index.html (cover), site/crown/pentagon/... .html, book.css, book.js
│   ├── img/                  renders, thumbnails and mars-map.jpg (README.md lists them)
│   └── atlas/                the Mars Atlas: index.html, atlas.js, site-terrain.jpg
├── plans/                    floor plans Rev B (index.html, self-contained)
├── src/                      the 3D demo's source; build.sh builds it
├── crown/                    the Crown's main floor, phase 2: index.html (self-contained), README.md
├── orb/                      the Orb, phase 2: index.html (self-contained), tex/ planet maps, README.md
├── pentagon/                 the Pentagon, phase 3: index.html (self-contained), README.md
├── tour/                     the photo tour: index.html (viewer), stops.js, pano/ (360s), photos/, README.md
├── tools/render/             Blender scenes for the photo tour: lib, furn, atrium, family, pano, final, fetch_assets
├── tools/                    crown_shot.py, crown_in_shot.py, orb_shot.py, pentagon_shot.py, book_renders.py, book_shot.py, atlas_shot.py, plans_snap.py,
│                             docs_export.py, fetch_marsmap.py, bake_site.py, scene_render.py with
│                             orb_scene.html and mars_scene.html; shot.js, probe.js, grid.js
├── archive/old-palace/       the first palace, kept for reference
├── build.sh                  builds src/ into palace-debug.html or index.html
└── index.html                the published 3D demo, built from src/ by build.sh
.github/workflows/pages.yml   deploys to GitHub Pages on every push to main
```
