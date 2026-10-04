"""The Crown's rooms that crown_rooms.py did not have yet, so the ring is whole (for the stills, the 360s and the walk
round it): each built from its line in the room program (palace/tools/room_program.py), in the same frame and with the
same helpers as crown_rooms.py, which adds these to its ROOMS.
  C-01 Suit room, C-02 Pod hangar (part 1, Arrival); C-06 Dressing room, C-08 Bath up (part 2, the master suite up);
  C-16 Wine room, C-18 Chef's kitchen (part 5, Dining); C-20 Guests' day room, C-22 Gallery (part 6, Sunset)."""
import bpy, bmesh, math, os, random
from mathutils import Vector
import lib, furn, crown
import crown_rooms as CR
from crown import P, R_IN, R_OUT, R_GL, ceil_at, D
from crown_rooms import RM, at, tang, face_in, face_out, face_cw, face_ccw

TH = 0.3 / 130.0 / D                   # a partition's thickness, in degrees
FACE = TH / 2                          # from a partition's middle to its face


def downlights(b0, b1, watts=80, color=(1.0, 0.84, 0.66), rs=(RM - 1.4, RM + 1.4), every=3.0):
    for bb in crown.steps(b0 + tang(1.0), b1 - tang(1.0), 1.0 / tang(every)):
        for r in rs: lib.spot_light("downlight", at(r, bb, ceil_at(bb) - 0.08), watts, color, 0.03, 50, 0.5)


def aim(light, frm, to):
    light.rotation_euler = (Vector(to) - Vector(frm)).to_track_quat("-Z", "Y").to_euler()


def tile_material(name, color=(0.86, 0.85, 0.82), grout=(0.62, 0.61, 0.58), w=0.15, h=0.075, rough=0.12):
    """glazed tiles laid in courses (a brick bond), a little uneven, the grout a hair lower"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = 0.3; b.inputs["Coat Roughness"].default_value = 0.05
    g = N.new("ShaderNodeNewGeometry"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(g.outputs["Position"], sep.inputs[0])
    # across the wall: the arc length round the ring (radius * angle), up the wall: z
    ang = lib._math(nt, "ARCTAN2", sep.outputs[0], sep.outputs[1]); s = lib._math(nt, "MULTIPLY", ang, 135.0)
    cm = N.new("ShaderNodeCombineXYZ"); L.new(s, cm.inputs[0]); L.new(sep.outputs[2], cm.inputs[1])
    br = N.new("ShaderNodeTexBrick"); br.offset = 0.5; br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.0025
    br.inputs["Brick Width"].default_value = w; br.inputs["Row Height"].default_value = h; br.inputs["Mortar Smooth"].default_value = 0.3
    br.inputs["Color1"].default_value = (*color, 1); br.inputs["Color2"].default_value = (color[0] * 0.96, color[1] * 0.96, color[2] * 0.95, 1); br.inputs["Mortar"].default_value = (*grout, 1)
    L.new(cm.outputs[0], br.inputs["Vector"]); L.new(br.outputs["Color"], b.inputs["Base Color"])
    bm = N.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.35; bm.inputs["Distance"].default_value = 0.002
    L.new(lib._math(nt, "SUBTRACT", 1.0, br.outputs["Fac"]), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def mats(M):
    P_ = lib.principled
    CR.extra_materials(M)
    M.setdefault("white_wall", lib.plaster("gallery white", (0.86, 0.85, 0.82), 0.9, 0.03))
    M.setdefault("bath_trav", lib.travertine("bath travertine", (0.82, 0.76, 0.66), (0.74, 0.67, 0.56), 0.45, 1.2, honed=True))
    M.setdefault("tiles", tile_material("kitchen tiles"))
    M.setdefault("rubber", P_("rubber floor", (0.07, 0.07, 0.072), 0.8))
    M.setdefault("suit", lib.fabric("suit fabric", (0.80, 0.79, 0.75), 0.85, 0.3, 300, 0.35))
    M.setdefault("suit_grey", lib.fabric("suit grey", (0.18, 0.18, 0.19), 0.8, 0.2, 300, 0.3))
    M.setdefault("visor", P_("visor gold", (0.95, 0.72, 0.35), 0.08, 1.0))
    M.setdefault("pod_white", P_("pod white", (0.84, 0.84, 0.82), 0.25, **{"Coat Weight": 0.7, "Coat Roughness": 0.05}))
    M.setdefault("pod_glass", P_("pod canopy", (0.01, 0.012, 0.015), 0.05, **{"Coat Weight": 1.0, "Coat Roughness": 0.01}))
    M.setdefault("hazard", P_("hazard yellow", (0.75, 0.52, 0.04), 0.6))
    M.setdefault("copper", P_("copper", (0.85, 0.47, 0.30), 0.25, 1.0))
    M.setdefault("tub", P_("tub stone", (0.86, 0.84, 0.80), 0.18, **{"Coat Weight": 0.5}))
    M.setdefault("mirror", P_("mirror", (0.9, 0.9, 0.9), 0.02, 1.0))
    M.setdefault("enamel_white", P_("white enamel", (0.80, 0.80, 0.78), 0.3))
    M.setdefault("screen_glow", lib.emission("screen glow", (0.55, 0.7, 0.9), 1.2))
    return M


def partition_door(b, M, r0, r1, head=2.4, mat=None):
    """a door left open in a partition: the partition's own pieces round an opening from r0 to r1, head high"""
    mat = mat or M["regolith"]
    for (a, c) in ((R_GL + 0.05, r0), (r1, R_OUT)):
        crown.curved_box("partition", a, c, b - TH / 2, b + TH / 2, 0, 9, mat, zf1=lambda bb: ceil_at(bb) + 0.01)
    crown.curved_box("partition head", r0, r1, b - TH / 2, b + TH / 2, head, 9, mat, zf1=lambda bb: ceil_at(bb) + 0.01)


def glass_front(b0, b1, M, door_at=None, h=2.9, r=R_GL + 0.12, every=1.3):
    """a glazed front onto the Glide: Mars glass in a bronze frame, a door's width left open at door_at"""
    dw = tang(1.3, r)
    pieces = [(b0, b1)] if door_at is None else [(b0, door_at - dw / 2), (door_at + dw / 2, b1)]
    for (a, c) in pieces:
        crown.curved_box("glass front", r - 0.006, r + 0.006, a, c, 0.0, h, M["glass"])
        crown.curved_box("front head", r - 0.03, r + 0.03, a, c, h, h + 0.06, M["bronze_dark"])
        crown.curved_box("front sill", r - 0.03, r + 0.03, a, c, 0.0, 0.04, M["bronze_dark"])
        for bb in crown.steps(a, c, 1.0 / tang(every, r)):
            crown.curved_box("mullion", r - 0.03, r + 0.03, bb - tang(0.02, r), bb + tang(0.02, r), 0.0, h, M["bronze_dark"])


def standing(src, loc, rot_z=0.0, name=None):
    """a copy of a lying model (the bottle, along +y) stood up on its base"""
    o = src.copy(); o.name = name or src.name; bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = (math.pi / 2, 0, rot_z); return o


