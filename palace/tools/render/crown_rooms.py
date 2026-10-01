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


def materials():
    P_ = lib.principled
    M = {
        "regolith": lib.plaster("regolith plaster", (0.78, 0.72, 0.64), 0.9, 0.08),
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
        "glide": P_("glide belt", (0.05, 0.05, 0.055), 0.55),
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
        tb = lib.box("low table", (1.0, 2.0, 0.34), at(RM, bc, 0.18), M["olive"], bevel=0.02, rot_z=th)
        for side in (-1, 1):
            db = side * 2.6 / 130 / D
            lib.instance_of(chair, at(RM + 0.2, bc + db, 0.014), th + side * math.pi / 2, name="salon chair")
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


ROOMS = {
    "salon": dict(build=salon, span=(144.0, 180.0), sun=(158.0, 38.0), cams={
        "salon":  dict(loc=at(R_GL + 0.6, 157.4, 1.45), target=at(R_OUT - 0.5, 163.0, 1.6), lens=18),
        "salon2": dict(loc=at(R_OUT - 0.9, 170.2, 1.45), target=at(R_GL, 163.5, 1.5), lens=18),
        "hearth": dict(loc=at(RM + 0.8, 153.4, 1.4), target=at(RM, 146.5, 1.0), lens=22),
    }, stops={"salon": at(RM, 162.0, 0.0), "hearth": at(RM, 150.6, 0.0), "piano_up": at(RM + 0.6, 173.6, 0.0)}),
}


def build(room):
    sc = lib.reset(); M = materials(); rnd = random.Random(23)
    R = ROOMS[room]; R["build"](M, rnd); crown.outside(M, R["sun"][0], R["sun"][1], skip=R["span"])
    return sc, R


if __name__ == "__main__":
    args = sys.argv[1:]; room = args[0]; jobs = args[1].split(","); out = args[2]
    w, h, spp, ex = (int(args[3]), int(args[4]), int(args[5]), float(args[6])) if len(args) > 6 else (640, 360, 24, 0.0)
    t = time.time(); sc, R = build(room); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in jobs:
        path = os.path.abspath(out.replace("%s", j.replace(":", "_")))
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render(path, (w * 2, w), spp, exposure=ex)
        else:
            c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"]); lib.photo_finish(0.3, 0.15)
            t = time.time(); lib.render(path, (w, h), spp, exposure=ex)
        print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
