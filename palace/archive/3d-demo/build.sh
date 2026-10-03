#!/bin/sh
# Builds palace/archive/3d-demo/index.html (the archived real-time 3D demo, phase 1) from src/.
# "./build.sh debug" writes palace-debug.html instead, with window.__crownDebug set so the page keeps its
# drawing buffer and exposes window.__crown for the headless tests in tools/.
cd "$(dirname "$0")"
OUT=index.html; DBG=""
[ "$1" = debug ] && OUT=palace-debug.html && DBG='<script>window.__crownDebug = true;</script>'
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="color-scheme" content="dark">\n<meta name="theme-color" content="#0b0706">\n<link rel="icon" href="../../../favicon.svg" type="image/svg+xml">\n'
  cat src/00_head.html
  printf '%s\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n(function () {\n' "$DBG"
  for f in src/[1-9]*.js; do cat "$f"; printf '\n'; done
  printf '})();\n</script>\n</body>\n</html>\n'
} > "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
