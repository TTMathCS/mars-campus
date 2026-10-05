# The new expedition rover

Jim, 4 Oct 2026: "the rover is not cool at all". Today's rover (`src/blocks/blk_rover.js`) is a boxy pressurised cabin
on six wheels. The new one is an expedition machine you would want to drive: long, low and muscular, built for Mars.

## Design

- **Shape:** a wedge-nosed cabin 7.4 m long (local z −2.25 … 3.0) on six big wheels at z −1.95, 0, 1.95 and
  x ±1.32, each on its own swing arm with an orange coil-over strut, so it stays level over rocks.
- **Cabin:** chamfered sections (`SEC`, right half from the floor to the roof) that narrow and drop toward the nose
  (`prof(z)`); a wrap-around tinted canopy over the nose and a window band along the sides (`isGlass`); seats for four.
- **Wheels:** 1.24 m open-tread tyres on dark rims (NASA-style spring-wire tyres with titanium treads).
- **Body:** white composite with an orange beltline stripe, a dark sill, lockers along the sides, a chassis spine with
  battery packs.
- **Roof:** an equipment rack, a light bar over the canopy, a dish on a mast, a radiator panel. No solar panel: the
  rovers charge at the hangar from the city's grid (the campus has no power plant of its own).
- **Lights:** headlights in the nose, amber markers on the sides, red at the back.
- **Back:** two suitports and a ladder to the roof; it docks to the hangar's suit room (T12-04).

Three of them: at the hangar (T-12), by the gateway, and out on the test yard (T-13).

## Work in progress

[rover-wip/blk_rover.js](rover-wip/blk_rover.js) is the new builder as far as it got; [rover-wip/blk_build.diff](rover-wip/blk_build.diff)
widens the rovers' collision radius from 7.5 to 9.0 (it is longer). To continue:

1. Copy `rover-wip/blk_rover.js` over `src/blocks/blk_rover.js` and apply the diff to `src/blocks/blk_build.js`.
2. Still to do: turn every cabin face outward (`L.orient(start, fn)` over all the cabin's faces, with `fn` pointing away
   from the cabin's long axis; only the left side does it now), then look at it from all sides (`tools/shot.py`).
3. Check it stays hidden from the start (`tools/hidden.py`): it is taller than today's rover.
4. `python3 src/assemble.py && python3 src/build.py`, then shots by day and at sunset, then push.

Until then, today's rovers stay, with their roof solar panels taken off.
