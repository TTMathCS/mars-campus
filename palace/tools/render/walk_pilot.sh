#!/bin/bash
# A test bake of one part of the walk with the pictures' own plants (every leaf the 360s have) and furniture hardly
# simplified, into walk/<tag> and walk/<tag>.packed only (not the site): bash blend/walk_pilot.sh <rooms> <tag> [spp]
set -e
ROOMS=$1; TAG=$2; SPP=${3:-24}
REPO=${MARS_REPO:-/home/user/mars-campus}
cp $REPO/palace/tools/render/*.py $REPO/palace/tools/render/*.mjs blend/ 2>/dev/null || true
WALK_DETAIL=1.0 WALK_MAX_LEAVES=10000000 WALK_MAX_FACES=60000 ./bvenv/bin/python blend/walk_bake.py "$ROOMS" walk/$TAG $SPP 0.0125 6 all
rm -f walk/$TAG/far.glb
cp blend/walk_pack.mjs walk/walk_pack.mjs
rm -rf walk/$TAG.packed; (cd walk && node walk_pack.mjs $TAG $TAG.packed)
ls -la walk/$TAG.packed
