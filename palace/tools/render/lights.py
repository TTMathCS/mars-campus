"""Arcadia's lights, made for rooms 12 to 20 m tall: halos of light hung on fine cables, clusters of opal globes
dropping to just above a bed or a table, alabaster pendants, bronze wall lights, picture lights over the paintings,
arched floor lamps. Each shows its glow (an emitting shape) and lights the room (a lamp inside it).
Heights in metres above the floor; ceiling: the height the cables hang from."""
import bpy, math, random
from mathutils import Vector
import lib
from seating import soft_box, metal, _piece


def _glow(name, color, strength):
    return lib.emission(name, color, strength)


def opal():
    m = bpy.data.materials.get("opal glass")
    if m: return m
    m = bpy.data.materials.new("opal glass"); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.95, 0.93, 0.90, 1); b.inputs["Roughness"].default_value = 0.25
    b.inputs["Transmission Weight"].default_value = 0.6; b.inputs["Subsurface Weight"].default_value = 0.4
    b.inputs["Emission Color"].default_value = (1.0, 0.80, 0.58, 1); b.inputs["Emission Strength"].default_value = 6.0
    return m


def _cable(name, top, bottom, mat, r=0.0025):
    d = Vector(bottom) - Vector(top); L_ = d.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=L_, location=(Vector(top) + Vector(bottom)) / 2)
    o = bpy.context.active_object; o.name = name; o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); o.data.materials.append(mat); return o


def halo(name, loc, d=3.2, z=5.0, ceiling=12.5, watts=900, color=(1.0, 0.80, 0.58)):
    """a ring of light d across hung at height z on three cables: a bronze band, its lit underside glowing"""
    x, y = loc[0], loc[1]; Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3); parts = []
    bpy.ops.mesh.primitive_torus_add(major_radius=d / 2, minor_radius=0.045, major_segments=192, minor_segments=16, location=(0, 0, z)); t = bpy.context.active_object
    t.name = name + " band"; t.scale = (1, 1, 0.7); t.data.materials.append(Bz)
    for p in t.data.polygons: p.use_smooth = True
    parts.append(t)
    bpy.ops.mesh.primitive_torus_add(major_radius=d / 2, minor_radius=0.02, major_segments=192, minor_segments=8, location=(0, 0, z - 0.035)); g = bpy.context.active_object
    g.name = name + " glow"; g.scale = (1, 1, 0.5); g.data.materials.append(_glow(name + " light", color, 30.0)); parts.append(g)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.3; px, py = d / 2 * math.cos(a), d / 2 * math.sin(a)
        parts.append(_cable(name + " cable", (px, py, ceiling), (px, py, z + 0.03), Bz))
    for k in range(6):                      # the lamps in the band
        a = 2 * math.pi * k / 6; lt = lib.point_light(name + " lamp", (d / 2 * math.cos(a), d / 2 * math.sin(a), z - 0.08), watts / 6, color, 0.05)
        parts.append(lt)
    return _piece(name, (x, y, 0.0), 0.0, parts)


def globes(name, loc, n=7, spread=0.55, low=1.7, high=2.6, ceiling=12.5, r=(0.09, 0.16), watts=40, seed=3):
    """a cluster of opal globes on fine bronze cables, hung at different heights"""
    rnd = random.Random(seed); Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3); parts = []
    for k in range(n):
        a = k * 2.39996; rr = spread * math.sqrt((k + 0.5) / n); px, py = rr * math.cos(a), rr * math.sin(a)
        rad = rnd.uniform(*r); z = rnd.uniform(low, high)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=rad, location=(px, py, z)); g = bpy.context.active_object
        g.name = name + " globe"; g.data.materials.append(opal())
        for p in g.data.polygons: p.use_smooth = True
        parts.append(g); parts.append(_cable(name + " cable", (px, py, ceiling), (px, py, z + rad), Bz, 0.0015))
        parts.append(lib.point_light(name + " lamp", (px, py, z), watts, (1.0, 0.78, 0.55), rad * 0.5))
    return _piece(name, (loc[0], loc[1], 0.0), 0.0, parts)


def alabaster_pendant(name, loc, z=1.75, ceiling=12.5, d=0.34, h=0.42, watts=60):
    """a pendant of alabaster, a tall cylinder lit from within, its veins showing"""
    m = bpy.data.materials.get("alabaster lit")
    if m is None:
        m = bpy.data.materials.new("alabaster lit"); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links; b = N["Principled BSDF"]
        w = N.new("ShaderNodeTexWave"); w.inputs["Scale"].default_value = 3.0; w.inputs["Distortion"].default_value = 10.0; tc = N.new("ShaderNodeTexCoord"); L.new(tc.outputs["Object"], w.inputs["Vector"])
        mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(w.outputs["Fac"], mx.inputs["Factor"]); mx.inputs[6].default_value = (1.0, 0.84, 0.62, 1); mx.inputs[7].default_value = (0.86, 0.62, 0.40, 1)
        L.new(mx.outputs[2], b.inputs["Base Color"]); L.new(mx.outputs[2], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 4.0; b.inputs["Roughness"].default_value = 0.4
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=d / 2, depth=h, location=(0, 0, z)); o = bpy.context.active_object; o.name = name + " shade"; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3)
    parts = [o, _cable(name + " cable", (0, 0, ceiling), (0, 0, z + h / 2), Bz, 0.002), lib.point_light(name + " lamp", (0, 0, z), watts, (1.0, 0.76, 0.52), 0.06)]
    cap = soft_box(name + " cap", (d * 0.5, d * 0.5, 0.03), (0, 0, z + h / 2 + 0.015), Bz, r=0.01, crown=0, bulge=0, crease=0, sub=1); parts.append(cap)
    return _piece(name, (loc[0], loc[1], 0.0), 0.0, parts)


