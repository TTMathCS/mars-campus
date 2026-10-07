// A small map of the Crown's ring in a corner: the ring, the stretches one can walk lit, the Orb in the middle, and a
// dot that turns with one's heading. North is up, as on the plans.
import { D } from './ring.js';

export class RingMap {
  constructor(el, spans) {          // spans: the stretches one can walk, [b0, b1] in degrees
    this.el = el; this.spans = spans; this.c = document.createElement('canvas'); el.appendChild(this.c);
    this.size = 0; this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const css = this.el.clientWidth || 96, pr = Math.min(2, devicePixelRatio || 1);
    this.size = css; this.c.width = this.c.height = Math.round(css * pr); this.c.style.width = this.c.style.height = css + 'px';
    this.g = this.c.getContext('2d'); this.g.setTransform(pr, 0, 0, pr, 0, 0);
  }

  draw(bearing, yaw) {
    const g = this.g, s = this.size, c = s / 2, R = s * 0.40, arc = b => (b - 90) * D;   // bearing 0 at the top
    g.clearRect(0, 0, s, s);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(244,237,228,0.22)'; g.lineWidth = s * 0.07; g.beginPath(); g.arc(c, c, R, 0, 2 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(224,164,106,0.75)';
    for (const [b0, b1] of this.spans) { g.beginPath(); g.arc(c, c, R, arc(b0), arc(b1)); g.stroke(); }
    g.fillStyle = 'rgba(244,237,228,0.30)'; g.beginPath(); g.arc(c, c, s * 0.075, 0, 2 * Math.PI); g.fill();     // the Orb
    const x = c + R * Math.cos(arc(bearing)), y = c + R * Math.sin(arc(bearing));
    const h = -yaw - Math.PI / 2;                                                       // where one looks, on the map
    g.fillStyle = 'rgba(244,237,228,0.22)'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, s * 0.2, h - 0.5, h + 0.5); g.closePath(); g.fill();
    g.fillStyle = '#f4ede4'; g.beginPath(); g.arc(x, y, s * 0.045, 0, 2 * Math.PI); g.fill();
  }
}
