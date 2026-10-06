"""The Crown's Wellness (part 4, bearings 180 to 216), revision H: the spa, the sky pool and the gym, each furnished to
its line in the furnishing program (palace/tools/furnishing.py), in the same frame and with the same helpers as
crown_rooms.py, which adds it to its ROOMS.
  C-13 Spa, 180 to 191.5: a round hot pool in a basalt plinth, a cold plunge, a cedar sauna with a glass front against
       the outer wall (a window inside it), two daybeds in white leather, two chaises facing the windows under a halo,
       tree ferns, boxwood along the windows, an orchid.
  C-14 Sky pool, 191.5 to 204.5: a pool 25 m by 6 m along the ring, lit under the water, three halos over it, daybeds
       in pairs along the windows facing it, a chosen line of plants on the inner side (kentias, a red and an orange
       maple, a fiddle-leaf fig), birds of paradise at its ends.
  C-15 Gym, 204.5 to 216: four treadmills, three bikes and two rowers facing the windows, a power rack, benches and
       dumbbells before a mirror wall, six mats by the glass, a leather bench, chosen plants, Jim's photographs of Mars
       on the cross wall, three halos.
Frosted glass on the Glide for the spa and the gym, clear for the pool, a door into each."""
import bpy, math
from mathutils import Vector
import lib, crown
import crown_rooms as CR
from crown import P, R_IN, R_OUT, R_GL, ceil_at, D
from crown_rooms import RM, at, tang, face_in, face_out, face_cw, face_ccw

B0, B1 = 180.0, 216.0; SPA, GYM = 191.5, 204.5             # the part, and the cross walls between its rooms (room_program.py)
PR0, PR1 = 124.0, 130.0; PC = (PR0 + PR1) / 2; PL = 25.0    # the pool, from radius PR0 to PR1, 25 m long at its middle
PB = (SPA + GYM) / 2; PS0, PS1 = PB - PL / 2 / PC / D, PB + PL / 2 / PC / D
DEPTH = 1.6
GLASS = R_GL + 0.2                                          # the glass along the Glide


def floors(M):
    """basalt in the spa, travertine round the pool (a hole for the water), oak boards in the gym"""
    crown.sector("floor", R_GL, R_OUT, B0 - crown.PAD, SPA, 0.0, M["basalt"])
    for (r0, r1, a, b) in ((R_GL, R_OUT, SPA, PS0), (R_GL, R_OUT, PS1, GYM), (R_GL, PR0, PS0, PS1), (PR1, R_OUT, PS0, PS1)):
        crown.sector("floor", r0, r1, a, b, 0.0, M["stone_linen"])
    crown.sector("floor", R_GL, R_OUT, GYM, B1 + crown.PAD, 0.0, M["oak"])


def pool(M):
    """the basin in dark green tile with three lane lines, the water 7 cm below the deck, lines of light under it along
    both sides, a travertine coping, steps down in the inner lane at the spa end"""
    import pent_rooms
    water = pent_rooms.pool_water("sky pool water", (0.70, 0.90, 0.88))
    tile = lib.principled("sky pool tile", (0.035, 0.085, 0.09), 0.25, **{"Coat Weight": 0.5})
    line = lib.principled("sky pool line", (0.01, 0.015, 0.017), 0.3, **{"Coat Weight": 0.5})
    glow = lib.emission("sky pool light", (0.80, 0.94, 1.0), 30.0)
    e = 0.2; te = tang(e, PC)
    crown.curved_box("pool bottom", PR0 - e, PR1 + e, PS0 - te, PS1 + te, -DEPTH - 0.2, -DEPTH, tile)
    for (r0, r1) in ((PR0 - e, PR0), (PR1, PR1 + e)): crown.curved_box("pool wall", r0, r1, PS0, PS1, -DEPTH, 0.0, tile)
    for (a, b) in ((PS0 - te, PS0), (PS1, PS1 + te)): crown.curved_box("pool end", PR0 - e, PR1 + e, a, b, -DEPTH, 0.0, tile)
    crown.sector("pool water", PR0, PR1, PS0, PS1, -0.07, water)
    for r in (PR0 + 0.02, PR1 - 0.02): crown.curved_box("pool light", r - 0.005, r + 0.005, PS0 + tang(0.4, PC), PS1 - tang(0.4, PC), -0.42, -0.38, glow)
    for r in (PR0 + 1.0, PC, PR1 - 1.0):                     # a lane line down the middle of each lane, a T at each end
        a, b = PS0 + tang(2.0, r), PS1 - tang(2.0, r)
        crown.curved_box("lane line", r - 0.125, r + 0.125, a, b, -DEPTH, -DEPTH + 0.004, line)
        for bb in (a, b): crown.curved_box("lane tee", r - 0.5, r + 0.5, bb - tang(0.125, r), bb + tang(0.125, r), -DEPTH, -DEPTH + 0.004, line)
    t = tang(0.4, PC); edge = M["stone_linen"]
    for (r0, r1) in ((PR0 - 0.4, PR0), (PR1, PR1 + 0.4)): crown.curved_box("pool edge", r0, r1, PS0 - t, PS1 + t, -0.005, 0.012, edge)
    for (a, b) in ((PS0 - t, PS0), (PS1, PS1 + t)): crown.curved_box("pool edge", PR0, PR1, a, b, -0.005, 0.012, edge)
    for k in range(5):                                         # each step a block on the basin's floor, the top one shortest
        crown.curved_box("pool step", PR0, PR0 + 2.0, PS0, PS0 + tang(0.35 * (k + 1), PC), -DEPTH, -DEPTH / 6 * (k + 1), tile)


