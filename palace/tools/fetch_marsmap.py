"""Make palace/design/img/mars-map.jpg, the real Mars colour map that the design book's map figures and the
Mars Atlas show underneath the NASA tiles (Viking MDIM 2.1 via Esri OnMars), so they still look real when the
tiles can't be reached (offline, a blocked network, or the tile service down).
Source: the Solar System Scope Mars texture (https://www.solarsystemscope.com/textures/, CC BY 4.0, based on NASA
imagery), fetched from the PyVista example-data mirror on GitHub, which states that licence.
usage: python3 palace/tools/fetch_marsmap.py
writes palace/design/img/mars-map.jpg (2048 x 1024, equirectangular, 0 to 360 E, north up)"""
import io, os, urllib.request
from PIL import Image
TOOLS = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(TOOLS, "..", "design", "img", "mars-map.jpg"))
URL = "https://raw.githubusercontent.com/pyvista/vtk-data/master/Data/solar_textures/mars.jpg"
src = Image.open(io.BytesIO(urllib.request.urlopen(URL, timeout=60).read())).convert("RGB")   # 180 W to 180 E
w, h = src.size
east = Image.new("RGB", (w, h)); east.paste(src.crop((w // 2, 0, w, h)), (0, 0)); east.paste(src.crop((0, 0, w // 2, h)), (w - w // 2, 0))   # 0 to 360 E
east.resize((2048, 1024), Image.LANCZOS).save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")
