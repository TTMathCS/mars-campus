#!/usr/bin/env python3
"""Fill the campus region of page.html (between the CAMPUS markers) with the blocks in blocks/, in order.
Run after editing a block:  python3 ttmath/src/assemble.py  then  python3 ttmath/src/build.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
BLOCKS = ["blk_builder.js", "blk_p2data.js", "blk_mat.js", "blk_env.js", "blk_ground.js", "blk_rover.js", "blk_campus2.js",
          "blk_art2.js", "blk_palace2.js", "blk_plants.js", "blk_wings.js", "blk_backdoor.js", "blk_crescent.js", "blk_bake.js", "blk_build.js"]
path = os.path.join(HERE, "page.html")
src = open(path, encoding="utf-8").read()
A, Z = "/*@@CAMPUS_BEGIN@@*/", "/*@@CAMPUS_END@@*/"
i, j = src.index(A), src.index(Z)
body = "\n".join(open(os.path.join(HERE, "blocks", b), encoding="utf-8").read().rstrip() + "\n" for b in BLOCKS)
out = src[:i + len(A)] + "\n" + body + "  " + src[j:]
open(path, "w", encoding="utf-8").write(out)
print("assembled", len(BLOCKS), "blocks,", len(out.splitlines()), "lines")
