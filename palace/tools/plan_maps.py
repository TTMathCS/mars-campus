"""Where each room is: the whole floor plan of its level (floor plans Rev G, palace/plans/svg/), with the room shaded.
  python3 palace/tools/plan_maps.py      -> palace/design/img/plan/<name>.jpg
The maps and their rooms' codes come from gen_plan.py (each room's codes=..., each area's plan_codes=...); the shapes
from palace/plans/shapes.json (draw_plans.py). The sheet is never cropped (Jim, 2 Oct 2026: "the L1 floor plan
doesn't show full"); a click on the design plan's page enlarges it. Needs Playwright with Chromium (see HANDOFF)."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
TOOLS = os.path.dirname(os.path.abspath(__file__)); PAL = os.path.dirname(TOOLS)
OUT = os.path.join(PAL, "design", "img", "plan"); PLANS = os.path.join(PAL, "plans")
sys.path.insert(0, TOOLS)
import gen_plan as G
WIDTH = 1400                     # pixels across, as before
CHROME = os.environ.get("CHROME") or next((p for p in ("/opt/pw-browsers/chromium-1194/chrome-linux/chrome",) if os.path.exists(p)), None)


def jobs():
    """(file name, sheet, codes) for the area maps and every room map the design plan shows"""
    out = []
    for area in G.AREAS:
        items = [(area["plan"][0], area.get("plan_codes"))] + [((r.get("plan") or (None,))[0], r.get("codes")) for r in area["rooms"]]
        for src, codes in items:
            if not (src and src.startswith("img/plan/") and codes): continue
            sheets = {G.sheet_of(c) for c in codes}
            assert len(sheets) == 1, (src, codes)
            out.append((os.path.basename(src), sheets.pop(), codes))
    return out


def shaded(sheet, codes, shapes):
    """the sheet's SVG with the rooms' polygons laid over it in orange"""
    svg = open(os.path.join(PLANS, "svg", sheet + ".svg"), encoding="utf-8").read()
    polys = [poly for c in codes for poly in shapes[sheet]["shapes"][c]]
    over = "".join('<polygon points="%s" fill="#E86228" fill-opacity="0.47" stroke="#C44010" stroke-width="3.2" stroke-linejoin="round"/>'
                   % " ".join("%.1f,%.1f" % (x, y) for x, y in poly) for poly in polys)
    return svg.replace("</svg>", over + "</svg>")


async def main():
    shapes = json.load(open(os.path.join(PLANS, "shapes.json"), encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
        for name, sheet, codes in jobs():
            w, h = shapes[sheet]["w"], shapes[sheet]["h"]
            pg = await b.new_page(viewport={"width": w, "height": h}, device_scale_factor=WIDTH / w)
            await pg.set_content('<!doctype html><html><body style="margin:0">%s</body></html>' % shaded(sheet, codes, shapes))
            path = os.path.join(OUT, name)
            await (await pg.query_selector("svg")).screenshot(path=path, type="jpeg", quality=88)
            await pg.close(); print("wrote", os.path.relpath(path, PAL), sheet, " ".join(codes))
        await b.close()


if __name__ == "__main__":
    asyncio.run(main())
