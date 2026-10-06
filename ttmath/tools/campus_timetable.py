"""The Fall 2026 timetable and the room every class meets in.

The classes, days and times are TTMath's own "2026 Fall Schedule" (Sep 9 to Dec 21, 15 weeks), from the picture Jim
sent on 6 Oct 2026, row for row as printed. Each time carries how the class meets, from the colour it is printed in:
"on" in the room (black), "off" online (red), "both" in the room and online at once (purple). Jim, 5 Oct 2026: "each area
esp classroom should have room number so students know which room they should go ... the schedule should be somewhere
in the entrance so students know where they are going to".

rooms() gives every class that meets in a room its room, by the preferences below, never two classes in one room at
the same time; the room numbers are the Ring's (campus_rooms.room_no). campus_buildings.py writes the result into the
demo's data (P2.timetable) for the boards at the entrance, and into plan/schedule.html.
usage: python3 ttmath/tools/campus_timetable.py   (prints the timetable with its rooms and checks it)
"""
import re

TERM = dict(title="2026 Fall Schedule", dates="Sep 9 – Dec 21", weeks=15)
DAYS = ("WED", "THU", "FRI", "SAT", "SUN")
HW_ONLINE = "Mon {} online"            # the homework classes are online on Mondays

# Each class: its name as printed, the rows as printed (a row maps a day to (time, mode)), its homework class, and the
# rooms it prefers, best first (by room number). The groups are the boards' sections.
GROUPS = [
    dict(name="FunMath", classes=[
        dict(name="FunMath 2", hw="In class", rooms=(239, 243, 219),
             rows=[{"SAT": ("200-400pm", "on"), "SUN": ("200-400pm", "on")}]),
        dict(name="FunMath 3", hw="530-630pm", rooms=(239, 243, 219),
             rows=[{"WED": ("645-845pm", "on"), "FRI": ("645-845pm", "on"), "SAT": ("200-400pm", "on")},
                   {"SUN": ("1130-130pm", "on")}]),
        dict(name="FunMath 4", hw="645-745pm", rooms=(243, 239, 219),
             rows=[{"WED": ("645-845pm", "on"), "THU": ("415-615pm", "on"), "SUN": ("915-1115am", "on")},
                   {"SAT": ("415-615pm", "on"), "SUN": ("1130-130pm", "on")},
                   {"SUN": ("200-400pm", "off")}]),
        dict(name="FunMath 5", hw="800-900pm", rooms=(219, 239, 243),
             rows=[{"WED": ("430-630pm", "on"), "THU": ("645-845pm", "off"), "FRI": ("430-630pm", "on"), "SAT": ("915-1115am", "off"), "SUN": ("915-1115am", "on")},
                   {"THU": ("645-845pm", "on"), "SAT": ("630-830pm", "on"), "SUN": ("415-615pm", "off")}]),
    ]),
    dict(name="Basic and Calculus", classes=[
        dict(name="L2 Basic · Gr 9–10 Algebra", hw="530-630pm", rooms=(229, 233),
             rows=[{"WED": ("615-845pm", "on"), "THU": ("400-630pm", "off"), "FRI": ("630-900pm", "on"), "SAT": ("200-430pm", "on"), "SUN": ("200-430pm", "on")},
                   {"THU": ("630-900pm", "on"), "FRI": ("645-915pm", "off"), "SAT": ("630-900pm", "off"), "SUN": ("415-645pm", "on")}]),
        dict(name="L3 Basic · Gr 11 Functions", hw="645-745pm", rooms=(229, 233),
             rows=[{"FRI": ("400-630pm", "both"), "SAT": ("415-645pm", "on"), "SUN": ("1130-200pm", "off")},
                   {"SUN": ("430-700pm", "on")}]),
        dict(name="L4 Basic · Gr 12 Adv. Functions", hw="800-900pm", rooms=(233, 229),
             rows=[{"THU": ("645-915pm", "off"), "SAT": ("630-900pm", "on"), "SUN": ("445-715pm", "both")}]),
        dict(name="Calculus & Vectors · Gr 12", hw="645-745pm", rooms=(233, 229),
             rows=[{"THU": ("615-845pm", "both"), "SAT": ("1130-200pm", "off")}]),
    ]),
    dict(name="Contest", classes=[
        dict(name="L1 Contest · Foundation", hw="530-630pm", rooms=(219, 129, 243),
             rows=[{"WED": ("430-630pm", "off"), "THU": ("430-630pm", "on"), "FRI": ("430-630pm", "off"), "SAT": ("915-1115am", "on"), "SUN": ("915-1115am", "off")},
                   {"FRI": ("430-630pm", "on"), "SAT": ("200-400pm", "on"), "SUN": ("915-1115am", "on")},
                   {"FRI": ("645-845pm", "on"), "SUN": ("200-400pm", "on")}]),
        dict(name="L2 Contest · Geometry", hw="645-745pm", rooms=(233, 129),
             rows=[{"WED": ("430-630pm", "off"), "FRI": ("645-845pm", "on"), "SAT": ("1130-130pm", "on"), "SUN": ("915-1115am", "off")},
                   {"WED": ("430-630pm", "on"), "SUN": ("1130-130pm", "off")},
                   {"WED": ("645-845pm", "off"), "SUN": ("1130-130pm", "on")}]),
        dict(name="L3 Contest · Algebra", hw="645-745pm", rooms=(229, 129),
             rows=[{"WED": ("430-630pm", "on"), "FRI": ("430-630pm", "off"), "SAT": ("1130-130pm", "on"), "SUN": ("1130-130pm", "on")},
                   {"WED": ("645-845pm", "off"), "SAT": ("630-830pm", "off")}]),
        dict(name="L4 Contest", hw="800-900pm", rooms=(139, 129),
             rows=[{"WED": ("645-845pm", "on"), "FRI": ("645-845pm", "off"), "SAT": ("915-1115am", "off"), "SUN": ("915-1115am", "on")}]),
        dict(name="L5 Contest", hw="800-900pm", rooms=(139, 129),
             rows=[{"SAT": ("915-1115am", "both")}]),
        dict(name="AMC 8 Beginner · L1+", hw="In class", rooms=(139, 129),
             rows=[{"SAT": ("915-1115am", "both")}]),
        dict(name="AMC 8 Advanced · L2+", hw="In class", rooms=(139, 129),
             rows=[{"SAT": ("1130-130pm", "both")}]),
        dict(name="AMC 10 · L3+", hw="In class", rooms=(139, 129),
             rows=[{"SUN": ("200-415pm", "both")}]),
        dict(name="Euclid · L4+", hw="In class", rooms=(233, 139),
             rows=[{"SUN": ("915-1115am", "off")}, {"SUN": ("1130-130pm", "on")}]),
        dict(name="COMC · L4+", hw="In class", rooms=(139,),
             rows=[{"FRI": ("645-845pm", "off")}]),
    ]),
    dict(name="By invitation and Olympiad", classes=[
        dict(name="L1 Selective", hw="In class", rooms=(211, 139), rows=[{"SUN": ("200-400pm", "both")}]),
        dict(name="L2 Selective", hw="In class", rooms=(211, 139), rows=[{"SUN": ("415-615pm", "both")}]),
        dict(name="Math Modeling", hw="In class", rooms=(211,), rows=[{"SAT": ("1130-130pm", "off")}]),
        dict(name="Research Writing", hw="In class", rooms=(211,), rows=[{"SAT": ("415-615pm", "both")}]),
        dict(name="AMC 12 / AIME", hw="In class", rooms=(139,), rows=[{"SAT": ("630-830pm", "off")}]),
        dict(name="Math Olympiad Junior", hw="In class", rooms=(139, 211), rows=[{"FRI": ("630-900pm", "both")}]),
        dict(name="Math Olympiad Senior", hw="In class", rooms=(139, 211), rows=[{"SAT": ("630-900pm", "both")}]),
    ]),
    dict(name="Computer Science", classes=[
        dict(name="CS-AI Workshop", hw="In class", rooms=(213, 127), rows=[{"SAT": ("445-615pm", "both")}]),
        dict(name="CS Basic · Python", hw="In class", rooms=(213, 127), rows=[{"SAT": ("630-830pm", "on")}]),
        dict(name="CS Contest 1 · CCC Junior", hw="In class", rooms=(127, 213), rows=[{"SAT": ("1130-130pm", "both")}]),
        dict(name="CS Contest 2 · CCC Junior", hw="In class", rooms=(127, 213),
             rows=[{"SAT": ("915-1115am", "on")}, {"SAT": ("200-400pm", "off")}]),
        dict(name="CS Contest 3 · CCC Senior", hw="In class", rooms=(213, 127), rows=[{"SAT": ("915-1115am", "both")}]),
        dict(name="CS Contest 4 · CCC Senior", hw="In class", rooms=(213, 127), rows=[{"SAT": ("1130-130pm", "both")}]),
    ]),
]
# the rooms a class may meet in when its own are taken, in order: classrooms first, then the others that can teach
SPARE = (233, 229, 239, 243, 219, 129, 139, 211, 213, 127)


