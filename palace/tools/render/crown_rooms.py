"""The Crown's rooms, furnished, for stills and 360s.
  bvenv/bin/python blend/crown_rooms.py <room> <cam[,cam...]|pano:stop> <out.jpg> [w h spp exposure]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, crown
from crown import P, R_IN, R_OUT, R_GL, ceil_at, D

A = lib.ASSETS
RM = (R_GL + R_OUT) / 2          # the middle of a room, across the ring


def tint_fabric(root, rgb, sat=0.0):
    """re-colour an imported model's fabric: its texture made grey, then multiplied by rgb (on a copy of the material)"""
    for ob in root.children_recursive:
        if ob.type != "MESH": continue
        for i, m in enumerate(ob.data.materials):
            if not m or "fabric" not in m.name.lower(): continue
            m2 = m.copy(); ob.data.materials[i] = m2; nt = m2.node_tree; b = [n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"][0]
            src = b.inputs["Base Color"].links[0].from_socket if b.inputs["Base Color"].links else None
            hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = sat
            mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; mx.inputs[7].default_value = (*rgb, 1)
            if src: nt.links.new(src, hs.inputs["Color"]); nt.links.new(hs.outputs["Color"], mx.inputs[6])
            else: mx.inputs[6].default_value = (0.8, 0.8, 0.8, 1)
            nt.links.new(mx.outputs[2], b.inputs["Base Color"])
            if "Sheen Tint" in b.inputs and not b.inputs["Sheen Tint"].links: b.inputs["Sheen Tint"].default_value = (*rgb, 1)


def basalt(name="polished basalt"):
    """polished basalt: near-black, fine grey grains, a mirror-like surface with a little haze"""
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.12; b.inputs["Coat Weight"].default_value = 0.6; b.inputs["Coat Roughness"].default_value = 0.04
    tc = nt.nodes.new("ShaderNodeTexCoord")
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 260; L.new(tc.outputs["Object"], v.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 0.7; n.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], n.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.0; cr.color_ramp.elements[0].color = (0.018, 0.018, 0.019, 1); cr.color_ramp.elements[1].position = 1.0; cr.color_ramp.elements[1].color = (0.06, 0.058, 0.056, 1)
    L.new(lib._math(nt, "MULTIPLY_ADD", v.outputs["Distance"], 0.6, lib._math(nt, "MULTIPLY", n.outputs["Fac"], 0.5)), cr.inputs["Fac"])
    L.new(cr.outputs["Color"], b.inputs["Base Color"])
    # slabs 1.2 x 0.6 m with fine joints, laid along the ring
    br = nt.nodes.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.003; br.inputs["Brick Width"].default_value = 1.2; br.inputs["Row Height"].default_value = 0.6; br.offset = 0.5
    br.inputs["Color1"].default_value = (1, 1, 1, 1); br.inputs["Color2"].default_value = (0.92, 0.92, 0.92, 1); br.inputs["Mortar"].default_value = (0.4, 0.4, 0.4, 1); L.new(tc.outputs["Object"], br.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; L.new(cr.outputs["Color"], mx.inputs[6]); L.new(br.outputs["Color"], mx.inputs[7]); L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def glide_material():
    """the Glide's belt: dark grey rubber with fine grooves along the ring"""
    m, nt = lib._mat("glide belt")
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.055, 0.052, 0.05, 1); b.inputs["Roughness"].default_value = 0.42
    tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "RINGS"; w.rings_direction = "Z"; w.inputs["Scale"].default_value = 31.4; w.wave_profile = "SIN"
    L.new(tc.outputs["Object"], w.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.5; bm.inputs["Distance"].default_value = 0.002; L.new(w.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def materials():
    P_ = lib.principled
    M = {
        "regolith": lib.plaster("regolith plaster", (0.85, 0.80, 0.72), 0.9, 0.08),
        "ceiling": lib.plaster("crown ceiling", (0.80, 0.76, 0.70), 0.92, 0.03),
        "basalt": basalt(),
        "stone_linen": lib.travertine("linen stone", (0.80, 0.75, 0.67), (0.72, 0.66, 0.57), 0.4, 1.0),
        "olive": lib.wood("olive wood", (0.52, 0.42, 0.28), (0.30, 0.22, 0.13), 0.35, scale=1.4),
        "olive_v": lib.wood("olive veneer", (0.52, 0.42, 0.28), (0.30, 0.22, 0.13), 0.38, scale=1.4, along="Z"),
        "walnut": lib.wood("walnut", (0.20, 0.11, 0.06), (0.085, 0.045, 0.025), 0.36),
        "walnut_v": lib.wood("walnut veneer", (0.20, 0.11, 0.06), (0.085, 0.045, 0.025), 0.4, along="Z"),
        "linen": lib.fabric("linen", (0.66, 0.61, 0.53), 0.9, 0.35, 500),
        "bronze": P_("bronze", (0.40, 0.29, 0.19), 0.35, 1.0),
        "bronze_dark": P_("dark bronze", (0.17, 0.13, 0.10), 0.4, 1.0),
        "brass": P_("brass", (0.86, 0.66, 0.36), 0.22, 1.0),
        "titanium": P_("titanium", (0.55, 0.55, 0.56), 0.3, 1.0),
        "glide": glide_material(),
        "glass": lib.glass("mars glass", (0.93, 0.95, 0.93)),
        "lacquer": P_("black lacquer", (0.006, 0.006, 0.007), 0.08, **{"Coat Weight": 1.0, "Coat Roughness": 0.015}),
        "ivory": P_("key ivory", (0.80, 0.77, 0.70), 0.22, **{"Coat Weight": 0.5, "Coat Roughness": 0.05}),
        "ebony": P_("key ebony", (0.012, 0.012, 0.012), 0.3),
        "spruce": lib.wood("spruce", (0.62, 0.48, 0.30), (0.50, 0.36, 0.20), 0.45),
        "plate": P_("piano plate", (0.80, 0.60, 0.28), 0.35, 1.0),
        "leather": P_("black leather", (0.02, 0.018, 0.016), 0.45, **{"Coat Weight": 0.2}),
        "marble": lib.marble("marble"),
        "glaze": furn.ceramic("glaze", (0.70, 0.68, 0.62), 0.25),
        "shade": lib.lampshade("linen shade"),
        "shadow": P_("shadow gap", (0.02, 0.02, 0.02), 0.8),
        "frame": P_("frame", (0.03, 0.025, 0.02), 0.5),
        "rug": furn.rug_material("wool rug", (0.55, 0.50, 0.43), (0.30, 0.24, 0.18)),
        "rug2": furn.rug_material("wool rug dark", (0.24, 0.20, 0.17), (0.50, 0.44, 0.36)),
        "book": furn.book_material(),
        "bark": lib.wood("olive bark", (0.16, 0.13, 0.10), (0.08, 0.065, 0.05), 0.85, scale=3.0, coat=0.0, along="Z"),
        "olive_leaf": lib.leaf("olive leaf", (0.13, 0.16, 0.085), 0.3, 0.5),
        "soil": P_("soil", (0.035, 0.025, 0.018), 0.95),
        "rust": lib.fabric("cushion rust", (0.36, 0.11, 0.04), 0.8, 0.6),
        "basalt_wall": lib.principled("basalt wall", (0.035, 0.034, 0.033), 0.55),
        "basalt_table": basalt("basalt table"),
        "oak_panel": lib.wood("pale oak", (0.74, 0.62, 0.47), (0.62, 0.50, 0.36), 0.5, along="Z", coat=0.1),
        "porcelain": lib.principled("porcelain", (0.85, 0.84, 0.81), 0.15, **{"Coat Weight": 0.6}),
        "crystal": lib.glass("crystal", (0.98, 0.98, 0.98), 0.0, 1.5),
        "bed_fabric": lib.fabric("bed linen", (0.42, 0.38, 0.32), 0.9, 0.5),
        "sheet": lib.fabric("sheet", (0.76, 0.74, 0.70), 0.85, 0.3, 800, 0.1),
        "pillow": lib.fabric("pillow", (0.46, 0.40, 0.31), 0.9, 0.4),
        "duvet": lib.fabric("duvet", (0.78, 0.76, 0.72), 0.9, 0.4, 600, 0.15),
        "oak_slat": lib.wood("oak slats", (0.42, 0.29, 0.17), (0.30, 0.20, 0.11), 0.55, along="Y", coat=0.0),
        "felt": P_("felt", (0.025, 0.022, 0.02), 1.0),
        "oak": lib.oak_floor("oak floor", 0.19, (0.66, 0.54, 0.43), 0.55, 0.85),
    }
    M["ceramics"] = [furn.ceramic("ceramic white", (0.78, 0.76, 0.72), 0.3), furn.ceramic("ceramic black", (0.02, 0.02, 0.02), 0.35), furn.ceramic("ceramic clay", (0.45, 0.22, 0.12), 0.6),
                     furn.ceramic("ceramic celadon", (0.42, 0.52, 0.45), 0.2), furn.ceramic("ceramic sand", (0.62, 0.52, 0.38), 0.7)]
    return M


def at(r, b, z=0.0): v = P(r, b, z); return (v.x, v.y, v.z)


def rot_tan(b, face_out=False):
    """a rotation about z so that an object's +y points along the radius (outwards if face_out, else inwards)"""
    return -b * D + (0.0 if face_out else math.pi)


def mist_hearth(r, b, M, length=4.0):
    """a hearth of cold mist lit from below: a long basalt trough, the mist glowing amber over it (no open flames)"""
    o = []; g = furn.empty("hearth", at(r, b), -b * D + math.pi / 2)
    body = lib.box("hearth body", (length + 0.6, 0.9, 0.42), (0, 0, 0.21), M["basalt"], bevel=0.01); body.parent = g
    trough = lib.box("hearth trough", (length, 0.34, 0.06), (0, 0, 0.425), lib.principled("trough", (0.01, 0.01, 0.01), 0.6)); trough.parent = g
    import family
    mist = lib.box("mist", (length - 0.1, 0.28, 0.5), (0, 0, 0.7), family.flame_material()); mist.parent = g; mist.visible_shadow = False
    glow = lib.area_light("mist light", (0, 0, 0.55), length, 260, (1.0, 0.55, 0.25), size_y=0.3); glow.parent = g
    glow.rotation_euler = (0, 0, 0)
    return g


def salon(M, rnd):
    """the Salon (bearings 144 to 180): the hearth room, the great salon 45 m long, the piano room"""
    b0, b1 = 144.0, 180.0
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - 0.5, b1 + 0.5, M)
    # low walls of olive wood with wide openings between the three rooms
    for b in (151.92, 172.08):
        th = 0.3 / 130 / D
        crown.curved_box("screen wall", R_GL + 0.05, R_GL + 1.6, b - th / 2, b + th / 2, 0, 3.0, M["olive_v"])
        crown.curved_box("screen wall", R_OUT - 1.6, R_OUT, b - th / 2, b + th / 2, 0, 3.0, M["olive_v"])
    sofa = lib.import_glb(os.path.join(A, "GlamVelvetSofa.glb"), (0, 0, -100), 0, name="sofa src"); tint_fabric(sofa, (0.70, 0.64, 0.55))
    chair = lib.import_glb(os.path.join(A, "SheenChair.glb"), (0, 0, -100), 0, name="chair src"); tint_fabric(chair, (0.36, 0.28, 0.20))
    plant = lib.import_glb(os.path.join(A, "DiffuseTransmissionPlant.glb"), (0, 0, -100), 0, name="plant src")
    vase = lib.import_glb(os.path.join(A, "GlassVaseFlowers.glb"), (0, 0, -100), 0, name="vase src")
    for k, bc in enumerate((155.6, 162.0, 168.4)):
        # a rug, two long sofas facing across it (backs to the Glide and to the outer wall), a low olive table, chairs
        th = -bc * D
        rg = lib.box("rug", (4.0, 5.2, 0.014), at(RM, bc, 0.007), M["rug" if k != 1 else "rug2"], bevel=0.006, rot_z=th, segs=2)
        for side in (-1, 1):
            r = RM + side * 1.75
            lib.instance_of(sofa, at(r, bc, 0.014), th + (0 if side > 0 else math.pi), name="salon sofa")
        lib.box("low table", (1.05, 2.1, 0.07), at(RM, bc, 0.315), M["olive"], bevel=0.012, rot_z=th)
        lib.box("low table base", (0.75, 1.8, 0.28), at(RM, bc, 0.14), M["olive_v"], bevel=0.006, rot_z=th)
        for side in (-1, 1):
            r = RM + side * 1.75; fab = M["linen"] if side > 0 else M["rust"]
            for dt in (-0.55, 0.55):
                furn.cushion("cushion", (0.44, 0.13, 0.44), at(r + side * 0.16, bc + dt / 130 / D, 0.62), (math.radians(-14), 0, th + (0 if side > 0 else math.pi) + (0.1 if dt > 0 else -0.08)), fab)
        for side in (-1, 1):
            db = side * 2.6 / 130 / D
            lib.instance_of(chair, at(RM + 0.2, bc + db, 0.014), th - side * math.pi / 2, name="salon chair")
        lib.instance_of(vase, at(RM - 0.15, bc + 0.2 / 130 / D, 0.35), rnd.uniform(0, 6), 1.6)
        for i, (t_, w_, d_) in enumerate(((0.035, 0.30, 0.24), (0.03, 0.28, 0.22))):
            lib.box("table book", (w_, d_, t_), at(RM + 0.2, bc - 0.45 / 130 / D, 0.35 + 0.035 * i + t_ / 2), M["book"], bevel=0.002, rot_z=th + 0.2 * i)
        fl = furn.floor_lamp("floor lamp", at(RM + 1.9, bc + 2.4 / 130 / D, 0.0), M, watts=110)
        # tall plants and olive trees along the outer wall between the groups
        lib.instance_of(plant, at(R_OUT - 0.7, bc + 3.6 / 130 / D, 0.0), rnd.uniform(0, 6), 2.0)
    for bc in (152.8, 159.0, 165.2, 171.2):
        p = at(R_OUT - 1.1, bc, 0.0)
        lib.box("tree planter", (1.0, 1.0, 0.6), (p[0], p[1], 0.3), M["basalt"], bevel=0.01, rot_z=-bc * D)
        furn.olive_tree("salon olive", (p[0], p[1], 0.6), rnd.randint(0, 9999), M, height=rnd.uniform(3.2, 4.0), leaves=16000)
    # paintings on the inner wall's lower part, between the slots' light and the Glide rail
    p1 = furn.painting_material("painting ochre", (0.50, 0.33, 0.10), [(0.1, 0.9, 0.5, 0.9, (0.70, 0.55, 0.25)), (0.1, 0.9, 0.1, 0.42, (0.30, 0.12, 0.04))])
    p2 = furn.painting_material("painting slate", (0.12, 0.14, 0.17), [(0.08, 0.92, 0.58, 0.92, (0.55, 0.50, 0.40)), (0.08, 0.92, 0.08, 0.52, (0.05, 0.06, 0.09))])
    for bc, mat in ((158.8, p1), (165.2, p2)):
        furn.painting("painting", 2.4, 1.6, at(R_OUT - 0.05, bc, 1.75), -bc * D + math.pi, mat, M["frame"])
    # the hearth of cold mist at the near end, the concert grand at the far end
    mist_hearth(RM + 0.4, 147.0, M, 4.2)
    hsofa = lib.instance_of(sofa, at(RM - 0.2, 149.6, 0.014), -149.6 * D + math.pi / 2, name="hearth sofa")
    lib.box("hearth rug", (3.6, 4.4, 0.014), at(RM, 148.5, 0.007), M["rug2"], bevel=0.006, rot_z=-148.5 * D + math.pi / 2, segs=2)
    furn.piano(at(RM - 1.2, 176.4, 0.0), -176.4 * D - math.pi / 2 + 0.35, M)
    furn.floor_lamp("piano lamp", at(RM + 1.6, 175.0, 0.0), M, watts=90)
    # warm lamps hidden in the slots' reveals at night are not needed by day; a few downlights over each group
    for bc in (155.6, 162.0, 168.4, 147.5, 176.0):
        for r in (RM - 1.5, RM + 1.5):
            lib.spot_light("downlight", at(r, bc, ceil_at(bc) - 0.06), 260, (1.0, 0.82, 0.62), 0.03, 50, 0.5)
    # wall washers, as in a gallery: spots near the ceiling every 3 m along both walls, aimed down the walls
    b = b0 + 0.6
    while b < b1 - 0.6:
        for (r, d) in ((R_IN + 0.9, -1), (R_OUT - 0.9, 1)):
            q = Vector(at(r, b, ceil_at(b) - 0.08)); tgt = Vector(at(r + d * 0.9, b, 1.2))
            sp = lib.spot_light("wall washer", tuple(q), 140, (1.0, 0.83, 0.64), 0.04, 70, 0.8); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
        b += 3.0 / 130 / D


def face_out(b): return math.pi - b * D          # a model whose front is -y faces the outer wall
def face_in(b): return -b * D                    # ... faces the Glide and the inner wall
def face_cw(b): return math.pi / 2 - b * D       # ... faces along the ring, clockwise (increasing bearing)
def face_ccw(b): return -math.pi / 2 - b * D     # ... faces along the ring, anticlockwise
def tang(m, r=RM): return m / r / D              # a distance along the ring at radius r, in degrees


def imports(M):
    """the scanned models, each loaded once, out of sight, to be copied where they are needed"""
    S = {}
    S["sofa"] = lib.import_glb(os.path.join(A, "GlamVelvetSofa.glb"), (0, 0, -100), 0, name="sofa src"); tint_fabric(S["sofa"], (0.70, 0.64, 0.55))
    S["chair"] = lib.import_glb(os.path.join(A, "SheenChair.glb"), (0, 0, -100), 0, name="chair src"); tint_fabric(S["chair"], (0.36, 0.28, 0.20))
    S["plant"] = lib.import_glb(os.path.join(A, "DiffuseTransmissionPlant.glb"), (0, 0, -100), 0, name="plant src")
    S["vase"] = lib.import_glb(os.path.join(A, "GlassVaseFlowers.glb"), (0, 0, -100), 0, name="vase src")
    S["pouf"] = lib.import_glb(os.path.join(A, "SpecularSilkPouf.glb"), (0, 0, -100), 0, name="pouf src")
    return S


def portal(r, b, M, face=None):
    """a portal: a bronze frame 3 m wide and 4.4 m tall round a dark, faintly glowing membrane"""
    g = furn.empty("portal", at(r, b), face if face is not None else face_cw(b))
    fr = lib.box("portal frame", (3.0, 0.5, 4.4), (0, 0, 2.2), M["bronze_dark"], bevel=0.02); fr.parent = g
    mem = lib.box("portal membrane", (2.4, 0.08, 3.7), (0, -0.06, 1.95), lib.principled("portal membrane", (0.01, 0.012, 0.016), 0.04, **{"Coat Weight": 1.0, "Emission Color": (0.35, 0.55, 1.0, 1), "Emission Strength": 0.25})); mem.parent = g
    rim = lib.box("portal rim", (2.5, 0.06, 0.04), (0, -0.27, 3.85), lib.emission("portal rim", (0.75, 0.85, 1.0), 12)); rim.parent = g
    return g


def iris_door(b, M):
    """the Door: a partition with a round opening 5 m across, ringed by the iris of light, open"""
    th = 0.5 / 130 / D
    wallo = crown.curved_box("door wall", R_GL + 0.05, R_OUT, b - th / 2, b + th / 2, 0, 9, M["basalt_wall"], zf1=lambda bb: ceil_at(bb) + 0.01)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=2.5, depth=3.0, location=at(RM, b, 2.95), rotation=(math.pi / 2, 0, face_cw(b)))
    cut = bpy.context.active_object; cut.hide_render = True; cut.hide_viewport = True
    bo = wallo.modifiers.new("door", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    bpy.ops.mesh.primitive_torus_add(major_radius=2.52, minor_radius=0.05, major_segments=128, minor_segments=16, location=at(RM, b, 2.95), rotation=(math.pi / 2, 0, face_cw(b)))
    ring = bpy.context.active_object; ring.name = "iris of light"; ring.data.materials.append(lib.emission("iris light", (0.82, 0.9, 1.0), 30))
    return wallo


def arrival(M, rnd):
    """the Arrival hall (95.8 to 108): 9 m tall, a basalt floor, a long olive bench, the slot back to the Orb, the portal"""
    b0, b1 = 95.76, 108.0
    crown.ring_room(b0 - 4.32, b1, M, M["basalt"], part_walls=False)
    th = 0.3 / 130 / D
    crown.curved_box("end wall", R_GL + 0.05, R_OUT, b1 - th / 2, b1 + th / 2, 0, 9, M["regolith"], zf1=lambda bb: ceil_at(bb) + 0.01)
    crown.curved_box("hangar end", R_IN - 0.6, R_OUT + 0.6, b0 - 4.32 - th, b0 - 4.32, 0, 9, M["regolith"], zf1=lambda bb: ceil_at(bb) + 0.01)
    iris_door(b0, M)
    S = imports(M)
    # the long olive-wood bench along the outer wall, and a big olive tree
    for i in range(3):
        bb = b0 + 1.6 + i * tang(2.3)
        lib.box("bench", (2.2, 0.55, 0.08), at(R_OUT - 0.75, bb, 0.44), M["olive"], bevel=0.01, rot_z=face_in(bb))
        lib.box("bench leg", (2.0, 0.42, 0.40), at(R_OUT - 0.75, bb, 0.20), M["basalt"], bevel=0.006, rot_z=face_in(bb))
    p = at(RM - 0.6, b0 + 6.4, 0.0)
    lib.cyl("tree planter", 0.9, 0.55, p, M["basalt"], verts=64, bevel=0.01)
    furn.olive_tree("arrival olive", (p[0], p[1], 0.55), 4711, M, height=4.6, leaves=24000)
    lib.instance_of(S["plant"], at(R_OUT - 0.7, b1 - 1.0, 0.0), 0.5, 2.1)
    portal(RM, b1 - 0.6, M, face_ccw(b1 - 0.6))
    for bc in (b0 + 2.5, b0 + 6.0, b0 + 9.5):
        for r in (RM - 1.6, RM + 1.6):
            lib.spot_light("downlight", at(r, bc, ceil_at(bc) - 0.06), 300, (1.0, 0.82, 0.62), 0.03, 45, 0.5)
    b = b0 - 4.0
    while b < b1 - 0.5:
        for (r, d) in ((R_IN + 0.9, -1), (R_OUT - 0.9, 1)):
            q = Vector(at(r, b, ceil_at(b) - 0.08)); tgt = Vector(at(r + d * 0.9, b, 1.2))
            sp = lib.spot_light("wall washer", tuple(q), 160, (1.0, 0.83, 0.64), 0.04, 70, 0.8); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
        b += tang(3.0)


def dining(M, rnd):
    """the dining hall (223.2 to 241.2) under the Dining spire: a table of polished basalt for twenty"""
    b0, b1 = 223.2, 241.2
    crown.ring_room(b0, b1, M, M["basalt"])
    crown.slat_ceiling(b0 - 0.5, b1 + 0.5, M)
    S = imports(M)
    bc = (b0 + b1) / 2; L_ = 10.5
    # the table: three slabs of basalt on two olive-wood trestles, curving with the ring
    crown.curved_box("table top", RM - 0.6, RM + 0.6, bc - tang(L_ / 2), bc + tang(L_ / 2), 0.70, 0.76, M["basalt_table"])
    for k in (-1, 1):
        bb = bc + k * tang(L_ / 2 - 1.2)
        lib.box("trestle", (0.9, 0.14, 0.70), at(RM, bb, 0.35), M["olive"], bevel=0.01, rot_z=face_in(bb))
    for i in range(10):
        bb = bc - tang(L_ / 2 - 0.55) + i * tang((L_ - 1.1) / 9)
        furn.dining_chair("chair", at(RM - 0.95, bb, 0.0), face_out(bb), M)
        furn.dining_chair("chair", at(RM + 0.95, bb, 0.0), face_in(bb), M)
    for k in (-1, 1):
        bb = bc + k * tang(L_ / 2 + 0.75); furn.dining_chair("chair", at(RM, bb, 0.0), face_ccw(bb) if k > 0 else face_cw(bb), M)
    # the table laid: glass globes over it, candles in glass, a runner of linen, the dish of olives, flowers
    globe = lib.glass("globe glass", (0.97, 0.95, 0.9), 0.15)
    for i in range(7):
        bb = bc - tang(L_ / 2 - 0.9) + i * tang((L_ - 1.8) / 6); z = 2.05 + 0.08 * (i % 2)
        furn.lathe("globe", [(0.0, -0.2), (0.11, -0.17), (0.19, -0.06), (0.2, 0.0), (0.19, 0.08), (0.14, 0.15), (0.04, 0.195), (0.0, 0.2)], globe, 48, at(RM, bb, z))
        lib.cyl("globe bulb", 0.025, 0.05, at(RM, bb, z - 0.025), lib.emission("bulb", (1.0, 0.72, 0.45), 70), verts=16)
        lib.cyl("globe cable", 0.002, ceil_at(bb) - z - 0.2, at(RM, bb, z + 0.2), M["shadow"], verts=8)
        lib.point_light("globe light", at(RM, bb, z), 45, (1.0, 0.75, 0.5), 0.07)
    crown.curved_box("runner", RM - 0.22, RM + 0.22, bc - tang(L_ / 2 - 0.3), bc + tang(L_ / 2 - 0.3), 0.76, 0.763, M["linen"])
    lib.import_glb(os.path.join(A, "IridescentDishWithOlives.glb"), at(RM, bc - tang(1.2), 0.763), 0.0, 0.9, name="olives")
    for k in range(3):
        lib.instance_of(S["vase"], at(RM + 0.05, bc + tang(-3.0 + 3.0 * k), 0.763), rnd.uniform(0, 6), 1.7)
    for i in range(10):
        bb = bc - tang(L_ / 2 - 0.55) + i * tang((L_ - 1.1) / 9)
        for side in (-1, 1):
            plate = lib.cyl("plate", 0.14, 0.012, at(RM + side * 0.38, bb, 0.763), M["porcelain"], verts=48, bevel=0.003)
            gl = furn.lathe("wine glass", [(0.0, 0.0), (0.035, 0.0), (0.004, 0.006), (0.004, 0.09), (0.03, 0.11), (0.042, 0.16), (0.035, 0.21), (0.0, 0.21)], M["crystal"], 32, at(RM + side * 0.3, bb + tang(0.16), 0.763))
    # sideboards under the outer slots, paintings above them, plants
    for bb in (b0 + 2.2, b1 - 2.2):
        lib.box("sideboard", (3.0, 0.5, 0.8), at(R_OUT - 0.3, bb, 0.4), M["walnut"], bevel=0.008, rot_z=face_in(bb))
        lib.box("sideboard top", (3.04, 0.52, 0.03), at(R_OUT - 0.3, bb, 0.815), M["marble"], bevel=0.004, rot_z=face_in(bb))
        furn.ornament("vase", *at(R_OUT - 0.32, bb - tang(0.8), 0.83)[:2], 0.83, 0.5, random.Random(int(bb)), M["ceramics"])
        lib.instance_of(S["plant"], at(R_OUT - 0.75, bb + tang(2.3), 0.0), rnd.uniform(0, 6), 2.0)
    p1 = furn.painting_material("painting dusk", (0.20, 0.10, 0.06), [(0.07, 0.93, 0.56, 0.93, (0.58, 0.36, 0.16)), (0.07, 0.93, 0.07, 0.5, (0.22, 0.05, 0.03))])
    furn.painting("painting", 2.6, 1.7, at(R_IN + 0.05, bc, 1.6), face_out(bc) + math.pi, p1, M["frame"])
    b = b0 + 0.6
    while b < b1 - 0.5:
        for (r, d) in ((R_IN + 0.9, -1), (R_OUT - 0.9, 1)):
            q = Vector(at(r, b, ceil_at(b) - 0.08)); tgt = Vector(at(r + d * 0.9, b, 1.2))
            sp = lib.spot_light("wall washer", tuple(q), 120, (1.0, 0.83, 0.64), 0.04, 70, 0.8); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
        b += tang(3.0)


def bedroom_up(M, rnd):
    """the master suite up's bedroom (116.6 to 130.3): the bed faces the south-east slot, so the sun rises straight
    across the room; pale oak walls, a floor of linen-coloured stone"""
    import bed
    b0, b1 = 116.64, 130.32
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["oak_panel"])
    crown.slat_ceiling(b0 - 0.5, b1 + 0.5, M)
    S = imports(M)
    bc = (b0 + b1) / 2 + 0.6
    # an oak screen between the Glide and the bedroom, 2.6 m tall, open at the end by the dressing room
    crown.curved_box("bed screen", R_GL + 0.05, R_GL + 0.2, b0 + tang(1.6, R_GL), b1, 0, 2.6, M["oak_panel"])
    bed.bed("bed", at(R_GL + 1.5, bc, 0.0), face_out(bc), M)
    for k in (-1, 1):
        bb = bc + k * tang(1.55, R_GL + 0.4)
        lib.box("nightstand", (0.55, 0.5, 0.5), at(R_GL + 0.47, bb, 0.25), M["walnut"], bevel=0.008, rot_z=face_out(bb))
        furn.table_lamp("bedside lamp", at(R_GL + 0.47, bb, 0.5), M, watts=40, shade_r=0.17)
    lib.box("bed rug", (5.6, 4.2, 0.014), at(RM + 0.4, bc, 0.007), M["rug"], bevel=0.006, rot_z=face_in(bc), segs=2)
    lib.box("bed bench", (1.6, 0.45, 0.45), at(R_GL + 3.1, bc, 0.225), M["bed_fabric"], bevel=0.03, rot_z=face_in(bc), segs=4)
    # the room is 31 m long: oak screens 6 m either side of the bed make a bedroom of it, with a sitting corner by
    # the slots at one end and a writing desk at the other
    for k in (-1, 1):
        bb = bc + k * tang(6.0)
        th_ = tang(0.12)
        crown.curved_box("room screen", R_GL + 0.2, R_OUT - 1.6, bb - th_ / 2, bb + th_ / 2, 0, 3.4, M["oak_panel"])
    sb = bc + tang(4.2)
    lib.box("sitting rug", (3.0, 3.4, 0.014), at(R_OUT - 2.0, sb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(sb), segs=2)
    lib.instance_of(S["chair"], at(R_OUT - 1.1, sb + tang(0.8), 0.0), face_in(sb) - 0.5)
    lib.instance_of(S["chair"], at(R_OUT - 2.7, sb + tang(0.9), 0.0), face_out(sb) + 0.4)
    furn.side_table("side table", at(R_OUT - 1.9, sb + tang(1.25), 0.014), M, r=0.3, h=0.5)
    furn.floor_lamp("reading lamp", at(R_OUT - 0.6, sb + tang(1.7), 0.0), M, watts=60)
    lib.instance_of(S["pouf"], at(R_OUT - 2.2, bc - tang(2.4), 0.0), 0.0)
    db = bc - tang(4.3)
    lib.box("desk", (1.8, 0.75, 0.04), at(R_OUT - 0.75, db, 0.74), M["walnut"], bevel=0.005, rot_z=face_in(db))
    for dx in (-0.8, 0.8):
        lib.box("desk leg", (0.04, 0.7, 0.72), at(R_OUT - 0.75, db + tang(dx), 0.36), M["bronze_dark"], rot_z=face_in(db))
    furn.dining_chair("desk chair", at(R_OUT - 1.55, db, 0.0), face_out(db), M)
    furn.table_lamp("desk lamp", at(R_OUT - 0.55, db - tang(0.6), 0.76), M, watts=35, shade_r=0.15)
    lib.instance_of(S["plant"], at(R_OUT - 0.7, bc - tang(2.0), 0.0), 0.4, 1.9)
    lib.instance_of(S["plant"], at(R_GL + 0.8, bc + tang(2.9), 0.0), 2.2, 1.6)
    p6 = furn.painting_material("painting dawn", (0.62, 0.55, 0.46), [(0.08, 0.92, 0.58, 0.92, (0.72, 0.52, 0.36)), (0.08, 0.92, 0.08, 0.52, (0.50, 0.40, 0.33))])
    for bb in (b0 + 1.6, b1 - 1.6):
        lib.box("dresser", (2.2, 0.5, 0.75), at(R_OUT - 0.3, bb, 0.375), M["walnut"], bevel=0.008, rot_z=face_in(bb))
    furn.painting("painting", 2.4, 1.6, at(R_IN + 0.05, bc, 1.7), face_out(bc) + math.pi, p6, M["frame"])
    for bb in (bc - tang(2.0), bc + tang(2.0)):
        for r in (RM - 1.4, RM + 1.4):
            lib.spot_light("downlight", at(r, bb, ceil_at(bb) - 0.06), 120, (1.0, 0.82, 0.62), 0.03, 45, 0.5)


def sunset_lounge(M, rnd):
    """the sunset lounge (261 to 279): low sofas face the west slots; at sunset the sun shines straight in"""
    b0, b1 = 261.0, 279.0
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - 0.5, b1 + 0.5, M)
    S = imports(M)
    for k, bc in enumerate((265.0, 270.0, 275.0)):
        lib.box("rug", (4.2, 5.4, 0.014), at(RM + 0.4, bc, 0.007), M["rug" if k != 1 else "rug2"], bevel=0.006, rot_z=face_in(bc), segs=2)
        lib.instance_of(S["sofa"], at(R_GL + 1.6, bc, 0.014), face_out(bc), name="lounge sofa")
        for side in (-1, 1):
            bb = bc + side * tang(2.0)
            lib.instance_of(S["chair"], at(RM + 1.0, bb, 0.014), face_in(bb) - side * 0.5, name="lounge chair")
        lib.box("low table", (1.0, 1.9, 0.07), at(RM - 0.1, bc, 0.315), M["olive"], bevel=0.012, rot_z=face_in(bc))
        lib.box("low table base", (0.7, 1.6, 0.28), at(RM - 0.1, bc, 0.14), M["olive_v"], bevel=0.006, rot_z=face_in(bc))
        lib.instance_of(S["vase"], at(RM - 0.1, bc + tang(0.3), 0.35), rnd.uniform(0, 6), 1.6)
        furn.floor_lamp("floor lamp", at(R_GL + 0.6, bc + tang(1.9), 0.0), M, watts=90)
        for dt in (-0.5, 0.5):
            furn.cushion("cushion", (0.44, 0.13, 0.44), at(R_GL + 1.35, bc + tang(dt), 0.62), (math.radians(-14), 0, face_out(bc) + math.pi / 2 * 0), M["rust"] if dt < 0 else M["linen"])
    for bb in (263.0, 267.5, 272.5, 277.0):
        p = at(R_OUT - 1.0, bb, 0.0)
        lib.box("tree planter", (0.9, 0.9, 0.55), (p[0], p[1], 0.275), M["basalt"], bevel=0.01, rot_z=-bb * D)
        furn.olive_tree("lounge olive", (p[0], p[1], 0.55), rnd.randint(0, 9999), M, height=rnd.uniform(3.0, 3.8), leaves=15000)
    b = b0 + 0.6
    while b < b1 - 0.5:
        for (r, d) in ((R_IN + 0.9, -1), (R_OUT - 0.9, 1)):
            q = Vector(at(r, b, ceil_at(b) - 0.08)); tgt = Vector(at(r + d * 0.9, b, 1.2))
            sp = lib.spot_light("wall washer", tuple(q), 70, (1.0, 0.80, 0.60), 0.04, 70, 0.8); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
        b += tang(3.0)


ROOMS = {
    "arrival": dict(build=arrival, span=(91.44, 108.0), sun=(250.0, 14.0), cams={
        "arrival": dict(loc=at(RM + 1.6, 106.2, 1.5), target=at(RM, 95.76, 2.6), lens=18),
        "arrival2": dict(loc=at(R_GL + 0.4, 99.0, 1.5), target=at(R_OUT - 0.5, 104.0, 2.0), lens=18),
    }, stops={"arrival": at(RM + 0.3, 101.8, 0.0)}),
    "dining": dict(build=dining, span=(223.2, 241.2), sun=(244.0, 13.0), cams={
        "dining": dict(loc=at(R_OUT - 1.15, 228.2, 1.55), target=at(RM - 0.8, 235.6, 0.9), lens=19),
        "dining2": dict(loc=at(RM + 0.35, 236.6, 1.4), target=at(RM - 0.1, 228.6, 0.8), lens=22),
    }, stops={"dining": at(RM + 1.6, 232.2, 0.0)}),
    "bedroom": dict(build=bedroom_up, span=(116.64, 130.32), sun=(118.0, 7.0), cams={
        "bedroom": dict(loc=at(R_OUT - 0.9, 126.25, 1.45), target=at(R_GL + 1.2, 123.4, 0.9), lens=18),
        "bedroom2": dict(loc=at(R_GL + 0.65, 121.9, 1.5), target=at(R_OUT - 1.0, 125.8, 1.3), lens=18),
    }, stops={"bedroom": at(RM + 0.9, 124.9, 0.0)}),
    "sunset": dict(build=sunset_lounge, span=(261.0, 279.0), sun=(268.0, 4.5), sun_strength=11.0, cams={
        "sunset": dict(loc=at(R_GL + 0.5, 266.3, 1.4), target=at(R_OUT - 0.2, 271.8, 1.6), lens=20),
        "sunset2": dict(loc=at(R_OUT - 1.4, 277.6, 1.4), target=at(R_GL + 0.4, 268.0, 1.2), lens=20),
    }, stops={"sunset": at(RM, 270.0, 0.0)}),
    "salon": dict(build=salon, span=(144.0, 180.0), sun=(158.0, 38.0), cams={
        "salon":  dict(loc=at(RM - 2.7, 159.9, 1.45), target=at(R_OUT - 0.2, 165.2, 1.35), lens=20),
        "salon2": dict(loc=at(R_OUT - 0.75, 166.3, 1.4), target=at(R_GL - 0.5, 160.3, 1.4), lens=20),
        "hearth": dict(loc=at(RM + 1.4, 151.0, 1.35), target=at(RM - 0.4, 146.5, 0.9), lens=20),
    }, stops={"salon": at(RM, 162.0, 0.0), "hearth": at(RM, 150.6, 0.0), "piano_up": at(RM + 0.6, 173.6, 0.0)}),
}


def build(room):
    sc = lib.reset(); M = materials(); rnd = random.Random(23)
    R = ROOMS[room]; R["build"](M, rnd); crown.outside(M, R["sun"][0], R["sun"][1], sun_strength=R.get("sun_strength", 6.0), skip=R["span"])
    return sc, R


if __name__ == "__main__":
    # crown_rooms.py <room> <jobs> <out with %s> [w h spp exposure [pano_w pano_spp]]: a still is a camera name, a 360
    # is pano:<stop>; a picture that exists already is skipped, so a stopped queue can simply be started again
    args = sys.argv[1:]; room = args[0]; jobs = args[1].split(","); out = args[2]
    w, h, spp, ex = (int(args[3]), int(args[4]), int(args[5]), float(args[6])) if len(args) > 6 else (640, 360, 24, 0.0)
    pw, pspp = (int(args[7]), int(args[8])) if len(args) > 8 else (w * 2, spp)
    paths = {j: os.path.abspath(out.replace("%s", j.replace(":", "_"))) for j in jobs}
    todo = [j for j in jobs if not os.path.exists(paths[j])]
    if not todo: print("nothing to do", flush=True); sys.exit(0)
    t = time.time(); sc, R = build(room); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in todo:
        tmp = paths[j].replace(".jpg", ".part.jpg")
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render(tmp, (pw, pw // 2), pspp, exposure=ex)
        else:
            c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"]); lib.photo_finish(0.3, 0.15)
            t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
