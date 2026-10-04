"""The memory rooms (L1-14), ring D of Jim's residence (sector 1 of L1), for Cycles: Jim's keepsakes from Earth,
family photographs, letters and the things he brought from home, in a suite of quiet rooms; where he records his
memoirs, and where visiting family find the family's history. Built in the family room's frame (x along the ring,
y out from the atrium's glass, z up from L1's floor); ring D runs from y = 54 to 68.

The gallery of photographs, the middle room of the suite: walls of deep green over a walnut dado, photographs of the
places of Jim's life hung close on the long wall under brass picture lights, two glass cases of keepsakes, a reading
table with the albums, two armchairs, the desk where he records his memoirs; doorways on to the next rooms of the
suite, and a sky ceiling over the middle. The photographs are real places on Earth (make_photos.py).
  bvenv/bin/python blend/memory.py <room> <cam[,cam...]|pano:stop|plan:view> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, family, crown_rooms

A = lib.ASSETS
Y0, Y1, HM = 54.2, 67.8, 4.2           # the room's walls across the ring, and its ceiling
X0, X1 = -8.0, 8.0                     # its end walls, with the doorways to the next rooms
YM = (Y0 + Y1) / 2
SKY = (0.0, YM, 6.0, 4.0)              # the sky ceiling: centre and size


def photo(i): return os.path.join(A, "photos", "photo_%02d.jpg" % (i % 12))


def materials(M):
    P = lib.principled
    M["green"] = lib.plaster("gallery green", (0.105, 0.15, 0.125), 0.85, 0.02)
    M["walnut_dado"] = lib.wood("walnut dado", (0.20, 0.11, 0.06), (0.085, 0.045, 0.025), 0.32, along="X")
    M["gilt"] = P("gilt", (0.72, 0.52, 0.24), 0.32, 1.0)
    M["ebony_frame"] = P("black frame", (0.02, 0.018, 0.016), 0.4)
    M["oak_frame"] = lib.wood("oak frame", (0.45, 0.31, 0.18), (0.30, 0.20, 0.11), 0.4)
    M["mat"] = P("print mat", (0.86, 0.84, 0.79), 0.85)
    M["case_glass"] = lib.glass("case glass", (0.97, 0.98, 0.97), 0.0, 1.5)
    M["velvet"] = lib.fabric("case velvet", (0.09, 0.07, 0.06), 0.9, 0.8, 600)
    M["paper"] = P("old paper", (0.80, 0.74, 0.60), 0.8)
    M["ribbon"] = P("ribbon", (0.40, 0.04, 0.05), 0.5, **{"Sheen Weight": 0.6})
    M["gold"] = P("gold", (0.92, 0.70, 0.36), 0.22, 1.0)
    M["silver"] = P("silver", (0.80, 0.80, 0.78), 0.18, 1.0)
    M["leather_book"] = P("album leather", (0.16, 0.06, 0.04), 0.55)
    M["leather_book2"] = P("album leather green", (0.05, 0.10, 0.07), 0.55)
    M["chair_leather"] = P("cognac leather", (0.30, 0.13, 0.05), 0.42, **{"Coat Weight": 0.25})
    M["picture_light"] = lib.emission("picture light", (1.0, 0.80, 0.56), 12.0)
    M["sky"] = lib.emission("sky ceiling", (0.88, 0.93, 1.0), 3.0)
    M["deep"] = P("dark beyond", (0.02, 0.02, 0.02), 0.9)
    return M


def frame_photo(name, i, w, h, loc, rot_z, M, frame="gilt", mat=0.06, light=False):
    """a photograph in a frame on a wall; it looks along its local -y. A brass picture light over it if light"""
    g = furn.empty(name, loc, rot_z)
    im = crown_rooms.picture_quad(name + " print", w, h, crown_rooms.image_material("photo %02d" % (i % 12), photo(i), 0.0, 0.45)); im.location = (0, -0.022, 0); im.parent = g
    W, H = w + 2 * mat, h + 2 * mat
    if mat > 0:
        m_ = lib.box(name + " mat", (W, 0.01, H), (0, -0.016, 0), M["mat"]); m_.parent = g
    fw = 0.045 if frame == "gilt" else 0.03; fm = M["gilt"] if frame == "gilt" else (M["ebony_frame"] if frame == "black" else M["oak_frame"])
    for (sx, sz, px, pz) in ((W + 2 * fw, fw, 0, H / 2 + fw / 2), (W + 2 * fw, fw, 0, -H / 2 - fw / 2), (fw, H, W / 2 + fw / 2, 0), (fw, H, -W / 2 - fw / 2, 0)):
        fr = lib.box(name + " frame", (sx, 0.04, sz), (px, -0.02, pz), fm, bevel=0.008 if frame == "gilt" else 0.003); fr.parent = g
    gl = lib.box(name + " glass", (W, 0.004, H), (0, -0.03, 0), M["case_glass"]); gl.parent = g
    if light:
        arm = lib.cyl(name + " light arm", 0.008, 0.16, (0, 0, 0), M["brass"], verts=8, rot=(-math.pi / 2 + 0.5, 0, 0)); arm.location = (0, 0.0, H / 2 + fw + 0.04); arm.parent = g
        bar = lib.cyl(name + " light", 0.022, min(0.6, W * 0.7), (0, 0, 0), M["brass"], verts=16, rot=(0, math.pi / 2, 0)); bar.location = (-min(0.6, W * 0.7) / 2, -0.15, H / 2 + fw + 0.16); bar.parent = g
        lens = lib.box(name + " light lens", (min(0.6, W * 0.7) - 0.02, 0.012, 0.005), (0, -0.15, H / 2 + fw + 0.137), M["picture_light"]); lens.parent = g
        sp = lib.spot_light(name + " light beam", (0, 0, 0), 16, (1.0, 0.80, 0.56), 0.02, 75, 0.8); sp.parent = g; sp.location = (0, -0.16, H / 2 + fw + 0.13); sp.rotation_euler = (math.radians(28), 0, 0)
    return g


def walls(M):
    # floor, the walls with a walnut dado and picture rail, the ceiling with its sky
    lib.box("floor", (X1 - X0 + 20.0, Y1 - Y0 + 1.0, 0.1), (0, YM, -0.05), M["oak"])
    for (y, s_) in ((Y0, -1), (Y1, 1)):
        lib.box("long wall", (X1 - X0 + 0.6, 0.3, HM + 0.4), (0, y + s_ * 0.15, (HM + 0.4) / 2), M["green"])
        lib.box("dado", (X1 - X0, 0.025, 0.95), (0, y - s_ * 0.0125, 0.475), M["walnut_dado"], bevel=0.004)
        lib.box("dado rail", (X1 - X0, 0.05, 0.05), (0, y - s_ * 0.025, 0.97), M["walnut_dado"], bevel=0.01)
        lib.box("picture rail", (X1 - X0, 0.035, 0.04), (0, y - s_ * 0.0175, 3.3), M["walnut_dado"], bevel=0.008)
        lib.box("skirting", (X1 - X0, 0.03, 0.14), (0, y - s_ * 0.015, 0.07), M["walnut_dado"])
    for (x, s_) in ((X0, -1), (X1, 1)):            # end walls with doorways 2.4 m wide onto the next rooms
        for (a, b) in ((Y0, YM - 1.2), (YM + 1.2, Y1)):
            lib.box("end wall", (0.3, b - a, HM + 0.4), (x + s_ * 0.15, (a + b) / 2, (HM + 0.4) / 2), M["green"])
            lib.box("dado", (0.025, b - a, 0.95), (x - s_ * 0.0125, (a + b) / 2, 0.475), M["walnut_dado"], bevel=0.004)
        lib.box("door head", (0.3, 2.4, HM + 0.4 - 3.0), (x + s_ * 0.15, YM, 3.0 + (HM + 0.4 - 3.0) / 2), M["green"])
        for yy in (YM - 1.2, YM + 1.2): lib.box("door casing", (0.36, 0.08, 3.0), (x + s_ * 0.15, yy - math.copysign(0.04, yy - YM) * -1, 1.5), M["walnut_dado"])
        lib.box("door casing head", (0.36, 2.56, 0.08), (x + s_ * 0.15, YM, 3.04), M["walnut_dado"])
    ceil = lib.box("ceiling", (X1 - X0 + 0.6, Y1 - Y0 + 0.6, 0.3), (0, YM, HM + 0.15), M["ceiling"])
    cut = lib.box("sky cut", (SKY[2], SKY[3], 1.0), (SKY[0], SKY[1], HM + 0.15), None); cut.hide_render = True; cut.hide_viewport = True
    bo = ceil.modifiers.new("sky", "BOOLEAN"); bo.object = cut; bo.operation = "DIFFERENCE"; bo.solver = "EXACT"
    lib.box("sky panel", (SKY[2], SKY[3], 0.02), (SKY[0], SKY[1], HM + 0.55), M["sky"])
    for (sx, sy, px, py) in ((SKY[2], 0.04, 0, -SKY[3] / 2), (SKY[2], 0.04, 0, SKY[3] / 2), (0.04, SKY[3], -SKY[2] / 2, 0), (0.04, SKY[3], SKY[2] / 2, 0)):
        lib.box("sky trim", (sx, sy, 0.4), (SKY[0] + px, SKY[1] + py, HM + 0.35), M["walnut_dado"])
    lib.area_light("sky light", (SKY[0], SKY[1], HM + 0.1), SKY[2] - 0.2, 900, (0.88, 0.93, 1.0), size_y=SKY[3] - 0.2)
    # the doorway from the street in the middle of the inner wall: a pair of walnut doors, open on the street's light
    cut2 = lib.box("door cut", (2.0, 1.0, 2.8), (0, Y0, 1.4), None); cut2.hide_render = True; cut2.hide_viewport = True
    for o in bpy.data.objects:
        if o.name.startswith(("long wall", "dado", "skirting")) and o.location.y < YM:
            b2 = o.modifiers.new("door", "BOOLEAN"); b2.object = cut2; b2.operation = "DIFFERENCE"; b2.solver = "EXACT"
    for s_ in (-1, 1):            # each leaf hinged at the opening's edge, open 80 degrees out to the street
        dx, dy = -s_ * math.cos(math.radians(80)), -math.sin(math.radians(80))
        lib.box("street door", (0.98, 0.06, 2.75), (s_ * 1.0 + dx * 0.49, Y0 - 0.3 + dy * 0.49, 1.375), M["walnut_v"], bevel=0.004, rot_z=math.atan2(dy, dx))
    lib.box("street floor", (6.0, 4.0, 0.1), (0, Y0 - 2.3, -0.05), M["pavers"])
    lib.box("street glow", (6.0, 0.05, 4.0), (0, Y0 - 4.0, 2.0), lib.emission("street light", (0.95, 0.93, 0.88), 2.2))


def next_rooms(M, rnd):
    """through the doorways: the next rooms of the suite, the letters room on one side and the family's history on
    the other, with more photographs, a case and their own light"""
    for (s_, x) in ((-1, X0), (1, X1)):
        lib.box("next room floor", (6.0, Y1 - Y0, 0.1), (x + s_ * 3.0, YM, -0.05), M["oak"])
        lib.box("next room wall", (0.3, Y1 - Y0, HM + 0.4), (x + s_ * 6.15, YM, (HM + 0.4) / 2), M["green"])
        lib.box("next room dado", (0.025, Y1 - Y0, 0.95), (x + s_ * 6.0, YM, 0.475), M["walnut_dado"])
        for (y, ss) in ((Y0, -1), (Y1, 1)):
            lib.box("next room side", (6.3, 0.3, HM + 0.4), (x + s_ * 3.0, y + ss * 0.15, (HM + 0.4) / 2), M["green"])
        lib.box("next room ceiling", (6.3, Y1 - Y0 + 0.6, 0.3), (x + s_ * 3.0, YM, HM + 0.15), M["ceiling"])
        for k, dy in enumerate((-3.4, -1.6, 0.6, 2.6)):
            frame_photo("far photo", 3 + k * 2 + (s_ > 0), 0.5 if k % 2 else 0.42, 0.36 if k % 2 else 0.52, (x + s_ * 5.98, YM + dy, 1.75), -s_ * math.pi / 2, M, frame="black" if k % 2 else "oak", light=True)
        lib.box("next room case", (1.4, 0.7, 0.9), (x + s_ * 3.4, YM + 0.2, 0.45), M["walnut"], bevel=0.01)
        lib.box("next room case glass", (1.4, 0.7, 0.35), (x + s_ * 3.4, YM + 0.2, 1.08), M["case_glass"])
        lib.point_light("next room lamp", (x + s_ * 3.0, YM, HM - 0.3), 160, (1.0, 0.80, 0.58), 0.3)


def keepsakes(M, cx, cy, rnd, kind):
    """small things on the velvet of a case: letters tied with a ribbon, a pocket watch, spectacles, a key, a pen, a
    compass, a medal"""
    z = 0.905
    if kind == 0:
        for k in range(6):
            lib.box("letter", (0.22, 0.11, 0.003), (cx - 0.35 + rnd.gauss(0, 0.004), cy + 0.05 + rnd.gauss(0, 0.004), z + 0.0015 + k * 0.0032), M["paper"], rot_z=rnd.gauss(0, 0.03))
        lib.box("ribbon", (0.012, 0.115, 0.022), (cx - 0.35, cy + 0.05, z + 0.011), M["ribbon"]); lib.box("ribbon", (0.225, 0.012, 0.022), (cx - 0.35, cy + 0.05, z + 0.011), M["ribbon"])
        lib.cyl("watch", 0.026, 0.012, (cx + 0.05, cy + 0.1, z), M["gold"], verts=32, bevel=0.004)
        lib.cyl("watch face", 0.021, 0.0125, (cx + 0.05, cy + 0.1, z), M["mat"], verts=32)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.0018, location=(cx + 0.13, cy + 0.12, z + 0.002)); t = bpy.context.active_object; t.name = "watch chain"; t.scale = (1.0, 0.45, 1.0); t.data.materials.append(M["gold"])
        for s_ in (-1, 1):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.022, minor_radius=0.0015, location=(cx + 0.33 + s_ * 0.027, cy - 0.12, z + 0.012), rotation=(math.pi / 2, 0, 0)); t = bpy.context.active_object; t.name = "spectacles"; t.data.materials.append(M["gold"])
        lib.cyl("pen", 0.006, 0.14, (cx + 0.1, cy - 0.12, z + 0.006), M["ebony_frame"], verts=12, rot=(0, math.pi / 2, 0.3))
    else:
        lib.cyl("compass", 0.04, 0.018, (cx - 0.3, cy + 0.08, z), M["silver"], verts=40, bevel=0.003)
        lib.cyl("compass face", 0.034, 0.0185, (cx - 0.3, cy + 0.08, z), M["mat"], verts=40)
        lib.box("key", (0.11, 0.012, 0.006), (cx - 0.05, cy - 0.1, z + 0.003), M["gold"], rot_z=0.4)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.018, minor_radius=0.004, location=(cx - 0.1, cy - 0.125, z + 0.004)); t = bpy.context.active_object; t.name = "key bow"; t.data.materials.append(M["gold"])
        lib.cyl("medal", 0.03, 0.004, (cx + 0.22, cy + 0.0, z), M["gold"], verts=32, bevel=0.001)
        lib.box("medal ribbon", (0.04, 0.09, 0.002), (cx + 0.22, cy + 0.07, z + 0.001), M["ribbon"])
        lib.box("photo card", (0.1, 0.14, 0.002), (cx + 0.0, cy + 0.1, z + 0.001), crown_rooms.image_material("photo 05", photo(5), 0.0, 0.5), rot_z=-0.15)
        lib.box("small box", (0.12, 0.08, 0.05), (cx + 0.32, cy - 0.12, z + 0.025), M["walnut"], bevel=0.004)


def case(name, cx, cy, M, rnd, kind):
    """a glass case on a walnut stand, black velvet inside, a soft light along its top"""
    lib.box(name + " stand", (1.6, 0.8, 0.86), (cx, cy, 0.43), M["walnut"], bevel=0.01)
    lib.box(name + " velvet", (1.5, 0.7, 0.04), (cx, cy, 0.885), M["velvet"])
    lib.box(name + " glass", (1.56, 0.76, 0.3), (cx, cy, 1.01), M["case_glass"])
    for (sx, sy, px, py) in ((1.58, 0.02, 0, -0.38), (1.58, 0.02, 0, 0.38), (0.02, 0.78, -0.78, 0), (0.02, 0.78, 0.78, 0)):
        lib.box(name + " edge", (sx, sy, 0.02), (cx + px, cy + py, 1.16), M["brass"])
    lib.box(name + " glow", (1.4, 0.02, 0.01), (cx, cy - 0.36, 1.155), lib.emission("case glow", (1.0, 0.86, 0.66), 6.0))
    keepsakes(M, cx, cy, rnd, kind)


def gallery(M, rnd):
    materials(M); walls(M); next_rooms(M, rnd)
    # the long wall: photographs hung close in a salon hang, 14 of them, picture lights over the top row
    hang = [(-6.2, 2.25, 0.7, 0.5, "gilt"), (-6.3, 1.45, 0.5, 0.36, "black"), (-5.2, 1.65, 0.42, 0.55, "oak"), (-4.15, 2.3, 0.9, 0.62, "gilt"),
            (-4.0, 1.42, 0.5, 0.36, "black"), (-2.85, 1.8, 0.48, 0.62, "gilt"), (-1.6, 2.15, 1.05, 0.72, "gilt"), (-1.75, 1.3, 0.42, 0.3, "black"),
            (-0.55, 1.3, 0.42, 0.3, "oak"), (0.6, 1.95, 0.5, 0.65, "black"), (1.75, 2.3, 0.72, 0.5, "gilt"), (1.8, 1.48, 0.6, 0.42, "oak"),
            (3.05, 1.85, 0.5, 0.65, "gilt"), (4.3, 2.25, 0.84, 0.58, "black"), (4.2, 1.42, 0.5, 0.36, "gilt"), (5.6, 1.7, 0.45, 0.6, "oak"), (6.5, 2.35, 0.6, 0.42, "black")]
    for k, (x, z, w, h, fr) in enumerate(hang):
        frame_photo("photo", k, w, h, (x, Y1 - 0.005, z), 0.0, M, frame=fr, mat=0.05 if fr != "gilt" else 0.07, light=z > 2.0)
    for k, x in enumerate((-6.0, -4.2, -2.5, 2.5, 4.2, 6.0)):      # either side of the door on the inner wall
        frame_photo("photo", 7 + k, 0.6 if k % 2 else 0.45, 0.42 if k % 2 else 0.6, (x, Y0 + 0.005, 1.75), math.pi, M, frame="oak" if k % 2 else "gilt", light=True)
    # two cases of keepsakes in the middle of the room
    case("case", -2.2, YM + 0.4, M, rnd, 0); case("case", 2.2, YM + 0.4, M, rnd, 1)
    # the reading table with the albums, a lamp and two chairs; armchairs facing the photographs
    tx, ty = -4.6, Y0 + 2.6
    lib.box("reading table", (2.0, 0.95, 0.05), (tx, ty, 0.745), M["walnut"], bevel=0.008)
    for (dx, dy) in ((-0.9, -0.38), (0.9, -0.38), (-0.9, 0.38), (0.9, 0.38)): lib.box("table leg", (0.06, 0.06, 0.72), (tx + dx, ty + dy, 0.36), M["walnut"])
    for k, (dx, mat, th) in enumerate(((-0.6, "leather_book", 0.05), (-0.58, "leather_book2", 0.045))):
        lib.box("album", (0.36, 0.28, th), (tx + dx, ty - 0.1, 0.77 + th / 2 + k * 0.05), M[mat], bevel=0.006, rot_z=0.08 * k)
    for s_ in (-1, 1):            # an album open on the table, a photograph on each page
        lib.box("open album page", (0.34, 0.28, 0.012), (tx + 0.25 + s_ * 0.175, ty + 0.05, 0.776), M["leather_book"], bevel=0.003)
        lib.box("open album leaf", (0.32, 0.26, 0.004), (tx + 0.25 + s_ * 0.175, ty + 0.05, 0.784), M["paper"])
        lib.box("album photo", (0.2, 0.14, 0.002), (tx + 0.25 + s_ * 0.175, ty + 0.06, 0.787), crown_rooms.image_material("photo %02d" % (3 + s_ % 3), photo(3 + s_ % 3), 0.0, 0.5))
    furn.table_lamp("reading lamp", (tx + 0.75, ty + 0.2, 0.77), M, watts=30, shade_r=0.17)
    Mc = dict(M); Mc["linen"] = M["chair_leather"]
    for dx in (-0.45, 0.45): furn.dining_chair("reading chair", (tx + dx, ty - 0.75, 0.0), math.pi, Mc)
    S = crown_rooms.imports(M)
    for (x, rz) in ((3.6, math.pi + 0.5), (5.4, math.pi - 0.5)):
        lib.instance_of(S["chair"], (x, Y0 + 2.4, 0.0), rz, name="armchair")
    furn.side_table("side table", (4.5, Y0 + 1.9, 0.0), M, r=0.22, h=0.5)
    lib.box("rug", (6.0, 3.6, 0.014), (0.0, YM + 0.3, 0.007), M["rug"], bevel=0.006, segs=2)
    # the memoir desk by the far doorway: a microphone on its arm, headphones, a screen
    dx_, dy_ = X1 - 1.4, Y1 - 1.7
    lib.box("desk", (1.6, 0.7, 0.04), (dx_, dy_, 0.74), M["walnut"], bevel=0.006)
    for (ax, ay) in ((-0.75, -0.3), (0.75, -0.3), (-0.75, 0.3), (0.75, 0.3)): lib.box("desk leg", (0.04, 0.04, 0.72), (dx_ + ax, dy_ + ay, 0.36), M["brass"])
    lib.cyl("mic arm", 0.008, 0.42, (dx_ - 0.5, dy_ + 0.2, 0.76), M["ebony_frame"], verts=8, rot=(0.6, 0, 0))
    lib.cyl("microphone", 0.026, 0.16, (dx_ - 0.5, dy_ - 0.05, 1.07), M["ebony_frame"], verts=20, rot=(-1.2, 0, 0), bevel=0.01)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.012, location=(dx_ + 0.2, dy_ - 0.05, 0.77)); t = bpy.context.active_object; t.name = "headphones"; t.scale = (1.0, 0.8, 0.4); t.data.materials.append(M["ebony_frame"])
    crown_rooms.screen("memoir screen", photo(0), 0.48, 0.3, (dx_ + 0.35, dy_ + 0.18, 0.76), math.pi, M, emit=1.2)
    furn.dining_chair("desk chair", (dx_, dy_ - 0.65, 0.0), math.pi, Mc)
    lib.instance_of(S["plant"], (X0 + 0.6, Y1 - 0.6, 0.0), 0.3, 1.6)
    # light: track spots on the photographs and the cases, warm and low
    for x in (-5.5, -3.0, -0.5, 2.0, 4.5):
        sp = lib.spot_light("track spot", (x, Y1 - 1.6, HM - 0.05), 70, (1.0, 0.82, 0.6), 0.02, 40, 0.5); sp.rotation_euler = (math.radians(38), 0, 0)
    for x in (-2.2, 2.2):
        sp = lib.spot_light("case spot", (x, YM - 0.8, HM - 0.05), 45, (1.0, 0.85, 0.65), 0.02, 30, 0.6); sp.rotation_euler = (math.radians(14), 0, 0)


ROOMS = {
    "memory": dict(build=gallery, cams={
        "memory": dict(loc=(-6.4, Y0 + 1.0, 1.55), target=(2.8, Y1 - 0.4, 1.5), lens=20, shift=0.06),
        "memory2": dict(loc=(X1 - 0.5, YM - 1.6, 1.55), target=(X0 - 3.0, YM + 1.2, 1.45), lens=20, shift=0.05),
    }, stops={"memory": (0.4, YM - 1.6, 0.0)}),
}


def build(room):
    sc = lib.reset(); M = family.materials(); rnd = random.Random(71)
    crown_rooms.extra_materials(M)
    R = ROOMS[room]; R["build"](M, rnd)
    w = sc.world or bpy.data.worlds.new("world"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background"); bg.inputs["Color"].default_value = (0, 0, 0, 1); bg.inputs["Strength"].default_value = 0.0
    return sc, R


if __name__ == "__main__":
    args = sys.argv[1:]; room = args[0]; jobs = args[1].split(","); out = args[2]
    w, h, spp, ex = (int(args[3]), int(args[4]), int(args[5]), float(args[6])) if len(args) > 6 else (640, 360, 24, 0.0)
    pw, pspp = (int(args[7]), int(args[8])) if len(args) > 8 else (w * 2, spp)
    paths = {j: os.path.abspath(out.replace("%s", j.replace(":", "_"))) for j in jobs}
    os.makedirs(os.path.dirname(list(paths.values())[0]), exist_ok=True)
    todo = [j for j in jobs if not os.path.exists(paths[j])]
    if not todo: print("nothing to do", flush=True); sys.exit(0)
    t = time.time(); sc, R = build(room); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in todo:
        tmp = paths[j].replace(".jpg", ".part.jpg")
        if j.startswith("plan:"):
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=ex)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"], shift_y=c.get("shift", 0.0)); lib.photo_finish(0.3, 0.15)
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
