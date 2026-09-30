# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 30 Sep 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## 1. Status

| Part | Where | State |
| --- | --- | --- |
| Hub page | `index.html` | Live. Lists the demos and links the demo 2 plans. |
| Demo 1, TTMath on Mars | `ttmath/` | v0.7 live and finished: one integrated campus, real rooms, real materials. See `ttmath/REQUIREMENTS.md`. |
| Demo 2, old palace | `palace/index.html`, source in `palace/src_old/` | Still live, but Jim rejected it ("far from satisfactory"). It stays up until the new build replaces it at the same link. |
| Demo 2, plans | `palace/plans/` | Rev B, **approved by Jim on 30 Sep 2026** ("Approve. Go"). Live at https://ttmathcs.github.io/mars-campus/palace/plans/. |
| Demo 2, new 3D build | `palace/src/` | **In progress**, phase 1 of 3 (section 2, build order). Engine, sky and terrain are done; spaceport, pod, Crown, flight and UI are next. Not published yet. |

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

**Waiting for Jim:** where the Wormhole Gate should take him in the demo, for example the TTMath campus in demo 1.
This is only needed for phase 2.

**Build order** (Jim approved Rev B, so this is under way). Each phase replaces the old palace at `palace/` (same link):
1. The 30 km landscape, the spaceport and the pod flight video.
2. The Crown and the Orb.
3. The Pentagon, one level at a time.

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
  `99_main.js` the main loop (for now a test harness). Planned next: `40_mat.js` building material and shadow map,
  `50_port.js` spaceport, `55_pod.js` pod and cockpit, `60_crown.js` the Crown and the Orb, `70_fx.js` dust devils, storm,
  sparks, `80_flight.js` the path, shots and cameras, `90_ui.js` HUD, cards, look-around, sound.
- World: metres, x east, z south, y up, the Crown's centre at the origin, the spaceport terminal at x = 30 000. Plan
  coordinates (x, y north) map to world (x, −y). Every vertex shader bends the world with the curvature of Mars.
- Test: `python3 palace/tools/crown_shot.py '[["name", "js", waitMs], ...]' 960x540` loads the debug page headless and
  saves PNGs to `palace/tools/out/`. In the page, `__crown.view(x, y, z, tx, ty, tz)` places the camera,
  `__crown.sun(elevationDeg, azimuthDeg)` sets the sun, `__crown.exp(e)` the exposure, `__crown.dbg(1)` colours the
  terrain grid levels, and `__crown.frame()` renders. Each frame takes about 8 s in SwiftShader.

**Demo 2, old palace**: source in `palace/src_old/` (its build script is in git history, commit c2e231b). It will be
deleted when the new build replaces it; it stays in git history.

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
.github/workflows/pages.yml  deploys to GitHub Pages on every push to main
```
