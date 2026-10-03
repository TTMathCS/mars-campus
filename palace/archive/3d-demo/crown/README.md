# The Crown · demo 2, phase 2

**[Demo 2 home](../../../README.md) · [Requirements](../../../REQUIREMENTS.md) · [Decisions](../../../docs/decisions.md) · [Design](../../../docs/design/README.md) · [Rooms](../../../docs/rooms.md) · [Floor plans](../../../docs/archive/plans-rev-b.md) · [Pictures](../../../docs/gallery.md)**

Live at **https://ttmathcs.github.io/mars-campus/palace/crown/**. The Crown's main floor at +41 m, as in chapter 02
and the floor plans:

- **Arrival.** You start in the pod hangar beside the pod. The Door, a round opening 5 m across closed by an iris of
  light, recognises you and opens; you walk through into the Arrival hall.
- **The ring.** 16 m wide with 3 m walls, so the floor is 10 m wide (125 to 135 m from the centre). The **Glide**, a
  moving walkway 3.5 m wide, runs along the garden side and carries you clockwise when you stand on it. The rooms run
  along the outer wall: ten parts of 36°, 30 rooms, each furnished (chapter 04's materials: linen, olive and walnut,
  polished basalt, bronze, moss).
- **Light.** Window slots 1.2 m tall at +44 m through both walls; the sun comes through them as blades of light. Five
  times of day: sunrise, noon, sunset (the default, as you land), night and a dust storm. Bounce light comes from a
  probe of the room round you.
- **The map**, top right: the ring and its parts; click one to glide there.
- **Portals** in the five spires (bronze rings, "UP TO THE ORB") take you to the Orb.

One self-contained page, `index.html`, three.js r128. Shadows are a 4096 map that follows you; the probe is a cube
camera turned into image-based light every 14 m; each new one fades in over 1.5 s (`ENVB`), as a sudden swap made the
rooms flash. Test with `python3 palace/archive/3d-demo/tools/crown_in_shot.py` (see its docstring).
