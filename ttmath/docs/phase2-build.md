# Phase 2: building the new quarter into the 3D campus

How to turn the plan ([phase2-plan.md](phase2-plan.md), rooms in `tools/campus_rooms.py`) into the walkable campus.
Built so far: the Sun court (T-16, v0.8.1, `blk_campus2.js`), the palace's back door and the back terrace (T09-04,
T09-01, v0.9, `blk_backdoor.js`: the vestibule, the gap in the ring and the dome's glass, the terrace, its stairs, and
`backSupport` for walking), the Crescent's building and its sunken court (T-06, v0.9.1, `blk_crescent.js`: shell,
rooms' walls, floors and ceilings, the hall's stair, the court, `crescentSupport`). Then the plan changed (5 Oct
2026): everything sealed, bigger classrooms, flying pods; the order below.

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

Done: the Sun court (T-16, open, to be covered), the back door and the back terrace (T09-04, T09-01, to be covered),
the Crescent's first build (T-06 v1: 46 to 60 m, 4.2 m floors). Next, after the sealed redesign of 5 Oct 2026
([phase2-plan.md](phase2-plan.md)):

1. ~~The wings' ceilings as high as their roofs allow~~ (v0.9.4: `CEIL_MAX` in `blk_wings.js`, the classroom wing's
   roof higher at the gateway end and fuller, `wingH(s, sg)` and `roofProf(t, sg)` in `blk_campus2.js`).
2. ~~The Crescent rebuilt bigger and taller~~ (v0.10: `blk_crescent.js` from `P2.crescent` and `P2.gallery`: the shell,
   `crescentStair` (two flights, `stairY`), `crescentEStairs` (`esY`), `crescentLift`, `crescentChandelier`,
   `crescentGallery`; furniture in `blk_crsfurnish.js` with plants from `CRESCENT_PLANTS`; `crescentSupport` for walking,
   with a step tolerance of 0.6 m that keeps you off the stairs from below and out of the stairwells from above).
3. ~~The winter garden's glass vault over the back terrace (T09-01)~~ (v0.11: `winterGarden` in `blk_backdoor.js`: a
   parabolic vault from the ring beam at the dome's foot to the Crescent's eave, `wgY(r)`, ribs every 2.5°, purlins, glass
   end walls where the outside stairs were, olive trees, maples and palms in big planters, benches, uplights).
4. ~~The flying pods~~ (v0.11: `blk_pod.js`: the craft's geometry, `podStop` on the left of the avenue, `podInit`;
   `podUpdate` flies where you look with inertia, keeps clear of the ground and roofs by `podFloor`, lands only on open,
   level ground (`podCanLand`); the cockpit view (the near plane up to 0.32 m with height) or the chase view; a soft
   shadow under the pod; `__mars.pod(...)` for tests). The pod port's pads and pods come with T-14.
The Ring (Jim, 5 Oct 2026: "please build the circle around the dome, like apple headquarter building"; "the entrance
is not sealed by dome"; the pods on anti-gravity with a dock): the design is in `tools/campus_rooms.py` (`RING`,
`RING_ROOMS`, `GARDEN_RING`, `ENTRANCE`, `POD`, `POD_DOCK`) and on `plan/ring.html`, checked against the line of sight
by `campus_plan.py`. It replaces the courtyard hall and the Sun court's vault (the old steps 5 and 6). Build it in steps,
each pushed when it is checked:

5. ~~The pods v2~~ (v0.12: `blk_pod.js`: the halo drive (`haloPt`, `haloBand`), the long teardrop cabin in two tones
   (`cabin`, `sec`), the tinted canopy (glass kind 3 in `blk_env.js`), the glossy pearl paint (`COMPOSITE` with g.y 1 in
   `blk_mat.js`), position lights from the atlas (`podRed`, `podGreen`, `podWhite`); `podPark` floats a pod
   `P2.pod.hover` over the highest ground under its halo; `podCanLand` refuses only roofs; Shift goes down to the float).
   The pod dock and its bridge and collar (T04-03, T17-02) come with the Ring's right side and its pod lounge (T06-21).
