# The Orb · demo 2, phase 2

**[Demo 2 home](../README.md) · [Requirements](../REQUIREMENTS.md) · [Decisions](../docs/decisions.md) · [Design](../docs/design/README.md) · [Floor plans](../docs/plans.md) · [Pictures](../docs/gallery.md)**

Live at **https://ttmathcs.github.io/mars-campus/palace/orb/**. A lounge on the +72 floor of the Orb, Rev E (chapter 02):

- **The switch** (U, or the switch in the bar): the lights go down, the windows dim, and the universe appears in the
  room in 3D. Off, the room comes back with its windows onto the plain.
- **Zoom** (scroll, pinch, + and −, or the level buttons): the cosmic web → the Milky Way → the solar system today →
  Mars → Arcadia Planitia (the demo's own 40 km landscape with the route of the flight) → the house (the Crown at
  1:58 on its built ground). Earth is a branch from the solar system, with the day and night as they are now.
- **The dashboard**, top right (D hides it): Earth and Mars as small globes lit as they are now. Mars shows the house's
  weather from a model of the season and the time of day there (the Mars clock is real: Mars24's algorithm), Earth the
  live weather of a home town Jim sets (Open-Meteo), "as of" the radio delay between the planets today.
- **The Wormhole Gate**: choose a time, press *Send me there*; you walk across the bridge into the ball, and the beam
  takes you to the TTMath campus in Gale crater, demo 1.

One self-contained page, `index.html`, three.js r128. Planet maps in `tex/` come from
`python3 palace/tools/fetch_textures.py` (Solar System Scope, CC BY 4.0; NASA Blue Marble, public domain); Mars uses
`../design/img/mars-map.jpg` and Arcadia `../design/atlas/site-terrain.jpg`. Test headless with
`python3 palace/tools/orb_shot.py` (see its docstring).
