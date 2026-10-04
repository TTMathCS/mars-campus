"""Arcadia's gym equipment, as in the best hotel gyms: treadmills and rowers in graphite with black belts and pads and
a lit console, a rack of steel dumbbells, mats for yoga. Local frame as seating.py: x across the machine, the user
facing -y (the console's side), z up from the floor; placed by loc and rot_z."""
import bpy, math
import lib
from seating import soft_box, metal, _piece


def _mats():
    return dict(frame=metal("gym graphite", (0.075, 0.08, 0.085), 0.32), black=lib.principled("gym rubber", (0.018, 0.018, 0.02), 0.8),
                pad=lib.principled("gym leather", (0.035, 0.032, 0.03), 0.5), steel=metal("gym steel", (0.62, 0.62, 0.64), 0.16),
                screen=lib.emission("gym screen", (0.16, 0.36, 0.48), 2.2), wood=lib.wood("gym ash", (0.62, 0.50, 0.36), (0.48, 0.37, 0.25), 0.4))


def _b(name, size, centre, mat, r=0.01, tilt=0.0, yaw=0.0):
    return soft_box(name, size, centre, mat, r=r, crown=0, bulge=0, crease=0, sub=1, tilt=tilt, yaw=yaw)


def _cyl(name, r, h, centre, mat, axis="Z", verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=centre); o = bpy.context.active_object; o.name = name
    if axis == "X": o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "Y": o.rotation_euler = (math.pi / 2, 0, 0)
    o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = True
    bv = o.modifiers.new("bevel", "BEVEL"); bv.width = min(r, h) * 0.08; bv.segments = 2; bv.limit_method = "ANGLE"
    return o


def treadmill(name, loc, rot_z, length=2.05, width=0.88):
    """a deck with its black belt between two side rails, the motor hood at the front, two uprights leaning back to a
    console with its screen, handrails either side"""
    K = _mats(); L, W = length, width; f = -L / 2; parts = []
    parts.append(_b(name + " deck", (W, L - 0.3, 0.16), (0, 0.15, 0.13), K["frame"], 0.03))
    parts.append(_b(name + " belt", (W - 0.24, L - 0.42, 0.02), (0, 0.17, 0.22), K["black"], 0.008))
    for x in (-W / 2 + 0.06, W / 2 - 0.06): parts.append(_b(name + " rail", (0.11, L - 0.36, 0.035), (x, 0.17, 0.225), K["pad"], 0.01))
    parts.append(_b(name + " hood", (W, 0.42, 0.3), (0, f + 0.24, 0.15), K["frame"], 0.06))
    for x in (-W / 2 + 0.05, W / 2 - 0.05):
        parts.append(_b(name + " upright", (0.07, 0.09, 1.12), (x, f + 0.32, 0.82), K["frame"], 0.02, tilt=0.12))
        parts.append(_b(name + " handrail", (0.045, 0.62, 0.045), (x, f + 0.68, 1.06), K["pad"], 0.018))
    parts.append(_b(name + " console", (W + 0.04, 0.34, 0.08), (0, f + 0.36, 1.42), K["frame"], 0.03, tilt=0.55))
    parts.append(_b(name + " screen", (0.52, 0.22, 0.012), (0, f + 0.39, 1.465), K["screen"], 0.004, tilt=0.55))
    return _piece(name, loc, rot_z, parts)


def rower(name, loc, rot_z, length=2.45):
    """a rowing machine: a long rail of ash on two feet, the seat on it, the flywheel in its housing at the front,
    the foot plates and the handle"""
    K = _mats(); L = length; f = -L / 2; parts = []
    parts.append(_b(name + " rail", (0.14, L - 0.5, 0.06), (0, 0.18, 0.36), K["wood"], 0.012, tilt=-0.06))
    parts.append(_b(name + " back foot", (0.5, 0.08, 0.32), (0, L / 2 - 0.12, 0.16), K["wood"], 0.012))
    parts.append(_b(name + " front foot", (0.56, 0.1, 0.06), (0, f + 0.3, 0.03), K["wood"], 0.012))
    parts.append(_cyl(name + " flywheel", 0.29, 0.2, (0, f + 0.34, 0.42), K["frame"], axis="X", verts=64))
    parts.append(_cyl(name + " flywheel face", 0.22, 0.205, (0, f + 0.34, 0.42), K["black"], axis="X", verts=48))
    parts.append(_b(name + " seat", (0.3, 0.36, 0.07), (0, 0.15, 0.46), K["pad"], 0.03))
    for x in (-0.13, 0.13): parts.append(_b(name + " foot plate", (0.14, 0.3, 0.02), (x, f + 0.78, 0.34), K["frame"], 0.008, tilt=-0.7))
    parts.append(_b(name + " handle", (0.56, 0.035, 0.035), (0, f + 0.74, 0.56), K["pad"], 0.015))
    return _piece(name, loc, rot_z, parts)


def dumbbell(name, loc, w, mat, grip):
    """one dumbbell of w kg lying across the rack: two discs and a knurled grip"""
    r = 0.05 + 0.0045 * w; t = 0.04 + 0.002 * w; parts = [_cyl(name + " grip", 0.017, 0.14, (0, 0, 0), grip, axis="X", verts=16)]
    for s in (-1, 1): parts.append(_cyl(name + " head", r, t, (s * (0.07 + t / 2), 0, 0), mat, axis="X", verts=24))
    return _piece(name, loc, 0.0, parts)


def dumbbell_rack(name, loc, rot_z, length=2.4, pairs=8):
    """a two-tier rack in graphite with steel-capped dumbbells from 2 to 30 kg"""
    K = _mats(); parts = []
    for x in (-length / 2 + 0.06, length / 2 - 0.06): parts.append(_b(name + " end", (0.07, 0.62, 0.86), (x, 0, 0.43), K["frame"], 0.015))
    for (y, z) in ((-0.16, 0.42), (0.16, 0.78)): parts.append(_b(name + " shelf", (length - 0.1, 0.24, 0.04), (0, y, z), K["frame"], 0.01))
    p = _piece(name, loc, rot_z, parts)
    kg = [2, 4, 6, 8, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40][:2 * pairs]
    n = len(kg) // 2
    for tier, (y, z) in enumerate(((-0.16, 0.42), (0.16, 0.78))):
        for k in range(n):
            w = kg[tier * n + k] if tier * n + k < len(kg) else kg[-1]
            x = -length / 2 + 0.22 + (length - 0.44) * (k + 0.5) / n
            d = dumbbell(name + " dumbbell", (x, y, z + 0.02 + 0.05 + 0.0045 * w), w, K["steel"], K["black"]); d.parent = p
    return p


def mat(name, loc, rot_z, color=(0.22, 0.26, 0.24)):
    """a yoga mat, 1.85 by 0.62 m, rolled out"""
    return _piece(name, loc, rot_z, [_b(name + " mat", (0.62, 1.85, 0.006), (0, 0, 0.003), lib.principled(name + " rubber", color, 0.85), 0.003)])