def sky_pool(M):
    import seating, tables, lights, plants
    pool(M)
    towel = seating.fabric("towel white", (0.86, 0.85, 0.82), "boucle"); cushion = seating.fabric("pool linen", (0.82, 0.79, 0.72), "linen")
    teak = lib.wood("teak", (0.36, 0.22, 0.12), (0.22, 0.13, 0.07), 0.45)
    # daybeds in pairs along the windows, heads to the windows, facing the water; a drum with towels between each pair
    rd = R_OUT - 2.55
    for k, bp in enumerate((PS0 + tang(3.4, rd), PS0 + tang(9.6, rd), PS1 - tang(9.6, rd), PS1 - tang(3.4, rd))):
        for s in (-1, 1):
            bb = bp + s * tang(0.85, rd)
            seating.daybed("pool daybed", at(rd, bb, 0.0), face_cw(bb), length=2.2, width=1.05, fabric_mat=cushion, frame_mat=teak, seed=400 + 2 * k + (s > 0))
        tables.drum("towel drum", at(rd + 0.75, bp, 0.0), d=0.5, h=0.45)
        for j in range(3): seating.soft_box("towel", (0.36, 0.26, 0.05), at(rd + 0.75, bp, 0.475 + 0.05 * j), towel, r=0.02, crown=0.004, bulge=0.004, crease=0.002, seed=j, yaw=face_in(bp) + 0.1 * j)
    # the inner side, a chosen line: kentias at the ends, a red and an orange maple, a fiddle-leaf fig in the middle;
    # birds of paradise at the pool's ends by the windows
    line = [("kentia palm", dict(pot=(0.95, 0.72, "black"), height=3.6, stems=3)),
            ("japanese maple", dict(pot=(1.3, 0.62, "basalt"), height=3.4, colour="red", stems=3)),
            ("fiddle-leaf fig", dict(pot=(0.8, 0.66, "white"), height=2.8, stems=3)),
            ("japanese maple", dict(pot=(1.3, 0.62, "basalt"), height=3.6, colour="orange", stems=3)),
            ("kentia palm", dict(pot=(0.95, 0.72, "black"), height=3.3, stems=3))]
    for k, (bb, (kind, kw)) in enumerate(zip([PS0 + (PS1 - PS0) * (j + 0.5) / 5 for j in range(5)], line)):
        plants.make(kind, at(R_GL + 2.6, bb, 0.0), seed=410 + k, **kw)
    for k, bb in enumerate((SPA + tang(1.4, R_OUT - 1.5), GYM - tang(1.4, R_OUT - 1.5))):
        plants.make("bird of paradise", at(R_OUT - 1.5, bb, 0.0), seed=420 + k, pot=(1.0, 0.7, "bronze"), height=3.2, stems=5)
    # three halos over the water
    for k in (-1, 0, 1):
        bb = PB + k * tang(7.8, PC); lights.halo("pool halo", at(PC, bb), d=4.0, z=6.2, ceiling=ceil_at(bb), watts=1200)


