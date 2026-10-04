"""The Orb's +72 m floor, for stills and 360s: the Earth lounge (O-07) with the universe switched on, at night.
The Orb is 48 m across with a 2 m shell. On each floor five rooms sit between an outer lane along the windows and an
inner lane along the glass round the Wormhole Gate, a ball 18 m across floating in a round space 24 m across from
+60 to +84 m; the passages between the rooms lie under the Crown's five spires (floor plans Rev G, orb.html).
Built in the Crown's frame (crown.py): z = 0 is the Crown's floor at +41 m, so the +72 m floor is at z = 31.
  bvenv/bin/python blend/orb.py <room> <jobs> <out with %s> [w h spp exposure [pano_w pano_spp]]"""
import bpy, bmesh, math, os, random, sys, time
from mathutils import Vector, Matrix
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
    L.new(n1.outputs["Fac"], cr.inputs["Fac"]); L.new(cr.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 1.4
    return m


def earth_material(sun, name="universe earth", path=None):
    """the Earth as the universe shows it: Blue Marble, lit on the side towards the Sun, the night side faint (another
    planet's map in path)"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); em = N.new("ShaderNodeEmission")
    t = lib._tex(nt, path or os.path.join(A, "earth4k.jpg")); tc = N.new("ShaderNodeTexCoord"); L.new(tc.outputs["UV"], t.inputs["Vector"])
    hs = N.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = 0.8; L.new(t.outputs["Color"], hs.inputs["Color"])
    geo = N.new("ShaderNodeNewGeometry"); dp = N.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; L.new(geo.outputs["Normal"], dp.inputs[0]); dp.inputs[1].default_value = tuple(sun)
    mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; mr.inputs["From Min"].default_value = -0.06; mr.inputs["From Max"].default_value = 0.3; mr.inputs["To Min"].default_value = 0.012; mr.inputs["To Max"].default_value = 1.0
    L.new(dp.outputs["Value"], mr.inputs["Value"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0
    L.new(hs.outputs["Color"], mx.inputs[6]); L.new(mr.outputs["Result"], mx.inputs[7])
    L.new(mx.outputs[2], em.inputs["Color"]); em.inputs["Strength"].default_value = 1.1
    L.new(em.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def moon_material(sun):
    """the Moon as the universe shows it: grey maria and bright highlands, lit on the side towards the Sun"""
    m, nt = lib._mat("universe moon")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); em = N.new("ShaderNodeEmission")
    tc = N.new("ShaderNodeTexCoord"); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 2.2; nz.inputs["Detail"].default_value = 10; L.new(tc.outputs["Object"], nz.inputs["Vector"])
    cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.42; cr.color_ramp.elements[0].color = (0.22, 0.22, 0.21, 1); cr.color_ramp.elements[1].position = 0.62; cr.color_ramp.elements[1].color = (0.72, 0.71, 0.68, 1)
    L.new(nz.outputs["Fac"], cr.inputs["Fac"])
    geo = N.new("ShaderNodeNewGeometry"); dp = N.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; L.new(geo.outputs["Normal"], dp.inputs[0]); dp.inputs[1].default_value = tuple(sun)
    mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; mr.inputs["From Min"].default_value = -0.05; mr.inputs["From Max"].default_value = 0.3; mr.inputs["To Min"].default_value = 0.02; mr.inputs["To Max"].default_value = 1.0
    L.new(dp.outputs["Value"], mr.inputs["Value"])
    mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; L.new(cr.outputs["Color"], mx.inputs[6]); L.new(mr.outputs["Result"], mx.inputs[7])
    L.new(mx.outputs[2], em.inputs["Color"]); em.inputs["Strength"].default_value = 1.2; L.new(em.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def air_material(name="universe air", color=(0.35, 0.6, 1.0), sun=None):
    """the thin blue rim of air round the Earth: clear in the middle, glowing at the edge, on the side the Sun lights"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"])
    lw = N.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.25
    tr = N.new("ShaderNodeBsdfTransparent"); em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (*color, 1); em.inputs["Strength"].default_value = 3.0
    if sun is not None:
        geo = N.new("ShaderNodeNewGeometry"); dp = N.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; L.new(geo.outputs["Normal"], dp.inputs[0]); dp.inputs[1].default_value = tuple(sun)
        mr = N.new("ShaderNodeMapRange"); mr.interpolation_type = "SMOOTHSTEP"; mr.inputs["From Min"].default_value = -0.25; mr.inputs["From Max"].default_value = 0.3; mr.inputs["To Min"].default_value = 0.0; mr.inputs["To Max"].default_value = 3.0
        L.new(dp.outputs["Value"], mr.inputs["Value"]); L.new(mr.outputs["Result"], em.inputs["Strength"])
    mx = N.new("ShaderNodeMixShader"); L.new(lib._math(nt, "POWER", lw.outputs["Facing"], 3.0), mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def shown_light(name, color, strength):
    """light that the eye sees but that lights nothing, as a picture in the air would: emission for camera rays only"""
    m, nt = lib._mat(name)
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"])
    lp = N.new("ShaderNodeLightPath"); em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (*color, 1); em.inputs["Strength"].default_value = strength
    tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader")
    L.new(lp.outputs["Is Camera Ray"], mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(em.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def sphere(name, loc, r, mat, segs=96, rings=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc); o = bpy.context.active_object; o.name = name
    for p_ in o.data.polygons: p_.use_smooth = True
    o.data.materials.append(mat); return o


def in_room(p, b0, b1, m=0.3):
    r = p.xy.length; b = math.degrees(math.atan2(p.x, p.y)) % 360.0
    return R0 + m < r < R1 - m and b0 + 1.0 < b < b1 - 1.0 and Z72 + m < p.z < Z72 + H - m


def sun_in_room(c, sun_dir, b0, b1):
    """where the Sun shows: as far from the planet towards it as the room allows"""
    k = 0.5
    while k < 12.0 and in_room(Vector(c) + sun_dir * (k + 0.2), b0, b1, 0.5): k += 0.2
    return Vector(c) + sun_dir * k


def universe(b0, b1, rnd, earth_at, sun_dir):
    """the universe switched on in a lounge: the Earth, its air and the Moon, the Sun far off, and stars all round"""
    e = sphere("universe earth", earth_at, 1.4, earth_material(sun_dir)); e.rotation_euler = (math.radians(23.4), 0, math.radians(200))
    sphere("universe air", earth_at, 1.46, air_material(sun=sun_dir))
    mo = Vector(earth_at) + Vector((-2.4, 1.9, 0.6))
    sphere("universe moon", tuple(mo), 0.38, moon_material(sun_dir), 64, 32)
    sun_at = sun_in_room(earth_at, sun_dir, b0, b1)
    sphere("universe sun", tuple(sun_at), 0.1, lib.emission("universe sun", (1.0, 0.95, 0.85), 60.0), 24, 12)
    stars(b0, b1, rnd, [(Vector(earth_at), 2.4), (mo, 0.7), (sun_at, 0.6)])


def stars(b0, b1, rnd, keep_clear=(), n=3500, name="universe stars", color=(0.92, 0.95, 1.0), strength=22.0, box=None):
    """stars over the room's outer wall, its end walls and its ceiling, as in a planetarium (in the air they read as
    snow), a small glowing ball on each, none within the given distances of the given points"""
    pts = []
    wall, ends, ceil = (b1 - b0) * D * R1 * H, 2 * (R1 - R0) * H, (b1 - b0) * D * (R0 + R1) / 2 * (R1 - R0)
    for i in range(n):
        if box: p = Vector((rnd.uniform(box[0][0], box[1][0]), rnd.uniform(box[0][1], box[1][1]), rnd.uniform(box[0][2], box[1][2])))
        else:
            u = rnd.uniform(0, wall + ends + ceil); d = abs(rnd.gauss(0, 0.12))
            if u < wall: p = Vector(at(R1 - 0.05 - d, rnd.uniform(b0 + 0.3, b1 - 0.3), rnd.uniform(Z72 + 0.15, Z72 + H - 0.1)))
            elif u < wall + ends:
                bb = b0 + 0.2 + tang(0.05 + d, 18.0) if rnd.random() < 0.5 else b1 - 0.2 - tang(0.05 + d, 18.0)
                p = Vector(at(rnd.uniform(R0 + 0.3, R1 - 0.1), bb, rnd.uniform(Z72 + 0.15, Z72 + H - 0.1)))
            else: p = Vector(at(rnd.uniform(R0 + 0.2, R1 - 0.1), rnd.uniform(b0 + 0.3, b1 - 0.3), Z72 + H - 0.05 - d))
        if all((p - c).length > d_ for (c, d_) in keep_clear): pts.append(p)
    st = bpy.data.objects.get(name + " ball")
    if st is None:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.002, location=(0, 0, -500)); st = bpy.context.active_object; st.name = name + " ball"
        st.data.materials.append(shown_light(name, color, strength))
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(p) for p in pts], [], []); ob = lib.link(bpy.data.objects.new(name, me))
    import atrium; atrium.scatter_leaves(ob, st, name, 0.5, 1.6)
    return ob


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
    earth_at = at(17.0, 54.0, Z72 + 3.1); sun_dir = Vector((-0.98, -0.2, 0.3)).normalized()
    universe(b0, b1, rnd, earth_at, sun_dir)
    furnish_lounge(M, S, b0, b1)


