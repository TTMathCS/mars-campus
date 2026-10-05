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
| SS-11 | No flashing while walking: Sun glow and rays stay steady; signs and logos stay steady (Jim, 4 Oct 2026: "TTMath logo in front of the door flashes when I walk to the building") | Must | Done (v0.4.1; signs v0.7.1: 24-bit depth) |

## 5. TTMath campus

The campus is the heart of the demo. Direction from Jim, 2026-09-27: "very modern, very special buildings", "concept and dream style with curve and flying design that fit terrain of Mars", "not a real-life building", and much closer than the first version, which sat about 200 m away. The 590 Alden Rd photo is not a reference any more. Direction from Jim, 2026-09-28: "make the building much bigger", "like huge palace", "I can walk in and go around", "the best interior design and decoration", with "trivial things and topics related to math". Feedback from Jim, 2026-09-29, on v0.6: the small rooms outside the dome "are separated and look not integrated as a whole architecture"; "there are no classrooms with desks, chairs for students, no front desk, coffee area"; the dome inside "looks obviously cartoon style, I need detailed material feeling like real material/objects"; the flying cars "look just like cartoon toys"; "overall it is like a cartoon building sitting on top of real Mars".

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| CP-1 | Hidden from the start point; comes into view after about 5 m of walking up the ridge (checked by line of sight against the real terrain) | Must | Done (v0.7: nothing visible from the start; smallest clearance 0.2 m at the logo wall, 0.6 m or more for the wings, gateway, links and rovers) |
| CP-2 | Curved, modern architecture that grows out of the Mars terrain and reads as one building: no copy of a real building | Must | Done (v0.7): the Math Palace with two curved wings, a courtyard, a gateway and glass links (see CP-18) |
| CP-3 | Close: the first buildings about 30 m past the ridge top; only the huge palace sits farther out, because its height has to stay below the ridge line | Must | Done (v0.7): gateway about 45 m from the start, courtyard 45 to 90 m, palace door about 90 m |
| CP-4 | TTMath logo as signs: on the main building and on a sign by the path | Must | Done (v0.7): logo crest over the palace door, logo wall by the path, logo in the rotunda and behind the front desk, the campus name on the gateway |
| CP-5 | Lights that look good at sunset and twilight: lit rooms behind the glass, light on the ground around the buildings | Must | Done (v0.7): light from the windows falls on the courtyard, downlights under the canopies, bollards, a lit vault and name band; the neon light lines were removed |
| CP-6 | Vehicles that look real | Should | Done (v0.7): the flying craft were removed; two pressurized six-wheel rovers (cabin with window band, suitports, a radiator on the roof; no solar panel since v0.8.1: they charge on the campus) are parked by the gateway and behind the café wing |
| CP-7 | Blends in: Mars dust on ledges and at the base, same sky light and haze as the terrain | Must | Done |
| CP-8 | Footprints lead from the start up the ridge toward the campus | Should | Done |
| CP-9 | No distracting objects, and nothing cartoonish | Must | Done (v0.7): blue guide-light posts removed in v0.4.1; floating landing ring, sky pod, bridges, flying craft and neon light lines removed in v0.7 |
| CP-10 | "Discovered" message, a floating label with distance, and a compass marker once the campus is seen | Should | Done |
| CP-11 | Walking bumps into the buildings instead of through them | Should | Done (v0.7): glass fronts, walls, furniture, rovers, bollards; doors and links are the way in |
| CP-12 | Glass looks real: see-through rooms behind the panes, reflections of the real surroundings | Should | Done (v0.7) |
| CP-13 | A huge main building: the Math Palace, a glass dome 56 m across and 15 m high over a rotunda sunk 10 m into the ground (25 m high inside) | Must | Done (v0.6) |
| CP-14 | Walk in and go around: entrance vault, balcony ring, two grand stairs down to the rotunda floor; walls, rails and ledges stop you; footsteps echo inside | Must | Done (v0.6) |
| CP-15 | Palace-grade interior in real materials: Giallo Siena marble walls in slabs with fine joints, Carrara pilasters and balusters, Verde Alpi and Nero Marquina bands, a Penrose floor in Carrara and Botticino with brass joints, polished brass rails and frames, crystal lanterns, painted steel lattice | Must | Done (v0.7) |
| CP-16 | Math trivia everywhere: 12 lit exhibit panels, symbol medallions, an equation frieze, a ring of 465 digits of pi, a Penrose tiled floor, a golden-angle sunflower, a dome of 21 + 34 Fibonacci spiral ribs, avenue lights at Fibonacci distances, the five Platonic solids with V − E + F plaques, a golden Moebius strip, a Foucault pendulum (16 s swing in Mars gravity), welcome panels that point out the math in the building | Should | Done (v0.6) |
| CP-17 | Light that works in every scene: the eye adapts when you walk in; the palace glows at twilight without washing out; sunlight throws the lattice's shadow in daylight | Should | Done (v0.6, v0.7 also in the wings) |
| CP-18 | One architecture: two long curved wings sweep out from the dome and frame a paved courtyard; a gateway with the campus name closes it; glass links join each wing to the dome and can be walked through | Must | Done (v0.7) |
| CP-19 | Real school rooms: math classroom (16 student desks and chairs, teacher desk, whiteboard lesson), coding lab (18 seats, monitors showing real code, lesson screen), seminar room, lobby with the day's timetable; Café π (espresso bar, menu board, tables), reception (curved front desk, logo wall, sofa), library and reading room (bookshelves, study tables, banker's lamps, leather armchairs) | Must | Done (v0.7) |
| CP-24 | Real details everywhere (Jim, 4 Oct 2026: "lots of scenes are not real, like class room furnitures, and big domes, woods, plants"): house plants, furniture modelled on real pieces, lived-in clutter, a dome that reads as glass and steel | Must | In progress (v0.8: plants, classroom furniture, the dome's lattice; v0.8.2: flat, level ceilings in every room, Jim 4 Oct 2026: "the roof of classes are even not straight") |
| CP-25 | The campus three times bigger (Jim, 4 Oct 2026: "expand TTMath Campus, need more buildings and spaces. expand so far to 3 times bigger"), with a parking field for flying pods "which is future proof for travel": ten buildings and spaces on the slope behind the palace, each room designed before it is built, all hidden from the start | Must | Designed (plan and rooms at `ttmath/plan/`, notes in `ttmath/docs/`); building starts with the Crescent |
| CP-26 | No power plant on the campus: it is on the grid of the city nearby (Jim, 4 Oct 2026: "no need for plant generators, since the power is supplied centrally by the city close by. free the space up for other purposes"); the solar field's place behind the classroom wing becomes the Sun court (T-16), an outdoor classroom round an armillary sundial | Must | Done (v0.8.1) |
| CP-20 | Materials that look real: physically based shading (Fresnel, roughness, sharp highlights); veined marble, brass, oak and walnut, fabric, leather, terrazzo, plaster, brushed steel, anodised aluminium, fibre-composite cladding; glass and polished surfaces reflect the real surroundings | Must | Done (v0.7) |
| CP-21 | Light that looks real: soft shadows and darker corners under furniture, where walls meet and under the canopies; daylight through the glass; traced in the background a few seconds after the page opens | Must | Done (v0.7) |
| CP-22 | Weathered outside: panel joints, Mars dust settled on ledges, streaked down walls and splashed at the base, darker ground where walls meet it | Should | Done (v0.7) |
| CP-23 | Entrances: glass sliding doors that open as you come near, steps where floors and ground differ, room plates by every door and direction signs in the foyers | Should | Done (v0.7) |

### Design concept (v0.7)

Everything sits in the ridge's "shadow" as seen from the start. That shadow is shallow near the ridge and deeper farther away, so the buildings are low where they are near you and rise as they go away.

- **One building:** the Math Palace and two wings form a single campus around a paved courtyard. The wings start beside the dome, curve outward and run 44 m toward the ridge. Their roofs are one continuous fibre-composite shell: 7.2 m high at the dome end, 4.3 m at the gateway, sweeping down to the ground at the back; the front overhangs the glass by 1.2 m as a canopy with downlights.
- **Courtyard and gateway:** basalt slabs between the wings, a granite avenue down the middle with light studs 1, 2, 3, 5, 8, 13, 21 and 34 m from the palace door, bollard lights. A slender arch spans the wings' ends with the campus name in lit letters.
- **Glass links:** a glazed barrel vault on a concrete curb from each wing's end into the dome, with aluminium ribs; the right link climbs five steps to its wing.
- **Classroom wing (right):** foyer, M1 Mathematics (whiteboard with a lesson on quadratic equations), lobby with the courtyard door and a timetable screen, coding lab, seminar room.
- **Café and library wing (left):** foyer, Café π with an espresso bar, reception with the courtyard door and a curved front desk, library, reading room.
- **Floors** follow the real ground: each room has its own level (from −0.45 to 1.0 m), with steps in the doorways and at the courtyard entrances; a concrete plinth stands up where the ground outside is higher than the floor.
- **Math Palace:** the glass dome 56 m across with the 21 + 34 Fibonacci spiral lattice, the entrance vault with the logo crest, the balcony, grand stairs and rotunda as in v0.6, now in real marble and brass.
- **Rovers:** a pressurized rover parked by the avenue at the gateway, another behind the café wing.
- **Logo wall:** the low curved wall with the TTMath logo beside the path, just past the ridge.

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
- **Campus:** built in code from curved parametric surfaces and furniture pieces, all drawn by one physically based material shader (29 materials: marble kinds, brass, woods, fabrics, leather, terrazzo, plaster, metals, composite cladding, screens, pictures). Pictures (whiteboard, code, screens, menu, book spines, plates, signs) are drawn in code into one 2048 × 2048 atlas. Hidden-from-start placement checked with a line-of-sight analysis of a 0.5 m height raster of the real mesh.
- **Light and reflections:** artificial light is baked per vertex from about 250 light sources (by zone: outside, rotunda, wings). A Web Worker then voxelizes the campus at 20 cm and traces ambient occlusion, sky visibility through the glass and shadows toward each vertex's two strongest lights, and replaces the first values about 5 s after loading. Reflections come from three cube maps captured in the scene (rotunda, a classroom, the courtyard), re-captured one at a time as the sky changes; the rotunda map is parallax-corrected.
- **Math Palace:** the terrain has a hole cut for the rotunda (in the terrain shaders and the shadow map). The interior is one mesh with light baked per vertex from about 110 light sources, plus lantern highlights on polished surfaces and sunlight through the lattice from the shadow map. Floor, exhibits, frieze, digits and plaques are drawn in code on canvases (the Penrose tiling by Robinson-triangle deflation, pi by Machin's formula). The dome glass is drawn in two sorted layers so the interior shows through. Walking uses levels (balcony, stairs, floor) with ledges and rails that stop you, and the exposure adapts as you enter.
- **Mobile:** touch layout chosen by pointer type; lower resolution and fewer effect samples on phones; adaptive quality.

## 9. Open questions

- [x] Which Mars site? Dingo Gap, Gale Crater (Curiosity, sol 528)
- [x] Science accuracy or fun? Fun, impressive and real-feeling
- [x] Keep the Alden Rd look? No: dream-style, curved, flying design
- [ ] Check smoothness and memory on a real iPhone (older models may need lighter settings)
- [x] Should visitors be able to enter a building? Yes: the Math Palace (v0.6)
- [x] Classrooms to walk into? Yes: the two wings (v0.7)
- [ ] Add a second site (Jezero Crater)?

## 10. Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-10-05 | v0.8.2 | Straight ceilings (Jim: "the roof of classes are even not straight"): every room of the wings has a flat, level ceiling instead of the curved underside of the roof shell, 3.4 m in the foyers, 3.2 m in the lobby, café and reception, 3.0 m in the classrooms (2.8 m in the library); acoustic tiles in a white steel grid in the classrooms, lab, seminar room, study and library, smooth plaster in the café, reception and foyers; where the shell comes lower near the back wall (lab, seminar room, study) a flat soffit runs along the wall behind a straight edge, clear of every door; the lights hang from the ceilings; above the ceiling line the glass shows a dark spandrel band, as on a real glass front |
| 2026-10-05 | v0.8.1 | No power plant on the campus, which is on the grid of the city nearby (Jim: "no need for plant generators, since the power is supplied centrally by the city close by. free the space up for other purposes"): the solar field behind the classroom wing is gone and its place is the Sun court (T-16), an outdoor classroom on basalt paving with an armillary sundial in weathered bronze (its rod parallel to Mars's axis at Gale crater's 5.4° S, an hour band for the day hours of the sol), five precast benches in a half-circle, an uplight for the evening and a kerbed path from the plaza round the wing; the rovers' roof solar panels are replaced by radiator panels |
| 2026-10-04 | v0.8 | More real (Jim: "lots of scenes are not real, like class room furnitures, and big domes, woods, plants"): real house plants in every room of the wings (fiddle-leaf figs, monstera, snake plants, a kentia palm, olive trees, ficus, a fern), built from leaf cards cut from a drawn leaf texture, in ceramic, terracotta and fibreglass pots; classroom desks with rounded oak tops on bent-steel sled frames, moulded shell chairs on steel legs, notebooks, books, laptops, bottles and backpacks; finer floors so shadows show under the furniture; the dome's lattice in dark bronze steel with slim mullions, so it reads as a real glass dome |
| 2026-10-04 | v0.7.1 | The logo wall, the logo crest and the gateway's name no longer flicker as you walk up (Jim: they "flash"): the scene is now drawn with a 24-bit depth buffer instead of 16-bit, so surfaces a centimetre apart stay apart |
| 2026-09-29 | v0.7 | One integrated campus: two curved wings frame a courtyard, a gateway with the campus name, glass links to the dome; real rooms (math classroom, coding lab, seminar room, lobby, Café π, reception, library, reading room) with furniture; physically based materials with real marble, brass, wood and fabric; reflections of the real surroundings; soft shadows and ambient occlusion traced in a worker; weathered, dusty exterior; realistic pressurized rovers; flying craft, landing ring, sky pod, bridges, Dune Shells and neon light lines removed |
| 2026-09-28 | v0.6 | Math Palace: a huge walk-in glass dome with a Fibonacci spiral lattice at the end of a new avenue; balcony, grand stairs and a rotunda of math exhibits, Penrose floor, sunflower medallion, ring of pi, Foucault pendulum, golden Moebius strip and Platonic solids; shells moved to line the avenue; landing ring and rovers moved beside the forecourt; craft circles the dome; Wing Hall option retired |
| 2026-09-27 | v0.5 | New campus: Dune Shells with lit glass interiors, floating landing ring, sky pods and bridges, logo sign; 4 to 5 times closer; Wing Hall option (`?design=wing`) |
| 2026-09-27 | v0.4.1 | Published on GitHub Pages with auto-deploy; fixed flashing while walking; removed the guide-light posts; brighter exposure |
| 2026-09-27 | v0.4 | Renamed TTMath Mars Campus; campus hidden over the ridge with lights, pad, rovers, flying craft; footprint trail; iPhone layout with joystick; welcome card |
| 2026-09-27 | v0.3 | Physical sky, true-size Sun, twilight with Earth, Phobos, clouds and sun rays; simulated 3D surroundings; texture artifacts cleaned |
| 2026-09-26 | v0.2 | Real NASA terrain (Dingo Gap, Gale Crater); stronger look-around; data sources |
| 2026-09-26 | v0.1 | Initial requirements |
