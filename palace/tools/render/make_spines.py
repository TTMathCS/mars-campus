"""An atlas of 128 book spines for the libraries: cloth or leather bindings in real bookcloth colours, gold-stamped
bands and titles, some paper jackets. Titles are public-domain classics, science and books about Mars.
Writes spines.png (colour, 4096 x 4096: 32 columns x 4 rows of 128 x 1024 cells) and spines_gold.png (white where
the stamping is gold leaf), next to the other assets.
  python3 make_spines.py <assets dir>"""
import os, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets"
CW, CH, COLS, ROWS = 128, 1024, 32, 4
F = "/usr/share/fonts/truetype/"
SERIF = [F + "liberation/LiberationSerif-Bold.ttf", F + "freefont/FreeSerifBold.ttf", F + "liberation/LiberationSerif-Regular.ttf", F + "freefont/FreeSerif.ttf", F + "dejavu/DejaVuSerif-Bold.ttf"]
SANS = [F + "liberation/LiberationSans-Bold.ttf", F + "dejavu/DejaVuSans-Bold.ttf", F + "liberation/LiberationSans-Regular.ttf"]
BOOKS = [("THE WAR OF THE WORLDS", "WELLS"), ("THE TIME MACHINE", "WELLS"), ("THE FIRST MEN IN THE MOON", "WELLS"), ("MARS", "LOWELL"), ("MARS AS THE ABODE OF LIFE", "LOWELL"),
         ("A PRINCESS OF MARS", "BURROUGHS"), ("FROM THE EARTH TO THE MOON", "VERNE"), ("TWENTY THOUSAND LEAGUES", "VERNE"), ("THE MYSTERIOUS ISLAND", "VERNE"), ("MOBY-DICK", "MELVILLE"),
         ("PRIDE AND PREJUDICE", "AUSTEN"), ("EMMA", "AUSTEN"), ("WAR AND PEACE", "TOLSTOY"), ("ANNA KARENINA", "TOLSTOY"), ("THE ODYSSEY", "HOMER"), ("THE ILIAD", "HOMER"),
         ("DON QUIXOTE", "CERVANTES"), ("MIDDLEMARCH", "ELIOT"), ("GREAT EXPECTATIONS", "DICKENS"), ("BLEAK HOUSE", "DICKENS"), ("CRIME AND PUNISHMENT", "DOSTOEVSKY"),
         ("THE BROTHERS KARAMAZOV", "DOSTOEVSKY"), ("MADAME BOVARY", "FLAUBERT"), ("LES MISERABLES", "HUGO"), ("THE COUNT OF MONTE CRISTO", "DUMAS"), ("FRANKENSTEIN", "SHELLEY"),
         ("JANE EYRE", "BRONTE"), ("WUTHERING HEIGHTS", "BRONTE"), ("ULYSSES", "JOYCE"), ("DUBLINERS", "JOYCE"), ("THE DIVINE COMEDY", "DANTE"), ("HAMLET", "SHAKESPEARE"),
         ("THE TEMPEST", "SHAKESPEARE"), ("FAUST", "GOETHE"), ("ON THE ORIGIN OF SPECIES", "DARWIN"), ("PRINCIPIA", "NEWTON"), ("OPTICKS", "NEWTON"), ("ELEMENTS", "EUCLID"),
         ("TWO CHIEF WORLD SYSTEMS", "GALILEO"), ("ASTRONOMIA NOVA", "KEPLER"), ("THE WEALTH OF NATIONS", "SMITH"), ("MEDITATIONS", "MARCUS AURELIUS"), ("THE REPUBLIC", "PLATO"),
         ("THE ART OF WAR", "SUN TZU"), ("WALDEN", "THOREAU"), ("LEAVES OF GRASS", "WHITMAN"), ("TOM SAWYER", "TWAIN"), ("HUCKLEBERRY FINN", "TWAIN"), ("TREASURE ISLAND", "STEVENSON"),
         ("KIDNAPPED", "STEVENSON"), ("THE JUNGLE BOOK", "KIPLING"), ("KIM", "KIPLING"), ("ALICE IN WONDERLAND", "CARROLL"), ("THE PICTURE OF DORIAN GRAY", "WILDE"),
         ("HEART OF DARKNESS", "CONRAD"), ("LORD JIM", "CONRAD"), ("THE CALL OF THE WILD", "LONDON"), ("THE LOST WORLD", "DOYLE"), ("THE HOUND OF THE BASKERVILLES", "DOYLE"),
         ("SHERLOCK HOLMES", "DOYLE"), ("RELATIVITY", "EINSTEIN"), ("THE VOYAGE OF THE BEAGLE", "DARWIN"), ("COSMOS", "HUMBOLDT"), ("THE HISTORIES", "HERODOTUS"),
         ("THE AENEID", "VIRGIL"), ("METAMORPHOSES", "OVID"), ("PARADISE LOST", "MILTON"), ("GULLIVER'S TRAVELS", "SWIFT"), ("ROBINSON CRUSOE", "DEFOE"), ("CANDIDE", "VOLTAIRE"),
         ("THE PRINCE", "MACHIAVELLI"), ("UTOPIA", "MORE"), ("DRACULA", "STOKER"), ("THE SCARLET LETTER", "HAWTHORNE"), ("LITTLE WOMEN", "ALCOTT"), ("THE IDIOT", "DOSTOEVSKY"),
         ("FATHERS AND SONS", "TURGENEV"), ("DEAD SOULS", "GOGOL"), ("THE THREE MUSKETEERS", "DUMAS"), ("IVANHOE", "SCOTT"), ("VANITY FAIR", "THACKERAY"), ("SILAS MARNER", "ELIOT"),
         ("NORTHANGER ABBEY", "AUSTEN"), ("PERSUASION", "AUSTEN"), ("A TALE OF TWO CITIES", "DICKENS"), ("OLIVER TWIST", "DICKENS"), ("THE INVISIBLE MAN", "WELLS"),
         ("AROUND THE WORLD IN 80 DAYS", "VERNE"), ("THE ISLAND OF DR MOREAU", "WELLS"), ("SIDEREUS NUNCIUS", "GALILEO"), ("DE REVOLUTIONIBUS", "COPERNICUS"),
         ("A BRIEF ATLAS OF MARS", "NASA"), ("THE GEOLOGY OF MARS", ""), ("ARCADIA PLANITIA", "SURVEY"), ("THE RED PLANET", ""), ("NAVIGATION AND STARS", ""),
         ("POEMS", "KEATS"), ("POEMS", "DICKINSON"), ("SONNETS", "SHAKESPEARE"), ("ESSAYS", "MONTAIGNE"), ("ESSAYS", "EMERSON"), ("ESSAYS", "BACON"), ("CONFESSIONS", "AUGUSTINE"),
         ("THE CANTERBURY TALES", "CHAUCER"), ("BEOWULF", ""), ("THE KALEVALA", ""), ("ONE THOUSAND AND ONE NIGHTS", ""), ("THE TALE OF GENJI", "MURASAKI"), ("THE ANALECTS", "CONFUCIUS"),
         ("TAO TE CHING", "LAOZI"), ("SIDDHARTHA", "HESSE"), ("THE TRIAL", "KAFKA"), ("THE METAMORPHOSIS", "KAFKA"), ("BUDDENBROOKS", "MANN"), ("IN SEARCH OF LOST TIME", "PROUST"),
         ("THE MAGIC MOUNTAIN", "MANN"), ("NOSTROMO", "CONRAD"), ("THE AGE OF INNOCENCE", "WHARTON"), ("MY ANTONIA", "CATHER"), ("THE GREAT GATSBY", "FITZGERALD")]
