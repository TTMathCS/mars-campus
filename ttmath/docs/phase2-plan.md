# Phase 2: the campus three times bigger

Jim, 4 Oct 2026: "expand TTMath Campus, need more buildings and spaces. expand so far to 3 times bigger … I also need
parking lot for flying pod which is future proof for travel"; then "building expansion / new rooms/area design as
priority". Published plan: <https://ttmathcs.github.io/mars-campus/ttmath/plan/>.

## Where the new quarter goes, and why

- **Behind the Math Palace.** The campus must stay hidden from the start point until you walk over the ridge (CP-1).
  In front of the palace the ground hides only 3 to 6 m, so nothing tall fits there. Behind it the ground falls 15 to
  20 m to the plain, out of the line of sight: a building there may be 13 to 55 m tall and still not show.
- **Into the slope.** The Crescent's lower floor, Infinity Hall's rows and the garden's terraces step down with the
  ground, so the buildings sit low against it.
- **On the palace's axis.** A new back door in the rotunda (T09-04) opens onto the back terrace (T09-01); the axis runs
  on through the Crescent's hall, down the garden's steps, to the observatory (T-10) at the foot of the garden.
- **Around a garden.** Infinity Hall (T-07) on one side of the garden, the Garden of Primes (T-08) on the other; the
  sports dome, the hangar and the pod port further out on the plain, where the height limit is generous.
- **No power plant on the campus.** It is on the grid of the city nearby (Jim, 4 Oct 2026: "no need for plant
  generators, since the power is supplied centrally by the city close by. free the space up for other purposes"). The
  solar field behind the classroom wing goes; its place becomes the Sun court (T-16). The rovers lose their roof panels
  and charge at the hangar.

## The buildings

| Code | Building | Floor area | Height | Below the line of sight by |
| --- | --- | --- | --- | --- |
| T-06 | The Crescent: the Academy (two floors) | 2,600 m² | 9 m | 4.1 m |
| T-07 | Infinity Hall (240 seats) | 900 m² | 11 m at the stage, 6.5 m at the foyer | 1.8 m |
| T-08 | Garden of Primes (two glass vaults) | 1,010 m² | 8 m | 15.0 m |
| T-09 | Fibonacci Garden (three terraces) | outdoor | 0 | 20.7 m |
| T-10 | Observatory (four levels) | 1,020 m² | 24 m | 18.6 m |
| T-11 | Low-gravity Sports Dome | 900 m² | 16 m | 18.6 m |
| T-12 | Robotics and Rover Hangar | 750 m² | 8 m | 32.0 m |
| T-13 | Rover test yard | outdoor | 0 | 31.7 m |
| T-14 | Pod Port (six pads) | outdoor | 0 | 55.1 m |
| T-15 | Pod terminal | 310 m² | 6 m | 47.1 m |
| T-16 | Sun court (where the solar field stood) | outdoor | 2.8 m | 0.8 m |

Today's campus is about 3,420 m²; phase 2 adds about 7,490 m², 3.2 times today's. "Below the line of sight by" is the
smallest margin over the whole footprint, from the coarse map in `tools/data/envelope.json`; every building is checked
again with its real geometry by `tools/hidden.py` when it is built (CP-1), the Sun court first, as its margin is small.

## Design decisions (and why)

- **Infinity Hall is a hillside theatre**: the stage at the low end, the rows climbing toward the palace. Turned the
  other way, the rows would rise against the falling ground and the hall would stand 13 m out of the slope.
- **The Crescent's corridor is on the dome side**, so every classroom has the garden view; on the lower floor the
  corridor runs along the retaining wall. Washrooms at the same end of both floors, one above the other.
- **The sports dome has a fitness gallery, not a running track**: a track round the edge cannot fit with a court and a
  climbing wall in 34 m, and running in 0.38 g needs harnesses anyway (treadmills that load you to Earth weight).
- **The pods dock to the terminal** through boarding collars, so nobody needs a suit to board.
- **An armillary sundial in the Sun court**, not one drawn on the ground: Gale crater is at 5.4° S, where the flat
  (analemmatic) kind degenerates into a line.
