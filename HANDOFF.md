# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 30 Sep 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## 1. Status

| Part | Where | State |
| --- | --- | --- |
| Hub page | `index.html` | Live. Lists the demos and links the demo 2 plans. |
| Demo 1, TTMath on Mars | `ttmath/` | v0.7 live and finished: one integrated campus, real rooms, real materials. See `ttmath/REQUIREMENTS.md`. |
| Demo 2, current palace | `palace/` | Live, but Jim rejected it ("far from satisfactory"). It stays up until the redesign replaces it at the same link. |
| Demo 2, redesign | `palace/plans/` | Floor plans Rev A live at https://ttmathcs.github.io/mars-campus/palace/plans/. Rev B in progress (section 2). Nothing is built in 3D until Jim approves the plans. |

## 2. Demo 2 redesign: decisions so far

The requirements are in `palace/REQUIREMENTS.md`, section 10. In short:

- **Above ground: the Crown.** A solid white ring over the plain, not glass-heavy because of the strong sun. It is 276–280 m across and its main floor is 41 m up. Five points rise where the legs are. Jim wants it "even wilder" and "only exist in dreams".
- **Below ground: the Pentagon.** One solid pentagon, 160 m sides. It has five levels from 24 m to 68 m down under 16 m of soil, five rings (A–E) and five sectors around an atrium. It holds 10 times the Crown's floor area.
- **Arcadia Spaceport**, 30 km due east: three pads, terminal, fuel plant, pod station.
- **Pod flight home**: a scenic route of about 37 km and 4½ minutes, landing at sunset. Jim wants it to be an impressive video.
- **The city** grows from the house on a sunflower spiral (golden angle). Civic buildings go on the Fibonacci seeds, which line up due north. There are four phases.

Jim's answers to the Rev A questions (30 Sep 2026):
1. The Crown: "even wilder".
2. Master suite: "one up and one down", so one in the Crown and one on L1.
3. Add a "wormhole transformation device which can transfer me to anytime any space".
4. "Arrival land on sunset, but animation can go through Mars storm etc."

**Open question to Jim.** He asked how the Crown floats: "is it supported by anti gravity device?" In Rev A it stands on five slender 40 m legs that carry the lifts. Two options went back to him:

- Keep the legs.
- Make the whole Crown float on anti-gravity drives in its five points, with five columns of light carrying lift capsules instead of legs.

Wait for his choice before drawing the Crown's supports in Rev B.

**Rev B change list** (planned, not yet drawn):
- **The Orb.** A mirror-polished sphere, 40 m across, floats with no supports over the Sun Well. Its centre is 72 m up, and it has floors at +64, +72 and +80 (about 3,370 m²). Its underside bounces the garden mirrors' sunlight down the Sun Well. Inside: the **Wormhole Gate** hall (+72), a destination library (+80) and the arrival from the **Beam**, a capsule lift in a column of light that rises from the Sun Well. One sky bridge can slide out from the Observatory point.
- **The points** become sharp spires up to +90 m (the dips stay at +50). Roof profile: `50 + 40·c^6`, where `c = (1 + cos 5φ) / 2`.
- **The ring** becomes 16 m wide (122–138 m radius), which keeps the 10× rule with the Orb added. The Crown comes to about 20,100 m² and the Pentagon about 209,700 m² (10.4×). The horizon from the top (+90 m) is 24.7 km away.
- **Two master suites**: "Master suite up" in the Crown's SE dip, and "Master suite down" on L1, sector 1, ring B.
- **The pod** flies into a hangar door on the garden side of the Arrival point, instead of landing on the roof.
- **Flight video.** Add a dust storm wall after the Ice Cliffs, with a dark red sky, static sparks and a radar view. The pod breaks out into the blue sunset with Phobos crossing the sun, and the Crown and Orb appear ahead. There are about 10 shots.
- Update every sheet, the numbers and `palace/REQUIREMENTS.md`, then ask Jim to approve.

**After approval**, build in this order and replace the old palace at `palace/` (same link):
1. The 30 km landscape, the spaceport and the pod flight video.
2. The Crown.
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

**Demo 2, old palace**: `palace/src/`, then `palace/build.sh` (use `./build.sh debug` for test hooks). Node scripts are in `palace/tools/`.

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
palace/                 demo 2 (old palace): index.html (built), REQUIREMENTS.md, src/, build.sh, tools/
palace/plans/           demo 2 redesign floor plans (index.html, self-contained)
palace/tools/plans_snap.py   screenshots of the plans page
.github/workflows/pages.yml  deploys to GitHub Pages on every push to main
```
