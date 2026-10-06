"""Arcadia's gym equipment, as in the best hotel gyms: treadmills, rowers and studio bikes in graphite with black belts
and pads and a lit console, a rack of steel dumbbells, a power rack with its bar and plates, weight benches, mats for
yoga. Local frame as seating.py: x across the machine, the user
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


def bike(name, loc, rot_z):
    """a studio bike: two feet and a spine, the flywheel in its hood at the front, the saddle and the bars on raked
    posts, the pedals, a small lit console"""
    K = _mats(); parts = []
    for y in (-0.5, 0.46): parts.append(_b(name + " foot", (0.56, 0.08, 0.06), (0, y, 0.03), K["frame"], 0.015))
    parts.append(_b(name + " spine", (0.08, 1.0, 0.08), (0, -0.02, 0.1), K["frame"], 0.02))
    parts.append(_cyl(name + " flywheel", 0.25, 0.05, (0, -0.3, 0.36), K["steel"], axis="X", verts=64))
    parts.append(_b(name + " hood", (0.15, 0.36, 0.42), (0, -0.4, 0.42), K["frame"], 0.05))
    parts.append(_b(name + " seat post", (0.06, 0.06, 0.78), (0, 0.2, 0.47), K["frame"], 0.015, tilt=-0.28))
    parts.append(_b(name + " saddle", (0.17, 0.28, 0.06), (0, 0.31, 0.88), K["pad"], 0.025))
    parts.append(_b(name + " bar post", (0.06, 0.06, 0.7), (0, -0.4, 0.86), K["frame"], 0.015, tilt=0.18))
    parts.append(_b(name + " bars", (0.52, 0.06, 0.035), (0, -0.48, 1.18), K["pad"], 0.015))
    parts.append(_b(name + " console", (0.22, 0.05, 0.14), (0, -0.44, 1.27), K["frame"], 0.01, tilt=0.5))
    parts.append(_b(name + " screen", (0.16, 0.012, 0.1), (0, -0.466, 1.275), K["screen"], 0.003, tilt=0.5))
    for x in (-0.12, 0.12): parts.append(_b(name + " pedal", (0.1, 0.12, 0.03), (x, -0.12, 0.3), K["black"], 0.008))
    return _piece(name, loc, rot_z, parts)


def weight_bench(name, loc, rot_z, length=1.3):
    """a flat bench: a long leather pad on a graphite rail, two legs on wide feet"""
    K = _mats(); parts = [_b(name + " pad", (0.3, length, 0.09), (0, 0, 0.46), K["pad"], 0.035),
                          _b(name + " rail", (0.08, length - 0.2, 0.08), (0, 0, 0.37), K["frame"], 0.02)]
    for y in (-length / 2 + 0.14, length / 2 - 0.14):
        parts.append(_b(name + " leg", (0.08, 0.08, 0.36), (0, y, 0.18), K["frame"], 0.02))
        parts.append(_b(name + " foot", (0.5, 0.08, 0.05), (0, y, 0.025), K["frame"], 0.015))
    return _piece(name, loc, rot_z, parts)


def power_rack(name, loc, rot_z, w=1.25, d=1.4, h=2.3):
    """a power rack: four graphite uprights on long feet, tied at the top; a steel bar on the front uprights with black
    plates either end; the user stands in it facing -y"""
    K = _mats(); parts = []
    for x in (-w / 2, w / 2):
        for y in (-d / 2, d / 2): parts.append(_b(name + " upright", (0.075, 0.075, h), (x, y, h / 2), K["frame"], 0.01))
        parts.append(_b(name + " top side", (0.075, d, 0.075), (x, 0, h - 0.04), K["frame"], 0.01))
        parts.append(_b(name + " foot", (0.09, d + 0.2, 0.05), (x, 0, 0.025), K["frame"], 0.01))
        parts.append(_b(name + " hook", (0.06, 0.1, 0.05), (x, -d / 2 + 0.07, 1.39), K["black"], 0.01))
    for y in (-d / 2, d / 2): parts.append(_b(name + " top", (w, 0.075, 0.075), (0, y, h - 0.04), K["frame"], 0.01))
    parts.append(_cyl(name + " bar", 0.014, 2.2, (0, -d / 2 + 0.08, 1.44), K["steel"], axis="X", verts=16))
    for sx in (-1, 1):
        for k, (r, t) in enumerate(((0.225, 0.05), (0.225, 0.05), (0.16, 0.035))):
            parts.append(_cyl(name + " plate", r, t, (sx * (w / 2 + 0.13 + 0.055 * k), -d / 2 + 0.08, 1.44), K["black"], axis="X", verts=48))
    return _piece(name, loc, rot_z, parts)


def kettlebell(name, loc, rot_z, kg=16):
    """a cast-iron kettlebell: a round bell flattened at the foot, a handle arched over it"""
    K = _mats(); r = 0.07 + 0.003 * kg; parts = []
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=(0, 0, r * 0.92)); b = bpy.context.active_object
    b.name = name + " bell"; b.scale = (1, 1, 0.92); b.data.materials.append(K["black"])
    for pg in b.data.polygons: pg.use_smooth = True
    parts.append(b)
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 0.62, minor_radius=0.016, major_segments=32, minor_segments=8, location=(0, 0, r * 1.75), rotation=(math.pi / 2, 0, 0))
    h = bpy.context.active_object; h.name = name + " handle"; h.data.materials.append(K["black"]); parts.append(h)
    return _piece(name, loc, rot_z, parts)


def med_ball(name, loc, d=0.32, color=(0.08, 0.09, 0.1)):
    """a medicine ball of soft rubber"""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=d / 2, location=(0, 0, d / 2)); b = bpy.context.active_object
    b.name = name; b.data.materials.append(lib.principled(name + " rubber", color, 0.75))
    for pg in b.data.polygons: pg.use_smooth = True
    return _piece(name, loc, 0.0, [b])


def plyo_box(name, loc, rot_z, size=(0.76, 0.6, 0.5)):
    """a jump box of ash plywood with rounded edges"""
    K = _mats(); w, d, h = size
    return _piece(name, loc, rot_z, [_b(name + " box", (w, d, h), (0, 0, h / 2), K["wood"], 0.025)])


def heavy_bag(name, loc, ceiling, h=1.2, d=0.38, bottom=0.55):
    """a heavy bag of black leather hung on a chain from the ceiling"""
    K = _mats(); parts = [_cyl(name + " bag", d / 2, h, (0, 0, bottom + h / 2), K["pad"], verts=40)]
    parts.append(_cyl(name + " chain", 0.008, ceiling - bottom - h, (0, 0, (ceiling + bottom + h) / 2), K["steel"], verts=8))
    return _piece(name, loc, 0.0, parts)