# ---------------------------------------------------------------- C-16 the wine room
def wine_room(M, rnd):
    """C-16, the wine room (216 to 223.2), beside the dining hall: wine brought up from the cellar (L1-20) for the
    dinners and served from here. A wall of bottles behind Mars glass, lit from behind; a tasting counter of walnut and
    marble; a glass front onto the Glide, its door open"""
    import club
    b0, b1 = 216.0, 223.2
    mats(M); club.materials(M)
    crown.ring_room(b0, b1, M, M["basalt"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M)
    # a lighter bottle than the cellar's, for the walls of them
    prof = [(0.0, 0.0), (0.037, 0.0), (0.0375, 0.02), (0.0375, 0.205), (0.024, 0.24), (0.015, 0.258), (0.0145, 0.3)]
    bm = bmesh.new(); seg = 10; rings = []
    for k in range(seg):
        a = 2 * math.pi * k / seg; rings.append([bm.verts.new((r * math.cos(a), z, r * math.sin(a))) for (r, z) in prof])
    for k in range(seg):
        r0, r1 = rings[k], rings[(k + 1) % seg]
        for i in range(len(prof) - 1):
            f = bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i])); f.material_index = 1 if prof[i][1] >= 0.24 else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    src = lib.mesh_obj("wall bottle", bm, [M["bottle"], M["capsule"]], smooth=True); src.location = (0, 0, -500)
    # the wine wall: bays 1.15 m wide along the outer wall, 2.75 m tall (under the slots), bottles lying necks out
    W = 1.15; nb = int((b1 - b0 - tang(0.8, R_OUT)) / tang(W, R_OUT))
    s0 = (b0 + b1) / 2 - nb * tang(W, R_OUT) / 2
    back = lib.emission("rack light", (1.0, 0.78, 0.52), 1.6)
    for k in range(nb):
        a = s0 + k * tang(W, R_OUT); c = a + tang(W, R_OUT); bb = (a + c) / 2
        crown.curved_box("wine back", R_OUT - 0.07, R_OUT - 0.05, a, c, 0.12, 2.72, back)
        for e in (a, c): crown.curved_box("wine fin", R_OUT - 0.62, R_OUT - 0.05, e - tang(0.015, R_OUT), e + tang(0.015, R_OUT), 0.0, 2.8, M["walnut_v"])
        crown.curved_box("wine plinth", R_OUT - 0.62, R_OUT - 0.05, a, c, 0.0, 0.12, M["walnut"])
        crown.curved_box("wine top", R_OUT - 0.62, R_OUT - 0.05, a, c, 2.72, 2.8, M["walnut"])
        pts = []
        for i in range(19):
            z = 0.2 + i * 0.13
            for j in range(10):
                t = (j + 0.5) / 10; pb = a + (c - a) * (0.06 + 0.88 * t)
                pts.append(at(R_OUT - 0.1 - rnd.uniform(0.0, 0.02), pb, z))         # the base at the back, the neck out
        club.instancer("wine rack %d" % k, pts, src, (0.0, 0.0, face_out(bb)))
        crown.curved_box("wine glass door", R_OUT - 0.64, R_OUT - 0.63, a + tang(0.02, R_OUT), c - tang(0.02, R_OUT), 0.13, 2.71, M["glass"])
        lib.box("wine pull", (0.015, 0.03, 0.5), at(R_OUT - 0.66, c - tang(0.08, R_OUT), 1.35), M["bronze"], rot_z=face_in(c))
    # the tasting counter: walnut and marble along the ring, stools on the Glide side
    bc = (b0 + b1) / 2; L_ = 4.4
    crown.curved_box("counter", RM + 0.15, RM + 0.85, bc - tang(L_ / 2), bc + tang(L_ / 2), 0.0, 1.0, M["walnut_v"])
    crown.curved_box("counter top", RM + 0.05, RM + 0.95, bc - tang(L_ / 2 + 0.05), bc + tang(L_ / 2 + 0.05), 1.0, 1.04, M["marble"])
    crown.curved_box("counter kick", RM + 0.2, RM + 0.8, bc - tang(L_ / 2 - 0.05), bc + tang(L_ / 2 - 0.05), 0.0, 0.08, M["shadow"])
    for i in range(5):
        bb = bc - tang(1.6) + i * tang(0.8); CR.stool("stool", at(RM - 0.2, bb, 0.0), M, h=0.76)
    for i, w in enumerate((0.06, 0.0, 0.05, 0.03, 0.0, 0.04)):
        bb = bc - tang(1.5) + i * tang(0.55); club.wine_glass("wine glass", at(RM + 0.32, bb, 1.04), M, wine=w)
    for i in range(3):
        standing(src, at(RM + 0.62, bc + tang(0.6 + i * 0.12), 1.04), rnd.uniform(0, 6), "standing bottle")
    furn.lathe("decanter", [(0.0, 0.0), (0.06, 0.0), (0.105, 0.04), (0.11, 0.08), (0.07, 0.14), (0.025, 0.2), (0.022, 0.32), (0.03, 0.34), (0.0, 0.34)], M["crystal"], 40, at(RM + 0.55, bc - tang(0.4), 1.04))
    furn.lathe("decanted wine", [(0.0, 0.003), (0.058, 0.003), (0.1, 0.04), (0.104, 0.065), (0.0, 0.065)], M["wine"], 40, at(RM + 0.55, bc - tang(0.4), 1.04))
    lib.import_glb(os.path.join(CR.A, "IridescentDishWithOlives.glb"), at(RM + 0.5, bc + tang(1.4), 1.04), 0.0, 0.8, name="olives")
    # globes over the counter, and the front onto the Glide
    globe = lib.glass("globe glass", (0.97, 0.95, 0.9), 0.15)
    for i in range(3):
        bb = bc + tang(-1.4 + 1.4 * i); z = 2.15
        furn.lathe("globe", [(0.0, -0.16), (0.09, -0.14), (0.15, -0.05), (0.16, 0.0), (0.15, 0.06), (0.11, 0.12), (0.03, 0.155), (0.0, 0.16)], globe, 40, at(RM + 0.5, bb, z))
        lib.cyl("globe bulb", 0.02, 0.04, at(RM + 0.5, bb, z - 0.02), lib.emission("bulb", (1.0, 0.72, 0.45), 60), verts=16)
        lib.cyl("globe cable", 0.002, ceil_at(bb) - z - 0.16, at(RM + 0.5, bb, z + 0.16), M["shadow"], verts=8)
        lib.point_light("globe light", at(RM + 0.5, bb, z), 30, (1.0, 0.75, 0.5), 0.06)
    glass_front(b0 + FACE, b1 - FACE, M, door_at=bc - tang(2.6, R_GL))
    lib.instance_of(S["plant"], at(R_GL + 0.7, b0 + tang(0.9), 0.0), 0.4, 1.7)
    CR.washers(b0, b1, 50)


# ---------------------------------------------------------------- C-18 the chef's kitchen
def pot(name, loc, M, r=0.12, h=0.14, mat=None, lid=False):
    mat = mat or M["copper"]
    g = furn.lathe(name, [(0.0, 0.0), (r * 0.92, 0.0), (r, 0.015), (r, h), (r * 0.94, h), (r * 0.94, 0.02), (0.0, 0.02)], mat, 32, loc)
    if lid: furn.lathe(name + " lid", [(0.0, h + 0.03), (r * 0.98, h), (r, h - 0.005), (0.0, h - 0.005)], mat, 32, loc)
    return g


