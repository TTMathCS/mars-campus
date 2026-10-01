# 05 · Power

[← 04 Interiors](04-interiors.md) · [Design](README.md) · **05 Power** · [06 Transportation →](06-transport.md)

**[Open the full chapter on the live site ↗](https://ttmathcs.github.io/mars-campus/palace/design/power.html)**

On Mars, power is life: it makes the air, melts the water, lights the farms and fuels the ships home. Sunlight is weak
and a global dust storm can hide it for weeks, so the house runs on nuclear power that never stops, with a solar field
at the spaceport for the work that can wait for the sun. **Requirements:** SY-1.

![The power system in phase 1, average megawatts on a clear sol](../img/book/power-flow.png)

*The power system in phase 1, average megawatts on a clear sol, band widths to scale. Electricity is orange, heat is
red; the 30 km cable joins the house and the spaceport into one grid.*

| | |
| --- | --- |
| **8 MW** | Average demand in phase 1: the house, the spaceport and the fuel plant |
| **15 MWe** | Three fission microreactors of 5 MWe, running day and night, in storms too |
| **11 MW** | The solar field at a clear noon; about 3.5 MW averaged over a sol |
| **30 km** | Buried DC cable linking the house and the spaceport |
| **9 days** | Full power from fuel cells alone, burning stored rocket fuel |

## Where it comes from

- **Fission microreactors:** three units of 5 MWe, each the size of a shipping container, cooled by heat pipes with no
  pumps to fail. Two sit on the Pentagon's L4, 59 m down; one in a buried vault at the spaceport. Each runs about
  8 years between refuellings. Real: NASA's KRUSTY test (2018) ran a small heat-pipe reactor at full power.
- **Solar field:** 94,000 m² of panels at the spaceport, brushed by robots every night; next to nothing in a global
  storm, which is why the base load is nuclear. Opportunity was lost to the 2018 storm.
- **Batteries** of 20 MWh at each end, and **fuel cells** that can burn the methane and oxygen stored for the ships.
- The **fuel plant** is the one load that can wait: it runs flat out while the sun shines and slows at night and in
  storms. *The anti-gravity drives and portals are future technology; 0.5 MW is kept for them.*

![A reactor vault on L4, in section](../img/book/power-reactor.png)

*A reactor vault on L4: the core in a steel vessel inside a water-filled shield; heat pipes carry its heat to a gas
turbine, and the waste heat goes up to the radiators.*

## Through a sol

![Supply and demand through a clear sol and a storm sol](../img/book/power-sol.png)

*On a clear sol the solar field runs the fuel plant by day. In a global storm the sun is nearly gone for weeks; the
reactors carry the house and the port, and the fuel plant waits.*

## The grid

![The cable trench beside the rover road, in section](../img/book/power-trench.png)

*The trench beside the road: the cables and the fibre lie in sand under a warning layer, 1.5 m down.*

A buried direct-current cable runs 30 km beside the rover road at ±20 kV, able to carry 15 MW either way with about
1.5% lost at full load. The port's sunshine helps the house by day; the house's reactors power the port at night. An
optical fibre in the same trench backs up the radio links.

## Heat

![The radiator field, 400 m north](../img/book/power-radiators.png)

*The radiator field: 24 rows of fins 5 m tall, fed by a warm loop from L4.*

A reactor makes about twice as much heat as electricity. About 2 MW warms the Pentagon's floors, melts ice and keeps
the gardens warm; the rest, up to 20 MW, goes to a field of radiators 150 × 60 m, 400 m north, where it never shades
the garden mirrors or thaws the ground under the Pentagon.

## Growing with the city

| Phase | Demand | What is added |
| --- | --- | --- |
| 1 · Port and home | 8 MW | Three 5 MWe reactors, the solar field, batteries, the 30 km cable |
| 2 · First neighbours | 12 MW | A second reactor at the port; the maglev; about 0.25 MW for each new home |
| 3 · Arcadia City | 60–70 MW | A larger solar field and a bigger plant in L4's fusion-ready bay |
| 4 · Connections | — | Links to other Mars cities share power |
