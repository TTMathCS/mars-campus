// The ring's chunks (6° of it each, as walk_bake.py cut it): loaded as one comes near, let go far behind, so the
// whole ring, about 800 m of rooms, never has to be in the browser at once. Near is about as far as one can see along
// the curve of the ring between its walls (32°).
const DATA = 'data/';

export const centreOf = c => (((c.b0 + c.b1) / 2) % 360 + 360) % 360;
export const apart = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

export class Chunks {
  constructor({ chunks, loader, texLoader, scene, convert, mirror, aniso, near = 32, far = 44 }) {
    Object.assign(this, { chunks, loader, texLoader, scene, convert, mirror, aniso, near, far });
    this.state = new Map(); this.busy = 0;
  }

  async load(c) {
    this.state.set(c.file, { loading: true }); this.busy++;
    try {
      const [g, light] = await Promise.all([this.loader.loadAsync(DATA + c.file), this.texLoader.loadAsync(DATA + c.light)]);
      light.colorSpace = 'srgb'; light.flipY = false; light.anisotropy = this.aniso;
      this.convert(g.scene, light); this.scene.add(g.scene);
      this.state.set(c.file, { group: g.scene, light });
    } catch (e) { this.state.delete(c.file); console.warn('chunk', c.file, e); }
    this.busy--;
  }

  drop(c) {
    const s = this.state.get(c.file); if (!s || !s.group) return;
    this.scene.remove(s.group);
    const gone = new Set();
    s.group.traverse(o => {
      if (!o.isMesh) return; gone.add(o); o.geometry.dispose();
      for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); }
    });
    s.light.dispose(); this.mirror.hide = this.mirror.hide.filter(o => !gone.has(o));
    this.state.delete(c.file);
  }

  // the chunks within `within` degrees of a bearing, nearest first: for the start (the room one stands in; the rest
  // streams in while one walks), with a call after each chunk
  async around(b, each, within = this.near) {
    const want = this.chunks.filter(c => apart(centreOf(c), b) <= within).sort((p, q) => apart(centreOf(p), b) - apart(centreOf(q), b));
    for (let i = 0; i < want.length; i += 3) {
      await Promise.all(want.slice(i, i + 3).map(c => this.load(c).then(() => each && each())));
    }
    return want.length;
  }

  // each frame: start on the nearest chunk still missing (two at a time), let go of those far behind
  update(b) {
    if (this.busy < 2) {
      let best = null, bd = 1e9;
      for (const c of this.chunks) {
        if (this.state.has(c.file)) continue;
        const d = apart(centreOf(c), b); if (d <= this.near && d < bd) { best = c; bd = d; }
      }
      if (best) this.load(best);
    }
    for (const c of this.chunks) if (this.state.get(c.file)?.group && apart(centreOf(c), b) > this.far) this.drop(c);
  }
}
