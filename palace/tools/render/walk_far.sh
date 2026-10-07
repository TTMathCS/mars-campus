#!/bin/bash
# the whole walk's far world: the Stone Garden and the Orb, the ring's band, the sky; packed and put into the site
set -e
REPO=${MARS_REPO:-/home/user/mars-campus}
./bvenv/bin/python blend/walk_bake.py far walk/far
cp blend/walk_pack.mjs walk/walk_pack.mjs; rm -rf walk/far.packed; (cd walk && node walk_pack.mjs far far.packed)
mkdir -p $REPO/palace/walk/data; cp walk/far.packed/far.glb walk/far.packed/band.glb walk/far.packed/sky.jpg $REPO/palace/walk/data/
echo "walk far, band and sky in $REPO/palace/walk/data"
