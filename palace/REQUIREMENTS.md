# Jim's retirement house on Mars: requirements

Demo 2 of [Mars Campus](../README.md) · owner: Jim (TTMath) · last updated 1 Oct 2026

**[Demo 2 home](README.md) · Requirements · [Decisions](docs/decisions.md) · [Design](docs/design/README.md) · [Floor plans](docs/plans.md) · [Pictures](docs/gallery.md)**

This file lists everything Jim has asked for in demo 2. Each requirement has an ID, a priority, a status and a
link to where the design answers it. It is the source of truth for the demo: when Jim asks for something new, it
goes here first.

> **Where things stand, 1 Oct 2026**
> - Floor plans **Rev B approved** by Jim on 30 Sep ("Approve. Go").
> - **Design book Rev E** is in progress, because Jim wants every plan designed before more 3D work. Chapters 01–07
>   are written. Chapters 08 Life support, 09 Communications and space, and 10 Building it are still to write.
> - **Nothing waits for an answer.** Jim answered every question on 1 Oct. The Orb's new design, Rev E (OR-1 to
>   OR-9): the universe in VR, the ball as the Wormhole Gate and the Orb's dock, and the built ground (GN-13) are
>   drawn from his words and shown for his review.
> - **3D demo phases 1 and 2 are live** at [palace/](https://ttmathcs.github.io/mars-campus/palace/) (1 Oct 2026; Jim: "please
>   go ahead to build, you have my pre approve"): the landscape, the spaceport, the flight home and the Crown from
>   outside; the Crown's main floor; the Orb. **Phase 3 has started:** the Pentagon's atrium, the rooms behind its
>   glass on every level, the garden level and the sun court, at [palace/pentagon/](https://ttmathcs.github.io/mars-campus/palace/pentagon/).

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
| 🎬 Built | Works in the 3D demo |
| 🔧 In progress | Being worked on now |

**Ch 02** links open a design book chapter on the live site. **Summary** links open the chapter's page in this
repo, with its diagrams and pictures.

## Contents

1. [The vision and the rules](#1-the-vision-and-the-rules)
2. [Site and city](#2-site-and-city)
3. [The Crown, above ground](#3-the-crown-above-ground)
4. [The Orb: the universe in VR and the Wormhole Gate](#4-the-orb-the-universe-in-vr-and-the-wormhole-gate)
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
| GN-10 | Use the diagrams and the rendered pictures as much as possible; every picture must look real | Must | ✅ Done 1 Oct 2026: 39 diagrams exported, all ten pictures re-rendered; the cockpit view did not look real and was taken out | [Pictures](docs/gallery.md) |
| GN-11 | Works on Jim's laptop, and on a phone | Should | Design book checked at desktop and phone size | [HANDOFF.md](../HANDOFF.md) |
| GN-12 | Nothing spread over the ground: no solar panels and no mirrors. "It is bit scary to have so many panels on the ground… better to remove them all if no good design." | Must | ☑️ Decided 1 Oct 2026: the garden mirrors and the solar field are gone; the Stone Garden is gravel and seven stones; reactors supply all the power | [Decisions](docs/decisions.md#1-oct-2026-nothing-on-the-ground) · [Ch 05](https://ttmathcs.github.io/mars-campus/palace/design/power.html) |
| GN-13 | A designed ground, not raw soil, with hints of the big part underground. "the ground is raw and need some construction/design as well. and at least some hints that there is big part underground, instead of raw ground/soil" | Must | 🟡 Rev E, 1 Oct 2026: a paved pentagon 4 m wider than the Pentagon below, kerbed in basalt with a line of light; the Stone Garden inside it; glass over the five avenues; a glass pavilion over each corner stair; basalt pads under the spires. Still no panels and no mirrors (GN-12) | [Ch 01](https://ttmathcs.github.io/mars-campus/palace/design/site.html#plan) · [Summary](docs/design/01-site-and-city.md#the-site-plan) · [Decisions](docs/decisions.md#1-oct-2026-a-built-ground-and-a-dock-for-the-orb) |

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
| CR-3 | The part above ground is much bigger than the TTMath campus | Must | ✅ 19,100 m², 5.6 times the campus (Rev D and E; Rev B had 20,100 m²) | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#areas) |
| CR-4 | No elevators: the Crown and the underground are linked by a wormhole or another transmission device | Must | ✅ Portals in the spires, the Orb and every Pentagon level; stairs as the real fallback | [Ch 06](https://ttmathcs.github.io/mars-campus/palace/design/transport.html#portals) · [Summary](docs/design/06-transport.md#in-the-house-portals) |

## 4. The Orb: the universe in VR and the Wormhole Gate

From Jim's answer on 1 Oct 2026: *"I don't need the universe to be displayed in the ball ... I need to sit in some
rooms in the Orb, so I can see the spaces in the big circle ... I should have some switch to turn it on and off.
When I turn it on I can do 3D projection of the universe so I can zoom in and zoom out ... like a 3D dashboard. At
the corner somewhere, there's always our home planet Earth, and our current immigration planet Mars ... small icons
showing dynamic weather ... I can turn it off. I can turn it back on if I need to."*

And later the same day, on the Rev D drawing: *"not projector. it is future tech VR 3d. not inside a ball, the
universe can be VR inside the orb, not in the ball"*, *"projected directly in the 3d space"*, *"the ball looks pretty
cool and I am not sure where to put it for maybe different purpose? but not for the VR 3d universe"*. On the idea of
the ball as the Gate: *"I like the idea. it is wormhole gate, it can send people/object to specified time (also time
machine) and specified area of universe instantly. but how object can go into the ball?"* and *"when time/space
configured and press send, the ball will shoot the object like a light directly to the VR 3d space and this is how
wormhole works"*. And on the ground: *"also there should be some interface when orb can land on the ground"*.

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| OR-1 | A wormhole device that sends people and things to any time (a time machine too) and any place in the universe, instantly: set the time and place, press send, and the ball shoots the object like light to that place | Must | 🟡 Rev E: the Gate is a ball 18 m across in the middle of the Orb. Choose in the universe, walk across a short bridge into the ball (things ride in on a cart or with a robot), press send; the far end is a ball too, for the way back · 🎬 [In the demo](https://ttmathcs.github.io/mars-campus/palace/orb/) | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) · [Summary](docs/design/02-crown.md#the-orb-the-universe-in-vr-and-the-wormhole-gate) |
| OR-2 | The whole universe in 3D that Jim zooms in and out, down to a solar system and a place, to choose where the Gate sends him. Future-tech VR shown directly in the 3D space inside the Orb: not a projector, not inside a ball | Must | 🟡 Rev E: switched on, the universe appears in 3D in the room itself, all round, with no screen and no glasses; in every room, or the whole Orb · 🎬 [In the demo](https://ttmathcs.github.io/mars-campus/palace/orb/) | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) · [Summary](docs/design/02-crown.md#the-orb-the-universe-in-vr-and-the-wormhole-gate) |
| OR-3 | Sit in rooms in the Orb with the universe all around | Must | 🟡 Rev E: three rings of rooms round the Gate; the universe fills whichever room he is in | [Section drawing](docs/img/book/crown-orb-inside.png) |
| OR-4 | A switch to turn the universe on and off | Must | 🟡 Rev E: a switch in every room, and voice anywhere. Off, the room is back, with its windows to the real sky · 🎬 [In the demo](https://ttmathcs.github.io/mars-campus/palace/orb/) | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) |
| OR-5 | Like a 3D dashboard: a corner always shows Earth (home) and Mars (where Jim lives now) as small icons with live weather. It can be hidden and shown again | Must | 🟡 Rev E: two small globes with live weather floating in the corner of his view; a touch or a word hides them · 🎬 [In the demo](https://ttmathcs.github.io/mars-campus/palace/orb/) | [Dashboard drawing](docs/img/book/crown-dashboard.png) |
| OR-6 | Rooms to rest in the Orb, with high-tech windows that block radiation | Must | 🟡 Rev E: five rest rooms at +80 m. Radiation glass is future technology; the real fallback is deep acrylic and water windows | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#orb) |
| OR-7 | Where the Gate opens in the demo | Should | ☑️ Decided 1 Oct (best judgment): zoom out to the whole universe, back in to the TTMath campus in Gale crater, press send and arrive in demo 1 · 🎬 [In the demo](https://ttmathcs.github.io/mars-campus/palace/orb/) | [Decisions](docs/decisions.md#for-jims-review) |
| OR-8 | Keep the ball, which "looks pretty cool", for a purpose other than the universe | Should | 🟡 Rev E: the ball is the Wormhole Gate (OR-1) | [Decisions](docs/decisions.md#1-oct-2026-the-universe-in-vr-the-ball-is-the-gate) |
| OR-9 | An interface where the Orb can land on the ground | Must | 🟡 Rev E, 1 Oct 2026: the Orb's dock, a basalt ring 30.8 m across and 5.5 m high round the Sun Well with five bronze pads. The Orb comes down onto it for service or if its drive stops; a hatch in its base opens onto the dock, and a stair and a lift inside the ring go down into the atrium | [Ch 02](https://ttmathcs.github.io/mars-campus/palace/design/crown.html#dock) · [Summary](docs/design/02-crown.md#the-orb-the-universe-in-vr-and-the-wormhole-gate) |

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
| TR-2 | A flying pod carries Jim home: "I need impressive video to show the flight on the way" | Must | ✅ 🎬 Live: 37 km scenic route, 4 min 40 s, ten shots | [Ch 06](https://ttmathcs.github.io/mars-campus/palace/design/transport.html#flight) · [Summary](docs/design/06-transport.md#the-flight-home) |
| TR-3 | "Arrival land on sunset, but animation can go through Mars storm etc." | Must | ✅ 🎬 A dust storm after the Ice Cliffs, then a breakout into the blue sunset with Phobos crossing the sun | [Pictures](docs/gallery.md#the-flight-home) |
| TR-4 | The journey can be skipped (round 2) | Should | ✅ 🎬 Live: "Skip to arrival" | [Summary](docs/design/06-transport.md#the-flight-home) |
| TR-5 | The door is private and opens by itself for Jim, by key or future authentication (round 2) | Must | 📐 The Door: an iris of light that knows Jim by face, eyes and walk | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#arrive) · [Summary](docs/design/04-interiors.md#coming-home) |
| TR-6 | An airlock between outside and inside (round 2) | Should | 📐 The pod hangar is the airlock; suits stay outside at suit ports | [Ch 04](https://ttmathcs.github.io/mars-campus/palace/design/interiors.html#arrive) |

## 8. Systems

| ID | Requirement | Priority | Status | Where |
| --- | --- | --- | --- | --- |
| SY-1 | The power station design: what it looks like and how it works | Must | 📐 Four 5 MWe fission microreactors, two at the house and two at the spaceport, with batteries, fuel cells and a 30 km DC cable; no panels on the ground (GN-12) | [Ch 05](https://ttmathcs.github.io/mars-campus/palace/design/power.html) · [Summary](docs/design/05-power.md) |
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
| 1 | The 30 km landscape, the spaceport and the flight video | ✅ Live, 1 Oct 2026, at [palace/](https://ttmathcs.github.io/mars-campus/palace/) |
| 2 | The Crown and the Orb | 🎬 Live, 1 Oct 2026: the Crown's main floor at [palace/crown/](https://ttmathcs.github.io/mars-campus/palace/crown/) and the Orb at [palace/orb/](https://ttmathcs.github.io/mars-campus/palace/orb/). Still to come: the spires' upper floors and the rest rooms |
| 3 | The Pentagon, one level at a time | 🎬 Started, 1 Oct 2026, at [palace/pentagon/](https://ttmathcs.github.io/mars-campus/palace/pentagon/): the atrium, its bridges and the portal column; the rooms of ring A seen through the glass on every level; the garden level (L2) and the sun court (L5); Jim's residence on L1 (the family room and the master suite down) to walk into. Next: the rest of L1, then L3 to L5 |

| ID | You can … | Priority | Phase | Status |
| --- | --- | --- | --- | --- |
| DM-1 | Fly home: watch the flight video, switch between three cameras (director, cockpit, chase), pause, jump between the ten shots, skip | Must | 1 | ✅ Live |
| DM-2 | After landing, look around the Crown from outside | Should | 1 | ✅ Live |
| DM-3 | Arrive: the hangar fills with air, the Door recognises you and opens onto the Arrival hall | Must | 2 | 🎬 Live at [palace/crown/](https://ttmathcs.github.io/mars-campus/palace/crown/): you start by the pod in the hangar; the iris of light opens and you walk into the Arrival hall |
| DM-4 | Walk the Crown: its ten parts, the Glide walkway, and the sunset through the window slots | Must | 2 | 🎬 Live: the whole main floor, 30 furnished rooms in ten parts; the Glide carries you round; the sun comes in through the slots |
| DM-5 | Use the portals: one step between the spires, the Orb and the Pentagon's levels | Must | 2–3 | 🎬 Portals in the five spires go up to the Orb; the Orb's link comes back down; the Crown's portal goes down to the Pentagon, and the portal column takes you to any of its five levels in one step |
| DM-6 | In the Orb, switch the universe on. Zoom from the whole universe to the solar system, Mars and the house, see Earth and Mars with their weather, then switch it off | Must | 2 | 🎬 Live: the switch; six steps from the cosmic web to the Milky Way, the solar system today, Mars, Arcadia and the house, and Earth; the Earth and Mars dashboard with the Mars clock and live Earth weather |
| DM-7 | Use the Wormhole Gate: choose the place in the universe, walk into the ball, press send and arrive there in a beam of light (default: the TTMath campus, demo 1) | Should | 2 | 🎬 Live: set the time, press send, walk across the bridge into the ball, and the beam takes you to demo 1 |
| DM-8 | Rest in a rest room in the Orb and look out over the plain | Could | 2 | 🟡 |
| DM-9 | Go down to the Pentagon: the residence and master suite down on L1, the garden level with its lake and forest, the atrium and the sun court | Must | 3 | 🔧 Live at [palace/pentagon/](https://ttmathcs.github.io/mars-campus/palace/pentagon/): the atrium with its terraces and bridges; the rooms of ring A seen through the glass (on L1 the guest lounge, the family room, the cinema, the thermal pools and the great library); the garden level with the orchard, the farm, the lake, the forest and the meadow; the sun court. **Jim's residence on L1 is walkable:** through the glass door into the family room, across the street to the master suite down (the bedroom, the bath and the dressing room). Next: the rest of L1 |
| DM-10 | Everyday things: watch TV, read a book, play the piano | Should | 2–3 | 🎬 In the family room on L1: the piano plays the opening of Für Elise, the screen over the fire shows Earth as it is now, and a book from the shelves opens at its first page |
| DM-11 | Change the time of day: sunrise, noon, blue sunset, night, dust storm (round 1) | Should | 2 | 🎬 Live in the Crown: all five |
| DM-12 | See a map of where you are; take a guided tour or walk freely (round 1) | Should | 2–3 | 🔧 The Crown has a map of the ring: click a part to glide there; walk freely or ride the Glide. The Pentagon has a map of the level you are on (the garden's five sectors and the lake on L2, Jim's rooms on L1): click a place to go there |
| DM-13 | Extras: swim in the 50 m pool in low gravity, watch Earth as the evening star from the Observatory, send a message home and see the delay, walk the forest on L2 | Could | 2–3 | ☑️ Decided 1 Oct (best judgment). 🎬 The forest on L2 is live |

## 10. Open questions

None. Jim answered every question on 1 Oct 2026; where he asked us to use our best judgment, the choice and the
reason are in the [decision log](docs/decisions.md#for-jims-review). Two items are shown for his review: the Orb,
Rev E (OR-1 to OR-9), and the built ground (GN-13). If they look right, nothing is needed.

## 11. History and old IDs

| Round | Dates | What happened | Where it is now |
| --- | --- | --- | --- |
| 1 and 2 | before 29 Sep 2026 | The first palace on a mesa, with the Deep below it | [Archive](docs/archive/old-palace.md) and [the archived page](https://ttmathcs.github.io/mars-campus/palace/archive/old-palace/) |
| 3 | 29–30 Sep 2026 | Start again: the Crown and the Pentagon, floor plans Rev A and Rev B | [Floor plans](docs/plans.md) |
| 4 | 30 Sep 2026 onwards | The design book and the Mars Atlas (Rev C), then Jim's answers (Rev D) and his words on the Orb (Rev E) | [Design](docs/design/README.md) |

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
