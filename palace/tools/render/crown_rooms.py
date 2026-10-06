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
    """polished basalt: near-black, fine grey grains, honed to a soft sheen: reflections blurred and broken a little,
    as in real stone (a mirror finish read as a wet floor)"""
    m, nt = lib._mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Coat Weight"].default_value = 0.4; b.inputs["Coat Roughness"].default_value = 0.1
    tc = nt.nodes.new("ShaderNodeTexCoord")
    rn = nt.nodes.new("ShaderNodeTexNoise"); rn.inputs["Scale"].default_value = 3.0; rn.inputs["Detail"].default_value = 8; L.new(tc.outputs["Object"], rn.inputs["Vector"])
    L.new(lib._math(nt, "MULTIPLY_ADD", rn.outputs["Fac"], 0.14, 0.13), b.inputs["Roughness"])          # 0.13 to 0.27
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
    """the Salon (144 to 180; revision H: one hall 16.5 m deep and 20 m tall under the Salon spire). The hearth room
    (C-09): a basalt wall across it, a long hearth of lit mist at its foot, a velvet crescent facing it. The great
    salon (C-10), 45 m long: two long boucle sofas facing across a travertine table; a velvet crescent 8.8 m long round
    a marble table under a halo of light 8 m across; an L of sofas with ottomans; red and orange Japanese maples
    between the groups, kentia palms along the Glide, birds of paradise at the windows. The recital room (C-11): the
    concert grand, two crescents facing it. Screen walls of olive wood 4.2 m tall between the three"""
    import seating, tables, lights, plants, art
    b0, b1 = 144.0, 180.0
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    crown.glide_lights(b0, b1)
    th = 0.3 / 130 / D
    for b in (151.92, 172.08):
        crown.curved_box("screen wall", R_GL + 0.05, R_GL + 4.0, b - th / 2, b + th / 2, 0, 4.2, M["olive_v"])
        crown.curved_box("screen wall", R_OUT - 4.2, R_OUT, b - th / 2, b + th / 2, 0, 4.2, M["olive_v"])
    boucle = seating.fabric("oat boucle", (0.58, 0.52, 0.44), "boucle"); velvet = seating.fabric("ink velvet", (0.06, 0.08, 0.14), "velvet")
    rust = seating.fabric("rust velvet", (0.30, 0.09, 0.04), "velvet"); moss = seating.fabric("moss velvet", (0.10, 0.13, 0.08), "velvet")
    leather = seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather")
    marble = seating.stone("salon marble", (0.86, 0.84, 0.80), (0.40, 0.38, 0.36), "marble", 0.12)
    # group A: two long sofas facing across a travertine table, club chairs at its ends
    ga = 156.3
    lib.box("rug", (8.4, 7.2, 0.014), at(RM, ga, 0.007), M["rug"], bevel=0.006, rot_z=face_in(ga), segs=2)
    for side in (-1, 1):
        seating.sofa("salon sofa", at(RM + side * 2.4, ga, 0.0), face_in(ga) if side > 0 else face_out(ga), length=5.2, fabric_mat=boucle, seed=70 + side)
        seating.club_chair("salon chair", at(RM, ga + side * tang(2.35), 0.0), face_ccw(ga) if side > 0 else face_cw(ga), fabric_mat=rust, seed=72 + side)
    tables.coffee_table("salon table", at(RM, ga, 0.0), face_in(ga), length=2.6, width=1.2)
    plants.make("orchid", at(RM, ga - tang(0.7), 0.36), seed=91, pot=(0.18, 0.14, "white"), colour="white")
    lights.globes("salon globes", at(RM, ga), n=9, spread=0.8, low=3.2, high=4.4, ceiling=ceil_at(ga), watts=55)
    # group B under the spire: a crescent round a marble table, facing the windows, two club chairs across it
    gb = 162.0
    lib.box("rug", (10.4, 8.4, 0.014), at(RM + 0.6, gb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(gb), segs=2)
    seating.crescent("salon crescent", at(RM - 2.3, gb, 0.0), face_out(gb), radius=3.4, length=8.8, fabric_mat=velvet, seed=75)
    tables.coffee_table("salon round", at(RM + 1.1, gb, 0.0), 0.0, length=1.8, kind="round", mat=marble)
    plants.make("orchid", at(RM + 1.1, gb, 0.36), seed=92, pot=(0.2, 0.15, "black"), colour="magenta")
    for side in (-1, 1):
        seating.club_chair("salon chair", at(RM + 4.0, gb + side * tang(1.55, RM + 4.0), 0.0), face_in(gb) - side * 0.35, fabric_mat=moss, seed=76 + side)
    lights.halo("salon halo", at(RM + 0.4, gb), d=8.0, z=11.5, ceiling=ceil_at(gb), watts=2600)
    # group C: an L of two sofas and two leather ottomans round a stacked travertine table
    gc = 168.1
    lib.box("rug", (8.0, 7.0, 0.014), at(RM, gc, 0.007), M["rug"], bevel=0.006, rot_z=face_in(gc), segs=2)
    seating.sofa("salon sofa", at(RM - 2.3, gc, 0.0), face_out(gc), length=5.0, fabric_mat=boucle, seed=78)
    seating.sofa("salon sofa", at(RM + 0.2, gc + tang(2.9), 0.0), face_ccw(gc + tang(2.9)), length=3.6, fabric_mat=boucle, seed=79)
    tables.coffee_table("salon stack", at(RM, gc, 0.0), face_in(gc), length=2.2, width=1.1, kind="stack")
    for side in (-1, 1): seating.ottoman("salon ottoman", at(RM + 2.4, gc + side * tang(1.0), 0.0), d=1.0, fabric_mat=leather, seed=80 + side)
    lights.globes("salon globes", at(RM, gc), n=9, spread=0.8, low=3.2, high=4.4, ceiling=ceil_at(gc), watts=55, seed=5)
    lights.arc_lamp("salon arc", at(RM - 2.6, gc - tang(3.1), 0.0), face_out(gc) - 0.4, reach=2.0)
    # the plants
    plants.make("japanese maple", at(R_OUT - 3.2, 159.15, 0.0), seed=81, pot=(1.6, 0.6, "basalt"), height=4.6, colour="red", stems=3)
    plants.make("japanese maple", at(R_OUT - 3.2, 165.15, 0.0), seed=82, pot=(1.4, 0.6, "basalt"), height=4.1, colour="orange", stems=2)
    for k, b in enumerate((153.4, 159.15, 165.15, 170.6)):
        plants.make("kentia palm", at(R_GL + 1.7, b, 0.0), seed=83 + k, pot=(0.95, 0.7, "black"), height=3.6)
    for k, b in enumerate((153.0, 171.0)):
        plants.make("bird of paradise", at(R_OUT - 1.5, b, 0.0), seed=88 + k, pot=(1.1, 0.7, "bronze"), height=3.8)
    # the hearth room: a basalt wall across it, the hearth of lit mist at its foot, a crescent facing it, a ginkgo
    hb = 145.4
    crown.curved_box("hearth wall", R_GL + 4.0, R_OUT - 3.2, hb - tang(0.4), hb, 0, 4.8, M["basalt_wall"])
    mist_hearth(RM + 0.6, hb + tang(0.65), M, 6.0)
    hs = 150.5
    lib.box("hearth rug", (9.0, 7.0, 0.014), at(RM + 0.6, 148.4, 0.007), M["rug2"], bevel=0.006, rot_z=face_cw(148.4), segs=2)
    seating.crescent("hearth crescent", at(RM + 0.6, hs, 0.0), face_ccw(hs), radius=3.2, length=7.6, fabric_mat=rust, seed=84)
    tables.coffee_table("hearth table", at(RM + 0.6, hs - tang(2.9), 0.0), 0.0, length=1.5, kind="round", mat=marble)
    plants.make("ginkgo", at(R_OUT - 1.8, 147.2, 0.0), seed=85, pot=(1.4, 0.7, "bronze"), height=5.2, colour="gold")
    # the recital room: the concert grand facing back into the salon, two crescents facing it, palms either side
    furn.piano(at(RM + 1.2, 177.6, 0.0), face_ccw(177.6) + math.pi / 2 + 0.25, M)
    for side, r in ((-1, RM - 2.4), (1, RM + 3.0)):
        bb = 174.2
        seating.crescent("recital crescent", at(r, bb, 0.0), face_cw(bb) - side * 0.25, radius=4.2, length=4.8, fabric_mat=velvet, seed=86 + side)
    for side in (-1, 1): plants.make("kentia palm", at(RM + 1.0 + side * 3.6, 178.9, 0.0), seed=89 + side, pot=(0.95, 0.7, "black"), height=3.4)
    lights.globes("piano globes", at(RM + 1.2, 177.2), n=7, spread=0.6, low=3.0, high=3.8, ceiling=ceil_at(177.2), watts=45, seed=8)
    # paintings, each lit: Kandinsky's Composition VII and Delaunay's Landscape with Disc on the screen walls, facing into
    # the salon; Turner's sea over the hearth
    paint("salon west painting", "kandinsky_composition_vii", 3.4, at(R_OUT - 2.1, 151.92 + tang(0.17, R_OUT - 2.1), 0.0), face_cw(151.92), 2.2)
    paint("salon east painting", "delaunay_landscape_disc", 3.0, at(R_OUT - 2.1, 172.08 - tang(0.17, R_OUT - 2.1), 0.0), face_ccw(172.08), 2.15, tall=True)
    paint("hearth painting", "turner_shipwreck", 3.6, at(RM + 0.6, hb + tang(0.02), 0.0), face_cw(hb), 3.0)
    washers(b0, b1, 220)


def paint(name, key, size, loc, rot_z, z, tall=False):
    """hang the painting key (chosen for its room: furnishing.py; fetched by fetch_art.py), size metres wide, or tall if
    tall, its middle z up; skipped if the paintings have not been fetched"""
    import art
    if key not in art.catalogue(): print("no painting", key, flush=True); return None
    return art.hang(name, key, size, loc, rot_z, z=z, height=size if tall else None)


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
    """the Arrival hall (95.8 to 108; revision H: 20 m tall under the Arrival spire, 16.5 m deep). Through the Door,
    a ring of light 5 m across in a basalt wall: the hall's great tree, a Japanese maple 7 m tall, red turning orange, in
    a round basalt planter with a banquette of cognac leather wrapped round it, under a halo of light 9 m across; kentia
    palms by the portal to the Orb at the far end, agaves in travertine bowls along the windows; a great painting on
    the end wall"""
    import seating, tables, lights, plants, art
    b0, b1 = 95.76, 108.0
    crown.ring_room(b0 - 4.32, b1, M, M["basalt"], part_walls=False)
    th = 0.3 / 130 / D
    crown.curved_box("end wall", R_GL + 0.05, R_OUT, b1 - th / 2, b1 + th / 2, 0, 9, M["regolith"], zf1=lambda bb: ceil_at(bb) + 0.01)
    crown.curved_box("hangar end", R_IN - 0.6, R_OUT + 0.6, b0 - 4.32 - th, b0 - 4.32, 0, 9, M["regolith"], zf1=lambda bb: ceil_at(bb) + 0.01)
    iris_door(b0, M)
    crown.glide_lights(b0 - 4.32, b1)
    # the great tree, its planter wrapped in a round banquette, under a halo
    tb = b0 + tang(13.0); tr = RM + 0.4; p = at(tr, tb, 0.0)
    lib.cyl("tree planter", 1.7, 0.86, p, M["basalt"], verts=128, bevel=0.012)
    lib.cyl("tree soil", 1.62, 0.02, (p[0], p[1], 0.82), plants.soil_material(), verts=96)
    seating.round_banquette("arrival banquette", p, r_in=1.7, r_out=2.5, back_h=0.86, fabric_mat=seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather"))
    plants.make("japanese maple", (p[0], p[1], 0.84), seed=101, height=7.0, colour="orange", stems=4)
    lights.halo("arrival halo", p, d=9.0, z=10.5, ceiling=ceil_at(tb), watts=3000)
    lib.box("arrival rug", (11.0, 11.0, 0.014), at(tr, tb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(tb), segs=2)
    # the portal to the Orb at the far end, palms either side; agaves along the windows; long leather benches by the Door
    portal(RM, b1 - 0.6, M, face_ccw(b1 - 0.6))
    for s_ in (-1, 1): plants.make("kentia palm", at(RM + s_ * 3.4, b1 - tang(1.6), 0.0), seed=102 + s_, pot=(1.0, 0.75, "black"), height=3.8)
    for k, bb in enumerate((b0 + tang(5.0, R_OUT), b0 + tang(21.0, R_OUT))):
        plants.make("agave", at(R_OUT - 1.4, bb, 0.0), seed=105 + k, pot=(1.2, 0.45, "travertine"), size=0.9)
    for s_ in (-1, 1):
        seating.bench("door bench", at(RM + s_ * 4.6, b0 + tang(3.2), 0.0), face_cw(b0 + tang(3.2)) + math.pi / 2, length=2.8, depth=0.6,
                      fabric_mat=seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather"))
    paint("arrival painting", "vangogh_starry_night", 4.2, at(RM + 3.2, b1 - tang(0.17, RM + 3.2), 0.0), face_ccw(b1), 2.6)
    washers(b0 - 4.0, b1, 220)


def dining(M, rnd):
    """the dining hall (223.2 to 241.2; revision H: 16.5 m deep, 20 m tall under the Dining spire): one table of
    polished basalt 14 m long for 22, curving with the ring, in high-backed velvet chairs; a line of four halos of
    light over it; marble sideboards at both ends; lemon trees in terracotta along the windows, olives at the ends"""
    import seating, tables, lights, plants, art
    b0, b1 = 223.2, 241.2
    crown.ring_room(b0, b1, M, M["basalt"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    crown.glide_lights(b0, b1)
    bc = (b0 + b1) / 2; L_ = 14.0; rt = RM + 0.6
    # the table: a long slab of basalt on three pedestals, curving with the ring
    crown.curved_box("table top", rt - 0.7, rt + 0.7, bc - tang(L_ / 2, rt), bc + tang(L_ / 2, rt), 0.70, 0.76, M["basalt_table"])
    for k in (-1, 0, 1):
        bb = bc + k * tang(L_ / 2 - 2.2, rt)
        crown.curved_box("table pedestal", rt - 0.35, rt + 0.35, bb - tang(0.5, rt), bb + tang(0.5, rt), 0.0, 0.70, M["basalt_table"])
    lib.box("dining rug", (17.0, 6.0, 0.014), at(rt, bc, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(bc), segs=2)
    velvet = seating.fabric("claret velvet", (0.17, 0.022, 0.028), "velvet")
    n = 10
    for i in range(n):
        bb = bc - tang(L_ / 2 - 0.75, rt) + i * tang((L_ - 1.5) / (n - 1), rt)
        seating.dining_chair("dining chair", at(rt - 1.02, bb, 0.0), face_out(bb), fabric_mat=velvet, seed=200 + i)
        seating.dining_chair("dining chair", at(rt + 1.02, bb, 0.0), face_in(bb), fabric_mat=velvet, seed=220 + i)
    for k in (-1, 1):
        bb = bc + k * tang(L_ / 2 + 0.7, rt); seating.dining_chair("dining chair", at(rt, bb, 0.0), face_ccw(bb) if k > 0 else face_cw(bb), fabric_mat=velvet, seed=240 + k)
    # the table laid: plates and glasses, candles in glass, a linen runner, orchids in low bowls
    crown.curved_box("runner", rt - 0.24, rt + 0.24, bc - tang(L_ / 2 - 0.4, rt), bc + tang(L_ / 2 - 0.4, rt), 0.76, 0.763, M["linen"])
    for i in range(n):
        bb = bc - tang(L_ / 2 - 0.75, rt) + i * tang((L_ - 1.5) / (n - 1), rt)
        for side in (-1, 1):
            lib.cyl("plate", 0.15, 0.012, at(rt + side * 0.42, bb, 0.763), M["porcelain"], verts=48, bevel=0.003)
            furn.lathe("wine glass", [(0.0, 0.0), (0.035, 0.0), (0.004, 0.006), (0.004, 0.09), (0.03, 0.11), (0.042, 0.16), (0.035, 0.21), (0.0, 0.21)], M["crystal"], 32, at(rt + side * 0.32, bb + tang(0.18, rt), 0.763))
    for k in range(5):
        bb = bc + tang(-5.2 + 2.6 * k, rt)
        if k % 2 == 0: plants.make("orchid", at(rt, bb, 0.763), seed=250 + k, pot=(0.26, 0.1, "white"), colour="white")
        else:
            lib.cyl("candle", 0.04, 0.16, at(rt, bb, 0.763), lib.emission("candle wax", (1.0, 0.72, 0.42), 1.5), verts=24)
            lib.point_light("candle light", at(rt, bb, 0.95), 8.0, (1.0, 0.62, 0.32), 0.03)
    for k in range(4):                         # the halos over the table
        bb = bc + tang(-5.25 + 3.5 * k, rt)
        lights.halo("dining halo", at(rt, bb), d=2.8, z=3.6, ceiling=ceil_at(bb), watts=520)
    # sideboards at both ends, alabaster lamps on them; lemons along the windows, olives at the ends
    for k, bb in enumerate((b0 + tang(2.6, R_OUT - 0.5), b1 - tang(2.6, R_OUT - 0.5))):
        tables.console("sideboard", at(R_OUT - 0.55, bb, 0.0), face_in(bb), length=3.4, depth=0.55, h=0.86)
        lights.alabaster_pendant("sideboard pendant", at(R_OUT - 0.9, bb), z=2.0, ceiling=ceil_at(bb), watts=50)
    for k, bb in enumerate((227.4, 230.9, 234.4, 237.9)):
        plants.make("lemon", at(R_OUT - 1.5, bb, 0.0), seed=260 + k, pot=(0.95, 0.75, "terracotta"), height=2.6)
    for k, bb in enumerate((b1 - tang(2.0),)):         # an olive at the kitchen's end (the ginkgo stands at the wine room's)
        plants.make("olive", at(R_GL + 2.0, bb, 0.0), seed=270 + k, pot=(1.3, 0.8, "travertine", True), height=4.2, stems=2)
    # Van Gogh's olive trees and wheat field, painted at Saint-Rémy the same summer, a pair across the table
    paint("dining west painting", "vangogh_olive_trees", 5.4, at(RM - 1.0, b0 + tang(0.17, RM - 1.0), 0.0), face_cw(b0), 3.4)
    paint("dining east painting", "vangogh_wheat_field", 5.4, at(RM - 1.0, b1 - tang(0.17, RM - 1.0), 0.0), face_ccw(b1), 3.4)
    # the drinks lounge at the wine room's end, for before and after dinner: a sectional and two club chairs round a
    # marble table on its own rug, a gold ginkgo by the glass
    lb, lr = 225.9, RM - 0.6
    lib.box("lounge rug", (7.2, 5.6, 0.014), at(lr + 0.6, lb, 0.007), M["rug"], bevel=0.006, rot_z=face_in(lb), segs=2)
    ink = seating.fabric("ink velvet", (0.06, 0.08, 0.13), "velvet")
    seating.sectional("dining lounge", at(lr - 0.9, lb, 0.0), face_out(lb), lx=5.4, ly=3.4, fabric_mat=ink, seed=280)
    tables.coffee_table("lounge table", at(lr + 1.0, lb, 0.0), face_in(lb), length=1.6, kind="round",
                        mat=seating.stone("green marble", (0.16, 0.24, 0.20), (0.75, 0.78, 0.74), "marble", 0.12))
    for s_ in (-1, 1):
        bb = lb + s_ * tang(1.15, lr + 2.8)
        seating.club_chair("lounge chair", at(lr + 2.8, bb, 0.0), face_in(bb) - s_ * 0.3, fabric_mat=seating.fabric("rust velvet", (0.42, 0.14, 0.06), "velvet"), seed=282 + s_)
    plants.make("ginkgo", at(R_GL + 1.7, b0 + tang(1.6, R_GL + 1.7), 0.0), seed=285, pot=(1.4, 0.75, "basalt"), height=5.5)
    lights.halo("lounge halo", at(lr + 0.6, lb), d=3.4, z=4.2, ceiling=ceil_at(lb), watts=600)
    washers(b0, b1, 220)


def bedroom_up(M, rnd):
    """the master suite up's bedroom (116.6 to 130.3; revision H: 16.5 m deep, 12.5 m tall): the grand bed in the
    middle of the room facing the south-east windows, so the sun rises across it, under a halo of light; a sitting
    group at the bath end and a writing desk at the dressing end, each by its windows; two red Japanese maples, a
    kentia palm, a fiddle-leaf fig, white orchids by the bed; paintings on the cross walls. Onto the Glide, a wall of
    bronze and switchable glass, frosted for privacy; the suite's doors are in the dressing room"""
    import bed, seating, tables, lights, plants, art
    b0, b1 = 116.64, 130.32
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["oak_panel"], part_walls=False)
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    for b in (b0, b1): crown.partition(b, M, M["oak_panel"], opening=SUITE_DOOR, head=3.6)
    crown.glass_wall("suite glass", R_GL + 0.2, b0, b1, M, state="frosted")
    bc = (b0 + b1) / 2; ceil = ceil_at(bc)
    # the bed, its headboard wall 4.6 m in from the glass, facing out
    rb = R_GL + 4.6 + 1.165; rot = face_out(bc); base = Vector(at(rb, bc, 0.0)); Rz = Matrix.Rotation(rot, 3, "Z")
    def local(x, y, z): return tuple(base + Rz @ Vector((x, y, z)))
    bed.grand_bed("grand bed", tuple(base), rot, M, ceiling=ceil)
    lib.box("bed rug", (7.4, 6.4, 0.014), at(rb + 1.0, bc, 0.007), M["rug"], bevel=0.006, rot_z=face_in(bc), segs=2)
    lights.halo("bed halo", at(rb + 0.4, bc), d=3.8, z=6.2, ceiling=ceil, watts=700)
    for s_ in (-1, 1): plants.make("orchid", local(s_ * 2.15, 0.94, 0.52), seed=11 + s_, pot=(0.18, 0.14, "white"), colour="white")
    # the sunrise corner: two club chairs at the windows in front of the bed, a drum between them
    for s_ in (-1, 1):
        bb = bc + s_ * tang(1.3, R_OUT - 2.0)
        seating.club_chair("window chair", at(R_OUT - 2.0, bb, 0.0), face_out(bb) - s_ * 0.45, fabric_mat=seating.fabric("rust velvet", (0.30, 0.09, 0.04), "velvet"), seed=4 + s_)
    tables.drum("window drum", at(R_OUT - 1.6, bc, 0.0), d=0.5, h=0.5)
    # the sitting group at the bath end: a long sofa facing the windows, a travertine table, two more club chairs
    sb = b1 - tang(6.0, 127.5)
    lib.box("sitting rug", (6.2, 5.2, 0.014), at(128.3, sb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(sb), segs=2)
    seating.sofa("sitting sofa", at(126.3, sb, 0.0), face_out(sb), length=4.6, fabric_mat=seating.fabric("oat boucle", (0.56, 0.50, 0.42), "boucle"), seed=3)
    tables.coffee_table("sitting table", at(128.2, sb, 0.0), face_out(sb), length=2.2, width=1.0)
    for s_ in (-1, 1):
        bb = sb + s_ * tang(2.15, 128.6)
        seating.club_chair("sitting chair", at(128.6, bb, 0.0), (face_ccw(bb) if s_ > 0 else face_cw(bb)), fabric_mat=seating.fabric("moss velvet", (0.10, 0.13, 0.08), "velvet"), seed=8 + s_)
    lights.arc_lamp("sitting arc", at(125.7, sb + tang(2.7, 125.7), 0.0), face_out(sb) + 0.5, reach=1.9)
    # the desk at the dressing end, facing its window
    db = b0 + tang(4.6, 132.0)
    tables.desk("desk", at(132.2, db, 0.0), face_in(db), length=2.6, depth=0.95)
    seating.desk_chair("desk chair", at(131.2, db, 0.0), face_out(db) + 0.15)
    lights.alabaster_pendant("desk pendant", at(132.0, db - tang(0.7, 132.0)), z=1.7, ceiling=ceil_at(db), watts=45)
    plants.make("orchid", at(132.3, db + tang(0.9, 132.0), 0.77), seed=21, pot=(0.16, 0.13, "black"), colour="magenta")
    # the plants
    for s_, seed in ((-1, 31), (1, 32)):
        bb = bc + s_ * tang(5.4, 130.0)
        plants.make("japanese maple", at(130.0, bb, 0.0), seed=seed, pot=(1.3, 0.5, "basalt"), height=3.4, colour="red", stems=3)
    plants.make("kentia palm", at(R_OUT - 1.5, b1 - tang(1.4, 133.5), 0.0), seed=33, pot=(0.95, 0.7, "black"), height=3.4)
    plants.make("fiddle-leaf fig", at(R_OUT - 1.3, b0 + tang(1.5, 133.7), 0.0), seed=34, pot=(0.75, 0.62, "white"), height=2.8)
    # paintings on the cross walls, each with its light
    paint("bath end painting", "monet_water_lilies", 3.0, at(128.6, b1 - tang(0.16, 128.6), 0.0), face_ccw(b1), 2.2)
    paint("desk end painting", "vangogh_starry_night_rhone", 2.4, at(129.0, b0 + tang(0.16, 129.0), 0.0), face_cw(b0), 2.0)
    washers(b0, b1, 160); crown.glide_lights(b0, b1)
    for bb in (bc - tang(4.0), bc + tang(4.0)):
        for r in (RM - 3.0, RM + 3.0):
            lib.spot_light("downlight", at(r, bb, ceil_at(bb) - 0.06), 600, (1.0, 0.82, 0.62), 0.03, 30, 0.5)


SUITE_DOOR = (R_GL + 1.0, R_GL + 3.6)        # the doorways between the dressing room, the bedroom and the bath


def sunset_lounge(M, rnd):
    """the sunset lounge (261 to 279; furnishing.py): two long low sofas 6 m, curving with the ring, face the west
    windows across long travertine tables, a daybed beside each; low lamps, for the sunset does the rest; beds of
    agaves and golden barrels on the piers between the windows, so the glass stays clear; between the two groups a
    velvet crescent round a marble table; gold ginkgos and red and orange maples to glow; a warm halo over each group"""
    import seating, tables, lights, plants
    b0, b1 = 261.0, 279.0
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    crown.glide_lights(b0, b1)
    sand = seating.fabric("sand boucle", (0.66, 0.58, 0.47), "boucle"); rust = seating.fabric("rust velvet", (0.42, 0.14, 0.06), "velvet")
    trav = seating.stone("sunset travertine", (0.80, 0.70, 0.56), (0.62, 0.52, 0.40), "travertine", 0.3)
    rs = RM - 1.4
    for k, bc in enumerate((265.4, 274.6)):
        lib.box("rug", (8.0, 5.0, 0.014), at(RM + 0.2, bc, 0.007), M["rug" if k == 0 else "rug2"], bevel=0.006, rot_z=face_in(bc), segs=2)
        seating.sofa("sunset sofa", at(rs, bc, 0.0), face_out(bc), length=6.0, depth=1.15, fabric_mat=sand, bend=rs, seed=320 + k)
        tables.coffee_table("sunset table", at(rs + 1.75, bc, 0.0), face_in(bc), length=3.6, width=1.0, h=0.32, mat=trav)
        db = bc + (1 if k == 0 else -1) * tang(4.0, rs + 1.2)
        seating.daybed("sunset daybed", at(rs + 1.2, db, 0.0), face_cw(db) + (0.35 if k == 0 else -0.35) + math.pi, length=2.3, width=1.1, fabric_mat=rust, seed=324 + k)
        for s_ in (-1, 1):
            e = bc + s_ * tang(3.45, rs); tables.drum("sunset drum", at(rs, e, 0.0), d=0.5, h=0.5)
            furn.table_lamp("sunset lamp", at(rs, e, 0.5), M, watts=40, shade_r=0.16)
        for dt in (-1.6, -0.5, 0.6, 1.7):
            furn.cushion("cushion", (0.5, 0.14, 0.5), at(rs - 0.32, bc + tang(dt, rs), 0.66), (math.radians(-14), 0, face_out(bc)), M["rust"] if dt < 0 else M["linen"])
    # beds of agaves and golden barrels on the piers between the windows
    gravel = lib.principled("bed gravel", (0.30, 0.24, 0.19), 0.9)
    for k, pb in enumerate((264.2, 267.6, 271.0, 274.4, 277.8)):
        a, b = pb - tang(1.4, R_OUT - 0.75), pb + tang(1.4, R_OUT - 0.75)
        crown.curved_box("cactus bed", R_OUT - 1.35, R_OUT - 0.15, a, b, 0.0, 0.42, M["basalt"])
        crown.curved_box("cactus gravel", R_OUT - 1.27, R_OUT - 0.23, a + tang(0.08, R_OUT), b - tang(0.08, R_OUT), 0.42, 0.425, gravel)
        if k % 2 == 0:
            plants.make("agave", at(R_OUT - 0.75, pb, 0.425), seed=330 + k, size=0.9)
            for s_ in (-1, 1): plants.make("golden barrel", at(R_OUT - 0.65, pb + s_ * tang(0.9, R_OUT), 0.425), seed=340 + 2 * k + s_, r=0.24)
        else:
            for s_ in (-1, 1): plants.make("agave", at(R_OUT - 0.75, pb + s_ * tang(0.7, R_OUT), 0.425), seed=350 + 2 * k + s_, size=0.7, colour="blue" if s_ < 0 else "green")
            plants.make("golden barrel", at(R_OUT - 0.6, pb, 0.425), seed=360 + k, r=0.28)
    for k, bb in enumerate((b0 + tang(2.2, R_GL + 2.0), b1 - tang(2.2, R_GL + 2.0))):
        plants.make("ginkgo", at(R_GL + 2.0, bb, 0.0), seed=370 + k, pot=(1.4, 0.75, "basalt"), height=5.6)
    # between the two, under the stop: a rust velvet crescent round a marble table, facing the windows, two club chairs
    cc = 270.0; marble = seating.stone("sunset marble", (0.86, 0.84, 0.80), (0.40, 0.38, 0.36), "marble", 0.12)
    lib.box("rug", (7.6, 6.4, 0.014), at(RM + 1.2, cc, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(cc), segs=2)
    seating.crescent("sunset crescent", at(RM - 1.2, cc, 0.0), face_out(cc), radius=2.8, length=6.4, fabric_mat=rust, seed=380)
    tables.coffee_table("sunset round table", at(RM + 1.6, cc, 0.0), 0.0, length=1.6, kind="round", mat=marble)
    for s_ in (-1, 1):
        seating.club_chair("sunset chair", at(RM + 3.9, cc + s_ * tang(1.4, RM + 3.9), 0.0), face_in(cc) - s_ * 0.35, fabric_mat=sand, seed=381 + s_)
    # a red and an orange maple by the glass either side of it, to glow with the ginkgos at sunset
    for k, (bb, col) in enumerate(((cc - tang(5.2, R_GL + 2.2), "red"), (cc + tang(5.2, R_GL + 2.2), "orange"))):
        plants.make("japanese maple", at(R_GL + 2.2, bb, 0.0), seed=384 + k, pot=(1.4, 0.62, "basalt"), height=4.2, colour=col, stems=3)
    # halos over the three groups, warm
    for bb, r in ((265.4, rs + 1.0), (cc, RM + 1.4), (274.6, rs + 1.0)):
        lights.halo("sunset halo", at(r, bb), d=5.0, z=5.4, ceiling=ceil_at(bb), watts=800, color=(1.0, 0.74, 0.50))
    washers(b0, b1, 150, (1.0, 0.80, 0.60))


def radial_frame(r, b, inward=False):
    """a frame at radius r and bearing b: z up, +y outwards along the radius (inwards if inward), x along the ring"""
    y = Vector((math.sin(b * D), math.cos(b * D), 0)) * (-1 if inward else 1); x = Vector((y.y, -y.x, 0))
    o = P(r, b)
    return Matrix(((x.x, y.x, 0, o.x), (x.y, y.y, 0, o.y), (0, 0, 1, 0), (0, 0, 0, 1)))


def books_along(M, rnd, r, b0, b1, z0, z1, inward=False, seg=1.0, depth=0.42):
    """bookshelves along a curved wall whose face is at radius r, from bearing b0 to b1: short straight runs of
    shelving, each `seg` metres, turned to follow the curve"""
    import pent_rooms
    n = max(1, int(round((b1 - b0) * D * r / seg))); db = (b1 - b0) / n; w = db * D * r
    for i in range(n):
        bm_b, bm_s, bm_u, dec = bmesh.new(), bmesh.new(), bmesh.new(), []
        pent_rooms.stack(bm_b, rnd, -w / 2, w / 2, 0.0, depth, z0, z1, 0.42, dec, bm_s, bm_u)
        Mw = radial_frame(r, b0 + (i + 0.5) * db, inward)
        for (bm_, nm, mat) in ((bm_b, "books", M["book"]), (bm_s, "shelves", M["walnut"]), (bm_u, "uprights", M["walnut_v"])):
            o = lib.mesh_obj(nm, bm_, mat); o.matrix_world = Mw
        for (x, z, h) in dec:
            o = furn.ornament("ornament", x, -0.24, z, h, random.Random(int(x * 1000 + z * 10 + i)), M["ceramics"]); o.matrix_world = Mw @ o.matrix_world


def mars_globe(name, loc, r, M):
    """a globe of Mars, 2r across, in a bronze meridian on a bronze stand, tilted 25.2 degrees as Mars is"""
    g = furn.empty(name, loc)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=r, location=(0, 0, 0)); s = bpy.context.active_object; s.name = name + " sphere"
    for p_ in s.data.polygons: p_.use_smooth = True
    m, nt = lib._mat("mars globe")
    if nt is not None:
        b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.45; b.inputs["Coat Weight"].default_value = 0.35
        t = lib._tex(nt, os.path.join(A, "mars2k.jpg")); tc = nt.nodes.new("ShaderNodeTexCoord"); nt.links.new(tc.outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    s.data.materials.append(m); h = r + 0.9; s.location = (0, 0, h); s.rotation_euler = (math.radians(25.2), 0, 2.2); s.parent = g
    bpy.ops.mesh.primitive_torus_add(major_radius=r + 0.08, minor_radius=0.025, major_segments=160, minor_segments=12, location=(0, 0, h), rotation=(math.radians(25.2) + math.pi / 2, 0, 0))
    mer = bpy.context.active_object; mer.data.materials.append(M["bronze"]); mer.parent = g
    bpy.ops.mesh.primitive_torus_add(major_radius=r + 0.16, minor_radius=0.03, major_segments=160, minor_segments=12, location=(0, 0, h))
    hor = bpy.context.active_object; hor.data.materials.append(M["bronze"]); hor.parent = g
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; leg = lib.cyl(name + " leg", 0.035, h, (math.cos(a) * (r + 0.16) * 0.98, math.sin(a) * (r + 0.16) * 0.98, 0.0), M["bronze_dark"], verts=16); leg.parent = g
    base = lib.cyl(name + " base", r * 0.9, 0.08, (0, 0, 0), M["basalt"], verts=96, bevel=0.01); base.parent = g
    return g


def library_up(M, rnd):
    """the Library under its spire (288 to 324; revision H: 16.5 m deep, 20 m tall). The library (C-24): walnut
    shelves on the piers between the outer windows and three storeys of books above them, to 12.7 m, with two
    galleries reached by spiral stairs; long walnut reading tables with leather chairs, leather sofas and club chairs
    at the windows, kentia palms, a halo under the spire. The study (C-23): Jim's day desk at its windows, a reading
    sofa. The map room (C-25): the globe of Mars 3 m across, a long leather sofa facing it, map chests"""
    import pent_rooms, seating, tables, lights, plants, art
    b0, b1, bs0, bs1 = 288.0, 324.0, 297.0, 316.8
    crown.ring_room(b0, b1, M, M["oak"])
    crown.glide_lights(b0, b1)
    th = 0.3 / 130 / D
    for b in (bs0, bs1):     # walnut walls with a wide opening between the three rooms
        for (r0, r1) in ((R_GL + 0.05, R_GL + 4.0), (R_OUT - 4.0, R_OUT)):
            crown.curved_box("room wall", r0, r1, b - th / 2, b + th / 2, 0, 9.0, M["walnut_v"], zf1=lambda bb: ceil_at(bb) + 0.01)
        crown.curved_box("room wall head", R_GL + 4.0, R_OUT - 4.0, b - th / 2, b + th / 2, 4.2, 9.0, M["walnut_v"], zf1=lambda bb: ceil_at(bb) + 0.01)
    leather = seating.fabric("library leather", (0.22, 0.10, 0.05), "leather"); oxblood = seating.fabric("oxblood leather", (0.20, 0.04, 0.03), "leather")
    # the windows of the outer wall (as crown.wall keeps them): books on the piers between them, and above them
    lo, hi = b0 + 0.9 / R_OUT / D, b1 - 0.9 / R_OUT / D
    wins = [(a, b) for (a, b) in crown.openings(R_OUT, b0, b1) if a >= lo and b <= hi]
    def piers(c0, c1):
        out, cur = [], c0
        for (a, b) in wins:
            if b <= c0 or a >= c1: continue
            if a > cur + 0.05: out.append((cur, a))
            cur = max(cur, b)
        if c1 > cur + 0.05: out.append((cur, c1))
        return out
    for (a, b) in piers(bs0 + 0.15, bs1 - 0.15):
        books_along(M, rnd, R_OUT, a + 0.02, b - 0.02, 0.10, 3.25)
    G1, G2 = 4.6, 8.8
    books_along(M, rnd, R_OUT, bs0 + 0.15, bs1 - 0.15, 3.35, G1 - 0.25)
    books_along(M, rnd, R_OUT, bs0 + 0.15, bs1 - 0.15, G1 + 0.1, G2 - 0.25)
    books_along(M, rnd, R_OUT, bs0 + 0.15, bs1 - 0.15, G2 + 0.1, 12.7)
    for (a, b) in ((bs0 + 0.6, 302.2), (303.6, 308.6), (310.0, bs1 - 0.6)):
        books_along(M, rnd, R_GL + 0.62, a, b, 0.08, 1.10, inward=True, depth=0.4)
        crown.curved_box("low case top", R_GL + 0.6, R_GL + 1.04, a, b, 1.10, 1.14, M["walnut"])
    # the two galleries: walnut decks along the outer wall, brass rails, lit from under
    glow = lib.emission("gallery underlight", (1.0, 0.78, 0.55), 6.0); sb = 306.0; so = tang(0.6, R_OUT - 1.6)
    for GZ in (G1, G2):
        crown.curved_box("gallery deck", R_OUT - 1.62, R_OUT - 0.42, bs0 + 0.1, bs1 - 0.1, GZ - 0.22, GZ, M["walnut"])
        crown.curved_box("gallery underlight", R_OUT - 1.52, R_OUT - 1.48, bs0 + 0.2, bs1 - 0.2, GZ - 0.226, GZ - 0.221, glow)
        gap = sb if GZ == G1 else sb - tang(6.0, R_OUT - 1.6)
        for (a, b) in ((bs0 + 0.1, gap - so), (gap + so, bs1 - 0.1)):
            crown.curved_box("gallery rail", R_OUT - 1.62, R_OUT - 1.56, a, b, GZ + 1.0, GZ + 1.05, M["brass"])
            crown.curved_box("gallery kick", R_OUT - 1.62, R_OUT - 1.59, a, b, GZ, GZ + 0.12, M["brass"])
            for bb in crown.steps(a, b, 1.0 / tang(0.24, R_OUT - 1.6)):
                lib.box("gallery post", (0.025, 0.025, 1.0), at(R_OUT - 1.59, bb, GZ + 0.5), M["brass"], rot_z=face_in(bb))
        for bb in crown.steps(bs0 + 1.0, bs1 - 1.0, 1.0 / tang(5.0, R_OUT - 1.0)):
            lib.box("gallery bracket", (0.12, 1.2, 0.3), at(R_OUT - 1.02, bb, GZ - 0.37), M["bronze_dark"], rot_z=face_in(bb))
    for (bb, z0, h) in ((sb, 0.0, G1), (sb - tang(6.0, R_OUT - 1.6), G1, G2 - G1)):
        c = P(R_OUT - 2.9, bb); ang = math.atan2(math.cos(bb * D), math.sin(bb * D))
        st = pent_rooms.spiral_stair("stair", c.x, c.y, 1.15, h, M, steps=20, start=ang - 0.9 * 2 * math.pi * 19 / 20); st.location.z = z0
    # two long reading tables down the middle, with lamps and leather chairs
    for tb in (300.8, 311.4):
        tables.desk("reading table", at(RM - 1.0, tb, 0.0), face_cw(tb) + math.pi / 2, length=4.8, depth=1.3)
        for dx in (-1.6, -0.55, 0.55, 1.6):
            bb = tb + tang(dx)
            seating.dining_chair("reading chair", at(RM - 2.05, bb, 0.0), face_out(bb), fabric_mat=leather, seed=300 + int(dx * 10))
            seating.dining_chair("reading chair", at(RM + 0.05, bb, 0.0), face_in(bb), fabric_mat=leather, seed=320 + int(dx * 10))
        for dx in (-1.1, 1.1): furn.table_lamp("reading lamp", at(RM - 1.0, tb + tang(dx), 0.79), M, watts=30, shade_r=0.15)
    lib.box("library rug", (20.0, 5.0, 0.014), at(RM - 1.0, sb, 0.007), M["rug2"], bevel=0.006, rot_z=face_cw(sb) + math.pi / 2)
    # by the windows: two leather sofas, club chairs, drums; palms
    for k, bb in enumerate((302.9, 309.3)):
        seating.sofa("library sofa", at(R_OUT - 2.6, bb, 0.0), face_out(bb), length=4.2, fabric_mat=oxblood, seed=340 + k)
        for s_ in (-1, 1):
            seating.club_chair("library chair", at(R_OUT - 1.6, bb + s_ * tang(2.6, R_OUT - 1.6), 0.0), face_in(bb) + s_ * 0.9, fabric_mat=leather, seed=350 + k * 2 + s_)
        tables.drum("library drum", at(R_OUT - 1.3, bb, 0.0), d=0.6, h=0.42)
    for k, bb in enumerate((bs0 + tang(1.6), bs1 - tang(1.6), sb + tang(0.2))):
        plants.make("kentia palm", at(R_GL + 2.4, bb, 0.0), seed=360 + k, pot=(0.95, 0.7, "black"), height=3.6)
    lights.halo("library halo", at(RM - 0.5, sb), d=7.0, z=11.5, ceiling=ceil_at(sb), watts=2000)
    # the map room: the globe of Mars under the spire's light, a long leather sofa facing it, map chests on the piers
    gb = (bs1 + b1) / 2
    mars_globe("mars globe", at(RM - 0.2, gb, 0.0), 1.5, M)
    seating.sofa("map sofa", at(RM - 0.2, gb - tang(4.4), 0.0), face_cw(gb - tang(4.4)), length=4.4, fabric_mat=leather, seed=370)
    for (a, b) in piers(bs1 + 0.3, b1 - 0.3):
        if (b - a) * D * R_OUT < 1.6: continue
        for bb in crown.steps(a + tang(0.8, R_OUT), b - tang(0.8, R_OUT), 1.0 / tang(1.6, R_OUT - 0.5)):
            lib.box("map chest", (1.5, 0.9, 0.9), at(R_OUT - 0.5, bb, 0.45), M["walnut"], bevel=0.008, rot_z=face_in(bb))
    plants.make("agave", at(R_GL + 2.0, gb, 0.0), seed=371, pot=(1.2, 0.45, "basalt"), size=0.9)
    for bb in (gb - tang(2.2), gb + tang(2.2)):
        lib.spot_light("globe light", at(RM - 0.2, bb, ceil_at(gb) - 0.1), 1200, (1.0, 0.85, 0.68), 0.05, 18, 0.4)
    # the study: Jim's day desk at the windows, a reading sofa and a club chair, books on the piers
    for (a, b) in piers(b0 + 0.3, bs0 - 0.3):
        books_along(M, rnd, R_OUT, a + 0.02, b - 0.02, 0.10, 3.25)
    books_along(M, rnd, R_OUT, b0 + 0.3, bs0 - 0.3, 3.35, 6.5)
    db = (b0 + bs0) / 2
    tables.desk("study desk", at(R_OUT - 2.2, db, 0.0), face_in(db), length=2.8, depth=1.0)
    seating.desk_chair("study chair", at(R_OUT - 3.3, db, 0.0), face_out(db) + 0.1)
    lights.alabaster_pendant("study pendant", at(R_OUT - 2.2, db - tang(0.8)), z=1.75, ceiling=ceil_at(db), watts=45)
    # the sitting group on its rug: a sofa facing the windows, two club chairs across the table from it
    lib.box("study rug", (6.4, 5.4, 0.014), at(RM - 1.0, db, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(db), segs=2)
    seating.sofa("study sofa", at(RM - 2.7, db, 0.0), face_out(db), length=4.0, fabric_mat=seating.fabric("oat boucle", (0.58, 0.52, 0.44), "boucle"), seed=380)
    tables.coffee_table("study table", at(RM - 1.05, db, 0.0), face_in(db), length=1.8, width=0.9)
    for s_ in (-1, 1):
        bb = db + s_ * tang(1.05, RM + 0.6)
        seating.club_chair("study chair", at(RM + 0.6, bb, 0.0), face_in(bb) - s_ * 0.3, fabric_mat=leather, seed=381 + s_)
    lights.arc_lamp("study arc lamp", at(RM - 3.0, db - tang(2.6, RM - 3.0), 0.0), face_cw(db) - 0.5, reach=2.2)
    plants.make("fiddle-leaf fig", at(R_OUT - 1.4, b0 + tang(1.5, R_OUT - 1.4), 0.0), seed=382, pot=(0.75, 0.62, "white"), height=2.9)
    plants.make("kentia palm", at(R_GL + 1.3, bs0 - tang(1.4, R_GL + 1.3), 0.0), seed=383, pot=(0.95, 0.72, "black"), height=3.4)
    # on the cross wall: a long walnut credenza with two lamps, Van Gogh's self-portrait over it
    tables.console("study credenza", at(RM - 1.0, b0 + tang(0.45, RM - 1.0), 0.0), face_cw(b0), length=4.2, depth=0.5, h=0.78,
                   mat=lib.wood("credenza walnut", (0.20, 0.12, 0.07), (0.10, 0.06, 0.035), 0.35))
    for s_ in (-1, 1): furn.table_lamp("credenza lamp", at(RM - 1.0 + s_ * 1.6, b0 + tang(0.45, RM - 1.0 + s_ * 1.6), 0.78), M, watts=35, shade_r=0.17)
    paint("study painting", "vangogh_self_portrait", 2.8, at(RM - 1.0, b0 + tang(0.17, RM - 1.0), 0.0), face_cw(b0), 2.65, tall=True)
    # over the opening to the map room, hung high on the walnut as in a great library: Delaunay's portrait of the
    # painter and writer Jean Metzinger
    paint("library painting", "delaunay_metzinger", 3.4, at(RM, bs1 - tang(0.17, RM), 0.0), face_ccw(bs1), 6.3, tall=True)
    paint("map room print", "claude_harbour", 1.8, at(RM + 2.2, b1 - tang(0.17, RM + 2.2), 0.0), face_ccw(b1), 1.9)      # a harbour for the room of maps
    # light: washers on the shelves at each storey, lamps on the tables
    for bb in crown.steps(bs0 + 0.5, bs1 - 0.5, 1.0 / tang(2.0, R_OUT - 2.2)):
        for (z, w) in ((G2 + 3.6, 160), (G1 - 0.3, 40), (G2 - 0.3, 60)):
            sp = lib.spot_light("shelf washer", at(R_OUT - (2.3 if z > G2 else 1.4), bb, z), w, (1.0, 0.82, 0.62), 0.03, 55, 0.7)
            sp.rotation_euler = (math.radians(32), 0, face_out(bb) + math.pi)


# ---------------------------------------------------------------- the north of the ring: the Studio, the Observatory, the Garden room
def repo_file(*parts):
    """a file of the mars-campus checkout ($MARS_REPO, or the usual places): the design plan's own pictures"""
    for p in (os.environ.get("MARS_REPO"), "/home/user/mars-campus", "/home/claude/mars-campus", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")):
        if p and os.path.exists(os.path.join(p, *parts)): return os.path.join(p, *parts)
    return None


def extra_materials(M):
    P_ = lib.principled
    M.setdefault("oak_easel", lib.wood("easel beech", (0.66, 0.50, 0.33), (0.52, 0.38, 0.24), 0.5, coat=0.05, along="Z"))
    M.setdefault("oak_top", lib.wood("worktop oak", (0.56, 0.42, 0.27), (0.40, 0.28, 0.16), 0.45, coat=0.1))
    M.setdefault("raw_canvas", lib.fabric("raw canvas", (0.72, 0.66, 0.55), 0.9, 0.2, 700, 0.15))
    M.setdefault("leather_tan", P_("tan leather", (0.26, 0.13, 0.065), 0.42, **{"Coat Weight": 0.25, "Coat Roughness": 0.2}))
    M.setdefault("graphite", P_("graphite", (0.045, 0.046, 0.05), 0.45))
    M.setdefault("pale_grey", P_("pale grey", (0.62, 0.62, 0.60), 0.4))
    M.setdefault("steel", P_("brushed steel", (0.58, 0.58, 0.6), 0.28, 1.0))
    M.setdefault("clay_wet", P_("wet clay", (0.30, 0.17, 0.10), 0.35, **{"Coat Weight": 0.2}))
    M.setdefault("greenware", P_("greenware", (0.58, 0.52, 0.45), 0.85))
    M.setdefault("white_paint", P_("white enamel", (0.80, 0.80, 0.78), 0.3))
    M.setdefault("lemon_leaf", lib.leaf("lemon leaf", (0.05, 0.12, 0.03), 0.3, 0.3))
    M.setdefault("towel", lib.fabric("towel", (0.86, 0.85, 0.82), 0.95, 0.6, 900, 0.5))
    return M


def room_wall(b, M, mat=None, opening=(R_GL + 1.4, R_OUT - 2.6), head=3.2):
    """a cross wall at bearing b between two rooms, a wide opening in the middle (as in the library)"""
    th = 0.3 / 130 / D; mat = mat or M["regolith"]
    for (r0, r1) in ((R_GL + 0.05, opening[0]), (opening[1], R_OUT)):
        crown.curved_box("room wall", r0, r1, b - th / 2, b + th / 2, 0, 9.0, mat, zf1=lambda bb: ceil_at(bb) + 0.01)
    crown.curved_box("room wall head", opening[0], opening[1], b - th / 2, b + th / 2, head, 9.0, mat, zf1=lambda bb: ceil_at(bb) + 0.01)


def image_material(name, path, emit=0.0, rough=0.35):
    """a photograph: the picture is the surface's colour (and its light, for a screen)"""
    m, nt = lib._mat(name)
    if nt is None: return m
    b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    if path and os.path.exists(path):
        t = lib._tex(nt, path); nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if emit > 0: nt.links.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = emit
    else:
        b.inputs["Base Color"].default_value = (0.3, 0.18, 0.1, 1)
    return m


def picture_quad(name, w, h, mat, crop=(0.0, 0.0, 1.0, 1.0)):
    """a w x h rectangle in the xz plane facing -y, its UVs over the crop (u0, v0, u1, v1) of the picture"""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new("UVMap")
    vs = [bm.verts.new(p) for p in ((-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2))]
    fc = bm.faces.new(vs); u0, v0, u1, v1 = crop
    for lp, (u, v) in zip(fc.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))): lp[uv].uv = (u, v)
    return lib.mesh_obj(name, bm, mat)


def framed_print(name, path, w, h, loc, rot_z, M, crop=(0.0, 0.0, 1.0, 1.0), border=0.08):
    """a photograph on a white mat in a thin black frame; it looks along its local -y"""
    g = furn.empty(name, loc, rot_z)
    im = picture_quad(name + " print", w, h, image_material(name + " image", path), crop); im.location = (0, -0.012, 0); im.parent = g
    W, H = w + 2 * border, h + 2 * border
    mt = lib.box(name + " mat", (W, 0.01, H), (0, -0.004, 0), lib.principled("print mat", (0.86, 0.85, 0.82), 0.8)); mt.parent = g
    for (sx, sz, px, pz) in ((W + 0.04, 0.02, 0, H / 2 + 0.01), (W + 0.04, 0.02, 0, -H / 2 - 0.01), (0.02, H, W / 2 + 0.01, 0), (0.02, H, -W / 2 - 0.01, 0)):
        fr = lib.box(name + " frame", (sx, 0.035, sz), (px, -0.01, pz), M["frame"]); fr.parent = g
    return g


def screen(name, path, w, h, loc, rot_z, M, crop=(0.0, 0.0, 1.0, 1.0), emit=2.2):
    """a flat screen on a foot, showing a picture; it looks along its local -y"""
    g = furn.empty(name, loc, rot_z)
    im = picture_quad(name + " image", w, h, image_material(name + " screen", path, emit, 0.15), crop); im.location = (0, -0.021, h / 2 + 0.12); im.parent = g
    bz = lib.box(name + " body", (w + 0.03, 0.04, h + 0.03), (0, 0, h / 2 + 0.12), M["graphite"], bevel=0.004); bz.parent = g
    st = lib.box(name + " stem", (0.06, 0.04, 0.14), (0, 0.04, 0.07), M["graphite"]); st.parent = g
    ft = lib.box(name + " foot", (0.32, 0.22, 0.015), (0, 0.04, 0.0075), M["graphite"], bevel=0.004); ft.parent = g
    return g


def easel(name, loc, rot_z, cw, ch, canvas_mat, M):
    """a studio easel in beech with a canvas on it; local -y is the canvas's face"""
    g = furn.empty(name, loc, rot_z); o = []; e = M["oak_easel"]
    o.append(lib.box(name + " base", (0.92, 0.1, 0.06), (0, 0.12, 0.03), e, bevel=0.006))
    o.append(lib.box(name + " foot", (0.08, 0.72, 0.06), (0, 0.12, 0.03), e, bevel=0.006))
    for x in (-0.33, 0.33): o.append(lib.box(name + " upright", (0.045, 0.045, 2.05), (x, 0.12, 1.06), e, bevel=0.004))
    o.append(lib.box(name + " mast", (0.06, 0.05, 2.3), (0, 0.15, 1.15), e, bevel=0.004))
    zl = 0.74; o.append(lib.box(name + " ledge", (0.86, 0.09, 0.035), (0, 0.05, zl), e, bevel=0.004))
    o.append(lib.box(name + " canvas", (cw, 0.03, ch), (0, 0.07, zl + 0.02 + ch / 2), canvas_mat))
    o.append(lib.box(name + " clamp", (0.12, 0.08, 0.05), (0, 0.07, zl + 0.045 + ch), e, bevel=0.004))
    for x in o: x.parent = g
    return g


def leaning_canvases(b_wall, r_mid, M, rnd, side=-1, n=4):
    """canvases leaning against a cross wall, their backs out: raw linen on stretchers"""
    for k in range(n):
        w, h = rnd.uniform(0.7, 1.4), rnd.uniform(0.6, 1.2); t = math.radians(rnd.uniform(6, 10))
        r = r_mid + rnd.uniform(-0.5, 0.5); bb = b_wall + side * tang(0.05 + 0.05 * k, r)
        g = furn.empty("canvas stack", at(r, bb, 0.0), face_in(bb) + (0 if side < 0 else math.pi))
        c = lib.box("leaning canvas", (0.025, w, h), (0, 0, 0), M["raw_canvas"]); c.parent = g
        c.location = (-(h / 2) * math.sin(t), 0, (h / 2) * math.cos(t)); c.rotation_euler = (0, t, 0)


def work_table(name, r, b, M, rnd, length=3.2, depth=1.1, h=0.9):
    """a standing work table: an oak top on walnut legs, and an artist's things on it"""
    lib.box(name + " top", (length, depth, 0.05), at(r, b, h - 0.025), M["oak_top"], bevel=0.004, rot_z=face_in(b))
    for dx in (-length / 2 + 0.1, length / 2 - 0.1):
        for dy in (-depth / 2 + 0.08, depth / 2 - 0.08):
            bb = b + tang(dx, r); lib.box(name + " leg", (0.06, 0.06, h - 0.05), at(r + dy, bb, (h - 0.05) / 2), M["walnut"], bevel=0.004, rot_z=face_in(bb))
    paints = [(0.55, 0.12, 0.05), (0.75, 0.52, 0.12), (0.08, 0.18, 0.42), (0.85, 0.82, 0.76), (0.12, 0.28, 0.16), (0.42, 0.20, 0.10), (0.02, 0.02, 0.02)]
    glassm = lib.glass("jar glass", (0.95, 0.97, 0.95))
    for k in range(3):     # jars of brushes
        jr = r + rnd.uniform(-0.35, 0.35); jb = b + tang(-1.2 + 0.9 * k + rnd.uniform(-0.2, 0.2), r)
        q = at(jr, jb, h); lib.cyl("brush jar", 0.045, 0.13, q, glassm, verts=32)
        for i in range(7):
            rx, ry = rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25)
            lib.cyl("brush", 0.0045, 0.3, (q[0], q[1], h + 0.01), M["oak_easel"], verts=8, rot=(rx, ry, 0))
    for i in range(14):    # tubes of paint lying about
        tb = b + tang(rnd.uniform(-1.4, 1.4), r); tr = r + rnd.uniform(-0.45, 0.45)
        lib.cyl("paint tube", 0.013, 0.11, at(tr, tb, h + 0.013), lib.principled("tube %d" % (i % 7), paints[i % 7], 0.35, 0.6 if i % 3 == 0 else 0.0), verts=12, rot=(math.pi / 2, 0, rnd.uniform(0, 6.28)))
    pb = b + tang(0.6, r); lib.box("palette", (0.46, 0.32, 0.008), at(r - 0.15, pb, h + 0.004), M["oak_easel"], bevel=0.002, rot_z=face_in(pb) + 0.3)
    for i in range(8):
        q = at(r - 0.15 + rnd.uniform(-0.1, 0.1), pb + tang(rnd.uniform(-0.18, 0.18), r), h + 0.009)
        lib.cyl("paint dab", rnd.uniform(0.012, 0.022), 0.006, q, lib.principled("dab %d" % (i % 7), paints[i % 7], 0.3), verts=12)
    sb = b - tang(0.5, r); lib.box("sketchbook", (0.3, 0.42, 0.016), at(r + 0.25, sb, h + 0.008), M["leather"], bevel=0.003, rot_z=face_in(sb) - 0.2)
    lib.box("rag", (0.32, 0.26, 0.025), at(r + 0.3, b + tang(1.1, r), h + 0.012), M["linen"], bevel=0.012, rot_z=face_in(b) + 0.7)


def stool(name, loc, M, h=0.68):
    g = furn.empty(name, loc)
    s = lib.cyl(name + " seat", 0.18, 0.04, (0, 0, h - 0.04), M["oak_easel"], verts=40, bevel=0.008); s.parent = g
    for k in range(3):
        a = k * 2 * math.pi / 3; lg = lib.cyl(name + " leg", 0.014, h, (0.12 * math.cos(a), 0.12 * math.sin(a), 0), M["bronze_dark"], verts=10, rot=(0.12 * math.sin(a), -0.12 * math.cos(a), 0)); lg.parent = g
    return g


def washers(b0, b1, watts=90, color=(1.0, 0.83, 0.64)):
    b = b0 + 0.6
    while b < b1 - 0.5:
        for (r, d) in ((R_IN + 0.9, -1), (R_OUT - 0.9, 1)):
            q = Vector(at(r, b, ceil_at(b) - 0.08)); tgt = Vector(at(r + d * 0.9, b, 1.2))
            sp = lib.spot_light("wall washer", tuple(q), watts, color, 0.04, 70, 0.8); sp.rotation_euler = (tgt - q).to_track_quat("-Z", "Y").to_euler()
        b += tang(3.0)


def studio(M, rnd):
    """the Studio (324 to 360), north-north-west: the art studio in the north light (C-27), the photo and print room
    (C-28), the craft room (C-29); furnished to the furnishing program: a long sofa, a daybed and club chairs facing the
    easels, Jim's big canvases on the end wall, leather chairs at the screens, a viewing sofa and chairs for the prints, a
    banquette by the potter's wheel, chosen plants; lit like the salon (the slatted ceiling, the Glide's light, washers,
    a halo over each room's work)"""
    import seating, tables, plants, lights
    extra_materials(M)
    oat = seating.fabric("studio linen", (0.62, 0.56, 0.47), "linen"); cognac = seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather")
    moss = seating.fabric("moss velvet", (0.10, 0.13, 0.08), "velvet")
    b0, b1, w1, w2 = 324.0, 360.0, 339.0, 349.0
    crown.ring_room(b0, b1, M, M["oak"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    crown.glide_lights(b0, b1)
    room_wall(w1, M)
    room_wall(w2, M, opening=(R_GL + 1.4, R_GL + 5.0))   # the print room's far wall is for prints: open only by the glass
    t = 0.15 / 130.0 / D                    # half a cross wall: things hung on a wall stand off its face
    S = imports(M)
    # C-27, the art studio: easels by the outer wall, the canvases lit across from the slots
    pal = [((0.62, 0.36, 0.20), [(0.06, 0.94, 0.08, 0.42, (0.42, 0.18, 0.09)), (0.06, 0.94, 0.55, 0.92, (0.80, 0.56, 0.36))]),
           ((0.16, 0.18, 0.24), [(0.08, 0.92, 0.10, 0.35, (0.36, 0.20, 0.13)), (0.10, 0.90, 0.62, 0.70, (0.48, 0.58, 0.82))]),
           ((0.70, 0.62, 0.50), [(0.10, 0.60, 0.15, 0.85, (0.55, 0.22, 0.10)), (0.66, 0.90, 0.15, 0.85, (0.30, 0.32, 0.30))])]
    for k, bb in enumerate((326.6, 330.4, 334.2)):
        cm = furn.painting_material("studio canvas %d" % k, *pal[k])
        easel("easel", at(R_OUT - 1.9, bb, 0.0), face_cw(bb) - 0.35, (1.0, 1.25, 0.9)[k], (1.25, 0.95, 1.15)[k], cm, M)
    lib.box("drop cloth", (8.6, 2.4, 0.004), at(R_OUT - 1.7, 330.4, 0.002), M["raw_canvas"], rot_z=face_in(330.4))
    work_table("work table", RM - 1.0, 331.0, M, rnd)
    seating.desk_chair("work chair", at(RM - 0.1, 332.4, 0.0), face_ccw(332.4) + 0.4, fabric_mat=cognac, seed=500)
    for bb in (325.2, 326.4):
        lib.box("flat file", (1.4, 0.9, 0.86), at(R_GL + 0.65, bb, 0.43), M["walnut"], bevel=0.008, rot_z=face_out(bb))
        for z in (0.2, 0.4, 0.6, 0.8): lib.box("drawer line", (1.4, 0.004, 0.006), at(R_GL + 1.102, bb, z), M["shadow"], rot_z=face_out(bb))
    leaning_canvases(w1, R_OUT - 1.3, M, rnd, side=-1, n=5)
    plants.make("bird of paradise", at(R_GL + 1.2, 337.6, 0.0), seed=501, pot=(1.0, 0.7, "bronze"), height=3.5, stems=5)
    plants.make("fiddle-leaf fig", at(R_OUT - 1.1, b0 + tang(1.3, R_OUT - 1.1), 0.0), seed=502, pot=(0.75, 0.62, "white"), height=2.6)
    plants.make("japanese maple", at(R_GL + 1.5, 333.6, 0.0), seed=511, pot=(1.4, 0.62, "basalt"), height=4.0, colour="red", stems=3)
    plants.make("kentia palm", at(R_OUT - 1.2, w1 - tang(1.4, R_OUT - 1.2), 0.0), seed=512, pot=(0.95, 0.72, "black"), height=3.4, stems=3)
    # three of Jim's big canvases on the end wall
    big = [((0.55, 0.20, 0.10), [(0.06, 0.94, 0.06, 0.48, (0.75, 0.38, 0.14)), (0.06, 0.94, 0.56, 0.94, (0.20, 0.10, 0.08))]),
           ((0.10, 0.14, 0.22), [(0.08, 0.92, 0.08, 0.30, (0.30, 0.42, 0.62)), (0.08, 0.92, 0.38, 0.92, (0.06, 0.08, 0.12))]),
           ((0.74, 0.66, 0.52), [(0.10, 0.90, 0.10, 0.55, (0.62, 0.48, 0.30)), (0.10, 0.90, 0.62, 0.90, (0.85, 0.80, 0.68))])]
    for k, (r, w, h) in enumerate(((122.6, 2.4, 1.8), (127.2, 2.0, 2.8), (131.8, 2.4, 1.8))):
        lib.box("wall canvas", (w, 0.04, h), at(r, b0 + t + tang(0.03, r), 1.2 + h / 2), furn.painting_material("studio wall canvas %d" % k, *big[k]), rot_z=face_cw(b0))
    # a sculpture corner between the work table and the print room: white plinths with pieces in bronze and marble
    marble_w = seating.stone("studio marble", (0.88, 0.86, 0.82), (0.55, 0.53, 0.50), "marble", 0.15)
    pieces = [[(0.0, 0.0), (0.16, 0.0), (0.2, 0.2), (0.12, 0.55), (0.05, 0.95), (0.09, 1.05), (0.0, 1.1)],
              [(0.0, 0.0), (0.24, 0.0), (0.3, 0.12), (0.26, 0.3), (0.12, 0.42), (0.0, 0.45)],
              [(0.0, 0.0), (0.05, 0.0), (0.035, 0.6), (0.06, 1.3), (0.02, 1.6), (0.0, 1.62)]]
    for k, (r, bb, h) in enumerate(((RM + 1.6, 335.2, 1.0), (RM - 0.6, 336.0, 0.8), (RM + 3.2, 336.4, 0.6))):
        lib.box("plinth", (0.6, 0.6, h), at(r, bb, h / 2), M["white_wall"] if "white_wall" in M else M["porcelain"], bevel=0.004, rot_z=face_in(bb))
        furn.lathe("sculpture", pieces[k], (M["bronze"], marble_w, M["bronze"])[k], 64, at(r, bb, h))
    lights.globes("sculpture globes", at(RM + 1.2, 335.9), n=5, spread=0.9, low=3.0, high=3.8, ceiling=ceil_at(335.9), watts=45, seed=15)
    # where Jim sits back to look at the work: a sofa and a chair facing the easels on a rug, a low table of art books;
    # a still life set up on a small table by the easels
    sb = 330.0
    lib.box("studio rug", (7.2, 5.0, 0.014), at(R_GL + 3.2, sb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(sb), segs=2)
    seating.sofa("studio sofa", at(R_GL + 1.8, sb, 0.0), face_out(sb), length=5.2, fabric_mat=oat, seed=503)
    seating.daybed("studio daybed", at(R_GL + 3.7, sb + tang(3.3, R_GL + 3.7), 0.0), face_ccw(sb) + 0.35, length=2.3, width=1.1, fabric_mat=cognac, seed=504)
    for k, (r, d) in enumerate(((R_GL + 3.3, 3.1), (R_GL + 4.7, 2.6))):
        bb = sb - tang(d, r); seating.club_chair("studio club chair", at(r, bb, 0.0), face_cw(bb) - 0.5 + 0.35 * k, fabric_mat=moss, seed=513 + k)
    tables.coffee_table("studio table", at(R_GL + 3.3, sb, 0.0), face_in(sb), length=2.2, width=1.0, kind="stack")
    lights.globes("studio globes", at(R_GL + 3.2, sb), n=9, spread=0.8, low=3.0, high=4.2, ceiling=ceil_at(sb), watts=50, seed=14)
    for k in range(4):
        q = at(R_GL + 3.25, sb + tang(-0.25 + 0.03 * k, R_GL + 3.25), 0.37 + 0.035 * k)
        lib.box("art book", (0.32, 0.24, 0.032), q, (M["ceramics"] + [M["walnut"]])[k % 4], bevel=0.004, rot_z=face_in(sb) + rnd.uniform(-0.2, 0.2))
    st = 332.4; q = at(R_OUT - 3.0, st, 0.0)
    lib.box("still life table", (0.8, 0.6, 0.78), (q[0], q[1], 0.39), M["raw_canvas"], bevel=0.01, rot_z=face_in(st))
    lib.instance_of(S["vase"], (q[0], q[1], 0.78), 0.4, 1.5, name="still life flowers")
    dish = lib.import_glb(os.path.join(A, "IridescentDishWithOlives.glb"), (q[0] + 0.2, q[1] - 0.12, 0.78), 0.3, 1.0, name="still life dish")
    for bb in (326.6, 330.4, 334.2):       # daylight spots on the canvases
        q = Vector(at(RM - 0.6, bb + tang(1.2), ceil_at(bb) - 0.25)); tg = Vector(at(R_OUT - 1.9, bb, 1.5))
        sp = lib.spot_light("canvas light", tuple(q), 300, (1.0, 0.95, 0.88), 0.04, 32, 0.6); sp.rotation_euler = (tg - q).to_track_quat("-Z", "Y").to_euler()
    # C-28, photographs: a wide printer, a light table, a counter of screens, Jim's prints of Mars on the walls
    lib.box("printer", (1.75, 0.66, 0.5), at(RM - 1.4, 341.6, 0.83), M["graphite"], bevel=0.01, rot_z=face_in(341.6))
    lib.box("printer top", (1.7, 0.4, 0.05), at(RM - 1.5, 341.6, 1.105), M["pale_grey"], bevel=0.006, rot_z=face_in(341.6))
    for dx in (-0.7, 0.7):
        bb = 341.6 + tang(dx); lib.box("printer stand", (0.06, 0.6, 0.58), at(RM - 1.4, bb, 0.29), M["graphite"], rot_z=face_in(bb))
    lib.cyl("paper roll", 0.07, 1.55, at(RM - 1.15, 341.6 - tang(0.775), 0.95), M["porcelain"], verts=32, rot=(0, math.pi / 2, face_in(341.6)))
    po = picture_quad("print out", 1.1, 0.55, image_material("print paper", repo_file("palace", "design", "img", "flight-dunes.jpg"), 0.0, 0.6)); po.location = at(RM - 1.75, 341.6, 0.52); po.rotation_euler = (0, 0, face_in(341.6))
    lt = 345.0
    lib.box("light table", (1.5, 0.95, 0.82), at(RM, lt, 0.41), M["walnut"], bevel=0.008, rot_z=face_in(lt))
    lib.box("light table top", (1.4, 0.85, 0.02), at(RM, lt, 0.83), lib.emission("light table glow", (0.95, 0.97, 1.0), 4.0), rot_z=face_in(lt))
    for i in range(5):
        q = at(RM + rnd.uniform(-0.3, 0.3), lt + tang(rnd.uniform(-0.55, 0.55)), 0.845)
        lib.box("slide", (0.05, 0.05, 0.003), q, lib.principled("slide", (0.2, 0.12, 0.08), 0.3), rot_z=rnd.uniform(0, 1))
    crown.curved_box("counter", R_OUT - 0.65, R_OUT - 0.05, 340.0, 348.2, 0.0, 0.88, M["walnut"])
    crown.curved_box("counter top", R_OUT - 0.7, R_OUT - 0.05, 340.0, 348.2, 0.88, 0.915, M["marble"])
    for (bb, img) in ((342.6, "crown-sunset.jpg"), (345.6, "flight-crater.jpg")):
        screen("screen", repo_file("palace", "design", "img", img), 0.72, 0.42, at(R_OUT - 0.42, bb, 0.915), face_in(bb), M)
        seating.desk_chair("screen chair", at(R_OUT - 1.25, bb, 0.0), face_out(bb), fabric_mat=cognac, seed=505 + int(bb))
    # a plan chest in the middle, prints laid out on it to choose from
    pc = 343.4
    lib.box("plan chest", (3.6, 1.2, 0.9), at(RM + 2.4, pc, 0.45), M["walnut"], bevel=0.008, rot_z=face_in(pc))
    for z in (0.2, 0.42, 0.64): lib.box("plan drawer line", (3.5, 1.21, 0.006), at(RM + 2.4, pc, z), M["shadow"], rot_z=face_in(pc))
    for k, img in enumerate(("flight-dunes.jpg", "crown-sunset.jpg", "flight-crater.jpg")):
        bb = pc + tang(-1.15 + 1.15 * k, RM + 2.4)
        po = picture_quad("laid print", 0.9, 0.6, image_material("laid print %d" % k, repo_file("palace", "design", "img", img), 0.0, 0.6))
        po.location = at(RM + 2.4, bb, 0.905); po.rotation_euler = (-math.pi / 2, 0, face_in(bb) + rnd.uniform(-0.12, 0.12))
    lib.box("print rug", (6.0, 4.6, 0.014), at(131.0, 346.6, 0.007), M["rug"], bevel=0.006, rot_z=face_in(346.6), segs=2)
    # the viewing sofa, facing Jim's prints on the cross wall
    seating.sofa("print sofa", at(130.6, 346.9, 0.0), face_cw(346.9), length=4.0, fabric_mat=oat, seed=507)
    framed_print("print", repo_file("palace", "design", "img", "crown-garden.jpg"), 3.2, 1.8, at(130.2, w2 - t - tang(0.03, 130.2), 2.0), face_ccw(w2), M)
    for (r, img, w, h) in ((R_OUT - 1.2, "flight-cliffs.jpg", 1.6, 0.9), (126.2, "port-aerial.jpg", 1.6, 0.9)):
        framed_print("print", repo_file("palace", "design", "img", img), w, h, at(r, w2 - t - tang(0.03, r), 1.75), face_ccw(w2), M)
    framed_print("print", repo_file("palace", "design", "img", "flight-west.jpg"), 1.8, 1.0, at(R_OUT - 1.3, w1 + t + tang(0.03, R_OUT - 1.3), 1.8), face_cw(w1), M)
    for k, (r, d) in enumerate(((128.6, 2.6), (132.6, 2.6))):
        bb = 346.9 - tang(0.2, r); seating.club_chair("print chair", at(r, bb, 0.0), face_cw(bb) + (0.35 if k == 0 else -0.35), fabric_mat=moss, seed=520 + k)
    plants.make("ginkgo", at(R_GL + 2.0, w2 - tang(1.6, R_GL + 2.0), 0.0), seed=522, pot=(1.2, 0.62, "basalt"), height=3.8, colour="gold")
    plants.make("kentia palm", at(R_GL + 1.6, w1 + tang(1.3, R_GL + 1.6), 0.0), seed=523, pot=(0.9, 0.7, "black"), height=3.2, stems=3)
    lights.halo("print halo", at(RM, 344.0), d=5.0, z=5.6, ceiling=ceil_at(344.0), watts=1100, color=(1.0, 0.93, 0.84))
    # C-29, crafts: the potter's wheel, the kiln, shelves of pots, a bench for models and repairs
    wb = 352.2
    lib.box("wheel body", (0.62, 0.55, 0.42), at(RM, wb, 0.21), M["pale_grey"], bevel=0.02, rot_z=face_in(wb))
    pan = furn.lathe("splash pan", [(0.05, 0.42), (0.34, 0.42), (0.36, 0.5), (0.33, 0.5), (0.31, 0.44), (0.05, 0.44)], M["pale_grey"], 64, at(RM, wb, 0.0))
    lib.cyl("wheel head", 0.17, 0.03, at(RM, wb, 0.44), M["steel"], verts=48)
    furn.lathe("pot on the wheel", [(0.0, 0.0), (0.09, 0.0), (0.12, 0.06), (0.11, 0.16), (0.075, 0.24), (0.08, 0.27), (0.07, 0.27), (0.065, 0.24), (0.1, 0.16), (0.11, 0.06), (0.0, 0.01)], M["clay_wet"], 48, at(RM, wb, 0.47))
    seating.ottoman("wheel seat", at(RM - 0.85, wb, 0.0), d=0.56, h=0.5, fabric_mat=cognac, seed=508)
    seating.sofa("craft banquette", at(R_GL + 1.75, 358.0, 0.0), face_out(358.0), length=3.4, depth=1.0, fabric_mat=cognac, arms=False, seed=509)
    kb = 357.6
    lib.cyl("kiln", 0.42, 0.82, at(R_OUT - 0.8, kb, 0.0), M["steel"], verts=64)
    lib.cyl("kiln lid", 0.44, 0.07, at(R_OUT - 0.8, kb, 0.82), M["steel"], verts=64, bevel=0.01)
    lib.box("kiln control", (0.26, 0.1, 0.32), at(R_OUT - 1.27, kb, 0.5), M["graphite"], bevel=0.006, rot_z=face_in(kb))
    s0, s1 = 350.3, 356.0
    for z in (0.45, 0.95, 1.45, 1.95): crown.curved_box("pot shelf", R_OUT - 0.45, R_OUT - 0.05, s0, s1, z - 0.03, z, M["walnut"])
    for bb in crown.steps(s0, s1, 1.0 / tang(1.3, R_OUT - 0.25)):
        crown.curved_box("shelf upright", R_OUT - 0.45, R_OUT - 0.05, bb - tang(0.02, R_OUT), bb + tang(0.02, R_OUT), 0.0, 2.0, M["walnut"])
    for z in (0.45, 0.95, 1.45, 1.95):
        bb = s0 + tang(0.25, R_OUT)
        while bb < s1 - tang(0.2, R_OUT):
            q = at(R_OUT - 0.25, bb); furn.ornament("pot", q[0], q[1], z, rnd.uniform(0.14, 0.3), rnd, M["ceramics"] + [M["greenware"]])
            bb += tang(rnd.uniform(0.24, 0.42), R_OUT)
    crown.curved_box("bench top", R_GL + 0.45, R_GL + 1.3, 352.6, 356.4, 0.86, 0.91, M["oak_top"])
    for bb in (352.8, 356.2):
        crown.curved_box("bench leg", R_GL + 0.5, R_GL + 1.25, bb - tang(0.03, R_GL + 1), bb + tang(0.03, R_GL + 1), 0.0, 0.86, M["walnut"])
    rk = at(R_GL + 0.85, 354.0, 0.91)       # a model rocket on a stand, half painted
    lib.cyl("rocket stand", 0.08, 0.02, rk, M["walnut"], verts=32)
    lib.cyl("rocket body", 0.035, 0.52, (rk[0], rk[1], rk[2] + 0.02), M["white_paint"], verts=32)
    lib.cyl("rocket nose", 0.035, 0.14, (rk[0], rk[1], rk[2] + 0.54), M["white_paint"], verts=32, r2=0.0)
    for k in range(3):
        a = k * 2 * math.pi / 3; lib.box("rocket fin", (0.004, 0.07, 0.1), (rk[0] + 0.05 * math.cos(a), rk[1] + 0.05 * math.sin(a), rk[2] + 0.07), M["bronze"], rot_z=a + math.pi / 2)
    lib.box("vise", (0.16, 0.12, 0.1), at(R_GL + 0.7, 355.4, 0.96), M["graphite"], bevel=0.01, rot_z=face_out(355.4))
    furn.table_lamp("bench lamp", at(R_GL + 0.6, 353.2, 0.91), M, watts=30, shade_r=0.14)
    crown.curved_box("greenware board", RM - 0.5, RM + 0.5, 354.2, 356.6, 0.74, 0.78, M["oak_top"])
    for bb in (354.4, 356.4):
        crown.curved_box("board trestle", RM - 0.4, RM + 0.4, bb - tang(0.03), bb + tang(0.03), 0.0, 0.74, M["walnut"])
    bb = 354.45
    while bb < 356.4:
        q = at(RM + rnd.uniform(-0.3, 0.3), bb); furn.ornament("drying pot", q[0], q[1], 0.78, rnd.uniform(0.12, 0.26), rnd, [M["greenware"]])
        bb += tang(rnd.uniform(0.22, 0.34))
    plants.make("olive", at(R_OUT - 1.4, 358.5, 0.0), seed=510, pot=(1.1, 0.8, "terracotta"), height=3.0, stems=2)
    plants.make("lemon", at(RM + 1.6, 358.7, 0.0), seed=524, pot=(1.0, 0.75, "terracotta"), height=2.4)
    work_table("craft table", RM + 2.6, 354.2, M, rnd, length=3.8, depth=1.4)
    lights.halo("craft halo", at(RM, 353.6), d=5.0, z=5.6, ceiling=ceil_at(353.6), watts=1100)
    lights.halo("studio halo", at(RM - 1.0, 331.0), d=7.0, z=6.5, ceiling=ceil_at(331.0), watts=2000, color=(1.0, 0.93, 0.84))
    for bc in (326.0, 331.0, 336.0, 341.5, 346.5, 351.5, 356.5):
        for r in (RM - 1.5, RM + 1.3):
            lib.spot_light("downlight", at(r, bc, ceil_at(bc) - 0.06), 150, (1.0, 0.9, 0.78), 0.03, 50, 0.5)
    washers(b0, b1, 200)


def star_chair(name, loc, rot_z, M):
    """a reclining chair for the stars: a walnut frame and a tan leather pad, its back laid low; local -y is the foot"""
    P = furn.empty(name, loc, rot_z); parts = []
    for x in (-0.31, 0.31):
        parts.append(lib.box(name + " rail", (0.045, 1.95, 0.05), (x, 0, 0.28), M["walnut"], bevel=0.008))
        for y in (-0.82, 0.82): parts.append(lib.box(name + " leg", (0.05, 0.05, 0.28), (x, y, 0.14), M["walnut"], bevel=0.006))
    parts.append(lib.box(name + " seat", (0.66, 0.92, 0.1), (0, -0.06, 0.36), M["leather_tan"], bevel=0.04, segs=4))
    ft = lib.box(name + " footrest", (0.66, 0.62, 0.09), (0, 0, 0), M["leather_tan"], bevel=0.04, segs=4); ft.location = (0, -0.8, 0.37); ft.rotation_euler = (math.radians(-6), 0, 0); parts.append(ft)
    bk = lib.box(name + " back", (0.66, 0.86, 0.1), (0, 0, 0), M["leather_tan"], bevel=0.04, segs=4); bk.location = (0, 0.74, 0.57); bk.rotation_euler = (math.radians(27), 0, 0); parts.append(bk)
    pw = furn.cushion(name + " pillow", (0.42, 0.12, 0.2), (0, 1.04, 0.78), (math.radians(27 - 90), 0, 0), M["linen"]); parts.append(pw)
    for o in parts: o.parent = P
    return P


def night_sky(strength=1.0, seed=3.7):
    """the sky of a Mars night: nearly black, a faint glow of dust low down, thousands of stars and the Milky Way"""
    w = bpy.context.scene.world; nt = w.node_tree; N = nt.nodes; L = nt.links
    for n in list(N):
        if n.type not in ("BACKGROUND", "OUTPUT_WORLD"): N.remove(n)
    bg = N["Background"]; bg.inputs["Strength"].default_value = strength
    def m(op, a, b=None): return lib._math(nt, op, a, b)
    tc = N.new("ShaderNodeTexCoord"); nrm = N.new("ShaderNodeVectorMath"); nrm.operation = "NORMALIZE"; L.new(tc.outputs["Generated"], nrm.inputs[0])
    sep = N.new("ShaderNodeSeparateXYZ"); L.new(nrm.outputs[0], sep.inputs[0])
    def mix_add(a, b_col, fac):
        x = N.new("ShaderNodeMix"); x.data_type = "RGBA"; x.blend_type = "ADD"; L.new(fac, x.inputs["Factor"])
        if isinstance(a, tuple): x.inputs[6].default_value = a
        else: L.new(a, x.inputs[6])
        if isinstance(b_col, tuple): x.inputs[7].default_value = b_col
        else: L.new(b_col, x.inputs[7])
        return x.outputs[2]
    hz = m("POWER", m("MAXIMUM", m("SUBTRACT", 1.0, m("ABSOLUTE", sep.outputs[2])), 0.0), 8.0)
    col = mix_add((0.0007, 0.0009, 0.0016, 1), (0.010, 0.006, 0.003, 1), hz)
    # the Milky Way: a band round a great circle, clumped by noise
    pole = Vector((0.35, -0.55, 0.76)).normalized()
    dp = N.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; L.new(nrm.outputs[0], dp.inputs[0]); dp.inputs[1].default_value = tuple(pole)
    band = m("EXPONENT", m("MULTIPLY", m("POWER", m("DIVIDE", dp.outputs["Value"], 0.2), 2.0), -1.0))
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 5.0; nz.inputs["Detail"].default_value = 10; L.new(nrm.outputs[0], nz.inputs["Vector"])
    col = mix_add(col, (0.05, 0.045, 0.04, 1), m("MULTIPLY", band, m("POWER", nz.outputs["Fac"], 3.0)))
    # stars, two layers: many faint, a few bright; each a little blue, white or orange
    for (scale, size, gain, off) in ((90.0, 0.11, 900.0, 0.0), (260.0, 0.14, 160.0, seed)):
        v = N.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = scale
        ad = N.new("ShaderNodeVectorMath"); ad.operation = "ADD"; L.new(nrm.outputs[0], ad.inputs[0]); ad.inputs[1].default_value = (off, off * 0.7, off * 1.3); L.new(ad.outputs[0], v.inputs["Vector"])
        core = m("POWER", m("MAXIMUM", m("SUBTRACT", 1.0, m("DIVIDE", v.outputs["Distance"], size)), 0.0), 3.0)
        sc = N.new("ShaderNodeSeparateColor"); L.new(v.outputs["Color"], sc.inputs[0])
        bright = m("MULTIPLY", m("POWER", sc.outputs[0], 12.0), gain)
        tint = N.new("ShaderNodeMix"); tint.data_type = "RGBA"; L.new(sc.outputs[1], tint.inputs["Factor"]); tint.inputs[6].default_value = (0.72, 0.82, 1.0, 1); tint.inputs[7].default_value = (1.0, 0.86, 0.68, 1)
        col = mix_add(col, tint.outputs[2], m("MULTIPLY", core, bright))
    L.new(col, bg.inputs["Color"])


def night(R, M):
    """turn the outside to night: no sun, the night sky, the far side of the ring with its rooms' slots lit"""
    for o in list(bpy.data.objects):
        if o.type == "LIGHT" and o.data.type == "SUN": bpy.data.objects.remove(o)
    night_sky()
    glow = lib.emission("far slot glow", (1.0, 0.76, 0.5), 7.0)
    lo, hi = R["span"][0] - 1.0, R["span"][1] + 1.0
    for (a, b) in crown.openings(R_IN - 0.62, hi, lo + 360.0):
        crown.curved_box("far slot", R_IN - 0.63, R_IN - 0.61, a, b, crown.Z0, crown.Z1, glow)
    cove = bpy.data.materials.get("cove glow")
    if cove: cove.node_tree.nodes["Emission"].inputs["Strength"].default_value = 6.0


DAY = {"on": True}         # set by build(): the room drawn by day or at night (the star lounge's glass dark or clear)


def observatory(M, rnd):
    """the Observatory under its spire (0 to 36; revision H: 20 m tall in the middle). The star lounge (C-30): its
    outer and inner walls are switchable glass from the floor to the ceiling, dark by day at the touch of the switch
    by its door, clear at night for the stars; round daybeds for two laid back to the sky along the outer glass, a
    velvet crescent sofa in the middle, kentia palms as silhouettes. The telescope room (C-31) with its screens; the
    telescope dome (C-32) is upstairs, by the portal"""
    import seating, tables, lights, plants
    extra_materials(M)
    b0, b1, w1 = 0.0, 36.0, 24.0
    state = "dark" if DAY["on"] else "clear"
    crown.ring_room(b0, b1, M, M["basalt"], part_walls=False, walls=False)
    crown.wall("inner wall", R_IN, -1, w1, b1 + crown.PAD, M, M["regolith"]); crown.wall("outer wall", R_OUT, 1, w1, b1 + crown.PAD, M, M["regolith"])
    crown.partition(b0, M); crown.partition(b1, M)
    for (r, nm) in ((R_IN - 0.1, "star glass in"), (R_OUT + 0.1, "star glass out")):
        crown.glass_wall(nm, r, b0 - crown.PAD, w1, M, state=state, upper=state, panel=3.2)
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    room_wall(w1, M)
    # the switch for the glass, by the door to the telescope room: a bronze plate, its button lit
    q = at(R_GL + 1.1, w1 - tang(0.2, R_GL + 1.1), 1.25)
    lib.box("glass switch", (0.09, 0.02, 0.14), q, M["bronze"], bevel=0.004, rot_z=face_cw(w1))
    lib.cyl("glass switch button", 0.012, 0.006, (q[0], q[1], q[2] - 0.02), lib.emission("switch glow", (1.0, 0.75, 0.45), 6.0), verts=24)
    # the daybeds along the outer glass, facing it; drums with candles between them
    for k, bc in enumerate((3.6, 8.6, 13.6, 18.6)):
        seating.round_daybed("star daybed", at(R_OUT - 2.3, bc, 0.0), face_out(bc), d=2.3, fabric_mat=seating.fabric("night velvet", (0.10, 0.085, 0.075), "velvet"), seed=40 + k)
        q = at(R_OUT - 2.0, bc + tang(1.9, R_OUT - 2.0), 0.0); tables.drum("star drum", q, d=0.46, h=0.42)
        lib.cyl("candle", 0.035, 0.1, (q[0], q[1], 0.42), lib.emission("candle wax", (1.0, 0.72, 0.42), 1.5), verts=24)
        lib.point_light("candle light", (q[0], q[1], 0.55), 5.0, (1.0, 0.62, 0.32), 0.03)
    # the crescent sofa in the middle, facing the outer glass, round a low table
    sb = 11.1
    seating.crescent("star crescent", at(RM - 1.2, sb, 0.0), face_out(sb), radius=3.6, length=8.4, fabric_mat=seating.fabric("night velvet", (0.10, 0.085, 0.075), "velvet"), seed=44)
    tables.coffee_table("star table", at(RM + 1.6, sb, 0.0), 0.0, length=1.6, kind="round", mat=seating.stone("basalt table", (0.05, 0.05, 0.055), (0.12, 0.12, 0.13), "basalt", 0.2))
    lib.box("star rug", (9.0, 7.0, 0.014), at(RM + 0.6, sb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(sb), segs=2)
    for bc, seed in ((1.6, 51), (22.2, 52)):
        plants.make("kentia palm", at(R_GL + 2.2, bc, 0.0), seed=seed, pot=(0.95, 0.7, "black"), height=3.6)
    if DAY["on"]:                              # by day the room has its lamps on behind the dark glass
        lights.globes("star globes", at(RM + 1.6, sb), n=9, spread=0.7, low=2.2, high=3.4, ceiling=ceil_at(sb), watts=60)
        for bc in (6.1, 16.1): furn.floor_lamp("floor lamp", at(R_OUT - 3.4, bc, 0.0), M, (1.0, 0.70, 0.45), watts=60)
    else:
        for bc in (6.1, 16.1): furn.floor_lamp("floor lamp", at(R_OUT - 3.4, bc, 0.0), M, (1.0, 0.62, 0.34), watts=12)
        glow = lib.emission("glass foot glow", (1.0, 0.66, 0.38), 3.0)          # a line of light along the foot of the glass
        for r in (R_OUT - 0.25, R_GL + 0.25):
            crown.curved_box("glass foot light", r - 0.02, r + 0.02, b0, w1 - 0.3, 0.0, 0.015, glow)
    # the telescope room: a long desk of screens on the outer wall, leather chairs, the portal up to the dome
    S = imports(M)
    crown.curved_box("desk", R_OUT - 1.2, R_OUT - 0.4, 25.0, 34.6, 0.72, 0.76, M["walnut"])
    for bb in (25.3, 29.8, 34.3):
        crown.curved_box("desk pedestal", R_OUT - 1.1, R_OUT - 0.5, bb - tang(0.25, R_OUT), bb + tang(0.25, R_OUT), 0.0, 0.72, M["walnut"])
    for (bb, img, crop) in ((27.0, "mars-earth.jpg", (0.0, 0.0, 1.0, 1.0)), (29.8, "orb-universe.jpg", (0.22, 0.18, 0.78, 0.92)), (32.6, "atlas-teaser.jpg", (0.0, 0.0, 1.0, 1.0))):
        screen("telescope screen", repo_file("palace", "design", "img", img), 1.2, 0.68, at(R_OUT - 0.7, bb, 0.76), face_in(bb), M, crop, emit=1.4)
        seating.desk_chair("telescope chair", at(R_OUT - 1.8, bb, 0.0), face_out(bb), seed=60 + int(bb))
    portal(RM - 0.4, b1 - 0.7, M, face_ccw(b1 - 0.7))
    for bb in (26.5, 30.0, 33.5):
        lib.spot_light("desk light", at(R_OUT - 1.0, bb, ceil_at(bb) - 0.1), 900, (1.0, 0.8, 0.6), 0.03, 20, 0.5)
        lights.alabaster_pendant("desk pendant", at(R_OUT - 1.25, bb), z=1.95, ceiling=ceil_at(bb), d=0.28, h=0.4, watts=40)
    # a sofa facing the screens for watching what the telescope sees, a low table, a kentia palm
    seating.sofa("telescope sofa", at(RM - 1.2, 29.8, 0.0), face_out(29.8), length=4.4, fabric_mat=seating.fabric("ink velvet", (0.06, 0.08, 0.13), "velvet"), seed=66)
    tables.coffee_table("telescope table", at(RM + 0.5, 29.8, 0.0), face_in(29.8), length=2.0, width=0.9, kind="stack")
    plants.make("kentia palm", at(R_GL + 1.2, 33.8, 0.0), seed=67, pot=(0.95, 0.72, "black"), height=3.2)
    washers(w1, b1, 60, (1.0, 0.72, 0.45))


def gravel_material():
    """the sky garden's gravel: pebbles about 2 cm across, each its own grey or buff, dark in the gaps between them,
    rounded in the bump"""
    m, nt = lib._mat("garden gravel")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.82
    tc = N.new("ShaderNodeTexCoord")
    v = N.new("ShaderNodeTexVoronoi"); v.voronoi_dimensions = "3D"; v.inputs["Scale"].default_value = 42.0; v.inputs["Randomness"].default_value = 0.9; L.new(tc.outputs["Object"], v.inputs["Vector"])
    e = N.new("ShaderNodeTexVoronoi"); e.voronoi_dimensions = "3D"; e.feature = "DISTANCE_TO_EDGE"; e.inputs["Scale"].default_value = 42.0; e.inputs["Randomness"].default_value = 0.9; L.new(tc.outputs["Object"], e.inputs["Vector"])
    sep = N.new("ShaderNodeSeparateColor"); L.new(v.outputs["Color"], sep.inputs["Color"])
    pal = N.new("ShaderNodeValToRGB"); E = pal.color_ramp.elements
    E[0].position = 0.0; E[0].color = (0.20, 0.19, 0.18, 1); E[1].position = 1.0; E[1].color = (0.66, 0.62, 0.55, 1)
    x = E.new(0.45); x.color = (0.40, 0.38, 0.35, 1); x2 = E.new(0.8); x2.color = (0.52, 0.46, 0.38, 1)
    L.new(sep.outputs[0], pal.inputs["Fac"])
    gap = N.new("ShaderNodeMapRange"); gap.inputs["From Min"].default_value = 0.0; gap.inputs["From Max"].default_value = 0.12; gap.inputs["To Min"].default_value = 0.35; gap.inputs["To Max"].default_value = 1.0
    L.new(e.outputs["Distance"], gap.inputs["Value"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; L.new(pal.outputs["Color"], mx.inputs[6])
    cmb = N.new("ShaderNodeCombineColor"); L.new(gap.outputs["Result"], cmb.inputs[0]); L.new(gap.outputs["Result"], cmb.inputs[1]); L.new(gap.outputs["Result"], cmb.inputs[2]); L.new(cmb.outputs[0], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    dome = N.new("ShaderNodeMapRange"); dome.inputs["From Min"].default_value = 0.0; dome.inputs["From Max"].default_value = 0.25; L.new(e.outputs["Distance"], dome.inputs["Value"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.9; bm.inputs["Distance"].default_value = 0.006; L.new(lib._math(nt, "SQRT", dome.outputs["Result"]), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def herb_bed(name, r0, r1, b0, b1, z, M, rnd, density=5.5):
    """a bed of herbs and flowers: rounded clumps of small leaves (basil green, sage grey, rosemary dark), some in flower"""
    import atrium
    kinds = [("basil", (0.10, 0.24, 0.05), 0.05, 0.03), ("sage", (0.22, 0.26, 0.19), 0.055, 0.022), ("rosemary", (0.06, 0.11, 0.06), 0.04, 0.007), ("thyme", (0.12, 0.17, 0.08), 0.018, 0.01)]
    flowers = [("lavender", (0.32, 0.22, 0.55)), ("marigold", (0.85, 0.42, 0.04)), ("daisy", (0.86, 0.85, 0.80)), ("poppy", (0.62, 0.08, 0.05))]
    pts = {k[0]: [] for k in kinds}; fl = {f[0]: [] for f in flowers}
    area = (r1 - r0) * (b1 - b0) * D * (r0 + r1) / 2; n = int(area * density)
    for i in range(n):
        r = rnd.uniform(r0 + 0.12, r1 - 0.12); b = rnd.uniform(b0 + tang(0.12, r), b1 - tang(0.12, r)); c = Vector(at(r, b, z))
        kd = rnd.choice(kinds); rr = rnd.uniform(0.14, 0.28); hh = rnd.uniform(0.18, 0.45)
        for j in range(int(rr * rr * 9000)):
            a = rnd.uniform(0, 2 * math.pi); d = rr * math.sqrt(rnd.random()); t = d / rr
            pts[kd[0]].append(c + Vector((d * math.cos(a), d * math.sin(a), hh * math.sqrt(max(0.0, 1 - t * t)) * rnd.uniform(0.6, 1.0))))
        if rnd.random() < 0.45:
            fk = rnd.choice(flowers)
            for j in range(rnd.randint(8, 22)):
                a = rnd.uniform(0, 2 * math.pi); d = rr * 0.8 * math.sqrt(rnd.random())
                fl[fk[0]].append(c + Vector((d * math.cos(a), d * math.sin(a), hh + rnd.uniform(0.0, 0.12))))
    for (k, col, ln, wd) in kinds:
        if not pts[k]: continue
        lo = bpy.data.objects.get(k + " leaf") or atrium.leaf_object(k + " leaf", ln, wd, lib.leaf(k + " leaf", col, 0.3, 0.5))
        me = bpy.data.meshes.new(name + " " + k); me.from_pydata([tuple(p) for p in pts[k]], [], []); ob = lib.link(bpy.data.objects.new(name + " " + k, me))
        atrium.scatter_leaves(ob, lo, k + " leaves", 0.7, 1.3)
    for (k, col) in flowers:
        if not fl[k]: continue
        fo = bpy.data.objects.get(k + " flower") or atrium.leaf_object(k + " flower", 0.03, 0.03, lib.principled(k + " petals", col, 0.5, **{"Sheen Weight": 0.3}))
        me = bpy.data.meshes.new(name + " " + k); me.from_pydata([tuple(p) for p in fl[k]], [], []); ob = lib.link(bpy.data.objects.new(name + " " + k, me))
        atrium.scatter_leaves(ob, fo, k + " flowers", 0.8, 1.2)


def garden_room(M, rnd):
    """the Garden room (36 to 72), north-east, at sunrise: the breakfast room (C-33) in the light of the east slots and
    the sky garden (C-34), beds of herbs and flowers under small lemon and olive trees"""
    extra_materials(M)
    b0, b1, w1 = 36.0, 72.0, 48.0
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - crown.PAD, w1, M)
    crown.sector("breakfast floor", R_GL + 0.05, R_OUT, b0 - crown.PAD, w1, 0.004, M["oak"])        # oak in the breakfast room
    room_wall(w1, M)
    S = imports(M)
    # C-33, breakfast (furnishing.py): a round oak table 2.4 m across for eight in upholstered chairs under a cluster
    # of opal globes; a long banquette along the sunrise windows with its own table; the sideboard with the coffee;
    # lemons in terracotta, orchids, an olive; Van Gogh's thatched cottages in the sun on the cross wall
    import seating, tables, lights, plants
    tb = 41.2; tc_ = Vector(at(RM - 0.4, tb, 0.0)); TR = 1.2
    lib.box("breakfast rug", (5.4, 5.4, 0.014), at(RM - 0.4, tb, 0.007), M["rug"], bevel=0.006, rot_z=face_in(tb), segs=2)
    lib.cyl("table foot", 0.62, 0.04, (tc_.x, tc_.y, 0.0), M["bronze_dark"], verts=96, bevel=0.006)
    lib.cyl("table stem", 0.16, 0.68, (tc_.x, tc_.y, 0.04), M["oak_top"], verts=48)
    lib.cyl("table top", TR, 0.05, (tc_.x, tc_.y, 0.71), M["oak_top"], verts=128, bevel=0.008)
    linen = seating.fabric("breakfast linen", (0.66, 0.58, 0.45), "linen")
    for k in range(8):
        a = k * math.pi / 4 + 0.2; p = (tc_.x + (TR + 0.42) * math.cos(a), tc_.y + (TR + 0.42) * math.sin(a), 0.0)
        seating.dining_chair("breakfast chair", p, a - math.pi / 2, fabric_mat=linen, seed=520 + k)          # facing the table
        q = (tc_.x + (TR - 0.36) * math.cos(a), tc_.y + (TR - 0.36) * math.sin(a), 0.76)
        lib.cyl("plate", 0.13, 0.012, q, M["porcelain"], verts=48, bevel=0.003)
    cup = lib.import_glb(os.path.join(A, "DiffuseTransmissionTeacup.glb"), (0, 0, -100), 0, name="cup src")
    for k in range(0, 8, 2):
        a = k * math.pi / 4 + 0.2 + 0.3; lib.instance_of(cup, (tc_.x + (TR - 0.42) * math.cos(a), tc_.y + (TR - 0.42) * math.sin(a), 0.76), a, 0.9)
    lemon_skin = lib.principled("lemon skin", (0.85, 0.62, 0.05), 0.35, **{"Coat Weight": 0.3})
    furn.lathe("fruit bowl", [(0.0, 0.0), (0.08, 0.0), (0.16, 0.05), (0.19, 0.09), (0.18, 0.09), (0.15, 0.055), (0.0, 0.02)], M["ceramics"][3], 48, (tc_.x + 0.25, tc_.y, 0.76))
    for k in range(7):
        a = k * 0.9; bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.036, location=(tc_.x + 0.25 + 0.08 * math.cos(a) * (k > 0), tc_.y + 0.08 * math.sin(a) * (k > 0), 0.83 + 0.04 * (k == 0)))
        lm = bpy.context.active_object; lm.scale = (1, 1, 1.2); lm.data.materials.append(lemon_skin)
        for p_ in lm.data.polygons: p_.use_smooth = True
    plants.make("orchid", (tc_.x - 0.25, tc_.y, 0.76), seed=530, pot=(0.24, 0.12, "white"), colour="white")
    lights.globes("breakfast globes", (tc_.x, tc_.y), n=9, spread=0.85, low=2.0, high=2.9, ceiling=ceil_at(tb), watts=40, seed=5)
    # the banquette along the windows, its table, three chairs across it; a lemon tree at each end
    bq = 44.4; rq = R_OUT - 0.75
    seating.sofa("window banquette", at(rq, bq, 0.0), face_in(bq), length=5.6, depth=1.0, fabric_mat=seating.fabric("sage velvet", (0.24, 0.30, 0.22), "velvet"), arms=False, bend=rq, seed=531)
    tables.dining_table("banquette table", at(rq - 1.25, bq, 0.0), face_in(bq), length=4.2, width=0.9, mat=M["oak_top"], base=M["bronze_dark"])
    for k in (-1, 0, 1):
        bb = bq + k * tang(1.4, rq - 2.1); seating.dining_chair("banquette chair", at(rq - 2.1, bb, 0.0), face_out(bb), fabric_mat=linen, seed=533 + k)
    plants.make("orchid", at(rq - 1.25, bq, 0.76), seed=536, pot=(0.22, 0.11, "white"), colour="pink")
    for k, bb in enumerate((bq - tang(3.6, R_OUT - 1.0), bq + tang(3.6, R_OUT - 1.0))):
        plants.make("lemon", at(R_OUT - 1.0, bb, 0.0), seed=537 + k, pot=(0.95, 0.75, "terracotta"), height=2.6)
    lights.globes("banquette globes", at(rq - 1.25, bq), n=5, spread=1.4, low=2.0, high=2.6, ceiling=ceil_at(bq), watts=30, seed=9)
    # the sideboard with the coffee on the inner side, flowers; an olive in a basalt planter by the cross wall
    sb = 39.0
    tables.console("sideboard", at(R_GL + 0.75, sb, 0.0), face_out(sb), length=3.4, depth=0.55, h=0.88)
    cm = at(R_GL + 0.7, sb - tang(0.9), 0.88)
    lib.box("coffee machine", (0.36, 0.4, 0.42), (cm[0], cm[1], cm[2] + 0.21), M["steel"], bevel=0.02, rot_z=face_out(sb))
    lib.box("coffee machine front", (0.3, 0.02, 0.14), at(R_GL + 0.9, sb - tang(0.9), 1.07), M["graphite"], rot_z=face_out(sb))
    lib.instance_of(S["vase"], at(R_GL + 0.75, sb + tang(0.8), 0.88), 0.4, 1.4)
    plants.make("olive", at(R_GL + 1.8, b0 + tang(1.6, R_GL + 1.8), 0.0), seed=539, pot=(1.3, 0.8, "basalt", True), height=3.6, stems=2)
    paint("breakfast painting", "vangogh_cottages", 3.0, at(RM + 1.0, b0 + tang(0.17, RM + 1.0), 0.0), face_cw(b0), 2.3, tall=True)
    # C-34, the sky garden (furnishing.py): a platform of honed black basalt (Jim, 4 Oct: "I like black platform"),
    # raised 12 cm, through the garden; raised beds of basalt along both walls full of herbs and flowers; trees of
    # every colour in the beds (red and orange maples, a gold ginkgo, olives, lemons); on the platform a red maple
    # by the basin, birds of paradise, tree ferns in the shade, agaves; boxwood balls; daybeds under the trees and a
    # long travertine bench; low lights along the beds
    import seating, tables, lights, plants, atrium
    crown.curved_box("garden platform", R_GL + 0.05, R_OUT - 0.05, w1 + 0.1, b1 + crown.PAD, 0.0, 0.12, M["basalt"])
    crown.curved_box("platform shadow gap", R_GL + 0.04, R_OUT - 0.04, w1 + 0.08, b1 + crown.PAD, 0.0, 0.02, M["shadow"])
    Z = 0.12
    beds_out = [(49.2, 55.4), (56.6, 62.6), (63.8, 70.8)]; beds_in = [(49.6, 58.0), (61.6, 70.6)]
    for (a, b) in beds_out:
        crown.curved_box("bed wall", R_OUT - 1.9, R_OUT - 0.1, a, b, Z, Z + 0.5, M["basalt"])
        crown.curved_box("bed soil", R_OUT - 1.82, R_OUT - 0.18, a + tang(0.08, R_OUT - 1), b - tang(0.08, R_OUT - 1), Z + 0.5, Z + 0.505, M["soil"])
        herb_bed("herbs out", R_OUT - 1.82, R_OUT - 0.18, a + tang(0.1, R_OUT - 1), b - tang(0.1, R_OUT - 1), Z + 0.505, M, rnd, density=11.0)
        lights.strip("bed light", at(R_OUT - 1.93, a + tang(0.1, R_OUT - 1.93), Z + 0.03), at(R_OUT - 1.93, b - tang(0.1, R_OUT - 1.93), Z + 0.03), strength=14.0, w=0.015)
    for (a, b) in beds_in:
        crown.curved_box("bed wall", R_GL + 0.15, R_GL + 1.15, a, b, Z, Z + 0.42, M["basalt"])
        crown.curved_box("bed soil", R_GL + 0.23, R_GL + 1.07, a + tang(0.08, R_GL + 0.6), b - tang(0.08, R_GL + 0.6), Z + 0.42, Z + 0.425, M["soil"])
        herb_bed("herbs in", R_GL + 0.23, R_GL + 1.07, a + tang(0.1, R_GL + 0.6), b - tang(0.1, R_GL + 0.6), Z + 0.425, M, rnd, density=11.0)
        lights.strip("bed light", at(R_GL + 1.18, a + tang(0.1, R_GL + 1.18), Z + 0.03), at(R_GL + 1.18, b - tang(0.1, R_GL + 1.18), Z + 0.03), strength=14.0, w=0.015)
    for (a, b) in beds_out:                                    # boxwood balls at the beds' ends
        for k, bb in enumerate((a + tang(0.45, R_OUT - 1.0), b - tang(0.45, R_OUT - 1.0))): plants.make("boxwood", at(R_OUT - 1.0, bb, Z + 0.5), seed=int(bb * 10), d=0.7)
    for (a, b) in beds_in:
        for k, bb in enumerate((a + tang(0.4, R_GL + 0.65), b - tang(0.4, R_GL + 0.65))): plants.make("boxwood", at(R_GL + 0.65, bb, Z + 0.42), seed=int(bb * 10) + 1, d=0.6)
    trees = ((51.0, "japanese maple", dict(height=3.0, colour="red", stems=3)), (54.0, "olive", dict(height=3.2, stems=2)),
             (58.4, "japanese maple", dict(height=2.8, colour="orange", stems=2)), (61.2, "lemon", dict(height=2.6)),
             (65.6, "ginkgo", dict(height=4.2)), (69.4, "olive", dict(height=3.0, stems=2)))
    for k, (bb, kind, kw) in enumerate(trees): plants.make(kind, at(R_OUT - 1.0, bb, Z + 0.5), seed=300 + k, **kw)
    for k, bb in enumerate((53.0, 67.0)): plants.make("lemon", at(R_GL + 0.65, bb, Z + 0.42), seed=320 + k, height=2.2)
    # on the platform: the basin, a red maple by it, birds of paradise, tree ferns, agaves
    pr = (R_GL + 1.15 + R_OUT - 1.9) / 2
    c = at(pr, 60.0, Z)
    lib.cyl("basin", 1.3, 0.45, c, M["basalt"], verts=128, bevel=0.02)
    lib.cyl("basin water", 1.2, 0.01, (c[0], c[1], Z + 0.40), lib.glass("basin water", (0.80, 0.90, 0.88), 0.0, 1.33), verts=128)
    lib.cyl("basin inside", 1.2, 0.02, (c[0], c[1], Z + 0.12), M["basalt"], verts=128)
    lib.cyl("basin spout", 0.04, 0.25, (c[0], c[1], Z + 0.4), M["bronze"], verts=24)
    plants.make("japanese maple", at(pr - 2.2, 60.0 + tang(2.6, pr - 2.2), Z), seed=330, pot=(1.6, 0.6, "basalt"), height=3.6, colour="red", stems=3)
    for k, (r, bb) in enumerate(((pr + 1.6, 52.4), (pr + 2.2, 53.3))):
        plants.make("bird of paradise", at(r, bb, Z), seed=331 + k, pot=(1.0, 0.7, "bronze"), height=3.2 - 0.4 * k, stems=5)
    for k, (r, bb, h) in enumerate(((pr - 1.6, 67.6, 2.9), (pr - 0.6, 68.6, 2.4), (pr - 1.9, 69.3, 2.6))):
        plants.make("tree fern", at(r, bb, Z), seed=334 + k, pot=(0.95, 0.5, "basalt"), height=h)
    for k, (r, bb) in enumerate(((pr + 1.2, 64.2), (pr + 2.0, 64.9), (pr + 1.5, 65.7))):
        plants.make("agave", at(r, bb, Z), seed=337 + k, pot=(0.9, 0.38, "travertine"), size=0.75, colour="blue" if k != 1 else "green")
    # daybeds under the trees by the outer beds, a long travertine bench facing the basin
    linen = seating.fabric("garden linen", (0.72, 0.68, 0.60), "linen")
    for k, bb in enumerate((56.0, 63.2)):
        seating.daybed("garden daybed", at(R_OUT - 3.1, bb, Z), face_cw(bb) + math.pi * 0.5 + (0.25 if k else -0.25), length=2.3, width=1.1, fabric_mat=linen, seed=340 + k)
    trav = seating.stone("garden travertine", (0.80, 0.73, 0.62), (0.62, 0.55, 0.45), "travertine", 0.3)
    blk = lambda nm, size, ctr: seating.soft_box(nm, size, ctr, trav, r=0.012, crown=0, bulge=0, crease=0, sub=1)
    seating._piece("garden bench", at(pr - 1.8, 60.0, Z), face_out(60.0),
                   [blk("bench slab", (4.0, 0.52, 0.09), (0, 0, 0.415))] + [blk("bench block", (0.34, 0.46, 0.37), (x, 0, 0.185)) for x in (-1.4, 1.4)])
    # ivy up the outer wall between and under the slots
    ivy_leaf = bpy.data.objects.get("ivy leaf") or atrium.leaf_object("ivy leaf", 0.06, 0.05, lib.leaf("ivy", (0.045, 0.095, 0.028), 0.35, 0.35))
    pts = []
    for i in range(70000):
        bb = rnd.uniform(w1 + 0.4, b1 - 0.4); z = 0.5 + 2.6 * (1 - math.sqrt(rnd.random()))
        if 3.0 < z: continue
        pts.append(Vector(at(R_OUT - 0.03 - abs(rnd.gauss(0, 0.05)), bb, z)))
    me = bpy.data.meshes.new("wall ivy"); me.from_pydata([tuple(p) for p in pts], [], []); ob = lib.link(bpy.data.objects.new("wall ivy", me))
    atrium.scatter_leaves(ob, ivy_leaf, "ivy leaves", 0.7, 1.3)
    # warm downlights for the evening (the grow lights are flush in the ceiling)
    for bb in crown.steps(w1 + 1.0, b1 - 1.0, 1.0 / tang(3.0)):
        for r in (R_OUT - 1.0, R_GL + 0.65):
            lib.spot_light("garden downlight", at(r, bb, ceil_at(bb) - 0.06), 45, (1.0, 0.84, 0.66), 0.03, 50, 0.6)
    for bc in (38.0, 41.6, 45.2):
        for r in (RM - 1.4, RM + 1.4):
            lib.spot_light("downlight", at(r, bc, ceil_at(bc) - 0.06), 80, (1.0, 0.82, 0.62), 0.03, 45, 0.5)
    washers(b0, w1, 60)



ROOMS = {
    "arrival": dict(build=arrival, span=(91.44, 108.0), sun=(250.0, 14.0), cams={
        "arrival": dict(loc=at(RM + 2.6, 106.9, 1.6), target=at(RM - 0.6, 96.4, 4.2), lens=17),
        "arrival2": dict(loc=at(R_GL + 1.2, 97.7, 1.6), target=at(R_OUT - 1.0, 103.6, 3.6), lens=17),
    }, stops={"arrival": at(RM + 4.4, 98.6, 0.0)}),        # in from the Door, the great tree and the portal ahead
    "dining": dict(build=dining, span=(223.2, 241.2), sun=(244.0, 13.0), cams={
        "dining": dict(loc=at(R_OUT - 2.4, 225.4, 1.6), target=at(RM - 1.0, 234.6, 2.2), lens=18),
        "dining2": dict(loc=at(RM + 0.6, 240.6, 1.65), target=at(RM + 0.6, 228.0, 1.4), lens=20),
    }, stops={"dining": at(RM + 3.6, 232.2, 0.0)}),
    "bedroom": dict(build=bedroom_up, span=(116.64, 130.32), sun=(118.0, 7.0), cams={
        "bedroom": dict(loc=at(133.6, 125.2, 1.6), target=at(123.8, 123.2, 2.6), lens=19),
        "bedroom2": dict(loc=at(129.4, 117.3, 1.6), target=at(126.6, 124.6, 2.2), lens=19),
    }, stops={"bedroom": at(128.6, 123.5, 0.0)}),
    "sunset": dict(build=sunset_lounge, span=(261.0, 279.0), sun=(268.0, 4.5), sun_strength=11.0, cams={
        "sunset": dict(loc=at(R_GL + 0.5, 266.3, 1.4), target=at(R_OUT - 0.2, 271.8, 1.6), lens=20),
        "sunset2": dict(loc=at(R_OUT - 2.6, 278.3, 1.4), target=at(R_GL + 0.4, 268.0, 1.2), lens=20),
    }, stops={"sunset": at(RM, 270.0, 0.0)}),
    "salon": dict(build=salon, span=(144.0, 180.0), sun=(158.0, 38.0), cams={
        "salon":  dict(loc=at(RM + 3.6, 153.0, 1.6), target=at(RM - 1.2, 163.6, 3.0), lens=18),
        "salon2": dict(loc=at(132.5, 168.6, 1.6), target=at(121.5, 160.6, 3.2), lens=18),
        "hearth": dict(loc=at(RM + 4.2, 151.3, 1.55), target=at(RM - 0.2, 146.2, 1.6), lens=19),
    }, stops={"salon": at(RM + 2.4, 159.6, 0.0), "hearth": at(RM + 3.6, 149.2, 0.0), "piano_up": at(RM + 1.2, 172.9, 0.0)}),
    "library": dict(build=library_up, span=(288.0, 324.0), sun=(300.0, 16.0), cams={
        "library_up": dict(loc=at(RM - 3.6, 298.4, 1.6), target=at(R_OUT - 2.0, 309.0, 5.0), lens=17),
        "maproom": dict(loc=at(RM + 2.4, 317.4, 1.6), target=at(RM - 0.2, 320.4, 2.0), lens=20),
        "study": dict(loc=at(R_GL + 2.2, 295.6, 1.6), target=at(R_OUT - 2.0, 290.6, 1.6), lens=19),
    }, stops={"library": at(RM - 3.0, 306.8, 0.0), "maproom": at(RM + 2.6, 318.2, 0.0), "study": at(RM, 292.0, 0.0)}),
    "studio": dict(build=studio, span=(324.0, 360.0), sun=(192.0, 36.0), cams={
        "studio": dict(loc=at(R_GL + 2.4, 337.6, 1.5), target=at(RM, 325.0, 1.8), lens=20),
        "prints": dict(loc=at(R_GL + 3.0, 340.6, 1.5), target=at(130.0, 349.0, 1.8), lens=20),
        "craft": dict(loc=at(R_GL + 0.75, 349.7, 1.5), target=at(R_OUT - 1.0, 356.0, 1.0), lens=20),
    }, stops={"studio": at(RM + 0.3, 332.2, 0.0)}),
    "observatory": dict(build=observatory, span=(0.0, 36.0), sun=(200.0, 30.0), night=True, cams={
        "stars": dict(loc=at(R_OUT - 5.4, 15.9, 1.25), target=at(R_OUT, 10.6, 4.6), lens=17),
        "stars_day": dict(loc=at(R_OUT - 5.4, 15.9, 1.25), target=at(R_OUT, 10.6, 4.6), lens=17, day=True),
        "telescope": dict(loc=at(RM - 1.0, 24.9, 1.5), target=at(R_OUT - 0.8, 31.2, 1.2), lens=20),
    }, stops={"stars": at(RM + 1.0, 12.4, 0.0)}),
    "garden": dict(build=garden_room, span=(36.0, 72.0), sun=(66.0, 6.0), sun_strength=10.0, cams={
        "breakfast": dict(loc=at(RM - 0.6, 44.3, 1.4), target=at(RM + 0.7, 40.9, 0.8), lens=22),
        "garden": dict(loc=at(R_GL + 1.5, 52.2, 1.3), target=at(R_OUT - 1.2, 61.5, 1.0), lens=20),
    }, stops={"garden": at(RM - 0.3, 59.2, 0.0)}),
}


if __name__ == "__main__": sys.modules.setdefault("crown_rooms", sys.modules["__main__"])    # crown_more imports this file by name
from crown_more import MORE          # the rooms that make the ring whole (crown_more.py)
ROOMS.update(MORE)
from crown_wellness import WELLNESS  # the spa, the sky pool and the gym (crown_wellness.py)
ROOMS.update(WELLNESS)


def build(room, night_=None):
    sc = lib.reset(); M = materials(); rnd = random.Random(23)
    R = ROOMS[room]; nt = R.get("night", False) if night_ is None else night_; DAY["on"] = not nt
    R["build"](M, rnd); crown.outside(M, R["sun"][0], R["sun"][1], sun_strength=R.get("sun_strength", 6.0), skip=R["span"])
    if nt: night(R, M)                         # a plan from above is drawn by day
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
    Rr = ROOMS[room]; daylit = all(j.startswith("plan:") or (not j.startswith("pano:") and Rr["cams"][j].get("day")) for j in todo)
    t = time.time(); sc, R = build(room, False if daylit else None); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in todo:
        tmp = paths[j].replace(".jpg", ".part.jpg")
        if j.startswith("plan:"):                  # a floor plan from above: it hides the ceilings, so it goes last
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=0.3)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        else:
            c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"], shift_y=c.get("shift", 0.0)); lib.photo_finish(0.3, 0.15)
            t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
