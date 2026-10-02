"""Helpers for building the house in Blender and rendering it with Cycles: materials that look like the real thing,
simple modelling, imported scanned models, lights and cameras. Units are metres, Z up."""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, Euler

_HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = next((p for p in (os.path.join(_HERE, "assets"), os.path.join(_HERE, "..", "assets")) if os.path.isdir(p)), os.path.join(_HERE, "assets"))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
    sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.01
    sc.cycles.max_bounces = 10; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 4; sc.cycles.transmission_bounces = 10; sc.cycles.transparent_max_bounces = 16; sc.cycles.volume_bounces = 0
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 1.0
    sc.cycles.sample_clamp_indirect = 8.0
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Base Contrast"
    sc.render.image_settings.file_format = "JPEG"; sc.render.image_settings.quality = 93
    w = bpy.data.worlds.new("world"); sc.world = w; w.use_nodes = True
    return sc


# ---------------------------------------------------------------- materials
def _mat(name):
    m = bpy.data.materials.get(name)
    if m: return m, None
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree


def principled(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, **kw):
    m, nt = _mat(name)
    if nt is None: return m
    b = nt.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m


def _tex(nt, path, colorspace="sRGB"):
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path, check_existing=True); t.image.colorspace_settings.name = colorspace
    return t


def _math(nt, op, a=None, b=None, c=None):
    n = nt.nodes.new("ShaderNodeMath"); n.operation = op
    for i, v in enumerate((a, b, c)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def oak_floor(name="oak floor", plank_w=0.19, tint=(0.62, 0.50, 0.40), sat=0.55, val=0.82, along="X"):
    """three.js's hardwood2 photo textures (a scan of real planks): each row of boards picks a random row of the
    photo and a random offset along it, so a big floor never shows the photo repeating. Planks run along x."""
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    x, y = (sep.outputs[0], sep.outputs[1]) if along == "X" else (sep.outputs[1], sep.outputs[0])
    # the photo is 8 rows of boards, 2:1; one row of the floor is plank_w wide, the photo's width is 16 * plank_w long
    row = _math(nt, "FLOOR", _math(nt, "DIVIDE", y, plank_w))
    frac_v = _math(nt, "FRACT", _math(nt, "DIVIDE", y, plank_w))
    wn = nt.nodes.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "1D"; L.new(row, wn.inputs["W"])
    wn2 = nt.nodes.new("ShaderNodeTexWhiteNoise"); wn2.noise_dimensions = "1D"; L.new(_math(nt, "ADD", row, 17.31), wn2.inputs["W"])
    src_row = _math(nt, "FLOOR", _math(nt, "MULTIPLY", wn.outputs["Value"], 7.999))
    u = _math(nt, "ADD", _math(nt, "DIVIDE", x, 16 * plank_w), wn2.outputs["Value"])
    v = _math(nt, "DIVIDE", _math(nt, "ADD", src_row, _math(nt, "ADD", _math(nt, "MULTIPLY", frac_v, 0.96), 0.02)), 8.0)
    comb = nt.nodes.new("ShaderNodeCombineXYZ"); L.new(u, comb.inputs[0]); L.new(v, comb.inputs[1])
    d = _tex(nt, os.path.join(ASSETS, "hardwood2_diffuse.jpg")); r = _tex(nt, os.path.join(ASSETS, "hardwood2_roughness.jpg"), "Non-Color"); bu = _tex(nt, os.path.join(ASSETS, "hardwood2_bump.jpg"), "Non-Color")
    for t in (d, r, bu): L.new(comb.outputs[0], t.inputs["Vector"]); t.interpolation = "Cubic"
    hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = sat; hs.inputs["Value"].default_value = val; L.new(d.outputs["Color"], hs.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1.0; mix.inputs[7].default_value = (*tint, 1)
    L.new(hs.outputs["Color"], mix.inputs[6])
    # each board a little lighter or darker, as real boards are
    var = nt.nodes.new("ShaderNodeMix"); var.data_type = "RGBA"; var.blend_type = "MULTIPLY"; L.new(_math(nt, "MULTIPLY", wn2.outputs["Value"], 0.25), var.inputs["Factor"]); L.new(mix.outputs[2], var.inputs[6]); var.inputs[7].default_value = (0.78, 0.74, 0.70, 1)
    L.new(var.outputs[2], b.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.22; rr.inputs["To Max"].default_value = 0.55; L.new(r.outputs["Color"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.35; bm.inputs["Distance"].default_value = 0.001; L.new(bu.outputs["Color"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = 0.35; b.inputs["Coat Roughness"].default_value = 0.12
    return m


def plaster(name="plaster", color=(0.78, 0.75, 0.70), rough=0.9, bump=0.05):
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 40; n.inputs["Detail"].default_value = 10; n.inputs["Roughness"].default_value = 0.65; L.new(tc.outputs["Object"], n.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = bump; bm.inputs["Distance"].default_value = 0.002; L.new(n.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 0.6; n2.inputs["Detail"].default_value = 4; L.new(tc.outputs["Object"], n2.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.inputs[6].default_value = (*color, 1); mx.inputs[7].default_value = (color[0] * 0.93, color[1] * 0.93, color[2] * 0.91, 1)
    L.new(n2.outputs["Fac"], mx.inputs["Factor"]); L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def travertine(name="travertine", color=(0.80, 0.72, 0.60), dark=(0.66, 0.57, 0.45), rough=0.5, scale=1.0, honed=True, along="X"):
    """travertine: soft bands along the bedding, cloudy patches, and the small elongated pits it is known for"""
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    st = {"X": (0.25, 1, 1), "Y": (1, 0.25, 1), "Z": (1, 1, 0.25)}[along]; mp.inputs["Scale"].default_value = (st[0] * scale, st[1] * scale, st[2] * scale)
    w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = {"X": "Z", "Y": "Z", "Z": "X"}[along]; w.inputs["Scale"].default_value = 5.0; w.inputs["Distortion"].default_value = 1.6; w.inputs["Detail"].default_value = 4; w.inputs["Detail Scale"].default_value = 3.0; L.new(mp.outputs["Vector"], w.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 3; n.inputs["Detail"].default_value = 8; n.inputs["Roughness"].default_value = 0.6; L.new(mp.outputs["Vector"], n.inputs["Vector"])
    t = _math(nt, "MULTIPLY_ADD", w.outputs["Fac"], 0.22, _math(nt, "MULTIPLY", n.outputs["Fac"], 0.8))
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.3; cr.color_ramp.elements[0].color = (*color, 1); cr.color_ramp.elements[1].position = 0.85; cr.color_ramp.elements[1].color = (*dark, 1)
    e = cr.color_ramp.elements.new(0.55); e.color = (color[0] * 0.97, color[1] * 0.95, color[2] * 0.92, 1)
    L.new(t, cr.inputs["Fac"])
    # pits: small stretched cells, dark inside and dented
    mp2 = nt.nodes.new("ShaderNodeMapping"); L.new(tc.outputs["Object"], mp2.inputs["Vector"]); st2 = {"X": (6, 26, 26), "Y": (26, 6, 26), "Z": (26, 26, 6)}[along]; mp2.inputs["Scale"].default_value = (st2[0] * scale, st2[1] * scale, st2[2] * scale)
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.inputs["Randomness"].default_value = 1.0; L.new(mp2.outputs["Vector"], v.inputs["Vector"])
    n3 = nt.nodes.new("ShaderNodeTexNoise"); n3.inputs["Scale"].default_value = 2.0; L.new(mp2.outputs["Vector"], n3.inputs["Vector"])
    pit = nt.nodes.new("ShaderNodeMapRange"); pit.inputs["From Min"].default_value = 0.0; pit.inputs["From Max"].default_value = 0.12; pit.inputs["To Min"].default_value = 1.0; pit.inputs["To Max"].default_value = 0.0; L.new(v.outputs["Distance"], pit.inputs["Value"])
    mask = _math(nt, "MULTIPLY", pit.outputs["Result"], _math(nt, "GREATER_THAN", n3.outputs["Fac"], 0.58))
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(_math(nt, "MULTIPLY", mask, 0.75), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (dark[0] * 0.6, dark[1] * 0.55, dark[2] * 0.5, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    fine = nt.nodes.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 300; fine.inputs["Detail"].default_value = 4; L.new(tc.outputs["Object"], fine.inputs["Vector"])
    h = _math(nt, "ADD", _math(nt, "MULTIPLY", mask, -1.0), _math(nt, "MULTIPLY", fine.outputs["Fac"], 0.15))
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.35 if honed else 0.2; bm.inputs["Distance"].default_value = 0.0015; L.new(h, bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = rough; rr.inputs["To Max"].default_value = min(1.0, rough + 0.35); L.new(mask, rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    return m


def marble(name, color=(0.86, 0.85, 0.83), vein=(0.35, 0.33, 0.32), rough=0.12, scale=1.2):
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough; b.inputs["Coat Weight"].default_value = 0.4; b.inputs["Coat Roughness"].default_value = 0.05
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 1.5 * scale; n.inputs["Detail"].default_value = 12; n.inputs["Roughness"].default_value = 0.62; L.new(tc.outputs["Object"], n.inputs["Vector"])
    w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "DIAGONAL"; w.inputs["Scale"].default_value = 1.2 * scale; w.inputs["Distortion"].default_value = 14; w.inputs["Detail"].default_value = 8; w.inputs["Detail Scale"].default_value = 1.6; w.inputs["Detail Roughness"].default_value = 0.6; L.new(tc.outputs["Object"], w.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.0; cr.color_ramp.elements[0].color = (*vein, 1); cr.color_ramp.elements[1].position = 0.12; cr.color_ramp.elements[1].color = (*color, 1)
    e = cr.color_ramp.elements.new(0.05); e.color = (vein[0] * 1.6, vein[1] * 1.6, vein[2] * 1.6, 1)
    L.new(_math(nt, "ABSOLUTE", _math(nt, "SUBTRACT", w.outputs["Fac"], 0.5)), cr.inputs["Fac"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.inputs["Factor"].default_value = 0.15; L.new(cr.outputs["Color"], mx.inputs[6]); L.new(n.outputs["Color"], mx.inputs[7])
    L.new(mx.outputs[2], b.inputs["Base Color"])
    return m


def wood(name, color=(0.24, 0.14, 0.08), dark=(0.12, 0.07, 0.04), rough=0.4, scale=1.0, coat=0.3, along="X"):
    """wood in the grain: long rings stretched along the board, fine pores, a little figure"""
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough; b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.18
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); L.new(tc.outputs["Object"], mp.inputs["Vector"])
    s = {"X": (0.12, 2.2, 2.2), "Y": (2.2, 0.12, 2.2), "Z": (2.2, 2.2, 0.12)}[along]; mp.inputs["Scale"].default_value = (s[0] * scale, s[1] * scale, s[2] * scale)
    w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "RINGS"; w.rings_direction = along; w.inputs["Scale"].default_value = 3.0; w.inputs["Distortion"].default_value = 9; w.inputs["Detail"].default_value = 3; w.inputs["Detail Scale"].default_value = 1.2; L.new(mp.outputs["Vector"], w.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 4; n.inputs["Detail"].default_value = 6; L.new(mp.outputs["Vector"], n.inputs["Vector"])
    mp2 = nt.nodes.new("ShaderNodeMapping"); L.new(tc.outputs["Object"], mp2.inputs["Vector"]); s2 = {"X": (3, 160, 160), "Y": (160, 3, 160), "Z": (160, 160, 3)}[along]; mp2.inputs["Scale"].default_value = (s2[0] * scale, s2[1] * scale, s2[2] * scale)
    pores = nt.nodes.new("ShaderNodeTexNoise"); pores.inputs["Scale"].default_value = 1.0; pores.inputs["Detail"].default_value = 2; L.new(mp2.outputs["Vector"], pores.inputs["Vector"])
    t = _math(nt, "MULTIPLY_ADD", w.outputs["Fac"], 0.55, _math(nt, "MULTIPLY", n.outputs["Fac"], 0.45))
    cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.25; cr.color_ramp.elements[0].color = (*color, 1); cr.color_ramp.elements[1].position = 0.75; cr.color_ramp.elements[1].color = (*dark, 1)
    L.new(t, cr.inputs["Fac"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; L.new(_math(nt, "MULTIPLY", _math(nt, "GREATER_THAN", pores.outputs["Fac"], 0.62), 0.35), mx.inputs["Factor"]); L.new(cr.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = (0.5, 0.45, 0.4, 1)
    L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = 0.12; bm.inputs["Distance"].default_value = 0.0005; L.new(_math(nt, "ADD", t, pores.outputs["Fac"]), bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def fabric(name, color, rough=0.85, sheen=0.5, scale=600.0, bump=0.25):
    m, nt = _mat(name)
    if nt is None: return m
    L = nt.links; b = nt.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough; b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = 0.4
    tc = nt.nodes.new("ShaderNodeTexCoord"); n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = 3; L.new(tc.outputs["Object"], n.inputs["Vector"])
    n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 3; n2.inputs["Detail"].default_value = 3; L.new(tc.outputs["Object"], n2.inputs["Vector"])
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; L.new(_math(nt, "MULTIPLY", n2.outputs["Fac"], 0.25), mx.inputs["Factor"]); mx.inputs[6].default_value = (*color, 1); mx.inputs[7].default_value = (color[0] * 0.8, color[1] * 0.8, color[2] * 0.8, 1); L.new(mx.outputs[2], b.inputs["Base Color"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = bump; bm.inputs["Distance"].default_value = 0.0005; L.new(n.outputs["Fac"], bm.inputs["Height"]); L.new(bm.outputs["Normal"], b.inputs["Normal"])
    return m


def glass(name="glass", tint=(0.92, 0.96, 0.95), rough=0.0, ior=1.52):
    """window glass: the camera (and reflections) see real glass; every other ray passes straight through, so light
    and shadows come in as through an open window, without needing caustics"""
    m, nt = _mat(name)
    if nt is None: return m
    nodes = nt.nodes; out = nodes["Material Output"]; b = nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*tint, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["IOR"].default_value = ior
    lp = nodes.new("ShaderNodeLightPath"); tr = nodes.new("ShaderNodeBsdfTransparent"); tr.inputs["Color"].default_value = (*tint, 1)
    mx = nodes.new("ShaderNodeMixShader"); f = _math(nt, "MAXIMUM", lp.outputs["Is Camera Ray"], lp.outputs["Is Glossy Ray"])
    nt.links.new(f, mx.inputs["Fac"]); nt.links.new(tr.outputs["BSDF"], mx.inputs[1]); nt.links.new(b.outputs["BSDF"], mx.inputs[2]); nt.links.new(mx.outputs["Shader"], out.inputs["Surface"])
    return m


def emission(name, color=(1, 1, 1), strength=5.0):
    m, nt = _mat(name)
    if nt is None: return m
    nodes = nt.nodes; nodes.remove(nodes["Principled BSDF"]); e = nodes.new("ShaderNodeEmission"); e.inputs["Color"].default_value = (*color, 1); e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs["Emission"], nodes["Material Output"].inputs["Surface"]); return m


def lampshade(name, color=(0.86, 0.80, 0.68)):
    """linen: lets warm light through"""
    m, nt = _mat(name)
    if nt is None: return m
    nodes = nt.nodes; L = nt.links; b = nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = 0.9; b.inputs["Sheen Weight"].default_value = 0.3
    tl = nodes.new("ShaderNodeBsdfTranslucent"); tl.inputs["Color"].default_value = (color[0], color[1] * 0.9, color[2] * 0.72, 1)
    mx = nodes.new("ShaderNodeMixShader"); mx.inputs["Fac"].default_value = 0.6; L.new(b.outputs["BSDF"], mx.inputs[1]); L.new(tl.outputs["BSDF"], mx.inputs[2])
    L.new(mx.outputs[0], nodes["Material Output"].inputs["Surface"])
    return m


def leaf(name, color=(0.07, 0.13, 0.035), var=0.35, rough=0.42):
    """a leaf: waxy on top, light through it, each instance a little different"""
    m, nt = _mat(name)
    if nt is None: return m
    nodes = nt.nodes; L = nt.links; b = nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    oi = nodes.new("ShaderNodeObjectInfo"); hs = nodes.new("ShaderNodeHueSaturation"); hs.inputs["Color"].default_value = (*color, 1)
    L.new(_math(nt, "ADD", _math(nt, "MULTIPLY", oi.outputs["Random"], 0.05), 0.475), hs.inputs["Hue"]); L.new(_math(nt, "ADD", _math(nt, "MULTIPLY", oi.outputs["Random"], 2 * var), 1 - var), hs.inputs["Value"])
    L.new(hs.outputs["Color"], b.inputs["Base Color"])
    tl = nodes.new("ShaderNodeBsdfTranslucent"); L.new(hs.outputs["Color"], tl.inputs["Color"])
    mx = nodes.new("ShaderNodeMixShader"); mx.inputs["Fac"].default_value = 0.3; L.new(b.outputs["BSDF"], mx.inputs[1]); L.new(tl.outputs["BSDF"], mx.inputs[2]); L.new(mx.outputs[0], nodes["Material Output"].inputs["Surface"])
    return m


# ---------------------------------------------------------------- modelling
def link(o, coll=None):
    (coll or bpy.context.scene.collection).objects.link(o); return o


def mesh_obj(name, bm, mat=None, smooth=False, coll=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new(name, me), coll)
    if mat is not None:
        for mm in (mat if isinstance(mat, (list, tuple)) else [mat]): o.data.materials.append(mm)
    return o


def bm_box(bm, size, loc, rot_z=0.0, mat_index=0):
    """add a box to a bmesh"""
    r = bmesh.ops.create_cube(bm, size=1.0); vs = r["verts"]
    M = Matrix.Translation(loc) @ Matrix.Rotation(rot_z, 4, "Z") @ Matrix.Diagonal((size[0], size[1], size[2], 1))
    bmesh.ops.transform(bm, matrix=M, verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mat_index
    return vs


def bevel_mod(o, width, segs=3):
    md = o.modifiers.new("bevel", "BEVEL"); md.width = width; md.segments = segs; md.limit_method = "ANGLE"; return md


def box(name, size, loc, mat=None, bevel=0.0, rot_z=0.0, segs=3, coll=None):
    """a box size=(x, y, z) centred at loc, with its edges rounded by `bevel` metres"""
    bm = bmesh.new(); bm_box(bm, size, (0, 0, 0)); o = mesh_obj(name, bm, mat, coll=coll)
    o.location = loc; o.rotation_euler = (0, 0, rot_z)
    if bevel > 0: bevel_mod(o, bevel, segs)
    return o


def poly_prism(name, pts, z0, z1, mat=None, bevel=0.0, coll=None, segs=3):
    """a prism from a 2D outline (counter-clockwise), from z0 up to z1"""
    bm = bmesh.new(); vs = [bm.verts.new((p[0], p[1], z0)) for p in pts]; f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=top); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = mesh_obj(name, bm, mat, coll=coll)
    if bevel > 0: bevel_mod(o, bevel, segs)
    return o


def cyl(name, r, h, loc, mat=None, verts=64, r2=None, rot=(0, 0, 0), smooth=True, coll=None, bevel=0.0):
    """a cylinder (or cone) of height h, its base at loc"""
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    o = mesh_obj(name, bm, mat, smooth=smooth, coll=coll); o.location = loc; o.rotation_euler = rot
    if smooth:
        for p in o.data.polygons:
            if abs(p.normal.z) > 0.99: p.use_smooth = False
    if bevel > 0: bevel_mod(o, bevel)
    return o


def import_glb(path, loc=(0, 0, 0), rot_z=0.0, scale=1.0, name=None):
    """import a glTF model, parent it to an empty so it moves as one, and return the empty"""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = link(bpy.data.objects.new(name or os.path.basename(path), None))
    for o in list(new):
        if o.type in ("LIGHT", "CAMERA"): new.remove(o); bpy.data.objects.remove(o)
    for o in new:
        if o.parent is None: o.parent = root
    root.location = loc; root.rotation_euler = (0, 0, rot_z); root.scale = (scale, scale, scale)
    return root


def instance_of(root, loc, rot_z=0.0, scale=1.0, name=None):
    """another copy of an imported model, sharing its meshes"""
    new_root = link(bpy.data.objects.new(name or (root.name + ".copy"), None))
    def dup(o, parent):
        c = o.copy(); link(c); c.parent = parent
        for ch in o.children: dup(ch, c)
    for ch in root.children: dup(ch, new_root)
    new_root.location = loc; new_root.rotation_euler = (0, 0, rot_z); new_root.scale = (scale, scale, scale)
    return new_root


def area_light(name, loc, size, energy, color=(1, 1, 1), rot=(0, 0, 0), shape="RECTANGLE", size_y=None, spread=180, visible=False):
    l = bpy.data.lights.new(name, "AREA"); l.energy = energy; l.color = color; l.shape = shape; l.size = size; l.size_y = size_y or size; l.spread = math.radians(spread)
    o = link(bpy.data.objects.new(name, l)); o.location = loc; o.rotation_euler = rot; o.visible_camera = visible; return o


def point_light(name, loc, energy, color=(1.0, 0.8, 0.6), radius=0.05):
    l = bpy.data.lights.new(name, "POINT"); l.energy = energy; l.color = color; l.shadow_soft_size = radius
    o = link(bpy.data.objects.new(name, l)); o.location = loc; o.visible_camera = False; return o


def spot_light(name, loc, energy, color=(1.0, 0.85, 0.7), radius=0.03, angle=60, blend=0.6, rot=(0, 0, 0)):
    l = bpy.data.lights.new(name, "SPOT"); l.energy = energy; l.color = color; l.shadow_soft_size = radius; l.spot_size = math.radians(angle); l.spot_blend = blend
    o = link(bpy.data.objects.new(name, l)); o.location = loc; o.rotation_euler = rot; o.visible_camera = False; return o


def sun_dir(elev_deg, az_deg):
    """unit vector towards the sun; az 0 = the sun is towards +y, 90 = towards +x"""
    e, a = math.radians(elev_deg), math.radians(az_deg)
    return Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e)))


def sun(elev_deg, az_deg, strength, angle_deg=0.53, color=(1.0, 0.96, 0.9)):
    l = bpy.data.lights.new("sun", "SUN"); l.energy = strength; l.angle = math.radians(angle_deg); l.color = color
    o = link(bpy.data.objects.new("sun", l))
    o.rotation_euler = (-sun_dir(elev_deg, az_deg)).to_track_quat("-Z", "Y").to_euler(); return o


def sky_world(elev_deg, az_deg, strength=1.0, air=1.0, dust=1.0, ozone=1.0):
    """Nishita's physical sky, without its sun disc (the sun lamp is the sun); Blender's sun_rotation r puts the sun
    towards (sin r, cos r), the same as sun_dir."""
    w = bpy.context.scene.world; nt = w.node_tree; bg = nt.nodes["Background"]
    sky = nt.nodes.new("ShaderNodeTexSky"); sky.sky_type = "NISHITA"; sky.sun_disc = False; sky.sun_elevation = math.radians(elev_deg)
    sky.sun_rotation = math.radians(az_deg) % (2 * math.pi); sky.air_density = air; sky.dust_density = dust; sky.ozone_density = ozone; sky.altitude = 100
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"]); bg.inputs["Strength"].default_value = strength
    return sky


def camera(name, loc, target=None, yaw_deg=0.0, pitch_deg=0.0, lens=24, shift_x=0.0, shift_y=0.0, pano=False, level=True):
    """a camera; `level` keeps verticals vertical (architectural photography): it looks horizontally towards the
    target and `shift_y` frames up or down instead of tilting. yaw 0 looks along +y, 90 along -x."""
    c = bpy.data.cameras.new(name); c.lens = lens; c.sensor_width = 36; c.sensor_fit = "HORIZONTAL"; c.shift_x = shift_x; c.shift_y = shift_y; c.clip_start = 0.05; c.clip_end = 3000
    if pano:
        c.type = "PANO"; c.panorama_type = "EQUIRECTANGULAR"
    o = link(bpy.data.objects.new(name, c)); o.location = loc
    if target is not None:
        d = Vector(target) - Vector(loc); yaw_deg = math.degrees(math.atan2(-d.x, d.y))
        if not level: pitch_deg = math.degrees(math.atan2(d.z, math.hypot(d.x, d.y)))
    o.rotation_euler = Euler((math.radians(90 + pitch_deg), 0, math.radians(yaw_deg)), "XYZ")
    bpy.context.scene.camera = o; return o


def render(path, res=(1600, 900), samples=192, threads=4, exposure=0.0):
    sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100; sc.cycles.samples = samples
    sc.render.threads_mode = "FIXED"; sc.render.threads = threads; sc.render.filepath = path; sc.view_settings.exposure = exposure
    bpy.ops.render.render(write_still=True)


def render_pano(path, width, samples, exposure=0.0, bands=6, overlap=48, threads=4):
    """a 360 (width x width/2) rendered in vertical bands, each kept as a file as soon as it is done, then joined with
    feathered seams: if the machine restarts, only the band being rendered is lost. Same pixels, same seed, so the
    bands match; the feathering hides what the denoiser does at a band's edges."""
    from PIL import Image
    sc = bpy.context.scene; W, H = width, width // 2; base = os.path.splitext(path)[0]; parts = []
    fmt = sc.render.image_settings.file_format
    for i in range(bands):
        x0 = max(0, i * W // bands - overlap); x1 = min(W, (i + 1) * W // bands + overlap)
        bp = "%s.band%d.png" % (base, i); parts.append((x0, x1, bp))
        if os.path.exists(bp): print("band", i, "already done", flush=True); continue
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = x0 / W, x1 / W; sc.render.border_min_y, sc.render.border_max_y = 0.0, 1.0
        sc.render.image_settings.file_format = "PNG"; tmp = bp[:-4] + ".part.png"
        render(tmp, (W, H), samples, threads, exposure); os.replace(tmp, bp); print("band", i, "of", bands, "done", flush=True)
    sc.render.use_border = False; sc.render.use_crop_to_border = False; sc.render.image_settings.file_format = fmt
    out = Image.new("RGB", (W, H))
    for i, (x0, x1, bp) in enumerate(parts):
        im = Image.open(bp).convert("RGB"); m = Image.new("L", im.size, 255)
        if i > 0:       # fade in across the overlap with the band before
            ramp = Image.linear_gradient("L").rotate(90, expand=True).resize((2 * overlap, H))      # 0 at its left, 255 at its right
            m.paste(ramp, (0, 0))
        out.paste(im, (x0, 0), m)
    # the border render leaves the last column black, a thin line where the 360 wraps round: fill it from its
    # neighbours on either side of the wrap
    out.paste(Image.blend(out.crop((W - 2, 0, W - 1, H)), out.crop((0, 0, 1, H)), 0.5), (W - 1, 0))
    tmp = base + ".part.jpg"; out.save(tmp, "JPEG", quality=93); os.replace(tmp, path)
    for (_, _, bp) in parts: os.remove(bp)


def photo_finish(glow=0.35, vignette=0.18):
    """what a camera adds: a soft glow round the brightest things and a little darkening towards the corners"""
    sc = bpy.context.scene; sc.use_nodes = True; nt = sc.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    rl = nt.nodes.new("CompositorNodeRLayers"); out = nt.nodes.new("CompositorNodeComposite")
    gl = nt.nodes.new("CompositorNodeGlare"); gl.glare_type = "FOG_GLOW"; gl.quality = "HIGH"; gl.threshold = 1.2; gl.size = 8; gl.mix = -1 + glow
    nt.links.new(rl.outputs["Image"], gl.inputs["Image"])
    # vignette: an elliptical mask, blurred, multiplied in
    mask = nt.nodes.new("CompositorNodeEllipseMask"); mask.width = 0.95; mask.height = 0.95
    bl = nt.nodes.new("CompositorNodeBlur"); bl.filter_type = "FAST_GAUSS"; bl.use_relative = True; bl.factor_x = 0.35; bl.factor_y = 0.35; bl.use_extended_bounds = False
    nt.links.new(mask.outputs["Mask"], bl.inputs["Image"])
    mr = nt.nodes.new("CompositorNodeMapRange"); mr.inputs["To Min"].default_value = 1 - vignette; mr.inputs["To Max"].default_value = 1.0
    nt.links.new(bl.outputs["Image"], mr.inputs["Value"])
    mul = nt.nodes.new("CompositorNodeMixRGB"); mul.blend_type = "MULTIPLY"; mul.inputs["Fac"].default_value = 1.0
    nt.links.new(gl.outputs["Image"], mul.inputs[1]); nt.links.new(mr.outputs["Value"], mul.inputs[2])
    nt.links.new(mul.outputs["Image"], out.inputs["Image"])
    return nt
