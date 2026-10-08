// The path-traced 360s painted onto the walk's rooms. A 360 is rendered every few metres (photowalk_plan.py places
// them, render/photowalk_render.py renders them into palace/photowalk/v/: six faces of a cube in one picture, and a
// map of how far the room is in every direction). While one walks, the three 360s nearest that see where one stands
// are in use: each surface of the rooms takes its colour from those of them that see it, the nearest the most, so the
// rooms look as the pictures do, and keep their shape as one moves (they are the rooms' own shapes, only coloured
// from the pictures). Where none of them sees a surface (behind a sofa, under a table) its baked colour stays. Jim,
// 8 Oct 2026: "just merge them into one free walk and give best quality and real expereience with speed".
//
// Whether a 360 sees a surface: the walk's shapes, drawn from the 360's eye into a cube of distances (as a lamp's
// shadow map is), say whether anything of the walk stands between; and the 360's own distance map says whether the
// picture saw that surface there, not something the walk leaves out (the trees' leaves are fewer in the walk).
import * as THREE from 'three';

const K = 3;                                  // 360s in use at once
const EYE = 1.55;                             // the 360s' camera above the floor (photowalk_plan.py)
const NEAR = 18;                              // metres: no 360 further than this is used
const CUBE = 512;                             // the distance cube's face, pixels
const BASE = '../photowalk/';
export const PHOTO_LAYER = 1;                 // the walk's opaque shapes, drawn into the distance cubes

const fname = id => id.toLowerCase().replace('-', '').replace('.', '_');

// where a direction (Blender's axes, unit) falls on the six faces as the renderer lays them out (+x -x +y / -y +z -z,
// the side faces upright, the top and bottom with +y up); `edge` keeps the lookup off a face's last half pixel
const GLSL = /* glsl */`
vec2 photoCubeUV(vec3 d, float edge) {
  vec3 a = abs(d), F, U; float k;
  if (a.x >= a.y && a.x >= a.z) { k = d.x > 0.0 ? 0.0 : 1.0; F = vec3(sign(d.x), 0.0, 0.0); U = vec3(0.0, 0.0, 1.0); }
  else if (a.y >= a.z) { k = d.y > 0.0 ? 2.0 : 3.0; F = vec3(0.0, sign(d.y), 0.0); U = vec3(0.0, 0.0, 1.0); }
  else { k = d.z > 0.0 ? 4.0 : 5.0; F = vec3(0.0, 0.0, sign(d.z)); U = vec3(0.0, 1.0, 0.0); }
  vec3 R = cross(F, U); float f = dot(d, F);
  vec2 uv = clamp(vec2(dot(d, R) / f + 1.0, 1.0 - dot(d, U) / f) * 0.5, vec2(edge), vec2(1.0 - edge));
  return vec2((mod(k, 3.0) + uv.x) / 3.0, (floor(k / 3.0) + uv.y) / 2.0);
}
// one 360's colour for the surface at w, and how much it counts (0 where it does not see it)
// (a surface seen at a slant, cosA small, is let off more: its distance changes fast from one pixel to the next)
float photoOne(vec3 w, float cosA, vec3 eye, samplerCube cube, sampler2D dep, sampler2D atlas, float edge, float weight, inout vec3 sum) {
  if (weight <= 0.0) return 0.0;
  vec3 d3 = w - eye; float dist = length(d3); vec3 dw = d3 / dist;
  float slant = 1.0 / max(cosA, 0.05);
  float g = texture(cube, dw).r; if (g <= 0.0) g = 1e4;
  if (dist > g * (1.008 + 0.0035 * slant) + 0.04) return 0.0;                // the walk's shapes hide it
  vec3 db = vec3(dw.x, -dw.z, dw.y);                                          // Blender's axes
  float lon = atan(db.x, db.y), lat = asin(clamp(db.z, -1.0, 1.0));
  float rd = texture(dep, vec2(lon * 0.15915494 + 0.5, 0.5 - lat * 0.31830989)).r;
  // the picture saw something else there: further off (a shape of the walk's that the picture has not), or much
  // nearer (a leaf right by the 360's eye); a leaf of the picture's not far before the surface is drawn on it, as the
  // picture has it (the walk's trees have fewer leaves), and so is what the picture saw through glass
  if (rd < dist * 0.3 || rd > dist * 1.08 + 0.25) return 0.0;
  sum += texture(atlas, photoCubeUV(db, edge)).rgb * weight;
  return weight;
}`;

const blank2 = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank2.needsUpdate = true;
const blankDepth = new THREE.DataTexture(new Float32Array([0]), 1, 1, THREE.RedFormat, THREE.FloatType); blankDepth.needsUpdate = true;
const blankCube = new THREE.WebGLCubeRenderTarget(1);

async function bitmap(url, opts) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ': ' + r.status);
  const b = await r.blob();
  try { return await createImageBitmap(b, opts); } catch (e) { return await createImageBitmap(b); }
}

