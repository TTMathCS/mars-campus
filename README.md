# Mars – your new home

The site is called *Mars – your new home* (Jim's choice, 3 Oct 2026); the repository keeps its name, `mars-campus`.

Walkable 3D places on Mars that run in the browser. Each demo is an imagined place to discover on foot; demo 1 stands on real NASA ground from Gale Crater.

**Live site: https://ttmathcs.github.io/mars-campus/**

## Demos

| Demo | Link | Requirements | What it is |
|---|---|---|---|
| 1. TTMath on Mars | [ttmathcs.github.io/mars-campus/ttmath/](https://ttmathcs.github.io/mars-campus/ttmath/) | [ttmath/REQUIREMENTS.md](ttmath/REQUIREMENTS.md) | Sunset at Dingo Gap. Walk over the ridge, through the gateway into the courtyard of the TTMath campus: a classroom wing (math classroom, coding lab, seminar room), a café and library wing, and the Math Palace, a 56 m glass dome with a rotunda of math exhibits, a Foucault pendulum and a golden Möbius strip. Real-looking marble, brass, wood and glass. |
| 2. Jim's retirement house: the design plan | [ttmathcs.github.io/mars-campus/palace/design/](https://ttmathcs.github.io/mars-campus/palace/design/) | [palace/REQUIREMENTS.md](palace/REQUIREMENTS.md) | Jim's retirement house in Arcadia Planitia: a white crown floats on anti-gravity over a stone garden, with a mirror Orb, where the universe fills the rooms in 3D round the Wormhole Gate; five levels lie below ground. The design plan shows it area by area and room by room, each with what it is for, its floor plan, and path-traced pictures and 360° views; floor plans and a zoomable Mars Atlas are live. Start at [palace/README.md](palace/README.md). |

**Demo 2 is in design.** Its home in this repo is [palace/README.md](palace/README.md): requirements, decisions, the design chapter by chapter with every diagram and picture, and the floor plans. The first palace from rounds 1 and 2 is archived at [palace/archive/old-palace/](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/).

Beside the demos, the site has **the science**, real and with sources, in its own folder [`science/`](science/README.md), one subject a page: **[Mars facts](https://ttmathcs.github.io/mars-campus/science/mars-facts/)** (surface, inside Mars, weather, Mars in space, resources, hazards, the numbers, exploration) and **[Building on Mars](https://ttmathcs.github.io/mars-campus/science/building-on-mars/)** (every factor, getting there, construction, water, air, food, energy, shielding, health, rocket fuel, talking to Earth, protecting Mars). The homepage has a card for each.

More demos will be added in their own folders. Each demo folder keeps its own `REQUIREMENTS.md`, the source of truth for that demo.

## Controls

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

## Layout

```
HANDOFF.md        status, open decisions and how to continue: read this first
index.html        landing page: the two demo cards, then the two science cards (styles in site.css)
science/          the science, one subject a page: mars-facts/, building-on-mars/ (science.css, science.js, README.md)
data/             NASA terrain shared by every demo (manifest + tiles packed as base64 text)
ttmath/           Demo 1: TTMath on Mars (page, logo, REQUIREMENTS.md)
ttmath/src/       Demo 1 source: page.html, blocks/*.js, assemble.py, build.py
ttmath/tools/     Demo 1 headless tests (screenshots, walk tests, line-of-sight check)
palace/           Demo 2: Jim's retirement house. README.md (start here), REQUIREMENTS.md
palace/docs/      Demo 2 docs: decisions, the design chapter by chapter, floor plans, pictures, archive
palace/design/    Demo 2 design book and Mars Atlas (live pages)
palace/plans/     Demo 2 floor plans Rev B, approved (one self-contained page)
palace/src/       Demo 2 3D build, phase 1 (paused), built by palace/build.sh
palace/archive/   the first palace from rounds 1 and 2, kept for reference
```

Demo 1 loads the shared terrain from `../data/`; its `index.html` is built from `ttmath/src/` with `assemble.py` and `build.py`. Demo 2's 3D build generates its own landscape from `palace/src/` with `palace/build.sh`; until it is ready, `palace/` opens the design book.

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
