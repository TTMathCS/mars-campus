"""The Orb's +72 m floor, for stills and 360s: the Earth lounge (O-07) with the universe switched on, at night.
The Orb is 48 m across with a 2 m shell. On each floor five rooms sit between an outer lane along the windows and an
inner lane along the glass round the Wormhole Gate, a ball 18 m across floating in a round space 24 m across from
+60 to +84 m; the passages between the rooms lie under the Crown's five spires (floor plans Rev G, orb.html).
Built in the Crown's frame (crown.py): z = 0 is the Crown's floor at +41 m, so the +72 m floor is at z = 31.
  bvenv/bin/python blend/orb.py <room> <jobs> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, furn, crown, crown_rooms
from crown import P, D

A = lib.ASSETS
RI, RH, LANE, GATE_R = 22.0, 12.0, 2.4, 9.0     # the shell's inside, the glass round the Gate, a lane, the Gate
Z72 = 72.0 - crown.FL                           # the +72 m floor in the Crown's frame
H = 7.5                                         # floor to ceiling (the underside of the +80 m floor)
R0, R1 = RH + LANE, RI - LANE                   # the rooms, between the lanes, at +72 m


def shell_r(z): return math.sqrt(max(0.0, RI * RI - z * z))      # the shell's inside, z up from the Orb's centre
def at(r, b, z=0.0): v = P(r, b, z); return (v.x, v.y, v.z)
def gap(r): return LANE / r / D                                 # a passage, in degrees at radius r
def slot(i): g = gap((R0 + R1) / 2) / 2; return 18 + 72 * i + g, 18 + 72 * (i + 1) - g     # room i between two spires
def face_in(b): return -b * D                                   # a model whose front is -y faces the Orb's middle
def face_out(b): return math.pi - b * D
def tang(m, r): return m / r / D


def ring(name, r0, r1, z, mat, segs=192):
    """a flat ring (a floor, a ceiling, a ledge) from radius r0 to r1 at height z"""
    return furn.lathe(name, [(r0, z), (r1, z)], mat, segs, (0, 0, 0))


def gate_material():
    """the Gate's skin: a dark glossy membrane showing the far place it opens onto, a nebula of blue, violet and teal"""
    m, nt = lib._mat("gate membrane")
    if nt is None: return m
    N = nt.nodes; L = nt.links; b = N["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.004, 0.005, 0.008, 1); b.inputs["Roughness"].default_value = 0.08
    b.inputs["Coat Weight"].default_value = 1.0; b.inputs["Coat Roughness"].default_value = 0.02
    tc = N.new("ShaderNodeTexCoord"); n1 = N.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = 0.35; n1.inputs["Detail"].default_value = 12; n1.inputs["Roughness"].default_value = 0.62
    L.new(tc.outputs["Object"], n1.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); E = cr.color_ramp.elements
    E[0].position = 0.38; E[0].color = (0.0, 0.0, 0.0, 1); E[1].position = 0.82; E[1].color = (0.55, 0.75, 1.0, 1)
    e = E.new(0.55); e.color = (0.10, 0.06, 0.32, 1); e = E.new(0.68); e.color = (0.45, 0.12, 0.42, 1); e = E.new(0.75); e.color = (0.05, 0.35, 0.40, 1)
    L.new(n1.outputs["Fac"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 2.2
    return m


def earth_material(sun):
    """the Earth as the universe shows it: Blue Marble, lit on the side towards the Sun, the night side faint"""
    m, nt = lib._mat("universe earth")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); em = N.new("ShaderNodeEmission")
    t = lib._tex(nt, os.path.join(A, "earth4k.jpg")); tc = N.new("ShaderNodeTexCoord"); L.new(tc.outputs["UV"], t.inputs["Vector"])
    geo = N.new("ShaderNodeNewGeometry"); dp = N.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; L.new(geo.outputs["Normal"], dp.inputs[0]); dp.inputs[1].default_value = tuple(sun)
    mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; mr.inputs["From Min"].default_value = -0.15; mr.inputs["From Max"].default_value = 0.35; mr.inputs["To Min"].default_value = 0.04; mr.inputs["To Max"].default_value = 1.0
    L.new(dp.outputs["Value"], mr.inputs["Value"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0
    L.new(t.outputs["Color"], mx.inputs[6]); L.new(mr.outputs["Result"], mx.inputs[7])
    L.new(mx.outputs[2], em.inputs["Color"]); em.inputs["Strength"].default_value = 1.6
    L.new(em.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def air_material():
    """the thin blue rim of air round the Earth: clear in the middle, glowing at the edge"""
    m, nt = lib._mat("universe air")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"])
    lw = N.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.25
    tr = N.new("ShaderNodeBsdfTransparent"); em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (0.35, 0.6, 1.0, 1); em.inputs["Strength"].default_value = 3.0
    mx = N.new("ShaderNodeMixShader"); L.new(lib._math(nt, "POWER", lw.outputs["Facing"], 3.0), mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def sphere(name, loc, r, mat, segs=96, rings=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc); o = bpy.context.active_object; o.name = name
    for p_ in o.data.polygons: p_.use_smooth = True
    o.data.materials.append(mat); return o


def universe(b0, b1, rnd, earth_at, sun_dir):
    """the universe switched on in a lounge: the Earth, its air and the Moon, the Sun far off, and stars all round"""
    e = sphere("universe earth", earth_at, 1.4, earth_material(sun_dir)); e.rotation_euler = (math.radians(23.4), 0, math.radians(200))
    sphere("universe air", earth_at, 1.46, air_material())
    mo = Vector(earth_at) + Vector((-2.4, 1.9, 0.6)); moon = lib.principled("universe moon", (0.0, 0.0, 0.0), 0.9, **{"Emission Color": (0.62, 0.61, 0.58, 1), "Emission Strength": 0.9})
    sphere("universe moon", tuple(mo), 0.38, moon, 48, 24)
    sun_at = Vector(earth_at) + sun_dir.normalized() * 6.0
    sphere("universe sun", tuple(sun_at), 0.12, lib.emission("universe sun", (1.0, 0.95, 0.85), 60.0), 24, 12)
    # stars: points through the room's air, a small glowing ball on each
    pts = []
    for i in range(6000):
        r = rnd.uniform(R0 + 0.2, R1 - 0.2); b = rnd.uniform(b0 + 0.3, b1 - 0.3); z = rnd.uniform(Z72 + 0.2, Z72 + H - 0.2)
        p = Vector(at(r, b, z))
        if (p - Vector(earth_at)).length > 1.9: pts.append(p)
    st = bpy.data.objects.get("universe star")
    if st is None:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.006, location=(0, 0, -500)); st = bpy.context.active_object; st.name = "universe star"
        st.data.materials.append(lib.emission("universe star", (0.92, 0.95, 1.0), 40.0))
    me = bpy.data.meshes.new("universe stars"); me.from_pydata([tuple(p) for p in pts], [], []); ob = lib.link(bpy.data.objects.new("universe stars", me))
    import atrium; atrium.scatter_leaves(ob, st, "universe stars", 0.5, 2.2)


def build_orb(M, rnd, lounge=0):
    wall = lib.plaster("orb plaster", (0.86, 0.84, 0.80), 0.9, 0.02); dark = lib.plaster("lounge wall", (0.10, 0.10, 0.11), 0.9, 0.02)
    def arc(z0, z1, n=16): return [(shell_r(z0 + (z1 - z0) * i / n), Z72 + z0 + (z1 - z0) * i / n) for i in range(n + 1)]
    # the shell: plaster, a band of windows 1.2 to 4.2 m up, bronze sills and mullions
    furn.lathe("shell below", arc(-8.0, 1.2), wall, 192, (0, 0, 0))
    furn.lathe("shell above", arc(4.2, H + 8.0), wall, 192, (0, 0, 0))
    furn.lathe("window glass", arc(1.2, 4.2, 8), M["glass"], 192, (0, 0, 0))
    for z in (1.2, 4.2): ring("window ledge", shell_r(z) - 0.12, shell_r(z) + 0.02, Z72 + z, M["bronze"])
    for k in range(36):
        b = k * 10.0; lib.box("window mullion", (0.07, 0.1, 3.0), at(shell_r(2.7) - 0.04, b, Z72 + 2.7), M["bronze"], rot_z=face_in(b))
    # floors at +64, +72 and +80 m, the glass round the Gate through all three, the Gate
    for (z, mat) in ((-8.0, M["basalt"]), (0.0, M["basalt"])):
        ring("floor", RH, shell_r(z) + 0.05, Z72 + z, mat); ring("floor under", RH, shell_r(z - 0.5), Z72 + z - 0.5, wall)
        ring("glass sill", RH - 0.05, RH + 0.12, Z72 + z + 0.01, M["bronze"])
    ring("ceiling", RH, shell_r(H) + 0.05, Z72 + H, M["ceiling"]); ring("floor above", RH, shell_r(H + 0.5) + 0.05, Z72 + H + 0.5, M["basalt"])
    furn.lathe("gate glass", [(RH, Z72 - 12.0), (RH, Z72 + 12.0)], M["glass"], 192, (0, 0, 0))
    for k in range(20):
        b = k * 18.0; lib.box("glass mullion", (0.06, 0.08, 24.0), at(RH + 0.03, b, Z72), M["bronze"], rot_z=face_in(b))
    sphere("wormhole gate", (0, 0, Z72), GATE_R, gate_material(), 128, 64)
    lib.point_light("gate glow", (0, 0, Z72 - GATE_R - 1.0), 400, (0.45, 0.55, 1.0), 2.0)
    # the five lounges: glass onto the inner lane, walls to the outer lane and between the rooms
    for i in range(5):
        b0, b1 = slot(i)
        crown.curved_box("lounge glass", R0 - 0.01, R0 + 0.01, b0, b1, Z72, Z72 + H, M["glass"])
        for bb in crown.steps(b0, b1, 1.0 / tang(3.2, R0)): lib.box("lounge mullion", (0.06, 0.1, H), at(R0, bb, Z72 + H / 2), M["bronze_dark"], rot_z=face_in(bb))
        crown.curved_box("lounge outer wall", R1, R1 + 0.25, b0, b1, Z72, Z72 + H, dark if i == lounge else wall)
        for bb in (b0, b1):
            th = tang(0.25, (R0 + R1) / 2); crown.curved_box("lounge end wall", R0, R1, bb - th / 2, bb + th / 2, Z72, Z72 + H, dark if i == lounge else wall)
        if i != lounge:      # the others lit for the evening, seen across the Gate
            bm_ = (b0 + b1) / 2; lib.area_light("lounge light", at((R0 + R1) / 2, bm_, Z72 + H - 0.4), 6.0, 900, (1.0, 0.78, 0.55), size_y=3.0, rot=(0, 0, face_in(bm_)))
    # light in the lanes: a strip under the window ledge and along the glass, low for the evening
    glow = lib.emission("lane glow", (1.0, 0.76, 0.52), 4.0)
    ring("outer lane glow", shell_r(1.15) - 0.11, shell_r(1.15) - 0.09, Z72 + 1.15, glow)
    ring("inner lane glow", RH + 0.14, RH + 0.16, Z72 + 0.05, glow)


def earth_lounge(M, rnd):
    """O-07, the Earth lounge (bearings 22 to 86), the universe switched on and zoomed to the Earth: the lights down,
    the Earth floating in the middle of the room, the Moon by it, the Sun far off, stars all round"""
    crown_rooms.extra_materials(M)
    build_orb(M, rnd, lounge=0)
    b0, b1 = slot(0); S = crown_rooms.imports(M)
    earth_at = at(17.0, 54.0, Z72 + 3.1); sun_dir = Vector((-0.75, 0.45, 0.35)).normalized()
    universe(b0, b1, rnd, earth_at, sun_dir)
    # low sofas and chairs facing the Earth, a dark rug, side tables with a little light
    lib.box("lounge rug", (11.0, 4.4, 0.014), at(17.0, 54.0, Z72 + 0.007), M["rug2"], bevel=0.006, rot_z=face_in(54.0), segs=2)
    for (bb, r_) in ((47.0, 18.7), (61.0, 18.7)):
        lib.instance_of(S["sofa"], at(r_, bb, Z72 + 0.014), face_in(bb) + (0.6 if bb < 54 else -0.6), name="lounge sofa")
    for (bb, r_) in ((44.6, 16.2), (63.4, 16.2)):
        lib.instance_of(S["chair"], at(r_, bb, Z72 + 0.014), face_in(bb) + (1.3 if bb < 54 else -1.3), name="lounge chair")
    for bb in (50.5, 57.5):
        q = at(18.6, bb, Z72); furn.side_table("side table", q, M, r=0.24, h=0.48)
        lib.point_light("table light", (q[0], q[1], Z72 + 0.62), 4.0, (1.0, 0.65, 0.35), 0.04)
    cove = lib.emission("lounge cove", (1.0, 0.72, 0.48), 1.6)
    crown.curved_box("lounge cove", R1 - 0.12, R1 - 0.02, b0 + 0.5, b1 - 0.5, Z72 + 0.05, Z72 + 0.09, cove)


ROOMS = {
    "earth": dict(build=earth_lounge, cams={
        "earth": dict(loc=at(18.9, 27.5, Z72 + 1.45), target=at(17.0, 54.0, Z72 + 2.9), lens=18),
        "earth2": dict(loc=at(15.0, 76.0, Z72 + 1.5), target=at(17.6, 50.0, Z72 + 2.8), lens=19),
    }, stops={"earth": at(17.4, 44.0, Z72)}),
}


def build(room, night_=True):
    sc = lib.reset(); M = crown_rooms.materials(); rnd = random.Random(29)
    R = ROOMS[room]; R["build"](M, rnd)
    crown.outside(M, 200.0, 30.0, skip=None, roof=True)
    o = bpy.data.objects.get("orb")
    if o: bpy.data.objects.remove(o)                                  # we are inside it
    if night_:
        for ob in list(bpy.data.objects):
            if ob.type == "LIGHT" and ob.data.type == "SUN": bpy.data.objects.remove(ob)
        crown_rooms.night_sky()
        glow = lib.emission("far slot glow", (1.0, 0.76, 0.5), 7.0)
        for (a, b) in crown.openings(crown.R_IN - 0.62, 0.0, 360.0):
            crown.curved_box("far slot", crown.R_IN - 0.63, crown.R_IN - 0.61, a, b, crown.Z0, crown.Z1, glow)
    return sc, R


if __name__ == "__main__":
    # orb.py <room> <jobs> <out with %s> [w h spp exposure [pano_w pano_spp]]: a still is a camera name, a 360 is
    # pano:<stop>, a plan from above is plan:<view>; a picture that exists already is skipped
    args = sys.argv[1:]; room = args[0]; jobs = args[1].split(","); out = args[2]
    w, h, spp, ex = (int(args[3]), int(args[4]), int(args[5]), float(args[6])) if len(args) > 6 else (640, 360, 24, 0.0)
    pw, pspp = (int(args[7]), int(args[8])) if len(args) > 8 else (w * 2, spp)
    paths = {j: os.path.abspath(out.replace("%s", j.replace(":", "_"))) for j in jobs}
    todo = [j for j in jobs if not os.path.exists(paths[j])]
    if not todo: print("nothing to do", flush=True); sys.exit(0)
    t = time.time(); sc, R = build(room, not all(j.startswith("plan:") for j in todo)); print("built in %.1f s" % (time.time() - t), flush=True)
    for j in todo:
        tmp = paths[j].replace(".jpg", ".part.jpg")
        if j.startswith("plan:"):
            import plan_render; size = plan_render.setup(j[5:]); t = time.time(); lib.render(tmp, size, 64, exposure=0.3)
            os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        if j.startswith("pano:"):
            x, y, z = R["stops"][j[5:]]; lib.camera(j, (x, y, z + 1.55), yaw_deg=0.0, pano=True); lib.photo_finish(0.25, 0.0)
            t = time.time(); lib.render_pano(paths[j], pw, pspp, exposure=ex); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True); continue
        c = R["cams"][j]; lib.camera(j, c["loc"], c["target"], lens=c["lens"]); lib.photo_finish(0.3, 0.15)
        t = time.time(); lib.render(tmp, (w, h), spp, exposure=ex)
        os.replace(tmp, paths[j]); print("rendered", j, "in %.1f s" % (time.time() - t), flush=True)