class Photo {
  constructor(p) {
    this.p = p; this.file = fname(p.id);
    this.eye = new THREE.Vector3(p.x, p.z + EYE, -p.y);
    this.dist = null; this.dw = 0; this.dh = 0; this.depthTex = null; this.small = null; this.full = null; this.rt = null;
    this.fade = 0; this.cubeAt = -1;
  }

  url(s) { return BASE + 'v/' + this.file + s; }

  loadDepth() {
    return this.depthP ||= bitmap(this.url('_d.png'), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(b => {
      const c = document.createElement('canvas'); c.width = b.width; c.height = b.height;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0);
      const px = g.getImageData(0, 0, b.width, b.height).data, n = b.width * b.height, dist = new Float32Array(n);
      for (let k = 0; k < n; k++) { const q = px[4 * k] * 256 + px[4 * k + 1]; dist[k] = q ? 0.25 * 65535 / q : 1e4; }
      this.dw = b.width; this.dh = b.height; b.close && b.close(); this.dist = dist;
      const t = new THREE.DataTexture(dist, this.dw, this.dh, THREE.RedFormat, THREE.FloatType);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true; this.depthTex = t;
    });
  }

  texture(b) {
    const t = new THREE.Texture(b);
    t.flipY = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return t;
  }

  loadSmall() { return this.smallP ||= bitmap(this.url('_s.webp')).then(b => (this.small = this.texture(b))); }
  loadFull() { return this.fullP ||= bitmap(this.url('.webp')).then(b => (this.full = this.texture(b))); }
  pic() { return this.full || this.small; }
  edge() { const t = this.pic(); return t ? 0.5 / Math.max(1, t.image.width / 3) : 0; }
  ready() { return !!(this.depthTex && this.pic()); }

  // how far the room is from the 360's eye, along a direction (Blender's axes)
  depth(x, y, z) {
    if (!this.dist) return 1e4;
    const lon = Math.atan2(x, y), lat = Math.asin(Math.max(-1, Math.min(1, z)));
    const i = Math.floor((lon / (2 * Math.PI) + 0.5) * this.dw), j = Math.floor((0.5 - lat / Math.PI) * this.dh);
    return this.dist[Math.max(0, Math.min(this.dh - 1, j)) * this.dw + ((i % this.dw) + this.dw) % this.dw];
  }

  // whether the 360 sees a point at eye height (three's axes)
  sees(v) {
    const dx = v.x - this.eye.x, dy = -(v.z - this.eye.z), l = Math.hypot(dx, dy);
    return l < 0.3 || this.depth(dx / l, dy / l, 0) >= l - 0.5;
  }

  drop() {
    for (const t of [this.small, this.full, this.depthTex]) t && t.dispose();
    if (this.rt) this.rt.dispose();
    this.small = this.full = this.depthTex = this.rt = null; this.smallP = this.fullP = this.depthP = null; this.dist = null; this.cubeAt = -1;
  }
}

