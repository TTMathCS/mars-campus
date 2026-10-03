# The real-time 3D demo (archived)

[Demo 2 home](../../README.md) · archived on 3 Oct 2026

Arcadia's first real-time 3D pages, built with three.js r128 from 30 Sep to 2 Oct 2026. Jim found them cartoonish
("WTH IS THIS? CATOON? nothing is real or feel real at all", 1 Oct) and hid them from the site on 2 Oct ("far from
satisfying"); Arcadia is shown with path-traced pictures and 360° views instead, in the
[design plan](https://ttmathcs.github.io/mars-campus/palace/design/). Everything here is kept as it was, so it can
still be opened and rebuilt; `palace/` itself now opens the design plan.

| Folder | What it is | Live |
| --- | --- | --- |
| `index.html`, `src/`, `build.sh` | Phase 1: the 30 km landscape, Arcadia Spaceport, the pod's scenic flight and the Crown from outside. `sh build.sh` joins `src/00_head.html` and `src/[1-9]*.js` into `index.html`; `sh build.sh debug` writes `palace-debug.html` for the tests | [open](https://ttmathcs.github.io/mars-campus/palace/archive/3d-demo/) |
| `crown/` | Phase 2: the Crown's main floor, walkable, with the Glide and five times of day (see its README) | [open](https://ttmathcs.github.io/mars-campus/palace/archive/3d-demo/crown/) |
| `orb/` | Phase 2: the Orb, the universe switched on, the zoom and the Wormhole Gate (see its README) | [open](https://ttmathcs.github.io/mars-campus/palace/archive/3d-demo/orb/) |
| `pentagon/` | Phase 3: the atrium, the rooms behind its glass, the garden level, the sun court and Jim's residence on L1 (see its README) | [open](https://ttmathcs.github.io/mars-campus/palace/archive/3d-demo/pentagon/) |
| `tools/` | Their headless tests and exports: `crown_shot.py`, `crown_in_shot.py`, `orb_shot.py`, `pentagon_shot.py`, `shot.js`, `probe.js`; `book_renders.py` (the design plan's outdoor pictures, from the phase 1 build), `bake_site.py` (the Atlas's `site-terrain.jpg`, from the phase 1 landscape), `fetch_textures.py` (the Orb's planet maps) | |

The tools run from the repo root as before, with the new paths, for example
`python3 palace/archive/3d-demo/tools/book_renders.py`. They look for three.js in `palace/tools/three.min.js`
(git-ignored; see the handoff's test notes).

The pages follow the design as it was on 2 Oct 2026: the Orb is still 40 m across there, and the rooms are Rev B's.
The design plan and the floor plans (Rev G) are the current design.

## How it was built and tested

These notes were in the handoff while the pages were live (paths updated to the archive).

**Demo 2, 3D build** (`palace/archive/3d-demo/src/`): plain JavaScript on three.js r128, no build tools beyond `sh`.
- `palace/archive/3d-demo/build.sh` joins `src/00_head.html` and `src/[1-9]*.js` (in name order, inside one function) into one page.
  - `sh palace/archive/3d-demo/build.sh debug` writes `palace/archive/3d-demo/palace-debug.html` (git-ignored) with test hooks. Use this while working.
  - `sh palace/archive/3d-demo/build.sh` writes `palace/archive/3d-demo/index.html`. Run it after every change to
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
- Test: `python3 palace/archive/3d-demo/tools/crown_shot.py '[["name", "js", waitMs], ...]' 960x540` loads the debug page headless and
  saves PNGs to `palace/archive/3d-demo/tools/out/`. In the page, `__crown.at(t)` jumps the flight video to time t (director's
  camera), `__crown.view(x, y, z, tx, ty, tz)` places the camera, `__crown.exp(e)` sets the exposure, `__crown.step(n)`
  renders n frames and `__crown.ev("js")` runs code inside the page's scope (FLIGHT, CROWN, U, camera, setSun ...).
  Each frame takes about 8 s at 960×540 in SwiftShader; long jobs must run in the background (`nohup ... &`). Node
  helpers: `shot.js`, `probe.js` (evaluate one expression), `grid.js` (contact sheet of a folder of PNGs).
- **Pictures for the book:** `python3 palace/archive/3d-demo/tools/book_renders.py [name,name,...]` renders the views listed in
  `RENDERS` (a fixed camera via `SHOT(...)`, or a time in the flight) to `palace/design/img/<name>.jpg`, 1600 × 900,
  about 25–45 s each. Set `RENDER_OUT=some/dir` to try views without touching the book. Jim judges every picture on
  whether it looks real; drop a view rather than publish one that looks like a game (the cockpit view was dropped on
  1 Oct 2026 for that reason).

**Demo 2, the Crown's main floor** (`palace/archive/3d-demo/crown/index.html`): one self-contained page, three.js r128. Read
`crown/README.md` first. The ring is built in 9° chunks from `roofTop(b)` and `ceilAt(b)`; `ROOMS` comes from
`SEGS` (the same list as chapter 02); each room's furniture is placed in its frame (`roomFrame`: x clockwise round the
ring, z towards the garden) with the kit (`sofa`, `table`, `bed`, `shelves`, `piano`, `tree`, `fern`, `pool` ...).
Light: a 4096 shadow map that follows you, `TOD` for the five times of day, and `probe()`, a cube camera turned into
image-based light every 14 m. Test with `python3 palace/archive/3d-demo/tools/crown_in_shot.py`.

**Demo 2, the Orb** (`palace/archive/3d-demo/orb/index.html`): one self-contained page, no build step, three.js r128. Read
`orb/README.md` first. Levels are built in `LV` (web, mw, sol, mars, arc, home, earth), each a group with a slow
spin, a focus point where its child level sits, and labels; `go(id)` zooms there through the chain (`PARENT`).
`ASTRO` has the planets' positions today, the Mars clock (Mars24's algorithm) and the Sun over Earth; `DASH` draws the
two globes into the canvas behind the dashboard and fetches Earth's weather (Open-Meteo) for the home town kept in
`localStorage`. The send sequence is `sending()`. Test with `python3 palace/archive/3d-demo/tools/orb_shot.py` (`?debug` exposes
`window.__orb`); the planet maps come from `python3 palace/archive/3d-demo/tools/fetch_textures.py`.

**Demo 2, the Pentagon** (`palace/archive/3d-demo/pentagon/index.html`): one self-contained page, no build step, three.js r128. Read
`pentagon/README.md` first. `LV` holds the five levels; the atrium is built side by side (`onSide(a, k, t, y)`:
the point at apothem `a` on side `k`, a fraction `t` along it). The rooms behind the glass are interior-mapped: `ROOMS`
lists them per level and side as on the plans, and `ROOM_FS` draws each kind (walls, floor, ceiling, lights, then the
furniture on a plane halfway back). `GARDEN` builds L2 (`lakeD` is the lake's shape, `each(sector, ...)` plants a sector
row by row, `BLOCK` holds what you can't walk through); its sky shader also draws the far horizon on the outer walls.
`canStand` decides where you can walk. `RES` is Jim's residence on L1 (walkable rooms, built in (a, u) coordinates
with the Crown's furniture kit) and `ACTS` the things to do there. Static meshes are merged by material at the end
(`mergeStatic`; the residence separately, so its shell can stop casting shadows on L2). The render
target has a 24-bit depth buffer (three r128 gives render targets 16 bits otherwise, and surfaces 2 cm apart flicker).
Test with `python3 palace/archive/3d-demo/tools/pentagon_shot.py` (`?debug` exposes `window.__pent`). The probe's re-captures fade in
over 1.5 s (`ENVB`: every standard material's shader blends the previous environment map into the new one); a sudden
swap made the rooms flash every few seconds as you walked (Jim, 1 Oct 2026). The Crown has the same `ENVB`.
