// The Crown photo walk: a path-traced 360 at every point of the plan (palace/tools/photowalk_plan.py, rendered by
// palace/tools/render/photowalk_render.py). Drag to look round; a click on the floor, or the arrow keys, walk to
// the next point: the camera glides there through the rooms' shapes (each point's depth map), each surface taking
// its colour from the 360s that see it (pano.js). Only one 360 is loaded at a time, a small one first, then the
// sharp one.
import * as THREE from 'three';
import { Pano, EYE, fromThree, stepping } from './pano.js';
import { RingMap } from '../walk/ringmap.js';

const $ = id => document.getElementById(id);
const D = Math.PI / 180;
const REACH = 11.5;              // the furthest point one steps to, metres
const START = 'C-04.2';          // the Arrival hall, where everyone arrives
const SLOW = /[?&]slow/.test(location.search) ? 8 : 1;     // (to look at a step frame by frame)

const plan = await (await fetch('plan.json')).json();
// the points rendered so far: each of the two machines that render them keeps its own list
const lists = await Promise.allSettled(['a', 'b'].map(m => fetch('v/index_' + m + '.json', { cache: 'no-cache' }).then(r => r.json())));
const ready = lists.flatMap(l => (l.status === 'fulfilled' ? l.value.ready : []));
const panos = new Map(plan.points.filter(p => ready.includes(p.id)).map(p => [p.id, new Pano(p, 'v/')]));

// ---------------------------------------------------------------- drawing
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const world = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 2000); camera.rotation.order = 'YXZ';
renderer.setClearColor(0x2a2420);
const behind = new THREE.Scene();      // while stepping: the nearer point's whole shape, drawn first, behind the torn ones

// the spots one can step to, as rings on the floor; and the ring under the pointer
const ringGeo = new THREE.RingGeometry(0.26, 0.36, 48).rotateX(-Math.PI / 2);
const marks = [];
function mark(i) {
  while (marks.length <= i) {
    // drawn over the room (the room's shape is too coarse for a ring on the floor), only for spots one sees
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, depthTest: false }));
    m.renderOrder = 2; world.add(m); marks.push(m);
  }
  return marks[i];
}
const cursor = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 64).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false }));
cursor.renderOrder = 3; cursor.visible = false; world.add(cursor);

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- where one is
let here = null, near = [], move = null, yaw = 0, pitch = 0, fov = 72, hint = true, zoomed = false;
// the view spans 90 degrees across the screen at rest, as wide on a phone held upright as it can without bending
// the room (Jim, 7 Oct 2026: "the view is so close view. i need to bit far and zoom out"), and narrows to 72 while
// one walks: a wide view stretches and swings what is at its edges as it moves ("while walking, the 3d angles looks
// really strange, and distorted"); one zooms from 25 to 115 degrees up and down
const WIDE = 90 * D, WALKING = 72 * D, FOV_MIN = 25, FOV_MAX = 115;
const fovFor = h => Math.max(50, Math.min(100, 2 * Math.atan(Math.tan(h / 2) / camera.aspect) / D));
const fovFit = () => fovFor(WIDE);
addEventListener('resize', () => { if (!zoomed) fov = fovFit(); });
const ringMap = new RingMap($('map'), spans());

function spans() {        // the stretches of the ring with points ready, for the map
  const by = {};
  for (const P of panos.values()) { const s = plan.scenes.find(x => x[0] === P.p.scene); if (s) by[s[0]] = [s[1], s[2]]; }
  return Object.values(by);
}

function bearingOf(P) { return (Math.atan2(P.p.x, P.p.y) / D + 360) % 360; }

function neighbours(P) {
  // the points one sees from here, at eye height, near enough to step to
  const out = [];
  for (const Q of panos.values()) {
    if (Q === P) continue;
    const dx = Q.p.x - P.p.x, dy = Q.p.y - P.p.y, dist = Math.hypot(dx, dy);
    if (dist > REACH || dist < 0.3) continue;
    if (P.depth([dx / dist, dy / dist, 0]) < dist - 0.4) continue;
    const fl = Math.hypot(dist, EYE);
    out.push({ Q, dist, dx, dy, floor: P.depth([dx / fl, dy / fl, -EYE / fl]) >= fl - 0.5 });
  }
  return out;
}

