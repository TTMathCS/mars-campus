"""Arcadia's tables and cabinets, made for big rooms: monolithic coffee tables of travertine or marble, stone drums
beside the sofas, a writing desk of walnut, leather and bronze, nightstands that float from the bed wall, consoles.
Local frame as seating.py: x along a piece, its front to -y, z up from the floor; placed by loc and rot_z."""
import bpy, math
from mathutils import Vector
import lib
from seating import soft_box, stone, metal, _piece


def _block(name, size, centre, mat, r=0.01, yaw=0.0):
    return soft_box(name, size, centre, mat, r=r, crown=0, bulge=0, crease=0, sub=1, yaw=yaw)


def coffee_table(name, loc, rot_z, length=2.4, width=1.2, h=0.36, mat=None, kind="slab"):
    """a low table for a sofa group: a stone slab on a recessed plinth (slab), two stacked stone blocks (stack), or a
    round drum (round, length = its diameter)"""
    S = mat or stone("coffee travertine", (0.80, 0.73, 0.62), (0.62, 0.55, 0.45), "travertine", 0.3); parts = []
    if kind == "round":
        bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=length / 2, depth=0.07, location=(0, 0, h - 0.035)); top = bpy.context.active_object
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=length / 2 * 0.62, depth=h - 0.07, location=(0, 0, (h - 0.07) / 2)); foot = bpy.context.active_object
        for o, nm in ((top, " top"), (foot, " drum")):
            o.name = name + nm; o.data.materials.append(S); bv = o.modifiers.new("bevel", "BEVEL"); bv.width = 0.008; bv.segments = 3; bv.limit_method = "ANGLE"
            for p in o.data.polygons: p.use_smooth = True
            parts.append(o)
    elif kind == "stack":
        parts.append(_block(name + " lower", (length, width, h * 0.55), (0, 0, h * 0.275), S, 0.012))
        parts.append(_block(name + " upper", (length * 0.62, width * 0.9, h * 0.45), (length * 0.16, 0.02, h * 0.55 + h * 0.225), S, 0.012))
    else:
        parts.append(_block(name + " top", (length, width, 0.09), (0, 0, h - 0.045), S, 0.015))
        parts.append(_block(name + " base", (length - 0.5, width - 0.36, h - 0.09), (0, 0, (h - 0.09) / 2), S, 0.01))
    return _piece(name, loc, rot_z, parts)


def drum(name, loc, d=0.55, h=0.52, mat=None):
    """a side table: a drum of stone or bronze"""
    S = mat or stone("drum travertine", (0.78, 0.71, 0.60), (0.60, 0.53, 0.43), "travertine", 0.3)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=d / 2, depth=h, location=(0, 0, h / 2)); o = bpy.context.active_object
    o.name = name; o.data.materials.append(S); bv = o.modifiers.new("bevel", "BEVEL"); bv.width = 0.006; bv.segments = 3; bv.limit_method = "ANGLE"
    for p in o.data.polygons: p.use_smooth = True
    return _piece(name + " table", loc, 0.0, [o])


def desk(name, loc, rot_z, length=2.6, depth=0.95, wood=None, leather=None, bronze=None):
    """a writing desk: a thick walnut top with a leather writing field set in, a pedestal of drawers at one end and a
    bronze frame at the other"""
    W = wood or lib.wood("desk walnut", (0.20, 0.12, 0.07), (0.10, 0.06, 0.035), 0.35); Lth = leather or lib.principled("desk leather inlay", (0.10, 0.07, 0.05), 0.45)
    Bz = bronze or metal("desk bronze", (0.32, 0.22, 0.13), 0.28); parts = []
    parts.append(_block(name + " top", (length, depth, 0.06), (0, 0, 0.74), W, 0.008))
    parts.append(_block(name + " leather", (length * 0.55, depth * 0.55, 0.004), (0, -0.05, 0.772), Lth, 0.002))
    pw = 0.55; parts.append(_block(name + " pedestal", (pw, depth - 0.06, 0.71), (length / 2 - pw / 2 - 0.03, 0, 0.355), W, 0.008))
    for k in range(3):
        parts.append(_block(name + " pull", (0.18, 0.012, 0.012), (length / 2 - pw / 2 - 0.03, -depth / 2 + 0.025, 0.62 - k * 0.22), Bz, 0.004))
    x = -length / 2 + 0.06
    for y in (-depth / 2 + 0.06, depth / 2 - 0.06): parts.append(_block(name + " leg", (0.05, 0.05, 0.71), (x, y, 0.355), Bz, 0.008))
    parts.append(_block(name + " rail", (0.05, depth - 0.12, 0.04), (x, 0, 0.05), Bz, 0.006))
    parts.append(_block(name + " stretcher", (length - pw - 0.15, 0.04, 0.04), (-pw / 2 - 0.05, depth / 2 - 0.06, 0.05), Bz, 0.006))
    return _piece(name, loc, rot_z, parts)


def nightstand(name, loc, rot_z, w=0.7, d=0.48, h=0.5, wood=None, top=None):
    """a nightstand: a walnut box with a drawer, a stone top"""
    W = wood or lib.wood("night walnut", (0.20, 0.12, 0.07), (0.10, 0.06, 0.035), 0.35); T = top or stone("night marble", (0.86, 0.84, 0.80), (0.42, 0.40, 0.38), "marble", 0.15)
    parts = [_block(name + " body", (w, d, h - 0.03), (0, 0, (h - 0.03) / 2), W, 0.006), _block(name + " top", (w + 0.01, d + 0.01, 0.03), (0, 0, h - 0.015), T, 0.004)]
    parts.append(_block(name + " pull", (0.16, 0.012, 0.012), (0, -d / 2 - 0.004, h - 0.12), metal("desk bronze", (0.32, 0.22, 0.13), 0.28), 0.004))
    return _piece(name, loc, rot_z, parts)


def console(name, loc, rot_z, length=2.4, depth=0.45, h=0.8, mat=None, legs=None):
    """a console against a wall: a stone top on two bronze trestles"""
    S = mat or stone("console marble", (0.86, 0.84, 0.80), (0.42, 0.40, 0.38), "marble", 0.15); Bz = legs or metal("desk bronze", (0.32, 0.22, 0.13), 0.28)
    parts = [_block(name + " top", (length, depth, 0.05), (0, 0, h - 0.025), S, 0.006)]
    for x in (-length / 2 + 0.25, length / 2 - 0.25):
        parts.append(_block(name + " trestle", (0.05, depth - 0.08, h - 0.05), (x, 0, (h - 0.05) / 2), Bz, 0.006))
    return _piece(name, loc, rot_z, parts)


def dining_table(name, loc, rot_z, length=4.2, width=1.3, mat=None, base=None):
    """a long dining table: a stone top on two stone pedestals"""
    S = mat or stone("dining travertine", (0.80, 0.73, 0.62), (0.62, 0.55, 0.45), "travertine", 0.2); Bm = base or S
    parts = [_block(name + " top", (length, width, 0.06), (0, 0, 0.73), S, 0.01)]
    for x in (-length * 0.3, length * 0.3): parts.append(_block(name + " pedestal", (0.4, width * 0.55, 0.7), (x, 0, 0.35), Bm, 0.01))
    return _piece(name, loc, rot_z, parts)
