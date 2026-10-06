# Arcadia's rooms as Gaussian splats

Jim, 6 Oct 2026: "try to use gaussian splatting if possible. I heard it is pretty good for real experience?" and
"maybe show me something gaussian splatting can do first, then we can move ahead?"

A Gaussian splat is a cloud of soft, coloured, see-through blobs fitted to many pictures of a place. A browser draws
it in real time, so a visitor can stand in the room and look and step about, and the room looks as the path tracer
drew it: the light, the soft shadows, the plants, the paintings. The page is [`palace/splat/`](../../splat/)
(drawn by [Spark](https://sparkjs.dev), MIT, in `palace/splat/lib/`; three.js is the walk's copy in
`palace/walk/lib/`).

## How a room is made

1. **Views.** [`splat_views.py`](../../tools/render/splat_views.py) builds the room from the same scripts as the stills
   and path-traces it from a rig of cameras round the room's 360 stop: 13 places within 2.4 m of it at three heights
   (1.4, 1.6 and 1.85 m), each looking all round at 45° steps, up (38°) and down (−34°) four ways, and once near
   straight up and near straight down: 234 views (the test rig: one place, 12 views). No glow or vignette, and one
   grading curve for all, so every view agrees. It writes the poses in a nerfstudio `transforms.json`, and the cloud
   to start from: through random pixels of every view a ray goes out to the first surface it meets (glass lets it
   through) and a point is put there in that pixel's colour; rays that go out through the windows end on a far
   sphere (260 m), the sky and the plain.

       bvenv/bin/python blend/splat_views.py bedroom gs/demo_bedroom 640 360 24 -0.2 --rig full --spread 2.4 --points 360000

2. **Fitting.** [OpenSplat](https://github.com/pierotofy/OpenSplat) (AGPL-3.0, used as a tool, not shipped) fits the
   splat. The render machines have no graphics card, so it is built for the CPU against LibTorch and OpenCV from
   conda-forge: [`splat_tools.sh`](../../tools/render/splat_tools.sh) builds it all (about 15 minutes). On a CPU it is
   about a hundred times slower than on a graphics card, so the views are kept small (640 x 360) and the fitting
   short. This OpenSplat steps its optimizer on every view only while it is still adding blobs (`--densify-until`),
   and after that only every 32nd or 64th view, so a short fitting keeps adding until near its end; it resets the
   blobs' opacity every 3000 steps, which then needs some hundreds of steps to recover, so `-n` should not end just
   after a multiple of 3000.

       opensplat palace/blender/splats/bedroom -n 4000 --densify-until 3900 --sh-degree 2 --max-gaussians 1200000 -o gs/bedroom.ply

3. **Publishing.** [`splat_publish.py`](../../tools/render/splat_publish.py) writes the fitted splat as `.spz`
   (compressed, about a tenth of the `.ply`) into `palace/splat/data/`, and lists the room in
   `palace/splat/data/rooms.json` with where its rig stood (`centre`, in the design's metres), how far you may step
   from it (`reach`) and which way you face first (`yaw0`).

       python3 blend/splat_publish.py palace/blender/splats/bedroom gs/bedroom.ply bedroom

## What is kept here

For each room: `transforms.json`, `points.ply` and the graded `images/`, enough to fit the splat again (longer, or on
a graphics card). The fitted splat itself is `palace/splat/data/<room>.spz`.
