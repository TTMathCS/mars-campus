# The Pentagon · demo 2, phase 3

**[Demo 2 home](../../../README.md) · [Requirements](../../../REQUIREMENTS.md) · [Decisions](../../../docs/decisions.md) · [Design](../../../docs/design/README.md) · [Rooms](../../../docs/rooms.md) · [Floor plans](../../../docs/archive/plans-rev-b.md) · [Pictures](../../../docs/gallery.md)**

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
- **Jim's residence (L1, sector 1).** The glass door in the middle of the south-east side opens into the family room:
  two sofas by the fire, the grand piano looking out at the atrium, the table for eight and the books, under rows of
  skylights. Press E (or the orange button) at the piano to play the opening of Für Elise, by the sofas to turn on the
  screen over the fire (Earth as it is now, turning), or at the shelves to read the first page of The War of the Worlds.
  Two doors beside the fire lead to the street, 4 m wide and 8 m tall under a sky ceiling, and across it is the master
  suite down: the bedroom, the bath with a freestanding tub, and the dressing room.
- **The tour**: *Take the tour* in the bar is a guided walk of two minutes, from the atrium through Jim's rooms (the
  piano plays, the screen shows Earth) to the garden level and the sun court. Drag, walk or press a level to take over.
- **The map**, top right: the level you are on, with the garden's sectors and the lake on L2 and Jim's rooms on L1;
  click a place to go there.
- **L5, the sun court.** A lawn with fruit trees round the pool at the foot of the column, a paved walk round it and
  causeways over the pool to the portals.

One self-contained page, `index.html`, three.js r128, no build step. The rooms behind the glass are drawn by interior
mapping (`ROOMS`, `ROOM_FS`): the ray from your eye is followed into a box behind each bay, with its lights, its walls
and the furniture standing about halfway back, so they move as rooms do when you walk past. Everything that never
moves is merged into one mesh per material (`mergeStatic`); trees, shrubs, flowers, ferns and wheat are instanced.
Light: a 4096 shadow map, the lens or the sky of lamps as the sun, and a probe of the space round you turned into
image-based light; when the probe is taken again as you walk, the new light fades in over 1.5 s (`ENVB`), as a sudden
change made the rooms flash.

Test with `python3 palace/archive/3d-demo/tools/pentagon_shot.py` (see its docstring): `?debug` exposes `window.__pent` with
`enter()`, `on(level, bearing)`, `at(level, x, z, yaw, pitch)`, `look(yaw, pitch)`, `step(n)` and `ev("js")`.

`RES` builds the residence in (a, u) coordinates (a out from the centre, square to side 1; u along it), with the
Crown's furniture kit; `RES.walkable` and its `BLOCK` list decide where you can walk, and its shell casts shadows only
when you are not on L2 (it lies over the garden's sky). `ACTS` are the things to do; the TV renders a small scene of
Earth into a texture.

Not yet: the rest of L1 and the rooms of L3, L4 and L5 (they are seen through the glass), the stair cores in the
corners, and the stream's falls.
