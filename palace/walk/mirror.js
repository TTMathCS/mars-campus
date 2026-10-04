// Reflections in the polished floors: the room drawn again from under the floor (a mirrored camera, as three.js's
// Reflector does), half size, with its mip levels; each floor adds it with the Fresnel of a polished stone, blurred
// by its roughness.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export class FloorMirror {
  constructor(renderer, scene, y = 0) {
    this.renderer = renderer; this.scene = scene; this.y = y; this.hide = [];
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.cam = new THREE.PerspectiveCamera(); this.matrix = new THREE.Matrix4();
    this.uniforms = { tMirror: { value: this.rt.texture }, mirrorMatrix: { value: this.matrix }, mirrorTime: { value: 0 } };
    this._v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this._m = new THREE.Matrix4(); this._plane = new THREE.Plane(); this._q = new THREE.Vector4(); this._c = new THREE.Vector4();
  }

  setSize(w, h) { this.rt.setSize(Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 2))); }

  // a basic material (colour times light map) made to reflect; rough 0 is a mirror. water: a pool's surface, which
  // shows what is under it when looked into and the room when seen at a slant, and moves a little
  material(m, rough, water = false) {
    const u = this.uniforms, r = Math.min(0.9, Math.max(0.0, rough));
    m.onBeforeCompile = sh => {
      sh.uniforms.tMirror = u.tMirror; sh.uniforms.mirrorMatrix = u.mirrorMatrix; sh.uniforms.mirrorTime = u.mirrorTime;
      sh.vertexShader = 'uniform mat4 mirrorMatrix;\nvarying vec4 vMirror;\nvarying vec3 vMirrorWorld;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n\tvec4 mirrorWorld = modelMatrix * vec4( transformed, 1.0 );\n\tvMirrorWorld = mirrorWorld.xyz;\n\tvMirror = mirrorMatrix * mirrorWorld;');
      sh.fragmentShader = 'uniform sampler2D tMirror;\nuniform float mirrorTime;\nvarying vec4 vMirror;\nvarying vec3 vMirrorWorld;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
	vec3 mirrorView = normalize( cameraPosition - vMirrorWorld );
	float mirrorF = ${water ? '0.02 + 0.98' : '0.04 + 0.96'} * pow( 1.0 - clamp( mirrorView.y, 0.0, 1.0 ), 5.0 );
	vec2 mirrorUv = vMirror.xy / vMirror.w;
	${water ? `vec2 rp = vMirrorWorld.xz * 2.3;
	mirrorUv += 0.006 * vec2( sin( rp.x + mirrorTime * 1.1 ) + sin( rp.y * 1.7 + mirrorTime * 0.7 ), cos( rp.y + mirrorTime * 0.9 ) + cos( rp.x * 1.3 - mirrorTime * 0.6 ) );` : ''}
	vec3 mirrorCol = textureLod( tMirror, mirrorUv, ${(r * 7.0).toFixed(2)} ).rgb;
	${water ? `outgoingLight = mix( outgoingLight, mirrorCol, mirrorF ); diffuseColor.a = mix( 0.42, 1.0, mirrorF );`
	        : `outgoingLight += mirrorCol * mirrorF * ${(1.0 - r).toFixed(3)};`}
	#include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'mirror' + r.toFixed(2) + (water ? 'w' : ''); m.userData.mirror = r;
    return m;
  }

  render(camera, t = 0) {
    this.uniforms.mirrorTime.value = t;
    if (!this.hide.length) return;
    const [mirrorPos, camPos, view, target] = this._v, cam = this.cam, rot = this._m;
    mirrorPos.set(0, this.y, 0); camPos.setFromMatrixPosition(camera.matrixWorld);
    view.subVectors(mirrorPos, camPos);
    if (view.dot(UP) > 0) return;                                        // the eye is under the floor
    view.reflect(UP).negate(); view.add(mirrorPos);
    rot.extractRotation(camera.matrixWorld);
    target.set(0, 0, -1).applyMatrix4(rot).add(camPos);
    target.subVectors(mirrorPos, target).reflect(UP).negate().add(mirrorPos);
    cam.position.copy(view); cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(UP); cam.lookAt(target);
    cam.near = camera.near; cam.far = camera.far; cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
    this.matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // an oblique near plane: nothing under the floor gets into the reflection
    this._plane.setFromNormalAndCoplanarPoint(UP, mirrorPos).applyMatrix4(cam.matrixWorldInverse);
    const c = this._c.set(this._plane.normal.x, this._plane.normal.y, this._plane.normal.z, this._plane.constant), e = cam.projectionMatrix.elements, q = this._q;
    q.x = (Math.sign(c.x) + e[8]) / e[0]; q.y = (Math.sign(c.y) + e[9]) / e[5]; q.z = -1.0; q.w = (1.0 + e[10]) / e[14];
    c.multiplyScalar(2.0 / c.dot(q));
    e[2] = c.x; e[6] = c.y; e[10] = c.z + 1.0 - 0.003; e[14] = c.w;
    for (const o of this.hide) o.visible = false;
    const r = this.renderer, old = r.getRenderTarget();
    r.setRenderTarget(this.rt); r.clear(); r.render(this.scene, cam); r.setRenderTarget(old);
    for (const o of this.hide) o.visible = true;
  }
}
