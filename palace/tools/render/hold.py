"""Hold the render queue while blend/hold.flag exists, for at most N seconds (default 1800): time to look at quick
previews before the long jobs behind them start. It renders nothing, so it never runs alongside a render.
  python3 blend/hold.py [N]"""
import os, sys, time
here = os.path.dirname(os.path.abspath(__file__)); flag = os.path.join(here, "hold.flag")
t0 = time.time(); lim = float(sys.argv[1]) if len(sys.argv) > 1 else 1800.0
while os.path.exists(flag) and time.time() - t0 < lim: time.sleep(5)
