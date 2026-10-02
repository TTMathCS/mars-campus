"""Earth and Mars side by side, to scale, lit by the same Sun: Earth from NASA's Blue Marble (assets/earth4k.jpg,
x = 0 at 180° W) with a layer of cloud and a thin blue rim of air; Mars from a real colour map (assets/mars2k.jpg,
x = 0 at 0° E) with a faint rim of dusty air. Mars shows Tharsis, Olympus Mons and Valles Marineris; Arcadia
Planitia, where the house is, lies near its upper left.
  bvenv/bin/python blend/planets.py <out.jpg> [w h spp]"""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib

D = math.pi / 180
SUN_EL, SUN_AZ = 12, 214
SUN = lib.sun_dir(SUN_EL, SUN_AZ)


def planet(name, R, x, img, lon_center, img_lon0, rough):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=R, location=(x, 0, 0)); o = bpy.context.active_object; o.name = name
    for p in o.data.polygons: p.use_smooth = True
    m, nt = lib._mat(name); N, L = nt.nodes, nt.links; b = N["Principled BSDF"]; b.inputs["Roughness"].default_value = rough
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    # the point facing the camera (from -y) is at atan2(y, x) = -90 degrees: it shows longitude lon_center
    phi = lib._math(nt, "MULTIPLY", lib._math(nt, "ARCTAN2", sep.outputs[1], sep.outputs[0]), 180 / math.pi)
    u = lib._math(nt, "FRACT", lib._math(nt, "DIVIDE", lib._math(nt, "ADD", phi, 90.0 + lon_center - img_lon0 + 720.0), 360.0))
    lat = lib._math(nt, "ARCSINE", lib._math(nt, "MINIMUM", lib._math(nt, "MAXIMUM", lib._math(nt, "DIVIDE", sep.outputs[2], R), -1.0), 1.0))
    v = lib._math(nt, "ADD", 0.5, lib._math(nt, "DIVIDE", lat, math.pi))
    cc = N.new("ShaderNodeCombineXYZ"); L.new(u, cc.inputs[0]); L.new(v, cc.inputs[1])
    t = lib._tex(nt, os.path.join(lib.ASSETS, img)); t.extension = "EXTEND"; t.interpolation = "Cubic"; L.new(cc.outputs[0], t.inputs["Vector"])
    L.new(t.outputs["Color"], b.inputs["Base Color"])
    o.data.materials.append(m)
    return o


def shell(name, R, x, color, strength, power, clouds=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=R, location=(x, 0, 0)); o = bpy.context.active_object; o.name = name
    for p in o.data.polygons: p.use_smooth = True
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N, L = nt.nodes, nt.links
    N.remove(N["Principled BSDF"]); out = N["Material Output"]; tr = N.new("ShaderNodeBsdfTransparent"); mx = N.new("ShaderNodeMixShader")
    if clouds:
        tc = N.new("ShaderNodeTexCoord"); n = N.new("ShaderNodeTexNoise"); n.noise_dimensions = "3D"; n.inputs["Scale"].default_value = 2.2; n.inputs["Detail"].default_value = 12; n.inputs["Roughness"].default_value = 0.62; n.inputs["Distortion"].default_value = 0.6
        L.new(tc.outputs["Object"], n.inputs["Vector"])
        mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / R, 1 / R, 2.2 / R); L.new(tc.outputs["Object"], mp.inputs["Vector"]); L.new(mp.outputs["Vector"], n.inputs["Vector"])
        cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].position = 0.52; cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].position = 0.72; cr.color_ramp.elements[1].color = (1, 1, 1, 1)
        L.new(n.outputs["Fac"], cr.inputs["Fac"])
        wb = N.new("ShaderNodeBsdfPrincipled"); wb.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1); wb.inputs["Roughness"].default_value = 1.0
        L.new(cr.outputs["Color"], mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(wb.outputs[0], mx.inputs[2])
    else:
        lw = N.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.5
        geo = N.new("ShaderNodeNewGeometry"); dot = N.new("ShaderNodeVectorMath"); dot.operation = "DOT_PRODUCT"; dot.inputs[1].default_value = tuple(SUN)
        L.new(geo.outputs["Normal"], dot.inputs[0])
        day = lib._math(nt, "MINIMUM", lib._math(nt, "MAXIMUM", lib._math(nt, "MULTIPLY", lib._math(nt, "ADD", dot.outputs["Value"], 0.12), 2.5), 0.0), 1.0)
        f = lib._math(nt, "MULTIPLY", lib._math(nt, "POWER", lw.outputs["Facing"], power), day)       # air glows only on the day side
        em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (*color, 1); em.inputs["Strength"].default_value = strength
        ad = N.new("ShaderNodeAddShader"); L.new(tr.outputs[0], ad.inputs[0]); L.new(em.outputs[0], ad.inputs[1])
        L.new(f, mx.inputs["Fac"]); L.new(tr.outputs[0], mx.inputs[1]); L.new(ad.outputs[0], mx.inputs[2])
    L.new(mx.outputs[0], out.inputs["Surface"]); m.blend_method = "BLEND"
    o.data.materials.append(m); o.visible_shadow = False
    return o


if __name__ == "__main__":
    out = os.path.abspath(sys.argv[1]); w, h, spp = (int(a) for a in (sys.argv[2:5] if len(sys.argv) > 4 else (1600, 900, 64)))
    sc = lib.reset(); sc.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
    RE, RM, GAP = 6371.0, 3389.5, 2600.0
    left = -(2 * RE + GAP + 2 * RM) / 2; xe = left + RE; xm = -left - RM
    planet("earth", RE, xe, "earth4k.jpg", 5.0, -180.0, 0.55)
    shell("clouds", RE * 1.006, xe, None, 0, 0, clouds=True)
    shell("earth air", RE * 1.018, xe, (0.30, 0.55, 1.0), 1.6, 6.0)
    planet("mars", RM, xm, "mars2k.jpg", 245.0, 0.0, 0.95)
    shell("mars air", RM * 1.012, xm, (0.95, 0.62, 0.42), 0.35, 7.0)
    lib.sun(SUN_EL, SUN_AZ, 3.2, angle_deg=0.53, color=(1.0, 0.98, 0.95))
    cam = bpy.data.cameras.new("cam"); cam.type = "ORTHO"; cam.ortho_scale = 2 * RE + GAP + 2 * RM + 4600; cam.clip_end = 400000
    co = lib.link(bpy.data.objects.new("cam", cam)); co.location = (0, -200000, 0); co.rotation_euler = (math.radians(90), 0, 0); sc.camera = co
    sc.cycles.max_bounces = 4
    lib.render(out, (w, h), spp, exposure=0.0)
    print("rendered", out, flush=True)
