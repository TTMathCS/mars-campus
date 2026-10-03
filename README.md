# Mars – your new home

The site is called *Mars – your new home* (Jim's choice, 3 Oct 2026); the repository keeps its name, `mars-campus`.

A city rising on Mars, place by place, in the browser. In this repo each place is a demo in its own folder, but the site itself never says "demo" (Jim, 3 Oct 2026): demo 1, the TTMath campus, stands on real NASA ground from Gale Crater; demo 2 is **Arcadia**, Jim's home on Mars, in design.

**Live site: https://ttmathcs.github.io/mars-campus/**

## Demos

| Demo | Link | Requirements | What it is |
|---|---|---|---|
| 1. TTMath on Mars | [ttmathcs.github.io/mars-campus/ttmath/](https://ttmathcs.github.io/mars-campus/ttmath/) | [ttmath/REQUIREMENTS.md](ttmath/REQUIREMENTS.md) | Sunset at Dingo Gap. Walk over the ridge, through the gateway into the courtyard of the TTMath campus: a classroom wing (math classroom, coding lab, seminar room), a café and library wing, and the Math Palace, a 56 m glass dome with a rotunda of math exhibits, a Foucault pendulum and a golden Möbius strip. Real-looking marble, brass, wood and glass. |
| 2. Arcadia, Jim's home on Mars: the design plan | [ttmathcs.github.io/mars-campus/palace/design/](https://ttmathcs.github.io/mars-campus/palace/design/) | [palace/REQUIREMENTS.md](palace/REQUIREMENTS.md) | Jim's home in Arcadia Planitia: a white crown floats on anti-gravity over a stone garden, with a mirror Orb, where the universe fills the rooms in 3D round the Wormhole Gate; five levels lie below ground. The design plan shows it area by area and room by room, each with what it is for, its floor plan, and path-traced pictures and 360° views; floor plans and a zoomable Mars Atlas are live. Start at [palace/README.md](palace/README.md). |

**Demo 2 is in design.** Its home in this repo is [palace/README.md](palace/README.md): requirements, decisions, the design chapter by chapter with every diagram and picture, and the floor plans. The first palace from rounds 1 and 2 is archived at [palace/archive/old-palace/](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/).

Beside the demos, the site has **the science**, real and with sources, in its own folder [`science/`](science/README.md), one subject a page: **[Mars facts](https://ttmathcs.github.io/mars-campus/science/mars-facts/)** (surface, inside Mars, weather, Mars in space, resources, hazards, the numbers, exploration) and **[Building on Mars](https://ttmathcs.github.io/mars-campus/science/building-on-mars/)** (every factor, getting there, construction, water, air, food, energy, shielding, health, rocket fuel, talking to Earth, protecting Mars). The homepage has a card for each.

More demos will be added in their own folders. Each demo folder keeps its own `REQUIREMENTS.md`, the source of truth for that demo.

## Controls

These notes are kept here, not on the pages: Jim, 3 Oct 2026, "I hate all this kinds of notes ... You can keep those for
your memory to save somewhere else you know, but not on the pages for users/visitors". The homepage's old *How to
move*: in TTMath on Mars, drag to look around and walk with W A S D or the arrow keys; on a phone, drag to look and
use the MOVE stick at the bottom left. In Arcadia, drag the picture (or use the arrow keys) to turn it and click a
label to open that part; drag a 360° view to look round and click a ring on the floor to walk on.

TTMath on Mars in full:

| | Desktop | Phone |
|---|---|---|
| Look around | Drag, or turn on Mouse-look | Drag with one finger |
| Walk | W A S D or arrow keys | MOVE stick (push further to run) |
| Run | Hold Shift | Push the stick to the edge |
| Jump | Space | JUMP button |
| Zoom | Mouse wheel, + and - | Pinch |
| Play the sunset | P | Play button |
| Sound | M | Speaker button |
| Scenes | 1 to 5 | Menu |

## What is real and what is simulated

- **Real:** the ground around the start, about 260 × 260 m. It is NASA JPL's 3D model of "Dingo Gap", built from Curiosity rover photos (around sol 528) and HiRISE orbital images.
- **Simulated:** the landscape beyond that area, the sky and Sun, the buildings and the rovers.
- **Imagined:** everything else in the city, Arcadia included; the maps in Arcadia's design plan use real NASA imagery.
- **Real, with sources:** the science pages.

## Layout

```
HANDOFF.md        status, open decisions and how to continue: read this first
index.html        landing page: *A city rising on Mars*, a card per place, then the two science cards (site.css)
science/          the science, one subject a page: mars-facts/, building-on-mars/ (science.css, science.js, README.md)
data/             NASA terrain shared by every demo (manifest + tiles packed as base64 text)
ttmath/           Demo 1: TTMath on Mars (page, logo, REQUIREMENTS.md)
ttmath/src/       Demo 1 source: page.html, blocks/*.js, assemble.py, build.py
ttmath/tools/     Demo 1 headless tests (screenshots, walk tests, line-of-sight check)
palace/           Demo 2: Arcadia, Jim's home on Mars. README.md (start here), REQUIREMENTS.md
palace/docs/      Demo 2 docs: decisions, the design chapter by chapter, floor plans, pictures, archive
palace/design/    Demo 2 design plan and Mars Atlas (live pages)
palace/tour/      Demo 2 photo tour: path-traced 360s and stills
palace/plans/     Demo 2 floor plans Rev G, approved (written by palace/tools/draw_plans.py)
palace/tools/     Demo 2 room program, plan and page generators, docs export, the Blender scenes (tools/render/)
palace/archive/   kept for reference: the real-time 3D demo (3d-demo/), floor plans Rev B, the first palace
```

Demo 1 loads the shared terrain from `../data/`; its `index.html` is built from `ttmath/src/` with `assemble.py` and `build.py`. Demo 2 is shown as path-traced pictures in its design plan; `palace/` opens it. Its real-time 3D pages are archived in `palace/archive/3d-demo/`.

## Publishing

Every push to `main` publishes the site automatically through the GitHub Actions workflow in `.github/workflows/pages.yml`. It checks that the key files are present, then deploys to GitHub Pages. You can also run it by hand from the Actions tab ("Deploy to GitHub Pages", then "Run workflow").

One-time setting: in the repo's Settings, then Pages, set Source to "GitHub Actions".

## Run it locally

The pages load their data with `fetch()`, so they need a small web server. Opening the files straight from disk will not work.

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Credits

- Terrain: [NASA-AMMOS 3DTilesSampleData](https://github.com/NASA-AMMOS/3DTilesSampleData), `msl-dingo-gap`, release URS297920, built with JPL's [Landform](https://github.com/NASA-AMMOS/Landform) pipeline.
- Imagery: MSL Mastcam (NASA/JPL-Caltech/MSSS), MSL Navcam and Hazcam (NASA/JPL-Caltech), MRO HiRISE (NASA/JPL-Caltech/University of Arizona), HiRISE mosaics (NASA/JPL-Caltech/USGS Astrogeology).
- Sky references: Curiosity's [blue sunset in Gale Crater](https://www.jpl.nasa.gov/images/pia19400-sunset-in-mars-gale-crater/) and [Earth as the evening star](https://www.jpl.nasa.gov/images/pia17936-bright-evening-star-seen-from-mars-is-earth/).
- TTMath name and logo © TTMath.
- Rendering: [Three.js](https://threejs.org/) r128.
