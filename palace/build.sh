#!/bin/sh
# Builds palace/index.html from src/. "./build.sh debug" writes palace-debug.html instead,
# with a viewport meta, a window.__arc test hook and a window.__warp time multiplier.
cd "$(dirname "$0")"
OUT=index.html; [ "$1" = debug ] && OUT=palace-debug.html
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="color-scheme" content="dark">\n<link rel="icon" href="../favicon.svg" type="image/svg+xml">\n'
  cat src/a_head.html
  printf '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n'
  cat src/b_core.js src/c_tex.js src/c_build.js src/d_palace.js src/d_gate.js src/d_deep1.js src/d_deep2.js src/d_deep3.js src/d_stops.js src/d_port.js src/e1_post.js src/e2_world.js src/e3_journey.js src/e4_journey.js
  if [ "$1" = debug ]; then sed 's|^  runStep();$|  window.__arc = { scene: scene, ZG: ZG, camera: camera, goStop: goStop, setCut: setCut, setTime: setTime, state: state, M: M, renderer: renderer, sun: sun, hemi: hemi, cam: cam, walk: walk, startWalk: startWalk, beginWalk: beginWalk, STOPS: STOPS, STOP: STOP, POST: POST, J: function () { return J; }, startJourney: startJourney, finishJourney: finishJourney, TAXI: TAXI, VEH: VEH, GATE: GATE, rideLift: rideLift, interact: interact, TVOBJ: TVOBJ, tvSet: tvSet, INTER: INTER, keys: keys, setZones: setZones, levelAt: levelAt, BUCKETS: BUCKETS, openReader: openReader, READ: READ, renderReader: renderReader, setEnv: setEnv, LVY: LVY, AC: AC, GH: GH, buildPlan: buildPlan, setPlan: setPlan, near: function () { return near; }, sitDown: sitDown, DEEPDYN: DEEPDYN, curLv: function () { return curLv; }, gw: gw, CARS: CARS, LIFTS: LIFTS, openLiftPanel: openLiftPanel, standUp: standUp };\n  runStep();|' src/e5_ui.js | sed 's|var raw = Math.min(clock.getDelta(), 0.1), dt = Math.min(raw, 0.05);|var raw = Math.min(clock.getDelta(), 0.1) * (window.__warp \|\| 1), dt = Math.min(raw, 0.05 * (window.__warp \|\| 1));|'; else cat src/e5_ui.js; fi
  printf '</script>\n</body>\n</html>\n'; } > "$OUT"
echo "wrote $OUT"
