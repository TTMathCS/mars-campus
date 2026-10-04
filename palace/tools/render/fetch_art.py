"""Fetch the paintings hung on Arcadia's walls into palace/tools/render/assets/art/ and write art.json, the catalogue
art.py reads (what each work is, its size in pixels, its mood and colours, where it came from).
usage: python3 palace/tools/render/fetch_art.py [out_dir]

Only works in the public domain everywhere: the artist died before 1956 (so 70 years after the artist's death have
passed) and the work was made before 1931 (so it is out of copyright in the United States too). No photographs, no
living or recently dead artists. The museums' own sites cannot be reached from the render machines, so the copies are
the ones kept on GitHub by open-source projects (style-transfer examples, three.js); each entry names its source.
A crop (fractions of width and height: left, top, right, bottom) trims a watermark or a border off a copy."""
import io, json, os, sys, urllib.request
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "art")
GH = "https://raw.githubusercontent.com/"
NS = GH + "jcjohnson/neural-style/master/examples/inputs/"
FNS = GH + "jcjohnson/fast-neural-style/master/images/styles/"
FST = GH + "lengstrom/fast-style-transfer/master/examples/style/"
PT = GH + "gordicaleksa/pytorch-neural-style-transfer/master/data/style-images/"
GA = GH + "leongatys/NeuralImageSynthesis/master/Images/ControlPaper/"
AD = GH + "xunhuang1995/AdaIN-style/master/input/style/"
RAWPIXEL = (0.0, 0.0, 1.0, 0.937)              # the bottom strip carrying the "rawpixel" mark on their scans

# key: (title, artist, artist's life, made, year, mood, source, crop)
WORKS = {
    "vangogh_starry_night": ("The Starry Night", "Vincent van Gogh", "1853–1890", "1889", 1889, "night", NS + "starry_night_google.jpg", None),
    "vangogh_starry_night_rhone": ("Starry Night over the Rhône", "Vincent van Gogh", "1853–1890", "1888", 1888, "night", GA + "fig3_style1.jpg", None),
    "vangogh_night_cafe": ("The Night Café", "Vincent van Gogh", "1853–1890", "1888", 1888, "interior", PT + "vg_la_cafe.jpg", RAWPIXEL),
    "vangogh_wheat_field": ("Wheat Field with Cypresses", "Vincent van Gogh", "1853–1890", "1889", 1889, "landscape", PT + "vg_wheat_field.jpg", None),
    "vangogh_olive_trees": ("Olive Trees", "Vincent van Gogh", "1853–1890", "1889", 1889, "landscape", PT + "vg_olive.jpg", RAWPIXEL),
    "vangogh_cottages": ("Thatched cottages in the sun, Auvers", "Vincent van Gogh", "1853–1890", "1890", 1890, "landscape", PT + "vg_houses.jpg", (0.0, 0.0, 1.0, 0.961)),
    "vangogh_self_portrait": ("Self-Portrait with a Straw Hat", "Vincent van Gogh", "1853–1890", "1887", 1887, "portrait", PT + "vg_self.jpg", None),
    "monet_water_lilies": ("Water Lilies", "Claude Monet", "1840–1926", "1919", 1919, "landscape", GH + "titu1994/Neural-Style-Transfer/master/images/inputs/style/water-lilies-1919-2.jpg", None),
    "hokusai_great_wave": ("The Great Wave off Kanagawa", "Katsushika Hokusai", "1760–1849", "c. 1831", 1831, "print", FST + "wave.jpg", None),
    "turner_shipwreck": ("The Wreck of a Transport Ship (The Shipwreck of the Minotaur)", "J. M. W. Turner", "1775–1851", "c. 1810", 1810, "sea", FST + "the_shipwreck_of_the_minotaur.jpg", None),
    "caravaggio_basket_of_fruit": ("Basket of Fruit", "Caravaggio", "1571–1610", "c. 1599", 1599, "still life", GH + "mrdoob/three.js/dev/examples/textures/758px-Canestra_di_frutta_(Caravaggio).jpg", None),
    "claude_harbour": ("The Harbour with the Large Tower (etching)", "Claude Lorrain", "c. 1600–1682", "c. 1641", 1641, "print", GH + "reiinakano/arbitrary-image-stylization-tfjs/master/images/seaport.jpg", None),
    "matisse_woman_with_hat": ("Woman with a Hat", "Henri Matisse", "1869–1954", "1905", 1905, "portrait", NS + "woman-with-hat-matisse.jpg", None),
    "delaunay_landscape_disc": ("Landscape with Disc", "Robert Delaunay", "1885–1941", "1906–07", 1906, "landscape", GA + "fig5_style1.jpg", None),
    "delaunay_metzinger": ("Portrait of Jean Metzinger", "Robert Delaunay", "1885–1941", "1906", 1906, "portrait", GH + "zhanghang1989/PyTorch-Multi-Style-Transfer/master/experiments/images/21styles/Robert_Delaunay,_1906,_Portrait.jpg", None),
    "kandinsky_composition_vii": ("Composition VII", "Wassily Kandinsky", "1866–1944", "1913", 1913, "abstract", FNS + "composition_vii.jpg", None),
    "picabia_udnie": ("Udnie (Young American Girl, The Dance)", "Francis Picabia", "1879–1953", "1913", 1913, "abstract", FNS + "udnie.jpg", None),
    "picabia_edtaonisl": ("Edtaonisl (Ecclesiastic)", "Francis Picabia", "1879–1953", "1913", 1913, "abstract", PT + "edtaonisl.jpg", None),
    "leger_contrast_of_forms": ("Contrast of Forms", "Fernand Léger", "1881–1955", "1913", 1913, "abstract", AD + "contrast_of_forms.jpg", None),
    "mondrian_composition": ("Composition in yellow and grey", "Piet Mondrian", "1872–1944", "c. 1913", 1913, "abstract", AD + "mondrian.jpg", None),
}
MAX = 2048                                      # the longest side kept: a 4 m canvas seen from across a room needs no more


def palette(im, n=3):
    q = im.resize((96, 96)).quantize(colors=n, method=Image.Quantize.MEDIANCUT); pal = q.getpalette()[:3 * n]
    counts = sorted(q.getcolors(), reverse=True)
    return ["#%02x%02x%02x" % tuple(pal[3 * i:3 * i + 3]) for _, i in counts]


def main():
    os.makedirs(OUT, exist_ok=True); cat = []
    for key, (title, artist, life, made, year, mood, url, crop) in WORKS.items():
        path = os.path.join(OUT, key + ".jpg")
        if not os.path.exists(path):
            data = urllib.request.urlopen(url, timeout=120).read(); im = Image.open(io.BytesIO(data)).convert("RGB")
            if crop:
                w, h = im.size; im = im.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
            if max(im.size) > MAX:
                k = MAX / max(im.size); im = im.resize((round(im.size[0] * k), round(im.size[1] * k)), Image.LANCZOS)
            im.save(path, quality=92, optimize=True); print("got", key, im.size, flush=True)
        im = Image.open(path).convert("RGB"); w, h = im.size
        cat.append(dict(file=key + ".jpg", title=title, artist=artist, life=life, made=made, year=year, mood=mood, w_px=w, h_px=h,
                        aspect=round(w / h, 4), palette=palette(im), source_url=url,
                        public_domain="the artist died in %s, more than 70 years ago, and the work was made in %s, before 1931" % (life.split("–")[-1], made)))
    json.dump(cat, open(os.path.join(OUT, "art.json"), "w"), indent=1, ensure_ascii=False)
    print(len(cat), "paintings in", OUT)


if __name__ == "__main__":
    main()