def chefs_kitchen(M, rnd):
    """C-18, the chef's kitchen (241.2 to 252), next to the dining hall: it cooks for the dinners. The cooking line
    along the outer wall under one long hood, white glazed tiles up to the slots, two prep islands under rails of
    copper pans, open shelves, the door of the cold room"""
    b0, b1 = 241.2, 252.0
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"])
    st = M["steel"]; bc = (b0 + b1) / 2
    # tiles on the outer wall and the two partitions, up to just under the slots
    crown.curved_box("tiles", R_OUT - 0.07, R_OUT - 0.05, b0 + FACE, b1 - FACE, 0.0, 2.92, M["tiles"])
    for (a_, c_) in ((b0 + FACE, b0 + FACE + tang(0.015, RM)), (b1 - FACE - tang(0.015, RM), b1 - FACE)):
        crown.curved_box("tiles", R_GL + 2.0, R_OUT - 0.05, a_, c_, 0.0, 2.6, M["tiles"])
    # the cooking line: steel cabinets and worktop along the outer wall, the range in the middle under the hood
    a, c = b0 + tang(0.8, R_OUT), b1 - tang(0.8, R_OUT)
    crown.curved_box("line", R_OUT - 0.8, R_OUT - 0.07, a, c, 0.1, 0.88, st)
    crown.curved_box("line kick", R_OUT - 0.74, R_OUT - 0.07, a, c, 0.0, 0.1, M["shadow"])
    crown.curved_box("line top", R_OUT - 0.82, R_OUT - 0.07, a, c, 0.88, 0.92, st)
    for bb in crown.steps(a, c, 1.0 / tang(0.6, R_OUT)):             # the cabinet doors' joints
        crown.curved_box("door joint", R_OUT - 0.805, R_OUT - 0.8, bb - tang(0.003, R_OUT), bb + tang(0.003, R_OUT), 0.12, 0.86, M["shadow"])
    rc = bc; rw = tang(3.0, R_OUT)
    crown.curved_box("range top", R_OUT - 0.8, R_OUT - 0.1, rc - rw / 2, rc + rw / 2, 0.92, 0.95, M["graphite"])
    for i in range(6):
        for j in range(2):
            q = at(R_OUT - 0.62 + j * 0.34, rc - rw / 2 + tang(0.35 + i * 0.46, R_OUT), 0.95)
            lib.cyl("burner", 0.1, 0.02, q, lib.principled("cast iron", (0.02, 0.02, 0.02), 0.6, 0.7), verts=24)
            lib.cyl("burner cap", 0.035, 0.03, q, lib.principled("cast iron", (0.02, 0.02, 0.02), 0.6, 0.7), verts=16)
    for i in range(8):
        bb = rc - rw / 2 + tang(0.25 + i * 0.36, R_OUT); lib.cyl("knob", 0.022, 0.04, at(R_OUT - 0.82, bb, 0.8), st, verts=16, rot=(math.pi / 2, 0, face_in(bb)))
    crown.curved_box("hood", R_OUT - 1.15, R_OUT - 0.07, rc - rw / 2 - tang(0.3, R_OUT), rc + rw / 2 + tang(0.3, R_OUT), 2.05, 2.9, st)
    crown.curved_box("hood light", R_OUT - 1.1, R_OUT - 1.05, rc - rw / 2, rc + rw / 2, 2.04, 2.05, lib.emission("hood light", (1.0, 0.9, 0.78), 30))
    for k in (-1, 1):
        q = at(R_OUT - 0.5, rc + k * tang(2.4, R_OUT), 0.92); pot("stock pot", q, M, 0.17, 0.3, st, lid=True)
    pot("sauce pan", at(R_OUT - 0.45, rc - tang(0.6, R_OUT), 0.97), M, 0.11, 0.1)
    pot("pan", at(R_OUT - 0.65, rc + tang(0.9, R_OUT), 0.97), M, 0.14, 0.06, M["graphite"])
    # sinks at either end of the line, with tall bronze taps
    for sb in (a + tang(1.6, R_OUT), c - tang(1.6, R_OUT)):
        crown.curved_box("sink", R_OUT - 0.7, R_OUT - 0.25, sb - tang(0.45, R_OUT), sb + tang(0.45, R_OUT), 0.915, 0.921, M["graphite"])
        lib.cyl("tap", 0.015, 0.42, at(R_OUT - 0.16, sb, 0.92), M["bronze"], verts=12)
        lib.box("spout", (0.03, 0.3, 0.03), at(R_OUT - 0.3, sb, 1.32), M["bronze"], rot_z=face_in(sb))
    # open shelves above the line where there is no hood: plates, bowls, jars
    for (sa, sc) in ((a, rc - rw / 2 - tang(0.5, R_OUT)), (rc + rw / 2 + tang(0.5, R_OUT), c)):
        for z in (1.55, 2.05, 2.55):
            crown.curved_box("shelf", R_OUT - 0.4, R_OUT - 0.07, sa, sc, z, z + 0.03, st)
            bb = sa + tang(0.25, R_OUT)
            while bb < sc - tang(0.3, R_OUT):
                k = rnd.random()
                if k < 0.4:
                    for n in range(rnd.randint(4, 9)): lib.cyl("plate", 0.12, 0.012, at(R_OUT - 0.24, bb, z + 0.03 + n * 0.014), M["porcelain"], verts=32)
                elif k < 0.7: furn.ornament("bowl", *at(R_OUT - 0.24, bb, z + 0.03)[:2], z + 0.03, 0.18, rnd, M["ceramics"])
                else: lib.cyl("jar", 0.06, 0.2, at(R_OUT - 0.24, bb, z + 0.03), lib.glass("jar glass", (0.95, 0.97, 0.95)), verts=24)
                bb += tang(rnd.uniform(0.3, 0.45), R_OUT)
    # two prep islands under rails of copper pans
    for k in (-1, 1):
        ib = bc + k * tang(3.2); L_ = 3.4
        crown.curved_box("island", RM - 1.05, RM - 0.05, ib - tang(L_ / 2), ib + tang(L_ / 2), 0.1, 0.88, st)
        crown.curved_box("island kick", RM - 1.0, RM - 0.1, ib - tang(L_ / 2 - 0.05), ib + tang(L_ / 2 - 0.05), 0.0, 0.1, M["shadow"])
        crown.curved_box("island top", RM - 1.08, RM - 0.02, ib - tang(L_ / 2 + 0.03), ib + tang(L_ / 2 + 0.03), 0.88, 0.93, M["oak_top"] if k < 0 else st)
        for j in range(3):
            q = at(RM - 0.55 + rnd.uniform(-0.2, 0.2), ib + tang(-1.0 + j, RM), 0.93)
            lib.box("board", (0.5, 0.32, 0.03), (q[0], q[1], q[2] + 0.015), M["oak_top"], bevel=0.006, rot_z=face_in(ib) + rnd.uniform(-0.3, 0.3))
            furn.ornament("bowl", q[0] + 0.3, q[1], q[2], 0.16, rnd, M["ceramics"])
        rz = 2.3; ri = RM - 0.55
        crown.curved_box("pan rail", ri - 0.45, ri + 0.45, ib - tang(1.4), ib + tang(1.4), rz, rz + 0.03, st)
        for e in (ib - tang(1.3), ib + tang(1.3)):
            lib.cyl("rail rod", 0.01, ceil_at(e) - rz, at(ri, e, rz), st, verts=8)
        for j in range(7):
            bb = ib + tang(-1.2 + 0.4 * j); rr = 0.08 + 0.025 * (j % 3)
            lib.cyl("hook", 0.004, 0.14, at(ri, bb, rz - 0.14), st, verts=6)
            pot("hanging pan", at(ri, bb, rz - 0.14 - 2 * rr), M, rr, 0.08 + 0.02 * (j % 2))
    # the cold room's door in the far partition, and a tall rack of trays by it
    db = b1 - FACE - tang(0.03, R_GL + 2.8)
    lib.box("cold room door", (0.06, 1.1, 2.2), at(R_GL + 3.2, db, 1.1), st, bevel=0.01, rot_z=face_in(db))
    lib.box("door handle", (0.05, 0.04, 0.5), at(R_GL + 2.85, db - tang(0.06, R_GL + 2.85), 1.1), M["bronze"], rot_z=face_in(db))
    lib.instance_of(CR.imports(M)["plant"], at(R_GL + 0.8, b0 + tang(1.0), 0.0), 0.8, 1.6)
    downlights(b0, b1, 110, (1.0, 0.92, 0.82), rs=(RM - 1.8, RM - 0.4, R_OUT - 1.5), every=2.6)