let shown = '', nameT = 0;
function named(P) {
  const name = plan.rooms[P.p.room] || '';
  if (name === shown) return;
  shown = name; $('where').textContent = name; $('where').classList.add('on'); clearTimeout(nameT);
  nameT = setTimeout(() => $('where').classList.remove('on'), 3500);
}

async function arrive(P) {
  if (here && here !== P && here.mesh) { world.remove(here.mesh); world.remove(here.torn); }
  if (P.torn) world.remove(P.torn);
  here = P; world.add(P.mesh);
  near = neighbours(P);
  near.forEach((n, i) => { const m = mark(i); m.position.set(n.Q.floor.x, n.Q.floor.y + 0.02, n.Q.floor.z); m.userData.n = n; });
  marks.forEach((m, i) => (m.visible = i < near.length && near[i].floor));
  named(P); history.replaceState(null, '', '#' + P.p.id);
  ringMap.draw(bearingOf(P), yaw);
  // the sharp picture here, then what is round about: small pictures and depth maps of every point in reach
  P.loadFull().then(() => {
    if (here !== P) return;
    P.show(); renderer.initTexture(P.full); prefetch();
  }).catch(() => {});
  for (const n of near) { n.Q.loadDepth().catch(() => {}); n.Q.loadSmall().catch(() => {}); }
  // keep the GPU's memory small: no sharp pictures but here's and the next one ahead, and only the 40 points
  // nearest loaded at all
  const next = ahead()?.Q;
  for (const Q of panos.values()) if (Q !== P && Q.full && Q !== next) Q.drop(false);
  prefetched = next && next.full ? next : null;
  const loaded = [...panos.values()].filter(Q => Q.small || Q.mesh);
  if (loaded.length > 40) {
    const far = Q => Math.hypot(Q.p.x - P.p.x, Q.p.y - P.p.y);
    loaded.sort((a, b) => far(b) - far(a)).slice(0, loaded.length - 40).forEach(Q => { if (Q !== P) Q.drop(true); });
  }
}

// the sharp picture of the point straight ahead, loaded while one looks round, so the next step lands sharp (one
// at a time: the one before is let go)
let prefetched = null;
function prefetch() {
  const n = ahead(); if (!n || n.Q === prefetched || move) return;
  if (prefetched && prefetched !== here && prefetched.full) prefetched.drop(false);
  prefetched = n.Q; n.Q.loadFull().then(() => n.Q.full && renderer.initTexture(n.Q.full)).catch(() => {});
}

function ahead(back = false) {
  // the point most nearly straight ahead (or behind), within 40 degrees
  const fx = -Math.sin(yaw) * (back ? -1 : 1), fy = Math.cos(yaw) * (back ? -1 : 1);
  let best = null, score = Infinity;
  for (const n of near) {
    const a = Math.acos(Math.max(-1, Math.min(1, (n.dx * fx + n.dy * fy) / n.dist)));
    const s = n.dist * (1 + 3 * a);
    if (a < 40 * D && s < score) { score = s; best = n; }
  }
  return best;
}

// a step: once the next point's sharp picture is in (or after 2.5 s, its small one), the camera walks there at
// the pace of a walk, 1.4 m/s once under way (Jim, 7 Oct 2026: "when i walk, it moves too fast. and I can see the slow
// rendering of objects in slow motion"); the two 360s change over in the middle of the step, quickly. Held, W or the
// up arrow walk on from point to point without stopping ("w walk is not smooth"): the next point ahead is loaded
// while one walks to this one, and the step runs straight into the next
const SPEED = 1.4 / SLOW, ACCEL = 1.6 / SLOW;                  // m/s, m/s/s: the pace of a walk, so the next point is in
const held = new Set();
const walking = () => held.has('KeyW') || held.has('ArrowUp') ? 1 : held.has('KeyS') || held.has('ArrowDown') ? -1 : 0;
let going = null;
const inHand = Q => Q.dist && (Q.full || Q.small);
function loadFor(Q) {
  return Promise.all([Q.loadDepth(), Q.loadSmall()]).then(() => Promise.race([Q.loadFull(), new Promise(r => setTimeout(r, 2500))]));
}
async function go(n, v0 = 0) {
  if (!n || move || going) return;
  const Q = n.Q; going = Q;
  cursor.position.set(Q.floor.x, Q.floor.y + 0.02, Q.floor.z); cursor.visible = true;      // where one is going, while it loads
  try { await loadFor(Q); } catch (e) { going = null; return; }
  going = null;
  if (!move) begin(Q, v0);
}
function begin(Q, v0) {
  Q.build(); Q.show();
  world.remove(here.mesh); world.add(here.torn); world.add(Q.torn);       // both shapes, torn at near things' edges
  const L = here.eye.distanceTo(Q.eye);
  move = { A: here, B: Q, L, s: 0, v: v0, next: null, way: walking() };
  marks.forEach(m => (m.visible = false)); cursor.visible = false;
  if (hint) { hint = false; $('hint').classList.remove('on'); }
  Q.loadFull().then(() => Q.show()).catch(() => {});
  // where one would walk on to from there, loaded now
  if (move.way) {
    const fx = -Math.sin(yaw) * move.way, fy = Math.cos(yaw) * move.way; let best = null, score = Infinity;
    for (const m of neighbours(Q)) {
      if (m.Q === here) continue;
      const a = Math.acos(Math.max(-1, Math.min(1, (m.dx * fx + m.dy * fy) / m.dist))), sc = m.dist * (1 + 3 * a);
      if (a < 40 * D && sc < score) { score = sc; best = m; }
    }
    if (best) { move.next = best.Q; loadFor(best.Q).catch(() => {}); }
  }
}

