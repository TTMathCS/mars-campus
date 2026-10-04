// Sound, made as one walks (nothing to download): soft steps on stone, wood or the Glide's belt, quieter in Mars's
// low gravity, and the hush of a large, still room. M turns it off and on.
export class Sound {
  constructor() { this.ctx = null; this.on = true; }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C(), n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);
    // the room: brown-ish noise, very low, a little air moving
    const room = ctx.createBufferSource(); room.buffer = buf; room.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0.035; room.connect(lp).connect(g).connect(this.master); room.start();
    // the Glide's belt, a soft hum while on it
    const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 52;
    const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 160;
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0; hum.connect(hl).connect(this.humGain).connect(this.master); hum.start();
  }

  toggle() { this.on = !this.on; if (this.master) this.master.gain.setTargetAtTime(this.on ? 0.9 : 0, this.ctx.currentTime, 0.05); }

  glide(level) { if (this.humGain) this.humGain.gain.setTargetAtTime(0.02 * level, this.ctx.currentTime, 0.3); }

  // one step: a dull thump and a short brush of grit; soft is the floor (stone 0, wood 0.5, belt 1)
  step(loud = 1, soft = 0) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 - 500 * soft + Math.random() * 200; bp.Q.value = 0.9;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12 * loud, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09 + 0.05 * soft);
    s.connect(bp).connect(g).connect(this.master); s.start(t, Math.random() * 1.5, 0.2);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95 - 25 * soft, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.08);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.16 * loud, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.12);
  }
}