def furnish_lounge(M, S, b0, b1):
    """low sofas and chairs facing the middle of the room, a dark rug, side tables with a little light, a low cove"""
    bc = (b0 + b1) / 2
    lib.box("lounge rug", (11.0, 4.4, 0.014), at(17.0, bc, Z72 + 0.007), M["rug2"], bevel=0.006, rot_z=face_in(bc), segs=2)
    for (db, r_) in ((-7.0, 18.7), (7.0, 18.7)):
        bb = bc + db; lib.instance_of(S["sofa"], at(r_, bb, Z72 + 0.014), face_in(bb) + (0.6 if db < 0 else -0.6), name="lounge sofa")
    for (db, r_) in ((-9.4, 16.2), (9.4, 16.2)):
        bb = bc + db; lib.instance_of(S["chair"], at(r_, bb, Z72 + 0.014), face_in(bb) + (1.3 if db < 0 else -1.3), name="lounge chair")
    for db in (-3.5, 3.5):
        q = at(18.6, bc + db, Z72); furn.side_table("side table", q, M, r=0.24, h=0.48)
        lib.point_light("table light", (q[0], q[1], Z72 + 0.62), 4.0, (1.0, 0.65, 0.35), 0.04)
    cove = lib.emission("lounge cove", (1.0, 0.72, 0.48), 1.6)
    crown.curved_box("lounge cove", R1 - 0.12, R1 - 0.02, b0 + 0.5, b1 - 0.5, Z72 + 0.05, Z72 + 0.09, cove)


