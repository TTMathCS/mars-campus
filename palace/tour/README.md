# The photo tour · demo 2

**[Demo 2 home](../README.md) · [Requirements](../REQUIREMENTS.md) · [Decisions](../docs/decisions.md) · [Design](../docs/design/README.md) · [Rooms](../docs/rooms.md) · [Floor plans](../docs/plans.md) · [Pictures](../docs/gallery.md)**

Live at **https://ttmathcs.github.io/mars-campus/palace/tour/**. A tour of Jim's house in 360° photographs, like an
estate agent's: drag to look round, click a ring to walk there, use the map (top right) or the buttons below. Each
photograph is a path-traced render of the 3D model: real bounced light, real glass, and furniture scanned from real
things. Nothing is painted by hand.

![The family room from the fireplace end, looking out to the atrium](photos/hero.jpg)

## The stops

**Live now: By the fire, At the glass and the music room** (2 Oct 2026). The others are rendering and appear in the tour as each one
finishes, about 25 minutes apiece.

| Stop | Where | What you see |
| --- | --- | --- |
| By the fire | L1, the family room | A hearth of lit mist in a travertine chimney breast, walnut shelves lit from within, an oak ceiling, a skylight |
| At the glass | L1, the family room | The glass onto the atrium, a chess table, the doors to the terrace |
| The music room | L1 | The grand piano by the glass, a sofa and chairs to listen from, books |
| The dining room | L1 | A walnut table for eight under glass globes, a sideboard, books |
| On the terrace | L1, the atrium | Olive trees, box hedges, vines over the glass, Jim's study upstairs |
| On the bridge | L1, the atrium | Halfway to the portal column; the atrium 44 m down, the sky lens overhead |
| The sun court | L5, 68 m down | A lawn with olive trees round a pool at the foot of the column |

The family room, the music room and the dining room are the front of ring A on L1, sector 1, as on the
[floor plans](../docs/plans.md): 28.8 m of glass onto the atrium, 13.9 m deep, a ceiling at 3.8 m (Jim's study is the
storey above). The walls between them stand on the mullions 8 m either side of the middle.

## How it is made

`index.html` is the viewer (three.js r128, no build step): each stop is an equirectangular JPEG in `pano/` (4096 ×
2048) on the inside of a sphere; `stops.js` lists the stops, where each was taken, where you look first and which
rings it shows (`ready: false` keeps a stop out until its picture is in). `photos/` holds the stills. `?debug`
exposes `window.__tour` (`go(id)`, `view`, `here()`).

The renders come from Blender 4.2's Cycles, driven by the scripts in [`../tools/render/`](../tools/render/):

| Script | What it does |
| --- | --- |
| `lib.py` | Materials (oak boards from a photo, travertine, marble, walnut, plaster, glass, velvet, linen), modelling helpers, lights, cameras |
| `furn.py` | Things made to measure: the grand piano, bookcases full of books, tables, lamps, rugs, cushions, paintings, olive trees, curtains |
| `atrium.py` | The atrium: terraces with box hedges and glass balustrades, trailing vines, bridges, the fluted column, the rooms of the other sides, the levels below, the sun court, the roof and its sky lens |
| `family.py` | Jim's rooms on L1 and the lighting: the sun and sky through the lens and the skylights, downlights, shelf lights, lamps, the fire |
| `suite.py`, `bed.py` | The street and the master suite down: the moss garden, the bedroom (a bed draped by cloth simulation), the bath |
| `crown.py`, `crown_rooms.py` | The Crown's ring: walls with their slots, the Glide, coves, an oak-slat ceiling, the Mars sky and plain outside; its rooms |
| `pano.py`, `final.py` | Where the 360s are taken; render a list of stills and 360s (a job whose picture exists is skipped, so the queue restarts) |
| `patch.py` | Re-renders a few regions of a finished 360 with the same seed and blends them in, to fix a detail without 25 minutes |

To render again: `pip install bpy==4.2.0` into a Python 3.11 virtualenv, run `python3 palace/tools/render/fetch_assets.py`
once, then for example `python palace/tools/render/final.py pano:fire,hero out 1600 900 128 4096 32`. A 4096 × 2048
360 at 32 samples takes about 25 minutes on four CPU cores; OpenImageDenoise cleans it.

## Credits

The 3D scans come from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets):
- Glam Velvet Sofa, © 2021 Wayfair LLC; Specular Silk Pouf, © 2023 Wayfair LLC; Iridescent Dish with Olives,
  © 2020 Wayfair LLC: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Sheen Chair, © 2020 Wayfair LLC: [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- Diffuse Transmission Plant, © 2024 Darmstadt Graphics Group GmbH: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- A Beautiful Game (the chess set), © 2020 ASWF and © 2022 Ed Mackey: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Glass Vase Flowers (Eric Chadwick, Rico Cilliers) and Diffuse Transmission Teacup: [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

The floor boards, the lawn and the pool's ripples are photo textures from [three.js's examples](https://github.com/mrdoob/three.js)
(MIT). Rendered with [Blender](https://www.blender.org/) Cycles (GPL).

Not yet: the rest of L1 (the master suite, the club and cinema, the baths and pool, the great library, the guest
suites), the garden level close up, and the Crown.
