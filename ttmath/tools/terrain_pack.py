"""Pack the shared NASA terrain (data/terrain0.b64.txt, terrain1.b64.txt: 24 MB of base64) into one compact gzip file
the page loads first (Jim, 7 Oct 2026: "the ttmath loading slow. anyway to make loading faster?").

Per tile, in data/terrain_v2.bin.gz (each section 4-byte aligned in the unzipped buffer):
  positions  Uint16 x 3 per vertex on one grid of STEP metres for the whole map (so the tiles' shared edges stay
             exactly shared), as the tile's offset from its grid origin q0, delta coded along the vertex order
             (the difference wrapped to 16 bits, zigzag), exact to a quarter of a millimetre;
  uvs        Uint16 x 2 per vertex (u * 65535);
  indices    Uint16, delta coded as the positions;
  normals    Int8 x 3 per vertex, as before;
  image      the JPEG, as before.
The manifest gets a "terrain2" entry: the file, STEP, the sizes, and per tile n, i, lvl, min, max, q0, the sections'
offsets and the image's mean colour (so the page need not read the pictures back to find it). The old files stay: the
page falls back to them where the browser cannot unzip (no DecompressionStream).
usage: python3 ttmath/tools/terrain_pack.py   (needs numpy and Pillow)"""
import base64, gzip, io, json, os
import numpy as np
from PIL import Image

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
DATA = os.path.join(REPO, "data")
STEP = 0.0005
OUT = "terrain_v2.bin.gz"


def zig16(d):
    """A difference wrapped to signed 16 bits, then zigzag coded into 0..65535."""
    d = ((d + 32768) % 65536) - 32768
    return ((d << 1) ^ (d >> 63)) & 0xFFFF


def main():
    man = json.load(open(os.path.join(DATA, "manifest.json")))
    old = man["terrain"]
    chunks = [base64.b64decode(open(os.path.join(DATA, c)).read()) for c in old["chunks"]]
    out, tiles = bytearray(), []

    def put(b):
        while len(out) % 4: out.append(0)
        o = len(out); out.extend(b); return [o, len(b)]

    for t in old["tiles"]:
        buf = chunks[t["c"]]
        P = np.frombuffer(buf, np.float32, t["n"] * 3, t["o"][0][0]).reshape(-1, 3).astype(np.float64)
        UV = np.frombuffer(buf, np.float32, t["n"] * 2, t["o"][1][0]).reshape(-1, 2).astype(np.float64)
        assert not t["i32"], "32-bit indices are not packed"
        I = np.frombuffer(buf, np.uint16, t["i"], t["o"][2][0]).astype(np.int64)
        q0 = np.floor(P.min(0) / STEP).astype(np.int64)
        q = np.round(P / STEP).astype(np.int64) - q0
        assert q.min() >= 0 and q.max() < 65536
        dq = np.diff(q, axis=0, prepend=np.zeros((1, 3), np.int64))
        di = np.diff(I, prepend=0)
        img = bytes(buf[t["o"][4][0]:t["o"][4][0] + t["o"][4][1]])
        mean = (np.asarray(Image.open(io.BytesIO(img)).convert("RGB"), np.float64).mean(axis=(0, 1)) / 255.0).round(5).tolist()
        o = [put(zig16(dq).astype(np.uint16).tobytes()), put(np.round(np.clip(UV, 0, 1) * 65535).astype(np.uint16).tobytes()),
             put(zig16(di).astype(np.uint16).tobytes()), put(bytes(buf[t["o"][3][0]:t["o"][3][0] + t["o"][3][1]])), put(img)]
        tiles.append(dict(n=t["n"], i=t["i"], lvl=t["lvl"], min=t["min"], max=t["max"], q0=q0.tolist(), o=o, mean=mean))
    gz = gzip.compress(bytes(out), 9, mtime=0)
    open(os.path.join(DATA, OUT), "wb").write(gz)
    man["terrain2"] = dict(file=OUT, step=STEP, raw=len(out), gz=len(gz), tiles=tiles)
    json.dump(man, open(os.path.join(DATA, "manifest.json"), "w"), separators=(",", ":"))
    print("wrote %s: %d tiles, %.2f MB unzipped, %.2f MB zipped (the base64 chunks: %.2f MB)" % (
        OUT, len(tiles), len(out) / 1e6, len(gz) / 1e6, sum(os.path.getsize(os.path.join(DATA, c)) for c in old["chunks"]) / 1e6))


if __name__ == "__main__":
    main()