def mars_lounge(M, rnd):
    """O-08, the Mars lounge (bearings 94 to 158): the universe zoomed to Mars, its dusty rim of air, Phobos and Deimos"""
    crown_rooms.extra_materials(M)
    build_orb(M, rnd, lounge=1)
    b0, b1 = slot(1); S = crown_rooms.imports(M); bc = (b0 + b1) / 2
    c = at(17.0, bc, Z72 + 3.1); sun_dir = Vector((-0.49, 0.87, 0.3)).normalized()
    mp = crown_rooms.repo_file("palace", "design", "img", "mars-map.jpg")
    mars = sphere("universe mars", c, 1.5, earth_material(sun_dir, "universe mars", mp)); mars.rotation_euler = (math.radians(25.2), 0, math.radians(110))
    sphere("universe dust", c, 1.55, air_material("universe dust", (0.85, 0.55, 0.38), sun_dir))
    grey = moon_material(sun_dir)
    ph = Vector(c) + Vector((1.6, 1.4, 0.4)); de = Vector(c) + Vector((-2.6, -1.9, 1.0))
    sphere("universe phobos", tuple(ph), 0.16, grey, 32, 16); sphere("universe deimos", tuple(de), 0.1, grey, 24, 12)
    sun_at = sun_in_room(c, sun_dir, b0, b1)
    sphere("universe sun", tuple(sun_at), 0.08, lib.emission("universe sun", (1.0, 0.95, 0.85), 60.0), 24, 12)
    stars(b0, b1, rnd, [(Vector(c), 2.4), (ph, 0.4), (de, 0.4), (sun_at, 0.6)])
    furnish_lounge(M, S, b0, b1)