export class Photos {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene; this.all = []; this.slots = new Array(K).fill(null);
    this.u = {
      photoEye: { value: Array.from({ length: K }, () => new THREE.Vector3(0, -1e4, 0)) },
      photoW: { value: new Array(K).fill(0) }, photoEdge: { value: new Array(K).fill(0) },
      photoAtlas: { value: new Array(K).fill(blank2) }, photoDep: { value: new Array(K).fill(blankDepth) },
      photoCube: { value: new Array(K).fill(blankCube.texture) },
    };
    this.version = 0;                         // the walk's shapes change as chunks come and go: the cubes are drawn again
    this.distMat = new THREE.ShaderMaterial({
      uniforms: { centre: { value: new THREE.Vector3() } },
      vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 centre; varying vec3 vW; void main() { gl_FragColor = vec4(length(vW - centre), 0.0, 0.0, 1.0); }',
      side: THREE.DoubleSide,
    });
  }

  // the plan's points whose 360s are rendered (each of the two machines that render them lists its own)
  async init() {
    const plan = await (await fetch(BASE + 'plan.json')).json();
    const lists = await Promise.allSettled(['a', 'b'].map(m => fetch(BASE + 'v/index_' + m + '.json', { cache: 'no-cache' }).then(r => r.json())));
    const ready = new Set(lists.flatMap(l => (l.status === 'fulfilled' ? l.value.ready : [])));
    this.all = plan.points.filter(p => ready.has(p.id)).map(p => new Photo(p));
    return this.all.length;
  }

  // a material of the walk's rooms, made to take its colour from the 360s (after its own tone-mapping: the pictures
  // are graded already)
  patch(m) {
    const prev = m.onBeforeCompile, key = m.customProgramCacheKey, u = this.u;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'varying vec3 vPhotoW;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n\tvPhotoW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      let sum = '';
      for (let k = 0; k < K; k++) sum += `\tphotoSum += photoOne( vPhotoW, abs( dot( photoN, normalize( vPhotoW - photoEye[ ${k} ] ) ) ), photoEye[ ${k} ], photoCube[ ${k} ], photoDep[ ${k} ], photoAtlas[ ${k} ], photoEdge[ ${k} ], photoW[ ${k} ], photoCol );\n`;
      sh.fragmentShader = `varying vec3 vPhotoW;
uniform vec3 photoEye[ ${K} ]; uniform float photoW[ ${K} ]; uniform float photoEdge[ ${K} ];
uniform sampler2D photoAtlas[ ${K} ]; uniform sampler2D photoDep[ ${K} ]; uniform samplerCube photoCube[ ${K} ];
${GLSL}
` + sh.fragmentShader.replace('#include <colorspace_fragment>', `#include <colorspace_fragment>
	#ifdef TONE_MAPPING
	{
	vec3 photoN = normalize( cross( dFdx( vPhotoW ), dFdy( vPhotoW ) ) );
	vec3 photoCol = vec3( 0.0 ); float photoSum = 0.0;
${sum}	if ( photoSum > 0.0 ) gl_FragColor.rgb = mix( gl_FragColor.rgb, photoCol / photoSum, smoothstep( 0.0, 0.08, photoSum ) );
	}
	#endif`);
    };
    m.customProgramCacheKey = () => (key ? key.call(m) : '') + '|photo';
    return m;
  }

  changed() { this.version++; }

  // the cube of distances round a 360's eye: the walk's opaque shapes (layer PHOTO_LAYER) as far as they are
  cube(P) {
    if (!P.rt) P.rt = new THREE.WebGLCubeRenderTarget(CUBE, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const cc = new THREE.CubeCamera(0.05, 400, P.rt);
    for (const c of cc.children) c.layers.set(PHOTO_LAYER);
    cc.position.copy(P.eye); cc.updateMatrixWorld(true);
    const r = this.renderer, s = this.scene, bg = s.background, ov = s.overrideMaterial, cc0 = new THREE.Color(), ca = r.getClearAlpha();
    r.getClearColor(cc0); r.setClearColor(0x000000, 1);
    this.distMat.uniforms.centre.value.copy(P.eye); s.background = null; s.overrideMaterial = this.distMat;
    cc.update(r, s);
    s.background = bg; s.overrideMaterial = ov; r.setClearColor(cc0, ca);
    P.cubeAt = this.version;
  }

  // each frame: the three 360s nearest that see where one stands (others nearer, behind a wall, count less), loaded,
  // each weighed by how near it is; a 360 coming in or going out fades
  update(pos, dt) {
    const cand = [];
    for (const P of this.all) {
      const d = Math.hypot(P.eye.x - pos.x, P.eye.z - pos.z);
      if (d < NEAR) cand.push([d + (P.dist && !P.sees(pos) ? 12 : 0), P]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const want = cand.slice(0, K).map(c => c[1]);
    for (const P of cand.slice(0, K + 3).map(c => c[1])) { P.loadDepth().catch(() => {}); P.loadSmall().catch(() => {}); }
    for (const P of want) P.loadFull().catch(() => {});
    // into the slots: a 360 keeps its slot while wanted; a slot is let go once its 360 has faded out
    for (let k = 0; k < K; k++) { const P = this.slots[k]; if (P && !want.includes(P) && P.fade <= 0) this.slots[k] = null; }
    for (const P of want) {
      if (this.slots.includes(P) || !P.ready()) continue;
      const k = this.slots.indexOf(null); if (k < 0) break;
      this.slots[k] = P; P.fade = 0;
    }
    let drew = false, total = 0; const w = this.u.photoW.value;
    for (let k = 0; k < K; k++) {
      const P = this.slots[k];
      if (!P) { w[k] = 0; continue; }
      if (P.cubeAt !== this.version && !drew) { this.cube(P); drew = true; }       // one cube a frame at most
      if (P.cubeAt < 0 || !P.ready()) { w[k] = 0; continue; }
      P.fade = Math.max(0, Math.min(1, P.fade + (want.includes(P) ? 1 : -1) * dt * 1.5));
      const d = Math.hypot(P.eye.x - pos.x, P.eye.z - pos.z);
      w[k] = P.fade / (d * d + 1.0); total += w[k];
      this.u.photoEye.value[k].copy(P.eye); this.u.photoEdge.value[k] = P.edge();
      this.u.photoAtlas.value[k] = P.pic(); this.u.photoDep.value[k] = P.depthTex; this.u.photoCube.value[k] = P.rt.texture;
    }
    if (total > 0) for (let k = 0; k < K; k++) w[k] /= total;
    // keep the GPU's memory small: sharp pictures only for those in use, nothing for those far off
    for (const P of this.all) {
      if (this.slots.includes(P)) continue;
      const d = Math.hypot(P.eye.x - pos.x, P.eye.z - pos.z);
      if (P.full && !want.includes(P)) { P.full.dispose(); P.full = null; P.fullP = null; }
      if (d > NEAR * 2 && (P.small || P.depthTex || P.rt)) P.drop();
    }
  }
}
