# Arcadia Palace: Requirements

Demo 2 of [Mars Campus](../README.md) · live at https://ttmathcs.github.io/mars-campus/palace/ · owner: Jim

This file is the source of truth for this demo. It collects what was asked for in the design rounds
so far. Every requirement has an ID so it can be referenced, changed or retired later.

> **Status, 1 Oct 2026: design book in progress, 3D build paused.** Jim found the palace below "far from
> satisfactory" and asked to start again. Round 3 (section 10) replaces it. Jim approved the Rev B floor plans
> (https://ttmathcs.github.io/mars-campus/palace/plans/) with "Approve. Go". Phase 1 (the landscape, the spaceport
> and the flight to the Crown) was built in `palace/src/` until Jim paused it on 30 Sep 2026 to finish the design
> first. Round 4 (section 11) is the design book at https://ttmathcs.github.io/mars-campus/palace/design/.
> Sections 2 to 9 describe the current palace, which stays live until the new demo replaces it at the same link.

## 1. Vision and scope

A private retirement palace on Mars, built for one person to live in, not for business. It is bigger
than the TTMath campus in demo 1, futuristic, luxurious and full of detail, with many rooms. The visitor
arrives the way a resident would: a ship lands at a spaceport, an air taxi flies them home, the house
recognises them at the door, and then they walk in to explore, read, watch TV and enjoy life on Mars.
Because Mars weather is harsh, most of the house is underground.

- **Site:** a mesa rim above Arcadia Planitia, 44.2° N, facing a canyon to the west. The landscape is
  procedural; unlike demo 1 it does not use the NASA Dingo Gap tiles.
- **Look:** real materials, never cartoon style. "Real is so important. I want everything to be so impressive."
- **Priority key:** Must = the demo fails without it · Should = expected · Could = nice to have.

## 2. The palace above ground (round 1)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| PA-1 | Futuristic luxury palace, bigger than the TTMath campus | Must | Done: about 10,800 m² above ground |
| PA-2 | Many rooms, each detailed: living room, bedroom, bath, study, dining, kitchen, library, cellar, pool, sauna, gym, guest suites, gardens, hangar | Must | Done: 26 surface tour stops |
| PA-3 | Great Dome as the living room: conversation pit, plasma hearth, piano, bar, mezzanine, meteorite mobile, garden and fountain | Must | Done |
| PA-4 | Built for Mars: buried wings, shielded bedroom, storm shelter, own water, air and power | Should | Done |
| PA-5 | Guided tour, free walking, cutaway and floor plan | Must | Done |
| PA-6 | Mars clock: sunrise, noon, blue sunset, night, dust storm | Should | Done |

## 3. The journey (round 2)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| JR-1 | Start at a transport centre where rockets land | Must | Done: Arcadia Spaceport, 1.4 km east, three pads, terminal, tower |
| JR-2 | Watch a rocket land | Should | Done: steel ship lands on its engines |
| JR-3 | Board a futuristic flying transport; an animation flies you to the palace | Must | Done: four-fan air taxi, cockpit and chase views, live flight display |
| JR-4 | When you step out, the flying machine flies back | Must | Done |
| JR-5 | Finish the journey on foot and discover the palace | Must | Done: land at the Gatehouse pad, walk to the door |
| JR-6 | The journey can be skipped | Should | Done: Esc or Skip |

## 4. The door (round 2)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| DR-1 | The house is private: the door is not public | Must | Done |
| DR-2 | It unlocks automatically by key or future authentication | Must | Done: face, iris and gait scan, then the doors open inside a ring of light |
| DR-3 | Airlock between outside and inside | Should | Done: pressurise and depressurise cycle, glass inner doors |

## 5. Living inside (round 2)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| LV-1 | Walk around inside the house | Must | Done |
| LV-2 | TV room: watch TV | Must | Done: four channels (Earth live, palace cameras, Mars weather, night sky); sit on the sofa to watch |
| LV-3 | Book room: read books | Must | Done: two-storey library, readable books |
| LV-4 | Other things to use: piano, lifts, rain room, cinema | Could | Done |

