"""Publish every finished Crown render as soon as it is there (Jim, 7 Oct 2026: "don't wait to publish. as long as new
rendering finish just publish"). Every 90 s: this machine's finals and 360s are copied into the archive
(palace/blender/renders/crown_h/, crown_pano/), the other machine's are pulled, and each one not yet published is
graded to the earlier pictures' tones (grade.py: night for the star lounge's night views, else pale or day by its own
brightness) and published: a photo into palace/tour/photos/ and its room's entry in gen_plan.py, a 360 into
palace/tour/pano/ and its stop shown (tour_crown.py's CURRENT). Then the pages are made again and pushed.
The photo walk's points go into palace/photowalk/v/ as they are rendered (photowalk_sync.py).
  python3 autopub.py <scratchpad>          (blend/grade.py, blend/pub.py and bvenv/ under it; the repo at $MARS_REPO)"""
import hashlib, json, os, re, shutil, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photowalk_sync                # the photo walk's points, each as soon as it is rendered

S = os.path.abspath(sys.argv[1]); REPO = os.environ.get("MARS_REPO", "/home/user/mars-campus")
RAW = os.path.join(REPO, "palace", "blender", "renders"); STATE = os.path.join(S, "autopub.json")
GEN = os.path.join(REPO, "palace", "tools", "gen_plan.py"); TOURC = os.path.join(REPO, "palace", "tools", "tour_crown.py")

# where each picture belongs on the rooms page (gen_plan.py's room ids), and what is said under it
ROOM = {"arrival": "arrival", "arrival2": "arrival", "suit": "arrival", "hangar": "arrival",
        "dressing": "suite_up", "bedroom": "suite_up", "bedroom2": "suite_up", "bath_up": "suite_up", "bath_up2": "suite_up",
        "salon": "salon", "salon2": "salon", "hearth": "salon", "piano_up": "salon",
        "wellness": "wellness", "wellness2": "wellness", "spa": "wellness", "gym": "wellness",
        "wine": "dining_up", "wine2": "dining_up", "dining": "dining_up", "dining2": "dining_up", "kitchen_up": "dining_up", "kitchen_up2": "dining_up",
        "day_room": "sunset", "sunset": "sunset", "sunset2": "sunset", "gallery": "sunset",
        "library": "library_up", "library_up": "library_up", "maproom": "library_up", "study": "library_up",
        "studio": "studio", "prints": "studio", "craft": "studio",
        "stars": "observatory", "stars_day": "observatory", "telescope": "observatory",
        "garden": "garden_room", "breakfast": "garden_room"}
CAPTION = {
    "stars": "The star lounge at night, its glass walls clear: deep recliners under the stars, the Orb beyond the garden.",
    "stars_day": "The star lounge by day, its switchable glass walls tinted dark against the sun.",
    "telescope": "The telescope room: a desk and a screen on each stretch of wall between the windows, a sofa to watch from, the portal up to the dome.",
    "study": "The study: Jim's desk at the windows, the frosted glass onto the Glide, a reading corner by the olive tree.",
    "wine": "The wine room: the wall of bottles, the tasting group by the windows.",
    "arrival2": "The Arrival hall from the Glide side: the great maple in its round banquette, Van Gogh's Starry Night on the end wall beside the portal.",
    "dressing": "The dressing room up: a round velvet ottoman, the triple mirror, a sitting corner by the windows.",
    "bath_up": "The bath up: a bathing pool of black basalt in the middle, the stone tub between two windows, chaises and kentia palms.",
    "bath_up2": "The bath up from the pool: the tub between the windows, alabaster lamps over it.",
    "day_room": "The guests' lounge: desks on the wall between the windows, a games table under a halo, a red maple.",
    "garden": "The sky garden: island beds of maples, ferns and lemons round a basin, daybeds under the trees.",
    "breakfast": "The breakfast room: the round table under its globes, the morning sun through the windows.",
    "suit": "The suit room: steel lockers between the windows, the airlock at the end, club chairs and agaves.",
    "hangar": "The pod hangar: both pods home on their pads, lines of light in the ceiling, palms by the way to the Door.",
}
NIGHT = ("stars", "telescope")


