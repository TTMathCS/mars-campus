# The tools in `ttmath/tools/`

The 3D campus is one page. Its source is `ttmath/src/page.html` with the campus code in `ttmath/src/blocks/*.js`:

```
python3 ttmath/src/assemble.py     # puts the blocks into page.html between the CAMPUS markers
python3 ttmath/src/build.py        # writes the published ttmath/index.html
```

The test scripts open the source page in headless Chromium with Playwright (see `_page.py`); shots land in
`ttmath/tools/out/` (git-ignored). The first bake takes a few seconds; in this software renderer a shot takes one to
two minutes, so run them one after another, never several at once.

| Script | What it does |
| --- | --- |
| `shot.py` | Screenshots: `shot.py desk\|small\|mobile '[["name", "js to run", hideUI, waitMs], …]' [--sample]`; `--sample` also writes the campus points for `hidden.py` |
| `hidden.py` | Line of sight from the start: every campus point must stay behind the ridge (CP-1); margins below 0 mean visible |
| `walktest.py` | Walks legs toward points in the wings and prints where the walker ends up (doors, walls, steps) |
| `walk_check.py` | **Run before every push.** Walks the visitor's routes (start over the ridge, courtyard, a wing, the palace, the back door, the Crescent, its stair and court, the Sun court) and fails if any stops short; `--built` tests the published page |
| `evalpage.py` | Runs JavaScript in the page and prints the result, e.g. `evalpage.py "__mars._eval('PAL.R')"` |
| `eagle_shot.py` | The homepage card's picture: the campus from the air at sunset, from a free camera (its numbers in the script), written to `ttmath/preview.jpg` (also the page's og:image) |
| `site_check.py` | Opens the built `ttmath/index.html` as GitHub Pages serves it and takes one shot |
| `flicker.py`, `flicker_score.py` | Shimmer test for the signs: three shots per view (still, still again, a 2 cm step) and the share of pixels that jump |
| `envelope.py` | Samples how tall a building may be round the campus and stay hidden; writes `data/envelope.json` (slow) |
| `envelope_map.py` | Draws that map as a picture |
| `campus_plan.py` | Site plan and overview pages of `ttmath/plan/`, checks the new buildings against the map |
| `campus_buildings.py` | A page and floor plan per new building, room sizes, and `src/blocks/blk_p2data.js` |
| `plan_shots.py` | Pictures of every plan page (desktop and phone) and drawing, and whether a page overflows sideways |
| `lay/` | Older layout helpers for the wings (`model.py`, `wings.py`) |

`campus_rooms.py` is not a tool but the room program the two plan scripts read (see [phase2-rooms.md](phase2-rooms.md)).
Python packages: Playwright for the browser scripts, numpy and Pillow for `campus_plan.py`, `envelope_map.py` and
`flicker_score.py`.