def spa(M):
    import seating, tables, lights, plants
    water = bpy.data.materials.get("sky pool water")
    tile = bpy.data.materials.get("sky pool tile")
    # the hot pool: a round basin in a basalt plinth, lit from under its rim
    hc = Vector(at(RM + 0.4, 185.4))
    rim = lib.cyl("hot pool rim", 2.0, 0.5, (hc.x, hc.y, 0.0), M["basalt"], verts=128, bevel=0.02)
    cut = lib.cyl("hot pool cut", 1.7, 1.0, (hc.x, hc.y, -0.1), None, verts=128); cut.hide_render = True; cut.hide_viewport = True
    bo = rim.modifiers.new("hollow", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut; bo.solver = "EXACT"
    lib.cyl("hot pool basin", 1.72, 0.06, (hc.x, hc.y, -0.03), tile, verts=96)
    lib.cyl("hot pool water", 1.7, 0.002, (hc.x, hc.y, 0.42), water, verts=128)
    bpy.ops.mesh.primitive_torus_add(major_radius=2.04, minor_radius=0.018, major_segments=192, minor_segments=8, location=(hc.x, hc.y, 0.03))
    g = bpy.context.active_object; g.name = "hot pool glow"; g.data.materials.append(lib.emission("hot pool glow", (1.0, 0.78, 0.55), 18.0))
    lib.point_light("hot pool light", (hc.x, hc.y, 0.3), 60, (0.75, 0.92, 1.0), 0.6)
    # the cold plunge, a deep round tub of basalt by the sauna
    cc = Vector(at(R_OUT - 3.0, 183.6))
    tub = lib.cyl("plunge rim", 0.95, 0.95, (cc.x, cc.y, 0.0), M["basalt"], verts=96, bevel=0.015)
    cut2 = lib.cyl("plunge cut", 0.78, 1.0, (cc.x, cc.y, 0.15), None, verts=96); cut2.hide_render = True; cut2.hide_viewport = True
    bo = tub.modifiers.new("hollow", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cut2; bo.solver = "EXACT"
    lib.cyl("plunge water", 0.78, 0.002, (cc.x, cc.y, 0.86), water, verts=96)
    # the sauna against the outer wall, round a window: cedar, its front of glass with a glass door
    cedar = lib.wood("cedar", (0.55, 0.33, 0.18), (0.40, 0.22, 0.11), 0.6, along="Z", coat=0.0)
    sb = 181.2; sw = tang(3.8, R_OUT - 1.6); r_f = R_OUT - 3.2
    crown.curved_box("sauna floor", r_f, R_OUT - 0.05, sb - sw / 2, sb + sw / 2, 0.0, 0.08, cedar)
    for (a, b) in ((sb - sw / 2, sb - sw / 2 + tang(0.08, R_OUT)), (sb + sw / 2 - tang(0.08, R_OUT), sb + sw / 2)):
        crown.curved_box("sauna side", r_f, R_OUT - 0.05, a, b, 0.0, 2.6, cedar)
    crown.curved_box("sauna roof", r_f, R_OUT - 0.05, sb - sw / 2, sb + sw / 2, 2.52, 2.6, cedar)
    crown.curved_box("sauna glass", r_f - 0.02, r_f, sb - sw / 2, sb + sw / 2, 0.08, 2.52, M["glass"])
    for bb in (sb - sw / 2 + tang(0.04, r_f), sb + sw / 2 - tang(0.04, r_f), sb - tang(0.45, r_f), sb + tang(0.45, r_f)):
        crown.curved_box("sauna frame", r_f - 0.04, r_f + 0.01, bb - tang(0.025, r_f), bb + tang(0.025, r_f), 0.0, 2.52, M["bronze_dark"])
    for (r0, r1, z) in ((R_OUT - 1.0, R_OUT - 0.05, 0.95), (R_OUT - 1.75, R_OUT - 1.0, 0.48)):
        crown.curved_box("sauna bench", r0, r1, sb - sw / 2 + tang(0.1, R_OUT), sb + sw / 2 - tang(0.1, R_OUT), z - 0.05, z, cedar)
    lights.strip("sauna glow", at(R_OUT - 1.0, sb - sw / 2 + tang(0.15, R_OUT), 0.4), at(R_OUT - 1.0, sb + sw / 2 - tang(0.15, R_OUT), 0.4), color=(1.0, 0.62, 0.32), strength=12.0)
    lib.point_light("sauna light", at(R_OUT - 0.9, sb, 2.2), 40, (1.0, 0.6, 0.3), 0.1)
    # two daybeds in white leather by the hot pool, heads to the Glide; travertine drums
    white = seating.fabric("white leather", (0.80, 0.78, 0.74), "leather")
    for k, bb in enumerate((184.1, 186.7)):
        seating.daybed("spa daybed", at(R_GL + 3.4, bb, 0.0), face_cw(bb) + math.pi, length=2.2, width=1.05, fabric_mat=white, seed=430 + k)
    tables.drum("spa drum", at(R_GL + 2.7, 185.4, 0.0), d=0.45, h=0.45)
    # tree ferns, a group of three by the glass at the quiet end; boxwood balls along the windows
    for k, (r, bb, h) in enumerate(((R_GL + 1.5, 181.0, 2.5), (R_GL + 2.5, 182.2, 3.1), (R_GL + 1.3, 182.8, 2.8))):
        plants.make("tree fern", at(r, bb, 0.0), seed=440 + k, pot=(0.9, 0.5, "basalt"), height=h)
    for k, bb in enumerate((185.6, 187.2, 188.8, 190.4)):
        plants.make("boxwood", at(R_OUT - 0.9, bb, 0.0), seed=450 + k, pot=(0.7, 0.55, "white", True), d=0.8)
    plants.make("orchid", at(R_GL + 2.7, 185.4, 0.45), seed=455, pot=(0.2, 0.16, "white"), colour="white", spikes=2)
    # two chaises facing the windows at the far end, a drum between them, under a halo
    for k, bb in enumerate((188.7, 190.0)):
        seating.daybed("spa chaise", at(R_OUT - 3.4, bb, 0.0), face_out(bb), length=2.0, width=0.85, fabric_mat=white, seed=436 + k)
    tables.drum("spa drum", at(R_OUT - 3.6, 189.35, 0.0), d=0.42, h=0.42)
    lights.halo("spa halo", at(R_OUT - 3.6, 189.35), d=4.0, z=4.8, ceiling=ceil_at(189.35), watts=700)
    # light: a cluster of opal globes low over the hot pool
    lights.globes("spa globes", (hc.x, hc.y), n=11, spread=1.1, low=2.6, high=3.8, ceiling=ceil_at(185.4), watts=48, seed=11)


def gym(M):
    import seating, plants, lights, gym as G
    leather = seating.fabric("cognac leather", (0.30, 0.14, 0.06), "leather")
    # a row facing the windows: four treadmills, three studio bikes, two rowers
    rm = R_OUT - 3.0
    for bb in (205.7, 206.35, 207.0, 207.65): G.treadmill("treadmill", at(rm, bb, 0.0), face_out(bb))
    for bb in (208.5, 209.0, 209.5): G.bike("bike", at(rm + 0.3, bb, 0.0), face_out(bb))
    for bb in (210.4, 210.95): G.rower("rower", at(rm + 0.1, bb, 0.0), face_out(bb))
    # weights before the mirror on the cross wall: the dumbbells, a power rack, two benches
    G.dumbbell_rack("dumbbell rack", at(129.6, B1 - tang(0.62, 129.6), 0.0), face_ccw(B1), length=2.6)
    crown.curved_box("gym mirror", 126.6, R_OUT - 0.4, B1 - tang(0.2, 130) - tang(0.02, 130), B1 - tang(0.2, 130), 0.15, 2.7, lib.principled("gym mirror", (0.92, 0.92, 0.92), 0.02, 1.0))
    G.power_rack("power rack", at(132.6, 214.2, 0.0), face_cw(214.2))
    for r in (127.9, 130.9): G.weight_bench("weight bench", at(r, 214.3, 0.0), face_cw(214.3))
    # in the middle, a floor of black rubber for free training: plyo boxes, kettlebells, medicine balls, a heavy bag
    zc, zr = 208.0, 128.2
    crown.curved_box("training floor", zr - 2.2, zr + 2.2, zc - tang(3.6, zr), zc + tang(3.6, zr), 0.0, 0.012, lib.principled("gym floor rubber", (0.025, 0.025, 0.027), 0.85))
    for k, (h, dx) in enumerate(((0.5, -0.9), (0.6, 0.0), (0.75, 0.95))):
        bb = zc + tang(dx - 2.0, zr + 1.2); G.plyo_box("plyo box", at(zr + 1.2, bb, 0.012), face_in(bb), size=(0.76, 0.6, h))
    for k in range(6):
        bb = zc + tang(-0.4 + 0.45 * k, zr - 1.3); G.kettlebell("kettlebell", at(zr - 1.3, bb, 0.012), face_in(bb), kg=8 + 4 * k)
    for k in range(4):
        bb = zc + tang(2.2 + 0.4 * k, zr + 0.8); G.med_ball("medicine ball", at(zr + 0.8, bb, 0.012), d=0.3 + 0.02 * k)
    q = at(zr - 0.6, zc + tang(3.0, zr - 0.6)); G.heavy_bag("heavy bag", (q[0], q[1], 0.0), ceiling=ceil_at(zc) - 0.05)
    # six mats for yoga by the glass
    for k, (r, bb) in enumerate([(r, bb) for r in (R_GL + 4.9, R_GL + 7.1) for bb in (211.7, 212.7, 213.7)]):
        G.mat("yoga mat", at(r, bb, 0.0), face_out(bb), color=((0.20, 0.25, 0.22), (0.28, 0.24, 0.20), (0.24, 0.20, 0.17))[k % 3])
    # a leather bench along the glass, a fiddle-leaf fig either end
    seating.bench("gym bench", at(R_GL + 1.1, 210.4, 0.0), face_out(210.4), length=3.0, depth=0.55, fabric_mat=leather)
    for k, s_ in enumerate((-1, 1)):
        bb = 210.4 + s_ * tang(2.2, R_GL + 1.1); plants.make("fiddle-leaf fig", at(R_GL + 1.1, bb, 0.0), seed=460 + k, pot=(0.75, 0.62, "white"), height=2.8)
    # chosen plants: an orange maple by the mats, an olive in the window corner, a kentia in the far corner
    plants.make("japanese maple", at(R_GL + 4.2, 215.0, 0.0), seed=463, pot=(1.3, 0.62, "basalt"), height=3.6, colour="orange", stems=3)
    plants.make("olive", at(R_OUT - 1.2, GYM + tang(1.3, R_OUT - 1.2), 0.0), seed=464, pot=(1.1, 0.8, "terracotta"), height=3.0, stems=2)
    plants.make("kentia palm", at(R_OUT - 1.1, B1 - tang(1.6, R_OUT - 1.1), 0.0), seed=465, pot=(0.95, 0.72, "black"), height=3.4, stems=3)
    # Jim's photographs of Mars on the cross wall from the pool
    t = 0.15 / 130.0 / D
    for (r, img) in ((126.2, "port-liftoff.jpg"), (131.0, "mars-earth.jpg")):
        CR.framed_print("gym print", CR.repo_file("palace", "design", "img", img), 2.4, 1.35, at(r, GYM + t + tang(0.03, r), 1.95), face_cw(GYM), M)
    # three halos 5 m across: over the machines, the mats, the weights
    for (r, bb) in ((rm - 0.6, 208.0), (R_GL + 6.0, 212.7), (131.0, 214.0)):
        lights.halo("gym halo", at(r, bb), d=5.0, z=5.2, ceiling=ceil_at(bb), watts=1000)


def wellness(M, rnd):
    """the whole part: its shell, the floors, the cross walls (wide openings near the Glide), the glass on the Glide,
    then each room"""
    o = crown.ring_room(B0, B1, M, M["basalt"])
    bpy.data.objects.remove(o[0])                      # the floor: remade per room, with a hole for the pool
    floors(M)
    crown.slat_ceiling(B0 - crown.PAD, B1 + crown.PAD, M)
    crown.partition(SPA, M, opening=(R_GL + 1.2, R_GL + 6.2), head=4.0)
    crown.partition(GYM, M, opening=(R_GL + 1.2, R_GL + 4.6), head=3.6)
    crown.glass_wall("spa glass", GLASS, B0, SPA, M, state="frosted", doors=[(186.0, 2.2)])
    crown.glass_wall("pool glass", GLASS, SPA, GYM, M, state="clear", doors=[(PB, 2.4)])
    crown.glass_wall("gym glass", GLASS, GYM, B1, M, state="frosted", doors=[(213.0, 2.2)])
    crown.glide_lights(B0, B1)
    sky_pool(M); spa(M); gym(M)
    CR.washers(B0, SPA, 160); CR.washers(SPA, GYM, 160); CR.washers(GYM, B1, 200)


WELLNESS = {
    "wellness": dict(build=wellness, span=(B0, B1), sun=(198.0, 30.0), cams={
        "wellness": dict(loc=at(R_GL + 4.4, SPA + tang(1.2, R_GL + 4.4), 1.55), target=at(PC + 1.0, PB + 2.0, 0.5), lens=18),
        "wellness2": dict(loc=at(130.9, GYM - tang(1.0, 130.9), 1.45), target=at(R_GL + 3.0, PB - 3.0, 0.9), lens=19),
        "spa": dict(loc=at(R_GL + 1.6, SPA - tang(1.0, R_GL + 1.6), 1.6), target=at(R_OUT - 2.0, 183.0, 1.0), lens=19),
        "gym": dict(loc=at(R_GL + 2.0, GYM + tang(1.4, R_GL + 2.0), 1.6), target=at(R_OUT - 1.0, 211.0, 1.1), lens=19),
    }, stops={"wellness": at(PC, PS0 - tang(1.0, PC), 0.0), "spa": at(RM - 1.0, 187.6, 0.0), "gym": at(RM - 0.6, 208.6, 0.0)}),
}