def span(t):
    """'645-845pm' -> (start, end) in minutes after midnight; the am/pm is the end's, the start is in the same half-day
    unless that would put it after the end ('1130-130pm' starts at 11:30)."""
    m = re.fullmatch(r"(\d{3,4})-(\d{3,4})(am|pm)", t)
    a, b, ap = m.group(1), m.group(2), m.group(3)
    h1, m1, h2, m2 = int(a[:-2]), int(a[-2:]), int(b[:-2]), int(b[-2:])
    if ap == "pm" and h2 < 12: h2 += 12
    if ap == "pm" and h1 < 12 and (h1 + 12) * 60 + m1 <= h2 * 60 + m2: h1 += 12
    return h1 * 60 + m1, h2 * 60 + m2


def show(t):
    """'645-845pm' -> '6:45–8:45 pm'; '1130-130pm' -> '11:30–1:30 pm'"""
    s, e = span(t)
    def hm(x): h = x // 60 % 12 or 12; return "%d:%02d" % (h, x % 60)
    return "%s–%s %s" % (hm(s), hm(e), "pm" if e >= 12 * 60 else "am")


def slots():
    """every time a class meets: (group, class, row, day, time, mode)"""
    for g in GROUPS:
        for c in g["classes"]:
            for i, row in enumerate(c["rows"]):
                for d in DAYS:
                    if d in row: yield g, c, i, d, row[d][0], row[d][1]


