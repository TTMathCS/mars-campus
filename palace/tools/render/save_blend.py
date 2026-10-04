"""Save a scene as a Blender file, to open in Blender 4.2 and improve by hand: the scene exactly as the render scripts
build it, every camera its pictures were taken from (the stills, and a panoramic camera for each 360), the render
settings (Cycles, AgX, the glow and vignette of photo_finish) and every texture it uses, copied beside it.
  bvenv/bin/python blend/save_blend.py <scene> <archive dir>
scene: residence | pent:<room> | crown:<room> | orb:<room> | garden:<room> | club:<room> | sport:<room> |
       memory:<room> | overall:hero | overall:whole
Writes <archive>/scenes/<scene>.blend (compressed), its textures into <archive>/assets/ (shared by all the scenes,
paths relative), and the textures packed in the glTF models into <archive>/scenes/textures/."""
import bpy, os, shutil, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib


def build(scene):
    """build the scene; returns its cameras as [(name, dict(loc, target, lens, shift, exposure) or pano point)]"""
    kind, _, room = scene.partition(":")
    if kind == "residence":
        import family, pano
        family.build()
        stills = [(n, dict(loc=c["loc"], target=c["target"], lens=c["lens"], shift=c["shift_y"], exposure=c.get("exposure", -0.05))) for n, c in family.CAMS.items()]
        panos = [(n, p, -0.05 + pano.EXPOSURE.get(n, 0.0)) for n, p in pano.STOPS.items()]
        return stills, panos
    if kind == "overall":
        import overall
        overall.build(overall.HERO_AZ, cut=(room != "whole")); c = overall.cam_at(overall.HERO_AZ); c.name = room
        return [], []
    mod = {"pent": "pent_rooms", "crown": "crown_rooms", "orb": "orb", "garden": "garden_level", "club": "club", "sport": "sport", "memory": "memory"}[kind]
    m = __import__(mod)
    m.build(room)
    R = m.ROOMS[room]; z0 = getattr(m, "Z0", 0.0) if kind == "garden" else 0.0
    stills = []
    for n, c in R["cams"].items():
        lift = lambda p: (p[0], p[1], p[2] + z0)
        stills.append((n, dict(loc=lift(c["loc"]), target=lift(c["target"]), lens=c["lens"], shift=c.get("shift", c.get("shift_y", 0.0)), exposure=c.get("exposure", 0.0))))
    panos = [(n, (p[0], p[1], p[2] + z0), 0.0) for n, p in R.get("stops", {}).items()]
    return stills, panos


def cameras(stills, panos):
    first = None
    for n, c in stills:
        o = lib.camera(n, c["loc"], c["target"], lens=c["lens"], shift_y=c["shift"]); o["exposure"] = c["exposure"]; first = first or o
    for n, p, ex in panos:
        o = lib.camera("360 " + n, (p[0], p[1], p[2] + 1.55), yaw_deg=0.0, pano=True); o["exposure"] = ex; first = first or o
    if first: bpy.context.scene.camera = first


def archive_textures(arch):
    """copy every texture file the scene uses into <arch>/assets, keeping its path below the render assets folder"""
    src_root = os.path.realpath(lib.ASSETS); dst_root = os.path.join(arch, "assets"); n = 0
    for im in bpy.data.images:
        if im.packed_file or im.source not in ("FILE", "SEQUENCE", "TILED") or not im.filepath: continue
        p = os.path.realpath(bpy.path.abspath(im.filepath))
        rel = os.path.relpath(p, src_root) if p.startswith(src_root) else os.path.join("other", os.path.basename(p))
        dst = os.path.join(dst_root, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
        if os.path.exists(p) and (not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(p)): shutil.copy2(p, dst)
        im.filepath = dst; n += 1
    return n


if __name__ == "__main__":
    scene, arch = sys.argv[1], os.path.abspath(sys.argv[2])
    t = time.time(); stills, panos = build(scene); cameras(stills, panos)
    sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = 1600, 900; sc.cycles.samples = 128
    sc.render.image_settings.file_format = "JPEG"; sc.render.image_settings.quality = 92
    lib.photo_finish(0.3, 0.15)
    n = archive_textures(arch)
    out = os.path.join(arch, "scenes", scene.replace(":", "_") + ".blend"); os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out, compress=True, relative_remap=True)
    packed = [im for im in bpy.data.images if im.packed_file]
    if packed:                                  # the glTF models' own textures: out of the file, beside it, shared
        bpy.ops.file.unpack_all(method="WRITE_LOCAL"); bpy.ops.file.make_paths_relative()
        bpy.ops.wm.save_as_mainfile(filepath=out, compress=True, relative_remap=True)
    print("saved %s: %d cameras, %d textures, %d unpacked, %.1f MB, %.0f s" % (out, len(stills) + len(panos), n, len(packed), os.path.getsize(out) / 1e6, time.time() - t), flush=True)