# ---------------------------------------------------------------- C-20 the guests' day room
def guests_day_room(M, rnd):
    """C-20, the guests' day room (252 to 261), where visitors spend their days up here: desks along the outer wall,
    sofas round a low table, a kitchenette and its table, a corner for children (they sleep below ground, in the guest
    wing on L1)"""
    b0, b1 = 252.0, 261.0
    mats(M)
    crown.ring_room(b0, b1, M, M["oak"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M); bc = (b0 + b1) / 2
    # desks under the slots
    for i in range(3):
        db = b0 + tang(5.2) + i * tang(2.4)
        lib.box("desk", (1.7, 0.75, 0.04), at(R_OUT - 0.6, db, 0.74), M["walnut"], bevel=0.005, rot_z=face_in(db))
        for dx in (-0.78, 0.78):
            lib.box("desk leg", (0.04, 0.68, 0.72), at(R_OUT - 0.6, db + tang(dx, R_OUT - 0.6), 0.36), M["bronze_dark"], rot_z=face_in(db))
        furn.dining_chair("desk chair", at(R_OUT - 1.45, db, 0.0), face_out(db), M)
        furn.table_lamp("desk lamp", at(R_OUT - 0.4, db + tang(0.6, R_OUT), 0.76), M, watts=30, shade_r=0.14)
        CR.screen("screen", CR.repo_file("palace", "design", "img", ("flight-dunes.jpg", "flight-crater.jpg", "mars-earth.jpg")[i]), 0.62, 0.36, at(R_OUT - 0.42, db - tang(0.15), 0.76), face_in(db), M)
        lib.box("notebook", (0.22, 0.3, 0.015), at(R_OUT - 0.85, db - tang(0.45), 0.768), M["leather"], bevel=0.003, rot_z=face_in(db) + 0.2)
    # the sitting group: two sofas face each other across a low table, two armchairs
    sb = b0 + tang(13.6)
    lib.box("rug", (5.2, 4.0, 0.014), at(RM + 0.1, sb, 0.007), M["rug"], bevel=0.006, rot_z=face_in(sb), segs=2)
    for k in (-1, 1):
        bb = sb + k * tang(1.55); lib.instance_of(S["sofa"], at(RM + 0.1, bb, 0.014), face_ccw(bb) if k > 0 else face_cw(bb), name="day sofa")
    for k in (-1, 1):
        lib.instance_of(S["chair"], at(RM + 1.55, sb + k * tang(0.7), 0.014), face_in(sb) + k * 0.3, name="day chair")
    lib.box("low table", (1.1, 0.75, 0.06), at(RM + 0.1, sb, 0.37), M["olive"], bevel=0.012, rot_z=face_in(sb))
    lib.box("low table base", (0.8, 0.5, 0.34), at(RM + 0.1, sb, 0.17), M["olive_v"], bevel=0.006, rot_z=face_in(sb))
    lib.instance_of(S["vase"], at(RM + 0.1, sb + tang(0.25), 0.4), rnd.uniform(0, 6), 1.5)
    for k in range(4): lib.box("book", (0.24, 0.17, 0.035), at(RM - 0.05, sb - tang(0.2), 0.4 + 0.035 * k), M["leather"] if k % 2 else M["linen"], bevel=0.004, rot_z=face_in(sb) + 0.15 * k)
    furn.floor_lamp("floor lamp", at(RM + 1.6, sb + tang(1.6), 0.0), M, watts=60)
    # the kitchenette against the partition by the chef's kitchen: oak and marble, a tall fridge, mugs on a shelf
    kb = b0 + FACE + tang(0.33, R_OUT - 2.0)
    crown.curved_box("kitchenette", R_GL + 2.4, R_OUT - 0.4, b0 + FACE, b0 + FACE + tang(0.62, R_GL + 4), 0.1, 0.9, M["oak_panel"])
    crown.curved_box("kitchenette top", R_GL + 2.38, R_OUT - 0.38, b0 + FACE, b0 + FACE + tang(0.64, R_GL + 4), 0.9, 0.94, M["marble"])
    crown.curved_box("fridge", R_OUT - 0.4, R_OUT - 0.05, b0 + FACE, b0 + FACE + tang(0.68, R_OUT), 0.0, 2.1, M["enamel_white"])
    crown.curved_box("shelf", R_GL + 2.4, R_OUT - 0.5, b0 + FACE, b0 + FACE + tang(0.28, R_GL + 4), 1.55, 1.58, M["oak_panel"])
    for i in range(6):
        q = at(R_GL + 2.7 + 0.45 * i, kb, 1.58); furn.lathe("mug", [(0.0, 0.0), (0.04, 0.0), (0.042, 0.1), (0.038, 0.1), (0.036, 0.012), (0.0, 0.012)], M["ceramics"][i % 5], 24, q)
    lib.cyl("kettle", 0.08, 0.2, at(R_GL + 3.3, kb + tang(0.05), 0.94), M["steel"], verts=32, bevel=0.02)
    furn.ornament("fruit bowl", *at(R_GL + 4.2, kb + tang(0.05), 0.94)[:2], 0.94, 0.16, rnd, M["ceramics"])
    tb = b0 + tang(2.3)
    lib.cyl("round table", 0.55, 0.04, at(RM - 0.2, tb, 0.72), M["olive"], verts=64, bevel=0.01)
    lib.cyl("table stem", 0.06, 0.7, at(RM - 0.2, tb, 0.0), M["bronze_dark"], verts=24)
    for k in range(4):
        a_ = k * math.pi / 2 + 0.4; q = Vector(at(RM - 0.2, tb, 0.0)) + Vector((math.cos(a_), math.sin(a_), 0)) * 0.85
        furn.dining_chair("table chair", tuple(q), a_ + math.pi / 2, M)
    # the children's corner by the Glide at the far end: a play rug, a low table and stools, cushions, toys on a shelf
    cb = b1 - tang(2.4)
    play = furn.rug_material("play rug", (0.36, 0.42, 0.50), (0.70, 0.55, 0.30))
    lib.box("play rug", (3.0, 2.6, 0.014), at(R_GL + 1.7, cb, 0.007), play, bevel=0.006, rot_z=face_in(cb), segs=2)
    lib.cyl("low table", 0.42, 0.03, at(R_GL + 1.7, cb, 0.48), M["oak_top"], verts=48, bevel=0.008)
    for k in range(3):
        a_ = k * 2 * math.pi / 3; q = Vector(at(R_GL + 1.7, cb, 0.0)) + Vector((math.cos(a_), math.sin(a_), 0)) * 0.62
        lib.cyl("little stool", 0.14, 0.28, tuple(q), M["oak_easel"], verts=32, bevel=0.01)
    for k, col in enumerate(((0.55, 0.20, 0.10), (0.20, 0.30, 0.45), (0.62, 0.48, 0.18))):
        furn.cushion("floor cushion", (0.55, 0.55, 0.14), at(R_GL + 2.6, cb + tang(-0.7 + 0.7 * k), 0.08), (0, 0, face_in(cb)), lib.fabric("cushion %d" % k, col, 0.85, 0.4))
    crown.curved_box("toy shelf", R_GL + 0.3, R_GL + 0.65, b1 - FACE - tang(3.6, R_GL), b1 - FACE - tang(0.8, R_GL), 0.0, 0.62, M["walnut"])
    blocks = [lib.principled("block %d" % i, c, 0.6) for i, c in enumerate(((0.55, 0.18, 0.08), (0.18, 0.28, 0.45), (0.65, 0.50, 0.15), (0.25, 0.40, 0.22), (0.80, 0.78, 0.72)))]
    for i in range(14):
        bb = b1 - FACE - tang(3.4 - 0.18 * i, R_GL); s_ = rnd.choice((0.06, 0.08, 0.1))
        lib.box("block", (s_, s_, s_), at(R_GL + 0.48, bb, 0.62 + s_ / 2), rnd.choice(blocks), bevel=0.006, rot_z=rnd.uniform(0, 1))
    lib.instance_of(S["plant"], at(R_OUT - 0.7, b1 - tang(1.2), 0.0), 2.0, 1.9)
    lib.instance_of(S["plant"], at(R_GL + 0.8, b0 + tang(7.9), 0.0), 0.6, 1.7)
    CR.washers(b0, b1, 60)


# ---------------------------------------------------------------- C-22 the gallery
def gallery(M, rnd):
    """C-22, the gallery (279 to 288), between the sunset lounge and the library: Jim's paintings from the studio and
    his photographs of Mars, on white walls and on a wall standing free in the middle; oak boards, benches, lights
    on tracks aimed at each work"""
    b0, b1 = 279.0, 288.0
    mats(M)
    crown.ring_room(b0, b1, M, M["oak"], wall_mat=M["white_wall"])
    bc = (b0 + b1) / 2; wl = 8.0
    crown.curved_box("free wall", RM - 0.15, RM + 0.15, bc - tang(wl / 2), bc + tang(wl / 2), 0.0, 3.3, M["white_wall"])
    crown.curved_box("free wall plinth", RM - 0.16, RM + 0.16, bc - tang(wl / 2), bc + tang(wl / 2), 0.0, 0.06, M["shadow"])
    works = []                       # (painting material or picture, w, h, r, b, facing)
    fields = [((0.66, 0.30, 0.12), [(0.08, 0.92, 0.55, 0.92, (0.80, 0.50, 0.20)), (0.08, 0.92, 0.08, 0.5, (0.35, 0.10, 0.05))]),
              ((0.15, 0.17, 0.22), [(0.1, 0.9, 0.6, 0.9, (0.30, 0.40, 0.55)), (0.1, 0.9, 0.1, 0.52, (0.06, 0.07, 0.10))]),
              ((0.55, 0.48, 0.38), [(0.07, 0.93, 0.62, 0.93, (0.75, 0.66, 0.50)), (0.07, 0.93, 0.07, 0.56, (0.48, 0.28, 0.16))]),
              ((0.30, 0.10, 0.06), [(0.08, 0.92, 0.45, 0.92, (0.55, 0.18, 0.08)), (0.08, 0.92, 0.08, 0.40, (0.18, 0.05, 0.03))]),
              ((0.70, 0.62, 0.48), [(0.12, 0.88, 0.12, 0.88, (0.84, 0.74, 0.55))]),
              ((0.10, 0.12, 0.10), [(0.08, 0.92, 0.55, 0.92, (0.22, 0.30, 0.22)), (0.08, 0.92, 0.08, 0.5, (0.42, 0.36, 0.20))])]
    # paintings along the outer wall, under the slots
    for i, (g_, f_) in enumerate(fields[:4]):
        bb = b0 + tang(2.6) + i * tang(4.6, R_OUT); w, h = (1.6, 1.3) if i % 2 == 0 else (1.2, 1.5)
        pm = furn.painting_material("jim painting %d" % i, g_, f_)
        furn.painting("painting", w, h, at(R_OUT - 0.06, bb, 1.62), face_in(bb), pm, M["frame"])
        works.append((at(R_OUT - 0.06, bb, 1.62), 1))
    # on the free wall: two more paintings facing the slots, photographs of Mars facing the Glide
    for i, k in enumerate((-1, 1)):
        bb = bc + k * tang(2.0); pm = furn.painting_material("jim painting %d" % (4 + i), *fields[4 + i])
        furn.painting("painting", 1.9 if i == 0 else 1.4, 1.4, at(RM + 0.16, bb, 1.6), face_in(bb), pm, M["frame"])
        works.append((at(RM + 0.16, bb, 1.6), 1))
    for i, (img, w, h) in enumerate((("flight-cliffs.jpg", 1.5, 0.84), ("flight-crater.jpg", 1.1, 0.62), ("flight-west.jpg", 1.5, 0.84))):
        bb = bc + tang(-2.7 + 2.7 * i)
        CR.framed_print("mars photograph", CR.repo_file("palace", "design", "img", img), w, h, at(RM - 0.17, bb, 1.62), face_in(bb), M)
        works.append((at(RM - 0.17, bb, 1.62), -1))
    for (bb, img) in ((b0 + FACE + tang(0.02, RM), "flight-dunes.jpg"), (b1 - FACE - tang(0.02, RM), "mars-earth.jpg")):
        CR.framed_print("mars photograph", CR.repo_file("palace", "design", "img", img), 1.3, 0.73, at(RM, bb, 1.62), face_cw(bb) if bb < bc else face_ccw(bb), M)
    # benches of walnut and tan leather, one each side of the free wall
    for (r, k) in ((RM + 1.7, 1), (RM - 1.5, -1)):
        crown.curved_box("bench", r - 0.22, r + 0.22, bc - tang(0.9, r), bc + tang(0.9, r), 0.0, 0.38, M["walnut"])
        crown.curved_box("bench pad", r - 0.23, r + 0.23, bc - tang(0.92, r), bc + tang(0.92, r), 0.38, 0.45, M["leather_tan"])
    # lights on tracks hung at 4.6 m, each aimed at a work
    for r in (RM - 1.6, RM + 1.9):
        crown.curved_box("track", r - 0.02, r + 0.02, b0 + tang(1.0), b1 - tang(1.0), 4.6, 4.64, M["graphite"])
        for bb in (b0 + tang(2.0), b1 - tang(2.0)): lib.cyl("track rod", 0.006, ceil_at(bb) - 4.62, at(r, bb, 4.62), M["graphite"], verts=8)
    for (q, side) in works:
        rr = RM + 1.9 if side > 0 else RM - 1.6
        bb = math.degrees(math.atan2(q[0], q[1])) % 360
        frm = at(rr, bb, 4.55); sp = lib.spot_light("art light", frm, 120, (1.0, 0.92, 0.82), 0.03, 26, 0.35); aim(sp, frm, q)
    CR.washers(b0, b1, 40)


# ---------------------------------------------------------------- C-06 the dressing room
def hanging(r, bb, z_rail, M, rnd):
    """clothes on hangers along a rail: jackets, shirts, a coat, in Jim's colours"""
    cols = [(0.08, 0.09, 0.14), (0.75, 0.74, 0.70), (0.30, 0.26, 0.20), (0.45, 0.47, 0.50), (0.16, 0.12, 0.09), (0.62, 0.55, 0.42)]
    k = 0; n = 7
    for i in range(n):
        b_ = bb + tang(-0.38 + 0.76 * i / (n - 1), r); h = rnd.choice((0.75, 0.8, 1.05, 1.2)); c = rnd.choice(cols)
        lib.box("garment", (0.04, 0.5, h), at(r, b_, z_rail - 0.05 - h / 2), lib.fabric("garment %d" % (k % 6), c, 0.85, 0.3), bevel=0.012, rot_z=face_in(b_) + math.pi / 2 + rnd.uniform(-0.06, 0.06))
        lib.box("hanger", (0.012, 0.42, 0.02), at(r, b_, z_rail - 0.04), M["walnut"], rot_z=face_in(b_) + math.pi / 2)
        k += 1


def dressing_room(M, rnd):
    """C-06, the dressing room (108 to 116.64), next to the bedroom up: clothes for the day. Walnut wardrobes along the
    outer wall under the slots, some open on hanging clothes and folded shelves; an island of drawers; a long mirror;
    a bench; pale oak walls and a screen onto the Glide, as in the bedroom"""
    b0, b1 = 108.0, 116.64
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["oak_panel"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M); bc = (b0 + b1) / 2
    crown.curved_box("dress screen", R_GL + 0.05, R_GL + 0.2, b0 + tang(1.8, R_GL), b1, 0, 2.6, M["oak_panel"])
    # wardrobes: 1 m sections, closed doors and open bays in turn
    a = b0 + tang(0.7, R_OUT); W = tang(1.0, R_OUT - 0.3); n = int((b1 - tang(0.7, R_OUT) - a) / W)
    for k in range(n):
        s0, s1 = a + k * W, a + (k + 1) * W; sm = (s0 + s1) / 2; kind = ("door", "hang", "door", "shelves")[k % 4]
        crown.curved_box("wardrobe back", R_OUT - 0.08, R_OUT - 0.05, s0, s1, 0.0, 2.6, M["oak_panel"])
        for e in (s0, s1): crown.curved_box("wardrobe side", R_OUT - 0.66, R_OUT - 0.05, e - tang(0.012, R_OUT), e + tang(0.012, R_OUT), 0.0, 2.6, M["walnut_v"])
        crown.curved_box("wardrobe top", R_OUT - 0.66, R_OUT - 0.05, s0, s1, 2.56, 2.6, M["walnut"])
        crown.curved_box("wardrobe plinth", R_OUT - 0.62, R_OUT - 0.05, s0, s1, 0.0, 0.08, M["shadow"])
        if kind == "door":
            crown.curved_box("wardrobe door", R_OUT - 0.66, R_OUT - 0.64, s0 + tang(0.006, R_OUT), sm - tang(0.004, R_OUT), 0.09, 2.55, M["walnut_v"])
            crown.curved_box("wardrobe door", R_OUT - 0.66, R_OUT - 0.64, sm + tang(0.004, R_OUT), s1 - tang(0.006, R_OUT), 0.09, 2.55, M["walnut_v"])
            for s_ in (-1, 1): lib.box("pull", (0.012, 0.025, 0.6), at(R_OUT - 0.68, sm + s_ * tang(0.05, R_OUT), 1.2), M["bronze"], rot_z=face_in(sm))
        elif kind == "hang":
            crown.curved_box("rail", R_OUT - 0.36, R_OUT - 0.34, s0, s1, 1.95, 1.97, M["bronze"])
            hanging(R_OUT - 0.35, sm, 1.97, M, rnd)
            crown.curved_box("hat shelf", R_OUT - 0.62, R_OUT - 0.05, s0, s1, 2.1, 2.13, M["walnut"])
            crown.curved_box("strip light", R_OUT - 0.55, R_OUT - 0.53, s0 + tang(0.03, R_OUT), s1 - tang(0.03, R_OUT), 2.095, 2.1, lib.emission("wardrobe light", (1.0, 0.82, 0.6), 8))
        else:
            for z in (0.45, 0.85, 1.25, 1.65, 2.05):
                crown.curved_box("shelf", R_OUT - 0.62, R_OUT - 0.05, s0, s1, z, z + 0.025, M["walnut"])
                for j in range(2):
                    q = at(R_OUT - 0.32, s0 + (s1 - s0) * (0.28 + 0.44 * j), z + 0.025)
                    c = rnd.choice(((0.75, 0.74, 0.70), (0.10, 0.11, 0.16), (0.42, 0.40, 0.38), (0.55, 0.46, 0.34)))
                    for t in range(rnd.randint(3, 6)):
                        lib.box("folded", (0.32, 0.26, 0.045), (q[0], q[1], q[2] + 0.023 + t * 0.046), lib.fabric("folded %d" % int(c[0] * 100), c, 0.9, 0.3), bevel=0.01, rot_z=face_in(sm) + rnd.uniform(-0.04, 0.04))
            for j in range(3):          # shoes on the bottom
                q = at(R_OUT - 0.3, s0 + (s1 - s0) * (0.2 + 0.3 * j), 0.1)
                for s_ in (-0.05, 0.05):
                    lib.box("shoe", (0.1, 0.28, 0.08), (q[0] + s_ * math.cos(sm * D), q[1] - s_ * math.sin(sm * D), 0.14), M["leather"] if j != 1 else M["leather_tan"], bevel=0.03, rot_z=face_in(sm))
    # the island: walnut drawers, a glass top over watches and cufflinks
    L_ = 2.4
    crown.curved_box("island", RM - 0.1, RM + 0.75, bc - tang(L_ / 2), bc + tang(L_ / 2), 0.0, 0.88, M["walnut_v"])
    for z in (0.3, 0.6):
        crown.curved_box("drawer joint", RM - 0.105, RM - 0.1, bc - tang(L_ / 2 - 0.05), bc + tang(L_ / 2 - 0.05), z, z + 0.006, M["shadow"])
        crown.curved_box("drawer joint", RM + 0.75, RM + 0.755, bc - tang(L_ / 2 - 0.05), bc + tang(L_ / 2 - 0.05), z, z + 0.006, M["shadow"])
    crown.curved_box("island tray", RM - 0.05, RM + 0.7, bc - tang(L_ / 2 - 0.05), bc + tang(L_ / 2 - 0.05), 0.86, 0.88, M["leather_tan"])
    crown.curved_box("island glass", RM - 0.1, RM + 0.75, bc - tang(L_ / 2), bc + tang(L_ / 2), 0.93, 0.945, M["glass"])
    for i in range(6):
        q = at(RM + 0.32 + rnd.uniform(-0.15, 0.15), bc + tang(-0.9 + 0.36 * i), 0.885)
        lib.cyl("watch", 0.02, 0.012, q, M["steel"] if i % 2 else M["brass"], verts=24)
        lib.box("watch strap", (0.024, 0.16, 0.004), (q[0], q[1], q[2] + 0.002), M["leather"], rot_z=rnd.uniform(0, 3))
    # the long mirror on the partition by the Door, a bench, a pouf, a valet stand, a rug
    mb = b0 + FACE + tang(0.012, RM)
    lib.box("mirror", (1.0, 0.01, 2.1), at(RM + 1.0, mb, 1.1), M["mirror"], rot_z=face_cw(mb))
    lib.box("mirror frame", (1.06, 0.012, 2.16), at(RM + 1.0, mb - tang(0.005, RM), 1.1), M["bronze_dark"], rot_z=face_cw(mb))
    lib.box("bench", (1.6, 0.45, 0.45), at(RM - 1.0, bc, 0.225), M["bed_fabric"], bevel=0.03, rot_z=face_in(bc), segs=4)
    lib.instance_of(S["pouf"], at(RM + 0.3, bc + tang(2.4), 0.0), 0.0)
    lib.box("rug", (4.6, 3.4, 0.014), at(RM + 0.3, bc, 0.007), M["rug"], bevel=0.006, rot_z=face_in(bc), segs=2)
    vb = bc - tang(2.6)
    lib.cyl("valet pole", 0.012, 1.3, at(RM + 1.2, vb, 0.0), M["walnut"], verts=12)
    lib.box("valet bar", (0.44, 0.03, 0.03), at(RM + 1.2, vb, 1.3), M["walnut"], rot_z=face_in(vb))
    lib.box("jacket", (0.48, 0.04, 0.75), at(RM + 1.2, vb, 0.9), lib.fabric("garment 0", (0.08, 0.09, 0.14), 0.85, 0.3), bevel=0.015, rot_z=face_in(vb))
    lib.instance_of(S["plant"], at(R_GL + 0.6, b1 - tang(0.9), 0.0), 1.1, 1.7)
    downlights(b0, b1, 70)


# ---------------------------------------------------------------- C-08 the bath up
def bath_up(M, rnd):
    """C-08, the bath up (130.32 to 144), the master suite up's bath: a soaking tub of white stone by the slots, where
    the morning sun comes in; a walk-in shower behind glass; a double vanity under round mirrors; a closet for the
    lavatory; honed travertine and pale oak"""
    import pent_rooms
    b0, b1 = 130.32, 144.0
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["bath_trav"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M); bc = (b0 + b1) / 2
    crown.curved_box("bath screen", R_GL + 0.05, R_GL + 0.2, b0, b1 - tang(1.8, R_GL), 0, 2.6, M["oak_panel"])
    # the tub, hollowed, filled; a bronze filler; a stool with towels; candles
    tb = bc + tang(2.0); tq = at(R_OUT - 1.25, tb, 0.0)
    tub = lib.box("tub", (1.9, 0.95, 0.6), (tq[0], tq[1], 0.3), M["tub"], bevel=0.22, rot_z=face_in(tb), segs=6)
    cut = lib.box("tub hollow", (1.7, 0.75, 0.6), (tq[0], tq[1], 0.66), None, bevel=0.2, rot_z=face_in(tb), segs=6); cut.hide_render = True; cut.hide_viewport = True
    bo = tub.modifiers.new("hollow", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    water = pent_rooms.pool_water("bath water", (0.86, 0.95, 0.93))
    lib.box("tub water", (1.62, 0.68, 0.004), (tq[0], tq[1], 0.48), water, bevel=0.0, rot_z=face_in(tb))
    fb = tb - tang(1.15, R_OUT - 1.25)
    lib.cyl("filler", 0.02, 0.95, at(R_OUT - 1.25, fb, 0.0), M["bronze"], verts=16)
    lib.box("filler spout", (0.03, 0.28, 0.03), at(R_OUT - 1.25, fb + tang(0.12, R_OUT - 1.25), 0.95), M["bronze"], rot_z=face_cw(fb))
    sq = at(R_OUT - 2.45, tb, 0.0); lib.cyl("bath stool", 0.2, 0.45, sq, M["oak_top"], verts=32, bevel=0.01)
    for t in range(3): lib.box("towel", (0.36, 0.26, 0.05), (sq[0], sq[1], 0.47 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_in(tb) + 0.1 * t)
    for i in range(3):
        q = at(R_OUT - 0.25, tb + tang(-0.3 + 0.3 * i, R_OUT), 0.0)
        lib.cyl("candle", 0.04, 0.12 + 0.05 * i, q, lib.principled("wax", (0.85, 0.82, 0.74), 0.5, **{"Subsurface Weight": 0.4}), verts=24)
        lib.cyl("flame", 0.006, 0.02, (q[0], q[1], 0.135 + 0.05 * i), lib.emission("flame", (1.0, 0.6, 0.25), 20), verts=8)
    lib.instance_of(S["plant"], at(R_OUT - 0.7, tb + tang(1.8), 0.0), 2.2, 1.9)
    # the walk-in shower: a glass screen, a stone bench, a rain head from the ceiling, a line of drain
    sb = bc - tang(3.6); sw = tang(2.6, R_OUT - 1.2)
    crown.curved_box("shower glass", R_OUT - 2.3, R_OUT - 2.29, sb - sw / 2, sb + sw / 2 - tang(0.8, R_OUT - 2.3), 0.0, 2.4, M["glass"])
    crown.curved_box("shower side", R_OUT - 2.3, R_OUT - 0.05, sb - sw / 2 - tang(0.06, R_OUT), sb - sw / 2, 0.0, 2.4, M["bath_trav"])
    crown.curved_box("shower bench", R_OUT - 0.5, R_OUT - 0.05, sb - sw / 2, sb + sw / 2, 0.0, 0.45, M["bath_trav"])
    crown.curved_box("drain", R_OUT - 2.2, R_OUT - 2.15, sb - sw / 2 + tang(0.1, R_OUT), sb + sw / 2 - tang(0.1, R_OUT), 0.0, 0.004, M["shadow"])
    rq = at(R_OUT - 1.2, sb, 2.4)
    lib.cyl("rain head", 0.2, 0.02, rq, M["bronze"], verts=48); lib.cyl("rain pipe", 0.012, ceil_at(sb) - 2.42, (rq[0], rq[1], 2.42), M["bronze"], verts=12)
    # the double vanity: walnut, a stone top, bowls, round mirrors lit from behind
    vb = b0 + tang(4.0)
    lib.box("vanity", (2.6, 0.55, 0.42), at(R_OUT - 0.33, vb, 0.66), M["walnut_v"], bevel=0.008, rot_z=face_in(vb))
    lib.box("vanity top", (2.64, 0.57, 0.04), at(R_OUT - 0.33, vb, 0.89), M["marble"], bevel=0.004, rot_z=face_in(vb))
    for k in (-1, 1):
        bb = vb + k * tang(0.65, R_OUT - 0.4); q = at(R_OUT - 0.38, bb, 0.91)
        furn.lathe("basin", [(0.0, 0.0), (0.08, 0.0), (0.2, 0.06), (0.22, 0.14), (0.205, 0.14), (0.19, 0.07), (0.07, 0.02), (0.0, 0.02)], M["porcelain"], 48, q)
        lib.cyl("tap", 0.012, 0.3, at(R_OUT - 0.12, bb, 0.91), M["bronze"], verts=12)
        lib.box("spout", (0.02, 0.18, 0.02), at(R_OUT - 0.2, bb, 1.2), M["bronze"], rot_z=face_in(bb))
        mq = at(R_OUT - 0.07, bb, 1.65)
        lib.cyl("mirror", 0.4, 0.012, mq, M["mirror"], verts=64, rot=(math.pi / 2, 0, face_in(bb)))
        bpy.ops.mesh.primitive_torus_add(major_radius=0.41, minor_radius=0.01, major_segments=96, minor_segments=8, location=(mq[0], mq[1], mq[2]), rotation=(math.pi / 2, 0, face_in(bb)))
        bpy.context.active_object.name = "mirror light"; bpy.context.active_object.data.materials.append(lib.emission("mirror light", (1.0, 0.9, 0.78), 12))
    for t in range(4): lib.box("towel", (0.4, 0.28, 0.05), at(R_OUT - 0.3, vb + tang(1.6, R_OUT), 0.05 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_in(vb))
    # the lavatory's closet by the Glide at the near end, its door shut
    w0, w1 = b0 + FACE, b0 + tang(2.0, R_GL + 1.0)
    crown.curved_box("closet", R_GL + 0.2, R_GL + 2.2, w1 - tang(0.06, R_GL + 1.2), w1, 0.0, 2.6, M["oak_panel"])
    crown.curved_box("closet front", R_GL + 2.15, R_GL + 2.2, w0, w1, 0.0, 2.6, M["oak_panel"])
    crown.curved_box("closet door joint", R_GL + 2.2, R_GL + 2.205, w0 + tang(0.4, R_GL + 2.2), w0 + tang(0.41, R_GL + 2.2), 0.0, 2.1, M["shadow"])
    lib.box("closet handle", (0.04, 0.12, 0.02), at(R_GL + 2.23, w0 + tang(1.2, R_GL + 2.2), 1.05), M["bronze"], rot_z=face_in(w0))
    # a reading chair by the slots at the far end, a heated rail of towels
    cb = b1 - tang(2.6)
    lib.instance_of(S["chair"], at(R_OUT - 1.5, cb, 0.0), face_in(cb) - 0.5)
    furn.side_table("side table", at(R_OUT - 0.9, cb + tang(0.8), 0.0), M, r=0.25, h=0.5)
    for z in (0.5, 0.75, 1.0, 1.25):
        crown.curved_box("towel rail", R_OUT - 0.14, R_OUT - 0.12, b1 - FACE - tang(1.5, R_OUT), b1 - FACE - tang(0.4, R_OUT), z, z + 0.02, M["bronze"])
    lib.box("hung towel", (0.9, 0.04, 0.6), at(R_OUT - 0.17, b1 - FACE - tang(0.95, R_OUT), 1.0), M["towel"], bevel=0.015, rot_z=face_in(b1))
    downlights(b0, b1, 70)
    CR.washers(b0, b1, 40)


# ---------------------------------------------------------------- C-01 the suit room
def eva_suit(name, loc, rot_z, M, helmet=True):
    """a surface suit hung on its rack: a white torso and limbs in layered fabric, a backpack, grey boots and gloves,
    a helmet with a gold visor; its front looks along local -y"""
    g = furn.empty(name, loc, rot_z); o = []; s = M["suit"]; gy = M["suit_grey"]
    o.append(lib.box(name + " torso", (0.52, 0.34, 0.62), (0, 0, 1.47), s, bevel=0.1, segs=5))
    o.append(lib.box(name + " pack", (0.5, 0.24, 0.66), (0, 0.27, 1.45), s, bevel=0.05, segs=4))
    o.append(lib.cyl(name + " neck ring", 0.15, 0.06, (0, -0.02, 1.78), M["titanium"], verts=32))
    o.append(lib.box(name + " waist", (0.44, 0.3, 0.14), (0, 0, 1.12), gy, bevel=0.05, segs=4))
    for x in (-1, 1):
        o.append(lib.cyl(name + " thigh", 0.11, 0.5, (x * 0.12, 0, 0.58), s, verts=24, r2=0.095, bevel=0.03))
        o.append(lib.cyl(name + " shin", 0.095, 0.45, (x * 0.12, 0, 0.14), s, verts=24, r2=0.085, bevel=0.03))
        o.append(lib.box(name + " boot", (0.14, 0.3, 0.14), (x * 0.12, -0.05, 0.07), gy, bevel=0.04, segs=4))
        o.append(lib.cyl(name + " arm", 0.085, 0.32, (x * 0.33, 0, 1.38), s, verts=20, r2=0.075, bevel=0.03, rot=(0, x * 0.12, 0)))
        o.append(lib.cyl(name + " forearm", 0.075, 0.3, (x * 0.36, -0.02, 1.07), s, verts=20, r2=0.065, bevel=0.03, rot=(0, x * 0.06, 0)))
        o.append(lib.box(name + " glove", (0.09, 0.1, 0.16), (x * 0.37, -0.02, 0.98), gy, bevel=0.035, segs=4))
        o.append(lib.cyl(name + " hip joint", 0.115, 0.05, (x * 0.12, 0, 1.06), M["titanium"], verts=24))
    o.append(lib.box(name + " panel", (0.18, 0.04, 0.12), (0, -0.19, 1.48), gy, bevel=0.01))
    if helmet:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=0.17, location=(0, -0.01, 1.98)); h = bpy.context.active_object; h.name = name + " helmet"; h.data.materials.append(s)
        for p in h.data.polygons: p.use_smooth = True
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=0.172, location=(0, -0.04, 1.99)); v = bpy.context.active_object; v.name = name + " visor"; v.scale = (0.9, 0.75, 0.7); v.data.materials.append(M["visor"])
        for p in v.data.polygons: p.use_smooth = True
        o += [h, v]
    for x in o: x.parent = g
    return g


def suit_room(M, rnd):
    """C-01, the suit room (72 to 78), at the start of the Arrival part: the suits and the airlock, with a dust room,
    for going out onto the hull or the plain. Suits on lit racks along the outer wall; the airlock's round-cornered
    door at the far end, its dust room behind glass; benches, helmets on a shelf"""
    b0, b1 = 72.0, 78.0
    mats(M)
    crown.ring_room(b0, b1, M, M["rubber"], wall_mat=M["pale_grey"])
    bc = (b0 + b1) / 2
    # four suit racks: a steel frame, a light over each
    for i in range(4):
        sb = b0 + tang(2.4, R_OUT) + i * tang(2.3, R_OUT)
        crown.curved_box("rack back", R_OUT - 0.1, R_OUT - 0.06, sb - tang(0.6, R_OUT), sb + tang(0.6, R_OUT), 0.0, 2.6, M["graphite"])
        crown.curved_box("rack light", R_OUT - 0.62, R_OUT - 0.08, sb - tang(0.55, R_OUT), sb + tang(0.55, R_OUT), 2.55, 2.58, lib.emission("rack light", (0.92, 0.95, 1.0), 6))
        eva_suit("suit", at(R_OUT - 0.55, sb, 0.0), face_in(sb), M, helmet=(i % 2 == 0))
        for s_ in (-1, 1): crown.curved_box("rack post", R_OUT - 0.62, R_OUT - 0.06, sb + s_ * tang(0.62, R_OUT) - tang(0.02, R_OUT), sb + s_ * tang(0.62, R_OUT) + tang(0.02, R_OUT), 0.0, 2.6, M["steel"])
    # the airlock: a door with round corners and a porthole in a steel wall across the ring at the near end
    ab = b0 + FACE
    crown.curved_box("airlock wall", R_GL + 0.05, R_OUT, ab, ab + tang(0.25, RM), 0.0, 3.0, M["steel"])
    dq = at(RM + 0.4, ab + tang(0.27, RM), 1.05)
    lib.box("airlock door", (1.05, 0.08, 2.05), dq, M["pale_grey"], bevel=0.2, rot_z=face_cw(ab), segs=6)
    lib.cyl("porthole", 0.14, 0.09, at(RM + 0.4, ab + tang(0.25, RM), 1.5), M["pod_glass"], verts=32, rot=(math.pi / 2, 0, face_cw(ab)))
    lib.box("hazard band", (0.6, 1.6, 0.004), at(RM + 0.4, ab + tang(0.75, RM), 0.002), M["hazard"], rot_z=face_in(ab))
    CR.screen("airlock panel", CR.repo_file("palace", "design", "img", "mars-map.jpg"), 0.3, 0.2, at(RM - 0.6, ab + tang(0.27, RM), 1.2), face_cw(ab), M, emit=1.6)
    # the dust room: a glass booth with a grille floor and air jets, by the airlock
    db0, db1 = b0 + tang(0.6, R_GL + 1.2), b0 + tang(2.4, R_GL + 1.2)
    for r in (R_GL + 0.25, R_GL + 2.2): crown.curved_box("booth glass", r, r + 0.012, db0, db1, 0.0, 2.4, M["glass"])
    crown.curved_box("booth glass", R_GL + 0.25, R_GL + 2.2, db1, db1 + tang(0.012, R_GL + 1.2), 0.0, 2.4, M["glass"])
    crown.curved_box("booth roof", R_GL + 0.25, R_GL + 2.2, db0, db1, 2.4, 2.45, M["steel"])
    crown.curved_box("grille", R_GL + 0.3, R_GL + 2.15, db0, db1, 0.0, 0.02, lib.principled("grille", (0.05, 0.05, 0.05), 0.5, 0.8))
    for i in range(6):
        for z in (0.6, 1.2, 1.8): lib.cyl("air jet", 0.025, 0.05, at(R_GL + 2.18, db0 + (db1 - db0) * (i + 0.5) / 6, z), M["steel"], verts=12, rot=(math.pi / 2, 0, face_out((db0 + db1) / 2)))
    # benches, boots under them, helmets on a shelf on the partition
    for k in (-1, 1):
        bb = bc + k * tang(1.3)
        crown.curved_box("bench", RM - 0.25, RM + 0.25, bb - tang(0.9), bb + tang(0.9), 0.0, 0.42, M["steel"])
        crown.curved_box("bench pad", RM - 0.25, RM + 0.25, bb - tang(0.9), bb + tang(0.9), 0.42, 0.47, M["leather"])
    sh = b1 - FACE - tang(0.02, RM)
    crown.curved_box("helmet shelf", R_GL + 1.0, R_GL + 3.4, sh - tang(0.32, RM), sh, 1.5, 1.53, M["steel"])
    for i in range(3):
        q = at(R_GL + 1.4 + 0.8 * i, sh - tang(0.17, RM), 1.7)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=0.17, location=q); h = bpy.context.active_object; h.name = "helmet"; h.data.materials.append(M["suit"])
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=0.172, location=q); v = bpy.context.active_object; v.name = "visor"; v.scale = (0.75, 0.9, 0.7); v.data.materials.append(M["visor"])
        v.location = (q[0], q[1], q[2] + 0.01); v.rotation_euler = (0, 0, face_ccw(sh) + math.pi / 2)
        for p in list(h.data.polygons) + list(v.data.polygons): p.use_smooth = True
    for i in range(4):
        q = at(RM, bc + tang(-1.9 + 1.25 * i), 0.0)
        for s_ in (-0.08, 0.08): lib.box("boot", (0.14, 0.3, 0.14), (q[0] + s_ * math.cos(bc * D), q[1] - s_ * math.sin(bc * D), 0.07), M["suit_grey"], bevel=0.04, rot_z=face_in(bc))
    downlights(b0, b1, 90, (0.92, 0.95, 1.0), every=2.4)


