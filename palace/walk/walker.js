// The walker: the keys and the mouse, steps on the floor map (walls, furniture and water stop one; one slides along
// them), the Glide that carries one round, jumps in Mars gravity, and the head rising and falling with each step.
// The Glide carries one only while one stands still on it, the way one faces round the ring, and any key or step
// takes one off it at once (Jim, 7 Oct 2026: "after few steps I cannot control and it keeps moving forward by itself":
// it carried everyone who walked onto it, faster than one walks, with the glass beside it open only at the doors).
import { D, R_IN, BELT, P, bearingOf, along, outward } from './ring.js';

const EYE = 1.62, BODY = 0.26;                        // eye height, the walker's radius
const WALK = 1.45, RUN = 3.9, GLIDE = 3.2;            // m/s; the Glide goes round in 4 minutes
const GRAVITY = 3.71, JUMP = 2.3;                     // Mars: a jump of 0.7 m that lasts 1.2 s
const RIDE_AFTER = 0.7;                               // seconds standing still on the Glide before it carries one

// where one can walk: a picture of the floor, white where it is free, across by bearing and down by radius
export async function floorMap(url, F) {
  const im = new Image(); im.src = url; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const px = g.getImageData(0, 0, im.width, im.height).data, free = new Uint8Array(im.width * im.height);
  for (let i = 0; i < free.length; i++) free[i] = px[4 * i] > 127 ? 1 : 0;
  const freeAt = (x, z) => {
    let db = bearingOf(x, z) - F.b0; if (db < 0) db += 360;
    const i = Math.floor(db / F.db), j = Math.floor((Math.hypot(x, z) - F.r0) / F.dr);
    return i >= 0 && i < F.w && j >= 0 && j < F.h && free[j * F.w + i] === 1;
  };
  const ring8 = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4) * BODY, Math.sin(k * Math.PI / 4) * BODY]);
  return (x, z) => freeAt(x, z) && ring8.every(([dx, dz]) => freeAt(x + dx, z + dz));
}

export class Walker {
  constructor(camera, canStand, start, view) {
    this.camera = camera; this.canStand = canStand; this.keys = new Set(); this.stick = [0, 0];
    this.onStep = null;                                 // called at each footfall: (loudness, on the belt)
    Object.assign(this, { x: 0, z: 0, y: 0, vy: 0, vx: 0, vz: 0, glide: 0, phase: 0, bob: 0, grounded: true, yaw: 0, pitch: 0, still: 0, way: 1 });
    // where one starts: the stretch's start, or a view in the address (#b=150.2&r=131&h=30&p=-5: bearing and radius,
    // then heading and pitch in degrees, the heading from looking clockwise along the ring)
    const b0 = +(view.b ?? start.b), r0 = +(view.r ?? start.r), p = P(r0, b0);
    this.x = p.x; this.z = p.z;
    this.yaw = Math.atan2(-Math.cos(b0 * D), -Math.sin(b0 * D)) - (+(view.h ?? 0)) * D;
    this.pitch = (+(view.p ?? 0)) * D;
    addEventListener('keydown', e => { this.keys.add(e.code); if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('visibilitychange', () => this.keys.clear());
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0021; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * 0.0021));
  }

  held(...codes) { return codes.some(c => this.keys.has(c)) ? 1 : 0; }

