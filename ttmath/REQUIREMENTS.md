# TTMath on Mars: Requirements

Demo 1 of [Mars Campus](../README.md) · live at https://ttmathcs.github.io/mars-campus/ttmath/ · owner: Jim

This file is the source of truth for this demo. Each demo in the repo keeps its own `REQUIREMENTS.md` in its folder.

## 1. Vision and scope

An imagined TTMath campus on Mars. The visitor stands on real NASA terrain at Dingo Gap in Gale Crater, looks around, walks, discovers the campus just over the ridge, and walks into its Math Palace. The goal is fun, an impressive look and a real feeling, not scientific accuracy. It can be "the planet in my imagination". Every requirement has an ID (for example `FR-3`) so it can be referenced, changed or retired later.

- **In scope:** real Mars ground, first-person look and walk, a sunset scene and other scenes, the campus, walking inside the Math Palace, desktop and phone.
- **Out of scope for now:** entering the Dune Shells, multiplayer, VR headsets.
- **Priority key:** Must = the demo fails without it · Should = expected · Could = nice to have.

## 2. Core functional requirements

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-1 | Ground around the start is real Mars data: NASA JPL 3D mesh of Dingo Gap, about 260 × 260 m | Must | Done |
| FR-2 | Real photo texture from the rover cameras, with holes and smears cleaned and fine sand detail added | Must | Done |
| FR-3 | Viewer stands at eye height (about 1.7 m) on the ground surface | Must | Done |
| FR-4 | Rotate 360° and look up and down: drag, arrow keys, on-screen pad | Must | Done |
| FR-5 | Simulated 3D surroundings beyond the real data, in the same style: plains, dunes, mesas, layered mountain, crater rim | Must | Done |
| FR-6 | Site is configurable; next candidate is Jezero Crater | Should | Planned |
| FR-7 | Walk anywhere, including off the real data onto the simulated land; jump in Mars gravity | Should | Done |
| FR-8 | Zoom / field of view (scroll, pinch, + and -) | Could | Done |
| FR-9 | Title bar says TTMath Mars Campus, the site and the current scene | Must | Done |
| FR-10 | Auto-rotate: slow hands-free 360° pan | Should | Done |
| FR-11 | Compass tape with Sun and campus markers | Should | Done |
| FR-12 | Mouse-look (pointer lock) and full screen on desktop | Could | Done |
| FR-13 | Wind and footstep sound, with a sound toggle | Could | Done |

## 3. Scene system

A scene is a named preset of sky, lighting and atmosphere on the same terrain, so a new scene is a new config, not new code.

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| SC-1 | Each scene is one config (name, time of day, Sun position, sky colours, haze, light) | Must | Done |
| SC-2 | The app opens on a default scene (Sunset) | Must | Done |
| SC-3 | Switch scenes from a simple menu | Should | Done |
| SC-4 | Scene changes fade smoothly over about 1 to 2 s | Could | Done |
| SC-5 | Time-of-day slider moves the Sun | Could | Done |

## 4. Scene 1: Martian sunset

A sunset as it looks on Mars: a cool blue glow around the Sun fading into a dusty butterscotch sky, not an Earth-style orange sunset.

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| SS-1 | Sun drawn at its true Mars size (0.35°) with camera glare | Must | Done |
| SS-2 | Blue halo around the Sun, butterscotch sky elsewhere, from one scattering model | Must | Done |
| SS-3 | Low sunlight with long shadows on the terrain, buildings and vehicles | Must | Done |
| SS-4 | Dusty haze that takes the sky's colour with distance | Must | Done |
| SS-5 | Time bar with play: afternoon through sunset into twilight | Should | Done |
| SS-6 | Twilight: stars, Earth and Moon as evening stars, Phobos and Deimos, meteors | Could | Done |
| SS-7 | Earth-style sunset for comparison | Could | Done |
| SS-8 | Sun rays through ridges and clouds; thin clouds that keep glowing after sunset | Could | Done |
| SS-9 | Drifting dust that sparkles when looking toward the Sun | Could | Done |
| SS-10 | Bright and impressive, not a dark scene: higher exposure, lighter vignette | Must | In progress (v0.4.1 brighter; more with v0.5) |
| SS-11 | No flashing while walking: Sun glow and rays stay steady | Must | Done (v0.4.1) |