// ---------------------------------------------------------------- looking and walking
const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
function floorAt(ev) {
  // what the pointer is on, from the depth map: the point in the room, and whether it is floor
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const d = ray.ray.direction, dist = here.depth(fromThree(d));
  if (!isFinite(dist)) return null;
  const hit = here.eye.clone().addScaledVector(d, dist);
  return { hit, d, floor: hit.y < here.floor.y + 0.3 };
}

function pick(ev) {
  const f = floorAt(ev); if (!f) return null;
  // the step whose spot is nearest where one clicked (on the floor, or under what one clicked)
  let best = null, bd = 3.0;
  for (const n of near) {
    const e = Math.hypot(n.Q.floor.x - f.hit.x, n.Q.floor.z - f.hit.z);
    if (e < bd) { bd = e; best = n; }
  }
  if (best) return best;
  // else the step most nearly in the direction one clicked
  const fx = f.d.x, fy = -f.d.z, l = Math.hypot(fx, fy) || 1; let sa = 20 * D;
  for (const n of near) {
    const a = Math.acos(Math.max(-1, Math.min(1, (n.dx * fx + n.dy * fy) / (n.dist * l))));
    if (a < sa) { sa = a; best = n; }
  }
  return best;
}

const pointers = new Map(); let drag = null, pinch = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), fov }; drag = null; }
  else drag = { x: e.clientX, y: e.clientY, moved: 0 };
  canvas.classList.add('drag');
});
canvas.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId);
  if (p) { p.x = e.clientX; p.y = e.clientY; }
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()]; zoomed = true;
    fov = Math.max(FOV_MIN, Math.min(FOV_MAX, pinch.fov * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return;
  }
  if (drag && p) {
    const k = (fov * D) / canvas.clientHeight, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    yaw += dx * k; pitch = Math.max(-85 * D, Math.min(85 * D, pitch + dy * k)); drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy); cursor.visible = false; return;
  }
  if (!move && here && e.pointerType === 'mouse') {
    const f = floorAt(e);
    cursor.visible = !!(f && f.floor);
    if (cursor.visible) cursor.position.set(f.hit.x, here.floor.y + 0.02, f.hit.z);
  }
});
function up(e) {
  pointers.delete(e.pointerId);
  if (pinch) { if (pointers.size < 2) pinch = null; drag = null; }
  else if (drag && drag.moved < 6 && here) go(pick(e));
  if (!pointers.size) { drag = null; canvas.classList.remove('drag'); }
}
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomed = true; fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov * Math.exp(e.deltaY * 0.001))); }, { passive: false });
const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
addEventListener('keydown', e => {
  const k = KEYS.includes(e.code) ? e.code : null; if (!k) return;
  e.preventDefault(); held.add(k);
  if (!move && (k === 'KeyW' || k === 'ArrowUp')) go(ahead());
  else if (!move && (k === 'KeyS' || k === 'ArrowDown')) go(ahead(true));
});
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', () => held.clear());