## 6. The Deep: underground expansion (round 2)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| DP-1 | Keep the existing luxury structure above ground | Must | Done |
| DP-2 | Much more underground, about 10 times bigger | Must | Done: about 115,000 m² below ground, 10.7 times the surface |
| DP-3 | "All crazy ideas and future-proof tech" | Must | Done: see the five levels below |
| DP-4 | L1 Salon (−14 m): media lounge, cinema, grand library, music room, holodeck, jazz bar, Sky Hall, sculpture court, thermal baths, sports hall | Must | Done |
| DP-5 | L2 Grotto (−40 m): lagoon, beach, palms, waterfall, hot springs under an LED sky | Should | Done |
| DP-6 | L3 Living Earth (−64 m): forest with a stream, rain room, vertical farms | Should | Done |
| DP-7 | L4 Engine (−88 m): fusion plant, robot fabrication, water and air works, AI core, seed vault and medical bay | Should | Done |
| DP-8 | L5 Transit (−104 m): maglev to the spaceport, storm reserves | Should | Done |
| DP-9 | A 104 m atrium with glass lifts to every level | Must | Done |

## 7. Look and feel

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| LK-1 | Real materials, not cartoon: wood grain, marble, leather, fabric, brushed metal, rock, sand, bark | Must | Done: procedural PBR textures |
| LK-2 | Realistic light: HDR, film tone curve, bloom, reflections from the sky and rooms, a sun in each cavern | Must | Done |
| LK-3 | Impressive on arrival and in every room | Must | In progress: see known gaps |
| LK-4 | Works on a phone | Should | Done: tested portrait and landscape |

## 8. Known gaps

- The sunset loggia and observatory glare at the default late-afternoon time.
- The rocket's exhaust flame and dust cloud are faint.
- The sports hall and holodeck are plainer than the other rooms.
- Frame rate has only been checked in a headless software renderer, not on a real graphics card.
  The heaviest view draws about 1 million triangles in 212 calls.

## 9. How it is built

- `src/` holds the source, split by part: `a_head.html` (page and UI), `b_core.js` (renderer, sky,
  terrain, materials), `c_tex.js` (procedural textures), `c_build.js` (furniture), `d_*.js` (palace,
  gatehouse, the Deep, stops, spaceport), `e*.js` (HDR pipeline, world, journey, UI and frame loop).
- `./build.sh` joins them into `index.html`. `./build.sh debug` writes `palace-debug.html` with test hooks.
- `tools/` has headless Playwright scripts for screenshots (`shot.js`), probes (`probe.js`) and contact
  sheets (`grid.js`).
- The same page is also published as a private Claude artifact: https://claude.ai/artifact/BbTsfVb3svKSs8Er7un1W2

## 10. Round 3: the redesign (plans in review)

Direction from Jim, 29 Sep 2026: start from the beginning. "Future-proof, the bravest designs." "Before
you jump into details, show me the plans." "I like the pentagon shape solid design underground, and above
the ground I like most future proof design, not necessary glasses due to strong sun lights." "Above the
ground design doesn't need to be pentagon shape … like what you can imagine in the dream", "only exist in
dreams design". The spaceport is "30 km east of your house", and "when the flying pod carry me to my house I
need impressive video to show the flight on the way". A small city will grow from the house.

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| RD-1 | Start again; the new demo replaces the current palace at the same link | Must | Agreed |
| RD-2 | Show the floor plans before building any detail | Must | Done: plans Rev A at `palace/plans/` |
| RD-3 | Above ground: the most future-proof, dream-like design; not a pentagon; no big glass because of the strong sun | Must | Proposed: the Crown, a solid white ring 280 m across floating 40 m up on five legs, with five points rising to 66 m and narrow window slots |
| RD-4 | The part above ground is much bigger than the TTMath campus | Must | Proposed: about 20,900 m², 6 times the campus |
| RD-5 | Most of the house underground because of the weather: 10 times the surface | Must | Proposed: about 209,700 m², 10.0 times the Crown |
| RD-6 | Underground: a solid pentagon | Must | Proposed: the Pentagon, 160 m sides, five levels from 24 m to 68 m down, five rings and five sectors around an atrium |
| RD-7 | A rocket transportation centre where Earth–Mars ships land, 30 km east of the house | Must | Proposed: Arcadia Spaceport, three pads, terminal, fuel plant, pod station |
| RD-8 | A flying pod carries Jim home, with an impressive video of the flight | Must | Proposed: 37 km scenic route, about 4 min 30 s, nine shots |
| RD-9 | Phase 1 is the spaceport and the house; then more houses, a city and connections | Should | Proposed: homes added on a sunflower spiral, phases 1 to 4 |

