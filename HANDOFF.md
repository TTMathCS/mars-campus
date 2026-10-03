# Handoff: where Mars Campus stands and how to continue

Read this first if you are picking the project up in a new session, on another account or with another AI.
Everything needed to continue is in this repo. Last updated 2 Oct 2026.

Owner: Jim (TTMath). Live site: https://ttmathcs.github.io/mars-campus/

## Work log (newest first; every step is pushed as it finishes — Jim, 3 Oct: "keep your progress logged and synced")

- **3 Oct, from 01:50 UTC, session `session_01U4NrzcFVFwFYPq6dhgJtP1` (working; it can reach PyPI, so it runs the
  renders):**
  - **The site is now *Mars – your new home*** (Jim, 3 Oct: "the title should not be 'Mars – No Way Home', should
    be 'Mars - your new home'"; the dash set as before, his lowercase kept): the homepage, every page's header and
    browser tab (`book.js`, `science.js`, `draw_plans.py`, plans re-drawn), the unlinked 3D pages, both READMEs and
    the decision log. Only the archives and the log's quotes keep the old name.
  - Next: the rest of step 1 (the docs), then steps 2, 3 and 4 below.
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
1. **Finish the Orb in the design book**, `palace/design/crown.html`: the `#orb` section still says 40 m, "Rev E,
   for Jim's review", 804 m² rings, and has a `div.decide` "For Jim's review" box (remove it). Update the heading
   (just "The Orb"), the intro, the table (+80 870, +72 1,070, +64 870, total 2,800 m²), the note under it, the top
   numbers (19,500 m², 5.7 times), "a mirror sphere 48 m across from +48 to +96 m" in `#look`, the areas table
   (Orb 2,800, Crown 19,500) and drop the Rev B/Rev D history paragraph. Redraw the section script `fOrbIn`
   (constants `R = 24, RI = 22`, `k` about 11, `H0` about 98; floors' inner edge at the glass r = 12 on all three
   floors; rooms as boxes between the lanes, 14.4 m out to 2.4 m inside the shell; windows at about 27–55°;
   heights +48/+96; label targets moved). Same numbers in `palace/design/interiors.html` (its Orb heading also
   says "Rev E, for Jim's review"), `explorer.js` ("40 m", "52 to 92 m up"), `atlas/atlas.js` ("40 m"), the site
   plan's dashed "Orb above" circle in `site.html` (r 20 → 24), `palace/README.md` (numbers, the "One question for
   Jim" paragraph: answered), `REQUIREMENTS.md` (CR-3 19,500 m², OR rows, open questions: none),
   `docs/design/02-crown.md`, `04-interiors.md`, `docs/design/README.md`, `docs/decisions.md` (record the two
   answers above under 3 Oct, and remove the "For Jim's review" table, now answered), and this file's §2c numbers.
   Then remove every other "For Jim's review" note in the pages (Jim wants them clean).
2. **Archive or remove the rest of the old files** (Jim's ask): `palace/docs/plans.md` (Rev B) →
   `palace/docs/archive/`; the Rev B sheet images in `palace/docs/img/plans/` once `gen_plan.py` stops using them
   (step 3); the unlinked real-time 3D demo (`palace/index.html`, `palace-debug.html`, `src/`, `build.sh`,
   `crown/`, `orb/`, `pentagon/` and their shot tools in `palace/tools/`) → `palace/archive/3d-demo/`, with
   `palace/index.html` replaced by a redirect to `design/` (check the pages.yml key-file list, which names
   `palace/index.html`); `palace/design/mars.html` and `living.html` (redirects to `science/`) and
   `docs/design/00a-mars.md`, `00b-living.md`; images nothing links to. Run a link check after (no missing files).
3. **Rev G names and codes in the design plan**: `palace/tools/gen_plan.py` (room pages and
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
| Hub page | `index.html`, `site.css` | Live, titled **Mars – your new home** (Jim, 3 Oct 2026). One card per demo, never more; the demo 2 card opens the design plan. The Mars Atlas is a picture at the top right. Below the demos, *The science*: one card for Mars facts and one for Building on Mars, each listing its pages. |
| The science | `science/` | Live since 2 Oct 2026. Real, with sources, one subject a page: Mars facts (8 pages) and Building on Mars (12 pages). See [science/README.md](science/README.md). |
| Demo 1, TTMath on Mars | `ttmath/` | v0.7 live and finished: one integrated campus, real rooms, real materials. See `ttmath/REQUIREMENTS.md`. |
| Demo 2 home | `palace/README.md` | **Start here for demo 2.** Links the requirements, the decision log, the design chapter by chapter, the floor plans and every picture, all viewable on GitHub. |
| Demo 2, requirements | `palace/REQUIREMENTS.md` | Rewritten 1 Oct 2026 by area (GN, ST, CR, OR, PG, LV, TR, SY, DM), with status and links. **No open questions.** |
| Demo 2, design book | `palace/design/` | **Rev E, live** at https://ttmathcs.github.io/mars-campus/palace/design/. Chapters 01–07 written; 08 Life support, 09 Communications and space, 10 Building it still to write. For Jim's review: the Orb, Rev E. |
| Demo 2, floor plans | `palace/plans/` | Rev B, **approved by Jim on 30 Sep 2026** ("Approve. Go"). B.1 (1 Oct): the garden mirrors and the solar field taken off at his request. The Orb is still drawn as Rev B. |
| Demo 2, 3D build | `palace/src/` → `palace/index.html` | **Phase 1 live** since 1 Oct 2026 (Jim, the night before: "please go ahead to build, you have my pre approve"): terrain, sky, spaceport, pod, the Crown with the Orb and the built ground, storm, the 10-shot flight, cameras, look-around. Phase 2 is live: **the Crown's main floor** at `palace/crown/` (the hangar, the Door, the Arrival hall, the Glide, 30 furnished rooms, the sun through the slots at five times of day, a map, portals) and **the Orb** at `palace/orb/` (the universe switch, the zoom from the cosmic web to the house, the Earth and Mars dashboard, the Gate sending you to demo 1). Phase 3 has started: **the Pentagon** at `palace/pentagon/` (the atrium, its bridges and the portal column; the rooms of ring A seen through the glass on every level; the garden level with the lake, forest, orchard, farm and meadow; the sun court; Jim's residence on L1 to walk into, with the piano, the TV and the books). Next: the rest of L1. |
| Demo 2, photo tour | `palace/tour/` | **Live since 1 Oct 2026.** Jim found the real-time 3D pages cartoonish ("WTH IS THIS? CATOON? nothing is real or feel real at all"), so the house is now shown as path-traced 360° photographs (Blender Cycles, scanned furniture). He likes them ("so great and almost perfect. i need all rooms to be like this"): **every room is to be rendered this way.** Live: the family room. Rendering: the rest of Jim's L1 rooms, the atrium, the sun court; next the master suite down, the Crown's rooms (the great salon first), then the Orb. The scenes are scripts in `palace/tools/render/`. |
| Demo 2, first palace | `palace/archive/old-palace/` | Archived (Jim rejected it: "far from satisfactory"). Its requirements are in `palace/docs/archive/old-palace.md`. |

## 2. Demo 2: where the design stands

The full record is in `palace/docs/decisions.md` (every question, Jim's words, what changed). In short:

- **Above ground: the Crown.** A white ring 276 m across floats on anti-gravity 40 m over the Stone Garden, with five
  spires to 90 m and no big windows. At its centre floats the **Orb**, a mirror ball 40 m across.
- **The Orb, Rev E (1 Oct 2026, for Jim's review).** The universe is **future-tech VR**: switched on, it appears in 3D
  directly in the space of the room, all round, with no projector, no screen and no ball (Jim: "not projector",
  "not inside a ball", "projected directly in the 3d space"). Jim zooms it like a 3D dashboard, from the whole universe
  down to Mars and the house; Earth and Mars float in the corner of his view with live weather, and can be hidden.
  The ball in the middle, 18 m across, is the **Wormhole Gate**: choose a place and a time in the universe, walk
  across a short bridge into the ball (things ride in on a cart or with a robot), press send, and it shoots you like a
  beam of light to that place and time, instantly ("this is how wormhole works"). The far end is a ball too, for the
  way back. Rooms on three rings round it: +64 portal ring, +72 Universe lounges and the bridge, +80 five rest rooms
  behind radiation glass.
- **The ground, Rev E (1 Oct 2026, for Jim's review): built, not raw** (Jim: "the ground is raw and need some
  construction/design as well. and at least some hints that there is big part underground", GN-13). A **paved
  pentagon** 4 m wider than the Pentagon shows where the house lies; the **Stone Garden** (raked gravel 224 m across,
  seven basalt stones) is the circle inside it; five strips of glass trace the avenues; a glass **corner pavilion**
  holds each corner stair; basalt pads lie under the spires. At the centre the **Orb's dock** (Jim: "some interface
  when orb can land on the ground", OR-9) rings the **Sun Well**, the sky lens over the Pentagon's atrium. Still
  **nothing spread over the ground**: no mirrors and no solar panels (GN-12).
- **Below ground: the Pentagon.** One solid pentagon, 160 m sides, five levels 24 to 68 m down under 16 m of soil,
  eleven times the Crown's floor area. Jim sleeps here (the master suite down on L1).
- **Arcadia Spaceport**, 30 km due east on landing zone AP-1: three pads, terminal, pod station, fuel plant, ice mine.
- **Power:** four 5 MWe fission microreactors, two on the Pentagon's L4 and two at the port, joined by a 30 km DC
  cable. No solar field.
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

**Build order** once Jim approves the design book. Each phase is published at `palace/` (same link):
1. The 30 km landscape, the spaceport and the pod flight video.
2. The Crown and the Orb.
3. The Pentagon, one level at a time.

## 2b. Next steps, in order

1. **Jim's review of the Orb (Rev E).** If he asks for changes, update `crown.html` (the Orb section and its figures
   `fOrbIn`, `fDash`, `fZoom`), `interiors.html` (the Orb room cards), `docs/design/02-crown.md` and the decision log,
   then re-export the drawings (section 3).
2. **Write chapter 08 Life support** (`life.html`): air at 70 kPa with 27% oxygen (decided; breathes like Calgary;
   NASA's exploration atmosphere is 56.5 kPa with 34%); oxygen from electrolysis and the fuel plant's spare 100 t a
   ship; CO₂ scrubbing; the water loop (ice melt, over 95% recycling, the L2 lake as the reserve, the Crown's 90,000 t
   of wall ice); food from the L2 farm under lamps, the storm reserve of two years on L4; heating from reactor heat;
   radiation with a dose budget (open plain about 230 mSv a year, the Crown about a third behind 3 m of ice, the
   Pentagon about 1, Jim's target about 20 by sleeping below and spending about 6 h a day in the Crown and the Orb);
   dust and perchlorates (suit ports, filters); fire safety at 27% oxygen; the medical centre on L3.
3. **Write chapter 09 Communications and space** (`space.html`): radio delay 3 to 22 min one way; three areostationary
   relays at 17,032 km up (orbit radius 20,428 km) plus a relay off to the side of the Sun for the two weeks of solar
   conjunction every 26 months; laser links; the fibre to the port; Phobos (9,376 km orbit, 7.65 h, rises in the
   west) and Deimos (23,463 km, 30.3 h); Mars time (sol 24 h 39 min 35 s, a year of 668.6 sols, a Mars clock in every
   room); Earth as an evening or morning star; the live Earth and Mars weather on the Orb's dashboard. The Atlas
   already draws the relays and the moons.
4. **Write chapter 10 Building it** (`phases.html`): year 0 is 2027, when Jim lands. Robots land two launch windows
   ahead (about 4½ years before); the order of work (power and the fuel plant at the port first, then the road and
   cable, the Pentagon dig and L4/L5, the Crown's pads and ring, the gardens); the city's phases 1 to 4 (chapter 01).
   Use a timeline drawing with the 26-month windows.
5. For each new chapter: add it to `READY` in `book.js`, write its page in `palace/docs/design/` (copy the pattern of
   01–07), add its figures to `BOOK` in `docs_export.py` and export, add its requirements' links in
   `REQUIREMENTS.md`, check it with `book_shot.py` (desktop, phone and dark), commit, push and tell Jim what it is
   before he opens it.
6. **The 3D demo** (Jim pre-approved the build on 1 Oct 2026): phase 1 is live at `palace/`, phase 2 (the Crown's main
   floor and the Orb) at `palace/crown/` and `palace/orb/`, and phase 3 has started at `palace/pentagon/`. Next in
   the Pentagon: the rest of L1 (the club and cinema, the baths and the 50 m pool, the great library, the guests),
   then the corner cores and the rooms of L3 to L5. Still to come above ground: the spires' upper floors and the Orb's rest rooms. The floor
   plans' rooms are now Rev G (for Jim's review); its Orb sheet follows Rev E until Jim answers Rev F.

## 2c. Numbers used across the design book

Keep new pages consistent with these (sources and working are in the chapters):
- Site: the Crown at 39.80° N 201.44° E, Arcadia Spaceport on AP-1 at 39.80° N 202.10° E, 30 km apart; ground −3.9 km,
  air 870 Pa (40% above the Mars average); ice within 1 m and tens of metres thick; AP-9 thick ice 58 km east of the
  port. House to Olympus Mons 1,780 km, to Gale crater (TTMath campus) 4,360 km, to Jezero 6,030 km.
- The Crown: ring 244–276 m across (radius 122–138), underside +40, main floor +41, roof 50 + 40·c⁶ (spires +90,
  dips +50), where c = (1 + cos 5φ) / 2; walls and roof 3 m (0.1 skin, 0.3 sintered shell, 2.2 ice, 0.2 aerogel, 0.2
  liner); about 90,000 t of wall ice; mass about 155,000 t, 115 MN per drive. Floor area **19,500 m²** gross (main
  floor 9,950 + the Glide 3,120 + spire upper floors 3,630 + the Orb 2,800), 5.7 times the TTMath campus. Room sizes
  on the floor plans are net, inside the walls (rooms between radii 128.5 and 135 m).
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
  (11 times the Crown); 16 m of soil; the dig 3.1 million m³ and 1.5 million t of ice.
- Air inside: 70 kPa with 27% oxygen.
- Power, phase 1: demand 8 MW average (house 4.9, port 3.1), about 14 MW peak; four 5 MWe heat-pipe microreactors,
  two on L4 and two in a vault at the port, 9 MW available at each end (18 in all); no solar field; batteries
  2 × 20 MWh; fuel cells 8 MW on stored methalox (about 9 days at full load); DC link 30 km at ±20 kV, 15 MW, about
  1.5% loss; heat at the house about 10 MW (2 MW warms the house, 8 to the radiators), radiators 150 × 60 m, 400 m
  north, up to 20 MW.
- Transport: the pod is 9.2 × 4.5 m, 4 seats, about 6 t, 22 kN on Mars, top speed 680 km/h, about 1.5 t of methalox
  for the scenic flight (37 km, 4 min 40 s), about 1 t for a direct hop; the bus 12 seats at 40 km/h, 45 min; the
  maglev (phase 2) 30 km at 400 km/h in a 7 m tunnel at −68 m, about 6 min; Hohmann transfer 259 days, windows every
  26 months; Jim launches Nov–Dec 2026 and lands mid-2027.
- The spaceport: three pads Ø 80 m with berms (radius 114–147 m, 6 m high) at bearings 60, 90 and 120, 1.6 km from
  the terminal (Ø 180 m); tower 77 m; pod station 70 × 120 m with four pod pads; two reactor domes south-west of the
  terminal; one ship's propellant 1,200 t (260 t CH₄, 940 t O₂, plus 100 t spare O₂) from 585 t of water and 715 t of
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

**Demo 2, 3D build** (`palace/src/`): plain JavaScript on three.js r128, no build tools beyond `sh`.
- `palace/build.sh` joins `src/00_head.html` and `src/[1-9]*.js` (in name order, inside one function) into one page.
  - `sh palace/build.sh debug` writes `palace/palace-debug.html` (git-ignored) with test hooks. Use this while working.
  - `sh palace/build.sh` writes the published `palace/index.html` (phase 1 is live). Run it after every change to
    `src/` and commit the result with the source.
- Source files: `10_core.js` renderer, shared uniforms, shader chunks, HDR bloom and tone mapping; `20_sky.js` sun,
  sky, Phobos, stars; `30_terrain.js` the height function (GLSL and a JS twin that must match), ground detail (dunes,
  speckle pebbles, frost, dust) and ten nested terrain grids; `40_mat.js` building material (patterns 1 shell, 2 solar
  (unused now), 3 pad, 4 steel, 5 pod skin, 6 white ceramic, 7 soft-touch trim; optional `ENV_CUBE` reflections) and
  shadow map; `45_lights.js` point lights; `50_port.js` spaceport (two reactor domes, no solar field); `55_pod.js` pod
  and cockpit; `60_crown.js` the Crown, the Orb, the Stone Garden (`STONES`, smooth-normal boulders, no mirrors), the
  Orb's dock and the corner pavilions (the paving, kerb, glass strips and pads are drawn in the terrain shader);
  `70_fx.js` dust devils, storm, sparks; `80_flight.js` the path, the ten shots and the cameras; `90_ui.js` HUD,
  cards, look-around, sound; `99_main.js` the main loop.
- World: metres, x east, z south, y up, the Crown's centre at the origin, the spaceport terminal at x = 30 000. Plan
  coordinates (x, y north) map to world (x, −y). Every vertex shader bends the world with the curvature of Mars.
- Test: `python3 palace/tools/crown_shot.py '[["name", "js", waitMs], ...]' 960x540` loads the debug page headless and
  saves PNGs to `palace/tools/out/`. In the page, `__crown.at(t)` jumps the flight video to time t (director's
  camera), `__crown.view(x, y, z, tx, ty, tz)` places the camera, `__crown.exp(e)` sets the exposure, `__crown.step(n)`
  renders n frames and `__crown.ev("js")` runs code inside the page's scope (FLIGHT, CROWN, U, camera, setSun ...).
  Each frame takes about 8 s at 960×540 in SwiftShader; long jobs must run in the background (`nohup ... &`). Node
  helpers: `shot.js`, `probe.js` (evaluate one expression), `grid.js` (contact sheet of a folder of PNGs).
- **Pictures for the book:** `python3 palace/tools/book_renders.py [name,name,...]` renders the views listed in
  `RENDERS` (a fixed camera via `SHOT(...)`, or a time in the flight) to `palace/design/img/<name>.jpg`, 1600 × 900,
  about 25–45 s each. Set `RENDER_OUT=some/dir` to try views without touching the book. Jim judges every picture on
  whether it looks real; drop a view rather than publish one that looks like a game (the cockpit view was dropped on
  1 Oct 2026 for that reason).

**Demo 2, the Crown's main floor** (`palace/crown/index.html`): one self-contained page, three.js r128. Read
`palace/crown/README.md` first. The ring is built in 9° chunks from `roofTop(b)` and `ceilAt(b)`; `ROOMS` comes from
`SEGS` (the same list as chapter 02); each room's furniture is placed in its frame (`roomFrame`: x clockwise round the
ring, z towards the garden) with the kit (`sofa`, `table`, `bed`, `shelves`, `piano`, `tree`, `fern`, `pool` ...).
Light: a 4096 shadow map that follows you, `TOD` for the five times of day, and `probe()`, a cube camera turned into
image-based light every 14 m. Test with `python3 palace/tools/crown_in_shot.py`.

**Demo 2, the Orb** (`palace/orb/index.html`): one self-contained page, no build step, three.js r128. Read
`palace/orb/README.md` first. Levels are built in `LV` (web, mw, sol, mars, arc, home, earth), each a group with a slow
spin, a focus point where its child level sits, and labels; `go(id)` zooms there through the chain (`PARENT`).
`ASTRO` has the planets' positions today, the Mars clock (Mars24's algorithm) and the Sun over Earth; `DASH` draws the
two globes into the canvas behind the dashboard and fetches Earth's weather (Open-Meteo) for the home town kept in
`localStorage`. The send sequence is `sending()`. Test with `python3 palace/tools/orb_shot.py` (`?debug` exposes
`window.__orb`); the planet maps come from `python3 palace/tools/fetch_textures.py`.

**Demo 2, the Pentagon** (`palace/pentagon/index.html`): one self-contained page, no build step, three.js r128. Read
`palace/pentagon/README.md` first. `LV` holds the five levels; the atrium is built side by side (`onSide(a, k, t, y)`:
the point at apothem `a` on side `k`, a fraction `t` along it). The rooms behind the glass are interior-mapped: `ROOMS`
lists them per level and side as on the plans, and `ROOM_FS` draws each kind (walls, floor, ceiling, lights, then the
furniture on a plane halfway back). `GARDEN` builds L2 (`lakeD` is the lake's shape, `each(sector, ...)` plants a sector
row by row, `BLOCK` holds what you can't walk through); its sky shader also draws the far horizon on the outer walls.
`canStand` decides where you can walk. `RES` is Jim's residence on L1 (walkable rooms, built in (a, u) coordinates
with the Crown's furniture kit) and `ACTS` the things to do there. Static meshes are merged by material at the end
(`mergeStatic`; the residence separately, so its shell can stop casting shadows on L2). The render
target has a 24-bit depth buffer (three r128 gives render targets 16 bits otherwise, and surfaces 2 cm apart flicker).
Test with `python3 palace/tools/pentagon_shot.py` (`?debug` exposes `window.__pent`). The probe's re-captures fade in
over 1.5 s (`ENVB`: every standard material's shader blends the previous environment map into the new one); a sudden
swap made the rooms flash every few seconds as you walked (Jim, 1 Oct 2026). The Crown has the same `ENVB`.

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
  is the demo's own 40 × 12 km landscape seen from above, baked by `python3 palace/tools/bake_site.py` (about 17 min,
  run in the background). Test with `python3 palace/tools/atlas_shot.py '[["name", "js", waitMs]]' 1280x720 fake|none`;
  `window.__atlas` has `jump(k)`, `select(id)`, `flyTo({...})` and `CAM`. Links can open a view:
  `atlas/#place=house` or `atlas/#@lat,lon,distkm,...`.

**Demo 2 plans Rev G** (the rooms, for Jim's review): edit the room in `palace/tools/room_program.py`, then run
`python3 palace/tools/draw_plans.py`; it rewrites `palace/plans/` (pages, `svg/`, `rooms.json`) and
`palace/docs/plans/`. Don't edit the generated pages by hand. Codes: `L1-01` (level, room, numbered sector by
sector from the atrium out), `C-01` to `C-34` (Crown, clockwise from Arrival), `O-00` to `O-17` (Orb), `G-01` to
`G-08` (ground), letters for shared areas (`L1-AT`, `CC1`, `C-GL`).

**Demo 2 plans Rev B** (approved, kept as drawn): edit `palace/plans/index.html` directly. It is one self-contained page, and every drawing is SVG
built by its script. The geometry constants sit near the top of the script:
- `CR` is the Crown.
- `PG` is the Pentagon.
- `SEGS` holds the Crown's rooms.
- `LEVELS` holds the Pentagon's rooms.

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
- **Demo 2 is the design plan** (2 Oct 2026): the homepage card opens `palace/design/`, *Jim's Retirement House ·
  Design Plan*. The real-time 3D pages (the flight, the Crown, the Orb, the Pentagon) are hidden from the homepage
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
index.html, site.css          hub page: one card per demo, then the two science cards
science/                      the science: mars-facts/, building-on-mars/, science.css, science.js, README.md
HANDOFF.md                    this file
data/                         NASA terrain for demo 1 (Dingo Gap tiles as base64 text)
ttmath/                       demo 1: index.html (built), logo.png, REQUIREMENTS.md
ttmath/src/                   page.html (source page), blocks/*.js, assemble.py, build.py
ttmath/tools/                 Playwright tests; hraster.npy + lay/ for the hidden check
palace/                       demo 2
├── README.md                 demo 2 home: start here
├── REQUIREMENTS.md           what Jim wants: the source of truth
├── docs/                     decisions.md, design/ (chapter summaries), plans.md, gallery.md, img/, archive/
├── design/                   the design book: index.html (cover), site/crown/pentagon/... .html, book.css, book.js
│   ├── img/                  renders, thumbnails and mars-map.jpg (README.md lists them)
│   └── atlas/                the Mars Atlas: index.html, atlas.js, site-terrain.jpg
├── plans/                    floor plans Rev G, a page per sheet, written by tools/draw_plans.py (rev-g/ only redirects)
├── archive/plans-rev-b/      floor plans Rev B, archived (self-contained page)
├── src/                      the 3D demo's source; build.sh builds it
├── crown/                    the Crown's main floor, phase 2: index.html (self-contained), README.md
├── orb/                      the Orb, phase 2: index.html (self-contained), tex/ planet maps, README.md
├── pentagon/                 the Pentagon, phase 3: index.html (self-contained), README.md
├── tour/                     the photo tour: index.html (viewer), stops.js, pano/ (360s), photos/, README.md
├── tools/render/             Blender scenes for the photo tour: lib, furn, atrium, family, pano, final, fetch_assets
├── tools/room_program.py     every room and area with its code (Rev G); tools/draw_plans.py draws it
├── tools/                    crown_shot.py, crown_in_shot.py, orb_shot.py, pentagon_shot.py, book_renders.py, book_shot.py, atlas_shot.py, plans_snap.py,
│                             docs_export.py, fetch_marsmap.py, bake_site.py, scene_render.py with
│                             orb_scene.html and mars_scene.html; shot.js, probe.js, grid.js
├── archive/old-palace/       the first palace, kept for reference
├── build.sh                  builds src/ into palace-debug.html or index.html
└── index.html                the published 3D demo, built from src/ by build.sh
.github/workflows/pages.yml   deploys to GitHub Pages on every push to main
```
