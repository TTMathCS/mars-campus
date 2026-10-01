"""Fetch the planet maps for the Orb (palace/orb/): the solar system and the dashboard globes.
usage: python3 palace/tools/fetch_textures.py
Sources:
- Sun, Mercury, Venus (atmosphere), Jupiter, Saturn and its rings, Uranus, Neptune, the Moon: Solar System Scope
  textures (https://www.solarsystemscope.com/textures/, CC BY 4.0, based on NASA imagery), from the PyVista
  example-data mirror on GitHub, which states that licence (the same source as design/img/mars-map.jpg).
- Earth: NASA Blue Marble, land surface, shallow water and shaded topography (public domain), from Bjorn Sandvik's
  webgl-earth repository on GitHub.
Writes palace/orb/tex/<name>.jpg (equirectangular, 1024 x 512, 0 to 360 E, north up; Saturn's rings as a strip)."""
import io, os, urllib.request
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(TOOLS, "..", "orb", "tex")); os.makedirs(OUT, exist_ok=True)
PV = "https://raw.githubusercontent.com/pyvista/vtk-data/master/Data/solar_textures/"
SRC = {"sun": PV + "sun.jpg", "mercury": PV + "mercury.jpg", "venus": PV + "venus_atmosphere.jpg", "jupiter": PV + "jupiter.jpg",
       "saturn": PV + "saturn.jpg", "uranus": PV + "uranus.jpg", "neptune": PV + "neptune.jpg", "moon": PV + "moon.jpg",
       "earth": "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg"}
def get(url): return Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=90).read()))
for name, url in SRC.items():
    src = get(url).convert("RGB"); w, h = src.size
    east = Image.new("RGB", (w, h)); east.paste(src.crop((w // 2, 0, w, h)), (0, 0)); east.paste(src.crop((0, 0, w // 2, h)), (w - w // 2, 0))   # 180 W..180 E -> 0..360 E
    size = (512, 256) if name in ("sun", "uranus", "neptune", "venus") else (1024, 512)
    east.resize(size, Image.LANCZOS).save(os.path.join(OUT, name + ".jpg"), "JPEG", quality=86, optimize=True, progressive=True)
    print("wrote", name, os.path.getsize(os.path.join(OUT, name + ".jpg")) // 1024, "KB")
ring = get(PV + "saturn_ring_alpha.png").convert("RGBA")
ring.resize((512, 32), Image.LANCZOS).save(os.path.join(OUT, "saturn-ring.png"), optimize=True)
print("wrote saturn-ring", os.path.getsize(os.path.join(OUT, "saturn-ring.png")) // 1024, "KB")