## 5. TTMath campus

The campus is the heart of the demo. Direction from Jim, 2026-09-27: "very modern, very special buildings", "concept and dream style with curve and flying design that fit terrain of Mars", "not a real-life building", and much closer than the first version, which sat about 200 m away. The 590 Alden Rd photo is not a reference any more. Direction from Jim, 2026-09-28: "make the building much bigger", "like huge palace", "I can walk in and go around", "the best interior design and decoration", with "trivial things and topics related to math".

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| CP-1 | Hidden from the start point; comes into view after about 5 m of walking up the ridge (checked by line of sight against the real terrain) | Must | Done (v0.6: nothing visible from the start; smallest clearance 0.3 m at the logo sign, 0.6 m or more for everything new) |
| CP-2 | Dream-style, curved, "flying" architecture that grows out of the Mars terrain: no boxes, no copy of a real building | Must | Done (v0.6): Dune Shells along an avenue and the Math Palace |
| CP-3 | Close: the first buildings about 30 m past the ridge top; only the huge palace sits farther out, because its height has to stay below the ridge line | Must | Done (v0.6): shells 41 to 80 m from the start, palace door about 90 m |
| CP-4 | TTMath logo as glowing signs: on the main building and on a sign by the path | Must | Done (v0.6): logo crest over the palace door, logo wall by the path, logo inside the rotunda |
| CP-5 | Lights that look impressive at sunset and twilight: glowing glass, light lines on the building edges, light on the ground around it | Must | Done (v0.5): lit interiors seen through the glass, light lines on every arch, light pools on the ground |
| CP-6 | Rovers and flying craft instead of cars; one craft flying around the campus | Should | Done (v0.5): rovers on glowing charging bays, a craft parked on the floating ring, one circling |
| CP-7 | Blends in: Mars dust on ledges and at the base, same sky light and haze as the terrain | Must | Done |
| CP-8 | Footprints lead from the start up the ridge toward the campus | Should | Done |
| CP-9 | No distracting objects, and nothing cartoonish; the blue guide-light posts were removed in v0.4.1 | Must | Done (v0.4.1) |
| CP-10 | "Discovered" message, a floating label with distance, and a compass marker once the campus is seen | Should | Done |
| CP-11 | Walking bumps into the buildings instead of through them | Should | Done (v0.5) |
| CP-12 | Glass looks real: see-through lit rooms with ceilings, floors and walls behind the panes | Should | Done (v0.5) |
| CP-13 | A huge main building: the Math Palace, a glass dome 56 m across and 15 m high over a rotunda sunk 10 m into the ground (25 m high inside) | Must | Done (v0.6) |
| CP-14 | Walk in and go around: entrance vault, balcony ring, two grand stairs down to the rotunda floor; walls, rails and ledges stop you; footsteps echo inside | Must | Done (v0.6) |
| CP-15 | Palace-grade interior: marble walls and pilasters, gold rails and frames, twelve crystal lanterns, a lit dome lattice, a polished floor, benches | Must | Done (v0.6) |
| CP-16 | Math trivia everywhere: 12 lit exhibit panels, symbol medallions, an equation frieze, a ring of 465 digits of pi, a Penrose tiled floor, a golden-angle sunflower, a dome of 21 + 34 Fibonacci spiral ribs, avenue lights at Fibonacci distances, the five Platonic solids with V − E + F plaques, a golden Moebius strip, a Foucault pendulum (16 s swing in Mars gravity), welcome panels that point out the math in the building | Should | Done (v0.6) |
| CP-17 | Light that works in every scene: the eye adapts when you walk in; the palace glows at twilight without washing out; sunlight throws the lattice's shadow in daylight | Should | Done (v0.6) |

### Design concept (v0.6)

