# Notes for AI agents

Start with [HANDOFF.md](HANDOFF.md): project status, the decisions with the owner (Jim), how to build and
test each demo, and how he likes to work. Requirements for each demo live in its folder's `REQUIREMENTS.md`.
Publishing is a push to `main` (GitHub Pages).

## Jim's global rules (always, every page and every session)

- **Separate pages and files.** Never pile everything onto one page or into one file. Give each topic its own page,
  and split a big topic into nested subpages (Mars facts → surface, inside, weather, space, resources, hazards…). A
  hub page stays short: an intro and links to its subpages. Shared styles and scripts go in their own files; docs
  are several short files. Jim, 2 Oct 2026: "I would like to separate things into different pages/files … please
  keep this as global rule."
- **Renders run at most two at a time** (Jim, 4 Oct 2026: "render too slow, maybe 2 at a time"; before, 2 Oct: "don't
  run in parallel since if hit limit and restarted, all processes could be gone"). A session's machine has 4 cores and
  one Cycles render uses all of them, so the second render goes to a second machine (a second cloud session with its
  own queue), not beside the first; each queue keeps its jobs in a file and skips what is already done.
- **Design before drawing.** Every room gets a code (L1-01, C-10, O-07 …), a purpose, a second use where it can,
  a place and a size in the room program (`palace/tools/room_program.py`) before any picture of it is made, and the
  pictures follow the plan. Two of a kind only when each has its own job. Jim, 2 Oct 2026: "I like you to design it
  and plan it well before draw the images"; "it is OK to have duplicates but just need to design well as long as
  they could be used for multiple purpose".
- **No notes for visitors on the pages**: no "how to move", no "what's real", no status, review or "in progress"
  notes; the 3D views carry their own hints. Keep such notes in the docs (README, HANDOFF). Jim, 3 Oct 2026: "I hate
  all this kinds of notes, just garbage shows on the page ... You can keep those for your memory to save somewhere
  else you know, but not on the pages for users/visitors".
- The homepage shows **a city rising on Mars**, one card per place (demo 1 the TTMath campus, demo 2 **Arcadia**,
  Jim's home on Mars), never more, and **never says "demo"** (Jim, 3 Oct 2026). Arcadia is not called a house. The
  science has its own section and pages.
- **Only the `main` branch, no other branches** (Jim, 3 Oct 2026: "actually I only need main branch and no other
  branches"), and **push each step as soon as it is checked**, not all at the end ("merge in the middle as well so I
  can view the changes and steer the direction").
- It must **look real**, never cartoon. Push to `main` only.
- **Keep every original design file**, so any picture can be made again or improved later: the scene scripts in
  `palace/tools/render/`, a Blender file (`.blend`) of every scene with its cameras and render settings, and the
  textures, models and skies they use, all in `palace/blender/` (the archive; its README says how to open and
  re-render). Save the scene's Blender file whenever its pictures are published or replaced; never leave a design
  file only in a session's scratchpad. Jim, 4 Oct 2026: "can you put original files somewhere so we can reproduce or
  improve later? just archives all those original design files"; "please keep this rule in the memory so I need to
  keep all design original docs".
- **Furniture fits the rooms, and every plant is chosen.** Seating is sized to the room it is in: long designed sofas
  along the walls, deep sectionals, daybeds, built-in banquettes; never small chairs (dining chairs at a table are
  upholstered and generous). Each room has its own plants, chosen for it and planned in the furnishing program
  (`palace/tools/furnishing.py`): all kinds, all colours (red and orange maples, ginkgo, ferns, palms, orchids,
  bougainvillea, agave …), in planters sized to them; never one pot plant repeated everywhere. Jim, 4 Oct 2026: "I hate
  those small chairs"; "make them proportional the furniture be proportional to the size of the room"; "all the plants
  so far … are same, and looks strange … it should includes all kinds of plants, different colors like maple leaves".
- **Pictures match the earlier ones' tone**: true blacks, real contrast, never washed out (measure them against
  hero, library, salon and dining; `grade.py`). Jim, 4 Oct 2026: "new ones are bit too bright and looks more not
  real".
