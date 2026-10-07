// The Crown photo walk: a path-traced 360 at every point of the plan (palace/tools/photowalk_plan.py, rendered by
// palace/tools/render/photowalk_render.py). Drag to look round; a click on the floor, or the arrow keys, walk to
// the next point: the camera glides there through the rooms' shapes (each point's depth map), the 360 left behind
// fading into the one ahead. Only one 360 is loaded at a time, a small one first, then the sharp one.
import * as THREE from 'three';
import { Pano, EYE, fromThree } from './pano.js';
import { RingMap } from '../walk/ringmap.js';

const $ = id => document.getElementById(id);
const D = Math.PI / 180;
const REACH = 11.5;              // the furthest point one steps to, metres
const START = 'C-04.2';          // the Arrival hall, where everyone arrives

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
const rtA = new THREE.WebGLRenderTarget(1, 1), rtB = new THREE.WebGLRenderTarget(1, 1);
const blend = new THREE.ShaderMaterial({
  uniforms: { a: { value: rtA.texture }, b: { value: rtB.texture }, t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D a, b; uniform float t; varying vec2 vUv; void main() { gl_FragColor = mix(texture2D(a, vUv), texture2D(b, vUv), t); }',
  depthTest: false, depthWrite: false,
});
const blendScene = new THREE.Scene(), flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
blendScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blend));

// the spots one can step to, as rings on the floor; and the ring under the pointer
const ringGeo = new THREE.RingGeometry(0.26, 0.36, 48).rotateX(-Math.PI / 2);
const marks = [];
function mark(i) {
  while (marks.length <= i) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
    m.renderOrder = 2; world.add(m); marks.push(m);
  }
  return marks[i];
}
const cursor = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 64).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false }));
cursor.renderOrder = 3; cursor.visible = false; world.add(cursor);

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const s = renderer.getDrawingBufferSize(new THREE.Vector2()); rtA.setSize(s.x, s.y); rtB.setSize(s.x, s.y);
}
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- where one is
let here = null, near = [], move = null, yaw = 0, pitch = 0, turn = 0, fov = 72, hint = true;
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
  if (here && here !== P && here.mesh) world.remove(here.mesh);
  here = P; world.add(P.mesh); P.mesh.visible = true;
  near = neighbours(P);
  near.forEach((n, i) => { const m = mark(i); m.position.set(n.Q.floor.x, n.Q.floor.y + 0.02, n.Q.floor.z); m.userData.n = n; });
  marks.forEach((m, i) => (m.visible = i < near.length && near[i].floor));
  named(P); history.replaceState(null, '', '#' + P.p.id);
  ringMap.draw(bearingOf(P), yaw);
  // the sharp picture here, then what is round about: small pictures and depth maps of every point in reach
  P.loadFull().then(() => { P.show(); renderer.initTexture(P.full); }).catch(() => {});
  for (const n of near) { n.Q.loadDepth().catch(() => {}); n.Q.loadSmall().catch(() => {}); }
  // keep the GPU's memory small: no sharp pictures but here's and the next one ahead, and only the 40 points
  // nearest loaded at all
  const next = ahead()?.Q;
  for (const Q of panos.values()) if (Q !== P && Q.full && Q !== next) Q.drop(false);
  const loaded = [...panos.values()].filter(Q => Q.small || Q.mesh);
  if (loaded.length > 40) {
    const far = Q => Math.hypot(Q.p.x - P.p.x, Q.p.y - P.p.y);
    loaded.sort((a, b) => far(b) - far(a)).slice(0, loaded.length - 40).forEach(Q => { if (Q !== P) Q.drop(true); });
  }
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

async function go(n) {
  if (!n || move) return;
  const Q = n.Q;
  try { await Promise.all([Q.loadDepth(), Q.full ? null : Q.loadSmall()]); } catch (e) { return; }
  Q.build(); Q.show(); world.add(Q.mesh);
  move = { A: here, B: Q, t0: performance.now(), ms: Math.min(1500, 650 + 85 * n.dist) };
  marks.forEach(m => (m.visible = false)); cursor.visible = false;
  if (hint) { hint = false; $('hint').classList.remove('on'); }
  Q.loadFull().then(() => Q.show()).catch(() => {});
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
    const [a, b] = [...pointers.values()]; fov = Math.max(30, Math.min(90, pinch.fov * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return;
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
canvas.addEventListener('wheel', e => { e.preventDefault(); fov = Math.max(30, Math.min(90, fov * Math.exp(e.deltaY * 0.001))); }, { passive: false });
addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.code === 'KeyW') go(ahead());
  else if (e.key === 'ArrowDown' || e.code === 'KeyS') go(ahead(true));
  else if (e.key === 'ArrowLeft' || e.code === 'KeyA') turn += 30 * D;
  else if (e.key === 'ArrowRight' || e.code === 'KeyD') turn -= 30 * D;
  else return;
  e.preventDefault();
});

// ---------------------------------------------------------------- each frame
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (turn) { const s = Math.sign(turn) * Math.min(Math.abs(turn), dt * 4.0); yaw += s; turn -= s; }
  camera.fov += (fov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix();
  camera.rotation.set(pitch, yaw, 0);
  if (move) {
    const t = Math.min(1, (now - move.t0) / move.ms), e = ease(t);
    camera.position.lerpVectors(move.A.eye, move.B.eye, e);
    // each 360 on its room's shape, seen from where one is on the way; the two mixed, the one ahead coming in
    move.B.mesh.visible = false; move.A.mesh.visible = true; renderer.setRenderTarget(rtA); renderer.render(world, camera);
    move.A.mesh.visible = false; move.B.mesh.visible = true; renderer.setRenderTarget(rtB); renderer.render(world, camera);
    renderer.setRenderTarget(null); blend.uniforms.t.value = Math.min(1, Math.max(0, (t - 0.12) / 0.7));
    renderer.render(blendScene, flat);
    if (t >= 1) { const B = move.B; move = null; arrive(B); }
  } else if (here) {
    camera.position.copy(here.eye);
    const tt = now / 1000;
    marks.forEach((m, i) => { if (m.visible) m.material.opacity = Math.max(0.35, 0.85 - near[i].dist * 0.04) * (0.85 + 0.15 * Math.sin(tt * 2.4)); });
    renderer.render(world, camera);
    ringMap.draw(bearingOf(here), yaw);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- the start: the small 360 at once, then the sharp one
async function start() {
  const want = decodeURIComponent(location.hash.slice(1));
  const P = panos.get(want) || panos.get(START) || panos.values().next().value;
  if (!P) return;
  yaw = -P.p.look * D;
  await Promise.all([P.loadDepth(), P.loadSmall()]);
  P.build(); await arrive(P);
  document.body.classList.add('on'); $('hint').classList.add('on');
  setTimeout(() => { if (hint) { hint = false; $('hint').classList.remove('on'); } }, 9000);
}
requestAnimationFrame(frame);
start();
