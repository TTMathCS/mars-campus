# Phase 2: building the new quarter into the 3D campus

How to turn the plan ([phase2-plan.md](phase2-plan.md), rooms in `tools/campus_rooms.py`) into the walkable campus.
Built so far: the Sun court (T-16, v0.8.1, `blk_campus2.js`), the palace's back door and the back terrace (T09-04,
T09-01, v0.9, `blk_backdoor.js`: the vestibule, the gap in the ring and the dome's glass, the terrace, its stairs, and
`backSupport` for walking), the Crescent's building and its sunken court (T-06, v0.9.1, `blk_crescent.js`: shell,
rooms' walls, floors and ceilings, the hall's stair, the court, `crescentSupport`). Next: the Crescent's furniture.

The terrain is now cut by exact shapes (`P2CUTS`: sectors round any centre and boxes in the palace frame, `p2Sector`,
`p2Box`, up to 16) tested in the terrain shaders, the shadow pass and the bake; the bake takes extra voxel domains
(`P2DOMAINS`). A new building adds its shapes and its domain the same way.

## Where it is

In world coordinates (x east, z south, metres from the start) the quarter spans about x −266 … 19 and z −364 … −80, 80
to 375 m from the start. The real NASA terrain mesh only covers about ±130 m round the start; the rest of the quarter
lies on the far terrain, a polar grid (`RINGS`, `FARH`, filled from `hCombined` in `buildWorld`) whose rings are 5 m
apart out to 110 m and then grow by 1.8 % each: at 300 m they are 5.4 m apart and 2.1 m round. Far too coarse for
terraces and building platforms.

## Steps, in order

1. **Data.** Read the plan from `P2` (written into `src/blocks/blk_p2data.js` by `campus_buildings.py`); never copy
   numbers by hand. Add `blk_p2data.js` to `BLOCKS` in `src/assemble.py` before the blocks that use it.
2. **Ground** (superseded for building footprints by the exact cuts above; still needed for terraces on the far terrain). A second ground grid for the quarter, like `CG` (today's 0.5 m grid filled from the real mesh,
   `cgH(x, z)`): 1 m cells over x −270 … 25, z −370 … −75, filled from `hCombined`/the real tiles, then graded with
   `gradeAt(x, z)`: level platforms for each building and terrace (levels from `P2.garden.terraces`, fitted to the real
   ground), blended back to the land over 3 to 6 m. Draw it as its own mesh with the Mars ground material and lower the
   far grid under it by half a metre so the two never fight. `groundAt` and the walker must use the graded height.
3. **Buildings, one at a time,** each in its own block (`blk_crescent.js`, `blk_infinity.js` …): shells and floors from
   the plan's geometry, furniture and plants from the existing builders in `blk_wings.js` and `blk_plants.js`. Rooms get
   flat, level ceilings (see [realism.md](realism.md)).
4. **Light.** The bake worker (`blk_bake.js`) voxelises the palace frame at 0.2 m over lat −27 … 27, rad −40 … 96 only.
   Give each new building its own domain at 0.2 m and the garden one at 0.5 m; one domain over the whole quarter at
   0.2 m would be about 10⁹ voxels.
5. **Shadows.** `shadowBox` (page.html, "Shadow map") covers x −132 … 132, z −140 … 132 with one 4096² map. Either
   stretch it to the quarter (texels about 10 cm instead of 6.5) or add a second map for the quarter; its ground goes
   down to about −20 m, so `shadowBox.min.y` must drop to about −24.
6. **Checks after each building:** `tools/hidden.py` (line of sight from the start, CP-1: nothing may show), the
   walk tests (`tools/walktest.py`), shots by day and at sunset, and the frame time on a phone (keep it above 30 fps;
   the quarter is behind the ridge, so it can be left out of the draw while you are on the start side).
7. **Docs:** a row in the change log of `REQUIREMENTS.md` and a line in `HANDOFF.md` per building.

## Order

1. Sun court (T-16), where the solar field stood. 2. The palace's back door and the back terrace (T09-04, T09-01).
3. The Crescent (T-06), with walk-in classrooms. 4. Pod port and terminal (T-14, T-15). 5. Infinity Hall (T-07).
6. The Fibonacci Garden (T-09). 7. Observatory (T-10). 8. Sports dome (T-11). 9. Hangar and test yard (T-12, T-13),
with the new rovers ([rover.md](rover.md)).
