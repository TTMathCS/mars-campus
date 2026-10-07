// The Crown walk: first person round the Crown of Arcadia, 41 m above the plain. The rooms come from walk_bake.py
// (palace/tools/render): Cycles baked each surface's colour and the light falling on it (the sun through the slots,
// the coves, the lamps, every bounce), and the browser multiplies them and tone-maps them with AgX, the pictures'
// curve. What changes as one walks is drawn here: the reflections in the polished floors, the metal and the Orb, the
// Stone Garden and the rest of the ring outside, and the walker (walker.js), on foot or carried along the Glide.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { D, R_GL, R_OUT, ORB_Y, P } from './ring.js';
import { Walker, floorMap } from './walker.js';
import { FloorMirror } from './mirror.js';
import { Sound } from './sound.js';
import { RingMap } from './ringmap.js';
import { Chunks, centreOf, apart } from './chunks.js';

const DATA = 'data/';
const canvas = document.getElementById('view');
const startEl = document.getElementById('start'), goEl = document.getElementById('go'), barEl = document.getElementById('bar');
const whereEl = document.getElementById('where');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;          // the pictures' curve; their exposure comes from walk.json
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30000);
camera.rotation.order = 'YXZ';
const mirror = new FloorMirror(renderer, scene, 0.0);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const pr = renderer.getPixelRatio(); mirror.setSize(w * pr, h * pr);
}
window.addEventListener('resize', resize); resize();

// ------------------------------------------------------------------ loading
const info = await (await fetch(DATA + 'walk.json')).json();
renderer.toneMappingExposure = 2 ** info.exposure;
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();
const aniso = renderer.capabilities.getMaxAnisotropy();
const whole = info.span[1] - info.span[0] > 359.9;                      // the whole ring: rooms stream in and out
const view = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
const startB = +(view.b ?? info.start.b);
const START_NEAR = 7;                                                   // degrees: the chunk one stands in and its nearest neighbour
let done = 0; const total = info.chunks.filter(c => apart(centreOf(c), startB) <= START_NEAR).length + 3 + (whole ? 1 : 0);
const progress = () => { done++; barEl.style.width = (100 * Math.min(done, total) / total).toFixed(0) + '%'; };

// the baked surfaces: their colour (in the chunk) times the light on them (the chunk's light map: light / emax,
// sRGB-encoded), as three.js's basic material does with a light map: colour * light * intensity / pi
const metals = new Set(), orbParts = [];
let roomEnv = null;
function material(m, light) {
  const kind = (m.userData && m.userData.walk) || 'baked';
  if (kind === 'baked' || kind === 'floor') {
    if (m.map) { m.map.anisotropy = aniso; m.map.colorSpace = THREE.SRGBColorSpace; }
    const bm = new THREE.MeshBasicMaterial({ map: m.map, lightMap: light, lightMapIntensity: Math.PI * info.emax, side: THREE.DoubleSide });
    return kind === 'floor' ? mirror.material(bm, m.userData.rough ?? 0.3) : bm;
  }
  if (kind === 'vertex') return new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(info.vmax, info.vmax, info.vmax), side: THREE.DoubleSide });
  if (kind === 'glow') { const e = m.userData.emit || [4, 3, 2]; return new THREE.MeshBasicMaterial({ color: new THREE.Color(e[0], e[1], e[2]) }); }
  if (kind === 'metal') {
    const mm = new THREE.MeshStandardMaterial({ color: m.color, metalness: 1.0, roughness: Math.min(0.6, Math.max(0.18, m.userData.rough ?? 0.35)), envMap: roomEnv });
    metals.add(mm); mm.addEventListener('dispose', () => metals.delete(mm)); return mm;
  }
  if (kind === 'glass') return new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false });
  // the switchable glass onto the Glide: frosted (milky, the light through it soft), or tinted almost black
  if (kind === 'frosted') return new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.60, 0.57), transparent: true, opacity: 0.88, depthWrite: false, side: THREE.DoubleSide });
  if (kind === 'dark') return new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.022, 0.025), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  if (kind === 'water') return mirror.material(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.10, 0.24, 0.25), transparent: true, depthWrite: false }), 0.02, true);
  return m;
}
function convert(root, light) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.material = material(o.material, light);
    if (o.material.userData.mirror !== undefined) mirror.hide.push(o);         // a floor is not in its own reflection
    o.matrixAutoUpdate = false; o.updateMatrix();
  });
}

const skyReady = texLoader.loadAsync(DATA + 'sky.jpg').then(t => {
  t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t; scene.backgroundRotation.set(0, -Math.PI / 2, 0); progress();
});
const floorOk = await floorMap(DATA + info.floor.file, info.floor); progress();

