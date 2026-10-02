#!/usr/bin/env python3
"""Run render jobs one after another from blend/queue_<lane>.txt: one shell command per line, run from the
scratchpad. A job that succeeds is taken off the list; one that fails is logged in blend/failed_<lane>.txt and taken
off too. Lines can be added or reordered at any time; when the list is empty the runner waits for more. After a
restart, start the runners again: every job skips the pictures (and the bands of 360s) it has already made.
  python3 blend/runner.py <lane>"""
import os, subprocess, sys, time
lane = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
q = os.path.join(here, "queue_%s.txt" % lane); log = os.path.join(here, "log_%s.txt" % lane)
def jobs():
    return [l.strip() for l in open(q).read().splitlines() if l.strip() and not l.strip().startswith("#")] if os.path.exists(q) else []
while True:
    js = jobs()
    if not js: time.sleep(20); continue
    job = js[0]
    with open(log, "a") as f: f.write("JOB %s %s\n" % (time.strftime("%H:%M"), job))
    r = subprocess.call("nice -n 5 %s >> %s 2>&1" % (job, log), shell=True, cwd=root)
    cur = open(q).read().splitlines(); out = []; gone = False
    for l in cur:
        if not gone and l.strip() == job: gone = True; continue
        out.append(l)
    open(q, "w").write("\n".join(out) + ("\n" if out else ""))
    with open(log, "a") as f: f.write("%s %s %s\n" % ("DONE" if r == 0 else "FAILED(%d)" % r, time.strftime("%H:%M"), job))
    if r != 0: open(os.path.join(here, "failed_%s.txt" % lane), "a").write(job + "\n")