6. ~~The Ring~~ (v0.13: the old steps 6 to 9 built as one). `blk_ring.js` (the Crescent's block, renamed and generalised
   to `RING.sections`: `secAt`, `ringRoofY`, the shell, floors and ceilings, the corridor partitions (glass for the café
   and the art studio, `CRS_GLAZED`), the Gate Hall (`gateFloor`, `gateCeilingBelow`), the bay stairs (`bayStair`,
   `bayY`), the grand stairs and lifts, the skylights of the sunk quarter (`CRS.sky`, `skylightWell`, `skylightTop`;
   `flatBits` cuts their holes in the ceilings and the roof), `ringOutside`, `crescentGallery`, `crescentSupport`);
   `blk_gardenring.js` (the garden ring's vault from the dome's glass to the Ring's eave, the sunken grove,
   `gardenSupport`); `blk_entrance.js` (the entrance dome, the sloping plaza, the airlock whose doors are interlocked
   by `d.lock` in `doorsUpdate`, `entranceSupport`); `blk_ringfurnish.js` (the Ring's rooms beyond the Crescent's
   kinds, `diningChair`, `tableForFour`); `blk_board.js` (the timetable's two screens in the Gate Hall, drawn from
   `P2.timetable` on their own canvas). The wings, links, gateway and Sun court are gone from `blk_campus2.js`;
   `blk_wings.js` still holds the furniture builders the Ring uses. The rooms' floors share one captured reflection
   (`envW`, in Euclid), so `blk_mat.js` blurs it and dims it where a room sees little sky.
7. ~~The door plates and the rooms' directory~~ (v0.14, `blk_board.js`: `drawPlates` prints a plate per numbered room in
   the atlas where the gateway's name and the wings' signs were (`plateSlot`, 46 slots of 192 x 48), `doorPlates` puts
   one beside each door; `drawRingMap` draws the Ring as a map, `drawDirectory` the Gate Hall's directory on its own
   texture (`directoryScreen`), `drawLobbyDirectory` the hall's screen in the atlas).
   ~~Direction signs and the corridors' prints~~ (v0.17): `blk_signs.js` hangs a blade sign across the corridor at each
   angle in `P2.ring.signs` (`RING_SIGNS`), each face listing the rooms ahead that way up to the next sign
   (`roomsAhead`, `aheadLabel`, one canvas for all faces), and an exit sign over each stair's door (`exitCanvas`,
   `arcQuad`); `blk_prints.js` draws the prints in `P2.ring.art` (`RING_ART`), one cell each on one canvas
   (`PRINT_DRAW`, `drawPrint`, `printAtlas`), and `corridorArt` hangs them (one mesh), with walnut frames,
   brass picture lights, benches and plants (small plants on a plinth, `PRINT_PLINTH`). `arcWall` takes rows up the wall (`ny`): the corridors' walls have 6, so the
   downlights show on them. Both are called from `crescentBuild` after `doorPlates`.
   ~~The hall's slat walls, notice boards and bottle fillers~~ (v0.18): `slatWall` (`blk_ring.js`) lines a wall along a
   radius with oak slats on felt: one surface 4 cm proud of the wall, the slats drawn by the wood material (`g.x` 7 in
   `blk_mat.js`, faded to their mean far off, so they never shimmer as real thin slats would); `blk_notices.js` draws the boards in
   `P2.ring.boards` (`RING_BOARDS`: `drawContestBoard` from `P2.contests`, `drawClubBoard` from the rooms' `also`) and
   `noticeBoards` hangs them; `bottleFiller` (`blk_crsfurnish.js`) stands by the washrooms in `P2.ring.fountains`.
8. ~~The pod dock off the right side, its glass bridge and collar (T04-03, T17-02), and the pod lounge (T06-21)~~ (v0.19):
   `blk_poddock.js` builds the deck, its legs and lights, the docking spot's marks and the bridge (`podDockBuild`, called
   from `crescentBuild`), and the collar (`podDockCollar`: built run out, squeezed along the dock's radius by
   `pdkCollarSet`, animated by `pdkUpdate`). `podDockSupport` gives the bridge's and the collar's floor to the walker
   (before `crescentSupport`); `podDockGround` and `podDockTop` give the pod its deck and the bridge as no-fly space.
   `blk_pod.js`: the pod starts docked (`podInit`), boarding runs the collar in, LAND within 18 m of the spot docks
   (`podDockStep`) and you step out into the collar; the pad by the airlock (`podStop`) is gone. The door in the outer
   glass is a `glassFront` door; `crescentGallery` leaves a framed opening in the gallery's roof for the bridge.
9. Details and realism everywhere (CP-30).
10. The garden domes (T-09), then Infinity Hall (T-07) and the Garden of Primes (T-08) with their links, the
   observatory (T-10), the pod port and terminal (T-14, T-15), the sports dome (T-11), the hangar and test yard (T-12,
   T-13) with the new rovers ([rover.md](rover.md)), each with its link (T-17).
