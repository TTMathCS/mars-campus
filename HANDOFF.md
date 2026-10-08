# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 8 Oct 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## Where the work stopped: 7 Oct 2026, 02:45 UTC (read this first)

**8 Oct, 03:05 UTC: one walk, painted with the path-traced 360s.** Jim: "I don't need to walk. just walk freely is
good enough. but walk freeely doesn't have the good quality as walk the crown, while walk teh crown doesn't walk well
with w, and distorted. just merge them into one free walk and give best quality and real expereience with speed";
"why 2 links still exist and separate? I said need to merge into one". So:
- **One link, Walk the Crown → `palace/walk/`** (the free walk) on every page; `palace/photowalk/index.html` only
  forwards there. The photo walk's viewer (`pw.js`, `pano.js`) is no longer linked; its plan and 360s are the walk's
  pictures now.
- **`palace/walk/photo.js`**: the free walk's rooms take their colours from the 360s in `palace/photowalk/v/`. The
  three nearest 360s that see the walker (others behind a wall count 12 m further) are in use; for each, the walk's
  opaque shapes (layer 1) are drawn from its eye into a half-float cube of distances (once, again when chunks load);
  a surface takes a 360's colour if that cube says nothing of the walk hides it and the 360's own distance map
  (`_d.png`) agrees (not far nearer than 0.3 x, not further than 1.08 x + 0.25 m: the picture's own leaves, missing
  from the walk's thinner trees, are drawn onto what is behind them). Weights 1 / (d^2 + 1) by the walker's distance,
  fading over ~0.7 s as 360s come and go; mixed in after the walk's tone-mapping and sRGB (the pictures are graded),
  only when rendering to the screen (`#ifdef TONE_MAPPING`; not in the floor mirror's pass). Where no 360 sees a
  surface, or the room has none rendered yet, the baked colour stays. Patched kinds: baked, floor, vertex, glow, metal.
- **Keys** (Jim: "free walk should enable left right up down keys"; "don't use mouse since it is not easy to quit
  mouse"): no pointer lock; W/S and up/down walk, A/D and left/right turn (80°/s), a drag looks round, Esc pauses.
- **The 360 tour is not to be touched** (Jim: "DON'T touch 360 tour for each room, which i like very much"). The photo
  walk had been writing its tour stops' 360s into the tour (Arrival, Door, Hangar, Dressing, Suit room, Breakfast,
  Garden, Stars, Telescope, 7–8 Oct); that is switched off in `photowalk_render.py`, `photowalk_sync.py` and
  `autopub.py` (it publishes no 360 at all now). Those nine stops show the walk renders; nothing was reverted.
- Next: the walk's own shapes are what limit it now: thin trees (`plants.DETAIL` 0.25 in walk_bake.py) and furniture
  decimated to 8000 faces (`lighten`) give "blurred or broken" edges (Jim). Re-bake with full plants and much less
  decimation; finer distance maps for the 360s (C-04.2's is 256 x 128); the bark's vertex colours (purple/green
  streaks where no 360 sees a trunk).
- The planner now links points by ways on free floor 0.35 m clear (corners round furniture, `links` in plan.json)
  and keeps every rendered point; 227 points, 56+ rendered.
- **04:00: a test bake of the Arrival part with the pictures' own plants** (`walk_pilot.sh suit,hangar,arrival
  p072full 24`: `WALK_DETAIL=1.0`, no leaf cap, `WALK_MAX_FACES=60000`), queued on machine A after the Arrival 360s and
  a re-render of C-04.2 (its 360 was the first test: 768 px faces, a 256 x 128 distance map; set aside in
  `final/photowalk_old/`). It writes `walk/p072full.packed` only. Test it in the merged walk from a separate copy of
  the site (never by changing `palace/walk/data` in the repo: autopub.py commits that folder), and publish it only if
  the trees and the furniture's edges are clearly better and the chunks stay a reasonable size (c0960.glb is 4.5 MB
  now). Why: the 360s' maple has about four times the walk's leaves; the extra ones are painted onto the wall behind
  it as orange spots once one walks past the tree.
- The container is reclaimed soon after the session goes idle (also ~01:58 and ~03:10 on 8 Oct): check-ins now every
  20 minutes (`send_later`).
- **05:40: the full-tree test bake is not used.** With the pictures' own plants the Arrival's two tree chunks went
  from 0.56 to 7 million triangles each (c0900 30 MB, c0960 32 MB, against 4.6 and 4.5): too heavy to load or draw.
  The old bakes had simplified at most one model a part (`simplified 0 models`), so simplification was not what made
  the free walk's edges look broken: that was the baked textures, which the 360s now cover. The leaf test in photo.js
  stays lenient (a surface behind something the picture saw is still painted unless that is nearer than 0.3 of its
  distance): a strict test (0.85) also drops what the pictures saw through the glass partitions (their distance maps
  record the glass) and leaves grey panels. The test bake is in the scratchpad (`walk/p072full*`), not the site.
- **Keeping the container up**: a job Monitor (`tail -F blend/log_a.txt | grep ...`, 30 min, re-armed at each expiry)
  keeps the session from being reclaimed while idle (up from 04:22 on with one); without one it went within ~20 min.

**8 Oct, 01:45 UTC.** The container was reclaimed again while the session sat idle (about 21:55 to 01:35: machine A
rendered nothing; B went on). A check-in now comes every 45 minutes (`send_later`) to restart the runner and autopub
if they are gone. Jim (to machine B): "w walk is not smooth. and while walking, the 3d angles looks really strange, and
distorted": held, W now walks on from point to point (the next point loads during the step), the view narrows from 90
degrees across to 72 while walking, A and D turn while held (`pw.js`). Every point keeps 1.1 m clear (one opened on
the maple's trunk).

**21:15 UTC: the photo walk planned again, and rendered at 1024 px.** Jim (Safari on a Mac): "it is not so good",
"the view is so close view. i need to bit far and zoom out", then "when i walk, it moves too fast. and I can see the
slow rendering of objects in slow motion. not good". So: one row of points down the middle of each room (8 m from the
windows and the glass, every 6.5 m) with the tour stops and the ways the walk needs (222 points; `photowalk_plan.py`
joins points that see each other on a new map of what stands 1.3 m up or more, `walk/data/tall.png`, made with the
floor maps by `walk_bake.py ... map`); faces of 1024 px at 8 samples, depth maps 512 x 256; the 768 px pictures are
gone (only C-04.2, rendered at 1024, stayed). The page: 105 degrees across to begin with, zoom out to 115, a point
looks first into the room; a step takes about 3 s for 6 m, waits for the next sharp picture, and the 360s change
over in the middle third. The floor maps were wrong for thick walls (inside a wall read as floor: one could walk
from the Arrival hall into the dressing room through its end wall); fixed in `walk_bake.floor_map` and all ten made
again. Machines: A arrival, dressing, bedroom, bath_up, salon, wellness, wine, dining, kitchen_up, day_room, sunset;
B hangar, suit, garden, observatory, studio, library, gallery.

**19:05 UTC: the photo walk is linked** ("Walk the Crown" in every chapter's bar, the Crown's card and page; the
free walk stays as "Walk freely"). The Arrival hall, the Door's room, the pod hangar and the suit room are in, all
reachable from the Arrival hall's stop (`photowalk_check.py`). Two fixes on the way: no point stands in the plane of
a wall or door (one rendered from inside the round Door; plan.json keeps dropped numbers as `retired`, and
`photowalk_sync.py` takes their pictures out), and the Arrival hall's stills close their scene with a "hangar end"
wall that `photowalk_render.py` now leaves out when the hangar is built beside it (it stood in the opening between
the hangar and the Door's room).

**18:00 UTC.** The container restarted at about 15:40 and nothing rendered until 17:28: after any restart, start the
runner and `autopub.py` again (and tell machine B to restart its queue and `photowalk_sync.py` loop). The photo walk
renders at **768 px faces and 8 samples** (193 s a point in the Arrival hall; 1024 px and 16 samples took 512 s and
look nearly the same once denoised), both machines: A arrival, dressing, bedroom, bath_up, salon, wellness, wine,
dining, kitchen_up (then the Arrival again for its moved doorway point); B hangar, suit, garden, observatory, studio,
library, gallery, sunset, day_room (each job after a `git pull`, so it reads the latest plan). The tour's 360s come
from the photo walk's stops now (the Arrival hall's is in). Jim, of the free walk: "after few steps I cannot control
and it keeps moving forward by itself": the Glide carried everyone on it at 3.2 m/s; now it carries one only while
one stands still on it, and a key stops it (`walk/walker.js`).

**15:10 UTC: the photo walk.** Jim tried the free walk: "the loading is very slow, and the experience is not as good
as I thought. is there anyway to improve the speed while improve the quality to real life?" He chose **both, the photo
walk first**: a walk of path-traced 360s, Matterport-like (`palace/photowalk/`, not linked until its first rooms are
in). `palace/tools/photowalk_plan.py` designs it first (321 points: each room's tour stop, two staggered rows about
5 m apart on free floor from the walk's floor map, and points in the openings, doorways and the Glide where rooms
would not otherwise join; a re-run keeps the numbers of points already planned) into `palace/photowalk/plan.json`.
`render/photowalk_render.py <scene> plan.json final/photowalk 1024 16` renders a scene's points with its neighbours
built as far as 6 degrees each side: six cube faces of 1024 px a point (16 px rendered past each edge and cut, so the
denoiser leaves no seams), a depth map (256 x 128, 16 bits), graded as the scene's first point (its tour stop);
`<id>.webp`, `<id>_s.webp` (a quarter size) and `<id>_d.png`, and for a tour stop the tour's 360 (4096 x 2048) into
`final/crown_pano/`, so the tour gets it through autopub. `photowalk_sync.py` (inside autopub on machine A; a loop on
machine B: `python3 blend/photowalk_sync.py <render dir> b loop`) copies finished points into `palace/photowalk/v/` and
lists them in `index_a.json` / `index_b.json` (one list per machine, so their pushes never collide). The page
(`pw.js`, `pano.js`) draws each 360 on its depth map's shape, so a step glides between points with parallax; it
loads one small picture first, then the sharp one, and steps only to points it can see (the depth map decides).

**Jim, 7 Oct:** "Go ahead to finish crown first. I need walkable in crown. I feel progress too slow"; "all the rooms
should have the window same as master room" (the old 360s and photos showed the revision G windows high on the walls:
the old 360s are hidden until their new ones are in, `tour_crown.py`); "webpage nothing changed" (the Crown's page now
opens with six of the new room pictures, `crown.html#inside`); **"don't wait to publish. as long as new rendering finish
just publish"**: `autopub.py` runs on this machine (from the scratchpad: `python3 blend/autopub.py <scratchpad>`,
restart it after a container restart, with the runner): every 90 s it grades and publishes each new final or 360 of
either machine and pushes, and joins the walk's parts. **The walk first:** both machines bake the walk's ten parts
(`walk_part.sh <rooms> <tag>`, five parts each), then the 360s. Outside views of revision H render in seconds
(`overall.py`): publish them over `palace/design/img/crown-*.jpg` and `site-aerial.jpg`.

**12:40 UTC: the walk is live** (`palace/walk/`, linked as "Walk the Crown" from every chapter's bar, the Crown card
and the Crown page), first the Arrival part (72 to 108 degrees) and the sunset part (252 to 288). The ring is baked a
part at a time (`walk_part.sh <rooms> <tag> 24`, about 35 minutes a part; machine A: p072, p108, p144, p180, p216;
machine B: p252, p288, p324, p000, p036); `autopub.py` joins the parts (`walk_merge.py`) and pushes. Fixed on the way:
the simplifier no longer decimates plants (trees became shards), the doors onto the Glide stand open in the walk
(`crown.DOORS_OPEN`), thin glass walls block walking, and the Glide's lane is not closed where parts meet. Never copy
a new `walk_part.sh` over one a running job is reading (bash reads a script as it goes). Then: the 360s, both
machines, each back into the tour by itself (autopub).

### 7 Oct 2026, 02:15 UTC

Jim's newest ask (7 Oct): **"painting should not be on the windows"**, kept as a global rule (CLAUDE.md): nothing hangs
on, stands across or is fixed over a window. `palace/tools/render/audit_windows.py [room ...]` builds each Crown scene
and lists anything against the outer wall that covers a real window pane (seats, plants, lamps and low things are
allowed in front); **every Crown room audits clear** since 7 Oct 02:10 (gallery paintings, suit lockers, craft shelves
and kiln, print counter, telescope desks, guests' lounge desks, dining sideboards, the bath's tub and the hangar's door
wall were moved onto the solid wall between windows; `crown.pier_spots` and `crown.solid_runs` give the places). Run
it after any change to a Crown scene. **Published 7 Oct:** the Arrival hall (revision H). The studio scene had an
endless loop from 01:13 to 01:50 (fixed, 5dbf476): a job that sits building a scene for more than 2 minutes is stuck.

**Also 7 Oct:** the dining hall published (two views). **Blender files** of the new scenes were 140 to 230 MB (a
room of maples), over GitHub's 100 MB a file: `save_blend.py` now keeps each plant's leaves as instances of its leaf
(`plants.INSTANCE`, a geometry-nodes modifier on a mesh of points; checked equal to the joined meshes, wellness 231 to
14 MB); save each scene once all its finals are published. **Outside views:** `overall.py crown-day,crown-sunset,
crown-garden,site-aerial` renders the Crown from outside (to replace the Rev G real-time pictures of those names in
`palace/design/img/`); its middle now has the Orb's dock and the spire pads of chapter 02.

### 6 Oct 2026, 20:40 UTC

Jim's newest asks (6 Oct): every Crown room glazed onto the Glide like the master bedroom (done, his choice A);
**"no nuclear reactor is needed since it is provided by city"** (done everywhere, the spaceport's picture too); and
**"Can you review the plan?"** (done: the review and its fixes are in `palace/docs/decisions.md`, "the plan
reviewed"; **three questions wait for his answer** in `palace/REQUIREMENTS.md`, section 10: Q1 what else the city
provides, Q2 the true reason for day below / night up, Q3 the Pentagon now 7 times the Crown). His brief for the
Crown is `palace/docs/crown-rev-h.md`; Gaussian splats were tried and set aside (6 Oct).

**The pipeline now.** Both machines render one job at a time: this one from `blend/queue_a.txt` (runner and pusher in
the scratchpad; restart them after a container restart), the second (session_01FjAVBjC6iYGKfCFcyGwjNW) from the list
sent to it, pushing raw finals to `palace/blender/renders/crown_h/`. Each final is graded (`grade.py pale|day|night`),
published with `pub.py photo`, and its room's entry in `gen_plan.py` updated. **Published with the glass walls:** the
sky pool (two), spa, gym, wine room (two), chef's kitchen (two), breakfast room. **Rendering:** salon (3), arrival
(2), dining (2), sunset (2), observatory (3) here; library (3) and studio (3) there.

**Rooms redesigned tonight because their previews were too empty or dark** (furnishing program first, then code;
previews `prev/g3_*`): the sky garden (two island beds and a basin plaza on the black platform), the dressing room
(a sitting corner, a triple mirror, palms), the bath up (a bathing pool of black basalt in the middle, chaises,
kentias), the guests' lounge (a games table, a red maple, chairs at the windows), the suit room (slat ceiling, light,
club chairs, agaves, a photograph), the pod hangar (both pods home, lines of light in the ceiling, washers, palms at
the Door), the gallery (Jim's big canvases, four lit sculptures). Their finals follow the previews.

**The 360 tour of the Crown:** a stop in every room, 29, written by `palace/tools/tour_crown.py` from the scenes'
stops (keep the two in step); `python3 palace/tools/tour_crown.py jobs` prints the render jobs (4096 wide, 24 spp,
about 15 min each). Publish each with `pub.py pano`, add its id to `CURRENT` in `tour_crown.py`, run it again. Old
Rev G 360s stay shown, with their old captions, until replaced.

**Still to do, in order:** the finals above; the 29 360s; the Crown's pictures from above (`img/above/crown-*.jpg`
are Rev G); the outside pictures of the Crown (by day, from the garden, at sunset, the site from the air: still the
Rev G ring, from the archived 3D model; `overall.py` has the Rev H ring and could render them path-traced); save each
scene's `.blend`; the walk; then the other levels (the guest lounge, the moss garden, the music room first).

## Work log (newest first; every step is pushed as it finishes — Jim, 3 Oct: "keep your progress logged and synced")

### 6 Oct, from 19:50 UTC
- Published the second machine's finals (pool, spa, gym, wine) and the kitchen and breakfast room; the review of the
  plan (Rev H numbers and drawings everywhere, day/night leftovers, the requirements now hold the 4 and 6 Oct asks,
  three questions for Jim); the spaceport without reactor domes (archived 3D model, `book_renders.py`); the tour's 29
  Crown stops; seven rooms redesigned after their previews.

### 6 Oct, from 02:00 UTC
- The container had stopped at 23:40 on 4 Oct (the account's weekly limit); restarted the runner and the pusher;
  the second machine resumed after the reset and finished the turntable.
- Jim's rule turned round (by day in the ground, by night in the sky) across the idea page, the chapters, the room
  program (C-20 is now the guests' lounge), the plans' pairs and the docs.
- The hub's turntable published with all 72 frames of revision H; the salon's three views published.
- Gaussian splatting: toolchain built (OpenSplat on CPU), `splat_views.py`, `splat_publish.py` and `palace/splat/`.

### 4 Oct, from 22:40 UTC
- Synced main (TTMath commits only under `ttmath/`; the second machine's bedroom 360 and turntable frames 36 to 51).
- Paintings: 20 public-domain works fetched and catalogued (`fetch_art.py`, `art.json`), each placed by design:
  The Starry Night in the arrival hall; Kandinsky's Composition VII and Delaunay's Landscape with Disc on the salon's
  screen walls; Turner's Wreck of a Transport Ship over the hearth; Van Gogh's Olive Trees and Wheat Field with
  Cypresses across the dining table; Monet's Water Lilies and the Rhône at night in the master suite; the straw-hat
  self-portrait in the study; Hokusai in the bath; Caravaggio in the wine room; Matisse in the dressing room; Udnie
  in the recital room; Mondrian and Léger in the guests' day room; Delaunay's Metzinger in the library; Claude
  Lorrain's harbour in the map room; the thatched cottages in the breakfast room; the Night Café and Edtaonisl in the
  gallery. Checked in the salon and hearth previews (gilt frame, picture light).
- Tour: the Crown map of revision H, a clickable dot in every room (tested in Chromium: the Gym's dot opens the pool's
  360 turned to the gym; the hearth room's dot turns the salon's view).
- Pages: the hub shortened to the model, two place cards and the chapters; `idea.html`; book name, top bar, cross
  links and room names made consistent; `explorer-rooms.json` dropped (nothing read it). Tested at 1280 and 390 px.
- Wellness designed and built anew (`crown_wellness.py`, `gym.py`); room program and furnishing program updated first.

- **4 Oct, from 14:30 UTC: the Crown's revision H, and a design pass over every room (same session; both machines
  stopped 14:50 to 17:40 at the usage limit).** Jim's asks, in order, and what each became, are in
  `palace/docs/crown-rev-h.md`; he asked to stay on the Crown first ("stay here focus on improve each image/design and
  focus on walking on the crown. then generalize ... and move to other rooms").
  - **The building:** inner wall r = 115 (ring 20 m wide inside), ceilings 12.5 m (20 m under the spires), windows at
    eye level on both walls lined in one piece of bronze (`crown.py`; `draw_plans.py`, `overall.py` the same).
  - **New libraries, each checked in a studio picture first** (`specimens.py`, outputs in the scratchpad's `spec*/`):
    `plants.py` (13 species), `seating.py`, `tables.py`, `lights.py`, `bed.grand_bed`, `art.py` (paintings from
    `assets/art`, gathered by `fetch_art.py`, public domain only). The furnishing program: `palace/tools/furnishing.py`.
    New rule in CLAUDE.md/AGENTS.md: no small chairs; every plant chosen.
  - **Rooms rebuilt so far:** the master suite up (published), the star lounge (switchable glass walls, `DAY` flag in
    `crown_rooms.py`: cams with `day=True` render by day, glass dark), the salon, the Arrival hall (the great maple in a
    round banquette). Suite doors and glass: `crown.glass_wall`, `crown.partition` (doorways), `crown.glide_lights`.
  - **Pages:** the tour's bar shows only the current place (Pentagon | Crown switch); the hub's popup is gone (each
    part links to its page). A full reorganization of the pages is in hand (one place per page, cross-links, one name
    for each thing).
  - **Second machine** (session_01FjAVBjC6iYGKfCFcyGwjNW): suite door and bedroom 360 finals, then turntable frames
    36 to 71 and hero/whole of revision H (pushes to `palace/blender/renders/crown_h/` and `house_h/`); this machine
    renders frames 0 to 35 and the label spots. Publish with `pub_house.py` when all 72 are in.
  - **Still to do on the Crown:** every other room per the furnishing program; a 360 stop in every room on the tour's
    ring map; the sky garden's "black platform" (meaning not yet confirmed by Jim); the walk baked again, whole ring
    (streaming chunks, `walk/chunks.js`, far band `band.glb`). Noted for later (other levels): the guest lounge's sofas
    facing a table, the moss garden made real, the music room's sofa along the wall.
- **4 Oct, from 12:40 UTC (same session; both machines had stopped at 05:20 when the account hit its usage limit):**
  Jim: "render too slow, maybe 2 at a time. also after you finish rendering L1, I need to make walk on crown ... use
  keyboard and mouse to walk around the crown and give me real life experience. I literally mean real impressive
  feeling"; then "go".
  - **Two render machines.** This session's queue (`blend/queue_a.txt`, `runner.py a`) and a second cloud session,
    `session_01FjAVBjC6iYGKfCFcyGwjNW` ("Arcadia renders, second machine"), which renders `final.py` jobs and pushes
    the raw pictures to `palace/blender/renders/residence/` (commits "Raw render: ... (second machine)"); this session
    grades and publishes them. Its jobs now: `pano:bath, s_kitchen, pano:kitchen, plan:suite, plan:residence`, then
    `pano:terrace, pano:bridge, pano:court`. Here: music and dining stills, the guest lounge, the lap pool's finals
    (the sun now through glazed slots, exposure -1.5), a new Arrival 360 (the stop moved 6 m from the olive tree), then
    the Crown walk's bakes.
  - **Published:** the master suite down (bedroom, moss garden, bath; bedroom and garden in 360), the memory rooms
    (two photos, a 360, the plan from above; their own entry on the residence page), the Arrival hall (photo, plan
    from above). The cinema's `.blend` is archived; `make_screen.py` makes its screen picture (no script made it).
  - **The Crown walk, `palace/walk/`** (not linked yet; data comes from the bakes): first person in three.js, its
    own copy of three.js r186 in `walk/lib/` (`three.module.min.js` bundled with esbuild from npm `three@0.186.1`,
    and the addons it imports), modules `ring.js` (the ring's frame), `walker.js` (keys, mouse, the floor map, the
    Glide at 3.2 m/s clockwise, jumps in Mars gravity, head bob), `mirror.js` (reflections in polished floors),
    `walk.js` (loading, materials). A view can be opened from the address: `#b=152&r=129&h=-25&p=8` (bearing,
    radius, heading from clockwise, pitch).
    - **How it is lit:** `palace/tools/render/walk_bake.py <rooms> <out> [spp texel chunk stage b0:b1]` builds the
      rooms in one scene (`crown.PAD = 0`, so stretches meet) under one afternoon sun (bearing 195, 32 up), cuts the
      ring into 6° chunks, joins each into one mesh (Blender bakes object by object and reloads the scene for each;
      `keep_coords`/`rewrite` keep every material's Object and Generated coordinates as attributes), unwraps it,
      and bakes its colour (`DIFFUSE` colour, about 1.25 cm a pixel) and the light on it (`DIFFUSE` direct+indirect,
      half as fine, OpenImageDenoise, stored sRGB-encoded as light / 4). The browser draws colour x light with
      three.js's light map and AgX, the pictures' curve, at exposure 2^1. Leaves, the ceilings' oak slats and lamp
      shades keep their light in their vertices (16-bit). Then `node walk_pack.mjs <out> palace/walk/data`
      (glTF-Transform and meshoptimizer from npm, in the scratchpad's `walk/`) welds, quantizes and compresses.
    - Found on the way: the slats of every slat ceiling faced inward (renders do not care, bakes came out black);
      `crown.slat_ceiling` now turns them outward.
    - Test (salon, 4 samples, coarse): the hearth room, the salon's sofas and olive trees, the slat ceiling and the
      Glide all come through; a full-quality test of two chunks is in the queue, then salon + wellness (144° to 216°).

- **4 Oct, from 02:00 UTC (same session, after a restart of its worker):** Jim: "the newly created rendering are not
  as good as before"; "new ones are bit too bright and looks more not real"; "did you use blender for rendering? if so
  can you put original files somewhere so we can reproduce or improve later? just archives all those original design
  files"; "please keep this rule in the memory". Done and pushed:
  - **Measured** the new pictures against the earlier ones (hero, library, salon, dining): lifted blacks (the darkest
    5% of pixels at 0.14 to 0.26 against 0.03 to 0.11) and a third less contrast, from too much soft fill light and
    from the vignette fix of 3 Oct (the old pictures had, by accident, 15% less light outside a centre oval).
    `palace/tools/render/grade.py` (day, night, pale) maps a picture's tones to the earlier ones'; the Studio,
    Observatory, breakfast room, sky garden and guest lounge photos and the Studio and star lounge 360s are re-graded
    and published. **Grade every picture before publishing** (`grade.py day|night|pale src dst`, then `pub.py`).
  - The sky garden's 360 is **hidden again** (`ready: false`) until the reworked garden's renders replace it.
  - **New global rules in CLAUDE.md and AGENTS.md**: keep every original design file (scripts, a `.blend` of every
    scene, its textures) in `palace/blender/`; match the earlier pictures' tone.
  - **`palace/blender/`**, the archive: `save_blend.py <scene> palace/blender` writes `scenes/<scene>.blend`
    (compressed, every camera of its pictures and 360s, render settings), textures in `assets/`, the glTF models'
    textures in `scenes/textures/` named by content. README there. The Pages workflow uploads the site without it
    (`rsync --exclude palace/blender`). Saved so far: the great library (25.6 MB); the rest are in the render queue,
    one scene per job; commit each as it lands.
  - The new scenes' scripts are committed (they were only in the scratchpad): `garden_level.py` (the lake, L2-11),
    `club.py` (the wine cellar, L1-20), `sport.py` (the lap pool, L1-23), `memory.py` (the memory rooms, L1-14),
    `make_photos.py` (their photographs, cut from Poly Haven's CC0 skies, now fetched by `fetch_assets.py`).
  - **Previews judged against the earlier pictures, none published yet:** the Orb's lounges look computer-made (a
    plastic Earth, a flat white galaxy, the purple Gate) and are **on hold**, off the finals; the lap pool is cold and
    stark (grey tiles, black ceiling, black windows) and needs a new look; the lake reads as a grid ceiling over a dim
    hall (now: the day's sun through the sky of lamps, Nishita's sky on the panels; next: frame more water, beach and
    trees, less ceiling, a bluer sky); the cellar's aisle is close, its tasting room murky (now: uplights grazing the
    vaults, a light over every rack); the memory rooms are close (a smaller room, photographs hung close in three
    rows; the skylight softened). The sky garden is reworked (pebbles, stepping stones, fuller beds, box, a basin, ivy
    up the wall, a low camera among the plants) and its final still and 360 are in the queue.
  - Tour stops for the four new rooms are in `stops.js`, hidden. `gen_plan.py` writes the new area pages (CLUB
    `rooms-club` 03·3, SPORT `rooms-sport` 03·4, GARDEN `rooms-garden` 03·5) and the memory rooms' entry on the
    residence page by itself, once their first photo exists; `book.js` (CH, READY) and the index card still need
    adding by hand for each new page (for the club: `blend/add_club_page.py` in the scratchpad does it).
  - Later the same morning: the sky garden's new photo and 360 published (pebbles, fuller beds, basin, ivy); trees'
    leaves no longer stray into the air (`furn.olive_tree`); the Studio reworked (a sitting group facing the easels,
    a still life, a closer camera; preview queued); the lap pool reworked (warm limestone, the oak ceiling washed
    with light, the street lit); the lake reframed (lower, 22 mm, a bluer sky). The cellar's finals are rendering.

- **3 Oct, from 01:50 UTC, session `session_01U4NrzcFVFwFYPq6dhgJtP1` (working; it can reach PyPI, so it runs the
  renders):**
  - **The site is now *Mars – your new home*** (Jim, 3 Oct: "the title should not be 'Mars – No Way Home', should
    be 'Mars - your new home'"; the dash set as before, his lowercase kept): the homepage, every page's header and
    browser tab (`book.js`, `science.js`, `draw_plans.py`, plans re-drawn), the unlinked 3D pages, both READMEs and
    the decision log. Only the archives and the log's quotes keep the old name.
  - **Demo 2 is now *Arcadia*** (Jim: "just Arcadia"; "it is actually not house", so never call it a house or a
    retirement house in titles): the homepage card, the design plan (title *Arcadia · Design Plan*, "Jim's home on
    Mars" over it), the tour, the Atlas, chapter 01's maps, the science pages' callouts ("In Arcadia, Jim's home") and
    the docs. Since then the chapters, the plans' room texts and the docs say Arcadia too, and no caption says "the
    demo"; only "the house mind" (L3-14's system, a name in the approved plans) keeps the word.
  - **The homepage never says "demo"**: *Under construction · A city rising on Mars*, cards tagged *Built · Gale
    Crater* and *In design · Arcadia Planitia* (GN-17). **No notes for visitors** on any page (GN-18): the homepage's
    *How to move* and *What's real* are in `README.md` now; the footers' disclaimers are gone (map credits stay).
  - **Only `main`, no other branches** (Jim, 3 Oct: "actually I only need main branch and no other branches"), and
    **push each step as soon as it is checked** ("merge in the middle as well so I can view the changes and steer
    the direction"). Both are in `CLAUDE.md`.
  - Renders: the scratch folder is this session's scratchpad (`.../scratchpad/blend`, `bvenv` with bpy 4.2.0); one
    runner works down `blend/queue_a.txt` (the repo's queue, the dining still dropped: it is published and its scene
    has not changed).
  - **Step 1 done:** `palace/README.md` (Arcadia, the numbers, the status, no question left), `REQUIREMENTS.md` (the OR
    rows and GN-13 stand, CR-3 19,500 m², section 10 "None"), `docs/design/02-crown.md`, `03-pentagon.md`,
    `04-interiors.md` and `README.md` as the live chapters (the Orb at 48 m, Rev G codes, no 3D links), the decision
    log (the answered review table gone, the best-judgment table under its own heading), §1, §2 and §2b here. The
    plans pages lost their "approved by Jim on…" subtitle and footer (a status note, GN-18); three rooms' Rev B notes
    left the room program. The book's drawings re-exported (`docs_export.py book`; the unchanged ones restored).
  - **The Crown pool's ends** had no stone coping, so the end walls' tops lay level with the floor and rendered as a
    black band: fixed in `crown_rooms.py` (copings at both ends) before the wellness renders went on.
  - **Step 2 mostly done:** the real-time 3D demo (`index.html`, `src/`, `build.sh`, `crown/`, `orb/`, `pentagon/`
    and their tools) is in `palace/archive/3d-demo/` with a README (its how-to moved there from §3); its links, tools
    and `build.sh` work from there (the rebuild is identical). `palace/index.html` redirects to `design/`. Rev B's
    summary is `palace/docs/archive/plans-rev-b.md`, `plans_snap.py` sits beside the archived Rev B page, and
    `docs_export.py plans` reads it. `design/mars.html`, `living.html`, `docs/design/00a-mars.md` and `00b-living.md`
    are gone; the Rev F drawing is in `docs/archive/img/`. Link check clean (the tour's `#stop` links are script
    routes). Left: the Rev B sheet images in `docs/img/plans/`, once step 3 stops using them.
  - **Background processes die when the session goes idle** (the runner stopped at 02:23 and restarted at 12:07):
    renders only run while a turn is active. Each job skips what it has made, so just start the runner again.
  - **Step 3 done:** the design plan's room pages and the explorer follow Rev G. `draw_plans.py` tags every room
    polygon with its code and writes `palace/plans/shapes.json` (each sheet's size and every room's polygons by code).
    `gen_plan.py`: each room has `codes=[...]` (its label starts with them; its *Rooms* row lists Rev G's rooms with
    codes: the recital room C-11, no planetarium, no private spa, the Crown's Studio and Garden room as Rev G); sizes as
    the plans; the explorer's click areas come from `shapes.json` over the Rev G sheets (`../plans/svg/*.svg`).
    `plan_maps.py` (rewritten; needs Playwright) draws every "where it is" map from the Rev G sheet with the room's
    codes shaded; run it after changing a room's codes. Rooms with no pictures show their map instead of a "still to
    make" box (GN-18); `explorer.js` reads the sheet's size and uses the Rev G sheets for L2–L5 too. The Crown sheet's
    Orb circle was still 40 m: now `ORB_R`.
  - **Step 2 done:** the Rev B sheet images are in `palace/docs/archive/img/plans-rev-b/` (`docs_export.py plans`
    writes there).
  - **Published:** the Crown's pool (C-14) again, with stone edges at both ends: the 360, a new still
    (`tour/photos/crown_wellness.jpg`) and the plan from above.
  - **Chapter 08 Life support written** (§2b step 2): `palace/design/life.html` with five drawings (the loops, pressure
    and oxygen, the water loop, the farm's rooms, Jim's dose budget), `docs/design/08-life.md`, `life` in `READY` and in
    `docs_export.py`'s `BOOK`; SY-3, SY-4, LV-3 and GN-7 link to it. Every number is worked in the text or taken from
    chapters 02–07; our own estimates say so.
  - The 72-frame house renders are queued after the dining hall's 360 (`pub_house.py` publishes them as a full set).
  - **Chapter 09 Communications and space written** (§2b step 3): `palace/design/space.html` with four drawings (the
    link from Arcadia to Earth, the delay 2027–2031 computed in the page from JPL's approximate planetary elements,
    the moons and relays round Mars to scale, a Mars year at Arcadia), `docs/design/09-space.md`, `space` in `READY` and
    in `docs_export.py`'s `BOOK` (`docs_export.py book space` now exports one chapter only); SY-5 and GN-7 link to it.
    The design it sets: messages, not calls; Arcadia talks by radio to Relay 1 (over the spaceport, 202.1° E, 43° up),
    three areostationary relays pass messages round Mars and on to Earth by laser (radio to the DSN as back-up), and
    Relay 4 at Sun–Earth L4 carries the link round the Sun at conjunction (about 27 min); flat antennas in the corner
    pavilions' white roofs and on the port's tower, the fibre in the trench as back-up; L3-16 runs them. Dates worked
    with Mars24's method: Mars Year 39 began 30 Sep 2026; Jim lands mid-June 2027 at Ls 117, northern summer; Earth is
    then the morning star. Conjunctions 21 Mar 2028 and 25 May 2030; closest 20 Feb 2027, 30 Mar 2029, 12 May 2031.
  - **No "house" for Arcadia** in what visitors read: the Atlas (its labels, and Relay 1's text now says 3 to 22 min),
    the science pages' callouts and figure text, "the day house" and "the night house" in chapters 02 and 03, the Power
    chapter's labels. Three room texts promised live "calls" home, which the delay rules out: now video letters.
  - **Published:** Arcadia in section rendered again with the Orb at 48 m and the rooms as Rev G
    (`design/img/house-hero.jpg`, the homepage card, and `house-whole.jpg`); the 72 turntable frames follow.
  - **Chapter 10 Building it written** (§2b step 4): `palace/design/phases.html` with three drawings (the order of work
    2022–2030 against the launch windows, what each wave of ships brings, homes year by year to the 2060s),
    `docs/design/10-phases.md`, `phases` in `READY` and `BOOK`; SY-6 and GN-7 link to it; **all ten chapters are
    written**. The plan it sets (our best judgment; nothing here was asked of Jim): windows Aug–Sep 2022, Oct–Nov 2024,
    Nov–Dec 2026, Jan 2029 (worked from JPL's elements); 12 cargo ships land in early 2023 (the port's reactors, the
    ice mine, the fuel plant, the pads, the road and cable), 20 in spring 2025 (Arcadia's reactors, life support, the
    fittings, the drives); the dig 2024–25, the Pentagon bottom up 2025–26, air made through 2026 and let in early 2027,
    the Crown assembled 2026–27 and lifted in April 2027, the gardens planted early 2027 from saplings raised in a
    ship's hold; Jim and 4 cargo ships land in June 2027, by ship this once (the Orb is still being built when he
    leaves). The first two waves' cargo ships stay on the plain (stores, the first greenhouse, steel for the foundry).
    About 90 robots and 3,600 t from Earth; Mars gives over 200 t for each. Phase 2 2029–2038 (13 homes, the maglev
    opens 2033), phase 3 2038 to the early 2060s (233 homes; the civic seeds about 2040–2062), phase 4 after.
  - Next: the renders as they finish (the turntable's 24 frames at every third angle, then the other 48; the master
    suite down, the Arrival hall, the sunset lounge, the atrium's 360s, the music and dining stills).
- **3 Oct, evening (same session):** Jim asked why so few rooms were rendered. The container was reclaimed while the
  session sat idle (about 14:00 to 20:07 UTC), so the runner died; it was restarted with **rooms first** and the
  turntable's other 48 frames moved to the end of the queue (the 24 published frames turn fine).
  - **Three new Crown scenes** in `crown_rooms.py`, designed from the room program: `studio` (part 8: the art studio
    C-27 with easels in the north light, the photo and print room C-28 with Jim's prints of Mars, the craft room C-29
    with the potter's wheel, kiln and shelves of pots), `observatory` (part 9, **at night**: the star lounge C-30 with
    reclining chairs under the slots, a star sky with the Milky Way, the far side of the ring with its slots lit; the
    telescope room C-31 with screens and the portal up to the dome C-32), `garden` (part 10 at sunrise: the breakfast
    room C-33 on oak, the sky garden C-34 with herb and flower beds and lemon and olive trees). `furn.olive_tree(...,
    kind="lemon")` grows lemon trees. Plans: `c_studio`, `c_observatory` (drawn by day), `c_garden` in
    `plan_render.py`. Tour stops `crown_studio`, `crown_stars`, `crown_garden` wait hidden in `stops.js`.
  - **The Crown scenes drew the Orb at 20 m radius** (`crown.ORB_R`): now 24 m, as Rev E/F.
  - **A bug in every still so far:** `lib.photo_finish` set the vignette mask's size with `width`/`height`, which in
    Blender are the node's size in the editor, so the mask stayed a small default ellipse and the blur was 0.35% (its
    relative size is in percent): each still came out about 8% darker everywhere except a faint bright oval in the
    middle. Fixed (`mask_width`/`mask_height`, blur 30%); 360s and plans never had a vignette. The published stills
    can be rendered again when the queue is free.
  - **Previews without breaking the one-queue rule:** quick previews go into the queue like any job, followed by
    `python3 blend/hold.py N`, which renders nothing and holds the queue while `blend/hold.flag` exists (at most N
    seconds), so the long jobs behind wait until the previews are checked. Delete the flag to go on.
  - **`pgrep -f "blend/runner.py a"` matches its own shell** and says the runner is alive when it is not: check with
    `ps -eo args | grep "^python3 blend/runner.py a"`.
  - **Two more scenes:** the guest lounge (`pent_rooms.py guests`, L1-32: two storeys on the atrium glass, a gallery
    with the eight suite doors and lamps, sofas by the glass, a walnut table for twelve, a spiral stair up) and the
    kitchen (`suite.py kitchen()`, L1-10, beyond the master bedroom's end wall: counters and lit open shelves along the
    back wall, tall units, an island with stools for breakfast, a table for six, the robot that cooks on a ceiling
    rail). The kitchen renders in the suite's job (`s_kitchen`, `pano:kitchen`). Their tour stops (`guests`,
    `kitchen`) and design-plan entries wait for the pictures.
  - **Published tonight:** the Studio (photos `crown_studio`, `crown_craft`, the 360 and the plan from above), the
    star lounge (photo `crown_stars`). The queue, in order: the telescope room and the star lounge's 360, the
    Observatory's plan, the Garden room, the guest lounge, the Arrival hall, the sunset lounge, the master suite down
    with the kitchen, the atrium's 360s, the music and dining stills, the Crown bedroom's plan, then the turntable's
    other 48 frames. Publish each with `pub.py` (photos and 360s), the plan into `design/img/above/`, then
    `gen_plan.py`; the design plan's entries already name the files.
  - **Rooms with no scene yet:** the Orb's rooms, the L2 garden level, L3 (workshops, studio, science, the house
    mind), L4, L5, the guest suites, the memory rooms (L1-14), the robot bay and stores.
- **3 Oct, about 02:00 UTC, session `session_0138qEhb9MCkMbnmY4BcMa8s` (stopped here; Jim moved to a new cloud
  session):** that session could not reach PyPI (its network allowlist blocked pypi.org, files.pythonhosted.org and
  raw.githubusercontent.com), so it did the design-plan work and left the renders (step 4) to a session that can.
  **Done and pushed:**
  - `palace/plans/rooms.js` (new, written by `draw_plans.py`): every room of the room program as `window.PLANS`, with
    the Crown's parts, the levels, the Orb's floor areas and the geometry. `book.js` has `BOOK.rooms` (room shapes,
    code ranges, the plans' colours). **Chapters 02, 03 and 04 now take every room name and code from it**, so they
    can't drift from the room program again: re-run `python3 palace/tools/draw_plans.py` after editing
    `room_program.py` and the chapters follow.
  - Chapter 02 `crown.html`: the Orb at 48 m (new section drawing `fOrbIn` through the bridge, looking west: rooms
    between two lanes, the round space of glass +60 to +84, the foyer O-01 at +60, window slots per floor and the rest
    rooms' big windows; the floor table read from the plans, 870 / 1,070 / 870 = 2,800 m²; the dock numbers for the
    bigger ball: it comes down about 45 m and clears the ring by half a metre and the lens by 2.4 m), the main floor's
    rooms as Rev G with codes, the Crown 19,500 m² and 5.7 times the campus, no review box, no Rev history, no links
    to the 3D pages.
  - Chapter 03 `pentagon.html`: the level plan draws every Rev G room numbered as on the plans; the table lists each
    sector ring by ring with codes; the section's Orb is 48 m; no 3D-page links.
  - Chapter 04 `interiors.html`: the map of the Crown and L1, the room cards, the Orb's floors and the two master
    suites (up C-06 to C-08, down L1-06 to L1-09) all from the plans; no review label.
  - `site.html` (Orb Ø 48 m, 48–96 m up; dashed circle r 24), `atlas/atlas.js` (sphere r 24), `explorer.js` (48 to
    96 m; the Sun Well text now matches chapter 02).
  - The render tools find the repo wherever it is cloned (`pub.py`, `pub_house.py`, `overall.py`, `plan_maps.py`:
    `$MARS_REPO`, else `/home/user/mars-campus`, `/home/claude/mars-campus` or `~/mars-campus`).
  **Still to do from step 1** (next session): `palace/README.md` (numbers, the answered "One question for Jim",
  status rows), `REQUIREMENTS.md` (header, CR-3 19,500 m² 5.7×, OR-1 to OR-9 and GN-13 as approved with Rev G,
  section 10 "None"), `docs/design/02-crown.md`, `03-pentagon.md`, `04-interiors.md`, `docs/design/README.md`
  (Orb 48 m, 2,800 / 19,500 m², Rev G rooms, no "for review"), `docs/decisions.md` (delete the "For Jim's review"
  table at the top, now answered; keep the "decided with our best judgment" table under its own heading; add to the
  3 Oct entry that Rev E's Orb and the built ground stand, no changes asked), and §1, §2 and §2c below (numbers
  updated in §2c already). Then steps 2 and 3 as listed. Re-export the book drawings that changed with
  `python3 palace/tools/docs_export.py book` (crown-orb-inside, crown-plan, pentagon-plan, interiors-map,
  interiors-suites).

## 0. Where the work stopped (3 Oct 2026, about 00:45 UTC) — read this first

**Jim's latest answers and asks (3 Oct):**
- **Floor plans Rev G: approved** ("q1: approve"). They now live at `palace/plans/` (written by
  `palace/tools/draw_plans.py` from `palace/tools/room_program.py`; `palace/plans/rev-g/` only redirects there).
  Rev B is archived at `palace/archive/plans-rev-b/`.
- **The Orb (Rev F): "do per your best judgements"** → decided: **the Orb grows to 48 m across** (+48 to +96 m,
  centre +72; shell 2 m, so 22 m inside), **the Gate stays 18 m** in its round space 24 m across. On each floor
  (+64, +72, +80) five rooms sit between two lanes 2.4 m wide (outer lane along the windows, inner lane along the
  glass onto the Gate), with a passage under each spire; the bridge leaves the inner lane at +72. The rooms are
  Rev G's (portals, the five universe lounges, the rest rooms), not Rev F's bar/library/gallery (duplicates).
  Floor areas: +72 1,070 m², +64 and +80 870 m² each, **the Orb 2,800 m²** (was 2,410), **the Crown 19,500 m²**
  (was 19,100; 5.7 times the 3,400 m² TTMath campus). Done in the plans (`orb.html`, `svg/orb.svg`, codes O-OL,
  O-IL, O-PS for the lanes and passages) and in the house render scene (`overall.py`, sphere radius 24).
- *"after new design, archive or remove all old files to avoid messy confusions"* and *"on homepage remove FOR JIM
  Decisions ... For review ... remove all those notes/archived things. keep the page clean and clear"*. **Done so
  far:** the design plan's home page (`palace/design/index.html`) has no Decisions, For review or Revisions sections
  and no "Rev E" label; the plans pages have no review notes and no Changes page; Rev B plans archived.

**Next, in order (the new account starts here):**
1. **Done (3 Oct, session `session_01U4NrzcFVFwFYPq6dhgJtP1`):** the Orb at 48 m and Rev G in every page and doc;
   no review notes left on any page; the book's drawings re-exported.
2. **Done (3 Oct):** archive or remove the rest of the old files (Jim's ask): `palace/docs/plans.md` (Rev B) →
   `palace/docs/archive/`; the Rev B sheet images in `palace/docs/img/plans/` once `gen_plan.py` stops using them
   (step 3); the unlinked real-time 3D demo (`palace/index.html`, `palace-debug.html`, `src/`, `build.sh`,
   `crown/`, `orb/`, `pentagon/` and their shot tools in `palace/tools/`) → `palace/archive/3d-demo/`, with
   `palace/index.html` replaced by a redirect to `design/` (check the pages.yml key-file list, which names
   `palace/index.html`); `palace/design/mars.html` and `living.html` (redirects to `science/`) and
   `docs/design/00a-mars.md`, `00b-living.md`; images nothing links to. Run a link check after (no missing files).
3. **Done (3 Oct):** Rev G names and codes in the design plan: `palace/tools/gen_plan.py` (room pages and
   `explorer-rooms.json`): show each room's code, rename the Crown's piano room to the recital room (C-11), and use
   the Rev G drawings (`palace/plans/svg/l1.svg`, `crown.svg`) instead of the Rev B sheets.
4. **Renders, one at a time** (Jim's rule). The queue is in `palace/tools/render/queue_a.txt` (copy of the scratch
   queue). The session needs network access to **pypi.org, files.pythonhosted.org and raw.githubusercontent.com**
   (check: `curl -sI https://pypi.org/simple/bpy/` must not say 403). Set up a scratch folder outside the repo, once:
   ```sh
   S=<scratch folder>; mkdir -p $S/blend $S/final && cd $S
   python3.11 -m venv bvenv && ./bvenv/bin/pip install bpy==4.2.0 Pillow
   cp -r <repo>/palace/tools/render/* blend/
   python3 blend/fetch_assets.py && python3 blend/make_spines.py blend/assets
   export MARS_REPO=<repo>          # pub.py and pub_house.py write into the repo; they also look in the usual places
   setsid nohup python3 blend/runner.py a > /dev/null 2>&1 &     # ONE runner; it works down blend/queue_a.txt
   ```
   Watch `blend/log_a.txt`. Each job skips pictures already made, so after a restart just start the runner again.
   The first job re-renders the Crown pool (wellness: still, 360, plan from above) with the pool steps the right way
   up. Publish each finished picture at once (`python3 blend/pub.py pano final/crown/pano_wellness.jpg crown_wellness`
   for a 360; stills and plans as in `gen_plan.py`'s room data), run `python3 palace/tools/gen_plan.py`, commit and
   `git pull --rebase` before every push (another session may be editing the design plan at the same time). The second job
   is a quick test of the new house scene (`overall.py`, now built from the room program, with the 48 m Orb and
   L2 as Rev G: orchard, farm, lake in sector 3, forest, meadow): look at `final/house_test/*.jpg`, then queue
   `overall.py hero,whole,turn0of72,...,turn71of72,spots72` and publish with `pub_house.py` after changing it
   (and `explorer.js`'s drag step) from 24 to 72 frames. Then the rest of the queue, publishing each with `pub.py`
   and `gen_plan.py`.

### Earlier on 2 Oct

The site is **Mars – your new home** (Jim's name since 3 Oct; it was *Mars – No Way Home* from 2 Oct). Demo 2 is **the design plan** (`palace/design/`); the real-time 3D
pages are unlinked. The render scenes and tools are in `palace/tools/render/` (copied from the scratch folder).

**Jim's asks today, newest last (all done or in hand):**
1. *"I need you really put focus on the overall construction image (real and 3d)"*. **Done and live** (hero, 24 frames, the uncut view behind *Without the cut*): the
   whole house path-traced as a section perspective (`palace/tools/render/overall.py`): everything under the plain
   on the near side of a vertical plane through the middle is taken away, and the plane turns with the camera. The
   ground follows chapter 01's section (dust 1 m, ice-rich soil to 14 m, thick ice to 60 m, old lava and sediments).
   The design plan opens on it: `palace/design/explorer.js` turns 24 frames (`img/house/f00–f23.jpg`), places the
   labels from `img/house/spots.json`, and opens a panel per part; the Crown and L1 open their floor plans with
   clickable rooms, and each room opens with its pictures, 360s and facts (data: `explorer-rooms.json`, written by
   `gen_plan.py`). The homepage's demo 2 card shows `img/house-hero.jpg`. Publish renders with `pub_house.py`
   (scratch folder): it copies the hero, the frames done so far and the spots (its `have` list tells the explorer
   which frames exist, so it can go live with one frame).
2. *"the L1 floor plan doesn't show full"*. **Done:** every room plan is the whole sheet, the room shaded; click enlarges.
3. *"if I have wormhole to do the transportation, then the pod / rockets will be the tool for travel and see the
   views"*. **Done:** chapters 06 and 07, TR-7, the decision log.
4. *"another subpage to introduce Mars with facts of geography ... separate topics on the engineering ... based on
   science"*. **Done:** `design/mars.html` (00·1 Mars, the planet) and `design/living.html` (00·2 Living on Mars),
   with sources; summaries `docs/design/00a-mars.md` and `00b-living.md`. The Earth–Mars picture is
   `palace/tools/render/planets.py`. The NASA fact-sheet site is blocked from the container: numbers come from the
   published values cited on each page.
5. *"those Mars science should be put on directly on the homepage ... in parrellel with 2 demos ... consider
   weather/etc... all factors"*. **Done:** the homepage (`index.html`) has three sections: *Demos* (the two cards),
   *Mars facts* (numbers, the Viking weather station, weather, the planet, hazards) and *Building on Mars* (a table
   of 17 factors with the answer to each, then twelve topics), with sources in a fold at the end. Each tile links to
   its section in `design/mars.html` (new `#weather`, `#hazards`) or `design/living.html` (new `#conditions`,
   `#health`, `#protect`). *Replaced the same evening by 6.*
6. *"I would like to separate things into different pages/files … mars facts … a separate page for those, and
   probably divide that subpage into nested subpages as well, like surface/core/weather/space/resources/etc. please
   keep this as global rule"*. **Done:** the science is its own folder, `science/`, one subject a page (see
   [science/README.md](science/README.md)): `mars-facts/` (hub + surface, inside, weather, space, resources, hazards,
   numbers, exploration) and `building-on-mars/` (hub + factors, getting-there, construction, water, air, food,
   energy, shielding, health, fuel, communication, protection), styled by `science/science.css`, with menus and page
   turns from `science/science.js`. The homepage has a short *The science* section with two cards; its styles are in
   `site.css`. `palace/design/mars.html` and `living.html` redirect to the new pages, section by section. **The rule
   is global** (see `CLAUDE.md`): separate pages and files, big topics split into nested subpages, hubs short.
7. *"build other images or 3d images for other rooms one after another. don't run in parallel"*. **Done:** one render
   queue only (below); lane B was stopped and its jobs moved into lane A's list.
8. *"the bath pool, the stairs are upside down I think?"*. **Fixed** in both pool scenes (solid steps standing on
   the floor, the top one shortest); the thermal baths' 360 is republished.
9. *"your photo images don't follow the floor plan? ... I like you to design it and plan it well before draw the
   images"*, *"it is OK to have duplicates but just need to design well as long as they could be used for multiple
   purpose"*, *"each room / area give it some code"* (he suggested L1-01). **Done, waiting for his approval:**
   **floor plans Rev G**, <https://ttmathcs.github.io/mars-campus/palace/plans/>. 179 rooms and areas, each
   with a code, a purpose, a second use, a place and a size; the pairs and why; what changed from Rev B. Source of
   truth: `palace/tools/room_program.py` (one entry per room); `palace/tools/draw_plans.py` draws the SVGs and writes
   the pages (`palace/plans/`, one per sheet, per Crown part and per L1 sector, with `plans.css`) and the short
   docs (`palace/docs/plans/`). A room's "◉ 360°" or "◉ picture" mark appears only when the tour has it.
   Named **Rev G** because the letters run through the whole design (C–E the design book, F the Orb's question).
   **Rule (CLAUDE.md): no picture of a room before it is in the room program.**
10. *"drag to turn the house. the turnning is not smooth at all"*. **Better:** `explorer.js` draws the frames on a
   canvas, blends between neighbours as you drag and glides to rest. Smooth for real needs 72 frames instead of 24
   (queue them after Rev G is approved).

**Renders: how to carry on after a restart.** From the scratch folder (with `bvenv` = Python 3.11 + `bpy==4.2.0` +
Pillow, and the assets): **one job list, `blend/queue_a.txt`, run by one runner** (`setsid nohup python3
blend/runner.py a &`), one job after another, never in parallel (Jim's rule). Every job skips the pictures it has
already made, and 360s keep their finished bands, so a restart loses only the picture in progress. Put new jobs in
`queue_a.txt` (the Pentagon's rooms, the Crown's rooms and the whole house alike); `queue_b.txt` and `queue_c.txt`
stay empty. Publish a finished room 360 or still with `pub.py`, then `python3 palace/tools/gen_plan.py`, commit and
push. 360s rendered before 2 Oct 21:00 had a black last column; `fix_seam.py` fills it (all published ones are done)
and `lib.render_pano` now does it itself.

**Next:** wait for Jim's answer on Rev G. **The render queue is paused** (every job after the thermal baths is
commented out in `queue_a.txt`, "# paused"). When he approves: rename what Rev G renamed in `gen_plan.py` and the
explorer (the piano room is the recital room, C-11; the codes on every room page), re-check each queued job against
the room program, un-comment them and restart the runner; then the 72 turntable frames; then the rooms not drawn
yet, one at a time. If he asks for changes, edit `room_program.py` and re-run `python3 palace/tools/draw_plans.py`.
The Orb's Rev F question to Jim is still open.

## 1. Status

| Part | Where | State |
| --- | --- | --- |
| Hub page | `index.html`, `site.css` | Live, titled **Mars – your new home** (Jim, 3 Oct 2026): *A city rising on Mars*, one card per place, never the word "demo", no notes for visitors; the Arcadia card opens the design plan. The Mars Atlas is a picture at the top right. Below the demos, *The science*: one card for Mars facts and one for Building on Mars, each listing its pages. |
| The science | `science/` | Live since 2 Oct 2026. Real, with sources, one subject a page: Mars facts (8 pages) and Building on Mars (12 pages). See [science/README.md](science/README.md). |
| Demo 1, TTMath on Mars | `ttmath/` | v0.50 live: one sealed campus round the Math Palace. The Ring (CP-31, like Apple Park but sealed and set into the slope so it stays hidden from the start) runs all the way round the dome, 46 to 62 m out: two storeys behind and beside it with the garden gallery, a sloping roof on the right front, the Gate Hall at the front (reception, a grand stair and lift, two big screens that turn their pages in large type: the 2026 Fall timetable day by day with its rooms, and the Sept–Dec contests as cards, CP-36, v0.21), and on the left front the lower floor only, under skylights, beside the sunken grove; the wings' rooms moved into it and the wings, links, gateway and open courtyard are gone. The garden ring under one glass vault between the Ring and the dome; the entrance under a glass dome on a 3 m glass drum, the airlock coming in through a framed doorway (v0.15), with interlocked doors (CP-32); every room furnished with its own plants and generous chairs; the flying pod on its anti-gravity halo (v0.12), docked off the Ring's right side: from the pod lounge a glass bridge over the garden gallery and a docking collar take you into it, and it docks again when you land near (v0.19, CP-34). Blocks: `blk_ring.js`, `blk_gardenring.js`, `blk_entrance.js`, `blk_ringfurnish.js`, `blk_board.js`, `blk_signs.js`, `blk_prints.js`, `blk_notices.js`, `blk_poddock.js` (order and how to build in `ttmath/docs/phase2-build.md`). Every room has a number (2xx upstairs, 1xx downstairs, CP-35; `ttmath/tools/campus_rooms.py`, the timetable in `campus_timetable.py`, both on `ttmath/plan/`), on a plate beside its doors, and the Gate Hall has the rooms' directory (v0.14); blade signs across the corridors list the numbers ahead, exit signs hang over the stairs, and the lower corridor is a walk of framed prints of mathematics, each facing its room, with benches and plants (v0.17, `blk_signs.js`, `blk_prints.js`); the Ring's hall has oak slat walls and long benches, cork notice boards carry the contests and the clubs, and bottle fillers stand by the washrooms (v0.18, `blk_notices.js`). The furniture is made like real furniture, rounded and stuffed, in a quiet palette, each piece in its own soft shadow, the lamps lighting the rooms round them, books on every bookcase, the reading room, the teachers' room, the games room (with a giant chess set), the café, the pod lounge and the lower hall furnished in groups (v0.20 to v0.22, CP-38, `blk_soft.js`; the program, piece by piece and room by room, in `ttmath/tools/campus_furnishing.py`). In every classroom a clock over the board keeps the visitor's time and a pinboard on the back wall carries the room's week, a problem of the week, a pupil's diagram, the next contest and a marked quiz (v0.23, `blk_classdetail.js`). The clinic (an examination bay behind a curtain, the nurse's desk, a counsellor's lounge), the art studio (paintings in progress on the easels, a wall of finished work) and the music room (a grand piano before an oak slat wall, ensemble chairs in arcs facing it, practice booths, instruments on the walls) are furnished for their use (v0.24, `blk_artcare.js`); Newton, the physics lab, has island benches, padded lab stools, apparatus and a Foucault pendulum that swings at Mars's period (v0.25, `blk_labs.js`); the maker space a tool wall, workbenches with power drops, printers and a robot arena with the students' rovers (v0.26). Jim, 7 Oct 2026: "publish update more frequently, not wait until the batch finishes" — push each room as soon as its shots check out. Loading (Jim: "the ttmath loading slow"): the quick bake uses a light grid (`lightGrid` in `blk_bake.js`), `Builder.add` transforms inline, `meanRGBs` reads one canvas back, the leaf texture paints on the CPU (v0.27; profile with a CPU profile of the load, as in the v0.27 notes); the weathers are only shader numbers and cost nothing to load. The terrain loads from `data/terrain_v2.bin.gz` (packed by `ttmath/tools/terrain_pack.py`, a third less to download; rerun it if the base64 chunks ever change), the old chunks being the fallback (v0.28). Socrates is a boardroom for twenty (v0.29); the dining hall has its servery, long tables under drum lamps and a banquette (v0.30); the library its stacks, ladders, desk and reading corner (v0.31). Nothing stands in a doorway (v0.32: furniture on a corridor wall calls `nearDoor`; check new rooms with the door audit in the v0.32 notes). The competition room is furnished (v0.34), with the fixes from Jim's walk round of 7 Oct: plants clear of walls and doors everywhere, the stair bays rebuilt, the Gate Hall's stair climbable, screens flat on walls. The washrooms are one room for everyone, modern and luxurious (v0.35), and the kitchen is a working kitchen (v0.36): Jim's list of 7 Oct is done. The homepage's TTMath card shows the campus from the air at sunset (Jim 8 Oct: "replace ttmath on mars image with campus eagle view best image"; `ttmath/preview.jpg`, also the page's og:image, remade by `tools/eagle_shot.py`). Jim 8 Oct: **pod ports** ("we need several pod lounge around the building, esp. several parking lots and connections at the entrance"): the four pod gates round the entrance dome are built (v0.37, CP-39); next, more pod lounges round the Ring (the pod lounge's dock stays; how is Jim's choice: the upper floor's outer side is all rooms); the potted plants are at real proportions (v0.38); each classroom's mathematician is on a poster (v0.39), roller blinds hang on the outer glass (v0.40), the gallery's and the grove's plants stay inside their walls and glass (v0.41), the trees are real: the red maple and the olive redrawn, leaves at leaf size on the big trees, the bed kentias grown up, foliage that stays leafy from afar (v0.42), the maker space's laser cutter made like the real machine (v0.43), the corridors with cases of the students' models and the safety fittings real corridors have (v0.44, `blk_cases.js`), the garden ring planted in beds like a tropical house (v0.45), leather gallery benches facing the garden along the upper corridor's glass (v0.46), the Gate Hall a real lobby with a lounge facing its screens and the Borromean rings in steel (v0.47), the pod lounge furnished for waiting with banquettes and two prints of the mathematics of travel (v0.48), loads on old PCs: up in 32 s instead of 40 s at an old laptop's speed, under half the memory, no crash on a small PC, the pictures the same (v0.49), the entrance dome's ribs land on an edge beam at the Gate Hall's front, the big meshes' quick light worked out in the bake worker (v0.50); then details everywhere (CP-30). Run `ttmath/tools/walk_check.py` before every push, and `ttmath/tools/hidden.py` when heights change. See `ttmath/REQUIREMENTS.md` and `ttmath/docs/`. |
| Demo 2 home | `palace/README.md` | **Start here for demo 2, Arcadia.** Links the requirements, the decision log, the design chapter by chapter, the floor plans and every picture, all viewable on GitHub. |
| Demo 2, requirements | `palace/REQUIREMENTS.md` | By area (GN, ST, CR, OR, PG, LV, TR, SY, DM), with status and links; updated 3 Oct 2026 (GN-1 the name Arcadia, GN-17 the homepage, GN-18 no notes for visitors). **No open questions.** |
| Demo 2, design plan | `palace/design/` | Live at https://ttmathcs.github.io/mars-campus/palace/design/, titled *Arcadia · Design Plan*: the house explorer (24 frames), the area pages room by room (`gen_plan.py`), all ten chapters with the Orb at 48 m and every room as Rev G. |
| Demo 2, floor plans | `palace/plans/` | **Rev G, approved by Jim on 3 Oct 2026** ("approve"): 179 rooms and areas with codes, written by `palace/tools/draw_plans.py` from `room_program.py`; the Orb at 48 m. Rev B is archived at `palace/archive/plans-rev-b/`. |
| Demo 2, real-time 3D | `palace/archive/3d-demo/` | Hidden on 2 Oct 2026 (Jim: "far from satisfying") and archived on 3 Oct, with its tools and notes ([README](palace/archive/3d-demo/README.md)); `palace/index.html` now opens the design plan. |
| Demo 2, photo tour | `palace/tour/` | Live since 1 Oct 2026: path-traced 360s and stills (Blender Cycles), the standard for every picture (Jim: "so great and almost perfect. i need all rooms to be like this"). Published: L1's family room, music room, dining room, library, baths and cinema; the Crown's salon, bedroom up, library, map room and pool. Rendering, one at a time: the rest (step 4). |
| Demo 2, first palace | `palace/archive/old-palace/` | Archived (Jim rejected it: "far from satisfactory"). Its requirements are in `palace/docs/archive/old-palace.md`. |

## 2. Demo 2: where the design stands

The full record is in `palace/docs/decisions.md` (every question, Jim's words, what changed). In short:

- **Above ground: the Crown.** A white ring 276 m across floats on anti-gravity 40 m over the Stone Garden, with five
  spires to 90 m and no big windows. At its centre floats the **Orb**, a mirror ball 48 m across (+48 to +96 m).
- **The Orb (Rev E, 1 Oct 2026, stands; 48 m since 3 Oct).** The universe is **future-tech VR**: switched on, it appears in 3D
  directly in the space of the room, all round, with no projector, no screen and no ball (Jim: "not projector",
  "not inside a ball", "projected directly in the 3d space"). Jim zooms it like a 3D dashboard, from the whole universe
  down to Mars and the house; Earth and Mars float in the corner of his view with live weather, and can be hidden.
  The ball in the middle, 18 m across, is the **Wormhole Gate**: choose a place and a time in the universe, walk
  across a short bridge into the ball (things ride in on a cart or with a robot), press send, and it shoots you like a
  beam of light to that place and time, instantly ("this is how wormhole works"). The far end is a ball too, for the
  way back. Three floors round it, each with five rooms between an outer lane (windows) and an inner lane (the glass
  onto the Gate): +64 portal rooms, +72 universe lounges and the bridge, +80 five rest rooms behind radiation glass.
- **The ground (Rev E, 1 Oct 2026, stands): built, not raw** (Jim: "the ground is raw and need some
  construction/design as well. and at least some hints that there is big part underground", GN-13). A **paved
  pentagon** 4 m wider than the Pentagon shows where the house lies; the **Stone Garden** (raked gravel 204 m across since Rev H,
  seven basalt stones) is the circle inside it; five strips of glass trace the avenues; a glass **corner pavilion**
  holds each corner stair; basalt pads lie under the spires. At the centre the **Orb's dock** (Jim: "some interface
  when orb can land on the ground", OR-9) rings the **Sun Well**, the sky lens over the Pentagon's atrium. Still
  **nothing spread over the ground**: no mirrors and no solar panels (GN-12).
- **Below ground: the Pentagon.** One solid pentagon, 160 m sides, five levels 24 to 68 m down under 16 m of soil,
  seven times the Crown's floor area (Rev H). Jim's days are here, and everyone sleeps here (the master suite down on L1).
- **Arcadia Spaceport**, 30 km due east on landing zone AP-1: three pads, terminal, pod station, fuel plant, ice mine.
- **Power:** from the city's grid (Jim, 6 Oct 2026: "no nuclear reactor is needed since it is provided by city"), on two
  buried ±20 kV DC cables by different routes, 15 MW each; batteries 20 MWh at Arcadia (L4-03) and at the port; fuel
  cells on stored methalox (L4-20); heat pumps for warmth (L4-02). No reactor, no solar field.
- **Travel is by the Wormhole Gate** (Jim, 2 Oct 2026); the pod and the rockets are for seeing the views. **The pod's scenic
  flight:** about 37 km and 4 min 40 s, through a dust storm into the blue sunset.
- **The city** grows from the house on a sunflower spiral (golden angle), with civic buildings on the Fibonacci seeds.

Decided on 1 Oct 2026 (Jim answered, or asked for our best judgment): site on **AP-1** at 39.80° N; air at
**70 kPa with 27% oxygen**; **sleep below ground**, with rest rooms in the Orb; **Jim moves in 2027** (launch window
Nov–Dec 2026); the Gate's demo default opens on the **TTMath campus** in Gale crater; the guest rooms stay; all four
demo extras stay as nice-to-haves; **visitors are rare**.

How Jim got here: rounds 1–2 built the first palace (archived) → Rev A floor plans → Rev B, the floating Crown,
approved 30 Sep → Rev C, the design book, because Jim wants every plan designed before more 3D work (30 Sep) →
Rev D, the Universe Hall, his decisions and the clean ground (1 Oct) → Rev E, the universe in VR and the ball as
the Wormhole Gate (1 Oct). The revisions are listed on the book's cover.

**Pictures, not real-time 3D:** every room is shown as path-traced stills and 360s, one render at a time, following
the floor plans (Jim, 2 Oct 2026); the real-time 3D pages are hidden.

## 2b. Next steps, in order

1. **The pictures, one render at a time** (step 4 of section 0): the queue, then every room not drawn yet, each
   checked against the room program first.
2. **Done (3 Oct):** chapter 08 Life support, `life.html` and `docs/design/08-life.md`: the air (70 kPa, 27%, 2,100 t,
   the buffer gases from the Mars air), the water loop (98%), the farm and the storm reserve, warmth (a worked 2 MW), Jim's
   dose budget (about 19 mSv a year), dust, fire at 27%, health; every system by its room code on L4, L2 and L3.
3. **Done (3 Oct):** chapter 09 Communications and space, `space.html` and `docs/design/09-space.md`: the delay, the
   relays and Relay 4 at Sun–Earth L4, the lasers, living with the delay, Phobos, Deimos and Earth in the sky, Mars
   time and Mars Year 39.
4. **Done (3 Oct):** chapter 10 Building it, `phases.html` and `docs/design/10-phases.md`: the order of work from the
   first landing in 2023 to Jim's in June 2027, the robots, the three waves of ships, the city's phases with dates.
5. For each new chapter: add it to `READY` in `book.js`, write its page in `palace/docs/design/` (copy the pattern of
   01–07), add its figures to `BOOK` in `docs_export.py` and export, add its requirements' links in
   `REQUIREMENTS.md`, check it with `book_shot.py` (desktop, phone and dark), commit, push and tell Jim what it is
   before he opens it.
6. The real-time 3D pages stay hidden (Jim, 2 Oct 2026: "far from satisfying") and go to the archive (step 2).

## 2c. Numbers used across the design book

Keep new pages consistent with these (sources and working are in the chapters):
- Site: the Crown at 39.80° N 201.44° E, Arcadia Spaceport on AP-1 at 39.80° N 202.10° E, 30 km apart; ground −3.9 km,
  air 870 Pa (40% above the Mars average); ice within 1 m and tens of metres thick; AP-9 thick ice 58 km east of the
  port. House to Olympus Mons 1,780 km, to Gale crater (TTMath campus) 4,360 km, to Jezero 6,030 km.
- The Crown (Rev H, 4 Oct 2026): ring 224–276 m across (radius 112–138; inside 115–135), underside +40, main floor
  +41, roof 56 + 34·c⁶ (spires +90, dips +56), where c = (1 + cos 5φ) / 2; rooms 12.5 m tall, 20 m in the halls under
  the spires (ceiling min(roof − 2.5, +61)); the spires' upper floors at +62 m; walls and roof 3 m (0.1 skin, 0.3
  sintered shell, 2.2 ice, 0.2 aerogel, 0.2 liner); about 120,000 t of wall ice; mass about 210,000 t, 156 MN per
  drive. Floor area **28,700 m²** gross (main floor 17,850 + the Glide 3.5 m × 734 m, 2,570 + spire upper floors
  5 × 1,090 + the Orb 2,800), 8.4 times the TTMath campus. Room sizes on the floor plans are net, inside the walls
  (rooms between radii 118.5 and 135 m). Power, water and air reach it through the portals in the spires; on its
  pads it plugs into the Pentagon's.
- The Orb: Ø 48 m, +48 to +96, shell 2 m (22 m inside); a round space of glass Ø 24 m from +60 to +84 with the
  Wormhole Gate in it, a ball Ø 18 m; floors at +64, +72 and +80, each with five rooms between an outer lane (along
  the windows) and an inner lane (along the glass), lanes 2.4 m, a passage under each spire; areas to the inside of
  the shell 870, 1,070 and 870 m² (2,800); the foyer O-01 at +60 under the Gate; the bridge O-12, 3 m wide, from the
  +72 inner lane into the Gate; five rest rooms at +80 under windows of radiation glass.
- The Stone Garden: Ø 224 m (gravel to r 112 m), raked gravel and seven basalt stones of 2 to 4 m; no mirrors, no
  panels. The Sun Well lens Ø 20.4 m, a sky lens with lamps; it closes under an iris in a storm.
- The built ground: paved pentagon with inradius 114.1 m and circumradius 141.0 m (166 m sides), corners at bearings
  18 + 72k like the Pentagon's, slabs 3 × 1.5 m, a basalt kerb 1.6 m wide with a light line 0.8 m in; the Orb's dock
  a basalt lathe ring r 12–15.4 m, 5.5 m high, bronze band at 5.5–5.64, five bronze pads at r 13.5 m with tops at
  6.9 m (a seated Orb clears the ring by 0.23 m); spire pads r 7 m at r 130 m with bronze rims; glass strips 0.72 m
  wide in paved bands 2.6 m wide from r 15 to 111 m along bearings 18 + 72k; corner pavilions at r 116 m (plinth
  9.6 × 12 m, glass 6.2 × 8.2 × 2.9 m, roof 8.6 × 11 m at 3.3 m, door facing the garden).
- The Pentagon: 160 m sides, circumradius 136.1 m, atrium 35 m sides, rings A–E 14 m deep with 4 m streets, 5 m
  avenues, levels L1 −24 (top −16), L2 −41 (16 m tall), L3 −50, L4 −59, L5 −68; 41,940 m² a level, 209,700 m² in all
  (7 times the Crown since Rev H); 16 m of soil; the dig 3.1 million m³ and 1.5 million t of ice.
- Air inside: 70 kPa with 27% oxygen.
- Power, phase 1 (from 6 Oct 2026): demand 8.6 MW average for Arcadia, the port and the fuel plant; the city's grid
  on two DC cables at ±20 kV, 15 MW each, about 1.5% loss (one 30 km beside the rover road from the port, one through
  the city's first tunnel, L5-16), into the city feed (L4-01); batteries 20 MWh at Arcadia (L4-03) and 20 MWh at the
  port; fuel cells 8 MW on stored methalox (L4-20 and the port; 1,000 t lasts about 9 days); heat pumps (L4-02) give
  about 2 MW of warmth for 0.7 MW. No reactor, no radiators, no solar field.
- Transport: the pod is 9.2 × 4.5 m, 4 seats, about 6 t, 22 kN on Mars, top speed 680 km/h, about 1.5 t of methalox
  for the scenic flight (37 km, 4 min 40 s), about 1 t for a direct hop; the bus 12 seats at 40 km/h, 45 min; the
  maglev (phase 2) 30 km at 400 km/h in a 7 m tunnel at −68 m, about 6 min; Hohmann transfer 259 days, windows every
  26 months; Jim launches Nov–Dec 2026 and lands mid-2027.
- The spaceport: three pads Ø 80 m with berms (radius 114–147 m, 6 m high) at bearings 60, 90 and 120, 1.6 km from
  the terminal (Ø 180 m); tower 77 m; pod station 70 × 120 m with four pod pads (no reactors since 6 Oct); one ship's propellant 1,200 t (260 t CH₄, 940 t O₂, plus 100 t spare O₂) from 585 t of water and 715 t of
  CO₂, about 8.6 GWh, about 5 months at 2.4 MW; tank farm six spheres Ø 36 m; ice mine 320 × 200 m, 9 m deep, 1 km
  north.

## 3. How to work on each part

**Publishing.** Every push to `main` deploys the site through `.github/workflows/pages.yml`. The workflow first checks
that key files exist (among them `palace/index.html` and `palace/REQUIREMENTS.md`). It takes about a minute.
**Work on `main` directly** (Jim, 1 Oct 2026: "only main is needed"): commit and push to `main`, no separate branches.
Check everything before pushing, because every push goes live.

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

**Demo 2 docs** (`palace/README.md`, `palace/REQUIREMENTS.md`, `palace/docs/`): Markdown that Jim reads on GitHub.
- Every page has the same nav line at the top: Demo 2 home · Requirements · Decisions · Design · Floor plans · Pictures.
- `docs/design/0N-*.md` is a summary of each design book chapter with its drawings; the live chapter is linked at
  the top. Keep the two in step when a chapter changes.
- The drawings in `docs/img/` are exported from the live pages: `python3 palace/tools/docs_export.py [book|plans|atlas|all]`.
  It writes `docs/img/book/<chapter>-<name>.png` (the figure list is `BOOK` at the top of the script),
  `docs/img/plans/<sheet>.png` and `docs/img/atlas/<view>.jpg`. Re-exports of unchanged drawings can differ by a
  pixel of layout; restore those with `git checkout` so commits only carry real changes.
- Pictures (renders) live in `palace/design/img/` and are listed in `palace/design/img/README.md` and
  `docs/gallery.md`.
- When Jim answers or asks for something new: add it to `REQUIREMENTS.md` first, log his words in `docs/decisions.md`,
  then change the design.

**Demo 2, the real-time 3D demo** (archived on 3 Oct 2026, `palace/archive/3d-demo/`): how it is built and tested is in
[its README](palace/archive/3d-demo/README.md). Jim hid it on 2 Oct; Arcadia is shown with path-traced pictures.

**Demo 2, the photo tour** (`palace/tour/`): read `palace/tour/README.md` first. The viewer `index.html` (three.js r128,
no build step) puts each 360° JPEG from `pano/` on the inside of a sphere; `stops.js` lists the stops (where each was
taken in the family room's frame, where you look first, the rings it shows; a ring can sit at a portal). The pictures
are rendered by Blender 4.2 (the `bpy` wheel from PyPI, Python 3.11) from the scripts in `palace/tools/render/`:
`lib.py` (materials, modelling, lights, cameras), `furn.py` (the piano, bookcases and books, lamps, rugs, paintings,
olive trees), `atrium.py` (the atrium on every level, the column, the sun court, the roof and sky lens), `family.py`
(Jim's rooms and their lighting; `CAMS` are the stills), `pano.py` (`STOPS` are the 360s, with their exposure) and
`final.py` (renders a list of both). Fetch the models and textures with `fetch_assets.py` first. Look at a quick
preview (1024 px, 12 samples, about a minute) before a final (4096 px, 32 samples, about 25 minutes on 4 cores), and
look at every final critically before it goes up.

**Demo 2, first palace**: the built page is `palace/archive/old-palace/index.html`; its source is in git history
(before commit 0f7a717, `palace/src_old/`; build script at commit c2e231b).

**Design book** (`palace/design/`): static pages, no build step.
- `book.css` and `book.js` are shared by every page. `book.js` adds the top bar, the chapter menu, the page turn and
  the footer, and has SVG helpers (`BOOK.S`, `BOOK.T`, `BOOK.path`, `BOOK.scalebar`, `BOOK.north` ...). Each page sets
  `<body data-ch="site">` and draws its own figures in a script at the end. Chapters are listed in `BOOK.CH`; the ones
  in `READY` are live.
- Map figures use real NASA imagery: `BOOK.marsImagery()` lays Esri OnMars tiles (Viking MDIM 2.1 colour mosaic,
  `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer/tile/{z}/{y}/{x}`, 512 px, geographic) over
  `img/mars-map.jpg`, a real colour map of Mars (Solar System Scope, CC BY 4.0) made by
  `python3 palace/tools/fetch_marsmap.py`. Credit both in captions and the footer.
- Thumbnails `img/th-*` are cropped from the renders or drawn as SVG.
- Two pictures come from their own small three.js scenes in `palace/tools/`, rendered by
  `python3 palace/tools/scene_render.py orb|mars ['{"key": value}'] [out.jpg]` (a few seconds each):
  `orb_scene.html` → `img/orb-universe.jpg`, inside the Orb with the universe switched on (HDR bloom and ACES as in the
  demo, a planar reflection in the floor, a particle galaxy over a spiral body shader, the Gate's lensed far sky);
  `mars_scene.html` → `img/atlas-teaser.jpg`, Mars from orbit on the real colour map, for the Atlas card. The book's
  views are the defaults (`VIEW` in each scene). Jim rejected people drawn as mannequins: leave figures out of renders.
- Labels stay readable in both themes: `legible()` in `book.js` finds the shapes under each SVG label after the
  drawings are made and, where a label would be hard to read (dark mode puts light ink on the fixed light material
  colours), switches it to the dark or light ink of its kind. Draw in the light theme and let it handle dark.
- Check pages with `python3 palace/tools/book_shot.py site,crown light [phone]`: section screenshots in
  `palace/tools/out/`, script errors, missing files and page overflow. Tiles are faked from the base map with yellow
  outlines so their placement can be checked (`TILES=none` makes them fail instead).
- **The Mars Atlas** (`atlas/index.html` + `atlas/atlas.js`): three.js r128, camera-relative rendering in km, a
  quadtree of OnMars tiles (MDIM and the colour elevation map) over the real base map, the planets and moons, and
  Jim's site placed in the demo's frame (metres, x east, z south, the Crown at the origin). `atlas/site-terrain.jpg`
  is the demo's own 40 × 12 km landscape seen from above, baked by `python3 palace/archive/3d-demo/tools/bake_site.py` (from the archived phase 1 landscape) (about 17 min,
  run in the background). Test with `python3 palace/tools/atlas_shot.py '[["name", "js", waitMs]]' 1280x720 fake|none`;
  `window.__atlas` has `jump(k)`, `select(id)`, `flyTo({...})` and `CAM`. Links can open a view:
  `atlas/#place=house` or `atlas/#@lat,lon,distkm,...`.

**Demo 2 plans Rev G** (the rooms, approved by Jim on 3 Oct 2026): edit the room in `palace/tools/room_program.py`, then run
`python3 palace/tools/draw_plans.py`; it rewrites `palace/plans/` (pages, `svg/`, `rooms.json`) and
`palace/docs/plans/`. Don't edit the generated pages by hand. Codes: `L1-01` (level, room, numbered sector by
sector from the atrium out), `C-01` to `C-34` (Crown, clockwise from Arrival), `O-00` to `O-17` (Orb), `G-01` to
`G-08` (ground), letters for shared areas (`L1-AT`, `CC1`, `C-GL`).

**Demo 2 plans Rev B** (archived): one self-contained page at `palace/archive/plans-rev-b/index.html`, kept as
approved; `plans_snap.py` beside it shoots its sheets, and `docs_export.py plans` exports them for the archived docs.

The areas on the page are computed from these constants, so keep the numbers in the text in step with them. Rev B is
approved, so change it only for what Jim asks, and say so on the page (`.newer` at the top, `.since` under a sheet),
as B.1 did for the clean ground. `STONES` holds the Stone Garden's seven stones, the same list as in the design book
and `src/60_crown.js`. Check with `python3 palace/tools/plans_snap.py light` (or `all`). It writes one PNG per sheet to
`palace/tools/out/`.

**Test environment notes.**
- WebGL runs in SwiftShader. Load waits allow up to 400 s, and demo 1 bakes its light in about 6 s.
- Python Playwright must match the installed Chromium: in the cloud sandbox `pip install playwright==1.56.0` works
  with `/opt/pw-browsers/chromium-1194`. Don't run `playwright install`.
- three.js r128: if the cdnjs CDN is blocked, get it from npm (`npm pack three@0.128.0`, then copy
  `package/build/three.min.js`) into `palace/tools/` or `ttmath/tools/`; both paths are git-ignored.
- The NASA tiles (`astro.arcgis.com`) and the live site (github.io) can't be reached from the sandbox, so check
  deployed pages in a browser, or ask Jim to open them. Google Fonts and raw.githubusercontent.com can be reached.

## 4. Working with Jim

- Show plans before building details, and wait for his approval.
- It must look real: real materials, never cartoon. Every picture is judged on that; replace or drop one that isn't.
  On 1 Oct 2026 he rejected the real-time 3D pages as cartoon; path-traced renders (the photo tour) are the standard.
- Keep the ground clean: no fields of panels or mirrors ("so ugly", "very messy").
- Docs must be easy to navigate: several short files, tables and bullets, pictures visible on GitHub.
- Don't leave answered questions on any page. Record his answer in the decision log and move on.
- Everything goes to this GitHub repo and the live site. Don't deliver as a chat-app artifact.
- Keep all progress committed so another account or AI can continue.
- Before anything opens on his screen, say what it is and how to use it.
- He views the demos on his laptop. Share links; don't drive a browser on his machine.
- He prefers short, direct answers.
- "Try again" from him has meant "the session stopped; carry on" as well as "redo it": check whether work stalled.
- **Separate pages and files, always** (2 Oct 2026, "please keep this as global rule"): each topic its own page,
  big topics split into nested subpages, hub pages short (an intro and links), shared styles and scripts in their
  own files. He has complained that everything ends up on one page "over and over and over".
- **Renders one at a time** (2 Oct 2026): one queue, never parallel lanes, so a restart loses as little as possible.
- **Demo 2 is the design plan** (2 Oct 2026): the homepage card opens `palace/design/`, *Arcadia · Design Plan*. The real-time 3D pages (the flight, the Crown, the Orb, the Pentagon) are hidden from the homepage
  ("far from satisfying"); keep them unlinked until he says otherwise. Every area and room gets its purpose, facts,
  floor plan and pictures/360s: edit the room data in `palace/tools/gen_plan.py` and re-run it after each render.
- **The homepage has one card per demo, never more.** A new part of a demo (the photo tour, a new page) is a link
  inside that demo's card. He has had to say this twice ("why I have 2 demo 2? you kept making such mistake").
  The science sections below the demos (*Mars facts*, *Building on Mars*) are his request too, and are not demo cards.
- **Floor plans always show in full**, never cropped round a room ("the L1 floor plan doesn't show full"): the room is
  shaded on the whole sheet (`palace/tools/plan_maps.py`), and a click enlarges it.
- Long renders die when the container restarts: render 360s in bands (`lib.render_pano`) and publish each finished
  picture at once, so a restart costs minutes, not the night.
- A possible future Scotiabank demo needs branding permission, or an "unofficial concept" label.

## 5. File map

```
index.html, site.css          hub page: *A city rising on Mars*, one card per place, then the two science cards
science/                      the science: mars-facts/, building-on-mars/, science.css, science.js, README.md
HANDOFF.md                    this file
data/                         NASA terrain for demo 1 (Dingo Gap tiles as base64 text)
ttmath/                       demo 1: index.html (built), logo.png, REQUIREMENTS.md
ttmath/src/                   page.html (source page), blocks/*.js, assemble.py, build.py
ttmath/tools/                 Playwright tests; hraster.npy + lay/ for the hidden check; campus_rooms.py (phase 2 room program),
                              campus_plan.py + campus_buildings.py (plan pages), data/ (line-of-sight map, room sizes)
ttmath/plan/                  phase 2 plan: site plan, a page and floor plan per new building
ttmath/docs/                  TTMath design notes: phase 2 plan, rooms, build steps, rover (+ work in progress), realism, tools
palace/                       demo 2
├── README.md                 demo 2 home: start here
├── REQUIREMENTS.md           what Jim wants: the source of truth
├── docs/                     decisions.md, design/ (chapter summaries), plans/ (Rev G), rooms.md, gallery.md, img/, archive/
├── design/                   the design plan: index.html (cover, the house explorer), rooms-*.html, site/crown/pentagon/... .html,
│   │                         book.css, book.js, explorer.js, explorer-rooms.json
│   ├── img/                  renders, thumbnails, plan maps and mars-map.jpg (README.md lists them)
│   └── atlas/                the Mars Atlas: index.html, atlas.js, site-terrain.jpg
├── plans/                    floor plans Rev G, a page per sheet, written by tools/draw_plans.py (rev-g/ only redirects)
├── tour/                     the photo tour: index.html (viewer), stops.js, pano/ (360s), photos/, README.md
├── tools/render/             Blender scenes: lib, furn, atrium, family, crown, crown_rooms, pent_rooms, overall, pano, final,
│                             runner.py and queue_a.txt, pub.py, pub_house.py, fetch_assets
├── tools/room_program.py     every room and area with its code (Rev G); tools/draw_plans.py draws it
├── tools/                    gen_plan.py, plan_maps.py, docs_export.py, book_shot.py, atlas_shot.py, fetch_marsmap.py,
│                             scene_render.py with orb_scene.html and mars_scene.html, grid.js
├── archive/                  3d-demo/ (the real-time 3D pages, their source and tools), plans-rev-b/, old-palace/
└── index.html                opens the design plan (a redirect)
.github/workflows/pages.yml   deploys to GitHub Pages on every push to main
```
