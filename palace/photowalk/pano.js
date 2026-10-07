// One point of the photo walk: its 360 (the six faces of a cube in one picture, as render/photowalk_render.py writes
// them), and the shape of the room round it (its depth map), on which the 360 is drawn. Standing at the point, one
// sees the 360 exactly; moving away from it, the room keeps its shape, so walking from one point to the next looks
// like walking.
import * as THREE from 'three';

export const EYE = 1.55;
const FAR = 400;                      // what is further (the sky) is drawn this far off
const DW = 256, DH = 128;             // the depth map's size

// Blender's world (z up, y north) to the browser's (y up, z south), and back
export const toThree = (x, y, z) => new THREE.Vector3(x, z, -y);
export const fromThree = v => [v.x, -v.z, v.y];

const vert = /* glsl */`
  uniform vec3 centre;
  varying vec3 vDir;
  void main() {
    vec3 d = position - centre; vDir = vec3(d.x, -d.z, d.y);      // from the point, in Blender's axes
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// which face of the cube a direction falls on, and where on it: as the renderer's FACES (+x -x +y / -y +z -z, the
// side faces upright, the top and bottom with +y up)
const frag = /* glsl */`
  uniform sampler2D map;
  uniform float edge;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir), a = abs(d), F, U; float k;
    if (a.x >= a.y && a.x >= a.z) { k = d.x > 0.0 ? 0.0 : 1.0; F = vec3(sign(d.x), 0.0, 0.0); U = vec3(0.0, 0.0, 1.0); }
    else if (a.y >= a.z) { k = d.y > 0.0 ? 2.0 : 3.0; F = vec3(0.0, sign(d.y), 0.0); U = vec3(0.0, 0.0, 1.0); }
    else { k = d.z > 0.0 ? 4.0 : 5.0; F = vec3(0.0, 0.0, sign(d.z)); U = vec3(0.0, 1.0, 0.0); }
    vec3 R = cross(F, U); float f = dot(d, F);
    vec2 uv = clamp(vec2(dot(d, R) / f + 1.0, 1.0 - dot(d, U) / f) * 0.5, vec2(edge), vec2(1.0 - edge));
    float col = mod(k, 3.0), row = floor(k / 3.0);
    gl_FragColor = vec4(texture2D(map, vec2((col + uv.x) / 3.0, (row + uv.y) / 2.0)).rgb, 1.0);
  }`;

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
    this.small = null; this.full = null; this.dist = null; this.mesh = null;
  }

  url(s) { return this.base + this.file + s; }

  loadDepth() {
    return this.depthP ||= bitmap(this.url('_d.png'), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(b => {
      const c = document.createElement('canvas'); c.width = b.width; c.height = b.height;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0);
      const px = g.getImageData(0, 0, b.width, b.height).data, n = b.width * b.height, dist = new Float32Array(n);
      for (let k = 0; k < n; k++) { const q = px[4 * k] * 256 + px[4 * k + 1]; dist[k] = q ? 0.25 * 65535 / q : Infinity; }
      b.close && b.close(); this.dist = dist; return dist;
    });
  }

  loadSmall() { return this.smallP ||= bitmap(this.url('_s.webp')).then(b => (this.small = texture(b))); }
  loadFull() { return this.fullP ||= bitmap(this.url('.webp')).then(b => (this.full = texture(b))); }

  // how far the room is from the point, looking along d (Blender's axes, unit)
  depth(d) { const [i, j] = pixel(d); return this.dist ? this.dist[j * DW + i] : Infinity; }

  // the room's shape round the point: a sphere of 256 x 128, each vertex as far out as the depth map says
  build() {
    if (this.mesh) return this.mesh;
    const W = DW, H = DH, d = this.dist, e = this.eye, cols = W + 1;
    const pos = new Float32Array((cols * H + 2) * 3), far = k => Math.min(FAR, d[k]);
    let o = 0;
    const put = (bx, by, bz, r) => { pos[o++] = e.x + bx * r; pos[o++] = e.y + bz * r; pos[o++] = e.z - by * r; };
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
    const idx = [], T = cols * H, B = T + 1;
    for (let j = 0; j < H - 1; j++)
      for (let i = 0; i < W; i++) {
        const a = j * cols + i, b = a + 1, c = a + cols, f = c + 1;
        idx.push(a, c, b, b, c, f);
      }
    for (let i = 0; i < W; i++) { idx.push(T, i, i + 1); idx.push(B, (H - 1) * cols + i + 1, (H - 1) * cols + i); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: this.full || this.small }, edge: { value: 0.5 / 1024 }, centre: { value: this.eye.clone() } },
      vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, depthWrite: true,
    });
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false;
    this.show();
    return this.mesh;
  }

  // the sharpest picture loaded so far
  show() {
    if (!this.mesh) return;
    const t = this.full || this.small, u = this.mesh.material.uniforms;
    u.map.value = t; u.edge.value = 0.5 / Math.max(1, t.image.width / 3);
  }

  drop(full) {           // free the GPU's memory: the big picture only, or all
    if (this.full) { this.full.dispose(); this.full = null; this.fullP = null; }
    if (!full) return this.show();
    if (this.small) { this.small.dispose(); this.small = null; this.smallP = null; }
    if (this.mesh) { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null; }
  }
}
