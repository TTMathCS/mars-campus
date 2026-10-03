"""Fetch the scanned models, photo textures and skies the Blender scenes use, into palace/tools/render/assets/.
usage: python3 palace/tools/render/fetch_assets.py
Sources (all on GitHub; see palace/tour/README.md for the credits):
- Models from the Khronos glTF Sample Assets (https://github.com/KhronosGroup/glTF-Sample-Assets): Glam Velvet Sofa,
  Specular Silk Pouf and Iridescent Dish with Olives (Wayfair, CC BY 4.0), Sheen Chair (Wayfair, CC0), Diffuse
  Transmission Plant (Darmstadt Graphics Group, CC BY 4.0), A Beautiful Game (ASWF, CC BY 4.0), Glass Vase Flowers and
  Diffuse Transmission Teacup (CC0).
- Textures from three.js's examples (https://github.com/mrdoob/three.js, MIT): hardwood2 (the floor's boards),
  grasslight-big (the sun court's lawn), waternormals (the pool).
- The Earth for the library's globe: NASA's Blue Marble (public domain), from https://github.com/turban/webgl-earth.
The books' spines are drawn here, not fetched: python3 palace/tools/render/make_spines.py palace/tools/render/assets"""
import os, urllib.request
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets"); os.makedirs(OUT, exist_ok=True)
KH = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/%s/glTF-Binary/%s.glb"
TJ = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/"
MODELS = ["GlamVelvetSofa", "SheenChair", "SpecularSilkPouf", "IridescentDishWithOlives", "DiffuseTransmissionPlant", "ABeautifulGame", "GlassVaseFlowers", "DiffuseTransmissionTeacup"]
FILES = {m + ".glb": KH % (m, m) for m in MODELS}
FILES.update({"hardwood2_diffuse.jpg": TJ + "hardwood2_diffuse.jpg", "hardwood2_bump.jpg": TJ + "hardwood2_bump.jpg", "hardwood2_roughness.jpg": TJ + "hardwood2_roughness.jpg",
              "grasslight-big.jpg": TJ + "terrain/grasslight-big.jpg", "waternormals.jpg": TJ + "waternormals.jpg",
              "earth4k.jpg": "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg"})
for name, url in FILES.items():
    path = os.path.join(OUT, name)
    if os.path.exists(path): print("have", name); continue
    data = urllib.request.urlopen(url, timeout=120).read(); open(path, "wb").write(data); print("got", name, len(data) // 1024, "KB")
# Mars for the map room's globe and the Orb's Mars lounge: the design plan's own colour map (the Atlas's; NASA/JPL/USGS
# Viking mosaic over a base map by Solar System Scope, CC BY 4.0), copied from the checkout
import shutil
for repo in (os.environ.get("MARS_REPO"), "/home/user/mars-campus", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")):
    src = repo and os.path.join(repo, "palace", "design", "img", "mars-map.jpg")
    if src and os.path.exists(src):
        if not os.path.exists(os.path.join(OUT, "mars2k.jpg")): shutil.copy(src, os.path.join(OUT, "mars2k.jpg")); print("copied mars2k.jpg")
        break
