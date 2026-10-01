# Jim's retirement house on Mars: requirements

Demo 2 of [Mars Campus](../README.md) · owner: Jim (TTMath) · last updated 1 Oct 2026

**[Demo 2 home](README.md) · Requirements · [Decisions](docs/decisions.md) · [Design](docs/design/README.md) · [Floor plans](docs/plans.md) · [Pictures](docs/gallery.md)**

This file lists everything Jim has asked for in demo 2. Each requirement has an ID, a priority, a status and a
link to where the design answers it. It is the source of truth for the demo: when Jim asks for something new, it
goes here first.

> **Where things stand, 1 Oct 2026**
> - Floor plans **Rev B approved** by Jim on 30 Sep ("Approve. Go").
> - **Design book Rev D** is in progress, because Jim wants every plan designed before more 3D work. Chapters 01–07
>   are written. Chapters 08 Life support, 09 Communications and space, and 10 Building it are still to write.
> - **Nothing waits for an answer.** Jim answered every question on 1 Oct. The Orb's new design, the Universe Hall
>   (OR-2 to OR-6), is drawn from his answer and shown for his review.
> - **3D build paused** at phase 1 (the landscape, the spaceport and the flight video work in a test build). It
>   resumes when Jim approves the design book.

## How to read the tables

| Priority | Meaning |
| --- | --- |
| **Must** | The demo fails without it |
| **Should** | Expected |
| **Could** | Nice to have |

| Status | Meaning |
| --- | --- |
| ✅ Approved | Jim approved it (Rev B, 30 Sep 2026) |
| ☑️ Decided | Jim answered, or asked us to decide with our best judgment |
| 🟡 For review | Drawn from Jim's answer and shown for his review |
| 📐 Designed | In the design book; Jim reviews the whole book at the end |
| ⏳ To design | A design book chapter still to write |
| 🎬 Built | Works in the 3D test build (phase 1); not published yet |
| 🔧 In progress | Being worked on now |

**Ch 02** links open a design book chapter on the live site. **Summary** links open the chapter's page in this
repo, with its diagrams and pictures.

## Contents

