// One point of the photo walk: its 360 (the six faces of a cube in one picture, as render/photowalk_render.py writes
// them), and the shape of the room round it (its depth map), on which the 360 is drawn. Standing at the point, one
// sees the 360 exactly. Stepping to the next point, both points' shapes are drawn, and each surface takes its colour
// from the 360s that see it (both depth maps tell which), the one ahead more and more: so the room keeps its shape
// and its things their places while one glides, and nothing smears where a near thing stands before a far one.
import * as THREE from 'three';

export const EYE = 1.55;
const FAR = 400;                      // what is further (the sky) is drawn this far off
const DW = 256, DH = 128;             // the depth map's size
const TEAR = 1.25;                    // a triangle of the shape whose corners' distances differ more than this (a near
                                      // thing's edge against what is behind it) is left out while moving

// Blender's world (z up, y north) to the browser's (y up, z south), and back
export const toThree = (x, y, z) => new THREE.Vector3(x, z, -y);
export const fromThree = v => [v.x, -v.z, v.y];

// where a direction (Blender's axes, unit) falls on the six faces as the renderer lays them out (+x -x +y / -y +z -z,
// the side faces upright, the top and bottom with +y up); `edge` keeps the lookup off a face's last half pixel
const cube = /* glsl */`
  vec2 cubeUV(vec3 d, float edge) {
    vec3 a = abs(d), F, U; float k;
    if (a.x >= a.y && a.x >= a.z) { k = d.x > 0.0 ? 0.0 : 1.0; F = vec3(sign(d.x), 0.0, 0.0); U = vec3(0.0, 0.0, 1.0); }
    else if (a.y >= a.z) { k = d.y > 0.0 ? 2.0 : 3.0; F = vec3(0.0, sign(d.y), 0.0); U = vec3(0.0, 0.0, 1.0); }
    else { k = d.z > 0.0 ? 4.0 : 5.0; F = vec3(0.0, 0.0, sign(d.z)); U = vec3(0.0, 1.0, 0.0); }
    vec3 R = cross(F, U); float f = dot(d, F);
    vec2 uv = clamp(vec2(dot(d, R) / f + 1.0, 1.0 - dot(d, U) / f) * 0.5, vec2(edge), vec2(1.0 - edge));
    return vec2((mod(k, 3.0) + uv.x) / 3.0, (floor(k / 3.0) + uv.y) / 2.0);
  }
  vec3 blender(vec3 p) { return vec3(p.x, -p.z, p.y); }`;