# ---------------------------------------------------------------- C-02 the pod hangar
def pod(name, loc, rot_z, M):
    """a pod for four: a white body shaped like a drop, a dark canopy round its upper front, four short legs; its nose
    along local +x"""
    g = furn.empty(name, loc, rot_z)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co; t = (x + 1) / 2                         # nose at +x, a fuller tail
        v.co = Vector((x * 2.3, y * 1.15 * (0.75 + 0.35 * (1 - t) ** 0.5) / 1.0, z * 0.95 * (0.85 + 0.2 * (1 - t))))
    for f in bm.faces:
        c = f.calc_center_median(); f.smooth = True
        f.material_index = 1 if (c.z > 0.12 and c.x > -0.9) or (c.x > 1.55 and c.z > -0.25) else (2 if abs(c.z + 0.18) < 0.035 else 0)
    body = lib.mesh_obj(name + " body", bm, [M["pod_white"], M["pod_glass"], M["graphite"]], smooth=True); body.parent = g; body.location = (0, 0, 1.25)
    for x, y in ((1.2, 0.7), (1.2, -0.7), (-1.3, 0.75), (-1.3, -0.75)):
        lg = lib.cyl(name + " leg", 0.06, 0.6, (x, y, 0.08), M["titanium"], verts=16); lg.parent = g
        pd = lib.cyl(name + " pad", 0.16, 0.06, (x, y, 0.02), M["graphite"], verts=24, bevel=0.01); pd.parent = g
    for y in (-0.45, 0.45):
        hl = lib.box(name + " lamp", (0.05, 0.18, 0.04), (2.22, y, 1.05), lib.emission("pod lamp", (0.95, 0.97, 1.0), 20)); hl.parent = g
    return g