def sconce(name, loc, rot_z, z=2.4, watts=40):
    """a wall light: a bronze plate, an opal half-cylinder washing the wall up and down"""
    Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3)
    parts = [soft_box(name + " plate", (0.16, 0.02, 0.5), (0, 0.01, z), Bz, r=0.008, crown=0, bulge=0, crease=0, sub=1),
             soft_box(name + " shade", (0.14, 0.09, 0.36), (0, -0.04, z), opal(), r=0.04, crown=0, bulge=0, crease=0, sub=1)]
    parts.append(lib.point_light(name + " lamp", (0, -0.05, z), watts, (1.0, 0.78, 0.55), 0.04))
    return _piece(name, loc, rot_z, parts)


def picture_light(name, loc, rot_z, width=1.2, z=3.0, watts=30):
    """a picture light: a slim bronze bar on an arm above a painting, lighting it from above"""
    Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3)
    parts = [soft_box(name + " bar", (width, 0.06, 0.04), (0, -0.16, z), Bz, r=0.012, crown=0, bulge=0, crease=0, sub=1),
             soft_box(name + " arm", (0.02, 0.16, 0.02), (0, -0.08, z + 0.02), Bz, r=0.005, crown=0, bulge=0, crease=0, sub=0)]
    lt = bpy.data.lights.new(name + " light", "AREA"); lt.shape = "RECTANGLE"; lt.size = width; lt.size_y = 0.04; lt.energy = watts; lt.color = (1.0, 0.84, 0.64)
    o = bpy.data.objects.new(name + " lamp", lt); lib.link(o); o.location = (0, -0.16, z - 0.03); o.rotation_euler = (math.radians(-35), 0, 0); parts.append(o)
    return _piece(name, loc, rot_z, parts)


def arc_lamp(name, loc, rot_z, reach=2.0, top=2.3, watts=80):
    """an arched floor lamp: a marble block, a bronze arc, a dome over the sofa"""
    from seating import stone
    Bz = metal("halo bronze", (0.30, 0.21, 0.12), 0.3); parts = [soft_box(name + " base", (0.36, 0.26, 0.3), (0, 0, 0.15), stone("lamp marble", (0.88, 0.86, 0.82), (0.4, 0.38, 0.36), "marble", 0.15), r=0.01, crown=0, bulge=0, crease=0, sub=1)]
    pts = [Vector((0, 0, 0.3)), Vector((0, -reach * 0.15, top)), Vector((0, -reach * 0.7, top + 0.1)), Vector((0, -reach, top - 0.4))]
    curve = bpy.data.curves.new(name + " arc", "CURVE"); curve.dimensions = "3D"; sp = curve.splines.new("BEZIER"); sp.bezier_points.add(1)
    sp.bezier_points[0].co = pts[0]; sp.bezier_points[0].handle_right = pts[1]; sp.bezier_points[0].handle_left = pts[0] - (pts[1] - pts[0])
    sp.bezier_points[1].co = pts[3]; sp.bezier_points[1].handle_left = pts[2]; sp.bezier_points[1].handle_right = pts[3] + (pts[3] - pts[2])
    curve.bevel_depth = 0.012; curve.bevel_resolution = 3; co = bpy.data.objects.new(name + " arc", curve); lib.link(co); co.data.materials.append(Bz); parts.append(co)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.24, location=(0, -reach, top - 0.45)); dm = bpy.context.active_object
    dm.name = name + " dome"; dm.scale = (1, 1, 0.55); dm.data.materials.append(Bz)
    for p in dm.data.polygons: p.use_smooth = True
    parts.append(dm); parts.append(lib.spot_light(name + " lamp", (0, -reach, top - 0.5), watts, (1.0, 0.78, 0.55), 0.04, 70, 0.6))
    return _piece(name, loc, rot_z, parts)


def strip(name, p0, p1, color=(1.0, 0.78, 0.55), strength=20.0, w=0.02):
    """a line of light (behind a headboard, under a shelf): a thin glowing bar from p0 to p1"""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(p0 + p1) / 2); o = bpy.context.active_object; o.name = name
    o.scale = (d.length, w, w); o.rotation_euler = (0, 0, math.atan2(d.y, d.x)); o.data.materials.append(_glow(name + " light", color, strength)); return o
