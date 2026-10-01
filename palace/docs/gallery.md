# Pictures

[Demo 2 home](../README.md) · [Requirements](../REQUIREMENTS.md) · [Decisions](decisions.md) · [Design](design/README.md) · [Floor plans](plans.md) · **Pictures**

Every picture of demo 2. They are rendered from the new 3D build (`palace/src/`), the same scene the flight video
plays, so they show the design as it will look in the demo. They are simulations, not photographs. The diagrams are
on the [design pages](design/README.md) and the plan sheets on [Floor plans](plans.md).

| | | |
| --- | --- | --- |
| [<img src="../design/img/crown-sunset.jpg" alt="The Crown at sunset">](#coming-home-at-sunset) | [<img src="../design/img/crown-day.jpg" alt="The Crown by day">](#the-crown-by-day) | [<img src="../design/img/crown-garden.jpg" alt="Under the ring">](#under-the-ring) |
| [<img src="../design/img/site-aerial.jpg" alt="The house from the air">](#the-house-from-the-air) | [<img src="../design/img/port-aerial.jpg" alt="Arcadia Spaceport">](#arcadia-spaceport) | [<img src="../design/img/port-liftoff.jpg" alt="Lift-off">](#1-lift-off) |
| [<img src="../design/img/flight-west.jpg" alt="Heading west">](#2-heading-west) | [<img src="../design/img/flight-dunes.jpg" alt="The Dune Sea">](#3-the-dune-sea) | [<img src="../design/img/flight-crater.jpg" alt="Over the crater">](#4-over-the-crater) |
| [<img src="../design/img/flight-cliffs.jpg" alt="The Ice Cliffs">](#5-the-ice-cliffs) | [<img src="../design/img/flight-breakout.jpg" alt="In the cockpit">](#7-in-the-cockpit-after-the-storm) | [<img src="img/atlas/house.jpg" alt="The Mars Atlas at the house">](#the-mars-atlas) |

## The Crown

### Coming home at sunset

![The Crown at sunset, a dust storm behind it](../design/img/crown-sunset.jpg)

The Crown from the pod on its last approach, with the dust storm it has just flown through behind it. The Orb mirrors
the sky; the five spires hold the anti-gravity drives. *Used on the homepage and in [chapter 02](design/02-crown.md).*

### The Crown by day

![The Crown by day from the south-east](../design/img/crown-day.jpg)

From the south-east at mid-morning. The mirrors in the Stone Garden follow the sun, and the Crown's shadow, with its
five spires, falls across the plain. *[Chapter 02](design/02-crown.md#how-it-works-day-to-day).*

### Under the ring

![Looking up at the ring and the Orb from the Stone Garden](../design/img/crown-garden.jpg)

Standing in the Stone Garden: the ring's underside is 40 m overhead and nothing holds it up. The garden mirrors aim
sunlight at the Orb, which sends it down the Sun Well to the gardens below. *On the design book's cover and in
[chapter 02](design/02-crown.md).*

### The house from the air

![The Crown on the plain, seen from the air](../design/img/site-aerial.jpg)

The Crown alone on the plain of Arcadia Planitia, with the rings of light under its spires where the anti-gravity
fields touch the ground. *[Chapter 01](design/01-site-and-city.md#the-site-plan).*

## The spaceport

### Arcadia Spaceport

![Arcadia Spaceport from the air](../design/img/port-aerial.jpg)

From the south-west: the solar field in front, the terminal dome and the control tower, the pod station, the fuel plant
with its six tanks, the ice mine on the left, and the three landing pads 1.6 km out. *[Chapter 07](design/07-spaceport.md).*

## The flight home

The flight video has ten shots and lasts 4 min 40 s ([chapter 06](design/06-transport.md#the-flight-home)). These
are frames from it.

### 1 Lift-off

![The pod lifting off at the pod station](../design/img/port-liftoff.jpg)

The pod rises from the pod station on four blue methane flames, with the terminal and the tower behind.
*[Chapter 07](design/07-spaceport.md).*

### 2 Heading west

![The pod heading west into the low sun](../design/img/flight-west.jpg)

Heading west into the low sun after lift-off, with dust devils marching across the plain. *[Chapter 06](design/06-transport.md#the-flight-home).*

### 3 The Dune Sea

![Dunes and dust devils](../design/img/flight-dunes.jpg)

Down to 55 m over the black basalt sand of the Dune Sea, between the dust devils. *[Chapter 06](design/06-transport.md#the-flight-home).*

### 4 Over the crater

![The pod over the crater's rim](../design/img/flight-crater.jpg)

The climb over the rim of a crater 3.2 km across, with frost in its shadows. *[Chapter 06](design/06-transport.md#the-flight-home).*

### 5 The Ice Cliffs

![The pod along the Ice Cliffs](../design/img/flight-cliffs.jpg)

45 m above the foot of a 100 m scarp of layered ice, blue in the shade, a minute before the dust storm.
*[Chapter 06](design/06-transport.md).*

### 7 In the cockpit, after the storm

![The cockpit after the breakout into the sunset](../design/img/flight-breakout.jpg)

Out of the storm into clear air: speed, height, the route home and the time to landing on the cockpit screens, the
blue sunset ahead. *[Chapter 06](design/06-transport.md#the-flight-home).*

## The Mars Atlas

The Atlas on the live site zooms from the solar system to the house over NASA imagery
([open it](https://ttmathcs.github.io/mars-campus/palace/design/atlas/)). These views were saved without the NASA
tiles, so they show the coarser base map.

| Whole Mars | Arcadia Planitia | The house |
| --- | --- | --- |
| ![Mars in the Atlas](img/atlas/mars.jpg) | ![Arcadia Planitia in the Atlas](img/atlas/arcadia.jpg) | ![The house in the Atlas](img/atlas/house.jpg) |

## How the pictures are made

- **Renders:** `python3 palace/tools/book_renders.py [names]` loads the 3D test build and saves 1600 × 900 pictures
  to `palace/design/img/`. Each view is a fixed camera or a time in the flight video; see the list in the script.
  Build the test page first with `sh palace/build.sh debug`.
- **Diagrams, plan sheets and Atlas views:** `python3 palace/tools/docs_export.py` exports them from the live pages
  into `palace/docs/img/`.
- **Maps:** the base map of Mars is the Solar System Scope colour map (CC BY 4.0, from NASA imagery). On the live
  pages the NASA/JPL/USGS Viking colour mosaic loads on top of it.
- Small pictures named `th-*` in `palace/design/img/` are the chapter cards on the design book's cover.