// ---------------------------------------------------------------- each frame
let last = performance.now(), lookT = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;      // (a slow machine still walks at the pace of a walk)
  const tl = (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0) - (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0);
  yaw += tl * dt * 1.4;                                        // A and D turn, 80 degrees a second
  const want = move ? Math.min(fov, fovFor(WALKING)) : fov;
  camera.fov += (want - camera.fov) * Math.min(1, dt * (move ? 3 : 4)); camera.updateProjectionMatrix();
  camera.rotation.set(pitch, yaw, 0);
  if (move) {
    // on at walking pace; slowing to a stop at the point, unless one walks on and the next point is in
    const on = move.next && move.way && walking() === move.way && inHand(move.next);
    const left = move.L - move.s;
    if (!on && left <= move.v * move.v / (2 * ACCEL) + 0.02) move.v = Math.max(0.25 / SLOW, move.v - ACCEL * dt);
    else move.v = Math.min(SPEED, move.v + ACCEL * dt);
    move.s = Math.min(move.L, move.s + move.v * dt);
    const t = move.s / move.L;
    camera.position.lerpVectors(move.A.eye, move.B.eye, t);
    // both points' shapes, each surface coloured by the 360s that see it, the one ahead coming in
    const c = Math.min(1, Math.max(0, (t - 0.32) / 0.36)); stepping(move.A, move.B, c * c * (3 - 2 * c));
    const back = t < 0.5 ? move.A.back : move.B.back;
    if (back.parent !== behind) { behind.clear(); behind.add(back); }
    renderer.autoClear = false; renderer.clear(); renderer.render(behind, camera); renderer.clearDepth();
    renderer.render(world, camera); renderer.autoClear = true;
    if (t >= 1) {
      const B = move.B, N = on ? move.next : null, v = move.v; move = null; arrive(B);
      if (N) begin(N, v);                                      // straight on into the next step
    }
  } else if (here) {
    camera.position.copy(here.eye);
    if (going) cursor.material.opacity = 0.45 + 0.35 * Math.sin(now / 160); else cursor.material.opacity = 0.8;
    if ((lookT += dt) > 0.6) { lookT = 0; if (here.full) prefetch(); }
    const tt = now / 1000;
    marks.forEach((m, i) => { if (m.visible) m.material.opacity = Math.max(0.35, 0.85 - near[i].dist * 0.04) * (0.85 + 0.15 * Math.sin(tt * 2.4)); });
    renderer.render(world, camera);
    ringMap.draw(bearingOf(here), yaw);
  }
  requestAnimationFrame(frame);
}

// the most open way from a point, at eye level: where the room runs furthest (over 30 degrees, so not a doorway's
// slot), as a bearing
function openWay(P) {
  const n = 144, far = [], low = Math.cos(12 * D), dz = -Math.sin(12 * D);
  for (let k = 0; k < n; k++) {          // at eye height and a little below (a banquette, a table), every 2.5 degrees
    const a = k / n * 2 * Math.PI, x = Math.sin(a), y = Math.cos(a);
    far.push(Math.min(60, P.depth([x, y, 0]), P.depth([x * low, y * low, dz]) * low));
  }
  let best = 0, score = -1;
  for (let k = 0; k < n; k++) {          // the least open within 20 degrees either side: a trunk in the middle counts
    let m = Infinity; for (let d = -8; d <= 8; d++) m = Math.min(m, far[(k + d + n) % n]);
    if (m > score) { score = m; best = k; }
  }
  return best / n * 360;
}

// ---------------------------------------------------------------- the start: the small 360 at once, then the sharp one
async function start() {
  const want = decodeURIComponent(location.hash.slice(1));
  const P = panos.get(want) || panos.get(START) || panos.values().next().value;
  if (!P) return;
  fov = fovFit(); camera.fov = fov; camera.updateProjectionMatrix();
  await P.loadDepth();
  yaw = -(P.p.stop ? P.p.look : openWay(P)) * D;     // a tour stop looks at its room's view; any other point into the room
  await Promise.all([P.loadDepth(), P.loadSmall()]);
  P.build(); await arrive(P);
  if (matchMedia('(pointer: coarse)').matches) $('hint').textContent = 'Drag to look round \u00b7 pinch to zoom \u00b7 tap the floor to walk';
  document.body.classList.add('on'); $('hint').classList.add('on');
  setTimeout(() => { if (hint) { hint = false; $('hint').classList.remove('on'); } }, 9000);
}
requestAnimationFrame(frame);
start();
