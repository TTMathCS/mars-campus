# Phase 2: the rooms

Every room and outdoor area has a code, a purpose, a second use where it can, a place and a size before anything of it
is drawn or built (Jim's rule "design before drawing", 2 Oct 2026). The source is one file:
`ttmath/tools/campus_rooms.py`.

## Codes

`T06-01` is building T-06 (the Crescent), room 01. Corridors end in letters (`T06-CU` upper, `T06-CL` lower), pads are
`T14-P1` … `T14-P6`. Today's campus is T-01 to T-05; phase 2 is T-04 (the courtyard, sealed) and T-06 to T-17 (T-17: the links).

## How a building is described

- **The Crescent** (`CRESCENT`): an annular band round the dome's centre, radii 46 to 60 m, from −50° to +50° (0° is
  straight behind the dome). Each room is an angle range `a=(a0, a1)` on a floor (`upper`, `lower`); the corridor band
  runs from radius 46 to 49.2 m; the hall (`T06-01`, `T06-10`) takes the full depth.
- **Infinity Hall** (`INFINITY`): a fan with the stage at its point (`lat`, `rad`), opening along `turn` (0 = toward the
  palace); stage to 6 m, seats 8 to 30 m in 12 rows, foyer 30 to 36 m.
- **The others**: a centre in the palace frame and their sizes (vaults, tower radius, dome radius, hall width and
  depth, pads and terminal). The garden (`GARDEN`) lists its terraces with their levels, the spiral and the sculptures.

Places are in the Math Palace's frame, in metres: `rad` from the dome's centre toward the start, `lat` to the
visitor's right as they walk toward the palace.

## Changing a room

1. Edit its entry in `campus_rooms.py` (name, use, angles or sizes).
2. Run `campus_buildings.py`, then `campus_plan.py` (see [README.md](README.md)); `plan_shots.py` makes pictures of
   every page to check them by eye.
3. The plan check prints `CHECK:`; every new building must stay at least 0.5 m below the line of sight.
4. `blk_p2data.js` is rewritten each time, so the 3D campus follows the plan; rebuild the page (see [tools.md](tools.md)).

## What the drawings show

The palace and the start toward the bottom of every drawing, like the site plan; rooms coloured by use; doors with
their swing, glass in blue, stairs with an arrow toward "up" or "down", exits in green, the way in in red. Room sizes
are measured from the drawn outlines and saved to `tools/data/room_areas.json`.
