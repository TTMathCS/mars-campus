"""Paintings for Arcadia's walls: each a public-domain work from assets/art (fetch_art.py; art.json says what each
is), hung at its own proportions on a canvas 4 cm deep, in a frame that suits it (a thin floating frame of walnut or
bronze for the modern works, a gilt one for the old masters), lit by its own picture light.
    import art; art.hang("salon wave", "hokusai_great_wave", 2.4, loc, rot_z, z=1.9)"""
import bpy, json, math, os
import lib
from seating import soft_box, metal, _piece

ART = os.path.join(lib.ASSETS, "art")


def catalogue():
    p = os.path.join(ART, "art.json")
    return {os.path.splitext(a["file"])[0]: a for a in json.load(open(p))} if os.path.exists(p) else {}


def canvas_material(key):
    name = "painting " + key; m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links; b = N["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.55; b.inputs["Specular IOR Level"].default_value = 0.35
    t = N.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(ART, key + ".jpg"), check_existing=True); t.interpolation = "Cubic"
    L.new(t.outputs["Color"], b.inputs["Base Color"])
    # the weave of the canvas and the paint's ridges catch the light a little
    tc = N.new("ShaderNodeTexCoord"); nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 900.0; L.new(tc.outputs["Object"], nz.inputs["Vector"])
    bw = N.new("ShaderNodeRGBToBW"); L.new(t.outputs["Color"], bw.inputs["Color"])
    h = lib._math(nt, "ADD", lib._math(nt, "MULTIPLY", nz.outputs["Fac"], 0.4), lib._math(nt, "MULTIPLY", bw.outputs["Val"], 0.6))
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.12; bp.inputs["Distance"].default_value = 0.002; L.new(h, bp.inputs["Height"]); L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def frame_material(style):
    if style == "gilt": return metal("frame gilt", (0.72, 0.52, 0.22), 0.3)
    if style == "bronze": return metal("frame bronze", (0.25, 0.17, 0.10), 0.35)
    return lib.wood("frame walnut", (0.16, 0.10, 0.06), (0.08, 0.05, 0.03), 0.4)


def hang(name, key, width, loc, rot_z, z=1.8, style=None, light=True, height=None):
    """the painting key, width metres wide (or height metres tall), its middle z up, on the wall at loc facing -y of
    rot_z (as seating's pieces: the painting's face to -y)"""
    cat = catalogue(); a = cat.get(key)
    if a is None: raise KeyError("no painting %s in %s" % (key, ART))
    asp = a["w_px"] / a["h_px"]
    w, h = (width, width / asp) if height is None else (height * asp, height)
    style = style or ("gilt" if (a.get("year") or 2000) < 1880 and a.get("mood") != "print" else "walnut" if a.get("mood") in ("abstract", "print") else "bronze")
    F = frame_material(style); fw = 0.06 if style == "gilt" else 0.025; gap = 0.0 if style == "gilt" else 0.012
    parts = []
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.045, z)); c = bpy.context.active_object
    c.name = name + " canvas"; c.scale = (w, h, 1); c.rotation_euler = (math.pi / 2, 0, 0); c.data.materials.append(canvas_material(key))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); parts.append(c)
    parts.append(soft_box(name + " stretcher", (w, 0.04, h), (0, -0.022, z), lib.principled("canvas edge", (0.78, 0.74, 0.66), 0.8), r=0.004, crown=0, bulge=0, crease=0, sub=0))
    depth = 0.07 if style == "gilt" else 0.055
    for (sx, sz, cx, cz) in ((w + 2 * (fw + gap), fw, 0, z + h / 2 + gap + fw / 2), (w + 2 * (fw + gap), fw, 0, z - h / 2 - gap - fw / 2),
                             (fw, h + 2 * gap, -w / 2 - gap - fw / 2, z), (fw, h + 2 * gap, w / 2 + gap + fw / 2, z)):
        parts.append(soft_box(name + " frame", (sx, depth, sz), (cx, -depth / 2 + 0.005, cz), F, r=0.004 if style != "gilt" else 0.012, crown=0, bulge=0, crease=0, sub=1))
    if gap > 0:
        parts.append(soft_box(name + " tray", (w + 2 * gap, 0.01, h + 2 * gap), (0, 0.0, z), lib.principled("frame shadow", (0.02, 0.02, 0.02), 0.8), r=0.002, crown=0, bulge=0, crease=0, sub=0))
    p = _piece(name, loc, rot_z, parts)
    if light:
        import lights
        lights.picture_light(name + " light", loc, rot_z, width=min(1.6, w * 0.6), z=z + h / 2 + 0.22, watts=8 + 10 * w)
    return p, (w, h)


def available():
    return sorted(catalogue())
