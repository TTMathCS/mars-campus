# TTMath on Mars: Requirements

Demo 1 of [Mars Campus](../README.md) · live at https://ttmathcs.github.io/mars-campus/ttmath/ · owner: Jim

This file is the source of truth for this demo. Each demo in the repo keeps its own `REQUIREMENTS.md` in its folder.

## 1. Vision and scope

An imagined TTMath campus on Mars. The visitor stands on real NASA terrain at Dingo Gap in Gale Crater, looks around, walks, and discovers the campus just over the ridge. The goal is fun, an impressive look and a real feeling, not scientific accuracy. It can be "the planet in my imagination". Every requirement has an ID (for example `FR-3`) so it can be referenced, changed or retired later.

- **In scope:** real Mars ground, first-person look and walk, a sunset scene and other scenes, the campus, desktop and phone.
- **Out of scope for now:** entering the buildings, multiplayer, VR headsets.
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

The campus is the heart of the demo. Direction from Jim, 2026-09-27: "very modern, very special buildings", "concept and dream style with curve and flying design that fit terrain of Mars", "not a real-life building", and much closer than the first version, which sat about 200 m away. The 590 Alden Rd photo is not a reference any more.

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| CP-1 | Hidden from the start point; comes into view after about 5 m of walking up the ridge (checked by line of sight against the real terrain) | Must | Done in v0.4; redo for v0.5 |
| CP-2 | Dream-style, curved, "flying" architecture that grows out of the Mars terrain: no boxes, no copy of a real building | Must | In progress (v0.5) |
| CP-3 | Close: the nearest building about 30 m past the ridge top, the whole campus within about 100 m of the start | Must | In progress (v0.5) |
| CP-4 | TTMath logo as glowing signs: on the main building and on a sign by the path | Must | Done in v0.4; redo for v0.5 |
| CP-5 | Lights that look impressive at sunset and twilight: glowing glass, light lines on the building edges, light on the ground around it | Must | Done in v0.4; redo for v0.5 |
| CP-6 | Rovers and flying craft instead of cars; one craft flying around the campus | Should | Done in v0.4; keep in v0.5 |
| CP-7 | Blends in: Mars dust on ledges and at the base, same sky light and haze as the terrain | Must | Done |
| CP-8 | Footprints lead from the start up the ridge toward the campus | Should | Done |
| CP-9 | No distracting objects, and nothing cartoonish; the blue guide-light posts were removed in v0.4.1 | Must | Done (v0.4.1) |
| CP-10 | "Discovered" message, a floating label with distance, and a compass marker once the campus is seen | Should | Done |
| CP-11 | Walking bumps into the buildings instead of through them | Should | Done in v0.4; redo for v0.5 |

### Design concept for v0.5

Everything sits in the ridge's "shadow" as seen from the start. That shadow is shallow near the ridge and deeper farther away, so the buildings are low where they are near you and rise as they go away:

- **Wing Hall (main building):** a white roof shaped like a wing. Its nose is about 30 m past the ridge top, low and pointing at you. The two wings sweep back and curve up at the tips, floating off the ground like a bird taking off. Under the middle sits a glowing glass hall with the entrance and the TTMath logo. Blue light lines trace the wing's edges.
- **Floating landing ring:** a ring-shaped landing pad that hovers above the ground behind the hall, with a light beam under it. A flying craft is parked on it and another circles the campus.
- **Sky pods:** two hovering glass pods behind the wing tips, glowing inside, linked to the hall by curved glass sky bridges.
- **Logo sign:** a low curved sign with the glowing TTMath logo beside the path, just past the ridge.
- **Rovers:** parked under the left wing's overhang on glowing charging bays.

Measured limits from the start point (height a building can have and still be hidden): about 3 to 4 m at 30 to 35 m out, 5 to 7 m at 40 to 45 m, 7 to 9 m at 50 to 60 m, 9 to 12 m at 70 to 90 m, in the sector from bearing 310° to 340°.

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
- **Mobile:** touch layout chosen by pointer type; lower resolution and fewer effect samples on phones; adaptive quality.

## 9. Open questions

- [x] Which Mars site? Dingo Gap, Gale Crater (Curiosity, sol 528)
- [x] Science accuracy or fun? Fun, impressive and real-feeling
- [x] Keep the Alden Rd look? No: dream-style, curved, flying design
- [ ] Check smoothness and memory on a real iPhone (older models may need lighter settings)
- [ ] Should visitors be able to enter a building (lobby or classroom)?
- [ ] Add a second site (Jezero Crater)?

## 10. Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-09-27 | v0.5 (in progress) | New campus: Wing Hall, floating landing ring, sky pods, logo sign; much closer; brighter |
| 2026-09-27 | v0.4.1 | Published on GitHub Pages with auto-deploy; fixed flashing while walking; removed the guide-light posts; brighter exposure |
| 2026-09-27 | v0.4 | Renamed TTMath Mars Campus; campus hidden over the ridge with lights, pad, rovers, flying craft; footprint trail; iPhone layout with joystick; welcome card |
| 2026-09-27 | v0.3 | Physical sky, true-size Sun, twilight with Earth, Phobos, clouds and sun rays; simulated 3D surroundings; texture artifacts cleaned |
| 2026-09-26 | v0.2 | Real NASA terrain (Dingo Gap, Gale Crater); stronger look-around; data sources |
| 2026-09-26 | v0.1 | Initial requirements |