# cloth and leather in the colours real bindings come in
CLOTH = [(92, 24, 22), (60, 18, 22), (30, 40, 78), (22, 52, 40), (120, 82, 36), (148, 132, 104), (24, 24, 26), (64, 62, 58), (98, 64, 38), (176, 166, 146),
         (28, 64, 66), (52, 34, 24), (130, 46, 24), (160, 150, 124), (36, 30, 42), (84, 92, 60), (112, 30, 40), (46, 58, 92), (196, 184, 160), (70, 44, 28)]
JACKET = [(232, 226, 210), (214, 196, 160), (40, 70, 110), (190, 80, 40), (60, 60, 60), (236, 214, 120), (120, 150, 140), (200, 120, 110)]


def font(paths, size):
    for p in paths:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def text_strip(txt, fnt, fill, height, max_len):
    """the title written along the spine, top to bottom, as on English books"""
    w = int(fnt.getlength(txt)) + 8; h = height
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im); d.text((4, 0), txt, font=fnt, fill=fill)
    if w > max_len: im = im.resize((max_len, h), Image.LANCZOS)
    return im.rotate(-90, expand=True)


def spine(rnd, title, author):
    col = Image.new("RGB", (CW, CH)); gold = Image.new("L", (CW, CH), 0)
    d = ImageDraw.Draw(col); g = ImageDraw.Draw(gold)
    jacket = rnd.random() < 0.28
    base = rnd.choice(JACKET if jacket else CLOTH)
    d.rectangle((0, 0, CW, CH), fill=base)
    # the grain of the cloth, or the paper's slight mottle
    px = col.load()
    for y in range(0, CH, 2):
        for x in range(0, CW, 2):
            n = rnd.randint(-7, 7) if not jacket else rnd.randint(-3, 3)
            c = tuple(max(0, min(255, v + n)) for v in base)
            px[x, y] = c
    col = col.filter(ImageFilter.GaussianBlur(0.8)); d = ImageDraw.Draw(col)
    ink = (20, 20, 22) if (jacket and sum(base) > 400) else (44, 32, 22) if sum(base) > 420 else None
    gold_col = (196, 156, 82)
    stamp = ink or gold_col
    def mark(box):
        d.rectangle(box, fill=stamp)
        if not ink: g.rectangle(box, fill=255)
    if not jacket:
        # raised bands and gold rules, top and bottom
        for y0 in (60, 110, CH - 120, CH - 70):
            mark((10, y0, CW - 10, y0 + 5))
    elif rnd.random() < 0.6:
        band = rnd.choice(CLOTH); d.rectangle((0, 720, CW, 900), fill=band)
    title_f = font(SERIF if rnd.random() < 0.8 else SANS, rnd.randint(54, 70))
    strip = text_strip(title, title_f, stamp + (255,), int(title_f.size * 1.25), 540)
    sx = (CW - strip.width) // 2; sy = 150 + (550 - strip.height) // 2
    col.paste(strip, (sx, sy), strip)
    if not ink: gold.paste(255, (sx, sy), strip.split()[3])
    if author:
        af = font(SERIF, 34); a = text_strip(author, af, stamp + (255,), 44, 150)
        ax = (CW - a.width) // 2; ay = 725 + (160 - a.height) // 2
        col.paste(a, (ax, ay), a)
        if not ink: gold.paste(255, (ax, ay), a.split()[3])
    # wear: a little darker towards the top and the edges, as books handled for years
    shade = Image.new("L", (CW, CH), 0); sd = ImageDraw.Draw(shade)
    for i in range(10): sd.rectangle((i, 0, CW - 1 - i, CH), outline=int(70 - 7 * i))
    col = Image.composite(Image.new("RGB", (CW, CH), (0, 0, 0)), col, shade.point(lambda v: v // 3))
    return col, gold


rnd = random.Random(1898)
atlas = Image.new("RGB", (CW * COLS, CH * ROWS)); gmask = Image.new("L", (CW * COLS, CH * ROWS), 0)
order = BOOKS[:]; rnd.shuffle(order)
for i in range(COLS * ROWS - 1):
    t, a = order[i % len(order)]
    c, g = spine(rnd, t, a)
    x, y = (i % COLS) * CW, (i // COLS) * CH
    atlas.paste(c, (x, y)); gmask.paste(g, (x, y))
# the last cell: the edges of the pages, cream with fine lines, for the tops and bottoms of the books
pg = Image.new("RGB", (CW, CH), (226, 216, 192)); pd = ImageDraw.Draw(pg)
for y in range(0, CH, 3): pd.line((0, y, CW, y), fill=(206 + rnd.randint(-8, 8), 196, 172))
atlas.paste(pg, ((COLS - 1) * CW, (ROWS - 1) * CH))
os.makedirs(OUT, exist_ok=True)
atlas.save(os.path.join(OUT, "spines.png"), optimize=True); gmask.save(os.path.join(OUT, "spines_gold.png"), optimize=True)
print("wrote", os.path.join(OUT, "spines.png"), atlas.size)
