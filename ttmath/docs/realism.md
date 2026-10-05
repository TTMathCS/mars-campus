# Making the campus look real

Jim, 4 Oct 2026: "lots of scenes are not real, like class room furnitures, and big domes, woods, plants/etc." (CP-24),
and "the roof of classes are even not straight". It must look real, never cartoon.

## Done (v0.7.1 to v0.8.2)

- **Steady signs:** the scene is drawn with a 24-bit depth buffer (render targets with `stencilBuffer: true`; without
  it three.js r128 gives 16-bit depth and surfaces a centimetre apart fight). Measured with `tools/flicker.py` and
  `tools/flicker_score.py`.
- **Plants** (`blk_plants.js`): leaf cards cut from one drawn leaf texture (`leafTexture()`, 4 × 4 cells: fiddle-leaf
  fig, monstera, snake plant, kentia palm, olive, ficus, fern, pothos), stems and trunks as tubes, ceramic, terracotta
  and fibreglass pots; light passes through the leaves. Placed per room by `WING_PLANTS` in `blk_wings.js`.
- **Classroom furniture** (`blk_wings.js`): desks with rounded oak tops on bent-steel sled frames, moulded shell chairs
  on steel legs pulled out at random, a teacher's desk with a pedestal, notebooks, books, aluminium laptops, bottles and
  backpacks; floors fine enough that shadows show under the furniture.
- **The dome:** a dark bronze steel lattice with slim mullions, so it reads as glass and steel.
- **Flat ceilings** (v0.8.2, `roomCeiling` in `blk_wings.js`): each room's ceiling is flat and level at the tallest
  height (3.0 to 3.4 m by room) that stays 12 cm under the roof shell, keeps both rows of lights and every door under
  it; where the shell comes lower near the back wall, a flat soffit runs along the wall behind a straight edge. Acoustic
  tiles (PLASTER `g.y` 6) in teaching rooms, smooth plaster elsewhere; a dark spandrel band behind the glass above the
  ceiling line; the lights hang from the ceiling (`ceilAt`).

## Next

- **More kinds of plants, each chosen for its room** (Jim's rule for every room: all kinds and colours, never one pot
  plant repeated): add flowering and coloured ones (orchids, bird of paradise, croton, a red Japanese maple in the
  library) and match the planters to the plants.
- **Furniture sized to the room**: long sofas and banquettes in the lounge and reception, never small chairs where
  people sit for long.
- **Wood:** real grain and planks with varied boards on floors and furniture; oak and walnut that differ.
- **The rovers:** see [rover.md](rover.md).