def pod_hangar(M, rnd):
    """C-02, the pod hangar (78 to 91.44): the pods dock here, through a door in the outer wall. One pod on its pad, the
    other pad empty (its pod out on the plain), the great door shut, yellow lines on dark stone, floodlights; the Door
    into Arrival at the far end"""
    b0, b1 = 78.0, 91.44
    mats(M)
    crown.ring_room(b0, b1, M, M["basalt"])
    bc = (b0 + b1) / 2
    # the great door in the outer wall, under the slots: steel leaves with their joints, a frame
    dw = tang(7.0, R_OUT)
    crown.curved_box("hangar door", R_OUT - 0.1, R_OUT - 0.05, bc - dw / 2, bc + dw / 2, 0.0, 2.85, M["steel"])
    for bb in crown.steps(bc - dw / 2, bc + dw / 2, 1.0 / tang(1.75, R_OUT)):
        crown.curved_box("door joint", R_OUT - 0.105, R_OUT - 0.1, bb - tang(0.006, R_OUT), bb + tang(0.006, R_OUT), 0.0, 2.85, M["shadow"])
    for z in (0.95, 1.9): crown.curved_box("door joint", R_OUT - 0.105, R_OUT - 0.1, bc - dw / 2, bc + dw / 2, z, z + 0.008, M["shadow"])
    crown.curved_box("door frame", R_OUT - 0.2, R_OUT - 0.05, bc - dw / 2 - tang(0.2, R_OUT), bc - dw / 2, 0.0, 3.0, M["bronze_dark"])
    crown.curved_box("door frame", R_OUT - 0.2, R_OUT - 0.05, bc + dw / 2, bc + dw / 2 + tang(0.2, R_OUT), 0.0, 3.0, M["bronze_dark"])
    crown.curved_box("hazard band", R_OUT - 1.0, R_OUT - 0.4, bc - dw / 2, bc + dw / 2, 0.0, 0.004, M["hazard"])
    # two pads: one pod home, one away
    for k, there in ((-1, True), (1, False)):
        pb = bc + k * tang(7.6); q = at(RM + 0.2, pb, 0.0)
        lib.cyl("pad", 2.9, 0.05, q, M["graphite"], verts=96, bevel=0.01)
        furn.ring_prism("pad ring", [(q[0] + 2.6 * math.cos(2 * math.pi * i / 96), q[1] + 2.6 * math.sin(2 * math.pi * i / 96)) for i in range(96)],
                        [(q[0] + 2.45 * math.cos(2 * math.pi * i / 96), q[1] + 2.45 * math.sin(2 * math.pi * i / 96)) for i in range(96)], 0.05, 0.054, M["hazard"])
        if there: pod("pod", (q[0], q[1], 0.05), face_cw(pb), M)
    # yellow lines along the ring, tool chests by the Glide side, a charging post
    for r in (R_GL + 1.0, R_OUT - 1.4): crown.curved_box("floor line", r - 0.05, r + 0.05, b0 + tang(0.6), b1 - tang(0.6), 0.0, 0.003, M["hazard"])
    for i in range(3):
        cb = b0 + tang(1.6) + i * tang(1.1, R_GL + 0.6)
        lib.box("tool chest", (1.0, 0.55, 1.05), at(R_GL + 0.6, cb, 0.525), M["graphite"], bevel=0.01, rot_z=face_in(cb))
        for z in (0.3, 0.55, 0.8): lib.box("drawer pull", (0.6, 0.02, 0.02), at(R_GL + 0.89, cb, z), M["steel"], rot_z=face_in(cb))
    cpb = bc - tang(3.4)
    lib.box("charging post", (0.35, 0.35, 1.6), at(RM - 1.4, cpb, 0.8), M["pale_grey"], bevel=0.02, rot_z=face_in(cpb))
    lib.box("charging light", (0.36, 0.01, 0.08), at(RM - 1.58, cpb, 1.3), lib.emission("charge light", (0.4, 0.9, 0.6), 6), rot_z=face_in(cpb))
    # floodlights high on both walls, aimed down at the pads
    for k in (-1, 1):
        pb = bc + k * tang(7.6)
        for (r, d) in ((R_IN + 0.6, 1), (R_OUT - 0.6, -1)):
            frm = at(r, pb, 6.0); sp = lib.spot_light("flood", frm, 900, (0.95, 0.96, 1.0), 0.08, 60, 0.6); aim(sp, frm, at(RM + 0.2, pb, 0.0))
    downlights(b0, b1, 80, (0.95, 0.96, 1.0), every=3.4)


