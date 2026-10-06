// Arcadia's rooms as Gaussian splats: fitted (palace/tools/render/splat_views.py, then OpenSplat) to path-traced views
// of the room taken from a rig of cameras, drawn in real time by Spark (sparkjs.dev). You stand where the rig stood and
// can look all round and step about it; the splat is sharp within its reach, so you are kept inside it.
import * as THREE from "three";
import { SparkRenderer, SplatMesh, SparkControls } from "@sparkjsdev/spark";

const $ = (id) => document.getElementById(id);
const canvas = $("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0706);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 3000);
scene.add(new SparkRenderer({ renderer }));

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener("resize", resize); resize();

// The design model is z up (Blender); three.js is y up: (x, y, z) -> (x, z, -y)
const toThree = (p) => new THREE.Vector3(p[0], p[2], -p[1]);

let rooms = [];
try { rooms = await (await fetch("data/rooms.json")).json(); } catch (e) { rooms = []; }
const id = (location.hash || "").slice(1);
const R = rooms.find((r) => r.id === id) || rooms[0];
if (!R) { $("load").textContent = "Could not load the room"; throw new Error("no rooms in data/rooms.json"); }
document.title = R.name + " · Arcadia";
$("wK").textContent = R.k;
const a = document.createElement("a"); a.href = R.page; a.textContent = R.name; $("wT").appendChild(a);

const splat = new SplatMesh({ url: "data/" + R.file, onProgress: (e) => {
  if (e.lengthComputable && e.total) $("load").textContent = "Loading the room… " + Math.round(100 * e.loaded / e.total) + "%";
} });
splat.rotation.x = -Math.PI / 2;
scene.add(splat);
Promise.resolve(splat.initialized).then(() => { $("load").hidden = true; }, () => { $("load").textContent = "Could not load the room"; });

const centre = toThree(R.centre), EYE = 1.6, H0 = centre.y + 1.25, H1 = centre.y + 2.05;
camera.position.set(centre.x, centre.y + EYE, centre.z);
camera.rotation.order = "YXZ"; camera.rotation.set(0, THREE.MathUtils.degToRad(R.yaw0 || 0), 0);

const controls = new SparkControls({ canvas });
function keepInside() {          // the splat is sharp only within the rig's reach: stay inside it, at standing height
  const dx = camera.position.x - centre.x, dz = camera.position.z - centre.z, d = Math.hypot(dx, dz);
  if (d > R.reach) { camera.position.x = centre.x + dx / d * R.reach; camera.position.z = centre.z + dz / d * R.reach; }
  camera.position.y = Math.min(H1, Math.max(H0, camera.position.y));
  camera.rotation.z = 0;
}

// touch: hold an arrow to walk
const held = {}, pad = $("pad");
pad.querySelectorAll("button").forEach((b) => {
  const k = b.dataset.k, on = (e) => { e.preventDefault(); held[k] = true; hint(); }, off = () => { held[k] = false; };
  b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
});
const fwd = new THREE.Vector3(), right = new THREE.Vector3();
function walkPad(dt) {
  camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.crossVectors(fwd, camera.up).normalize();
  const s = 1.2 * dt;
  if (held.f) camera.position.addScaledVector(fwd, s); if (held.b) camera.position.addScaledVector(fwd, -s);
  if (held.r) camera.position.addScaledVector(right, s); if (held.l) camera.position.addScaledVector(right, -s);
}

let hinted = false;
function hint() { if (hinted) return; hinted = true; $("hint").style.opacity = 0; }
canvas.addEventListener("pointerdown", hint); window.addEventListener("keydown", hint);

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  controls.update(camera); walkPad(dt); keepInside();
  renderer.render(scene, camera);
});
window.__splat = { THREE, camera, splat, room: R, renderer, scene };
