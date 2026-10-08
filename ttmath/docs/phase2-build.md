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
   ~~The Gate Hall's screens easy to read~~ (v0.21): `blk_board.js` draws each page on the screen's canvas
   (`drawSchedulePage`: `schDay`, `schHomework`, `schSplit` into columns without splitting a start time, `schColumn`,
   `schName`, `schRoom`; `drawContestPage`: `conCard`, `conWhere`, the notes), `pagedScreen` keeps the canvas and its
   texture and `screensUpdate` (from `campusUpdate`) turns the page when its time is up; `SCR_FORCE = [i, j]` holds
   given pages (for shots). The contests' dates, times and short names for the cards are `SCREEN` in `campus_contests.py`.
9. Details and realism everywhere (CP-30). ~~Comfort, and no cartoon (CP-38)~~ (v0.20): `blk_soft.js` (after `blk_wings.js`) has `softBox`
   (a box with rounded edges and corners whose faces may bulge like a cushion: `puff`; the stuffed faces are sampled finer),
   the pieces (`sofa`, `armchair`, `ottoman`, `pillow`, `tableLamp`, `lampTable`, `walnutTable`, `readingTable`, `banquette`),
   `shelfBooks` (books on a bookcase placed with a frame), `lampLight` (a lamp's warm light for the bake) and the contact
   shadows (`contactShadow` from `crsPlace`, one mesh built by `softShadowsBuild` at the end of `crescentFurnish`). The fabric
   colours, bouclé and a rug's pile are in `blk_mat.js` (FABRIC `g.x` 0 to 12, `g.y` 1 bouclé, 2 pile; PLASTER `g.y` 4 linen,
   5 sage). `readingRoom` (`blk_ringfurnish.js`) follows the program's layout; prints in rooms are `RING_ART` entries with a
   `room` and a `wall` (`corridorArt` hangs them on the room's back or front wall). The program: `tools/campus_furnishing.py`.
   (v0.22) The teachers' room, the games room (`giantChess`, `chessPiece` in `blk_crsfurnish.js`), the café, the pod
   lounge and the lower hall in groups; `roomPlants` keeps every plant its own reach (`plantReach`) from the walls. The
   reflections are read at the blur the surface's roughness asks for (`ENVTEX`, `ENV_LOD` in `blk_mat.js`: an explicit
   level with WebGL 2 or the shader-texture-lod extension, at least the level the pixel's footprint needs); `enc` in
   `page.html` scales its dither by the square root of the encoded value, so near-black pixels are no longer dithered.
   (v0.23) `blk_classdetail.js` (after `blk_notices.js`; `classDetails` from `crescentFurnish`): `wallClock` over each
   classroom's board, its hands (`clockAt`, `handMesh`) turned by `clocksUpdate` from `campusUpdate` at the visitor's time
   (`CLOCK_T` holds a time for shots); the pinboards drawn on one canvas (`pinAtlas`, `drawPinboard`: `roomWeek` from the
   timetable, `nextContest`, `diagramSheet` with a print's drawing, `quizSheet`, the notice boards' `flyer`) and hung as one
   mesh on the back walls, from `P2.ring.pins` (`RING_PINS`).
   (v0.24) `blk_artcare.js` (after `blk_ringfurnish.js`; `RING_FURNISH` maps the kinds clinic, art and music to its rooms):
   `clinicRoom` (`examCouch`, `curtain`, `curtainTrack`, `clinicCounter`, `frostedScreen` round the counsellor's room, `restBed`); `artStudio` (the paintings drawn on one canvas,
   `paintAtlas` and `drawPainting`, laid as one mesh by `paintMesh` on the easels and the back wall; `tableClutter`,
   `stretcher`, `kiln`); `musicRoom` (`grandPiano` from a real case outline, `pianoPath`; `uprightPiano`, `pianoBench`,
   `ensembleChair`, `musicStand`, `practiceBooth` with its glass in `CRS_GLASS` (its normal toward the corridor, so that from the room it mirrors the room), `hungGuitar` and `hungFiddle` on oak
   hangers, `cello`, `doubleBass`, `drumKit`, `arcSlats` on the outer wall, `onWall` for a piece on a back or front wall).
   (v0.25) `blk_labs.js` (after `blk_artcare.js`): `physicsLab` (`labBench`, `labStool`, `demoBench`, `newtonsCradle`,
   `bellJarBase` with its glass from `glassLathe`, `airTrack`, `apparatusCabinet` with `cabinetGlass`, `vanDeGraaff`,
   `sideCounter`, `leadBoard`); `glassPane` and `glassLathe` put glass in `CRS_GLASS` with normals away from the viewer so
   it mirrors the room. The Foucault pendulum: `foucault` lays the disc and pegs and keeps the wire and bob in `FOUC`;
   `pendulumBuild` (from `buildCampus`, once the lights exist) bakes them as a mesh of their own, `pendulumUpdate` (from
   `campusUpdate`) swings it about its pivot (`FOUC_T` holds a time for shots). `PEND` is the Math Palace's pendulum.
   (v0.26) `makerSpace` in `blk_labs.js`: `makerBench`, `powerDrop`, `printerBox` (glass from `glassPane`), `laserCutter`,
   `arenaTable`, `rover`, `sheetRack`, `spoolShelf`; the tool wall and the arena's mat are drawn on one canvas
   (`makerCanvas`, `MAKER`) and laid by `texQuads`, unlit quads of fixed brightness as the art studio's paintings.
   (v0.34) `competitionRoom` in `blk_labs.js`: `compCanvas` draws the scoreboard (`compScoreboard`) and the demonstration
   board (`compChessBoard`) on one canvas laid by `texQuads`; `trophyCabinet`, `chessClock`, `chessGame` (the giant set's
   pieces at a sixth), `teamKit`. The Ring's frames (`crsFrame`) are mirror-handed: `texQuads` flips u where a frame's
   determinant is negative, pieces with a left and a right go in with `crsPlaceTrue` (the grand piano, the uprights, the
   drum kit), and at a `gameTable` the players sit at its +-z (so a1 is dark, on White's left). Plants (`blk_crsfurnish.js`):
   `plantFits`, `plantSpot` and `placePlant` keep a plant's reach inside its room's walls and clear of the doors' way in and
   their open leaves, its pot clear of the furniture placed before it and of the other plants, as near its spot as fits and
   by a wall, smaller (0.85, 0.7) if it fits nowhere near; `CRS.plantLog` lists where each went. The 'shelf' pothos
   (`pothoswall`: its vines only forward) goes on an oak wall shelf, else on a bookcase, else on a `plantStand`. The stair
   bays: `bayDims`, `bayY` (walking) and `bayStair` (blk_ring.js) from `bay_stair` in campus_rooms.py. `walk_check.py` goes
   up both grand stairs and through the east bay (down flight 1, up flight 2, under them to the bay's end).
   (v0.35) `blk_service.js` (after `blk_labs.js`): `washrooms` (`wcSuites` with `wallWC`, `stoneVanity`, `tallCupboard`; the
   banquette and `slatWall` on the door's side). The pothos variants: `pothos` (on a desk, short vines), `pothoswall` (on a
   shelf or a bookcase, its vines forward only), `pothosstand` (on a `plantStand`).
   (v0.36) `blk_kitchen.js` (after `blk_service.js`): `kitchenRoom` with `cookingIsland`, `canopyHood`, `steelTable`,
   `kitchenShelves`, `doubleSink`, `combiStack`, `walkIn`, `dishStation`, `passCounter`, `handBasin`, `speedRack`, `goodsLift`,
   `dryShelving`; the kitchen has no hanging lamps (blk_ring.js leaves it out; flush panels in its ceiling). Its steel is
   satin stainless (STEEL g.x 2 in blk_mat.js, set by `satin(b)` on each piece): brushed steel mirrored the warm room and read brown.
   (v0.37) The pod gates: `blk_poddock.js` keeps every dock in `PDKS` (`PDK`, the Ring's, is `PDKS[0]`; the gates are
   `PDKS[1..4]`, gate 1 to 4), each with its frame (`org`, `O`, `T`; `pdkAt(P, u, v)`, `pdkUV(P, x, z)`), its floors (`yB`
   the bridge's or landing's, `yD` the deck's or well's), its spot `sp` and heading `hd`, its collar; `pdkOf(pod)` gives
   the dock holding a pod. `pdkWell` builds a gate's well and cuts the ground over it (`p2Sector`, one of the 16 cuts);
   `blk_entrance.js` leaves the gates' doorways out of the drum (`entDoorway`) and frames them (`gateSign` for the
   numbers). A pod LANDed within 18 m of a free dock docks there (`POD.dock`); it climbs to the dock's `safe` height
   first (over the dome's cap for a gate) and comes straight down. `__mars.pod('board', i)` boards `POD.list[i]`.
   (v0.38) `FOLIAGE` in `blk_plants.js`: per kind, [spread, height] factors applied at the end of `plantBuilder` to a
   potted plant's foliage (every vertex after the pot's, `POT_END`; heights about the soil, `POT_TOP`), never to the pot
   or to plants in beds; `placePlant` measures the smaller reach (`plantReach`), so the plants stand nearer their spots.
   (v0.41) `bedPlantKept(B, kind, seed, F, rot, soilY, k, zIn, zOut, yMax)` in `blk_plants.js`: a bed plant in the ring's
   frame F whose crown is folded back (smoothly, from 70 % of the limit) where it would pass zIn toward the palace, zOut
   away from it or yMax over the floor; used for the gallery's troughs (its wall, its sloping roof: `roofAt`) and the grove.
   (v0.42) The leaf atlas (`leafTexture`) makes its own mipmaps: each 256 px cell's alpha is scaled at every level so the
   share of it over the alpha cut stays what it is at full size; draw a new cell as small leaves on twigs and it stays
   leafy from afar (check a cell alone in the browser: draw it on a 1024 px canvas, count alpha > 127; the maple's and the
   olive's sprays cover about a third). Bed plants pass their scale k to `plantBuilder(kind, seed, true, k)`: `LKm` =
   k / 1.45 (1 to 2.2) divides a spray's size and multiplies the number of sprays by its square, so a 5 m maple has
   leaves of a real maple's size; the maple, the olive and the fig use it, and a kentia with `LKm` over 1.2 is built
   grown up (trunks with crowns). `leafCard`'s last argument, rows along the card (default 4), is 2 for small sprays.
   (v0.44) `blk_cases.js`, after `blk_notices.js`: `ringCases` hangs RING_CASES on the lower corridor's back wall (r0), the
   models per theme in `caseModels` (a case's frame: x along the wall, y up, z out; the shelf at 0.5), the glass in
   CRS_GLASS; `ringSafety` puts the extinguisher cabinets at room boundaries with solid wall on the corridor side (not halls,
   bays, glazed rooms or the Gate Hall), clear of that floor's doors, by the look-ahead rule in RING_SAFETY; call points by
   the bays' doors; sprinklers between the corridor downlights and smoke detectors every 9 m. `CRS.safetyLog` lists the
   cabinets. PLASTIC colour 21 is fire red (blk_mat.js).
   (v0.45) The garden ring's beds (`bedRun` in `blk_gardenring.js`, from P2.garden_ring.beds): runs of angle clear of the
   paths (`keep`, a path half-width in metres), the palace's vault and vestibule and the grove; each a curb, soil and rows
   of plants by `bedPlantReal` (a bed plant with the potted plant's proportions, FOLIAGE, at scale k), six seeds a kind so
   the builders are shared; the beds are posts ({bed, r0, r1, a0, a1}) that `gardenSupport` keeps you out of.
   (v0.49) The Builder's arrays are typed (`blk_builder.js`): `nv` points and `ni` indices used of their room, which
   `grow(k, j)` doubles; read `b.count()`, never `b.p.length` (that is the room). `build()` gives three.js the arrays
   themselves (16-bit indices when they fit). `furnRelease()` empties the furniture cache (FURN) at the end of
   `buildCampus`; a piece asked for later is built again. A baked mesh drawn once (`bakeDrawn`) gives its position,
   normal and index arrays to the bake worker without a copy and drops its facade and material arrays; the traced light
   takes the place of its light arrays and is dropped once drawn (`bakeDrop`): never read a baked mesh's arrays after
   the bake has started (`__mars.campusSample` must run before it, as `shot.py --sample` does). The quick light and the
   worker take no power for a lobe of 1 or 2 (exactly sp and sp * sp); the worker lists each zone's lights by 4 m cell,
   in their order, so a point meets the same lights in the same order. `lateTexture(f)` (`blk_palace2.js`) draws a
   canvas texture with the palace's, after the first frames (the prints' and the pinboards' atlases). Measure the load
   with `tools/load_profile.py` (`--cpu 4`, `--heap-limit 256`).
   (v0.50) `bakedMesh(B, mat, null, null, { later: true })` (the campus, the Ring, the drapes, the palace) leaves the quick
   light to the bake worker: its first step is `quickLight` (bakeQuick's sums on the packed lights, the same grid), sent back
   as `{ quick, light }` before the voxels; `frame()` starts the worker once the campus has been drawn. If no worker can be
   made, `bakeQuickLeft()` lights them on the page. The entrance dome's edge beam follows `entReach`/`entTop` where the cap
   meets the Ring's front (`blk_entrance.js`).
   (v0.51) `Builder.track()` keeps the start of every piece (each `quad`, `geo`, `surf` or `add`); `buildChunks(S)` builds a
   tracked builder as one geometry per S metre square (by each piece's middle; a piece wider than S goes to the first
   chunk), and `bakedMesh` makes a group of them, each culled on its own and drawn in a fixed order (`renderOrder`). The
   campus (B), the Ring (W) and the palace (P, 12 m) are tracked: `campus`, `wings` and `palMesh` are groups now (their
   `children` are the chunks). No piece is cut, so the bake is the same (`window.MARS_ONE_MESH = true` before the page
   loads builds them as one mesh, for tests). INT_KEY (the inside's exposure) is 0.22. A potted maple is FOLIAGE-scaled
   1.32 with LKm 1.32 (the same leaf size).
   (v0.52) `b.bevel` (metres) rounds a builder's boxes (`bevelBox`: inset faces, edge strips with turning normals, corner
   triangles, through `polyN`); `furn()` sets FURN_BEVEL (7 mm) on every piece of furniture; boxes under 25 cm or thinner
   than 12 mm, and boxes without a bottom, stay sharp. `b.lastBox` is where the last box's points start (use it, not
   `count() - 24`, to tag one). `shelfBooks(B, M, k)` (`blk_soft.js`) fills a bookshelf with real books whose spines and
   covers are the campus atlas's book columns (`drawBooks`: BOOK_N = 48 spines, each over a swatch of its cloth).
   (v0.53) `piping(b, x0, x1, zf, zb, yTop, r, mat, col, gy)` (`blk_soft.js`): the seam cord round a softBox cushion's top
   (front and sides) where its edge of radius r meets it; on the sofas', banquettes' and club chairs' seats.
   (v0.54) The bake worker's `solid(x, y, z)` answers the ground test by cell where it can: GTOP (the highest the ground
   can be in a cell: its 3 x 3 heights, less 5 cm) clears a point above it, and CUT1 marks a cell wholly inside one cut
   (the palace circle, the vestibule, a box cut, a full ring band), never solid; the rest are tested as before, so the
   light is the same to the bit (checked on the whole bake) and a quarter quicker. `pot(b, kind, r, h)` rolls each rim
   round (radius min(12 mm, r / 20)).
10. The garden domes (T-09), then Infinity Hall (T-07) and the Garden of Primes (T-08) with their links, the
   observatory (T-10), the pod port and terminal (T-14, T-15), the sports dome (T-11), the hangar and test yard (T-12,
   T-13) with the new rovers ([rover.md](rover.md)), each with its link (T-17).
