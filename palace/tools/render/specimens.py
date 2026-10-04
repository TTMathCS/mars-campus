"""A studio to check Arcadia's plants and furniture before they go into a room: a pale floor curving up into a backdrop,
daylight from a low sun and the sky, each piece at its real size. Not for the site: a piece goes into a room only once
it looks real here (AGENTS.md, "Furniture fits the rooms, and every plant is chosen").
  bvenv/bin/python blend/specimens.py <set[,set...]> <out with %s> [w h spp]
sets: trees, tropical, small, maple_close, orchid_close, seats, bed_desk"""
import bpy, bmesh, math, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, plants


def studio():
    sc = lib.reset()
    bm = bmesh.new()                          # the floor running back, then curving up into the backdrop
    prof = [(-14.0, 0.0), (4.0, 0.0)] + [(4.0 + 4.0 * math.sin(a), 4.0 * (1 - math.cos(a))) for a in [math.pi / 2 * k / 16 for k in range(1, 17)]] + [(8.0, 12.0)]
    rows = []
    for x in (-24.0, 24.0):
        rows.append([bm.verts.new((x, y, z)) for (y, z) in prof])
    for i in range(len(prof) - 1): bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    o = lib.mesh_obj("studio", bm, lib.principled("studio floor", (0.50, 0.48, 0.45), 0.75), smooth=True)
    lib.sun(34, 205, 3.2, angle_deg=1.5, color=(1.0, 0.88, 0.74)); lib.sky_world(34, 205, 0.45)
    return sc


SETS = {
    "trees": dict(cam=((0, -14.0, 1.7), (0, 0, 1.7), 30), items=[
        ("japanese maple", (-6.6, 0, 0), 4, (1.4, 0.55, "basalt"), dict(height=3.0, colour="red", stems=3)),
        ("japanese maple", (-3.3, 0.6, 0), 7, None, dict(height=2.6, colour="orange", stems=2)),
        ("ginkgo", (0.0, 1.2, 0), 2, (1.2, 0.7, "bronze"), dict(height=4.0)),
        ("olive", (3.4, 0.4, 0), 5, (1.3, 0.8, "travertine", True), dict(height=3.2)),
        ("lemon", (6.6, -0.2, 0), 3, (0.8, 0.6, "terracotta"), dict(height=2.2))]),
    "tropical": dict(cam=((0, -12.0, 1.7), (0, 0, 1.6), 30), items=[
        ("fiddle-leaf fig", (-5.4, 0, 0), 2, (0.7, 0.6, "white"), dict(height=2.6)),
        ("bird of paradise", (-1.9, 0.6, 0), 3, (1.0, 0.7, "bronze"), dict(height=3.2)),
        ("kentia palm", (1.9, 0.6, 0), 4, (0.9, 0.7, "black"), dict(height=3.0)),
        ("tree fern", (5.4, 0.2, 0), 6, (1.0, 0.5, "basalt"), dict(height=2.6))]),
    "small": dict(cam=((0, -7.5, 1.4), (0, 0, 0.7), 32), items=[
        ("orchid", (-3.6, 0, 0.9), 2, (0.22, 0.18, "white"), dict(colour="white")),
        ("orchid", (-2.6, 0.3, 0.9), 5, (0.22, 0.18, "black"), dict(colour="magenta")),
        ("agave", (-0.7, 0.4, 0), 3, (1.0, 0.45, "travertine"), dict(size=0.8)),
        ("golden barrel", (1.3, 0, 0), 4, (0.75, 0.3, "basalt", True), dict(r=0.26)),
        ("lavender", (2.8, 0.2, 0), 6, (0.7, 0.4, "terracotta"), dict(size=0.6)),
        ("boxwood", (4.2, 0.4, 0), 7, (0.6, 0.6, "white", True), dict(d=0.75))]),
}
SETS["seats"] = dict(cam=((-0.6, -11.5, 1.6), (-0.6, 0, 0.8), 30), build=lambda: seats())
SETS["bed_desk"] = dict(cam=((0.6, -9.0, 1.7), (0.6, 0, 1.2), 30), build=lambda: bed_desk())
SETS["maple_close"] = dict(cam=((-6.6, -3.2, 2.0), (-6.6, 0, 2.2), 45), items=SETS["trees"]["items"][:1])
SETS["orchid_close"] = dict(cam=((-3.1, -1.6, 1.5), (-3.1, 0, 1.3), 50), items=SETS["small"]["items"][:2])