// the rooms, baked, in chunks of the ring: those round the walker loaded, the rest let go
const chunks = new Chunks({ chunks: info.chunks, loader, texLoader, scene, convert, mirror, aniso });
const ringOrder = [...info.chunks].sort((p, q) => p.b0 - q.b0);
const loadedAt = b => { const c = ringOrder.find(c => ((b - c.b0) % 360 + 360) % 360 < c.b1 - c.b0); return !!(c && chunks.state.get(c.file)?.group); };
const canStand = (x, z) => floorOk(x, z) && loadedAt(((Math.atan2(x, -z) / D) % 360 + 360) % 360);   // never into a room not yet there
await chunks.around(startB, progress, START_NEAR);                      // the rest of the ring streams in as one walks (chunks.update)

// outside: the rest of the ring, the Stone Garden 41 m down, the Orb, lit by the afternoon sun and the Mars sky
const sunDir = (() => { const a = info.sun.az * D, e = info.sun.el * D; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); })();
const sun = new THREE.DirectionalLight(0xffdcb0, 6.0); sun.position.copy(sunDir).multiplyScalar(1000); scene.add(sun);
scene.add(new THREE.HemisphereLight(0xc78a5a, 0x2a160c, 1.1));
// the rest of the ring, seen across the garden: white ceramic with its windows, 0.5 to 3.0 m above the floor, 5 m
// open in every 8 m along the inner wall (as crown.py), dark glass by day
function slotted(m, cut = null) {
  m.onBeforeCompile = sh => {
    if (cut) { sh.uniforms.clipLo = cut.lo; sh.uniforms.clipSpan = cut.span; }
    sh.vertexShader = 'varying vec3 vSlotWorld;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n\tvSlotWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
    sh.fragmentShader = 'varying vec3 vSlotWorld;\nuniform float clipLo;\nuniform float clipSpan;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	float slotR = length( vSlotWorld.xz ), slotB = atan( vSlotWorld.x, - vSlotWorld.z );
	float slotS = ( slotB < 0.0 ? slotB + 6.2831853 : slotB ) * 115.0;
	if ( slotR < 116.0 && vSlotWorld.y > 0.5 && vSlotWorld.y < 3.0 && fract( slotS / 8.0 ) < 0.625 ) diffuseColor.rgb = vec3( 0.035, 0.03, 0.028 );
	${cut ? `float slotDeg = degrees( slotB < 0.0 ? slotB + 6.2831853 : slotB );
	if ( mod( slotDeg - clipLo + 720.0, 360.0 ) < clipSpan && vSlotWorld.y > -0.35 ) discard;` : ''}`);
  };
  m.customProgramCacheKey = () => cut ? 'slotted-clip' : 'slotted';
}
const far = await loader.loadAsync(DATA + 'far.glb');
far.scene.traverse(o => {
  if (!o.isMesh) return;
  if ((o.material.name || '').includes('orb')) { o.material = new THREE.MeshStandardMaterial({ color: 0xf0f2f4, metalness: 1.0, roughness: 0.03 }); orbParts.push(o.material); return; }
  const lm = new THREE.MeshLambertMaterial({ color: o.material.color });
  if ((o.material.name || '').includes('ceramic')) slotted(lm);
  o.material = lm;
});
scene.add(far.scene); progress();
// the whole ring: the far side as one plain band, shown where the rooms near one are not loaded
const clip = { lo: { value: 0 }, span: { value: 0 } };
if (whole) {
  const band = await loader.loadAsync(DATA + 'band.glb');
  band.scene.traverse(o => {
    if (!o.isMesh) return;
    const lm = new THREE.MeshLambertMaterial({ color: o.material.color, side: THREE.DoubleSide }); slotted(lm, clip); o.material = lm;
  });
  scene.add(band.scene); progress();
}
await skyReady;

// reflections: the room as seen from the middle of the stretch, for the metal; the world from the Orb's centre, for
// its mirror
const pmrem = new THREE.PMREMGenerator(renderer);
function capture(pos, size) {
  const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(0.1, 30000, rt); cc.position.copy(pos); scene.add(cc); cc.update(renderer, scene); scene.remove(cc);
  const env = pmrem.fromCubemap(rt.texture); rt.dispose(); return env;
}
// the Orb sees the whole band (nothing clipped); the metal, the room round the walker, caught again as one moves
const orbEnv = capture(new THREE.Vector3(0, ORB_Y, 0), 512).texture;
for (const m of orbParts) { m.envMap = orbEnv; m.needsUpdate = true; }
let envAt = null, envTime = 0, envRT = null;
function roomReflections(now) {
  const here = camera.position;
  if (envAt && (here.distanceTo(envAt) < 6 || now - envTime < 1500)) return;
  const rt = capture(here.clone(), 256); if (envRT) envRT.dispose(); envRT = rt; roomEnv = rt.texture;
  for (const m of metals) { m.envMap = roomEnv; m.needsUpdate = true; }
  envAt = here.clone(); envTime = now;
}
// the band is cut away over the stretch of loaded rooms that holds the walker
function bandClip(b) {
  if (!whole) return;
  const n = ringOrder.length, i0 = ringOrder.findIndex(c => ((b - c.b0) % 360 + 360) % 360 < c.b1 - c.b0);
  if (i0 < 0 || !chunks.state.get(ringOrder[i0].file)?.group) { clip.span.value = 0; return; }
  let a = i0, z = i0;
  while (chunks.state.get(ringOrder[(a - 1 + n) % n].file)?.group && (a - 1 + n) % n !== z) a = (a - 1 + n) % n;
  while (chunks.state.get(ringOrder[(z + 1) % n].file)?.group && (z + 1) % n !== a) z = (z + 1) % n;
  const lo = ringOrder[a].b0, hi = ringOrder[z].b1; clip.lo.value = ((lo % 360) + 360) % 360; clip.span.value = ((hi - lo) % 360 + 360) % 360 || 360;
}

// ------------------------------------------------------------------ walking
const walker = new Walker(camera, canStand, info.start, view);
const sound = new Sound(), ringMap = new RingMap(document.getElementById('map'), info.chunks.map(c => [c.b0, c.b1]));
walker.onStep = (loud, belt) => sound.step(loud, belt ? 1 : 0);
addEventListener('keydown', e => { if (e.code === 'KeyM') sound.toggle(); });
let walking = false;
goEl.disabled = false; goEl.textContent = 'Walk'; barEl.style.width = '100%';
const touchy = matchMedia('(pointer: coarse)').matches;
if (touchy) { walker.touch(canvas); document.querySelector('.keys').innerHTML = '<span><b>Left thumb</b> walk</span><span><b>Right thumb</b> look</span>'; }
goEl.addEventListener('click', () => {
  sound.start();
  if (touchy) { walking = true; startEl.classList.add('hidden'); document.body.classList.add('walking'); canvas.requestFullscreen?.().catch(() => {}); }
  else canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  walking = document.pointerLockElement === canvas;
  startEl.classList.toggle('hidden', walking); document.body.classList.toggle('walking', walking);
  if (!walking) { goEl.textContent = 'Walk on'; walker.keys.clear(); }
});
document.addEventListener('mousemove', e => { if (walking) walker.look(e.movementX, e.movementY); });

// the room one is in, named as one comes in
let roomNow = null, whereTimer = 0;
function named(dt) {
  const b = walker.bearing, room = (info.rooms || []).find(r => ((b - r.b0) % 360 + 360) % 360 < ((r.b1 - r.b0) % 360 + 360) % 360) || null;
  if (room && room !== roomNow) { roomNow = room; whereEl.textContent = room.name; whereEl.classList.add('on'); whereTimer = 3.2; }
  if (whereTimer > 0) { whereTimer -= dt; if (whereTimer <= 0) whereEl.classList.remove('on'); }
}

// the picture's resolution follows the machine: finer while frames come quickly, coarser when they do not
const prMax = Math.min(window.devicePixelRatio, 2); let pr = prMax, slow = 0, quick = 0;
function adapt(ms) {
  if (ms > 24) { slow++; quick = 0; } else if (ms < 13) { quick++; slow = 0; } else { slow = quick = 0; }
  const to = slow > 45 ? Math.max(0.75, pr - 0.25) : quick > 240 ? Math.min(prMax, pr + 0.25) : pr;
  if (to !== pr) { pr = to; slow = quick = 0; renderer.setPixelRatio(pr); resize(); }
}

let last = performance.now();
walker.update(0);
window.walk = { walker, scene, camera, renderer, chunks, go: on => { walking = on; } };      // for looking in from the console
renderer.setAnimationLoop(() => {
  const now = performance.now(), ms = now - last, dt = Math.min(0.05, ms / 1000); last = now;
  if (walking) { walker.update(dt); named(dt); sound.glide(walker.onBelt ? 1 : 0); ringMap.draw(walker.bearing, walker.yaw); adapt(ms); }
  camera.updateMatrixWorld();
  chunks.update(walker.bearing); bandClip(walker.bearing); roomReflections(now);
  mirror.render(camera, now / 1000);
  renderer.render(scene, camera);
});
