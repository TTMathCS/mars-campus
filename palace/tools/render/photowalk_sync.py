"""The Crown photo walk: each point as soon as it is rendered, into the site (Jim, 7 Oct 2026: "don't wait to
publish. as long as new rendering finish just publish"). The points photowalk_render.py finished on this machine
(<scratchpad>/final/photowalk/) are copied into palace/photowalk/v/ and listed in this machine's list there
(index_<machine>.json, so the two machines never write the same file); the page reads both lists.
  python3 blend/photowalk_sync.py <scratchpad> <a|b>          once: copy, list, commit and push
  python3 blend/photowalk_sync.py <scratchpad> <a|b> loop     every 90 s (the second machine; the first machine's
                                                              autopub.py calls sync() itself)
On the second machine the tour's 360s from the photo walk's tour stops go into the archive too (panos()); the first
machine's autopub.py grades and publishes them into the tour."""
import hashlib, json, os, shutil, subprocess, sys, time

REPO = os.environ.get("MARS_REPO", "/home/user/mars-campus")
SITE = os.path.join(REPO, "palace", "photowalk")
PARTS = ("_d.png", ".webp", "_s.webp")       # a point is done when all three are there (the depth map comes last)


def sh(*a): return subprocess.run(a, cwd=REPO, capture_output=True, text=True)


def same(a, b):
    if os.path.getsize(a) != os.path.getsize(b): return False
    return hashlib.sha1(open(a, "rb").read()).digest() == hashlib.sha1(open(b, "rb").read()).digest()


def panos(scratch):
    """(the second machine) the tour's 360s rendered at the photo walk's tour stops, into the archive
    (palace/blender/renders/crown_pano/), where the first machine's autopub.py grades and publishes them into the tour"""
    src = os.path.join(scratch, "final", "crown_pano"); dst = os.path.join(REPO, "palace", "blender", "renders", "crown_pano"); out = []
    if not os.path.isdir(src): return out
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.startswith("pano_") or not f.endswith(".jpg") or ".part" in f: continue
        x, y = os.path.join(src, f), os.path.join(dst, f)
        if not os.path.exists(y) or (not same(x, y) and os.path.getmtime(x) > os.path.getmtime(y)): shutil.copy2(x, y); out.append(f[5:-4])
    return out


def sync(scratch, machine):
    """copy this machine's finished points into the site; returns the ids that are new or changed"""
    src = os.path.join(scratch, "final", "photowalk"); dst = os.path.join(SITE, "v"); os.makedirs(dst, exist_ok=True)
    if not os.path.isdir(src) or not os.path.exists(os.path.join(SITE, "plan.json")): return []
    plan = json.load(open(os.path.join(SITE, "plan.json")))
    ids = {p["id"].lower().replace("-", "").replace(".", "_"): p["id"] for p in plan["points"]}
    new, mine = [], []
    # points the plan no longer has (moved off a wall, say): their pictures out of the site
    for rid in plan.get("retired", []):
        f = rid.lower().replace("-", "").replace(".", "_"); gone = False
        for x in PARTS:
            y = os.path.join(dst, f + x)
            if os.path.exists(y): os.remove(y); gone = True
        if gone: new.append(rid + " (taken out)")
    for f, pid in sorted(ids.items()):
        files = [os.path.join(src, f + s) for s in PARTS]
        if not all(os.path.exists(x) for x in files): continue
        mine.append(pid); changed = False
        for x in files:
            y = os.path.join(dst, os.path.basename(x))
            if not os.path.exists(y) or not same(x, y): shutil.copy2(x, y); changed = True
        if changed: new.append(pid)
    lst = os.path.join(dst, "index_%s.json" % machine)
    old = json.load(open(lst))["ready"] if os.path.exists(lst) else []
    ready = sorted((set(old) | set(mine)) & set(ids.values()))
    if ready != sorted(old):
        json.dump(dict(ready=ready), open(lst, "w"), indent=0)
    return new


def push(msg):
    sh("git", "add", "palace/photowalk/v", "palace/blender/renders/crown_pano")
    if sh("git", "diff", "--cached", "--quiet").returncode == 0: return False
    sh("git", "commit", "-q", "-m", msg + "\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U4NrzcFVFwFYPq6dhgJtP1")
    for w in (2, 4, 8, 16, 32):
        if sh("git", "pull", "-q", "--rebase", "--autostash", "origin", "main").returncode == 0 and sh("git", "push", "-q", "origin", "main").returncode == 0:
            print(time.strftime("%H:%M"), "pushed:", msg, flush=True); return True
        time.sleep(w)
    print(time.strftime("%H:%M"), "push failed", flush=True); return False


def message(new):
    done = [x for x in new if not x.endswith(" (taken out)")]; out = [x[:-12] for x in new if x.endswith(" (taken out)")]
    say = lambda xs: ", ".join(xs) if len(xs) <= 6 else "%d points (%s ... %s)" % (len(xs), xs[0], xs[-1])
    return "Photo walk: " + "; ".join(([say(done) + " rendered"] if done else []) + (["taken out: " + say(out)] if out else []))


if __name__ == "__main__":
    scratch, machine = os.path.abspath(sys.argv[1]), sys.argv[2]
    while True:
        try:
            sh("git", "pull", "-q", "--rebase", "--autostash", "origin", "main")
            new = sync(scratch, machine); tour = panos(scratch) if machine != "a" else []
            if new or tour: push(message(new) if new else "Raw renders: the tour's 360 at %s, from the photo walk (second machine)" % ", ".join(tour))
        except Exception as e:
            print(time.strftime("%H:%M"), "error:", e, flush=True)
        if sys.argv[3:] != ["loop"]: break
        time.sleep(90)