def seats():
    import seating, tables, lights
    seating.sofa("sofa", (-6.2, 0.6, 0), 0.0, length=4.4, fabric_mat=seating.fabric("oat boucle", (0.64, 0.58, 0.50), "boucle"))
    tables.coffee_table("coffee slab", (-6.2, -1.1, 0), 0.0, length=2.2, width=1.0)
    seating.crescent("crescent", (-0.4, 1.4, 0), 0.0, radius=2.4, length=5.8, fabric_mat=seating.fabric("ink velvet", (0.10, 0.13, 0.22), "velvet"))
    tables.coffee_table("coffee round", (-0.4, -0.6, 0), 0.0, length=1.4, kind="round", mat=seating.stone("green marble", (0.16, 0.24, 0.20), (0.75, 0.78, 0.74), "marble", 0.12))
    seating.club_chair("club", (4.0, 0.2, 0), 0.25, fabric_mat=seating.fabric("rust velvet", (0.42, 0.14, 0.06), "velvet"))
    seating.ottoman("ottoman", (4.2, -1.6, 0), d=0.9, fabric_mat=seating.fabric("cognac leather", (0.36, 0.17, 0.07), "leather"))
    seating.daybed("daybed", (7.4, 0.6, 0), -0.3)
    tables.drum("drum", (2.6, 0.9, 0))
    lights.arc_lamp("arc", (-8.9, 0.9, 0), -0.35, reach=2.0)


def bed_desk():
    import seating, tables, lights, bed, crown_rooms
    M = crown_rooms.materials()
    bed.grand_bed("grand bed", (-3.2, 1.2, 0), 0.0, M, ceiling=6.0)
    tables.desk("desk", (4.0, 1.6, 0), 0.0)
    seating.desk_chair("desk chair", (4.0, 0.9, 0), math.pi + 0.3)
    seating.dining_chair("dining chair", (6.6, 0.6, 0), 0.4)
    lights.halo("halo", (4.6, 1.0), d=2.4, z=3.4, ceiling=6.0)


def build(name):
    sc = studio(); S = SETS[name]
    if "build" in S:
        S["build"](); c = S["cam"]; lib.camera(name, c[0], c[1], lens=c[2]); lib.photo_finish(0.2, 0.12); return sc
    for (kind, loc, seed, pot, kw) in S["items"]:
        if loc[2] > 0:                        # on a plinth
            lib.box("plinth", (0.5, 0.5, loc[2]), (loc[0], loc[1], loc[2] / 2), lib.principled("plinth", (0.7, 0.68, 0.64), 0.6), bevel=0.01)
        plants.make(kind, loc, seed=seed, pot=pot, **kw)
    c = S["cam"]; lib.camera(name, c[0], c[1], lens=c[2]); lib.photo_finish(0.2, 0.12)
    return sc


if __name__ == "__main__":
    a = sys.argv[1:]; sets = a[0].split(","); out = a[1]
    w, h, spp = (int(a[2]), int(a[3]), int(a[4])) if len(a) > 4 else (1280, 720, 48)
    for s in sets:
        p = os.path.abspath(out.replace("%s", s))
        if os.path.exists(p): print("have", p, flush=True); continue
        t = time.time(); build(s); print("built", s, "in %.1f s" % (time.time() - t), flush=True)
        tmp = p.replace(".jpg", ".part.jpg"); t = time.time(); lib.render(tmp, (w, h), spp, exposure=-0.3); os.replace(tmp, p)
        print("rendered", s, "in %.1f s" % (time.time() - t), flush=True)