def sh(*a, **kw): return subprocess.run(a, cwd=kw.pop("cwd", REPO), capture_output=True, text=True, **kw)


def sha(p): return hashlib.sha1(open(p, "rb").read()).hexdigest()


def kind_for(name, src):
    if name in NIGHT: return "night"
    if name.endswith("_day"): return "day"
    from PIL import Image
    im = Image.open(src).convert("L").resize((320, 180)); px = sorted(im.getdata())
    return "pale" if px[len(px) // 2] / 255.0 > 0.42 else "day"


def grade(name, src, dst):
    k = kind_for(name, src)
    r = subprocess.run([os.path.join(S, "bvenv", "bin", "python"), os.path.join(S, "blend", "grade.py"), k, src, dst], capture_output=True, text=True)
    if r.returncode or not os.path.exists(dst): raise RuntimeError("grade failed: " + r.stderr[-300:])
    return k


def pub(*args):
    r = subprocess.run([sys.executable, os.path.join(S, "blend", "pub.py")] + list(args), capture_output=True, text=True, env=dict(os.environ, MARS_REPO=REPO))
    if r.returncode: raise RuntimeError("pub failed: " + (r.stderr or r.stdout)[-300:])


def add_to_plan(name, cap):
    """the photo in its room's list on the rooms page, if it is not there yet"""
    s = open(GEN, encoding="utf-8").read(); ref = '"../tour/photos/crown_%s.jpg"' % name
    if ref in s or name not in ROOM: return
    i = s.find('dict(id="%s"' % ROOM[name]); j = s.find("photos=[", i)
    if i < 0 or j < 0: return
    j += len("photos=[")
    s = s[:j] + "(%s, %s), " % (ref, json.dumps(cap, ensure_ascii=False)) + s[j:]
    open(GEN, "w", encoding="utf-8").write(s)


def stop_ids():
    """tour_crown.py's stops: the scene's stop name -> the tour's stop id"""
    s = open(TOURC, encoding="utf-8").read()
    return {m.group(2): m.group(1) for m in re.finditer(r'\("(crown_[a-z_]+)", "C-\d+", "[a-z_]+", "([a-z_]+)"', s)}


def mark_current(sid):
    s = open(TOURC, encoding="utf-8").read(); m = re.search(r'^CURRENT = \{([^}]*)\}', s, flags=re.M)
    have = set(re.findall(r'"([a-z_]+)"', m.group(1)))
    if sid in have: return
    have.add(sid); new = "CURRENT = {%s}" % ", ".join('"%s"' % x for x in sorted(have))
    s = s[:m.start()] + new + s[m.end():]; open(TOURC, "w", encoding="utf-8").write(s)


def collect():
    """this machine's finished pictures into the archive"""
    n = 0
    for sub, pat in (("crown_h", r"^c_[a-z0-9_]+\.jpg$"),):
        src = os.path.join(S, "final", sub); dst = os.path.join(RAW, sub); os.makedirs(dst, exist_ok=True)
        for f in sorted(os.listdir(src)) if os.path.isdir(src) else []:
            if not re.match(pat, f) or ".part." in f: continue
            d = os.path.join(dst, f)
            if os.path.exists(d) and (sha(d) == sha(os.path.join(src, f)) or os.path.getmtime(d) >= os.path.getmtime(os.path.join(src, f))): continue      # never older over newer
            shutil.copy2(os.path.join(src, f), d); n += 1
    return n


def publish(state):
    done = []
    for f in sorted(os.listdir(os.path.join(RAW, "crown_h"))):
        m = re.match(r"^c_([a-z0-9_]+)\.jpg$", f)
        if not m or m.group(1) not in ROOM: continue
        name, src = m.group(1), os.path.join(RAW, "crown_h", f); h = sha(src)
        if state.get("photo " + name) == h: continue
        dst = os.path.join(S, "graded", "c_%s.jpg" % name); os.makedirs(os.path.dirname(dst), exist_ok=True)
        k = grade(name, src, dst)
        cap = CAPTION.get(name)
        if cap is None:                      # a picture published before keeps what is written under it
            s = open(os.path.join(REPO, "palace", "tour", "stops.js"), encoding="utf-8").read()
            mm = re.search(r'photos/crown_%s\.jpg", caption: ("(?:[^"\\]|\\.)*")' % name, s)
            cap = json.loads(mm.group(1)) if mm else "The Crown: %s." % name.replace("_", " ")
        pub("photo", dst, "crown_" + name, cap); add_to_plan(name, cap)
        state["photo " + name] = h; done.append("%s (%s)" % (name, k))
    # the 360 tour keeps its 360s: none is published over them any more (Jim, 8 Oct 2026: "DON'T touch 360 tour for
    # each room, which i like very much"; the photo walk's renders at the tour stops had been going in)
    ids = {}; pd = os.path.join(RAW, "crown_pano")
    for f in sorted(os.listdir(pd)) if os.path.isdir(pd) else []:
        m = re.match(r"^pano_([a-z0-9_]+)\.jpg$", f)
        if not m or m.group(1) not in ids: continue
        stop, src = m.group(1), os.path.join(pd, f); h = sha(src); sid = ids[stop]
        if state.get("pano " + stop) == h: continue
        dst = os.path.join(S, "graded", "pano_%s.jpg" % stop); os.makedirs(os.path.dirname(dst), exist_ok=True)
        k = grade(stop, src, dst); pub("pano", dst, sid); mark_current(sid)
        state["pano " + stop] = h; done.append("360 %s (%s)" % (sid, k))
    return done


def walk_parts(state):
    """the walk's parts baked so far (walk_part.sh, on either machine): joined into the whole ring when one is new"""
    pd = os.path.join(REPO, "palace", "walk", "parts")
    if not os.path.isdir(pd): return None
    sig = sha_str(sorted((f, os.path.getsize(os.path.join(pd, f))) for f in os.listdir(pd)))
    if state.get("walk") == sig: return None
    r = sh(sys.executable, os.path.join(REPO, "palace", "tools", "render", "walk_merge.py"), os.path.join(REPO, "palace", "walk"))
    if r.returncode: raise RuntimeError("walk_merge failed: " + r.stderr[-300:])
    state["walk"] = sig; return r.stdout.strip()


def sha_str(x): return hashlib.sha1(repr(x).encode()).hexdigest()


def push(msg):
    sh("git", "add", "palace/blender/renders/crown_h", "palace/blender/renders/crown_pano", "palace/tour", "palace/design", "palace/tools/gen_plan.py", "palace/tools/tour_crown.py",
       "palace/walk/data", "palace/walk/parts", "palace/photowalk/v")
    if sh("git", "diff", "--cached", "--quiet").returncode == 0: return
    sh("git", "commit", "-q", "-m", msg + "\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01U4NrzcFVFwFYPq6dhgJtP1")
    for w in (2, 4, 8, 16, 32):
        if sh("git", "pull", "-q", "--rebase", "--autostash", "origin", "main").returncode == 0 and sh("git", "push", "-q", "origin", "main").returncode == 0:
            print(time.strftime("%H:%M"), "pushed:", msg.split("\n")[0], flush=True); return
        time.sleep(w)
    print(time.strftime("%H:%M"), "push failed", flush=True)


def main():
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    while True:
        try:
            n = collect()
            sh("git", "pull", "-q", "--rebase", "--autostash", "origin", "main")
            done = publish(state); walk = walk_parts(state); pw = photowalk_sync.sync(S, "a")
            json.dump(state, open(STATE, "w"), indent=1)
            if done:
                sh(sys.executable, GEN); sh(sys.executable, TOURC)
                push("Published: " + ", ".join(done) + ("\n\n" + walk if walk else "") + ("\n\n" + photowalk_sync.message(pw) if pw else ""))
            elif pw:
                push(photowalk_sync.message(pw) + ("\n\n" + walk if walk else ""))
            elif walk:
                push("Walk: the parts baked so far joined into the whole ring\n\n" + walk)
            elif n:
                push("Raw renders of the Crown (first machine): %d new" % n)
        except Exception as e:
            print(time.strftime("%H:%M"), "error:", e, flush=True)
        time.sleep(90)


if __name__ == "__main__":
    main()