def rooms():
    """the room for each class meeting in a room: {(class name, row, day): room number}. A class keeps one room where it
    can; two never share a room at the same time."""
    taken, out = {}, {}                    # taken[(day, room)] = [(start, end), ...]
    def free(d, r, s, e): return all(e <= s0 or s >= e0 for s0, e0 in taken.get((d, r), []))
    for g, c, i, d, t, mode in slots():
        if mode == "off": continue
        s, e = span(t)
        mine = [out[k] for k in out if k[0] == c["name"]]
        for r in list(dict.fromkeys(mine + list(c["rooms"]) + list(SPARE))):
            if free(d, r, s, e):
                taken.setdefault((d, r), []).append((s, e)); out[(c["name"], i, d)] = r; break
        else:
            raise SystemExit("no room for %s %s %s" % (c["name"], d, t))
    return out


def data():
    """the timetable for the demo's boards: groups of classes, each row a list of five cells (one a day) [time, room],
    room 0 online, room -n in room n and online at once; with the homework classes"""
    R, G = rooms(), []
    for g in GROUPS:
        cl = []
        for c in g["classes"]:
            rows = []
            for i, row in enumerate(c["rows"]):
                cells = []
                for d in DAYS:
                    if d not in row: cells.append(None); continue
                    t, mode = row[d]
                    cells.append([show(t), 0 if mode == "off" else (R[(c["name"], i, d)] * (-1 if mode == "both" else 1))])
                rows.append(cells)
            hw = c["hw"] if c["hw"] == "In class" else HW_ONLINE.format(show(c["hw"]))
            cl.append(dict(name=c["name"], hw=hw, rows=rows))
        G.append(dict(name=g["name"], classes=cl))
    return dict(term=TERM, days=list(DAYS), groups=G)


if __name__ == "__main__":
    R = rooms(); n = {"on": 0, "off": 0, "both": 0}
    for g, c, i, d, t, mode in slots():
        n[mode] += 1
        print("%-34s %s %-16s %-5s %s" % (c["name"], d, show(t), mode, R.get((c["name"], i, d), "online")))
    print("in the room %d, online %d, both %d; %d classes" % (n["on"], n["off"], n["both"], sum(len(g["classes"]) for g in GROUPS)))
    busy = {}
    for (name, i, d), r in R.items(): busy.setdefault(r, set()).add(name)
    for r in sorted(busy): print(r, ", ".join(sorted(busy[r])))
