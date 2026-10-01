# Demo 2 · Jim's retirement house on Mars

**The Crown and the Pentagon**, in Arcadia Planitia · owner: Jim (TTMath) · last updated 1 Oct 2026

**Demo 2 home · [Requirements](REQUIREMENTS.md) · [Decisions](docs/decisions.md) · [Design](docs/design/README.md) · [Floor plans](docs/plans.md) · [Pictures](docs/gallery.md)**

![The Crown coming home at sunset, a dust storm behind it](design/img/crown-sunset.jpg)

A private house for one person, Jim, on the icy plains of Arcadia Planitia. **Above ground, the Crown**: a white
ring 276 m across floats 40 m over a stone garden on anti-gravity, with five spires and a mirror Orb, where the
universe fills the rooms in 3D round the **Wormhole Gate**. **Below ground, the Pentagon**: five levels, 24 to 68 m down, eleven times the
Crown's floor area. **Arcadia Spaceport** stands 30 km east, and a pod flies Jim home through a dust storm into the
sunset. A city will grow around it.

## Start here

| | What it is | In this repo | On the live site |
| --- | --- | --- | --- |
| ▶️ | **The 3D demo**, phase 1: fly home from the spaceport to the Crown and look around it | [src/](src/) | [Demo 2](https://ttmathcs.github.io/mars-campus/palace/) |
| 🏛️ | **The Crown**, phase 2: step through the Door and walk the main floor, ride the Glide past every room | [crown/](crown/) | [The Crown](https://ttmathcs.github.io/mars-campus/palace/crown/) |
| 🌌 | **The Orb**, phase 2: switch the universe on, zoom from the cosmic web to Mars and the house, step into the Wormhole Gate | [orb/](orb/) | [The Orb](https://ttmathcs.github.io/mars-campus/palace/orb/) |
| 🌳 | **The Pentagon**, phase 3: the atrium 68 m deep with rooms behind glass on every level, the garden level with its lake, forest and meadow, and the sun court | [pentagon/](pentagon/) | [The Pentagon](https://ttmathcs.github.io/mars-campus/palace/pentagon/) |
| 📋 | **Requirements**: everything Jim asked for, with status | [REQUIREMENTS.md](REQUIREMENTS.md) | |
| ✅ | **Decisions**: every question to Jim, his answers, and what they changed | [docs/decisions.md](docs/decisions.md) | |
| 📐 | **The design, chapter by chapter**: what each part looks like and how it works, with every diagram | [docs/design/](docs/design/README.md) | [Design book](https://ttmathcs.github.io/mars-campus/palace/design/) |
| 🗺️ | **Floor plans Rev B**: the approved sheets | [docs/plans.md](docs/plans.md) | [Floor plans](https://ttmathcs.github.io/mars-campus/palace/plans/) |
| 🌍 | **Mars Atlas**: zoom from the solar system to the house, Google Earth style | [Atlas views](docs/design/01-site-and-city.md#the-mars-atlas) | [Mars Atlas](https://ttmathcs.github.io/mars-campus/palace/design/atlas/) |
| 🖼️ | **Pictures**: every picture rendered from the 3D build | [docs/gallery.md](docs/gallery.md) | |
| 🗄️ | **The first palace** (rounds 1 and 2), archived | [docs/archive/old-palace.md](docs/archive/old-palace.md) | [Old palace](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/) |
| 🛠️ | **How to build and test**, for whoever continues the work | [HANDOFF.md](../HANDOFF.md) | |

## Status

| Part | State | Next |
| --- | --- | --- |
| Requirements | Updated 1 Oct 2026 with Jim's answers | — |
| Floor plans | **Rev B approved** by Jim, 30 Sep 2026; B.1, 1 Oct: nothing on the ground | Redraw the Orb and the ground once Jim approves Rev E |
| Design book | **Rev E**: chapters 01–07 written; the Orb's universe in VR, the ball as the Wormhole Gate, the Orb's dock and the built ground | Write 08 Life support, 09 Communications and space, 10 Building it |
| Pictures | All ten re-rendered on 1 Oct 2026 so they look real; no panels or mirrors on the ground | — |
| Mars Atlas | Live, over a real colour map of Mars | — |
| 3D demo | **Phase 1 live**, 1 Oct 2026 (Jim: "please go ahead to build, you have my pre approve"): the landscape, the spaceport, the flight home and the Crown from outside, with the new ground | **Phase 2 live:** the Crown's main floor and the Orb. **Phase 3 started:** the Pentagon's atrium, the rooms behind its glass, the garden level and the sun court; next, walking into the rooms of L1 |
| First palace | Archived | — |

**Nothing waits for an answer:** Jim answered every question on 1 Oct 2026. For his review: the Orb, Rev E (the universe
in VR, the ball as the Wormhole Gate, the Orb's dock) and the built ground, drawn from his words. See the
[decision log](docs/decisions.md).

## The design at a glance

| | | |
| --- | --- | --- |
| <a href="docs/design/02-crown.md"><img src="design/img/crown-day.jpg" alt="The Crown by day"></a><br>**The Crown**, above ground: 276 m across, floating 40 m up | <a href="docs/design/02-crown.md#the-orb-the-universe-in-vr-and-the-wormhole-gate"><img src="design/img/orb-universe.jpg" alt="Inside the Orb, the universe switched on"></a><br>**The Orb**: the universe in VR in the rooms, and the Wormhole Gate | <a href="docs/design/03-pentagon.md"><img src="docs/img/book/pentagon-section.png" alt="Section through the Pentagon"></a><br>**The Pentagon**, below ground: five levels |
| <a href="docs/design/01-site-and-city.md"><img src="docs/img/book/site-mars.jpg" alt="Map of Mars"></a><br>**Site**: 39.8° N on Arcadia Planitia | <a href="docs/design/06-transport.md"><img src="design/img/flight-cliffs.jpg" alt="The pod along the Ice Cliffs"></a><br>**The flight home**: 4 min 40 s | <a href="docs/design/07-spaceport.md"><img src="design/img/port-aerial.jpg" alt="Arcadia Spaceport"></a><br>**Arcadia Spaceport**, 30 km east |

| Number | |
| --- | --- |
| 39.80° N, 201.44° E | The house, 3.9 km below Mars' average height, on ground rich in ice |
| 276 m | The Crown across; it floats 40 m up and its spires reach 90 m |
| 19,100 m² | The Crown's floor area, 5.6 times the TTMath campus |
| 209,700 m² | The Pentagon's floor area, 11 times the Crown |
| 18 m | The Wormhole Gate across, a ball inside the 40 m Orb: press send and it shoots you like light to any place and time |
| 30 km | To Arcadia Spaceport, due east |
| 20 MWe | Four reactors, two at the house and two at the port; no panels or mirrors on the ground |
| 4 min 40 s | The pod flight home, 37 km |
| 0 | Lifts: portals link every part of the house |

## What is in this folder

```
palace/
├── README.md            this page
├── REQUIREMENTS.md      what Jim wants: the source of truth
├── docs/                the docs in this repo
│   ├── decisions.md     questions to Jim, his answers, what they changed
│   ├── design/          the design book chapter by chapter, with its diagrams
│   ├── plans.md         the floor plans Rev B, sheet by sheet
│   ├── gallery.md       every rendered picture
│   ├── img/             diagrams, plan sheets and Atlas views exported for these docs
│   └── archive/         the first palace's requirements
├── design/              the design book and the Mars Atlas (live pages)
│   └── img/             pictures rendered from the 3D build, and the maps
├── plans/               the floor plans Rev B (one live page)
├── src/                 the 3D demo's phase 1 (the flight); build.sh builds it into index.html
├── crown/               the Crown's main floor, phase 2 (one self-contained page)
├── orb/                 the Orb, phase 2 (one self-contained page, and its planet maps)
├── pentagon/            the Pentagon, phase 3 (one self-contained page)
├── tools/               headless tests, renders and exports
├── archive/old-palace/  the first palace, kept for reference
└── index.html           the published 3D demo: the flight home
```

The diagrams in `docs/img/` are exported from the live pages by `python3 palace/tools/docs_export.py`. Run it again
after changing a drawing so the docs stay in step.
