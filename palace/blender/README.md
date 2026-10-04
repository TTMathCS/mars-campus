# Arcadia in Blender: the original design files

Every picture and 360° view of Arcadia on the site was rendered in **Blender 4.2 LTS** with **Cycles** (path
tracing, AgX view transform, OpenImageDenoise). Nothing is painted by hand: each scene is built by a Python script in
[`palace/tools/render/`](../tools/render/). The scripts are the master copy. The files here are the same scenes
saved as Blender files, so they can be opened in Blender's normal window, looked at from any side, changed by hand and
rendered again.

Jim, 4 Oct 2026: "can you put original files somewhere so we can reproduce or improve later? just archives all
those original design files". Keep it so: whenever a scene's pictures are published or replaced, save its Blender
file here again (below). These files are kept in the repository but left out of the published site.

## What is here

- `scenes/<scene>.blend`: one file per scene, compressed. Each holds the whole scene (rooms, furniture, plants,
  lights, the sky), **a camera for every picture taken of it**, named after the picture (`studio`, `hero`, …),
  and a **panoramic camera for every 360° view** (`360 studio`, …), with the render settings used.
- `scenes/textures/`: the textures that came inside the glTF models (sofa, chairs, teacup, chess set, plant …).
- `assets/`: every other texture and image the scenes use (wood, grass, water, the Earth, Mars, the books' spines,
  the photographs in the memory rooms, the 360° skies they were cut from), with the same paths as in the render
  scripts' `assets/` folder.

## Opening and rendering a scene

1. Install Blender 4.2 LTS (blender.org). Open `scenes/<scene>.blend`. If Blender asks, allow it to find the
   textures: the paths are relative, so keep this folder's layout as it is.
2. Pick a camera in the Outliner and make it the active camera (Ctrl+Numpad 0). Each camera has an `exposure`
   value under Object Properties → Custom Properties: put it in Render Properties → Color Management → Exposure.
3. Render (F12). Stills were 1600 × 900 at 96 to 128 samples; 360° views 4096 × 2048 at 28 to 32 samples, through a
   panoramic (equirectangular) camera. The compositor adds the soft glow and the light vignette of `photo_finish`.
4. The published pictures are then graded to the earlier pictures' tones with
   [`grade.py`](../tools/render/grade.py) (`day`, `night` or `pale`).

## Making them again from the scripts

The scripts rebuild any scene from nothing (see `HANDOFF.md` for the Python with Blender's `bpy` module, and
`fetch_assets.py` for the models and textures). To save a scene's Blender file here again:

    bvenv/bin/python palace/tools/render/save_blend.py <scene> palace/blender

`<scene>` is `residence` (the family room, music room, dining room, the master suite down and the atrium),
`pent:<room>` (library, baths, cinema, guests), `crown:<room>` (the Crown's parts), `orb:<room>` (earth, mars,
galaxy), `garden:lake`, `club:cellar`, `sport:pool`, `memory:memory`, or `overall:hero` and `overall:whole`
(Arcadia from outside, cut open and whole).

## The scenes

| File | Script | Pictures |
| --- | --- | --- |
| `residence.blend` | `family.py`, `suite.py`, `suite2.py`, `atrium.py` | The family room, music room, dining room, the master suite down, the kitchen, the terrace, the bridge, the sun court |
| `pent_library.blend` … `pent_guests.blend` | `pent_rooms.py` | The great library, the thermal baths, the cinema, the guest lounge |
| `crown_<room>.blend` | `crown_rooms.py`, `crown.py` | The Crown's rooms: arrival, master suite up, salon, wellness, dining, sunset lounge, library, studio, observatory, garden room |
| `orb_<room>.blend` | `orb.py` | The Orb's lounges: Earth, Mars, the Galaxy |
| `garden_lake.blend` | `garden_level.py` | The lake on L2 |
| `club_cellar.blend` | `club.py` | The wine cellar |
| `sport_pool.blend` | `sport.py` | The lap pool |
| `memory_memory.blend` | `memory.py` | The memory rooms |
| `overall_hero.blend`, `overall_whole.blend` | `overall.py` | Arcadia from outside: cut open, and whole |

## Where the models and textures come from

Models from the Khronos glTF Sample Assets (Glam Velvet Sofa, Specular Silk Pouf, Iridescent Dish with Olives:
Wayfair, CC BY 4.0; Sheen Chair: Wayfair, CC0; Diffuse Transmission Plant: Darmstadt Graphics Group, CC BY 4.0;
A Beautiful Game: ASWF, CC BY 4.0; Glass Vase Flowers, Diffuse Transmission Teacup: CC0). Textures from three.js's
examples (MIT): hardwood2, grasslight-big, waternormals. NASA's Blue Marble (public domain). The Mars map: NASA/JPL/
USGS Viking mosaic over a base map by Solar System Scope (CC BY 4.0). The skies the memory rooms' photographs are
cut from: Poly Haven (CC0). Everything else is made by the scripts.
