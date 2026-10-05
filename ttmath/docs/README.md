# TTMath on Mars: design notes

The design sources of the TTMath campus, kept in the repo so the work can be picked up and improved later (Jim, 4 Oct
2026: "add your original docs / designs to the repo so later can improve/update"). What the campus must do and the
change log are in [../REQUIREMENTS.md](../REQUIREMENTS.md); project status is in [../../HANDOFF.md](../../HANDOFF.md).

| Note | What it covers |
| --- | --- |
| [phase2-plan.md](phase2-plan.md) | The campus three times bigger: where the new quarter goes and why, heights hidden from the start, floor areas |
| [phase2-rooms.md](phase2-rooms.md) | How the rooms are designed, where their source is, how to change one and redraw |
| [phase2-build.md](phase2-build.md) | How to build the new quarter into the 3D campus: ground, light, shadows, checks, order |
| [rover.md](rover.md) | The new expedition rover: the design and the work in progress in [rover-wip/](rover-wip/) |
| [realism.md](realism.md) | What makes the scenes look real, what is done and what is next |
| [tools.md](tools.md) | The scripts in `ttmath/tools/`: what each checks and how to run it |

## The design sources (edit these, then regenerate)

| File | What it is |
| --- | --- |
| `ttmath/tools/campus_rooms.py` | The room program of phase 2: every room and area with its code, purpose, second use, place and size |
| `ttmath/tools/campus_plan.py` | Draws the site plan and the overview pages of `ttmath/plan/`; checks every new building against the line of sight |
| `ttmath/tools/campus_buildings.py` | Draws a floor plan and a page per building, and writes `ttmath/src/blocks/blk_p2data.js` for the 3D build |
| `ttmath/tools/data/envelope.json` | How tall a building may be anywhere round the campus and stay hidden from the start (from `envelope.py`) |
| `ttmath/tools/data/room_areas.json` | Room sizes measured from the drawn floor plans |
| `ttmath/src/blocks/*.js` | The 3D campus itself; `assemble.py` and `build.py` publish it (see [tools.md](tools.md)) |

Regenerate the plan after changing the room program:

```
python3 ttmath/tools/campus_buildings.py      # building pages, floor plans, blk_p2data.js
python3 ttmath/tools/campus_plan.py           # site plan, overview pages (needs numpy and Pillow)
python3 ttmath/tools/plan_shots.py            # pictures of every page and drawing, to check by eye
```