Everything sits in the ridge's "shadow" as seen from the start. That shadow is shallow near the ridge and deeper farther away, so the buildings are low where they are near you and rise as they go away.

- **Avenue:** from the plaza at the foot of the ridge, a paved avenue runs about 50 m straight to the palace door. Its light studs sit 1, 2, 3, 5, 8, 13, 21 and 34 m from the door.
- **Dune Shells:** four white shells line the avenue, two on each side, growing from 4.4 m to 6.8 m as they near the palace. Each leans toward the avenue with a light line along its crest and warm lit rooms behind its glass.
- **Math Palace (main building):** a glass dome 56 m across and 15 m high on a white ring with a blue light line. Its lattice follows the seed spirals of a sunflower: 21 ribs wind one way and 34 the other, each at a constant angle, so the cells stay square as they shrink toward a gold oculus crown. A flared entrance vault with a glowing arch and the TTMath logo crest leads in.
- **Inside:** the vault opens onto a balcony ring with marble balusters. The rotunda floor lies 10 m below, reached by two cantilevered grand stairs that curve down along the wall, with gold rails and a light under every step. The wall is warm Siena marble with ivory pilasters and gold capitals. Twelve lit exhibit panels, each under a gold medallion with a glowing symbol, run round the back half; above them an equation frieze, a gold cornice and a ring of 465 digits of pi. The floor is a Penrose tiling in two marbles with a sunflower of 1,600 gold seeds at the centre, a degree ring and the palace name round the edge. A 24 m Foucault pendulum hangs from the oculus through a floating golden Moebius strip; the five Platonic solids turn above marble pedestals with V − E + F plaques; twelve icosahedral crystal lanterns hang from the dome, and uplights wash its ribs.
- **Landing ring:** floats beside the forecourt with a craft parked on it and two rovers docked under it on glowing charging bays.
- **Sky pod:** a hovering glass pod beside the forecourt, joined to a shell by a curved glass bridge.
- **Flying craft:** circles the palace dome, lower at the sides where the ridge hides less.
- **Logo sign:** a low curved wall with the glowing TTMath logo beside the path, just past the ridge.
- The Wing Hall option of v0.5 was retired: the avenue now runs where it stood.

Measured limits from the start point (height a building can have and still be hidden): about 3 to 4 m at 30 to 35 m out, 5 to 7 m at 40 to 45 m, 7 to 9 m at 50 to 60 m, 9 to 12 m at 70 to 90 m and 12 to 19 m at 100 to 130 m, in the sector from bearing 310° to 340°.

## 6. Mobile and iPhone

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| MB-1 | Fits iPhone screens: safe areas, compact title bar, no page scrolling or zooming | Must | Done |
| MB-2 | MOVE joystick (bottom left) to walk; drag anywhere to look; pinch to zoom | Must | Done |
| MB-3 | JUMP and SUN buttons; menu with scenes, time of day, sound, auto-rotate, about | Should | Done |
| MB-4 | Welcome card explaining how to look, walk and find the campus; the joystick pulses until first use | Must | Done |
| MB-5 | Lighter settings on phones (resolution, shadows, rays) plus automatic quality scaling | Should | Done |
| MB-6 | Verified on a real iPhone | Must | To test (now possible with the public link) |

## 7. Non-functional requirements

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| NF-1 | Runs in a modern browser (Chrome, Edge, Firefox, Safari) with no plugins | Must | Done |
| NF-2 | Holds 30 fps or better on a typical laptop; target 60 fps | Must | To verify on real hardware |
| NF-3 | First scene visible within about 5 s on a normal connection | Should | To verify |
| NF-4 | Works on tablets and phones with touch controls | Should | Done |
| NF-5 | Controls are easy to discover: a short on-screen hint | Should | Done |
| NF-6 | Data sources and credits in an About panel | Should | Done |
| NF-7 | Scene configs and terrain data are separate from code | Must | Done |
| NF-8 | Public link on GitHub Pages; every push to `main` republishes automatically | Must | Done (2026-09-27) |

## 8. Technical approach and data sources