def galaxy_material(RG, wind):
    """the Milky Way's light as a photograph shows it: an exponential disc, two arms wound round a golden core, dust
    lanes along the arms' inner edges, clumps of young blue stars. Shown to the camera only; it lights nothing"""
    m, nt = lib._mat("galaxy glow disc")
    if nt is None: return m
    N = nt.nodes; L = nt.links; N.remove(N["Principled BSDF"]); mth = lambda op, a, b=None: lib._math(nt, op, a, b)
    tc = N.new("ShaderNodeTexCoord"); sp = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sp.inputs[0])
    x, y = sp.outputs["X"], sp.outputs["Y"]
    rn = mth("DIVIDE", mth("SQRT", mth("ADD", mth("MULTIPLY", x, x), mth("MULTIPLY", y, y))), RG)
    th = mth("ARCTAN2", y, x)
    phase = mth("MULTIPLY", mth("SUBTRACT", th, mth("MULTIPLY", rn, wind)), 2.0)
    arms = mth("POWER", mth("ADD", mth("MULTIPLY", mth("COSINE", phase), 0.5), 0.5), 3.0)
    dust = mth("POWER", mth("ADD", mth("MULTIPLY", mth("COSINE", mth("SUBTRACT", phase, 0.75)), 0.5), 0.5), 8.0)
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 5.0; nz.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], nz.inputs["Vector"])
    clump = mth("ADD", mth("MULTIPLY", nz.outputs["Fac"], 1.6), 0.2)
    disk = mth("MULTIPLY", mth("EXPONENT", mth("MULTIPLY", rn, -3.0)), mth("SUBTRACT", 1.0, mth("MINIMUM", mth("MAXIMUM", mth("MULTIPLY", mth("SUBTRACT", rn, 0.8), 5.0), 0.0), 1.0)))
    light = mth("MULTIPLY", disk, mth("ADD", 0.22, mth("MULTIPLY", mth("MULTIPLY", arms, clump), 1.3)))
    light = mth("MULTIPLY", light, mth("SUBTRACT", 1.0, mth("MULTIPLY", dust, 0.75)))
    core = mth("EXPONENT", mth("MULTIPLY", mth("MULTIPLY", rn, rn), -45.0))
    total = mth("ADD", light, mth("MULTIPLY", core, 5.0))
    col = N.new("ShaderNodeMix"); col.data_type = "RGBA"; L.new(mth("EXPONENT", mth("MULTIPLY", rn, -6.0)), col.inputs["Factor"])
    col.inputs[6].default_value = (0.62, 0.74, 1.0, 1); col.inputs[7].default_value = (1.0, 0.80, 0.52, 1)
    em = N.new("ShaderNodeEmission"); L.new(col.outputs[2], em.inputs["Color"]); L.new(mth("MULTIPLY", total, 2.6), em.inputs["Strength"])
    tr = N.new("ShaderNodeBsdfTransparent"); add = N.new("ShaderNodeAddShader"); L.new(tr.outputs[0], add.inputs[0]); L.new(em.outputs[0], add.inputs[1])
    lp = N.new("ShaderNodeLightPath"); tr2 = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader")
    L.new(lp.outputs["Is Camera Ray"], mx.inputs["Fac"]); L.new(tr2.outputs[0], mx.inputs[1]); L.new(add.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def galaxy_lounge(M, rnd):
    """O-10, the Galaxy lounge (bearings 238 to 302): the Milky Way standing in the room, where far places for the
    Gate are chosen: its disc turned towards the door at 35 degrees, two arms of blue-white stars wound round a golden
    core, dust along the arms, the room dark round it"""
    crown_rooms.extra_materials(M)
    build_orb(M, rnd, lounge=3)
    b0, b1 = slot(3); S = crown_rooms.imports(M); bc = (b0 + b1) / 2
    c = Vector(at(17.0, bc, Z72 + 3.4)); RG, wind, inc = 2.4, 4.4, math.radians(35)
    u = Vector((math.cos(bc * D), -math.sin(bc * D), 0)); v = Vector((math.sin(bc * D), math.cos(bc * D), 0)); w = Vector((0, 0, 1))
    e1 = v; e2 = (w * math.cos(inc) + u * math.sin(inc)).normalized(); n = e1.cross(e2)
    def place(x, y, z): return c + e1 * x + e2 * y + n * z
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=96, radius=RG * 1.08)
    disc = lib.mesh_obj("universe galaxy disc", bm, galaxy_material(RG, wind))
    disc.matrix_world = Matrix((tuple(e1) + (0,), tuple(e2) + (0,), tuple(n) + (0,), (0, 0, 0, 1))).transposed()
    disc.matrix_world.translation = c
    arms, core = [], []
    for i in range(22000):
        arm = i % 2; t = rnd.random() ** 0.8; rr = 0.18 + t * (RG - 0.18); a = arm * math.pi + rr / RG * wind + rnd.gauss(0, 0.26)
        arms.append(place(rr * math.cos(a), rr * math.sin(a), rnd.gauss(0, 0.04 * (1.2 - t))))
    for i in range(5000):
        rr = abs(rnd.gauss(0, 0.22)); a = rnd.uniform(0, 2 * math.pi); core.append(place(rr * math.cos(a), rr * math.sin(a), rnd.gauss(0, 0.09)))
    for (pts, nm, col, k) in ((arms, "galaxy arms", (0.78, 0.86, 1.0), 7.0), (core, "galaxy core", (1.0, 0.86, 0.6), 8.0)):
        st = bpy.data.objects.get(nm + " ball")
        if st is None:
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.0022, location=(0, 0, -500)); st = bpy.context.active_object; st.name = nm + " ball"
            st.data.materials.append(shown_light(nm, col, k))
        me = bpy.data.meshes.new("universe " + nm); me.from_pydata([tuple(p) for p in pts], [], []); ob = lib.link(bpy.data.objects.new("universe " + nm, me))
        import atrium; atrium.scatter_leaves(ob, st, nm, 0.6, 1.4)
    stars(b0, b1, rnd, [(c, 2.9)], n=2400)
    furnish_lounge(M, S, b0, b1)


ROOMS = {
    "earth": dict(build=earth_lounge, cams={
        "earth": dict(loc=at(18.9, 27.5, Z72 + 1.45), target=at(17.0, 54.0, Z72 + 2.9), lens=18),
        "earth2": dict(loc=at(15.0, 76.0, Z72 + 1.5), target=at(17.6, 50.0, Z72 + 2.8), lens=19),
    }, stops={"earth": at(17.4, 44.0, Z72)}),
    "mars": dict(build=mars_lounge, cams={
        "mars": dict(loc=at(18.9, 99.5, Z72 + 1.45), target=at(17.0, 126.0, Z72 + 2.9), lens=18),
    }, stops={"mars": at(17.4, 116.0, Z72)}),
    "galaxy": dict(build=galaxy_lounge, cams={
        "galaxy": dict(loc=at(18.9, 243.5, Z72 + 1.45), target=at(17.0, 270.0, Z72 + 2.9), lens=18),
    }, stops={"galaxy": at(17.4, 260.0, Z72)}),
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