MORE = {
    "suit": dict(build=suit_room, span=(72.0, 78.0), sun=(80.0, 12.0), cams={
        "suit": dict(loc=at(R_GL + 0.6, 77.4, 1.5), target=at(R_OUT - 0.8, 73.6, 1.3), lens=20),
    }, stops={"suit": at(RM, 75.6, 0.0)}),
    "hangar": dict(build=pod_hangar, span=(78.0, 91.44), sun=(80.0, 12.0), cams={
        "hangar": dict(loc=at(R_GL + 0.5, 90.6, 1.6), target=at(RM + 0.4, 81.4, 1.0), lens=18),
    }, stops={"hangar": at(RM - 1.0, 84.7, 0.0)}),
    "dressing": dict(build=dressing_room, span=(108.0, 116.64), sun=(112.0, 10.0), cams={
        "dressing": dict(loc=at(R_GL + 0.5, 115.9, 1.5), target=at(R_OUT - 0.5, 110.0, 1.2), lens=20),
    }, stops={"dressing": at(RM - 0.6, 112.3, 0.0)}),
    "bath_up": dict(build=bath_up, span=(130.32, 144.0), sun=(130.0, 14.0), cams={
        "bath_up": dict(loc=at(R_GL + 0.6, 141.8, 1.5), target=at(R_OUT - 1.0, 136.9, 0.9), lens=20),
        "bath_up2": dict(loc=at(RM - 0.5, 133.3, 1.5), target=at(R_OUT - 0.2, 137.5, 1.4), lens=20),
    }, stops={"bath_up": at(RM - 0.6, 137.0, 0.0)}),
    "wine": dict(build=wine_room, span=(216.0, 223.2), sun=(222.0, 22.0), cams={
        "wine": dict(loc=at(R_GL + 0.55, 222.5, 1.5), target=at(R_OUT - 0.6, 217.2, 1.3), lens=20),
    }, stops={"wine": at(RM - 0.5, 219.0, 0.0)}),
    "kitchen_up": dict(build=chefs_kitchen, span=(241.2, 252.0), sun=(246.0, 18.0), cams={
        "kitchen_up": dict(loc=at(R_GL + 0.6, 251.2, 1.6), target=at(R_OUT - 0.8, 244.0, 1.1), lens=19),
    }, stops={"kitchen_up": at(RM - 1.6, 246.6, 0.0)}),
    "day_room": dict(build=guests_day_room, span=(252.0, 261.0), sun=(258.0, 14.0), cams={
        "day_room": dict(loc=at(R_GL + 0.6, 260.4, 1.5), target=at(R_OUT - 0.6, 254.5, 1.1), lens=19),
    }, stops={"day_room": at(RM - 0.6, 256.4, 0.0)}),
    "gallery": dict(build=gallery, span=(279.0, 288.0), sun=(284.0, 14.0), cams={
        "gallery": dict(loc=at(R_GL + 0.6, 287.4, 1.6), target=at(R_OUT - 0.4, 281.4, 1.5), lens=20),
    }, stops={"gallery": at(RM + 1.0, 283.5, 0.0)}),
}