1. [The vision and the rules](#1-the-vision-and-the-rules)
2. [Site and city](#2-site-and-city)
3. [The Crown, above ground](#3-the-crown-above-ground)
4. [The Orb and the Universe Hall](#4-the-orb-and-the-universe-hall)
5. [The Pentagon, below ground](#5-the-pentagon-below-ground)
6. [Living in the house](#6-living-in-the-house)
7. [Getting home](#7-getting-home)
8. [Systems](#8-systems)
9. [What you can do in the demo](#9-what-you-can-do-in-the-demo)
10. [Open questions](#10-open-questions): none
11. [History and old IDs](#11-history-and-old-ids)

## 1. The vision and the rules

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| GN-1 | A private retirement house on Mars for one person, Jim, not for business | Must | ✅ | [Cover](https://ttmathcs.github.io/mars-campus/palace/design/) · [Summary](docs/design/README.md) |
| GN-2 | Start again: the new demo replaces the old palace at the same link, and the homepage shows one demo 2 | Must | ✅ The old palace is archived ([page](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/), [requirements](docs/archive/old-palace.md)). `palace/` opens the design book until phase 1 is published | [Status](README.md#status) |
| GN-3 | "Future-proof, the bravest designs", "only exist in dreams", and then "even wilder" | Must | ✅ Rev B: a floating crown, a mirror Orb, portals | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html) · [Summary](docs/design/02-crown.md) |
| GN-4 | It must look real: real materials, never cartoon. "Real is so important. I want everything to be so impressive." | Must | Applies to every design, picture and 3D view | [Pictures](docs/gallery.md) |
| GN-5 | Real science and engineering with worked numbers. Dreams are marked as future technology, with a real fallback | Must | ✅ Done in every chapter | [Summary](docs/design/README.md#real-or-future) |
| GN-6 | Show the plans before building any detail, and wait for Jim's approval | Must | ✅ Rev A and Rev B shown; Rev B approved | [Floor plans](docs/plans.md) |
| GN-7 | Design and document every plan, what it looks like and how it works, before more 3D work | Must | 🔧 Chapters 01–07 written; 08–10 to write | [Design](docs/design/README.md) |
| GN-8 | Keep all progress in this GitHub repo and on the live site, never as a chat artifact, so another account or AI can continue | Must | ✅ | [HANDOFF.md](../HANDOFF.md) |
| GN-9 | Organised documents: requirements, plans and maps easy to move between, with the diagrams and pictures visible in the repo | Must | ✅ Done 1 Oct 2026: this file, [Demo 2 home](README.md) and [docs/](docs/design/README.md) | [Demo 2 home](README.md) |
| GN-10 | Use the diagrams and the rendered pictures as much as possible; every picture must look real | Must | 🔧 Diagrams exported; weak pictures being re-rendered | [Pictures](docs/gallery.md) |
| GN-11 | Works on Jim's laptop, and on a phone | Should | Design book checked at desktop and phone size | [HANDOFF.md](../HANDOFF.md) |

## 2. Site and city

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| ST-1 | The house on the plains of Arcadia Planitia, with the spaceport "30 km east of your house" | Must | ✅ | [Ch 01](https://ttmathcs.github.io/mars-campus/palace/design/site.html#corridor) · [Summary](docs/design/01-site-and-city.md) |
| ST-2 | Use the real, studied landing zone AP-1: the house at 39.80° N 201.44° E, the spaceport at 39.80° N 202.10° E | Must | ☑️ Decided 1 Oct (Jim: "do your best judgment"). Rev B's "about 44° N" is replaced | [Ch 01](https://ttmathcs.github.io/mars-campus/palace/design/site.html#why) · [Atlas](https://ttmathcs.github.io/mars-campus/palace/design/atlas/#place=house) |
| ST-3 | Phase 1 is the spaceport and the house; then more houses, a small city and connections | Should | 📐 Homes on a sunflower spiral, civic buildings on the Fibonacci seeds, four phases | [Ch 01](https://ttmathcs.github.io/mars-campus/palace/design/site.html#city) · [Summary](docs/design/01-site-and-city.md#the-city) |
| ST-4 | A full map of Mars, with terrain and space, marking the city, the house and the spaceport, zoomable "like Google Earth" | Must | ✅ The Mars Atlas | [Atlas](https://ttmathcs.github.io/mars-campus/palace/design/atlas/) · [Summary](docs/design/01-site-and-city.md#the-mars-atlas) |

## 3. The Crown, above ground

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| CR-1 | Above ground, the most future-proof, dream-like design. Not a pentagon, and no big glass because the sun is strong | Must | ✅ Rev B: the Crown, a white ceramic ring 276 m across, with window slots instead of glass walls | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#look) · [Summary](docs/design/02-crown.md) |
| CR-2 | It floats on anti-gravity: no legs, and nothing touches the ground | Must | ✅ A drive in each of the five spires, with fallback pads | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#float) · [Summary](docs/design/02-crown.md#how-it-floats) |
| CR-3 | The part above ground is much bigger than the TTMath campus | Must | ✅ 19,100 m², 5.6 times the campus (Rev D; Rev B had 20,100 m²) | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#areas) |
| CR-4 | No elevators: the Crown and the underground are linked by a wormhole or another transmission device | Must | ✅ Portals in the spires, the Orb and every Pentagon level; stairs as the real fallback | [Ch 06](https://ttmathcs.github.io/mars-campus/palace/design/transport.html#portals) · [Summary](docs/design/06-transport.md#in-the-house-portals) |

## 4. The Orb and the Universe Hall

From Jim's answer on 1 Oct 2026: *"I don't need the universe to be displayed in the ball ... I need to sit in some
rooms in the Orb, so I can see the spaces in the big circle ... I should have some switch to turn it on and off.
When I turn it on I can do 3D projection of the universe so I can zoom in and zoom out ... like a 3D dashboard. At
the corner somewhere, there's always our home planet Earth, and our current immigration planet Mars ... small icons
showing dynamic weather ... I can turn it off. I can turn it back on if I need to."*

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| OR-1 | A wormhole device that takes Jim to any time and any place | Must | ✅ Rev B: the Wormhole Gate. Rev D: on a bridge into the Universe Hall | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) · [Summary](docs/design/02-crown.md#the-orb-and-the-universe-hall) |
| OR-2 | A 3D projection of the whole universe that Jim zooms in and out, down to a solar system and a place, to choose where the Gate goes | Must | 🟡 Rev D: the universe fills the Orb's hollow centre, the Universe Hall, 24 m across | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) · [Summary](docs/design/02-crown.md#the-orb-and-the-universe-hall) |
| OR-3 | Sit in rooms in the Orb and see the projection in the big round space, not inside a closed ball that blocks the view | Must | 🟡 Rev D: three rings of rooms round the hall, each with a glass front onto it | [Section drawing](docs/img/book/crown-orb-inside.png) |
| OR-4 | A switch to turn the projection on and off | Must | 🟡 Rev D: a switch in every room, and voice anywhere. Off, the hall's wall shows the real sky | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) |
| OR-5 | Like a 3D dashboard: a corner always shows Earth (home) and Mars (where Jim lives now) as small icons with live weather. It can be hidden and shown again | Must | 🟡 Rev D: a panel in the corner of every glass front | [Dashboard drawing](docs/img/book/crown-dashboard.png) |
| OR-6 | Rooms to rest in the Orb, with high-tech windows that block radiation | Must | 🟡 Rev D: five rest rooms at +80 m. Radiation glass is future technology; the real fallback is deep acrylic and water windows | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) |
| OR-7 | Where the Gate opens in the demo | Should | ☑️ Decided 1 Oct (best judgment): zoom out to the whole universe, back in to the TTMath campus in Gale crater, then step into demo 1 | [Decisions](docs/decisions.md#for-jims-review) |

## 5. The Pentagon, below ground

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| PG-1 | Most of the house underground because of the weather: about 10 times the area above ground | Must | ✅ 209,700 m², 11 times the Crown | [Ch 03](https://ttmathcs.github.io/mars-campus/palace/design/pentagon.html) · [Summary](docs/design/03-pentagon.md) |
| PG-2 | Underground, "the pentagon shape solid design" | Must | ✅ One solid pentagon, 160 m sides, five levels from 24 to 68 m down under 16 m of soil | [Ch 03](https://ttmathcs.github.io/mars-campus/palace/design/pentagon.html#plan) · [Summary](docs/design/03-pentagon.md#the-plan) |
| PG-3 | "All crazy ideas and future-proof tech" below ground (round 2) | Should | 📐 Residence, a garden level with a lake and a forest, studio and workshops, life support, and the transit halls | [Ch 03](https://ttmathcs.github.io/mars-campus/palace/design/pentagon.html#levels) · [Summary](docs/design/03-pentagon.md#the-five-levels) |

## 6. Living in the house

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| LV-1 | Many rooms, each detailed: living room, bedroom, bath, study, dining, kitchen, library, cellar, pool, sauna, gym, guest suites, gardens, hangar (round 1) | Must | 📐 All of them, in the Crown and on levels L1 and L2 | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html) · [Summary](docs/design/04-interiors.md) |
| LV-2 | Two master suites, "one up and one down" | Must | ✅ Master suite up in the Crown's south-east dip; master suite down on L1, sector 1 | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#suites) · [Summary](docs/design/04-interiors.md#two-master-suites) |
| LV-3 | Sleep below ground most nights, to limit radiation | Must | ☑️ Decided 1 Oct (Jim: true). About 20 mSv a year, with about 6 hours a day in the Crown and rest in the Orb (OR-6) | [Ch 03](https://ttmathcs.github.io/mars-campus/palace/design/pentagon.html#why) · Ch 08 (to write) |
| LV-4 | Watch TV (round 2) | Should | 📐 The 40-seat cinema and the family room on L1 | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#pentagon) |
| LV-5 | Read books (round 2) | Should | 📐 The Library spire in the Crown and the Great library on L1 | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#crown) |
| LV-6 | Play the piano, and other things to use (round 2) | Could | 📐 The piano room in the Salon spire, a music room on L1 | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#crown) |
| LV-7 | Few visitors: "I don't expect a lot of visitors because it's for my retirement" (1 Oct) | Should | ☑️ The demo is played as Jim, not as a guest. The guest rooms stay as designed, because the few visitors from Earth stay until the next launch window ([why](docs/decisions.md#for-jims-review)) | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#pentagon) |

## 7. Getting home

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| TR-1 | A rocket transportation centre where the Earth–Mars ships land, 30 km east of the house | Must | ✅ Arcadia Spaceport: three pads, terminal, fuel plant, pod station | [Ch 07](https://ttmathcs.github.io/mars-campus/palace/design/spaceport.html) · [Summary](docs/design/07-spaceport.md) |
| TR-2 | A flying pod carries Jim home: "I need impressive video to show the flight on the way" | Must | ✅ 🎬 37 km scenic route, 4 min 40 s, ten shots | [Ch 06](https://ttmathcs.github.io/mars-campus/palace/design/transport.html#flight) · [Summary](docs/design/06-transport.md#the-flight-home) |
| TR-3 | "Arrival land on sunset, but animation can go through Mars storm etc." | Must | ✅ 🎬 A dust storm after the Ice Cliffs, then a breakout into the blue sunset with Phobos crossing the sun | [Pictures](docs/gallery.md#the-flight-home) |
| TR-4 | The journey can be skipped (round 2) | Should | 🎬 "Skip to arrival" | [Summary](docs/design/06-transport.md#the-flight-home) |
| TR-5 | The door is private and opens by itself for Jim, by key or future authentication (round 2) | Must | 📐 The Door: an iris of light that knows Jim by face, eyes and walk | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#arrive) · [Summary](docs/design/04-interiors.md#coming-home) |
| TR-6 | An airlock between outside and inside (round 2) | Should | 📐 The pod hangar is the airlock; suits stay outside at suit ports | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#arrive) |

## 8. Systems

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| SY-1 | The power station design: what it looks like and how it works | Must | 📐 Three 5 MWe fission microreactors, a solar field, batteries and a 30 km DC cable | [Ch 05](https://ttmathcs.github.io/mars-campus/palace/design/power.html) · [Summary](docs/design/05-power.md) |
| SY-2 | The transportation design | Must | 📐 Ships, the pod, the bus, the maglev (phase 2) and portals | [Ch 06](https://ttmathcs.github.io/mars-campus/palace/design/transport.html) · [Summary](docs/design/06-transport.md) |
| SY-3 | The air inside | Must | ☑️ Decided 1 Oct (Jim: "do your best judgment"): 70 kPa with 27% oxygen, which breathes like Calgary | Ch 08 (to write) |
| SY-4 | Life support: air, water, food, heat, radiation, dust, fire safety, medical care | Must | ⏳ Chapter 08 | [Plan](../HANDOFF.md#2b-next-steps-in-order) |
| SY-5 | Communications and space: the radio delay, relay satellites, the moons, Mars time | Should | ⏳ Chapter 09 | [Plan](../HANDOFF.md#2b-next-steps-in-order) |
| SY-6 | When Jim moves in, so the building timeline has dates | Must | ☑️ Decided 1 Oct: 2027. He launches in the Nov–Dec 2026 window and lands in mid-2027. ⏳ Chapter 10 | [Decisions](docs/decisions.md#1-oct-2026-jims-answers) |

## 9. What you can do in the demo

You play Jim, coming home. Jim expects few visitors (LV-7), so the demo is his own arrival and his own house, not a
guided tour for guests. It is built in three phases. Each phase replaces the old palace at
`palace/`, at the same link.

| Phase | What it adds | State |
| --- | --- | --- |
| 1 | The 30 km landscape, the spaceport and the flight video | 🎬 Works in the test build (`palace/src/`), paused |
| 2 | The Crown and the Orb | Waits for the design book |
| 3 | The Pentagon, one level at a time | Waits for the design book |

| ID | You can … | Priority | Phase | Status |
| --- | --- | --- | --- | --- |
| DM-1 | Fly home: watch the flight video, switch between three cameras (director, cockpit, chase), pause, jump between the ten shots, skip | Must | 1 | 🎬 |
| DM-2 | After landing, look around the Crown from outside | Should | 1 | 🎬 |
| DM-3 | Arrive: the hangar fills with air, the Door recognises you and opens onto the Arrival hall | Must | 2 | 📐 |
| DM-4 | Walk the Crown: its ten parts, the Glide walkway, and the sunset through the window slots | Must | 2 | 📐 |
| DM-5 | Use the portals: one step between the spires, the Orb and the Pentagon's levels | Must | 2–3 | 📐 |
| DM-6 | In the Orb, switch the universe on. Zoom from the whole universe to the solar system, Mars and the house, see Earth and Mars with their weather, then switch it off | Must | 2 | 🟡 |
| DM-7 | Step through the Wormhole Gate to the chosen place (proposed: the TTMath campus, demo 1) | Should | 2 | 🟡 |
| DM-8 | Rest in a rest room in the Orb and look out over the plain | Could | 2 | 🟡 |
| DM-9 | Go down to the Pentagon: the residence and master suite down on L1, the garden level with its lake and forest, the atrium and the sun court | Must | 3 | 📐 |
| DM-10 | Everyday things: watch TV, read a book, play the piano | Should | 2–3 | 📐 |
| DM-11 | Change the time of day: sunrise, noon, blue sunset, night, dust storm (round 1) | Should | 2 | 📐 |
| DM-12 | See a map of where you are; take a guided tour or walk freely (round 1) | Should | 2–3 | 📐 |
| DM-13 | Extras: swim in the 50 m pool in low gravity, watch Earth as the evening star from the Observatory, send a message home and see the delay, walk the forest on L2 | Could | 2–3 | ☑️ Decided 1 Oct (best judgment) |

## 10. Open questions

None. Jim answered every question on 1 Oct 2026; where he asked us to use our best judgment, the choice and the
reason are in the [decision log](docs/decisions.md#for-jims-review). One item is shown for his review: the Orb's
Universe Hall (OR-2 to OR-6). If it looks right, nothing is needed.

## 11. History and old IDs

| Round | Dates | What happened | Where it is now |
| --- | --- | --- | --- |
| 1 and 2 | before 29 Sep 2026 | The first palace on a mesa, with the Deep below it | [Archive](docs/archive/old-palace.md) and [the archived page](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/) |
| 3 | 29–30 Sep 2026 | Start again: the Crown and the Pentagon, floor plans Rev A and Rev B | [Floor plans](docs/plans.md) |
| 4 | 30 Sep 2026 onwards | The design book and the Mars Atlas (Rev C), then Jim's answers (Rev D) | [Design](docs/design/README.md) |

The rounds 3 and 4 IDs used until 1 Oct 2026 map to the new IDs like this:

| Old | New | Old | New | Old | New |
| --- | --- | --- | --- | --- | --- |
| RD-1 | GN-2 | RD-7 | ST-1, TR-1 | RD-13 | TR-3 |
| RD-2 | GN-6 | RD-8 | TR-2 | RD-14 | GN-8 |
| RD-3 | CR-1 | RD-9 | ST-3 | RD-15 | CR-2 |
| RD-4 | CR-3 | RD-10 | GN-3 | RD-16 | CR-4 |
| RD-5 | PG-1 | RD-11 | LV-2 | DB-1 | GN-7 |
| RD-6 | PG-2 | RD-12 | OR-1 | DB-2 | ST-4 |
| DB-3 | GN-5 | DB-4 | OR-2 | DB-5 | GN-8 |
