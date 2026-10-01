"""A made bed whose duvet and pillows are draped by Blender's cloth simulation, so they fold like real cloth."""
import bpy, bmesh, math
from mathutils import Vector, Matrix
import lib, furn


def _cloth_settle(obj, colliders, frames=40, pressure=0.0, mass=0.3, stiff=8.0, shrink=0.0, pins=None):
    """drop obj onto the colliders with the cloth solver, then keep the shape it settles into"""
    for c in colliders:
        if not any(m.type == "COLLISION" for m in c.modifiers):
            cm = c.modifiers.new("collision", "COLLISION"); c.collision.thickness_outer = 0.004; c.collision.cloth_friction = 8
    md = obj.modifiers.new("cloth", "CLOTH"); s = md.settings
    s.quality = 6; s.mass = mass; s.tension_stiffness = stiff; s.compression_stiffness = stiff; s.shear_stiffness = stiff * 0.6; s.bending_stiffness = 0.6
    s.air_damping = 2.0; s.shrink_min = shrink
    if pressure > 0: s.use_pressure = True; s.uniform_pressure_force = pressure
    md.collision_settings.use_self_collision = True; md.collision_settings.self_distance_min = 0.004; md.collision_settings.distance_min = 0.004
    if pins:
        g = obj.vertex_groups.new(name="pin"); g.add(pins, 1.0, "REPLACE"); s.vertex_group_mass = "pin"
    sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = frames
    md.point_cache.frame_start = 1; md.point_cache.frame_end = frames
    for f in range(1, frames + 1): sc.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get(); ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev); obj.modifiers.clear(); old = obj.data; obj.data = me
    sc.frame_set(1)
    return obj


def bed(name, loc, rot_z, M, w=2.0, l=2.15, mats=None):
    """local frame: the bed's foot at -y, the headboard at +y; origin at the floor in the middle"""
    P = furn.empty(name, (0, 0, 0)); parts = []
    base = lib.box(name + " base", (w + 0.16, l + 0.1, 0.32), (0, 0, 0.18), M["bed_fabric"], bevel=0.03, segs=4); parts.append(base)
    matt = furn.cushion(name + " mattress", (w, 0.24, l), (0, 0, 0.46), (math.pi / 2, 0, 0), M["sheet"]); parts.append(matt)
    matt.modifiers["sub"].levels = 2
    head = lib.box(name + " headboard", (w + 0.6, 0.16, 1.25), (0, l / 2 + 0.12, 0.62 + 0.3), M["bed_fabric"], bevel=0.05, segs=5); parts.append(head)
    for o in parts: o.parent = P
    bpy.context.view_layer.update()
    # pillows: puffed by pressure, dropped against the headboard
    pil = []
    for i, (x, y, z, sx, sz, rx) in enumerate(((-0.48, l / 2 - 0.16, 0.86, 0.68, 0.50, -18), (0.48, l / 2 - 0.16, 0.86, 0.68, 0.50, -18), (-0.45, l / 2 - 0.38, 0.72, 0.62, 0.42, -35), (0.45, l / 2 - 0.38, 0.72, 0.62, 0.42, -35))):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=6, use_grid_fill=True)
        bmesh.ops.scale(bm, vec=(sx, 0.12, sz), verts=bm.verts)
        p = lib.mesh_obj(name + " pillow", bm, M["sheet"] if i < 2 else M["pillow"], smooth=True); p.location = (x, y, z); p.rotation_euler = (math.radians(rx), 0, 0)
        _cloth_settle(p, [matt, head], frames=12, pressure=6.0, mass=0.15, stiff=6.0)
        sd = p.modifiers.new("sub", "SUBSURF"); sd.levels = 1; sd.render_levels = 2; pil.append(p); p.parent = P
    # the duvet: a quilt bigger than the bed, dropped from above so it falls over the sides
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=70, y_segments=60, size=0.5)
    bmesh.ops.scale(bm, vec=(w + 0.75, l * 0.78, 1), verts=bm.verts)
    du = lib.mesh_obj(name + " duvet", bm, M["duvet"], smooth=True); du.location = (0, -0.28, 0.72)
    sol = du.modifiers.new("thick", "SOLIDIFY"); sol.thickness = 0.03; sol.offset = 0
    _cloth_settle(du, [matt, base] + pil, frames=45, mass=0.4, stiff=10.0)
    sd = du.modifiers.new("sub", "SUBSURF"); sd.levels = 1; sd.render_levels = 2; du.parent = P
    P.location = loc; P.rotation_euler = (0, 0, rot_z)
    return P