  update(dt) {
    const b = bearingOf(this.x, this.z), r = Math.hypot(this.x, this.z);
    // what the keys ask for, relative to where one looks
    const f = this.held('KeyW', 'ArrowUp') - this.held('KeyS', 'ArrowDown') + this.stick[1], s = this.held('KeyD', 'ArrowRight') - this.held('KeyA', 'ArrowLeft') + this.stick[0];
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let tx = fx * f + rx * s, tz = fz * f + rz * s; const tl = Math.hypot(tx, tz);
    const speed = this.held('ShiftLeft', 'ShiftRight') || Math.hypot(...this.stick) > 0.95 ? RUN : WALK;
    if (tl > 0) { const g = Math.min(1, tl); tx *= speed * g / tl; tz *= speed * g / tl; }
    const k = 1 - Math.exp(-dt * (this.grounded ? 9.0 : 1.2));          // little to push against in the air
    this.vx += (tx - this.vx) * k; this.vz += (tz - this.vz) * k;
    // the Glide carries one round while one stands still on it, the way one faces; a key or a step stops it at once
    const onBelt = this.grounded && r > R_IN + 0.2 && r < BELT, [ux, uz] = along(b), [nx, nz] = outward(b);
    if (onBelt && f === 0 && s === 0 && !this.keys.has('Space')) {
      if (this.still <= RIDE_AFTER && this.still + dt > RIDE_AFTER) this.way = fx * ux + fz * uz >= 0 ? 1 : -1;
      this.still += dt;
    } else this.still = 0;
    const ride = onBelt && this.still > RIDE_AFTER;
    this.glide += ((ride ? GLIDE * this.way : 0) - this.glide) * (1 - Math.exp(-dt * (ride ? 1.4 : 9.0)));
    const dx = (this.vx + ux * this.glide) * dt, dz = (this.vz + uz * this.glide) * dt;
    // walls, furniture and water stop one: slide along the ring, or across it
    const ok = this.canStand;
    if (ok(this.x + dx, this.z + dz)) { this.x += dx; this.z += dz; }
    else {
      const a = dx * ux + dz * uz, c = dx * nx + dz * nz;
      if (ok(this.x + ux * a, this.z + uz * a)) { this.x += ux * a; this.z += uz * a; }
      else if (ok(this.x + nx * c, this.z + nz * c)) { this.x += nx * c; this.z += nz * c; }
      else if (ok(this.x + dx, this.z)) this.x += dx;
      else if (ok(this.x, this.z + dz)) this.z += dz;
      else { this.vx *= 0.5; this.vz *= 0.5; this.glide *= 0.5; }
    }
    // standing, jumping, landing: the Glide's belt is 6 cm up
    const ground = Math.hypot(this.x, this.z) < BELT ? 0.06 : 0.0;
    if (this.grounded && this.keys.has('Space')) { this.vy = JUMP; this.grounded = false; }
    if (!this.grounded) {
      this.vy -= GRAVITY * dt; this.y += this.vy * dt;
      if (this.y <= ground) {
        this.y = ground; this.grounded = true; this.bob = -0.06 * Math.min(1, Math.abs(this.vy) / JUMP);
        if (this.onStep) this.onStep(1.4, ground > 0); this.vy = 0;
      }
    } else this.y += (ground - this.y) * (1 - Math.exp(-dt * 20));
    // the head rises and falls a little with each step
    const v = Math.hypot(this.vx, this.vz);
    const was = Math.floor(this.phase / Math.PI);
    if (this.grounded) this.phase += dt * v / 0.75 * Math.PI;           // half a turn a step of 0.75 m
    if (this.onStep && Math.floor(this.phase / Math.PI) > was && v > 0.3) this.onStep(Math.min(1.2, 0.5 + v / RUN), ground > 0);
    this.onBelt = ride;
    const amp = Math.min(1, v / RUN) * 0.032 + Math.min(1, v / WALK) * 0.012;
    this.bob += (0 - this.bob) * (1 - Math.exp(-dt * 6));
    const bobY = amp * (0.5 - 0.5 * Math.cos(2 * this.phase)) + this.bob, sway = amp * 0.35 * Math.sin(this.phase);
    this.camera.position.set(this.x + rx * sway, this.y + EYE + bobY - amp * 0.5, this.z + rz * sway);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  get bearing() { return bearingOf(this.x, this.z); }

  // on a touch screen: the left thumb walks (a stick where it lands; pushed right out, one runs), the right one looks
  touch(el) {
    const fingers = new Map();
    el.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) fingers.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, walk: t.clientX < innerWidth / 2 });
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        const f = fingers.get(t.identifier); if (!f) continue;
        if (f.walk) { const R = 60; this.stick = [Math.max(-1, Math.min(1, (t.clientX - f.x0) / R)), Math.max(-1, Math.min(1, -(t.clientY - f.y0) / R))]; }
        else this.look((t.clientX - f.x) * 1.6, (t.clientY - f.y) * 1.6);
        f.x = t.clientX; f.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const end = e => { for (const t of e.changedTouches) { const f = fingers.get(t.identifier); if (f && f.walk) this.stick = [0, 0]; fingers.delete(t.identifier); } };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  }
}
