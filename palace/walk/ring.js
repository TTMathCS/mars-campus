// The Crown's ring: its numbers (as palace/tools/render/crown.py) and its frame. Bearing b in degrees clockwise from
// north, radius r from the ring's centre; the floor is at y = 0, 41 m above the plain. Blender's (x, y, z) is
// (x, z, -y) here, so north is -z.
import * as THREE from 'three';

export const D = Math.PI / 180;
export const R_IN = 115.0, R_OUT = 135.0, R_GL = 118.5;     // the inner wall, the outer wall, the Glide's edge (m): revision H
export const BELT = R_GL - 0.25;                            // the Glide's moving belt runs from R_IN to here
export const ORB_R = 24.0, ORB_Y = 31.0;                    // the Orb: radius, centre above the floor

export const P = (r, b, y = 0) => new THREE.Vector3(r * Math.sin(b * D), y, -r * Math.cos(b * D));
export const bearingOf = (x, z) => ((Math.atan2(x, -z) / D) % 360 + 360) % 360;
// the way round the ring, clockwise (growing bearing), and the way out from its centre, at bearing b
export const along = b => [Math.cos(b * D), Math.sin(b * D)];
export const outward = b => [Math.sin(b * D), -Math.cos(b * D)];
