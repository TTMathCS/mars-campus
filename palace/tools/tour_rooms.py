"""Write palace/tour/rooms.js: the Crown's rooms for the tour's map (the ring, a line between rooms, a dot in each),
from the room program. Run after changing room_program.py (gen_plan.py runs it too).
  python3 palace/tools/tour_rooms.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import room_program as RP

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "tour", "rooms.js")
R_IN, R_GL, R_OUT = 115.0, 118.5, 135.0          # the Crown of revision H: inner wall, the Glide's edge, outer wall


def main():
    rooms = [dict(code=r["code"], name=r["name"], b0=r["at"][0], b1=r["at"][1], stop=r.get("seen")) for r in RP.CROWN if not r.get("up")]
    data = dict(crown=dict(r_in=R_IN, r_gl=R_GL, r_out=R_OUT, rooms=rooms))
    js = ("// made by palace/tools/tour_rooms.py from room_program.py: the Crown's rooms for the tour's map\n"
          "window.TOUR_ROOMS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    open(OUT, "w", encoding="utf-8").write(js); print("rooms.js", len(rooms), "rooms")


if __name__ == "__main__":
    main()
