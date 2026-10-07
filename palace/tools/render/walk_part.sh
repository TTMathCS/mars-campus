#!/bin/bash
# The Crown walk, one part of the ring (36 degrees of rooms): bake it (walk_bake.py), pack it for the browser
# (walk_pack.mjs), and put it into the site: its chunks into palace/walk/data/, its walk.json and floor map into
# palace/walk/parts/ (walk_merge.py joins the parts into the whole ring; the first machine's autopub.py runs it).
#   bash blend/walk_part.sh <rooms> <tag> [spp] [push]       from the render folder (bvenv/, blend/, walk/node_modules)
#   e.g. bash blend/walk_part.sh suit,hangar,arrival p072 32
# push = 1: commit and push the part here (the second machine); otherwise the first machine's autopub.py pushes it.
set -e
ROOMS=$1; TAG=$2; SPP=${3:-32}; PUSH=${4:-0}
REPO=${MARS_REPO:-/home/user/mars-campus}
./bvenv/bin/python blend/walk_bake.py "$ROOMS" walk/$TAG $SPP 0.0125 6 all
rm -f walk/$TAG/far.glb                      # a part's own far.glb holds the rest of the ring: the whole walk has band.glb
cp blend/walk_pack.mjs walk/walk_pack.mjs      # beside walk/node_modules, where node finds its packages
rm -rf walk/$TAG.packed; (cd walk && node walk_pack.mjs $TAG $TAG.packed)
mkdir -p $REPO/palace/walk/data $REPO/palace/walk/parts
cp walk/$TAG.packed/c*.glb walk/$TAG.packed/c*_l.jpg $REPO/palace/walk/data/
cp walk/$TAG/walk.json $REPO/palace/walk/parts/$TAG.json; cp walk/$TAG/floor.png $REPO/palace/walk/parts/${TAG}_floor.png
echo "walk part $TAG ($ROOMS) in $REPO/palace/walk"
if [ "$PUSH" = "1" ]; then
  cd $REPO && git add palace/walk/data palace/walk/parts && git commit -q -m "Walk: part $TAG of the Crown ($ROOMS), baked and packed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && for w in 2 4 8 16 32; do git pull -q --rebase --autostash origin main && git push -q origin main && break; sleep $w; done
fi
