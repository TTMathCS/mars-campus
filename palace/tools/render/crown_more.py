"""The Crown's rooms that crown_rooms.py did not have yet, so the ring is whole (for the stills, the 360s and the walk
round it): each built from its line in the room program (palace/tools/room_program.py), in the same frame and with the
same helpers as crown_rooms.py, which adds these to its ROOMS.
  C-01 Suit room, C-02 Pod hangar (part 1, Arrival); C-06 Dressing room, C-08 Bath up (part 2, the master suite up);
  C-16 Wine room, C-18 Chef's kitchen (part 5, Dining); C-20 Guests' lounge, C-22 Gallery (part 6, Sunset)."""
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
    dinners and served from here (furnishing.py). The wine wall along the cross wall, away from the sun: bays of
    bottles lying necks out behind glass, lit from behind, 3.6 m tall; a serving island of walnut and marble; by the
    windows a leather banquette and two club chairs round a stone table, Caravaggio's Basket of Fruit over it; an
    olive in terracotta; clear glass onto the Glide with a door"""
    import club, seating, tables, lights, plants
    b0, b1 = 216.0, 223.2
    mats(M); club.materials(M)
    crown.ring_room(b0, b1, M, M["basalt"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
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
    # the wine wall on the cross wall at b0: bays 1.15 m wide from near the glass to near the windows, 3.6 m tall
    W, H, D_ = 1.15, 3.6, 0.6; w0 = b0 + FACE; r_a, r_b = R_GL + 1.7, R_OUT - 1.5
    nb = int((r_b - r_a) / W); ra0 = (r_a + r_b) / 2 - nb * W / 2
    back = lib.emission("rack light", (1.0, 0.78, 0.52), 1.6)
    for k in range(nb):
        ra, rc = ra0 + k * W, ra0 + (k + 1) * W; rr = (ra + rc) / 2
        dp = lambda d: w0 + tang(d, rr)
        crown.curved_box("wine back", ra, rc, dp(0.01), dp(0.03), 0.12, H - 0.08, back)
        for e in (ra, rc): crown.curved_box("wine fin", e - 0.015, e + 0.015, w0, dp(D_), 0.0, H, M["walnut_v"])
        crown.curved_box("wine plinth", ra, rc, w0, dp(D_), 0.0, 0.12, M["walnut"])
        crown.curved_box("wine top", ra, rc, w0, dp(D_), H - 0.08, H, M["walnut"])
        pts = []
        for i in range(int((H - 0.3) / 0.13)):
            z = 0.2 + i * 0.13
            for j in range(9):
                t = (j + 0.5) / 9; pts.append(at(ra + (rc - ra) * (0.06 + 0.88 * t), dp(0.06 + rnd.uniform(0.0, 0.02)), z))   # the base at the back, the neck out
        club.instancer("wine rack %d" % k, pts, src, (0.0, 0.0, face_ccw(b0)))
        crown.curved_box("wine glass door", ra + 0.02, rc - 0.02, dp(D_ + 0.01), dp(D_ + 0.02), 0.13, H - 0.09, M["glass"])
        lib.box("wine pull", (0.5, 0.03, 0.015), at(rc - 0.08, dp(D_ + 0.04), 1.35), M["bronze"], rot_z=face_cw(b0) + math.pi / 2)
    crown.curved_box("wine cornice", ra0, ra0 + nb * W, w0, w0 + tang(D_ + 0.06, RM), H, H + 0.06, M["walnut"])
    # the serving island: walnut and marble along the ring, the decanter, glasses, olives
    bc = (b0 + b1) / 2 + 0.6; L_ = 4.0; ri = RM - 1.2
    crown.curved_box("counter", ri - 0.35, ri + 0.35, bc - tang(L_ / 2, ri), bc + tang(L_ / 2, ri), 0.0, 0.96, M["walnut_v"])
    crown.curved_box("counter top", ri - 0.45, ri + 0.45, bc - tang(L_ / 2 + 0.05, ri), bc + tang(L_ / 2 + 0.05, ri), 0.96, 1.0, M["marble"])
    crown.curved_box("counter kick", ri - 0.3, ri + 0.3, bc - tang(L_ / 2 - 0.05, ri), bc + tang(L_ / 2 - 0.05, ri), 0.0, 0.08, M["shadow"])
    for i, w in enumerate((0.06, 0.0, 0.05, 0.03, 0.0, 0.04)):
        bb = bc - tang(1.4, ri) + i * tang(0.5, ri); club.wine_glass("wine glass", at(ri + 0.15, bb, 1.0), M, wine=w)
    for i in range(3): standing(src, at(ri - 0.2, bc + tang(0.7 + i * 0.12, ri), 1.0), rnd.uniform(0, 6), "standing bottle")
    furn.lathe("decanter", [(0.0, 0.0), (0.06, 0.0), (0.105, 0.04), (0.11, 0.08), (0.07, 0.14), (0.025, 0.2), (0.022, 0.32), (0.03, 0.34), (0.0, 0.34)], M["crystal"], 40, at(ri - 0.1, bc - tang(0.4, ri), 1.0))
    furn.lathe("decanted wine", [(0.0, 0.003), (0.058, 0.003), (0.1, 0.04), (0.104, 0.065), (0.0, 0.065)], M["wine"], 40, at(ri - 0.1, bc - tang(0.4, ri), 1.0))
    lib.import_glb(os.path.join(CR.A, "IridescentDishWithOlives.glb"), at(ri, bc + tang(1.4, ri), 1.0), 0.0, 0.8, name="olives")
    lights.globes("counter globes", at(ri, bc), n=7, spread=1.5, low=2.1, high=2.8, ceiling=ceil_at(bc), watts=45, seed=4)
    # by the windows: a leather banquette along the cross wall at b1, a stone table, two club chairs; Caravaggio over it
    oxblood = seating.fabric("oxblood leather", (0.20, 0.045, 0.035), "leather")
    rb = R_OUT - 3.6; bq = b1 - FACE - tang(0.62, rb)
    seating.sofa("wine banquette", at(rb, bq, 0.0), face_ccw(b1), length=4.0, depth=1.05, fabric_mat=oxblood, seed=290)
    tables.coffee_table("wine table", at(rb, bq - tang(1.45, rb), 0.0), face_ccw(b1), length=1.3, kind="round",
                        mat=seating.stone("wine travertine", (0.74, 0.66, 0.55), (0.55, 0.47, 0.38), "travertine", 0.3))
    for s_ in (-1, 1):
        q = rb + s_ * 1.05; bb = bq - tang(2.55, q)
        seating.club_chair("wine chair", at(q, bb, 0.0), face_cw(bb) + s_ * 0.35, fabric_mat=seating.fabric("moss velvet", (0.16, 0.20, 0.12), "velvet"), seed=291 + s_)
    CR.paint("wine painting", "caravaggio_basket_of_fruit", 2.2, at(rb, b1 - FACE - tang(0.02, rb), 0.0), face_ccw(b1), 2.15)
    plants.make("olive", at(R_OUT - 1.3, b0 + tang(1.0, R_OUT - 1.3), 0.0), seed=295, pot=(1.2, 0.8, "terracotta"), height=3.0, stems=2)
    lights.halo("wine halo", at(rb, bq - tang(1.45, rb)), d=4.0, z=4.5, ceiling=ceil_at(bq), watts=800)
    # a tasting group by the glass, clear of the door: two oxblood sofas facing across a travertine table
    tb = b1 - tang(3.4, R_GL + 3.4); rt = R_GL + 3.4
    for s_ in (-1, 1):
        bb = tb + s_ * tang(1.35, rt)
        seating.sofa("tasting sofa", at(rt, bb, 0.0), face_ccw(bb) if s_ > 0 else face_cw(bb), length=3.2, fabric_mat=oxblood, seed=296 + s_)
    tables.coffee_table("tasting table", at(rt, tb, 0.0), face_cw(tb), length=2.0, width=0.9, kind="slab",
                        mat=seating.stone("wine travertine", (0.74, 0.66, 0.55), (0.55, 0.47, 0.38), "travertine", 0.3))
    lights.halo("tasting halo", at(rt, tb), d=3.4, z=4.2, ceiling=ceil_at(tb), watts=600)
    # chosen plants: a red maple at the windows, a kentia by the glass at the wine wall's end
    plants.make("japanese maple", at(R_OUT - 1.6, (b0 + b1) / 2 - 0.6, 0.0), seed=297, pot=(1.3, 0.62, "basalt"), height=3.6, colour="red", stems=3)
    plants.make("kentia palm", at(R_GL + 1.3, b0 + tang(1.6, R_GL + 1.3), 0.0), seed=298, pot=(0.95, 0.72, "black"), height=3.4, stems=3)
    crown.glass_wall("wine glass", R_GL + 0.2, b0, b1, M, state="clear", doors=[((b0 + b1) / 2, 2.2)])
    crown.glide_lights(b0, b1)
    CR.washers(b0, b1, 160)


def pot(name, loc, M, r=0.12, h=0.14, mat=None, lid=False):
    mat = mat or M["copper"]
    g = furn.lathe(name, [(0.0, 0.0), (r * 0.92, 0.0), (r, 0.015), (r, h), (r * 0.94, h), (r * 0.94, 0.02), (0.0, 0.02)], mat, 32, loc)
    if lid: furn.lathe(name + " lid", [(0.0, h + 0.03), (r * 0.98, h), (r, h - 0.005), (0.0, h - 0.005)], mat, 32, loc)
    return g


def chefs_kitchen(M, rnd):
    """C-18, the chef's kitchen (241.2 to 252), next to the dining hall: it cooks for the dinners (furnishing.py). The
    cooking line along the cross wall at 252 under one long hood, white glazed tiles behind it, so the windows stay
    clear; two prep islands under rails of copper pans; a leather banquette for breakfast along the windows with its
    oak table; lavender in pots by the glass; frosted glass onto the Glide with a door"""
    import seating, tables, lights, plants
    b0, b1 = 241.2, 252.0
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    st = M["steel"]; bc = (b0 + b1) / 2; w1 = b1 - FACE
    ra, rb = R_GL + 2.2, R_OUT - 1.4; rc = (ra + rb) / 2
    dp = lambda d: w1 - tang(d, RM)                  # d metres out from the cross wall's face
    crown.curved_box("tiles", ra - 0.3, rb + 0.3, dp(0.02), w1, 0.0, 2.9, M["tiles"])
    # the cooking line: steel cabinets and worktop, the range in the middle under the hood
    crown.curved_box("line", ra, rb, dp(0.8), dp(0.02), 0.1, 0.88, st)
    crown.curved_box("line kick", ra + 0.05, rb - 0.05, dp(0.74), dp(0.02), 0.0, 0.1, M["shadow"])
    crown.curved_box("line top", ra - 0.02, rb + 0.02, dp(0.82), dp(0.02), 0.88, 0.92, st)
    r = ra + 0.6
    while r < rb - 0.3:                               # the cabinet doors' joints
        crown.curved_box("door joint", r - 0.003, r + 0.003, dp(0.805), dp(0.8), 0.12, 0.86, M["shadow"]); r += 0.6
    crown.curved_box("range top", rc - 1.5, rc + 1.5, dp(0.8), dp(0.1), 0.92, 0.95, M["graphite"])
    iron = lib.principled("cast iron", (0.02, 0.02, 0.02), 0.6, 0.7)
    for i in range(6):
        for d in (0.28, 0.62):
            q = at(rc - 1.5 + 0.35 + i * 0.46, dp(d), 0.95)
            lib.cyl("burner", 0.1, 0.02, q, iron, verts=24); lib.cyl("burner cap", 0.035, 0.03, q, iron, verts=16)
    for i in range(8): lib.cyl("knob", 0.022, 0.04, at(rc - 1.5 + 0.25 + i * 0.36, dp(0.82), 0.8), st, verts=16, rot=(math.pi / 2, 0, face_ccw(b1)))
    crown.curved_box("hood", rc - 1.8, rc + 1.8, dp(1.15), dp(0.02), 2.05, 2.9, st)
    crown.curved_box("hood light", rc - 1.5, rc + 1.5, dp(1.1), dp(1.05), 2.04, 2.05, lib.emission("hood light", (1.0, 0.9, 0.78), 30))
    for k in (-1, 1): pot("stock pot", at(rc + k * 1.1, dp(0.45), 0.95), M, 0.17, 0.3, st, lid=True)
    pot("sauce pan", at(rc - 0.4, dp(0.3), 0.97), M, 0.11, 0.1)
    pot("pan", at(rc + 0.5, dp(0.62), 0.97), M, 0.14, 0.06, M["graphite"])
    for sr in (ra + 1.4, rb - 1.4):                 # sinks at either end of the line, tall bronze taps
        crown.curved_box("sink", sr - 0.45, sr + 0.45, dp(0.7), dp(0.25), 0.915, 0.921, M["graphite"])
        lib.cyl("tap", 0.015, 0.42, at(sr, dp(0.16), 0.92), M["bronze"], verts=12)
        lib.box("spout", (0.03, 0.3, 0.03), at(sr, dp(0.3), 1.32), M["bronze"], rot_z=face_ccw(b1))
    for (sa, sz) in ((ra, rc - 2.3), (rc + 2.3, rb)):  # open shelves where there is no hood: plates, bowls, jars
        for z in (1.55, 2.05, 2.55):
            crown.curved_box("shelf", sa, sz, dp(0.4), dp(0.02), z, z + 0.03, st)
            r = sa + 0.25
            while r < sz - 0.3:
                k = rnd.random(); q = at(r, dp(0.22), z + 0.03)
                if k < 0.4:
                    for n in range(rnd.randint(4, 9)): lib.cyl("plate", 0.12, 0.012, (q[0], q[1], q[2] + n * 0.014), M["porcelain"], verts=32)
                elif k < 0.7: furn.ornament("bowl", q[0], q[1], q[2], 0.18, rnd, M["ceramics"])
                else: lib.cyl("jar", 0.06, 0.2, q, lib.glass("jar glass", (0.95, 0.97, 0.95)), verts=24)
                r += rnd.uniform(0.3, 0.45)
    # two prep islands under rails of copper pans, alabaster pendants over them
    for k in (-1, 1):
        ib = bc - tang(0.8) + k * tang(3.0); L_ = 3.4
        crown.curved_box("island", RM - 1.05, RM - 0.05, ib - tang(L_ / 2), ib + tang(L_ / 2), 0.1, 0.88, st)
        crown.curved_box("island kick", RM - 1.0, RM - 0.1, ib - tang(L_ / 2 - 0.05), ib + tang(L_ / 2 - 0.05), 0.0, 0.1, M["shadow"])
        crown.curved_box("island top", RM - 1.08, RM - 0.02, ib - tang(L_ / 2 + 0.03), ib + tang(L_ / 2 + 0.03), 0.88, 0.93, M["marble"] if k < 0 else st)
        for j in range(3):
            q = at(RM - 0.55 + rnd.uniform(-0.2, 0.2), ib + tang(-1.0 + j, RM), 0.93)
            lib.box("board", (0.5, 0.32, 0.03), (q[0], q[1], q[2] + 0.015), M["oak_top"], bevel=0.006, rot_z=face_in(ib) + rnd.uniform(-0.3, 0.3))
            furn.ornament("bowl", q[0] + 0.3, q[1], q[2], 0.16, rnd, M["ceramics"])
        rz = 2.3; ri = RM - 0.55
        crown.curved_box("pan rail", ri - 0.45, ri + 0.45, ib - tang(1.4), ib + tang(1.4), rz, rz + 0.03, st)
        for e in (ib - tang(1.3), ib + tang(1.3)): lib.cyl("rail rod", 0.01, ceil_at(e) - rz, at(ri, e, rz), st, verts=8)
        for j in range(7):
            bb = ib + tang(-1.2 + 0.4 * j); rr = 0.08 + 0.025 * (j % 3)
            lib.cyl("hook", 0.004, 0.14, at(ri, bb, rz - 0.14), st, verts=6)
            pot("hanging pan", at(ri, bb, rz - 0.14 - 2 * rr), M, rr, 0.08 + 0.02 * (j % 2))
        for j in (-1, 1): lights.alabaster_pendant("island pendant", at(ri + 0.9, ib + j * tang(1.0, ri + 0.9)), z=2.0, ceiling=ceil_at(ib), d=0.3, h=0.42, watts=60)
    # the breakfast banquette along the windows, its table and two chairs; lavender by the glass
    bq = b0 + tang(5.2, R_OUT - 0.75); rq = R_OUT - 0.75
    seating.sofa("kitchen banquette", at(rq, bq, 0.0), face_in(bq), length=5.0, depth=1.0, fabric_mat=seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather"), arms=False, bend=rq, seed=300)
    tables.dining_table("banquette table", at(rq - 1.25, bq, 0.0), face_in(bq), length=3.6, width=0.9, mat=M["oak_top"], base=M["bronze_dark"])
    for k in (-1, 1):
        bb = bq + k * tang(0.9, rq - 2.1)
        seating.dining_chair("banquette chair", at(rq - 2.1, bb, 0.0), face_out(bb), fabric_mat=seating.fabric("kitchen linen", (0.66, 0.58, 0.45), "linen"), seed=301 + k)
    lights.globes("banquette globes", at(rq - 1.25, bq), n=5, spread=1.2, low=2.0, high=2.6, ceiling=ceil_at(bq), watts=45, seed=12)
    lights.halo("kitchen halo", at(RM - 0.55, bc - tang(0.8)), d=5.0, z=4.6, ceiling=ceil_at(bc), watts=1200)
    # chosen plants: a lemon by the banquette, an olive and a fiddle-leaf fig by the glass
    plants.make("lemon", at(R_OUT - 1.4, b0 + tang(1.6, R_OUT - 1.4), 0.0), seed=309, pot=(1.0, 0.75, "terracotta"), height=2.6)
    plants.make("olive", at(R_GL + 1.6, b0 + tang(2.0, R_GL + 1.6), 0.0), seed=310, pot=(1.2, 0.8, "terracotta"), height=3.2, stems=2)
    plants.make("fiddle-leaf fig", at(R_GL + 1.5, b1 - tang(2.4, R_GL + 1.5), 0.0), seed=311, pot=(0.8, 0.66, "white"), height=2.8)
    for k in range(4):
        bb = bq + tang(3.4 + 1.2 * k, R_OUT - 0.7); plants.make("lavender", at(R_OUT - 0.7, bb, 0.0), seed=305 + k, pot=(0.55, 0.42, "terracotta"), size=0.6)
    # the chef's table between the islands and the windows: oak, 4.8 m, eight upholstered chairs, globes over it
    ct, cr = 247.6, RM + 4.2
    tables.dining_table("chef's table", at(cr, ct, 0.0), face_in(ct), length=4.8, width=1.2, mat=M["oak_top"], base=M["bronze_dark"])
    sage = seating.fabric("kitchen sage", (0.30, 0.34, 0.26), "linen")
    for k in range(8):
        side = 1 if k < 4 else -1; bb = ct + tang(-1.65 + 1.1 * (k % 4), cr + side * 1.05)
        seating.dining_chair("chef's chair", at(cr + side * 1.05, bb, 0.0), face_in(bb) if side > 0 else face_out(bb), fabric_mat=sage, seed=312 + k)
    lights.globes("chef's table globes", at(cr, ct), n=7, spread=1.6, low=2.0, high=2.7, ceiling=ceil_at(ct), watts=45, seed=15)
    # the pantry along the cross wall at b0: tall walnut doors, 3 m, from near the glass to near the windows
    pf = b0 + FACE; pd = pf + tang(0.65, RM)
    crown.curved_box("pantry", R_GL + 3.5, R_OUT - 3.5, pf, pd, 0.1, 3.0, M["walnut_v"])
    crown.curved_box("pantry kick", R_GL + 3.55, R_OUT - 3.55, pf, pd - tang(0.05, RM), 0.0, 0.1, M["shadow"])
    crown.curved_box("pantry cornice", R_GL + 3.45, R_OUT - 3.45, pf, pd + tang(0.03, RM), 3.0, 3.08, M["walnut"])
    r = R_GL + 3.5 + 0.6
    while r < R_OUT - 3.6:
        crown.curved_box("pantry joint", r - 0.004, r + 0.004, pd, pd + tang(0.004, RM), 0.12, 2.98, M["shadow"]); r += 0.6
    crown.glass_wall("kitchen glass", R_GL + 0.2, b0, b1, M, state="frosted", doors=[(bc - tang(2.0, R_GL), 2.2)])
    crown.glide_lights(b0, b1)
    downlights(b0, b1, 90, (1.0, 0.92, 0.82), rs=(RM - 1.8, RM - 0.4, R_OUT - 1.5), every=2.6)
    CR.washers(b0, b1, 180)


# ---------------------------------------------------------------- C-20 the guests' lounge
def guests_day_room(M, rnd):
    """C-20, the guests' lounge (252 to 261), where visitors spend their evenings up here: desks along the outer wall,
    sofas round a low table, a kitchenette and its table, a corner for children (they sleep below ground, in the guest
    wing on L1)"""
    import seating, tables, lights, plants
    b0, b1 = 252.0, 261.0
    mats(M)
    crown.ring_room(b0, b1, M, M["oak"])
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M); bc = (b0 + b1) / 2
    cognac = seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather")
    # desks at the windows: walnut desks, leather chairs, lamps, screens; an orchid
    for i in range(3):
        db = b0 + tang(5.0) + i * tang(2.5)
        tables.desk("guest desk", at(R_OUT - 0.75, db, 0.0), face_in(db), length=2.0, depth=0.85)
        seating.desk_chair("guest chair", at(R_OUT - 1.75, db, 0.0), face_out(db), fabric_mat=cognac, seed=310 + i)
        furn.table_lamp("desk lamp", at(R_OUT - 0.5, db + tang(0.7, R_OUT), 0.775), M, watts=30, shade_r=0.14)
        CR.screen("screen", CR.repo_file("palace", "design", "img", ("flight-dunes.jpg", "flight-crater.jpg", "mars-earth.jpg")[i]), 0.62, 0.36, at(R_OUT - 0.45, db - tang(0.25), 0.775), face_in(db), M)
        lib.box("notebook", (0.22, 0.3, 0.015), at(R_OUT - 0.95, db - tang(0.5), 0.783), M["leather"], bevel=0.003, rot_z=face_in(db) + 0.2)
    plants.make("orchid", at(R_OUT - 0.55, b0 + tang(5.0) + tang(2.5) - tang(0.75), 0.775), seed=315, pot=(0.22, 0.11, "white"), colour="white")
    # the sitting group: a sectional 5 x 4 m and two club chairs round a travertine table, all facing it
    sb = b0 + tang(13.6)
    lib.box("rug", (6.6, 5.6, 0.014), at(RM - 0.2, sb, 0.007), M["rug"], bevel=0.006, rot_z=face_in(sb), segs=2)
    seating.sectional("day sectional", at(RM - 1.6, sb, 0.0), face_out(sb), lx=5.0, ly=4.0, fabric_mat=seating.fabric("oat boucle", (0.64, 0.58, 0.50), "boucle"), seed=316)
    tables.coffee_table("day table", at(RM + 0.25, sb, 0.0), face_in(sb), length=2.0, width=1.1, mat=seating.stone("day travertine", (0.80, 0.73, 0.62), (0.62, 0.55, 0.45), "travertine", 0.3))
    for k in (-1, 1):
        bb = sb + k * tang(1.05, RM + 2.0)
        seating.club_chair("day chair", at(RM + 2.0, bb, 0.0), face_in(bb) - k * 0.3, fabric_mat=seating.fabric("moss velvet", (0.16, 0.20, 0.12), "velvet"), seed=317 + k)
    for k in range(4): lib.box("book", (0.24, 0.17, 0.035), at(RM + 0.1, sb - tang(0.4), 0.37 + 0.035 * k), M["leather"] if k % 2 else M["linen"], bevel=0.004, rot_z=face_in(sb) + 0.15 * k)
    lights.arc_lamp("day arc lamp", at(RM - 2.6, sb + tang(3.0, RM - 2.6), 0.0), face_cw(sb) + 0.6, reach=2.2)
    lights.halo("day halo", at(RM + 0.2, sb), d=4.0, z=4.6, ceiling=ceil_at(sb), watts=900)
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
    tb = b0 + tang(2.6)
    lib.cyl("round table", 0.75, 0.045, at(RM - 0.2, tb, 0.715), M["olive"], verts=96, bevel=0.01)
    lib.cyl("table stem", 0.12, 0.7, at(RM - 0.2, tb, 0.0), M["bronze_dark"], verts=32)
    for k in range(4):
        a_ = k * math.pi / 2 + 0.4; q = Vector(at(RM - 0.2, tb, 0.0)) + Vector((math.cos(a_), math.sin(a_), 0)) * 1.15
        seating.dining_chair("table chair", tuple(q), a_ - math.pi / 2, fabric_mat=seating.fabric("day linen", (0.66, 0.58, 0.45), "linen"), seed=320 + k)
    lights.globes("table globes", at(RM - 0.2, tb), n=5, spread=0.5, low=2.0, high=2.6, ceiling=ceil_at(tb), watts=42, seed=14)
    # the children's corner by the Glide at the far end: a play rug, a low table and stools, cushions, toys on a shelf
    cb = b1 - tang(2.4)
    play = furn.rug_material("play rug", (0.36, 0.42, 0.50), (0.70, 0.55, 0.30))
    lib.box("play rug", (3.0, 2.6, 0.014), at(R_GL + 1.7, cb, 0.007), play, bevel=0.006, rot_z=face_in(cb), segs=2)
    lib.cyl("low table", 0.42, 0.03, at(R_GL + 1.7, cb, 0.48), M["oak_top"], verts=48, bevel=0.008)
    for k, col in enumerate(((0.55, 0.20, 0.10), (0.20, 0.30, 0.45), (0.62, 0.48, 0.18))):
        furn.cushion("floor cushion", (0.55, 0.55, 0.14), at(R_GL + 2.6, cb + tang(-0.7 + 0.7 * k), 0.08), (0, 0, face_in(cb)), lib.fabric("cushion %d" % k, col, 0.85, 0.4))
    crown.curved_box("toy shelf", R_GL + 0.3, R_GL + 0.65, b1 - FACE - tang(3.6, R_GL), b1 - FACE - tang(0.8, R_GL), 0.0, 0.62, M["walnut"])
    blocks = [lib.principled("block %d" % i, c, 0.6) for i, c in enumerate(((0.55, 0.18, 0.08), (0.18, 0.28, 0.45), (0.65, 0.50, 0.15), (0.25, 0.40, 0.22), (0.80, 0.78, 0.72)))]
    for i in range(14):
        bb = b1 - FACE - tang(3.4 - 0.18 * i, R_GL); s_ = rnd.choice((0.06, 0.08, 0.1))
        lib.box("block", (s_, s_, s_), at(R_GL + 0.48, bb, 0.62 + s_ / 2), rnd.choice(blocks), bevel=0.006, rot_z=rnd.uniform(0, 1))
    plants.make("fiddle-leaf fig", at(R_OUT - 1.0, b1 - tang(1.3, R_OUT - 1.0), 0.0), seed=325, pot=(0.75, 0.62, "white"), height=2.6)
    plants.make("kentia palm", at(R_GL + 1.1, b0 + tang(7.9), 0.0), seed=326, pot=(0.95, 0.72, "black"), height=3.0)
    # the games table by the glass (furnishing.py): square walnut, 1.2 m, four leather club chairs round it, cards and a
    # chess board on it, a halo over it; a red maple in a round basalt planter between the groups
    gb_ = b0 + tang(6.0, R_GL + 3.4); gq = Vector(at(R_GL + 3.4, gb_, 0.0)); fi = face_in(gb_)
    lib.box("games rug", (4.2, 4.2, 0.014), (gq.x, gq.y, 0.007), M["rug2"], bevel=0.006, rot_z=fi, segs=2)
    lib.box("games top", (1.2, 1.2, 0.045), (gq.x, gq.y, 0.715), M["walnut"], bevel=0.01, rot_z=fi)
    lib.box("games apron", (1.08, 1.08, 0.1), (gq.x, gq.y, 0.64), M["walnut"], bevel=0.005, rot_z=fi)
    for (u, v) in ((-0.5, -0.5), (-0.5, 0.5), (0.5, -0.5), (0.5, 0.5)):
        lp = gq + Vector((u * math.cos(fi) - v * math.sin(fi), u * math.sin(fi) + v * math.cos(fi), 0))
        lib.box("games leg", (0.06, 0.06, 0.6), (lp.x, lp.y, 0.3), M["walnut"], rot_z=fi)
    lib.box("chess board", (0.42, 0.42, 0.02), (gq.x, gq.y, 0.748), M["oak_top"], rot_z=fi + 0.1)
    for k in range(4):
        a_ = fi + k * math.pi / 2; d_ = Vector((-math.sin(a_), math.cos(a_), 0))          # each chair on a side, facing the table
        seating.club_chair("games chair", tuple(gq + d_ * 1.15), a_, fabric_mat=cognac, seed=330 + k, w=0.95, d=0.92)   # its front (-y) to the table
    lights.halo("games halo", (gq.x, gq.y), d=3.0, z=4.2, ceiling=ceil_at(gb_), watts=600)
    plants.make("japanese maple", at(R_GL + 2.6, b0 + tang(11.4, R_GL + 2.6), 0.0), seed=334, pot=(1.6, 0.6, "basalt"), height=4.0, colour="red", stems=3)
    # two lounge chairs at the windows at the far end, facing out, a drum between them
    lb_ = b1 - tang(3.8, R_OUT - 2.4)
    for k in (-1, 1):
        bb = lb_ + k * tang(0.9, R_OUT - 2.4)
        seating.club_chair("window chair", at(R_OUT - 2.4, bb, 0.0), face_out(bb) + k * 0.2, fabric_mat=seating.fabric("moss velvet", (0.16, 0.20, 0.12), "velvet"), seed=336 + k)
    tables.drum("window drum", at(R_OUT - 2.2, lb_, 0.0), d=0.45, h=0.45)
    # the paintings on the cross wall by the sunset lounge: Mondrian's composition and Leger's Contrast of Forms
    CR.paint("day painting", "mondrian_composition", 2.6, at(130.6, b1 - FACE - tang(0.02, 130.6), 0.0), face_ccw(b1), 2.3)
    CR.paint("day painting", "leger_contrast_of_forms", 2.6, at(125.4, b1 - FACE - tang(0.02, 125.4), 0.0), face_ccw(b1), 2.3, tall=True)
    CR.washers(b0, b1, 160)
    # the Glide side, frosted for the guests: a wall of bronze and glass from the floor to the ceiling, as in the master suite (Jim, 6 Oct: "all rooms in the crown should have same window as master bedroom")
    crown.glass_wall("guests glass", R_GL + 0.2, b0, b1, M, state="frosted", doors=[(257.4, 2.2)])


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
    # on the cross walls, the collection's pieces in turn: now Van Gogh's Night Cafe and Picabia's Edtaonisl
    CR.paint("gallery night cafe", "vangogh_night_cafe", 3.4, at(RM, b0 + FACE + tang(0.02, RM), 0.0), face_cw(b0), 2.2)
    CR.paint("gallery edtaonisl", "picabia_edtaonisl", 3.0, at(RM, b1 - FACE - tang(0.02, RM), 0.0), face_ccw(b1), 2.2)
    # Jim's big canvases on the cross walls beside the two masterpieces, and a line of sculptures on white plinths down
    # the Glide side, each in its own light
    big = [((0.18, 0.22, 0.30), [(0.06, 0.94, 0.50, 0.94, (0.70, 0.42, 0.20)), (0.06, 0.94, 0.06, 0.46, (0.10, 0.12, 0.16))]),
           ((0.62, 0.52, 0.36), [(0.08, 0.92, 0.40, 0.92, (0.34, 0.16, 0.08)), (0.30, 0.70, 0.08, 0.36, (0.80, 0.70, 0.52))])]
    for k, (wb, fc) in enumerate(((b0 + FACE + tang(0.03, RM + 4.6), face_cw(b0)), (b1 - FACE - tang(0.03, RM + 4.6), face_ccw(b1)))):
        pm = furn.painting_material("jim big canvas %d" % k, *big[k])
        furn.painting("big canvas", 2.6, 2.0, at(RM + 4.6, wb, 2.2), fc, pm, M["frame"])
        works.append((at(RM + 4.6, wb, 2.2), 1))
    import seating
    marble_w = seating.stone("gallery marble", (0.88, 0.86, 0.82), (0.55, 0.53, 0.50), "marble", 0.15)
    pieces = [[(0.0, 0.0), (0.16, 0.0), (0.2, 0.2), (0.12, 0.55), (0.05, 0.95), (0.09, 1.05), (0.0, 1.1)],
              [(0.0, 0.0), (0.24, 0.0), (0.3, 0.12), (0.26, 0.3), (0.12, 0.42), (0.0, 0.45)],
              [(0.0, 0.0), (0.05, 0.0), (0.035, 0.6), (0.06, 1.3), (0.02, 1.6), (0.0, 1.62)],
              [(0.0, 0.0), (0.2, 0.0), (0.22, 0.3), (0.3, 0.55), (0.18, 0.8), (0.0, 0.84)]]
    for k, (bb, h) in enumerate(((b0 + tang(3.6, R_GL + 2.4), 1.0), (bc - tang(2.8, R_GL + 2.4), 0.8), (bc + tang(2.8, R_GL + 2.4), 0.9), (b1 - tang(3.6, R_GL + 2.4), 0.7))):
        q = at(R_GL + 2.4, bb, h)
        lib.box("plinth", (0.6, 0.6, h), at(R_GL + 2.4, bb, h / 2), M["white_wall"], bevel=0.004, rot_z=face_in(bb))
        furn.lathe("sculpture", pieces[k], (M["bronze"], marble_w, M["bronze"], marble_w)[k], 64, q)
        frm = at(R_GL + 2.4, bb, 4.55); sp = lib.spot_light("sculpture light", frm, 90, (1.0, 0.92, 0.82), 0.03, 22, 0.35); aim(sp, frm, (q[0], q[1], h + 0.4))
    import plants
    plants.make("olive", at(R_GL + 1.6, bc, 0.0), seed=340, pot=(1.6, 0.55, "basalt"), height=4.2, stems=3)
    for k, r in enumerate((R_GL + 1.3, R_OUT - 1.3)):       # a pair flanking the Night Cafe on the far cross wall
        plants.make("kentia palm", at(r, b0 + tang(1.6, r), 0.0), seed=341 + k, pot=(0.95, 0.72, "black"), height=3.3 + 0.3 * k, stems=3)
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
    CR.washers(b0, b1, 150)
    # the Glide side: a wall of bronze and glass from the floor to the ceiling, as in the master suite (Jim, 6 Oct: "all rooms in the crown should have same window as master bedroom")
    crown.glass_wall("gallery glass", R_GL + 0.2, b0, b1, M, state="clear", doors=[(281.5, 2.4)])


# ---------------------------------------------------------------- C-06 the dressing room
SUITE_DOORS = 109.3                       # the master suite's doors onto the Glide, in the dressing room


def wardrobe_run(wb, side, r0, r1, M, rnd, H=3.2, D_=0.62, kinds=("door", "hang", "door", "shelves", "mirror")):
    """walnut wardrobes 3.2 m tall along the cross wall at bearing wb, from radius r0 to r1, in bays about 1 m wide:
    pairs of doors, open bays of hanging clothes lit from above, open shelves of folded clothes and shoes, a tall
    mirror. side: +1 if the room lies clockwise of the wall, -1 if anticlockwise"""
    w = wb + side * FACE; rot_in = face_cw(wb) if side > 0 else face_ccw(wb)
    def B(d0, d1, r):                       # the bearings from d0 to d1 metres out from the wall, at radius r
        a, b = w + side * tang(d0, r), w + side * tang(d1, r); return (min(a, b), max(a, b))
    n = max(1, int(round((r1 - r0) / 1.0))); W = (r1 - r0) / n
    garments = [lib.fabric("garment %d" % i, c, 0.85, 0.3) for i, c in enumerate(((0.08, 0.09, 0.14), (0.75, 0.74, 0.70), (0.30, 0.26, 0.20), (0.45, 0.47, 0.50), (0.16, 0.12, 0.09), (0.62, 0.55, 0.42)))]
    for k in range(n):
        ra, rc = r0 + k * W, r0 + (k + 1) * W; rm = (ra + rc) / 2; kind = kinds[k % len(kinds)]
        crown.curved_box("wardrobe back", ra, rc, *B(0.0, 0.03, rm), 0.0, H, M["oak_panel"])
        for e in (ra, rc): crown.curved_box("wardrobe side", e - 0.012, e + 0.012, *B(0.0, D_, e), 0.0, H, M["walnut_v"])
        crown.curved_box("wardrobe top", ra, rc, *B(0.0, D_, rm), H - 0.04, H, M["walnut"])
        crown.curved_box("wardrobe plinth", ra, rc, *B(0.0, D_ - 0.04, rm), 0.0, 0.08, M["shadow"])
        if kind in ("door", "mirror"):
            mat = M["mirror"] if kind == "mirror" else M["walnut_v"]
            for (q0, q1) in ((ra + 0.006, rm - 0.004), (rm + 0.004, rc - 0.006)) if kind == "door" else ((ra + 0.03, rc - 0.03),):
                crown.curved_box("wardrobe door", q0, q1, *B(D_ - 0.02, D_, rm), 0.09, H - 0.05, mat)
            if kind == "mirror":
                for (q0, q1) in ((ra + 0.006, ra + 0.03), (rc - 0.03, rc - 0.006)): crown.curved_box("mirror frame", q0, q1, *B(D_ - 0.025, D_, rm), 0.09, H - 0.05, M["bronze_dark"])
            else:
                for s_ in (-1, 1): lib.box("pull", (0.025, 0.012, 0.6), at(rm + s_ * 0.05, B(D_ + 0.012, D_ + 0.012, rm)[0], 1.25), M["bronze"], rot_z=rot_in)
        elif kind == "hang":
            crown.curved_box("rail", ra + 0.02, rc - 0.02, *B(D_ / 2 - 0.01, D_ / 2 + 0.01, rm), 2.25, 2.27, M["bronze"])
            r = ra + 0.08
            while r < rc - 0.06:
                g = rnd.choice(garments); ln = rnd.choice((0.75, 0.9, 1.05, 1.3))
                bb = (B(D_ / 2, D_ / 2, r)[0])
                lib.box("garment", (0.46, 0.035, ln), at(r, bb, 2.22 - ln / 2), g, bevel=0.012, rot_z=face_in(bb))
                r += rnd.uniform(0.07, 0.11)
            crown.curved_box("hat shelf", ra, rc, *B(0.0, D_ - 0.02, rm), 2.42, 2.45, M["walnut"])
            crown.curved_box("strip light", ra + 0.03, rc - 0.03, *B(D_ - 0.08, D_ - 0.06, rm), 2.405, 2.42, lib.emission("wardrobe light", (1.0, 0.82, 0.6), 8))
        else:
            for z in (0.45, 0.85, 1.25, 1.65, 2.05, 2.45):
                crown.curved_box("shelf", ra, rc, *B(0.0, D_ - 0.04, rm), z, z + 0.025, M["walnut"])
                for j in range(2):
                    q = at(ra + (rc - ra) * (0.28 + 0.44 * j), B(0.3, 0.3, rm)[0], z + 0.025)
                    c = rnd.choice(((0.75, 0.74, 0.70), (0.10, 0.11, 0.16), (0.42, 0.40, 0.38), (0.55, 0.46, 0.34)))
                    for t in range(rnd.randint(3, 6)):
                        lib.box("folded", (0.32, 0.26, 0.045), (q[0], q[1], q[2] + 0.023 + t * 0.046), lib.fabric("folded %d" % int(c[0] * 100), c, 0.9, 0.3), bevel=0.01, rot_z=rot_in + rnd.uniform(-0.04, 0.04))
            for j in range(3):          # shoes on the bottom
                q = at(ra + (rc - ra) * (0.2 + 0.3 * j), B(0.3, 0.3, rm)[0], 0.1)
                lib.box("shoe", (0.1, 0.28, 0.08), (q[0], q[1], 0.14), M["leather"] if j != 1 else M["leather_tan"], bevel=0.03, rot_z=rot_in)


def dressing_room(M, rnd):
    """C-06, the dressing room (108 to 116.64), next to the bedroom up: clothes for the day (furnishing.py). Walnut
    wardrobes 3.2 m tall along both cross walls, so the windows stay clear: doors, open bays of hanging clothes lit from
    above, shelves of folded clothes, a tall mirror; an island of walnut drawers with a marble top, 4 m, globes over
    it; a round velvet ottoman 1.6 m across; a chaise by the window; Matisse's Woman with a Hat by the bedroom's door;
    frosted glass onto the Glide with the suite's pivot doors"""
    import seating, tables, lights, plants
    b0, b1 = 108.0, 116.64
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["oak_panel"], part_walls=False)
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    bc = (b0 + b1) / 2
    crown.partition(b0, M, M["oak_panel"]); crown.partition(b1, M, M["oak_panel"], opening=CR.SUITE_DOOR, head=3.6)
    crown.glass_wall("suite glass", R_GL + 0.2, b0, b1, M, state="frosted", doors=[(SUITE_DOORS, 2.6)]); crown.glide_lights(b0, b1)
    wardrobe_run(b0, 1, R_GL + 4.4, R_OUT - 1.3, M, rnd)
    wardrobe_run(b1, -1, R_OUT - 6.6, R_OUT - 1.3, M, rnd, kinds=("hang", "door", "shelves", "hang", "door"))
    # the island: walnut drawers under a marble top, a glass tray of watches; globes over it; a white orchid
    L_ = 4.0; ri = RM + 0.6
    crown.curved_box("island", ri - 0.45, ri + 0.45, bc - tang(L_ / 2, ri), bc + tang(L_ / 2, ri), 0.0, 0.9, M["walnut_v"])
    for z in (0.3, 0.6):
        for e in (ri - 0.455, ri + 0.45): crown.curved_box("drawer joint", e, e + 0.005, bc - tang(L_ / 2 - 0.05, ri), bc + tang(L_ / 2 - 0.05, ri), z, z + 0.006, M["shadow"])
    crown.curved_box("island top", ri - 0.5, ri + 0.5, bc - tang(L_ / 2 + 0.04, ri), bc + tang(L_ / 2 + 0.04, ri), 0.9, 0.94, M["marble"])
    crown.curved_box("island tray", ri - 0.3, ri + 0.3, bc - tang(1.0, ri), bc + tang(0.4, ri), 0.94, 0.95, M["leather_tan"])
    for i in range(6):
        q = at(ri + rnd.uniform(-0.18, 0.18), bc + tang(-0.9 + 0.22 * i, ri), 0.95)
        lib.cyl("watch", 0.02, 0.012, q, M["steel"] if i % 2 else M["brass"], verts=24)
        lib.box("watch strap", (0.024, 0.16, 0.004), (q[0], q[1], q[2] + 0.002), M["leather"], rot_z=rnd.uniform(0, 3))
    plants.make("orchid", at(ri, bc + tang(1.2, ri), 0.94), seed=110, pot=(0.24, 0.12, "white"), colour="white")
    lights.globes("island globes", at(ri, bc), n=9, spread=1.4, low=2.2, high=3.0, ceiling=ceil_at(bc), watts=45, seed=6)
    # the ottoman between the island and the Glide, the chaise by the window, a rug, a valet stand
    lib.box("rug", (6.4, 4.6, 0.014), at(RM - 0.6, bc, 0.007), M["rug"], bevel=0.006, rot_z=face_in(bc), segs=2)
    seating.ottoman("dressing ottoman", at(RM - 2.2, bc, 0.0), d=1.6, h=0.44, fabric_mat=seating.fabric("dusk velvet", (0.36, 0.26, 0.30), "velvet"), seed=111)
    cb = bc + tang(1.6, R_OUT - 1.6)
    seating.daybed("dressing chaise", at(R_OUT - 1.7, cb, 0.0), face_cw(cb) + 0.5, length=2.0, width=0.85, fabric_mat=seating.fabric("dressing linen", (0.70, 0.66, 0.58), "linen"), seed=112)
    vb = bc - tang(2.6, R_OUT - 2.2)
    lib.cyl("valet pole", 0.012, 1.3, at(R_OUT - 2.2, vb, 0.0), M["walnut"], verts=12)
    lib.box("valet bar", (0.44, 0.03, 0.03), at(R_OUT - 2.2, vb, 1.3), M["walnut"], rot_z=face_in(vb))
    lib.box("jacket", (0.48, 0.04, 0.75), at(R_OUT - 2.2, vb, 0.9), lib.fabric("garment 0", (0.08, 0.09, 0.14), 0.85, 0.3), bevel=0.015, rot_z=face_in(vb))
    CR.paint("dressing painting", "matisse_woman_with_hat", 2.4, at(R_GL + 6.0, b1 - FACE - tang(0.02, R_GL + 6.0), 0.0), face_ccw(b1), 2.0, tall=True)
    # the sitting corner between the island and the bedroom's wardrobes (furnishing.py): a velvet sofa 3.2 m with its
    # back to the Glide, a marble table, two club chairs facing it from the windows' side, on its own rug; an arched
    # lamp, a fiddle-leaf fig
    gb = b1 - tang(4.2, RM + 0.6)
    lib.box("sitting rug", (4.4, 3.8, 0.014), at(RM + 0.6, gb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(gb), segs=2)
    seating.sofa("dressing sofa", at(RM - 0.9, gb, 0.0), face_out(gb), length=3.2, fabric_mat=seating.fabric("sage velvet", (0.30, 0.34, 0.27), "velvet"), seed=113)
    tables.coffee_table("dressing table", at(RM + 0.55, gb, 0.0), face_in(gb), length=1.5, width=0.8, mat=M["marble"])
    for k in (-1, 1):
        bb = gb + k * tang(0.85, RM + 2.0)
        seating.club_chair("dressing chair", at(RM + 2.0, bb, 0.0), face_in(bb) - k * 0.25, fabric_mat=seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather"), seed=114 + k)
    plants.make("orchid", at(RM + 0.55, gb, 0.36), seed=116, pot=(0.2, 0.1, "white"), colour="magenta")
    lights.arc_lamp("dressing arc", at(RM - 1.3, gb + tang(2.0, RM - 1.3), 0.0), face_cw(gb) + 0.5, reach=1.8)
    plants.make("fiddle-leaf fig", at(RM - 1.2, gb - tang(2.2, RM - 1.2), 0.0), seed=117, pot=(0.75, 0.62, "white"), height=2.6)
    lights.globes("sitting globes", at(RM + 0.55, gb), n=5, spread=0.6, low=2.4, high=3.1, ceiling=ceil_at(gb), watts=40, seed=21)
    # the triple mirror in bronze facing the ottoman, its wings turned in; a pair of kentias by the frosted glass
    mq = Vector(at(RM - 4.3, bc, 0.0)); fo = face_out(bc)
    for k in (-1, 0, 1):
        a_ = fo - k * 0.42; off = Vector((math.cos(fo), math.sin(fo), 0)) * (0.73 * k)        # the wings turned in, towards the ottoman
        c_ = mq + off + Vector((math.sin(fo), -math.cos(fo), 0)) * (0.16 * abs(k))              # (a model's front is -y)
        lib.box("mirror frame", (0.74, 0.05, 2.3), (c_.x, c_.y, 1.2), M["bronze_dark"], bevel=0.01, rot_z=a_)
        g_ = Vector((c_.x, c_.y, 1.2)) + Vector((math.sin(a_), -math.cos(a_), 0)) * 0.026
        lib.box("mirror glass", (0.68, 0.012, 2.22), tuple(g_), M["mirror"], rot_z=a_)
    for bb in (b0 + tang(0.9, R_GL + 1.0), bc + tang(1.6, R_GL + 1.0)):
        plants.make("kentia palm", at(R_GL + 1.0, bb, 0.0), seed=int(bb * 7), pot=(0.9, 0.7, "black"), height=3.2, stems=3)
    downlights(b0, b1, 70)
    lights.halo("dressing halo", at(RM - 2.2, bc), d=4.0, z=4.4, ceiling=ceil_at(bc), watts=700)
    CR.washers(b0, b1, 140)


# ---------------------------------------------------------------- C-08 the bath up
def bath_up(M, rnd):
    """C-08, the bath up (130.32 to 144), the master suite up's bath (furnishing.py): a soaking tub of white stone by
    the windows, where the morning sun comes in, a white leather chaise beside it, alabaster pendants over it; a
    walk-in shower behind glass with a teak bench; a double vanity of marble 4 m long on the cross wall under round
    mirrors lit from behind; tree ferns in the humid corner; two daybeds in the sunny corner; Hokusai's Great Wave;
    a closet for the lavatory by the Glide; honed travertine and pale oak"""
    import pent_rooms, seating, tables, lights, plants
    b0, b1 = 130.32, 144.0
    mats(M)
    crown.ring_room(b0, b1, M, M["stone_linen"], wall_mat=M["bath_trav"], part_walls=False)
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    S = CR.imports(M); bc = (b0 + b1) / 2
    crown.partition(b0, M, M["oak_panel"], opening=CR.SUITE_DOOR, head=3.6); crown.partition(b1, M, M["bath_trav"])
    crown.glass_wall("suite glass", R_GL + 0.2, b0, b1, M, state="frosted")
    # the tub, hollowed, filled; a bronze filler; a stool with towels; candles
    tb = bc + tang(2.0); tq = at(R_OUT - 1.25, tb, 0.0); pz = 0.18
    crown.curved_box("tub platform", R_OUT - 2.6, R_OUT - 0.05, tb - tang(2.0, R_OUT - 1.2), tb + tang(2.0, R_OUT - 1.2), 0.0, pz, M["bath_trav"])
    tub = lib.box("tub", (1.9, 0.95, 0.6), (tq[0], tq[1], pz + 0.3), M["tub"], bevel=0.22, rot_z=face_in(tb), segs=6)
    cut = lib.box("tub hollow", (1.7, 0.75, 0.6), (tq[0], tq[1], pz + 0.66), None, bevel=0.2, rot_z=face_in(tb), segs=6); cut.hide_render = True; cut.hide_viewport = True
    bo = tub.modifiers.new("hollow", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    water = pent_rooms.pool_water("bath water", (0.86, 0.95, 0.93))
    lib.box("tub water", (1.62, 0.68, 0.004), (tq[0], tq[1], pz + 0.48), water, bevel=0.0, rot_z=face_in(tb))
    fb = tb - tang(1.15, R_OUT - 1.25)
    lib.cyl("filler", 0.02, 0.95, at(R_OUT - 1.25, fb, pz), M["bronze"], verts=16)
    lib.box("filler spout", (0.03, 0.28, 0.03), at(R_OUT - 1.25, fb + tang(0.12, R_OUT - 1.25), pz + 0.95), M["bronze"], rot_z=face_cw(fb))
    sq = at(R_OUT - 2.3, tb + tang(0.6), pz); tables.drum("bath stool", sq, d=0.4, h=0.45, mat=M["bath_trav"])
    for t in range(3): lib.box("towel", (0.36, 0.26, 0.05), (sq[0], sq[1], pz + 0.47 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_in(tb) + 0.1 * t)
    for i in range(3):
        q = at(R_OUT - 0.25, tb + tang(-0.3 + 0.3 * i, R_OUT), pz)
        lib.cyl("candle", 0.04, 0.12 + 0.05 * i, q, lib.principled("wax", (0.85, 0.82, 0.74), 0.5, **{"Subsurface Weight": 0.4}), verts=24)
        lib.cyl("flame", 0.006, 0.02, (q[0], q[1], pz + 0.135 + 0.05 * i), lib.emission("flame", (1.0, 0.6, 0.25), 20), verts=8)
    lib.box("bath rug", (3.2, 2.0, 0.014), at(RM - 0.9, tb, 0.007), M["rug"], bevel=0.006, rot_z=face_in(tb), segs=2)
    white = seating.fabric("white leather", (0.80, 0.78, 0.74), "leather")
    cq = tb + tang(2.3, R_OUT - 2.0)
    seating.daybed("bath chaise", at(R_OUT - 2.0, cq, 0.0), face_cw(cq) + math.pi + 0.3, length=2.1, width=0.85, fabric_mat=white, seed=140)
    for k in (-1, 1): lights.alabaster_pendant("tub pendant", at(R_OUT - 1.25, tb + k * tang(0.7, R_OUT - 1.25)), z=2.3, ceiling=ceil_at(tb), d=0.32, h=0.46, watts=60)
    # a bench of stone along the screen, towels stacked on it, and a sunny corner to rest in at the far end
    crown.curved_box("towel bench", R_GL + 0.2, R_GL + 0.65, bc - tang(4.0, R_GL), bc + tang(1.0, R_GL), 0.0, 0.45, M["bath_trav"])
    for k in range(4):
        q = at(R_GL + 0.42, bc - tang(3.2 - 0.9 * k, R_GL), 0.45)
        for t in range(2 + k % 2): lib.box("towel", (0.4, 0.3, 0.05), (q[0], q[1], 0.47 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_in(bc) + 0.05 * t)
    lb = b1 - tang(4.0)                       # the sunny corner: two daybeds facing the windows, a drum between
    lib.box("rest rug", (4.6, 3.6, 0.014), at(RM + 1.2, lb, 0.007), M["rug2"], bevel=0.006, rot_z=face_in(lb), segs=2)
    for k in (-1, 1):
        bb = lb + k * tang(0.9, RM + 1.2); seating.daybed("bath daybed", at(RM + 1.2, bb, 0.0), face_cw(bb), length=2.2, width=1.0, fabric_mat=white, seed=141 + k)
    tables.drum("rest drum", at(RM + 1.9, lb, 0.0), d=0.45, h=0.45)
    # the walk-in shower: a glass screen, a stone bench, a rain head from the ceiling, a line of drain
    sb = bc - tang(3.6); sw = tang(2.6, R_OUT - 1.2)
    crown.curved_box("shower glass", R_OUT - 2.3, R_OUT - 2.29, sb - sw / 2, sb + sw / 2 - tang(0.8, R_OUT - 2.3), 0.0, 2.4, M["glass"])
    crown.curved_box("shower side", R_OUT - 2.3, R_OUT - 0.05, sb - sw / 2 - tang(0.06, R_OUT), sb - sw / 2, 0.0, 2.4, M["bath_trav"])
    crown.curved_box("shower bench", R_OUT - 0.5, R_OUT - 0.05, sb - sw / 2, sb + sw / 2, 0.0, 0.45, lib.wood("teak", (0.36, 0.22, 0.12), (0.22, 0.13, 0.07), 0.45))
    for k, (r, bb, h) in enumerate(((R_OUT - 0.9, sb - sw / 2 - tang(1.1, R_OUT), 2.8), (R_OUT - 1.8, sb - sw / 2 - tang(1.9, R_OUT), 2.3))):
        plants.make("tree fern", at(r, bb, 0.0), seed=145 + k, pot=(0.95, 0.5, "travertine"), height=h)
    crown.curved_box("drain", R_OUT - 2.2, R_OUT - 2.15, sb - sw / 2 + tang(0.1, R_OUT), sb + sw / 2 - tang(0.1, R_OUT), 0.0, 0.004, M["shadow"])
    rq = at(R_OUT - 1.2, sb, 2.4)
    lib.cyl("rain head", 0.2, 0.02, rq, M["bronze"], verts=48); lib.cyl("rain pipe", 0.012, ceil_at(sb) - 2.42, (rq[0], rq[1], 2.42), M["bronze"], verts=12)
    # the double vanity of marble, 4 m, on the cross wall by the bedroom: two bowls, round mirrors lit from behind
    w = b0 + FACE; vr0, vr1 = R_GL + 5.0, R_GL + 9.0; vm = (vr0 + vr1) / 2
    crown.curved_box("vanity", vr0, vr1, w, w + tang(0.58, vm), 0.42, 0.86, M["walnut_v"])
    crown.curved_box("vanity top", vr0 - 0.03, vr1 + 0.03, w, w + tang(0.62, vm), 0.86, 0.9, M["marble"])
    for r in (vm - 1.0, vm + 1.0):
        q = at(r, w + tang(0.32, r), 0.9)
        furn.lathe("basin", [(0.0, 0.0), (0.08, 0.0), (0.2, 0.06), (0.22, 0.14), (0.205, 0.14), (0.19, 0.07), (0.07, 0.02), (0.0, 0.02)], M["porcelain"], 48, q)
        lib.cyl("tap", 0.012, 0.3, at(r, w + tang(0.08, r), 0.9), M["bronze"], verts=12)
        lib.box("spout", (0.02, 0.18, 0.02), at(r, w + tang(0.16, r), 1.19), M["bronze"], rot_z=face_cw(b0))
        mq = at(r, w + tang(0.012, r), 1.68)
        lib.cyl("mirror", 0.42, 0.012, mq, M["mirror"], verts=64, rot=(math.pi / 2, 0, face_cw(b0)))
        bpy.ops.mesh.primitive_torus_add(major_radius=0.43, minor_radius=0.01, major_segments=96, minor_segments=8, location=(mq[0], mq[1], mq[2]), rotation=(math.pi / 2, 0, face_cw(b0)))
        bpy.context.active_object.name = "mirror light"; bpy.context.active_object.data.materials.append(lib.emission("mirror light", (1.0, 0.9, 0.78), 12))
    plants.make("orchid", at(vm, w + tang(0.35, vm), 0.9), seed=147, pot=(0.22, 0.11, "white"), colour="white")
    for t in range(4): lib.box("towel", (0.4, 0.28, 0.05), at(vr1 + 0.5, w + tang(0.3, vr1 + 0.5), 0.05 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_cw(b0))
    # the lavatory's closet by the Glide at the far end, its door shut
    c1 = b1 - FACE; c0 = c1 - tang(2.0, R_GL + 1.2)
    crown.curved_box("closet", R_GL + 0.2, R_GL + 2.2, c0, c0 + tang(0.06, R_GL + 1.2), 0.0, 2.6, M["oak_panel"])
    crown.curved_box("closet front", R_GL + 2.15, R_GL + 2.2, c0, c1, 0.0, 2.6, M["oak_panel"])
    crown.curved_box("closet door joint", R_GL + 2.2, R_GL + 2.205, c1 - tang(0.41, R_GL + 2.2), c1 - tang(0.4, R_GL + 2.2), 0.0, 2.1, M["shadow"])
    lib.box("closet handle", (0.04, 0.12, 0.02), at(R_GL + 2.23, c1 - tang(1.2, R_GL + 2.2), 1.05), M["bronze"], rot_z=face_in(c1))
    # a heated rail of towels by the windows at the far end; Hokusai's Great Wave on the far wall
    for z in (0.5, 0.75, 1.0, 1.25):
        crown.curved_box("towel rail", R_OUT - 0.14, R_OUT - 0.12, b1 - FACE - tang(1.5, R_OUT), b1 - FACE - tang(0.4, R_OUT), z, z + 0.02, M["bronze"])
    lib.box("hung towel", (0.9, 0.04, 0.6), at(R_OUT - 0.17, b1 - FACE - tang(0.95, R_OUT), 1.0), M["towel"], bevel=0.015, rot_z=face_in(b1))
    CR.paint("bath painting", "hokusai_great_wave", 2.8, at(RM + 1.0, b1 - FACE - tang(0.02, RM + 1.0), 0.0), face_ccw(b1), 2.1)
    # the bathing pool in the middle (furnishing.py, layout): black basalt, 6 m along the ring and 2.6 m across inside a
    # rim 0.3 m wide and 0.45 m high, warm water lit from below; two white leather chaises along its windows' side, a
    # drum of towels between them, a halo over it; a bird of paradise at its far end
    pr_, pa_ = RM - 2.0, bc; hl = tang(3.0, pr_); r0_, r1_ = pr_ - 1.3, pr_ + 1.3; RIM = 0.3
    for (q0, q1, a0_, a1_) in ((r0_ - RIM, r0_, pa_ - hl - tang(RIM, pr_), pa_ + hl + tang(RIM, pr_)), (r1_, r1_ + RIM, pa_ - hl - tang(RIM, pr_), pa_ + hl + tang(RIM, pr_)),
                               (r0_, r1_, pa_ - hl - tang(RIM, pr_), pa_ - hl), (r0_, r1_, pa_ + hl, pa_ + hl + tang(RIM, pr_))):
        crown.curved_box("pool rim", q0, q1, a0_, a1_, 0.0, 0.45, M["basalt"])
    crown.curved_box("pool floor", r0_, r1_, pa_ - hl, pa_ + hl, 0.0, 0.02, M["basalt"])
    crown.curved_box("pool water", r0_, r1_, pa_ - hl, pa_ + hl, 0.37, 0.375, pent_rooms.pool_water("bath pool water", (0.84, 0.94, 0.92)))
    for rr in (r0_ + 0.02, r1_ - 0.02):
        lights.strip("pool light", at(rr, pa_ - hl + tang(0.2, rr), 0.2), at(rr, pa_ + hl - tang(0.2, rr), 0.2), color=(0.85, 0.95, 1.0), strength=18.0, w=0.02)
    for k in (-1, 1):
        cb_ = pa_ + k * tang(1.25, r1_ + 1.2)
        seating.daybed("pool chaise", at(r1_ + 1.2, cb_, 0.0), face_cw(cb_), length=2.1, width=0.85, fabric_mat=white, seed=148 + k)
    tables.drum("pool drum", at(r1_ + 1.2, pa_, 0.0), d=0.42, h=0.42, mat=M["bath_trav"])
    for t in range(3): lib.box("towel", (0.36, 0.26, 0.05), at(r1_ + 1.2, pa_, 0.44 + 0.05 * t), M["towel"], bevel=0.02, rot_z=face_in(pa_) + 0.12 * t)
    lights.halo("pool halo", at(pr_, pa_), d=4.6, z=4.8, ceiling=ceil_at(pa_), watts=800)
    plants.make("bird of paradise", at(pr_, pa_ + hl + tang(1.4, pr_), 0.0), seed=150, pot=(1.0, 0.7, "bronze"), height=3.0, stems=5)
    # three kentias along the frosted glass beyond the towel bench
    for k, bb in enumerate((bc + tang(2.4, R_GL + 1.0), bc + tang(4.2, R_GL + 1.0), bc + tang(6.0, R_GL + 1.0))):
        plants.make("kentia palm", at(R_GL + 1.0, bb, 0.0), seed=151 + k, pot=(0.9, 0.7, "black"), height=3.4 - 0.3 * (k % 2), stems=3)
    downlights(b0, b1, 70)
    lights.halo("bath halo", at(RM + 1.2, lb), d=4.0, z=4.6, ceiling=ceil_at(lb), watts=700)
    CR.washers(b0, b1, 140)


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
    for going out onto the hull or the plain. A steel locker for each suit along the outer wall, a frosted window in
    its door lit from inside; the airlock's round-cornered door at the near end, its dust room behind glass; benches,
    boots under them, helmets on a shelf"""
    b0, b1 = 72.0, 78.0
    mats(M)
    crown.ring_room(b0, b1, M, M["rubber"], wall_mat=M["pale_grey"])
    bc = (b0 + b1) / 2
    # suit lockers along the outer wall: a steel case for each suit, a frosted window in its door lit from inside
    W = 1.05; a0 = b0 + tang(1.8, R_OUT); frost = lib.emission("locker window", (0.86, 0.90, 0.94), 2.0)
    for i in range(6):
        s0 = a0 + i * tang(W, R_OUT); s1 = s0 + tang(W, R_OUT); sm = (s0 + s1) / 2
        crown.curved_box("locker", R_OUT - 0.75, R_OUT - 0.05, s0 + tang(0.008, R_OUT), s1 - tang(0.008, R_OUT), 0.08, 2.5, M["steel"])
        crown.curved_box("locker plinth", R_OUT - 0.7, R_OUT - 0.05, s0, s1, 0.0, 0.08, M["shadow"])
        crown.curved_box("locker window", R_OUT - 0.756, R_OUT - 0.75, sm - tang(0.15, R_OUT), sm + tang(0.15, R_OUT), 0.95, 2.15, frost)
        crown.curved_box("window frame", R_OUT - 0.758, R_OUT - 0.75, sm - tang(0.17, R_OUT), sm + tang(0.17, R_OUT), 0.93, 0.95, M["graphite"])
        crown.curved_box("window frame", R_OUT - 0.758, R_OUT - 0.75, sm - tang(0.17, R_OUT), sm + tang(0.17, R_OUT), 2.15, 2.17, M["graphite"])
        lib.box("locker handle", (0.022, 0.03, 0.36), at(R_OUT - 0.775, s0 + tang(0.11, R_OUT), 1.2), M["graphite"], rot_z=face_in(sm))
        lib.box("name plate", (0.18, 0.008, 0.05), at(R_OUT - 0.756, sm, 2.32), M["graphite"], rot_z=face_in(sm))
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
    for r in (R_GL + 0.5, R_GL + 2.45): crown.curved_box("booth glass", r, r + 0.012, db0, db1, 0.0, 2.4, M["glass"])
    crown.curved_box("booth glass", R_GL + 0.5, R_GL + 2.45, db1, db1 + tang(0.012, R_GL + 1.2), 0.0, 2.4, M["glass"])
    crown.curved_box("booth roof", R_GL + 0.5, R_GL + 2.45, db0, db1, 2.4, 2.45, M["steel"])
    crown.curved_box("grille", R_GL + 0.55, R_GL + 2.4, db0, db1, 0.0, 0.02, lib.principled("grille", (0.05, 0.05, 0.05), 0.5, 0.8))
    for i in range(6):
        for z in (0.6, 1.2, 1.8): lib.cyl("air jet", 0.025, 0.05, at(R_GL + 2.43, db0 + (db1 - db0) * (i + 0.5) / 6, z), M["steel"], verts=12, rot=(math.pi / 2, 0, face_out((db0 + db1) / 2)))
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
    # light (furnishing.py): an oak-slat ceiling lit from its coves, a line of light along the lockers' tops, a halo over
    # the bench, washers on the walls
    import seating, tables, lights, plants
    crown.slat_ceiling(b0 - crown.PAD, b1 + crown.PAD, M)
    lights.strip("locker light", at(R_OUT - 0.8, a0, 2.56), at(R_OUT - 0.8, a0 + 6 * tang(W, R_OUT), 2.56), color=(0.95, 0.96, 1.0), strength=30.0, w=0.03)
    lights.halo("suit halo", at(RM, bc), d=4.0, z=4.4, ceiling=ceil_at(bc), watts=700)
    CR.washers(b0, b1, 160)
    # two leather club chairs by the airlock to wait in, a drum between; agaves in basalt bowls under the windows beyond
    # the lockers, a kentia by the glass; Jim's photograph of a lift-off at the Port on the cross wall
    cognac = seating.fabric("suit cognac", (0.30, 0.14, 0.06), "leather")
    for k, d_ in enumerate((2.6, 4.0)):
        bb = b0 + tang(d_, RM + 3.2)
        seating.club_chair("airlock chair", at(RM + 3.2, bb, 0.0), face_ccw(bb) + (0.35 if k else -0.35), fabric_mat=cognac, seed=160 + k)
    tables.drum("airlock drum", at(RM + 3.5, b0 + tang(3.3, RM + 3.5), 0.0), d=0.42, h=0.45)
    for k in range(3):
        bb = a0 + 6 * tang(W, R_OUT) + tang(1.4 + 1.6 * k, R_OUT - 0.8)
        plants.make("agave", at(R_OUT - 0.8, bb, 0.0), seed=163 + k, pot=(0.9, 0.36, "basalt"), size=0.8, colour="blue" if k != 1 else "green")
    plants.make("kentia palm", at(R_GL + 1.0, b0 + tang(5.0, R_GL + 1.0), 0.0), seed=166, pot=(0.9, 0.7, "black"), height=3.0, stems=3)     # by the glass, past the dust room
    CR.framed_print("suit print", CR.repo_file("palace", "design", "img", "port-liftoff.jpg"), 2.4, 1.35, at(RM + 2.6, b1 - FACE - tang(0.03, RM + 2.6), 1.95), face_ccw(b1), M)
    downlights(b0, b1, 90, (0.92, 0.95, 1.0), every=2.4)
    # the Glide side, frosted: a wall of bronze and glass from the floor to the ceiling, as in the master suite (Jim, 6 Oct: "all rooms in the crown should have same window as master bedroom")
    crown.glass_wall("suit room glass", R_GL + 0.2, b0, b1, M, state="frosted", doors=[(76.0, 2.2)])


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
    for k, there in ((-1, True), (1, True)):               # both pods home (furnishing.py)
        pb = bc + k * tang(7.6); q = at(RM + 0.2, pb, 0.0)
        lib.cyl("pad", 2.9, 0.05, q, M["graphite"], verts=96, bevel=0.01)
        furn.ring_prism("pad ring", [(q[0] + 2.6 * math.cos(2 * math.pi * i / 96), q[1] + 2.6 * math.sin(2 * math.pi * i / 96)) for i in range(96)],
                        [(q[0] + 2.45 * math.cos(2 * math.pi * i / 96), q[1] + 2.45 * math.sin(2 * math.pi * i / 96)) for i in range(96)], 0.05, 0.054, M["hazard"])
        furn.ring_prism("pad glow", [(q[0] + 2.75 * math.cos(2 * math.pi * i / 96), q[1] + 2.75 * math.sin(2 * math.pi * i / 96)) for i in range(96)],
                        [(q[0] + 2.7 * math.cos(2 * math.pi * i / 96), q[1] + 2.7 * math.sin(2 * math.pi * i / 96)) for i in range(96)], 0.05, 0.056,
                        lib.emission("pad glow", (0.95, 0.80, 0.55), 6.0))
        if there: pod("pod", (q[0], q[1], 0.05), face_cw(pb), M)                  # its nose (+x) out, to the great door
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
    # five long lines of light in the ceiling, daylight white, following it up under the spire; washers on both walls
    line = lib.emission("hangar light line", (0.96, 0.97, 1.0), 26.0)
    for r in (R_GL + 2.2, RM - 3.0, RM, RM + 3.0, R_OUT - 2.2):
        for bb in crown.steps(b0 + tang(0.8, r), b1 - tang(0.8, r), 1.0 / 0.5)[:-1]:
            zc = ceil_at(bb + 0.25) - 0.02; crown.curved_box("light line", r - 0.2, r + 0.2, bb, min(bb + 0.5, b1 - tang(0.8, r)), zc - 0.03, zc, line)
    CR.washers(b0, b1, 200)
    # at the Door end, where the house begins: a pair of kentias flanking the way to the Door, a leather bench along the glass
    import seating, plants
    for k in (-1, 1): plants.make("kentia palm", at(RM + k * 3.6, b1 - tang(1.3, RM + k * 3.6), 0.0), seed=170 + k, pot=(1.0, 0.75, "black"), height=3.4, stems=3)
    bw_ = b1 - FACE - tang(0.45, RM + 5.7)                   # the bench against the cross wall by the Door, beyond the outer kentia
    crown.curved_box("hangar bench", RM + 4.4, RM + 7.0, bw_ - tang(0.25, RM + 5.7), bw_ + tang(0.25, RM + 5.7), 0.0, 0.42, M["steel"])
    crown.curved_box("hangar bench pad", RM + 4.4, RM + 7.0, bw_ - tang(0.25, RM + 5.7), bw_ + tang(0.25, RM + 5.7), 0.42, 0.48, M["leather"])
    # the Glide side, frosted: a wall of bronze and glass from the floor to the ceiling, as in the master suite (Jim, 6 Oct: "all rooms in the crown should have same window as master bedroom")
    crown.glass_wall("hangar glass", R_GL + 0.2, b0, b1, M, state="frosted", doors=[(85.0, 2.6)])


MORE = {
    "suit": dict(build=suit_room, span=(72.0, 78.0), sun=(80.0, 12.0), cams={
        "suit": dict(loc=at(R_GL + 0.6, 77.4, 1.5), target=at(R_OUT - 0.8, 73.6, 1.3), lens=20),
    }, stops={"suit": at(RM, 75.6, 0.0)}),
    "hangar": dict(build=pod_hangar, span=(78.0, 91.44), sun=(80.0, 12.0), cams={
        "hangar": dict(loc=at(R_GL + 0.5, 90.6, 1.6), target=at(RM + 0.4, 81.4, 1.0), lens=18),
    }, stops={"hangar": at(RM - 1.0, 84.7, 0.0)}),
    "dressing": dict(build=dressing_room, span=(108.0, 116.64), sun=(112.0, 10.0), cams={
        "suite_door": dict(loc=at(R_GL - 2.4, 112.4, 1.6), target=at(R_GL + 0.2, 109.3, 2.2), lens=22),
        "dressing": dict(loc=at(R_GL + 0.5, 115.9, 1.5), target=at(R_OUT - 0.5, 110.0, 1.2), lens=20),
    }, stops={"dressing": at(RM - 0.6, 112.3, 0.0)}),
    "bath_up": dict(build=bath_up, span=(130.32, 144.0), sun=(130.0, 14.0), cams={
        "bath_up": dict(loc=at(R_GL + 0.6, 141.8, 1.5), target=at(R_OUT - 1.0, 136.9, 0.9), lens=20),
        "bath_up2": dict(loc=at(RM - 0.5, 133.3, 1.5), target=at(R_OUT - 0.2, 137.5, 1.4), lens=20),
    }, stops={"bath_up": at(RM - 0.6, 137.0, 0.0)}),
    "wine": dict(build=wine_room, span=(216.0, 223.2), sun=(222.0, 22.0), cams={
        "wine": dict(loc=at(R_GL + 0.55, 222.5, 1.5), target=at(R_OUT - 0.6, 217.2, 1.3), lens=20),
        "wine2": dict(loc=at(RM - 1.6, 217.4, 1.5), target=at(R_OUT - 3.4, 223.2, 1.5), lens=22),
    }, stops={"wine": at(RM + 1.4, 219.4, 0.0)}),
    "kitchen_up": dict(build=chefs_kitchen, span=(241.2, 252.0), sun=(246.0, 18.0), cams={
        "kitchen_up": dict(loc=at(RM - 2.4, 250.8, 1.6), target=at(R_OUT - 2.0, 243.2, 1.1), lens=20),
        "kitchen_up2": dict(loc=at(RM + 1.2, 245.4, 1.6), target=at(RM - 0.6, 252.0, 1.4), lens=20),
    }, stops={"kitchen_up": at(RM + 1.0, 247.6, 0.0)}),
    "day_room": dict(build=guests_day_room, span=(252.0, 261.0), sun=(258.0, 14.0), cams={
        "day_room": dict(loc=at(R_GL + 0.6, 260.4, 1.5), target=at(R_OUT - 0.6, 254.5, 1.1), lens=19),
    }, stops={"day_room": at(RM - 0.6, 256.4, 0.0)}),
    "gallery": dict(build=gallery, span=(279.0, 288.0), sun=(284.0, 14.0), cams={
        "gallery": dict(loc=at(R_GL + 0.6, 287.4, 1.6), target=at(R_OUT - 0.4, 281.4, 1.5), lens=20),
    }, stops={"gallery": at(RM + 1.0, 283.5, 0.0)}),
}
