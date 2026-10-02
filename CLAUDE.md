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
- **Renders run one at a time**, in one queue, never in parallel: a restart kills every running process and wastes
  the work. Jim, 2 Oct 2026: "don't run in parallel since if hit limit and restarted, all processes could be gone".
- **Design before drawing.** Every room gets a code (L1-01, C-10, O-07 …), a purpose, a second use where it can,
  a place and a size in the room program (`palace/tools/room_program.py`) before any picture of it is made, and the
  pictures follow the plan. Two of a kind only when each has its own job. Jim, 2 Oct 2026: "I like you to design it
  and plan it well before draw the images"; "it is OK to have duplicates but just need to design well as long as
  they could be used for multiple purpose".
- The homepage has **one card per demo**, never more; the science has its own section and pages.
- It must **look real**, never cartoon. Push to `main` only.
