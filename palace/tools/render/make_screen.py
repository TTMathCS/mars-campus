"""The picture on the cinema's screen (pent_rooms.py, cinema): the Earth from space, centred on Europe and Africa,
the sun from the left, on black with a few stars. Made from NASA's Blue Marble (assets/earth4k.jpg, fetch_assets.py).
  python3 palace/tools/render/make_screen.py      -> assets/screen_earth.jpg, 2400 x 1012 (the screen is 12 m by 5.06 m)"""
import os
import numpy as np
from PIL import Image

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
W, H = 2400, 1012
LON0, LAT0 = np.radians(12.0), np.radians(18.0)       # the point of the Earth facing us
SUN = np.array([-0.62, 0.30, 0.72])                   # towards the sun: left, a little up, mostly towards us


def main():
    earth = np.asarray(Image.open(os.path.join(ASSETS, "earth4k.jpg")).convert("RGB"), dtype=np.float32) / 255.0
    eh, ew, _ = earth.shape
    r = 0.42 * H                                       # the disc's radius in pixels
    X, Y = np.meshgrid(np.arange(W) - W / 2 + 0.5, H / 2 - np.arange(H) - 0.5)
    x, y = X / r, Y / r; rr = x * x + y * y; disc = rr < 1.0
    z = np.sqrt(np.clip(1.0 - rr, 0.0, 1.0))
    # turn the view (x right, y up, z towards us) into latitude and longitude
    cy, sy = np.cos(LAT0), np.sin(LAT0)
    yy = y * cy + z * sy; zz = -y * sy + z * cy
    lat = np.arcsin(np.clip(yy, -1, 1)); lon = LON0 + np.arctan2(x, zz)
    u = ((lon / (2 * np.pi) + 0.5) % 1.0) * (ew - 1); v = (0.5 - lat / np.pi) * (eh - 1)
    col = earth[v.astype(int).clip(0, eh - 1), u.astype(int).clip(0, ew - 1)]
    s = SUN / np.linalg.norm(SUN); lit = x * s[0] + y * s[1] + z * s[2]
    day = np.clip((lit + 0.08) / 0.38, 0.0, 1.0) ** 1.4                 # a soft terminator
    limb = 0.55 + 0.45 * z ** 0.35                                     # darker towards the edge
    img = col * (day * limb)[..., None] * 1.05
    haze = np.clip(1.0 - z, 0, 1) ** 2.2 * np.clip(lit + 0.25, 0, 1)    # blue air towards the lit edge
    img = img + haze[..., None] * np.array([0.25, 0.42, 0.75]) * 0.55
    out = np.zeros((H, W, 3), np.float32); out[disc] = img[disc]
    d = np.sqrt(rr); glow = np.clip(1.0 - (d - 1.0) / 0.035, 0, 1) * (d >= 1.0) * np.clip(x * s[0] + y * s[1] + 0.4, 0, 1)
    out += glow[..., None] * np.array([0.30, 0.50, 0.95]) * 0.6
    rng = np.random.default_rng(7)                                     # a few faint stars, away from the Earth
    for _ in range(260):
        px, py = rng.integers(0, W), rng.integers(0, H)
        if ((px - W / 2) ** 2 + (H / 2 - py) ** 2) ** 0.5 > r * 1.08: out[py, px] = rng.uniform(0.25, 0.8)
    Image.fromarray((np.clip(out, 0, 1) ** (1 / 1.05) * 255).astype(np.uint8)).save(os.path.join(ASSETS, "screen_earth.jpg"), quality=92)
    print("saved", os.path.join(ASSETS, "screen_earth.jpg"))


if __name__ == "__main__":
    main()
