"""Publish a fitted splat (splat_views.py, then OpenSplat) into palace/splat/ and keep its design files:
  python3 splat_publish.py <dataset dir> <fitted .ply or .spz> <room id> [reach m]
  - the splat as palace/splat/data/<room>.spz (written by OpenSplat from the .ply: compressed, about a tenth of the size)
  - the room listed in palace/splat/data/rooms.json: its name and page, where its rig stood, how far you may step
  - the dataset (transforms.json, points.ply, the graded images) in palace/blender/splats/<room>/, so it can be fitted
    again (longer, or on a graphics card)"""
import json, math, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("MARS_REPO") or next(p for p in ("/home/user/mars-campus", os.path.join(HERE, "..", "..", "..")) if os.path.exists(os.path.join(p, "palace")))
GS = os.environ.get("GS_DIR", os.path.join(HERE, "..", "gs"))
NAMES = {"bedroom": ("The master suite up", "The Crown · Master suite up", "rooms-crown.html#suite_up")}


def opensplat(*args):
    env = dict(os.environ, MAMBA_ROOT_PREFIX=os.path.join(GS, "mroot"))
    cmd = [os.path.join(GS, "mm", "bin", "micromamba"), "run", "-p", os.path.join(GS, "env"), os.path.join(GS, "OpenSplat", "build", "opensplat")] + list(args)
    print(" ".join(cmd), flush=True); subprocess.run(cmd, check=True, env=env)


def sh_degree(ply):
    """the spherical-harmonic degree a fitted .ply was trained to (from how many f_rest properties it has)"""
    head = b""
    with open(ply, "rb") as f:
        while not head.endswith(b"end_header\n"): head += f.readline()
    n = head.count(b"property float f_rest_")
    return {0: 0, 9: 1, 24: 2, 45: 3}[n]


def main():
    data, fitted, room = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), sys.argv[3]
    T = json.load(open(os.path.join(data, "transforms.json")))
    reach = float(sys.argv[4]) if len(sys.argv) > 4 else T.get("spread", 2.4) + 0.5
    out = os.path.join(REPO, "palace", "splat", "data"); os.makedirs(out, exist_ok=True); spz = os.path.join(out, room + ".spz")
    if fitted.endswith(".spz"): shutil.copy(fitted, spz)
    else: opensplat(data, "--resume", fitted, "-n", "0", "--sh-degree", str(max(1, sh_degree(fitted))), "-o", spz)
    r, b = T["centre"]; x, y = r * math.sin(math.radians(b)), r * math.cos(math.radians(b))
    dx, dy = -math.sin(math.radians(b)), -math.cos(math.radians(b))       # first facing the ring's centre
    name, k, page = NAMES.get(room, (room, "The Crown", "rooms-crown.html"))
    rj = os.path.join(out, "rooms.json"); rooms = json.load(open(rj)) if os.path.exists(rj) else []
    rooms = [x_ for x_ in rooms if x_["id"] != room] + [dict(id=room, name=name, k=k, page="../design/" + page, file=room + ".spz",
             centre=[round(x, 3), round(y, 3), 0.0], reach=round(reach, 2), yaw0=round(math.degrees(math.atan2(-dx, dy)), 1))]
    json.dump(rooms, open(rj, "w"), indent=1)
    keep = os.path.join(REPO, "palace", "blender", "splats", room); os.makedirs(os.path.join(keep, "images"), exist_ok=True)
    if os.path.realpath(keep) != os.path.realpath(data):      # (fitted straight from the kept copy: nothing to copy)
        for f in ("transforms.json", "points.ply"): shutil.copy(os.path.join(data, f), keep)
        for f in os.listdir(os.path.join(data, "images")): shutil.copy(os.path.join(data, "images", f), os.path.join(keep, "images", f))
    print("published", spz, os.path.getsize(spz) // 1024, "KB; kept", keep, flush=True)


if __name__ == "__main__":
    main()