Jim's answers to the plans Rev A, 30 Sep 2026: "even wilder"; "master suites one up and one down"; add a
"warm hole transformation device which can transfer me to anytime any space"; "Arrival land on sunset, but
animation can go through mar storm etc."; "keep all the progress in the repo, so I can switch account or ai to
continue there". He also asked how the Crown can float: "is it supported by anti gravity device?", and then
chose: "use anti gravity. No elevator. From crown to underground is by use warm hole or any transmission device."

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| RD-10 | Above ground even wilder, "only exist in dreams" | Must | Rev B: the mirror Orb floats over the Sun Well, the five points are spires to +90 m, the ring is 16 m wide |
| RD-11 | Two master suites, one up in the Crown and one down in the Pentagon | Must | Rev B: "Master suite up" in the Crown's SE dip, "Master suite down" on L1 sector 1 |
| RD-12 | A wormhole device that takes Jim to any time and any place | Must | Rev B: the Wormhole Gate hall on the Orb's +72 floor |
| RD-13 | Land at sunset; the flight video can pass through a Mars dust storm and more | Must | Rev B: storm wall after the Ice Cliffs, breakout into the sunset with Phobos crossing the sun, then into the hangar; 10 shots, about 4 min 40 s |
| RD-15 | The Crown floats on anti-gravity; no legs | Must | Rev B: an anti-gravity drive in each spire; nothing touches the ground |
| RD-16 | No elevators; the Crown and the underground are linked by wormhole or another transmission device | Must | Rev B: portals in the five spires, the Orb, the Pentagon's corner cores and a portal column in the atrium; stairs only between Pentagon levels |
| RD-14 | Keep all progress in the repo so another account or AI can continue | Must | Done: `HANDOFF.md`, demo 1 sources in `ttmath/src/`, tests in `ttmath/tools/`, plans in `palace/plans/` |

Rev B numbers: Crown 20,100 m² (ring 13,070 including the Glide, upper floors 3,630, Orb 3,370); Pentagon
209,700 m², 10.4 times the Crown. Rev B approved 30 Sep 2026. Open for Jim: where the Wormhole Gate should take
him in the demo (for example the TTMath campus in demo 1).

## 11. Round 4: the design book (in progress)

Direction from Jim, 30 Sep 2026: "before the detailed html implementation, I really like to put efforts on the design
and figure out all the plans. I need you to organize those plans well, including all the plans like: architecure,
interior, power station design, transportation design/etc with details on its outlook/how it works ... we need to
finish this before we move the impelmentation." And: "in the design doc, I need full map of mars, terrain and space
maps. also mark where are the city/my house/spaceport are located ... better like google earth design so that we can
zoom in/out to find overall."

On 1 Oct 2026, answering where the Wormhole Gate should take him: "I don't know because you have the crystal ball in
the middle. And what I'm thinking is actually I need something like 3D projector to project the center of the dome.
Because that's project the whole universe. For example, I can zoom in, zoom out to find a certain space in the
universe. For example, solar systems ... But I don't know where to put the ball. So let's say I need some plan to
figure it out."

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| DB-1 | Design and document every plan before more 3D work: what each part looks like and how it works | Must | In progress: `palace/design/`, chapters 01–07 done (site and city, the Crown, the Pentagon, interiors, power, transportation, the spaceport); 08 life support, 09 communications and space, 10 building it still to write |
| DB-2 | A full map of Mars with terrain and space, the house, the spaceport and the city marked, zoomable like Google Earth | Must | Done: the Mars Atlas, `palace/design/atlas/` |
| DB-3 | Real science and engineering with worked numbers; dreams marked as future technology with a real fallback | Must | Done in every chapter so far |
| DB-4 | A 3D projection of the whole universe, zoomable down to a solar system and a place, at the centre of a dome, to choose where the Wormhole Gate goes | Must | Proposed 1 Oct 2026, waiting for Jim's OK: an 8 m ball of light at the centre of the Orb (+72 m) with three open balconies (+64 portal ring, +72 Gate bridge, +80 gallery) and the inner shell as a sky screen. See HANDOFF.md section 2 |
| DB-5 | Publish to the GitHub repo and the live site, not as a chat artifact | Must | Done |