| Source | What it provides | Use |
| --- | --- | --- |
| [NASA-AMMOS 3DTilesSampleData: msl-dingo-gap](https://github.com/NASA-AMMOS/3DTilesSampleData) | Textured 3D terrain of Dingo Gap, built with JPL's [Landform](https://github.com/NASA-AMMOS/Landform) pipeline from MSL cameras and HiRISE | The real ground (FR-1, FR-2) |
| Same repo: m20-drive-1004 | Perseverance tilesets in Jezero Crater | Candidate second site (FR-6) |
| [HiRISE DTMs](https://www.uahirise.org/hiwish/maps/dtms.jsp) | About 1 m/pixel elevation models from orbit | Candidate for km-scale terrain |

- **Rendering:** Three.js r128 (WebGL2), one shared sky-scattering model, HDR-style post-processing (bloom, sun rays, filmic tone map), a shadow map near the start and campus, height-map shadows for distant terrain.
- **Real data:** 493 of the 5,150 terrain tiles (about 18 MB), converted to y-up; texture holes inpainted with OpenCV. Stored once in `../data/` and shared by every demo.
- **Simulated land:** procedural polar-grid terrain out to about 17 km, blended into the real edge, textured with patches cut from the real photos.
- **Campus:** built in code from curved parametric surfaces with one material shader (glass, white shell, light lines, logo, dust). Hidden-from-start placement checked with a line-of-sight analysis of a 0.5 m height raster of the real mesh.
- **Math Palace:** the terrain has a hole cut for the rotunda (in the terrain shaders and the shadow map). The interior is one mesh with light baked per vertex from about 110 light sources, plus lantern highlights on polished surfaces and sunlight through the lattice from the shadow map. Floor, exhibits, frieze, digits and plaques are drawn in code on canvases (the Penrose tiling by Robinson-triangle deflation, pi by Machin's formula). The dome glass is drawn in two sorted layers so the interior shows through. Walking uses levels (balcony, stairs, floor) with ledges and rails that stop you, and the exposure adapts as you enter.
- **Mobile:** touch layout chosen by pointer type; lower resolution and fewer effect samples on phones; adaptive quality.

## 9. Open questions

- [x] Which Mars site? Dingo Gap, Gale Crater (Curiosity, sol 528)
- [x] Science accuracy or fun? Fun, impressive and real-feeling
- [x] Keep the Alden Rd look? No: dream-style, curved, flying design
- [ ] Check smoothness and memory on a real iPhone (older models may need lighter settings)
- [x] Should visitors be able to enter a building? Yes: the Math Palace (v0.6)
- [ ] Enter the Dune Shells too (classrooms)?
- [ ] Add a second site (Jezero Crater)?

## 10. Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-09-28 | v0.6 | Math Palace: a huge walk-in glass dome with a Fibonacci spiral lattice at the end of a new avenue; balcony, grand stairs and a rotunda of math exhibits, Penrose floor, sunflower medallion, ring of pi, Foucault pendulum, golden Moebius strip and Platonic solids; shells moved to line the avenue; landing ring and rovers moved beside the forecourt; craft circles the dome; Wing Hall option retired |
| 2026-09-27 | v0.5 | New campus: Dune Shells with lit glass interiors, floating landing ring, sky pods and bridges, logo sign; 4 to 5 times closer; Wing Hall option (`?design=wing`) |
| 2026-09-27 | v0.4.1 | Published on GitHub Pages with auto-deploy; fixed flashing while walking; removed the guide-light posts; brighter exposure |
| 2026-09-27 | v0.4 | Renamed TTMath Mars Campus; campus hidden over the ridge with lights, pad, rovers, flying craft; footprint trail; iPhone layout with joystick; welcome card |
| 2026-09-27 | v0.3 | Physical sky, true-size Sun, twilight with Earth, Phobos, clouds and sun rays; simulated 3D surroundings; texture artifacts cleaned |
| 2026-09-26 | v0.2 | Real NASA terrain (Dingo Gap, Gale Crater); stronger look-around; data sources |
| 2026-09-26 | v0.1 | Initial requirements |
