# Archive: the first palace (rounds 1 and 2)

[Demo 2 home](../../README.md) · [Requirements](../../REQUIREMENTS.md) · [Decision log](../decisions.md)

> **Kept for reference only.** This is the first version of demo 2, built in rounds 1 and 2 (before 29 Sep 2026).
> Jim found it "far from satisfactory" and asked to start again, so round 3 replaced it with the Crown and the
> Pentagon. On 1 Oct 2026 Jim asked for one demo 2 on the homepage, so the old palace moved to the archive:
> **[open the first palace](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/)** (the built page is
> `palace/archive/old-palace/index.html`). Its source, `palace/src_old/`, was deleted then; it stays in git history
> (restore it with `git checkout 6f2dbf3 -- palace/src_old`; its build script is in commit c2e231b).
>
> What carried over to the new design: a private house for one person, real materials and never cartoon, most of
> the house underground, a spaceport and a flight home that can be skipped, a private door that recognises Jim,
> an airlock, and everyday things to do (watch TV, read books, play the piano). See the IDs GN-1, GN-4, PG-1,
> TR-1 to TR-6, LV-1 and LV-4 to LV-6 in the [requirements](../../REQUIREMENTS.md).

The text below is the old requirements file as it stood on 1 Oct 2026, sections 1 to 9, unchanged.

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
