"""The Crown walk, the whole ring from its parts: walk_bake.py bakes the ring a part at a time (36 degrees of rooms in one
scene, on two machines), each part's chunks packed into palace/walk/data/ (walk_pack.mjs), its walk.json and floor map
kept as palace/walk/parts/p<NNN>.json and p<NNN>_floor.png. This joins them: one walk.json for the whole ring (every
chunk baked so far, every room, the start in the Arrival hall) and one floor map round the whole ring (where a part is
not baked yet, nobody can walk). far.glb, band.glb and sky.jpg come from `walk_bake.py far` (the Stone Garden and the
Orb, the ring's band, the sky).
  python3 palace/tools/render/walk_merge.py [palace/walk]"""
import glob, json, math, os, sys
from PIL import Image

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "walk"))
PARTS, DATA = os.path.join(ROOT, "parts"), os.path.join(ROOT, "data")


def main():
    parts = []
    for p in sorted(glob.glob(os.path.join(PARTS, "p*.json"))):
        info = json.load(open(p)); info["_floor"] = p.replace(".json", "_floor.png"); parts.append(info)
    if not parts: sys.exit("no parts in " + PARTS)
    F0 = parts[0]["floor"]; db, dr, h = F0["db"], F0["dr"], F0["h"]
    W = int(math.ceil(360.0 / db))
    floor = Image.new("L", (W, h), 0)
    chunks, rooms, start = {}, {}, None
    for info in parts:
        F = info["floor"]; im = Image.open(info["_floor"]).convert("L")
        assert abs(F["db"] - db) < 1e-12 and F["h"] == h and abs(F["dr"] - dr) < 1e-12, "parts' floor maps differ"
        i0 = int(round((F["b0"] % 360.0) / db))
        if i0 + im.width <= W: floor.paste(im, (i0, 0))
        else:                                     # a part that runs past north wraps round
            cut = W - i0; floor.paste(im.crop((0, 0, cut, h)), (i0, 0)); floor.paste(im.crop((cut, 0, im.width, h)), (0, 0))
        for c in info["chunks"]:
            if os.path.exists(os.path.join(DATA, c["file"])): chunks[c["file"]] = c
        for r in info["rooms"]: rooms[r["code"]] = r
        if "arrival" in info["parts"]: start = info["start"]
    first = parts[0]
    out = dict(sun=first["sun"], span=[0.0, 360.0], parts=[p for info in parts for p in info["parts"]],
               rooms=sorted(rooms.values(), key=lambda r: r["b0"]), exposure=first["exposure"], emax=first["emax"], vmax=first["vmax"],
               chunks=sorted(chunks.values(), key=lambda c: c["b0"]), step=first["step"],
               start=start or first["start"], floor=dict(file="floor.png", b0=0.0, db=db, r0=F0["r0"], dr=dr, w=W, h=h))
    floor.save(os.path.join(DATA, "floor.png"), optimize=True)
    json.dump(out, open(os.path.join(DATA, "walk.json"), "w"), indent=1)
    done = sum(c["b1"] - c["b0"] for c in out["chunks"])
    print("walk.json: %d parts, %d chunks (%.0f of 360 degrees), %d rooms; floor map %d x %d" % (len(parts), len(out["chunks"]), done, len(out["rooms"]), W, h))


if __name__ == "__main__":
    main()
