# Mars Campus

Walkable 3D scenes on real Mars terrain that run in the browser. Each demo starts on NASA ground from Gale Crater and adds an imagined place to discover.

**Live site: https://ttmathcs.github.io/mars-campus/**

## Demos

| Demo | Link | What it is |
|---|---|---|
| 1. TTMath on Mars | [ttmathcs.github.io/mars-campus/ttmath/](https://ttmathcs.github.io/mars-campus/ttmath/) | Sunset at Dingo Gap. Walk over the ridge to find the TTMath campus, with rovers and flying craft. |

More demos will be added in their own folders.

## Controls

| | Desktop | Phone |
|---|---|---|
| Look around | Drag, or turn on Mouse-look | Drag with one finger |
| Walk | W A S D or arrow keys | MOVE stick (push further to run) |
| Run | Hold Shift | Push the stick to the edge |
| Jump | Space | JUMP button |
| Zoom | Mouse wheel, + and - | Pinch |
| Play the sunset | P | Play button |
| Sound | M | Speaker button |
| Scenes | 1 to 5 | Menu |

## What is real and what is simulated

- **Real:** the ground around the start, about 260 × 260 m. It is NASA JPL's 3D model of "Dingo Gap", built from Curiosity rover photos (around sol 528) and HiRISE orbital images.
- **Simulated:** the landscape beyond that area, the sky and Sun, the buildings, the rovers and the flying craft.

## Layout

```
index.html        landing page that lists the demos
data/             NASA terrain shared by every demo (manifest + tiles packed as base64 text)
ttmath/           Demo 1: TTMath on Mars (page + logo)
```

Each demo page loads the shared terrain from `../data/`.

## Publishing

Every push to `main` publishes the site automatically through the GitHub Actions workflow in `.github/workflows/pages.yml`. It checks that the key files are present, then deploys to GitHub Pages. You can also run it by hand from the Actions tab ("Deploy to GitHub Pages", then "Run workflow").

One-time setting: in the repo's Settings, then Pages, set Source to "GitHub Actions".

## Run it locally

The pages load their data with `fetch()`, so they need a small web server. Opening the files straight from disk will not work.

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Credits

- Terrain: [NASA-AMMOS 3DTilesSampleData](https://github.com/NASA-AMMOS/3DTilesSampleData), `msl-dingo-gap`, release URS297920, built with JPL's [Landform](https://github.com/NASA-AMMOS/Landform) pipeline.
- Imagery: MSL Mastcam (NASA/JPL-Caltech/MSSS), MSL Navcam and Hazcam (NASA/JPL-Caltech), MRO HiRISE (NASA/JPL-Caltech/University of Arizona), HiRISE mosaics (NASA/JPL-Caltech/USGS Astrogeology).
- Sky references: Curiosity's [blue sunset in Gale Crater](https://www.jpl.nasa.gov/images/pia19400-sunset-in-mars-gale-crater/) and [Earth as the evening star](https://www.jpl.nasa.gov/images/pia17936-bright-evening-star-seen-from-mars-is-earth/).
- TTMath name and logo © TTMath.
- Rendering: [Three.js](https://threejs.org/) r128.