const vert = /* glsl */`
  varying vec3 vPos;
  void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// at rest: the point's own 360
const restFrag = /* glsl */`
  uniform sampler2D map; uniform float edge; uniform vec3 centre;
  varying vec3 vPos;
  ${cube}
  void main() { gl_FragColor = vec4(texture2D(map, cubeUV(normalize(blender(vPos - centre)), edge)).rgb, 1.0); }`;

// stepping from A to B: each surface coloured by the 360s that see it, B's share growing with s
const stepFrag = /* glsl */`
  uniform sampler2D mapA, mapB, depA, depB; uniform vec3 eyeA, eyeB; uniform float edgeA, edgeB, s;
  varying vec3 vPos;
  ${cube}
  float sees(sampler2D dep, vec3 d, float dist) {
    float lon = atan(d.x, d.y), lat = asin(clamp(d.z, -1.0, 1.0));
    float r = texture2D(dep, vec2(lon * 0.15915494 + 0.5, 0.5 - lat * 0.31830989)).r;
    return r >= dist * 0.96 - 0.15 ? 1.0 : 0.0;
  }
  void main() {
    vec3 da = blender(vPos - eyeA), db = blender(vPos - eyeB);
    float la = length(da), lb = length(db); da /= la; db /= lb;
    vec3 ca = texture2D(mapA, cubeUV(da, edgeA)).rgb, cb = texture2D(mapB, cubeUV(db, edgeB)).rgb;
    float wa = (1.0 - s) * (0.02 + sees(depA, da, la)), wb = s * (0.02 + sees(depB, db, lb));
    gl_FragColor = vec4((ca * wa + cb * wb) / max(wa + wb, 1e-4), 1.0);
  }`;

const step = new THREE.ShaderMaterial({
  uniforms: { mapA: { value: null }, mapB: { value: null }, depA: { value: null }, depB: { value: null },
    eyeA: { value: new THREE.Vector3() }, eyeB: { value: new THREE.Vector3() }, edgeA: { value: 0 }, edgeB: { value: 0 }, s: { value: 0 } },
  vertexShader: vert, fragmentShader: stepFrag, side: THREE.DoubleSide,
});

// set the step's two ends and how far along it is (0 at A, 1 at B)
export function stepping(A, B, s) {
  const u = step.uniforms;
  u.mapA.value = A.pic(); u.mapB.value = B.pic(); u.depA.value = A.depthTex; u.depB.value = B.depthTex;
  u.eyeA.value.copy(A.eye); u.eyeB.value.copy(B.eye); u.edgeA.value = A.edge(); u.edgeB.value = B.edge(); u.s.value = s;
}

async function bitmap(url, opts) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return createImageBitmap(await r.blob(), opts);
}

function texture(bmp) {
  const t = new THREE.Texture(bmp);
  t.flipY = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// a direction (Blender's axes, unit) to the depth map's pixel
function pixel(d) {
  const lon = Math.atan2(d[0], d[1]), lat = Math.asin(Math.max(-1, Math.min(1, d[2])));
  const i = Math.floor((lon / (2 * Math.PI) + 0.5) * DW), j = Math.floor((0.5 - lat / Math.PI) * DH);
  return [((i % DW) + DW) % DW, Math.max(0, Math.min(DH - 1, j))];
}

export class Pano {
  constructor(p, base) {
    this.p = p; this.base = base; this.file = p.id.toLowerCase().replace('-', '').replace('.', '_');
    this.eye = toThree(p.x, p.y, p.z + EYE); this.floor = toThree(p.x, p.y, p.z);
    this.small = null; this.full = null; this.dist = null; this.depthTex = null; this.mesh = null; this.torn = null;
  }

  url(s) { return this.base + this.file + s; }

  loadDepth() {
    return this.depthP ||= bitmap(this.url('_d.png'), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(b => {
      const c = document.createElement('canvas'); c.width = b.width; c.height = b.height;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0);
      const px = g.getImageData(0, 0, b.width, b.height).data, n = b.width * b.height, dist = new Float32Array(n);
      for (let k = 0; k < n; k++) { const q = px[4 * k] * 256 + px[4 * k + 1]; dist[k] = q ? 0.25 * 65535 / q : Infinity; }
      b.close && b.close(); this.dist = dist;
      const t = new THREE.DataTexture(dist.map(x => Math.min(x, 1e4)), DW, DH, THREE.RedFormat, THREE.FloatType);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true; this.depthTex = t;
      return dist;
    });
  }

  loadSmall() { return this.smallP ||= bitmap(this.url('_s.webp')).then(b => (this.small = texture(b))); }
  loadFull() { return this.fullP ||= bitmap(this.url('.webp')).then(b => (this.full = texture(b))); }
  pic() { return this.full || this.small; }
  edge() { const t = this.pic(); return 0.5 / Math.max(1, t.image.width / 3); }

  // how far the room is from the point, looking along d (Blender's axes, unit)
  depth(d) { const [i, j] = pixel(d); return this.dist ? this.dist[j * DW + i] : Infinity; }

  // the room's shape round the point: a sphere of 256 x 128, each vertex as far out as the depth map says; whole for
  // standing here, torn at near things' edges for stepping
  build() {
    if (this.mesh) return this.mesh;
    const W = DW, H = DH, d = this.dist, e = this.eye, cols = W + 1, nv = cols * H + 2;
    const pos = new Float32Array(nv * 3), vd = new Float32Array(nv), far = k => Math.min(FAR, d[k]);
    let o = 0, v = 0;
    const put = (bx, by, bz, r) => { pos[o++] = e.x + bx * r; pos[o++] = e.y + bz * r; pos[o++] = e.z - by * r; vd[v++] = r; };
    for (let j = 0; j < H; j++) {
      const lat = (0.5 - (j + 0.5) / H) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let i = 0; i <= W; i++) {
        const lon = ((i + 0.5) / W - 0.5) * 2 * Math.PI;
        put(cl * Math.sin(lon), cl * Math.cos(lon), sl, far(j * W + (i % W)));
      }
    }
    let top = 0, bot = 0;
    for (let i = 0; i < W; i++) { top += far(i); bot += far((H - 1) * W + i); }
    put(0, 0, 1, top / W); put(0, 0, -1, bot / W);
    const whole = [], torn = [], T = cols * H, B = T + 1;
    const tri = (a, b, c) => {
      whole.push(a, b, c);
      const hi = Math.max(vd[a], vd[b], vd[c]), lo = Math.min(vd[a], vd[b], vd[c]);
      if (hi < lo * TEAR || hi - lo < 0.3) torn.push(a, b, c);
    };
    for (let j = 0; j < H - 1; j++)
      for (let i = 0; i < W; i++) { const a = j * cols + i, b = a + 1, c = a + cols, f = c + 1; tri(a, c, b); tri(b, c, f); }
    for (let i = 0; i < W; i++) { tri(T, i, i + 1); tri(B, (H - 1) * cols + i + 1, (H - 1) * cols + i); }
    const at = new THREE.BufferAttribute(pos, 3);
    const gw = new THREE.BufferGeometry(); gw.setAttribute('position', at); gw.setIndex(whole);
    const gt = new THREE.BufferGeometry(); gt.setAttribute('position', at); gt.setIndex(torn);
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: null }, edge: { value: 0 }, centre: { value: this.eye.clone() } },
      vertexShader: vert, fragmentShader: restFrag, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(gw, m); this.torn = new THREE.Mesh(gt, step);
    this.mesh.frustumCulled = this.torn.frustumCulled = false;
    this.show();
    return this.mesh;
  }

  // the sharpest picture loaded so far
  show() {
    if (!this.mesh || !this.pic()) return;
    const u = this.mesh.material.uniforms; u.map.value = this.pic(); u.edge.value = this.edge();
  }

  drop(full) {           // free the GPU's memory: the big picture only, or all
    if (this.full) { this.full.dispose(); this.full = null; this.fullP = null; }
    if (!full) return this.show();
    if (this.small) { this.small.dispose(); this.small = null; this.smallP = null; }
    if (this.depthTex) { this.depthTex.dispose(); this.depthTex = null; this.depthP = null; this.dist = null; }
    if (this.mesh) {
      this.mesh.removeFromParent(); this.torn.removeFromParent();
      this.mesh.geometry.dispose(); this.torn.geometry.dispose(); this.mesh.material.dispose(); this.mesh = this.torn = null;
    }
  }
}
