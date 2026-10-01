# The Pentagon · demo 2, phase 3

**[Demo 2 home](../README.md) · [Requirements](../REQUIREMENTS.md) · [Decisions](../docs/decisions.md) · [Design](../docs/design/README.md) · [Floor plans](../docs/plans.md) · [Pictures](../docs/gallery.md)**

Live at **https://ttmathcs.github.io/mars-campus/palace/pentagon/**. The house below ground, as in chapter 03 and the
floor plans. You come down by portal to L1, onto a bridge in the atrium.

- **The atrium.** A five-sided shaft 35 m across and 68 m deep, from the roof of L1 at −16 m to the sun court on L5 at
  −68 m. Light from the Sun Well's sky lens falls down its middle, with dust drifting in it. Every level has a terrace
  3.6 m deep with a planter of shrubs along its edge, trailing plants hanging over it and a glass balustrade.
- **The rooms behind the glass.** The rooms of ring A face the atrium through floor-to-ceiling glass on every level, as
  on the plans: on L1 the guest lounge with guest suites above it, the family room with Jim's study above it, the
  cinema, the thermal pools and the great library; on L3 the city control room, Jim's workshop, the robot foundry, the
  laboratories and the AI core; on L4 waste to soil, the two microreactors, the ice melt, the oxygen plant and the food
  store; on L5 the rover hall, the maglev hall, the freight portals, the seed vault and the tunnel boring machines.
  Stand on a terrace and the top left says which room is behind the glass.
- **The portal column**, 10 m across, in travertine with 60 flutes, with five bridges to it on every level and a portal
  at the end of each. The buttons at the bottom (or keys 1 to 5) take you to any level in one step.
- **L2, the garden level.** 16 m tall under a sky of lamps that carries on down the outer walls to a far horizon, so
  the garden seems to go on. Walk out through the openings in the glass: the orchard (sector 1), the market garden, the
  vertical farm and a field of wheat (2), the lake with its reeds and pier (3), the forest with ferns and the stream (4),
  and the meadow with drifts of wild flowers and the tea house (5). The columns that carry the levels above are
  planted from foot to head, like vertical gardens.
- **L5, the sun court.** A lawn with fruit trees round the pool at the foot of the column, a paved walk round it and
  causeways over the pool to the portals.

One self-contained page, `index.html`, three.js r128, no build step. The rooms behind the glass are drawn by interior
mapping (`ROOMS`, `ROOM_FS`): the ray from your eye is followed into a box behind each bay, with its lights, its walls
and the furniture standing about halfway back, so they move as rooms do when you walk past. Everything that never
moves is merged into one mesh per material (`mergeStatic`); trees, shrubs, flowers, ferns and wheat are instanced.
Light: a 4096 shadow map, the lens or the sky of lamps as the sun, and a probe of the space round you turned into
image-based light.

Test with `python3 palace/tools/pentagon_shot.py` (see its docstring): `?debug` exposes `window.__pent` with
`enter()`, `on(level, bearing)`, `at(level, x, z, yaw, pitch)`, `look(yaw, pitch)`, `step(n)` and `ev("js")`.

Not yet: walking into the rooms of L1, L3, L4 and L5 (they are seen through the glass), the stair cores in the
corners, and the stream's falls.
